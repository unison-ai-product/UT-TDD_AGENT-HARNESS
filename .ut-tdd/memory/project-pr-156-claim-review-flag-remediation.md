---
memory_id: memory:project:pr-156-claim-review-flag-remediation
kind: project
title: "PR #156 claim review FLAG 2件とD0-R是正"
tags: ["pr-156", "claim-review", "flag", "resource-kernel", "bundle-trust"]
updated_at: 2026-07-24T12:52:00.000+09:00
---

PR #156 claim reviewのFLAGは2件。

1. signed bundleが署名照合だけで、trust root取得元、authority-key binding、rotation/revocation/expiry、
   algorithm downgrade拒否、monotonic anti-rollbackを閉じていなかった。
2. D0-Rがglobal Bun ban/cutover completionを所有し、D0-Nとの責任境界が重複していた。

是正ではinstaller組込authority registryと`TrustStorePort`、trusted clock、revocation epoch、
algorithm allowlist、durable bundle sequence floorをL4 security、L4-L9 pairへ追加する。
global Bun cutoverはPR #154 D0-Nをprerequisite正本とし、D0-Rはnative companion/bundle/Cargo差分が
Bun依存を増やさない局所不変条件だけを所有する。これは要件縮小ではなく責任境界の一意化である。

第二レビューでは識別子整合3件をFLAG。L8 trust oracleの重複`015..018`を`019..022`へ再採番し、
L5 freeze rangeを`001..022`へ更新する。L6 `authorizeBundle`が要求する`U-RGK-TRUST-011..014`を
L7へ具体化し、PLAN-L7-454の存在しない`U-RGK-PROTO-*`参照を実在する`U-RGK-WIRE-*`へ統一する。
