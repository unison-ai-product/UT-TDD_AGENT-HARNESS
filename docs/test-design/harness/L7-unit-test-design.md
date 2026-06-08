---
layer: L6
executed_at_layer: L7
artifact_type: test_design
status: draft
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

# UT-TDD Agent Harness — L7 単体テスト設計 (④ / U-*)

> **layer (作成層 = V-pair key)**: L6 (機能設計) / **executed_at_layer (実施層)**: L7 (単体テスト — 実装スプリント内で TDD Red 先行) / **artifact**: ④ テスト設計 (V-model 右、② L6 機能設計 と対)
> **pair (V-model L6↔L7)**: `docs/design/harness/L6-function-design/{function-spec,edge-case}.md` 2 sub-doc ↔ 本書 1 doc
> **status**: draft (placeholder skeleton — L6 機能設計確定に伴い pair を物質化。U-* 詳細は L7 entry (TDD Red) で展開)
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
| U-FUNC-04 | `lintPlan`/`lintVmodel` 本実装 | frontmatter validate / 12 edge (stub→本、L7.2/L7.3) |

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
| U-SLOG-003 | `compressPlanDigest` | events→digest 集計正当 / 同一 (plan,session) 再適用で **idempotent** (session-guard で二重計上なし) / `prev` マージ / `updated_at = max(prev, events)` 巻き戻りなし / `failures` は ts dedupe |
| U-SLOG-004 | `onStop` | session 終了で `.ut-tdd/logs/plan/<plan_id>.digest.json` が生成/更新、常に 0 / **plan_id=null のみの session は digest を書かない** |
| U-SLOG-005 | `onSessionStart` | session_start event を append し常に 0 (fail-open)、I/O 失敗でも throw しない |
| U-SLOG-006 | `setActivePlan`/`activePlanUpdatedAt`/`activePlanStale`/`onPostToolUse` (IMP-078 gap②③) | setActivePlan が current-plan 2 行目に updated_at を刻む (1 行目=plan_id 不変、resolveActivePlan は 1 行目読取) / activePlanStale が maxHours 超で true・旧形式 (timestamp 無し 1 行) は false (後方互換) / onPostToolUse の git commit が `headCommit` hash を commit event target に載せる (未供給は target 無し=旧挙動) |

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

### §1.9 U-SLOT (agent-slots 由来、PLAN-L7-08 / IMP-050)

| U-ID | 関数 | oracle |
|------|------|--------|
| U-SLOT-001 | `loadSlots` | 不在 → `[]` / 壊れ JSON → `[]` / 非配列 (`{}` 等) → `[]` / **never throw** |
| U-SLOT-002 | `fireSlot` / `releaseSlot` | `fireSlot`: running slot を追記し永続化、返り値 `status="running"` / `released_at=null` / `role` 省略 → `null`。`releaseSlot`: terminal status + `released_at` 記録 + `exit_code` 記録 / 返り `true`。対象なし → `false` / 既 release 済 (2 回目) → `false` (idempotent) |
| U-SLOT-003 | `listActiveSlots` / `listStaleSlots` | `listActiveSlots`: `status==="running" && released_at===null` のみ返す。`listStaleSlots(deps, 5)`: active かつ `(now - fired_at) / 60000 > 5` のみ / **`>` 判定: ちょうど 5 分は stale でない** / 閾値内の fresh slot は含まない |
| U-SLOT-004 | `peakParallel` | 時間的に重なる 3 slot → peak `3` / 直列 (非重なり) → peak `1` / `released_at=null` (実行中) → peak に算入 (2 slot 両方 null → `2`) |
| U-SLOT-005 | `exceedsParallelLimit` | active < `DEFAULT_MAX_PARALLEL` → `false` / active `=== DEFAULT_MAX_PARALLEL` → `true` (`>=` 判定) / `max` override: `exceedsParallelLimit(deps, 100)` で `false` |
| U-SLOT-006 | `recordGuardFire` | active が `max-1` の時点では `exceeded=false` / 次の fire で active `=== max` → `exceeded=true` / **stale な `agent_guard` slot は `cancelled` に自動失効し active から外れる** (stale 持続汚染防止) / stale 失効後の `activeCount` は失効前より小さい |

