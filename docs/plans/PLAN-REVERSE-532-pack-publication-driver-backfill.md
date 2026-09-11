---
plan_id: PLAN-REVERSE-532-pack-publication-driver-backfill
title: "PLAN-REVERSE-532: Pack canary publication driver backfill"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-11
updated: 2026-09-11
owner: Claude / Fable (pair-freeze) · Codex worker (implementation)
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: PLAN-L7-515 の FSM / CAS / nonce / journal 契約と
  PLAN-L6-63 の段階公開契約を変更せず、本番 port と CLI 入口の実装を既存契約へ束縛して逆向き検証するだけのため。
parent_design: docs/plans/PLAN-L7-532-pack-publication-driver.md
pair_artifact: docs/test-design/harness/L7-pack-publication-driver-test-design.md
agent_slots:
  - role: tl
    slot_label: Sol / Claude Opus - L7-515 port 契約と L7-532 本番 port 実装の境界を逆向き検証する
  - role: qa
    slot_label: Terra - CANDIDATE-PACKPUB-005-A..O を独立照合し、shell 経由 argv・approval
      存在確認・secret 混入・実 gh 起動を攻撃する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-532-pack-publication-driver-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-532-pack-publication-driver.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    - docs/plans/PLAN-L7-519-pack-publication-adapter.md
    - docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    - docs/plans/PLAN-REVERSE-515-pack-remote-canary-publication-backfill.md
    - docs/plans/PLAN-REVERSE-519-pack-publication-adapter-backfill.md
    - docs/test-design/harness/L7-pack-publication-driver-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/565
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 565
admission_receipt:
  schema_version: v2
  receipt_id: certificate:abf043fd5d6923dc3f8b594be17d36c8
  command_id: plan-revise:issue-565:reverse:3
  admitted_at: 2026-09-11T04:46:05.849Z
  source_digest: sha256:c64328731ae18269d3020ced1746f9fab69e7ec7128b8461c1286dcc7888a6b5
  decision_digest: sha256:bd8be2a304be8e101f61a411170c869fa3fc485fceb7a17f5a9ade55d5b599e8
  receipt_digest: sha256:a9b52a9038b0e1fc654ba44def4fe769a39bc5f3a6825808f04a3e2ce3db2f7e
  binding:
    path: docs/plans/PLAN-REVERSE-532-pack-publication-driver-backfill.md
    plan_id: PLAN-REVERSE-532-pack-publication-driver-backfill
    asset_id: plan:d53a1004f602923fa717f7969c802257
    revision: 3
    content_digest: sha256:c64328731ae18269d3020ced1746f9fab69e7ec7128b8461c1286dcc7888a6b5
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 565
    episode_id: E4-565-pack-publication-driver
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-531-pack-internal-canary-smoke
    revision: 2
    digest: sha256:69c9c058d2178425bb0459033b2748785d152d7a9c2a37c01aefbca270709d4e
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-532-pack-publication-driver
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #565 Pack canary publication driver Reverse backfill pair
    (R0); revision 3: Codex/Sol FLAG r2 0d1a7c8e (independent approval
    commitment record on origin/main, wrong-commitment/approver/authority
    oracles)"
---

# PLAN-REVERSE-532: Pack canary publication driver の逆向き確認

## R0: 対象境界

Issue #565 の本番 port (`gh` process port、file-backed ApprovalPort、durable journal / receipt)
と CLI 入口を、`PLAN-L7-515` の remote publication 契約、`PLAN-L7-519` の adapter 境界、
`PLAN-L7-508` の sealed staging、`PLAN-L6-63` の段階公開契約の接合面として確認する。L6 / L7-515
が所有する FSM、CAS、mutation 単位 nonce、durable journal、partial / indeterminate 境界を別の
仕様として再定義しない。L7-532 はこれらを本番 port 契約 (§3)、CLI 入口 (§4)、運用手順 (§5)
と候補 oracle (§7) へ降下するだけである。

