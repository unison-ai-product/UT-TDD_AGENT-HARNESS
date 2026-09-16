---
memory_id: memory:feedback:regex-lint-source-import-detected-missed--8bdca5d2e153
kind: feedback
title: "regexベースのlintルールを検証するときは、正本sourceをimportして実挙動を測り、DETECTED/MISSEDを一意に分ける最小入力ペアを作る"
tags: ["debugging-technique", "lint-verification", "regex-testing"]
updated_at: 2026-09-16T11:14:29.655Z
---

文字クラスや正規表現を使う検出器(例: 実行形/禁止語パターン)の挙動を検証するときは、シェルのheredoc経由で書いた検証用スクリプトに頼らない。heredocはbackslashを欠落させることがあり、手書きregexの再現テストが偽の緑を出す原因になる。代わりに正本のsourceファイルをそのままimportして実際の関数を呼び、実挙動を測る。さらに、診断が正しいかどうかを、ある1文字/1トークンの有無だけでDETECTED/MISSEDが入れ替わるような非対称な最小入力ペアを作ることで一意に確定させる。散文6形/実行形15形のような広い網羅リストだけでは見落としやすい境界条件(例: 文字クラス内の1文字の誤記)を、この最小ペアが機械的に暴く。
