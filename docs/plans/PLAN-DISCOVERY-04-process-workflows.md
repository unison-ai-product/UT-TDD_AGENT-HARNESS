---
plan_id: PLAN-DISCOVERY-04-process-workflows
title: "PLAN-DISCOVERY-04 (kind=poc): docs/process ワークフロー整備の Discovery (Forward L0-L14 V-model 単位 + 各駆動モデル定義を 設計→仮実装→検証→確定)"
kind: poc
layer: cross
workflow_phase: S4
scrum_type: design-spike
drive: fullstack
status: completed
decision_outcome: confirmed
created: 2026-06-01
updated: 2026-06-02
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: aim
    slot_label: "AIM — Discovery 主導 (定義の検証・実証)"
  - role: po
    slot_label: "PO — 整備スコープ確定 + S4 decision_outcome"
  - role: tl
    slot_label: "TL — ワークフロー定義レビュー (別 runtime、claude-only 時は code-reviewer/pmo-sonnet 代替)"
generates:
  - artifact_path: docs/plans/PLAN-DISCOVERY-04-process-workflows.md
    artifact_type: markdown_doc
  # docs/process/{forward,modes,gates} の正本は終点後の PLAN-REVERSE-NN が生成 (§3.1)。
  # 本 Discovery が直接生むのは検証記録 (本 PLAN) + S1/S2 暫定 spike (使い捨て可)。
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-DISCOVERY-01-workflow-metamodel.md
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/repository-structure.md
    - vendor/helix-source/docs/v2/process/
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-DISCOVERY-04 (kind=poc): docs/process ワークフロー整備の Discovery

## §0 位置づけ

`docs/process/` は構成だけ実体化済 (`.gitkeep`)、中身ゼロ。本 PLAN は **Forward の V-model L単位ワークフロー (L0-L14) + 各駆動モデル (Discovery/Reverse/Recovery/Incident/Refactor/Retrofit/Add-feature/Scrum/Research) のワークフロー定義** を整備するための **Discovery**。

**運用配線 (PO 確定)**: docs/process の正本は forward で机上起草しない。**Discovery で実装してみて改善を回し (loop)、その終点 (S4) で Reverse を起票して dogfood 実績から docs を再整備し設計を修正 → Forward (L3) へ戻す**。本 PLAN は「正本を直接書く」のでなく「Reverse へ渡せる確証 (回った実績・gap) を作る」ところまでを担う (正本生成は終点後の `PLAN-REVERSE-NN`、§3.1)。

これは **kind=design ではなく Discovery (kind=poc)** で進める (PO 確定 2026-06-01)。理由: ワークフロー定義は紙上で確証を持って確定できない『設計』であり、PLAN-DISCOVERY-01 §1.1 (設計→仮実装→検証→確定) を適用し、**回しながら確定する**。なぞり (vendor 丸写し) 禁止、L3 要件レベルで起こす。

> **§6 用語更新 (§G.9) について**: §G.9 必須対象は design/impl/add-* PLAN。本 PLAN は kind=poc (Discovery) のため §6 用語更新節は不要 (対象外)。

> **DISCOVERY-01 との scope 差**: DISCOVERY-01 = workflow **メタモデル** が回るかの検証 (S4 待ち)。本 PLAN = その metamodel に沿って **実ワークフロー定義 (中身)** を整備し、定義が clean/網羅/非冗長に書けるかを検証。重複でない (新規 Discovery、PO 確定)。

## §1 前提 — 材料は抽出済 (本 PLAN で正本化)

vendor/helix-source/docs/v2/process + helix-process (untracked) から構造抽出済 (explorer):
- **Forward L0-L14**: 各層 目的 / V-pair (左腕 L1-L6 設計⇔右腕 L8-L14 検証) / gate G_N。
- **駆動モデル**: Forward(本体) + Discovery/Reverse/Recovery/Incident/Refactor/Retrofit/Add-feature/Scrum/Research、各 trigger / phase / exit / Forward 合流。
- **配置案**: `docs/process/{forward/, modes/, gates.md}` (repository-structure §2 準拠)。

