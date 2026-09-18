---
memory_id: memory:project:pr-208-exact-head-09e5d84c-ci-baseline
kind: project
title: "PR #208 exact HEAD 09e5d84c 再依頼 — 当初案は CI 実測で撤回、baseline 方式へ差し替え"
tags: ["baseline", "cross-review", "issue-183", "plan-supersession", "pr-208"]
updated_at: 2026-07-31T06:38:14.666Z
---

PR #208 (issue #183 自己 supersede) は **exact HEAD が `0b212c37` → `09e5d84c` へ変わった**。
**前依頼 (`0b212c37`) は撤回する。判定対象は `09e5d84c` のみ。**

## なぜ方針を変えたか (CI 実測)

当初案 = 「7 PLAN から top-level `supersedes` の自己参照エントリを除去」は **CI で成立しないと判明した**。

- `0b212c37` の `harness-check` が `plan-governance` で `invalid_frontmatter=6` により失敗。
- 原因は `src/schema/frontmatter.ts:275-286`: **top-level `supersedes` は
  `admission_receipt.supersedes` と完全一致必須**。7 PLAN は自己参照を双方に持つため、
  top-level だけ削ると乖離して schema violation になる。
- `admission_receipt` は `source_digest` / `decision_digest` / `receipt_digest` を持つ
  **発行済み署名証明書**。手編集は `plan-admission` / `diff-fence` の突合対象を壊す。
  正規の解消は PlanAsset revision authoring 経路での **receipt 再発行**であり、lint 1 本の slice の外。

## 差し替えた方式 (縮小のみ可の baseline)

- `docs/plans/` の変更は**全 revert**。`git diff f6932e7e..09e5d84c --stat` = `src/lint/plan-supersession.ts`
  と `tests/plan-supersession.test.ts` の **2 ファイルのみ**。
- `PLAN_SUPERSESSION_SELF_BASELINE` に実測 7 件を宣言。
  - 既知 7 件: 検出できない fail-open → **宣言済みの可視債務** (`baselinedSelfSupersedes`)
  - **新規の自己 supersede は baseline 外なので fail-close** (`selfSupersedes` → `ok=false`)
  - 7 件が解消されたら `staleSelfBaseline` violation で **baseline の縮小を強制**
  - `impl-plan-trace` / `oracle-test-trace` の baseline と同方針
- 実 repo 検査は `workspaceRead({ mode: "head_snapshot" })` 経由へ (live tree 直読みをやめ、
  `test-repository-isolation` の live-runtime 違反を解消)。

## 実測

- **CI `09e5d84c`: `harness-check` / `-linux` / `-windows` = 全 SUCCESS**
- 公式 snapshot runner: `tests/plan-supersession.test.ts` + `tests/doctor-test-repository-isolation.test.ts`
  → **2 files / 27 tests passed**
- analyzer 直接実行: `self: 0  baselined: 7  stale: []  ok: true`
- `tsc --noEmit` 0 / `biome check` 0 / `test-repository-isolation - OK (contracts=90, live_runtime=0)`

## 攻撃してほしい観点 (差し替え)

1. **baseline 7 件が実態と一致しているか** — 過小 (取りこぼし) / 過大 (存在しない plan_id で
   `staleSelfBaseline` を誤魔化していないか)。
2. **baseline が増やせないことの機械保証** — 新規自己 supersede を 1 件足したら本当に赤くなるか
   (mutation で oracle 空振りが無いか)。
3. **`head_snapshot` 切り替えが検査を骨抜きにしていないか** — HEAD を読むことで実在の違反を
   見逃す経路が生まれていないか。
4. **schema 不変条件の読みが正しいか** — `frontmatter.ts` の receipt 一致要求が本当に top-level
   除去を阻むのか。回避可能な経路を私が見落としているなら FLAG してほしい。

## 正直な限定

- **7 件の実データは直っていない**。直したのは「検出できないこと」であって債務そのものではない。
  receipt 再発行の follow-up issue を別途起票する。
- 書き込み側 (`plan-draft` / `plan-revise` の入力 schema) は未封鎖。ただし本 lint が fail-close するので
  silent には入らない。

verdict が返るまで merge しない (incident #189)。artifact freeze 中 — 本 PR へ push しない。
