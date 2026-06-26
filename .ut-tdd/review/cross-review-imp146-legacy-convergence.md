# DESK REVIEW 依頼 (cross-review, role=tl) — IMP-146 legacy debt 2 件の最終 disposition

## これは DESK REVIEW です (最優先制約・先に読め)

- **対象 = 下記「証拠」と「提案 disposition」という *判断* の妥当性**。リポジトリの直近 commit / 最新 PLAN のコードレビューでは**ない**。
- `git log` の最新差分や working tree の変更を漁って評価先を差し替えるな。**本書に書かれた各 PLAN の disposition 判断そのものを評価**せよ。
- 引用先 (`src/lint/forward-convergence.ts`, `docs/governance/forward-convergence-legacy-debt-audit.md`, `docs/design/harness/L1-requirements/nfr.md`, `docs/plans/PLAN-L7-62-*`, `docs/plans/PLAN-L7-147-*`, `docs/plans/PLAN-L7-133-*`, `docs/design/harness/L6-function-design/function-spec.md`, `src/state-db/refactor-candidates.ts`) は確認してよいが、評価の主語は常に「この disposition が正しいか」。

## 背景

forward-convergence 不変条件 (PO: Forward=きれいな最終正本/製本、別フローの最終実態は必ず Forward へ集約) を fail-close 化 (PLAN-DISCOVERY-08) した時点で**既に存在した**未集約 landed impl が 2 件。現在は `FORWARD_CONVERGENCE_LEGACY_DEBT` allowlist + `docs/governance/forward-convergence-legacy-debt-audit.md` で grandfather (繰延、免除でない)。IMP-146 = この 2 件を最終 disposition で解消し、解消後 allowlist + audit doc から外す follow-up。

convergence analyzer の判定機構 (`src/lint/forward-convergence.ts`):
- `isSpineConnected` = `parent_design` が `docs/design/` を含む / `requires` が `PLAN-L[1-6]-` か `docs/design/` を指す / roadmap span 登録、のいずれか → bucket=`spine-internal` (集約義務なし=既に Forward 降下済)。
- reverse PLAN が requires/references で plan_id を指す → bucket=`converged`。
- `backprop_decision ∈ {local_impl_only, not_required(理由≥10字)}` → bucket=`local-impl-only`。
- 上記いずれでもない landed (confirmed/completed) impl → `unconverged-landed` (= 違反、legacy は grandfather)。

前回 Codex 指摘 (反映済): 「2 件は landed 済ゆえ version-up 扱い不可。Forward 集約 or local_impl_only で処理。L7-62 (ADR-001 由来) は原則 Forward 集約、local_impl_only は弱い」。

## 証拠 (Claude/Opus が調査。真偽を検証せよ)

### 件1: PLAN-L7-62-runtime-portability-guard (kind=impl/completed)
- 内容 = ADR-001 の runtime/language 境界 (harness core=TS/Bun/Node、Python/Bash runtime 混入禁止、Windows portability) を doctor hard-gate で機械強制する lint (`src/lint/runtime-portability.ts`)。
- 現 `parent_design=docs/adr/ADR-001` (ADR は spine 外判定)、`requires=ADR-001 + repository-structure.md` (どちらも docs/design/ でない) → spine-外。
- **上流 NFR は既に Forward (spine) に存在する**: `docs/design/harness/L1-requirements/nfr.md` の
  - **NFR-04** 「統制対象 repo は言語非依存。harness 自体は TypeScript (ADR-001) … harness の言語制約 (TS/Bun) は内部実装のみ」
  - **NFR-01 / §6 システム環境** 「Windows / macOS / Linux ネイティブ / Bun runtime | NFR-01 / ADR-001」
- つまり制約自体は L1 NFR として既に Forward 降下済。guard はその NFR の機械強制 (enforcement)。**欠けているのは descent の trace link のみ** (新規 normative 内容の back-fill は不要)。

