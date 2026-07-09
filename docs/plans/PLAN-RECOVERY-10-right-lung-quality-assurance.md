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
    - docs/plans/PLAN-L7-336-fail-open-annotation.md
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
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
| E | `ROUTE_MODE_ALLOWED_KINDS` 定義 (`src/plan/lint-policy.ts:26`) + fail-open 分岐 `if (!allowedKinds) return []` (`src/plan/lint.ts:364`) + 既存債務台帳 (`ROUTE_MODE_KIND_LEGACY_LANDED_PLAN_IDS` / `_DRAFT_DEBT_PLAN_IDS`) | 登録は `add-feature` のみ。**実測: refactor/version-up/reverse/recovery mode の ~180 PLAN は route_mode→kind 整合を一度も検査されず fail-open で素通り中。既存の債務台帳の存在 = 「観測された組合せ=正しい」ではない証拠** | registry を **設計 SSoT (L4 §3.1 / route-map) 由来の正しい mapping で完全化**し、mismatch を正当/債務-ledger/要修正に分類してから未知 mode を fail-close 化 (C.7 criterion(b))。**観測組合せの鵜呑み blessing は禁止**。CI/schema.test はこの新 gate に追従更新する |
| F | 検証 roadmap 発火 (`docs/design/harness/L3-functional/roadmap.md`) | L layer group Forward freeze 後に動的発火 | verify PLAN 起票条件を roadmap 発火に対応付け (Step 5.2 の再発防止と一体) |
| G | kind 種数を記す doc/test | requirements §1.3「12 種」、`tests/schema.test.ts:40` (`expect(VALID_KINDS).toHaveLength(12)`) | 「13 種」へ back-fill (test の件数 assert 更新 + Step 5 fullback Reverse で L 正本へ昇華) |
| H | `REQUIRED_KIND_BY_BRANCH` + `BranchKind` union + `classifyBranchKind` (`src/lint/branch-kind.ts:48-60`、doctor fail-close gate) | branch prefix (feature/design/research/poc/reverse/add/hotfix/refactor) ごとに許可 kind 固定。**verify の枠が無く、verify PLAN を既存 prefix branch で commit すると `kind_mismatch` で doctor が意図せず fail-close、無関係 prefix では検査素通り** (cross-review C-2 新規発見) | `verify` prefix を `BranchKind`/`classifyBranchKind`/`REQUIRED_KIND_BY_BRANCH` (`verify:["verify"]`) に追加 |
| I | `CONVERGENCE_SCOPE_KINDS` (`src/lint/forward-convergence.ts:27` = `Set(["impl"])`) | impl のみ Forward 収束義務を判定。verify PLAN が spine-外 landed で未集約でも現状検知しない (cross-review I-2) | verify を収束 scope に含めるか否かを **明示判断し記録** (含めるなら Set に追加、含めないなら別 SSoT が担う理由を注記) |

### Step 4 の設計原理 (PO 指摘 2026-07-07: CI は正しい構造の帰結、負債を後送りしない)

**CI green は正しい構造の帰結であって、目標にして gate を緩めるものではない。** 現状の壊れた state
(`ROUTE_MODE_ALLOWED_KINDS` の fail-open 穴 + route_mode→kind 未検査の ~180 PLAN + 累積した債務台帳) は、
**過去に「CI を通すためにスコープを下げた」結果として後から噴き出した負債そのもの**である。これは推測でなく
repo 自身の監査で裏付け済: `catch{}`/`return []` 型の暗黙 fail-open は src に **202 箇所** (A-182 AQ-9)、
「設計か握りつぶしか区別不能 = absence-blindness のコード版」と認識され、その是正すら **PLAN-L7-336 で v2 へ
parked (再び後送り)** されている。fail-open な検証 gate は「検証したフリ」= false-confidence であり、無い gate
より悪い。これは RECOVERY-10 の主題 (右肺 = 実際に検証する plane) の**縮図**である。

したがって Step 4 は同じパターンを再生産しない:

1. **fail-close を不変条件にする** (CI green ⟺ 構造的に正しい、を成立させる)。
2. **既存 mismatch の既定処分は「構造的解消 (PLAN 修正)」**。債務台帳への登録は**有限・理由拘束・burn-down
   期限つきの例外**に限る (台帳を新しい fail-open のゴミ捨て場にしない)。分類の内訳と burn-down を証跡化する。
