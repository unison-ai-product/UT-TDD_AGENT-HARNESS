---
plan_id: PLAN-L7-507-compiled-distribution-contract-retraction
title: "PLAN-L7-507 (troubleshoot): compiled 配布契約の ADR-001 追随 — `bun build --compile` 記述と強制の撤去"
kind: troubleshoot
layer: L7
drive: agent
route_signal: incident
route_mode: incident
status: draft
created: 2026-08-25
updated: 2026-08-25
backprop_decision: not_required
backprop_decision_reason: "ADR-001 が既に配布契約を『exact pin した Node/npm から生成する compiled ESM + sealed build receipt』へ確定済みであり、本 PLAN は下位正本に残った旧 `bun build --compile` 記述を ADR-001 へ追随させる stale 記述の是正である。新規の配布方式・契約を作らないため上流層への backprop は発生しない。"
owner: PM / PO
github_issue_id: 134
agent_slots:
  - role: aim
    slot_label: "AIM - 旧 compiled 配布が保護対象として実在するかの監査と、L4:35 削除禁止条項の適用可否の判断"
  - role: tl
    slot_label: "TL - requirements / L4 / L6 の記述改訂が ADR-001 と矛盾しないことのレビュー"
  - role: se
    slot_label: "SE - package.json build / lint 規則 / wrapper dist 分岐 / テストの撤去実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-507-compiled-distribution-contract-retraction.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/plans/PLAN-L7-462-bun-runtime-withdrawal.md
    - docs/plans/PLAN-L7-62-runtime-portability-guard.md
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-507 (troubleshoot): compiled 配布契約の ADR-001 追随

## 1. 背景

`PLAN-L7-462` (completed) は harness 自身の実行系を Node へ swap したが、残件を
「Pack 解禁時の後続 PLAN へ deferral」と明記して閉じた (同 PLAN §step 2 の fixture 例外節)。
その後続 PLAN は起票されておらず (`grep -rln "Pack 解禁" docs/plans/` は当該 PLAN 自身のみ)、
Issue #134 の残件は所有者不在のまま滞留していた。

本 PLAN はその残件のうち、**consumer 契約に触れない範囲**、すなわち source repo 内部の
compiled 配布記述と、その記述を機械強制している lint 規則を対象とする。Pack / consumer 側の
Bun 依存 (`src/setup/templates.ts` の `findBun` launcher、consumer CI テンプレートの
`oven-sh/setup-bun`、`src/cli/distribution.ts` の toolchain probe) は**本 PLAN の対象外**で
あり、外部配布契約の変更として別 PLAN が所有する。

## 2. 設計判断

### 2.1 判断: compiled 配布契約は撤回ではなく「ADR-001 への追随」である

当初、本作業は requirements レベルの契約撤回だと想定した。実測でこれは誤りと判明した。

ADR-001 (binding) は既に次を確定している。

```
docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md:38
| 配布 | exact pin した Node/npm と lock graph から生成する compiled ESM + sealed build receipt |

:26  Bun は新規依存・fallback・検出器 runtime として禁止し、
     既存経路だけを期限付き migration debt として段階撤去する
```

したがって `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md:1589` の
「配布時 `bun build --compile` の単一バイナリ」は **ADR-001 に supersede された旧記述**であり、
現に生きている契約ではない。本 PLAN は新しい判断を持ち込まず、下位正本を ADR-001 の確定内容へ
追随させる。

### 2.2 判断: L4:35 の削除禁止条項は本件に適用されない

`docs/design/harness/L4-basic-design/architecture.md:35` は
「旧配布を migration debt として inventory し、Node generation の同一性・rollback 成立前に
削除しない」と定める。この条項は**稼働中の旧配布を replacement 成立前に壊さない**ための
rollback 保全である。本件では保護対象が実在しないことを監査で確認した (§3)。

条項を「例外として破る」のではなく、**前提が事実と異なっていた**ことを記録して当該行を
訂正する。ADR-001:26 自身が「既存経路だけを期限付き migration debt として段階撤去する」と
命じており、撤去は条項違反ではなく未実施の宿題である。

### 2.3 却下した候補

| 案 | 判定 | 理由 |
|---|---|---|
| (B) lint の必須化だけ外し build script は任意で残す | 却下 | 使わない build と Bun 依存を「任意」として温存し、Issue #134 acceptance「Existing Bun compatibility code is deleted, not merely parked」に正面から反する。正本も実態と乖離したまま残る |
| (C) `bun build --compile` を Node SEA へ差し替え | 却下 | 「使う想定がない」配布能力を別方式で再実装する投機的変更。SEA の parity / 署名 / asset / rollback / OS matrix が未設計であり、draft の `PLAN-L6-93` / `PLAN-L7-458` を事実上先行実装する。将来 sealed executable が独立要件として再承認された場合の別 PLAN とする |

### 2.4 advisor 記録

