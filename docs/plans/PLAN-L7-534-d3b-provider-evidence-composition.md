---
plan_id: PLAN-L7-534-d3b-provider-evidence-composition
title: "PLAN-L7-534 (add-impl): D3b provider evidence composition (canonical
  custody → producer → artifact) pair-freeze"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-11
updated: 2026-09-11
owner: Claude / Fable (pair-freeze) · Codex worker (implementation)
parent_design: docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
pair_artifact: docs/test-design/harness/L7-d3b-provider-evidence-composition-test-design.md
backprop_decision: not_required
backprop_decision_reason: PLAN-L7-562 の D3b payload / canonicalization 契約と
  PLAN-L7-465 §D3c の authority 政策を変更せず、既存の canonical custody 事実 (request /
  verdict / receipt / audit) から producer 入力を導出する結線だけを固定するため。
agent_slots:
  - role: tl
    slot_label: Sol / Claude Opus - L7-562 producer 契約と L7-534 composition 境界を照合する
  - role: qa
    slot_label: Terra - CANDIDATE-U-D3BCOMP-001..014 の Red oracle (operator
      文字列受理、invocation fact 推定、artifact 再読込の省略、replay 転用) を実装する
generates:
  - artifact_path: docs/plans/PLAN-L7-534-d3b-provider-evidence-composition.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
  requires:
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
    - docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-562-d3b-provider-judgment.md
    - docs/plans/PLAN-REVERSE-562-d3b-provider-judgment-backfill.md
    - docs/plans/PLAN-L7-503-review-custody-delegation-root.md
    - docs/plans/PLAN-REVERSE-534-d3b-provider-evidence-composition-backfill.md
    - docs/test-design/harness/L7-d3b-provider-evidence-composition-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/570
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/568
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/569
review_evidence: []
status: draft
github_issue_id: 570
admission_receipt:
  schema_version: v2
  receipt_id: certificate:ec10fee30970ff97049d1a9a3b1dcb77
  command_id: plan-revise:issue-570:forward:6
  admitted_at: 2026-09-11T08:01:20.641Z
  source_digest: sha256:5770ffaca15516994d9d6fb6516c9dc026e14370db8c32b33a696bf0abcb5344
  decision_digest: sha256:a9c7b182766e84abc142ea16c69e8fd99b9504577a0fcfdbff70240875cdc8cc
  receipt_digest: sha256:8b6745ce35530cd672080f841d3a2fb3e858bae23c514414ec2dd70024c8191f
  binding:
    path: docs/plans/PLAN-L7-534-d3b-provider-evidence-composition.md
    plan_id: PLAN-L7-534-d3b-provider-evidence-composition
    asset_id: plan:2eeafb9dd9883770a0f56c936c08bd1f
    revision: 6
    content_digest: sha256:5770ffaca15516994d9d6fb6516c9dc026e14370db8c32b33a696bf0abcb5344
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 570
    episode_id: E4-570-d3b-provider-evidence-composition
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L6-85-automated-pr-cross-review-merge-contract
    revision: 2
    digest: sha256:7f822e8cbc533306baccbf4702fc01c3ebb9133a4b3baec8ac84359c99ed156f
  reentry:
    target_plan_id: PLAN-L7-534-d3b-provider-evidence-composition
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #570 D3b provider evidence composition pair-freeze
    (add-feature; PLAN-L7-562 producer downstream, PLAN-L6-85 rev 2 origin);
    revision 6: Codex/Sol FLAG e3023aa5 (orphan receipt recovery without
    overwrite: idempotent same-bytes / attempt_outcome_conflict, terminal only
    with matching attempt_completed; candidate 006 aligned to
    receiptFileDigest/receipt_mutated; candidate 020)"
---

# PLAN-L7-534: D3b provider evidence composition

## 1. 目的と前提

