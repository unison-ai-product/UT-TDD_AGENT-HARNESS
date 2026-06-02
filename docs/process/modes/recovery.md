> **PROVISIONAL SPIKE** (PLAN-DISCOVERY-04 S1)。正本でない。終点後 Reverse で実績から再整備される。

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
- **tl がリオープンポイント確認 + po がスコープ承認** (人間サインオフ必須、§2.6.3)
- 標準 L0-L14 フロー復帰が可能な状態

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
| docs/governance/recovery-workflow.md | **当面の正本**。本 dir への移管は後続 PLAN (repository-structure §2) で実施予定 |

翻案注記: helix-process の `cutover_orchestrator` / `stop-hook` は UT-TDD の `.claude/hooks/agent-guard.ts` + `ut-tdd` CLI hook 体系に対応。`agent_mandatory` / `lock` 機構は UT-TDD guard + gate として実装予定 (現状 agent-guard のみ有効化済)。

---

出典再掲: README.md 台帳 §2 / concept v3.1 §2.5/§2.6.3 / requirements v1.2 §1.3/§1.5/§1.8/§1.10 / helix-process/recovery-workflow.md / docs/governance/recovery-workflow.md
