---
plan_id: PLAN-L7-627-pack-publication-admitted-publish
title: "PLAN-L7-627: admitted Pack公開の deny 境界と main CAS 結線"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-17
updated: 2026-09-17
owner: Claude control lane（契約起票、PO 判断 2026-09-16 の引き取り）・Codex Sol（非著者検収）
parent_design: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
pair_artifact: docs/test-design/harness/L7-pack-publication-admitted-publish-test-design.md
backprop_decision: required
backprop_decision_reason: admission record の seal 主体検証、approval consume 後の
  fail-close、CAS authority token の権限一軸 deny、pre-write drift の typed deny、publish
  receipt の最小 schema は PLAN-L7-565 §1.1/§3/§5 と PLAN-L6-63 に無い新しい publish
  不変条件であり、Reverse 対で上位契約へ逆向きに束縛する。
agent_slots:
  - role: se
    slot_label: Luna worker - admitted record の pure 検証、approval consume、CAS token
      mint、exact lease 1 回の main CAS、journal / receipt を publishPackCanary の
      admitted 入口として結線
  - role: qa
    slot_label: Terra - 43 guard の一軸 mutation、indeterminate 5 軸、replay (remote 再観測
      main / PR head 2 軸込み)、write-zero、consume 後 fail-close、token 非漏洩 (argv /
      stdout / journal / receipt)、post-mint 全分岐 dispose、journal 順序、receipt /
      record digest 感度の Red oracle (candidate 71)
  - role: tl
    slot_label: Codex Sol - 43 guard の契約引用・oracle 対応、#626 admitted record /
      admission ledger (genesis 込み chain、journal provenance) との整合、CAS 境界と
      write-zero の非著者検収
generates:
  - artifact_path: docs/plans/PLAN-L7-627-pack-publication-admitted-publish.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
  requires: []
  references:
    - docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
    - docs/plans/PLAN-L7-625-pack-publication-preparation.md
    - docs/plans/PLAN-L7-626-pack-publication-admission-binding.md
    - docs/test-design/harness/L7-pack-publication-admission-binding-test-design.md
    - docs/test-design/harness/L7-pack-publication-atomic-ref-cas-test-design.md
    - docs/plans/PLAN-REVERSE-627-pack-publication-admitted-publish-backfill.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/624
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/627
review_evidence: []
status: draft
github_issue_id: 627
admission_receipt:
  schema_version: v2
  receipt_id: certificate:2e6189cdcc0900f34c426d68c321fe7d
  command_id: plan-revise:issue-627:pr650-plan:r3:5270a2006cb5
  admitted_at: 2026-09-17T05:47:25.811Z
  source_digest: sha256:056171d1ed255c76f14b0263924a080c2097e5b9ffca7b021cfa83ca94a47d42
  decision_digest: sha256:85d1f043917cfde2a0ad2916849c50ec006938d2efffa2486e568a0520b0804a
  receipt_digest: sha256:05a0192e57d7111b5ccbf159cfb1beacce51248f7452f3f12fa5f0252beb25e2
  binding:
    path: docs/plans/PLAN-L7-627-pack-publication-admitted-publish.md
    plan_id: PLAN-L7-627-pack-publication-admitted-publish
    asset_id: plan:e581e10769f9eedb3e562236142e503c
    revision: 3
    content_digest: sha256:056171d1ed255c76f14b0263924a080c2097e5b9ffca7b021cfa83ca94a47d42
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 627
    episode_id: E4-627-pack-publication-admitted-publish
    projection_digest: sha256:17838960b78cd60f6009c493b62726f0aec6d8e92e0f74c8f3b67a6ccb1fd4d4
  origin:
    plan_id: PLAN-L7-565-pack-publication-atomic-ref-cas
    revision: 1
    digest: sha256:efd67cb89dbf6e187fd998c062972332a868e868ee5b70993be4080a9ccb6647
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-627-pack-publication-admitted-publish
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #627 PR #650 rev 3: 非著者 Codex Sol review r2 (receipt
    c99f948d) の FLAG 4 件 (全て light in-PR) を是正 (是正 2 回目)。§2.1-3 journal
    provenance に解決先 event の存在と kind を明示 (P40 / 066–067)、§2.2-5 replay 再観測を PR
    head 軸でも固定 (P43 / 070)、§2.2-4 preparation / closing receipt digest 形状に guard
    (P41 / P42、068 / 069)、§2.1-2 chain 整合を genesis から要求 (P37 / 071)。guard
    43、candidate 71。旧 rev 2: r1 FLAG 3 件の是正 (39 guard、candidate 65)。"
---

# PLAN-L7-627: admitted Pack公開の deny 境界と main CAS 結線

## 1. 目的と境界

