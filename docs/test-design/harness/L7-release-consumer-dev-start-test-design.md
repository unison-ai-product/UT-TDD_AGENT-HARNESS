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
本表の未実装行の ID は **CANDIDATE**。実装 PR で test が存在した行は同番号の `U-RCDEV-*` へ 1:1 昇格する。
既存 `CANDIDATE-U-PACKRT-*` / L7-529 の identity oracle / `CANDIDATE-ST-PACKCANARY-*` は再採番・再所有しない。

共通 fixture: 一時ディレクトリの空 git repo。(i) origin 無し、(ii) origin = `https://github.com/example/probe.git`、
(iii) (ii) + `package.json {"type":"module"}`、(iv) (ii) + `package.json` (type 無し)。network 不使用、実 harness.db 不使用 (fixture 内 db)。
「bundle 起動」は build 済み compiled ESM を fixture 外に置いて起動する形 (PR-2a 以降)。source 実行との差は各 oracle に明記する。

## PR-1 identity / repo-root

| ID | oracle | 違反 / mutation (Red になるべき変異) |
| --- | --- | --- |
| U-RCDEV-001 | fixture (i) で `setup --solo` が中断せず adapter / テンプレート / state 記録を出力し (`written` に identity path を含まない)、出力に L7-529 の typed identity deny code と復旧手順 (`git remote add origin` → setup 再実行) を含み、`identity: denied (identity_repository_unbound): ...` と復旧手順 2 行を stderr に出し、終了コードが 2 である (PLAN §3.3-1) | (m1) deny 表示を削る → 文字列 assert 失敗。(m2) 終了コードを 0 または 1 にする → exit assert 失敗。(m4) 新しい deny code を発明して表示する → code assert 失敗。(m3) identity deny で throw / 中断させる (L7-529 §3.2.1 違反) → adapter 不在で失敗 |
| U-RCDEV-002 | fixture (i) で setup 後に origin を追加して再実行すると `ut-tdd.project.json` が作られ、1 回目に出力した各ファイルの bytes は変わらない (L7-529 §3.2 再実行規則、no-op safe) | (m1) 再実行時にテンプレートを再生成して内容を変える → bytes 差分で失敗。(m2) 再実行で identity create を skip する → marker 不在で失敗 |
| U-RCDEV-003 | fixture (ii) setup 後、`hook work-guard` / `hook agent-guard` / `session start` / `session summary` / `hook subagent-stop` の 5 経路で `requireRuntimeRepoRoot` が fixture root を返す (cwd = fixture 配下の subdir でも同じ。path は long path のみ、8.3 alias は #678 の所有)。fixture (i) (identity deny のまま) では 5 経路が fail-close し、error に復旧手順を含む | (m1) setup の identity 書き込みを skip → 5 経路が throw。(m2) `isRepoRoot` から marker 条件を外す → 失敗。(m3) hook error の復旧手順を削る → (i) 側 assert 失敗。**negative**: fixture の外 (親 dir) では null のまま (fallback を `.git` 単独受理に緩める変異 → 親 repo を誤認して失敗) |
| U-RCDEV-004 | fixture (ii) setup 直後 (未 commit)、setup 出力に `ut-tdd.project.json` の commit が必要である旨と `git add ut-tdd.project.json` / `git commit` を含む | (m) `commitRequired` の表示分岐を削る → 失敗 |
| U-RCDEV-005 | 未 commit 状態の `session start` の `project_memory_root_project_identity_unavailable` 出力に同じ commit 手順が併記される。commit 後は同コマンドがこの code を出さない | (m) 文言追加を外す → 失敗。L7-529 の HEAD-strict read を緩める変異 (working tree を読む) → 「未 commit で code が出る」側が失敗 |

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
| U-RCDEV-011 | resolver: `docs/design/harness/` が在る root では `docs/design/harness`、無い root では `docs/design` (test-design も同規則)。catalog の `authoring_source_path` `docs/design/harness/L6/x.md` が consumer では `docs/design/L6/x.md` へ写像される | (m1) resolver を固定値に戻す → consumer 側 assert 失敗。(m2) 優先順を逆にする → harness 側 assert 失敗 |
| U-RCDEV-012 | 置き場所不在の fixture で `gate G1..G7` と `vmodel lint` が ENOENT 例外を出さず、typed な「未作成」を返す (判定の pass/fail 自体は assert しない = gate 対応は非 scope) | (m) 存在確認を外す → ENOENT で失敗 |
| U-RCDEV-013 | `docs/plans` 不在の fixture で `plan lint` が crash せず 0 件を報告する。`docs/plans` 在りでは現行と同じ結果 | (m) `readdirSync` 前の存在確認を外す → ENOENT |

## PR-2c テンプレート書き出し

| ID | oracle | 違反 / mutation |
| --- | --- | --- |
| U-RCDEV-014 | `ut-tdd vmodel template --required` (PLAN §3.1.3) が resolver 写像後の catalog path へ書き、出力するファイル bytes が埋め込み (= PLAN §3.5.3 の port index `docs/templates/vmodel/README.md` が slot に対応付けた `docs/templates/vmodel/` 配下の source の HEAD blob。`--optional` は `docs/templates/vmodel/optional/` 配下。Pack 用の `AUTHORING_TEMPLATE_INVENTORY` は対象外) と一致し、書いた path を表示する 実装: `tests/release-consumer-vmodel-template.test.ts` | (m) port index の 1 slot のテンプレートを埋め込み対象から外す → 欠落で失敗 |
| U-RCDEV-015 | consumer に同名ファイルが既にある場合は上書きせず (bytes 不変)、`skip (exists) <path>` を表示して exit 0。未知の `doc_type_id` を 1 件含めると何も書かず `unknown template <id>` で exit 1。`--dry-run` は書き込み 0 実装: `tests/release-consumer-vmodel-template.test.ts` | (m1) 上書きする → bytes 変化で失敗。(m2) 未知 ID の前に既知分を書く → 書き込み 0 assert で失敗。(m3) `--dry-run` で書く → 失敗 |
| U-RCDEV-038 | port index で optional に分類された有効な ID (例: `ZIP-DOC-016`) を `ut-tdd vmodel template --optional ZIP-DOC-016` で書き出すと、`<designRoot>/optional/<port index の file 名>` (consumer では `docs/design/optional/...`) にファイルが 1 本だけ作られ、その bytes が bundle に埋め込まれた同テンプレートの bytes と一致し、stdout に `+ <その path>` の行が出て exit 0。`--slot` / `--required` の出力先には何も書かない。slot source に分類された ID (例: `ZIP-DOC-004`) を `--optional` に渡すと `unknown template ZIP-DOC-004` で exit 1 実装: `tests/release-consumer-vmodel-template.test.ts` | (m1) `--optional` を受理するだけで何も書かない → ファイル不在で失敗。(m2) 出力先を `<designRoot>/` 直下や slot path にする → path assert で失敗。(m3) 別の optional テンプレートの bytes を書く → bytes 不一致で失敗。(m4) `+ <path>` 行を出さない → stdout assert で失敗。(m5) slot source の ID を optional として受理する → exit 1 期待で失敗 |
| U-RCDEV-039 | fixture (v) で consumer 内の `docs/plans` (または書き出し先の親 directory) を consumer 外の directory へ junction (Windows) / symlink (Linux) 接続し、その配下へ書き出す slot を含めて `ut-tdd vmodel template --required` を実行する。別に、書き出し先 path 自体を consumer 外を指す dangling symlink にする。さらに、書き出し先 path 自体を既存の有効な symlink / junction にし、consumer 外の既存 file / directory を指す場合と consumer 内の既存 file / directory を指す場合をそれぞれ実行する (通常なら既存 destination として `skip (exists)` になる位置)。m2 の判別のため、junction / symlink ancestor の fixture では正常 slot を先、外部 ancestor 配下の slot を後に検査する順序で destination を並べる。期待: いずれも `template destination outside consumer root <path>` で exit 1、consumer 内・外のどちらにも 1 byte も書かれない (他の正常 slot も書かない)。有効な link の destination も `skip (exists)` より先に同じ deny となり、link 先の内容は変化しない。junction / symlink の無い正常 fixture では 014 と同じ出力になる (PLAN §3.1.3 書き込み境界、rev 17) 実装: `tests/release-consumer-vmodel-template.test.ts` | (m1) lexical な insideRoot 判定だけに戻す → consumer 外に file ができて失敗。(m2) 検査を destination ごとに書き込みと交互に行う → 正常 slot の部分書き込みで失敗。(m3) destination 自体の link 判定を外す → dangling symlink 経由の外部書き込みで失敗。(m4) 既存 destination の `skip (exists)` 判定を link 判定より先に行う → 有効な link destination が exit 0 になり失敗 |

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
| CANDIDATE-U-RCDEV-020 | 各テンプレートの frontmatter に `source_id: ZIP-DOC-NNN` (1 件以上)・zip entry 名・sha256 があり、各 `source_id` の disposition 行 (`vmodel-document-disposition-catalog.md`) の target が当該 slot の authoring path / directory を指す (L6 は既存テンプレートを正とする例外。L2 と、PLAN §3.5.3 の規則本文の例外句が列挙する 3 本 (L11 の ZIP-DOC-028、L13 の ZIP-DOC-011 / ZIP-DOC-021) は、disposition target の代わりに PLAN §3.5.3 の構成元表の記載と一致すること。例外はこの閉じた列挙に限る) | (m1) `source_id` を別 slot の ZIP-DOC に差し替える → target 不一致で失敗。(m2) provenance 欄を削る → 失敗。(m3) L13 に構成元表に無い ZIP-DOC (例: ZIP-DOC-034) を加える → 例外の列挙外かつ target 不一致で失敗。(m4) 例外 3 本のいずれかを別 slot (例: ZIP-DOC-028 を L12) の source に書く → 構成元表と不一致で失敗 |
| CANDIDATE-U-RCDEV-021 | port index が zip テンプレート 57 本 (01〜53、96、102、108、109) の全てを「slot source」か「optional」のどちらか一方だけに分類し、optional の本は `docs/templates/vmodel/optional/` に存在する | (m1) 1 本を index から外す → 件数 56 で失敗。(m2) 1 本を slot と optional の両方に書く → 重複分類で失敗 |
| CANDIDATE-U-RCDEV-022 | 全テンプレートが Markdown (`.md`) であり、各テンプレートを雛形として作った文書を `parseConfirmDoc` が構造エラー無しで読める | (m1) 1 本を YAML のまま置く → `.md` 検査で失敗。(m2) 見出し構造を壊す → parse 失敗 |
| CANDIDATE-U-RCDEV-023 | `skills/` に zip 由来の skill 7 本 (`vmodel-<name>.md`) と役割別ガイド 5 本 (`vmodel-role-<role>.md`) があり、全て `SKILL_MAP.md` に登録され、既存 skill と名前が衝突しない。bundle の receipt `source_files` が全件を含む (CANDIDATE-U-RCDEV-006 と同じ検査) | (m1) 1 本を SKILL_MAP から外す → 未登録で失敗。(m2) 既存 skill 名で上書きする → 衝突で失敗 |
| CANDIDATE-U-RCDEV-024 | tracked tree・Pack 出力・bundle のどこにも zip 由来の `.py` (`tools/*.py`) と `requirements.txt` が無い | (m) `tools/check.py` を `docs/templates/vmodel/` に追加 → 失敗 |
| CANDIDATE-U-RCDEV-025 | `profiles.yaml` / `catalog.yaml` / `diagrams.yaml` / `traceability.yaml` / `wbs.yaml` が別ファイルとして出荷されず、zip `profiles.yaml` の profile id 集合が `vmodel-document-scale-profiles.md` §1 の profile 行 (8 件) に含まれる | (m1) `docs/templates/vmodel/profiles.yaml` を追加 → 第 2 の SSoT として失敗。(m2) scale-profiles.md から 1 profile 行を削る → 包含で失敗 |

## PR-G0〜PR-VL consumer 検証 (rev 2、PLAN §3.6)

共通 fixture (v): fixture (ii) に PR-T1 のテンプレートから作った L1〜L7 の文書一式を `docs/design/` / `docs/test-design/` へ置き、
G2 の wireframe mock として consumer 自作の `docs/design/L2-screen/wireframe.md` 1 本 (`pair_artifact: docs/test-design/L10-ux-validation-test-design.md`) と、
その pair として PR-T1 の `L10-ux-validation.md` から作った `docs/test-design/L10-ux-validation-test-design.md` 1 本を加えたもの (PLAN §3.6-2 rev 13)。
テンプレート由来の文書の frontmatter `pair_artifact` / `plan` は consumer の path へ書き換え、`status` は `confirmed` とする (テンプレートの `draft` のままでは G1〜G6 の draft=0 条件を満たさない。gate の判定は変えない)。
(vi): (v) から必須 slot を 1 つ欠いたもの。(vii): (v) から wireframe mock だけを除いたもの。いずれも `gate-design.md` を置かない。

| ID | oracle | 違反 / mutation |
| --- | --- | --- |
| U-RCDEV-026 | fixture (v) で `loadGateConfirmDocs` が ENOENT を出さず、埋め込みの gate 定義を使う。consumer に `docs/governance/gate-design.md` を置くとそれが優先される。実装: `tests/release-consumer-gates.test.ts` | (m1) 埋め込みを外す → ENOENT で失敗。(m2) 優先順を逆にする → consumer 側の定義が使われず失敗 |
| U-RCDEV-027 | fixture (v) で G1〜G6 が `applicable:true` かつ pass、(vi) では欠いた slot 名を含む failed、(vii) では G2 が `mock=missing` を含む failed。いずれも「could not run」を含まない。実装: `tests/release-consumer-gates.test.ts` | (m1) resolver を `docs/design/harness` 固定に戻す → (v) が「could not run」または applicable false で失敗。(m2) G2 の L10 pair path を harness 固定の literal に戻す → (v) の G2 が `mock=missing` で失敗 |
| U-RCDEV-028 | fixture (v) で `coverage/coverage-summary.json` 不在の G7 が typed な「coverage evidence missing」で failed (crash しない)。80% 以上の summary を置くと coverage 構成要素が pass。実装: `tests/release-consumer-gates.test.ts` | (m1) 存在確認を外す → unreadable 分類へ変わり、typed missing reason の期待で失敗。(m2) 不在を pass 扱いにする → coverage 構成要素の failed 期待で失敗 |

G8〜G14 の oracle (029〜035) は PLAN §3.6-4 の共通述語 S / I / T / E / F / A と gate 固有述語を gate ごとに固定する。各 oracle の fixture は
(v) に当該 gate の slot 文書 (テンプレート由来) と、述語を全て満たす evidence manifest (`.ut-tdd/evidence/<dir>/ok.json`) を置いた「正常形」とし、
正常形で `applicable:true` かつ static 部分 pass、message に `未判定 (review): <approval_role>` を含むことを先に確認する。各 mutation は正常形から
1 軸だけを変え、指定の violation 文字列を含む failed になること。**「slot 文書が在れば pass」「manifest が在れば pass」だけの実装は、
(m-T) / (m-E) / (m-F) / (m-A) / gate 固有 mutation のどれかで必ず Red になる**。

| ID | oracle (正常形の gate) | 違反 / mutation (1 軸) |
| --- | --- | --- |
| U-RCDEV-034 | G13 production 実装 oracle。下記 `CANDIDATE-U-RCDEV-034` の正常形・mutation 軸を `tests/release-consumer-gates.test.ts` で実行する。 | G13 専用の S / I / T / F / A / E の独立変異で失敗すること。L12 文書を harness layout の catalog path にだけ置いた正常形も pass し、flat path のハードコードを Red にする。 |
| U-RCDEV-029 | G8 (`DOC-L8-INTEGRATION-TEST-DESIGN`、`IT-`、pair L5、`g8-integration`) | (m-S) case 表の必須列を 1 つ削る → `missing section`。(m-I) `IT-` 行 ID を重複させる → `duplicate case id`。(m-T) 1 行の L5 cite を未定義 ID に変える → `trace target missing`、cite を外す → `untraced case`。(m-E1) 1 command の `exit_code` を 1 → `exit_code is non-zero`。(m-E2) `output_digest` を `sha256:xyz` → `invalid digest`。(m-E3) `evidence_path` を repo 外 / 不在 → `evidence_path missing`。(m-E4) `schema_version` を `g9-system-evidence-v1` → `invalid schema_version`。(m-F) 設計済み `IT-` ID を 1 件 manifest から外す → `missing row evidence`。(m-A) `artifacts.integration_results` を削る → `missing artifact integration_results`。(m-R) message から review 未判定を消す実装 → message assert で失敗 **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g8-integration/ok.json` だけを 1 軸で壊す)**: (m-E-G8a) `schema_version` を `g9-system-evidence-v1` にする → `invalid schema_version`。(m-E-G8b) `gate` を `G9` にする → `gate must be G8`。(m-E-G8c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G8d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G8e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。この 5 つは G8 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) |
| U-RCDEV-030 | G9 (`DOC-L9-SYSTEM-TEST-DESIGN`、`ST-`、pair L4、`g9-system`) | (m-T) 1 行の L4 cite を L5 の ID に変える (pair 外) → `untraced case`。(m-F) deferred の `plan_id` を実在しない PLAN にする → `stale defer`。(m-A) `artifacts.system_manifest` を削る → `missing artifact`。(m-G9) `security` family の行を全て `ST` に変える → family 欠落で failed。(m-E) `exit_criteria.failed_mandatory_count = 1` → failed **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g9-system/ok.json` だけを 1 軸で壊す)**: (m-E-G9a) `schema_version` を `g8-integration-evidence-v1` にする → `invalid schema_version`。(m-E-G9b) `gate` を `G8` にする → `gate must be G9`。(m-E-G9c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G9d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G9e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。この 5 つは G9 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) 実装テスト: `tests/release-consumer-gates.test.ts` (`U-RCDEV-030`)。 |
| U-RCDEV-031 | G10 (`DOC-L10-UX-VALIDATION`、`UXV-`、pair L2、`g10-ux`)。実装: `tests/release-consumer-gates.test.ts` | (m-T) 1 行の画面 ID cite を `DOC-L2-SCREEN` に無い ID → `trace target missing`。(m-A) `artifacts.browser_visual_a11y_results` を削る → `missing artifact`。(m-G10a) 正常形の slot 文書の frontmatter を `status: skipped` + `skip_reason` 非空にする → `applicable:true` のまま failed、message に `skipped slot DOC-L10-UX-VALIDATION` と `VMC-005` を含み、n/a passed にならない (PLAN §3.6-4「G10 の skip 判定」、rev 20)。(m-G10b) (m-G10a) から `skip_reason` を空にする → 同じ理由で failed。(m-G10c) (m-G10a) のまま consumer manifest の `profile` を `cli` (scale profile で `DOC-L4-UI-STANDARD` が `skip` の profile) にする → 同じ理由で failed。3 件とも slot 文書の本文と evidence manifest は正常形のままとし、`status` 以外の軸で failed にならないことを先に確認する。production 変異: n/a 分岐を `skip_reason` 非空だけで復活させる (案 C) → (m-G10a) が Red。`status` を無視して本文の S / I / T で判定する → (m-G10a) / (m-G10b) が passed になり Red。L4 `DOC-L4-UI-STANDARD` の skip 行から L10 無効を推論する (案 A) → (m-G10c) が n/a passed になり Red **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g10-ux/ok.json` だけを 1 軸で壊す)**: (m-E-G10a) `schema_version` を `g9-system-evidence-v1` にする → `invalid schema_version`。(m-E-G10b) `gate` を `G9` にする → `gate must be G10`。(m-E-G10c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G10d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G10e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。この 5 つは G10 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) |
| U-RCDEV-032 | G11 (`DOC-L11-TRACE-UAT`、`UAT-`、pair L1/L3〜L7、`g11-uat`)。正常形は下記「CANDIDATE-U-RCDEV-032 / 033 の正常形 fixture (rev 21)」の 032 (PLAN §3.6-4「G11 / G12 の証跡 shape」) | (m-S) 第2章 検証マトリクスの表から `ケースID` 列を削る → `missing section` と `required case table columns`。(m-I) `UAT-CONSUMER-02` 行の ID を `UAT-CONSUMER-01` にする → `duplicate case id UAT-CONSUMER-01`。(m-T) `UAT-CONSUMER-01` 行の `要件` を `DOC-L7-UNIT-TEST-DESIGN` (L7。定義済みだが pair 集合に無い) だけにする → `untraced case UAT-CONSUMER-01` を含み、`trace target missing DOC-L7-UNIT-TEST-DESIGN` を含まない。(m-T2) `UAT-CONSUMER-01` 行の `要件` を `FR-99` にする → `trace target missing FR-99`。(m-F) `UAT-CONSUMER-02` を `mandatory_uat_ids` / `selected_uat_ids` / `coverage[]` / `commands[0].uat_ids` から外す → `missing row evidence UAT-CONSUMER-02`。(m-A) `artifacts.po_uat_decision` を削る → `missing artifact po_uat_decision`。(m-G11a) `requirements[]` から `NFR-17` を削る → `untraced requirement NFR-17`。(m-G11b) `requirements[]` から `FR-01` を削る → `untraced requirement FR-01`。(m-G11c) `FR-01` の `status` を `blocked` → `blocked requirement FR-01`。(m-G11d) `FR-01` の `status` を `pending` → `invalid trace status FR-01: pending`。(m-G11e) `{ "requirement_id": "FR-99", "status": "traced" }` を追加 → `trace review references undefined requirement FR-99`。(m-G11f) `FR-01` の要素を複製 → `duplicate trace requirement FR-01`。(m-G11g) trace review file の中身を `traced\n` (JSON でない) にする → `invalid artifact end_to_end_trace_review: JSON object required`。(m-G11h) L3 の `### FR-01:` 見出しと `nfr-grade.md` の NFR 表行を全て消し、`UAT-CONSUMER-01` / `-02` の `要件` を `DOC-L3-FUNCTIONAL` にする (trace review は正常形のまま) → `no requirement ids defined in DOC-L3-FUNCTIONAL`。(m-G11i) `decision` を `maybe` → `invalid po_uat_decision.decision maybe`。(m-G11j) `decision` を `reject` → `po_uat_decision.decision is reject`。(m-G11k) `decided_by_role` を `""` → `po_uat_decision.decided_by_role is required`。(m-G11l) `revision` を削る → `invalid po_uat_decision.revision`。(m-G11m) `revision` を 39 桁 hex → `invalid po_uat_decision.revision`。(m-R) message から `未判定 (review): PO/TL` を消す実装 → message assert で失敗。production 変異: T の cite 可能集合を右腕の太字 / `doc_type_id` だけにする (L3 見出し抽出 `H` を足さない) → 正常形が `untraced case UAT-CONSUMER-01` と `trace target missing FR-01` で Red。T を G8 型 (cite 全てが pair 集合) にする → (m-T) が `trace target missing DOC-L7-UNIT-TEST-DESIGN` を含み Red。`R` を右腕 T の太字 ID 集合から取る → 正常形が `trace review references undefined requirement FR-01` で Red、(m-G11b) も Red。`R` が空のとき pass する → (m-G11h) が Red。`blocked` を許す → (m-G11c) が Red。`reject` を shape だけで通す → (m-G11j) が Red。`requirements[]` の存在だけを見る → (m-G11a) / (m-G11e) が Red **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g11-uat/ok.json` だけを 1 軸で壊す)**: (m-E-G11a) `schema_version` を `g12-acceptance-evidence-v1` にする → `invalid schema_version`。(m-E-G11b) `gate` を `G12` にする → `gate must be G11`。(m-E-G11c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G11d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G11e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。(m-E-G11f) `mandatory_uat_ids` の key 名を `mandatory_it_ids` に変える (値と coverage は不変) → `missing row evidence UAT-CONSUMER-01` と `missing row evidence UAT-CONSUMER-02` (G8 の field 名を読む実装を Red にする)。この 6 つは G11 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) |
| U-RCDEV-033 | G12 (`DOC-L12-ACCEPTANCE`、`AT-`、pair L3、`g12-acceptance`)。正常形は下記「CANDIDATE-U-RCDEV-032 / 033 の正常形 fixture (rev 21)」の 033 (PLAN §3.6-4「G11 / G12 の証跡 shape」) | (m-S) 第3章 テストケース一覧の表から `トレース元` 列を削る → `missing section` と `required case table columns`。(m-I) `AT-CONSUMER-02` 行の ID を `AT-FR-01-01` にする → `duplicate case id AT-FR-01-01`。(m-T) `AT-FR-01-01` 行の `トレース元` を L3 に無い AC ID `AC-FR-99-01` にする → `trace target missing AC-FR-99-01`。(m-T2) `AT-FR-01-01` 行の `トレース元` を空にする → `untraced case AT-FR-01-01`。(m-F) `AT-CONSUMER-02` を `mandatory_at_ids` / `selected_at_ids` / `coverage[]` / `commands[0].at_ids` から外す → `missing row evidence AT-CONSUMER-02`。(m-A) `artifacts.acceptance_results` を削る → `missing artifact acceptance_results`。(m-G12a) `deploy_receipt.revision` を 39 桁 hex → `invalid deploy_receipt.revision`。(m-G12b) `deploy_receipt.revision` の 1 文字を `g` にする (40 桁のまま) → `invalid deploy_receipt.revision`。(m-G12c) `deploy_receipt.environment` を削る → `deploy_receipt.environment is required`。(m-G12d) `rollback_readiness.rollback_command` を削る → `rollback_readiness.rollback_command is required`。(m-G12e) `rollback_readiness.verified_at` を `2026-09-29` (時刻・timezone なし) → `invalid rollback_readiness.verified_at`。(m-G12f) deploy receipt file の中身を JSON でない text にする → `invalid artifact deploy_receipt: JSON object required`。(m-R) message から `未判定 (review): PO/TL` を消す実装 → message assert で失敗。production 変異: T の cite 可能集合を右腕の太字 / `doc_type_id` だけにする (L3 見出し抽出 `H` を足さない) → 正常形が `trace target missing AC-FR-01-01` で Red。artifact の実在だけを見る → (m-G12a)〜(m-G12f) が Red。revision の桁数だけを見る → (m-G12b) が Red。`required_artifacts` の全てを JSON として parse する → 正常形の `acceptance_results` (text) が `invalid artifact acceptance_results` で Red **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g12-acceptance/ok.json` だけを 1 軸で壊す)**: (m-E-G12a) `schema_version` を `g11-uat-evidence-v1` にする → `invalid schema_version`。(m-E-G12b) `gate` を `G11` にする → `gate must be G12`。(m-E-G12c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G12d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G12e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。(m-E-G12f) `mandatory_at_ids` の key 名を `mandatory_it_ids` に変える (値と coverage は不変) → `missing row evidence AT-FR-01-01` と `missing row evidence AT-CONSUMER-02`。この 6 つは G12 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) |
| CANDIDATE-U-RCDEV-034 | G13 (`DOC-L13-PRODUCTION-OBSERVATION`、`SMOKE-`、pair L12 (片方向)、`g13-post-deploy`)。正常形は下記「CANDIDATE-U-RCDEV-034 / 035 の正常形 fixture (rev 22)」の 034 (PLAN §3.6-4「G13 / G14 の証跡 shape」) | (m-S) 追補節の表から `トレース元` 列を削る → `missing section` と `required case table columns`。(m-S2) L13 テンプレート由来の `##### 5-2 ランブック(抜粋)` 見出しを削る → `missing section ##### 5-2 ランブック(抜粋)`。(m-I) `SMOKE-CONSUMER-02` を `SMOKE-CONSUMER-01` にする → `duplicate case id SMOKE-CONSUMER-01`。(m-I2) `SMOKE-CONSUMER-02` を `ST-CONSUMER-02` にする → `case id must start with SMOKE-: ST-CONSUMER-02`。(m-T) `SMOKE-CONSUMER-01` の `トレース元` を空にする → `untraced case SMOKE-CONSUMER-01`。(m-T2) `SMOKE-CONSUMER-01` の `トレース元` を `AT-FR-99-99` にする → `trace target missing AT-FR-99-99`。(m-T3) `SMOKE-CONSUMER-01` の `トレース元` を `NFR-01` (L3 の太字 ID。右腕の `allDesignIds` では定義済みだが AT 集合に無い) にする → `trace target missing NFR-01`。(m-T4、片方向の確認) L12 文書に `| **AT-FR-01-02** | 未観測 |` を足し、どの SMOKE 行も cite しない → G13 は **passed のまま** (逆向きの閉包を要求しない。G13 の評価結果だけを assert する)。(m-F) `SMOKE-CONSUMER-02` を `mandatory_smoke_ids` / `selected_smoke_ids` / `coverage[]` / `commands[0].smoke_ids` から外す → `missing row evidence SMOKE-CONSUMER-02`。(m-A) `artifacts.sli_slo_observation` を削る → `missing artifact sli_slo_observation`。(m-G13a) `window_end` を `window_start` と同値にする → `sli_slo_observation window is not closed`。(m-G13b) `window_end` を `2026-09-29T06:00:00` (timezone なし) にする → `invalid sli_slo_observation.window_end`。(m-G13c) `slos` を `[]` にする → `sli_slo_observation.slos is required`。(m-G13d) `slos[0].observed` を削る → `sli_slo_observation.slos[SLO-AVAIL].observed is required`。(m-G13e) `slos[0].target` を `""` にする → `sli_slo_observation.slos[SLO-AVAIL].target is required`。(m-G13f) `slos[0]` を複製する → `duplicate slo SLO-AVAIL`。(m-G13g) `sli-slo.json` の中身を JSON でない text にする → `invalid artifact sli_slo_observation: JSON object required`。(m-G13h) `rollback.json` の `decision` を `unknown` にする → `invalid rollback_decision.decision unknown`。(m-G13i、shape-only の確認) `decision` を `rollback` にする → **passed のまま**。(m-G13j) `decision` を `Keep` にする → `invalid rollback_decision.decision Keep`。(m-G13k、実行時刻非依存の確認) `window_start` / `window_end` を `2099-01-01T00:00:00Z` / `2099-01-01T06:00:00Z` (未来) にする → **passed のまま**。(m-R) message から `未判定 (review): PO/TL` を消す実装 → message assert で失敗。production 変異: G13 を未登録のままにする → 正常形が `no evaluator for G13` で Red。AT 集合を右腕の `pairLayerIds(L12)` から取る (常に空) → 正常形が `untraced case SMOKE-CONSUMER-01` で Red。T の定義集合を `allDesignIds` (または AT 集合 ∪ `allDesignIds`) にする → (m-T3) が passed になり Red。T に逆向きの閉包を足す → (m-T4) が Red。`rollback` を failed にする (G11 の `reject` に寄せる) → (m-G13i) が Red。窓を `window_end ≤ now` で判定する → (m-G13k) が Red。窓の比較を等号許容 (`≤`) にする → (m-G13a) が Red。timezone の無い ISO を許す → (m-G13b) が Red。`slos` の存在だけを見る → (m-G13c) が Red。閉集合の比較を大文字小文字無視にする → (m-G13j) が Red。`required_artifacts` の全てを JSON として parse する → 正常形の `production_smoke` (text) が `invalid artifact production_smoke` で Red **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g13-post-deploy/ok.json` だけを 1 軸で壊す)**: (m-E-G13a) `schema_version` を `g12-acceptance-evidence-v1` にする → `invalid schema_version`。(m-E-G13b) `gate` を `G12` にする → `gate must be G13`。(m-E-G13c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G13d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G13e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。この 5 つは G13 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) **field routing / F の検査 (E 専用ではない。key 名を変えると E だけでなく F も違反し、F の `missing row evidence` でも Red になるため、E 検査だけを no-op にした実装の検出には使わない)**: (m-E-G13f) `mandatory_smoke_ids` の key 名を `mandatory_at_ids` に変える (値と coverage は不変) → `missing row evidence SMOKE-CONSUMER-01` と `missing row evidence SMOKE-CONSUMER-02` (G12 の field 名を読む実装を Red にする)。この 1 件は G13 の field routing (読む key 名) と F の検査であり、E 専用の no-op 検出には数えない |
| U-RCDEV-035 | G14 (`DOC-L14-OPERATIONAL-TEST` (detector 内定数、catalog の L14 `test-design` 行が出典)、`OT-`、pair L1 + L0、`g14-operational`)。正常形は下記「CANDIDATE-U-RCDEV-034 / 035 の正常形 fixture (rev 22)」の 035 (PLAN §3.6-4「G13 / G14 の証跡 shape」) | (m-S) 追補節の表から `family` 列を削る → `missing section` と `required case table columns`。(m-S2) 定数の path に slot を置かず、contract の `governance_artifact` の consumer path (`docs/test-design/L14-vmodel-engine-swap-operational-test-design.md`) に同じ内容を置く → `missing slot DOC-L14-OPERATIONAL-TEST`。(m-I) `OT-CONSUMER-02` を `OT-CONSUMER-01` にする → `duplicate case id OT-CONSUMER-01`。(m-Fam1) `OT-CONSUMER-02` の `family` を `OT` にする (VALUE が 0 行) → `missing evidence family VALUE`。(m-Fam2) `OT-CONSUMER-02` の `family` を `SMOKE` にする → `invalid evidence family SMOKE for OT-CONSUMER-02`。(m-G14a) `OT-CONSUMER-02` の `トレース元` を `BR-01` だけにする → `value case OT-CONSUMER-02 does not cite L0 (file the L0 charter as docs/plans/PLAN-L0-*.md and cite its plan_id)` (誘導文まで assert)。(m-G14b) `docs/plans/PLAN-L0-01-consumer-charter.md` を削除する (cite は不変) → `trace target missing PLAN-L0-01-consumer-charter` と `value case OT-CONSUMER-02 does not cite L0`。(m-G14c) `OT-CONSUMER-02` の `トレース元` の `PLAN-L0-01-consumer-charter` を `PLAN-CONSUMER-01` (実在する L0 以外の PLAN) にする → `value case OT-CONSUMER-02 does not cite L0` と `trace target missing PLAN-CONSUMER-01`。(m-T) `OT-CONSUMER-01` の `トレース元` を空にする → `untraced case OT-CONSUMER-01`。(m-T2) `OT-CONSUMER-01` の `トレース元` を `FR-L1-99` にする → `trace target missing FR-L1-99`。(m-T3) `OT-CONSUMER-01` の `トレース元` を `NFR-01` (L3 の太字 ID。定義済みだが pair 集合に無い) だけにする → `untraced case OT-CONSUMER-01` を含み、`trace target missing NFR-01` を含まない (G9 型)。(m-F) `OT-CONSUMER-02` を `mandatory_ot_ids` / `selected_ot_ids` / `coverage[]` / `commands[0].ot_ids` から外す → `missing row evidence OT-CONSUMER-02`。(m-A) `artifacts.value_results` を削る → `missing artifact value_results`。(m-G14d) `items[0].routed_to` を削る → `improvement_feedback.items[0].routed_to is required`。(m-G14e) `items` を `[]` にし `no_improvement` を置かない → `improvement_feedback.items is required`。(m-G14e2、改善なしの正常形) `items: []` と `no_improvement: true` にする → **passed**。(m-G14e3) `items` を正常形 (2 件) のまま `no_improvement: true` を足す → `improvement_feedback declares no_improvement with items`。(m-G14e4) `items: []` と `no_improvement: "true"` (文字列) にする → `improvement_feedback.no_improvement must be boolean`。(m-G14e5) `items: []` と `no_improvement: false` にする → `improvement_feedback.items is required`。(m-G14f) `items[0].summary` を `""` にする → `improvement_feedback.items[0].summary is required`。(m-G14g) `items[0].routed_to` を `PLAN-L9-999-missing` にする → `improvement_feedback.items[0] routed_to PLAN-L9-999-missing does not exist`。(m-G14h) `items[1].routed_to` を `https://github.com/example/consumer/pull/12` にする → `improvement_feedback.items[1] routed_to https://github.com/example/consumer/pull/12 is not a PLAN or Issue URL`。(m-G14i) `items[1].routed_to` を `#12` にする → `improvement_feedback.items[1] routed_to #12 is not a PLAN or Issue URL`。(m-G14j) `feedback.json` の中身を JSON でない text にする → `invalid artifact improvement_feedback: JSON object required`。(m-R) message から `未判定 (review): PO` を消す実装 → message assert で失敗。(m-S3、定数の drift 検査) `tests/` の unit test で、G14 の detector 内定数 (doc_type_id と harness path) が `docs/governance/vmodel-document-catalog.md` の `DOC-L14-OPERATIONAL-TEST` 行 (`category=test-design`) の path と一致することを assert する。production 変異: slot を contract の `governance_artifact` から解決する (決定 1 を実装しない) → 正常形が `missing slot DOC-L14-OPERATIONAL-TEST` で Red、(m-S2) が passed になり Red。定数の path を catalog 行と違う値 (例 `docs/test-design/harness/L14-vmodel-engine-swap-operational-test-design.md`) にする → (m-S3) が Red。slot を catalog の実行時読み込みで決める (定数を持たない) → (m-S3) が定数を import できず Red (決定 1 は catalog を実行時入力にしない)。L0IDs を右腕の `pairLayerIds(L0)` から取る (常に空) → 正常形が `value case OT-CONSUMER-02 does not cite L0` で Red。L0IDs を `^PLAN-L0-` の形式だけで判定し実在を見ない → (m-G14b) が `trace target missing` を出さず Red。L0IDs に L0 以外の PLAN を含める → (m-G14c) が Red。VALUE 行の L0 条件を省く → (m-G14a) が Red。family 検査を省く → (m-Fam1) / (m-Fam2) が Red。T を G8 型 (cite が全て pair 集合) にする → (m-T3) が `trace target missing NFR-01` を含み Red。`routed_to` の非空だけを見る → (m-G14g) / (m-G14h) / (m-G14i) が Red。Issue URL の実在を GitHub API で確かめる → 正常形で `fetch` を禁止する spy が呼び出しを検出して Red (テストは network を使わない)。宣言なしの `items: []` を許す → (m-G14e) / (m-G14e5) が Red。`no_improvement` を無視して常に非空の `items` を要求する → (m-G14e2) が Red。`no_improvement` を truthy で判定する → (m-G14e4) が Red。`no_improvement: true` と非空の `items` の併存を許す → (m-G14e3) が Red **E 専用 (S / I / T / F / A は正常形のまま、`.ut-tdd/evidence/g14-operational/ok.json` だけを 1 軸で壊す)**: (m-E-G14a) `schema_version` を `g13-post-deploy-evidence-v1` にする → `invalid schema_version`。(m-E-G14b) `gate` を `G13` にする → `gate must be G14`。(m-E-G14c) `commands[0].exit_code` を 1 にする → `exit_code is non-zero`。(m-E-G14d) `commands[0].output_digest` を `sha256:` + 63 桁 hex にする → `invalid digest`。(m-E-G14e) `exit_criteria.stale_defer_count` を文字列 `"0"` にする (型違い) → `stale_defer_count must be 0`。この 5 つは G14 の E 検査だけを no-op にした実装を Red にする (他 gate の E 検査では代替されない) **field routing / F の検査 (E 専用ではない。key 名を変えると E だけでなく F も違反し、F の `missing row evidence` でも Red になるため、E 検査だけを no-op にした実装の検出には使わない)**: (m-E-G14f) `mandatory_ot_ids` の key 名を `mandatory_smoke_ids` に変える (値と coverage は不変) → `missing row evidence OT-CONSUMER-01` と `missing row evidence OT-CONSUMER-02` (G13 の field 名を読む実装を Red にする)。この 1 件は G14 の field routing (読む key 名) と F の検査であり、E 専用の no-op 検出には数えない |
| U-RCDEV-036 | fixture (v) で `vmodel lint` が文書件数 > 0 と trace 結果を返し、文書の無い fixture (ii) では typed な「未作成」を返す (ENOENT なし)。実装: `tests/vmodel-consumer-lint.test.ts` | (m) resolver を外す → (v) で 0 件または ENOENT で失敗 |
| U-RCDEV-037 | harness 自身 (source repo) の G1〜G10 の `evaluateStaticGate` 結果 (passed / applicable / message 集合) が実装の前後で一致する (回帰固定。G8〜G10 は既存 workflow lint の結果)。実装: `tests/gate-static.test.ts`。G1〜G7 は static API、G8〜G10 は既存 doctor API の raw ok/messages を比較し、G0 merge-base の実測 golden を固定する | (m1) resolver の優先順を逆にする (`docs/design/` を先に見る) → 結果が変わり失敗。(m2) harness の G8 を共通述語へ切り替え、family prefix 要件を落とす → G8 の message 集合が変わり失敗。m2 は PR-GR の所有であり、G0 では完了扱いにしない |