Issue #570 は、PR #569 (Issue #568) が main へ入れる **pure な D3b producer**
(`produceProviderJudgment(attempt, port)`、`FileProviderJudgmentEvidenceAdapter`) を、本番の
canonical review custody から呼び出す **composition** が無い gap を閉じる slice である。
現状 (2026-09-11、main `53e51781` + PR #569 head の実測):

| 観測 | 実測 |
| --- | --- |
| producer 入力 | `ProviderJudgmentAttemptIdentity` (repository / prNumber / headSha / requestMemoryId / requestDigest / reviewRevision / attempt / authorFamily / invocationNonce) と `ProviderJudgmentEvidencePort` |
| evidence envelope | adapter は `<evidenceRoot>/<requestDigest>/attempts/attempt-N/evidence.json` に `d3b-provider-evidence-envelope/v1` (`identity` / `provider` / `model` / `evidence_base64`) を要求し、`provider` / `model` は adapter 構築時の `verifiedInvocation` と一致しなければならない |
| evidence document | `evidence_base64` の中身は `provider-judgment-evidence/v1` (`verdict` / `blocking_findings` = 昇順・重複なし、FLAG のときだけ非空) |
| 生成物 | `.ut-tdd/review/judgments/<judgment_digest>.json` (immutable) と `provider_evidence_ref = d3b:<judgment_digest>` |
| custody 側の事実 | request `.ut-tdd/review/requests/<digest>.json` (memoryId / pr / exactHead / reviewRevision / authorFamily / invocationNonce)、verdict file `.ut-tdd/review/verdicts/<digest>/attempts/attempt-N/verdict.txt` (9 行 envelope、受理後 cleanup で削除)、receipt `.ut-tdd/review/receipts/<digest>.json` (verdict / blockingFindings / reviewerFamily、provider / model は **無い**)、audit `.git/ut-tdd-runtime/review-custody/review-custody.jsonl` (失敗・supersede・cleanup event のみ。**成功 attempt の provider / model は記録されない**) |
| runner | `src/feedback/review-custody-runner.ts` は `UT_TDD_CUSTODY_JUDGMENT_DIGEST` / `UT_TDD_CUSTODY_PROVIDER_EVIDENCE_REF` を operator 供給の env 文字列として受理し、導出も検証もしない |

上記のうち custody 事実はすべて untracked (repository checkout 内のみ) であり、GitHub Actions 上の runner
からは読めない。したがって composition は **review を実行した checkout でローカルに** 行い、runner は
artifact bytes から digest / ref を再計算する (§2)。

### 1.1 前段の充足

- `PLAN-L7-562` pair-freeze は PR #564 で main 到達 (Claude 族 PASS-WEAK receipt `a2a46e5e`)。実装 PR #569 は
  Codex 著で、本 PLAN は #569 の main 到達を PR-1 の前提に置く (§6)。
- `PLAN-L7-493` (D3a repo-local verdict custody) と `PLAN-L7-503` (custody delegation root) が request / verdict /
  receipt / audit の物理配置を所有する。本 PLAN はこれらを再定義しない。

## 2. 設計判断: composition の場所と runner の入力

advisor 相談: `ut-tdd advisor --decision design --current-model claude-fable-5 --plan PLAN-L7-562 --execute`
(2026-09-11、provider=claude、model=claude-fable-5)。推奨は **A**。advisor が未確認とした「audit event が
attempt 単位で terminal 判定できるか」は実測で **否** (成功 attempt は event を残さない) と判明したため、
§3.2 で `attempt_completed` event を追加して閉じる (推奨の前提差分として記録)。

rev 4 (Codex/Sol FLAG d4d0c34e、blocking 2 への是正): 「receipt 書込 → event append」の順序では append 失敗時に
receipt だけが残り、`beginReviewAttempt` が `review_receipt_already_exists` で retry を拒否するため composition が
永久に `invocation_fact_unavailable` になる。また `projectReviewVerdict` が返す digest は request digest であり
receipt 内容の改変を検出できない (実測: `src/feedback/review-attestation.ts` の `projectReviewVerdict` 戻り値、
`src/feedback/review-verdict-custody.ts` の `beginReviewAttempt`)。advisor 相談 (`--decision design`、
claude-fable-5、2026-09-11) は次の案から **C** を推奨し採用した:

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| A | delegation 側で receipt bytes を先に確定し event を append してから receipt を書く | 不変条件は C と同じだが `projectReviewVerdict` の receipt 書込を分離する refactor が要る | 棄却 (変更半径) |
| **C (採用)** | `projectReviewVerdict` の成功経路内で temp 書込 → digest → event append → rename の順序を保証する | 変更が 1 関数に閉じる。rename 先既存・crash window・temp 残置の規則を契約に持つ必要がある | 採用 |
| B | receipt 先行のまま修復コマンドで event を後付けする | fact 捏造経路 | 棄却 |

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **A (採用)** | composition はローカル (custody 事実が実在する checkout) で行い、request / verdict / receipt / audit だけから producer 入力を導出して artifact を生成する。runner は artifact bytes を受け取り digest / ref を再計算し、operator 文字列 env は拒否する | 信頼根を増やさず既存事実から導出する唯一の案。偽装面は bytes 自体に縮退し、digest 自己検証でしか通らない。bytes が本物の provider invocation 由来であることは本 PLAN では証明しない (#541 seal の守備範囲、§8) | 採用 |
| B | operator 文字列を残し、tracked evidence directory の artifact と一致検証だけ足す | author が artifact と一致する文字列を自作 commit すれば通り、operator 非依存という目的を達成しない | 棄却 |
| C | request / verdict / audit を tracked 化して runner 内で composition する | untracked 運用の設計判断を覆し、audit log の改竄面を PR diff に開く。authority 政策の実質変更に近い | 棄却 |

## 3. composition 契約

### 3.1 entrypoint と入力導出

- 本番 entrypoint は 1 つ: `composeProviderJudgment({ repoRoot, requestDigest, attempt })`
  (`src/feedback/provider-judgment-composition.ts`)。caller が渡せるのは **request digest と attempt 番号だけ**で、
  digest / ref / provider / model / family / verdict / findings を引数・env・stdin から受理しない。
- identity は request file からのみ導出する: `repository` は tracked `ut-tdd.project.json` の repository identity、
  `prNumber` / `headSha` / `requestMemoryId` / `reviewRevision` / `authorFamily` / `invocationNonce` は
  `.ut-tdd/review/requests/<requestDigest>.json`、`requestDigest` は file 名と file 内容の再計算
  (`reviewRequestDigest`) が一致するものだけ。不一致・欠落・schema 不正は `request_unavailable`。
- invocation fact は §3.2 の `attempt_completed` audit event からのみ導出する。receipt の `reviewerFamily`、
  verdict envelope の `reviewer_provider` / `reviewer_model` 行、memory、PR comment から provider / model を
  推定しない (`invocation_fact_unavailable`)。
- evidence document は receipt (`.ut-tdd/review/receipts/<requestDigest>.json`) からのみ導出する:
  `verdict` と `blocking_findings` (receipt の `blockingFindings` を昇順に整列。重複があれば
  `evidence_schema_invalid` で deny し、黙って dedup しない)。receipt の `head` / `reviewRevision` / `pr` が
  request と一致しなければ `identity_mismatch`。

### 3.2 verified invocation fact (`attempt_completed`)

- `projectReviewVerdict` (`src/feedback/review-attestation.ts`) の成功経路が、receipt を確定する前に audit event
  `attempt_completed` を append する。順序は (1) receipt bytes を receipt と同一ディレクトリの temp file へ書く、
  (2) その bytes の sha256 を `receiptFileDigest` とする、(3) `attempt_completed` を append する
  (`requestDigest` / `attempt` / `exactHead` / `verdictPath` / `recordedAt` / `provider` / `model` /
  `exitCode` / `receiptFileDigest` / `verdictDigest`)、(4) temp を receipt path へ rename する。rename 先に receipt が
  既にある場合は上書きせず、既存 bytes と temp bytes を比較して、同一なら temp を捨てて成功 (冪等)、異なれば
  `attempt_outcome_conflict` を append して fail-close する (rev 6)。delegation.ts は attestation の `provider` / `model` を渡すだけで、event の
  append 位置を持たない。
- 失敗点ごとの状態遷移: (3) 失敗 → temp を消し receipt 無しで `attempt_execution_failed` を記録 (retry 可)。
  (4) 失敗または (3)〜(4) 間の crash → event 有り・receipt 無し。この状態を `beginReviewAttempt` は**非終端**
  (retry 可、次 attempt が `superseded_attempt` を残す) と扱い、残った temp は次 attempt 開始時に無視して消す。
  composition は receipt file が無い attempt を `receipt_unavailable` で deny する。
- orphan receipt (rev 6): `beginReviewAttempt` は receipt file の存在だけで終端とみなさない。receipt bytes の sha256 と
  一致する `receiptFileDigest` を持つ `attempt_completed` がある receipt だけを `review_receipt_already_exists` で
  拒否し、一致する event が無い receipt (本 PLAN 以前の経路が残した receipt-without-fact、または競合 runtime の残置)
  は orphan として新 attempt の開始を許す。新 attempt の完了時は上記 (4) の比較規則で、同一 bytes なら 1 receipt の
  まま冪等に完了し、異なる bytes なら上書きせず `attempt_outcome_conflict` で fail-close する。orphan の削除・
  移動は行わない (append-only、write は temp と audit のみ)。同一 identity の bounded retry は
  「次 attempt が exactly once で完了する (receipt 1 個・一致する `attempt_completed` 1 件)」か「typed deny で
  fail-close する」かのどちらかであり、永久 wedge (`review_receipt_already_exists` と fact 不在の共存) を作らない。
- `receiptFileDigest` は receipt file bytes の sha256 (lowerhex 64) であり、composition は receipt file を再読込して
  再計算値と照合する (不一致 = 改変 → `receipt_mutated`、write 0)。既存 `cleanup_pending.receiptDigest` は request
  digest のままで意味を変えず、`attempt_completed` には `receiptDigest` field を持たせない (同名二義を作らない)。
- canonical serialization (rev 5): digest の対象は `projectReviewVerdict` が書く bytes そのもの、すなわち
  `JSON.stringify(receipt, null, 2)` + LF 1 個、UTF-8 (BOM 無し) である (実測: `review-attestation.ts` の
  create-exclusive writer)。receipt object (`memoryId` / `pr` / `head` / `reviewRevision` / `reviewerFamily` /
  `kind` / `verdict` / `blockingFindings` / `at`) は自身の digest を含まないので除外規則は不要。composition は
  file bytes をそのまま hash し、JSON を再 parse・再 serialize しない (CRLF 化・key 並び替え・空白変更はすべて
  `receipt_mutated`)。
- 互換 (rev 5): `attempt_completed` は本 PLAN で新設する kind なので旧値は存在しない。それでも event に
  `receiptDigest` field がある、`receiptFileDigest` が欠落・非 lowerhex64・request digest と同値のいずれかなら
  `invocation_fact_schema_invalid` で deny し、request digest を receipt digest として黙って受理しない。
  `cleanup_pending` の既存 `receiptDigest` (request digest) は composition の入力ではなく、読み替えもしない。
  `attempt_completed` は現行の `ReviewCustodyAuditEvent` kind union (`attempt_execution_failed` /
  `attempt_verdict_rejected` / `attempt_outcome_conflict` / `superseded_attempt` / `cleanup_pending`) に
  **存在しない新 kind** であり、PR-1 が union へ 1 つ追加する。既存 kind の意味と optional field はそのまま使い、
  新 field を足さない (DB schema 変更なし)。
- composition は (requestDigest, attempt) に対して `attempt_completed` が **ちょうど 1 件**あり、その後に同 attempt を
  対象とする `superseded_attempt` / `attempt_outcome_conflict` が無く、`receiptFileDigest` が receipt file bytes の
  再計算 sha256 と一致することを要求する。0 件は `invocation_fact_unavailable`、2 件以上は `invocation_fact_ambiguous`
  (最後勝ちで黙って解決しない)、supersede 済みは `evidence_superseded`、receipt file 不在は `receipt_unavailable`、
  digest 不一致は `receipt_mutated`。retry で attempt N+1 が成功した履歴では attempt N を compose できない
  (N の event は receipt を持たない)。
- `attempt_completed` より前に実行された attempt (event の無い履歴) は composition できない。receipt から
  遡って fact を捏造する経路を持たない。

### 3.3 envelope 生成と producer 呼出

- composition は `<evidenceRoot>/<requestDigest>/attempts/attempt-N/evidence.json` に
  `d3b-provider-evidence-envelope/v1` を **一度書き** (`wx`、既存があれば bytes 一致のときだけ再利用、不一致は
  `evidence_conflict`) する。`evidenceRoot` は `.ut-tdd/review/evidence/` (untracked、`PLAN-L7-493` §3.1 の
  path admission に従う)。
- producer は `FileProviderJudgmentEvidenceAdapter({ evidenceRoot, judgmentsRoot: ".ut-tdd/review/judgments",
  verifiedInvocation: { provider, model } })` で呼び、`verifiedInvocation` は §3.2 の event 値だけを渡す。
- producer が返した `judgmentDigest` の artifact を **再読込**し、bytes の sha256 と file 名、payload の
  identity (request / attempt / head / families / nonce) が composition の導出値と一致することを検証する。
  不一致は artifact を残さず `artifact_verification_failed`。成功時の戻り値は
  `{ judgmentDigest, providerEvidenceRef: "d3b:<digest>", artifactPath, replay }`。
- producer の typed failure (`evidence_unavailable` / `evidence_superseded` / `provider_failure` /
  `identity_mismatch` / `same_family_reviewer` / `judgment_schema_invalid` / `judgment_write_failed` /
  `judgment_conflict`) はそのまま返し、別 reason へ丸めない。

### 3.4 runner の入力 (PR-2)

- `review-custody-runner.ts` は `UT_TDD_CUSTODY_JUDGMENT_DIGEST` / `UT_TDD_CUSTODY_PROVIDER_EVIDENCE_REF` を
  **受理しない**: どちらかが存在すれば `operator_supplied_judgment_forbidden` で exit 非 0 (silent fallback で
  旧経路を残さない)。
- runner は `UT_TDD_CUSTODY_JUDGMENT_ARTIFACT` (workflow input として渡される artifact bytes の path) を読み、
  sha256 を再計算して `judgmentDigest` とし、`providerEvidenceRef = d3b:<judgmentDigest>` を自ら組み立てる。
  artifact payload の `repository` / `pr_number` / `head_sha` / `request_digest` / `attempt` が runner が観測する
  PR facts と request identity に一致しなければ `judgment_identity_mismatch` (bytes を別 PR へ転用する replay を
  塞ぐ)。`schema_version` / `kind` / verdict と `blocking_findings` の整合も producer と同じ規則で検証する。
- receipt draft の `judgmentDigest` / `providerEvidenceRef` はこの再計算値だけから埋める。`review-custody.ts` の
  strict decoder (`d3b:` + lower-hex 64) と receipt schema は変更しない。

## 4. fail-close と write-zero

すべての deny で evidence envelope / judgment artifact / attestation draft / seal の write は 0 とする
(既に書いた envelope は bytes 一致の再利用に限り残す)。reason は §3 の typed 値に固定し、`unknown` /
文字列 message へ丸めない。composition と runner は session / provider 名に紐付く状態 file を作らない。

## 5. 運用手順

1. 非著者 review が canonical delegation で完了し receipt が出る (`PLAN-L7-493` / `L7-503` の既存経路)。
   `attempt_completed` event はこのとき自動で残る。
2. 同じ checkout で `composeProviderJudgment({ requestDigest, attempt })` を実行し (PR-2 の CLI
   `ut-tdd review compose-judgment --request-digest <d> --attempt <n>`、出力は artifact path と ref のみ)、
   artifact bytes を #541 post-merge custody workflow の input として渡す。
3. runner は bytes から digest / ref を再計算して custody receipt draft を作る (§3.4)。seal の実行は #541 の
   守備範囲であり、本 PLAN は draft 入力の導出までを閉じる。

## 6. 順序契約と PR 分割

| PR | 論点 | 前提 |
| --- | --- | --- |
| PR-0 (本 PR) | 本 PLAN + `PLAN-REVERSE-534` + pair test-design の pair-freeze (docs のみ) | なし |
| PR-1 | `src/feedback/provider-judgment-composition.ts` 1 module + audit kind union への `attempt_completed` 追加 + `projectReviewVerdict` 成功経路の temp → append → rename 順序化 + `beginReviewAttempt` の非終端規則 + テスト。CANDIDATE-U-D3BCOMP-001..010 と 015..020 の Red→Green | PR-0 の非著者 PASS receipt、PR #569 の main 到達 |
| PR-2 | runner の operator env 拒否 + artifact bytes 再計算 + CLI `review compose-judgment` の最小配線 + テスト。CANDIDATE-U-D3BCOMP-011..014 | PR-1 merge |

PR-1 と PR-2 を 1 PR に統合しない。#541 seal、#540 cutover writer、#487 Bun 削除、primary `harness.db` への
直接書込は本 PLAN のどの PR にも含めない。

## 7. TDD / trace / Reverse

pair artifact `docs/test-design/harness/L7-d3b-provider-evidence-composition-test-design.md` が
`CANDIDATE-U-D3BCOMP-001..020` を所有する (001..010 と 015..020 は PR-1、011..014 は PR-2)。実装 PR で Red→Green を観測した
行だけを同番号の `U-D3BCOMP-*` へ 1:1 昇格し、共有 `L7-unit-test-design.md` へ登録する。`CANDIDATE-D3B-*`
(PLAN-L7-562)、`U-REVIEW-*`、`U-CUSTODY-*` を再採番・再所有しない。Reverse は `PLAN-REVERSE-534` (R0) が対になる。

## 8. 非 Scope

- `PLAN-L7-562` の D3b payload / JCS canonicalization / artifact 配置の変更。
- `PLAN-L7-465` §D3c の provider-family authority 政策 (`unverified_family` 終端) の変更。artifact bytes が本物の
  provider invocation 由来であることの外部証明は #541 seal / D3d の守備範囲であり、本 PLAN は「operator 文字列を
  導出値へ置換する」までを閉じる。
- #541 seal の実装、#540 cutover writer、#487 Bun 削除、primary `.ut-tdd/harness.db` 直接書込。
- PR #557 の実 fixture 生成 (generic 経路の Green 後、#541 側の運用記録)。

## 9. 完了条件

1. composition が request / receipt / `attempt_completed` からだけ入力を導出し、caller 供給の digest / ref /
   provider / model / family を受理しない (`-001` / `-002` / `-003`)。
2. invocation fact の欠落・重複・supersede と receipt digest 不一致が typed deny で write 0 (`-004` / `-005` / `-006`)。
   event → receipt の順序が保証され、append 失敗・rename 失敗のどちらも valid review を receipt-without-fact に
   取り残さず retry 可能で、receipt file 改変が `receipt_mutated` で deny される (`-015` / `-016` / `-017` / `-018`)。
   orphan receipt は一致 event の有無で判定され、次 attempt が上書きなしで冪等完了または typed conflict になる (`-020`)。
3. evidence document が receipt 由来で、重複 finding・identity 不一致を deny する (`-007` / `-008`)。
4. artifact の再読込検証と producer failure の透過 (`-009` / `-010`)。
5. runner が operator env を拒否し、bytes から digest / ref を再計算し、別 PR への転用を `judgment_identity_mismatch`
   で止める (`-011` / `-012` / `-013`)。CLI が artifact path と ref 以外を出力しない (`-014`)。
6. Linux / Windows / aggregate required CI Green、exact-head の非著者 closing receipt blocking 0 を PR-1 / PR-2 各々に
   束縛する。#570 は PR-2 merge で close、#541 は open のまま維持する。

## 10. 実装開始条件

1. 本 PLAN の pair-freeze が非著者 (Codex 族) の PASS receipt を得て main 到達していること。
2. PR #569 が main 到達し、`produceProviderJudgment` / `FileProviderJudgmentEvidenceAdapter` の export が §1 の
   実測と一致していること (差分があれば本 PLAN を改訂してから着工)。
3. 実装は PR-1 の 1 module + §3.2 の custody 側 bounded 変更 (順序化・非終端規則) に閉じること。方式変更が必要になったら PR を close して契約改訂へ戻る。
