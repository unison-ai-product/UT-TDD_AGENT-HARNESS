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
updated: 2026-07-10
---

## 2026-06-09 L6 pair-scope addendum

The historical pair text below was written when L6 only had `function-spec` and `edge-case`. For G6 readiness, the current L6 pair scope is the full directory `docs/design/harness/L6-function-design/*.md`, including add-design slices PLAN-L6-03..21.

This L7 document remains the single pair artifact for L6 and must carry a U-* oracle family for every L6 design artifact listed in `docs/plans/PLAN-L6-00-master.md` "L6 completion scope addendum".

The additional SQLite/reference-feedback/search/drive-log/skill-metric requirements are covered through `docs/design/harness/L6-function-design/fr-unit-coverage.md` and the U-FR-L1-* rows added at the end of this document. This is coverage of the function-design contract, not proof that every L7 implementation test already exists.

## 2026-07-03 L6 module-design crosswalk addendum

The L6 pair scope also includes module contract backfill docs added after the original G6 freeze. The following docs are paired to this test-design artifact and carry unit oracle families here:

| L6 doc | oracle family | primary test surface |
|---|---|---|
| `docs/design/harness/L6-function-design/context.md` | U-CONTEXT-001..005 | `tests/doc-router.test.ts` or equivalent context router unit tests |
| `docs/design/harness/L6-function-design/graph.md` | U-GRAPH-001..005 | `tests/graph-loader.test.ts`, `tests/relation-graph*.test.ts` |
| `docs/design/harness/L6-function-design/memory.md` | U-MEMORY-001..006 | `tests/memory-*.test.ts`, `tests/projection-writer.test.ts` |
| `docs/design/harness/L6-function-design/secret.md` | U-SECRET-001..005 | `tests/secret.test.ts` or memory secret fail-close tests |

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
| U-SLOG-009 | `renderEscalationSignals` (SessionStart surface cap) | escalation signal が 0 件なら空文字 / total 件数は header に保持 / 既定上限または指定 `maxSignals` 件だけを列挙 / `maxSignals<=0` は無制限 escape hatch / 残件は breadcrumb で示し、直前 session log 調査へ誘導する / STOP・root cause 文言は維持 |

### §1.5a U-FEEDBACK-SURFACE (takeover feedback surface 由来、PLAN-L7-400)
| U-ID | 検証対象 | oracle (DbC) |
|---|---|---|
| U-FEEDBACK-SURFACE-001 | `selectTakeoverFeedback` group-first cap | open feedback rows を `bucket/severity/signal_type` で group 化してから上位 group を選ぶ。同一 `signal_type` が多数行を占有しても別 `signal_type` の actionable cluster が不可視化されない。 |
| U-FEEDBACK-SURFACE-002 | `renderTakeoverFeedback` count/breadcrumb | 表示 group の count は group 内実件数を示す。隠れた actionable rows/groups がある場合は `ut-tdd feedback list --json` breadcrumb を出す。telemetry は従来通り signal count 要約に留める。 |

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
| U-SETUP-009 | `planSetup` / `emitSetup` | `0-A` の生成計画に clean adapter テンプレ (`AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` / `.claude/settings.json` / `.codex/config.toml` / `.codex/hooks.json` / `.claude/agents/ut-tdd-tl.md` / `.claude/commands/ut-tdd-status.md` / `.claude/commands/ut-tdd-test.md`) が含まれる。dry-run preview は adapter path を返し、dogfood repo 名や machine-local absolute path を含まない。 |
| U-SETUP-009a | `loadTemplates` / built-in adapter templates | `docs/design/harness/L6-function-design/skill-index.md` の runtime asset 配布境界に従い、配布 subagent template は `model:` frontmatter を持つ。代表 3 family として `pmo-sonnet`=sonnet、`pmo-haiku`=haiku、`pdm-tech-innovation`=opus を確認し、model ID は `MODEL_IDS.claude` catalog 外に出ないことを固定する。consumer-facing adapter docs/commands は `ut-tdd doctor --profile consumer-setup-smoke` を既定 health check とし、full `ut-tdd doctor` は source/governance repository 用として明示する。 |
| U-MODELID-SSOT | `.claude/agents` / `docs/templates/adapter` / `BUILTIN_GITHUB_TEMPLATES` | active agent frontmatter model は `MODEL_IDS.claude` catalog 内だけを許可する。disk template mirror は built-in fallback と一致し、旧 suffix (`claude-opus-4-7` / `claude-sonnet-4-6` / `20251001`) が再混入しないことを real-repo regression として固定する。 |
| U-SETUP-010 | `emitSetup` | 既存 consumer `AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` は既存行を verbatim 保全し、`<!-- UT-TDD:managed:start -->`〜`<!-- UT-TDD:managed:end -->` の managed block だけを追加/更新する。既存 `.claude/settings.json` は confirm なしに上書きしない。同じ setup を 2 回走らせても doc 内容は no-op。 |
| U-SETUP-011 | `buildCleanDistributionPlan` | clean distribution channel は `clean-repo-plus-tarball`。artifact path は LICENSE / package / src / adapter templates を含み、adapter templates には Claude/Codex hook・subagent・command 設定を含む。dogfood (`docs/plans` / `docs/design/harness` / `docs/test-design` / `.ut-tdd`) と root の開発用 `.claude` / `.codex` 状態、UI (`src/web`) は含まない。release integrity artifact (`tar.gz` / `sha256`) を要求する (D-4c unsigned 契約、`sig` 撤去)。 |
| U-SETUP-012 | `buildConsumerReadinessPlan` | Bun>=1.3 / git / gh / project-local `ut-tdd` CLI / runtime CLI を preflight として診断し、gh は GitHub setup 用 warning、Bun/git/project-local `ut-tdd` は blocking。runtime CLI 不在は `mode=standalone` の advisory とし、judgment gate は人間レビュー必須として表示する。生成 adapter hooks は `.ut-tdd/bin/ut-tdd.mjs ...` を呼ぶため、project-local CLI 未解決なら consumer hook 自走性を満たさず readiness を fail-close する。rollback managed paths、tag-pin contract、CI self-sufficiency、monorepo package-root 判定、全 smoke scenario を返す。 |
| U-SETUP-013 / AT-DIST-001 | `tests/distribution-acceptance.test.ts` | Local clean distribution acceptance smoke: planned clean artifacts を temp repo にコピーし、`bun install --frozen-lockfile`、`bun src/cli.ts status --json`、`bun src/cli.ts distribution plan --tag v0.1.0 --json`、`bun run typecheck` が fake provider CLI 付きで通ること。Pack `v0.1.0` tag / GitHub Release 後も、この local smoke は署名 tarball publish / UAT / post-release telemetry を実行しない。source repo 用 full `doctor` は dogfood PLAN/design/test-design/runtime artifact を除外する clean distribution の受け入れ条件には含めず、consumer doctor profile が必要なら別 PLAN とする。 |

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

### §1.8.1 U-MEMORY (共有 memory / PLAN-L7-189)

| U-ID | 関数 / surface | oracle |
|------|---|---|
| U-MEMORY-001 | `MemoryService.writeMemory` / `loadMemoryCorpus` | 唯一の公開write入口から `.ut-tdd/memory/<kind>-<slug>.md` をauthored sourceとして書き、frontmatter (`memory_id`, `kind`, `title`, `tags`, `updated_at`) と本文をdeterministicに再読込できる。 |
| U-MEMORY-002 | `MemoryService.writeMemory` / `parseMemoryFile` | title/body/tagsまたはfile全体にsecret-like payloadがあれば副作用前にfail-closeし、memory file / projection rowを作らない。 |
| U-MEMORY-003 | `rebuildHarnessDb` / `projectMemoryEntries` / `selectMemoryEntries` | `.ut-tdd/memory/*.md` から `memory_entries` へ projection し、query/limit 付きで read-only に選択できる。 |
| U-MEMORY-004 | `renderMemorySurface` / `ut-tdd memory recall` / SessionStart side effect | Claude/Codex 共通の `harness.db memory` block を出力し、空ならノイズを出さない。db 不在・破損・lock 時は fail-open で runtime を止めない。 |
| U-MEMORY-005 | `evaluateMemoryPromotion(events)` / Stop summary | commitまたはplan_switchがありmemory write成功が無いsessionだけ`memory_promotion_missed` telemetry候補へ進める。本文・prompt・git diffを読まず、memory書込みを強制しない。 |
| U-MEMORY-006 | feedback lifecycle projection | telemetryだけがTTL後ack対象で、gate/actionableはsource解消まで残る。消化済telemetryは同一sourceの再投影でopenへ戻らず、新観測だけが新generationを作る。DB書込失敗はfail-open。 |
| U-MEMORY-019 | MemoryService write boundary negative test | `src/**` の全production TypeScriptを走査し、MemoryService外でstorage primitiveを直接参照・import・export・re-exportするsourceが1件でもあればfail-closeする。primitiveはpublic exportに存在せず、CLIを含むconsumerは`writeMemory`だけを使う。 |

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
| U-TEAM-001 | `teamDefinitionSchema` | `strategy` 省略 → `"sequential"` (default) / `max_parallel` 省略 → `8` (default) / `max_parallel=8` → accept / `max_parallel>8` → zod throw (reject) / `members` 空配列 → zod throw (reject) / 不正 `role` (許可リスト外) → throw / 不正 `strategy` (`"burst"` 等) → throw / `serialize_after` + `serialization` (3 条件フィールド) を含む入力 → 受理 (`parsed.serialization.downstream_dependency===true` / `parsed.members[1].serialize_after==="se"`) |
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
| U-VPAIR-001 | `loadPairDocs` | `docs/design/harness/**` + `docs/test-design/harness/**` の frontmatter (path/layer/pair_artifact) を読む / `README.md`・`roadmap.md` を対象外 / inline コメント (`pair_artifact: <path>  # ...`) を除去して値抽出 |
| U-VPAIR-002 | `analyzePairFreeze` (pair-missing/ref-unresolved) | layer L1-L6 sub-doc で pair_artifact 欠落 → `pair-missing` 1件/`ok=false` / pair_artifact path 不実在 → `ref-unresolved`/`ok=false` |
| U-VPAIR-003 | `analyzePairFreeze` (trace-bidir) | design→test-design に対し test-design の dir 集合参照が design の所在 dir を含む → pair 成立 / 逆参照無 → `trace-orphan`/`ok=false` |
| U-VPAIR-004 | `analyzePairFreeze` (旧 self/group 非対応) | `pair_artifact: self`・design→design 参照 → `ref-unresolved` 孤児 (旧 self-pair/group hub は PLAN-RECOVERY-09 で撤去) / L2 sub-doc は L10-ux-validation-test-design.md 直接参照で rule 3 成立 |
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
| U-RELGRAPH-005 | `analyzeRelationImpact` docs/DB change | changed design/test-design/physical-data node expands to paired artifact, DB table nodes where applicable, PLAN DoD, and trace-freeze evidence actions without requiring source tests unless a behavioral contract edge exists. Real-repo loader coverage includes `docs/templates/adapter/` Claude/Codex hook, subagent, and command templates as design nodes so distribution template changes do not fall back with `missing-projection`. |
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
| U-DEPD-004 | PlanAsset/state-db real repository graph | `kernel`境界を介し、PlanAssetとstate-dbのcycleが0。 |
| U-DEPD-005 | full real repository module graph | `lint`は`DbIntrospectionPort`を所有しstate-db実装へ逆依存しない。全module cycleが0。 |
| U-REGEXP-001 | `expandRegressionScope` affected modules | changed source module expands to direct tests and reverse-dependent module tests. |
| U-REGEXP-002 | missing coverage | changed source module without direct test coverage returns `missing-regression-test` finding instead of silent fallback. |

> **Status (PLAN-REVERSE-42, 2026-06-11)**: U-DEPD-001..003 and U-REGEXP-001..002 are green in `tests/dependency-drift.test.ts` against `src/lint/dependency-drift.ts`. `doctor` now surfaces `dependency-drift` / `regression-expansion` and no longer emits the scaffold stub.

### §1.16.1e.1 U-DOMAIN (engine-swap domain / port / SQLite adapter)

| U-ID | Target | Oracle |
|---|---|---|
| U-DOMAIN-001 | neutral `normalizePath` boundary | Windows/POSIX separatorを同じpathへ正規化し、旧lint importは同一関数の互換re-exportである。 |
| U-DOMAIN-002 | PoC pure projector | permitted decisionだけを正規化し、DB・filesystem・clockへ直接依存せずdeterministic eventを返す。 |
| U-DOMAIN-003 | PoC application ports | read portの意味的countをdomainへ渡し、生成eventだけをstoreへ記録する。SQL文字列をportへ漏らさない。 |
| U-DOMAIN-004 | `SqliteProjectionStore` / `clearRebuildableProjectionTables` | unknown tableをfail-closeし、schema列とPKを正規化し、free-form secretを永続化前に拒否する。未解決PLAN joinとstale runtime contextを区別し、audit/compound contextを誤検出しない。再構築ではrebuildable rowを消去する一方、`refactor_candidates`負債ledgerを保持する。 |
| U-DOMAIN-005 | model evaluation domain/application/config/SQLite read | success rate 4桁、token効率2桁、cost効率6桁をpure計算し、success/token/cost不在時はNULLを捏造しない。disabled/malformed opt-inはread/store 0、cold-startはstore 0、時刻は注入値を使う。SQLiteは複数modelをgrouped集計し、orphan PLANをsuccess 0、全cost不明をNULLとして返す。 |
| U-DOMAIN-006 | operational metrics domain/application/SQLite read | drive成功集合と丸め前0.8境界、hook trouble、workflow blocked/human/retry、0母数、4桁表示をpure policyで固定する。N drive modeからN+4 eventをhost locale非依存のcode-unit順・一意ID・注入時刻で生成する。同一mode factは合算する。SQLite grouped readはretryをplan/workflow/phase単位で数え、NULL/literal unknown modeを同一groupへ正規化してcompletedとsignalを失わず、非0signalを隠さない。 |

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
| U-READ-005 | `analyzeByteIntegrity` | UTF-8 BOM / UTF-16 LE BOM / UTF-16 BE BOM をそれぞれ `utf8-bom` / `utf16le-bom` / `utf16be-bom` violation にする |
| U-READ-006 | `analyzeByteIntegrity` | 不正 UTF-8 byte sequence を lossy decode 後の文字列だけに頼らず `invalid-utf8` violation にする |
| U-READ-007 | `analyzeByteIntegrity` | BOM 無 UTF-16LE ASCII 相当の NUL byte と C1 control codepoint を `control-character` violation にする |
| U-READ-008 | `analyzeByteIntegrity` | `.json` の escaped U+FFFD / mojibake marker を JSON.parse 後の string/key 走査で `json-escaped-mojibake` violation にする |
| U-READ-009 | `analyzeArtifacts` | byte layer が clean な valid UTF-8 double-encode mojibake でも、string-level denylist を統合して violation にする |
| U-READ-010 | `checkReadability` / `checkRuntimeReadability` | real repo の docs/root instruction docs と `.ut-tdd` audit/handover artifacts が string + byte 統合 guard で green になる |

### §1.16.2b2 U-DELEG (正規委譲経路の role 検証 + model/effort routing、PLAN-L7-255)

> ペア = `src/team/delegation-routing.ts` + `buildAdapterPlan` codex effort argv。A-177 F-4 (role→model マッピング欠落) / A-183 PY-2 (codex effort argv 非注入) の是正を固定する。

| ID | 対象 | Oracle |
|---|---|---|
| U-DELEG-001 | `resolveDelegationRouting` | 未登録 role を allowlist 明示付きで fail-close する |
| U-DELEG-002 | `resolveDelegationRouting` | 判断ゲート role (blind-reviewer/code-reviewer 等) を族内 frontier reviewer tier (sol/opus) + ladder base effort へ固定する |
| U-DELEG-003 | `resolveDelegationRouting` | worker role (se) は selectTeamModel policy 経由で model+effort を解決する |
| U-DELEG-004 | `resolveDelegationRouting` | 明示 --model/--effort は routing より常に優先される |
| U-DELEG-005 | `buildAdapterPlan` (codex) | effort が argv `-c model_reasoning_effort=<effort>` へ実注入され、middle は medium へ正規化される |
| U-DELEG-006 | `buildAdapterPlan` (claude) | 既存の `--effort` flag + env 契約が routing 導入後も不変 |
| U-DELEG-007 | `DELEGATION_ROLE_ALLOWLIST` | 実 repo の役割語彙 (qa/blind-reviewer/tl/tl-advisor/se/reviewer/code-reviewer/pmo-*) を全て許容する |
| U-DELEG-008 | `resolveDelegationRouting` | subagent 名形 gate role (ut-tdd-tl/qa-test/security-audit) も worker tier へ落とさず族内 frontier reviewer tier へ固定する (2026-07-16 クロスレビュー指摘 1 regression) |
| U-DELEG-009 | `buildAdapterPlan` (codex) | ladder base `xhigh` (mini lane) が `-c model_reasoning_effort=xhigh` として argv へ素通しされる (codex-cli 0.144.1 実機受理 2026-07-16) |

### §1.16.2c U-DOCLOCK (doctor 多重起動 fail-fast、PLAN-L7-442)

> ペア = doctor singleton lock (`src/doctor/singleton-lock.ts`)。owner固有claim集合を用い、release/reclaimで他者generationを触らず、agent 再試行嵐による doctor プロセス滞留 (2026-07-16 メモリ枯渇 incident) の再発を2本目以降の即時 fail-fastで防ぐ。advisory guardでありlock障害ではdoctorを止めない (fail-open)。

| ID | 対象 | Oracle |
|---|---|---|
| U-DOCLOCK-001 | `acquireDoctorLock` | 初回取得が成功し pid/started_at/host/lock_id を owner 固有claimへ記録する |
| U-DOCLOCK-002 | `acquireDoctorLock` / `doctorLockBlockedMessage` | 保持者生存中の 2 本目は acquired=false で保持者情報付きメッセージを返す |
| U-DOCLOCK-003 | `acquireDoctorLock` | 保持 pid 死亡の lock は自動回収して取得する (再試行嵐残骸の除去) |
| U-DOCLOCK-004 | `isStaleDoctorLock` / `acquireDoctorLock` | 45 分超過の lock は保持 pid 生存でも stale として回収する |
| U-DOCLOCK-005 | `acquireDoctorLock` | 破損 lock file は crash せず stale 扱いで回収する |
| U-DOCLOCK-006 | `release` | 取得者自身のowner固有claimだけを削除し、通常経路で冪等に動作する |
| U-DOCLOCK-007 | `isStaleDoctorLock` / `acquireDoctorLock` | 別 host の fresh lock はローカル pid probe を行わず保持し、TTL 超過までは二重取得しない |
| U-DOCLOCK-008 | `acquireDoctorLock` | lock create I/O 障害は `degraded: true` で fail-open し、doctor 本体を遮断しない |
| U-DOCLOCK-009 | CLI `doctor` | 競合する CLI は検証開始前に exit 2、JSON `ok:false` と保持者情報を返す |
| U-DOCLOCK-010 | owner claim `release` | 他者のfresh owner claimが存在しても、自身のclaimだけを削除して他者claimを保持する |
| U-DOCLOCK-011 | owner claim arbitration | contenderは他のfresh claimを観測すると自身だけを取り下げ、既存holderを返してblockする |
| U-DOCLOCK-012 | CLI `review --staged` | 競合時は内部doctor開始前にexit 2、JSON `ok:false` と保持者情報を返す |
| U-DOCLOCK-013 | CLI `review --uncommitted` | 競合時は内部doctor開始前にexit 2、JSON `ok:false` と保持者情報を返す |

保証境界: この test pair は同一 repo の再試行嵐を抑止する advisory guard を検証する。
SMB/NFS/OneDrive をまたぐ strict lease、heartbeat、clock-skew 耐性は主張せず、
`PLAN-REVERSE-442` の設計 back-fill 対象とする。

### §1.16.3 U-WENC (write encoding guard、PLAN-L7-317)

> ペア = `governance-enforcement.md` §8。doctor/CI の readability gate を待たず、書き込み直後に UTF-8 no-BOM / mojibake marker 違反を可視化する。

| ID | 対象 | Oracle |
|---|---|---|
| U-WENC-001 | `hook post-tool-use` + `runWriteEncodingGuard` | `PostToolUse` が触った UTF-16LE `.md` を exit 0 のまま warning + `.ut-tdd/logs/encoding-violations.jsonl` 記録にする |
| U-WENC-002 | `hook post-tool-use` | UTF-8 no-BOM の日本語 `.md` は warning も violation log も出さない |
| U-WENC-003 | `runWriteEncodingGuard` | `Bash` / shell 系 tool は明示 target が無い場合に changed file fallback を使い、BOM 付き text を検出する |
| U-WENC-004 | `collectWriteEncodingGuardTargets` | `apply_patch` header から text path を抽出し、binary path は対象外にする |

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
| U-GID-001 | `analyzeGateIdFormat` | `G0.5` と `G1`〜`G14`、および `G8/G9` などの shorthand 分解結果を受理 |
| U-GID-002 | `analyzeGateIdFormat` | `G15` / `G01` / `gate-3` を `invalid_forward_gate_id` で fail-close |
| U-GID-003 | `checkGateIdFormat` | doctor full profile が `gate-id-format - OK` を surface し、repo root 不在では violation |

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
| U-GATE-007 | `ut-tdd gate --plan --session` / `writeGateRunEvidence` | gate 判定後に `.ut-tdd/gate_runs/*.json` が作成され、`gate_id`、`plan_id`、`status`、`session_id`、`command`、`checks[]`、`source=ut-tdd gate` を持つ。証跡書込は gate verdict を変えない。 |
| U-GATE-008 | `writeGateRunEvidence` failure boundary | `.ut-tdd/gate_runs` 書込失敗は `gate_run_evidence_warning` として surface されるが、`evaluateGateReview` / `evaluateStaticGate` の合成結果と exit code を変更しない。 |
| U-TEAMRUN-001 | `validateTeamRun` | hybrid 以外は fail / hybrid で worker(se) と reviewer(tl/qa) が別 provider なら pass |
| U-TEAMRUN-002 | `validateTeamRun` | 同一 role/provider 重複、worker/reviewer 同一 provider は fail |
| U-TEAMRUN-003 | `recommendTeamLaunch` + `buildTeamRunPlan` | `team suggest` が返す critical definition は `se -> tl -> qa` の依存順へ正規化され、全 member が high effort selection を持つ。member prompt は resolved `provider` を header に出し、`model_family` 推奨ラベルと runtime provider を混同しない |
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

### §1.23b Refactor candidate lifecycle oracle (PLAN-L7-367)

| U-ID | 対象 | oracle |
|---|---|---|
| U-REFACTOR-LIFE-001 | `migrate` / schema registry | `refactor_candidates` table と `idx_refactor_candidates_state` が作成される。 |
| U-REFACTOR-LIFE-002 | `projectRefactorCandidateSignals` | detector output が `refactor_candidates.state=open` として登録され、既存 `quality_signals` projection も維持される。 |
| U-REFACTOR-LIFE-003 | `decideRefactorCandidate` + `rebuildHarnessDb` | `rejected` にした candidate は次回 rebuild でも `open` に戻らず、feedback event が再発火しない。 |
- 関連 detector 後続 (`PLAN-L7-148`/`150`/`151`/`152`/`153`/`158`) は本 descent を基点とする (module extraction /
  closure sweep / precision+policy extraction)。

### §1.23c Verification defect_routing -> Refactor lifecycle oracle (PLAN-L7-410)

| U-ID | 対象 | oracle |
|---|---|---|
| U-REFACTOR-ROUTE-001 | `projectVerificationDefectRoutingRefactorCandidates` + `rebuildHarnessDb` | 右肺 `defect_routing` 文脈を持つ verification finding fixture は `refactor_candidates.kind=verification-defect-routing` と `quality_signals.source=verification-defect-routing` に投影される。 |
| U-REFACTOR-ROUTE-002 | `decideRefactorCandidate` + `rebuildHarnessDb` | `accepted` にした verification defect routing candidate は `linked_plan_id` を保持し、次回 rebuild で `open` に戻らず signal は `pass` へ落ちる。 |

