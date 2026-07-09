---
layer: L4
sub_doc: security
status: confirmed
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_nfr: docs/design/harness/L1-requirements/nfr.md
plan: docs/plans/PLAN-L4-16-security-design-slot.md
next_pair_freeze: L9
---

# UT-TDD Agent Harness - L4 基本設計: セキュリティ設計

本書は `PLAN-L4-16` により追加された L4 security slot の正本である。目的は、認証・認可・秘密情報・
監査証跡・配布前検査の方針を L4 基本設計の境界として固定し、下流の L6/L7 検出系がこの設計に従うようにすること。

## 1. 役割

`security` は L4 の外部設計 / 方式設計横断 slot であり、次を扱う。

- 秘密情報を source / docs / audit / DB projection / Pack 配布物へ混入させない方針。
- Claude / Codex / GitHub など外部 CLI の認証情報を harness core が保持しない境界。
- human approval が必要な操作 (本番影響、認証認可、秘密情報、鍵ローテーション、破壊操作) の escalation。
- distribution / release 前に実施する security gate の上流方針。

本書は鍵の実発行、失効、外部サービス設定変更を実行しない。実運用のローテーションや revoke は人間承認 runbook の対象である。

## 2. セキュリティ境界

| 境界 | L4 方針 | 下流 |
|---|---|---|
| AI runtime 認証 | Claude Code / Codex CLI の契約ログインが自己管理する。harness は provider API key を保持しない。 | L4 external-if / L7 runtime adapter |
| GitHub 認証 | `gh` CLI / GitHub Actions secrets が管理する。harness core は token を保存しない。 | L4 external-if / GitHub ops guard |
| docs / plans / audit | 実秘密値を書かない。例示は placeholder か明示的 dummy のみ。 | PLAN-L6-62 docs 横断 secret-scan |
| harness.db / memory / search | 投影・メモリ・検索 row に secret-like payload を保持しない。 | `src/secret.ts` narrow guard / state-db projection |
| distribution | Pack 同期・配布前に secret-scan を通す。検出時は fail-close し、skip は理由付き例外のみ。 | `ut-tdd distribution sync-pack` / doctor |

## 3. 検出責務

既存 `src/secret.ts` は DB / memory / audit / search 取り込み時の narrow guard であり、広域 credential scanner ではない。
docs 横断 secret-scan は `PLAN-L6-62` で L6 契約化し、AWS access key、GitHub token、private key block、
Bearer token、password / credential 直書きのような文書混入リスクを扱う。

検出系は本書の対象範囲・例外方針・配布前 fail-close 方針に従う。検出系の都合で scan 対象、allowlist、
配布ブロック条件を暗黙生成してはならない。

## 4. 例外方針

テスト用 dummy secret、仕様説明上の placeholder、既知の false positive は、例外理由と evidence path を持つ場合だけ許容する。
例外は「秘密情報を保存してよい」という許可ではなく、dummy / placeholder であることを機械的に説明する記録である。

## 5. 右腕接続

本書は L4 基本設計の一部として `docs/test-design/harness/L9-system-test-design.md` と対になる。
L9 では security boundary が external-if / CI / CLI 境界検証に混ざるため、ST-EXT 系の system verification として扱う。
docs 横断 secret-scan の関数粒度 oracle は `PLAN-L6-62` で L7 unit-test-design へ降下する。
