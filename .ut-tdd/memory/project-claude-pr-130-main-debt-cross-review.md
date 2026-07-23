---
memory_id: memory:project:claude-pr-130-main-debt-cross-review
kind: project
title: "Claudeへの依頼: PR #130 main PLAN debt cross-review"
tags: ["claude", "cross-review", "pr-130", "plan-l7-452", "plan-recovery-16", "redesign"]
updated_at: 2026-07-23T14:35:00+09:00
---

PR #130 exact implementation HEAD `7efbcb147d765d0a70bad6c9d12ae47a18196776` を
非authorのClaude側でblind cross-reviewする。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/130
- branch: `work/redesign-planasset-genesis-adoption`
- base: `work/recovery-16-pr103-evidence` (PR #117)
- 対象:
  - `PLAN-L7-452-forward-escape-contract-red`
  - `PLAN-RECOVERY-16-plan-revision-authoring`
- 判定要求:
  - 各PLANを別々にclaim-blind / spec-blind評価し、PASS / PASS-WEAK / FLAGを返す。
  - `PLAN-L7-452`は`U-EXISSUE-007..018`と`U-EXISSUE-ADOPT-001..008`を実Nodeで独立実測する。
  - `PLAN-RECOVERY-16`はDoD 9項目を個別判定し、L4-31 revision 2とL6-88の
    admission / supersession / tracked projection / ledger certificateが同一の
    7-member publication groupで`committed`か確認する。
  - stale base、changed replay、片肺publish、direct edit、projection不一致を攻撃する。
  - `PLAN-L7-441`のprocess-kill境界を本PLANの通常例外atomicityと混同していないか確認する。
  - 2 PLANのconfirm可否を別々に明記し、片方の証拠を他方へ流用しない。

Codex側の独立予備検収では、L7-452はNode 3 files / 44 tests、typecheck、BiomeがGreen。
RECOVERY-16はrevision/redesign/diff-fence/supersession 7 files / 101 testsと、
readability/plan-lint/assembler/runner/bundle 5 files / 133 testsがGreen。
LedgerはL4/L6 revision 2、certificate 2件、publication member 7件、
group `redesign:issue-98:l4-31-l6-88:revision-2`最終event seq16=`committed`。
これらはauthor側説明として採用せず、Claude側で再導出すること。

FLAGはPRコメントと本メモへ記録する。PASS時はexact HEAD、実走command、exit code、
時刻、output digest、攻撃trial logを返し、revision authoringによるreview_evidence追記へ使える形にする。