### §1.24 U-SKILL-IDX (skill 索引モデル 由来、PLAN-L6-37 add-design / skill-index.md §1-§5、FR-L1-47/FR-L1-12)

> ペア = `skill-index.md` §1-§5。索引キー = L + 駆動モデル + メタデータ。L/駆動が共に空の skill だけ `category`
> (domain/project) で索引し、無索引 skill は fail-close。recommender は graduated メタデータ重なりで de-saturate。

| U-ID | 対象関数 | oracle (DbC) |
|---|---|---|
| U-SKILL-IDX-001 | `analyzeSkillAssignments` (workflow 非破壊) | `skill_type` + `applies_to.{layers,drive_models}` を持つ skill は従来どおり ok=true・violations=[] (workflow 索引退行なし) |
| U-SKILL-IDX-002 | `analyzeSkillAssignments` (domain 登録可) | L/駆動が共に空 + `category=domain` + `domain_tags` の skill は ok=true (**旧 lint なら missing-drive-models で落ちた**ものが通る) |
| U-SKILL-IDX-003 | `analyzeSkillAssignments` (project 登録可) | L/駆動が共に空 + `category=project` の skill は ok=true |
| U-SKILL-IDX-004 | `analyzeSkillAssignments` (無索引 fail-close) | L/駆動が共に空 + category 無 → `not-indexable` + ok=false (死蔵を落とす不変条件、§2.1) |
| U-SKILL-IDX-005 | `analyzeSkillAssignments` (category 値検証) | `category` が workflow/domain/project 外 → `unknown-category` + ok=false / `skill_type` 空は依然 `missing-skill-type` / layers/drive_models の値検証 (unknown-layer/unknown-drive-model) は維持 |
| U-SKILL-IDX-006 | `scoreSkill` (de-saturate) | 同一工程 (layer+drive 一致) で複数 skill が **score=1 に飽和せず**、実 catalog の token 分布を代表する fixture 上で metadata 重なりにより弁別される (DISCOVERY-03 §5 の同点アルファベット順退化を解消) / 同入力→同出力 (決定論) |
| U-SKILL-IDX-007 | `scoreSkill` (domain situation-pull) | L/駆動が空の domain skill は L 軸/駆動軸 0 点だが、task が `domain_tags` に一致すると metadata 重なり + category ヒットで浮上する (recommended 帯へ) |
| U-SKILL-IDX-008 | `scanSkillCatalog` / `catalogAutomationAssets` (category 投影) | skill frontmatter の `category` が `SkillCatalogEntry.category` / `automation_assets.category` 列へ投影され、search tokens に `category` + `domain_tags` が合流する / 実 repo skill 全件が indexable (not-indexable 0) |
| U-SKILL-IDX-009 | `shouldScoreSkillAsset` / `recommendSkillsForPlan` (wildcard checklist 境界) | `skills/review-checklist.yaml` 相当の全 L 層×全駆動 review/checklist data asset は workflow skill の関連度 scoring 候補から除外され、`required` bucket に常時浮上しない |
| U-SKILL-IDX-010 | `projectSkillEvaluations` / `scoreSkillDetailed` (runtime-provenance learning) | `skill_evaluations` は `skill_invocations.source LIKE "runtime-hook:%"` の実発火だけから作られ、`auto-projection:*` は adoption/success/unused signal に混入しない。runtime 実績がある skill のみ learning adjustment が reason と score に反映される |
| U-SKILL-IDX-011 | `recommendSkillsForPlan` / `projectSkillTelemetry` (shared scorer) | CLI skill 推奨と DB projection は同一 scorer を使い、同一 plan・同一 catalog 入力で skill 順位と score が一致する。`scoreSkill` / `skillScore` の二重実装 drift を許さない |

### §1.24a `ut-tdd skill new` scaffolder (PLAN-L6-37 後続 add-feature 同梱)

| U-ID | 対象関数 | oracle (DbC) |
|---|---|---|
| U-SKILL-NEW-001 | `scaffoldSkill` (workflow) | `--category workflow --layers L6 --drive Forward` → skill.v1 frontmatter (schema_version/name/skill_type/applies_to) 付き markdown を生成し、生成後 `analyzeSkillAssignments` が ok=true |
| U-SKILL-NEW-002 | `scaffoldSkill` (domain) | `--category domain --domain-tags writing` → L/駆動なし + category=domain + domain_tags 付きを生成、ok=true |
| U-SKILL-NEW-003 | `scaffoldSkill` (project 配布境界) | `--category project` の出力先は `docs/skills/` でなく利用側 root (配布境界 §6) / 既存 name と衝突する場合は上書きせず finding |

### §1.24b U-SKILL-ADMIT (skill admission gate 由来、PLAN-L6-67 add-design / skill-admission.md §4-§8、FR-L1-19/12/24 拡張)

> ペア = `skill-admission.md` §4-§8。新規 skill 候補を novelty / decision-usefulness / harness-fit の 3 要件で判定し、
> judge を CI/doctor 合否に入れず、決定論残渣だけを hard gate 化する。admit は機械条件の合成でのみ成立し、
> judge 単独の no_objection では fail-open しない。

| U-ID | 対象関数 | oracle (DbC) |
|---|---|---|
| U-SKILL-ADMIT-001 | `analyzeSkillFit` | `analyzeSkillAssignments` を再実装せず委譲し、索引違反・readability・trigger 衝突を合成する。repairable は frontmatter 正規化など機械修復可能な違反だけ true。 |
| U-SKILL-ADMIT-002 | `computeSkillNovelty` | 凍結 catalog snapshot に対し `metadataOverlap` で nearest N と maxOverlap を決定論的に返し、閾値で novel / ambiguous / duplicate に分類する。 |
| U-SKILL-ADMIT-003 | `analyzeDecisionPoints` | `decision_points` が 1 件以上あり、一般語 denylist だけの項目を nonGeneric=false として reject 可能にする。 |
| U-SKILL-ADMIT-004 | `repairSkillCandidate` | repairable な fit 違反だけを機械修復し、本文意味や `decision_points` の中身は生成しない。同じ候補を再入力すると appliedFixes は空になる。 |
| U-SKILL-ADMIT-005 | `resolveAdmission` | `admit-new` は fit.ok、novelty=novel、decisionPoints present/nonGeneric、judgeVerdict=no_objection が全て揃う場合だけ成立する。欠けた条件は reject / flag / needs-judge / repair-then-admit / merge-supersede に分岐する。 |
| U-SKILL-ADMIT-006 | judge dispatch 境界 | judge は reject / flag / no_objection だけを返し、admit 権を持たない。単一 runtime では no_objection を許さず、自己肯定で admit できない。 |
| U-SKILL-ADMIT-007 | `analyzeSkillSupersession` | duplicate 判定の merge-supersede は `supersedes` と被 supersede 側の逆参照が揃う場合だけ成立し、片方向参照を fail-close する。 |
| U-SKILL-ADMIT-008 | `renderSkillCatalogIndex` | frontmatter catalog を SSoT に索引一覧を生成し、手編集された SKILL_MAP drift を検出可能にする。 |
| U-SKILL-ADMIT-009 | `analyzeAdmissionCoverage` | baseline に存在しない新規 skill の admission 台帳欠落と catalog drift だけを deterministic に検出し、judge/LLM 呼び出しを doctor/CI 合否に含めない。 |

## §2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)

- function-spec §1 関数 → U-FUNC-01〜04
- function-spec §2 pseudocode → U-CORE-01〜04
- function-spec §4 rule engine → U-RULE-01〜03
- edge-case 4 観点 → U-EDGE-01〜03
- **session-log.md §3 関数 (resolveActivePlan/recordEvent/compressPlanDigest/onStop/onSessionStart) + CLI hook entrypoints → U-SLOG-001〜007** (add-feature 差分、PLAN-L6-03。孤児 0)
- **forced-stop-feedback.md §2.3 関数 (detectDanglingTurn/recordForcedStop/classifyFeedback/recordFeedback/pendingRecoveryProposals/scanDanglingStops/emitClassifyRequest) → U-FSF-001〜007** (add-feature 差分、PLAN-L6-04。孤児 0)
- **setup-solo-team.md §2.3 契約関数 7 本 (detectProjectScale/recommendPhase/planSetup/emitSetup/recordSetupState/applyBranchProtection/runSetup) → U-SETUP-001〜007** (add-feature 差分、PLAN-L6-05。renderArtifacts は emitSetup 内部 helper = U-SETUP-004 に内包。孤児 0)
- **skill-index.md §7 配布 repo の skill 配置 / runtime asset 境界 → U-SETUP-009a / U-MODELID-SSOT** (配布 adapter の `model:` frontmatter と `MODEL_IDS` SSoT drift を unit test で固定。孤児 0)
- **handover-mechanism.md §2.3 関数 (resolveHandoverScope/buildPointer/scaffoldFromDigests/renderHandoverScaffold/handoverStale/writePointer/setActivePlan/inferPlanFromCommit/runHandover) → U-HOVER-001〜007** (add-feature 差分、PLAN-L6-06。writePointer は U-HOVER-007 orchestration 経路で被覆。session-log への限定 amendment = setActivePlan/inferPlanFromCommit 配線は U-HOVER-006 で被覆。孤児 0)
- **handover IMP-048/047 差分 (sameFamilyPlan/dedupeDigests/resolveHandoverScope scopeToActive/readPointer/checkHandoverDiscipline) → U-HOVER-008〜010** (IMP-048 dedup + scopeToActive、IMP-047 readPointer/discipline。孤児 0)
- **handover IMP-078 品質増分 (checkHandoverBypass/countHandoverEntries/resolveHandoverScope scopeToSession/latestSessionId/readPlanMeta family 解決/活性化 activePlanStale 連動) → U-HOVER-011〜012 + U-SLOG-006** (gap① bypass / gap② stale / gap③ commit hash / gap④ session-scope / gap⑤ unknown-kind。PLAN-L6-16/L7-17。readPlanMeta は U-HOVER-012 runHandover 経路に内包。孤児 0)
- **handover A-138 ITEM-4 + PLAN-L7-83 累積/drift 増分 (renderHandoverScaffold slimSummary / boundSameDayEntries 累積上限 / runHandover marker reconcile) → U-HOVER-013〜015** (slim stub・bounded entries (anchor+直近保持/breadcrumb)・marker reconcile (complete→clear / --plan→sync / dryRun 非破壊)。PLAN-L7-83。孤児 0)
- **agent-slots.md §2.3 関数 (loadSlots/fireSlot/releaseSlot/releaseOldestGuardSlot/sweepStaleGuardSlots/listActiveSlots/listStaleSlots/peakParallel/exceedsParallelLimit/recordGuardFire) → U-SLOT-001〜008** (add-feature 差分、IMP-050 + IMP-106 SubagentStop release。nodeAgentSlotsDeps は実 I/O deps で unit では mock 代替。孤児 0)
- **module-drift.md §2-§3 関数 (parseListedModules/scanActualModules/analyzeModuleDrift/loadModuleDocs/moduleDriftMessages) → U-MDRIFT-001〜005** (add-feature 差分、PLAN-L7-16/IMP-075。moduleDriftMessages は U-MDRIFT-003/004 経路 + 専用 assert で被覆、loadModuleDocs は U-MDRIFT-005 実 repo ガードに内包。孤児 0)
- **module-drift.md asset-drift alias (loadAssetDriftInput/analyzeAssetDrift/assetDriftMessages/checkAssetDrift) → U-ASSETDRIFT-001〜006** (内部資産 + prompt template cutover 差分、FR-L1-49。legacy source path residue / legacy command residue / docs-skills vacancy / guard allowlist missing を doctor hard guard。孤児 0)
- **skill-index.md §1-§5 関数 (analyzeSkillAssignments 索引反転 / scoreSkill de-saturate / runtime-provenance learning / wildcard checklist scoring 除外 / scanSkillCatalog+catalogAutomationAssets の category 投影) → U-SKILL-IDX-001〜011** (add-design 差分、PLAN-L6-37 + PLAN-REVERSE-277。索引キー = L+駆動+メタデータ、category fallback、indexable-by-something fail-close、de-saturate、CLI↔DB scorer SSoT。孤児 0)
- **skill new scaffolder (scaffoldSkill) → U-SKILL-NEW-001〜003** (PLAN-L6-37 同梱 add-feature。規約準拠雛形生成 + 生成後 lint ok + 配布境界。孤児 0)
- **skill-admission.md §4-§8 関数 (analyzeSkillFit/computeSkillNovelty/analyzeDecisionPoints/repairSkillCandidate/resolveAdmission/analyzeSkillSupersession/renderSkillCatalogIndex/analyzeAdmissionCoverage) → U-SKILL-ADMIT-001〜009** (add-design 差分、PLAN-L6-67。品質 3 要件、4種判定、judge fail-open 封止、台帳/カタログ drift の決定論検査。孤児 0)
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

### 2026-06-29 L14 Close Audit Oracle Addendum

- U-L14CLOSE-001: `analyzeL14CloseAudit` accepts a complete A-143 matrix only when all expected close rows exist, including L10 UX, L11 UAT, L12 release acceptance, L13 post-deploy, and L14 operations feedback boundaries.
- U-L14CLOSE-002: missing expected rows produce `missing_expected_item` instead of allowing broad prose close claims.
- U-L14CLOSE-003: open boundary rows (`partial`, `human_required`, `external_required`, `parked_future`) require a non-empty next action.
- U-L14CLOSE-004: evidence cells must contain existing repo-relative paths under approved evidence roots.
- U-L14CLOSE-005: the live repository A-143 audit loads through `loadL14CloseAuditDocs` and matches the required row order.
- U-L14CLOSE-006: item-specific hardening evidence for workflow definition, system foundation, Claude/Codex parity, clean distribution, version-up, brownfield onboarding, cross-project workflow, L1/L2 mock roundtrip, L10 UX, drive-model bookbinding, and green evidence integrity must be present, not only generic existing paths.
- U-L14CLOSE-007: missing A-143 audit source is a hard violation message, not a silent skip.
- U-L14CLOSE-008: non-closed external/human/release boundary rows must keep item-specific markers in gap and next-action cells. After Pack tag/release publication, the release boundary marker is signed tarball signature rather than stale tag-push absence; PO UAT/signoff, post-deploy, operations feedback, hosted/API Codex, and signature boundaries cannot be replaced by vague prose.

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
- U-FR-L1-48 covers command catalog generation from the actual CLI surface. After PLAN-REVERSE-395, the oracle must distinguish top-level/subcommand paths, JSON-capable commands, expected exit profiles (0/1/2/provider-propagated), and registrar-owned command families (`codex`/`claude`, `distribution`, `feedback`). Shell completion design must consume this catalog and must not invent unregistered command paths.
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
| U-ADAPTER-003 | `buildProviderInvocation` | Windows `.cmd` / `.bat` provider commands are launched via canonical `cmd.exe` argument-array invocation with Node `shell=false`; non-script binaries also keep `shell=false`. |
| U-ADAPTER-004 | `isProviderCommandSpawnable` / `detectMode` | Provider availability is true only when the resolved provider command can spawn successfully; PATH name presence alone is not enough. |
| U-PHOVER-002 | `buildProviderHandover` | Provider handover packages include `handover_kind: "mechanical"` so machine routing data is not confused with explicit human handover. |

## PLAN-L7-76 Reliability Remediation Addendum

| U-ID | Target | Oracle |
|---|---|---|
| U-DBPROJ-ATOMIC-01 | `rebuildHarnessDb` | The truncate + re-project sequence runs inside one `BEGIN IMMEDIATE` transaction. Injecting a failure during projection (a wrapped `db` that throws on the first `INSERT INTO plan_registry`, i.e. after `truncateProjectionTables` has emptied the tables) re-throws and **rolls back**, leaving the prior committed `plan_registry` projection intact (row count unchanged, not 0). Red→Green: fails pre-fix (188 → 0). |
| U-DBPROJ-PROV-01 | `analyzeDbProjectionIngestion(..., { enforceTelemetryProvenance: true })` | Populated telemetry tables (`skill_invocations`, `test_runs`, `guardrail_decisions`, `model_runs`) with only projection provenance are not acceptable evidence for "fired/used/works" claims. Default doctor can surface migration state as partial, but provenance-enforced mode fail-closes when runtime rows are 0 and projection rows are non-zero. |
| U-DBPROJ-PROV-02 | `projectRuntimeTestRunFromSessionEvent` | A session-log Bash verification event (`Bash (vitest)` etc.) creates exactly one `test_runs` row with non-empty `session_id`, `runtime=hook-session-log`, `scope=runtime-hook`, and the JSONL evidence path; non-verification Bash events such as `Bash (git)` do not fabricate runtime test evidence. |
| U-DBPROJ-PROV-03 | `checkDbProjectionIngestion` / `projectRuntimeModelTelemetryForDoctor` | Doctor's in-memory DB rebuild overlays existing Claude/Codex JSONL token usage through `projectTokenUsage`, so `model_runs` with token/cost-valued columns count as runtime provenance without requiring provider CLI execution. The deterministic `db rebuild` command remains source-projection-only. |
| U-DBPROJ-PROV-04 | `projectRuntimeGuardrailDecisionFromSessionEvent` | A session-log `forced_stop` event creates exactly one `guardrail_decisions` row with non-empty `session_id`, `guardrail=forced-stop`, `decision=block`, `mode=runtime-hook`, and the JSONL evidence path; ordinary `tool_use` events do not fabricate guardrail decisions. |
| U-DBPROJ-PROV-05 | `summarize` / `projectRuntimeSkillInvocationFromSessionEvent` | A Bash command containing `skill suggest` is logged as `Bash (skill)`. A session-log `Bash (skill)` event creates `skill_invocations` rows with non-empty `session_id`, `source=runtime-hook:skill-suggest`, and accepted status from the hook outcome; generic `Bash (bash)` events do not fabricate skill invocations. |
| U-DBPROJ-GATE-01 | `rebuildHarnessDb` / `.ut-tdd/gate_runs/*.json` | gate run evidence JSON を読み、`gate_runs` と `workflow_runs(workflow=routine-gate, phase=<gate_id>)` へ投影する。同一 `plan_id/workflow/phase` の複数 attempt は `projectRetryEvents` により `retry_events.attempt_count` として検出される。 |
| U-DOCTOR-GATE-01 | `analyzeGateRunCoverage` / `checkGateRunCoverage` | workflow row に対応する gate row 欠落、plan_registry に無い orphan gate row、plan_id 空の gate row、壊れた evidence JSON は `gate-run-coverage` で fail-close。gate/workflow が join 済みなら OK。 |
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
## PLAN-L6-36 Screen Spec Addendum

This addendum pairs `screen-spec.md` with L7 unit-test oracles. It covers the L6 FE per-screen function specification for the 15 central dashboard screens and keeps the UI read-only/copy-only boundary testable at function level.

| U-ID | Target | Oracle |
|---|---|---|
| U-SCREEN-001 | `parseScreenQuery(input) => ScreenQuery` | Missing or invalid query values normalize to documented defaults for PM/HM/GD screen routes. |
| U-SCREEN-002 | `validateScreenQuery(query) => ValidationResult` | Unknown screen id, layer, status, and unsafe document path are deterministic validation errors. |
| U-SCREEN-003 | `handleScreenEvent(event, state) => ScreenEventResult` | Events return only navigation, filter, expand, refresh, or copy results; shell/provider/file-write execution is forbidden. |
| U-SCREEN-004 | `loadScreenViewModel(projectId, query) => ViewState` | loading, ok, empty, stale, and error states remain distinct and use L4 state semantics. |
| U-SCREEN-005 | `classifyTelemetryProvenance(row) => TelemetryProvenance` | Runtime claims are rejected unless runtime source/session fields exist; projection/advisory rows remain labelled. |
| U-SCREEN-006 | `buildRouteRegistry(screens) => RouteRegistry` | Route registry contains exactly 15 screen ids and no duplicate route paths. |
| U-SETUP-014 | `runDoctor({ setupSmoke: true })` / `tests/doctor.test.ts` / `tests/distribution-acceptance.test.ts` | fresh consumer では dogfood PLAN/design/test-design を要求せず、project-local wrapper と Claude/Codex adapter hook だけを検査する。`.ut-tdd/bin/ut-tdd.mjs` と adapter docs/config が存在し、`.claude/settings.json` と `.codex/hooks.json` が JSON parse 可能で、Claude/Codex の両方に `agent-guard` / `work-guard` / `session start` / `post-tool-use` / `session summary` が wrapper 経由で配線され、Claude には `subagent-stop` が配線される。hook command は `$CLAUDE_PROJECT_DIR` と global `.codex` に依存しない。 |

## §5 L6 設計 ↔ 単体テスト設計 対応表 (PLAN-L7-330、可視化のみ、2026-07-03)

> L6 設計 21 本 (`docs/design/harness/L6-function-design/*.md`) と実 `tests/` 配下の対応関係を機械的 Grep (U-ID / 関数名) で突合した棚卸し。§2 量閉じ一覧の集合的宣言 (孤児 0) を doc 単位の行に展開し、テスト設計粒度を可視化する。個別 doc 化はしない最小対処 (本 PLAN スコープ)。

| L6 doc | 機能 | 対応 test ファイル | 判定 |
|---|---|---|---|
| function-spec.md | 関数 signature (§1) / pseudocode (§2) / rule engine 10 型 (§4) / routeFiling 契約 / spec IR projection 契約 | tests/plan-lint.test.ts, tests/vmodel-pair.test.ts, tests/agent-guard.test.ts, tests/mode-catalog.test.ts, tests/frontmatter.test.ts (U-FUNC/U-CORE/U-RULE は分散実装、専用 U-ID タグ無し)。後続 U3 L7 で tests/spec-ir-projections.test.ts, tests/projection-writer.test.ts, tests/doctor.test.ts に U-SPECIR を実装する。 | covered + pending U3 L7 |
| edge-case.md | `@edge-normal/error/boundary/throws` 4 観点 | 各 lint test の `@edge-*` 契約実装先に分散 (専用ファイル無し) | covered |
| session-log.md | resolveActivePlan/recordEvent/compressPlanDigest/onStop/onSessionStart | tests/session-log.test.ts | covered |
| forced-stop-feedback.md | detectDanglingTurn/recordForcedStop/classifyFeedback/recordFeedback/scanDanglingStops | tests/forced-stop.test.ts | covered |
| setup-solo-team.md | detectProjectScale/recommendPhase/planSetup/emitSetup/recordSetupState/applyBranchProtection/runSetup | tests/setup.test.ts | covered |
| handover-mechanism.md | resolveHandoverScope/buildPointer/scaffoldFromDigests/renderHandoverScaffold/handoverStale/runHandover | tests/handover.test.ts | covered |
| agent-slots.md | loadSlots/fireSlot/releaseSlot/releaseOldestGuardSlot/sweepStaleGuardSlots/peakParallel/exceedsParallelLimit | tests/agent-slots.test.ts | covered |
| governance-enforcement.md | scrum-reverse (pocOrphans/badReverseRefs) + propagation (signal 語彙一致) | tests/scrum-reverse.test.ts, tests/propagation.test.ts | covered |
| backfill-pairing.md | parseRequires/parseGlossaryTerms/analyzeBackfill/loadBackfillDocs/checkBackfill | tests/backfill-pairing.test.ts | covered |
| vmodel-pair-freeze.md | loadPairDocs/analyzePairFreeze (§1-§3) + analyzeVerificationGroups (§7) | tests/vmodel-pair.test.ts | covered |
| review-evidence.md | hasReviewEvidence/parseReviewPlan/analyzeReviewEvidence/loadReviewPlans | tests/review-evidence.test.ts | covered |
| review-evidence-stale.md | draft/降格 PLAN の stale approval 検出 (U-REVIEW-007/008) | tests/review-evidence.test.ts | covered |
| cross-review-enforcement.md | extractReviewEntries/crossReviewViolations (U-XREVIEW) | tests/review-evidence.test.ts | covered |
| test-before-review.md | tests_green_at ≤ reviewed_at 順序検証 (U-TORDER) | tests/review-evidence.test.ts | covered |
| module-drift.md | parseListedModules/analyzeModuleDrift + asset-drift/change-impact/coding-rules/ddd-tdd-rules addendum | tests/module-drift.test.ts, tests/asset-drift.test.ts, tests/change-impact.test.ts, tests/coding-rules.test.ts, tests/ddd-tdd-rules.test.ts | covered |
| descent-obligation.md | loadDescentAdjacency/generateObligations/analyzeDescentObligations | tests/descent-obligation.test.ts | covered |
| skill-index.md | analyzeSkillAssignments/scoreSkill/scanSkillCatalog + skill new scaffolder | tests/skill-assignment.test.ts, tests/skill-scaffold.test.ts, tests/skill-recommend.test.ts | covered |
| fr-unit-coverage.md | U-FR-L1-* FR registry ↔ L6 spec ↔ U-* oracle 被覆 | tests/l6-fr-coverage.test.ts, tests/fr-registry-audit.test.ts, tests/fr-roadmap-coverage.test.ts | covered |
| gate-confirm.md | judgment gate と confirm 結合 (U-GCONF) | tests/gate-confirm.test.ts | covered |
| plan-schedule-lint.md | 工程表 schedule 最小強制 (U-PLANSCH) | tests/plan-lint.test.ts | covered |
| screen-spec.md | parseScreenQuery/validateScreenQuery/handleScreenEvent/loadScreenViewModel/buildRouteRegistry (U-SCREEN-001〜006) | tests/screen-impl-pair-freeze.test.ts は pair-freeze gate のみを被覆し、上記個別関数 (parseScreenQuery 等) を直接 Grep しても実 test 未検出 | **gap** |

