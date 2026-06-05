# UT-TDD Agent Harness — ゲート設計 + 自動追加型クロスチェックエンジン

> **位置づけ**: 本 doc は **ゲート (G_N) の正本設計** と、ゲートが回す **自動追加型クロスチェック機構**を定義する governance doc。
> **SSoT 参照**: 工程⇔ゲート対応 = [document-system-map](./document-system-map.md) §1 / V-pair = `src/schema` `V_MODEL_PAIRS` / ゲート機能要求 = FR-05 (決定論ゲート) / FR-13 (サインオフ) / FR-18 (doctor 横断検出) / FR-03 (trace) / FR-08 (fail routing)。
> **実装方針**: 本 doc が設計、`gate-checks.yaml` (L7) が宣言、`ut-tdd gate <G-ID>` / `ut-tdd doctor` が実行 (ADR-001 TS core)。

## §0 背景 (なぜ正本化するか)

G1〜G5 を運用してきたが、(a) **各 G_N が何を check するか**の正式 spec が無く audit が improvised、(b) **全体整合の機械検証**が L1/L3 中心の 5 lint に限られ L4/L5 以降が人手依存、という gap があった (PO 指摘 2026-05-29)。本 doc は両者を解消し、**ゲート判定を再現可能・スケール可能**にする。

## §1 ゲートモデル (G0.5〜G14)

各ゲートは layer の **exit 判定点**。fail 時は mode routing (FR-08) で対応 mode へ。

> **サインオフ列の凡例**: ★ = **FR-13 で定義済** (G1/G3/G7/G11=PO、G4-G6=TL)。それ以外は **FR-13 未定義の暫定提案** (各層着手時に確定、必要なら FR-13 拡張)。

| ゲート | 層 | 判定内容 (要約) | サインオフ | V-pair |
|---|---|---|---|---|
| G0.5 | L0 企画 | 構想の妥当性 (企画目的 ⇔ 価値検証 の trace) | PO (提案) | L0↔価値検証 (L14→L0 feedback) |
| **G1** | L1 要求定義 | 5 sub-doc + 件数閉じ + G1-trace | ★ **PO** | L1↔L14 |
| **G2** | L2 画面 | モック凍結 + 画面 trace | — (FR-13 未定義、§2.1 defer 中) | L2↔L10 |
| **G3** | L3 要件定義 | FR/AC/AT + G3-trace | ★ **PO** | L3↔L12 |
| **G4** | L4 基本設計 | 4 sub-doc + 上流 trace + 集約整合 | ★ TL | L4↔L9 |
| **G5** | L5 詳細設計 | DbC freeze (pre/post/invariant + edge docstring) | ★ TL | L5↔L8 |
| **G6** | L6 機能設計 | 関数仕様/pseudocode + edge↔AT | ★ TL | L6↔L7 |
| G7 | L7 実装 | TDD trace + 4 artifact 双方向 12 edge freeze | ★ **PO** | (trace freeze) |
| G8/G9 | L8/L9 結合/総合 | IT/ST 実施 pass | TL (提案) | — |
| G10 | L10 UX 磨き | a11y / visual regression | uiux/PO (提案) | — |
| G11 | L11 総合レビュー+UAT | 受入 | ★ **PO** | — |
| G12/G13/G14 | L12/L13/L14 デプロイ/後検証/運用 | リリース判定 / SLO / 改善 | PO (提案) | — |

> ★ = FR-13 由来 (G1/G3/G7/G11=PO、G4-G6=TL)。「提案」は FR-13 未定義で本 doc の暫定。fail → mode routing (Recovery/Reverse/Refactor/Incident、FR-08)。

> **正規式 V-model (PLAN-RECOVERY-02、2026-06-04 PO 確定、非破壊)**: L0 企画にも検証ペア **価値検証** を与える (従来 V-pair `—` だった穴埋め)。G0.5 は「企画目的が L14→L0 feedback で価値として実現するか」の trace を確認する。各ゲートの V-pair は対応する**検証本質**を凍結/検証する (右腕工程順 L8→L14): L6 単体 / L5 結合(L8) / L4 総合(L9) / **L2 実データ検証(L10) → L3 本番受入(L12)** / L1 運用(L14) / L0 価値 (右腕 = データ実在性エスカレーション、concept §2.3 正規式表)。

