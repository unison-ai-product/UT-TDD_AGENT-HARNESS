---
layer: L5
sub_doc: if-detail
status: confirmed
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
plan: docs/plans/PLAN-L5-04-if-detail.md
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: 境界 (what/形状) = [external-if.md](../L4-basic-design/external-if.md) / adapter 責務 = [module-decomposition.md](./module-decomposition.md) §5 / 内部 how = [internal-processing.md](./internal-processing.md)。本 doc は外部境界の **how = 詳細契約 (D-CONTRACT)** を担う (IMP-018 の how 側)。
>
> **用語更新 (G.9) / 機能要求更新 (G.10) の所在**: per-工程 delta は生成元 [PLAN-L5-04](../../../plans/PLAN-L5-04-if-detail.md) の §6/§7 に記録。
> **V-pair**: `pair_artifact = L8-integration-test-design.md` (L5↔L8 集合 pair)。
> **⚠ 前提 (CLAUDE.md) + 人間確認事項**: AI runtime (Claude/Codex) は **契約プラン (月額) + CLI/hook** で利用し **API 直叩きをしない**。adapter は API key ではなく**起動方式** (CLI subprocess / Claude Code Agent・hook) を吸収する。残る認証 (GitHub/観測系) の確定は本 doc で**確定しない** (禁止事項)、方針のみ・確定は PO + security 監査 (§6)。

# UT-TDD Agent Harness — L5 詳細設計: IF 詳細 / D-CONTRACT (If-Detail)

external-if.md (what/形状) の **how = adapter 詳細契約**を確定する (PLAN-L5-04)。core は正規化 intent のみ発行し、adapter が **provider 固有の起動方式** (Claude Code Agent/hook、`codex exec` CLI、`gh` CLI) を吸収する (Anti-Corruption Layer、external-if §6)。**API/SDK/key は介在しない** — AI runtime は契約プラン CLI が自己認証する。

## §1 adapter 公開 IF (core → adapter)

| adapter 関数 (将来形) | 対応境界 (external-if §2) | intent (provider 非依存) |
|---|---|---|
| `invokeWorker(intent)` | AI runtime (a) | 実装委譲 intent → **Codex は `codex exec` CLI 起動 / Claude は Agent tool 呼出** (API でなく CLI/hook) |
| `invokeReviewer(intent)` | AI runtime (a) | レビュー委譲 intent → 同上 (別 runtime CLI 起動) |
| `runCiGate(gateId)` | VCS・CI (b) | CI で gate 再実行 |
| `openPr(meta)` | VCS・CI (b) | PR 作成 (branch protection) |
| `receiveAlert(payload)` | 観測・監視 (c) | Sentry/Uptime → Incident trigger |
| `receiveDepAlert(payload)` | 依存管理 (d) | Dependabot → security トリアージ |

> core は `invoke*` の intent だけを発行し、Claude/Codex/gh の差は adapter 実装が吸収 (FR-L1-42 provider 引継ぎの基盤)。

## §2 intent / 結果 / エラー型 (概要、詳細 zod は L7)

| 型 | 概要 |
|---|---|
| `WorkerIntent` | `{role, task, context?, budget?}` (role∈roleSchema 相当) |
| `InvokeResult` | `{ok, output?, error?, audit_ref}` (audit_ref = `.ut-tdd/audit/` への記録 ID) |
| `AdapterError` | `{kind: "absent"\|"auth"\|"rate-limit"\|"timeout"\|"unknown", retryable: boolean, message}` |

> 詳細 zod スキーマ (フィールド型/必須任意) は L7 実装で `src/schema` または adapter module に定義。本 doc は型の輪郭まで。
> **`auth` kind の意味**: API key 認証失敗ではなく **契約プラン CLI の未ログイン状態** (例: `codex login` 未実施 / Claude Code 未認証 / `gh auth` 未済)。harness は key を持たないため、対処は CLI 側ログインの案内 (§4)。

## §3 リトライ / タイムアウト / 冪等性

