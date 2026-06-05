---
plan_id: PLAN-L6-04-forced-stop-feedback
title: "PLAN-L6-04 (add-design): forced-stop フィードバック機能設計 — 強制停止推定 + フィードバックログ + Haiku 意味解析 (ut-tdd feedback classify) + Recovery 起票提示"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-02
updated: 2026-06-02
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 関数 signature / DbC / 分類契約 / fail-open / hook↔subcommand 責務分離のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/forced-stop-feedback.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-03-session-log.md
  requires:
    - docs/plans/PLAN-L6-03-session-log.md
  blocks: []
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-02"
    tests_green_at: "2026-06-02"
    verdict: approve
    scope: "code-reviewer APPROVE (Critical 0)。関数 signature/DbC/分類契約/fail-open/hook↔subcommand 責務分離 (handover 2026-06-02c §5)"
---

# PLAN-L6-04 (add-design): forced-stop フィードバック機能設計

## §0 位置づけ

session-log (PLAN-L6-03 / L7-01) の観測機構を土台に、**ユーザー強制停止 (ESC/Ctrl+C/Stop) を高 severity の負シグナルとして捕捉し、是正フィードバックを記録 → アテンション強度で Recovery 起票を提示する**機能を **Add-feature (経路3)** として足す設計差分。`kind=add-design` (L6 機能設計粒度) で関数 signature + DbC + 分類契約 + ③ 単体テスト設計を確定し、`PLAN-L7-02-forced-stop-feedback` (add-impl) が実装する。**bottom-up build → 後段 Reverse (R0-R4) で L0 concept §2.6.1 / L3 要件 / recovery 正本へ back-fill** する (PO 2026-06-02、[[feedback_addfeature_bottomup_reverse_backfill]])。

- 親設計: `PLAN-L6-03-session-log` (session-log は本機能の検出土台。dangling-turn 判定を session-log の event 列に足す)。drive=fullstack (親一致)。
- 駆動モデル: **Add-feature**。Recovery (concept §2.5 AI 逸脱・暴走対応) への発火導線を新設する。
- PO 確定事項 ([[feedback_forced_stop_high_severity_recovery]]): ①強制停止=最高 severity の `agent_runaway` 級 / ②自動起票はしない・提示まで自動 / ③間違え系はフィードバックに残さない / ④意味解析は Haiku サブコマンドへ分離 (決定論 hook でやらない)。

## §1 要求 (この機能が満たすこと)

