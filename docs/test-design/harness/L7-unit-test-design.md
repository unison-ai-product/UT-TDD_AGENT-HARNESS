---
layer: L6
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/
parent_doc: docs/plans/PLAN-L6-00-master.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l6_function_spec: docs/design/harness/L6-function-design/function-spec.md
related_l6_edge_case: docs/design/harness/L6-function-design/edge-case.md
next_pair_freeze: L6
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-29
updated: 2026-05-29
---

## 2026-06-09 L6 pair-scope addendum

The historical pair text below was written when L6 only had `function-spec` and `edge-case`. For G6 readiness, the current L6 pair scope is the full directory `docs/design/harness/L6-function-design/*.md`, including add-design slices PLAN-L6-03..21.

This L7 document remains the single pair artifact for L6 and must carry a U-* oracle family for every L6 design artifact listed in `docs/plans/PLAN-L6-00-master.md` "L6 completion scope addendum".

The additional SQLite/reference-feedback/search/drive-log/skill-metric requirements are covered through `docs/design/harness/L6-function-design/fr-unit-coverage.md` and the U-FR-L1-* rows added at the end of this document. This is coverage of the function-design contract, not proof that every L7 implementation test already exists.

# UT-TDD Agent Harness — L7 単体テスト設計 (④ / U-*)

> **layer (作成層 = V-pair key)**: L6 (機能設計) / **executed_at_layer (実施層)**: L7 (単体テスト — 実装スプリント内で TDD Red 先行) / **artifact**: ④ テスト設計 (V-model 右、② L6 機能設計 と対)
> **pair (V-model L6↔L7)**: `docs/design/harness/L6-function-design/{function-spec,edge-case}.md` 2 sub-doc ↔ 本書 1 doc
> **status correction (2026-06-09 / A-118)**: frontmatter status is `confirmed`. The historical "draft / placeholder skeleton" wording below is superseded by the L6 pair-scope addendum above and by the U-* oracle families added for all current L6 design docs. Remaining implementation-detail expansion is L7 carry, not Phase 2 pair incompleteness.
> **PLAN**: `docs/plans/PLAN-L6-{01,02}-*.md` の pair_artifact / DoD で本書参照
> **特殊性**: L6↔L7 は最短ペア。L7 は単体テスト設計と実装スプリントが同層 — 本書 U-* は L7 entry で先行 ④ テストコード (TDD Red、§1.10 line 671) に変換される oracle。

## §0 量閉じ原則 (L6 ↔ L7)

L6 機能設計の各**関数 signature + DbC + edge** が L7 単体テスト (U-*) で被覆されること (孤児 = 0)。DbC 契約から test oracle を導出 (document-system-map §3)。

- **function-spec §1/§2**: 関数 signature + pre/post + pseudocode → 契約遵守 U-* 必須
- **function-spec §4**: rule engine 10 型 (IMP-033) → rule 単位 U-* 必須
- **edge-case**: `@edge-normal/error/boundary/throws` (4 観点) → edge 単位 U-* 必須
- 孤児 = 0 (`ut-tdd vmodel lint` の edge 5-8 照合に接続)

## §1 単体テスト (U-*) — placeholder skeleton

> L7 = 個別関数の **単体**を対象 (最小単位、純粋関数中心)。既存 vitest 66 test が seed (analyzeX/evaluateAgentGuard/detectMode/frontmatter)。個別 U ケースは L7 entry で展開。

### §1.1 U-FUNC (function-spec §1 関数 signature 由来)
| U-ID (候補) | 検証対象 | oracle (DbC) |
|---|---|---|
| U-FUNC-01 | `analyzeX` 純粋性 + post (orphans/totals) | 同入力→同出力、orphans==[]⟺ok (既存 seed) |
| U-FUNC-02 | `evaluateAgentGuard` allowlist/model/family | block 判定 + fail-close (既存 seed) |
| U-FUNC-03 | `detectMode` mode 決定 | mode∈4種、副作用なし (既存 seed) |
| U-FUNC-04 | `lintPlan`/`lintVmodel` 本実装 | schedule lint + PLAN governance/frontmatter strict gate + G1/G3 trace gate / 12 edge (L7.2/L7.3 implemented) |

### §1.2 U-CORE (function-spec §2 pseudocode 由来)
| U-ID (候補) | 検証対象 | oracle |
|---|---|---|
| U-CORE-01 | `planDraft` pseudocode (§2.1) | pre 違反→exit1 / 原子性 (失敗時 file 不変) |
| U-CORE-02 | `runGate` 決定論 (§2.2) | AI 非依存、V-model 順序 / 証跡生成 |
| U-CORE-03 | `traceCheck` 12 edge (§2.3) | 孤児→fail-close exit1 |
| U-CORE-04 | `sprintCheck` Red-first (§2.4) | Red commit precedes Green |

### §1.3 U-RULE (function-spec §4 IMP-033 rule engine 由来)
| U-ID (候補) | 検証対象 | oracle |
|---|---|---|
| U-RULE-01 | 10 rule 型 各純粋関数 | pair-exists/ref-resolves/trace-bidir/... 各 RuleResult |
| U-RULE-02 | auto-enroll (§4.3) | frontmatter scan → 該当 rule 自動適用 |
| U-RULE-03 | 既存 5 lint の rule 吸収 | g3-trace 等が rule インスタンスとして等価 |

### §1.4 U-EDGE (edge-case 由来)
| U-ID (候補) | 検証対象 | oracle |
|---|---|---|
| U-EDGE-01 | `@edge-normal` 4 観点 | 正常代表 → AT-01 trace |
| U-EDGE-02 | `@edge-error` fail-close | 異常 → AT-02 / exit code |
| U-EDGE-03 | `@edge-boundary` | 境界 → AT-03 (空入力/不正 frontmatter/path 不在/循環) |

### §1.5 U-SLOG (session-log 由来、PLAN-L6-03 add-design / session-log.md §3)
| U-ID | 検証対象 | oracle (DbC) |
|---|---|---|
| U-SLOG-001 | `resolveActivePlan` | state ファイル優先 / branch (`add/<plan>`) fallback / 解決不能=`null` (throw しない) |
| U-SLOG-002 | `recordEvent` | 正常 append / **不正入力でも throw せず 0 (fail-open)** / 秘匿: `summary` に Bash 引数値・credential・PII が含まれない (`sanitize` 後) |
| U-SLOG-003 | `compressPlanDigest` | events→digest 集計正当 / 同一 (plan,session) 再適用で **idempotent** (event 単位 high-watermark で二重計上なし、U-SLOG-008) / `prev` マージ / `updated_at = max(prev, events)` 巻き戻りなし / `failures` は ts dedupe |
| U-SLOG-004 | `onStop` | session 終了で `.ut-tdd/logs/plan/<plan_id>.digest.json` が生成/更新、常に 0 / **plan_id=null のみの session は digest を書かない** |
| U-SLOG-005 | `onSessionStart` | session_start event を append し常に 0 (fail-open)、I/O 失敗でも throw しない |
| U-SLOG-006 | `setActivePlan`/`activePlanUpdatedAt`/`activePlanStale`/`onPostToolUse` (IMP-078 gap②③) | setActivePlan が current-plan 2 行目に updated_at を刻む (1 行目=plan_id 不変、resolveActivePlan は 1 行目読取) / activePlanStale が maxHours 超で true・旧形式 (timestamp 無し 1 行) は false (後方互換) / onPostToolUse の git commit が `headCommit` hash を commit event target に載せる (未供給は target 無し=旧挙動) |
| U-SLOG-007 | `src/cli.ts session start` / `hook post-tool-use` / `session summary` + `.claude/settings.json` + `ut-tdd codex --execute` | Claude settings の SessionStart/PostToolUse/Stop が `.claude/hooks/session-log.ts` 直接実装ではなく package-local `src/cli.ts` entrypoint を指す / temp repo で `ut-tdd plan use` → `session start` → `hook post-tool-use` → `session summary` を実行すると `.ut-tdd/logs/plan/<plan_id>.digest.json` が生成され、session_start/tool_use と touched file が集計される / fake `codex` を PATH に置いた temp repo で `ut-tdd codex --execute` と `ut-tdd codex --task-file <path> --execute` を実行すると、Codex wrapper も同じ session lifecycle を記録し、legacy source raw Codex guard との共存用に `legacy source_ALLOW_RAW_CODEX=1` + `legacy source_RAW_CODEX_REASON=ut-tdd-runtime-adapter-wrapper` を渡す / `ut-tdd codex --plan <id> --execute` は `<id>` を session-log の plan_id に使い、provider CLI へ `--plan-id` を渡さない |
| U-SLOG-008 | `compressPlanDigest` (event 単位 high-watermark、PLAN-L7-80) | `session_watermarks[sid]` = その session の matching event を畳み済み件数として持ち、同一 session が複数回 summarize (複数 Stop) されてもログ伸長分の増分のみ計上する (旧 session 単位 fold は 2 回目以降を全 skip = 過少計上) / 増分なし再適用は idempotent / pre-L7-80 digest (session_watermarks 無し) は migration として既計上分 (ts <= updated_at) を再計上せず新規分のみ計上する |

### §1.6 U-FSF (forced-stop フィードバック由来、PLAN-L6-04 add-design / forced-stop-feedback.md §2-§3)
| U-ID | 検証対象 | oracle (DbC) |
|---|---|---|
| U-FSF-001 | `detectDanglingTurn` | **純関数**。session_end で閉じたターン=`{dangling:false, from:null}` / `tool_use` 後に session_end 無し=`{dangling:true, from:<最後の session_end 直後の ts>}` / **`session_end` 皆無で `tool_use`/`user_prompt` あり=`{dangling:true, from:events[0].ts}`** / **`user_prompt` のみ trailing (session_end なし)=`{dangling:true}`** / 空 events=`{dangling:false, from:null}` |
| U-FSF-002 | `recordForcedStop` | 正常時 `forced_stop` event を append / **不正入力でも throw せず (fail-open)** / **append された entry に自由テキスト本文 (`message`/`text`/`content`) を含まず、`next_message_ref` が文字列で存在** |
| U-FSF-003 | `classifyFeedback` | 非同期。mock classifier で `mistake`/`feedback` + `attention` 反映 / **classifier が reject/throw/不正出力なら `feedback`+`low`+`unclassified` に倒す** (取りこぼし回避、強制停止 default=やらかし側) |
| U-FSF-004 | `recordFeedback` | `category="feedback"` のみ記載 (`recovery_proposed=attention==="high"`) / **`category="mistake"` は no-op** / **`plan_id=null` は書かない (skip)** / 同一 `ts` idempotent / `summary`/`reason` は `sanitize` 済 (生文・PII・credential なし) |
| U-FSF-005 | `pendingRecoveryProposals` | `recovery_proposed===true && resolved_at===undefined` のみ返す / `resolved_at` 設定済は除外 / **不正 JSON 行はスキップし valid 行のみ返す** / 空時 `[]` |
| U-FSF-006 | `emitClassifyRequest` | managed pmo-haiku 契約 (`role="pmo-haiku"` / `text` / `output_schema.category` / `output_schema.attention`) を含む |
| U-FSF-007 | `scanDanglingStops` | dangling session のみ `forced_stop` 記録 / 正常終了は対象外 / current session 除外 / `forced_stop` 既存は再記録しない (idempotent) / listDir 失敗でも throw せず (fail-open) |