### CANDIDATE-U-RCDEV-032 / 033 の正常形 fixture (rev 21)

共通 fixture (v) (`tests/release-consumer-gates.test.ts` の `writeConsumerGateFixture`) に次を加える。(v) の L3 は
`docs/design/L3-functional/functional-requirements.md` に `### FR-01:` 見出しと `#### AC-FR-01-01` 見出し、`nfr-grade.md` に `| **NFR-NN** |` 表行
15 本 (NFR-01〜08、11〜17) を持つ。G3-trace と同じ抽出規則で測ると、要件 ID 集合 `R` (FR ∪ NFR) は 16 件、見出し定義 ID `H` (FR ∪ AC) は
`FR-01` / `AC-FR-01-01` の 2 件である (PLAN §3.6-4「G11 / G12 の証跡 shape」の 3 / 5)。

**032 (G11)**:

1. slot 文書 `docs/process/evidence/g11-uat-review-design.md`: `docs/templates/vmodel/L11-trace-uat.md` から作り、frontmatter の `status` を
   `confirmed`、`plan` を `docs/plans/PLAN-CONSUMER-01.md` にする。第2章 検証マトリクスの placeholder 行を次の 2 行に置き換える。

   ```
   | FR-01 | PO シナリオ検収 | UAT | ユースケース | UAT-CONSUMER-01 |
   | NFR-01 | PO シナリオ検収 | UAT | 境界値 | UAT-CONSUMER-02 |
   ```

