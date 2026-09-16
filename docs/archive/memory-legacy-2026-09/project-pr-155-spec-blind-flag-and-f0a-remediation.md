---
memory_id: memory:project:pr-155-spec-blind-flag-and-f0a-remediation
kind: project
title: "PR #155 spec-blind FLAGとF0a是正"
tags: ["pr-155", "spec-blind", "flag", "node", "toolchain", "f0a"]
updated_at: 2026-07-24T12:43:00.000+09:00
---

PR #155 artifact `b1a5c350` + `81e78692` のspec-blind reviewはFLAG。

- `engines`宣言だけではNode/npm custodyをfail-closeできない。
- `.node-version`、`engines.node`、npm package managerの片側driftを検出するoracleが無い。
- npm lock root graph、Bun transition direct parity、Node candidate / Bun legacy debtのauthorityが機械拘束されていない。

F0aでは`toolchain-pin`を拡張し、exact Node/npm/esbuild、integrity-qualified `packageManager`、
lockfile v3/root graph、`bun.lock` direct parity、`node_candidate` policyを一つの短いpolicy objectへ束縛する。
片側drift、lock mutation、Bun parity drift、authority ambiguityのnegative oracleを必須とする。

実npm executableのabsolute path/version/digest receiptはF0b責務であり、F0aではruntime custody Greenを
主張しない。F0bは環境自己申告を証拠にせず、実体を測定・封印する。
