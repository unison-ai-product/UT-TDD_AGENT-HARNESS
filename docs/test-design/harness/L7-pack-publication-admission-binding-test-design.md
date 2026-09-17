---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-626-pack-publication-admission-binding
---

# L7 Pack公開 admission observation binding test design

## 1. 境界

この pair-freeze は、#625 の preparation receipt、publication configuration の期待値、publication
approval 参照、read-only repository/PR/review/check/merge-base/staging observer を pure admission
validator へ渡す契約だけを対象にする。実 GitHub credential、remote mutation、branch/PR 作成、
main CAS、Release、tag、asset、channel pointer は実行しない。実装 PR では in-memory observation
port、in-memory approval port、spy write ledger を使い、deny と indeterminate のいずれも remote
write 0 / approval consume 0 を直接検査する。

## 2. 合成 immutable fixture

fixture はすべて合成値であり、実 GitHub repository、実 PR、実 preparation receipt、既存の
plan-admission record を指さない。値は実装 PR の test module 内で定数として定義し、テスト間で
共有する 1 つの frozen object とする。

| 要素 | 合成値 | 備考 |
| --- | --- | --- |
| operation ID / idempotency key | `op-adm-fixture-0001` / `idem-adm-fixture-0001` | #625 §2 の発番形式に従う合成値 |
| staging tree digest / manifest digest | `sha256:` + `sha256("adm-fixture-tree")` / `sha256("adm-fixture-manifest")` の hex | sealed staging record にも同値を置く |
| expected Pack main OID | `sha1("adm-fixture-expected-main")` の 40 hex | |
| publication branch | `pack/publication/op-adm-fixture-0001` | deterministic branch 名 |
| PR number / head OID / base OID / tree digest | `4242` / `sha1("adm-fixture-head")` / expected main OID と同値 / staging tree digest と同値 | base = expected main が正常系 |
| preparation receipt | 上記を保持する #625 §2 形式の receipt。`read_back_observation` は PR `4242` を指す | receipt digest は canonical bytes から admission が導出 |
| configuration 期待値 (§2.1 (a)) | repository ID `424200`、full name `example-org/example-pack`、target ref `refs/heads/main`、ruleset ID `77`、期待 required context `["pack-check"]`、CAS installation ID `9001` | 実 Pack repo 名を使わない。preparation installation は `9002` (G28 mutant 用) |
| approval 参照 (§2.1 (b)) | approval nonce `apv-adm-fixture-0001` (束縛先 `op-adm-fixture-0001`、未消費)。preparation nonce 集合は `{"prep-adm-fixture-0001"}` | |
| review fixture | reviewed head = PR head、`approved`、reviewer `reviewer-b` (author は `author-a`)、closing receipt digest `sha256:` + `sha256("adm-fixture-closing")` の hex | |
| repository observation | ID `424200`、full name `example-org/example-pack`、target ref `refs/heads/main`、ruleset ID `77`、observed required context `["pack-check"]`、installation ID `9001` | 正常系は期待値と一致 |
| checks fixture | head = reviewed head、`[{context: "pack-check", conclusion: "success"}]` | |

fixture から不足する値を worktree、Pack checkout、GitHub API、既存の publication receipt で
補完しない。各 mutation row は上記 fixture の 1 要素だけを変異させ、他は正常系のまま保つ。

## 3. 40 guard mutation matrix (G40 は §4 の 056)

各行は他の predicate を成立させた fixture へ一軸だけを注入する。expected result は admission
record 0、typed deny、remote write 0 であり、別 guard の失敗を Green にしない。契約引用は
PLAN-L7-626 §3 の同じ行と一致させる。

