---
memory_id: memory:feedback:standing-directive-plan-l7-392-merge-into-engine-swap
kind: feedback
title: "Standing directive: PLAN-L7-392 merge into engine swap"
tags: ["codex", "directive", "engine-swap", "plan-l7-392"]
updated_at: 2026-07-08T08:27:53.345Z
---

PO 指示 (2026-07-08、対象=Codex/Claude 両ランタイム): handover は「DB 導出 digest (状態) + HARNESS メモリ (知識) + HEAD (事実)」の 3 点へ収束させる。PLAN-L7-392 (memory 昇格 nudge / SessionStart 固定4段 digest / telemetry TTL-auto-ack、draft) をエンジン載せ替えの handover/workflow 改修へ合流させて実装すること。載せ替え側で同等機構を設計した場合は supersedes 宣言 + 相互参照で PLAN-L7-392 を置き換えてよい。永続教訓は ut-tdd memory add へ昇格する (CLAUDE.md/AGENTS.md 追記済み)。本エントリは directive であり、PLAN-L7-392 (または後継) が confirmed になった時点で削除すること。
