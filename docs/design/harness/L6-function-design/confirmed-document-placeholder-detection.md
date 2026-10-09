---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_confirmed_document_placeholder_detection
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-833-confirmed-document-placeholder-detection.md
---

# 確定文書に残ったテンプレート記入欄の検出契約

## 1. 目的と境界

consumer の成果物文書を `confirmed` または `completed` に凍結する際、テンプレート由来の記入欄が残っていれば、その文書を既存の所有 gate で fail-close にする。判定器は純関数とし、既存 gate が既に選択している対象文書の集合と呼出経路だけを使う。

新しい gate ID、全層を横断する独立走査、layer番号に基づく対象の推測、advisory 扱いは追加しない。optional 文書も既存 gate の対象集合に入る場合だけ対象になる。現行 gate に所有されない文書はこの契約の対象外であり、所有集合を新設しない。

## 2. 検出対象

一件の対象文書について、status が `confirmed` または `completed` のときだけ本文を検査する。`draft` その他の status はこの判定器で検査しない。status の解釈・gate 対象への追加は、各既存 gate の所有のままにする。

未記入欄の字句は、Issue #894 comment 6051508799 で凍結した次の正規表現に限る。

<!-- 正規表現の正本: `<[^<>\n]*記入[^<>\n]*>` -->

山括弧だけの一般表現（HTML element、`id` 等）は対象にしない。照合前に HTML comment (`<!-- ... -->`) の範囲だけを除外する。コメントは複数行でも除外する。fenced code、inline code、引用、表、その他 Markdown 構造に対する追加除外は行わない。閉じていないコメント開始記号は HTML comment とみなさず、通常の本文として fail-close に照合する。

テンプレート内の説明用の記法例は HTML comment に置ける。実際の本文欄、必須節、検査対象となる記入欄は残し、削除・短縮・別語への置換で検査を通過させてはならない。

## 3. 関数契約

| Function(s) | Signature | pre | post | invariant | oracle | 契約の補足 |
| --- | --- | --- | --- | --- | --- | --- |
| `findUnfilledTemplatePlaceholders` | `findUnfilledTemplatePlaceholders(path, status, content) => findings[]` | `path`, `status`, `content` は既存 gate が選んだ同一文書の値である。ファイル探索・I/O は呼出側の既存 loader が担う。 | `status` が `confirmed` / `completed` で、HTML comment 除去後の本文に正規表現一致があれば、各一致の path・行番号・列番号・字句を返す。一致がなければ空配列を返し、`draft` その他の status は本文を判定せず空配列を返す。行・列はコメント除去後も元本文の位置を保ち、診断順は path、行、列の昇順とする。一致が1件以上なら caller の既存 gate 結果を失敗させ、判定不能・対象読込エラーも既存の fail-close 経路で失敗させる。 | HTML comment 以外の本文は正規化しない。fence・inline codeを無視せず、正規表現以外の山括弧を検出しない。出力形式を新 gate result 型や永続状態へ拡張しない。 | `docs/test-design/harness/L7-confirmed-document-placeholder-detection-test-design.md` §3 の既存 CANDIDATE-U-PH-001..008 が純関数契約を検証し、§4 の既存 CANDIDATE-U-PH-010..025 がgate到達性と実repo G1〜G6 clean対照を検証する。 | 純関数の検出結果を既存gateへ渡す（新I/O・永続状態なし）。 |

## 4. 既存 gate への接続

共有関数は各 gate が今持つ対象集合の境界で呼ぶ。既存の loader・status判定・gate対象範囲を変更せず、別の全層 collector を作らない。

| 既存経路 | 既存 owner set / 接続境界 |
| --- | --- |
| G1〜G6 pair (G1/G1-TRACE, G2, G3/G3-TRACE, G4, G5, G6) | `loadPairDocs` がロードした pair docs のうち、各 gate がすでに選んだ対象 layer。 |
| G7 static | `evaluateG7` の既存 pair-freeze / L0-L7 verification 対象。G7 で既に使う入力に限定し、後続層を独立走査しない。 |
| G8〜G10 workflow | 各既存 `loadG8IntegrationWorkflowInput` / `loadG9SystemWorkflowInput` / `loadG10UxWorkflowInput` が所有する対象文書。 |
| right-arm static | `evaluateRightArmStaticGate` が G8〜G14 で現在選択する slot / source。特に G11〜G14 はその1 slotのみを対象にし、pair docs 全体を新たに走査しない。 |

G8〜G10 の workflow 経路と right-arm fallback は別の既存分岐として保持する。各分岐で対象文書が重なる場合も、その gate が現在所有する入力だけを同じ純関数へ渡す。G11〜G14 の optional な入力も現行 slot owner の範囲を変えない。

## 5. 既存 fixture / template の扱い

`tests/consumer-g14-static.test.ts` の confirmed fixture は、confirmed と称しながら残している対象欄を実際に埋めた状態へ正す。検査を skip したり、status を下げたり、成功扱いへ洗浄したりしない。修正後の fixture に対象欄を1件戻すと、既存 G14 static gate が失敗することを pair test-design で検証する。

48 template の字句・path 対応は pair test-design の inventory 表に固定する。事前実測値は説明用記法のHTML comment移動前の inventory であり、matcher一致数は合否基準ではない。HTML comment内の説明例を除外しても、実欄の検出能力は維持する。

この契約PRでは説明例の移動に加え、`L13-production-observation.md` の G13 検証ケース行を、`<SMOKE-ID>` / `<観測内容>` / `<合否基準>` / `<AT-ID>` から4セルとも &lt;記入&gt; へ正規化する。旧記法は凍結した regex に一致せず、confirmed 文書に残っても検出できないためである。実欄の列構造・必須節・matcher・gate owner set は変更しない。

## 6. 非スコープ

- 必須節の有無、文書品質、テンプレート充実度の判定。
- status transition / PLAN admission / gate ID / gate registry の追加。
- 本文所有のない optional 文書への新しい適用面。
- Markdown fence、inline code、引用、HTML tag、generic identifier の追加除外。
- consumer template 以外に対する repository-wide scan。