### §1.10 U-TEAM (team schema 由来、PLAN-L7-08 / IMP-050)

| U-ID | 関数 | oracle |
|------|------|--------|
| U-TEAM-001 | `teamDefinitionSchema` | `strategy` 省略 → `"sequential"` (default) / `max_parallel` 省略 → `8` (default) / `members` 空配列 → zod throw (reject) / 不正 `role` (許可リスト外) → throw / 不正 `strategy` (`"burst"` 等) → throw / `serialize_after` + `serialization` (3 条件フィールド) を含む入力 → 受理 (`parsed.serialization.downstream_dependency===true` / `parsed.members[1].serialize_after==="se"`) |
| U-TEAM-002 | `mustSerialize` | 3 条件すべて `false` → `false` / `file_conflict=true` → `true` / `downstream_dependency=true` → `true` / `shared_state=true` → `true` / `undefined` → `false` |

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

### §1.18 U-GCONF (gate-confirm coupling lint、PLAN-L7-18 / IMP-079)

> ペア = `gate-confirm.md`。gate-design §2 台帳と design/test-design doc `status: confirmed` の coupling を検査する。初期配線は warn-first。

| Test ID | 対象 | 期待 |
|---|---|---|
| U-GCONF-001 | `parseGateStatuses` | gate table から G/L/status/PASS を抽出 |
| U-GCONF-002 | `layerToGate` | `L5 -> G5`、非 layer は null |
| U-GCONF-003 | `analyzeGateConfirm` | gate park の layer に confirmed doc → violation |
| U-GCONF-004 | `analyzeGateConfirm` | gate PASS の layer に confirmed doc → ok |
| U-GCONF-005 | `analyzeGateConfirm` | gate table parse 失敗 → skip/fail-open |
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

### §1.17 U-XRUNTIME (provider handover / gate review-tier / team run / adapter, 2026-06-08)

> ペア = L4 function §3.6 / external-if §6 / requirements §7.1・§7.8.7。前回 review 残課題 (provider handover 未実装、`ut-tdd codex|claude|team|gate` surface 欠落、single-runtime checklist 未強制、hybrid 分散未検証) を機械保証する。

| U-ID | 対象関数 | DbC oracle |
|---|---|---|
| U-PHOVER-001 | `buildProviderHandover` | Claude↔Codex の from/to が異なる package を生成 / active_plan・summary 必須 / secret 風 token は sanitize |
| U-PHOVER-002 | `runProviderHandover` | `.ut-tdd/handover/provider/<id>.json` + `CURRENT.json` を書く / dry-run は非書込 |
| U-GATE-001 | `evaluateGateReview` (hybrid) | judgment gate は `review_kind=cross_agent` + workerModel≠reviewerModel で pass / 同一 model は fail |
| U-GATE-002 | `evaluateGateReview` (single runtime) | claude-only/codex-only は checklist 必須、欠落・fail・根拠なし n-a で fail、揃えば `cross_agent_review=unavailable` |
| U-GATE-003 | `evaluateGateReview` parity | 同一 checklist で claude-only/codex-only の passed・review_kind・message が一致 |
| U-TEAMRUN-001 | `validateTeamRun` | hybrid 以外は fail / hybrid で worker(se) と reviewer(tl/qa) が別 provider なら pass |
| U-TEAMRUN-002 | `validateTeamRun` | 同一 role/provider 重複、worker/reviewer 同一 provider は fail |
| U-ADAPTER-001 | `buildAdapterPlan` | `ut-tdd codex` / `ut-tdd claude` dry-run command plan を mode に基づき available 判定 |

## §2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)

