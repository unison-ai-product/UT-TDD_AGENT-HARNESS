---
title: "L7 Node toolchain provenance pair-freeze"
plan: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
pair_kind: unit-test-design
executed_at_layer: L7
status: draft
---

# L7 Node toolchain provenance pair-freeze

本書は Issue #499 の独立した pair-freeze である。対象は F0b が読む
`NODE-TOOLCHAIN-PROVENANCE-REGISTRY-v1` の閉じた入力データと、後続実装が
そのデータを弱めないための mutation oracle だけである。Node generation、runtime
verifier、Bun の削除、CI、consumer の変更は本書の成果物ではない。

正本データは
`docs/design/harness/L5-detailed-design/node-toolchain-provenance-registry-v1.json`。
公式 archive filename/SHA-256 は Node.js v24.13.0 の archive index と
`SHASUMS256.txt` からレビューした。registry は `linux-x64` と `windows-x64`
だけを supported 候補とし、非著者レビュー完了までは `pair_frozen_pending_review`
とする。macOS (`darwin-*`) は `unsupported_os` として明示する。
公式ページに archive があることだけから macOS の対応を推論してはならない。

`package.json` の engines identity custody は `node` と `npm` に限定する。`engines.bun` は
PLAN-L7-488 §2.3 で削除済みであり、registry には収録せず、Node toolchain の
support/activation authority でもない。Bun の削除や runtime 切替はこの pair の scope 外である。

## 1. 固定する入力

| 入力 | 固定内容 |
|---|---|
| Node/npm | Node `24.13.0`、同梱 npm `11.6.2` |
| package manager | `package.json.packageManager` の exact string と engines (`node` / `npm`) |
| lock identity | `package-lock.json`、lockfileVersion `3`、name/version、content SHA-256 |
| archive | supported OS/arch ごとの公式 filename と SHA-256 |
| archive members | archive root 相対の Node executable と npm CLI path、各 file SHA-256 |
| unsupported boundary | `darwin-x64` / `darwin-arm64` は typed `unsupported_os`; Linux/Windows ARM64 は `unreviewed_architecture` |
| custody | source revision、tracked source の Git blob OID/content SHA-256、registry 自身の outer blob verification |

archive member path は tar/zip の内部 path であり、展開先、PATH、環境変数、
`npm_config_user_agent`、version string から導出してはならない。npm CLI の
相対 path と file digest は OS ごとに別値として扱う。

## 2. Canonical digest と Git blob custody

`registry_sha256` は、registry JSON の `canonical_digest.registry_sha256` を
除外した object を RFC 8785 JCS で canonicalize し、UTF-8 (BOM なし) を
SHA-256 化した値である。JSON の key 順、Markdown の表示順、filesystem の
列挙順を digest の入力にしない。

tracked source は宣言した `source_revision` の Git object から読み、各 path の
blob OID と raw bytes の content SHA-256 を両方検証する。index、working tree、
remote の現在値で補完しない。registry 自身の blob は自己参照であるため
registry digest の preimage から除外し、consumer receipt の `subject_revision`
（registry landing commit）と `registry_blob.blob_oid` / `registry_blob.content_sha256`
をouter custody anchorとして検証する。いずれかの blob、digest、revision、canonical digest が欠けるか
不一致なら `provenance_unavailable` とし、generation 前に fail-close する。

## 3. Mutation oracle

| ID | Red mutation | Green oracle |
|---|---|---|
| `CAND-NODEPROV-001` | supported row の archive filename または archive SHA-256 を 1 要素変更 | official archive の exact tuple 不一致を typed `provenance_mismatch` とし、generation/receipt write 0 |
| `CAND-NODEPROV-002` | archive 内 Node/npm relative path を absolute、`..`、別 OS root、または別 path へ変更 | archive-root containment と exact relative path の両方を検証し拒否 |
| `CAND-NODEPROV-003` | archive 内 Node executable または npm CLI の file SHA-256 を変更 | archive bytesから再計算した file digest 不一致で拒否 |
| `CAND-NODEPROV-004` | Node/npm version、packageManager、engines の node/npm を 1 要素変更 | registry/toolchain/実測値の exact identity 不一致で拒否 |
| `CAND-NODEPROV-005` | lockfileVersion、root name/version、lock content SHA-256 を 1 要素変更 | `package-lock.json` の raw bytes と全 lock identity の一致を要求し拒否 |
| `CAND-NODEPROV-006` | `darwin-x64` または `darwin-arm64` を supported に移す、または unsupported row を削除 | typed `unsupported_os` のまま拒否し、macOS を supported と報告しない |
| `CAND-NODEPROV-007` | 未登録 OS/arch、Linux/Windows ARM64、または archive index のみ存在する新 row を注入 | closed platform union に無い入力は `unsupported_platform` / `unreviewed_architecture` で拒否 |
| `CAND-NODEPROV-008` | source revision、tracked source blob OID、source content SHA-256 のいずれかを変更 | Git objectからの再計算不一致を `provenance_unavailable` とし、working-tree補完 0 |
| `CAND-NODEPROV-009` | canonical digest の excluded field、encoding、registry digest を変更 | RFC 8785 JCS preimageの再計算不一致を拒否。自己参照を含めて恒真化しない |
| `CAND-NODEPROV-010` | registry 自身の tracked blobをreceiptが束縛するlanding commit上の別bytesへ差替え、または未追跡fixtureだけを更新 | `consumer_receipt.subject_revision` の tracked blob OID/content SHA-256 と receipt anchor の不一致を拒否。fixtureをtrust rootにしない |
| `CAND-NODEPROV-011` | `npm_config_user_agent`、PATH上の別npm、同じversion文字列の別CLIを正規値として注入 | 実 executable/version/file digest と registry row の exact一致を要求し拒否 |

`CAND-NODEBOOT-006` は `CAND-NODEPROV-003/004/011` を、
`CAND-NODEBOOT-009` は `CAND-NODEPROV-003/011` を直接参照する。候補番号を
正式 `U-*` へ昇格するのは、後続実装がこの pair を実測して Red を記録した後で
あり、本 freeze は Green や runtime 実装済みを主張しない。

## 4. 変更境界

本 pair-freeze が許可する変更は registry、本文仕様、候補 mutation oracle の
整合だけである。`src/runtime/node-bootstrap.ts`、Node generation producer、
runtime verifier、Bun 経路、CI workflow、consumer package、既存 build script
は変更しない。