## R1: Forward 契約の逆向き分解

- **port 順序の不変**: 本番 port は `PLAN-L7-515` §3 の呼出順序
  `planned → pack_commit → release_draft → assets → tag → release_visible → canary` を adapter
  から受け取るだけで、自ら遷移を起こさない。port 実装内で次遷移の write を先行しない
  (`CANDIDATE-PACKPUB-005-I`)。
- **write 0 境界の継承**: `PLAN-L7-515` §4.1 (最初の write より前の typed deny) と §4.2 (最初の
  ambiguity 以降の write 0) を、`gh` の失敗分類 (`unavailable` / `indeterminate`) と approval
  consume の順序 (照合 → rename → journal) で具体化する (`-C` / `-D` / `-E` / `-F` / `-G`)。
- **approval の主体と束縛**: `PLAN-L7-515` §2 の mutation 単位 approval receipt / nonce と
  approver identity を、人間が発行する file として具体化する。driver は発行者にならない。
  consume は sealed intent の 9 field (nonce / approver を含む) byte 一致・durable state・expiry を
  要求する (`-C`)。期待 approver と nonce digest の供給源は approval file でも CLI 引数でもなく、
  cross-review 済みで `origin/main` にある commitment record だけである (`-P` / `-Q` / `-R`)。chat 上の PO 承認は着手承認で
  あり file を代替しない。
- **secret 境界**: CLAUDE.md §Safety Boundaries の「secret / credential を evidence に書かない」
  を、token / credential は stdout / journal / receipt / error message の 0 件 oracle、approval
  本文と未 consume nonce は stdout / error message の 0 件 oracle へ降下する (`-H`)。consume 済み
  nonce は `PLAN-L7-515` §5 と adapter 型のとおり journal / receipt に生値で残す。
- **receipt の接合**: 生成する `PackPublicationReceipt` は `PLAN-L7-531` §3.2 / §3.3 の第 2 層
  入力であり、asset の name / size / SHA-256 が staging receipt と byte 一致する根拠を保持する。

## Backprop scope

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| requirements | not_impacted | human-approved 段階公開と exact 2 asset の既存要求を変更しない。 |
| L4-basic-design | not_impacted | source / Pack / consumer の責務境界を変更しない。 |
| L5-detailed-design | not_impacted | 新規 DB / schema を追加しない。journal / receipt は local runtime artifact。 |
| L6-function-design | not_impacted | 段階公開、CAS、nonce、journal、rollback の正本は `PLAN-L6-63` / `PLAN-L7-515` に保持する。 |
| L7-unit-test-design | updated | 実装 PR で `U-PACKPUB-DRIVER-*` を共有 `L7-unit-test-design.md` へ 1:1 登録する。既存 `U-PACKPUB-*` / `U-PACKPUB-REMOTE-*` / `U-PACKPUB-STAGE-*` は変更しない。 |
| L12-acceptance-test-design | not_impacted | 受入 (第 2 層) は `PLAN-L7-531` PR-2 が所有する。 |

## R2: candidate / oracle 対応