2. `tests/fixtures/g11-consumer/uat-results.txt` と `tests/fixtures/g11-consumer/command-output.txt` (中身 `passed\n`)。
3. `.ut-tdd/evidence/g11-uat/artifacts/trace-review.json` (evidence directory 直下に置かない): `{ "requirements": [...] }` で、
   `FR-01` と `NFR-01`〜`NFR-08`、`NFR-11`〜`NFR-17` の 16 件を各 1 回、`"status": "traced"` で列挙する。
4. `.ut-tdd/evidence/g11-uat/artifacts/po-uat-decision.json`:
   `{ "decision": "accept", "decided_by_role": "PO", "revision": "0123456789abcdef0123456789abcdef01234567" }`。
5. manifest `.ut-tdd/evidence/g11-uat/ok.json`: G10 の consumer manifest と同じ構造で、`schema_version` = `g11-uat-evidence-v1`、`gate` = `G11`、
   `profile` = `consumer-uat-minimum`、`plan_id` = `PLAN-CONSUMER-01`、`selected_uat_ids` / `mandatory_uat_ids` = `["UAT-CONSUMER-01", "UAT-CONSUMER-02"]`、
   `deferred_uat_ids` = `[]`、`commands[0]` = `command_id` `cmd-consumer-uat` / `runner` `node` / `exit_code` 0 /
   `evidence_path` `tests/fixtures/g11-consumer/command-output.txt` / `output_digest` `sha256:` + 64 桁 hex / `uat_ids` 2 件、
   `coverage[]` = 2 件 (`uat_id`、`status` `passed`、`evidence_paths` `["tests/fixtures/g11-consumer/uat-results.txt"]`、`command_ids` `["cmd-consumer-uat"]`)、
   `defer` = `[]`、`exit_criteria` = `all_mandatory_passed` true / `failed_mandatory_count` 0 / `stale_defer_count` 0 / `doctor_check` `g11-uat-workflow`、
   `artifacts` = `end_to_end_trace_review` → 3 の path、`po_uat_decision` → 4 の path。

