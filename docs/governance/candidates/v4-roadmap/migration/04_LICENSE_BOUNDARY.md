# MPL-2.0：実行対象はPackだけでなくUT本体

利用者が採択した方向：無料OSS公開を維持し、現行プレリリース完了後のUT本体をMPL-2.0へ。R01の最初の新配布は0.2.0-canary.2を提案する。

## 作業と完了条件

| 順 | 作業 | 完了証拠 |
|---|---|---|
| 1 | 本体/配布物/コピー/生成テンプレート/第三者コードの権利と元条件を棚卸し | owner・出所・対象scope、必要な同意/表示の処理 |
| 2 | MPL適用開始commitと最初のrelease、旧MIT維持範囲を定義 | 旧新対応表。既存tag/asset不変 |
| 3 | 本体LICENSE・package license・SPDX/適切な通知・READMEを整合 | 全対象file/metadataの差分検査 |
| 4 | Packの該当ソースとsource提供先/表示を整合 | 配布versionから対応source/通知へ到達可能 |
| 5 | 寄稿方針と第三者表示を整備 | CONTRIBUTINGとnotice。DCO/CLAを同一視しない |
| 6 | 配布候補で全体照合、通常PRは関連差分を検査 | license/notice manifestと必要なrelease証拠 |

MPLのファイル単位条件と組織外配布時の対応source提供を基準にする。利用しただけの独立consumer成果物を自動MPL化しないが、UT由来コードを含む生成ファイルは一律除外しない。既存第三者noticeを消さず、権利関係が不明なら個別確認へ。MPLに無い「UTへのPR提出」「商用禁止」を追加条件として説明しない。[WEB-MPL][WEB-MPL-TEXT]

SBOM/THIRD_PARTY_NOTICES等はUTの配布管理方式として整備するもので、特定ファイル名がMPLの普遍的必須条項とは主張しない。ライセンス変更は合意済み方向だが、実施には対象権利・移行境界・配布整合の確認が必要。

## 切替PRの範囲

#517へ入れるのは「R01でMPLへ切替する要求/受入/ロードマップ」。実際のLICENSE・header・packageの変更はR01の専用PRで行う。新規license gateの巨大開発を切替の目的にすり替えない。