| 観点 | 方針 |
|---|---|
| リトライ | `AdapterError.retryable=true` (rate-limit/timeout) のみ指数バックオフ最大 N 回。auth/absent は即 fail (非リトライ) |
| タイムアウト | 操作別タイムアウト (例: doctor detector 30s = AC-FR-18-03)。超過は該当のみ skip + warn |
| 冪等性 | invoke は audit_ref で重複検出。同一 intent 再実行は副作用を二重化しない (adapter が dedup) |

## §4 エラー分類 → fail-close マッピング

| AdapterError.kind | 振る舞い (external-if §4 degradation と整合) | internal-processing §6 形式 |
|---|---|---|
| `absent` (service 不在) | degradation: Codex 不在→claude-only / 双方不在→standalone。**架空 fallback を通常導線にしない** | warn + mode 降格 (exit 0、機能継続) |
| `auth` (CLI 未ログイン) | fail-close。**API key 不在ではなく契約プラン CLI のログイン未済** | `Error: <service> 未ログイン` + next_action (`codex login` / Claude Code 認証 / `gh auth login` の案内) + exit 1 |
| `rate-limit` (契約プラン上限) | リトライ (§3) → 尽きたら fail。**契約プランの利用上限/レート** (API quota でない) | warn → `Error: 契約プラン上限` + exit 1 |
| `timeout` | 該当 skip + warn (AC-FR-18-03) | warn + 他結果集約 |
| `unknown` | fail-close (安全側) | `Error: 外部呼出失敗 (<service>, <message>)` + exit 1 |

## §5 D-CONTRACT DSL schema

| DSL file | schema 概要 | 関連 |
|---|---|---|
| `mode-routing.yaml` | decision table: `{signal → mode}` (drift/劣化/暴走/障害 → Reverse/Refactor/Recovery/Incident、優先度付き、FR-08) | runtime(detect) が消費 |
| `gate-checks.yaml` | `{gate_id → [check]}` 各 check は決定論 (AI 呼ばない、FR-05)。出力は `recommendedCommandV1Schema` 準拠の next_action | doctor/gate が消費 |

> DSL は zod で読込時 validate (physical-data §5)。`recommendedCommandV1Schema` (実装済) が gate の推奨コマンド契約。

## §6 認証・秘密管理 (⚠ 方針記述のみ、確定せず)

> **大原則 (CLAUDE.md)**: AI runtime (Claude/Codex) は **契約プラン (月額) + CLI/hook** で利用し **API 直叩きをしない**。harness は **AI provider の API key を保持・授受しない**。AI runtime の認証は各 CLI の契約ログインが自己管理する harness 外の関心事。adapter は API key ではなく **起動方式 (CLI subprocess / Claude Code Agent・hook)** を吸収する。

| 項目 | 方針 |
|---|---|
| **Claude Code 認証** | Claude 契約プラン (月額) のログインを **Claude Code 自身が管理**。harness は hook 常駐のみ、**API key なし** |
| **Codex 認証** | Codex 契約プランの `codex login` を **Codex CLI 自身が管理**。adapter は `codex exec` を subprocess 起動するだけ、**API key を渡さない** |
| GitHub 認証 | `gh` CLI ログイン (gh が管理) / CI は Actions secrets。harness core は token を保持しない |
| 観測系 (Sentry/Uptime/Dependabot) | inbound (webhook/通知)。読取 token が要る場合のみ env 経由、**具体値を doc に書かない** (禁止事項) |
| 認証・認可・本番影響 | **人間確認なしに確定しない** (禁止事項) |

> **AI runtime は API key 管理が不要** (契約プラン CLI 自己認証) なので、harness の認証確定対象は GitHub (gh 自己ログイン) と観測系 inbound token のみに縮小。これらの確定は L7 前に PO + security レビュー。

## §7 ADR-003 候補 (adapter 境界)

