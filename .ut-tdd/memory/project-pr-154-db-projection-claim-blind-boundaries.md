---
memory_id: memory:project:pr-154-db-projection-claim-blind-boundaries
kind: project
title: "PR #154 db projection claim-blind boundary closure"
tags: ["pr-154", "claim-blind", "db-projection-coverage", "tdd"]
updated_at: 2026-07-24T20:49:00.000+09:00
---

HEAD `616d4fed`のclaim/spec-blind reviewで、Markdown semantic state machineに追加境界を検出した。
index-like bulletを全target節で受理していたため§2.7/§9.1がindex registryへ漏れ、same-depthの論理descendant
`9.3.1`がscope外となって実正本`refactor_candidates`と2 indexが脱落した。さらにouter pipe省略GFM tableと
escaped `\|` cellを扱えなかった。

index bulletはexact §9.3直下、又は論理descendant内でprojection table schemaが成立した後だけ受理する。
節番号のlogical descendantをMarkdown heading depthより優先して親target scopeへ残す。table tokenizerはouter pipeを
任意とし、escaped pipeだけを最小限unescapeする。全面Markdown parser又は外部依存は導入していない。

Red fixturesは§2.7/§9.1 index漏れ、§9.3 positive、実`9.3.1`のtable+2 indexes、outerless table、
escaped pipeを拘束した。対象Node testは19/19 Green。設計、PLAN、Issue #153許容負債は変更していない。

index受付は§9.3又はlogical descendant 9.3.xだけに限定する。9.3.xではprojection table schema成立後だけ
同subsectionのbullet indexを受理するため、§9.3.2のnonprojection registryは漏れない。§9.1でprojection tableが
先に成立しても後続bulletをindex扱いしない。旧`checkedIndexes >= 41`はtarget全節の任意bulletを誤収集した件数で
あり撤回し、正本§9.3/9.3.1の11 identifier全件・順序exact assertionへ置換した。