## PLAN-L6-38 Router Function Contracts Addendum (駆動モデルルーター関数契約、2026-07-07)

> 設計ペア: `docs/design/harness/L6-function-design/function-spec.md` の `routeFiling` /
> `analyzePlanGovernance.routeModeKindLayer` / `assertL7HasDesignAncestor` 契約 (PLAN-L6-38)。
> 機構側は internal-processing.md Appendix C (PLAN-L5-10、↔ L8 IT-ROUTE)。実装は後続 add-impl (L7)。
> **oracle ID 採番規律**: 正式 3 桁 oracle ID (`U-ROUTE-1XX`) は後続 add-impl 着手時に tests への
> citation と同時に採番する (forward-citation 規律 = `oracle-test-trace` NEW gate。宣言だけ先行させて
> 未 citation orphan を作らない)。下表の 2 桁 ID は本 addendum 内の設計参照用。

| U-ID | Target | Oracle |
|---|---|---|
| U-ROUTE-R1 | `routeFiling(signal)` | 既知 token → mode は `routeSignalToMode` と一致し、`layer_band` / `allowed_kinds` が L4 §3.1 表と一致する FilingTarget を返す (照合対象は L4 §3.1 掲載 mode。拡張 2 mode = design-bottomup/version-up は L4 back-fill 完了までは C.2 暫定 band と一致で可)。 |
| U-ROUTE-R2 | `routeFiling(signal)` (Forward 正規) | 未知 token / 例外条件不成立 → `mode=forward` を返し (default fall-through)、未知 token は warn を伴う。silent success にしない。 |
| U-ROUTE-R3 | `routeFiling(signal)` (不変条件) | 非 forward の FilingTarget は `forward_insufficient_reason` 無しに生成されない。生成時は reason にトリガ signal が含まれる。 |
| U-ROUTE-R4 | `routeFiling(signal)` (cold L7 禁止) | いかなる signal に対しても `(allowed_kinds=[impl] 単独, layer_band=[L7])` の filing 入口を emit しない。 |
| U-ROUTE-R5 | `routeFiling(signal)` (競合/境界) | 失敗系 signal 競合は Incident > Recovery > Reverse > Refactor の全順序で解決。最長一致 (`regression_prod` が `regression` に吸われない)。escalation 境界 signal は mode 非依存で `requires_human_approval=true` へ昇格。 |
| U-ROUTE-R6 | `analyzePlanGovernance.routeModeKindLayer(plan)` | `route_mode` の layer band 外の non-archived PLAN は `route_mode_kind_layer_mismatch` で fail-close。band 内は violation 0。実装済み oracle は `U-PLANGOV-011v4`: `verify` は L8-L14 のみ、`add-feature` は L3-L7 のみを受理する。 |
| U-ROUTE-R7 | `analyzePlanGovernance.routeModeKindLayer(plan)` (免除) | legacy landed / draft debt は `routeModeKind` と同一 allowlist を使う。legacy landed は恒久免除、draft debt は status=draft の間のみ免除し、着手時に fail-close。`promote_by` 有効期限 + justification までの escape hardening は Appendix C.4 carry として別 slice で固定する。 |
| U-ROUTE-R8 | `assertL7HasDesignAncestor(plan, registry)` | `layer=L7` の impl 系 PLAN (`impl`/`add-impl`) は parent 連鎖が設計層 PLAN (L4/L5/L6 の design/add-design) に到達しなければ `l7_cold_intake` で fail-close。到達すれば violation 0。 |
| U-ROUTE-R9 | `assertL7HasDesignAncestor(plan, registry)` (two-phase intake) | 対の Reverse PLAN が draft でも intake (draft 起票) は許容。confirmed 昇格時は双方 pairing ready (相互参照解決 + Reverse 側 forward_routing 宣言) でなければ fail-close。 |
| U-ROUTE-R10 | `routeFiling(signal)` (Reverse 出所必須) | `mode=reverse` の FilingTarget は `origin` (origin signal / origin plan_id) を必ず持つ。出所なき standalone reverse は途中導入 (既走プロジェクト onboarding) signal の場合のみ emit され、それ以外は fail-close。`requires_human_approval` は escalation 境界昇格の結果として FilingTarget 自身が保持する。 |
| U-ROUTE-R11 | `analyzePlanGovernance.verifyGateBinding(plan)` / `frontmatterSchema` | `kind=verify` は `layer=L8..L14` と `verification_gate=G8..G14` を 1:1 で宣言しなければ `verify_gate_missing` / `verify_gate_layer_mismatch` で fail-close。non-verify PLAN の `verification_gate` も拒否し、右腕 gate を実装・設計 PLAN に誤接続しない。実装 oracle は `U-PLANGOV-011v5` と `frontmatter.test.ts` の verify gate 契約。 |
| U-RLG-001 | `analyzeRightLungDocGovernance(input)` | L8/L9/L10/L12/L14 の各 right-lung test-design doc が `Gx-WORKFLOW` と 9 marker (`test_strategy` / `test_plan` / `test_conditions` / `coverage_items` / `test_procedures` / `execution_evidence` / `exit_criteria` / `defect_routing` / `verification_design`) と層別 test case ID family (`IT-` / `ST-` / `UXV-` / `AT-` / `OT-`) を持てば pass。 |
| U-RLG-002 | `analyzeRightLungDocGovernance(input)` | workflow marker、`defect_routing` / `verification_design` などの必須 marker、または層別 test case ID family が欠落した doc は violation として missing marker 名を返す。 |
| U-RLG-003 | `checkRightLungDocGovernance(repoRoot)` / doctor full profile | repo root 不在は fail-close。実 repo は 5 doc checked で green となり、doctor full profile に `right-lung-doc-governance` が配線される。 |

## PLAN-L6-39 Vモデル Spec IR Function Contracts Addendum (2026-07-08)

> 設計ペア: `docs/design/harness/L6-function-design/function-spec.md` の `loadSpecIrSources` /
> `parseSpecDefs` / `parseSpecRelations` / `parseScheduleEntries` / `parseActivationEntries` /
> `projectSpecIr` / `analyzeSpecIrIntegrity` / `deriveDetectorRouteCandidates` 契約 (PLAN-L6-39)。
> 物理 table は `docs/design/harness/L5-detailed-design/physical-data.md` §9.9 (PLAN-L5-13)。
> 実装は後続 add-impl (L7)。
> **oracle ID 採番規律**: 正式 3 桁 oracle ID (`U-SPECIR-1XX`) は後続 add-impl 着手時に tests への
> citation と同時に採番する。下表の R 系 ID は本 addendum 内の設計参照用であり、孤児 oracle を作らない。

| U-ID | Target | Oracle |
|---|---|---|
| U-SPECIR-R1 | `loadSpecIrSources(input)` | repo-relative root だけを読み、source docs / PLAN / test-design / schedule / activation profile を書き換えない。missing root は warn finding、secret-like / PII-like / raw transcript payload は projection input に載せない。 |
| U-SPECIR-R2 | `parseSpecDefs(bundle)` | 同一 input から stable `spec_id` / `source_hash` / `section_anchor` を生成する。未知 layer/sub_doc、重複 ID、空 definition は finding 化し、仕様を補完創作しない。非ASCII見出しなど ASCII 正規化で情報が落ちる ID は hash suffix で衝突を避ける。 |
| U-SPECIR-R3 | `parseSpecRelations(bundle, defs)` | relation_kind は allowlist (`defines` / `requires` / `verifies` / `pairs` / `derives` / `supersedes`) のみ許可。orphan relation、self-loop、未知 relation_kind は finding。`dependency_edges` と混同しない。一意な短縮 PLAN ID と `docs/adr` / `docs/process` / `docs/migration` / `docs/governance` の参照 doc は解決対象に含める。 |
| U-SPECIR-R4 | `parseScheduleEntries(bundle)` | 工程管理表から deterministic `schedule_entries` draft を返す。date/state 欠落、未解決 plan_id、過去 due 未完了は finding。PLAN status は mutate しない。 |
| U-SPECIR-R5 | `parseActivationEntries(bundle)` | enabled profile は reason を必須とし、未知 drive/mode または profile 欠落を finding/fail-close 候補にする。暗黙 default で駆動モデルを有効化しない。 |
| U-SPECIR-R6 | `projectSpecIr(input, db)` | `spec_defs` / `spec_relations` / `schedule_entries` / `activation_entries` / `detector_route_candidates` を idempotent upsert する。同一入力 rebuild 2 回で row counts と IDs が安定し、source docs は rewrite しない。 |
| U-SPECIR-R7 | `analyzeSpecIrIntegrity(input)` | orphan relation、未知 layer/sub_doc、activation reason 欠落、secret-like evidence/value、raw markdown body 永続化を finding/quality_signal に変換する。parse 失敗を silent skip しない。 |
| U-SPECIR-R8 | `deriveDetectorRouteCandidates(input)` | finding/spec/schedule/activation を join し、候補を `detector_route_candidates` draft として返す。FilingTarget は創作せず、target snapshot は L4 function §3.2.1 / `routeFiling` SSoT から取得する。 |
| U-SPECIR-R9 | `deriveDetectorRouteCandidates(input)` (non-ready) | SSoT 不在、unknown route_signal、target_layer/sub_doc mismatch は non-ready finding。起票済み PLAN や FilingTarget 決定済みとして扱わない。 |
| U-SPECIR-R10 | `analyzeSpecIrIntegrity(input)` / `parseSpecRelations(bundle, defs)` (PLAN-L7-405) | `spec-ir-invalid-subdoc` は L1-L6 design document row の catalog 違反だけに発火し、PLAN / test-design / typed spec / reference doc の補助行では発火しない。一意な `PLAN-Lx-NN` 短縮参照と存在する reference doc path は `spec_relations` に解決され、orphan relation を出さない。 |
| U-SPECIR-R11 | `stableId(prefix, value)` / projection ID consumers (PLAN-L7-406) | ASCII safe ID は後方互換のまま、非ASCII見出し・パス・空文字は deterministic に正規化される。正規化で情報が落ちる場合は hash suffix で衝突を避け、projection / feedback / skill / workflow のテスト injected deps も同じ helper を使う。 |
| U-SPECIR-R12 | `parseSpecDefs(bundle)` / `analyzeSpecIrIntegrity(input)` (PLAN-L7-429) | frontmatter `doc_type: index` / `doc_type: verification-roadmap` を宣言する design doc は `spec_kind: design_meta_doc` に分類され、`spec-ir-invalid-subdoc` の対象外になる。meta doc 以外の design doc の sub_doc 検証は従来通り発火する。 |
| U-SPECIR-R13 | `parseSpecRelations(bundle, defs)` (PLAN-L7-429) | PLAN frontmatter の `requires` / `pair_artifact` のうち evidence 参照 (`src/` / `tests/` / `scripts/` / `skills/` / `.ut-tdd/` / `.claude/` / `.github/` / `docs/research/` prefix、および `CLAUDE.md` / `AGENTS.md` / `package.json` / `docs/improvement-backlog.md`) は spec 依存 relation の解決対象外で、orphan relation を発火しない。`pair_artifact: self` は PLAN-REVERSE-12 規定通り unresolved orphan として発火し続ける (実装: tests/spec-ir-projections.test.ts "PLAN-L7-429" ケース)。 |

## PLAN-L7-368 Design Lint DB Projection Addendum (2026-07-08)

> 設計ペア: `docs/design/harness/L6-function-design/function-spec.md` の
> `projectDesignPairFreezeFindings` / `projectDesignQualityCoverage` / `checkDesignDetection`
> 契約。既存 file-driven lint の判定を再利用し、DB 投影 fact から検出状態を queryable にする。

| U-ID | Target | Oracle |
|---|---|---|
| U-DESIGNDB-R1 | `projectDesignQualityCoverage(repoRoot, db)` | `doc-consistency` / `entity-coverage` / `fr-registry-audit` / `sub-doc-catalog-drift` / `sub-doc-section-structure` / `l6-fr-coverage` / `fr-roadmap-coverage` / `module-drift` の 8 check を `coverage(scope=design-quality, metric=violation_count)` に 1 行ずつ投影する。clean repo は value=0 / threshold=0 / status=`passed`。 |
| U-DESIGNDB-R2 | `projectDesignPairFreezeFindings(repoRoot, db)` | design sub-doc の `pair_artifact` 欠落、参照不実在、逆参照欠落を `findings.kind=design-pair-orphan:<reason>`、source=`vmodel-pair-freeze`、status=`open` として投影する。 |
| U-DESIGNDB-R3 | `collectDesignDetectionStats` / `analyzeDesignDetectionStats` | design-quality coverage の欠落、blocked coverage、open pair orphan finding のいずれかがあると `ok=false`。すべて揃い passed なら `ok=true`。 |
| U-DESIGNDB-R4 | `checkDesignDetection(repoRoot)` | doctor は DB 集約結果を `design-detection` として 1 surface で報告する。既存 file-driven check の詳細 message を重複出力せず、DB fact の欠落/blocked/open だけを hard gate 化する。 |

## PLAN-L6-40 Route Filing Review Surface Addendum (2026-07-08)

> 設計ペア: `docs/design/harness/L6-function-design/function-spec.md` の
> `routeFiling` / `reviewDetectorRouteCandidate` 契約 (PLAN-L6-40)。
> `detector_route_candidates` は候補入力であり、review surface が `routeFiling` SSoT を再評価して表示する。
> DB schema は増やさず、表示 DTO と `feedback_events.next_action` で人間確認へ渡す。

| U-ID | Target | Oracle |
|---|---|---|
| U-ROUTE-REVIEW-R1 | `routeFiling("feature_addition")` | mode=`add-feature`、`allowed_kinds=add-design/add-impl`、`layer_band=L3-L6/L7`、`requires_human_approval=false` を返す。 |
| U-ROUTE-REVIEW-R2 | `routeFiling(unknown)` | mode=`forward` に fail-closed fallback し、unknown signal finding を伴う。silent success にしない。 |
| U-ROUTE-REVIEW-R3 | `reviewDetectorRouteCandidate(candidate)` | candidate snapshot と FilingTarget 完全形を併記し、`allowed_kinds` / `layer_band` / `pairing_obligation` / `requires_human_approval` を表示要約に含める。 |
| U-ROUTE-REVIEW-R4 | `projectFeedbackEvents` / `emitFeedbackEvents` | rebuild projection 経路と `feedback list --emit` 経路の両方で同じ routeFiling review 要約が出る。source finding との二重表示はしない。 |

## PLAN-L6-41 Activation Profile Schedule Join Addendum (2026-07-08)

> 設計ペア: `docs/design/harness/L6-function-design/function-spec.md` の
> `parseActivationEntries` / `joinActivationScheduleReviews` 契約 (PLAN-L6-41)。
> `docs/governance/vmodel-activation-profiles.md` を第一入力にし、工程管理表と join した read-model を DB と検索へ出す。

| U-ID | Target | Oracle |
|---|---|---|
| U-ACTIVATION-SCHEDULE-R1 | `parseActivationEntries(input)` | activation profile authoring row が PLAN frontmatter fallback より優先され、`scope_status` / `target_version` / `defer_reason` / `enabled` を保持する。 |
| U-ACTIVATION-SCHEDULE-R2 | `joinActivationScheduleReviews(input)` | `activation_entries.plan_id` と `schedule_entries.plan_id` を join し、`current_location` / `rag` / `schedule_status` / `v_pair` を read-model に含める。 |
| U-ACTIVATION-SCHEDULE-R3 | `analyzeSpecIrIntegrity(input)` | `scope_status=deferred|out_of_scope` の理由欠落、または `target_kind=plan` の工程表未接続を finding 化し、projection 側で工程行を創作しない。 |
| U-ACTIVATION-SCHEDULE-R4 | `rebuildHarnessDb` / `findReference` | real repo rebuild で `activation_schedule_reviews` が populated になり、`vmodel-clean-core` や `deferred` で検索できる。 |
| U-SCHEDULE-LIVE-001 | `selectScheduleLiveState(db)` | 専用工程表由来 row を PLAN fallback より優先し、`authoring_rag` と `effective_rag` を分離する。 |
| U-SCHEDULE-LIVE-002 | `selectScheduleLiveState(db)` / `latestReviewEvidenceEntry` | authoring green と最新 test/gate (`blocked`を含む) または最新review snapshotの差し戻し矛盾を red にする一方、passing signal だけで authoring yellow/red を green に昇格しない。最新時刻はUTC instantで比較し、同一instantは後置row/entryを採用する。未知/空ragはyellowへfail-closedする。 |
| U-SCHEDULE-LIVE-003 | `selectSessionStartDigest(db, head)` | `current=着手可能lane全件`、`next=未解決predecessor待ち`、`blocked=明示block`を排他的に分類し、contradictionも依存順序を迂回しない。6件以上のready laneもnextへ誤分類しない。単一read transaction snapshotでlatest gate runをgate/PLAN単位に全件保持し、gate queryを共有する。actionableは上位5 group、telemetryは集計、memoryは上位5件に畳む。 |
| U-SCHEDULE-LIVE-004 | `renderSessionStartDigest(digest)` / SessionStart | `state-and-gates / HEAD / actionable / memory` の固定4段を1回だけ出力し、旧 feedback/memory/escalation block を重複表示しない。Iron Law escalationは第1段に内包し、DB/HEAD不在は fail-open。 |
| U-DOCUMENT-CATALOG-R1 | `parseDocumentCatalogEntries(input)` / `projectSpecIr` | `docs/governance/vmodel-document-catalog.md` から `document_catalog_entries` を populated にし、`DOC-L4-DATA` などを `findReference` で検索できる。 |
| U-DOCUMENT-SCALE-R1 | `parseDocumentScaleProfileEntries(input)` / `joinDocumentScaleProfileReviews(input)` | `docs/governance/vmodel-document-scale-profiles.md` から `document_scale_profile_entries` を populated にし、`document_catalog_entries` と join して `document_scale_profile_reviews` に catalog layer/sub_doc/default status を含める。 |
| U-DOCUMENT-SCALE-R2 | `analyzeSpecIrIntegrity(input)` | 未知 decision/detail/status、catalog 欠落、skip/defer/conditional の理由欠落、`required_plan_id` 未解決を finding 化し、profile 判定を projection 側で補完しない。 |
| U-DOCUMENT-SCALE-R3 | `rebuildHarnessDb` / `findReference` | real repo rebuild で `document_scale_profile_reviews` が populated になり、`enterprise DOC-L4-REPORT adopt` などを検索できる。 |
| U-SCOPE-PREVIEW-R1 | `buildScopeDryRunPreview(db, input)` | document scale profile の `conditional` 文書は capability flag が一致した場合だけ `resolved_scope_status=in_scope`、一致しなければ `conditional` のまま返す。 |
| U-SCOPE-PREVIEW-R2 | `buildScopeDryRunPreview(db, input)` | `defer` 文書は `required_plan_id` が投影済みなら warn なしで `required_action=follow required plan ...` を返し、未投影なら warn finding を返す。 |
| U-SCOPE-PREVIEW-R3 | `buildScopeDryRunPreview(db, input)` | document scale profile 不在は `scope-preview-profile-missing` error finding とし、dry-run が silent success しない。 |
| U-SCOPE-PREVIEW-R4 | `ut-tdd db scope-preview --profile <id> --json` | CLI は JSON/text 両出力を持ち、`documents` / `activations` / `gates` / `detectors` / `findings` / `summary` を返す。source docs / PLAN / profile を更新しない。 |

## PLAN-L6-42 Typed Spec Declaration Addendum (2026-07-08)

> 設計ペア: `docs/design/harness/L6-function-design/function-spec.md` の
> `parseSpecDefs` / `parseSpecRelations` typed spec 契約 (PLAN-L6-42)。
> `docs/governance/vmodel-typed-spec-definitions.md` の `spec.defines` を正本とし、検出を推測から宣言読み取りへ寄せる。

| U-ID | Target | Oracle |
|---|---|---|
| U-TYPED-SPEC-R1 | `parseSpecDefs(input)` | `spec.defines[].id` / `kind` を `spec_defs` に投影し、`section_anchor=spec.defines:<id>` で見出し由来定義と区別する。 |
| U-TYPED-SPEC-R2 | `parseSpecRelations(input)` | `traces_from` / `traces_to` / `tests` を `spec_relations` edge にし、参照先 ID が無ければ finding にする。 |
| U-TYPED-SPEC-R3 | `analyzeSpecIrIntegrity(input)` | ID 形式不正、kind 欠落、重複 ID を finding 化し、projection 側で ID や kind を創作しない。 |
| U-TYPED-SPEC-R4 | `rebuildHarnessDb` / `findReference` | real repo rebuild で typed spec 宣言が `spec_defs` と `search_index` に入り、`VMS-004` などで検索できる。 |

> `analyzeTypedSpecTraceClosure` / `checkTypedSpecTraceClosure` typed spec 閉包契約 (PLAN-L6-43 / PLAN-L7-387)。

| ID | 対象 | 期待 |
| --- | --- | --- |
| U-TYPED-SPEC-C1 | `analyzeTypedSpecTraceClosure(input)` | `traces_to` と相手側 `traces_from` が双方向に閉じている場合は finding を出さない。 |
| U-TYPED-SPEC-C2 | `analyzeTypedSpecTraceClosure(input)` | `traces_to` または `traces_from` の片側欠落を `typed-spec-trace-reverse-missing` finding にする。 |
| U-TYPED-SPEC-C3 | `analyzeTypedSpecTraceClosure(input)` | `tests` と test spec 側 `traces_from` の片側欠落を `typed-spec-test-backlink-missing` finding にする。 |
| U-TYPED-SPEC-C4 | `analyzeTypedSpecTraceClosure(input)` | test を要求する kind に `tests` edge が無い場合は `typed-spec-test-missing` finding にする。ただし `*-oracle` kind は検証 leaf として追加 test を要求しない。 |
| U-TYPED-SPEC-C5 | `checkTypedSpecTraceClosure(repoRoot)` | typed spec 閉包 finding が 0 件なら `doctor: typed-spec-trace-closure - OK`、1 件以上なら `violation` として `runDoctor.ok=false` に合流する。 |

> `analyzeTypedSpecLedgerBodySync` / `checkTypedSpecLedgerBodySync` typed spec 台帳・本文・phase 契約 (PLAN-L6-44 / PLAN-L7-388)。

