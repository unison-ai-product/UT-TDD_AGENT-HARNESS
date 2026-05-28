---
plan_id: PLAN-L1-01-business-requirements
title: "PLAN-L1-01: L1 要求定義 — UT-TDD harness 業務要求 (BR-*/NFR-*) の中間準備"
kind: design
layer: L1
drive: be
status: draft
created: 2026-05-27
updated: 2026-05-28
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: po
    slot_label: "PO — 業務要求の所有・スコープ確定 (L1 必須、§1.8)"
  - role: tl
    slot_label: "TL — 要求の技術的妥当性・trace 確認"
generates:
  - artifact_path: docs/design/harness/L1-business-requirements.md
    artifact_type: design_doc            # ① 業務要求 (BR-*/NFR-*/UX-*) = 正本
  - artifact_path: docs/test-design/harness/L1-operational-test-design.md
    artifact_type: test_design           # ③ 運用テスト設計 (W-model L1↔L14) = 正本
dependencies:
  parent: null
  requires: []
  blocks:
    - PLAN-L3-01-functional-requirements   # L3 FR+AC は本 PLAN の BR-* から trace (後続)
related_docs:
  - docs/governance/ut-tdd-agent-harness-concept_v3.1.md      # L0 企画 (入力)
  - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
  - docs/migration/v2-import-ledger.md                        # v2 取り込みの採択軌跡
---

## §0 PLAN の役割 (= 正本前の中間準備ドシエ)

本 PLAN は **要求定義書 (正本) そのものではない**。企画書 (concept_v3.1) を要求定義書に変換するための**中間準備**であり、「何を押さえ・何を PO に聞き・回答をどこへ着地させるか」を 1 本に整理した**ヒアリング項目レジストリ**である。

- **入力**: L0 企画 `concept_v3.1` + v2 取り込み `v2-import-ledger.md`
- **本 PLAN の成果物**: ヒアリング項目とその着地計画 (§3 レジストリ)。BR/NFR/UX は**ヒアリング回答から**生まれる (AI が企画書から勝手に確定しない)。
- **正本 (本 PLAN の実行で産出)**: ① `docs/design/harness/L1-business-requirements.md` (業務要求) / ③ `docs/test-design/harness/L1-operational-test-design.md` (運用テスト設計、L1↔L14 pair)。
- **後続**: L3 要件定義 (FR+AC は本 PLAN の BR-* から trace)。
- harness を harness 自身の W-model で dogfood する最初の L1 工程。

## §1 目的

企画書を要求定義書にするために**押さえるべき論点 (曖昧 / 未決定 / PO 判断を要する箇所) を特定し、ヒアリング項目に落として着地先を決める**。本 L1 はあわせて **この project の要求定義書「体系」自体を定義する** (U-体系-0): どの要求タイプ (業務 / 機能 / 技術 / UX=DX) を持つか・構造・trace 規約を、**「良いプロダクトにするために何を聞いておくべきか」という product-improvement の視点**で組む。**L1 では BR-*/NFR-*/UX-* のみ。システム機能要件 (FR-*) は書かない** (FR は L3 で BR-* から trace、AP-6)。

## §2 背景

- L0 企画 = concept_v3.1 は G0.5 (軽量 feed-forward ゲート) 通過済。背景は §1.1 の 4 問題 (P1-P4)。
- 企画書は ROI/KGI/KPI を強制しない軽量文書。企画書に書かれた L1/L3 相当の詳細 (書きすぎ) は本 PLAN で要求側へ吸収する (二重記述を避ける)。
- requirements_v1.2 は L1-L3 を名乗るが中身は L3/システム要件寄り。本 PLAN が欠けていた **L1 業務要求層**を埋める。
- plan 管理ルール (PLAN を phase-aware に管理 / 起票規約に従う) 自体が harness の業務要件 (BR-05)。
- 2026-05-28: L1 draft 後に**被覆監査** (concept × elicitation × v2 取り込み) を実施し、ヒアリング項目に挙げ漏れた concept 能力を検出 → §3 レジストリに U-補-* / 機能能力 forward として追補した (本 PLAN を「あるべき準備の形」に整える作業)。
- 2026-05-28 (PO 指示、end-state 明示): L1 BR / PLAN 要件は最終的に **機能設計ドキュメント** になり、harness の **L0-L14 workflow stages と PLAN system 自体も「機能」**として L3+ で詳細設計する対象 (再帰的 dogfooding)。最終形の CI は **機能カタログ + doc/test/code の 3 点セット整合 check → GitHub Actions auto-merge 判定**。この trajectory に L1 BR を整合させる (BR-01 4 artifact trace + BR-02 team PR gate + NFR-05 GitHub 正本 の上位統合 = U-補-6 として §3.4 に起票)。

