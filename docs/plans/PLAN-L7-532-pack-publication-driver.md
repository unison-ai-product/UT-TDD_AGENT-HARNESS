---
plan_id: PLAN-L7-532-pack-publication-driver
title: "PLAN-L7-532 (add-impl): Pack canary publication driver (production ports
  + CLI entry) pair-freeze"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-11
updated: 2026-09-11
owner: Claude / Fable (pair-freeze) · Codex worker (implementation)
parent_design: docs/plans/PLAN-L7-519-pack-publication-adapter.md
pair_artifact: docs/test-design/harness/L7-pack-publication-driver-test-design.md
next_pair_freeze: L8
backprop_decision: required
backprop_decision_reason: 本番 port と CLI 入口が PLAN-L7-515 の FSM / CAS / nonce /
  journal 契約と PLAN-L7-519 の adapter 境界を変更していないことを PLAN-REVERSE-532
  で逆向き検証し、実公開の運用手順を PLAN-L6-63 の段階公開契約へ再合流させる。
agent_slots:
  - role: se
    slot_label: Luna worker - 本番 port module (PR-1) と CLI 入口 (PR-2) を別 PR で最小実装する
  - role: qa
    slot_label: Terra - fake process runner だけで CANDIDATE-PACKPUB-005-* の Red oracle を先に作る
  - role: tl
    slot_label: Sol / Claude Opus - argv 固定・approval 束縛・secret 非漏洩・write 0 境界の非著者検収
generates:
  - artifact_path: docs/plans/PLAN-L7-532-pack-publication-driver.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-519-pack-publication-adapter.md
  requires:
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    - docs/plans/PLAN-L7-519-pack-publication-adapter.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-532-pack-publication-driver-backfill.md
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    - docs/plans/PLAN-REVERSE-519-pack-publication-adapter-backfill.md
    - docs/test-design/harness/L7-pack-publication-remote-test-design.md
    - docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md
    - docs/test-design/harness/L7-pack-publication-driver-test-design.md
    - src/setup/pack-publication-adapter.ts
    - src/setup/pack-publication-staging.ts
    - src/cli/distribution.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/565
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/364
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/414
review_evidence: []
status: draft
github_issue_id: 565
admission_receipt:
  schema_version: v2
  receipt_id: certificate:90e28ddae7343065d815328758ff3de0
  command_id: plan-draft:issue-565:forward:1
  admitted_at: 2026-09-11T03:03:28.724Z
  source_digest: sha256:bff8980286c061d7d486438055aebddcb601b9d48272146aee7372b784b53cfe
  decision_digest: sha256:0cb88b927291674dd2b4a44f44182b49a6ce49331e9885a88961a74a3255b267
  receipt_digest: sha256:3228a3d8d31804f0a93d49296b306f52316a9bad1ec4126b50eda8ea63a9c703
  binding:
    path: docs/plans/PLAN-L7-532-pack-publication-driver.md
    plan_id: PLAN-L7-532-pack-publication-driver
    asset_id: plan:90e28ddae7343065d815328758ff3de0
    revision: 1
    content_digest: sha256:bff8980286c061d7d486438055aebddcb601b9d48272146aee7372b784b53cfe
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 565
    episode_id: E4-565-pack-publication-driver
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-531-pack-internal-canary-smoke
    revision: 2
    digest: sha256:69c9c058d2178425bb0459033b2748785d152d7a9c2a37c01aefbca270709d4e
  reentry:
    target_plan_id: PLAN-L7-532-pack-publication-driver
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #565 Pack canary publication driver pair-freeze
    (add-feature, PLAN-L7-519 downstream; unmet publication input of PLAN-L7-531
    rev 2)"
---

# PLAN-L7-532: Pack canary publication driver (production ports + CLI entry)

## 1. 目的と前提

Issue #565 は、`PLAN-L7-519` が実装した port 注入型 publication adapter
(`src/setup/pack-publication-adapter.ts`、FSM `planned → pack_commit → release_draft → assets →
tag → release_visible → canary`) と `PLAN-L7-508` の sealed staging
(`src/setup/pack-publication-staging.ts`) を、実 Pack repository へ `v0.2.0-canary.1` を
human-approved で公開できる 1 本の経路へ結ぶ slice である。新しい publication 方式を判断
せず、`PLAN-L7-515` の正本 FSM、CAS、mutation 単位 nonce、durable journal、
partial / indeterminate 境界を変更しない。

