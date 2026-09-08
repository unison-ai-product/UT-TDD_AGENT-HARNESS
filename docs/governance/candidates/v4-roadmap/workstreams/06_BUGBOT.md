# BugBotの開始条件と範囲

BugBotは本計画の機能仮称。有料外部サービスや別ハーネスを採用した意味ではない。R03/R05が成立した後のR06でのみ能動修正を導入する。R03以前の旧prose parser/専用台帳による先行Botは作らない。

## 共通経路

共通JSON findingをUTへ提出→既存route/PLAN/V-pair→ticket compiler/dispatcher→隔離workspaceのexact HEADで再現→契約に対応するtest→限定修理→Red/Green/影響回帰→独立review→admission→main read-after→再発観測。

別のバグ状態機械、独自receipt、ルールを複製したprompt、BugBot自身の権限承認は禁止。修正前Redの意味と期待値は既存要求・再現事実・独立検査で裏付ける。

## 分類

| 種別 | 処理 |
|---|---|
| 決定的formatter/生成物差 | 承認済み仕様から再生成・通常検証 |
| 再現可能な局所バグ | 上限付き修理・回帰test・独立受入 |
| 一時的network/runner障害 | コードを書換えず原因別retry。無制限にはしない |
| 仕様不明・矛盾 | discrepancy/Reverseへ。正解を自己生成しない |
| 認証/課金/移行/破壊/license/gate変更 | 修正案と検証を支援し、適用は所定の人間承認へ |

## 有効化のHARD predecessor

R03のreader/writer/validator/権限と、R05のowner/lease/fence、actual依存、attempt/終端/回復、独立review/admission、実行・送信・情報隔離が対象scopeで受入済み。schemaファイルの存在やhelper単体testだけで有効化しない。M4全上流compilerや全歴史PLAN変換は待たないが、その対象修正に必要な端から端までを満たす。

R05ではfixture workerで安全な操作/拒否/回復を検証し、本番BugBotを先に作る循環を避ける。R06のBot接続はread-only→dry-run→限定writeの別受入。

## 自動化の終端

同失敗fingerprintを一件へ集約。attemptごとにwall time/token/差分/file/resource上限を設定。no progress・scope拡大・再現不可・予算超過・採点変更要求で停止。得られた証拠を次の正式担当へ渡す。良い修正案が出てもreceipt書込み失敗なら未完了であり、保存工程だけ正規に回復する。

テストskip/削除、許容値緩和、偽receipt、権限追加で成功を作る案を拒否。release/deployは別の判断。初期auto-mergeはoffとし、導入先が事前承認した狭い低risk範囲だけ独立検証後に許容する。

## rollback

未merge案は正規retract/terminal。merge済み誤修理は通常の修理/revertとして新subjectで扱う。履歴を消したり、protected branchを書き換えたり、旧PASSを貼り直したりしない。安全境界が壊れた場合は新規起動を止め、対象scopeを隔離して人間判断へ。