## §1.1 ① 必須スケルトン + ② 駆動モデル (メタモデル、Forward 以外)

> 上表の G0.5-G14 は **① 必須スケルトン (Forward spine、V-model)**。これだけでは不完全で、各工程は **② ケースバイケース駆動モデル**を合成する (concept §2.5 9-mode / metamodel / PLAN-DISCOVERY-01 PoC)。**本来 Reverse / Discovery 等に流す**経路を本節で明示する。

**メタモデル**: V字各層 = **① 作成必須タスク/doc (固定スケルトン)** + **② 駆動モデル**。**PLAN が ①＋該当② を合成**して構築。② 介入時にその進捗点で **駆動プラン spawn → exit 3 分岐 → fullback で V字回帰**。

### 入口 9-mode → 出口 Forward 合流

入口は状況で分岐するが、**出口は必ず Forward L0-L14 (V-model) に合流**する (concept §2.5)。

| ② 駆動モデル | 入口 (発動条件) | 固有フェーズ/ゲート | 合流 (fullback) |
|---|---|---|---|
| **Discovery** | 要件・実現性が未確定 | **S0-S4** (仮説→PoC→verify→decide)、S4 = decide gate | confirmed → Forward L1/L3/L4-L6 |
| **Reverse** | 既存資産を逆引き | **R0-R4** (evidence→…→routing)、R4 = routing gate | R4 forward_routing → L1/L3/L4/L5/gap-only |
| **Scrum** | 作る物は明確/要件すり合わせ | S0-S4 反復 | Reverse fullback で文書化 → Forward |
| **Incident** | 本番障害 | hotfix 即応 | 暫定収束後 Reverse fullback で V 昇華 + postmortem→L14 |
| **Recovery** | AI 暴走/独断 | ガード→収束 | 再開ポイントから Forward 復帰 |
| **Refactor** | 振る舞い不変で構造改善 | axis-11 regression | L7 内部改善に閉じる |
| **Retrofit** | 段階改修・移行 | retrofit-matrix | L4-L9 に追補 |
| **Add-feature** | 既存に新機能 | add-design/add-impl | L4-L7 追補 → Forward 統合 |
| **Research** | 実装前調査 | ADR 生成 | L1/L4 の判断材料へ |

### exit 3 分岐 (駆動プランの出口) + fullback

- **exit** = `decision_outcome` (confirmed / rejected / pivot) × `promotion_strategy` (reuse-as-is / reuse-with-hardening / redesign / discard) — schema 実装済。
- **confirmed → fullback** (V字回帰): `kind=reverse` + `forward_routing` で Forward 本線の復帰先 (L1/L3/L4/L5/gap-only) を指定。
- **promote 経路は実装ゲート (G7) 通過必須** (逆ピラミッド防止、PoC の独り歩き阻止)。

### 駆動モデルゲートと Forward ゲートの関係

- 駆動モデルは **固有ゲート** (Discovery=S4 decide / Reverse=R4 routing) を持ち、Forward の G_N とは**別系統**。
- **fail routing (FR-08)**: Forward ゲート fail → detector が対応駆動へ routing (`drift`→Reverse / `暴走`→Recovery / `障害`→Incident / `劣化`→Refactor、優先度 Incident>Recovery>Reverse>Refactor)。
- 合流時に駆動成果が Forward の該当層ゲート (G_N) を改めて通る (例: Reverse R4→L4 復帰なら G4 を通す)。

> 本節の駆動モデル詳細は concept §2.5/§4 + 各 `helix-process/*-workflow.md` (参照 snapshot) を根拠とし、UT-TDD では `ut-tdd` CLI の mode routing として実装 (FR-08、L7)。**§4 自動追加型クロスチェックエンジンは Forward/駆動 双方の成果物に適用**される (frontmatter の kind/workflow_phase 駆動でルール enroll)。

