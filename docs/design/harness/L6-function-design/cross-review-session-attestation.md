---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: edge-case
artifact_role: topic_cross_review_session_attestation
pair_artifact: docs/test-design/harness/L7-cross-review-session-attestation-test-design.md
---

# cross-review セッション実在照合 gate 契約 (issue #131、未実装の目標契約)

> **実装状態**: 本書の契約は未実装である。2026-10-14 時点の `checkCrossAgentModelPair` (`review-evidence` hard gate) は
> `worker_model` / `reviewer_model` の provider 対だけを検査し、委譲の発火痕跡との照合は持たない。本書は PLAN-L6-94 から
> 還流した目標契約であり、oracle は `CANDIDATE-U-XREV-*` のまま、実装 PR で Red を置いてから昇格する。
> review 証跡の custody (request → verdict → receipt) を封印する経路は `src/cli/delegation.ts` にあり、本書はそれと
> 衝突しない範囲で、claim と痕跡の照合だけを足す。

## 1. 目的

hybrid の原則は「非著者 provider がレビューする」だが、以前はこれを prose ルールだけが担い、機械担保が無かった。
2026-07-22 の監査で次を実測した。

- `ut-tdd claude --role <role> --execute` 経路自体は正常に動く (claude CLI の spawn と応答を確認)。
- 一方、`.ut-tdd/logs/session/` のアダプタ発火痕跡は、`codex-*` (Claude から Codex への委譲) が高頻度なのに対し、
  `claude-*` (Codex から Claude への委譲) は 2026-07-15 を最後に発火していなかった。
- Codex がオーケストレーションする間、クロスレビュー原則が経路ごと素通りされている可能性が高い。

ルールの無視は行動層の問題で、config や routing では直せない。しかし claim と痕跡の照合は決定論的に機械化できる。
本書は「cross-runtime review を主張する evidence には、対応する委譲発火痕跡が実在する」ことを gate 契約として固定する
(`coding ≠ substance`: 主張ではなく実測痕跡が正本)。

## 2. 照合契約

対象は PLAN frontmatter の `review_evidence`、および gate 通過時の review 種別のうち、cross-runtime review
(例: `cross_runtime_blind_review`、hybrid の非著者 provider レビュー) を claim するエントリである。

| 検査 | 照合内容 | 違反時 |
|---|---|---|
| adapter-session-existence | claim が指す委譲実行に対応するアダプタセッション記録 (`.ut-tdd/logs/session/<provider>-<ts>.jsonl`、または harness.db 投影) が実在するか | violation (fail-close) |
| provider-direction-coherence | 痕跡の provider 方向が「非著者 provider がレビュー」と整合するか (Claude 著者の成果は `codex-*` 痕跡、Codex 著者は `claude-*` 痕跡) | violation |
| fallback-declaration | 単一ランタイム時の `intra_runtime_subagent` fallback が、痕跡種別を変えて明示 claim されているか (cross claim への偽装を検知) | violation |
| stale-direction-drift | 一定期間 (既定 7 日) 片方向のアダプタ発火がゼロのまま hybrid mode が継続していないか (経路素通りの早期警報) | warn |

不変条件:

1. **検知のみ、行動是正は対象外**。gate は claim を fail-close するだけで、Codex / Claude の挙動を変更も修復もしない
   (是正はルール側・運用側の責務)。
2. 突合キーは決定論的に導出できる形式 (session_id / plan_id / timestamp 域) で evidence 側スキーマに定義する。
   曖昧一致 (「近い時刻に何か走った」) で green にしない。
3. 痕跡ログの欠損・破損は「claim 不成立」側 (fail-close) に倒す。silent pass を作らない。
4. 監査スモーク等の非レビュー発火を痕跡として誤採用しない。role と plan_id の一致を突合キーに含める。

## 3. 範囲の境界と依存

- Codex に AGENTS.md ルールを守らせる仕組み (プロンプト強化、hook 強制) は対象外である。行動層の是正は別に扱い、
  本 gate はその成否を痕跡で可視化する側にある。
- アダプタ経路の環境不備 (spawn 不能等) は runtime-env 検査 (`runtime-env-doctor.md`) の領分である。
- 痕跡の読み口は既存の session-log (`session-log.md`) と harness.db 投影を再利用し、二重実装しない。これは
  責務 A (本 gate の照合) が責務 B (session-log の発火記録) の成果を読む実在の依存である。
- 既存 confirmed PLAN の evidence を遡及して fail させない。evidence 側の突合キー形式は既存スキーマと互換に定義し、
  移行方針を実装 PLAN に含める。

## 4. 受け入れ条件

- 上記 4 検査と不変条件 4 件を関数契約として固定する。
- 2026-07-22 の実測パターン (claude-* 方向が 7 日間ゼロ) を再現する fixture を warn として検出する。
- review_evidence 側の突合キー形式が既存スキーマ互換で定義される。
- 非著者 family の review が PASS し、L7 add-impl (+ Reverse back-fill 対) へ降下する。降下先は突合検査器
  (`src/lint/` または `src/doctor/` 配下、既存 gate 基盤へ配線)、evidence スキーマ拡張、テストである。

## 5. 検証の対

`docs/test-design/harness/L7-cross-review-session-attestation-test-design.md` (`CANDIDATE-U-XREV-001..007`)。
