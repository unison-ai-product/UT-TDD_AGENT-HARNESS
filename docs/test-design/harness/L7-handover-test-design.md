---
layer: L6
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/handover-mechanism.md
issue: 1032
---

# 引き継ぎのテスト設計

### §1.8 U-HOVER (handover 記録機構由来、PLAN-L6-06 add-design / handover-mechanism.md §2-§3)
| U-ID | 検証対象 | oracle (DbC) |
|---|---|---|
| U-HOVER-001 | `resolveHandoverScope` | S7 前は PLAN digest を読み、壊れた行 / 不在を skip する。S7 後は旧 digest を読まず、新規 pointer は `active_plan:null` / `digest_summary:null`。詳細と維持条件は plan-mechanism-retirement-test-design.md §3.1。 |
| U-HOVER-002 | `buildPointer` | S7 前は digest を集計する。S7 後は新規 pointer の `active_plan:null` / `digest_summary:null` を確認し、一般 field は維持する (§3.1)。 |
| U-HOVER-005 | `handoverStale` | **純関数**。`updated_at=null`/parse 不能 → true / 24h 超 → true / 24h 以内 → false / **境界 (now-updated_at=24h ちょうど) は stale でない (`>` 判定)** / **具体 oracle: `now`/`updated_at` を UTC ISO8601 で与え `Date.parse` 数値差分で判定 (辞書順比較でない)** |
| U-HOVER-007 | `runHandover` (orchestration) | **`dryRun=true` → 何も書かない (`written=[]`、非破壊)** / 通常 → CURRENT.json 更新 (md の追記・`content` の返却は §5.1 で撤去。散文を作らない契約は U-STCHAN-019 が持つ) / **`complete=true` → CURRENT.json の `status==="completed"` かつ新規 pointer の `active_plan===null`** (PLAN を解決せず、legacy scope / marker の値を引き継がない) |
| U-HOVER-010 | `readPointer` / `checkHandoverDiscipline` (IMP-047、S4 で部分改訂) | S7 前は `readPointer`: 不在 → null / 壊れ JSON → null / 正常 → object。`checkHandoverDiscipline`: **digest 活動なし → 警告ゼロ** / digest 活動あり + CURRENT.json 不在 → `"handover 未生成"` warn / digest 活動あり + fresh pointer → 警告ゼロ (pointer の `active_plan` に依存しない) / digest 活動あり + stale pointer → `"stale"` を含む warn。current-plan marker stale 警告と PLAN family drift 判定は撤回する。新規 `active_plan:null` でも missing / stale 警告を維持する 。S7 後は generic `readPointer` / `handoverStale` / `checkHandoverBypass` を維持し、digest 活動起点の警告を退役する (§3.1)。 |
| U-HOVER-011 | `checkHandoverBypass` の署名照合 (IMP-078 gap①、state-channel-consolidation §5.2) | pointer 不在 → 警告ゼロ (discipline 担当) / `generated_by` 欠落 (手書き pointer) → `"bypass"` warn / `generated_by` 一致 + `latest_doc` なしの pointer → 警告ゼロ。md 照合 (`latest_doc` の `# Session Handover` 数 > `doc_entry_count` → `"mismatch"` warn) と `countHandoverEntries` は §5.1 の撤去対象 (`latest_doc` / `doc_entry_count` の廃止に伴い oracle から外す。旧 pointer の残骸が md を持っていても警告しない契約は U-STCHAN-021 が持つ) |
| U-HOVER-012 | `resolveHandoverScope` scopeToSession / `latestSessionId` (IMP-078 gap④) | S7 前は `scopeToSession`: 指定 session が触れた digest のみへ絞る / 該当無し → 全件 fallback (空 handover 回避)。`latestSessionId`: session jsonl 群から最新 event ts の session_id を返す / 不在 → null / 壊れ行 skip。runHandover の readPlanMeta family 解決 (gap⑤) は、`readPlanMeta` が scaffold の §1 を描く専用部品で §5.1 の撤去対象のため oracle から外した 。S7 後は digest 依存の `scopeToSession` を退役し、session JSONL の `latestSessionId` を維持する (§3.1)。 |
