# 資料の整合検査結果

**結果：PASS（資料検査のみ）。**

これは計画のID・参照・依存・移行順と、固定した架空scheduleの検査です。UTの実装/CI/セキュリティ試験/非著者レビュー/製品受入を実行した結果ではありません。

| 検査 | 結果 | 詳細 |
|---|---|---|
| JSON parse | PASS | {"files": 9} |
| IDs / coverage / DAG / prerequisite / migration order | PASS | {"releases": 11, "work_packages": 39, "original_BR_mapped": 32, "original_FR_mapped": 59, "original_AC_mapped": 72, "additional_requirements": 13, "release_acceptance_cases": 54, "additional_acceptance_cases": 39, "migration_domains": 20, "capabilities": 20} |
| Generated Markdown parity | PASS | CHECK OK: 16 generated Markdown files |
| Relative Markdown links | PASS | {"checked_relative_links": 111, "missing_or_escape": 0} |
| Synthetic schedule resource / dependency / stage order | PASS | {"makespan_fixture_units": 24, "dependency_violation_count": 0, "resource_conflict_count": 0, "task_count": 5} |
| Validator negative self-tests | PASS | {"rejected_invalid_fixtures": 7, "scope": "documentation validator only"} |
| PR517 compact handoff | PASS | {"characters": 2076, "max": 4000} |

構造上のcoverageは「元の要求IDがどの版へ割り当てられたか」の点検です。元文書と新しい設計の意味的な全整合や、その実装成功を保証しません。正式反映時のBR→FR→AC照合、設計判断採択、実テスト、独立レビューは別途必要です。

scheduling例の時間はすべて検証用の架空値です。実プロジェクトのETA、最適解、削減効果を示していません。負系self-testもこの資料validatorの検査であって、UT dispatcherの負系試験ではありません。

再実行：`python tools/render_roadmap.py --check` / `python tools/validate_roadmap.py`。外部通信なし。

[JSON結果](data/validation_results.json) / [総目次](README.md)