本 PLAN は pair-freeze であり、実装・Green・`v0.2.0-canary.1` の実公開・#418 / #364 の
closure を主張しない。

### 1.1 起票時点の実測 (2026-09-11、main `554aec7b`)

| 観測 | 実測 |
| --- | --- |
| adapter の本番 port | `PackPublicationPorts` (approval / durableState / pack / release / tag / visibility / canary / auditor / reconcile / receipt) の実装は `tests/pack-publication-adapter.test.ts` の in-memory spy だけ。`src/` に production 実装 0 件 |
| staging → intent → publish の配線 | `buildPackPublicationStagingPlan` / `sealPackPublicationIntent` / `publishPackCanary` を呼ぶ CLI・script は 0 件 (`src/cli/distribution.ts` は import していない) |
| 既存 CLI | `ut-tdd distribution release-plan` は v0.1.x 用の legacy 3 asset 経路 (`manifest.json` / `tar.gz` / `.sha256`) の gh コマンドを表示するだけで、`PLAN-L7-515` の exact 2 asset・publication receipt・nonce を生まない |
| Pack repository の release | `v0.1.0`〜`v0.1.4` (legacy 3 asset) のみ。v2 契約の release は 0 件 |
| 非 scope 宣言 | `PLAN-L7-519` §1 / §5 と `PLAN-L7-508` §非 Scope は「実 credential による公開実行」「CLI」を明示的に後続へ残している |
| PO 承認 | 2026-09-11 に PO が `v0.2.0-canary.1` の公開を chat で承認した。ただし `PLAN-L7-515` §2 は mutation 単位の approval receipt / nonce を要求するため、chat 承認は本 PLAN の着手承認であり、各 mutation の approval file を代替しない |

### 1.2 前段の充足

