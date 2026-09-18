---
plan_id: PLAN-L7-628-pack-consumer-runtime-release-install
title: "PLAN-L7-628 (add-impl): Pack Release から consumer runtime を有効化する producer
  / installer"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-18
updated: 2026-09-18
owner: Claude / Opus (pair-freeze) · Codex worker (implementation)
parent_design: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-runtime-release-install-test-design.md
next_pair_freeze: L7
backprop_decision: required
backprop_decision_reason: Release asset だけから consumer-local runtime を有効化する経路の実測
  (asset 集合、 consumer 側 identity 導出、自己 digest 照合) を PLAN-REVERSE-628 で
  PLAN-L6-101 の source 非依存受入と PLAN-L7-516 §11.1 の未所有境界へ逆向きに戻す。
agent_slots:
  - role: se
    slot_label: Luna worker - PR-1 producer と PR-2 installer を別 PR で最小実装する
  - role: qa
    slot_label: Terra - CANDIDATE-U-PACKRT-001..010 の Red oracle を Linux/Windows で先に作る
  - role: tl
    slot_label: Claude Opus / Sol - asset 集合・identity 導出・自己 digest 照合の非著者検収
generates:
  - artifact_path: docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
  requires:
    - docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
    - docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
    - docs/plans/PLAN-L7-486-release-materializer-pf2.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-628-pack-consumer-runtime-release-install-backfill.md
    - docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/test-design/harness/L7-pack-consumer-runtime-release-install-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/420
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/364
review_evidence: []
status: draft
github_issue_id: 418
admission_receipt:
  schema_version: v2
  receipt_id: certificate:cd11a1885b1c948d89519002a2cec009
  command_id: plan-draft:issue-418:consumer-runtime-release-install:forward:1
  admitted_at: 2026-09-18T10:05:41.692Z
  source_digest: sha256:809820cd7134414d31ebdd0decccae02ececc8c32fdd645606f1385c8a83b09c
  decision_digest: sha256:99250283c31442ea80527c591f7c0e3be3a9287ced94b872376524b243123773
  receipt_digest: sha256:6ff54c22c274330ee17de30fb7e04190d67af142ef8f0ce5ce78aaa57decfcee
  binding:
    path: docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
    plan_id: PLAN-L7-628-pack-consumer-runtime-release-install
    asset_id: plan:cd11a1885b1c948d89519002a2cec009
    revision: 1
    content_digest: sha256:809820cd7134414d31ebdd0decccae02ececc8c32fdd645606f1385c8a83b09c
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 418
    episode_id: E4-418-pack-consumer-runtime-release-install
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
    revision: 4
    digest: sha256:6e4e0d5516e78e7465d260c65482e3302c9304518eb264d39735d049c166a316
  reentry:
    target_plan_id: PLAN-L7-628-pack-consumer-runtime-release-install
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #418 release gate: Release asset から consumer runtime
    を有効化する producer / installer の pair-freeze (PLAN-L7-516 §11.1 の未所有境界)"
---

# PLAN-L7-628: Pack Release から consumer runtime を有効化する producer / installer

## 1. 目的と位置付け

PO 判断 (2026-09-18) により、release の定義を「GitHub Release に tar.gz が存在する」から
**「clean な第三者プロジェクトが、その Release だけから setup して Claude / Codex で開発を開始できる」**
へ変更した。#418 は release gate に昇格し、使える最初の版を `v0.2.0-canary.2` とする。

2026-09-18 の実測で、公開済み `v0.2.0-canary.1` はこの定義を満たさないことを確認した。

- consumer launcher `.ut-tdd/bin/ut-tdd.mjs` (`src/setup/consumer-node-runtime.ts` `renderConsumerNodeWrapper`)
  は `.ut-tdd/runtime/activation/active.json` だけを解決源とし、無ければ exit 78 `consumer_runtime_absent`。
- 使い捨て consumer で `setup --solo` を実行すると、生成 `.codex/hooks.json` の PreToolUse
  (`apply_patch|write_file` → work-guard) が `blockOnFailure=true` のため Codex のファイル編集が全て block される。
  Claude は exit 2 以外を非ブロッキングとするので編集は通るが、guard は機能しない。
