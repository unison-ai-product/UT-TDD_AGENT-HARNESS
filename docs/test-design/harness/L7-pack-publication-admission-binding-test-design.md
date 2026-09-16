---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-626-pack-publication-admission-binding
---

# L7 Pack公開 admission observation binding test design

## 1. 境界

このpair-freezeは、#625 の preparation receipt と read-only PR/review/check/merge-base
observerを pure admission validatorへ渡す契約だけを対象にする。実GitHub credential、remote
mutation、branch/PR作成、main CAS、Release、tag、asset、channel pointerは実行しない。
実装PRでは in-memory observation port と spy write ledger を使い、deny と indeterminate の
いずれも remote write 0 を直接検査する。

## 2. 固定fixture identity

- preparation receipt: #625 canonical `certificate:7018d3e985a7ebf6e9cd7d90b29e2ba9`
- preparation PR observation: PR #635、base `main`、exact head
  `fced4a1416f770f2ee3935024068eaa512c4dcd6`
- staging identity: receiptのtree/manifest/entry digest、expected main OID、branch、PR
  number/head/base/treeを1つのimmutable fixtureとして持つ
- review/check fixture: receiptのPR headへ結び付いた non-author closing review、
  `approved`、`sha256:` + 64 lowercase hex digest、1件以上の required check `success`

fixtureから不足する値をworktree、Pack checkout、GitHub API、既存のpublication receiptで補完しない。

## 3. 15 guard mutation matrix

各行は他のpredicateを成立させたfixtureへ一軸だけを注入する。expected resultは admission
record 0、typed deny、remote write 0 であり、別guardの失敗をGreenにしない。

| Candidate | Guard / mutant | 独立Green oracle | canonical test ID |
| --- | --- | --- | --- |
| `CANDIDATE-PACKPUB-ADM-001` | G01 PR numberを変異 | `admission_pr_mismatch`、write 0 | `U-PACKPUB-ADM-001` |
| `CANDIDATE-PACKPUB-ADM-002` | G02 review後headを変異 | `admission_head_mismatch`、write 0 | `U-PACKPUB-ADM-002` |
| `CANDIDATE-PACKPUB-ADM-003` | G03 PR base OIDを変異 | `admission_base_mismatch`、write 0 | `U-PACKPUB-ADM-003` |
| `CANDIDATE-PACKPUB-ADM-004` | G04 merge-baseを変異 | `admission_merge_base_mismatch`、write 0 | `U-PACKPUB-ADM-004` |
| `CANDIDATE-PACKPUB-ADM-005` | G05 review PRを変異 | `admission_review_pr_mismatch`、write 0 | `U-PACKPUB-ADM-005` |
| `CANDIDATE-PACKPUB-ADM-006` | G06 reviewed headをmalformedへ変異 | `admission_review_head_invalid`、write 0 | `U-PACKPUB-ADM-006` |
| `CANDIDATE-PACKPUB-ADM-007` | G07 review headを別OIDへ変異 | `admission_review_head_mismatch`、write 0 | `U-PACKPUB-ADM-007` |
| `CANDIDATE-PACKPUB-ADM-008` | G08 review conclusionを変異 | `admission_review_not_approved`、write 0 | `U-PACKPUB-ADM-008` |
| `CANDIDATE-PACKPUB-ADM-009` | G09 closing receipt digest shapeを変異 | `admission_review_receipt_invalid`、write 0 | `U-PACKPUB-ADM-009` |
| `CANDIDATE-PACKPUB-ADM-010` | G10 checks headを変異 | `admission_checks_head_mismatch`、write 0 | `U-PACKPUB-ADM-010` |
| `CANDIDATE-PACKPUB-ADM-011` | G11 checksを空配列へ変異 | `admission_checks_missing`、write 0 | `U-PACKPUB-ADM-011` |
| `CANDIDATE-PACKPUB-ADM-012` | G12 required check 1件をfailureへ変異 | `admission_check_not_success`、write 0 | `U-PACKPUB-ADM-012` |
| `CANDIDATE-PACKPUB-ADM-013` | G13 operation IDを既使用へ変異 | `admission_operation_replay`、write 0 | `U-PACKPUB-ADM-013` |
| `CANDIDATE-PACKPUB-ADM-014` | G14 idempotency keyを既使用へ変異 | `admission_idempotency_replay`、write 0 | `U-PACKPUB-ADM-014` |
| `CANDIDATE-PACKPUB-ADM-015` | G15 PR numberを既使用へ変異 | `admission_pr_replay`、write 0 | `U-PACKPUB-ADM-015` |

G03/G09/G11 は #624 の blocking 3であり、各々契約引用をPLAN-L7-565 §1.1/§3とこの
pairの§2へ固定する。G01/G05、G06/G07も入力出所と形状/equalityが異なるため別testを維持する。

## 4. deny / indeterminate / write-zero

| Candidate | Stimulus | Green oracle | canonical test ID |
| --- | --- | --- | --- |
| `CANDIDATE-PACKPUB-ADM-016` | observer timeout、応答欠落、schema不正 | typed `indeterminate`、admission 0、全remote write 0 | `U-PACKPUB-ADM-016` |
| `CANDIDATE-PACKPUB-ADM-017` | 15 guardの任意deny | typed `deny`、approval consume 0、全remote write 0 | `U-PACKPUB-ADM-017` |
| `CANDIDATE-PACKPUB-ADM-018` | 全identityと観測digestが一致する完全replay / 1軸drift replay | 完全一致だけ同一recordを再構成、driftはdeny、mutation 0 | `U-PACKPUB-ADM-018` |

indeterminateをdenyやsuccessへ丸めず、成功観測を欠いたまま #627 の publish/CASへ進めない。
admission成功fixtureでも remote write ledger は0であり、#626が副作用を発行しないことを
対照で確認する。

## 5. 実装PRへの昇格規則

実装PRは18 candidateを各1件以上の独立testへ昇格し、typed reason、入力digest、observer
call順、admission record digest、approval/remote write countを直接検査する。恒真assertion、
dummy observer、既存#625 nonceの流用、publish/CAS portのno-op偽装ではGreenにしない。
共有 `L7-unit-test-design.md` の `U-*` 登録、production source変更、CI/review evidenceは
実装PRの責務であり、このdraft pair-freezeでは追加しない。
