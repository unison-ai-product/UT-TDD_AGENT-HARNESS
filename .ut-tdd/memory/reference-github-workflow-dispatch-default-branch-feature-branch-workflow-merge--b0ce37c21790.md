---
memory_id: memory:reference:github-workflow-dispatch-default-branch-feature-branch-workflow-merge--b0ce37c21790
kind: reference
title: "GitHub workflow_dispatchはdefault branch必須: feature branch限定の新規workflowはmerge前に結合試験できない"
tags: ["ci-design", "github-actions", "workflow-dispatch"]
updated_at: 2026-09-16T11:16:06.893Z
---

GitHubのworkflow_dispatchはdefault branchに存在するworkflowしか起動できない。feature branchへpushしただけの新規workflowを--refで叩くとHTTP 404 workflow not found on the default branch になる。影響として、新規workflowを伴うPRは「実GitHub結合試験をmerge前に取る」ことが構造的に不可能であり、live実測はmerge直後に回して結果をPLAN等へ追記する順序になる。この制約を知らずに「live検証込みでgreen」をmerge前の完了条件に置くと、永久に満たせない条件になる。回避のためにpush/pull_requestトリガーを足すのは、triggerを絞ることでPR由来入力の実行経路を消す設計(attestation workflow等)を壊すので採らない。
