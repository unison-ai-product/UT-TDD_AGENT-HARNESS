---
memory_id: memory:feedback:pr-89-90-91-claude-2026-07-17
kind: feedback
title: "PR #89/#90/#91 クロスレビュー依頼 (Claude 起票 2026-07-17)"
tags: ["cross-review", "pr-89", "pr-90", "pr-91"]
updated_at: 2026-07-17T03:13:37.372Z
---

Claude 起票の PR 3 本のクロスレビューとマージをお願いするにゃ (PO 指示 2026-07-17「裏取りしながらすべて進めて」の成果物だにゃ)。

- PR #89 (work/test-plan-id-traceability): missing-test-plan-id の解消。orphan テスト 12 ファイル (fixtures 含む) を導入 commit で所有裏取りし、**confirmed 所有 (L7-421/423/435) の 8 ファイルのみ** generates へ test_code 宣言 (CI 実測 pass)。draft 所有 4 ファイル (L7-255/260/425, L4-22) は merged-plan-status hard gate (「merge 済み出荷物を持つ PLAN は confirmed であれ」) と衝突するため宣言を撤回したにゃ — **各 PLAN の confirm 時に generates へ宣言して残 warn 43 件を解消する運用**だにゃ (rebuild 実測 66→50、うち 7 は下記 transient)。
- PR #90 (work/issue-78-81-plan-filing): issue #81 → PLAN-L7-448 新規起票 (source repo windows CI job、L7-235 は Pack 限定を確認済み)、issue #78 → 既存 PLAN-L7-365 extend (再発実測を実装メモへ記録)。REVERSE-448 pairing を追加してくれてありがとうだにゃ (こちらの重複 commit は破棄してそちらを採用したにゃ)。その上で plan-governance の 2 violation (add-impl の parent null / requires に draft REVERSE) を 661c6f51 で是正済みだにゃ (parent=PLAN-L1-05-nfr、REVERSE は references へ移動、双方向 link は REVERSE 側 parent で成立 = 449 と同形)。
- PR #91 (work/l7-449-completion-filing): L6-64 §5 降下の PLAN-L7-449 (add-impl) + PLAN-REVERSE-449 pair 起票。実装着手は src/cli.ts hot-file 合流後のまま、起票のみ先行だにゃ。

おまけの申し送り (訂正済み): tests/plan-asset-evidence-policy.test.ts の missing-test-plan-id 7 件は stale ではなく、rebuild 時点でそちらの WIP ファイルが live tree に実在した正しい測定だったにゃ (ファイル非存在の tree で再 rebuild したら 0 件を実測確認、detector は tree-current で健全)。commit する際は所有 PLAN の generates へ test_code 宣言してほしいにゃ (draft PLAN なら merged-plan-status gate と衝突するので confirm と同時にだにゃ)。マージ後に PR 88 同様この依頼メモリは片付けてにゃ。
