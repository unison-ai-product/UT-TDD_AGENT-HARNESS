# HELIX v2 Import Ledger — 採択 / 保留 / 見送り の軌跡

> 目的: HELIX v2 (helix-workflows を L0→L1 で dogfooding した更新分) から UT-TDD へ**何を取り込み / 後段に回し / 見送ったか**を 1 本で追跡する採択台帳。
> 由来: `RetryYN/ai-dev-kit-vscode` `origin/main` (2026-05-28 時点)。v2 docs = `docs/v2/L0-helix-workflows/concept.md` / `docs/v2/L1-REQUIREMENTS.md` / `docs/v2/L1-requirements/*` / `docs/plans/L0,L1/*`。
> 起票: 2026-05-28 (session 28a)。本台帳自体が v2 の「移行 PLAN = 採択軌跡を残す」パターンの dogfood。
> 注: HELIX は PLAN を**日本語ファイル名**で管理するが、UT-TDD は Windows 文字化け回避で**英語ファイル名のみ** ([[memory: filename-english-only]])。取り込み時に翻訳する。

## 0. 取り込み方針

v2 は HELIX 自身を「プロダクト」として L0→L1 要求定義した内容で、UT-TDD の self-dogfooding と構造が同型。**設計概念のみ**取り込み、HELIX の実装 (Python/bash/helix.db/SQLite) は port せず ADR-001 (TS/Bun) で必要時に作り直す。W-model 規律を最優先し、confirmed L1 は G1 凍結前の今だけ安く拡張する。

## 1. 採択 (adopted — 本 session で正本へ反映済 or 反映中)

| # | 取り込み項目 | 反映先 | status |
|---|---|---|---|
| A-1 | **デグレ禁止** (上流変更が下流の対応を伴わず通るのを防ぐ。3 軸 = 上流→下流 ID 追随 / balance_ratio regression / trace 切れ) | L1 **BR-07** (draft) | 反映済 (機構は L3/L4 送り) |
| A-2 | **doc 品質の継続レビュー** (doc 専用 read-only reviewer = doc-reviewer、pmo-sonnet と責務分離) | L1 **BR-08** (draft) | 反映済 (role 定義は L3 FR) |
| A-3 | **実装宣言の真実性** (設計 doc の CLI/file/schema に implementation_status 列必須、机上宣言禁止) | L1 **NFR-08** (draft) | 反映済 (必須フォーマットは L3+ 全 doc) |
| A-4 | **subagent guard の機械強制** (許可リスト + model 明示 + override 禁止、fail-close) | `.claude/hooks/agent-guard.ts` 他 (commit `30a9299`) | **実装済**。HELIX bash+python3 を環境非依存 TS に再生 |
| A-5 | **subagent 定義の model frontmatter 必須** | `.claude/agents/*.md` (既存 19 件、全件 model 設定済) | 確認済。Opus 継承事故の構造的防止 |

### L0→L1 PLAN 作法 (process、本 session 以降の起票に適用)

v2 の L0→L1 進め方から、UT-TDD の PLAN 起票方法へ取り込む差分 (現行 PLAN-L1-01 = 単一 elicitation PLAN との比較):

| # | v2 パターン | 適用方針 |
|---|---|---|
| P-1 | **L1 を関心別に複数 PLAN 分割** (業務/機能/非機能/技術) + 業務先行→残り並列起票 | L3 以降の PLAN を関心別に分割し、ロール責務と並列化を明示する |
| P-2 | **工程間移行 PLAN を独立起票** (L0 baton を採択/保留/見送りに仕分けた軌跡を記録) | 本 ledger がその役割。今後の工程移行でも軌跡 PLAN を残す |
| P-3 | **frontmatter `pairs_test_design` に L14/L12 doc パスを列挙**して pair freeze を機械宣言 | 次の運用テスト設計 PLAN から PLAN frontmatter に pair を明記 |
| P-4 | **L0 concept §8 に「バトン (L1-IN-*)」節**を内蔵 (確定/未決を構造化して L1 へ引き渡し) | concept_v3.1 に L0→L1 baton 節を追補 (別 todo) |
| P-5 | **工程表に review Step を固定** (tl-advisor/self-review = gate evidence) | PLAN §工程表に self-review Step を明示 (self-review 前置ルールと整合) |

## 2. 保留 → forward (後段の工程で要求化・設計する)

