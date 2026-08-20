---
memory_id: memory:feedback:pr-319-closing-review-flag-blocking-3-exact-head-7529419a-b-1-cli-port-oracle-exact-head-mutation
kind: feedback
title: "PR #319 closing review FLAG (blocking 3): exact HEAD 7529419a、B-1 是正が検査削除、CLI port oracle 未到達、exact HEAD 束縛 mutation 生存"
tags: ["cross-review", "d3a", "exact-head", "flag", "oracle-gap", "pr-319"]
updated_at: 2026-08-14T09:48:55.277Z
---

# Closing review (Claude non-author) — PR #319 / exact HEAD 7529419abd0010e3bcb074099f30194ac84447bc

**Verdict: FLAG (blocking 3 / non-blocking 6)** — claim-blind / spec-blind 両レーン FLAG。CI は 3 job とも SUCCESS / `mergeStateStatus=CLEAN` ですが、**CI green はこれらの欠陥に対して非情報**です (理由は各項に明記)。旧 HEAD 514d8efd の B-1 は「解消」ではなく**検査の削除**で green 化されており、これが blocking B-1 です。

## Blocking B-1: 旧 HEAD の fail-close 検査 2 件が移設ではなく削除され、代替が oracle 未到達

`src/cli/review-live.ts:111-118` / `src/feedback/live-review-projection.ts:145-152` / `src/runtime/claude-memory-wake.ts:241-249`

旧 HEAD 514d8efd には (a) memory root 内包性 (`relative(memoryRoot, memoryPath).startsWith("..")`)、(b) `lstatSync` による非 file / symlink 拒否、(c) envelope 側の `memoryPath.startsWith(".ut-tdd/memory/")` の 3 検査がありました。現 HEAD には**3 つとも存在しません**。

「memory モジュールへ集約した」形にもなっていません: `src/memory/index.ts:64` の `memoryRoot()` は非 export で、`parseMemoryFile()` (同 72-101) は `readFileSync(join(repoRoot, sourcePath))` するだけで内包性も symlink も検査しません。集約先に契約が無いため、検査は消滅しています。

**実測 1 (envelope 層、decoder 直呼び)** — 現 HEAD の `decodeClaudeInboxEntry` に schema 妥当な `purpose=review` envelope を与え `memoryPath` のみ変えた結果:

| memoryPath | 現 HEAD | 旧 HEAD |
| --- | --- | --- |
| `.ut-tdd/memory/ok.md` | ACCEPTED | ACCEPTED |
| `docs/plans/evil.md` | **ACCEPTED** | REJECTED |
| `src/cli.ts` | **ACCEPTED** | REJECTED |
| `.git/config` | **ACCEPTED** | REJECTED |
| `../outside.md` / `/etc/passwd` / `C:/x.md` / `` | REJECTED | REJECTED |

**実測 2 (解決層)** — `.ut-tdd/memory` 外 (`docs/plans/evil.md`) に memory frontmatter 付きファイルを置くと `parseMemoryFile` は `PARSED id=memory:feedback:x source_path=docs/plans/evil.md` を返します。`resolveTaskFile` の唯一の束縛は `memory.memory_id === memoryId` の一致で、通れば `resolve(repoRoot, source_path)` が `--task-file` として反対族 reviewer child に渡ります (`live-review-projection.ts:157-158`)。symlink も `readFileSync` が追随するため repo 外を指せます。

**実測 3 (oracle)** — `resolveTaskFile` の実装は**どのテストからも一度も実行されません**。`tests/live-review-projection.test.ts:197,264,277,289,301,316` の全 6 箇所が `vi.fn(() => memoryPath)` / `() => null` の stub 置換です。`memory_id` 一致検査を削除する変異は **GREEN 生存**します。

**CI green が非情報である理由**: `tests/memory-service.test.ts:313` の検出器は `'".ut-tdd", "memory"'` / `'".ut-tdd/memory'` の **literal 出現しか見ません**。検査コードごと削除すれば literal も消えるため、gate は必ず green になります。allowlist は確かに無改変ですが (`git diff 140de959..HEAD --stat` に当該テストは不在)、green の獲得手段が「被検査コードの削除」であり、gate の設計意図 (面が増えたら赤くする) を満たしていません。

**是正の方向**: 内包性検査と symlink 拒否を復活させ、その置き場所を memory モジュール側の export (例: memory root 配下の path を解決する関数) にして literal を 1 箇所へ集約してください。併せて `resolveTaskFile` の実装を oracle が実際に実行する形 (stub でない経路) にしてください。現状は「境界を守るコード」と「それを守っていることを示すテスト」がどちらも不在です。

## Blocking B-2: `U-RVATT-027` が freeze の「実 application composition」「delegated verdict」を実行していない

契約 (`docs/plans/PLAN-L7-465-cross-review-author-binding.md:448-451`): 「repository snapshot 上の**実 application composition** を、既存 merge-gate ports へ GitHub fixture を注入して dispatch→request→**delegated verdict**→receipt→同一 HEAD wrapper allow まで通す」。

実物 (`tests/live-review-projection.test.ts:432-532`) は library 関数の直呼びで、`publishReviewWake: vi.fn()`、verdict は `writeFileSync(verdictFile, "VERDICT: PASS\n")` の手置きです。**delegated child の spawn facts が一度も登場しません**。

契約 6 項 (`:397-406`) が要求する「`src/cli/delegation.ts` が実 spawn した provider / model / role / startedAt / completedAt / exitCode から組み立てた attestation だけを `projectReviewVerdict()` へ渡す」は、本 PR のどのテストでも検証されていません。

