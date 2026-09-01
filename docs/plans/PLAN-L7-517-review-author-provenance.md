---
plan_id: PLAN-L7-517-review-author-provenance
title: "PLAN-L7-517 (add-impl): review request の Git authorship facts を記録する"
kind: add-impl
layer: L7
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-27
updated: 2026-08-31
owner: PO / TL
github_issue_id: 437
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
pair_artifact: docs/test-design/harness/L7-review-author-provenance-test-design.md
backprop_decision: required
backprop_decision_reason: "Git object facts の照合と、申告値を authority にしない境界を Forward/Reverse で同じ candidate に固定する。"
agent_slots:
  - role: se
    slot_label: "SE - Git authorship facts の記録と受理時照合を実装する"
  - role: qa
    slot_label: "QA - 欠落・衝突・差し替え・申告値の authority 昇格を独立変異で検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-517-review-author-provenance.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-review-author-provenance-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
    - src/feedback/review-verdict-custody.ts
    - src/feedback/review-attestation.ts
    - src/feedback/review-merge-gate.ts
    - src/cli/delegation.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/437
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/439
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/421
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/429
supersedes:
  - PLAN-L7-465-cross-review-author-binding
review_evidence: []
---

# PLAN-L7-517: review request の Git authorship facts を記録する

## 1. Outcome

authoring provenance は、対象 repository の Git object から機械的に再確認できる事実だけを記録する。
対象は repository identity、commit OID、parent/tree、author/committer identity・timestamp、Git が検証した
署名事実（存在時）である。provider、model、worker、dispatch、`authorFamily`、human claim は Git facts では
ないため、保存しても `unverified_family`/claim として監査に残すだけで authority に昇格させない。facts が
取得不能・不一致・衝突した対象は typed `unknown` として受理点と merge gate を fail-close する。

## 2. 起点の実測 (2026-08-27、origin/main 6b5b1d9c)

| 観測 | 実測値 | 含意 |
|---|---|---|
| git author 名が provider family を示す割合 | 0% (166/166 が `unison-ai-product`) | author 文字列から family を導出しない |
| `Co-Authored-By` trailer | 24.7% (41/166) | 自由記載 claim であり authority ではない |
| commit sha と provider を結ぶ harness.db 列 | 存在しない | runtime/model 時刻から authorship を推定しない |
| authoring attestation | 存在しない | review attestation を authoring root に遡及しない |

従って provider-family、HMAC/MAC、dispatch issuer、worker custody、human actor authentication を trust
authority として凍結しない。残す層は Git facts と未検証 claim の二層だけである。

## 3. 設計判断

### 3.1 受理時照合

`beginReviewAttempt` と merge gate が同じ repository から Git object を再取得して比較する。生成時の宣言、
working tree、provider/model、dispatch log、時刻近接から authorship を推定しない。object を再取得できない
場合は `unknown` とする。

### 3.2 trust boundary — Git facts と Git blob custody

record の canonical fields は `repository_identity`、`commit_oid`、`parent_oids`、`tree_oid`、`author`、
`committer`、各 timestamp、`signature_verification`（存在時）、schema version である。受理時に同じ object
から再計算し、全 field 一致した場合だけ `git_facts_verified` とする。canonical serialization は固定 field
順、UTF-8、明示的な null/array 規則とし、digest 自身を入力に戻さない。

Git blob custody は対象 commit/tree と canonical record payload を Git object API (`git cat-file`/
`git hash-object` 相当) で再取得・比較することに限定する。blob OID は payload から除外して自己参照を
防ぎ、working tree、外部 issuer、秘密、実行環境を custody root にしない。

- provider family、model、worker、dispatch、`authorFamily`、writer/issuer/actor は optional observation。
  値は常に `unverified_family`/claim として保存し、review authority、self-review、merge_ready の根拠にしない。
- 鍵、secret、HMAC/MAC、capability、dispatch issuer、同一OSユーザーの分離を trust root としない。
- 同一 repository・commit の Git facts が異なる record は `conflict` として保持し、先勝ちにしない。
  family claim の不一致だけでは winner を選ばず、どちらも authority ではない。