| # | 項目 | 送り先 | メモ |
|---|---|---|---|
| F-1 | **並列エージェント・オーケストレーション** (タスク依存分解 → 最大 8 スロット並列ディスパッチ + 稼働チェック) | **L3 FR** | ハーネス中核機能。現状は .claude/CLAUDE.md の散文ポリシー + PM 手作業のみ (機械実装なし)。concept §2.6 配線 / requirements §7.8 に連結。PO 判断 = 「L3 要求化のみ」(2026-05-28) |
| F-2 | **machine / AI gate 判定分離** (static_subchecks は AI ゼロ、AI は設計判断のみ) | **L3/L4** | `ut-tdd doctor` / gate 設計の基本方針として参照 |
| F-3 | **balance_ratio 量閉じ性** (test_count / design_count ≥ 1.0、孤児テスト 0) | **L3/L12** | BR-07 ratchet の計測軸。要件-テスト対応に限定適用が現実的 |
| F-4 | **Reverse Gateway 整流** (Non-Forward 成果を正本へ直接書かず closure pipeline 経由) | **L2/L4** | 将来 Reverse/Incident mode 追加時の設計参考。現行は Forward/Scrum のみ |
| F-5 | **doc-reviewer role の実体** (model/召喚 trigger/coverage 監査) | **L3 FR** | BR-08 の下流 |
| F-6 | **implementation_status 必須フォーマット**の全設計 doc 適用 | **L3 以降の doc 規約** | NFR-08 の下流 |

## 3. 見送り (rejected — 現時点の規模・方針に合わない)

| # | 項目 | 見送り理由 |
|---|---|---|
| R-1 | **6 db 分離 + Event Sourcing** (helix.db 50+ table) | UT-TDD は SQLite すら未導入。現行ファイルベース state (`.ut-tdd/`) と規模が合わない。BR-06 ダッシュボードの DB 要求と合わせて L2/L4 で再検討 |
| R-2 | **9 mode 入口判定 + Bounded Context 10 分割 (DDD)** | 現行は Forward/Scrum の 2 mode のみ。BC 分離は複雑化が先走る。mode 追加時に再検討 |
| R-3 | **G1 conditional_approve (TL 経由の軽量承認)** | UT-TDD は PO=ユーザーが主判断者で単独 mode 主体。TL-advisor 経由の制度は馴染まない。self-review 前置で代替 |

## 4. 整合・留意

- **BR-06 ダッシュボード vs concept §8.1 軽量制約**の緊張 (既知、L2/L4 解決) は v2 の dashboard-design / helix.db と R-1 に関連。v2 の DB 設計を参考にしつつ UT-TDD は軽量を維持する判断は L2 entry。
- L1 追記 (BR-07/08・NFR-08) は **draft / G1 凍結前**。運用テスト設計 (L14 pair) で対応 OT を起こし、G1 で PO 確定する。

## 5. v2 全面構造取り込み (2026-05-28 後段、本 session 確定)

PO 指示「V モデルとモデル駆動を全部同じにしろ」を受け、v2 process docs (`vendor/helix-source/docs/v2/process/L00-L14`) + HELIX SKILL_MAP `§駆動タイプ別 L2〜L11` を **正本** として全面採用。§1-§3 の個別取り込みより上位の構造採用。

### 5.1 採択 (adopted、本 session で governance に反映)

