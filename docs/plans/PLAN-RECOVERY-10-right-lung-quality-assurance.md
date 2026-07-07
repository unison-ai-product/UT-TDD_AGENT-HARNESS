---
plan_id: PLAN-RECOVERY-10-right-lung-quality-assurance
title: "PLAN-RECOVERY-10 (recovery): 品質保証を右肺として確立 — L8+ 検証 PLAN 起票不能の収束と品質改善ループ (refactor 等) の右肺接続"
kind: recovery
layer: cross
drive: fullstack
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-07-07
updated: 2026-07-07
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL — reopen point 確認 + kind/layer envelope 設計影響レビュー (人間サインオフ必須)"
  - role: po
    slot_label: "PO — スコープ承認 + 右肺=品質保証の標準確定サインオフ (人間サインオフ必須)"
  - role: qa
    slot_label: "QA — 検証戦略節の要件定義と L8+ 検証 PLAN 発火条件の整合確認"
  - role: aim
    slot_label: "AIM — 品質改善ループ (検証所見→refactor/reverse 発火→Forward 合流) の配線整合確認"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-10-right-lung-quality-assurance.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-RECOVERY-09-test-design-right-arm-placement.md
    - docs/plans/PLAN-L5-10-drive-model-router-redesign.md
    - docs/plans/PLAN-L6-38-router-function-contracts.md
    - docs/plans/PLAN-L7-363-routine-gate-run-projection.md
    - docs/plans/PLAN-L7-367-refactor-candidate-lifecycle.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/test-design/harness/L8-integration-test-design.md
    - src/schema/frontmatter.ts
---

# PLAN-RECOVERY-10 (recovery): 品質保証を右肺として確立

## Status

draft 起票 (2026-07-07、PO 指示「品質保証が右肺になるようにリカバリーでちゃんと起票して載せてくれ」)。
tl/po 人間サインオフ待ち。

## Step 1: 全事象収集 (dev 回帰 = 品質保証が harness の管理 plane に載っていない)

| # | 事象 | 帰結 |
|---|---|---|
| 1 | **L8-L14 layer を取れる kind が存在しない** (`ALLOWED_LAYER_BY_KIND`: design→L1-L6 / impl 系→L7 / research→L1-L4 / 横断→cross)。検証実行 PLAN は構造的に起票不能 | L8+ PLAN 不在 = 「本当に検証したか」が機械的に不明。L7 tests は関数・機能の正常動作 (単体) のみ |
| 2 | 右肺 doc の**検証戦略節が不揃い** (L8 は G8-WORKFLOW あり / L9・L12・L14 は無し / L10 は doc 自体が無い — PLAN-RECOVERY-09 と連動) | 「いつ・何を・どの基準で L8+ 検証 PLAN を起票するか」が定義されず、右肺が PLAN を発火できない |
| 3 | routine gate G1-G8 の pass/fail が DB 未登録 (PLAN-L7-363 で既起票、Critical) | 検証実行の証跡が gate_runs に残らず、検証したことの機械的証明が無い |
| 4 | **品質改善ループが右肺に接続されていない**: 検証所見 (quality_signals / refactor 候補) → refactor / reverse 発火 → Forward 合流の配線が prose のみ (refactor 候補の永続 lifecycle・候補→PLAN リンク欠落 = PLAN-L7-367 で既起票) | 右肺の検証から「コード品質を上げ保守性を高める」refactor 等が機械的に生まれず、品質保証が閉ループにならない |

## Step 2: PO 提示・認識確認 (確定原理、2026-07-07)

- 左肺 = どういうシステムを作るか (計測・評価点を①に同梱)。**右肺 = どう評価・検証するか = 品質保証の
  plane**。右肺 doc = ③テスト設計 + 検証戦略。
- 右肺の検証活動の中で refactor 等が発生し、コード品質・保守性を高める。駆動モデル = branch であり、
  必ず Forward (main) へ合流する。
- 正本設計: internal-processing.md Appendix C (C.2b 両肺設計の義務 / 機械的欠陥 carry)。

