---
plan_id: PLAN-L6-94-cross-review-session-attestation
title: "PLAN-L6-94 (add-design/function-spec): cross-review セッション実在照合 — hybrid
  クロスレビュー claim をアダプタ発火痕跡と機械照合する gate 契約"
kind: add-design
layer: L6
drive: be
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-22
updated: 2026-07-22
owner: PO / Claude (Fable orchestrator)
parent_design: docs/plans/PLAN-L6-01-function-spec.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - claim↔痕跡照合の責務境界と fail-close 条件 (行動是正は対象外、検知のみ)"
  - role: se
    slot_label: "SE - review_evidence とアダプタセッション/DB 記録の突合キー設計"
  - role: qa
    slot_label: "QA - 痕跡なし claim の Red oracle と正当な単一ランタイム fallback の負例"
generates:
  - artifact_path: docs/plans/PLAN-L6-94-cross-review-session-attestation.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-01-function-spec.md
  requires: []
  references:
    - docs/plans/PLAN-L6-53-adversarial-review-mechanism.md
    - docs/plans/PLAN-DISCOVERY-06-orchestrator-rule-parity.md
    - docs/plans/PLAN-L7-255-delegation-model-routing.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
  blocks: []
review_evidence: []
status: draft
sub_doc: edge-case
---

# PLAN-L6-94: cross-review セッション実在照合 gate

対応 issue: #131 (hybrid: Codex 側から ut-tdd claude 委譲が発火せずクロスレビュー
原則が素通り)。

## 1. 目的と実測根拠 (2026-07-22 監査)

hybrid の原則は「非著者 provider がレビューする」だが、これは現状 **prose ルール
(AGENTS.md / CLAUDE.md) のみで機械担保がない**。2026-07-22 の監査で次を実測した:

1. `ut-tdd claude --role <role> --execute` 経路自体は正常 (同日スモークで claude CLI
   spawn + 応答を確認。Windows `.cmd` 解決、routing 固定とも設計どおり)。
2. 一方 `.ut-tdd/logs/session/` のアダプタ発火痕跡は、`codex-*` (Claude→Codex 委譲)
   が直近まで高頻度なのに対し、`claude-*` (Codex→Claude 委譲) は 2026-07-15 を最後に
   発火なし (07-22 の 1 件は監査スモーク)。
3. すなわち Codex オーケストレーション時、クロスレビュー原則が経路ごと素通りされて
   いる可能性が高い。ルール無視は行動層の問題であり config/routing では直せないが、
   **claim と痕跡の照合は決定論的に機械化できる**。

本 PLAN は「cross-runtime review を主張する evidence には対応する委譲発火痕跡が実在
すること」を gate 契約として固定する (coding ≠ substance: 主張でなく実測痕跡が正本)。

## 2. 照合契約 (function-spec)

対象: PLAN frontmatter `review_evidence` および gate 通過時の review 種別のうち、
cross-runtime review (例: `cross_runtime_blind_review`、hybrid の非著者 provider
レビュー) を claim するエントリ。

| 検査 | 照合内容 | 違反時 |
|---|---|---|
| adapter-session-existence | claim が指す委譲実行に対応するアダプタセッション記録 (`.ut-tdd/logs/session/<provider>-<ts>.jsonl` または harness.db 投影) が実在するか | violation (fail-close) |
| provider-direction-coherence | 痕跡の provider 方向が「非著者 provider がレビュー」と整合するか (Claude 著者の成果 → `codex-*` 痕跡、Codex 著者 → `claude-*` 痕跡) | violation |
| fallback-declaration | 単一ランタイム時の `intra_runtime_subagent` fallback は痕跡種別を変えて明示 claim されているか (cross claim への偽装を検知) | violation |
| stale-direction-drift | 一定期間 (既定 7 日) 片方向のアダプタ発火がゼロのまま hybrid mode が継続していないか (経路素通りの早期警報。2026-07-22 実測パターン) | warn |

不変条件:

1. **検知のみ、行動是正は対象外**。gate は claim を fail-close するだけで、Codex /
   Claude の挙動そのものを変更・修復しない (是正はルール側・運用側の責務)。
2. 突合キーは決定論的に導出できる形式 (session_id / plan_id / timestamp 域) で
   evidence 側スキーマに定義する。曖昧一致 (「近い時刻に何か走った」) で green に
   しない。
3. 痕跡ログの欠損・破損は「claim 不成立」side (fail-close) に倒す。silent pass 禁止。
4. 監査スモーク等の非レビュー発火を痕跡として誤採用しない (role / plan_id の一致を
   突合キーに含める)。

## 3. スコープ境界

- Codex に AGENTS.md ルールを守らせる仕組み (プロンプト強化・hook 強制) は本 PLAN の
  対象外。行動層の是正は別途扱い、本 gate はその成否を痕跡で可視化する側。
- アダプタ経路の環境不備 (spawn 不能等) は PLAN-L6-95 runtime-env 検査の領分。

## 4. L6↔L7 pair / oracle

L7 test-design に `U-XREV-*` を追加し、少なくとも次を固定する。

1. 痕跡なしの cross-runtime claim fixture が violation として検出される (Red)。
2. provider 方向が逆 (著者と同族の痕跡) の fixture が violation として検出される。
3. 正当な痕跡付き claim fixture が green (誤検知負例)。
4. `intra_runtime_subagent` fallback の明示 claim が green、cross claim へ偽装した
   fixture が violation。
5. 痕跡ログ破損 fixture が fail-close (claim 不成立) となる。
6. 監査スモーク痕跡 (role/plan 不一致) が突合に誤採用されない。

## 5. AC

- [ ] 照合契約 (§2 の 4 検査 + 不変条件 4 件) が function-spec として固定される。
- [ ] 2026-07-22 実測パターン (claude-* 方向 7 日間ゼロ) を再現する fixture が
      `U-XREV-*` で warn 検出される。
- [ ] review_evidence 側の突合キー形式が既存スキーマ互換で定義される (既存 confirmed
      PLAN の evidence を遡及 fail させない移行方針を含む)。
- [ ] cross-runtime blind review PASS、L7 実装 PLAN (add-impl + Reverse pairing) を
      経て confirmed 化する。

## 6. 降下先

L7 実装 (add-impl、Reverse back-fill 対で起票): 突合検査器 (`src/lint/` または
`src/doctor/` 配下、既存 gate 基盤へ配線)、evidence スキーマ拡張、`U-XREV-*` テスト。
アダプタセッション記録の読み口は既存 session-log / harness.db 投影を再利用し二重実装
しない。
