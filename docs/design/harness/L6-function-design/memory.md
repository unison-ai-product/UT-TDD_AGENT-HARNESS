---
layer: L6
artifact_type: design_doc
status: confirmed
updated: 2026-10-19
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
| `resolveLiveClaudeWorkspace` | **現行互換API**。shared runtime generationからschema-compatibleなworkspaceを列挙し、fresh exact-oneだけ`ok:true`、stale/0/複数/schema非互換/破損は既存4値のtyped denyを返す。staleを`deferred`へ変えるのは後続の新route compositionであり、この関数と`U-MEMWAKE-007`を再定義しない | `U-MEMWAKE-007` |
| `waitForClaudeMemory` | 正の有限待機値だけを受理し、未claim entryを選ぶ。generation identity検証後だけmarkerをrenewし、generationで旧watcherを停止し、claim成功時だけ配送済みinboxを除去する | U-MEMWAKE-001 / 005 / CANDIDATE-MEMWAKE-LIVENESS-001 |
| `renderClaudeWakeMessage` | 本文を長さ上限付きJSON dataとしてescapeし、閉じmarkerを一つに保つ | U-MEMWAKE-003 |

runtime inboxは通知キューであり、review verdict、provider family、PR HEAD、署名の信頼根ではない。
D3cは通知受領後もGitHub APIとprovider別署名receiptを独立検証する。
Stop hookは`asyncRewake=true`を機械検査し、待機上限を15分（hook timeout 930秒）に閉じる。
claim/generationは7日retentionでGCし、session数に比例した永久増加を防ぐ。
通知対象はVS Code拡張の生存中Claude sessionに限定する。hookは拡張がClaude processへ設定する
`CLAUDE_CODE_ENTRYPOINT=claude-vscode`をpositive identityとして要求し、欠落・未知値ではpoll前に
終了する。加えてUT-TDDが`claude --print`で起動する有限委譲processは
`UT_TDD_DISABLE_CLAUDE_MEMORY_WAKE=1`を強制し、呼出側envで解除できない。これによりraw headless
Claudeとclosing reviewが15分watcherに保持されることを防ぐ（U-MEMWAKE-006）。
inbox v3 review entryはcanonical subject requestと通知先を分離する。producerはgit common dirのfresh
generation markerからv3互換な生存Claude VS Code workspaceがexact 1件の場合だけ、その正規化
SHA-256を`targetWorkspaceId`へ使う。Stop hookは自身のworkspace identityと一致するentryだけをclaimする。
target 0件、複数件、schema非互換、破損では typed deny とする。denyでも canonical request は先に
永続化して backlog として保持し、0にするのは live wake / inbox publish / deferred queue の downstream
write だけである（request persistence 自体が失敗した場合だけ全 downstream write を0にする）。
schema-compatible target が新しい route composition 上で logical workspace として exact 1件なら、fresh は
`live`、全 marker stale は canonical request 永続化後に同じ workspace ID の `deferred` queue を一度だけ作る。
これは新 candidate の意図的な差分であり、既存 `U-MEMWAKE-007`（現行APIの stale deny）を無宣言で反転させない。
request digest/path/HEAD/revisionを配送都合で変更せず、絶対workspace pathも保存しない。

### Issue #454 稼働判定と遅延配送の差分 (PLAN-L6-103)

既存の `PLAN-L7-472` が定義する exact-one workspace routing を、`live | deferred` の typed union として
明示する。canonical request の exclusive-create が成功する前に、live publish や deferred queue を行ってはならない。
候補が一つだけの場合の分岐は次の通りである。

| generation marker | route | target identity | 副作用の順序 |
| --- | --- | --- | --- |
| schema-compatible + fresh | `live` | marker から検証した同一 `workspaceId` | canonical request → live publish |
| schema-compatible + stale | `deferred` | **同じ** `workspaceId`（別候補へ再解決しない） | canonical request → deferred queue 一件 |
| 0 / 複数 / incompatible / corrupt | typed deny | なし | canonical request は保持、publish / queue は0 |

deferred queue の idempotency key は canonical request identity と target `workspaceId` から決定し、同一
operation/content の retry は exclusive-create により一件へ収束する。同一 operation の異なる content は
conflict として拒否し、既存 bytes を変更しない。stale 一件を `published` と報告したり wildcard/global broadcast
へ広げたりしてはならない。

#### deferred queue の保存・昇格契約

queue は既存 `inbox` と同じ namespaceへ混ぜない。`runtimeRoot` を
`<git-common-dir>/ut-tdd-runtime/claude-memory-wake` とした場合の正本は次だけである。