**033 (G12)**:

1. 共通 fixture (v) の `docs/test-design/L12-acceptance-test-design.md` (L12 テンプレート由来、末尾に G3 用の `| **AT-FR-01-01** | Consumer acceptance |` 行あり)
   の第3章 テストケース一覧の placeholder 行を次の 2 行に置き換える。I の dangling 検査で `AT-FR-01-01` が未定義にならないよう、case 表に同じ ID の行を置く。

   ```
   | AT-FR-01-01 | 受入 | Consumer function の受入 | 手順どおり実行する | 合格 | AC-FR-01-01 |
   | AT-CONSUMER-02 | 受入 | 非機能の受入 | 計測する | 閾値内 | NFR-01 |
   ```

2. `tests/fixtures/g12-consumer/acceptance-results.txt` と `tests/fixtures/g12-consumer/command-output.txt` (中身 `passed\n`)。
3. `.ut-tdd/evidence/g12-acceptance/artifacts/deploy-receipt.json`:
   `{ "revision": "0123456789abcdef0123456789abcdef01234567", "environment": "staging" }`。
4. `.ut-tdd/evidence/g12-acceptance/artifacts/rollback-readiness.json`:
   `{ "rollback_command": "git revert --no-edit 0123456789abcdef0123456789abcdef01234567", "verified_at": "2026-09-29T00:00:00Z" }`。
