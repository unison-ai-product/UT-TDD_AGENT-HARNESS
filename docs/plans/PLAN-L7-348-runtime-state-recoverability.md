---
plan_id: PLAN-L7-348-runtime-state-recoverability
title: "PLAN-L7-348 (impl): runtime state の復旧可能性 — 一次/派生データ区分台帳 + バックアップ経路 + 復旧実走 probe"
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
    slot_label: "PO - v2 活性化時期 + バックアップ方式 (git 追跡 or 外部) の決定"
  - role: tl
    slot_label: "TL - 一次/派生の区分判定レビュー"
  - role: se
    slot_label: "SE - 区分台帳 + backup + 復旧 probe"
generates:
  - artifact_path: docs/plans/PLAN-L7-348-runtime-state-recoverability.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-183-runtime-parity-vendor-lessons-audit-2026-07-03.md
    - docs/plans/PLAN-L7-301-telemetry-retention.md
---

# PLAN-L7-348 (impl): runtime state の復旧可能性

## Status

**version-up parked (v2)**。A-183 所見 OR-2。PO 指示 2026-07-03。

## 背景 (実測 2026-07-03、A-183 §1)

- `.ut-tdd/harness.db` (59MB) と `.ut-tdd/logs/` (3.4MB) は **git 未追跡でバックアップ経路なし**。audit/handover/evidence (121 ファイル) は追跡済み。
- projection 行は `ut-tdd db rebuild` で docs/state から再生可能。しかし**実行由来の一次データ** (session jsonl、guardrail_decisions、foreign-edit-overrides.jsonl 等の provenance 付き行) は、マシン喪失・db 破損・誤削除で**永久に消える**。5,700+ 件の feedback_events もこの範疇。
- 「何が消えたら戻らないか」の区分台帳・復旧手順 doc・復旧の実走検証のいずれも存在しない (OR-2)。

## スコープ (1 要件: 消失不可データを特定し、復旧経路を機械検証可能にする)

1. **区分台帳**: harness.db 全テーブル + .ut-tdd/ 全ディレクトリを「一次 (実行由来、再生不能)」「派生 (rebuild で再生可能)」「transient (捨ててよい)」に仕分けし、docs/governance/ へ台帳化。判定は provenance 列 (A-176/178 の区分) を根拠に。
2. **バックアップ方式の決定 (PO slot)**: 案 A 一次データのみ定期 export (jsonl) を git 追跡ディレクトリへ / 案 B 外部バックアップ (repo 外) + 手順 doc のみ。secret/PII 検査を export 経路に必須で挟む (audit 証跡の安全境界)。
3. **復旧 probe**: 「db を退避 → rebuild → 一次データ import → 行数/代表行の突合」を実走する手順を doc 化し、可能なら doctor `--recovery-probe` 相当の opt-in 検査に。
4. retention (L7-301) との整合: prune 対象は「派生 or transient」に限る規約を台帳へ明記 (一次を prune で失わない)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 区分台帳の作成 + TL レビュー | 直列 (先行) |
| 2 | バックアップ方式の PO 決定 → 実装 | 直列 |
| 3 | 復旧 probe 実走 + 手順 doc | 直列 |

## DoD

- [ ] 区分台帳が全テーブル/全ディレクトリを被覆 (COUNT と台帳行数の突合)
- [ ] 一次データの export → 復旧の実走 evidence (行数突合ログ)
- [ ] export 経路に secret 検査が挟まっている (test 固定)
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- 59MB の DB 全体を git に入れない — 一次データの選別 export が正 (retention 後はさらに小さくなる)。
- 活性化時 kind は add-design + add-impl 対へ昇格 (台帳 = 設計 artifact)。
