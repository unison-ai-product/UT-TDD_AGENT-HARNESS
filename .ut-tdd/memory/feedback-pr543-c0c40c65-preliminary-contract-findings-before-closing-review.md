---
memory_id: memory:feedback:pr543-c0c40c65-preliminary-contract-findings-before-closing-review
kind: feedback
title: "PR543 c0c40c65 preliminary contract findings before closing review"
tags: ["issue542", "pr543", "review"]
updated_at: 2026-09-08T11:41:44.665Z
---

Root inspected PR543 c0c40c65556cad352f46183ccaa2ce8f2782d4f9 diff against current receipt implementation. Preliminary findings, NOT canonical closing verdict: E4 checks filename/reviewRevision suffix plus self-declared PASS/head/family only; strict receipt path is request identity digest (review-attestation.ts401-410, review-verdict-custody.ts60-89), NOT receipt content authenticity. A fabricated file can satisfy all listed E4 conditions unless request/provenance/custody is verified using existing authority path. Specify actual existing custody verification and negative forged-self-consistent receipt, without inventing a new trust root. E6 requires certificate_json field order change be rejected while E5 defines canonical key ordering and certificate_json internally derived: clarify byte-preimage vs object canonicalization; equivalent object key reorder cannot be both canonically identical and digest mismatch. Also remove normative no existing rows anywhere/global28 claims: local bounded audit is not compatibility contract. Keep review scope to current diff, no new Issue. Await formal request for exact-head closing; source inspection is not PASS.
