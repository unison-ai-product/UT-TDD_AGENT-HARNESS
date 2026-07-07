# A-185 vmodel-docgen リファレンスマイニング所見 (2026-07-07)

## 背景

PO 提供の外部参照パッケージ `Vモデル設計ドキュメント.zip` (`vmodel-docgen`) を、UT-TDD harness の
設計体系の抜け漏れ点検のため精読した。参照は **V-model 設計書 53 種**の汎用ドキュメント・ジェネレータ
(YAML ソース → Excel / スプレッドシート / 図面生成、カバレッジ/依存/整合性チェック + PoC/Standard/
Enterprise 規模プロファイル付き)。ADR-001 に従い、**Python 実装でなく設計・ロジック概念を source
material として抽出**する (UT-TDD は TS-native)。

点検は 2 系統: (§A) ドキュメントカタログのカバレッジ gap、(§B) PO 指摘 3 領域 (トラブル系検出 /
図化ロジック / DB 構成) の転用ロジック。UT-TDD 側の判定は全て実 grep / read で裏取り (pmo-sonnet
検証 + 直接確認)。grep ベースのため false-negative の可能性は残る。

## §A ドキュメントカタログ カバレッジ gap (UT-TDD `VALID_SUB_DOCS` + document-system-map 対照)

**健全 (covered)**: 中核 V-model 設計 (L0-L6)、外部設計カタログ (帳票/バッチ/通知/コード値)、
FE 設計 (screen-functional/ui-standard/ui-detail/screen-spec)、入出力 (if-detail)、命名規則/
コーディング規約 (coding-rules.md)、共通部品・クラス設計 (class-design)、アクセシビリティ (L10)、
AIエージェント設計 (concept §9 + agent-slots)、外部化・差し替え (C.7 / PLAN-L5-12)。

**抜け漏れ (重要度順、裏取り済)**:

| 優先 | 設計書型 | 判定 | UT-TDD 現状 |
|---|---|---|---|
| ① | セキュリティ設計 / STRIDE 脅威モデル | partial | `PLAN-L4-16-security-design-slot` が draft のまま。認証認可を持つ harness 自身に脅威モデル不在 |
| ① | 権限マトリクス | gap | 正本外 (ai-dev-team = reference-only) にしか無い |
| ① | アプリセキュリティ対策 / セキュリティテスト計画 | partial/gap | L4-16 スコープ予定だが未確定 |
| ② | テスト計画書 (全体) | gap | 層別 test-design のみ。上位で束ねる統制が無い → RECOVERY-10 右肺と直結 |
| ② | 性能試験計画 | gap | NFR 受入判定の根拠が無い |
| ③ | データディクショナリ | gap | data.md (ドメインモデル) はあるが field 単位網羅一覧が無い |
| ③ | 表示名/ラベルカタログ・エラーメッセージ一覧 | gap | 画面/帳票の表記統一・多言語の基礎 |
| ③ | 国際化 i18n 設計 | gap | 多言語展開の後戻り防止 |
| ④ | 環境定義書 / ネットワーク / サーバー・インフラ設計 | gap | 本番構成の可監査性 (② product-select 候補) |
| ④ | 信頼性・DR・BCP / 変更管理 | gap | 本番運用の事業継続 (② product-select 候補) |
| △ | CI/CD 設計・イベント/メッセージスキーマ・KPI/計測・ログトレース設計 | partial | 実装/概念はあるが専用設計 doc が無い |

**構造的所見**: (1) セキュリティ一群が draft 1 本 (L4-16) に全懸かり = 最大リスク。spec 駆動なら
「セキュリティは L4 で確定」の親宣言だけ残って実体が無い状態が固定化する。(2) 「テスト計画書 (全体)」
不在は RECOVERY-10 右肺と同じ穴 (参照カタログは 06-09 テスト設計の上位に 12 テスト計画書 + 28 検証設計書
を持つ)。(3) ④群は多くが「② プロダクト選択」で、harness 自身は skip 可だが meta-model には slot が要る。

