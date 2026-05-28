---
layer: L1
sub_doc: nfr
status: draft
pair_artifact: docs/test-design/harness/L1-operational-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L4
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: ユビキタス言語 = [L0 概念層 §10 用語集](../../../governance/ut-tdd-agent-harness-concept_v3.1.md#10-用語集) / 業界標準整合 = L0 §11 / Bounded Context = L0 §2.5 9-mode。本 doc は L0 を parent_doc reference とし、用語独自定義は行わない (anti-corruption layer)。
> **件数確定**: nfr は **NFR-14 件で確定** (NFR-01〜08 + NFR-11〜16、計 14 件。NFR-09/10 は U-補-3 PO 判断連動の欠番。根拠: 2026-05-28 v2 HELIX-workflows 正本 A-20 + PO declared GHA audit framework / server-optional + NFR-16 onboarding 互換性追加、`docs/migration/v2-import-ledger.md §5.1 A-20`)。
> **L4 接続規約** (technical/nfr は L4 pair): `next_pair_freeze: L4`。L4 PLAN は本 sub-doc 全件を `dependencies.requires` に列挙する。

# UT-TDD Agent Harness — L1 非機能要求 (nfr)

> **§3 carry 宣言 (排泄系契約)**: 排泄系契約 (doc-reviewer 必須召喚 / 4 artifact trace / NFR-08 implementation_status 列) は運用保守性の核であり、全設計 doc への波及は L3 以降の doc 規約 forward carry とする。

## §1 可用性

| NFR-ID | 非機能要求 | 詳細 |
|--------|-----------|------|
| **NFR-01** | **cross-platform native** — Windows / macOS / Linux を全て第一級サポート | Windows = PowerShell entrypoint / macOS・Linux = bash entrypoint。WSL2 は任意互換環境 (必須外)。Git Bash 依存は局所化。**handover 保持期間 30 日 archive + 90 日削除 (B7=a)** で長期 stability 担保 |
| **NFR-06** | **fail-close** — gate / lint は安全側に倒し、silent pass を許さない | subagent guard: blockOnFailure=true / gate-checks.yaml: exit 2 on fail / stdin 読取失敗も block |
| **NFR-16** | **onboarding 互換性** — 既存プロジェクトへの途中導入時、既存 docs / コード / state の不整合を block せず段階移行 | FR-L1-44 連動。既存資産を harness state に段階的に取り込み、初回 import でプロジェクトを止めない |

## §2 性能・拡張性

| NFR-ID | 非機能要求 | 詳細 |
|--------|-----------|------|
| **NFR-07** | **実務で機能する完成度** — 部分 MVP でなく、成功条件 5 つを総合的に満たして初めて価値 (MVP は存在しない) | 成功条件: ① L0-L14 通し実行 / ② 複数人 team gate 回転 / ③ AI 委譲で回帰なし / ④ ダッシュボード進捗可視 / ⑤ PoC 契約化合流 |
| **NFR-12** | **machine × AI 2 層補完機構** — Gate 判定・lint・detector は機械 (決定論的 static check) が一次、AI レビューが二次補完。両者の責務境界を明示し silent pass を防ぐ | concept §audit-framework §17 / FR-L1-05 (static gate) + FR-L1-19/20 (Learning Engine + 観測) で 2 層運用 |
| **NFR-15** | **server-optional 拡張** — Phase A (local DB + local dashboard) は server 不要、Phase B で server sync を opt-in 追加可能。harness core は local-first を維持し server を必須条件にしない | dashboard Phase A 必須 / Phase B 拡張 (BR-20 / FR-L1-20 / L3-L4 carry、PGlite + ElectricSQL ADR-002 候補)。**Claude ↔ Codex provider 間 handover** (FR-L1-42、F5=a) で多 provider 拡張は将来対応 (現状 Claude+Codex のみ) |

## §3 運用・保守性

> **carry 宣言**: 排泄系契約 (doc-reviewer + 4 artifact trace) および NFR-08 implementation_status 列の全設計 doc 適用は L3 以降の doc 規約 forward carry。

| NFR-ID | 非機能要求 | 詳細 |
|--------|-----------|------|
| **NFR-02** | **更新性第一 (updatability)** — harness 本体・skill 等の更新 / 保守が容易であること (実現手段 = plugin / skill MCP 化 等は L4 ADR 送り) | 工程別 skill 注入機構 (FR-L1-12) + PLAN 内蔵物原則 (§3.6) で skill 更新を局所化 |
| **NFR-05** | **GitHub を CI / 証跡 / 権限の正本**とする (具体実現手段は L3/L5 で確定) | GHA ワークフロー / branch protection / PR 許可を UT-TDD 証跡の正本とする。FR-L1-17 CI/PR 連携 |
| **NFR-08** | **実装宣言の真実性** — 設計 doc が主張する CLI / file / schema field に実装状態列 (installed / partial / not-implemented) を必須化し、机上の「実装済」宣言を禁止する | v2 BR-09 翻案。L3 以降の全設計 doc に `implementation_status` 列を必須化 (forward carry: `docs/migration/v2-import-ledger.md §2 F-6`) |
| **NFR-13** | **dev-local + CI 二重実行 (editor return loop)** — 同一 lint/gate を dev-local (editor PreToolUse / pre-commit) と CI (GHA harness-check) の両方で実行し、editor で fail なら commit 前に局所修正 loop に戻す | concept §audit-framework §17.3 / FR-L1-17 (CI/PR) + `.claude/hooks/agent-guard.ts` (PreToolUse) の 2 段運用。**gate 通過率 ≥90% (KPI D-02、B5=b)** を運用目標、`.ut-tdd/gate_runs` で計測 |
| **NFR-14** | **human-as-residue 原則** — 機械チェック (machine) と AI レビュー (NFR-12) で潰せない判断のみを人間 (PO) に escalate。silent pass を避ける反面、人間の判断負荷も極小化 | concept §audit-framework §17.4 / 全 gate で machine → AI → human の優先順、判断要点 + 根拠 + 推奨アクション を構造化提示。**gate fail-close 例外権 = PO のみ + audit 記録 (S-03/B6=b)**、bypass 件数 0 を KPI D-06 で計測 |

**排泄系契約としての位置付け**:
- **doc-reviewer 必須召喚** (BR-08): 大規模 doc 改定・gate evidence 提出・pair freeze の前に必須。pmo-sonnet とは責務分離した doc 品質専用 reviewer。
- **4 artifact trace** (BR-07 / FR-L1-03): 設計 ⇔ テスト設計 ⇔ 実装 ⇔ テストコードの 4 artifact pair 確認を機械強制。trace 切れ = デグレ候補。

## §4 移行性

| NFR-ID | 非機能要求 | 詳細 |
|--------|-----------|------|
| **NFR-04** | 統制対象 repo は **言語非依存 (全種類)**。harness 自体は TypeScript (ADR-001) | harness の言語制約 (TS/Bun) は内部実装のみ。統制対象プロジェクトの言語は Python / Go / Java / Ruby 等 何でも可 |
| **NFR-03** | **AI mode 非依存** — standalone / claude-only / codex-only / hybrid で動作。**Claude Code + Codex hybrid を主軸** | mode は `.ut-tdd/mode.yaml` で管理。hybrid 不在時は claude-only として動作、Codex 委譲 / team run は要求しない |

## §5 セキュリティ

| NFR-ID / 観点 | 要望 | 根拠 |
|--------------|------|------|
| **NFR-11** | **GHA audit framework の役割分離** — GHA workflow と reviewer agent の権限・実行コンテキスト・出力責務を分離し、agent が gate の判定権限を持たない (machine 一次判定、AI/human は補完) | concept §audit-framework §17 / FR-L1-09 AI ガード + NFR-12 連動 |
| **5 段階セキュリティ統合** | concept §2.4 の 5 段階セキュリティ統合を L4 セキュリティ設計の基準とする | L0 §2.4 / concept §2.4 |
| **OWASP Agentic Top 10** | AI エージェント固有リスク (Prompt Injection / Insecure Tool Use 等) に対応 | FR-L1-09 AI ガード |
| **EU AI Act Article 14 human oversight** | 人間の監督可能性を機械保証 (gate サインオフ / agent guard / fail-close) | BR-02 / NFR-06 / NFR-14 human-as-residue |
| **API key / secret / PII / credential** | rules / docs / examples に書かない (禁止事項) | CLAUDE.md 禁止事項 |
| **認証・認可・決済・PII・本番影響** | 人間確認なしに仕様確定しない (escalate 必須) | CLAUDE.md 禁止事項 |
| **agent guard bypass 条件** | `UT_TDD_ALLOW_RAW_AGENT=1`: PO 明示承認 + audit ログ記録必須 (B6=b、F6=a)。緊急障害対応以外での行使は禁止 | `.claude/CLAUDE.md` Subagent Guard / NFR-14 連動 |

詳細セキュリティ設計は L4 基本設計 (方式設計 sub-doc) で確定。

## §6 システム環境

**IPA 非機能要求グレード 2018 6 大項目に準拠**の宣言:

| IPA 大項目 | UT-TDD 対応方針 | 対応 NFR |
|-----------|----------------|---------|
| **可用性** | cross-platform native / fail-close / onboarding 互換性 | NFR-01 / NFR-06 / NFR-16 |
| **性能・拡張性** | 実務で機能する完成度 / machine×AI 2 層補完 / server-optional 拡張 | NFR-07 / NFR-12 / NFR-15 |
| **運用・保守性** | 更新性 / GitHub 正本 / 実装宣言真実性 / dev-local+CI 二重実行 / human-as-residue / 排泄系契約 | NFR-02 / NFR-05 / NFR-08 / NFR-13 / NFR-14 |
| **移行性** | 言語非依存 / AI mode 非依存 | NFR-04 / NFR-03 |
| **セキュリティ** | GHA audit framework 役割分離 / 5 段階 / OWASP / EU AI Act Article 14 | NFR-11 / concept §2.4 |
| **システム環境** | Windows / macOS / Linux ネイティブ / Bun runtime | NFR-01 / ADR-001 |

グレード値は L3 NFR グレード sub-doc (`docs/design/harness/L3-requirements/nfr-grade.md`) で確定する。

### carry note: Phase B telemetry (PII redaction 等)

Phase B の server sync + telemetry (PII redaction / GDPR / audit trail 等) は L3/L4 forward carry。PII redaction 方針は L4 セキュリティ設計で確定。NFR-16 は onboarding 互換性として §1 可用性表に昇格済み。

## §7 IPA × ISO 25010 二軸タグ表

全 NFR-NN × IPA 大項目 × ISO 25010 特性 の 3 列表:

| NFR-ID | IPA 大項目 | ISO 25010 特性 |
|--------|-----------|----------------|
| NFR-01 | 可用性 | Portability (Adaptability / Installability) |
| NFR-02 | 運用・保守性 | Maintainability (Modifiability / Analysability) |
| NFR-03 | 移行性 | Portability (Adaptability) |
| NFR-04 | 移行性 | Portability (Adaptability / Replaceability) |
| NFR-05 | 運用・保守性 | Maintainability (Analysability) / Security (Accountability) |
| NFR-06 | 可用性 | Reliability (Fault Tolerance) / Security (Integrity) |
| NFR-07 | 性能・拡張性 | Functional Suitability (Functional Completeness) |
| NFR-08 | 運用・保守性 | Maintainability (Analysability / Testability) |
| NFR-11 | セキュリティ | Security (Authenticity / Accountability) / Maintainability (Modularity) |
| NFR-12 | 性能・拡張性 | Reliability (Maturity) / Maintainability (Analysability) |
| NFR-13 | 運用・保守性 | Maintainability (Testability / Analysability) / Reliability (Availability) |
| NFR-14 | 運用・保守性 | Usability (Operability) — human oversight 側面 / Maintainability (Analysability) |
| NFR-15 | 性能・拡張性 | Portability (Adaptability) / Maintainability (Modularity) |
| NFR-16 | 可用性 | Compatibility (Co-existence) / Portability (Adaptability) |

**対象外特性と除外理由**:

| ISO 25010 特性 | 除外理由 |
|----------------|---------|
| Performance Efficiency (Time Behaviour / Resource Utilization) | L1 段階では性能要件値を定義しない (L3 NFR グレードで確定) |
| Usability (Learnability / User Interface Aesthetics) | UX 要望は screen sub-doc / L2 画面設計で扱う |
| Compatibility (Interoperability) | 外部 IF 要望は technical sub-doc §2 で扱い、NFR 層では重複定義しない |

## §8 関連 doc

- L1 業務要求: `docs/design/harness/L1-requirements/business-requirements.md`
- L1 技術要求: `docs/design/harness/L1-requirements/technical-requirements.md`
- L0 概念層 (§2.4 セキュリティ / §10 用語集 / §11 参考文献): `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- v2 import ledger (A-20): `docs/migration/v2-import-ledger.md`
- L3 NFR グレード (carry 先): `docs/design/harness/L3-requirements/nfr-grade.md`
- ADR-001: `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`

carry 接続記述: `pairs_test_design: []` の L1 許容。L4 起票時に `pairs_test_design` に L9 / L13 / L14 の多層検証接続を追加する。