| ID | 対象 | 期待 |
| --- | --- | --- |
| U-TYPED-SPEC-S1 | `analyzeTypedSpecLedgerBodySync(input)` | 全 typed spec に本文実体、台帳行、`v_phase` がある場合は finding を出さない。 |
| U-TYPED-SPEC-S2 | `analyzeTypedSpecLedgerBodySync(input)` | 宣言IDに本文実体が無い場合は `typed-spec-body-missing` finding にする。 |
| U-TYPED-SPEC-S3 | `analyzeTypedSpecLedgerBodySync(input)` | 台帳行欠落、未知台帳ID、重複台帳IDをそれぞれ `typed-spec-ledger-row-missing` / `typed-spec-ledger-unknown-id` / `typed-spec-ledger-duplicate-id` finding にする。 |
| U-TYPED-SPEC-S4 | `analyzeTypedSpecLedgerBodySync(input)` | `v_phase` 欠落または不正を `typed-spec-ledger-phase-missing` finding にする。 |
| U-TYPED-SPEC-S5 | `analyzeTypedSpecLedgerBodySync(input)` | `traces_from` が後工程を指す、または `traces_to` / `tests` が上流へ戻る場合は `typed-spec-phase-direction-invalid` finding にする。 |
| U-TYPED-SPEC-S6 | `checkTypedSpecLedgerBodySync(repoRoot)` | finding が 0 件なら `doctor: typed-spec-ledger-body-sync - OK`、1 件以上なら `violation` として `runDoctor.ok=false` に合流する。 |

> `analyzeTypedSpecOwnedArtifactDispersal` / `checkTypedSpecOwnedArtifactDispersal` typed spec 所有 artifact 分散契約 (PLAN-L6-45 / PLAN-L7-389)。

| ID | 対象 | 期待 |
| --- | --- | --- |
| U-TYPED-SPEC-O1 | `analyzeTypedSpecOwnedArtifactDispersal(input)` | `spec.defines` の `source_path` が台帳 `ledger_sources` に含まれる場合は finding を出さない。 |
| U-TYPED-SPEC-O2 | `analyzeTypedSpecOwnedArtifactDispersal(input)` | 中央 bootstrap doc など `ledger_sources` 外の path で宣言された ID は `typed-spec-owned-source-mismatch` finding にする。 |
| U-TYPED-SPEC-O3 | `checkTypedSpecOwnedArtifactDispersal(repoRoot)` | finding が 0 件なら `doctor: typed-spec-owned-artifact-dispersal - OK`、1 件以上なら `violation` として `runDoctor.ok=false` に合流する。 |

> `analyzeTypedSpecPhaseLayerAlignment` / `checkTypedSpecPhaseLayerAlignment` typed spec phase/layer 整合契約 (PLAN-L6-46 / PLAN-L7-390)。

| ID | 対象 | 期待 |
| --- | --- | --- |
| U-TYPED-SPEC-P1 | `analyzeTypedSpecPhaseLayerAlignment(input)` | 台帳 `v_phase` が宣言元 artifact の `typed_spec_phase_owner` / `executed_at_layer` / `layer` / path 由来 layer と一致する場合は finding を出さない。 |
| U-TYPED-SPEC-P2 | `analyzeTypedSpecPhaseLayerAlignment(input)` | owner phase を解決できない場合は `typed-spec-owner-phase-missing` finding にする。 |
| U-TYPED-SPEC-P3 | `analyzeTypedSpecPhaseLayerAlignment(input)` | 台帳 `v_phase` と owner phase が食い違う場合は `typed-spec-phase-layer-mismatch` finding にする。 |
| U-TYPED-SPEC-P4 | `checkTypedSpecPhaseLayerAlignment(repoRoot)` | finding が 0 件なら `doctor: typed-spec-phase-layer-alignment - OK`、1 件以上なら `violation` として `runDoctor.ok=false` に合流する。 |

> `parseAgentContractRows` / `analyzeAgentContractIntegrity` / `checkAgentContractDetection` agent contract 契約 (PLAN-L6-47 / PLAN-L7-391)。
| ID | 対象 | 期待 |
| --- | --- | --- |
| U-AGENT-CONTRACT-R1 | `parseAgentContractRows(input)` | `docs/governance/vmodel-agent-contracts.md` の `agent_contracts` から `agent_contracts` row を生成し、`defines` / `read_first` / `done_when` を保持する。 |
| U-AGENT-CONTRACT-R2 | `analyzeAgentContractIntegrity(input)` | `read_first` の欠落を `agent-contract-read-first-missing` finding にする。 |
| U-AGENT-CONTRACT-R3 | `analyzeAgentContractIntegrity(input)` | Python command 文字列など `doctor:<gate-id>` ではない `done_when` を `agent-contract-done-when-invalid` finding にする。 |
| U-AGENT-CONTRACT-R4 | `checkAgentContractDetection(repoRoot)` | 未知 doctor gate を `agent-contract-doctor-gate-unknown` として fail-close し、real repo では `doctor: agent-contract-detection - OK` を返す。 |

**gap 件数: 1 / 25** (screen-spec.md の U-SCREEN-001〜006 個別関数単体テストが未実装。frontend は backend-first 方針で意図的に後回しにされている領域であり、既存 improvement backlog / L6 完了監査の対象。本 PLAN は可視化のみでスコープ外、是正は別 routing)。

L6 doc 追加時は本表へ行を追加する (将来 PLAN-L7-337 設計参照 lint の発火点候補)。

### TVMS-010 L2/L5 freeze contract design oracle

TVMS-010 は VMS-010 の L2 prototype agreement と L5 verification design contract が L7 unit oracle として定義されることを保証する。

### TVMS-011 L2/L5 freeze contract gate oracle

TVMS-011 は VMS-011 の `forward-freeze-contracts` gate が fail-close fixture と real repo green で検証されることを保証する。

> `analyzeForwardFreezeContracts` / `checkForwardFreezeContractsResult` L2/L5 forward freeze contract oracle (PLAN-L6-48 / PLAN-L7-393).
| ID | Target | Oracle |
| --- | --- | --- |
| U-FREEZE-CONTRACT-001 | `analyzeForwardFreezeContracts(input)` | L2 prototype agreement docs and L5 verification design docs pass together when status, pair, next freeze, evidence marker, L8 coverage, and GWT table are present. |
| U-FREEZE-CONTRACT-002 | `analyzeForwardFreezeContracts(input)` | L2 confirmed docs without G2/PO/prototype agreement evidence produce `l2-prototype-evidence-missing`. |
| U-FREEZE-CONTRACT-003 | `analyzeForwardFreezeContracts(input)` | L8 verification design missing a L5 detail basename or GWT table produces `l8-coverage-missing` / `l8-gwt-missing`. |
| U-FREEZE-CONTRACT-004 | `checkForwardFreezeContractsResult(repoRoot)` | Real repo returns `forward-freeze-contracts - OK` and is wired into doctor full profile. |

### TVMS-012 refactor / QA release 契約設計 oracle

TVMS-012 は VMS-012 の ZIP 108/109 authoring source が、Refactor の振る舞い不変・閾値・切り戻しと、QA の ISO/IEC 25010 / Go/No-Go / スモーク契約を持つことを保証する。

### TVMS-013 refactor / QA release gate oracle

TVMS-013 は VMS-013 の `refactor-qa-release-contracts` gate が fail-close fixture と real repo green で検証されることを保証する。

> `analyzeRefactorQaReleaseContracts` / `checkRefactorQaReleaseContractsResult` oracle (PLAN-L6-49 / PLAN-L7-394).

| Test ID | 対象 | 期待 |
| --- | --- | --- |
| U-REFACTOR-QA-001 | valid fixture | ZIP108/109 authoring source、Refactor process、workflow contract が揃えば OK |
| U-REFACTOR-QA-002 | authoring source | Go/No-Go が欠けると fail-close |
| U-REFACTOR-QA-003 | refactor process | authoring source への接続が欠けると fail-close |
| U-REFACTOR-QA-004 | real repo | `refactor-qa-release-contracts - OK` が doctor full profile に配線済み |

## U11 型付きスペック所有 artifact

```yaml
spec:
  defines:
    - id: TVMS-001
      kind: unit-oracle
      traces_from: [VMS-001]
    - id: TVMS-002
      kind: unit-oracle
      traces_from: [VMS-002]
    - id: TVMS-003
      kind: unit-oracle
      traces_from: [VMS-003]
    - id: TVMS-004
      kind: unit-oracle
      traces_from: [VMS-004]
    - id: TVMS-005
      kind: integration-oracle
      traces_from: [VMS-005]
    - id: TVMS-006
      kind: projection-oracle
      traces_from: [VMS-006]
    - id: TVMS-007
      kind: unit-oracle
      traces_from: [VMS-007]
    - id: TVMS-008
      kind: unit-oracle
      traces_from: [VMS-008]
    - id: TVMS-009
      kind: projection-oracle
      traces_from: [VMS-009]
    - id: TVMS-010
      kind: unit-oracle
      traces_from: [VMS-010]
    - id: TVMS-011
      kind: unit-oracle
      traces_from: [VMS-011]
    - id: TVMS-012
      kind: unit-oracle
      traces_from: [VMS-012]
    - id: TVMS-013
      kind: unit-oracle
      traces_from: [VMS-013]
    - id: TVMS-014
      kind: unit-oracle
      traces_from: [VMS-014]
    - id: TVMS-015
      kind: unit-oracle
      traces_from: [VMS-015]
```

TVMS-001、TVMS-002、TVMS-003、TVMS-004、TVMS-005、TVMS-006、TVMS-007 は L7 unit-test-design の所有 artifact で宣言される typed spec oracle である。
TVMS-007 は VMS-007 の phase/layer alignment が unit oracle と doctor gate で検証されることを保証する。
TVMS-008 は agent contract authoring source、TVMS-009 は agent contract doctor gate の oracle である。
TVMS-014 は VMS-014 の ID 単位実行割当台帳 contract が L7 unit oracle として定義されることを保証する。
TVMS-015 は VMS-015 の工程 live state / 固定4段 SessionStart digest contract が L7 unit oracle として定義されることを保証する。

## PLAN-L6-60 ID 起点 trace impact traversal oracle (2026-07-08)

| U-ID | Target | Oracle |
|---|---|---|
| U-TRACE-IMPACT-R1 | `analyzeTraceImpact(db, spec_id)` | `traces_from` / `requires` を依存元から影響先へ反転し、`traces_to` / `tests` を宣言方向で辿る。指定 ID の上流・下流・テスト影響を分離して返す。 |
| U-TRACE-IMPACT-R2 | `analyzeTraceImpact(db, unknown_id)` | unknown ID は silent success にせず `trace-impact-root-missing` finding で fail-close する。 |
| U-TRACE-IMPACT-R3 | `ut-tdd trace impact --id <id> --json` | CLI は DB read-only surface として JSON/text 出力を持ち、`change-impact.ts` のファイル差分検出とは責務を分ける。 |

## PLAN-L6-61 spec RAG 閉包台帳 oracle (2026-07-08)

| U-ID | Target | Oracle |
|---|---|---|
| U-SPEC-RAG-R1 | `deriveSpecRagClosureEntries(input)` | typed spec relation を `PLAN-L6-60` と同じ向きで辿り、test 到達済みかつ closure finding なしの spec は `green` / `closed`、test を要求するが test 到達 0 の spec は `red` / `missing_test` になる。 |
| U-SPEC-RAG-R2 | `rebuildHarnessDb` / `projectSpecIr` | real repo rebuild で `spec_rag_closure_entries` が populated になり、`VMS-004` などの typed spec row が `search_index` から `spec closure RAG` で検索できる。 |
| U-SPEC-RAG-R3 | `ut-tdd trace rag --id <id> --json` | CLI は `spec_rag_closure_entries` を read-only に表示し、`--id` filter と JSON 出力を持つ。`schedule_entries.rag` を代替参照しない。 |

## PLAN-L6-50 ID 単位実行割当台帳 oracle (2026-07-09)

| U-ID | Target | Oracle |
|---|---|---|
| U-ASSIGN-LEDGER-R1 | `deriveExecutionAssignmentLedger(input)` | typed spec ID と V-pair / test edge から `implementation` / `verification` / `review` の assignment row を deterministic に導出し、同一入力で `assignment_id` と row 数が揺れない。 |
| U-ASSIGN-LEDGER-R2 | `mergeExecutionAssignmentLedger(input)` | 既存 authoring row の status/evidence を温存し、新規 spec は planned として追加、消えた spec は削除ではなく `archived` + reason へ退避する。 |
| U-ASSIGN-LEDGER-R3 | `checkExecutionAssignmentLedger(input)` | `done/pass/fail` の evidence 欠落、宣言外 spec、target artifact 欠落、archive reason 欠落、同一 assignment 重複を fail-close finding にする。 |
| U-ASSIGN-LEDGER-R4 | `ut-tdd assignment check --json` | CLI は authoring source / DB projection を read-only に検査し、台帳補完や実行完了承認を行わない。JSON 出力に finding kind、assignment_id、evidence_path を含める。 |

## PLAN-L6-59 設計 doc 横断整合性 oracle (2026-07-09)

| U-ID | Target | Oracle |
|---|---|---|
| U-DESIGN-CROSS-R1 | `analyzeDesignDocCrossIntegrity(input)` | `document_catalog_entries` で対象 doc 集合を確定し、`spec_defs` の同一 `spec_id` が複数 authoring source で定義された場合は `design-doc-duplicate-definition` finding を返す。 |
| U-DESIGN-CROSS-R2 | `analyzeDesignDocCrossIntegrity(input)` | `spec_relations` を doc 間 edge に射影し、doc A -> doc B -> doc A の循環を `design-doc-dependency-cycle` finding として返す。同一 doc 内自己参照は cycle 扱いしない。 |
| U-DESIGN-CROSS-R3 | `checkDesignDocCrossIntegrity(repoRoot)` | doctor gate は catalog + typed spec projection を authoring source から再構築して判定し、module import cycle (`dependency-drift`) や typed-spec trace closure の片方向欠落と重複して同じ違反を二重報告しない。 |

## PLAN-L6-62 docs 横断 secret-scan oracle (2026-07-09)

> 設計ペア: `docs/design/harness/L6-function-design/secret.md` の `analyzeSecretScan` /
> `loadSystemSecretScanArtifacts` / `checkSecretScan` / distribution secret preflight 契約。
> L4 security slot の方針を下流検出に合わせるのではなく、検出系が L4/L6 設計へ従う。

| U-ID | Target | Oracle |
|---|---|---|
| U-DOCSECRET-001 | `analyzeSecretScan(input)` | AWS access key、GitHub token、private key block、Bearer token、password / credential 直書きを marker / line / path 付き violation にする。 |
| U-DOCSECRET-002 | `analyzeSecretScan(input)` | dummy / placeholder / redacted / fixture / test-only が同一行に明示された説明用 payload は violation にしない。ただし説明無しの実値形 payload は fail-close。 |
| U-DOCSECRET-003 | `secretScanMessages(result)` | doctor / CLI に path:line:marker の sample を出し、修正対象を追える。 |
| U-DOCSECRET-004 | `loadSystemSecretScanArtifacts(repoRoot)` | `docs/`、root canonical docs、`.ut-tdd/audit`、`.ut-tdd/handover`、`.ut-tdd/logs`、`.ut-tdd/memory` を active scan band として読む。 |
| U-DOCSECRET-005 | `checkSecretScan(repoRoot)` | doctor full profile の hard gate として登録され、repoRoot 不在・読込不能・violation ありを fail-close にする。 |
| U-DOCSECRET-006 | `ut-tdd distribution sync-stage/sync-pack/package` | clean Pack materialize 前に secret-scan を実行し、violation があれば copy / prune / tar を実行せず blocked にする。 |
| U-DOCSECRET-007 | `runSecretScanDiff(repoRoot, entries: {sha,path}[], mode, readBlob)` (`scripts/git-hooks/secret-scan-diff.ts`、PLAN-L7-260 §4 pre-push 対象見直し、2026-07-13、blob 方式へ設計修正 2026-07-13) | 3 パターン限定 (`*CLAUDE.md`/`*SKILL.md`/references 配下 `*.md`) を撤廃し、docs/・`.ut-tdd/audit`・`.ut-tdd/logs`・`.ut-tdd/memory` を widened scan surface として credential marker (`analyzeSecretScan` 再利用) + 温存 PII regex (電話番号/郵便番号/email/internal URL) を検出する。push される各 commit 時点の blob (`git show <sha>:<path>`) を個別に読むため、同一 push 内で先行 commit が追加し後続 commit が working tree 上だけクリーン化する secret も検出する (`tests/secret-scan-diff.test.ts` の bare remote + hooksPath e2e で固定)。widened surface 外の changed path は対象外。mode 既定は warn (exit 0 のまま violation を報告)、`UT_TDD_PRE_PUSH_SECRET_SCAN_MODE=fail-close` でのみ push を止める (exit 1)。 |

## Vモデルactive frontier / right-arm coverage追補 (PLAN-L6-69)

| test_id | 対象 | oracle |
|---|---|---|
| U-VUP-FRONTIER-001 | `parseUpgradeFrontier` / `upgradeFrontierMessage` | yellow/draftを`IN-PROGRESS`、全green/non-draftだけを`CLEAR`にする。 |
| U-VUP-FRONTIER-002 | `parseUpgradeFrontier` / `checkRoadmap` | schedule表・必須列・行の欠落、重複ID、red rowをfail-closeする。 |
| U-RIGHT-ARM-ENGINE-001 | `loadRightArmGatePlanningInput` / `analyzeRightArmGatePlanning` | engine-swap linkedかつconfirmed/completedのverify PLANだけをL8〜L14 coverageへ数える。 |
| U-RIGHT-ARM-ENGINE-002 | `analyzeRightArmGatePlanning` | design freezeはlinked全層起票、program acceptはlinked全層confirmed/completedを別々に強制する。 |
| U-VTRIG-REVISION-001 | `analyzeVerificationGroups` | confirmed base + valid additive draftをbase freeze完了 / active revision `IN-PROGRESS`として別集計する。 |
| U-VTRIG-REVISION-002 | `analyzeVerificationGroups` / `analyzePairFreeze` | base欠落/未confirmed/layer不一致は免除せず、delta exact pairの双方向参照を検証する。 |

## Engine-swap unit/property/mutation oracle (PLAN-L6-70〜77)

`CANDIDATE-*`はdraft実装PLANに対応する未freeze候補であり、実テストcitationとして数えない。各L7 PLANの開始時に、期待finding/exitで実際に失敗するRed testを追加してから正規`U-*`/`IT-*`/`P-*`/`M-*`へ昇格する。`it.todo`やskipだけで昇格してはならない。実装済みV-model compiler群だけは`U-VMC-*`としてfreeze済みである。