- `active.json` を書く入口は既に存在する: `ut-tdd setup --consumer-runtime-input <json>` (`src/cli.ts` 4138 行付近) が
  `admitReleaseAggregate` → `admitConsumerLocalRuntime` → `installConsumerNodeRuntimeOnFilesystem`
  (`PLAN-L7-516`、atomic rename CAS) を通る。consumer 側の admission は JSON 内の `final_tree` と attestation だけで
  完結し、git を必要としない (`src/cli.ts` 4245-4262 行付近で `attestChannel: async () => attestation` を注入)。
- 欠けているのは、その入力を **Release に載せる producer** と、**Release の asset だけから入力を組む installer** である。
  `PLAN-L7-516` §11.1 は「Pack へ compiled ESM と receipt を供給する入口は別の既存 publication / materializer 責務」と
  書くが、その責務を所有する PLAN は存在しない。本 PLAN がその空白を所有する。

本 PLAN は pair-freeze であり、実装・Green・canary.2 公開・#418 の closure を主張しない。

### 1.1 閉じた先行試行との関係

PR #642 (PLAN-L7-531 rev 6/7 の reslice) は、Codex Sol r4 の FLAG「`PLAN-L7-508` の sealed tarball は
offline setup に必要な依存 (`node_modules`) を供給せず、Green 経路が契約上存在しない」により close された。
本 PLAN はこの穴を `PLAN-L7-508` の tarball へ依存を詰める形では塞がない。依存を bundle 済みの compiled ESM
(`scripts/build-node.mjs` の esbuild 単一 ESM、`PLAN-L6-93` の Node generation) として別 asset で供給し、
`PLAN-L7-508` の clean source tarball の契約は変更しない。

## 2. 設計判断

advisor: `ut-tdd advisor --decision design --current-model claude-opus-5 --plan PLAN-L7-531-pack-internal-canary-smoke --execute`
(2026-09-18、provider=claude、model=claude-fable-5)。推奨は案 A (条件付き survive)。advisor の前提 (d) 反証
「consumer 側 admission は既に git 非依存」を `src/cli.ts` の実装で確認し、案 A の実装面積を producer 1 本 +
installer 1 本に縮めた。

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **A (採用)** | source 側の `distribution package` が consumer runtime 用の封印済み asset を Release に同梱する。consumer 側は asset の sha256 を検証し、既存の admission / install 経路へ渡す | producer は source repo の git と reviewed Node を使えるので、既存の PF5 aggregate・attestation・Node generation を再利用できる。consumer 側に新しい admission engine を作らない | 採用 |
| B | consumer 側で Pack tarball を展開し、その場で build-node 相当を実行して compiled ESM を作る | esbuild の版・platform 差で compiled ESM の bytes が producer と一致する保証がなく、digest 照合の信頼根が壊れる。consumer に esbuild と `npm ci` を持ち込む | 棄却 |
| C | Pack checkout (git clone) を前提にし、source と同じ git reader を consumer で使う | 「Release だけから」の定義に反する | 棄却 |

所有の判断: producer / installer は production source の変更を伴い、`PLAN-L7-531` は §8・§10.4 で
production source の変更を非 scope にしている。`PLAN-L7-516` は §8 で #418 を非 scope にしている。
よって `PLAN-L7-516` の後続 slice として本 PLAN を新設し、`PLAN-L7-531` は本 PLAN の成果を E2E で観測する側に留める
(531 の入力契約改訂は本 PLAN の freeze 後に別 PR で行う)。

## 3. Release asset 契約

canary.2 以降の Pack Release は、次の **宣言された asset 集合と exact に一致** する。欠落・余剰・名前違いは
installer と `PLAN-L7-531` 第 2 層の両方で deny する。`<tag>` は Release tag の exact 文字列。

| asset | 内容 | 用途 |
| --- | --- | --- |
| `<tag>.tar.gz` | `PLAN-L7-508` の clean source tarball (変更なし) | Pack の出所・監査 |
| `<tag>.tar.gz.sha256` | 上記の sha256 (既存形式) | 同上 |
| `<tag>.ut-tdd.mjs` | Node generation の compiled ESM (単一ファイル、依存 bundle 済み) | consumer での初回起動 (installer) |
| `<tag>.consumer-runtime.json` | §4 の封印済み runtime 入力 | installer の入力 |
| `<tag>.consumer.sha256` | `<tag>.ut-tdd.mjs` と `<tag>.consumer-runtime.json` の sha256 (`sha256sum` 形式、この 2 行だけ) | installer の完全性検証 |