### §1.7 U-SETUP (ut-tdd setup solo/team 由来、PLAN-L6-05 add-design / setup-solo-team.md §2-§3)
| U-ID | 検証対象 | oracle (DbC) |
|---|---|---|
| U-SETUP-001 | `detectProjectScale` | **never throws**。gh mock: `owner.type=Organization` → `ownerType:"Organization"` / gh 失敗 (未認証/不在) → `ownerType:"unknown", collaborators:null` (throw しない) / **token を読まない** |
| U-SETUP-002 | `recommendPhase` | **純関数**。org OR collaborators>1 OR hasCodeowners OR `hasBranchProtection===true` → `0-B`(high) / `User` かつ collaborators<=1 → `0-A`(high) / unknown 信号 → `0-A`(low、安全フォールバック) / **`hasBranchProtection===null`・`collaborators===null` 単独 (他信号 User+collab<=1) → 0-B にしない (境界)** |
| U-SETUP-003 | `planSetup` | `0-A`=共通 (A 種別) のみ / `0-B`=共通(A)+CODEOWNERS(B)+branch-protection script + `GithubAction{applied:false}` / **teams 名が CODEOWNERS GeneratedFile に反映** |
| U-SETUP-004 | `emitSetup` | `dryRun=true` → `fs.write` 呼ばれず path 一覧のみ返す / `dryRun=false` → 期待ファイル群を書く / **生成内容に token 文字列を含まない** / 既存上書きは confirm 経由 (内部 helper `renderArtifacts` の render 内容もここで被覆) |
| U-SETUP-005 | `recordSetupState` | setup.json に phase/decidedBy/signals を書く / **signals が 4 フィールド (ownerType/collaborators/hasCodeowners/hasBranchProtection) 以外を含まない (strip 検証)** / token 非含 / 再読込で同一 phase / **再実行 (phase 変更) → 上書きで最新 phase のみ読める (append しない)** |
| U-SETUP-006 | `applyBranchProtection` | `apply≠true` → `{applied:false, reason:"emit-only"}` (gh 呼ばれない) / **`isInteractive≠true` かつ `apply=true` → `{applied:false, reason:"non-interactive"}` (gh 呼ばれない)** / 対話下でも admin/auth/confirm 欠落 → 実行しない |
| U-SETUP-007 | `runSetup` (orchestration) | ①フラグあり→フラグ値採用 / ②フラグ無し+対話→confirm 結果 / ③フラグ無し+非対話→`0-A` (fallback) / ④`apply=true`+非対話→`applied:false` (I-2 配線ミス検出) |
| U-SETUP-009 | `planSetup` / `emitSetup` | `0-A` の生成計画に clean adapter テンプレ (`AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` / `.claude/settings.json`) が含まれる。dry-run preview は adapter path を返し、dogfood repo 名や machine-local absolute path を含まない。 |
| U-SETUP-010 | `emitSetup` | 既存 consumer `AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` は既存行を verbatim 保全し、`<!-- UT-TDD:managed:start -->`〜`<!-- UT-TDD:managed:end -->` の managed block だけを追加/更新する。既存 `.claude/settings.json` は confirm なしに上書きしない。同じ setup を 2 回走らせても doc 内容は no-op。 |
| U-SETUP-011 | `buildCleanDistributionPlan` | clean distribution channel は `clean-repo-plus-signed-tarball`。artifact path は LICENSE / package / src / adapter templates を含み、dogfood (`docs/plans` / `docs/design/harness` / `docs/test-design` / `.ut-tdd`) と UI (`src/web`) を含まない。release integrity artifact (`tar.gz` / `sha256` / `sig`) を要求する。 |
| U-SETUP-012 | `buildConsumerReadinessPlan` | Bun>=1.3 / git / gh / runtime CLI を preflight として診断し、gh は GitHub setup 用 warning、Bun/git/runtime は blocking。rollback managed paths、tag-pin contract、CI self-sufficiency、monorepo package-root 判定、全 smoke scenario を返す。 |
| U-SETUP-013 / AT-DIST-001 | `tests/distribution-acceptance.test.ts` | Local clean distribution acceptance smoke: planned clean artifacts を temp repo にコピーし、`bun install --frozen-lockfile`、`bun src/cli.ts status --json`、`bun src/cli.ts distribution plan --tag v0.1.0 --json`、`bun run typecheck` が fake provider CLI 付きで通ること。外部 clean GitHub repo 作成 / tag push / signed tarball publish は実行しない。source repo 用 full `doctor` は dogfood PLAN/design/test-design/runtime artifact を除外する clean distribution の受け入れ条件には含めず、consumer doctor profile が必要なら別 PLAN とする。 |

### §1.8 U-HOVER (handover 記録機構由来、PLAN-L6-06 add-design / handover-mechanism.md §2-§3)
| U-ID | 検証対象 | oracle (DbC) |
|---|---|---|
| U-HOVER-001 | `resolveHandoverScope` | **never throws**。current-plan state 有 → `active_plan` 解決 / `.ut-tdd/logs/plan/*.digest.json` を `listDir` で集約 / **壊れ JSON 行・不在は skip** / 無 → `{active_plan:null, digests:[]}` |
| U-HOVER-002 | `buildPointer` | **純関数**。`digest_summary` = 対象 digest の commits/files/failures **件数**集計 / **`digests` 非空なら active_plan の null/非 null に関わらず集計 / `digests` 空のときのみ `digest_summary=null`** / `active_plan` は scope 値を透過 (null 可) / `updated_at=now`。**edge: `active_plan=null` だが `digests` 非空 → digest_summary は集計値 (null にしない)** |
| U-HOVER-003 | `scaffoldFromDigests` | **純関数**。digest.commits/files_touched → `deliverables` / planMeta.kind/title → `plans.summary` / **`next_actions`/`carry`/`po_decisions`/`do_not_break` が空配列 (human 未記入)** |
| U-HOVER-004 | `renderHandoverScaffold` | **純関数**。§6.8.5 の 6 セクション (①-⑥) を含む / ③-⑥ に `TODO(human)` placeholder / **具体 oracle: 入力 `HandoverDoc.plans[0].summary` に `token=secret123` を含めると出力は `secret123` を含まず `token=***` を含む (render 時 `sanitize` 適用の defense-in-depth、tracked md への流出ゼロ)** |
| U-HOVER-005 | `handoverStale` | **純関数**。`updated_at=null`/parse 不能 → true / 24h 超 → true / 24h 以内 → false / **境界 (now-updated_at=24h ちょうど) は stale でない (`>` 判定)** / **具体 oracle: `now`/`updated_at` を UTC ISO8601 で与え `Date.parse` 数値差分で判定 (辞書順比較でない)** |
| U-HOVER-006 | `setActivePlan` + `inferPlanFromCommit` | `setActivePlan` が `.ut-tdd/state/current-plan` を書き `resolveActivePlan` が同値を読む (**round-trip**) / **`null`+`removeFile` 有 → file 削除で clear / `null`+`removeFile` 無 → 空文字書込 → `resolveActivePlan` が空文字を null 相当に落とす (両 clear 経路を検証)** / `inferPlanFromCommit`: `PLAN-L6-06-...` 抽出 / 非該当文字列 → null / **`-F -` heredoc 様 (本文に PLAN 文字列なし) → null** |
| U-HOVER-007 | `runHandover` (orchestration) | **`dryRun=true` → md/CURRENT.json を書かず `content` を返す (`written=[]`、非破壊)** / 通常 → md **追記** (既存上書きしない) + CURRENT.json 更新 / **`complete=true` → CURRENT.json の `status==="completed"` かつ `active_plan === (args.planId ?? scope.active_plan)`** |
| U-HOVER-008 | `sameFamilyPlan` / `dedupeDigests` (IMP-048) | `sameFamilyPlan`: 同一 id → true / bare ⊂ slug (`-` 境界付き prefix) → true / `bare が slug の prefix だが `-` 境界でない (例: `PLAN-L7-0` vs `PLAN-L7-04`) → false (誤マッチ防止)` / 無関係 → false / **対称 (a,b)=(b,a)**。`dedupeDigests`: 同 family の bare/slug ゴーストを **最長 id** へ union 集約 (commits/files_touched/sessions の union、files_touched は重複除去) / 無関係 PLAN は別 group のまま残す / **推移的マージ: bare 無しで slug 2 種 + bare が後着でも全部 1 group へ収束 (順序非依存)** |
| U-HOVER-009 | `resolveHandoverScope` scopeToActive (IMP-048) | 既定 (option 無し): `dedupeDigests` のみ → bare/slug は 1 件に畳まれ別 PLAN は残る (digest 数 = family 数 + 無関係 PLAN 数) / `scopeToActive: true`: **active family の digest のみへ絞る** / **scopeToActive だが active family が digest に無い → 全件 fallback (空 handover 回避)** |
| U-HOVER-010 | `readPointer` / `checkHandoverDiscipline` (IMP-047) | `readPointer`: 不在 → null / 壊れ JSON → null / 正常 → object。`checkHandoverDiscipline`: **活動なし (digest 空) → 警告ゼロ (規律対象外)** / 活動あり + CURRENT.json 不在 → `"handover 未生成"` warn / 活動あり + fresh pointer (同 family) → 警告ゼロ / 活動あり + stale pointer → `"stale"` を含む warn / 活動あり + pointer が別 plan → `"drift"` を含む warn / **活動あり + fresh pointer だが `active_plan=null` (完了済正常形) → drift 無音 (I-2: null は family 比較から除外)** |
| U-HOVER-011 | `checkHandoverBypass` / `countHandoverEntries` (IMP-078 gap①) | pointer 不在 → 警告ゼロ (discipline 担当) / `generated_by` 欠落 (手書き pointer) → `"bypass"` warn / `generated_by` 一致 + entry 数一致 → 警告ゼロ / latest_doc の `# Session Handover` 数 > `doc_entry_count` (手書き追記) → `"mismatch"` warn。`countHandoverEntries`: 見出し数を数える / null→0 |
| U-HOVER-012 | `resolveHandoverScope` scopeToSession / `latestSessionId` (IMP-078 gap④) | `scopeToSession`: 指定 session が触れた digest のみへ絞る / 該当無し → 全件 fallback (空 handover 回避)。`latestSessionId`: session jsonl 群から最新 event ts の session_id を返す / 不在 → null / 壊れ行 skip。**runHandover の readPlanMeta family 解決 (gap⑤): bare plan_id digest でも slug PLAN file を解決し kind を埋める (unknown 防止)** |
| U-HOVER-013 | `renderHandoverScaffold` slimSummary / `runHandover` 同日累積 (A-138 ITEM-4) | `slimSummary=true` → §1/§2 を「同日 first entry 参照」stub に縮約し plan list / deliverables 本体を省く (`§3-§6` は全文維持) / **`# Session Handover` header は 1 個維持** (`countHandoverEntries` 不変)。`runHandover`: 同日 2 件目 (existing 非 null) は slim render + 追記、`doc_entry_count` は header 数と一致 (bypass 照合契約不変) |
| U-HOVER-014 | `boundSameDayEntries` / `runHandover` 累積上限 (PLAN-L7-83) | **純関数**。entry 数 ≤ `maxEntries-1` / `# Session Handover` header 不在 → 入力をそのまま返す (圧縮不要) / 超過 → **anchor (entry[0]) + 直近 (maxEntries-2) を残し中間を 1 行 breadcrumb へ畳む** (`countHandoverEntries` = `maxEntries-1`) / **breadcrumb は header に一致せず `countHandoverEntries`/`doc_entry_count` 契約を壊さない** / breadcrumb 文言で剪定件数を明示 (no silent cap)。`runHandover`: 反復 append でも同日 doc の header 数 ≤ `MAX_SAME_DAY_ENTRIES`・定常で上限ちょうど・`doc_entry_count` は md header 数と一致 |
| U-HOVER-015 | `runHandover` marker reconcile (drift 恒久解消、PLAN-L7-83) | **`complete=true` → `current-plan` marker を clear** (`resolveActivePlan→null`) し `checkHandoverDiscipline` が drift を出さない / **`--plan X` の in_progress → marker = X へ同期** (override 由来 drift 解消) / **plain in_progress (`--plan` 無し) → marker 無変更** (無駄書き回避) / **`dryRun=true` → marker を書かない** (非破壊不変)。reconcile した marker path は `written` に計上 (透明性) |

### §1.9 U-SLOT (agent-slots 由来、PLAN-L7-08 / IMP-050)

| U-ID | 関数 | oracle |
|------|------|--------|
| U-SLOT-001 | `loadSlots` | 不在 → `[]` / 壊れ JSON → `[]` / 非配列 (`{}` 等) → `[]` / **never throw** |
| U-SLOT-002 | `fireSlot` / `releaseSlot` | `fireSlot`: running slot を追記し永続化、返り値 `status="running"` / `released_at=null` / `role` 省略 → `null`。`releaseSlot`: terminal status + `released_at` 記録 + `exit_code` 記録 / 返り `true`。対象なし → `false` / 既 release 済 (2 回目) → `false` (idempotent) |
| U-SLOT-003 | `listActiveSlots` / `listStaleSlots` | `listActiveSlots`: `status==="running" && released_at===null` のみ返す。`listStaleSlots(deps, 5)`: active かつ `(now - fired_at) / 60000 > 5` のみ / **`>` 判定: ちょうど 5 分は stale でない** / 閾値内の fresh slot は含まない |
| U-SLOT-004 | `peakParallel` | 時間的に重なる 3 slot → peak `3` / 直列 (非重なり) → peak `1` / `released_at=null` (実行中) → peak に算入 (2 slot 両方 null → `2`) |
| U-SLOT-005 | `exceedsParallelLimit` | active < `DEFAULT_MAX_PARALLEL` → `false` / active `=== DEFAULT_MAX_PARALLEL` → `true` (`>=` 判定) / `max` override: `exceedsParallelLimit(deps, 100)` で `false` |
| U-SLOT-006 | `recordGuardFire` | active が `max-1` の時点では `exceeded=false` / 次の fire で active `=== max` → `exceeded=true` / **stale な `agent_guard` slot は `cancelled` に自動失効し active から外れる** (stale 持続汚染防止) / stale 失効後の `activeCount` は失効前より小さい |
| U-SLOT-007 | `sweepStaleGuardSlots` | セッション末尾の dangling guard slot (閾値超) を `cancelled` 失効し件数を返す / 閾値内の guard slot・非 guard slot・既 release は失効しない / 対象なし → `0` / 冪等 (二度目 `0`) |
| U-SLOT-008 | `releaseOldestGuardSlot` | 最古の running guard slot を `completed` で release し active を 1 減 (FIFO) / `released_at=now` / 非 guard slot は対象外 / 対象なし → `null` (idempotent) / **SubagentStop n 回 = active を n 件閉じても count は厳密** (個体同定不要、IMP-106) |

