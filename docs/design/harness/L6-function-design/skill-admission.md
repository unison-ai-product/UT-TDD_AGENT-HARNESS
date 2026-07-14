---
layer: L6
sub_doc: function-spec
artifact_role: topic_skill_admission
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l1_functional: docs/design/harness/L1-requirements/functional-requirements.md
extends: docs/design/harness/L6-function-design/skill-index.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-67-skill-admission-gate.md
---

> **L6 契約マーカー**: `analyzeSkillFit`、`computeSkillNovelty`、`analyzeDecisionPoints`、`repairSkillCandidate`、`resolveAdmission`、`analyzeSkillSupersession`、`renderSkillCatalogIndex`、`analyzeAdmissionCoverage` は unit-test 粒度の契約である。DoD の pre/post/invariant は `docs/test-design/harness/L7-unit-test-design.md` §1.24b `U-SKILL-ADMIT-001..009` に対応する。judge dispatch は純関数ではなく runtime orchestration であり、CI/doctor 経路には入れない（§8）。

> **SSoT 参照**: 索引モデル = [skill-index.md](./skill-index.md)（本 doc はその add-design 拡張） / review tier 原則 = [concept §2.1.2.1](../../../governance/ut-tdd-agent-harness-concept_v3.1.md) / 再利用実装 = `src/gate/review-tier.ts`・`src/schema/index.ts`（`checkCrossAgentModelPair`）・`src/lint/plan-supersession.ts`・`src/skill-scoring/scoring.ts`（`metadataOverlap`/`scanSkillCatalog`）・`src/lint/skill-assignment.ts`（`analyzeSkillAssignments`）・`src/skill-engine/{recommend,scaffold}.ts`・`src/cli.ts`（`advisor`/`gate`/`skill`）。

# L6 機能設計: スキル取り込みゲート (skill admission gate)

## §0 位置づけ

`skill-index.md`（PLAN-L7-211 で material 化、status=confirmed）は「skill をどの軸で検出・推薦・生成するか」を確定した。本 add-design はその続きで、**新規 skill を harness へ取り込む入口（admission）を機能設計する**。取り込み判定は 4 種（admit-new / repair-then-admit / merge-supersede / reject）で、判定・修正案生成は機械化するが、**導入・却下の確定は台帳へ記録**する。

継続元 FR: **FR-L1-19**（Learning Engine の「skill 破棄・改修自動化、閾値以下を廃止候補フラグ、削除は人間確認必須」）/ **FR-L1-12**（工程連動 skill 注入・`skill suggest`）/ **FR-L1-24**（Add-feature）。本機能特有の「品質 3 要件 + 敵対的判定 gate」は既存 FR 群の L6 拡張として登録し、新規 FR は起こさない。

**設計原則（PO 凍結制約）**: 一から作らず既存部品の composition に限定する。新規実装は「4 decision の意思決定層」と「decision_points 構造 lint」に絞る。judge の主観で導入を許す fail-open を機構で塞ぐ（§6）。

## §1 目的 / TL;DR

新規 skill 候補を、次の**品質 3 要件**で審査して取り込む admission gate を機能設計する。

1. **視点拡張性（novelty）** — 既存カタログと照合して重複しない相対量。機械 overlap で測る。
2. **判断有用性（decision-usefulness）** — 「どの判断点でどの選択を変えるか」が反証可能な形で書かれているか。構造 lint + judge。
3. **ハーネス適合（harness-fit）** — skill.v1 索引整合・trigger 実効性・readability・工程整合。機械 lint。

gate は「判定（機械 + judge）→ 修正案生成（機械）→ 導入 / 却下 / 更新の確定（台帳記録）」を司る。**judge は導入権を持たず**、導入は機械 3 点合致でのみ default-closed に確定する（§5/§6）。索引は手保守を廃し、frontmatter を SSoT に機械生成する外部化カタログとする（§7.3）。

## §2 スコープ / 非目標

**スコープ（本 add-feature）**:
- 新規 skill 候補 1 件の admission 判定（4 decision）と台帳記録。
- 機械 fit / novelty / decision_points の決定論関数。
- CLI `ut-tdd skill admit`（judge dispatch を含む runtime 面）。
- doctor `skill-admission-coverage`（NEW-only fail-close、決定論残渣のみ）。
- frontmatter SSoT の外部化カタログ機械生成 + drift 検査。
- skill supersede の双方向強制（既存更新）。

