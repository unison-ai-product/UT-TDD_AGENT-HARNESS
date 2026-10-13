# PLAN-L6-834 confirm 前置確認

## 対象と指定順

- Issue: #898、control 指示: #934 comment 6136352577。
- baseline: `96da70d6d40c984582fdbe2c8f01e72d4d7a7fb8`。
- 契約導入PR: #906、merge `9555e21de7a2414430e76acd5bc3204a9531bcf6`。
- PLAN: `docs/plans/PLAN-L6-834-design-protection-diff-gate.md`、revision 1、status draft。
- 本PRは既存契約を変更しないconfirm準備であり、正式PLAN recordも実装も含めない。
- exact HEAD のCI成功後にcontrolがClaude Opusの非著者evidence reviewを行う。そのPASSを受けてから正規 `plan revise` でconfirmedへ進める。帳簿reviewとmergeはcontrolが行う。

## 現在の契約と対

- L6: `docs/design/harness/L6-function-design/design-protection-diff-gate.md`。
- L7: `docs/test-design/harness/L7-design-protection-diff-gate-test-design.md`。
- 共有索引: `docs/test-design/harness/L7-unit-test-design.md`。
- 専用pairは候補001〜026を宣言する。実装済みoracle、実装Green、gate稼働済みとは扱わない。
- 分類は変更path集合のみ。`src/` または `scripts/` を含むPRを実装PRとし、既存 `docs/design/` / `docs/test-design/` のM/D/Rを拒否、Aを許可する。
- rename分類はfromとpath両方、保護判定はfromを見る。入力異常はfail-close、空diffは正常の非実装PR。
- 例外・overrideは設けない。`tests/` は分類の発火条件に含めない。
- confirm後の契約＋Red PRで正式IDへ1:1昇格し、`it.fails` で未実装のRedを観測する。その後の実装PRは設計/pairを変更せずGreenへ進める。
- CIの実装は既存Linux legのPR event限定stepとruntime semantic manifest、SOURCE_REQUIRED_STEPSを同じ実装PRで接続する。現時点の接続完了は主張しない。

## 検証と証跡の境界

- この文書は前置scopeの説明であり、PASS receiptや実行ログの代用品ではない。
- CIとreviewの時刻は実際の結果から採取する。レビュー前に完了していないCIを前置Greenとして記録しない。
- `green_commands` のevidence path/digest/anchorは実在する証跡から束縛する。PLAN revisionとprojection tailは正式writer直前のtracked sourceから再採取する。
- 旧reviewの流用、所有宣言の削除、歴史receiptの手編集は行わない。
- 本PRにはsrc/scripts、設計書、テスト設計、PLAN、projection ledgerの変更を含めない。
