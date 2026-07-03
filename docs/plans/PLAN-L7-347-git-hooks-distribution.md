---
plan_id: PLAN-L7-347-git-hooks-distribution
title: "PLAN-L7-347 (impl): git hooks の追跡・配布化 — .githooks/ + core.hooksPath + setup 配線 + doctor probe (機械化済み誤認の解消)"
kind: impl
layer: L7
drive: be
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 (Pack 配布動線とも連動 — RECOVERY-06 系と整合確認)"
  - role: tl
    slot_label: "TL - hooksPath 方式 vs setup コピー方式の選定"
  - role: se
    slot_label: "SE - .githooks/ 移設 + setup + doctor probe"
generates:
  - artifact_path: docs/plans/PLAN-L7-347-git-hooks-distribution.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-183-runtime-parity-vendor-lessons-audit-2026-07-03.md
---

# PLAN-L7-347 (impl): git hooks の追跡・配布化

## Status

**version-up parked (v2)**。A-183 所見 LM-6 (本監査で最も見落とされやすい「機械化済みという誤認」の実例)。PO 指示 2026-07-03。

## 背景 (実測 2026-07-03、A-183 §1、裏取り済)

- `.git/hooks/pre-commit` (secret/PII scan)、`pre-push` (同)、`commit-msg` (Conventional Commits 強制) はこのマシンに実在するが、**git 非追跡・core.hooksPath 未設定** — fresh clone / CI / 他の開発機では**この防御が一切効かない**。
- 影響: 「Conventional Commits は機械強制済み」「secret 検査は pre-commit がある」という自己認識が配布境界を跨ぐと崩れる (A-178 型 control-layer-gap の新変種)。Pack consumer にも同じ穴が輸出される。

## スコープ (1 要件: git hooks を追跡資産にし、インストール状態を doctor で検証可能にする)

1. hooks を `.githooks/` (tracked) へ移設し、方式を TL 選定: 案 A `git config core.hooksPath .githooks` (setup が設定) / 案 B setup が `.git/hooks/` へコピー (hooksPath を汚さない)。**案 A 推奨** (更新が自動追従)。
2. `ut-tdd setup` にインストール step を追加 (既存 repo でも冪等)。
3. doctor probe: hooksPath 設定 (or コピー鮮度) を検査し、未インストールなら warn + 直し方 1 行。
4. 既存ローカル hooks の内容は原則そのまま移設 (挙動変更しない — 変更が必要な場合は明示して TL 判断)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 方式 (A/B) の TL 選定 | 直列 (先行) |
| 2 | .githooks/ 移設 + setup 配線 | 直列 |
| 3 | doctor probe + tests + 実機で commit-msg 発火の実走確認 | 直列 |

## DoD

- [ ] `.githooks/` が git 追跡され、fresh clone + setup で commit-msg が発火する (実走 evidence)
- [ ] doctor が未インストール状態を warn する (test 固定)
- [ ] 既存 hooks と移設後の挙動一致 (diff 突合)
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- Windows 第一級: hooks は sh 前提のことが多い — Git for Windows の sh で動く形を維持し、実機 (Windows) で発火確認。
- 共有 memory (L7-189) が「器あり中身ゼロ」(A-183 LM-7) — 本 PLAN 完了時の教訓を最初の authored entry として `ut-tdd memory add` する (運用定着の種)。
- 活性化時 kind は add-impl へ昇格。
