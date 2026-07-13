# A-187 checked ZIP × 現行 HARNESS 乖離監査 (2026-07-13)

## 背景

PO 指示により `Vモデル設計ドキュメント_checked.zip` (sha256 `47b9a900…`、`vmodel-source-manifest.md` の
正規 snapshot と一致) と現行システムの乖離を全件洗い出した。検証は Sonnet subagent 5 レーン
(ZIP-DOC-001..040 / 041..075 / 076..109 / 非番号資産 / 宣言済gap突合) + orchestrator 直接裏取り。
判定は全て現行 repo 実ファイル path:line 根拠 (coverage ≠ substance)。ZIP-DOC-001..109 は全行判定完了。

先行監査 A-185 (旧 zip、2026-07-07) の所見と方向一致し、本監査は checked 版 zip + disposition catalog
(PLAN-L4-22 系) を基準にした差分の再確定である。

## §1 claim-only / target 誤指定 (catalog の宣言と実体の矛盾)

| source_id | 乖離 | 根拠 |
|---|---|---|
| ZIP-DOC-012 テスト計画書 | adopt 先 `docs/process/vmodel-contract.yaml` にテスト計画実体なし。`document-system-map.md:201` 自身が gap 認定 (catalog と自己監査の矛盾) | 検証A |
| ZIP-DOC-069 性能設計書 | merge 先 `nfr.md:120` が「L1 では性能要件値を定義しない」と自己宣言 — target 粒度 (L1 vs L3) のズレ | 検証B |
| ZIP-DOC-096 7つの柱+最小コード原則 | concept_v3.1 に断片 3 箇所のみ、7柱定義セット/第8章とも未統合 (痕跡は draft PLAN-L6-66 のみ) | 検証C |
| ZIP-DOC-098 編み目式Vモデル (RAG/impact) | merge 先 vmodel-contract.yaml に RAG/impact 語彙 0 件。`vmodel-semantic-item-catalog.md:204` は `mesh_vmodel` を done と誤記 | 検証C |
| ZIP-DOC-101/102 性能・セキュリティテスト計画 | merge 先 `L9-system-test-design.md` に perf/脆弱性キーワード 0 件。semantic catalog は両方 done と誤記 | 検証C |
| ZIP-DOC-109 QA診断/Go-No-Go | 実体は `vmodel-refactor-qa-release-gates.md` §3 に存在。catalog target は `gates.md` (実体・相互リンクなし) = target 誤指定 | 検証C |

## §2 reference 先 slot 不在

ZIP-DOC-054/055/059/063/066/068 (課金/テナント/リージョン/キャパシティ/SLA/コンプライアンス) は
「`vmodel-document-scale-profiles.md` の profile で採用判定」とされるが、`doc_type_id` は 7 種のみで
対応 slot が 1 つも存在しない (profile resolver の受け皿未整備)。

## §3 security 委譲チェーンの行き止まり

`nfr.md:73` は L4 へ委譲するが、受け皿 `security.md` (117行、L4-16 freeze で意図的縮小) に
STRIDE 脅威モデル / RBAC / SBOM・SCA・供給網 (056) / KEK-DEK 鍵階層 (057) / 監査ログ要件が不在。
ZIP-DOC-010/036/056/057/067 の 5 件の統合先として宣言と実体が乖離。

## §4 概念未移植 (missing)

- ZIP-DOC-041 i18n 表示名カタログ: target `ui-standard.md` が「日本語固定 (Q31)」で正面衝突 → disposition 再判断対象。
- ZIP-DOC-048 ユーザードキュメント体系 / 060 レート制限・クォータ / 062 インシデント管理・SEV・ポストモーテム /
  065 運用手順・保守区分・教育計画 / 070 ML-BOM・モデルカード: target に概念軸ごと不在。
- 機構系: agent_docs 型目的別ダイジェスト自動生成 / diff_report 型構造差分→リリースノート /
  review.py 型敵対検証エンジン (FLAG/PASS-WEAK 機械集計) / `.feature` Gherkin 正本 / 図面 DSL。

## §5 partial (骨格移植済・中身部分欠落)

010, 013, 014, 017, 020, 021, 028, 030, 033, 034, 037, 038, 039, 042, 043, 044, 045, 047, 049,
050 (バッチ run_id/checkpoint ジャーナル), 051 (E2E/クロスブラウザ), 052 (詳細度4レベル+行数目安),
061, 064, 071, 089, 091, 095 (クラス規約の機械強制未実装: `src/lint/coding-rules.ts` に構造 rule なし),
107 (駆動方向リスク依存・エンベロープ思想が yaml 未統合、yaml 自体 draft)。

