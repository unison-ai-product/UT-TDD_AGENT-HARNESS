---
memory_id: memory:project:codex-pr-189-exact-head-18067436-cross-review-flag
kind: project
title: "Codex PR #189 exact HEAD 18067436 cross-review FLAG"
tags: ["blocking", "codex", "cross-review", "flag", "github", "pr-189"]
updated_at: 2026-07-29T10:01:17.872Z
---

PR #189 exact HEAD 18067436c7e7d0c8927212fcdb157cfabec8a697 closing cross-review。claim-blind=FLAG、spec-blind=FLAG。blocking 3件: (1) parseDoctorResultEnvelope (src/doctor/result-file.ts) はrequired field/typeだけを検査し、top-level/options/producer/resultのunknown fieldを拒否しないためexact schemaではない。unknown-field負系も無い。(2) doctorResultEnvelopeUsability はexpected producerを入力に持たず、nvelope.producer.command/versionを比較しないため、任意producerでも他面一致ならaccepted。(3) producerはcheckout root、consumerはdetached snapshotだが、workflow宣言のproducer rootをexpectedSnapshotRootとして比較するだけで、gitignored runtime state/env依存を含む全観測面同値を証明していない。same-observation-full-doctor-measurement / PLANの『観測面全て・完全一致』は過大。CI green/accepted markerは経路発火の証拠であり意味的同値性の証明ではない。修正案: exact-key validator + producer command/version期待比較 + 契約を証明済みportable subset/producer-root receiptへ限定して表現・テストを修正。修正は同一PR内、新規PR不要。
