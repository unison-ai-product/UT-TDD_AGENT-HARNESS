---
plan_id: PLAN-L6-102-release-promotion-rollback-gate
title: "PLAN-L6-102 (add-design): S3 release promotion gate / rollback pair-freeze"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-20
updated: 2026-08-20
owner: PM / Codex
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - PF1〜PF5、QA、cross-family receiptを一つのpromotion admission契約へ束ねる"
  - role: se
    slot_label: "SE - exact artifact identity、attested rollback、deny時のwrite/publish境界を固定する"
  - role: qa
    slot_label: "QA - promotion Go/No-Go、receipt欠落、identity変異、rollback failureのoracleを固定する"
generates:
  - artifact_path: docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires:
    - PLAN-L6-49-refactor-and-qa-release-gates
    - PLAN-L7-108-review-green-command-evidence
    - PLAN-L7-394-refactor-qa-release-contract-gate
    - PLAN-L7-479-release-manifest-pf1-pure-domain
    - PLAN-L7-486-release-materializer-pf2
    - PLAN-L7-487-isolated-git-artifact-resolver-pf3
    - PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze
    - PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze
  blocks: []
  references:
    - PLAN-L7-473-staged-release-channel-manifest
    - PLAN-L6-85-automated-pr-cross-review-merge-contract
    - PLAN-L7-439-cross-review-merge-learning-closure
    - docs/governance/github-issue-hierarchy.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/360
github_issue_id: 360
review_evidence: []
---

# PLAN-L6-102: S3 release promotion gate / rollback pair-freeze

## 0. 目的と責務境界

Issue #360 の S3 を、既存 PF1〜PF5 が確定した release artifact を次の配布段階へ進める
promotion admission と、直前の attested release へ戻す rollback admission の設計契約として固定する。
本PLANは source/Pack 側の gate 判定と receipt の束縛だけを扱い、consumer runtime の導入・更新・復旧は
`PLAN-L6-101` および後続 bounded slice の責務とする。

Pack copy、consumer runtime、GitHub Release、D1-D3、Execution Episode、force push、tag付替え、
commit/push は本PLANのscope外である。既存のPF1〜PF5、QA Go/No-Go、cross-family review receipt、
merge gateを再利用し、新しいartifact生成・publish・rollback apply engineを発明しない。S3が新規に
所有するのは、既存receiptとidentityを合成するpureなpromotion/rollback decision gateだけである。

## 1. Promotion admission 契約

### 1.1 入力の正本と型境界

S3は存在しない「PF1〜PF5 receipt」を前提にしない。各段の既存成果物を次の型で束ねる。

| 入力 | 正本 | S3での扱い |
|---|---|---|
| release identity / channel order | `src/schema/release-manifest.ts` の `ReleaseIdentity` / `ReleaseManifest`、`docs/design/harness/L6-function-design/release-channel-manifest.md` §2-§3 | `releaseId`、`materializerVersion`、`artifactSourceCommit`、`artifactSetDigest`を正本値として使用し、channelはmanifestのown propertyと`channelOrder`から解決する |
| PF4 attestation | `src/setup/release-channel-adapter.ts` の `ReleaseChannelAttestation` | `status: "attested"`だけを受理し、`releaseId` / `artifactSourceCommit` / `expectedDigest` / `actualDigest`をmanifestと再照合する。`mismatch` / `unavailable`はdenyへ送る |
| PF5 sealed aggregate | `src/setup/release-aggregate-admission.ts` の `SealedReleaseAggregatePlan` | `channel` / `releaseId` / `sourceRevision` / `expectedDigest` / `actualDigest`を同じrelease identityへ束縛する。apply engineはS3の所有外 |
| canonical CI / merge evidence | `src/kernel/github-closure-receipt.ts` の `REQUIRED_GITHUB_CHECK`、`MergeClosureReceipt`、`ReviewReceiptSource` / `validCrossReviewSource` | S3実装で導入する`CanonicalCiEvidence` typed inputへ、Linux/Windows/aggregateの成功結果、exact HEAD、PLAN revision、`harness-check`を明示的に渡す。未定義のCI receiptを捏造しない |
| D1/D2 review evidence | `src/feedback/review-dispatch.ts` の `ReviewReceipt` / `analyzeReviewDispatch`、`src/feedback/review-merge-gate.ts` の `evaluateMergeGate` | `merge_ready`、cross-family verdict、blocking 0、対象HEAD一致を要求する。`ReviewReceiptSource`はcanonical review artifactの検証入力として再利用する |
| QA Go/No-Go | `docs/governance/vmodel-refactor-qa-release-gates.md` §3.2、`PLAN-L6-49` / `PLAN-L7-394` | 現行runtimeにS3専用QA receipt型は存在しないため、実装時に`QaReleaseGateEvidence` typed inputを導入する。G01〜G08の判定、対象release identity、source revision、artifact digest、channel、evidence digestを必須化する |

