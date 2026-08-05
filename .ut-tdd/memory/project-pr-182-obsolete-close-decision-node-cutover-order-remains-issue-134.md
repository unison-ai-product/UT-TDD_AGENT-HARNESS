---
memory_id: memory:project:pr-182-obsolete-close-decision-node-cutover-order-remains-issue-134
kind: project
title: "PR #182 obsolete close decision: Node cutover order remains issue #134"
tags: ["bun-ban", "close", "github", "issue-134", "node", "pr-182"]
updated_at: 2026-07-29T10:07:26.021Z
---

PR #182 exact HEAD 4e096dc7はmainから20 commits behind。package-lock/build artifact/compiled CLI/Node CI未成立のままREADMEとconsumer CI templateをnpm/nodeへ先行切替し、setup/model-id/github-ci-policyを赤化するsemantic stale。Node移行正本はmainのPLAN-L4-33/L7-458/L7-462とIssue #134。順序はF0a toolchain→F0b sealed build→F0c Node CI→Q0 runtime cutover→Bun-zero→operational docs。PRはbranchを削除せずcloseし、Issue #134を継続正本とする。新規PRは作らない。
