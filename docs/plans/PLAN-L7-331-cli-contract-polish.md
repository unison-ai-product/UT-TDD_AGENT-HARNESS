---
plan_id: PLAN-L7-331-cli-contract-polish
title: "PLAN-L7-331 (impl): CLI 契約の小粒是正 — handover exit code / typo suggestion / --json 統一 / exit code 2 文書化"
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
    slot_label: "PO - v2 活性化時期 (Codex CLI 抽出フェーズ完了がトリガー)"
  - role: tl
    slot_label: "TL - exit code 契約 (0=pass/1=error/2=blocked) の整合レビュー"
  - role: se
    slot_label: "SE - cli.ts 4 項目の是正 + regression tests"
generates:
  - artifact_path: docs/plans/PLAN-L7-331-cli-contract-polish.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/plans/PLAN-L7-327-doctor-json-cli-contract.md
---

# PLAN-L7-331 (impl): CLI 契約の小粒是正

## Status

**version-up parked (v2)**。A-182 所見 CX-3/4/5/6 (QU-4)。PO 指示 2026-07-03「アップデートでプラン化」。**CX-2 (doctor --json) は本 PLAN の対象外 — Codex が PLAN-L7-327 で当日実装中** (監査→即日実装の先例型)。**CX-1 (--plan 二義性) も対象外** — API 破壊変更のため PO の方式決定 (--plan-file 分離 vs --text-file 一本化) 後に別 PLAN で起票する (仕様を発明しない)。

## 背景 (実測 2026-07-03、A-182 §2 LENS-CX。いずれも HEAD 実測 + 裏取り済)

- **CX-3**: `handover` action が `process.exitCode` を設定せず常時 0 (provider export は 1 を返す非対称)。CI/hook が成否判定不能。
- **CX-5**: `showSuggestionAfterError` 未設定 — 78+ コマンドで typo 時に suggest が出ず、AI の再試行ループを誘発。
- **CX-6**: `route eval` のみ `--format <text|json>`、他コマンドは `--json` boolean。`route eval --json` は無言で無視される。
- **CX-4**: guard 系 (agent-guard / work-guard / guard preflight) の exit code 2 (= blocked) が help 未記載。1 (error) との区別に実装読解が必要。

## スコープ (1 要件: CLI の exit code / フラグ / typo 契約を AI が誤用できない形に揃える)

1. `handover` action に `process.exitCode = r.ok ? 0 : 1` 相当を追加 (runHandover 戻り値の ok 相当フィールドを確認して配線)。
2. program 初期化直後に `program.showSuggestionAfterError(true)` を追加。
3. ~~`route eval` に `--json` boolean を追加~~ — **Codex が PLAN-L7-343 (commit 2a41cb1) で当日 landed 済みにつき本 PLAN から除外** (CX-6 解消。監査→即日実装の 2 例目)。
4. guard 系 3 コマンドの description に `exits: 0=pass, 1=error, 2=blocked` を明記。
5. 各項目に regression test (exit code / suggest 出力 / --json 等価) を追加。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | Codex CLI 抽出の完了確認 (`git log` + cli.ts の構造確認 — hot zone 回避) | 直列 (先行) |
| 2 | 項目 1-4 の実装 (独立、ファイル接触が同一のため 1 commit に束ねる) | 直列 |
| 3 | regression tests + `bun run test` full green | 直列 |

## DoD

- [ ] `ut-tdd handover` が失敗時に exit 1 を返す (test 固定)
- [ ] typo コマンドで suggestion が表示される (test 固定)
- [ ] ~~route eval --json~~ (L7-343 で landed 済み — 対象外)
- [ ] guard 系 help に exit code 契約が表示される
- [ ] `bun run test` full green + doctor green

## 実装ノート (後続モデル向け)

- 触るファイル: `src/cli.ts` (または抽出後の該当 registrar)、`tests/cli-surface.test.ts` 系。**着手前に必ず Grep で現物再特定** (Codex 抽出で行番号・所在が恒常的にずれる)。
- L7-327 (doctor --json) と出力契約の書式を揃える — 先に landed した側の JSON envelope 形式に従う。
