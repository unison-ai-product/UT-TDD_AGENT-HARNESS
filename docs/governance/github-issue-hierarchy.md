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

## 6. 作業チケット (暫定定義)

PO 判断 (2026-10-22)。通常の Forward 作業は、使い捨ての作業チケット (Issue Form `Work`、
`.github/ISSUE_TEMPLATE/work.yml`) で運ぶ。チケットの役目は、作業 (task) と経過 (episode) を
見える状態にすることだけである。

- **本文は 4 項目**: 上流の設計 revision / 引き渡し物 / 検証の対 / 完了条件。
  上流の設計 revision は設計文書 1 本につき 1 行、`<path>@<commit>` で書く。
  sha256 は暫定の間は任意とする。
- **契約を書かない**: 方式判断・API / schema・受入条件の本文・不変条件はチケットに書かず、
  `docs/design/` または `docs/test-design/` に置いて path と revision で指す。
  使い捨ての記録へ契約文を写すと、正本とずれた複製が残るためである。
- **経過の記録**: 何をしたか、何が起きたかは、Issue コメントと紐づく PR で残す。
- **親子関係と close**: 第 2〜4 節の規則 (親子・close 条件) をそのまま使う。
- **暫定である**: 機械検査 (lint や harness.db への Issue projection) は今は足さない。
  運用して不足を計測してから追加する。改善はこの節の改訂で行う。

### 6.1 並列ボックスと直列ボックス (PO 判断 2026-10-23)

実装 lane (Codex) へ渡す作業は 2 つのボックスに溜め、lane が遊ばず、1 件ずつの受け渡しも要らない
状態にする。これは特定の backlog の話ではなく、一般の運用形である。

- **並列ボックス**: 順序を問わないチケットの集まり。空いた slot は、どれでも 1 件拾う (A でも B でも C でもよい)。
- **直列ボックス**: A→B→C と鎖でつないだチケット。前のチケットが close して初めて、次が拾える。
- **slot**: lane は最大 N slot を同時に動かす。Codex の N は 3 (subagent の上限)。各 slot は自分の worktree で作業する。

v4 候補 (`docs/governance/candidates/ut-tdd-concept-v4.0.md`) のチケット発行 (原子チケットが lease を持ち、
依存が順序を決め、WIP 上限が量を縛る) を、手運用で先に試すものである。ここで集める計測 (lane の遊び時間、
review の待ち時間。Issue コメントの時刻から取る) は、その後の機構化の入力にする。

**GitHub 上の表現** (既存機能だけを使う):

- チケットは `Work` Issue。受け手 lane はラベル `lane:codex` (または `lane:claude`) で示す。
- 直列は GitHub の issue dependency「blocked by」で表す (後のチケットに、前のチケットへの blocked by を張る)。
  並列は、open な blocker が無いものである。
- チケットが**拾える**条件は、open、lane ラベルあり、assignee なし、open な blocker なし、の全てである。

**lease**:

- 取得は assignee の設定と、slot 番号と開始時の base commit を書いたコメント 1 件。
- 解放は assignee を外すことと、コメント 1 件。
- 1 チケット = 1 slot = 1 worktree。

**空いた slot が拾う順**:

1. その lane 自身の open PR にある FLAG・CI 赤・衝突の是正
2. 直列の鎖の先頭
3. 並列のチケット

**並列ボックスへの入れ方**: 変更する path が、他の open な並列チケットと重ならないこと。かつ共有の面に
触れないこと (例: `package.json` / lock、`.github/workflows/`、`docs/test-design/harness/L7-unit-test-design.md` や
`function-spec.md`、`tests/gate-static.test.ts` のような共有 test-design)。当てはまらないものは直列の鎖に入れる。

**control lane の務め**: 拾えるチケットの数が lane の slot 数以上になるよう、チケットを起票して溜める。
下回ったら補充する。review request は従来どおり control lane だけが、exact head ごとに 1 本出す。

**暫定である**: 運用して計測し、この節の改訂で改善する。
