---
plan_id: PLAN-L7-365-harness-db-currency-hook
title: "PLAN-L7-365 (add-impl): harness.db on-disk currency の自動維持 + staleness gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-07
updated: 2026-07-21
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - rebuild trigger と staleness 判定の設計レビュー"
  - role: se
    slot_label: "SE - hook 駆動 rebuild + token ingest 統合 + doctor staleness"
generates:
  - artifact_path: docs/plans/PLAN-L7-365-harness-db-currency-hook.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/stop-refresh.ts
    artifact_type: source_module
  - artifact_path: src/state-db/stop-refresh-coordinator.ts
    artifact_type: source_module
  - artifact_path: tests/db-currency.test.ts
    artifact_type: test
dependencies:
  parent: docs/plans/PLAN-L5-01-physical-data.md
  requires: []
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/plans/PLAN-REVERSE-365-harness-db-currency-backfill.md
    - docs/plans/PLAN-L7-348-runtime-state-recoverability.md
    - src/state-db/projection-writer.ts
    - src/doctor/db-projection.ts
    - src/runtime/session-log.ts
    - .claude/settings.json
review_evidence:
  - reviewer: codex-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-17T15:44:00+09:00"
    tests_green_at: "2026-07-17T15:40:00+09:00"
    verdict: approve
    scope: "Stop hook 駆動 on-disk harness.db currency 維持 (Step 2 slice、issue #78)。blind review 3 ラウンド: 1st FLAG (5s hook timeout と同期 full rebuild の不両立) → detached fire-and-forget 化で是正、2nd FLAG (real spawn の非同期 error event 未処理で fail-open 契約破り) → error listener + real-spawn regression で是正、3rd PASS (レビュアー実測: listener 有り exit 0 / 無し exit 1 の real oracle 確認)。残余 (lock 競合 fail-open、Stop 毎 full rebuild コスト、親 kill 後 E2E) は実装メモに受容記録、REVERSE-365 R2 で観測。"
    worker_model: claude
    reviewer_model: gpt-5.6-sol
    green_commands:
      - kind: unit_test
        command: "bun scripts/run-vitest-snapshot.ts tests/db-currency.test.ts tests/drive-db-registration.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-17T15:40:00+09:00"
        evidence_path: tests/db-currency.test.ts
        output_digest: "sha256:31c73218fd2e6b522f274a5b1c34dd067d171f6611150007bc5a5074407b735a"
        anchor_commit: 56b93de47e671e18c57822b3fc0c25292ec91fad
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-17T15:39:00+09:00"
        evidence_path: src/state-db/stop-refresh.ts
        output_digest: "sha256:56f7c760310c89d63f0ec2b9f0b972c827b28c5945426a576d17d205efa1c702"
        anchor_commit: 56b93de47e671e18c57822b3fc0c25292ec91fad
      - kind: lint
        command: "bun x biome check src/state-db/stop-refresh.ts src/cli.ts tests/db-currency.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-17T15:39:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:fd15ec5a6ff295838b5a4ec9f8505029004875067e5ae26fa95ef8c6b79a5837"
        anchor_commit: 56b93de47e671e18c57822b3fc0c25292ec91fad
---

# PLAN-L7-365 (impl): harness.db on-disk currency の自動維持

## Status

draft 起票 (2026-07-07 DB三ループ監査。Major 所見: canonical な handover/query 面が「rebuild し忘れ」に
依存)。着手時は add-impl + Reverse pairing へ昇格 (route_mode=add-feature debt)。

## 背景

- どの workflow hook も永続 harness.db を rebuild しない。SessionStart/PostToolUse/Stop/SubagentStop は
  `.ut-tdd/logs/session/*.jsonl` への追記のみ (`src/runtime/session-log.ts`)。doctor は
  `:memory:` の使い捨て DB を rebuild する (`src/doctor/db-projection.ts`) ため on-disk は更新されない。
- `rebuildHarnessDb` (`src/state-db/projection-writer.ts`) は token/cost ingest を含まないため、
  on-disk の model_runs コスト行は `db rebuild` 後も別途 `ut-tdd telemetry scan` が必要。
- 帰結: 完全自動捕捉された session イベントですら `ut-tdd db rebuild` を手動実行するまで on-disk DB から
  queryable にならない。SessionStart takeover surface (PLAN-L7-110) は canonical な引き継ぎ面なのに
  **stale な on-disk を読む**。データ喪失は無い (JSONL + docs が source of truth、rebuild は決定的) が、
  currency を自動化・強制する機構が皆無で staleness を検出する gate も無い。
- **PLAN-L7-348** は同じ DB でも **backup/recoverability** 軸 (disaster recovery) を扱う別 PLAN。本 PLAN は
  **currency (鮮度)** 軸に限定し、references で相互参照して混同を防ぐ。

## スコープ

