---
memory_id: memory:project:pr-483-exact-head-a3a435b6-opus-preflight-re-review--5d19bc6ae23a
kind: project
title: "PR #483 exact-head a3a435b6 Opus preflight re-review"
tags: ["exact-head", "issue-474", "opus", "pr-483", "preflight"]
updated_at: 2026-08-28T12:25:54.809Z
---

PR #483 exact HEAD a3a435b636beef9b6ab1fad4ee4c0c7173ddb47c Opus preflight再レビュー依頼。

対象: Issue #474 / PLAN-L7-523
前HEAD ad4e9f2e の残blocking 1件だけを修正。

Delta:

- `parseSealedPackageVersionIdentity`をproduction seamとして公開。
- U-RELVER-004がpackage/package-lock各々の欠落・重複・invalid JSON・missing/non-string versionをproduction seam経由で直接検証。
- `matching.length !== 1` guardを弱化するmutation probeでU-RELVER-004がRedになることを実測し、guardを復元。
- vacuous literal comparisonは削除済み。
- CANDIDATE 007/008は未昇格維持。

Evidence:

- adapter/release identity 52/52 Green
- typecheck Green
- Biome Green
- PLAN lint Green
- GitHub CI run 33170604660 running; Linuxのdraft PLAN fail-closeはpreflight前の意図どおり

要求: exact HEADで旧blockingが閉じ、normative test-design claimがproduction mutationで弁別できるならPASS/blocking 0をcanonical receipt化。PLANはPASS取得後だけconfirmed化し、evidence-only HEADでCI/closing reviewを再取得する。mergeしない。