> 抽出は research であり正本でない。本 PLAN で **なぞらず L3 要件レベルに翻案** して確定する。

## §2 何を検証 (hypothesis)

> 「メタモデル (①必須スケルトン L0-L14 + ②駆動モデル) を、実ワークフロー定義として `docs/process/` に書き起こすと、**各層/各駆動が 重複なく・層越境なく・過剰 process にならず・V-pair 対応が成立して** 定義できる」。

## §3 どう検証 (method)

設計→仮実装→検証→確定 (DISCOVERY-01 §1.1):
1. **S1 暫定定義**: forward/ (L0-L14) + modes/ (駆動モデル) + gates.md を暫定起草 (placeholder 許容)。
2. **S2 dogfood**: 自 repo の実工程 (L1-L5 で既に回した実績) を暫定定義に当て、定義どおり回るか手で照合 (実装してみて改善を回す loop)。
3. **S3 verify**: 詰まり/欠落/冗長/層越境/V-pair 不成立を観察・記録。
4. **S4 decide (= 終点 = Reverse 接続点)**: PO が `decision_outcome`。**confirmed なら本 Discovery の終点で Reverse を起票 (`PLAN-REVERSE-NN`) し、dogfood 実績から docs/process を再整備して設計を修正 → Forward (L3) へ戻す** (exit→fullback、§3.1)。pivot → 定義修正し再検証 / rejected → 破棄。

> **Discovery 終点 → Reverse 配線 (PO 確定 2026-06-01、メタモデル標準)**: docs/process の定義は forward で机上起草するのでなく、**Discovery で回して確かめた実績から Reverse で再整備する**。Discovery のゴールは「正本を直接書く」ではなく「Reverse へ渡せる確証 (回った実績・gap) を作る」こと。requirements §1.2 (confirmed → Reverse R0 起票) / DISCOVERY-01 §6 と同配線。

## §3.1 終点後の Reverse (fullback) — docs/process 再整備の本体

| 段 | 内容 |
|---|---|
| 起票 | DISCOVERY-04 S4 confirmed を受け `PLAN-REVERSE-NN-process-docs` (kind=reverse、R0-R4) を起票 |
| evidence (R0-R2) | ①自 repo dogfood 実績 (L1-L5 で実際に回った工程) + ②vendor/helix-source 既存 doc を evidence に as-is 復元 |
| gap (R3-R4) | 実績 ↔ あるべき定義の gap 抽出、`forward_routing=L3` で docs/process 正本へ接続 (`promotion_strategy` 選択) |
| Forward 合流 | docs/process/{forward,modes,gates} を L3 要件正本として確定 + recovery-workflow.md 移管判断 |

## §4 検証基盤

harness 自走前のため手動 + 既存 schema/frontmatter lint で回す。S1/S2 の暫定定義は **PoC spike (使い捨て可、`poc/*`)**。正本化は終点後の Reverse が dogfood 実績から行う (§3.1)。

## §5 成否基準

- **confirmed**: L0-L14 + 全駆動モデルが重複/層越境なく定義でき、V-pair 対応が成立、過剰 process 感なし (NFR-07)、既存 PLAN-DISCOVERY-01 メタモデルと整合 → **終点で Reverse 起票し正本化へ**。
- **rejected/pivot**: 定義に重複/欠落/層越境/V-pair 不成立があり metamodel 修正が要る → DISCOVERY-01 へ feedback。

## §工程表

### Step 1: S1 暫定定義 — Forward L0-L14 (forward/)

- `docs/process/forward/` に L0-L14 の V-model L単位ワークフローを暫定起草。各層: 目的 / 入口出口 / ① 設計成果物 / ③ ペアになるテスト設計層 / gate。左腕 (L0-L6) / 谷 (L7) / 右腕 (L8-L14) で分割 (explorer 配置案準拠、確証なき箇所は placeholder)。
- 状態: ✅ (overview + L00-L06 + L07 + L08-L14、`c695772`)

