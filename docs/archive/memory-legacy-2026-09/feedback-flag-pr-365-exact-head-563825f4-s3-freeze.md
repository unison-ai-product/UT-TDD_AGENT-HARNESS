---
memory_id: memory:feedback:flag-pr-365-exact-head-563825f4-s3-freeze
kind: feedback
title: "FLAG PR 365 exact HEAD 563825f4 S3 freeze"
tags: ["flag", "issue-360", "plan-l6-102", "pr-365", "release", "verdict"]
updated_at: 2026-08-20T10:23:48.262Z
---

Claude (claude-opus-5) が PR #365 (Issue #360 S3 / PLAN-L6-102 release promotion gate と rollback の pair-freeze) の非著者 closing review を exact HEAD 563825f47e6cca1c571336fc6d33db88fafbf200 で実施し FLAG (blocking 2) を返した。verdict: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/365#issuecomment-5354608291 merge はしていない。

B-1 (blocking): 凍結した RollbackGateReason union に rollback_failed が無いのに、本文 §2 と CANDIDATE-RELMAN-022 の Green 条件と §5 出口条件がいずれも復元不能を rollback_failed または indeterminate へ落とすと書いている。RollbackGateResult の decision は allow / deny / indeterminate なので rollback_failed を名乗れる出力が存在せず、実装者が union へ足すか restore_indeterminate へ読み替えるかを自分で選ぶことになる。さらに merge 済みの PLAN-L6-101 §3 が typed rollback_failed / indeterminate という語をすでに使っており、S3 と S4 で同じ失敗を別名で呼ぶと後段の receipt 突き合わせが一致しない。

B-2 (blocking): 期限切れの判定規則が凍結されていない。CANDIDATE-RELMAN-020 の RED mutation と §1 の判定順序 (c) が有効期限に言及するのに、TTL も起点も PLAN のどこにも無い。repo 側にも根拠が無いことを grep で確認した (src/setup/release-*.ts と src/kernel/github-closure-receipt.ts と src/feedback/review-merge-gate.ts に expir/stale/ttl が 0 件)。review 側の staleApprovalViolations は draft_with_approval を見る別軸で時間 TTL ではない。このままだと実装者が TTL を発明し、その発明値を oracle が追認する構造になる。推奨は時間ベースの期限を持たないと明記して headSha / planRevision の exact 一致へ一本化する案。

非 blocking 3 件: F-1 write/publish 0 をどの単位で観測するかが不定で、pure gate に対しては構造上つねに真になり落ちようがない oracle になる (§4 の薄い gate adapter へ spy port を挿す意図と読めるが PLAN に書かれていない)。F-2 PromotionGateReason が欠落と期限切れを区別せず、present だが対象違いの証跡も ci_missing と読まれる。F-3 sideEffects が単一 literal なので実行時情報量 0 で、観測結果と誤読されると F-1 の誤解を強める。

PASS 側として独立検算した事実も記録する。引用されている 12 symbol すべてが exact HEAD に実在し捏造 0 件 (ReleaseIdentity / ReleaseManifest / channelOrder / ReleaseChannelAttestation の三値 / SealedReleaseAggregatePlan / REQUIRED_GITHUB_CHECK / MergeClosureReceipt / ReviewReceiptSource / validCrossReviewSource / ReviewReceipt / analyzeReviewDispatch / evaluateMergeGate / merge_ready)。requires 8 件すべて confirmed。QA の G01 から G08 が governance doc に実在。candidate 採番は既存最大 U-RELMAN-018 に対し 019 から 023 で衝突なし。§4 の path lease 主張どおり 563825f4 は PR #358 の merge commit 03e61b86 を含み分岐元は 358eabcb である。

レビュー手法として有効だったのは、PLAN が引用する symbol を git show <head>:<file> | grep -c で機械的に全数照合したこと。この repo には merged L6 doc が実在しない別名関数を正本と書いた errata の前例があるため、引用実在性の全数確認は pair-freeze review の定型手順にする価値がある。
