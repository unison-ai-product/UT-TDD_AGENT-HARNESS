# PLAN → 設計文書 還流証跡 (backflow-s2、issue #958 / #959)

目的: L4 PLAN 32 件を「使い捨て可」か「廃止 / supersede 済み」にするため、PLAN にだけ残る契約・carry・依存を L4 設計文書へ移す (または既存と確認する)。

基準 commit: origin/main `d5ad67fb50c148ea8dd6d5475bab4b88f2d4cd4c`

件数: 使い捨て可 19、還流済み 11、未処理 1、要判断 1 (計 32)

触った設計文書: `docs/design/harness/L4-basic-design/data.md` (§11.1 / §12 / §13)、`architecture.md` (§11-§15)、`function.md` (Appendix D)。test-design は触っていない。

注記: 実装状況の記述は architecture §3.1 の公開 IF からの引用であり、`src/` を個別に開いて照合していない項目がある (備考に明記)。

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
|---|---|---|---|---|---|
| PLAN-L4-00-master | `d0902ce7be488236614f2ea7c6c28102b41439b072bc08abede43f2f49ef601e` | 使い捨て可 | function/data/architecture/external-if の各冒頭 plan 欄と L4 全体 (既存) | child 間の実行順 (data→architecture→function/external-if)・内部資産 sub-master の親子 (完了済みの順序) | screen skip (PO 承認 2026-05-29) は後続の ui-standard.md 起票で陳腐化。G4 audit 記録は gate 台帳が正本 |
| PLAN-L4-01-data | `93019163f75c963d5fc39263b62b39b36b30ca304d2bb4bdaff810e34cdc462e` | 使い捨て可 | data.md 全体 (§1-§9 が Step 1-8 に対応、既存) | なし | チェックボックス未チェックだが data.md に Step 1-8 が実在 |
| PLAN-L4-02-architecture | `5b01d59bf9e66526fdd4c7b2f5cdce117345f706f72be5ad1a12070062497ccf` | 使い捨て可 | architecture.md §1-§9 (既存) | なし (L4-33 は predecessor 参照のみ) | supersedes 自己参照は版管理で設計の責務ではない |
| PLAN-L4-03-function | `81198365302123139b2f02014c1814a2a0a5624acd9ead45950a4a53315fca8e` | 使い捨て可 | function.md §1-§8 (既存。P1 carry は §6 に 10 件) | なし |  |
| PLAN-L4-04-external-if | `e749399c1fbef8fd40c73e442db904200311788dfab31e580ca59273f025a961` | 使い捨て可 | external-if.md §1-§8 (既存) | なし |  |
| PLAN-L4-05-workflow-orchestration | `078f59dc1ded21ef38ec817abcd2367b25831374a8897f6421c96fcbaf95afc4` | 使い捨て可 | function.md §3 (既存。§3.6 実行モード、§3.7 carry) | なし |  |
| PLAN-L4-06-design-refresh | `171e784743083972069342c489579f8c151e0c76be6925173665181ed53ec816` | 使い捨て可 | data.md §3/§6、architecture.md §3.1/§6、function.md §3 (既存) | IMP-072〜075 は improvement-backlog が正本 (未照合) | carry 3 件 (ST-EXT の c/d 被覆、ScrumType/evaluation_batch lifecycle、asset-drift の carry PLAN) は未検証。backlog 側の追跡に任せる |
| PLAN-L4-10-internal-asset-master | `61cc78d93e8cac0e6cca0a39a7ad6267627065313d48d5c4c75ef4e1af0fc5bc` | 使い捨て可 | g4.md 既存 + architecture.md §3.1 roster/skill-engine、§4.1 (既存) | sub-master と child の親子関係 (完了済み) | 層1/層2 境界は ADR-004 が正本 |
| PLAN-L4-11-roster | `77ec53fe16c7cf9c3fd01dd5492eadfab1f4a33c25d85dd4ed0fd6160a3e6044` | 使い捨て可 | function.md §1.1 C12、§2 (既存) | なし | g4.md 既存 |
| PLAN-L4-12-skill-pack | `64b298510676933f93114b81c2495414218361163b8cb604aee9bd58d4fc2cd2` | 使い捨て可 | architecture.md §3.1 skill-engine 行 (既存) | なし | skill root 訂正 (2026-07-16) は反映済み |
| PLAN-L4-13-drift-lint | `586b0ba5faa2823c966642ac606ccedd3b6558bba39eda659ffc51bc61823212` | 使い捨て可 | architecture.md §4.1 (既存、検査 4 項目と実装証跡) | なし |  |
| PLAN-L4-14-ui-standard | `56cb428a9ad9ec5dda11a0ee63b8e1899284f7bc4a1488470334ee4e15af3f46` | 使い捨て可 | ui-standard.md §1-§7 (既存、descent 鎖は §1) | requires L2 ui-element / L4 data (完了済み) | AC 未チェックは review_evidence と gate で担保。D6 (L10 visual-design の reframe) の現状は未確認 |
| PLAN-L4-15-nfr-grade-ac-landing | `5c2d311bd0bb8ba93d122a121591760a84b10aa8e1a1af8701c09971b3ed73b6` | 還流済み | architecture.md §12 末尾「L3 NFR carry」 | なし | draft。nfr-grade.md の placeholder (NFR-02/09) は未着手のまま。carry を設計文書へ明記した |
| PLAN-L4-16-security-design-slot | `fc56fdc65c59143ba94c2aeaf67c815ac53be96faa093c6cc494d06577e12d76` | 使い捨て可 | security.md (既存) | なし |  |
| PLAN-L4-17-version-up-design-bottomup-band | `a83d045225aa386121984d4b0f1ea79983553fe3e41e211a567970b7cddb91f7` | 使い捨て可 | function.md §3.1/§3.2 (既存、11 駆動モデル) | なし | deferral 台帳 lint 化は version-up 着手時の別 carry (function.md の version-up 行に「parked tuple lint」で既存) |
| PLAN-L4-18-roadmap-drive-selection-hardening | `2818118a6059baa402b13166658b15339967723241b59c4a7307b78511c2abe5` | 使い捨て可 | function.md §3.2.1 FilingTarget (既存) | なし (後続 L5/L6/L7 は降下の順序) |  |
| PLAN-L4-19-vmodel-spec-ir-data | `4577e1c5eea0914f4260ed7a7ef3828671d3f57878dce124f02343ace388a978` | 使い捨て可 | data.md §1.1、§8.1 (既存) | blocks PLAN-L5-13 / PLAN-L7-381 は降下順序の依存 (剥離) |  |
| PLAN-L4-20-document-catalog-scale-profile-ssot | `73e747ecae56bc0c0fb07caf063fafa6bc3bd8cca42223a2a3bb77f82d8e8c19` | 還流済み | data.md §12 | なし | authoring source と投影の境界、理由必須、finding 化を移した |
| PLAN-L4-21-domain-vo-coding-constraints | `582977e0d31fc8c688e7da5fb23e88649af868290bb9ecbf931b0ce8075b6f02` | 使い捨て可 | data.md §3.1/§3.2 (既存) | なし | 閾値の正本は coding-rules.md |
| PLAN-L4-22-vmodel-source-disposition-profile-ssot | `504335ff6ed703bdce449e496bea9dea5b4e556e9f885006f654e57bd92677a8` | 還流済み | data.md §12 (source disposition と A-187 未達の訂正) | requires L4-20 (§12 内で同居) | draft。A-187 訂正は governance 側に未反映のまま設計へ目標として記録 |
| PLAN-L4-23-forward-fsm-plan-asset-v2 | `06a1001fe2207a6dcdf34c4cfe4a461131b09324619838927ca86726a9620d14` | 還流済み | function.md Appendix D | Appendix C が Forward revision に依存する関係を Appendix D に明記 |  |
| PLAN-L4-24-declarative-vmodel-contract-right-arm | `e7448f04c615477ad9e858b0eb29d885339f9d6e29953896d4a52234ba325652` | 還流済み | architecture.md §11 | なし | draft。contract 実体は docs/process/vmodel-contract.yaml、L8-L14 verify PLAN は 7 件実在 |
| PLAN-L4-25-repository-docs-engine-swap-audit | `a7abb1fcec9a53f69c9b7284735b1ddcb62d9f9b356dce77a935599de7dac469` | 還流済み | data.md §11.1 (既存の §11 と architecture §9 を補完) | なし | draft。L9 ST-DOCSEM が oracle |
| PLAN-L4-26-engine-swap-object-method-design | `25e9347e0b6ad06c1d6baf826dad84e9c506d8e0f9882d12866f7c58bce8785b` | 還流済み | data.md §13 | requires L4-21 (data.md §3.1 に既存) | draft。実装状況は architecture §3.1 の公開 IF から引用 (src 直接確認はしていない) |
| PLAN-L4-27-vmodel-semantic-self-audit | `9ca0318b4caf5576870ba8f5189067f5e3281290b529a231f39ed9d13aacef92` | 還流済み | architecture.md §11.2 | なし | draft |
| PLAN-L4-28-design-detection-self-proof | `dc00295cd5b46ef1093c7ae9197ecfb4a15d2ccbd6580102d67d5692abe7952f` | 還流済み | architecture.md §11.1 (付録 A の negative fixture 現況を含む) | なし | draft。詳細は docs/process/design-detection-self-proof.md も保持 |
| PLAN-L4-29-security-design-substance | `4472fc632436108471ad94ec910613b581deaed5a8ca72717a398e1bc791192e` | 使い捨て可 | security.md §5-§10 (既存) | なし |  |
| PLAN-L4-30-execution-ledger-github-architecture | `27013fa2e07ebb1defdab01e331ade481286bdccb82529d3f2dd411d32ad6597` | 使い捨て可 | function.md Appendix C (g3.md 既存) + L9 §8 | requires L4-23 / L6-50、blocks L5-23 は順序 (剥離) | g3.md で移行済み。受入条件の oracle は L9 §8 に既存 |
| PLAN-L4-31-nfr-verification-foundation-architecture | `b387fc75b28d76bf6e08ba9cda80976b19ed12104bf05f87e02d0ee37ca9ea15` | 還流済み | architecture.md §12 | requires L3-03 / L7-34 (完了済み) | draft。IMP-173 の設計書カバレッジ欠落をこれで解消。未実装の目標契約と明記 |
| PLAN-L4-32-resource-governed-execution-kernel | `e7c75c437c0744d4fe278c88267571f05c46892a34faf8aa9672d8c2bd5652cd` | 未処理 | g3.md が一部移行済み (architecture §10/§10.1) | 未判定 | 残り件数の都合で未着手 (g3 の保留 d 項目が残る) |
| PLAN-L4-33-node-control-plane-redesign | `a5b65bf38588178d7d836a3c0b909651bd082f744b8a15b5a2dcf8fcfcb178cb` | 還流済み | architecture.md §9 (既存) + §13 | blocks PLAN-L5-26 は降下順序 (剥離) |  |
| PLAN-L4-34-repository-runtime-placement-topology | `a680cb0c06fb28c3fdda27d74335012d790c5072c22e42798c4b493f23d99883` | 要判断 | architecture.md §14 (worktree lifecycle、#384 部分を還流済み) / §15 (cutover 部分は移さず問いを記録) | S2/S3 の将来 edge (#232 / #134 / #228 / #169 / #124 / #384) は完了順序の依存を含む。#384 部分は §14.2 の port に依存として記録 | 質問: OneDrive 撤去と C:\dev 配置が済んだ今も、OneDrive 外 cutover の receipt chain / write fence (§3.1-§5、AC-PLACE-01..09、U-PLACE-001..018) を設計目標として維持するか、廃止するか。U-PLACE-010 以外の oracle は L9 に未移送 (PLAN にだけ存在) |
