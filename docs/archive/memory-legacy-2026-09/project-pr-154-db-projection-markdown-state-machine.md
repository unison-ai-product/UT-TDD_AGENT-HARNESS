---
memory_id: memory:project:pr-154-db-projection-markdown-state-machine
kind: project
title: "PR #154 db projection Markdown semantic state machine"
tags: ["pr-154", "spec-blind", "db-projection-coverage", "tdd", "markdown"]
updated_at: 2026-07-24T20:43:00.000+09:00
---

HEAD `0ec01421`のspec-blind reviewで、projection registry parserに3反例が成立した。
GFM alignment separator `:---`でprojection stateが失われ、nested nonprojection heading内の
index-like bulletがindex requirementへ漏れ、backtick付き別schema headerがprojection data終了境界にならなかった。

各反例をRedで再現後、path/単行header条件を増やさず、Markdown tableを
`header -> separator -> data rows`で認識する短いstate machineへ置換した。
separator成立時にheader schemaを分類し、`table` + `primary key` / `主キー`のdata rowだけを
projection table requirementへ渡す。別schema tableはdataを捨てる。heading depthでtarget親scopeと
nested scopeを分離し、既存§9.3直下の正規bullet indexだけを維持する。

対象Node testは15/15 Green。設計、PLAN、Issue #153許容負債は変更していない。