canary.1 で添付した `manifest.json` (`distribution package` の出力) は **Release asset にしない**。実測で
`tarball` / `checksum` に producer 端末の絶対パス (`C:\dev\...`) を含み、#418 AC「source 側 absolute path 参照 0」に反する。

## 4. `consumer-runtime.json` schema v1

consumer 固有の値 (`consumer_root`、`runtime_root`、`operation_id`、`attempt`) を **含めない**。これらは consumer の
絶対パスに依存し、producer は前もって計算できないため、installer が consumer 側で導出する (§6)。

| field | 内容 |
| --- | --- |
| `schema_version` | exact `"ut-tdd.consumer-runtime.v1"` |
| `release` | `tag`、`source_revision` (40 桁)、`materializer_version` |
| `generation` | `generation_id`、`subject_revision`、`artifact_digest`、`compiled_esm_digest`、`node_bootstrap_receipt_base64` |
| `admission_input` | 既存 `--consumer-runtime-input` の `admission_input` と同形 (`aggregate_input.final_tree`、`attestation`、`control_manifest_base64`) |

- compiled ESM の bytes は JSON に埋め込まず、`<tag>.ut-tdd.mjs` asset を唯一の実体とする。
  `generation.compiled_esm_digest` と receipt の `compiled_cli.sha256` と asset bytes の sha256 が一致しなければ deny。
- JSON は既存の canonical JSON / digest 関数で serialize し、unknown / missing field を拒否する。
- どの field にも producer 端末の絶対パス、ユーザー名、環境変数値を含めない。receipt 内の `node.path` / `npm.cli_path`
  等の producer 側 path は、§5 の producer が相対化または除去した上で封印する (後述 CANDIDATE-U-PACKRT-003)。

## 5. producer 契約 (source 側、PR-1)

`ut-tdd distribution package --tag <tag>` を拡張し、§3 の 5 asset を出力する。

1. 入力は tag が指す source revision だけ。作業ツリーの未 commit 変更・untracked ファイルを入力にしない。
2. compiled ESM と receipt は既存の `buildNodeGeneration({ candidateRevision })` (`src/runtime/node-bootstrap.ts`) で生成する。
   Node の版は `scripts/build-node.mjs` と同じ reviewed version を要求し、不一致は fail-close。
3. `admission_input` は既存の PF5 aggregate と `attestReleaseChannel` (`src/setup/release-channel-adapter.ts`) を再利用して作る。
   新しい aggregate / attestation engine を作らない。
4. 出力前に、§6 の installer と同じ検証関数で自己検証する (producer と installer が別々の検証を持たない)。
5. 失敗時は部分出力を残さない (一時ディレクトリで組み、全 asset が揃った場合だけ出力先へ移す)。

## 6. installer 契約 (consumer 側、PR-2)

consumer は Release の asset をダウンロードしたディレクトリ (`<release-dir>`) を用意し、consumer root で次を 1 回実行する。

```sh
node <release-dir>/<tag>.ut-tdd.mjs setup --solo --consumer-runtime-release <release-dir>
```

1. `<tag>.consumer.sha256` で `<tag>.ut-tdd.mjs` と `<tag>.consumer-runtime.json` を検証する。
2. **自己 digest 照合**: 実行中のモジュール自身 (`import.meta.url` の実ファイル) の sha256 が `generation.compiled_esm_digest` と
   一致しなければ deny する。改変された installer が正規の runtime を名乗って install することを防ぐ。
3. identity を consumer 側で導出する: `consumer_root` / `runtime_root` は consumer root の canonical path、`operation_id` は
   release tag と generation から決定的に導出、`attempt` は 1 から開始。残りの field は `consumer-runtime.json` と receipt から取る。
   導出規則は `PLAN-L7-516` §2.1 の tuple をそのまま満たし、新しい identity authority を作らない。
4. 既存の `admitReleaseAggregate` → `admitConsumerLocalRuntime` → `installConsumerNodeRuntimeOnFilesystem` をそのまま呼ぶ。
   既存 `--consumer-runtime-input` との違いは入力の組み立てだけであり、admission / install の意味論を変えない。
