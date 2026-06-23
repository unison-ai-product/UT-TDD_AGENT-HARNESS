---
layer: L6
artifact_type: design_doc
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-06-handover-mechanism.md
---

> **L6 contract marker**: `runHandover(input: HandoverInput) => HandoverResult` and `checkHandoverDiscipline(input: HandoverDisciplineInput) => HandoverDisciplineResult` are the unit-test-granularity contracts. DbC pre/post/invariant maps digest, CURRENT.json, and stale/drift checks to U-HOVER-001..012.

<!--
① 設計 (L6 機能設計) — handover 記録機構 (session-log PLAN digest → handover 生成 + plan_id 活性化)。
PLAN: PLAN-L6-06-handover-mechanism (add-design)。pair (③): docs/test-design/harness/L7-unit-test-design.md §1.8 U-HOVER。
実装 (②): src/handover/index.ts + src/cli (ut-tdd handover / ut-tdd plan use) + src/runtime/session-log.ts 限定 amendment (PLAN-L7-04-handover-mechanism, add-impl, 後続)。
土台思想: src/runtime/session-log.ts (純関数分離 / sanitize / never-throw) + src/setup/index.ts (deps 注入 / dry-run 非破壊 / state SSoT) を踏襲。
上位整合: 要件 §6.8.5 (PLAN 完了時 handover 必須) / §6.8.6 (進捗 3 層 = state DB + log + handover、digest=結節点) / §5.3 pre-push stale (後段 Reverse で back-fill + CURRENT.md/.json 表記不整合是正)。
-->

# UT-TDD Agent Harness — L6 機能設計: handover 記録機構 (digest → handover 生成 + plan_id 活性化)

## §1 概要

handover を、**session-log の PLAN digest を機械的入力にして生成する機構**として設計する。(1) `.ut-tdd/state/current-plan` から active PLAN を解決し `.ut-tdd/logs/plan/<id>.digest.json` を集め (`resolveHandoverScope`)、(2) digest 要約を機械可読の**機械ポインタ `.ut-tdd/handover/CURRENT.json`** に書き (`buildPointer`/`writePointer`)、(3) digest + PLAN frontmatter から §6.8.5 必須 6 セクションの **markdown scaffold** を生成して `docs/handover/session-handover-<date>.md` に追記する (`scaffoldFromDigests`/`renderHandoverScaffold`/`runHandover`)。機械部 (①PLAN サマリ一部・②成果物) を prefill し、判断部 (③Next Action・④carry・⑤未了 PO 判断・⑥壊さない注意) は人間記入の placeholder にする。

これは要件 §6.8.5 が本文末で「**詳細設計 (artifact schema + 自動生成機構) は session-log digest → handover 変換の follow-up PLAN で確定**」と明記した宿題 (commit `f934eae` Next Action 7) の実体化である。

> **PO 確定事項** (2026-06-02、§6.8.5/§6.8.6): ① PLAN が `status=completed` へ遷移する時 handover 生成は**必須** / ② 入力は **session-log の PLAN digest** (touched files / commits / failures) + 人間判断 / ③ 配置は **機械ポインタ `.ut-tdd/handover/CURRENT.json` (local/gitignored)** + **チーム記録 `docs/handover/*.md` (tracked)** の二層 / ④ 粒度は 1 PLAN=1 entry を要さず **1 セッション or 1 駆動サイクル単位**で束ねてよい。

> **なぜ「機械 prefill + 人間判断」か**: §6.8.6 は進捗を **state DB (今どこ) / log (どう進めた) / handover (次どう)** の 3 層で管理し、handover の役割を「**次どうするか** (Next Action / carry / 未了 PO 判断)」=人間判断・durable と定義する。よって成果物トレイル (②) は digest から機械生成できるが、Next Action 等は機械化せず人間が書く。digest はこの 3 層の**結節点** (log→handover 橋渡し + DB 登録トリガ) であり、本機構はその橋を実装する。

## §1.5 前提ギャップ (Gap B — plan_id 活性化が本機構の必要条件)

§6.8.5 が「handover の入力 = PLAN digest」と規定する以上、digest が populate されていなければ本機構は空回りする。現状の診断 (2026-06-04):

