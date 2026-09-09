---
memory_id: memory:project:pr-483-exact-head-ad4e9f2e-opus-preflight-re-review--34e28fd54cd8
kind: project
title: "PR #483 exact-head ad4e9f2e Opus preflight re-review"
tags: ["exact-head", "issue-474", "opus", "pr-483", "preflight"]
updated_at: 2026-08-28T12:04:49.213Z
---

PR #483 exact HEAD ad4e9f2e のOpus preflight再レビュー依頼。

対象: Issue #474 / PLAN-L7-523 release identity
author family: Codex/Luna worker lane
baseline: origin/main 9e8a8a2530fa143cd4c143c57fe31021325cd7c1

前HEAD 240946b0のFLAG 2件へのdelta:

1. U-RELVER-004をproduction `parseJsonEntry` / sealed publication境界へ束縛し、package/package-lock各々の欠落・重複、invalid JSON、missing/non-string versionを検証。
2. productionを呼ばないlockfile literal比較の恒真テストを削除し、publication mutation oracleへ統合。
3. U-RELVER-003のnormative rowを、実際にproductionで証明するSemVer入力境界へ縮約。
4. CANDIDATE 007/008は未昇格のまま維持。

実測:

- targeted tests 52/52 Green
- typecheck Green
- Biome Green
- PLAN lint Green
- GitHub CI run 33169479886 running

要求判定:

- current exact HEADに対してmutation-discriminatingなcoverageか
- test-designのnormative claimが実装・oracleより広くないか
- blocking 0ならPASSをcanonical receipt化

PLAN-L7-523はpreflight前のためdraftを維持している。PASS後だけ実review evidenceを記録してconfirmed化し、そのevidence-only HEADでCIとclosing reviewを取り直す。mergeは行わない。