### Step 2: S1 暫定定義 — 駆動モデル (modes/) + gates.md

- `docs/process/modes/` に各駆動モデル (Discovery/Reverse/Recovery/Incident/Refactor/Retrofit/Add-feature/Scrum/Research) を 1 ファイル 1 モードで暫定起草。各: trigger / phase 構成 / exit / Forward 合流点。`gates.md` に G0.5-G14 を集約。
- 状態: ✅ (modes/ 9 種 + README 台帳 + gates.md、pmo-sonnet 2 並列委譲→PM review→翻案誤り 2 件 + schema 整合 3 件 修正)

### Step 3: S2 dogfood — 自 repo 実工程に当てて照合

- 自 repo が L1-L5 で実際に回した工程を暫定定義に照合し、定義どおり辿れるか・詰まる箇所を手で確認。
- 状態: ✅ (§S2-S3 dogfood 記録「回った」。L1-L6 sub-doc ⇔ 実 PLAN 整合 / 実使用 mode frontmatter 整合 / V-pair 成立)

### Step 4: S3 verify — 詰まり/欠落/冗長/層越境/V-pair を記録

- §5 基準で観察結果を本 PLAN に記録 (回った / 詰まった / refinement)。metamodel 欠陥か適用エラーかを分類。
- 状態: ✅ (§S2-S3 verify 記録。詰まり V1-V4 + 解決済 V5-V6。V1/V2 即是正、V3/V4 feedback 経路確定)

### Step 5: review (self-review 前置 MUST)

- PO へ S4 を求める前に **code-reviewer / pmo-sonnet** で定義の整合・重複・層越境・V-pair 成立を self-review (claude-only の tl 代替)。別 runtime 可なら tl-advisor。
- 状態: ✅ **code-reviewer self-review = APPROVE-with-fixes (Critical 0)**。Important 4 + Minor 2 を本 session で是正:
  - (Imp-1) README 台帳 Reverse の R3 po を承認者列へ移動 (owner=tl に整理)
  - (Imp-2) V3 に matrix 強制前 PO 確定必須の衝突リスクを明記 (既存 PLAN-RECOVERY-01 fail 防止)
  - (Imp-3) Incident layer `L7 (+cross)` → 内包 kind ごと正規 layer (troubleshoot=L7 / recovery=cross、複合値は schema 無効) に修正
  - (Imp-4) retrofit §4 に「設計層書き戻しは kind=add-design 別起票、retrofit は layer=L7 固定」注記
  - (Minor) discovery 承認者表現分離 / gates G8-G14 PLAN 未起票注記 / research V2 申し送り正本明記
  - good practice 評価: なぞり禁止徹底・V-pair 正本整合・gap 自己申告構造化

### Step 6: S4 decide (PO) = 終点 → Reverse 起票

- PO が `decision_outcome` 記録。**confirmed → 本 Discovery の終点として `PLAN-REVERSE-NN-process-docs` を起票** (§3.1)。docs/process の正本化は forward で直接書かず、Reverse 側で dogfood 実績から再整備する。pivot/rejected は §3 のとおり。
- 状態: ✅ **cycle1 pivot → 改修 → cycle2 confirmed (PO 2026-06-02)**。終点 `PLAN-REVERSE-01-process-docs` 起票済 (§S4 + V7 参照)

## §実装計画