- `resolveActivePlan` (session-log.ts L124) は **① `.ut-tdd/state/current-plan` → ② branch 名 (`add/<plan>` 等) fallback → ③ null** の順に解決する (U-SLOG-001 既設計、ロジックは正しい)。
- しかし **① の state を書く機構が存在せず**、**② は harness 自己開発が main 直 (branch を切らない、[[feedback_main_direct_solo]]) ため一致しない** → `plan_id` が**恒常 null** (実ログ 5 件すべて `plan_id:null` で実証) → `onStop` が `plan_id=null` の session を digest 対象外にする (U-SLOG-004) ため `.ut-tdd/logs/plan/*.digest.json` が**一度も生成されない**。
- 結論: 本機構は **current-plan を書く経路 (`setActivePlan` / `ut-tdd plan use`) の追加 = Gap B 修正**を前提条件として含む。**`resolveActivePlan` の解決ロジックは一切変えない** — 入力 state を供給する経路を足すだけ。これは session-log 設計 (PLAN-L6-03) への**限定 amendment** であり、新 sub-doc を起こさない。

## §2 機能設計 (L6 粒度)

### §2.1 責務分離 (機械ポインタ=自動 / markdown=人間判断 scaffold / 活性化=入力 state 供給)

| 層 | 責務 | 失敗 / 安全方針 |
|----|------|----------------|
| **解決** (`resolveHandoverScope`) | current-plan + 直近 digest 群から対象 PLAN・digest を集める。**判断しない** | never throws。不在/壊れ JSON skip → `{active_plan:null, digests:[]}` |
| **機械ポインタ** (`buildPointer`/`writePointer`) | digest 要約から `CURRENT.json` を組み立て**上書き** (機械可読・単一 SSoT) | `buildPointer` 純関数。`active_plan=null` でも valid pointer |
| **scaffold** (`scaffoldFromDigests`/`renderHandoverScaffold`) | digest + frontmatter → 6 セクション markdown。①②prefill、③-⑥ placeholder | **純関数**。sanitize 済前提・credential 非載 |
| **活性化** (`setActivePlan`) | `.ut-tdd/state/current-plan` を書く (digest を populate させる Gap B fix) | 単一書込。`resolveActivePlan` 読取先と同一 path |
| **推定** (`inferPlanFromCommit`) | commit message から `PLAN-<token>-<NN>` 抽出 (best-effort) | **純関数**。無 → null。`-F -` heredoc は message 取得不可ゆえ対象外 |
| **orchestration** (`runHandover`) | 解決 → scaffold → md 追記/新規 (dry-run は書かない) → CURRENT.json 更新 → `--complete` で completed | dry-run **非破壊** / 既存 md は**追記** (上書きしない) |

handover は hook でなく **CLI subcommand** (`ut-tdd handover` / `ut-tdd plan use`) で実現する。session-log の既存 hook に「commit 経路で `inferPlanFromCommit` → `setActivePlan`」の 1 行 (best-effort/fail-open) を足すのみで、**新規 hook は追加しない**。

### §2.2 型 / schema (D-CONTRACT)

```ts
type HandoverStatus = "in_progress" | "completed";

// .ut-tdd/logs/plan/<id>.digest.json の読取 subset (session-log.ts PlanDigest と互換)
interface PlanDigestRef {
  plan_id: string;
  sessions: string[];
  commits: string[];
  files_touched: string[];
  failures: { ts: string; summary: string }[];
  updated_at: string;
}

// .ut-tdd/handover/CURRENT.json — 機械ポインタ (gitignored、単一 SSoT)
interface HandoverPointer {
  active_plan: string | null;
  status: HandoverStatus;
  latest_doc: string | null;   // docs/handover/session-handover-<date>.md への相対 path
  digest_summary: { commits: number; files: number; failures: number } | null;
  updated_at: string;          // ISO8601 (stale 判定の基準)
}

// markdown 1 entry の論理内容
interface HandoverDoc {
  date: string;
  plans: { plan_id: string; kind: string; summary: string }[];                 // ① 機械 prefill
  deliverables: { plan_id: string; commits: string[]; files: string[] }[];     // ② digest 由来
  next_actions: string[];      // ③ human placeholder (scaffold では空)
  carry: string[];             // ④ human
  po_decisions: string[];      // ⑤ human
  do_not_break: string[];      // ⑥ human
}

// CLI orchestration の引数 / 戻り値
interface HandoverArgs {
  date: string;                // handover entry の日付 (CLI が注入、関数内で Date を直接呼ばない)
  dryRun?: boolean;            // true → 何も書かず content を返す
  complete?: boolean;          // true → status=completed として記録
  planId?: string;             // 明示 active PLAN (省略時 scope.active_plan)
}
interface HandoverResult {
  content: string;             // render した markdown (dry-run でもこれは返す)
  pointer: HandoverPointer;    // 書いた (or 書く予定の) CURRENT.json
  written: string[];           // 実際に書いた path (dry-run は [])
}
```

