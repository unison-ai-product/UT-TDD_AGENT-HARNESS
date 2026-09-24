---
layer: L7
executed_at_layer: L7
artifact: test-design
status: draft
plan_id: PLAN-L7-676-release-consumer-dev-start
github_issue_id: 676
---

# Release consumer で開発を開始できる状態にする test design

`PLAN-L7-676` と `PLAN-REVERSE-676` 専用の pair artifact である。
本表の ID は全て **CANDIDATE**。実装 PR で test が存在した時点で同番号の `U-RCDEV-*` へ 1:1 昇格する。
既存 `CANDIDATE-U-PACKRT-*` / L7-529 の identity oracle / `CANDIDATE-ST-PACKCANARY-*` は再採番・再所有しない。

共通 fixture: 一時ディレクトリの空 git repo。(i) origin 無し、(ii) origin = `https://github.com/example/probe.git`、
(iii) (ii) + `package.json {"type":"module"}`、(iv) (ii) + `package.json` (type 無し)。network 不使用、実 harness.db 不使用 (fixture 内 db)。
「bundle 起動」は build 済み compiled ESM を fixture 外に置いて起動する形 (PR-2a 以降)。source 実行との差は各 oracle に明記する。

## PR-1 identity / repo-root

| ID | oracle | 違反 / mutation (Red になるべき変異) |
| --- | --- | --- |
| CANDIDATE-U-RCDEV-001 | fixture (i) で `setup --solo` が中断せず adapter / テンプレート / state 記録を出力し (`written` に identity path を含まない)、出力に L7-529 の typed identity deny code と復旧手順 (`git remote add origin` → setup 再実行) を含み、`identity: denied (identity_repository_unbound): ...` と復旧手順 2 行を stderr に出し、終了コードが 2 である (PLAN §3.3-1) | (m1) deny 表示を削る → 文字列 assert 失敗。(m2) 終了コードを 0 または 1 にする → exit assert 失敗。(m4) 新しい deny code を発明して表示する → code assert 失敗。(m3) identity deny で throw / 中断させる (L7-529 §3.2.1 違反) → adapter 不在で失敗 |
| CANDIDATE-U-RCDEV-002 | fixture (i) で setup 後に origin を追加して再実行すると `ut-tdd.project.json` が作られ、1 回目に出力した各ファイルの bytes は変わらない (L7-529 §3.2 再実行規則、no-op safe) | (m1) 再実行時にテンプレートを再生成して内容を変える → bytes 差分で失敗。(m2) 再実行で identity create を skip する → marker 不在で失敗 |
| CANDIDATE-U-RCDEV-003 | fixture (ii) setup 後、`hook work-guard` / `hook agent-guard` / `session start` / `session summary` / `hook subagent-stop` の 5 経路で `requireRuntimeRepoRoot` が fixture root を返す (cwd = fixture 配下の subdir でも同じ。path は long path のみ、8.3 alias は #678 の所有)。fixture (i) (identity deny のまま) では 5 経路が fail-close し、error に復旧手順を含む | (m1) setup の identity 書き込みを skip → 5 経路が throw。(m2) `isRepoRoot` から marker 条件を外す → 失敗。(m3) hook error の復旧手順を削る → (i) 側 assert 失敗。**negative**: fixture の外 (親 dir) では null のまま (fallback を `.git` 単独受理に緩める変異 → 親 repo を誤認して失敗) |
| CANDIDATE-U-RCDEV-004 | fixture (ii) setup 直後 (未 commit)、setup 出力に `ut-tdd.project.json` の commit が必要である旨と `git add ut-tdd.project.json` / `git commit` を含む | (m) `commitRequired` の表示分岐を削る → 失敗 |
| CANDIDATE-U-RCDEV-005 | 未 commit 状態の `session start` の `project_memory_root_project_identity_unavailable` 出力に同じ commit 手順が併記される。commit 後は同コマンドがこの code を出さない | (m) 文言追加を外す → 失敗。L7-529 の HEAD-strict read を緩める変異 (working tree を読む) → 「未 commit で code が出る」側が失敗 |

## PR-2a skills 埋め込み + 展開

| ID | oracle | 違反 / mutation |
| --- | --- | --- |
| CANDIDATE-U-RCDEV-006 | build した generation の receipt `source_files` が `git ls-files skills` の md / yaml 全件 (`.gitkeep` 除く) を含み、各 sha256 が HEAD blob と一致 | (m1) plugin で文字列注入する方式に変える → skills が `source_files` に現れず失敗。(m2) 1 件を埋め込み index から外す → 件数不一致で失敗 |
| CANDIDATE-U-RCDEV-007 | bundle 起動の fixture (ii) で setup 後と session start 後の両方で、`.ut-tdd/assets/skills/` の各ファイル digest が埋め込み bytes と一致し、`skill suggest --text "<SKILL_MAP の既知 trigger 語>"` が 1 件以上を返す。`git check-ignore .ut-tdd/assets/skills/<x>.md` が ignore を返す | (m1) 展開を削る → 0 件。(m2) 投影の root を `skills/` 固定に戻す → 0 件。(m3) ignore 設定を外す → check-ignore 失敗。(m4) session start 側の展開を外し、setup 後に展開物を削除 → session start 後の digest 照合が失敗 |
| CANDIDATE-U-RCDEV-008 | `formatAdapterPrompt` に渡る `required_paths` / `optional_paths` (= adapter prompt に書かれる path) が全て解決関数の出力で、fixture で `existsSync` true | (m) 投影 path を bundle 内の名前 / 仮想 path にする → 不在で失敗 |
| CANDIDATE-U-RCDEV-009 | consumer `skills/<既存名>.md` を置くと injection path はそれを指し、`.ut-tdd/assets/skills/` 側を指さない。consumer `skills/<新規名>.md` は catalog に追加される (件数 = 埋め込み + 1) | (m1) 優先順を逆にする → 同名が assets 側を指し失敗。(m2) merge せず consumer 側だけ読む → 件数不一致 |
| CANDIDATE-U-RCDEV-010 | `.ut-tdd/assets/skills/<x>.md` を改変 / 削除して `rebuildHarnessDb` を実行すると bundle bytes に復元される。一致している場合は書き込み 0 (mtime 不変) | (m1) 不一致検査を削る → 改変が残る。(m2) 常に書き直す → mtime 変化で失敗。**harness 自身**: source repo で投影結果 path が現行 (`skills/...`) と同一 (回帰) |

## PR-2b design root / plan lint

| ID | oracle | 違反 / mutation |
| --- | --- | --- |
| CANDIDATE-U-RCDEV-011 | resolver: `docs/design/harness/` が在る root では `docs/design/harness`、無い root では `docs/design` (test-design も同規則)。catalog の `authoring_source_path` `docs/design/harness/L6/x.md` が consumer では `docs/design/L6/x.md` へ写像される | (m1) resolver を固定値に戻す → consumer 側 assert 失敗。(m2) 優先順を逆にする → harness 側 assert 失敗 |
| CANDIDATE-U-RCDEV-012 | 置き場所不在の fixture で `gate G1..G7` と `vmodel lint` が ENOENT 例外を出さず、typed な「未作成」を返す (判定の pass/fail 自体は assert しない = gate 対応は非 scope) | (m) 存在確認を外す → ENOENT で失敗 |
| CANDIDATE-U-RCDEV-013 | `docs/plans` 不在の fixture で `plan lint` が crash せず 0 件を報告する。`docs/plans` 在りでは現行と同じ結果 | (m) `readdirSync` 前の存在確認を外す → ENOENT |

## PR-2c テンプレート書き出し

| ID | oracle | 違反 / mutation |
| --- | --- | --- |
| CANDIDATE-U-RCDEV-014 | `ut-tdd vmodel template --required` (PLAN §3.1.3) が resolver 写像後の catalog path へ書き、出力するファイル bytes が埋め込み (= `AUTHORING_TEMPLATE_INVENTORY` の対象 source の HEAD blob) と一致し、書いた path を表示する | (m) 埋め込み対象を 1 family 外す → 欠落で失敗 |
| CANDIDATE-U-RCDEV-015 | consumer に同名ファイルが既にある場合は上書きせず (bytes 不変)、`skip (exists) <path>` を表示して exit 0。未知の `doc_type_id` を 1 件含めると何も書かず `unknown template <id>` で exit 1。`--dry-run` は書き込み 0 | (m1) 上書きする → bytes 変化で失敗。(m2) 未知 ID の前に既知分を書く → 書き込み 0 assert で失敗。(m3) `--dry-run` で書く → 失敗 |

## PR-3 生成物

| ID | oracle | 違反 / mutation |
| --- | --- | --- |
| CANDIDATE-U-RCDEV-016 | fixture (ii) setup 直後の `db status` が現行 schema version (> 0、`gate_runs` 存在)、`session start` digest が DEGRADED を含まない。setup は token telemetry を走査しない (home 走査 stub の呼び出し 0) | (m1) setup から rebuild を外す → schema v0。(m2) `skipTokenTelemetry` を外す → stub 呼び出し > 0 |
| CANDIDATE-U-RCDEV-017 | 生成 `harness-check.yml` を YAML parse し、(a) launcher 経由の ut-tdd step が全て activation pointer (`.ut-tdd/runtime/activation/active.json`) の存在を条件に持つ、(b) pointer 不在時に notice を出す step があり、それ自体は失敗しない、(c) lock / scripts の無い fixture で `npm ci` / `cache: npm` / `npm run <script>` が無条件実行されない | (m1) ut-tdd step の条件を外す → (a) 失敗 (CI で exit 78)。(m2) notice step を削る → (b) 失敗 (黙って skip)。(m3) 旧 npm テンプレートへ戻す → (c) 失敗 |
| CANDIDATE-U-RCDEV-018 | fixture (iii) / (iv) の両方で `commitlint.config.cjs` が生成され、`node -e "require('./commitlint.config.cjs')"` が読める (依存未導入でも設定ファイル自体の構文は読める)。既存 `commitlint.config.js` がある fixture では bytes 不変で警告が出る。setup 出力に依存の導入コマンドが含まれる | (m1) `.js` + `module.exports` に戻す → (iii) で ESM として読まれ失敗。(m2) 既存 `.js` を上書き → bytes 変化 |

## PR-T1〜T3 テンプレート / skill 移植 (rev 2、PLAN §3.5)

zip は repo root の `Vモデル設計ドキュメント_checked.zip` (gitignore 対象) であり、CI には無い。zip を入力に取る oracle は、PR-T が port index
(`docs/templates/vmodel/README.md`) に記録する zip entry 名と sha256 を正とし、CI では tracked な port index とテンプレートだけを読む。

| ID | oracle | 違反 / mutation |
| --- | --- | --- |
| CANDIDATE-U-RCDEV-019 | catalog の `default_status=required` かつ `category≠upgrade-delta` の 21 slot の全てに、frontmatter の `doc_type_id` が一致するテンプレートが `docs/templates/vmodel/` に exactly 1 本ある | (m1) 1 slot のテンプレートを削る → 欠落 slot 名で失敗。(m2) 同じ `doc_type_id` を 2 本に書く → 重複で失敗。(m3) upgrade-delta slot を required 集合に戻す → 件数 23 で失敗 |
| CANDIDATE-U-RCDEV-020 | 各テンプレートの frontmatter に `source_id: ZIP-DOC-NNN` (1 件以上)・zip entry 名・sha256 があり、各 `source_id` の disposition 行 (`vmodel-document-disposition-catalog.md`) の target が当該 slot の authoring path / directory を指す (L6 は既存テンプレートを正とする例外、L2 は PLAN §3.5.3 の構成元記載と一致) | (m1) `source_id` を別 slot の ZIP-DOC に差し替える → target 不一致で失敗。(m2) provenance 欄を削る → 失敗 |
| CANDIDATE-U-RCDEV-021 | port index が zip テンプレート 57 本 (01〜53、96、102、108、109) の全てを「slot source」か「optional」のどちらか一方だけに分類し、optional の本は `docs/templates/vmodel/optional/` に存在する | (m1) 1 本を index から外す → 件数 56 で失敗。(m2) 1 本を slot と optional の両方に書く → 重複分類で失敗 |
| CANDIDATE-U-RCDEV-022 | 全テンプレートが Markdown (`.md`) であり、各テンプレートを雛形として作った文書を `parseConfirmDoc` が構造エラー無しで読める | (m1) 1 本を YAML のまま置く → `.md` 検査で失敗。(m2) 見出し構造を壊す → parse 失敗 |
| CANDIDATE-U-RCDEV-023 | `skills/` に zip 由来の skill 7 本 (`vmodel-<name>.md`) と役割別ガイド 5 本 (`vmodel-role-<role>.md`) があり、全て `SKILL_MAP.md` に登録され、既存 skill と名前が衝突しない。bundle の receipt `source_files` が全件を含む (CANDIDATE-U-RCDEV-006 と同じ検査) | (m1) 1 本を SKILL_MAP から外す → 未登録で失敗。(m2) 既存 skill 名で上書きする → 衝突で失敗 |
| CANDIDATE-U-RCDEV-024 | tracked tree・Pack 出力・bundle のどこにも zip 由来の `.py` (`tools/*.py`) と `requirements.txt` が無い | (m) `tools/check.py` を `docs/templates/vmodel/` に追加 → 失敗 |
| CANDIDATE-U-RCDEV-025 | `profiles.yaml` / `catalog.yaml` / `diagrams.yaml` / `traceability.yaml` / `wbs.yaml` が別ファイルとして出荷されず、zip `profiles.yaml` の profile id 集合が `vmodel-document-scale-profiles.md` §1 の profile 行 (8 件) に含まれる | (m1) `docs/templates/vmodel/profiles.yaml` を追加 → 第 2 の SSoT として失敗。(m2) scale-profiles.md から 1 profile 行を削る → 包含で失敗 |

## PR-G0〜PR-VL consumer 検証 (rev 2、PLAN §3.6)

共通 fixture (v): fixture (ii) に PR-T1 のテンプレートから作った L1〜L7 の文書一式を `docs/design/` / `docs/test-design/` へ置いたもの。
(vi): (v) から必須 slot を 1 つ欠いたもの。どちらも `gate-design.md` を置かない。

| ID | oracle | 違反 / mutation |
| --- | --- | --- |
| CANDIDATE-U-RCDEV-026 | fixture (v) で `loadGateConfirmDocs` が ENOENT を出さず、埋め込みの gate 定義を使う。consumer に `docs/governance/gate-design.md` を置くとそれが優先される | (m1) 埋め込みを外す → ENOENT で失敗。(m2) 優先順を逆にする → consumer 側の定義が使われず失敗 |
| CANDIDATE-U-RCDEV-027 | fixture (v) で G1〜G6 が `applicable:true` かつ pass、(vi) では欠いた slot 名を含む failed。どちらも「could not run」を含まない | (m) resolver を `docs/design/harness` 固定に戻す → (v) が「could not run」または applicable false で失敗 |
| CANDIDATE-U-RCDEV-028 | fixture (v) で `coverage/coverage-summary.json` 不在の G7 が typed な「coverage evidence missing」で failed (crash しない)。80% 以上の summary を置くと coverage 構成要素が pass | (m1) 存在確認を外す → 例外で失敗。(m2) 不在を pass 扱いにする → failed 期待で失敗 |

G8〜G14 の oracle (029〜035) は PLAN §3.6-4 の共通述語 S / I / T / E / F / A と gate 固有述語を gate ごとに固定する。各 oracle の fixture は
(v) に当該 gate の slot 文書 (テンプレート由来) と、述語を全て満たす evidence manifest (`.ut-tdd/evidence/<dir>/ok.json`) を置いた「正常形」とし、
正常形で `applicable:true` かつ static 部分 pass、message に `未判定 (review): <approval_role>` を含むことを先に確認する。各 mutation は正常形から
1 軸だけを変え、指定の violation 文字列を含む failed になること。**「slot 文書が在れば pass」「manifest が在れば pass」だけの実装は、
(m-T) / (m-E) / (m-F) / (m-A) / gate 固有 mutation のどれかで必ず Red になる**。

| ID | oracle (正常形の gate) | 違反 / mutation (1 軸) |
| --- | --- | --- |
| CANDIDATE-U-RCDEV-029 | G8 (`DOC-L8-INTEGRATION-TEST-DESIGN`、`IT-`、pair L5、`g8-integration`) | (m-S) case 表の必須列を 1 つ削る → `missing section`。(m-I) `IT-` 行 ID を重複させる → `duplicate case id`。(m-T) 1 行の L5 cite を未定義 ID に変える → `trace target missing`、cite を外す → `untraced case`。(m-E1) 1 command の `exit_code` を 1 → `exit_code is non-zero`。(m-E2) `output_digest` を `sha256:xyz` → `invalid digest`。(m-E3) `evidence_path` を repo 外 / 不在 → `evidence_path missing`。(m-E4) `schema_version` を `g9-system-evidence-v1` → `invalid schema_version`。(m-F) 設計済み `IT-` ID を 1 件 manifest から外す → `missing row evidence`。(m-A) `artifacts.integration_results` を削る → `missing artifact integration_results`。(m-R) message から review 未判定を消す実装 → message assert で失敗 **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g8-integration/ok.json` だけを 1 軸で壊す)**: (m-E-G8a) `schema_version` を `g9-system-evidence-v1` にする → `invalid schema_version`。(m-E-G8b) `gate` を `G9` にする → `gate must be G8`。(m-E-G8c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G8d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G8e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。この 5 つは G8 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) |
| CANDIDATE-U-RCDEV-030 | G9 (`DOC-L9-SYSTEM-TEST-DESIGN`、`ST-`、pair L4、`g9-system`) | (m-T) 1 行の L4 cite を L5 の ID に変える (pair 外) → `untraced case`。(m-F) deferred の `plan_id` を実在しない PLAN にする → `stale defer`。(m-A) `artifacts.system_manifest` を削る → `missing artifact`。(m-G9) `security` family の行を全て `ST` に変える → family 欠落で failed。(m-E) `exit_criteria.failed_mandatory_count = 1` → failed **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g9-system/ok.json` だけを 1 軸で壊す)**: (m-E-G9a) `schema_version` を `g8-integration-evidence-v1` にする → `invalid schema_version`。(m-E-G9b) `gate` を `G8` にする → `gate must be G9`。(m-E-G9c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G9d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G9e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。この 5 つは G9 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) |
| CANDIDATE-U-RCDEV-031 | G10 (`DOC-L10-UX-VALIDATION`、`UXV-`、pair L2、`g10-ux`) | (m-T) 1 行の画面 ID cite を `DOC-L2-SCREEN` に無い ID → `trace target missing`。(m-A) `artifacts.browser_visual_a11y_results` を削る → `missing artifact`。(m-G10a) slot 文書を `status: skipped` + `skip_reason` 非空 + profile で slot 無効 → n/a passed (正常形 2)。(m-G10b) (m-G10a) から `skip_reason` を空にする → failed。(m-G10c) (m-G10a) のまま profile で slot を有効にする → failed **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g10-ux/ok.json` だけを 1 軸で壊す)**: (m-E-G10a) `schema_version` を `g9-system-evidence-v1` にする → `invalid schema_version`。(m-E-G10b) `gate` を `G9` にする → `gate must be G10`。(m-E-G10c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G10d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G10e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。この 5 つは G10 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) |
| CANDIDATE-U-RCDEV-032 | G11 (`DOC-L11-TRACE-UAT`、`UAT-`、pair L1/L3〜L7、`g11-uat`) | (m-G11a) `end_to_end_trace_review` から `DOC-L3-FUNCTIONAL` の要件 ID を 1 件削る → 要件未列挙で failed。(m-G11b) 1 件を `blocked` にする → failed。(m-G11c) `po_uat_decision.decision` を `maybe` → failed。(m-G11d) `po_uat_decision.revision` を削る → failed。(m-T) `UAT-` 行の cite を pair 外 (L8) の ID だけにする → `untraced case`。(m-A) `artifacts.po_uat_decision` を削る → `missing artifact` **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g11-uat/ok.json` だけを 1 軸で壊す)**: (m-E-G11a) `schema_version` を `g12-acceptance-evidence-v1` にする → `invalid schema_version`。(m-E-G11b) `gate` を `G12` にする → `gate must be G11`。(m-E-G11c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G11d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G11e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。この 5 つは G11 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) |
| CANDIDATE-U-RCDEV-033 | G12 (`DOC-L12-ACCEPTANCE`、`AT-`、pair L3、`g12-acceptance`) | (m-G12a) `deploy_receipt.revision` を 39 桁にする → failed。(m-G12b) `deploy_receipt.environment` を削る → failed。(m-G12c) `rollback_readiness.rollback_command` を削る → failed。(m-T) `AT-` 行の cite を L3 に無い AC ID → `trace target missing`。(m-F) 設計済み `AT-` ID を 1 件外す → `missing row evidence` **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g12-acceptance/ok.json` だけを 1 軸で壊す)**: (m-E-G12a) `schema_version` を `g11-uat-evidence-v1` にする → `invalid schema_version`。(m-E-G12b) `gate` を `G11` にする → `gate must be G12`。(m-E-G12c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G12d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G12e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。この 5 つは G12 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) |
| CANDIDATE-U-RCDEV-034 | G13 (`DOC-L13-PRODUCTION-OBSERVATION`、`SMOKE-`、pair L12、`g13-post-deploy`) | (m-G13a) `window_end` を `window_start` 以前にする → failed。(m-G13b) 1 SLO の `observed` を削る → failed。(m-G13c) `rollback_decision.decision` を `unknown` → failed。(m-T) `SMOKE-` 行の `AT-` cite を外す → `untraced case`。(m-A) `artifacts.sli_slo_observation` を削る → `missing artifact` **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g13-post-deploy/ok.json` だけを 1 軸で壊す)**: (m-E-G13a) `schema_version` を `g12-acceptance-evidence-v1` にする → `invalid schema_version`。(m-E-G13b) `gate` を `G12` にする → `gate must be G13`。(m-E-G13c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G13d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G13e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。この 5 つは G13 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) |
| CANDIDATE-U-RCDEV-035 | G14 (`DOC-L14-OPERATIONAL-TEST`、`OT-`、pair L1 + L0、`g14-operational`) | (m-G14a) `VALUE` family の行から L0 目的 ID の cite を外す → failed。(m-G14b) `improvement_feedback` の 1 項目から `routed_to` を削る → failed。(m-T) `OT-` 行の L1 cite を未定義 ID → `trace target missing`。(m-A) `artifacts.value_results` を削る → `missing artifact`。(m-E) `exit_criteria.doctor_check` を別値 → failed **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g14-operational/ok.json` だけを 1 軸で壊す)**: (m-E-G14a) `schema_version` を `g13-post-deploy-evidence-v1` にする → `invalid schema_version`。(m-E-G14b) `gate` を `G13` にする → `gate must be G14`。(m-E-G14c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G14d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G14e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。この 5 つは G14 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) |
| CANDIDATE-U-RCDEV-036 | fixture (v) で `vmodel lint` が文書件数 > 0 と trace 結果を返し、文書の無い fixture (ii) では typed な「未作成」を返す (ENOENT なし) | (m) resolver を外す → (v) で 0 件または ENOENT で失敗 |
| CANDIDATE-U-RCDEV-037 | harness 自身 (source repo) の G1〜G10 の `evaluateStaticGate` 結果 (passed / applicable / message 集合) が実装の前後で一致する (回帰固定。G8〜G10 は既存 workflow lint の結果) | (m1) resolver の優先順を逆にする (`docs/design/` を先に見る) → 結果が変わり失敗。(m2) harness の G8 を共通述語へ切り替え、family prefix 要件を落とす → G8 の message 集合が変わり失敗 |

## E2E (観測は PLAN-L7-531 が所有)

PLAN-L7-531 の入力契約改訂で、fixture (i)〜(iv) に対し setup → Claude Edit / Codex apply_patch guard (正常系通過・禁止系 block) →
session start → plan lint → skill suggest を観測項目として追加する。rev 2 で次を加える (PLAN §3.7): clean consumer fixture でエージェントが
テンプレートから文書を書き、該当 gate が `applicable:true` で pass (欠落時は slot 名付き fail) し、同じ文書が非著者 review を通って receipt が
exact revision に束縛される。ここでは ID を振らない (531 が採番する)。
