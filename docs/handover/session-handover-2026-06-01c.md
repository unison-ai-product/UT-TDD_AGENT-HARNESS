# Session Handover — 2026-06-01c (フォルダ一括実体化 + plan_id 駆動モデル化 + DISCOVERY-04 起票・Step1)

> 前 handover (`session-handover-2026-06-01b.md`) の続き。本 session は follow-up #4 (docs/process 整備) に着手する過程で、PO 指摘により ① 構成フォルダの先行実体化、② plan_id 起票ルールの駆動モデル legible 化、③ docs/process 整備を「Discovery で回し終点で Reverse に戻す」配線として再定義、まで進めた。

## §0 現在地 (一言)

docs/process 整備の本線に着手。**plan_id を駆動モデル legible (X→DISCOVERY/REVERSE/RECOVERY) に是正**し、整備を **PLAN-DISCOVERY-04 (Discovery)** で起票、**Step1 (Forward L0-L14 の S1 暫定 spike)** まで完了。HEAD = `c695772`、main clean、**vitest 71 pass**。untracked (`helix-process/`・`ai-agent-harness-directory-reference.md`) は commit 不可を維持。

## §1 本 session 進捗 (時系列)

1. **フォルダ一括実体化** (`b6c6ca7` `e1b1595`): 「要件で構成を決めたら中身が無くてもフォルダを先行で全部用意する」(PO 指摘、機械的抽出を容易化)。canonical ツリー全ディレクトリを `.gitkeep` 化 (src/web, .github/workflows, .ut-tdd/{state,audit,cache,teams,adapters,handover})。[[feedback_scaffold_dirs_upfront]]
2. **plan_id 起票ルール是正** (`09d9917`): 旧 `PLAN-<layer>-<NN>` は横断駆動 (poc/reverse/recovery) を layer token `X`(cross) に潰し **ID から駆動モデルが読めなかった**欠陥 (PO「PLAN-X-01 が Discovery と分からない、起票ルールが悪い」)。option 1 で駆動モデル名トークン化: **DISCOVERY(poc)/REVERSE(reverse)/RECOVERY(recovery)**、token↔kind fail-close、**recovery=cross 解禁**。schema/test/§1.10/.claude/CLAUDE.md + 既存 4 PLAN rename (X-01→DISCOVERY-01/X-03→DISCOVERY-02/X-04→DISCOVERY-03/X-02→RECOVERY-01) を 1 commit で。code-reviewer APPROVE。[[feedback_drive_model_first_class_in_plan_id]]
3. **PLAN-DISCOVERY-04 起票** (`dffdc83` `bb6d93f`): docs/process 整備を **kind=design でなく Discovery (kind=poc)** で起票 (PO「これもディスカバリー」)。さらに PO「ディスカバリーで進めてリバースで戻す」= **Discovery 終点 (S4) が Reverse 接続点。終点で PLAN-REVERSE-NN を起票し dogfood 実績から docs 再整備・設計修正 → Forward(L3)**。この exit→fullback 配線を PLAN に明示 (別正本/別 PLAN には残さない = PO 確定)。
4. **DISCOVERY-04 Step1** (`c695772`): Forward L0-L14 を `docs/process/forward/` に **PROVISIONAL SPIKE** 起草 (overview + 左腕 L0-L6 + 谷 L7 + 右腕 L8-L14、pmo-sonnet 委譲→PM review)。

## §2 重要な確定事項 (メタモデル運用配線、PO 確定)

- **docs/process の正本は forward で机上起草しない**。Discovery で実装+改善 loop を回し、**終点で Reverse を起票して実績から再整備**する。Discovery の役割 = 「正本を書く」でなく「Reverse へ渡す確証 (回った実績・gap) を作る」まで。
- これは新規発明でなく requirements §1.2 (confirmed→Reverse R0 起票) / PLAN-DISCOVERY-01 §6 と同配線。**配線は別 PLAN/正本で残さず、運用パターンとして該当 PLAN に書けば十分** (PO)。
- triage 教訓: docs/process 整備は kind=design でなく **Discovery**。確証なき設計は §1.1 (設計→仮実装→検証→確定) で回す。

