---
plan_id: PLAN-L7-626-pack-publication-admission-binding
title: "PLAN-L7-626: Pack公開 admission observation binding"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-16
updated: 2026-09-17
owner: Claude control lane（文書是正、PO 判断 2026-09-16）・Codex Sol（非著者検収）
parent_design: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
pair_artifact: docs/test-design/harness/L7-pack-publication-admission-binding-test-design.md
backprop_decision: required
backprop_decision_reason: preparation
  receiptに無かったreview/check/base/freshnessの新しいadmission不変条件を、 Pack staged
  releaseの上位L6契約へ逆向きに束縛する必要がある。
agent_slots:
  - role: se
    slot_label: Luna worker - preparation receiptのread-only再観測とadmission record pure
      validation
  - role: qa
    slot_label: Terra - 39 guard の一軸 mutation、indeterminate 5
      軸、replay、write-zero、sealing / intent 感度の Red oracle (candidate 55)
  - role: tl
    slot_label: Codex Sol - 39 guard の契約引用・oracle 対応と sealing 所有の非著者検収 (rev 2 以降。rev
      1 は Claude Opus)
generates:
  - artifact_path: docs/plans/PLAN-L7-626-pack-publication-admission-binding.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
  requires: []
  references:
    - docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
    - docs/plans/PLAN-L7-625-pack-publication-preparation.md
    - docs/test-design/harness/L7-pack-publication-preparation-test-design.md
    - docs/test-design/harness/L7-pack-publication-atomic-ref-cas-test-design.md
    - docs/plans/PLAN-REVERSE-626-pack-publication-admission-binding-backfill.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/624
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/626
review_evidence: []
status: draft
github_issue_id: 626
admission_receipt:
  schema_version: v2
  receipt_id: certificate:ee8354169dcc7c5b554ec382564e2f3c
  command_id: plan-revise:issue-626:pr645-plan:r4:b993b11642fd
  admitted_at: 2026-09-17T01:42:39.583Z
  source_digest: sha256:35c52109e1792b2f62242cc0b0eb2e8f0c189e58acd8f00bd114a4c1cc047626
  decision_digest: sha256:4421e52f49003c9ed292d845805c587e594619b7a1a68463f4e89c1e42d21b3d
  receipt_digest: sha256:d5ddf53212ffa668830397a2e8f560cac82cc68912d9747dfa67827ed8efabc3
  binding:
    path: docs/plans/PLAN-L7-626-pack-publication-admission-binding.md
    plan_id: PLAN-L7-626-pack-publication-admission-binding
    asset_id: plan:529eea3e2017a6d17049746ae353398d
    revision: 4
    content_digest: sha256:35c52109e1792b2f62242cc0b0eb2e8f0c189e58acd8f00bd114a4c1cc047626
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 626
    episode_id: E4-626-pack-publication-admission-binding
    projection_digest: sha256:4e5c8b8b398076d56a72deb696afa871b9c259e667c9bb65f22ef2816ca1d8b4
  origin:
    plan_id: PLAN-L7-565-pack-publication-atomic-ref-cas
    revision: 1
    digest: sha256:efd67cb89dbf6e187fd998c062972332a868e868ee5b70993be4080a9ccb6647
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-626-pack-publication-admission-binding
    target_revision: 4
    phase: forward_merge
  escape_reason: "Issue #626 PR #645 rev 4: 非著者 Codex Sol review r2 (receipt
    1b240cb7) の FLAG 3 件を Claude control lane が是正。approval nonce 未消費 guard
    G39、intent identity 6 構成要素の一軸感度 (candidate 050–055)、Reverse / slot の scope を
    39 guard へ更新。guard 39、candidate 55。publish/CAS は引き続き対象外。"
---

# PLAN-L7-626: Pack公開 admission observation binding

## 1. 目的と境界

Issue #626 は、#625 が発行する `publication_preparation` receipt を唯一の入力として、
repository / authority identity、PR identity、non-author review、ruleset が要求する required
check、merge-base、staging identity、operation/idempotency freshness を read-only に再観測し、
`publication_admission` record へ束縛する契約を固定する。admission は全 predicate が同時に
成立した場合だけ admitted record を返す pure validation であり、remote、Pack checkout、
filesystem staging、branch/PR、main、Release、tag、asset、channel pointer を変更しない。