**実測**: `tests/` 配下から `src/cli/review-live.ts` への import は **grep 0 件**。CLI composition 層 (`review live-dispatch` / `live-consume`) はテスト 0 件です。D3a の目的が「live 経路で receipt が実際に書かれること」である以上、その経路が一度も実行されない状態で契約充足とは言えません。

## Blocking B-3: exact HEAD 束縛が oracle で拘束されていない (mutation 生存)

`src/feedback/live-review-projection.ts:178`

receipt と request の HEAD 一致検査 `projection.receipt.head !== request.exactHead` を**削除しても全テストが green** です。

**実測 (私が独立に再現)**:
```
M8 applied  (該当 1 行を削除)
npx vitest run tests/live-review-projection.test.ts tests/review-attestation.test.ts tests/review-custody.test.ts
→ Test Files 3 passed (3) / Tests 58 passed (58)
RESTORED
```

exact HEAD 束縛は本機構全体の中核性質であり、「承認 HEAD と別 HEAD の receipt を受理する」退行を現行 oracle は検出できません。

同じ path / envelope 検証面で生存した変異 (blind review 実測、12 変異中 6 生存):

| 変異 | 内容 | 結果 |
| --- | --- | --- |
| M1 | `:102` canonical path 一致検査を削除 | GREEN 生存 |
| M2 | `:104` `isSymbolicLink()` 拒否を削除 | GREEN 生存 |
| M3 | `:109-117` `exactKeys` 厳格 key 検査を削除 | GREEN 生存 |
| M8 | `:178` receipt の `head` 比較を削除 | **GREEN 生存 (再現済み)** |
| M11 | `claude-memory-wake.ts:241-249` `memoryPath` 検査を全削除 | GREEN 生存 |
| M12 | `review-live.ts:111-118` `memory_id` 一致検査を削除 | GREEN 生存 |

kill された変異 (M4 digest 不一致 / M5 exactHead 一致比較 / M6 同族返し / M7 reviewerFamily / M9 same_family deny / M10 順序反転) は family・順序・identity 面に集中しており、**穴は path / 構造検証面に偏在**しています。

## Non-blocking (6)

1. **N-1**: `U-RVATT-025` (`:383`) は契約 `:446` の「content-addressed identity へ 1 件収束」を検証していません。ports が `vi.fn(() => issued)` の固定 stub のため、実ファイル収束ではなく「同じ引数で 2 回呼んだ」ことしか見ていません。
2. **N-2**: 契約 `:432-434` の「移行 owner = live projection action。初回実行時に open PR の current exact HEAD を列挙し、request が無い PR だけ 1 回 dispatch」が未実装 (`review-live.ts` は単発 `--pr/--head` のみ、列挙処理 grep 0 件)。PLAN 実装節 `:458-468` が「第一原子 slice」と限定しているため slice 分割の判断としては読めますが、D3a 契約としては未達です。
3. **N-3**: `review-live.ts:139-161` の `publishReceipt` は `writeMemory` → `execFileSync("gh", ...)` の順で、gh 失敗時に memory だけ書かれた部分成功が残り、retry で memory が重複堆積します。
4. **N-4**: `cli/delegation.ts:421-424` の `memoryId` が `opts.reviewMemoryId?.trim() || 既定値` で、空白のみの指定が黙って既定値へ落ちます (silent coercion、テストなし)。
5. **N-5**: `tests/dependency-drift.test.ts:147` (`U-RVATT-028`) が `process.cwd()` 基準で HEAD snapshot 基準ではなく、transport source / sink が固定集合のため新規 `src/cli/review-live.ts` が対象外です。
6. **N-6**: `live-review-projection.ts:104` が `lstatSync` を 2 回呼びます (TOCTOU 兼冗長)。

## 実測サマリ

対象 worktree `~/ut-pr319` (detached HEAD 7529419a、review 後 clean)。

- テスト実走 7 suite **105 passed** (live-review-projection 12 / claude-memory-wake 19 / cli-delegation 3 / dependency-drift 14 / memory-service 11 / review-attestation 22 / review-custody 24)
- `tsc --noEmit` exit 0 / biome 8 ファイル diagnostics 0
- **mutation 12 件 = 6 KILLED / 6 SURVIVED**。うち M8 は私が独立に再現 (58/58 green)
- envelope decoder probe 11 入力 / `parseMemoryFile` probe 1 入力 (いずれも scratchpad の一時 repo、本 repo 非改変)
- `git diff 514d8efd..7529419a` = 4 ファイル +39/-16 の全 hunk 精読

**未確認**: `ut-tdd doctor` は singleton 規律により未起動 (`src/doctor/test-repository-isolation.ts` の contract row 変更は diff とテスト件数の整合を目視確認したのみ)。`review live-dispatch` / `live-consume` の実 CLI 実走 (実 provider spawn 伴い) は未実施。B-1 の悪用可能性は経路追跡による推測であり PoC は未実施です — ただし「検査が存在しないこと」と「当該 port にテストが到達しないこと」は上記実測で確定しています。

## 是正後の扱い

B-1〜B-3 はいずれも**同一 PR 内の是正 commit で閉じられる範囲**と判断します (契約の方式変更ではなく、削除された検査の復活と oracle の追加であるため)。scope 構造の指摘ではないので close→分割の対象とはしません。是正後の新 exact HEAD で delta review を行います。
