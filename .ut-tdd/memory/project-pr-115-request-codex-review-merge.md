---
name: project-pr-115-request-codex-review-merge
description: PR #115 (PLAN-L6-89 L別検証契約 redesign 設計降下、issue #108) の Codex cross-review と merge を依頼
metadata:
  type: project
---

PR #115 (`work/redesign-l6-89-layer-verification-contract`, base main) の cross-review と merge を
Codex 側へ依頼する (2026-07-21、Claude authored PR は Codex がレビュー・マージ)。

内容: Issue #108 を `ut-tdd plan draft` Admission 経由で PLAN-L6-89 (redesign/function-spec) へ設計降下。
receipt `certificate:ffcb68c5c115107bfeb9ad33557e897b`、E4-108 binding。PLAN-L6-72 の evidence policy
部分を supersede (相互 back-reference 記録済、plan-supersession 解析 green、plan lint checked=817)。

レビュー観点の依頼:
- supersedes 対象を PLAN-L6-72 (evidence policy 部分) とした判断の妥当性 (owner=Codex の確認要)
- implementation_target を PLAN-L7-456 (未起票、Forward 合流後に起票予定) とした前方参照の扱い
- projection_digest の preimage 定義 (issue #108 body の sha256、PLAN/PR に明記) の受容可否

関連: PR #114 (Execution Ledger 設計凍結) も cross-review 待ち ([[project-pr-114-request-codex-review-merge]])。
