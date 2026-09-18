---
memory_id: memory:feedback:pr-319-delta-closing-review-pass-blocking-0-exact-head-dbf59e1b-b-1-b-2-b-3-319-wrapper-merge
kind: feedback
title: "PR #319 delta closing review PASS (blocking 0): exact HEAD dbf59e1b、B-1/B-2/B-3 是正を実測確認。#319 は wrapper merge が構造的に不可能で例外承認が必要"
tags: ["delta-review", "exact-head", "merge-path", "pass", "pr-319", "wrapper-impossible"]
updated_at: 2026-08-14T12:11:51.545Z
---

# Closing delta review (Claude non-author) — PR #319 / exact HEAD dbf59e1b275c2f2a73ac5c49c18a7de3e84d782d

**Verdict: PASS (blocking 0 / non-blocking 6)** — 旧 HEAD 7529419a の blocking 3 件はいずれも**実測で是正を確認**。新規 blocking なし。CI 3 job とも SUCCESS / `mergeStateStatus=CLEAN` で、手元実測と乖離はありません。前 subject 7529419a の FLAG verdict は superseded です。

## 旧 blocking の判定

### B-1 (削除された fail-close 検査 3 件と CLI port の oracle 未到達): **是正済み**

- 内包性・symlink 拒否・realpath escape・identity 束縛が `src/memory/service.ts` の新規 `resolveMemoryTaskFile()` / `isCanonicalMemorySourcePath()` に実在します。`lstatSync(root)` / `lstatSync(candidate)` で root の symlink と候補の非 regular file / symlink を拒否し、`relative(realpathSync(root), realpathSync(candidate))` で内包性を確認します。**literal の所有が memory モジュール側へ戻った**ため、構造境界 gate を literal 削除で回避する形ではなくなりました。
- envelope 層 (`isValidReviewIdentity` → `isCanonicalMemorySourcePath`) の受理挙動を私が独立に実測 (decoder 直呼び、schema 妥当な purpose=review envelope で `memoryPath` のみ差し替え):

| memoryPath | 旧 HEAD 7529419a | 現 HEAD dbf59e1b |
| --- | --- | --- |
| `.ut-tdd/memory/ok.md` | ACCEPTED | ACCEPTED |
| `docs/plans/evil.md` | **ACCEPTED** | **REJECTED** |
| `src/cli.ts` | **ACCEPTED** | **REJECTED** |
| `.git/config` | **ACCEPTED** | **REJECTED** |
| `../outside.md` / `/etc/passwd` / `C:/x.md` / 空 / `a/./b.md` / `a//b.md` | REJECTED | REJECTED |

blind lane の追加実測ではサブディレクトリ (`.ut-tdd/memory/sub/ok.md`)、`./` 前置、`.ut-tdd/memoryX/`、`.ut-tdd/memory/..` もすべて REJECTED でした。

- CLI port は closure から `export function resolveLiveReviewTaskFile()` へ抽出され、`tests/live-review-projection.test.ts` の `U-RVATT-024` が **`src/cli/review-live.ts` を直接 import して実行**します。旧 HEAD で grep 0 件だった `tests/` → `src/cli/review-live.ts` の import が 2 ファイルで実在します。
- symlink 拒否経路は実際に実行されています (`.ut-tdd/memory` を外部 dir への junction に差し替えて `null` を期待するケースが Windows 上で green。junction 作成に失敗すれば `symlinkSync` が throw して RED になる構造)。

### B-2 (`U-RVATT-027` が実 application composition と delegated verdict を通していない): **是正済み**

- 新規 `tests/review-live-cli.test.ts` の 1 件目が commander の `program.parseAsync(["review","live-consume","--envelope",...])` を実行し、実 envelope decode → 実 `loadCanonicalLiveReviewRequest` → 実 `resolveLiveReviewTaskFile` を通します。
- 2 件目 `U-RVATT-027` が `executeLiveReviewDelegation()` から `process.execPath src/cli.ts claude ... --execute --json` を**実 spawn** し、`UT_TDD_CLAUDE_BIN` に置いた provider stub 経由で receipt を得ます。stub は verdict file への書き込みのみで、provider / model / role / 時刻 / exitCode は実 delegation 側が組み立てています。旧 HEAD の「verdict を手置きし `vi.fn()` で固める」形からは実質的に変わっています。

### B-3 (exact HEAD 束縛の mutation 生存): **是正済み — 変異が RED**

**私が独立に再現しました**:

```
M1: src/feedback/live-review-projection.ts から
    "projection.receipt.head !== request.exactHead ||" の 1 行を削除
→ × U-RVATT-026 rejects tampered, unavailable, same-family, and missing receipt paths
  Tests 1 failed | 12 passed (13)
(復元後 git status --porcelain 空)
```

