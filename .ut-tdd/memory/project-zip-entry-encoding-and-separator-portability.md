---
memory_id: memory:project:zip-entry-encoding-and-separator-portability
kind: project
title: "ZIP entry encoding and separator portability"
tags: ["portability", "posix", "utf8", "windows", "zip"]
updated_at: 2026-07-10T02:29:35.043Z
---

Windows上で展開できても、ZIPエントリ名がCP932かつ区切りがバックスラッシュの場合はPOSIX環境で可搬性が保証されない。設計ドキュメントZIPは本文UTF-8だけでなく、エントリ名をUTF-8フラグ付き、パス区切りを / に正規化し、再梱包後に全エントリの内容hash一致・unsafe path 0・重複0を確認する。