### §2.3 関数 signature / DbC

| 関数 | signature | DbC |
|------|-----------|-----|
| `resolveHandoverScope` | `(deps: { repoRoot: string; readText; listDir }) => { active_plan: string\|null; digests: PlanDigestRef[] }` | **never throws**。`.ut-tdd/state/current-plan` を読み active_plan を決定 / `.ut-tdd/logs/plan/` を listDir し `*.digest.json` を parse / 不在・壊れ JSON は skip / 何も無ければ `{active_plan:null, digests:[]}`。**`listDir` は本 deps では必須** (session-log の optional `listDir?` と異なり handover は走査が責務) |
| `buildPointer` | `(input: { scope; latestDoc: string\|null; status: HandoverStatus; now: string }) => HandoverPointer` | **純関数**。source coding rule の max 3 params に従い object input を受ける。**digest_summary は `scope.digests` が非空なら active_plan の null/非 null に関わらず集計** (`commits.length`/`files_touched.length`/`failures.length` 合算) / `scope.digests` が空のときのみ `digest_summary=null` / `active_plan` は scope の値をそのまま透過 (null 可) / `updated_at=now`。**`digest_summary=null` は「digest 不在」を意味し、「active_plan 未設定」とは独立** (両者を混同しない、CLAUDE.md ワークフローの誤読防止) |
| `scaffoldFromDigests` | `(digests: PlanDigestRef[], planMeta: {plan_id;kind;title}[], date: string) => HandoverDoc` | **純関数**。digest.commits/files_touched → `deliverables` / planMeta.kind/title → `plans.summary` / **③-⑥ は空配列** (human 記入のため scaffold では生成しない) |
| `renderHandoverScaffold` | `(doc: HandoverDoc) => string` | **純関数**。`# Session Handover — <date>` + §0..§6 相当の 6 セクション markdown を render / 機械部 (①②) は埋め、③-⑥ は `<!-- TODO(human): ... -->` placeholder / **自由テキスト欄 (`plans[].summary` / `deliverables[].*` / digest 由来 failures) は session-log の `sanitize` を render 時にも適用する (defense-in-depth)**。tracked な `docs/handover/*.md` に commit されるため、digest 側 sanitize 済でも render 段で再マスクして credential/PII の流出経路をゼロにする (二重 sanitize は冪等、`SECRET_RE` は `name=value` を `name=***` に) |
| `handoverStale` | `(updated_at: string\|null, now: string, maxHours = 24) => boolean` | **純関数**。precondition: `now`/`updated_at` は ISO8601 (`Date.parse` 可能、UTC 推奨)。`updated_at` 無し/parse 不能 → true / `(Date.parse(now) - Date.parse(updated_at)) / 3.6e6 > maxHours` → true / 以内 → false / **境界 (=maxHours ちょうど) は `>` 判定ゆえ stale でない**。**辞書順比較でなく数値差分で判定** (TZ 混入時の silent wrong answer 回避) |
| `writePointer` | `(pointer: HandoverPointer, deps: { repoRoot; writeText }) => void` | `.ut-tdd/handover/CURRENT.json` を **JSON 上書き** (単一機械ポインタ、append しない)。失敗は呼び出し側 (CLI) が warn |
| `setActivePlan` | `(planId: string\|null, deps: { repoRoot; writeText; removeFile? }) => void` | `.ut-tdd/state/current-plan` を書く (`resolveActivePlan` 読取先と同一)。**`planId!==null` → planId を書く / `planId===null` かつ `removeFile` 有 → file 削除 / `planId===null` かつ `removeFile` 無 → `writeText` で空文字を書く** (`resolveActivePlan` L126-127 は空文字を `trim()` で falsy 判定し branch fallback→null へ落とすため、空文字書込でも実質 clear になる)。deps は `SessionLogDeps` の subset (repoRoot/writeText) ゆえ amendment 経路でアダプタ不要 |
| `inferPlanFromCommit` | `(commitMessage: string) => string\|null` | **純関数**。`/PLAN-(?:L(?:[0-9]\|1[0-4])\|DISCOVERY\|REVERSE\|RECOVERY\|M)-\d{2}(?:-[a-z0-9-]+)?/` の最初の一致を返す / 無ければ null |
| `runHandover` | `(args: HandoverArgs, deps: { repoRoot; readText; writeText; listDir; now }) => HandoverResult` | orchestration。`resolveHandoverScope` → `scaffoldFromDigests` → `renderHandoverScaffold` → md **追記/新規** (`args.dryRun` は書かず `content` を返す) → `buildPointer`+`writePointer`。**`args.complete` → `buildPointer` に `status="completed"` と `active_plan = args.planId ?? scope.active_plan` を渡し CURRENT.json に completed を書く** (それ以外は `status="in_progress"`)。**dry-run 非破壊 (`written=[]`) / 既存 md は追記し上書きしない / CURRENT.json は単一上書き** |

