---
plan_id: PLAN-L6-88-snapshot-runner-performance-redesign
title: "PLAN-L6-88 (redesign): snapshot runner 性能基盤 — immutable prepared cache /
  run-local COW / heavy-I/O scheduler"
kind: add-design
layer: L6
drive: agent
route_signal: design_correction
route_mode: redesign
created: 2026-07-17
updated: 2026-07-23
owner: PO / TL
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: TL - cache/COW/scheduler を一体とした性能・安全境界の freeze
  - role: se
    slot_label: SE - cross-OS filesystem capability と atomic cache lifecycle の設計
  - role: qa
    slot_label: QA - NormalizedRunDigest 同値性、cold/warm benchmark、故障注入 oracle
generates:
  - artifact_path: docs/plans/PLAN-L6-88-snapshot-runner-performance-redesign.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md
    - docs/plans/PLAN-L7-186-test-lane-granularity.md
    - docs/plans/PLAN-L7-421-test-hygiene-live-tree-fence.md
    - docs/plans/PLAN-RECOVERY-11-snapshot-fence-foreign-activity.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 98
supersedes:
  - PLAN-L4-31-nfr-verification-foundation-architecture
admission_receipt:
  schema_version: v2
  receipt_id: certificate:e50999e6a1f6b27678560111d5ccfe3a
  command_id: redesign:issue-98:l4-31-l6-88:revision-2:replacement
  admitted_at: 2026-07-23T05:00:00.000Z
  source_digest: sha256:42ea26f3a2888682fe33bd6caf9ecbfda2cff52fb392a718f0658565685ac88e
  decision_digest: sha256:58cfc85bb7f419f744cd3bf7b918dfb88fdfe7bd4aea08b874508c4771c5832a
  receipt_digest: sha256:e8e9d47b01baea6b99016f4a7860b17e4ed658135133e26ae6108040e64319d7
  binding:
    path: docs/plans/PLAN-L6-88-snapshot-runner-performance-redesign.md
    plan_id: PLAN-L6-88-snapshot-runner-performance-redesign
    asset_id: plan:legacy:48d2e91e9b04be86041dc414fb64e026f3672a21dc6e41c2982f7505f111965c
    revision: 2
    content_digest: sha256:42ea26f3a2888682fe33bd6caf9ecbfda2cff52fb392a718f0658565685ac88e
  route:
    signal: design_correction
    mode: redesign
  issue:
    provider: github
    issue_id: 98
    episode_id: genesis:issue-98:l6-88
    projection_digest: sha256:4ed591f7090abcbe2b67a9ba21d9f7f08e2f0351b33012d1b839fcfcbc72456b
  origin:
    plan_id: PLAN-L4-31-nfr-verification-foundation-architecture
    revision: 1
    digest: sha256:31338ff31c925b41f6482ed4c9823f922f77ba662086d184fe8a1eca31cbd621
  transition:
    direction: design_to_implementation
    implementation_disposition: discarded
    implementation_target:
      target_plan_id: PLAN-L7-459-snapshot-runner-performance-redesign
      target_revision: 1
  reentry:
    target_plan_id: PLAN-L4-31-nfr-verification-foundation-architecture
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #98 snapshot runner performance architecture requires
    redesign before implementation"
  supersedes:
    - PLAN-L4-31-nfr-verification-foundation-architecture
---

# PLAN-L6-88: snapshot runner 性能基盤 Redesign

## 1. 起点と遷移方向

Issue #98 の実測では、targeted test が短時間でも、毎回の execution/reference capture、
`npm ci`、DB 全 rebuild、再帰 seal、約 9,500 files の前後 fingerprint、
cleanup が固定費として支配する。PID・時刻を key として終了時に削除する現行 cache は warm reuse を
一切提供せず、複数 runner は I/O 飽和を起こした。