### §1.10 U-TEAM (team schema 由来、PLAN-L7-08 / IMP-050)

| U-ID | 関数 | oracle |
|------|------|--------|
| U-TEAM-001 | `teamDefinitionSchema` | `strategy` 省略 → `"sequential"` (default) / `max_parallel` 省略 → `8` (default) / `members` 空配列 → zod throw (reject) / 不正 `role` (許可リスト外) → throw / 不正 `strategy` (`"burst"` 等) → throw / `serialize_after` + `serialization` (3 条件フィールド) を含む入力 → 受理 (`parsed.serialization.downstream_dependency===true` / `parsed.members[1].serialize_after==="se"`) |
| U-TEAM-002 | `mustSerialize` | 3 条件すべて `false` → `false` / `file_conflict=true` → `true` / `downstream_dependency=true` → `true` / `shared_state=true` → `true` / `undefined` → `false` |
| U-TEAM-003 | `recommendTeamLaunch` | `hybrid` + trivial/simple task → `should_launch=false` / `hybrid` + risk or standard+ task → `should_launch=true` with cross-provider `definition` / non-`hybrid` → `should_launch=false`, `trigger="unavailable"` |

### §1.11 U-BACKFILL (backfill-pairing lint 由来、IMP-051)

| U-ID | 関数 | oracle (DbC) |
|------|------|--------------|
| U-BACKFILL-001 | `parseRequires` / `parseGlossaryTerms` | `parseRequires`: YAML `requires:` list の path を配列で返す / `requires: []` → `[]` / section 無し → `[]`。`parseGlossaryTerms`: `§6 用語更新` section 内の `- **term**:` の term のみ抽出 / 次 heading 以降は含まない / section 無し → `[]` |
| U-BACKFILL-002 | `parsePlan` | frontmatter の `plan_id`/`kind`/`status` + `parseRequires` + `parseGlossaryTerms` を `ParsedPlan` に構造化。`plan_id` frontmatter 有り → その値 / `requires` / `glossaryTerms` が正確に取れること |
| U-BACKFILL-003 | `KIND_BACKFILL` マトリクス | `"add-impl"` → `"required"` / `"refactor"` → `"conditional"` / `"troubleshoot"` → `"conditional"` / `"impl"` → `"none"` / `"design"` → `"none"` / `"reverse"` → `"none"` / `"recovery"` → `"none"` の全種確認 |
| U-BACKFILL-004 | `analyzeBackfill` | ① required (add-impl) に Reverse requires 有 → `reverseOrphans=[]` / `ok=true` / ② required (add-impl) に Reverse 無 → `reverseOrphans=[{plan_id, kind}]` / `ok=false` / ③ conditional (refactor) に Reverse 無 → `conditionalPending` に 1 件 / `reverseOrphans=[]` / `ok=true` (warn のみ、ok を落とさない) / ④ §6 用語が glossary 未 merge → `glossaryGaps=[{plan_id, term}]` / `ok=false` / ⑤ `status="archived"` → 対象外 (reverseOrphans に含まれない) |
| U-BACKFILL-005 | `backfillMessages` | 孤児なし (空 plans) → `"OK"` を含む文言 1 件 / reverseOrphan あり → `"Reverse 無き impl"` を含む warn 文言 |
| U-BACKFILL-006 | `loadBackfillDocs` + `analyzeBackfill` (実 repo 回帰ガード) | `loadBackfillDocs()` で実 `docs/plans/` 全 PLAN を読み `analyzeBackfill` を実行 → `reverseOrphans=[]` / `glossaryGaps=[]` (実 repo の back-fill 完全性を CI で継続確認) |

### §1.12 U-SCRUMREV / U-PROP (governance enforcement lints 由来、PLAN-L7-10 / IMP-064/065)

> pair = L6 governance-enforcement.md §2。A=scrum-reverse / C=propagation。B (backfill hard) は U-BACKFILL-006 + doctor.ok 連動で被覆。

| U-ID | 関数 | oracle (DbC) |
|------|------|--------------|
| U-SCRUMREV-001 | `parseLinks` / `parseSrPlan` | `parseLinks`: `requires:` + `references:` の YAML list を 1 集合へ / frontmatter の `decision_outcome`/`promotion_strategy` を inline コメント除去で抽出 |
| U-SCRUMREV-002 | `analyzeScrumReverse` (pocOrphans) | confirmed poc (reuse-with-hardening) を指す reverse 無 → `pocOrphans` 1件/`ok=false` / reverse 有 → 0件/`ok=true` / `promotion_strategy=redesign` → 孤児にしない / 非 confirmed (pivot) → 対象外 |
| U-SCRUMREV-003 | `analyzeScrumReverse` (badReverseRefs) | reverse が confirmed でない poc (pivot) を参照 → `badReverseRefs` 1件/`ok=false` / `status=archived` → 対象外 |
| U-SCRUMREV-004 | `scrumReverseMessages` | 孤児なし → `"OK"` / 孤児あり → `"Reverse 合流が無い"` 文言 |
| U-SCRUMREV-005 | `loadSrPlans`+`analyzeScrumReverse` (実 repo 回帰ガード) | 実 `docs/plans/` で `pocOrphans=[]` / `badReverseRefs=[]` (confirmed poc は Reverse 合流済、redesign 除く) |
| U-PROP-001 | `extractSignals` | `\| signal \| mode \|` ヘッダのテーブルのみから signal 列 token 抽出 / 別表 (reverse/fullstack) と interrupt subtype は除外 |
| U-PROP-002 | `analyzePropagation` | 両 doc 一致 → `ok=true` / concept のみ → `conceptOnly`+`ok=false` / requirements のみ → `requirementsOnly`+`ok=false` |
| U-PROP-003 | `propagationMessages` | 一致 → `"OK"` / 不一致 → `"未伝播"` 文言 |
| U-PROP-004 | `loadPropagationDocs`+`analyzePropagation` (実 repo 回帰ガード) | concept §2.6 ⇔ requirements §7.8.1 の signal 語彙一致 (`conceptOnly=[]`/`requirementsOnly=[]`) |

### §1.13 U-VPAIR (vmodel pair-freeze lint 由来、PLAN-L7-11 / IMP-067)

> pair = L6 vmodel-pair-freeze.md §1-§3。design doc ⇔ test-design doc の `pair_artifact` 双方向整合・孤児0 (設計層 pair freeze、G1-G6)。G7 の 4 artifact 12-edge trace はスコープ外。

| U-ID | 関数 | oracle (DbC) |
|------|------|--------------|
| U-VPAIR-001 | `loadPairDocs` | `docs/design/harness/**` + `docs/test-design/harness/**` の frontmatter (path/layer/pair_artifact) を読む / `README.md`・`roadmap.md` を対象外 / inline コメント (`pair_artifact: self  # ...`) を除去して値抽出 |
| U-VPAIR-002 | `analyzePairFreeze` (pair-missing/ref-unresolved) | layer L1-L6 sub-doc で pair_artifact 欠落 → `pair-missing` 1件/`ok=false` / pair_artifact path 不実在 → `ref-unresolved`/`ok=false` |
| U-VPAIR-003 | `analyzePairFreeze` (trace-bidir) | design→test-design に対し test-design の dir 集合参照が design の所在 dir を含む → pair 成立 / 逆参照無 → `trace-orphan`/`ok=false` |
| U-VPAIR-004 | `analyzePairFreeze` (self-pair / L2 group) | `pair_artifact: self` → 孤児にしない / L2 group (wireframe 参照) は hub が self-pair なら成立 |
| U-VPAIR-005 | `loadPairDocs`+`analyzePairFreeze` (実 repo 回帰ガード) | 実 repo で `orphans == []` (全 V-pair が双方向、孤児0) |
| U-VPAIR-006 | `pairFreezeMessages` | 孤児なし → `"OK"` / 孤児あり → reason 別文言 (`pair 欠落`/`参照不実在`/`逆参照なし`) |

### §1.14 U-VTRIG (検証発火 = 層群 freeze の機械発火、PLAN-L7-12 / IMP-068)

> pair = L6 vmodel-pair-freeze.md §7。V-model 層群 (L0-L3 / L4-L6 / L0-L6) の Forward freeze 完了を検知し検証サイクル発火を surface。

| U-ID | 関数 | oracle (DbC) |
|------|------|--------------|
| U-VTRIG-001 | `analyzeVerificationGroups` | 層群ごとに confirmed/draft/placeholder を集計、total = 層群内 design sub-doc 数 |
| U-VTRIG-002 | `analyzeVerificationGroups` (frozen) | draft 0 + 孤児0 + confirmed≥1 → frozen=true / placeholder は park で発火を妨げない / draft 1+ → frozen=false |
| U-VTRIG-003 | `analyzeVerificationGroups` (孤児) | 層群に pair 孤児 → frozen=false |
| U-VTRIG-004 | `verificationGroupMessages` | frozen → `"freeze 完了"`+`"検証サイクル発火可"`+park 表示 / 未 → `"Forward 進行中"` |
| U-VTRIG-005 | `loadPairDocs`+`analyzeVerificationGroups` (実 repo ガード) | L0-L3 frozen=true (A-100、L2 park) / L4-L6 frozen=false |

### §1.15 U-REVIEW / U-XREVIEW / U-TORDER (review 前置の機械強制、IMP-071 + IMP-076 + IMP-077)

> ペア = `review-evidence.md` / `cross-review-enforcement.md` / `test-before-review.md` (L6↔L7)。review 前置証跡 (review_evidence) の presence (IMP-071) + cross_agent distinctness (same_model_approval、IMP-076) + 定量テスト→定性レビュー順序 (tests_green_at≤reviewed_at、全駆動モデル普遍、IMP-077) を機械保証する純関数の oracle。

| U-ID | 対象関数 | DbC oracle |
|---|---|---|
| U-REVIEW-001 | `hasReviewEvidence` | `review_evidence:` 直後に `- reviewer:` entry ≥1 → true / key だけ・無し → false (presence のみ、shape は zod) |
| U-REVIEW-002 | `parseReviewPlan` | plan_id/kind/status/hasEvidence を frontmatter から抽出 |
| U-REVIEW-003 | `analyzeReviewEvidence` (missing) | confirmed の design/impl 系で evidence 無し → `missing` + `ok=false` |
| U-REVIEW-004 | `analyzeReviewEvidence` (ok) | design/add-design/impl/add-impl すべて evidence あり → `missing=[]`/`ok=true` |
| U-REVIEW-005 | `analyzeReviewEvidence` (対象外) | draft (未確定) / poc・charter・reverse (非 design-impl) / archived は missing にしない (過検知回避) |
| U-REVIEW-006 | `loadReviewPlans`+`analyzeReviewEvidence` (実 repo CI fail-close ガード) | hard 化後 (IMP-071): 実 repo の confirmed design/impl PLAN は全件 review_evidence あり (`missing==[]`) + cross_agent 違反0 (`crossReviewViolations==[]`)。以後 review 証跡なし PLAN を足すと red |
| U-REVIEW-007 | `analyzeReviewEvidence` (stale approval、IMP-080) | draft / 降格 PLAN に `verdict=approve` が残る → `staleApprovalViolations` + `ok=false` |
| U-REVIEW-008 | `analyzeReviewEvidence` (stale approval ok) | confirmed + approve / draft + 証跡なし → stale approval ではない |
| U-XREVIEW-001 | `analyzeReviewEvidence` (cross_agent ok) | cross_agent で worker_model≠reviewer_model → `crossReviewViolations=[]` / `ok=true` (IMP-076) |
| U-XREVIEW-002 | `analyzeReviewEvidence` (same_model) | cross_agent で worker≡reviewer の同一 model → violation / `ok=false` (same_model_approval、concept §2.1.2.1) |
| U-XREVIEW-003 | `analyzeReviewEvidence` (model 欠落) | cross_agent で model 欠落 → violation (単体 runtime は相異 model 供給不可 = cross_agent 僭称を弾く) |
| U-XREVIEW-004 | `analyzeReviewEvidence` (非 cross_agent) | intra_runtime_subagent は model 同一/欠落でも対象外 (cross-provider 要件は cross_agent のみ) |
| U-XREVIEW-005 | `extractReviewEntries` | frontmatter yaml から review_kind/worker_model/reviewer_model/reviewed_at/tests_green_at を抽出 (parse 失敗/不在は []) |
| U-TORDER-001 | `analyzeReviewEvidence` (順序 ok) | tests_green_at ≤ reviewed_at → `testBeforeReviewViolations=[]` / `ok=true` (IMP-077) |
| U-TORDER-002 | `analyzeReviewEvidence` (順序違反) | tests_green_at > reviewed_at → `review_before_test` violation / `ok=false` |
| U-TORDER-003 | `analyzeReviewEvidence` (欠落) | tests_green_at 欠落 → `missing_tests_green_at` violation |
| U-TORDER-004 | `analyzeReviewEvidence` (全駆動モデル普遍) | kind=reverse 等 非 design/impl でも review_evidence entry があれば順序対象 |
| U-TORDER-005 | `analyzeReviewEvidence` (対象外) | draft (未確定) は順序対象外 |

