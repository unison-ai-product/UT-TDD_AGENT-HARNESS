---
memory_id: memory:project:claude-pr-130-main-debt-cross-review
kind: project
title: "Claudeへの依頼: PR #130 main PLAN debt cross-review"
tags: ["claude", "cross-review", "pr-130", "plan-l7-452", "plan-recovery-16", "redesign"]
updated_at: 2026-07-23T18:07:00+09:00
---

PR #130 exact implementation HEAD `d30708e133dab4e86c976824fdcb5fb7bc148b1c` を
非authorのClaude側でblind cross-reviewする。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/130
- branch: `work/redesign-planasset-genesis-adoption`
- base: `work/recovery-16-pr103-evidence` (PR #117)
- 対象:
  - `PLAN-L7-452-forward-escape-contract-red`
  - `PLAN-RECOVERY-16-plan-revision-authoring`
  - sealed lineage genesis/rebase migration、schema v13、atomic 2-comment outbox
- 判定要求:
  - 各PLANを別々にclaim-blind / spec-blind評価し、PASS / PASS-WEAK / FLAGを返す。
  - `PLAN-L7-452`は`U-EXISSUE-007..018`と`U-EXISSUE-ADOPT-001..008`を実Nodeで独立実測する。
  - `PLAN-RECOVERY-16`はDoD 9項目を個別判定し、historical rev1-5を推測再構成せず
    sealed/unrehydratable authorityとして扱い、new genesis revision 1へrebaseする契約を確認する。
  - schema v10/v11/v12→v13、migration/certificate/custody/outboxの逆向きtotality、
    exact replay、canonical comment本文、GitHub全ページ観測を攻撃する。
  - remote POST前のdurable `create_intent`、stale owner、lease expiry/takeover、
    POST前後crash、terminal exact replay DB不変、projected driftのPOST 0を攻撃する。
  - 固定source blob commit `79ffe9b3` (`status: draft`) と
    `reviewedImplementationCommit=d30708e133dab4e86c976824fdcb5fb7bc148b1c` が
    別authorityとして束縛されることを攻撃する。
  - migration rev1はlossless `draft` genesisであり、review PASSだけで`confirmed`を自己申告せず、
    通常revision authoringのrev2でconfirmする二段階契約を確認する。
  - certificate / schema v14 / migration row / comment metadataが
    `sourceAuthorityDigest`、`reviewedImplementationAuthorityDigest`、`trustedStatus`を
    canonicalに保持し、v13旧rowを推測backfillしないことを攻撃する。
  - manifest nested shape、review commit実在、source commit ancestor、trusted blob status一致が
    transaction前にfail-closeすることを攻撃する。
  - stale base、changed replay、片肺publish、direct edit、projection不一致を攻撃する。
  - `PLAN-L7-441`のprocess-kill境界を本PLANの通常例外atomicityと混同していないか確認する。
  - 2 PLANのconfirm可否を別々に明記し、片方の証拠を他方へ流用しない。

Codex側の最新予備検収ではauthority統合対象32 tests、関連回帰138 tests、
schema/design-language 42 tests、`tsc --noEmit`、Biome、`git diff --check`がGreen。
別の非author Codex reviewerは
claim-blind / spec-blind PASS（10 attacks）だが、これらはauthor側説明として採用せず
Claude側でexact HEADから再導出すること。旧HEAD `946ddb7c` のCI run `29990723038` が
検出した3系統（max-source-params、impl-plan-trace、windowsHide）を修正し、
親側11 files / 163 tests、typecheck、Biome、diff-checkがGreen。新HEADのCIを再確認すること。

FLAGはPRコメントと本メモへ記録する。PASS時はexact HEAD、実走command、exit code、
時刻、output digest、攻撃trial logを返し、revision authoringによるreview_evidence追記へ使える形にする。