I/O deps は session-log.ts `SessionLogDeps` (repoRoot / readText / writeText / listDir) と同型注入。決定論的テストのため `now` を注入する (`Date.now`/`new Date` を関数内で直接呼ばない)。`renderHandoverScaffold` の sanitize は session-log の `export function sanitize` を再利用する (新規実装しない)。

#### session-log への限定 amendment (Gap B 配線)

`src/runtime/session-log.ts` `onPostToolUse` の commit 判定経路 (既存 `isCommit`) に、best-effort で 1 段足す:

```text
if (isCommit) {
  const msg = String(input.tool_input?.command ?? "");   // -m 形式のみ message が乗る
  const inferred = inferPlanFromCommit(msg);
  if (inferred) setActivePlan(inferred, deps);            // current-plan を更新 (fail-open)
}
```

`-F -` heredoc commit ([[project_commit_msg_hook]]) は message が stdin 経由で command 文字列に乗らないため `inferred=null` になり no-op。**確実な活性化経路は `ut-tdd plan use <id>` (= `setActivePlan` の CLI 露出)**。`resolveActivePlan` 本体・既存 U-SLOG-001..005 の挙動は不変 (fail-open 維持、digest 生成条件 U-SLOG-004 も不変)。

### §2.4 ストレージ / 配置 / hook

| 対象 | path | tracked? | 役割 |
|------|------|----------|------|
| 機械ポインタ | `.ut-tdd/handover/CURRENT.json` | gitignored | active PLAN / status / 最新 doc / digest 要約 (機械可読 SSoT)。CLAUDE.md ワークフロー参照先 |
| チーム記録 | `docs/handover/session-handover-<date>[suffix].md` | tracked | 人間判断 durable (既存運用を scaffold で augment) |
| 活性化 state | `.ut-tdd/state/current-plan` | gitignored | `resolveActivePlan` の入力 (Gap B) |
| digest 入力 | `.ut-tdd/logs/plan/<id>.digest.json` | gitignored | session-log onStop 生成 (活性化後に初 populate) |

- hook: **無し** (CLI subcommand + session-log 既存 hook への 1 行のみ)。
- `.ut-tdd/handover/` は現状 `.gitkeep` のみ → 本機構が `CURRENT.json` を実体化する。`.gitignore` で `CURRENT.json` を ignore (state 系の既存方針と整合)。

> **正本決定 (CURRENT.md vs CURRENT.json、本設計で確定)**: 機械ポインタの正本は **`.ut-tdd/handover/CURRENT.json`** とする。`handoverStale` の入力は `CURRENT.json.updated_at` であり、§5.3 pre-push stale 検知もこれを読む。**`CURRENT.md` は廃止** (要件 L947/L1972/L2024 の `.ut-tdd/handover/CURRENT.md` 表記は本 PLAN 確定をもって `CURRENT.json` に読み替える)。後段 `PLAN-REVERSE-05` の役割は**要件文書側の `.md`→`.json` 文字列修正のみ**に限定し、本設計時点で正本を確定させる (stale 基盤が参照先未確定でフリーズされ dead 化するのを防ぐ、code-reviewer Critical 反映)。