3. **再発防止を PLAN-L7-336 (fail-open 意図宣言) に接続**し、将来 gate を無言で緩めて同じ負債を再累積させない
   (無宣言 fail-open を warn/fail 化)。L7-336 が v2 parked なら、本 recovery の再発防止スコープとして活性化
   可否を TL/PO 判断に上げる。

この結果、Step 4 のスコープは「kind を 1 種足す」に留まらず **既存 ~180 PLAN の route_mode→kind 正当性の
棚卸し + fail-open 是正**を含む。**規模を理由にこの棚卸しを縮退させない** (縮退がこの負債を生んだ張本人)。

### Step 4.1: 検証 kind/layer envelope 新設 [直列: schema=shared_state]

- **影響**: 上表 A/B/C/D/E/H/I。
- **手順**:
  1. `VALID_KINDS` へ `verify` 追加 (12→13 種) + `tests/schema.test.ts:40` の `toHaveLength(12)` を 13 へ更新。
  2. `ALLOWED_LAYER_BY_KIND` へ `verify:[L8..L14]` 追加。
  3. `CROSS_KINDS`/`WORKFLOW_KINDS` は verify を **除外のまま維持**し、それを明示する回帰テストを追加 (無言の
     将来混入を防ぐ)。
  4. **`ROUTE_MODE_ALLOWED_KINDS` の registry 完全化 → fail-close 化 (C-1 対応、最重要)**。
     **目的は registry の正しさであって CI 温存ではない。観測された route_mode|kind 組合せを鵜呑みで
     allow に登録してはならない (それは fail-open の看板替えであり縮退)**。順序:
     - (i) 各実在 mode の allowed kinds を **設計 SSoT (L4 §3.1 駆動モデル表 `function.md:109`) から導出**して
       登録する (観測値からではない)。**棚卸し済の確定 mapping = 補遺A**:
       `add-feature→[add-design,add-impl]` / `reverse→[reverse]` / `recovery→[recovery]` /
       `refactor→[refactor]` / `version-up→[補遺A 特記の tl/po 裁定で確定]` / `verify→[verify]`。
     - (ii) その正しい mapping で全 PLAN を検査し、炙り出た mismatch (例: `version-up|impl`・`refactor|impl`
       等) を分類する。**既定処分は (a) 構造的解消 = PLAN 修正**。台帳登録は **(b) 有限・理由拘束・burn-down
       期限つきの例外** のみ (ゴミ捨て場化禁止)。**(c) 正当と判断するものは SSoT mapping 側に本来含まれるべき
       = mapping を直す**。無言 blessing 禁止、分類内訳を証跡化 (TL 判断)。
     - (iii) 分類完了後に `lint.ts:364` の `if (!allowedKinds) return []` を fail-close へ変更。
     - (iv) **上流設計を厳格化したのだから、下流の CI (`harness-check`) / `schema.test` / 関連テストは
       新 gate に追従して更新する** (設計を CI に合わせて緩めない、逆向き禁止)。
     この作業は kind taxonomy を 1 種増やす core 変更 + 既存 ~180 PLAN の route_mode→kind 正当性の棚卸しを
     伴うため、規模は小さくない。TL がこの分類の妥当性をレビューする。
  5. `REQUIRED_KIND_BY_BRANCH`/`BranchKind`/`classifyBranchKind` (`branch-kind.ts`) に `verify` prefix
     (`verify:["verify"]`) を追加 (H 行、C-2 対応)。
  6. `CONVERGENCE_SCOPE_KINDS` に verify を含めるか否かを明示判断し注記 (I 行)。
  7. plan_id L-token↔`layer` 一致の fail-close チェックを新設 (D 行、`V_MODEL_PAIRS` 活用)。
  8. route-map schema (`src/schema/route-map.ts`) に verification route_signal/route_mode を追加。
