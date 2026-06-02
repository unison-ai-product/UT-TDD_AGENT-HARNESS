# Session Handover — 2026-06-02 (PLAN-DISCOVERY-04 完遂 + V7 drive 概念欠陥の発見)

> 前 handover (`session-handover-2026-06-01c.md`) の続き。本 session は **PLAN-DISCOVERY-04 (docs/process ワークフロー整備の Discovery) を Step2-6 まで完遂 (S4 confirmed)**、終点 Reverse を起票。途中 PO 指摘で **V7 = `drive` 概念の構造欠陥**を発見し gap register へ。

## §0 現在地 (一言)

PLAN-DISCOVERY-04 **完遂 (S4 confirmed)**。docs/process spike (forward L0-L14 + 駆動モデル9種 + gates + 4軸 README) を起草・dogfood・self-review し、終点 `PLAN-REVERSE-01-process-docs` を起票。HEAD = `c44db21`、main clean (untracked 2件は維持)、**vitest 71 pass**。**最重要 open = V7 (drive 概念欠陥、§1.6 再設計が REVERSE-01 で要)**。

## §1 本 session 進捗 (時系列)

1. **Step2 (`662e916`)**: 駆動モデル 9 種 (discovery/scrum/reverse/recovery/incident/refactor/retrofit/add-feature/research) を `docs/process/modes/` に 1 ファイル 1 モードで spike 起草 + 正本台帳 `modes/README.md` + `gates.md` (G0.5-G14)。pmo-sonnet 2 並列委譲→PM review。なぞらず UT-TDD taxonomy へ翻案 (mode≠kind 非1:1)。schema 整合 3 件 + 翻案誤り 2 件 是正。
2. **Step3-4 (`662e916`)**: 自 repo L1-L6 実 PLAN + 実使用 mode に dogfood。回った (sub-doc/frontmatter/V-pair 整合) + 詰まり V1-V4 を PLAN §S2-S3 に記録。
3. **Step5 (`662e916`)**: code-reviewer self-review = APPROVE-with-fixes (Critical 0)。Important 4 + Minor 2 是正。
4. **Step6 cycle1=pivot (`9dc59e6`)**: PO が S4 で pivot。理由 = 言語化不足 (4軸 kind/layer/drive/workflow_phase を PO が読めない)。改修 = `docs/process/README.md` 新設 (process dir 入口 + 4軸 PO-legible 定義)。
5. **Step6 cycle2=confirmed (`fa921ee`)**: legible 化後 PO confirmed。frontmatter S4/confirmed/completed。終点 `PLAN-REVERSE-01-process-docs` 起票。
6. **V7 発見 + drive 表是正 (`fa921ee` `c44db21`)**: PO 指摘で drive 概念の構造欠陥を発見 (§2)。

## §2 ⭐ 最重要 open = V7: `drive` 概念の構造欠陥 (PO 2026-06-02)

PO の連続指摘で確定。**`drive` (§1.6) は「どの専門職 (specialist) / 専門エージェントを招集するか」が本質**だが、現定義に 3 欠陥:

1. **命名衝突**: 英語 drive=「駆動」、「駆動モデル」(mode, §2.5)= literally "drive model"。別軸なのに同一語根で混同必至。
2. **値の重複**: §1.6 `VALID_DRIVES` 9種に `scrum/reverse/poc/troubleshoot` (= 駆動モデル名/状況) が混在。専門職 (be/fe/fullstack/db/agent) と mode 値が同居。
3. **誤ラベル**: §1.6 が `scrum=仮説検証` と記すが誤り。仮説検証=Discovery(drive=poc)、Scrum=ユーザー協業で要件反復。

**あるべき姿 (PO framing)**: drive=専門職 5種のみ。`scrum/reverse/poc/troubleshoot` は mode 側へ。recovery drive=復旧対象 work の専門職継承 (PLAN-RECOVERY-01=fullstack が正、§1.6 `recovery→troubleshoot 固定`は誤り)。

**⚠ 影響大**: §1.6 VALID_DRIVES から poc/reverse/scrum/troubleshoot を外すと、**現存 PLAN (DISCOVERY-01..04=drive:poc 等) が全件 fail**。schema (src/schema VALID_DRIVES) + 多数 PLAN の migration を伴う L3 design 作業。**PO sign-off 必須の escalation**。→ `PLAN-REVERSE-01` §2 V7 で `forward_routing=L3` (requirements §1.6 再設計) へ routing 済。関連 memory: [[feedback_drive_is_specialist_not_mode]] / [[project_kind_drive_matrix_not_enforced]]。

## §3 Next Action (順序付き)

| # | action | 状態 |
|---|--------|------|
| 1 | **V7 = drive 軸 §1.6 再設計の方針 PO 確定** (drive=専門職5種 / mode値分離 / recovery継承 / 既存PLAN migration) | ⬜ **PO 判断待ち (escalation)** |
| 2 | PLAN-REVERSE-01 を R0 から駆動 (evidence→as-is→R3 intent(V7含むpo検証)→R4 routing) | ⬜ |
| 3 | gap V1 (forward_routing enum) / V2 (docs/research tree) / V4 (sub-doc拡張) を Reverse で routing | ⬜ |
| 4 | docs/process/{forward,modes,gates} を PROVISIONAL→正本化 (Reverse R4 後) | ⬜ |

## §4 ⚠ 壊さない / 再発させない

- **docs/process は spike (PROVISIONAL)**。正本化は REVERSE-01 が dogfood 実績から行う。spike を正本と誤読しない。
- **drive ≠ 駆動モデル**: drive=専門職 (§1.6、要再設計)、駆動モデル=mode (§2.5、modes/)。V7 確定まで両者を慎重に区別。
- **§1.6 VALID_DRIVES の変更は破壊的**: 既存 PLAN migration なしに enum から値を外さない。
- **untracked 維持**: `helix-process/` `ai-agent-harness-directory-reference.md` は commit 禁止 (`git add <path>` か `-u`)。
- **self-review 前置 MUST** / **subagent model 明示** / commit footer = `Co-Authored-By: Claude Opus 4.8 (1M context)`。main 直 commit 可 (solo)。

## §5 本 session commit (時系列、全 main)

- `662e916` DISCOVERY-04 Step2-5 (modes/9種 + gates.md + dogfood/verify + self-review)
- `9dc59e6` S4 cycle1=pivot — 4軸 legibility 入口 (process/README) 追加
- `fa921ee` S4 cycle2=confirmed + PLAN-REVERSE-01 起票 (V7 drive 概念歪み)
- `c44db21` drive 表の誤記是正 (scrum≠仮説検証) + V7 誤ラベル facet

## §6 未了の PO 判断事項 (escalation 済)

1. **V7 drive 軸再設計** (本 session 最重要、§2)。
2. PLAN-DISCOVERY-01 の S4 decision_outcome 未確定 (メタモデル PoC、別件)。
3. HELIX 離脱 (cutover) タイミング。
4. §9.1 先在乖離 (別 follow-up)。