## §3 ヒアリング項目レジストリ (本 PLAN の中核)

正本 (要求定義書) を作るための全ヒアリング項目を 1 表に統合する。**ヒアリング順序 = 体系 → 価値/スコープ → 業務 → 技術(NFR) → UX → 機能(L3送り)** の top-down (機能は業務から導出、技術は両者の制約)。各項目は**着地先**と **status** を持つ。

**status 凡例**: ✅ = 正本 (①/③) に着地済 / ➡️ = §5 で L3・L4 へ forward / ❓ = 要 PO 判断 (ヒアリング待ち) / 🆕 = v2 import、draft で着地・G1 待ち。

### 3.1 体系 (最優先 = 内容より先に「器」を定義)

| ID | ヒアリング項目 | メモ / 出所 | 着地先 | status |
|----|--------------|------------|--------|--------|
| U-体系-0 | 要求定義の体系: ①要求タイプ (業務/機能/技術/UX) ②構造・置き場 ③W-model L1/L3/L4/L10 対応 ④ID・trace 規約 ⑤**methodology spec (作り方) と project 要求 (作る対象) の区別** ⑥product-improvement lens | 内容より先に器。これ自体が L1 成果物 | ① 内に**自己宣言節**として追加 | ❓ (GAP G-01、未着地) |

### 3.2 価値・スコープ・業務要求 (L1 で PO ヒアリングにより確定)

| ID | ヒアリング項目 | メモ / 出所 | 着地先 | status |
|----|--------------|------------|--------|--------|
| U-UX-1 | 核となる価値: 速さ / 安全 / 進め方 (W-model 規律) の優先順位。業務要求の重み付けを規定する foundational 項目 | concept §1.4。scope と並び最上流 | §0 価値 / UX-01 | ✅ |
| U-業-1 | スコープ: 社内チーム開発のみ / 当面 PO 単独 dogfood / 外部配布 | concept §1.1, §1.3 | BR-02 / §4成功② / NFR-02 | ✅ |
| U-業-2 | 対象 repo: 言語非依存と言うが全種類 (Web/CLI/データ/AI) か | CLAUDE.md | NFR-04 | ✅ |
| U-業-3 | 優先度 / MVP: P1-P4 のどれを最優先・MVP に | concept §1.1 | §0価値 / NFR-07 (MVP なし) | ✅ |
| U-業-4 | 成功の定義: 業務的に成功な状態 + 誰がいつ使えれば | concept §1.4 | §4 成功条件 5 項目 | ✅ |
| U-業-5 | 利用者 / 役割: PO 単独か役割分離をどこまで業務要求に含めるか | concept §序, §9 | BR-02 (役割詳細→L3/L5) | ✅ |
| U-業-6 | plan 管理: PLAN 単位 + phase-aware で確定か | 本 session 確定 | BR-05 | ✅ |
| U-UX-3 | 価値提案: 採用が進む決め手・「使ってよかった」体験 | concept §1.4 | §0価値 / UX-01 / §4 | ✅ |

### 3.3 技術要求 (NFR / 制約)