### §1.16 U-MDRIFT (module-drift lint = 設計⊇実在の包含、PLAN-L7-16 / IMP-075)

> ペア = `module-drift.md` (L6↔L7)。architecture §3.1 設計 module 集合 ⊇ `src/` 実在 module の包含 drift (impl→design back-fill 漏れ) を機械保証する純関数の oracle。

| U-ID | 対象関数 | DbC oracle |
|---|---|---|
| U-MDRIFT-001 | `parseListedModules` | §3.1 見出し〜次見出しに限定し表 1 列目 `**name**` を抽出 / §3.2 以降の太字を含まない / 重複排除 |
| U-MDRIFT-002 | `parseListedModules` (不在) | §3.1 セクション不在 → `[]` (パース失敗を空虚 ok にしない) |
| U-MDRIFT-003 | `analyzeModuleDrift` (orphan) | 実在するが未列挙 → `orphans` + `ok=false` / listedCount・actualCount 集計 |
| U-MDRIFT-004 | `analyzeModuleDrift` (将来 module) | 設計が web/roster/skills を余分列挙 (src 未実在) は drift でない → `orphans=[]`/`ok=true` |
| U-MDRIFT-005 | `loadModuleDocs`+`analyzeModuleDrift` (実 repo CI fail-close ガード) | 実 repo の `src/` 実在 module は全件 architecture §3.1 列挙 (`orphans==[]`) + listedCount≥actualCount。以後 src module を足して設計未列挙だと red |

### §1.16.0a U-ASSETDRIFT (internal asset cutover lint = legacy source runtime 前提の残存検出)

> ペア = `module-drift.md` asset-drift alias。内部資産 markdown と prompt template を正本のまま維持しつつ、個人 legacy source workspace path / legacy `legacy-source` 委譲 / skill catalog 空 / guard allowlist 乖離を doctor hard gate で検出する。

| U-ID | 対象関数 | DbC oracle |
|---|---|---|
| U-ASSETDRIFT-001 | `analyzeAssetDrift` (legacy source path residue) | enrolled `.claude/agents` / `docs/skills` asset に個人 legacy source workspace path があれば `legacy-source-path-residue` + `ok=false` |
| U-ASSETDRIFT-002 | `analyzeAssetDrift` (legacy command residue) | enrolled asset に `legacy-source codex` / `legacy-source claude` / `legacy-source plan` / `legacy-source gate` / `legacy-source handover` があれば `legacy-command-residue` + `ok=false` |
| U-ASSETDRIFT-003 | `analyzeAssetDrift` (docs-skills vacancy) | enrolled `docs/skills` root が `.gitkeep` 以外の asset を持たなければ `empty-docs-skills` + `ok=false` |
| U-ASSETDRIFT-004 | `analyzeAssetDrift` (guard allowlist missing) | guard allowlist entry に対応する `.claude/agents/<id>.md` が無ければ `missing-allowlisted-agent` + `ok=false` |
| U-ASSETDRIFT-005 | `analyzeAssetDrift` (isolated fixture) | enrolled roots が無い isolated test fixture は unrelated doctor tests を落とさず skip (`checkedAssets=0`, `ok=true`) |
| U-ASSETDRIFT-006 | `loadAssetDriftInput` + `analyzeAssetDrift` (実 repo guard) | 実 repo の active internal assets と prompt templates は legacy source path residue 0 / legacy command residue 0 / docs-skills non-empty / missing allowlisted agent 0 |
| U-ASSETDRIFT-007 | `loadAssetDriftInput` nested `.claude/agent-memory` scan | nested agent memory markdown is enrolled recursively; legacy runtime name/env residue in stale local memory fails `asset-drift` instead of bypassing doctor |

### §1.16.1 U-CHGIMPACT (code change impact lint = コード変更時の設計・テスト更新漏れ検出)

> ペア = `module-drift.md` change-impact addendum。`src/**` 変更を含む change set が design PLAN/doc と test/test-design の更新を同時に持つか検査する。

| ID | 対象 | Oracle |
|---|---|---|
| U-CHGIMPACT-001 | `analyzeChangeImpact` (missing test) | `src/**` + design 更新のみ → `missingTest=true` / `ok=false` |
| U-CHGIMPACT-002 | `analyzeChangeImpact` (covered) | `src/**` + design 更新 + tests または test-design 更新 → `ok=true` |
| U-CHGIMPACT-003 | `analyzeChangeImpact` (docs-only) | docs/test のみで `src/**` 変更なし → `sourceFiles=[]` / `ok=true` |
| U-CHGIMPACT-004 | `parseGitPorcelain` | modified / rename / untracked の porcelain path を正規化し、rename は新 path を採用 |

### §1.16.1a U-RELGRAPH (cross-artifact relation graph = docs/code/DB/evidence impact)

> Pair = `module-drift.md` Cross-Artifact Relation Graph Addendum (A-124/A-125 / PLAN-L6-31). PLAN-L7-32 is the authorized L7 implementation entry.
>
> **Status (PLAN-L7-32 塊C span, 2026-06-10)**: U-RELGRAPH-001..006 promoted from `it.todo` to green `it` in `tests/relation-graph.test.ts` against `src/lint/relation-graph.ts` — `collectRelationGraphProjection` (001..003) + `analyzeRelationImpact` (004..006, source/design/test-design/physical-data 変更の波及 action + behavioral-contract conditional + missing-projection/stale-edge を ok=false finding 化, change-impact へ無音 fallback しない)。PLAN-L7-32 (collect+impact) はこれで実装完了。U-RELGRAPH-007..010 (`exportRelationDiagram` / `collectVerificationEvidenceProjection`) は PLAN-L7-36。

> **Status (PLAN-L7-36 follow-up span, 2026-06-11)**: U-RELGRAPH-007..010 promoted from `it.todo` to green `it` in `tests/relation-graph.test.ts` against `src/lint/relation-graph.ts` — `exportRelationDiagram` (deterministic Mermaid + DOT/D2 unavailable-adapter finding) and `collectVerificationEvidenceProjection` (A-125 evidence projection rows + invalid/external-not-allowed findings, raw payload excluded).

| ID | Target | Oracle |
|---|---|---|
| U-RELGRAPH-001 | `collectRelationGraphProjection` source/doc/test nodes | requirements, PLAN, design, test-design, source, and test fixtures produce stable node IDs, typed edges, and no duplicate `(kind,id,path)` rows. |
| U-RELGRAPH-002 | `collectRelationGraphProjection` DB nodes | physical-data DB projection fixtures produce table nodes and upstream requirement/ADR/PLAN edges; orphan table references become findings. |
| U-RELGRAPH-003 | projection sanitization | MCP evidence, browser/tool fixtures, provider transcript-like fields, secret-like values, and screenshot/trace blobs are not copied into projection rows; only classification, counts, evidence path, and redacted summary remain. |
| U-RELGRAPH-004 | `analyzeRelationImpact` source change | changed `src/**` node expands to sibling test, L6 design contract, L7 unit oracle, PLAN, and reverse/backprop guard actions. |
| U-RELGRAPH-005 | `analyzeRelationImpact` docs/DB change | changed design/test-design/physical-data node expands to paired artifact, DB table nodes where applicable, PLAN DoD, and trace-freeze evidence actions without requiring source tests unless a behavioral contract edge exists. |
| U-RELGRAPH-006 | missing projection coverage | changed node with no graph projection or stale edge returns `ok=false` and a finding; it must not silently fall back to the weaker `analyzeChangeImpact` result. |
| U-RELGRAPH-007 | `exportRelationDiagram` Mermaid | same graph snapshot emits deterministic Mermaid with stable node order, stable edge labels, and no raw evidence payload. |
| U-RELGRAPH-008 | optional diagram adapters | DOT/D2 requested without installed adapter returns an unavailable-adapter finding and does not install or invoke tools implicitly. |
| U-RELGRAPH-009 | `collectVerificationEvidenceProjection` valid evidence | A-125 `verification-evidence-v1` records become `verification_profiles`, `verification_recommendations`, `mcp_server_runs`, and `external_tool_findings` projection rows with evidence paths. |
| U-RELGRAPH-010 | `collectVerificationEvidenceProjection` invalid evidence | malformed evidence, missing schema, or external run without `allow_external` becomes a finding; raw external payload remains excluded. |

### §1.16.1b U-TOOLADAPTER (A-124 graph/diagram adapter probes)

> Pair = `module-drift.md` Tool Adapter Probe Addendum (A-124 / PLAN-L6-33). These oracles cover dependency-cruiser, Knip, Madge, Graphviz DOT, Mermaid, and D2 as optional adapters. They do not authorize package installation or adapter execution without explicit workflow evidence.

| ID | Target | Oracle |
|---|---|---|
| U-TOOLADAPTER-001 | `catalogToolAdapters` complete candidates | catalog contains dependency-cruiser, Knip, Madge, Graphviz DOT, Mermaid, and D2 with trigger signals, package/executable refs, output formats, and risk/default state. |
| U-TOOLADAPTER-002 | optional adapter policy | every external adapter is disabled/unavailable by default until package/executable/config readiness is proven. |
| U-TOOLADAPTER-003 | `probeToolAdapter` package readiness | missing dependency-cruiser/Knip/Madge/Mermaid/D2 package declaration becomes a readiness finding, not an implicit install. |
| U-TOOLADAPTER-004 | `probeToolAdapter` executable readiness | missing Graphviz `dot` or D2 executable becomes an unavailable-adapter finding and does not fail unrelated local checks. |
| U-TOOLADAPTER-005 | workspace scope | adapter probe refuses home-directory or repo-external scan scope unless a future human-approved PLAN explicitly allows it. |
| U-TOOLADAPTER-006 | `normalizeToolAdapterRun` tool run row | adapter command, version, input scope, exit code, and evidence path normalize into a `tool_runs` row. |
| U-TOOLADAPTER-007 | dependency evidence normalization | dependency-cruiser/Madge cycle or forbidden-edge output normalizes into `dependency_edges` and findings without using raw output as gate truth. |
| U-TOOLADAPTER-008 | dead-node evidence normalization | Knip unused file/dependency/export output normalizes into findings requiring review; auto-fix/delete remains out of scope. |
| U-TOOLADAPTER-009 | `planDiagramRefresh` stale diagram | graph snapshot digest mismatch marks existing diagram artifact stale or requires refresh before review/handover use. |
| U-TOOLADAPTER-010 | renderer availability | Mermaid export is default text output; DOT/D2 renderer requests without adapter readiness return findings instead of implicit installation. |

> **Status (PLAN-L7-34, 2026-06-11)**: U-TOOLADAPTER-001..010 promoted to green `it` in `tests/tool-adapter.test.ts` against `src/lint/tool-adapter.ts` — adapter catalog, package/executable readiness findings, workspace-scope refusal, normalized projection rows, dead-node review findings, stale diagram refresh, and renderer-unavailable findings are pure and do not install packages or invoke external tools.

### §1.16.1c U-MCPPROFILE (A-125 profile config / safety lint)

> Pair = `function-spec.md` MCP Profile Config / Safety Addendum (A-125 / PLAN-L6-32). These oracles cover generated local MCP config, Docker MCP Toolkit profile inclusion, and external-profile safety lint before any L7 source change.

