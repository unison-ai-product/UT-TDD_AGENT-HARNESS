---
title: "L7 state channel consolidation test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
updated: 2026-10-15
---

# 状態を伝える経路の一本化 テスト設計 (issue #1062)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/state-channel-consolidation.md` である。
本書はその §3 通知レコード、§4 review custody の差し替え、§5 handover prose の退役、§6 `memory add` の拒否規則、
§7 既存分の移行、§9 不変条件を検証する oracle を定義する。共有の `docs/test-design/harness/L7-unit-test-design.md` には
索引だけを置き、本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-STCHAN-*`) だけを宣言する。Red は後続 PR で、設計保護 gate の
L6 `design-protection-diff-gate.md` §10.3 と同じ順序にする: (1) Red のテスト (`it.fails`) を候補 ID で引用して入れる、
(2) 正式 ID `U-STCHAN-*` への昇格を src/ を含まない PR で入れる、(3) 実装 PR で `it.fails` を `it` に戻して Green にする。
`memory.md` §4.2 の `CANDIDATE-U-MEMEPI-*` は本書で置き換える範囲 (新規 episode の書き込み・配送) では引き継がず、
退避部品 (MEMEPI-007 / 014 / 015 / 019) だけを移行 (022〜024) が再利用する。

## 2. fixture

- 一時 git repo に `ut-tdd.project.json` (repository_identity = `example/repo`) を置く。`memory add` の行は実 CLI を子プロセスで呼ぶ。
- custody の行は、request を直接組み立てる純粋関数の入力で作る。実 reviewer は起動しない。
- 受信箱の行は一時 git common dir 配下の runtime bus に entry を書き、Stop hook の選択関数を直接呼ぶ。
- 実 repo を読む行 (024) は計測値を固定せず、dry-run の区分合計で照合する。

## 3. Candidate oracle matrix

| Candidate | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| CANDIDATE-U-STCHAN-001 | `memory add --kind project --title "PR 1055 CI と control merge"`、`--durable-reason` なし | exit 1、`episodic_memory_rejected`、`.ut-tdd/memory` に新規ファイルなし、拒否文言に GitHub コメントと `ut-tdd notify claude` の案内 | kind=project の拒否を外す / 検査を書き込みの後ろへ置く (ファイルが残る) |
| CANDIDATE-U-STCHAN-002 | `memory add --kind project --durable-reason "変わらない制約"` | 書かれ、frontmatter に `durable_reason` | 理由を無視して拒否する / 理由を frontmatter に残さない |
| CANDIDATE-U-STCHAN-003 | `--durable-reason "   "` (空白のみ) | exit 1、`episodic_memory_rejected` | 空白を非空として扱う |
| CANDIDATE-U-STCHAN-004 | `memory add --kind feedback --title "PR #700 の重複 request は merge を塞ぐ"` | 書かれる (番号は見ない) | 全 kind に番号の正規表現を適用する |
| CANDIDATE-U-STCHAN-005 | `--kind reference` と `--kind user`、title に `Issue 898` | どちらも書かれる | project 以外へ拒否を広げる |
| CANDIDATE-U-STCHAN-006 | 追跡済みの 46 件 (実 repo の `git ls-files .ut-tdd/memory`) の kind を `classifyMemoryAdd` に通す | 全件 accept (project は 0 件であること自体も assert) | 既存の正本を拒否する規則にする |
| CANDIDATE-U-STCHAN-007 | 同じ `(pr, exactHead, authorFamily)` で request を 2 回作る。2 回目は `requestedAt` と nonce を変える | digest・path が一致、`review-dispatch` が `duplicate_request_conflict` を出さない。digest は canonical identity の 4 key (`schemaVersion` / `pr` / `exactHead` / `authorFamily`) から**テスト内で独立に計算した値と一致**し、`requestedAt` / nonce を変えても不変 | identity に nonce・`requestedAt` を入れる / `memoryId` を残す / 実装と同じ関数で期待値を作って循環検証にする |
| CANDIDATE-U-STCHAN-008 | `exactHead` だけ違う 2 request | digest が異なる | `exactHead` を identity から落とす |
| CANDIDATE-U-STCHAN-009 | v1 (`memoryId` を含む) で作った open request と closed receipt を、v2 の読み取りに通す | merge gate が v1 を検証できる (receipt の `memoryId` と request が一致)。v2 cutover 後も、terminal な v1 receipt を持つ未 merge の PR の merge gate と post-merge-backstop が読み取れる (v1 parser は恒久) | 読み取りが v1 を捨てる / v1 を v2 の digest で検証する / cutover 後に v1 parser を消す |
| CANDIDATE-U-STCHAN-010 | window 中に委譲 CLI へ `--review-memory-id x` を渡す | 受理、stderr に `review_memory_id_deprecated`、作られる request は v2 で `memoryId` を持たない | flag を identity に入れ続ける / 警告を出さない |
| CANDIDATE-U-STCHAN-011 | cutover 後に `--review-memory-id x` を渡す | exit 1、`review_memory_id_retired`、request を作らない | cutover 後も受理する / `reviewIdentityRequested` に残す |
| CANDIDATE-U-STCHAN-012 | `.ut-tdd/memory` が存在しない repo で `review live-dispatch --task-file t.md`。さらに、同じ `pr` / `exactHead` / `authorFamily` で task 本文だけ違う 2 入力を渡す | request と通知が作られ、task が `.ut-tdd/review/requests/<digest>.task.md` に複製される。`readCanonicalMemoryByIdentity` は呼ばれない。2 入力の digest と request path は一致し (task を identity に入れない)、digest は canonical identity の 4 key から独立に計算した値と一致する。task の複製先は同じ `<digest>.task.md` で、同一 digest で task 本文が既存と違う場合は先勝ちで上書きしない (既存の task 複製を保持し、警告を出す) | memory の読み取りを残す / task を identity に入れる |
| CANDIDATE-U-STCHAN-013 | v2 の request に `memoryId` key を足した JSON を `loadCanonicalLiveReviewRequest` に通す | `null` (exact key 違反) | exact key の検査を緩める |
| CANDIDATE-U-STCHAN-014 | custody runner に env `UT_TDD_CUSTODY_MEMORY_ID` なしで v2 request を渡す | 動く (必須でなくなる) | 環境変数を必須のまま残す |
| CANDIDATE-U-STCHAN-015 | `ut-tdd notify claude --ref <同 repo の PR コメント URL> --body x` | `ut-tdd.notification/v1`、`purpose=note`、`memory_id` / `memoryPath` を持たない entry が runtime bus に載る | entry に memory 項目を残す |
| CANDIDATE-U-STCHAN-016 | `--ref` なし、または別 repo の URL、または非 GitHub URL | exit 1、entry を書かない | ref を任意にする / repo 照合を外す |
| CANDIDATE-U-STCHAN-017 | window 中に v3 / v4 の旧 entry と v1 entry を同時に inbox へ置く | Stop hook の選択が両方を復号し、claim・terminal 判定が従来どおり (U-MEMWAKE-* の回帰) | 旧 entry の復号を落とす / 新 entry だけ選ぶ |
| CANDIDATE-U-STCHAN-018 | `.ut-tdd/memory` を読めない状態 (権限なし) で `notify claude` を実行 | 成功する (memory に触れない) | 通知の生成が `requireProjectMemoryRoot` 以外で memory を読む |
| CANDIDATE-U-STCHAN-019 | `ut-tdd handover` (dry-run と通常) | 通常は `.ut-tdd/handover/CURRENT.json` だけを書き、`docs/handover/session-handover-*.md` を作らない。dry-run は何も書かない。`CURRENT.json` に `latest_doc` / `doc_entry_count` がない | scaffold の書き出しを残す / dry-run で書く |
| CANDIDATE-U-STCHAN-020 | `.ut-tdd/handover/` に `CURRENT.json`、`.gitkeep`、`provider/`、`archive/`、`close-20261009.md`、`x.sh` を置いて doctor の `handover-prose` row を見る | 件数 2、advisory で doctor の exit に影響しない | 許可リストに `provider/` を入れ忘れて数える / fail させる |
| CANDIDATE-U-STCHAN-021 | `doc_entry_count` のない `CURRENT.json` を `checkHandoverBypass` に通す | 警告しない (md 照合を廃止した結果) | md 不在を bypass 扱いにする |
| CANDIDATE-U-STCHAN-022 | fixture: 追跡 feedback、未追跡 feedback (title に `PR 700`)、未追跡 project 3 件 (番号あり / なし / open な review request が task として参照) で memory の移行 dry-run。加えて保持 fixture 2 種: (R1) **凍結時点で既に** `durable_reason` を持つ project memory (凍結一覧に載り、凍結後に bytes を変えない)、(R2) 拒否規則の cutover 後に `--durable-reason` 付きで受理した project memory (凍結一覧に載らない) | 移す対象は未追跡 project のうち参照されていない 2 件。feedback は両方残る。参照されている 1 件は skip として報告。R1 は検証を通り(bytes 不変)、一覧に載るが保持規則で移されず、元の path と `memory_entries` に残って `memory list --query` で検索できる。R2 も同様に残り検索できる。一覧にない未追跡 project (cutover 後に書かれたもの) は動かさない | 選別を番号の正規表現にする / 参照検査を外す / 移行時に再走査して凍結一覧を使わない / `durable_reason` を見ない / 保持規則を検証より先に評価して R1 の検証を飛ばす |
| CANDIDATE-U-STCHAN-023 | handover の移行で、許可リスト内のエントリ、最終更新が 24 時間未満の `.sh`、古い `.md` を置く | 古い `.md` だけが `.ut-tdd/archive/handover-prose/<YYYY-MM>/` へ移る。manifest に sha256 と `done` 1 行。許可リスト内と新しい `.sh` は動かない。削除経路なし。dry-run は不変 | 24 時間の保護を外す / 許可リストを動かす / 移動後に元を残す |
| CANDIDATE-U-STCHAN-024 | 実 repo で memory と handover の移行を **dry-run だけ**流す(`--archive` は実 repo では流さない) | 区分の合計 = 全ファイル数 (memory は `ls .ut-tdd/memory`、handover は `ls .ut-tdd/handover`)。追跡済み 46 件の区分は不変。dry-run の前後で `ls`・`git ls-files`・`ut-tdd db status` の出力が同一(何も動かない) | 集計から区分を落とす / dry-run で移す・行を消す |
| CANDIDATE-U-STCHAN-025 | 凍結一覧(3 件)と証跡ファイルを作った状態で、一覧に (a) 行を 1 つ追加 (b) 行を 1 つ削除 (c) 1 行の `memory_id` か digest を置換、のそれぞれで移行を実行 | 3 通りとも exit 1、`target_snapshot_digest_mismatch`、memory ファイルも `memory_entries` も 1 件も動かない。一覧ファイルが無い場合は `target_snapshot_missing` | 照合を行数だけにする / 行ごとの digest だけを見て全体 digest を見ない / 不一致でも一部を移す |
| CANDIDATE-U-STCHAN-026 | 凍結一覧が既にある状態で、書き手を再実行する(中身が同一の場合と、新規の project memory が増えた場合の両方)。証跡ファイルだけがある状態でも再実行 | どれも exit 1、`target_snapshot_exists`、一覧も証跡ファイルも bytes が不変 | 同一内容なら上書きを許す / 証跡ファイルだけの状態を許す / 再生成の経路を残す |
| CANDIDATE-U-STCHAN-027 | 凍結一覧と証跡ファイルは正しいまま、対象の 1 件の memory ファイルの本文を 1 byte 変える。別ケースとして、凍結一覧に載る別の 1 件に、凍結**後**に `durable_reason` を追記する(bytes が変わる) | どちらのケースも exit 1、`target_bytes_changed`、memory ファイルも `memory_entries` も 1 件も動かない(追記したものも他の対象も同様)。追記を凍結時の bytes に戻して再実行すると検証を通り、凍結一覧どおりに移される(再凍結・追記して残す経路は無い) | 一覧の digest だけを検証して対象の bytes を見ない / 検証を移動の途中で行う / `durable_reason` の追記を保持として扱い、検証を飛ばして残す / 失敗時に他の対象だけ移す |
| CANDIDATE-U-STCHAN-028 | **隔離 fixture(一時 git repo + 一時 harness.db)で `--archive` を実際に実行**する。凍結一覧の対象 3 件(移す対象 2 件 + R1)、R2 1 件、未追跡 feedback 1 件、追跡 feedback 1 件を `memory_entries` に索引済みにしてから実行 | 移した 2 件は、ファイルが移し先にあり sha256 が一致し、`memory_entries` に行が無い。R1 / R2 / feedback 2 件は元の path に残り、`memory_entries` の行が移行前と同一で、`memory list --query` で検索できる(移した 2 件は検索に出ない)。`ut-tdd db status` は `fresh`、index-only 行 0。移した件数 + 残り = 移行前の総数 | 行の削除を省く(移したものが検索に出続ける) / 残すべき R1 / R2 の行まで消す / ファイル移動の後に db 更新を飛ばす / 実行後の `db status` を見ない |

### CANDIDATE-U-STCHAN-017 の notification v1 整合性 oracle

Candidate 017 の valid notification v1 fixture は、L6 §3.1 の preimage をテスト内で独立に `JSON.stringify` し、UTF-8 SHA-256 を計算して `envelopeDigest` と `id` に使う。fixture の全 preimage field と nested field は次の literal JSON bytes (表示上の改行なし) とし、期待 digest は `97f5c919948ab92a1cfb4006674323b57a3609c0c3f4c5bf068196cf41c8f4e1`:

```json
{"schemaVersion":"ut-tdd.notification/v1","projectId":"fixture-project","operationId":"op-note","producer":{"provider":"codex","sessionId":"producer"},"target":{"scope":"session","provider":"claude","sessionId":"target"}}
```

valid entry は、L6 §3 に列挙した全共通 field と `purpose=note` の field を次の literal 値で持つ (`requestDigest` 等の review-only field は持たない)。`targetWorkspaceId` は `a` を64個並べた文字列、`id` は表中の full literal とする。

```json
{"schemaVersion":"ut-tdd.notification/v1","purpose":"note","id":"note:97f5c919948ab92a1cfb4006674323b57a3609c0c3f4c5bf068196cf41c8f4e1:workspace:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:op:op-note","body":"fixture note","originRuntime":"codex","operationId":"op-note","targetWorkspaceId":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","createdAt":"2026-10-16T00:00:00.000Z","projectId":"fixture-project","producer":{"provider":"codex","sessionId":"producer"},"target":{"scope":"session","provider":"claude","sessionId":"target"},"envelopeDigest":"97f5c919948ab92a1cfb4006674323b57a3609c0c3f4c5bf068196cf41c8f4e1","ref":"https://github.com/example/repo/issues/1062#issuecomment-1"}
```

sidecar binding も全 field を次の literal 値で持ち、exact keys は L6 §3.1 の集合と一致する。

```json
{"schemaVersion":"ut-tdd.notification-binding/v1","entryId":"note:97f5c919948ab92a1cfb4006674323b57a3609c0c3f4c5bf068196cf41c8f4e1:workspace:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:op:op-note","projectId":"fixture-project","operationId":"op-note","producer":{"provider":"codex","sessionId":"producer"},"target":{"scope":"session","provider":"claude","sessionId":"target"},"envelopeDigest":"97f5c919948ab92a1cfb4006674323b57a3609c0c3f4c5bf068196cf41c8f4e1"}
```

v1 consumer validation は trusted な project / operation / producer / target provider・session を fixture 値に照合し、memory identity だけは要求しない。L6 レシピと digest をテスト内で同じ production helper から取得してはならない。

旧 v3 / v4 entry は従来どおり復号され、claim と terminal 判定も既存期待を維持する。v1 entry は旧 entry の後に選択され、claim 前は non-terminal とする。上記 valid v1 fixture から独立した一軸 reject 対照を作る: (1) entry と binding の `projectId`、および trusted consumer context を同じ別値 `tampered-project` に変更し、元の `envelopeDigest` / `id` は保持する (他の binding 値も entry と一致させる) — trusted binding は coherent だが再計算 digest / id が不一致なので reject、(2) entry または binding に `memoryId` key を混入 — exact-key 違反で reject、(3) v1 entry の `id` と v1 binding の `entryId` をともに同じ legacy v4 形式 ID `fixture-memory:project:fixture-project:op:op-note:env:c891c7d73afce9a3` に置換する (binding schema discriminator と他の binding 値、および trusted project / operation / producer / target context は valid fixture のまま維持) — entry/binding ID の単純不一致ではなく、schema-specific id 検証で rejectする。`fixture-memory` を含む legacy v4 binding 自体は v4 discriminator / exact keys のまま別経路で維持する。3 対照はそれぞれ integrity / exact-key / schema-specific id 検証で reject し、正しい v1 fixture の受理を代用しない。

terminal marker は L6 §3.1 の schema discriminator ごとの exact keys で記録し、同じ parser で再読込する。review 用 terminal oracle は `operationId=op-review` の review v1 entry を使う。preimage は上記レシピで独立計算し、literal bytes `{"schemaVersion":"ut-tdd.notification/v1","projectId":"fixture-project","operationId":"op-review","producer":{"provider":"codex","sessionId":"producer"},"target":{"scope":"session","provider":"claude","sessionId":"target"}}`、期待 digest は `1517dc861f07fc839ff5e17549a570081f462864de318227d3fd624837b3a623` とする。entry の review identity は `requestDigest="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"`, `requestPath=".ut-tdd/review/requests/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.json"`, `pr=283`, `exactHead="cccccccccccccccccccccccccccccccccccccccc"`, `reviewRevision="revision-1"`, `authorFamily="claude"` とし、`id` は `review:1517dc861f07fc839ff5e17549a570081f462864de318227d3fd624837b3a623:workspace:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:op:op-review` とする。

`reason=pr_merged` の review marker literal は次のとおりで、record 後の再読込が成功し、exact keys が L6 §3.1 の review 集合と完全一致することを検査する。

```json
{"schema":"ut-tdd.notification-terminal/v1","entryId":"review:1517dc861f07fc839ff5e17549a570081f462864de318227d3fd624837b3a623:workspace:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:op:op-review","reason":"pr_merged","terminalAt":"2026-10-16T00:00:03.000Z","purpose":"review","requestDigest":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","requestPath":".ut-tdd/review/requests/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.json","pr":283,"exactHead":"cccccccccccccccccccccccccccccccccccccccc","reviewRevision":"revision-1","authorFamily":"claude"}
```

同じ review entry の `reason=claimed` marker も record / reload し、`reason` と `terminalAt` 以外は上記 literal と一致し、exact keys は同一であることを検査する。特に claim marker も entry 由来の6 review identity fieldを含み、`memoryPath` が無いまま再読込できることを oracle に含める。valid note fixture の claim marker は `{"schema":"ut-tdd.notification-terminal/v1","entryId":"note:97f5c919948ab92a1cfb4006674323b57a3609c0c3f4c5bf068196cf41c8f4e1:workspace:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:op:op-note","reason":"claimed","terminalAt":"2026-10-16T00:00:05.000Z","purpose":"note"}` とし、record / reload 後の exact keys は `{ schema, entryId, reason, terminalAt, purpose }`。unknown / missing key、schema / purpose の不一致、note の `reason=pr_merged` は reject する。v4 marker の旧 discriminator と `memoryPath` 必須の reload oracle も従来どおり成功し、v1 parser に流用しない。

### 3.1 Candidate 023 / 025〜028 の実行口

これらは候補 oracle の入力と期待値を変更せず、core 呼び出しと既存 CLI 接続だけを補う。L6 §7.1 を実行口の正本とする。

- memory core の `nowISO` は有効な UTC ISO-8601 timestamp (`<UTC YYYY-MM>` の移し先を決める)、不正値は filesystem I/O 前に `TypeError`。既存 `done` row は source 不在・destination 存在・digest 一致時だけ受理し、それ以外は `memory_archive_recovery_conflict` で全体停止する。handover の既存 `done` row も同じ source/destination/hash 条件だけを受理し、不整合は `handover_archive_recovery_conflict` で全体停止する。
- 新しい memory / handover intent は `recorded_at=nowISO` とし、その operation の done row も同じ `recorded_at` を使う。intent recovery は既存の `destination_path` / `sha256` / `recorded_at` を再利用し、再試行時の `nowISO` で別 destination や月を再 mint しない。snapshot evidence の `recorded_at` は `recordedAtISO`、省略時は writer 呼出時に一度だけ採取した UTC clock 値。memory `categories` は `[{category:"moved",count},{category:"preserved",count}]` の2区分のみ。intent の無い snapshot row で source が無い場合は `target_bytes_changed`。handover は全候補と既存 recovery state を source/destination/hash preflight してから新規 entry を動かす。

- writer core は `writeStateChannelTargetSnapshot({ repoRoot, recordedAtISO? })`。`recordedAtISO` 省略時は呼出時の UTC clock、指定値の不正は filesystem I/O 前に `TypeError`。JSONL row exact keys は `{ memory_id, content_sha256 }`、evidence exact keys は `{ schema, sha256, count, recorded_at }`。両 SHA-256 は prefix なしの lowercase 64-hex。`canonicalJson`・UTF-8・LF を使い、failure reason は `target_snapshot_exists` / `target_snapshot_write_failed`。CLI は `ut-tdd memory retire --record-target-snapshot [--recorded-at ISO]`。この writer mode は `--selector` / `--archive` / `--dry-run` / `--include-inferred` と排他的で、mode conflict は filesystem I/O 前に exit 1・write 0。Candidate 026 の各 core `{ok:false, reason:"target_snapshot_exists"}` は writer CLI で exit 1 になる。片側の final path 作成後にもう片側の I/O が失敗した場合、既存 bytes は残り、自動修復せず再試行も `target_snapshot_exists` / exit 1 とする。
- memory archive core は `archiveStateChannelMemoryEpisodes({ repoRoot, nowISO, dryRun? })`、`dryRun` default true。これは別の公開 API/CLI ではなく、既存 `ut-tdd memory retire` 内の composition point。`ut-tdd memory retire --selector state-channel-snapshot [--dry-run|--archive]` の明示時だけ snapshot selectorを使い、selector省略時は #963 declared/inferred selectorを維持する。snapshot mode と `--include-inferred` は併用不可。snapshot欠落で `target_snapshot_missing` とし #963 mode へ fallback しない。snapshot整合性・対象bytes差異は `target_snapshot_digest_mismatch` / `target_bytes_changed`、recovery conflictとその他I/O failureは `memory_archive_recovery_conflict` / `memory_archive_io_failed` とする。core結果は `{ok:true,dryRun,total,categories,moved,preserved}` または `{ok:false,reason}`、CLIは core false を exit 1 にする。`categories` は `[{category:"moved",count},{category:"preserved",count}]` の2区分だけで合計=count `total`。各memory idは `moved` / `preserved` の一方に一度だけ現れ、両方の配列は `memory_id` 昇順。moved itemは `{memory_id,source_path,destination_path,sha256}`、preserved itemは `{memory_id,source_path,reason}` (reasonは空でないstring)。dry-runの `moved` は移動予定で実移動済みでない。snapshot whole digest/count、証跡、各row raw-byte digestと全intentのpreflightが通るまでファイル/manifest/DBは変更しない。intentの無いsnapshot rowでsourceが無ければ `target_bytes_changed` で全体停止する。source無しでも検証済intent + destination同digestならdestination bytesを対象bytesとしてglobal preflightに使い、DB row削除から再開する。sourceのみ + digest一致はrenameから再開。source/destination両方、両方無し、または既存側digest不一致は `memory_archive_recovery_conflict` で全体停止し、新しいentryを動かさずDB rowも削除しない。その他のI/O failureは `memory_archive_io_failed`。
- memory archive は `memory.md` §4.2 の manifest path `.ut-tdd/archive/memory-episodes/manifest.jsonl` と append-only write-ahead / rename / DB-row-removal / intent-recovery の部品だけを再利用する。state-channel event schema は本PRで `ut-tdd.state-channel-memory-archive/v1` として新定義し、exact keys `{schema,state,memory_id,source_path,destination_path,sha256,bytes,bound_to,selection_basis,recorded_at}` を持つ。`state` は `intent` / `done`、`bound_to: []`、`selection_basis` は `{kind:"state-channel-target-snapshot/v1",snapshot_sha256,memory_id,content_sha256}`。state-channel row は snapshot selector だけが解釈し、#963 row は既存 #963 parser / selection path に委譲する。#963 selector は state-channel row を処理せず、各 mode は他方の既知 row を選別・recovery input として流用しない。未知または破損した row は schema 違いとして黙って無視せず、`memory_archive_recovery_conflict` で全体停止する。GitHub terminal 根拠は捏造しない。
- handover archive core は `archiveHandoverProse({ repoRoot, nowISO, dryRun? })`、`nowISO` は有効なUTC ISO-8601 timestamp、dry-run default true。`dryRun:true` の戻り値は移動**予定**一覧で、実移動済みを表さない。handover month は `nowISO` の UTC `YYYY-MM`。24時間より厳密に古い direct regular file (`mtime < nowISO - 24h`) だけを移し、等しいものは preserve。許可リスト外のdirect directoryもpreserveし、再帰しない。manifest `.ut-tdd/archive/handover-prose/manifest.jsonl` の各行 exact keys は `{schema,state,sha256,source_path,destination_path,recorded_at}`、schema `ut-tdd.handover-prose-archive/v1`、state `intent` / `done`。intent-onlyでsourceのみ + digest一致ならrenameから、sourceなし + destinationのみ + digest一致ならdone追記から再開。両方存在・両方なし・digest不一致は `handover_archive_recovery_conflict` で全体停止。doneはdestinationあり・digest一致・sourceなしの時だけ処理済みとし、重複doneを追記しない。成功値は `{ok:true,dryRun,moved,preserved}`。moved itemは `{sourcePath,destinationPath,sha256}`、preserved itemは `{path,kind}`、kindは `allowlisted` / `directory` / `recent_file` / `non_regular`。その他のarchive I/O failureは `handover_archive_io_failed`。実行 CLI は `ut-tdd handover archive [--dry-run|--archive]`、省略時dry-run、core falseはexit 1。

## 4. 既存テストへの影響

| 既存 oracle | 影響 |
| --- | --- |
| U-HOVER-003 / 004 / 007 / 011 / 013 / 014 | scaffold と md 照合の撤去で削除または縮約する。置き換えは 019 / 021。Refactor 相当の撤去は実装 PR (§8 の 6) で行い、削除する oracle の ID を PR 本文に列挙する |
| U-MEMWAKE-* | 通知レコードの変更後も回帰として維持する (017) |
| CANDIDATE-U-MEMEPI-009 / 010 / 011 / 012 / 013 / 017 / 018 | 新規 episode の書き込み・配送に関する行は本書が置き換える。実装 PR で `memory.md` §4.2 の該当節と同時に整理し、削除する oracle を PR 本文に列挙する |
| review custody 系 (`review-dispatch` / `review-merge-gate` / `review-attestation` のテスト) | `memoryId` を含むフィクスチャは v1 の読み取りとして残し、v2 の行を足す (009) |
