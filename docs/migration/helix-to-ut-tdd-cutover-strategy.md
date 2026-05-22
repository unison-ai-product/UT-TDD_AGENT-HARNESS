# HELIX → UT-TDD Cutover Strategy

Date: 2026-05-22
Status: draft（PLAN-001 起票時に確立）
Owner: PM (Opus) + PO (ユーザー)

## 目的

UT-TDD Agent Harness は HELIX を移植元として切り出すが、初日から `ut-tdd` CLI / `.ut-tdd/` state で開発を回せるわけではない。本書は **porting 期間中の運用モデル** と、**wave 単位で HELIX 設定を UT-TDD 版へ差し替えて検証していく合流プロセス** を正本として定義する。

`extraction-plan_v0.1.md` が「**何を**差し替えるか」を定義するのに対し、本書は「**どう** project を運用しながら **段階的に** 合流させるか」を定義する。

## 三層モデル

UT-TDD repo の状態は同時に 3 つの層で進む。

| 層 | porting 開始時 | wave 進行中 | full cutover 後 |
|---|---|---|---|
| **drive runtime** (PM / TL / SE 委譲) | `helix codex` / `helix claude` / `helix plan` / `helix gate` を使う | 同左、変更なし | `ut-tdd codex` / `ut-tdd claude` / `ut-tdd plan` へ機械置換 |
| **artifact ownership** (実装コード / テスト / template) | `vendor/helix-source/` に全部ある | wave ごとに `src/ut_tdd/` 等へ port、両方並存 | `src/ut_tdd/` のみが正本、`vendor/helix-source/` は historical reference |
| **state layout** | `.helix/` のみ存在 | `.helix/` と `.ut-tdd/` が並存（重複ではなく責務分担） | `.ut-tdd/` のみ、`.helix/` は ignore |

**重要**: 3 層は **同時に切替えない**。drive runtime（PM 委譲経路）が最後まで `helix` のまま動き続けても問題ない。先に artifact と state を UT-TDD 側で安定化させ、最後に runtime を切替える。

## 運用モード（4 段階）

```
Mode 0: HELIX-only        ← repo 初期化直後（現在）
Mode 1: HELIX-drive + UT-TDD-asset  ← wave port が進行
Mode 2: UT-TDD-drive (smoke) + HELIX-fallback  ← cutover 試行期
Mode 3: UT-TDD-only       ← full cutover 完了
```

### Mode 0: HELIX-only

- PM / TL / SE は `helix` CLI を使う
- `vendor/helix-source/` に全 asset がある
- `.helix/` runtime state を使う（gitignore）
- UT-TDD 側の所有コードは存在しない

**Exit 条件**: 最初の wave PLAN（PLAN-001 = W1）が finalize された時点。

### Mode 1: HELIX-drive + UT-TDD-asset（porting 期間の本体、現在）

- **PM 委譲導線は `helix` CLI 継続**: `helix plan` / `helix codex --role se` / `helix gate` / `helix handover`
- **wave ごとに asset を port**: `vendor/helix-source/cli/lib/plan_*.py` → `src/ut_tdd/plan_*.py` のように UT-TDD-owned tree へ複製＋adapt
- **port した asset は wave 単位で smoke 検証**: `python -m pytest src/ut_tdd/tests/...` で port 直後に独立テスト pass を確認、ただし **runtime としては HELIX 版を使い続ける**
- **state は `.helix/` + `.ut-tdd/` 並存**: HELIX 用に `.helix/plans/` / `.helix/helix.db` を維持、UT-TDD 用に `.ut-tdd/cache/`, `.ut-tdd/state/` を立てる（ただし W6 まで実体は空）

**Exit 条件**: W1-W6（PLAN/V-model lint + task routing + handover + setup/doctor）が UT-TDD-owned で smoke 通過し、`ut-tdd` CLI shim が起動できる状態。

### Mode 2: UT-TDD-drive (smoke) + HELIX-fallback（cutover 試行期）

- **新規 PLAN は `ut-tdd plan draft` で起票**、`helix plan` は legacy PLAN メンテのみ
- **既存 PLAN は HELIX 流のまま完了させる**（rebase コスト回避）
- **`ut-tdd` CLI が失敗したら `helix` CLI へ手動 fallback**、不具合は別 PLAN で修正
- **state**: 新規 wave 以降は `.ut-tdd/` のみ書込、`.helix/` は read-only 化
- **CI**: GitHub Actions `harness-check` が `ut-tdd doctor` を使う

**Exit 条件**: 連続 N 個（例: 5）の PLAN が `ut-tdd` 単独で finalize → commit まで通る + Windows / POSIX 両方で CI green。N の値は run-time で判断（最低 5）。

### Mode 3: UT-TDD-only（full cutover 完了）

