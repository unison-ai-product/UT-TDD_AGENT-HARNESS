---
layer: L3
sub_doc: nfr
status: confirmed
pair_artifact: docs/test-design/harness/L3-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
related_l1_nfr: docs/design/harness/L1-requirements/nfr.md
next_pair_freeze: L12
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-28
updated: 2026-05-28
---

> **SSoT 参照**: L1 NFR-01〜17 (15 件、NFR-09/10 連動欠番) = nfr.md / IPA グレード Lv = IPA 非機能要求グレード 2018 公式 sample (社内内製ツール想定) / ISO 25010:2023 = 品質特性 catalog / KPI D-01〜D-09 = business-requirements.md §6.5。
> **scope**: L1 NFR-01〜17 (15 件、NFR-09/10 連動欠番) の IPA グレード Lv + 受入閾値 + 測定方法 + pass 条件確定。NFR-17 = 統合セキュリティ (A-54 audit 軸1 I-01 back-propagation、§5)。さらなる NFR 体系追加は L4 carry。NFR-18 (telemetry PII redaction、Phase B 新規候補) は §7.3 carry で宣言 (旧 NFR-17 を A-54 で NFR-18 にリネーム、統合セキュリティとの ID 衝突解消)。
> **L12 接続**: 全 NFR-* に AT-* 紐付け (孤児 NFR = 0、機械検証)。

# UT-TDD Agent Harness — L3 NFR グレード値 (nfr-grade) — IPA Lv + 受入閾値

## §1 可用性 (IPA 継続性 / 耐障害性、Lv2)

| NFR-ID | 要件 | IPA Lv | 受入閾値 | 測定方法 | pass 条件 |
|--------|------|--------|---------|---------|----------|
| **NFR-01** | cross-platform (Windows/macOS/Linux ネイティブ) | Lv2 (業務時間内継続) | 3 OS で主要 CLI コマンド 95% 以上動作 | `ut-tdd doctor --platform-check` / CI matrix (Windows + macOS + Linux) | 3 OS で同一 commit が `ut-tdd plan lint / gate / doctor` 全件 pass |
| **NFR-03** | AI mode 非依存 (4 mode 全動作、A-47 補完) | Lv2 | standalone / claude-only / codex-only / hybrid 全 mode で P0 FR-01〜18 動作 | `ut-tdd doctor --mode-check` / 4 mode × 統制対象 repo テスト | 4 mode で全 P0 FR が pass / mode 別差異 0 件 |
| **NFR-06** | fail-close (guard / gate / lint) | Lv3 (§5 セキュリティ正本) | 全 fail-close 経路で例外漏れ 0 件 | agent-guard test / gate test / vitest 全件 | 全 fail-close test pass / 例外漏れ audit 0 件 |
| **NFR-16** | onboarding 互換性 (skip_sub_doc) | Lv2 | KPI D-09 ≥ 95% (handover 引継ぎ成功率、A-43 / A-44 ledger 整合) | `.ut-tdd/handover/` 引継ぎ成功 / 失敗ログ集計 | sprint 末 D-09 ≥ 95% |

#### AC-NFR-01 (正常系)
- **Given**: PR で TypeScript ファイル変更
- **When**: GHA matrix (windows-latest / macos-latest / ubuntu-latest) で CI 実行
- **Then**: 3 OS 全件で `bun test` + `ut-tdd plan lint` pass / 3 OS で同等結果

#### AC-NFR-06 (異常系)
- **Given**: agent-guard で許可リスト外 subagent_type 指定 (例: `be-api`)
- **When**: Agent 呼び出し
- **Then**: fail-close exit 2 / Agent 起動されず / audit に block 記録

#### AC-NFR-16 (境界系)
- **Given**: 既存 repo に `ut-tdd onboarding` 実行、skip_sub_doc 段階整備モード
- **When**: G1 ゲート実行
- **Then**: 未整備 sub-doc skip / 整備済 sub-doc のみ gate 評価 / G1 段階通過

#### AC-NFR-03 (正常系: 4 mode 非依存、A-54 audit C-04 補完)
- **Given**: standalone / claude-only / codex-only / hybrid の 4 mode
- **When**: 各 mode で P0 FR-01〜18 を実行
- **Then**: 4 mode 全件で pass / mode 別判定差異 0 件 (注: NFR-03 は L1 §7 二軸タグで Portability=移行性、可用性軸でも 4 mode 継続性として評価 — 両軸にまたがる要件)

