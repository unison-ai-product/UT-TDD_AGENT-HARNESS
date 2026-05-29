# UT-TDD ドキュメント体系マップ (業界標準 grounding + フロー改善)

> 各 V/V-model 工程の **① 必須スケルトン (作成必須ドキュメント)** を業界標準 (日本式 IPA 共通フレーム + 国際標準 + Design by Contract) で裏付ける正本。
> メタモデルの ① 必須タスク/doc の grounding 資料 ([[ut-tdd-agent-harness-concept_v3.1]] §3 V/V-model と連動)。
> 出典は §5 に集約。調査基準日: 2026-05-29 (A-61、pmo-tech-docs 調査)。

## §0 用語の確定 — 基本設計 = 外部設計 / 詳細設計 = 内部設計

IPA 共通フレーム 2013 (SLCP-JCF) では次が**同義**として扱われる (情報処理技術者試験でも併記):

| 日本 SI 用語 | 同義語 | 設計の視点 | UT-TDD 層 |
|---|---|---|---|
| **基本設計** | **外部設計** | ユーザー (発注者/エンドユーザー) から見える側。画面/帳票/IF/データ/業務処理の **振る舞い (what)** | L4 (一部) |
| **詳細設計** | **内部設計** | システム内部構造。モジュール分割/関数/DB 物理設計の **実装 (how)** | L5 |
| 方式設計 | アーキテクチャ設計 | 技術スタック/構造方針。日本 SI では基本設計の入口、国際標準では独立文書 | L4 (一部) |

> **重要**: UT-TDD の **L4 基本設計は「方式設計 (arch) + 外部設計 (外部 IF)」の両方を含む**。国際標準 (arc42 / ISO 42010) では方式設計を独立文書 (ADR + Architecture Description) にするため、L4 内で sub-doc を分離する (§4 Z1)。

## §1 工程 × 成果物 × 標準 マスター表 (L0-L14)

> **ゲート (G_N) の設計・台帳・自動追加型クロスチェック機構は [gate-design.md](./gate-design.md) を正本**とする (各ゲートの判定 4 軸 / サインオフ / fail routing / ルールエンジン)。

| UT-TDD 層 | 日本 SI 工程 | 主成果物 (① 必須) | 国際標準 | V-pair (テスト設計) |
|---|---|---|---|---|
| **L0** 企画 | 企画 (システム化構想) | 企画書 (kind=charter) / ユビキタス言語 §Glossary | ISO 29148 BRS / PMBOK Charter | — (origin) |
| **L1** 要求定義 | 要求定義 | 業務要求 BR-*/NFR-* (5 sub-doc) | ISO 29148 **StRS** / IPA NFR グレード 2018 / DDD | ↔ L14 運用テスト設計 |
| **L2** 画面設計 | 基本設計(画面)前段 | ワイヤーモック (画面一覧/遷移/WF/UI 要素) | arc42 §8 / C4 Container(UI) / ISO 9241 | ↔ L10 (モック自体がペア) |
| **L3** 要件定義 | 要件定義 | 機能要件 FR-*/AC-* (3 sub-doc) | ISO 29148 **SyRS** / **BDD Given-When-Then** | ↔ L12 受入テスト設計 |
| **L4** 基本設計 | **基本設計(外部設計) + 方式設計** | 方式設計/ADR + 外部 IF 設計 + データ設計(ドメインモデル) + 画面設計確定 | ISO 42010 / **arc42 §4-§5/§9** / C4 Container / IEEE 1016 / DDD | ↔ L9 総合テスト設計 |
| **L5** 詳細設計 | **詳細設計(内部設計)** | D-API / D-DB / D-CONTRACT (内部処理/モジュール/物理DB/IF詳細) | **IEEE 1016 SDD** / UML / **DbC (pre/post)** | ↔ L8 結合テスト設計 |
| **L6** 機能設計 | (詳細設計末端、関数 level) | 関数 schema / クラス設計 / エッジケース / WBS | **IEEE 1016 §5.7 Pseudocode** / UML method | ↔ L7 単体テスト設計 |
| **L7** 実装 | 製造 | ② 実装コード + ④ テストコード (TDD Red→Green→3点R) | ISO 12207 §7.1 / CMMI SP1.4 | (G7 4-artifact trace freeze) |
| **L8** 結合テスト | 結合テスト | 結合テスト実施/報告 | ISO 29119-3 TDS | (L5 と対) |
| **L9** 総合テスト | 総合テスト | 総合テスト実施/報告 | ISO 29119-3 TDS | (L4 と対) |
| **L10** UX 磨き | (日本 SI に独立工程なし) | FE デザイン確定 / UX 検証 | **WCAG 2.2 / ISO 9241-110** | (L2 と対) |
| **L11** 総合レビュー+UAT | 受入テスト前段 | BR↔実装突合 / PO UAT | ISO 29119-3 Acceptance | (L3 と対) |
| **L12** デプロイ+受入 | 受入テスト | リリース手順 / 受入チェックリスト (AC 全件) | IEEE 829 / ISO 25010 | (L3 と対) |
| **L13** デプロイ後検証 | 運用引渡し | 自動監視 / SLA 確認 | **ISO 29119-2 Test Evaluation** / SRE SLO/SLI | — (post-deploy) |
| **L14** 運用検証+改善 | 運用テスト・保守 | 運用テスト設計 (L1 でペア) / 改善 FB | ISO 12207 §7.4-§7.5 | (L1 と対、最長ペア) |

