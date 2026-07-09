---
plan_id: PLAN-L7-260-sensitive-scan-boundary
title: "PLAN-L7-260 (impl): 機密スキャン境界の拡張 (.ut-tdd/audit・logs・docs 全域)"
kind: impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-09
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - 検出パターン設計 (self-trigger 回避 + 誤検知境界) レビュー"
  - role: se
    slot_label: "SE - スキャン lint 実装 + pre-push 対象見直し"
parent_design: docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-260-sensitive-scan-boundary.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
  requires:
    - docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
  references:
    - .ut-tdd/audit/A-178-control-layer-gap-audit-2026-07-02.md
    - src/export/document-export.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    - docs/design/harness/L6-function-design/secret.md
---

# PLAN-L7-260 (impl): 機密スキャン境界の拡張

## Status

draft 継続 (2026-07-09 更新)。`PLAN-L6-62` の L6 secret-scan 契約から降下し、
`src/lint/secret-scan.ts`、doctor hard gate、distribution materialize 前 preflight、
`tests/secret-scan.test.ts` までは実装済み。pre-push hook 対象見直しが carry のため、本 PLAN 自体は
confirmed にしない。

## 背景 — 監査証跡ディレクトリが検査の空白地帯

- pre-push の PII 検査対象は `*CLAUDE.md` / `*SKILL.md` / `*/references/*.md` の 3 パターンのみ。
- docexport redaction は docs/ の 6 正本 family のみ走査。
- **`.ut-tdd/audit/` と `.ut-tdd/logs/` (追跡・commit される監査証跡) はフリーテキスト機密 (氏名/住所/内部 URL/個人パス) の検査がゼロ** — 防波堤は pre-commit の API key regex のみ。A-1xx 監査レポートを量産する現運用と整合しない。

## スコープ

1. **スキャン lint (doctor 配下)**: `.ut-tdd/audit/`・`.ut-tdd/logs/`・`.ut-tdd/memory`・docs/ 全域を対象に
   credential marker を検査する。fail-close は secret 系。PII 疑い系は本 PLAN では扱わず、別 security/privacy
   起票へ分離する。
2. **self-trigger 回避設計**: 検出器を説明する doc がパターン素書きで自己発火した前例を踏まえ、テスト用 token は
   runtime 連結で生成し、dummy / placeholder 例外は同一行 marker 必須にする。
3. **distribution preflight**: `sync-stage` / `sync-pack` / `package` の copy/prune/tar 前に同じ scanner を走らせる。
4. **pre-push 対象見直し**: 今回は doctor / distribution の hard gate で閉じる。pre-push hook の追加は別 slice。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | パターン設計 + self-trigger 回避書式の確定 (TL) | 完了 |
| 2 | スキャン lint 実装 + 初回棚卸し | 完了 |
| 3 | distribution preflight + regression test | 完了 |
| 4 | pre-push 見直し | carry |

## DoD

- [x] `.ut-tdd/audit/` / `.ut-tdd/memory` を含む active runtime surface が doctor で検査される。
- [x] 検出器自身の doc/テストが self-trigger しないよう、テスト token は runtime 連結で生成する。
- [x] distribution materialize 前に secret-scan が fail-close する。
- [ ] pre-push hook の対象見直しは別 slice へ carry。