Issue #627 は #624 が分割した publication adapter の第三 slice であり、#626 が返す
`publication_admission` の admitted record だけを入力として、publication mutation approval の consume、
publication CAS authority token の fresh mint、admitted reviewed head の Pack main への exact lease CAS
1 回、その journal と最小 publish receipt を所有する。admitted record が無い、seal 主体を検証できない、
schema / digest / status / configuration に不一致がある、approval や authority が束縛と合わない、
pre-write 観測が seal 済み値と drift した場合は typed `deny` または `indeterminate` として停止し、
main / Release / tag / asset / channel pointer / branch / PR の remote write を 0 件に保つ。

本 PLAN が所有しないもの: #625 preparation の再実装、#626 admission validation の再実装 (admitted
record の seal 済み値を再観測・再 seal しない。PLAN-L7-626 §2.3)、main CAS 後の release FSM
(Release draft / asset / tag / visibility / canary pointer。PLAN-L7-565 §1.1 「以後の release FSM へ進む」
の後段は既存実装のまま変更しない)、canary acceptance (#418)、production ports と実 credential
(PLAN-L7-565 §7 PR-B)、CLI wiring (同 PR-C)。

fixture は pair test-design §2 の合成 immutable fixture だけであり、実 GitHub repository、実 PR、実
admission record、既存の plan-admission record を identity にしない。

## 2. 入力と束縛

### 2.1 admitted record

publish の入力は #626 が返す admitted record R ただ 1 つである。R は PLAN-L7-626 §2.3 の sealing 表の
全項目を seal 済み値として持ち、#627 はその値を唯一の identity 出所として使う。caller は expected main
OID、reviewed head OID、publication intent identity、approval nonce、authority token のいずれも供給
できず、供給された値が R の値と異なれば typed deny とする (PLAN-L7-626 G21/G41/G42 と同型)。

R の strict schema は次の 4 群だけを member とし、これ以外の member を持つ R、必須 member を欠く R は
schema 不正として deny する:

- identifiers: operation ID、idempotency key、PR number (PLAN-L7-626 §4 の record 識別子)
- sealed: repository ID / full name、target ref、ruleset ID、required context 集合、publication CAS
  authority installation ID、expected main OID、preparation receipt digest、reviewed PR number / exact head
  OID / base OID / tree digest、review 結論 / reviewer identity / closing receipt digest、required check
  結論、merge-base、publication intent identity、mutation approval binding 集合、observation bundle digest
  (PLAN-L7-626 §2.3 の全行)
- provenance: admission ledger sequence、previous record digest、admission journal event digest
  (PLAN-L7-626 §4 rev 11)
- status: `admitted` (deny / indeterminate の record は publish 入力にならない)

R の record digest は R の canonical bytes から #627 が導出する `sha256:` digest であり、caller 供給値を
受け取らない。R の observation bundle digest、publication intent identity (operation ID、repository ID、
target ref、expected main OID、reviewed head OID、preparation receipt digest の canonical digest)、
mutation approval binding (approval nonce → intent identity の canonical digest) は、R の sealed 値から
#627 が再導出して R の記載値と byte 一致することを検査する。再導出は #626 と同じ導出関数を共有し、
#627 が別の導出規則を持たない。

R の seal 主体は、PLAN-L7-626 §4 (rev 11) が定める admission ledger と admission journal で検証する。
ledger の writer は #626 admission 実装だけであり (#627、caller、外部 process は append しない)、
#627 は次の 3 段で record を受理する。

1. resolve: ledger を identifiers (operation ID、idempotency key、PR number) で解決し、唯一の record の
   canonical bytes が caller 供給 R と byte 一致する。ledger に無い R、bytes が異なる R は deny。
2. chain 整合: ledger 先頭から R の sequence までの全 record について、sequence が連番であり、各 record
   の previous record digest が直前 record の canonical bytes から再計算した record digest と一致し、R の
   record digest も再計算値と一致する。chain は genesis から検証する: 観測した ledger の先頭 record は
   sequence 1 かつ previous record digest が null でなければならず、sequence 2 以降から始まる truncated
   ledger、先頭 record が非 null の previous digest を持つ ledger は deny する (PLAN-L7-626 rev 11 §4)。
   1 箇所でも不一致なら deny (ledger 外から挿入・改変された record、途中から始まる ledger を閉じる)。
3. journal provenance: R の admission journal event digest を #626 admission journal (read-only) で解決し、
   解決した event が存在し、その kind が `admission_observation` であり、その observation bundle digest が
   R の observation bundle digest と byte 一致する。event が無い R、解決できても kind が
   `admission_observation` でない event を指す R (bundle digest が一致していても)、bundle digest が異なる
   R は deny。

ledger / journal が unavailable、timeout、schema 判定不能なら indeterminate とする。署名・token・
自己申告を seal 主体の証明にしない。ledger と journal は #626 の実装が所有する durable state であり、
remote 入力や caller 入力ではない (#626 が #625 の preparation journal を G38 の出所とするのと同型)。

publish が R 以外に受け取る入力は次の 3 つだけである。

- (a) publication configuration が固定する期待値: PLAN-L7-626 §2.1 (a) と同一集合 (Pack repository ID /
  full name、target ref、ruleset ID、期待 required context 集合、publication CAS authority の App
  installation ID)。R の sealed 値はこの期待値と byte 一致 (集合は集合一致) しなければならず、caller が
  実行時に上書きできない。
- (b) port: admission ledger と admission journal (read-only)、mutation approval port (consume)、
  publication CAS authority port (mint / dispose)、read-only pre-write observer (Pack main OID、PR 現在
  head)、publication CAS port (`applyReviewedHeadWithLease`、PLAN-L7-565 §6)、durable publication
  journal、receipt store。
- (c) 固定 clock (approval 有効期限の判定に使う。実時刻を fixture へ持ち込まない)。

### 2.2 検証順序

publish は次の順序で進み、各 step の失敗は後続 step を実行しない。step 1–5 は pure (port 呼出は
ledger / journal の read-only resolve と、step 5 の remote 再観測のみ)、step 6 以降で初めて approval
consume、token mint、remote observation、remote write が順に発生する。

1. seal 主体検証: §2.1 の resolve / chain 整合 / journal provenance。
2. strict schema / status / digest: 4 群 strict schema、必須 member、`status: admitted`、record digest の
   caller 供給拒否、observation bundle digest / intent identity / approval binding の再導出一致。
3. configuration 整合: (a) の 5 scalar と required context 集合の一致。
4. 形状: expected main OID と reviewed head OID は `/^[0-9a-f]{40}$/`、preparation receipt digest と
   closing receipt digest は `/^sha256:[0-9a-f]{64}$/` (PLAN-L7-626 §2.2 の L7 形状契約を継承)。
5. publication replay / reconciliation (PLAN-L7-565 §5): publication journal に同一 (operation ID,
   idempotency key) の `mutation_intent` が既にある場合、(i) その intent identity が R と一致し、(ii) 対応する
   `read_back_observation` が完全であり、(iii) read-only pre-write observer で再観測した Pack main の現在
   OID が R の reviewed head OID (H) と、PR の現在 head が H と byte 一致する、の 3 条件が揃った場合だけ
   完全一致 replay として §2.4 の receipt を決定的に再構成する (approval consume 0、token mint 0、
   mutation 0)。intent identity が異なれば `publish_operation_replay` deny。journal は完全だが remote
   再観測が不一致なら indeterminate `publish_replay_remote_drift` (journal / receipt だけから成功を推測
   しない)。`mutation_intent` はあるが `read_back_observation` が無い / 不完全なら indeterminate とし、
   新規 mutation を行わない。remote 再観測不能は indeterminate。
6. approval consume (PLAN-L7-565 §1.1、PLAN-L7-626 §2.3「approval の consume は #627」): R の approval
   binding 集合は 1 件以上であり、各 approval nonce を approval port で consume する。port が返す束縛先
   (intent identity) が R の intent identity と一致し、未消費であり、固定 clock 時点で有効期限内であり、
   preparation nonce 集合に属さない場合だけ受理する。各 consume 直後に `planned_nonce_consumed` を
   journal へ append し、append 失敗は indeterminate、mutation 0 とする。approval consume は
   `PublicationRun.authorize()` を経由し、別 module へ抽出しない (PLAN-L7-565 §1.1/§6)。
7. CAS authority token mint (PLAN-L7-565 §3): 全 approval の consume 後にだけ、R の installation ID で
   publication CAS authority token を fresh mint する。mint 結果の installation ID が R と一致し、
   permission が Contents write だけである (Pull requests write、Workflows write、Administration write、
   Issues、Actions、Secrets を持たない) 場合だけ受理する。token の bytes は argv (子 process の引数)、
   publication journal、receipt、stdout、stderr / error、result のいずれにも出さず、credential helper または
   stdin 専用 port で CAS port へ渡す。mint 後は、step 8–12 のどの deny / indeterminate 分岐で停止しても、
   また CAS 成功時も、停止直後に必ず dispose する (dispose は mint 1 回につき 1 回)。
8. pre-write observation (read-only): Pack main の現在 OID が R の expected main OID と、PR の現在 head OID
   が R の reviewed head OID と byte 一致する。不一致は typed deny、観測不能は indeterminate で、いずれも
   remote write 0。
9. `mutation_intent` append: detail は intent identity、expected main OID、reviewed head OID の digest
   束縛。append 失敗は indeterminate、remote write 0。
10. exact lease CAS: `applyReviewedHeadWithLease` へ R の repository / target ref / expected main OID (E) /
    reviewed head OID (H) だけを渡す (caller 値を混ぜない)。`--porcelain` を必須とし、当該 target ref の
    実更新 status が 1 件だけ報告された場合に限って成功とする。`=` / `[up to date]`、status 行欠落・複数・
    parse 不能、reject、response loss は post-read が H でも成功に丸めず indeterminate
    `cas_not_applied_by_operation` とし、remote write count は試行 1 を記録して後続 write 0 とする
    (PLAN-L7-565 §5)。
11. `read_back_observation`: post-read の main OID が H と一致することを観測し、actual-update status、E、
    H、post-read OID をまとめて digest 束縛して append する。post-read 不一致は indeterminate。
12. receipt: §2.4 の最小 publish receipt を canonical bytes で atomic no-clobber publish する。

step 6 以降で deny / indeterminate になった場合、消費済み nonce は戻さない (fail-close)。再実行には新しい
mutation approval が必要であり、同じ nonce の再提示は step 6 の `publish_approval_consumed` deny になる。
mint 済み token は結果に関わらず dispose する。

### 2.3 write-zero 境界

- step 1–9 のいずれで停止しても、main / Release / tag / asset / channel pointer / branch / PR の remote
  write は 0、token mint は step 7 前なら 0、approval consume は step 6 前なら 0 である。
- step 10 以降で停止した場合の remote write count は試行 1 であり、Release / tag / asset / pointer /
  branch / PR の write は 0 である。
- 本 PLAN の実装は Release / tag / asset / pointer / branch / PR の port を呼び出さず、spy ledger で
  write 0 を直接検査できる形にする。

### 2.4 最小 publish receipt

receipt の member は次だけとする: kind (`pack-publication-admitted-publish-receipt-v1`)、operation ID、
idempotency key、admission record digest、publication intent identity、expected main OID、reviewed head
OID、post-read main OID、actual-update status、consumed approval nonce 集合、journal chain digest。
receipt digest は canonical bytes から導出し、member として持たない。token、credential、caller 入力、
自己申告を含めない。

persist は PLAN-L7-565 §5 に従う: 同一 directory の unique temp へ一度書き、fsync、atomic no-clobber
publish、directory fsync。既存 receipt が同一 bytes なら replay、異なる bytes または schema / digest 不正
なら上書きせず `publish_receipt_conflict`。persist 失敗は indeterminate であり、CAS 成功を receipt の
有無で覆さない (受領は journal と remote 再観測から再構成する)。

## 3. guard の正本

§2 の predicate を各々独立した一軸 deny / indeterminate oracle として固定する。1 行の mutant は fixture
の 1 要素だけを変える。各行は契約引用、一軸 mutant、赤化テスト (pair test-design の candidate)、typed
reason、冗長判定を持つ。remote write 境界は P32/P33/P34-044 (CAS 試行後) を除き全行 0 である。

| guard | 契約引用 | 契約 predicate | 一軸 mutant | 赤化テスト | reason | 冗長判定 |
| --- | --- | --- | --- | --- | --- | --- |
| P01 | Issue #627、本 §2.1 | admitted record が供給されている | R を `undefined` | `CANDIDATE-PACKPUB-PUB-001` | `publish_admission_required` | 独立: P02 は ledger 側の不在、P01 は入力の不在。ledger call 0 |
| P02 | 626 §4 rev 11、本 §2.1-1 | ledger が identifiers で record を解決できる | ledger から当該 record を除いた ledger を観測させる | `CANDIDATE-PACKPUB-PUB-002` | `publish_admission_unknown` | 独立: 供給 R が整合していても ledger 不在なら偽造扱い |
| P03 | 本 §2.1-1 | ledger record の bytes = 供給 R の bytes | ledger record の merge-base だけを別値 (chain は再計算して整合) | `CANDIDATE-PACKPUB-PUB-003` | `publish_admission_ledger_mismatch` | 独立: P08 は R 内部の digest 整合、P03 は ledger との一致 |
| P04 | 本 §2.1 strict schema | R の member が 4 群だけ | R に余剰 member `token` を追加 | `CANDIDATE-PACKPUB-PUB-004` | `publish_admission_invalid` | 独立: P05 は欠落、P04 は混入 |
| P05 | 本 §2.1 strict schema | R が必須 member を全て持つ | R から operation ID を欠落 | `CANDIDATE-PACKPUB-PUB-005` | `publish_admission_invalid` | 独立: 欠落は ledger resolve 前に閉じる |
| P06 | 本 §2.1、626 §4 | R の status = `admitted` | status を `denied` | `CANDIDATE-PACKPUB-PUB-006` | `publish_admission_not_admitted` | 独立: schema が正しくても deny record は入力にならない |
| P07 | 本 §2.1 | record digest は canonical bytes から導出 (caller 供給拒否) | caller が導出値と異なる record digest を供給 | `CANDIDATE-PACKPUB-PUB-007` | `publish_admission_digest_override` | 独立: 供給しない正常系は導出値が receipt に入る |
| P08 | 626 §2.3、本 §2.1 | observation bundle digest = sealed 値からの再導出 | R と ledger の expected main OID だけを改変 (bundle digest 据え置き、chain は再計算) | `CANDIDATE-PACKPUB-PUB-008` | `publish_admission_bundle_mismatch` | 独立: P03 / P37 を通す (ledger も同じ改変) 経路を閉じる |
| P09 | 626 §2.2、本 §2.1 | intent identity = 6 要素からの再導出 | R と ledger の intent identity だけを別 digest | `CANDIDATE-PACKPUB-PUB-009` | `publish_intent_mismatch` | 独立: bundle digest 一致でも intent だけの改変を閉じる |
| P10 | 626 §2.3、本 §2.1 | approval binding = nonce → intent identity の再導出 | binding digest だけを別値 | `CANDIDATE-PACKPUB-PUB-010` | `publish_approval_binding_invalid` | 独立: P23 は port 側の束縛、P10 は R 内の記載 |
| P11 | 565 §3、本 §2.1 (a) | R の repository ID = configuration | R の repository ID を `424201` (bundle / intent / chain は整合再計算) | `CANDIDATE-PACKPUB-PUB-011` | `publish_repository_id_mismatch` | 独立: 自己整合した別 repository の record を閉じる |
| P12 | 565 §3 | R の repository full name = configuration | `example-org/other-pack` | `CANDIDATE-PACKPUB-PUB-012` | `publish_repository_name_mismatch` | 独立: ID と name は別 field |
| P13 | 565 §3 | R の target ref = configuration | `refs/heads/release` | `CANDIDATE-PACKPUB-PUB-013` | `publish_target_ref_mismatch` | 独立: intent 構成要素だが configuration との一致は別 predicate |
| P14 | 565 §3 | R の ruleset ID = configuration | `78` | `CANDIDATE-PACKPUB-PUB-014` | `publish_ruleset_mismatch` | 独立: required context 集合が同じでも ruleset は別 |
| P15 | 565 §3 | R の required context 集合 = configuration (集合一致) | `["pack-check", "extra"]` | `CANDIDATE-PACKPUB-PUB-015` | `publish_required_context_mismatch` | 独立: 過不足いずれも不一致 |
| P16 | 565 §3 | R の installation ID = configuration | `9002` | `CANDIDATE-PACKPUB-PUB-016` | `publish_installation_mismatch` | 独立: P27 は mint 結果、P16 は R の記載 |
| P17 | 626 §2.2 形状契約 | expected main OID は 40 lowercase hex | 39 hex | `CANDIDATE-PACKPUB-PUB-017` | `publish_expected_main_invalid` | 独立: equality だけでは malformed 同士の一致を弾けない |
| P18 | 626 §2.2 形状契約 | reviewed head OID は 40 lowercase hex | uppercase | `CANDIDATE-PACKPUB-PUB-018` | `publish_reviewed_head_invalid` | 独立: 同上 |
| P19 | 本 §2.1 | caller は identity を供給できない | caller `expectedMain` / `reviewedHead` / `intentIdentity` / `approvalNonce` を R と別に供給 | `CANDIDATE-PACKPUB-PUB-019`〜`022` | `publish_caller_override` | 独立: 4 field を独立 case にする |
| P20 | 565 §5、本 §2.2-5 | 同一識別子の journal intent = R の intent identity | journal に同一 (operation ID, key) で別 intent の `mutation_intent` を置く | `CANDIDATE-PACKPUB-PUB-023` | `publish_operation_replay` | 独立: 完全一致 replay (053) と 1 軸 drift を分ける |
| P21 | 565 §5 | `mutation_intent` あり `read_back_observation` 無しは推測しない | journal を `mutation_intent` で打ち切り | `CANDIDATE-PACKPUB-PUB-024` | indeterminate `publish_reconciliation_incomplete` | 独立: 再 mutation も成功推測もしない |
| P22 | 565 §1.1、626 §2.2-8 | approval binding 集合は 1 件以上 | 集合を `[]` (bundle / chain 再計算) | `CANDIDATE-PACKPUB-PUB-025` | `publish_approval_missing` | 独立: 空集合では P23–P26 が vacuous に真になる |
| P23 | 565 §1.1 | port の束縛先 = R の intent identity | port が nonce を別 intent へ束縛 | `CANDIDATE-PACKPUB-PUB-026` | `publish_approval_binding_mismatch` | 独立: R 側 (P10) と port 側を分ける |
| P24 | 565 §1.1 | nonce 未消費 | port 側で消費済み | `CANDIDATE-PACKPUB-PUB-027` | `publish_approval_consumed` | 独立: 束縛が正しくても再提示を閉じる |
| P25 | 565 §1.1、本 §2.1 (c) | 固定 clock 時点で有効期限内 | expiresAt を clock より前 | `CANDIDATE-PACKPUB-PUB-028` | `publish_approval_expired` | 独立: 未消費・束縛一致でも期限切れ |
| P26 | 565 §1.1、#625 §2 | nonce が preparation nonce 集合に属さない | nonce を `prep-adm-fixture-0001` | `CANDIDATE-PACKPUB-PUB-029` | `publish_approval_set_conflict` | 独立: phase 間の nonce 流用を閉じる |
| P27 | 565 §3 | mint 結果の installation ID = R | mint port が `9002` の token を返す | `CANDIDATE-PACKPUB-PUB-030` | `publish_authority_mismatch` | 独立: R が正しくても authority の取り違えを閉じる |
| P28 | 565 §3 | token permission は Contents write だけ | Pull requests write / Workflows write を付与 | `CANDIDATE-PACKPUB-PUB-031`〜`032` | `publish_authority_overprivileged` | 独立: 2 permission を独立 case にする |
| P29 | 565 §3 | token が Contents write を持つ | Contents write を欠落 | `CANDIDATE-PACKPUB-PUB-033` | `publish_authority_insufficient` | 独立: 過剰と不足は別 predicate |
| P30 | 565 §1.1 TOCTOU、本 §2.2-8 | pre-write main OID = E | observer が別 OID を返す | `CANDIDATE-PACKPUB-PUB-034` | `publish_main_drift` | 独立: lease 拒否 (P32) より前に write 0 で閉じる |
| P31 | 565 §1.1「review後のhead更新はdeny」 | pre-write PR head = H | observer が別 head を返す | `CANDIDATE-PACKPUB-PUB-035` | `publish_head_drift` | 独立: main が E でも head の更新は別 |
| P32 | 565 §5 porcelain | 実更新 status がちょうど 1 件 | `=` / status 欠落 / 複数 / reject / response loss | `CANDIDATE-PACKPUB-PUB-036`〜`040` | indeterminate `cas_not_applied_by_operation` | 独立: 5 形態を独立 case にし、post-read が H でも成功に丸めない |
| P33 | 565 §5 | post-read main = H | post-read が別 OID | `CANDIDATE-PACKPUB-PUB-041` | indeterminate `publish_read_back_mismatch` | 独立: status 1 件でも read-back drift は別 |
| P34 | 565 §1.1/§5 | journal append は各 step で成功する | `planned_nonce_consumed` / `mutation_intent` / `read_back_observation` の append を失敗させる | `CANDIDATE-PACKPUB-PUB-042`〜`044` | indeterminate `journal_persist_failed` | 独立: 3 箇所で remote write 境界が異なる (0 / 0 / 1) |
| P35 | 565 §5 | receipt は no-clobber、persist 失敗を成功にしない | 既存 receipt を別 bytes で置く / persist を失敗させる | `CANDIDATE-PACKPUB-PUB-045`〜`046` | `publish_receipt_conflict` / indeterminate `receipt_persist_failed` | 独立: conflict は deny、persist 失敗は indeterminate |
| P36 | 565 §3、本 §2.2-7 | token bytes は journal / receipt / result、argv、stdout / stderr / error に出ない | 正常系と P32 失敗系の各出力面を token 文字列で grep (3 面を独立 case) | `CANDIDATE-PACKPUB-PUB-047`、`060`、`061` | (漏洩 0 件) | 独立: 出力面ごとに漏洩経路が異なる (journal / receipt / result は永続化、argv は process 引数、stdout / error は診断出力) |
| P37 | 626 §4 rev 11、本 §2.1-2 | ledger chain が先頭から R まで整合 | R の直前 record の bytes を改変 (R の previous record digest は据え置き) | `CANDIDATE-PACKPUB-PUB-062` | `publish_admission_chain_invalid` | 独立: R 自身の bytes と digest が正しくても chain の途中挿入・改変を閉じる |
| P38 | 626 §4 rev 11、本 §2.1-3 | admission journal event の bundle digest = R の bundle digest | journal event の bundle digest だけを別値 (R / ledger は正常系) | `CANDIDATE-PACKPUB-PUB-063` | `publish_admission_provenance_mismatch` | 独立: ledger と chain が整合していても admission journal に無い record を閉じる |
| P39 | 565 §5、本 §2.2-5 | 完全一致 replay は remote 再観測 (main = H、PR head = H) を伴う | journal 完全列を保ったまま remote main を別 OID に | `CANDIDATE-PACKPUB-PUB-064` | indeterminate `publish_replay_remote_drift` | 独立: journal だけで成功を推測する経路を閉じる。P20 は intent 不一致、P21 は journal 不完全 |
| P40 | 626 §4 rev 11、本 §2.1-3 | 参照先 admission journal event が存在し kind = `admission_observation` | (a) 参照先 event を同じ bundle digest を持つ別 kind の event に置換、(b) 参照先 event を journal から除去 (R / ledger は正常系) | `CANDIDATE-PACKPUB-PUB-066`、`067` | `publish_admission_provenance_invalid` | 独立: P38 は解決した event の bundle digest 不一致、P40 は解決先の不在 / kind 不正。bundle digest が一致する別 kind event は P38 を通る |
| P41 | 626 §2.2、本 §2.2-4 | preparation receipt digest は `/^sha256:[0-9a-f]{64}$/` | R の preparation receipt digest を prefix 無しの 64 hex に (intent identity / bundle digest / ledger / chain は再導出して整合) | `CANDIDATE-PACKPUB-PUB-068` | `publish_preparation_receipt_digest_invalid` | 独立: P17/P18 は OID 形状、P09 は再導出一致。自己整合した malformed record を閉じる |
| P42 | 626 §2.2、本 §2.2-4 | closing receipt digest は `/^sha256:[0-9a-f]{64}$/` | R の closing receipt digest を `sha256:` + 63 hex に (bundle digest / ledger / chain は再導出して整合) | `CANDIDATE-PACKPUB-PUB-069` | `publish_closing_receipt_digest_invalid` | 独立: P41 と別 member。receipt digest 感度 057 は digest の変化を見るだけで形状を見ない |
| P43 | 565 §5、本 §2.2-5 | 完全一致 replay は PR 現在 head = H の再観測を伴う | journal 完全列と main = H を保ったまま PR 現在 head を別 OID に | `CANDIDATE-PACKPUB-PUB-070` | indeterminate `publish_replay_remote_drift` | 独立: P39 は main 軸、P43 は PR head 軸。P31 は新規 operation の pre-write であり replay 経路の head 検査除去を捕まえない |

43 guard に冗長なものは無い。P11–P16 は configuration との一致であり、#626 が admission 時に同じ値を
seal していても、別 configuration の Pack へ record を持ち込む経路を #627 側で独立に閉じる。P02/P03/P37/P38/P40
は seal 主体検証の 4 段 (存在・bytes・chain (genesis 込み)・journal provenance (解決先の存在 / kind /
bundle digest)) であり、いずれか 1 段を外すと他の段を満たす偽造経路が残る。P41/P42 は §2.2-4 の形状契約を
receipt digest 2 member について OID (P17/P18) と同じ粒度で固定する。P39/P43 は replay の remote 再観測を
main / PR head の 2 軸で独立に固定する。

## 4. 判定と no-write 境界

- 全 43 guard が成立したときだけ step 10 の CAS を 1 回試行し、§2.4 の receipt を返す。
- indeterminate は §2.2 の ledger / journal / approval port / mint port / pre-write observer の
  unavailable、journal persist 失敗、CAS の実更新 status 不能、post-read 不一致、replay 時の remote drift、
  receipt persist 失敗であり、deny や success に丸めない。
- 完全一致 replay は同一識別子・同一 intent identity・完全な journal 列・remote 再観測一致に対して receipt を
  決定的に再構成し、approval consume 0、token mint 0、mutation 0 とする。
- deny / indeterminate のいずれも Release / tag / asset / pointer / branch / PR の remote write は 0 であり、
  main write は step 10 到達前なら 0、到達後なら試行 1 である。
- mint 済み token は、step 8 以降の全 deny / indeterminate 分岐と成功時に必ず dispose する。

## 5. 後続との分離

#627 は admitted record の consume、approval consume、CAS token mint / dispose、main CAS 1 回、journal と
最小 receipt だけを所有する。#625 の preparation、#626 の admission validation と admission ledger /
journal の append、main CAS 後の release FSM、canary acceptance、production ports、CLI、既存 adapter の
大規模再構成は変更しない。PLAN-L7-565 §7 の PR-B (production ports) は `applyReviewedHeadWithLease` の
exact lease process 実装だけを後から差し込む。

## 6. 完了条件

43 guard の一軸 oracle、indeterminate 5 軸、完全一致 replay (remote 再観測 2 軸込み)、consume 後 fail-close、
token 非漏洩 3 面と post-mint 全分岐の dispose、journal 順序、receipt / record digest 感度、admitted 時の
write 1 / 後段 write 0 を pair test-design へ 1 対 1 で固定し、PLAN lint、admission-check、readability /
plan-doc 対象テストを同一 exact HEAD へ束縛する。実装 PR で初めて `U-PACKPUB-PUB-*` を共有 registry へ
昇格し、non-author closing review を取得する。

## 7. 設計判断

| 論点 | 採択 | 根拠 |
| --- | --- | --- |
| kind / 層 | L7 add-impl + Reverse 対 (PLAN-REVERSE-627) | Issue #627 が `publishPackCanary` の runtime 結線を求め、兄弟 #625 / #626 と同形。旧 PLAN-L6-627 (PR #637、未 merge) の L6 add-design は L7 add-impl を親に持つ層逆転で結線を所有できなかった |
| seal 主体の検証 | admission ledger (append-only、単一 writer、chain) の resolve + chain 整合 + admission journal provenance | 署名基盤を新設せず、#626 が #625 の preparation journal を G38 の出所とするのと同型の durable state で偽造・自己整合 record・ledger 外挿入を閉じる。writer と persist 先は PLAN-L7-626 rev 11 §4 が所有 |
| consume 後の deny | nonce を戻さない fail-close | 565 §1.1 の consume 直後 `planned_nonce_consumed` と整合し、rollback の新規機構を作らない |
| 完全一致 replay | journal 完全列 + remote 再観測の一致を必須 | 565 §5 の write-0 reconciliation (journal / receipt だけから成功を推測しない) と整合 |
| CAS 後段 | 対象外 (既存 FSM を変更しない) | 1 PR = 1 論点。Release / tag / asset / pointer は PR-B / #418 の責務 |

## 8. 改訂記録

- rev 1 (2026-09-17、Claude control lane): PR #637 (PLAN-L6-627 rev 3、Codex 著) の preview review が指摘した
  上位契約齟齬 2 件 (#626 admitted record の consume 不在、偽造 / replay 拒否の未定義) と軽作業 6 件を受け、
  PO 判断 (2026-09-16、詰まった PR の引き取り) により Claude control lane が main (#647 merge 後、
  PLAN-L7-626 rev 10) から契約を再起票。36 guard、candidate 59。
- rev 2 (2026-09-17、Claude control lane): PR #650 exact head `c3dbe2bd` に対する非著者 Codex Sol review r1
  (receipt `c03145cb…`、FLAG blocking 3、是正 1 回目) を是正。(1) 上位契約齟齬: admitted record の persist 先と
  writer を PLAN-L7-626 rev 11 §4 (admission ledger、単一 writer、chain、admission journal provenance) で
  定義し、§2.1 の seal 主体検証を 4 段 (P02 / P03 / P37 / P38) へ拡張、strict schema に provenance 群を追加。
  (2) §2.2-5 の完全一致 replay に remote 再観測を必須化 (P39、565 §5)。(3) token lifecycle の oracle を 3 面
  (047 / 060 / 061) と post-mint 全分岐の dispose (059) へ拡張。非 blocking の test-design §3 文言矛盾も修正。
  guard 39、candidate 65。
- rev 3 (2026-09-17、Claude control lane): PR #650 exact head `5270a200` に対する非著者 Codex Sol review r2
  (receipt `c99f948d…`、FLAG blocking 4、全て light in-PR、是正 2 回目) を是正。(1) §2.1-3 の journal
  provenance に解決先 event の存在と kind = `admission_observation` を明示し P40 (066 別 kind / 067 不在) を
  追加。(2) §2.2-5 の replay 再観測を PR head 軸でも独立に固定 (P43 / 070)。(3) §2.2-4 の preparation /
  closing receipt digest 形状に guard P41 / P42 (068 / 069) を追加。(4) §2.1-2 の chain 整合を genesis
  (sequence 1、previous digest null) から要求し、truncated ledger の候補 071 を P37 に追加。guard 43、
  candidate 71。

## 9. predicate→candidate 対応表 (self-audit)

§2 / §4 の全 predicate を列挙し、その除去を Red にする guard / candidate を 1 対 1 で示す。

| 節 | predicate | guard / candidate |
| --- | --- | --- |
| §2.1 | R が供給されている | P01 / 001 |
| §2.1-1 | ledger が R を解決し bytes 一致 | P02 / 002、P03 / 003 |
| §2.1-2 | ledger chain 整合 (途中改変 / genesis 境界) | P37 / 062、071 |
| §2.1-3 | admission journal provenance (解決先の存在 / kind / bundle digest) | P40 / 066–067、P38 / 063、観測不能 065 |
| §2.1 | strict 4 群 (余剰なし・欠落なし) | P04 / 004、P05 / 005、感度 057 |
| §2.1 | status = admitted | P06 / 006 |
| §2.1 | record digest の caller 供給拒否 | P07 / 007 |
| §2.1 | bundle / intent / approval binding の再導出一致 | P08 / 008、P09 / 009、P10 / 010 |
| §2.1 (a) | configuration 期待値との一致 (5 scalar + 集合) | P11–P16 / 011–016 |
| §2.1 | caller が identity を供給できない | P19 / 019–022 |
| §2.2-4 | OID 形状 / receipt digest 形状 | P17 / 017、P18 / 018、P41 / 068、P42 / 069 |
| §2.2-5 | 完全一致 replay (remote 再観測込み) / 別 intent deny / 不完全 journal / remote drift (main / PR head) | 053、P20 / 023、P21 / 024、P39 / 064、P43 / 070 |
| §2.2-6 | approval 集合非空・束縛・未消費・期限・集合帰属 | P22–P26 / 025–029 |
| §2.2-6 | consume 直後の `planned_nonce_consumed` | 058、P34 / 042 |
| §2.2-6 | consume 後 deny で nonce を戻さない | 054 |
| §2.2-7 | token の installation / permission | P27–P29 / 030–033 |
| §2.2-7 | token 非漏洩 3 面 | P36 / 047、060、061 |
| §2.2-7 | mint 後の全分岐 dispose | 059 |
| §2.2-8 | pre-write main / head 一致 | P30 / 034、P31 / 035 |
| §2.2-9〜11 | journal 順序と append 失敗 | 058、P34 / 042–044 |
| §2.2-10 | 実更新 status ちょうど 1 件 | P32 / 036–040 |
| §2.2-11 | post-read = H | P33 / 041 |
| §2.4 | receipt no-clobber / persist / digest 感度 | P35 / 045–046、055、056 |
| §2.3 / §4 | write-zero 境界、indeterminate 5 軸 | 052、048–051、065 |
