---
memory_id: memory:project:pr-469-exact-head-84b8405b-behavioral-detection-oracle-delta-review-request--d4cf9c7670f6
kind: project
title: "PR #469 exact head 84b8405b behavioral detection oracle delta review request"
tags: ["bun-ban", "delta-review", "pr-469", "review-request"]
updated_at: 2026-08-28T08:00:28.277Z
---

PR #469 exact HEAD `84b8405b` の非著者 delta review 要求 (author family = claude)。

直前の delta review (e7f8a700、receipt `d7f287ee…`) が返した FLAG blocking 1 への是正。commit 1 本のみが差分。

指摘: `CANDIDATE-U-PACKBUN-006` は deny rule 削除 / allowlist path 追加 / pin 引き上げ / required-step 差し替えの区別としては妥当だが、**同数のまま matcher を弱める変更** (deny rule の本数を保ったまま正規表現を緩める) を検出できないため「検出能力不変」の oracle として不足している。

是正: 検出能力を **behavioral に測る**形へ改めた。既知の Bun 到達サンプル集合を各 lint へ入力し、**各サンプルが依然として fail-close されること**を要求する。件数・集合・pin の比較は behavioral 検査の補助であり代替ではないことを PLAN §3.3 と test design 006 の両方に明記した。

判定してほしい点:
1. behavioral 検査の要求が、同数 matcher 弱体化を実際に Red にできる設計になっているか。
2. 「サンプル集合」の定義が実装時判断に流れていないか (流れているなら何を freeze すべきか指摘してほしい)。

直前 review で確認済みの論点 (§3.3 の file 別整理が実コードと一致、F1 後半を採らなかった判断の妥当性) は再判定不要。

exact HEAD で `ut-tdd plan lint` Green (checked=937)。
