---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_advisor_consultation_telemetry
pair_artifact: docs/test-design/harness/L7-advisor-consultation-telemetry-test-design.md
---

# advisor 相談の発火 telemetry と不在検知 (条件付き保留、未実装の目標契約)

> **状態: 条件付き保留 (PO 判断 2026-07-28)**。本書の機構は着手しない。先に運用ルールだけを置いた
> (`.claude/CLAUDE.md` §着手前 advisor 合意形成)。機構 (telemetry + 不在検知) は、ルールが守られないと実測が示した場合に
> だけ着手する。着手の発火条件と spot-check コマンドは `.claude/CLAUDE.md` が正本であり、本書には複製しない。
> 本書は、その条件が満たされたときに実装する設計の記録である (PLAN-L6-96 から還流した)。oracle は
> `CANDIDATE-U-ADVTEL-*` のまま、着手時に Red を置いてから昇格する。

## 1. 保留の理由

- 相談 baseline は 16 発火 / 10 PLAN (841 PLAN 中、2026-07-28 実測) であり、機構の実効性が現状を上回る証拠がない。
- 本 repo は warn が恒久的に無視される失敗モードを実測済みである (`unresolved-join` 621 件、`stale-runtime-plan-context` 3115 件)。
  不在検知 warn も同じ死に方をする公算が高い。
- 発火ログは既に存在してクエリできる。「気づく手段が無い」のではなく「手段はあるが見ない」状態であり、spot-check の運用固定で足りる。

## 2. 実測した現状 (2026-07-28)

1. 発火ログは既に存在し、harness.db へ投影済みである。`ut-tdd advisor` の実行は
   `.ut-tdd/logs/session/advisor-<provider>-<ts>.jsonl` (session_start / tool_use / session_end) を書き、
   `src/state-db/projection-writer.ts` の `projectHookEvents` が `hook_events` テーブルへ投影する
   (`event_id` / `session_id` / `plan_id` / `hook_name` / `event_type` / `occurred_at` / `digest` (outcome) / `evidence_path`)。
   session_id が `advisor-` prefix を持つため、advisor 発火はクエリできる。
2. 不足は 3 点だけである。
   - row に `tool=advisor`、provider、model、decision_kind が載らない (hook_name が `PostToolUse` に丸められる)。
   - 不在検知が無い (設計判断節に 2 案以上を記録した PLAN が、advisor 発火ゼロで confirm されても signal が出ない)。
   - 集計が無い (相談率、override 率、相談から着手までの時間)。

## 3. 設計判断 (advisor `claude-fable-5`、2026-07-28)

1. **計測、実測、必要な面だけ fail-close の順に固定する**。本機構では fail-close ゲートを作らない。作るのは telemetry、
   不在検知 (warn)、出口条項 (§3.4) である。fail-close への昇格は、計測窓の実測を PO に提示したうえで別 PLAN で判断する。
   当初の第一案 (receipt binding + plan lint / doctor の fail-close) は、PO の「証拠を残すというより発火ログを測ったほうがいい」
   という指摘で転換した。未計測のまま fail-close を建てることは、必要性を実証しない過剰機構化の型である。
2. **新規 receipt 成果物は作らず、既存 session jsonl を最小拡張する**。advisor session jsonl の `tool_use` 行に構造化フィールドを
   追記し、projection で列へ昇格する。これは receipt 契約ではなく telemetry スキーマ定義である。
   最小フィールドは `decision_kind` / `provider` / `model` / `current_model` / `question_digest` / `adopted_decision` /
   `divergence` (`accept` | `override`)。選択肢全文の binding は行わない (ログ本文に残るため事後に照会できる)。
3. **不在検知は invocation fence と同型にする**。「到達可能でテスト済みだが runtime path で一度も発火しない」という
   absence-blindness の検出には先例がある (PLAN-L7-95 の invocation fence)。「設計判断節に 2 案以上の方式と trade-off を
   記録した PLAN が advisor 発火ゼロで confirm される」も同型であり、到達可能性ではなく発火事実を数える。
4. **warn 飢餓を避ける出口条項** (これが無いなら warn-first を導入しない)。
   - (a) 不在 warn は蓄積型 feedback list に流さず、confirm / merge の地点で点として surface する。
   - (b) 計測窓は 4 週間 (2026-07-28 起点)。窓の経過時点で相談率と override 率の実測を PO へ提示し、fail-close 昇格か warn 撤去かを
     必ず判断する。判断されないまま warn が継続する状態を許さない。

## 4. 契約の範囲

含む:

1. advisor session jsonl の telemetry フィールド追記 (§3.2)。
2. projection での列昇格 (`hook_events` 拡張、または専用 projection)。
3. 不在検知 signal の定義 (対象 PLAN、判定式、surface 地点 = confirm / merge)。
4. 集計 surface (相談率、override 率) と、出口条項 (§3.4 b) の明文化。

含まない:

- fail-close ゲート (計測窓の実測を経て別 PLAN)。
- 編集 hook での強制 (編集単位では trade-off の実在を機械判別できないため却下)。
- advisor の provider routing 自体の変更。

## 5. 受け入れ条件

- advisor 実行が telemetry フィールド付きで記録され、projection 後に「相談率 (設計判断節に 2 案以上の方式と trade-off を
  記録した PLAN のうち、発火 1 件以上を持つ割合)」を実測クエリできる。before baseline として 16 発火 / 10 PLAN (841 PLAN 中) を引用する。
- 上記の対象 PLAN が advisor 発火ゼロで confirm される事象を検出する負例テストが green になる (発火事実を数える)。
- 不在 warn が蓄積型 feedback list ではなく、confirm / merge の地点で surface されることをテストで固定する。
- 計測窓の期限が機械可読な形で宣言され、期限超過時に「PO 判断未実施」を検出できる (出口条項の空文化を防ぐ)。
- 本機構の範囲では既存 workflow を fail-close させない (過剰強制の回帰防止をテストで固定する)。

## 6. 検証の対

`docs/test-design/harness/L7-advisor-consultation-telemetry-test-design.md` (`CANDIDATE-U-ADVTEL-001..005`)。
