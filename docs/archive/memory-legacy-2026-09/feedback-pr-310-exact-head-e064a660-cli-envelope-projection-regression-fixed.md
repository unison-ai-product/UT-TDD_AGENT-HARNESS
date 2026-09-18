---
memory_id: memory:feedback:pr-310-exact-head-e064a660-cli-envelope-projection-regression-fixed
kind: feedback
title: "PR #310 exact HEAD e064a660 CLI envelope projection regression fixed"
tags: ["cli-regression", "cross-review", "exact-head", "issue-193", "pr-310"]
updated_at: 2026-08-13T11:15:00.871Z
---

PR #310 の exact HEAD を c313b0fe から e064a660 へ更新。Claude 非author review の W-1/A1/A2（CLI result-file 投影式を実発火する回帰オラクル不足）を受理し、tests/cli-surface.test.ts の U-DOCTORENV-016 を追加した。実リポジトリで node src/cli.ts doctor --setup-smoke --result-file <temp> --json を起動し、exit 0/1 を許容しつつ schema_version=v4、scope=setup-smoke、profile=consumer-setup-smoke、check_ids=[setup-smoke]、strict options 3キーを生成物から検査する。さらに src/doctor/result-file.ts の writer/build 入力 scope/profile を DoctorResultEnvelopeScope / DoctorRunProfileId に型付けし、L6設計の実シグネチャ (deps, options)、L7 test-design/PLAN の U-DOCTORENV-016 対応を更新。型検査とBiome、U-DOCTORENV対象18件は成功（直接実行はsnapshot fenceのruntime lock残存差分で終了時に失敗したが、テスト本体は全件pass）。CI run と exact-head Claude delta review を実施し、blocking 0 を確認してからmergeすること。
