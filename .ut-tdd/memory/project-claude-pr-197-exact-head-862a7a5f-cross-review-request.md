---
memory_id: memory:project:claude-pr-197-exact-head-862a7a5f-cross-review-request
kind: project
title: "PR #197 (L5契約→42 oracle 全数写像、D0 train PR-2) の closing cross-review を Codex へ依頼 (exact HEAD 862a7a5f)"
tags: ["blocking", "codex", "cross-review", "pr-197", "issue-149", "d0-pair-freeze"]
updated_at: 2026-07-30T16:40:00+09:00
---

# PR #197 cross-review 依頼 (Claude 著作 → Codex 判定)

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/197
- exact HEAD: `862a7a5f` (これ以外の HEAD への verdict は無効)
- train 位置: D0 L5/L8 pair-freeze PR-2 (PR #196 の後続、issue #149)
- 依頼日: 2026-07-30

## 内容

PLAN-L5-25 §7.1 (C-RGK-01..58 → IT-RGK-PHYS-* 全数写像、双方向孤児 0) と §7.2
(pair-freeze 条件 / confirmed 昇格条件の分離)。機械検査は
`src/lint/resource-kernel-pair-mapping.ts` + `tests/resource-kernel-pair-mapping.test.ts` +
doctor hard gate `resource-kernel-pair-mapping` (4 ゲート配線済: lint-wiring /
impl-plan-trace / deliverable-plan-trace / FULL_DOCTOR_OUTPUT_IDS roster)。

## 既知の未解決 (レビュー時考慮)

- CI red: `merged-plan-status` violation — PLAN-L5-25 が draft のまま #196 の deliverable
  (fixture-manifest lint/test) が main に merge 済みになった構造 torsion (issue #186 同族)。
  是正方針は PO 判断待ちで、確定後 #197 へ積むか別 PR で先行修正する。

## 検証観点 (攻撃ベクタ)

1. §7.1 の写像は意味的に正しいか (機械検査は ID の双方向存在しか見ない。契約要約と
   被覆 oracle の対応が恣意的でないかはレビュー判定)。
2. C-RGK 分解が §1〜§6 の物理契約を取りこぼしていないか (58 分割の網羅性)。
3. §7.2 (A) pair-freeze 条件の「本 PR 時点で充足」主張は実測と一致するか。
4. doctor gate の fail-close 動作 (doc 読めない場合 violation) は妥当か。
5. 元 commit の literal NUL byte (git binary 化) は U+0000 escape へ修正済み —
   readability 系 gate への残余影響が無いか。
6. verdict は PASS / PASS-WEAK / FLAG を PR コメントで返すこと。verdict が返るまで
   merge しない (incident #189 の再発禁止)。

## 手順

merge 権は非著作側 (通常どおり)。CI required check `harness-check` green が前提。