| Candidate | 実装 PR | Red 入力 | Green oracle |
| --- | --- | --- | --- |
| 005-A | PR-1 | argv を文字列連結・shell 経由で組む | 配列固定、shell 不経由、fake runner が受けた argv snapshot 一致 |
| 005-B | PR-1 | 認証主体 / repo / expected main SHA / tag の 1 軸不一致 | 最初の write より前に typed deny、write 0 |
| 005-C | PR-1 | approval file 欠落・期限切れ・別 operation / intent / state・seal 後の nonce 置換・approver 差替 | `approval_missing` / `nonce_replay` / `approval_binding_mismatch` / `approval_expired` / `approval_state_mismatch`、write 0 |
| 005-D | PR-1 | 同一 file を 2 回 consume、rename 失敗 | 2 回目は `reconcile` のみ、rename 失敗は deny |
| 005-P | PR-1 | approval file の nonce を差し替え (sha256 が commitment と不一致) | `approval_commitment_mismatch`、seal 前、write 0 |
| 005-Q | PR-1 | approval file の approver を commitment と異なる identity へ差替 | `approval_commitment_mismatch`、seal 前、write 0 |
| 005-R | PR-1 | commitment を working tree / local HEAD にだけ置く、`origin/main` の record が別 operation / intent | `approval_commitment_missing` / `approval_commitment_mismatch`、seal 前、write 0 |
| 005-E | PR-1 | journal append の persist failure | `indeterminate`、後続 write 0 |
| 005-F | PR-1 | `mutation_intent` の後に observation 無しで crash | reconciliation のみ、新規 write 0 |
| 005-G | PR-1 | `gh` 非 0 exit / timeout / 出力上限超過 | mutation 前は `unavailable`、後は `indeterminate`、成功へ丸めない |
| 005-H | PR-1 | token / approval 本文 / nonce を含む fake 応答と approval fixture | token は全出力で 0 件、approval 本文と未 consume nonce は stdout / error で 0 件、journal / receipt の nonce は consume 済み file と 1:1 一致 |
| 005-I | PR-1 | port ↔ `gh` 対応表 (§3.2) から 1 行を別 endpoint へ変異 | argv snapshot 不一致で Red |
| 005-J | PR-1 | asset upload の read-back で size / digest を 1 byte 変異 | `mismatch`、後続 write 0 |
| 005-K | PR-1 | テストから実 `gh` を spawn | fake runner 以外の process 起動 0 |
| 005-L | PR-1 | CAS merge 直前に main SHA drift | merge write 0、`mismatch` |
| 005-M | PR-2 | `--execute` 無しで実行 | remote write 0、観測系 argv のみ |
| 005-N | PR-2 | `--execute` で approval file 不足 | 該当 mutation 直前で deny、以前の immutable object は保持 |
| 005-O | PR-2 | 入力に staging 外の path / env / glob を混ぜる | staging module の typed deny をそのまま返す |

## R3: gap 分類と backfill

非著者の claim-blind / spec-blind review が、次を攻撃する。

- `gh` の argv を shell 文字列で組んでいないか、template 展開が無いか
- approval consume が file の存在確認だけで束縛照合 (nonce / approver を含む 9 field) を省いていないか
- 期待 nonce digest / approver を approval file や CLI 引数から導出していないか (commitment の
  working tree / local HEAD fallback が無いか)
- write 後の失敗で `remoteWrites: 0` と誤報告していないか
- stdout / error message に token・approval 本文・未 consume nonce が、journal / receipt に token が
  混入していないか
- fake runner を迂回して実 `gh` を起動するテストが無いか
- CLI 既定 (dry-run) で観測系以外の argv を生成していないか

gap は L7-532 の contract 改訂 (revision N+1) で閉じ、`PLAN-L7-515` / `PLAN-L6-63` の契約変更が
必要なら `backprop_decision` を `required` へ改訂して当該 PLAN へ戻す。

## R4: Forward 再合流条件

- PR-1 (port module) と PR-2 (CLI 入口) が別 PR で main 到達し、各々の exact HEAD に
  Linux / Windows / aggregate Green と Claude 族の非著者 closing receipt が存在する。
- `CANDIDATE-PACKPUB-005-A..R` が同番号の `U-PACKPUB-DRIVER-*` へ 1:1 昇格し、同一
  implementation revision の Red→Green 実測を引用している。
- 実 Pack repository への write がテスト・CI・レビューのいずれにも 0 件。
- `v0.2.0-canary.1` の実公開と receipt は #364 の運用記録とし、本 PLAN の完了に含めない。

## Scope boundary

`PLAN-L7-508` / `L7-515` / `L7-519` / `L6-63` の所有 oracle を再宣言しない。`CANDIDATE-PACKPUB-004`
(rollback) と #481 updater は入力契約としてのみ参照する。
