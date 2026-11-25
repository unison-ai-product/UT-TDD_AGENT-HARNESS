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

`writeGateRunEvidence(input, boundary?)` の `boundary` は、writer の直接テストで使う任意の内部依存とする。引数を省略した通常実行では既存の filesystem 操作を使う。この依存を CLI オプション、環境変数、設定ファイルなどから writer に渡す本番経路は設けない。

| 依存 | 呼ぶ位置と契約 |
|---|---|
| `beforeLink(stagedPath, finalPath)` | `.tmp-*` への完成 JSON の書き込みが成功した場合に、hard link の直前に同期で1回呼ぶ。両 path は writer が使う同じ証跡ディレクトリの path。呼び出し時に temp が実在し、今回の書き込みによる final はまだ作られていない。 |
| `link(stagedPath, finalPath)` | `beforeLink` が戻った直後に呼ぶ hard link 操作。注入された例外を呼び出し元に伝え、copy・rename・final への直接書き込みで公開を続けることを禁止する。通常実行では `linkSync` を使う。 |

#### CLI テストの起動と観測

CLI 経由の衝突・link 失敗テストは、一時ディレクトリで実 CLI を起動する専用の子プロセスに、テスト専用の Node `--import` preload を指定する。観測記録は証跡ディレクトリと CLI の stdout/stderr から分離したファイルに置く。Node ESM import が参照する組み込み関数を差し替えた後は `syncBuiltinESMExports` を呼ぶ。

既存 ID の事前検査では、preload が引数なしの `new Date()` に限って時計を固定する。同じ gate ID とセッション条件、子プロセスの実 PID を使い、`buildGateRunEvidence` で組み立てた完成 JSON を、正規の hash 名で CLI 起動前に書く。実 CLI が既存 final を読み、早期に拒否したことと、staging と link に進まなかったことを記録する。実行前後で既存 final の bytes が同一であることも確認する。

link 時点の `EEXIST` ケースでは、preload は fixture の証跡ディレクトリに限定して native `linkSync` をラップする。staging 後、ラッパーが占有先 final を配置してから実際の `linkSync` を呼び、その path、呼び出し回数、返った code を記録して例外を再送出する。`EEXIST` 以外のケースも同じ限定ラッパーを使い、1回の呼び出しを記録して固定の `ENOTSUP` (または同等に型が特定できる失敗) を注入する。final は作られない。

### 3.3 中断からの復旧

hard link 前に writer の子プロセスが終了すると、当該実行の final は存在せず、完成 temp が残る。別プロセスの retry は新しい `gate_run_id` を使い、その ID に対応する final を1件公開する。前の temp は内容も名前も保持する。通常の `collectGateRunEvidenceProjection` は retry の final を読むが、残った temp は証跡として数えない。

4項目のテスト設計、前提の検証、後続 Red の候補 ID は対になる L7 §2 に置く。

## 4. 証跡の保存名と hash 衝突 (Issue #1468 の追記)

検証境界は `buildGateRunEvidence` の出力を受け取る保存名の導出とする。builder の ID 生成・ASCII 化は既存仕様に従う。保存名を決める既定経路は builder の出力と同じ文字列を受け取り、その文字列の UTF-8 バイト列を SHA-256 で計算し、小文字の64桁 hex と `.json` を連結する。入力が非 ASCII の場合も、Unicode 正規化や文字の置換を行わず、そのバイト列を使う。

| 内部の検証入口 | 契約 |
|---|---|
| `gateRunEvidenceFilename(gateRunId, pathDigest?)` | 同じモジュール内で writer が使う純粋な保存名の導出。既定の SHA-256 を経由する。任意の `pathDigest` は ID 文字列を受け取り、64桁の小文字 hex を返す内部依存。 |
| `boundary.pathDigest(gateRunId)` | writer の保存名を導出するところでのみ使う。別々の ID が同じ保存名になる場合をテストで決定的に作る。§3.2 と同様、CLI オプション、環境変数、設定ファイルに注入経路を設けない。 |

同じ保存名に対して異なる ID が公開を試みた場合も、既存の hard link の no-clobber を使う。2回目の公開は native link が返した `EEXIST` で拒否し、先に公開されたファイルの bytes を保持する。実際の SHA-256 衝突を生成する代わりに、異なる2つの ID を同じ digest に写して確かめる。両軸のテスト設計は L7 §3 に置く。

## 5. 既存証跡走査の拒否診断 (Issue #1490)

writer が既存 `.json` を走査中に物理 read error、不正 JSON、または JSON `null` に遭遇した場合は、その実行の証跡保存を拒否する。各失敗では問題の既存ファイルの repo-relative、slash-separated path を得て、`Error` を投げる。`error.code` の値は正確に `existing_evidence_scan_failed`、`error.message` は `existing_evidence_scan_failed: ` に続けてその path の `JSON.stringify` 結果を置いた文字列とする。3種の失敗は同じ契約を使い、native/parser の本文、絶対 machine path、raw error cause は message に含めず、cause としても渡さない。

拒否は `.tmp-*` への書込みと final への link より前に行う。走査対象を含む既存 bytes を保持し、新しい staging/final を作らない。CLI は現在の `gate run evidence write failed: ` prefix と既存の配置を維持し、その後ろに上記のエラーのメッセージだけを付ける。human-readable では stderr、`--json` では `gate_run_evidence_warning` に出し、`gate_run_evidence` は `null` とする。証跡保存の拒否によって gate verdict / exit code は変えない。

診断対象は現行の走査を中断する物理読み取り失敗、不正 JSON、JSON `null` の3種に限る。既存 ID の `EEXIST`、正常に読める別 ID の反復、同じ ID の拒否は §3.1 の契約に従う。別名証跡があるまま発行を継続する判断は、同一 ID の二重発行を防げることを確認した後に行う。[ファイル名と ID の再現](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/1490#issuecomment-7123755365) [契約改訂の承認](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/1490#issuecomment-7123927381)

正式 oracle `U-GATEDIAG-001`〜`003` は L7 §4 に定める。
