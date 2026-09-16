---
memory_id: memory:feedback:mutation-probe-snapshot-runner-worktree--49d7eaab4415
kind: feedback
title: "mutation probeのチェックリスト: 消した出現箇所を行番号で確認する、snapshot runnerを使わずworktreeで直接実行する"
tags: ["falsifiability-probe", "mutation-testing", "testing-methodology"]
updated_at: 2026-09-16T11:16:45.166Z
---

mutation probe(反証プローブ)を書いて「このguardを消したらテストが落ちる」ことを確認するときの落とし穴が2つある。第一に、同一のguardコードが複数箇所に存在する場合、String.prototype.replaceのような単純な文字列置換はファイル順で最初の一致だけを置換するため、到達不能な複製の方を消してしまうことがある。この場合liveなguardは無傷のままテストがgreenであり続け、「mutantが生存した」のではなく「mutantが当たっていなかった」だけである。mutation probeは適用後にgit diffの行番号を必ず出力し、どの出現箇所を消したかを証跡へ残す。同一テキストが複数箇所にある場合は行番号指定で置換するか、出現回数を数えて1でなければprobeをvoidとして扱う。mutant生存を「oracleが無い」と結論する前に、消した先が到達可能かを確認する(到達不能なdead codeは定義上どのmutantも殺せない)。第二に、snapshot runner(scripts/run-vitest-snapshot.ts的な仕組み)はgit clone + checkout --detach <HEAD>でsnapshotを作るため、working treeの未コミット変更はsnapshotに入らず実行されない。mutation/falsifiability probeを回すときはsnapshot runnerを使わず、対象worktreeでテストランナーを直接叩く。fence環境変数(実行root/fence root/head snapshot root)を当該worktreeに設定しないと、fenceによりテストファイルが0件として扱われ、これもまた「測ったつもりで何も測っていない」状態になる。probeではmutant適用後にgit diff --quietで実際にファイルが変わったことを確認し、変わっていなければprobe自体をvoidとして記録する。既に green と分かっている control と同じ結果が全mutantで出たら、まずrunnerが変更を見ているかを疑う。