## §3 Next Action (順序付き)

| # | follow-up | 状態 |
|---|---|---|
| 1 | DISCOVERY-04 **Step2** = modes/ (駆動モデル9種) + gates.md の S1 暫定 spike | ⬜ **次** (pmo-sonnet 委譲→PM review、spike 明記) |
| 2 | Step3 = S2 dogfood (自 repo L1-L5 実工程に暫定定義を照合) | ⬜ |
| 3 | Step4 = S3 verify (詰まり/欠落/冗長/層越境/V-pair 記録) | ⬜ |
| 4 | Step5 = self-review 前置 (code-reviewer/pmo-sonnet) | ⬜ |
| 5 | Step6 = S4 PO decision → confirmed なら **PLAN-REVERSE-NN 起票**して docs/process 正本化 | ⬜ |

**spike の PM/PO 判断保留点 (carry、Reverse/実績で確定)**: ① L11 巻き取り境界 (同サイクル add-design vs 次サイクル L0) / ② L14 next feedback 形式 (charter 再起票 vs backlog promotion) / ③ L10 drive 別 skip (be+UI 境界) / ④ L2 wireframe skip 条件。

## §4 ⚠ 壊さない / 再発させない

- **plan_id 新スキーム**: 横断駆動は `PLAN-{DISCOVERY|REVERSE|RECOVERY}-NN`、token↔kind 一致 + layer=cross。Forward は `PLAN-L{0-14}-NN` (token↔layer)。recovery=cross 解禁済。`tests/plan-id-naming.test.ts` + `tests/frontmatter.test.ts` が機械検証。
- **untracked 維持**: `helix-process/` と `ai-agent-harness-directory-reference.md` は commit 禁止。`git add -A` は禁止 untracked を巻き込むので `git add <path>` か `git add -u` を使う。
- **docs/process/forward/ は SPIKE**: 正本でない。`.gitkeep` を実装許可と誤読しないのと同様、spike を正本と誤読しない。正本化は終点後 Reverse。
- **self-review 前置 MUST**: PO へ確定/gate を求める前に code-reviewer/pmo-sonnet。本 session は plan_id 変更 + DISCOVERY-04 起票で実施済。
- **委譲**: >100行 起草・schema/test は委譲 (本 session は pmo-sonnet/code-reviewer 活用、model 明示)。Codex CLI は壊れ (8009001d)、TS-native は PM-authored 可。
- **commit footer**: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。commit-msg hook = Conventional Commits (Bash heredoc)。main 直 commit 可 (solo)。

## §5 未了の PO 判断事項 (escalation 済)

1. PLAN-DISCOVERY-01 の **S4 decision_outcome** 未確定 (TL review + PO 判断待ち、メタモデル PoC)。
2. **HELIX 離脱判断のタイミング** (cutover-strategy 正本)。
3. **§9.1 先在乖離** (governance に未記載 doc が A 必須、別 follow-up)。
4. **recovery=cross 解禁の確定** — 本 session で実装 (handover §4 の未決を解禁方向で確定)。PO 追認のみ要。

## §6 本 session commit (時系列、全 main)

- `b6c6ca7` フォルダ一括実体化 (src/web, .github/workflows)
- `e1b1595` .ut-tdd runtime state ディレクトリ枠先行
- `09d9917` plan_id 駆動モデル化 (X→DISCOVERY/REVERSE/RECOVERY) + recovery=cross 解禁 + 4 PLAN rename
- `dffdc83` PLAN-DISCOVERY-04 起票
- `bb6d93f` DISCOVERY-04 に exit→Reverse 配線
- `c695772` DISCOVERY-04 Step1 Forward L0-L14 spike
