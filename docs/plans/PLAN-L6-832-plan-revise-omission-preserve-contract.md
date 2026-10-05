---
plan_id: PLAN-L6-832-plan-revise-omission-preserve-contract
title: "PLAN-L6-832 (add-design): plan revise の省略保存と明示 clear の契約 freeze"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-05
updated: 2026-10-05
owner: Claude control lane (契約起草) / Codex (L7 add-impl 実装) / 非著者 frontier reviewer
parent_design: docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: plan revise の revision authoring 契約 (PLAN-RECOVERY-16
  §2) の manifest 入力の意味を L6 で具体化する追加契約であり、L0-L3 要件の意味を変えない。RECOVERY-16
  本文は省略時の削除を契約として 述べていない (§0 の実測) ため supersede は行わない。
agent_slots:
  - role: tl
    slot_label: TL - 省略=保存 / 明示 clear の境界と、admission 評価前の解決点を freeze する
  - role: se
    slot_label: SE - 解決済み admission を CLI / runner / binder / replay に一貫して渡す配線を定義する
  - role: qa
    slot_label: QA - 保存・置換・clear・衝突・不適合・replay の反証可能な oracle を定義する
generates:
  - artifact_path: docs/plans/PLAN-L6-832-plan-revise-omission-preserve-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md
  requires:
    - docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md
  blocks: []
  references:
    - docs/plans/PLAN-L6-711-merge-time-receipt-rechain-contract.md
    - docs/plans/PLAN-L7-690-issue-binding-projection-state-contract.md
    - src/cli/plan-revise.ts
    - src/plan-admission/plan-content-binding.ts
    - src/plan-admission/node-plan-revision-runner.ts
    - src/plan-admission/plan-revision-command-assembler.ts
    - src/schema/frontmatter.ts
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/832
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 832
admission_receipt:
  schema_version: v2
  receipt_id: certificate:5688d88aec5471045601ace48c8bbb2a
  command_id: plan-draft:issue-832:revise-omission-preserve:1:rechain-1
  admitted_at: 2026-10-05T11:52:29.704Z
  source_digest: sha256:20580848f8a8b32210186f10c5c2149c6f134307fcd4a954b59dcf60160a7d47
  decision_digest: sha256:afb0329f0674028ffe066c279eae4e16b3b0b101818dea9e6f2987422a16b209
  receipt_digest: sha256:1e935a477e80291ff1274c021a1c08c1f3bece0f01fee3af0f937fac736dc3eb
  binding:
    path: docs/plans/PLAN-L6-832-plan-revise-omission-preserve-contract.md
    plan_id: PLAN-L6-832-plan-revise-omission-preserve-contract
    asset_id: plan:5688d88aec5471045601ace48c8bbb2a
    revision: 1
    content_digest: sha256:20580848f8a8b32210186f10c5c2149c6f134307fcd4a954b59dcf60160a7d47
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 832
    episode_id: E4-832-revise-omission-preserve
    projection_state: unprojected
  origin:
    plan_id: PLAN-RECOVERY-16-plan-revision-authoring
    revision: 7
    digest: sha256:1b6aa397ad9995b717907d3247e02b3bba3d6c4508874b7654f90fd29b388927
  reentry:
    target_plan_id: PLAN-L6-832-plan-revise-omission-preserve-contract
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #832: plan revise が manifest で省略された既存 route-owned field
    (sub_doc 等) を黙って削除する。外部監査 (2026-10-05) の方針に従い、省略=保存と明示 clear の契約を
    PLAN-RECOVERY-16 の追加契約として freeze する。"
---

# PLAN-L6-832: plan revise の省略保存と明示 clear の契約 freeze

## 0. 目的と位置付け

