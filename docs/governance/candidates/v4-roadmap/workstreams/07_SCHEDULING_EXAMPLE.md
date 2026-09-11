# 順序予測の具体例（架空fixture）

実UTの所要時間予測ではない。単位はfixture_unit。共通契約A→backend B/front C→統合Iに、独立doc Dを同時投入した例。実装・CI・review・mergeの資源を分ける。

| task | 必要前提 | 実装 | CI | review | merge |
|---|---|---|---|---|---|
| A 共通契約 | なし | 0〜3 | 3〜4 | 4〜6 | 6〜7 |
| D 独立doc | なし | 0〜2 | 2〜3 | 3〜4 | 4〜5 |
| B backend | A | 7〜13 | 13〜14 | 14〜16 | 16〜17 |
| C frontend | A | 7〜11 | 11〜12 | 12〜14 | 14〜15 |
| I 統合 | B,C | 17〜20 | 20〜22 | 22〜23 | 23〜24 |

Aは実装が3で終わるが、この例の後続前提はmerge admissionなのでB/Cの開始は7以降。reviewerとCIは各1枠、Dは空いた枠を使いAのcritical pathを妨げない。B/C双方が受入済みになる17まで統合は開始しない。

同じ入力からの計画再現、dependency/resourceの違反ゼロ、24というfixture上の終端を付属validatorで検査する。これは最適解の証明、予測精度測定、UT schedulerの実装・受入ではない。

この例を実データへ置き換えるときは、作業時点の実績/人間見積り/unknown、actual receipt、policyとstage graphを用いる。durationだけをAIが断言してはならない。