`CanonicalCiEvidence` と `QaReleaseGateEvidence` はS3実装の入力型であり、外部ファイルを正本に
昇格させるものではない。いずれも不正な形、対象外revision、判定不能を入力時点で`deny`へ落とす。
`observedAt` は監査・同一入力内の順序確認にだけ使い、暗黙のTTLやwall-clock依存の「期限切れ」判定は
導入しない。freshness は exact subject/head/PLAN revision/evidence digest の一致と、既存契約が要求する
timestamp の形式・順序で決定する。S3のpure gateは上記入力を読むだけで、GitHub、Pack、filesystem、DB、
apply portを直接呼び出さない。

実装者が境界を推測しないよう、最小のtyped shapeを次で固定する。`success` / `go`以外の値は
成功へcoerceせず、unknown field・欠落・重複はtyped denyとする。

```ts
type CiLeg = "linux" | "windows" | "aggregate";
type GateLegStatus = "success";

interface CanonicalCiEvidence {
  readonly checkName: typeof REQUIRED_GITHUB_CHECK;
  readonly headSha: string;
  readonly planRevision: string;
  readonly legs: Readonly<Record<CiLeg, GateLegStatus>>;
  readonly evidenceDigest: string;
  readonly observedAt: string;
}

interface QaReleaseGateEvidence {
  readonly releaseId: string;
  readonly sourceRevision: string;
  readonly artifactDigest: string;
  readonly channel: string;
  readonly checks: Readonly<Record<"G01" | "G02" | "G03" | "G04" | "G05" | "G06" | "G07" | "G08", "go">>;
  readonly evidenceDigest: string;
  readonly observedAt: string;
}

interface ReviewGateEvidence {
  readonly exactHeadSha: string;
  readonly planRevision: string;
  readonly d1: {
    readonly state: "merge_ready";
    readonly exactHeadSha: string;
    readonly reviewRevision: string;
    readonly verdict: "PASS" | "PASS-WEAK";
    readonly blocking: readonly [];
  };
  readonly d2: {
    readonly decision: "allow";
    readonly reason: "merge_ready";
    readonly headSha: string;
    readonly evaluatedHeadSha: string;
  };
  readonly claimBlind: ReviewReceiptSource;
  readonly specBlind: ReviewReceiptSource;
}

type PromotionGateReason =
  | "invalid_input" | "identity_mismatch" | "ci_missing" | "qa_no_go"
  | "review_missing" | "channel_transition_invalid" | "attestation_unavailable";
type RollbackGateReason =
  | "invalid_input" | "candidate_missing" | "candidate_ambiguous"
  | "identity_mismatch" | "attestation_missing" | "artifact_unavailable"
  | "restore_indeterminate";
```

`ReviewGateEvidence` は架空のreview artifactではなく、既存の
`ReviewDispatchEntry`（D1）・`MergeGateDecision`（D2）・`ReviewReceiptSource`をS3入力境界で束ねる
typed adapterである。`d1.blocking` は既存entryの`blocking`配列が空である場合だけ空tupleとして構成し、
`d2` は既存merge gateの`ok=true`、`reason="merge_ready"`相当、`headSha===evaluatedHeadSha`を
再照合して構成する。`claimBlind` / `specBlind` はそれぞれlaneが一致し、両方が
`validCrossReviewSource`を通過し、同一`exactHeadSha`・`planRevision`、cross-family、`PASS`または
`PASS-WEAK`でなければならない。片lane欠落、lane混線、D1のblocking残存、D2のsubject不一致は
`CANDIDATE-RELMAN-003` / `020`のdeny対象であり、`ReviewReceiptSource`単体をD1/D2の代用にしない。