## Step 3: reopen point 特定

- reopen point = **右肺の PLAN plane (L8-L14 の検証 PLAN 起票能力)**。左肺の設計資産・既存③・検証機構
  (doctor/gate/verification roadmap) は有効。欠けているのは「右肺を PLAN として起票し、証跡を残し、
  品質改善へ発火する」経路のみ。

## Step 4: top-down 修正

> **着手条件**: PLAN-RECOVERY-09 と同じく、実装前に修正手順定義 (影響調査・手順・検証・rollback) を
> 本 PLAN へ追記し tl/po サインオフを得る。定義完了前の本体変更は禁止 (fail-close)。

1. **検証 PLAN の kind/layer envelope 新設**: L8-L14 layer を正規に取れる検証実行 kind (名称・schema・
   lint は定義フェーズで確定) を frontmatter schema へ追加し、routeFiling の stage-aware intake
   (C.2b) から発火可能にする。
2. **検証戦略 + 検証設計節の標準化**: 右肺 doc 全件 (L8/L9/L10/L12/L14) に、検証戦略節 (G8-WORKFLOW
   同型: strategy → plan → conditions → procedures → evidence → exit → defect_routing) と
   **検証設計節** (検証環境・データ実在性・計測方法・評価基準・実行手順 — concept §2.3 検証本質の
   設計面。PO 2026-07-07「テスト側の片肺には検証設計も入れる」) を追補する。右肺 doc の必須 3 点 =
   ③テスト設計 + 検証戦略 + 検証設計 (internal-processing.md C.2b 正本)。
   (L10 doc 新設と rename は PLAN-RECOVERY-09 の scope、順序依存を定義フェーズで確定)。
3. **証跡接続**: 検証 PLAN の実行が gate_runs / workflow_runs へ永続化される配線 (PLAN-L7-363 と統合)。
4. **品質改善ループの接続**: 検証所見 → refactor 候補 lifecycle (PLAN-L7-367) → refactor/reverse PLAN
   発火 → Forward 合流、の defect_routing を機械化する (右肺から品質・保守性向上が生まれる閉ループ)。

## Step 4 修正手順定義 (着手条件充足、tl/po 人間サインオフ待ち)

> 本節は Step 4 の **着手条件** (「実装前に修正手順定義=影響調査・手順・検証・rollback を追記し tl/po
> サインオフを得る。定義完了前の本体変更は禁止」) を充足するための定義である。**本節の記載は設計であり、
> 本体コード変更は tl/po 人間サインオフ後**に別 add-impl / add-design PLAN で行う (fail-close 維持)。
> 影響面は 2026-07-07 に実 grep で裏取り済 (行番号は当時点)。

### 共通影響調査 (verification kind の taxonomy 追加が触る面)

