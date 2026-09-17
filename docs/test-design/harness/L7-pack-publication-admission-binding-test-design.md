---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-626-pack-publication-admission-binding
---

# L7 Pack公開 admission observation binding test design

## 1. 境界

この pair-freeze は、#625 の preparation receipt と read-only repository/PR/review/check/
merge-base/staging observer を pure admission validator へ渡す契約だけを対象にする。実 GitHub
credential、remote mutation、branch/PR 作成、main CAS、Release、tag、asset、channel pointer は
実行しない。実装 PR では in-memory observation port と spy write ledger を使い、deny と
indeterminate のいずれも remote write 0 を直接検査する。

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
| repository ID / full name / target ref | `424200` / `example-org/example-pack` / `refs/heads/main` | 実 Pack repo 名を使わない |
| ruleset ID / required context 集合 | `77` / `["pack-check"]` | required context は 1 件 |
| CAS authority installation ID | `9001` | preparation authority は `9002` (G28 mutant 用) |
| review fixture | reviewed head = PR head、`approved`、reviewer `reviewer-b` (author は `author-a`)、closing receipt digest `sha256:` + `sha256("adm-fixture-closing")` の hex | |
| checks fixture | head = reviewed head、`[{context: "pack-check", conclusion: "success"}]` | |
| preparation receipt digest | receipt canonical bytes の `sha256:` digest (admission 側で導出) | receipt の field ではない |

fixture から不足する値を worktree、Pack checkout、GitHub API、既存の publication receipt で
補完しない。各 mutation row は上記 fixture の 1 要素だけを変異させ、他は正常系のまま保つ。

## 3. 28 guard mutation matrix

各行は他の predicate を成立させた fixture へ一軸だけを注入する。expected result は admission
record 0、typed deny、remote write 0 であり、別 guard の失敗を Green にしない。契約引用は
PLAN-L7-626 §3 の同じ行と一致させる。

| Candidate | Guard | 契約引用 | 一軸 mutant | 独立 Green oracle |
| --- | --- | --- | --- | --- |
| `CANDIDATE-PACKPUB-ADM-001` | G01 | 565 §1.1、626 §2.2-2 | PR number を `4243` | `admission_pr_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-002` | G02 | 565 §1.1 | observed PR head を別 OID | `admission_head_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-003` | G03 | 565 §1.1、#624 §4.1 | observed PR base を別 OID | `admission_base_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-004` | G04 | 565 §3 | merge-base を別 OID | `admission_merge_base_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-005` | G05 | 626 §2.2-3 | review receipt の PR を `4243` | `admission_review_pr_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-006` | G06 | 626 §2.2-3 | reviewed head を 39 hex / uppercase / 64 hex | `admission_review_head_invalid`、write 0 |
| `CANDIDATE-PACKPUB-ADM-007` | G07 | 565 §1.1 | reviewed head を形状正しい別 OID | `admission_review_head_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-008` | G08 | 565 §1.1 | conclusion を `changes_requested` | `admission_review_not_approved`、write 0 |
| `CANDIDATE-PACKPUB-ADM-009` | G09 | 626 §2.2 形状契約、#624 §4.2 | closing receipt digest を 63 hex / `sha1:` prefix / uppercase | `admission_review_receipt_invalid`、write 0 |
| `CANDIDATE-PACKPUB-ADM-010` | G10 | 626 §2.2-4 | checks head を別 OID | `admission_checks_head_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-011` | G11 | 565 §3、#624 §4.3 | required context 集合を `[]` (checks も `[]`) | `admission_checks_missing`、write 0 |
| `CANDIDATE-PACKPUB-ADM-012` | G12 | 565 §3 | `pack-check` の conclusion を `failure` | `admission_check_not_success`、write 0 |
| `CANDIDATE-PACKPUB-ADM-013` | G13 | 565 §1.1 | operation ID を既使用集合へ登録 | `admission_operation_replay`、write 0 |
| `CANDIDATE-PACKPUB-ADM-014` | G14 | 565 §1.1 | idempotency key を既使用集合へ登録 | `admission_idempotency_replay`、write 0 |
| `CANDIDATE-PACKPUB-ADM-015` | G15 | 565 §1.1 | PR number を既使用集合へ登録 | `admission_pr_replay`、write 0 |
| `CANDIDATE-PACKPUB-ADM-016` | G16 | 625 §2、626 §2.2-2 | observed PR branch を `pack/publication/other` | `admission_branch_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-017` | G17 | 625 §2、626 §2.2-2 | observed PR tree digest を別値 | `admission_tree_digest_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-018` | G18 | 565 §1.1、626 §2.2-6 | sealed staging record の manifest digest を別値 | `admission_staging_identity_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-019` | G19 | 565 §1.1 | staging digest を既使用集合へ登録 | `admission_staging_replay`、write 0 |
| `CANDIDATE-PACKPUB-ADM-020` | G20 | 565 §1.1 | expected main OID を既使用集合へ登録 | `admission_expected_main_replay`、write 0 |
| `CANDIDATE-PACKPUB-ADM-021` | G21 | 626 §2.2 | caller `reviewedHead` を観測値と別に供給 | `admission_caller_override`、write 0 |
| `CANDIDATE-PACKPUB-ADM-022` | G22 | 626 §2.2 | 観測束確定後に base OID field を改変 | `admission_observation_digest_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-023` | G23 | 565 §1.1、626 §2.2-3 | reviewer を `author-a` | `admission_review_author_conflict`、write 0 |
| `CANDIDATE-PACKPUB-ADM-024` | G24 | 565 §3、626 §2.2-4 | checks を `[{context: "unrelated", conclusion: "success"}]` | `admission_required_context_uncovered`、write 0 |
| `CANDIDATE-PACKPUB-ADM-025` | G25 | 565 §3 | repository ID を `424201` | `admission_repository_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-026` | G26 | 565 §3 | target ref を `refs/heads/release` | `admission_target_ref_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-027` | G27 | 565 §3 | ruleset ID を `78` | `admission_ruleset_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-ADM-028` | G28 | 565 §3 | installation ID を `9002` | `admission_installation_mismatch`、write 0 |

