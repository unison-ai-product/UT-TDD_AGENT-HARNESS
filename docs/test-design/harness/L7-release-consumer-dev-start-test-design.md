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

## E2E (観測は PLAN-L7-531 が所有)

PLAN-L7-531 の入力契約改訂で、fixture (i)〜(iv) に対し setup → Claude Edit / Codex apply_patch guard (正常系通過・禁止系 block) →
session start → plan lint → skill suggest を観測項目として追加する。ここでは ID を振らない (531 が採番する)。