1. **hook 駆動 currency**: Stop (session summary) hook で on-disk harness.db を決定的に rebuild する
   (or 差分投影)。rebuild は fail-open で session 終了を妨げない。token ingest も統合し `telemetry scan`
   の別実行依存を解消する。
2. **staleness gate**: on-disk DB の投影 source (docs/plans mtime + session jsonl tail) と DB の
   `source_hash` を突き合わせ、乖離を検出する `db-currency` doctor check を追加する。
3. takeover surface / `find` / `progress artifacts` 等の DB 読取り consumer が stale を読む場合に警告する。

## 非対象

- backup / recovery ledger / recovery-probe は **PLAN-L7-348** の scope。
- projection ロジック自体の変更はしない (currency 維持のみ)。

## §3 工程表

### Step 1: rebuild trigger + staleness 判定設計 (TL) [直列]

hook rebuild の fail-open 境界、token ingest 統合点、staleness の source_hash 突合方式を確定する。
後続実装がこの契約に依存 (downstream_dependency)。

### Step 2: Stop hook 駆動 on-disk rebuild + token ingest 統合 [直列]

`session-log.ts` の Stop 経路とrebuild パイプラインの共有状態を編集するため直列 (shared_state)。

### Step 3: db-currency doctor check [並列]

on-disk DB の source_hash 乖離検出。独立 module のため並列可。

### Step 4: currency regression test [並列]

hook rebuild 後に session イベントが on-disk から queryable、rebuild 例外が session 終了を妨げない
ことを固定。別 test file のため並列可。

### Step 5: cross-runtime レビュー (pmo-sonnet / codex) [直列]

fail-open 境界と staleness 閾値、L7-348 との軸分離を別ランタイムでレビュー (downstream_dependency)。

## §3.1 実装計画

`src/runtime/session-log.ts` の onStop に on-disk rebuild + token ingest 呼出を追加 (try/catch fail-open)
→ `projection-writer.ts` の rebuild に token ingest を統合 → `src/doctor/` に `checkDbCurrency` を追加し
check-registry へ登録 → `tests/` に currency + fail-open regression を追加。Pack runtime へ反映。

## §3.2 実装メモ

- 2026-07-07: 最小 slice として `db-currency` doctor hard gate を追加。永続 `.ut-tdd/harness.db`
  の `plan_registry` 件数と fingerprint を現行 `docs/plans` と突き合わせ、missing / stale count /
  stale fingerprint を独立して fail-close する (`PLAN-L7-369-db-currency-doctor-gate`)。
- `drive-db-registration` は stale persisted DB に引きずられないよう、persisted plan registry が
  stale の場合は `:memory:` rebuild で登録整合を評価する。stale の責務は `db-currency` に集約する。
- Stop hook 自動 rebuild、token ingest 統合、DB consumer 側の stale 警告は未実装。次 slice で
  `PLAN-L7-366-takeover-surface-warn-actionable` と接続して surface 改善へ進める。