| test ID | precondition / fixture | command / query | postcondition / invariant / expected finding |
|---|---|---|---|
| `U-PA-001` | 空/不正`asset_id` | `PlanAsset.create` | `plan-asset-invalid-id`, exit 1 |
| `U-PA-002` | revision 1,3 | `PlanAsset.reconstruct` | `plan-revision-gap`, exit 1 |
| `U-PA-003` | alias/layer変更command | `PlanAsset.revise` | 新revisionでも`asset_id`不変、exit 0 |
| `U-PA-004` | revision 1+evidence | `PlanAsset.revise` | 旧instance/evidence digest不変、exit 0 |
| `U-PA-005` | expired/別revision/policy別exit evidence | `EvidenceRecord.isUsableFor` | `evidence-stale-or-subject-mismatch`、Red expected nonzeroだけusable、exit 1/0 |
| `U-PA-006` | legacy PLAN全field + short alias現HEAD全衝突群 | canonical adapter / alias resolver | field loss 0、多義は`plan-migration-collision`で自動選択0、exit 1 |
| `U-PA-007` | 同ordinal同時予約 | `PlanIdReservation.reserve` | 片方だけ成功、他方`plan-id-reservation-conflict` |
| `U-PA-008` | HEAD tracked `ut-tdd.project.json`、改竄bytes/receipt、schema/identity不正、remote無し | `loadTrackedProjectIdentity` / `loadProjectIdentityFromHead` | exact HEAD blobだけ成功しreceipt digest安定。index/working tree/remote補完0、異常種別を専用findingでfail-close |
| `U-PA-009` | active alias/ordinal leaseを同時挿入 | typed partial UNIQUE DDL | active rowは1件だけ成功。terminal/closed intervalは履歴として共存可能 |
| `U-PA-010` | asset/revision/history rowを作成後にUPDATE/DELETE、存在しないrevisionへalias event | append-only trigger / composite FK | history変更とorphan revisionをSQLiteが拒否し、row/digest不変 |
| `U-PA-011` | ledger version 0/current/future、repo外path | `openPlanLedger` / `migratePlanLedger` | 専用pathだけversion 1へtransactional作成。future/schema不一致は`plan-ledger-unavailable`、repo外はfail-close |
| `U-PA-012` | plan/reservation/migration subject別global receipt、架空revision、plan列混入 | `append_command_receipts` typed CHECK/composite FK | plan subjectだけ実在asset+revision必須、他subjectはplan列NULL。違反はSQLiteが拒否 |
| `U-PA-013` | valid current ledgerのevent/revision/receipt/reduction digestを1列改竄 | `migratePlanLedger` row digest/reduction verifier | DDL形状が同一でも`plan-ledger-unavailable`でfail-closeし、空ledgerとして補完しない |
| `U-PA-014` | valid asset、未予約ordinal | `PlanLedger.reserve` | event/current/receiptを同一transactionで各1件appendしreopen検証Green |
| `U-PA-015` | 同一command IDの同一payload／異payload再送 | `PlanLedger.reserve` | 同一payloadは同じresultをreplayし行増加0、異payloadは`plan-id-reservation-command-conflict` |
| `U-PA-016` | active leaseへrelease/expireを競合実行 | `PlanLedger.release/expire` | token/expiry guardを通った一方だけterminal eventをappendし、敗者は`plan-id-reservation-not-active` |
| `U-PA-017` | active ordinalへ別reservationをappend | `PlanLedger.reserve` | `plan-id-reservation-conflict`でevent/current/receiptを全rollbackし部分commit 0 |
| `U-PA-018` | reservation receiptのsubject/result kind/command type/recorded timeを改竄 | `migratePlanLedger` receipt/event bijection verifier | event subject/payload/result/timeとの不一致を`plan-ledger-unavailable`でfail-close |
| `U-PA-019` | HEAD `docs/plans/PLAN-*.md`全件 | `buildLegacyPlanInventory` | HEAD path全件をexactly onceで読み、full plan ID/asset IDが全件一意、frontmatter plan_id一致 |
| `U-PA-020` | numeric coreでgroup化したHEAD PLAN | `buildLegacyPlanInventory` | reviewed rekey manifestのgroup/item集合とexact一致しstable順、自動winner選択0 |
| `U-PA-021` | 同一HEADを反復inventory | `buildLegacyPlanInventory` | item/collision順とSHA-256 inventory digestが完全一致 |
| `U-PA-022` | anchor/alias/merge/custom tag/non-string key/unsafe integerを含むfrontmatter | `parseLegacyPlanSource` | lossless canonical化できないYAMLを全件fail-close |
| `U-PA-023` | empty state + valid pending observe | `reduceLegacyMigration` / append port | observed event/current/receiptのみatomic append、PlanAsset/revision/alias行0 |
| `U-PA-024` | state×observe/decide/revise全組合せ | migration transition table | 許可pairだけ次state、禁止pairは`plan-migration-transition-invalid`でdelta 0 |
| `U-PA-025` | decision 4種×field有無mutation | decision field matrix | 必須/禁止組合せをapplicationとSQLiteが同じruleでfail-close |
| `U-PA-026` | stale expectedSequence/expectedDecision、2 writer | migration append | 一方だけ成功し敗者`plan-migration-state-conflict`、部分commit 0 |
| `U-PA-027` | 同command ID同payload／異payload | migration append | 同一は同result replay・行増加0、異payloadはglobal command conflict |
| `U-PA-028` | migrated/rekeyed decision | migration transaction | PlanAsset revision 1、alias、migration event/current、receiptを同一transactionで生成し全provenance digest一致 |
| `U-PA-029` | rejected decision | migration transaction | migration event/current/receiptだけ生成しPlanAsset/revision/alias行0 |
| `U-PA-030` | event/current/receipt各方向の孤児・subject/type/result/time/payload改竄 | ledger verifier | 双方向bijection/reducer replay不一致を`plan-ledger-unavailable`でfail-close |
| `U-PA-031` | sequence/kind/time/identity/source digest mutation | `reduceLegacyMigration` | first observed・連続列・非減少時刻・immutable provenance違反を全件拒否 |
| `U-PA-032` | 各append境界fault injection | migration transaction port | event/current/asset/revision/alias/receiptの全table delta 0 |
| `U-PA-033` | valid ledger close→file reopen/rebuild | migration reconstruct | state/event/payload/provenance digest集合が完全一致 |
| `U-PA-034` | source commitのHEAD PLAN全件 | `LegacyMigrationDryRun` | inventoryとrecordがexactly-once bijection、total=emitted、legacy ID重複0 |
| `U-PA-035` | reviewed collision manifest | decision resolver | migrated=HEAD全件-rekeyed、pending=0。manifest欠落・余剰・group不一致はfail-close |
| `U-PA-036` | 別legacy IDを返すdecision port | dry-run record join | `plan-migration-preview-id-mismatch`、finding 1件以上 |
| `U-PA-037` | 同一HEAD・同一manifestを2回実行 | dry-run report | record順、finding順、inventory/report digest完全一致 |
| `U-PA-038` | HEAD exact file / directory family / hollow / missing | `HeadTargetRegistry` | 非空fileと非空familyのみ存在判定、hollow/missingを拒否 |
| `U-PA-039` | record source commit/path/OID/content digest | 独立Git object oracle | `commit:path` OIDと実blob bytes SHA-256がrecordと一致 |
| `U-PA-040` | 全agent slot + 7 role contract | role contract loader/projection | role全単射、全slot contractRef付与、HEAD contract blob非空。未知role/欠落は拒否 |
| `U-PA-041` | item ledgerの全`target_slot` edge | HEAD document catalog resolver | 全slot ref解決、存在しないslotはglobal findingでfail-close |
| `U-PA-042` | `plan migration-dry-run --json` | CLI public surface | exit 0、`total=emitted=HEAD PLAN件数`、`migrated=total-rekeyed`、pending/finding 0のJSON契約 |
| `U-PA-043` | `leaseMs`付きreservation commandを初回/再送 | `ReservationService` + versioned key-ring/clock port | raw tokenを返しDB/event/current/receipt保存0、再送はclock進行後も同一token/expiry、異payloadはconflict |
| `U-PA-044` | reservation event/current/receipt各append直後にfault注入 | `PlanLedger.reserve` transaction | 各例外後にevent/current/receiptのdelta 0、次の正常commandは成功 |
| `U-PA-045` | 複数kind/producer/subject/revision/commit/expiry/exit/claims outcomeを組合せたevidence全履歴 | `EvidenceRecord` / `EvidencePolicy` | policy定義と評価contextを分離し、typed claimsRuleに適合するactive frontierだけをmin/max cardinalityへ数え、requirement別missing/rejected IDをstable順で返す |
| `U-PA-046` | raw/split/env/header/URI secret command、未知kind/producer/exit/claims rule、kind不一致claims、自己/orphan/cycle/fork/逆因果supersede、全record field改変 | `EvidenceRecord.create` / policy frontier / digest | branded redacted argv以外は拒否、claimsを自由文から推測しない、supersession不正とrecord digest不一致を拒否、旧record不変 |
| `U-PA-047` | v2 ledger（reservation 0件／hash-only reservationあり） | schema v3 migration | 空reservationはtransactionalにexact v3へ移行し、非空hash-onlyは明示manifestなしに変更せずfail-close。key version/event/current/reduction/reopen一致 |
| `U-PA-048` | unsigned/正規署名/別鍵署名/producer変更/claims・digest変更/attestation replay、key rotation、runtime property列挙 | evidence attestation issuer/verifier + policy | trusted authorityの署名とproducer bindingを満たすrecordだけeligible。未署名・偽署名・改変・replayはfail-closeし、秘密鍵/current versionはruntime propertyへ露出しない |
| `CANDIDATE-FSM-001` | 正規stateごとの次event | `transition` | 許可表どおりのnext state/event、exit 0 |
| `CANDIDATE-FSM-002` | proposed→implementing | `transition` | `forward-transition-illegal`, exit 1 |
| `CANDIDATE-FSM-003` | pair frozen、Red evidenceなし | implement command | `forward-red-evidence-missing`, exit 1 |
| `CANDIDATE-FSM-004` | trace未freeze | review command | `forward-trace-freeze-missing`, exit 1 |
| `CANDIDATE-FSM-005` | review/test evidence不足 | accept command | `forward-accept-evidence-missing`, exit 1 |
| `CANDIDATE-FSM-006` | blocked/reopenedで理由またはevidenceなし | `transition` | `forward-exception-context-missing`, exit 1 |
| `CANDIDATE-FSM-007` | 同一sequence付きevent列 | `reduceForward`を2回 | state/verdict/digest同一、exit 0 |
| `CANDIDATE-P-FSM-001` | generatorが作る任意event列 | `reduceForward` | 非許可状態到達0、sequence違反は必ずexit 1 |
| `U-VMC-001` | L0-L14各1件 | `VModelContract.create` | layer count 15、exit 0 |
| `U-VMC-002` | G0.5/G1-G14各1件 | `VModelContract.create` | gate count 15、exit 0 |
| `U-VMC-003` | layer/gate欠落または重複 | `VModelContract.create` | `contract-cardinality-invalid`, exit 1 |
| `U-VMC-004` | pair/exception reason不整合 | `VModelContract.create` | `contract-pair-invalid`, exit 1 |
| `U-VMC-005` | required field欠落 | loader/compiler | default補完せず`contract-field-missing`, exit 1 |
| `I-VMC-001` | valid contract | compiler→registry/doctor/roadmap | rule ID/verdict集合差0、exit 0 |
| `U-DISP-001` | checked manifest宣言値と同数records | catalog create | source/item/category/profile件数一致、exit 0 |
| `U-DISP-002` | manifest件数とrecord件数不一致 | catalog create | `catalog-count-mismatch`, exit 1 |
| `U-DISP-003` | source/item/target orphan | catalog create | `catalog-orphan-edge`, exit 1 |
| `U-DISP-004` | disposition理由/target/PLAN欠落 | catalog create | `catalog-disposition-incomplete`, exit 1 |
| `U-DISP-005` | 同一edge ID重複 | catalog create | `catalog-edge-duplicate`, exit 1 |
| `U-TARGET-001` | 4 typed target | canonical resolver | plan/path/family/slotをregistryだけで解決、exit 0 |
| `U-TARGET-002` | disposition short alias / edge full alias | reconcile | canonical identity一致、exit 0 |
| `U-TARGET-003` | unknown/ambiguous/absent target | canonical resolver | typed finding、exit 1 |
| `U-TARGET-004` | phantom family/canonical mismatch | canonical resolver | existence/mismatch finding、exit 1 |
| `I-DISP-001` | valid authored catalog | DB削除→rebuild | catalog/edge/profile full row・digest identity集合差0、provenance失敗時rollback |
| `U-PROFILE-001` | checked manifest size 3/product 5 | profile create | 宣言件数一致、exit 0 |
| `U-PROFILE-002` | baseline+product+explicit override | resolverを2回 | resolved digest同一、exit 0 |
| `U-PROFILE-003` | unknown profile/item | resolver | `profile-unknown`, exit 1 |
| `U-PROFILE-004` | 同優先度で異なる値 | resolver | `profile-overlay-conflict`, exit 1 |
| `U-PROFILE-005` | authored decision欠落 | resolver | default創作せず`profile-decision-missing`, exit 1 |

#### PLAN-L7-417 Red freeze詳細

上表のDISP 5件は実テスト`tests/disposition/catalog.test.ts`へ昇格済みで、valid small fixture、tracked checked fixture、
単一違反mutation builderを共有する。件数不一致はsource/item/category/source-item/source-target/item-target/profile/decisionの
全dimension、orphanは各typed edge、duplicateは全entity identity/ordinalをtable-drivenで検査する。pending+target、final target欠落、
reason/digest欠落、item ledger row欠落時のsource-target非継承を個別fixtureとする。`traceSource`/`unresolved`はbefore/after digest同一、
stable ID順を固定する。109/163/21/8はtracked acceptance fixtureだけがassertし、domain定数やsmall fixtureへ複製しない。
109 source外は`vmodel-semantic-item-catalog.md`のtyped meta source mappingだけを許し、status/file policy不一致をorphan Redにする。

上表のPROFILE 5件は実テスト`tests/profile/resolver.test.ts`へ昇格済みである。document `doc_type_id`でsize→product stable order→explicitの
全permutationを2回解決し、selection digest、winning decision、application receiptの一致を検査する。unknown profile/doc type/capability、
同precedence異値、同値identity重複、required slot欠落、core/security detail弱化を個別Redにする。semantic `item_id`への暗黙mapは
fixture自体で禁止する。

strict loader Redはmanifestを含む6正本それぞれについてunknown/duplicate/missing column、row幅、inline-code delimiter、
invalid UTF-8、revision/provenance digest mismatch、unknown disposition/decision/detail/status/target typeを1 mutationずつ持つ。
profile master 8件は全field round-trip/digest、entry→profile/doc type FKを比較する。schema registryはFK、NOT NULL、UNIQUE、
CHECK、複合PKを各1違反fixtureでDDL自身が拒否することを確認し、domain findingだけのGreenを認めない。

上表のintegration oracleは`tests/disposition/projection.test.ts`へ昇格済みで、全projectionのPK、source/canonical digestを
delete→rebuild前後で完全比較する。invalid authoringはtransaction rollbackし既存projectionを保持する。row countだけの比較、
DB空集合からのauthoring補完、共有repoのvolatile logをfixed-point証拠に含めることは禁止する。
| `U-DOCLEDGER-001` | full commit/root tree、`repository-documents-v1`全zone、raw NUL path/blob OID集合 | `captureRepositoryDocsSnapshot` | zone/count/root tree/selection/path hash/zone集合/member集合/snapshot digestがfixture一致し、stable byte順。921は`docs_tree`だけ |
| `U-DOCLEDGER-002` | short SHA、symbolic HEADだけ、root tree/selector mismatch、必須zone欠落、未分類文書、malformed NUL/UTF-8 | snapshot capture | `docs-snapshot-revision-missing`、`docs-snapshot-stream-malformed`又は`doc-selection-unclassified`、exit 1 |
| `U-DOCLEDGER-003` | missing/duplicate/phantom/case-fold path | closure analyzer | 対応するstable findingを全件返し、exit 1 |
| `U-DOCLEDGER-004` | authoring loaderのskip→not_applicable/defer→deferred、canonical applicabilityのreason・condition・trigger・decider・PLAN欠落、unknown application status、又はdisposition後条件欠落 | authoring normalizer + closure analyzer | raw語はauthoring境界でcanonical化し、queryはcanonical値だけを受理。不足は`doc-disposition-incomplete`、exit 1。applicabilityとdispositionを第二enumで混同しない |
| `U-DOCLEDGER-005` | 全4 kind正常replay、decisionのledger/snapshot/operation/member/path/digest欠落・余剰・重複・不一致、snapshot不一致、delta ID改竄、invalid factory input、add(existing)、modify/delete/rename missing source、stale before、rename target占有/same path、sequence gap/duplicate、empty/nonempty chain改竄、final/initial exact/case-fold重複path、final path/blob不一致 | `createDocumentDeltaEvent/Decision` + `replayDocumentDeltas` + final closure | factoryはinvalid state生成不能。正常列だけeffective集合/reduction/delta chain digestをouter closureまで返す。違反はreason codeとpath/blob identity別の`doc-delta-unregistered`を全件stable順で返しexit 1。invalid prefix後はstate poison。renameをGit heuristicで推測せず、明示renameなしはdelete+addとして報告。連続modify、add→modify/delete、rename→modify/delete、入力全体非変更、入力順反転、反復digest一致も固定 |
| `CANDIDATE-DOMAIN-001` | domain import graph | dependency audit | domain→kernel以外の逆依存0 |
| `CANDIDATE-DOMAIN-002` | barrel相互import fixture | dependency audit | `module-cycle`, exit 1 |
| `CANDIDATE-DOMAIN-003` | command/query同時mutation fixture | CQS audit | `command-query-mixed`, exit 1 |
| `CANDIDATE-DOMAIN-004` | 不完全constructor/public mutable fixture | structure audit | `domain-invalid-state-surface`, exit 1 |
| `CANDIDATE-DOMAIN-007` | `recordFinding`のkind/subject/source/evidence、event ID、primary key、`*_id`各fieldへsecret-like値を注入 | common projection payload guard + branded `ProjectionIdFactory` | 列名による例外なくwrite row 0。runtime guard負例は`tests/sqlite-projection-store.test.ts`でGreenだが、検査済みcomponentから内部factoryが生成したbranded ID限定と任意文字列cast拒否は未実装のため、全体はRedを維持する。 |
| `U-DOMAIN-008` | row upsert後、join finding前/clear中にfault injection | re-entrant SQLite transaction + atomic rebuild | event/joinは`tests/sqlite-projection-store.test.ts`、clear後の既存snapshot不変は`tests/projection-writer.test.ts`でGreen。成功時はrowとjoinが同一commit。 |
| `CANDIDATE-DOMAIN-009` | fixed source bundleを同一contextで2回投入し、`capturedRevision`/`capturedAt`/`sourceDigest`の欠落・空文字・別capture混在fixtureも投入 | pure projectors / rebuild command | 3 capture fieldを直接検証して不正bundleを拒否する。valid bundleは`ProjectionWrite`列、stable order、digest、row countsが完全一致し、projectorのDB/FS/clock import 0。HEAD名だけでworking-tree内容を証明しない。 |
| `CANDIDATE-DOMAIN-010` | 全consumer import graph、legacy path、`tests/projection-writer.test.ts`を含む旧facade直結test | dependency/architecture audit | source/test双方で`projection-writer.ts` import 0、旧testは新application/adapter境界へ移行、file実体 0、domain/application→adapter逆辺 0。未移行はRed。 |
| `CANDIDATE-DOMAIN-011` | raw `BEGIN`配下のprojection store呼出し、nested savepointのrollback/release故障注入 | `ProjectionTransactionPort` architecture gate + transaction fault oracle | projection write consumerのouter transactionは共通port以外0。rollback/release失敗時も原errorを保持し、outer rollbackとdepth復元を証明する。現時点はRed。 |
| `CANDIDATE-ASSESS-001` | design/runtime/test evidence完備 | evaluator | `verified`, exit 0 |
| `CANDIDATE-ASSESS-002` | 3面のいずれか欠落 | evaluator | verifiedにせず`partial`, exit 0 |
| `CANDIDATE-ASSESS-003` | gapでdebt route欠落 | evaluator | `assessment-debt-route-missing`, exit 1 |
| `CANDIDATE-ASSESS-004` | conditional/NA理由・profile・承認欠落 | evaluator | `assessment-applicability-incomplete`, exit 1 |
| `CANDIDATE-ASSESS-005` | source revision/digest変更 | evaluator | 旧verifiedをstale扱い、exit 1 |
| `CANDIDATE-ASSESS-006` | 163 item全件fixture | aggregate query | pending 0、gap/partial route coverage 100% |
| `CANDIDATE-SP-001` | rule/registry duplicate/orphan | meta-verifier | `self-proof-registration-mismatch`, exit 1 |
| `CANDIDATE-SP-002` | source/generated digest不一致 | meta-verifier | `self-proof-generated-stale`, exit 1 |
| `CANDIDATE-SP-003` | CLI/hook/doctor/CI surface欠落 | meta-verifier | `self-proof-surface-missing`, exit 1 |
| `CANDIDATE-SP-004` | expected/actual finding/exit不一致 | meta-verifier | `self-proof-verdict-mismatch`, exit 1 |
| `CANDIDATE-SP-005` | 正常fixture | meta-verifier | false-positive 0、exit 0 |
| `CANDIDATE-SP-006` | detector未登録fixture | process runner | `self-proof-detector-unwired`, exit 1 |
| `CANDIDATE-SP-007` | detectorが例外を成功扱い | process runner | `self-proof-exception-swallowed`, exit 1 |
| `CANDIDATE-SP-008` | authored source欠落をDBが補完 | meta-verifier | `self-proof-db-only-completion`, exit 1 |
| `CANDIDATE-I-SP-001` | 同一rule全surface実行 | process runner | rule ID/verdict/exit一致、exit 0 |
| `CANDIDATE-I-SP-002` | receipt projection削除 | rebuild+verify | receipt/finding identity集合差0 |
| `CANDIDATE-M-SP-001` | rule条件削除mutation | mutation runner | mutation killed、exit 1 |
| `CANDIDATE-M-SP-002` | gate mapping交換mutation | mutation runner | mutation killed、exit 1 |
| `CANDIDATE-M-SP-003` | stale生成物mutation | mutation runner | mutation killed、exit 1 |
| `CANDIDATE-M-SP-004` | detector未配線mutation | mutation runner | mutation killed、exit 1 |
| `CANDIDATE-M-SP-005` | exception fail-open mutation | mutation runner | mutation killed、exit 1 |
| `CANDIDATE-M-SP-006` | DB-only補完mutation | mutation runner | mutation killed、exit 1 |
| `CANDIDATE-M-SP-007` | surface登録脱落mutation | mutation runner | mutation killed、exit 1 |

`U-DOCLEDGER-001..005`を本sliceの実装前Red freezeとする。reference解析・canonical assertion・
debt routeを扱う後続5件は、後続sliceでIDを再採番してfreezeするまでoracle宣言へ含めない。test実体とGreen証拠が揃うまで
`CANDIDATE`への後戻り、既存detectorのpass/fail関数を期待値へ再利用すること、件数だけのGreenを禁止する。
その他のnegative fixtureも期待finding/exitで落ちるRedを固定し、detectorのpass/fail関数をmeta-verifierのoracleへ再利用しない。

## PLAN-L7-428 ステージ紐付きエリシテーション oracle (PLAN-REVERSE-428 backfill、2026-07-13)

対象 = `src/elicitation/context.ts` / `src/elicitation/record.ts`。実テスト =
`tests/elicitation-context.test.ts` (in-memory harness.db + temp repo fixture)。

| ID | 観点 | fixture | expected |
| --- | --- | --- | --- |
| `U-ELICIT-001` | plan 省略時の stage 自己解決 | ready schedule row 1 件 | `stage_source="schedule-current"`、plan/location が row と一致 |
| `U-ELICIT-002` | skill decision_points の defaults 結合 | layer 一致 skill asset + frontmatter decision_points | plan-match で defaults に when/choose/over/because が展開される |
| `U-ELICIT-003` | skill 読取 fail-open | DB 登録済みだが実体欠落の skill asset | throw せず `unreadable_skills` に asset_id が載る |
| `U-ELICIT-004` | 設計カバレッジ結合 | plan 一致 spec + layer 一致 spec + 対象外 spec + relation 1 件 | spec_count=2 / relation_count=1 / lifecycle 集計一致 (対象外 layer は除外) |
| `U-ELICIT-005` | render 4 段固定 | stage+skill+spec を全て seed | stage 行 / defaults 見出し / specs 件数 / `## 設計判断依頼` / 選択肢 A (推奨)+B 行を全て含む |
| `U-ELICIT-006` | 採択記録 append-only + fail-close | 2 回 append + 必須項目欠落 1 回 | JSONL 2 行 (stage 付き)、topic 空は throw |
| `U-ELICIT-007` | asset path 未解決の可視化 | path 空の skill asset 行 | throw せず `unreadable_skills` に asset_id、defaults は空 |

## PLAN-L7-421 テスト衛生oracle (backprop、2026-07-13)