**非目標（defer / OUT）**:
- 既存 54 skill の遡及審査。baseline 凍結し、新規のみ admission 必須（§7.4）。遡及は別 PLAN で漸進。
- `skill suggest` の推薦スコアリング変更（本 doc は入口のみ。推薦は skill-index.md のまま）。
- judge/LLM を CI・doctor の合否条件に入れること（§8、恒久 OUT）。
- SKILL_MAP.md の手保守継続（§7.3 で廃止・機械生成へ）。
- project skill（consumer 側 `.ut-tdd/skills/`）の admission 強制（配布境界 skill-index.md §5、当面 workflow/domain のみ対象）。

## §3 前提（upstream / 再利用 / ID）

**upstream 設計**:
- [skill-index.md](./skill-index.md)（索引キー・frontmatter 契約・scoring・配布境界）。
- [cross-review-enforcement.md](./cross-review-enforcement.md)（`same_model_approval: forbidden` / cross_agent distinctness）。
- concept §2.1.2.1（review tier 核心ルール）/ concept §10 用語集。

**再利用実装（新規 similarity/fit を書かない）**:
- `analyzeSkillAssignments`（`src/lint/skill-assignment.ts`）= harness-fit の索引整合。
- `metadataOverlap` / `scanSkillCatalog`（`src/skill-scoring/scoring.ts`）= novelty の overlap 計測。
- `checkCrossAgentModelPair`（`src/schema/index.ts`）= judge の worker≠reviewer provider 強制。
- `evaluateGateReview` / gate run evidence（`src/gate/review-tier.ts`・`src/gate/run-evidence.ts`）= 判定台帳と tier。
- `buildAdvisorDecision`（`src/cli.ts` advisor）= frontier judge の dispatch。
- `analyzePlanSupersession`（`src/lint/plan-supersession.ts`）= supersede 双方向強制の型。
- `scaffoldSkill`（`src/skill-engine/scaffold.ts`）= repair 後の frontmatter 生成。

**PLAN / ADR**: 本 add-design = PLAN-L6-67。add-impl は後続 L7 PLAN で実装する。back-fill は実装着地時に concept §10.3 用語 back-merge を含む Reverse pairing で扱う。関連 ADR: ADR-001（TS/Bun 実装境界）。

## §4 admission パイプライン（関数粒度 = 単体テスト設計粒度）

candidate（審査対象 skill ファイル）に対し、以下を決定論順で適用する。すべて純関数で CI 安全（judge のみ runtime、§4.5）。

### §4.1 `analyzeSkillFit(candidate, catalog) => SkillFitResult`（要件 3）
- **Pre**: candidate の frontmatter + 本文、既存 catalog entries（`scanSkillCatalog` 出力）。
- **Post**: `{ ok, violations: FitViolation[], repairable: boolean }`。violations は (a) `analyzeSkillAssignments` の索引違反、(b) readability（mojibake / U+FFFD / 半角カナ）、(c) trigger 衝突（既存 skill と同一 layer×drive で `triggers` token が過度に重なる）を合成する。
- **Invariant**: `analyzeSkillAssignments` を再実装せず委譲する（三重真実禁止）。`repairable` は索引欠損・frontmatter 正規化・trigger 語調整など機械修復可能な違反のみで true。

### §4.2 `computeSkillNovelty(candidate, snapshot, thresholds) => SkillNoveltyResult`（要件 1）
- **Pre**: candidate、**凍結カタログ snapshot**（admission 実行時点の catalog。gate 自身の過去 verdict を入力にしない）、`thresholds = { novel, duplicate }`（外部化 policy、§7.2）。
- **Post**: `{ maxOverlap: number, nearest: {id, overlap}[], band: "novel" | "ambiguous" | "duplicate" }`。`maxOverlap = max metadataOverlap(candidate, e) over catalog`。`band = maxOverlap < novel ? novel : maxOverlap >= duplicate ? duplicate : ambiguous`。
- **Invariant**: overlap は `metadataOverlap` に委譲（新規類似度実装禁止）。同入力→同出力（決定論）。novelty は**相対量**であり catalog なしには判定不能（要件 1 の本質）。

