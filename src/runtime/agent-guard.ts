/**
 * UT-TDD subagent guard — 純粋判定ロジック (ADR-001 / .claude/CLAUDE.md Guard Rules)。
 *
 * Claude Code の Agent (subagent) 呼び出しを fail-close で統制する:
 *   1. subagent_type 未指定 (general-purpose default 経路) を block
 *   2. 許可リスト外 subagent を block
 *   3. model 無指定を block (明示必須 → 親 Opus 継承による週次上限消費の事故を防ぐ)
 *   4. subagent ごとに frontmatter で固定された model family を override する呼び出しを block
 *
 * HELIX 由来の bash + python3 hook を環境非依存の TS に再実装したもの
 * (Windows ネイティブで bash/python3 が無く guard が効かない問題の解消)。
 * 本モジュールは I/O を持たない純粋関数。stdin / fs アクセスは
 * .claude/hooks/agent-guard.ts (shim) が注入する。
 */

export type ModelFamily = "haiku" | "sonnet" | "opus";

/** Agent tool 呼び出しに許可された subagent_type (PMO 9 + PdM 3 + review 3 = 15)。 */
export const SUBAGENT_ALLOWLIST: ReadonlySet<string> = new Set([
  "pmo-sonnet",
  "pmo-haiku",
  "pmo-helix-explorer",
  "pmo-helix-scout",
  "pmo-project-explorer",
  "pmo-project-scout",
  "pmo-tech-docs",
  "pmo-tech-fork",
  "pmo-tech-news",
  "pdm-tech-innovation",
  "pdm-marketing-innovation",
  "pdm-innovation-manager",
  "code-reviewer",
  "security-audit",
  "qa-test",
]);

export interface AgentGuardInput {
  tool_name?: string;
  tool_input?: {
    subagent_type?: string;
    model?: string;
  } | null;
}

/** subagent definition (.claude/agents/<name>.md) の model family 解決結果。 */
export type ResolvedFamily = ModelFamily | "missing" | "unknown";

export interface AgentGuardContext {
  /** subagent definition frontmatter の model family を解決する (fs は shim が担当)。 */
  resolveAgentFamily: (subagentType: string) => ResolvedFamily;
  /** UT_TDD_ALLOW_RAW_AGENT=1 等の bypass 有効フラグ。 */
  allowRaw: boolean;
}

export interface GuardDecision {
  /** プロセス exit code。0=pass, 2=block。 */
  code: 0 | 2;
  /** stderr に出すメッセージ (block 理由 or bypass warn)。 */
  message?: string;
  /** block を bypass して allow した場合 true。 */
  bypassed?: boolean;
}

/**
 * model 文字列 (family 名 "sonnet" or Anthropic id "claude-sonnet-4-6") を family に正規化。
 * 判定不能 (該当なし) と曖昧 (複数 family 名を含む病的文字列) はいずれも null = fail-close。
 * `\b` 境界で token 一致させ、id 内の `-` 区切りにも対応する。
 */
export function normalizeModelFamily(raw: string | null | undefined): ModelFamily | null {
  if (!raw) return null;
  const hits: ModelFamily[] = [];
  if (/\bhaiku\b/i.test(raw)) hits.push("haiku");
  if (/\bsonnet\b/i.test(raw)) hits.push("sonnet");
  if (/\bopus\b/i.test(raw)) hits.push("opus");
  return hits.length === 1 ? hits[0] : null;
}

const BYPASS_HINT =
  "正当理由がある場合は UT_TDD_ALLOW_RAW_AGENT=1 を設定し、理由を会話/final report に記録してください。";

const ALLOWLIST_TEXT = [...SUBAGENT_ALLOWLIST].join(" ");

/**
 * Agent guard 判定。`tool_name !== "Agent"` は対象外 (pass)。
 * block 条件に当たっても `allowRaw` なら warn して pass (bypass)。
 */
export function evaluateAgentGuard(input: AgentGuardInput, ctx: AgentGuardContext): GuardDecision {
  if (input.tool_name !== "Agent") return { code: 0 };

  const ti = input.tool_input ?? {};
  const subagentType = (ti.subagent_type ?? "").trim();
  const model = (ti.model ?? "").trim();

  const blockOrBypass = (message: string): GuardDecision =>
    ctx.allowRaw
      ? {
          code: 0,
          bypassed: true,
          message: `[ut-tdd-guard] WARN: UT_TDD_ALLOW_RAW_AGENT=1 で bypass。\n${message}`,
        }
      : { code: 2, message };

  // 1. subagent_type 未指定 (= general-purpose 等の default 経路) を block
  if (!subagentType) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: Agent 呼び出しに subagent_type がありません。\n許可: ${ALLOWLIST_TEXT}\n${BYPASS_HINT}`,
    );
  }

  // 2. 許可リスト判定
  if (!SUBAGENT_ALLOWLIST.has(subagentType)) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: subagent_type=${subagentType} は許可リスト外です。\n` +
        `許可: ${ALLOWLIST_TEXT}\n` +
        `be-*/db-schema/devops-deploy/general-purpose 等は Codex 委譲 (ut-tdd codex --role ...) 経由。\n${BYPASS_HINT}`,
    );
  }

  // 3. definition から許可 model family を解決
  // missing / unknown は「リポジトリ整合異常」であり allowRaw でも bypass しない (直接 block)。
  const family = ctx.resolveAgentFamily(subagentType);
  if (family === "missing") {
    return {
      code: 2,
      message: `[ut-tdd-guard] BLOCK: .claude/agents/${subagentType}.md が見つかりません (リポジトリ整合異常)。`,
    };
  }
  if (family === "unknown") {
    return {
      code: 2,
      message:
        `[ut-tdd-guard] BLOCK: ${subagentType} の frontmatter から model family を判定できません。` +
        `model: に sonnet / haiku / opus を設定してください。`,
    };
  }

  // 4. model 明示必須 (STRICT: 無指定は親 Opus 継承の事故源 → block)
  if (!model) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: subagent_type=${subagentType} 呼び出しに model がありません。\n` +
        `model 無指定は親モデル (Opus) を継承し週次上限を消費するため禁止です。\n` +
        `model: "${family}" を明示してください。\n${BYPASS_HINT}`,
    );
  }

  // 5. 明示 model の family 検証 (frontmatter で固定された family の override 禁止)
  const requested = normalizeModelFamily(model);
  if (requested === null) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: model=${model} を haiku / sonnet / opus に正規化できません。`,
    );
  }
  if (requested !== family) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: model override を検出しました。\n` +
        `  subagent_type: ${subagentType}\n` +
        `  frontmatter で許可される family: ${family}\n` +
        `  呼び出しで指定された model: ${model} (family: ${requested})\n` +
        `subagent ごとに固定された model を override する呼び出しは block します ` +
        `(${requested} = opus が必要なら opus frontmatter を持つ pdm-* 系を使う)。\n${BYPASS_HINT}`,
    );
  }

  return { code: 0 };
}
