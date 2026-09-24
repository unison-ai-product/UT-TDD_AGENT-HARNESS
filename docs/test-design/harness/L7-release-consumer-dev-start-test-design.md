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
| CANDIDATE-U-RCDEV-001 | fixture (i) で `setup --solo` が中断せず adapter / テンプレート / state 記録を出力し (`written` に identity path を含まない)、出力に L7-529 の typed identity deny code と復旧手順 (`git remote add origin` → setup 再実行) を含み、終了コードが成功 (0) と区別される | (m1) deny 表示を削る → 文字列 assert 失敗。(m2) 終了コードを成功に戻す → exit assert 失敗。(m3) identity deny で throw / 中断させる (L7-529 §3.2.1 違反) → adapter 不在で失敗 |
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
| CANDIDATE-U-RCDEV-014 | 書き出しコマンドが出力するファイル bytes が埋め込み (= `AUTHORING_TEMPLATE_INVENTORY` の対象 source の HEAD blob) と一致し、書いた path を表示する | (m) 埋め込み対象を 1 family 外す → 欠落で失敗 |
| CANDIDATE-U-RCDEV-015 | consumer に同名ファイルが既にある場合は上書きせず (bytes 不変)、skip を表示する | (m) 上書きする → bytes 変化で失敗 |

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
| CANDIDATE-U-RCDEV-029 | fixture (v) + 各 slot の文書 / evidence で G8〜G14 の全てが `applicable:true` の static 判定を返し、「no deterministic check registered」を含まない。各 gate について対応 slot を欠くと slot 名付きで failed。G10 は profile 無効かつ skip 理由ありで n/a passed、理由なしで failed。review tier に残す部分は message に「未判定 (review)」と明示される | (m1) 1 gate の登録を外す → 未登録 message で失敗。(m2) 1 gate を `REVIEW_ONLY_STATIC_GATES` へ入れる → applicable false で失敗。(m3) G10 の skip 理由検査を外す → 理由なし fixture で失敗 |
| CANDIDATE-U-RCDEV-030 | fixture (v) で `vmodel lint` が文書件数 > 0 と trace 結果を返し、文書の無い fixture (ii) では typed な「未作成」を返す (ENOENT なし) | (m) resolver を外す → (v) で 0 件または ENOENT で失敗 |
| CANDIDATE-U-RCDEV-031 | harness 自身 (source repo) の G1〜G7 の `evaluateStaticGate` 結果 (passed / applicable / message 集合) が rev 2 実装の前後で一致する (回帰固定) | (m) resolver の優先順を逆にする (`docs/design/` を先に見る) → harness の結果が変わり失敗 |

## E2E (観測は PLAN-L7-531 が所有)

PLAN-L7-531 の入力契約改訂で、fixture (i)〜(iv) に対し setup → Claude Edit / Codex apply_patch guard (正常系通過・禁止系 block) →
session start → plan lint → skill suggest を観測項目として追加する。rev 2 で次を加える (PLAN §3.7): clean consumer fixture でエージェントが
テンプレートから文書を書き、該当 gate が `applicable:true` で pass (欠落時は slot 名付き fail) し、同じ文書が非著者 review を通って receipt が
exact revision に束縛される。ここでは ID を振らない (531 が採番する)。