| ID | Target | Oracle |
|---|---|---|
| U-MCPPROFILE-001 | `catalogVerificationProfiles` complete candidates | catalog contains MCP Inspector, Playwright MCP, GitHub read-only MCP, Docker MCP Toolkit, Vitest browser Playwright provider, Testcontainers, and MSW with trigger signals and source URLs. |
| U-MCPPROFILE-002 | disabled-by-default policy | every external or MCP profile has `defaultEnabled=false`; built-in Bun/doctor profiles remain enabled. |
| U-MCPPROFILE-003 | Docker MCP Toolkit metadata | Docker MCP Toolkit profile is marked optional, requires Docker, has profile-isolation value, and does not become a test runner unless Docker/toolkit readiness is proven. |
| U-MCPPROFILE-004 | `renderGeneratedMcpConfig` local config | generated config writes only suggested local config content/path and never writes `.vscode/mcp.json` or committed secrets by default. |
| U-MCPPROFILE-005 | workspace mount restriction | filesystem/git profile config using home-directory or global mounts returns a `global-mount` finding. |
| U-MCPPROFILE-006 | credential non-persistence | inline token-like values in generated config are redacted or rejected; env var names are allowed. |
| U-MCPPROFILE-007 | `analyzeVerificationProfileSafety` source trust | registry/catalog presence alone cannot set `trusted=true`; official source URL and package identity must match. |
| U-MCPPROFILE-008 | GitHub MCP read-only guard | GitHub profile with write tools or broad toolsets without `requires_human_approval` returns a safety finding. |
| U-MCPPROFILE-009 | package integrity readiness | declared package/install hint mismatch or absent package declaration becomes a readiness finding, not an implicit install. |
| U-MCPPROFILE-010 | Docker controls | Docker MCP Toolkit profile without Docker availability or documented profile/resource controls is not ready. |
| U-MCPPROFILE-011 | `planExternalProfileActivation` trigger routing | UI/GitHub/DB/API/MCP-profile signals produce required probe/smoke/human-approval steps before run. |
| U-MCPPROFILE-012 | no implicit activation | profile recommendation does not install packages, enable servers, or run external tools without explicit `allow_external` / approved workflow evidence. |
| U-MCPPROFILE-013 | `renderGeneratedMcpConfig` launcher argv (PLAN-L7-79) | generated `mcpServers.<id>` carries a tokenized argv: `command` is the command head and `args` is the remaining tokens. The whole command string is never packed into a single `args` element, and the probe-hint `executable` is never re-included in `args` (e.g. `command:"bun"`, `args:["run","test"]`, not `args:["bun run test"]`). |
| U-MCPPROFILE-014 | `probeVerificationProfile` launcher readiness (PLAN-L7-79 follow-up) | when a generated launcher command head differs from the profile's executable probe hint, probe readiness checks that launcher too; package/executable readiness alone cannot mark the profile ready if the generated command cannot launch. |

> **Status (PLAN-L7-33, 2026-06-11; PLAN-L7-79, 2026-06-19)**: U-MCPPROFILE-001..014 promoted to green `it` in `tests/verification-profile.test.ts` against `src/lint/verification-profile.ts` — catalog/profile metadata, Docker MCP Toolkit readiness metadata, generated local MCP config rendering (incl. tokenized launcher argv, U-MCPPROFILE-013), launcher readiness probing (U-MCPPROFILE-014), safety findings, and activation planning are pure and do not install packages, enable servers, run external tools, or write committed MCP config.

### §1.16.1d U-DOCEXPORT (A-126 canonical document export)

> Pair = `function-spec.md` Canonical Document Export Addendum (A-126 / PLAN-L6-34). These oracles cover conversion of concept, requirements, detailed design, PLAN, ADR, and test-design documents into CSV/Markdown/XLSX/PPTX derived artifacts. They do not authorize package installation or source implementation without PLAN-L7-35 TDD Red evidence.

| ID | Target | Oracle |
|---|---|---|
| U-DOCEXPORT-001 | `parseCanonicalDocumentStructure` supported families | parser accepts concept, requirements, design, plan, adr, and test-design document families with repo-relative source paths. |
| U-DOCEXPORT-002 | source anchors preserved | headings, section IDs, FR/AC/AT IDs, PLAN IDs, ADR IDs, status fields, and evidence links remain present in the projection. |
| U-DOCEXPORT-003 | malformed/unsupported docs | unsupported family or missing source path returns a finding and does not fabricate export rows. |
| U-DOCEXPORT-004 | `buildDocumentExportDataset` deterministic rows | same document projection and export profile produce stable row/sheet/slide-outline ordering. |
| U-DOCEXPORT-005 | redaction before render | secret-like, credential-like, PII-like, raw provider, and raw MCP payload fields are redacted or refused before rendering. |
| U-DOCEXPORT-006 | large document splitting | large requirements/design docs split by document family or section instead of silent truncation. |
| U-DOCEXPORT-007 | built-in CSV/Markdown render | CSV and Markdown summary render without external package readiness. |
| U-DOCEXPORT-008 | optional XLSX readiness | XLSX request without ExcelJS/SheetJS readiness returns a renderer-unavailable finding, not an implicit install. |
| U-DOCEXPORT-009 | optional PPTX readiness | PPTX request without PptxGenJS/D2 readiness returns a renderer-unavailable finding, not an implicit install. |
| U-DOCEXPORT-010 | `recordDocumentExportArtifact` projection rows | successful render creates `document_export_runs`, `document_export_datasets`, and `document_export_artifacts` rows with source snapshot hash. |
| U-DOCEXPORT-011 | generated artifact boundary | generated spreadsheet/deck edits do not mutate canonical docs or gate truth. |
| U-DOCEXPORT-012 | stale source snapshot | source digest mismatch marks an existing export artifact stale before review/handover use. |

> **Status (PLAN-L7-35, 2026-06-11)**: U-DOCEXPORT-001..012 promoted to green `it` in `tests/document-export.test.ts` against `src/export/document-export.ts` — supported family parsing, source anchors, deterministic datasets, redaction, built-in CSV/Markdown rendering, optional renderer findings, projection rows, derived-artifact boundary, and stale source snapshot detection are pure and do not mutate canonical docs.

### §1.16.1e U-DEPD / U-REGEXP (dependency-drift + regression expansion)

> Pair = `function-spec.md` dependency-drift rule (ADR-002/IMP-032) + roadmap G-L7.D. These oracles close the former doctor scaffold stub by replacing fixed text with pure import-graph lint and regression-scope expansion.

| ID | Target | Oracle |
|---|---|---|
| U-DEPD-001 | `analyzeDependencyDrift` allowed graph | allowed source module imports normalize to deterministic module edges and OK messages. |
| U-DEPD-002 | disallowed dependency | reverse dependency such as runtime -> lint returns `disallowed-module-dependency` finding. |
| U-DEPD-003 | cycle detection | cyclic module imports return deterministic `module-cycle` finding. |
| U-REGEXP-001 | `expandRegressionScope` affected modules | changed source module expands to direct tests and reverse-dependent module tests. |
| U-REGEXP-002 | missing coverage | changed source module without direct test coverage returns `missing-regression-test` finding instead of silent fallback. |

> **Status (PLAN-REVERSE-42, 2026-06-11)**: U-DEPD-001..003 and U-REGEXP-001..002 are green in `tests/dependency-drift.test.ts` against `src/lint/dependency-drift.ts`. `doctor` now surfaces `dependency-drift` / `regression-expansion` and no longer emits the scaffold stub.

### §1.16.1f U-VTRIG L0-L7 (implementation verification cycle gate)

> Pair = `vmodel-pair-freeze.md` verification group trigger + roadmap G-L7.E. The L0-L7 implementation band is a machine-surfaced verification cycle gate after L7 freeze.

| ID | Target | Oracle |
|---|---|---|
| U-VTRIG-005-L7 | `VERIFICATION_GROUPS` L0-L7 | real repo guard surface includes `実装検証サイクルゲート` and the L0-L7 group is frozen. |

> **Status (PLAN-L7-43, 2026-06-11)**: U-VTRIG-005 now asserts L0-L7 / `実装検証サイクルゲート` in `tests/vmodel-pair.test.ts`; `doctor` surfaces the implementation verification cycle gate.

### U-CODE Addendum (coding-rules lint = requirements-level coding rule SSoT)

> Pair = `module-drift.md` Coding Rules Addendum. Requirements-level TS core coding rules are mechanically enforced by `src/lint/coding-rules.ts` and `doctor`.

| ID | Target | Oracle |
|---|---|---|
| U-CODE-001 | `analyzeCodingRules` explicit any | `any` type node in source/test docs -> `no-explicit-any` violation |
| U-CODE-002 | `analyzeCodingRules` source max params | source function/method/constructor with more than 3 params -> `max-source-params` violation |
| U-CODE-003 | `analyzeCodingRules` suppression comments | `@ts-ignore` / `@ts-expect-error` / `eslint-disable` / `biome-ignore` -> `no-suppression-comment` violation |
| U-CODE-004 | `analyzeCodingRules` file naming | TS file not kebab-case and not `index.ts` -> `file-name-kebab` violation |
| U-CODE-005 | test scope split | test helper with more than 3 params remains OK; no-any/no-suppression/naming still apply |
| U-CODE-006 | real repo guard | `loadCodingRulePolicy` + `loadCodingRuleDocs(process.cwd())` + `analyzeCodingRules` returns violations `[]`; `doctor` surfaces `coding-rules` and links `ok` |
| U-CODE-007 | workflow placement | `loadCodingWorkflowDocs` + `analyzeCodingRules` detects missing `CODING-RULE-WORKFLOW` / SSoT references in Forward, Add-feature, and mode index docs |
| U-CODE-008 | structured error handling | source catch block with undocumented empty body or rethrow-only body -> `structured-error-handling` violation |
| U-CODE-009 | module boundary | disallowed reverse dependency such as `src/lint/*` importing `../runtime/*` -> `module-boundary` violation |
| U-CODE-010 | machine surface language | machine-facing CLI/doctor/lint/gate message line with Japanese-only decision words and no ASCII token (`OK`, `violation`, `warning`, `skipped`, `note`, `error`, `ready`, `not ready`) -> `machine-surface-language` violation; Japanese explanatory prose after the ASCII token remains allowed |

### U-DDDTDD Addendum (DDD/TDD strictness)

> Pair = `module-drift.md` DDD/TDD Strictness Addendum. Requirements-level DDD/TDD rules are mechanically enforced by `src/lint/ddd-tdd-rules.ts` and `doctor`.

| ID | Target | Oracle |
|---|---|---|
| U-DDDTDD-001 | `analyzeDddTddRules` policy | missing or unknown DDD/TDD rule ID -> violation |
| U-DDDTDD-002 | invariant trace | `DDD-INV-*` oracle declared in SSoT but absent from L7 test design -> violation |
| U-DDDTDD-003 | Red-first evidence | confirmed `tdd_red_required` PLAN lacking `red_at` / `green_at`, or `red_at > green_at` -> violation |
| U-DDDTDD-004 | test oracle strength | `it` / `test` block with no explicit `expect` / `assert`, or truthiness-only assertion -> violation |
| U-DDDTDD-005 | integration GWT | L8 `IT-*` row missing Given / When / Then granularity -> violation |
| U-DDDTDD-006 | workflow placement | Forward, Add-feature, or mode index doc missing `DDD-TDD-WORKFLOW` / SSoT reference -> violation |
| U-DDDTDD-007 | domain boundary | disallowed reverse dependency such as `src/lint/*` importing runtime/doctor/CLI feature modules -> violation |
| U-DDDTDD-008 | real repo guard | `loadDddTddInputs(process.cwd())` + `analyzeDddTddRules` returns violations `[]`; `doctor` surfaces `ddd-tdd-rules` and links `ok` |
| U-DDDTDD-009 | unit-oracle-substance (IMP-083 残差) | L7 unit test-design の `U-XXX-NNN` 行 (末尾数字 = `U-ID` ヘッダ除外) の expected-behavior セルが空 / trivial (< 6 字) / skeleton marker (`-`/TODO/骨格 等) -> violation。substantive 行は非違反 (false-positive 回避) |

### §1.16.2 U-READABILITY (freeze doc readability lint、A-110 / IMP-089)

> ペア = L6 function design docs。confirmed freeze 対象 doc の mojibake marker を検出し、A-109 の読み取り対象漏れを再発させない。

| ID | 対象 | Oracle |
|---|---|---|
| U-READ-001 | `analyzeReadability` | U+FFFD / U+2001+ASCII / CP932 mojibake token を violation として返す |
| U-READ-002 | `readabilityMessages` | doctor に path:line:marker を出し、復元要求を明示 |
| U-READ-003 | `loadL6ReadabilityDocs` | 実 repo L6 design docs 18 件で marker 0 |
| U-READ-004 | `loadFreezeReadabilityDocs` | 実 repo の L6 design docs + PM trace 対象 L5 PLAN 4 件で marker 0 |

### §1.18 U-GCONF (gate-confirm coupling lint、PLAN-L7-18 / IMP-079)

> ペア = `gate-confirm.md`。gate-design §2 台帳と design/test-design doc `status: confirmed` の coupling を検査する。parse 失敗を含む不整合は fail-close。

| Test ID | 対象 | 期待 |
|---|---|---|
| U-GCONF-001 | `parseGateStatuses` | gate table から G/L/status/PASS を抽出 |
| U-GCONF-002 | `layerToGate` | `L5 -> G5`、非 layer は null |
| U-GCONF-003 | `analyzeGateConfirm` | gate park の layer に confirmed doc → violation |
| U-GCONF-004 | `analyzeGateConfirm` | gate PASS の layer に confirmed doc → ok |
| U-GCONF-005 | `analyzeGateConfirm` | gate table parse 失敗 → `ok=false` + `violation` (fail-close) |
| U-GCONF-006 | `analyzeGateConfirm` | draft doc は対象外 |