### §4.3 `analyzeDecisionPoints(candidate) => DecisionPointsResult`（要件 2）
- **Pre**: candidate の frontmatter/本文。
- **Post**: `{ present: boolean, nonGeneric: boolean, entries: DecisionPoint[], violations: [] }`。`decision_points` は `when-<状況> / choose-<A> over <B> / because-<根拠>` の構造項目とする。`present` は 1 件以上、`nonGeneric` は一般語のみの行（"be careful" / "適切に" / "状況による" 等の denylist）を含まないこと。
- **Invariant**: 判断有用性の「存在」と「非一般性」は**機械**が担保する（prose 判定に委ねない = PLAN-L7-89 の「反証可能 claim は実 test/構造で裏取り」と同型）。質の高低評価は judge が担うが、judge は admit 権を持たない（§6）。

### §4.4 `repairSkillCandidate(candidate, fit) => SkillRepairResult`
- **Pre**: candidate、`analyzeSkillFit` 結果（`repairable=true` の違反を含む）。
- **Post**: `{ repaired: SkillCandidate, appliedFixes: string[], residual: FitViolation[] }`。frontmatter 正規化（`scaffoldSkill` の生成規則に整合）・索引欠損補完・trigger 語正規化を適用し、修復不能な残違反を `residual` に返す。**本文の意味は書き換えない**（decision_points の中身生成はしない）。
- **Invariant**: 冪等（repaired を再入力すると appliedFixes 空）。`residual` が空でなければ repair-then-admit は成立しない。

### §4.5 judge dispatch（runtime orchestration、純関数でない・CI 非対象）
- CLI `ut-tdd skill admit` が §4.1–4.3 の機械判定を通過した candidate についてのみ、**cross_agent judge** を dispatch する（`buildAdvisorDecision` → frontier / `evaluateGateReview` tier）。
- judge の産出は `verdict ∈ { no_objection, flag, reject }` のみ。**admit は産出できない**。
- hybrid: worker≠reviewer provider を `checkCrossAgentModelPair` で強制。単一 runtime: `intra_runtime_subagent` に格下げし、**verdict は reject/flag のみ許可**（no_objection を出せない = 自己肯定で admit させない、§6）。
- judge 入力は §4.2 の凍結 snapshot + candidate に固定。verdict は比較対象 N 件の snapshot 付きで台帳記録（§7.1）。

## §5 4種判定の解決

### `resolveAdmission(input) => AdmissionDecision`
- **Pre**: `input = { fit, novelty, decisionPoints, judgeVerdict?, thresholds }`。
- **Post**: `AdmissionDecision.kind ∈ { admit-new, repair-then-admit, merge-supersede, reject, flag, needs-judge }` + `reason` + `evidenceRefs`。決定論。
- **判定表（default-closed、上から評価）**:

| 条件 | decision |
|---|---|
| `!fit.ok && fit.repairable` | `repair-then-admit`（§4.4 で修復 → 再評価） |
| `!fit.ok && !fit.repairable` | `reject` |
| `novelty.band == "duplicate"` | `merge-supersede`（§7.5、supersede 必須） |
| `novelty.band == "ambiguous"` | `flag`（人間判断、auto-admit しない） |
| `!decisionPoints.present \|\| !decisionPoints.nonGeneric` | `reject` |
| 上記いずれでもなく `judgeVerdict` 未取得 | `needs-judge`（judge 未 dispatch） |
| `judgeVerdict == "reject"` | `reject` |
| `judgeVerdict == "flag"` | `flag`（人間判断） |
| `judgeVerdict == "no_objection"` | `admit-new` |

- **Invariant（fail-open 封止の核心）**: `admit-new` ⟺ `fit.ok ∧ novelty.band=="novel" ∧ decisionPoints.present ∧ decisionPoints.nonGeneric ∧ judgeVerdict=="no_objection"（比較 snapshot 付きで台帳記録済）`。**judge 単独では決して admit-new に到達しない**（judge は veto/flag のみ）。1 つでも欠ければ admit しない（default-closed）。

## §6 fail-open 回避の機械的担保

過去の教訓（「観測鵜呑み = fail-open の看板替え = 禁止」/「反証可能 claim は実 test で裏取り」）に対し、本 gate は主観判定を次の 3 つの機械代理へ還元する。

1. **judge に admit 権を与えない** — §4.5/§5。judge verdict は reject/flag/no_objection のみで、no_objection は「veto しない」であって「admit する」ではない。admit は `resolveAdmission` の機械判定。
2. **novelty を相対測定へ還元** — §4.2。「その視点はなかった」を judge の感想でなく `metadataOverlap < 閾値` の数値で裏取り。duplicate は merge へ強制迂回。
3. **decision-usefulness を構造 lint へ還元** — §4.3。一般語のみの skill を機械で reject。judge は質を評価するが、存在・非一般性の担保は機械。

