---
memory_id: memory:project:pr-154-db-projection-semantic-boundary
kind: project
title: "PR #154 db projection detector semantic boundary"
tags: ["pr-154", "spec-blind", "db-projection-coverage", "tdd"]
updated_at: 2026-07-24T20:39:00.000+09:00
---

HEAD `5a3eb362`のspec-blind reviewで、`db-projection-coverage`がMarkdown `####`をsection境界として
認識せず、前修正は`.db` path形状だけで行を除外するため、nested registry leakとprojection tableの
over-exclusionを起こすFLAGを受けた。

Redとして、nested non-projection registry、projection table内のpath-like `.db`識別子、
canonical 3DB ownership schema外の追加`.db`識別子を分離した。実装はpath/見出し深度による判定を撤回し、
`table` + `primary key` / `主キー`というprojection table header schemaを見た区間だけdata rowを抽出する。
別schemaのtable headerで区間を閉じるため、nested registryを意味境界で除外しつつ有効識別子を保持する。

対象Node testは12/12 Green。設計文書、PLAN、Issue #153許容負債は変更していない。
