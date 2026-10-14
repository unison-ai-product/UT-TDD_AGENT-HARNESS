---
title: "L7 plan revise omission preserve test design"
artifact_type: test_design
layer: L6
executed_at_layer: L7
status: draft
pair_artifact: docs/design/harness/L5-detailed-design/internal-processing.md
parent_doc: docs/design/harness/L5-detailed-design/internal-processing.md
created: 2026-10-14
updated: 2026-10-14
---

# plan revise の省略保存と明示 clear (Issue #832) — L7 test design

## 1. 位置付け

`docs/design/harness/L5-detailed-design/internal-processing.md` 付録 F.2 (省略=保存と明示 clear の契約、未実装) の pair artifact。`PLAN-L6-832` の本文にだけあった候補 oracle C1-C9 を `CANDIDATE-PREVISE-C1..C9` として移した (設計還流 issue #958)。いずれも未実装で、正規 ID の採番と `docs/test-design/harness/L7-unit-test-design.md` への昇格は、Issue #832 の L7 add-impl が行う。

## 2. 置き場と既存 oracle の改訂

テストは既存の配置に合わせる。解決関数と binder は `tests/plan-content-binding.test.ts`、manifest schema と CLI 接続は `tests/plan-revise-cli.test.ts`、write-set と replay は `tests/node-plan-revision-runner.test.ts`。

- `U-PA-BIND-001` は「admission が省略した key は base 値を保存し、clear した key だけ消える」へ反転する。`U-PA-BIND-003` (指定した supersedes は旧値を継承せず置換する) は維持する。
- `src/lint/oracle-test-citation-baseline.ts` の該当 entry は L7 add-impl で同時に更新する。

## 3. 候補 oracle

| ID | 条件 | 期待 | 置き場 |
|---|---|---|---|
| `CANDIDATE-PREVISE-C1` | base に `sub_doc: function-spec` があり、manifest が `sub_doc` を省略する | revise 後も `sub_doc: function-spec` が残る。保存処理を消すと RED | plan-content-binding |
| `CANDIDATE-PREVISE-C2` | C1 と同じで `clear: ["sub_doc"]` | `sub_doc` が消える | plan-content-binding |
| `CANDIDATE-PREVISE-C3` | `workflow_phase` / `supersedes` / `issue` / `status` のそれぞれで省略・置換・clear | 省略は保存、置換は新値、clear は消える。`status` の clear は schema で拒否 | plan-content-binding / plan-revise-cli |
| `CANDIDATE-PREVISE-C4` | 未知 key の clear、重複、空配列、同一 key への値と clear の同時指定 | schema で拒否、write 0 | plan-revise-cli |
| `CANDIDATE-PREVISE-C5` | base に `github_issue_id` があるが receipt に issue が無い、または値が一致しない | fail-close、write 0。明示 `issue` か clear で通る | node-plan-revision-runner |
| `CANDIDATE-PREVISE-C6` | kind 変更で保存した `workflow_phase` が不適合になる。Forward 遷移で `issue` が残る | 自動で落とさず fail-close、write 0 | node-plan-revision-runner |
| `CANDIDATE-PREVISE-C7` | `status` / `supersedes` を省略した manifest で CLI の事前評価を通す | 解決済み request で評価され、runner の `assertAdmission` と一致する | plan-revise-cli |
| `CANDIDATE-PREVISE-C8` | 初回 revise の後に HEAD を進め、同じ command を replay する | 初回と同じ admission / content digest / 本文。現在 HEAD から継承すると RED | node-plan-revision-runner |
| `CANDIDATE-PREVISE-C9` | `supersedes: []` と `clear: ["supersedes"]` | 前者は空配列、後者は key 無し | plan-content-binding |
