---
plan_id: PLAN-RECOVERY-04-roadmap-definition
title: "PLAN-RECOVERY-04 (recovery): 工程表の定義の前提欠落 — 人間向け全プログラム台帳へ収束 + 製本化 fullback"
kind: recovery
layer: cross
drive: fullstack
status: completed
created: 2026-06-11
updated: 2026-06-11
accepted_by: PO
accepted_at: "2026-06-11"
accept_evidence: .ut-tdd/audit/A-131-recovery-04-closure-accept.md
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: aim
    slot_label: "AIM — recovery 観点 (工程表定義の網羅性 / human-AI plane 分離 / 全プログラム被覆の再発防止 = 定義の anchor 化) のレビュー"
  - role: tl
    slot_label: "TL — reopen point 判定 (concept/metamodel 定義から / 既存 roadmap schema・registry 非破壊) の確認"
  - role: po
    slot_label: "PO — Recovery スコープ承認 (工程表定義の確定、製本化先 governance、Reverse 設計書 pairing、closure)"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-04-roadmap-definition.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/process/modes/recovery.md
    - src/schema/roadmap.ts
    - docs/plans/PLAN-DISCOVERY-05-roadmap-registration.md
    - docs/plans/PLAN-REVERSE-44-roadmap-definition-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence:
  - reviewer: PO/directive
    review_kind: human
    tests_green_at: "2026-06-11"
    reviewed_at: "2026-06-11"
    verdict: approve
    scope: "PO directed (2026-06-11) that the 工程表 definition gap is a Recovery ticket: 製本化して governance へ戻し、設計書は Reverse で書く。This PLAN is confirmed for correction routing, not closed."
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: pass-with-fixes
    scope: "RECOVERY-04 closure-readiness adversarial review (reopen point 妥当性 / 製本化 substance / 再発防止機械担保 / band 登録 fullback リスク / closure 条件充足)。blocker なし、§5 への 2 加筆 (verification・cutover 明示 defer + park-wiring carry to REVERSE-44 Step3) を closure 前条件として指摘 → 本コミットで反映。cross-agent 不在のため intra_runtime_subagent 代替 (claude-only)。"
---

# PLAN-RECOVERY-04 (recovery): 工程表の定義の前提欠落 — 人間向け全プログラム台帳へ収束 + 製本化 fullback

> **駆動モデル = Recovery** (concept §2.5 / recovery.md)。PO 対話 (2026-06-11) で **工程表の定義そのものの前提欠落**が判明 → ad-hoc 編集を止め、Recovery で「上から doc 修正 (製本化) → governance フィックス → 設計書は Reverse (PLAN-REVERSE-44) へ pairing → fullback」する。PO 指示「リカバリー起票で製本化して戻して設計書もリバースで書いて」(2026-06-11) に基づき起票。[[feedback_recovery_mode_for_premise_gap]] / PLAN-RECOVERY-02 と同型 (定義の前提欠落)。requires_human_approval = true。

## §1 事象記録 (Step 1: collect)

- **timestamp**: 2026-06-11
- **trigger classification**: **(c) 認識ずれ・前提誤読** (工程表の *定義* を取り違えて実装が進んでいた)。本番影響なし、severity P1 (foundational: 工程表は全プログラムの進行台帳の土台)。
- **収束のきっかけ**: PO が「実装は終わり?」と問うた際、PM が **doctor の工程表から機械的に答えられず draft PLAN 17 本を手分類した**。この「手分類が要る」こと自体が、工程表が全プログラムを台帳化できていない症状だった。
- **判明した定義の前提欠落** (PO 対話で確定):
  - **(a) 被覆範囲の誤り**: 工程表は「全プログラムを被覆する台帳」であるべきなのに、機械登録は **L7 の 2 本のみ** (PLAN-DISCOVERY-05 / PLAN-L7-44)。L4-00/L5-00/L6-00/L4-10 master hub は `roadmap` ブロック空、L0-L3 / L8-L14 / cutover は工程表なし。`src/schema/roadmap.ts` は `layer` 単一の PoC/spike 止まり。
  - **(b) 粒度の誤り**: 工程表の grain は **機能群＝結合テストレベル** (V-model 結合テスト⇔基本設計の対)。leaf の単体 V-pair (機能設計⇔単体テスト) と混同し、工程表自体の grain が未言語化だった。
  - **(c) human/AI plane の未分離**: **工程表 = 人間向け** (人間が見て「ここ担当するわ」と自己割当する進行台帳) / **PLAN (span) = AI 開発のオーケストレーション** (1機能群=スプリント: 依存洗い出し→難易度分類→agent 割当→並列/直列)。この plane 分離が定義に無かった。
  - **(d) フロント返却前提の欠落**: 工程表は **harness.db projection 経由で中央 UI (フロント) へ返す**前提で backend を準備すべき (backend-first、多人数共有)。定義が「機械登録」止まりで「人間向けに配る」を含んでいなかった。