### §2.5 二層責務の核心判断 (機械可読 CURRENT.json vs 人間判断 markdown)

| handover 内容 (§6.8.5) | 機械 (digest/frontmatter 由来) | 人間判断 | 配置 |
|---|---|---|---|
| ① PLAN サマリ (kind/layer/何を) | kind/title を frontmatter から prefill | 「何を」の要約補正 | CURRENT.json + md |
| ② 成果物 (commit / files) | digest.commits / files_touched から full prefill | — | CURRENT.json(件数) + md(全列挙) |
| ③ Next Action / ④ carry / ⑤ 未了 PO 判断 / ⑥ 壊さない注意 | — | **人間記入 (placeholder)** | md のみ |
| active PLAN / status / stale | 全自動 | — | CURRENT.json |

→ 「機械可読の**今どこ** (CURRENT.json)」と「人間判断の**次どう** (markdown)」を型 (`HandoverPointer` / `HandoverDoc`) で分離。§6.8.6 の役割直交 (state DB=今どこ / handover=次どう) を機構へ落とす。**機械化しないものを機械化しない**ことが設計判断 (Next Action を AI が捏造しない)。

### §2.6 markdown scaffold テンプレート (renderHandoverScaffold 出力骨格)

```text
# Session Handover — <date>

## §0 現在地 (一言)        ← ② digest 要約 + ① から機械生成 + 人間補正
## §1 PLAN サマリ           ← ① plans[] (plan_id/kind/summary) prefill
## §2 成果物 (commit/files) ← ② deliverables[] full prefill (digest 由来)
## §3 Next Action          ← <!-- TODO(human): 順序付き次手 -->
## §4 carry (未了・先送り)  ← <!-- TODO(human) -->
## §5 未了 PO 判断          ← <!-- TODO(human): escalation -->
## §6 壊さない / 再発させない ← <!-- TODO(human) -->
```

既存 `docs/handover/session-handover-*.md` の節構成 (現在地 / PLAN サマリ / 成果物 / Next Action / carry / 壊さない) と互換。

**同日累積の slim 化 (A-138 ITEM-4、cross_agent TL 裏取り済)**: `runHandover` は同日 doc が既存なら
`---` 区切りで追記する (per-session の記録を残すため上書きしない)。だが unscoped 生成では §1 (全 PLAN registry)
と §2 (全 file 一覧) が毎エントリ反復し肥大する (実例: 2026-06-19 doc は 3 エントリ 823 行)。よって
`renderHandoverScaffold(doc, { slimSummary })` を持ち、**同日 2 件目以降 (existing 非 null)** は §1/§2 を
「初出エントリ参照」の slim stub へ縮約する (§3-§6 は per-session 固有のため全文)。**`# Session Handover`
header は 1 エントリ 1 個を維持する**ので `countHandoverEntries`/`doc_entry_count` の手書き bypass 検知契約
(§2.7 gap①) は不変。oracle U-HOVER-013 が「slim で plan list 省略 + header 数不変 + §3-§6 維持」を fail-close 検査。

**累積上限化 (bounded entries、PLAN-L7-83)**: slim だけでは §3-§6 + entry 自体が積み増し続け、同日 doc が
無制限に肥大する (実例: 2026-06-19 doc は 1 日 6 entries / 1004 行)。よって `boundSameDayEntries(md, maxEntries)`
が **append 前に**同日 entry を上限 `MAX_SAME_DAY_ENTRIES` へ圧縮する。A-138 の「1 ファイル 1 registry anchor」を
尊重し、**anchor (entry[0]、full §1) + 直近 (maxEntries-2) entry を残し、中間 entry を 1 行 breadcrumb へ畳む**
(剪定分は git 履歴に全保全 = no silent cap、件数を breadcrumb で明示)。breadcrumb は `# Session Handover` に
一致しないので header 数 = bypass 検知契約は不変。**idempotent**: 過去 prune の breadcrumb は再 prune 前に
除去する (さもないと breadcrumb が保持 anchor=entry[0] の slice 末尾へ吸収され、同日反復 handover で線形累積
する — cross_agent review (codex) 指摘)。oracle U-HOVER-014 が「≤maxEntries-1/header 不在は無変更・
超過は anchor+直近保持で header=maxEntries-1・breadcrumb は header 非該当・反復 prune でも breadcrumb 1 個・
runHandover 反復で ≤MAX_SAME_DAY_ENTRIES」を検査。

