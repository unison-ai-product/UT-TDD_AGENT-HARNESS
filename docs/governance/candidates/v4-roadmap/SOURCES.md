# 出典と観測範囲

2026-09-08に計画を改訂。GH-MAIN/GH-PKG/GH-PR517/GH-PR517-FR/GH-PR517-AC/GH-481/GH-480は今回コネクタから取得。他は前版の固定引用を継承。法律・費用・versioningの一次資料も確認した。全リポジトリ/全コードの再監査ではない。

| 参照ID | 対象 | 根拠/限定 |
|---|---|---|
| GH-MAIN | [2026-09-08 mainの取得](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/commit/84cd7f896f7dfbd67b38b250b5a943eaee3f6640) | main=84cd7f89、#521契約PRのmerge。現在の全CIや全Issue状態をこの文書で保証しない。 |
| GH-PKG | [main package.json](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/84cd7f896f7dfbd67b38b250b5a943eaee3f6640/package.json) | version=0.2.0-canary.1、license=MIT。packageのversionは公開済みreleaseの証明ではない。 |
| GH-PR517 | [PR #517](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/517) | draft/open、HEAD=c21b54fb0d3f2d5a73a7826cc41233634456cac9。新規版番号は本計画案。 |
| GH-PR517-FR | [#517要件候補](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/c21b54fb0d3f2d5a73a7826cc41233634456cac9/docs/governance/candidates/ut-tdd-concept-v4-requirements.md) | FR-001..059。sourceのIDを保存してsummary/版を対応付ける。 |
| GH-PR517-AC | [#517受入候補](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/c21b54fb0d3f2d5a73a7826cc41233634456cac9/docs/governance/candidates/ut-tdd-concept-v4-acceptance.md) | AC-001..072。候補であり実行済みtestではない。 |
| GH-PR517-BR | [#517要求候補](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/c21b54fb0d3f2d5a73a7826cc41233634456cac9/docs/governance/candidates/ut-tdd-concept-v4-requests.md) | BR-001..032。今回のtraceは各FRに記載されたBRを対応付ける。 |
| GH-PR517-CONCEPT | [構想v4候補](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/c21b54fb0d3f2d5a73a7826cc41233634456cac9/docs/governance/candidates/ut-tdd-concept-v4.0.md) | 6 Plane、human-on-the-loop、narrative/record/view、TypeScript/Node継承。 |
| GH-PR517-PLAN | [PLAN-L1-09](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/c21b54fb0d3f2d5a73a7826cc41233634456cac9/docs/plans/PLAN-L1-09-ut-tdd-concept-v4-candidates.md) | 調査の旧時点を現在の実装状況に読み替えない。 |
| GH-418 | [初回Canary条件](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418) | 前版で読取した現行M0の受入。着手時に変更有無を再確認。 |
| GH-364 | [S5 A/B stable](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/364) | 初回Canaryとは別の運用完全受入。 |
| GH-481 | [consumer updater](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/481) | 今回再読。初回Canary非blocker、formal stable/multi-productで必須。 |
| GH-480 | [PLAN予約](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/480) | 今回再読。既存reservation domainを再利用、Git tree推測採番/別DBの新設は禁止。 |
| GH-U23 | [Execution Ledger基本設計](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/059a35469748c41ce7b2d2046905eb8ab8980247/docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md) | 既存基本設計の再利用。現行実装率の証拠ではない。 |
| GH-CI | [source CI契約](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/c27f3b9b0e8105a7b406d9f73237e4e35a7c3b33/.github/workflows/harness-check.yml) | 前版で実読した固定版。CI削減時に最新とのdiffと規約を確認する。 |
| GH-PACKCI | [Pack CIテンプレート](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/c27f3b9b0e8105a7b406d9f73237e4e35a7c3b33/docs/templates/github/common/pack-harness-check.yml) | source/Pack/consumerを同一CIと決めつけない。 |
| WEB-SEMVER | [SemVer 2.0.0](https://semver.org/) | 公開済み版の不変、0.y.z、public APIを定めた1.0.0を参照。版割当は本計画。 |
| WEB-MPL | [Mozilla MPL FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/) | ファイル単位・組織外配布・source提供・第三者通知の説明を参照。法的権利帰属は個別確認。 |
| WEB-MPL-TEXT | [MPL本文](https://www.mozilla.org/en-US/MPL/2.0/) | 実際の切替で原文を確認。 |
| WEB-BILLING | [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) | 無料枠/請求は契約・所有アカウントを確認。月2,000分は利用者のsoft目標であって全repositoryの権利を主張しない。 |
| WEB-SCHED | [資源と先行制約によるschedule](https://developers.google.com/optimization/scheduling/job_shop) | 先行制約と資源の競合という問題整理のみ参考。OR-Tools採用や最適解保証はしない。 |

## 入力ファイル
前版v1.3ロードマップと差し込み指示を全範囲読んで再編。原本は変更せず、sha256をdata/input_inventory.jsonへ記録。本版は説明/版計画を置換するが、前版の決定を後述の明示変更以外で撤回しない。

本資料のR/SL/MIG/SCHEDはローカルの提案ID。UTの正規PLAN、GitHub Issue、承認receiptを発行したものではない。GitHubへのwriteは実行していない。
