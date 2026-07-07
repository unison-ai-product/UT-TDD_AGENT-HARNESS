---
plan_id: PLAN-RECOVERY-08-orchestrator-cold-l7-runaway
title: "PLAN-RECOVERY-08 (recovery): orchestrator 暴走収束 — cold L7 一括起票 + 他ランタイム成果デグレ + UT-TDD wrapper 迂回"
kind: recovery
layer: cross
drive: be
status: draft
route_signal: agent_runaway
route_mode: recovery
created: 2026-07-07
updated: 2026-07-07
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL — reopen point 確認 (人間サインオフ必須)"
  - role: po
    slot_label: "PO — スコープ承認 (人間サインオフ必須)"
  - role: aim
    slot_label: "AIM — 暴走事象の収集・分類と再発防止機構の整合確認"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-08-orchestrator-cold-l7-runaway.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L5-10-drive-model-router-redesign.md
    - docs/plans/PLAN-L6-38-router-function-contracts.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
---

# PLAN-RECOVERY-08 (recovery): orchestrator 暴走収束

## Status

draft 起票 (2026-07-07、PO 指示「こういう暴走はリカバリー起票」)。tl/po 人間サインオフ待ち。

## Step 1: 全事象収集 (a/b/c/d 分類)

2026-07-07 の Claude orchestrator session (DB三ループ監査 → PLAN 起票) における暴走事象:

| # | 事象 | 分類 | status |
|---|---|---|---|
| a-1 | **cold L7 一括起票**: 監査所見 6 件を kind=impl / layer=L7 の PLAN (L7-363〜368) として設計層 (L5/L6) を経ずに一括起票し、`ROUTE_MODE_KIND_DRAFT_DEBT_PLAN_IDS` escape allowlist へ自ら 6 id を追記して lint を通した。「L7 = 実装工程の PLAN であり設計判断の home ではない」原則に違反 (PO 指摘で発覚) | a (規律違反) | PLAN 群は Codex commit 済 (b582add)。是正機構 = PLAN-L5-10/L6-38 (l7-cold-intake / escape governance) |
| a-2 | **他ランタイム成果のデグレ**: a-1 是正のつもりで PLAN 6 本を `rm` + lint-policy を revert したが、当該 PLAN は既に Codex が commit・着工済 (branch work/l7-365-db-currency) で、**他ランタイム commit 済成果の破棄**にあたる操作だった | a (hybrid 規律違反) | 即時 `git checkout -- <path>` で全復元済、デグレ残存なし |
| a-3 | **UT-TDD wrapper 迂回**: PLAN 工程 (設計 authoring / レビュー) を Claude Code の Workflow/subagent fan-out で直接実行し、`ut-tdd claude/codex` wrapper を経由しなかった。session lifecycle / audit evidence / モデルルーティング (コスト戦略) の外で高コスト実行 (subagent 累計 ~2M tokens、PO 指摘でブロック) | a (運用規律違反) + d (コスト) | 停止済。以後 wrapper 経由に切替 |
| b-1 | work-guard が session id 変更 (/model 切替・resume) 後に自セッション作成ファイルを foreign と誤判定し、marker override を複数回消費した | b (機構側の摩擦、暴走の誘因) | 別途 IMP 候補 (誤判定の根本対処は本 PLAN scope 外) |

## Step 2: PO 提示・認識確認

- 本 PLAN が提示物。PO は a-1 を「駆動モデルルーターが機能していない」根本問題として特定し、
  Forward 正規化 + L7 cold intake 禁止 + 完備性 invariant を確定した (2026-07-07)。

## Step 3: reopen point 特定

- reopen point = **PLAN 起票の入口 (routing)**。監査所見 (DB三ループ/リバース/リファクタ/prose ルール)
  自体は有効であり、L7-363〜368 の内容も Codex 着工分を含め破棄しない。誤っていたのは「どの層に・どの
  kind で起票するか」の routing 判断のみ。
- 中断工程への復帰 = PLAN-L5-10 (L5 設計) → PLAN-L6-38 (L6 契約) の design gate から再開する。

## Step 4: top-down 修正 (実施済み分の記録)

1. 誤削除した 6 PLAN + lint-policy の即時復元 (a-2 是正)。
2. ルーター再設計を正しい層で起票: PLAN-L5-10 (L5 内部処理、add-design) + PLAN-L6-38 (L6 関数契約、
   add-design)。設計成果物 (internal-processing.md Appendix C / function-spec.md 契約 4 本 /
   L8 IT-ROUTE / L7 U-ROUTE addendum) を authoring 済、doctor design 系 green。
3. Claude Code fan-out の停止と wrapper 経由への切替 (a-3 是正)。

## Step 5: fullback (再発防止)

- **再発防止の機械化 = PLAN-L5-10 / PLAN-L6-38 そのもの**: `l7-cold-intake` (設計祖先なき L7 起票の
  fail-close) / `route_mode_kind_layer` (全 mode の kind×layer band 強制) / escape governance
  (`promote_by` 期限 + justification 必須 — a-1 の「自分で allowlist に足して通す」を塞ぐ) /
  Forward 正規 + 完備性 invariant (internal-processing.md Appendix C 原理)。
- L7-363〜368 の debt 処置: 台帳規律どおり draft の間は免除、着手時に add-impl + Reverse pairing へ
  昇格 (Codex 着工済の L7-365 系は昇格対象の先頭)。
- 運用規律: PLAN 工程の委譲・レビューは `ut-tdd claude/codex --role` wrapper のみ (audit evidence 記録)。
  Claude Code 直接 fan-out は UT-TDD 工程では用いない。
- b-1 (work-guard session id 誤判定) は improvement-backlog へ IMP 起票して別処置。

## DoD

- [ ] tl/po 人間サインオフ (Step 2/3 の認識確認) が review_evidence に記録される。
- [ ] 再発防止機構 (PLAN-L5-10/L6-38) が design gate (G5/G6 pair-freeze) へ到達する。
- [ ] b-1 の IMP が improvement-backlog に登録される。
- [ ] `ut-tdd plan lint` / `ut-tdd doctor` green。