旧 HEAD では同じ変異が 58/58 green で生存していました。delta で追加された負例 (`runReview` が `head: "b".repeat(40)` の receipt を返し `review_identity_mismatch` を期待する) が確実に殺しています。

## Non-blocking (6)

1. **N-1**: `loadCanonicalLiveReviewRequest` の `normalize(supplied) !== normalize(canonical)` 検査を削除しても green 生存。ただし削除後も読み込み対象は `requestDigest` から導出した `canonical` 固定であり、envelope 側が `requestPath` に `.ut-tdd/review/requests/<digest>.json` 終端を要求するため実害経路は構成できませんでした (引用で反駁済み)。未テストの分岐であることは事実です。
2. **N-2**: `memoryPath` 末尾空白 (`.ut-tdd/memory/ok.md `) が envelope 層で **ACCEPT** されます。Windows は末尾空白を除去するため `ok.md` へ alias し得ます。`dirname` 固定と `memory_id` 一致検査があるため脱出にはなりませんが、境界として未カバーです。
3. **N-3**: 実 CLI composition テスト (1 件目) は `runReview` を stub、実 spawn テスト (2 件目) は `consumeLiveReview` を通りません。`executeLiveReviewDelegation` が `consumeLiveReview` の port として結線された状態を 1 本で通す oracle はまだありません。
4. **N-4**: 1 件目の argv 検証が `expect.arrayContaining` で、`--review-pr` / `--review-memory-id` / `--review-revision` の値が固定されていません (該当変異は未実行のため推測)。
5. **N-5**: `tests/review-attestation.test.ts` の temp dir 検査が `toEqual(before)` から「新規増加 0 のみ」へ緩和されています。並行 suite の干渉回避としては妥当ですが oracle 強度は下がっています。
6. **N-6**: `src/doctor/test-repository-isolation.ts` の `review-live-cli:1` が既存の整列・行構成から外れた独立行で挿入されています (機能影響なし、gate green)。

## 回帰の確認

`src/memory/service.ts` の +52 行は既存 export の変更・削除を含まない純増 (2 export + import 追加)。`tests/memory-service.test.ts` は delta 12 ファイルに含まれず、`ALLOWED_DIR_ACCESS` / `SCAN_ONLY_DIR_ACCESS` は無改変で、同 suite 11 tests green (構造境界 assertion 含む)。新規 oracle は test-design と `test-repository-isolation` の双方に登録済みで `oracle-test-trace` 34 green (実 repo orphan 0)。

## 実測サマリ

- ベースライン: 7 suite **99 passed** (review-custody 24 / claude-memory-wake 23 / review-attestation 23 / live-review-projection 13 / memory-service 11 / cli-delegation 3 / review-live-cli 2)、dependency-drift + oracle-test-trace **48 passed**
- mutation: **M1 (exact HEAD 束縛削除) = RED を私が独立再現**、M2 (canonical path 一致検査削除) = GREEN 生存 (N-1、引用反駁済み)
- envelope decoder probe: 私の 11 入力 + blind lane の 16 ケース
- CI run: linux / windows / aggregate 3/3 SUCCESS (`tsc` / Biome / doctor / 全回帰を含む)

**未確認**: `ut-tdd doctor` は singleton 規律により未起動。旧 HEAD で生存した残り 4 変異 (request の lstat symlink 拒否 / `exactKeys` 厳格 key 検査 / `claude-memory-wake` の memoryPath 検査全削除 / port の `memory_id` 一致検査削除) は今回未実行で、B-1 の防御は「実在すること」「専用テストが実行されること」までの実測です。`publishLiveReviewReceipt` 本体 (実 `gh pr comment`) は全テストで stub 置換のままです (旧 HEAD からの構造移動のみで挙動不変)。非 Windows の symlink 経路は未確認 (当環境は win32、junction で検証)。

## merge について

blocking 0 のため merge 阻害要因はありません。ただし指示された「規定 wrapper (`ut-tdd pr merge`) 経由での merge」は、**本 PR に限り構造的に実行不能**です。`evaluateMergeGate` は現 HEAD に束縛された canonical request + receipt を要求しますが、その receipt を書く live projection 経路を main に入れるのが本 PR 自身であり、`.ut-tdd/review/receipts` は現在 0 件です (node で実測した deny 理由も `no_request_for_current_head` のみ)。

したがって #319 を wrapper で merge することは論理的に不可能で、この 1 件だけは例外の明示承認が要ります。私の判断で `gh pr merge` へ読み替えることはしません。方針を指示してください (詳細は HARNESS memory)。
