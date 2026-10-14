# PLAN → 設計文書 還流証跡 (slice backflow-s3、L5 の 26 件、issue #958 / #959)

目的: すべての PLAN を「使い捨て可」か「廃止 / supersede 済み」にするため、PLAN にだけ残る未達 DoD・carry・実在する依存・oracle・責務を設計文書へ移す (PO 2026-10-14)。

基準 commit: origin/main `d5ad67fb50c148ea8dd6d5475bab4b88f2d4cd4c`。blob sha256 は `git cat-file blob origin/main:docs/plans/<file> | sha256sum` の値。

処理済み: 13 件 / 26 件。

区分ごとの件数 (処理済み分):

- 使い捨て可: 12
- 還流済み: 1

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
|---|---|---|---|---|---|
| PLAN-L5-00-master | `91f30789210074fca735cd7c257995ef589fb59d95175bc2b3e6341c92f8e991` | 使い捨て可 | (移さない。L5 sub-doc は既存) | child 実行順 (順序の都合のみ)、requires の L4 4 文書 (完了済み) | DoD 全チェック済。IMP-014/018/026 と G4 escalation は if-detail §6-7、module-decomposition §7 に既存。認証・秘密管理の確定は if-detail §6 が方針のみと明記 |
| PLAN-L5-01-physical-data | `a22598eab94227a079113652ea4b9fce22f122101046219c8f412066d36e4af7` | 使い捨て可 | 既存: physical-data.md §1-§8 | requires data.md (完了済み)、後続 L5-02 (順序のみ) | DoD 全チェック済、物理 schema は設計文書に実在 |
| PLAN-L5-02-module-decomposition | `8b01b5d69267291486c507d3bc9e75c5bd35a668668f01e15571d5849896c365` | 使い捨て可 | 既存: module-decomposition.md §1-§7 | requires L5-01 成果 (完了済み) | ADR-002 は採択済 (module-decomposition §7) |
| PLAN-L5-03-internal-processing | `4efae9808671e9ad2da9d408021ea2f778a8eeff08ed06bdfd8f01d888f2fadc` | 使い捨て可 | 既存: internal-processing.md | requires module-decomposition / function.md (完了済み) | frontmatter の supersedes が自 plan_id を指している (自己 supersede)。内容は還流対象外、PLAN 側の整理課題として記録 |
| PLAN-L5-04-if-detail | `9f0d35179a03480a850262f38d3337e7bf361582564aa52f1d30b205d3c02821` | 使い捨て可 | 既存: if-detail.md §6 (認証・秘密管理は方針のみ)、§7 (ADR-003 採択済) | requires external-if / module-decomposition (完了済み) | 認証・秘密管理の確定は高影響境界で PO + security 承認事項。if-detail §6 に「確定せず」と既存 |
| PLAN-L5-05-roster | `5f5e3874b9cbae02511af53bf4679af7ee8dc6b06e7fefa67e365d5ad264ce3b` | 使い捨て可 | 既存: module-decomposition.md roster 節 (§1, §5)、internal-processing.md `ut-tdd roster` / `ut-tdd asset`、if-detail.md `ut-tdd asset catalog` | requires 5 件 (完了済み) | L6 carry (asset D-API、signature) は L6 側の責務で、L6 function-spec が既に保持 |
| PLAN-L5-06-skill | `0ecbbf2d971819c0b6048b1bc953e89f96ef5f8887666b3b03a040dcc8189b3e` | 使い捨て可 | 既存: module-decomposition.md skill catalog 節 | requires 3 件 (完了済み) | recommender / injector の関数仕様は L6 carry |
| PLAN-L5-07-drift | `80fcc7c4cb81991b7caca223090cd8d9bd8084ae597aa3c70938f63e629b1389` | 使い捨て可 | 既存: module-decomposition.md A.2 asset-drift rule integration | requires 4 件 (完了済み) | 判定関数 signature は L6 carry。dependency-drift との並置も A.2 に既存 |
| PLAN-L5-08-harness-db-feedback | `83749b7ce19bf794d0f6664facfa11d4014f257fb184ed44ebb6a8ea42712f9b` | 使い捨て可 | 既存: physical-data.md §9.1-§9.4、module-decomposition.md (asset-catalog ほか)、if-detail.md の CLI 契約、L8 Appendix B | requires 4 件 (完了済み)、parent L5-01 (順序) | DoD 全チェック済 |
| PLAN-L5-09-ui-detail-body | `ba568836b261dec67359afdc1ae8588b835d6197b9dc98d67a185c4535371c2a` | 使い捨て可 | 既存: ui-detail.md §1-§8、src/lint/frontend-design-coverage.ts が L5 を body present と判定 | blocks PLAN-L7-141 (draft): ui-detail 本文は実在するため充足済みの依存として剥離 | read-only command-handoff 境界は ui-detail.md §6 に既存 |
| PLAN-L5-10-drive-model-router-redesign | `80bb5d0ef1c914fb0e932b5b3a478616d6a1fe48263a00d83208dd21d17d8158` | 使い捨て可 | 既存: internal-processing.md Appendix C.1-C.7 (default-Forward、routeFiling 決定表、layer 強制と l7-cold-intake、two-phase intake、escape governance)、L6 function-spec routeFiling、L8 Appendix D | parent L5-03 (順序) | DoD が未チェックのまま status confirmed。設計判断 (b) の全 mode 横展開は C.2 に採択済みで既存。L7 実装は C.6 carry 先の add-impl が持つ |
| PLAN-L5-11-forward-decomposition-tree-projection | `f917fbca289fc368cec421b384463e6c460f65836611685a9579da162fee3f58` | 還流済み | physical-data.md §9.5.1 (未実装の目標契約と明記)、L8-integration-test-design.md Appendix H (CANDIDATE-IT-FWDTREE-01〜06) | references のみ (requires 空)。完備性 lint と matrix view が node / edge に依存する実在の依存は §9.5.1 末尾に責務依存として記載 | draft で DoD 未達だった設計本文が設計文書に無かったため移した。実装は src に無い (decomposes / pairs edge 不在、section_id は空文字) ため目標契約として記載 |
| PLAN-L5-12-externalization-by-design | `a9b641302d7c149d63f0fa1e842931d571f802cc4c739fbbbef5df04014e04a0` | 使い捨て可 | 既存: internal-processing.md C.7、L8 Appendix E (IT-EXT-01〜05) | parent L5-03 (順序) | DoD 未チェックのまま confirmed。C.7 は PLAN の要件を全て含み、未知キー fail-close 等はむしろ詳細化済み |
