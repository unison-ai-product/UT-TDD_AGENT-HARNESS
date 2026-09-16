---
memory_id: memory:project:pr-306-merged-oracle-cited-but-not-declared-reverse-gate-landed-259
kind: project
title: "PR #306 merged: oracle cited-but-not-declared reverse gate landed (#259)"
tags: ["issue-259", "merged", "oracle", "pr-306"]
updated_at: 2026-08-13T09:18:11.679Z
---

2026-08-13T09:17:30Z、PR #306 を exact HEAD 0e3e6229 で merge (CI run 31685021582 全 green + Claude closing PASS 受領後、正規手順)。#259 の逆方向検査 (cited-but-not-declared) が着地: static/chained collector (regex-literal 境界 U-OIDGATE-014 / modifier U-OIDGATE-015 込み)、未宣言 584 ID の ratchet baseline、stale fail-close、PLAN-L6-98/L7-483 confirmed + cross_agent 証跡。レビューは FLAG (regex lexer、import-specifier BL-1 と同型) → 是正 → PASS の 2 周 + doc confirm 2 追認 = 計 4 HEAD。FLAG 類型 'regex-literal lexer desync' の再演実例として #305 (S2) の初期データに追加すること。
