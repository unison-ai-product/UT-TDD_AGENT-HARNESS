---
plan_id: PLAN-L1-01-business-requirements
title: "PLAN-L1-01: L1 要求定義 — UT-TDD harness 業務要求 (BR-*/NFR-*)"
kind: design
layer: L1
drive: be
status: draft
created: 2026-05-27
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: po
    slot_label: "PO — 業務要求の所有・スコープ確定 (L1 必須、§1.8)"
  - role: tl
    slot_label: "TL — 要求の技術的妥当性・trace 確認"
generates:
  - artifact_path: docs/design/harness/L1-business-requirements.md
    artifact_type: design_doc            # ① 業務要求 (BR-*/NFR-*)
  - artifact_path: docs/test-design/harness/L1-operational-test-design.md
    artifact_type: test_design           # ③ 運用テスト設計 (W-model L1↔L14。G1 までに)
dependencies:
  parent: null
  requires: []
  blocks:
    - PLAN-L3-01-functional-requirements   # L3 FR+AC は本 PLAN の BR-* から trace (後続)
related_docs:
  - docs/governance/ut-tdd-agent-harness-concept_v3.1.md      # L0 企画 (入力)
  - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
---

## §0 PLAN

L0 企画 (concept_v3.1) を入力に L1 要求定義へ進む。**本 PLAN は要求定義書そのものではない。企画書を要求定義書に変換するために「何を押さえるべきか」を特定し、PO へのヒアリング順序 (elicitation order) として構造化する計画**である。業務要求 (BR-*) / 非機能要求 (NFR-*) は本 PLAN の実行 = ヒアリングを経て `docs/design/harness/L1-business-requirements.md` に産出し、L3 要件定義 (FR+AC) へ渡す。harness を harness 自身の W-model で dogfood する最初の L1 工程。

## §1 目的

企画書を見て、要求定義書にするために**押さえるべき論点 (曖昧 / 未決定 / PO 判断を要する箇所) を特定し、ヒアリングの順序に落とす**。そのヒアリングを通じて harness が「何を達成すべきか」を業務要求として確定する。本 PLAN の中核成果は **ヒアリング項目とその順序**であり、BR/NFR はヒアリング回答から生まれる。加えて本 L1 は **この project の要求定義書「体系」自体を定義する** (U-体系-0): どの要求タイプ (業務 / 機能 / 技術 / UX=DX) を持つか・構造・trace 規約を、**「良いプロダクトにするために何を聞いておくべきか」という product-improvement の視点**で組む。**L1 では BR-*/NFR-* のみ。システム機能要件 (FR-*) は書かない** (FR は L3 で BR-* から trace、§3.1.2 / AP-6)。

## §2 背景

- L0 企画 = concept_v3.1 は G0.5 (軽量 feed-forward ゲート) を通過済。背景は §1.1 の 4 問題 (P1-P4)。
- 企画書は ROI/KGI/KPI を強制しない軽量文書。**企画書に書かれた L1/L3 相当の詳細 (書きすぎ) は本 PLAN で要求側へ吸収**する (二重記述を避ける)。
- requirements_v1.2 は L1-L3 を名乗るが中身は L3/システム要件寄り。本 PLAN が欠けていた **L1 業務要求層**を埋める。
- **plan 管理ルール (PLAN を phase-aware に管理する / 起票規約に従う) 自体が harness の業務要件**である。本 session で先行して L3 詳細 (§1.10 A の phase-aware ID 形式) を確定したが、その**源泉となる業務要件 (BR) を本 L1 で明示**し、§1.10 A / §1.1 へ下方 trace する (L1 BR → L3 詳細の順序を成立させる)。

## §3 計画 (L1 要求定義の進め方)

### Step 1: 論点抽出 (企画書 → 要求化に必要な押さえどころ)

- concept_v3.1 を読み、要求定義書にするために**押さえるべき論点**を洗い出す。種別の目安: スコープ境界 (IN/OUT) / 優先度 (どの問題解決が主目的か) / 成功の定義 / 制約・前提 / 未決定事項 / 企画書から降ろす「書きすぎ」分。

