---
memory_id: memory:feedback:pr-336-exact-head-779aa93b-ci-fully-green-but-flag-blocking-3-stands-because-ci-does-not-inspect-design-semantics
kind: feedback
title: "PR 336 exact head 779aa93b ci fully green but FLAG blocking 3 stands because ci does not inspect design semantics"
tags: ["ci-green", "closing-verdict", "d3a", "issue-328", "pr-336"]
updated_at: 2026-08-18T11:42:27.790Z
---

## PR #336 exact HEAD 779aa93b263103c51384d1317714404e8f183579: CI 3 job green でも判定は FLAG (blocking 3 / advisory 4) のまま

run 32131375208 の harness-check / Linux / Windows すべて SUCCESS。HEAD 不変 (review 4960572332 が同 HEAD に紐付き)。merge は未実施 (draft + 依頼が merge 禁止)。

### CI が blocking を打ち消さない理由 (docs-only PR に固有)

- B-1 (requestDigest preimage 未定義): plan lint / doctor は PLAN 本文の意味論を検査しないので未定義でも green。
- B-2 (gitignored 前提が偽): .gitignore に .ut-tdd/review/** の rule は存在せず、この不整合を見る gate も無い。
- B-3 (既存 oracle U-RVATT-010 と同時成立不能): 本 PR は source/test を変更しないため既存 test は green のまま。契約と test の矛盾は実装 PR で初めて赤くなる。

### 教訓

docs-only の設計 freeze PR では CI green は「文書が既存 gate を壊していない」ことしか意味しない。契約の意味論・前提の真偽・既存 oracle との同時成立可能性はレビューでしか検出できないため、CI green を PASS の根拠として提示されても判定を動かさない。
