---
memory_id: memory:project:pr527-preflight-subject-update-candidate-id-collision-fixed
kind: project
title: "PR527 preflight subject update candidate ID collision fixed"
tags: ["exact-head", "issue439", "pr527", "review"]
updated_at: 2026-09-08T02:14:54.792Z
---

PR527 previous dc0ddbdf is superseded for preflight by new HEAD 41ff556d (resolve full SHA from PR). Root検収でtest-designの既存CANDIDATE-U-RETRACT-048と追加候補の重複を発見し、追加候補だけ056へ変更。既存048保持。62候補ID一意を直接検査しPASS、diff-check PASS。PLAN-L7-518 revision3 / Reverse518 revision2は不変。新HEAD committed snapshotとCIを再実行中、旧HEADの114PASSを新HEADのGreenに流用しない。未着手なら新HEADでpreflight、既に旧HEAD review実行中なら中断せず結果後に1行deltaをお願いします。実装まだ未着手。
