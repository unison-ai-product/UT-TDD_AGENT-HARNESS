---
plan_id: PLAN-L7-344-vendor-contract-doctor
title: "PLAN-L7-344 (impl): ベンダー surface 契約 doctor — CLI flag 実機突合 + 既知非互換 config key denylist + 週次 watch 運用"
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
    slot_label: "PO - v2 活性化時期"
  - role: tl
    slot_label: "TL - 突合の fail-open 設計レビュー (vendor 不在環境で doctor を赤くしない)"
  - role: se
    slot_label: "SE - doctor check + denylist + 運用追記"
generates:
  - artifact_path: docs/plans/PLAN-L7-344-vendor-contract-doctor.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-183-runtime-parity-vendor-lessons-audit-2026-07-03.md
    - docs/plans/PLAN-L7-311-probe-harness.md
    - src/runtime/adapter-policy.ts
---

# PLAN-L7-344 (impl): ベンダー surface 契約 doctor

## Status

**version-up parked (v2)**。A-183 所見 VD-2/VD-3/VD-4。PO 指示 2026-07-03。

## 背景 (実測 2026-07-03、A-183 §2)

- **VD-2**: `src/runtime/adapter-policy.ts:3-9` の CLI 引数定数 (`CODEX_STDIN_ARGS`/`-m`/`--model`/`--effort`) を検証するテストは定数を import して自分と突合する**自己参照**のみ — `codex --help` / `claude --help` 実出力との照合が無い。vendor が flag を変えると `--execute` 時にのみ非 0 exit で露見 (dry-run 経路では永続不可視)。
- **VD-3**: config.toml `service_tier` 非互換で codex provider が実行不能になった実害 (2026-07-02、L7-263 review_evidence) の後も、既知非互換 key の機械検出はゼロ (`grep -rn service_tier` = 当該 1 文のみ)。次に誰かが設定すると同じ障害が無警告再現。
- **VD-4**: pmo-tech-news (週次 watch 想定) の起動トリガーが repo に存在せず、vendor changelog を読む定常経路が無い。

## スコープ (1 要件: ベンダー surface 前提の drift を doctor で検出可能にする)

1. doctor check `vendor-contract` (warn-first / **vendor binary 不在なら skip = fail-open**): `codex --help` / `claude --help` を実行し、adapter-policy の flag 文字列が出力に含まれるか突合。
2. 既知非互換 config key の **denylist** (`service_tier` を初項に、実害確認のたび追記する reactive 方式): `.codex/config.toml` に denylist key が現れたら warn。全 key 網羅はしない (vendor 内部仕様の変動が速く費用対効果が低い — スコープ宣言)。
3. 運用 1 行: 週次で `pmo-tech-news` を明示駆動する定常タスクを運用チェックリスト (update 戦略 §5 系) に追記。
4. hook stdin payload の fixture 再捕捉 (VD-1) は本 PLAN でなく **L7-311 のスコープ追記側**で扱う (二重起票しない)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | fail-open 設計の TL レビュー (CI/Linux に vendor binary が無い前提) | 直列 (先行) |
| 2 | vendor-contract check + denylist + tests | 直列 |
| 3 | 運用チェックリスト追記 | 並列可 |

## DoD

- [ ] flag 不一致 fixture が warn になる (test 固定)
- [ ] vendor binary 不在環境で check が skip (CI green を壊さない、test 固定)
- [ ] `.codex/config.toml` に service_tier を書いた fixture が warn (test 固定)
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- --help 実行はタイムアウト付き (5s 目安) + 失敗時 skip。doctor の実行時間予算 (L7-300) に注意し、`--scope` 実装後は scoped 対象に含めない選択も可。
- 活性化時 kind は add-impl へ昇格 (Reverse pairing 必須)。