| Candidate | Guard | 契約引用 | 一軸 mutant | 独立 Green oracle |
| --- | --- | --- | --- | --- |
| `CANDIDATE-PACKPUB-ADM-001` | G01 | 565 §1.1、626 §2.2-2 | observed PR number を `4243` | `admission_pr_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-002` | G02 | 565 §1.1 | observed PR head を別 OID | `admission_head_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-003` | G03 | 565 §1.1、#624 §4.1 | observed PR base を別 OID | `admission_base_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-004` | G04 | 565 §3 | merge-base を別 OID | `admission_merge_base_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-005` | G05 | 626 §2.2-3 | review receipt の PR を `4243` | `admission_review_pr_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-006` | G06 | 626 §2.2-3 | reviewed head を 39 hex / uppercase / 64 hex | `admission_review_head_invalid`、write 0 |
| `CANDIDATE-PACKPUB-ADM-007` | G07 | 565 §1.1 | reviewed head を形状正しい別 OID | `admission_review_head_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-008` | G08 | 565 §1.1 | conclusion を `changes_requested` | `admission_review_not_approved`、write 0 |
| `CANDIDATE-PACKPUB-ADM-009` | G09 | 626 §2.2 形状契約、#624 §4.2 | closing receipt digest を 63 hex / `sha1:` prefix / uppercase | `admission_review_receipt_invalid`、write 0 |
| `CANDIDATE-PACKPUB-ADM-010` | G10 | 626 §2.2-4 | checks head を別 OID | `admission_checks_head_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-011` | G11 | 565 §3、#624 §4.3 | observed required context 集合だけを `[]` | `admission_checks_missing`、write 0 |
| `CANDIDATE-PACKPUB-ADM-012` | G12 | 565 §3 | `pack-check` の conclusion を `failure` | `admission_check_not_success`、write 0 |
| `CANDIDATE-PACKPUB-ADM-013` | G13 | 565 §1.1、626 §2.2-7 | 別観測束の既存 admission record に同じ operation ID を登録 | `admission_operation_replay`、write 0 |
| `CANDIDATE-PACKPUB-ADM-014` | G14 | 565 §1.1、626 §2.2-7 | 別観測束の既存 admission record に同じ idempotency key を登録 | `admission_idempotency_replay`、write 0 |
| `CANDIDATE-PACKPUB-ADM-015` | G15 | 565 §1.1 | PR `4242` を別 operation ID で admitted 済みに登録 | `admission_pr_replay`、write 0 |
| `CANDIDATE-PACKPUB-ADM-016` | G16 | 625 §2、626 §2.2-2 | observed PR branch を `pack/publication/other` | `admission_branch_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-017` | G17 | 625 §2、626 §2.2-2 | observed PR tree digest を別値 | `admission_tree_digest_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-018` | G18 | 565 §1.1、626 §2.2-6 | sealed staging record の manifest digest を別値 | `admission_staging_manifest_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-019` | G19 | 565 §1.1 | PR `4242` を別 staging digest で admitted 済みに登録 | `admission_pr_staging_conflict`、write 0 |
| `CANDIDATE-PACKPUB-ADM-020` | G20 | 565 §1.1 | PR `4242` を別 expected main OID で admitted 済みに登録 | `admission_pr_expected_main_conflict`、write 0 |
| `CANDIDATE-PACKPUB-ADM-021` | G21 | 626 §2.2 | caller `reviewedHead` を観測値と別に供給 | `admission_caller_override`、write 0 |
| `CANDIDATE-PACKPUB-ADM-022` | G22 | 626 §2.2 | 観測束確定後に base OID field を改変 | `admission_observation_digest_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-023` | G23 | 565 §1.1、626 §2.2-3 | reviewer を `author-a` | `admission_review_author_conflict`、write 0 |
| `CANDIDATE-PACKPUB-ADM-024` | G24 | 565 §3、626 §2.2-4 | checks を `[{context: "unrelated", conclusion: "success"}]` (required 集合は `["pack-check"]` のまま) | `admission_required_context_uncovered`、write 0 |
| `CANDIDATE-PACKPUB-ADM-025` | G25 | 565 §3 | repository ID を `424201` | `admission_repository_id_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-026` | G26 | 565 §3 | target ref を `refs/heads/release` | `admission_target_ref_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-027` | G27 | 565 §3 | ruleset ID を `78` | `admission_ruleset_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-028` | G28 | 565 §3 | installation ID を `9002` | `admission_installation_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-029` | G29 | 565 §1.1、626 §2.2-8 | approval nonce の束縛先を `op-adm-fixture-0002` | `admission_approval_binding_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-030` | G30 | 565 §1.1 | approval nonce を `prep-adm-fixture-0001` | `admission_approval_set_conflict`、write 0 |
| `CANDIDATE-PACKPUB-ADM-031` | G31 | 565 §3、626 §2.2-1 | observed required context を `["other-check"]` へ差替え、`other-check` の success check も供給 (ruleset ID は `77` のまま) | `admission_required_context_set_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-032` | G32 | 565 §1.1、626 §2.2-6 | sealed staging record の tree digest を別値 | `admission_staging_tree_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-033` | G33 | 565 §1.1、626 §2.2-6 | sealed staging record の expected main OID を別値 | `admission_staging_expected_main_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-034` | G34 | 565 §1.1、626 §2.2-6 | sealed staging record の branch 名を別値 | `admission_staging_branch_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-035` | G35 | 565 §3 | repository full name を `example-org/other-pack` | `admission_repository_name_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-036` | G36 | 626 §2.1 | preparation receipt を `undefined` | `admission_receipt_missing`、observer call 0、write 0 |
| `CANDIDATE-PACKPUB-ADM-037` | G37 | 626 §2.1 | receipt の PR number field を欠落 | `admission_receipt_invalid`、observer call 0、write 0 |
| `CANDIDATE-PACKPUB-ADM-038` | G38 | 565 §1.1、626 §2.1 | receipt の `read_back_observation` を PR `4243` へ | `admission_pr_unprepared`、write 0 |
| `CANDIDATE-PACKPUB-ADM-039` | G39 | 565 §1.1、626 §2.2-8 | approval nonce `apv-adm-fixture-0001` を消費済みに (束縛先・集合帰属は正常系) | `admission_approval_consumed`、write 0 |