> **TL 採用根拠 (Lv2)**: 社内内製ツール想定、Lv3-5 (24/7 高可用) は過剰投資。業務時間内 (営業日 9-18 時) の継続動作で十分。Phase B server-optional 採用時に Lv3 へ昇格検討可。

## §2 性能・拡張性 (IPA 性能効率性 / 移植性、Lv2)

| NFR-ID | 要件 | IPA Lv | 受入閾値 | 測定方法 | pass 条件 |
|--------|------|--------|---------|---------|----------|
| **NFR-02** | 更新性 (npm / repo template / 社内共有) | Lv2 (CLI ツール想定) | L4 ADR で配布形態確定 | L4 ADR 進捗 | L4 carry (本 PLAN は閾値 placeholder) |
| **NFR-12** | machine×AI 二層 (静的 + AI レビュー) | Lv2 | KPI D-07 (AI 委譲時間率) ≥ 70% (目標値) | `.ut-tdd/audit/invocation_log/` 集計 | 直近 1 sprint D-07 ≥ 50% (Phase A) / ≥ 70% (Phase B、§6.2 BR-21 着手条件と整合) |
| **NFR-15** | server-optional (Phase A local / Phase B server) | Lv2 | Phase A は local-only で全機能動作 / Phase B 拡張は L4 carry | Phase A: `ut-tdd doctor --server-disabled` / Phase B: ADR | Phase A: server なしで全 P0 FR 動作 / Phase B: L4 ADR |

#### AC-NFR-02 (carry placeholder)
- **Given**: L4 ADR 未確定 (本 PLAN range 外)
- **When**: L4 PLAN 起票時
- **Then**: 配布形態 (npm / repo template / GitHub Packages) を ADR で確定

#### AC-NFR-12-01 (正常系)
- **Given**: 直近 sprint で AI 委譲時間 = 8 時間、人間作業時間 = 4 時間
- **When**: sprint 末 D-07 集計
- **Then**: D-07 = 8/(8+4) × 100 = 66.7% / Phase A 閾値 ≥ 50% pass

#### AC-NFR-15 (正常系: Phase A local-only)
- **Given**: server プロセス起動なし
- **When**: 全 P0 FR (FR-01〜18) 実行
- **Then**: 全件動作 / `.ut-tdd/` ファイルベース state で完結

> **TL 採用根拠 (Lv2)**: CLI ツール想定で大規模負荷想定なし。Lv3 (秒単位レスポンス保証) は CLI 性質に不要。

## §3 運用・保守性 (IPA 保守性 / 信頼性、Lv3)

| NFR-ID | 要件 | IPA Lv | 受入閾値 | 測定方法 | pass 条件 |
|--------|------|--------|---------|---------|----------|
| **NFR-07** | MVP なし (5 条件全件総合) | Lv3 | 5 成功条件 (BR-01〜05 由来) 全件被覆 | OT-01〜05 (L14 operational-test-design.md) + AT 量閉じ | 全条件 OT/AT pass |
| **NFR-08** | implementation_status 真実性 | Lv3 | KPI D-05 (4 artifact trace 整合率) ≥ 95% (A-43 ledger 整合) | `ut-tdd trace check` / `.ut-tdd/artifact/trace/` | sprint 末 D-05 ≥ 95% |
| **NFR-13** | gate 通過率 / dev-local+CI 整合 | Lv3 | KPI D-02 ≥ 90% (A-43 ledger 整合) | `.ut-tdd/gate_runs/` 集計 | sprint 末 D-02 ≥ 90% |
| **NFR-14** | human-as-residue (gate fail-close 例外権) | Lv3 | KPI D-06 (bypass 件数) ≤ 2 件/sprint (努力目標 = 0、A-43 ledger 整合) | `.ut-tdd/audit/agent-guard-bypass/` | bypass 全件 audit 記録 / D-06 ≤ 2 |
| **NFR-D01** | KPI D-01 (PLAN 起票数) 機械計測化 (A-47 補完) | Lv3 | ≥ 1 件/sprint | `.ut-tdd/plan_registry/` 集計 / `ut-tdd plan list --since sprint-start` | sprint 末 PLAN 件数 ≥ 1 / KPI 集計に integrated |
| **NFR-D04** | KPI D-04 (回帰検出率) 機械計測化 (A-47 補完) | Lv3 | ≥ 80% (検出件数 / 発生総件数) | CI gate + `ut-tdd trace check --regression` | sprint 末 D-04 ≥ 80% / 検出漏れ audit 記録 |