| ID | ヒアリング項目 | メモ / 出所 | 着地先 | status |
|----|--------------|------------|--------|--------|
| U-技-1 | 対象 AI: Claude+Codex 固定 / 他 provider | concept | NFR-03 (hybrid 主軸) | ✅ |
| U-技-2 | 運用環境: Windows 主 / cross-platform 第一級 | 環境ヒアリング | NFR-01 | ✅ |
| U-技-3 | 配布形態: npm / repo template / 社内共有 | 配布ヒアリング | NFR-02 / §5→L4 | ✅➡️ |
| U-技-4 | GitHub 前提 (Actions/CODEOWNERS/失敗 corpus) | concept §1.4 | NFR-05 | ✅ |
| U-技-5 | ADR-001 (HELIX 概念のみ流用 / TS 全面再実装) を NFR として明示するか | NFR-03/04 は間接のみ。L1 で制約独立させないと L3 実装方針が揺れる | NFR 候補 (U-補-5 と統合) | ❓ (GAP、要確認) |
| U-UX-4 | DX 戦術: CLI 出力 / gate 失敗時 next_action / オンボーディング | DX ヒアリング | UX-03 | ✅ |
| U-UX-2 | チーム連携: 工程表/進捗のダッシュボード化、状態共有の形 | UX ヒアリング | BR-06 / UX-02 / §5→L3 | ✅➡️ |

### 3.4 PO 判断待ち (被覆監査 由来、業務要求 BR / NFR にするか L3 forward か)

| ID | ヒアリング項目 | メモ / 出所 | 着地先候補 | status |
|----|--------------|------------|-----------|--------|
| U-補-1 | **エスカレーション機構** (L0-L3 自動切替 / human stop) を業務要求にするか | concept §8.3。NFR-06 fail-close とは別軸の「判断の手渡し」。安全性の核 | BR or L3 forward | ❓ |
| U-補-2 | **AI 実装の cross-agent review 強制**を業務要求にするか | concept §2.1.2.1 (review 3 ティア / gate 崩壊防止)。BR-08 は doc 品質のみ | BR or L3 forward | ❓ |
| U-補-3 | **rule parity (Claude/Codex 同一判定)** を NFR にするか | concept §2.1.0 (同一入力→同一判定・同一 exit)。NFR-03 の延長だが別要求 | NFR or L3 forward | ❓ |
| U-補-4 | **失敗の GitHub corpus 化** (失敗を仕組みに変換) を要求にするか | concept §1.4 / §8.5。価値の核に近い (failure→gate/test/postmortem) | BR/NFR or L3 forward | ❓ |
| U-補-5 | ADR-001 を NFR 明示 (= U-技-5) | 確定済方針の独立明示 | NFR (ほぼ確定) | ❓ |
| U-補-6 | **機能カタログ + doc/test/code 3 点セット整合 → GitHub Actions auto-merge**。機能カタログには harness 自身の L0-L14 workflow stages / PLAN system / 各 BR-* に対応する機能を含む。3 点セット = ①設計 doc + ②コード + ③テスト (4-artifact のうち test=③④集約)。BR-01 + BR-02 + NFR-05 の上位統合 (end-state CI 機構) | PO 指示 2026-05-28、concept §7 GitHub 統制と整合 | BR (PO declared) | ✅ framework 確定 (`../governance/audit-framework.md`)。BR-13〜19 + NFR-11 に分解 (§3.7) |

### 3.5 機能能力 → L3 FR forward (記録のみ、PO 判断不要。L1 では確定しない = AP-6)

以下は「機能要件 (FR)」であり L1 では書かない。①§5 forward へ一括転記し、PLAN-L3-01 起票者が拾う (被覆監査 GAP G-04〜G-10 の解消)。

- 工程強制範囲 (L0-L14 全 vs 段階) / 3 経路 (Forward/Reverse/Scrum) の実装順 — 旧 U-機-1,2
- signal→mode 自動 routing / 9-mode 入口判定 (concept §2.5, §2.6.1)
- layer-context 注入 / orchestration_mode 5 値 (§2.6.4)
- task classify / estimate / skill suggest (§2.1.3)
- 影響範囲分析 4 象限 (§2.6.2)
- 3 層抽象化 (skill / workflow / harness、§8.2)
- machine/AI gate 判定分離 (ledger F-2) / balance_ratio 量閉じ (F-3) / Reverse Gateway 整流 (F-4)

### 3.6 v2 取り込み (draft で着地済、G1 待ち)

| ID | 着地 | status |
|----|------|--------|
| BR-07 デグレ禁止 / BR-08 doc-reviewer / NFR-08 implementation_status | ① に draft 追記 (ledger A-1/2/3) | 🆕 G1 待ち |