さらに **自己増幅の封止**: judge 入力を凍結 snapshot に固定し（§4.2）、admit した skill を即座に novelty 比較母集団へ戻さない（`scoring.ts` の `learningAdjustment` が runtime-provenance に限定して projection 自己増幅を防ぐのと同型の fail-close）。

## §7 台帳・quarantine・カタログ生成（state 配置）

### §7.1 decision 台帳
- 実体 = `.ut-tdd/skill_admissions/<candidate-id>.json`（`.ut-tdd/gate_runs/` と同格）。記録: candidate content hash、fit result、novelty（nearest N snapshot）、decisionPoints result、judge verdict + `worker_model`/`reviewer_model` + 比較 snapshot、最終 decision、reason、timestamp。
- harness.db へ projection（`skill_admissions` 系。既存 `skill_evaluations` に相乗りさせず別ライフサイクルとして分離）。

### §7.2 policy（外部化）
- 閾値・denylist は `.ut-tdd/skill-admission-policy.json`（機械入力、ハードコード禁止 = externalize-policy）。`{ novelty: {novel, duplicate}, genericDenylist: string[], baselineManifest }`。

### §7.3 外部化スキルカタログ（SKILL_MAP 手保守廃止）
- `renderSkillCatalogIndex(catalog) => string` は frontmatter を SSoT に索引一覧を**機械生成**する。SKILL_MAP.md は手保守を廃し、この生成物とする（admit 時に再生成、手編集禁止）。
- doctor が「committed カタログ == `renderSkillCatalogIndex` 出力」を drift 検査（§8）。これにより TL 指摘の「SKILL_MAP 手保守 drift = 潜在 fail-open」を根治する（生成物は frontmatter と常に一致）。
- 工程連動の動的絞り込みは従来どおり `skill suggest`（`applies_to` SSoT）が正本経路。本カタログは人間閲覧用の派生であり startup read には載せない。

### §7.4 baseline 凍結（NEW-only）
- `baselineManifest` = 既存 skill（現時点 54 件）の content hash 集合。admission 必須は **baseline に無い新規 skill のみ**。`impl-plan-trace`/`oracle-test-trace` の「NEW にのみ fail-close」型を踏襲する。

### §7.5 quarantine（却下 / scan root 外）
- 却下 skill は削除せず `.ut-tdd/skill_admissions/quarantine/<name>.md` へ隔離 + §7.1 台帳へ理由記録。
- **不変条件**: quarantine 先は skill scan root（`skills/` / `.ut-tdd/skills/` / `docs/skills/`）の**外**に置く。scan root 配下に置くと `loadSkillAssignmentDocs` が却下 skill を再び indexable として拾う再浮上バグになる。

### §7.6 supersede（既存更新）
- `analyzeSkillSupersession(catalog) => SkillSupersessionResult` は frontmatter `supersedes: [<name>]` と被 supersede skill 側の逆参照注記を双方向強制する（`analyzePlanSupersession` と同型、`{missingTargets, missingBackrefs}` を fail-close）。merge-supersede decision はこれを満たさなければ成立しない。

## §8 doctor 配線（NEW-only・決定論残渣のみ）

### `analyzeAdmissionCoverage(catalog, ledger, baseline) => AdmissionCoverageResult`
- **Pre**: 現 catalog（`scanSkillCatalog`）、台帳（`.ut-tdd/skill_admissions/`）、baseline manifest。
- **Post**: `{ ok, missingAdmission: string[], catalogDrift: boolean }`。baseline に無い skill で有効 admission 台帳を欠くものを `missingAdmission` に collect。`renderSkillCatalogIndex` 出力と committed カタログの不一致を `catalogDrift`。`ok = missingAdmission.length===0 && !catalogDrift`。
- **Invariant**: doctor が読むのは**決定論残渣**（台帳存在・機械 fit・overlap 数値・supersede 整合・カタログ drift）のみ。**judge/LLM を doctor・CI の合否に絶対入れない**（非決定性で CI が壊れる。判定は ingest 時の `ut-tdd skill admit` で実行し、doctor は残渣を検証）。gate/gate-run-coverage と同型の二段構成。