- 一次 (design → `claude-fable-5`): **利用不能**。`.ut-tdd/logs/session/advisor-claude-1787650053292.jsonl` が `outcome:"error"`。native binary 直叩きで `You're out of usage credits.` を確認 (`--effort` の有無に依らず再現)。
- 次点 (`gpt-5.6-sol`): **相談成立**。`--provider codex --decision design` で実行、`exit=0`。判定は「A は条件付き SURVIVE、B/C は REFUTED」。PR を層1/層2 の 2 本に分割する助言を採用した。
- advisor の前提のうち 2 件を実測で差し戻した (§3.2)。

## 3. 監査 — 保護対象は実在するか

### 3.1 実測 (main `6258c510`)

| 観点 | コマンド | 結果 |
|---|---|---|
| CI が build するか | `.github/workflows/harness-check.yml` に `npm run build` / `bun build` | **0 件** |
| Pack 配布物に入るか | `src/cli/distribution.ts:48` | `dist` は `ignored` セット |
| Release asset に入るか | `gh release list` (source repo) | **0 件** (リリース自体が無い) |
| Release asset に入るか | `gh release view v0.1.0..v0.1.4 --repo ...-Pack` | 全 5 件とも asset は `.tar.gz` (約 1MB) / `.sha256` / `.manifest.json` のみ。`bun --compile` バイナリは数十 MB 規模であり混入し得ない |
| 手動 runbook があるか | `git grep -Iln "npm run build" -- docs/ skills/ .github/` | **0 件** |
| ローカルに実体があるか | `ls dist/` | 存在しない |
| バイナリ不在で CLI が動くか | `scripts/ut-tdd` | `dist/ut-tdd` 不在時は `exec node src/cli.ts` |

結論: 正本の配布フロー・リリース資産・自動化・文書化された手順のいずれからも、compiled
artifact は生成も配布も参照もされていない。

### 3.2 advisor 前提の差し戻し

- advisor は「ADR-007 / L5 physical-data / repository-structure にも Bun 契約が残る」と
  主張したが、実測では**該当なし** (`repository-structure.md:181` の `dist/` は F0b sealed
  Node generation の記述であり Bun ではない)。実際の該当は ADR-001 / ADR-006 /
  L4 architecture / L6 function-spec / requirements / PLAN 2 本の計 7 ファイル。
- 一方 advisor の「`globalThis.Bun` は `bun run src/cli.ts` でも成立するので、build 撤去が
  `bun:sqlite` 分岐を到達不能にする因果は誤り」という指摘は**正しい**。本 PLAN 起案時の
  前提を訂正し、SQLite 単一化 (層2) は本 PLAN の帰結としてではなく、
  **全 entrypoint が Node に固定されている**ことを独立の根拠として別 PLAN で扱う。

## 4. スコープ

### 4.1 対象

| 面 | 変更 |
|---|---|
| `package.json:31` | `build` script の削除 |
| `src/lint/runtime-portability.ts` | 規則 `package-missing-compiled-build` の削除 |
| `src/lint/runtime-portability.ts` | wrapper dispatch 許可先から `dist/ut-tdd` を除去 |
| `scripts/ut-tdd` | `dist/ut-tdd` 分岐の削除 |
| `scripts/ut-tdd.ps1` | `dist\ut-tdd.exe` 分岐の削除 |
| `tests/runtime-portability.test.ts` | 上記に対応する fixture / assertion の更新 |
| `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` | :1583 / :1584 / :1589 / :2487 を ADR-001 の配布契約へ追随 |
| `docs/design/harness/L4-basic-design/architecture.md:35` | 保護対象不在の監査結果を反映し削除禁止条項を訂正 |
| `docs/design/harness/L6-function-design/function-spec.md:784` | 実装との drift 是正 (`bun run` fallback → `node`、`TypeScript/Bun first` → Node) |

`docs/adr/ADR-006:22` は oclif を却下した当時の理由記述であり、歴史記録として改訂しない。

### 4.2 対象外

- Pack / consumer 側の Bun 依存 (`src/setup/templates.ts`、consumer CI テンプレート、
  `src/cli/distribution.ts` の `bun --version` probe、`tests/distribution-acceptance.test.ts`、
  `tests/setup.test.ts` の U-SETUP-009b)。外部配布契約の変更であり別 PLAN が所有する。
- `bun:sqlite` / `node:sqlite` 二重ドライバの単一化 (層2、後続 PR)。
- Issue #134 の close。本 PLAN 単独では close しない。

## 5. 受け入れ条件

- AC-1: `package.json` に `bun` を含む script が存在しない。
- AC-2: `runtime-portability` が `package-missing-compiled-build` を出さず、かつ
  `bun build --compile` を欠く `package.json` に対して violation 0 で通る。
- AC-3: `scripts/ut-tdd` / `scripts/ut-tdd.ps1` が `dist` を参照しない。
- AC-4: requirements / L4 / L6 の該当行が ADR-001 の配布契約と矛盾しない。
- AC-5: `harness-check` (typecheck / vitest / biome / doctor) が緑。

## 6. 検証

`node scripts/run-vitest-snapshot.ts tests/runtime-portability.test.ts tests/rule-drift.test.ts --reporter=dot`
と `node src/cli.ts doctor` を根拠とする。green_commands は実装 PR の confirm と同時に記録する。
