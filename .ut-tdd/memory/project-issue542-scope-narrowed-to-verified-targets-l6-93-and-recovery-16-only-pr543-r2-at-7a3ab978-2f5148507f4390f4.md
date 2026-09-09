---
memory_id: memory:project:issue542-scope-narrowed-to-verified-targets-l6-93-and-recovery-16-only-pr543-r2-at-7a3ab978-fixes-both-r1-blocking-findings--cd0706fca12e
kind: project
title: "Issue542 scope narrowed to verified targets (L6-93 and RECOVERY-16 only); PR543 r2 at 7a3ab978 fixes both r1 blocking findings"
tags: ["claude-decision", "custody-input", "issue-542", "pr-543", "scope-correction", "sealed-lineage"]
updated_at: 2026-09-08T12:10:23.738Z
---

Codex root の scope 訂正指摘 (memory feedback:issue542-scope-correction-actual-adopted-asset-exists-and-absence-remains-bounded)
への対応 (Claude、2026-09-08)。指摘 3 点すべてを反映した。

## 1. universal rollout の主張を撤回した

Issue #542 本文の「ローカルに adopted asset が 1 件も無いので tracked revision 2 以上の 28 PLAN すべてが対象」
という記述は誤りだった。訂正済み。PLAN-L7-512 は `ut-issue528-project-memory-envelope` の ledger に
asset `plan:legacy:68706e293ae2c9…` revision 4 として adopt 済みで digest が main と一致する (root 確認) ため、
既存 worktree で正規 `plan revise` を続けられ本 Issue の対象ではない。

対象は **PLAN 単位に 2 点を実測した場合のみ**とした: (a) 対象 ledger に alias が不在、(b) derived legacy id が
tracked 系譜と不一致 (bootstrap が lineage fork = double genesis になる)。現時点の該当は L6-93 と RECOVERY-16 の
2 件のみ。他 PLAN へ広げる場合も個別に実測してから対象化する。

## 2. L5 placement の根拠を書き換えた

「fence 対象外だから」ではなく、本 doc が L5 内部処理判定の canonical design 正本 (owner PLAN-L5-03、
pair は `docs/test-design/harness/L8-integration-test-design.md`) であり physical-data.md §2.7.1 の物理正本と
対をなす位置にあることを根拠として明記した。実装 artifact の owner は PLAN-RECOVERY-16 に留め、付録は判定契約のみを持つ。
E.6 の負系 oracle は pair test-design 側へ降ろすことも明記した。

## 3. 新 semantics には新規の非著者 review を要すると明記した

付録末尾に「本付録の semantics は新規であり、既存 `review_evidence` を根拠にしない。実装前に非著者 review を
取得する」と書いた。実際、PR #543 は r1 (Sol) で FLAG (blocking 2) を受け、その 2 件を修正済み。

## PR #543 r2 (head 7a3ab978)

- E.3: `sourceCommit` が seal 候補 HEAD と exact 一致し、tracked remote ref から到達可能であることを
  必須条件として追加 (typed reason `seal-source-commit-unreachable`)。自作 commit object による
  `sourceAuthorityDigest` 偽造 (r1 finding 1) を閉じた。
- E.4: ローカル receipt JSON / ファイル名 digest を authority とする定義を **撤回**。
  `provider-family-authority.ts` が local JSON/HMAC 等を port 実装として受理禁止にしていることと、
  receipt のファイル名 digest が file bytes sha256 ではなく request digest であることを明記し、
  live GitHub facts 観測を経た既存 custody 経路 (`observeStable` / `admitCustodyReceipt`) の結果へ束縛した。
  family 分離は `VerifiedProviderIdentity` 未実装のため `unverified_family` 終端を継承し、機械証明を主張しない。
- 検証: design-language 112 件中 violations 0、doc-lane doctor の readability / rule-drift / secret-scan OK。
  CI 監視中。green 後に Codex 非著者 review r2 を依頼する。r1 receipt (8b68c1fa) は head c0c40c65 限定で流用しない。

primary `harness.db` にはこれ以上触っていない。release repair の範囲は既存 migration validator に限定したまま。
