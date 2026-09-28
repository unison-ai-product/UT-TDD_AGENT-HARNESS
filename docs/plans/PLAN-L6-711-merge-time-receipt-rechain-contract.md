---
plan_id: PLAN-L6-711-merge-time-receipt-rechain-contract
title: "PLAN-L6-711 (add-design): merge 時の自動 re-chain と簿記差分での再検免除の契約 freeze"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-28
updated: 2026-09-28
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
  receipt_id: certificate:72755a814a650e97acab49ec706ad879
  command_id: plan-revise:issue-711:rechain-contract:plan:r2:60ba2e38b0ae
  admitted_at: 2026-09-28T03:56:18.633Z
  source_digest: sha256:bc0ab1c06fe56845bfca0d7ef631acc128380edad709e34582d73792a66a67ad
  decision_digest: sha256:bfd1146cf7e852ab63d498f11f531cdef18b0c14e3fcf43c80e1d3178b5d7b45
  receipt_digest: sha256:f7ea33a4ca349a5541aedf1e45253264ab30e38285124bfd9b74cf5b5560b725
  binding:
    path: docs/plans/PLAN-L6-711-merge-time-receipt-rechain-contract.md
    plan_id: PLAN-L6-711-merge-time-receipt-rechain-contract
    asset_id: plan:a3c66266cedd299bddf17b634ddf22c5
    revision: 2
    content_digest: sha256:bc0ab1c06fe56845bfca0d7ef631acc128380edad709e34582d73792a66a67ad
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
    target_revision: 2
    phase: forward_merge
  escape_reason: "Codex root の追加実測 (PR #713) により、§2.3-4 の commit
    構造判定を件数から親の直接束縛へ訂正し、oracle U-RECHAIN-006 を正系と負系に分ける。"
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
`mb` = merge-base(`H`, origin/main の旧 tip)、`M` = 現在の origin/main とする。

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
   - `binding.content_digest` は `R` の PLAN の正規 digest と一致する。
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
     一致することを照合し、frontmatter に投影されるフィールド (route / issue / origin / reentry / escape_reason / workflow_phase など) も
     `A_R` からの投影と一致させる。
   - admission 以外で変えてよいのは次の項目だけとする:
     - base 束縛 (`asset_id` 以外の revision、revision_digest、source_commit、source_blob_oid、source_content_digest、projection_tail_digest) を `M` に合わせる。
     - `command_id` に `:rechain-<n>` suffix を付ける。`admitted_at` / `recorded_at` を更新する。
     - 上の入力から決定的に導かれる digest (source_digest、content_digest、decision_digest、receipt_digest、record_digest、receipt_id)。
   verifier はこれらの digest を自分で計算し直して照合する。record 内の値を信用しない。`reentry.targetRevision` 以外の admission フィールドが
   1 つでも `A_H` と異なれば `fail`。

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

## 5. 実測の根拠コマンド

```bash
git show origin/main:docs/governance/plan-admission-receipts.json | node -e "const a=JSON.parse(require('fs').readFileSync(0)).records;const p={};for(const r of a.slice(-60))p[r.binding.plan_id]=(p[r.binding.plan_id]||0)+1;console.log(a.length,Object.keys(p).length,p)"
git log origin/main --since=2026-09-14 --format=%H -- docs/governance/plan-admission-receipts.json | wc -l   # 90
git log origin/main --since=2026-09-14 --merges --format=%s | grep -c "Merge pull request"                  # 58
git show --stat b8bdf6d8
```

## 6. Schedule と出口

| step | 内容 | mode | 出口 |
| --- | --- | --- | --- |
| S0 | control lane の checkout から、他 PR の branch に対して headless に `plan revise` を実行する PoC (ledger custody) | serial | 成否と手順を本 PLAN の §8 に記録する。失敗なら §2.1 を改訂する |
| S1 | 本 PLAN の pair-freeze (docs のみ、非著者 Codex Sol の review) | serial (S0 の後) | PASS receipt と CI green の後に confirm する |
| S2 | `verifyRechainDelta` (pure function 1 module) と U-RECHAIN-001..008、011、012 | serial (S1 の後) | oracle が green、非著者 review が PASS |
| S3 | `ut-tdd pr merge` への配線、U-RECHAIN-009..010、CLAUDE.md の例外文言 | serial (S2 の後) | 実 PR 1 本で自動 re-chain による merge を実証する |

## 7. 非 Scope

§3 の「含まない」を参照。

## 8. 記録

1. 起票 (rev 1): Issue #711。設計判断は §1 (advisor claude-fable-5、PO 承認 2026-09-28)。
2. rev 2: `drive` を parent (PLAN-RECOVERY-16) と揃えた (plan-governance の parent_drive_mismatch の是正、契約本文は不変)。
3. rev 3: 非著者 review (Codex Sol r1、PR #713) の FLAG 2 件を反映した。(1) 待機中に main が作成・所有した path を PR が再所有する経路を §2.3-5 で閉じた。(2) admission の意味を改変して hash を再計算する経路を、正規 assembler による完全な再導出と許容項目の列挙 (§2.3-6) で閉じた。oracle U-RECHAIN-011 / 012 を追加した。
4. rev 4: 非著者 review (Codex Sol r2、PR #713) の FLAG 1 件を反映した。tracked record / frontmatter に投影されない admission 入力 (`workflowPhase` / `branch` / `reentry.targetPlanId` など) を改変し digest を再計算する経路を閉じるため、§2.3-6 で H 側の `PlanAdmissionRequest` 全体を H の tracked `decision_digest` に束縛し、`reentry.targetRevision` 以外の完全一致を要求した。U-RECHAIN-012 をフィールドごとの mutation に拡張し、m3 を追加した。
5. rev 5 (re-chain 後の receipt revision 2): Codex root の追加実測 (PR #713 コメント、実 Git object `5854787b` で `9ba54b41..5854787b` が 3 本) を反映した。§2.3-4 を件数判定から親の直接束縛 (`R^1 = X`、`X^1 = H`、`X^2 = M`、`--first-parent` 2 本) に訂正し、U-RECHAIN-006 を `M` 側複数 commit の正系と PR 側余分 commit の負系に分けた。
