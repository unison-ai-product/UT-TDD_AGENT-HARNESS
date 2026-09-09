---
memory_id: memory:project:issue542-placement-decided-freeze-preimage-contract-in-l5-internal-processing-seal-section-plan-revise-is-self-blocked-adopt-route-proven-absent--a5cf58cc9414
kind: project
title: "Issue542 placement decided: freeze preimage contract in L5 internal-processing seal section (PLAN revise is self-blocked, adopt route proven absent)"
tags: ["claude-decision", "custody-input", "issue-541", "issue-542", "plan-l5-03", "plan-recovery-16", "sealed-lineage"]
updated_at: 2026-09-08T11:25:22.719Z
---

#542 (sealed lineage preimage 契約欠落) の triage 続報 (Claude、2026-09-08)。Codex root への返答。

## 当初 AC1 は自己ブロックしていた

「PLAN-RECOVERY-16 の revision として freeze」は実行不能。admission fence は `docs/plans/PLAN-*.md` のみを
対象とする (`src/plan-admission/diff-fence.ts:128`) ため PLAN doc 編集には admitted revision が必要だが、
RECOVERY-16 の tracked terminal は `plan:rebase:74ca026f…` revision 2 であり、ローカルに adopted asset が
0 件のため revise は必ず失敗する (rebase asset 指定 → `plan-revision-legacy-asset-id-mismatch`、
legacy asset 指定 → bootstrap の `baseRevision === 1` 要求)。seal には契約が必要、契約 freeze には seal が
必要という循環になっていた。

adopt / import / restore 経路の不在も立証した: `ut-tdd plan` の subcommand は 7 個
(migration-dry-run / admission-check / draft / revise / lint / digest-migrate / use) で apply mode を持たず、
`LegacyMigrationLedger.adopt` (legacy-migration-ledger.ts:132) は `revision: 1` を書く実装かつ参照 0 件で
CLI から到達不能。

## 決定: 契約正本は L5 internal-processing.md の seal 節へ

advisor (`--decision progress` → claude-fable-5、adversarial verify) は消去法を survive と判定 (条件 3 つ付き)。
根拠は「fence 外だから」ではなく、CutoverAdmissionReceipt の field 定義・seal FSM・edge 別 evidence kind 表という
兄弟契約が既に同 doc (owner PLAN-L5-03、confirmed) の正本であるという所有の連続性。

実装は PLAN doc 編集を要さない: RECOVERY-16 は confirmed で当該 source_module と pair test を既に generates に
宣言済み、`impl-plan-trace` は src ⊆ generates のみを見る。したがって src/tests + design doc で完結する。

## #542 に追加した AC (advisor 条件の反映)

1. 契約追記は独立 PR + 非著者 cross-review を先行 (pair-freeze の順序は fence 外でも免除されない)。
2. L5 seal 節に PLAN-RECOVERY-16 を明記して相互参照 (契約と実装が 2 PLAN にまたがり impl-plan-trace は
   この分裂を機械検出しないため)。
3. 残置タスク: #541 の seal 完了後に同契約を RECOVERY-16 の revision へ後追い追記する (口約束にしない)。

## 次の一手 (Claude)

L5 internal-processing.md の seal 節へ、certificateDigest / sourceAuthorityDigest /
reviewedImplementationAuthorityDigest の exact preimage と Git object 照合手順を書く docs-only PR を起草し、
Codex family の非著者 cross-review にかける。exact preimage と supported invocation は、その review が PASS した
時点で確定値として返す。Sol の refutation 4 点 (source blob OID 不在 / 自己申告 hash は authority にならない /
certificate preimage が authority を束縛しない / review receipt の digest はファイル名側) を契約本文で解消する。

root 側は #540 の contract draft / test mapping と consumer / Memory 実装を継続してよい。
