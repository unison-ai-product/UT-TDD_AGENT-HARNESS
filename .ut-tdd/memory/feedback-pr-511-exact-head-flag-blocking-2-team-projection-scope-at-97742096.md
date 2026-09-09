---
memory_id: memory:feedback:pr-511-exact-head-flag-blocking-2-team-projection-scope-at-97742096
kind: feedback
title: "PR 511 exact-head FLAG blocking 2 team projection scope at 97742096"
tags: ["canonical-receipt", "flag", "issue-482", "pr-511"]
updated_at: 2026-09-01T09:45:43.872Z
---

PR #511 exact HEAD 97742096ee27afc7f7af316bf1af70f25476fc95 のcanonical review receipt。
verdict=FLAG blocking=2
reviewRevision=rv1-8b430dd7688f7b541f0d1f74afc0181b36e630855077c5b601551b0f1d578d22
reviewerFamily=claude (claude-opus-5)

1. PLAN-L7-528 4.1 と test design CANDIDATE-001 は buildCleanDistributionPlan(git ls-files) が required 6 artifact を各 exactly once 出力すると凍結しているが、team projection の source .ut-tdd/teams/example-review-team.yaml は src/setup/distribution.ts:94 CLEAN_DENY_PREFIXES の ".ut-tdd/" に該当し、includedSourcePaths の filter (isAllowedCleanPath && !isDeniedCleanPath, distribution.ts:274-276) で remap 前に除外されるため、現行 pipeline では docs/templates/team/example-review-team.yaml は生成不能である。既存 projection (docs/skills/ -> skills/、pack-harness-check.yml -> .github/workflows/harness-check.yml) はいずれも allow 済み source からの remap であり、denied source を投影する機構は存在しない。さらに PLAN 5 は ".ut-tdd/** の例外 allow ではなく" と唯一の単純経路を明示的に禁じたうえで代替機構を凍結していないため、実装 PR で方式を発明せざるを得ず、CLAUDE.md の「契約 freeze が実装 PR の前提 / 方式判断は実装 PR の中で発明・変更しない」に反する。deny 判定より前段の明示 projection map (source -> artifact) を契約として凍結すること。

2. team projection は Issue #482 の実装範囲 (docs/templates/{plan,design,state,prompts}/** の allowlist 追加) と受入条件 (必須 5 template) のいずれにも無い新規追加であり、runtime state を Pack path へ投影するという新機構を伴う trade-off (投影する / team template を出荷しない / source を docs/templates/team/ へ移設する) を持つにもかかわらず、PLAN-L7-528 に設計判断節も advisor 相談証跡も無い。CLAUDE.md の設計判断エリシテーション規約は採択結果を PLAN の設計判断節へ記録することを要求しており、pair-freeze 文書でこれを欠くと FINDING 1 の未凍結と合わせて下流での方式発明を確定させる。

bounded 契約修正 (team projection の採否を設計判断として明示するか、#482 の宣言範囲へ縮退) 後、新 exact HEAD で fresh review を依頼すること。この receipt の再利用不可。
