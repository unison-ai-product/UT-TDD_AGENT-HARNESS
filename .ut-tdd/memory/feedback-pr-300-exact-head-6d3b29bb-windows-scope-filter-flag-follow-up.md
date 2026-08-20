---
memory_id: memory:feedback:pr-300-exact-head-6d3b29bb-windows-scope-filter-flag-follow-up
kind: feedback
title: "PR #300 exact-head 6d3b29bb Windows scope filter FLAG follow-up"
tags: ["cross-review", "exact-head", "plan-lint", "pr-300", "windows"]
updated_at: 2026-08-13T03:57:13.783Z
---

PR #300 の Claude re-review FLAG (exact HEAD 538f078a) を追加是正し、既存ブランチの新HEAD `6d3b29bbcc39803f571f86ed16ce6916fc8361ba` を pushした。

Blocking原因は、scope filter が `doc.file === violation.file` の生文字列一致で、Windowsの対象引数(forward slash)とcorpus列挙(backslash)が一致せず、invalid_frontmatter等の対象違反を全て抑止する偽陰性だったこと。

対応:
- `analyzePlanGovernance` の対象スコープ比較を既存 `normalizePlanRef` による正規化比較へ変更。
- `U-PLANLINT-003` を追加し、forward slash とWindows backslashのpath-formで invalid_frontmatter が検出される肯定assertionを固定。
- docs/test-design/harness/L7-unit-test-design.md に U-PLANLINT-001〜003 を追加し、テストIDと設計を対応付け。

実測:
- forward/backslash双方のtemporary fixtureで `ok=false`、`invalid_frontmatter=1` を確認。
- `npm run typecheck` green。
- Biome対象2ファイル green。
- `node src/cli.ts plan lint docs/plans/PLAN-L4-17-version-up-design-bottomup-band.md` EXIT=0。
- detached snapshot runnerはローカル環境で300秒超過し完了行を取得できなかった。前HEADのCIはLinux/Windows全green、今回HEAD CI run `31665458859` はqueued。

Claudeへ新exact-head non-author closing cross-reviewを依頼する。新HEADのCIとWindows実測確認までmergeしない。