- function-spec §1 関数 → U-FUNC-01〜04
- function-spec §2 pseudocode → U-CORE-01〜04
- function-spec §4 rule engine → U-RULE-01〜03
- edge-case 4 観点 → U-EDGE-01〜03
- **session-log.md §3 関数 (resolveActivePlan/recordEvent/compressPlanDigest/onStop/onSessionStart) → U-SLOG-001〜005** (add-feature 差分、PLAN-L6-03。孤児 0)
- **forced-stop-feedback.md §2.3 関数 (detectDanglingTurn/recordForcedStop/classifyFeedback/recordFeedback/pendingRecoveryProposals/scanDanglingStops/emitClassifyRequest) → U-FSF-001〜007** (add-feature 差分、PLAN-L6-04。孤児 0)
- **setup-solo-team.md §2.3 契約関数 7 本 (detectProjectScale/recommendPhase/planSetup/emitSetup/recordSetupState/applyBranchProtection/runSetup) → U-SETUP-001〜007** (add-feature 差分、PLAN-L6-05。renderArtifacts は emitSetup 内部 helper = U-SETUP-004 に内包。孤児 0)
- **handover-mechanism.md §2.3 関数 (resolveHandoverScope/buildPointer/scaffoldFromDigests/renderHandoverScaffold/handoverStale/writePointer/setActivePlan/inferPlanFromCommit/runHandover) → U-HOVER-001〜007** (add-feature 差分、PLAN-L6-06。writePointer は U-HOVER-007 orchestration 経路で被覆。session-log への限定 amendment = setActivePlan/inferPlanFromCommit 配線は U-HOVER-006 で被覆。孤児 0)
- **handover IMP-048/047 差分 (sameFamilyPlan/dedupeDigests/resolveHandoverScope scopeToActive/readPointer/checkHandoverDiscipline) → U-HOVER-008〜010** (IMP-048 dedup + scopeToActive、IMP-047 readPointer/discipline。孤児 0)
- **handover IMP-078 品質増分 (checkHandoverBypass/countHandoverEntries/resolveHandoverScope scopeToSession/latestSessionId/readPlanMeta family 解決/活性化 activePlanStale 連動) → U-HOVER-011〜012 + U-SLOG-006** (gap① bypass / gap② stale / gap③ commit hash / gap④ session-scope / gap⑤ unknown-kind。PLAN-L6-16/L7-17。readPlanMeta は U-HOVER-012 runHandover 経路に内包。孤児 0)
- **agent-slots.md §2.3 関数 (loadSlots/fireSlot/releaseSlot/listActiveSlots/listStaleSlots/peakParallel/exceedsParallelLimit/recordGuardFire) → U-SLOT-001〜006** (add-feature 差分、IMP-050。nodeAgentSlotsDeps は実 I/O deps で unit では mock 代替。孤児 0)
- **module-drift.md §2-§3 関数 (parseListedModules/scanActualModules/analyzeModuleDrift/loadModuleDocs/moduleDriftMessages) → U-MDRIFT-001〜005** (add-feature 差分、PLAN-L7-16/IMP-075。moduleDriftMessages は U-MDRIFT-003/004 経路 + 専用 assert で被覆、loadModuleDocs は U-MDRIFT-005 実 repo ガードに内包。孤児 0)
- **team.ts §2.2 schema / 関数 (teamDefinitionSchema/mustSerialize) → U-TEAM-001〜002** (add-feature 差分、IMP-050。孤児 0)
- **backfill-pairing.md §2.3 関数 (parseRequires/parseGlossaryTerms/normalizeTerm/parsePlan/analyzeBackfill/loadBackfillDocs/backfillMessages/checkBackfill) → U-BACKFILL-001〜006** (add-feature 差分、IMP-051。normalizeTerm は parseGlossaryTerms/analyzeBackfill の内部パス経由で被覆。checkBackfill は doctor/index.ts の try-catch ラッパーで U-BACKFILL-006 実 repo ガードに内包。孤児 0)
- **vmodel-pair-freeze.md §1-§3 関数 (loadPairDocs/analyzePairFreeze/pairFreezeMessages/lintVmodel) → U-VPAIR-001〜006** (add-feature 差分、PLAN-L7-11/IMP-067。lintVmodel は loadPairDocs→analyzePairFreeze→pairFreezeMessages の orchestration で U-VPAIR-005 実 repo ガードに内包。孤児 0)
- **vmodel-pair-freeze.md §7 関数 (analyzeVerificationGroups/verificationGroupMessages、loadPairDocs status 拡張) → U-VTRIG-001〜005** (add-feature 差分、PLAN-L7-12/IMP-068。doctor checkVerificationGroups は U-VTRIG-005 実 repo ガードに内包。孤児 0)
- **review-evidence.md §2-§4 関数 (hasReviewEvidence/parseReviewPlan/analyzeReviewEvidence/loadReviewPlans/reviewEvidenceMessages、schema review_evidence、doctor checkReviewEvidence) → U-REVIEW-001〜006** (add-feature 差分、PLAN-L7-13/IMP-071。reviewEvidenceMessages は U-REVIEW-003/006 経路で被覆、checkReviewEvidence は doctor try-catch ラッパーで U-REVIEW-006 実 repo ガードに内包。孤児 0)
- **cross-review-enforcement.md §1-§2 関数 (extractReviewEntries/analyzeReviewEvidence の crossReviewViolations、schema worker_model/reviewer_model) → U-XREVIEW-001〜005** (add-feature 差分、PLAN-L7-14/IMP-076。doctor 連動は U-REVIEW-006 実 repo ガードの crossReviewViolations==[] に内包。孤児 0)
- **test-before-review.md §2-§3 関数 (analyzeReviewEvidence の testBeforeReviewViolations、schema tests_green_at、reviewed_at/tests_green_at 抽出) → U-TORDER-001〜005** (add-feature 差分、PLAN-L7-15/IMP-077。doctor 連動は U-REVIEW-006 実 repo ガードの testBeforeReviewViolations==[] に内包。全駆動モデル普遍。孤児 0)
- **provider-handover.ts / gate/review-tier.ts / team/run.ts / runtime/adapter.ts → U-PHOVER-001〜002 / U-GATE-001〜003 / U-TEAMRUN-001〜002 / U-ADAPTER-001** (review 残課題解消差分、2026-06-08。provider handover package、mode-aware judgment gate、hybrid team 分散、runtime adapter dry-run surface。孤児 0)
- **孤児 (設計で U 未被覆) = 0** を L7 entry で機械確認

