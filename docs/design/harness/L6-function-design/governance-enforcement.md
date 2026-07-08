---
layer: L6
sub_doc: function-spec-addendum
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
parent_doc: docs/plans/PLAN-L6-09-governance-enforcement.md
plan: docs/plans/PLAN-L6-09-governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
created: 2026-06-04
---

# L6 機能設計 (addendum) — governance enforcement lints (A/B/C, IMP-064/065/051)

> **layer (作成層 = V-pair key)**: L6 (機能設計) / **pair**: L7-unit-test-design §1.12 (U-SCRUMREV / U-PROP / doctor-hard)
> **位置づけ**: plan lint engine (`src/plan/lint.ts` stub) の本実装を待たず、**今 session で2回再発した process 漏れ (IMP-064 PoC→Reverse 欠落 / IMP-065 L0→L3 伝播漏れ)** を CI で止めるための最小 enforcement。純関数 lint + 実 repo vitest ガードで「CI が回す vitest」ベクトルに乗せ fail-close 化する (新 hook 不要)。

## §1 対象と非対象

- **対象**: ① scrum-reverse lint (A、IMP-064) / ② backfill hard-fail の doctor.ok 連動 (B、IMP-051) / ③ propagation lint (C、IMP-065)。
- **非対象 (DEFER)**: plan lint engine 本体 (§1.10 全ルール) / vmodel-lint (layer pairing、state DB 依存) / cross-check engine 汎用形 (IMP-033) / kind×layer guard (§1.6 PO 確定待ち)。本 addendum は「安く今入る 3 本」に限定する。

## §2 関数仕様

### §2.1 scrum-reverse lint（検査） (`src/lint/scrum-reverse.ts`)

- `analyzeScrumReverse(plans): { pocOrphans, badReverseRefs, ok }`。
- **pocOrphans**: `kind=poc` ∧ `decision_outcome=confirmed` ∧ `promotion_strategy ∉ {redesign}` ∧ それを requires/references する `kind=reverse` PLAN が無い。→ §1.2「confirmed poc は reverse PLAN を起こす」違反 (IMP-064)。redesign は throwaway 再設計で Forward 再実装のため Reverse 不要 (concept §10.2、例 DISCOVERY-02)。
- **badReverseRefs**: `kind=reverse` が requires/references する poc が `decision_outcome≠confirmed` (rejected/pivot/未確定)。→ §1.2 line 139「rejected/pivot への接続は exit 1」。
- `ok = pocOrphans=0 ∧ badReverseRefs=0`。path 末尾一致は `/id.md` 境界固定 (別 id suffix 誤マッチ防止、backfill-pairing と同方針)。

### §2.2 backfill hard-fail の doctor.ok 連動 (B、`src/doctor/index.ts`)

- 既存 `analyzeBackfill.ok` (required orphan=0 ∧ glossary gap=0) は実装済だが doctor は `ok:true` 固定だった。
- `checkBackfillResult(repoRoot): { messages, ok }` を追加し `runDoctor.ok = backfill.ok ∧ scrumRev.ok ∧ propagation.ok` に連動。handover/agent-slots は warn-only (鮮度/運用 surface、ok を落とさない)。
- CI fail-close は既存 `tests/backfill-pairing.test.ts U-BACKFILL-006` (実 repo ガード) が担う。doctor.ok 連動は local `ut-tdd doctor` の parity。

### §2.3 propagation lint（検査） (`src/lint/propagation.ts`)

- `analyzePropagation(conceptText, requirementsText): { conceptOnly, requirementsOnly, ok }`。
- 両 doc の `| signal | mode |` ヘッダを持つ routing テーブル**だけ**から signal 列 token を抽出し集合一致を要求 (`extractSignals`)。他テーブル (decision_outcome/reverse_type/kind) は巻き込まない。interrupt 行は subtype 表記が非対称ゆえ除外。
- `ok = conceptOnly=0 ∧ requirementsOnly=0`。concept §2.6 (上位 narrative) ⇔ requirements §7.8.1 (機械 routing SSoT) の signal 語彙ドリフトを検出 (IMP-065)。

### §2.4 FR gate/review aliases（別名）

これらの alias は FR-L1-05 と FR-L1-17 を本 addendum に結び、FR coverage matrix が prose-only governance scope だけを指さないようにする。

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `evaluateGateReview` | evaluateGateReview(input: GateReviewInput, deps: GateReviewDeps) => GateReviewResult | gate id、execution mode、review kind、worker model、reviewer/checklist evidence を与える。 | mode ごとに有効な cross-agent、intra-runtime、human review evidence の場合だけ pass を返す。 | naive self-review と same-model approval は judgment-gate evidence として有効にしない。 | U-FR-L1-05 |
| `checkReviewEvidence` | checkReviewEvidence(input: ReviewEvidenceInput, deps: ReviewEvidenceDeps) => ReviewEvidenceResult | target PLAN frontmatter と current test/doctor evidence を与える。 | missing review evidence、invalid review tier、test-after-review ordering を violation として返す。 | confirmed/completed の design または implementation PLAN は review evidence を silent skip できない。 | U-FR-L1-17 |
| `analyzeRuleDrift` | analyzeRuleDrift(docs: RuleAdapterDocs) => RuleDriftResult | AGENTS / CLAUDE adapter docs を text として与える。 | old runtime command routing、env prefix、local state path、agent name について missing shared marker と forbidden legacy adapter marker を返す。 | marker parity が green のまま adapter docs が legacy runtime routing を再導入してはならない。 | U-RDRIFT-001..004 |

Type/pseudocode substance（型と擬似コードの実体）:

