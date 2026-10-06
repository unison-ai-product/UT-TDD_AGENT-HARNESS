---
plan_id: PLAN-L6-711-merge-time-receipt-rechain-contract
title: "PLAN-L6-711 (add-design): merge 時の自動 re-chain と簿記差分での再検免除の契約 freeze"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-28
updated: 2026-10-05
owner: Claude control lane (契約起草) / Codex (S2・S3 実装) / 非著者 frontier reviewer
parent_design: docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: 既存の plan admission receipt と exact-head merge 規律の運用手順を
  L6 で具体化する契約であり、 L0-L3 要件の意味を変えない (再検免除の例外は PO 承認 2026-09-28 を §2.5 に記録)。
agent_slots:
  - role: tl
    slot_label: TL - whitelist 検証器が review 免除の信頼境界になることを前提に、fail-close 条件を freeze する
  - role: se
    slot_label: SE - pr merge wrapper の自動 re-chain 手順と PLAN 差分の再適用規則を定義する
  - role: qa
    slot_label: QA - 簿記差分の正系と、非簿記差分・件数不一致・chain 不連続・祖先不一致の反証可能な oracle を定義する
generates:
  - artifact_path: docs/plans/PLAN-L6-711-merge-time-receipt-rechain-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md
  requires:
    - docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md
  blocks: []
  references:
    - docs/governance/plan-admission-receipts.json
    - src/cli/plan-revise.ts
    - src/cli/plan-draft.ts
    - src/cli/pr-merge.ts
    - src/feedback/review-dispatch.ts
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/711
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 711
admission_receipt:
  schema_version: v2
  receipt_id: certificate:cf30abd72a39ba5f8e3ac8c0690d9f1a
  command_id: plan-revise:issue-711:legacy-bootstrap-judgement:rechain-1:c1:r6:2241d42e49c5
  admitted_at: 2026-10-06T01:28:30.063Z
  source_digest: sha256:ccd27f750c9b636b10636f112df009a7210559bb5911a318b5df6b358cfcdba0
  decision_digest: sha256:b60f7d4c57af22e41779e7f7430a353452258e1577a73ec7db94017e48e8db99
  receipt_digest: sha256:c570cd48fdd2ce4ab4b694efd0de1ee79b1d1dd394051ae95abd4fc92c6f9300
  binding:
    path: docs/plans/PLAN-L6-711-merge-time-receipt-rechain-contract.md
    plan_id: PLAN-L6-711-merge-time-receipt-rechain-contract
    asset_id: plan:ac2c23d3c72fc6e2886491ac1df09452
    revision: 6
    content_digest: sha256:ccd27f750c9b636b10636f112df009a7210559bb5911a318b5df6b358cfcdba0
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 711
    episode_id: E4-711-merge-time-receipt-rechain
    projection_state: unprojected
  origin:
    plan_id: PLAN-RECOVERY-16-plan-revision-authoring
    revision: 7
    digest: sha256:1b6aa397ad9995b717907d3247e02b3bba3d6c4508874b7654f90fd29b388927
  reentry:
    target_plan_id: PLAN-L6-711-merge-time-receipt-rechain-contract
    target_revision: 6
    phase: forward_merge
  escape_reason: "Issue 711: PR #839 Sol FLAG (上流契約 gap) の是正。§2.3-6 の legacy
    bootstrap 除外の判定根拠を、harness.db の provenance ではなく tracked receipt の
    binding.asset_id prefix plan:legacy: と binding.revision === 2 (H 側と R 側の両方)
    に凍結する。legacy 経路を包含する安全側の判定で、record 単位の除外とし revision 3 以上は再導出する。U-RECHAIN-019
    を追加し、RechainInput は変えない"
---

# PLAN-L6-711: merge 時の自動 re-chain と簿記差分での再検免除の契約 freeze

## 0. 目的と位置付け

`docs/governance/plan-admission-receipts.json` は全 PLAN 共通の hash chain 1 本である (`sequence` / `previous_record_digest`、origin/main `e5fb5722` 時点で seq 323)。
PLAN を改訂・起票する PR は、自 PR 内で `plan revise` / `plan draft` により record を append し、CI の `plan admission-check --base origin/main --head HEAD` が
main の tail への chain を検査する。そのため、1 本 merge されるたびに、receipt を持つ他の open PR はすべて次の周回をやり直す。

1. origin/main の取り込みと、`plan revise` による re-chain (新しい head)。
2. 新しい head での required CI (Linux 約 12 分 / Windows 約 20 分)。
3. 新しい head での非著者 closing review (exact-HEAD 束縛。旧 head の receipt は流用しない)。

実測 (根拠コマンドは §5):

- 2026-09-28 の 1 日で、#685 は 1 回、#686 は 2 回、この周回をやり直した。#708 は #686 の上に stack した。
- 2026-09-14 以降、receipt ファイルに触れた commit は 90 件で、merge された PR 58 本を上回る。
- 直近 60 record は 20 PLAN に分散しており、同一 PLAN 内 (PLAN-L7-676 が 10 件) と PLAN 間の両方で衝突している。
- re-chain commit の実差分は、receipt への 1 record の追加と、PLAN の `generates` 末尾・§8 注記末尾・frontmatter `admission_receipt` 欄に限られる
  (例: `b8bdf6d8` は 2 files、+31/-11)。衝突の原因は、main と PR の双方が `generates` 末尾と §8 注記末尾という同じ位置へ追記することである。

本 PLAN は、上の 1 と 3 を machine-verified な簿記差分に限って自動化・免除する契約を freeze する。2 (CI の再走) は免除しない。

## 1. 設計判断

advisor (`claude-fable-5`、`--decision design`、2026-09-28) の adversarial 判定を経て採択した。PO は 2026-09-28 に「機械検証で免除」を承認した。

| 案 | 内容 | 判定 |
| --- | --- | --- |
| **A (採択)** | `ut-tdd pr merge` が merge の直前に自動で re-chain し、review 済み head → re-chain head の差分を fail-close の whitelist 検証器で確認できたときだけ closing review を引き継ぐ | 同一 PLAN の衝突と PLAN 間の衝突の両方に効き、pre-merge の fail-close と既存の receipt schema を保つ |
| B | chain を PLAN 単位に分割する | 同一 PLAN 内は直列のまま残る。schema v2 と既存 323 record の移行コストがかかる |
| C | PR は seq を持たない intent だけを持ち、merge 後に集約する | tail 束縛を捨てるため、衝突の検出が merge 後へ回る。集約 PR の review で直列化が一段下に再発する |

advisor の反論のうち、次は契約へ取り込んだ。