### §1.19 U-PLANSCH (plan lint §工程表 最小強制、PLAN-L7-20 / IMP-081)

> ペア = `plan-schedule-lint.md`。§1.10.G.4 の最小スライスとして、Step の [並列]/[直列]、直列理由、review Step、§3.1 実装計画を検査する。

| Test ID | 対象 | 期待 |
|---|---|---|
| U-PLANSCH-001 | `extractScheduleSection` | §工程表 section を抽出 |
| U-PLANSCH-002 | `analyzePlanSchedule` | 準拠 PLAN → ok |
| U-PLANSCH-003 | `analyzePlanSchedule` | [並列]/[直列] 欠落 Step → violation |
| U-PLANSCH-004 | `analyzePlanSchedule` | [直列] の理由が 3 条件に該当しない → violation |
| U-PLANSCH-005 | `analyzePlanSchedule` | review Step heading 不在 → violation |
| U-PLANSCH-006 | `analyzePlanSchedule` | §3.1 実装計画 不在 → violation |

### §1.20 U-FRCOV (FR unit coverage substance、PLAN-L7-22 / A-110)

> ペア = `fr-unit-coverage.md` + `function-spec.md` FR registry addendum。FR→L6→U oracle の ID 接続だけでなく、型 body と pseudocode/explicit_l7_defer の substance を検査する。

| Test ID | 対象 | 期待 |
|---|---|---|
| U-FRCOV-001 | `parseL6FrCoverageRows` | FR coverage table を FR/L6 spec/unit contract/U oracle に分解 |
| U-FRCOV-002 | `analyzeL6FrCoverage` | missing/unknown/incomplete row を violation |
| U-FRCOV-003 | `analyzeL6FrCoverage` | contract ref が L6 spec に無ければ weak contract |
| U-FRCOV-004 | `analyzeL6FrCoverage` | function-spec/governance/agent-slots ref に型 body + pseudocode/defer marker が無ければ missing substance |
| U-FRCOV-005 | 実 repo guard | FR registry 46 件すべて L6 spec / U-* oracle / substance marker に接続 |
| U-FRCOV-006 | `analyzeL6FrCoverage` | `explicit_l7_defer` 行の type body に `{...}` フィールドブロックが無ければ missing substance |

### §1.21 U-FR-L1-21 (test perspective gate)

> ペア = `vmodel-pair-freeze.md` §7.3.1。pair presence だけではなく、設計層ごとに必要な test perspective が欠けていないことを検査する。

| Test ID | 対象 | 期待 |
|---|---|---|
| U-FR-L1-21-01 | `analyzeTestPerspectiveGate` | required viewpoint が欠落した layer pair を violation |
| U-FR-L1-21-02 | `analyzeTestPerspectiveGate` | 同一 viewpoint の重複宣言を duplicate violation |
| U-FR-L1-21-03 | `analyzeTestPerspectiveGate` | required viewpoints が全て存在し重複なしなら ok |

### §1.17 U-XRUNTIME (provider handover / gate review-tier / team run / adapter, 2026-06-08)

> ペア = L4 function §3.6 / external-if §6 / requirements §7.1・§7.8.7。前回 review 残課題 (provider handover 未実装、`ut-tdd codex|claude|team|gate` surface 欠落、single-runtime checklist 未強制、hybrid 分散未検証) を機械保証する。

| U-ID | 対象関数 | DbC oracle |
|---|---|---|
| U-PHOVER-001 | `buildProviderHandover` | Claude↔Codex の from/to が異なる package を生成 / active_plan・summary 必須 / secret 風 token は sanitize |
| U-PHOVER-002 | `runProviderHandover` | `.ut-tdd/handover/provider/<id>.json` + `CURRENT.json` を書く / dry-run は非書込 |
| U-GATE-001 | `evaluateGateReview` (hybrid) | judgment gate は `review_kind=cross_agent` + workerModel≠reviewerModel で pass / 同一 model は fail |
| U-GATE-002 | `evaluateGateReview` (single runtime) | claude-only/codex-only は checklist 必須、欠落・fail・根拠なし n-a で fail、揃えば `cross_agent_review=unavailable` |
| U-GATE-003 | `evaluateGateReview` parity | 同一 checklist で claude-only/codex-only の passed・review_kind・message が一致 |
| U-GATE-004 | `evaluateStaticGate` unknown/review-only | 未登録 gate は deterministic static check 不在で fail-close / `G0.5`・`R4` は既知の review-tier gate として static n-a + pass |
| U-GATE-005 | `evaluateStaticGate` deterministic failure | G1/G3/G7 などの静的検査が I/O / parse 失敗で実行できない場合は throw せず `violation` + fail-close |
| U-GATE-006 | `ut-tdd gate --checklist` | checklist YAML 読込・parse 失敗は CLI crash ではなく review checklist violation として gate failure |
| U-TEAMRUN-001 | `validateTeamRun` | hybrid 以外は fail / hybrid で worker(se) と reviewer(tl/qa) が別 provider なら pass |
| U-TEAMRUN-002 | `validateTeamRun` | 同一 role/provider 重複、worker/reviewer 同一 provider は fail |
| U-TEAMRUN-003 | `recommendTeamLaunch` + `buildTeamRunPlan` | `team suggest` が返す critical definition は `se -> tl -> qa` の依存順へ正規化され、全 member が high effort selection を持つ |
| U-ADAPTER-001 | `buildAdapterPlan` | `ut-tdd codex` / `ut-tdd claude` dry-run command plan を mode に基づき available 判定 / Codex provider args は `exec -`、Claude provider args は Claude Code print-mode の `--print --input-format text` / 両 provider とも prompt 本文は `plan.stdin` に保持し argv へ渡さない / `--plan` は harness metadata として保持し provider CLI へ渡さない |

### §1.22 U-DESC (descent-obligation ledger 由来、PLAN-L6-35 add-design / descent-obligation.md §1-§4、FR-L1-03)

> ペア = `descent-obligation.md` §1-§4。上流 (要件 FR) + 層隣接 matrix から「在るべき下流/pair 成果物」を生成し不在を fail-close する (absence-blind 是正)。pair-freeze (document-driven) の一般化を上流駆動 (absence-detecting) で行う。

| U-ID | 対象関数 | oracle (DbC) |
|---|---|---|
| U-DESC-001 | `generateObligations` | **純関数 + 上流駆動**。present artifact の layer から adjacency.rules を引き、condition (active/impl-present) を満たす to-layer のみ Obligation を emit / **下流の自己宣言 (pair_artifact 等) を一切参照しない** / 同入力→同出力 |
| U-DESC-002 | `analyzeDescentObligations` (健全性) | trace key 無し成果物→`untraceable` finding (ok=false) **かつ obligation ループから除外 = unmet/implAhead に混入しない** (I-2) / 同一 (traceKey,layer,role) 衝突→`duplicate-key` finding (E1/E8) |
| U-DESC-003 | `analyzeDescentObligations` (満たし) | 全 obligation が **`status=="active"` の**下流/pair で満たされる→`graded` 全 satisfied + ok=true + chain.complete=true (I-1) |
| U-DESC-004 | `analyzeDescentObligations` (不在) | 義務付けられた下流/pair が不在・defer 無し→`unmet` + ok=false / chain.firstGap=最初の欠落層 / **requiredLayer に park/placeholder の stub があっても satisfied にしない** (E2/E6/I-1、**skill 片肺の本体**) |
| U-DESC-005 | `analyzeDescentObligations` (defer) | 不在 + 有効 defer (dischargeCondition 非空 ∧ owner 非空) ∧ impl 未着地→`deferred` (ok 維持) / defer に条件 or owner 欠落→**`invalid-defer` finding 発火**かつ `unmet` (免責しない、E3/E4/I-4) |
| U-DESC-006 | `analyzeDescentObligations` (impl-ahead) | src/test 着地済 + 設計/テスト設計層の未 discharge defer→`impl-ahead` 違反 (defer で免責しない、ok=false) / 方向非依存 / **graded.unmet と implAhead は排他 = 同一 layer を二重登録しない** (E5/E7/I-3、**skill 片肺の核**) |
| U-DESC-007 | `analyzeDescentObligations` (park) | 上流が park/placeholder→descent obligation を生成しない (pair-freeze park 規約と整合、E6) |
| U-DESC-008 | `descentObligationMessages` + 実 repo ガード | unmet/impl-ahead を reason+traceKey+layer で文言化 / **実 repo で skill subsystem の片肺が unmet または impl-ahead として surface される** (Phase 0 = 現存 drop 一掃検出、是正後 0 へ収束) |

### §1.23 Refactor candidate detector projection descent (PLAN-L7-147 / PLAN-REVERSE-141、IMP-146)

> ペア = `function-spec.md` Harness DB projection addendum の `analyzeRefactorCandidates`。Refactor mode の
> DB-trigger 候補面 (`PLAN-L7-133` workflow の下位 capability) を `quality_signals`
> (`metric=refactor_candidate:<kind>`) / `feedback_events` へ projection する detector の L7 descent。
> forward-convergence 集約 (Reverse back-fill `PLAN-REVERSE-141`) で本 descent を補い、impl PLAN を converged 化した。

- detector は既存テーブルへの additive projection (schema 不変) ゆえ、新規番号 oracle を増やさず
  **projection oracle family (U-FR-L1-06 / U-FR-L1-19 / U-FR-L1-20 / U-FR-L1-40 / U-FR-L1-41)** の被覆下に置く
  (新 `U-XXX-NNN` ID を作らない = oracle-test-trace の偽 linkage を生まない)。
- substance (実体) は `tests/projection-writer.test.ts` が担う: 4 candidate kind
  (`split-module` / `extract-helper` / `deduplicate-function` / `externalize-literal`) の検出、`candidateRank`
  順序、`projectRefactorCandidateSignals` による `quality_signals`/`feedback_events` projection、空入力で
  candidate を捏造しないこと、を green `it` で被覆 (PLAN-L7-147 AC「4 kind すべてを純 detector test が被覆」)。
- 関連 detector 後続 (`PLAN-L7-148`/`150`/`151`/`152`/`153`/`158`) は本 descent を基点とする (module extraction /
  closure sweep / precision+policy extraction)。

## §2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)

