---
memory_id: memory:user:forward-escape-github-issue-drive-model-origin-plan-escape-re-entry--62ece56af813
kind: user
title: "Forward escapeのGitHub Issue起票はdrive_model選択を必須とし、origin PLAN/escape理由/re-entry方針を束縛する"
tags: ["drive-model", "forward-escape", "github-issue"]
updated_at: 2026-09-16T11:16:17.569Z
---

Forward escape(通常のForward経路を外れる作業)に対してGitHub Issueを起票する場合、明示的なdrive_model選択を必須とする。起票契約はorigin PLAN Asset/revision/L/Forward state、escape理由、re-entry方針も束縛する。未知または不整合なdrive_model(Issue/PLANのkindやbranch kindと矛盾する)はfail-closeとする。選択したdrive modelがPLANテンプレート、V-pair義務、schedule branch、workflow、必須CI profileを決定する。選択と人によるoverrideは証跡として残し、drive model/L/原因別のescape件数が上流Forwardの前提・設計判断の改善材料になるようにする。
