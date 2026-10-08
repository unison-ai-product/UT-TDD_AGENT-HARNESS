# 文書系 (V モデル文書テンプレートと検査) 棚卸し

- 作成日: 2026-10-08。作成: PMO Sonnet (read-only。repo / GitHub は変更していない)。
- 調査対象: `docs/templates/` 全 100 ファイル弱 (vmodel 21 slot + optional 27 + review-examples 5 + design 1 + plan 2 + state 1 + prompts 1 + github + adapter)、`src/` の検査コード、v4 要件 FR-001〜076 / 受入、製品保護 synthesis (FR-077 / FR-078)。
- 判定は本文を読んで行った。frontmatter や見出しだけでは判断していない。
- 記号: [確認] = 本文 / コードで直接確認。[推定] = 読みから推定。
- 充実度の定義: 空 = 見出しもほぼ無い。骨組み = 章立て + `<記入>` 欄だけで中身の指針が無い。実用 = 記入の指針・判定基準・例が本文に入っている。

## 0. 先に結論 (8 行)

1. 21 slot + 27 optional のテンプレートは、ほぼ全部が「ZIP の章立てを写し、空欄に `<記入>` を置いた骨組み」である [確認]。実用に近いのは L9 の脆弱性診断節 (OWASP 10 行)、L5-module、L13 / L14 の一部、optional 096 / 108 / 109 だけである。
2. **`<記入>` / `<本文を記入>` / `<項目を記入>` の残存を検知するコードは `src/` に 0 件** [確認: `grep "記入>\|<記入\|本文を記入\|項目を記入" src` = 0 件]。`記入` を含むのは `src/handover/index.ts:301,342` (handover の human 欄の説明) だけで、文書検査ではない。テストの `tests/release-consumer-gates.test.ts:297,458,604,773,930` と `tests/consumer-g14-static.test.ts:50` は、`<記入>` 行を差し替えてから gate に流す fixture である。
3. 文書の中身を見る検査は G8〜G14 (右腕の static gate) だけである。`src/gate/right-arm-static.ts` が必須見出し (`:44-:192`) と case 表の列名を見る。**残りの章 (L8〜L14 の方針・環境・不具合表など) は空欄のままでも通る** [確認: `:225-:231` が `id.startsWith("<")` の行を読み飛ばし、case 行が 0 件のときだけ `:232` で落とす]。
4. 左腕 (G0.5〜G7) の文書検査は「ファイルがある・`status: confirmed`・pair の相互参照・孤児 0」止まりで、本文の記入は見ない。`vmodel-contract.yaml` の `required_artifacts` (G4 の `security` など) を中身まで確かめる経路は G8 以降にしか無い [確認: `requiredArtifacts` の消費は `right-arm-static.ts:1313` のみ]。
5. 製品保護 (FR-077 / FR-078) の受け皿: L4-security は章立てが近いが、データ区分の「保持期限 / 削除方式」列、露出面台帳、委託先・保守経路、検知設計、secret ローテーションが無い。L13 / L14 は運用の項目はあるが、証跡の「実施日時 / 実施者 / 結果 / 有効期限」を持つ型が無い。profile を宣言する文書は存在しない。
6. v4 への移行で、テンプレートの層構成が丸ごとずれる (FR-066: v3 の L8 結合 / L9 システム / L10 UX / L11 trace-uat / L12 受入 → v4 の L7 単体テスト / L8 as-built / L9 結合 / L10 システム / L11 UX / L12 受入)。`docs/templates/vmodel/` は FR-069 で廃止予定。**いま `<記入>` 検査を v3 の層名へ作り込むと、v4 切り替え時に作り直しになる**。検査は「層名に依存しない形」(doc_type_id と必須節の宣言から駆動) で作るのが最小である。
7. v4 FR が要求するのにテンプレートが無い文書種別が 20 種ほどある (§2)。大半は「record」であって長文書ではなく、JSON schema + 生成 view で足りる。
8. 古い残骸: `docs/templates/state/vmodel.json` は自分で `_superseded` と書いている旧 L1〜L4 / G3.8 の構造である [確認: `:5`]。それでも `authoring-template-inventory.ts:30` が必須配布物にしており、`pack-authoring-smoke.ts:52` が JSON.parse するだけで中身を見ない。FR-069 の「廃止層番号の残存 0」の grep に必ず引っかかる。

---

## 1. テンプレート別の表

凡例 (列): path は `docs/templates/` からの相対。検査の「有」は中身を見る検査があること。下の共通検査 (C1〜C6) は全 slot に掛かる。

共通検査:

- C1 = 存在・index 整合: `src/setup/vmodel-template-writer.ts` (`:18-:20` port index と document catalog の照合、`:143-:178` slot 重複 / 欠落)。中身は見ない。
- C2 = frontmatter / pair / freeze: `src/vmodel/lint.ts` (`:274-:432` L2 / L5 の必須 doc と `status: confirmed`、pair_artifact 一致)、`src/lint/g1-trace.ts` / `g3-trace.ts` (BR / UX / FR / AC の孤児)。
- C3 = G8〜G14 static: `src/gate/right-arm-static.ts` (見出しと列名と case ID / trace / evidence manifest)。
- C4 = `src/lint/design-language.ts` (`:174-:181`): 設計系 doc の英語 prose の検出。
- C5 = `src/lint/readability.ts`: 文字化け (mojibake) の検出。
- C6 = `src/lint/plan-body-substance.ts` (`:44-:60`): PLAN 本文 0 行の検出。`<記入>` 行も「実体行」に数えるので、骨組みでも通る。

### 1.1 required slot (21 本、`vmodel/`)