- function-spec §1 関数 → U-FUNC-01〜04
- function-spec §2 pseudocode → U-CORE-01〜04
- function-spec §4 rule engine → U-RULE-01〜03
- edge-case 4 観点 → U-EDGE-01〜03
- **session-log.md §3 関数 (resolveActivePlan/recordEvent/compressPlanDigest/onStop/onSessionStart) + CLI hook entrypoints → U-SLOG-001〜007** (add-feature 差分、PLAN-L6-03。孤児 0)
- **forced-stop-feedback.md §2.3 関数 (detectDanglingTurn/recordForcedStop/classifyFeedback/recordFeedback/pendingRecoveryProposals/scanDanglingStops/emitClassifyRequest) → U-FSF-001〜007** (add-feature 差分、PLAN-L6-04。孤児 0)
- **setup-solo-team.md §2.3 契約関数 7 本 (detectProjectScale/recommendPhase/planSetup/emitSetup/recordSetupState/applyBranchProtection/runSetup) → U-SETUP-001〜007** (add-feature 差分、PLAN-L6-05。renderArtifacts は emitSetup 内部 helper = U-SETUP-004 に内包。孤児 0)
- **handover-mechanism.md §2.3 関数 (resolveHandoverScope/buildPointer/scaffoldFromDigests/renderHandoverScaffold/handoverStale/writePointer/setActivePlan/inferPlanFromCommit/runHandover) → U-HOVER-001〜007** (add-feature 差分、PLAN-L6-06。writePointer は U-HOVER-007 orchestration 経路で被覆。session-log への限定 amendment = setActivePlan/inferPlanFromCommit 配線は U-HOVER-006 で被覆。孤児 0)
- **handover IMP-048/047 差分 (sameFamilyPlan/dedupeDigests/resolveHandoverScope scopeToActive/readPointer/checkHandoverDiscipline) → U-HOVER-008〜010** (IMP-048 dedup + scopeToActive、IMP-047 readPointer/discipline。孤児 0)
- **handover IMP-078 品質増分 (checkHandoverBypass/countHandoverEntries/resolveHandoverScope scopeToSession/latestSessionId/readPlanMeta family 解決/活性化 activePlanStale 連動) → U-HOVER-011〜012 + U-SLOG-006** (gap① bypass / gap② stale / gap③ commit hash / gap④ session-scope / gap⑤ unknown-kind。PLAN-L6-16/L7-17。readPlanMeta は U-HOVER-012 runHandover 経路に内包。孤児 0)
- **handover A-138 ITEM-4 + PLAN-L7-83 累積/drift 増分 (renderHandoverScaffold slimSummary / boundSameDayEntries 累積上限 / runHandover marker reconcile) → U-HOVER-013〜015** (slim stub・bounded entries (anchor+直近保持/breadcrumb)・marker reconcile (complete→clear / --plan→sync / dryRun 非破壊)。PLAN-L7-83。孤児 0)
- **agent-slots.md §2.3 関数 (loadSlots/fireSlot/releaseSlot/releaseOldestGuardSlot/sweepStaleGuardSlots/listActiveSlots/listStaleSlots/peakParallel/exceedsParallelLimit/recordGuardFire) → U-SLOT-001〜008** (add-feature 差分、IMP-050 + IMP-106 SubagentStop release。nodeAgentSlotsDeps は実 I/O deps で unit では mock 代替。孤児 0)
- **module-drift.md §2-§3 関数 (parseListedModules/scanActualModules/analyzeModuleDrift/loadModuleDocs/moduleDriftMessages) → U-MDRIFT-001〜005** (add-feature 差分、PLAN-L7-16/IMP-075。moduleDriftMessages は U-MDRIFT-003/004 経路 + 専用 assert で被覆、loadModuleDocs は U-MDRIFT-005 実 repo ガードに内包。孤児 0)
- **module-drift.md asset-drift alias (loadAssetDriftInput/analyzeAssetDrift/assetDriftMessages/checkAssetDrift) → U-ASSETDRIFT-001〜006** (内部資産 + prompt template cutover 差分、FR-L1-49。legacy source path residue / legacy command residue / docs-skills vacancy / guard allowlist missing を doctor hard guard。孤児 0)
- **module-drift.md change-impact addendum (analyzeChangeImpact/parseGitPorcelain/loadChangedFiles/changeImpactMessages) → U-CHGIMPACT-001〜004** (コード変更に対する設計・テスト更新漏れ検出。doctor hard guard。孤児 0)
- **module-drift.md coding-rules addendum (analyzeCodingRules/loadCodingRuleDocs/loadCodingWorkflowDocs/codingRulesMessages/checkCodingRules) → U-CODE-001〜010** (requirements-level coding rule SSoT + workflow placement + error/module-boundary + machine-surface-language の機械検出。doctor hard guard。孤児 0)
- **module-drift.md DDD/TDD strictness addendum (analyzeDddTddRules/loadDddTddInputs/dddTddRulesMessages/checkDddTddRules) → U-DDDTDD-001〜008** (DDD/TDD SSoT + workflow placement + Red-first evidence + test oracle + integration GWT の機械検出。doctor hard guard。孤児 0)
- **team.ts §2.2 schema / 関数 (teamDefinitionSchema/mustSerialize) + team/launch-policy.ts → U-TEAM-001〜003** (add-feature 差分、IMP-050。孤児 0)
- **backfill-pairing.md §2.3 関数 (parseRequires/parseGlossaryTerms/normalizeTerm/parsePlan/analyzeBackfill/loadBackfillDocs/backfillMessages/checkBackfill) → U-BACKFILL-001〜006** (add-feature 差分、IMP-051。normalizeTerm は parseGlossaryTerms/analyzeBackfill の内部パス経由で被覆。checkBackfill は doctor/index.ts の try-catch ラッパーで U-BACKFILL-006 実 repo ガードに内包。孤児 0)
- **vmodel-pair-freeze.md §1-§3 関数 (loadPairDocs/analyzePairFreeze/pairFreezeMessages/lintVmodel) → U-VPAIR-001〜006** (add-feature 差分、PLAN-L7-11/IMP-067。lintVmodel は loadPairDocs→analyzePairFreeze→pairFreezeMessages の orchestration で U-VPAIR-005 実 repo ガードに内包。孤児 0)
- **vmodel-pair-freeze.md §7 関数 (analyzeVerificationGroups/verificationGroupMessages、loadPairDocs status 拡張) → U-VTRIG-001〜005** (add-feature 差分、PLAN-L7-12/IMP-068。doctor checkVerificationGroups は U-VTRIG-005 実 repo ガードに内包。孤児 0)
- **review-evidence.md §2-§4 関数 (hasReviewEvidence/parseReviewPlan/analyzeReviewEvidence/loadReviewPlans/reviewEvidenceMessages、schema review_evidence、doctor checkReviewEvidence) → U-REVIEW-001〜006** (add-feature 差分、PLAN-L7-13/IMP-071。reviewEvidenceMessages は U-REVIEW-003/006 経路で被覆、checkReviewEvidence は doctor try-catch ラッパーで U-REVIEW-006 実 repo ガードに内包。孤児 0)
- **review-evidence-stale.md §2-§4 関数 (draft/降格 PLAN に残る stale approval の検出) → U-REVIEW-007〜008** (add-feature 差分、PLAN-L7-19/IMP-080。review-evidence 双方向性の逆向き検出。孤児 0)
- **cross-review-enforcement.md §1-§2 関数 (extractReviewEntries/analyzeReviewEvidence の crossReviewViolations、schema worker_model/reviewer_model) → U-XREVIEW-001〜005** (add-feature 差分、PLAN-L7-14/IMP-076。doctor 連動は U-REVIEW-006 実 repo ガードの crossReviewViolations==[] に内包。孤児 0)
- **test-before-review.md §2-§3 関数 (analyzeReviewEvidence の testBeforeReviewViolations、schema tests_green_at、reviewed_at/tests_green_at 抽出) → U-TORDER-001〜005** (add-feature 差分、PLAN-L7-15/IMP-077。doctor 連動は U-REVIEW-006 実 repo ガードの testBeforeReviewViolations==[] に内包。全駆動モデル普遍。孤児 0)
- **provider-handover.ts / gate/review-tier.ts / team/run.ts / team/launch-policy.ts / runtime/adapter.ts → U-PHOVER-001〜002 / U-GATE-001〜003 / U-TEAMRUN-001〜003 / U-ADAPTER-001** (review 残課題解消差分、2026-06-08。provider handover package、mode-aware judgment gate、hybrid team 分散、runtime adapter dry-run surface。孤児 0)
- **descent-obligation.md §1-§4 関数 (loadDescentAdjacency/loadTraceKeyedArtifacts/loadDeferLedger/generateObligations/analyzeDescentObligations/descentObligationMessages、doctor checkDescentObligation) → U-DESC-001〜008** (add-design 差分、PLAN-L6-35/FR-L1-03。load×3 は U-DESC-008 実 repo ガードに内包。上流駆動 obligation 生成 + defer ledger + impl-ahead ガードで absence-blind を是正。孤児 0)
- **孤児 (設計で U 未被覆) = 0** を L7 entry で機械確認

## §3 trace (④ → ②)

本書の各 U-* は `docs/design/harness/L6-function-design/` の 2 sub-doc (signature/DbC/edge) と相互 reference。**G6 (機能設計凍結)** で 2 sub-doc ⇔ 本書 1 doc の pair 宣言を確定し、L7 entry (TDD Red) で先行 ④ テストコードに変換 (§1.10 line 671)。双方向 trace freeze は G7 で実施。

## §4 carry / 次工程

- **L7 entry (TDD Red)**: 全 U-* を vitest 単体テストに先行変換 (FR-02、Red 先行、未実装理由のみで fail 可)
- **L7 実装**: function-spec WBS (§5) の Sprint L7.1〜L7.7 を Red→Green→3点R で実装。DbC docstring (`@edge-*`) を実関数へ転記
- **G7 trace freeze**: 4 artifact 双方向 12 edge 凍結時に本書 U ↔ L6 設計の trace 確定
- **外部ツーリング family carry 更新 (A-128 F-2 / IMP-128、2026-06-11)**: §1.16.1a の **U-RELGRAPH-001..010 は PLAN-L7-32 / PLAN-L7-36 で実テスト化済み**、§1.16.1b の **U-TOOLADAPTER-001..010 は PLAN-L7-34 で実テスト化済み**、§1.16.1c の **U-MCPPROFILE-001..014 は PLAN-L7-33 / PLAN-L7-79 で実テスト化済み**、§1.16.1d の **U-DOCEXPORT-001..012 は PLAN-L7-35 で実テスト化済み**。外部ツーリング family の正規 defer は 0。

### 2026-06-08 Residual Review Closure Test Addendum

- U-GATE-004: `evaluateGateReview` rejects `self_review` / `self-review` / `naive_self_review` as judgment-gate evidence in hybrid, single-runtime, and standalone modes.
- U-RDRIFT-001: `analyzeRuleDrift` passes when AGENTS / CLAUDE adapter docs share required command and mode markers.
- U-RDRIFT-002: `analyzeRuleDrift` reports missing adapter markers with file and marker identity.
- U-RDRIFT-003: real repo AGENTS / CLAUDE adapter docs have no required marker drift.
- U-RDRIFT-004: `analyzeRuleDrift` reports forbidden legacy adapter markers for old runtime command routing, env prefixes, local state paths, and agent names; real repo AGENTS / CLAUDE adapter docs have zero forbidden markers.

### 2026-06-09 Runtime Adapter Lifecycle Test Addendum

- U-SLOG-007 extends the shared CLI and adapter wrapper oracle: explicit `--plan <id>` lifecycle runs must produce a plan digest with `session_start`, `tool_use`, and `session_end` counts for `<id>`.
- U-SLOG-007 also asserts `--plan <id>` remains harness metadata and is not forwarded as `--plan-id` or raw plan text to Codex / Claude provider CLI args.

### 2026-06-15 Skill Evaluation Oracle (FR-L1-36, PLAN-L7-53)

| U-ID | 関数 | oracle (DbC) |
|------|------|--------------|
| U-FR-L1-36 | `projectSkillEvaluations` | **Cold-start**: 0 skill_invocations → 0 skill_evaluations rows (never throws). **AC-01**: 5 adopted plans all "confirmed" → skill_rating=1.0, adoption_count=5, success_count=5, unused_flag=0. **AC-02**: last accepted invocation > 30 days before asOf → unused_flag=1; row is preserved (no auto-delete). **Partial success**: 3 of 5 adopted plans "confirmed", 2 "draft" → skill_rating=0.6. **Rejected invocations**: accepted=0 only → 0 evaluation rows. **"completed" counts as success**: plan_registry.status="completed" increments success_count. asOf parameter makes time-window logic deterministic in tests. |

### 2026-06-15 PoC Success Measurement Oracle (FR-L1-43, PLAN-L7-53)

| U-ID | 関数 | oracle (DbC) |
|------|------|--------------|
| U-FR-L1-43 | `projectPocEvaluations` | **Cold-start**: 0 decided PoC PLANs (or no poc kind at all) → 0 poc_evaluations rows (never throws). **AC-43-01**: 10 PoC PLANs (6 confirmed / 3 rejected / 1 pivot) → poc_success_rate=0.60, confirmed_count=6, rejected_count=3, pivot_count=1, total_count=10. **AC-43-02 cold-start**: 0 PoC PLANs → 0 rows. **Undecided PoC excluded**: plan_registry rows with kind="poc" and decision_outcome="" are not included in denominator. **Pivot is non-success**: pivot_count increments denominator but not numerator. **Single summary row**: id always "poc-evaluation:summary"; rebuild overwrites previous row. asOf parameter controls evaluated_at timestamp for deterministic tests. |

### 2026-06-15 Model Evaluation Oracle (FR-L1-38, PLAN-L7-53)

| U-ID | 関数 | oracle (DbC) |
|------|------|--------------|
| U-FR-L1-38 | `projectModelEvaluations` | **Opt-in disabled (AC-38-02)**: no .ut-tdd/config/model-opt-in.yaml or enabled!=true → 0 model_evaluations rows (never throws). **AC-38-01 enabled**: seed model_runs + plan_registry, write model-opt-in.yaml (enabled:true) under tmp repoRoot → model-A (2 runs both success) writes row with success_rate=1.0, run_count=2, success_count=2; model-B (2 runs, 1 success) writes row with success_rate=0.5, run_count=2, success_count=1. **Cold-start**: enabled but 0 model_runs → 0 model_evaluations rows (never throws). **Success inference**: joins model_runs.plan_id -> plan_registry.status IN PLAN_SUCCESS_STATUSES ("confirmed","completed"); no token/cost column — cost-efficiency is explicit_l7_defer (token telemetry pending, PLAN-L7-53 follow-up). **Opt-in file parse failure**: treat as disabled (fail-open for opt-in gate). |

### 2026-06-09 L6 FR Unit Coverage Addendum

- U-FR-L1-01..U-FR-L1-50 are defined by `docs/design/harness/L6-function-design/fr-unit-coverage.md`.
- U-FR-L1-51 covers artifact progress red/yellow/green derivation from linked test evidence, dependency impact, and recovery/fullback evidence.
- The executable guard is `src/lint/l6-fr-coverage.ts`: it parses the L1 FR registry and fails when any registered FR lacks an L6 spec path, deterministic unit contract, or U-* oracle.
- This addendum is the L7 Red entry contract for L6 completion: each U-FR-L1-* row must become a focused unit test or be explicitly re-routed by a later confirmed PLAN.