本 PLAN と pair test-design は実 GitHub の PR、実 preparation receipt、既存の plan-admission
record を fixture identity にしない。fixture は pair test-design §2 が定義する合成 immutable
fixture だけであり、PR #639 や canonical receipt sequence 272 (`certificate:d60d9607…`) は
PLAN-L7-625 文書の admission record であって `publication_preparation` receipt ではない。

## 2. 入力と再観測束縛

### 2.1 preparation receipt

receipt は #625 §2 が固定する次の値だけを保持し、caller が不足値を補完してはならない。

- sealed staging の `treeDigest` と `manifestDigest`
- expected Pack main OID
- deterministic publication branch 名
- operation ID、idempotency key
- read-back で確定した PR number、exact head OID、base OID、PR tree digest

`preparationReceiptDigest` は receipt の field ではなく、atomic no-clobber で persist された
receipt bytes の canonical 表現から admission 側が導出する `sha256:` digest である。Pack entry
集合 (path/mode/size/content digest) は receipt に含まれず、admission は staging identity を
tree/manifest digest でのみ束縛する。receipt は準備時の branch/PR mutation の証跡であり、review
や admission の approval/nonce を含めない。#625 の preparation nonce、journal、token を #626 が
consume または再利用することは禁止する (#625 §2、PLAN-L7-565 §1.1)。

receipt が存在しない、schema 不正 (必須 field 欠落 / 形状不正)、または receipt の
`read_back_observation` が指していない PR (外部手作り PR) は typed deny であり、observer を
呼ばずに停止する。

admission が receipt 以外に受け取る入力は次の 3 つだけである。

- (a) publication configuration が固定する期待値: Pack repository ID / full name、target ref、
  ruleset ID、期待 required status check context 集合 (1 件以上)、publication CAS authority の
  App installation ID。PLAN-L7-565 §3 の authority 分離契約の一部であり、caller が実行時に
  上書きできない。
- (b) publication mutation approval の参照: approval nonce と、その nonce が束縛された
  operation ID。preparation nonce 集合とは別集合であり、admission は nonce を消費しない。
- (c) read-only observer (§2.2)。

### 2.2 read-only observation

admission は同じ operation の read-only observer から次を一度の検証束へ取り込む。

1. Repository / authority observation (PLAN-L7-565 §3): Pack repository ID と full name、
   target ref (Pack main)、target ref を保護する ruleset ID とその ruleset が要求する required
   status check context 集合、publication CAS authority の App installation ID。scalar 値は
   §2.1 (a) の期待値と byte 一致し、observed required context 集合は期待 required context 集合と
   集合として一致する (過不足いずれも不一致)。caller supplied login や `gh auth status` 表示を
   identity 証明にしない。
2. PR observation: receipt の PR number、branch 名、head OID、base OID、tree digest。
3. Review observation: 同じ PR の reviewed head、結論 `approved`、reviewer identity、non-author
   closing review receipt digest。reviewer は PR author と同一であってはならない。
4. Required checks observation: 同じ reviewed head に対する check 集合。ruleset が要求する
   required context 集合は 1 件以上であり、その全 context が `conclusion: success` の check で
   覆われる。required でない check の成否は判定に使わない。空の required 集合、未観測 context、
   `success` 以外の結論は成功と解釈しない。
5. Merge-base observation: PR head と expected main の merge-base が sealed expected main OID
   と byte 一致する。
6. Staging identity re-observation: receipt の staging tree/manifest digest、expected main OID、
   branch 名を sealed staging record から再観測し、receipt 値と byte 一致する。
7. Freshness observation (PLAN-L7-565 §1.1): operation ID と idempotency key が未使用であり、
   receipt の PR が別 operation ID、別 staging digest (tree + manifest)、別 expected main OID の
   admission に一度も使用されていない。expected main OID や staging digest そのものは globally
   single-use ではなく、別 PR を同じ main から独立に準備することは妨げない。「未使用」は
   §4 の完全一致 replay (既存 record の identity digest が今回の観測束 digest と一致) を例外とし、
   その場合だけ同一 record の再構成として通過する。
8. Approval observation (PLAN-L7-565 §1.1): §2.1 (b) の各 approval nonce が本 operation ID に
   束縛され、未消費であり、preparation nonce 集合に属さない。

publication intent identity は caller 入力ではなく、operation ID、repository ID、target ref、
expected main OID、reviewed head OID、preparation receipt digest の canonical digest として
admission が導出する。mutation approval binding は各 approval nonce をこの intent identity へ
結び付けた canonical digest である。

closing review receipt digest の形状は本 PLAN が L7 契約として新設する: `sha256:` + 64 lowercase
hex (`/^sha256:[0-9a-f]{64}$/`)。上位 PLAN-L7-565 §1.1/§3 はこの形状を固定しておらず、Reverse
R1 (PLAN-REVERSE-626) で上位契約へ backfill する。

観測された値は caller の `reviewedHead`、`baseOid`、`checks`、`closingReceiptDigest` で
上書きできず、caller 値が観測値と異なれば typed deny とする。観測値全体 (単独 field では
ない) の canonical digest を admitted record の preimage へ束縛し、1 field でも変われば record
digest が変わる。review/check/merge-base/repository/staging の read failure、timeout、応答欠落、
schema 不正は成功へ丸めず `indeterminate` として停止する。

### 2.3 admitted record が seal する項目

PLAN-L7-565 §1.1/§3 が publication admission に割り当てる sealing 項目は、すべて本 PLAN の
admitted record が所有する。#627 へ渡すのは admitted record だけであり、#627 は record の
seal 済み値を再観測・再 seal しない。

| 項目 | 出所 | seal の意味 |
| --- | --- | --- |
| repository ID / full name、target ref | §2.2-1 | CAS の対象 repository / ref を固定 |
| ruleset ID、required context 集合 | §2.2-1 | 「required check 完了」の定義を ruleset に束縛 |
| publication CAS authority installation ID | §2.2-1 | #627 が mint する CAS token の installation を固定 (token 自体は seal しない) |
| expected main OID、preparation receipt digest | §2.1 | lease の期待値と入力 receipt を固定 |
| reviewed PR number、exact head OID、base OID、tree digest | §2.2-2 | fast-forward 対象 head を固定 |
| review 結論、reviewer identity、closing receipt digest | §2.2-3 | non-author review の証跡を固定 |
| required check 結論 | §2.2-4 | context ごとの `success` を固定 |
| merge-base | §2.2-5 | expected main との整合を固定 |
| publication intent identity | §2.2 導出 | operation / repository / target ref / expected main / reviewed head / receipt digest の canonical digest。#627 はこの identity の intent だけを実行する |
| mutation approval binding | §2.1 (b)、§2.2-8 | 各 approval nonce → intent identity の canonical digest。approval の consume は #627 |
| observation bundle digest | §2.2 | 上記全項目の canonical digest |

admission は approval を消費せず、token を mint せず、intent を実行しない。

## 3. guard の正本

#624 が報告した `src/setup/pack-publication-adapter.ts` の 15 条件 (G01–G15) を各々独立した
一軸 deny oracle として引き継ぎ、§2 の predicate のうち 15 条件が閉じていない 24 条件を
G16–G39 として追加する。1 行の mutant は fixture の 1 要素だけを変える。各行は契約引用、一軸 mutant、赤化テスト (pair test-design の
candidate)、deny reason、冗長判定を持つ。#624 §4 の要求どおり、生存 3 件 (L1293 / L1299 /
L1300) についても独立と判定した理由を同じ表に書く。remote write 境界は全行 0 である。