```text
runtimeRoot/deferred/<idempotencyKey>.json
runtimeRoot/deferred/promoted/<idempotencyKey>.json
```

`readInbox` は `runtimeRoot/inbox/*.json` のみを読み、deferred fileを inbox entry として解釈しない。
deferred entry は exact JSON object（追加キー、絶対 path、path traversal 不可）で、canonical bytes は
RFC 8785/JCSとする。

| key | 型 / 固定値 |
| --- | --- |
| `schemaVersion` | literal `ut-tdd.claude-deferred/v1` |
| `purpose` | literal `review`（この deferred queue は canonical review request 専用。通常 memory inbox は対象外） |
| `idempotencyKey` | `sha256(JCS([requestDigest, targetWorkspaceId]))` の lower-case hex 64桁 |
| `requestDigest` | lower-case hex 16〜64桁 |
| `requestPath` | `.ut-tdd/review/requests/<requestDigest>.json` |
| `operationId` | 空でない文字列 |
| `targetWorkspaceId` | lower-case hex 64桁 |
| `targetGeneration` | 検証済み marker の generation、空でない文字列 |
| `createdAt` / `eligibleAfter` | RFC 3339。初回durable `createdAt`がauthoritative、`eligibleAfter=createdAt+PT0S`を固定しretryでは再mintしない |

promotion marker は queue と別の exact JSON object とし、path は上記 `promoted/` 配下に固定する。

| key | 型 / 固定値 |
| --- | --- |
| `schemaVersion` | literal `ut-tdd.claude-deferred-promotion/v1` |
| `idempotencyKey` | queue item と同一の lower-case hex 64桁 |
| `requestDigest` | queue item と同一の lower-case hex 16〜64桁 |
| `targetWorkspaceId` | queue item と同一の lower-case hex 64桁 |
| `inboxEntryId` | queue item から導出された非空文字列 |
| `promotedAt` | durable inbox entry の `createdAt` と byte-for-byte 同じ RFC 3339 timestamp |

producer は canonical request の存在を確認してから、stale exact-one group に限り queue を exclusive-create
する。同一 bytes は idempotent、同一 key の異なる bytes は `claude_deferred_projection_conflict` として
拒否し既存 bytesを変えない。初回create候補だけが注入clockから`createdAt`を採り、固定
`deferredEligibilityDelay=PT0S`で`eligibleAfter`を算出する。既存検出、並列敗者、後刻retryはclosed-schemaで
durable queueを読み、identity検証後に既存の両timestampを再利用してbytesを照合する。retry wall clockでの再mintは
禁止し、時刻形式または固定差分が不正な既存queueは上書きせずconflictにする。

consumer は、自身の fresh Claude VS Code generation identity を検証した SessionStart/Stop wake boundary
でだけ対象 workspace の deferred を走査する。request path/digest、schema、key、queue保存時の
`targetGeneration` が検証できる itemだけを対象にする。`targetGeneration` は stale 判定時の証拠であり、
再起動後の新しい generation と一致することは要求しない。現 session の fresh marker が同じ workspace ID
であることを別途検証し、まず `inbox/<entry-stem>.json`へ同じ canonical entryとして exclusive-createし、
次に `deferred/promoted/<idempotencyKey>.json`を exclusive-createする。既存 inbox/promoted marker の同一 bytes
は retry 成功、異なる bytes は conflict。queue は監査用に保持し削除・上書きしない。promotion markerが欠けた
場合は inbox identity を再検証して補完できる。最初のdurable inbox entryの`createdAt`を論理promotion timestamp
として`promotedAt`へ複製し、inbox-first recovery/並列敗者は既存inboxのidentityと`createdAt`を検証して再利用する。
retry時刻から`promotedAt`を再mintしない。破損、identity mismatch、replay、duplicate、期限外は inbox
write 0で fail-closeし、別 workspaceへ再配送しない。

queue item と promotion marker は既存 runtime と同じ7日 retentionとする。GC は `deferred/` と
`deferred/promoted/` を明示走査し、`createdAt`/`promotedAt`から7日超のみを削除する。`inbox`の既存 glob GCへ
混ぜない。promotion とGCの競合はatomic claim/single-flightで処理し、勝者不明なら削除せず次回へ回す。

#### marker の計数と混在状態

raw `.generation` marker 数は診断値であり、routeの exact-one は schema-compatible marker を canonical
`workspaceId` で group 化した logical workspace 数で数える。group 内は fresh marker が1件でもあれば
`fresh`（fresh wins）、freshがなく有効 markerが1件以上なら `stale`。incompatible/corrupt/identity検証不能
が1件でもあれば全体を `incompatible_claude_workspace_schema` deny とする。