- **検証** (falsifiable、実 repo 回帰を必須化 = CLAUDE.md PLAN claim discipline):
  - **`docs/plans/*.md` 全件 lint が green なのは「正しい mapping での登録 + mismatch の分類 (ledger/修正) が
    完了した後の到達状態」**であって、通すこと自体が目的ではない (通すための blessing は不可)。green に至る前の
    mismatch 一覧と各々の分類 (正当/債務/修正) を証跡として残す。
  - `PLAN-L8-90-...` 最小検証 PLAN を作り `ut-tdd plan lint` が受理 / 既存 12 kind の layer 制約不変。
  - 未知 route_mode (台帳に無い値) が **空許可でなく fail-close** する回帰テスト (IT-EXT-05 同型)。
  - verify PLAN を `verify/` branch で commit → `ut-tdd doctor` branch-kind が PASS、既存 prefix では
    `kind_mismatch` が出ない回帰。
  - L-token↔layer 不一致 (`PLAN-L8-90` に `layer:L12`) が fail-close する回帰。
- **rollback**: enum 値・Record entry は append-only なので revert で既存行に副作用なし。ただし手順(4)(iii)の
  fail-close 切替は独立 commit にし、既存 mode 全登録 commit と分離して revert 単位を保つ (切替のみ戻せる)。
  最小検証 PLAN・回帰テストも別 commit。

### Step 4.1 補遺A: route_mode→kind 棚卸し結果 (2026-07-07 実走、全数 184 PLAN)

`docs/plans/*.md` 全 567 件を frontmatter 抽出し、`route_mode` 非空の **184 PLAN** を SSoT (L4 §3.1
駆動モデル表 `function.md:109` の「駆動モデル | kind」列) 対照で棚卸しした。**観測分布は bless せず、
SSoT との一致/不一致を判定した** (Step 4.1(4)(ii) の (a)/(b)/(c) 分類の入力証跡)。

| route_mode | SSoT kind (L4 §3.1) | 実測 kind 分布 | 判定 | 既定処分 |
|---|---|---|---|---|
| `reverse` | `reverse` | reverse ×20 | ✅ 完全一致 | そのまま登録 (mismatch 0) |
| `recovery` | `recovery` | recovery ×5 / **refactor ×1 / impl ×1** | off-diagonal 2 (全 landed) | 登録 `[recovery]` + landed 2 を恒久台帳 |
| `refactor` | `refactor` | refactor ×41 / **impl ×12** | off-diagonal 12 (全 landed) | 登録 `[refactor]` + landed 12 を恒久台帳 |
| `add-feature` | `add-design`+`add-impl` | impl ×37 / add-impl ×13 / add-design ×7 | 既存台帳管理済 | 現行 `[add-design,add-impl]` 維持 (impl 37 は既存 LEGACY_LANDED 5 + DRAFT_DEBT 32) |
| `version-up` | **`add-design`** | **impl ×47** (draft 46 / confirmed 1) | ⚠️ **47件全て SSoT 不一致** | **tl/po 判断ゲート (下記特記)** |

**登録すべき正しい mapping (SSoT 由来、観測由来でない)**:
`add-feature→[add-design,add-impl]` / `reverse→[reverse]` / `recovery→[recovery]` /
`refactor→[refactor]` / `version-up→[add-design]` / `verify→[verify]` (本 PLAN 新設分)。

**off-diagonal landed 14件 (kind 書き換え=履歴改ざんのため恒久台帳、既存 LEGACY_LANDED と同型)**:

- `refactor|impl` ×12 (全 confirmed): PLAN-L7-216 / 217 / 218 / 220 / 222 / 223 / 224 / 225 / 226 /
  227 / 228 (setup/doctor extraction 系) + PLAN-L7-256 (model-id-ssot-drift-gate)。
  → kind=impl は refactor の振る舞い不変義務 (`assertRefactorInvariant` / G7 directed edge) を機械免除する
  ため add-feature|impl と同クラスの債務。landed 済につき恒久免除 + 個別 burn-down (Reverse 起票) を台帳化。
- `recovery|refactor` ×1: PLAN-L7-359-consumer-setup-profile-wiring (confirmed)。
- `recovery|impl` ×1: PLAN-L7-361-setup-noninteractive-package-tar-portability (confirmed)。

**特記: version-up 47件 = 単純登録不可の tl/po 判断案件 (観測鵜呑み禁止の核心)**。
SSoT (L4 §3.1) は version-up を **kind=`add-design`** かつ「**着手まで PLAN 化しない = deferral 台帳記録**」と
規定する。しかし repo には version-up PLAN が 47件 (全 kind=impl、うち 46 draft は version_target=future の
parked track) 実在する。ここで観測に合わせて `version-up→[impl]` と登録するのは **fail-open の看板替え (縮退)**
であり禁止。取り得る構造的解消は次の 3 択で、いずれも tl/po 裁定が要る:

