# Session Handover — 2026-06-02b (GitHub/CI 統合の要件化 + session-log を Add-feature 全ライフサイクルで dogfood)

> 前 handover (`session-handover-2026-06-02.md`) の続き。本 session は PO の連続指摘に沿って **(1) 駆動モデルの連携/右腕/PLANルール/GitHub運用の監査と是正**、**(2) GitHub/CI 統合を製品要件として正本化 (§6.8/§6.9)**、**(3) concept §3.1.5 を右腕差し戻し L8-L14 に正本化**、**(4) session-log 機能を Add-feature 標準ライフサイクル (L6→L7→Reverse→L3) で 1 サイクル完走**、**(5) Add-feature ワークフロー自体を改善**した。

## §0 現在地 (一言)

HEAD = `fb1d2d6`、main clean (untracked 2 件 `helix-process/` `ai-agent-harness-directory-reference.md` は維持)。**typecheck 0 / 全回帰 78 pass / 自作ファイル biome clean**。session-log 機能 = ① 設計 + ③ テスト設計 + ② 実装 + ④ テスト + hook 配線 + L3 要件 back-fill まで揃い、**Add-feature 経路 B (bottom-up build → Reverse fullback) を実機能で dogfood 実証**。git/CI 統合は requirements §6.8/§6.9 で要件化済 (TL 代替レビュー GO)。

## §1 本 session 進捗 (時系列)

1. **駆動モデル連携 監査** (chaining audit WF 24 agents、88 edge、3 confirmed): reciprocal 非対称 3 件 (Retrofit→Reverse / Incident→Discovery / Research→Discovery) を補記。ケーススタディ皆無は spike 意図的先送りと確定 (`af60e6c`)。
2. **右腕/テスト戻し/PLANルール 監査** (verify WF、6 confirmed): L11 戻しの schema 矛盾 (add-design L1 不可) 是正 + L13/L14 戻し欠落補完 (`9bc6f11`)。kind×layer ガード未強制を PO 判断へ。
3. **GitHub 運用 統合 監査** (verify WF): 当初 3 候補は「補助2軸の意図的分離」で棄却、critic が真のギャップ (freeze↔PR / mode↔branch 接続未記述) を発見。
4. **§6.8 PLAN git ライフサイクル + §6.9 CI 起動単位/コスト 新設** (`b470c3c`、検証指摘解消 `701fb7f`): Issue 起点スパイン / CI アンカー=G7 / 無料枠対応 / single harness-check aggregator。`github_issue_id` schema 追加。TL 代替 (code-reviewer + pmo-tech-docs) GO-with-fixes 反映。
5. **concept §3.1.5 を右腕差し戻し L8-L14 に正本化** (`f40988f`、REVERSE-01 R2-R4): spike から正本へ巻き取り。
6. **session-log 機能 (Add-feature)**: add-design L6 (`2801a93`) → ワークフロー改善 (`84f4787`) → add-impl L7 (`cac0814`) → Reverse L3 back-fill (`fb1d2d6`)。各段で code-reviewer self-review (cross-agent 不在記録)。

## §2 本 session で確立した概念 (再発防止のため明記)

- **harness 開発 (今の作業 = 個人/solo/main 直) と harness 利用 (チーム/branch-default §6.5 Phase 0-B) は別レイヤー** ([[feedback_harness_dev_vs_harness_usage]])。branch-default は製品が利用者に課す仕様、自分の dev 手順に流用しない。
- **Issue = 問題起点スパイン** (§6.8.1): Forward も発注元 Issue 起点。問題/signal → Issue → mode → PLAN → branch → PR+CI → merge+close。1 Issue=1 PLAN/hub=1 branch。
- **CI アンカー = G7** (§6.9): ローカル hook=安価高頻度 / GitHub Actions=高価バッチ。設計=hub 完了 1 回 / 右腕=post-merge / poc=非 CI。**workflow paths フィルタ禁止 (pending 永久ブロック) → 単一 harness-check + job if + dorny/paths-filter**。Merge Queue 不採用 (Free private 不可)。
- **Add-feature = 最頻 mode。標準ライフサイクル = bottom-up build (L6 機能設計 → L7 実装) → Reverse fullback で L3 要件 back-fill** ([[feedback_addfeature_bottomup_reverse_backfill]]、add-feature.md §1.1 経路 B)。
- **session-log = fail-OPEN** (agent-guard の fail-close と対)。settings.json の session-log hook に **blockOnFailure を付けない**。現在 active hook = 2 種 (agent-guard fail-close + session-log fail-open)。
- **PLAN 完了時 handover 必須** (§6.8.5、PO): PLAN サマリ/成果物/Next Action/carry/未了 PO 判断/壊さない注意。session-log の PLAN ダイジェストを入力に。1 セッション/駆動サイクル単位で束ねて可。
- **進捗管理 = 3 層 (log + handover + state DB) の組合せ** (§6.8.6、PO): **state DB**=今どこまで (機械 SSoT、孤児0/coverage、doctor/vmodel lint) / **log**=どう進めたか (session-log digest、fail-open) / **handover**=次どうするか (§6.8.5、durable)。session-log digest が log→handover 橋渡し + DB 登録トリガの結節点。
- **fr-registry-audit は FR 46 件を固定検証**。機能追加の back-fill は新 FR を起こさず既存 FR に `※ extended` で吸収する (living FR registry §1.10.G.10)。新 FR を足すと件数宣言 + audit + test を同時更新要。

