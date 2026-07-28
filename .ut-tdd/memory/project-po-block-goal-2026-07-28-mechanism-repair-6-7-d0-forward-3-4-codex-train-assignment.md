---
memory_id: memory:project:po-block-goal-2026-07-28-mechanism-repair-6-7-d0-forward-3-4-codex-train-assignment
kind: project
title: "PO block goal 2026-07-28: mechanism-repair 6-7 / D0 forward 3-4, codex train assignment"
tags: ["2026-07-28", "advisor-fable", "codex-goal", "triage"]
updated_at: 2026-07-28T09:07:44.115Z
---

2026-07-28 の稼働ブロック方針を PO 指示 + advisor (claude-fable-5、2 巡) + 実測で確定した。
主軸は **Forward を壊す/汚す機構系 issue の刈り込み 6-7 割 + #149 Resource Kernel D0 Forward 3-4 割**の混成。
「issue 全面刈り込み」も「Forward ガン攻め」も単独では採らない。

## 判断根拠 (実測、2026-07-28)

- open issue 29 件の idle は最大 11 日 (#77)、5 日以下が 27 件 → **腐った issue は無い**。
  「stale だから close」という刈り込み根拠は使えない。
- draft 210 件のうち 206 件は 2026-07 起票 (残骸ではない)。confirmed/completed の updated は
  2026-07 が 225 件 → 消化 ≈ 起票で **フローは破綻していない**。
- 対整合の機械検査: add-impl 148 件のうち **Reverse 未対 0 件**、reverse 165 件のうち
  **dangling parent 0 件** (parent null 29 件は requires 側で対を満たす旧起票、最新 2026-07-08)。
  → pairing 機構は実効している。
- L8-L14 の単発 draft 7 件は schema drift ではなく **engine-swap の検証帯 (V 右側)**
  (PLAN-L8-01〜L14-01、2026-07-10 起票)。Forward freeze 待ちで正常。
- 結論: **draft/issue の一括トリアージは棄却**。滞留ではなく活動中 backlog。工数は機構修理へ。

## Codex レーンのゴール (train 単位、1 修理 = 1 PR、2〜4 PR/train)

- **train 1 (最優先): PLAN-ID 衝突クラスタ + oracle 導出化** — #163 (uniqueness キーが full plan_id
  のため番号衝突が lint を素通り) / #145 (27 件の numeric-core 衝突) / #128 (L7-421 衝突の
  revision/rekey)。あわせて **#146 の linux 赤 2 件を機械修理**:
  (a) `U-PA-042` の `total: 848` ハードコード期待は**数値書き換えで直さず導出値にする**
  (数字を書き換えるだけだと同型のずれが恒久再発する)、
  (b) `design-language` english prose 4 件 (function-spec.md:1413/1414/1475/1476)。
- **train 2: doctor / snapshot 固定費** — #70 (doctor full 10 分超) / #98 (snapshot runner 固定費) /
  #77 (snapshot fence が相手ランタイム活動を誤帰責)。**最初のタスクは check 別プロファイル取得で、
  修理ではない** (内訳未実測のまま触ると対象を外す)。
- **train 3: DB 資源** — #124 (Stop db-refresh の上限) / #169 (4.4GB 残置)。PLAN 側は PR #173
  (L7-460 スコープ 7 HEAD 刻印 / 8 atomic swap) で先行済み。

## 今ブロックは触らない (明示凍結)

- **#134 (Bun 撤退 → Node+Rust)**: ADR-001 を覆す PO 判断案件。PO 指示が無いため寝かせ確定。
  やるなら timebox 付き design spike 1 本まで。
- #141 (OneDrive/worktree 配置) / #152 (PR train 分割): 方式判断が先。
- #108 (L 別検証契約): #149 D0 に接続するなら同レーンへ吸収。

## ゴールに載せる不変条件 (close 条件の機械検証に加えて 4 点)

1. **path 面の宣言分離**: train 開始時に触るファイル集合を宣言する。Claude 側の作業面
   (#149 の対象群 + doctor 単一実行化 = `src/cli.ts` の doctor 経路 / singleton lock 周辺 /
   `tests/doctor.test.ts` / `.github/workflows/harness-check.yml`) は**禁止面**。
   foreign-edit guard は未コミット foreign しか守らないため、同一ファイルへの独立コミット競合は
   guard では防げない (宣言ベースの切り分けが必須)。
2. **`ut-tdd doctor` full を起動しない** (scoped / 直接 check 関数のみ)。Claude が singleton 機構
   自体を触る間、exit 2 の retry storm と衝突の両リスクがある (PLAN-L7-442 規律)。
3. **net-new draft 起票ゼロ**: 山を測っている最中に山を増やさない。既存 PLAN 拡張のみ。
   supersede する場合は双方向参照必須 (`plan-supersession` が fail-close する形)。
4. **gate 失敗時は停止して HEAD 基準で報告**: close 条件不成立の issue をスキップして次へ進む
   「進捗最大化」挙動を禁止。
5. cross-review は従来どおり非 author family。prose の完了宣言は受けない
   (close 条件 = regression test / doctor check の実測 green)。

## 未実測のまま残るもの (正直に記録)

- doctor 10 分超の check 別内訳 (train 2 の最初のタスク)。
- draft 消化スループットは `updated:` ベースの上限値であり、touch-up を含む近似。
