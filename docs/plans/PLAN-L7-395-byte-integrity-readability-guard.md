---
plan_id: PLAN-L7-395-byte-integrity-readability-guard
title: "PLAN-L7-395 (add-impl): byte-level integrity 層で readability gate を高級化 (BOM / strict-UTF8 / 制御文字 / JSON escape)"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-07-08
updated: 2026-07-08
owner: PM (Opus) / cross-review Codex (gpt-5.5)
route_signal: feature_addition
route_mode: add-feature
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T21:12:55+09:00"
    tests_green_at: "2026-07-08T21:12:55+09:00"
    verdict: approve
    scope: "PLAN-L7-395 byte integrity readability guard。string-level mojibake denylist に byte-level positive validation を追加し、PowerShell/UTF-8 事故の実ファイル混入を doctor/CI で fail-close する。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\readability.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T21:12:00+09:00"
        evidence_path: tests/readability.test.ts
        output_digest: "sha256:fbf9f70d81ef7a721267b30a823682cab012a9a64f9ee0f023864693cc812184"
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T21:12:00+09:00"
        evidence_path: src/lint/readability.ts
        output_digest: "sha256:f02d73edaa8441af0042a6e1e94b45cf7a82f1e8b61a9bedea5e8e5a016106e7"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T21:12:00+09:00"
        evidence_path: src/lint/readability.ts
        output_digest: "sha256:f02d73edaa8441af0042a6e1e94b45cf7a82f1e8b61a9bedea5e8e5a016106e7"
      - kind: smoke
        command: "bun -e \"... utf8bom=0 scan ...\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T21:12:00+09:00"
        evidence_path: AGENTS.md
        output_digest: "sha256:fae34dd628afc9f126b044ceb79e0475d26e9363db198617d71e3c794cb419fc"
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - byte-level integrity 検出信号の範囲と fail-close 挙動レビュー"
  - role: qa
    slot_label: "QA - cross-review (gpt-5.5) による設計/実装の敵対的検証"
generates:
  - artifact_path: docs/plans/PLAN-L7-395-byte-integrity-readability-guard.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-396-encoding-byte-integrity-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/readability.ts
    artifact_type: source_module
  - artifact_path: src/doctor/rule-quality.ts
    artifact_type: source_module
  - artifact_path: tests/readability.test.ts
    artifact_type: test_code
  - artifact_path: AGENTS.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ai-dev-team-concept_v1.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ai-dev-team-operations_v1.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/governance-enforcement.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/improvement-backlog.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-69-encoding-corruption-expanded-guard.md
  requires:
    - docs/plans/PLAN-L7-69-encoding-corruption-expanded-guard.md
    - docs/plans/PLAN-REVERSE-396-encoding-byte-integrity-backfill.md
  references:
    - docs/plans/PLAN-L7-317-write-encoding-guard.md
    - docs/improvement-backlog.md
---

# PLAN-L7-395: byte-level integrity 層で readability gate を高級化

## 0. Objective

既存 `readability` / `runtime-readability` gate の検出信号を、**string-level heuristic denylist** から
**byte-level positive validation を加えた多層防御**へ高級化する。既存の marker denylist
(double-encode 型 mojibake を捕捉) は唯一の防波堤として残し、その手前に決定論的な byte 検査を足す。

## 1. Problem (実測で裏取り、3者相談で確認)

現行 `src/lint/readability.ts` の `analyzeReadability` は `readFileSync(path, "utf8")` で
**既にデコード済みの文字列**を受け取り regex marker を走査する。この構造には absence-blindness がある:

1. **BOM 素通り**: UTF-8 BOM (`EF BB BF`) は utf8 decode 後 U+FEFF になるだけでどの marker にも当たらない。
   UTF-16 LE/BE BOM も検出しない。実測: docs/ + root + .ut-tdd を byte scan すると
   **UTF-8 BOM が既に 3 件** (`docs/governance/ai-dev-team-concept_v1.1.md`,
   `docs/governance/ai-dev-team-operations_v1.1.md`, `docs/handover/session-handover-2026-06-12-A-136.md`)。
   (Claude / Sonnet TL / Codex gpt-5.5 の 3 者が独立に同じ 3 件を計測。)