5. manifest `.ut-tdd/evidence/g12-acceptance/ok.json`: 032 の 5 と同じ構造で、`<p>` を `at` にし、`schema_version` = `g12-acceptance-evidence-v1`、
   `gate` = `G12`、`profile` = `consumer-acceptance-minimum`、case ID = `["AT-FR-01-01", "AT-CONSUMER-02"]`、`command_id` = `cmd-consumer-acceptance`、
   evidence は `tests/fixtures/g12-consumer/` の 2 file、`doctor_check` = `g12-acceptance-workflow`、`artifacts` = `deploy_receipt` → 3 の path、
   `acceptance_results` → `tests/fixtures/g12-consumer/acceptance-results.txt` (text。JSON として parse しない)、`rollback_readiness` → 4 の path。

032 / 033 とも、正常形で `applicable:true`、static 部分 pass、message に `未判定 (review): PO/TL` を含むことを先に確認する。各 mutation は正常形から
1 軸だけを変える (032 の (m-G11h) は L3 の ID を消すと cite 先も消えるため、T を中立に保つ `要件` の差し替えを同じ軸に含める)。

### CANDIDATE-U-RCDEV-034 / 035 の正常形 fixture (rev 22)

共通 fixture (v) に次を加える。(v) の L12 `docs/test-design/L12-acceptance-test-design.md` は G3 用の `| **AT-FR-01-01** | Consumer acceptance |` 行を持ち、
`extractAtIds` で測った AT 集合は `AT-FR-01-01` の 1 件である。(v) の L1 は `**FR-L1-01**` / `**BR-01**` / `**PM-01**` を、L3 の `nfr-grade.md` は
`| **NFR-NN** |` 表行を持つ (右腕の `allDesignIds` に入る)。テンプレート由来の文書は、PR-G13 / PR-G14 が L13 / L14 テンプレートに足す
`### harness 追補:` 節 (PLAN §3.6-4「G13 / G14 の証跡 shape」の 2) を含む版から作る。

