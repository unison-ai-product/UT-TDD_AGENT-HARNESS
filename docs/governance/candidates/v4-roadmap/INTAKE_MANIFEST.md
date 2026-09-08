# v4-roadmap 収容 manifest (INTAKE_MANIFEST)

**位置づけ: 非正本の参照資料。** 本ディレクトリは PO 提示 (2026-09-08) の計画資料
「UT_V4_RELEASE_ROADMAP_v2.0」を原文のまま収容したものであり、UT-TDD の正本ではない。
R / SL / MIG / DEC / RM-ADD / SCHED の各 ID は資料内のローカル提案 ID で、正規 PLAN・GitHub Issue・
承認 receipt を発行したものではない。正本への反映は親 issue #530 の子 issue S1〜S5 (#532〜#536) が
PLAN-L1-09 と 5 候補文書 (`docs/governance/candidates/ut-tdd-concept-v4*.md`) へ差し込みで行う。
本ディレクトリ側を編集して正本化しない (S0 = issue #531)。

## 原本

| 項目 | 値 |
|---|---|
| 原本 ZIP | `UT_V4_RELEASE_ROADMAP_v2.0.zip` (展開 1,216,598 bytes、52 files) |
| 原本 ZIP sha256 | `75feeae43aab48dec56cb58baf516c0501ced854e20615888e402c17233f53f5` |
| 収容 | Markdown 39 本 + `data/*.json` 10 本 = 49 本 (下表 included) |
| 除外 | `index.html` (生成 viewer、860,348 bytes)、`tools/render_roadmap.py`、`tools/validate_roadmap.py` (下表 archived) |
| 除外理由 | 生成 HTML は data/*.json と Markdown から再生成できる派生物で drift 源になる。python tool は ADR-001 (TypeScript/Node が product runtime) と衝突し、repo の検証経路へ載せない。data/*.json の継続検証が必要になれば TS/Vitest への移植を別 PLAN で起票する |
| 退避先 | `C:\dev\_archive\UT_V4_RELEASE_ROADMAP_v2.0-excluded\` (index.html、tools/、ORIGINAL_ZIP_SHA256.txt) |
| 正規化 | CRLF → LF。本文の改変は下記「gate 適合の最小改変」の 7 行のみで、それ以外は原本と一致することを収容時に照合済。ファイル名は無改変 |
| 資料側の自己検査 | `VALIDATION.md` / `data/validation_results.json` は資料作成側のオフライン整合検査の結果であり、UT の CI・review・受入ではない |

## ZIP 取りこぼし監査用の全ファイル表

sha256 は ZIP 展開直後 (LF 正規化前) の値。監査は「52 行すべてが included か archived のどちらかに対応する」ことを確認し、
確認後に ZIP 原本を削除して結果を issue #530 へコメントする。

| disposition | sha256 (原本) | bytes | path |
|---|---|---|---|
| included | `65fcd5e8e5af9287f43f1befad3edfb9d771c0e2dd9d1b9f7f3a8a6b907702a8` | 4057 | `00_VERSION_STRATEGY.md` |
| included | `e09a95f549a1d1be9a2edf334960648bcb6efaefe6d6e685715ffa939bc7b831` | 4968 | `01_RELEASE_MATRIX.md` |
| included | `61c6b734dbf75de06c487d77460a2253a27c88af674010290e163dc87703c84f` | 2875 | `02_CURRENT_BASELINE.md` |
| included | `a1a8cbc806a820450f4a02b6700b6f1b182b3a4a45254b2639f756f342c97a31` | 1373 | `CHANGELOG.md` |
| included | `05e651fe6c7ed2e1621b199e4d1dc48108c2921517e7dbfe7b2e9d4e362c3182` | 7448 | `README.md` |
| included | `68a8d8febeca30336c6467857f3ce0fe2b95b6d8934063c75f067964081e85e4` | 5394 | `SOURCES.md` |
| included | `4c4e78e994435191922972977cfa76734e5edbc46c44484ab6e65557b97d828a` | 2003 | `VALIDATION.md` |
| included | `08a806064248d36c24a546a0ff7f27833b6267f1fd42226d3147ddf9331d8f53` | 881 | `VIEWER_CHECK.md` |
| included | `ed201bdba308c1329627af2b659637a106c43331ed71ed229463795ca42e05f0` | 10506 | `data/additions.json` |
| included | `0a982e07f898f9d3df9fa1387f6a87fd5be3042fb2004939fe477f7ec8f3eeac` | 17742 | `data/capabilities.json` |
| included | `a58167b8fd8319da6dcb1eeadb0c15c219008a939859c823b44abe8ce0a0f960` | 551 | `data/input_inventory.json` |
| included | `0a2f156635c6895cca41490eb64bbbf8b24f4edba18a7df5bfc710da24b6c235` | 12556 | `data/migration_manifest.json` |
| included | `178d8aa3a46c6bf38f3dbf35e3e8bf0101904079636c1b41b22cac389f43d061` | 62037 | `data/releases.json` |
| included | `2e66f8d574f3aa289c340e37efe14a2b5afdfe88400b7a5413f946d45692c67a` | 36198 | `data/requirement_trace.json` |
| included | `8df4b85d394e2796e497b6a87f3fe5632a458176130bfde170b42d84e17db452` | 1052 | `data/scheduling_contract.example.json` |
| included | `e93518f36289b26b8080c0f5991b5325595a44b61f46dd6cd8356f343992ed49` | 2521 | `data/scheduling_fixture.json` |
| included | `348a5339f32e4f5d6e0febe7cf582f2309caf8ac1fc007f77c3cbf8beb83529f` | 1804 | `data/validation_results.json` |
| included | `cef34a0569fb3ee8234311061f7a8bd7bb3095c2ed0ce21977bdccea7f6f711d` | 462 | `data/viewer_validation.json` |
| included | `dc54036092f105d3e78445834aa3c7e4c6b07a95adbc953cf86b1d273ab13a8a` | 7933 | `execution/01_DEPENDENCIES_AND_WORK_PACKAGES.md` |
| included | `895dccd52c0fefec4d0d9b5c02cfdd5c23d12bc7ec12b81606097f9cd32bf25e` | 3928 | `execution/02_PR517_INTEGRATION.md` |
| included | `02e201842cabdcfb2517e39e06b75cb3affe5a55ec619d2809a31e37b7bf9709` | 3520 | `execution/03_CONTRACT_DECISIONS.md` |
| archived | `66f8728cdbc3f9cc7e973b5bcb64750082177e20f37d20763a9749edaa261970` | 860348 | `index.html` |
| included | `544783410a40640b57ed573b63573afd314c294e079695daf0e611782a8507a1` | 5229 | `migration/00_REPLACEMENT_MATRIX.md` |
| included | `01402266372e48e33d3881495e0c15636c37dbf770e4e5a35d92114400f3ad40` | 5723 | `migration/01_AUTHORITY_AND_RECORDS.md` |
| included | `e88c7017118cb613161853bd3f420a5296c26c3c7ac69fc99b67f3e29bce22bc` | 3434 | `migration/02_CONSUMER_UPGRADE_AND_ROLLBACK.md` |
| included | `4f197a0f52e30d1bf109d38b792fcecff11b00a325c622ffa7c858023f521cbc` | 3221 | `migration/03_COMPONENT_CUTOVERS.md` |
| included | `afad166066ce7e821003ed7c8509699f138bf51b1fc287654736419c82dcfdfd` | 2063 | `migration/04_LICENSE_BOUNDARY.md` |
| included | `ec7cef24295c76769716f227e502e27405de4fb2c3cba53fd53537f4859f6d53` | 6815 | `migration/05_SURFACE_AND_SCHEMA_PLAN.md` |
| included | `cab4899987755e67e552999c3aeebfc3e58c4fd02f6f81dc5c8e0c19d6aa65ae` | 3956 | `releases/R00_0.2.0-canary.1.md` |
| included | `8dd04a5e9aadf4e1e4bc1478526de59c387d842f8ac06c7b71bad7fef8771696` | 4447 | `releases/R01_0.2.0-canary.2.md` |
| included | `ea9c5036384cd7a32caf556d38e85792515b9c75ac81bb3ba8b7a254ce42ae26` | 4268 | `releases/R02_0.2.0.md` |
| included | `775ba179fca6adb82917e96c64877ca1186895a0bfb4006dbf84b1bd1a5501ae` | 5665 | `releases/R03_0.3.0.md` |
| included | `f4d5b14bcb32411b0646aff5283b188beb5fab6671bbdae889c22652c791dc50` | 5044 | `releases/R04_0.4.0.md` |
| included | `393b70612b29eec41a7750a2f52da9f6ab09a117ebabc52bea606082c0835e4e` | 5430 | `releases/R05_0.5.0.md` |
| included | `f9c95c72c56abc7887ceca2429dce109df178495be7f018bd69f3eb478d480ad` | 4594 | `releases/R06_0.6.0.md` |
| included | `445de940cbce4f2dc41b37a3f61865b497c7271490b678b5ef4f25b214676b46` | 4905 | `releases/R07_0.7.0.md` |
| included | `056c38aaeb320675b1825505fd07a6a311cbbb7c8a10706d7012755429239a24` | 4389 | `releases/R08_0.8.0.md` |
| included | `74c02ea992bc508eb9c8260fb98fe2118e296f4242b1d8810557e3aa79a4b45a` | 5085 | `releases/R09_0.9.0.md` |
| included | `a095e5b283c3def80de7371b8927c8bf9ea5abeb1a1c543c62b4c9eef283c238` | 4851 | `releases/R10_1.0.0.md` |
| archived | `62034fe81f9755d7b07fa1e66c0c8b52244e53e94a4a203bb20c7bb2aaaa801e` | 9142 | `tools/render_roadmap.py` |
| archived | `3517a2073cd24ca3337eb3b5cbe11b5d43ddd209adf8c1396cbf7dc15fb132b1` | 15195 | `tools/validate_roadmap.py` |
| included | `95df4e7e7f0723f5f129519b31a89e69ae0dfab7830171ad7de7b152305173d3` | 3906 | `trace/AC_COVERAGE.md` |
| included | `087acb9abbb70ca882a7b56e9810c3ca37dbf4197e433744e2c565f6929b41a3` | 2445 | `trace/ADDITIONS.md` |
| included | `5e059015da64aae0fbe30cd0678a905cfce83f85d1f66ff221eb7b6c72e0649c` | 12408 | `trace/CAPABILITY_MATRIX.md` |
| included | `06c4440a5b8a7ed54a21a45344d2ef165254446a68032f2f0605d2ecb9803993` | 15021 | `trace/REQUIREMENT_COVERAGE.md` |
| included | `4cd7436fe9c466daa0492be3d6fec733f063581e732649143bc649f4e84d489a` | 11096 | `workstreams/01_SCHEDULING.md` |
| included | `8be6cf0045e2a733a7d52f6d16dcb718939b97ed291b4e8b5084122e881df591` | 3529 | `workstreams/02_CI_AND_COST.md` |
| included | `21fefe033ab3e27517b67dcccff519adcb22c2686e2cf7129380d61721c43694` | 3309 | `workstreams/03_SECURITY.md` |
| included | `182915b9268c29f8bf4a1beccbfa6e785cba868f7a6117390ac6d8b705073daf` | 3377 | `workstreams/04_GOVERNANCE.md` |
| included | `6b53c0b6143ff3e993dec770e9bae5319a34b5627cb898f5c667a00c2e2480ea` | 3663 | `workstreams/05_CONTEXT_AND_INCIDENT_LEARNING.md` |
| included | `9697b66285875056bd2ab87dbbdfdd310d4481f6b13bf4217cbd91cdfbf3779b` | 2897 | `workstreams/06_BUGBOT.md` |
| included | `9027557263abaee0a42f15c9aa2ac31855f93041ae52b4eddcb3417c09e3ef21` | 1334 | `workstreams/07_SCHEDULING_EXAMPLE.md` |

## gate 適合の最小改変 (7 行)

CI の doctor `design-language` (設計系 doc は日本語 prose を正本とし、英語は識別子/開発用語に限る) が
英語のみの見出し 1 行と表 6 行を fail-close したため、**当該行に日本語ラベルを前置し原文を括弧で保持**した。
意味・数値・判定結果は変えていない。上表の sha256 は改変前 (原本) の値である。

| file | 行 | 改変前 (先頭部) | 改変後 (先頭部) |
|---|---|---|---|
| `00_VERSION_STRATEGY.md` | 14 | `## release progression` | `## リリースの進行 (release progression)` |
| `VALIDATION.md` | 10 | `IDs / coverage / DAG / prerequisite / migration order` | `ID・対応付け・依存 DAG・前提・移行順 (IDs / coverage / DAG / prerequisite / migration order)` |
| `VALIDATION.md` | 11 | `Generated Markdown parity` | `生成 Markdown の同一性 (Generated Markdown parity)` |
| `VALIDATION.md` | 12 | `Relative Markdown links` | `相対 Markdown リンク (Relative Markdown links)` |
| `VALIDATION.md` | 13 | `Synthetic schedule resource / dependency / stage order` | `架空 schedule の資源・依存・段階順 (Synthetic schedule resource / dependency / stage order)` |
| `VALIDATION.md` | 14 | `Validator negative self-tests` | `validator の負系 self-test (Validator negative self-tests)` |
| `VALIDATION.md` | 15 | `PR517 compact handoff` | `PR517 向け短い差し込み (PR517 compact handoff)` |

## 資料内リンクの注意

資料の `README.md` は `python tools/render_roadmap.py --check` / `python tools/validate_roadmap.py` の再実行を案内するが、
両 tool は本 repo に収容していない (上表 archived)。`VIEWER_CHECK.md` が言及する閲覧 HTML も同様。それ以外の相対リンク
(Markdown 相互、`data/*.json`) は収容範囲内で解決する。
