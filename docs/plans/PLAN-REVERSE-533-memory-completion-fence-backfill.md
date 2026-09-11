---
plan_id: PLAN-REVERSE-533-memory-completion-fence-backfill
title: "PLAN-REVERSE-533: Memory migration completion fence backfill"
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
backprop_decision_reason: PLAN-L7-512 §2 の completion 条項を canonical root へ
  narrowing するだけで親契約と PLAN-L7-529 を変更せず、fence の実装を既存の Slice 4a/4b
  契約へ束縛して逆向き検証するため。
parent_design: docs/plans/PLAN-L7-533-memory-completion-fence.md
pair_artifact: docs/test-design/harness/L7-memory-completion-fence-test-design.md
agent_slots:
  - role: tl
    slot_label: Sol / Claude Opus - L7-512 completion 条項と L7-533 fence 正本の境界を逆向き検証する
  - role: qa
    slot_label: Terra - CANDIDATE-U-PMEMFENCE-001..021 を独立照合し、baseline snapshot
      残存・mtime 依存・全量 apply・schema 迂回を攻撃する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-533-memory-completion-fence-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-533-memory-completion-fence.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-512-project-scoped-memory-root.md
    - docs/plans/PLAN-REVERSE-512-project-scoped-memory-root-backfill.md
    - docs/plans/PLAN-L7-529-project-identity-bootstrap.md
    - docs/test-design/harness/L7-memory-completion-fence-test-design.md
    - docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/550
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 550
admission_receipt:
  schema_version: v2
  receipt_id: certificate:b25589eb563f723d8dec7bec6ccfade7
  command_id: plan-revise:issue-550:reverse:7
  admitted_at: 2026-09-11T06:05:42.007Z
  source_digest: sha256:682d7f6d798e65c259c6faefeeb9460b1acfa3dec494bb956c62fb3f98333322
  decision_digest: sha256:1c2b52824bb2fd18b019f95988baa0501dcaab7159600121fd7acaf42003cac0
  receipt_digest: sha256:c602b54e6659c6c39c733604096b341adb208b32fa909cc3ad34a96f631d9c89
  binding:
    path: docs/plans/PLAN-REVERSE-533-memory-completion-fence-backfill.md
    plan_id: PLAN-REVERSE-533-memory-completion-fence-backfill
    asset_id: plan:9c79745cc74906d8a41f0e144021d912
    revision: 7
    content_digest: sha256:682d7f6d798e65c259c6faefeeb9460b1acfa3dec494bb956c62fb3f98333322
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 550
    episode_id: E4-550-memory-completion-fence
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-512-project-scoped-memory-root
    revision: 6
    digest: sha256:e3e3cad039021a5394c5ad09ea1f0084642bba9c0423fd9faa77563e1e52ce19
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-533-memory-completion-fence
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #550 completion fence Reverse backfill pair (R0); revision
    7: Codex/Sol FLAG 4a2efa0c (uniform absent-as-null rule; tamper via Slice 4b
    record digest chain; evaluation order)"
---

# PLAN-REVERSE-533: Memory migration completion fence の逆向き確認

## R0: 対象境界

Issue #550 の completion fence を、`PLAN-L7-512` の Slice 4a (inventory) / 4b (quarantine / recovery) 契約、
`PLAN-L7-529` の tracked identity 契約、production composition (setup / status / SessionStart / Memory service /
provider wake / claim / doctor) の接合面として確認する。L7-512 が所有する root 解決、identity deny、inventory
分類、quarantine、marker chain を別の仕様として再定義しない。L7-533 はこれらの上に fence の正本 (§3)、residue の
集合差分と回復 (§4)、結線点と 529 境界 (§5) を降下するだけである。

## R1: Forward 契約の逆向き分解

