---
layer: L5
sub_doc: if-detail
status: draft
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
> **W-pair**: `pair_artifact = L8-integration-test-design.md` (L5↔L8 集合 pair)。
> **⚠ 人間確認事項**: 認証・秘密管理方式は本 doc で**確定しない** (禁止事項)。方針記述のみ、確定は PO + security 監査 (§6)。

# UT-TDD Agent Harness — L5 詳細設計: IF 詳細 / D-CONTRACT (If-Detail)

external-if.md (what/形状) の **how = adapter 詳細契約**を確定する (PLAN-L5-04)。core は正規化 intent のみ発行し、adapter が provider 固有を吸収する (Anti-Corruption Layer、external-if §6)。

## §1 adapter 公開 IF (core → adapter)

| adapter 関数 (将来形) | 対応境界 (external-if §2) | intent (provider 非依存) |
|---|---|---|
| `invokeWorker(intent)` | AI runtime (a) | 実装委譲 intent (role/task/context) |
| `invokeReviewer(intent)` | AI runtime (a) | レビュー委譲 intent |
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
| `auth` (認証失敗) | fail-close (人間確認事項) | `Error: 認証失敗 (<service>)` + next_action (env 確認) + exit 1 |
| `rate-limit` | リトライ (§3) → 尽きたら fail | warn → `Error: レート上限` + exit 1 |
| `timeout` | 該当 skip + warn (AC-FR-18-03) | warn + 他結果集約 |
| `unknown` | fail-close (安全側) | `Error: 外部呼出失敗 (<service>, <message>)` + exit 1 |

## §5 D-CONTRACT DSL schema

| DSL file | schema 概要 | 関連 |
|---|---|---|
| `mode-routing.yaml` | decision table: `{signal → mode}` (drift/劣化/暴走/障害 → Reverse/Refactor/Recovery/Incident、優先度付き、FR-08) | runtime(detect) が消費 |
| `gate-checks.yaml` | `{gate_id → [check]}` 各 check は決定論 (AI 呼ばない、FR-05)。出力は `recommendedCommandV1Schema` 準拠の next_action | doctor/gate が消費 |

> DSL は zod で読込時 validate (physical-data §5)。`recommendedCommandV1Schema` (実装済) が gate の推奨コマンド契約。

## §6 認証・秘密管理 (⚠ 方針記述のみ、確定せず)

| 項目 | 方針 (確定は PO + security 監査) |
|---|---|
| API key / token | env 経由 (`.env` gitignore) または OS credential store。**doc/example/本 doc に具体値を記載しない** (禁止事項) |
| Claude/Codex 認証 | adapter が吸収、core は認証情報を保持しない |
| GitHub 認証 | `gh` CLI / Actions secrets に委譲 |
| 認証フロー確定 | **本 doc では確定しない**。L7 実装前に PO 承認 + security 監査 (認証・認可・本番影響は人間確認必須、禁止事項) |

> 本 §6 は設計方針の記述のみ。認証方式の確定は **G5 前に PO へ escalation** (G4 escalation ② の継続)。

## §7 ADR-003 候補 (adapter 境界)

| 論点 | 内容 | 判断 |
|---|---|---|
| ADR-003 化 | adapter で provider (Claude/Codex/GitHub) を隔離する境界 (Anti-Corruption Layer) を ADR 化するか | **PO/TL 判断 (G5 前)**。external-if §6 + 本 doc §1 が設計根拠。ADR 化しない場合はこれらが正本 |

> ADR-002 候補 (依存方向) は module-decomposition §7 で扱う。

## §8 carry → L7 実装 / security

- **adapter 実装** (Claude subagent 起動 / Codex CLI / gh wrapper) = L7 (module-decomposition §5 adapter)
- **intent/結果/エラー型の詳細 zod** = L7 (`src/schema` or adapter module)
- **認証・秘密管理方式の確定** = **PO 承認 + security 監査** (G5 前、⚠ 人間確認必須)
- **D-CONTRACT DSL 実装** (mode-routing.yaml / gate-checks.yaml + loader) = L7
- **provider 引継ぎ** (FR-L1-42、context+budget 連携) = PLAN-L4-NN-provider-handover (function §6) と接続
- **sprint check の VCS 参照** (TDD trace の git log/blame、internal-processing §2): adapter 経由か直接 fs/git 読込かを L7 で決定 (現状 adapter 公開 IF 6 本に未配線、L7 carry)
