---
plan_id: PLAN-L7-465-cross-review-author-binding
title: "PLAN-L7-465 (add-impl): cross-review の申告を実 author へ binding — worker_model 自己申告の穴を塞ぐ (PLAN-L7-14 の後続)"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
parent_design: docs/plans/PLAN-L6-13-cross-review-enforcement.md
status: draft
created: 2026-07-28
updated: 2026-07-28
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - binding 元 (commit trailer / wrapper session log) の証拠力と偽装耐性のレビュー"
  - role: se
    slot_label: "SE - trailer / session log 照合の doctor gate 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-465-cross-review-author-binding.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-13-cross-review-enforcement.md
  requires:
    - docs/plans/PLAN-L7-14-cross-review-enforcement.md
  blocks: []
  references:
    - src/lint/review-evidence.ts
    - src/team/delegation-routing.ts
    - src/state-db/projection-writer.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-465 (add-impl): cross-review の申告を実 author へ binding

## 背景 (PO 要求 2026-07-28)

> review は実装や文書を書いていない family のモデルで上位モデルを使う。Codex が実装したら
> Claude が、Claude が実装したら Codex が、の構造を守る。これは Codex 側も対にできるか。

対称化の可否を実測したところ、**routing と証跡ゲートは既に対称**だが、
**土台に自己申告の穴**がある。

## 実測 (2026-07-28、コード確認済み)

1. **routing は両 provider 共有で対称**: `src/team/delegation-routing.ts` が
   `ut-tdd codex --role` / `ut-tdd claude --role` の双方で判断ゲート role を族内 frontier
   tier へ固定し、worker role は `selectTeamModel` の intent 推定へ流す。未登録 role は
   fail-close。→ **対称化のために新規実装は不要**。
2. **cross-review 証跡ゲートも provider 非対称ではない**:
   `checkCrossAgentModelPair(worker_model, reviewer_model)` が same_provider /
   same_model_or_missing / unknown_provider を検出し、doctor `review-evidence` hard gate に
   配線済み (PLAN-L7-14、IMP-076)。
3. **hook 面は既に対称だった** (初稿の記述を 2026-07-28 に訂正): `.codex/hooks.json`
   (PLAN-L7-139) が `spawn_agent|spawn_agents_on_csv` → `.claude/hooks/agent-guard.ts`、
   `apply_patch|write_file` → `work-guard.ts` を `blockOnFailure` 付きで配線し、Claude と
   **同一 entrypoint** を再利用している (SessionStart も配線済み)。Codex に surface が
   無いのは `SubagentStop` のみで genuinely N/A。
   ただし `AGENTS.md` は「agent-guard は Codex 未配線」と記述していて hook config と
   矛盾していた。本 PLAN と同じ変更で是正済み — **rulebook が自 runtime について誤情報を
   持つ状態自体が指示逸脱の原因**になるため、これは binding 問題と同根の負債である。
4. **共通の穴 = author identity の自己申告**: `worker_model` は PLAN に手書きされる値で、
   「実際に誰が authored したか」と binding されていない。申告が正しい前提のまま
   routing 対称も証跡ゲートも空転しうる。
5. **binding 元は実在する**: (a) git commit の author / `Co-Authored-By` trailer、
   (b) 正規委譲経路の session log — `ut-tdd codex` は `.ut-tdd/logs/session/codex-*.jsonl`
   を書き (実測 90 件)、`projectHookEvents` が `hook_events` へ投影する。
   **ただし session log に model フィールドは無い** → **provider 単位の照合は今日から可能、
   model 単位は不可**。

## スコープ

1. `review_evidence[].worker_model` が示す provider 族と、**実 author の provider 族**
   (commit trailer + 正規委譲経路の session log) の照合を doctor gate へ追加する。
   不一致は fail-close。
2. 照合不能 (trailer 欠落 / squash で消失 / session log 不在) は **warn ではなく
   `unverified` として明示 surface** する (「照合できなかった」を green に混ぜない)。
3. **利用上限による回避条項**: 担当 family が利用上限で停止していた場合のみ、
   `intra_runtime_subagent` へ格下げして通す。foreign-edit-override の先例に倣い
   非空理由 marker + one-shot 消費 + audit jsonl。空 marker は通さない。

## スコープ外

- Codex hook 面の追加配線 (実測 3 のとおり既に対称。SubagentStop のみ N/A)。
- model 単位の binding (session log に model が無いため。必要なら別 PLAN で
  session log スキーマ拡張を先に行う)。

## 誠実に明記する限界

- **trailer は偽装可能**。自己申告より一段固いだけであり、保証ではない。
- squash merge で trailer が消える経路があるため、`unverified` の扱い (スコープ 2) が
  実効の要になる。

## Schedule

- step 1 (serial): 照合仕様 (provider 族の導出規則、unverified の判定式) の freeze
- step 2 (serial): Red — 申告 provider ≠ 実 author provider を落とす負例テスト
- step 3 (serial): 実装 + doctor 配線 + 実 repo 実測 (既存 PLAN の照合結果)
- step 4 (serial): blind review (非 author provider) → confirm

## AC

- AC-1: 申告 `worker_model` の provider 族が実 author の provider 族と異なる PLAN を
  fail-close で検出する負例テストが green。
- AC-2: 照合不能ケースが `unverified` として surface され、**green に混ざらない**ことを
  テストで固定 (fail-open 化の禁止)。
- AC-3: 利用上限 marker が非空理由付きで one-shot 消費され audit へ記録されること、
  空 marker が通らないことをテストで固定。
- AC-4: 既存の cross-review gate (PLAN-L7-14 / IMP-076) の検出集合が縮まないことを
  テストで固定 (回帰 fence)。