## §3 Next Action (順序付き)

| # | action | 状態 |
|---|--------|------|
| 1 | **PLAN-REVERSE-02 R3 検証 (PO)**: 新 FR 不要の判断 / L1 FR-L1-07 拡張が L1↔L14 pair freeze 再要否 / AC-FR-07-04 ↔ L12 受入テスト設計の接続 (孤児 AC なきこと) | ⬜ PO escalation (self-review GO 済) |
| 2 | **kind×layer ガード強制** (design/impl 等の上限 layer、`kind=design,layer=L12` を弾く) | ⬜ 既存 PLAN 全件 migration 確認 + PO 判断必須 ([[project_kind_drive_matrix_not_enforced]]) |
| 3 | **repo 既存 biome 負債** (cli.ts useTemplate / detect.ts useLiteralKeys / g3-trace.ts unused / frontmatter.ts format 等、本 session 変更外) | ⬜ 別 Refactor PLAN (improvement-backlog)。`npm run lint` が現状 red |
| 4 | **session-log carry** (PLAN-L7-01 §8): commit hash 実取得 / session_id 欠落時 uuid fallback / M-4・M-5 コメント | ⬜ G7 後保守 |
| 5 | **concept §3 (経路3 Add-feature) の標準ライフサイクル正本化** (add-feature.md spike → concept) | ⬜ Reverse carry |
| 6 | **G8-G14 ゲート機械化** (概念定義のみ、既知 deferred) | ⬜ 別 PLAN |
| 7 | **handover-at-completion + 3 層進捗管理の詳細設計** (handover artifact schema + session-log digest→handover 自動生成、§6.8.5/§6.8.6 を実装に落とす) | ⬜ follow-up PLAN (session-log Add-feature 拡張候補)。現状は §6.8.5/§6.8.6 が binding rule + 本 handover が構造テンプレート |

## §4 ⚠ 壊さない / 再発させない

- **session-log hook は fail-OPEN**。settings.json で blockOnFailure を付けない。判定本体 `src/runtime/session-log.ts`、shim `.claude/hooks/session-log.ts`、出力 `.ut-tdd/logs/` (gitignored)。hooks は session 開始時ロード = 次 session から発火。
- **harness 開発は solo main 直**。製品の branch-default を自分の作業に適用しない (§2)。
- **新機能 = Add-feature** (kind=add-design/add-impl、parent 必須、drive=親一致)。Forward 新規 design/impl ではない。L6 機能設計から着手 → Reverse で L3 へ戻す。
- **fr-registry-audit 46 件固定**。back-fill は既存 FR 拡張で (§2)。
- **docs/process/* は PROVISIONAL SPIKE**。規範変更は正本 (concept/requirements) 先行 → spike へ下ろす。
- **TL = Codex は Windows で 8009001d 不可** → code-reviewer (設計/実装) + pmo-tech-docs (技術裏取り) を TL 代替に使い、cross-agent 不在を記録 ([[feedback_ts_native_over_helix_cli]])。
- **self-review 前置 MUST** (PO escalation 前) / **subagent model 明示** / commit footer = `Co-Authored-By: Claude Opus 4.8 (1M context)`。untracked 2 件は commit 禁止。

## §5 本 session commit (時系列、全 main)

- `af60e6c` fix(process): 連携パターン reciprocal 3 件 + REVERSE-01 §2.3
- `9bc6f11` fix(process): 右腕テスト戻し 2 件 + 右腕/git 統合監査 §2.4
- `b470c3c` feat(governance): §6.8 PLAN git ライフサイクル + §6.9 CI 起動単位/コスト
- `701fb7f` fix(governance): §6.8/§6.9 検証指摘解消 (引用帰属 + aggregator 整合)
- `f40988f` docs(governance): concept §3.1.5 を右腕差し戻し L8-L14 正本化
- `2801a93` feat(design): session-log L6 機能設計 (add-design ①③)
- `84f4787` feat(process): Add-feature 標準ライフサイクル codify
- `cac0814` feat(runtime): session-log 実装 (add-impl ②④ + hook 配線)
- `fb1d2d6` feat(reverse): session-log を L3 要件へ back-fill (Add-feature 経路 B 完結)
- (memory) `feedback_harness_dev_vs_harness_usage` / `feedback_addfeature_bottomup_reverse_backfill` 追加

## §6 未了の PO 判断事項

1. **PLAN-REVERSE-02 R3** (上記 Next Action 1)。
2. **kind×layer ガード強制** の可否 + 既存 PLAN migration (Next Action 2)。
3. (継続) §6.9 右腕 CI 失敗→差し戻し Accept 時間窓の精緻化 / signal→Issue 自動 (webhook) 化 (Phase 0 は手動 default)。
4. (継続) HELIX 離脱 (cutover) タイミング。