**pointer-drift の恒久解消 (marker reconcile、PLAN-L7-83)**: 「今どこ」は CURRENT.json (機械ポインタ) と
`.ut-tdd/state/current-plan` marker の 2 source を持つ。従来 `checkHandoverDiscipline` は両者の drift を
**warn するのみ**で reconcile せず、marker を別 PLAN (実例: PLAN file 不在の phantom) へ立てたまま別 PLAN を完了すると
drift が毎 session 再報告された。よって handover を 2 source の単一 writer とし、`runHandover` は CURRENT.json を
書くと同時に marker を pointer へ合わせる: **`complete=true` → marker を clear** (完了 = active plan 無し →
`resolveActivePlan→null` → §2.4 I-2 の drift 判定対象外と整合) / **`--plan` 明示の in_progress → marker を
その plan へ同期** (override 由来 drift を防ぐ) / **plain in_progress (`--plan` 無し) → marker=scope source ゆえ
無変更** (無駄書き回避)。`dryRun` は marker を書かない (非破壊不変)。これで drift は handover 後に構造的に発生し得ない。
oracle U-HOVER-015 が 4 経路を fail-close 検査。

## §2.7 品質増分 (IMP-078、PLAN-L6-16 add-design) — 5 gap の機能設計

> 本機構を実 session で運用したところ 5 つの品質 gap (enforcement gap 含む) を検出 (PO 指摘「ハンドオーバーってこういう時に入らないの?」)。柱 2 (doc×機械厳格化) / 柱 3 (自動化で state 管理) に照らし、いずれも機械担保を増分する。

| gap | 現象 | 機能設計 (機械担保) |
|---|---|---|
| **① 手書き bypass 検知不可** | `ut-tdd handover` を経ず手書きで markdown / CURRENT.json を更新しても discipline が素通り | `HandoverPointer.generated_by` 署名 + `doc_entry_count` を runHandover が刻む。`checkHandoverBypass(deps)` が ① 署名欠落 (手書き pointer) / ② md entry 数 > 記録値 (手書き追記) を surface (presence/stale/drift の `checkHandoverDiscipline` と責務分離) |
| **② active-plan stale** | current-plan marker に時刻が無く、古い PLAN を active と誤解決 (例 L4-06) | current-plan 2 行目に `updated_at` を刻む (1 行目=plan_id は後方互換)。`activePlanUpdatedAt` / `activePlanStale` で鮮度判定し、checkHandoverDiscipline が「marker stale → 解決値が最新作業と乖離の恐れ」を surface |
| **③ commits=0** | session-log が commit hash を捕捉せず digest_summary.commits が常に 0 | `SessionLogDeps.headCommit` (`git rev-parse --short HEAD`) を hook が供給。onPostToolUse の commit event target に実 hash を載せ、compressPlanDigest が commits へ集計 (未供給は旧挙動 = hash 無し) |
| **④ §1-§2 session 非 scoped** | digest が session 横断で累積し、前 session の PLAN が §1-§2 に混入 | `resolveHandoverScope` に `scopeToSession` を追加し当該 session が触れた digest のみへ絞る (該当無しは全件 fallback)。`latestSessionId` が session jsonl 群から直近 session を推定、CLI `--scope-session` / `--session <id>` で指定 |
| **⑤ unknown kind** | bare plan_id (commit 推定変種) で PLAN file 完全一致せず kind=`(unknown)` ゴースト | `readPlanMeta` が完全一致不在時に同 family の slug 付き正本 (`PLAN-L7-04-handover-mechanism.md`) を listDir で family 解決 (最長 slug を正本) |

**配線**: `checkHandoverBypass` は Stop hook (session-log.ts) が `checkHandoverDiscipline` と併せて stderr surface (fail-open)。enforcement の hard 化 (doctor.ok 連動) は plan lint engine 実装時に検討 (現状 surface)。

## §2.8 引き継ぎ feedback surface (PLAN-L7-110) — DB を正本に受け取る

