# A-156 - Research/Audit Finding Route Ledger

- **date**: 2026-07-01
- **plan**: PLAN-L7-198-research-recovery-finding-routing
- **purpose**: Research/監査 finding を読了で止めず、既存 mode へ起票候補として接続する。

## Routing Contract

| finding_type | route_signal | target mode | candidate prefix | auto create | approval |
|---|---|---|---|---|---|
| `regression` | `regression_dev` | Recovery | `PLAN-RECOVERY-` | false | human required |
| `premise-gap` | `regression_dev` | Recovery | `PLAN-RECOVERY-` | false | human required |
| `deviation` | `regression_dev` | Recovery | `PLAN-RECOVERY-` | false | human required |
| `feature-gap` | `feature_addition` | Add-feature | `PLAN-L7-` | false | route policy |
| `latent-defect` | `feature_addition` | Add-feature | `PLAN-L7-` | false | route policy |
| `smell` | `code_smell` | Refactor | `PLAN-REFACTOR-` | false | route policy |

## Initial Candidates

| source | finding | type | candidate route | required payload |
|---|---|---|---|---|
| A-144-03 / A-145-03 | VER-1: green evidence integrity depended on digest restamp rather than a bound green rerun | `premise-gap` | Recovery via `regression_dev` | root cause, rerun-bound evidence guard, trace to verification gate, L14 route |
| A-144-04 / A-145-04 | DB-1: operation telemetry tables mixed runtime provenance with projection facade/hollow columns | `premise-gap` | Recovery via `regression_dev` | root cause, provenance gate/test/schema change, trace to telemetry ingestion, L14 route |

## A-172 Candidates (2026-07-02, Pack comprehensive review)

`route eval` 実走証跡は `route-approval.jsonl` 2026-07-02T04:46 以降。すべて auto_create=false、人間承認待ち。

