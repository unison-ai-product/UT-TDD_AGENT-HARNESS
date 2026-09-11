# 作業順序予測・資源制約付き配布

対応：RM-ADD-12。既存FR-004/005/012/030〜036/041〜043/050の具体化。正本は共通JSON、統制はU23/Control Plane。新しい司令塔Botや有料schedulerを増設しない。

## 1. 版ごとの到達範囲

| 版 | 利用できるもの | まだ利用できないもの |
|---|---|---|
| 0.3.0 / R03 | dependency/resource/estimate/schedule proposalの型、共通reader/validator、実績記録 | 自動配布・確定ETA |
| 0.4.0 / R04 | read-onlyの依存順・並列範囲・critical path候補・受入見込み幅・blocked理由 | proposalを実行権限として消費 |
| 0.5.0 / R05 | actual readiness再検証、排他と資源に従う配布、イベント再計画、aging/回復 | 未評価モデルの予測による権限/安全緩和 |
| 0.7.0 / R07 | 上流改訂で変わったticket集合と依存の差分再計画 | 無関係な実行中作業の一括停止 |
| 0.8.0 / R08 | provider/role能力と利用枠の更新による適合候補変更 | 最新モデルへ自動課金契約 |
| 0.9.0 / R09 | 実績校正、見積り幅/費用/再修正の改善、改善効果の比較 | あらゆる仕事の完了時刻・最適解保証 |

**仕事を作るcompiler、順番を考えるplanner、実際に開始を許すdispatcherは別責務。** 三つの別台帳/engineではなく、同一契約を消費する共通UT内の境界にする。

## 2. 何を最適化するか

目的は「最も多くのAIを同時に動かす」ことではなく、**次の合流点/リリースに必要な仕事を、手戻りと総費用を抑えて受入まで閉じる**こと。実装だけの最短順、短いチケット順、解放件数だけの順位は採らない。

hard制約は最適化より優先：有効な承認・scope・依存成立・能力・独立性・資源容量・lease・incident fence。期限やsoft budgetを理由にこれを緩めない。目標の重み（納期/費用/待機/手戻り/公平性）はproject policyで人間が採択し、plannerが自分の成績のために変更しない。

人間が決めるのはrelease優先度、期限、予算/例外、capacity配分、保護境界。通常のready集合内の順序変更と許可済みAI lane割当は自動化する。人間ownerの任命は既存human policyに従う。

## 3. 入力契約

| 入力 | 必須内容 | 注意 |
|---|---|---|
| task/段階 | ticket id/revision、親、scope、PLAN/route、実装・CI・review・admissionの未完義務 | 「実装完了」をtask終端にしない |
| dependency | predecessorと必要な成立条件、根拠record/revision | `contract_frozen`、`artifact_verified`、`merge_admitted`を区別。単なる予想時刻を条件にしない |
| 資源 | actor/capability、CPU/メモリ、OS runner、reviewer、人間判断の実際の稼働枠、provider limit | 未取得のquota/空きはunknown。サブスク上限と現金費用を分ける |
| 時間・費用 | stage別duration range、setup/context reload、再修正の根拠、sample数、as-of | 観測・人間見積り・仮説を区別。未経験を0分としない |
| リスク | provisional依存、同一path/共有contractの競合、変更波及、rebase/再検証負担 | path非重複でも意味契約が共有なら衝突候補 |
| 管理 | release重要度、deadline/soft budget、WIP上限、aging/例外、policy revision | 値を未指定のままAIに補完させない |
| snapshot | project、repo、HEAD、event high-water mark、graph/policy/estimator version | 同じ入力/版から同じproposal/digestを作る |

schemaは`data/scheduling_contract.example.json`で概念形を示す。正式実装の型を発行したものではなく、R03の設計入力。共通work item/decision/evidenceに参照で結び、情報を複製しない。

## 4. 初期アルゴリズムの具体案

R04/R05は高価なLLMの逐次判断を不要にするため、決定的なlist schedulingを基本とする。precedenceとresource exclusivityを別に扱う問題整理は一般的なjob-shop schedulingとも対応するが、solver製品の導入は前提にしない。[WEB-SCHED]

1. **入力検証**：未解決参照・循環・不整合版を検出。循環がある影響集合だけblockedとしてownerへ。関係ないready taskは継続可能。
2. **段階graph**：実装→検証→review→修正→admissionを義務/実績から作る。修正発生は新revision/attemptとして再計画し、実行の無限ループをgraphへ埋めない。
3. **実行可能集合**：actual証拠で前提が成立するtaskだけdispatch候補。将来の後続はforecastにのみ置く。
4. **資源予約の仮計算**：実行laneだけでなくCI/reviewer/merge直列区間を含める。仮の枠は実際のlease/grantではない。
5. **優先づけ**：承認された緊急復旧/期限→agingによる飢餓救済→release-criticalの残工程/解放価値→手戻り/再検証・setup/context切替費用→安定IDの順に比較する案。優先階層はpolicyとして固定し、根拠を出す。
6. **短いhorizonで比較**：すべての将来を完全最適化せず、次の合流点とready/近接候補を評価。選ばなかった候補の理由も保存。
7. **計画出力**：次の作業、担当候補、並列集合、待機理由、制約資源、見積り幅/不明、release到達の条件、旧計画差分を出す。
8. **実配布の再判定**：R05から作用直前に最新stateを再読し、scope/依存/権限/lease/資源をCASで一意に受理する。forecastが完了扱いになってもactualが未完なら開始しない。

