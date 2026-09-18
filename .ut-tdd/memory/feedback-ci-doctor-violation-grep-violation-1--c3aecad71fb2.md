---
memory_id: memory:feedback:ci-doctor-violation-grep-violation-1--c3aecad71fb2
kind: feedback
title: "CI/doctorログのviolation行をgrepするときは件数表記(violation 1等)にパターンを固定しない"
tags: ["ci-triage", "doctor-output", "grep-pitfall"]
updated_at: 2026-09-16T11:17:00.303Z
---

doctorのcoding-rules等の出力は "violation N" の形でNが件数によって変わる。grepパターンを特定の件数表記(例: "violation 1")に限定すると、実際には別件数("violation 2"等)で報告されている独立した違反行を静かに取りこぼす。1件の違反しか見つからなかったと報告する前に、件数表記に依存しないパターン(例: "violation" 単独、または doctor 出力全文)で再走査し、複数の異なる違反グループが同じjobログ内に併存していないかを確認する。
