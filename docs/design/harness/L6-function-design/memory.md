---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_memory
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-01-function-spec.md
---

# L6 機能設計: memory

> **L6 contract marker**: 公開write契約 `writeMemory` と read契約 `readMemory`、`parseMemoryFile`、`loadMemoryCorpus`、`queryMemoryEntries`、`renderMemoryHealth`、`evaluateMemoryPromotion` は unit-test 粒度の contracts とする。storage primitive は MemoryService 内部に閉じ、productionからの直接import / export / re-exportを禁止する。DbC pre/post/invariant は §2-§3、L7 oracle family は U-MEMORY-001..006 / U-MEMORY-019。

## §1 概要

`memory` module は `.ut-tdd/memory/*.md` を Claude/Codex 共通の project memory source として扱う。authoring source は markdown file、検索 surface は `harness.db` projection、SessionStart surface は best-effort output である。

secret-like payload を含む memory は authoring / parsing 時点で fail-close し、runtime surface は DB 不在や lock で session start を止めない。

## §2 IF 契約

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `writeMemory` | writeMemory({ repoRoot, input }: { repoRoot: string; input: MemoryWriteInput }) => MemoryEntry | `kind/title/body` が妥当で secret-like payload を含まない | MemoryService内部primitiveで `.ut-tdd/memory/<kind>-<slug>.md` を書き、parse済みentryを返す | storage primitiveを公開せず、productionの直接import / export / re-exportをU-MEMORY-019で拒否する。secret-like payloadは副作用前に拒否する | U-MEMORY-001 / U-MEMORY-002 / U-MEMORY-019 |
| `parseMemoryFile` | parseMemoryFile(repoRoot: string, sourcePath: string, content?: string) => MemoryEntry | frontmatter 付き markdown | typed `MemoryEntry` を返す | secret-like payload、invalid kind、空 title/body は throw | U-MEMORY-002 |
| `loadMemoryEntries` | loadMemoryEntries(repoRoot: string) => MemoryEntry[] | repo root | `.ut-tdd/memory/*.md` を sort して parse する | directory 不在は空配列 | U-MEMORY-003 |
| `selectMemoryEntries` | selectMemoryEntries(db, opts?: { query?: string; limit?: number }) => MemoryEntry[] | `memory_entries` table を持つ DB handle | query/limit に一致する memory rows を返す | read-only。`updated_at DESC, memory_id` で安定化。**読み路の正本ではない** (下記 `readMemory` が入口。本 API は等価性回帰の比較対象として残す) | U-MEMORY-004 |
| `loadMemoryCorpus` | loadMemoryCorpus(repoRoot: string) => { entries; findings } | repo root | 正本ファイルを **per-entry 隔離**で読む | 1 件の parse 失敗が全件読みを落とさない (失敗は finding として返す) | U-MEMORY-012 |
| `queryMemoryEntries` | queryMemoryEntries(entries, opts?) => MemoryEntry[] | 任意の entry 配列 | filter / 順位 / limit を適用する | filter・順位・tie-break の**唯一の実装**。DB 経路と file 経路で分岐させない | U-MEMORY-010 / U-MEMORY-011 |
| `readMemory` | readMemory({ repoRoot, db?, options? }) => MemoryReadResult | repo root と任意の index | **本文は正本ファイルから**返し、index とは `content_hash` を照合するだけ | index が読めなくても結果を返す。degraded は `freshness` (`fresh` / `stale` / `index-unavailable`) で必ず可視化する | U-MEMORY-013 / U-MEMORY-014 / U-MEMORY-015 |
| `renderMemoryHealth` | renderMemoryHealth(result: MemoryReadResult) => string | 読み出し結果 | 劣化と破損の可視行 | `fresh` かつ破損 0 のときだけ空文字列 (常時ノイズを出さない) | U-MEMORY-017 |
| `renderMemorySurface` | renderMemorySurface(entries: MemoryEntry[]) => string | 任意の entry 配列 | SessionStart / recall 用の人間可読 text | 空 entry は空文字列。長文 body は短縮 | U-MEMORY-004 |
| `evaluateMemoryPromotion` | `(events: SessionEvent[]) => { should_nudge: boolean; reason: string }` | 1 session分のsanitize済 event列 | commitまたはplan_switchあり、かつmemory write成功eventなしの時だけnudge候補を返す | 本文・git差分を読まない純関数。nudgeはmemory作成を強制しない | U-MEMORY-005 |

## Claude宛て即時配送 (PLAN-L7-472)

`.ut-tdd/memory/*.md`への永続化と、稼働中Claude sessionへの通知を分離する。
`ut-tdd memory add --notify-claude`は`writeMemory`成功後だけ、memory IDと安定operation IDを
git common dir配下のruntime inboxへexclusive createする。Claude CodeのStop hookは
`asyncRewake=true`でinboxを待ち、entryをatomic claimして同一sessionへ一度だけ返す。

| 関数 | DbC | 対応oracle |
| --- | --- | --- |
| `buildClaudeInboxEntry` | parse済み`MemoryEntry`と非空operation IDから配送DTOを作る。本文の権威昇格は禁止 | U-MEMWAKE-001〜003 |
| `publishClaudeInboxEntry` | git common dirへ`wx`で保存。解決不能rootはfail-closeし、同一内容retryは冪等、同一ID異内容は拒否 | U-MEMWAKE-001〜002 / 004 |
| `waitForClaudeMemory` | 正の有限待機値だけを受理し、未claim entryを選ぶ。generationで旧watcherを停止し、claim成功時だけ配送済みinboxを除去する | U-MEMWAKE-001 / 005 |
| `renderClaudeWakeMessage` | 本文を長さ上限付きJSON dataとしてescapeし、閉じmarkerを一つに保つ | U-MEMWAKE-003 |

runtime inboxは通知キューであり、review verdict、provider family、PR HEAD、署名の信頼根ではない。
D3cは通知受領後もGitHub APIとprovider別署名receiptを独立検証する。
Stop hookは`asyncRewake=true`を機械検査し、待機上限を15分（hook timeout 930秒）に閉じる。
claim/generationは7日retentionでGCし、session数に比例した永久増加を防ぐ。
通知対象はVS Code拡張などの生存中interactive Claude sessionに限定する。UT-TDDが
`claude --print`で起動する有限委譲processは`UT_TDD_DISABLE_CLAUDE_MEMORY_WAKE=1`を
強制し、Stop hookを即時終了させる。呼出側のenvでこの抑止を解除できない。これにより
closing reviewのprovider processが15分watcherに保持されることを防ぐ（U-MEMWAKE-006）。

## §3 失敗方針

- authoring/parsing は fail-close。secret-like token、invalid kind、必須項目欠落を永続化しない。
- loading は directory 不在を空配列として扱う。
- SessionStart surface は runtime 起動を止めない (DB 不在 / lock / 破損でも hook は成功させる) が、
  **無音では終わらせない**。DB 由来の段を読めなかった場合は劣化 digest (理由 + HEAD + 正本ファイル由来の
  memory) を出力する。「引き継ぎ情報が無い」と「読めなかった」を呼び手が区別できることが契約であり、
  完全無出力は違反 (PLAN-L7-189 §5、issue #175)。
- 共有 memory の同期は `memory-sync` gate が判定する。「共有済み」= **origin 到達**。untracked と
  未コミット変更は error、commit 済み origin 未到達は note。origin を解決できない環境では
  「すべて到達」と主張しない (未評価と OK を混同しない)。

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
