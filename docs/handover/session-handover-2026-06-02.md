# Session Handover — 2026-06-02 (PLAN-DISCOVERY-04 完遂 + V7 drive 概念欠陥の発見)

> 前 handover (`session-handover-2026-06-01c.md`) の続き。本 session は **PLAN-DISCOVERY-04 (docs/process ワークフロー整備の Discovery) を Step2-6 まで完遂 (S4 confirmed)**、終点 Reverse を起票。途中 PO 指摘で **V7 = `drive` 概念の構造欠陥**を発見し gap register へ。

## §0 現在地 (一言)

PLAN-DISCOVERY-04 **完遂 (S4 confirmed)** + 終点 `PLAN-REVERSE-01` 起票 + **V7 (drive 概念欠陥) を REVERSE-01 R0→R3→実装まで完遂**。docs/process spike (forward L0-L14 + 駆動モデル9種 + gates + 4軸 README) 起草・dogfood・self-review 済。**V7 実装 = `VALID_DRIVES` を 9→5 種 (専門職: be/fe/fullstack/db/agent) に縮小、scrum/reverse/poc/troubleshoot 除去、5 PLAN を fullstack に migration、requirements §1.6/§1.1 + docs/process + modes台帳 同期**。HEAD = `6c006e5`、main clean (untracked 2件は維持)、**vitest 71 pass / tsc 0 / 変更ファイル biome クリーン**。**ゴール「駆動モデル群が的確に動く状態」= drive 軸 mechanical に達成**。残 = V1/V2/V4 routing + docs/process 正本化 (PROVISIONAL 外し)。

## §1 本 session 進捗 (時系列)

1. **Step2 (`662e916`)**: 駆動モデル 9 種 (discovery/scrum/reverse/recovery/incident/refactor/retrofit/add-feature/research) を `docs/process/modes/` に 1 ファイル 1 モードで spike 起草 + 正本台帳 `modes/README.md` + `gates.md` (G0.5-G14)。pmo-sonnet 2 並列委譲→PM review。なぞらず UT-TDD taxonomy へ翻案 (mode≠kind 非1:1)。schema 整合 3 件 + 翻案誤り 2 件 是正。
2. **Step3-4 (`662e916`)**: 自 repo L1-L6 実 PLAN + 実使用 mode に dogfood。回った (sub-doc/frontmatter/V-pair 整合) + 詰まり V1-V4 を PLAN §S2-S3 に記録。
3. **Step5 (`662e916`)**: code-reviewer self-review = APPROVE-with-fixes (Critical 0)。Important 4 + Minor 2 是正。
4. **Step6 cycle1=pivot (`9dc59e6`)**: PO が S4 で pivot。理由 = 言語化不足 (4軸 kind/layer/drive/workflow_phase を PO が読めない)。改修 = `docs/process/README.md` 新設 (process dir 入口 + 4軸 PO-legible 定義)。
5. **Step6 cycle2=confirmed (`fa921ee`)**: legible 化後 PO confirmed。frontmatter S4/confirmed/completed。終点 `PLAN-REVERSE-01-process-docs` 起票。
6. **V7 発見 + drive 表是正 (`fa921ee` `c44db21`)**: PO 指摘で drive 概念の構造欠陥を発見 (§2)。

## §2 ⭐ V7: `drive` 概念の構造欠陥 → **再設計・実装済 (2026-06-02)**

PO の連続指摘で確定し、本 session で再設計・実装完了 (`6c006e5`)。**`drive` (§1.6) は「どの専門職 (specialist) / 専門エージェントを招集するか」が本質**だが、旧定義に 3 欠陥:

1. **命名衝突**: 英語 drive=「駆動」、「駆動モデル」(mode, §2.5)= literally "drive model"。別軸なのに同一語根で混同必至。
2. **値の重複**: §1.6 `VALID_DRIVES` 9種に `scrum/reverse/poc/troubleshoot` (= 駆動モデル名/状況) が混在。専門職 (be/fe/fullstack/db/agent) と mode 値が同居。
3. **誤ラベル**: §1.6 が `scrum=仮説検証` と記すが誤り。仮説検証=Discovery(drive=poc)、Scrum=ユーザー協業で要件反復。

**あるべき姿 (PO framing)**: drive=専門職 5種のみ。`scrum/reverse/poc/troubleshoot` は mode 側へ。recovery drive=復旧対象 work の専門職継承 (PLAN-RECOVERY-01=fullstack が正、§1.6 `recovery→troubleshoot 固定`は誤り)。

**⚠ 影響大**: §1.6 VALID_DRIVES から poc/reverse/scrum/troubleshoot を外すと、**現存 PLAN (DISCOVERY-01..04=drive:poc 等) が全件 fail**。schema (src/schema VALID_DRIVES) + 多数 PLAN の migration を伴う L3 design 作業。**PO sign-off 必須の escalation**。→ `PLAN-REVERSE-01` §2 V7 で `forward_routing=L3` (requirements §1.6 再設計) へ routing 済。関連 memory: [[feedback_drive_is_specialist_not_mode]] / [[project_kind_drive_matrix_not_enforced]]。

## §3 Next Action (順序付き)

