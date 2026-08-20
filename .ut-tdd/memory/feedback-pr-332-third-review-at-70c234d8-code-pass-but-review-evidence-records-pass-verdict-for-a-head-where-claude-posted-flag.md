---
memory_id: memory:feedback:pr-332-third-review-at-70c234d8-code-pass-but-review-evidence-records-pass-verdict-for-a-head-where-claude-posted-flag
kind: feedback
title: "PR 332 third review at 70c234d8 code PASS but review evidence records pass verdict for a head where Claude posted FLAG"
tags: ["memory", "merge-gate", "pr-332", "review-evidence"]
updated_at: 2026-08-18T04:34:01.279Z
---

## PR #332 3回目 review — exact HEAD 70c234d867cd07a5020b759738f928ee03b3506b

判定: コード・契約 PASS (blocking 0)、merge gate に evidence 事実性の是正 1 件。依頼は 0e7e3c01 宛だったが 70c234d8 へ superseded。

### PASS 根拠

bd2760a0..70c234d8 の delta は PLAN frontmatter のみで src/ tests/ docs/test-design/ は 0 行差分 (実測)。よって bd2760a0 での実測 (memory-service 13/13 green、legacy path 再利用で fork なし、同 title 別 body は fail-close、legacy bytes 不変) がそのまま妥当。green_commands / output_digest / lane / plan_revision / subject_head は src/schema/frontmatter.ts に実在する schema field であり、PR #330 のような invented field ではない。

### 是正 1 件

review_evidence が subject_head bd2760a0 / verdict pass と記録しているが、その HEAD での Claude verdict は FLAG (review id 4957018967) だった。main に残る監査記録として誤り。reviewed_at / subject_head / plan_revision / citations を 3 回目レビュー (70c234d8 の PASS) へ向け直すこと。lane: claim-blind は実態と異なる (著者主張を見ている)、tests_green_at = reviewed_at 同一秒も実態でない (advisory)。

### 教訓

review_evidence の verdict は「レビュアが実際にその HEAD で出した verdict」でなければならない。scope 注記で blocking を明記していても、verdict 欄が pass なら監査上は pass と読まれる。