- **基盤判定**: solo 開発の現況に合わせて縮めず、**「チームで別プロダクトを開発する基盤」のミッションで sizing** するのが正 ([[project_roadmap_human_ai_planes]] / [[feedback_judge_tooling_by_mission_not_self_scope]])。solo 向けに縮めるのは基盤の under-design。

## §2 認識確認 (Step 2: confirm) — 誤った扱い → 正しい扱い

| 誤った扱い (定義の前提誤り) | 正しい扱い (PO 2026-06-11 確定) |
|---|---|
| 工程表 = L7 等の大層を gate+span 分解する PoC 機構 (L7 のみ適用) | 工程表 = **全プログラムを被覆する人間向け進行台帳** (全バンド + cutover + L8-L14 が並ぶ) |
| 工程表の grain と leaf を曖昧に「§工程表 Step = 手順」 | 工程表 grain = **機能群/結合テスト**、leaf = **機能設計⇔単体テスト仕様書 (単体 V-pair)**。別 grain |
| 「全部出すように PLAN を起票して進める」 | **PLAN は工程表の中の区間 (span) = AI オーケストレーション**。定義の修正手段ではない (粒度違反) |
| 工程表は機械登録できれば良い | **人間が自己割当でき、フロント (中央UI) へ返せるよう backend を準備**して 1 セット |

> PO 認識確認は本対話で完了。承認前の ad-hoc 編集はせず Recovery を通す。

## §3 正常化ポイント (Step 3: locate reopen point)

- **reopen point**: **concept/metamodel の「工程表の定義」** (L0 governance 層)。要求・実装した roadmap 機構 (schema/registry/doctor) 自体は誤っていない。誤りは「定義が L7-scoped PoC のまま全プログラム台帳へ一般化されず、human/AI plane・フロント返却が未定義」だった点。
- **top-down 修正範囲**: 工程表の定義 (concept/requirements/metamodel) → そこから設計書 (L4 基本設計 / L6 機能設計) を Reverse (PLAN-REVERSE-44) で back-fill → harness.db projection の口 → doctor の全プログラム被覆チェック。
- **過剰に上流へ戻さない**: 要求 (L1/L3) は正。reopen は metamodel 定義層に留め、実装済 roadmap 機構は非破壊で拡張する。

## §4 top-down 修正 = 製本化 (Step 4: fix)

1. **製本化して戻す (本 Recovery 内)**: 確定した工程表定義を **governance/concept** へ back-merge する。
   - concept_v3.1: 工程表の定義 (人間向け全プログラム台帳 / 機能群=結合テスト grain / human-AI plane / フロント返却) を metamodel 節へ明記 + §10 用語集へ語を登録。
   - requirements_v1.2: 工程表の被覆要件 (全プログラム被覆・フロント projection) を機械要件として降下。
2. **ワークフロー (process docs) 伝播**: 工程表の定義変更は **workflow も変える** (human/AI plane で「工程表=人間が自己割当 / PLAN=AI オーケストレーション」が確定するため)。top-down 修正は governance だけで止めず **docs/process (forward / modes / gates)** まで降ろす — Forward 降下の中で工程表が全プログラム台帳としてどう機能するか、各駆動モデル (Add-feature / Reverse 等) が工程表の区間 (span) をどう起こすか、を process 正本へ反映する (規範変更は concept/requirements 先行 → docs/process へ反映の順、recovery.md 冒頭原則)。
3. **設計書は Reverse へ pairing**: L4 基本設計 / L6 機能設計の設計書は **PLAN-REVERSE-44-roadmap-definition-design** で書く (本 Recovery の §5 再発防止と pairing、`references` で相互参照)。
4. **DISCOVERY-05 PoC の正規化**: spike を「採用」へ進める S4 判断は PO scope 承認の一部 (本 Recovery の closure)。

## §5 再発防止 (exit MUST)

- **root cause**: 工程表が **L7-scoped PoC spike のまま一般化されず**、かつ「工程表が全プログラムを被覆しているか」を機械が見るチェックが無かった (柱3 state DB 完全性の穴)。定義 (人間向け台帳・plane 分離・フロント返却) が未言語化で、実装が L7 だけに閉じても誰も fail させなかった。
- **具体的仕組み変更 (guard/test/schema/rule、ファイル粒度 trace)**:
  - **(機械強制 / 新規)** `doctor` に **全プログラム被覆チェック**を追加: forward の各バンド (L0-L3 / L4-L6 / L7 / L8-L14 + cutover) に対応する工程表 (roadmap ブロック) が登録され、未登録の forward work を surface する。降下先 = `src/doctor` + `src/lint`、test = 新規 (実 repo で未登録バンドを fail-close)。**本 Recovery では設計を確定し、実装は REVERSE-44 → 後続 Forward/Add-impl へ trace** (carry、§6)。
  - **(schema)** `src/schema/roadmap.ts` を全プログラム被覆へ拡張 (layer 単一 PoC → program rollup 可能化)。REVERSE-44 の L6 機能設計で確定。
  - **(rule / 製本)** 工程表定義を concept/requirements に製本化し、living glossary へ語を登録 (§4)。