## §6 防御層 / 運用機構 parity

- 三重の網の commit 層: `.git/hooks/*` は HELIX 由来 legacy・非追跡。UT-TDD 所有の追跡 commit hook なし
  (→ PLAN-L7-424/347 で既起票)。
- CI: `harness-check.yml:29` は ubuntu のみ。zip spec-gate は 2 OS matrix。source repo への windows job は
  PLAN-L7-235 が「別判断」と明示済 (PO 既決事項、再判断は PO へ)。
- assign/signals/schedule-live は PLAN-L6-50/L6-52/L7-412 (confirmed) が対応。単一台帳 UI・即時 RAG 反映の
  1:1 は未確認 (機能欠損とはしない)。

## §7 repo 自己宣言との整合

- schedule yellow/draft 11 行は概ね実態整合。163 semantic item 自己監査 (PLAN-L4-27) は 163/163
  `pending_review` = 着手 0%。
- `PLAN-L6-64:57` が REVERSE-395 待ちのまま stale (schedule 側は解除済) → 本監査で修正。
- PLAN-L6-70: Slice1 + Slice2 の工程/プロダクト skill は実装済だが status draft のまま。資料ファミリ skill
  9 本は未着手 → 本監査で現在地追記。
- `.ut-tdd/cache/Vモデル設計ドキュメント_checked_canonical.zip` sha256 実測 `96103228…` ≠ manifest 宣言
  `47b9a900…`。実行時参照 0 件で機能影響なしだが provenance 再現性の欠落。Desktop 原本は manifest と一致。

## §8 追補 (2026-07-13 merge 時に発見): PLAN 番号の runtime 間衝突

origin/main に同一番号・別 slug の PLAN が 5 組存在する: L6-70 / L7-417 / L7-419 / L7-424 / L7-425
(各 2 ファイル。Claude 系と Codex 系が独立採番した結果)。本監査の当初起票 PLAN-L6-71 も Codex 版
`PLAN-L6-71-plan-asset-canonical-migration-contracts` と衝突したため **PLAN-L6-78 へ改番**した。
plan_id (full slug) は一意だが、短縮表記「PLAN-L7-424」等は既に曖昧で、schedule/references の短縮参照が
誤読リスクを持つ。番号 prefix の一意性 lint または採番 SSoT (次番号の予約機構) が route 候補
(起票判断は PO へ。既存 5 組の改番は両ランタイム調整が要るため本監査では行わない)。

## Finding Route (起票結果 — PO 指示 2026-07-13「未起票であれば起票する」)

| finding | 差し込み先 | 処置 |
|---|---|---|
| §1 catalog errata 6 件 + §2 slot 6 件 + §4 disposition 再判断 (041/048/060/062/065/070) + §7 cache provenance | **PLAN-L4-22** (draft、disposition/profile SSoT) | スコープ追記済 (本監査を references へ追加) |
| §3 security 実体化 (STRIDE/供給網/鍵管理/監査ログ + RBAC 等の na 明文化) | **PLAN-L4-29** (新規) | 起票済 |
| §5 ZIP-095 構造規約の機械強制 (analyzer/oracle/hard gate) | **PLAN-L6-78** (新規、L7 は後続起票、当初 L6-71 で起票→main の Codex 版 PLAN-L6-71 と番号衝突のため改番) | 起票済 |
| §1 ZIP-DOC-012 テスト計画書 slot | PLAN-RECOVERY-10 (draft、右肺) + L4-22 errata | 既起票 (A-185 §C-5 と同一 route) |
| §4 敵対検証エンジン機械化 | PLAN-L6-53 (draft) | 既起票 |
| §4 目的別ダイジェスト自動生成 | PLAN-L7-302 (draft、context tiering) | 既起票 (合流) |
| §4 図面 DSL / 依存グラフ | PLAN-L7-247/248 (parked) | 既起票 (parked 解除判断は PO) |
| §6 commit hook 追跡化 | PLAN-L7-424 / L7-347 (draft) | 既起票 |
| §6 source repo windows CI | PLAN-L7-235 が明示的にスコープ外と宣言 | PO 既決 (再判断は PO 判断待ち) |
| §7 PLAN-L6-64 stale / PLAN-L6-70 現在地 | 各 PLAN 本文 | 修正済 |

## Boundary

本監査は Recovery/Refactor PLAN を自動起票しない。上記の新規起票 (L4-29 / L6-78) は PO の明示指示
(2026-07-13 goal) に基づく。status 遷移 (L6-70 の confirmed 化等) は evidence gate を要するため行わない。
