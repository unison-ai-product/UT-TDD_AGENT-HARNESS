---
plan_id: PLAN-L6-06-handover-mechanism
title: "PLAN-L6-06 (add-design): handover 記録機構の機能設計 — session-log PLAN digest → handover 生成 (機械ポインタ CURRENT.json + 人間判断 markdown) + plan_id 解決の活性化 (§6.8.5/§6.8.6 follow-up)"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 関数 signature / DbC / digest→handover 変換境界 / CURRENT.json(機械) vs markdown(人間) の二層責務 / 秘匿(sanitize 継承・credential 非載) / plan_id 活性化が既存 session-log を壊さない (fail-open 維持) のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/handover-mechanism.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-03-session-log.md
  requires: []
  blocks: []
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-04"
    tests_green_at: "2026-06-04"
    verdict: approve
    scope: "code-reviewer 全6周 APPROVE (Critical 1 + Important 5 + Minor 3 反映済) (handover 2026-06-04)"
---

# PLAN-L6-06 (add-design): handover 記録機構の機能設計

## §0 位置づけ

要件 **§6.8.5 (PLAN 完了時 handover 必須)** と **§6.8.6 (進捗管理 = log + handover + state DB の 3 層)** に「製品仕様」として存在する handover を、**session-log の PLAN digest を機械的入力にして handover を生成する機構**として確定する設計差分。§6.8.5 は本文末で「**詳細設計 (artifact schema + 自動生成機構) は session-log digest → handover 変換の follow-up PLAN で確定**」と明記しており、本 PLAN がその follow-up である (commit `f934eae` Next Action 7)。

- 親設計: `PLAN-L6-03-session-log` (digest = §6.8.6 で「log→handover の橋渡し + state DB 登録トリガ = 3 層の結節点」と規定。handover はその digest を consume する。drive=fullstack 一致)。forced-stop (L6-04) も session-log を親に取った先例と同型。
- 駆動モデル: **Add-feature** (bottom-up build → 後段 Reverse で §6.8.5/§6.8.6 詳細 + CURRENT.md/.json 表記不整合 + L4 external-if へ back-fill、[[feedback_addfeature_bottomup_reverse_backfill]])。
- **本機能が解く 2 つの密結合ギャップ** (2026-06-04 診断):
  1. **Gap A — handover 機構が未実装**: schema / コマンド / 自動生成 / `CURRENT.json` のいずれも無く、`docs/handover/*.md` が手書きで drift する (前 handover で HEAD 表記が実 commit とずれた実例)。CLAUDE.md ワークフローが参照する `.ut-tdd/handover/CURRENT.json` は規定も実体も無い。
  2. **Gap B — session-log digest が solo/main 直で死んでいる**: `resolveActivePlan` は `.ut-tdd/state/current-plan` → branch fallback → null の順 (U-SLOG-001 既設計) だが、**①の state を書く機構が無く**、**②は harness 自己開発が main 直 (branch を切らない) ため一致しない** → `plan_id` 恒常 null → `.ut-tdd/logs/plan/*.digest.json` が一度も生成されず (実ログ 5 件すべて `plan_id:null` で実証)、§6.8.6 の結節点が機能しない。
- **結合理由**: §6.8.5 が「handover の入力 = PLAN digest」と規定する以上、handover を作るには digest が populate されている必要がある。Gap B 修正 (current-plan を書く手段) は Gap A の **前提条件**であり、同一因果鎖 (§6.8.6 結節点の活性化) として 1 機能に束ねる。Gap B は既存 session-log 設計 (L6-03) への **限定的 amendment** であり、新 sub-doc を起こさない (混在禁止に抵触しない)。

## §1 要求 (この機構が満たすこと)