1. **route-map SSoT を「parked track の kind」概念で更新** — version-up parked は将来実装意図を impl として
   保全し、着手時に add-feature 合流で add-design を生む、と L4 §3.1 に明文化 (現行 doc と実態の乖離を doc 側で解消)。
2. **47件を kind=add-design へ修正** (draft 46 は default=構造的解消の対象。ただし version_target/parked 意味論の
   再設計を伴う大工事)。
3. **version-up を「PLAN 化しない deferral 台帳」へ寄せる** — SSoT 原文に忠実だが 47件の既存 PLAN 資産の扱いが未定義。

推奨は **1 (doc 側で乖離解消)** — 47件の parked 資産を壊さず、SSoT を実態に合わせて正す方が破壊が小さい。
ただし「parked の kind=impl が back-fill 義務を免除する」懸念 (add-feature|impl と同型) が残るため、parked 中は
`version_target` が義務を保留し着手時に add-feature 合流で義務が復活する、という機械保証を条件に付ける。**この裁定が
Stage 1 の登録内容 (`version-up→[?]`) を確定させる前提**であり、tl/po サインオフの必須入力とする。

### Step 4.1 補遺B: 段階分け (PO 2026-07-07「fail-close 化と ~180 棚卸しを段階に分ける」裁定)

規模大 (core taxonomy + 184 PLAN 監査) のため、**構造 (fail-close + 正しい mapping) を先に不変条件として据え、
再発防止の一般化を次段**に分ける。「正しい構造の上に CI が乗る」state を壊さず積むための分割。

- **Stage 1 (先行 = fail-close 構造 + register-correct)**:
  1. `ROUTE_MODE_ALLOWED_KINDS` へ SSoT 由来 mapping を全 mode 登録 (上記正しい mapping。verify 含む)。
  2. off-diagonal landed 14件を LEGACY_LANDED 型恒久台帳へ理由付き固定 (台帳同期テストで fail-close)。
     `docs/governance/route-mode-kind-debt-audit-2026-07-02.md` を **拡張** (並行台帳を作らない)。
  3. version-up 47件の処遇を tl/po 裁定 (補遺A 特記の 3 択) で確定し、`version-up→[確定kind]` を登録。
  4. `lint.ts:364` の fail-open `if (!allowedKinds) return []` を fail-close へ切替 (独立 commit)。
  5. CI (`harness-check`) / `schema.test` / 台帳同期テストを新 gate に追従更新。
  6. verify kind/layer envelope (Step 4.1 手順 1-8) を同 Stage に含める (schema=shared_state で直列)。
  - **Stage 1 完了 = 全 184 route_mode PLAN が「正しい mapping での登録 + mismatch 分類完了後」に lint green**
    (通すための blessing でなく、構造的到達状態)。
- **Stage 2 (次段 = L7-336 活性化 = 再発防止の一般化)**:
  1. PLAN-L7-336 (fail-open 意図宣言) を活性化し、`ROUTE_MODE_ALLOWED_KINDS` 固有の fail-close を
     **無宣言 fail-open 一般 (src 202 箇所, A-182 AQ-9) の warn/fail 化**へ拡張する (同じ負債の再累積防止)。
  2. Stage 1 の version-up 裁定が「route-map 更新」だった場合の L4 §3.1 back-fill を Reverse (fullback) で
     L 正本へ昇華 (Step 5 と統合)。
  - **分割理由**: Stage 1 (mapping 登録 + 184 分類 + core schema + CI 更新) を 1 commit 塊にすると切り分け困難。
    fail-close 構造を先に据え、L7-336 の一般化 (影響 202 箇所) は独立サイクルで burn-down する方が安全。

### Step 4.1 補遺C: Stage 1 patch-level 実装仕様 (サインオフ即着手用、live gate 未適用)

本補遺は「手順定義の確定」を最大化するための **patch-level 仕様**であり、**本体 src への適用は tl/po
サインオフ後**(fail-close 着手条件を維持)。version-up 裁定 (補遺A) 以外の delta は全て確定済で、裁定後の
実行は機械的。