本 PLAN は既存実装から設計を追従させる Reverse ではない。先に L6 を差し替え、L7 pair freeze 後に
新設実装 PLAN へ降下する **設計→Forward 合流→実装** の Redesign である。`supersedes` は
PLAN-L4-31 revision 1 の runner resource budget方式をrevision 2へ差し替える。PLAN-L7-421 の
captured OID、execution/reference 分離、seal/fingerprint、runtime input 限定、batch-only、
全 cleanup という安全契約は廃棄せず、本 PLAN の不変条件として再収容する。Forward freeze 前に既存
runnerを直接高速化しない。合流後の L7 実装 PLAN `PLAN-L7-459-snapshot-runner-performance-redesign` は Admission receipt 発行時に #98、
本 PLAN revision、`design_to_implementation`、`implementation_disposition=discarded` とともに束縛する。

## 2. 他 PLAN との責務分離

| 資産 | この Redesign に取り込む境界 | 取り込まない境界 |
|---|---|---|
| PLAN-L4-31 §2.8 / IMP-175 | runner resource budget、singleton/queue を全 runtime 共通 scheduler の上位制約とする | NFR profile 全般、G8-G14 evidence、adapter catalog は同 PLAN が所有する |
| PLAN-L7-186 | lane と selected test list を benchmark/cache receipt の入力とする | fast/DB/CLI/full の lane 定義や full CI gate は変更しない |
| PLAN-L7-421 | snapshot safety oracle と provenance を完全保持し、毎回 cold 準備する性能方式だけを差し替える | repository-read detector、persistent DB cleanup、vitest config の責務は移さない |
| PLAN-RECOVERY-11 | foreign activity classification を origin fence receipt に接続する | hybrid 偽陽性の帰責ロジック自体は Recovery が所有し、本 PLAN の性能成功で close しない |

Slice A の phase receipt と lifecycle token は Recovery 入口であり、#98 を close しない。immutable cache、
run-local COW、scheduler、cross-OS benchmark、安全同値性まで一つの L6 freeze とする。

## 3. 全体契約

### 3.1 Phase receipt

各 run は source resolve / execution capture / reference capture / install / DB rebuild / runtime input / diff /
seal / pre-fingerprint / vitest / post-fingerprint / unseal / cleanup / token wait の wall time、CPU、peak RSS、
disk read/write bytes、visited files、cache outcome を記録する。receipt は commit/OID、OS、platform/arch、
filesystem/OneDrive 状態、CPU/RAM/disk、Node/npm toolchain、lockfile、lane/test list、DB schema/rebuild policy、runner・Vitest・
global setup digest に束縛する。測定不能値は `null` と availability reason を持ち、0 に偽装しない。
receipt 生成失敗は性能証拠を invalid にするが、元の test failure を上書きしない。primary failure と
cleanup failure は順序を保った aggregate result とする。install は `npm ci`、runner・DB rebuild・Vitest は
事前compile済み ESM entrypointをabsolute Node executableで起動し、PATH依存またはBunへのfallbackはfail-closeする。

### 3.2 Immutable prepared cache

cache key v1 は schema version、Git tree/OID、platform/arch、Node/npm toolchain digest、lock/package digest、runner・Vitest・
global setup digest、DB schema/migration/rebuild policy digest を完全に含む。欠落・unknown component は hit に
せず miss とする。builder は一意な staging directory へ構築し、manifest と全 fingerprint を検証してから
atomic rename で `ready` を publish する。`building`、partial、改ざん、wrong-platform、stale DB は利用せず、
quarantine/miss と receipt に理由を残す。capacity、LRU generation、eviction、crash recovery は active lease を
尊重し、利用中 generation を削除しない。

cache は source of truth ではなく再構築可能な派生物であり、secret、session env、provider transcript、Git
credential、source `.ut-tdd` を保存しない。symlink/junction の target escape、unexpected reparse point、ACL
継承逸脱を publish 前に拒否する。

### 3.3 Run-local COW

prepared cache 本体を execution/reference として直接実行・seal・更新してはならない。各 run は互いに独立した
execution と reference を run-local COW として生成する。hardlink は cache inode を破壊し得るため禁止する。
Linux reflink、Windows block clone/ReFS、APFS clone 等は capability probe と破壊隔離 probe が Green の場合
だけ使用し、未対応・OneDrive placeholder・cross-volume・ACL不整合では現行 cold independent copy へ fallback
する。fallback は成功扱いを隠さず receipt に方式と理由を記録し、安全 oracle を省略しない。

### 3.4 Heavy-I/O scheduler