未指定durationの場合もDAGの合法順とready集合は計算できる。必要な容量見積りが欠けたresource-heavy jobは承認済み保守的profileへ、profileも不明ならそのjobだけ保留する。未知を楽観的に通さない一方、全計画を無意味に停止しない。

## 5. 再計画と実行中作業

契機は、task/CI/review/mergeの完了・FLAG・失敗、前提契約変更、資源の稼働/停止、利用枠更新、lease失効、incident、明示のpriority変更。単なる画面閲覧や同じ状態pollで全面再計画しない。重複eventはidentityでまとめる。

未着手分を主に組み直す。実行中のpreemptionは、許可されたcheckpoint、安全な中断、引継ぎreceipt、切替コストを満たす場合だけ。planが少し改善するたびにcontextを捨て、担当を替えることを禁止する。policyに最小変更幅/再計画間隔/aging上限を置くが、緊急の安全停止をcooldownで妨げない。

snapshotのHEAD/graph/policy/high-waterが変わったら旧proposalはstale。無効化するのは候補計画であり、実際の未完仕事/証拠を消すことではない。accepted workへの再割当は新commandとして明示する。

容量が継続的に不足する場合は待機上限を保証できない。agingで救済できない案件は達成不能/要capacity判断として表示し、人間へ優先度・納期・範囲の判断を返す。見込みだけでdeadlineを守れたとしない。

## 6. context affinityと独立性

同じ責務の後続を同じworkerへ寄せて、再読/setup費用を減らす候補は許す。ただし負荷・aging・release優先度より無条件優先しない。reviewerの選定ではauthorのcontextを共有しない。省tokenのためにauthor→reviewerへ自己評価や私的履歴を流す案は拒否。

## 7. 見積りと予測の評価

実装、CI、review待ち、差戻し、admissionを分けて観測する。実測が十分な範囲だけ予測intervalを出し、根拠・as-of・sample数・適用task/model/OSを表示する。信頼区間やp95という名称を、ただのmin/maxや一回の見積りへ付けない。

R09では計画発行時点の入力を保存したout-of-time評価を行う。未来の実績を昔の計画へ混ぜない。中断/未完/失敗した仕事も集計し、成功例だけで予測精度を水増ししない。学習データと評価holdout、予測とactualを分離する。

主要評価は、受入までの総時間、resource待ち、review/merge queue、再検証/手戻り、飢餓、計画churn、総費用、interval coverage/誤差。最適化処理自体の計算/API/LLM費用も含める。R04でbaseline、R05で合法dispatch、R09で校正改善という異なる合格条件にする。

## 8. 正常・拒否・回復の受入

| ID | 刺激 | oracle |
|---|---|---|
| SCHED-01 | 同snapshot/同policy/同estimatorで二度計画 | 同じ集合・順序・理由・digest。時刻取得は入力で固定 |
| SCHED-02 | predecessorは予測上完了、actual未完 | forecast表示は可、dispatch不可 |
| SCHED-03 | 別cloneから同task/同pathへ同時grant | exactly-one、敗者は最新stateで再計画 |
| SCHED-04 | CI 1枠/reviewer 1名に複数task | 重複予約で容量超過しない。待ち理由を表示 |
| SCHED-05 | 所要時間/実quotaが不明 | unknown/根拠付き幅。0分/無制限と補完しない |
| SCHED-06 | 同じgraphに循環/未解決依存 | 影響集合をtyped block。独立ready作業は進行可 |
| SCHED-07 | 実行中にHEAD/policy/ownerが変わる | 古いproposalで新作用0。正規checkpoint/再認可で再開 |
| SCHED-08 | 低priorityのready taskが長期待機 | aging/例外処理。飢餓を無限に放置しない |
| SCHED-09 | 小さい予測差で候補順位が揺れる | 未着手優先の再計画、無意味なpreemption/重複通知をしない |
| SCHED-10 | 新規実装を増やすとreview queueが飽和 | WIPを抑え、終端できる仕事を優先。無限のPR積み上げをしない |
| SCHED-11 | provider枠が尽きた/費用soft予算超過 | 許可済み代替/待機/限定超過。独立性・必須検証を維持 |
| SCHED-12 | planの優先度欄へ外部Issueから命令混入 | 未承認priority/権限を採用しない。データとして検出 |
| SCHED-13 | dispatcherがack前に落ちる/同command再送 | read-afterで実採択を確認、二重作用0でresume/terminal |
| SCHED-14 | estimator更新の後に精度/費用が悪化 | 検証済みestimator/決定的順序へ戻し、actual履歴を保持 |

R03は入力/unknown/同一性、R04は計画/表示、R05は配布/競合/回復、R09は予測校正の実測を担当。`tools/validate_roadmap.py`は付属例と文書整合だけを検査し、この表のUT本番受入を実行した扱いにはしない。

## 9. 作業配布の画面

「次に配るtask」「並列可能な集合」「今は配らない理由」「次の解放条件」「CI/reviewerの容量」「予測幅/unknown」「actual状態」「plan revision/鮮度」「人間判断が必要な例外」を同じviewへ。予定のバーを進捗実績と同じ表示にしない。図はrecordから生成し、手描きスケジュールを別正本にしない。