| # | action | 状態 |
|---|--------|------|
| 1 | **V7 = drive 軸再設計** (§1.6 5種化 + 5 PLAN migration + docs 同期) | ✅ 実装済 (`6c006e5`)。PO 追認: migration default=fullstack 可否 / mode↔drive 呼称分離 |
| 2 | **成果物契約/カバレッジレビュー** (Reverse+Forward workflow、REVERSE-01 §2.1 V8-V16) | ✅ critical (`c203d32`) + V12/V14 (`aeaf15e`) 修正済。V8-V11/V13/V15/V16 carry |
| 2b | **L2 skip / サービス選択レビュー** (deep archetype workflow、REVERSE-01 §2.1 V17-V19) | ✅ V17/V18 (§G.3/§G.13/§H.6 を §3.7 UI有無判定に整合 + db行) 修正済 (`5dfbb29`)。**結論: 設計書=固定普遍+サービス選択の併存、選択は既に発生。drive5種は Web/API には十分・非Webに粗い。service_profile enum 新設は不採用、UI-presence 宣言化を段階導入** (第1段=reasonテキスト判定済 / 第2段=has_ui flag→R4→L3 carry)。非Web archetype観点→DISCOVERY-01 backlog |
| 2c | **全駆動モデル 発火点/収束点/起票ルール 監査** (audit workflow 50 agents、37/45 confirmed、REVERSE-01 §2.2) | ✅ 安全な不備修正済 (`7807cf4` `5b7bd3a`): incident F0-F4→R0-R4 / scrum signal / **add-feature layer fail-close (add-design→L3-L6/add-impl→L7)** / docs/research 実体化 / README runaway整合 / **§1.10.A に mode legibility 設計明文化**。残り = B(正本改訂 R4→L3): Discovery/Research named signal・interrupt routing・scrum_type 実装+enum・Research role §1.8・Incident 2-PLAN分割・exit機械検証 / C(PO判断): **forward_routing enum L7拡張 / runaway alias可否 / 全mode ID-legible token拡張可否** |
| 3 | **REVERSE-01 R2-R4 正本化**: V8-V11 (reverse ③ 復元機構・再入gate義務・generates契約・③所有hub) + **V13 R4→L3 で requirements §G.6 改訂 (脅威モデル/arc42§7/§8)** | ⬜ **次の主線** |
| 4 | gap V1 (forward_routing enum L7/fullback) / V2 (docs/research tree) / V4 (sub-doc拡張) を REVERSE-01 R4 で routing + docs/process 正本化 (PROVISIONAL 外し) | ⬜ |
| 5 | ③ 所有 hub 起票 (L1-00/L3-00 未起票、§G.13 triage) + lint 実装 (pair_artifact 条件付き必須 / path→type 検証 / kind×drive matrix ペア検証、[[project_kind_drive_matrix_not_enforced]]) | ⬜ |

## §4 ⚠ 壊さない / 再発させない

- **docs/process は spike (PROVISIONAL)**。正本化は REVERSE-01 が dogfood 実績から行う。spike を正本と誤読しない。
- **drive ≠ 駆動モデル**: drive=専門職 5種 (§1.6、再設計済)、駆動モデル=mode (§2.5、modes/)。両者を区別。横断駆動の drive は対象 work の専門職を継承。
- **§1.6 VALID_DRIVES = 5種 (専門職)**。enum から値を外す/足す際は既存 PLAN migration を先行 (§G 順序、破壊回避)。
- **untracked 維持**: `helix-process/` `ai-agent-harness-directory-reference.md` は commit 禁止 (`git add <path>` か `-u`)。
- **self-review 前置 MUST** / **subagent model 明示** / commit footer = `Co-Authored-By: Claude Opus 4.8 (1M context)`。main 直 commit 可 (solo)。

## §5 本 session commit (時系列、全 main)

- `662e916` DISCOVERY-04 Step2-5 (modes/9種 + gates.md + dogfood/verify + self-review)
- `9dc59e6` S4 cycle1=pivot — 4軸 legibility 入口 (process/README) 追加
- `fa921ee` S4 cycle2=confirmed + PLAN-REVERSE-01 起票 (V7 drive 概念歪み)
- `c44db21` drive 表の誤記是正 (scrum≠仮説検証) + V7 誤ラベル facet
- `a7840d6` REVERSE-01 を R3 まで駆動 — V7 drive 軸再設計 intent 起草
- `a3b44bc` handover 更新 (R3 intent 駆動済み)
- `6c006e5` **feat(schema)!: V7 drive 軸を専門職5種に再設計 (mode値除去) — 実装**
- `c203d32` fix: PLAN-REVERSE-01 に confirmed_reverse_type=design (validator fail-close 解消)
- `8d3b133` docs: REVERSE-01 §2.1 に成果物契約/カバレッジレビュー所見 V8-V16 記録
- `aeaf15e` fix: V12 L4-L6 設計PLAN 16件 artifact_type→design_doc + V14 L7テスト設計 layer 是正
- `f128e63` docs: REVERSE-01 §2.1 に L2 skip/サービス選択所見 V17-V19 記録
- `5dfbb29` **fix(requirements): L2 skip 機械検証を §3.7 (UI有無判定) に整合 + db行 (§G.3/§G.13/§H.6)**
- (memory) `feedback_no_askuserquestion_no_gap_numbers` 追加 (PO: AskUserQuestion 使うな + 番号で聞くな)
- `02d9f17` feat(process): Reverse に ③テスト設計復元機構 + 再入 Pair freeze gate 義務
- `7807cf4` fix(process): 駆動モデル監査 — 安全不備修正 (incident/scrum/add-feature guard/research) + §2.2 記録
- `5b7bd3a` fix(requirements): plan_id mode legibility 設計を §1.10.A 明文化 + README runaway 整合

## §6 未了の PO 判断事項 (escalation 済)

1. **V7 PO 追認** (実装済、方向は PO 確定。残: migration default=fullstack の可否 / mode↔drive 呼称分離)。
2. PLAN-DISCOVERY-01 の S4 decision_outcome 未確定 (メタモデル PoC、別件)。
3. HELIX 離脱 (cutover) タイミング。
4. §9.1 先在乖離 (別 follow-up)。
