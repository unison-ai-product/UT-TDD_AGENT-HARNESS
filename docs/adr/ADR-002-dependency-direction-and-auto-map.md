# ADR-002: 依存方向ルール (schema 安定核) + 依存マップ自動生成・構想 vs 実装 drift チェック

- **Status**: accepted
- **Date**: 2026-05-29
- **Deciders**: PM (Opus) + PO (ユーザー)
- **関連**: `docs/design/harness/L4-basic-design/architecture.md` §3 / `docs/design/harness/L5-detailed-design/module-decomposition.md` §4・§7 / `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md` / improvement-backlog IMP-032

## Context

UT-TDD harness の core が module 化する (cli/schema/lint/plan/vmodel/runtime/doctor + 将来 workflow/adapter ...) なかで、module 間の依存が複雑化する。逆依存や循環依存が混入すると保守が破綻し、テスト容易性も失われる。

L4 architecture §3 / L5 module-decomposition §4 で「**全依存は schema へ一方向・循環禁止・fs は副作用端点に隔離**」を設計したが、**設計宣言と実装 (実 import グラフ) が時間とともに乖離しないか**を継続検証する仕組みが必要。

PO 意図 (2026-05-29): UT harness の state/DB を構築する際に **依存関係の自動マップ生成機能**を入れる想定。**構想 (設計が宣言する依存方向) と実装 (実 import) でどれだけ差が出るかをチェックし、修正したい**。

## Decision

1. **依存方向ルールを正式採択**: 全依存は `schema` へ向かう一方向 (schema は何も import しない安定核)。`cli`/`doctor` が最外 (副作用層)。**循環依存禁止** (D-03=0)。`fs` (Node built-in) は依存方向ルール対象外の副作用アクセスとし、core ロジック (`analyzeX(docs?)` pure) と `loadX()` (fs 端点) を分離する。
2. **依存マップ自動生成 + 構想 vs 実装 drift lint を機能化** (将来、IMP-032): 実 import グラフを機械生成し、設計 doc が宣言する「期待依存マップ」(architecture §3 / module-decomposition §4 を形式化したもの) と照合。乖離 (逆依存 / 循環 / 想定外 edge) を **fail-close で検出**。OSS 候補 = `knip` / `madge` (L3 §7.1 tech-fork 調査)。

## Rationale

- 既存 lint 群 (g3-trace / fr-registry / doc-consistency / entity-coverage) と同じ「**設計 ↔ 実装の機械的整合**」哲学。zod で enum drift を根絶したのと同様、**依存 drift をグラフ照合で根絶**する。
- 「構想 vs 実装の差を測って修正する」= dogfooding の中核。harness 自身が自分の依存構造を監査できることは、対象リポジトリへの harness 価値の実証にもなる。
- 循環依存は core の根幹リスク (architecture §3 の D-03=0 保証) であり、ADR で固定して将来 module 追加時の必須参照点にする価値が高い。

## Alternatives considered

| 案 | 判定 | 理由 |
|----|------|------|
| 手動レビューのみ | 却下 | module 増加で drift 見逃しが不可避。機械検証でないと D-03=0 を保証できない |
| ADR 化しない (§3/§4 のまま) | 却下 | 構造の根幹で将来必ず参照される判断。履歴・却下理由が散逸する |
| 依存方向を強制しない (自由 import) | 却下 | 循環・テスト不能・保守破綻のリスク。安定核 (schema) 設計が崩れる |

## Consequences

- (+) 依存構造が機械検証可能になり、循環・逆依存を CI/doctor で fail-close できる。
- (+) **構想 (設計) と実装の gap を定量化・可視化し修正できる** (PO 意図の実現)。
- (+) 将来 module 追加時の依存判断の正本が ADR として残る。
- (−) dependency-map auto-gen + drift lint の実装コスト (L7、IMP-032)。OSS (knip/madge) 流用で緩和。
- (−) 「期待依存マップ」を設計 doc から形式化する作業が必要 (architecture §3 を機械可読形式へ)。

## Follow-ups

- **IMP-032** として「依存マップ自動生成 + 構想 vs 実装 drift lint」を L7 で起票。architecture §3 を「期待依存マップ」(YAML/JSON) として形式化し、実 import グラフと照合。
- module-decomposition §7 の「ADR-002 候補」を本 ADR (accepted) 参照に更新。
- L6 機能設計で drift lint のアルゴリズム (グラフ構築 + 照合 + 差分レポート) を pseudocode 化。
