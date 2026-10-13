# Issue #960 module／設計対応の一次棚卸し

この候補表は、tracked `src/` ファイルとtracked L4–L6設計サブ文書、PLANの`generates`宣言を照合します。JSONには対象Git commit、Git blob ID、byte digest、parser結果、行引用、3つの候補一覧を収録します。実装完了監査や廃止判定表ではありません。

## 再生成

リポジトリrootでNode 24.13以降を使い、immutableな40桁commit IDを指定します（TypeScriptのstrip機能を使用します）。

```powershell
node --experimental-strip-types docs/governance/candidates/v4-roadmap/migration/issue960-module-design-inventory-20261013.mjs 3ca0692d6c6a180b058c492475080be2a140e667
```

引数は入力にするGit treeを選びます。このJSONを再現するにはJSONに記録された同じsource commitを指定してください。データ本文はそのcommitのGit tree/blobから読みます。一方、production parserはscriptのcheckoutからimportします。再現時にはscriptと、JSONの`parser_sources`に列挙されたparser各ファイルを、生成時と同じcommit版に固定してください。scriptはcheckout上のparser blob IDが指定source commit内のblob IDと一致しない場合に停止します。出力JSONはscriptと同じディレクトリに書かれます。

使用する既存parserは`parseListedModules`、`designLayerFromPath`、`isDesignSubDoc`、`parsePairDoc`、`parseLegacyPlanSource`です。PLAN parserの失敗は捨てずerror recordとして残します。tracked `src/` blobを全件含め、出力前にsource pathの一対一coverageを検査します。

## 粒度と解釈上の限界

module粒度はtracked `src/<directory>/`ごとに1 unitです。`src/`直下にあるtracked fileは各ファイルを別々の`src-root:<filename>` unitとして扱います。TypeScript以外のtracked `src/` blobも対象です。設計範囲はproduction path parserがL4、L5、L6の設計サブ文書と認識するtracked Markdownです。同parserの対象外となるindex/living pageは数えません。

設計本文中のexact source path、具体的なtop-level module directory prefix、PLAN `generates`宣言、`pair_artifact`、basename候補、architecture名候補は別々に記録します。`src/`だけの記載はscope-root候補として保存し、module対応にはしません。wildcardや未解決pathも候補のままです。`pair_artifact`は設計とtest-designのpairing metadataであり、source/module対応の根拠ではありません。basename/architecture名の一致は提案に留まり、PLAN宣言だけでも設計の所有関係や実装完了は証明しません。

参照がないことは、設計がないことや実装がないことの証明ではありません。字句的なcontent-drift候補も意味上の不具合を確定しません。relation graphとharness databaseは参照していません。graphを使わなかったため、一覧にない関係が存在しないとは判定できません。既存設計の全契約が実装済みだという主張も行いません。曖昧なpath、候補対応、意味的な動作の判定は人手確認が必要で、原因分類は後段②(d)の対象です。