- chain は `IntegrityOnlyTrustBoundary` (issuer authenticity は検証しない) であり、改ざん耐性は比較軸にしない。
- 「差分は 1 record だけ」は誤りである。re-chain は `admission_receipt` 欄全体と `binding.revision` と `content_digest` を動かす。
  whitelist は §2 のとおり構造で定義する。
- **検証器そのものが review 免除を決める信頼境界になる**。そのため本契約を pair-freeze で先に凍結し、cross-review してから実装する。
  想定外の差分は常に通常の再検へ fail-close する。
- 別レーン (author と別の checkout / `.ut-tdd`) から headless に `plan revise` を実行できることを、S0 で確認する。
  既存の実績: #685 の re-chain は Codex の worktree、#704 / #706 の revise は Claude の worktree で、fresh な ledger と
  frontmatter 由来の base digest で成功している。S0 は、merge を担う control lane の checkout から実行できることを確かめる。

## 2. 凍結契約

### 2.1 自動 re-chain (`ut-tdd pr merge`)

1. 前提: PR の review 済み exact head `H` は、現行どおり merge_ready である。すなわち `H` に非著者 PASS receipt (blocking 0) があり、`H` の required CI が green である。
2. `H` の receipt 末尾が origin/main の tail に chain していない場合に限り、wrapper は re-chain head `R` を作る。
   - (a) PR branch に origin/main を通常の merge で取り込む。history は書き換えない。force / rebase / reset は使わない。
   - (b) `docs/governance/plan-admission-receipts.json` と、PR が改訂した PLAN ファイルは main 側を採る。
   - (c) PR の PLAN 差分を §2.2 の規則で main 側へ再適用する。
   - (d) PR が `H` で append していた record と同じ数・同じ対象について、正規の `plan revise` / `plan draft` で再発行する。
     `command_id` には `:rechain-<n>` suffix を付ける。
   - (e) commit subject は `chore(plan): re-chain after main <short-sha>` (Conventional)。path は明示して stage する。
3. (a) で receipt と PLAN 以外の path に衝突が出たら、wrapper は re-chain を中止し、`rechain_conflict` で止める。人手の re-chain と通常の再検へ戻す。

### 2.2 PLAN 差分の再適用規則

PLAN ファイルの本文と frontmatter から `admission_receipt` ブロックを除いたものを `strip(·)` と書く。
`M` = 現在の origin/main、`mb` = `merge-base(H, M)` とする (rev 3 で訂正。git の merge 自体が使う base と同じであり、§2.6 の `base` と一致する)。

1. **append-only 領域**は 2 つだけとする。
   - frontmatter `generates` の要素列。
   - `## 8.` 節の番号付き注記。
   PR の追加分は、`strip(H) − strip(mb)` のうちこの 2 領域への末尾追加だけで決まる。再適用では、`M` の要素列の後ろに、PR の追加分を元の順序で連結する。
   §8 の番号は、`M` の最終番号から採番し直す。重複した `artifact_path` があれば fail-close する。
2. それ以外の領域の差分は、`strip(mb)` / `strip(H)` / `strip(M)` の 3-way merge が**衝突なしで成立する場合だけ**適用する。衝突すれば fail-close する。
3. 再適用後の `strip(R)` は、上の 1 と 2 の決定的な結果と byte 一致しなければならない。

### 2.3 whitelist 検証器 (review 引き継ぎの唯一の条件)

`verifyRechainDelta(H, R, M)` は pure function とし、次の全てを満たす場合だけ `pass` を返す。1 つでも外れれば `fail` と理由を返す (fail-close)。

1. **PLAN と receipt 以外の path**: `R` の tree は、`H` と `M` の git 3-way merge の結果と一致する。すなわち main から来た変更がそのまま入り、PR 側の変更は `H` のまま。
   手で加えた変更が 1 byte でもあれば `fail`。
2. **PLAN ファイル**: `strip(R)` が §2.2 の決定的な結果と一致する。`admission_receipt` ブロックは 3 で検証する。
3. **receipt**: `R` の `records` は、`M` の `records` を先頭にそのまま含み、その後ろに `H` が append していた record 数と同じ数だけ record を持つ。
   - 追加の各 record は、`H` 側の対応する record と同じ `binding.plan_id` / `binding.path` / `binding.asset_id` を持つ。
   - `binding.revision` は `M` 上の同 PLAN の最新 revision + 1 から連番になる。
   - `binding.content_digest` は `R` の PLAN の正規 digest と一致する (同一 asset に再発行 record が 2 件以上ある場合は最後の record。それより前の record は §2.3-6 の中間 blob の digest と一致する、receipt revision 4)。
   - `previous_record_digest` は chain として連続する。
   - PLAN frontmatter の `admission_receipt` は、その record と一致する。
4. **commit 構造 (rev 5 で訂正)**: `H..R` の rev-list は `M` 側の commit も数えるため、件数では判定しない。親を直接束縛する。
   - `R` は親を 1 つだけ持つ re-chain commit で、その親 `X` は親を 2 つ持つ merge commit である。
   - `X` の first parent は `H`、second parent は `M` である (`git rev-parse X^1 X^2`)。
   - したがって `git rev-list --first-parent --count H..R` は 2 である。`M` 側に何本 commit があっても、この判定は変わらない。
   - `X` の tree は 1 の 3-way merge 結果と一致し、PR 側の変更は `R` だけにある (PR 側に余分な commit を挟めない)。
5. **成果物所有 (rev 3)**: PR が append-only 領域 `generates` に追加した各 `artifact_path` は、`M` の tree に存在せず、`M` のどの PLAN の `generates` にも
   宣言されていない。つまり、待機中に main 側で新規作成・他 PLAN 所有化された path を、PR が再所有していない。違反すれば `fail`
   (`duplicate-artifact-ownership` / `merged-plan-status` と同じ判定を `M` に対して行う)。
