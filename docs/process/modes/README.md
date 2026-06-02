> **PROVISIONAL SPIKE** (PLAN-DISCOVERY-04 S1)。正本でない。終点後 Reverse で実績から再整備される。

# 駆動モデル (mode) 定義 — index + 正本台帳

出典: concept v3.1 §2.5 (9-mode ecosystem) / §2.6 (signal→mode 配線) / requirements v1.2 §1.3 VALID_KINDS / §1.5 workflow_phase / §1.6 VALID_DRIVES / §1.8 VALID_ROLES

---

## 1. mode とは

mode (駆動モデル) は **「入口条件」と「文脈遷移 (昇華)」だけを規定**し、**出口は必ず Forward L0-L14 (`../forward/`) に合流**する (concept §2.5)。入口を散らさず工程を一本化するための分類であり、完了先 (設計・実装・検証・運用の同一接続) を分断しない。

Forward (本体) は `../forward/` に定義する。本 dir は **Forward 以外の駆動モデル** を 1 ファイル 1 モードで定義する。

---

## 2. 正本台帳 (mode ↔ kind / drive / phase / Forward 合流)

> **4 軸 (kind / layer / drive / workflow_phase) の意味**は [../README.md §1](../README.md) を参照 (drive = 「どの技術軸で作るか」等)。本台帳の列はこの 4 軸 + owner/承認者/Forward 合流。
>
> **重要 (なぞらず翻案)**: helix-process の workflow ファイル名と UT-TDD の `kind` (§1.3 12 種) は **1:1 でない**。Incident / Add-feature は独立 kind を持たず複数 kind を内包し、Discovery / Scrum は同一 `kind=poc` を drive で分ける。本台帳が mode と frontmatter taxonomy の対応の正本。

| mode | file | kind (§1.3) | drive (§1.6) | layer | workflow_phase (§1.5) | owner (§2.5) | 承認者 (§2.6.3) | Forward 合流点 |
|------|------|-------------|--------------|-------|----------------------|--------------|------------------|----------------|
| **Discovery** | [discovery.md](discovery.md) | `poc` | `poc` | `cross` | **S0-S4** | po + tl | — | confirmed → L1 (要求) / L3-L6 設計 (終点で Reverse 昇華) |
| **Scrum** | [scrum.md](scrum.md) | `poc` | `scrum` | `cross` | **S0-S4** | po + aim | — | S4 decide → L1 (increment は Reverse fullback で昇華) |
| **Reverse** | [reverse.md](reverse.md) | `reverse` | `reverse` | `cross` | **R0-R4** | tl | po (R3 Intent 検証、§1.8 fail-close) | R4 `forward_routing` → L1/L3/L4/L5/gap-only (schema enum) |
| **Recovery** | [recovery.md](recovery.md) | `recovery` | `troubleshoot` | `cross` | **禁止** (phase なし) | tl + po | tl (再開点) + po (スコープ) | 収束後 → 中断工程 / 再発防止 → L14 |
| **Incident** | [incident.md](incident.md) | `troubleshoot` + `recovery` (内包) | `troubleshoot` | `L7` (troubleshoot) / `cross` (recovery) | 禁止 | オンコール + tl + pm | オンコール + tl + pm の三者 | 収束後 → L12/L13 / 恒久対策 → L1-L6 / postmortem → L14 |
| **Refactor** | [refactor.md](refactor.md) | `refactor` | `be/fe/fullstack/db/agent` | `L7` | 禁止 | se + tl | — | L7 内部改善のみ (L8/L9 を保護網に流用) |
| **Retrofit** | [retrofit.md](retrofit.md) | `retrofit` | `be/fe/fullstack/db/agent` | `L7` | 禁止 | se + tl | config_drift は tl 単独 | upgrade 後 → L4 / 影響範囲 L4-L7 / 要件変更 → L1/L3 |
| **Add-feature** | [add-feature.md](add-feature.md) | `add-design` + `add-impl` (内包) | 親 PLAN と一致 | `L3-L7` | 禁止 | aim + tl | — | 既存維持 + L3/L7 差分 (影響範囲へ直接接続) |
| **Research** | [research.md](research.md) | `research` | `be/fe/fullstack/db/agent` | `L1-L4` | 禁止 | tl | — | ADR が L1 要求 / L4 基本設計の判断材料 |

---

## 3. 9-mode ecosystem との対応 (concept §2.5)

concept §2.5 の **9-mode** は **Forward + 上表 8 mode (Research を除く)**。本 dir の 9 ファイルは「Forward を除き Research を加えた」構成 (Forward は `../forward/`、Research は §1.3 VALID_KIND / `research/*` ブランチとして mode 化)。

| 区分 | mode |
|------|------|
| 本体 | Forward (`../forward/`) |
| 経路 2 系 | Reverse / Discovery / Scrum |
| 経路 3 系 | Add-feature |
| 補助 1 系 | Recovery / Incident |
| v3.1 新規 | Refactor / Retrofit |
| 前段調査 | Research (§2.5 9-mode 外。kind/branch として正本) |
| **工程専門** (mode でない) | screen-design (Forward L2 内) / frontend-design (Forward L10 内) — concept §2.5、独立経路にせず Forward 設計文脈の工程専門として運用 |

---

## 4. signal → mode 自動 routing (concept §2.6.1、機械化目標)

| signal | mode |
|--------|------|
| `drift` (schema/contract) | Reverse (normalization) |
| `debt_degradation` / `code_smell` / `structural` | Refactor |
| `dependency_outdated` / `upgrade` / `config_drift` | Retrofit |
| `agent_runaway` / `context_exhaustion` / `regression_dev` | Recovery (承認必須) |
| `production_incident` / `hotfix_required` / `regression_prod` (env=prod) | Incident (承認必須) |
| `feature_addition` / `scope_extension` | Add-feature |
| `user_feedback_iteration` / `requirement_continuous_refinement` | Scrum |
| 要件未確定 / 実現性不透明 | Discovery |

`env=prod` / regression 系は優先的に Incident / Recovery に倒す。本番→Incident・開発中→Recovery で分岐 (§2.6.5)。

---

## 5. 共通原則 (全 mode 共通)

- **出口 = Forward 合流**: どの mode も最終的に L0-L14 へ戻る。mode 固有で設計・テスト・検証を完結させない。
- **承認境界**: Recovery / prod Incident / config_drift Retrofit は人間サインオフ必須 (§2.6.3、承認者は本台帳列)。
- **execution mode 参照**: cross-agent review が self-review に化けないよう判断ゲートは `ut-tdd status` の execution mode を参照する (§2.6.4 / §2.1.2.1)。
- **mode 連鎖**: Discovery 終点 → Reverse 昇華 / Scrum increment → Reverse fullback / Incident・Add-feature の前段に Discovery (要件未確定時) or Reverse (既存逆引き時)。

---

## 6. このドキュメントの位置付け

本台帳および各 mode 定義は **spike (PROVISIONAL)**。正本化は終点後の Reverse (R0-R4) が dogfood 実績から行う (PLAN-DISCOVERY-04 §3.1)。gate の機械検証条件は [../gates.md](../gates.md)。
