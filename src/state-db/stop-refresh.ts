import { homedir } from "node:os";
import { join } from "node:path";
import { defaultHarnessDbPath, openHarnessDb } from "./index";
import { migrate } from "./migration";
import { projectModelEvaluations, projectTokenUsage, rebuildHarnessDb } from "./projection-writer";
import { loadRuntimeSessionUsage } from "./token-tracker";

export interface StopRefreshResult {
  ok: boolean;
  rebuilt: boolean;
  tokenRunsIngested: number;
  /** ok=false のときの skip 理由 (fail-open: 例外は握って理由へ落とす)。 */
  skippedReason?: string;
}

export interface StopRefreshOptions {
  repoRoot: string;
  /** token ingest の走査対象 (test 注入用)。未指定は telemetry scan と同じ OS default。 */
  claudeSessionsDir?: string;
  codexSessionsDir?: string;
  /** token ingest 自体を止める (rebuild のみ)。 */
  skipTokenIngest?: boolean;
}

/**
 * Stop hook 駆動の on-disk harness.db currency 維持 (PLAN-L7-365 Step 2、issue #78)。
 *
 * - persisted harness.db を決定的に full rebuild し、他ランタイム merge 由来の
 *   plan registry stale (db-currency violation) を session 境界で自動収束させる。
 * - token/cost ingest (`telemetry scan` 相当) を統合し、別コマンド依存を解消する。
 * - fail-open: rebuild/ingest のどんな失敗 (DB lock 含む) も session 終了を妨げない。
 *   doctor は read-only のまま (自動修復は doctor でなく Stop 境界に置く設計判断)。
 */
export function refreshHarnessDbOnStop(options: StopRefreshOptions): StopRefreshResult {
  const { repoRoot } = options;
  let rebuilt = false;
  let tokenRunsIngested = 0;
  try {
    const rebuild = rebuildHarnessDb({ repoRoot });
    rebuilt = rebuild.ok;
    if (!rebuild.ok) {
      return { ok: false, rebuilt, tokenRunsIngested, skippedReason: "rebuild-failed" };
    }
  } catch (error) {
    return {
      ok: false,
      rebuilt,
      tokenRunsIngested,
      skippedReason: `rebuild-error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (options.skipTokenIngest === true) {
    return { ok: true, rebuilt, tokenRunsIngested };
  }

  try {
    const claudeDir =
      options.claudeSessionsDir ??
      process.env.UT_TDD_CLAUDE_SESSIONS_DIR ??
      join(homedir(), ".claude", "projects");
    const codexDir =
      options.codexSessionsDir ??
      process.env.UT_TDD_CODEX_SESSIONS_DIR ??
      join(homedir(), ".codex", "sessions");
    const usages = loadRuntimeSessionUsage({ claudeDirs: [claudeDir], codexDirs: [codexDir] });
    const db = openHarnessDb(defaultHarnessDbPath(repoRoot), { repoRoot });
    try {
      migrate(db);
      projectTokenUsage(db, usages);
      projectModelEvaluations(db, repoRoot);
    } finally {
      db.close();
    }
    tokenRunsIngested = usages.length;
  } catch (error) {
    // rebuild は成功済みなので currency は回復している。ingest 失敗のみ理由付きで報告。
    return {
      ok: false,
      rebuilt,
      tokenRunsIngested,
      skippedReason: `token-ingest-error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  return { ok: true, rebuilt, tokenRunsIngested };
}