1. **PLAN digest → handover の機械的橋渡し**: `.ut-tdd/logs/plan/<plan_id>.digest.json` (touched files / commits / failures) を入力に、§6.8.5 必須 6 内容 (①PLAN サマリ ②成果物 ③Next Action ④carry ⑤未了 PO 判断 ⑥壊さない注意) のうち **機械部 (①一部・②) を prefill**、判断部 (③④⑤⑥) は人間記入の placeholder にする (§6.8.5「機械的入力 + 人間判断を足して handover」)。
2. **二層配置の確定**: **機械ポインタ = `.ut-tdd/handover/CURRENT.json`** (local / gitignored、「今アクティブな PLAN・status・最新 handover doc への pointer・digest 要約」を機械可読で保持。CLAUDE.md ワークフローの参照先) / **チーム継続記録 = `docs/handover/session-handover-<date>[suffix].md`** (tracked、人間判断 durable)。§6.8.5 配置規定に一致。
3. **plan_id 解決の活性化 (Gap B fix)**: `.ut-tdd/state/current-plan` を書く手段 (`setActivePlan` + `ut-tdd plan use <id>`) を提供し、solo/main 直でも digest が populate されるようにする。**`resolveActivePlan` の解決ロジック自体は変えない** (U-SLOG-001 のまま) — 入力 state を書く経路を足すだけ。
4. **stale 検知の基盤**: `handoverStale(updated_at, now, 24h)` 純関数を提供 (§5.3 pre-push の「CURRENT.* が 24h 以内」warn・§1.10 line 947 検証の機械基盤)。lint engine 実装前は human-binding。
5. **fail-safe / 秘匿 / 非破壊**: handover 生成は never-throw を要さない (CLI なので失敗は warn 可) が、**digest 由来テキストは session-log の sanitize 済を前提**にし credential を載せない。`--dry-run` は何も書かない。既存 markdown は **追記** (上書きしない)。CURRENT.json は単一機械ポインタとして上書き。

## §2 機能設計 (L6 粒度、generates: handover-mechanism.md に詳細)

### §2.1 責務分離 (機械ポインタ = 自動 / markdown = 人間判断の scaffold / plan 活性化 = 入力 state を書く)

| 層 | 責務 | 失敗/安全方針 |
|----|------|--------------|
| 解決 (`resolveHandoverScope`) | current-plan state + 直近 digest 群から対象 PLAN・digest を集める。**判断しない** | never throw。無ければ `{active_plan:null, digests:[]}` |
| 機械ポインタ (`buildPointer`/`writePointer`) | digest 要約から `CURRENT.json` を組み立て上書き (機械可読、単一 SSoT) | 純関数 + 単一書込。active_plan=null でも valid pointer |
| scaffold (`scaffoldFromDigests`/`renderHandoverScaffold`) | digest + PLAN frontmatter → §6.8.5 の 6 セクション markdown。①②を prefill、③-⑥ は human placeholder | 純関数。sanitize 済前提、credential 非載 |
| 活性化 (`setActivePlan`) | `.ut-tdd/state/current-plan` を書く (digest を populate させる Gap B fix) | 単一書込。`resolveActivePlan` の読取先と同一 path |
| 推定 (`inferPlanFromCommit`) | commit message から `PLAN-<token>-<NN>` 抽出 (best-effort、`-m` 形式のみ。`-F -` heredoc は対象外) | 純関数。無ければ null。current-plan 自動更新の補助 |
| orchestration (`runHandover`) | scope 解決 → markdown 追記/新規 (dry-run は書かない) → CURRENT.json 更新 → `--complete` で status=completed | dry-run 非破壊。既存 md は追記 |

### §2.2 型 schema (D-CONTRACT)

```text
HandoverStatus = "in_progress" | "completed"
PlanDigestRef = {                          # .ut-tdd/logs/plan/<id>.digest.json の読取 subset (PlanDigest)
  plan_id: string, sessions: string[], commits: string[],
  files_touched: string[], failures: { ts: string; summary: string }[], updated_at: string,
}
HandoverPointer = {                        # .ut-tdd/handover/CURRENT.json (機械ポインタ、gitignored)
  active_plan: string | null,
  status: HandoverStatus,
  latest_doc: string | null,               # docs/handover/session-handover-<date>.md への path
  digest_summary: { commits: number; files: number; failures: number } | null,
  updated_at: string,
}
HandoverDoc = {                            # markdown 1 entry の論理内容
  date: string,
  plans: { plan_id: string; kind: string; summary: string }[],   # ① 機械 prefill (PLAN frontmatter 由来)
  deliverables: { plan_id: string; commits: string[]; files: string[] }[],  # ② digest 由来
  next_actions: string[], carry: string[], po_decisions: string[], do_not_break: string[],  # ③-⑥ human placeholder
}
```