| 項目 | 情報源 |
|---|---|
| Forward L0-L14 各層定義 | vendor/helix-source/docs/v2/process/L00-L14 + helix-process (なぞらず翻案) / concept v3.1 §2.3 V-model / requirements §1.4 VALID_LAYERS (L0-L14 + V-pair remap 表) |
| 駆動モデル定義 (9 種) | helix-process/*-workflow.md (Discovery/Reverse/Recovery/Incident/Refactor/Retrofit/Add-feature/Scrum/Research) / requirements §1.3 VALID_KINDS / §1.5 workflow_phase / concept §2.5 9-mode |
| gates.md (G0.5-G14) | explorer 抽出 gate 表 / docs/governance/gate-design.md / 各層 gate |
| 配置・分割 | docs/governance/repository-structure.md §2 (docs/process 置き場) + explorer 配置案 (forward/ modes/ gates.md) |
| 境界 (process vs design/harness) | self-review (pmo-sonnet) 画定済: docs/process=方法論定義、docs/design/harness=harness 自身の機能要件。混在禁止 |

## §S2-S3 dogfood + verify 記録 (Step3-4、decision は S4=PO)

forward spike (Step1) + modes/9種 + gates.md (Step2) を、自 repo の実工程 (L1-L6 PLAN 群 + 実使用 mode) に照合した所見。**詰まりは大半が metamodel/forward 骨格の欠陥でなく「なぞり由来の不整合」「schema 未実装」「tree 未登録」で、検証 (本 dogfood) が全件捕捉・記録できた** = §2 仮説 (定義が clean/網羅/非冗長に書け、逸脱を検証が捕捉する) を支持する方向。最終 verdict は S4 (PO)。

### 回った (hypothesis 支持)

- **Forward L1-L6 sub-doc 定義 ⇔ 実 PLAN 整合**: L1=5 sub-doc✓ (business/functional/screen/technical/nfr) / L3=3✓ / L4 core 4✓ (data/architecture/function/external-if) / L5 core 4✓ / L6=function-spec+edge-case✓。spike の各層定義が実在 PLAN の構造と一致。
- **実使用 mode の frontmatter ⇔ mode 定義 整合**: Discovery (DISCOVERY-01/02/03/04 = kind=poc/layer=cross/workflow_phase=S*)✓ / Recovery (RECOVERY-01 = kind=recovery/layer=cross/phase 無)✓。台帳の kind/layer/phase 値どおりに実 PLAN が起票されていた。
- **9 mode 翻案 + 層越境なし**: 9 mode を README 台帳で kind/drive/layer/phase/owner/承認者/Forward 合流に翻案でき、全 mode が `cross` or 正規実 layer に収まり層越境なし。
- **V-pair 成立**: forward overview の V-pair 表 (L1↔L14 / L2↔L10 / L3↔L12 / L4↔L9 / L5↔L8 / L6↔L7) が concept §2.3 / requirements §1.4 と一致、右腕 spike 各層の V-pair 列とも整合。
- **gate 集約**: G0.5-G14 を gates.md に集約、forward spike §7 と数値矛盾なし。承認境界 (§2.6.3) も台帳と一致。
- **regression**: vitest 全 pass (frontmatter / plan-id-naming 維持)。

### 詰まった / gap (= なぞり不整合・未実装・未登録。すべて検証が捕捉)

| # | 所見 | 種別 | 是正 / feedback 先 |
|---|------|------|--------------------|
| V1 | **forward_routing**: helix reverse は `L7` / `L8-L11`(fullback) へ routing するが、UT-TDD schema `VALID_FORWARD_ROUTING` = `L1/L3/L4/L5/gap-only` (5 種) に無い | なぞり × schema gap | reverse.md / README 台帳を **enum 整合に修正済** (本 session)。enum 拡張 (L7/fullback 経路) 要否は DISCOVERY-01 / schema へ feedback |
| V2 | **docs/research/** が canonical tree (repository-structure) 未登録・実体不在だが research.md が参照 | tree gap | research.md に **注記追加済**。配置先 (tree 追加 vs docs/adr 寄せ) は正本化 (Reverse) 時に repository-structure へ反映 |
| V3 | **Recovery drive**: 台帳/recovery.md = `troubleshoot` (§1.6 matrix `recovery→troubleshoot`) vs 実 PLAN-RECOVERY-01 = `fullstack` (確認済)。かつ **§1.6 kind×drive matrix は schema 未実装** (driveSchema は enum 9 種のみ検証、ペア未強制) | spec × 実使用 drift + 未強制 | mode 定義は §1.6 正本どおり (変更せず)。`recovery` が「復旧対象 work の drive を継承」か「troubleshoot 固定」かを **PO/requirements §1.6 判断** → 確定後 schema にペア強制を実装。**⚠ 衝突リスク: §1.6 を確定せず matrix 強制を先に実装すると、現存 PLAN-RECOVERY-01 (drive=fullstack) が即 fail する。matrix 強制実装は §1.6 定義確定を先行必須** (self-review Important-2) |
| V4 | L4/L5 に内部資産拡張 sub-doc (roster/skill-pack/drift-lint) が実在するが forward spike の L4/L5 sub-doc enum は base のみ列挙 | 網羅 (拡張点) 注記不足 | 正本化時に forward spike へ「内部資産系は add-design 拡張 sub-doc」注記 |

### 詰まりでない (翻案で解決済 / 設計意図)

- **V5 mode ≠ kind の非 1:1**: Incident は独立 kind を持たず `troubleshoot`+`recovery` 内包、Add-feature は `add-design`+`add-impl` 内包、Discovery/Scrum は同 `kind=poc` を drive で分離。→ 台帳 §2 で**明示済** (なぞらず翻案の核心、混乱要因でなく確認事項)。
- **V6 phase 命名「不統一」**: Discovery/Scrum=S0-S4 / Reverse=R0-R4 / 他=phase 無は **§1.5 の設計意図** (workflow_phase を持つのは poc/reverse のみ、recovery 等は phase 禁止が正)。不統一でなく仕様。

### S4 への申し送り (PO 判断材料)

メタモデル + forward/modes/gates 定義は「重複なく・層越境なく・V-pair 成立で・過剰 process なく」書けた (§5 confirmed 基準を満たす方向)。詰まり V1-V4 は **定義骨格の欠陥でなく**、①なぞり由来の schema 不整合 (V1)、②tree 未登録 (V2)、③matrix 未実装 (V3)、④拡張点の注記不足 (V4) で、いずれも本 dogfood が捕捉し V1/V2 は即是正、V3/V4 は feedback 経路を確定した。→ **confirmed (refinement 込み採用) が候補**。confirmed なら終点で `PLAN-REVERSE-NN-process-docs` を起票し V1-V4 を実績として正本へ反映。`decision_outcome` は S4 (PO 所有)。

## §S4 (cycle 1) decision = pivot (PO 2026-06-02)

PO は S4 で **pivot** を選択。理由は V3 escalation への回答に集約: **「drive の定義が分からん。何の話か説明が無いから判断できない」**。

**pivot の意味 (確定した学び)**: 詰まりは forward/modes/gates 定義の骨格でなく **「言語化不足」= spike が 4 軸 (kind/layer/drive/workflow_phase) を PO が読める形で定義していなかった**こと。台帳は drive を列見出しで使うのみで「drive とは何か」を説明していなかった。確証なき設計を確証ありと偽らず回して確かめる Discovery の趣旨どおり、**検証 (PO escalation) が言語化不足を捕捉**した (DISCOVERY-01 §7.1 「言語化不足→確定」と同型)。

**pivot 改修 (cycle 1 → cycle 2、本 session 実施)**:
- `docs/process/README.md` を新設 = **process dir 全体の入口**。§1 で 4 軸を PO-legible に定義 (kind=何をする/layer=どの工程/drive=どの技術軸/workflow_phase=横断局面)、drive 9 種を平易表で、4 軸組合せ規則 (排他/matrix) を明記。§2 読む順序、§3 中核 3 概念 (V-model / 入口分岐・出口一本 / 確証なき設計は Discovery)。
- `modes/README.md` 台帳に 4 軸用語 (../README.md §1) への入口リンク追加。
- V3 question は drive 未説明のまま escalation した PM 側の不備でもあった → cycle 2 では drive を文脈付きで再提示。

**cycle 2 verify (再検証)**: 4 軸が legible になった状態で定義群を再提示。骨格 (V1-V4 の是正/feedback 経路) は cycle 1 から不変、追加は legibility 層のみ。→ 再 S4 を PO に提示。

### §S4 (cycle 2) decision = confirmed (PO 2026-06-02)

PO は legible 化された状態で **confirmed** を選択。docs/process 定義群 (forward L0-L14 + 駆動モデル9種 + gates、V-pair 成立・層越境なし・過剰process なし) は §5 confirmed 基準を満たす。**終点として PLAN-REVERSE-01-process-docs を起票** (§3.1)、dogfood 実績 (V1-V4 + 下記 V7) から docs/process を正本化 → Forward(L3) へ。

### V7 (cycle 2 で新規顕在化、最重要): `drive` 概念の歪み — 命名衝突 + 値重複

PO の指摘:「**drive って専門職だろ？ そのタイミングで専門ワークフロー/専門エージェントを呼び出す以外の意味があるのか?**」「**駆動モデルのことを drive と言っているのか?**」。

**確定した所見 (PO framing が正、taxonomy 欠陥)**:
- **drive の本質 = 「どの専門職 (specialist) を招集するか」**。owner_role / mandatory_agents / orchestration_mode (§2.6.4) を決める = 専門ワークフロー/専門エージェント招集が本質。それ以外の意味はほぼない。
- **drive (§1.6) と 駆動モデル/mode (§2.5) は別軸として定義**しているが、**2 つの欠陥で混同必至**:
  1. **命名衝突**: 英語 "drive" の和訳 = 「駆動」、「駆動モデル」= literally "drive model"。同一語根。
  2. **値の重複**: §1.6 `VALID_DRIVES` 9 種に `scrum/reverse/poc/troubleshoot` が含まれ、これらは **駆動モデル名そのもの**。専門職 (be/fe/fullstack/db/agent) と mode 値が 1 つの enum に混在。
  3. **mode 値の誤ラベル** (PO 2026-06-02 追加指摘): §1.6 は `scrum | 仮説検証 (経路2専用)` と記すが**誤り**。**仮説検証は Discovery (drive=poc)**、Scrum は「ユーザー協業で要件を反復で固める」。requirements §1.6 の drive 説明文自体が mode の意味を取り違えている (drive を mode 概念で説明しようとして破綻)。
- **クリーンな姿 (PO framing)**: drive = 専門職のみ (be/fe/fullstack/db/agent)。`scrum/reverse/poc/troubleshoot` は駆動モデル (mode) 側へ寄せ drive から外す。命名も「駆動モデル」と区別 (例: drive→「担当 specialist」)。
- **V3 はこれで決着**: recovery の drive = 復旧対象 work の専門職 (fullstack 等) を継承すべき → PLAN-RECOVERY-01 (drive=fullstack) が正、§1.6 `recovery→troubleshoot 固定` の方が誤り。
- **feedback 先**: requirements §1.6 (VALID_DRIVES の再設計) + concept §2.5/§2.6.4 (drive↔mode の用語分離) + DISCOVERY-01 metamodel (drive 軸の定義)。**Reverse R4 `forward_routing=L3`** で requirements へ接続。docs/process/README §1 + modes/README 台帳 (drive 列) も正本化時に追随修正。

## §DoD (S1→S3 進行、S4 は PO)

- [x] Step 1-2: forward/ + modes/ + gates.md を S1 暫定起草 (forward 4 + modes 9 + README 台帳 + gates.md)
- [x] Step 3: S2 dogfood (自 repo 実工程に照合 — §S2-S3 記録)
- [x] Step 4: S3 verify 所見を記録 (V1-V6、§S2-S3 記録)
- [x] Step 5: self-review (code-reviewer) = APPROVE-with-fixes、Important 4 + Minor 2 是正済
- [x] Step 6: S4 = PO が decision_outcome 記録。**cycle 1 = pivot** (言語化不足: 4軸legibility) → pivot 改修 (process/README.md 4軸入口) → **cycle 2 = confirmed (PO 2026-06-02)**。終点として **`PLAN-REVERSE-01-process-docs` 起票済** (§3.1)。新規 V7 (drive 概念の歪み = 命名衝突 + 値重複) を gap register へ。docs/process 正本化は Reverse 側で dogfood 実績 (V1-V7) から実施