| 関数 | type body | pseudocode / implementation_state |
|---|---|---|
| `evaluateGateReview` | `GateReviewInput { gate_id; execution_mode; review_kind; worker_model; reviewer_model?; human_signoff?; checklist_evidence[] } -> GateReviewResult { ok; violations[]; accepted_tier }` | `src/gate/review-tier.ts` で実装。pseudocode = gate policy を load し、same-model self approval を reject し、required evidence がある場合だけ cross-agent/intra-runtime/human を accept する。 |
| `checkReviewEvidence` | `ReviewEvidenceInput { plan_path; frontmatter; tests_green_at?; reviewed_at?; doctor_ok? } -> ReviewEvidenceResult { ok; missing[]; stale_approval[]; ordering_violations[] }` | `src/lint/review-evidence.ts` で実装。pseudocode = PLAN review_evidence を parse し、confirmed/completed には reviewer/verdict を必須化し、draft approve residue と test-after-review ordering を reject する。 |

## §3 統合点

- `src/doctor/index.ts`: 3 lint を `runDoctor` に hard-fail 連動 (warn-only の handover/agent-slots と分離)。
- 各 lint に実 repo vitest ガード (U-SCRUMREV-005 / U-PROP-004 / 既存 U-BACKFILL-006) → CI (vitest) で fail-close。

## §4 fail-close 段階

- 本 addendum = **CI vitest ガード + doctor.ok hard-fail** の2点で fail-close。
- DEFER: pre-push hook / plan lint engine への統合 (§1.10 ルールと一括強制) は `src/plan/lint.ts` 本実装時。

## §6 用語更新

- **scrum-reverse lint**: PoC confirmed (redesign 除く) ⇔ Reverse 合流 / reverse→confirmed poc 参照の整合検査 (§1.2)。→ concept §10.3 へ back-merge。
- **propagation lint**: concept §2.6 ⇔ requirements §7.8.1 の signal 語彙一致検査 (L0⇔L3 伝播ドリフト検出)。→ concept §10.3 へ back-merge。

## §7 readability byte-integrity gate 追補 (PLAN-REVERSE-396 / PLAN-L7-395)

readability gate は、string-level mojibake marker denylist だけではなく、byte-level positive validation を持つ多層防御として扱う。これは PowerShell などの shell 表示化けそのものを判定するためではなく、repo 内のファイル実体へ破損 byte / BOM / escaped mojibake が混入した状態を fail-close するための設計である。

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `analyzeByteIntegrity` | `analyzeByteIntegrity(files: ReadabilityArtifact[]) -> ReadabilityResult` | loader は repo-relative path と raw bytes を渡す。 | UTF-8 BOM、UTF-16 LE/BE BOM、不正 UTF-8、NUL/C0/C1 制御文字、JSON escape 化された mojibake marker を violation として返す。 | byte 検査は `analyzeReadability` を置換しない。valid UTF-8 の double-encode mojibake は string-level denylist が引き続き捕捉する。 | U-READ-005..009 |
| `analyzeArtifacts` | `analyzeArtifacts(files: ReadabilityArtifact[]) -> ReadabilityResult` | artifact は single read から得た `bytes` と `text` を持つ。 | string-level readability と byte integrity の violations を統合し、doctor が読む単一 verdict を返す。 | decode 例外は per-file `invalid-utf8` violation に変換し、I/O fail-close と混同しない。 | U-READ-010 |

実装端点は `src/lint/readability.ts` に置く。`checkReadability` / `checkRuntimeReadability` は `analyzeArtifacts` を使い、`loadSystemReadabilityDocs` / `loadRuntimeArtifactReadabilityDocs` は `readFileSync(path)` の single read から `bytes` と UTF-8 text を同時に構築する。repo 標準は UTF-8 no-BOM とし、BOM cleanup 後は BOM 再混入も readability gate の red 条件になる。

## §8 write encoding guard 追補 (PLAN-L7-317)

PowerShell `Get-Content` / `Set-Content` / `Out-File` の既定 encoding 差分による事故は、表示化けと実ファイル破損を分けて扱う。repo の正本判定は常に byte を UTF-8 no-BOM として検査し、shell 表示だけの mojibake は破損とみなさない。一方で `PostToolUse` 後に書き込まれた text artifact が UTF-16/BOM/invalid UTF-8/CP932 mojibake marker を持つ場合は、doctor を待たず即時に警告して `.ut-tdd/logs/encoding-violations.jsonl` に記録する。

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `collectWriteEncodingGuardTargets` | `collectWriteEncodingGuardTargets(input, repoRoot, changedFiles?) -> string[]` | `PostToolUse` payload と任意の git changed file list を渡す。 | `file_path` / `path` / `apply_patch` header 由来の text path、または shell tool 時の changed file fallback を返す。 | binary / vendor / node_modules は対象外。明示 target がある場合は shell fallback に広げない。 | U-WENC-001 / U-WENC-003 / U-WENC-004 |
| `runWriteEncodingGuard` | `runWriteEncodingGuard(input, deps) -> WriteEncodingGuardResult` | `repoRoot` は作業 repo。検査は advisory である。 | 対象 artifact を single read し、`analyzeArtifacts` を再利用して違反 message と jsonl 証跡を出す。 | 検出ロジックは readability gate と同じ `src/lint` 境界で共有し、hook は exit 0 の fail-open を維持する。 | U-WENC-001..004 |

`hook post-tool-use` は既存 session-log 記録の後に `runWriteEncodingGuard` を呼ぶ。`Write` / `Edit` / `MultiEdit` / `apply_patch` / `write_file` は明示 target だけを検査する。`Bash` / `exec_command` / `local_shell` は tool payload から書込先を決定できないため、`git status --porcelain` の changed file list を fallback target とする。完全性は doctor/CI の `readability` / `runtime-readability` が引き続き担保し、PostToolUse guard は事故の早期発見と連鎖防止を担う。