## §9 既存との非重複（reuse map）

| 本 gate の責務 | 委譲先（再利用） | 非重複の根拠 |
|---|---|---|
| harness-fit 索引整合 | `analyzeSkillAssignments` | 再実装しない。scaffold self-lint / doctor checkSkillAssignment と同一関数 |
| novelty overlap | `metadataOverlap` / `scanSkillCatalog` | 新規類似度実装なし |
| judge の cross-provider | `checkCrossAgentModelPair` / `evaluateGateReview` | cross-review-enforcement の再利用 |
| frontier dispatch | `buildAdvisorDecision`（advisor） | 専用 adapter 新設なし |
| supersede | `analyzePlanSupersession` 型 | plan-supersession 流用 |
| repair 後生成 | `scaffoldSkill` 生成規則 | 生成規則の再利用 |

**時間軸で責務境界を分離**: admission gate = **ingest 時点の一回きり意思決定**。doctor(checkSkillAssignment) = **継続不変条件**。skill suggest = **実行時どれを載せるか**。3 者は時制が異なり衝突しない。

## §10 用語更新

- **skill admission gate**: 新規 skill を harness へ取り込む入口。品質 3 要件で審査し 4 decision（admit-new / repair-then-admit / merge-supersede / reject）を確定する機構。
- **品質 3 要件**: novelty（視点拡張性）/ decision-usefulness（判断有用性）/ harness-fit（ハーネス適合）。
- **decision_points**: skill の判断有用性を反証可能に記す構造項目（`when / choose ... over ... / because`）。
- **novelty band**: `computeSkillNovelty` の overlap 帯（novel / ambiguous / duplicate）。
- **admission ledger / quarantine**: 判定記録と却下 skill の scan-root 外隔離。
- **外部化スキルカタログ**: frontmatter を SSoT に機械生成する索引一覧（SKILL_MAP 手保守の後継）。

→ concept §10.3 へ back-merge = PLAN-REVERSE-XX（Reverse pairing、次工程で起票）。

## §11 受入 / 検証基準（acceptance / verification）

- **AC-1（default-closed）**: `resolveAdmission` は §5 不変条件を満たす。admit-new は機械 3 点合致 + judge no_objection のときのみ。judge no_objection 単独では admit しない（U-SKILL-ADMIT で反証テスト）。
- **AC-2（fit 委譲）**: `analyzeSkillFit` は `analyzeSkillAssignments` を再実装せず委譲し、既存 checkSkillAssignment と同一結果を返す。
- **AC-3（novelty 相対）**: `computeSkillNovelty` は凍結 snapshot に対し決定論で band を返し、duplicate を merge へ迂回する。
- **AC-4（decision_points）**: 一般語のみの候補は `analyzeDecisionPoints` で reject される。
- **AC-5（quarantine 非再浮上）**: 却下 skill は scan root 外に隔離され、`loadSkillAssignmentDocs` が indexable として拾わない。
- **AC-6（NEW-only）**: `analyzeAdmissionCoverage` は baseline 54 件を fail-close せず、新規 skill の台帳欠落のみ fail-close する。
- **AC-7（カタログ drift）**: SKILL_MAP は `renderSkillCatalogIndex` 生成物と一致し、手編集は drift として fail-close。
- **AC-8（supersede 双方向）**: merge-supersede は `supersedes` + 逆参照が揃わなければ成立しない。
- **AC-9（CI に judge なし）**: doctor/CI は決定論残渣のみを見る。judge/LLM 呼び出しは CI 合否条件に現れない。
- **検証**: 上記は `docs/test-design/harness/L7-unit-test-design.md` §1.24b `U-SKILL-ADMIT-*` で検証（次工程でペア追記、孤児 0）。freeze-readiness = readability / `ut-tdd plan lint` / `ut-tdd doctor` exit 0 を pair-freeze 前に実行。

## §12 持ち越し・延期

- 既存 54 skill の遡及審査 = defer（NEW-only、別 PLAN で漸進、§7.4）。
- project skill（consumer 側）admission = defer（配布境界、当面 workflow/domain のみ）。
- provider 次元の厳密判定 = cross-review-enforcement.md §7 の carry を継承（model 文字列比較で代替）。
- judge の質評価ルーブリック詳細（no_objection/flag の境界プロンプト）= add-impl で確定（本 doc は権限境界のみ確定）。
