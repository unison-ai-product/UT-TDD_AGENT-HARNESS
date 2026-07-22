---
plan_id: PLAN-L4-33-node-control-plane-cutover
title: "PLAN-L4-33 (redesign/architecture): Node control-plane cutover and Bun permanent ban"
kind: design
layer: L4
sub_doc: architecture
drive: fullstack
status: draft
route_signal: redesign
route_mode: redesign
created: 2026-07-22
updated: 2026-07-22
owner: PO / Codex
github_issue_id: 134
parent_design: docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: "TL - runtime custody、cutover barrier、rollbackとBunゼロ判定"
  - role: se
    slot_label: "SE - Node package/bootstrap、SQLite、hook/runner/Pack移植"
  - role: qa
    slot_label: "QA - Bun逃避経路、Node parity、Linux/Windows/aggregate system oracle"
generates:
  - artifact_path: docs/plans/PLAN-L4-33-node-control-plane-cutover.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  blocks:
    - docs/plans/PLAN-L5-26-node-platform-packaging-deployment.md
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/adr/ADR-009-resource-kernel-native-custody-companion.md
    - docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md
review_evidence: []
---

# PLAN-L4-33: Node control-plane cutover and Bun permanent ban

## 0. 起票理由

PO判断（2026-07-22）によりBunは恒久禁止とする。現状はCLI、hook、test、SQLite、CI、Pack、setup、配布物がBunへ結合しており、単純削除するとHARNESS自身の検出・停止・証跡能力を失う。本PLANは既存実装を設計へ追従させるredesignとして、TypeScript domainをNode control planeへ移し、privileged OS custodyだけをRust Resource Kernelへ委譲する。互換維持を完了条件にせず、最終状態はtracked/runtime/test/CI/PackのBun依存・実行・例外が0である。

## 1. 目標境界

- TypeScript/Node: PlanAsset、駆動モデル、policy、detector、CLI、hook、GitHub、journal、receipt、test orchestration。
- Rust: Windows Job Object / Linux cgroup・brokerによるprivileged custody。domain判断を持たない。
- npm package-lock: Node dependency graphの唯一のreview対象。productionはbuild済みESMを実行し、TS直実行を禁止する。
- signed platform bundle: Node core、Rust companion、manifest、SBOM、digest、protocol versionを不可分にする。
- shell wrapper: bundle内Node entrypointをargvで呼ぶ薄い入口だけとし、runtime探索・install・fallbackを持たない。

## 2. Cutover state machine

| state | 許可 | 禁止 / exit条件 |
|---|---|---|
| `inventory_frozen` | Bun依存を機械inventory化し、各項目へNode代替ownerを割当 | 未登録Bun参照、新規Bun追加 |
| `node_shadow` | 同一fixtureをNodeと旧経路で実行し、canonical receiptを比較 | Bun結果を正本にすること、差分の黙殺 |
| `node_primary` | Nodeだけをproduction入口にし、旧経路はnegative oracle専用 | Node失敗時のBun fallback |
| `bun_removed` | lockfile、imports、commands、hooks、CI、Pack、docsを物理削除 | compatibility shim、期限なし例外 |
| `sealed` | 同一HEAD/bundleでNode+Rust全gateとBun zero gateがGreen | Bun binary/process/dependency/reference検出 |

遷移はappend-only `RuntimeCutoverReceipt`で証明する。前段receipt、対象revision、bundle digest、inventory digest、Node parity結果、rollback対象が一致しない遷移はfail-closeする。`node_primary`以降はBunを検出器の実行にも用いない。

## 3. Bun permanent-ban detector

detectorは単純grepではなく、次を別scannerとして正規化しOR集約する。

1. package manifest/lockfile dependency、script、engine、bin、shebang。
2. TS/JS import specifier、dynamic import、spawn/exec argv、文字列生成されたcommand token。
3. YAML/JSON/TOML/PowerShell/shellのsetup、PATH、download、workflow run、hook command。
4. Pack、template、fixture、generated bundle、docsのcurrent-path記述。
5. runtime process receiptのexecutable identity、descendant image、PATH resolution。

コメント・履歴・negative fixtureはtyped allowlistへ分離し、owner、理由、expiry、expected detector IDを必須化する。production pathのallowlistは禁止する。scanner欠測、parse不能、対象外拡張子の実行可能artifactはpassでなくRedとする。

## 4. 検出能力を失わない移行条件

- 各Bun surfaceは `Node replacement test Green → entrypoint切替 →旧経路negative化 → 削除` の順で処理する。
- SQLiteはtransaction、WAL、型変換、busy、Windows file lockingを同一corpusで比較する。
- hooksはblock/fail-open意味論、exit code、stdin/stdout framing、visible shell 0を比較する。
- CIはLinux/Windows Node jobとRust jobをfinal aggregateへ束縛し、片側skip/cancelをGreenにしない。
- Pack/setup/upgrade/rollbackはclean hostからBun未導入のままacceptanceを完走する。
- Node detectorが自分自身・configuration・生成物を検査できることを自己適用testで証明する。

## 5. Forward降下

1. L4↔L9: 本PLANと`ST-NODE-CUTOVER-*`でarchitecture/system oracleをfreeze。
2. L5↔L8: package、bundle、deployment、hook process protocol、SQLite物理契約をfreeze。
3. L6↔L7: scanner、bootstrap、module、runner、Pack関数契約とunit oracleをfreeze。
4. L7 TDD: detector Redから開始し、Node代替をsurface別に実装する。
5. L8/L9: clean host、Windows/Linux、fault、rollback、同一HEAD aggregateを検証する。
6. Bun全削除は最後の独立changeではなく、parity receiptとzero gateを含む同一cutover changeで行う。

## 6. 受入条件

- [ ] tracked source/test/config/lockfile/hook/CI/Pack/current docsのBun production参照が0。
- [ ] clean Windows/Linux hostでBun binary・cache・environment無しにsetupからacceptまで完走する。
- [ ] runtime process evidenceでBun executable/descendant 0、visible shell 0、managed orphan 0。
- [ ] Node CLI/hook/detector/SQLite/test/PackがL7-L9 parity oracleを満たす。
- [ ] Rust custody jobsとNode control-plane jobsが同一HEAD/bundleのfinal aggregateへ束縛される。
- [ ] Node failure時にBun fallbackせず、構造化receiptを残してfail-closeする。
- [ ] rollbackは署名済みNode+Rust bundle単位であり、Bunを再導入しない。
- [ ] authorと別runtime/model familyのblind reviewで未反駁attackが0。

本PLANは実装・system evidence・独立reviewが揃うまで`draft`のままとする。