- **completion 条項の分離**: `PLAN-L7-512` §2「completion は現物 corpus digest と一致するときだけ replay」は replay の
  条項としてそのまま守る (同一 operation の再 apply は temporal equality、変更後は `replay_corpus_mismatch`)。fence の
  妥当性はこの条項の対象ではなく、canonical root の operation chain + residue だけで決まる。全 worktree inventory を fence の
  期待値に使う実装 (PR #554) はこの条項の過剰解釈であり、親契約の変更ではない (`CANDIDATE-U-PMEMFENCE-004..007`、`016`)。
- **marker chain の再利用と operation chain**: `owner → intent → prepared → complete` の hash chain と `replayed` 判定は Slice 4b
  (`U-PMEMQUAR-002/003/005`) をそのまま使い、fence は tamper 検出と replay の temporal equality にだけ chain digest を使う
  (`002`、`003`)。複数 operation は `owner` marker の `previous_complete_digest` (additive field) で chain を成し、tip の
  一意性で current operation を決める (`017..019`)。legacy marker の欠落は null と同値で root 1 件に限り許す uniform 規則で
  扱い、改変は Slice 4b の record digest chain で `transaction_tampered` にする。field の有無を世代判別子にしない
  (`020`、`021`)。
- **residue の集合差分**: linked worktree の untracked memory を `(memory_id, content_digest)` の集合差分で観測し、
  mtime を使わない (`008`、`009`)。`invalid_memory` / `source_unsafe` は Slice 4a の typed reason を再利用する。
- **回復の append-only**: 新 operation の apply は Slice 4b の transaction 経路を使い、個別ファイル単位で記録する
  (`010`、`011`)。
- **529 境界**: setup bootstrap 例外と `project_identity_commit_required` は `PLAN-L7-529` §6 (remote-less identity
  denial を fatal にしない) と両立させる (`014`)。

## Backprop scope

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| requirements | not_impacted | project-scoped Memory root と fail-close の既存要求を変更しない。 |
| L4-basic-design | not_impacted | primary / linked worktree の責務境界を変更しない。 |
| L5-detailed-design | updated (additive) | `owner` marker に `previous_complete_digest` を additive に追加する (本 PLAN が所有。既存 marker の形式・既存 oracle・DB schema は変更しない)。 |
| L6-function-design | not_impacted | root 解決・inventory・quarantine の正本は `PLAN-L7-512` に保持する。 |
| L7-unit-test-design | updated | 実装 PR で `U-PMEMFENCE-*` を共有 `L7-unit-test-design.md` へ 1:1 登録する。既存 `U-PMEMINV-*` / `U-PMEMQUAR-*` は変更しない。 |
| L12-acceptance-test-design | not_impacted | clean Pack provider parity E2E は #424 後続 slice が所有する。 |

## R2: candidate / oracle 対応

| Candidate | 実装 PR | Red 入力 | Green oracle |
| --- | --- | --- | --- |
| 001 | PR-1 | owner / intent / prepared で中断した transaction | `migration_incomplete`、全入口 write 0 |
| 002 | PR-1 | marker 改変・欠番・digest 不一致 | `transaction_tampered`、write 0 |
| 003 | PR-1 | marker 無し・legacy corpus のみ | `migration_incomplete`、legacy read 0 |
| 004 | PR-1 | completion 後に `git worktree add` (tracked memory が checkout される) | ok 不変 |
| 005 | PR-1 | completion 時に存在した worktree を `git worktree remove` | ok 不変 |
| 006 | PR-1 | canonical root の tracked memory を pull / commit / 削除 | ok 不変 |
| 007 | PR-1 | completion 後に corpus を変えずに同一 operation を再 apply | fence ok、`replayed`、marker 追記 0 |
| 016 | PR-1 | `memory add` / tracked 変更で canonical を変えた後に同一 operation を再 apply | fence ok のまま、apply は `replay_corpus_mismatch`、canonical write 0、marker 追記 0 |
| 017 | PR-1 | complete 済み tip に連なる新 operation を prepared で中断 | `migration_incomplete` (当該 operation を報告)、write 0 |
| 018 | PR-1 | chain 内の古い complete operation の marker を改変 | `transaction_tampered`、write 0 (新しい tip があっても丸めない) |
| 019 | PR-1 | 参照されない complete operation を 2 つ置く、または参照先が存在しない operation を置く | `operation_chain_ambiguous`、write 0。mtime / operationId 順で選んだら Red |
| 020 | PR-1 | `previous_complete_digest` を持たない legacy complete (Slice 4b 形式) の上で §4.2 の新 operation を apply | fence ok、新 `owner` marker が legacy complete の digest を明示参照、tip = 新 operation。legacy root を `transaction_tampered` にしたら Red |
| 021 | PR-1 | (a) null / 欠落 root を 2 件置く、(b) 任意の `owner` marker (legacy / 新形式) の payload から field を除去・追加して recordDigest を再計算しない、(c) legacy root + (b) の子 | (a) `operation_chain_ambiguous`、(b)(c) record digest 不一致で `transaction_tampered` (ambiguous より先に判定)。いずれも write 0 |
| 008 | PR-1 | linked worktree に canonical に無い untracked memory を作成 | `legacy_residue`、write 0 |
| 009 | PR-1 | 008 のファイルを mtime 保存でコピー配置 | 集合差分で検出 (mtime 非依存) |
| 010 | PR-1 | residue に schema 不正 file を混ぜて apply | 不正は `invalid_memory` で取り込み 0、正常分だけ marker に記録 |
| 011 | PR-1 | observe 後・apply 前に residue を追加 | 取り込んだものだけ記録、未取り込みは次回 apply が拾う |
| 012 | PR-1 | identity 欠落 / drift / root escape / common-dir 不正 | `PLAN-L7-512` の typed deny をそのまま返す、write 0 |
| 013 | PR-2 | Claude / Codex の入口から同一 repository を観測 | reason と write 0 が一致、session 紐付き状態 0 |
| 014 | PR-2 | tracked identity + transaction 不在 / identity 未 commit / remote 無し | 初回 bootstrap 許可 / `project_identity_commit_required` で migration のみ保留・state/template 継続 / 非 fatal |
| 015 | PR-2 | consumer-toolchain / consumer-setup-smoke doctor を ok / incomplete / tamper / residue で起動 | 正例 1 + 負例 3 が各 typed reason で fail-close |

## R3: gap 分類と backfill

非著者の claim-blind / spec-blind review が、次を攻撃する。

- completion 時の snapshot digest を fence の期待値として保持していないか (B1 の再発)
- replay が `PLAN-L7-512` §2 の temporal equality を放棄していないか、逆に fence が replay 条項で ok を失っていないか
- 複数 operation の tip 選択に mtime / operationId / 列挙順を使っていないか
- residue 判定が mtime / ctime に依存していないか
- apply が全量取り込みを前提に marker を書いていないか (TOCTOU)
- apply が frontmatter schema 検証を迂回し hand-written memory を canonical へ通していないか
- fence / apply が session や provider に紐付く状態を持っていないか
- setup の identity deny が fatal 化されて `PLAN-L7-529` と矛盾していないか

gap は L7-533 の contract 改訂 (revision N+1) で閉じ、`PLAN-L7-512` / `PLAN-L7-529` の契約変更が必要なら
`backprop_decision` を `required` へ改訂して当該 PLAN へ戻す。

## R4: Forward 再合流条件

- PR-1 (fence module) と PR-2 (production 結線) が別 PR で main 到達し、各々の exact HEAD に Linux / Windows /
  aggregate Green と Claude 族の非著者 closing receipt が存在する。
- `CANDIDATE-U-PMEMFENCE-001..021` が同番号の `U-PMEMFENCE-*` へ 1:1 昇格し、同一 implementation revision の
  Red→Green 実測を引用している。
- PR #554 が close され、その実装のうち baseline snapshot 依存部分が採用されていない。
- #424 の provider parity E2E と #413 は本 PLAN の完了に含めない。

## Scope boundary

`PLAN-L7-512` / `PLAN-L7-529` / `PLAN-L7-516` の所有 oracle を再宣言しない。authenticated re-baseline (案 B) は
実測で必要になった場合の別 PLAN とし、本 reverse では扱わない。