6. **admission の意味の不変 (rev 3、rev 4 で入力束縛を補強)**: 再発行した各 record と、PLAN frontmatter の `admission_receipt` は、正規の assembler
   (`plan-revision-command-assembler` / `tracked-receipt-renderer` と同じ関数) で再導出した結果と完全一致する。
   - **H 側入力の束縛 (rev 4)**: tracked record と frontmatter は admission 入力の一部 (`branch` など) を投影しないので、verifier は H 側入力を
     それらから読み取らない。wrapper は H 側の `PlanAdmissionRequest` 全体 (`routeMode` / `kind` / `layer` / `workflowPhase` / `routeSignal` /
     `drive` / `branch` / `status` / `subDoc` / `issue` / `origin` / `transitionDirection` / `implementationDisposition` / `reentry`
     (`targetPlanId` / `targetRevision` / `phase`) / `implementationTarget` / `escapeReason` / `supersedes`) を候補 `A_H` として verifier へ渡す。
     verifier は `digest(A_H)` が `H` 側の同じ record の tracked `decision_digest` と一致する場合だけ `A_H` を採用する。一致しなければ `fail`
     とする (候補を復元できない場合も同じで、通常の再検へ戻る)。decision_digest は admission 全体の hash (`tracked-receipt-renderer`) なので、
     この照合で全フィールドが H に束縛される。
   - **R 側の期待値**: 期待する admission `A_R` は、`A_H` の `reentry.targetRevision` だけを新しい revision に置き換えたもの (自己再合流の場合) とする。
     それ以外のフィールドは `A_H` と完全一致しなければならない。verifier は `digest(A_R)` が R の record と frontmatter の `decision_digest` と
     一致することを照合する。さらに、frontmatter の `admission_receipt` に投影されるフィールド (`tracked-receipt-renderer` の
     `receiptFrontmatter` が出力する route / issue / origin / transition / reentry / escape_reason / supersedes の全て) は、`A_R` からの投影と
     一致させる。投影されない入力 (`workflowPhase` / `drive` / `branch` / `kind` / `layer` / `status` / `subDoc` など) は frontmatter と照合せず、
     `decision_digest` による `A_H` / `A_R` の束縛だけで検証する (rev 6)。
   - admission 以外で変えてよいのは次の項目だけとする:
     - base 束縛 (`asset_id` 以外の revision、revision_digest、source_commit、source_blob_oid、source_content_digest、projection_tail_digest) を `M` に合わせる。
     - `command_id` に `:rechain-<n>` suffix を付ける。`admitted_at` / `recorded_at` を更新する。
     - 上の入力から決定的に導かれる digest (source_digest、content_digest、decision_digest、receipt_digest、record_digest、receipt_id)。
   verifier はこれらの digest を自分で計算し直して照合する。record 内の値を信用しない。`reentry.targetRevision` 以外の admission フィールドが
   1 つでも `A_H` と異なれば `fail`。
   - **`receipt_digest` の preimage の源 (2026-10-05 改訂)**: `receipt_digest` は ledger の certificate digest であり、
     `derivePlanRevisionDigests` (`src/plan-asset/ledger/plan-revision-ledger.ts`) が `AppendPlanRevisionInput` から計算する。verifier は
     同じ関数で R の各 record の `receipt_digest` を再導出し、R が持つ値と照合する。preimage の各フィールドは、次の既に束縛された源からだけ組む。
     adapter が自由に供給する preimage フィールドは置かない。同一 asset の 2 件目以降の再発行に要る中間 PLAN blob だけは §2.6 の `intermediatePlans` で受け取り、各 record の `content_digest` で内容を束縛する (receipt revision 4)。
     | フィールド | 源 |
     |---|---|
     | `commandId` / `certificateId` | R の tracked record の `command_id` (H 側の値 + 許容 suffix `:rechain-<n>`) と、その `command_id` からの正規導出 |
     | `assetId` / `planId` / `sourcePath` | H 側 tracked record の `binding` (R と一致すること) |
     | `baseRevision` | 同 asset の 1 件目の再発行 record: `M` の tracked receipt における同 asset の最新 record の `binding.revision`。k 件目 (k ≥ 2): 直前 (k − 1 件目) の再発行 record の `binding.revision` (= `M` 側の値 + k − 1。ledger は `revision = baseRevision + 1` で append するので、§2.3-3 の連番と一致する) |
     | `basePayloadDigest` | 1 件目: `M` の PLAN blob から正規の canonical payload 導出 (`plan-ledger-rehydrator` と同じ関数)。k 件目 (k ≥ 2): 直前の再発行 record の PLAN blob (最後でない record なので §2.6 の中間 blob) から同じ関数で導いた canonical payload digest (ledger の append は `basePayloadDigest` が直前 revision の `canonical_payload_digest` と一致することを要求する) |
     | `canonicalPayloadJson` / `bodyDigest` / `contentDigest` | 各 record 自身の PLAN blob から正規 assembler で導出。同一 asset の最後の再発行 record は R の PLAN blob、それより前の record は §2.6 の中間 blob |
     | `sourceCommit` | `commits.M` (base 束縛を `M` に合わせる許容項目と同じ値) |
     | `reason` / `routeTupleDigest` | `A_R` から導出 (`escapeReason ?? route:<routeSignal>` / `sha(stableJson(admission))`) |
     | `occurredAt` | R の frontmatter `admission_receipt.admitted_at` |
     | `actor` | 契約定数 `ut-tdd-pr-merge-rechain`。re-chain の再発行は wrapper (`ut-tdd pr merge`) が行い、actor は record にも frontmatter にも投影されないため、定数に固定して決定的にする。wrapper (S3 以降) はこの定数で append する |
     いずれかの源が得られない場合は `fail` とし通常の再検へ戻す。
     - **legacy bootstrap 除外 (receipt revision 6)**: legacy bootstrap 経路の record は preimage が別である (`BootstrapLegacyPlanRevisionInput` の base 側入力と
       `bootstrapDigest`、`src/plan-admission/node-plan-revision-runner.ts:291-323`)。そのため本規則では再導出せず `fail` (理由: `legacy_bootstrap_unsupported`) とする。
       verifier は harness.db を読まないので、`revisionUsesLegacyBootstrap` (DB の `legacy_plan_bootstrap_provenance` と `append_command_receipts` の join) は呼ばない。
       §2.6 の入力も増やさない。判定は §2.6 で既に渡している tracked receipt の値だけで行う。
       - 判定: §2.3-3 で対応付けた H 側の追加 record `h` と R 側の再発行 record `r` の組ごとに、`h.binding.asset_id` が `plan:legacy:` で始まり、
         かつ `h.binding.revision === 2` または `r.binding.revision === 2` のとき `fail` とする (`r.binding.asset_id` は §2.3-3 で `h` と一致する)。
       - 判定に使わないもの: `command_id` の形式 (prefix / suffix)、H / R の frontmatter、M に同 asset の record があるかどうか
         (M 側の record の有無は `baseRevision` の源の有無として別に判定する)。
       - 理由の集約: legacy 判定は §2.3 の他の条件 (preimage の源の有無を含む) と独立に評価し、他の条件の失敗で短絡しない。判定が成立した組が 1 つでもあれば、
         他の理由が併存していても `reasons` に `legacy_bootstrap_unsupported` を必ず含める。M に同 asset の record が無い実運用の形では、源の欠落の理由と併存する。
       - 除外範囲: record 単位とする。同じ `plan:legacy:` asset でも revision 3 以上の record は common 経路 (`AppendPlanRevisionInput`) で発行されるので、
         他の record と同じく上の表で再導出し、全条件を満たせば `pass` とする。asset 単位では除外しない。
       - 健全性 (包含の論証): 正規の writer が legacy 経路で発行した record は、必ずこの判定に当たる。(i) legacy 経路では assembler が
         `asset_id === legacyAssetId(...)` (`plan:legacy:` prefix) を要求する (`src/plan-admission/plan-revision-command-assembler.ts:102-106,215-223`)。
         (ii) bootstrap ledger は `baseRevision !== 1` を拒否し、revision 2 だけを作る (`src/plan-asset/ledger/plan-revision-bootstrap.ts:89,407`)。
         (iii) `revisionUsesLegacyBootstrap` が真になる record も `provenance.revision + 1 = 2` に限られる (`node-plan-revision-runner.ts:342-357`)。
         よって legacy 経路 ⇒ prefix ∧ revision 2 であり、判定は legacy 経路の集合を包含する。逆は成り立たない (ローカルで採用済みの asset や
         legacy migration 経由の asset は、prefix ∧ revision 2 でも common 経路になりうる)。この差は安全側の過剰拒否として許容する (通常の再検へ戻るだけ)。
         過剰拒否が起きないとは主張しない。`revisionUsesLegacyBootstrap` との同値は要求しない。
       - H 側も判定する理由: H の bootstrap record (revision 2) は、待機中に M が同 asset を revision 2 で admit すると、R では common 経路の revision 3 として
         再発行される。R 側だけで判定するとこの経路を見逃す。従来の「legacy bootstrap 経路の record が再発行対象に含まれる場合は fail」を保つため、H 側を含める。
       - 実測 (§5 のコマンド、origin/main `4b541009`): tracked receipt 413 record のうち、`plan:legacy:` asset は 30 個 (record 171 件)。各 asset で revision 2 の
         record はちょうど 1 件で、それが各 asset の最初の record である。prefix ∧ revision 2 は 30 件、残りの 141 件は revision 3 以上。
         `command_id` の形式では区別できない (この 30 件に `plan-revise:` 6 件、`command:` 10 件、`pr154-` / `pr156-` 13 件、`plan-l6-` 1 件が混在する)。
     再導出値と R の値が一致しなければ `fail` (理由: `receipt_digest_mismatch`)。
     同一 asset に再発行 record が 2 件以上あるとき、最後以外の各 record について、`intermediatePlans` にその `content_digest` の key が無ければ `fail`
     (理由: `intermediate_plan_missing`)、渡された blob から正規 assembler と同じ規則で再計算した content digest が key (= record の `content_digest`) と
     一致しなければ `fail` (理由: `intermediate_plan_digest_mismatch`) とする (receipt revision 4)。
     さらに `intermediatePlans` の key 集合は、再発行 record が 2 件以上ある各 asset の最後以外の record の `content_digest` 集合と完全一致しなければならない。
     この集合に含まれない key (未参照の余分な blob、各 asset の最後の record の `content_digest` を含む) が 1 つでもあれば `fail`
     (理由: `intermediate_plan_unexpected`) とする。再発行 record が 2 件以上の asset が無いとき、`intermediatePlans` は空でなければならない (receipt revision 5)。

