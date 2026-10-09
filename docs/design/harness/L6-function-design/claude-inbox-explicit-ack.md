---
artifact_type: design_doc
layer: L6
status: confirmed
sub_doc: function-spec
plan: docs/plans/PLAN-L6-935-claude-inbox-explicit-ack.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
---

# Claude inbox の明示 ACK 契約案 (#935)

状態: 起草中。pair-freeze 前であり、実 inbox への適用を許可しない。

## 範囲と既存所有境界

`PLAN-L7-472-claude-memory-async-wake` と `PLAN-REVERSE-600-claude-inbox-terminal-gc` の配送専用 terminal 境界への設計増分とする。既存4理由による自動終端は維持する。review request / verdict / merge authority を変更しない。#934 の最優先指示に基づき、古い通知を受信側が明示的に確認済みとして配送抑止する経路だけを追加する。

対象は同一 project の現在の受信 session に束縛された entry。foreign session の claim・削除・retarget、runtime の手動削除、年齢だけによる失効、Stop の配送件数変更は対象外。通知 ACK は review の実施・PASS・request lifecycle の終端を意味しない。

## 既存の受信 API 境界 (変更なし)

本契約は既存の受信 API を変更せず、新しい ACK 関数シグネチャを凍結しない。下記は既存 memory.md の
即時配送契約を参照し、現在の実装で公開されている waitForClaudeMemory とその既存 DbC / oracle を記録する。
ACK の追加動作は既存 .claim CAS と共有するが、既存 API の意味は変更しない。

| 関数 | Signature | pre | post | invariant | oracle |
| --- | --- | --- | --- | --- | --- |
| waitForClaudeMemory | waitForClaudeMemory(input: Parameters<typeof waitForClaudeMemory>[0]) => Promise<ClaudeMemoryWakeResult> (input は src/runtime/claude-memory-wake.ts の既存 inline type) | pollIntervalMs と maxWaitMs は有限の正数。既定値は既存契約どおり | 未claim entry を選び、同一受信 session に一度だけ配送する | generation identity を検証した後だけ marker を更新し、claim 成功時のみ配送済み entry を除去する。ACK 候補が既存 delivery claim を変更しない | U-MEMWAKE-001 / U-MEMWAKE-005 / U-MEMWAKE-007 |

## 操作と対象の確定

1. read-only preview は既存 project runtime root と検証済み wake generation authority を用い、現在の workspace / session 宛ての entry だけを列挙する。各行に entry ID、実ファイル bytes の SHA-256、createdAt、purpose、配送先 identity (project / workspace / session) を返す。本文から PR / HEAD を推測しない。
2. ID 指定または厳密な `createdAt < before` により preview 対象を選択する。不正日時は拒否する。before は対象選択であり、期限超過が自動的な ACK authority になるわけではない。preview は選択対象一覧に加えて、当該受信 session の全 inbox entry 集合を表す snapshot digest を固定する。
3. 承認対象は、preview対象行 (entry ID / purpose / 配送先 identity / createdAt / entry bytes digest / claim state) と inbox snapshot digest を含む canonical preview object とする。ACK候補はpreview時にclaim未取得のentryに限る。canonical serialization は固定 schema・固定 key order、entry IDのUTF-8 bytes辞書順、日時のUTC ISO 8601表記とし、その UTF-8 bytes の SHA-256 を preview digest とする。承認者は表示された対象一覧と preview digest を明示承認する。preview と承認の間に当該 inbox の追加・削除・変更があれば snapshot digest が変わり承認は無効。before は一覧を作る selector にすぎず、期限超過が ACK authority になるわけではない。
4. apply は control が明示承認した同一 preview digest と exact ID / bytes digest 集合だけを受け取る。承認時および apply 直前に現在 inbox snapshot digest を再検証し、preview後の変更があれば全体を stale-preview として拒否し、claim / terminal write は0とする。apply 時にディレクトリを再走査して対象集合を増やさない。追加 entryを暗黙に巻き込まない。
5. 承認後、最初のclaim CAS直前にgeneration authority、全inbox snapshot、各entryのproject / workspace / session / bytes digest、各対象のclaim未取得状態を再検証する。別session、legacy entryのsession束縛が検証不能、欠落、破損、差替え、重複ID、対応しないfilename、既存claimはtyped deny/conflictとし、ACK獲得数に数えない。最初のCAS前の集合digest不一致は集合全体を拒否しclaim / terminal writeは0とする。各entryのCAS直前にも対象identityを再検証する。複数entry処理中の外部変更は残りの獲得を止め、既に獲得したACKを保全してpartial/conflictとして報告する。実行自身が作成した一致ACK claimを外部driftと誤判定しない。

