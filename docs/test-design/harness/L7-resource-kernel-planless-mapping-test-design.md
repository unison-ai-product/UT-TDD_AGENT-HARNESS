---
artifact_type: test_design
layer: L5
executed_at_layer: L7
status: draft
pair_artifact: docs/design/harness/L5-detailed-design/internal-processing.md
parent_doc: docs/design/harness/L5-detailed-design/internal-processing.md
---

# Resource Kernel PLAN 非依存 L5-L8 対応検査 — L7 test design

## 目的と状態

本書は、[internal-processing.md](../../design/harness/L5-detailed-design/internal-processing.md) 付録D.5の
Resource Kernel契約索引と、[L8-integration-test-design.md](./L8-integration-test-design.md)の
`IT-RGK-PHYS-001..042` freeze表との双方向・全数対応、およびfixture manifestの42件の契約参照を、
`docs/plans/`を入力にせず検査する候補oracleを定義する。
これは未実装の目標契約であり、candidate IDは正式昇格済みIDではない。本書追加だけで既存lint/testが
PLAN非依存になった、あるいはPLAN退役を完了したとは扱わない。

本書の完了受入条件は、対象gateとその回帰testが`docs/plans/` path自体の無いsnapshotで通ること
(`docs/plans` tree absent = 0 files) である。空ディレクトリの存在、PLANのstub化、plan参照のfallbackは受入としない。
実装時はcanonical inputを付録D.5とL8 freeze表に限定し、旧PLAN pathを開かず、代替正本としても使わない。

## 固定する集合と不変条件

- L5契約IDは`C-RGK-01..58`の58件exact集合とする。欠番・未知ID・重複を許さない。
- L8 oracle IDは`IT-RGK-PHYS-001..042`の42件exact集合とする。欠番・未知ID・重複を許さない。
- 各L5契約に1件以上の既知L8 oracleを対応させ、対応先外IDを持たない。各L8 oracleも少なくとも1契約から参照される。双方向の孤児は0。
- L8 freeze属性のlane表/宣言との集合一致、lane件数、fixture対応など既存の検査範囲はこの変更で弱めない。
- 表の行・契約説明・oracle対応を再設計しない。付録D.5の58行は既存表と内容同一のまま保持する。

## 候補オラクル

| Candidate ID | 入力 | 期待するGreen不変条件 | 変異/旧動作でのRed |
|---|---|---|---|
| `CANDIDATE-U-RGKPAIR-PLANLESS-001` | `docs/plans/` pathが存在しない一時snapshotに付録D.5とL8 freeze表だけを置き、対応gateを呼ぶ | gateがこの2 canonical documentだけから入力を読み、成功する。読み取り対象記録にPLAN pathが無い | PLAN-L5-25の固定pathを開く、またはPLANへfallbackすると、対象path欠落でfailする |
| `CANDIDATE-U-RGKPAIR-PLANLESS-002` | 上と同じsnapshotで、L5表のID・L8表のID・mapping参照を基準集合から一要素ずつ欠落/重複/未知IDへ変異する | それぞれの欠陥を特定ID付きでfail-closeし、PLAN有無に結果が左右されない | Set化で重複を吸収、未知IDを無視、片方向だけを比較、空sectionを空集合同士としてPASSする |
| `CANDIDATE-U-RGKPAIR-PLANLESS-003` | 契約IDは全て残し、単独で参照されるoracle `004` を指す唯一のedge (`C-RGK-34`) を、既知oracle `028` へ差替える。また別入力ではL8の該当oracle行だけを除去する | 対応差分と両方向の孤児を検出する。正しい表では58契約・42 oracleの全行を検査する | 集合全体の件数だけ比較し、意味のあるpair edge差分または単独被覆oracle `004` の孤児化を見逃す |
| `CANDIDATE-U-RGKPAIR-PLANLESS-004` | PLANを含まないsnapshotにD.5/D.6、L8 freeze表、変更していないfixture manifestを置き、fixture-manifest checkを呼ぶ。manifestの各`contract_ref`を付録D.6の対応見出しへ解決する | 現行の42件の各参照が§1〜§6の許可locatorおよび対応するC-RGK範囲へ解決し、既存の契約/oracle対応検査を行う。読取対象にPLAN pathがなく、fallbackもない | 固定PLAN pathを入力として読む、または参照先を解決するためPLANへfallbackする |

## 実装・昇格受入 (未実装)

1. `resource-kernel-pair-mapping` gateと対応testはL5 canonical文書の付録D.5/D.6、およびL8のResource Kernel freeze属性節を入力にする。fixture-manifest checkは同じL5/L8と変更していないfixture manifestを入力にする。両検査とも旧PLAN読取とfallbackは0。
2. `docs/plans/` treeを物理的に欠くtest snapshotでcandidate 001〜004を実行し、PLANの存在に依存しないRed/Greenを記録する。新しい正式IDへの昇格は候補Redと実装の別工程で行い、本書だけで昇格を宣言しない。
3. `docs/plans/`を含まない状態でdoctor hard gateと両検査の該当testが通る。repository全体で`docs/plans/`を退役させる完了判定は、同pathを読む他のgate/testも解消された後に別途確認する。本書は全体退役の実測証拠ではない。
4. 58契約・42 oracleのexact集合、lane分布、fixture対応、重複/未知/孤児検出という現行の保証を維持する。実OS runner証跡やResource Kernel本体の実装を、このmapping gateのGreenへ読み替えない。

## 出典locatorの解決

付録D.5の「出典」列とfixture manifestの42件の`contract_ref`は、以下の対応で付録D.6の同番号詳細契約本文へ解決する。旧PLANの節番号とmanifest値は変換・再割当てせず保持し、D.1〜D.4を詳細本文の代用にしない。

| 旧locator | L5 canonical詳細本文 | 付録D.5契約ID |
|---|---|---|
| §1 | D.6 source §1 — 責務配置と非重複境界 | C-RGK-01..08 |
| §2 | D.6 source §2 — wire framingとschema配置 | C-RGK-09..14 |
| §3 | D.6 source §3 — commandとfactの物理系列 | C-RGK-15..34 |
| §4 | D.6 source §4 — custodian lifecycleとdurability barrier | C-RGK-35..41 |
| §4.1 | D.6 source §4.1 — Custody authorityとatomic handoff | C-RGK-42..47 |
| §5 | D.6 source §5 — platform portとfailure isolation | C-RGK-48..50 |
| §6 | D.6 source §6 — companion bundle配置と供給網境界 | C-RGK-51..58 |

この対応は、詳細本文への物理的移設と既存locatorの保持を示す。D.5の契約記述・ID・oracle参照およびmanifestの42件の値は変更しない。gate/testは付録D.5/D.6、L8とmanifestを照合し、旧PLANを開かない。

## 範囲外

- fixture manifestの内容、lint/test source、doctor registry、`tests/gate-static.test.ts`、共有L6/L7台帳の変更。manifestはfixture-manifest checkが読む入力である。
- L8 oracle ID、fixture、lane、物理runner要件の再設計。
- PLANの作成・変更・読取を退役後のruntime入力として残すこと。
- 契約の不足をこのpair tableの文言だけで補い、L5設計が完全であると宣言すること。
