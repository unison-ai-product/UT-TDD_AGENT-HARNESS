# v4-roadmap 退役した派生物 (2026-11-13 の見直し前)

2026-11-13 の見直し (#1005 のコメント 6822862705 / 6844628646) で、v4 の要件の区分 (残す 12 / 簡素化 32 / 先送り 21 / 撤回 15) と版のはしご (0.3.0 / 0.4.0 / 0.5.0 / 1.0.0) が決まった。
`docs/governance/candidates/v4-roadmap/` の派生物のうち、見直し前の計画 (版2.0、旧 R03〜R09・0.6.0〜0.9.0) から作ったもので、現行の版のはしごと trace に置き換わったものを、同じ相対 path でここへ移した (#1672)。

- 現行の割り当ては `docs/governance/candidates/v4-roadmap/README.md` の「版のはしご」と `trace/` の 2 本である。ここのファイルは現行の割り当てには使わない。
- 退役の理由: これらの生成元の `data/*.json` は生成スクリプト (python tool) が repo に無く、再生成して差分 0 を確かめられない。版のはしごが変わったので、手で直すと FR-080 (派生する一覧は手で編集しない) にも反する。
- 移した文書のリンクは、移動後の位置から元の文書へ辿れるよう付け替えてある。

| path (この dir からの相対) | 退役の理由 |
|---|---|
| `data/*.json` (10 本) | 版2.0 の版・依存・対応表の元データ。生成スクリプトが repo に無く、旧 0.6.0〜0.9.0 を前提にしている |
| `01_RELEASE_MATRIX.md` | `data/releases.json` から作った版一覧。旧 0.6.0〜0.9.0 を含む |
| `VIEWER_CHECK.md` | repo に無い閲覧 HTML の確認記録 |
| `trace/CAPABILITY_MATRIX.md` | `data/capabilities.json` から作った版別の能力表 |
| `trace/ADDITIONS.md` | `data/additions.json` から作った追加要求の対応表 (旧 FR 割当) |
| `migration/00_REPLACEMENT_MATRIX.md` | `data/migration_manifest.json` から作った旧 R 基準の置換表 |
| `migration/01_AUTHORITY_AND_RECORDS.md` | 旧 R03〜R10 基準の正本・JSON の移行手順 |
| `migration/05_SURFACE_AND_SCHEMA_PLAN.md` | 旧 R 基準の既存コード面の入れ替え案 |
| `workstreams/01_SCHEDULING.md`、`07_SCHEDULING_EXAMPLE.md` | 順序予測・配布・再計画 (旧 0.4.0〜0.9.0)。裏付ける要求は先送りか撤回 |
| `workstreams/06_BUGBOT.md` | BugBot (旧 0.6.0)。裏付ける要求が無い |
| `execution/01_DEPENDENCIES_AND_WORK_PACKAGES.md` | 旧 R 基準の依存と作業単位 |
| `execution/02_PR517_INTEGRATION.md` | PR #517 への差し込み指示 (決定台帳と候補 3 文書に置き換わった) |
| `execution/03_CONTRACT_DECISIONS.md` | 旧 R 基準・旧 FR 番号の契約判断案 |
