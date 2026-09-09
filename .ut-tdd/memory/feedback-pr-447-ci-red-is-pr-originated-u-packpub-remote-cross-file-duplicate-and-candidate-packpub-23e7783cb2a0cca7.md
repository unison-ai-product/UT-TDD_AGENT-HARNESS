---
memory_id: memory:feedback:pr-447-ci-red-is-pr-originated-u-packpub-remote-cross-file-duplicate-and-candidate-packpub-003-backtick-collision--c2a0df115d92
kind: feedback
title: "PR 447 CI red is PR-originated: U-PACKPUB-REMOTE cross-file duplicate and CANDIDATE-PACKPUB-003 backtick collision"
tags: ["ci-red", "oracle-test-trace", "pr-447", "vmodel-source-assets"]
updated_at: 2026-08-27T08:41:01.802Z
---

PR #447 の CI は **PR 起因で決定論的に赤**。両 OS が落ちており flake ではない。

## 失敗の内訳 (run 33053258758, head 5388e3a7)

Linux と Windows で**落ちるステップが違うだけで、原因は同じ**。Linux は doctor が先、
Windows は test が先という workflow のステップ順の差。

### 原因1: `U-PACKPUB-REMOTE-001〜009` のファイル跨ぎ二重宣言 (Linux doctor + Windows vitest)

```
doctor: oracle-test-trace — ⚠ provenance が異なる重複宣言 9 件:
  U-PACKPUB-REMOTE-001 … U-PACKPUB-REMOTE-009
```
```
FAIL tests/oracle-test-trace.test.ts > U-OTT-004: 実 repo の orphan は 0
AssertionError: expected [ … 9 件 … ] to deeply equal []
```

同一 ID が 2 つの test-design doc で**説明文が異なるまま**宣言されている:

- `docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md:17-25`
  (表ヘッダ `| ID | fault / mutation | expected oracle |`)
- `docs/test-design/harness/L7-unit-test-design.md:2510-2518`
  (表ヘッダ `| ID | fixture / mutation | expected |`)

`analyzeDeclarationUniqueness` は同一 ID の正規化済み説明が 2 種類以上あれば duplicate 判定する。
構造 mirror 例外 (`selectCanonicalDeclarationSites`) は `path` を含むキーで畳むため
**同一ファイル内の canonical/summary 対にしか効かず、ファイル跨ぎは必ず落ちる**。
`ORACLE_ID_DUPLICATE_BASELINE` に PACKPUB 系は無く、baseline は縮小のみ可なので追記での回避は規約上不可。

### 原因2: `CANDIDATE-PACKPUB-003` の backtick 完結形が 2 回 (Windows vitest)

```
FAIL tests/vmodel-source-assets.test.ts:245 > U-VMSRC-009
AssertionError: expected 81 to be 82
```

`expect(new Set(candidateIds).size).toBe(candidateIds.length)`。
main 側に `` `CANDIDATE-PACKPUB-003` `` が `L7-unit-test-design.md:2478` に 1 件あり、
PR が新節で backtick 完結形をもう 1 回引用したため 82 件中 unique 81 になった。
なお `` `CANDIDATE-PACKPUB-003/004` `` (2484 行) は正規表現に非マッチなのでカウント外。

## 起因判定の根拠

- base commit `c12184c2` の main run `33052008498` は success。直近 main 3 run すべて success。
- `U-PACKPUB-REMOTE` は **main の docs/ 全体に 0 件** (実測)。
- エラー本文が PR 追加行のファイル:行 を直接名指ししている。
- `classify-changes` は `change lane: full` を選択済みで、doc lane 迂回による差異ではない。

## 修正方針

1. `U-PACKPUB-REMOTE-001〜009` の宣言表は **1 ファイルだけを canonical にする**
   (専用 `L7-pack-publication-remote-adapter-test-design.md` を正本にし、`L7-unit-test-design.md`
   側は ID 単独セルの表を置かず散文でポインタのみにする)。両方に表を残すなら 9 行の説明文を
   **一字一句同一**にすること (`normalizeDescription` は空白畳みのみで語彙差を許容しない)。
2. `L7-unit-test-design.md` 新節の 2 回目の `` `CANDIDATE-PACKPUB-003` `` を backtick 完結形以外にする。
3. 再検証は `npx vitest run tests/oracle-test-trace.test.ts tests/vmodel-source-assets.test.ts` で足りる
   (doctor は singleton なので起動しないこと)。
