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
