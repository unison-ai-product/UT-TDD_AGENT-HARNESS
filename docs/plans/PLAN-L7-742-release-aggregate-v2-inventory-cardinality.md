---
plan_id: PLAN-L7-742-release-aggregate-v2-inventory-cardinality
title: "PLAN-L7-742 (add-impl): PF-5 release aggregate の v2 multi-artifact
  inventory 基数契約 (channel mapping 集合 = selected release artifacts の順序付き完全一致)"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-29
updated: 2026-09-29
owner: Claude control lane (契約 draft) · Codex worker (implementation)
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
backprop_decision: required
backprop_decision_reason: PF-5 (PLAN-L7-492 §1 (C)) は v1 (channel あたり
  destination 1 件) 前提で 凍結されたまま v2 inventory (PLAN-L7-499) に再定義されておらず、PLAN-L6-102
  §promotion 条件 1/5 の 「channel mapping」単数表現も同じ前提を持つ。v2 の基数契約を PLAN-REVERSE-742 で
  L6-63 / L6-102 へ逆向き検証し、上位の文言整合要否を R4 で routing する。
agent_slots:
  - role: se
    slot_label: Codex worker (Luna) - admission / sealed plan / consumer admission /
      promotion gate を 1 PR = 1 論点で最小実装する
  - role: qa
    slot_label: Codex Terra - CANDIDATE-U-RELAGGV2-001..009 の Red oracle と mutation
      probe を先に作る
  - role: tl
    slot_label: Claude Opus (非著者) - 順序付き完全一致・単一正本 (entries[].path)・v1 不変の closing review
generates:
  - artifact_path: docs/plans/PLAN-L7-742-release-aggregate-v2-inventory-cardinality.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires:
    - docs/plans/PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze.md
    - docs/plans/PLAN-L7-494-release-promotion-rollback-gate.md
    - docs/plans/PLAN-L7-499-pack-publication-manifest-v2-pure-domain.md
    - docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
  blocks:
    - docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
  references:
    - docs/plans/PLAN-REVERSE-742-release-aggregate-v2-inventory-cardinality-backfill.md
    - docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
    - docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
    - docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    - docs/plans/PLAN-REVERSE-499-pack-publication-manifest-v2-backfill.md
    - docs/plans/PLAN-REVERSE-628-pack-consumer-runtime-release-install-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/test-design/harness/L7-pack-consumer-runtime-release-install-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418
review_evidence: []
status: draft
github_issue_id: 742
admission_receipt:
  schema_version: v2
  receipt_id: certificate:f787a6e0b076a4db67323a906329bde3
  command_id: plan-draft:issue-742:aggregate-v2-cardinality:forward:1
  admitted_at: 2026-09-29T05:04:00.106Z
  source_digest: sha256:cca41bdb390c619efaa0127d40e88ad37dabeca1f756a37d3ec7125817b403ce
  decision_digest: sha256:74ebaa7447376597ab5a6149476bdd27e4b2e7b7cf240514091d24d5932e70e5
  receipt_digest: sha256:b6cf4fd7ec2347cfd65f66eab9ea77fd4fefd6b858b5347e82d61f9f3556bb90
  binding:
    path: docs/plans/PLAN-L7-742-release-aggregate-v2-inventory-cardinality.md
    plan_id: PLAN-L7-742-release-aggregate-v2-inventory-cardinality
    asset_id: plan:f787a6e0b076a4db67323a906329bde3
    revision: 1
    content_digest: sha256:cca41bdb390c619efaa0127d40e88ad37dabeca1f756a37d3ec7125817b403ce
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 742
    episode_id: E4-742-release-aggregate-v2-cardinality
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze
    revision: 1
    digest: sha256:459b26b7e0abc3dd65a3eab3e5d2c033d2f221abf36cf8b52078cf0c4a0be037
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-742-release-aggregate-v2-inventory-cardinality
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #742: PF-5 aggregate admission (PLAN-L7-492 §1 (C)) が v1 の
    channel mapping 1 件前提のまま v2 multi-artifact inventory (PLAN-L7-499) を
    missing_channel_mapping で拒否し、#418 canary PR-1 が進めない。v2 の基数契約 (mapping 列 =
    selected artifacts 列の順序付き完全一致) を定める add-impl の新規起票。"
