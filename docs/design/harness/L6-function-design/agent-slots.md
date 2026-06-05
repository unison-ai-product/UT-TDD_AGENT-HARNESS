---
layer: L6
artifact_type: design_doc
status: draft
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
---
<!--
① 設計 (L6 機能設計) — agent-slots 機構 (subagent/team-member の fire→release 状態記録 + 並列上限助言 + stale 検知)。
PLAN: IMP-050 (Layer-2 オーケストレーション移植、add-feature)。
pair (③): docs/test-design/harness/L7-unit-test-design.md §1.9 U-SLOT / §1.10 U-TEAM。
実装 (②): src/runtime/agent-slots.ts + src/schema/team.ts。
移植元: vendor/helix-source/cli/lib/agent_slots.py (SQLite) + vendor/helix-source/cli/lib/team_runner.py。
ADR-001 準拠: HELIX/Python コードを port せず TypeScript (Bun) で全面再実装。SQLite 非採用。
-->

# UT-TDD Agent Harness — L6 機能設計: agent-slots 機構 (IMP-050)

## §0 位置づけ・移植方針

本設計は HELIX の `cli/lib/agent_slots.py` (SQLite 永続) と `cli/lib/team_runner.py` (strategy + ThreadPoolExecutor 上限) を **ADR-001 準拠で TypeScript (Bun) として全面再実装**した後追い設計記録である。実装は完了済 (`src/runtime/agent-slots.ts` / `src/schema/team.ts`)、本書はその V-pair 整合のための設計文書化 (Add-feature back-fill でなく V-pair 整合目的)。

**SQLite を持ち込まない理由**: Windows ネイティブ環境では SQLite の native module がビルドツール依存を生み、bun 単独実行要件 (ADR-001) と衝突する。代替として `.ut-tdd/state/agent-slots.json` (`Slot[]`) を単一 state ファイルとし、`readText`/`writeText` 注入で決定論的テストを確保する。この選択は session-log.ts・setup/index.ts のストレージ方針 (SSoT + deps 注入 + never-throws) と一致する。

**用途**:
- subagent / team member の `fire → release` を機械記録
- 並列実行数の超過 warn (agent-guard 助言 / `.claude/CLAUDE.md` 「上限 8」と整合)
- stale slot (released されず放置) の doctor surface
- peak_parallel 統計
- `ut-tdd team run` (`hybrid` mode) の入力 schema (`src/schema/team.ts`) を型保証

## §1 責務分離

| コンポーネント | 責務 | 失敗方針 |
|---|---|---|
| `loadSlots` | `.ut-tdd/state/agent-slots.json` を読み `Slot[]` を返す | **never throws**。不在/壊れ/非配列 → `[]` |
| `fireSlot` | running slot を追記し永続化 | **never throws** (saveSlots 内部 fail-open) |
| `releaseSlot` | slot を terminal status へ遷移 | 対象なし/既 release → `false` (idempotent)。**never throws** |
| `listActiveSlots` | running かつ `released_at=null` の slot 一覧 | **never throws** |
| `listStaleSlots` | active かつ `fired_at` が閾値 (分) 超の slot | **never throws** |
| `peakParallel` | sweep-line で同時実行ピーク数を算出 | **純関数**。fired_at parse 不能 slot はスキップ |
| `exceedsParallelLimit` | active 数 `>= max` で超過判定 | **never throws** |
| `recordGuardFire` | agent-guard 用: stale 自動失効 → fire → `{activeCount, exceeded}` を 1 load/save で返す | **fail-open** (catch → `{0, false}`) |
| `teamDefinitionSchema` (team.ts) | `.ut-tdd/teams/*.yaml` の zod single source 検証 | zod `parse` が throw (設計意図の fail-close) |
| `mustSerialize` (team.ts) | 直列化 3 条件 OR 判定 | **純関数**。`undefined → false` |

全 `agent-slots.ts` 関数は **fail-open (never throws)**。記録の失敗でワークフローを止めない。

## §2 型 / schema (D-CONTRACT)

### §2.1 agent-slots.ts