`PromotionGateResult` は `allow` または上記 `PromotionGateReason` の `deny` だけを返し、
`RollbackGateResult` は `allow` / `deny` / `indeterminate` を返す。両者とも decision gate自身の
`sideEffects` は常に`"none"`であり、apply/restoreの実行結果は既存portの別receiptとして入力される。

promotion は次の全条件のANDが成立した場合だけ `allow` とする。

1. `ReleaseManifest`の選択identity、`ReleaseChannelAttestation(status="attested")`、PF5
   `SealedReleaseAggregatePlan`、channel mappingが同一release identityに対して成功している。
   PF1〜PF3の結果はmanifest / attestation / sealed planの既存値で表現し、個別receiptの存在を仮定しない。
2. `CanonicalCiEvidence`が対象exact HEAD / PLAN revisionへ束縛され、`harness-check`のLinux/Windows/
   aggregate結果がすべて成功している。
3. `QaReleaseGateEvidence`がG01〜G08のGo/No-Go判定を持ち、対象のrelease identity、source revision、
   artifact digest、channel、evidence digestへexactに束縛されている。
4. `ReviewReceiptSource`の`validCrossReviewSource`検証とD1 `merge_ready` / D2 merge gateの結果が、
   対象exact HEAD / PLAN revisionへ束縛され、blocking 0のcross-family closing verdictである。
5. manifest、materialized artifact、resolver結果、channel mapping、PF5 sealed aggregateの
   `releaseId` / `sourceRevision` / `artifactDigest` が一致する。

いずれか一つでも欠落・不一致・stale subject（head、PLAN revision、evidence digestの不一致）・別subjectなら `deny` とし、promotion先への write、publish、
tag変更、commit、pushを全て0にする。receiptを別releaseから再利用するfallbackや、CI/QAの一部成功を
promotion成功へ丸めるfallbackは持たない。

判定順序は固定する。(a) typed input shape / required field、(b) subject・revision・identityの
exact一致、(c) CI / QA / reviewのdigest・timestamp順序・verdict、(d) product-defined channelの隣接遷移、
(e) `attested`状態、(f) `allow`の順で評価する。(a)〜(e)のどこか一つでも失敗した結果は
`PromotionGateResult = { decision: "deny", reason: <typed reason>, sideEffects: "none" }`とし、
`allow`以外に副作用可能な出力を定義しない。成功時も返すのはidentityと束縛済みevidence digestを
含むsealed decisionだけで、publish/applyは呼び出し側の後段portに委ねる。

## 2. Rollback admission 契約

rollback対象は、現在releaseに対して直前にattest済みで、identity（releaseId、sourceRevision、
artifactDigest、materializer version、channel）が完全一致する一つのreleaseだけとする。rollback
gateのtyped inputは、現行`ReleaseIdentity`、候補ごとのattestation、channel、現在pointer、
candidate evidence digestを受け、`RollbackGateResult = { decision: "allow" | "deny" | "indeterminate";
reason: <typed reason>; sideEffects: "none" }`を返す。candidate選択はpureであり、候補が一意に
定まらない場合はdeny、restore結果を確定できない場合だけindeterminateとする。

- 候補が0件、複数件、identity不一致、attestation欠落、artifact unavailableならdenyする。
- rollbackの選択、staging、apply、receipt生成は同一入力から再実行して同じ結果になる決定論的な手順とする。
- promotion同様、force push、tag付替え、commit、push、consumer runtime操作は行わない。
- private staging/applyの復元不能は成功へ丸めず、`rollback_failed` または `indeterminate` として
  fail-closeする。
- rollback対象外のrelease、最新化による暗黙upgrade、source repositoryへのfallbackを許可しない。

PF5の既存 aggregate admission/apply port（snapshot、staging、apply、discard、restore）を正本として、
S3はその結果とreceiptのgate判定だけを所有する。

## 3. QA Go/No-Go と mutation oracle

最小oracleは以下とする。各mutationは一つずつ注入し、deny時のwrite/publish=0を観測する。

