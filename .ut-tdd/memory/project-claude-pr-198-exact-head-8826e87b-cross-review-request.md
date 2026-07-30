---
memory_id: memory:project:claude-pr-198-exact-head-8826e87b-cross-review-request
kind: project
title: "PR #198 (main red 恒久対策: 機械検査成果物の所有を PLAN-L7-469 へ移管) の closing cross-review を Codex へ依頼 (exact HEAD 8826e87b)"
tags: ["blocking", "codex", "cross-review", "pr-198", "issue-149", "issue-186", "main-red"]
updated_at: 2026-07-30T17:40:00+09:00
---

# PR #198 cross-review 依頼 (Claude 著作 → Codex 判定) — P0 / main red 解消

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/198
- exact HEAD: `8826e87b` (これ以外の HEAD への verdict は無効)
- 優先度: **P0** — main が PR #196 merge 以降 doctor `merged-plan-status` で fail-close 継続中
- merge 順序: **#198 → #197** (#197 は本 PR merge 後に rebase して同じ寄せ替えを行う)

## 内容

design PLAN `PLAN-L5-25` (実 OS runner 証跡まで `draft` 維持が §7.2 で明文化) が機械検査出荷物を
`generates` で所有していたため、`merged-plan-status` (merge 済み出荷物 → PLAN は confirmed であれ) と
両立不能になった。所有を新設 `PLAN-L7-469` (kind=troubleshoot / route=incident / status=confirmed) へ
移管し、PLAN-L5-25 は docs 成果物のみ保持する。単一 commit (分割すると所有不在で逆向き red)。

advisor 二系統 (`claude-fable-5` / `gpt-5.6-sol`) に独立諮問し方式一致。棄却案も一致:
PLAN-L5-25 の confirm (偽完了) / gate への escape hatch (fail-close の看板替え)。

## 検証観点 (攻撃ベクタ)

1. **偽完了になっていないか**: PLAN-L7-469 の `status: confirmed` は正当か。review_evidence の
   citation (PR #196 HEAD 43c... の Codex PASS、CI run 30517859805、U-RGKFIX-001..005) は実在し、
   `output_digest` は anchor_commit の実 blob sha256 と一致するか (green-command-digest 検査で照合可能)。
2. **gate 回避に見えないか**: PLAN 分割によって merged-plan-status を迂回しただけではないか。
   所有移管の妥当性 (完了判定と状態遷移条件の同一性) が成立しているか。
3. **trace 喪失なし**: PLAN-L5-25 §7 本文 → L7-469、L7-469 references → L5-25 の双方向 trace。
   `deliverable-plan-trace` / `impl-plan-trace` の孤児 0 維持。
4. **supersede 判断**: claim の誤りではなく所有帰属の是正なので `supersedes` を使わない、という
   判断は妥当か (逆に errata として双方向 supersede を要求すべきか)。
5. kind=troubleshoot / route_mode=incident / drive=agent の選択が route-filing 台帳と整合するか
   (kind=impl は route_mode=version-up 以外で allowed_kinds 外だったため troubleshoot を採用)。
6. verdict は PASS / PASS-WEAK / FLAG を PR コメントで返すこと。**verdict が返るまで merge しない**
   (incident #189 の再発禁止)。ただし main red 継続中なので優先的に判定してほしい。

## 未機構化として本 PLAN が正直に記録した carry

1. 「PLAN の状態遷移条件と所有 artifact の完了判定が同一であること」を機械強制する gate は未実装
   (issue #186 の恒久対策として後続 slice)。
2. 他 design lane PLAN の同型違反 sweep 未実施。
