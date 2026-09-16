---
memory_id: memory:user:verdict-family--3b3dfdb8146e
kind: user
title: "数行程度の小さな編集の著者性をめぐって本線を止めない: verdictを出すfamilyの族分離は機械強制のまま維持する"
tags: ["cross-review", "family-separation", "po-rule"]
updated_at: 2026-09-16T11:17:03.642Z
---

非著者reviewer familyがある PR に数行程度の小さな契約強化を直接commitした場合、その著者性の当否を論じて本線を止めない。advisorに諮ってでも複数案をPOへ上げるという進め方自体が、この種の小さな論点では過剰であり、control laneが決めて進めてよい。ただし機械強制まで緩めるわけではない: merge dispatchのsame_family_reviewer検査(verdictを出すfamilyの族分離)は従来どおり効いており、それを迂回してはならない。実質的に問題になるのはverdictを出すfamilyであって、成果物への小さな寄与ではない。