## §2 ゲート台帳 (現況、2026-06-04 更新 — RECOVERY-02 後の再確定)

> **再確定注記 (A-100、2026-06-04、PO サインオフ)**: PLAN-RECOVERY-02 (V-model 正規式モデル、非破壊) が L0-L3 へ fullback したため、05-29〜06-01 の旧台帳 (G1=A-41 / G3=A-60 PASS、G4=A-67/A-91・G5=A-70 COND PASS) は **正規式モデル確定前のスコープ**となった。ロードマップ Phase 1 (L0-L3) の改善/検証サイクルを **4 巡完走** (残 PO 判断要 0) し、PO が **L0-L3 freeze (G0.5/G1/G3) を再確定サインオフ** (A-100)。これに伴い L0-L3 設計 doc + L1/L3 PLAN を `status: confirmed` 化。**L4-L6 (G4/G5) は正規式モデルで仕切り直しとなったため COND PASS を park し「要再評価」へ rollback** (旧 A-67/A-91/A-70 は historical 記録として保持、Phase 2 で再 audit)。

| ゲート | 状態 | 根拠 | 備考 |
|---|---|---|---|
| G0.5 | 既済 (再確定) | concept_v3.1 (L0) / A-100 | RECOVERY-02 後も L0⇔価値検証ペア方向に破綻なし (正規式モデル非破壊) |
| G1 | ✅ PASS (再確定) | A-41 (初回) + **A-100 (改善4巡後 再freeze、2026-06-04)** | PO サインオフ済。A-41 は正規式前スコープ、A-100 で Phase 1 改善サイクル完了後に再確定 |
| **G2** | ⏸ **DEFER (未通過、parked)** | A-63 内で PO 承認 (G2 defer 専用の独立 ledger entry はなし) | **screen track を park、core track が先行進行** (下記 §2.1) |
| G3 | ✅ PASS (再確定) | A-60 (初回) + **A-100 (再freeze)** | PO サインオフ済。Phase 1 (L0-L3) exit 条件 = L3 要件定義 confirmed を満たす |
| G4 | ✅ **PASS (Phase 2 再確定)** | (旧) A-67/A-91 = historical + **A-101 (正規式 G4 audit、2026-06-05)** + **A-102 (workflow オーケストレーション add-design freeze、2026-06-05)** | L4 core 4 doc (architecture/data/function/external-if) ⇔ L9 総合テスト設計を正規式 V-model (L4⇔L9 総合) で再 audit、**4 軸 PASS** (intra_runtime_subagent = pmo-sonnet で TL サインオフ代替)。**A-102 で function §3 の under-design (workflow mode 群 + FR-12 skill) を add-design PLAN-L4-05 で外部設計化 + L9 ST-FUNC ペア deepening + IMP-069/070 解消** (code-reviewer 4 軸 PASS)。L9 骨格 (Given-When-Then は Phase 2 後続) + ST-ASSET (L6/L7 待ち placeholder_deps) は carry 許容。**内部資産 L4-10〜13 は別スコープ** (ST-ASSET、未 freeze)。旧 A-91 (内部資産含む COND PASS、正規式前) は historical |
| G5 | ⏸ **要再評価 (park)** | (旧) A-70 = historical | **A-100 で park**。Phase 2 で DbC freeze を再評価 |
| G6〜 | 未到達 | — | — |

### §2.1 G2 DEFER と V-model 順序の整合 (明示)

harness core は **CLI/library (UI なし)**。screen track (PM/HM/GD 14 画面、L2) は L1 で要求確定済だが L2 モック検証前のため **G2 を defer (park)** し、**非 screen の forward spine (L3→L5) が先行**した。これは FR-13 (Forward ワークフロー順序制約) の AC-FR-13-02 「前工程未通過で後着手不可」の一般化に対する **product-choice 例外** (PO 承認)。

