---
layer: L6
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/module-drift.md
issue: 1032
---

# モジュールドリフトのテスト設計

### §1.16 U-MDRIFT (module-drift lint = 設計⊇実在の包含、PLAN-L7-16 / IMP-075)

> ペア = `module-drift.md` (L6↔L7)。architecture §3.1 設計 module 集合 ⊇ `src/` 実在 module の包含 drift (impl→design back-fill 漏れ) を機械保証する純関数の oracle。

| U-ID | 対象関数 | DbC oracle |
|---|---|---|
| U-MDRIFT-001 | `parseListedModules` | §3.1 見出し〜次見出しに限定し表 1 列目 `**name**` を抽出 / §3.2 以降の太字を含まない / 重複排除 |
| U-MDRIFT-002 | `parseListedModules` (不在) | §3.1 セクション不在 → `[]` (パース失敗を空虚 ok にしない) |
| U-MDRIFT-003 | `analyzeModuleDrift` (orphan) | 実在するが未列挙 → `orphans` + `ok=false` / listedCount・actualCount 集計 |
| U-MDRIFT-004 | `analyzeModuleDrift` (将来 module) | 設計が web/roster/skills を余分列挙 (src 未実在) は drift でない → `orphans=[]`/`ok=true` |
| U-MDRIFT-005 | `loadModuleDocs`+`analyzeModuleDrift` (実 repo CI fail-close ガード) | 実 repo の `src/` 実在 module は全件 architecture §3.1 列挙 (`orphans==[]`) + listedCount≥actualCount。以後 src module を足して設計未列挙だと red |

関連する U-DESIGNDB-R1 と §5 の対応表は [共有 L7](L7-unit-test-design.md) を参照します。