### 3.2.1 provider/model/family の非権威化

alias table、dispatch 開始宣言、subagent 親継承、commit author 文字列、trailer は Git facts ではない。
値は `unverified_family` のままとし、unknown/mixed 解消、reviewer 適格性、merge authority に使わない。
claim mismatch は監査できるが、Git facts が verified になったことを意味しない。

### 3.2.2 human backfill の境界

backfill は `actor_kind=human`、申告 identity、`provenance_grade=human_attested` を append-only ledger に
残すだけである。人間の認証、commit author との非同一性、provider family、review authority を検証したとは
記録しない。`human_attested` は `verified` へ昇格せず、facts unknown の attempt/merge を許可しない。
worker/dispatch の actor claim を human の証拠へ置換せず、claim mutation で authority を変えない。

### 3.3 typed unknown と mutation

record 欠落、repository identity 不一致、object 不在、field/signature mismatch、collision、snapshot 差し替え
は typed `unknown`/`conflict` とする。mint は許しても unknown の attempt/close/merge_ready は許さず、申告
family、human_attested、旧 schema を fallback にしない。record は append-only、訂正は append + supersede とし、
cross-repo replay、overwrite/delete、receipt 発行後の snapshot mutation を deny する。

request/receipt/merge は同一 schema version、commit-set、Git facts snapshot、canonical digest に束縛する。
receipt 後に snapshot が変われば merge gate は typed deny。provider/family/actor claim mutation は authority の
昇格や deny 回避を生まない。

### 3.4 identity digest と legacy

既存 `reviewIdentityDigest` は旧 schema の入力規則を保存し、旧 digest を再計算・書換えしない。新 schema の
canonical digest は Git facts snapshot と version を含む。旧 request も facts 照合を免除されず、照合不能なら
`unknown_provenance_unresolved` の non-terminal/live/merge-blocking とする。旧 `authorFamily` は互換入力でも
trust root ではない。

### 3.5 contributor facts と双方向性

contributor facts は provider family ではなく、対象 commit 群の Git object に記録された
author/committer 文字列と timestamp である。これらは object との一致を検証できるが、人物・provider・
family の認証を意味しない。一部 unknown、facts conflict、複数 claim は多数派・先勝ち・trailer で
丸めず deny し、`unverified_family` を contributor set に入れない。codex/claude/human claim を追加・
削除しても Git facts 判定や authority は変わらない。Git author 文字列と reviewer claim の一致・不一致だけで
self-review も non-author も判定せず、その authority は既存の独立 review admission/gate に留める。

### 3.6 PLAN-L7-465 の supersede 範囲

本 PLAN が supersede するのは `PLAN-L7-465-cross-review-author-binding` (status: confirmed) の
**§実装スコープ 2「author 導出元の確定」1 規定のみ**である。465 の family 依存規定を広く撤回する
ものではない。

| 465 の規定 | 本 PLAN による置換 |
|---|---|
| §実装スコープ 2「**author 導出元の確定**: 実装では **commit author / `Co-Authored-By` trailer** を一次の author 導出元とし、自己申告のみに依存しない」 | §3.2.1 / §3.5 — commit author 文字列と `Co-Authored-By` trailer は **Git object に記録された事実**であって認証された identity ではない。provider family の導出元にしない |

**撤回の根拠 (2 つ)**:

1. **測定**: 465 起点の実測 (§2 に再掲) で、git author 名が provider family を示す割合は
   **0% (166/166 が `unison-ai-product`)**、`Co-Authored-By` trailer は 24.7% (41/166) の自由記載
   claim であり、commit sha と provider を結ぶ harness.db 列は存在しない。