> **A-100 注記 (2026-06-04)**: 上記「L3→L5 先行」は正規式モデル確定前の経緯。RECOVERY-02 後、L4/L5 (G4/G5) は §2 のとおり park (要再評価) とし、**確定 (frozen) 済は L0-L3 (core track) まで**。L4-L6 は Phase 2 で Forward 実開発する。
>
> **A-100 追補 (2026-06-04, pair-freeze 対称性)**: G1/G3 は段階 A Pair freeze (concept §2.3 = 設計①+テスト設計③ の文書ペアを揃える) のため、初回 freeze で設計①側のみ confirmed 化しテスト設計③ (`L1-operational-test-design.md` / `L3-acceptance-test-design.md`) を draft 残置していた非対称を是正。両ファイルを `status: confirmed` へ flip し、L1/L3 の ①⇔③ ペアを両側 frozen で揃えた (frontmatter status 行のみ、本文不変)。L0 は価値検証 = 独立③ doc を持たず L14 実施 / L2 は wireframe self-pair のため③ flip 対象外。
>
> **A-101 注記 (2026-06-05, G4 L4 freeze)**: Phase 2 で L4 core を正規式 V-model (L4⇔L9 総合) の G4 audit に通し **4 軸 PASS** (intra_runtime_subagent = pmo-sonnet で TL サインオフ代替)。L4 4 doc + L9 + PLAN-L4-00〜04 を `draft → confirmed` (10 ファイル flip)。**L9 骨格 (Given-When-Then は Phase 2 後続) + ST-ASSET (L6/L7 待ち placeholder_deps) は carry 許容**。**内部資産 L4-10〜13 は未 freeze (別スコープ)**。記録 = `.ut-tdd/audit/A-101-g4-l4-freeze.md`。G5 (L5 詳細設計) は park 維持、L5 降下後に再 audit。
>
> **A-102 注記 (2026-06-05, G4 add-design freeze: workflow オーケストレーション)**: A-101 後の粒度監査 (要件→基本設計、pmo-project-explorer/pmo-sonnet 2 軸) で確定した **L4 under-design 2 件** (workflow mode 群 + FR-12 skill が function §3 で「将来 module 一括 defer」= 外部設計判断なし) を **add-design PLAN-L4-05** で解消。function §3 を **Forward spine + 9 駆動モデル + 2 工程専門の外部設計** (入口 signal / 状態遷移 / 出口 contract+合流 / 担当 block / gate / signal→mode routing 全順序 / mode↔kind 非1:1 / skill 外部形状) へ deepening、L9 ST-FUNC を同時にペア deepening (ST-FUNC-01/01b/04/05/06/07、孤児0)。**IMP-069 (mode taxonomy) reconcile** = Forward=spine + 9 駆動モデル (Research 含む) を operational 正本に確定し concept §2.5 legacy framing と橋渡し (modes/README §3)。**IMP-070** = commander を **ADR-006** で確定。**4 軸 PASS** (intra_runtime_subagent = code-reviewer、I-1/I-2 指摘修正後)。altitude = 外部設計、L5/L6/requirements への defer は §3.6 に明示 carry (under-design でない)。記録 = `.ut-tdd/audit/A-102-g4-workflow-orchestration.md`。function.md/L9 は confirmed 維持 (deepening を A-102 が bless)、PLAN-L4-05 を `draft → confirmed`。

**規約**: forward spine の各ゲート (G3/G4/G5...) は **screen track を除いたスコープ**で判定する。screen track は L2 モック後に G2 → L4-screen → L10 を**別レーン**で進め、合流時に G1-trace 再検証する (A-40 back-propagation)。台帳は 2 レーン (core / screen) を分けて管理する。

## §3 ゲート判定の標準 4 軸 (improvised audit の正本化)

G3/G4/G5 で運用した audit を正式 spec 化。各ゲートは以下 4 軸 + 未決管理を満たして PASS。