2. **不正 UTF-8 の分類が事後的**: `readFileSync(...,"utf8")` は lossy decode で不正バイトを黙って
   U+FFFD 化する。既存 `replacement-character` marker が事後的に捕捉するが、byte 層での決定論的分類
   (decode 前 fail-close / hook 共通化の土台) が無い。
3. **NUL / C0・C1 制御文字**: ASCII を UTF-16LE (BOM 無) 誤保存すると NUL バイトが素通りし、U+FFFD も
   出ず strict decode も throw しない (IMP-086 が指摘する未クローズの穴と同一改修面)。
4. **JSON escape 漏れ** (Codex gpt-5.5 追加所見): raw text regex は JSON escape 化された U+FFFD の
   escape 表現を検出しない。JSON.parse 後の string value なら U+FFFD として検出できる。

### mojibake の因果 (実測)

Windows 日本語ロケールで OS ANSI 既定 = CP932。Claude Write は UTF-8 no-BOM を書くが、UTF-8 バイトを
CP932 デコードすると `工程表` が既存 denylist marker に一致する mojibake へ化ける。Codex gpt-5.5 が自ら実験し、
PS 5.1 `Get-Content` 既定 (ANSI) は `jp=False / moji=True` で**実内容が破損**、`-Encoding utf8` は
`jp=True / moji=False` で正常、と実証。env (`chcp 65001` / `PYTHONUTF8` / `LANG`) では既定 Get-Content は
矯正できず、config/flag も無い = **env 注入による prevention は不可**。指示 (規約) による prevention は可能。

## 2. Scope

### Layer 1 (検出・機械強制) — 本 PLAN の主眼

`src/lint/readability.ts` に byte-level 検査を追加する。**既存 `analyzeReadability(docs)` の
signature は不変** (consumer: rule-quality.ts / readability.test.ts / codex-hook-adapter.test.ts の
後方互換を保つ)。新関数 `analyzeByteIntegrity(files: {path, bytes}[])` を足し、doctor 側で両者を
統合する (TL 案 B)。検出信号:

- `utf8-bom` / `utf16le-bom` / `utf16be-bom`: 先頭バイト prefix 検出 (repo 標準 = no-BOM UTF-8)。
- `invalid-utf8`: `new TextDecoder("utf-8", { fatal: true })` の throw を per-file catch し violation 化。
- `control-character`: 生バイトの C0 (`0x00`–`0x1F`、`\t\n\r` 除く) + `0x7F`、および strict decode 成功時の
  C1 codepoint (U+0080–U+009F)。NUL blind spot を閉じる (IMP-086)。
- `json-escaped-mojibake`: `.json` は decode 成功時に `JSON.parse` し、string value が既存 MOJIBAKE_MARKER に
  一致するかを走査 (parse 失敗時は raw scan が担うので skip)。

ローダーは **単一 I/O** (`readFileSync(path)` → bytes、`text = bytes.toString("utf8")`) に統一し二重読みを避ける。
`checkReadability` / `checkRuntimeReadability` は `analyzeReadability`(text) と `analyzeByteIntegrity`(bytes)
を実行し violation を統合。既存の fail-close (checked>0 / fail-open-on-absence / I/O 失敗 fail-close) を維持。
byte 検査の decode 例外は per-file violation に変換し、外側 I/O fail-close と混同しない (actionable path 維持)。

### Layer 2 (予防・規約)

`AGENTS.md` (Codex 規約) に「shell からのファイル読取りは `-Encoding utf8` か node/bun fs を必須とし、
素の `Get-Content` を使わない」規約を追加する。Codex gpt-5.5 が「遵守可能・実務信頼度高・ただし機械強制で
ないので gate は必須」と回答。env 注入 (実証で無効) は入れない。

### 非スコープ

- 「いつ検出するか」の即時化 (PostToolUse hook) は PLAN-L7-317 (v2 parked) の軸。本 PLAN は「何を検出するか」の
  信号強化に限定し、L7-317 v2 活性化時は本 PLAN の `analyzeByteIntegrity` をそのまま再利用する。
- Codex 起動時の env による UTF-8 強制は実証で無効と確定したため入れない。

