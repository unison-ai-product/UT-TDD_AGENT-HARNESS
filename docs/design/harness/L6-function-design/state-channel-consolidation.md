---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_state_channel_consolidation
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1062
---

> **L6 contract marker**: 本書は「状態を相手へ伝える経路」の正本割当と、それを機械で守る 4 つの契約を凍結する。(1) `memory add` の拒否規則 `classifyMemoryAdd(input) => accept | reject(reason)`、(2) review request の identity v2 `reviewIdentityObjectV2(request)`、(3) 通知レコード `ut-tdd.notification/v1`、(4) handover prose の退役。これらに加え、§11 は issue #1168 の A4 bounded retirement slice を定める。oracle の索引は共有の `docs/test-design/harness/L7-unit-test-design.md` (§状態を伝える経路の一本化) に置き、詳細 (CANDIDATE-U-STCHAN-001〜028) は専用の `docs/test-design/harness/L7-state-channel-consolidation-test-design.md` が固定する。

# 状態を伝える経路の一本化 — 関数設計 (issue #1062)

## 1. 目的と現状実測

「いま起きていること」を相手へ伝える経路が 3 本あり、正本が決まっていない。メモリ (`.ut-tdd/memory/`) は教訓を置く場所だが、PR / レビューの連絡と、review custody のアンカー、Claude の Stop hook の受信箱に使われている。handover は `.ut-tdd/handover/` に日付付きの書き捨てが積まれている。連絡の残骸が教訓の検索と棚卸し (#998) を埋め、prose は stale 化する層になる。本書はメモリを教訓専用に戻し、連絡と custody と受信箱をメモリから切り離す。

### 1.1 実測 (2026-10-15、main `6a50a748`、主 checkout)

| 項目 | 値 | 取り方 |
| --- | --- | --- |
| `.ut-tdd/memory` の全ファイル | 299 | `ls .ut-tdd/memory \| wc -l` (issue 本文の 291 は取得時点の差) |
| git 追跡 | 46 (feedback 31 / user 11 / reference 4 / **project 0**) | `git ls-files .ut-tdd/memory` と frontmatter の `kind` |
| 未追跡 | 253 (project 210 / feedback 41 / reference 2) | 同上 |
| 未追跡 project のうち title かファイル名に PR / issue 番号 | 180 | 正規表現 `pr[- ]?#?\d+\|issue[- ]?#?\d+\|#\d{2,4}` (大文字小文字不問) |
| 未追跡 project のうち番号なし | 30 (うち 25 は「依頼」「手番」「再検」「receipt」「CI」等の連絡語) | 同 + 語彙検査 |
| 未追跡 feedback で title に番号がある | 9 (全件を読んで教訓と確認: 「重複 request は merge を塞ぐ (PR #700)」等) | 目視 |
| ファイル名に `pr-N` | 179 (project 171 / feedback 8 / 追跡済み 0) | `(^\|[-_])pr-?\d+` |
| `.ut-tdd/handover/` 直下のエントリ | 446 (md 295 / sh 65 / mjs 49 / json 21 / ps1 7 / ts 3 / txt 2 + ディレクトリ 3) | `ls \| wc -l` |
| そのうち git 追跡 | `.gitkeep` と `provider/*.json` だけ | `git ls-files .ut-tdd/handover` |

読み取れること。

- 追跡済み (clean-cut で選別された正本) の 46 件に **kind=project は 0 件**である。選別者が project kind を 1 件も durable と認めなかった。一方、未追跡の project kind は 210 件で、全件が連絡か進行の記録である。**kind で切れば、教訓 (feedback / reference / user) を誤って落とさない**。番号の有無で切ると、番号を含む教訓 9 件を落とす。issue 本文の「73 件」は再現できなかったため、件数は固定せず、規則の dry-run を正とする。
- コードが `.ut-tdd/handover/` に書くのは `CURRENT.json` だけである (`src/handover/handover-constants.ts` の `POINTER_PATH`、`src/runtime/provider-handover.ts` の `provider/`)。直下の日付付き md / sh / mjs / ps1 は人か agent が書いた書き捨てで、生成元のコードは無い。`ut-tdd handover` が散文を書くのは `docs/handover/session-handover-<date>.md` で、`.gitignore` 済みの scaffold である (`src/handover/index.ts:730`)。

### 1.2 メモリを経路に使っている箇所

| 箇所 | 実態 | 根拠 |
| --- | --- | --- |
| review custody | request の identity (digest 入力) に `memoryId` を含める。`review live-dispatch` は memory ファイルを読み、本文を reviewer の task file にする | `src/feedback/review-verdict-custody.ts:61` `reviewIdentityObject`、`src/cli/review-live.ts:318-325`、`src/feedback/live-review-projection.ts:186-216` |
| `--review-memory-id` | 委譲 CLI では **任意**。未指定なら `review:<pr>:<head>:<rev>` を代入する。`live-dispatch` だけが実在の memory を要求する。memory id は opaque な文字列としてしか使われていない | `src/cli/delegation.ts:437-446` |
| memoryId の参照面 | `src/feedback/` の 9 ファイル、`review-dispatch.ts` に 19 箇所。receipt、merge gate (`review-merge-gate.ts:26,205`)、post-merge-backstop、provider-judgment-composition、custody runner の env `UT_TDD_CUSTODY_MEMORY_ID` | `grep -c memoryId src/feedback/*.ts` |
| Stop hook の受信箱 | 受信箱の置き場は memory ではなく runtime bus (`<git common dir>/ut-tdd-runtime/projects/<ns>/claude-memory-wake/inbox/*.json`、`claim` ファイルによる CAS)。ただし entry は `MemoryEntry` から作り、`memory_id` / `memoryPath` / 本文を必須で持つ | `src/runtime/claude-memory-wake.ts:291,471-521`、`src/runtime/claude-provider-envelope.ts:212-303` |
| `memory add --notify-claude` | 書いた memory を受信箱へ載せる lane 連絡の経路 | `src/cli.ts:4478-4495` |
| Codex 側の受信 | `publishCodexReviewWake` は注入 port で、CLI は注入していない (`codex_review_wake_unavailable`)。Codex への連絡は実際には GUI lane と GitHub コメントで行われている | `src/cli/review-live.ts:55,343` |

### 1.3 先行契約との関係

`docs/design/harness/L6-function-design/memory.md` §4.2 (issue #963、PLAN-L6-97) は、エピソードを memory に置いたまま、対象が閉じたら archive へ退避する契約である。置き場を分ける案は「v4 で扱う」とされ、review dispatch の錨は「正当な `episode`」と扱われた (§4.2 末尾「review dispatch との関係」)。**本書はその「分ける」側を決める**。

- 本書が置き換える: §4.2 の「書き込み時」3 (review dispatch の錨と lane 連絡を `--lifecycle episode` で書く)、「配送側」、「review dispatch との関係」。新規のエピソードは memory に入らないので、推定・宣言・配送抑止は新規分に要らない。
- 本書が引き継ぐ: §4.2 の `memory retire` の退避部品 (write-ahead の manifest、`memory_entries` 行の同時削除、冪等性、削除しない原則)。既存分の移行 (§6) に使う。選別規則だけが違う (§4.2 は `bound_to` の closed 判定、本書は kind による)。
- #963 の退避部品 (`memory retire` の実装) は 2026-10-15 時点で `src/` に無い (`grep "memory retire" src/cli.ts` が 0 件)。契約 PR は #963 の実装に依存しない。移行 PR (§8 の 7) は退避部品を前提とし、未実装なら先に「退避部品」の PR を 1 本立てる (移行 PR に部品の新規実装を混ぜない)。

## 2. 正本の割当

| 伝えるもの | 正本 | 備考 |
| --- | --- | --- |
| 教訓・PO ルール・落とし穴 | HARNESS メモリ (`feedback` / `reference` / `user`) | `ut-tdd memory add` 経由のみ |
| runtime 間の依頼・結果・進捗 | **GitHub の Issue / PR コメント** (唯一の正本) | GUI lane の既存規律 (CLAUDE.md §runtime 間のやりとりは GUI lane) |
| 「いま見てほしい」という起こす合図 | 通知レコード (§3) | 本文は持たず、GitHub コメントの URL を指す。正本は常にコメント側 |
| review の identity と判定の保管 (custody) | review request そのもの (§4) | メモリに依存しない |
| 引き継ぎの現在地 | `harness.db` の `feedback_events` と HEAD 由来の digest。機械ポインタ `CURRENT.json` | prose は退役 (§5) |

### 2.1 判断 A: 通知レコードの置き場

選択肢は 3 つ。

| 案 | 長所 | 短所 |
| --- | --- | --- |
| A1: `harness.db` の表 | issue の方針どおり。SQL で数えられる | `harness.db` は files から作る projection で、2 runtime が同時に書く正本にしない (CLAUDE.md が直接操作を禁じる 4.5GB の中核 DB)。claim の CAS を DB ロックで作り直す必要があり、Stop hook の読み取りが DB を開く |
| A2: `.ut-tdd/notifications/*.jsonl` | 単純 | worktree 単位の置き場なので、並列 worktree 間で受信箱が割れる (memory add が `canonicalProjectRoot` を使う理由と同じ事故)。未追跡ファイルが `git status` を汚す (handover と同じ失敗) |
| **A3: 既存の runtime bus の inbox を memory 非依存にする** | 置き場・`claim` の CAS・project 束縛・envelope digest・Stop hook が既に動いており、**変えるのは entry の中身だけ**。git common dir 配下なので worktree 間で共有され、作業木を汚さない | issue 本文の「harness.db 側」と異なる |

**採択: A3**。理由は、受信箱は既に memory ではなく runtime bus にあり、メモリに依存しているのは entry の形 (`memoryId` / `memoryPath` / 本文) だけだからである。最小実装は「entry から memory 項目を除く」ことで、置き場の移行を伴わない。DB には現在も `hook_events` の投影で観測できるので、可視化が要れば後続で投影を足す (本書の範囲外、先回りしない)。issue 本文の「harness.db 側」からの逸脱は、レビューで確かめる論点として PR 本文に明記する。

### 2.2 判断 B: review custody のアンカー

選択肢は 3 つ。

| 案 | 長所 | 短所 |
| --- | --- | --- |
| B1: 通知レコードの id を `memoryId` の代わりにする | 置換が機械的 | custody が受信箱の存在に依存する。受信箱は消える (claim で除去) 前提の bus で、custody の正本にならない |
| B2: 現状維持 (memory id) | 変更なし | 完了条件「custody がメモリを要求しない」を満たさない |
| **B3: request 自体を錨にする (identity から `memoryId` を除く)** | identity は既に `pr` + `exactHead` + `authorFamily` で一意に決まる。memory id は opaque で、未指定時の代入値 `review:<pr>:<head>:<rev>` は同じ情報の再表現にすぎない。同一 head への request が 1 つに収束し、PO ルール「1 exact head に request は 1 つ」(重複 request が merge を塞ぐ) が構造で守られる | digest が変わる (移行期間 が要る、§4.3) |

**採択: B3**。理由は、メモリ id が identity に寄与している情報は無く、取り除いても一意性を失わず、むしろ重複 request の源 (memory ごとに別 digest) を断つからである。

## 3. 通知レコード `ut-tdd.notification/v1`

`claude-memory-wake` の inbox entry (`ut-tdd.claude-inbox/v3`、provider 版 v4) から memory 項目を除いたものとする。新しい層や新しい保管方式は作らない。

| field | 型 | 備考 |
| --- | --- | --- |
| `schemaVersion` | `"ut-tdd.notification/v1"` | |
| `purpose` | `"review"` \| `"note"` | `review` = review request の起動合図、`note` = lane への合図 |
| `id` | string | `<purpose>:<digest>:workspace:<id>:op:<operationId>` 形式。memory id を含めない |
| `operationId` | string | 冪等キー |
| `targetWorkspaceId` | lower-case hex 64桁 | `id` の `workspace:<id>` に使う consumer workspace identity |
| `originRuntime` | `"codex"` \| `"system"` | 現行 inbox の配送 metadata を維持 |
| `createdAt` | UTC ISO 8601 timestamp | 現行 inbox の配送順序 metadata を維持 |
| `projectId` / `producer` / `target` / `envelopeDigest` | 現行 provider envelope と同じ | 下記 §3.1 の v1 envelope / binding 検証 |
| `ref` | string (GitHub の Issue / PR / コメントの URL) | `purpose=note` で必須。`ut-tdd.project.json` の `repository_identity` と同じ repo だけ受理 (`memory.md` §4.2 の `bound_to` と同じ検査) |
| `body` | string ≤ 8,000 | 現行の `CLAUDE_WAKE_BODY_MAX_CHARS`。要約だけを置き、判断材料は `ref` 先の GitHub コメントを正とする |
| `requestDigest` / `requestPath` / `pr` / `exactHead` / `reviewRevision` / `authorFamily` | `purpose=review` のみ | 現行と同じ。`requestPath` は `.ut-tdd/review/requests/<digest>.json` だけを受理 |

- `memory_id` / `memoryPath` を持たない。`purpose=review` の reviewer への task 本文は、`review live-dispatch --task-file <path>` で渡された file を `.ut-tdd/review/requests/<digest>.task.md` に複製して使う (request と同じ置き場、同じ digest 名)。task 本文は identity に入れない (同じ digest に別の task 本文が来ても複製は先勝ちで上書きせず、警告を出す) (reviewer が著者の主張に束縛されないため、blind packet の規律を保つ)。
- 発行口は `ut-tdd notify claude --ref <url> --body <text> [--operation-id <id>]` を 1 つだけ足す (`purpose=note`)。`purpose=review` は `review live-dispatch` が発行する (現行どおり)。
- 配送 (Stop hook の選択・claim・terminal 判定・backlog 要約) は変えない。`decodeClaudeInboxEntry` は 移行期間 の間、v3 / v4 の旧 entry も復号する (§4.3)。
- 受信側は `ref` を読んで GitHub のコメントを確認する。通知の本文だけで判断を進めない (現行の描画文言「現行契約・HEAD・CI を再確認して処理してください」を維持し、「共有HARNESSメモリからの通知」を「通知レコードからの通知」に直す)。

### 3.1 memory-free v1 envelope と binding の整合性

`ut-tdd.notification/v1` の `envelopeDigest` は、v4 の `computeClaudeProviderEnvelopeDigest` が使う serialization recipe と同じく、以下の literal object を列挙順のまま `JSON.stringify` し、その UTF-8 bytes に SHA-256 を適用した lowercase 64-hex (prefix なし) とする。これは v4 の実際の `JSON.stringify` recipe を指し、JCS、`canonicalJson`、field の並べ替えは使わない。

```js
{
  schemaVersion: "ut-tdd.notification/v1",
  projectId,
  operationId,
  producer: { provider, sessionId },
  target: { scope, provider, sessionId },
}
```

この preimage は v4 の `{ schemaVersion, projectId, memoryId, operationId, producer, target }` から `memoryId` を除き、`schemaVersion` を `ut-tdd.notification/v1` にしたもの。nested key も上記順序で固定する。notification entry の `id` は `<purpose>:<envelopeDigest>:workspace:<targetWorkspaceId>:op:<operationId>` とし、`id` 内の digest は `envelopeDigest` と同一値にする。別の id digest を計算しない。

provider binding は v4 binding (`schemaVersion: "ut-tdd.claude-provider-binding/v1"`) と混在させず、binding 自身の schema discriminator で分岐する。v1 binding は `schemaVersion: "ut-tdd.notification-binding/v1"`、exact keys `{ schemaVersion, entryId, projectId, operationId, producer, target, envelopeDigest }` とする。v4 binding は既存の schema discriminator と v4 exact key 集合 (`memoryId` を含む) を維持する。いずれの経路も schema と exact keys を検査し、unknown / missing key を受理しない。v1 entry も exact keys を検査し、未定義・欠落 key を受理しない。`purpose=note` の key 集合は `{ schemaVersion, purpose, id, body, originRuntime, operationId, targetWorkspaceId, createdAt, projectId, producer, target, envelopeDigest, ref }`、`purpose=review` はこの集合から `ref` を除いて `{ requestDigest, requestPath, pr, exactHead, reviewRevision, authorFamily }` を加えた集合とする。

v1 では `expectedMemoryId` の照合だけを行わない。trusted consumer context から得る `projectId`, `operationId`, `producer`, `target.provider`, `target.sessionId` の照合、target scope / nested shape の検査、envelope digest と `id` の再計算一致、および v1 用 binding の `entryId` / identity / digest 一致は引き続き必須とする。したがって v1 の受理は memory identity の撤去で他の binding / integrity guard を省略することを意味しない。

terminal marker の再読込も marker の `schema` で分岐する。notification v1 用 schema は `ut-tdd.notification-terminal/v1` とし、`entryId` には v1 entry の完全な `id` (`<purpose>:<envelopeDigest>:workspace:<targetWorkspaceId>:op:<operationId>`) を記録する。v1 の `purpose=note` / `reason=claimed` marker の exact keys は `{ schema, entryId, reason, terminalAt, purpose }`。v1 の `purpose=review` marker は reason によらず、entry 由来の `{ requestDigest, requestPath, pr, exactHead, reviewRevision, authorFamily }` を保持し、exact keys を `{ schema, entryId, reason, terminalAt, purpose, requestDigest, requestPath, pr, exactHead, reviewRevision, authorFamily }` に固定する。`note` に `claimed` 以外の terminal reason は認めない。v1 marker は `memoryPath` を持たず、代用の偽値も置かない。旧 `ut-tdd.claude-inbox-terminal/v1` marker の parser (review で `memoryPath` 必須) は変更せず、新 parser は schema で振り分ける。claim / terminal の判定条件、配送抑止、inbox 保持の意味は変えず、schema ごとの記録・再読込 key shape だけを定義する。

## 4. review custody の差し替え

### 4.1 identity v2

```text
reviewIdentityObjectV2(request) = {
  schemaVersion: "review-request/v2",
  pr, exactHead, authorFamily
}
reviewRevision = "rv1-" + sha256(canonicalJson(reviewIdentityObjectV2))
```

- `memoryId` を identity、request ファイル、receipt、`review-dispatch` の重複キー (`JSON.stringify([memoryId, pr, exactHead, reviewRevision])`)、merge gate、custody runner の env `UT_TDD_CUSTODY_MEMORY_ID` から除く。重複キーは `[pr, exactHead, reviewRevision]` になる。
- 同じ `(pr, exactHead, authorFamily)` は同じ digest・同じ path になる。再 request は既存の `attempt-n` 機構で再試行する (新しい request ファイルは作らない)。
- `review live-dispatch` は memory を引かない (`--memory-id` / `--memory-path` を廃止し、`--task-file` を取る)。

### 4.2 `--review-memory-id`

| 段階 | 挙動 |
| --- | --- |
| window 中 (実装 PR) | 受理するが無視し、stderr に `review_memory_id_deprecated` を出す。request は v2 で作る。識別子の部分指定の検査 (`review_head_required`) は変えない |
| cutover (最後の PR) | 指定したら exit 1 `review_memory_id_retired`。委譲 CLI の宣言入力の判定 (`reviewIdentityRequested`) から外す |

### 4.3 移行期間 (v1 と v2 の併存)

- 読み取り側 (merge gate、`review-dispatch`、post-merge-backstop、provider-judgment-composition) は `review-request/v1` と `v2` の両方を検証する。書き込みは v2 だけ。
- (a) **書き込み**: v2 cutover 以降、v1 の request / receipt を新規に作らない。例外は、cutover 前に始まった v1 の attempt を完了させる書き込みだけ (新しい head は v2 で始める)。
- (b) **読み取り**: 既存の v1 request / receipt は **恒久的に読める**。merge gate と post-merge-backstop は read-only の v1 parser を残す (`review-merge-gate.ts` は request / receipt の JSON を直接読み、`ut-tdd db rebuild` は v1 を v2 へ変換しないため、parser を消すと terminal な v1 receipt を持つ未 merge の PR や後の backstop が読めなくなる)。変換器で移す案は、元 bytes の digest を保つ検証が別途要り、parser を残すより大きいので採らない。
- (c) v1 parser の削除は本書の範囲外とする。将来やるなら別 PR で、「terminal な v1 receipt を持つ未 merge の PR が 0 件」を実測した上でのみ行う (open な request の件数では判定しない)。

## 5. handover prose の退役

- **止める生成**: `ut-tdd handover` が書く `docs/handover/session-handover-<date>.md` の scaffold (`renderHandoverScaffold`、同日累積の `boundSameDayEntries`、`countHandoverEntries` / `doc_entry_count` による bypass 照合)。残すのは `CURRENT.json` (機械ポインタ) だけ。`CURRENT.json` の `latest_doc` と `doc_entry_count` は消す。引き継ぎの現在地は `feedback_events` (SessionStart で surface) と HEAD 由来の digest に任せる。
- **`.ut-tdd/handover/` 直下の書き捨て**はコードが生成していないので、止める対象は人と agent の書き方である。許可リスト = `CURRENT.json`、`.gitkeep`、`provider/`、`archive/`。許可リスト外のエントリ数を doctor の advisory row `handover-prose` に出す (doctor を fail させない)。新規作成を block する hook は足さない (Bash の heredoc でも書けるため回避でき、fail-open の guard を増やすだけになる。作業木の衝突検知である `work-guard` の責務とも違う)。規律は `CLAUDE.md` の既存の「エピソード状態を書かない」(§引き継ぎ・検証の基準点) に 1 行の pointer を足すだけにする。
- **既存ファイルの扱い**: 削除しない。`.ut-tdd/archive/handover-prose/<YYYY-MM>/` へ移し、sha256 の manifest (`.ut-tdd/archive/handover-prose/manifest.jsonl`、`memory.md` §4.2 の write-ahead 形式を流用) を残す。移す対象は許可リスト外のエントリのうち、最終更新が 24 時間より古いもの (進行中の監視スクリプトを動かし続ける)。移動は可逆で (移し先は同じ repo の gitignore 済みの置き場)、削除ではないので PO 承認の対象外とする。**archive の削除は破壊的操作であり、PO 承認が要る**。本書は archive の削除を契約しない (CLAUDE.md の bulk deletion 規則: 20 件/回超は一括で消さない)。
- 追跡済みの `docs/handover/*.md` 8 件と `provider/*.json` は本書の範囲外 (履歴と構造化 JSON)。

### 5.1 `latest_doc` 撤去に伴う撤去対象 (§8 の 6 の範囲)

`CURRENT.json` の `latest_doc` を消すと、その先の md を読む検査と、scaffold だけが使う部品は使い道を失う。段階 6 の実装 PR は、次を**同じ PR で**撤去する (残すと常に skip / 未使用になる死んだ経路になる)。

| 撤去するもの | 理由 |
|---|---|
| `checkHandoverCompletionWording` と `tests/handover-completion-wording.test.ts` | `latest_doc` の md を読む検査で、`latest_doc` が無ければ常に空を返す |
| `checkHandoverOutstandingAnchor`、`latestEntrySection`、doctor row `handover-outstanding` (`handover-prose` row に置き換える)、U-HOVER-016 / 017 | 最新 md の §5 を読む検査と scaffold の §5 seed に依存し、md が無ければ常に skip になる |
| `relativizeTouchedFile` / `relativizeDeliverableFiles` と PLAN-L7-145 の該当テスト | scaffold の §2 を描画する専用部品で、scaffold の停止で使い道が消える |
| `scaffoldFromDigests`、`capWithBreadcrumb`、`readPlanMeta`、定数 `HANDOVER_OUTSTANDING_MARKER` / `MAX_SAME_DAY_ENTRIES` / `MAX_SUMMARY_PLANS`、型 `HandoverDoc` / `PlanMeta` / `CapRender` / `HandoverRenderOpts` | scaffold の入出力と上限制御だけが使う。`HandoverResult.content` も scaffold 本文なので外す (CLI の `--dry-run` は pointer を表示する) |
| 宣言済み oracle U-HOVER-003 / 004 / 013 / 014 (`docs/test-design/harness/L7-unit-test-design.md` §1.8) | 被試験対象が `scaffoldFromDigests` / `renderHandoverScaffold` / `boundSameDayEntries` で、いずれもこの表で撤去する。宣言と citation テストを残すと、関数が消えた時点で orphan になる (U-OTT-004、U-MEMCUT-014、U-OIDGATE-005、U-RCDEV-037。#1136 の CI 失敗の実測) |
| 宣言済み oracle U-HOVER-011 の md 照合部分 (`countHandoverEntries`、`latest_doc` の entry 数と `doc_entry_count` の照合) | §5.2 のとおり md 照合は撤去する。署名照合 (`generated_by` 欠落の警告、pointer 不在は警告なし) は残るので、U-HOVER-011 は署名照合の oracle に書き換えて残す (宣言と citation テストを残す) |
| 宣言済み oracle U-HOVER-012 の gap⑤ 部分 (`runHandover` の `readPlanMeta` family 解決、kind を埋める) | `readPlanMeta` は §1 の PLAN サマリを描く scaffold 専用部品で、この表で撤去する。session scope の検査 (`scopeToSession` / `latestSessionId`) は残るので、U-HOVER-012 はその部分の oracle として残し、gap⑤ のテストは契約 PR で撤去する (残すと関数が消えた時点で未検証の宣言になる。#1163 の Sol r1 P1)。L7 の被覆表 (IMP-078 の行) も同時に縮約する |
| 宣言済み oracle U-HOVER-007 の md 追記・`content` 返却部分 | `runHandover` は md を書かず `HandoverResult.content` も返さない (本 §5)。U-HOVER-007 は「dry-run は書かない」「CURRENT.json 更新」「`complete` の status と `active_plan`」の oracle に縮約して残す。散文を作らない契約は U-STCHAN-019 が持つ。契約 PR で宣言を縮約し、md 追記と `content` を見るテストの書き換えは src の撤去と同時に変わるので Green で行う |
| PLAN-L7-143 の `generates` (`tests/handover-completion-wording.test.ts`)、PLAN-L7-173 の `green_commands` (同テストの実行コマンドと evidence_path)、および本文の同テストへの言及 | A4 の bounded retirement 契約で `plan-artifact-existence` を退役する対象とする。この契約では PLAN 本文・履歴を変更せず、`plan revise`、phantom 集計、例外追加を要求しない。doctor 登録の退役は `L7-memory-clean-cut-replacement-test-design.md` の `U-PAEXRET-001` で検証し、独立した graph / legacy migration 経路は §11 と同書の 002 / 003 で扱う |

- U-HOVER-016 / 017 は test-design の `L7-unit-test-design.md` で宣言されておらず (grep で確認済み)、`src/lint/oracle-test-citation-baseline.ts` の「未宣言 citation の負債」にだけ載っている。この 2 件だけは test-design の変更が不要で、テストの削除と baseline の 2 行の削除は実装 PR (src) で一緒に行う。上の表の宣言済み oracle (U-HOVER-003 / 004 / 011 / 013 / 014) は宣言があるので、宣言の撤去または書き換えと citation テストの撤去を、実装 PR より前の契約 PR (段階 6b) で原子的に行う。`tests/handover-completion-wording.test.ts` と PLAN-L7-145 系の relativize テストも、同じ契約 PR で撤去する。
- `outstanding` (`computeOutstandingWork` の集計) は `CURRENT.json` に残す。機械ポインタの内容であり scaffold 専用ではない。

### 5.2 `checkHandoverBypass` の残す振る舞い

`checkHandoverBypass` は **`generated_by` の署名照合を残し、md 照合 (`latest_doc` / `doc_entry_count` に依存する部分) だけを撤去する**。

- 残す: `CURRENT.json` が `generated_by` 署名 (`ut-tdd-handover`) を持たない場合の「手書き pointer」警告。根拠は `handover-mechanism.md` §gap ① (213 行) で、手書きの `CURRENT.json` が discipline を素通りすることは md の有無と独立した gap である。新契約でも `CURRENT.json` は機械ポインタとして残るので、この gap は消えない。pointer 不在は警告しない (従来どおり discipline が担当)。
- 撤去する: `pointer.latest_doc` の md を読み、entry 数が `doc_entry_count` を超えたら警告する部分。`countHandoverEntries` と同時に消える。移行期に `latest_doc` / `doc_entry_count` を持つ旧 pointer が残っていても、md を読まず警告しない。
- U-STCHAN-021 の入力は、署名付きの pointer (`generated_by` あり、`doc_entry_count` なし) とする。`latest_doc` は旧 pointer の残骸として持たせ、その md に `# Session Handover` 見出しを置く。現行実装は entry 数 1 > 0 で警告を出すので、021 は Red になる。
- 関数と呼び出し側 (cli の handover 警告、doctor の `checkHandoverDisciplineMessages`) は段階 6 で残す。

## 6. `memory add` の拒否規則

```text
classifyMemoryAdd({ kind, durableReason }) =
  kind ∈ { feedback, reference, user }      -> accept
  kind = project and durableReason 非空     -> accept (frontmatter に durable_reason を書く)
  kind = project otherwise                  -> reject("episodic_memory_rejected")
```

- 規則は **kind だけ**で決める。title の番号・語彙は見ない (§1.1: 番号を含む教訓 9 件を落とさないため)。実測で追跡済みの 46 件に project は 0 件で、この規則は既存の正本を 1 件も拒否しない。
- `--durable-reason <text>` は project kind の恒久事実 (期限付きの運用事実や進行の記録ではなく、変わらない制約) に限る逃げ道。空白だけは拒否。理由は frontmatter の `durable_reason` に残り、レビューで見える。
- 拒否文言は GitHub コメントを案内する。「連絡は PR / Issue コメントへ。合図が要るなら `ut-tdd notify claude --ref <URL>`」。
- `memory add --notify-claude` は window 中は受理するが、書く memory が上の規則を通る場合に限る (教訓の即時配送の用途が残るかを実測してから、cutover の PR で廃止する。残らなければ `notify_claude_retired` で exit 1)。拒否時は **ファイルを 1 つも書かない** (検査は書き込みの前)。
- `memory.md` §4.2 の書き込み時規則 2 (番号からの `inferred` 推定)・5 (project の fail-close) は、本規則が包含する (project は必ず reject か理由付き accept)。§4.2 の分類 (`lifecycle` / `bound_to`) は既存分の読み取りのためにだけ残る。

## 7. 既存分の移行

- **選別**: **拒否規則 (§8 の 3) が有効になる前に存在した**、未追跡 ∧ `kind=project`。実測 210 件 (§1.1)。対象集合は 3 の cutover で凍結する: 3 の PR が、その時点の該当 memory の `memory_id` と内容 digest の一覧を `.ut-tdd/archive/memory-episodes/target-snapshot.jsonl` に 1 回だけ記録し、移行 PR はこの一覧に載るものだけを動かす。追跡済みと feedback / reference / user は触らない。
- **改ざん検知**: 凍結一覧は gitignore 済みなので、それだけを信頼しない。
  1. 拒否規則の PR(§8 の 3)は、一覧の sha256(行を `memory_id` で昇順に並べ、LF 区切り・末尾 LF の canonical bytes に対する値)と件数を、**追跡される単一の小さい証跡ファイル `docs/migration/state-channel-target-snapshot.json`** に同じ PR で commit する(`{schema, sha256, count, recorded_at}` だけ)。置き場に `docs/migration/` を選ぶ理由は、既存の移行文書の置き場で追跡済み・レビュー対象であり、`.ut-tdd/` は実行時の状態で追跡しない規則だからである。
  2. 一覧の書き手は、一覧または証跡ファイルが既に存在すれば拒否する(`target_snapshot_exists`)。再生成・上書きの経路は持たない。
  3. 移行 PR は、何かを動かす前に (a) 一覧の sha256 と件数を証跡ファイルと照合し、(b) 一覧の各 entry について対象ファイルの bytes の sha256 を再計算して照合する。一覧の欠落(`target_snapshot_missing`)、行の追加・削除・置換(`target_snapshot_digest_mismatch`)、対象 bytes の変化(`target_bytes_changed`)のいずれかで、1 件も動かさず exit 1 で止まる。
- **保持**: 検証(上の改ざん検知 3)が通った後で、**凍結時点で既に** `durable_reason` を持っていた project memory は、一覧に載っていても移さない(bytes は凍結時と同じなので検証は通る)。拒否規則の後に理由付きで受理された memory は一覧に載らず、移行後も `memory_entries` に残り検索できる。
- **凍結後の編集**: 一覧の対象を凍結後に編集すると(`durable_reason` の追記を含む)bytes が変わるので、検証は all-or-nothing のまま `target_bytes_changed` で全体を止め、何も動かさない。保持規則を検証より先に評価して検証を飛ばす経路は持たない。operator の手順は、(1) 編集を凍結時の bytes に戻して再実行する、または (2) 残したい memory は**拒否規則の PR が凍結する前に** `durable_reason` を付けておく、の 2 つだけである。凍結後に追記して残す経路と再凍結の経路は無い(戻した memory は凍結一覧どおり移される)。この例外を足したくなったら、契約の改訂として別 PR で扱う。
- **除外**: open な review request (terminal receipt が無い) が task 本文として参照している memory は移さない。custody の差し替え (§4) が先に入っていれば参照は存在しない。
- **手段**: `memory.md` §4.2 の `memory retire` の退避部品 (write-ahead の manifest、`memory_entries` 行の同時削除、dry-run 既定) を、選別規則を差し替えて使う。`.ut-tdd/archive/memory-episodes/` へ移し、削除しない。dry-run の件数を PR に記録し、dry-run は memory ファイルも `memory_entries` 行も動かさない。実行(`--archive`)は、移した各 memory について、ファイルの移動と `memory_entries` 行の削除を同じ write-ahead の手順で行い、完了した entry の行は残らない。実行後の保証は、`ut-tdd db status` が `fresh` で index-only 行が 0 であること、移した件数 + 残りの件数 = 移行前の総数、保持した memory(R1 / R2)の行と検索結果が移行前と同じであること、の 3 つである。dry-run の集計だけでは行の削除を保証できないので、実行の保証は隔離 fixture での実行で検証し(STCHAN-028)、実 repo では dry-run の集計だけを照合する(STCHAN-024)。
- 移行はメモリの「整理」であって正本の変更ではないので、教訓の内容には触れない。

### 7.1 実行口 (候補 oracle 023 / 025〜028)

本節は L7 §3 の候補 oracle 023 / 025〜028 が参照する core 入力、結果、fail-closed 理由を固定する。実装は後続 PR で行う。

- memory core の `nowISO` は有効な UTC ISO-8601 timestamp でなければならず、不正値は filesystem I/O 前に `TypeError` とする。移し先月はその `nowISO` から UTC で決める。既存 `done` row は source が無く destination が存在し、その digest が row と一致するときだけ処理済みとして受理する。それ以外は `memory_archive_recovery_conflict` で全体停止する。
- handover の既存 `done` row も source が無く destination が存在し、その digest が row と一致するときだけ処理済みとして受理する。それ以外は `handover_archive_recovery_conflict` で全体停止する。
- 新しい memory / handover intent は `recorded_at=nowISO` とし、その operation の done row も同じ `recorded_at` を使う。intent recovery は記録済み `destination_path` / `sha256` / `recorded_at` を再利用し、再試行時の `nowISO` で別 destination や月を再 mint しない。snapshot evidence の `recorded_at` は writer に渡された `recordedAtISO`、省略時は writer 呼出時に一度だけ採取した UTC clock 値とする。
- intent が無い snapshot row で source が見つからない場合は `target_bytes_changed` として全体停止する。handover は新しい移動を始める前に、すべての候補と既存 manifest recovery state の source/destination/hash を preflight し、どれか一つでも conflict があれば全体停止する。

- 凍結一覧 writer core は `writeStateChannelTargetSnapshot({ repoRoot, recordedAtISO? })` とする。`recordedAtISO` を省略した場合は呼出時の UTC clock を使い、指定値は有効な UTC ISO-8601 timestamp とする。不正値は filesystem I/O 前に `TypeError`。成功値は `{ ok: true, count, sha256, snapshotPath, evidencePath }`。`target-snapshot.jsonl` は exact keys `{ memory_id, content_sha256 }` の JSON object を1行ずつ記録し、`memory_id` 昇順、各行を `canonicalJson`、UTF-8、LF 区切り・末尾 LF とする。両 digest は `sha256:` prefix を持たない lowercase 64-hex。`content_sha256` は memory file raw bytes の SHA-256。空集合の snapshot は 0 bytes、証跡 count は 0。証跡 `docs/migration/state-channel-target-snapshot.json` は exact keys `{ schema, sha256, count, recorded_at }`、schema は `ut-tdd.state-channel-target-snapshot/v1`、sha256 は JSONL bytes の SHA-256。どちらかの final path があれば `{ ok:false, reason:"target_snapshot_exists" }`、作成 I/O failure は `{ ok:false, reason:"target_snapshot_write_failed" }`。writer CLI は `ut-tdd memory retire --record-target-snapshot [--recorded-at ISO]` とし、このモードは `--selector` / `--archive` / `--dry-run` / `--include-inferred` と併用できない。mode conflict は filesystem I/O 前に exit 1・write 0。二つの final path の作成は exclusive とし、上書き・削除・再凍結はしない。filesystem transaction はないため、片側作成後の I/O failure ではその bytes を残し、次回は `target_snapshot_exists` で停止して自動修復しない。writer は memory files と `memory_entries` を変更しない。
- memory episode archive core は `archiveStateChannelMemoryEpisodes({ repoRoot, nowISO, dryRun? })` とし、`nowISO` は有効な UTC ISO-8601 timestamp (`<UTC YYYY-MM>` の移し先を決める)、不正値は filesystem I/O 前に `TypeError`、`dryRun` 省略値は `true`。これは別の公開 selector/API/CLI ではなく、既存 `ut-tdd memory retire` 内から呼ぶ composition point である。`ut-tdd memory retire --selector state-channel-snapshot [--dry-run|--archive]` を明示した場合だけこの core を使い、`--selector` 省略時は #963 の declared/inferred selector と動作を維持する。snapshot selector と `--include-inferred` は併用不可。`--record-target-snapshot` は前項の排他的 writer mode である。mode conflict は filesystem I/O 前に exit 1・write 0。snapshot が無ければ `target_snapshot_missing` で失敗し、#963 selector へ fallback しない。core 成功値は `{ ok:true, dryRun, total, categories, moved, preserved }`、failure は `{ ok:false, reason }`。`categories` は `[{ category:"moved", count }, { category:"preserved", count }]` の2区分だけとし、countの合計は `total`。呼出時に扱う各 memory id は `moved` または `preserved` のちょうど一方に現れ、重複なく両配列とも `memory_id` 昇順とする。`moved` item は `{ memory_id, source_path, destination_path, sha256 }`、`preserved` item は `{ memory_id, source_path, reason }` (`reason` は空でない string)。dry-run の `moved` は移動予定一覧で、実移動済みを表さない。CLI は core `{ok:false}` で exit 1 とする。
- snapshot selector は `target-snapshot.jsonl` 全体の canonical bytes digest/count、証跡 exact keys、全行の raw bytes digest を検証する。各行と `memory_entries` を突合し、tracked feedback、snapshot 外の memory、凍結時点ですでに `durable_reason` を持つ project、open request が参照する project は `preserved` に理由付きで出す。snapshot に無い後続 memory は対象へ追加しない。全 snapshot 行と既存 recovery row の source/destination/hash の preflight が完了するまで、ファイル・manifest・DB を変更しない。行の追加・削除・置換または証跡との不一致は `target_snapshot_digest_mismatch`、対象 bytes の差異は `target_bytes_changed`。
- memory archive は `memory.md` §4.2 の manifest path `.ut-tdd/archive/memory-episodes/manifest.jsonl`、append-only write-ahead、rename、`memory_entries` 削除、intent recovery の部品だけを再利用する。state-channel event はこの PR で schema `ut-tdd.state-channel-memory-archive/v1` として新定義し、exact keys `{ schema, state, memory_id, source_path, destination_path, sha256, bytes, bound_to, selection_basis, recorded_at }` を持つ。`state` は `intent` / `done`、`bound_to` は `[]`、`selection_basis` は `{ kind:"state-channel-target-snapshot/v1", snapshot_sha256, memory_id, content_sha256 }`。GitHub terminal 判定を捏造せず、snapshot digest と row identity を選別根拠として typed discriminator で区別する。
- 同じ append-only manifest の state-channel row は snapshot selector だけが解釈し、#963 row は既存 #963 parser / selection path に委譲する。#963 selector は state-channel row を処理せず、各 mode は他方の既知 row を選別・recovery input として流用しない。未知または破損した row は schema 違いとして黙って無視せず、`memory_archive_recovery_conflict` で全体停止する。
- intent recovery は全体停止を維持する。source のみが存在し hash が一致する場合は rename から再開する。source が無く、検証済 intent に結び付く destination のみが存在して hash が一致する場合は、その destination bytes を global preflight の対象 bytes として照合し、DB row 削除から再開する。intent と digest が一致する既存 destination は snapshot bytes 検証にも使う。source と destination の両方が存在する場合、両方が無い場合、または存在する側の digest が不一致の場合は `memory_archive_recovery_conflict` で処理全体を停止し、DB row を削除せず、新しい entry に着手しない。その他の archive I/O failure は `memory_archive_io_failed`。既に `done` の row は再処理せず、重複 `done` row を追記しない。
- handover prose archive core は `archiveHandoverProse({ repoRoot, nowISO, dryRun? })`。`nowISO` は有効な UTC ISO-8601 timestamp、invalid の場合は filesystem I/O 前に `TypeError`。`dryRun` の省略値は `true`。成功値は `{ ok:true, dryRun, moved, preserved }`。各 moved item は `{ sourcePath, destinationPath, sha256 }`、digest は lowercase 64-hex。preserved item は `{ path, kind }` で、`kind` は `allowlisted` / `directory` / `recent_file` / `non_regular`。許可された `CURRENT.json`、`.gitkeep`、`provider/`、`archive/` は `allowlisted` として preserve する。許可リスト外の direct directory と non-regular entry も再帰・追跡せず preserve する。その他の direct regular file は mtime が `nowISO - 24h` より**古い**ものだけ (厳密に `mtime < nowISO - 24h`) `.ut-tdd/archive/handover-prose/<UTC YYYY-MM>/` へ移す。月は `nowISO` から UTC で決める。manifest は `.ut-tdd/archive/handover-prose/manifest.jsonl`、schema `ut-tdd.handover-prose-archive/v1`、各行 exact keys `{ schema, state, sha256, source_path, destination_path, recorded_at }`、state は `intent` / `done`。`intent` を先行追記して rename 後に `done` を追記する。intent-only recovery は source のみ・destination なしで source digest が一致すれば rename から、source なし・destination のみで destination digest が一致すれば `done` 追記から再開する。source/destination の両方がある・両方が無い・digest 不一致は `handover_archive_recovery_conflict` で全体停止する。既に `done` の同一 source/destination/digest は再処理せず、重複 `done` 行を追記しない。dry-run は moved予定一覧と preserve 一覧を返すが file/directory/manifest を一切書かない。削除・上書きをしない。その他の I/O failure は `{ ok:false, reason:"handover_archive_io_failed" }`。公開 CLI は `ut-tdd handover archive [--dry-run|--archive]`、省略時 dry-run、core `{ok:false}` は exit 1 とする。

## 8. 実装 PR の順序 (1 PR = 1 論点)

| # | PR | 内容 | 前提 |
| --- | --- | --- | --- |
| 1 | 契約 (本 PR) | 本書 + L7 テスト設計 + 索引 | なし |
| 2 | Red | `it.fails` を CANDIDATE-U-STCHAN-* で引用して入れる (設計保護 gate §10.3 の順)。続けて正式 ID への昇格 | 1 の非著者 review PASS |
| 3 | 拒否規則 | `classifyMemoryAdd` + `memory add` 配線 (001〜006)、移行対象の凍結一覧 `target-snapshot.jsonl` の記録と、その sha256・件数の証跡ファイルの commit (§7) | 2 |
| 4 | custody v2 | `reviewIdentityObjectV2`、読み取りの v1 / v2 両対応、`review live-dispatch` の `--task-file` 化、`--review-memory-id` の無視化 (007〜014) | 2。3 とは独立 |
| 5 | 通知レコード | `ut-tdd notify claude`、entry から memory 項目を除く、旧 entry の復号 (015〜018) | 4 (review 通知が v2 の request を指すため) |
| 6 | handover | scaffold 生成の停止、`doc_entry_count` の撤去、doctor `handover-prose` (019〜021) | 2。3〜5 とは独立 |
| 7 | 移行と cutover | memory 210 件の退避、handover 直下の退避、`--review-memory-id` / `--notify-claude` の廃止 (022〜024)。v1 の読み取りは残す (§4.3) | 3〜6、退避部品 (#963 の実装) |

各 PR は Green → Refactor の順で commit し、Refactor の commit は `tests/` の内容差分 0 とする (CLAUDE.md §PR スコープ規律 5)。

## 9. DbC と不変条件

| 関数 | pre | post | invariant |
| --- | --- | --- | --- |
| `classifyMemoryAdd` | `kind` は 4 値のどれか。`durableReason` は string \| undefined | 返り値は accept / reject の 2 値。reject のとき書き込みを 1 つも起こさない | 同じ入力は同じ結果 (純関数)。title・tags・本文を見ない |
| `reviewIdentityObjectV2` | `pr` は整数、`exactHead` は 40 hex、`authorFamily` は codex \| claude | 返り値は 4 key だけ (`memoryId` を含まない) | `requestedAt` / nonce は identity に入れない |
| 通知 entry の検証 | `schemaVersion` が v1 か旧版 | v1 は `memory_id` / `memoryPath` を持たない。`purpose=note` は `ref` が同 repo の GitHub URL | 検証の失敗は fail-close。旧版の復号は window 中だけ |
| `handover` (runHandover) | — | `.ut-tdd/handover/CURRENT.json` だけを書く。`docs/handover/` を作らない | dry-run は何も書かない |
| 退避 (memory / handover) | 選別規則の結果 | 移し先の sha256 = 元、manifest に `done` 1 行、db 行なし | 削除しない。再実行で二重移動しない |

不変条件: (a) 新規の PR / レビュー連絡は memory に書かれない (機械が拒否)、(b) review の merge 可否はメモリの有無に依存しない、(c) 連絡の正本は GitHub コメントの 1 本、(d) 教訓は 1 件も落とさない。

## 10. 退けた案

| 案 | 退けた理由 |
| --- | --- |
| 番号・連絡語から episode を推定して拒否 | 番号を含む教訓 9 件を誤って落とす。語彙は網羅できない。kind による線引きで足りる (§6) |
| memory に `lifecycle: episode` を足して閉じたら退避 (#963 のみ) | 書き込みを止めないので溜まり続け、退避は後追いの掃除になる。本書は書き込み口で止める。#963 の退避部品は移行に再利用する |
| 通知を `harness.db` の表にする | projection を 2 runtime の書き込み正本にしない。claim の CAS を DB で作り直す (§2.1) |
| 通知を `.ut-tdd/notifications/` に置く | worktree ごとに割れる。未追跡ファイルが作業木を汚す (§2.1) |
| custody の錨を通知レコードの id にする | 受信箱は claim で消える bus で、custody の正本にならない (§2.2) |
| `.ut-tdd/handover/` への書き込みを hook で block | Bash で回避でき、fail-open の guard が増えるだけ。advisory + 規律で足りる (§5) |
| handover の既存ファイルを削除 | 破壊的操作で PO 承認が要る。移動で目的 (一覧を空にする) は満たせる (§5) |
| `--review-memory-id` を即時廃止 | 動いている lane のコマンドが壊れる。window を置く (§4.2) |

## 11. A4 bounded slice: PLAN `generates` の成果物実在要求の退役 (issue #1168)

これは A4 の PLAN 専用検査退役方針を適用する未実装の bounded slice である。実装後に次を満たす。

- doctor の registry・出力・選択経路から `plan-artifact-existence` を除く。専用 lint 本体、専用テスト、adapter/re-export、および `U-MEMCUT-015` を含む当該検査への依存も、後続 Green で除去する。
- relation graph の完了を主張する PLAN (`confirmed` / `completed` / `accepted`) の `generates` 先の不在だけを理由とする stale 判定、および `LegacyMigrationDryRun` の `plan-generated-target-missing` 判定も退役する。graph loader/projection と他の edge の stale 判定、generated path の形の検査 (`plan-generated-target-invalid`)、role/design target に対する一般の missing/hollow 拒否は残す。対の契約は `module-drift.md` と `function-spec.md`、oracle 境界は共有 `L7-unit-test-design.md` に置く。
- 判定そのものを退役するため、旧 `LegacyMigrationDryRun` が完了主張として扱う `confirmed` / `completed` / `accepted` のいずれにも `plan-generated-target-missing` を残さない。graph でも既存 `generates` edge の実在要求を退役し、status 別の代替検査は追加しない。
- PLAN ファイルとその履歴は変更しない。phantom 例外、allowlist、stub、skip は追加しない。
- `plan-dod` と `plan-completion-drift` を含む他の gate の挙動は変更しない。それらを成果物存在・非空の保証とみなさない。
- source-free の Red と正式 oracle の昇格を先行し、その後に実装 Green を行う。この節だけでは実装済みとも退役済みとも扱わない。