| # | 採択項目 | 反映先 |
|---|---|---|
| **A-6** | **L1 sub-doc 構造** (業務 / 機能 / 画面 / 技術 / 非機能 の 5 sub-doc。L1 機能要求 ≠ L3 機能要件) | concept §3.1.2.1 / requirements §1.10.G / 構想書 §3.5 AP-11 |
| **A-7** | **L2-L6 sub-doc 構造** (L2=4 / L3=3 / L4=5 / L5=4 / L6=3。各 sub-doc が PLAN 単位) | concept §3.1.3.1 / requirements §1.10.G.1 / 構想書 §3.5 AP-12 |
| **A-8** | **PLAN 内蔵物原則** (PLAN = 機能 doc 単位、工程表 + 実装計画を内蔵、review Step 固定組み込み) | concept §3.6 / requirements §1.10.G.4 / 構想書 §3.5 AP-13 |
| **A-9** | **駆動別 L2-L14 挙動表** (be/fe/db/fullstack/agent × L2-L14 の中身とゲート判定。L10 要否 + L2 sub-doc skip ルール) | concept §3.7 / requirements §1.10.G.3 (drive × sub_doc 整合) |
| **A-10** | **sub_doc / skip_sub_doc frontmatter フィールド** (machine 強制) | requirements §1.10.G.2 |
| **A-11** | **L1 pair 修正** (L1 全 sub-doc ↔ L14 運用テスト設計 1 doc) | test-design/harness/L1-operational-test-design.md §0/§4 |
| **A-12** | **5 sub-doc 必須 § 構造の正本転写** (HELIX-workflows 実体 doc 4 件から各 sub-doc の §1〜§10 までを必須化) | concept §3.1.2.1 5 sub-doc 表 |
| **A-13** | **業務要求 §3.3 cross-cutting 横断機構** (interrupt / debt / drift-check / readiness) | concept §3.1.2.1 business 行 §3 |
| **A-14** | **業務要求 §6 業務スコープ外** (本 BR で扱わない FR / 画面 / 技術 / NFR / 実装の明示的除外) | concept §3.1.2.1 business 行 §6 |
| **A-15** | **業務要求 §7 L14 運用テスト pair 対応表** (BR-* ⇔ OT-* 1:1) | concept §3.1.2.1 business 行 §7 |
| **A-16** | **業務要求 §9 carry / 既知の不足 + §9.1 上流 baton carry 一覧** | concept §3.1.2.1 business 行 §9 |
| **A-17** | **業務要求 §10 業務 entity 列挙 (DDD ドメイン一覧)** + §10.1 主要業務 entity 一覧 + §10.2 L4 carry + §10.3 SSoT 参照 | concept §3.1.2.1 business 行 §10 / §3.1.2.2 / requirements §1.10.G.7 |
| **A-18** | **L0 → L1 → L4 ドメイン継承チェーン** (anti-corruption layer 原則、L1 entity は L0 用語と 1:1、独自定義禁止) | concept §3.1.2.2 (新節) / requirements §1.10.G.7 |
| **A-19** | **機能要求 §5 上流 baton 反映** (L0 企画書バトン項目と FR-L1-* の対応表 + carry 先) | concept §3.1.2.1 functional 行 §5 |
| **A-20** | **NFR §7 IPA × ISO 25010 二軸タグ表** (全 NFR-ID × IPA 大項目 × ISO 25010 特性) + §3 冒頭 carry 宣言 + §8 carry 接続記述 | concept §3.1.2.1 nfr 行 §7 |
| **A-21** | **技術要求 §4-§7** (state schema 二層構造 / 工程別 skill 注入機構 / 9 mode 共通基盤 / drift 解消方針「新規 drift 0 件 / week」) | concept §3.1.2.1 technical 行 §4-§7 |
| **A-22** | **4 doc 共通ヘッダー要素** (SSoT 参照宣言ブロック / 件数確定宣言 / L3 接続規約 / frontmatter pair_artifact + related_l0 + related_br + next_pair_freeze) | concept §3.1.2.3 (新節) / requirements §1.10.G.2 / §1.10.G.8 |
| **A-23** | **sub-doc 必須 § 機械検証 + ドメイン継承チェーン検証 + 共通ヘッダー要素検証** | requirements §1.10.G.6 / §1.10.G.7 / §1.10.G.8 |

### 5.2 派生 doc 再編 (next commit、本 ledger に予告)

A-6〜A-11 の governance 確定 (本 commit) を受け、次 commit で派生 doc を v2 構造に再編する:

| # | 再編対象 | 変更内容 |
|---|---|---|
| **B-1** | `docs/design/harness/L1-business-requirements.md` (単一 doc) | `docs/design/harness/L1-requirements/{business,functional,screen,technical,nfr}-requirements.md` の 5 sub-doc に分割。既存 BR-01〜08 / NFR-01〜08 / UX-01〜03 / Audit framework 由来 / Dashboard 由来を 5 sub-doc に再分配 |
| **B-2** | `docs/plans/PLAN-L1-01-business-requirements.md` (単一 PLAN) | PLAN-L1-01〜05 の 5 PLAN に分割。各 PLAN に工程表 + 実装計画を内蔵 (構想書 §3.6) |
| **B-3** | `docs/test-design/harness/L1-operational-test-design.md` | OT-01〜13 の trace 先を 5 sub-doc に再 reference。新規 sub-doc 由来要求の OT 追加は §3 量閉じ拡張で |

B-1〜B-3 は本 ledger 確定後に別 commit で実施。

### 5.3 v2 process L0-L14 と UT-TDD layer の整合確認 (2026-05-28)

UT-TDD concept §3 / requirements §1.4 はすでに **V2 L0-L14 + W-model + pair (L1↔L14 / L2↔L10 / L3↔L12 / L4↔L9 / L5↔L8 / L6↔L7) + G0.5-G14** を整合採用済 (v3.1 / v1.2 で完了)。本 session 追加分は **各 layer 内の sub-doc 構造 + 駆動別挙動 + PLAN 内蔵物** であり、L 番号体系自体の変更ではない。

### 5.4 9 駆動の確認

UT-TDD requirements §1.6 が定義する 9 駆動 (be/fe/fullstack/db/agent/scrum/reverse/poc/troubleshoot) は v2 HELIX SKILL_MAP の主要 4 (be/fe/scrum/fullstack) + エッジ 2 (db/agent) と整合 (poc/reverse/troubleshoot は経路 2/補助 1 専用)。**駆動 enum 自体の変更不要**、§3.7 挙動表を追加するのみで v2 取り込み完了。
