---
plan_id: PLAN-L7-398-session-log-summarize-path-truncation
title: "PLAN-L7-398 (troubleshoot): session-log summarize() の path truncation が work-guard を誤動作させる"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-07-08
updated: 2026-07-08
owner: Claude / PO
route_signal: incident
route_mode: incident
backprop_decision: not_required
backprop_decision_reason: "session-log 内部の target 文字列生成ロジック修正 (truncate 除去)。ログ schema/外部 API 変更なし、runtime user 向け挙動変更なし。"
review_evidence:
  - reviewer: code-reviewer-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T22:05:00+09:00"
    tests_green_at: "2026-07-08T22:01:15+09:00"
    verdict: approve
    scope: "summarize() の 120 文字 truncate が path 系 target を破壊し work-guard sessionTouchedFiles の突合キーを壊す不具合の是正。secret mask 維持、Bash 系 target の従来挙動維持を確認。"
    worker_model: claude-sonnet-5
    reviewer_model: claude-sonnet-5
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/session-log.test.ts tests/skill-telemetry-provenance.test.ts tests/handover.test.ts tests/attempt-escalation.test.ts tests/forced-stop.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T22:01:15+09:00"
        evidence_path: tests/session-log.test.ts
        output_digest: "sha256:9721af0c331430a85e8683171116706e171be5a3defe97238f2f0d1fbd51836b"
        anchor_commit: 80a1b3830acb61fbb69d665629a0fde8b0d49a32
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T22:00:00+09:00"
        evidence_path: src/runtime/session-log.ts
        output_digest: "sha256:01be8560c608d18af3548c67ac44d5be968e3c7dd966c240184c74ee32943898"
        anchor_commit: 80a1b3830acb61fbb69d665629a0fde8b0d49a32
agent_slots:
  - role: tl
    slot_label: "TL - session-log summarize() path truncation fix review"
  - role: aim
    slot_label: "AIM - troubleshoot and cross-runtime review"
generates:
  - artifact_path: docs/plans/PLAN-L7-398-session-log-summarize-path-truncation.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/session-log.ts
    artifact_type: source_module
  - artifact_path: tests/session-log.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - docs/design/harness/L6-function-design/session-log.md
    - docs/plans/PLAN-L7-114-work-guard.md
    - docs/plans/PLAN-L7-397-relation-graph-docs-root-ledger-coverage.md
---

# PLAN-L7-398: session-log summarize() の path truncation が work-guard を誤動作させる

## 0. 検出 (システム全体監査、2026-07-08、PLAN-L7-397 実装中に偶発的に再現)

PLAN-L7-397 の作業中、自分で `Write` した `docs/plans/PLAN-L7-397-relation-graph-docs-root-
ledger-coverage.md`（このセッションが直前に作成した自分のファイル）への 2 回目の `Edit` が
`work-guard` に「このセッションが触っていない uncommitted ファイル (他ランタイムの in-flight
成果の可能性)」として block された。

原因調査:

- `work-guard` の `sessionTouchedFiles()` (`.claude/hooks/work-guard.ts`) は
  `.ut-tdd/logs/session/<session_id>.jsonl` の各行の `target` フィールドを
  `normalizeRepoRelative` し、これを「このセッションが触った path 集合」として使う。
- `target` は `src/runtime/session-log.ts` の `summarize()` → `sanitize()` を経由し、
  **`${tool} ${absolute_path}` を含む文字列全体を 120 文字で truncate** していた
  (`sanitize` は元々 token/secret マスク後の durable log 圧縮のために存在する)。
- 本 repo のチェックアウト絶対 path (`C:\Users\<user>\OneDrive\Desktop\
  UT-TDD-agent-harness\`) + 本 repo の PLAN 命名規約 (説明的で長いファイル名) を組み合わせると
  `"Write " + <absolute path>` は 120 文字を容易に超える。実測:
  `docs/plans/PLAN-L7-397-relation-graph-docs-root-ledger-coverage.md` への Write は
  120 文字ちょうどで `…` 省略され、記録された `target` は実 path と一致しなくなった。
- 結果、`sessionTouchedFiles()` が保持する「自分が touch した path」がこの 1 件について
  壊れ、`evaluateWorkGuard` の `touched.has(targetPath)` が false になり、2 回目以降の
  自分自身への Edit が foreign-uncommitted として block された。

この誤検知は安全側 (false block であって false pass ではない) だが、hybrid 多ランタイム協調の
根幹である work-guard の「touched 判定」が経路によって壊れることは、ガードへの信頼を損ない
(オオカミ少年化)、`UT_TDD_ALLOW_FOREIGN_EDIT=1` / override marker への安易な逃避を誘発しうる。

## 1. 是正

`src/runtime/session-log.ts`:

- `sanitize()` の mask 処理を `maskSecrets()` として分離。
- `summarize()` で `file_path` / `path` / `notebook_path` を伴う target は
  **truncate せず** `maskSecrets()` のみ適用する (path が secret を含むことは通常無いが
  mask 自体は安全側で維持)。path を伴わない target (Bash 等) は従来通り `sanitize()`
  (mask + 120 文字 truncate) を適用する。

## 2. 受け入れ条件

- `tests/session-log.test.ts` (U-SLOG-009 追加) で、120 文字を超える file_path の
  `summarize()` 結果が truncate されず (`…` を含まない) 実 path と完全一致することを
  確認する。
- 既存の secret mask 挙動 (`U-SLOG-002b`) および Bash verb 分類挙動 (`U-SLOG-007`) に
  regression が無い。
- `bun run typecheck` / 対象ファイルの `biome check` が green である。
- `tests/session-log.test.ts` 自身に加え、`session-log` に依存する
  `tests/skill-telemetry-provenance.test.ts` / `tests/handover.test.ts` /
  `tests/attempt-escalation.test.ts` / `tests/forced-stop.test.ts` が green である。

## 3. 既知の残課題 (この PLANではやらない)

- `docs/test-design/harness/L7-unit-test-design.md` §1.5 への `U-SLOG-009` の正式な
  test-design row 追加は **見送った**: 監査時点で当該ファイルは他ランタイム (Codex,
  PLAN-L7-368 Design Lint DB Projection Addendum) が in-flight で編集中の uncommitted
  ファイルであり (`git diff` で確認)、非重複な追記であっても同時書き込みレースで相手の
  成果を破壊しうるため `work-guard` の指示通り触らなかった。次に当該ファイルが
  commit された後、別 PLAN またはこの PLAN の追補として `U-SLOG-009` row を追記する。
- このセッション自身の `.ut-tdd/logs/session/<this-session>.jsonl` に既に書かれてしまった
  truncated 済みの過去行は遡って直さない (append-only ログの性質上、複雑度に見合わない)。
  影響は「今回の session 内で、今回より前に truncate された長い path への 2 回目以降の
  自己編集がまだ block されうる」ことのみで、次回 session からは本修正が効く。