2. **実装が既にこの規定に従っていない**: `src/feedback/review-attestation.ts` の
   `resolveReviewAuthorFamily` は `explicit` (`--review-author-family` フラグ) と
   `currentRuntime` (委譲を実行している runtime) だけを入力とし、**commit author も trailer も
   参照しない**。同関数の doc は「著者族は provider から独立した事実、すなわち委譲を実行している
   runtime から取る。判別できない場合は `null` を返し、呼び出し側で fail-close させる (推測しない)」
   と述べる。465 §実装スコープ 2 は**文書に残ったまま実装されなかった規定**であり、本 PLAN は
   その乖離を正す。

### 3.6.1 supersede **しない**範囲 (誤って撤回しないための明示)

以下は 465 の記述のまま**有効である**。いずれも `authorFamily` に依存するが、その `authorFamily`
は Git 文字列由来ではないため、本 PLAN の撤回対象ではない。

| 465 の規定 | 存続する理由 |
|---|---|
| §機械化する不変条件 1「同一 family の自己承認を verdict として受理しない (`same_family_reviewer`)」 | 本 PLAN §3.5 が「その authority は**既存の独立 review admission / gate に留める**」と述べており、撤回ではなく温存である。attacker/defender 分離の PO 原則も撤回されていない。実装 (`review-verdict-custody.ts` / `review-attestation.ts` の `same_family_reviewer_denied`) は `resolveReviewAuthorFamily` 由来の値で判定しており Git 文字列非依存 |
| D1 dispatch の反対族 routing (同族 fallback 禁止、未知 family / 反対族 runtime 不在は delegation 0 / receipt 0) | 入力は request の `authorFamily` であり Git 文字列非依存 |
| consumer の反対族 provider 起動と `U-RVATT-024` | 同上 |
| `provider-family-authority.ts` port と `unverified_family` 終端 | 465 §D3c が「commit trailer・自己申告・PR marker を family authority として受理してはならない」と既に freeze しており、**本 PLAN と同じ立場**である。受理側実装は authentication / authorization を変える外部権限設計として **PO の明示承認**を要し、本 PLAN では触れない |
| exact HEAD 限定、session log 再利用、未応答 SLA、`stale_head` 終端 | family 導出に依存しない |

### 3.6.2 実装との関係

本 PLAN の撤回は**既存 gate の撤去を要求しない**。`same_family_reviewer_denied` を返す
`review-verdict-custody.ts` / `review-attestation.ts`、および `review-evidence.ts` の
`checkCrossAgentModelPair` (PLAN の `review_evidence` に**宣言された** worker/reviewer model を
検査するもので Git trailer とは無関係) は、いずれも本 PLAN と矛盾せず、そのまま有効である。

本 PLAN が導入するのは authoring provenance の**記録**であって、family gating の廃止ではない
(`PLAN-L7-518` §3.6 が本 PLAN を「導入する authoring provenance を前提とする」「信頼根が着地する
まで」と依存宣言しているのと同じ理解である)。

## 4. Fail-close contract

| 境界 | 正常条件 | 変異時の oracle |
|---|---|---|
| Git facts | 同一 repository の object 再取得結果が全 field 一致 | 欠落・不一致は `unknown`/typed deny |
| blob/digest | canonical bytes と OID/digest が一致、digest は非自己参照 | blob mutation、digest mutation、snapshot 差し替えは deny |
| family/model/actor | claim は `unverified_family`/`human_attested` として保存 | verified/authority に昇格したら Red |
| collision/replay | repository identity と commit-set snapshot が一致 | conflict、cross-repo replay、overwrite/delete は deny |
| legacy | 旧 digest は保存、facts 照合は必須 | grandfather、申告 fallback、unknown close は deny |

## 5. Implementation slices (将来の実装 PR)

1. Git object facts schema、canonical serialization、非自己参照 digest、repository/blob 再取得。
2. append-only record ledger と conflict/supersede、cross-repo replay、overwrite/delete 検出。
3. `beginReviewAttempt` と merge gate の独立再照合、snapshot/receipt binding、typed unknown。
4. 旧 schema digest 保存と facts 照合必須化、`unknown_provenance_unresolved` の non-terminal 化。
5. `unverified_family`/`human_attested` の監査保存と verified 昇格禁止。
6. `CANDIDATE-U-AUTHPROV-001..052` と `CANDIDATE-P-AUTHPROV-001..003` を同じ oracle で検証する。