`ut-tdd plan revise` は、manifest の `admission` に書かれていない既存の route-owned optional
field を黙って消す。2026-10-05 に PLAN-L6-105 / 106 / 107 の `sub_doc: function-spec` がこの経路で
失われた (Issue #832)。正規 writer が canonical metadata を黙って消せる状態を根治する。

本 PLAN は契約だけを freeze する。実装は別の L7 add-impl PLAN と Reverse 対で後から起票する
(前例: PLAN-L6-711)。

実測 (base: origin/main `e0e1da3f`):

- 削除の実体は `src/plan-admission/plan-content-binding.ts` の `bindPlanSourceToAdmission` である。
  `source.content` の frontmatter から `workflow_phase` / `status` / `sub_doc` / `github_issue_id` /
  `supersedes` と `admission_receipt` を取り除き、`admission` にある値だけを戻す。
  他の key (`title` / `generates` / `pair_artifact` など) は `source.content` のまま残る。
- `src/cli/plan-revise.ts` の `admissionSchema` では、上の 5 項目に対応する admission key が全て optional である。
- この削除は `tests/plan-content-binding.test.ts` の `U-PA-BIND-001` (「current admission にない旧
  route-owned optional keys をすべて除去する」) と `U-PA-BIND-003` が oracle として固定している。
- PLAN-RECOVERY-16 の本文 (§2 Recovery 契約) には、省略時に削除するという記述が無い
  (`grep -n "sub_doc\|省略\|omit" docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md` の該当は
  revision 7 の履歴記述 1 件だけ)。したがって本件は owner 契約の誤りの訂正 (redesign) ではなく、
  owner 契約が定めていなかった入力の意味の追加 (add-design) として扱う。ただし `U-PA-BIND-001` の
  oracle は意図的に反転するので、L7 add-impl で test-design と baseline を同時に改訂する。
- PLAN-RECOVERY-16 revision 7 は、manifest から `sub_doc` を省いて削除した。本契約の後は、同じ操作に
  明示 clear が必要になる。

## 1. 設計判断

advisor 相談: `ut-tdd advisor --decision implementation --current-model claude-opus-5 --execute`
(provider=codex、model=gpt-6.1-sol、exit=0、2026-10-05)。判定は「方向性は survives。binder で 5 項目を
コピーするだけの実装は refuted」。advisor の前提は次のとおり repo で確認した。

- CLI (`src/cli/plan-revise.ts` の action) は runner より前に `evaluatePlanAdmission` を呼ぶ。runner の
  `assertAdmission` も manifest から作った request との完全一致を要求する。省略値の解決を runner だけで
  行うと、継承前の request で評価と照合が走る。→ D5 に反映。
- admission の `issue` は `issueId` / `episodeId` / `projectionState` / `projectionDigest` の binding であり、
  frontmatter の `github_issue_id` (数値) だけからは再構成できない (`src/plan-admission/policy.ts`)。
  → D3 に反映。
- `src/schema/frontmatter.ts` は top-level `supersedes` と receipt の完全一致を常に要求し、
  `github_issue_id` は receipt に issue があるときだけ照合する。Forward receipt は issue を持てない。
  → D3 / D6 に反映。
- replay は HEAD が進んだ後に走るので、継承元を現在 HEAD にすると結果が変わる。→ D2 に反映。

| ID | 論点 | 採択 | 不採択案と理由 |
|---|---|---|---|
| D1 | 明示 clear の表現 | `admission.clear: [key...]`。要素は D3 の対象 key 名の閉じた enum。重複と空配列は schema で拒否する | 値に `null` を書く案は、全 key に optional と nullable の区別を足す必要があり、「未指定」と「消去」の差が JSON の書き方 1 つに依存する。top-level `clear` は admission の外に意味を置き、admission request との対応が崩れる。enum list なら追加は 1 箇所で済み、未知 key を schema で弾ける |
| D2 | 保存の継承元 | manifest の `base` (`source_commit` / `source_blob_oid` / `source_content_digest`) で検証した base 本文。既存の `boundBaseSource` と同じ検証を通す | `source.content` の frontmatter から継承する案は採らない。binder は author 入力の route-owned key を信用しない設計であり、それを継承元にすると admission を通らない値が混入する。現在 HEAD を継承元にすると replay が非決定的になる |
| D3 | 対象 field | route-owned の 5 項目に限る。admission key は `workflow_phase` / `status` / `sub_doc` / `issue` / `supersedes` (frontmatter では `workflow_phase` / `status` / `sub_doc` / `github_issue_id` / `supersedes`)。`issue` は base の embedded `admission_receipt.issue` の binding 全体を継承元とする。base frontmatter の `github_issue_id` と一致しない場合、または receipt に issue が無いのに `github_issue_id` だけある場合は fail-close し、明示 `issue` か clear を要求する | 全 optional frontmatter を対象にする案は採らない。route-owned 以外の key は `source.content` が全文で決めており、既に保存されている。そこを省略と見なすと、本文編集で key を消す通常の操作を禁止することになる |
| D4 | admission が書く field との関係 | `kind` / `layer` / `drive` / `route_signal` / `route_mode` は必須のまま、manifest 値が常に勝つ。`status` は省略時に保存し、指定時は置換する。`status` は clear の enum に入れない (frontmatter の既定値 `draft` に暗黙に戻ると、確定済みの状態を黙って下げられるため)。`revision` と `admission_receipt` は ledger transaction の出力であり、保存・clear の対象外 (従来どおり content preimage から除く)。`supersedes: []` は空配列への置換であり、clear (key 自体を除く) とは区別する | status を clear 可能にする案は、既定値への暗黙の降格を許すので採らない |
| D5 | 解決点 | 純関数 `resolveRevisionAdmission({ manifest, baseSource })` で 1 回だけ解決し、解決済み request を CLI の事前評価、runner の `assertAdmission`、binder、replay 照合の全てに渡す。CLI は runner deps 経由で検証済み base 本文を得る。replay は保存済み manifest と同じ base から解決し直し、初回と同じ admission / digest / 本文になることを照合する | runner だけで解決する案は、CLI の事前評価が継承前の request で拒否するため成立しない |
| D6 | 不適合と衝突 | 保存した値が新しい kind / layer / route で不適合になる場合 (例: design で禁止の `workflow_phase`、Forward 遷移で残る `issue`) は、自動で落とさず write 0 で fail-close し、明示 clear か置換を要求する。同じ key に値と clear を両方書いたら schema で拒否する。render 後の最終 frontmatter も schema 検査を通し、admission PASS だけで妥当とみなさない | 不適合な値を自動で落とす案は、「省略=保存」を条件付きで破るので採らない |

## 2. 凍結契約

1. manifest の `admission` で省略された D3 の key は、D2 の base 本文の値を引き継ぐ。base にその key が
   無ければ、従来どおり出力しない。
2. key を消す唯一の方法は、`admission.clear` にその key を書くことである。`clear` の要素は
   `workflow_phase` / `sub_doc` / `issue` / `supersedes` の enum に限る。`status` は clear できない。
3. 値の指定は常に置換である。`supersedes: []` は空配列への置換で、clear とは別の操作である。
4. 解決は D5 の 1 箇所で行い、CLI・runner・binder・replay は解決済み request だけを使う。
5. D6 の不適合・衝突と D3 の issue 不整合は、ledger / source / projection の write 0 で fail-close する。
6. `source.content` のうち route-owned 以外の key の扱いは変えない。

## 3. scope boundary

- 対象: `src/cli/plan-revise.ts` (manifest schema の `clear`)、`src/plan-admission/plan-content-binding.ts`、
  `src/plan-admission/node-plan-revision-runner.ts`、`src/plan-admission/plan-revision-command-assembler.ts`、
  新規の解決関数 1 本。
- 対象外: `plan draft` (新規 asset には base が無い)、control lane の manifest builder (#833 で是正済み)、
  PLAN-L6-105 / 106 / 107 の復旧 (#832 の是正 1。別の docs PR で行う)。

## 4. pair と candidate oracle

テストは既存の配置に合わせる。解決関数と binder は `tests/plan-content-binding.test.ts`、manifest schema と
CLI 接続は `tests/plan-revise-cli.test.ts`、write-set と replay は `tests/node-plan-revision-runner.test.ts` に置く。
ID は L7 add-impl が `docs/test-design/harness/L7-unit-test-design.md` に採番して freeze する。

| 候補 | 条件 | 期待 | 置き場 |
|---|---|---|---|
| C1 | base に `sub_doc: function-spec` があり、manifest が `sub_doc` を省略する | revise 後も `sub_doc: function-spec` が残る。保存処理を消すと RED | plan-content-binding |
| C2 | C1 と同じで `clear: ["sub_doc"]` | `sub_doc` が消える | plan-content-binding |
| C3 | `workflow_phase` / `supersedes` / `issue` / `status` のそれぞれで省略・置換・clear | 省略は保存、置換は新値、clear は消える。`status` の clear は schema で拒否 | plan-content-binding / plan-revise-cli |
| C4 | 未知 key の clear、重複、空配列、同一 key への値と clear の同時指定 | schema で拒否、write 0 | plan-revise-cli |
| C5 | base に `github_issue_id` があるが receipt に issue が無い、または値が一致しない | fail-close、write 0。明示 `issue` か clear で通る | node-plan-revision-runner |
| C6 | kind 変更で保存した `workflow_phase` が不適合になる。Forward 遷移で `issue` が残る | 自動で落とさず fail-close、write 0 | node-plan-revision-runner |
| C7 | `status` / `supersedes` を省略した manifest で CLI の事前評価を通す | 解決済み request で評価され、runner の `assertAdmission` と一致する | plan-revise-cli |
| C8 | 初回 revise の後に HEAD を進め、同じ command を replay する | 初回と同じ admission / content digest / 本文。現在 HEAD から継承すると RED | node-plan-revision-runner |
| C9 | `supersedes: []` と `clear: ["supersedes"]` | 前者は空配列、後者は key 無し | plan-content-binding |

`U-PA-BIND-001` は「admission が省略した key は base 値を保存し、clear した key だけ消える」へ改訂する。
`U-PA-BIND-003` (指定した supersedes は旧値を継承せず置換する) は維持する。
`src/lint/oracle-test-citation-baseline.ts` の該当 entry は L7 add-impl で同時に更新する。

## 5. 実測の根拠コマンド

- `grep -n "sub_doc: _priorSubDoc" src/plan-admission/plan-content-binding.ts` (削除箇所)
- `grep -n "U-PA-BIND-001" tests/plan-content-binding.test.ts` (削除を固定している oracle)
- `grep -n "evaluatePlanAdmission" src/cli/plan-revise.ts src/plan-admission/node-plan-revision-runner.ts` (評価 2 箇所)
- `grep -n "receipt.issue && fm.github_issue_id" src/schema/frontmatter.ts` (issue 照合の条件)

## 6. Schedule と出口

| Step | mode | 内容 |
|---|---|---|
| S1 | serial | 本 PLAN の契約を非著者 frontier reviewer (Codex Sol) が review し freeze する |
| S2 | serial | L7 add-impl PLAN と Reverse 対を起票し、C1-C9 を test-design に採番する |
| S3 | serial | 実装 PR (Codex worker)。#711 S3 と同じ revise 系の正本に触れるため、#711 と順序を合わせる |

出口: S1 の PASS で本 PLAN を confirmed にする。

## 7. 非 Scope

- `plan draft` の manifest の意味。
- route-owned 以外の frontmatter key の保存規則。

## 8. 記録

- 2026-10-05: 起票。advisor (gpt-6.1-sol) の 4 指摘を D2 / D3 / D5 / D6 に反映した。