### 正規データ形 (契約候補)

以下は既存identity名を再利用したwire形式案であり、実装済みschemaではない。preview / snapshot / approval / claim / terminalのcanonical field setはpair-freezeで固定する。各`schema`文字列はschema候補値。

| データ | 候補フィールド |
| --- | --- |
| snapshot全体 | `schema: "ut-tdd.claude-inbox-ack-snapshot/v1"`, `projectId`, `workspaceId`, `target`, `entries`; `target`は`ClaudeProviderTarget`形式 (`scope: "session"`, `provider: "claude"`, `sessionId`)。`entries`は当該受信sessionに束縛されたinbox全件のsnapshot row |
| snapshot row | `entryId`, `purpose`, `target`, `projectId`, `workspaceId`, `createdAt`, `entryBytesSha256`, `claimState`; `target`は同じsession-target形式。`claimState`は `{kind: "absent"}` または `{kind: "present", claimBytesSha256}` とし、既存claimの有無・生bytes digestを固定 |
| preview全体 | `schema: "ut-tdd.claude-inbox-ack-preview/v1"`, `projectId`, `workspaceId`, `target` (`ClaudeProviderTarget`形式), `inboxSnapshotDigest`, `entries` (ACK候補row); `inboxSnapshotDigest`はsnapshot全体のcanonical UTF-8 JSONのSHA-256 |
| approval record | `schema: "ut-tdd.claude-inbox-ack-approval/v1"`, `projectId`, `workspaceId`, `target`, `inboxSnapshotDigest`, `entries` (previewの完全な候補row集合), `previewDigest`, `actor`, `approvedAt`; `actor`は監査provenanceであり、認証済みprincipalではない |
| ACK claim payload | `schema: "ut-tdd.claude-inbox-ack-claim/v1"`、既存名の`id`と`sessionId`、さらに`disposition: "acked_stale"`, `projectId`, `workspaceId`, `entryBytesSha256`, `previewDigest`, `actor`, `approvedAt`, `owner` (`ClaudeWakeAuthority`の`workspaceId`, `sessionId`, `generation`, `authorityEpoch`); 既存`<inboxFileStem(entryId)>.claim`へ完全payloadを公開 |
| ACK terminal v2 | 既存terminal identity (`entryId`, `terminalAt`, `purpose`) に `schema: "ut-tdd.claude-inbox-terminal/v2"`, `reason: "acknowledged"`, `disposition: "acked_stale"`, `projectId`, `workspaceId`, `target`, `entryBytesSha256`, `previewDigest`, `actor`, `approvedAt`を加える。review entryは既存canonical review identityも保持 |

canonical JSONは各objectの表に記したfield順を固定し、unknown key・duplicate key・duplicate `entryId`を拒否する。row配列は`entryId`のUTF-8 bytes辞書順で並べる。inboxが空のsnapshot全体は空`entries`で表現できるが、preview / approvalの対象`entries`が空なら拒否する。snapshotの`claimState`もdigest対象なので、entry bytesだけでなく既存claimの追加・除去・内容変更で`inboxSnapshotDigest`が変わる。候補rowの`entryBytesSha256`と`claimBytesSha256`は各fileのraw bytesに対するSHA-256。preview候補の`claimState`は`{kind: "absent"}`のみ許可する。

