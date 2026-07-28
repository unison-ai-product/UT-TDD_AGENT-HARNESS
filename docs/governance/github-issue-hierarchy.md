# GitHub Issue 階層運用規則

## 1. 目的

GitHub Issue を単独の作業メモとして増殖させず、成果目標から実装・検証単位までを
GitHub の正式な親子関係で追跡する。`Related #N` や本文中の `Parent: #N` だけを
親子関係の代替にしてはならない。

## 2. 階層

| 階層 | 所有するもの | close 条件 |
|---|---|---|
| 親 Issue | Redesign / Recovery / Incident / NFR の成果目標と全体 AC | 必須の子 Issue が全て close し、親固有 AC の証跡がある |
| 子 Issue | 独立して実装・検証できる bounded slice | 対応 PR が main に着地し、子固有 AC の証跡がある |
| 孫 Issue | OS・fixture・移行・障害など、子を閉じるための限定課題 | 親子の完了主張に必要な限定 oracle が Green |

階層は原則 3 段までとする。4 段目が必要なら親の責務が広すぎるため、成果目標を分割する。

## 3. 起票規則

1. 起票前に同一成果目標の open Issue を検索する。
2. 既存の成果目標がある場合、新規 Issue はその sub-issue として作る。
3. top-level Issue は、新しい成果目標・独立した設計判断・既存親へ属さない障害だけに限定する。
4. Issue Form の `Hierarchy role`、`Parent Issue`、`Closure condition` を記入する。
5. `Parent Issue` を本文に書いただけでは未接続である。起票後に GitHub の parent を設定する。
6. 1 Issue の canonical parent は 1 件だけとする。他系統との関係は `Related` として記録する。
7. 別系統の移行を便宜上ブロッカーにしない。依存がなければ横断リンクに留める。

## 4. PR と close

- PR は最も具体的な open Issue を `Refs` / `Closes` で参照し、必要なら親 Issue も併記する。
- 設計 PR は実装 Issue を close しない。設計 freeze と実装完了を別の子 Issue で表す。
- 親 Issue は子 Issue の単なる close 数では閉じない。親の数値目標・統合検証・受入証跡を確認する。
- 置換済み Issue は canonical successor を明記して `duplicate` または `not planned` で閉じる。
- 対応 PR が古い main、失敗 CI、置換済み stack のままなら「対応済み」と数えない。

## 5. 定期監査

週次または大規模整理時に、open Issue について次を確認する。

- parent 未設定の bounded slice
- closed parent 配下の open child
- close 済み PR しか持たない open Issue
- 同一 AC を所有する重複 Issue
- 30 日以上更新がなく、owner PLAN・次の一手・close 条件がない Issue
- 本文の `Parent: #N` と GitHub の正式な parent の不一致

監査は新規 Issue を自動生成しない。既存 Issue の親子設定、canonical successor、close 理由を
先に整理する。