| source | finding | type | candidate route | required payload |
|---|---|---|---|---|
| A-172 C-1 | consumer 向け生成 CI (harness-check template + builtin) が full doctor を実行するが fresh consumer で構造的に赤 (violation 123 件実測)。README の自己記述とも矛盾 | `premise-gap` | Recovery via `regression_dev` (setup/doctor リファクタ合流可) | root cause (self-application gate の consumer 混入)、consumer-profile 分離 or 生成 CI の setup-smoke 化、実 consumer smoke test、L14 route |
| A-172 C-2 | setup 生成 hook 配線が doctor 自身の project-hook / codex-hook-adapter gate を通らない (missing_hook 11 件実測)。生成 CI wrapper も runner 上で解決不能 | `premise-gap` | Recovery via `regression_dev` (C-1 と同根・同 PLAN 可) | gate 要求と setup 生成物の整合、生成直後 doctor green の regression test、L14 route |
| A-172 sync-pack | sync-pack が git HEAD でなく working tree を走査コピー (clean-tree 確認なし、manifest は gitHead() を名乗る)。hybrid では未コミット混入リスクが構造的 | `latent-defect` | Add-feature via `feature_addition` | clean-tree guard (dirty で fail)、sync commit 規約 (`chore: sync clean pack <sha>`) の機械強制 |
| A-172 personal-path | FORBIDDEN_PATH_RE 等が維持者ユーザー名固定で外部環境の個人パスガードとして機能しない + 公開 fixture に個人パス残存 | `latent-defect` | Add-feature via `feature_addition` | パターン一般化 (`C:\Users\` 配下任意)、fixture の example 化、no-username-leak test の全域化 |
| A-172 pack-tests | Pack 同梱 tests の 47/122 file が source 専用 doc 前提で実行不能のまま公開 | `feature-gap` | Add-feature via `feature_addition` | source-only 前提テストの skip ガード (存在チェック) or Pack artifact からの除外、方針は PO 判断 |
| A-172 pack-ci-windows | Pack CI が ubuntu のみで Windows-first 主張・`.cmd` spawn 既知盲点 (A-147) と不整合 | `feature-gap` | Add-feature via `feature_addition` | windows-latest job 追加、`.cmd` 経路の CI 被覆 |
| A-172 doc-residue | 公開 governance/process doc の自己適用残渣 (非同梱物へのデッドリンク 6+、[[feedback_*]] wikilink、repository-structure の source tree 記述、README badge internal (private)、SKILL_MAP 自己記述、estimation.md 虚偽記述ほか minor 群) | `smell` | Refactor via `code_smell` | 配布 doc curation (plain text 化 / 脚注化 / badge・記述修正)、distribution export 時の dead-link 検出 gate は Add-feature 側と要調整 |

## A-173 Candidates (2026-07-02, 全駆動モデル精査)

`route eval` 実走証跡は `route-approval.jsonl` 2026-07-02。すべて auto_create=false、人間承認待ち。詳細は A-173。

| source | finding | type | candidate route | required payload |
|---|---|---|---|---|
| A-173 F-1 | design-bottomup mode back-merge 未着地 (機械層稼働済みだが process 正本/README 台帳/concept 9→10/passage lint 未反映。DISCOVERY-07 Step 5 = PO gate 待ちか逸脱かは PO 確認事項) | `deviation` | Recovery via `regression_dev` (PO 確認先行) | PO 判断 (Step 5 実施 or 意図的 park の明示)、back-merge 一式、passage lint EXPECTED_MODES 追加 |
| A-173 F-2 | retrofit.md が存在しないコマンド `ut-tdd doctor --preflight upgrade` を必須手順として記載 (正: `ut-tdd guard preflight`) | `latent-defect` | Add-feature via `feature_addition` | doc 修正 + doc 内 cited-command 実在 lint 候補 |
| A-173 F-3 | contract 関数 (evaluateRetrofitMatrix / evaluateResearchDecision) が実装+テスト済みで enforcement 未接続。lint-wiring は src/lint/* のみ監視で workflow/contracts 層が meta 盲点 | `feature-gap` | Add-feature via `feature_addition` | doctor 配線 + lint-wiring 監視境界の拡張 |
| A-173 F-4〜F-7 | exit 条件の宣言のみ層 (Reverse ③/pair-freeze 再入、人間サインオフ証拠、incident 2-PLAN、recovery 3 要件、discovery verify/*.sh、scrum 昇華先、add-impl→Reverse、version-up activation trace、accept コマンド、G1-content/G2/G4/G5 doctor 配線) | `feature-gap` | Add-feature via `feature_addition` | 優先順は PO 判断。個別 PLAN 分割前提 (PLAN per requirement) |
| A-173 F-8 | minor 残渣 (refactor.md stale skill path、README 9-mode 表記、ほか) | `smell` | Refactor via `code_smell` | doc curation |
| A-173 F-9 | drive_runs.mode が plan_id 接頭辞 4 分岐で導出され 6+ mode が表現不能、kind=refactor 29 行 + troubleshoot 91 行が Forward へ誤投影。REQUIRED_CURRENT_MODES が損失値のみ要求で検出不能 | `latent-defect` | Add-feature via `feature_addition` | mode 正本を frontmatter/kind+signal 由来へ、REQUIRED_CURRENT_MODES をカタログ突合へ、誤投影 120 行の再投影 |

**PO disposition (2026-07-02)**: A-173 全候補は record-only 確定 — 本サイクルでは PLAN 起票・修正作業を行わない (着手は将来の PO 指示時)。F-1 は「未着手の可能性 = park でない」扱い。

## A-174 Candidates (2026-07-02, Forward 設計群+テスト設計ペア監査)

record-only (A-173 と同 disposition)。詳細は A-174。

| source | finding | type | candidate route | required payload |
|---|---|---|---|---|
| A-174 F-1 | L8/L9 右腕の citation gate 盲点: ORACLE_ID regex が 3 桁採番 U/IT のみで、2 桁採番 IT-* (IT-CONTRACT-01〜03 = tests 実装 0 件・defer 宣言なし) と ST-* 全体が素通り。未実装と明示 defer の機械区別なし | `feature-gap` | Add-feature via `feature_addition` | regex 拡張 (桁 + ST)、defer の frontmatter/機械追跡、G8/G9 close 前提の実証 gate |
| A-174 F-2 | confirmed 設計 doc の実装宣言 drift (module-decomposition「stub」/ architecture「将来 telemetry」/ function.md C9「将来」vs L5「実装済」) — NFR-08 抵触候補 | `smell` | Refactor via `code_smell` | doc 訂正 + 実装宣言真実性 lint 候補 |
| A-174 F-3 | nfr-grade.md の AC-NFR-02/09 が L4 carry placeholder のまま未着地 (性能/容量の数値閾値未確定) | `feature-gap` | Add-feature via `feature_addition` | L4 carry 解消の設計起票 |
| A-174 F-4 | セキュリティ設計 slot 欠落 (NFR-17 親宣言のみ、L4 に独立節/slot なし)。ロギング横断方針も部分被覆 | `feature-gap` | Add-feature via `feature_addition` | slot 定義は PO 判断 (document-system-map + VALID_SUB_DOCS 拡張) |
| A-174 F-5 | 設計 doc frontmatter の sub_doc が schema 外/重複 (L2 supplemental 重複、L6 skill-index / function-spec-addendum) — lint 誤判定源 | `latent-defect` | Add-feature via `feature_addition` | VALID_SUB_DOCS 拡張 or role 区別 lint |
| A-174 F-6 | 残渣 (L7-unit-test-design「placeholder skeleton」見出し等) | `smell` | Refactor via `code_smell` | doc curation |

## Research 駆動そのものへの dogfood 所見 (A-172 実走で検出)

1. **第二 exit が機械強制されていない**: A-172 を記録・commit しても finding routing 未実施のまま素通りできた (本 session が実際に素通りし、PO 指摘で是正)。finding を持つ audit doc が本 ledger / route-approval.jsonl に未接続でも doctor は沈黙する。absence-blindness の再発形であり、audit finding → routing 接続の surface / fail-close gate が候補 (`feature-gap`)。
2. **`route eval` の入力矛盾が素通り**: `--signal` は required だが `--finding-type` 指定時は routing に使われず、`--signal code_smell --finding-type premise-gap` が矛盾のまま mode=recovery を返す (2026-07-02 実測)。A-156 対応表 (finding_type→route_signal) を CLI 側で自動解決するか、矛盾組を reject すべき (`latent-defect`)。
3. **approval_status=policy_missing**: recovery route の承認は常に policy_missing で blocked (fail-close 自体は正当)。required_approvers が空定義のため「人間承認して起票」の正規動線が audit 上完結しない。承認 policy の定義が必要 (`feature-gap`)。

## Filing Update (2026-07-02, PO /goal)

PO /goal 指示により record-only disposition を解除し、A-172 / A-173 / A-174 / dogfood の全候補を修正駆動モデルで起票済み (plan lint green)。対応表の正本は `.ut-tdd/audit/A-175-architecture-audit-registry-2026-07-02.md` §2 (PLAN-RECOVERY-06/07、PLAN-L7-232〜245、PLAN-L4-15/16)。以降の状態管理は各 PLAN が正本。

## Boundary

This ledger does not create Recovery PLANs automatically. It records routeable candidates only.
Creation still requires human approval and a PLAN that satisfies `docs/process/modes/recovery.md`
exit: root cause, concrete guard/test/rule/hook or schema change, traceable enforcement point, and L14 route.