`inboxSnapshotDigest`は選択rowだけでなく、対象sessionの全inbox snapshotを覆う。approval作成時とStop hook内の検証時に再計算する。anchor CAS前のdigest不一致はclaim / terminal write 0。

control回答 (issuecomment-6074148271) により、approvalはpreview digestごとに1つのimmutable descriptorとして残し、preview digestを消費authorityの識別子に使う。descriptor filenameは既存tracked外runtime directory直下の`ack-approval-sha256-<64 lowercase hex>.json`とする。`previewDigest`は`sha256:<64 lowercase hex>`形式だけを受け入れ、filenameにはprefixを除いたhexを使う。descriptorはno-clobberで新規作成し、同pathが既にあれば上書き・削除・置換しない。既存descriptorのraw bytesが新規descriptorと一致する場合だけidempotent already-approved扱いとし、不一致はconflict。anchor claimが消費正本でありdescriptorは監査用に残す。別preview digestは別filename / descriptor。index、追加ledger、lockは作らない。filenameはdigestから決定論的に構成し、受信sessionはdescriptor内の`target`で束縛し、apply対象はStop hook自身と同じproject / workspace / sessionに限る。

Stopは自分宛てdescriptorをfilenameのUTF-8 bytes順で走査し、最初のprocessable descriptorだけを選ぶ。matching ACK claimにterminalが未作成であるなど、terminalを同じclaimから安全に完了できるdescriptorは、snapshot再一致を要求せず、その既獲得claimのterminal回復だけを行う候補とする。terminal pathにmalformed/torn bytesが既に存在し、安全に回復・置換できないdescriptorはtyped terminal-conflictとして報告し、変更せずprocessableでないものとしてskipして次へ進む。これは拒否descriptorの走査と同様にentry処理件数・256件枠を消費せず、filename順で先行しても後続の新しい有効承認を阻害しない。新規ACK候補は、anchor claim未取得であり、preview/snapshot digestとentry/session/claim状態を現在の対象に対して再検証できたdescriptorに限る。matching未完了claimのないstaleまたはrejected descriptorも変更せず選択候補から除外して次へ進む。選択後は同じStopで別descriptorへ続行しない。全既獲得claimのterminalが完了した消費済みdescriptorはskipし、未獲得tailの実行候補には戻さない。回復も含め、選んだprocessable descriptorのentry処理を最大256件とする。foreign descriptorは処理・変更しない。破損descriptorから宛先や成功を推測しない。descriptorと未terminal ACK claimは既存7日cleanupの一律削除対象から除外する。監査保持の別GC規則は本契約に追加しない。

承認の監査情報は actor identity、approvedAt (UTC ISO 8601)、承認された preview digest の組とする。各新規 ACK terminal にこの組を記録し、対象 entry 群がどの一覧として誰にいつ承認されたかを追跡可能にする。actor は control の承認主体を表す監査 provenance であり、任意の文字列入力や受信 session ID 自体を新しい認可根拠にしない。適用操作の実行主体は control に限る。

既存 generation validation を再利用し、任意の文字列 session ID を受理根拠にしない。新しい署名鍵・認可主体・通知正本を作らない。

## terminal と監査証跡

既存 `<inboxFileStem(entryId)>.terminal.json` の置き場を再利用する。既存 v1 marker の bytes / reason は改変しない。新規 ACK だけ schema `ut-tdd.claude-inbox-terminal/v2`、reason `acknowledged` とし、ACK disposition (例: `acked_stale`) / entryId / terminalAt / purpose / entry bytes digest / project・workspace・session identity / 承認監査情報 (actor identity・approvedAt・preview digest) と、review entry では既存 canonical review identity を保持する。理由を既存の配送claim `claimed` と偽装しない。

reader は v1 の既存4理由と v2 の ACK を明示的に検証して配送・summary から除外する。旧 runtime は v2 を未認識で配送を続け得るため、更新済み受信 runtime でのみ適用する。旧 runtime でも抑止できるとは主張しない。