#### AC-NFR-07 (正常系: 5 成功条件総合、A-54 audit C-04 補完)
- **Given**: ① L0-L14 通し実行 / ② 複数人 team gate 回転 / ③ AI 委譲で回帰なし / ④ ダッシュボード進捗可視 / ⑤ PoC 契約化合流 の 5 条件
- **When**: OT-01〜05 (L14 operational-test-design.md) + 関連 AT を実行
- **Then**: 5 条件すべて OT/AT pass / 1 条件でも fail なら NFR-07 未達 (部分 MVP は価値なしと判定)

#### AC-NFR-08-01 (正常系)
- **Given**: 全 PLAN で generates / pair_artifact 整備済、trace check
- **When**: sprint 末 D-05 集計
- **Then**: D-05 = (trace 整合 PLAN) / (全 PLAN) × 100 ≥ 95%

#### AC-NFR-13-01 (異常系)
- **Given**: sprint 内で gate 10 回実行、fail 3 回 (D-02 = 70%)
- **When**: sprint 末 D-02 集計
- **Then**: warn `Warning: D-02 70% (閾値 90% 未達)` / next_action `gate fail 原因の audit 調査 + 修正 PLAN 起票` / Phase A は warn のみ (block しない)

#### AC-NFR-14-01 (正常系: bypass audit)
- **Given**: PO が S-03 例外権で gate bypass 1 回行使、理由「緊急 hotfix」
- **When**: bypass 実行
- **Then**: `.ut-tdd/audit/agent-guard-bypass/<timestamp>.json` 生成 / PO ID + 理由必須 / D-06 集計 + 1

#### AC-NFR-14-02 (境界系: bypass 閾値超過)
- **Given**: 1 sprint で bypass 3 件 (閾値 2 件超過)
- **When**: sprint 末集計
- **Then**: warn `Warning: D-06 3 件 (努力目標超過、bypass 多用は CC2 違反兆候)` / next_action `根本原因調査 PLAN 起票推奨` / block しない (NFR-14 警告許容)

> **TL 採用根拠 (Lv3)**: 社内導入想定で Lv2 は不足 (運用品質要求あり)。Lv4-5 (24/7 + リアルタイム監視) は過剰投資。

## §4 移行性 (IPA 移植性、Lv2)

| NFR-ID | 要件 | IPA Lv | 受入閾値 | 測定方法 | pass 条件 |
|--------|------|--------|---------|---------|----------|
| **(移行)** | legacy source → UT-TDD 移行計画 | Lv2 | `docs/migration/helix-to-ut-tdd-cutover-strategy.md` 全 wave 完了 | cutover-strategy progress | Phase A G14 = 全 wave 完了 |
| **(Phase A→B)** | Phase A → Phase B 移行 | Lv2 | §6.2 BR-21 着手条件 AND 達成 | business-detail §6.2 | A-44 ledger 整合 |

#### AC-NFR-MIGRATION-01 (正常系)
- **Given**: cutover-strategy で全 wave 完了
- **When**: G14 ゲート実行
- **Then**: source-derived doc/code 全件 archive 移行確認 / G14 pass

> **TL 採用根拠 (Lv2)**: 社内 1 case 移行想定、Lv3 (多 case パラレル移行) は過剰投資。

## §5 セキュリティ (IPA セキュリティ、Lv3)