## §2 国際標準クロスマップ (要点)

| UT-TDD 成果物 | 標準ドキュメント種別 | 主要§ |
|---|---|---|
| L1 業務要求 | ISO 29148 StRS | 利害関係者ニーズ / 運用概念 / 制約 |
| L3 機能要件 + AC | ISO 29148 SyRS + BDD Feature | FR + Given-When-Then + trace matrix |
| L4 方式設計/ADR | arc42 §4 Solution Strategy / §5 Building Block (L1) / §9 ADR / ISO 42010 | Viewpoint / View / Design Decision |
| L4 データ設計 | DDD (Evans) | 集約境界 / 値オブジェクト / 不変条件 |
| L5 詳細設計 | IEEE 1016 SDD / UML | Execution Architecture / クラス・シーケンス図 |
| L6 機能設計 | IEEE 1016 §5.7 | Design Entity + Pseudocode |
| 各テスト設計 | ISO 29119-3 TDS / IEEE 829 | テスト観点 / 条件 / カバレッジ基準 / 技法 (29119-4) |
| NFR | ISO 25010 SQuaRE × IPA NFR グレード | 8 品質特性 二軸タグ (concept §3.1.2.1 済) |
| 双方向 trace | NASA SE Handbook / DO-178C | traceability matrix (UT-TDD 6 方向 trace と同型) |

## §3 配線図 = Design by Contract (Bertrand Meyer)

コンポーネント間の「配線 (接続/契約)」は **Meyer の Design by Contract** で記述する。三要素と UT-TDD 成果物の対応:

| DbC 要素 | 定義 | 記述成果物 | UT-TDD 層 |
|---|---|---|---|
| **Precondition** (事前条件) | 呼出側 (client) が保証する入力条件 | API 入力仕様 / バリデーション規則 | L5 D-API 入力節 / L6 関数 signature |
| **Postcondition** (事後条件) | 呼出され側 (supplier) が保証する出力/状態 | API レスポンス / 副作用 / エラー応答規約 | L5 D-API 出力節 / L6 関数 signature |
| **Invariant** (不変条件) | 常に保持すべき状態条件 | ドメイン制約 / 集約整合性 / DB 整合性制約 | L4 データ設計 (不変条件) / L5 D-DB |