既存 `.claim` のexclusive-create CASをdelivery / ACK共有の単一獲得点とする。delivery claimは既存経路を表し、ACK claimにはdisposition (例: `acked_stale`)、entry/session identity、entry digest、承認監査情報をCAS前に確定したpayloadとして保持する。deliveryが先にCASを取った場合、ACKは競合として拒否し、既存claimを変更せずACK成功数にも数えない。ACKが先にCASを取った場合、wakeはそのclaimを見て配送しない。事前exists検査を排他の代用にしない。

ACK claim獲得後・terminal作成前にcrashしても、claimに確定保存されたdispositionとidentityを保持し、同一対象のretryはそのclaimから同じterminalを冪等に完了する。これは既存claimの新規ACK成功countではなくrecovery/already-acked結果とする。ACK claimはdeliveryへ戻さず、terminal書込み失敗でもclaimを解放・改変しない。claim payloadはCAS獲得時点で完全に復元可能でなければならない。

既存7日retentionによるclaim cleanupもACK dispositionを尊重する。対応する有効terminalが未作成のACK claimを年齢だけで削除・再取得しない。terminal完了後も保持されたinboxが再配送へ戻らないことを既存terminal retention規則と合わせて検証する。空または部分payloadのclaimを成功ACK・配送可能へ推測変換しない。

ACK terminal v2はclaimと同じ完全payload公開patternを使う。canonical terminal bytesを同じdirectoryの一時fileへexclusive createし、全bytesを書き、fsync・closeを完了してからterminal pathへhard-linkでno-clobber公開する。terminal pathの既存bytesは上書きせず、renameやtruncateへのfallbackも行わない。link非対応・異volume・既存targetはfail-closeする。link前のprocess crashではterminal pathは未作成であり、保持されたACK claimから同じterminal bytesをretryで公開できる。既存markerがあれば上書きしない。同一identity・同一ACK dispositionのterminalはalready_terminalとして報告し、異なるidentity / malformed markerはconflictとする。terminal pathにmalformed/torn markerがある場合はそのbytesを保持してtyped terminal-conflictとし、前述のdescriptor選択規則に従ってそのdescriptorをskipする。ACKで変更するのは対象 `.claim` と新規terminalのみ。inbox JSON、audit、canonical request、receipt、Memory本文を変更しない。terminal markerは監査証跡を持ち、重複台帳を新設しない。

集合 apply の全体原子性は主張しない。最初のCAS前のstale previewは集合全体をwrite 0で拒否する。それ以外は各entryを独立処理し、成功 / recovered / conflict / deniedを個別に返す。途中停止時にも既存markerと未処理entryを保持する。再実行は完了済みのACKを再獲得せず、同一の承認済みACK claimのterminal回復だけを行う。未獲得分は新しいpreview/承認を必要とする。書込み失敗を成功表示しない。

## 残る実装境界

controlは既存claim CASをdelivery / ACKの単一獲得点として採用した。完全payloadを同一directoryの一時fileへexclusive createし、write・fsync・close後に既存claim pathへhard-linkでno-clobber公開する既存patternを再利用する。公開前のcrashはclaim未獲得、公開後のcrashは完全payloadから回復する。link非対応・異volume・既存targetはfail-closeし、上書きrenameへfallbackしない。保証対象はprocess crashであり、directory fsyncを含む電源断耐久性まで証明したとは扱わない。

control回答 (2026-10-09、issuecomment-6074018900, issuecomment-6074148271) により、claim操作は受信側Stop hook内に限定する。通常CLIはread-only previewと承認記録の作成までを担当する。承認記録は既存project runtime root `.git/ut-tdd-runtime/projects/<project>/claude-memory-wake/` 配下のtrackedではないimmutable descriptorとし、`ack-approval-sha256-<64 lowercase hex>.json`という決定論的filenameでpreview digestに1対1対応させる。対象session、承認対象一覧とpreview digest、承認者、承認時刻を保持する。hookは自身のgeneration / lease確立後、自分宛ての一覧だけを再検証して処理する。別sessionへの引継ぎは別Issueで扱う。

