# A-142 — PLAN-L7-83 handover drift reconcile + accumulation bound (cross_agent review)

- Date: 2026-06-19
- Worker: claude-opus-4-8 (PM)
- Reviewer: codex-gpt-5.5 (TL, cross_agent via `ut-tdd codex --role tl --task-file ... --execute`)
- Scope: `src/handover/index.ts` (boundSameDayEntries + runHandover marker reconcile), commit `9e6d4cc`.

## Defects fixed
1. **pointer drift never reconciled** — CURRENT.json と `.ut-tdd/state/current-plan` marker が
   無秩序に乖離できた (`checkHandoverDiscipline` は warn のみ)。実例: marker=PLAN-L7-83 (当時 phantom)、
   CURRENT.json=PLAN-L7-82 (completed) → doctor が drift を毎 session 再報告。`runHandover` を 2 source の
   単一 writer とし complete→clear / --plan→sync / plain in_progress 無変更 / dryRun 非破壊で構造的に解消。
2. **同日 markdown 無制限累積** — slim (A-138 ITEM-4) では §3-§6 + entry が積み増し (6 entries / 1004 行)。
   `boundSameDayEntries` が MAX_SAME_DAY_ENTRIES=4 へ上限化 (anchor + 直近保持・中間 breadcrumb・git 履歴保全)。

## Cross_agent review log
- **Round 1** (`.ut-tdd/codex-tasks/l783-review.md`): VERDICT=fail。Important 1件 =
  `boundSameDayEntries` が既存 breadcrumb を再 prune 時に保持 anchor (entry[0]) の slice へ吸収し
  breadcrumb が線形累積する (「collapse into ONE breadcrumb」決定に反し bound を弱める)。
  No-Finding: clear-on-complete coherence / 保持算術 (MAX=4) / breadcrumb header 非該当 / dryRun 非破壊 /
  空 current-plan file の consumer 契約。
- **Remediation**: strip-then-reprune — `countHandoverEntries<=max-1` の早期 return は入力不変のまま、
  prune 経路では既存 breadcrumb (+ 直前 `---` separator) を regex 除去後に header 再走査して 1 個だけ再挿入。
  決定論 oracle U-HOVER-014 idempotency ケース (2 prune cycle で breadcrumb 1 個・header=MAX-1) を追加。
- **Round 2** (`.ut-tdd/codex-tasks/l783-review-r2.md`): 確認 dispatch は grounding trace (Test-Path /
  CURRENT.json read / rg) で出力が途切れ最終 verdict 未捕捉 (wrapper truncation)。remediation は決定論 test で
  代替検証 (再 attest でなく test-proven)。

## Verification
- typecheck clean / biome (175 files) clean / 全 Vitest 763 green (U-HOVER-014/015 含む) / doctor EXIT=0
  (change-impact OK: source+design+test の change-set / readability mojibake 0)。
- handover-discipline drift surface は完了 handover (`ut-tdd handover --complete --plan PLAN-L7-83-...`) で解消。