| path | 層 (v3 → v4 の見込み) | 中身の充実度 | 対応する v4 FR / AC | 検査の有無 (file:line) | 製品保護の義務の受け皿 | 問題点 |
|---|---|---|---|---|---|---|
| vmodel/L0-charter.md (127 行、placeholder 18) | L0 → L0 | 骨組み。10 章あるが各欄は `<記入>` | FR-015 (intake)、FR-029 (L0〜L4 は文書単位で人間 owner 1 名) | C1 / C2 のみ。章の検査なし | 無。事業 charter にデータ区分・露出面・可用性を宣言する場が無い (FR-077 の profile 置き場が未定) | profile 宣言の置き場として最も自然 (最上流) だが欄が無い。第 9 章リスクは自由記述で、security の分類が無い |
| vmodel/L1-requirements.md (90 / 12) | L1 → L1 | 骨組み | FR-015、FR-058 (provisional / frozen)、FR-008 (スプレッドシート view) | C2 (`g1-trace.ts` が BR / UX → 画面 trace)。章の検査なし | 不足。第 5 章 非機能要求(SaaS) は分類欄だけで、security / 可用性の必須行が無い | 見出しが「(SaaS)」固定。SaaS 以外の製品 (CLI・社内ツール) に合わない。`最低 7 行` は HTML コメントで、検査されない |
| vmodel/L2-screen-list.md (64 / 3) | L2 → L2 | 骨組み + **SaaS サンプルの実データ残存** (SC-001 サインアップ〜SC-007 課金/プラン、signup / billing の遷移) | FR-056 (画面プロト工程の 11 record)、FR-057、FR-039、AC-051 / 068 / 069 | C3 の `l2ScreenIds` (`right-arm-static.ts:615-:636`、`REQUIRED_L2_SCREEN_COLUMNS` `:192`)。`vmodel/lint.ts:274-:348` が prototype 合意の marker を要求 | 無 | サンプル画面がそのまま残る。利用者が消し忘れると、他製品の画面 ID が L10 の trace 先になる。FR-056 の必須最小 4 要素 (初期画面ルール / inventory / fixture 契約 / typed finding) の欄が無い |
| vmodel/L3-functional-requirements.md (194 / 26) | L3 → L3 | 骨組み。最大級 (26 欄) | FR-016 (typed IR)、FR-058、FR-065 (AT 宣言の元になる要件)、FR-073 (「非機能の水準」参照) | C2 (`g3-trace.ts`: FR → AC)。C3 が L3 の ID を引く (`:552-:563`, `:583-:600`) | 不足。第 4 章 非機能要件(SaaS) に分類欄はあるが、FR-073 が参照する「非機能の水準」(= FR-077 profile) を宣言する欄が無い。データ項目定義 (第 6 章) に区分・保持期限・削除方式の列が無い | 第 6 章に「全業務エンティティは tenant_id を必須保持する」の SaaS 前提の注記 (`:86`)。profile で変わるべき前提が固定されている |
| vmodel/L4-architecture.md (152 / 22) | L4 → L4 | 骨組み | FR-046 (依存グラフ・図の生成)、FR-070 | C1 / C2 のみ | 不足。露出面・信頼境界・外部依存の台帳に当たる章が無い [推定: 全章を目視] | 「図は record から生成」(FR-046) と矛盾する手描き図前提の欄がある [推定] |
| vmodel/L4-data.md (76 / 9) | L4 → L4 | 骨組み | FR-046 / AC-058 (テーブル定義の正本は schema record。列に区分・保持期限・削除方式) | C1 / C2 のみ | 不足。データ区分 / 保持 / 削除方式の列が無い (synthesis §3.2 の FR-046 改訂が未反映) | C8 (削除済みデータの残存) を防ぐ最初の場所なのに、論理削除 / 物理削除の区別欄が無い |
| vmodel/L4-external-if.md (124 / 16) | L4 → L4 | 骨組み。第 7 章セキュリティは自由記述 | FR-062 (言語をまたぐ境界の JSON Schema)、FR-074 (外部依存の登録簿) | C1 / C2 のみ | 不足。外部依存の縮退 (timeout / circuit breaker) の欄が無い (C13) | 外部依存が登録簿 (FR-074) と結ばれていない |
| vmodel/L4-function.md (117 / 15) | L4 → L4 | 骨組み。第 4 章 DB 設計に tenant_id 注記 (`:74`) | FR-066 (L4 ↔ L10 の対)、FR-007 | C1 / C2 のみ | 無 | 機能一覧だけで、認可 (role × 機能) との結び付きが無い (L4-security との二重管理の恐れ) |
| vmodel/L4-security.md (100 / 13) | L4 → L4 | 骨組み。STRIDE 表・権限マトリクス 2 種・データ分類・秘密情報・監査ログ・OWASP 対策の章立ては**製品保護の器として最も近い** | FR-077 (本文の主受け皿)。FR-055 (認可境界の人間 review) | C1 / C2 のみ。**`<記入>` 残存を止める検査なし** (`grep` 0 件)。`G4` は `required_artifacts: security` と宣言 (`vmodel-contract.yaml:74-:82`) だが中身を見ない | 不足。有: STRIDE、権限マトリクス、データ分類、secret 管理、監査ログ章。無: 保持期限 / 削除方式列、露出面台帳、委託先・保守経路、secret ローテーション、検知 / triage owner、profile 連動 (必須行を profile で変える仕組み) | SaaS / tenant / SOC2 / GDPR 固定 (`:32`, `:70`) で、B (Baseline) の製品に過剰。脅威行から対策の ID (設計 ID / AT ID) へ結ぶ欄が無く、synthesis §2.2 の「脅威行が対策へ結びつく」を機械化できない |
| vmodel/L4-ui-standard.md (113 / 15) | L4 → L4 | 骨組み | FR-056 (初期画面ルール: 画面規約・component / token・縮退状態語彙・失敗 / 回復表示) | C1 / C2 のみ | 無 (security 範囲外) | FR-056 の「初期画面ルール freeze record」の元になるが、freeze と結ぶ欄が無い |
| vmodel/L5-physical-data.md (135 / 17) | L5 → L5 | 骨組み | FR-046 / AC-058 | C1 / C2 (`vmodel/lint.ts:283-` L5 必須 doc) | 不足。バックアップ章 (第 8 章) はあるが RPO / RTO の検証欄は無い | 物理列にも区分・保持期限の列が無い。tenant_id / RLS 前提の注記 (`:70`) |
| vmodel/L5-module-decomposition.md (177 / 37) | L5 → L5 | 骨組み。最大の placeholder 数 | FR-032 (独立単位 + IF 先行)、FR-073 (WBS)、FR-007 (成果物所有を設計書が持つ) | C1 / C2 のみ | 無 | 「触ってよい path の範囲 (成果物の所有)」の欄が無い。FR-007 で PLAN の `generates` を設計書へ移す受け皿になる章が無い |
| vmodel/L6-function-spec.md (56 / 6) | L6 → L6 | 骨組み。**正本は `design/L6-function-spec-template.md`、本ファイルは補足** | FR-067 (L8 は as-built)、FR-069 / AC-082(c) (L6 テンプレートを 1 本にする) | C1。slot 検査 (`vmodel-template-writer.ts`)。L6 の中身検査は `src/lint/l6-completion.ts` / `l6-fr-coverage.ts` [推定: 未精読] | 不足。失敗モード節はあるが、security 仕様 (入力検証・upload・パスワード保存・session・rate limit・物理削除) の必須行が無い | 2 本構成そのものが FR-069 の廃止対象。ZIP-024 の補足節を L6 本体へ転記する手順に頼っており、記入漏れが検知されない |
| vmodel/L7-unit-test-design.md (72 / 11) | L7 → L7 | 骨組み | FR-065 / AC-078 (AT の事前宣言) | C1 / C2。単体 oracle の skeleton 語 (`todo` / `tbd` / `placeholder` / `骨格`) は `src/lint/ddd-tdd-rules.ts:458` が検出するが、これは oracle 欄だけ | 無 | G8〜G14 の static に当たる検査が L7 に無い (L7 の見出し・case 表は見ない)。FR-065 の AT 宣言欄 (検証する要件 / 依存範囲 / 実行の種類 / 環境前提 / 入力形式 / 必須条件) も無い |
| vmodel/L8-integration-test-design.md (72 / 11) | L8 → v4 L9 | 骨組み。第 3 章 case 表が検査の軸 | FR-065、FR-066 (結合テスト = v4 L9)、FR-055 | **有**: `right-arm-static.ts:44-:60` (見出し 7、case 列 6)、`:208-:234` (`parseG8CaseRows`)、`:639` (`checkCaseIds`)、`:652` (`checkCaseTraces`)、evidence manifest (`:1245`) | 不足。認可の負例 (IDOR・別 tenant) を表から生成する行が無い。障害注入 (C13) の行も無い | 検査は case 行 1 件以上で通る。第 1 章 (方針・環境) と第 4 章 (重要度・不具合) は `<記入>` のままでも通る (`:225-:232`) |
| vmodel/L9-system-test-design.md (150 / 11) | L9 → v4 L10 | **実用寄り**。第 1 章 方針の下に ZIP-102 の OWASP Top 10 診断表 (A01〜A10、確認内容が判定可能な粒度) と診断の独立性が入っている | FR-065 (`security` 実行の種類)、FR-066、AC-078 | **有**: `right-arm-static.ts:61-:82` (G9 見出し・列・family)、`:236`、`:735` (`checkG9CaseTraces`)、`:759` (`checkG9Families`)、`:801` (G9 manifest) | 不足〜有。OWASP 診断表は C2 / C3 / C4 / C5 / C7 / C9 に効く。無: 認可負例の生成元 (L4-security の表との結び付き)、DAST の staging 前提、悪用ケース AC、LLM 注入テスト、ペネトレ (H のみ) | 「対象設計」列が ZIP の番号 (10,04,21,57,23,15,75,26,34,56,60,38,93,42,25,11) を指し、このうち 56 / 57 / 60 / 75 / 93 / 21 / 23 / 34 / 42 にはテンプレートが存在しない (dangling)。診断表の「結果」列は空で、検査は見ない |
| vmodel/L10-ux-validation.md (61 / 9) | L10 → v4 L11 | 骨組み | FR-056、FR-066 (UX 検証 = v4 L11) | **有**: `right-arm-static.ts:83-:94`、`:269`、`:487` (L2 画面 ID へ trace)、`:821` | 無 (security 範囲外) | skipped を許す slot (`:1453`) は profile 選択の権限が無いので deny (VMC-005)。画面 ID が L2 の SaaS サンプルと一致すると誤って通る (L2 の残存サンプルに依存) |
| vmodel/L11-trace-uat.md (71 / 9) | L11 → v4 では**解体** (FR-066: 総合レビューは各層の gate へ分ける) | 骨組み | FR-066 | **有**: `right-arm-static.ts:95-:106`、`:308`、`:948` (`validateG11Artifacts`: requirement ID 全件の traced / blocked 状態) | 無 | v4 で層ごと無くなる見込み。検査コード (`:948-:1046`) の移し先が要件に無い |
| vmodel/L12-acceptance-test-design.md (72 / 11) | L12 → v4 L12 | 骨組み | FR-065 (受入 catalog は test-design から生成)、FR-032 (system 受入は release 適格性で閉じる) | **有**: `right-arm-static.ts:107-:119`、`:347`、`:1047` (`checkG12Artifacts`) | 不足。「残余リスクの受容記録」(人間 ack の decision record) と、profile が必須とする AT の合否欄が無い | 受入 catalog (FR-065) との結び付き (手で編集しない、生成) が書かれていない |
| vmodel/L13-production-observation.md (157 / 22) | L13 → v4 L13 (変更なし。ただし中身の規定が要る) | 骨組み。運用設計 1〜4 章 + ログ・トレース設計 + `harness 追補: G13 検証ケース` | FR-066、FR-078 (運用証跡)、AC-079 | **有**: `right-arm-static.ts:120-:162`、`:386`、`:671`、`:881`、`:1093` (`checkG13Artifacts`) | 不足。監視 SLI・バックアップ節 (`:61-:65`) はあるが、露出スキャン、検知ルールの発火試験 (alert が owner に届く時間) の欄が無い | L14 と**運用設計の 1〜4 章が重複** (`L13:61,65` と `L14:61,65` が同じ「バックアップ/リストア」表)。同一 ZIP-011 を 2 本に複写している。どちらに書くか利用者が迷う |
| vmodel/L14-operational-test-design.md (167 / 25) | L14 → v4 L14 | 骨組み。パッチ・脆弱性 / 依存管理、保持・アーカイブ・削除、引継ぎの章を持つ | FR-078 (期限付き運用証跡)、FR-074 (定期再検査)、FR-066 | **有**: `right-arm-static.ts:127-:133` / `:163-:191`、`:426`、`:702` (`checkG14CaseTraces`)、`:901`、`:1185`。加えて `src/lint/l14-close-audit.ts` | 不足。第 2 章 (`:115`) は期限・重大度別 SLA を持たない。委託先・保守アカウント棚卸し、secret ローテーション、復元演習、runbook 演習の行が無い | 「実施日時 / 実施者 / 結果 / 有効期限」を持つ型が無い。自己申告だけの証跡を弾く規定も無い |