- **L14 route**: 全プログラム被覆チェックの運用検証 = L14 フィードバック。carry 先 = REVERSE-44 + 後続 Forward PLAN。

### §5 carry (closure 前 review 前置の指摘反映、2026-06-11 intra_runtime review)

review 前置 (pmo-sonnet、cross-agent 不在の intra_runtime 代替) の closure-readiness 審査で「blocker なし / 条件付き」と判定され、closure 前に PM 側で明示すべき defer を下記へ正規 defer 様式 (carry plan_id 紐付け、IMP-074 パターン) で宣言する。

- **verification (L8-L14) / cutover バンドの明示 defer**: 両バンドは **forward 未降下で登録対象 PLAN が皆無**のため、本 Recovery では工程表登録しない (明示 defer = under-design でない、concept §3.1.3.1)。
  - verification (L8-L14): forward が L8 以降へ降下した時点で当該 Forward PLAN が工程表を起こす (carry 先 = 後続 Forward、descent 時に登録)。
  - cutover (HELIX→UT): **PLAN-L7-44 (harness.db) close 後の射程**。cutover 戦略 doc が stale (ADR-001 前提ズレ) のため Reverse back-fill を先行 (carry 先 = cutover 工程表化 + cutover doc Reverse、§4 carry の stale doc と同件)。
- **park 機構 (`parkedBandIds`) の配線**: `analyzeProgramCoverage` は `parkedBandIds` 引数を持ち、doctor `checkRoadmap` は `PARKED_BANDS` を渡して hard/fail-close 判定する。park 宣言外の uncovered band は `runDoctor.ok=false` になる。
- **requirements 降下の着地**: §4.1 が宣言した requirements_v1.2 への被覆要件降下を本コミットで **§G.E3 (program coverage / doctor program-coverage)** として着地 (claimed-but-not-landed の解消)。

## §6 exit 条件

Recovery close には以下が必要。

- [x] 事象 collect (Step 1) + PO 認識確認 (Step 2)。
- [x] reopen point 確定 (Step 3 = concept/metamodel 定義層)。
- [x] 製本化 (Step 4): concept §10.2 へ工程表定義 (工程表(roadmap) / §工程表(PLAN内) / human/AI plane / 全プログラム被覆 / program rollup) を back-merge + 用語登録 (glossary green)。
- [x] Reverse pairing: PLAN-REVERSE-44 起票。設計書 (L4) は architecture §3.1 へ roadmap メタモデル back-fill 済、L6 詳細は REVERSE-44 tracked scope。
- [x] 再発防止: **全プログラム被覆チェック実装済** (`src/lint/roadmap-registry.ts` `analyzeProgramCoverage` + `PROGRAM_BANDS` 単一正本 + doctor `program-coverage` surface + `tests/roadmap.test.ts` U-ROADMAP-015〜018)。未登録 forward work (upstream/design/verification/cutover) を機械 surface = 「実装どこまで?」answerable (柱3)。
- [x] reopen point 独立確認 (review 前置): pmo-sonnet (intra_runtime_subagent、cross-agent 不在の代替) が closure-readiness を adversarial 審査 → **blocker なし / 条件付き** (§5 carry 2 件を反映)。cross-agent 不在は evidence に明示。
- [x] **PO scope/closure 承認** (2026-06-11 PO directive「1承認で…進めて」、`.ut-tdd/audit/A-131-recovery-04-closure-accept.md`)。
- [x] fullback (全バンドの工程表登録 完遂): **descended 登録** = design (L4-00/L5-00/L6-00 master の `roadmap:` ブロック) + upstream (PLAN-L3-00-master 新規)。program-coverage 1/5 → 3/5。**future 明示 defer** = verification (L8-L14 forward 未降下) / cutover (harness.db close 後の射程) を §5 で正規 defer。全 5 バンドが「登録 or 明示 defer」で account 済。

本 PLAN は **completed** (PO closure 承認 + fullback 完遂、A-131)。残 carry = park 機構配線 + program rollup (REVERSE-44 Step3、Codex 実装。verification/cutover の uncovered warn → parked 表示はこの impl 後)。

## 用語更新 (§G.9)

- **工程表 (roadmap)**: 機能群を結合テスト粒度で並べた、人間が自己割当でき中央 UI へ返す **全プログラム進行台帳**。← 旧「大層を gate+span 分解する機械登録機構 (L7 PoC)」から定義拡張。
- **human/AI plane**: 工程表=人間向け (自己割当) / PLAN(span)=AI 開発オーケストレーション、の責務分離。
- → concept §10 用語集へ back-merge (製本化 Step 4、PLAN-REVERSE-44 と pairing)。
