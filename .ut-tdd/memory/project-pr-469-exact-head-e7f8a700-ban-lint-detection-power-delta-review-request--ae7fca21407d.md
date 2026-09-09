---
memory_id: memory:project:pr-469-exact-head-e7f8a700-ban-lint-detection-power-delta-review-request--ae7fca21407d
kind: project
title: "PR #469 exact head e7f8a700 BAN lint detection power delta review request"
tags: ["bun-ban", "delta-review", "pr-469", "review-request"]
updated_at: 2026-08-28T07:50:57.430Z
---

PR #469 exact HEAD `e7f8a700` の非著者 delta review 要求 (author family = claude)。

直前の closing review (140ea8f7、receipt `47144e18…`) が返した FLAG blocking 2 への応答。1 件は全面受諾、1 件は半分受諾・半分反証した。

F2 (BAN 検出側 lint の不変条件) — 前半受諾:
`src/lint/github-ci-policy.ts` は `:143` / `:156-160` / `:334` で `oven-sh/setup-bun@v2` / `bun install --frozen-lockfile` / `bun run typecheck` / `bun run test:pack` / `bun run lint` を required step として要求しており、S1-c が workflow から setup-bun を撤去すると必ず Red になる。初版の「4 file の Bun 参照を一切変更しない」は正しい実装を Red にする過剰拘束だった。§3.3 を file 別の表へ書き換え、保護対象を条文の逐語不変から「Bun を検出して fail-close する能力」(deny rule 本数 / allowlist path 集合 / pin 値) へ移した。CANDIDATE-U-PACKBUN-006 も同様に改め、#472 のスコープに required step 追随を追加した。

F2 後半 — 反証:
「runtime-portability.ts が撤去対象 source の Bun debt count を pin しているので追随変更が要る」は成り立たない。`:478-485` は `const pinned = allowlist.get(path) ?? 0; if (seen > pinned)` で判定する上限 pin であり、`:100` も「debt が減る方向は自由」と明記している。S1-b が Bun 参照を減らしても Red にならず、追随変更は不要。

F1 (AC1 oracle) — 受諾:
Issue #450 AC1 は「`ut-tdd setup` を実行し、readiness が `ok: true` になる回帰テスト」なので、CANDIDATE-U-PACKBUN-001 を readiness 関数の単体評価から、Bun 未導入 clean consumer fixture で setup を実際に実行する形へ改めた。
ただし「§5.1 が認める中間状態を Green にできるので #471 の順序自由が AC1 を満たさない」は採らなかった。AC1 が要求するのは readiness ok:true までであり、生成物の動作は AC2 (#470 所有) の守備範囲だからである。この読みの当否も判定してほしい。

判定してほしい点:
1. §3.3 の file 別の扱い (github-ci-policy は追随変更、runtime-portability は不要、rule-drift/toolchain-pin は不変) が実コードの実測と一致しているか。
2. 保護対象を「検出能力」へ移した CANDIDATE-U-PACKBUN-006 が、検出能力の低下 (deny rule 削除 / allowlist への path 追加 / pin 引き上げ) を実際に Red にできる設計か。逆に S1-c の正当な required step 差し替えを Red にしないか。
3. F1 後半を採らなかった判断 (AC1 は readiness ok:true までで、生成物動作は AC2 の守備範囲) が Issue #450 の AC 文言に照らして妥当か。

exact HEAD で `ut-tdd plan lint` Green (checked=937)。CI は Linux SUCCESS、Windows 実行中。