### 2.4 review 引き継ぎと CI

1. 検証器が `pass` のとき、wrapper は `H` の closing review receipt を `R` の merge 判定に引き継ぐ。
   - 引き継ぎは merge intent receipt に `rechain: { reviewed_head: H, rechain_head: R, main: M, verifier_digest }` として記録する。
   - review receipt 自体は書き換えない。`R` の review receipt を偽造しない。
2. `R` の required CI は、常に新しい run で green になる必要がある (same-run evidence の束縛は維持する)。wrapper は CI の完了を待ってから merge する。
3. 検証器が `fail`、または CI が red のとき、merge しない。通常どおり、`R` への非著者再検を要求する状態に戻す。
4. same-family 拒否、verdict 前の merge 禁止、1 exact head につき 1 request などの既存の merge 規律は変えない。
   引き継ぎは「`H` の非著者 PASS」を `R` へ運ぶだけで、PASS を作らない。

### 2.5 CLAUDE.md の例外文言

PO 承認 (2026-09-28) により、CLAUDE.md §運用規律の再締結 2 (merge) に次の例外を 1 つ追加する。追加は、検証器と wrapper の配線が merge された PR で同時に行う。

> 例外: `ut-tdd pr merge` の自動 re-chain で、`verifyRechainDelta` が `pass` を返し、re-chain head の required CI が green の場合に限り、
> review 済み head の非著者 PASS を re-chain head の merge 判定へ引き継いでよい (PLAN-L6-711 §2.4)。

### 2.6 検証器の入力形と Git 取得の境界 (rev 2、S1)

`verifyRechainDelta` は Git も file system も読まない pure function とする。Git からの取得は wrapper 側の adapter
(`readRechainSnapshot`) が行い、検証器には次の immutable な値だけを渡す。S2 の実装はこの形に束縛し、方式を追加しない。

```ts
type Oid = string; // 40 桁の小文字 hex
interface CommitObj { oid: Oid; parents: readonly Oid[]; tree: Oid }
type TreeMap = Readonly<Record<string, Oid>>; // repo 相対 path → blob oid (ls-tree -r の blob だけ)
interface RechainInput {
  commits: { H: CommitObj; X: CommitObj; R: CommitObj; M: Oid; base: Oid };
  trees: { base: TreeMap; H: TreeMap; M: TreeMap; X: TreeMap; R: TreeMap };
  blobs: Readonly<Record<Oid, string>>; // 下の「blob の範囲」に挙げた内容だけ
  admission: Readonly<Record<string, PlanAdmissionRequest>>; // key = H 側の再発行対象 record の record_digest、値 = 候補 A_H
  intermediatePlans: Readonly<Record<string, string>>; // key = 最後でない再発行 record の content_digest、値 = その record 時点の PLAN 全文 (receipt revision 4)
}
type RechainVerdict = { ok: true; verifierDigest: string } | { ok: false; reasons: readonly string[] };
```