**P1 — `src/plan/lint-policy.ts` `ROUTE_MODE_ALLOWED_KINDS` を SSoT 完全化**:

```ts
const ROUTE_MODE_ALLOWED_KINDS: Record<string, readonly string[]> = {
  "add-feature": ["add-design", "add-impl"],   // 既存 (維持)
  "reverse":     ["reverse"],                   // SSoT L4 §3.1、mismatch 0
  "recovery":    ["recovery"],                  // SSoT、off-diagonal 2 は P3 台帳で免除
  "refactor":    ["refactor"],                  // SSoT、off-diagonal 12 は P3 台帳で免除
  "verify":      ["verify"],                    // RECOVERY-10 本体新 kind (Step 4.1 手順1-2)
  // "version-up": <裁定>  — option1: ["impl"] + parked-guard / option2: ["add-design"] / option3: 登録せず(PLAN化しない)
};
```

**P2 — `src/plan/lint.ts:364` を fail-open→fail-close (独立 commit)**:

```ts
const allowedKinds = ROUTE_MODE_ALLOWED_KINDS[mode];
if (!allowedKinds) {
  return [{ reason: "route_mode_kind_mismatch",
    detail: `unknown route_mode=${mode} (fail-close: SSoT L4 §3.1 由来で ROUTE_MODE_ALLOWED_KINDS へ登録せよ; ${ROUTE_MODE_KIND_DEBT_GUIDANCE})` }];
}
```

前提: P1 で全実在 mode を登録済でないと既存 PLAN が割れる(= register-correct が fail-close の論理前提)。
version-up 未裁定のまま P2 を適用すると 47件が fail-close する硬依存があるため、**version-up 裁定は P2 の
ブロッカー**。

**P3 — off-diagonal landed 14件を恒久台帳へ (`lint.ts:369` の LEGACY_LANDED は mode 非依存で免除)**:
`ROUTE_MODE_KIND_LEGACY_LANDED_PLAN_IDS` へ 14 id 追加 (refactor|impl ×12: L7-216/217/218/220/222/223/
224/225/226/227/228/256、recovery|{refactor,impl} ×2: L7-359/361) + `route-mode-kind-debt-audit-2026-07-02.md`
に「refactor/recovery mode の landed off-diagonal」節を**追加**(並行台帳を作らない) + `tests/plan-lint.test.ts`
台帳同期テストの照合対象へ反映。

**P4 — 下流 CI/test 追従 (逆流禁止 = 設計を CI に合わせて緩めない)**:
`tests/schema.test.ts:40` の `toHaveLength(12)`→`13` (verify kind) / 未知 route_mode が空許可でなく fail-close
する回帰テスト新規 (IT-EXT-05 同型) / `harness-check` は追加 gate を素通りさせず実行。

**version-up 3択のコード着地 (裁定後に確定)**:
| 裁定 | P1 の version-up 行 | 追加作業 | 破壊度 |
|---|---|---|---|
| option1 (route-map 更新)〔推奨〕 | `["impl"]` | parked-guard 機構 (`version_target` 有 → back-fill 義務保留、着手時 add-feature 合流で復活) + L4 §3.1 追補 | 小 (47件不変) |
| option2 (47件を fix) | `["add-design"]` | 47 PLAN の kind 書換 + parked 意味論再設計 | 大 |
| option3 (deferral 台帳) | 登録せず | 47件から route_mode 除去 or 別形式へ移行 | 中〜大 (資産扱い未定義) |

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

### Step 4.4: 品質改善ループの接続 (defect_routing) [直列: PLAN-L7-367 / PLAN-L7-410 統合=downstream_dependency]

- **影響**: refactor 候補 lifecycle (PLAN-L7-367) と verification defect routing 投影 (PLAN-L7-410)。
  検証所見 → refactor 候補 → triage / linked PLAN → Forward 合流の品質改善 loop。
- **手順**: L7-367 の lifecycle table を土台に、L7-410 で検証 PLAN の defect_routing 出口を
  `refactor_candidates.kind=verification-defect-routing` へ接続する。候補→PLAN リンクは
  `decideRefactorCandidate.linked_plan_id` で保持し、DB は PLAN 本文を生成しない。Reverse route は既存
  `detector_route_candidates` / `routeFiling` 経路に分離する。
