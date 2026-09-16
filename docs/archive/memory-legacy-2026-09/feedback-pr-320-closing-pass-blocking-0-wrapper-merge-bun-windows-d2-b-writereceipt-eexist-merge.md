---
memory_id: memory:feedback:pr-320-closing-pass-blocking-0-wrapper-merge-bun-windows-d2-b-writereceipt-eexist-merge
kind: feedback
title: "PR #320 closing PASS (blocking 0) + wrapper merge 経路が bun/Windows で構造的に実行不能 (D2-B writeReceipt EEXIST)、merge 保留"
tags: ["bun-windows", "d2-b", "merge-blocked", "pass", "pf3", "pr-320"]
updated_at: 2026-08-14T10:05:13.075Z
---

# PR #320 closing verdict = PASS (blocking 0)。ただし指示された wrapper 経路が実測で実行不能のため merge を保留する

## 1. verdict (PR comment 5292022072 に全文)

PR #320 / exact HEAD `bdda726a900a06ea90c78a6016d6861bbe78334d` — **PASS (blocking 0 / non-blocking 6)**。

重点 6 項目はすべて実装が契約を満たすことを実測で確認した (env 強制の後置順序、`cat-file --batch` の状態機械 framing 判別と declared size までの stream 収集、2 MiB 超 + NUL blob の byte 同一性、settle 一意性、実 `--filter=blob:none` fixture が `rev-list --missing=print` の事前 assert で空振りを構造的に検出すること、error 分類と PF-2 error 保持)。

mutation 16 件 = 9 KILLED / 7 SURVIVED。**生存 7 件はすべて「実装は正しいが oracle が判別できない」類型で、実装欠陥に対応する生存は 0 件**。よって blocking 0 とした。

follow-up を要請する 2 件 (いずれも 1 行で閉じる):

- **N-1**: 契約 `PLAN-L7-487:147-148` が名指しで禁じる「`"1"` への fallback」を kill する oracle が 0 件。`:294` を `materializerVersion: "1"` に固定する変異が **38/38 GREEN 生存** (私が独立に再現)。原因は `tests/release-artifact-resolver.test.ts:25` の `release(commit, version = "1")` で 13 呼出しすべてが既定値のみを使うこと。非 `"1"` token を 1 件渡せば閉じる。
- **N-2**: 「呼出元 env で上書きさせない」の上書き耐性が未 pin (env spread 順反転の変異が生存)。`vi.stubEnv("GIT_NO_LAZY_FETCH","0")` を既存 env テストへ 1 行追加で閉じる。

残る N-3〜N-6 (部分成功の未 pin、network client import の正規表現漏れ、テスト名と実測の乖離、契約に無い `validPath` の過剰厳格) は PR comment に記載。

## 2. 指示どおり wrapper を実行した結果 (gh 直叩きへの読み替えはしていない)

```
$ bun src/cli.ts pr merge --pr 320 --json
review merge: result_receipt_write_failed:EEXIST: file already exists, mkdir '<repo>\.ut-tdd\logs'
{"ok":false,"pr":320,"headSha":"bdda726a...","verdict":null,"decision":"deny",
 "reason":"orphan_pr_observation:unmatched_pr:320@bdda726a...,no_request_for_current_head,result_receipt_write_failed:EEXIST...",
 "receiptPath":null}
exit_code=1
```

deny 理由は 2 系統ある。

### (a) custody 側 — 既知、#319 待ち

`.ut-tdd/review/requests` は 1 件 (PR #300 由来の `ad8f7049e716ddd1.json`) のみ、`.ut-tdd/review/receipts` は **0 件**。よって現 HEAD に対し `no_request_for_current_head` で必ず deny する。live projection を入れる #319 は本日 FLAG (blocking 3) で差し戻したため、receipt が書かれる経路はまだ main に無い。

### (b) 新規検出 — wrapper 自体が本機で merge 不能 (D2-B の実バグ)

`src/feedback/review-merge-gate.ts:214-220` の `writeReceipt` が `mkdirSync(dir, { recursive: true })` を無条件に呼び、**既存ディレクトリで EEXIST を投げる**。切り分け実測:

| 実行 | 結果 |
| --- | --- |
| node で `.ut-tdd/logs` へ `mkdirSync(recursive:true)` | OK |
| **bun** (1.3.14) で同じ呼び出し | **THREW EEXIST** |
| bun で新規ディレクトリを作成 | OK |
| bun で**書込可能な**既存ディレクトリへ再 mkdir | OK |
| `.ut-tdd/logs` の属性 | `mode 40444` (Windows read-only 属性) |
| bun で `.ut-tdd/logs` 配下へ `appendFileSync` | **OK** (書込自体は通る) |

つまり「Windows の read-only 属性が付いた既存ディレクトリ」に対してのみ bun の `mkdirSync(recursive:true)` が EEXIST を投げ、node は許容する。ファイル書込自体は成功するので、**`existsSync` ガード (または EEXIST の握り潰し) 1 箇所で解消する**。

重大なのは影響範囲。`runPrMerge` は `:339-350` で **merge 実行前に `merge_intent` receipt を書き、失敗したら `intent_receipt_write_failed` で deny して merge しない** (fail-close 設計として正しい)。したがって custody が完備して `merge_ready` になっても、本機では intent receipt 書込で必ず落ちる。**wrapper は本機で構造的に一度も merge できない**。これは custody 欠如 (a) とは独立の欠陥で、#319 が入っても解消しない。

なお `decision=deny` 時の exit code は 1 で、fail-close は正しく効いている (最初の観測で exit 0 に見えたのは pipe 経由で `tail` の exit を読んでいた私の計測ミス)。

## 3. 判断を仰ぎたい点

「規定 wrapper のみで merge、`gh pr merge` 直叩き禁止」の指示は、(b) が是正されるまで**どの PR に対しても履行不能**です。私の側で指示を読み替えることはしないので、次のいずれかを指示してください。

- (i) (b) を先に是正する PR を出す (`writeReceipt` の `existsSync` ガード + 既存ディレクトリでの回帰テスト)。その後 #320 を wrapper で merge する。#320 は PASS 済みなので待たせるだけになる。
- (ii) (b) の是正までは exact-HEAD 束縛の `gh pr merge --match-head-commit` を暫定容認する。D2-D backstop が #320 を `bypass_merge` として検知するが、これは真陽性であり既知として残る (#302 / #312 / #317 / #318 と同類型)。
- (iii) #320 の merge 自体を保留する。

私は (i) を推奨します。(b) は 1 行の是正で閉じ、かつ wrapper が使えるようになれば以後の bypass 検知を増やさずに済むためです。ただし (b) の是正 PR は D2-B の担当 family が書くべきで、私 (review 側) は書きません。

現時点では **#320 は merge していません**。指示があるまで保留します。
