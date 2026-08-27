---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-519-pack-publication-adapter
---

# L7 Pack publication adapter test design

既存 `SealedPackPublicationPlan` を fixture の唯一の出荷入力とし、実際の GitHub/Pack credential、remote
mutation、stable promotion は実行しない。全 port は in-memory spy/fault adapter とし、operation order と
remote write count を直接 oracle にする。

| ID | fault / mutation | expected oracle |
| --- | --- | --- |
| U-PACKPUB-REMOTE-001 | entries/sidecar/assets、release identity、source revision、expected tree/mode の drift | seal または pack read-back mismatch、Release 以降 write 0 |
| U-PACKPUB-REMOTE-002 | approval 欠落/期限切れ、wrong approver、nonce replay、operation/state/key drift | typed deny、最初の remote write 0。consume済み同一identityの再観測だけ reconciliation |
| U-PACKPUB-REMOTE-003 | initial main/pointer drift、duplicate tag、direct push/retarget | planned preflight deny、全 remote write 0 |
| U-PACKPUB-REMOTE-004 | branch/PR/merge refusal、unknown、別 commit/tree/sidecar/identity | partial/indeterminate、release_draft 以降 write 0 |
| U-PACKPUB-REMOTE-005 | draft=false/identity drift、asset 0/1/3、bytes/size/digest mismatch | asset/tag/visibility/pointer write 0 |
| U-PACKPUB-REMOTE-006 | tag refusal/unknown/retarget、visibility refusal/unknown、pre-attestation pointer | existing immutable objectsを保持、後続 write 0 |
| U-PACKPUB-REMOTE-007 | late pointer CAS drift、response loss、read-back mismatch | pointer append 0 または applied unknown、success 0、重複CAS 0 |
| U-PACKPUB-REMOTE-008 | journal persist failure、crash/restart、receipt failure | successを推測せず indeterminate、同一operation reconciliationのみ |
| U-PACKPUB-REMOTE-009 | happy path | receipt が intent、approval/nonces、release/pointer commit-tree、before/after snapshot、assets、journal を束縛 |

正常順序は `planned → pack_commit → release_draft → assets → tag → release_visible → canary`。pack commit の
tree/commit/sidecar/identity/mode は独立 attestation し、commit SHA は merge read-back 後にのみ receipt/tag
intent へ追加する。canary pointer は after control-manifest snapshot の protected PR/CAS だけで生成し、
before snapshot を上書きしない。

Node/npm の targeted test、typecheck、Biome、PLAN lint を同一 exact HEAD で実行する。Bun と実 remote は
検証経路に含めない。

PR #438 / PLAN-L7-515 は draft/unmerged の並行候補であり、本 test-design は #438 のファイルや
未確定実装を参照しない。#438 が merge されるまで、この slice の合格は merge-ready を意味しない。
