---
plan_id: PLAN-L6-96-advisor-consensus-receipt-contract
title: "PLAN-L6-96 (add-design): 着手前 advisor 合意形成の receipt 契約 — orchestrator が Opus/Sonnet のときの機械強制 (PO 要求 2026-07-28)"
kind: add-design
layer: L6
drive: agent
route_signal: po_change
route_mode: add-feature
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: draft
created: 2026-07-28
updated: 2026-07-28
owner: PM / PO
agent_slots:
  - role: aim
    slot_label: "AIM - 強制点 (編集 hook / plan lint / doctor / CI) と receipt binding 最小集合の設計判断"
  - role: tl
    slot_label: "TL - ceremony 化 (中身の無い相談で receipt だけ発行) を抑止できるかの契約レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L6-96-advisor-consensus-receipt-contract.md
    artifact_type: markdown_doc
backprop_decision: not_required
backprop_decision_reason: "orchestration 運用ルールの機械強制契約であり、harness の L0/L1 要件と製品外部契約を変えない。実装は後続 L7 add-impl PLAN が Reverse pairing 付きで担う。"
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L3-07-design-decision-elicitation-format.md
    - src/team/advisor-policy.ts
    - src/plan/lint.ts
    - docs/governance/design-decision-elicitation.md
    - docs/plans/PLAN-L7-442-doctor-singleton-guard.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L6-96 (add-design): 着手前 advisor 合意形成の receipt 契約

## 背景 (PO 要求 2026-07-28)

> 設計・実装・修正の判断は、着手前に advisor (Fable) と合意形成する。これを Opus /
> Sonnet がオーケストレーションを担当するときに機械で厳格化できるか。

2026-07-28 の実運用で advisor 相談は 3 回使われ、うち 1 回は **初回推奨 (b) を実測の
差し戻しで撤回させ (a) に反転** させた (PLAN-L7-461 doctor 単一実行化の方式判断)。
相談の実効性は確認できているが、現状は運用者の自主性に依存しており機械強制がない。

## 現状の実測 (2026-07-28、コード確認済み)

1. `ut-tdd advisor --execute` は provider / model / effort / decision_kind を routing で
   決めて実相談する (`src/team/advisor-policy.ts`)。
2. **receipt が実質存在しない**: 残るのは
   `.ut-tdd/logs/session/advisor-<provider>-<ts>.jsonl` の 3 行で、フィールドは
   `ts / session_id / plan_id / event_type / tool / target / outcome` のみ。
   **問い・選択肢・回答・採択結果・実測根拠を一切 binding していない**。
   このままゲート条件にすると「相談したフリ」(ceremony) が通る。
3. **`aim` slot 必須は `poc` / `recovery` / `troubleshoot` のみ**
   (`src/plan/lint.ts` の `requiredAgentRoleViolations`)。`design` / `add-design` /
   `add-impl` / `impl` / `refactor` には掛かっていない。よって
   **「aim slot を持つ PLAN」を強制条件にすると slot を外して回避できる** (自己申告)。
4. 流用できる先例: (i) `agent-guard` = subagent の model floor を fail-close 強制、
   (ii) foreign-edit-override = 一回限り marker + 理由必須 + audit jsonl、
   (iii) PLAN の `admission_receipt` = source_digest / decision_digest / receipt_digest /
   binding{path, plan_id, revision, content_digest} / route という**内容 binding 付き
   receipt の実装済み先例**。

## 設計判断 (advisor: claude-fable-5、2026-07-28)

### 強制点: PLAN lint + doctor を一次、CI は再実行のみ。編集 hook は不採用

- 採択: **(B) `ut-tdd plan lint` + doctor check で「対象 kind の PLAN は advisor receipt
  id を引用した設計判断節を必須」**。(D) 有効化条件は orchestrator の model tier が
  Opus / Sonnet のとき。(C) CI は同 check の再実行のみとし、CI 側に新ロジックを置かない。