| oracle | RED mutation | Green条件 |
|---|---|---|
| `CANDIDATE-RELMAN-003` | canonical Linux/Windows/aggregate CI、QA Go、cross-family closing receiptを各1件ずつ欠落・stale・別subjectへ変異 | promotion拒否、channel pointer不変、write/publish 0 |
| `CANDIDATE-RELMAN-004` | 同じmanifest・prior release・targetを2回rollback評価 | 同一pointer deltaとdigestへ収束し、二重apply 0 |
| `CANDIDATE-RELMAN-005` | rollback実行計画を生成 | force push/tag付替え/commit/push command 0 |
| `CANDIDATE-RELMAN-008` | No-Go未解除のままstableへpromotion | dependency不足で拒否、channel pointer不変、write/publish 0 |
| `CANDIDATE-RELMAN-010` | valid manifest deltaをD2 `merge_ready`なしで適用 | promotion/rollback write/publish 0 |
| `CANDIDATE-RELMAN-019` | `releaseId`、`sourceRevision`、`artifactDigest`、materializer version、channelの各identityを1要素ずつ変異 | exact artifact identity不一致として拒否、channel pointer不変、write/publish 0 |
| `CANDIDATE-RELMAN-020` | manifest、PF4 `ReleaseChannelAttestation`、PF5 `SealedReleaseAggregatePlan`、CI、QA、review evidenceを各1点ずつunavailable、staleなexact head/PLAN revision/evidence digest、別revisionへ変異。`observedAt`単独の経過時間は変異対象にしない | promotion拒否、evidence再利用・source fallback・write/publish 0 |
| `CANDIDATE-RELMAN-021` | 直前attested rollback候補を0件、2件、attestation欠落、identity不一致へ各1点変異 | rollback拒否、現行pointer・artifact bytes不変、apply/write 0 |
| `CANDIDATE-RELMAN-022` | 既存restore portの各境界へfaultを注入し、復元不能を観測 | `rollback_failed`または`indeterminate`へfail-closeし、成功扱い・partial publish 0 |
| `CANDIDATE-RELMAN-023` | product-defined channel順序の次段でないtarget、channel pointerの旧revision、unknown targetを各1点変異 | promotion拒否、channel pointer不変、write/publish 0 |

artifact identity単独変異、直前attested以外のrollback候補、PF5 restore不能の合成境界は、既存candidateとの
重複を確認したうえで、本pair-freezeで`CANDIDATE-RELMAN-019`〜`023`として採番済みである。実装PRでは
同じcandidateを対応する`U-RELMAN-*`へ1:1で昇格し、別IDを発明しない。

## 4. 実装降下とpath境界

S3の最小production追加は既存PF5のadmission/apply portを呼ぶ薄い gate adapter とし、公開CLIやPack copy
を増やさない。最初の実装PRで新規に所有できるpathは、後続PLANで明示された1つのsource moduleと
対応testだけに限定する。shared `docs/test-design/harness/L7-unit-test-design.md` の oracle追記は
PR #358（PLAN-L6-101）merge済みの現HEADへ束縛し、PR #358のmerge前はpath leaseを取得しない。

Scheduleは次の順序とする。

1. [直列] PF1〜PF5、QA、review receipt、merge gateの既存confirmed契約を入力としてpair-freezeする。
2. [直列] PR #358 merge済みの現HEADでshared L7 test-designへS3 oracleを追記し、既存の
   `CANDIDATE-RELMAN-003/004/005/008/010` と新規の `019`〜`023` を本PLANと1:1で固定する。
   これらは本pair-freezeで採番済みの実装前RED候補であり、実装PRでのみ対応する`U-RELMAN-*`へ昇格する。
3. [並列] promotion admissionのpure predicateとrollback candidate selectionを、それぞれ既存portへ
   接続する最小実装として実装する。ただしshared test-designの編集は一ownerに直列化する。
4. [直列] canonical CI、QA Go/No-Go、cross-family receipt、exact identity mutationをLinux/Windowsで
   検証し、closing review/merge gateへ渡す。

## 5. 出口条件

- promotionの全AND条件とdeny時write/publish=0が実測テストで固定されている。
- rollbackが直前attested releaseだけを決定論的に選び、復元不能を`rollback_failed`/`indeterminate`へ
  fail-closeする。
- force push、tag付替え、commit、push、consumer runtime、GitHub Release、Execution Episodeが
  production diffに存在しない。
- shared L7 test-designの追記はPR #358 merge後のexact HEADへ束縛され、Linux/Windows/aggregate CI、
  cross-family closing receipt、plan lintが同一証跡系列で確認される。
