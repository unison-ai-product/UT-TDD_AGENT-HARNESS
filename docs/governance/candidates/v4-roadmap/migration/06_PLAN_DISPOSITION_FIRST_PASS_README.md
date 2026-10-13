# PLAN 一次インベントリ（最終分類前）

この資料は issue #959 の人手レビューに先立つ、一次インベントリの再現手順と読み方を記録する。全 PLAN の移行・廃止・存続を決める正本ではない。`finalDispositionsClassified: false` の通り、L7 / D / F の各担当による後続確認が必要である。

## 再現

リポジトリルートで以下を実行する。Node.js の `--experimental-strip-types` に対応する版が必要。

```powershell
node --experimental-strip-types docs/governance/candidates/v4-roadmap/migration/06_PLAN_DISPOSITION_FIRST_PASS.mjs --source-ref 3ca0692d6c6a180b058c492475080be2a140e667 --write-json --summary
```

スクリプトは `git ls-tree` / `git cat-file` で指定 ref の tracked PLAN blob を読み、既存の `parseLegacyPlanSource` と `analyzePlanSupersession` / `parseSupersedes` / `planCoreId` を使用する。指定 ref の parser / lint blob が作業ツリーのものと一致しない場合、または指定 ref の PLAN path 集合と index の `git ls-files` 集合が一致しない場合は停止する。未追跡・ignored ファイルや作業ツリー上の PLAN 内容は集計入力に混ぜない。`--write-json` は隣接する `06_PLAN_DISPOSITION_FIRST_PASS.json` のみを生成する。`--summary` なしなら JSON 全体を標準出力へ出す。`--source-ref` を省略した既定値も上記の commit である。

## 範囲と確認済み集計

入力は source commit `3ca0692d6c6a180b058c492475080be2a140e667` の `docs/plans/PLAN-*.md`、計 1,007 件。review lane は L7 543 件、D 246 件、F 218 件。F は PLAN-L0〜L6 と PLAN-DISCOVERY に加え、PLAN-L8〜L14 の engine-swap 各 1 件と PLAN-M-00 / PLAN-M-01 を含む。lane はレビュー分担用の機械的な区分であり、廃止・移管判定ではない。

production parser で全件 parse 成功し、各 `plan_id` とファイル basename が一致する。`supersedes` は17 PLANが宣言し、対象edgeは19件（自己参照7、非自己12）。production lint と同じく、自己参照は双方向の後継証拠に数えない。非自己edgeでは対象PLANの存在と対象本文に後継 core ID があることを記録し、欠落は各0件だった。集計JSONにはedgeごとに対象存在、本文 back-reference の行、自己参照除外を収録する。

`generates` が未記載・空であること、status（`completed` を含む）、または生成先が source tree にないことだけでは廃止と判定しない。生成先存在性は basename ではなく、宣言された正確な path を source Git tree で照合する。例えば L10〜L14 の `.ut-tdd/evidence/.../engine-swap.json` は各宣言パスでは absent と記録される。同名の別 artifact の存在をもって存在扱いにしない。分類を裏付ける責任移管・生きた契約がまだ確定しない項目は `hold` とその理由を残す。

## 読み方と制約

JSON の `preliminaryState` は、双方の supersedes link が実測できた場合の「superseded-link-confirmed」または「hold」を示す一次状態にすぎない。確認済み link があっても、責任移管の範囲と最終廃止は人手レビューに留保する。`wholeSourceDisposition` は全件 `not-finalized` である。

この資料は GitHub issue の現況、実行時の利用実態、所有者の意図を照会しない。また、status や `generates` の欠損から廃止を推論しない。各担当の確認後に最終分類を別途決める。
