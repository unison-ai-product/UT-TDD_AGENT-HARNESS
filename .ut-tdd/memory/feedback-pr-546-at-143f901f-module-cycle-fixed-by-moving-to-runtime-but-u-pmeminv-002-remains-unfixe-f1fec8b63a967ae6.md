---
memory_id: memory:feedback:pr-546-at-143f901f-module-cycle-fixed-by-moving-to-runtime-but-u-pmeminv-002-remains-unfixed-normalizetopologypath-does-not-resolve-8-3-short-names-so-path-keys-are-asymmetric--dd4e1cbb0d04
kind: feedback
title: "PR #546 at 143f901f: module cycle fixed by moving to runtime, but U-PMEMINV-002 remains unfixed; normalizeTopologyPath does not resolve 8.3 short names so path keys are asymmetric"
tags: ["ci", "issue544", "path-normalization", "pr546", "windows"]
updated_at: 2026-09-09T02:47:58.725Z
---

## head 143f901fbcedbaaf14c260819719b826e522f616: finding 1 は解消、**finding 2 は未修理**

module cycle は解けています (`src/memory/project-memory-migration.ts` → `src/runtime/project-memory-migration.ts`
へ rename + import を相対化、方式 1 を採択)。一方 **U-PMEMINV-002 の修正が入っていません**。
`tests/project-memory-migration.test.ts` の差分は import path 1 行のみで、実装側も rename 以外の変更なしです。
したがって `harness-check-windows` は同じ assertion で再度赤になります (CI 完走を待たずに先出しします)。

### 非対称の所在 (test 側の期待値ではなく `normalizeTopologyPath` 側)

`src/runtime/worktree-topology.ts:73-78`

```ts
export function normalizeTopologyPath(value: string): string {
  const path = value.replace(/\/g, "/");
  const drive = /^[a-zA-Z]:\//.test(path) ? `${path[0].toUpperCase()}${path.slice(1)}` : path;
  if (drive === "/" || /^[A-Z]:\/$/.test(drive)) return drive;
  return drive.replace(/\/+$/, "");
}
```

正規化しているのは **区切り文字・ドライブレターの大文字化・末尾スラッシュのみ**で、8.3 短縮名は解決しません。
一方 `worktreeRoot` の実測値は `collectWorktreeTopology` 経由で git の出力 (長い名前) に由来します。
そのため

- 期待値: `normalizeTopologyPath(mkdtemp 由来 = C:/Users/RUNNER~1/...)` → 短縮名のまま
- 実測値: git 出力由来 → `C:/Users/runneradmin/...`

となり、**同一ディレクトリの 2 表現が不一致**になります。これは fixture の書き方の問題ではなく、
`normalizeTopologyPath` を「path key の同一性判定」に使っている以上、実運用でも成り立つ欠陥です
(短縮名を含む root を呼び出し側が渡すと、git 出力との突き合わせで別 worktree と判定されうる)。

### 是正案

`normalizeTopologyPath` (あるいは root 解決側) で `realpathSync.native` を通してから正規化し、
短縮名・長い名前・大小文字・junction のいずれの表現でも同一 key に落ちるようにする。
`worktree-topology` は既に junction / identity drift を fail-close 対象にしているので、
path key の canonical 化はその契約と同じ層の責務です。負系は「短縮名 root と長い名前 root が同一 key に
なること」を Windows 実 OS lane の oracle として置くのが対になります。

test 側の期待値を実測に合わせて書き換える対処 (`RUNNER~1` → `runneradmin`) は、非対称そのものを
残すため採らないほうがよいと考えます。判断は著者側にお返しします。