G03/G09/G11 は #624 の blocking 3 であり、G09 の形状契約は PLAN-L7-626 §2.2 が L7 で新設し
PLAN-REVERSE-626 R1 が上位へ backfill する。G01/G05、G06/G07、G11/G12/G24 は入力出所・形状/
equality・被覆が異なるため別 test を維持する。

## 4. indeterminate / deny / replay / write-zero / sealing

各行は 1 軸の stimulus だけを持つ。

| Candidate | Stimulus (1 軸) | Green oracle |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-ADM-029` | review observer が timeout | typed `indeterminate`、admission 0、全 remote write 0 |
| `CANDIDATE-PACKPUB-ADM-030` | checks observer の応答欠落 (`undefined`) | typed `indeterminate`、admission 0、全 remote write 0 |
| `CANDIDATE-PACKPUB-ADM-031` | repository observer の schema 不正 (ruleset ID が数値でない) | typed `indeterminate`、admission 0、全 remote write 0 |
| `CANDIDATE-PACKPUB-ADM-032` | G03 deny 時に approval port を観測 | approval consume 0、typed `deny`、全 remote write 0 |
| `CANDIDATE-PACKPUB-ADM-033` | 全 identity と観測 digest が一致する完全 replay | 同一 record digest を決定的再構成、mutation 0 |
| `CANDIDATE-PACKPUB-ADM-034` | 完全 replay から PR head だけを drift | typed `deny` (G02)、再構成 0、mutation 0 |
| `CANDIDATE-PACKPUB-ADM-035` | 正常系 fixture で admitted | admitted record 1、remote write ledger 0、CAS token mint 0、intent 実行 0 |
| `CANDIDATE-PACKPUB-ADM-036` | 正常系 admitted record の preimage を検査 | PLAN-L7-626 §2.3 の全項目 (repository ID/name、target ref、ruleset ID、required context、installation ID、expected main、receipt digest、PR identity、review、checks、merge-base、intent/approval binding) が preimage に含まれ、1 項目の除去で digest が変わる |

indeterminate を deny や success へ丸めず、成功観測を欠いたまま #627 の publish/CAS へ進めない。
admission 成功 fixture でも remote write ledger は 0 であり、#626 が副作用を発行しないことを
対照で確認する。

## 5. 実装 PR への昇格規則

実装 PR は 36 candidate を各 1 件以上の独立 test へ昇格し、実装時に正規の test ID
(`U-PACKPUB-ADM-*`) を割り当てる。typed reason、入力 digest、observer call 順、admission
record digest、approval/remote write count を直接検査する。恒真 assertion、dummy observer、既存
#625 nonce の流用、publish/CAS port の no-op 偽装では Green にしない。production source 変更、
CI/review evidence は実装 PR の責務であり、この draft pair-freeze では追加しない。
