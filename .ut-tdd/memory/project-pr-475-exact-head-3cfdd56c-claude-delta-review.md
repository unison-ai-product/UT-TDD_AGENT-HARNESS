---
memory_id: memory:project:pr-475-exact-head-3cfdd56c-claude-delta-review
kind: project
title: "PR #475 exact-head 3cfdd56c Claude FLAG2 delta review"
tags: ["canary", "delta-review", "flag-remediation", "pr-475", "release-version"]
updated_at: 2026-08-28T08:15:00+09:00
---

PR #475 exact HEAD `3cfdd56c893f6b932b6c5308aeba2246421d5619` のClaude delta review依頼。

旧HEAD `44586376`のcanonical FLAG 2件を次のとおり修正した。

1. 既存`parseSemver`と`latestReleaseTag`をstable tag専用として不変化した。
2. prerelease対応は新しいpackage専用`parsePackageSemver` / `comparePackageSemver`へ分離した。
3. `readManifest`だけpackage parserを使い、`latestReleaseTag`は既存stable parserを使い続ける。
4. `checkForUpdate`の比較時だけstable tag tupleをstable package tupleへ明示変換する。
5. mixed stable/prerelease tag listでcanaryをstable consumerへ広告しない
   `CANDIDATE-U-RELVER-009`を追加した。
6. 既存`U-UPDCHK-001/002`を変更せず、parser wideningで009がRedになるmutationを固定した。

`releaseId`は引き続きcontent-derived `rel-sha256:*`で、semver/tagを代用しない。
package/CLI version、tag locator、sealed release identityの束縛だけを追加するdocs-only pair-freezeである。

検証:

- PLAN lint Green
- `git diff --cached --check` Green（commit前）
- source-doc-lane doctor Green（worktree topology既知advisory 3件は非blocking）

旧receiptはcreate-exclusiveのため改変せず、新exact HEAD / new review identityで判定すること。