G03/G09/G11 は #624 の blocking 3 であり、G09 の形状契約は PLAN-L7-626 §2.2 が L7 で新設し
PLAN-REVERSE-626 R1 が上位へ backfill する。G01/G05、G06/G07、G11/G12/G24/G31、G18/G32/G33/G34、
G25/G35 は入力出所・形状/equality・被覆・集合一致が異なるため別 test を維持する。

## 4. indeterminate / deny / replay / write-zero / sealing

各行は 1 軸の stimulus だけを持つ。

| Candidate | Stimulus (1 軸) | Green oracle |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-ADM-040` | review observer が timeout | typed `indeterminate`、admission 0、全 remote write 0 |
| `CANDIDATE-PACKPUB-ADM-041` | checks observer の応答欠落 (`undefined`) | typed `indeterminate`、admission 0、全 remote write 0 |
| `CANDIDATE-PACKPUB-ADM-042` | repository observer の schema 不正 (ruleset ID が数値でない) | typed `indeterminate`、admission 0、全 remote write 0 |
| `CANDIDATE-PACKPUB-ADM-043` | merge-base observer が error を返す | typed `indeterminate`、admission 0、全 remote write 0 |
| `CANDIDATE-PACKPUB-ADM-044` | staging record observer が timeout | typed `indeterminate`、admission 0、全 remote write 0 |
| `CANDIDATE-PACKPUB-ADM-045` | G03 deny 時に approval port を観測 | approval consume 0、typed `deny`、全 remote write 0 |
| `CANDIDATE-PACKPUB-ADM-046` | 既存 admission record (同一識別子・同一観測束 digest) がある状態で完全 replay | 同一 record digest を決定的再構成、新規 record 0、mutation 0 |
| `CANDIDATE-PACKPUB-ADM-047` | 既存 admission record と識別子が同一で、PR head だけ drift した replay | typed `deny` (`admission_operation_replay`)、再構成 0、mutation 0 |
| `CANDIDATE-PACKPUB-ADM-048` | 正常系 fixture で admitted | admitted record 1、remote write ledger 0、approval consume 0、CAS token mint 0、intent 実行 0 |
| `CANDIDATE-PACKPUB-ADM-049` | 正常系 admitted record の preimage から §2.3 の 1 項目を除去 | record digest が変わる (全項目について 1 件ずつ実行) |
| `CANDIDATE-PACKPUB-ADM-050` | intent identity 構成要素: operation ID だけを `op-adm-fixture-0002` に | intent identity と approval binding digest が変わる (他 5 要素は不変) |
| `CANDIDATE-PACKPUB-ADM-051` | intent identity 構成要素: repository ID だけを `424201` に | 同上 |
| `CANDIDATE-PACKPUB-ADM-052` | intent identity 構成要素: target ref だけを `refs/heads/release` に | 同上 |
| `CANDIDATE-PACKPUB-ADM-053` | intent identity 構成要素: expected main OID だけを別 OID に | 同上 |
| `CANDIDATE-PACKPUB-ADM-054` | intent identity 構成要素: reviewed head OID だけを別 OID に | 同上 |
| `CANDIDATE-PACKPUB-ADM-055` | intent identity 構成要素: preparation receipt digest だけを別 digest に | 同上 |

| `CANDIDATE-PACKPUB-ADM-056` | G40: approval 参照を `[]` に (他は正常系) | `admission_approval_missing`、admitted 0、write 0 |
| `CANDIDATE-PACKPUB-ADM-057` | approval binding 構成要素: intent identity を固定したまま approval nonce だけを `apv-adm-fixture-0002` に | approval binding digest が変わる (intent identity は不変) |

050–055 と 057 は導出関数を直接呼び、構成要素の 1 つを省く実装 (digest が不変になる) を Red にする。
parameterized 実行でよいが、各要素を独立 case として報告する。

indeterminate を deny や success へ丸めず、成功観測を欠いたまま #627 の publish/CAS へ進めない。
admission 成功 fixture でも remote write ledger と approval consume は 0 であり、#626 が副作用を
発行しないことを対照で確認する。

## 5. 実装 PR への昇格規則

実装 PR は 57 candidate を各 1 件以上の独立 test へ昇格し、実装時に正規の test ID
(`U-PACKPUB-ADM-*`) を割り当てる。typed reason、入力 digest、observer call 順、admission
record digest、approval/remote write count を直接検査する。恒真 assertion、dummy observer、既存
#625 nonce の流用、publish/CAS port の no-op 偽装では Green にしない。production source 変更、
CI/review evidence は実装 PR の責務であり、この draft pair-freeze では追加しない。
