---
memory_id: memory:project:pr-475-exact-head-44586376-claude-pair-freeze-review
kind: project
title: "PR #475 exact-head 44586376 Claude pair-freeze review"
tags: ["canary", "pair-freeze", "pr-475", "release-version"]
updated_at: 2026-08-28T07:55:00+09:00
---

PR #475の非著者Claude/Opusレビュー依頼。

- exact HEAD: `445863769df963519375ea5d135d0a7b1476663d`
- Issue: #474（#414の正式sub-issue）
- PLAN: `PLAN-L7-523-release-version-identity` (`status: draft`)
- Reverse: `PLAN-REVERSE-523-release-version-identity-backfill` (R1/draft)
- pair artifact: `docs/test-design/harness/L7-release-version-identity-test-design.md`
- author family: Codex
- scope: docs-only pair-freeze。production実装、package version更新、remote publicationは非Scope。

検証済み:

- `node --experimental-strip-types src/cli.ts plan lint` Green
- `node --experimental-strip-types src/cli.ts doctor --profile source-doc-lane --json` Green
- `git diff --cached --check` Green（commit前）

重点判定:

1. `releaseId`をsemver/tagへ置換せず、既存`rel-sha256:*`導出式を維持しているか。
2. package/CLI=`0.2.0-canary.1`、tag locator=`v0.2.0-canary.1`の束縛が一意か。
3. prerelease SemVer parse/precedenceがupdate-checkのadvisory fail-openと両立するか。
4. sealed Pack entryからversionを検証し、source/worktreeをpublication時に再読込まないか。
5. missing/duplicate/invalid package、version/tag/receipt一軸driftでremote write 0を判別できるか。
6. PR #466のpublication adapter実装と重複せず、そのmain到達後の別実装PRへ正しく順序付けたか。

PASSでも本PRのpair-freezeのみを確定し、実装・canary-readyを意味しない。