| 軸 | 判定 | 機械化 (§4 engine) | 意味レビュー (intra_runtime_subagent / cross-agent / 人手) |
|---|---|---|---|
| **A1 DoD 充足** | 当該層 child PLAN §4 + Master §5 を全件満たす | 構造 (§必須/frontmatter) | 完成度の意味判断 |
| **A2 上流 trace** | 上流要素 (要求/集約/module/FR) が当層に漏れなく着地、孤児 0 | `upstream-coverage` rule | 詳細化の妥当性 |
| **A3 V-pair** | pair_artifact が実在し相互参照 (L_N↔L_M) | `pair-exists` / `trace-bidir` | テスト設計の網羅性 |
| **A4 sub-doc 間整合** | 当層 sub-doc 間に矛盾・二重定義・循環なし | `ref-resolves` / 依存 drift (ADR-002) | 意味的一貫性 |
| **未決管理** | blocker と PO escalation/carry を分離記録 | (backlog/ledger) | エスカレーション判断 |

> 判定区分: **Critical(blocker)=0 → CONDITIONAL PASS で次工程着手可** (Important/Minor は carry)、Critical>0 → FAIL。G3/G4/G5 の前例と一致。

## §4 自動追加型クロスチェックエンジン (機構)

**目的**: 整合チェックを「関係ごとの手書き lint」から **宣言メタデータ駆動のルールエンジン**へ。doc が増えても lint を書き足さない (自動 enroll)。FR-18 (doctor 横断検出一括集約) の実現機構。

```
[1] doc レジストリ      docs/** の frontmatter 走査 → {path, layer, sub_doc,
                        pair_artifact, related_*, generates, dependencies, 宣言件数}
        │               (frontmatter schema は src/schema/frontmatter.ts 既存)
[2] ルールレジストリ    関係の「型」ごとに 1 回実装した layer 非依存ルール (§5)
        │
[3] 自動 enroll        新 doc がレジストリに現れたら frontmatter 形状にマッチする
        │               全ルールが自動適用 ← ★自動追加型の核心 (手書き不要)
[4] ゲート束ね         gate-checks.yaml が「G_N で回すルール id 集合」を宣言 (§3 A1-A4 に対応)
[5] カバレッジマップ    どの doc/関係が検査済かを自動レポート + 未検査 gap 可視化 (IMP-006)
```

**フロー (FR-05/18)**: `ut-tdd doctor` / `ut-tdd gate <G-ID>` → [1] レジストリ構築 → [2] 該当ルール解決 → [3] 全 doc に適用 → 結果集約 (severity 別) → fail-close。
> **FR-05 決定論の実現箇所**: 各ルール型は**純粋関数** (ファイル走査・frontmatter 比較・ID 照合・グラフ構築のみ、LLM/外部 API 呼び出しなし)。既存 5 lint の `analyzeX(docs?)` pure 様式 (architecture §3.2) を継承し、判定に AI を一切呼ばない → FR-05「決定論 static ゲート (AI 不要)」の制約を満たす。

## §5 ルール型一覧 (第1弾 + 既存 5 lint の吸収)

| ルール型 (id) | 検査内容 | 駆動メタデータ | 吸収する既存 lint |
|---|---|---|---|
| `pair-exists` | `pair_artifact` が実在 | frontmatter pair_artifact + V_MODEL_PAIRS | (G4/G5 audit 手動 → 自動化) |
| `ref-resolves` | `related_*`/`parent`/`requires` の path 実在 | frontmatter dependencies | (新規、IMP-003 = path fs 実在検証の backlog ID) |
| `trace-bidir` | `generates` ↔ pair の相互参照 (双方向 edge) | generates + pair | g3-trace (一般化) / vmodel lint |
| `upstream-coverage` | 下流参照 ⊆ 上流レジストリ (孤児 0) | layer 順 + ID 抽出 | **g3-trace** / **entity-coverage** |
| `count-matches` | header 件数宣言 vs 実数 | 宣言件数 + table 行数 | **fr-registry-audit** / **doc-consistency** (一般化、IMP-001) |
| `id-format` | ID が layer 別 regex 適合 | layer + ID pattern | (plan-id-schema IMP-004) |
| `dup-id` | 同一 ID 二重定義検出 | ID レジストリ | IMP-002 |
| `glossary-delta` | 用語が L0 §10 へ back-merge | sub-doc §用語更新 | G.9 (IMP-012) |
| `dependency-drift` | 実 import グラフ vs 期待依存マップ | src/ import + architecture §3 | **ADR-002 / IMP-032** |
| `asset-drift` | 内部資産 .md の HELIX 前提残存 + roster↔guard 整合 | `.claude/agents/*.md` + `docs/skills/` + roster allowlist | **FR-L1-49 / inventory §1 / ADR-004 (A-85)** |
| `backlog-format` | backlog 書式 | backlog table | **improvement-backlog** |

