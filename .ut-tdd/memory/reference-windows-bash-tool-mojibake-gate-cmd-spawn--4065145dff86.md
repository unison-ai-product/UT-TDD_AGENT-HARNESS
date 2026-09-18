---
memory_id: memory:reference:windows-bash-tool-mojibake-gate-cmd-spawn--4065145dff86
kind: reference
title: "Windows開発環境の落とし穴: Bash tool制限/日本語ファイル名/mojibake gate/.cmd spawn盲点"
tags: ["ci-blind-spot", "readability", "windows"]
updated_at: 2026-09-16T11:15:48.356Z
---

Bash toolはPOSIX限定であり、Windows固有コマンドは別途扱う必要がある。新規ファイル名は英語にする(日本語名はmojibakeでfinding IDまで汚染することがある)。doc本文は日本語+UTF-8(.editorconfig/.gitattributesによる正規化)で書き、readability gateがmojibakeをfail-closeする前提を保つ。.cmd経由のspawnはCIの盲点になりやすい(テスト環境で見落とされがち)。コマンド出力をtail形式で切り詰めて報告しない。
