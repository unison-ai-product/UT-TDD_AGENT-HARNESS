# A-108 - Orphan Implementation vs PLAN Audit (2026-06-09)

## Trigger

PO /goal: "変更があったのに PLAN が起票されていない (Codex 制御が効いていない疑い) 箇所を洗い出す"。L6 進行中のため本監査は **記録のみ** (src/ 実装・PLAN 大量起票はしない = L6 WIP との衝突回避 + 86c61fa の「ついで実装」再演回避)。

## Method

- `find src -name "*.ts"` の全実装ファイルを `docs/plans/PLAN-*.md` の `generates` / scope / 本文参照と grep 照合。
- 0 ヒット = orphan 候補 → genesis commit (`git log --diff-filter=A`) と CLI/doctor 配線を確認。
- `git log --oneline -60 -- src/` で PLAN/IMP/A 番号を持たない feat/fix コミットを抽出。

## Finding: 規律は概ね健全、ただし単一コミットに orphan が集中

workflow 改善 feature は L6 (機能設計) + L7 (実装) + REVERSE (back-fill) の三つ組が約20 feature で一貫。問題は **コミット 86c61fa**「feat(harness): IMP-074/075/078 — module-drift lint + asset-drift carry plan_id + handover 品質増分 (**5 gap**)」に集中。subject scope (module-drift / handover品質) 外の実装を同梱していた。

### Orphan 実装 (対応 PLAN 皆無 — generates / slug / title いずれにも不在)

| orphan file | LOC | 配線 | 設計トレース | genesis | 後続 PLAN-less 変更 |
|---|---|---|---|---|---|
| `src/gate/review-tier.ts` + `tests/gate-review-tier.test.ts` | 153 + 102 | 新 CLI `gate review-tier` (cli.ts:545) | L4 architecture/function, L6 cross-review-enforcement, L7/L9 test-design に言及 | 86c61fa | — |
| `src/lint/rule-drift.ts` | 81 | 新 doctor check (doctor/index.ts:312) | CLAUDE/AGENTS adapter marker のみ・設計 doc 無 | 86c61fa | — |
| `src/team/run.ts` | 74 | 新 CLI `team run` (cli.ts:46) | L1/L4/L6 design に言及 | 86c61fa | — |
| `src/runtime/provider-handover.ts` | 132 | cli 経由 | L4-03 function のみ (impl PLAN 無) | 86c61fa | 0054e0b "fix: enforce provider handover review gates" (PLAN/IMP 参照なし、cli.ts 53行) |

- `gate review-tier` と `team run` は**ユーザー向け新コマンド**で §工程表 / pair-freeze / review 前置を一切通さず実装された (最も強い control-bypass 兆候)。
- `src/runtime/adapter.ts` の初版 (44行) も 86c61fa 発祥だが、後で PLAN-L6-20/L7-21/REVERSE-20 (runtime-adapter-session-lifecycle) が retroactively 被覆済 → orphan ではない。

### Commit hygiene (Minor)

- `0047f5b feat: add runtime adapter session lifecycle` は subject に ID 無しだが PLAN-L7-21 実在・正規 (1 PLAN=1 commit / subject に ID の規律漏れのみ)。

### Systemic root cause

doctor に **impl → PLAN トレーサビリティ検査が無い**。既存は `module-drift` (src ⇔ architecture §3.1) と `pair-freeze` (design ⇔ test-design) のみで、いずれも PLAN を見ない。「設計 doc に名前が載っていれば PLAN 無しでも通る」状態 = [[feedback_coverage_not_substance]] と同型の false-confidence。これが 86c61fa の orphan を機械的に止められなかった理由。

## Remediation (backlog 化、実装は L6 完了後)

- **IMP-087**: 4 orphan (review-tier / rule-drift / team-run / provider-handover) に三つ組 (L6/L7/REVERSE) を遡って起票し既存実装を設計へ合流。
- **IMP-088**: doctor に impl↔PLAN traceability lint を新設 (全 src module / CLI command / lint / doctor check が PLAN の generates か scope に紐づく、孤児 fail-close)。86c61fa を本来止めるべきだった機械担保。**先に IMP-088 (再発防止) → 炙り出し → IMP-087 back-fill** の順を推奨。

## Note

現 working tree に PO の L6 WIP 多数 (L6 design doc 群 / src/lint/l6-completion.ts / doctor / PLAN-L6-22 等)。本監査は docs/improvement-backlog.md と本 audit のみ追記し、src/・L6 design doc・doctor には一切触れていない。