provider-family authority、HMAC/MAC custody、dispatch issuer、human actor authentication、Node generation/runtime
verifier、Bun deletion、CI/consumer changes は本 plan の実装 slice に含めない。

## 6. Scope boundary

本 pair-freeze は設計契約と candidate/oracle の整合だけを確定する。実装 Green、Reverse R4、Issue #437 完了、
過去 receipt の無効化を意味しない。PR #442 の author remediation はこの docs-only rescope 後の別実装 PR で扱う。

## 6.1 Candidate ID inventory

Forward/Reverse/test-design が共有する全 U oracle は次のとおりである:

CANDIDATE-U-AUTHPROV-001 CANDIDATE-U-AUTHPROV-002 CANDIDATE-U-AUTHPROV-003 CANDIDATE-U-AUTHPROV-004 CANDIDATE-U-AUTHPROV-005 CANDIDATE-U-AUTHPROV-006 CANDIDATE-U-AUTHPROV-007 CANDIDATE-U-AUTHPROV-008 CANDIDATE-U-AUTHPROV-009 CANDIDATE-U-AUTHPROV-010 CANDIDATE-U-AUTHPROV-011 CANDIDATE-U-AUTHPROV-012 CANDIDATE-U-AUTHPROV-013 CANDIDATE-U-AUTHPROV-014 CANDIDATE-U-AUTHPROV-015 CANDIDATE-U-AUTHPROV-016 CANDIDATE-U-AUTHPROV-017 CANDIDATE-U-AUTHPROV-018 CANDIDATE-U-AUTHPROV-019 CANDIDATE-U-AUTHPROV-020 CANDIDATE-U-AUTHPROV-021 CANDIDATE-U-AUTHPROV-022 CANDIDATE-U-AUTHPROV-023 CANDIDATE-U-AUTHPROV-024 CANDIDATE-U-AUTHPROV-025 CANDIDATE-U-AUTHPROV-026 CANDIDATE-U-AUTHPROV-027 CANDIDATE-U-AUTHPROV-028 CANDIDATE-U-AUTHPROV-029 CANDIDATE-U-AUTHPROV-030 CANDIDATE-U-AUTHPROV-031 CANDIDATE-U-AUTHPROV-032 CANDIDATE-U-AUTHPROV-033 CANDIDATE-U-AUTHPROV-034 CANDIDATE-U-AUTHPROV-035 CANDIDATE-U-AUTHPROV-036 CANDIDATE-U-AUTHPROV-037 CANDIDATE-U-AUTHPROV-038 CANDIDATE-U-AUTHPROV-039 CANDIDATE-U-AUTHPROV-040 CANDIDATE-U-AUTHPROV-041 CANDIDATE-U-AUTHPROV-042 CANDIDATE-U-AUTHPROV-043 CANDIDATE-U-AUTHPROV-044 CANDIDATE-U-AUTHPROV-045 CANDIDATE-U-AUTHPROV-046 CANDIDATE-U-AUTHPROV-047 CANDIDATE-U-AUTHPROV-048 CANDIDATE-U-AUTHPROV-049 CANDIDATE-U-AUTHPROV-050 CANDIDATE-U-AUTHPROV-051 CANDIDATE-U-AUTHPROV-052

実 repo regression は `CANDIDATE-P-AUTHPROV-001`、`CANDIDATE-P-AUTHPROV-002`、
`CANDIDATE-P-AUTHPROV-003` とする。

## 7. FLAG 3 rescope decision

PR #442 FLAG 3 は MAC/key custody、provider-family authority、human actor authentication、writer/issuer の
独立性をこの環境で機械確認できないことを示した。本 plan はそれらを trust authority として撤回する。残す
機械的根拠は同じ repository の Git object/blob を再取得して比較できる authorship facts と canonical digest/snapshot
だけである。`human_attested` は申告事実の監査記録に留まり、`unverified_family` はどの段階でも authority へ
昇格しない。