---


# PLAN-L7-742: PF-5 release aggregate の v2 multi-artifact inventory 基数契約

## 0. 目的

`PLAN-L7-499` の v2 publication manifest は 1 release に複数 artifact (inventory) を持てる。
`PLAN-L7-628` の producer / validator はこれに合わせて artifact ごとに channel mapping を 1 件ずつ
生成・検証するが、PF-5 の aggregate admission (`PLAN-L7-492` §1 (C)) は v1 前提
(channel あたり destination 1 件) のまま凍結されており、mapping がちょうど 1 件でなければ
`missing_channel_mapping` で拒否する。この結果、artifact を 2 件以上持つ v2 release は producer でも
consumer install でも必ず失敗し、`PLAN-L7-531` の canary (#418) PR-1 が進めない。

本 PLAN は PF-5 の基数契約を v2 について再定義し、sealed plan の destination 記録を単一正本
(`entries[].path`) に揃え、同じ単一 mapping 前提を持つ promotion / rollback gate
(`PLAN-L7-494`) を aggregate 全体の照合へ直す。本 PLAN は契約 draft であり、実装・Green・
#418 の前進を主張しない。

## 1. 実測 (origin/main `83a49bde`、2026-09-29)

| # | 事実 | 根拠 |
| --- | --- | --- |
| F1 | `selectedMapping` は対象 channel の mapping が 1 件でなければ `null` を返す | `src/setup/release-aggregate-admission.ts:117-138` (`:124` filter、`:125` `if (candidates.length !== 1) return null;`) |
| F2 | `null` は `missing_channel_mapping` へ写像される | `src/setup/release-aggregate-admission.ts:194-201`、finding enum `:45` |
| F3 | producer は selected release の `artifacts` ごとに mapping を 1 件作り、同じ `admitReleaseAggregate` を呼ぶ | `src/cli/distribution.ts:501` (`buildConsumerRuntimeAdmissionInput`)、`:532-555` (`channelMappings: release.artifacts.map(...)`)、`:559` |
| F4 | `PLAN-L7-628` の validator は mapping 件数 = artifacts 件数と index ごとの sourcePath / destinationPath 一致を要求する (artifact ごとに 1 件が正) | `src/setup/consumer-runtime-release.ts:449-458` |
| F5 | consumer install も同じ aggregate admission を通り、同じ理由で失敗する | `src/setup/index.ts:306` (`installConsumerRuntimeRelease`)、`:339-346` |
| F6 | sealed plan はスカラー `destinationPath` を持ち、それは選ばれた 1 mapping の値である | `src/setup/release-aggregate-admission.ts:57-66` (`:62`)、`:157-172` (`:168`) |
| F7 | sealed plan は既に全 artifact の destination を `entries[].path` として持つ | `src/setup/release-aggregate-admission.ts:171` |
| F8 | consumer-local admission は control manifest の `artifacts[index].destinationPath` を `entries[index].path` と照合済み (entries が正本として機能している) | `src/setup/consumer-local-runtime-admission.ts:267-297` (`:279` 件数、`:286` path) |
| F9 | consumer-local admission の `validPlan` はスカラー `destinationPath` を必須にしている | `src/setup/consumer-local-runtime-admission.ts:219-236` (`:228-229`) |
| F10 | promotion gate の入力は単一 `mapping` で、`mapping.destinationPath === sealedPlan.destinationPath` だけで aggregate を照合する | `src/setup/release-promotion-rollback-gate.ts:97-112` (`:103`)、`:563-578` (`:575`)、`:580-598` (`:596`) |
| F11 | promotion / rollback の sealed plan shape 検証もスカラー `destinationPath` を必須にする | `src/setup/release-promotion-rollback-gate.ts:331-352` (`:340`) |
| F12 | PF-5 契約 (C) は「channel-selected artifact revision → Pack destination」を単数で凍結し、v2 で再定義されていない | `docs/plans/PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze.md:87-91` |
| F13 | promotion 契約も「PF5 sealed plan の kind/destination/entries/entry」の strict shape、および「channel mapping」単数を前提にする | `docs/plans/PLAN-L7-494-release-promotion-rollback-gate.md` §2 (`:213`)、`docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md:163-173` (条件 1 / 5) |
| F14 | 既存 test は全て単一 artifact (v1 manifest の単一 mapping) で、multi-artifact の経路を 1 件も通っていない | `tests/release-aggregate-admission.test.ts:30-60` (v1 fixture、mapping 1 件)、`tests/release-promotion-rollback-gate.test.ts:63-70`、`tests/pack-consumer-runtime-release.test.ts:75`/`:148` |
| F15 | v2 manifest の artifacts は destinationPath の UTF-8 byte 順・重複なしが schema で強制されている | `src/setup/pack-publication-assets.ts:110-120`、`src/schema/release-manifest.ts:214-230` (`validPublicationArtifacts`) |

sealed plan の `destinationPath` を実行時に読む箇所は F9 / F10 / F11 だけであり、
`applySealedReleaseAggregate` 本体と producer / installer の CLI 配線 (`src/cli.ts:4334` の
final tree parser を含む) はスカラーを読まない (`grep -rn "destinationPath" src/` 実測)。

## 2. 設計判断

### 2.1 基数契約 (採用: A2)

advisor: `ut-tdd advisor --decision implementation --current-model claude-opus-5 --execute`
(2026-09-29、provider=codex、model=gpt-5.6-sol、control lane 実施)。推奨 = A2。本 PLAN は推奨どおり
採択し、override はない。

| 案 | 内容 | 判定 | 理由 |
| --- | --- | --- | --- |
| **A2 (採用)** | v1 は従来どおり exactly-one。v2 は「対象 channel の mapping 列 = selected release の `artifacts` 列」を **順序付き完全一致** で要求する。sealed plan の destination 正本は `entries[].path` の 1 系統に限る | 採用 | producer / `PLAN-L7-628` validator が既に artifact ごとの mapping を正として生成・検証しており (F3 / F4)、admission 側だけを inventory へ合わせれば per-artifact の allowlist / identity 検査を失わない。順序は v2 schema が UTF-8 byte 順で一意に決めている (F15) ので、集合一致ではなく順序付き一致にしても追加の正規化が要らない |
| A' | スカラー `destinationPath` を残し、先頭 artifact の値を入れる | 棄却 | 先頭 1 件の値には意味がなく、artifact 順が変わると別 artifact を指す。`entries[].path` と並ぶ第 2 の destination 記録になり、どちらが正本か曖昧になる |
| B | producer / `PLAN-L7-628` validator を「release あたり mapping 1 件」へ畳む | 棄却 | artifact ごとの destination allowlist / sourcePath 検査 (PF-5 (C) の本体) が消える。confirmed `PLAN-L7-628` の validator 契約 (F4) の supersede も要る |

v2 の admission 条件 (全て AND、side effect 前、既存 PF-5 条件の上に追加):

1. 対象 channel で filter した mapping 列の件数 = selected release の `artifacts` 件数 (N ≥ 1)。
2. 各 index `i` で `mapping[i].sourcePath === artifacts[i].sourcePath` かつ
   `mapping[i].destinationPath === artifacts[i].destinationPath`。これにより欠落・余剰・重複・順序入替は
   全て不一致になる (artifacts 側が重複なしなので、index 一致は重複なしを含意する)。
3. 各 mapping が既存 PF-5 条件を個別に満たす: `releaseId` / `sourceRevision` が selected release と一致、
   revision 形式、sourcePath / destinationPath の相対 path 形式、`sourcePaths` 所属、
   destination が clean Pack allowlist に含まれる (`src/setup/release-aggregate-admission.ts:127-136` の
   条件を全 mapping に適用)。
4. attestation の `entries[i].path === artifacts[i].destinationPath` (件数一致を含む)。sealed plan の
   `entries[].path` が mapping 集合と同じ destination 列であることを admission 時点で束縛する。

v1 (`artifacts` を持たない release) は従来の exactly-one を変えない。v1 channel に mapping が 2 件
以上あれば従来どおり `missing_channel_mapping`。v1 / v2 の判別は selected release に `artifacts`
があるか (`"artifacts" in release`、`src/cli/distribution.ts:367`/`:528` と同じ判別) で行う。

finding enum は変えない。v2 の不一致は全て既存の `missing_channel_mapping` で返す。
「曖昧 mapping」専用 finding の追加は本 PLAN の非スコープ (別 PR、§4)。

### 2.2 sealed plan の destination 正本

- `SealedReleaseAggregatePlan` を v1 / v2 の判別共用体にする。
  - v2 variant: スカラー `destinationPath` を **持たない**。destination の正本は `entries[].path` だけ。
    並行する `destinationPaths` 配列は追加しない (正本の二重化を作らない)。
  - v1 variant: スカラー `destinationPath` を明示的な v1 専用 field として保持する。v1 には inventory が
    無く、mapping 1 件の destination 以外に destination 記録が無いため、削除すると promotion gate の
    v1 aggregate 照合 (F10) が根拠を失う。
  - 判別子は既存 manifest の語彙に合わせて `schemaVersion: "v1" | "v2"` とする
    (`src/schema/release-manifest.ts:51`/`:55`)。
- consumer-local admission (`validPlan`、F9) は v2 variant だけを受け入れ、`destinationPath` を要求しない。
  v2 variant に余剰の `destinationPath` がある入力は shape 不正として fail-close する (正本の再混入防止)。
  consumer-local admission は control manifest の `artifacts` を照合する経路であり (F8)、v1 plan を
  受け入れる理由がない。
- 判別の順序付き一致述語は `src/setup/release-aggregate-admission.ts` に 1 つだけ置いて export し、
  promotion gate はそれを再利用する (同じ述語の二重実装を作らない)。

### 2.3 promotion / rollback gate の範囲

所有 PLAN は confirmed `PLAN-L7-494` (実装 `src/setup/release-promotion-rollback-gate.ts`)、設計は
draft `PLAN-L6-102` (§promotion 条件 1 / 5、`docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md:163-173`)。
F10 / F11 のとおり、gate は単一 `mapping` と sealed plan のスカラー `destinationPath` の等値だけで
aggregate を照合しており、v2 multi-artifact では「任意の 1 mapping」しか検査しない。

- `PromotionGateInput.mapping` を `mappings: readonly ReleaseChannelMapping[]` に置き換える。
- v2 では gate が次を全て照合する: release identity (既存)、`sealedPlan.expectedDigest` /
  `actualDigest` = `artifactSetDigest` (既存)、`mappings` と manifest の selected release `artifacts` の
  順序付き完全一致 (§2.1 の共有述語)、`sealedPlan.entries[i].path === artifacts[i].destinationPath`
  (件数一致を含む)、各 mapping の channel / releaseId / sourceRevision (既存条件を全件へ)。
- v1 では `mappings.length === 1` と `mappings[0].destinationPath === sealedPlan.destinationPath` (v1 variant)
  を要求する (現行意味の保存)。
- 不一致の reason は既存の `identity_mismatch`、shape 不正は既存の `invalid_input` とし、reason 列挙も
  precedence も変えない (`PLAN-L7-494` §2)。
- rollback (`selectRollbackCandidate`) は sealed plan の shape 検証 (F11) を判別共用体に追随させるだけで、
  候補選択の意味は変えない。

### 2.4 canary channel 判定 (別 finding、本 PLAN では直さない)

- 実測: producer は `tag.includes("-canary.") ? "canary" : "stable"` で channel を決める
  (`src/cli/distribution.ts:365` `resolveConsumerRuntimeReleaseSourceBinding`、`:524`
  `buildConsumerRuntimeAdmissionInput`)。`PLAN-L7-531` §4 の第 1 層 fixture tag は `v0.0.0-canary-fixture`
  (`docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md:243-244`) であり、`-canary.` を含まないので
  channel は `stable` に解決される。
- 契約上の位置: `PLAN-L7-628` §5 手順 1 は「`--tag` に対応する channel」(`docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md:243`)
  と書くだけで tag → channel の規則を定義していない (628 本文に `-canary.` 規則の記述は 0 件、grep 実測)。
  `PLAN-L7-531` §4 は fixture tag が `v0.2.0-canary.*` を名乗らないことだけを定め、fixture が
  どの channel に解決されるべきかを定めていない。
- 判定: 契約が決めていない未定義点であり、本 PLAN の意図した挙動とも defect とも断定しない。
  fixture の control manifest が `stable` channel に対象 release を置けば第 1 層は成立し、`canary` channel
  だけに置けば `consumer_runtime_release_channel_unavailable` / `consumer runtime release channel unavailable`
  で止まる。どちらになるかは 531 PR-1 の fixture 次第である。
- routing: #418 配下の別 sub-issue とし、`PLAN-L7-628` の producer 契約で tag → channel 規則を凍結する
  (か、531 fixture の channel を明示する) 改訂で扱う。本 PLAN の scope・oracle・AC には含めない。
  本 PLAN の CANDIDATE は channel 名に依存しないよう `stable` / `canary` の両方で同じ結果を要求する。

## 3. スコープ (実装 PR が変更する file)

- `src/setup/release-aggregate-admission.ts`: v1 / v2 分岐、順序付き一致述語 (export)、attestation
  entries の path 束縛、`SealedReleaseAggregatePlan` 判別共用体、`sealPlan`。
- `src/setup/consumer-local-runtime-admission.ts`: `validPlan` を v2 variant 受入へ (F9)。
- `src/setup/release-promotion-rollback-gate.ts`: `PromotionGateInput.mappings`、`aggregateIdentityMatches`、
  `promotionShapeIsValid`、`validSealedPlanShape` (F10 / F11)。
- tests: `tests/release-aggregate-admission.test.ts`、`tests/consumer-local-runtime-admission.test.ts`、
  `tests/release-promotion-rollback-gate.test.ts`、`tests/pack-consumer-runtime-release.test.ts`
  (multi-artifact round trip)。
- test design: `docs/test-design/harness/L7-unit-test-design.md` (CANDIDATE 昇格行)。
- 訂正注記: `docs/plans/PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze.md`、
  `docs/plans/PLAN-L7-494-release-promotion-rollback-gate.md` (§7、本 PLAN 起票 PR で同時に入れる)。

`src/cli/distribution.ts` / `src/setup/index.ts` / `src/setup/consumer-runtime-release.ts` は変更しない
(producer と validator は既に artifact ごとの mapping を正しく作る、F3 / F4)。

## 4. 非スコープ

- finding enum の追加 (曖昧 mapping 専用 finding など)。別 PR。
- canary channel 判定規則 (§2.4)。別 sub-issue / `PLAN-L7-628` 改訂。
- producer / `PLAN-L7-628` validator の意味変更 (案 B の棄却)。
- v1 manifest の廃止・移行。
- promotion / rollback の reason 列挙・precedence・evidence 束縛の変更。
- `PLAN-L6-102` (draft) の本文改訂。文言整合の要否は `PLAN-REVERSE-742` R4 で routing する。
- `PLAN-L7-531` の canary 実行・公開・#418 closure。

## 5. テスト設計 (候補 oracle)

prefix `CANDIDATE-U-RELAGGV2-` は `docs/test-design/` / `tests/` / `docs/plans/` / `src/` で衝突 0
(`grep -rn "RELAGG" docs tests src` が空、2026-09-29 実測)。既存の PF-5 / promotion oracle
(`U-RELMAN-014..017`、`U-RELMAN-003..023`) は意味を変えず回帰として残す。

fixture: v2 manifest の release に N = 3 artifact (destinationPath は UTF-8 byte 順)、channel は
`stable` と `canary` の両方で同じ結果を要求する。negative は全て「resolver / attestation / materializer /
write の呼出し count 0」を併せて観測する (PF-5 の side effect 前判定の保存)。

| ID | 種別 | 入力 | 期待 |
| --- | --- | --- | --- |
| `CANDIDATE-U-RELAGGV2-001` | positive | v2 release (N=3)、mapping 3 件が artifacts と同順・同値 | `ok: true`。sealed plan は v2 variant で `destinationPath` を持たず、`entries[i].path === artifacts[i].destinationPath` (i=0..2) |
| `CANDIDATE-U-RELAGGV2-002` | positive (round trip) | `tests/pack-consumer-runtime-release.test.ts` で artifact 2 件以上の release を実 producer (`distribution package`) → 実 installer (`installConsumerRuntimeRelease`) に通す | producer / installer とも aggregate admission を通過し install 成功。現行 main では `missing_channel_mapping` で Red |
| `CANDIDATE-U-RELAGGV2-003` | negative | (a) mapping 0 件 / (b) N-1 件 / (c) N+1 件 (余剰 1 件は他条件を満たす) / (d) N 件だが 1 件が別 index の重複 / (e) 2 件の順序入替 / (f) 1 件の destination が allowlist 外 / (g) 1 件が別 channel (対象 channel 上は N-1) / (h) 1 件の `releaseId` 不一致 / (i) 1 件の `sourceRevision` 不一致 / (j) 1 件の sourcePath が `sourcePaths` 外 | 全て `missing_channel_mapping`、side effect count 0 |
| `CANDIDATE-U-RELAGGV2-004` | negative | attestation の `entries` が (a) 1 件欠落 / (b) path 順入替 / (c) 1 件の path が artifacts の destination と不一致 | 既存 `invalid_artifact`、sealed plan 不発行 |
| `CANDIDATE-U-RELAGGV2-005` | v1 回帰 | (a) v1 channel に mapping 1 件 / (b) v1 channel に mapping 2 件 | (a) `ok: true`、v1 variant が `destinationPath` を保持 / (b) `missing_channel_mapping` |
| `CANDIDATE-U-RELAGGV2-006` | consumer-local admission | (a) N=3 の v2 sealed plan / (b) v2 variant に余剰 `destinationPath` / (c) v1 variant | (a) 受入 / (b)(c) fail-close |
| `CANDIDATE-U-RELAGGV2-007` | promotion positive | v2 N=3、`mappings` と sealed entries が artifacts と順序一致、他 evidence は既存 allow fixture | `decision: "allow"`、`sideEffects: "none"` |
| `CANDIDATE-U-RELAGGV2-008` | promotion negative | (a) `mappings` 順序入替 / (b) `mappings` N-1 件 / (c) sealed entries 順序入替 / (d) sealed entries N-1 件 / (e) 1 mapping の destination が entries と不一致 / (f) v1 で `mappings` 2 件 | 全て `deny` / `identity_mismatch`、promotion 先 write 0 |
| `CANDIDATE-U-RELAGGV2-009` | rollback shape | v2 variant の sealed plan を持つ rollback 候補 | shape 検証を通過し、候補選択結果は v1 fixture と同じ規則 (意味不変) |

mutation probe (実装 PR の review packet に、どの出現を除去したかを file:line で明記する):

- M1: v2 分岐を `candidates.length !== 1` へ戻す → 001 / 002 / 007 が Red。
- M2: 順序付き一致を集合一致 (`includes` / `Set`) へ弱める → 003(d)(e) / 008(a) が Red。
- M3: promotion gate が `mappings[0]` だけを照合する → 008(a)(b)(e) が Red。
- M4: v1 分岐を削除して v1 でも N 件を許す → 005(b) / 008(f) が Red。
- M5: attestation entries の path 束縛を削除する → 004 が Red。

## 6. 受入基準 (AC)

1. `CANDIDATE-U-RELAGGV2-001..009` が実装前に Red (001 / 002 / 007 は現行 main で Red、negative は
   positive fixture 成立後に Green 化) で書かれ、実装後に Linux / Windows CI で Green。
2. M1〜M5 の各 mutation で対応 oracle が Red になることを review packet に記録する。
3. 既存 `U-RELMAN-003..023` (`tests/release-aggregate-admission.test.ts`、
   `tests/release-promotion-rollback-gate.test.ts`)、`U-PACKRT-*` (`tests/pack-consumer-runtime-release.test.ts`)、
   `tests/consumer-local-runtime-admission.test.ts` が無変更の意味で Green。
4. `ReleaseAggregateFinding` の列挙が不変 (`src/setup/release-aggregate-admission.ts:41-49` の diff 0)。
5. v2 sealed plan に destination の第 2 記録 (スカラー / 配列) が無いことを型と 006(b) で担保する。
6. `src/cli/distribution.ts` / `src/setup/index.ts` / `src/setup/consumer-runtime-release.ts` の diff 0。
7. `PLAN-L7-492` / `PLAN-L7-494` の訂正注記が入り、`doctor plan-supersession` が Green。
8. 非著者 family (Claude Opus) の closing review が exact head で blocking 0。
9. `PLAN-REVERSE-742` が R4 まで進み、L6-63 / L6-102 への backprop 要否が記録される。

## 7. 実装順序 (serial)

1. **S1 契約 PR (本 PLAN)**: 本 PLAN + `PLAN-REVERSE-742` (R0) + `PLAN-L7-492` / `PLAN-L7-494` 訂正注記を
   docs-only で起票し、非著者 review (Codex Sol) を受ける。
2. **S2 実装 PR (1 PR = 1 論点「v2 inventory 基数」)**: §3 の src / tests / test-design。S1 merge 後に着手。
   finding enum 追加・canary channel 規則は含めない。
3. **S3 confirm**: S2 の CI Green と closing PASS を受けて本 PLAN を confirmed 化し、`generates` へ
   実装成果物を追加する。`PLAN-REVERSE-742` を R1〜R4 へ進める。
4. S3 の後に `PLAN-L7-531` PR-1 (canary 第 1 層) が multi-artifact release で進める状態になる。

### 7.1 PLAN-L7-492 へ追記する訂正注記 (AC は上書きしない)

```markdown
## 訂正注記 (2026-09-29、PLAN-L7-742)

§1 (C) の channel-selected artifact → Pack destination 写像は v1 (channel あたり destination 1 件) を
前提に凍結されており、`PLAN-L7-499` の v2 multi-artifact inventory について再定義されていなかった。
このため `src/setup/release-aggregate-admission.ts` の `selectedMapping` は mapping がちょうど 1 件でない
v2 release を全て `missing_channel_mapping` で拒否する (実測: #418 / `PLAN-L7-531` PR-1)。
v2 の基数契約 (mapping 列 = selected release の `artifacts` 列の順序付き完全一致) と、sealed plan の
destination 正本を `entries[].path` に限る変更は後継 `PLAN-L7-742-release-aggregate-v2-inventory-cardinality`
が所有する。v1 の exactly-one、§1 (A)(B)、§1 の apply / rollback 契約、および本 PLAN の AC・status は
変更しない。
```

### 7.2 PLAN-L7-494 へ追記する訂正注記 (AC は上書きしない)

```markdown
## 訂正注記 (2026-09-29、PLAN-L7-742)

§2 の「PF5 sealed plan の kind/destination/entries/entry の strict shape 検証」と単一 `mapping` 入力は、
sealed plan のスカラー `destinationPath` と channel mapping 1 件を前提にしており、v2 multi-artifact
release では任意の 1 mapping しか照合しない (`src/setup/release-promotion-rollback-gate.ts:596`)。
v2 では `mappings` 列と manifest の `artifacts` 列の順序付き完全一致、および sealed plan の
`entries[].path` との一致で aggregate 全体を照合するよう、後継
`PLAN-L7-742-release-aggregate-v2-inventory-cardinality` が §2 の該当部分だけを置き換える。
reason 列挙・precedence・evidence 束縛・rollback の選択規則、および本 PLAN の AC・status は変更しない。
```

`PLAN-L6-102` は draft のため supersede 対象にせず、`PLAN-REVERSE-742` R4 で文言整合の要否を routing する。
`PLAN-L7-628` は validator 契約 (F4) が本 PLAN と整合しており訂正注記は不要。
