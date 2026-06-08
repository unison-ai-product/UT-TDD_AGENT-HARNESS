---
layer: L4
sub_doc: external-if
status: confirmed
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L9
plan: docs/plans/PLAN-L4-04-external-if.md
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: 方式 (adapter 隔離) = [architecture.md](./architecture.md) §6 / 構造 = [data.md](./data.md) / 様式 = DbC (Meyer、境界 invariant) + 外部設計 (IPA 共通フレーム) ([document-system-map](../../../governance/document-system-map.md) §3)。本 doc は外部境界の **what/形状** を担い、how/詳細契約は L5 D-API に委ねる (IMP-018)。
>
> **用語更新 (G.9) / 機能要求更新 (G.10) の所在**: per-工程 delta は生成元 [PLAN-L4-04](../../../plans/PLAN-L4-04-external-if.md) の §6/§7 に記録。
> **V-pair**: `pair_artifact = L9-system-test-design.md` は L4 sub-doc 群の集合 pair (PLAN-L4-00-master 経由)。
> **⚠ 人間確認事項**: 認証・認可・本番影響・秘密情報の扱いは本 doc で**確定しない** (禁止事項)。設計方針の記述に留め、確定は PO 承認を要する (§5)。

# UT-TDD Agent Harness — L4 基本設計: 外部インターフェース設計 (External-IF)

harness が依存する外部 service との**境界契約**を Design by Contract で定義する (PLAN-L4-04-external-if)。外部 service 起動は architecture.md §6 の通り runtime adapter に隔離し、core は正規化 intent のみ発行する。

## §1 外部 service 棚卸し

| service | 関係 | 用途 | 実現 FR |
|---|---|---|---|
| **Claude (Code)** | harness ⇄ (相互) | AI 実装エージェント runtime。**harness は Claude Code 内に hook として常駐** (host runtime)。**契約プラン (月額) 認証は Claude Code 自身が管理、harness は API key を持たない** | FR-09 / FR-L1-42 |
| **Codex** | harness → 呼ぶ | AI 実装エージェント runtime (委譲先 SE/PE)。**`codex exec` CLI を subprocess 起動** (`ut-tdd codex` 導線)。**契約プラン認証は `codex login` が自己管理、harness は API key を渡さない** | FR-L1-42 |
| **GitHub** | harness → 呼ぶ | VCS (PR / branch protection) | FR-17 |
| **GitHub Actions** | harness → 呼ぶ | CI で gate 再実行 | FR-17 |
| **Sentry** | harness ← 観測される | 本番エラー観測 (Incident trigger) | FR-16 (経由で FR-L1-20 観測記録、間接) |
| **Uptime Robot** | harness ← 観測される | 可用性監視 (SLO trigger) | FR-16 (Incident trigger、観測は FR-L1-20 経路) |
| **Dependabot** | harness ← 通知される | 依存脆弱性通知 | (NFR security 経路) |

> **⚠ 前提 (CLAUDE.md)**: Claude Code / Codex は **API 直叩きではなく契約プラン (月額) + CLI / hook** で利用する。harness が管理するのは **CLI 起動 + hook** であって AI provider の API/SDK/key ではない。本 doc の AI runtime 境界はこの前提に立つ (§3/§5/§6)。
> **内部資産 fs は外部 service でない (A-90)**: `.claude/agents/*.md` (roster 正本) / `docs/skills/**/*.md` (skill 正本) は **external-if の対象外 (internal resource)**。外部 service ではなくローカル fs 読取であり、§2 (f) で境界扱いを明示する。

## §2 境界カテゴリ定義

| カテゴリ | 含む service | adapter 隔離 (architecture §6) |
|---|---|---|
| **(a) AI runtime 境界** | Claude / Codex | **runtime adapter** (core は intent のみ、provider 固有を吸収) |
| **(b) VCS・CI 境界** | GitHub / Actions | CI 配線 (`.github/workflows/`)、gate 再実行 |
| **(c) 観測・監視境界** | Sentry / Uptime Robot | inbound trigger (harness が webhook/alert を受ける) |
| **(d) 依存管理境界** | Dependabot | inbound 通知 (PR / alert) |
| **(e) local↔Web 境界 (将来、IMP-031)** | 画面 (14 screen) + DB を載せる Web サーバ | **現状なし** (file-based local、ネットワーク非依存)。画面+DB をサーバ側に配置する Phase B / multi-team 時に **local harness ↔ Web サーバ間のネットワーク通信境界**が新設される。[ADR-003](../../../adr/ADR-003-runtime-adapter-boundary-subscription-cli.md) adapter 方針の延長で設計 |
| **(f) 内部資産 fs 境界 (A-90、内部資産増分の整合宣言)** | `.claude/agents/*.md` (roster 正本) / `docs/skills/**/*.md` (skill 正本) | **external-if 対象外 (internal resource)**。外部 service ではなくローカル fs 読取で、**adapter 隔離なし** — roster/skills module の `loadX()` 端点に隔離 (architecture §6、fs は副作用端点)。state は持たず scan-on-demand で in-memory 構築 (data.md §1/§8、ADR-004)。本行は「内部資産が外部境界でない」ことの**明示宣言** (cross-sub-doc 沈黙 gap を解消) |