### 3.7 GitHub / GHA 運用要件 (PO declared 2026-05-28 = HELIX Audit Framework)

PO が GitHub/GHA の運用要件として framework を declared。**W-model フェーズゲート (G0.5-G14) とは別軸の、PR/merge 時点 CI 検問 (7-Gate pipeline)**。正本は `../governance/audit-framework.md` (faithful record)。U-補-6 (BR-12) はここに分解される。

| 候補 ID | 内容 (AP-6 準拠の what) | status |
|---|---|---|
| **BR-13** | ドキュメント駆動 — 機能は `docs/features/F-NNN.md` (frontmatter + 本文) を正本として定義し、機能変更 PR は該当 feature md 更新を必須とする | 🆕 PO declared |
| **BR-14** | ドメイン監査 — 用語/責務/境界/データ整合を業務概念視点で監査し、レポートを正本化する (Domain Gate) | 🆕 PO declared |
| **BR-15** | コーディングルール監査 — `docs/coding-rules.md` を正本として機械監査 (Coding Rule Gate)。命名/責務/import/エラー/型/テスト配置/禁止事項を網羅 | 🆕 PO declared |
| **BR-16** | 7-Gate CI pipeline — Document → Domain → Test → Implementation → Coding-Rule → PR → Merge を順次適用し、各 Gate が監査レポートを産出 | 🆕 PO declared |
| **BR-17** | 4-tier merge 分類 — **safe (auto-merge) / caution (TL レビュー) / danger (人間レビュー) / unknown (自動マージ禁止)** を機械判定 | 🆕 PO declared |
| **BR-18** | rollback-plan PR 必須 — 全 PR に rollback 手順を含める | 🆕 PO declared |
| **BR-19** | block-first ポリシー — 不一致は revert より PR ブロックを優先。main 混入後のみ revert 検討 | 🆕 PO declared |
| **NFR-11** | 役割分離 — **HELIX (UT-TDD) = 開発・監査 / GitHub Actions = 検問・執行**。GHA は監査レポートを読んで判定するのみ (開発本体ではない) | 🆕 PO declared |
| **NFR-12** | **automation × AI review 補完機構** — 7 Gate の各 audit は機械処理 (deterministic / fail-close) と AI レビュー (contextual 判断) の 2 層で構成。機械可能なものは自動化、文脈判断必須は AI review、両者出力を GHA が統合判定。AI 判定不能 (unknown) は fail-close。詳細 Gate 別分解は `../governance/audit-framework.md §17` | 🆕 PO declared 2026-05-28 |
| **NFR-13** | **dev-local + CI 二重実行 (editor return loop)** — 同一 check 論理を `src/` に 1 本実装し、editor (Claude Code hook / CLI `ut-tdd audit`) と CI (GHA workflow) の両方が呼び出す。dev-local は advisory (早期検出)、CI は executory (guardrail)。CI fail は同一 report を artifact/PR comment で返し、エディタ AI/開発者が同じ報告で修正→再 push の loop で解決。詳細は `../governance/audit-framework.md §17.3` | 🆕 PO declared 2026-05-28 |
| **NFR-14** | **human-as-residue (人間判断負荷の最小化)** — machine 処理 + AI レビューで closed 可能なものはそこで完結。人間 escalate は両者判定不能な residue + 4-tier の danger のみ。incident 自動分類 + danger 判定の機械厳密化 (false positive 抑制) + escalate 量計測 fb loop で人間負荷を構造的に削減。人間 escalate 時も「判断要点 / 根拠 / 推奨アクション」を structured report で提示。詳細は `../governance/audit-framework.md §17.4` | 🆕 PO declared 2026-05-28 |

