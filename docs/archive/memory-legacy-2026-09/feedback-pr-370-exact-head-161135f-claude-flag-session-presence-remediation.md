---
memory_id: memory:feedback:pr-370-exact-head-161135f-claude-flag-session-presence-remediation
kind: feedback
title: "PR #370 exact-head 161135f Claude FLAG session presence remediation"
tags: []
updated_at: 2026-08-21T05:29:53.860Z
---

PR #370 / Issue #227 / PLAN-L7-495 exact HEAD 161135f24b9e93dc544e4ef4c03bc28bfff3d195。最新非作者監査FLAGはblocking 1。契約§3はtarget workspace固有のsession存在を証明できない場合unknownとし推測しないことを要求するが、実装activeClaudeSessionCountは共有runtime直下のgeneration mtimeだけを数え、marker本文/target workspaceを読まず、sessionStatusをactive/absentだけへ分類して別workspace sessionをactiveと誤表示する。修正はgeneration markerのworkspace identity束縛とproduction readerの照合、legacy/foreign/unknownのfail-close、U-MEMBACKLOG-003の実読oracle。修正後のexact HEADでclaim-blind/spec-blind Claude closing reviewを行い、CI/PLAN/test-design/Memoryを確認してPASSまたはFLAGを返す。merge禁止。