| guard | 契約引用 | 契約 predicate | 一軸 mutant | 赤化テスト | deny reason | 冗長判定 |
| --- | --- | --- | --- | --- | --- | --- |
| G01 (旧L1293) | 565 §1.1「receiptが指すPR」、本 §2.2-2 | observed PR number = receipt PR number | PR number を別値 | `CANDIDATE-PACKPUB-ADM-001` | `admission_pr_mismatch` | 独立: G05 は review receipt 側の PR、G01 は PR observation 側の出所を束縛する |
| G02 (旧L1294) | 565 §1.1「review後のhead更新はdeny」 | observed PR head = receipt head | review 後に PR head を更新 | `CANDIDATE-PACKPUB-ADM-002` | `admission_head_mismatch` | 独立: G07 は review が指す head、G02 は PR の現在 head を束縛する |
| G03 (旧L1295) | 565 §1.1「PR head/baseが現在値と一致」、#624 §4.1 | observed PR base = receipt base OID | base OID を別値 | `CANDIDATE-PACKPUB-ADM-003` | `admission_base_mismatch` | 独立: G04 の merge-base は別 port の観測であり、base が変わっても merge-base は一致し得る |
| G04 (旧L1298) | 565 §3「merge-baseがexpected main」 | merge-base = expected main OID | merge-base を別値 | `CANDIDATE-PACKPUB-ADM-004` | `admission_merge_base_mismatch` | 独立: base OID 一致でも history が分岐すれば merge-base は変わる |
| G05 (旧L1299) | 本 §2.2-3「同じ PR の review」 | closing review の PR number = receipt PR number | review receipt の PR を別値 | `CANDIDATE-PACKPUB-ADM-005` | `admission_review_pr_mismatch` | 独立: G01 が成立しても別 PR の review receipt を差し込める |
| G06 (旧L1300) | 本 §2.2-3、Git SHA-1 OID 形状 | reviewed head は 40 lowercase hex | malformed / SHA-256 形状 | `CANDIDATE-PACKPUB-ADM-006` | `admission_review_head_invalid` | 独立: G07 は equality であり、malformed 値同士の一致を equality だけでは弾けない |
| G07 (旧L1301) | 565 §1.1「review済みhead」 | review head = receipt head | 別 head への review | `CANDIDATE-PACKPUB-ADM-007` | `admission_review_head_mismatch` | 独立: 形状が正しい別 OID を G06 は通す |
| G08 (旧L1302) | 565 §1.1「non-author review完了」 | review conclusion = `approved` | `changes_requested` / `commented` | `CANDIDATE-PACKPUB-ADM-008` | `admission_review_not_approved` | 独立: head 一致でも結論が非承認であり得る |
| G09 (旧L1303) | 本 §2.2 形状契約 (L7 新設、Reverse R1 で backfill)、#624 §4.2 | closing receipt digest ~ `/^sha256:[0-9a-f]{64}$/` | 短縮 / 別 prefix / uppercase | `CANDIDATE-PACKPUB-ADM-009` | `admission_review_receipt_invalid` | 独立: digest は record preimage に封入されるため形状検査が唯一の制約 |
| G10 (旧L1304) | 本 §2.2-4「同じ reviewed head」 | checks observation head = review head | 別 head の checks | `CANDIDATE-PACKPUB-ADM-010` | `admission_checks_head_mismatch` | 独立: 結論が全 success でも別 head の証跡は無効 |
| G11 (旧L1305) | 565 §3「required review/check結論」、#624 §4.3 | observed required context 集合が 1 件以上 | observed required context 集合だけを `[]` へ (checks は正常系のまま) | `CANDIDATE-PACKPUB-ADM-011` | `admission_checks_missing` | 独立: 空集合では G12/G24 の全称判定が vacuous に真になる。期待集合との一致は G31 |
| G12 (旧L1306) | 565 §3、本 §2.2-4 | required context を覆う全 check の conclusion = `success` | 1 件を `failure` へ | `CANDIDATE-PACKPUB-ADM-012` | `admission_check_not_success` | 独立: 非空・context 一致でも結論が失敗であり得る |
| G13 (旧L1307) | 565 §1.1 freshness、本 §2.2-7 | operation ID 未使用 (§4 完全一致 replay を除く) | 別観測束の既存 admission が同じ operation ID を使用 | `CANDIDATE-PACKPUB-ADM-013` | `admission_operation_replay` | 独立: key/PR が新規でも operation の再利用は別経路 |
| G14 (旧L1308) | 565 §1.1 freshness、本 §2.2-7 | idempotency key 未使用 (§4 完全一致 replay を除く) | 別観測束の既存 admission が同じ key を使用 | `CANDIDATE-PACKPUB-ADM-014` | `admission_idempotency_replay` | 独立: operation ID と key は別に発番される |
| G15 (旧L1309) | 565 §1.1「別operationのadmissionに未使用」 | receipt の PR が別 operation ID の admission に未使用 | 同じ PR を別 operation ID で admitted 済みにする | `CANDIDATE-PACKPUB-ADM-015` | `admission_pr_replay` | 独立: 新 operation が既存 PR を再利用する経路を閉じる |
| G16 | 625 §2、本 §2.2-2 | observed PR branch = receipt branch 名 | branch 名を別値 | `CANDIDATE-PACKPUB-ADM-016` | `admission_branch_mismatch` | 独立: head/base 一致でも別 branch 上の同一 commit があり得る |
| G17 | 625 §2、本 §2.2-2 | observed PR tree digest = receipt tree digest | tree digest を別値 | `CANDIDATE-PACKPUB-ADM-017` | `admission_tree_digest_mismatch` | 独立: head OID は commit identity、tree digest は sealed 内容の identity |
| G18 | 565 §1.1「staging identityをread-onlyで再観測」、本 §2.2-6 | 再観測 manifest digest = receipt manifest digest | sealed staging record の manifest digest を別値 | `CANDIDATE-PACKPUB-ADM-018` | `admission_staging_manifest_mismatch` | 独立: receipt 内部整合だけでは sealed record との drift を検出できない |
| G19 | 565 §1.1「別staging digestのadmissionに未使用」 | receipt の PR が別 staging digest の admission に未使用 | 同じ PR を別 staging digest で admitted 済みにする | `CANDIDATE-PACKPUB-ADM-019` | `admission_pr_staging_conflict` | 独立: G15 は operation ID の差だけを見る |
| G20 | 565 §1.1「別expected main OIDのadmissionに未使用」 | receipt の PR が別 expected main OID の admission に未使用 | 同じ PR を別 expected main OID で admitted 済みにする | `CANDIDATE-PACKPUB-ADM-020` | `admission_pr_expected_main_conflict` | 独立: G19 は staging digest の差だけを見る。expected main OID 自体は single-use ではない |
| G21 | 本 §2.2「caller 上書き禁止」 | caller 供給値 ≠ 観測値なら deny | caller の `reviewedHead` を観測値と別に供給 | `CANDIDATE-PACKPUB-ADM-021` | `admission_caller_override` | 独立: 観測が全一致しても caller 値の混入を無視すれば record が偽装される |
| G22 | 本 §2.2「観測束の digest 束縛」 | record digest preimage = 観測束 canonical digest | 観測後に 1 field を改変 | `CANDIDATE-PACKPUB-ADM-022` | `admission_observation_digest_mismatch` | 独立: 個別 guard 通過後の改変を閉じる唯一の predicate |
| G23 | 565 §1.1「non-author review」、本 §2.2-3 | reviewer identity ≠ PR author | author 自身の approved review | `CANDIDATE-PACKPUB-ADM-023` | `admission_review_author_conflict` | 独立: G08 は結論しか見ない |
| G24 | 565 §3「ruleset ID」、本 §2.2-4 | 全 required context が success check で覆われる | required context 1 件を欠く (無関係 check だけ success) | `CANDIDATE-PACKPUB-ADM-024` | `admission_required_context_uncovered` | 独立: G11/G12 は非空と結論を見るが context 名の被覆を見ない |
| G25 | 565 §3「repository ID/name」 | observed repository ID = 期待 repository ID | repository ID を別値 | `CANDIDATE-PACKPUB-ADM-025` | `admission_repository_id_mismatch` | 独立: 同名 fork や移転で ID が変わる経路を閉じる。full name は G35 |
| G26 | 565 §3「target ref」 | observed target ref = sealed ref | target ref を別 branch | `CANDIDATE-PACKPUB-ADM-026` | `admission_target_ref_mismatch` | 独立: repository 一致でも ref が違えば CAS 対象が変わる |
| G27 | 565 §3「ruleset ID」 | observed ruleset ID = sealed ruleset ID | ruleset ID を別値 | `CANDIDATE-PACKPUB-ADM-027` | `admission_ruleset_mismatch` | 独立: required context 集合の定義元を固定する |
| G28 | 565 §3「installation ID」 | observed CAS authority installation ID = 期待値 | installation ID を別値 | `CANDIDATE-PACKPUB-ADM-028` | `admission_installation_mismatch` | 独立: preparation authority の installation を渡す経路 (authority mismatch) を閉じる |
| G29 | 565 §1.1「mutation approvalsをseal」、本 §2.2-8 | 各 approval nonce の束縛先 = 本 operation ID | approval nonce 1 件を別 operation ID へ束縛 | `CANDIDATE-PACKPUB-ADM-029` | `admission_approval_binding_mismatch` | 独立: 観測束が全一致でも approval が別 operation のものであり得る |
| G30 | 565 §1.1「preparationのnonceを後者へ再利用しない」 | approval nonce が preparation nonce 集合に属さない | approval nonce 1 件を preparation nonce と同値に | `CANDIDATE-PACKPUB-ADM-030` | `admission_approval_set_conflict` | 独立: G29 は束縛先 operation を見るが集合の帰属を見ない |
| G31 | 565 §3「ruleset ID」、本 §2.2-1 | observed required context 集合 = 期待 required context 集合 | observed 集合を別の非空集合 `["other-check"]` へ (その context の success check も供給) | `CANDIDATE-PACKPUB-ADM-031` | `admission_required_context_set_mismatch` | 独立: G11/G12/G24 は observed 集合を基準に判定するため、集合ごと差し替える偽装を見ない |
| G32 | 565 §1.1、本 §2.2-6 | 再観測 staging tree digest = receipt tree digest | sealed staging record の tree digest を別値 | `CANDIDATE-PACKPUB-ADM-032` | `admission_staging_tree_mismatch` | 独立: G18 は manifest digest だけを見る |
| G33 | 565 §1.1、本 §2.2-6 | 再観測 expected main OID = receipt expected main OID | sealed staging record の expected main を別値 | `CANDIDATE-PACKPUB-ADM-033` | `admission_staging_expected_main_mismatch` | 独立: G04 は merge-base、G33 は sealed record との整合 |
| G34 | 565 §1.1、本 §2.2-6 | 再観測 branch 名 = receipt branch 名 | sealed staging record の branch 名を別値 | `CANDIDATE-PACKPUB-ADM-034` | `admission_staging_branch_mismatch` | 独立: G16 は PR observation 側、G34 は sealed record 側 |
| G35 | 565 §3「repository ID/name」 | observed repository full name = 期待 full name | full name を別値 (ID は同値) | `CANDIDATE-PACKPUB-ADM-035` | `admission_repository_name_mismatch` | 独立: rename 後の同一 ID を弾く |
| G36 | 本 §2.1 | preparation receipt が存在する | receipt 入力を欠落 | `CANDIDATE-PACKPUB-ADM-036` | `admission_receipt_missing` | 独立: observer を呼ぶ前に停止する唯一の predicate |
| G37 | 本 §2.1 | preparation receipt が #625 §2 の schema に適合 | receipt の PR number field を欠落 | `CANDIDATE-PACKPUB-ADM-037` | `admission_receipt_invalid` | 独立: 存在しても schema 不正な receipt を G36 は通す |
| G38 | 565 §1.1「外部で手作りしたbranch/PR…はtyped deny」、本 §2.1 | receipt の `read_back_observation` が observed PR を指す | receipt の read_back_observation を別 PR の journal に差替え | `CANDIDATE-PACKPUB-ADM-038` | `admission_pr_unprepared` | 独立: PR number が一致 (G01) しても preparation journal 由来でない PR を閉じる |
| G39 | 565 §1.1「mutation approvalsをseal」、本 §2.2-8 | 各 approval nonce が未消費 | approval nonce 1 件を消費済みに (束縛先・集合帰属は正常系のまま) | `CANDIDATE-PACKPUB-ADM-039` | `admission_approval_consumed` | 独立: G29/G30 は束縛先と集合帰属を見るが消費状態を見ない |