**既存 BR/NFR との関係**:
- BR-13 (doc 駆動) は **BR-01 (4 artifact trace)** を機能単位に具体化、**BR-05 (PLAN管理)** と並ぶ「正本軸」(PLAN=工程駆動 / feature=機能駆動の双軸構造になる)
- BR-14 (Domain) は新軸 — DDD 視点監査は既存 BR にない
- BR-15 (Coding Rule) は新軸 — コード品質規約は既存 BR にない
- BR-16 (7-Gate) は **BR-02 (team PR gate)** の機構具体化
- BR-17 (4-tier) は **BR-12 (auto-merge)** の具体判定方式
- BR-18 (rollback-plan) は **BR-04 (PoC契約化)** の安全側 — 全 PR に展開
- BR-19 (block-first) は **NFR-06 (fail-close)** の merge 文脈版
- NFR-11 (役割分離) は **NFR-05 (GitHub 正本)** の責務境界明示
- NFR-12 (machine × AI 補完) は v2 import ledger **F-2 (machine/AI gate 判定分離)** の正式化、各 Gate 設計 (L3 FR) の基本原則
- NFR-13 (dev-local + CI 二重実行) は **NFR-09 (rule parity)** の dev/CI 軸への延長、BR-16 (7-Gate pipeline) を 2 箇所で実行する運用原則 (editor return loop)
- NFR-14 (human-as-residue) は **NFR-12 (machine/AI 補完)** の escalate 軸への延長、**BR-17 (4-tier 分類)** の根拠原則。machine → AI → human の優先順位を全 Gate に適用

**運用ポイント (PO declared 2026-05-28 追補)**: GHA の発火単位は **feature**。`docs/features/` の inventory が GHA 発火条件と 3 点漏れ巻取り (changed-files × related_paths match) の機械基盤になる。多 feature affect (1 PR ↔ N features) も個別検証。unknown ファイル (どの feature にも紐付かない変更) は block。詳細は `../governance/audit-framework.md §14.1`。

**L1 統合前に PO 確認すべき architectural 整合課題** (framework header にも記載):
- (A) `docs/` 構造 migration: 現行 (governance/design/test-design/plans/adr/migration) → framework (product.md/requirements.md/architecture.md/coding-rules.md/risk-policy.yaml/features/) の **timing** (即時 / 段階 / 並走)
- (B) feature ID `F-NNN` と既存 BR-NN の関係 (1:1 / 多:多 / 別軸)
- (C) `.helix/reports/` (framework) vs `.ut-tdd/` (現行 runtime state) のパス名前空間 (どちらに reports を置くか / 名称統一)

### 3.8 ダッシュボード + 工程管理 DB + sync (PO declared 2026-05-28、phased)

PO が phased rollout を declared: Phase A (foundation、L1 即時) → Phase B (拡張プラン、L3 forward)。**Phase A は concept §8.1 軽量制約と整合** (core 内に閉じる)、Phase B 開始時に **ADR-002 (2 層分離: core 軽量 / dashboard server-optional)** を起票して整合解を確定する。

#### L1 (Phase A、即時)

| 候補 ID | 内容 (AP-6 準拠の what) | status |
|---|---|---|
| **BR-20** | **工程管理 DB のローカル永続化** — PLAN / gate / feature trace / session を `.ut-tdd/db/` に構造化永続し、ネットワーク不在でも動作する。BR-06 ダッシュボードの local-first 基盤 | 🆕 PO declared |
| **NFR-15** | **server-optional 動作保証** — ut-tdd CLI の全コア機能 (plan / gate / doctor / skill suggest / audit) はサーバー接続なしで動作。dashboard / sync は optional component として core から分離 (concept §8.1 軽量制約と整合) | 🆕 PO declared |

#### L3 forward (Phase B、拡張プラン)

| 候補 | 内容 | 送り先 |
|---|---|---|
| **BR-21 候補** | ダッシュボード差分同期 (local DB ↔ server DB、conflict resolution policy) | L3 FR / L4 ADR |
| **BR-22 候補** | skill firing log 収集 (OTel GenAI semantic conventions 準拠、event schema、PII/prompt 本文除外) | L3 FR / L4 ADR |
| **NFR-16 候補** | telemetry default off (opt-in 3 レベル: off / local-only / sync) | L3 NFR |
| self-improvement loop | gate false-positive 率 / bypass rate / time-to-first-green 等、ADR draft 自動起票 | L3 FR / L4 |
| **ADR-002 (新規)** | 2 層分離 (core 軽量 / dashboard server-optional) — Phase B 開始時に起票 | L4 ADR |

#### 既存 BR との関係