### Step 2: ヒアリング順序化 (本 PLAN の中核成果)

- 各論点を **PO へのヒアリング項目 (質問)** に変換し、依存・前提順に並べる。これが要求定義書を作るための elicitation order。
- **要求タイプ順 = 業務要求 → 機能要求 → 技術要求** (top-down)。機能要求は業務要求から導出、技術要求は両者の制約。harness の W-model (L1 業務 → L3 機能 → L4+ 技術) と一致。L1 では業務要求の不明確項目を先に潰す。

#### 抽出した不明確項目 (要求定義書をまとめるのに未確定。業務 → 機能 → 技術 順)

**要求定義書 体系 (U-体系-0、最優先 = 内容より先に「器」を定義):**

| ID | 不明確項目 | 備考 |
|----|-----------|------|
| U-体系-0 | **この project に必要な要求定義書の体系**: ① どの要求タイプ/doc を持つか (業務 / 機能 / 技術 / **UX=開発者体験 DX を含めるか**) ② 構造と置き場 ③ 業務⇄機能⇄技術⇄UX と W-model L1/L2/L3/L4/L10 の対応 ④ ID / trace 規約 (BR-*/NFR-*/FR-*/AC-*/UX-*) ⑤ **methodology spec (concept/requirements_v1.2 = 作り方) と project 要求 (作る対象 = harness の要求) の区別** ⑥ **設計視点 = 「良いプロダクトにするために聞いておくべき要求は何か」という product-improvement lens** で体系を組む | 内容を入れる前に器を確定。これ自体が L1 の成果物 |

**業務要求 (L1、本 PLAN で PO ヒアリングにより確定):**

| ID | 不明確項目 | 出所 |
|----|-----------|------|
| U-業-1 | スコープ: 対象は社内チーム開発のみ / 当面 PO 単独 dogfood / 外部配布も視野 | concept §1.1, §1.3 |
| U-業-2 | 対象 repo: 言語非依存と言うが全種類 (Web/CLI/データ/AI) か、特定領域から | CLAUDE.md (言語非依存) |
| U-業-3 | 優先度 / MVP: 4 問題 P1-P4 のどれを最優先・MVP に | concept §1.1 |
| U-業-4 | 成功の定義: 業務的に成功と言える状態 + 誰がいつ使えれば | concept §1.4 |
| U-業-5 | 利用者 / 役割: 当面 PO 単独か、PM/TL/QA 役割分離をどこまで業務要求に含めるか | concept §序文, §9 |
| U-業-6 | plan 管理 (BR-05、確認): PLAN 単位 + phase-aware 管理で確定か | 本 session 確定済 |

**機能要求 (L3 へ forward。L1 では確定せず記録のみ):**

| ID | 不明確項目 | routing |
|----|-----------|---------|
| U-機-1 | 工程強制範囲: L0-L14 全強制 vs 段階導入 | → L3 / PLAN-L3-01 |
| U-機-2 | 経路順: Forward / Reverse / Scrum のどれから機能実装 | → L3 |
| — | gate fail-close 条件は requirements §2 で既定義 | (済) |

**技術要求 (NFR/技術制約。L1 NFR で押さえる or L4 へ):**

| ID | 不明確項目 | routing |
|----|-----------|---------|
| U-技-1 | 対象 AI: Claude+Codex 固定 / 他 provider 対応 | L1 NFR |
| U-技-2 | 運用環境: Windows 主 / cross-platform 第一級 | L1 NFR |
| U-技-3 | 配布形態: npm package / repo template / 社内共有 | L1 NFR or L4 |
| U-技-4 | GitHub 前提 (Actions / CODEOWNERS / 失敗 corpus) で確定か | L1 NFR |
| U-技-5 | HELIX 概念のみ流用 (ADR-001) 確定 / ai-dev-team 2 構想書 前提維持 | L1 NFR |

**ユーザー体験・価値 (UX/価値。画面設計に限らず「このツールで何を大事にするか」を probe。product-improvement lens の核):**

