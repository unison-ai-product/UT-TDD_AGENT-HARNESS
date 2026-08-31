---
plan_id: PLAN-REVERSE-517-review-author-provenance-backfill
title: "PLAN-REVERSE-517: review author provenance backfill (Git facts only)"
kind: reverse
layer: cross
drive: fullstack
route_signal: design_gap
route_mode: reverse
status: draft
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-08-27
updated: 2026-08-31
owner: PO / TL
github_issue_id: 437
parent_design: docs/plans/PLAN-L7-517-review-author-provenance.md
pair_artifact: docs/test-design/harness/L7-review-author-provenance-test-design.md
agent_slots:
  - role: qa
    slot_label: "QA - Git facts 欠落・衝突・差し替えと claim の authority 昇格を独立変異で再検証する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-517-review-author-provenance-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-517-review-author-provenance.md
  requires: []
  blocks: []
  references:
    - docs/test-design/harness/L7-review-author-provenance-test-design.md
review_evidence: []
---

# PLAN-REVERSE-517

## R0 — pair-freeze boundary

Forward と test-design の canonical boundary は、同じ repository の Git object から再取得できる
authorship facts だけである。provider family、model、worker/dispatch、issuer、MAC/HMAC、human actor の
認証は trust authority ではない。これらを記録する場合は `unverified_family` または claim とし、
`human_attested` も申告事実に限る。

次の保証を実装 R1 以降で独立変異する。欠落、object mismatch、repository replay、facts conflict、
canonical digest mutation、receipt 後の snapshot 差し替えは `unknown`/typed deny とする。旧 digest は
保存するが旧 schema を照合免除にしない。全 candidate の番号と oracle は paired test-design と一致する。

## R2 — candidate/oracle contract

| Candidate | Oracle |
|---|---|
| 001 | Git object facts が再取得結果と一致すれば integrity を受理。reviewer との非同一性は証明しない |
| 002–003 | family claim を反転しても Git facts の判定は変わらない。claim 不一致だけで authority を得ない |
| 004 | facts conflict/欠落を family/provider claim より先に `unknown`/deny |
| 005 | attempt deny 後も merge gate が独立再照合して deny |
| 006 | request/receipt/merge が同一 verified Git snapshot なら `merge_ready` |
| 007 | facts 欠落で mint は成功するが typed `unknown` を記録 |
| 008–009 | unknown attempt/merge は deny、申告 fallback なし |
| 010 | human backfill は `human_attested` claim を追記するだけ。facts unknown の attempt は deny |
| 011 | record write failure は成功扱いせず unknown |
| 012 | 複数の Git-recorded author facts は exact multi-author facts として保持し family に丸めない |
| 013 | mixed family claim の追加は Git facts の判定を変えない |
| 014 | commit 群の一部 facts 欠落は unknown/deny |
| 015 | 旧 schema の digest は保存し再計算しない |
| 016 | 旧 request も verified facts なら close 可、digest は不変 |
| 017 | 新 schema digest は version/facts を含み旧 digest と一致しない |
| 018 | 既存 receipt の digest 対応を壊さない |
| 019 | worker の writer/family claim は認証根にならない。結果は Git facts のみで決まり、欠落なら deny |
| 020 | dispatch identity 欠落は facts の authority を補完しない。verified facts のみ受理根拠 |
| 021 | 開始/完了 family claim の不一致は authority を変えない。facts mismatch なら unknown |
| 022–023 | worker/dispatch の backfill actor claim は監査記録のみ。human/verified へ昇格しない |
| 024–026 | provider/model mismatch、未知名、alias は `unverified_family` のまま。facts 判定を変えない |
| 027 | human/manual は human claim としてのみ保存し、provider family へ丸めない |
| 028 | 親 dispatch claim 欠落は Git facts を補完しない |
| 029 | 複数 worker claim は family の根拠にならず、exact Git facts を保持 |
| 030 | 同一 repo/commit の facts conflict は先勝ちにせず保持し deny |
| 031 | repository identity が違う OID replay は typed deny |
| 032 | overwrite/delete は deny。訂正は append + supersede のみ |
| 033 | issuer/attestation claim の欠落・変更は authority を作らない。Git facts が唯一の判定根 |
| 034 | receipt 後の snapshot 差し替えは merge gate が typed deny |
| 035 | 同一 snapshot の正常系は `merge_ready` |
| 036 | 旧 schema でも facts 照合なしの close は deny |
| 037 | facts unknown は `unknown_provenance_unresolved` の live/merge-blocking のまま |
| 038 | 旧 digest を再計算せず、verified facts なら close 可 |
| 039 | 旧 `authorFamily` claim だけで grandfather/deny を決めず、exact facts 規則を適用 |
| 040–041 | reviewer claim と Git-recorded author 文字列の一致/不一致だけで self-review/non-author を決めず、既存 review gate を変えない |
| 042 | contributor facts の一部 unknown は deny |
| 043 | human family claim だけでは contributor identity を作れず unknown/deny |
| 044 | reviewer claim が Git-recorded author 文字列と異なっても non-author authority を付与しない |
| 045 | family 多数派への丸め込み経路を持たない |
| 046 | single-commit の複数 family claim は conflict/claim として保持し、facts を変更しない |
| 047 | receipt 発行後の backfill/snapshot mutation は deny |
| 048 | worker 子からの human claim も認証されず、facts unknown のまま deny |
| 049 | human backfill の append は成功し `human_attested` を伝播するが、facts unknown の attempt/merge は deny |
| 050 | runtime env/key custody は trust root でなく、観測して authority を付与しない |
| 051 | human family claim と reviewer family claim の一致は self-review 根拠にならず、既存 review gate を変えない |
| 052 | `human_attested` を `verified` として伝播したら Red |
| P-001 | 実 repo で author 文字列から family を導出せず、canonical Git fields を記録 |
| P-002 | PR #430 型の誤 family claim は authority にならず、Git-recorded facts だけで self-review/non-author を決めない |
| P-003 | wrapper 内外の provider claim は無視し、Git facts verified/unknown をそのまま適用 |

