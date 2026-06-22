---
layer: L1
sub_doc: business
status: confirmed
pair_artifact: docs/test-design/harness/L1-operational-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L3
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: ユビキタス言語 = [L0 概念層 §10 用語集](../../../governance/ut-tdd-agent-harness-concept_v3.1.md#10-用語集) / 業界標準整合 = L0 §11 / Bounded Context = L0 §2.5 9-mode。本 doc は L0 を parent_doc reference とし、用語独自定義は行わない (anti-corruption layer)。
> **件数確定**: business は **BR-01〜08 (8 件) + BR-21 (P2、§11) + BR-22 (内部資産、Recovery fullback) = BR 10 件** / **UX-01〜03 (3 件)** で確定 (根拠: 2026-05-28 v2 source snapshot reference 設計概念参照、`docs/migration/v2-import-ledger.md §5.1 A-12〜A-24 / §6`、2026-06-02 BR-22 fullback audit)。NFR は `nfr.md` で **15 件確定** (NFR-09/10 欠番、NFR-17 統合セキュリティ A-54 追加。本 doc §6 は IPA 大項目で参照のみ、NFR-ID 件数の正本は nfr.md)。
> **L3 接続規約**: `next_pair_freeze: L3`。L3 PLAN は本 sub-doc 全件を `dependencies.requires` に列挙する。

# UT-TDD Agent Harness — L1 業務要求 (business)

## §1 目的・背景

### §1.1 WHY

AI 実装エージェントを社内開発チームで安全に使うための検証・開発基盤が存在しない。AI 委譲しても回帰が壊れず、設計⇔実装⇔テストの整合を機械強制できる仕組みが必要。

### §1.2 WHAT

UT-TDD Agent Harness は、AI 実装エージェントを社内開発チームが安全に使うための検証・開発基盤。V-model (L0-L14) 全工程の PLAN 管理・gate 判定・trace 整合を機械強制し、AI 委譲しても工程規律が崩れない環境を提供する。

核となる価値 = **process (進め方・V-model 規律) / safety (壊さない・検証強制) / automation (AI 委譲・速さ) の 3 つを偏らせず統合する**こと自体が本プロダクトの価値。どれか一つに最適化しない (UX-01)。

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
| **BR-22** | **自前 runtime 内部資産体系を持つ** — UT-TDD は自身が使う/対象に提供する **subagent roster / skill pack / command** を UT-TDD 用の正本資産として持ち、source-derived資産を「そのまま使う」のでなく **UT-TDD 用に再構築**する。guard (呼出統制) だけでなく資産そのものを統制対象とする (再構築の HOW = FR-L1-46〜49) | A-77 PO 指摘 (前提抜け) / Recovery PLAN-RECOVERY-01 |

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

### §1.4 体系自己宣言 (本書が前提とする工程・mode・駆動・PLAN 規約)

本書および L1 全 5 sub-doc は、以下の正本体系を採用する (v2 source snapshot reference 由来、L0 概念層 + 要件定義書 で機械強制):

| 体系要素 | 採用内容 | 正本 |
|----------|---------|------|
| **工程構造** | V-model L0-L14 + V-model 左右 pair (L1↔L14 / L2↔L10 / L3↔L12 / L4↔L9 / L5↔L8 / L6↔L7) | concept §3 / requirements §1.4 |
| **入口 mode** | 9-mode ecosystem (Forward / Reverse / Discovery / Refactor / Retrofit / Recovery / Scrum / Incident / Add-feature) + 工程専門 2 (screen-design / frontend-design) | concept §2.5 |
| **駆動タイプ** | 9 駆動 (be / fe / fullstack / db / agent / scrum / reverse / poc / troubleshoot)、各駆動で L2-L14 挙動が変わる | concept §3.7 / requirements §1.6 |
| **PLAN 構造** | 機能 (doc) 単位、PLAN 内蔵物原則 (工程表 + 実装計画 + review Step 固定) | concept §3.6 / requirements §1.10.G.4 |
| **L1 sub-doc** | 業務 / 機能 / 画面 / 技術 / 非機能 の 5 sub-doc (1 PLAN にまとめる旧運用は AP-11 違反) | concept §3.1.2.1 / requirements §1.10.G |
| **4 artifact** | 設計 (文書) / 実装コード / テスト設計 (文書) / テストコード の双方向 12 directed edge | concept §2.3 / requirements §2.4 |
| **3 段階 freeze** | 段階 A (Pair freeze、設計⇔テスト設計) / 段階 A2 (TDD Red、L7 entry) / 段階 B (4 artifact trace、G7) | concept §2.3 |
| **DDD anti-corruption layer** | L1 entity は L0 §10 用語集と 1:1 対応、独自定義禁止 (§10 業務 entity 一覧で機械検証) | concept §3.1.2.2 / requirements §1.10.G.7 |
| **NFR 体系** | IPA 非機能要求グレード 2018 6 大項目 + ISO 25010 二軸タグ | nfr §6 / nfr §7 |
| **Forward フロー** | `plan → pair-freeze → implement → trace-freeze → review → accept` | concept §3.1 / §3.2 |
| **AI ガード** | subagent guard (PreToolUse Agent、許可リスト 15 / model 明示 / override 禁止、fail-close) | `.claude/CLAUDE.md` Guard Rules / `.claude/hooks/agent-guard.ts` |
| **MVP 業務最重要 3 要素** (B10=a 採用) | V-model + Forward フロー / 4 artifact + 3 段階 freeze / AI ガード | B10=a PO 承認 2026-05-28 |

本宣言節は U-体系-0 (体系自己宣言、PLAN-L1-01 §3.1 ヒアリング項目由来) の確定版。本書以降の L1 5 sub-doc は本体系を前提として記述する。

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

| mode | 入口 | 主要工程 | Forward 合流点 |
|------|------|----------|---------------|
| Forward | L0 企画書 | L0→L14 全工程 (主線) | — (主線) |
| Reverse | 既存コード/設計文書 | R0→R4→Forward 合流 | R4 routing → RGC → fullback → Forward L0-L14 |
| Discovery (PoC) | 仮説 | S0→S4→Forward 合流 | S4 decide → Forward L3 機能要件 合流点 |
| Incident | 本番障害 | 緊急 hotfix→V モデル昇華 | hotfix 収束後 → Forward 対応 L (L3/L4) へ昇華 |
| Add-feature | 既存 PLAN | add-design/add-impl で requires 接続 | Forward 差分追補が設計思想 (Reverse は前段 option) |
| Refactor | 対象コード | kind=refactor、振る舞い不変機械検証 | L7/G7 で振る舞い不変確認後 Forward 復帰 |
| Retrofit | 移行対象構造 | retrofit-matrix + 段階移行 | L4-L7 段階移行後 → Forward L7 以降合流 |
| Research | 調査課題 | kind=research、generates=ADR | ADR generate 後 → ADR 参照点 (L4 基本設計) へ合流 |
| Scrum | スプリント | インクリメント→V モデル昇華 | インクリメント収束後 → Reverse closure 機構経由 → Forward L0-L14 昇華 |

### §3.3 cross-cutting 横断機構

V-model 全工程を横断する 4 機構 (FR-L1-11 参照):

| 機構 | 発動条件 | 効果 |
|------|----------|------|
| **interrupt** | 割り込みイベント (緊急 bug / 方針変更) | sprint interrupted 状態登録、現工程保留 |
| **debt** | 技術負債の累積検知 | debt-register 起票、返済 PLAN 自動提案 |
| **drift-check** | 週次 detector 起動 | 設計⇔実装の乖離レポート生成 |
| **readiness** | 後工程着手前 | 前工程成果物の充足度確認、PLAN 先送り判定 |

### §3.3.1 9 mode 統一合流原則 (B10=a / PO 承認 2026-05-28)

Forward / Research を除く 7 mode (Reverse / Discovery / Refactor / Retrofit / Recovery / Scrum / Incident) は、収束時に **Reverse の closure mechanism** (R4 routing / RGC / fullback) を再利用して Forward L0-L14 へ合流する。これにより全 mode の「終わり方」を統一し、Forward 以外の成果物が V-model の外に放置されることを防ぐ。

> **Add-feature 例外**: Add-feature は既存 PLAN への差分追補が設計思想であり、Reverse closure を必須としない。Reverse は「前段 option」として使用可能だが、強制ではない (根拠: legacy source add-feature-workflow.md §基本フロー / concept §2.5 既宣言)。UT-TDD では本原則として明示記述する。

### §3.3.2 人間主導 + AI 補助原則 (CC2 / PO 承認 2026-05-28)

UT-TDD Agent Harness の運用原則として、**画面・hook・gate のすべては人間 (PO / 運用者) の判断補助のために設計**する。AI 単独自動化に依存せず、人間が異常検知・問題箇所特定・修正判断を主導する設計思想を貫く。

- **AI = 補助者**: AI は実装・文書起草・レビューを担うが、最終判断 (gate サインオフ / 修正方針 / リソース割当) は人間が下す
- **画面 = 人間の判断補助**: 画面はサマリだけでなく **詳細データテーブル** を提供し、人間が目視で異常検知できる粒度を維持 (screen §3.1 横断原則 [[CC3]])
- **AI への指示は copy-paste UI で生成**: 自動修正ボタンではなく、人間が AI に貼り付けて指示するテキストを生成する設計 (画面 §3.1 [[CC2]])
- **AI は UI 操作なし** (S-01): Claude Code / Codex は CLI 経由のみで harness と連携する
- **整合**: BR-02 (複数人チーム role 境界) / BR-08 (doc-reviewer 必須召喚) / NFR-14 (human-as-residue 原則) と整合

本原則は L3 / L4 設計層への forward carry とし、全機能設計で「人間判断点」を明示する。

## §4 ステークホルダー

| ステークホルダー | 関心事 | 関与フェーズ | gate サインオフ権 | 権限 (S-04) |
|------------------|--------|-------------|-----------------|------------|
| PO (ユーザー) | スコープ・受入・最終承認 | 全フェーズ | G1 / G3 / G7 / G11 (S-02) | gate override 例外権 (S-03) / PLAN 削除 / merge 権 (S-05) |
| TL (Tech Lead) | 技術品質・設計判断 | L3-L9 | G4 / G5 / G6 (S-02) | merge 権 (S-05) / 設計 ADR 承認 |
| 開発チーム | 実装・テスト・レビュー | L4-L11 | — | PR 作成・レビュー |
| AI エージェント (Claude / Codex) | 実装・文書起草・レビュー | L4-L9 (harness 委譲対象) | — (commit 禁止) | CLI 経由のみ / `.ut-tdd/` 直接編集不可 (S-01) |
| harness 運用者 | 基盤導入・hook 有効化・state 管理 | 全フェーズ | — (gate サインオフ禁止) | `.ut-tdd/` state 直接編集 / hook 有効化 (S-04)。PLAN 削除禁止 |
| 外部ステークホルダー | 進捗確認 | 参照のみ | — | read-only (S-02) |

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

## §6.5 業務 KPI 定義 (D-01〜D-09、PO 承認 2026-05-28)

| KPI ID | KPI 名 | 計測式 | 目標値 | 計測場所 |
|--------|--------|--------|--------|---------|
| **D-01** | PLAN 起票数/sprint | sprint 期間中に起票された PLAN 件数 | ≥ 1 件/sprint | `.ut-tdd/plan_registry/` / `ut-tdd plan list` |
| **D-02** | gate 通過率 | gate pass 件数 / gate 総実行件数 × 100 | ≥ 90 % | `.ut-tdd/gate_runs/` / `ut-tdd gate log` |
| **D-03** | V-model 順序遵守違反 | 前工程未完了で後工程着手した検知件数 | 0 件 | `ut-tdd doctor` / `ut-tdd plan lint` |
| **D-04** | 回帰検出率 | テストで検出した回帰件数 / 回帰発生総件数 × 100 | ≥ 80 % | CI gate / `ut-tdd trace` |
| **D-05** | 4 artifact trace 整合率 | trace 整合 PLAN 件数 / 全 PLAN 件数 × 100 | ≥ 95 % | `ut-tdd trace check` / `.ut-tdd/artifact/trace/` |
| **D-06** | agent guard bypass 件数 | `UT_TDD_ALLOW_RAW_AGENT=1` 実行件数 (audit 記録) | 0 件 目標 (PO 承認時のみ許容) | `.ut-tdd/audit/` / agent-guard log |
| **D-07** | AI 委譲時間率 | AI 委譲タスク工数 / 総開発工数 × 100 | ≥ 70 % | PLAN `drive:` 集計 / `ut-tdd status` |
| **D-08** | gate override 件数/sprint | PO による gate fail-close 例外行使件数 | ≤ 2 件/sprint | `.ut-tdd/audit/` / gate override log |
| **D-09** | handover 引継ぎ成功率 | next_action 実行成功件数 / handover 総件数 × 100 | ≥ 95 % | `.ut-tdd/handover/` / `ut-tdd handover log` |

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
| BR-22 | OT-46 | 内部資産 (roster/skill pack/command) が UT-TDD 用に再構築済 + legacy source 前提残存 0 の確認 |
| UX-01 | OT-09 | 3 バランス価値の体験確認 |
| UX-02 | OT-10 | ダッシュボード UX 確認 |
| UX-03 | OT-11 | gate/lint 失敗時 next_action 明確性確認 |

(本表は BR/UX → OT-01〜11 の対応。OT 全件 (追加観点含む) の詳細は `docs/test-design/harness/L1-operational-test-design.md` 参照)

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
| BR-22 内部資産 (subagent roster / skill pack / command) の UT-TDD 化詳細 (FR-L1-46〜49 / 棚卸 = internal-asset-inventory.md / rebuild map W6/W7/W10/W11/W12/W16 / drift=IMP-033) | L3 FR / L4-L6 | Recovery PLAN-RECOVERY-01、設計増分は L4-L6 |
| BR-06 ダッシュボード機能仕様 | L3 FR / L4 | 実装アーキは L2/L4 |
| 並列オーケストレーション機械実装 | L3 FR | F-1 (import-ledger §2) |
| 配布形態 (plugin / MCP 化) | L4 ADR | NFR-02 下流 |
| B1: チーム規模 2-5 名 + AI スロット 3 の具体 provisioning 方式 | L3 FR / L4 | NFR-05 / GitHub 権限正本連結 |
| B2: gate サインオフ権限の機械強制実装 (PO G1/G3/G7/G11 / TL G4/G5/G6) | L3 FR | FR-L1-05 下流 |
| B3: PoC 打ち切り条件の実装 (2 sprint 強制 OR rejected 判定ロジック) | L3 FR / L4 | Discovery ワークフロー機構 |
| B6: bypass 条件の audit 記録実装 (`UT_TDD_ALLOW_RAW_AGENT=1` + PO 承認 flow) | L3 FR | agent guard 下流 |
| B7: handover 30 日 archive + 90 日削除 の自動化実装 | L3 FR / L4 | `ut-tdd handover` subcommand |
| B8: リアルタイム遅延 5 分以内の実装 (gate fail 即時 / ダッシュボード更新) | L3 FR / L4 NFR | NFR-15 carry |
| B9: skill / detector entity 参照注記の FR 詳細化 (FR-L1-12/08/18) | L3 FR | §10.4 参照注記 → FR 詳細化 |
| BR-21: FR-L1-36/38/43 の詳細仕様 (AI 実行品質評価・改善サイクル) | L3 FR | Phase B、§11 carry |
| 9 mode 統一合流シナリオの具体フロー (各 mode の closure 手順・RGC 設計) | L3 FR / L4 | §3.3.1 原則 → 機構設計 |
| **(PdM tech-innovation A-46)** DORA 4+1 metrics → KPI D-10〜D-13 追加 (Deployment Freq / Lead Time / Change Failure Rate / MTTR、9-mode 別集計) | L4 ADR + Phase A NFR | pdm-tech-innovation 提案、業界 de facto standard、external benchmark 可能 |
| **(PdM tech-innovation A-46)** SPACE Satisfaction → D-14 reviewer cognitive load (Likert 1-5、CC2 measurable proxy) + D-15 handover record 完全性 + D-16 gate G2-G7 待機時間 + D-17 PLAN diff median LOC | L4 ADR + Phase A NFR | AI harness 固有: reviewer 疲労が CC2 形骸化リスク |
| **(PdM marketing-innovation A-46)** **BR-JTBD-01** 3 層 job 明文化 (Functional=trace 整合 / Emotional=AI 暴走不安解消 / Social=audit evidence 公開可能) + UX-04 audit evidence 可視化新設 | L3 / L4 add-design 候補 | Christensen JTBD、Phase A 即適用候補 |
| **(PdM marketing-innovation A-46)** **BR-NSM-01** NSM = Verified AI delivery rate (process × safety × automation 統合 1 指標、D-10 候補) | L3 / L4 add-design 候補 | Sean Ellis / Amplitude NSF Playbook |
| **(PdM marketing-innovation A-46)** **BR-TTV-01** Aha moment = 初回 doctor で drift 検出、TTV ≤ 15 分目標 (FR-L1-44 onboarding 連携) | Phase A→B 橋渡し | Wes Bush PLG、whole product = sample repo + migration tool + 教育資料 + CI template |
| **(PdM marketing-innovation A-46)** **BR-multi-01/02 + FR-L1-multi-01/02** tenant 分離 + cross-team handover + team-level dashboard + policy inheritance (org→team→repo 3 階層 CLAUDE.md) | Phase B carry | multi-team 拡張時に活性化、solo maintainer では over-engineering |
| **(tech-docs A-46)** back-propagation protocol 4-step (kind=reverse + confirmed_reverse_type=design による下流→上流 entity 進化記録) → `docs/governance/back-propagation-protocol.md` 起票 | L4 governance | InfoQ Guardian DDD 事例、§10.1.1 L3 由来 entity の取扱手順 |
| **(tech-docs A-46)** NFR 3-tier classification (A: doctor 自動判定 / B: CI 後人間確認 / C: PO 合意のみ) → `docs/design/nfr-classification.md` | L4 carry | IPA × ISO 25010 二軸の実装適用、L7 で `ut-tdd doctor --nfr` 実装入力 |
| **(tech-docs A-46)** Neurosymbolic Guard Pattern (LLM 判断ではなく TS 決定論コード + audit append-only) | L4 ADR-002 候補 | AWS Guardrails 事例、agent-guard.ts 設計原則の正本化 |
| **(tech-docs A-46)** Testable Contract as Freeze Gate (V-model layer exit = artifact テスト可能性の機械検証) → `vmodel_validator` 実装 | L7 carry | DEV V-model+AI 事例、L6→L7 freeze + L3↔L12 pair 機械検証 |
| **(A-52 audit I-01)** Recovery mode 業務フロー (ガード検出 → 再開ポイント確定 → 認識訂正履歴) を業務要求として独立宣言 (BR-03 の暗黙吸収から明示化、BR-09 候補) | L3 / L4 add-design 候補 | recovery-workflow.md 二段構え、BR-03 では「暴走対応業務フロー」明示なし |
| **(A-52 audit I-02)** Learning Engine recipe 蓄積・skill 推薦ループ全体を BR-21 Phase B に明示化 (recipe entity + pattern_key + L 単位注入自動更新) | L3 BR-21 詳細化 / Phase B | learning-engine.md §学習の処理 / 出力、現状 BR-21 は FR-L1-36/38/43 のみ言及 |
| **(A-52 audit I-04)** AI 選択空間限定 UX (layer-context-injection の「AI が迷わない」原則) を UX-04 候補として宣言 (現 UX-01〜03 は人間 DX のみカバー、AI DX 観点を補強、BR-JTBD-01 と合流可) | L3 / L4 add-design 候補 | layer-context-injection.md §AI の判断の迷いを消す原理、UX-03 (CLI 出力分かりやすい) は人間向け |
| **(A-52 audit M-03)** handover 業務価値 (セッション間 AI 委譲継続性保証) の BR 明示化検討 (現状 BR-03/BR-05 の暗黙前提、BR-09 候補) | Phase B carry | continuous-run-context-management.md §本命 PoC、D-09 で KPI 化済だが BR 明示なし |

## §10 業務 entity 列挙 (DDD)

### §10.1 主要業務 entity 一覧

| entity | L0 用語 | 業務的意味 | 対応 .ut-tdd state + CLI subcommand + file |
|--------|---------|-----------|-------------------------------------------|
| **plan** | PLAN | 工程単位の作業計画 (工程表 + 実装計画内蔵) | `.ut-tdd/plan_registry/` / `ut-tdd plan` / `docs/plans/*.md` |
| **gate** | Gate (G0.5-G14) | 工程間通過判定点 (fail-close) | `.ut-tdd/phase.yaml` / `ut-tdd gate` / `gate_runs` |
| **artifact** | 成果物 | PLAN が generates する設計 / テスト / 実装 doc | `.ut-tdd/artifact/` / `ut-tdd trace` / `docs/design/`, `tests/` |
| **pair** | Pair (V-model) | 設計 ⇔ テスト設計の双方向対応 (L1↔L14 等) | `pair_artifact` frontmatter / `ut-tdd doctor` |
| **mode** | 9 mode | 開発経路種別 (Forward / Reverse / Discovery 等) | `.ut-tdd/mode.yaml` / `ut-tdd status` |
| **drive** | 駆動タイプ | 実装の主軸 (be/fe/fullstack/db/agent 等) | PLAN frontmatter `drive:` |
| **agent_slot** | agent_slot | AI エージェント役割枠 (pmo / tl / se / pe 等) | `.claude/agents/*.md` / subagent guard 許可リスト |
| **handover** | Handover | セッション間の作業引き継ぎ状態 | `.ut-tdd/handover/CURRENT.json` / `ut-tdd handover` |
| **sprint** | Sprint | L7 実装スプリント単位 (TDD Red→Green→3 点 R) | PLAN §Sprint / `ut-tdd sprint` |
| **phase** | Phase | 現在の V-model 工程位置 | `.ut-tdd/phase.yaml` / `ut-tdd status` |
| **carry** | carry | 後段工程へ送る未確定事項・前提条件 | PLAN §carry / `ut-tdd plan lint` |
| **trace** | trace | 上流 ID → 下流 ID の双方向追跡記録 | `.ut-tdd/artifact/trace/` / `ut-tdd trace` |

### §10.1.1 L3 由来 entity 追加 (back-propagation、A-46 ledger / 2026-05-28)

L3 sub-doc 本起草 (functional / business-detail / nfr-grade + L12 受入テスト) で発生した新概念を L1 entity に逆方向 back-propagation する。今後 L4 で集約境界 / 値オブジェクト確定する対象として宣言。

| 新規 entity | L3 由来 | 業務的意味 | L4 carry |
|------------|---------|----------|----------|
| **acceptance_criterion** (AC) | functional §2 / 全 FR-* に最低 3 件 | Given-When-Then 形式の受入条件、L7 TDD Red の入力 | 集約境界 = FR-* 配下、不変条件 = 3 件最低 (正常/異常/境界) |
| **acceptance_test** (AT) | L12 受入テスト設計 §1 (87 件) | 各 AC を vitest / GHA workflow に変換、機械検証可能 | 集約境界 = AC 配下、AT 実装は L7 carry |
| **plan_evaluation** | business-detail §1-§2 (5 指標) | PLAN status=completed 時の評価メトリクス | 集約 root、5 指標 + 集計時点 |
| **skill_evaluation** | business-detail §7 FR-BR21-36 (Phase B) | skill 採用率 + 採用後成功率の sprint 末バッチ集計 | Phase B carry |
| **model_evaluation** | business-detail §7 FR-BR21-38 (Phase B、opt-in) | model 別成功率 / cost 効率、`model-opt-in.yaml` 制御 | Phase B carry |
| **poc_evaluation** | business-detail §7 FR-BR21-43 (Phase B) | Discovery (S0-S4) decision_outcome 集計 | Phase B carry |
| **ipa_grade** | nfr-grade §1-§6 (NFR-* 14 件) | IPA 非機能要求グレード 2018 Lv1〜5、業界標準値オブジェクト | 値オブジェクト、IPA 公式 sample 整合 |
| **cutover_command** | functional FR-10 (Recovery CLI コピー) | HM-06 で生成する CLI ロールバックコマンド、UI 直接実行禁止 (S5=b) | 値オブジェクト、CLI string + 引数構造 |
| **kpi_metric** | business §6.5 D-01〜D-09 + nfr-grade KPI integrated | KPI 計測式 + 目標値 + 測定場所の 3 点組 | 値オブジェクト、§9 carry の DORA/SPACE 候補と統合検討 |
| **evaluation_batch** | business-detail §5 (4 ソース統合) | sprint 末 trigger で 4 state ソース集計 → derived view | 集約 root、Phase B 実装 |
| **derived_view** | business-detail §5 (HM-08 表示) | 集計済データ readonly view (30 秒ポーリング表示) | Phase A placeholder + Phase B 実装 |

> **back-propagation protocol** (tech-docs 領域 3 提案、A-46): L3 実装フェーズで新概念が発見されたら → (1) 境界再定義 PLAN 起票 (kind=reverse + confirmed_reverse_type=design) → (2) L1 entity §10 更新 → (3) V-pair L1↔L14 re-trace 記録 → (4) L3 受入条件への反映。L4 で `docs/governance/back-propagation-protocol.md` 起票候補。

### §10.2 L4 carry

業務 entity §10.1 + §10.1.1 (L3 由来 11 entity 追加) の以下構造要素は L4 データ設計 sub-doc で確定する (Minor 5 G1 readiness v8 で機械検証可能化、箇条書き化 2026-05-28 / L3 由来 entity 追加 A-46 2026-05-28):

| carry 項目 | 役割 | L4 着地先 |
|----------|------|---------|
| **集約境界** (Aggregate Root) | entity 集約の責任範囲確定 | L4 データ設計 §1 |
| **値オブジェクト** (Value Object) | identity 不要の不変構造 | L4 データ設計 §2 |
| **entity ID 規約** | ID 形式・採番ルール (例: PLAN-NNN-slug) | L4 データ設計 §3 |
| **ライフサイクル** | entity の生成 / 状態遷移 / 削除規約 | L4 データ設計 §4 |
| **不変条件** (Invariants) | entity が常に満たすべき制約 | L4 データ設計 §5 |
| **集約間整合性** | aggregate 跨ぎの一貫性ルール | L4 データ設計 §6 |
| **entity ↔ schema / CLI 整合検出** | `ut-tdd doctor check_business_entity_coverage` の実装設計 | L4 データ設計 §7 + L4 CLI 設計 |

検証: 各 carry 項目は L4 PLAN (PLAN-L4-04 データ設計) 起票時に `dependencies.requires` で本 sub-doc を列挙し、`ut-tdd plan lint` (sub_doc=business 時) で entity 独自定義禁止 (L0 §10 用語集との 1:1 対応) を機械検証する。

### §10.3 SSoT 参照

- ユビキタス言語: L0 `docs/governance/ut-tdd-agent-harness-concept_v3.1.md §10 用語集`
- Bounded Context: L0 §2.5 9-mode ecosystem **+ 画面要求 3 カテゴリ Bounded Context (PM / HM / GD、X1=a 採用 2026-05-28)**
- 業界標準整合: L0 §11 参考文献
- entity 独自定義禁止: `ut-tdd plan lint` (sub_doc=business 時) で機械検証

### §10.3.1 画面要求 3 カテゴリ Bounded Context (X1=a / PO 承認 2026-05-28)

画面要求は以下 3 カテゴリで bounded context を分離する (DDD 整合、screen sub-doc §6 と整合):

| カテゴリ | 性質 | 主ペルソナ | データ源 |
|---------|------|----------|---------|
| **PM** (Project Management) | 動的 (案件遂行) | PO | `.ut-tdd/` runtime state (plan/gate/phase/handover/trace) |
| **HM** (Harness Management) | 動的 (harness 改善) | harness 運用者 | `.ut-tdd/` audit/event (invocation_log/failure_log/detector_runs) |
| **GD** (Guide & Docs) | 静的 (知識ベース) | 新規参画者 + 全ペルソナ参照 | `docs/` markdown 配下 |

カテゴリ間 deep-link は許容するが、各カテゴリの責務 (entity / 用語 / state 参照範囲) は混在させない。詳細は screen sub-doc §6 参照。

> **L2 必須実施判定 (2026-05-28 PO 指摘で修正、A-37 反映)**: ut-tdd は dashboard (15 画面 PM/HM/GD) を持つ「**UI を持つ be**」のため、drive=be であっても L2 画面設計 3 sub-doc (画面一覧 / 遷移 / UI 要素) は必須実施。wireframe (High-Fi モック) のみ省略可 (Low-Fi で代替、High-Fi は L10 UX refinement)。旧 concept §3.7「be (BE-only) = L2 全 skip 可」を撤回し、BE-only (UI 完全不在) と「UI を持つ be」を区別する規約に修正済。画面要求の機械検証義務は drive 非依存。

> **G1-trace 機械検証連動 (2026-05-28 PO 承認、DD1=a / DD2=a、A-38 反映、2026-06-02 BR-22 fullback 更新)**: 業務要求 (BR/UX/BR-21/BR-22) と画面要求 (PM/HM/GD-NN) の双方向 trace 整合は G1 内 sub-gate「G1-trace」で機械強制する (requirements §1.10.H 参照)。検証ルール 4 件: R1 (BR/UX → 画面、13 件 block) / R2 (画面 → BR/UX/FR-L1、15 画面 block) / R3 (FR-L1 P0 → 画面、19 件 block / P1-P2 warn) / R4 (screen sub-doc `requires` 整合、warn)。SSoT: screen §5 trace マトリクス。**2026-06-22 PM-06 設計書ビューア追加で R2 対象 15 画面**。lint: `ut-tdd plan lint --gate G1-trace`。

### §10.4 skill / detector entity 参照注記 (B9=c)

業務 entity §10.1 への entity 追加はしない (B9=c 採用)。skill / detector は以下の FR により機能要件として定義される:

| 概念 | entity 追加 | 参照先 FR |
|------|------------|---------|
| skill (SKILL_MAP / スキル推奨) | 追加なし | FR-L1-12 (skill 評価・推奨) |
| detector (drift / degrade 検出器) | 追加なし | FR-L1-08 (drift 検知) / FR-L1-18 (trace 整合検出) |

L3 FR sub-doc で FR-L1-12/08/18 の詳細仕様を確定する際に、skill / detector の構造要素が必要な場合は L4 データ設計 sub-doc で値オブジェクトとして扱う (entity 昇格の要否は L4 判断)。

**A-52 audit I-03 + M-01 補足注記** (2026-05-28、source process reference db-integration / observability-metrics 由来):

| 概念 | entity 追加 | 参照先 / L4 carry |
|------|------------|---------|
| `invocation_log` / `detector_result` / `gate_evidence` | 追加なし (§10.1.1 acceptance_criterion 系と同列の L3 由来 entity 候補) | observability-metrics.md / FR-L1-20、L4 データ設計で値オブジェクト確定候補 (Phase A) |
| `code_catalog` / `command_catalog` | 追加なし (FR-L1-06 6 種 registry の一部) | db-integration.md 本線 DB 6 種、L4 データ設計で値オブジェクト候補 (AST/FTS5 設計判断は ADR-001 better-sqlite3 検討必要時に判断) |

## §11 BR-21 AI 実行成果の継続評価と改善サイクル

| 属性 | 値 |
|------|-----|
| **ID** | BR-21 |
| **優先度** | P2 (Phase B 中心) |
| **実装フェーズ** | Phase B (UT-TDD 独自 runtime 整備後) |
| **L3 carry** | FR-L1-36 / FR-L1-38 / FR-L1-43 の詳細化を L3 FR sub-doc へ forward carry |
| **PO 承認** | 2026-05-28 (F2=a 採用) |

### §11.1 業務目標

UT-TDD Agent Harness が AI 実行品質を自律的に評価・改善するサイクルを持つ。個別 AI 委譲の成否を蓄積・分析し、skill 推奨精度・model 選択基準・PoC 成功率を継続的に向上させる。これにより、チームが AI 委譲を繰り返すほど harness が賢くなる「学習する基盤」を実現する。

### §11.2 構成要素 (L3 FR 詳細化予定)

| FR ID | 概要 | Phase |
|-------|------|-------|
| **FR-L1-36** | skill 評価: 各 PLAN の skill 推奨精度を計測し、推奨 → 実用 ↔ 乖離を記録・フィードバック | Phase B |
| **FR-L1-38** | model 評価: AI 委譲時の model 選択結果と成果品質を対応付け、model 選択ガイダンスを改善 | Phase B |
| **FR-L1-43** | PoC 計測: Discovery ワークフローの仮説→契約化成功率・打ち切り判定精度を計測し PoC 設計を改善 | Phase B |

### §11.3 業務的根拠

- AI 委譲の品質は一回限りの設定で固定されず、実行ログから継続改善が必要 (concept §2.1.2.1 / requirements §7.8.7)
- D-07 (AI 委譲時間率 ≥ 70 %) を達成・維持するには、委譲品質の可視化と改善ループが不可欠
- skill / detector entity 参照注記 (§10.4) と連動し、FR-L1-12/08/18 の実績データを評価入力とする
