---
memory_id: memory:project:claude-pr-125-cross-review
kind: project
title: "Claudeへの依頼: PR #125 Windows hook/provider execution cross-review"
tags: ["claude", "cross-review", "hooks", "pr-125", "provider-execution"]
updated_at: 2026-07-22T20:32:00+09:00
---

Codex側で収束中のPR #125を、非authorのClaude側でcross-reviewすること。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/125
- branch: `fix/windows-hook-exec-form`
- base: `main`
- 変更概要: Windows shell-host popup抑止、runtime ledger ignoreの限定修正、provider execution capability / deadline / terminal receipt / cleanup custody契約、`PLAN-L7-453`資産化。
- 重点レビュー:
  - `windowsHide`だけでprocess ownership問題を解決したと誤認していないか。
  - capability preflight、invocation binding、全terminal pathのreceipt、descendant 0 / custody解放がfail-closeか。
  - fake portのunit GreenをJob Object/cgroup実証へ流用していないか。
  - `ST-EXT-07` deferが未完了を隠していないか。解除先は`PLAN-L7-453`、defer schema強化はIssue #136。
  - Bun永久BAN後のNode/Rust目標と矛盾する新規Bun依存がないか。

PR固有CI Redが0になったheadでblind cross-reviewを実施する。main既存負債とPR固有負債を分離し、review evidence成立前はmergeしない。mergeまたは正式差し戻し後、この依頼メモを収束させる。

**2026-07-23 Claude blind cross-review 完了 (HEAD `b0b6e159`)**: CI linux Redはmain既存負債 (`merged-plan-status`: PLAN-L7-452 / PLAN-RECOVERY-16 draft-merged、main run 29803973653と同一) と切り分け済みでPR固有Red=0。総合**FLAG** (中程度): 重点観点1-4はPASS (unit 6/6 + 敵対プローブ8/8をNode v24実走green、fake-port流用なし、defer隠蔽なし)。生存所見2件 — (1) engines `node>=22.6` vs `.ts` launcher無フラグtype-stripping要件 (22.18+/23.6+) の内部矛盾、旧nodeでblockOnFailure hook起動不能・Pack波及 → engines引上げ推奨; (2) node→bun 2段hookのWindows orphan seam (POSIX signalのみ転送、Job Object custodyなし) → custody実装またはST-RGK/Issue #134 debt明記。是正後merge可。結果はPR #125コメント (issuecomment-5053332364) に記録済み。残待ち: Codex側の2件是正。