Candidate ID inventory (Forward/test-design と同一):

CANDIDATE-U-AUTHPROV-001 CANDIDATE-U-AUTHPROV-002 CANDIDATE-U-AUTHPROV-003 CANDIDATE-U-AUTHPROV-004 CANDIDATE-U-AUTHPROV-005 CANDIDATE-U-AUTHPROV-006 CANDIDATE-U-AUTHPROV-007 CANDIDATE-U-AUTHPROV-008 CANDIDATE-U-AUTHPROV-009 CANDIDATE-U-AUTHPROV-010 CANDIDATE-U-AUTHPROV-011 CANDIDATE-U-AUTHPROV-012 CANDIDATE-U-AUTHPROV-013 CANDIDATE-U-AUTHPROV-014 CANDIDATE-U-AUTHPROV-015 CANDIDATE-U-AUTHPROV-016 CANDIDATE-U-AUTHPROV-017 CANDIDATE-U-AUTHPROV-018 CANDIDATE-U-AUTHPROV-019 CANDIDATE-U-AUTHPROV-020 CANDIDATE-U-AUTHPROV-021 CANDIDATE-U-AUTHPROV-022 CANDIDATE-U-AUTHPROV-023 CANDIDATE-U-AUTHPROV-024 CANDIDATE-U-AUTHPROV-025 CANDIDATE-U-AUTHPROV-026 CANDIDATE-U-AUTHPROV-027 CANDIDATE-U-AUTHPROV-028 CANDIDATE-U-AUTHPROV-029 CANDIDATE-U-AUTHPROV-030 CANDIDATE-U-AUTHPROV-031 CANDIDATE-U-AUTHPROV-032 CANDIDATE-U-AUTHPROV-033 CANDIDATE-U-AUTHPROV-034 CANDIDATE-U-AUTHPROV-035 CANDIDATE-U-AUTHPROV-036 CANDIDATE-U-AUTHPROV-037 CANDIDATE-U-AUTHPROV-038 CANDIDATE-U-AUTHPROV-039 CANDIDATE-U-AUTHPROV-040 CANDIDATE-U-AUTHPROV-041 CANDIDATE-U-AUTHPROV-042 CANDIDATE-U-AUTHPROV-043 CANDIDATE-U-AUTHPROV-044 CANDIDATE-U-AUTHPROV-045 CANDIDATE-U-AUTHPROV-046 CANDIDATE-U-AUTHPROV-047 CANDIDATE-U-AUTHPROV-048 CANDIDATE-U-AUTHPROV-049 CANDIDATE-U-AUTHPROV-050 CANDIDATE-U-AUTHPROV-051 CANDIDATE-U-AUTHPROV-052

実 repo regression: `CANDIDATE-P-AUTHPROV-001`、`CANDIDATE-P-AUTHPROV-002`、
`CANDIDATE-P-AUTHPROV-003`。

## R3 — verification boundary

R3 は同一 exact HEAD の Forward、Reverse、test-design を読み、上表の各 ID の刺激と oracle が一致する
ことを確認する。canonical record は固定 field 順・UTF-8・明示的 null/array 規則で直列化し、digest 自身を
入力に戻さない。Git blob の custody は対象 commit/tree の object と canonical record blob を
`git cat-file`/hash 相当で再取得して比較することに限定し、作業 tree、provider、秘密、issuer の宣言を
根拠にしない。record blob の OID は payload から除外して自己参照を避ける。

R3 の fail 条件は、claim の verified 昇格、unknown の申告 fallback、old schema の grandfather、
cross-repo replay、overwrite/delete、receipt 後の snapshot mutation、または3文書間の ID/oracle drift である。

## R4 — backprop boundary

R1/R2/R3 の実装 Green はこの docs-only freeze の完了を意味しない。実装 PR は別途、Git facts loader、
append-only custody、受理点/merge gate の独立照合、legacy migration、typed unknown を変更範囲に明示する。
provider-family authority、HMAC/MAC custody、dispatch issuer、human actor authentication、Node generation、
Bun deletion、CI/consumer changes は本 reverse の対象外である。
