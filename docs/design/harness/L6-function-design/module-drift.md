---
layer: L6
artifact_type: design_doc
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-06-08
plan: docs/plans/PLAN-L6-15-module-drift.md
---

> **L6 contract marker**: `parseListedModules`, `scanActualModules`, `analyzeModuleDrift`, `loadModuleDocs`, and `moduleDriftMessages` are the unit-test-granularity contracts. DbC pre/post is in §2-§3. L7 oracle family: U-MDRIFT-001..005.

# module-drift lint — 機能設計 (① / PLAN-L6-15、IMP-075)

> **V-pair**: `pair_artifact = L7-unit-test-design.md §1.16` (L6↔L7)。DbC 契約から単体テスト oracle (U-MDRIFT-*) を導出。

## §0 スコープ

**「architecture §3.1 building block 集合 ⊇ `src/` 実在 module」の包含 drift を機械検査** (IMP-075)。

背景: A-103 (L4 見直し) で handover/setup/web/lint が「実装済かつ設計 doc が将来扱い」の back-fill 漏れ (= harness 自身が [[feedback_impl_must_backfill_to_design]] を L4 で破った) を **手動監査**で発見した。柱 2「doc×機械厳格化」「柱 3 自動化で state 管理」に照らすと、impl→design back-fill 漏れ (meta-drift) を手動 audit に頼るのは under-design。本設計は **`src/` 実在 module がすべて architecture §3.1 に列挙されているか** (actual ⊆ listed) を doctor が surface する純関数 lint を定義する (既定 warn-first、実 repo 孤児0 安定後に hard 化検討)。

**スコープ外**:
- **逆向き (listed ⊋ actual = 将来 module)**: 設計が web/roster/skills 等を「将来」列挙し src 未実在は drift ではない (宣言済 carry)。検査しない。
- **asset-drift (roster/skills の内容整合)**: IMP-033 rule engine 待ち (architecture §4.1、carry PLAN-L4-13/L5-07)。本 lint と別検査。
- **import グラフ drift (循環/逆依存)**: ADR-002/IMP-032 (knip/madge) の別 PLAN。本 lint は module **集合の包含**のみ。

## §1 入力 (設計 listed / 実在 actual)

- **listed**: `docs/design/harness/L4-basic-design/architecture.md` の §3.1 表 1 列目 `**name**` building block 名。
- **actual**: `src/` top-level の **dir 名** + **top-level `*.ts` の basename** (`cli.ts` → `cli`)。

## §2 純関数 (parse / analyze)

```text
parseListedModules(architectureText: string) -> string[]
scanActualModules(srcDir: string) -> string[]
analyzeModuleDrift(docs: { listed, actual }) -> { orphans, listedCount, actualCount, ok }
```

- **parseListedModules**:
  - **Precondition**: architecture.md 全文。
  - **対象切り出し**: `§3.1` 見出し〜次見出し (`§3.2` 等) に限定 (§3.2 代表 module の太字を巻き込まない、過検知回避)。
  - **抽出**: 表行 1 列目 `^\|\s*\*\*([a-z][a-z0-9_-]*)\*\*` のみ。重複排除。
  - **Postcondition**: §3.1 不在 → `[]` (パース失敗を空虚 ok にしない、§3 で listedCount 0 検出可)。
- **scanActualModules**:
  - dir + top-level `*.ts` を module 名に正規化、sort + 重複排除。
- **analyzeModuleDrift**:
  - **Postcondition**: `orphans = actual \ listed` (実在だが未列挙)。`ok = orphans.length===0`。`listedCount/actualCount` は非空虚ガード用。

## §3 I/O loader + messages

- `loadModuleDocs(repoRoot)`: architecture.md を読み `parseListedModules`、`src/` を `scanActualModules` → `{ listed, actual }`。
- `moduleDriftMessages(result)`: orphan 0 → `"OK (… 孤児 0)"` / orphan あり → 件数 + module 列 + 「設計 doc へ back-fill (impl→design)」+ `[[feedback_impl_must_backfill_to_design]]`。

### §3.1 FR asset-drift alias

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `analyzeAssetDrift` | analyzeAssetDrift(input: AssetDriftInput, deps: AssetDriftDeps) => AssetDriftResult | enrolled agent/skill/command docs and allowed source roots are supplied. | returns HELIX path residue, empty docs-skills, roster/guard drift, and unresolved asset references as violations. | asset-drift is separate from module-drift but feeds the same finding/back-fill feedback loop; prompt bodies and secrets are not persisted. | U-FR-L1-49 |
| `analyzeChangeImpact` | analyzeChangeImpact(input: ChangeImpactInput) => ChangeImpactResult | current change set file paths are supplied. | returns `missingDesign` or `missingTest` when any `src/**` change lacks a design PLAN/doc update or test/test-design update in the same change set. | source changes cannot silently bypass design back-fill or test evidence; documentation-only changes do not require source tests. | U-CHGIMPACT-001..004 |
| `analyzeCodingRules` | analyzeCodingRules(docs: CodingRulesDoc[], policy?: CodingRulesPolicy, workflowDocs?: CodingWorkflowDoc[]) => CodingRulesResult | TypeScript source/test docs, coding-rule SSoT, and workflow placement docs are supplied. | returns violations for explicit `any`, TS/lint suppression comments, TS file names outside kebab-case / kebab-case `.test.ts` / `index.ts`, source functions with more than 3 parameters, empty/rethrow-only catch blocks, module-boundary drift, SSoT policy drift, and missing workflow anchors. | coding rules are requirements-level SSoT and workflow artifact; tests keep no-any/suppression/naming checks, while max-params / structured-error / module-boundary apply to `src/**` only. | U-CODE-001..009 |
| `analyzeDddTddRules` | analyzeDddTddRules(input: DddTddInputs) => DddTddResult | DDD/TDD rule SSoT, workflow docs, source/test docs, PLAN docs, and L7/L8 test-design docs are supplied. | returns violations for policy drift, workflow anchor drift, domain-boundary imports, invariant oracle gaps, missing Red-first evidence, weak test oracles, and missing integration GWT. | quantitative checks are separated from qualitative review, but freeze-significant points require both test evidence and reviewer evidence. | U-DDDTDD-001..008 / U-FR-L1-50 |