## §3 各境界の DbC 契約 (precondition / postcondition / invariant)

| 境界 | Precondition (前提) | Postcondition (保証) | Invariant (不変) |
|---|---|---|---|
| **(a) AI runtime** | agent-guard 通過 (allowlist 15 + model 明示) + 契約プラン CLI が認証済 (Claude Code 常駐 / `codex login` 済) | 呼び出し記録が `.ut-tdd/audit/` に append (invocation_log) | **API 直叩きでなく契約プラン CLI/hook 経由のみ** (CLAUDE.md)。core は provider SDK/API/key に依存しない (adapter = CLI subprocess + hook、ADR-001) |
| **(b) VCS・CI** | ローカル gate 証跡が存在 | CI 側 gate 再実行結果がローカルと一致 (NFR-13 dev-local+CI 整合) | branch protection は gate pass を必須化、bypass は Incident のみ (FR-17) |
| **(c) 観測・監視** | (inbound) alert payload が schema 準拠 | Incident mode 自動 routing trigger (FR-08/16) | 観測は記録のみ、harness の判定ロジックに副作用を直接与えない (mode routing 経由) |
| **(d) 依存管理** | (inbound) Dependabot PR/alert | security NFR 経路で triage (人間トリアージ) | 自動マージしない (人間確認、禁止事項) |

> Precondition/Postcondition の**詳細**(引数型・エラー型・リトライ・タイムアウト) は L5 D-API で確定 (§7 粒度境界)。

> **`ut-tdd setup` の GitHub 設定境界 (PLAN-L6-05/L7-03、REVERSE-04 back-fill)**: solo/team で出し分ける GitHub 設定のうち **ファイル** (CODEOWNERS / `.github/workflows/` / ISSUE・PR テンプレ / commitlint) は harness が emit する (`GeneratedFile`)。**GitHub 設定操作** (branch protection / Required Status Checks / 必須レビュー数) はファイルで完結せず gh-api 操作 (`GithubAction`) であり、**既定は emit-only** (`scripts/setup-branch-protection.sh` 生成のみ、適用は admin 人間サインオフ = 認可・本番影響境界、CLAUDE.md エスカレーション境界)。`--apply-branch-protection` + 対話セッション下でのみ gh 経由適用 (非対話は precondition で封鎖)。**harness core は token を保持しない** (§5 GitHub 認証 = gh CLI 委譲)。参加規模検出も gh の認証状態に委ね token を読まない。

## §4 失敗時の振る舞い (fail-close / degradation)

| 境界 | 外部 service 不在・エラー時 |
|---|---|
| **AI runtime** | Codex 不在・Claude 存在 → `claude-only` / **Claude 不在・Codex 存在 → `codex-only`** / Claude・Codex 双方不在 → `standalone` (検証のみ、AI 委譲なし)。架空 fallback を通常導線にしない (禁止事項)。4 execution mode の review tier 縮退は function §3.6 と整合 (silent fallback 禁止、不在を明示記録) |
| **VCS・CI** | GitHub 不在 → ローカル gate のみで継続 (CI は branch protection でのみ必須)。CI fail → PR block (fail-close) |
| **観測・監視** | Sentry/Uptime Robot 不在 → Incident 自動 trigger が無効化されるのみ、手動 `ut-tdd incident open` は機能継続 |
| **依存管理** | Dependabot 不在 → security 通知が手動 (`ut-tdd doctor` の依存検出で代替) |

> **原則** (architecture.md fail-close + 禁止事項): 外部 provider SDK / 認証情報を前提にした fallback を**通常導線として追加しない**。外部不在でも core 機能 (検証・gate・trace) は file-based state で動作する。

## §5 秘密情報・認証境界 (⚠ 人間確認事項、確定しない)

> **大原則 (CLAUDE.md)**: AI runtime (Claude/Codex) は **契約プラン (月額) + CLI/hook** で利用し、**API 直叩きをしない**。したがって harness は **AI provider の API key を一切保持・授受しない**。AI runtime の「認証」は各 CLI の契約ログインが自己管理する harness 外の関心事である。