| 論点 | 内容 | 判断 |
|---|---|---|
| ADR-003 | adapter で provider (Claude/Codex/GitHub) を隔離する境界 (Anti-Corruption Layer)、契約プラン CLI/hook 前提 | **採択済 ([ADR-003](../../../adr/ADR-003-runtime-adapter-boundary-subscription-cli.md)、PO 承認 2026-05-29)**。A-71 の API-premise 是正を Context に反映。external-if §6 + 本 doc §1 が設計根拠 |

> ADR-002 (依存方向) は module-decomposition §7 で扱う (採択済)。
> **将来境界 (IMP-031)**: 画面+DB を Web サーバ側に置く場合の **local↔Web 通信境界**は ADR-003 adapter 方針の延長で Phase B に設計。

## §8 carry → L7 実装 / security

- **adapter 実装** (Claude Code Agent/hook 連携 / `codex exec` subprocess / `gh` CLI wrapper、**API key を扱わない**) = L7 (module-decomposition §5 adapter)
- **intent/結果/エラー型の詳細 zod** = L7 (`src/schema` or adapter module)
- **認証・秘密管理方式の確定 (縮小スコープ)** = AI runtime は契約プラン CLI 自己認証で **harness 対象外**。確定対象は **GitHub (gh ログイン) + 観測系 inbound token のみ** → L7 前に **PO 承認 + security 監査** (⚠ 人間確認必須)
- **D-CONTRACT DSL 実装** (mode-routing.yaml / gate-checks.yaml + loader) = L7
- **provider 引継ぎ** (FR-L1-42、context+budget 連携) = `provider-handover.v1` package (`ut-tdd handover provider export/status`) と接続
- **sprint check の VCS 参照** (TDD trace の git changed-files / review scope): `loadChangedFiles` を `verify recommend`、`review --uncommitted`、doctor `change-impact`、`regression-expansion` が共有する。git log/blame の深掘りは optional evidence enrichment とし、L7 完遂の隠れ carry にしない。
## Appendix B: DB/Search CLI Contracts (PLAN-L5-08)

| CLI surface | contract | output |
|---|---|---|
| `ut-tdd db status` | Open `.ut-tdd/harness.db`, report schema version, projection freshness, and orphan counts. | JSON/text summary with non-secret metadata only. |
| `ut-tdd db rebuild` | Rebuild projection DB from docs/state/log digests. | Exit 0 when rebuild is deterministic; exit 1 on unreadable source or schema mismatch. |
| `ut-tdd find <query>` | Search PLAN/artifact/finding/skill/model/session references through `search_index` and exact ID tables. | Ranked rows: `{subject_type, subject_id, path, reason, evidence_path}`. |
| `ut-tdd metrics skill` | Read skill recommendation/invocation projections and compute firing/acceptance rates. | Aggregates by layer/drive/plan; no transcript body. |
| `ut-tdd feedback list` | List feedback events generated from repeated findings and quality signals. | Text output groups open rows into `gate` / `actionable` / telemetry summaries; `--json` returns raw open rows with next_action references. |
| `ut-tdd audit quality` | Read-only scan for hardcoded values, security risks, and technical debt markers. | Text/JSON summary grouped into `gate` / `actionable` / `telemetry`; default excludes archive, migration, and test fixtures unless explicitly requested. |
| `ut-tdd branch audit` | Read-only local branch cleanup inventory. | Classifies branches as keep, delete-candidate, or review using current/protected/gone/merged/stale evidence; never deletes branches. |
| `ut-tdd automation readiness` | Query workflow readiness from `workflow_runs`, gate/doctor projections, and open findings. | Ready/blocked/human-required rows with blocking evidence paths. |
| `ut-tdd guardrail status` | Query guardrail decisions for agent-guard, review evidence, escalation, and human signoff boundaries. | Decisions by plan/session with mode, policy, and evidence path; no provider transcript body. |
| `ut-tdd asset catalog` | Query skill/roster/command docs catalog and drift status. | Asset rows with path, asset_type, trigger/capability summary, drift status, and indexed_at. |

Security contract: these commands must never print provider transcript body, secrets, credentials, or PII. They may print redacted summaries, evidence paths, hashes, IDs, and counts.