このruntime file、preview digest、hook stdinのsession IDは、同一OS userによる偽造を防ぐ認証証明ではない。digestは一覧の整合性を検査するだけで、承認者本人を認証しない。controlは同一user内のローカル運用境界を受容しており、actorは申告された監査provenanceとして記録する。強いcaller認証・別user対策・署名承認を実装済みとは主張しない。CLIへreceiver lease tokenを配布する新経路は作らない。

control回答 (issuecomment-6074113219, issuecomment-6074148271) に基づく承認の論理single-use点は、承認済み preview の `entryId` UTF-8 bytes辞書順で先頭となる実 entry (anchor) の既存 `.claim` CAS とする。anchorを含め、preview / Stop 1回あたり最大256件。Stop hookは承認record、hook自身のsession、generation authority、snapshot digest、全対象のidentity / bytes / 未claim状態を検証後、必ずanchorを最初にCASする。同じ承認を読んだ並行Stop・duplicate Stop・旧waiterも同じanchor pathを争うため、anchor CASの勝者だけがそのStop実行で後続entryを順にclaimできる。別delivery claim、別digestのACK claim、malformed claim、またはanchor CAS敗者は後続entryをclaimせず、同digestで既に獲得済みのACK claimからterminalを冪等回復する場合に限り再処理できる。anchorを飛ばして部分集合を新規claimすることはない。

anchor CAS前のcrashは承認未消費・claim未獲得であり、再開時も通常のsnapshot / authority再検証が必要。完全payloadのanchor claim公開後は承認を消費済みとみなす。公開後・terminal前のcrashではclaimの`previewDigest` / disposition / identityからterminalを回復できるが、後続未獲得entryは同じ承認ではclaimしない。部分処理またはStop上限到達の残りは新しいpreview / 承認を必要とする。duplicate / replayは新規ACK成功countを増やさない。既存 claim CAS は各entryのdelivery / ACK単一獲得点であり、anchorが配送claimに取られたら当該承認は他entryへ進まない。

generation authority は既存 `ClaudeWakeAuthority` (`workspaceId`, `sessionId`, `generation`, `authorityEpoch`) を再利用し、anchor claimにowner identityを保持する。各claim公開の直前にauthorityを再検証し、失効を観測したwaiterはそのCASを行わない。ただしgeneration authority更新と別 `.claim` path の公開は既存実装上別のfilesystem operationであり、両者を跨ぐ物理atomicityはこの案では新設しない。single-useはgeneration更新に依存せず共通anchor CASで保証する。generation fencingの強い主張は既存validationの観測範囲を超えて行わず、実装で強い保証が必要ならcontrolへ戻す。

control回答 (issuecomment-6074061826, issuecomment-6074148271) により、preview / Stop 1回あたり最大256件とし、空の対象一覧は拒否する。anchorを件数に含める。拒否descriptorの走査はentry処理上限に含めない。上限超過分まで暗黙拡大せず、未獲得分は新しいpreview / 承認とする。実測でhook時間が長ければ契約改訂で上限を縮める。上限を理由に同じ承認で残りを暗黙再開しない。通常通知の配送件数は変更しない。

## 実装への引き渡し条件

CLIは既存`memory` group (`src/cli.ts`の`program.command("memory")`) 配下に`ut-tdd memory inbox-ack preview`と`ut-tdd memory inbox-ack approve`を置く。`claude` provider委譲commandへsubcommandを混ぜない。previewはIDまたはbefore selectorと対象contextを受け、approveは保存されたexact previewと明示したpreview digest・actor・approvedAtを受ける。通常CLIにclaim実行の`apply` commandは追加せず、claim処理は受信Stop hook内に限定する。契約案をその場でproductionに埋め込まない。serviceと最小CLI配線のPR分割はcontrolが指定する。新規PLANは正規draft/revise、本文4項目とし、既存所有ファイルをgeneratesに再宣言しない。実装のReverse対とcandidate→oracle対応を先に固定する。

本案は TTL / PR 自動観測の追加、batch delivery、foreign backlog の掃除を含まない。これらが必要なら同じ Issue の未解決 AC として control へ返し、完了扱いしない。