### §2.3 関数 signature (src/handover/index.ts + src/cli 拡張 + src/runtime/session-log.ts 限定 amendment)

| 関数 | signature | DbC |
|------|-----------|-----|
| `resolveHandoverScope` | `(deps: { repoRoot; readText; listDir }) => { active_plan: string\|null; digests: PlanDigestRef[] }` | **never throws**。current-plan state を読み active_plan を決定 / `.ut-tdd/logs/plan/*.digest.json` を listDir で集める / 不在・壊れ JSON は skip / 無ければ `{active_plan:null, digests:[]}` |
| `buildPointer` | `(scope, latestDoc: string\|null, status: HandoverStatus, now: string) => HandoverPointer` | **純関数**。digest_summary = 対象 digest の commits/files/failures 件数集計 / active_plan=null でも valid (digest_summary=null) / updated_at=now |
| `scaffoldFromDigests` | `(digests: PlanDigestRef[], planMeta: {plan_id;kind;title}[], date: string) => HandoverDoc` | **純関数**。digest.commits/files_touched → deliverables / planMeta.kind/title → plans.summary / **③-⑥ は空配列 (human 記入)** |
| `renderHandoverScaffold` | `(doc: HandoverDoc) => string` | **純関数**。§6.8.5 の 6 セクション markdown を render / 機械部 prefill / **③-⑥ は `<!-- TODO(human): ... -->` placeholder** / digest テキストは sanitize 済前提で credential を再載しない |
| `handoverStale` | `(updated_at: string\|null, now: string, maxHours?=24) => boolean` | **純関数**。updated_at 無し → true / now-updated_at > maxHours → true / それ以内 → false (§5.3 pre-push warn 基盤) |
| `writePointer` | `(pointer: HandoverPointer, deps: { repoRoot; writeText }) => void` | `.ut-tdd/handover/CURRENT.json` を **上書き** (単一機械ポインタ、append しない) |
| `setActivePlan` | `(planId: string\|null, deps: { repoRoot; writeText; removeFile? }) => void` | `.ut-tdd/state/current-plan` を書く (Gap B 活性化、`resolveActivePlan` 読取先と同一) / null は clear (file 削除 or 空) |
| `inferPlanFromCommit` | `(commitMessage: string) => string\|null` | **純関数**。`/PLAN-(L\d+\|L1[0-4]\|DISCOVERY\|REVERSE\|RECOVERY\|M)-\d{2}(-[a-z0-9-]+)?/` 最初の一致を返す / 無ければ null |
| `runHandover` | `(args: HandoverArgs, deps) => HandoverResult` | orchestration。scope 解決 → scaffold render → markdown **追記/新規** (`--dry-run` は書かず内容を返す) → CURRENT.json 更新。`--complete` で status=completed + 当該 PLAN を記録。**dry-run は非破壊 / 既存 md は上書きしない** |

**session-log への限定 amendment (Gap B 配線)**: `onPostToolUse` の commit 経路で `inferPlanFromCommit(message)` が非 null を返したとき `setActivePlan` で current-plan を更新する (best-effort、fail-open 維持)。`-F -` heredoc commit は message を取得できないため、**確実な経路は `ut-tdd plan use <id>` (= `setActivePlan` の CLI 露出)**。`resolveActivePlan` 本体は不変。

I/O は `src/runtime/session-log.ts` の `SessionLogDeps` (repoRoot/readText/writeText/listDir) と同型の注入 (test = mock、決定論的 now 注入)。

### §2.4 ストレージ / 配置 / hook

- 機械ポインタ: `.ut-tdd/handover/CURRENT.json` (gitignored runtime state)。現状 `.gitkeep` のみの `.ut-tdd/handover/` を実体化。
- チーム記録: `docs/handover/session-handover-<date>[suffix].md` (tracked、既存運用を継承し scaffold で augment)。
- 活性化 state: `.ut-tdd/state/current-plan` (gitignored、`resolveActivePlan` が既に読む path)。
- digest 入力: `.ut-tdd/logs/plan/<plan_id>.digest.json` (session-log onStop 生成、Gap B 活性化後に初めて populate)。
- hook: **無し** (handover は CLI subcommand。session-log の既存 hook に commit 推定の 1 行を足すのみで、新規 hook は追加しない)。

