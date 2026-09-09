---
memory_id: memory:feedback:pr-492-exact-head-54eb3cb1-claude-opus-closing-pass-weak-blocking-0--f86d28e68490
kind: feedback
title: "PR #492 exact-head 54eb3cb1 Claude Opus closing PASS-WEAK blocking 0"
tags: ["claude-review", "closing-verdict", "pr"]
updated_at: 2026-08-31T05:58:20.859Z
---

# PR #492 non-author Claude Opus closing verdict

- exact_head: `54eb3cb1b53c3305e5c5d306c581d6faf7b32a17`
- base: `7cc607722ef78340c4b71020d38b04e8bc10f1da`
- reviewer: Claude Opus (non-author closing gate)
- verdict: PASS-WEAK
- blocking: 0

## 確認したこと

- `src/cli/distribution.ts`: 外部 `bun --version` probe (win32 の ComSpec 経由分岐を含む) を
  撤去し、観測値を実行中 node 自身の `process.versions.node` にした。probe spawn が消えたので
  Windows の shim 依存も同時に消える。
- `requiredNodeVersion` は consumer package root の `package.json` `engines.node` のみを読む
  (第二の pin を作らない)。読めない/空なら `null` → `satisfiesRequiredNode` が fail-close。
- `satisfiesRequiredNode` は自作 parser を捨てて npm の semver 文法
  (`valid` / `validRange` / `satisfies`) に委譲。旧 `hasMinimumBun` の tilde 誤判定と
  partial-hyphen 上限誤判定は `tests/setup-bun-readiness.test.ts` の 6 assertion
  (`~24`, `24.13 - 24.14`, `>=24.13 <25`) で個別に殺されており、恒真でない。
- check 名を `node@<range>` にして bare version = **exact 一致**という npm 意味論と
  表示を一致させた点は妥当 (`node>=x` 表示だと 24.14.0 が落ちる理由が読めない)。
- U-PACKBUN-001 は readiness 関数の単体呼び出しではなく実 CLI 実行で測り、かつ
  「Bun が本当に到達不能」を独立 probe (`expect(probe.status).not.toBe(0)`) で先に固定して
  いるので恒真テストになっていない。PATH から Bun 系 entry だけを落とし git/gh を残す設計も
  「別理由で Red」を避けており妥当。
- `ok: nodeOk && hasGit && (hasUtTddCli ?? true)` の判定形は不変。旧 `bunOk` の位置に
  `nodeOk` が入っただけで、predicate の弱体化はない。

## non-blocking 1: 失敗メッセージが exact 一致意味論と矛盾する

`src/setup/distribution.ts` の失敗時 message は
`Install Node ${requiredNodeVersion} or newer before setup` である。しかし同じ変更の
コメントが明記するとおり bare `engines.node` は npm 意味論で**厳密一致**であり、
`engines.node="24.13.0"` の下で Node 24.14.0 は落ちる。check 名を意味論に合わせた
同じ理由がこの message には適用されていない。「or newer」に従った consumer は
ready にならない。check 名と同様 `engines.node` の range 表記をそのまま提示する形へ
訂正するのが望ましい。

## non-blocking 2: テストが `engines.node` の現在値をハードコードしている

`tests/setup-bun-readiness.test.ts` は `expect(names).toContain("node@24.13.0")` と
`checks.find(c => c.name === "node@24.13.0")?.ok` で **repo の現在の engines.node 値**を
固定している。fixture は repo の `package.json` を copy して使うので、Node pin を上げる
(本 program がまさに行う) たびにこのテストが落ちる。fixture の `package.json` から
`engines.node` を読んで期待値を組み立てれば、pin 変更に対して不変になる。

## 判定理由

上記 2 件はいずれも生成物の正しさ・gate の判定結果を変えないため blocking にしない。
PASS-WEAK として merge 可。ただし non-blocking 1 は consumer 向け remediation 文言の
実害があるので、後続 PR で必ず閉じること。
