---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_gate_run_evidence_warning
pair_artifact: docs/test-design/harness/L7-gate-run-stderr-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1359
---

# gate-run 証跡保存失敗時の警告境界 (Issue #1359)

> **L6 contract marker**: `runGate(gId) => exit status` のうち、`writeGateRunEvidence` の公開失敗時の警告と中断後の復旧を対象とする unit-test-granularity contract である。DbC oracle の詳細は対になる L7 に置く。

## 1. 位置付け

対になる設計文書は `docs/test-design/harness/L7-gate-run-stderr-test-design.md` である。
gate の判定と証跡書込の詳細は `docs/design/harness/L6-function-design/function-spec.md` §2.2 を参照する。

## 2. 契約

gate verdict は `evaluateGateReview` + `evaluateStaticGate` の合成であり、証跡書込の失敗も verdict / exit を変えず stderr 警告にする。

## 3. 公開失敗と中断後の復旧 (Issue #1468)

`function-spec.md` §2.2 の no-clobber 公開について、`U-GATE-009` で保留した4項目の検証境界を定める。通常の gate は、完成した証跡を同じディレクトリの `.tmp-*` に書き、hard link で final 名を作り、成功後に自分の temp を片付ける。

### 3.1 同じ ID の衝突

既存証跡の ID が一致する場合と、hard link が `EEXIST` で失敗した場合は、CLI の既存の証跡書込警告に `EEXIST` を含める。human-readable では stderr に出し、`--json` では `gate_run_evidence_warning` に格納する。公開できなかった実行の `gate_run_evidence` は `null`。証跡保存の成否によらず、同じ gate 入力の verdict と exit code を維持する。既存 final の内容を保持する。

### 3.2 内部の検証入口

`writeGateRunEvidence(input, boundary?)` の `boundary` は、writer の内部で使用する任意の依存とする。引数を省略した通常実行では既存の filesystem 操作を使う。

| 依存 | 呼ぶ位置と契約 |
|---|---|
| `beforeLink(stagedPath, finalPath)` | `.tmp-*` への完成 JSON の書き込みが成功した場合に、hard link の直前に同期で1回呼ぶ。両 path は writer が使う同じ証跡ディレクトリの path。呼び出し時に temp が実在し、今回の書き込みによる final はまだ作られていない。 |
| `link(stagedPath, finalPath)` | `beforeLink` が戻った直後に呼ぶ hard link 操作。注入された例外を呼び出し元に伝え、copy・rename・final への直接書き込みで公開を続けることを禁止する。通常実行では `linkSync` を使う。 |

CLI オプション、環境変数、設定ファイルからこの依存を指定する経路は設けない。テストは一時ディレクトリと専用の子プロセス内で注入する。

### 3.3 中断からの復旧

hard link 前に writer の子プロセスが終了すると、当該実行の final は存在せず、完成 temp が残る。別プロセスの retry は新しい `gate_run_id` を使い、その ID に対応する final を1件公開する。前の temp は内容も名前も保持する。通常の `collectGateRunEvidenceProjection` は retry の final を読むが、残った temp は証跡として数えない。

4項目のテスト設計、前提の検証、後続 Red の候補 ID は対になる L7 §2 に置く。
