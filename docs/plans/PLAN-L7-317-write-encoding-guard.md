---
plan_id: PLAN-L7-317-write-encoding-guard
title: "PLAN-L7-317 (impl): write encoding guard — 書き込み直後の UTF-8 検査を PostToolUse hook で即時化"
kind: add-impl
layer: L7
drive: agent
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-03
updated: 2026-07-08
owner: PM / PO
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T22:24:10+09:00"
    tests_green_at: "2026-07-08T22:24:10+09:00"
    verdict: approve
    scope: "PLAN-L7-317 write encoding guard。PostToolUse 直後に UTF-8 no-BOM / readability marker 違反を検出し、PowerShell 書き込み事故の連鎖を防ぐ advisory guard を追加。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\write-encoding-guard.test.ts tests\\readability.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T22:24:10+09:00"
        evidence_path: tests/write-encoding-guard.test.ts
        output_digest: "sha256:80188b5e3b1add41411d19ab6d1f8d68542f8d89e914f4b2a4a8748767fe0162"
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T22:24:10+09:00"
        evidence_path: src/lint/write-encoding-guard.ts
        output_digest: "sha256:5e26ec8de782c7d97f4ba53797b85f302ffaa9387a3b09baf3fea479d698746b"
      - kind: lint
        command: "bunx biome check src\\lint\\write-encoding-guard.ts src\\cli.ts tests\\write-encoding-guard.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T22:24:10+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:da638ed7304d97576766a006f387cfdcd4f72e3d07500705d9942158d819b524"
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期"
  - role: tl
    slot_label: "TL - 検査対象 (テキスト系拡張子) と fail 時挙動のレビュー"
  - role: se
    slot_label: "SE - post-tool-use hook への encoding 検査追加"
generates:
  - artifact_path: docs/plans/PLAN-L7-317-write-encoding-guard.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-317-write-encoding-guard-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/governance-enforcement.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/lint/write-encoding-guard.ts
    artifact_type: source_module
  - artifact_path: src/shared/edit-targets.ts
    artifact_type: source_module
  - artifact_path: src/runtime/work-guard.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/write-encoding-guard.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-395-byte-integrity-readability-guard.md
  requires:
    - docs/plans/PLAN-REVERSE-317-write-encoding-guard-backfill.md
    - docs/plans/PLAN-L7-395-byte-integrity-readability-guard.md
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-69-encoding-corruption-expanded-guard.md
---

# PLAN-L7-317 (impl): write encoding guard

## Status

**confirmed (2026-07-08)**。PO 指摘「PowerShell でやるから文字化けするのでは。UTF-8 として読まない事故を修正できないか」を受け、v2 parked から direct quality recovery として活性化した。doctor/CI の readability fail-close は既に PLAN-L7-395 で実装済みのため、本 PLAN は書き込み直後の PostToolUse advisory guard を追加する。

## 背景 (実測 2026-07-03)

- 現状の防御は 2 層: ①Claude Code / Codex の Write/Edit ツールは UTF-8 (BOM なし) で書く ②readability gate (mojibake fail-close) が doctor/CI で全 prose doc を走査 (実測 green: 706 docs / marker 0。本日の新規 19 ファイルも strict UTF-8 デコード + U+FFFD/半角カナ/CP932 残渣スキャンで ALL CLEAN を確認済み)。
- **穴は検出の即時性**: readability の検出は「次に doctor が走った時」。shell 経由の書き込み (PowerShell `Out-File`/`Set-Content` は既定 UTF-16 LE、リダイレクトも同様) が混ざると、doctor 実行までの間、化けたファイルを他ランタイム/subagent が読み込み連鎖破損する余地がある (Codex 製 doc の mojibake→git 前版復元の実例あり)。
- なお表示上の文字化け (PowerShell `Get-Content` の既定エンコーディングで UTF-8 ファイルが化けて**見える**) はファイル破損ではない — 判定は必ずバイト列で行う。

## スコープ (1 要件: リポジトリへの書き込み直後にエンコーディング違反を検出し、doctor を待たず即時に警告する)

1. **PostToolUse 検査**: 既存の `PostToolUse(Edit|Write|MultiEdit|Bash)` hook (`src/cli.ts hook post-tool-use`) に、当該ツール呼び出しが触ったテキスト系ファイル (.md/.ts/.json/.yaml 等) の検査を追加 — (a) strict UTF-8 デコード可能 (b) BOM なし (c) U+FFFD / 半角カナ / CP932 誤変換残渣なし (検査ロジックは readability gate の既存実装 `src/lint/readability` 系を**再利用**し二重実装しない)。
2. **fail 時挙動**: hook は警告 message を surface し、違反を `.ut-tdd/logs/encoding-violations.jsonl` に記録。**書き込みの巻き戻しはしない** (hook からの自動 revert は相手ランタイム成果の破壊リスク — 検出と可視化まで。是正は書いた主体)。
3. **shell 書き込みの検出範囲**: Bash/PowerShell 経由は「どのファイルを書いたか」を確実には特定できないため、`git status` の変更ファイル差分から新規/変更テキストファイルを拾うベストエフォート (完全性は doctor readability が引き続き担保 — 二層の役割分担を doc 化)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 検査対象拡張子と fail 時挙動の設計 (TL): `governance-enforcement.md` §8 に追記 | 直列 |
| 2 | `src/lint/write-encoding-guard.ts` を追加し、`analyzeArtifacts` を再利用 | 直列 |
| 3 | `hook post-tool-use` へ接続し、明示 target / shell changed-file fallback を検査 | 直列 |
| 4 | regression test (UTF-16 ファイル→警告 / UTF-8 →無音 / shell fallback / apply_patch target) | 直列 |

## DoD

- [x] UTF-16 で書かれた .md が post-tool-use 実行で警告 + jsonl 記録される (U-WENC-001)。
- [x] UTF-8 (BOM なし) の書き込みが無音で通る (U-WENC-002)。
- [x] shell 経由の書き込みは changed file fallback で検出できる (U-WENC-003)。
- [x] apply_patch header 由来の text path を検査対象にし、binary path は除外する (U-WENC-004)。
- [x] 検査ロジックが readability gate と同一実装 `analyzeArtifacts` を共有している。

## 実装ノート (後続モデル向け)

- 触るファイル: `src/cli.ts` (hook post-tool-use 経路)、`src/lint/readability` 系の検査関数 export、`tests/`。
- hook は fail-open/fail-close の既存設計 (hook 失敗を silent に無視しない) に従う。検査自体の例外は警告として surface し、ツール実行は止めない。
- Codex 側 hook (`.codex/hooks.json`) にも同型の検査を載せるかは L7-139 (hook parity) の枠で判断 — 本 PLAN は Claude 側経路を正とし、parity は references で接続。

## 実装結果 (2026-07-08)

- `src/lint/write-encoding-guard.ts` を追加。`collectWriteEncodingGuardTargets` が `file_path` / `path` / `apply_patch` header / shell changed-file fallback から text artifact を選び、`runWriteEncodingGuard` が `analyzeArtifacts` を再利用して UTF-8 no-BOM / byte integrity / string-level mojibake marker を検査する。
- `src/cli.ts hook post-tool-use` は session-log 記録後に guard を実行し、違反時は stderr warning と `.ut-tdd/logs/encoding-violations.jsonl` を出す。exit code は 0 のまま維持し、doctor/CI の fail-close backstop と役割分担する。
- `tests/write-encoding-guard.test.ts` で U-WENC-001..004 を固定した。
