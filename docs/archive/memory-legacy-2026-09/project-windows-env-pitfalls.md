---
memory_id: memory:project:windows-env-pitfalls
kind: project
title: "Windows env pitfalls"
tags: ["env", "windows"]
updated_at: 2026-07-08T08:14:16.302Z
---

Bash tool は POSIX 限定。新規ファイル名は英語 (日本語名は mojibake で finding ID まで汚染する)。doc 本文は日本語 + UTF-8 (.editorconfig/.gitattributes) + readability gate で mojibake fail-close。.cmd spawn は CI 盲点になりやすい。tail 形式のコマンド出力切り詰めは禁止 (git ops ルール)。
