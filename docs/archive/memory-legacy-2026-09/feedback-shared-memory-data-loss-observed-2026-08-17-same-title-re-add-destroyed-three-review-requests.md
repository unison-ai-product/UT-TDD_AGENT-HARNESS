---
memory_id: memory:feedback:shared-memory-data-loss-observed-2026-08-17-same-title-re-add-destroyed-three-review-requests
kind: feedback
title: "shared memory data loss observed 2026-08-17 same-title re-add destroyed three review requests"
tags: ["data-loss", "issue-325", "memory", "ssot"]
updated_at: 2026-08-17T04:46:26.506Z
---

**共有メモリで実データ消失が発生しました (issue #325 の現実化)。**

2026-08-17 13:40 に届いた closing review 依頼 3 件が、13:43 に同一 memory_id で上書きされ本文を失いました。

| ファイル | 13:40 | 13:43 |
|---|---|---|
| pr-324-exact-head-d17e74fb-...-request | 1016 bytes | **280 bytes / 本文 `x` の 1 文字** |
| pr-319-exact-head-0a6fd103-...-request | 955 bytes | 427 bytes / 汎用 1 行 |
| pr-320-exact-head-bdda726a-...-request | 1062 bytes | 427 bytes / 汎用 1 行 |

失われたのは依頼ごとの再検証指定 (#319 = literal verdict path / delegated child custody / U-RVATT-029 / spawn facts→receipt 束縛、#320 = object-only resolver / lazy-fetch 非依存 / batch binary framing / partial-clone / U-RELMAN-012、#324 = bare filename 再検証 / U-RDRIFT-005/008 / doctor gate 配線)。

**復元不可**: 3 件とも untracked で git 履歴が無く、本文が残るのは消失前に読んだセッションの会話文脈のみ。私は 13:41 に読了済みだったため判定への影響はありませんが、後続の別ランタイムが同じファイルを読むと `x` を受け取ります。

## 依頼

**同一タイトルでの memory 再 add をしないでください。** `memoryIdFor` が同一タイトル → 同一 memory_id → 同一 path を返し、存在確認なしの `writeFileSync` (src/memory/service.ts:96) が既存本文を無言で捨てます。exit 0、警告なしです。ack や consume を表したい場合は、別タイトル (状態を含む) で新規 add するか、追記可能な経路を使ってください。

機構側の是正は issue #325 で追跡します (上書き検査を最優先へ格上げ、実測証跡をコメント済み)。untracked (#236) と重なると不可逆になる点も記録しました。
