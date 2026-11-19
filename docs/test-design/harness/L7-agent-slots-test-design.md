---
layer: L6
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/agent-slots.md
issue: 1032
---

# エージェント枠とチーム定義のテスト設計

対応する機能設計は [agent-slots.md](../../design/harness/L6-function-design/agent-slots.md) の §2.3 です。
関連する U-SLOT-009 は、[共有 L7](L7-unit-test-design.md) のファイルシステム用 oracle を参照します。

### §1.9 U-SLOT (agent-slots 由来、PLAN-L7-08 / IMP-050)

| U-ID | 関数 | oracle |
|------|------|--------|
| U-SLOT-001 | `loadSlots` | 不在 → `[]` / 壊れ JSON → `[]` / 非配列 (`{}` 等) → `[]` / **never throw** |
| U-SLOT-002 | `fireSlot` / `releaseSlot` | `fireSlot`: running slot を追記し永続化、返り値 `status="running"` / `released_at=null` / `role` 省略 → `null`。`releaseSlot`: terminal status + `released_at` 記録 + `exit_code` 記録 / 返り `true`。対象なし → `false` / 既 release 済 (2 回目) → `false` (idempotent) |
| U-SLOT-003 | `listActiveSlots` / `listStaleSlots` | `listActiveSlots`: `status==="running" && released_at===null` のみ返す。`listStaleSlots(deps, 5)`: active かつ `(now - fired_at) / 60000 > 5` のみ / **`>` 判定: ちょうど 5 分は stale でない** / 閾値内の fresh slot は含まない |
| U-SLOT-004 | `peakParallel` | 時間的に重なる 3 slot → peak `3` / 直列 (非重なり) → peak `1` / `released_at=null` (実行中) → peak に算入 (2 slot 両方 null → `2`) |
| U-SLOT-005 | `exceedsParallelLimit` | active < `DEFAULT_MAX_PARALLEL` → `false` / active `=== DEFAULT_MAX_PARALLEL` → `true` (`>=` 判定) / `max` override: `exceedsParallelLimit(deps, 100)` で `false` |
| U-SLOT-006 | `recordGuardFire` | active が `max-1` の時点では `exceeded=false` / 次の fire で active `=== max` → `exceeded=true` / **stale な `agent_guard` slot は `cancelled` に自動失効し active から外れる** (stale 持続汚染防止) / stale 失効後の `activeCount` は失効前より小さい |
| U-SLOT-007 | `sweepStaleGuardSlots` | セッション末尾の dangling guard slot (閾値超) を `cancelled` 失効し件数を返す / 閾値内の guard slot・非 guard slot・既 release は失効しない / 対象なし → `0` / 冪等 (二度目 `0`) |
| U-SLOT-008 | `releaseOldestGuardSlot` | 最古の running guard slot を `completed` で release し active を 1 減 (FIFO) / `released_at=now` / 非 guard slot は対象外 / 対象なし → `null` (idempotent) / **SubagentStop n 回 = active を n 件閉じても count は厳密** (個体同定不要、IMP-106) |

### §1.10 U-TEAM (team schema 由来、PLAN-L7-08 / IMP-050)

| U-ID | 関数 | oracle |
|------|------|--------|
| U-TEAM-001 | `teamDefinitionSchema` | `strategy` 省略 → `"sequential"` (default) / `max_parallel` 省略 → `8` (default) / `max_parallel=8` → accept / `max_parallel>8` → zod throw (reject) / `members` 空配列 → zod throw (reject) / 不正 `role` (許可リスト外) → throw / 不正 `strategy` (`"burst"` 等) → throw / `serialize_after` + `serialization` (3 条件フィールド) を含む入力 → 受理 (`parsed.serialization.downstream_dependency===true` / `parsed.members[1].serialize_after==="se"`) |
| U-TEAM-002 | `mustSerialize` | 3 条件すべて `false` → `false` / `file_conflict=true` → `true` / `downstream_dependency=true` → `true` / `shared_state=true` → `true` / `undefined` → `false` |
| U-TEAM-003 | `recommendTeamLaunch` | `hybrid` + trivial/simple task → `should_launch=false` / `hybrid` + risk or standard+ task → `should_launch=true` with cross-provider `definition` / non-`hybrid` → `should_launch=false`, `trigger="unavailable"` |
