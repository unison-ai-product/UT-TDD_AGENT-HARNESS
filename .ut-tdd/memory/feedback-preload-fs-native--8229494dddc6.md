---
memory_id: memory:feedback:preload-fs-native--8229494dddc6
kind: feedback
title: "監査preloadはfs関数のnative入口を保持して同じ拒否を適用する"
tags: ["audit", "canary", "review"]
updated_at: 2026-10-01T06:01:37.860Z
---

fs.realpathSyncを監査用関数へ置換するとき、元関数の.native入口も監査付きで保持する。通常入口だけを置換するとconsumer wrapperのrealpathSync.native呼出を壊し、正常なsealed runtimeをconsumer_runtime_absentと誤判定する。PR #804で実producerのinstall後・取得元削除後・別cwdのverify実測が検出した。関連対応とtemplate前提不足の確認依頼は https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/804#issuecomment-5925661506 を参照。修正のsnapshot単独oracleは1 pass、全受入はまだ未証明。public acceptanceやclosing PASSへ読み替えない。
