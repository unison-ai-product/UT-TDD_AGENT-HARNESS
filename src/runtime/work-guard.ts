/**
 * Work guard (PLAN-L7-114) — PreToolUse(Edit|Write|MultiEdit) の作業衝突ガードレール。
 *
 * hybrid 多ランタイム (Claude ↔ Codex) では working tree を双方が同時に書き換える。
 * doc 規律「相手のファイルに触れない」だけでは盲目的なクロバー (互いの未コミット成果の
 * 上書き) を防げなかった (実際に surface.ts / PLAN を相互 adopt して衝突した)。本ガードは
 * その機械強制: **このセッションが触っていない uncommitted ファイル (= 他ランタイムの
 * in-flight 成果と推定) への Edit/Write を block** し、意図的な編集は override (+evidence)
 * を要求する。これにより「相手の成果の上に積む / 触る前に確認」を機械で担保する。
 *
 * 判定本体は純関数。git / session-log / env の I/O は hook 側 (.claude/hooks/work-guard.ts)。
 */

export interface WorkGuardInput {
  /** 編集対象 (repo-relative, forward-slash 正規化済)。 */
  targetPath: string;
  /** git 上の uncommitted パス群 (modified + untracked、repo-relative 正規化済)。 */
  uncommittedFiles: string[];
  /** このセッションが既に touch した (= 自分の作業) パス群 (正規化済)。 */
  sessionTouchedFiles: string[];
  /** override env (UT_TDD_ALLOW_FOREIGN_EDIT=1) が立っているか。 */
  bypass: boolean;
}

export interface WorkGuardResult {
  decision: "pass" | "block";
  /** 機械判定理由 (ledger / surface 用の安定キー)。 */
  reason: "bypass" | "foreign-uncommitted" | "clean-or-own" | "no-target";
  /** 人間向けメッセージ (block 時のみ非空)。 */
  message: string;
}

/**
 * Windows 絶対パス / バックスラッシュ / repoRoot 接頭辞を repo-relative forward-slash へ正規化。
 * git porcelain と Claude tool_input.file_path の表記差を吸収する (NFR-01 cross-platform)。
 */
export function normalizeRepoRelative(path: string, repoRoot: string): string {
  const unify = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "");
  const target = unify(path.trim());
  const root = unify(repoRoot.trim());
  if (root) {
    // session-log の target は "Write c:\\...\\repo\\src\\x.ts" のように tool 名プレフィックス +
    // 絶対パスで記録される。startsWith では prefix で外れるため、repoRoot を **部分一致** で探し、
    // その直後から repo-relative を取る (裸の絶対パスは idx=0 で従来と同一挙動 = 後方互換)。
    const idx = target.toLowerCase().indexOf(`${root.toLowerCase()}/`);
    if (idx >= 0) {
      return target.slice(idx + root.length + 1);
    }
  }
  return target.replace(/^\.\//, "");
}

/**
 * 作業衝突を評価する純関数。
 *
 * block 条件: target が uncommitted (他者 or 既存の未コミット変更) **かつ** このセッションが
 * 未 touch (= 自分が作った/触った形跡が無い = 他ランタイムの in-flight と推定) **かつ** 未 bypass。
 * 自分が今セッションで作成/編集中のファイル (session-touched) や、クリーンな (uncommitted でない)
 * ファイルへの編集は pass する (誤検知で自分の作業を止めない)。
 */
export function evaluateWorkGuard(input: WorkGuardInput): WorkGuardResult {
  if (!input.targetPath) {
    return { decision: "pass", reason: "no-target", message: "" };
  }
  if (input.bypass) {
    return { decision: "pass", reason: "bypass", message: "" };
  }
  const uncommitted = new Set(input.uncommittedFiles);
  const touched = new Set(input.sessionTouchedFiles);
  if (uncommitted.has(input.targetPath) && !touched.has(input.targetPath)) {
    return {
      decision: "block",
      reason: "foreign-uncommitted",
      message:
        `[ut-tdd-work-guard] BLOCK: ${input.targetPath} はこのセッションが触っていない uncommitted ファイルです` +
        ` (他ランタイムの in-flight 成果の可能性)。盲目的に編集すると相手の未コミット成果をクロバーします。` +
        ` git log / git status で出所を確認し、相手の commit の上に積む / 自分の意図ファイルのみ編集すること。` +
        ` 意図的に編集する場合のみ UT_TDD_ALLOW_FOREIGN_EDIT=1 (理由を記録) で override。`,
    };
  }
  return { decision: "pass", reason: "clean-or-own", message: "" };
}