### 件2: PLAN-L7-147-refactor-candidate-detector (kind=impl/confirmed)
- 内容 = Refactor mode の DB-trigger 候補面を harness.db へ projection する detector。`src/state-db/refactor-candidates.ts` が `analyzeRefactorCandidates` / `candidateRank` / `loadRefactorCandidateInputs` を export、4 candidate kind (split-module / extract-helper / deduplicate-function / externalize-literal) を `quality_signals` / `feedback_events` へ projection (schema 不変・既存テーブルへの additive projection)。
- 現 `parent_design=docs/process/modes/refactor.md` (mode 文書、spine 外)、`parent/requires=PLAN-L7-133` (L7、L1-6 でない) → spine-外。
- 親 **PLAN-L7-133-refactor-brush-up-workflow** (kind=add-impl) は `parent_design=docs/design/harness/L6-function-design/function-spec.md` で L3/L4/L6 + REVERSE-133 へ descent 済 = **Refactor mode 自体は Forward 内**。
- **しかし detector 固有の behavior (`analyzeRefactorCandidates` + 4 kind + projection contract) は L6 function-spec.md に記述なし、L7-unit-test-design.md にも descent エントリなし** (grep 0)。function-spec.md の refactor 系は `routeSignalToMode` (FR-L1-08) / `assertRefactorInvariant` (FR-L1-25) のみで、detector とは別関数。= detector は真に L6/L7 descent 欠落。

## 提案 disposition (Claude による。妥当性・代替・リスクを評価せよ)

### 件1: L7-62 → `spine-internal` (trace correction)
- L7-62 の `requires` に `docs/design/harness/L1-requirements/nfr.md` を追加し、NFR-04/NFR-01 を上流 descent として明示宣言する。これで `isSpineConnected=true` → spine-internal。
- 根拠: 制約 (NFR-04/01) は既に Forward に存在し、guard はその enforcement。新規 back-fill 内容は無く、欠けていた V-model trace (NFR → guard impl) を補うだけ。Codex の「Forward 集約 (local_impl_only は弱い)」を満たす。
- 解消後 allowlist + audit doc から L7-62 を除去。

### 件2: L7-147 → `converged` via Reverse back-fill
- local_impl_only は採らない (detector は実 behavior を持つ product 機能。Codex の「弱い」指摘が L7-62 以上に当てはまる)。
- Reverse PLAN (fullback/design) で L6 function-spec.md に `analyzeRefactorCandidates` detector の機能行 (4 candidate kind + projection contract、schema 不変) を back-fill、加えて L7-unit-test-design.md に detector の単体テスト descent を追記し、当該 Reverse PLAN が requires/references で L7-147 を指す → converged。
- 解消後 allowlist + audit doc から L7-147 を除去。

## あなた (Codex/tl) が答えるべきこと

1. **証拠の真偽**: 件1 で「NFR-04/NFR-01 が L7-62 guard の正しい上流 descent」、件2 で「detector は L6/L7 descent 欠落」という認識は正しいか。私が見落とした descent / 既存統制はあるか (具体名で)。
2. **件1 の機構**: 既に上流 NFR が Forward に存在する時、`requires: nfr.md` 追記で spine-internal とするのは妥当か。それとも上流が存在しても Reverse PLAN (converged) を必須とすべきか。status=completed の PLAN frontmatter に requires を後付けするのは frozen artifact 改変として不可か (= Reverse PLAN 経由が正しいか)。
3. **件2 の disposition**: Forward 集約 (converged) で正しいか、それとも local_impl_only が妥当な代替か。back-fill 先は function-spec.md + L7-unit-test-design.md で適切か、専用 L6 sub-doc が要るか。
4. **粒度**: 2 件を 1 本の Reverse PLAN に相乗りさせるべきか、件ごとに分けるべきか (件1 が trace correction で件2 が back-fill と性質が違う点を踏まえて)。
5. **総合判定**: AGREE / PARTIAL / DISAGREE を明示し、理由と推奨アクションを箇条書きで。

出力は上記 1-5 の番号付きで、簡潔に。