- `PLAN-L7-515` confirmed (PR #466)、`PLAN-L7-519` confirmed (PR #464 pair-freeze + 実装)、
  `PLAN-L7-508` confirmed。
- `PLAN-L7-531` §1.2 / §10-3 は `v0.2.0-canary.1` の公開を PR-2 の前提として置いている。本 PLAN
  はその前提を充足する手段であり、`PLAN-L7-531` の二層契約を変更しない。

## 2. 設計判断: 本番 port と driver の方式

advisor 相談: `ut-tdd advisor --decision implementation --current-model claude-fable-5 --plan PLAN-L7-531 --execute`
(2026-09-11、provider=codex、model=gpt-5.6-sol)。推奨は **A**。前提は §1.1 の repo 実測で
検証した。

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **A (採用)** | `gh` CLI を薄い本番 GitHub port とし、file-backed `ApprovalPort`、append-only durable journal / receipt、process execution port を最小実装する。実 Pack 公開は PR 外の運用ステップ | `gh` の認証・HTTP・再試行を自前で抱えない。process execution を port にすれば CI は fake runner だけで全遷移を検証できる。`gh` の argv 固定・認証主体照合・出力上限を契約で縛る必要がある | 採用 |
| B | GitHub REST を `fetch` で直接叩く port + 同じ approval file | 認証・HTTP・rate limit・API 差異を自前で抱え、最小 PR にならない。credential を process 内で扱う面が増える | 棄却 |
| C | adapter を使わず legacy `release-plan` の gh コマンドを人が実行し、receipt を後付け生成 | 統制経路 (mutation 前 approval、journal、read-back) を迂回し、後付け receipt では実行証跡を保証できない。`PLAN-L7-531` §3.3 の receipt digest 接合が成立しない | 棄却 |

**advisor 推奨からの override (PR 分割)**: advisor は「1 PR に production driver wiring を限定」
と推奨したが、CLAUDE.md §PR スコープ規律 3 (1 PR = 新規 source_module 1 個 + 対テスト +
最小配線。CLI surface は別 PR) に従い、§6 の通り port module (PR-1) と CLI 入口 (PR-2) に
分割する。根拠は規律の明文 (PR #219 の肥大再発防止) であり、advisor の判断内容 (方式 A) は
そのまま採用する。

## 3. 本番 port 契約

### 3.1 process execution port

- `gh` の起動は `spawnSync` 相当の **argv 配列固定** とし、shell 経由・文字列連結・template
  展開を禁止する。process execution は注入 port (`ProcessRunnerPort`) とし、本番実装は
  `gh` のみ、テストは fake runner のみを使う。テストコードが実 `gh` を spawn した場合は Red。
- timeout、stdout / stderr の上限 byte、非 0 exit を typed `unavailable` / `indeterminate` へ
  写像する。mutation 後の timeout / 応答欠落は `indeterminate` (write 済みかもしれない) とし、
  mutation 前の失敗だけを `unavailable` (write 0) とする。成功へ丸めない。
- credential は `gh` の既存認証 (`gh auth`) にのみ委ね、token を env・argv・file で driver に
  渡さない。stdout / journal / receipt / error message に token・approval 本文・nonce の生値を
  出さない (digest だけを記録する)。

### 3.2 GitHub port と FSM mutation の対応

| adapter port | 遷移 | `gh` 呼出 (argv 概形) | read-back |
| --- | --- | --- | --- |
| `pack.observeBefore` | planned | `gh api repos/<repo>/branches/<main>` / `gh api repos/<repo>/contents/<control-manifest>?ref=<main>` | main SHA、control-manifest snapshot digest、canary pointer object digest |
| `pack.commitPublicationBranch` | pack_commit | `gh api` git data (blobs → trees → commits → refs、publication branch のみ) | branch commit SHA |
| `pack.createPullRequest` | pack_commit | `gh api -X POST repos/<repo>/pulls` (base=main、head=publication branch) | PR number |
| `pack.mergePullRequestCas` | pack_commit | main 再観測 (expected main SHA と一致しなければ write 0) → `gh api -X PUT repos/<repo>/pulls/<n>/merge` (`sha` = observed head) | merge 後 main SHA |
| `pack.observeReleaseCommit` | pack_commit | `gh api repos/<repo>/commits/<sha>` + `git/trees/<tree>` | release Pack commit / tree / sidecar digest |
| `release.createDraft` / `observeDraft` | release_draft | `gh api -X POST repos/<repo>/releases` (`draft=true`、`prerelease=true`、`target_commitish`=release Pack commit) / `gh api repos/<repo>/releases/<id>` | release id、draft 状態、identity |
| `release.uploadAsset` / `observeAsset` | assets | uploads endpoint への `gh api --method POST --input <asset>` (exact 2 asset、name/size 指定) / `gh api repos/<repo>/releases/<id>/assets` | name / size / digest (bytes を再取得して再計算) |
| `tag.observe` / `createAnnotatedCas` | planned / tag | `gh api repos/<repo>/git/ref/tags/<tag>` / `gh api -X POST git/tags` + `git/refs` (target = release Pack commit) | tag object と target commit |
| `visibility.makeVisible` / `observe` | release_visible | `gh api -X PATCH repos/<repo>/releases/<id>` (`draft=false`) / `gh api repos/<repo>/releases/<id>` | `draft=false`、identity 一致 |
| `canary.observeBefore` / `appendCas` | canary | before snapshot 再観測 → after control-manifest を第二 publication branch へ commit → PR → CAS merge (§3.2 pack 行と同じ経路) | pointer Pack commit / tree、after snapshot digest |
| `auditor.attest` / `reconcile.observe` | release_visible / 再開 | 上記 read-back の再計算のみ (write 0) | attested / mismatch / unavailable |

対象 repository は `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack` 固定 (`DEFAULT_PACK_REPO`) とし、
実行前に `gh auth status` の認証主体、`gh repo view` の owner/name、expected main SHA、tag 名を
intent と照合する。1 つでも不一致なら最初の remote write より前に typed deny (write 0)。
Pack main への直接 push、force push、tag retarget、既存 asset overwrite の argv は生成しない。

### 3.3 file-backed ApprovalPort

- 置き場: `.ut-tdd/release/approvals/<operationId>/<transition>.<mutation>.json`。1 file = 1
  mutation。内容は `PackPublicationApproval` (transition、mutation、operationId、nonce、approver、
  expiresAt、intentDigest、approvalStateDigest、idempotencyKey) をそのまま JSON にしたもの。
- 発行者は人間 (PO) であり、driver は発行しない。PR-2 の CLI は preflight で「次に必要な
  approval の skeleton」(nonce 以外の束縛値) を表示し、PO が nonce を付けて file を置く。
- `consume` は file の存在確認ではなく、transition / mutation / operationId / intentDigest /
  approvalStateDigest / idempotencyKey / expiresAt を intent と durable state に照合してから、
  原子的 rename (`.json` → `.consumed.json`) と journal `nonce_consumed` の append を行う。
  期限切れ、別 operation、別 intent、別 state、既 consume は `nonce_replay` / `approval_missing`
  で deny する。consume 済み file は `mode: "reconcile"` としてのみ再利用できる。
- `.ut-tdd/release/approvals/` は Git 追跡しない (local runtime artifact)。

### 3.4 durable journal と receipt

- journal: `.ut-tdd/release/publication/<operationId>/journal.jsonl` (append-only、fsync)。
  各 transition の `planned + nonce_consumed` → `mutation_intent` → `read_back_observation` を
  `PLAN-L7-515` §3 の順に永続化する。`digest()` は journal 全行の hash chain。
- receipt: `.ut-tdd/release/publication/<operationId>/receipt.json`。`PackPublicationReceipt` を
  そのまま保存し、`PLAN-L7-531` §3.2 の第 2 層がこの receipt digest と接合する。
- persist failure は例外を成功へ丸めず `indeterminate` とし、後続 write 0。crash / restart 後は
  journal の最後の `read_back_observation` までを reconciliation し、`mutation_intent` に対応する
  observation が無い mutation を成功と推測しない (`PLAN-L7-515` §4.2)。

## 4. CLI 入口 (PR-2)

- `ut-tdd distribution publish-canary --release-id <id> --tag <tag> --staging-dir <dir>`
  を 1 本だけ追加する。既定は **preflight / dry-run** (remote write 0、`gh` は観測系 argv だけ)。
  実行は `--execute` を必須とし、`--execute` 時も approval file が揃わない mutation の直前で
  typed deny (write 0 または partial 保持) する。
- 入力は `PLAN-L7-508` の sealed staging 出力 (tar.gz + `.sha256` + control manifest sidecar) だけ。
  source worktree、directory walk、glob、local Pack checkout、開発 DB、環境変数からの補完を
  行わない (staging module の契約をそのまま通す)。
- 出力: preflight 結果 (intent digest、approval skeleton、expected main SHA、tag)、実行結果
  (`published` / `denied` / `partial_publication` / `indeterminate`、remoteWrites、receipt path)。
  nonce・token・approval 本文は出力しない。
- legacy `release-plan` は本 PLAN で削除しない。v2 経路が main へ到達した後、`PLAN-L6-63` 側で
  退役を扱う (本 PLAN の非 scope)。

## 5. 運用手順 (PR-2 merge 後、PR 外)

1. PO 承認 (2026-09-11 済) を前提に、担当者が `distribution package` 相当の sealed staging を
   `PLAN-L7-508` 経路で生成し、staging receipt を保存する。
2. `publish-canary` を dry-run で実行し、expected main SHA / tag / intent digest と approval
   skeleton を得る。
3. PO が mutation 単位の approval file (§3.3) を発行する。1 mutation = 1 file = 1 nonce。
4. `--execute` で実行する。各 mutation の直前で approval を consume し、直後に read-back を
   journal へ永続化する。`indeterminate` で停止した場合は reconciliation のみを再実行し、
   新規 write を replay しない。
5. receipt (§3.4) を `PLAN-L7-531` PR-2 の第 2 層入力として引き渡す。実公開の記録は #364 側の
   運用記録とし、本 PLAN の完了条件に含めない。

## 6. 順序契約と PR 分割

| PR | 論点 | 前提 |
| --- | --- | --- |
| PR-0 (本 PR) | 本 PLAN + `PLAN-REVERSE-532` + pair test-design の pair-freeze (docs のみ) | なし |
| PR-1 | 本番 port module 1 個 (`src/setup/pack-publication-production-ports.ts`: ProcessRunnerPort、gh port 群、file ApprovalPort、journal / receipt port) + fake runner テスト。CANDIDATE-PACKPUB-005-A..L の Red→Green | PR-0 の非著者 PASS receipt |
| PR-2 | CLI 入口 `distribution publish-canary` の最小配線 + CLI テスト。CANDIDATE-PACKPUB-005-M..O の Red→Green | PR-1 merge |

PR-1 と PR-2 を 1 PR に統合しない。scope 構造を指す FLAG は close→分割再出で応じる。

## 7. TDD / trace / Reverse

pair artifact `docs/test-design/harness/L7-pack-publication-driver-test-design.md` が
`CANDIDATE-PACKPUB-005-A..O` を所有する。実装 PR で同番号の `U-PACKPUB-DRIVER-*` へ 1:1
昇格する。既存 `CANDIDATE-PACKPUB-003-*` (adapter FSM)、`U-PACKPUB-STAGE-*`、
`CANDIDATE-PACKPUB-004` (rollback) を再採番・再所有しない。

R1 では `PLAN-L7-515` §3 の port 順序と §4 の fail-close 契約を本番 port が変えていないことを
照合する。R2 では port ↔ `gh` argv の対応表 (§3.2) と approval file 契約 (§3.3) を同一
implementation revision へ束縛する。R3 では非著者の claim-blind / spec-blind review で、
shell 経由の argv、approval の存在確認だけの consume、write 後の `remoteWrites: 0` 誤報告、
secret の出力混入、fake runner を迂回した実 `gh` 起動を攻撃する。R4 では不足差分だけを
`PLAN-L7-519` / `PLAN-L6-63` へ backfill する。

## 8. 非 Scope

- `PLAN-L7-515` の FSM / CAS / nonce / journal 契約、`PLAN-L7-519` adapter 本体の変更
- rollback automation (`CANDIDATE-PACKPUB-004` / `PLAN-L6-63` supersede-forward)、stable 昇格、
  #481 updater、#364 Product A/B
- GitHub REST / SDK を直接使う port、Bun、CI での実 credential 使用
- legacy `release-plan` の退役 (`PLAN-L6-63` 後続)
- `v0.2.0-canary.1` の実公開そのもの (PR 外の運用ステップ、§5)

## 9. 完了条件

1. fake runner だけで FSM 全遷移が Red→Green、`gh` の argv が配列固定で shell を経由しない
   (`CANDIDATE-PACKPUB-005-A` / `-I`)。
2. 認証主体・repo・expected main SHA・tag の実行前照合が Pack repo 以外へ fail-close (write 0)
   (`-B`)。
3. approval file の欠落・期限切れ・別 operation / intent / state・replay が最初の write より前に
   typed deny、consume は原子的 (`-C` / `-D`)。
4. journal の persist failure と crash 後の未 observation mutation が `indeterminate` かつ
   reconciliation write 0 (`-E` / `-F`)。
5. `gh` 非 0 exit / timeout / 出力上限が typed `unavailable` / `indeterminate` で成功へ丸めない
   (`-G`)。credential・approval 本文・nonce の生値が stdout / journal / receipt / error に 0 件
   (`-H`)。
6. CLI 既定が dry-run で remote write 0、`--execute` 無しの mutation は生成されない (`-M`〜`-O`)。
7. Linux / Windows / aggregate required CI Green、exact-head の非著者 (Claude 族) closing receipt
   blocking 0 を PR-1 / PR-2 の各々に束縛する。
8. 本 PLAN は driver の main 到達までを閉じる。#364 / #418 は open のまま維持する。

## 10. 実装開始条件

1. 本 PLAN と `PLAN-REVERSE-532` の pair-freeze に非著者 PASS receipt と CI Green が揃うこと。
2. production source を PR-1 では `src/setup/pack-publication-production-ports.ts` 1 module に、
   PR-2 では `src/cli/distribution.ts` の最小配線に閉じること。方式変更が必要になったら PR を
   close して本 PLAN の契約改訂へ戻る。
3. 実 Pack repository への write をテスト・CI・レビューのいずれでも行わないこと。
