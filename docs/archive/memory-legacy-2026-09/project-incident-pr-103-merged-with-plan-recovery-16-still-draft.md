---
memory_id: memory:project:incident-pr-103-merged-with-plan-recovery-16-still-draft
kind: project
title: "Incident: PR 103 merged with PLAN-RECOVERY-16 still draft"
tags: ["ci", "incident", "merged-plan-status", "plan-revision", "pr-103"]
updated_at: 2026-07-21T03:16:59.890Z
---

2026-07-21、PR #103 (merge eaf6aa43) はPR CI run 29796108885でLinux/Windows/aggregateがGreenだったが、PLAN-RECOVERY-16-plan-revision-authoringがstatus:draftかつreview_evidence空のままmainへ入った。main run 29796736130ではLinux全回帰のtests/doctor.test.ts U-TESTHYGIENE-028がmerged-plan-status違反を検出し、232 files/2275 tests Greenの後に1 test failure、aggregateもfailureとなった。原因は実装成果のmerge前に正規plan reviseでconfirm/review証跡を発行しなかったこと、およびPR merge refではmerged-plan-statusがmain着地後の状態を先取りできなかったこと。復旧は専用branchでrevision 4を正規発行し、PR #103 cross-review PASSとCI run 29796108885を束縛する。再発防止としてmerge authorizationは対象PLAN confirmed + review_evidence + tracked receiptをexact headで確認し、PR CIだけでなくpost-merge detectorをmerge前相当条件で評価する。