### 1.2 optional (27 本、`vmodel/optional/`)

optional は `template_kind: optional` で layer に束ねない (`README.md:71`)。**検査は C1 (port index 整合) だけで、中身を見る検査は 0 件** [確認: `grep "optional/0" src` で検査コードなし。`vmodel-template-writer.ts` は配置のみ]。以下は 1 本 1 行の短評。

| path | 中身の充実度 | 対応する v4 FR / AC | 製品保護の受け皿 | 問題点 / 備考 |
|---|---|---|---|---|
| optional/012-test-plan.md (97 / 14) | 骨組み | FR-065 | 不足 | AT 宣言 (FR-065) の元になりうるが、宣言欄が無い。disposition は `merge → vmodel-contract.yaml` |
| optional/013-migration-plan.md (54 / 8) | 骨組み | FR-067 (既存契約の移行)、FR-069 | 無 | 製品のデータ移行と、ハーネスの v3 → v4 移行が同名で混ざる |
| optional/014-issue-risk-decision-log.md (49 / 5) | 骨組み | FR-001 / FR-058 (decision record)、FR-076 | 不足 | **残余リスク受容 (人間 ack の decision record) の受け皿に使える**が、optional のまま。必須化の対象 |
| optional/015-development-standards.md (84 / 12) | 骨組み | FR-076 | 不足 | secret scan / SAST の標準の置き場に使える |
| optional/016-batch-design.md (61 / 8) | 骨組み | `sub-doc-section-structure.ts:24-:29` の `batch` 型 | 無 | 唯一、**検査コード側が必須節 (バッチ一覧 / ジョブフロー / 入出力 / 処理仕様 / 実行スケジュール・リカバリ / 関連 doc) を宣言**している。検査は PLAN の h2 を見る (`:98-:106`) ので、テンプレートの章名と一致しているかは別問題 [推定] |
| optional/017-design-index-definitions.md (119 / 21) | 骨組み | FR-008 (必須 view) | 無 | 設計一覧を手書きする前提で、生成 view (FR-008 / 046) と二重管理になる |
| optional/019-workflow-definition.md (39 / 4) | 骨組み | FR-002 (RACI) | 無 | 工程 × 役割の RACI 表 (FR-002) の欄が無い |
| optional/020-metrics-kpi-design.md (61 / 8) | 骨組み | FR-072 (token / 費用 / 所要時間) | 不足 | 検知の目標時間 (C9) の置き場に転用できる |
| optional/025-network-design.md (59 / 8) | 骨組み | — | 不足 | 露出面台帳 (E 軸の事実照合) の元になりうる。台帳の型が無い |
| optional/026-server-infrastructure-design.md (54 / 8) | 骨組み | — | 不足 | 同上。IaC から露出面を導出する前提 (synthesis §3.4) と結び付かない |
| optional/030-glossary-data-dictionary.md (48 / 6) | 骨組み | FR-046 | 不足 | データ辞書にデータ区分を持たせられるが、列が無い |
| optional/033-traceability-id-conventions.md (56 / 7) | 骨組み | FR-007 / FR-006 | 無 | ID 体系を手書きで定義する。v4 は ID の正本が record |
| optional/035-reliability-dr-bcp-design.md (56 / 8) | 骨組み | — | 不足 | **C11 (ランサム) / DR の受け皿**だが optional。RPO / RTO の検証欄、本番資格情報から分離したバックアップの欄が無い |
| optional/036-privacy-design.md (56 / 8) | 骨組み。ROPA / DPIA / データ主体の権利フロー | — | 不足 | **PII 製品の必須文書にすべき**だが optional。漏えい時の法定通知 (synthesis §2.1) の欄が無い |
| optional/038-ci-cd-pipeline-design.md (53 / 8) | 骨組み | FR-032 (CI green が merge 条件) | 不足 | secret scan / SAST / SCA を CI の必須 job にする (synthesis §3.1) 欄が無い |
| optional/044-deliverable-index-map.md (48 / 5) | 骨組み | FR-008 | 無 | 成果物インデックスも生成 view にできる |
| optional/045-directory-structure-design.md (48 / 8) | 骨組み | FR-070 (置き場所 registry) | 無 | v4 の `product/` `dev/` 構成と無関係 |
| optional/046-seo-public-page-design.md (69 / 10) | 骨組み | — | 無 | 特定製品向け。汎用ハーネスの optional としては用途が狭い |
| optional/047-support-escalation-design.md (68 / 9) | 骨組み | — | 不足 | インシデント runbook の受け皿の一部 |
| optional/048-user-documentation-design.md (48 / 8) | 骨組み | — | 無 | — |
| optional/049-ai-output-verification-design.md (59 / 10) | 骨組み | FR-013 / FR-051 (blind review) | 不足 | AI 依存印の製品 (LLM 注入テスト) の元になりうる |
| optional/050-stop-resume-execution-log-design.md (53 / 8) | 骨組み | FR-041 / FR-072 | 無 | — |
| optional/052-documentation-policy-tailoring.md (74 / 7) | 骨組み | FR-033 / FR-077 | 不足 | 「文書をどこまで書くか」の tailoring。**profile (B / S / H) による必須 / 省略の宣言の受け皿に最も近い**。ただし `vmodel-document-scale-profiles.md` と二重 (`README.md:79`) |
| optional/053-poc-verification-design.md (58 / 8) | 骨組み | FR-017 / FR-059 (PoC チケットの判定記録) | 無 | v4 では PoC は工程でなくチケット種別。S0〜S4 語彙が残っていれば FR-017 の lint に当たる [推定: 未精読] |
| optional/096-design-principles-seven-pillars.md (127 / 1) | **実用** (本文が入っている。placeholder 1) | FR-076 (8 基本原則) | 無 | v4 は 8 原則 (FR-076)。「7つの柱」と数が合わない。disposition は concept へ merge |
| optional/108-refactoring-design.md (79 / 3) | **実用寄り** | FR-052 / FR-053 | 無 | refactor チケット (FR-052) の受入 (振る舞い不変) と整合しているか要確認 |
| optional/109-qa-quality-checklist.md (75 / 1) | **実用** | FR-044 | 不足 | 品質チェックリストに security の観点が入るかは未確認 [推定] |