| # | touch-point | 現状 (実測 2026-07-07) | 変更 |
|---|---|---|---|
| A | `VALID_KINDS` (`src/schema/index.ts:9`) | 12 種、L8-L14 を取れる kind 無し | verification 実行 kind を 1 種追加 (名称は SE/TL で確定、以後 `verify` と仮称) |
| B | `ALLOWED_LAYER_BY_KIND` (`src/schema/frontmatter.ts:167`) | design→L1-L6 / impl系→L7 / research→L1-L4。右腕 layer 不在 | `verify: [L8,L9,L10,L11,L12,L13,L14]` を追加 |
| C | `CROSS_KINDS` (`frontmatter.ts:162`) / `WORKFLOW_KINDS` (`frontmatter.ts:164`) | poc/reverse/recovery=cross、poc/reverse=workflow | `verify` は右腕 Forward 工程 kind = **cross に入れない** (layer=cross 強制を避ける)。除外のまま維持を明示テスト化 |
| D | plan_id token↔layer 整合 (`frontmatter.ts:32,248`) | driveTok 検査 (248) は DISCOVERY/REVERSE/RECOVERY のみ対象。**L0-L14 layer token は token↔layer 一致を検証する機構が無い** (`planIdSchema` regex は形式のみ、`PLAN-L8-90` に `layer:L12` と書いても現状素通り = pre-existing gap) | 検証 PLAN は `PLAN-L8-NN`..`PLAN-L14-NN` = 既存 layer token を使う (新 token 不要)。ただし verify は L8-L14 の 7 層に及び design(L1-L6/6層)より不一致リスク面が広いため、**L-token↔layer 一致 fail-close チェック新設**を Step 4.1 に含める (`V_MODEL_PAIRS` は現状 dead data、これを活用) |
| E | `ROUTE_MODE_ALLOWED_KINDS` 定義 (`src/plan/lint-policy.ts:26`) + fail-open 分岐 `if (!allowedKinds) return []` (`src/plan/lint.ts:364`) | 登録は `add-feature` のみ。**実測: route_mode の実在値は add-feature 以外に refactor / version-up / reverse / recovery が多数 (~180 route_mode エントリ、大半が未登録 mode)。全て fail-open で lint を通過中** | **register-all-first**: 実在 mode (add-feature/refactor/version-up/reverse/recovery + verify) を全て登録してから未知 mode を fail-close 化 (C.7 criterion(b) registry。ただし migration-completeness を先行させる = 既存資産を壊さない) |
| F | 検証 roadmap 発火 (`docs/design/harness/L3-functional/roadmap.md`) | L layer group Forward freeze 後に動的発火 | verify PLAN 起票条件を roadmap 発火に対応付け (Step 5.2 の再発防止と一体) |
| G | kind 種数を記す doc/test | requirements §1.3「12 種」、`tests/schema.test.ts:40` (`expect(VALID_KINDS).toHaveLength(12)`) | 「13 種」へ back-fill (test の件数 assert 更新 + Step 5 fullback Reverse で L 正本へ昇華) |
| H | `REQUIRED_KIND_BY_BRANCH` + `BranchKind` union + `classifyBranchKind` (`src/lint/branch-kind.ts:48-60`、doctor fail-close gate) | branch prefix (feature/design/research/poc/reverse/add/hotfix/refactor) ごとに許可 kind 固定。**verify の枠が無く、verify PLAN を既存 prefix branch で commit すると `kind_mismatch` で doctor が意図せず fail-close、無関係 prefix では検査素通り** (cross-review C-2 新規発見) | `verify` prefix を `BranchKind`/`classifyBranchKind`/`REQUIRED_KIND_BY_BRANCH` (`verify:["verify"]`) に追加 |
| I | `CONVERGENCE_SCOPE_KINDS` (`src/lint/forward-convergence.ts:27` = `Set(["impl"])`) | impl のみ Forward 収束義務を判定。verify PLAN が spine-外 landed で未集約でも現状検知しない (cross-review I-2) | verify を収束 scope に含めるか否かを **明示判断し記録** (含めるなら Set に追加、含めないなら別 SSoT が担う理由を注記) |

### Step 4.1: 検証 kind/layer envelope 新設 [直列: schema=shared_state]

- **影響**: 上表 A/B/C/D/E/H/I。
- **手順**:
  1. `VALID_KINDS` へ `verify` 追加 (12→13 種) + `tests/schema.test.ts:40` の `toHaveLength(12)` を 13 へ更新。
  2. `ALLOWED_LAYER_BY_KIND` へ `verify:[L8..L14]` 追加。
  3. `CROSS_KINDS`/`WORKFLOW_KINDS` は verify を **除外のまま維持**し、それを明示する回帰テストを追加 (無言の
     将来混入を防ぐ)。
  4. **`ROUTE_MODE_ALLOWED_KINDS` の register-all-first 化 (C-1 対応、最重要)**: verify だけを足して
     fail-close に切り替えると、**現在 fail-open で通っている refactor/version-up/reverse/recovery mode の
     既存 PLAN 群が一斉に lint violation 化し `harness-check` CI を破壊する**。よって順序は必ず (i) 実在 mode
     (add-feature/refactor/version-up/reverse/recovery/verify) を `ROUTE_MODE_ALLOWED_KINDS` へ全登録 →
     (ii) 全登録を実 repo 回帰 (下記) で確認 → (iii) その後に `lint.ts:364` の `if (!allowedKinds) return []`
     を fail-close へ変更。既存 debt-ledger (`ROUTE_MODE_KIND_LEGACY_LANDED_PLAN_IDS` /
     `..._DRAFT_DEBT_PLAN_IDS`) の一般化可否も TL 判断に含める。
  5. `REQUIRED_KIND_BY_BRANCH`/`BranchKind`/`classifyBranchKind` (`branch-kind.ts`) に `verify` prefix
     (`verify:["verify"]`) を追加 (H 行、C-2 対応)。
  6. `CONVERGENCE_SCOPE_KINDS` に verify を含めるか否かを明示判断し注記 (I 行)。
  7. plan_id L-token↔`layer` 一致の fail-close チェックを新設 (D 行、`V_MODEL_PAIRS` 活用)。
  8. route-map schema (`src/schema/route-map.ts`) に verification route_signal/route_mode を追加。
