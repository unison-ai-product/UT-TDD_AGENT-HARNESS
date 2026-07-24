---
memory_id: memory:project:pr-156-claim-review-flag-remediation
kind: project
title: "PR #156 claim review FLAGとD0-R是正"
tags: ["pr-156", "claim-review", "flag", "resource-kernel", "bundle-trust"]
updated_at: 2026-07-24T15:40:00.000+09:00
---

PR #156 claim reviewの初回FLAGは2件。

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

第三レビューでは、署名payload、activation/floor durability、trusted clock recoveryの実装可能性をFLAG。
`BundleManifestSignedPayload`はbundle/prior sequence、authority/key/algorithm、registry revision、issued/expiryを
必須fieldとしてcanonical digestへ署名する。activationとfloorは別storeへ書かず、TS-owned SQLiteの単一append-only
`BundleActivationLog` recordを正本にする。current/floorは同じcommitted recordから投影し、未commit intentは無視する。
時計はambient `Date.now()`を禁止し、installer registryに束縛した`TrustedClockPort`、boot/monotonic continuity、
永続`ClockAnchor`を用いる。欠測・破損・rollbackはfail-closeし、復旧は許可authorityのsigned re-anchorだけとする。
これらをL4-L9と`U-RGK-TRUST-015..026`、`IT-RGK-PHYS-023..026`へ降下した。
