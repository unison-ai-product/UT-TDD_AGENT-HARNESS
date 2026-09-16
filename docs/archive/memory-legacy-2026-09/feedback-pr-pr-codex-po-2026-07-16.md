---
memory_id: memory:feedback:pr-pr-codex-po-2026-07-16
kind: feedback
title: "PRクロスレビュー役割分担: 自分のPRのレビューを自分でCodex起動して回さない (PO 2026-07-16)"
tags: ["cross-review", "hybrid", "po-rule", "pr"]
updated_at: 2026-07-16T02:01:08.103Z
---

PO 指摘 (2026-07-16): PR クロスレビューの役割分担を取り違えるな。

- 自分 (Claude) が author の PR は、自分が `ut-tdd codex --role blind-reviewer` 等で Codex を呼び出してレビューさせるものではない。横で並行作業している Codex ランタイムが独立にレビューする (author 側がレビュー実行を driver しない)。author は待つ。
- 自分がレビュー/マージを担当するのは **Codex が author の PR** (例: PR #64)。クロスレビューの「クロス」は provider 間の攻守分離であり、author が相手 provider を子プロセスとして呼べば独立性が壊れる。

**Why**: author 自身がレビュー主体を起動すると packet 構成・タイミング・コンテキストを author が支配し、blind/adversarial レビューの独立性 (PLAN-L6-53 の attacker/defender 分離) が形骸化する。

**How to apply**: 自分の PR を出したら次の作業へ移り、レビューは相手ランタイムに任せる。「次は何」の候補に「自分の PR のレビューを自分で回す」を入れない。相手 PR のレビュー/マージ依頼が来たらそちらを担当する。