- **検証**: 検証所見 fixture から refactor 候補と quality signal が生成され、候補→Refactor PLAN リンクが
  rebuild 後も保持される L7 projection test (PLAN-L7-410 / U-REFACTOR-ROUTE-001..002)。
- **rollback**: L7-367 / L7-410 側 lifecycle / projection 変更単位で revert。

### 手順定義段階の DoD (サインオフ対象)

- [x] 共通影響調査を実 grep で裏取りし touch-point を A-I に列挙 (cross-review C-2/I-2 で H/I 追加)。
- [x] Step 4.1-4.4 各々に 影響 / 手順 / 検証 / rollback を定義。
- [x] fail-open 穴 (`ROUTE_MODE_ALLOWED_KINDS` 未知 mode) の fail-close 化を Step 4.1 に組込。**目的は
      registry の正しさ (SSoT 由来の mapping + mismatch の明示分類) であり CI 温存ではない。観測組合せの
      鵜呑み blessing を禁止し、上流厳格化に CI/schema.test を追従更新する旨を明記** (PO 指摘: CI ごときで
      本来やるべき棚卸しを縮退させない)。
- [x] cross-review (code-reviewer/Sonnet) を実施し Critical 2 (C-1 既存 PLAN 大量 fail-close / C-2 branch-kind
      未対応) + Important 4 + Minor 3 を全て手順定義へ fix-forward。
- [x] **route_mode→kind 棚卸しを実走** (全 567 PLAN 抽出 → 184 route_mode PLAN を SSoT 対照分類、補遺A)。
      off-diagonal landed 14件を特定、version-up 47件を tl/po 判断案件として上申。観測鵜呑み blessing なし。
- [x] **段階分け** (Stage 1 = fail-close 構造 + register-correct / Stage 2 = L7-336 活性化) を補遺B に定義。
- [x] **tl/po 人間サインオフ (PO「OK進めて」2026-07-07)** — 承認: (a) 手順定義 + Stage 分割、
      (b) **version-up 47件 = option1 (route-map 更新 + parked-guard、`version-up→[impl]`)**、
      (c) landed off-diagonal 14件の恒久台帳化。→ Stage 1 本体着手を承認。

## サインオフ記録 (review_evidence)

- **2026-07-07 PO 人間サインオフ「OK進めて」**: Step 4 手順定義 (補遺A/B/C) を承認。裁定:
  version-up = **option1** (最小破壊、47件不変・可逆)、off-diagonal 14件 = 恒久台帳、Stage 1/2 分割 +
  実装 Codex/別セッション分担を承認。本サインオフを以て Stage 1 (fail-close 構造 + register-correct) の
  本体着手が解禁 (RECOVERY-10 Step 4 着手条件を充足)。Stage 2 (L7-336 活性化) は次段。

## Stage 1 実行結果 + 残実装 handoff (2026-07-07)

**Stage 1 (fail-close 構造 + register-correct) は実行完了・commit 済**。version-up 裁定 = option1
の design 側 pairing も完了。以降の本体は goal どおり別セッション/Codex 分担。

### 完了 (commit chain、正しい gate で検証済)

| commit | 内容 | 検証 |
|---|---|---|
| `f59748a` | route_mode→kind 棚卸し記録 (184 PLAN、補遺A) | — |
| `c3752e4` | tl/po サインオフ + patch-level 仕様 (補遺C) | plan lint / db rebuild |
| `9cfabf1` | P1 register-correct (SSoT 5 mode) + P3 台帳 14件 | 567 lint EXIT=0 / 55 tests |
| `4544b17` | 台帳 doc 日本語化 (design-language gate) | design-language OK |
| `640973e` | P2 `lint.ts:364` fail-open→fail-close + P4 未知 mode 回帰 | 567 lint / 55 tests / tsc |
| `113c1e0` | L4 §3.1 に version-up parked kind=impl を back-fill (option1 pairing) | plan lint / design-language |

- **閉じた穴**: refactor/version-up/reverse/recovery mode の ~127 PLAN が route_mode→kind 未検査で
  素通りしていた fail-open を、SSoT 由来登録 + fail-close で構造的に解消。未登録 mode は以後違反として surface。