- `helix` CLI への依存ゼロ
- `vendor/helix-source/` は historical reference として残すが runtime から参照しない
- `.helix/` は gitignore + ローカル削除可
- 本書は `cutover_complete: <date>` 記録だけ残して凍結

## Wave 単位の swap-and-verify サイクル

各 wave（W1-W17、`helix-porting-map.md` 参照）は以下のサイクルで合流させる:

```
Step 1: PLAN-NNN を helix plan draft で起票（HELIX 流）
Step 2: Codex TL レビュー → finalize（HELIX 流）
Step 3: Sprint .1 で vendor 該当 module の構造調査
Step 4: Sprint .2-.5 で src/ut_tdd/ へ port + 単体テスト
Step 5: 【swap】 port した UT-TDD 版を smoke 起動（CLI / API レベル）
Step 6: 【verify】 HELIX 版と同等の出力 / exit code であることを確認
  - 完全等価が無理なら「差分の理由 + 受容判断」を PLAN §6 に記録
Step 7: 【integrate】 `.claude/settings.json` / `.github/workflows/*` 等の runtime config を UT-TDD 版へ書き換え（該当 wave 内のみ、他 wave 影響なし）
Step 8: Sprint .8 で 1 commit、wave 完了
```

**Step 7 = 部分 cutover**: 各 wave で必要な範囲だけ runtime config を差し替える。例:
- W1 完了時: `.claude/settings.json` の plan-lint hook を `ut-tdd plan lint` に切替
- W2 完了時: vmodel-lint hook を `ut-tdd vmodel lint` に切替
- W6 完了時: `ut-tdd doctor` / `ut-tdd status` を CI で使い始める
- W7 完了時: Claude Code hook 一式を UT-TDD 命令に切替

各 wave の Step 7 はその wave の DoD に含める（PLAN §5 受入条件）。

## 例外と fallback

### asset 移植失敗時

- 該当 wave の PLAN を `status: blocked` に戻し、escalate
- HELIX 版 asset / runtime config を残したまま次の wave へ進む（並行 port 可）
- 別 PLAN-NNN-b として fix wave を起票

### Mode 2 で UT-TDD CLI が落ちる

- 該当 CLI の bug-fix wave を最優先で起票
- 不具合中は `helix` CLI を引き続き使用（HELIX-fallback）
- fallback を 2 週間以上引きずる場合は Mode 2 → Mode 1 へ巻き戻す

### 認証 / 決済 / PII / ライセンスに触れる移植

- 必ずユーザー（PO）承認を取る
- `extraction-plan_v0.1.md §禁止事項` + `requirements_v1.1.md §禁止事項` に従う
- destructive な data 操作 / rollback 困難な変更は cutover サイクルから外す

## 観点別の運用

### PM (Opus)

- porting 期間中: HELIX 流の PLAN-NNN + `helix plan` + `helix codex --role se` で委譲
- Mode 2 以降: 新規 PLAN は `ut-tdd plan` を試し、失敗したら `helix plan` に手動 fallback、bug を別 PLAN で fix
- Mode 3: `ut-tdd plan` のみ

### TL (Codex gpt-5.5)

- porting 期間中: `helix plan review` で HELIX 流のレビュー
- Mode 2 以降: `ut-tdd plan review`（実装後）に切替
- レビュー観点は wave ごとに「HELIX 版との等価性」を必ず含める

### SE / PE (Codex gpt-5.4 / gpt-5.3-spark)

- 実装中: `helix codex --task-file <path>` 経由（Windows sandbox 対策）
- 実装対象は **常に `src/ut_tdd/` 配下**（vendor を直接編集しない）

### PMO (Claude subagent)

- general-purpose / Explore / code-reviewer を活用（HELIX PMO subagent はこの repo では未登録）
- 各 wave Sprint .1 の調査は subagent 委譲が default

### CI / GitHub Actions

- 初期: HELIX 流の `.github/workflows/harness-check.yml` は **未設定**（W8 で構築）
- W8 完了で `ut-tdd doctor` + cross-platform smoke を required check 化

## 関連ドキュメント

正本:
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md` — 何を差し替えるか
- `docs/migration/helix-porting-map.md` — wave 単位の source/target 対応表
- `docs/migration/helix-source-inventory.md` — vendor snapshot 棚卸し
- 本書 — **どう運用するか / どう合流するか**

runtime policy:
- `CLAUDE.md` — Claude Code project context
- `.claude/CLAUDE.md §HELIX オーケストレーションルール` — porting 期間中の Claude runtime 委譲ルール
- `AGENTS.md` — Codex CLI project rules

## 改訂履歴

- 2026-05-22: 初版作成（PLAN-001 起票時、ユーザー指摘で repo doc 化）