**034 (G13)**:

1. slot 文書 `docs/process/evidence/g13-post-deploy-verification-design.md`: `docs/templates/vmodel/L13-production-observation.md` から作り、frontmatter の
   `status` を `confirmed`、`plan` を `docs/plans/PLAN-CONSUMER-01.md` にする。`### harness 追補: G13 検証ケース` の表の placeholder 行を次の 2 行に置き換える。

   ```
   | SMOKE-CONSUMER-01 | status / doctor の実行 | exit 0 | AT-FR-01-01 |
   | SMOKE-CONSUMER-02 | projection の rebuild | 失敗 0 | AT-FR-01-01 |
   ```

2. `tests/fixtures/g13-consumer/smoke-results.txt` と `tests/fixtures/g13-consumer/command-output.txt` (中身 `passed\n`)。
3. `.ut-tdd/evidence/g13-post-deploy/artifacts/sli-slo.json` (evidence directory 直下に置かない):
   `{ "window_start": "2026-09-29T00:00:00Z", "window_end": "2026-09-29T06:00:00Z", "slos": [ { "slo_id": "SLO-AVAIL", "target": "99.9%", "observed": 99.95 } ] }`。
4. `.ut-tdd/evidence/g13-post-deploy/artifacts/rollback.json`: `{ "decision": "keep" }`。
5. manifest `.ut-tdd/evidence/g13-post-deploy/ok.json`: rev 21 の 032 の 5 と同じ構造で、`<p>` を `smoke` にし、`schema_version` = `g13-post-deploy-evidence-v1`、
   `gate` = `G13`、`profile` = `consumer-post-deploy-minimum`、`plan_id` = `PLAN-CONSUMER-01`、case ID = `["SMOKE-CONSUMER-01", "SMOKE-CONSUMER-02"]`、
   `command_id` = `cmd-consumer-smoke`、evidence は `tests/fixtures/g13-consumer/` の 2 file、`doctor_check` = `g13-post-deploy-workflow`、
   `artifacts` = `production_smoke` → `tests/fixtures/g13-consumer/smoke-results.txt` (text。JSON として parse しない)、`sli_slo_observation` → 3 の path、
   `rollback_decision` → 4 の path。