```ts
export type SlotStatus = "running" | "completed" | "failed" | "cancelled";
export type SlotSource = "agent_guard" | "team_runner" | "manual";

export interface Slot {
  slot_id: string;
  /** subagent_type または engine 名 (例: pmo-sonnet / codex-se)。 */
  agent_kind: string;
  role: string | null;
  slot_source: SlotSource;
  fired_at: string;          // ISO8601
  released_at: string | null; // null = まだ実行中
  status: SlotStatus;
  exit_code: number | null;
}

/** I/O・clock・id 注入 (session-log の deps パターン踏襲)。 */
export interface AgentSlotsDeps {
  repoRoot: string;
  now: () => string;                             // ISO8601 生成
  readText: (path: string) => string | null;
  writeText: (path: string, content: string) => void;
  newId: () => string;                           // slot_id 生成
}

export const DEFAULT_MAX_PARALLEL = 8;   // .claude/CLAUDE.md 並列上限と整合
export const DEFAULT_STALE_MINUTES = 5;  // HELIX list_stale_slots と同じ既定値
```

**ストレージパス**: `.ut-tdd/state/agent-slots.json` (gitignored、runtime state)。

### §2.2 team.ts (zod single source)

```ts
export const VALID_TEAM_STRATEGIES = ["sequential", "parallel"] as const;

// 直列化 3 条件 (IMP-049)
export const serializationReasonSchema = z.object({
  file_conflict: z.boolean().default(false),
  downstream_dependency: z.boolean().default(false),
  shared_state: z.boolean().default(false),
});

export const teamMemberSchema = z.object({
  role: roleSchema,             // src/schema/index.ts の共通 role enum
  engine: z.string().min(1),   // agent_kind として slot に記録
  task: z.string().min(1),
  serialize_after: z.string().optional(),  // 個別直列化指定
});

export const teamDefinitionSchema = z.object({
  name: z.string().min(1),
  strategy: teamStrategySchema.default("sequential"),  // HELIX team_runner と同じ安全側デフォルト
  max_parallel: z.number().int().positive().default(8),
  serialization: serializationReasonSchema.optional(), // チーム全体の直列化根拠 (3 条件)
  members: z.array(teamMemberSchema).min(1),           // 空 → reject (zod fail-close)
});
```

`teamDefinitionSchema` は `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml` (`hybrid` mode) の入力である。`strategy` のデフォルトを `sequential` にするのは HELIX `team_runner.py` と同じ安全側設計。

## §2.3 関数 signature / DbC

| 関数 | signature | DbC |
|------|-----------|-----|
| `loadSlots` | `(deps: AgentSlotsDeps) => Slot[]` | **never throws**。`readText` null → `[]` / JSON.parse 失敗 → `[]` / 非配列 → `[]` |
| `fireSlot` | `(input: {agent_kind; role?; slot_source}, deps) => Slot` | running slot を `Slot[]` に append し永続化。返り値は生成した Slot (`status="running"`, `released_at=null`)。saveSlots 失敗は warn せず pass (fail-open) |
| `releaseSlot` | `(slotId, status: Exclude<SlotStatus,"running">, exitCode: number\|null, deps) => boolean` | `slotId` が存在し `released_at===null` の slot を terminal 化 (`status`, `exitCode`, `released_at=now`)。対象なし/既に released → `false` (idempotent)。**never throws** |
| `listActiveSlots` | `(deps) => Slot[]` | `status==="running" && released_at===null` のみ。**never throws** |
| `listStaleSlots` | `(deps, thresholdMinutes=5) => Slot[]` | `listActiveSlots` の結果から `(now - fired_at) / 60000 > thresholdMinutes` を満たすものを返す。`deps.now()` / `fired_at` が parse 不能の slot はスキップ。**never throws** |
| `peakParallel` | `(slots: Slot[]) => number` | **純関数**。sweep-line: `fire=+1` / `release=-1`。`released_at=null` は `+∞` 扱い (現在も実行中)。**同時刻は `delta` 昇順 (`release(-1)` を `fire(+1)` より先) ソートして隣接区間の重複カウントを防ぐ**。`fired_at` parse 不能 slot はスキップ |
| `exceedsParallelLimit` | `(deps, max=8) => boolean` | `listActiveSlots(deps).length >= max` (上限到達で即 `true`、`>` でなく `>=`)。**never throws** |
| `recordGuardFire` | `(agentKind, deps, max=8, staleMinutes=5) => {activeCount: number; exceeded: boolean}` | I/O を 1 回の load→save に集約 (lost-update 窓を閉じる)。① `slot_source==="agent_guard"` かつ stale な slot を `status="cancelled"` に失効 → ② 新規 slot を push → ③ save → `activeCount` (agent_guard running 数) / `exceeded = activeCount >= max` を返す。catch → `{0, false}` (fail-open) |
| `nodeAgentSlotsDeps` | `(repoRoot: string) => AgentSlotsDeps` | 実 I/O deps。`idSeq` は closure に閉じ込め module 状態を持たない (テスト間リセット不能回避) |
| `mustSerialize` (team.ts) | `(reason: SerializationReason\|undefined) => boolean` | **純関数**。`file_conflict \|\| downstream_dependency \|\| shared_state` の OR。`undefined → false` |

