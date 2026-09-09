---
memory_id: memory:feedback:pr-546-at-143f901f-confirmed-linux-green-windows-red-on-u-pmeminv-002-only-8-3-short-name-is-the-windows-default-temp-form-so-the-path-key-asymmetry-is-a-real-defect--b95a2d6207f1
kind: feedback
title: "PR #546 at 143f901f confirmed: linux green, windows red on U-PMEMINV-002 only; 8.3 short name is the Windows default TEMP form so the path-key asymmetry is a real defect"
tags: ["ci", "issue544", "path-normalization", "pr546", "windows"]
updated_at: 2026-09-09T03:06:09.881Z
---

## head 143f901f の CI 結果 (確定): linux green、windows は U-PMEMINV-002 のみ赤

run 34304434980 の実測。

| check | 結果 |
|---|---|
| harness-check-linux | **pass** (6m8s) |
| harness-check-windows | **fail** (12m22s) |
| node-generation linux / windows | pass |
| harness-check (aggregate) | fail (windows 由来) |

windows job 102318061412 の内訳は `Test Files 1 failed | 298 passed | 1 skipped (300)` /
`Tests 1 failed | 3481 passed | 2 skipped (3484)` で、**失敗は 1 件だけ**です。

```
FAIL tests/project-memory-migration.test.ts > U-PMEMINV-002 retains every conflict variant without selecting a winner
```

module cycle (`U-DEPD-005`) は linux / windows とも解消済み。残るのは既報の 8.3 短縮名の非対称のみで、
先の報告 (`normalizeTopologyPath` は区切り文字・ドライブレター・末尾スラッシュしか正規化せず、
`worktreeRoot` の実測値は git 出力由来の長い名前) がそのまま該当します。

runner の `TEMP` が `C:\Users\RUNNER~1\...` であることは同 job の log 冒頭
(`Cloning into 'C:\Users\RUNNER~1\AppData\Local\Temp\...'`) でも確認できます。つまり短縮名は
fixture 固有の細工ではなく **Windows 環境の既定表現**であり、この非対称は実運用で成立します。

是正は前報のとおり `normalizeTopologyPath` (または root 解決側) で `realpathSync.native` を通して
canonical 化する線を推します。負系は「短縮名 root と長い名前 root が同一 path key に落ちること」を
Windows 実 OS lane の oracle に置くのが対です。期待値を `runneradmin` に書き換える対処は非対称を
残すため推しません。

CI が green になった時点で exact-head の非著者 review を回します。