### Coding Rules Addendum

- **coding-rules**: requirements `Coding Rules SSoT` から `src/lint/coding-rules.ts` へ落とす TS core 規約。explicit `any`、TS/lint suppression comment、TS file-name drift、source max-params drift は doctor hard failure。
- **workflow placement**: Forward L6 and Add-feature `add-design` must confirm or update `docs/governance/coding-rules.md` before implementation freeze. The workflow docs carry `CODING-RULE-WORKFLOW` anchors so this is machine-auditable.
- **doctor contract**: `checkCodingRules(repoRoot)` loads `docs/governance/coding-rules.md`, `docs/process/forward/L00-L06-design-phase.md`, `docs/process/modes/add-feature.md`, `docs/process/modes/README.md`, `src/**/*.ts`, and `tests/**/*.ts`; it runs `analyzeCodingRules` and links `ok` to `runDoctor.ok`.
- **error handling**: fail-open is allowed only when a catch block returns/records explicit failure state or documents fail-open intent in-place. Undocumented empty and rethrow-only catch blocks are `structured-error-handling` violations.
- **module boundary**: `lint` must not import runtime/doctor/CLI feature modules, `runtime` must not import governance checks, and `schema` must stay below feature modules. Violations are `module-boundary`.
- **scope split**: no-any / no-suppression / file naming apply to source and tests. max-params / structured-error-handling / module-boundary apply only to `src/**`; test helper arity is governed by readability and local test design.

### DDD/TDD Strictness Addendum (FR-L1-50)

- **DDD/TDD rule SSoT**: `docs/governance/ddd-tdd-rules.md` defines rule IDs for `domain-boundary`, `invariant-test-trace`, `red-first-evidence`, `test-oracle-strength`, and `integration-gwt`.
- **workflow placement**: Forward L6, Add-feature, and mode index docs carry `DDD-TDD-WORKFLOW` anchors so rule placement is not left to reviewer memory.
- **quantitative/qualitative split**: `analyzeDddTddRules` provides mechanical evidence before review; gate-significant DDD/TDD decisions still require reviewer evidence, so the two are bundled for freeze readiness rather than collapsed into one signal.
- **doctor contract**: `checkDddTddRules(repoRoot)` loads the SSoT, workflow docs, PLAN docs, L7/L8 test-design docs, and TS source/test files; `runDoctor.ok` fails when DDD/TDD strictness violations exist.

## §4 doctor 配線 (warn-first)

`checkModuleDrift(repoRoot)` を `runDoctor` に **warn-first** (ok 非連動、`messages` のみ) で配線。I/O 失敗は note で skip (doctor 堅牢性、ok=true で fail-open)。pair-freeze と同じ warn-first 群。**hard 化は実 repo 孤児0 安定 + 設計合意後** (backfill/review-evidence と同じ昇格パス)。

## §5 段階導入 / hard 化判断

- **warn-first (初期投入)**: A-103 back-fill 直後で実 repo は既に孤児0 (handover/setup/web 列挙済)。warn-first でも CI 回帰網 (U-MDRIFT-005 = 実 repo 孤児0 を vitest fail-close) は即 fail-close で効く。doctor.ok 連動 (hard) 化は、新規 module 追加運用で誤検知 0 を確認後に検討。

## §6 用語更新

- **module-drift**: architecture §3.1 設計 module 集合 ⊇ `src/` 実在 module の包含 drift (impl→design back-fill 漏れ)。asset-drift (内容整合) / dependency-drift (import グラフ) と別検査。
- **change-impact**: `src/**` の差分に対し、同一 change set 内の design PLAN/doc 更新と tests または test-design 更新を要求する修正漏れ検出。semantic な「変更不要」判断は将来の relation-graph/dependency-drift に委ねるが、コード変更が設計・テスト更新なしで通過する穴は doctor で塞ぐ。

## §7 carry

- **hard 化** (warn-first → doctor.ok 連動): 実 repo 孤児0 安定後に検討 (§5)。
- **粒度の深化**: 現状 top-level module 集合のみ。Level 2 (代表 module 内部ファイル) 粒度の drift は対象外 (§3.2 は人手)。
- **asset-drift**: `analyzeAssetDrift` (FR-L1-49) は §3.1 alias で契約済みだが、roster/skill/command docs の内容整合・HELIX path residue・empty docs-skills 検出は L7 実装 carry。module-drift とは別 rule として登録し、同じ finding/back-fill feedback loop に接続する。
