# CI・role・Memory・viewの置換実務

## CI（R03準備→R04対象切替）

1. consumer既存workflow・required check・UT追加検査・呼出し経路をinventoryし、現状digestを保存。
2. 変更影響selectorは副作用なしで現行fullと並走し、必要集合と実測を比較する。
3. 新aggregateは「selectedではなくrequiredな集合」の各receiptを照合する。判定不能・selector障害はfullへ。
4. 消すのは重複/不必要な起動。必須AC・対象OS・release受入の義務は保持する。
5. 承認したconsumerへworkflow差分を適用。次のcandidateでrequired checkがPendingのままになる設定事故も検査。
6. 保存コストを抑える場合は、大きな一時artifactと必要な監査証拠を分ける。全receipt短期削除はしない。

OS・依存・toolchain・policy・source・入力・check集合・実行主体が違う検証をcache hitとして代用しない。PR/mainの証拠継承は既定でoff。導入するなら同等性の機械証明と受入契約の変更が必要。初期は最終candidateを固めてreview→mergeを短くする。

## role（R03最小契約→R08全写像）

logical roleのid/capability/証拠義務はR03で先に決める。R05では既存adapterがそのroleを消費する。R08でprovider-native定義をgeneratedへ置換し、guard/delegationと一致させる。role/権限の新設はpolicy変更として独立に審査する。

旧定義からmodel名を消しただけで独立性が向上したとしない。session実在・blind namespace・author/reviewer/admitterと対象subjectを確認。専門domainはskillとして別注入する。

## Memory/対策/context（M0隔離→R03記録→R09整理）

Memory配送を直すM0/R02と、長期知識lifecycleを変えるR09を混ぜない。前者は保存/通知/再送の正確性、後者は何を知識として採択/退役するか。

captured内容から要求/設計/guard/testへ取り込んだら、取り込み先digestとretirementを結ぶ。常時注入停止は原本消去ではない。秘密・private transcriptは知識corpusへ無条件投入しない。旧対策が検索/要約/別adapterで復活しない負系を持つ。

## view（R03プロト→R04往復→R07上流全接続）

新rendererが対応するcanonical id/行/列/図をmanifest化。旧スプシを入力として無条件に正本へ戻さない。人間の編集はread-only表示列と提案列/提出surfaceを分け、差分がadmissionへ入る。narrative本文を機械が上書きする経路は作らない。

source digestとrendered digestは異なる種類の値。単純に両者が等しいことを要求せず、同じsource+renderer版+設定から再生成した期待payloadと照合する。xlsx ZIP内部timestamp等を正規化するか、意味payloadのdigestとバイナリdigestの役割を分ける。未知の書式/欠落行を空成功にしない。

初回viewの画面ルール・fixture・findingは既存の上流手順で検証し、将来のR07エンジンを待つ循環依存を作らない。記録の共通型はR03から使い、prose-onlyの別資産を増築しない。