したがって #624 の blocking 3 (G03/G09/G11) は補助的な重複ではなく独立した必須 predicate であり、
生存 3 件 (G01/G05/G06) も上記の理由で独立である。39 guard に冗長なものは無い。

## 4. 判定と no-write 境界

- 全 39 guard が成立したときだけ `publication_admission` を `admitted` とし、§2.3 の項目を
  seal した record を返す。
- 値の不一致、replay、required context 欠落 / 集合不一致、receipt 欠落 / malformed、手作り PR、
  caller 上書き、reviewer 同一、approval 束縛不一致 / 消費済みは typed `deny`。read-only observer が unavailable、timeout、応答欠落、schema 判定不能の場合は
  typed `indeterminate`。
- deny/indeterminate のどちらも admitted record、approval consume、publication mutation へ
  進めず、main/Release/tag/asset/pointer/branch/PR の remote write count は 0。#626 の実装は
  remote port を呼び出さず、write-zero を spy ledger で検証可能にする。
- 成功した admission も #627 の publish/CAS を実行しない。admitted record を返した後の
  publication side effect、main lease、CAS token mint、Release visibility、canary pointer は
  #627/#565 へ残す。
- 完全一致 replay: 既存 admission record の識別子 (operation ID、idempotency key、PR number) が
  一致し、かつ既存 record の観測束 digest が今回の観測束 digest と byte 一致する場合、G13/G14 の
  freshness predicate は「同一 record の再構成」として成立し、同一 admission record を決定的に
  再構成する (新規 record 0、mutation 0)。識別子が一致して観測束 digest が異なる replay は
  G13 (operation ID) の deny であり再構成しない。preparation receipt 無し (G36)、外部手作り PR
  (G38) は deny、観測不能時の再構成は indeterminate とする。

