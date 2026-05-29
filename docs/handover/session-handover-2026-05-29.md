# Session Handover — 2026-05-29 (Recovery 駆動: 内部資産 cross-L 是正)

> 次 session の Next Action を最優先で確認すること。本 handover は Recovery 駆動 Step 4 (top-down 修正) 着手前の状態を引き継ぐ。

## §0 現在地 (一言)

設計層 L1-L6 完了 (G1-G6 passed/conditional) 後、PO が **内部資産 (subagent/skill/command) を UT-TDD 用に作り替える前提抜け**を指摘 → **駆動モデル Recovery** で是正中。Recovery ワークフロー Step 1-3 完了、**Step 4 (top-down 修正) が次**。HEAD = `928e5ed` (A-78)、working tree clean、vitest 66 pass。

## §1 Recovery 進捗 (docs/governance/recovery-workflow.md が正本)

- **Step 1 全部拾う**: 完了。指示無視(a)/逸脱(b) を 13 件収集 (ledger 反省ノート横断)。大半は是正済、**未是正は #1 内部資産のみ**。#13 (A-46 deferred の 2 件: PLAN テンプレ Step0 外部調査 / agent-guard opus pdm 制約) は**実施済か要確認**。
- **Step 2 認識確認 (PO)**: 完了。**PO 確定: Recovery スコープ = 「L を横断するケース」= #1 内部資産** (L1→L3→L4-L6 を貫く cross-L 是正)。= PO スコープ承認取得。
- **Step 3 正常化ポイント特定**: **reopen point = L1 (業務要求)**。cross-L のため L1 起点で top-down (reopen point は可変 = recovery-workflow §2.1、今回は要求漏れなので L1)。
- **Step 4 top-down 修正**: **未着手 (Next Action)**。
- **Step 5 fullback**: 未。

メタパターン (要再発防止): 失敗の大半が型(a)=「確立済の memory 原則・指示を着手前に適用せず PO 指摘で初めて動く」+「source を読まず書く(なぞり/捏造)」。

## §2 Next Action (Step 4 top-down、L1 → L3 → L4-L6)

evidence = `docs/migration/internal-asset-inventory.md` §5 (不足 FR-AST-1〜4)。

1. **PLAN-REC-001 更新**: §1/§3 の trigger 「認識ずれ」→ **(a) 指示無視**へ再分類 (recovery-workflow §1 準拠)、§6 reopen point = L1 確定、PO スコープ承認済を記録。
2. **L1 業務要求** (`docs/design/harness/L1-requirements/business-requirements.md`): **BR-22 追加** = 「UT-TDD は自前の runtime 内部資産体系 (subagent roster / skill pack / command) を持ち、HELIX 由来資産を UT-TDD 用に再構築する」。§7 に OT-22 pair 行 + §9 carry。
3. **L1 機能要求** (`docs/design/harness/L1-requirements/functional-requirements.md`): **FR-L1-46〜49 追加** (= FR-AST-1 roster / FR-AST-2 skill pack curate / FR-AST-3 command / FR-AST-4 内部資産 drift lint)、BR-22 へ trace。§1.2 back-prop note の流儀に倣う。
4. **L3 機能要件** (`docs/design/harness/L3-functional/functional-requirements.md`): FR-L1-46〜49 を詳細化 + **各 AC** (Given-When-Then)。
5. **L12 受入** (`docs/test-design/harness/L3-acceptance-test-design.md`): 対応 **AT** 追加。
6. **L4-L6 設計増分**: architecture/function に subagent roster 設計、skill pack curate 設計、command 体系。porting-map W6/W7 (subagent) / W10 (skill) を後続 PLAN 接続。

## §3 ⚠ g3-trace lint 結合 (壊さないための必須注意)

`tests/g3-trace.test.ts` は **FR-L1 件数を `toBe(42)` で固定**検証 (line 25, 82)。FR-L1-46〜49 を足すと:
- `extractFrL1Ids` count 42 → **46** に変わる → **test assertion を 42→46 に更新必須** (line 25, 82 + コメント)。
- 孤児ルール R1 (FR-L1→L3 被覆) / R2 (L3 FR→AC) / R3 (AC→AT) があるため、**新 FR には L3 詳細 + AC + AT をセットで用意しないと orphan で test fail**。または P1 carry 扱いで §3/§3.1 に carry 明示 (既存 P1 FR と同様)。
- lint 本体 = `src/lint/g3-trace.ts`。件数変更は test の `frL1.size` / `totals.frL1` の両方。

> 教訓 (本 session): source (実 src / helix-process) を読まず書くと捏造・取り違えが出る。L1/L3 編集前に対象 doc と lint ルールを必ず読む。self-review 前置 (code-reviewer/pmo-sonnet) を G1/G3 再 readiness 前に通す (= claude-only の tl リオープン確認代替)。

## §4 成果物 (本 session、A-74〜A-78)

- A-74/75: V/W 用語是正 + 全件点検 (blast radius narrow)。
- A-76: L6 機能設計完遂 (function-spec/edge-case) + G6 COND PASS。self-review が捏造 6 件検出→是正。
- A-77: 内部資産棚卸 (`internal-asset-inventory.md`) + Recovery PLAN-REC-001 起票。
- A-78: Recovery ワークフロー正本化 (`docs/governance/recovery-workflow.md`) + memory 訂正。

## §5 memory 反映済 (新規/訂正)

- `feedback-recovery-mode-for-premise-gap` (訂正): Recovery 本線=トラブルシュート (指示無視/逸脱)、reopen point 可変 (毎回要求でない)、全部拾う→PO 認識確認→正常化ポイント特定→top-down→fullback。
