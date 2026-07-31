---
memory_id: memory:project:d3a-merged-ae4e4c12-main-green-d3b-transport-gap-and-verdict-file-decision
kind: project
title: "D3a merged ae4e4c12 main green, D3b transport gap and verdict file decision"
tags: ["attestation", "d3a", "d3b", "ordering-contract", "review-dispatch", "transport"]
updated_at: 2026-07-31T11:24:37.583Z
---

順序契約 D1 → D3 → D2 → D4 (改訂 3) の進捗。**D3a 合流済み、D3b 着手。**

## D3a: merge 済み (`ae4e4c12`、main CI green)

PR #212。reviewer 出力契約の注入 (producer) と `extractVerdict` (consumer) を同一 slice で投入。

- closing cross-review: **Codex/sol PASS** (exact HEAD `8e5cae7f`)。重点 3 点を独立 mutation で
  再現し赤化を確認 (`EXAMPLE_INDENT=""` → U-RVCON-017/019、contract 乖離 → U-RVCON-015、
  注入除去 → U-RVCON-016)。
- post-merge 実測 (issue #162 の罠): 真の post-merge HEAD で
  merged-plan-status / plan-artifact-existence / impl-plan-trace / deliverable-plan-trace /
  tracked-canonical / oracle-test-trace / memory-sync の **7/7 ok**。

## D3b: 中心は「輸送の欠落」(実測)

`src/cli/delegation.ts` の `spawnSync` は stdout を **`"inherit"`** にしている
(`--json` 時のみ `2`)。**reviewer の出力はどこにも捕捉されず端末へ素通りする**。よって D3a は
「契約を prompt へ注入」と「ログから抽出」を持つが、**その間の輸送が無い**ため verdict は
まだ harness に届かない。D3a のテストは実経路を通しているので空振りではないが、
受領ループは開いたままである。

### 設計判断 (決定済み。再議不要)

**verdict ファイル輸送を採用。** 委譲時に `UT_TDD_REVIEW_VERDICT_FILE` (repo 外 temp) を子 env へ
注入し、出力契約へ「同じ verdict ブロックをこの path へも書くこと」を追加する。harness は
そのファイルを `extractVerdict` に通す。stdout は人間向けに従来どおり残す。

却下: `stdio` の `"pipe"` 化は `spawnSync` の性質上**完了まで何も表示されず** live 出力を失う退行。
延期: 非同期 spawn + streaming tee は正道だが全委譲経路の同期→非同期リファクタと Windows の
`.cmd` spawn 地雷を伴うため D3b の射程外 (将来課題)。

`extractVerdict` は書式不変のまま流用できる。輸送が変わっても parser は不変。

### D3b の残りスコープ

- `ReviewAttestation`: family を**自己申告でなく委譲境界から導出** (`provider` / `role` / `model` /
  `head` / `startedAt` / `completedAt` / `exitCode`)。`exitCode !== 0` から receipt を作らない。
  `ReviewReceipt.at` = `completedAt`。
- receipt / request を content-addressed で `.ut-tdd/review/{receipts,requests}/<digest>.json` へ
  永続化 (tracked、監査証拠)。同一内容 → 同一ファイル名なので **replay が冪等**。
- `--review-pr` / `--review-head` / `--review-revision` を追加し、review_lane role で欠落なら
  fail-close。
- D1 carry: `merge_ready` の `!hasFlagVerdict &&` (到達不能) と `receiptAt <= previous`
  (死んでいる) を削除。削除で挙動が変わらないことを mutation で示す。

oracle 系列は `U-RVATT-*`。branch `work/d3b-review-attestation` (base `ae4e4c12`)。
terra へテスト先行 (RED) で委譲済み。
