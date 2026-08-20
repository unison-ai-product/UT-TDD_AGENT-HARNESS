---
memory_id: memory:feedback:pr-319-verdict-path-exact-head-0a6fd103-ci-3-3-success-u-rvatt-029-behavioral-codex-delta-review
kind: feedback
title: "PR #319 verdict path 修正を積みました: exact HEAD 0a6fd103、CI 3/3 SUCCESS、U-RVATT-029 で behavioral 固定。Codex delta review 依頼"
tags: ["d3a", "delta-review", "exact-head", "pr-319", "review-request", "verdict-file"]
updated_at: 2026-08-17T01:32:41.883Z
---

指示どおり #319 へ最小修正を積みました。新 exact HEAD 0a6fd103e30e6e4a1ec1b0b2f9c50f1b4e4a5f5e (実値は下記) 、CI run 31984642551 は linux / windows / aggregate の 3 job とも SUCCESS です。私が author になったので、delta review は Codex 側 frontier tier でお願いします。

## 修正内容 (2 commit)

1. fix(review) 36decc47: reviewOutputContract(verdictFilePath?) を追加し、path があれば literal absolute path を契約本文へ埋め込む (env 名も併記して従来経路と互換)。delegation 側は契約を組む前に verdict path を確定させる生成順の入れ替えのみで、identity 宣言なし review lane で temp dir を作らない述語 (reviewIdentityRequested) は不変。test-repository-isolation の review-live-cli callsite を 2 へ更新。
2. test(review) 0a6fd103: U-RVCON-016 が契約全文の定数一致で比較していたため、literal path 注入で fail していた。role による注入の有無という本来の不変条件を path 非依存の契約冒頭行で見る形へ変更し、literal path が実際に入っていることも assert する。

## behavioral oracle (source-text assertion は使っていません)

U-RVATT-029: 環境変数を一切参照せず、契約本文から literal path を抽出して verdict file を書く provider stub を実 delegation CLI へ通し、receipt が成立することを固定します。stub は node script で、prompt (stdin) から verdict.txt の絶対 path を正規表現で拾って書き込むだけです。

load-bearing 実証: reviewOutputContract の literal path 注入を無効化する変異 (destination を env 名のみへ固定) を入れると U-RVATT-029 が RED になることを実測しました。契約文の綴りを見る assertion ではないため、PR #323 で私が指摘した coding ≠ substance の穴には当たりません。

## 実測

- verdict 契約に触れる 10 suite 191 tests green (review-verdict-contract / review-live-cli / review-attestation / review-custody / review-dispatch / review-merge-gate / review-evidence / live-review-projection / post-merge-backstop / cli-delegation)
- oracle-test-trace ok (orphans 0 / undeclared 0)、test-repository-isolation ok (contracts=95)、plan lint OK (876)、tsc 0、biome clean (655 files)
- CI run 31984642551: 3 job とも SUCCESS

## 経緯の補足 (途中の CI red 1 件)

初回 push (36decc47) で U-RVCON-016 が両 leg red になりました。原因は私が当該 suite をローカルで回していなかったことで、dry-run 経路でも identity 宣言があると literal path が入るため契約全文の定数一致が崩れる、という取りこぼしです。0a6fd103 で是正し、以後は契約に触れる 10 suite をまとめて回す形にしました。

## 次段

この修正が merge されれば、self-bootstrap 経路 (live-dispatch → live-consume → receipt → 規定 wrapper merge) が env 参照に依存せず通るはずです。delta review PASS 後に、同じ手順を再実行して receipt を生成し wrapper で #319 を閉じます。gh 直叩き・synthetic receipt は使いません。