## 5. 後続との分離

#626 は preparation receipt の read-only observation binding、admitted record の sealing、pure
admission validation だけを所有する。#625 の準備生成、#627 の publish deny/main CAS/approval
consume/CAS token mint、Release/tag/asset/pointer、production credential、remote 実装、既存
adapter の大規模再構成は変更しない。

## 6. 完了条件

39 guard の一軸 Red oracle、indeterminate 5 軸 (review / checks / repository / merge-base /
staging observer)、deny 時 approval consume 0、完全一致 replay、drift replay、admitted 時
write-zero、sealing 完全性、intent identity 6 構成要素の一軸感度を pair test-design へ 1 対 1 で固定し、PLAN
lint、admission-check、readability/plan-doc 対象テストを同一 exact HEAD へ束縛する。実装 PR で
初めて `U-PACKPUB-ADM-*` を共有 registry へ昇格し、non-author closing review を取得する。

## 7. 改訂記録

- rev 2 (2026-09-17、Claude control lane): PR #636 exact head `c36c6a9d` に対する非著者 Claude
  Opus review (receipt `71c7b9bd…`、FLAG blocking 10、全て PR 内軽作業) を是正。§2.1 を #625 §2
  の receipt field へ整合 (Pack entry 集合を削除、receipt digest を導出値に定義)、§1 / pair
  test-design §2 の fixture を合成 immutable fixture へ置換、§2.3 で PLAN-L7-565 §1.1/§3 の sealing
  項目の所有を明記、required check を ruleset required context へ束縛 (G24)、G09 の形状契約を本
  PLAN の L7 新設契約として引用、guard 表へ契約引用 / 赤化テスト / 冗長判定列を追加、§2.2/§4 の
  predicate を G16–G28 として oracle 化、多軸 candidate を一軸へ分割、admission record を
  canonical `plan revise` で再発行、tl slot_label を補完。author family は claude へ移り、非著者
  review は Codex Sol が行う (PO 判断 2026-09-16)。
