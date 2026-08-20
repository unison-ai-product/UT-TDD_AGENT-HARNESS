---
memory_id: memory:project:p0-2-delivery-parity-measured-oldest-first-delivery-plus-prose-only-supersession-keeps-stale-closed-pr-requests-ahead-of-live-ones
kind: project
title: "P0-2 delivery parity measured: oldest-first delivery plus prose-only supersession keeps stale closed-PR requests ahead of live ones"
tags: ["claude-wake-inbox", "issue-131", "issue-227", "issue-229", "issue-242", "memory-delivery", "p0", "parity"]
updated_at: 2026-08-19T10:50:45.151Z
---

P0 #2 (Memory 配送・受信 parity、issue #242/#227/#229/#131) の実測。原因は「巡回が無い」ことではなく **配送順と retirement の契約欠落**だった。2026-08-19、base = origin/main 427e07be。

## 実測 (this workspace 690a776d… の Claude wake inbox)

- inbox entry 94 件 / claim 148 件。claim は `<git-common-dir>/ut-tdd-runtime/claude-memory-wake/` 直下、entry は同 `inbox/` 配下に置かれる (claim() と claimedIds() は root、readInbox() は inbox/ を見る)。**claim 機構自体は動作している**。
- 自 workspace 宛は 13 件、うち **未 claim 12 件**。配送順 (createdAt 昇順) の先頭 3 件:
  - 2026-08-13T04:36:42Z `pr299-deny-binding-c1af2933-claude-closing-review-v2`
  - 2026-08-14T13:17:28Z `pr319-bootstrap-canonical-dbf59e1b`
  - 2026-08-17T05:19:14Z `pr319-0a6fd103-reissue`
  PR #299 / #319 は既に closed/merged で、open PR は #341 のみ。**次の Stop hook wake は 6 日前の閉じた PR の依頼を、live な `root-pr341-19d26a47…` より先に渡す**。

## 機構上の原因 (コード実測)

1. **oldest-first 配送**: `selectClaudeInboxEntry` (src/runtime/claude-memory-wake.ts) は createdAt 昇順に sort して `.at(0)` を返す。FIFO 公平性としては筋が通るが、後発 entry が先発を supersede する review キューでは**常に一番古い = 一番陳腐化した依頼から配る**ことになる。
2. **supersession が機械可読でない**: Codex は「SUPERSEDES R3依頼の旧base 39846e9」のように prose で supersede を宣言するが、entry には supersede 先を指す field が無い。よって**先発 entry は retire されず未 claim のまま配送対象に残り続ける**。
3. **liveness 検査が無い**: closed/merged PR を指す entry も期限まで配送可能なまま。唯一の消滅経路は `RETENTION_MS` = 7 日の mtime GC (`pruneRuntimeFiles`) で、**解決ではなく経年で消える**。上記 08-13 entry は解決されないまま間もなく GC される。
4. **drain 速度 < 流入速度**: 配送は Stop hook 1 回につき最大 1 件 claim。13 件中 claim 済みは 1 件。

## 実観測 (机上ではない)

本日、私は 427e07be の R3 supersede entry が既に inbox に存在する状態で、**旧 base 39846e9 の R3 依頼を Stop hook から受け取った**。1 と 2 の帰結そのもの。当時すでに 427e07be で判定を出し終えていたため、実害は「stale HEAD 前提の再作業を促された」ことに留まったが、判定前だったなら stale HEAD に対する verdict を出しかねなかった。exact-HEAD プロトコルは verdict 側を縛るが、**依頼側の HEAD 鮮度は誰も縛っていない**。

## 契約として確定すべき境界 (実装前の freeze 対象)

- **配送順**: oldest-first を廃し、(a) 未 supersede かつ (b) live な entry のうち **newest-first** で配る。stale を先に配る現行順序は review キューの意味論に反する。
- **retirement**: entry に機械可読な supersede 先 (`supersedesOperationId` 等) を持たせ、後発 entry の投函時に先発を retire する。prose の SUPERSEDES を正本にしない。
- **可視化と即時 wake の分離**: 「active session への即時 wake」と「未配送 backlog の可視化」を別経路にする。巡回を唯一の解にしない (`summarizeUnclaimedInbox` が既に backlog 集計の口として存在する)。
- **fail-close 境界**: 破損 entry / 破損 claim は他 entry を starve させない現行方針 (claimedIds の catch) を維持する。retirement の誤りで live entry を消すのは fail-close 側の事故なので、retire は削除ではなく状態遷移にする。

## スコープ分離

D3a の verdict custody (src/feedback/review-verdict-custody.ts、PR #339 で merge 済) は **verdict 側の保管**であり、本件は **request 側の配送**。重複しない。U-1 / Forward / R3・R4 とも混ぜない。

実装は gpt-5.6-luna、Opus は非著者 blind closing。Claude は PR 運用担当なので実装しない。

## 追加実測 (2026-08-19、PR #341 merge 直後。同一セッション内 2 例目の実観測)

PR #341 を merge (2f3f15af) した直後の自 workspace 宛未 claim は **11 件、うち 10 件が dead on arrival**:

1. 2026-08-13 `pr299-deny-binding-c1af2933-claude-closing-review-v2` — PR #299 は closed
2. 2026-08-14 `pr319-bootstrap-canonical-dbf59e1b` — PR #319 は closed
3. 2026-08-17 `pr319-0a6fd103-reissue` — 同上
4. 2026-08-19T09:55 `root-nonforward-snapshot-fence-opus-pre-gate` — **live** (issue #77 pre-gate)
5-10. `root-pr341-*` の e549cd98 / e549cd98b46b / e549cd98-source-doc-lane-green / 54095c49 / 7fbe432a / 19d26a47 — **すべて superseded、かつ PR #341 自体が merged**
11. 2026-08-19T10:49 `root-postmerge-pr341-2f3f15af…` — **live** (post-merge audit)

**10/11 = 91% が死んだ依頼**であり、oldest-first のため live な 2 件 (#4 と #11) のうち #11 は**最後**に配られる。#4 に辿り着くまでに閉じた PR の依頼 3 件が先に配られる。

同一セッション内 2 例目の実観測: PR #341 を merge した**後**に、Stop hook が `root-pr341-r4-e15c0c93-closing-review` を配ってきた。HEAD は 4 世代前 (e15c0c93)、かつ PR は既に merged。本文は「Current CI run 32239735511 has Linux FAILURE… Do not merge」で、**既に merge 済みの PR に対して merge 禁止と CI 修理を指示する**内容だった。1 例目 (R3 39846e9 の stale 配送) と合わせ、oldest-first + prose-only supersession の帰結が 2 回とも再現している。

この数字は「巡回頻度を上げる」では改善しない。**配送順と retirement を直さない限り、キューが伸びるほど live な依頼が後ろへ押される**という単調悪化の構造である。逆に言えば retirement を入れるだけで 91% が消える。