> 本機構を実 session の引き継ぎで運用したところ、引き継ぎ手が **prose handover (stale 化する) と共有 working tree の都度計測 (hybrid で他ランタイムが書き換え続けるため transient なノイズを掴む)** に頼り、現状を取り違えた (PO 指摘「なんで引き継ぎがちゃんとできないんだ」「そのざまだとチーム開発でトラブルが出る」)。根因は引き継ぎ基準点を commit/push 済 HEAD でなく生きた tree に置いたこと。柱 3 (自動 state/feedback) に照らし、引き継ぎは **harness.db を正本に feedback を機械で受け取る** ことで担保する。

`findings` / `quality_signals` → `emitFeedbackEvents` → `feedback_events` (受信箱) の projection は既存 (PLAN-L7-47) だが、**貯まった feedback を引き継ぎ時にエージェントへ届ける receive 経路が欠落**していた (DB に入るが読まれない)。本増分はその receive 側:

| 関数 (`src/feedback/surface.ts`) | 機械担保 |
|---|---|
| `selectTakeoverFeedback(db, {limit})` | 現在の open findings / warn\|fail signals を read-only で読み、severity 降順 (fail→warn→info) → id 昇順で安定ソートし `total` / `bySeverity` / limit 適用 `items` を返す。SessionStart で write-lock 競合を起こさないため `feedback_events` へは書き込まない |
| `renderTakeoverFeedback(result)` | open=0 なら空文字 (引き継ぎ時にノイズを出さない)。それ以外は機械可読な集計行 `📥 harness.db feedback (open=N; ...)` + 上位 N + 残件 breadcrumb |

**配線**: `runSessionStartSideEffects` (cli.ts) が SessionStart hook で `surfaceTakeoverFeedbackToStdout` を **独立 fail-open** で呼び、block を stdout へ surface (= エージェントの context へ feedback が「入る」)。db 不在 / ロック (他ランタイムの並行 rebuild) / 破損でも引き継ぎ維持処理と runtime を阻害しない。これにより引き継ぎは prose ではなく DB から feedback を受け取る。

## §3 ③ 単体テスト設計とのペア (G6 pair freeze 対象)

generates pair: `docs/test-design/harness/L7-unit-test-design.md` §1.8 **U-HOVER-001〜007** + **U-HOVER-011〜012** (IMP-078 gap) + **U-HOVER-013** (A-138 ITEM-4 同日累積 slim) + **U-HOVER-014〜015** (PLAN-L7-83 累積上限化 `boundSameDayEntries` + marker reconcile) + §1.5 **U-SLOG-006** (active-plan stale / commit hash)。本書 §2.3 の 9 関数 + §2.7 の品質増分関数 (checkHandoverBypass/countHandoverEntries/latestSessionId/activePlanStale/activePlanUpdatedAt) + §2.6 の slimSummary / boundSameDayEntries / marker reconcile を被覆 (孤児 0)。trace は G7 で双方向凍結。

## §4 carry / 次工程

- **PLAN-L7-04-handover-mechanism (add-impl)**: U-HOVER を先行 ④ テストコード化 (Red) → `src/handover/index.ts` + `ut-tdd handover` / `ut-tdd plan use` CLI + session-log 限定 amendment を Green→3 点 R で実装。
- **PLAN-REVERSE-05-handover-mechanism (reverse)**: §6.8.5/§6.8.6 詳細設計確定 + **要件 L947/L1972/L2024 の `CURRENT.md`→`CURRENT.json` 文字列修正** (正本決定は本設計 §2.4 で完了済、Reverse は文書同期のみ) + L4 external-if 整合 + §6 用語の L0 §10 back-merge。
- **Gap B の手運用期間 (carry、code-reviewer Minor 反映)**: `ut-tdd plan use` / `ut-tdd handover` の CLI 実体は L7-04 (add-impl) が generates する (L6 設計 PLAN は src を generates しない bottom-up 順)。**L7-04 完了までは Gap B は「設計済・未配線」であり、digest 活性化は手運用 (current-plan を手で置く) になる**ことをユーザーへ明示する。
- **依存外 (本機能では作らない、carry)**: state DB 登録トリガ (FR-L1-07 hook) は別 FR。本機構は digest→handover 橋までを範囲とし、DB 登録は §6.8.6 結節点の別経路として後続。
- **lint**: §6.8.5 検証「PLAN completed なのに handover 追記が無い → plan-lint warn」+ §5.3「CURRENT.* 24h stale warn」は `handoverStale` を基盤に lint engine 実装時 (`src/plan/lint.ts` stub) に配線。現状は human-binding。