| ID | 観点 | fixture / 実行 | expected |
| --- | --- | --- | --- |
| `U-TESTHYGIENE-001` | `vitest-config.test.ts` | config fixture | cache/include/exclude/timeout/globalSetupが固定値 |
| `U-TESTHYGIENE-002` | `runtime-repo-root.test.ts` | nested hook cwd | root解決失敗は`runtime state write blocked` |
| `U-TESTHYGIENE-004` | `doctor-runtime-state-location.test.ts` | canonical state | canonicalはgreen |
| `U-TESTHYGIENE-005` | `doctor-runtime-state-location.test.ts` | nested state | 誤配置はfail-close |
| `U-TESTHYGIENE-006` | `doctor-runtime-state-location.test.ts` | scan-error state | scan errorはfail-close |
| `U-TESTHYGIENE-008` | `temp-tree.test.ts` | DB handle | retry optionsを維持 |
| `U-TESTHYGIENE-009` | `temp-tree.test.ts` | cleanup error | `EBUSY`を伝播 |
| `U-TESTHYGIENE-010` | `git-workspace-fingerprint.test.ts` | dirty baseline | baselineはgreen |
| `U-TESTHYGIENE-011` | `git-workspace-fingerprint.test.ts` | fingerprint mutation | `workspace fence violation` |
| `U-TESTHYGIENE-012` | `workspace-roots.test.ts` | head root capability | `head_snapshot` rootはcwdと異なる |
| `U-TESTHYGIENE-013` | `doctor-test-repository-isolation.test.ts` | unclassified cwd | `unclassified:<path>:repository-read=1`、exit 1 |
| `U-TESTHYGIENE-014` | 同上 | mode件数／stale契約 | `callsite-drift:<path>:<mode>:expected=N:actual=M`／`stale-contract`、exit 1 |
| `U-TESTHYGIENE-015` | 同上 | 実repo台帳 | `checkTestRepositoryIsolation(...).ok=true` |
| `U-TESTHYGIENE-016` | `git-workspace-fingerprint.test.ts` | ignored／empty directory | inventory digest差分を検出 |
| `U-TESTHYGIENE-017` | `doctor-test-repository-isolation.test.ts` | root alias | `forbidden-live-root-source` |
| `U-TESTHYGIENE-018` | `doctor-test-repository-isolation.test.ts` | 文字列decoy | 文字列は非検出 |
| `U-TESTHYGIENE-019` | `persistent-db-cleanup-contract.test.ts` | owner AST scan | owner全件retry helper、raw recursive removal 0 |
| `U-TESTHYGIENE-020` | `git-workspace-fingerprint.test.ts` | non-Git tree | `head='non-git'` |
| `U-TESTHYGIENE-021` | `vitest-snapshot-runner.test.ts` | non-Git Pack | copy後`node_modules`なし |
| `U-TESTHYGIENE-022` | 同上 | cleanup | cleanup aggregateを伝播 |
| `U-TESTHYGIENE-023` | 同上 | 複合failure | 全cleanupを実行 |
| `U-TESTHYGIENE-024` | `doctor-test-repository-isolation.test.ts` | literal path | 未分類は`unclassified` |
| `U-TESTHYGIENE-025` | `doctor-test-repository-isolation.test.ts` | join／process variants | live rootはhard violation |
| `U-TESTHYGIENE-026` | `persistent-db-cleanup-contract.test.ts` | namespace DB／rm | canonical APIに解決 |
| `U-TESTHYGIENE-027` | `vitest-snapshot-runner.test.ts` | runtime input copy | DB／lifecycle logだけcopy |
| `U-TESTHYGIENE-028` | `doctor.test.ts` | aggregate blocker | Draft中の遷移oracle。confirm時は0 blocker／`ok=true`へ更新 |
| `U-TESTHYGIENE-029` | `doctor-test-repository-isolation.test.ts` | read alias | alias・element・asyncをcanonical化 |
| `U-TESTHYGIENE-030` | `persistent-db-cleanup-contract.test.ts` | rm alias | alias・elementをcanonical化 |
| `U-TESTHYGIENE-031` | `doctor-test-repository-isolation.test.ts` | bare HEAD root | `stale-contract`、exit 1 |
| `U-TESTHYGIENE-032` | `vitest-snapshot-runner.test.ts` | 親Git配下Pack | copy mode、全階層`.git`／`.ut-tdd`／`node_modules`除外 |
| `U-TESTHYGIENE-033` | `persistent-db-cleanup-contract.test.ts` | alias chain／constant-dead | dead cleanupは証拠外 |
| `U-TESTHYGIENE-034` | `vitest-snapshot-runner.test.ts` | non-Git capture | referenceはexecution captureと一致 |
| `U-TESTHYGIENE-035` | `doctor-test-repository-isolation.test.ts` | provenance alias／decoy | sink到達だけ計上、decoyは`stale-contract` |
| `U-TESTHYGIENE-036` | `vitest-snapshot-runner.test.ts` | reference seal lifecycle | 実行区間はwrite拒否、unseal後cleanup可能、failureはexit 1 |
| `U-TESTHYGIENE-037` | `doctor-test-repository-isolation.test.ts` | mode provenance／derived HEAD mutation sink | mode exact、derived write sinkは`forbidden-live-root-source`、dead rootは`stale-contract`、exit 1 |
| `U-TESTHYGIENE-038` | `doctor-test-repository-isolation.test.ts` | Node/Bun mutation sink destination | `open('w')`、stream、metadata、copy/link/symlink destination、`Bun.write`はderived HEAD pathで`forbidden-live-root-source`、`open('r')`は非違反 |
| `U-TESTHYGIENE-039` | `vitest-snapshot-runner.test.ts` | captured Git OID | source HEADが進んでも、execution/referenceは同一捕捉OIDの内容を保持 |
| `U-TESTHYGIENE-040` | `vitest-snapshot-runner.test.ts` | non-Git capture fingerprint | referenceがexecution captureから乖離すれば`snapshot content mismatch`でfail-close |
| `U-TESTHYGIENE-041` | `doctor-test-repository-isolation.test.ts` | symlink destination | HEAD配下への`symlinkSync`出力先は単独でも`forbidden-live-root-source` |
| `U-TESTHYGIENE-042` | `vitest-snapshot-runner.test.ts` | sealed reference fingerprint | seal直後のfingerprintとVitest後・unseal前のreference差分は`snapshot reference fingerprint mismatch`でfail-close |
| `U-TESTHYGIENE-043` | `global-setup-fence.test.ts` | teardown fence process | fixtureがOS別の物理sealを確認後に明示bypassでdetached HEAD snapshotを改変し、global teardownはsnapshot runner子processを非0で終了して`test workspace fence violation`を出す |
| `U-TESTHYGIENE-045` | `vitest-snapshot-runner.test.ts` | batch-only runner | `--watch`／`-w`／`--watch=...`はstale snapshotを監視するためfail-close、通常引数は許可 |
| `U-TESTHYGIENE-046` | `vitest-snapshot-runner.test.ts` | watch script contract | live sourceを観測できない`test:watch` scriptはmanifestに存在しない |
| `U-TESTHYGIENE-047` | `vitest-snapshot-runner.test.ts` | Bun runtime resolution | Vitest workerのNode binaryを継承せず、Bun runtimeのabsolute executableをsnapshot install/rebuild/Vitestに使う |
| `U-TESTHYGIENE-048` | `vitest-snapshot-runner.test.ts` | POSIX root guard | `uid=0`はchmod sealを迂回できるため、原因・非root再実行を示してfail-fastする |
| `U-TESTHYGIENE-049` | `vitest-snapshot-runner.test.ts` | root guard非対象 | `uid!=0`と`getuid`不在のWindowsはguardを素通りし、既存seal経路を維持する |
| `U-TESTHYGIENE-050` | `vitest-snapshot-runner.test.ts` | entrypoint副作用境界 | `uid=0`はsnapshot一時領域を作る前に拒否され、seal前だけでなく全runner副作用前のfail-fastとなる |
| `U-TESTHYGIENE-051` | `vitest-snapshot-runner.test.ts` | 非root entrypoint | `uid!=0`はguard後段へ到達し、root誤判定で処理を遮断しない |
| `U-TESTHYGIENE-052` | `vitest-snapshot-runner.test.ts` | Windows ACL seal command | 対象identityへ継承付き`WD,AD` denyを再帰適用し、identity空値はfail-closeする。通常権限での実write拒否は036、Administratorによるtake-ownership等の明示bypass後の改変検出は042が担う |
| `U-TESTHYGIENE-055` | `vitest-snapshot-runner.test.ts` | origin custody ref保全 | detached snapshotがsourceの`refs/remotes/origin/*`をHEADと**別revision**のまま引き継ぐ。source HEADと同一revisionを注入するだけの実装では落ちる (ref依存checkがsnapshotで誤ってOKになるのを防ぐ) |
| `U-TESTHYGIENE-056` | `git-workspace-fingerprint.test.ts` | volatile DB内容変更 | live lane除外時、harness DB一族4パスの内容変更でinventory digestが変わらない (issue #203) |
| `U-TESTHYGIENE-057` | 同上 | volatile entryの形 | 除外entryがcontent hash (sha256 hex 64桁) を持たない = 読んでいない。既定 (option無し) では同じ4 entryがhashを持つ |
| `U-TESTHYGIENE-058` | 同上 | 既定の非破壊 | option無しの呼び出しは従来どおりharness DB内容変更を検知する |
| `U-TESTHYGIENE-059` | 同上 | 漏洩検知の保持 | 除外option下でも`.ut-tdd/gate_runs/leak.json`と空directoryの新規作成を検知 (016の意図を保つ) |
| `U-TESTHYGIENE-060` | 同上 | 存在の非免除 | 除外option下でもharness DBの作成・削除を検知する (中身だけ免除、存在は見る) |
| `U-TESTHYGIENE-061` | 同上 | 型すり替え | 除外option下でもregular file→symlink/directoryの型変更を検知する |
| `U-TESTHYGIENE-062` | 同上 | exact path限定 | `.bak`／`sub/`／root直下／大文字表記は除外に当たらず内容変更を検知する (case-sensitive exact一致) |
| `U-TESTHYGIENE-063` | 同上 | 通常runtime file | 除外option下でも`.ut-tdd/logs/*`のような通常ファイルの内容変更を検知する |

実行対応: `tests/git-workspace-fingerprint.test.ts`、`tests/doctor-test-repository-isolation.test.ts`、
`tests/persistent-db-cleanup-contract.test.ts`、`tests/vitest-snapshot-runner.test.ts`、`tests/global-setup.ts`。

## PLAN-L7-470 review dispatch analyzer oracle (2026-07-31)

対象 = `src/feedback/review-dispatch.ts`。実テスト = `tests/review-dispatch.test.ts`。
identity は `(memoryId, pr, exactHead, reviewRevision)` とし、入力順・replay・古いHEADに
左右されず、非author familyの有効verdictだけをmerge準備判定へ使う。

| ID | 設計境界 | fixture / mutation | expected |
| --- | --- | --- | --- |
| `U-RVDISP-001`〜`006` | 基本進捗とmerge準備 | requestedからverdictまでの表示、PASS系＋CI/PR状態 | 有効な終端verdictと全merge条件成立時だけ`merge_ready` |
| `U-RVDISP-007`〜`012` | verdict単一SLA・自己承認・HEAD・決定論 | 60分境界、同family、旧HEAD、入力shuffle、verdictなしmerge | verdict未到達だけをbreachにし、理由と安定順を維持 |
| `U-RVDISP-013`〜`020` | identityとreceipt妥当性 | memory/revision/head違い、不正時刻、future、family、進捗欠落 | 別identityへ混入せず、進捗欠落は非blocking診断にする |
| `U-RVDISP-021` | request replay | 完全重複requestと同identity内容競合 | 完全重複は冪等、競合は`duplicate_request_conflict` |
| `U-RVDISP-022` | old HEAD隔離 | 同reviewRevisionの旧HEAD receipt | 現HEAD requestの理由・状態を汚染しない |
| `U-RVDISP-023` | PR観測欠落 | requestに対応するPR observationなし | retry可能な未確定状態としてfail-close |
| `U-RVDISP-024` | reason付き非ready | verdict等が揃ってもvalidation reasonあり | `merge_ready`を返さない |
| `U-RVDISP-025` | unrelated malformed隔離 | 別identityの不正artifact | 正常requestを汚染せずdiagnosticへ分離 |
| `U-RVDISP-026` | matching malformed局所化 | 対応identityの不正artifact | 対応requestだけをfail-close |
| `U-RVDISP-027`〜`028` | PR観測replay | 同PRの相反観測と完全重複観測 | 相反は`duplicate_pr_observation_conflict`、完全重複は冪等 |
| `U-RVDISP-029` | 進捗時刻と終端証拠の分離 | acknowledged/in_review/verdictが同一timestamp | 有効verdictの終端証拠を進捗順序で拒否しない |
| `U-RVDISP-030` | canonical HEAD | uppercase 40-hex SHA | `invalid_head`でfail-close |
| `U-RVDISP-031` | 孤児診断と通知identity | well-formed orphan＋同PR/同revision・異なるexactHeadの同一SLA違反 | orphan identityを診断へ保持し、messageにexactHeadを含めて通知dedupeで潰さない |
| `U-RVDISP-032` | explicit-zone timestamp | GitHubの秒精度`Z`、offset付き入力、TZ無し request、不正暦日 | timezone明示ISOは同一instantとして受理し、TZ無し/不正暦日は`ageMinutes=null`かつverdict未達をbreachにしてfail-close |
| `U-RVDISP-033` | instant-normalized replay | 同一instantを秒精度`Z`、millis、offsetで表したrequest/receipt replay | timestamp表現差をcontent identityから除外し、重複競合や恒久non-readyを発生させない |
| `U-RVDISP-034`〜`037` | verdict-anchor | PASS/FLAG単独、same-family、旧HEAD、旧HEAD ack＋現HEAD PASS | 非author current verdictだけを終端証拠にし、FLAGはblockingを保持 |
| `U-RVDISP-038`〜`041` | 未応答と不正時刻 | 61分無verdict、malformed/request以前/identity不一致、invalid/future request | breachは`verdict`だけ。不正requestは`ageMinutes=null`で受理しない |
| `U-RVDISP-042` | 入力順不変 | receipts/prsの順序反転 | entries・reason・breach・stateが完全一致 |
| `U-RVDISP-043`〜`046` | request終端と孤児MERGED | stale HEAD、unmerged CLOSED、request無しMERGED、verdict無しMERGED | 終端後のSLAを停止し、MERGED手順違反だけをfail-close |
| `U-RVDISP-047`〜`048` | merge先HEAD横断照合 | old request＋current verdict、old requestだけ＋別HEAD MERGED | current verdictがあればold request終端、無ければmerge先request欠落をfail-close |
| `U-RVDISP-049`〜`050` | author family receipt併存・不正MERGED孤児 | author/cross-family同kind併存、request無し不正SHA MERGED | cross-family verdictを保持し、不正MERGED observationをfail-close |
| `U-RVDISP-051`〜`052` | 競合verdictの安全側集約・request以前receipt分離 | 先行PASS＋後発FLAG、request以前PASS＋有効後続PASS | blocking findingを失わず、無効先行receiptが有効後続receiptを隠さない |

実行対応: `tests/review-dispatch.test.ts` (`U-RVDISP-001`〜`052`)。

## PLAN-L7-457 fence streaming hash / harness.db VACUUM oracle (issue #118、2026-07-22)

対象 = `tests/support/chunked-hash.ts`（fence/snapshot共通のstreaming hashヘルパー）、
`src/state-db/db-maintenance.ts`。実テスト = `tests/git-workspace-fingerprint.test.ts`、
`tests/db-maintenance.test.ts`。

| ID | 観点 | fixture / 実行 | expected |
| --- | --- | --- | --- |
| `U-FSTREAM-1` | チャンクhashの同値性 | 0／10バイト／チャンク長±1／2チャンク超のfileを注入チャンク長(64KiB)で`hashFileChunked` | `readFileSync`丸読み(`createHash("sha256").update(readFileSync(path))`)と完全一致するsha256 hex |
| `U-FSTREAM-2` | 部分readの継続 | `readSync`が要求長より小さい値のみ返す`ChunkedFileIo`を注入 | EOFまで取りこぼさずchunk丸読みと同一digest。呼び出し回数はsub-chunk単位を上回る |
| `U-FSTREAM-3` | 読取失敗の診断性 | 存在しないpathを`hashFileChunkedWithDiagnostics`へ注入 | throwするErrorに相対path・サイズ(bytes)・原因messageを含む |
| `U-DBVAC-1` | 閾値超過でVACUUM発火 | 実SQLite dbへinsert→delete churnを生成し、`minFreelistBytes`/`freelistRatio`を低く注入 | `ran=true`、`afterBytes<beforeBytes`、on-disk file sizeが縮小 |
| `U-DBVAC-2` | 閾値未満はno-op | 同churnを既定閾値(64MiB/25%)で評価 | `ran=false`、file sizeは不変、warningなし |
| `U-DBVAC-3` | 排他lockでfail-open | 別接続で`BEGIN IMMEDIATE`保持中に`maybeVacuumHarnessDb`を実行 | throwせず`ran=false`、`warning`に失敗理由 |

実行対応: `tests/git-workspace-fingerprint.test.ts`、`tests/db-maintenance.test.ts`、
`tests/db-currency.test.ts`(`U-DBCURRENCY-026`/`027`、stop-refresh経路がrebuild完走後のみ
`maybeVacuumHarnessDb`を呼ぶことの検証)。

## PLAN-L7-460 db-refresh Bun再帰起動の封じ込め oracle (2026-07-31)

対象 = `src/state-db/stop-refresh.ts` / `src/cli.ts`。実テスト =
`tests/db-currency.test.ts`。

| ID | 観点 | fixture / mutation | expected |
| --- | --- | --- | --- |
| `U-DBCURRENCY-007` | detached Bun拒否 | 実配線相当`execPath=/usr/bin/bun`＋`scriptPath=/repo/src/cli.ts`を反復、spawn spy | 常に`launched=false`、`reason=bun-runtime-refused`、spawn 0回、dirtyとreason単位の冪等failure receipt 1件を保持し、leaseを再取得可能 |
| `U-DBCURRENCY-028` | Node正経路 | 明示Node executableとcompiled JavaScript entryを注入 | detached spawn 1回、ownership handoff後に`unref` |
| `U-DBCURRENCY-029` | executable/runtime識別 | bare名、Windows/POSIX absolute path、`.cmd`、改名Bunのruntime version、類似名 | 名前または`process.versions.bun`相当でBunを拒否し、非Bun Nodeと`bun-wrapper`は誤拒否しない |
| `U-DBCURRENCY-030` | direct worker拒否 | Bunで直接`session db-refresh`相当を起動済みleaseへ適用 | rebuildに入らず、dirtyとfailure receiptを保持してleaseを解放 |
| `U-DBCURRENCY-031` | worker allowlist | Python／PowerShell executable、Node＋TypeScript source entryを各2回反復 | 全件spawn 0回、`unsupported-refresh-entrypoint`、dirtyとreason単位の冪等failure receipt 1件を保持。Node＋compiled JSだけ028で許可 |

## PLAN-L7-434 全PR共通harness-check trigger oracle (PLAN-REVERSE-434 backfill、2026-07-14)

対象 = `.github/workflows/harness-check.yml` / `docs/templates/github/common/{harness-check,pack-harness-check}.yml` /
`src/setup/templates.ts` / `src/lint/github-ci-policy.ts`。実テスト =
`tests/github-ci-policy.test.ts` と `tests/setup.test.ts`。

| ID | 観点 | fixture / mutation | expected |
| --- | --- | --- | --- |
| `U-CIPOL-001` | universal PR trigger正常系 | source / Packの`pull_request`にbase filterなし、`push.branches=[main]` | `analyzeGithubCiPolicy().ok=true`。非main baseを除外する構文0、job名`harness-check`不変 |
| `U-CIPOL-002` | stacked PR退行 | `pull_request.branches=[main]` | `main_limited_pr_trigger`、exit 1相当 |
| `U-CIPOL-003` |別表記のfail-close | `branches-ignore=[work/**]` と `pull_request`欠落を各mutation | 前者=`main_limited_pr_trigger`、後者=`missing_trigger` |
| `U-CIPOL-004` | trigger型fail-close | `pull_request`へ`false` / string / array / numberを各mutation | 全件`malformed_trigger_shape`。bare/nullまたはbase filterなしmapping以外を拒否 |
| `U-CIPOL-005` | push main限定の構造検査 | push欠落+無関係fieldの`main`、別branch、`branches-ignore` | 欠落=`missing_trigger`、不正形=`invalid_push_main_trigger` |
| `U-CIPOL-006` | 4 artifact入力 | source templateとsetup builtinを個別mutation | profile重複でdropせず、変異したartifact path自身のfinding |
| `U-CIPOL-007` | workflow path filter禁止 | PR=`paths`、push=`paths-ignore`を各mutation | 両方`filtered_trigger`。Required checkをskip/pending化する経路0 |
| `U-CIPOL-008` | activity types完全性 | `types=[opened]` / `types=[opened,synchronize,reopened,ready_for_review]` | 前者=`incomplete_pull_request_types`、後者Green。bare triggerもGreen |
| `U-CIPOL-009` | activity vocabulary | 未知`banana` / 重複`opened` / 非文字列を各mutation | 未知・重複=`unsupported_pull_request_type`、非文字列=`malformed_trigger_shape` |
| `U-CIPOL-010` | workflow構造のtotal fail-close | YAML root/on/job/stepsの不正型、空step、空concurrency、mainもcancelする式、role/profile不整合を各mutation | throwせず`malformed_workflow_shape` / `missing_concurrency` / `invalid_workflow_profile`、`ok=false`。concurrencyは§6.9.3のcanonical式と完全一致 |
| `U-CIPOL-011` | 権限の完全一致 | 4 artifactそれぞれを`issues: read`へ変異。`contents: write` / scalar `read-all` / `issues: write`追加 | `permissions: {contents: read}`完全一致以外は`missing_permission` |
| `U-CIPOL-012` | runtime profile独立性 | source profileへPack本文を置換、package artifact profileをsource/packへ変異 | 本文markerで再分類せずsource policyの`missing_step`。`package.json.utTdd.artifactProfile`を正本とする |
| `U-SETUP-004b2` | setup builtin同期 | built-in `common/harness-check.yml` | `pull_request`あり、直下の`branches` / `branches-ignore`なし。既存guard強度も維持 |

`pull_request`を単に含む文字列検査だけではGreenにしない。YAML構造でbase filter不在を検査し、
source workflow / source template / Pack template / setup builtinのどれか1 artifactだけの更新を完了扱いにしない。
検査対象本文をprofile選択に再利用せず、構造異常は例外でdoctor wrapperへ逃がさずanalyzer自身がviolation化する。

## PLAN-L7-435 駆動モデル準拠PLAN Admission oracle (2026-07-15)

対象 = `PlanAdmissionPolicy` / `ut-tdd plan draft` / admission receipt / PLAN tamper fence。

Issue #163のadditive deltaは、PLAN IDを共有parserの
`namespace + numeric ordinal` で一意化し、legacy collision debtをexact setとして検査する。

| ID | 対象 | oracle |
|---|---|---|
| `U-PLANGOV-002a` | slug違いの同一L6 ordinal | 両PLANを`duplicate_plan_identity`で拒否 |
| `U-PLANGOV-002b` | `RECOVERY-070` / `RECOVERY-70` | zero paddingを除いた同一座標として拒否 |
| `U-PLANGOV-002c` | legacy collision exact set | 既知集合だけを許容 |
| `U-PLANGOV-002d` | legacy座標への3件目追加 | 3件すべてを拒否 |
| `U-PLANGOV-002e` | legacy構成plan_idの差し替え | exact set不一致として拒否 |
| `U-PLANGOV-002f` | legacy collisionの一方を削除 | 解消済み単独PLANを許容 |
候補oracleはL7実装と同時に `U-PADM-*` へ昇格し、tests内citationを必須とする。

| ID | 観点 | fixture / mutation | expected |
| --- | --- | --- | --- |
| `U-PADM-001` | 通常Forward | 正規signalとForward tuple | Issueなしでpermit |
| `U-PADM-002` | 未知/曖昧signal | route候補0件または複数同順位 | Forward fallbackなしでdeny |
| `U-PADM-003` | 許可tuple | kind/layer/phase/branchを各1変異 | exact tuple外はrule ID付きdeny |
| `U-PADM-004` | escape必須束縛 | Issue/drive/origin/reentryを各1件欠落 | それぞれdeny、番号だけのIssueを証拠にしない |
| `U-PADM-005` | 回避耐性 | archivedによる新規起票 | statusで新規authoringを免除しない |
| `U-PADM-006` | redesign再合流 | 任意の起点証拠 + `design_to_implementation` + supersede対象 + Forward合流先 + 後続実装 | 設計先行の差替えだけpermit |
| `U-PADM-007` | 遷移方向の分岐 | redesignへ`implementation_to_design`を指定 | deny。実装から設計への引戻しはreverseだけ |
| `U-PADM-008` | reverse追従 | `implementation_to_design` + 実装origin + Forward合流先 | 実装から設計への追従だけpermit |
| `U-PADM-009` | 方向と資産状態の整合 | redesignへ`preserved`、reverseへ`none` | 方向は主軸、矛盾する資産状態はdeny |
| `U-PADM-010` | receipt parse | 厳格frontmatterとroute/Issue二重宣言 | receiptを保持し矛盾をdeny |
| `U-PADM-011` | redesign receipt | 方向・資産状態・supersedesを一軸変異 | 設計→実装と矛盾するreceiptをdeny |
| `U-PADM-012` | diff fence permit | 新規PLANと対応tracked projection | binding一致時だけpermit |
| `U-PADM-013` | diff fence deny | receipt欠落/stale/direct delete | 全経路をfail-close |
| `U-PADM-014` | projection parse | canonical append-only projection | command lookup可能な厳格projectionだけ受理 |
| `U-PADM-015` | projection chain | chain改ざん/順序変更/重複binding | 非canonical projectionをdeny |
| `U-PADM-016` | projection境界 | short hash/PLAN外path/unknown field | schema境界でdeny |
| `U-PADM-017` | admission-check集約 | projectionと比較の複数欠落 | 全findingを欠落なく集約 |
| `U-PADM-018` | adapter例外 | Git/projection adapter例外 | 例外をfail-close findingへ変換 |
| `U-PADM-019` | pure analyzer順序 | 両adapter境界のvalid/invalid | 両境界valid後だけpure analyzerを実行 |
| `U-PADM-020` | ledger v3 schema | 空DBからv3生成 | receipt/current/event journalを制約付き生成 |
| `U-PADM-021` | v2→v3 migration | 完全なv2 ledger | 全検証後に原子的migration |
| `U-PADM-022` | migration fail-close | v1/future/partial/corrupt v2 | mutation 0で拒否 |
| `U-PADM-023` | draft Saga正常系 | validate→intent→publish→ledger→commit | 二成果物とreceiptを各1回だけ確定 |
| `U-PADM-024` | committed replay | 同一command再送 | publish/appendなしで既存receiptへ収束 |
| `U-PADM-025` | command collision | 同一IDでpayload差替え | 副作用なしで拒否 |
| `U-PADM-026` | ledger failure補償 | publish後にledger失敗 | preimage復元し`recovery_required`を記録 |
| `U-PADM-027` | restore failure | 補償restoreも失敗 | 自動retryを遮断し曖昧成功にしない |
| `U-PADM-028` | durable journal | intent→commit | append-only eventとcurrent projectionが一致 |
| `U-PADM-029` | journal遷移 | command競合/recoveryからの不正遷移 | 状態機械がfail-close |
| `U-PADM-030` | crash recovery fence | intent残存+ledger receipt | artifact postimageを証明できないため自動commitせず`recovery_required`へ遮断 |
| `U-PADM-031` | journal tamper | current/event digest・chain改ざん | 読取時に遮断 |
| `U-PADM-032` | atomic publish | source/projection stage+rename | fsyncを伴うdurable publish |
| `U-PADM-033` | partial publish補償 | 片側rename後のfault | 両preimageを冪等復元 |
| `U-PADM-034` | restore retry | restore中fault | 再試行で復元完了 |
| `U-PADM-035` | filesystem境界 | lexical/symlink root escape | workspace外writeをdeny |
| `U-PADM-036` | stage cleanup | stage fault | temp/rollback fileを残さない |
| `U-PADM-037` | new target restore | preimageなしtargetのpartial publish | restoreで新規targetを除去 |
| `U-PADM-038` | canonical digest | 同一domain commandをjournal/ledgerへ投影 | 同一SHA-256を再現 |
| `U-PADM-039` | digest非自己申告 | domain command shape検査 | 外部入力digest fieldを持たない |
| `U-PADM-040` | CLI created | strict manifest+Admission permit | serviceへ渡しcreated/exit 0 |
| `U-PADM-041` | CLI replay | committed command再送 | replay/exit 0 |
| `U-PADM-042` | CLI deny | Admission拒否 | factory未生成/exit 1 |
| `U-PADM-043` | CLI input境界 | unknown field/path traversal | strict parseで副作用前に拒否 |
| `U-PADM-044` | publish finalize | 公開済みtokenを完了 | 公開内容を保持し補助file/tokenを冪等cleanup |
| `U-PADM-045` | finalize token境界 | 同一IDの偽造/unknown token | cleanup対象にせずdeny |
| `U-PADM-046` | finalize retry | cleanup途中fault | 公開内容を戻さず再試行でcleanup完了 |
| `U-PADM-047` | command assemble | manifest/admission/environment同一入力 | canonical/service commandを決定論生成 |
| `U-PADM-048` | command identity | plan ID/path/namespace/ordinal各不一致 | 副作用前にdeny |
| `U-PADM-049` | command digest境界 | manifestへdigest自己申告を混入 | canonical command/digestへ影響0 |
| `U-PADM-050` | decision binding | admitted requestとdecision tuple不一致 | assemblyをdeny |
| `U-PADM-051` | receipt render | ledger receipt確定後のsource/projection | 同一bindingとchain recordを生成・再検証 |
| `U-PADM-052` | escape receipt render | Issue/origin/transition/reentry/escape | 全項目をsource receiptへ欠落なく束縛 |
| `U-PADM-053` | projection input境界 | caller supplied projection/壊れたchain | render前にdeny |
| `U-PADM-054` | production runner | 実SQLite+filesystemで同一commandを2回実行 | created後に同一receiptへreplay、record増加0 |
| `U-PADM-055` | ledger adapter receipt | canonical payload | certificate/command digest付きreceiptへ変換 |
| `U-PADM-056` | ledger adapter digest | 自己申告digest不一致 | write前にdeny |
| `U-PADM-057` | ledger adapter deny | ledger rule violation | rule ID付きtyped errorへ変換 |
| `U-PADM-058` | ledger pending rollback | onPrepared内fault | callbackはCOMMIT前、全9表rollback |
| `U-PADM-059` | prepared receipt mismatch | journal intentとledger receipt digest不一致 | publish前にdenyしrecovery_required |
| `U-PADM-060` | restore failure | publish後rollback restore fault | recoveryを記録し自動再実行をdeny |
| `U-PADM-061` | PLAN identity共通解釈 | 全tokenとzero-padding ordinal | token/ordinal/ordinalTextを単一parserで再現 |
| `U-PADM-062` | 予約可能identity境界 | 凍結`M`系列、ordinal 0、桁不足、不正token/slug、`070`対`70` | canonical parseとdraft予約可否を分離し、zero-paddingを同一予約座標化 |
| `U-PADM-063` | Recovery command assemble | `PLAN-RECOVERY-*`とRecovery Admission/source | namespace/ordinalとescape bindingを決定論生成 |
| `U-PADM-064` | Recovery production runner | 実SQLite+filesystemへ同一Recovery commandを2回実行 | created後replayしsource/projection/receiptを各1件に収束 |
| `U-PADM-065` | identity/source/Admission binding | Recovery ID/sourceへForward Admissionを混在 | ledger openとfilesystem writeより前にdeny |
| `CANDIDATE-PADM-009` | authoring Saga強制終了 | DB commit直前直後の強制終了と補償fault | 未完journalをfail-closeし明示recoveryまで非正本 |
| `CANDIDATE-PADM-010` | GitHub ingress | signature不正/enum不正/stale delivery | quarantine、PLAN admission 0 |

工程表/replay/改ざん候補はL6正本の `CANDIDATE-PADM-006`〜`008` を再定義せず、そのIDのまま
上記 `U-PADM-012`〜`016` / `U-PADM-024`〜`025` へ昇格した。候補IDの別意味への再利用は禁止する。

property testは全signal×mode×tuple×status×createdの直積で、canonical policyがpermitした時だけ
書込み可能であることを確認する。mutation testはunknown→Forward fallback、archived/date免除、
tuple allowlist default、Issue requirement削除、schedule fallback、receipt digest比較除去を全てkillする。

## PLAN-L7-436〜439 Execution Ledger / GitHub連動 oracle (2026-07-15)

設計正本は `PLAN-L4-30` / `PLAN-L5-23` / `PLAN-L6-83〜85` とし、検出器はその契約へ従う。
GitHubは正本ではなく冪等projectionであり、通常ForwardはIssueを要求しない。Forward外遷移だけが
`drive_model` と再合流情報を持つIssueを必須とする。

| ID | 観点 | fixture / mutation | expected |
| --- | --- | --- | --- |
| `CANDIDATE-EXEP-001` | 通常Forward | L0→L1の合法遷移 | Episode/eventは記録するがIssue/outbox 0 |
| `CANDIDATE-EXEP-002` | Forward外Issue必須 | escape理由あり、`drive_model`欠落 | E2以降へ進めず`drive-model-required` |
| `CANDIDATE-EXEP-003` | E0〜E15順序 | E7をE6前にappend | `episode-transition-invalid`、既存event列不変 |
| `CANDIDATE-EXEP-004` | replay決定性 | 同一event列を2回reduce | state/digest/next-actions完全一致 |
| `CANDIDATE-EXEP-005` | command冪等性 | 同一command keyを2回適用 | event/outbox増分は各1件、返却episode同一 |
| `CANDIDATE-EXEP-006` | 原子的outbox | event append後/outbox insert前へfault injection | event/outboxとも部分commit 0 |
| `CANDIDATE-EXEP-007` | override監査 | 人間overrideで遷移を進める | 既存event更新0、理由/actor/revision付きeventをappend |
| `CANDIDATE-EXEP-008` | authored source境界 | DBだけに完了stateを注入 | rebuildで消滅し、完了証拠として不採用 |
| `CANDIDATE-EXEP-009` | event語彙の正本一致 | event番号を別意味へshift/alias、unknown kindを注入 | requirements E0〜E15表とのexact不一致を拒否 |
| `CANDIDATE-EXEP-010` | 並行append | 同一expected sequenceへ2 commandを競合 | 片方だけcommitし、他方はwrite 0のsequence conflict |
| `CANDIDATE-EXEP-011` | sequence正本 | occurred_at逆行・clock skewを注入 | 時刻で順序補完せずsequence/digest chainでfail-close |
| `CANDIDATE-GHISS-001` | Issue projection冪等 | 同一outboxを再送 | remote Issue 1、mapping 1、E4 1 |
| `CANDIDATE-GHISS-002` | timeout後reconcile | remote作成成功後に応答timeout | marker検索で既存Issueへbindし重複作成0 |
| `CANDIDATE-GHISS-003` | inbound重複 | delivery ID同一webhookを2回 | inbox 1、domain event増分1 |
| `CANDIDATE-GHISS-004` | inbound真正性 | signature不正/許可外repo | domain mutation 0、fail-close finding |
| `CANDIDATE-GHISS-005` | GitHub停止 | 5xx/rate limit | Ledgerを巻き戻さずretry可能outboxを保持 |
| `CANDIDATE-GHISS-006` | legacy queue | episode binding無し`issue_queue`行 | 自動昇格せず`legacy-unbound`として可視化 |
| `CANDIDATE-GHISS-007` | worker競合 | 同じleaseを2 workerが取得試行 | remote create最大1回、loserはwrite 0 |
| `CANDIDATE-GHISS-008` | stale remote | 古いremote version/webhookを後着 | 新しいprojection/domain stateを巻き戻さない |
| `CANDIDATE-GHISS-009` | payload custody | secret/signature/raw transcriptをDTOへ注入 | event/outbox/Issue保存を拒否しwrite 0 |
| `U-EXISSUE-007` | E2 typed projection入口 | 未検証の生commandを直接projectorへ渡す | GitHub call 0、`forward-escape-e2-required`でfail-close |
| `U-EXISSUE-008` | GitHub成功binding検証 | repository/body digest/node ID/URL/issue number/observed revisionを各1箇所改変 | E4 0、durable Deferred receiptを記録 |
| `U-EXISSUE-009` | canonical drive三面照合 | command/Issue/PLANを同じ未知値へ揃える | 一致だけではGreenにせず`unknown-drive-model` |
| `U-EXISSUE-010` | durable restart | SQLiteをclose/reopenして同じE2/outboxを再開 | certificate/digest chainを復元しIssue 1件へ収束 |
| `U-EXISSUE-011` | custody/replay/crash | forged E2、別payload journal、remote成功後append失敗 | call/returnをfail-closeしfalse Deferredをappendしない |
| `U-EXISSUE-012` | projection必須値 | owner/repository/title/labelsを各空へmutation | E2 certificate発行前に`invalid-issue-projection` |
| `U-EXISSUE-013` | SQLite journal tamper | `event_digest`または`event_json`を直接改変してclose/reopen | digest chain検査が改変を拒否しGitHub call 0 |
| `U-EXISSUE-014` | SQLite certificate tamper | E2 `event_digest`を直接改変してclose/reopen | custody照合false、E3/E4入口を通さない |
| `U-EXISSUE-015` | custody failure変換 | storage例外へsecret/pathを混入、同commandを異payloadで再利用 | raw本文を残さず閉じたstructured violation、E2未発行 |
| `U-EXISSUE-016` | SQLite同時create-or-get | 2 workerをgateから同時解放し同command/payloadのcertificateとQueuedをappend | 両workerが同一certificate/receiptを取得しevent rowは1件 |
| `CANDIDATE-REENTRY-001` | 証明書binding | episode/drive/source revision/target L一致 | E9を1回だけappend |
| `CANDIDATE-REENTRY-002` | 中間・合流後test | E8またはE11の片方だけGreen | draft PR生成不可 |
| `CANDIDATE-REENTRY-003` | stale target | certificate後にtarget HEAD変更 | certificate失効、E10/E12拒否 |
| `CANDIDATE-REENTRY-004` | drive不一致 | Issueとcertificateの`drive_model`不一致 | `reentry-drive-mismatch` |
| `CANDIDATE-REENTRY-005` | PR前置順序 | E11前にPR command | E12/outbox 0、`post-reentry-test-required` |
| `CANDIDATE-REENTRY-006` | PR送信ambiguity | remote作成後timeout→retry | marker/SHAでreconcile、draft PR 1 |
| `CANDIDATE-GHMERGE-001` | cross-provider | authorとreviewerが同一provider | E13拒否、代替tierをcross扱いにしない |
| `CANDIDATE-GHMERGE-002` | tests-before-review | required check未完でreview | approvalをmerge証拠に採用しない |
| `CANDIDATE-GHMERGE-003` | exact SHA | certificate/check/review/PR head SHA不一致 | merge authorization拒否 |
| `CANDIDATE-GHMERGE-004` | force-push | approval後にhead更新 | review/certificateをstale化 |
| `CANDIDATE-GHMERGE-005` | merge応答ambiguity | merge成功後timeout | remote main SHA照合でE14をexactly once化 |
| `CANDIDATE-GHMERGE-006` | E15 closure | main CI未完またはIssue close失敗 | E15未到達、学習fact未確定。全成功時のみclosure |
| `CANDIDATE-GHMERGE-007` | snapshot原子性 | 別時点のcertificate/check/reviewを混在 | TOCTOU snapshotを拒否しmerge command 0 |
| `CANDIDATE-GHMERGE-008` | learning rebuild | projection削除後rebuildを2回 | learning identity/digest一致、retryで件数不増 |
| `U-GHPROJ-001〜005` | Forward readiness reducer | 合流依存の部分解決、欠損先行、同期/CI/review不整合、PLAN重複、完了statusだけでclosure証跡なし | 全先行完了かつCI成功・review承認・Project同期・検証済みmerge receiptが揃う時だけ`完了`となり後続を`着手可能`へ解放。欠損・不整合・証跡不足は`阻害中`、重複identityはfail-close |
| `U-GHPROJ-010〜014` | SQLite projection / binding custody | schedule投影、rebuild clear、out-of-order観測、stale HEAD、pending outbox、object付替え、revision rollover | readinessは再構築され、binding/outboxは保持。PR HEAD不一致のCI/review/mergeはwrite 0。provider identity付替えと古いrevisionへの後退を拒否 |
| `U-GHPROJ-020〜024` | Project V2 reconcile | dry-run、create、同値再送、重複item、field欠損、binding保存 | dry-runはremote/DB mutation 0、同値はno-op、重複/契約driftはfail-close、item identityをdurable保存 |
| `U-GHPROJ-030〜035` | lifecycle証跡選択 / closure fail-close | 複数open PR、旧merged PR後着、旧Project revision、管理済み完了item、証跡なし完了status、偽造・失効merge receipt | 複数openは`不整合`、現行open HEADだけを採用、旧revisionを無視、管理済みitemは完了状態まで収束同期する。statusだけでは完了・後続解放せず、main CI成功を含む正規receiptだけをmerge証跡に採用し、失効receiptは不採用 |
| `U-GHBIND-001〜003` | repository facts同期 / typed closure receipt | typed PR trace、branch/check/review/merge/Issue、trace欠損、revision欠損、stale HEAD、無関係green check、同一provider review、片lane欠落、旧HEAD lane receipt、PLAN sourceなしの直接DB row注入 | 完全traceとPR/main双方のrequired `harness-check`、canonical PLAN frontmatterにexactly once存在し同一revision/HEADへ固定された異provider claim-blind/spec-blind両receiptの結合digestだけがclosure receiptへ収束。不完全・曖昧・DB単独の履歴は推測せずskipし、merge receiptを失効 |

property testは任意の合法event列でreplay同一性・単調append・terminal後遷移禁止を確認する。
mutation testはIssue判定反転、`drive_model`検査除去、outbox別transaction化、SHA比較除去、
cross-provider比較除去、E9/E11いずれかのgate除去を全てkillする。

## Issue #123 shell-free hook invocation oracle (2026-07-22)

| U-ID | 対象 | oracle |
|---|---|---|
| `U-HOOKEXEC-001` | semantic invocation | executable と argv が別 field で保持され、空白・quote を含む token も join/split されない。 |
| `U-HOOKEXEC-002` | Claude serializer | `command` は `node`、`args` は shell-free native Bun launcher、entrypoint、subcommand の token 配列になる。 |
| `U-HOOKEXEC-003` | source Claude hooks | agent/work guards、session start/post-tool-use/summary、subagent-stop の全 6 hook が exec form である。 |
| `U-HOOKEXEC-004` | policy preservation | guard は `blockOnFailure:true`、観測/session hook は既存 fail-open policy を保持する。 |
| `U-HOOKEXEC-005` | Codex separation | Claude exec serializer の変更が Codex JSON shape を暗黙変更せず、両者は semantic invocation で等価比較される。 |
| `U-HOOKEXEC-006` | setup / Pack parity | source、built-in、docs template、fresh consumer materialization の executable+argv が一致する。 |
| `U-HOOKEXEC-007` | doctor fail-close | shell-form command、argv 欠落/追加/並替え、command spoofing、argv の shell operator を個別に検出する。 |
| `U-HOOKEXEC-008` | Windows native smoke | hook host→Bun entrypoint の dispatch ancestry に `sh.exe` / `bash.exe` / `cmd.exe` / `powershell.exe` / `pwsh.exe` / dispatch 用 `conhost.exe` が無く、hook outcome は既存契約どおりである。 |
| `U-HOOKEXEC-009` | Node TypeScript launcher floor | `package.json#engines.node` は無フラグ TypeScript execution が有効な `>=22.18` を要求し、22.6〜22.17を対応済みと宣言しない。 |
| `U-HOOKEXEC-010` | Windows custody debt boundary | hook PLAN は `windowsHide` / shell-free Greenをprocess-tree custody証拠へ流用せず、Issue #134 / Windows Job Object / 未解消境界を明記する。 |

実行対応は `tests/hook-native-launcher.test.ts`、`tests/project-hook.test.ts`、
`tests/codex-hook-adapter.test.ts`、`tests/setup.test.ts` である。主検証となる
`tests/hook-native-launcher.test.ts` は `process.cwd()` を 1 回だけ使用し、snapshot runner が
準備した writable execution snapshot で source / Pack template の parity を検証する
`isolated_fixture` 分類とする。live checkout の検証に切り替えたり、root 参照を
追加した場合は `test-repository-isolation` の `callsite-drift` で fail-close する。

Windows smoke は単なる exit code green では代替できない。process ancestry の捕捉結果を test artifact
として残し、「Bun が起動した」ことと「shell/conhost を介さず Bun を起動した」ことを別 assertion にする。
## Node self-host bootstrap候補unit pair（Issue #152 D0-N）

以下はD0時点では全て設計候補である。対応test codeと実装をF0の同一commitへ追加し、Red実測を記録した
候補だけを同番号の`U-NODEBOOT-*`へ昇格する。

| 候補ID | Red入力 | Green oracle |
|---|---|---|
| `CAND-NODEBOOT-001` | 正規Node/npm/lock/source/compiled generation | 全identity・digest・subject revision一致でsealed handleを返す |
| `CAND-NODEBOOT-002` | receipt欠落、unknown schema、別revision replay | process生成0でtyped failure |
| `CAND-NODEBOOT-003` | Node/npm/lock/dependency/source/compiledを一要素ずつmutation | 対応digest mismatchでfail-close |
| `CAND-NODEBOOT-004` | `../`、absolute path、symlink escape | repository/generation外を拒否 |
| `CAND-NODEBOOT-005` | marker publish各barrierでcrash、二reader競合 | validated最高complete markerが指す旧または新generationだけを観測 |
| `CAND-NODEBOOT-006` | npm env identityだけを正規値へspoof | 実npm executable/version/digest不一致で拒否 |
| `CAND-NODEBOOT-007` | Node欠落・破損・version drift | Bun/bunx/tsx/TS/shell spawn 0 |
| `CAND-NODEBOOT-008` | Windows sealed invocation | `shell=false`、`windowsHide=true`、receipt内absolute executable/entrypointだけを使用 |
| `CAND-NODEBOOT-009` | version文字列が同じ別npm CLIへ差替え | reviewed provenanceのexpected npm CLI digest不一致で拒否 |
| `CAND-NODEBOOT-010` | POSIX marker各barrierのprocess crash | parent sync可能時に実施し、旧または新completeだけを観測 |
| `CAND-NODEBOOT-011` | Windows process crash / power lossを分離注入 | crashは旧/新complete、power loss後はcomplete 1件以上なら最大、0件ならfail-close |
| `CAND-NODEBOOT-012` | 二writerを逆順完了させるbarrier | global lease winnerだけN+1、loser retry 0、distinct sequence逆順0 |
| `CAND-NODEBOOT-013` | exact lockのowner欠落、PID終了、time経過後にrecovery/steal/clear/手動削除 | reader継続、publisher永久fail-close、F0回復API 0 |
| `CAND-NODEBOOT-014` | generation delete/GC APIを実装へ注入 | F0 deletion surface 0、全immutable generation保持 |
| `CAND-NODEBOOT-015` | cross-revisionを通常rollbackへ注入 | cross-revision API 0/fail-close、git revert新revision buildへroute |
| `CAND-NODEBOOT-016` | Windows receiptへpower-loss durable=trueを注入 | claim拒否、process-crash atomicityだけを記録 |
| `CAND-NODEBOOT-017` | candidate F0a commitにreview+admission済みD0 receiptなし | merge admission拒否+rejected receipt |
| `CAND-NODEBOOT-018` | candidate F0b commitにF0a custody receiptなし/失敗/別revision | merge admission拒否+rejected receipt |
| `CAND-NODEBOOT-019` | candidate F0c commitにF0b sealed build receiptなし/失敗/別revision | merge admission拒否+rejected receipt |
| `CAND-NODEBOOT-020` | candidate Q0 commitにF0c aggregate receiptなし/失敗/別revision | merge admission拒否+rejected receipt |
cutover unit pairはPLAN-L7-458 `CAND-CUTOVER-001..009`を正本とし、genesis、reducer、edge guard、
wrong evidence、replay、skip/reverse、digest mutation、projection直接更新、production activation admissionを
`tests/cutover-transition.test.ts`の正式ID family `U-CUTOVER-{001–009}`へ固定する。candidate段階では
正式oracleを宣言せず、各test実装とRed実測の同一commitで個別IDへ昇格する。review+admission済みD0 draft下の非activation
F0a/F0b/F0c build/verifyとQ0 fixture/detector workはslice FSM順序内で許可し、production activation、
hook/runtime switch、Bun final deletion、cutoverだけをL6 confirmed+D0 admissionまで禁止する。
`CAND-CUTOVER-003/005`は`CUTOVER-EVIDENCE-REGISTRY-v1`を唯一のoracleとし、F0a/F0b/F0c receiptの
各slice commit subjectをfixture化する。candidate HEADが全commitのdescendantなら受理し、stale/replay/
non-ancestorなら拒否する。同一subject fixtureを要求しない。transition receiptのsubjectはcandidate HEADと
exact一致し、producer receiptのcanonical set digestを封印する。
transition receiptの期待schemaは`schema_version, registry_id, transition_id, sequence, subject_revision,
previous_state, current_state, evidence_set_digest, review_digest, admission_digest,
previous_receipt_digest, receipt_digest`の12 fieldだけである。全edgeのreview/admission top-level digestと対応rowの
evidence receipt `receipt_digest`を同値検証し、別名fieldを拒否する。`CAND-CUTOVER-007`は
registry row順の固定tuple、UTF-8 canonical JSON、
decimal byte-length framing、SHA-256 lowercase hexについてWindows/POSIX相当入力の同値を確認し、
tuple mutation、順序mutation、duplicateを拒否する。`CAND-CUTOVER-009`はD0設計mergeとproduction cutoverを
別fixtureにする。前者はD0 review/admission欠落だけをmerge 0とし、PLAN-L6-93がdraftでもD0
review/admissionが揃えばmerge eligibilityを阻害しない。後者はsealed edgeの`PLAN-RECOVERY-16` /
`PLAN-L7-452`片方だけ、L6 confirmed欠落、fresh review bundle欠落、fresh CutoverAdmission欠落を
個別fixture化し、production/cutover 0を確認する。
`CAND-CUTOVER-003/005`はrevision ruleをdiscriminatorとしてproducer-ancestor/candidate-headのsubjectを
入れ替えたfixture、CutoverAdmissionのartifact digest mutation、genesisのQ0 predecessor欠落を拒否する。
全edgeでclaim-blind/spec-blind exact 2 lane PASSとartifact/revision一致を要求する。laneのprovider/model/
execution mode/runtime familyをdigestとattestationへ封印する。hybridはprovider/runtime/session/identity/author分離、
codex-only/claude-onlyは異model+session/identity/author分離を要求しruntime family一致を許す。
standaloneはAI/subagentを拒否し、distinct human 2名、provider human/model none/runtime human、独立session/evidenceを
positiveにする。人間1名、AI混入、同一identity/session/evidence及びIssue #153のlane減免を拒否する。
SliceEvidenceReceipt自体のversion/fixed tuple/two-stage digest/nested attestation mutationに加え、
outer lookupを`receipt_digest`へ固定し、
review/admission kindのtyped `referenced_receipt_digest`、generic kindのpayload digestをdiscriminateする。
pre-attestation 11-field tupleへkind別ref/payload object receipt、owner ID、既存attestation producer enumを封印し、
self-reference、wrong owner→producer mapping、kind別null/non-null反転を拒否する。
generic payloadはtyped `EvidencePayloadObject`をreceipt digestで取得し、bytes再hashと両payload digest一致を要求する。
kind/producer owner/attestation producer/payload schemaをclosed registryへexact照合し、cross-kind/cross-owner replayを拒否する。
decoded payloadはRFC 8785 canonical JSON→UTF-8→unpadded base64urlだけを許し、13 discriminatorのrequired
field/type/domain/semantic predicateを検証する。arbitrary bytes、padding、schema spoof、cross-semantic replayを拒否する。
outer/payload subject revisionはalgorithm prefix付きGitObjectIdでexact一致させ、SHA-1 40hexをpositive、
prefix/length/algorithm混同とrevision replayをnegativeにする。payload object/decoded/envelope schema version、
`payload_schema == schema_id`を検証する。F0c OS lane run差、Q0 expected/executed set差、aggregateの
failure/cancelled/skippedをtyped fieldsから再導出して拒否する。
`evidence_digest` / `object_digest` alias lookup、payload content digestによる取得を拒否する。CutoverAdmissionはvalidated Q0
SliceAdmissionとL6ConfirmationReceiptをdirect参照し、独自`issuer_key_id`を拒否する。attestationは
schemaVersion/algorithm/authorityId/keyVersion/signatureのnested exact shape、producer+recordDigestはverifier
inputとして検証する。flat field、schemaVersion/algorithm欠落、forged/unknown authority又はversionを拒否する。
SliceAdmission保存graphはpredecessor/required input refsとD0から既存ReviewBundleへのrefを必須とし、
Q0→F0c→F0b→F0a→D0 closure欠落を拒否する。

slice admission candidate `CAND-NODEBOOT-017..020`はD0→F0a→F0b→F0c→Q0をpairとし、各target sliceを
直前receiptなし/失敗/別revisionでmerge admissionしてapproved 0を確認する。edit-start自己gateではなく、
gate test/schema/kernelをproduct changeより先にTDDし、同じcandidate commitのacceptanceを検証する。
positiveはL5 registry順の全inputでdigestとapproved receiptを再現する。D0は2 lane ReviewBundle、PLAN-L4-33/
L5-26/L6-93/L7-458のAttestedTrackedReceiptRecord exact 4だけを要求する。canonical
tracked record全fieldとrecordDigest/attestation bindingを照合し、integrity-only、unsigned/self-hash、forged/untrusted、
欠落、重複、wrong plan、stale revision/head、content/path binding driftを個別negativeにする。F0a/F0b/F0c/Q0は
predecessorとowned evidenceのkind/count/producer/revision rule入替を拒否する。
`CAND-CUTOVER-009`はPLAN-L6-93 exact revision/status confirmed/content/head bindingのattested
L6ConfirmationReceiptをpositiveとし、draft/unconfirmed/wrong-plan/stale-head/unsigned/forgedを個別negativeにする。
AttestedTracked wrapperとL6Confirmationの全field順、record/receipt二段digest、nested attestation mutationを検証する。
ReviewBundle coreのexact 8 fields/self除外7-field ordered preimage、各coreを包むexact 7-field
`AttestedReceiptEnvelope`、ReviewBundle/lane/CutoverAdmission/actual admission execution modeのmixed/mismatchを拒否する。
SliceAdmission coreも同じenvelopeで検証しraw core保存を拒否する。ReviewBundle→lane、SliceEvidence→bundle、
D0→ReviewBundle、Q0 predecessorはouter envelope digestだけでlookupし、core digest/alias参照を拒否する。
SliceAdmission core/outer producer owner差、CutoverAdmission 5 authorityのwrong
EvidenceProducer又は`authority_id != attestation.authorityId`を各negative pairにする。
edge別allowed authority ID/keyVersion外と、別trusted CI authorityによる署名replayもnegative pairにする。
共通GitObjectIdを全subject/HEAD fieldへ適用しraw hash/algorithm mismatchを拒否する。tracked/L6/reviewの
unknown schema versionを棚卸しnegativeにする。Q0 CaseManifest subject/set/executed mismatchとaggregate profile required laneの
missing/extra/duplicate/set digest driftを個別negativeにする。
CaseManifestのUTF-8 code-point順違反、RFC8785 digest drift、source artifact digest drift、core/outer owner不一致、
non-ci mapping、同一subject異digest conflict、q0.authoring/runtime split manifest、typed ref missing/orphanを個別negativeにする。
wrong artifact path/ID、marker 0/2組、間のJSON 0/2個、duplicate/unknown field、subset omission/extra/order drift、
partial UNIQUE index conflict、updated 8-field core preimage mutationも個別negativeにする。
`evidence_type` NULL/unknown/typed union mismatch、CRLF、marker backtick欠落、前後空白、marker逆順、
JSON missing field、`edge_kind!='q0.case-manifest'`、`ordinal!=0`、edge 0/2件も個別negativeにする。
NULL receipt/ref digest、ReceiptDigestへの`sha256:`付加、ContentDigestのprefix欠落、手入力subject spoof、
generated subject不一致、migration copy/count/digest/swap/index失敗、`q0.runtime` typo、doc全体をartifact
preimageに使うmutationも個別negativeにする。
digest NULL/nonhex/prefix、empty chain ID、negative sequence、migration snapshot混在、自己review、
forged author、omitted writer/session、authorship ref欠測/複数を個別negativeにする。
authorship core preimage mutation、stale/cross candidate、base drift/range truncation、raw reviewer identity、
IdentityDigest collision attempt、session self-review、genesis NULL→NULL/seq0維持/seq2/非NULL→NULLを個別negativeにする。
path absolute/dot/dotdot/backslash/NUL/non-NFC/order/omission/digest mismatch、merge commit、session alias/provider
spoof、work-event wrapper owner mismatch、head/receipt sequence driftを個別negativeにする。
Candidate field/order/serialization、session receipt missing/orphan/owner、session envelope digest/identity alias、
tracked path除外、head digest/MAX row mismatchを個別negativeにする。
session core preimage、wrong provider/runtime/authority/key/algorithm、expired key、forgery、cross-provider replayを
個別negativeにし、managed verifier Greenとouter EvidenceAttestation Greenを別々に要求する。
wrong registry row/revision、issued_at期限外、wrong authority/key、forgery、provider binding、stable subject aliasを
個別negativeにする。combined payload field mutation、session exact count、outer/edge欠測、v1 ID/revision/window
mismatchを個別negativeにする。
ReviewLane exact 12/self除外11-field、SliceAdmission exact 8/self除外7-field orderをmutation pairにする。
evidence set tupleとduplicate keyは`producer_owner_id,attestation_producer`を使い、未定義`producer_id`を拒否する。
cutover 3 functionsは`src/schema/cutover-transition.ts`→`src/runtime/cutover-transition.ts`→
`tests/cutover-transition.test.ts`、`admitNodeSlice`は`src/schema/node-slice-admission.ts`→
`src/runtime/node-slice-admission.ts`→`tests/node-slice-admission.test.ts`へ固定する。

test名とPLAN traceは`tests/node-self-host-bootstrap.test.ts`へ固定する。正式IDは上記同commit昇格条件を
満たした`U-NODEBOOT-*`だけであり、別名・別IDで実装済みを主張しない。Resource Kernel / Rust
companionのunit oracleは本節に含めない。

## PLAN-L7-466 Resource Kernel native companion oracle (2026-07-22)

設計正本は`PLAN-L4-32`、ADR-009、実装PLANは`PLAN-L7-466`とする。ここでの静的oracleは
native custody完成の代替ではなく、Cargo実走前にもtoolchain・OS job・aggregateの縮退を検出する。

| ID | 観点 | fixture / mutation | expected |
| --- | --- | --- | --- |
| `U-RGK-NATIVE-001` | protocol scaffold | workspace/manifest/libを読取 | version 1のrequest/response DTOとJSON依存が存在 |
| `U-RGK-NATIVE-002` | unsupported fail-close | native API未実装adapter | capabilityを広告せず、managed workload生成前に拒否 |
| `U-RGK-NATIVE-003` | native CI custody | pin、Linux/Windows Cargo job、aggregate needs/resultを各欠落・Bunへ置換 | Rust `1.97.1`、両OSのfmt/clippy/test、review済みlockfile、4脚AND以外を拒否 |
| `U-RGK-NATIVE-004` | binary command admission | binaryへ空required capability、probe、token無しexecuteを投入 | probeはlauncher call 0、executeは`managed_root_created=false`で拒否。handshake成功をexecution successにしない |

`U-RGK-NATIVE-003`がGreenでもCargo compile/testの成功を意味しない。`Cargo.lock`正規生成後に
同一commitの実Linux/Windows jobをGreenにし、そのURLをL9 evidenceへ固定して初めてnative CI成立とする。

## PLAN-L6-92 Resource Kernel function contract oracle (2026-07-22)

| ID | fixture / mutation | expected |
|---|---|---|
| `U-RGK-WIRE-001` | valid frame round-trip property | decode(encode(x))がcanonical x、同一xは同一digest |
| `U-RGK-WIRE-002` | length 0/上限+1/partial/trailing | decoderはtyped `PreDispatchWireFault`、Node Kernel境界でexactly once `protocol_failure`。validated request ID前のwire response 0、launcher/custody side effect 0 |
| `U-RGK-WIRE-003` | invalid UTF-8/JSON、duplicate/unknown/missing field | 全変異を拒否、launcher call 0 |
| `U-RGK-WIRE-004` | unknown command/enum/version | fail-closeし既知値へ丸めない |
| `U-RGK-WIRE-005` | mutating request書込み前/途中/完了後・response前後でEOF | request decode前だけside effect 0 protocol failure。post-dispatchは`PostDispatchResponseFault→indeterminate`、fact確定前terminal seal 0 |
| `U-RGK-WIRE-010` | dispatch後responseのrequest ID/version/bundle digest mismatch | `PostDispatchResponseFault→indeterminate`として別requestへ合成せず、actual fact確定前terminal seal 0 |
| `U-RGK-WIRE-006` | protocol stdoutへlog混入 | trailing byteとして拒否、stderrだけdiagnostic許可 |
| `U-RGK-WIRE-007` | object key/order/number表現のproperty corpus | canonical encodeがlocale/order非依存 |
| `U-RGK-WIRE-008` | frame上限ちょうどと多byte UTF-8境界 | byte lengthを正しくprefixし切断しない |
| `U-RGK-WIRE-009` |同一DTOを反復encode | byte列・schema digestが決定論的一致 |
| `U-RGK-ERROR-001` | error kind×process phase全積 | 合法組合せだけconstruct可能、N/Aと欠測を区別 |
| `U-RGK-ERROR-002` | unknown native code/raw secret/path | closed failureへfail-closeし機密をredact |
| `U-RGK-ERROR-003` | NotCreatedへPID/started_atを注入 | phase contradictionを拒否 |
| `U-RGK-ERROR-004` | CreatedNotStartedでcleanup proof欠落 | terminal errorを構築しない |
| `U-RGK-ERROR-005` | Started budget errorでapplied/observed欠落 | 欠測を要求値で補完せず拒否 |
| `U-RGK-ERROR-006` | orphan factをprocess failureへ変換するmutation | `orphan_detected`を保持しsuccess 0 |
| `U-RGK-ERROR-007` | native error union exhaustive switchのvariant追加 | compile/runtime exhaustive guardがRed |
| `U-RGK-ERROR-008` | protocol/bundle/pre-root failureとcustody prepared後root未生成をreceiptへproject | RootNotCreatedへ各exit kindをlossless保存。prepared caseはcustody identity+empty/reap/release proof必須、root PID N/A |
| `U-RGK-ERROR-009` | suspended root作成後、start前にdeadline/cancel | RootCreatedNotStartedへ原因、terminate/reap、custody、root-absent proofを保存しstarted_at N/A |
| `U-RGK-CAP-001` | required capabilityを一つずつ欠落 | 各case managed workload生成前`capability_failure` |
| `U-RGK-CAP-002` | OS名一致だがprobe不足 | OS名推測せず拒否 |
| `U-RGK-CAP-003` | stale/別bundle probe | expected bundle digest不一致で拒否 |
| `U-RGK-CAP-004` | soft capabilityをhard requiredへ代用 | selection 0、missing集合をlossless保存 |
| `U-RGK-CAP-005` | verified control processからprobeをrecord | `control_process_created=true`とidentity、probe digestをappendしmanaged root 0 |
| `U-RGK-CAP-006` | unverified/stale control identityのprobe | journal delta 0、admission token生成0 |
| `U-RGK-CAP-007` | recorded probeとrequired集合完全一致、custody nonce未予約/予約済み | 未予約はtoken 0。予約済みはadmission chainへ束縛したcreate stage tokenを一つ生成 |
| `U-RGK-CAP-008` | 空required、probe欠測/差替え、期限切れ | token生成0、`managed_root_created=false` |
| `U-RGK-CAP-009` | token無し、またはtokenのattempt/nonce/bundle/probe/deadlineを各変異したExecuteの`create_custody | spawn_attached | resume` | 全variantを拒否しcustody/launcher call 0、別attemptへのside effect 0 |
| `U-RGK-CAP-010` | leaseのexecution/spec/bundle/attempt/custody/executor/boot/deadline/policy/issuer/authenticatorを各変異 | 全不正leaseでattach/resume 0。authentic cleanup leaseのterminate/prove-emptyはtoken期限後も可能 |
| `U-RGK-CAP-011` | canonical token field、issuer key/version、authenticator、operation、token nonceを各変異し、同nonce別payload/replayを投入 | 認証・nonce・payload変異はverify前side effect 0。4 digest全一致だけCAP-017のstate別retry reducerへ委譲し、別operation/new request replay 0 |
| `U-RGK-CAP-012` | issued/deadline/budget不一致、許容skew超過、wall前進/後退、process restart/boot ID変更 | effective monotonic deadlineは初回値から延長0。曖昧/boot変更はexpireしkill要求、managed root生成0 |
| `U-RGK-CAP-013` | create→spawn→resume正系列 | 3種類のtoken nonceとpredecessor fact digestが同じadmission chainで連鎖し、各一回消費 |
| `U-RGK-CAP-014` | create tokenをspawn/resumeへ流用、stage skip/reorder | decode又はdispatch前拒否、custody/root delta 0 |
| `U-RGK-CAP-015` | create fact未commitでspawn token発行 | token 0、launcher call 0 |
| `U-RGK-CAP-016` | attached/handoff fact未commitでresume token発行 | token 0、user instruction 0 |
| `U-RGK-CAP-017` | stage token消費transaction前後、pending、indeterminate、reconciled、result後に4 digestとactual phase/fact digestを各変異して再送 | 消費+pendingをatomic commitし全stateへrequest digest継承。reconciled後は全digest一致時だけnative再実行0でresult commit。pending/indeterminateのfact reconcile、side effect 0時継続、resultの同応答を許可し、変異/record欠測は拒否 |
| `U-RGK-CAP-018` | cancel/abort後又は別chainでcustody nonce再利用 | token/create 0、予約はtombstoneのまま |
| `U-RGK-LIFE-001` |合法遷移全辺 | sequenceを保ち唯一の次stateへreduce |
| `U-RGK-LIFE-002` | resume-before-attach/release-before-empty/root-exit terminal | 全不正遷移を拒否 |
| `U-RGK-LIFE-014` | prepared/attached_suspendedでfailure/deadline/cancel | terminating→empty_proven→releasedへ収束し、root未生成又はpre-start proofを保持 |
| `U-RGK-LIFE-003` | sequence gap/重複別payload/attempt・nonce不一致 | state delta 0、closed finding |
| `U-RGK-LIFE-004` | 同sequence同payload replay | 冪等に同state、event増殖0 |
| `U-RGK-LIFE-005` | terminate/cancel/deadline同時入力 | 最初のdurable causeを維持しemptyへ収束 |
| `U-RGK-LIFE-006` | terminal後fact | state/receipt delta 0、closed violation |
| `U-RGK-LIFE-007` | client再接続時の同一/別nonce | 同一だけreconcile、別attemptを操作しない |
| `U-RGK-LIFE-008` | running/terminating/empty_proven各stateでrelease_custody | running/terminatingは拒否しexecutor/authority維持。empty/reap fact commit後だけreleased |
| `U-RGK-LIFE-012` | lifecycle reducerへOS/journal side effect spy | pure reduction以外のcall 0 |
| `U-RGK-LIFE-009` | authority handoff commit前にresume/exec | illegal transition、managed user instruction 0 |
| `U-RGK-LIFE-010` | authority再起動後にold epoch/別nonce command | state delta 0、別attempt操作0 |
| `U-RGK-LIFE-011` | Linux authority+supervisor dual crash | broker外deadline ownerが期限内killを発行し、bounded recovery後にreap/orphan 0。ownerをarm不能なら開始前拒否し、欠測findingだけで代替しない |
| `U-RGK-LIFE-013` | native recovery observationとjournal/current epochの各bindingを変異しTS recoverAuthorityをCAS競合 | Rustはnative fact以外delta 0。TSだけがvalid一件をepoch+1 cleanup lease+3 trace eventへatomic commit、敗者delta 0、生成/resume 0 |
| `U-RGK-LIFE-015` | effective deadline/cancel/abort/normal-root-exit/terminate-intentとauthority modeのCAS競合 | winnerだけlive→cleanup_onlyと新nonce/authenticatorのcleanup leaseを同時commit。execution capabilityを不可逆除去し、敗者lease/live復帰0 |
| `U-RGK-LIFE-016` | effective deadline後の各operation | spawn/resume 0、observe/terminate/prove/releaseはauthentic cleanup leaseで有効 |
| `U-RGK-LIFE-017` | recovery deadline超過 | overdue findingとadmission遮断を出しつつterminate/prove/releaseを継続 |
| `U-RGK-LIFE-018` | same-boot native observationをTS recoverAuthorityでCAS競合 | winnerだけepoch+1 cleanup lease+trace、Rust CAS/lease/trace 0、生成/attach/resume能力0 |
| `U-RGK-LIFE-019` | cross-boot fence observationのCAS競合/replay→cross-boot empty proof | TS winnerだけepoch+1 boot-fenced lease+trace、Rust/敗者/replay delta 0。emptyを先取りせずleaseでempty/reap後release |
| `U-RGK-LIFE-020` | cross-boot observation欠測/不整合 | quarantine/admission block維持、lease 0 |
| `U-RGK-LIFE-021` | authority mode reducerへ全from/to直積 | 合法辺`live→cleanup_only`、`live→boot_fenced`、`cleanup_only→boot_fenced`、`cleanup_only→revoked`、`boot_fenced→revoked`だけを受理。`revoked→*`、`boot_fenced→live/cleanup_only`、`cleanup_only→live`、self/skipをstate delta 0で拒否 |
| `U-RGK-LIFE-022` | 正常root exit→descendant empty/reap→release | root exit時にcleanup leaseを発行し、root exit単独をterminalにせずempty/reap後だけrevoked/releasedへ到達 |
| `U-RGK-PORT-001` | Windows assign failure | resume 0、created-not-started cleanup proof必須 |
| `U-RGK-PORT-002` | Linux事後attach adapter | hard custody capabilityをadvertiseせずlaunch 0 |
| `U-RGK-PORT-003` | empty proof欠落mutation | success/receipt sealへ進まない |
| `U-RGK-PORT-004` | direct spawn/PID polling/soft fallback mutation | 全mutation survivor 0 |
| `U-RGK-PORT-005` | deadline超過を各OS call前後へ注入 | 超過後のlaunch/resume 0、既存custodyをcleanup |
| `U-RGK-PORT-006` | terminate→proveEmptyの呼出順を反転 | illegal transitionで拒否 |
| `U-RGK-PORT-007` | root exit後にdescendant残存 | empty proof false、return success 0 |
| `U-RGK-PORT-008` | Windows PID再利用fixture | Job identityで別processを誤killしない |
| `U-RGK-PORT-009` | Linux cgroup identity再作成fixture | nonce/cgroup identity不一致を拒否 |
| `U-RGK-PORT-010` | unsupported port | capability空、全launch/terminate call 0 |
| `U-RGK-PORT-011` | Probe commandへlauncher spyを注入 | launcher参照不能またはcall 0、probe factだけ返す |
| `U-RGK-PORT-012` | Execute commandへtoken無し/空required | `managed_root_created=false`、custody作成・launcher call 0 |
| `U-RGK-PORT-013` | control processだけ起動済みのphase/error全積 | control/workload identityを別保存し、単一`process_created`へ縮退しない |
| `U-RGK-PORT-014` | empty/reap fact commit前のrelease_custody | platform release call 0 |
| `U-RGK-PORT-015` | release→fact commit→disarm→revoke+released atomic commit→terminal sealの各barrierでcrash/reorder | disarmまでcleanup authority維持。journal済み段から再開し二重release・revoke後未完操作・早期seal 0。順序反転mutationはRed |
| `U-RGK-PORT-016` | active custody/pending response/未解決pending-dispatch/indeterminate/reconciled-without-result/未flush outboxありでshutdown_companion | control shutdown 0、custody delta 0 |
| `U-RGK-PORT-017` | 全custody released後のshutdown_companion | control processだけ終了、custody/authority delta 0 |
| `U-RGK-PORT-018` | release crash retryとraw OS identityの別custody_generation再利用を競合 | 同generationはensureAbsentでabsenceへ収束。別generationは削除0、identity_reused fact+quarantine。存在→不在effect最大1、Rust marker/DB 0 |
| `U-RGK-WIRE-011` | same-boot/cross-boot recovery observation discriminant混同 | decode拒否、Rust/TS epoch delta 0 |
| `U-RGK-WIRE-012` | boot-fenced leaseへspawn/resume/old-PID操作field注入 | strict decode拒否、native call 0 |
| `U-RGK-WIRE-013` | execution/cleanup/boot-fenced leaseの必須field欠落、別variant field、authority_mode差替え | canonical preimage生成/strict decode 0。各正規variantだけauthenticator検証へ到達 |
| `U-RGK-WIRE-014` | execution/cleanup/boot-fenced lease×全operation直積 | executionはspawn/resume、cleanupはobserve/terminate/prove/release、boot-fencedはobserve/prove/releaseだけ受理。特にboot-fenced terminate_treeと全variant外operationはnative call 0 |
| `U-RGK-WIRE-015` | token/3 lease/same・cross observationのexact fieldとsigner/verifier ownerを固定し全field mutation | Rust native signerはpinned bundle keyだけ、TS verifierはBundleTrustPort trust inputだけを使用。authenticator以外の変異、unknown/別bundle key、variant field混同をCAS前拒否 |
| `U-RGK-WIRE-016` | 同じinvalid framing/UTF-8/JSON/schema/trailing corpusをrequest decode前とmutating response decode後へ投入 | 前者だけPreDispatchWireFault+side effect 0。後者は全てPostDispatchResponseFault→indeterminate、terminal seal 0 |
| `U-RGK-BUNDLE-001` | digest/signature/schema/target/SBOMを各変異 | verified handleを生成しない |
| `U-RGK-BUNDLE-002` | runtime download/PATH探索/片側rollback mutation | 全てfail-close |
| `U-RGK-BUNDLE-003` | Rustへpolicy/journal/admission/receipt判断を追加 | responsibility-overlap findingでRed |
| `U-RGK-BUNDLE-007` | Rust portとTypeScript CustodyAuthorityPortへDB/CAS/lease/trace/native fact spyを注入 | Rustはstrict schema/authenticator/binding+native observation factだけでDB/CAS/journal/lease/trace call 0。TSはjournal/current epoch semantic照合→CAS→lease issue/reissue→trace appendを一transactionで1回 |
| `U-RGK-BUNDLE-004` | manifestのcompanion/protocol/D0-N generation receiptを一要素だけ旧値へ更新 | bundle identity不一致で拒否 |
| `U-RGK-BUNDLE-005` | 現在floorより厳密に大きいsequenceの新revisionとして再署名したrollback manifest | companion/protocol/D0-N receiptを同時pinし通常のtrust/target検証要求を出す。同sequenceは新規activation 0 |
| `U-RGK-BUNDLE-006` | Bun binary/API/lockfileを新bundleへ追加 | permanent-ban findingでRed |
| `U-RGK-TRUST-001` | bundle同梱key、未review signer、署名差替え | `BundleTrustPort`が拒否しverified handle 0 |
| `U-RGK-TRUST-002` | manifestのbundle revision/component digest/schema/targetを各置換 | binding不一致で拒否 |
| `U-RGK-TRUST-003` | floor未満の旧manifestを再activation | 署名が正しくても拒否しcurrent不変 |
| `U-RGK-TRUST-004` | `F-1`、`F+同digest`、`F+別digest`、`F+1 valid`を同じcurrent floorへ投入 | `F-1`はstale、等値同digestはreplay、等値別digestはequivocationとしてactivation/advance 0。`F+1`だけ通常検証後にatomic compare-and-advance候補 |
| `U-RGK-TRUST-005` | trust/activation portがmissing、unknown、failure | PATH探索、download、旧direct spawnへfallbackせず利用停止 |
| `U-RGK-TRUST-006` | D0実装へrotation、signed clock、re-anchor、物理activation logを直書き | deferred ownership違反としてRed |

mutation gateはdeadline再検査削除、strict unknown-field削除、attach前resume、empty/reap省略、Bun dependency追加もkillする。
このL7 pairをfreezeするまで実Job/cgroup adapterのimplementation Greenを宣言しない。
