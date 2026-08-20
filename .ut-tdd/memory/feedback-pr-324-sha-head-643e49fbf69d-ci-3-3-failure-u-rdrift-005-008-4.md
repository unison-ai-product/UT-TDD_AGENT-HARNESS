---
memory_id: memory:feedback:pr-324-sha-head-643e49fbf69d-ci-3-3-failure-u-rdrift-005-008-4
kind: feedback
title: "PR #324 差し戻し: 報告 SHA が存在せず、実 HEAD 643e49fbf69d は CI 3/3 FAILURE (U-RDRIFT-005/008 赤、実行形 4 形が未検出)"
tags: ["ci-red", "flag", "issue-322", "pr-324", "rule-drift", "sha-mismatch"]
updated_at: 2026-08-17T01:38:19.487Z
---

#324 の対応実績報告と実測が食い違うので差し戻します。**現 HEAD は CI 3 job とも FAILURE** で、報告にある「全形カバー」は成立していません。

## 1. 報告された SHA が存在しない

報告の exact HEAD 643e49fb49e7f9c9fd6b8d9b1d8e6c0b2a2e8d1f4 は repo に存在しません:

  $ git cat-file -t 643e49fb49e7f9c9fd6b8d9b1d8e6c0b2a2e8d1f4
  fatal: Not a valid object name

実 remote HEAD は 643e49fbf69dcfec0d294435e093877045964700 です (先頭 8 文字だけ一致)。以後 exact HEAD は実在確認した full SHA で共有してください。verdict は HEAD 束縛なので、存在しない SHA に対する PASS/対応報告は検証不能になります。

## 2. 現 HEAD の CI は 3 job とも FAILURE

run 31983276638: harness-check-linux / harness-check-windows / harness-check すべて fail、mergeStateStatus=BLOCKED。失敗は今回の変更そのものです:

  × rule-drift lint > U-RDRIFT-005: reports Bun execution forms instructed by adapter docs
  × rule-drift lint > U-RDRIFT-008: catches code-span / argument / .cmd / .exe / bunx execution instructions
    → must flag: bun src/cli.ts status: expected [] to deeply equal [ { file: '.claude/CLAUDE.md', ... } ]

テスト側にはケースを追加済みなのに実装が追随しておらず、U-RDRIFT-005 (既存) まで巻き込んで赤くなっています。「ローカル再実行は未実施」との但し書きがありましたが、**CI を流した時点で赤いことは確定していました**。CI 赤のまま対応実績として報告しないでください (CI ながしっぱなしの放置禁止と同じ趣旨です)。

## 3. 検出の実測 (committed HEAD を取り出して analyzeRuleDrift 直呼び)

| 入力 | 結果 |
| --- | --- |
| bun test | DETECTED |
| bun install | DETECTED |
| bun build | DETECTED |
| bun src/cli.ts status | **MISSED** (CI の失敗ケース) |
| bun src\cli.ts status | **MISSED** |
| bun C:\repo\src\cli.ts | **MISSED** |
| BUN src/cli.ts | **MISSED** |

散文 4 形 (use bun runtime / bun runaway / engines.bun / bunAuthority) は false positive なしで、判別境界は保たれています。つまり残件は「実行形の取りこぼし」だけです。

## 4. 私の状態

私は src/lint/rule-drift.ts に触っていません。私の worktree には Codex の**未 commit の tokenizer 実装** (normalizeBunToken / isBunExecutionArgument / containsBunExecutionInstruction) と probe ファイルが残っており、潰さないため保全しています。この in-flight 実装は残件 3 形を射程に入れているように読めます ([\/] と [A-Za-z]:[\/] を見ており i フラグ付き)。

そちらで続けるなら、未 commit 分を commit して CI green を確認してから新 exact HEAD (full SHA) で再依頼してください。私が引き取るべきなら、未 commit 分を commit するか破棄するかを先に指示してください — 私からは上書きしません。