- 却下: **(A) 編集 hook (`PreToolUse(Edit|Write|MultiEdit)`) で src/ 編集を block**。
  編集単位では「trade-off が実在する方式選択」と「自明な修正」を機械判別できず、
  全編集を止めれば摩擦が実装速度を殺す。線引き不能が却下理由。

### 対象の線引き: kind をキーにする (aim slot ではなく)

「trade-off 実在」の機械判定は不能なので proxy が要る。advisor は `kind` + `aim` slot の
併用を推したが、上記実測 3 のとおり aim slot は自己申告で回避可能なため、
**本契約は `kind` を一次キーとする**。対象 kind (初期案): `design` / `add-design` /
`add-impl` / `refactor` / `troubleshoot` / `recovery` / `poc`。あわせて
`requiredAgentRoleViolations` の aim 必須 kind 集合を対象 kind に合わせて拡張する
(slot を外す回避経路を塞ぐ)。

### receipt が binding すべき最小集合 (ceremony 対策の核)

`admission_receipt` の型を流用し、最低限:

- `question_digest` — 諮問文の digest
- `options[]` — 提示した選択肢 (2 件以上、単一選択肢の「諮問」を弾く)
- `advisor_recommendation` — advisor が推した選択肢
- `adopted_decision` — 実際に採択した選択肢
- `divergence` — `accept` | `override`
- `evidence_refs[]` — **`override` のときのみ必須** (実測・run URL・テスト名)
- `binding` — `{ plan_id, content_digest }`
- `provider` / `model` / `route` / `ts`

実測 citation を全件必須にはしない (捏造 citation を誘発するため)。今日の実例の価値は
「反転が evidence で駆動された」点にあり、それは `divergence` + override 時 citation で
機械化できる。

### advisor 不通・レート制限時

foreign-edit-override の先例をそのまま適用する: **fail-close だが一回限り marker +
理由必須 + audit jsonl + doctor 事後 warn**。全停止も silent bypass も避ける。

## 既知の限界 (誠実に明記する)

1. digest 照合は **抑止であって保証ではない**。「形式的に埋めた薄い相談」は防げない
   (`coding ≠ substance`、PLAN-L7-89 claim discipline と同じ限界)。
2. PLAN を書かない直編集には無力。work-guard 側の PLAN 紐付けとの接続が前提であり、
   本契約単体では穴が残る (接続は L7 実装 PLAN の責務)。
3. 対象 kind を広げるほど摩擦が増える。初期は上記 kind 集合で開始し、実測 (相談回数 /
   override 率 / 所要時間) を見て調整する。

## スコープ

1. receipt schema (上記フィールド) の型定義と digest 規則の契約。
2. 対象 kind 集合と、`requiredAgentRoleViolations` の aim 必須 kind 拡張の契約。
3. orchestrator tier 条件 (Opus / Sonnet で有効) の判定入力の契約。
4. 不通時 marker の形式・audit 先・doctor での事後可視化の契約。

## スコープ外

- 実装 (L7 add-impl PLAN + Reverse pairing で行う)。
- advisor の provider routing 自体の変更。
- 編集 hook 側での強制 (却下済み)。

## Schedule

- step 1 (serial): receipt schema と対象 kind 集合の freeze (本 PLAN)
- step 2 (serial): PO 採択 (対象 kind と摩擦許容度は PO 判断)
- step 3 (serial): L7 add-impl PLAN + Reverse pairing の起票 → Red から実装

## AC

- AC-1: receipt schema が型として定義され、必須フィールド欠落・`options` 1 件以下・
  `override` かつ `evidence_refs` 空 を落とす負例テストが green (fail-close)。
- AC-2: `binding.content_digest` が PLAN 本文と不一致の receipt を落とす負例テストが
  green (「別件の receipt を使い回す」経路の遮断)。
- AC-3: 対象 kind の PLAN が receipt 引用なしで lint を通らないことをテストで固定し、
  対象外 kind は従来どおり通ることも固定 (過剰強制の回帰防止)。
- AC-4: advisor 不通時に marker + 理由で 1 回だけ通過し、marker が消費され、audit
  jsonl に記録されることをテストで固定 (空 marker は通さない)。
