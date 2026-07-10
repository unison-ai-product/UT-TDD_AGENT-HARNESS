---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: memory
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-01-function-spec.md
---

# L6 機能設計: memory

> **L6 contract marker**: `writeMemoryEntry`, `parseMemoryFile`, `loadMemoryEntries`, `selectMemoryEntries`, `renderMemorySurface`, `evaluateMemoryPromotion` は unit-test 粒度の contracts とする。DbC pre/post/invariant は §2-§3、L7 oracle family は U-MEMORY-001..006。

## §1 概要

`memory` module は `.ut-tdd/memory/*.md` を Claude/Codex 共通の project memory source として扱う。authoring source は markdown file、検索 surface は `harness.db` projection、SessionStart surface は best-effort output である。

secret-like payload を含む memory は authoring / parsing 時点で fail-close し、runtime surface は DB 不在や lock で session start を止めない。

## §2 IF 契約

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `writeMemoryEntry` | writeMemoryEntry(repoRoot: string, input: MemoryWriteInput) => MemoryEntry | `kind/title/body` が妥当で secret-like payload を含まない | `.ut-tdd/memory/<kind>-<slug>.md` を書き、parse 済み entry を返す | secret-like payload は書き込み前に拒否する | U-MEMORY-001 |
| `parseMemoryFile` | parseMemoryFile(repoRoot: string, sourcePath: string, content?: string) => MemoryEntry | frontmatter 付き markdown | typed `MemoryEntry` を返す | secret-like payload、invalid kind、空 title/body は throw | U-MEMORY-002 |
| `loadMemoryEntries` | loadMemoryEntries(repoRoot: string) => MemoryEntry[] | repo root | `.ut-tdd/memory/*.md` を sort して parse する | directory 不在は空配列 | U-MEMORY-003 |
| `selectMemoryEntries` | selectMemoryEntries(db, opts?: { query?: string; limit?: number }) => MemoryEntry[] | `memory_entries` table を持つ DB handle | query/limit に一致する memory rows を返す | read-only。`updated_at DESC, memory_id` で安定化 | U-MEMORY-004 |
| `renderMemorySurface` | renderMemorySurface(entries: MemoryEntry[]) => string | 任意の entry 配列 | SessionStart / recall 用の人間可読 text | 空 entry は空文字列。長文 body は短縮 | U-MEMORY-004 |
| `evaluateMemoryPromotion` | `(events: SessionEvent[]) => { should_nudge: boolean; reason: string }` | 1 session分のsanitize済 event列 | commitまたはplan_switchあり、かつmemory write成功eventなしの時だけnudge候補を返す | 本文・git差分を読まない純関数。nudgeはmemory作成を強制しない | U-MEMORY-005 |

## §3 失敗方針

- authoring/parsing は fail-close。secret-like token、invalid kind、必須項目欠落を永続化しない。
- loading は directory 不在を空配列として扱う。
- SessionStart surface は fail-open。DB 不在、lock、破損時に runtime 起動を止めない。

## §4 エッジケース

| # | ケース | 期待挙動 | oracle |
|---|---|---|---|
| 1 | `.ut-tdd/memory/` 不在 | `loadMemoryEntries` が `[]` | U-MEMORY-003 |
| 2 | body に secret-like token | write/parse が throw | U-MEMORY-002 |
| 3 | normal roundtrip | 書いた markdown を同一 entry として parse | U-MEMORY-001 |
| 4 | query 指定なし | limit 内で新しい順に返す | U-MEMORY-004 |
| 5 | entries 空 | `renderMemorySurface` が空文字列 | U-MEMORY-004 |
| 6 | commit/plan_switchあり・memory writeなし | `evaluateMemoryPromotion` がnudge候補 | U-MEMORY-005 |
| 7 | memory writeあり、または状態遷移なし | nudgeしない | U-MEMORY-005 |

## §4.1 昇格 nudge (PLAN-L6-68)

Stop summaryはsession内の`commit`/`plan_switch`と明示的なmemory write成功だけを照合する。前者が
あり後者が無い場合、`memory_promotion_missed`をtelemetry候補としてbest-effortで記録し、summaryへ
1行だけ表示する。本文、prompt、git diffは入力にしない。DB不在・lock・破損ではnudgeを捨ててexit 0とする。
memoryは永続知識だけを保存し、進捗や次の一手を保存する経路にはしない。

## §5 検証接続

L7 unit-test design の U-MEMORY-* が本 doc の contract を検証する。`tests/memory-*.test.ts` と `tests/projection-writer.test.ts` の `memory_entries` projection が回帰 fence になる。