scheduler namespace は同一 machine 上の Claude/Codex/CI helper、全 worktree、nested process で共通とする。
bootstrap/install/DB rebuild/fingerprint/cleanup は heavy-I/O token を要求し、初期 capacity は 1 とする。
FIFO ticket、飢餓防止、cancel、deadline、owner PID/start identity、generation、heartbeat、disk/memory/time budget を
持つ。live owner は TTL だけで回収せず、dead PID と start identity/generation の一致を証明した場合だけ回収する。
競合時は exit 2 と owner/queue receipt を返し、retry storm を起こさない。nested runner は reentrant bypass を
許さず、注入可能 orchestrator または専用 child-process harness で token ownership を一箇所にする。

### 3.5 Shard/pool

OS/filesystem ごとの immutable cache と COW が成立した後だけ、単一 invocation 内の Vitest shard/pool を別段階で
評価する。複数 snapshot process は使用しない。baseline 比 disk bytes が 1.3 倍以下かつ wall time 改善を反復
測定で証明できない構成は解禁しない。安全 oracle、DB namespace、failure identity が shard 間で独立しない場合も
fail-close する。

## 4. Cross-OS 性能・安全 matrix

最低 matrix は Linux native、Windows native NTFS、Windows OneDrive 配下を lane×cold/warm で測る。
可能な filesystem accelerator は環境ごとに capability として扱い、Windows Green を Linux の代理、または
OneDrive 外 NTFS Green を OneDrive の代理にしない。各 cell は同一 machine condition で warm-up 後に paired
反復し、sample 数、除外規則、p50/p95、phase 内訳、disk bytes、cleanup retry/timeout を保存する。単発最良値、
異なる HEAD、異なる test list の比較は禁止する。

性能 AC は baseline `B(lane, OS, filesystem)` を先に freeze し、warm targeted total ≤ min(B の 50%, cold
同 case の 35%)、cold targeted は B 比 25%以上短縮、warm full は B 比 20%以上短縮、targeted 準備固定費比率
≤50%、cache miss は現 runner 比 10%超退行なし、p95 ≤ median×1.5、cleanup retry/timeout 0 とする。

## 5. 安全同値性と採択 gate

旧 runner と候補 runner を同一 captured OID/test list で走らせ、`NormalizedRunDigest`（OID、selected tests、
exit、passed/failed/skipped、failure IDs、DB digest、reference digest、全 safety oracle outcomes）が完全一致した
場合だけ候補を採択する。cache key 各 component の一軸変異は必ず miss、partial publish・manifest改ざん・
wrong-platform・stale DB・OID mismatch・live/reference write は必ず fail-close する。non-Git Pack の除外境界、
runtime input policy、session/secret env 遮断も旧契約と同一である。

## 6. TDD 降下と受入条件

L7 pair artifact は先に candidate oracle を固定し、実装は次の独立 slice で降下する。`CAND-SNAPSHOT-PERF-*`
は設計候補であり、trace coverage、review evidence、受入判定へ算入しない。`PLAN-L7-459` で対応する実行可能な
Red test を追加し、その test path と一対一に束縛した同一 commit でのみ正式な `U-SNAPSHOT-PERF-*` へ昇格する。
未実装 candidate を形式的に U ID 化して pair freeze を偽装してはならない。

1. receipt schema/phase clock と全 lifecycle token（故障注入、競合、dead owner、nested process）。
2. key builder、atomic publisher、manifest verifier、quarantine/eviction。
3. filesystem capability port と run-local COW/cold fallback。
4. legacy/candidate differential runner と cross-OS benchmark harness。
5. 条件を満たした場合だけ single-invocation shard/pool。

- [ ] L6 の cache/COW/scheduler/receipt/digest 契約と L7 Red oracle が pair freeze される。
- [ ] #98 の cold/warm cross-OS matrix と全性能 AC が反復 evidence で Green になる。
- [ ] `NormalizedRunDigest` 完全一致と key mutation/fault injection が Green になる。
- [ ] PLAN-L4-31、L7-186、L7-421、RECOVERY-11 の所有境界を越えて close しない。
- [ ] Admission receipt が #98、supersedes、Forward reentry、L7 implementation target を束縛する。
- [ ] plan lint、readability、targeted unit、Linux/Windows aggregate CI が Green になる。