### §2.5 二層責務の核心判断 (機械 vs 人間)

| handover 内容 | 機械 (digest/frontmatter 由来) | 人間判断 | 配置 |
|---|---|---|---|
| ① PLAN サマリ (kind/layer/何を) | kind/title を frontmatter から prefill | 「何を」の要約は人間補正 | CURRENT.json + md |
| ② 成果物 (commit/files) | digest.commits / files_touched から full prefill | — | CURRENT.json(要約) + md(全列挙) |
| ③ Next Action / ④ carry / ⑤ 未了 PO 判断 / ⑥ 壊さない | — | **人間記入 (placeholder)** | md のみ |
| active PLAN / status / stale | 全自動 (pointer) | — | CURRENT.json |

→ 「機械可読の今どこ (CURRENT.json)」と「人間判断の次どう (markdown)」を**型 (HandoverPointer / HandoverDoc) で分離**。§6.8.6 の「state DB=今どこ / handover=次どう」の役割直交を機構に落とす。

## §3 ③ 単体テスト設計 (generates: L7-unit-test-design.md §1.8、pair G7)

| U-ID | 対象 | DoD |
|------|------|-----|
| U-HOVER-001 | `resolveHandoverScope` | current-plan 有 → active_plan 解決 / digest 群を listDir で集約 / 壊れ JSON skip / 無 → `{active_plan:null,digests:[]}` (never throw) |
| U-HOVER-002 | `buildPointer` | 純関数。digest_summary = commits/files/failures 件数集計 / active_plan=null → digest_summary=null / updated_at=now |
| U-HOVER-003 | `scaffoldFromDigests` | digest → deliverables (commits/files) / planMeta → plans.summary / **③-⑥ が空配列 (human 未記入)** |
| U-HOVER-004 | `renderHandoverScaffold` | 6 セクション (①-⑥) を含む / ③-⑥ に `TODO(human)` placeholder / **digest 由来文字列に credential/PII を再注入しない (sanitize 済前提の non-regression)** |
| U-HOVER-005 | `handoverStale` | updated_at=null → true / 24h 超 → true / 24h 以内 → false / 境界 (=24h ちょうど) の扱い明示 |
| U-HOVER-006 | `setActivePlan` + `inferPlanFromCommit` | setActivePlan が current-plan を書き `resolveActivePlan` が同値を読む (round-trip) / null で clear / `inferPlanFromCommit`: `PLAN-L6-06-...` 抽出 / 非該当 → null / `-F -` heredoc 様 (PLAN 文字列なし) → null |
| U-HOVER-007 | `runHandover` (orchestration) | `--dry-run` → md/CURRENT.json を書かず内容返す (非破壊) / 通常 → md 追記 (既存上書きしない) + CURRENT.json 更新 / `--complete` → status=completed + 当該 PLAN 記録 |

## §工程表

### Step 1: 機能設計 doc 起草
`docs/design/harness/L6-function-design/handover-mechanism.md` に §2 の責務分離 + 型 + 関数 signature + DbC + 二層境界 (機械/人間) + ストレージ/配置 + Gap B 活性化 (session-log 限定 amendment) + 秘匿/非破壊方針を記述。`src/runtime/session-log.ts` (nodeDeps/純関数分離/sanitize) + `src/setup/index.ts` (deps 注入/dry-run/state SSoT) パターン継承を明記。

### Step 2: ③ 単体テスト設計
`docs/test-design/harness/L7-unit-test-design.md` に §1.8 U-HOVER-001..007 を追記 + §2 量閉じ一覧に handover 行追加 (① 設計とペア、孤児 0)。

### Step 3: review (review 前置 MUST)
claude-only のため `code-reviewer` (Senior Staff、TL 代替) で signature/DbC/二層境界 (機械 CURRENT.json vs 人間 markdown)/秘匿 (sanitize 継承・credential 非載)/**Gap B 活性化が既存 session-log の fail-open を壊さないか**/dry-run 非破壊をレビュー。cross-agent 不在を evidence に記録 ([[feedback_ts_native_over_helix_cli]])。

