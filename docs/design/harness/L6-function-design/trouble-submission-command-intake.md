---
artifact_type: design_doc
layer: L6
status: draft
sub_doc: function-spec
plan: docs/plans/PLAN-L6-107-consumer-report-command-and-intake.md
pair_artifact: docs/test-design/harness/L7-consumer-report-command-test-design.md
---

# `ut-tdd report` コマンドと受付先 issue フォームの契約 (Issue #815 slice S2 + S3)

状態: 未実装の目標契約。`ut-tdd report` コマンドは存在せず (`grep -n '.command("report' src/cli.ts` が 0 件)、`.github/ISSUE_TEMPLATE/consumer-report.yml` も `consumer-report` ラベルも無い (2026-10-14 時点)。実装は v0.2.0-canary.3 の公開と受入 (#676 / #418)、および S1 の実装 PR (`trouble-submission-write-security.md` PR-1〜PR-3) の後に着手する。

Pack 利用者がハーネス自身のトラブルを報告する経路のうち、受付先 (S2) と、報告の束を作る `ut-tdd report` コマンド・受付先の issue フォーム (S3) を定める。書き込みセキュリティは S1 (`trouble-submission-write-security.md`) の `buildReport` に委ね、本契約は S1 をちょうど 1 回呼ぶ側の契約だけを持つ。

## 1. 現行実装の baseline (origin/main 6b5effbc、2026-10-05 実測)

| 事実 | 根拠 |
|---|---|
| issue form が 5 本 (incident / nfr-failure / recovery / redesign / reverse) と `config.yml` があり、`blank_issues_enabled: false` は 2026-07-17 から既に有効 (PLAN-L7-451 W5) | `git log -- .github/ISSUE_TEMPLATE/config.yml` (6b3eee7ba) |
| `blank_issues_enabled: false` は既存テストが固定している。form 別の必須項目検査は列挙した 5 form だけが対象で新しい form には及ばない | `tests/github-repository-policy.test.ts` U-L7-451-W5-001 (`perFormRequired`) |
| blank issue 禁止後も開発側は issue を起票し続けている (2026-07-17 以降 276 件)。Issue #815 自体もラベル 0 件で form を経由していない (`gh issue create` / API 経由) | `gh issue list --search "created:>2026-07-17"`、`gh issue view 815 --json labels` |
| ラベル `consumer-report` は未作成。既存 form が付ける `ut-tdd` / `drive:*` もラベル一覧に無い | `gh label list --limit 100` |
| ハーネスの版は `readHarnessVersion` が package.json から読む (失敗時 `0.0.0`) | `src/setup/update-check.ts:368` |
| consumer の release identity は `consumer-runtime.json` (schema `ut-tdd.consumer-runtime.v1`) の `release.tag` / `release.source_revision` | `src/setup/consumer-runtime-release.ts:22-29` |
| `DoctorResult.messages` は自由文で path や PLAN ID を含みうる。機械的に安全なのは `ok` と check ID (`timings[].id` / `timings[].ok`) だけ | `src/doctor/result.ts:3-13` |
| doctor の scope は `full` / `toolchain` の 2 つ | `src/doctor/profiles.ts:1` |
| setup が consumer に置く `.github/ISSUE_TEMPLATE/recovery.md` / `add-feature.md` は consumer 自身の repo 向けでハーネスへの報告経路ではない (本契約は変更しない) | `src/setup/templates.ts:753-761` |

## 2. PO 判断 (2026-10-05、Issue #815 コメント) と、それが置き換える記述

### 2.1 受付先 = 本 source repo の issue

受付先は `unison-ai-product/UT-TDD_AGENT-HARNESS` の issue とする。新しい private repo と Pack repo は採らない。前提は「報告はハーネス自身の問題に限る」ことで、PUBLIC repo であるリスクは 3 層で手当てする。(1) 束をハーネス自身の情報に限る (3)。(2) issue フォームで項目を固定し白紙 issue を塞ぐ (5)。(3) S1 の書き込み検査を最後の防波堤にする。

### 2.2 置き換える記述

次の記述は PO 判断で上書きされる (どれも main へ merge 済みの confirmed PLAN ではないので `supersedes` は宣言しない)。

- Issue #815 本文の受入条件 3 の後半「公開 repo への直接の書き込み経路がない」と、進め方 2 の「公開 repo には直接書かせず private な受付先を使う」は撤回し、2.1 の 3 層の手当てに置き換える。
- `PLAN-L6-106` (draft) の §8「S2: 受付先の決定 (private な受付先の選択)」と §9「S2 の受付先」の文言は、`trouble-submission-write-security.md` §7 で本契約へ参照する形に訂正済み。

### 2.3 受容した限界

フォームの自由記述欄と、API / `gh issue create` 経由の起票は機械では縛れない。残るリスクは 6 の監視と削除の運用で扱う。機械で保証するのは「`ut-tdd report` を使った正規経路で、ハーネス外の情報が束に入らない」ことだけである。

## 3. 束の内容 (allowlist)

束に入れてよいのは次の項目だけ。どれもハーネス自身が持つ値か、ハーネスの実行に関する値である。

| key | 値の出どころ | 値の制約 (満たさなければ `unknown` へ置換) |
|---|---|---|
| `harness_version` | `readHarnessVersion(defaultHarnessRoot())` | semver 形 `^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$` |
| `release_tag` | consumer-runtime.json の `release.tag` | `^[A-Za-z0-9][A-Za-z0-9._-]*$` (既存の tag 検査と同じ) |
| `release_source_revision` | 同 `release.source_revision` | `^[0-9a-f]{40}$` |
| `os` | `process.platform` + `-` + `process.arch` | Node が返す識別子のまま |
| `os_release` | `os.release()` | `^[0-9A-Za-z._-]{1,64}$` |
| `node` | `process.version` | `^v\d+\.\d+\.\d+$` |
| `command` | 利用者が `--command` で渡した、失敗した ut-tdd コマンド行 | 先頭が `ut-tdd ` で 1 行、512 byte 以下。満たさなければ `unknown` ではなく入力エラー (束を作らない、4.3) |
| `exit_code` | `--exit-code` | `^-?\d{1,5}$`。省略時 `unknown` |
| `error_code` | `--error-code` (型付きエラーコード) | 3.1 の定型表の `code` 列と `none` からなる閉じた列挙。省略時 `none`。列挙外は形だけ正しい業務文字列 (例: `acme-internal-billing`) を含めて入力エラー |
| `doctor_scope` | 固定値 `toolchain` | — |
| `doctor_ok` | `ut-tdd doctor --scope toolchain` 相当の in-process 実行の `ok` | `true` / `false` / `unavailable` (singleton 取得失敗・例外) |
| `doctor_failed_checks` | 同 `timings` のうち `ok: false` の `id` を ASCII 昇順で `,` 連結 | 各 id が `^[a-z0-9][a-z0-9._-]{0,63}$`。合わない id は `<invalid-id>` に置換。0 件なら `none` |
| `error_detail` | `error_code` に対応する 3.1 の定型文 (固定の 1 行) | `error_code` が `none` なら `(none)`。差込み位置を持たず CLI から値を受け取らない (`--error-param` は持たない) |
| env 節 | S1 `filterEnv` の出力 (allowlist は S1 実装 PR で確定) | S1 の契約のまま |

明示的に入れないもの: project のファイル内容、PLAN 本文・PLAN ID の一覧、doctor の `messages`、`DoctorResultEnvelope` の `producer_root` / `ref_map` / `head_sha`、S1 allowlist 外の env の値、git remote URL (S1 が `<REMOTE>` へ伏せる)、ホスト名・ユーザー名、時刻・乱数。

採択は閉じた allowlist (自由文は `command` の 1 欄だけ。エラーメッセージは定型表から再構成した `error_detail` で表す。advisor 第三案)。却下: エラーメッセージ本文を自由文で受け S1 の最終検査で伏せる (S1 の伏せ字は pattern ベースで path / project 名に一致しない社内情報は素通りする。最終検査は最後の網であって一次防壁ではない)、`error_code` だけで本文を持たない (列挙できない失敗の再現力を失う)、doctor `messages` 全文 (自由文に path・PLAN ID が混ざる)、実行ログ添付 (project の作業内容そのもの)。

doctor を `full` でなく `toolchain` にする理由: `full` は consumer の PLAN・docs を検査対象にし check ID の集合自体が project の構成を映す。doctor は singleton で、二重起動 (exit 2 相当) を検出したら待たず再試行もせず `doctor_ok: unavailable` とする (`CLAUDE.md` §Shared Guard Discipline)。

### 3.1 エラー定型表

`error_detail` を作る定型表は `src/report/` に閉じた表として置く。各行は `code` と定型文 (固定の 1 行、差込み位置なし) だけを持ち、CLI から定型文へ値を差し込む経路は設けない。任意の ASCII 文字列を受ける id 型の差込みは、PLAN ID・ホスト名・利用者名を形の検査だけでは締め出せないため許さない (`^[A-Za-z0-9._-]{1,64}$` に業務文字列が通るという review の反証)。差込みが必要になったら、値をハーネス由来の閉じた列挙に限る形で契約改訂を先に行う。

初期の行は consumer の install / verify で利用者が実際に目にする型付きエラーの 10 個 (各 code は main の `src/` に文字列として存在する。PR-1 の oracle は `src/` に存在しない code が表に入ったら Red にする)。

| code | 定型文 |
|---|---|
| `consumer_runtime_absent` | consumer runtime の記録が見つかりません。 |
| `consumer_runtime_schema_invalid` | consumer runtime の記録が schema に合いません。 |
| `consumer_runtime_identity_mismatch` | consumer runtime の識別情報が配布物と一致しません。 |
| `consumer_runtime_digest_mismatch` | consumer runtime の digest が記録と一致しません。 |
| `consumer_runtime_anchor_mismatch` | consumer runtime の anchor が記録と一致しません。 |
| `consumer_runtime_external_path` | consumer runtime がプロジェクト外の path を指しています。 |
| `consumer_runtime_resolution_denied` | consumer runtime の解決が拒否されました。 |
| `consumer_runtime_indeterminate` | consumer runtime の状態を判定できません。 |
| `consumer_runtime_permission` | consumer runtime の読み書き権限が不足しています。 |
| `consumer_runtime_install_failed` | consumer runtime の install に失敗しました。 |

表に無い失敗は `error_code` を `none`、`error_detail` を `(none)` として送り、開発側が triage で再現する。行の追加・変更は、code が `src/` に存在することと定型文が固定の 1 行であることだけを条件とする。PO の報告項目「エラーメッセージ」は、本契約では「定型表から再構成したエラーの説明」と解釈する (生の本文は載せない。この解釈変更は PO 判断として記録する)。

## 4. layout と CLI 契約

### 4.1 layout (S1 の `assemble` の最終形)

`buildReport` の入力 `text` は次の固定順・固定 key の行で、改行は `\n` (LF)。`error_detail` は 1 行で改行を含まない。

```
ut-tdd-report: v1
harness_version: <値>
release_tag: <値>
release_source_revision: <値>
os: <値>
os_release: <値>
node: <値>
command: <値>
exit_code: <値>
error_code: <値>
doctor_scope: toolchain
doctor_ok: <値>
doctor_failed_checks: <値>
error_detail: <値、無ければ (none)>
```

末尾は `error_detail` の行の後に改行 1 つ (ちょうど 1 つ)。S1 `assemble` はこの `text` の stage 2 出力に、env が空でなければ `env:` 行を挟まず改行 1 つと `KEY=VALUE` 行を続ける (S1 の暫定 layout をそのまま最終形として採るので S1 の golden は改訂不要)。`renderReportText` は純関数で、同じ facts から同じ bytes を返す (時刻・乱数を含めない。S1 の再生成禁止と整合)。

### 4.2 関数仕様

置き場所は `src/report/` (S1 と同じ module 群)。CLI 登録は `src/cli.ts` に `report` command を 1 つ足すだけ。

| 関数 | 入力 → 出力 | 副作用 | 不変条件 |
|---|---|---|---|
| `collectReportFacts(opts, deps)` | CLI option + 注入した読取り関数 (version / consumer-runtime / os / doctor) → `ReportFacts` か入力エラー | deps 経由の読み取りだけ。書き込み・network なし | 3 の key 以外を持たない。制約に合わない値は `unknown` / `<invalid-id>`、`command` / `error_code` / `error_detail` の違反は入力エラー |
| `renderReportText(facts)` | `ReportFacts` → string | なし | 4.1 の layout と byte 同一。純関数 |
| `runReportCommand(opts, deps)` | option + deps (上記 + `buildReport` + io) → exit code | `buildReport` に渡す io の 2 sink と、4.3 の固定文言だけ | `buildReport` をちょうど 1 回呼ぶ (入力エラー時は 0 回)。network を呼ぶ deps を持たない |

### 4.3 出力経路と入力エラー

- io の配線: `previewSink` = stdout (TTY のときだけ)、`readLine` = stdin、`releaseSink` = cwd 配下 `.ut-tdd/reports/report-<sha256 先頭 12 桁>.txt` (同じ directory の staging から rename で commit)。ファイル名は確定 bytes の digest から決め、時刻を使わない。
- 確認成立 (`ok: true` かつ `release: complete`) のときだけ、`buildReport` が戻った後に stdout へ 2 行を出す。`report: saved <報告ファイルの cwd 相対 path>` と `report: open https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/new?template=consumer-report.yml`。URL は定数で束の内容を query に載せない (prefill しない)。利用者は保存した束をフォームの束欄へ貼る。
- **プレビュー前に止まった失敗** (入力エラー、S1 の位相 F1、非対話): `buildReport` が戻った後に stderr へ `report: blocked <code>` を 1 行だけ出す。`<code>` は閉じた列挙 `input_invalid` / `violation:credential` / `violation:pii` / `violation:internal_endpoint` / `violation:path_residue` / `violation:known_value` / `check_failed` / `non_interactive`。複数種別で違反した場合はこの列挙順で最初の 1 つだけ。件数・位置・検出値・周辺文字列は出さない。これは S1 が S3 へ委ねた「違反の診断を利用者へ表示する要否」の決定で、F1 ではプレビューを含め外部出力が 0 なのでこの 1 行が利用者の見る唯一の出力になる。非対話はプレビューも出さない。
- **プレビューを書き始めた後の結果** (確認不成立、S1 の位相 F2): stdout / stderr / file のどれにも bytes を追加しない。S1 の F2 は「どの channel にも検査済み全文の部分列以外を書かない」と定めており、S3 の固定文言も例外にしない。利用者への通知は exit code だけで行う。
- exit code: 確認成立で 0、プレビュー前に止まった失敗で 1、確認不成立で 2、F2 (sink の例外。`release` / `staging` が何であっても) で 3。`--help` は exit code の意味を固定文言で載せる。
- `--yes` / `--force` / env による確認の迂回は持たない。
- **入力エラー**: `--command` が無い・`ut-tdd ` で始まらない・複数行・512 byte 超、`--error-code` が定型表の code でも `none` でもない、定義外 option (旧案の `--message` / `--error-param` を含む) は、`buildReport` を呼ばず `report: blocked input_invalid` で終える (束を作らない)。`ut-tdd ` 以外のコマンドを拒否するのは「ハーネスの問題だけ」を CLI 面で縛るため。

採択は「束をファイルに保存しフォーム URL を表示、network 送信はしない」。却下: `gh issue create` で起票まで自動化 (起票がフォームを経由せず項目固定と label 付与が効かない。gh の認証状態と network 失敗を S1 の F2 位相へ持ち込む。需要が出たら security-audit 付きの別契約で判断)、URL query に束を prefill (ブラウザ履歴・proxy log に残る)、失敗時に marker と件数を表示 (出力の表面積だけを増やす)、何も出さず exit code だけ (プレビュー前では手で貼る迂回を誘発する。プレビュー後は S1 の制約で exit code だけ)、位置・検出種別の詳細を手元の log file へ出す (S1 の F1 は file を含む全 channel 0。採るなら S1 の改訂が先)。

## 5. 受付先 issue フォーム

### 5.1 `.github/ISSUE_TEMPLATE/consumer-report.yml`

| 項目 | type / id | required | 内容 |
|---|---|---|---|
| 注意書き | markdown | — | 「ハーネス (ut-tdd) 自身の問題だけを報告してください。利用者のプロジェクトのファイル内容・業務情報・顧客名・社内 URL・secret は書かないでください。このリポジトリは公開されています。束は `ut-tdd report` で作ったものをそのまま貼ってください」 |
| ハーネスの版 | dropdown / `harness_version` | true | 公開した版の一覧 + `その他 (束に記載)`。package.json の現在版を必ず含む (oracle で固定) |
| OS | dropdown / `os` | true | `Windows` / `macOS` / `Linux` / `その他` |
| コマンドの種類 | dropdown / `command_category` | true | `setup` / `status` / `doctor` / `plan` / `review` / `pr merge` / `codex・claude 委譲` / `distribution` / `report` / `その他` |
| 再現手順 | textarea / `steps` | true | — |
| 実際の動作 | textarea / `actual` | true | — |
| 期待した動作 | textarea / `expected` | true | — |
| 診断の束 | textarea / `bundle` (`render: text`) | true | `ut-tdd report` の保存ファイルの全文 |

`labels: ["consumer-report"]`、`title: "Consumer report: "`。既存 5 form の hierarchy 項目 (`hierarchy_role` / `parent_issue` / `closure_condition`) は持たせない (利用者は親 Issue を知り得ない。親子の設定は 6 の triage で開発側が行い、`docs/governance/github-issue-hierarchy.md` §3 は外部受付 form には triage 時に適用する)。既存 W5-001 は列挙した 5 form だけを検査するので衝突しない。

### 5.2 `config.yml` とラベル

`blank_issues_enabled: false` は既に有効で変更しない。開発側は API / `gh issue create` で起票しており白紙 issue 禁止の影響を受けていない。`consumer-report` ラベルは未作成のため、フォームを入れる PR で開発側がラベルを作成し作成を PR コメントに記録する (form の `labels:` は存在しないラベルを付けない可能性がある、未検証前提)。

## 6. 運用 (S4 の残り)

- 監視: Claude control lane の EOD close-out が `gh issue list --label consumer-report --state open` を確認する (`CLAUDE.md` §定期棚卸しの既存コマンドに 1 行足す扱いで新規機構は作らない)。
- 問題のある投稿 (業務情報・secret の混入): 確認した時点で開発側が issue を削除する (編集履歴に残るため編集で消さない)。secret の場合は該当 credential の失効を報告者へ依頼する。
- 起票後に triage で親 Issue を設定するか top-level とする (`github-issue-hierarchy.md` §3)。機械化 (新着通知・自動判定) は範囲外。

## 7. 実装の順序と責務どうしの依存

実装着手は canary.3 の公開と受入の後。S3 の CLI は S1 の `buildReport` (入力型と検査) に依存し、フォームは S1・CLI と独立。

| PR | 内容 | 前提 |
|---|---|---|
| PR-1 | `collectReportFacts` / `renderReportText` (純関数 + golden、除外データ不在) | S1 PR-2 (`buildReport` の入力型) |
| PR-2 | `runReportCommand` と `src/cli.ts` の `report` 登録 (buildReport 1 回、network 0、出力経路、exit code) | PR-1、S1 PR-3 |
| PR-3 | `consumer-report.yml` + form oracle + ラベル作成の記録 | 本契約の freeze (PR-1/2 と独立、並行可) |
| PR-4 | security-audit 非著者 review の記録と confirm | PR-1〜PR-3 |

## 8. 受入条件 (反証可能、oracle は `L7-consumer-report-command-test-design.md` の CANDIDATE)

1. 束は 4.1 の layout と byte 同一 (golden)。3 の key 以外の行が無い。
2. 除外データ (project ファイル内容、PLAN 本文・ID、doctor messages、envelope の producer_root / ref_map、allowlist 外 env 値、remote URL) を fixture に仕込んでも束に現れない。
3. `runReportCommand` は 1 run で `buildReport` をちょうど 1 回呼び、入力エラー時は 0 回。
4. `ut-tdd report` の実行中に network 呼出し (http / https / net / dns / child_process による gh 起動) が 0。
5. 出力は 4.3 の位相どおり。プレビュー前に止まった失敗では stderr が `report: blocked <閉じた列挙>` の 1 行だけで検査の種別までを示し、件数・位置・検出値が出ず exit code は 1。プレビュー後の結果では固定文言を 1 byte も出さず、どの channel にも検査済み全文の部分列以外が現れない (exit code は確認不成立で 2、F2 で 3)。確認成立時だけ保存 path と定数 URL が出て exit code 0。`error_code` に定型表外の値を渡すと入力エラー。
6. `consumer-report.yml` が YAML として解析でき、5.1 から組み立てた期待構造 (title・labels・body 全要素の順序・type・id・required・dropdown の options 全件・render・注意書き) と一致し、許可外の要素を持たない。`harness_version` の options は package.json の現在版を含む。`config.yml` の `blank_issues_enabled` は false のまま。
7. 非対話・確認不成立・`--yes` 等の迂回 option が S1 の契約どおりに効かない (S1 の oracle 011 を CLI 経由で再確認)。

## 9. 範囲外

`gh issue create` / API による自動起票、Pack repo の issue 運用 (受付先にしない)、consumer 向け `src/setup/templates.ts` の issue template、監視・削除の機械化。
