---
memory_id: memory:project:u-1-diagnosis-the-disk-growth-engine-is-the-unfiltered-ingestion-in-stop-refresh-not-only-per-turn-rows-plan-l7-454-already-owns-both-source-files
kind: project
title: "U-1 diagnosis: the disk growth engine is the unfiltered ingestion in stop-refresh, not only per-turn rows; PLAN-L7-454 already owns both source files"
tags: ["issue-178", "p0", "plan-l7-454", "repo-scope", "token-telemetry", "u-1"]
updated_at: 2026-08-19T09:32:29.198Z
---

U-1 (issue #178 / PLAN-L7-454) の診断結果と修正契約。Opus が実装前に不変条件を固定するための正本。exact main HEAD 39846e948bfd75570f95bd42e96237a50533833e、2026-08-19 実測。

## 診断: 根因は「turn 単位の行」だけではなく **ingestion path の契約不一致** だった

Task Pack (project-p0-task-pack-...) では「projectTokenUsage が turn ごとに 1 行書く」を根因としたが、追加実測で**より上流の分岐**が判明した。repo には token ingestion の経路が 2 系統ある:

1. **repo-scoped 経路** — `projectRepoScopedTokenUsage` (src/state-db/projection-writer.ts:742)。`loadRepoScopedRuntimeSessionUsage` を使い「**この repo に帰属する session usage のみ**」(Claude project-slug ディレクトリ / Codex session cwd フィルタ) を取り込む。doc comment に issue #82 / PLAN-L7-454 と明記されている。
2. **無フィルタ経路** — `loadRuntimeSessionUsage({claudeDirs:[~/.claude/projects], codexDirs:[~/.codex/sessions]})` を直接呼ぶ 3 箇所:
   - `src/state-db/stop-refresh.ts:97` → 直後に `openHarnessDb(defaultHarnessDbPath(repoRoot))` = **on-disk の .ut-tdd/harness.db へ書く**
   - `src/doctor/db-projection.ts:171` → `openHarnessDb(":memory:")` へ書く (ディスクは太らせないが毎回 2,374 ファイルを走査する固定費を払う)
   - `src/cli.ts:1852` → CLI ingest 経路

**ディスク 4.73GB の書き手は stop-refresh の無フィルタ経路**である。Stop hook が発火するたびに、マシン上の全 Codex/Claude session (repo 無関係を含む) の全 turn を on-disk DB へ投入している。実測の内訳 (codex 7,957,038 行 / 単一 rollout ファイルで 24,155 行 / 走査対象 2,374 ファイル) はこの経路の帰結。

つまり **PLAN-L7-454 が定めた repo scope 契約が、stop-refresh 経路では守られていない**。集約 (C-1) だけを入れても、無フィルタのまま集約すれば「他 repo の session 集約行」が入り続ける。

## 不変条件 (U-1 の受理条件)

1. **repo scope**: on-disk DB へ入る token 行は、この repo に帰属する session のみ。無フィルタ経路から on-disk DB へ書かない。
2. **有界性**: 行数は (repo 帰属 session 数 × model 数) で上界が決まる。turn 数に比例しない。
3. **分析価値の保存**: runtime / model / session 単位の合計 (input/output/cached/reasoning tokens, cost_usd) が引ける。
4. **既存 gate を壊さない**: `drive-db-registration` の `modelRuns > 0` (src/lint/drive-db-registration.ts:94)、`db-telemetry-provenance` の `runtime_rows` / `valued_rows` > 0 (src/doctor/db-projection.ts:141-162、token 列が非 NULL の行数で判定) を維持する。集約行も token 列を非 NULL で持つこと。
5. **非破壊**: 既存 DB を DELETE/DROP しない (U-3 の退避+rebuild で扱う)。

## 修正契約 (U-1)

- **C-1a**: `projectTokenUsage` は `(runtime, sessionId, model)` 単位の集約行を書く。run_id = `token-run:<runtime>:<sessionId>:<model>` (Task Pack の指定どおり)。turnIndex を id に含めない。token 4 列と cost_usd は同一キー内で合算する。
- **C-1b**: `stop-refresh.ts:97` の無フィルタ呼び出しを **repo-scoped 経路へ差し替える**。on-disk へ書く経路は `projectRepoScopedTokenUsage` (または同等の repo scope フィルタ) のみとする。
- **C-1c**: `role="session"` / `plan_id=""` / `started_at=""` の現行意味論は変更しない (PLAN-L7-192 が telemetry provenance を所有しているため、provenance の意味論には触れない)。
- **C-1d**: 回帰テストで固定する — (a) 同一 session の複数 turn が 1 行に集約されること、(b) 別 model は別行になること、(c) rebuild 後に旧 turn 行が消えること、(d) 集約行の token 列が非 NULL で合計値が正しいこと、(e) repo 外 session が on-disk 経路で取り込まれないこと。

## 所有 (重複宣言を避けるための実測)

`src/state-db/token-tracker.ts` の owner は PLAN-L7-256 / L7-415 / L7-430 / **L7-454** / L7-57 / L7-58。`src/state-db/projection-writer.ts` の owner は 45 PLAN (baseline 免除側) で **L7-454 を含む**。

→ **PLAN-L7-454-runtime-token-telemetry-ingestion が両ファイルを既に所有している**。U-1 は **L7-454 を拡張**して実装し、**新規 PLAN を作らない / generates に既存 path を追加しない**。2026-08-19 に #338 で 2 回、#339 で 1 回、duplicate-artifact-ownership で CI が赤化した原因がこれ。`src/state-db/stop-refresh.ts` を触る場合は同様に既存 owner を確認してから。

## 実装ルーティングと順序

実装 = **gpt-5.6-luna** (明示ルーティング)。Opus は実装しない。PR は 1 件、merge 禁止、exact HEAD CI Green + Claude 非著者 closing PASS まで止める。U-2 (上限/typed error)、U-3 (退避/rebuild)、#340 (snapshot 固定費、既に merge 済み)、Forward FSM/R3/R4 は混ぜない。

## before 実測 (after と比較する基準)

model_runs 総行数 7,985,466 / plan_id 空 7,984,539 / distinct run_id 7,985,466 (重複なし) / DB 4,734,074,880 bytes / 走査対象 ~/.codex/sessions の .jsonl 2,374 個。再現コマンドは Task Pack に記載済み (readOnly)。
