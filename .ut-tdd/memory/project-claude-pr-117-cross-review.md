---
memory_id: memory:project:claude-pr-117-cross-review
kind: project
title: "Claudeへの依頼: PR #117 main負債2件のcross-review"
tags: ["claude", "cross-review", "main-debt", "plan-l7-452", "plan-recovery-16", "pr-117"]
updated_at: 2026-07-23T10:58:00+09:00
---

PR #117のlatest HEADを別runtimeでclaim-blind / spec-blind reviewする。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/117
- branch: `work/recovery-16-pr103-evidence`
- latest known HEAD: `19178ee4`
- 対象main負債: `PLAN-L7-452` / `PLAN-RECOVERY-16`
- 今回修正: `U-EXISSUE-016/018`のsubprocessが`spawn bun` / `Bun.sleep`へ固定され、Node実測でENOENT/timeoutになったため、esbuildでNode ESM workerを生成し`process.execPath`で起動するよう変更。
- local Node evidence: forward escape 19件Green、adoption 11件Green、GitHub port 7件Green、計37件Green。Biome Green。

レビュー重点:

- esbuild bundleがproduction契約を偽装せず、同じsource moduleとNode executableを検証しているか。
- 2 worker/processのSQLite排他・single provider call oracleを弱めていないか。
- `PLAN-L7-452`のDoD 2件をcloseできるexact-HEAD証拠になったか。
- `PLAN-RECOVERY-16`はDoD #8（実repo PLAN-L4-31 rev2 / PLAN-L6-88）の未達を残しており、帳尻confirmedを禁止する。

FLAGはPRコメントへ記録し、未反駁のままstatus confirmedへ変更しないこと。

**2026-07-23 Claude blind cross-review 完了 (HEAD `f6bb0660`、メモ記載19178ee4から前進後の最新)**: 総合**FLAG** (claim-blind FLAG / spec-blind PASS)。技術面はPASS — esbuild workerは実source+実Node (`process.execPath`+`node:sqlite`) で偽装なし、Node化diffでexpect行増減ゼロ (排他/single-call oracle非弱体化)、帳尻confirmなし (両PLAN draft維持は適切)、37件greenを独立worktreeでNode実走再現。FLAG根拠 = **required `harness-check` Redのまま (BLOCKED)**: linux全回帰のdoctorが`merged-plan-status` violation 2件 (L7-452/RECOVERY-16 draft+deliverable main着地) を検出 (ローカル再現済み)。PR bodyの「gate解除/Closes #102」は実物と乖離 — 本PRは両PLANをdraftのまま残しgateを解除しない。Windows passはtest:fast (doctor除外) のため裏付けにならない。進め方は設計判断: (a) DoD充足→両PLAN confirm+review_evidence後にmerge、または (b) 債務別途解消。結果はPR #117コメント (issuecomment-5053669909) に記録済み。残待ち: Codex/PO側の方式選択と対応。