- rev 3 (2026-09-17、Claude control lane): PR #645 exact head `c01cebb8` に対する非著者 Codex Sol
  review (receipt `d5e923c4…`、FLAG blocking 5、全て PR 内軽作業) を是正。§2.1 に admission 入力
  (configuration 期待値 / approval 参照 / observer) と receipt 欠落・schema 不正・手作り PR の deny を
  定義、§2.2-8 と intent identity / approval binding の導出を追加、required context 集合を期待集合と
  集合一致で束縛 (G31)、freshness を PLAN-L7-565 §1.1 どおり「同一 PR を別 identity で再利用しない」
  へ修正し expected main OID / staging digest の globally single-use を撤回 (G19/G20)、完全一致
  replay を G13/G14 の例外として定義 (§4)、G11/G18/G25 を一軸へ分解 (G32–G35)、G29/G30 (approval)、
  G36–G38 (receipt / 手作り PR) を追加。guard 38、candidate 49。
- rev 4 (2026-09-17、Claude control lane): PR #645 exact head `b993b116` に対する Codex Sol review r2
  (receipt `1b240cb7…`、FLAG blocking 3、全て PR 内軽作業) を是正。approval nonce 未消費の一軸 guard
  G39 (`admission_approval_consumed`) を追加、intent identity 6 構成要素の一軸感度を candidate
  050–055 に展開、Reverse R2 / qa slot と本 PLAN qa/tl slot の旧 scope 記述を 39 guard へ更新。
  guard 39、candidate 55。