### 2026-06-09 L6 Completion Readiness Addendum

- U-L6COMP-001: `analyzeL6Completion` reports not-ready when any L6 design doc is draft, lacks an owning `plan:` reference, lacks the L7 `pair_artifact`, is not referenced by filename from L7, lacks minimum unit-contract substance (contract/signature + DbC/oracle + U-* family), any base L6 `kind=design` PLAN is draft, L7 is draft, or G6 is not PASS.
- U-L6COMP-002: `analyzeL6Completion` reports ready only when all L6 docs are confirmed, all L6 docs resolve to an owning L6 PLAN and L7 reverse reference, all L6 docs expose unit-test-granularity contract substance, all base L6 `kind=design` PLANs are confirmed with review evidence, L7 is confirmed, and G6 is PASS.
- U-L6COMP-003: `checkL6Completion` surfaces readiness in `doctor` as warn-only until the G6 freeze audit is ready to harden it.
- U-L6COMP-004: `analyzeL6Completion` reports `freezeInputReady=true` when L6 trace/substance inputs are complete even if docs/plans/L7/G6 are still draft before the G6 audit.
- U-L6COMP-005: post-G6 `kind=add-design` PLAN drafts do not reopen base L6 completion; add-feature completeness is handled by backfill/pair/review evidence.

## PLAN-L7-68 Provider Dispatch Addendum

| U-ID | Target | Oracle |
|---|---|---|
| U-ADAPTER-002 | `resolveCodexNativeCommand` | `UT_TDD_CODEX_BIN` is preferred over PATH lookup and Windows npm `codex.cmd` is accepted as a native provider command override. |
| U-ADAPTER-003 | `buildProviderInvocation` | Windows `.cmd` / `.bat` provider commands are converted to a shell command string with quoted arguments, while non-script binaries keep `shell=false`. |
| U-ADAPTER-004 | `isProviderCommandSpawnable` / `detectMode` | Provider availability is true only when the resolved provider command can spawn successfully; PATH name presence alone is not enough. |
| U-PHOVER-002 | `buildProviderHandover` | Provider handover packages include `handover_kind: "mechanical"` so machine routing data is not confused with explicit human handover. |

## PLAN-L7-76 Reliability Remediation Addendum

| U-ID | Target | Oracle |
|---|---|---|
| U-DBPROJ-ATOMIC-01 | `rebuildHarnessDb` | The truncate + re-project sequence runs inside one `BEGIN IMMEDIATE` transaction. Injecting a failure during projection (a wrapped `db` that throws on the first `INSERT INTO plan_registry`, i.e. after `truncateProjectionTables` has emptied the tables) re-throws and **rolls back**, leaving the prior committed `plan_registry` projection intact (row count unchanged, not 0). Red→Green: fails pre-fix (188 → 0). |
| U-CHGIMPACT-NONGIT-01 | `isGitRepository` / `checkChangeImpact` / `checkChangeSetIntegrity` | In a non-git directory both checks return `ok:true` with a "skipped (not a git repository)" message (matching the non-git fail-open convention of `tracked-canonical` / `runtime-portability`), while an unreadable repo root still fail-closes with a `violation` message. CI runs in a git repo so its behavior is unchanged. |
| U-SLOT-009 | `nodeAgentSlotsDeps.writeText` | State is written atomically: stage to a unique `*.tmp-<pid>-<seq>` file then `renameSync` over the target. A fire→release round-trip through the real fs deps persists the complete slot array and leaves **no** `*.tmp-*` temp file behind (concurrent hook / crash-mid-write never yields a torn JSON that `loadSlots` would discard). |

## PLAN-L7-81 Codex Wrapper Parity Addendum

| U-ID | Target | Oracle |
|---|---|---|
| U-ADAPTER-009 | `checkCodexWrapperParity` / `runDoctor` | Claude Code project hooks and Codex wrapper parity are checked explicitly. Claude hook evidence must come from `.claude/settings.json`; Codex evidence must come from `ut-tdd codex --execute` / `--task-file` / `--plan ... --execute` lifecycle tests and stdin adapter oracles, not from assuming `.claude` hooks apply to Codex. `doctor` surfaces `codex-wrapper-parity - OK` and fail-closes when any side is missing. |

> Scope note (PLAN-L7-139): U-ADAPTER-009 covers the **delegation** path — how the
> harness drives Codex as a worker via `ut-tdd codex`. It deliberately does NOT
> assume `.claude` hooks apply to Codex. The complementary **direct / interactive**
> path (a developer running `codex` in this repo) is covered by an explicit
> repo-local `.codex/hooks.json` adapter, checked by `codex-hook-adapter` (U-CXHOOK
> below). The two are different surfaces; neither supersedes the other.

## PLAN-L7-139 Codex Hook Adapter Parity Addendum

| U-ID | Target | Oracle |
|---|---|---|
| U-CXHOOK-001 | `analyzeCodexHookAdapter` / `loadCodexHookAdapterInput` | Real-repo regression: the committed `.codex/hooks.json` shares the Claude guard entrypoints with Codex matchers and returns `ok:true` (`codex-hook-adapter - OK`). Substantiates the parity claim against the actual repo, not prose. |
| U-CXHOOK-002 | `analyzeCodexHookAdapter` | Missing `.codex/hooks.json` (`missing_hooks_json`) and malformed JSON (`malformed_json`) both fail closed. |
| U-CXHOOK-003 | `analyzeCodexHookAdapter` | A literal copy of the Claude matcher (`Edit\|Write\|MultiEdit`) fails closed (`missing_hook`) because it never fires under Codex tool names — guards against silent false-parity (coverage≠substance). |
| U-CXHOOK-004 | `analyzeCodexHookAdapter` | Dropping `blockOnFailure` on `work-guard` (`missing_block_on_failure`), using `$CLAUDE_PROJECT_DIR` in a Codex command (`claude_project_dir_in_codex`), and referencing global `~/.codex/` (`global_codex_path`) each fail closed. |
| U-CXHOOK-005 | `CODEX_REQUIRED` / `REQUIRED` (project-hook) | Every Codex guard entrypoint also exists in the Claude `REQUIRED` set (bidirectional: no silent fork between adapters; `entrypoint_drift` otherwise). |
| U-CXHOOK-006 | `CODEX_NOT_APPLICABLE` / `CODEX_DEFERRED_SURFACE` / `evaluateWorkGuard` / `evaluateAgentGuard` | Disposition is honest, not blanket-N/A (cross-runtime review correction): `subagent-stop` is genuinely N/A (codex.exe 0.128.0 has no `SubagentStop` event), but `agent-guard` is **not** N/A — Codex's `spawn_agent` sub-agent tool family exists, so it is recorded as a real, currently-unguarded **deferred** surface. The shared guard logic is runtime-agnostic (foreign-edit blocks; non-allowlisted subagent blocks) so parity is structural, not a per-runtime fork. |
| U-CXHOOK-007 | `extractEditTargets` (`src/runtime/work-guard.ts`) | False-parity regression (Critical, cross-runtime REJECT): Codex `apply_patch` is freeform with no `tool_input.file_path`, so paths must be parsed from the patch body (`*** Update/Add/Delete File:` / `*** Move to:`, multi-file). `extractEditTargets` returns explicit `file_path`/`path` for Claude/`write_file`, all patch-body paths for apply_patch (incl. command-array form), and does NOT misextract from doc `content` when an explicit `file_path` is present (false-block guard). |
| U-CXHOOK-008 | `analyzeCodexHookAdapter` | Analyzer hardening (cross-runtime review Important): a non-`command` hook does not satisfy a guard (`type==="command"` required), and a script-path that only appears as a substring of another token (e.g. `src/cli.tsx` vs `src/cli.ts`) does not satisfy a guard (token-exact matching). |
| U-CXHOOK-009 | `codexHookAdapterMessages` / `CodexHookResult.apiToolPathEnforced` | The adapter must not claim coverage for hosted API/developer tools. `.codex/hooks.json` covers direct Codex CLI/IDE sessions; this chat runtime's injected `apply_patch` path does not execute through the Codex hook engine and is surfaced as `apiToolPathEnforced=false`. |

## PLAN-L7-77 Codex Stdin Prompt Dispatch Addendum

| U-ID | Target | Oracle |
|---|---|---|
| U-ADAPTER-007 | `buildAdapterPlan` / `buildProviderInvocation` | codex の plan はプロンプトを `args` でなく `plan.stdin` に載せ、`args` は `exec` + `-` (stdin sentinel) のみでプロンプト本文を含まない (`codex exec -` は instructions を stdin から読む)。改行 + cmd.exe メタ文字 (`< > \| ( )`) を含むプロンプトは、Windows `.cmd` の shell-wrap 後の cmd.exe コマンド文字列にも現れず、改行で切り詰められない。Red→Green: pre-fix はプロンプトが args + wrapped 文字列に埋め込まれ truncatable。 |
| U-ADAPTER-008 | `buildAdapterPlan` / `buildProviderInvocation` / `ut-tdd claude --execute` | claude の plan は `--print --input-format text` を固定 argv とし、prompt 本文を `plan.stdin` で渡す。`-p <task>` は使わず、`<invoke name="Bash">...` 形式の native tool markup や改行を含む task text は argv / provider invocation string に現れない。fake Claude wrapper は stdin に task 本文を受け取り、session lifecycle digest は従来どおり `session_start` / `tool_use` / `session_end` を記録する。 |

## PLAN-L7-84 Status nextAction Field Addendum

| U-ID | Target | Oracle |
|---|---|---|
| U-DETECT-001 | `nextActionForMode` / `NEXT_ACTION_BY_MODE` | 4 mode (standalone / claude-only / codex-only / hybrid) 全てに対し SSoT `NEXT_ACTION_BY_MODE` の値を返し、空でない。`ut-tdd status --json` は 6 検出フィールドに `nextAction` を additive 付加する (camelCase 公開契約、A-138 ITEM-1)。 |
| U-DETECT-002 | `nextActionForMode("standalone")` | `human-review-required:` 接頭で始まる — AI レビュアー不在ゆえ判断ゲートは人間レビュー必須 (自動 pass 不可、concept §189 / requirements §2001)。 |
| U-DETECT-003 | `nextActionForMode("claude-only" / "codex-only")` | `single-runtime:` 接頭で始まり `intra_runtime_subagent` 証跡を要求する (単一 runtime fallback)。 |
| U-DETECT-004 | `nextActionForMode("hybrid")` | `cross-review-ready:` 接頭で始まる — judgment ゲートを別 runtime/model 族へ回す。 |
| U-DETECT-005 | `nextActionForMode` value-domain | 各値は先頭 token (`:` 手前) で機械 switch でき、後続が人間可読。公開 JSON 契約ゆえ ASCII のみ (machine-surface-language と整合)。 |

## PLAN-L7-85 Review Read-Only Guard Addendum

| U-ID | Target | Oracle |
|---|---|---|
| U-RGUARD-001 | `isReadOnlyDelegationRole` | 相談/検証 archetype (tl/qa/uiux) + review エイリアス (reviewer/review/security/audit) は read-only=true (§1.8 role taxonomy、判断側は実装代行しない、IMP-137)。 |
| U-RGUARD-002 | `isReadOnlyDelegationRole` | worker (se/docs)・未知ロールは read-only=false (誤検知回避 — guard はレビュー session のみ対象)。 |
| U-RGUARD-003 | `isReadOnlyDelegationRole` | ロール照合は trim + 大小無視で正規化。 |
| U-RGUARD-004 | `detectWorkingTreeMutation` | after にあって before に無い path を session 由来の変更として返す (sorted + unique、決定論)。 |
| U-RGUARD-005 | `detectWorkingTreeMutation` | 新規変更なし → 空配列。 |
| U-RGUARD-006 | `assessReviewSession` | read-only ロールが working tree を変更したら `violation=true` + `mutatedPaths` 記録。 |
| U-RGUARD-007 | `assessReviewSession` | worker ロールの変更は正当ゆえ `violation=false` (mutatedPaths は記録)。 |
| U-RGUARD-008 | `assessReviewSession` | read-only ロールが tree を変更しなければ `violation=false`。 |
| U-RGUARD-009 | `reviewGuardMessages` | violation 時、変更パス一覧 + IMP-137 再発防止ガイダンス (staged 前に inspect/revert) を 2 行で surface。 |
| U-RGUARD-010 | `reviewGuardMessages` | 非 violation → 空 (worker / clean は無音)。 |
| U-RGUARD-011 | `summarizeStagedReview` | staged 集合は sorted/unique、suspect = staged ∩ review-mutated (混入疑い)、suspect 非空で ok=false (commit 前 staged-diff の機械化)。 |
| U-RGUARD-012 | `summarizeStagedReview` | review-mutated 未提供 → suspect 空 + ok=true (純列挙)。 |