同一 workspace の複数 stale markerは logical count 1なので `deferred`、fresh+stale は `live`。別 workspaceの
fresh+stale、または複数 stale workspaceは `ambiguous_live_claude_workspace`。stale/fresh と incompatible の
混在は `incompatible_claude_workspace_schema`。この aggregation を route、test oracle、診断表示の共通正本とする。

`waitForClaudeMemory` の heartbeat は polling 中に更新できるが、closed marker schema、generation、canonical
workspace ID、session identity の検証が成功した後だけ marker を renew する。検証前・検証失敗・別 generation・
別 workspace・未知 schema・破損 marker は touch しない。fake/monotonic clock を注入したテストで、検証済み
heartbeat は 15 分超でも fresh を保ち、heartbeat を止めれば stale になる対照を固定する。

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

## §4.2 エピソードの回収 (PLAN-L6-97、issue #963)

`.ut-tdd/memory` には、durable な教訓と、PR / issue に紐づくエピソード (レビュー依頼の錨、lane の連絡) が
同じ置き場に入る。エピソードは対象が閉じると役目を終えるが、回収する経路が無く溜まり続ける
(2026-10-13 実測: 1865 本中 git 追跡は 46 本、名前に `pr-N` を含むもの 1435 本、1 日約 100 本増)。
本節はエピソードを分類し、対象が閉じたら archive へ退避する契約を定める。削除はしない。

