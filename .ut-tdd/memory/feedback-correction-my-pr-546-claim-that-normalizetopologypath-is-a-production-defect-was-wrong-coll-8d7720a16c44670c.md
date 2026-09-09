---
memory_id: memory:feedback:correction-my-pr-546-claim-that-normalizetopologypath-is-a-production-defect-was-wrong-collector-and-project-memory-root-both-realpath-so-the-failure-was-a-test-expectation-defect-only--f15a759580e8
kind: feedback
title: "Correction: my PR #546 claim that normalizeTopologyPath is a production defect was wrong; collector and project-memory-root both realpath, so the failure was a test-expectation defect only"
tags: ["ci", "correction", "issue544", "pr546", "windows"]
updated_at: 2026-09-09T03:22:39.116Z
---

## 訂正: `normalizeTopologyPath` を production 欠陥と断じた私の指摘は誤りでした (head e695ef64)

先の 3 報で「`normalizeTopologyPath` が 8.3 短縮名を解決しないため実運用でも path key の非対称が成立する」と
書きましたが、これは**根拠不足の誤りです**。実測して撤回します。

- `src/runtime/worktree-topology-collector.ts:104` は `normalizeTopologyPath(realpathSync.native(path))` で、
  **collector 側が既に realpath 正規化しています** (275 / 284 行も同様)。したがって topology 由来の path key は
  短縮名を持ちません。
- 突き合わせ相手の `root.canonicalProjectRoot` も `src/runtime/project-memory-root.ts:92` で
  `ports.realpath(dirname(gitCommonDir))` から作られており、同じく canonical です。
  `project-memory-migration.ts:107` の `worktrees.includes(...)` が短縮名で fail-close する経路は
  存在しません (実際、前回の windows job はこの検査を通過して assertion まで到達しています)。

失敗の原因は実装ではなく **test の期待値が caller 引数 (`mkdtemp` 由来の短縮名) を根拠にしていたこと**でした。
私は「実装が正規化していない」と誤読しました。

### 今回の修理 (e695ef64) の評価

`canonicalWorktreeRoot()` を `git rev-parse --show-toplevel` から導出して期待値の根拠を実装と同じ canonical 源に
そろえたのは妥当で、私が懸念した「期待値を `runneradmin` に書き換えて非対称を残す」対処ではありません。
さらに `expect(new ProjectMemoryMigration().dryRun(linked)).toEqual(result)` を追加し、**呼び出し側の入力
綴りが inventory に漏れないこと**を oracle にしています。これは元の failure の再発を実際に検出する負系で、
期待値合わせではありません。

1 点だけ注記 (blocking ではありません): 追加された `dryRun(linked)` は primary / linked という**入口の違い**を
突いており、同一ディレクトリの短縮名 / 長い名前という**綴りの違い**そのものは fixture の両 root がともに
`mkdtemp` 由来のため直接は突いていません。コメント文の主張 (「TEMP may use an 8.3 alias」) を厳密に
oracle 化するなら、同一 root の短縮名表現を別途渡す negative を Windows 実 OS lane に置く形になります。
現行でも元の failure は再発検出できるため、必須とは考えません。

windows CI の結果を待って、green ならこの head で exact-head の非著者 review を回します。
