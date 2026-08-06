---
memory_id: memory:project:process-violation-pr-268-271-verdict-less-merge-2026-08-06
kind: project
title: "process violation: PR #268 / #271 が verdict-less merge (2026-08-06)"
tags: ["incident", "process-violation", "verdict-less-merge"]
updated_at: 2026-08-06T02:49:35.828Z
---

運用規律の再締結 (2026-08-03) 違反の再発。PR #268 (Codex, stop-refresh mutex 修復 dec6b971 込み) と PR #271 (Claude 起票の PLAN-L7-462 freeze 初版) が、いずれも reviews 0 のまま merge された (#268 = 2026-08-06T02:38Z, #271 = 02:44Z)。#271 は blind review (claude-opus-5) の FLAG verdict (blocking 4 件) が出る前に merge され、是正は PR #272 (freeze errata) で実施。内容面: #268 の mutex 修復は妥当 (bare mkdirSync 復元を実測確認)、#271 の欠陥は #272 で是正。verdict-less merge はこれで #189/#210/#103/#235 に続く再発であり、D3d (verdict-as-required-check, issue #218) の優先度を強める実測。