### 1.3 その他のテンプレート

| path | 層 | 中身の充実度 | 対応する v4 FR / AC | 検査の有無 (file:line) | 製品保護の受け皿 | 問題点 |
|---|---|---|---|---|---|---|
| vmodel/README.md (80) | — | 実用 (port index。slot ↔ ZIP 番号 ↔ disposition) | FR-069 | 有: `vmodel-template-writer.ts:18,142-:178` が index を解釈して slot 重複 / 欠落を `throw` する | 無 | 検査は index の形式だけ。index が正しくても本文が空でよい |
| vmodel/review-examples/RV-001〜005 (各 45 行) | — | 実用 (攻撃 / 防御の review 指示。FR-013 / FR-051 の blind review の雛形) | FR-051、FR-013 | 無 [推定: `grep review-examples src` で参照 0 件] | 無 | 5 本とも ID と抽出対象だけ違う同形。テンプレートにしては ID 固定の例 (RV-001_US-03 等) で、`docs/review.yaml` という旧記録先に追記する指示が残る (`RV-001:40`) |
| design/L6-function-spec-template.md (78) | L6 | **実用** (7 必須要素: 配置 / IF 契約 / 事前事後条件 / 失敗モード / データ形 / エッジケース表 / 検証接続。HOW-TO と例付き) | FR-067、FR-069 (L6 を 1 本に) | 有: `src/lint/l6-completion.ts` / `l6-fr-coverage.ts` [推定: 未精読]、`ddd-tdd-rules.ts:458` (oracle 欄の skeleton 語)。配布は `authoring-template-inventory.ts:24` | 不足。失敗モードの節はあるが、security 仕様の行 (入力検証 / upload / secret) が無い | `<name>` / `<機能名>` / `U-<ID>` の placeholder を検知しない。`sub_doc: <slug>` と `plan: docs/plans/PLAN-<id>.md` が残る |
| plan/design/template.md (119) | PLAN (設計系) | 実用 (§0〜§7)。冒頭に「本文 4 項目」採用規則の注記 | FR-007 (PLAN は v4 で全面廃止)、FR-004 (チケット) | 有: `plan lint` 全般、`plan-body-substance.ts` (本文 0 行)、`plan-dod.ts` など | 無 | v4 切り替えで廃止対象。4 項目の本文への機械強制は未実装 (CLAUDE.md の記述) |
| plan/impl/template.md (116) | PLAN (実装系) | 実用 | FR-007、FR-004 | 同上 | 無 | 同上 |
| state/vmodel.json (61) | — | **旧構造の残骸**。`_superseded` を自称 (`:5`)。層は L1〜L4 / L3.5 / L3.8 / L6、gate は G3.8 | FR-069 / AC-082(a) (廃止層番号の残存 0) | 配布必須 (`authoring-template-inventory.ts:30`)、JSON.parse のみ (`pack-authoring-smoke.ts:52`)。中身の検査なし | 無 | v4 の層番号 grep に確実に当たる。「TS vmodel 実装で再生成する」(`:5`, `:54`, `:58`) と書いたまま放置 |
| prompts/effort-classify.md (88) | — | 実用 (分類プロンプト) | FR-043 | 配布のみ | 無 | 文書系ではない。対象外 |
| github/common/add-feature.md (13) | チケット | 骨組み (4 見出し) | FR-004 (必須 3 field: やること / ゴールの検証 + 根拠コマンド / 親の参照)、FR-017 / FR-028 / FR-052 (チケット種別) | 無 | 無 | 必須 3 field に合っていない (「ゴールの検証」「親」が無い)。種別は add-feature / recovery の 2 つだけで、discovery / 画面プロト / refactor が無い |
| github/common/recovery.md (17) | チケット | 骨組み | FR-004、FR-037 (security 型 incident の追加案) | 無 | 不足。封じ込め・証拠保全・法定通知の時計が無い | `L14 route` 見出しの下が空 |
| github/common/PULL_REQUEST_TEMPLATE.md (17) | PR | 実用 (V-model 4 artifact のチェック) | FR-032 (merge 3 条件)、FR-031 | CI の `harness-check.yml` が一部を見る [推定: 未精読] | 不足。secret scan / SAST の green、profile 必須 AT の結果欄が無い | 空の `Closes #` を禁止する文言のみで、機械強制は別 |
| github/common/*.yml / *.cjs / .editorconfig / .gitattributes / CODEOWNERS / setup-branch-protection.sh | CI / 設定 | 設定ファイル | FR-070 / FR-032 | `github-ci-policy.ts`、`node-generation-ci-policy.ts` 等 | 不足。SCA / SBOM / secret scan の job 定義が無い [推定: `harness-check.yml` 68 行を未精読] | 文書系ではない |
| adapter/.claude/agents/*.md (20 本、各 15 行)、adapter/.claude/commands/*.md、adapter/AGENTS.md、adapter/CLAUDE.md、adapter/.claude/settings.json、adapter/.codex/* | 配布アダプタ | 骨組み (定義の複写) | FR-049 (手書き provider 定義は基本的に撤廃、role record から生成) | `rule-drift.ts` (マーカー節) | 無 | 文書系ではないが、FR-049 の撤廃対象。**棚卸し対象外として記録のみ** |

---

## 2. 欠けている文書種別 (v4 FR が要求するのにテンプレートが無い)

「テンプレート」と呼ぶが、v4 では大半が構造化 record (JSON / JSONL、FR-006) である。長文書のテンプレートではなく、**schema + 生成 view + 必須欄**として用意するのが前提になる。

| # | 文書 / record | 根拠 FR | 備考 |
|---|---|---|---|
| 1 | **製品保護 profile の宣言** (データ区分 D / 露出面 E / 可用性 A / flag) | FR-077 (新規案) | 置き場は L0 または L3。FR-073 の「非機能の水準」の正本 |
| 2 | **データ資産・PII の棚卸し** (項目ごとの区分・保持期限・削除方式・保存先) | FR-046 改訂案、FR-077 | schema record の列から生成する view。手書き表は作らない |
| 3 | **セキュリティ要件と悪用ケース (misuse case)** | FR-077 | L3 の AC と L10 (v4) の AT 宣言へ降りる |
| 4 | **露出面台帳** (公開 endpoint / port / 管理画面 / BI / 保守経路と認証方式) | FR-077 | IaC からの導出と照合 |
| 5 | **委託先・保守経路の設計** | FR-077 (C6) | vendor 印のときのみ |
| 6 | **運用証跡 record** (露出スキャン / 検知の発火試験 / 脆弱性照合 / 委託先アカウント棚卸し / secret ローテーション / 復元演習 / runbook 演習 / 保持執行) | FR-078 | 実施日時・実施者・対象・結果・有効期限の 5 欄が必須 |
| 7 | **残余リスク受容の decision record** (人間 ack) | FR-001 / FR-058 / FR-077 | optional/014 が近いが任意文書 |
| 8 | **scanner 抑止の記録** (理由・期限・承認者) | FR-077 | 抑止ファイルの型 |
| 9 | **SBOM / 依存の登録簿** | FR-074 | 製品の依存と harness の依存の両方 |
| 10 | **L8 as-built 仕様書 + 食い違い一覧** (3 択の振り分け) | FR-067 / AC-080 | v4 で新設される検証工程の主成果物。現テンプレートの L8 は結合テストで別物 |
| 11 | **画面プロトの 11 record** (初期画面ルール / screen inventory / screen flow / prototype plan / fixture 契約 / mock event 契約 / screen finding / 受入チェックリスト / 機械検証 receipt / modernization register / 依存 edge の確定) | FR-056 / FR-057 / AC-068〜070 | L2 / L4-ui-standard が部分的に近い |
| 12 | **AT 宣言** (検証する要件 / 依存範囲 / 実行の種類 / 環境前提 / 入力形式 / 必須条件) | FR-065 / AC-078 | 各テスト設計 (L7〜L12 v3 名) の各 case に付く欄。受入 catalog は生成物 |
| 13 | **チケット雛形** (種別: discovery / 画面プロト / refactor / 通常。必須 3 field) | FR-004 / FR-017 / FR-028 / FR-052 | `github/common/` の 2 本は合っていない |
| 14 | **backflow record** (下流 → 上流の還流) | FR-048 | |
| 15 | **stop-the-line incident record** (security 型を含む) | FR-037 | recovery.md が近いが欄が足りない |
| 16 | **工程 × 役割の RACI** | FR-002 | A がちょうど 1 つの表。019-workflow が近い |
| 17 | **hypothesis record** (前提・入力・予測・観測時期・棄却条件) | FR-056 (deep) / AC-070 | 予測系の製品のみ |
| 18 | **judgement record / retirement record** (LLM 判断・退役) | FR-041 / FR-019 / FR-025 | harness 内部向け。製品向けではない |
| 19 | **メンバー・権限 registry** | FR-075 | 高影響境界 |
| 20 | **test-design 用ディレクトリのテンプレート** (`docs/templates/test-design/`) | FR-069 | v4 は `design/` と `test-design/` に分ける。現状は `design/` に L6 の 1 本のみ |

L4 標準成果物の `report` / `notification` / `code-value` 型は、検査側 (`sub-doc-section-structure.ts:24-:29`) が必須節を宣言しているのに、**テンプレートが `batch` (optional/016) だけ**である [確認: optional 一覧に帳票 / 通知 / コード値のテンプレート無し]。

---

## 3. 検査の欠落

### 3.1 空欄残存 (最大の穴)

| # | 欠落 | 現状 | 影響 |
|---|---|---|---|
| A | `<記入>` / `<本文を記入>` / `<項目を記入>` / `PLAN-<id>` / `<slug>` の残存を止める検査が無い | `src` に 0 件。唯一の近い処理は `right-arm-static.ts:230` の「`<` で始まる ID 行は case に数えない」で、**止めるのでなく読み飛ばす** | 骨組みのまま `status: confirmed` にしても freeze が通る (L0〜L7、および G8〜G14 の case 表以外) |
| B | `plan-body-substance.ts:44-:60` は `<記入>` 行を実体行と数える | 本文 0 行しか止めない (AP-13 の bright-line を超えない) | 4 項目だけの本文でも、全部 `<記入>` で通る |
| C | `ddd-tdd-rules.ts:458` の skeleton 語検出 (`todo` / `tbd` / `placeholder` / `骨格` / `wip`) は単体 oracle 欄だけ | 設計文書の本文には掛からない | 同上 |
| D | HTML コメント `<!-- 最低 N 行を記入する -->` (テンプレート内に多数) は機械可読だが検査されない | 行数の下限が宣言されているのに誰も読まない | 「最低 5 行」を 1 行で通せる |
| E | サンプルデータの残存 (L2 の SC-001〜007 など) | 検知なし | 他製品の例が trace 先になる |

### 3.2 必須節

| # | 欠落 | 現状 |
|---|---|---|
| F | L0〜L7 (v3) の必須章・必須列を見る検査が無い | G8〜G14 だけが見出し・列名を固定している (`right-arm-static.ts:44-:192`)。L0〜L7 は `status` / pair / 孤児のみ |
| G | `required_artifacts` (G1〜G7) の中身確認が無い | `vmodel-contract.yaml` に宣言はあるが消費は `right-arm-static.ts:1313` (G8 以降) のみ。G4 の `security` は存在も中身も見ない |
| H | optional 27 本の必須節 | 検査 0 件。必須節の宣言そのものが無い |
| I | `status: draft` のまま gate が通る | `right-arm-static.ts` は `status` を `skipped` かどうかしか見ない (`:1453`)。L8〜L14 の slot が `draft` でも、case 行と manifest が揃えば PASS する |
| J | 見出し検査が「完全一致 1 本」で、順序・重複・代替名を許さない代わりに、本文の空を許す | 偽陰性 (空でも通る) と偽陽性 (章名の言い換えで落ちる) が同居 |

### 3.3 profile 連動 (FR-077 の前提)

| # | 欠落 | 現状 |
|---|---|---|
| K | profile を宣言・読み取る仕組みが無い | `src/profile/adapters/tracked-profile-loader.ts` は `doc_type_id` と catalog の scope (どの文書を必須 / optional / skip にするか) を扱うが、**製品保護の profile (D / E / A / flag) ではなく、文書規模の profile** [確認: `tracked-profile-loader.ts:31,39,89-:93,151`、`schema/harness-db-tables-spec-ir.ts:100-:135`] |
| L | 義務表 (profile → 要る設計成果物・必須 AT・release 条件) が無い | synthesis §3.3 は「義務表は 1 つの JSON」と提案。既存の `vmodel-document-scale-profiles.md` を拡張できるかは未検証 |
| M | 宣言と事実の照合が無い | D (schema record の列区分)、E (構成の公開面)、ai / vendor (依存登録簿) と照合して低すぎる宣言を止める仕組みが無い。そもそも schema record の列に区分が無い |
| N | `security` の AT 実行種別と、profile 条件式での必須化が無い | FR-065 の「必須になる条件」の値の集合が未定 |
| O | 運用証跡の期限切れを release deny にする仕組みが無い | `l14-close-audit.ts` はクローズ時の監査で、時間で切れる証跡 (FR-078) ではない [推定: 未精読] |

### 3.4 文書間の整合 (参考)

- L9 の「対象設計」列が ZIP 番号 (10,04,21,23,34,42,56,57,60,75,93 など) を指す。うち 21 / 23 / 34 / 42 / 56 / 57 / 60 / 75 / 93 はテンプレートが存在しない。参照の実在を検査するコードは無い [確認: L9 `:90-:105` の列、README の slot / optional 一覧に該当番号なし]。
- L13 と L14 の運用設計 1〜4 章の複写 (`L13:61,65` / `L14:61,65`)。

---

## 4. 改善の優先順位案 (最小実装原則。束ねて少ない手数に)

前提: v4 は `docs/templates/vmodel/` を廃止し (FR-069)、層番号も付け替える (FR-066)。**v3 の層名に結んだ検査・テンプレートの作り込みは使い捨てになる**。そこで下の 5 手は、層名に依存しない部品 (doc_type_id、必須節の宣言、profile、record schema) だけを作る。いずれも既存コードの流用で足りる。

| 手 | 内容 | 束ねるもの | 変更の場所 (想定) | 規模 | 破壊的変更 |
|---|---|---|---|---|---|
| **1 (最優先)** | **空欄残存の検査を 1 つ作る**。対象: `docs/design/**` と `docs/test-design/**` の `status: confirmed` の文書に `<記入>` / `<本文を記入>` / `<項目を記入>` / `PLAN-<id>` / `<slug>` / `<機能名>` が 1 件でも残れば fail-close。draft は warn のみ。HTML コメントの `最低 N 行` は、直前の表の行数と照合して下回れば warn (任意)。`DOC-L2-SCREEN` のサンプル行は同じ手でテンプレートから削る | 3.1 の A / B / D / E、3.2 の I | `src/lint/` に 1 module (`design-language.ts` と同じ走査方式)。テストは real-repo 回帰 (CLAUDE.md の claim 規律) + 合成 fixture。**doctor に組み込む手数も 1 箇所** | 小 | 無 (confirmed な既存文書に残存が無いことを先に実測する。残存があれば advisory から始める) |
| **2** | **必須節の宣言を 1 か所にまとめ、G8〜G14 と同じ検査を L0〜L7 にも使う**。`right-arm-static.ts:44-:192` の見出し・列の定数と、`sub-doc-section-structure.ts:24-:29` の `STANDARD_DELIVERABLE_SECTIONS` を、`vmodel-contract.yaml` (または catalog) の `required_sections` に寄せる。optional は宣言なし = 検査なしのままでよい | 3.2 の F / G / H / J | `docs/process/vmodel-contract.yaml` に節 / 列の宣言を足し、`contract-compiler.ts` が読む。検査は 1 本の汎用関数 | 中。ただし v3 の層名で宣言を書くと使い捨て。**v4 の層構成 (FR-066) が freeze してから**宣言を書く。それまでは手 1 だけでよい | 無 |
| **3** | **FR-077 の 3 点 PoC** (synthesis §5-3 と同じ): 義務表 JSON 1 つ + 抑止の期限検査 + 手 1 の `<記入>` 残存検査。**profile の置き場は L0 charter の frontmatter か 1 欄**とし、新しい文書種別を増やさない。義務表は既存の `vmodel-document-scale-profiles.md` (文書規模の profile) を拡張できるか先に確認する (新規 DSL を作らない) | 3.3 の K / L、2 の #1 | L0-charter に profile の欄 (D / E / A / flag の 4 項目)、義務表 1 JSON | 中 | **有 (高影響境界)**: PII・認可・secret・本番に触れる。CLAUDE.md の規則どおり、FR 追加の前に advisor (design) 相談 + PO 承認が要る |
| **4** | **L4-security / L13 / L14 / optional 035 / 036 の本文を製品保護の義務に合わせて直す** (テンプレートの本文変更のみ): L4-security に「データ区分の保持期限 / 削除方式の列」「露出面台帳」「脅威行 → 対策 ID の列」「secret ローテーション」「委託先 (vendor 印のとき)」を足し、SaaS / tenant / SOC2 / GDPR の固定文を profile 条件付きの注記へ変える。L13 / L14 は運用証跡の 5 欄 (実施日時 / 実施者 / 対象 / 結果 / 有効期限) を持つ表を足し、重複した 1〜4 章を片方へ寄せる。036 privacy は PII 印のとき必須とする旨を注記 | 1.1 の L4-security / L13 / L14 の問題点、2 の #2〜#8 | `docs/templates/vmodel/*.md` 6 本。ただし **FR-069 で `design/` / `test-design/` へ移す**ので、**移行 PR と同時にやるのが最小** (二度書かない) | 中 | 無 (テンプレートの欄追加)。ただし L9 の「対象設計」が ZIP 番号を指す問題は手 4 のついでに直す |
| **5** | **旧残骸の整理を FR-069 の移行 PR に同梱**: `state/vmodel.json` を削除 (または v4 の層で再生成) して `authoring-template-inventory.ts:30` と `pack-authoring-smoke.ts:52` と `tests/setup.test.ts:66` を更新、L6 の 2 本を 1 本に、review-examples の `docs/review.yaml` 参照を直す | 1.3 の残骸、FR-069 / AC-082 | 同上 | 小 | 有 (配布テンプレートの path 変更。FR-069 が canary を要求) |

優先順位の理由:

- 手 1 は v3 / v4 のどちらでも有効で、**製品保護の義務 (L4-security の `<記入>` 残存で freeze を deny) の前提条件**を単独で満たす。synthesis §5-3 の PoC 3 点のうち、PO 承認なしで進められる唯一の手である (既存文書の検査であり、profile も認可も触らない)。
- 手 2 と手 4 は FR-066 / FR-069 の層構成が決まるまで待つ。v3 名で作ると捨てることになる。
- 手 3 は高影響境界に当たるので、advisor + PO の経路を通す。それまでは手 1 だけで「書かれているか」を機械が見られる状態を作る。
- 作らないもの: 独自の文書テンプレートの追加 (2 の 20 種を長文書として用意しない。大半は schema + 生成 view)、optional 27 本の必須節宣言、重複した ZIP 複写の全面整理。

### 4.1 判断が要る点 (advisor 行き。PO へは上げない)

- 手 1 を v3 の既存文書 (`docs/design/harness/**`) に掛けると、既存の confirmed 文書に残存が出る可能性がある。**先に件数を実測する** (`grep -rln "<記入>" docs/design docs/test-design`)。0 件なら fail-close、あれば advisory から始めて段階化する。この実測は本棚卸しでは行っていない (harness の設計文書は ZIP の consumer 向けテンプレートと別物のため、件数が 0 とは限らない)。
- 手 3 の義務表の置き場 (L0 frontmatter か既存 `vmodel-document-scale-profiles.md` の拡張か) は方式選択。advisor (`--decision implementation`) の対象。

## 5. 未確認事項 (本棚卸しで読み切れていないもの)

- `src/lint/l6-completion.ts` / `l6-fr-coverage.ts` / `l14-close-audit.ts` / `frontend-design-coverage.ts` の検査範囲 (名前から推定したのみ)。
- optional 27 本のうち 012〜053 の各本文の詳細 (章立てと placeholder 数のみ確認。096 / 108 / 109 は冒頭を確認)。
- `harness-check.yml` / `pack-harness-check.yml` が secret scan / SAST / SBOM を持つか。
- `docs/design/harness/**` (ハーネス自身の設計文書) に `<記入>` が残っているか。
- v4 の acceptance 全文 (AC-078 / 082 / 087 などは synthesis の引用と grep 抜粋で確認。全 AC の本文は読んでいない)。
