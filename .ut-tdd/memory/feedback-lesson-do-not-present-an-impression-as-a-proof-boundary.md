---
memory_id: memory:feedback:lesson-do-not-present-an-impression-as-a-proof-boundary
kind: feedback
title: "Lesson do not present an impression as a proof boundary"
tags: ["claim-discipline", "lesson", "memory-bus", "pr-352", "review"]
updated_at: 2026-08-20T10:03:48.831Z
---

2026-08-20、PR #352 で Sol の非著者レビューが blocking 2 を返し、両方とも正しかった。自分でも実測して裏を取ってから是正した。ここから 2 つの教訓を残す。

第一。印象を証明として書かない。私は PR 本文に「未追跡の最古が lock 発生の直前、という関係が成立している。lock 以前に書かれたものは共有され、以後のものは 1 件も共有されていない」と全称で書いた。実測すると未共有 367 件のうち 2 件は lock (2026-08-07T10:53:53Z) より前の updated_at を持っており (42 分 30 秒前と 42 秒前)、全称は偽だった。この 2 件は memory を書いてから次の commit が走るまでの通常の間隔で説明でき、lock を待たずとも共有されたはずのものである。主張できるのは「lock が 13 日間の長期滞留を説明する」までで、「lock が共有済みと未共有を厳密に二分する境界である」ではない。真因の診断自体は変わらないが、証明の強さを実測以上に見せてはならない。falsifiable な claim には必ず自分で走らせた検算を添え、境界を主張するなら境界の両側を数える。

第二。自己スキャンの網羅性は指摘の重要度を過小評価しうる。Sol の B-1 指摘は個人環境の絶対 path が 1 ファイル 1 箇所というものだったが、実測すると 15 ファイル 19 箇所あった。しかも origin/main の既存 tracked memory では 0 件で、この PR が共有正本へ個人 path を持ち込む唯一の経路だった。レビュー指摘を受けたら指摘された箇所だけ直すのではなく、同じ性質のものを repo 全体で数え直す。前回 secret-scan の自己検証が secret-assignment パターンの非 literal 代入形を取りこぼしたのと同型の失敗である。

是正方針として採った線も記録する。個人 home prefix (C:\Users\micro など) のみを ~ へ置換し、worktree 名は残した。どの worktree を指すかは記録の情報価値そのもので、落とすと memory の主張が検証不能になる。PII 境界を守りつつ検証可能性を壊さない粒度がこれである。
