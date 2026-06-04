> **正本化済** (PLAN-REVERSE-01 で DISCOVERY-04 dogfood 実績から正本化、2026-06-04)。docs/process は forward/modes/gates の運用正本。規範変更は concept/requirements (上位正本) 先行 → 本 dir へ反映する。

# Recovery 駆動モデル

出典: concept v3.1 §2.5 / §2.6.1 signal→mode (`agent_runaway`/`context_exhaustion`/`regression_dev`) / §2.6.3 承認者 / requirements v1.2 §1.3 kind=recovery / §1.5 workflow_phase 禁止規定 / §1.10 phase 禁止 / §1.8 role=aim / helix-process/recovery-workflow.md (翻案元)

---

## 1. 概要

Recovery は **AI エージェント (Claude Code / Codex) の逸脱・暴走・大規模変更・工程逸脱・予算過剰消費・再開不能**を、ガード (事前) と収束 (事後) の二段構えで対応するモード。開発中の問題のみを対象とし、本番障害は Incident で分岐する。

### frontmatter 早見表 (README 台帳より)

| 項目 | 値 |
|------|----|
| kind | `recovery` |
| drive | 専門職継承 (be/fe/fullstack/db/agent、§1.6 V7。復旧対象 work の専門職、例 fullstack) |
| layer | `cross` |
| workflow_phase | **禁止** (§1.5/§1.10、phase を持たない) |
| owner | tl + po |
| 承認者 | **tl** (再開ポイント確認) + **po** (スコープ承認) — 人間サインオフ必須 |
| Forward 合流点 | 収束後 → 中断していた L0-L14 工程へ復帰 / 再発防止 → L14 |

**workflow_phase 禁止**: Recovery は phase を持たない (§1.5/§1.10)。フローは以下の箇条書きで定義する。

---

## 2. フロー構成 (phase なし)

Recovery は phase ではなく **二段構えの機構**で動作する:

### ガード機構 (事前: 「これ大丈夫?」)

| 機構 | 検出・警告 |
|------|-----------|
| agent-guard hook (`PreToolUse(Agent)`) | 許可リスト外 subagent_type / model 無指定 / model override を block (fail-close) |
| gate (fail-close) | 危険操作を関所で停止 |
| budget 上限 | トークン・操作の過剰消費を上限で警告 |
| subagent guard | Codex 委譲経路外の直叩きを block |
| **forced-stop 検出** (SessionStart `scanDanglingStops`、PLAN-L6-04/L7-02) | `session_end` で閉じない dangling session を**ユーザー強制停止 (ESC/Ctrl+C/Stop) = 高 severity 負シグナル**と推定し `forced_stop` 記録。停止後の是正フィードバック (Haiku 分類) を Recovery 起票候補に (concept §2.6.1 `forced_stop`=`agent_runaway` 級。fail-open、起票は人間 yes) |

### 収束機構 (事後: 再開ポイントへ戻す)

収束フロー:

1. ガード検出 → 警告/停止 (agent-guard block / stop-hook で状態 dump)
2. 状態把握 → どこから逸脱したかを特定 (handover CURRENT.json 参照)
3. 再開ポイント確定 → recovery PLAN 起票 (本文 7 節構成、kind=recovery)
4. 認識訂正 → 認識訂正履歴を recovery-log に記録
5. ロールバック/再開 → git revert / 再開ポイントから標準フロー復帰

---

## 3. exit 条件

- 再開ポイント確定
- 認識訂正履歴を recovery-log に記録済
- **再発防止ドキュメント作成済 (MUST)** — root cause + **具体的な仕組み変更 (guard/test/schema/CLAUDE.md rule/hook への機械強制)** + 強制点への trace + L14 route。prose 止まりを禁じる (仕組み化志向、§8.6 失敗→仕組みループ、[[feedback_process_for_record_not_weight]])。「軽い停止だから省略」は不可
  - **最低要件 (これを満たさないと「作成済」と見なさない)**: ① root cause 特定 / ② 再発防止に向けた guard/test/rule/hook のいずれかへの**具体的変更点 (ファイル・関数粒度で trace 可能)** / ③ L14 への route 先または carry 先の明記。① のみ列挙 (②③ 空欄) の prose は不可。詳細 artifact schema は後続 PLAN で確定 (§4 carry)
- **tl がリオープンポイント確認 + po がスコープ承認** (人間サインオフ必須、§2.6.3)
- 標準 L0-L14 フロー復帰が可能な状態 (rollback/再開 **と** 再発防止 doc の両方を満たすまで exit しない。判定: tl + po、§2.6.3)

---

## 4. Forward 合流点

| 収束後の内容 | 合流先 |
|-------------|--------|
| 中断していた実装・設計・検証 | 中断時点の L 工程へ直接復帰 |
| 認識訂正・再発防止策 | L14 運用検証 (フィードバック) |

---

## 5. 必須 role / 承認者

| role | 根拠 | 担当 |
|------|------|------|
| `aim` | requirements §1.8 kind=recovery 必須 | ガード設計・収束手順主担 |
| `tl` | §1.8 owner + §2.6.3 承認者 | 再開ポイント確認・技術的ロールバック判断 |
| `po` | §1.8 owner + §2.6.3 承認者 | スコープ承認 (人間サインオフ必須) |

---

## 6. 他 mode との連鎖 / 注意

| 接続 / 比較 | 説明 |
|------------|------|
| Incident | 別モード。Recovery = AI 逸脱・開発中。Incident = 本番障害。`env=prod` / `regression_prod` → Incident で分岐 |
| interrupt (設計ギャップ割込み) | 別対応。interrupt = 開発中の設計ギャップ・要件変更の割込み。Recovery = AI 暴走・工程逸脱 |
| forced_stop (強制停止) | **interrupt とは別概念** (命名衝突させない)。forced_stop = ユーザー強制停止 (ESC/Ctrl+C/Stop) = AI やらかしの高 severity signal → Recovery (`agent_runaway` 級、concept §2.6.1)。上記 interrupt は「要件/設計の割込み」、forced_stop は「逸脱 signal」。検出は dangling-turn 推定 (PLAN-L6-04/L7-02、専用 hook 不在 = anthropics/claude-code #9516)。間違え系 (ユーザー誤操作) は Haiku 分類で除外し記録しない |
| docs/governance/recovery-workflow.md | **当面の正本**。本 dir への移管は後続 PLAN (repository-structure §2) で実施予定 |

翻案注記: helix-process の `cutover_orchestrator` / `stop-hook` は UT-TDD の `.claude/hooks/agent-guard.ts` + `ut-tdd` CLI hook 体系に対応。`agent_mandatory` / `lock` 機構は UT-TDD guard + gate として実装予定 (現状 agent-guard のみ有効化済)。

---

出典再掲: README.md 台帳 §2 / concept v3.1 §2.5/§2.6.3 / requirements v1.2 §1.3/§1.5/§1.8/§1.10 / helix-process/recovery-workflow.md / docs/governance/recovery-workflow.md