| UT-TDD 概念 | DbC 対応 |
|---|---|
| `D-CONTRACT` (コンポーネント契約書) | Precondition + Postcondition + Invariant の三点セット (L5) |
| `D-API` | Precondition (入力) + Postcondition (出力・エラー) 中心 (L5) |
| `D-DB` | Invariant (DB 整合性制約) (L5) |
| `contract_registry` | DbC 契約の機械検証可能な一覧 (L5→L6→L7 段階確定) |
| 配線 (signal→mode routing / drive×layer 注入、concept §2.6) | DbC の **Invariant / orchestration 契約**層 (「この layer で誰が何を保証するか」) |
| **G5 API/Schema Freeze** | Precondition/Postcondition の freeze = 変更禁止宣言 (DbC 的に最重要 freeze 点) |
| テスト設計ペア (③) の 1:1 対応義務 | DbC 契約から test oracle を導出 (L6 ↔ 単体テスト設計) |

> 出典: Meyer "Applying Design by Contract" (IEEE Computer, 1992)。

## §4 フロー改善 (ズレ/空白 Z1-Z6 + 追加推奨)

業界標準と現行 UT-TDD doc 体系の差分。**適用区分**: 🟢 本 doc で確定 / 🔵 L4 着手時に適用 (backlog 登録) / ⚪ 後続 carry。

| # | 改善 | 区分 | backlog |
|---|---|---|---|
| **Z1** | L4 を「方式設計 (arch/ADR、arc42 §4/§9)」と「外部設計 (外部 IF)」の sub-doc に明示分離 | 🔵 L4 | IMP-017 |
| **Z2** | L4 外部 IF (what/形状) ↔ L5 D-API (how/contract 詳細) の粒度境界を明確化、二重定義回避 | 🔵 L4/L5 | IMP-018 |
| **Z3** | L6 機能設計に **IEEE 1016 §5.7 (Pseudocode)** を grounding として §11 追記 | 🔵 L6 | IMP-019 |
| **Z4** | L10 UX 磨きに **WCAG 2.2 / ISO 9241-110** を受入基準 reference 追記 | ⚪ | IMP-020 |
| **Z5** | L13 デプロイ後検証を **ISO 29119-2 Test Evaluation** に接続 (SLO/SLI を test result 扱い) | ⚪ | IMP-021 |
| **Z6** | L3 AC を **BDD/Gherkin (Given-When-Then)** 記述形式候補として §11 追記、L12 受入と機械連携 | 🔵 L3/L12 | IMP-022 |
| **E1** | **ADR テンプレート (arc42 §9)** を L4 方式設計 sub-doc の必須 artifact 化 | 🔵 L4 | IMP-023 |
| **E2** | テスト設計観点一覧 (**ISO 29119-4** 技法: 境界値/同値/デシジョンテーブル) を各テスト設計に明記 | ⚪ | IMP-024 |
| **E3** | arc42 §5 (Building Block L1/L2) → L4/L5 sub-doc のビューマッピング表を追加 | 🔵 L4 | IMP-025 |

> 🟢 本 doc で確定済: §0 (基本設計=外部設計)、§1 (L0-L14 標準マップ)、§3 (配線図=DbC)。これらは concept §3 / §11 の grounding 正本となる。

## §5 参照標準

- IPA 共通フレーム 2013 (SLCP-JCF): https://www.ipa.go.jp/publish/secbooks20130304.html
- ISO/IEC/IEEE 29148:2018 (要件、StRS/SyRS): https://ieeexplore.ieee.org/document/8559686
- ISO/IEC/IEEE 42010:2022 (アーキ記述) ← arc42: https://quality.arc42.org/standards/iso-42010
- arc42 テンプレート (12 節) / C4 model 補完: https://faq.arc42.org/questions/B-17/
- IEEE 1016-2009 (SDD): https://standards.ieee.org/ieee/1016/4502/
- ISO/IEC/IEEE 29119-3:2021 (テスト設計): https://www.iso.org/standard/79429.html
- BDD / Gherkin (Given-When-Then): Cucumber 公式
- Bertrand Meyer "Applying Design by Contract" (1992): https://se.inf.ethz.ch/~meyer/publications/computer/contract.pdf
- ISO/IEC 25010:2011 SQuaRE (品質特性): concept §3.1.2.1 で IPA × ISO 25010 二軸タグ済
- NASA SW Engineering Handbook / DO-178C (V&V trace): 双方向 trace の概念根拠