- 2026-07-17: **staleness 再発を実測 (GitHub issue #78、2026-07-16)** — doctor `db-currency` が
  violation 2 (stale_plan_registry=-31, stale_plan_registry_fingerprint) で fail。docs/plans 793 件に対し
  persisted plan registry が 31 件遅延、`ut-tdd db rebuild` (rows 176,951 再投影) で解消した。
  gate (L7-369 slice) は機能したが、本 PLAN の残スコープ (hook 駆動 rebuild = Step 2) が未実装のため
  他ランタイムの merge 後に手動 rebuild 依存が残ることの実証。issue #78 の対応案 —
  merge/checkout 境界 or doctor 冒頭での stale 検知時に (a) 自動 re-projection するか
  (b) rebuild remediation 付き fail に留めるか — は Step 1 の設計判断へ取り込む。
- 2026-07-17: **Step 2 実装 (issue #78 対応 slice)**。着手に伴い kind を add-impl へ昇格し
  PLAN-REVERSE-365 と pairing (parent=PLAN-L5-01-physical-data、drive=db)。
  - **設計判断 (採択)**: 自動 re-projection は **Stop hook 境界** に置き、doctor は read-only の
    remediation 付き fail のまま維持する (issue #78 の案 (a) を Stop 境界に限定して採択、doctor には
    (b) を維持)。理由 = doctor の read-only 原則 (PLAN-L7-442 の singleton 検査規律) を壊さず、
    session 境界で決定的 rebuild すれば他ランタイム merge 由来の stale が次 session までに収束する。
    PO の包括推進指示 (2026-07-17「全てやって」) に基づき推奨案を先行採択 (PR レビューで覆せる可逆判断)。
  - 実装: `src/state-db/stop-refresh.ts` の `refreshHarnessDbOnStop` — persisted harness.db の
    full rebuild + token/cost ingest (`telemetry scan` 相当を統合、`loadRuntimeSessionUsage` +
    `projectTokenUsage` + `projectModelEvaluations`)。fail-open (DB lock 含む全例外を理由付き skip へ
    落とし exit 0 を維持)。`src/cli.ts` の `session summary` (Stop hook) から呼出。
  - 配線先は §3.1 想定の `session-log.ts` onStop でなく CLI 層 (`session summary` action) にした。
    onStop は pure な log 圧縮 core であり、DB I/O 統合は CLI 層の責務に置く方が層分離を保つため。
  - regression: `tests/db-currency.test.ts` U-DBCURRENCY-005 (stale registry が Stop refresh で
    手動 rebuild 無しに収束) / U-DBCURRENCY-006 (rebuild 不能時に throw せず理由を返す fail-open)。
- 2026-07-17: **cross-runtime blind review (codex blind-reviewer) FLAG/FLAG → 是正**。
  有効指摘 = Stop hook の timeout 予算 (Claude 側 5s) と同期 full rebuild (実測 176,951 行) が
  両立せず、外部 kill は関数内 try/catch で捕捉できないため「Stop hook 後の収束」が不成立。
  対応 = refresh を `session db-refresh` 内部コマンドへ分離し、`session summary` からは
  **detached fire-and-forget** (`spawnDetachedStopRefresh`、stdio ignore + unref) で起動する構造へ
  変更 (hook は即 return、rebuild は hook 予算外で完走)。U-DBCURRENCY-007 (detached 起動契約) /
  U-DBCURRENCY-008 (起動失敗 fail-open) で固定。既知の残余 (受容): (1) 複数 session 同時 Stop の
  SQLite lock 競合は fail-open skip で敗者は次の Stop まで stale が残り得る (rebuild は単一
  transaction で atomic、破損はしない)。(2) Stop 毎 full rebuild のコストは hook 予算外へ移した
  ことで受容 (差分投影への最適化は後続 slice)。(3) 実 hook E2E (timeout kill 下の挙動) は
  機構上 unit では固定できず、実運用の db-currency gate green を照合点として PLAN-REVERSE-365
  R2 で観測する。
- 2026-07-17: **blind review 2nd round FLAG → 是正**。指摘 = real `spawn` の非同期起動失敗
  (ENOENT 等) は同期 throw でなく child の error event で届き、listener 未登録だと親 process が
  落ちて fail-open 契約を破る (レビュアー実測で Bun exit 1)。対応 = error listener を必ず登録して
  握りつぶす + U-DBCURRENCY-009 (spawnImpl 非注入 = real spawn、存在しない executable で
  process が落ちないこと) を real oracle として追加。残余 (受容): 親 kill 後の detached 子の
  完走 E2E (marker 生成 subprocess test) は未固定 — 実運用の db-currency gate green を
  REVERSE-365 R2 の照合点とする判断を維持。
- 2026-07-21: **PR #100 concurrency redesign**。上記の「複数 Stop 競合を受容」は撤回し、
  `src/state-db/stop-refresh-coordinator.ts` を正規生成物として singleton/coalescing を実装した。
  generation 固有 anchor と `active` hardlink の排他的生成を ownership の原子点とし、実行中の
  追加 Stop は dirty demand に畳み、完了後の rerun を最大1回に制限する。detached child handoff は
  parent claim → child self-ack → parent claim retire の順序で行う。親が取得できない child birth は
  `unverified-*` として保持し、child の自己観測時だけ verified birth へ一方向昇格する。verified claim
  と自己観測が不一致なら fail-close とし、終了した owner と同じ PID の別 incarnation は即時 reclaim
  できる。U-DBCURRENCY-010〜025が多重 Stop、需要保存、failure receipt、実process race、child
  self-join、PID reuseを固定する。

## DoD / 受入基準

- [x] Stop hook 後に on-disk harness.db が現行 docs/plans に対して current (`ut-tdd db rebuild`
      手動実行なし、`tests/db-currency.test.ts` U-DBCURRENCY-005 で固定)。
- [x] token/cost ingest (`telemetry scan` 相当) が hook rebuild 経路へ統合され、別コマンド実行の
      構造依存が解消 (`refreshHarnessDbOnStop` が ingest 込みで走ることは U-DBCURRENCY-005 の
      経路で green)。**実ログ fixture による token 行存在 regression は未固定** — 本 slice の
      非対象として PLAN-REVERSE-365 R2 の照合点 (実運用 model_runs への実測行蓄積、issue #82) へ
      明示的に送る。
- [x] `ut-tdd doctor` の `db-currency` が on-disk DB の staleness を検出する。
- [x] rebuild 例外が session 終了を妨げない (`tests/db-currency.test.ts` U-DBCURRENCY-006:
      rebuild 不能でも throw せず理由付き skip、CLI 側は stderr 警告のみで exit 0)。
- [x] references が PLAN-L7-348 (recoverability 軸) を明示し軸分離が記録されている
      (frontmatter references + 背景節の軸分離記述)。