1. **commit**: `H` は PR の review 済み exact head、`X` は merge commit、`R` は re-chain commit、`M` は取り込んだ origin/main の tip、
   `base` は `merge-base(H, M)` (§2.2 の `mb` と同じ)。旧 main tip は使わない (rev 3)。stack した PR で、`H` が含む別 PR の commit `C` が
   待機中に `M` へ入った場合、`base` は `C` へ前進する。この `base` を使えば、`C` の変更は main 由来として扱われ、PR 自身の追加には数えない。
   git の 3-way merge (`X` の生成) も同じ `base` を使うので、検証器の期待値と `X` の生成規則が一致する。
2. **tree**: 5 つの commit それぞれの全 blob を path → oid で渡す。§2.3-1 の 3-way は **path 単位**で決める。
   `H[p] = base[p]` なら `M[p]`、`M[p] = base[p]` なら `H[p]`、`H[p] = M[p]` ならその値。それ以外 (両側が別々に変えた path) は、
   簿記 path (receipt と PR が改訂した PLAN) を除き、検証器の対象外として `fail` を返す (通常の再検へ戻す)。
   git の内容レベル merge が成立する場合でも免除しない。`X[p]` と `R[p]` は、非簿記 path でこの期待値と一致しなければならない。
3. **blob の範囲**: 簿記 path (receipt と、`H` が改訂した各 PLAN) の `base` / `H` / `M` / `R` の内容と、§2.3-5 の所有判定のための
   `M` の全 `docs/plans/*.md` の内容。それ以外の blob は oid だけで比較し、内容は渡さない。
   同一 asset に再発行 record が 2 件以上ある場合は、最後以外の各 record 時点の PLAN 全文を `intermediatePlans` に、その record の `content_digest` を
   key として渡す (receipt revision 4)。これは Git の tree に存在しない内容であり、正しさは key の digest との一致と §2.3-6 の再導出で束縛する。
   最後の record の内容は `R` の PLAN blob を使い、`intermediatePlans` には入れない。key 集合は必要な集合と完全一致させ、余分な key は §2.3-6 のとおり `fail` になる (receipt revision 5)。
4. **admission**: `A_H` は adapter が `H` の PLAN frontmatter と PR の head branch などから組む候補であり、検証器は §2.3-6 のとおり
   `digest(A_H)` と `H` の tracked `decision_digest` を照合してから使う。照合できない候補は `fail`。
5. **出力**: `ok: true` のとき、`verifierDigest` は次の値とする (rev 3 で固定、receipt revision 4 で v2 に改版)。
   `"sha256:" + sha("ut-tdd.rechain-verifier.v2
" + stableJson(input))`
   `sha` と `stableJson` は `src/plan-admission/plan-revision-command-assembler.ts` の既存関数である。`stableJson` は object の key を
   UTF-8 bytes 順に整列し、`undefined` を落とす。`sha` は UTF-8 文字列の SHA-256 を小文字 hex で返す。先頭行 `ut-tdd.rechain-verifier.v2` は
   domain separator 兼 schema version であり、入力形を変えるときは版を上げる (receipt revision 4 で `intermediatePlans` を足したため v1 から v2 に上げた。v1 の値とは比較しない)。§2.4 の merge intent receipt の `rechain.verifier_digest` はこの値を記録する。
6. **legacy 判定の入力 (receipt revision 6)**: §2.3-6 の legacy bootstrap 除外は、`blobs` で渡す H / R の receipt の `binding.asset_id` と
   `binding.revision` だけで決める。provenance や harness.db 由来の値は入力に加えない。入力形は変えないので、`verifierDigest` の版は v2 のままとする。
7. **信頼境界**: adapter は harness 自身のコードであり、Git の plumbing (`rev-parse` / `ls-tree -r` / `cat-file`) だけを使う。
   検証器は adapter の出力を信用するが、adapter の出力が実 Git object と一致することを別の oracle (U-RECHAIN-013) で固定する。
8. **008 の境界**: git の 3-way merge 自体が衝突した場合は、wrapper が検証器を呼ぶ前に `rechain_conflict` で止める (U-RECHAIN-008、S3)。
   検証器は wrapper の判断に依存せず、両側変更の非簿記 path を 2 のとおり独立に `fail` にする (U-RECHAIN-002 / 014、S2)。

## 3. scope boundary

- 含む: §2 の契約、S0 の PoC、検証器 (pure function 1 module) と oracle、`ut-tdd pr merge` への配線、CLAUDE.md の例外文言。
- 含まない:
  - receipt の schema 変更と、既存 323 record の移行 (案 B)。
  - intent と集約の方式 (案 C)。
  - CI の免除や短縮 (Windows の shard 化などは別 Issue)。
  - issuer authenticity の追加。
  - receipt 以外の簿記 (projection DB など) の自動化。

## 4. pair と candidate oracle

pair は `docs/test-design/harness/L7-unit-test-design.md` に、実装 PR で `CANDIDATE-U-RECHAIN-*` として追加する。以下は freeze 対象の oracle である。