## 3. Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 先行 cleanup: BOM 3 件を UTF-8 no-BOM に正規化 (byte-level strip、内容不変)。独立コミット | 直列 |
| 2 | `analyzeByteIntegrity` + ローダー単一 I/O 化を実装 (behavior-preserving) | 直列 (Step1 後: BOM 検出 hard 化前に cleanup 必須) |
| 3 | `checkReadability` / `checkRuntimeReadability` に統合、fail-close 維持 | 直列 |
| 4 | regression test (Buffer/一時ファイル fixture) を追加 | 直列 |
| 5 | Layer 2: AGENTS.md 規約追加 / IMP-086 を implemented 化 | 並列 (Step2-4 と独立) |

## 4. Acceptance Criteria (falsifiable claim は test/command で substantiate)

- [ ] BOM 3 件正規化後、byte scan で `utf8bom=0`。
- [ ] UTF-8 BOM / UTF-16LE BOM / UTF-16BE BOM の Buffer fixture が各々 `*-bom` violation で fail (test 固定)。
- [ ] 不正 UTF-8 バイト列 Buffer が `invalid-utf8` で fail (test 固定)。
- [ ] NUL を含む Buffer (BOM 無 UTF-16LE ASCII 相当) が `control-character` で fail (test 固定)。
- [ ] `.json` の JSON escape 化された U+FFFD が `json-escaped-mojibake` で fail (test 固定)。
- [ ] 既存 `analyzeReadability` string fixture test 全件 green (後方互換)。
- [ ] real repo: `checkReadability` / `checkRuntimeReadability` が green (BOM cleanup 後)。
- [ ] `bun run vitest run tests/readability.test.ts` green + doctor の該当 2 gate OK。

## 5. Review evidence

- design cross-consult: ut-tdd-tl (claude-sonnet-5, 一次) + `ut-tdd codex --role reviewer --model gpt-5.5`
  (敵対的クロス、C1 の BOM 3 件を独立再計測で確認、JSON escape 漏れを追加検出) — 2026-07-08。
- 実装後 review (Codex TL + mini explorer) — 2026-07-08。byte-level integrity 実装、PowerShell/UTF-8 事故予防ルール、L6/L7 back-fill、BOM cleanup を確認。

```yaml
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T21:12:55+09:00"
    tests_green_at: "2026-07-08T21:12:55+09:00"
    verdict: approve
    scope: "PLAN-L7-395 byte integrity readability guard。string-level mojibake denylist に byte-level positive validation を追加し、PowerShell/UTF-8 事故の実ファイル混入を doctor/CI で fail-close する。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\readability.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T21:12:00+09:00"
        evidence_path: tests/readability.test.ts
        output_digest: "sha256:fbf9f70d81ef7a721267b30a823682cab012a9a64f9ee0f023864693cc812184"
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T21:12:00+09:00"
        evidence_path: src/lint/readability.ts
        output_digest: "sha256:f02d73edaa8441af0042a6e1e94b45cf7a82f1e8b61a9bedea5e8e5a016106e7"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T21:12:00+09:00"
        evidence_path: src/lint/readability.ts
        output_digest: "sha256:f02d73edaa8441af0042a6e1e94b45cf7a82f1e8b61a9bedea5e8e5a016106e7"
      - kind: smoke
        command: "bun -e \"... utf8bom=0 scan ...\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T21:12:00+09:00"
        evidence_path: AGENTS.md
        output_digest: "sha256:fae34dd628afc9f126b044ceb79e0475d26e9363db198617d71e3c794cb419fc"
```

## 6. Acceptance closure

- [x] BOM 3 件正規化後、byte scan で `utf8bom=0`。
- [x] UTF-8 BOM / UTF-16LE BOM / UTF-16BE BOM の Buffer fixture が各々 `*-bom` violation で fail (test 固定)。
- [x] 不正 UTF-8 バイト列 Buffer が `invalid-utf8` で fail (test 固定)。
- [x] NUL を含む Buffer (BOM 無 UTF-16LE ASCII 相当) が `control-character` で fail (test 固定)。
- [x] `.json` の JSON escape 化された U+FFFD が `json-escaped-mojibake` で fail (test 固定)。JSON key 側も fixture で固定。
- [x] 既存 `analyzeReadability` string fixture test 全件 green (後方互換)。
- [x] real repo: `checkReadability` / `checkRuntimeReadability` が green (BOM cleanup 後)。
- [x] `bun run vitest run tests/readability.test.ts` green。doctor 該当 2 gate は `readability` / `runtime-readability` OK。
