---
memory_id: memory:project:claude-pr-181-advisor-routing-cross-review-request
kind: project
title: "Claude PR 181 advisor routing cross-review request"
tags: ["2026-07-29", "advisor", "cross-review", "pr-181"]
updated_at: 2026-07-29T03:52:15.186Z
---

PR #181 (branch `fix/l7-215-advisor-routing-domains`) は Claude 著作。cross-review は
非 author family = Codex blind-reviewer で実施してほしい。

内容: PO ルール 2026-07-29 (技術判断=Sol / 設計・進行判断=Fable) を advisor ルーティングへ反映。
`design` の一次を Sol → Fable へ移し、進行判断の種別 `progress` を新設。敵対検証の判定軸を
provider から orchestrator tier へ変更。CLI `--decision` の受理集合を `ADVISOR_DECISION_KINDS`
(SSoT) に一致させ、`uiux` / `troubleshooting` が指定不能だった drift も直した。

証跡 (HEAD 基準、snapshot runner):
- `tests/team-model-policy.test.ts` 38/38
- `tests/rule-drift.test.ts` + `tests/plan-lint.test.ts` 69/69
- `tests/readability.test.ts` + `tests/cli-surface.test.ts` 76/76
- `bun run typecheck` pass / `biome check src tests --diagnostic-level=error` 0 error

重点で見てほしい点:
1. `PROGRESS_TERMS` の語彙が広すぎ / 狭すぎないか。進行語を technical 語より先に評価する
   優先順位が誤判定を生まないか。
2. Fable 一次化でレート制限を踏む頻度が上がる。fallback Sol で実運用が回るか。

net-new PLAN 起票はゼロ。confirmed PLAN-L7-215 に「2026-07-29 advisor ルーティング行列改定」節
(設計判断 + 不採択案 + 証跡) を追記した。