| ID | oracle | 違反 / mutation |
| --- | --- | --- |
| CANDIDATE-U-RECHAIN-001 | 簿記のみの re-chain (receipt 1 件の再発行、`generates` 追加 2 件、§8 注記 1 行) で `pass` | (m) whitelist を外す → 002〜006 の負系が pass して失敗 |
| CANDIDATE-U-RECHAIN-002 | `R` が PLAN / receipt 以外の path に 1 byte 追加 → `fail` (理由: 非簿記 path) | (m) 1 の比較を省く → pass して失敗 |
| CANDIDATE-U-RECHAIN-003 | PLAN 本文の append-only 領域外に手で変更 → `fail` | (m) strip 比較を append 領域だけにする → pass して失敗 |
| CANDIDATE-U-RECHAIN-004 | 追加 record の数が `H` と異なる、または別 PLAN を bind → `fail` | (m) 件数と対象の照合を省く |
| CANDIDATE-U-RECHAIN-005 | `content_digest` が `R` の PLAN と不一致、chain が不連続 → `fail` | (m) digest の再計算を省く |
| CANDIDATE-U-RECHAIN-006 | (正系) `M` が `H` の分岐後に 2 本以上の commit (merge commit を含む) を持つ状態で、merge 1 本と re-chain 1 本の `R` → `pass`。(負系) PR 側に余分な commit を 1 本挟む (`X` と `R` の間、または `H` と `X` の間)、`X` の親の順序が逆、`R` が `H` の子孫でない → いずれも `fail` | (m1) `H..R` の件数 (`--first-parent` なし) で判定する → 正系が `fail` して失敗。(m2) 親の束縛を省き件数だけ見る → 親順序を逆にした負系が `pass` して失敗 |
| CANDIDATE-U-RECHAIN-007 | main と PR の双方が `generates` 末尾と §8 末尾に追記 (#685 / #686 型) → 決定的に連結されて `pass`。§8 は採番し直される | (m) 連結順を逆にする → byte 不一致で失敗 |
| CANDIDATE-U-RECHAIN-008 | append 領域外で 3-way 衝突 → wrapper が `rechain_conflict` で中止し、merge しない | (m) 衝突を main 側優先で黙って解消 → 中止されず失敗 |
| CANDIDATE-U-RECHAIN-009 | `pass` でも `R` の CI が red または未完了 → merge しない。`pass` かつ green → merge し、intent receipt に `rechain` 欄を残す | (m) CI の待機を省く |
| CANDIDATE-U-RECHAIN-010 | `H` の PASS が same-family / blocking>0 / 別 head のもの → 引き継がない | (m) 引き継ぎ条件から族検査を外す |
| CANDIDATE-U-RECHAIN-011 | 待機中に `M` が、PR の追加 `artifact_path` を新規作成、または別 PLAN の `generates` に宣言 → `fail` (理由: 再所有) | (m) §2.3-5 を省く → 再所有したまま pass して失敗 |
| CANDIDATE-U-RECHAIN-012 | `R` の admission で `PlanAdmissionRequest` のフィールド (`routeMode`・`kind`・`layer`・`workflowPhase`・`routeSignal`・`drive`・`branch`・`status`・`subDoc`・`issue`・`origin`・`transitionDirection`・`implementationDisposition`・`reentry.targetPlanId`・`reentry.phase`・`implementationTarget`・`escapeReason`・`supersedes`) を 1 つずつ改変し、各場合で全 digest (decision_digest を含む) を正しく再計算 → フィールドごとに全て `fail`。`digest(A_H)` が H の tracked `decision_digest` と一致しない候補 `A_H` → `fail`。許容項目だけの変化 (base 束縛、command_id suffix、時刻、`reentry.targetRevision`、再導出 digest) → `pass` | (m1) record 内 digest を信用して再計算しない → 改変が pass して失敗。(m2) 許容項目の列挙に任意の 1 フィールド (例: `branch`) を足す → そのフィールドの改変が pass して失敗。(m3) `A_H` と H の `decision_digest` の照合を省く → 改変した候補が pass して失敗 |
| CANDIDATE-U-RECHAIN-013 | adapter `readRechainSnapshot` の出力 (commit の parents / tree、5 つの TreeMap、blob の範囲、`base`) が、実 Git object に対する `rev-parse` / `ls-tree -r` / `cat-file` の結果と完全一致する。`base` は実 Git の `merge-base(H, M)` と一致する | (m) blob の範囲に非簿記 path を混ぜる、または TreeMap から 1 path を落とす → 一致検査で失敗 |
| CANDIDATE-U-RECHAIN-014 | 非簿記 path を `H` と `M` の両側が別々に変え、git の内容 merge は成立する fixture → 検証器は `fail` (理由: 両側変更)。簿記 path の両側変更は §2.2 の規則で判定する | (m) path 単位 3-way の「両側変更は対象外」を外し、`X[p]` をそのまま期待値にする → `pass` して失敗 |
| CANDIDATE-U-RECHAIN-015 | stack した PR: `H` が含む別 PR の commit `C` が待機中に `M` へ入った fixture (`base` = `C`)。PR 自身の append-only 追加だけが再適用され、`C` の変更は main 由来として扱われて `pass` | (m) `C` より前の旧 base を使う → `C` の変更が PR の追加に数えられて失敗 |
| CANDIDATE-U-RECHAIN-016 | 同じ `RechainInput` を key の挿入順だけ変えて 2 通り組むと、`verifierDigest` が完全一致する。domain separator の版を変えると値が変わる | (m) `stableJson` の代わりに `JSON.stringify` を使う → 挿入順で値が変わって失敗 |
| CANDIDATE-U-RECHAIN-017 | R の record の `receipt_digest` だけを任意値 (例 `sha256:` + `f` × 64) に置き換え、frontmatter と record digest を整合させて再計算した入力 → `fail` (理由: `receipt_digest_mismatch`)。同じ入力で `actor` 定数を別値にして再導出した値に置き換えた場合も `fail`。legacy bootstrap 除外の判定は U-RECHAIN-019 で固定する (receipt revision 6) | (m) `derivePlanRevisionDigests` による再導出を省き H の値の非流用だけを見る → 任意 digest が pass して失敗 |
| CANDIDATE-U-RECHAIN-018 | 同一 asset について `H` が 2 件 append していた re-chain (`M` 側の同 asset 最新 revision を n とする)。(正系) 1 件目は base = (n、`M` の PLAN の canonical payload digest)、2 件目は base = (n + 1、1 件目の中間 blob の canonical payload digest) で再発行し、1 件目の中間 blob を `intermediatePlans` に渡した入力 → `pass`。(負系) 2 件目の base を `M` に固定 (n、`M` の digest) して `receipt_digest` を計算し、他の digest を整合させた入力 → `fail` (理由: `receipt_digest_mismatch`)。1 件目の中間 blob を 1 byte 変えて渡す (再計算 digest ≠ `content_digest`) → `fail` (理由: `intermediate_plan_digest_mismatch`)。中間 blob を渡さない → `fail` (理由: `intermediate_plan_missing`)。正系の入力に、どの record からも参照されない余分な key と blob を 1 つ足す → `fail` (理由: `intermediate_plan_unexpected`)。正系の入力に、2 件目 (最後の record) の `content_digest` を key とし R の PLAN blob を値とする entry を足す → `fail` (理由: `intermediate_plan_unexpected`) | (m1) 全 record の base を `M` から取る → 正系が `fail` して失敗。(m2) 中間 blob の digest 照合を省く → 改変 blob が pass して失敗。(m3) 中間 blob の欠落時に `R` の PLAN blob で代用する → 欠落入力が `intermediate_plan_missing` で止まらず失敗。(m4) key 集合の完全一致を「必要な key を含む」(superset を許す) に緩める → 余分な key と最後の record の blob を混ぜた入力が pass して失敗 |
| CANDIDATE-U-RECHAIN-019 | legacy bootstrap 除外 (§2.3-6、receipt revision 6)。負系 a2 以外は、判定対象の条件以外を全て満たす fixture で判定する。(負系 a1) M が同じ `plan:legacy:` asset の revision 1 の record と PLAN blob を持ち (§2.3-6 の `baseRevision` / `basePayloadDigest` の源が得られる合成 fixture)、H / R の追加 record が同 asset の revision 2 で、R の digest を common 経路で正しく再計算した入力 → `fail` で、`reasons` はちょうど `[legacy_bootstrap_unsupported]` (他の理由を含まない)。(負系 a2) 実運用の形: M に同 asset の record が無く、H の追加 record が revision 2 → `fail` で、`reasons` は `legacy_bootstrap_unsupported` を含む (源の欠落の理由との併存を許す、§2.3-6 の理由の集約)。a1 / a2 とも、`h.command_id` を `plan-revise:issue-1:legacy-x:r2:000000000000` と `pr154-legacy-x-r2` の 2 通りにして同じ期待値になる。(負系 b) H の追加 record は `plan:legacy:` asset の revision 2 で、待機中に M が同 asset を revision 2 で admit したため R の再発行 record が revision 3 になり、R の digest を common 経路で正しく再計算した入力 → `fail` (reasons に `legacy_bootstrap_unsupported` を含む)。(正系 c) M に同 `plan:legacy:` asset の最新 revision n ≥ 2 があり、H / R の record が revision n + 1 で common preimage から正しく再導出された入力 → `pass`。(正系 d) `plan:<32 hex>` asset で M の最新 revision が 1 (draft)、H / R の record が revision 2 の入力 → `pass` | (m1) R 側だけで判定する (PR #839 の近似 `prefix ∧ (M に同 asset の record が無い ∨ r.revision === 2)` と同形) → 負系 b が `pass` して失敗。(m2) asset 単位で除外する (prefix だけで判定) → 正系 c が `fail` して失敗。(m3) prefix を見ず revision 2 だけで判定する → 正系 d が `fail` して失敗。(m4) 判定を `command_id` の形式に置き換える。式 X = `/^pr154-/.test(h.command_id)` → a1 / a2 の `plan-revise:issue-1:legacy-x:r2:000000000000` 形式で `legacy_bootstrap_unsupported` が出ず失敗。式 Y = `/^plan-revise:/.test(h.command_id)` → a1 / a2 の `pr154-legacy-x-r2` 形式で出ず、かつ正系 c / d (`command_id` は `plan-revise:...` 形式) が `fail` して失敗。(m5) 源の欠落を先に返して legacy 判定を短絡する → a2 で `legacy_bootstrap_unsupported` が出ず失敗 |

## 5. 実測の根拠コマンド

```bash
git show origin/main:docs/governance/plan-admission-receipts.json | node -e "const a=JSON.parse(require('fs').readFileSync(0)).records;const p={};for(const r of a.slice(-60))p[r.binding.plan_id]=(p[r.binding.plan_id]||0)+1;console.log(a.length,Object.keys(p).length,p)"
git log origin/main --since=2026-09-14 --format=%H -- docs/governance/plan-admission-receipts.json | wc -l   # 90
git log origin/main --since=2026-09-14 --merges --format=%s | grep -c "Merge pull request"                  # 58
git show --stat b8bdf6d8
# legacy bootstrap 除外の実測 (§2.3-6、receipt revision 6): 413 30 171 30 true 141
git show 4b541009:docs/governance/plan-admission-receipts.json | node -e "const r=JSON.parse(require('fs').readFileSync(0)).records;const L=r.filter(x=>x.binding.asset_id.startsWith('plan:legacy:'));const by={};for(const x of L)(by[x.binding.asset_id]=by[x.binding.asset_id]||[]).push(x);const v=Object.values(by);console.log(r.length,v.length,L.length,L.filter(x=>x.binding.revision===2).length,v.every(a=>a.filter(x=>x.binding.revision===2).length===1&&a[0].binding.revision===2),L.filter(x=>x.binding.revision>=3).length)"
```

## 6. Schedule と出口

| step | 内容 | mode | 出口 |
| --- | --- | --- | --- |
| S0 | control lane の checkout から、他 PR の branch に対して headless に `plan revise` を実行する PoC (ledger custody) | serial | 成否と手順を本 PLAN の §8 に記録する。失敗なら §2.1 を改訂する |
| S1 | 本 PLAN の pair-freeze (docs のみ、非著者 Codex Sol の review) | serial (S0 の後) | PASS receipt と CI green の後に confirm する |
| S2 | `verifyRechainDelta` (pure function 1 module、§2.6 の入力形) と U-RECHAIN-001..007、011、012、014..019 | serial (S1 の後) | oracle が green、非著者 review が PASS |
| S3 | adapter `readRechainSnapshot` と `ut-tdd pr merge` への配線、U-RECHAIN-008..010、013、CLAUDE.md の例外文言 | serial (S2 の後) | 実 PR 1 本で自動 re-chain による merge を実証する |

## 7. 非 Scope

§3 の「含まない」を参照。

## 8. 記録

1. 起票 (rev 1): Issue #711。設計判断は §1 (advisor claude-fable-5、PO 承認 2026-09-28)。
2. rev 2: `drive` を parent (PLAN-RECOVERY-16) と揃えた (plan-governance の parent_drive_mismatch の是正、契約本文は不変)。
3. rev 3: 非著者 review (Codex Sol r1、PR #713) の FLAG 2 件を反映した。(1) 待機中に main が作成・所有した path を PR が再所有する経路を §2.3-5 で閉じた。(2) admission の意味を改変して hash を再計算する経路を、正規 assembler による完全な再導出と許容項目の列挙 (§2.3-6) で閉じた。oracle U-RECHAIN-011 / 012 を追加した。
4. rev 4: 非著者 review (Codex Sol r2、PR #713) の FLAG 1 件を反映した。tracked record / frontmatter に投影されない admission 入力 (`workflowPhase` / `branch` / `reentry.targetPlanId` など) を改変し digest を再計算する経路を閉じるため、§2.3-6 で H 側の `PlanAdmissionRequest` 全体を H の tracked `decision_digest` に束縛し、`reentry.targetRevision` 以外の完全一致を要求した。U-RECHAIN-012 をフィールドごとの mutation に拡張し、m3 を追加した。
5. rev 5 (re-chain 後の receipt revision 2): Codex root の追加実測 (PR #713 コメント、実 Git object `5854787b` で `9ba54b41..5854787b` が 3 本) を反映した。§2.3-4 を件数判定から親の直接束縛 (`R^1 = X`、`X^1 = H`、`X^2 = M`、`--first-parent` 2 本) に訂正し、U-RECHAIN-006 を `M` 側複数 commit の正系と PR 側余分 commit の負系に分けた。
6. rev 6: PR #713 の非著者 review (Codex Sol r3) の FLAG 1 件を反映した。`workflow_phase` は `receiptFrontmatter` に投影されないため、§2.3-6 の投影照合の例から外した。投影フィールドは renderer の出力に合わせて全て列挙し、非投影入力は `decision_digest` 束縛だけで検証することを明記した。PR #713 は是正上限 (3 回) に達したので close し、本 revision を新しい PR で再提出した (CLAUDE.md §FLAG 後の限定是正と merge 2(c))。
7. rev 2 (S1): 検証器の入力形と Git 取得の境界を §2.6 に freeze した (S2 の実装者 Codex root からの、実装前の確認依頼による。issue #711)。path 単位の 3-way、blob の範囲、`A_H` の照合、`verifierDigest`、adapter の信頼境界、oracle 008 と検証器の分担を定め、U-RECHAIN-013 (adapter の忠実性) と 014 (両側変更の非簿記 path) を追加した。
8. rev 3 (S1 の是正): PR #720 の非著者 review (Codex Sol r1) の FLAG 2 件を反映した。(1) 旧 main tip 由来の base は stack した PR で `merge-base(H, M)` と一致しない反例があるため、§2.2 と §2.6 の base を `merge-base(H, M)` (git merge 自体の base) に統一し、旧 tip を使わないことにした。U-RECHAIN-015 を追加した。(2) `verifierDigest` の preimage、hash、domain separator (版付き) を既存の `stableJson` / `sha` を名指しして固定し、U-RECHAIN-016 を追加した。
9. 2026-10-05 改訂 (契約齟齬の是正): S2 の実装 (PR #724) に対する非著者 review (Codex Sol r2) が、`receipt_digest` を再導出せず H の値の非流用だけを見ている点を FLAG とした。実装の是正中に、§2.3-6 が求める再導出の preimage の源が契約に書かれていないことが分かった (実装者は「harness.db にしかない」と判断して停止)。advisor (claude-fable-5、design) と実測 (`src/plan-admission/node-plan-revision-runner.ts:273-289`、renderer に `actor` の投影なし) により、`actor` 以外の全フィールドが既に束縛された源から導けることを確認し、§2.3-6 に源の表と `actor` の契約定数を追加した。§2.6 の入力形は変えない。B 案 (ledger を信頼根にする) は、R を生む append 自身が書いた行との照合でほぼ自己整合になり信頼境界を広げるため、C 案 (再導出をやめる) は契約を弱めるため、採らなかった。
10. receipt revision 4 (2026-10-05、PR #831 の是正): 非著者 review (Codex Sol r1、PR #831) の FLAG 1 件を反映した。9 で追加した源の表は、同一 asset の record を複数再発行する場合に全 record の `baseRevision` / `basePayloadDigest` を `M` に固定しており、§2.3-3 の連番と矛盾していた (ledger は `revision = baseRevision + 1` で append し、`basePayloadDigest` が直前 revision の `canonical_payload_digest` と一致することを要求する。`src/plan-asset/ledger/plan-revision-ledger.ts:99-104,194-205`、`src/plan-admission/plan-revision-command-assembler.ts:109-124`)。§2.3-6 で 1 件目と k 件目 (k ≥ 2) の base を分けて定義し、各 record の payload をその record 自身の PLAN blob から導くことにした。最後以外の record の PLAN 全文は Git の tree に無いため、§2.6 の `RechainInput` に `intermediatePlans` (key = record の `content_digest`、内容は digest 照合で束縛) を追加し、9 の「§2.6 の入力形は変えない」を改めた。入力形を変えたので `verifierDigest` の domain separator を `ut-tdd.rechain-verifier.v2` に上げた。U-RECHAIN-018 を追加し、S2 の oracle に 017 / 018 を含めた。
11. receipt revision 5 (2026-10-05、PR #831 の是正 2 回目): 非著者 review (Codex Sol r2、PR #831) の FLAG 1 件を反映した。revision 4 の `intermediatePlans` は必要 key の欠落と digest 不一致しか拒否せず、未参照の余分な key / blob を足しても全照合を満たした。§2.3-6 で key 集合を、再発行 record が 2 件以上ある各 asset の最後以外の record の `content_digest` 集合との完全一致に定め、余分な key と最後の record の blob の混入を `intermediate_plan_unexpected` で fail-close にした。U-RECHAIN-018 に負系 2 件と mutation m4 (superset を許す) を追加した。`RechainInput` の形は変えないため、`verifierDigest` の版は v2 のままとする。
12. receipt revision 6 (2026-10-05、PR #839 の契約齟齬): S2 実装 (PR #839) の非著者 review (Codex Sol) が、§2.3-6 の legacy 除外が `revisionUsesLegacyBootstrap` (harness.db の provenance と command receipt の join) を要求する一方、§2.6 の入力に provenance が無く、実装の prefix / revision 近似との同値性も契約に無いことを上流 gap と判定した。advisor (gpt-6.1-sol、implementation、2026-10-05) と実測により、判定根拠を tracked receipt の `binding.asset_id` prefix `plan:legacy:` と `binding.revision === 2` (H 側と R 側の両方) に凍結した。これは legacy 経路の集合を包含する判定で、同値ではない (過剰拒否は安全側として許容)。除外は record 単位とし、revision 3 以上は再導出して `pass` させる。A 案 (provenance を入力に足す) は DB 由来の値の信頼境界・鮮度・record との束縛を新たに要するため、C 案 (`plan:legacy:` asset を全て除外) は 30 asset の common revision まで拒否するため、採らなかった。advisor の指摘で、R 側だけの判定 (H の bootstrap record が R で revision 3 になる経路を見逃す) を退けた。U-RECHAIN-019 を追加し、S2 の oracle に含めた。`RechainInput` の形は変えないので、`verifierDigest` の版は v2 のままとする。
13. receipt revision 6 の是正 (2026-10-06、PR #845 の是正 1 回目): 非著者 review (Codex Sol r1、PR #845) の FLAG 2 件を反映した。(1) U-RECHAIN-019 負系 a は「他の全条件を満たす」と「M に同 asset の record が無い」を同時に要求しており、後者では §2.3-6 の `baseRevision` / `basePayloadDigest` の源が得られず別の理由でも fail するため、単一条件の oracle になっていなかった。M に revision 1 の base を置いた合成 fixture (a1、`reasons` がちょうど legacy の 1 件) と実運用の形 (a2、併存を許す) に分け、§2.3-6 に legacy 判定を他条件の失敗で短絡しない理由の集約規則を凍結した。(2) mutation m4 は判定式を固定しておらず、両形式を拒否する式では負系 a が RED にならなかった。誤判定式を X / Y の 2 式に固定し、それぞれで legacy 理由が欠落する `command_id` と期待値を記述した。短絡の mutation m5 を足した。`RechainInput` の形は変えないので、`verifierDigest` の版は v2 のままとする。