| NFR-ID | 要件 | IPA Lv | 受入閾値 | 測定方法 | pass 条件 |
|--------|------|--------|---------|---------|----------|
| **NFR-06** | fail-close (ガード側、§1 と兼用) | Lv3 | (§1 と同じ) | (§1 と同じ) | (§1 と同じ) |
| **NFR-11** | 役割分離 (GHA 権限 / agent_slots) | Lv3 | S-01〜S-05 + harness 運用者ロール 6 件全件分離 | `ut-tdd doctor --role-check` / GHA workflow permissions | 全ロール権限境界明示 / 越権 audit 0 件 |
| **NFR-17** | 統合セキュリティ (5 段階 DevSecOps / OWASP Agentic Top 10 / EU AI Act Art.14、A-54 back-propagation) | Lv3 | (a) Build 段で secret-scan (Phase A) + SAST/SCA (Phase B) / (b) OWASP Agentic Top 10 各リスクに対策 mapping / (c) human oversight = gate サインオフ + agent guard fail-close 経路存在 | (a) CI secret-scan (Phase A) + trivy/codeql (Phase B) / (b) `docs/design/security/owasp-agentic-map.md` (L4 carry) / (c) agent-guard test + gate fail-close test | Phase A: secret-scan pass + agent guard fail-close 全件 pass + human oversight gate 経路存在 / Phase B: SAST/SCA integrated |
| **(NFR-09)** | rule parity (Claude/Codex 同一判定) | Lv3 (A-43 ledger 整合) | 機械検証必須化 (U-NFR3-13 採用) | `ut-tdd parity-check` (L4 carry) | Claude / Codex 同一入力 → 同一判定 |

#### AC-NFR-11-01 (正常系)
- **Given**: GHA workflow で `permissions: contents: read` (最小権限)
- **When**: workflow 実行
- **Then**: 書込み権限なし / read-only 確認 / audit pass

#### AC-NFR-11-02 (異常系)
- **Given**: agent_slots に未定義 role (例: `dev_lead`) 指定
- **When**: `ut-tdd plan lint`
- **Then**: fail-close `Error: role 'dev_lead' は VALID_ROLES 外 (§1.8)` / 終了コード 1

#### AC-NFR-09 (L4 carry placeholder)
- **Given**: L4 ADR で parity-check 実装方式確定
- **When**: L4 PLAN 起票時
- **Then**: parity check の機械検証ルール確定 (本 PLAN は機械検証必須化のみ宣言)

#### AC-NFR-17 (正常系: human oversight + secret 防御)
- **Given**: PR に secret 様パターン (`api_key=...`) を含む変更 + 判断ゲート G3
- **When**: CI secret-scan + G3 gate 実行
- **Then**: secret-scan が検出し fail-close / G3 は PO サインオフ (human oversight、EU AI Act Art.14) 必須 / agent は判定権を持たない (NFR-11 連動)

> **TL 採用根拠 (Lv3)**: PII / credential 扱いなしだが agent guard fail-close 厳守 + 役割分離必須で Lv3。Lv4-5 (PII / 暗号化 / penetration test) は scope 外。

## §6 システム環境 (IPA 移植性、Lv3)

| NFR-ID | 要件 | IPA Lv | 受入閾値 | 測定方法 | pass 条件 |
|--------|------|--------|---------|---------|----------|
| **NFR-01** | cross-platform (§1 と兼用) | Lv2 (§1 可用性正本) | (§1 と同じ + GitHub 正本連動) | (§1 と同じ) | (§1 と同じ) |
| **NFR-04** | 言語非依存 (統制対象 repo の言語) | Lv3 | TS/Python/Go/Rust 等 任意言語 repo で動作 | 多言語 repo テスト (CI matrix 拡張) | 4 言語以上で `ut-tdd plan lint / gate` pass |
| **NFR-05** | GitHub 正本 (CI / 証跡 / 権限) | Lv3 | gate 証跡 + audit 全件 GitHub 永続 | `.github/workflows/` artifact upload / GHA permissions | 全 gate run が GitHub Actions log で確認可能 |

#### AC-NFR-04-01 (正常系)
- **Given**: TS / Python / Go / Rust 各 1 repo に harness 適用
- **When**: 各 repo で `ut-tdd plan draft + gate` 実行
- **Then**: 4 言語全件で動作 / 言語固有処理なし

#### AC-NFR-05-01 (正常系)
- **Given**: gate run 完了
- **When**: GHA workflow `upload-artifact` で `.ut-tdd/gate_runs/` 保存
- **Then**: GitHub Actions log + artifact で 90 日永続 / 任意の関係者が参照可能

> **TL 採用根拠 (Lv3)**: Windows/macOS/Linux ネイティブ + 4 言語以上対応 + GitHub 正本で Lv3。Lv4-5 (任意 OS / オフライン完全動作) は scope 外。