## §B 3 領域 転用ロジック (参照 `vmodel-docgen/tools/` × UT-TDD 実状)

### ① トラブル系検出 — 参照 `build.py cmd_check` は 4 種、UT-TDD は 2.5 種

参照の `cmd_check` は ID 族 (`R-`/`NR-`/`F-`/`SC-`/`T-`/`API-`/`IF-`/`BT-`/`UT-`…) を「定義テーブル
先頭列 = 定義」とみなし、全 doc 横断で 4 種の構造矛盾を一括検出する:

| 参照の検出 | UT-TDD 実状 (裏取り) | 差分 |
|---|---|---|
| 参照切れ (未定義参照) | covered: relation-graph `missing-projection` / trace | 同等 |
| 孤立 (定義済・未参照) | covered: descent-obligation / forward-convergence orphan | 同等 |
| 重複定義 (同 ID を複数 doc が定義) | partial: namespace 個別のみ (`duplicate_plan_id` `lint.ts:660` / gate / skill / artifact / backlog)。**設計 doc 横断の oracle/entity ID 重複定義は非カバー** | 部分 gap |
| 循環依存 (DFS 彩色) | partial: module 級のみ (`dependency-drift.ts:218 detectCycles`)。**設計 doc 間 (doc a が doc b 定義 ID を参照する循環) は非カバー** | gap |

転用: 検出が namespace ごとに散在している UT-TDD に対し、参照は「ID 族 × 全 doc 横断で 4 種一括」の
統一機構を持つ。**設計 doc 間循環依存**と**横断的重複定義**が新規 gate 候補。

### ② 図化ロジック — 参照は完成品、UT-TDD は version-up parked

- `build.py cmd_deps` + `_extract_ids`: **設計間依存グラフ** (edge a→b = doc a が doc b 定義の ID を参照、
  共有 ID 数で重み付け) + 依存マトリクス + **focus view** (一設計の依存先/依存元の双方向) + **phase 列
  レイアウト** (要求→要件→基本→詳細→テスト→品質運用→標準管理)。
- `diagram_dsl.py`: **データ駆動作図** (`diagrams.yaml` 宣言 → flow / er / sequence / wireframe、
  各図に `trace` フィールドで出所リンク、案件非依存)。

転用: `PLAN-L7-247/248` (図面生成、version-up parked) の設計 source。特に「共有 ID 数で重み付けた
設計間依存」「focus (一設計の上下流)」「trace リンク付き図」は harness.db の `trace_edges` から即導出可能。
参照実装が設計を埋めているため、parked のままにする理由が薄い (parked 解除判断の材料)。

### ③ DB 構成 / スケールプロファイル — product-select gap の解決機構

- `schema/doc.schema.json`: **block 型付き構造化文書モデル** (`sec`/`sub`/`para`/`bullets`/`kv`/`table`/
  `note`/`gap`)。UT-TDD は prose + frontmatter。参照は「構造化 ID テーブル」を持つから validate/check/deps
  が回る (§B① の前提)。UT-TDD の doc は日本語 prose 正本方針 (CLAUDE.md) のため全面採用はしないが、
  設計 doc が機械可読 ID テーブルを持つと横断チェックが強くなる、という含意。
- `build.py cmd_profile` + `profiles.yaml`: **PoC / Standard / Enterprise の規模プロファイルで、各設計書の
  採用 / skip / 粒度 (詳細 / 標準 / 簡易) を自動設定**。

転用: これは §A ④product-select gap (infra / DR / i18n 等) の解決機構そのもの。UT-TDD の
「② プロダクト選択 + `skip_sub_doc[].reason`」を、**規模プロファイル × 粒度の二軸で自動化**できる。
UT-TDD に size-profile 機構は無い (gap)。

## §C 優先起票候補 (PLAN)

1. **`PLAN-L4-16` (security-design-slot) の tl/po 判断**を進め、脅威モデル / 権限マトリクス / 対策 /
   セキュリティテストを確定 (最優先、既存 draft の解凍)。
