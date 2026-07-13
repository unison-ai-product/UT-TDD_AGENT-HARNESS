---
plan_id: PLAN-REVERSE-418-plan-asset-v2-backfill
title: "PLAN-REVERSE-418: PLAN Asset v2実装の設計backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
agent_slots:
  - role: tl
    slot_label: "TL - asset/revision/migration実装事実をL5/L6へbackfill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-418-plan-asset-v2-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-role-contracts.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
  requires: []
---

# PLAN-REVERSE-418

## §0 目的

PLAN-L7-418で実装したPlanAsset v2 ledger、legacy migration application、741件dry-runを観測し、Forward設計との差をR0〜R4で逆向きに検証する。既存L5-17/L6-71/ADR-008のidentity・revision・transaction契約を保持し、実装で判明した自己証明境界だけをbackfillする。

## §1 R0-R4観測結果

| phase | 観測・判定 | 結果 |
|---|---|---|
| R0 | domain/ledger/CLIとHEAD正本を観測 | 741 PLAN、20 numeric-prefix群/41件、migration/rekey/reject application、global receiptを確認 |
| R1 | L5-17/L6-71/ADR-008との差分比較 | reducer/transaction契約は既設計と一致。全件dry-run、reviewed rekey manifest、HEAD target、snapshot、role delegation、target slot証明が未backfill |
| R2 | U-PA-001〜042を設計oracleへ照合 | identity、revision、receipt、rollback、reopen、741件bijection、target/provenance、CLI公開契約をGreen化 |
| R3 | checked ZIP/A-187のclaim-only gapと照合 | catalog/display claimを成功根拠にせず、HEAD blob・typed slot・role contract実体へ突合。label推測、自動collision選択を禁止 |
| R4 | 実装事実をForwardへ合流 | L6 function-spec、L7 unit-test-design、role contract正本へU-PA-034〜041と検査境界をbackfill |

## §2 自己証明境界

- inventoryはworking treeではなくsource commitのtracked PLAN blob 741件をbatch取得し、OID/content digestをrecord/report digestへ拘束する。
- collision 41件はreview manifestへPLAN IDとnumeric prefixを明示列挙する。欠落・余剰・group不一致はfail-closeし、prefixから暗黙選択しない。
- `generates`はHEAD上の非空fileまたは非空directory familyへ突合する。file-only detectorのdirectory誤検知を許可しない。
- delegationは7 roleの上流contractをstrict loadし、既存`role + slot_label`を保持したprojectionへ`contractRef`を追加する。
- `target_slot`はHEAD item ledgerとHEAD document catalogを既存typed resolverで照合する。
- pending/rejectedは架空PlanAsset revisionを作らず、migrated/rekeyedだけがrevision 1へcomposite FKで到達する。

## §3 実装・検証証跡

| commit | 内容 |
|---|---|
| `03a25deb` | migration transaction 10 fault boundary rollback |
| `fca895ae` | migrated/rekeyed application parity |
| `96dfae91` | 741件migration dry-run CLI |
| `79fbbe5a` | 41件reviewed rekey manifest |
| `ea2cc043` | HEAD generated target file/family検証 |
| `387f3d5b` | snapshot object独立Git oracle |
| `c2fbe34a` / `d48c9476` | role contract正本とdelegation実体証明 |
| `5cbd5d2a` | HEAD target slot検証 |

再現command:

```powershell
bunx vitest run tests/plan-asset --reporter=dot
bun run typecheck
bun run src/cli.ts plan migration-dry-run
bun run src/cli.ts plan lint docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
```

dry-run受入値は固定実装条件ではなく現HEAD oracleとして`total=741 / emitted=741 / migrated=700 / rekeyed=41 / pending=0 / finding=0`。reportはsource commit、inventory digest、report digestを出力する。

## §4 R4合流先

- `docs/design/harness/L6-function-design/function-spec.md`: migration dry-run application、HEAD target/provenance、delegation/slot contract。
- `docs/test-design/harness/L7-unit-test-design.md`: U-PA-034〜042。
- `docs/governance/vmodel-role-contracts.md`: 7 role delegation contract正本。
- L5-17/ADR-008は既存identity/physical ledger契約と実装が一致し、重複更新不要と判定。

## §5 収束判定

PlanAsset migration/dry-runのForward設計差はbackfillした。残るPR lifecycle、full doctor dependency cycle、Claude/PO acceptanceはPLAN-L7-418外へ隠さずIMP-160/161と検収packetで扱う。R4のconfirmed判定は独立reviewと全体gate後に行う。
