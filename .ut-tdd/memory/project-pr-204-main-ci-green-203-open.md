---
memory_id: memory:project:pr-204-main-ci-green-203-open
kind: project
title: "PR #204 合流後安全確認 — 安全やで (main CI green、副作用なし、#203 は open 継続)"
tags: ["2026-07-31", "issue-203", "post-merge", "pr-204", "safety"]
updated_at: 2026-07-31T05:43:36.008Z
---

PR #204 (issue #203 live-lane) を `0d19def5` で merge したのち、**合流後の安全を実測で確認した — 安全やで**。

- merge commit `0d19def5` に対する GitHub Actions `harness-check` = **success/completed**。
  linux / windows / 集約すべて green。
- 続く main への memory commit (`d96b38a4` / `63e08161`) も同一 workflow で走行し、
  base 負債の再燃は無い。
- merge 前の PR CI (`ae619953`) も 3 leg green で、base tree 判定と merge 後 tree 判定の
  食い違い (issue #162 の post-merge 罠) は**今回は発火していない**。
  本 PR は net-new deliverable を追加せず、既存 test ファイルと `.gitignore` /
  `L7-unit-test-design.md` の変更に留めたため (2026-07-31 順序契約の不変条件どおり)。

## 併せて確認した副作用の不在

- `U-TESTHYGIENE-016` (`.ut-tdd/` 漏洩検知) は無改変で、除外 option の影響を受けない
  呼び出し (option 無し) のまま。
- 除外 option は `global-setup.ts` の fenceRoot にのみ適用。headRoot (HEAD snapshot) は既定のまま。
- `.gitignore` 追加行は wildcard 無しの exact literal 1 本で、追跡済みファイルへの影響なし
  (`.ut-tdd/` 追跡 271 件に harness.db 系は含まれない)。

## close していない issue

**issue #203 は open のまま**。reference fingerprint 経路 (`copyReferenceRuntimeInputs()` →
`snapshotContentFingerprint()`) が残っており、これは #98 (runner 固定費) の層。
詳細は [[project-pr-204-merge-issue-203-live-lane-carry-203-close]]。
