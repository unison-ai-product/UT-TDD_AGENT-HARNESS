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
本書が束縛する3入力の実在 source revision は `git-sha1:4bf577433cc209576636609280b236149d4bdb1f` であり、
同 revision の `.node-version`、`package-lock.json`、`package.json` の tracked blob と raw-byte digest をregistryで検証する。
本書の更新対象 pin は Node.js v24.22.1 / 同梱 npm 11.19.1 とする。公式 archive filename/SHA-256 は
Node.js v24.22.1 の archive index と `SHASUMS256.txt` に照合済みである。archive SHA と、照合済み archive 内の
Node/npm CLI member SHA は別の digest として記録する。registry の pinned values と
Git custody は L5 `internal-processing.md` §7 の更新順序に従い、対応する source/package/.node-version
変更後に実在する Git object から記録する。registry の更新・来歴確認と非著者レビューが完了するまでは
本書を draft のまま維持する。registry は `linux-x64` と `windows-x64`
だけを supported 候補とし、非著者レビュー完了までは `pair_frozen_pending_review`
とする。macOS (`darwin-*`) は `unsupported_os` として明示する。
公式ページに archive があることだけから macOS の対応を推論してはならない。

`package.json` の `engines` の authority は `node` と `npm` に限定し、その値は範囲であって
registry の exact identity custody の対象ではない（`internal-processing.md` §Node toolchain
authority、Issue #1255 / PR #1260 項目 6）。registry が束縛するのは審査済みの 1 点
（Node/npm の version と archive digest、`.node-version`、lock、`packageManager`）である。
`engines.bun` は PLAN-L7-488 §2.3 で削除済みであり、registry には収録せず、Node toolchain の
support/activation authority でもない。Bun の削除や runtime 切替はこの pair の scope 外である。

## 1. 固定する入力

| 入力 | 固定内容 |
|---|---|
| Node/npm | Node `24.22.1`、同梱 npm `11.19.1` |
| package manager | `package.json.packageManager` の exact string（`engines` は範囲であり、この exact identity には含めない。範囲と pin の整合は §3 の engines 範囲 oracle と §5 が扱う） |
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
| `CAND-NODEPROV-004` | Node/npm version、packageManager、`.node-version` を 1 要素変更（`engines` は含まない） | registry/toolchain/実測値の exact identity 不一致で拒否 |
| `CAND-NODEPROV-005` | lockfileVersion、root name/version、lock content SHA-256 を 1 要素変更 | `package-lock.json` の raw bytes と全 lock identity の一致を要求し拒否 |
| `CAND-NODEPROV-006` | `darwin-x64` または `darwin-arm64` を supported に移す、または unsupported row を削除 | typed `unsupported_os` のまま拒否し、macOS を supported と報告しない |
| `CAND-NODEPROV-007` | 未登録 OS/arch、Linux/Windows ARM64、または archive index のみ存在する新 row を注入 | closed platform union に無い入力は `unsupported_platform` / `unreviewed_architecture` で拒否 |
| `CAND-NODEPROV-008` | source revision、tracked source blob OID、source content SHA-256 のいずれかを変更 | Git objectからの再計算不一致を `provenance_unavailable` とし、working-tree補完 0 |
| `CAND-NODEPROV-009` | canonical digest の excluded field、encoding、registry digest を変更 | RFC 8785 JCS preimageの再計算不一致を拒否。自己参照を含めて恒真化しない |
| `CAND-NODEPROV-010` | registry 自身の tracked blobをreceiptが束縛するlanding commit上の別bytesへ差替え、または未追跡fixtureだけを更新 | `consumer_receipt.subject_revision` の tracked blob OID/content SHA-256 と receipt anchor の不一致を拒否。fixtureをtrust rootにしない |
| `CAND-NODEPROV-011` | `npm_config_user_agent`、PATH上の別npm、同じversion文字列の別CLIを正規値として注入 | 実 executable/version/file digest と registry row の exact一致を要求し拒否 |
| `CAND-NODEPROV-012` | `package.json` の `engines.node` / `engines.npm` を、(a) 審査済みの pin を含まない範囲、(b) pin を含む別の範囲、のいずれかへ変更 | (a) は pin が範囲の外へ出る不整合として拒否。(b) は exact identity 不一致として扱わず、registry の exact identity 検証に影響させない（registry は審査済みの 1 点を束縛し範囲は束縛しない）。拒否の判定は §5 の toolchain-pin oracle と同じ「範囲が pin を含むか」であり、registry 側に別の範囲判定を足さない |

