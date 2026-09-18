---
memory_id: memory:project:pr-204-merge-issue-203-live-lane-carry-203-close
kind: project
title: "PR #204 merge 完了 (issue #203 live-lane) — 判定経路と carry、#203 を close しない理由"
tags: ["2026-07-31", "cross-review", "issue-203", "issue-206", "issue-98", "merge", "pr-204"]
updated_at: 2026-07-31T05:35:40.387Z
---

PR #204 (issue #203 の live-lane 修正) を **merge した** (`0d19def5`)。順序契約 2026-07-31 の F2 完了。

## 判定の経路 (family 分離は守られている)

- 実装 author = **Codex** (terra が Red oracle、luna が実装)。
- **Codex 独立監査** = 局所 PASS-WEAK。closing authority は Claude 側に残すと明言。
- **Claude blind closing review (a30ed8b6)** = **FLAG** blocking 2 件。
- 修正 (`ae619953`) 後の **Claude blind re-review (delta 限定)** = **PASS-WEAK / blocking 0**。
- CI = linux / windows / 集約すべて green。公式 snapshot runner = **33 tests passed** (orchestrator 実測)。

## Codex 独立監査が見つけた実物 (実測で裏取り済み)

`scripts/run-vitest-snapshot.ts` の `copyReferenceRuntimeInputs()` → `snapshotContentFingerprint()` に
DB content-read 経路が残る。ただし性質が違う:

| 対象 | 実測サイズ | 書き換え主体 | 生む症状 |
| --- | --- | --- | --- |
| live worktree の DB | 3.78GB (主 worktree 4.66GB) | 常駐 `session db-refresh` daemon | ハング / EBUSY / 偽 Red |
| reference snapshot の DB | 67,391,488 B (~67MB) | runner 自身の `db rebuild`、seal 後は不変 | **固定費のみ** |

reference 側は seal 後に変わらないので hash するのが**正しい** (seal 検証)。除外は検知力を落とす。
→ **issue #98 (runner 固定費) の層**。よって Codex 提示の収束条件 2 を採り、**issue #203 は close しない**。

## carry (issue 化済み / 未化)

- **issue #206 (新規起票)**: oracle ID の一意性を機械検査していない。`oracle-test-trace` は
  declared→cited の一方向のみで、**8 件の全件衝突が gate を素通りした**。issue #165 と同じ穴の別断面。
- **N-2 (未 issue)**: doc コメントの「= 読んでいない」は over-claim。oracle が確立するのは
  「entry に content 由来 digest が入っていない」であって「open していない」ではない。
  「読んでから捨てる」変異は green のまま通る。
- **F-4 (未 issue)**: `-wal` / `-shm` / `-journal` は内容のみ免除で**存在は非免除**。
  daemon の生成・削除で entry 増減 → 偽 Red が残る。
- **snapshot lane の fence が存在しない**: `global-setup.ts` は fenceRoot と headRoot しか
  fingerprint せず、テストが実際に走る `snapshotRoot` は無 fence。本 PR 以前からの状態。

## 実測した運用上の重要事実

- **snapshot 残置 180 個** — runner の cleanup がテスト本体より遥かに遅く timeout で殺されるため
  temp に溜まる。170 個を削除したら同じ runner が exit 0 で完走するようになった。→ #98
- **runaway `session db-refresh` の再発** — worktree 作成直後に起動し 27 分継続、DB を
  1.0MB → 3.78GB へ。`PLAN-L7-460` の guardrail が効いていない。→ #169 / #178 と同時に扱う。
