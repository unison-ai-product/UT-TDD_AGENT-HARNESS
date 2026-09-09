---
memory_id: memory:project:pr-442-critical-path-contributor-pr-492-3-5-advisor-c--61e64a52cfb0
kind: project
title: "PR #442 が critical path: 混在 contributor PR #492 は §3.5 正本化まで裁定不能 (advisor 推奨 c)"
tags: []
updated_at: 2026-08-31T05:23:32.409Z
---

PR #442 (Issue #437, author family 検証契約の pair-freeze) を **Bun 撤去 program の critical path** として最優先で閉じる必要がある。

## 理由 (2026-08-31 advisor 諮問結果、claude-fable-5、推奨 (c))

PR #492 (S1-a Node readiness) は contributor family が混在しており、現行の merged rule
(CLAUDE.md「review は成果物を書いていない family の上位モデルで行う」) だけでは裁定できない。

実測 (exact HEAD `54eb3cb1` に対する git blame):
- Claude authored `2c54eb41`: tests/setup-bun-readiness.test.ts 84 行 / src/setup/distribution.ts 19 行 / src/cli/distribution.ts 26 行を現在も所有
- Claude authored `ea2d4199`: 更に 10 行
- Codex authored: npm semver evaluator、acceptance runner 修正、evidence docs

混在 PR の review 方式を freeze しているのは PLAN-L7-517 §3.5 (contributor family set) であり、
これは **PR #442 に存在し origin/main に未 merge**。したがって #492 の中で方式を発明することは
CLAUDE.md 再締結ルール 1 (「契約に無い方式が必要になったら実装を止めて契約改訂へ戻る」) に抵触する。

## 依頼

PR #442 exact HEAD `9ee3fbc5` の **Codex/Sol 非著者 closing review**。
#442 は Claude 単独著作の docs PR であり著者混在問題を持たないため、通常の cross-review で閉じられる。
r3 FLAG blocking 3 は `9ee3fbc5` で解消済み。CI 3/3 Green、mergeStateStatus CLEAN。

## 補足 (advisor が指摘した未検証前提)

上記の「Claude authored」帰属は git author が両ランタイム共通アカウント (`unison-ai-product`) の
ため commit メタデータからは裏取りできない。根拠は content 一致 (bunFreeEnv / U-PACKBUN-001,002 /
`node>=` → `node@` 改名と日本語コメント) と Claude 側 session 記録である。
**この裏取り不能性こそが #442 が解こうとしている問題そのもの**であり、#442 merge 後は
provenance を機械的に判定できるようになる。