### §2.4 DbC 補足

**`peakParallel` 同時刻順序規則**: 同じタイムスタンプに fire と release が重なる場合、`release(-1)` を先に処理することで「前 slot が終わり次 slot が始まる」隣接パターンを peak 2 でなく peak 1 と正しく計上する。これは HELIX `agent_slots.py` の `sorted(key=lambda e: (e.t, e.delta))` と等価。

**`recordGuardFire` Claude subagent 制約**: Claude Code の subagent には `PostToolUse` release hook が無い (`Agent` tool の完了は hook で検知不可)。このため `agent_guard` 由来 slot は自動失効で近似する。`team_runner` 由来は `ut-tdd team run` が明示 release できるため stale 失効対象外。

**`teamDefinitionSchema` 直列化 3 条件 (IMP-049)**: `serialization` フィールドはチーム全体の直列化根拠を機械記録する。`members[].serialize_after` は `parallel` 戦略でも個別 member を直列化するエスケープハッチ。どちらも `mustSerialize` の入力になる。

## §3 テスト指針 (V-pair)

generates pair: `docs/test-design/harness/L7-unit-test-design.md` **§1.9 U-SLOT-001〜006** / **§1.10 U-TEAM-001〜002**。本書 §2.3 の全関数を被覆 (孤児 0)。trace は G7 で双方向凍結。

| U-ID | 対象関数 | 観点 |
|------|----------|------|
| U-SLOT-001 | `loadSlots` | 不在/壊れ/非配列 → `[]` / never throw |
| U-SLOT-002 | `fireSlot` / `releaseSlot` | running 追記 / terminal 化 / idempotent |
| U-SLOT-003 | `listActiveSlots` / `listStaleSlots` | active 絞り / 閾値境界 |
| U-SLOT-004 | `peakParallel` | 重なり/非重なり / `null=実行中` |
| U-SLOT-005 | `exceedsParallelLimit` | `>= max` 境界 / max override |
| U-SLOT-006 | `recordGuardFire` | `>= max` 境界 / stale 自動失効 |
| U-TEAM-001 | `teamDefinitionSchema` | default / 空 members reject / 不正 role/strategy reject / serialize_after + serialization 受理 |
| U-TEAM-002 | `mustSerialize` | 3 条件 OR / `undefined → false` |

## §4 carry / 次工程

- **doctor surface**: `listStaleSlots` の結果を `ut-tdd doctor` に接続し stale slot を運用可視化する (stub 待ち)。
- **`ut-tdd team run` 配線**: `teamDefinitionSchema` を parser として `team run` サブコマンドに接続し、`fireSlot`/`releaseSlot` を member 実行前後に呼ぶ (IMP-050 Layer-2 実装続き)。
- **IMP-049 強制記録**: `mustSerialize` の結果を PLAN `§工程表` trace に機械記録する経路は stub 待ち。現状は `serialization` フィールドへの人手記述 + `mustSerialize` 純関数で判定。
- **PLAN-REVERSE back-fill**: IMP-050 要件の L3 back-fill は PLAN-REVERSE-* で後続 (本機能設計は add-feature として bottom-up で先行実装済)。
