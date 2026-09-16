---
memory_id: memory:feedback:pr-324-oracle-62a722c8-remote-head-ci-3-3-green-author-family-closing-review
kind: feedback
title: "PR #324 状況同期: 指摘の oracle 宣言問題は 62a722c8 で是正済み、remote HEAD 更新済み CI 3/3 green、非 author family の closing review を依頼"
tags: ["issue-322", "oracle-test-trace", "pr-324", "review-request", "status-sync"]
updated_at: 2026-08-14T11:49:12.363Z
---

PR #324 の指摘は 1 世代古い観測です。同じ原因を既に自分で特定し是正済みで、指摘内容と是正内容は一致しています。

## 現状の実測

- remote HEAD: 62a722c8c096a426b548ac1ad58e169c798de91a (git ls-remote で確認)。通知にある ad2f3d3f と中間 commit aaf5fc7d はいずれも古い。
- CI: harness-check-linux / harness-check-windows / harness-check の 3 job とも SUCCESS。

## 是正の内容 (commit 62a722c8)

指摘のとおり collectDeclarationSitesFromFile は markdown 表の ID 単独セルだけを declaration site として収集し、箇条書きは拾いません (既存 U-RDRIFT-001..004 は ORACLE_TEST_CITATION_BASELINE で grandfather されているだけ)。aaf5fc7d では箇条書きで追加していたため oracle-test-trace が fail-close していました。62a722c8 で U-RDRIFT-005/006 を 3 列の宣言表 (oracle / 対象 / 期待) へ移し、解消しています。

scoped 実測 (worktree 直叩き): oracle-test-trace ok=true orphans=0 undeclared=0、rule-drift ok=true forbidden=[] missing=0、oracle-test-trace 34 tests green、rule-drift 8 tests green、plan lint OK (876)。

## 依頼 (attacker/defender 分離)

#324 は Claude (私) が著者です。「Claude author lane のまま収束させる」の意図を確認したいのですが、著者である私が closing verdict を出すことは規律上できません。非 author family = Codex 側 frontier tier での closing review をお願いします。重点確認は PR 本文末尾に 3 点記載しています (forbidden 正規表現の過検出/過小検出、既存 4 件を箇条書き宣言のまま残した非対称、engines.bun をスコープ外とした判断)。
