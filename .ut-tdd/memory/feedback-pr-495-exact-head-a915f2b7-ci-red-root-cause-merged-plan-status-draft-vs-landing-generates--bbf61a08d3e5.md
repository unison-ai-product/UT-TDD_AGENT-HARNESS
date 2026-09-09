---
memory_id: memory:feedback:pr-495-exact-head-a915f2b7-ci-red-root-cause-merged-plan-status-draft-vs-landing-generates--bbf61a08d3e5
kind: feedback
title: "PR #495 exact-head a915f2b7 CI red root cause merged-plan-status draft vs landing generates"
tags: ["ci-red", "claude-review", "pr"]
updated_at: 2026-08-31T06:31:02.436Z
---

# PR #495 exact-head `a915f2b7` — closing review は保留、CI Red の原因を特定

依頼 (`memory:project:pr-495-exact-head-a915f2b7-ci-and-opus-closing` /
request `86e8a7c9...`) は「Linux / Windows / aggregate の required CI Green を待ってから
Claude Opus の非著者 closing review と canonical receipt」でした。
**CI は Green ではない**ため、契約どおり canonical receipt は発行していません。

- `harness-check-linux`: **FAILURE** (run `33363709027`, job `99399966351`)
- `harness-check-windows`: in_progress
- aggregate: 未到達

## Linux 失敗の原因 (単一、governance のみ)

失敗ステップは doctor です。exit 1 の実因は 1 件だけです:

```
doctor: merged-plan-status - violation:
  PLAN PLAN-L7-527-pack-consumer-node-readiness は status=draft (未 confirm) なのに
  generated deliverable が landing: tests/setup-bun-readiness.test.ts (phase=landing)
```

`git diff 54eb3cb1 a915f2b7` で確認したとおり、#492 からの再著者化で

- `status: confirmed` → **`draft`**
- `review_evidence:` の preflight entry 1 件 → **`[]`**

に変わりましたが、`generates` は `tests/setup-bun-readiness.test.ts` を宣言したままです。
この PR は当該 test を landing させるので、draft × landing deliverable の組で fail-close します。

他の doctor check に violation はありません (`plan lint` はローカルでも
942 checked / Green、`impl-plan-trace` / `oracle-test-trace` / `green-command-digest` も OK)。

## 直し方 — 私の review を待つ必要はありません

gate 自身のメッセージが循環を明示的に否定しています:

> 非著者 closing review の PASS verdict と canonical receipt は、最終変更後の exact PR HEAD
> に対する PR comment / canonical review receipt に残す。**これは merge 前に PLAN の
> review_evidence へ書き戻す要件ではない。** confirm 時の **preflight** review_evidence は
> `tests_green_at <= reviewed_at`、`green_commands` は kind/command/runner/scope/exit_code/
> completed_at/evidence_path/output_digest/anchor_commit を完備。

つまり `status: confirmed` に必要なのは **preflight** evidence であって、私の closing verdict
ではありません。#492 が持っていた preflight entry は anchor が `f2134dc9` で本 PR の履歴に
無いため再利用できませんが、**空にするのではなく現 anchor (`a915f2b7`) で取り直す**のが
正しい是正です。

推奨手順 (doctor の是正手順 (B) 単一実装 PR):

1. 現 HEAD で preflight を再実行し、`anchor_commit` / `plan_revision` / `subject_head` を
   `a915f2b7` 系へ束縛した `review_evidence` を 1 件記録する。
2. `PLAN-L7-527` を `status: confirmed` へ戻す (`generates` は現状のままでよい)。
3. CI 再実行 → Linux/Windows/aggregate Green を確認。
4. その exact HEAD で `review live-dispatch` → 私が canonical receipt を発行。

(A) の分割案は、この PR が PLAN doc と test を同時に landing させている以上、
分割 PR が必要になるので (B) のほうが素直です。

## 内容面の暫定所見 (受領扱いにはしないでください)

`a915f2b7` の source/test 実体は closed #492 の `54eb3cb1` と**実質同一**です。
差分は JSDoc 重複ブロック 1 個の削除、説明コメント 3 箇所の削除、test title の改名だけで、
`satisfiesRequiredNode` / `buildConsumerReadinessPlan` / oracle の**述語は 1 つも変わって
いません**。したがって #492 に出した所見はそのまま持ち越します。

- blocking: **0** (現時点の読みでは)
- non-blocking 1 は **未修正のまま**です。`src/setup/distribution.ts:340`

  ```ts
  `Install Node ${input.requiredNodeVersion} or newer before setup (observed ...)`
  ```

  bare `engines.node` (`"24.13.0"`) は npm 意味論で**厳密一致**なので、24.14.0 は落ちます。
  「or newer」に従った consumer は ready になりません。しかも本 PR は、この矛盾を
  説明していたコメント (`24.14.0 が落ちる理由が読めなくなる`) を**削除**したため、
  次に読む人が気づきにくくなっています。check 名と同じく range 表記をそのまま出してください。
- non-blocking 2 も未修正です。`tests/setup-bun-readiness.test.ts:122,124` が
  `node@24.13.0` をハードコードしており、fixture は repo の `package.json` を copy するので、
  Node pin を上げるたびに落ちます。fixture の `engines.node` から期待値を組み立ててください。

正式な verdict は CI Green 後の exact HEAD に対して、canonical receipt として別途出します。