### Step 4: 命名テスト + 全回帰
`npx vitest run tests/plan-id-naming.test.ts` + `npx vitest run`。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| handover 必須 6 内容 / 入力=digest / 配置 (CURRENT.json + docs/handover md) | 要件 §6.8.5 (PLAN 完了時 handover 必須) |
| 3 層 (state DB / log / handover) と digest=結節点 の役割直交 | 要件 §6.8.6 (進捗管理 3 層) |
| digest schema (commits/files_touched/failures/updated_at) | `src/runtime/session-log.ts` `PlanDigest` 型 / session-log.md §3 |
| Gap B (plan_id 恒常 null) の診断と current-plan 活性化 | `resolveActivePlan` (session-log.ts L124) + 実ログ 5 件 (全 plan_id:null) + main 直運用 ([[feedback_main_direct_solo]]) |
| 関数 signature / DbC / deps 注入 / dry-run / state SSoT | `src/setup/index.ts` (SetupState 上書き SSoT / dryRun 非破壊) + `src/runtime/session-log.ts` (純関数分離/sanitize/never-throw) パターン踏襲 |
| 秘匿 (sanitize 継承・credential 非載) | CLAUDE.md 禁止事項 (credential を docs/examples に書かない) + session-log `sanitize`/`SECRET_RE` |
| stale 24h 検知 | 要件 §5.3 pre-push (CURRENT.* updated_at 24h) / §1.10 line 947 |

## §6 用語更新 (§G.9 living glossary)

| 用語 | 定義 | 導入層 |
|------|------|--------|
| handover 機械ポインタ (CURRENT.json) | `.ut-tdd/handover/CURRENT.json`。active PLAN・status・最新 handover doc への pointer・digest 要約を機械可読で保持する単一 SSoT (gitignored)。CLAUDE.md ワークフローの参照先 | L6 |
| handover scaffold | session-log PLAN digest と PLAN frontmatter から §6.8.5 の 6 セクション markdown を機械生成し、機械部 (①②) を prefill・判断部 (③-⑥) を人間 placeholder にする生成物 | L6 |
| plan_id 活性化 (current-plan) | `.ut-tdd/state/current-plan` を書き session-log の digest を populate させる経路。solo/main 直で plan_id が恒常 null になる Gap を埋める (`resolveActivePlan` の入力 state を供給) | L6 |
| handover stale | CURRENT.json の updated_at が閾値 (既定 24h) を超えた状態。pre-push warn / lint の機械基盤 | L6 |

→ L0 §10 用語集へ back-merge (§G.9)。**CURRENT.json を機械ポインタ正本とする決定は本 PLAN の設計 doc §2.4 で確定済** (handoverStale の入力先を未確定でフリーズさせない、code-reviewer Critical 反映)。後段 Reverse は §6.8.5/§6.8.6 詳細設計確定 + **要件 L947/L1972/L2024 の `CURRENT.md`→`CURRENT.json` 文字列同期** + L4 external-if 整合へ back-fill。

## §7 成否

- generates 2 件 (handover-mechanism.md / L7-unit-test-design.md §1.8 追記) が揃い ①⇔③ ペア成立 (G6 pair freeze 対象)
- code-reviewer review APPROVE (Critical 0、特に 二層境界 / 秘匿 / **Gap B 活性化が session-log fail-open を壊さない** / dry-run 非破壊の確認)
- 命名テスト + 全回帰 pass
- §6 の 4 用語の L0 §10 用語集 back-merge は**後段 Reverse 工程の deliverable** (bottom-up 順、setup 先例と同一)。本 PLAN は §6 に 4 用語を宣言済 = §G.9 充足 (lint stub のため human-binding)
- code-reviewer (TL 代替) review を本 PLAN で 1 周通し、Critical 1 (CURRENT.md/.json 正本を本設計で決定) + Important 5 (型定義 HandoverArgs/Result・buildPointer の digest_summary 独立・setActivePlan clear 経路・renderHandoverScaffold の sanitize defense-in-depth・runHandover deps) + Minor 3 を設計 doc / テスト設計へ反映済
- 後段 `PLAN-L7-04-handover-mechanism` (add-impl) へ接続、最終的に `PLAN-REVERSE-05-handover-mechanism` で §6.8.5/§6.8.6 詳細 + 要件 CURRENT.md→.json 文字列同期 + L4 external-if 整合へ back-fill (PO 方針)
