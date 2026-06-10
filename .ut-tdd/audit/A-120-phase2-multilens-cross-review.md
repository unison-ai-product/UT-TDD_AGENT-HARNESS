# A-120 Phase 2 Multi-Lens Cross-Review (Claude Code / 共通化 / マルチ協調)

Date: 2026-06-09
Gate: GATE-A 補強レビュー (Codex 観点に加える 3 レンズ)
Reviewer: Claude Opus (PM) + 3 並列 subagent (pmo-sonnet ×2 / code-reviewer ×1)
**Verdict: 設計は PASS (3 レンズとも L4-L6 設計は coherent)。ただし実装で actionable 2 件 + DRY/協調 carry。** Phase 2 設計凍結を覆す blocker は無いが、Codex 観点が見逃した実バグを検出 (多角レビューの value)。

## 観点1: Claude Code runtime — CONCERN (Critical 1)

- hook lifecycle (fail-close guard / fail-open session-log)、runtime adapter (claude first-class / claude-only 動作)、mode 分離、Windows ネイティブ は設計通り PASS。
- **[Critical-impl] recordGuardFire signature mismatch + guard が typecheck 対象外**:
  - `.claude/hooks/agent-guard.ts:73` が `recordGuardFire(passedKind, deps)` と **string** を渡すが、`src/runtime/agent-slots.ts:215` は `recordGuardFire(input: RecordGuardFireInput, deps)` = **object** を期待。runtime で `const { agentKind } = input` が `undefined` になり slot が agent_kind 欠落で記録される。
  - guard の **pass/block 判定は無影響** (try/catch fail-open、IMP-050 助言部のみ)。ただし agent-slots telemetry (doctor stale-slot / peak_parallel surface) が誤値になる。
  - **meta-gap**: `tsconfig.json` の `include: ["src","tests"]` に `.claude/hooks/` が無く、**fail-close guard の entrypoint が typecheck/test の外**。typecheck green でも本不整合を捕捉できない (CI blind spot)。
  - 修正: hook を `recordGuardFire({ agentKind: passedKind }, deps)` に + `.claude/hooks` を typecheck 対象へ (または hook 用 typecheck pass を追加)。

## 観点2: 共通化 / DRY — needs-refactor (Important 5)

- アーキ骨格 (`analyzeX` 純関数 + `loadX` I/O 分離、doctor catch の warn-first/hard 意図コメント) は 90%+ 一貫で良好。
- **[Important] I-3 `hasReviewEvidence` が不整合に重複**: `review-evidence.ts:71` (`review_evidence:` 直後に `- reviewer:` 隣接要求) vs `l6-completion.ts:52` (2 独立 match、位置自由)。**判定が食い違う入力が存在** → l6-completion と review-evidence(hard gate) が齟齬を起こしうる。export 済の前者へ統一推奨。
- **[Important] その他重複**: `fmValue` ×5 (`scrum-reverse` のみ inline コメント吸収の微差)、`normalizePath/sourceModule/importedSourceModule/lineOf` が coding-rules↔ddd-tdd-rules で完全重複 (+ DISALLOWED import テーブルの差分が意図不明)、DbC table RE ×2 (l6-completion/l6-fr-coverage)、`HERE/ROOT` 自前解決 ×5 (repoRoot 注入を無視)。`src/lint/_utils` (frontmatter / ts-utils / plan-utils) へ集約推奨。
- **[Minor] ハードコードの根拠コメント欠落**: `readability.PM_REVIEW_PLAN_PATHS` (L5 4件)、`l6-fr-coverage.requiresSubstanceMarker` (3件) に理由注記なし (CLAUDE.md「ハードコードは慎重に」MUST)。
- 皮肉: ddd-tdd の domain-boundary lint はあるが intra-lint 重複は検出しない。

## 観点3: マルチエージェント協調 — CONCERN (Important 3)

- worker/reviewer 分離 (same_model_approval forbidden / naive_self_review block / cross_agent worker≠reviewer)、並列/直列 (mustSerialize 3 条件 / 上限8 / fail-open)、back-fill pairing は設計〜実装まで PASS。
- **[Important] hybrid 協調の本体未実装 (carry)**: `src/team/run.ts` は `validateTeamRun` のみで、member ごとに別 runtime (Codex) を実 fork する委譲パスが無い。hybrid 協調が「形式先行・実体 carry」。
- **[Important] claude-only で cross_agent 記録を mode で塞いでいない**: doctor `crossReviewViolations` は cross_agent+worker≡reviewer を弾くが、**claude-only 環境で cross_agent 証跡を記録する行為自体を mode で禁じていない**。後日 hybrid 再検証なしに gate pass に使われるリスク。→ doctor に mode×review_kind 整合チェック (U-MXREVIEW 候補)。
- **[Important] worker_model omit で cross_agent 僭称**: worker roster 自動解決が defer のため `worker_model` 手書き依存。schema で `worker_model` required 化を carry 推奨。
- **[Important] drive 招集の設計実体が無い**: 「どの専門職/agent を招集するか」は FR-L1-40/41 (`resolveDriveStatePartition`/`classifyDrive`) が `explicit_l7_defer`、設計 doc 実体なし。`setup-solo-team.md` は solo/team の GitHub 出し分けで別関心。L7 で role 招集設計を先に凍結すべき。
- [Minor] stale slot 可視化は `listStaleSlots` doctor stub 待ちで実効なし。

## 総合判断

- **L4-L6 設計凍結 (GATE-A) は維持**: 3 レンズとも設計の coherence は確認。検出物は ① 実装バグ 1 (recordGuardFire + typecheck blind spot) ② DRY tech-debt ③ 協調の未実装/hardening carry であり、設計層を reopen しない。
- **多角レビューの value**: Codex 観点 (artifact substance / HELIX cutover) では出なかった Claude Code hook バグ・intra-lint DRY 乖離・mode×review_kind 穴を検出。GATE-A の PO accept 前に下記を処理推奨。

### 推奨アクション
| 項目 | 重度 | 対応 |
|---|---|---|
| recordGuardFire 引数 object 化 + `.claude/hooks` を typecheck 対象へ | Critical-impl | 即修正推奨 (guard entrypoint の CI 可視化) |
| hasReviewEvidence を export 版へ統一 | Important | 即修正推奨 (gate 齟齬防止) |
| lint 共通 util 集約 (fmValue/ts-utils/plan-utils/DbC RE) + hardcode 根拠注記 | Important/Minor | refactor carry (IMP 化) |
| mode×review_kind 整合 doctor check / worker_model required / team run 実委譲 / drive 招集 L7 設計 | Important | 協調 carry (L7/hardening、IMP 化) |