- **検証** (falsifiable、実 repo 回帰を必須化 = CLAUDE.md PLAN claim discipline):
  - **`docs/plans/*.md` 全件に `ut-tdd plan lint` を実行し新規 violation 0 件** (C-1 の大量破壊が起きない実証。
    prose 主張ではなく real-repo regression)。
  - `PLAN-L8-90-...` 最小検証 PLAN を作り `ut-tdd plan lint` が受理 / 既存 12 kind の layer 制約不変。
  - 未知 route_mode (台帳に無い値) が **空許可でなく fail-close** する回帰テスト (IT-EXT-05 同型)。
  - verify PLAN を `verify/` branch で commit → `ut-tdd doctor` branch-kind が PASS、既存 prefix では
    `kind_mismatch` が出ない回帰。
  - L-token↔layer 不一致 (`PLAN-L8-90` に `layer:L12`) が fail-close する回帰。
- **rollback**: enum 値・Record entry は append-only なので revert で既存行に副作用なし。ただし手順(4)(iii)の
  fail-close 切替は独立 commit にし、既存 mode 全登録 commit と分離して revert 単位を保つ (切替のみ戻せる)。
  最小検証 PLAN・回帰テストも別 commit。

### Step 4.2: 右肺 doc 3 点セット節の標準化 [並列: doc ごと独立]

- **影響**: `docs/test-design/harness/L8/L9/L12/L14` + L10 (RECOVERY-09 で新設済 `L10-ux-validation-test-design.md`)。
  L8 は G8-WORKFLOW 既存、L9/L12/L14 は検証戦略節が無い。
- **手順**: 各右肺 doc に 3 点セット (③テスト設計 + 検証戦略節 [G8-WORKFLOW 同型: strategy→plan→
  conditions→procedures→evidence→exit→defect_routing] + 検証設計節 [検証環境・データ実在性・計測方法・
  評価基準・実行手順]) を追補。**順序依存**: L10 doc 新設は RECOVERY-09 scope が先行 (完了済) なので L10 は
  節追補のみ。
- **検証**: Step 5.1 の doctor fail-close 検査 (3 点セット節存在) が全右肺 doc で green。**fail-close は
  節見出しの存在確認まで**であり、内容の実質的充実度 (coding≠substance) は design gate の人間レビュー観点に
  委ねる旨を Step 5.1 と併記する (見出しだけの空節を substance と誤認させない)。
- **rollback**: doc 節は追記のみ、revert で原状復帰 (既存③テスト設計本体は不変)。

### Step 4.3: 検証実行の証跡接続 (gate_runs/workflow_runs) [直列: PLAN-L7-363 統合=downstream_dependency]

- **影響**: `gate_runs` projection (PLAN-L7-363 既起票)。検証 PLAN 実行 → gate pass/fail 永続化の配線。
- **手順**: PLAN-L7-363 の routine gate projection に verify PLAN の実行結果 row を接続 (本 PLAN は接続
  仕様の定義、実装は L7-363/後続 add-impl)。
