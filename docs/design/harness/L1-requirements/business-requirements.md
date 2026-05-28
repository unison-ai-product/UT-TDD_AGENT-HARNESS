---
layer: L1
sub_doc: business
status: draft
pair_artifact: docs/test-design/harness/L1-operational-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L3
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: ユビキタス言語 = [L0 概念層 §10 用語集](../../../governance/ut-tdd-agent-harness-concept_v3.1.md#10-用語集) / 業界標準整合 = L0 §11 / Bounded Context = L0 §2.5 9-mode。本 doc は L0 を parent_doc reference とし、用語独自定義は行わない (anti-corruption layer)。
> **件数確定**: business は BR-08 件 / NFR-08 件 / UX-03 件で確定 (根拠: 2026-05-28 v2 HELIX-workflows 正本由来、`docs/migration/v2-import-ledger.md §5.1 A-12〜A-24 / §6`)。
> **L3 接続規約**: `next_pair_freeze: L3`。L3 PLAN は本 sub-doc 全件を `dependencies.requires` に列挙する。

# UT-TDD Agent Harness — L1 業務要求 (business)

## §1 目的・背景

### §1.1 WHY

AI 実装エージェントを社内開発チームで安全に使うための検証・開発基盤が存在しない。AI 委譲しても回帰が壊れず、設計⇔実装⇔テストの整合を機械強制できる仕組みが必要。

### §1.2 WHAT

UT-TDD Agent Harness は、AI 実装エージェントを社内開発チームが安全に使うための検証・開発基盤。V-model (L0-L14) 全工程の PLAN 管理・gate 判定・trace 整合を機械強制し、AI 委譲しても工程規律が崩れない環境を提供する。

核となる価値 = **process (進め方・W-model 規律) / safety (壊さない・検証強制) / automation (AI 委譲・速さ) の 3 つを偏らせず統合する**こと自体が本プロダクトの価値。どれか一つに最適化しない (UX-01)。

業務要求 (BR-01〜08):

| ID | 業務要求 | 出所 (trace) |
|----|----------|--------------|
| **BR-01** | 設計⇔実装⇔テストの整合を機械強制し、AI 委譲しても回帰が壊れず **1 案件を L0-L14 通しで回せる** | concept P1 / 成功① ③ |
| **BR-02** | **複数人チーム (人間 = PO + レビュアー、実装等 = AI)** が日常 PR で gate・レビュー・役割境界を無理なく回せる (役割境界の機械強制は NFR-05 の GitHub 権限正本に連結) | concept P2 / 成功② / 役割ヒアリング |
| **BR-03** | AI 実装を安全に委譲でき、既存の設計・テストを破壊的に改変しない (回帰検知を保つ) | concept P4 / 成功③ |
| **BR-04** | PoC / 検証成果を契約化してから本実装へ合流させ、PoC の独り歩き・知見の散逸を防ぐ | concept P3 |
| **BR-05** | 開発を PLAN 単位 + **phase-aware ID** でフェーズ管理し、**規約違反を機械検知できる** (起票規約 / lint 仕様は L3 FR・L5 送り) | 本 session 確定 / requirements §1.10 A |
| **BR-06** | 複数プロダクト / 案件の工程表・進捗を **リアルタイムに横断可視化する専用 UI ダッシュボード**を提供する (実装アーキテクチャ = サーバー / DB 形式は §5 → L2/L4) | ダッシュボードヒアリング / 成功④ |
| **BR-07** | **デグレ禁止** — 上流変更が下流の対応 (テスト・trace) を伴わずに通ることを防ぎ、回帰の劣化を機械的に検知・block できる体制を持つ (3 軸 = 上流→下流 ID 追随 / balance_ratio regression / trace 切れ。具体機構は L3 FR・L4 送り) | v2 BR-12 翻案 / BR-03・BR-05 強化 |
| **BR-08** | **doc 品質の継続レビュー** — doc 品質専用の read-only reviewer (doc-reviewer、pmo-sonnet とは責務分離) を持ち、大規模 doc 改定・gate evidence 提出・pair freeze の前に必須召喚する | v2 BR-11 翻案 |

UX 要求 (UX-01〜03):

| ID | UX/価値要求 | 出所 |
|----|------------|------|
| **UX-01** | 核となる価値 = process/safety/automation の 3 バランス (§0 と同一、要求として再掲) | 価値ヒアリング |
| **UX-02** | 工程表ダッシュボード (専用 UI) で team が進捗・詰まり・フェーズを把握できる (BR-06 の体験面) | ダッシュボードヒアリング |
| **UX-03** | gate/lint 失敗時に **next_action が明確**、CLI 出力が分かりやすい、オンボーディングが滑らか | DX (PO 確定 2026-05-27) |

### §1.3 WHO

- **PO (Product Owner)**: スコープ・受入・最終承認。業務要求定義の主体。
- **開発チーム (AI + 人間)**: AI 実装エージェント (Claude Code / Codex) + 人間レビュアー。harness が役割境界を機械強制する対象。
- **harness 運用者**: UT-TDD Agent Harness を社内開発基盤として導入するチーム。

## §2 対象業務一覧

| 業務領域 | 説明 |
|----------|------|
| 工程管理 | V-model (L0-L14) 全工程の PLAN 起票・進捗管理・gate 判定 |
| AI 委譲制御 | AI 実装エージェントの役割境界機械強制・subagent guard |
| 品質保証 | 4 artifact pair trace / デグレ禁止 / doc 品質レビュー |
| 可視化 | ダッシュボード (専用 UI、工程表・進捗・詰まり・フェーズ) |
| PoC 管理 | Discovery ワークフロー / 仮説→契約化→本実装合流 |
| state 管理 | `.ut-tdd/` 配下の一元 state 管理・drift 検知 |

## §3 業務フロー

### §3.1 主線 (Forward V-model)

```
L0 企画 → G0.5 → L1 業務要求 → G1 → L2 画面設計 → G2
→ L3 機能要件 → G3 → L4 基本設計 → G4 → L5 詳細設計 → G5
→ L6 機能設計 → G6 → L7 実装スプリント → G7
→ L8 結合テスト → G8 → L9 総合テスト → G9
→ L10 UX → G10 → L11 総合レビュー+UAT → G11
→ L12 テスト設計 → G12 → L13 リリース → G13 → L14 運用 → G14
```

Forward フロー: `plan → pair-freeze → implement → trace-freeze → review → accept`

### §3.2 9 mode 分岐

| mode | 入口 | 主要工程 |
|------|------|----------|
| Forward | L0 企画書 | L0→L14 全工程 (主線) |
| Reverse | 既存コード/設計文書 | R0→R4→Forward 合流 |
| Discovery (PoC) | 仮説 | S0→S4→Forward 合流 |
| Incident | 本番障害 | 緊急 hotfix→V モデル昇華 |
| Add-feature | 既存 PLAN | add-design/add-impl で requires 接続 |
| Refactor | 対象コード | kind=refactor、振る舞い不変機械検証 |
| Retrofit | 移行対象構造 | retrofit-matrix + 段階移行 |
| Research | 調査課題 | kind=research、generates=ADR |
| Scrum | スプリント | インクリメント→V モデル昇華 |

### §3.3 cross-cutting 横断機構

V-model 全工程を横断する 4 機構 (FR-L1-11 参照):

| 機構 | 発動条件 | 効果 |
|------|----------|------|
| **interrupt** | 割り込みイベント (緊急 bug / 方針変更) | sprint interrupted 状態登録、現工程保留 |
| **debt** | 技術負債の累積検知 | debt-register 起票、返済 PLAN 自動提案 |
| **drift-check** | 週次 detector 起動 | 設計⇔実装の乖離レポート生成 |
| **readiness** | 後工程着手前 | 前工程成果物の充足度確認、PLAN 先送り判定 |

## §4 ステークホルダー

| ステークホルダー | 関心事 | 関与フェーズ |
|------------------|--------|-------------|
| PO (ユーザー) | スコープ・受入・最終承認 | 全フェーズ (G1/G3/G7/G11 サインオフ) |
| 開発チーム | 実装・テスト・レビュー | L4-L11 |
| AI エージェント (Claude / Codex) | 実装・文書起草・レビュー | L4-L9 (harness 委譲対象) |
| harness 運用者 | 基盤導入・更新・保守 | 全フェーズ |

## §5 現状課題 → あるべき姿

| 現状課題 | あるべき姿 | 対応 BR |
|----------|-----------|---------|
| AI 委譲時に設計・テストとの整合が崩れる | 4 artifact pair trace を機械強制 | BR-01 / BR-03 |
| チーム role 境界が散文ポリシーのみ | subagent guard で機械強制 | BR-02 |
| PoC 成果が独り歩きして知見が散逸 | Discovery ワークフローで契約化してから合流 | BR-04 |
| PLAN 管理が手動で規約違反の機械検知がない | PLAN lint / phase-aware ID で機械検知 | BR-05 |
| 進捗可視化がない | 専用 UI ダッシュボード (リアルタイム横断) | BR-06 / UX-02 |
| 上流変更が下流 trace を伴わず通る | ratchet 3 軸 (ID 追随 / balance_ratio / trace 切れ) | BR-07 |
| doc 品質チェックが非体系的 | doc-reviewer (専用 read-only reviewer) 必須召喚 | BR-08 |

## §6 業務スコープ外

本 sub-doc (business) では以下を扱わない:

- **FR (機能要件)**: L3 機能要件 sub-doc で確定 (FR-L1-* は functional sub-doc が入力)
- **画面設計**: screen sub-doc (L1 レベル要望のみ)、詳細は L2
- **技術選定・技術制約**: technical sub-doc / L4 ADR
- **NFR グレード値**: nfr sub-doc / L3 NFR グレード
- **実装方式**: L4-L6 設計層

## §7 L14 運用テスト pair 対応表

| BR-ID | OT-ID | テスト観点 |
|-------|-------|-----------|
| BR-01 | OT-01 | L0-L14 通し実行の整合確認 |
| BR-02 | OT-02 | 複数人 team gate 回転確認 |
| BR-03 | OT-03 | AI 委譲後の回帰検知確認 |
| BR-04 | OT-04 | PoC 契約化→合流フロー確認 |
| BR-05 | OT-05 | PLAN lint / phase-aware ID 機械検知確認 |
| BR-06 | OT-06 | ダッシュボード横断可視化確認 |
| BR-07 | OT-07 | デグレ禁止 ratchet 3 軸確認 |
| BR-08 | OT-08 | doc-reviewer 必須召喚確認 |
| UX-01 | OT-09 | 3 バランス価値の体験確認 |
| UX-02 | OT-10 | ダッシュボード UX 確認 |
| UX-03 | OT-11 | gate/lint 失敗時 next_action 明確性確認 |

(詳細は `docs/test-design/harness/L1-operational-test-design.md` OT-01〜13 参照)

## §8 関連 doc

- L0 概念層: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- 要件定義書: `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
- v2 import ledger: `docs/migration/v2-import-ledger.md`
- L1 機能要求: `docs/design/harness/L1-requirements/functional-requirements.md`
- L1 画面要求: `docs/design/harness/L1-requirements/screen-requirements.md`
- L1 技術要求: `docs/design/harness/L1-requirements/technical-requirements.md`
- L1 非機能要求: `docs/design/harness/L1-requirements/nfr.md`
- L14 運用テスト設計: `docs/test-design/harness/L1-operational-test-design.md`

## §9 carry / 既知の不足

### §9.1 上流 baton carry 一覧

| carry 項目 | 送り先 | 根拠 |
|-----------|--------|------|
| BR-07 ratchet 3 軸の具体機構 (doctor command / fail-close 条件 / balance_ratio 計測) | L3 FR / L4 | 機構設計は設計層 |
| BR-08 doc-reviewer role 定義 (model / 召喚 trigger / coverage 監査) | L3 FR | FR-L1-09 下流 |
| BR-06 ダッシュボード機能仕様 | L3 FR / L4 | 実装アーキは L2/L4 |
| 並列オーケストレーション機械実装 | L3 FR | F-1 (import-ledger §2) |
| 配布形態 (plugin / MCP 化) | L4 ADR | NFR-02 下流 |

## §10 業務 entity 列挙 (DDD)

### §10.1 主要業務 entity 一覧

| entity | L0 用語 | 業務的意味 | 対応 .ut-tdd state + CLI subcommand + file |
|--------|---------|-----------|-------------------------------------------|
| **plan** | PLAN | 工程単位の作業計画 (工程表 + 実装計画内蔵) | `.ut-tdd/plan_registry/` / `ut-tdd plan` / `docs/plans/*.md` |
| **gate** | Gate (G0.5-G14) | 工程間通過判定点 (fail-close) | `.ut-tdd/phase.yaml` / `ut-tdd gate` / `gate_runs` |
| **artifact** | 成果物 | PLAN が generates する設計 / テスト / 実装 doc | `.ut-tdd/artifact/` / `ut-tdd trace` / `docs/design/`, `tests/` |
| **pair** | Pair (W-model) | 設計 ⇔ テスト設計の双方向対応 (L1↔L14 等) | `pair_artifact` frontmatter / `ut-tdd doctor` |
| **mode** | 9 mode | 開発経路種別 (Forward / Reverse / Discovery 等) | `.ut-tdd/mode.yaml` / `ut-tdd status` |
| **drive** | 駆動タイプ | 実装の主軸 (be/fe/fullstack/db/agent 等) | PLAN frontmatter `drive:` |
| **agent_slot** | agent_slot | AI エージェント役割枠 (pmo / tl / se / pe 等) | `.claude/agents/*.md` / subagent guard 許可リスト |
| **handover** | Handover | セッション間の作業引き継ぎ状態 | `.ut-tdd/handover/CURRENT.json` / `ut-tdd handover` |
| **sprint** | Sprint | L7 実装スプリント単位 (TDD Red→Green→3 点 R) | PLAN §Sprint / `ut-tdd sprint` |
| **phase** | Phase | 現在の V-model 工程位置 | `.ut-tdd/phase.yaml` / `ut-tdd status` |
| **carry** | carry | 後段工程へ送る未確定事項・前提条件 | PLAN §carry / `ut-tdd plan lint` |
| **trace** | trace | 上流 ID → 下流 ID の双方向追跡記録 | `.ut-tdd/artifact/trace/` / `ut-tdd trace` |

### §10.2 L4 carry

集約境界 / 値オブジェクト / entity ID 規約 / ライフサイクル / 不変条件 / 集約間整合性 は L4 データ設計 sub-doc で確定する。`ut-tdd doctor check_business_entity_coverage` による entity ↔ schema / CLI 整合検出も L4 設計時に実装設計する。

### §10.3 SSoT 参照

- ユビキタス言語: L0 `docs/governance/ut-tdd-agent-harness-concept_v3.1.md §10 用語集`
- Bounded Context: L0 §2.5 9-mode ecosystem
- 業界標準整合: L0 §11 参考文献
- entity 独自定義禁止: `ut-tdd plan lint` (sub_doc=business 時) で機械検証
