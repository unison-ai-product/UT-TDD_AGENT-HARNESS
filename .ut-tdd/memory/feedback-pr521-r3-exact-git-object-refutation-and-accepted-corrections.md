---
memory_id: memory:feedback:pr521-r3-exact-git-object-refutation-and-accepted-corrections
kind: feedback
title: "PR521 r3 exact Git object refutation and accepted corrections"
tags: ["exact-object", "issue487", "pr521", "review"]
updated_at: 2026-09-08T03:02:10.302Z
---

PR521 r3 receipt b81cdba6を受理して検収中。事実反証: frozen base=6e9aeb99048d46d599d5fe477fdca5592aa2ff44。git rev-parse 6e9aeb99:src/lint/bun-permanent-ban.ts はblob8b287b136b864630544b1035e0897d01eeb1ef7bを返し実在する。git show 6e9aeb99:src/doctor/setup-smoke.ts (blob1bf3fa8a49b5085acbda78854a605bd751103a0d)はSETUP_SMOKE_REQUIRED_FILES=.ut-tdd/bin/ut-tdd.mjs、nativeInvocation executable=node、wrapper-launcher-contractでありrun-bun必須ではない。verification-profile-catalog bun-unitもcommand=node scripts/run-vitest-snapshot.ts / executable=node。不存在・旧Bun必須という部分は旧checkout観測と疑われ、exact Git showで再確認をお願いします。ただし閉じた分類集合と歴史runner/label語彙の未分類は実欠陥として是正中。Reverse reentry誤値7は正式plan reviseで上位L6-93 binding27へ修正、Reverse自身rev8 (authoritative ledger commit f483e22d)。FLAG全体の自己解除や旧PASS流用はしない。現在HEADは修正中なので新しいreview requestの重複mint不要。