1. **強制停止の推定検出**: Claude Code は強制停止専用 hook を持たない (公式 `Stop` は user interrupt で発火しない / feature request #9516 open) ため、**session-log の event 列で「`tool_use` 等が記録されたが `session_end`(Stop) で閉じていないターン = dangling turn」を次ターン/session 開始時に推定**する。fail-open hook は dumb に検出 + 生記録のみ。
2. **意味解析 (Haiku サブコマンド)**: 停止後の次メッセージを `ut-tdd feedback classify` が **managed pmo-haiku** で分類 → `{ category: "mistake" | "feedback", attention: "low" | "high", reason }`。決定論 hook では判定しない。
3. **フィードバックログ記載 (是正のみ)**: `category="feedback"` (AI やらかし) のみ durable な **フィードバックログ**に記載。`category="mistake"` (ユーザー誤操作/気変わり) は**記載しない**。記載時は `sanitize`/要約 (PII/secret/生文を残さない)。
4. **Recovery 起票提示**: `feedback` かつ `attention="high"` (罵倒/強否定/同論点で連続停止) のとき、次ターン/session 開始時に agent がフィードバックログを読み **Recovery 起票をユーザーへ提示**。yes で起票 (起動は人間サインオフ、Recovery §2.6.3)。自動起票しない。
5. **fail-OPEN**: 検出・記録は session-log と同じく作業を止めない (常に exit 0)。分類 subcommand 失敗時も既定で「未分類のまま生記録に残す」= 取りこぼし回避 (曖昧時は是正寄りに倒す)。

## §2 機能設計 (L6 粒度、generates: forced-stop-feedback.md に詳細)

### §2.1 責務分離 (PO 確定: hook は dumb、判断は Haiku)

| 層 | 責務 | 失敗方針 |
|----|------|---------|
| fail-open hook (session-log 拡張) | dangling-turn 推定 + 停止後メッセージの生記録 (`forced_stop` event)。判断も API も持たない | fail-open (exit 0) |
| `ut-tdd feedback classify` subcommand | 停止後メッセージ → 分類リクエスト emit / 分類結果の記録。意味判定は **managed pmo-haiku** に委譲 (raw API 直叩きしない、CLAUDE.md 準拠) | 失敗=未分類で残す |
| agent (次ターン/session 開始) | フィードバックログを読み、`feedback`+`high` を Recovery 起票として能動提示 → 人間 yes で起票 | — |

### §2.2 型 schema (D-CONTRACT)

```text
ForcedStopEvent (session-log SessionEvent に event_type="forced_stop" を追加) = {
  ts, session_id, plan_id, event_type: "forced_stop",
  dangling_from: string,   # 推定: 最後に閉じなかったターンの起点 ts
  next_message_ref?: string,  # 停止後メッセージの生ログ参照 (jsonl の id/offset、本文は載せない)
}
FeedbackEntry (durable, フィードバックログ) = {
  ts, session_id, plan_id,
  category: "feedback",          # mistake は記載しない (= entry を作らない)
  attention: "low" | "high",
  summary: string,               # sanitize + 120字要約。生文は残さない
  recovery_proposed: boolean,    # high で提示対象になったか
  reason: string,                # 分類根拠 (Haiku 出力の要約)
  resolved_at?: string,          # 対応済 ISO8601。undefined=未対応 (pendingRecoveryProposals の判定キー)
}
ClassifyResult (subcommand I/O) = { category, attention, reason }
```

### §2.3 関数 signature (src/runtime/forced-stop.ts + session-log 拡張 + src/cli)

| 関数 | signature | DbC |
|------|-----------|-----|
| `detectDanglingTurn` | `(events: SessionEvent[]) => { dangling: boolean; from: string \| null }` | **純関数**。最後の `session_end` 以降に `tool_use`/`user_prompt` があれば dangling。なければ false |
| `recordForcedStop` | `(params: ForcedStopParams, deps) => void` | **never throws (fail-open)**。`params={session_id?,plan_id?,dangling_from,next_message_ref?}`。`forced_stop` event を session 生ログへ append (本文非掲載、参照のみ) |
| `recordFeedback` | `(result: ClassifyResult, ctx: FeedbackCtx, deps) => void` | `result.category="feedback"` のみ append (`ClassifyResult`+`ctx`→`FeedbackEntry` 変換を内部で担う、`recovery_proposed=attention==="high"`、sanitize)。mistake は no-op。`plan_id=null` skip。idempotent (ts キー) |
| `classifyFeedback` | `(text: string, classifier: Classifier) => Promise<ClassifyResult>` | 非同期。`Classifier` = 注入 (既定 = managed pmo-haiku adapter、test = mock)。失敗時は `{category:"feedback", attention:"low", reason:"unclassified"}` (取りこぼし回避) |
| `pendingRecoveryProposals` | `(deps) => FeedbackEntry[]` | フィードバックログから `recovery_proposed && resolved_at===undefined` を返す。不正 JSON 行はスキップ。agent が起動時に読む |

`Classifier` インターフェース = `(text) => ClassifyResult`。**raw API を持たず** managed agent 経路 (pmo-haiku) を adapter 化 (CLAUDE.md「API 直叩き禁止・契約 + CLI/hook で管理」)。

### §2.4 ストレージ / hook 配線

- 生 `forced_stop` event: session-log の `.ut-tdd/logs/session/<session_id>.jsonl` に同居 (gitignored)
- フィードバックログ: `.ut-tdd/logs/feedback/<plan_id>.jsonl` (gitignored、durable、是正のみ)
- hook: session-log の既存 `SessionStart`/`Stop` handler に dangling-turn 推定を**追加** (新規 hook は足さない)。分類は hook でなく subcommand。
- subcommand: `ut-tdd feedback classify`（CLI 新設、`src/cli`）。

### §2.5 fail-open + 取りこぼし回避

session-log と同じ fail-OPEN。さらに分類の曖昧時は **`feedback` 寄りに倒す** (false-negative で本物のやらかし signal を捨てない、強制停止 default=やらかし側、[[feedback_forced_stop_high_severity_recovery]])。`mistake` 確定時のみ破棄。

## §3 ③ 単体テスト設計 (generates: L7-unit-test-design.md §1.6、pair G7)

| U-ID | 対象 | DoD |
|------|------|-----|
| U-FSF-001 | `detectDanglingTurn` | session_end で閉じたターン=false / tool_use 後に session_end 無し=dangling true + from |
| U-FSF-002 | `recordForcedStop` | 正常 append / 不正入力でも throw せず (fail-open) |
| U-FSF-003 | `classifyFeedback` | mock classifier で mistake/feedback/attention 反映 / classifier 失敗時 feedback+low+unclassified に倒す (取りこぼし回避) |
| U-FSF-004 | `recordFeedback` | category=feedback のみ記載 / category=mistake は no-op / ts idempotent / summary は sanitize 済 |
| U-FSF-005 | `pendingRecoveryProposals` | recovery_proposed && 未対応のみ返す / 空時 [] |

## §工程表

### Step 1: 機能設計 doc 起草
`docs/design/harness/L6-function-design/forced-stop-feedback.md` に §2 の責務分離 + 型 + 関数 signature + DbC + ストレージ + fail-open/取りこぼし方針を記述。session-log.md からの拡張点 (forced_stop event 追加・SessionStart/Stop handler 追記) を明記。

### Step 2: ③ 単体テスト設計
`docs/test-design/harness/L7-unit-test-design.md` に §1.6 U-FSF-001..005 を追記 (① 設計とペア)。

### Step 3: review (self-review 前置 MUST)
claude-only のため `code-reviewer` (Senior Staff、TL 代替) で signature/DbC/責務分離/fail-open/分類契約/秘匿原則をレビュー。cross-agent 不在を記録 ([[feedback_ts_native_over_helix_cli]])。

### Step 4: 命名テスト + 全回帰
`npx vitest run tests/plan-id-naming.test.ts` + `npx vitest run`。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| dangling-turn 推定の根拠 | Claude Code hook 仕様 (Stop は user interrupt で発火しない、#9516)。session-log の event 列で推定 |
| 強制停止=high severity / 発火境界 | PO 確定 [[feedback_forced_stop_high_severity_recovery]] (提示まで自動・起動は人間 / mistake は非記載 / Haiku 分類) |
| 関数 signature / DbC | session-log.ts パターン踏襲 (deps 注入・純関数分離・fail-open) |
| Classifier 委譲先 | managed pmo-haiku (allowlist 内 haiku agent)。raw API 不可 (CLAUDE.md) |
| 秘匿 (summary) | session-log `sanitize()` 再利用 (token/key/secret マスク + 120字)。生文・PII を残さない (CLAUDE.md 禁止事項) |
| Recovery 接続 | concept §2.5 Recovery / §2.6.1 signal→mode (後段 Reverse で forced_stop signal を正本化) |

## §6 用語更新 (§G.9 living glossary)

| 用語 | 定義 | 導入層 |
|------|------|--------|
| 強制停止 (forced stop) | ユーザーによる応答中断 (ESC/Ctrl+C/Stop)。専用 hook が無く dangling-turn で推定。高 severity の負シグナル | L6 |
| dangling turn | session_end (Stop) で閉じずに途切れたターン。強制停止の推定根拠 | L6 |
| フィードバックログ (feedback log) | AI やらかしの是正フィードバックのみを durable 記録する log。間違え系は記載しない | L6 |
| アテンション強度 (attention) | フィードバックの強さ (high=罵倒/強否定/連続停止)。Recovery 起票提示の閾値 | L6 |

→ L0 §10 用語集へ back-merge (§G.9)、後段 Reverse で concept §2.6.1 signal と整合。

## §7 成否

- generates 2 件 (forced-stop-feedback.md / L7-unit-test-design.md §1.6 追記) が揃い ①⇔③ ペア成立 (G6 pair freeze 対象)
- code-reviewer self-review APPROVE (Critical 0)
- 命名テスト + 全回帰 pass
- 後段 `PLAN-L7-02-forced-stop-feedback` (add-impl) へ接続、最終的に Reverse で L0 concept §2.6.1 / L3 要件 / recovery 正本へ back-fill (PO 方針)
