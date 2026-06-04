# Session Handover — 2026-06-04 (handover 記録機構を Add-feature 経路B で完走)

> PO ゴール「handover とセッションログを正しく記録する仕組みにしてくれる」を受け、診断 → handover 記録機構を **Add-feature 経路B (L6 設計 → L7 実装 → Reverse 上位整合)** で 1 サイクル完走した。**本 doc は新機構が生成する 6 セクション構造** (§1-§2 = digest/git 由来の機械部、§3-§6 = 人間判断) で記述する (dogfood)。`§6.8.5` 準拠。

## §1 PLAN サマリ

| PLAN | kind | 何を | commit |
|------|------|------|--------|
| `PLAN-L6-06-handover-mechanism` | add-design (L6) | handover 機構の機能設計① + L7 単体テスト設計③ (9 関数 ⇔ U-HOVER-001〜007) | `a413d25` |
| `PLAN-L7-04-handover-mechanism` | add-impl (L7) | src/handover② + tests④ + CLI + session-log 活性化 amendment | `f104a15` |
| `PLAN-REVERSE-05-handover-mechanism` | reverse/fullback | §6.8.5/§6.8.6 + CURRENT.md→.json 同期 + L0 §10 用語 back-fill | `c98c8c5` |

**診断した 2 ギャップ (一体で解いた)**:
- **Gap A**: handover 機構が 0% 実装 (schema/コマンド/CURRENT.json すべて無し、手書き md のみ。§6.8.5 が保留した follow-up PLAN が未起票だった)。
- **Gap B**: solo/main 直開発で `.ut-tdd/state/current-plan` を書く機構が無く branch fallback も効かず `plan_id` 恒常 null → digest 不生成 → §6.8.6 結節点が死 (実ログ 5 件すべて `plan_id:null` で実証)。

## §2 成果物 (commit / files)

- **`src/handover/index.ts`** (新規): 9 関数 (resolveHandoverScope / buildPointer / scaffoldFromDigests / renderHandoverScaffold / handoverStale / writePointer / runHandover + nodeHandoverDeps)。機械ポインタ `CURRENT.json` (今どこ) と 人間判断 markdown (③-⑥ placeholder、次どう) を型分離。
- **`src/runtime/session-log.ts`** (amendment): `setActivePlan` / `inferPlanFromCommit` 追加、`onPostToolUse` commit 経路で current-plan 活性化 (fail-open 内側、`-F -` heredoc は no-op)、`resolveActivePlan` 本体不変。
- **`src/cli.ts`**: `ut-tdd handover [--dry-run|--complete|--plan]` / `ut-tdd plan use <id> [--clear]`。
- **`tests/handover.test.ts`** (新規): U-HOVER-001〜007 (16 test)。
- **要件 §6.8.5/§6.8.6 + L0 §10 用語 + CURRENT.md→.json 同期** back-fill (新 FR なし、fr-registry 46 件不変)。
- 検証: typecheck 0 / vitest **108 pass** (既存 92 非回帰 + handover 16) / CLI スモーク OK / code-reviewer review 4 周すべて反映 (L6 Critical 1+Important 5+Minor 3 / L7 APPROVE / Reverse APPROVE)。
- HEAD = `c98c8c5`、origin main へ push 済。untracked 2 件 (`helix-process/` `ai-agent-harness-directory-reference.md`) は policy-exempt。

## §3 Next Action

1. **【PO 確認待ち / R3】CURRENT.md の廃止**: 機械ポインタ正本を `.ut-tdd/handover/CURRENT.json` に確定し、要件の旧 `CURRENT.md` 表記を全廃した。これはガバナンス表記変更のため PO 認識を確認 (PLAN-REVERSE-05 R3 ゲート)。問題なければ REVERSE-05 を `confirmed` 化。
2. **handoverStale の lint/pre-push 配線**: §6.8.5「PLAN completed なのに handover 追記なし → warn」/ §5.3「CURRENT.json 24h stale warn」を `handoverStale` 基盤に `src/plan/lint.ts` (現 stub) 実装時に配線。現状 human-binding。
3. **運用ディシプリン**: 今後は PLAN 着手時に `ut-tdd plan use <id>` で current-plan を活性化すると session-log digest が populate され、session 終了時に `ut-tdd handover` が機械部を自動 prefill する。本 session は活性化が遅く digest が sparse だったため §1-§2 を git から手記入した。

## §4 carry (未了・先送り)

- **state DB 登録トリガ (FR-L1-07 hook)** は §6.8.6 結節点の別経路で別 FR。本機構は digest→handover 橋まで。
- 前 handover (06-02d) の継続 carry: branch protection gh-api 実適用 / escalation-stale.yml 検出ロジック / kind×layer guard / G8-G14 ゲート / repo biome 負債。

## §5 未了 PO 判断

1. **CURRENT.md 廃止の承認** (上記 Next Action 1、REVERSE-05 R3)。
2. handover 機構の scope 妥当性: digest→handover 橋 + plan_id 活性化までを 1 機能に束ねた判断 (Gap B は session-log への限定 amendment、新 sub-doc を起こさず)。code-reviewer は scope 妥当と判断したが PO 最終確認の余地。

## §6 壊さない / 再発させない

- **CURRENT.json が機械ポインタ正本** (CURRENT.md は廃止)。`handoverStale`/pre-push はこれを読む。二層 = CURRENT.json (機械) + docs/handover md (人間判断) を崩さない。
- **session-log の fail-open を壊さない**: commit 活性化配線は `onPostToolUse` の try/catch 内側。`resolveActivePlan` 本体は不変。
- **renderHandoverScaffold は全自由テキストに sanitize** (tracked md への credential 流出ゼロ)。
- **③-⑥ は AI が捏造しない** (human placeholder)。機械化するもの (今どこ) としないもの (次どう) を型で分離。
- **review 前置 MUST** / **subagent model 明示** / commit footer = `Co-Authored-By: Claude Opus 4.8 (1M context)` / **staged は明示ファイルのみ** (untracked 2 件は commit 禁止)。