> 既存 5 lint (g3-trace/entity-coverage/fr-registry/doc-consistency/improvement-backlog) は L7 で本エンジンの**ルール型インスタンスへリファクタ吸収**。新 doc/層は手書き不要で `upstream-coverage`/`pair-exists`/`count-matches` 等が自動適用される。

## §6 構造 / 意味の境界 (engine vs review)

| 種別 | 担当 | 例 |
|---|---|---|
| **構造的整合** | **engine (自動、毎コミット)** | pair 実在 / 参照解決 / 件数 / ID 形式 / trace 孤児 / 依存循環 / 用語 back-merge |
| **意味的整合** | **intra_runtime_subagent review / cross-agent review / human gate audit** | 集約の意味が schema と一致するか / 設計判断の妥当性 / 詳細化の十分性 |

> engine が構造を毎コミット機械保証することで、専門サブエージェント / cross-agent / 人手の review は**意味判断に集中**できる (現状 review が見ている構造系を engine へ移管)。単一 runtime の判断ゲートでは requirements §7.8.7.1 に従い `review_kind: intra_runtime_subagent` と checklist 証跡を記録し、naive self-review を gate 根拠にしない。

## §7 機能要求更新 / carry

- **新規 FR-L1 は起こさない**。本機構は **FR-L1-18 (doctor 横断検出一括集約) + FR-05 (決定論ゲート) + FR-03 (trace)** の**実現機構の明文化**であり、ユーザー視点の新機能ではない (L1 は G1-passed のため安易な back-prop を避ける、§7.1)。
- **IMP-033** (cross-check rule engine) として L7 実装を起票。
- **L6 carry**: ルール型のアルゴリズム (レジストリ構築 / ルール解決 / 適用 / 差分レポート) を機能設計で pseudocode 化 (IEEE 1016 §5.7)。
- **L7 carry**: engine 実装 + 既存 5 lint のリファクタ吸収 + `gate-checks.yaml` + `ut-tdd gate`/`doctor` 配線。ADR-002 (dependency-drift) / IMP-001/002/003/006 / **FR-L1-49 (asset-drift、A-85)** を本エンジンのルール型として統合。

### §7.1 新規 FR を起こさない判断 (記録)

cross-check engine を新 FR-L1 にすると L1 (G1-passed) への back-prop + G1-trace 再検証が発生する。本機構は既存 FR-L1-18/05/03 の**実装アーキ**であり、FR-L1-45 (doc-reviewer、新規ユーザー機能) とは性質が異なる。よって新 FR を起こさず既存 FR の機構として設計する。**PO が「独立 FR として追跡したい」と判断する場合は次の空き ID で back-prop 起票** (要 G1-trace 再検証)。

> **採番注記 (A-85 是正)**: 本記述は当初 "FR-L1-46 として起票" と書いていたが、**FR-L1-46 は A-77 で内部資産 subagent roster に採番済** (FR-L1-46〜49 = 内部資産、Recovery PLAN-RECOVERY-01)。cross-check engine を独立 FR 化する場合は FR-L1-49 まで採番済のため **その次番号以降の空き ID** を用いる (ID 衝突回避。bare な未登録 ID トークンは upstream-coverage/g3-trace の孤児検出に掛かるため本文に直書きしない)。