- BR-20 (local DB) は **BR-06 (ダッシュボード)** の Phase A 実装基盤、**BR-05 (PLAN phase-aware 管理)** の永続化レイヤー
- NFR-15 (server-optional) は **NFR-01 (cross-platform native)** + **NFR-02 (更新性)** の延長、concept §8.1 を Phase A で守る具体策

#### 技術スタック候補 (L4 ADR で確定)

- local DB: **PGlite (WASM Postgres、Bun 動作、3MB gzip)** を第一候補 — schema を server (Postgres) と共通化できる
- Phase B sync: **ElectricSQL** (PGlite ↔ Postgres partial replication) または **PowerSync**。CRDT は不要 (UT-TDD の使用パターンは queued-write で十分)
- Phase B deployment: **Cloudflare Workers + D1** (PoC) → **fly.io + Postgres** (本格) → **docker-compose** (self-hosted 選択肢)
- telemetry schema: OTel GenAI semconv (`invoke_agent` / `execute_tool` span) 準拠

#### PO 残差 (Phase B 開始時に確定、L1 では blocking しない)

- (D-1) telemetry 同意 default (off / local-only) — privacy 方針 (Anthropic opt-in / Copilot opt-out の選択)
- (D-2) サーバー管理主体・コスト負担 — 組織制約 (個人 / 会社 / SaaS)
- (D-3) マルチユーザー時の書き込み権限モデル — チーム運用ルール (誰でも書ける / PO のみ確定)

## §4 実行ステップ

1. **Step 1 論点抽出**: concept + ledger から押さえどころを洗い出し §3 レジストリへ (済)。
2. **Step 2 レジストリ整備**: 全項目を着地先・status 付きで 1 表化 (済。本 §3)。
3. **Step 3 ヒアリング (2 段 + 拡張提案)**: ❓ 項目について **(a) Web 検索 + TL レビュー** で外部 best practice と技術判断を先に集約 (`pmo-tech-docs` sonnet / Codex `tl-advisor`、Web ツール経由) → **(b) 解決しない残差のみ PO** にエスカレーション。あわせて**拡張性・追加機能案**を併出する。**回答が要求の源泉** (AI が単独で確定しない、PO escalation を残す) ([[memory: feedback-elicitation-ai-first]])。
4. **Step 4 正本へ構造化 + trace**: 回答を ① の BR/NFR/UX へ。FR は書かない。concept へ双方向 trace。➡️ 項目を §5 forward へ転記。
5. **Step 5 ③ 運用テスト設計** (L1↔L14): ① と対で OT-* を起こす (済、`L1-operational-test-design.md`)。
6. **Step 6 レビュー + 被覆監査**: 専門サブエージェント review (整合 / 抜け / FR 混入) + 被覆監査 (elicitation × concept × v2 が全件 ✅/➡️ に収束したか)。
7. **Step 7 DoD / G1 準備**: §5 DoD を満たし G1 (業務要求ゲート、PO サインオフ) へ。

## §5 受入条件 / DoD

- [ ] §3 レジストリの全項目が ✅ (正本着地) / ➡️ (§5 forward) のいずれかに収束 (❓ 残ゼロ)
- [ ] ① `L1-business-requirements.md` に BR-*/NFR-*/UX-* + **体系自己宣言節 (U-体系-0)** が存在し、各々 concept(L0) へ双方向 trace
- [ ] **FR-* を含まない** (AP-6 違反なし)。機能能力は §5 forward に記録
- [ ] ③ `L1-operational-test-design.md` が存在し ① と相互 reference (全 BR を量閉じ被覆)
- [ ] 専門サブエージェント review + 被覆監査 実施 (cross-agent 不在は記録)
- [ ] frontmatter が enum / phase-aware ID 規約に適合

## §6 関連 PLAN / docs

- 入力: `concept_v3.1` (L0 企画) / `v2-import-ledger.md` (v2 採択軌跡)
- 後続: `PLAN-L3-01-functional-requirements` (L3 FR+AC、本 PLAN の BR-* + §3.5 機能能力 forward から)
- 参照: `requirements_v1.2` (frontmatter / 受入条件 / G0.5 / L1-L3 二段分割)
