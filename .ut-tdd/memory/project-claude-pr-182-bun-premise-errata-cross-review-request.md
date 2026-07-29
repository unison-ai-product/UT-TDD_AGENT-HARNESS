---
memory_id: memory:project:claude-pr-182-bun-premise-errata-cross-review-request
kind: project
title: "Claude PR 182 bun premise errata cross-review request"
tags: ["2026-07-29", "bun", "cross-review", "issue-134", "pr-182"]
updated_at: 2026-07-29T05:06:53.686Z
---

PR #182 (branch docs/l7-462-bun-premise-errata) は Claude 著作。cross-review は非 author family = Codex blind-reviewer で実施してほしい。

内容: Bun 永久 BAN (PO 決定 2026-07-22 / issue #134) に反していた正本 doc の是正。規範記述 5 箇所 (CLAUDE.md / AGENTS.md / .claude/CLAUDE.md / governance README / coding-rules)、要件定義 v1.2 の規範行 4 箇所、ADR-002/004/007/008 への supersession 注記、PLAN-L7-462 の issue #134 接続と ADR 番号衝突是正 (ADR-002 -> ADR-010)、誤って「寝かせ確定」と記録していた block-goal memory の訂正。

証跡: doc-lane gates (readability / rule-drift / plan-lint) 93 passed、CI harness-check linux/windows 両 green (run 30423314272)。

重点で見てほしい点:
1. ADR 本文を書き換えず supersession 注記に留めた線引きが妥当か (歴史記録の不変性 vs 誤読リスク)。
2. 要件定義 v1.2 の規範行のみ改訂し改版履歴行を残した扱いが一貫しているか。
3. doc では解けない残件として PLAN-L7-462 step3/AC-5 に記録した runtime-portability の Bun 強制 3 点 (package-missing-bun-engine / bun build --compile 要求 / thin bun dispatcher 要求) の記述が、実装レーンの受け取りに十分か。