**035 (G14)**:

1. `docs/plans/PLAN-L0-01-consumer-charter.md` と `docs/plans/PLAN-CONSUMER-01.md` (最小 frontmatter の PLAN。plan lint は本 case の対象外)。
2. slot 文書 `docs/test-design/L14-operational-test-design.md` (G14 の detector 内定数の harness path を resolver に通した consumer path。定数の出典は catalog の `DOC-L14-OPERATIONAL-TEST` 行):
   `docs/templates/vmodel/L14-operational-test-design.md` から作り、frontmatter を 034 の 1 と同じく置き換える。`### harness 追補: G14 検証ケース` の表の
   placeholder 行を次の 2 行に置き換える。

   ```
   | OT-CONSUMER-01 | OT | 日常運用の手順 | 失敗 0 | FR-L1-01 |
   | OT-CONSUMER-02 | VALUE | 導入価値の検証 | KPI 達成 | BR-01 / PLAN-L0-01-consumer-charter |
   ```

   contract の `governance_artifact` に当たる `docs/test-design/L14-vmodel-engine-swap-operational-test-design.md` は置かない (決定 1 の確認。(m-S2) だけが置く)。
3. `tests/fixtures/g14-consumer/operational-results.txt`、`tests/fixtures/g14-consumer/value-results.txt`、`tests/fixtures/g14-consumer/command-output.txt` (中身 `passed\n`)。
4. `.ut-tdd/evidence/g14-operational/artifacts/feedback.json`:
   `{ "items": [ { "summary": "onboarding 手順の短縮", "routed_to": "PLAN-CONSUMER-01" }, { "summary": "doctor 出力の整理", "routed_to": "https://github.com/example/consumer/issues/12" } ] }`。
   L0 の PLAN へ route しない (035 の (m-G14b) を L0 の軸だけに保つため)。