## §3 trace (④ → ②)

本書の各 U-* は `docs/design/harness/L6-function-design/` の 2 sub-doc (signature/DbC/edge) と相互 reference。**G6 (機能設計凍結)** で 2 sub-doc ⇔ 本書 1 doc の pair 宣言を確定し、L7 entry (TDD Red) で先行 ④ テストコードに変換 (§1.10 line 671)。双方向 trace freeze は G7 で実施。

## §4 carry / 次工程

- **L7 entry (TDD Red)**: 全 U-* を vitest 単体テストに先行変換 (FR-02、Red 先行、未実装理由のみで fail 可)
- **L7 実装**: function-spec WBS (§5) の Sprint L7.1〜L7.7 を Red→Green→3点R で実装。DbC docstring (`@edge-*`) を実関数へ転記
- **G7 trace freeze**: 4 artifact 双方向 12 edge 凍結時に本書 U ↔ L6 設計の trace 確定

### 2026-06-08 Residual Review Closure Test Addendum

- U-GATE-004: `evaluateGateReview` rejects `self_review` / `self-review` / `naive_self_review` as judgment-gate evidence in hybrid, single-runtime, and standalone modes.
- U-RDRIFT-001: `analyzeRuleDrift` passes when AGENTS / CLAUDE adapter docs share required command and mode markers.
- U-RDRIFT-002: `analyzeRuleDrift` reports missing adapter markers with file and marker identity.
- U-RDRIFT-003: real repo AGENTS / CLAUDE adapter docs have no required marker drift.