- **検証**: `ut-tdd doctor` の `db-projection-ingestion` (check-id 仮決め) で gate_runs が evidence-gated
  から populated へ遷移。具体 check-id は L7-363 統合時に確定。
- **rollback**: L7-363 側の projection 変更単位で revert (本 PLAN では配線仕様のみ、コード副作用なし)。

### Step 4.4: 品質改善ループの接続 (defect_routing) [直列: PLAN-L7-367 統合=downstream_dependency]

- **影響**: refactor 候補 lifecycle (PLAN-L7-367 既起票)。検証所見 → refactor/reverse 発火 → Forward 合流。
- **手順**: 検証 PLAN の defect_routing 出口を refactor 候補 lifecycle (L7-367) へ接続する仕様を定義。
  候補→PLAN リンクと Forward 合流 (駆動 branch→main) の機械記録を規定。
- **検証**: 検証所見 fixture から refactor 候補が生成され候補→refactor/reverse PLAN リンクが張られる
  結合テスト (L8 追補、L7-367 と統合)。
- **rollback**: L7-367 側 lifecycle 変更単位で revert。

### 手順定義段階の DoD (サインオフ対象)

- [x] 共通影響調査を実 grep で裏取りし touch-point を A-I に列挙 (cross-review C-2/I-2 で H/I 追加)。
- [x] Step 4.1-4.4 各々に 影響 / 手順 / 検証 / rollback を定義。
- [x] fail-open 穴 (`ROUTE_MODE_ALLOWED_KINDS` 未知 mode) の fail-close 化を **register-all-first 順序**で
      Step 4.1 に組込 (C.7 自己適用 + C-1 大量破壊回避)。実 repo 回帰 (全 PLAN lint 新規 violation 0) を必須検証化。
- [x] cross-review (code-reviewer/Sonnet) を実施し Critical 2 (C-1 既存 PLAN 大量 fail-close / C-2 branch-kind
      未対応) + Important 4 + Minor 3 を全て手順定義へ fix-forward。
- [ ] **tl/po 人間サインオフ** (この手順定義への承認) を review_evidence へ記録 → 記録後に本体着手 (add-impl/add-design)。

## Step 5: fullback (再発防止 + 上位整合)

- concept §2.3 / requirements への「右肺 = 品質保証 plane」back-fill は Recovery exit 後の Reverse
  (fullback) で L設計正本へ昇華する。
- 再発防止 (doctor/lint を修正内で追加、PO 2026-07-07「ルール周りでちゃんと縛る」):
  1. 右肺 doc に 3 点セット (③テスト設計 + 検証戦略 + **検証設計**) の節が存在すること (fail-close)。
  2. L8+ 検証 PLAN が verification roadmap の発火と対応していること。
  3. **粒度一致の機械検査**: 右肺 doc の各節が左肺ペア層 doc を参照し、対象粒度マーカー (モジュール間
     契約 / 方式 / 画面 / FR-AC / 業務要求) がペア層と一致すること。意味的な粒度判定は design gate の
     レビュー観点として明文化 (機械は構造・参照・マーカーの一致まで)。
  4. **PLAN frontmatter の `pair_artifact` / `next_pair_freeze` の schema 検証**: 現行 schema は
     unknown key として素通りさせるため、フィールドを正規定義し「参照先 doc の実在 + 当該層の正しい
     対 (①⇔③ 対応表) であること」を plan lint で fail-close する。

## DoD

- [ ] tl/po 人間サインオフ (Step 2/3) が review_evidence に記録される。
- [ ] Step 4 の修正手順定義 (影響調査・手順・検証・rollback) が追記されサインオフされてから本体着手。
- [ ] L8-L14 layer を取れる検証 kind が schema/lint に存在し、`ut-tdd plan lint` が受理する。
- [ ] 右肺 doc 全件に検証戦略節があり、doctor が fail-close 検査する。
- [ ] 検証所見→refactor/reverse 発火→Forward 合流の defect_routing が機械記録される。
- [ ] concept/requirements への back-fill Reverse が起票される (exit 条件)。
