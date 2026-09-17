---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-627-pack-publication-admitted-publish
---

# L7 admitted Pack公開 deny 境界と main CAS 結線 test design

## 1. 境界

この pair-freeze は、#626 の admitted record、publication configuration の期待値、admission record store、
mutation approval port、CAS authority port、read-only pre-write observer、exact lease CAS port、durable
journal、receipt store を admitted publish 入口へ渡す契約だけを対象にする。実 GitHub credential、実 remote
mutation、branch / PR 作成、Release、tag、asset、channel pointer は実行しない。実装 PR では in-memory
store / port、fake lease port (porcelain 出力を固定)、spy write ledger を使い、deny と indeterminate の
いずれも remote write 0 (CAS 試行後は main 試行 1・後段 0)、approval consume / token mint の回数を直接
検査する。

## 2. 合成 immutable fixture

fixture はすべて合成値であり、実 GitHub repository、実 PR、実 admission record、既存の plan-admission
record を指さない。値は実装 PR の test module 内で定数として定義し、テスト間で共有する 1 つの frozen
object とする。#626 pair test-design §2 の fixture と同じ識別子・OID・digest を使い、admitted record は
その正常系 admission の出力と同値にする。

| 要素 | 合成値 | 備考 |
| --- | --- | --- |
| identifiers | operation ID `op-adm-fixture-0001`、idempotency key `idem-adm-fixture-0001`、PR `4242` | #626 record 識別子 |
| configuration 期待値 (§2.1 (a)) | repository ID `424200`、full name `example-org/example-pack`、target ref `refs/heads/main`、ruleset ID `77`、required context `["pack-check"]`、CAS installation ID `9001` | preparation installation は `9002` (P16 / P27 mutant 用) |
| expected main OID (E) / reviewed head OID (H) | `sha1("adm-fixture-expected-main")` / `sha1("adm-fixture-head")` の 40 hex | base OID = E、merge-base = E |
| tree digest / preparation receipt digest / closing receipt digest | `sha256:` + `sha256("adm-fixture-tree")` / `sha256("pub-fixture-prep-receipt")` / `sha256("adm-fixture-closing")` の hex | |
| review / checks | 結論 `approved`、reviewer `reviewer-b`、required check `pack-check: success` | |
| intent identity | 上記 6 要素 (operation ID、repository ID、target ref、E、H、preparation receipt digest) の canonical digest (#626 と同じ導出関数) | R の記載値と再導出値を比較 |
| approval binding 集合 | nonce `apv-pub-fixture-0001` → intent identity の canonical digest 1 件 | |
| observation bundle digest / record digest | sealed 値の canonical digest / R canonical bytes の `sha256:` digest | 導出関数で計算し、定数で持たない |
| admitted record R | identifiers + sealed (上記全項目) + `status: "admitted"` | admission record store も同一 bytes を保持 |
| approval port | `apv-pub-fixture-0001` は intent identity へ束縛、未消費、expiresAt `2026-12-31T00:00:00.000Z`。preparation nonce 集合は `{"prep-adm-fixture-0001"}` | 固定 clock `2026-09-17T00:00:00.000Z` |
| CAS authority port | mint(9001) → 不透明 token `cas-token-fixture-0001`、installation `9001`、permission `{contents: "write"}` | dispose 回数を spy で数える |
| pre-write observer | main = E、PR `4242` head = H | |
| lease port | `applyReviewedHeadWithLease({repository, targetRef, expectedMain: E, reviewedHead: H})` → porcelain 実更新 status 1 件 (`refs/heads/main` E→H)、post-read H | |
| journal / receipt store | in-memory durable journal (append / digest)、in-memory atomic no-clobber receipt store | |

fixture から不足する値を worktree、Pack checkout、GitHub API、既存の publication receipt で補完しない。各
mutation row は上記 fixture の 1 要素だけを変異させ、他は正常系のまま保つ。R の sealed 値を変える row は
observation bundle digest / intent identity / approval binding / record digest を導出関数で再計算した自己
整合 R を作り、store にも同じ bytes を置く (P03 / P08 / P09 / P10 の row だけは再計算しない、または store 側
だけを変えることで、その 1 predicate を分離する)。

## 3. 36 guard mutation matrix

各行は他の predicate を成立させた fixture へ一軸だけを注入する。expected result は typed deny または
indeterminate、receipt 0、remote write 0 (P32 / P33 / P34-044 は main 試行 1・後段 0) であり、別 guard の
失敗を Green にしない。契約引用は PLAN-L7-627 §3 の同じ行と一致させる。

| Candidate | Guard | 契約引用 | 一軸 mutant | 独立 Green oracle |
| --- | --- | --- | --- | --- |
| `CANDIDATE-PACKPUB-PUB-001` | P01 | Issue #627、627 §2.1 | R を `undefined` | `publish_admission_required`、store call 0、write 0 |
| `CANDIDATE-PACKPUB-PUB-002` | P02 | 627 §2.1 | store から record を削除 | `publish_admission_unknown`、write 0 |
| `CANDIDATE-PACKPUB-PUB-003` | P03 | 627 §2.1 | store record の merge-base だけを別 OID (供給 R は正常系) | `publish_admission_store_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-PUB-004` | P04 | 627 §2.1 strict schema | R に余剰 member `token: "x"` を追加 | `publish_admission_invalid`、write 0 |
| `CANDIDATE-PACKPUB-PUB-005` | P05 | 627 §2.1 strict schema | R から operation ID を欠落 | `publish_admission_invalid`、store call 0、write 0 |
| `CANDIDATE-PACKPUB-PUB-006` | P06 | 627 §2.1、626 §4 | R と store の status を `denied` | `publish_admission_not_admitted`、write 0 |
| `CANDIDATE-PACKPUB-PUB-007` | P07 | 627 §2.1 | caller が record digest を `sha256:` + `sha256("override")` で供給 | `publish_admission_digest_override`、write 0 |
| `CANDIDATE-PACKPUB-PUB-008` | P08 | 626 §2.3、627 §2.1 | R と store の expected main OID だけを別 OID (bundle digest 据え置き) | `publish_admission_bundle_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-PUB-009` | P09 | 626 §2.2、627 §2.1 | R と store の intent identity だけを別 digest | `publish_intent_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-PUB-010` | P10 | 626 §2.3、627 §2.1 | R と store の approval binding digest だけを別値 | `publish_approval_binding_invalid`、write 0 |
| `CANDIDATE-PACKPUB-PUB-011` | P11 | 565 §3、627 §2.1 (a) | repository ID を `424201` (自己整合再計算) | `publish_repository_id_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-PUB-012` | P12 | 565 §3 | full name を `example-org/other-pack` | `publish_repository_name_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-PUB-013` | P13 | 565 §3 | target ref を `refs/heads/release` | `publish_target_ref_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-PUB-014` | P14 | 565 §3 | ruleset ID を `78` | `publish_ruleset_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-PUB-015` | P15 | 565 §3 | required context 集合を `["pack-check", "extra"]` | `publish_required_context_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-PUB-016` | P16 | 565 §3 | installation ID を `9002` | `publish_installation_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-PUB-017` | P17 | 626 §2.2 形状契約 | E を 39 hex | `publish_expected_main_invalid`、write 0 |
| `CANDIDATE-PACKPUB-PUB-018` | P18 | 626 §2.2 形状契約 | H を uppercase 40 hex | `publish_reviewed_head_invalid`、write 0 |
| `CANDIDATE-PACKPUB-PUB-019` | P19 | 627 §2.1 | caller `expectedMain` を R と別に供給 | `publish_caller_override`、write 0 |
| `CANDIDATE-PACKPUB-PUB-020` | P19 | 627 §2.1 | caller `reviewedHead` を R と別に供給 | `publish_caller_override`、write 0 |
| `CANDIDATE-PACKPUB-PUB-021` | P19 | 627 §2.1 | caller `intentIdentity` を R と別に供給 | `publish_caller_override`、write 0 |
| `CANDIDATE-PACKPUB-PUB-022` | P19 | 627 §2.1 | caller `approvalNonce` を `apv-pub-fixture-0002` で供給 | `publish_caller_override`、consume 0、write 0 |
| `CANDIDATE-PACKPUB-PUB-023` | P20 | 565 §5、627 §2.2-5 | journal に同一識別子・別 intent identity の `mutation_intent` + `read_back_observation` を置く | `publish_operation_replay`、consume 0、write 0 |
| `CANDIDATE-PACKPUB-PUB-024` | P21 | 565 §5 | journal を同一 intent の `mutation_intent` で打ち切り | indeterminate `publish_reconciliation_incomplete`、consume 0、mint 0、write 0 |
| `CANDIDATE-PACKPUB-PUB-025` | P22 | 565 §1.1、626 §2.2-8 | approval binding 集合を `[]` (自己整合再計算) | `publish_approval_missing`、consume 0、write 0 |
| `CANDIDATE-PACKPUB-PUB-026` | P23 | 565 §1.1 | approval port が nonce を別 intent identity へ束縛 | `publish_approval_binding_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-PUB-027` | P24 | 565 §1.1 | approval port 側で nonce を消費済みに | `publish_approval_consumed`、write 0 |
| `CANDIDATE-PACKPUB-PUB-028` | P25 | 565 §1.1、627 §2.1 (c) | expiresAt を `2026-09-16T23:59:59.000Z` | `publish_approval_expired`、write 0 |
| `CANDIDATE-PACKPUB-PUB-029` | P26 | 565 §1.1、#625 §2 | nonce を `prep-adm-fixture-0001` (自己整合再計算) | `publish_approval_set_conflict`、write 0 |
| `CANDIDATE-PACKPUB-PUB-030` | P27 | 565 §3 | mint port が installation `9002` の token を返す | `publish_authority_mismatch`、dispose 1、write 0 |
| `CANDIDATE-PACKPUB-PUB-031` | P28 | 565 §3 | token permission に `pull_requests: "write"` を追加 | `publish_authority_overprivileged`、dispose 1、write 0 |
| `CANDIDATE-PACKPUB-PUB-032` | P28 | 565 §3 | token permission に `workflows: "write"` を追加 | `publish_authority_overprivileged`、dispose 1、write 0 |
| `CANDIDATE-PACKPUB-PUB-033` | P29 | 565 §3 | token permission から `contents: "write"` を欠落 | `publish_authority_insufficient`、dispose 1、write 0 |
| `CANDIDATE-PACKPUB-PUB-034` | P30 | 565 §1.1、627 §2.2-8 | pre-write observer の main を別 OID | `publish_main_drift`、write 0 |
| `CANDIDATE-PACKPUB-PUB-035` | P31 | 565 §1.1 | pre-write observer の PR head を別 OID | `publish_head_drift`、write 0 |
| `CANDIDATE-PACKPUB-PUB-036` | P32 | 565 §5 | lease port が `=` (up to date) を返し post-read H | indeterminate `cas_not_applied_by_operation`、main 試行 1、後段 0 |
| `CANDIDATE-PACKPUB-PUB-037` | P32 | 565 §5 | status 行欠落 | 同上 |
| `CANDIDATE-PACKPUB-PUB-038` | P32 | 565 §5 | status 行 2 件 | 同上 |
| `CANDIDATE-PACKPUB-PUB-039` | P32 | 565 §5 | reject | 同上 |
| `CANDIDATE-PACKPUB-PUB-040` | P32 | 565 §5 | response loss (`undefined`) | 同上 |
| `CANDIDATE-PACKPUB-PUB-041` | P33 | 565 §5 | status 1 件だが post-read を別 OID | indeterminate `publish_read_back_mismatch`、main 試行 1、後段 0 |
| `CANDIDATE-PACKPUB-PUB-042` | P34 | 565 §1.1 | `planned_nonce_consumed` append を失敗させる | indeterminate `journal_persist_failed`、mint 0、write 0 |
| `CANDIDATE-PACKPUB-PUB-043` | P34 | 565 §5 | `mutation_intent` append を失敗させる | indeterminate `journal_persist_failed`、write 0 |
| `CANDIDATE-PACKPUB-PUB-044` | P34 | 565 §5 | `read_back_observation` append を失敗させる | indeterminate `journal_persist_failed`、main 試行 1、後段 0 |
| `CANDIDATE-PACKPUB-PUB-045` | P35 | 565 §5 | receipt store に同一 path の別 bytes receipt を置く | `publish_receipt_conflict`、上書き 0 |
| `CANDIDATE-PACKPUB-PUB-046` | P35 | 565 §5 | receipt persist を失敗させる | indeterminate `receipt_persist_failed`、CAS 結果は journal に残る |
| `CANDIDATE-PACKPUB-PUB-047` | P36 | 565 §3 | 正常系と 036 の全出力 (journal / receipt / result / error) を `cas-token-fixture-0001` で grep | 0 件 |

## 4. indeterminate / replay / write-zero / sealing

各行は 1 軸の stimulus だけを持つ。

| Candidate | Stimulus (1 軸) | Green oracle |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-PUB-048` | admission record store が timeout | indeterminate `publish_admission_store_unavailable`、consume 0、write 0 |
| `CANDIDATE-PACKPUB-PUB-049` | approval port が error を返す | indeterminate `approval_unavailable`、mint 0、write 0 |
| `CANDIDATE-PACKPUB-PUB-050` | mint port の応答欠落 | indeterminate `publish_authority_unavailable`、write 0 |
| `CANDIDATE-PACKPUB-PUB-051` | pre-write observer が timeout | indeterminate `observation_unavailable`、dispose 1、write 0 |
| `CANDIDATE-PACKPUB-PUB-052` | 正常系 fixture で publish | `published`、main 試行 1 (E→H)、Release / tag / asset / pointer / branch / PR write 0、consume 1、mint 1、dispose 1、receipt 1 |
| `CANDIDATE-PACKPUB-PUB-053` | 052 の journal と receipt がある状態で完全一致 replay | 同一 receipt bytes を決定的再構成、consume 0、mint 0、mutation 0 |
| `CANDIDATE-PACKPUB-PUB-054` | 034 (main drift) の後に同じ nonce で再実行 | 1 回目 `publish_main_drift`、2 回目 `publish_approval_consumed`、いずれも write 0 (nonce は戻らない) |
| `CANDIDATE-PACKPUB-PUB-055` | receipt store に同一 bytes の receipt が既にある | replay、上書き 0、conflict 0 |
| `CANDIDATE-PACKPUB-PUB-056` | 正常系 receipt の 1 member を変更 (§2.4 の全 member について 1 件ずつ) | receipt digest が変わる |
| `CANDIDATE-PACKPUB-PUB-057` | 正常系 R の 1 member を変更 (§2.1 strict 3 群の全 member について 1 件ずつ) | record digest が変わる |
| `CANDIDATE-PACKPUB-PUB-058` | 正常系 fixture で journal 列を観測 | `planned_nonce_consumed` (nonce ごと) → `mutation_intent` → `read_back_observation` の順で各 1 件、intent digest が全 event で一致 |
| `CANDIDATE-PACKPUB-PUB-059` | 正常系 / 036 / 011 で token dispose 回数を観測 | 1 / 1 / 0 (mint 前 deny は dispose 0) |

056 / 057 は導出関数を直接呼び、member の 1 つを省く実装 (digest が不変になる) を Red にする。
parameterized 実行でよいが、各 member を独立 case として報告する。

indeterminate を deny や success へ丸めず、CAS 成功を receipt の有無で覆さない。admitted 正常系でも
Release / tag / asset / pointer / branch / PR の port は呼ばれず、spy ledger で write 0 を対照確認する。

## 5. 実装 PR への昇格規則

実装 PR は 59 candidate を (PLAN-L7-627 §9 の対応表の順で) 各 1 件以上の独立 test へ昇格し、実装時に正規の
test ID (`U-PACKPUB-PUB-*`) を割り当てる。typed reason、record / receipt digest、port call 順と回数、
approval consume / token mint / dispose / remote write count を直接検査する。恒真 assertion、dummy port、
既存 #625 / #626 nonce の流用、lease port の no-op 偽装、Release 以降の port を呼んだまま write だけ省略する
実装では Green にしない。production source 変更、CI / review evidence は実装 PR の責務であり、この draft
pair-freeze では追加しない。