| ID | 不明確項目 (value / product 視点) | routing |
|----|-----------|---------|
| U-UX-1 | **核となる価値**: 自動実装 (速さ) / 安全性 (壊さない・検証強制) / プロジェクトの進め方 (W-model 規律・再現性) — 何を最も大事にするか・優先順位。**業務要求の重み付けを規定する foundational 項目** | L1 (業務要求の方向を規定) |
| U-UX-2 | **チーム連携機能**: 工程表 / 進捗のダッシュボード化は要るか / team での状態共有の形 (GitHub 上 / 専用 UI / CLI のみ) | L1 → 機能 L3 |
| U-UX-3 | **価値提案**: 「このツールを使ってよかった」と感じる体験・採用が進む決め手は何か | L1 |
| U-UX-4 | DX 戦術 (副次): CLI 出力の分かりやすさ / gate 失敗時の next_action / オンボーディング | L1 NFR / L2 |

> UX ≠ 画面設計 (L2) だけ。価値・体験・連携機能を含む。U-UX-1 (核となる価値) は業務要求の優先度 (U-業-3) を規定するため、**ヒアリング順序では scope と並んで最上流**に置く。

### Step 3: ヒアリング実施

- PO へ順に質問し回答を得る。**回答が業務要求の源泉** (AI が概念書から勝手に確定しない)。

### Step 4: BR-*/NFR-* へ構造化 + trace

- 回答を業務要求 BR-* / 非機能要求 NFR-* に構造化。**FR は書かない**。各々を concept(L0) の論点へ双方向 trace (G1 で確認)。
- 想定 BR (ヒアリングで確定): 設計⇔実装⇔テスト整合の機械強制 / AI 実装の安全な委譲 / cross-platform チーム導入 / mode 非依存の状態把握・検証。
- **BR-05 (plan 管理ルール、必須)**: 開発作業を PLAN 単位で管理し phase-aware ID でフェーズ (L0-L14) にマッピング可能にする。起票は規約 (§1.1 / §1.10 A / テンプレ) に従い plan lint 可能。→ 下方 trace: §1.10 A / §1.1 / §1.6・§1.8。
- 想定 NFR: cross-platform native / fail-close gate / context 効率 / standalone・claude-only・codex-only・hybrid の mode 非依存 / 統制対象 repo は言語非依存 / 外部 provider SDK 非前提。

### Step 5: W-model ③ 運用テスト設計 (L1↔L14、軽量)

- ① 業務要求と対で、L14 運用検証で実施する **運用テスト設計** を軽く起こす (BR-*/NFR-* が運用で満たされるかの検証観点)。G1 凍結までに ① と対を成立させる。

### Step 6: レビュー (軽量)

- 専門サブエージェント review (整合性・抜け・FR 混入の有無)。完全性レビューは課さない。

### Step 7: DoD / G1 準備

- BR-*/NFR-* 完成、trace 成立、③ 対の存在を確認し、G1 (業務要求ゲート、po サインオフ) に備える。

## §4 受入条件 / DoD

- [ ] `docs/design/harness/L1-business-requirements.md` に BR-* / NFR-* が存在し、各々が concept(L0) へ双方向 trace
- [ ] **FR-* を含まない** (FR は L3 送り。AP-6 違反なし)
- [ ] W-model 対の `docs/test-design/harness/L1-operational-test-design.md` (③ 運用テスト設計) が存在し ① と相互 reference
- [ ] 専門サブエージェント review 実施 (軽量、cross-agent 不在は記録)
- [ ] frontmatter が §1 enum / §1.10 受入条件に適合 (plan_id = phase-aware、ID layer == frontmatter layer)
- [ ] §0〜§5 完備

## §5 関連 PLAN / docs

- 入力: `concept_v3.1` (L0 企画)
- 後続: `PLAN-L3-01-functional-requirements` (L3 FR+AC、本 PLAN の BR-* から trace)
- 参照: `requirements_v1.2` (§1.1 frontmatter / §1.10 受入条件 / §2.1.1 G0.5 / §3.1.2 L1-L3 二段分割)
