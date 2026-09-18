---
memory_id: memory:feedback:legacy-plan-rehydration-head-digest-terminal-receipt-content-digest--1ef98d72a7b7
kind: feedback
title: "legacy PLANのrehydration選択前にHEAD digestとterminal receiptのcontent_digest一致を実測する"
tags: ["content-digest", "plan-migration", "rehydration"]
updated_at: 2026-09-16T11:16:49.558Z
---

legacy PLANの正本移行にtracked-projection rehydrationを選ぶ前に、rehydratorがHEADのcanonical content digestとterminal receiptに埋め込まれたcontent_digestの一致を前提にしており、不一致だとwrite 0でfail-closeすることを踏まえ、「terminal recordがprojectionに存在する」ことだけでなく「HEADの中身がそのrecordと一致する」ことも実測する。canonical経路を通さず直接編集されたlegacy PLANはこのdriftを抱えている可能性が高い。実データregressionテストが履歴blobを読む場合、それはHEADのrehydrate可能性を証明しないので、その旨を主張しない。