| 項目 | 設計方針 |
|---|---|
| **Claude Code 認証** | Claude **契約プラン (月額)** のログインを **Claude Code 自身が管理**。harness は Claude Code 内に hook 常駐するだけで認証情報を持たない。**API key なし** |
| **Codex 認証** | Codex **契約プラン**のログイン (`codex login`) を **Codex CLI 自身が管理**。harness は `codex exec` を subprocess 起動するだけ。**API key を渡さない** |
| GitHub 認証 | `gh` CLI のログイン (契約/PAT は gh が管理) / CI は Actions secrets。harness core は token を保持しない |
| 観測・依存 (Sentry/Uptime/Dependabot) | inbound (向こうから webhook/通知)。読取 token が要る場合のみ env 経由 (`.env` gitignore)、**doc/example に具体値を書かない** (禁止事項) |
| 認証・認可・本番影響 | **人間確認なしに仕様確定しない** (禁止事項) |

> 本 §5 は方針記述。**AI runtime は API key 管理が不要 (契約プラン CLI 自己認証) なので harness の認証関心はほぼ消える**。残るのは GitHub (gh 自己ログイン) と観測系 inbound token のみで、確定は L5 + PO レビュー。

## §6 runtime adapter 境界 (architecture §6 連動)

```
core (正規化 intent: "reviewer を呼べ" / "worker に委譲")
  │  (provider 非依存、API/SDK 直依存禁止)
  ▼
runtime adapter  ← provider 固有の起動方式を吸収:
  │                ・Claude = Claude Code の Agent tool / hook (host 常駐、契約プラン自己認証)
  │                ・Codex  = `codex exec` CLI subprocess (`codex login` 自己認証)
  │                ・GitHub = `gh` CLI
  ▼
AI runtime / 外部ツール (Claude Code / Codex CLI / gh ...)  ← いずれも契約プラン or CLI 自己認証、harness は API key を持たない
```

| 層 | 責務 | 依存 |
|---|---|---|
| **core** | 正規化 intent 発行 + agent-guard 判定 | schema のみ (architecture §3 一方向) |
| **adapter** | provider 固有の**起動方式** (CLI subprocess / Claude Code Agent・hook) + エラー変換。**API key は扱わない** (契約プラン CLI が自己認証) | CLI / hook (隔離、SDK/API 非依存) |
| **AI runtime / 外部ツール** | 実行 (契約プラン or CLI 自己認証) | — |

> adapter 層は architecture.md §6「依存隔離」の具体化。adapter を差し替えれば provider 切替可 (Claude↔Codex、FR-L1-42 provider 引継ぎの基盤)。

## §7 what/形状 ↔ L5 D-API 粒度境界 (IMP-018)

二重定義回避のための責務分界。

| 観点 | 本 doc (external-if、L4) | L5 D-API (詳細契約) |
|---|---|---|
| 粒度 | **what / 形状** (どの service の何の操作、方向、pre/post の概要) | **how** (引数型・戻り値型・エラー型・リトライ/タイムアウト・冪等性) |
| 例 (AI runtime) | 「agent-guard 通過後に worker intent を adapter 経由で発行」 | `invokeWorker(intent: WorkerIntent): Promise<Result>` の zod schema + エラー分類 |
| 例 (CI) | 「ローカル gate 証跡を CI が再検証」 | `.github/workflows/ut-tdd-gate.yml` の job 定義 + 終了コード契約 |
| DbC 記述 | invariant 中心 (境界で常に真) | precondition/postcondition の docstring (edge 5-8、IMP-014) |

## §8 carry → L5 詳細設計 / L7 実装

- 各境界の**詳細契約** (引数/戻り値/エラー型) = L5 D-API (IMP-018 の how 側)
- adapter 層の**実装** (Claude subagent 起動 / Codex CLI / gh wrapper) = L7 runtime adapter 実装
- **認証・秘密管理方式の確定** = L5 + security 監査 + PO 承認 (§5、人間確認必須)
- 観測境界 (Sentry/Uptime → Incident trigger) の payload schema = L5 D-CONTRACT
- provider 引継ぎ (FR-L1-42) の context+budget 連携 = `provider-handover.v1` package (`ut-tdd handover provider export/status`, `.ut-tdd/handover/provider/`)
- **function.md §8 も参照** (mode-routing.yaml / gate-checks.yaml の DSL schema = L5 D-CONTRACT carry を含む。本 doc §8 と function.md §8 で carry 先が相補的)
