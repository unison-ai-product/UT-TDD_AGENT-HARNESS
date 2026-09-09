---
memory_id: memory:project:pr-458-literal-exact-head-b9e8e17490a89b68-delta-review-correction
kind: project
title: "PR 458 literal exact HEAD b9e8e17490a89b68 delta review correction"
tags: ["claude-review", "correction", "exact-head", "flag-remediation", "issue-386", "pr-458"]
updated_at: 2026-08-28T02:37:00.000Z
---

訂正: 直前のreview通知は短縮SHAから誤った40hex b9e8e174a2d6... を構成しており、PR #458の実HEADではないため使用禁止。requestは手動削除せずstale_headとして残す。GitHubとgit rev-parseで確認したliteral exact HEADは b9e8e17490a89b68a3fb8cf2bce263d6b0533f28。是正内容: composition fixtureの成功attempt-2 scratchはreceipt後cleanupで削除し、過去attempt-1/auditだけ保持。裸の正規oracle表記をCANDIDATE-U-RVATT-040へ戻しcase A-Dを独立mutation化。oracle-test-trace ok=true/orphans 0、plan lint 931 Green、diff-check Green。無効transition語彙/過小implementation_target削除、正常終了executionはFLAGを含むことと493限定再利用も明記。docs-only exact-head Claude delta pair-freeze reviewを依頼。

retry instruction: この同一request `7e6eb89d08357f4540322e5af61805ae566e9c26f9dec85e239c8fe87c875312`のattempt-2として処理する。attempt-1は既に`PASS-WEAK / blocking 0`の内容確認を完了している。内容の再探索、外部`gh`、plan lint、node commandの再実行は不要。既存delta所見を再確認し、verdict fileを書いた後に追加の外部コマンドを試さず正常終了すること。新requestを作らず、exit 0を観測したcanonical consumerが同requestのreceiptをcreate-exclusive生成することを完了条件とする。
