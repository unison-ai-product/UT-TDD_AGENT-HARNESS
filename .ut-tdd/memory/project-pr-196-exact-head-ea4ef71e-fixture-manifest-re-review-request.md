---
memory_id: memory:project:pr-196-exact-head-ea4ef71e-fixture-manifest-re-review-request
kind: project
title: "PR 196 exact HEAD ea4ef71e fixture manifest re-review request"
tags: ["codex-order", "fixture-manifest", "issue-149", "pr-196", "re-review"]
updated_at: 2026-07-30T03:37:42.245Z
---

PR #196 の FLAG (fx-rgk-* が識別子宣言だけで実体も正本も無い) に対する修正を push した。
再 review を依頼する。順序は S1' → S2 → S3 (S2/S3 は
`project-po-forward-d0-pr-train-order-2026-07-30-codex-pr-handling` のまま変更なし)。

## S1'. PR #196 再 closing cross-review (最優先)

- 対象 exact HEAD: `ea4ef71e055f34f29dc63a06f615819b873aaaa3`。
  HEAD が動いていたら判定せず停止して報告する。
- 追加分 (commit `ea4ef71e`):
  1. `docs/test-design/harness/resource-kernel-fixture-manifest.yaml` を fixture 正本として新規追加。
     42 件それぞれに `case` / `lane` / `status` / 配置先 `path` / `contract_ref` (PLAN-L5-25 の節) /
     `inputs` / `generation` を固定。
  2. `status` 語彙は `planned` / `materialized` の 2 値。**`planned` は `path` が実在してはならない**
     (実在したら Red)。実体が無いのに配置済みと読ませる偽装を構造的に禁じる意図。
  3. `src/lint/resource-kernel-fixture-manifest.ts` + `tests/resource-kernel-fixture-manifest.test.ts`
     が L8 表と manifest を突合し、欠落 / dangling / 重複 / case・lane 不一致 / 必須 field 欠落 /
     fixture_root 外 path / planned で実在 / materialized で不在 / contract 節不在 を fail-close 検出。
  4. L8 側に正本の所在と planned 不変条件を明記。

### 攻撃観点 (前回 FLAG の再発と、新しい抜けの両方を潰す)

1. **前回 FLAG の充足判定**: 42 識別子すべてに配置先・入力構成・生成規則・契約 citation が付いたか。
   1 件でも `inputs` が実質空 (中身のない一般語) なら FLAG 継続で良い。
2. **偽装不変条件の実効性**: `planned` で `path` を実在させた場合に本当に Red になるか。
   手元で 1 件ディレクトリを作って test を落として確認してほしい (機構が絵に描いた餅でないかの実測)。
3. **contract_ref の実在検査**: `§99` のような不在節が検出されるか。逆に、実在しても
   **無関係な節**を指している行が無いか (機械では検出できないので人の目で 42 行を抜き取り検査)。
4. **case / lane の写像**: manifest の `case` と L8 行が 1:1 か。同じ fixture を 2 case が共有していないか。
5. **status の申告と現実**: 42 件すべて `planned` = 実体 0 という申告が正しいか
   (`tests/fixtures/resource-kernel` が tree に無いことを確認)。
6. **主張の範囲**: 実 runner 証跡を主張していないか。`PLAN-L5-25` / `L6-92` / `L7-466` の
   `status` が draft のままか。
7. **重複コード**: 本 PR の `sliceSection` / 表 parse は後続 PR-2 の
   `src/lint/resource-kernel-pair-mapping.ts` と重複する。PR-2 側で本 PR の module を import して
   重複を解消する予定であることを申し送る (本 PR 単独では重複しない)。

### 判定後

- **merge は Claude へ返す**。判定投稿より前の merge はインシデント #189 の再発。
- PASS / PASS-WEAK なら Claude が merge し、直列で PR-2 (L5 契約 → 42 oracle 全数写像 +
  pair-freeze / confirmed 条件分離) を push する。

## 実測 (HEAD `ea4ef71e`)

- `bun scripts/run-vitest-snapshot.ts tests/resource-kernel-fixture-manifest.test.ts tests/readability.test.ts tests/oracle-test-trace.test.ts tests/test-design-naming.test.ts --reporter=dot`
  → 4 files / **40 tests passed** (2026-07-30 12:34 JST)
- `bunx tsc --noEmit` → エラー 0、`bunx biome check` → 指摘 0。

## 参考: 今日確定した運用変更 (PO 承認済み、未適用)

`main` に branch protection が無く (`gh api .../branches/main/protection` → 404)、required check が
0 件だった。PO は `harness-check` を required check にすることを承認済みだが、設定変更 API は
Claude 側の権限分類器にブロックされたため未適用。適用されるまでは「CI 赤でも merge できる」前提で、
判定前 merge をしない規律を人手で守る必要がある。
