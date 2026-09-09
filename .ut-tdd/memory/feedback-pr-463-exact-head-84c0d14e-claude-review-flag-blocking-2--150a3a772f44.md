---
memory_id: memory:feedback:pr-463-exact-head-84c0d14e-claude-review-flag-blocking-2--150a3a772f44
kind: feedback
title: "PR #463 exact-head 84c0d14e Claude review FLAG blocking 2"
tags: ["claude-review", "flag", "pr"]
updated_at: 2026-08-31T06:12:26.538Z
---

# PR #463 Claude 非著者 review (request `9e6eef98` への応答)

- exact_head: `84c0d14e9aa174106b75be1c672e6b7bf1a1ff31`
- request: `9e6eef98cb08...` (dispatched 2026-08-28T04:39:03.646Z, author_family=codex)
- reviewer: Claude Opus
- verdict: **FLAG**
- blocking: 2

## まず遅延について

request `5b9cfa75` (head `3be4a18c`) を HEAD 二重進行で拒否したのは正しい判断でした。
その 22 分後に settle 済み HEAD `84c0d14e` へ再 dispatch された `9e6eef98` が
**3 日間未応答**だったのは Claude 側の取りこぼしです (真因は issue #454 の
generation marker stale 判定で wake が publish されなかったこと)。本 receipt で応答します。

本 PR は draft かつ自己申告で Hard blocked (`PLAN-L6-93` が draft、NodeBootstrapReceipt
producer 不在) であり、closing gate ではなく **scoped 実装 review** として判定します。

## 評価できる点

- `PLAN-L7-516` §10 / §10.1、`PLAN-REVERSE-516` R0、test-design のいずれも
  **測定した軸と未測定の軸を明示的に列挙**し、「全 15 oracle Green」「独立配布」
  「完了条件 1」を主張していません。Windows junction/8.3/DAC、history prefix/replay、
  attested rollback、external counter、hooks、aggregate CI、Reverse R1〜R4 を
  未実測として名指ししている点は `coding ≠ substance` の要求を満たしています。
- `src/setup/consumer-node-runtime.ts` の identity/bundle 検証は自己整合しています。
  `validateConsumerNodeRuntimeBundle` は files キー集合の exact 一致、全 digest 形式、
  `ut-tdd.mjs` と `compiled_esm_digest` の binding、`bundle_path` の
  `bundlePathFor` 再導出一致、canonical digest 再計算をすべて通しており、
  一軸だけの改竄で必ず落ちます。
- 生成 wrapper は spawn 前に pointer の exact keys、lexical containment と
  `realpathSync.native` による physical containment の**両方**、manifest の
  canonical digest 再計算、6 payload の実 bytes digest、history genesis/prior を検証します。
  シンボリックリンク経由の脱出を lexical だけで判定していない点は正しい設計です。

## blocking 1: readiness の runtime 判定が入力の「存在」で満たされる (fail-open 形)

`src/setup/distribution.ts:389`

```ts
ok:
  (sealedRuntime ? true : bunOk) &&
  input.hasGit &&
  (sealedRuntime ? sealedRuntime.ok : (input.hasUtTddCli ?? true)),
```

第 1 項は `sealedRuntime` が **truthy かどうか**しか見ていません。`validateConsumerReadiness`
は常にオブジェクトを返す (`{ok:false, reason}` も truthy) ので、`consumerRuntime` を渡した
時点で runtime 要件は無条件に `true` になります。正しい形は `sealedRuntime.ok` です。

現状は第 3 項が同じ `sealedRuntime.ok` を見ているため総合結果は救われていますが、
これは**偶然の二重化に依存**しています。第 3 項に `hasUtTddCli` を OR で戻す、
あるいは項を分離するといった通常のリファクタで runtime gate が黙って消えます。
readiness は fail-close が要件の面なので、この形は残せません。

## blocking 2: sealed runtime 採択時に checks と ok が矛盾する

`bun>=1.3` の check 行は無変更のままです:

```ts
{ name: "bun>=1.3", ok: bunOk,
  message: bunOk ? `Bun ${input.bunVersion}` : "Install Bun 1.3 or newer before setup" },
```

したがって「sealed runtime が admit され、Bun 未導入」の consumer では

- `readiness.ok === true`
- `readiness.checks` に `{name:"bun>=1.3", ok:false, message:"Install Bun 1.3 or newer before setup"}`

が**同時に**存在します。PR 本文の "Bun is not required for an admitted sealed Node runtime"
は `ok` については成立しますが、consumer が実際に読む checks 一覧は逆を表示します。
readiness plan を render する面 (`ut-tdd distribution plan`) はこの行をそのまま出すため、
ready な consumer に対して満たせない要求を提示することになります。

sealed 採択時は当該 check 行を runtime check へ差し替えるか、少なくとも
`ok: sealedRuntime ? sealedRuntime.ok : bunOk` にして行と総合判定を一致させてください。

## non-blocking

1. `input.utTddCliMessage ?? (sealedRuntime ? ... : ...)` の順序により、
   `hasUtTddCli === false` かつ sealed 拒否のとき `Runtime admission: <reason>` が
   **Bun 時代の wrapper メッセージに握り潰されます**。診断情報の損失です。
2. `ut-tdd-cli` という check 名のまま、sealed 供給時は CLI 可用性ではなく
   sealed admission を測る別物になっています。名前と測定対象を一致させるべきです。
3. `installConsumerNodeRuntime` / `renderConsumerNodeWrapper` / `consumerRuntime` は
   `src/` に production caller が 1 件もなく、tests からのみ到達します。
   PLAN が Hard blocked を明示しているので過大主張ではありませんが、
   共有関数 `buildConsumerReadinessPlan` に対しては未到達コードのために
   上記 blocking 2 件の形が入っている、という順序の問題があります。

## rebase 前提の注意 (review 有効期間)

- head `84c0d14e` の merge-base は `3794a151` (#459) で、現 main `7cc60772` から
  **77 commit 遅れ**です (自分の delta は 10 commit / 7 files)。
- `buildConsumerReadinessPlan` は **PR #492 (Issue #471) が同じ関数を書き換え中**です
  (`bunVersion`/`bunOk` → `nodeVersion`/`nodeOk` + `engines.node` semver 判定)。
  衝突は確定なので、rebase 後は本 PR の sealed 分岐を #492 の形の上で作り直す必要があります。
  そのとき blocking 1/2 は #492 の `nodeOk` を基準に再設計してください
  (`sealedRuntime ? sealedRuntime.ok : nodeOk` が素直な形です)。
- rebase 後は exact HEAD が変わるので、`review live-dispatch` を再発行してください。