## §7 carry / 次工程 (L4 / Phase B) への引き継ぎ

### §7.1 L4 ADR carry (U-NFR3-11/12 採用、L4 専決)

| 項目 | L4 ADR 候補 | 担当 PLAN |
|------|------------|----------|
| NFR-02 配布形態 | (a) npm 配布 / (b) repo template / (c) 社内 GitHub Packages | PLAN-L4-NN ADR-002 候補 |
| NFR-15 Phase B 拡張 | (a) Cloudflare Workers / (b) fly.io / (c) docker-compose | PLAN-L4-NN ADR-003 候補 (Phase B 着手時) |

### §7.2 NFR-09 補番回復 carry (U-NFR3-13 採用、L4 carry)

- 機械検証必須化 (本 PLAN 採用)
- 実装方式 (parity-check スクリプト / Claude/Codex 同一入力 → diff 検証) は L4 carry
- L1 NFR-09/10 連動欠番のまま、L4 で再採番判断

### §7.3 Phase B telemetry carry (U-NFR3-14/15 採用、Phase B 専決)

| 項目 | Phase B 着手時確定内容 |
|------|--------------------|
| telemetry default | (推奨) default off + opt-in 3 レベル (off / local-only / sync) |
| **NFR-18 (新規候補)** | telemetry PII redaction (prompt 本文除外、GDPR + 社内 PII 方針整合)。A-54 で旧 NFR-17 → NFR-18 にリネーム (NFR-17 = 統合セキュリティと衝突回避) |

### §7.4 L4 基本設計 carry

- NFR 閾値の測定アーキ (state schema / 集計クエリ / バッチ pipeline) は L4 基本設計
- KPI D-01〜D-09 集計実装は L4 / L7 carry (本 PLAN は閾値定義のみ)

### §7.4.1 KPI 拡張候補 (A-46 PdM tech-innovation + tech-docs)

- **D-10〜D-13 (DORA)** Deployment Freq / Lead Time / Change Failure Rate / MTTR を Phase A NFR 追加 (9-mode 別集計)、NFR-12 と integrated
- **D-14 (SPACE Satisfaction)** reviewer cognitive load Likert 1-5 を NFR-14 (human-as-residue) 強化候補、CC2 measurable proxy
- **D-15 (SPACE Communication)** handover record 完全性 score を NFR-16 (onboarding 互換性) 拡張
- **D-16 (SPACE Efficiency)** gate G2-G7 block time、NFR-13 関連
- **D-17 (LinearB)** PLAN diff median LOC soft target 300、NFR-08 (implementation_status 真実性) 関連

### §7.4.2 NFR 3-tier classification (A-46 tech-docs、L4 carry)

NFR-01〜17 + 新規 KPI を以下 3 tier に分類:
- **tier A** (doctor 自動判定): NFR-01/04/05/06/08/13/16 等、計測コマンド + 閾値で即判定
- **tier B** (CI 後人間確認): NFR-07/14 等、レポート生成のみ
- **tier C** (PO 合意のみ): NFR-02/15 (L4 ADR 専決) 等

→ `docs/design/nfr-classification.md` L4 起票候補、`ut-tdd doctor --nfr` 実装入力

### §7.5 L12 受入テスト pair

- 全 NFR-* (15 件 + L4/Phase B carry) の AC を L12 で AT-* に変換 (孤児 NFR = 0)
- 機械検証ルール (R4 NFR → 閾値 → AT) は L7 carry

## §8 関連 doc

- L1 NFR (上流): `docs/design/harness/L1-requirements/nfr.md`
- L1 business §6.5 KPI: `docs/design/harness/L1-requirements/business-requirements.md` §6.5
- L3 functional (FR pair): `docs/design/harness/L3-functional/functional-requirements.md`
- L3 business-detail (BR-21 + telemetry): `docs/design/harness/L3-functional/business-detail.md`
- L12 受入テスト: `docs/test-design/harness/L3-acceptance-test-design.md`
- IPA 非機能要求グレード 2018: https://www.ipa.go.jp/sec/softwareengineering/std/ent03-b.html (公式 sample 参考)
- PLAN: `docs/plans/PLAN-L3-03-nfr-grade.md`