新規の連絡・review custody を memory から分離する現在の契約は
`state-channel-consolidation.md` (issue #1062) が正本である。本節は #963 が担当する既存 memory の回収部品を定める。
#1062 が置き換えた旧書き込み・配送契約と、引き継がれていない受入責務は、下記のとおり別ownerの未完項目として残す。

### 分類

- frontmatter に `lifecycle` (`durable` | `episode`) と `bound_to` (GitHub の PR / issue URL の配列) を
  optional field として足す。`episode` は `bound_to` が 1 件以上必須。path や PLAN ID は取らない。
- あわせて `lifecycle_source` (`declared` | `inferred`) を持つ。`declared` は書き手が明示したもの、`inferred` は
  番号から推定したもの。退避の自動対象は `declared` だけである。
- `bound_to` の URL は HEAD の `ut-tdd.project.json` の `repository_identity` から組み立てた
  `https://github.com/<owner>/<repo>/pull/<N>` または `/issues/<N>` だけを受理する。別 repo の URL は拒否する。

### 書き込み時 (`memory add`)

> **旧契約 / 別owner**: 以下は #963 の回収実装の受入範囲ではない。新規 episode を memory に書かない規則は
> #1062 §6 が置き換える。旧 CANDIDATE-U-MEMEPI-001 / 006 / 011〜013 の write-time 契約は、#1062 の対応する
> 拒否規則の実装・受入で移管先が明示されるまで未完として追跡する。番号推定・episode 追加をこの回収実装に含めない。

1. `--lifecycle` / `--bound-to` の明示が最優先。
2. 明示が無く `kind=project` のとき、title と tags から `pr-?<N>` / `PR ?<N>` / `issue-?<N>` / `Issue ?<N>`
   (大文字小文字を区別しない) を拾えたら、`lifecycle: episode`、拾えた全番号の `bound_to`、
   `lifecycle_source: inferred` を書く。PR と issue の区別は字句どおり。Codex 側の呼び出しは無改修で書けるが、
   `inferred` は宣言として扱わない (下の「退避」を参照)。番号は「この PR から学んだ教訓」のような引用でも
   拾われるため、推定は候補を作るだけで、それだけでは退避しない。
3. 明示した場合は `lifecycle_source: declared` を書く。review dispatch の錨や lane の連絡を書く側は、
   `--lifecycle episode --bound-to <URL>` を明示する。
4. `kind` が `feedback` / `reference` / `user` で明示が無いときは `durable`。これらの kind は定義上 durable で
   あり、黙った既定ではなく kind からの規則である。
5. 上のどれにも当たらない `kind=project` は fail-close する (エラーに `--lifecycle` の指定を案内する)。
   PLAN-L6-97 §3.3 の「新規は宣言必須」を保つ。

### 読み取り時 (既存分)

- `lifecycle` 未宣言の既存ファイルは `durable` として扱う (PLAN-L6-97 §3.2 の保持側の向きを保つ)。
- ただし untracked かつ `kind=project` のものは、書き込み時 2 と同じ規則で番号を拾えたら
  `lifecycle_source: inferred` の episode 候補として報告に出す。git 追跡済みのもの (clean-cut で選別済みの正本) と、
  `kind` が `project` 以外のものは候補にしない。

### 回収の判定

各 `bound_to` を次の三値で判定し、エピソード全体は「全件 closed なら `retirable`、1 件でも open なら `ok`、
それ以外は `unknown`」とする。

- PR: `git log --first-parent <default branch>` に `Merge pull request #<N> ` の merge commit があれば closed
  (ネットに頼らない)。無い場合は GitHub を引き、merge されずに close なら closed、open なら open、
  到達できなければ unknown。
- issue: GitHub を引く。close なら closed、open なら open、到達できなければ unknown。
- `unknown` は `retirable` にも `ok` にも混ぜない。

### 退避 (`ut-tdd memory retire`)

- 既定は dry-run で、下の集計と、`retirable` の一覧 (出自 `declared` / `inferred` つき) を出す。
- **API / composition point**: 現行 `src/memory/service.ts` の named-function 構成に合わせ、回収入口を
  `retireMemoryEpisodes({ repoRoot, nowISO, dryRun?, includeInferred? }, ports?)` とする。`nowISO` は有効な UTC
  ISO-8601 timestamp とし、移し先 month (`<UTC YYYY-MM>`) と初回 manifest `recorded_at` に使う。`dryRun` の既定は
  `true`、`includeInferred` の既定は `false`。追加する `ut-tdd memory retire` CLI handler が呼ぶ service operation
  であり、別 CLI や storage primitive の export ではない。返却値は同期 I/O の処理完了後の typed result とする。
  service class は新設せず、既存 `writeMemory` signature は変更しない。
- **success report** は `{ ok: true, dryRun, total, counts, retirable, moved }`。`counts` は次の10キーをすべて持つ
  整数 record とする: `tracked_durable`, `untracked_durable`, `episode_retirable_declared`, `episode_ok_declared`,
  `episode_unknown_declared`, `episode_retirable_inferred`, `episode_ok_inferred`, `episode_unknown_inferred`,
  `parse_failed`, `not_memory_entry`。`total` は `.ut-tdd/memory/` の直下にある全 directory entry 数で、全 count の合計と
  一致する。再帰せず、symlink をたどらない。追跡済みの直下 entry は file type / extension を問わず常に
  `tracked_durable` とし、tracked symlink や tracked submodule directory も follow / recurse せず保持する。
  untracked regular `.md` (拡張子比較は case-insensitive) は frontmatter を解析する。untracked non-`.md` regular file、directory、symlink、その他
  non-regular entry は `not_memory_entry` として保持し、移動しない。`.md` の読み取り/frontmatter parse failure は
  `parse_failed` に一度だけ計上し (tracked direct entry は tracked_durable を優先)、解析不能時に対象範囲を縮めない。directory 列挙自体の failure は
  `memory_archive_io_failed` とする。
  `counts` と `retirable` は operation 開始時の一つの read snapshot から算出する。`retirable` は候補全件を
  `memory_id` 昇順で含み、各 row は `{ memory_id, source_path, lifecycle_source, bound_to }` (`bound_to` も URL 昇順)。
  `moved` は dry-run では移動予定、archive 成功時は実移動済みの一覧であり、各 row は
  `{ memory_id, source_path, destination_path, sha256 }`、同じく `memory_id` 昇順とする。従って dry-run の `moved`
  は実移動済みを意味しない。tracked は必ず `tracked_durable`、parse 失敗は必ず `parse_failed` に一度だけ計上し、
  どちらも `retirable` / `moved` に現れない。
- **typed failure** は `{ ok: false, reason }` とし、archive manifest / source-destination / recovery の不整合は
  `memory_archive_recovery_conflict`、その他 I/O failure は `memory_archive_io_failed`。GitHub 到達不能は失敗ではなく
  対象の `unknown` 判定であり、doctor advisory を含め exit 0 を保つ。`nowISO` が不正な場合は filesystem / DB I/O
  前に `TypeError` とし、filesystem / DB のどちらにも I/O を行わない。CLI は `ok:false` を exit 1、成功を exit 0 に写像する。
- `ports` は同じ production operation の外部境界だけを差し替える。`resolveGitHubStatus` / `checkpoint` は省略できるが、
  **`db` は必須であり、省略時に production adapter へ fallback しない** (下の「DB 操作の port」)。
  ```ts
  ports?: {
    resolveGitHubStatus?: (input: { url: string }) => { state: "open" | "closed" | "unknown" };
    checkpoint?: (input: {
      point: "beforeIntentAppend" | "afterIntentAppendBeforeRename" | "afterRenameBeforeDbDelete" | "afterDbDeleteBeforeDoneAppend";
      memoryId: string;
      sourcePath: string;
      destinationPath: string;
      sha256: string;
    }) => void;
    db: MemoryArchiveDbPort;
  }
  ```
  `resolveGitHubStatus` / `checkpoint` は同期関数、`db` は同期 method だけを持つ構造的 object である (`db` 自体は関数ではない)。status resolver は GitHub PR / issue 状態のみを注入し、throw または不正 result は `unknown`
  とする。PR の `git log --first-parent <default branch>` merge-commit 検査は実 repository 上で必ず行い、merge commit が
  あれば外部 port を呼ばず `git_first_parent_merge` 根拠で closed とする。fixture は checkpoint callback から sentinel
  exception を送出でき、その exception は `retireMemoryEpisodes` から**そのまま propagate**し `{ ok:false }` に変換しない。
  `resolveGitHubStatus` の省略は従来どおり production の GitHub 照会 (state-db を import しない)、`checkpoint` の省略は
  no-op とする。この 2 つの省略規則は state-db 依存を含まない。checkpoint と `db` を除き、分類・manifest・rename は
  実 operation を通す。CLI/env test knob、偽 archive 実装、未実装 export import は認めない。

#### DB 操作の port (`ports.db`、issue #963)

memory は state-db を import しない (§canonical memory root resolver の配置)。`memory_entries` の行操作は、memory が所有する
次の構造的 port として定義し、実装は呼び出し側が注入する。port は現行 scaffold が `node:sqlite` で行っている操作
(read-only の preflight 検査と、WAL 手順 (3) の行削除) だけを覆い、他の操作を足さない。

```ts
interface MemoryArchiveDbPort {
  inspectEntry(input: { memoryId: string; sourcePath: string; contentHash: string }):
    | { status: "match" }
    | { status: "row_absent" }
    | { status: "row_mismatch" }
    | { status: "schema_unready" };
  deleteEntryRow(input: { memoryId: string; sourcePath: string }): { deleted: number };
}
```

- `inspectEntry` は read-only の同期検査で、preflight (全 entry の事前検査、dry-run を含む) と回復時に呼ぶ。DB file が通常 file
  でない (不在・symlink・非 regular)、`PRAGMA user_version` が現行 `SCHEMA_VERSION` と異なる、`memory_entries` table が
  無いのいずれかは `schema_unready`。行が無ければ `row_absent`、`source_path` または `content_hash` が入力と異なれば
  `row_mismatch`、すべて一致すれば `match`。DB file の検査 (lstat) と schema 検査は adapter の責務であり、memory 側は DB path を持たない。
- memory の写像: `schema_unready` と `row_mismatch` は `memory_archive_recovery_conflict` (全体停止、他 entry の intent / rename /
  DB delete を開始しない)。`row_absent` は、既存 `intent` の回復で移し先のみ存在し hash 一致のとき (= DB 削除済み、done 未追記) に
  限り受理し、それ以外 (新規選択 entry など) は `memory_archive_recovery_conflict`。`match` は通常経路。
- `deleteEntryRow` は WAL 手順 (3) だけで呼ぶ書き込みで、`memory_id` と `source_path` の両方が一致する行を削除し、削除件数を返す。
  `deleted === 1` 以外は `memory_archive_recovery_conflict` とし、`done` を追記しない。
- port 呼び出しが throw したときは `memory_archive_io_failed` の typed failure とする (checkpoint の sentinel exception とは
  別で、こちらは `{ ok:false }` に変換する)。freshness の再計算や DB の再投影は port に含めない。
- **省略は fail-close**: `ports` が未指定、`ports.db` が未指定、または `ports.db.inspectEntry` / `ports.db.deleteEntryRow` のいずれかが関数でないとき (検証対象は `db` の 2 method であり、`typeof ports.db` を関数かどうかで判定しない。2 method を持つ有効な object は受理する)、`nowISO` 検査 (不正なら従来どおり `TypeError`) の後、
  filesystem / manifest / DB の I/O を一切行わず `{ ok:false, reason:"memory_archive_io_failed" }` を返す。production adapter
  への fallback も、service 内の SQL も持たない。dry-run でも同じ (preflight が `inspectEntry` を要するため)。
- **production adapter と composition root**: production adapter は `src/state-db/` に置き、SQL と transaction はそこに閉じる。
  CLI の composition root (`ut-tdd memory retire` handler) が adapter を作って `ports.db` に注入し、adapter の DB 対象
  (`<canonicalProjectRoot>/.ut-tdd/harness.db`) が resolver の `canonicalProjectRoot` と一致することを `retireMemoryEpisodes`
  の呼び出し前に検証する。一致しなければ I/O 前に fail-close し (`memory_archive_io_failed`、exit 1)、adapter は作らない。
- テストは isolated sqlite の test adapter を `ports.db` に注入する。共有 harness DB は開かない。

- **集計**は `.ut-tdd/memory` 直下の全 directory entry を次の区分のどれか1つに入れ、区分の合計 = entry 数とする。
  `tracked_durable` / `untracked_durable` (宣言または kind による) / `episode_<retirable|ok|unknown>_<declared|inferred>`
  (6 区分) / `parse_failed` (untracked regular `.md` の読み取り/frontmatter が失敗したもの。退避しない) / `not_memory_entry`
  (untracked non-`.md` regular file、directory、symlink、その他 non-regular entry。保持し、再帰 / follow しない)。
  tracked direct entry は常に `tracked_durable` に入る。
- `--archive` は `retirable` かつ `declared` だけを移す。`inferred` を移すには `--include-inferred` を足す。
  これは dry-run の一覧を人が見て、引用の教訓が混ざっていないことを確かめてから流す 1 回限りの操作であり、
  EOD では使わない。
- 移し先は `.ut-tdd/archive/memory-episodes/<YYYY-MM>/` (`.ut-tdd/archive/` は gitignore 済み)。
- **manifest** は `.ut-tdd/archive/memory-episodes/manifest.jsonl` に置く独自形式 (`ut-tdd.memory-episode-archive/v1`) で、
  1 行 1 イベントの追記専用とする。#1062 が同じ path を使う state-channel selector とは別 schema discriminator を使い、
  `ut-tdd.state-channel-memory-archive/v1` row は #1062 §7.1 の closed schema で検証したうえで、#963 selector の選別・
  recovery input には使わず、#963 の処理対象から除外する (逆方向も同じ)。有効な foreign row の存在は #963 operation に影響せず、
  row bytes・関連 file・DB row を変更しない。未知 schema row と、既知 schema でも malformed な row は黙って無視せず
  `memory_archive_recovery_conflict` で全体停止する。`src/memory/legacy-archive-manifest.ts`
  の形式 (固定の legacy root、untracked は件数と集合 digest だけ) は変えず、流用するのは sha256 の計算部品だけにする。
- 1 件の手順は write-ahead とする: (1) `state: intent` の行 (`memory_id`、元 path、移し先 path、sha256、bytes、`bound_to`、
  判定の根拠 = merge commit または GitHub の状態、出自、時刻) を追記 → (2) rename → (3) `ports.db.deleteEntryRow` で `memory_entries` から当該行を削除 →
  (4) `state: done` の行を追記。event は exact keys `{ schema, state, memory_id, source_path, destination_path, sha256,
  bytes, bound_to, selection_basis, recorded_at }`、`schema` は `ut-tdd.memory-episode-archive/v1`、`state` は `intent` /
  `done`、digest は prefix なし lower-case SHA-256 64桁とする。`selection_basis` は exact keys
  `{ kind, lifecycle_source, closed_evidence }`、`kind` は `memory-episode-closure/v1`、`lifecycle_source` は
  `declared` / `inferred`、`closed_evidence` は `bound_to` の全 URL を URL 昇順に持つ discriminated union 配列とする。
  Git 根拠は exact keys `{ url, via, commit_sha }`、`via` は `git_first_parent_merge`、`commit_sha` は実際の default
  branch first-parent merge commit の 40桁 lower-case hex SHA-1。GitHub 根拠は exact keys
  `{ url, via, observed_state }`、`via` は `github_closed`、`observed_state` は resolver が返した `closed`。PR merge commit
  があるときは Git root の実 commit SHA を記録し、外部 resolver の値で置き換えない。open / unknown entry は archive
  対象でないため intent を書かない。`intent` と対応する `done` は
  同じ intent payload (state 以外の field) と `recorded_at` / destination / sha256 を再利用する。
- recovery は**新規 entry の書き込み前に全 entry を preflight**する。既存 `intent` について元 path のみ存在し hash
  一致なら rename から、移し先のみ存在し hash 一致なら DB row 削除から再開する。両 path が存在、両方不在、既存側 hash
  不一致、manifest row の schema / identity 不正のいずれかなら `{ ok:false, reason:"memory_archive_recovery_conflict" }`
  とし、`done` を追記せず、当該 DB row を消さず、他 entry の新規処理も開始しない。その他の archive I/O failure は
  `memory_archive_io_failed`。既存 `done` row は source が無く移し先だけが存在し、その内容の digest が row の
  `sha256` と一致するときに限り処理済みとして受理する。それ以外 (source が残る、移し先が無い、両方ある、両方無い、
  digest 不一致) は `memory_archive_recovery_conflict` で全体停止する。正当な `done` row は再処理せず、重複 `done` を追記しない。
  新規選択 entry の移し先が既に存在する場合、または新規選択 entry の `memory_id` が既存 row と衝突し、回復可能な既存
  `intent` に結び付かない場合も、上書き・黙示 skip をせず `memory_archive_recovery_conflict` で全体停止する。回復可能な既存
  `intent` は上記の recovery 手順で再開し、この新規 destination 衝突規則によって拒否しない。failure は成功扱いへ丸めない。
- archive は選別・全直接 entry の列挙・project identity・manifest 全行・既存 recovery state・全選択 source bytes/hash・
  isolated projection DB readiness を preflight し、成功するまで file / manifest / DB に書かない。どれかの preflight
  conflict / failure は他 entry の intent append、rename、DB delete を一切開始しない。dry-run も同じ read / classify /
  report 経路を使うが file / manifest / DB write は常に0である。
- **fault checkpoints** は `beforeIntentAppend`, `afterIntentAppendBeforeRename`, `afterRenameBeforeDbDelete`,
  `afterDbDeleteBeforeDoneAppend` の4点だけ。checkpoint は各境界で実 WAL operation から呼ぶ同期 test port であり、
  production の sequence を置き換えない。L7 は callback を throw させた直後、再実行前に実 manifest bytes・source / target
  path と sha256・isolated `memory_entries` row を直接観測する。その後同じ実 operation を再実行し、各 checkpoint から
  `done` 1件・移し先 hash 一致・DB row 不在・二重 rename なしへ回復することを確かめる。
- #1062 の `archiveStateChannelMemoryEpisodes({ repoRoot, nowISO, dryRun? })` は snapshot selector 専用の composition
  point として保ち、#963 の `retireMemoryEpisodes` と selector / selection basis を混ぜない。両 operation は同じ実 WAL
  processor と checkpoint 境界を使えるが、各々の result contract と manifest discriminator を維持する。
- ファイルを削除する経路は持たない。git 追跡済みのファイルは対象外。
- doctor の `memory-retirable` row は dry-run と同じ集計を出す advisory で、doctor を fail させない。
- EOD の閉店処理で `memory retire --archive` (declared のみ) を 1 回流す。

### canonical memory root resolver の配置 (issue #963)

memory module が canonical root の解決を所有する。解決部品は `src/memory/project-memory-root.ts` に置く。
canonical root、HEAD identity、worktree topology の判定と、symlink / escape の拒否は現行の挙動のまま移し、簡略化しない。
`src/runtime/project-memory-root.ts` は互換のための re-export だけを持ち、実装を複製しない。

- `src/memory/service.ts` は runtime と state-db を import しない (module cycle を作らない)。
- DB の削除操作は memory が所有する構造的 port として定義し、CLI の composition root が注入する。
  composition root は DB の対象が resolver の `canonicalProjectRoot` と一致することを検証し、
  一致しなければ fail-close する。

### 配送側

> **旧契約 / 別owner**: 以下の新規 episode 配送抑止は #1062 が置き換える。CANDIDATE-U-MEMEPI-009 / 010 / 018 の
> 受入責務は未完として残り、#1062 の通知実装 / 受入へ移管先が明示されるまで完了扱いにしない。この #963 回収差分では
> `claude-memory-wake`、`memory add --notify-claude` を変更しない。

- Claude への即時配送 (claude-memory-wake) は、`episode` かつ `lifecycle_source: declared` かつ判定が `retirable`
  (確定的に closed) のものを配送しない。`inferred` は判定にかかわらず配送する (番号の引用だけの恒久教訓を、配送面でも
  推定で落とさない)。`unknown` は配送する (生きた依頼を offline を理由に落とさない)。doctor 側と向きが逆である
  理由ごと凍結する (PLAN-L6-97 §3.6)。

### review dispatch との関係

> **旧契約 / 別owner**: この段落の memory に review anchor を残す仕様は #1062 が置き換える。CANDIDATE-U-MEMEPI-009
> の責務を #963 の退避実装で完了扱いにせず、#1062 の custody / notification implementation で移管状態を明示する。

PLAN-L6-97 §3.7 は「レビュー依頼や進捗連絡は memory に書かない」としていたが、現行の review dispatch は
`--review-memory-id` を必須とし、依頼の錨を memory に書く。本節はこの錨を正当な `episode` として扱い、
退避の対象にする。`readCanonicalMemoryByIdentity` は dispatch の時点でしか錨を読まないので、PR が閉じた後の
退避は参照を壊さない。錨を memory から外すかどうかは `state-channel-consolidation.md` (issue #1062) が決めた: 錨は review request 自体に移り、新規のレビュー依頼・lane 連絡は memory に書かれない。本節の書き込み時 3・配送側・本項は、その実装 PR で同文書に置き換わる。既存分の退避部品は同文書 §7 が再利用する。

### エッジケース

| # | ケース | 期待挙動 | oracle |
|---|---|---|---|
| 1 | `kind=project`、明示なし、title に `PR 962` と `Issue 898` | `episode` (`inferred`)、`bound_to` = PR 962 と issue 898 | CANDIDATE-U-MEMEPI-012 |
| 2 | `kind=project`、明示なし、番号も無し | fail-close (exit 1) | CANDIDATE-U-MEMEPI-011 |
| 3 | `kind=feedback`、title に `PR 551` | `durable` (推定しない) | CANDIDATE-U-MEMEPI-013 |
| 4 | git 追跡済み、`lifecycle` 未宣言 | `tracked_durable`、退避しない | CANDIDATE-U-MEMEPI-002 |
| 5 | `bound_to` の PR が merge 済み (merge commit あり、offline) | `retirable` | CANDIDATE-U-MEMEPI-003 |
| 6 | `bound_to` の 1 件が open | `ok` | CANDIDATE-U-MEMEPI-004 |
| 7 | merge commit が無く GitHub に届かない | `unknown`、doctor は fail しない | CANDIDATE-U-MEMEPI-005 |
| 8 | 4 つの中断点 (intent 前 / intent 後 rename 前 / rename 後 db 削除前 / db 削除後 done 前) で止めて再実行 | 各点で manifest と実ファイルの状態が契約どおりで、再実行後は二重移動なし・db 行一致 | CANDIDATE-U-MEMEPI-014 |
| 9 | 退避後に `ut-tdd db status` / `readMemory` | index-only 行が残らず `fresh` | CANDIDATE-U-MEMEPI-015 |
| 10 | dry-run (`--archive` なし) | ファイル・db とも不変 | CANDIDATE-U-MEMEPI-007 |
| 11 | untracked、`kind=project`、未宣言、title「PR 949 で学んだ恒久の設計制約」、PR 949 は merge 済み | `episode_retirable_inferred`。`--archive` では移らず、`--include-inferred` を付けたときだけ移る | CANDIDATE-U-MEMEPI-017 |
| 12 | 集計 | 区分の合計 = 全ファイル数、tracked は全件 `tracked_durable` | CANDIDATE-U-MEMEPI-016 |
| 13 | 推定 episode (引用だけの恒久教訓) の即時配送 | 配送する | CANDIDATE-U-MEMEPI-018 |
| 14 | 中断後に移し先の bytes が変わった、または両方の path から消えた | 止めて報告、exit 1、`done` なし、db 行は残る | CANDIDATE-U-MEMEPI-019 |
| 15 | 既存 `done` row の source absent / destination present / row digest一致、および各不整合状態 | 正当な1状態だけ受理。不整合は全体conflict | CANDIDATE-U-MEMEPI-020 |
| 16 | 新規選択 entry の destination が既に存在、または新規選択 entry の同一 `memory_id` row 衝突 (回復可能な既存 `intent` ではない) | 上書き・黙示skipなしで全体conflict。回復可能な既存 `intent` は再開 | CANDIDATE-U-MEMEPI-021 |
| 17 | invalid UTC ISO `nowISO` | filesystem / DB I/O 前に `TypeError`、I/O 0 | CANDIDATE-U-MEMEPI-022 |
| 18 | Git first-parent merge を根拠にした manifest event | exact keys、実 commit SHA、resolver未呼出し、intent/done payload・時刻一致 | CANDIDATE-U-MEMEPI-023 |
| 19 | GitHub closed を根拠にした manifest event | exact keys、全 `bound_to` evidence、URL順、intent/done一致 | CANDIDATE-U-MEMEPI-024 |
| 20 | manifest の (a) unknown schema row、(b) 既知 schema の malformed row (foreign state-channel row の不正形を含む) を独立 fixture で検証 | 各々 `memory_archive_recovery_conflict`、他entryも変更しない | CANDIDATE-U-MEMEPI-025 (a)/(b) |
| 21 | valid `ut-tdd.state-channel-memory-archive/v1` row が同じ manifest にある | #963 で選別・recoveryに使わず、foreign row / 関連file / DBを変更しない | CANDIDATE-U-MEMEPI-027 |
| 22 | status resolver が throw / invalid result を返す | `unknown`、archive対象外、対象の file / DB / manifest 不変 | CANDIDATE-U-MEMEPI-026 |

## §5 検証接続

L7 unit-test design の U-MEMORY-* が本 doc の contract を検証する。`tests/memory-*.test.ts` と `tests/projection-writer.test.ts` の `memory_entries` projection が回帰 fence になる。