2. **設計 doc 整合性チェック gate** = 重複定義 (横断) + 循環依存 (設計 doc 級) の新規検出を doctor へ追加
   (参照 `cmd_check` を TS で再設計。既存の module 級 `detectCycles` / namespace 級 dup を設計 doc 級へ拡張)。
3. **`PLAN-L7-247/248` 図面 track を依存グラフ / focus / trace 図で具体化**し、parked 解除可否を判断
   (参照 `cmd_deps` / `diagram_dsl` を設計 source に、harness.db `trace_edges` から導出)。
4. **規模プロファイル機構** (PoC/Standard/Enterprise × 粒度) を新設し、§A ④product-select gap を
   slot 化 or 明示 skip の自動判定で吸収。
5. **テスト計画書 (全体) slot** を RECOVERY-10 右肺 (検証戦略の上位) と統合設計。
6. データディクショナリ / 表示名・メッセージ・i18n を L4 `data` / 新 slot で back-fill。

起票順は PO/TL 裁定。document-system-map §4 に §A の未カバー slot 表 + 規模プロファイル判定を追記して
一望できる形にしてから個別 PLAN 化する (承認済み方針)。

## §D Finding Route (research 内部監査ワークフロー、PLAN-L7-198 / research.md §3 第二 exit)

本監査は Research 駆動の内部監査であり、finding を「読んで終わり」で宙に浮かせない
([[feedback_coverage_not_substance]])。各 finding を `route eval --finding-type` で分類し、既存 mode の
起票候補へ接続する。**全て `auto_create=false` / 人間承認待ち**で、実 PLAN 起票は PO/TL yes 後。候補は
finding-route ledger 正本 `.ut-tdd/audit/A-156` の「A-185 Candidates」節に集約する。`route eval` 実走証跡は
`.ut-tdd/audit/route-approval.jsonl` (2026-07-07)。

| finding | finding_type | route (mode / route_signal) | candidate prefix | 備考 |
|---|---|---|---|---|
| セキュリティ設計 / STRIDE / 権限マトリクス | feature-gap | Add-feature / `feature_addition` | **PLAN-L4-16 (draft)** | **既 routing 済 (A-174 F-4)**。新規でなく draft の unblock。最優先 |
| 設計 doc 整合性チェック gate (横断重複定義 + 設計 doc 級循環依存) | feature-gap | Add-feature / `feature_addition` | `PLAN-L7-` | vmodel-docgen `cmd_check` parity。§B① |
| 設計間依存グラフ / focus / trace 図 | feature-gap | Add-feature / `feature_addition` | **`PLAN-L7-247/248` (parked)** | `cmd_deps`/`diagram_dsl` parity。parked 解除判断。§B② |
| 規模プロファイル機構 (PoC/Standard/Enterprise × 粒度) | feature-gap | Add-feature / `feature_addition` | `PLAN-L7-` | `cmd_profile` parity。④product-select gap 吸収。§B③ |
| テスト計画書 (全体) slot | feature-gap | Add-feature / `feature_addition` | `PLAN-L7-` | RECOVERY-10 右肺と統合。§A② |
| データディクショナリ / 表示名 / エラーメッセージ / i18n slot | feature-gap | Add-feature / `feature_addition` | `PLAN-L7-` | §A③ |
| 環境定義 / ネットワーク / インフラ / DR-BCP / 変更管理 slot | feature-gap | Add-feature / `feature_addition` | `PLAN-L7-` | 規模プロファイルで skip/採用 自動判定。§A④ |

Recovery 系 (regression/premise-gap/deviation) の新規候補は無し (本監査の所見は全て「不足機能の追加」=
feature-gap)。セキュリティは既に A-174 F-4 で routing 済のため再 routing しない (二重起票回避)。

## Boundary

本 doc は Recovery/Add-feature/Refactor PLAN を自動起票しない。routeable candidate を記録するのみで、
起票は人間承認 + 各 mode の exit 契約充足を要する (recovery.md / add-feature.md)。
