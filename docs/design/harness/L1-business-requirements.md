# UT-TDD Agent Harness — L1 業務要求 (BR-*/NFR-*/UX-*)

> **layer**: L1 (業務要求) / **artifact**: ① 設計 (W-model 左、③ 運用テスト設計と対 →L14)
> **status**: BR-01〜06 / NFR-01〜07 / UX-01〜03 = confirmed (PO 確定 2026-05-27)。**BR-07/08・NFR-08 = draft (v2 import 2026-05-28、self-review 通過後 PO 確認待ち)**
> **v2 import note**: BR-07/08・NFR-08 は HELIX v2 (helix-workflows L1) の BR-12/11/09 を UT-TDD 文脈に翻案して追記。G1 凍結前の追記であり手戻りは小。採択軌跡は `../../migration/v2-import-ledger.md`。
> **入力**: L0 企画 = `../../governance/ut-tdd-agent-harness-concept_v3.1.md`
> **PLAN**: `../../plans/PLAN-L1-01-business-requirements.md` / **後続**: L3 機能要求 (FR+AC は BR-* から trace)
> 注: 本書は **FR-* (システム機能要件) を書かない** (L3 送り、§3.1.2 / AP-6)。

## 0. 価値の核 (全 BR の重み付け原則)

**V: process (進め方・W-model 規律) / safety (壊さない・検証強制) / automation (AI 委譲・速さ) の 3 つを偏らせず統合する**こと自体が本プロダクトの核となる価値。どれか一つに最適化しない。

## 1. 業務要求 (BR-*)

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

## 2. 非機能要求 (NFR-*)

| ID | 非機能要求 | 出所 |
|----|-----------|------|
| **NFR-01** | **cross-platform native** — Windows / macOS / Linux を全て第一級サポート | 環境ヒアリング (全 OS 第一級) |
| **NFR-02** | **更新性第一 (updatability)** — harness 本体・skill 等の更新/保守が容易であること (実現手段 = plugin / skill MCP 化 等は L4 ADR 送り、§5) | 配布ヒアリング |
| **NFR-03** | **AI mode 非依存** — standalone / claude-only / codex-only / hybrid で動作。**Claude Code + Codex hybrid を主軸** | AI ヒアリング |
| **NFR-04** | 統制対象 repo は **言語非依存 (全種類)**。harness 自体は TypeScript (ADR-001) | repo ヒアリング / CLAUDE.md |
| **NFR-05** | **GitHub を CI / 証跡 / 権限の正本**とする (具体実現手段は L3/L5 で確定) | GitHub ヒアリング / concept §1.4 |
| **NFR-06** | **fail-close** — gate / lint は安全側に倒し、silent pass を許さない | 価値 (safety) / concept |
| **NFR-07** | **実務で機能する完成度** — 部分 MVP でなく、§4 成功条件 4 つを総合的に満たして初めて価値 (MVP は存在しない) | 優先度ヒアリング |
| **NFR-08** | **実装宣言の真実性** — 設計 doc が主張する CLI / file / schema field に実装状態列 (installed / partial / not-implemented) を必須化し、机上の「実装済」宣言を禁止する | v2 BR-09 翻案 |

## 3. UX / 価値要求 (UX-*)

| ID | UX/価値要求 | 出所 |
|----|------------|------|
| **UX-01** | 核となる価値 = process/safety/automation の 3 バランス (§0 と同一、要求として再掲) | 価値ヒアリング |
| **UX-02** | 工程表ダッシュボード (専用 UI) で team が進捗・詰まり・フェーズを把握できる (BR-06 の体験面) | ダッシュボードヒアリング |
| **UX-03** | gate/lint 失敗時に **next_action が明確**、CLI 出力が分かりやすい、オンボーディングが滑らか | DX (PO 確定 2026-05-27) |

## 4. 成功条件 (受入の方向、L1。③ 受入/運用テスト設計の根拠)

実務で機能する = 次の **5 つを総合的に**満たす (どれか 1 つの MVP では価値なし):

1. 1 案件を L0-L14 通しで回せる (BR-01)
2. 複数人 team が日常 PR で gate を回せる (BR-02)
3. AI 委譲で回帰が壊れない (BR-03)
4. 工程表で進捗が見える (専用 UI、BR-06)
5. PoC / 検証成果が契約化されて本実装に合流できる (独り歩きしない、BR-04)

## 5. open → forward (L1 では確定せず後段へ)

- **機能要求 (FR、→ L3)**: 工程強制範囲 (L0-L14 全強制 vs 段階導入) / 3 経路 (Forward/Reverse/Scrum) の実装順 / ダッシュボードの機能仕様。
- **新規 BR の機械実装 (→ L3 FR / L4)**: BR-07 ratchet 3 軸 (doctor command・fail-close 条件・balance_ratio 計測) / BR-08 doc-reviewer の role 定義 (model・召喚 trigger・coverage 監査) / NFR-08 implementation_status 列の必須フォーマット (L3 以降の全設計 doc に波及)。
- **並列オーケストレーション (→ L3 FR)**: タスク依存分解 → 最大 8 スロット並列ディスパッチ + 稼働チェック。現状は `.claude/CLAUDE.md` の散文ポリシー + PM 手作業のみ (機械実装なし)。concept §2.6 配線 / requirements §7.8 に連結 (v2 import ledger F-1、PO 判断 = L3 要求化のみ 2026-05-28)。
- **技術設計 (→ L4)**: 配布形態 (plugin / skill MCP 化) / ダッシュボード UI 実装技術 / **サーバー + V-model 管理 DB + リアルタイム更新 + multi-project 横断**のアーキテクチャ / 更新性の実現方式。
- ⚠️ **整合課題 (要 L2 解決)**: BR-06 (サーバー / DB / リアルタイム / 複数プロダクト横断ダッシュボード) は concept の「軽量・interpreter 不要・外部依存避け」(§8.1) と緊張する。**L1 では要求として確定**し、規模・実現方式・現行ファイルベース state との整合は L2/L4 に委ねる (詳細アーキ分析は L2 entry の検討事項)。
- **③ 運用テスト設計** (W-model L1↔L14 pair): `../test-design/harness/L1-operational-test-design.md` (**予定・未作成**、PLAN-L1-01 Step 5)。

## 6. trace サマリ (L0 → L1)

concept の 4 問題 P1-P4 → BR-01/02/03/04、§1.4 GitHub 正本 → NFR-05、ヒアリング → 価値V/BR-06/NFR-01〜04/07/UX。L3 で FR-* が本書 BR-* から trace する。**v2 import**: HELIX v2 (helix-workflows L1) BR-12/11/09 翻案 → BR-07/08・NFR-08 (採択軌跡 = `../../migration/v2-import-ledger.md`)。