`CAND-NODEBOOT-006` は `CAND-NODEPROV-003/004/011` を、
`CAND-NODEBOOT-009` は `CAND-NODEPROV-003/011` を直接参照する。候補番号を
正式 `U-*` へ昇格するのは、後続実装がこの pair を実測して Red を記録した後で
あり、本 freeze は Green や runtime 実装済みを主張しない。

## 4. 変更境界

本 pair-freeze が許可する変更は registry、本文仕様、候補 mutation oracle の
整合だけである。`src/runtime/node-bootstrap.ts`、Node generation producer、
runtime verifier、Bun 経路、CI workflow、consumer package、既存 build script
は変更しない。

## 5. toolchain-pin lint の engines 範囲 oracle（Issue #1255 / PR #1260）

契約は `docs/design/harness/L5-detailed-design/internal-processing.md` の
§Node toolchain authority。`analyzeToolchainPin` の `node-version-mismatch` /
`npm-version-mismatch` は `engines` の脚を外し、`engines` には「有効な semver 範囲であり、
審査済みの pin を含む」ことだけを要求する。候補であり、正式 `U-*` への昇格は後続実装が
Red を記録した後に行う。pin は `.node-version` の版（Node）と `packageManager` の版
（npm）とし、`NODE_TOOLCHAIN_POLICY` の版との完全一致は従来どおり残す。

| ID | Red mutation | Green oracle |
|---|---|---|
| `CANDIDATE-U-TOOLPIN-001` | `.node-version` を `NODE_TOOLCHAIN_POLICY.nodeVersion` と異なる版へ変更 | `node-version-mismatch` を報告する（従来どおり） |
| `CANDIDATE-U-TOOLPIN-002` | `engines.node` を pin を含む範囲（例: pin が `24.22.1` のとき `>=24.22.1 <25`）にする | `node-version-mismatch` を報告しない（従来は完全一致でないため不一致だった） |
| `CANDIDATE-U-TOOLPIN-003` | `engines.node` を pin を含まない有効な範囲（例: `>=24.23.0 <25`、`<24`）にする | `node-version-mismatch` を報告する |
| `CANDIDATE-U-TOOLPIN-004` | `engines.node` を有効な semver 範囲でない文字列（例: `latest`、空文字、`24.x.y.z`）にする | `node-version-mismatch` を報告する。例外で落ちず finding として返る |
| `CANDIDATE-U-TOOLPIN-005` | `packageManager` の npm 版を `NODE_TOOLCHAIN_POLICY.npmVersion` と異なる版へ変更 | `npm-version-mismatch` を報告する（従来どおり） |
| `CANDIDATE-U-TOOLPIN-006` | `engines.npm` を pin（`packageManager` の npm 版）を含む範囲（例: `>=11.19.1 <12`）にする | `npm-version-mismatch` を報告しない |
| `CANDIDATE-U-TOOLPIN-007` | `engines.npm` を pin を含まない有効な範囲（例: `>=11.20.0 <12`）、または有効な semver 範囲でない文字列にする | `npm-version-mismatch` を報告する |
| `CANDIDATE-U-TOOLPIN-008` | `packageManager` を integrity 欠落（`npm@<版>`）または同版で別 digest にする | `npm-package-manager-integrity-missing` / `npm-package-manager-integrity-mismatch` を従来どおり報告する。本変更で `npm-package-manager-*` rule は変わらない |