- **spec 駆動**: 全登録は L4 §3.1 由来 (観測鵜呑みなし)。version-up の spec↔実態乖離 (47件 impl) は
  option1 で SSoT (L4 §3.1) 側を parked-track 意味論で明文化して解消 (code と design 両方 pairing 済)。

### 残実装 (別セッション / Codex 分担、着手条件 = 本サインオフで解禁済)

1. **verify kind/layer envelope (最高リスク core taxonomy、要 full-suite 検証)** — Step 4.1 手順 1-3,5-8。
   触る invariant: `VALID_KINDS` (`src/schema/index.ts:9`) / `ALLOWED_LAYER_BY_KIND` の consumer /
   cross-kind ロジック (`frontmatter.ts:160-223`、verify は cross に**入れない**) / `branch-kind.ts` verify prefix /
   `forward-convergence.ts` `CONVERGENCE_SCOPE_KINDS` / `V_MODEL_PAIRS` L-token↔layer / roadmap 発火 /
   `tests/schema.test.ts:40` (12→13) / requirements §1.3。**L7 を実装上限と仮定する全 invariant を洗い、
   1 変更ごとに `bun test` 全件で blast radius 実測**してから commit (append-only + 独立 commit)。
   `ROUTE_MODE_ALLOWED_KINDS` への `verify:["verify"]` 追加は本 envelope と同 commit で。
2. **右肺 doc 3 点セット標準化** — Step 4.2 (L8/L9/L10/L12/L14、doc ごと並列)。
3. **gate_runs / quality-loop 配線** — Step 4.3 (L7-363 統合) / Step 4.4 (L7-367 統合)。
4. **Step 5 fullback Reverse** — concept/requirements への「右肺=品質保証 plane」back-fill +
   再発防止 lint (3 点セット存在 / roadmap 対応 / 粒度一致 / pair_artifact schema)。
5. **Stage 2 = L7-336 活性化** — 無宣言 fail-open 一般 (src 202 箇所) の warn/fail 化。独立サイクル burn-down。

### 2026-07-08 Codex 実装結果 (verify kind/layer envelope)

残実装 1 の **verify kind/layer envelope** を実装した。`VALID_KINDS` は 13 種となり、`kind=verify` は
L8-L14 のみ許可、`workflow_phase` / `layer=cross` へは入れない。`PLAN-L<N>-...` の L token と
frontmatter `layer` の不一致も fail-close にした。

実装面:

- `src/schema/index.ts` / `src/schema/frontmatter.ts`: `verify` kind、L8-L14 layer band、L-token↔layer 整合。
- `src/plan/lint-policy.ts` / `src/plan/lint.ts`: `route_mode=verify` は `kind=verify` のみ許可し、verify の
  kind-layer mismatch を `verify:<layer>:expected_L8-L14` として surface。
- `src/lint/branch-kind.ts`: `verify/*` branch prefix を追加し、`kind=verify` PLAN だけを許可。
- `src/lint/forward-convergence.ts`: `verify` を Forward 収束 scope に含め、未集約 landed verify PLAN を検知。
- `src/schema/route-map.ts` / `src/schema/mode-catalog.ts`: `verification_plan` / `quality_assurance` /
  `test_plan` / `right_lung` / `verify` を Verify mode へ routing。
- `docs/process/modes/verify.md` と process/design 正本を追加・同期。

外部参照 `Vモデル設計ドキュメント.zip` は 2026-07-08 に再展開して確認済み。A-185 §E に、原本構成、
`validate` / `check` / `coverage` / `deps` 実行結果、右肺抽出の妥当性を追記した。抽出結論は維持:
参照カタログは 06-09 層別テスト設計の上位に `12_テスト計画書` + `28_検証設計書` を持つため、
RECOVERY-10 の「右肺 = ③テスト設計 + 検証戦略 + 検証設計」への抽出は正しい。

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
- [x] L8-L14 layer を取れる検証 kind が schema/lint に存在し、`ut-tdd plan lint` が受理する。
- [ ] 右肺 doc 全件に検証戦略節があり、doctor が fail-close 検査する。
- [ ] 検証所見→refactor/reverse 発火→Forward 合流の defect_routing が機械記録される。
- [ ] concept/requirements への back-fill Reverse が起票される (exit 条件)。