5. manifest `.ut-tdd/evidence/g14-operational/ok.json`: 034 の 5 と同じ構造で、`<p>` を `ot` にし、`schema_version` = `g14-operational-evidence-v1`、`gate` = `G14`、
   `profile` = `consumer-operational-minimum`、case ID = `["OT-CONSUMER-01", "OT-CONSUMER-02"]`、`command_id` = `cmd-consumer-operational`、
   evidence は `tests/fixtures/g14-consumer/` の file、`doctor_check` = `g14-operational-workflow`、`artifacts` = `operational_results` / `value_results` →
   3 の text file、`improvement_feedback` → 4 の path。

034 / 035 とも、正常形で `applicable:true`、static 部分 pass、message に `right-arm-static - OK (G13, cases=2, manifests=1)` /
`right-arm-static - OK (G14, cases=2, manifests=1)` と、`未判定 (review): PO/TL` / `未判定 (review): PO` を含むことを先に確認する。各 mutation は正常形から
1 軸だけを変える。035 の正常形と全 mutation は network を使わずに実行し、`fetch` を禁止する spy を置く。

## E2E (観測は PLAN-L7-531 が所有)

PLAN-L7-531 の入力契約改訂で、fixture (i)〜(iv) に対し setup → Claude Edit / Codex apply_patch guard (正常系通過・禁止系 block) →
session start → plan lint → skill suggest を観測項目として追加する。rev 2 で次を加える (PLAN §3.7): clean consumer fixture でエージェントが
テンプレートから文書を書き、該当 gate が `applicable:true` で pass (欠落時は slot 名付き fail) し、同じ文書が非著者 review を通って receipt が
exact revision に束縛される。ここでは ID を振らない (531 が採番する)。