5. **冪等性**: 同じ release を再実行した場合、active pointer が同一 bundle を指していれば新 write 0 で成功 (committed) とする。
   別 release への切替 (update / rollback) は #364 の担当であり、本 PLAN では typed deny `consumer_runtime_update_unsupported`。
6. 失敗時は consumer root 外 write 0、partial install を成功扱いしない (`PLAN-L7-516` §4 の原子契約を再利用)。
7. install 成功後、生成された launcher 経由で `doctor --setup-smoke` が通ること、および Claude / Codex の guard hook が
   正常系を通し禁止系を block することは `PLAN-L7-531` の E2E が観測する (本 PLAN は unit / integration まで)。

## 7. PR 分割と順序

| PR | 論点 | 前提 |
| --- | --- | --- |
| PR-0 (本 PR) | 本 PLAN + `PLAN-REVERSE-628` + pair test-design の pair-freeze (docs のみ) | なし |
| PR-1 | producer: `distribution package` の 5 asset 出力、schema v1、producer 側 path 除去、自己検証 | PR-0 の非著者 PASS |
| PR-2 | installer: `setup --consumer-runtime-release`、sha256 検証、自己 digest 照合、identity 導出、冪等性 | PR-1 merge (asset 形式が確定していること) |
| (531) | E2E: `PLAN-L7-531` の入力契約を本 PLAN の asset 集合へ改訂し、clean fixture の Windows / Linux E2E を実装 | PR-2 merge |

PR-1 と PR-2 を 1 PR に統合しない。scope 構造を指す FLAG は close → 分割再出で応じる。

## 8. TDD / trace / Reverse

pair artifact の候補 oracle (`CANDIDATE-U-PACKRT-001..010`) は test-design が所有する。実装 PR で同番号の
`U-PACKRT-*` へ 1:1 昇格する。既存 `CANDIDATE-U-PACKNODE-*`、`CANDIDATE-PACKISO-*`、`U-PACKISO-*`、
`CANDIDATE-ST-PACKCANARY-*` を再採番・再所有しない。

R1 では `PLAN-L6-101` の source 非依存受入と `PLAN-L7-516` §2.1 の identity tuple を照合する。R2 では asset 集合・
schema・identity 導出を同一 implementation revision へ束縛する。R3 では非著者の review で、改変 installer、asset の
差し替え、producer 端末パスの混入、同一 release 再実行での二重 install を攻撃する。R4 では不足差分だけを
`PLAN-L6-101` へ backfill し、`PLAN-L7-516` / `L7-496` / `L7-508` を重複所有しない。

## 9. 非 Scope

- 別 release への update / rollback、異 version 共存、stable 昇格 (#364)
- publication 自動化 (#565 / #605 / #626 / #627)。canary.2 の公開は手作業 (`gh release create`) で行ってよい
- clean fixture の E2E と guard の実動確認 (`PLAN-L7-531`)
- `PLAN-L7-508` の clean source tarball の内容変更、`PLAN-L6-93` の Node generation schema の変更
- Bun 互換 fallback (`PLAN-L7-522` / `L7-527`)

## 10. 完了条件

1. PR-1: `distribution package` が §3 の 5 asset を出力し、`consumer-runtime.json` が schema v1 を満たし、どの asset にも
   producer 端末の絶対パスが無い (`CANDIDATE-U-PACKRT-001..004` Green)。
2. PR-2: Release の asset だけを置いたディレクトリと空の consumer root から `setup --consumer-runtime-release` が
   `active.json` を生成し、launcher が exit 0 で起動する。改変 asset・改変 installer・余剰 / 欠落 asset を deny し、
   同じ release の再実行は新 write 0 (`CANDIDATE-U-PACKRT-005..010` Green)。
3. Linux / Windows / aggregate CI Green、成果物を書いていない族の canonical non-author closing receipt を同一 exact revision へ束縛。

## 11. 実装開始条件

1. 本 PLAN と `PLAN-REVERSE-628` の pair-freeze に非著者 PASS receipt と CI Green が揃うこと。
2. PR-1 / PR-2 の実装中に方式変更 (asset 集合、schema、identity 導出規則) が必要になったら、PR を close して本 PLAN の
   契約改訂へ戻る。
