---
plan_id: PLAN-L6-107-consumer-report-command-and-intake
title: "PLAN-L6-107 (add-design): `ut-tdd report` コマンドと受付先 issue フォームの契約 (#815
  S2 + S3)"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-05
updated: 2026-10-05
owner: Claude control lane (起草 Claude Opus) / Codex (実装 PR) / 非著者 frontier
  reviewer (Codex Sol) / security-audit (非著者 必須)
parent_design: docs/design/harness/L6-function-design/secret.md
pair_artifact: docs/test-design/harness/L7-consumer-report-command-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: 本 PLAN は Forward の L6 契約 freeze (docs のみ)
  であり、production source を変更しない。 S1 (PLAN-L6-106) の書き込み gate を呼ぶ CLI と、既存の issue
  form 運用 (PLAN-L7-451) への 1 form 追加を定めるだけで、 L0-L3 要件の意味は変えない。Reverse 対の義務は実装側の
  add-impl PLAN が負う (add-impl は Reverse 対必須)。
agent_slots:
  - role: tl
    slot_label: TL - 束の allowlist と layout、CLI の出力経路、受付先 form の境界を freeze する
  - role: se
    slot_label: SE - `collectReportFacts` / `renderReportText` / `runReportCommand`
      の入出力と不変条件を定義する
  - role: qa
    slot_label: QA - golden・除外データ不在・buildReport 1 回・network 0・form 構造の oracle と RED 条件を定義する
generates:
  - artifact_path: docs/plans/PLAN-L6-107-consumer-report-command-and-intake.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/secret.md
  requires:
    - docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
    - docs/plans/PLAN-L7-451-github-ops-phase1-visibility-and-policy.md
  blocks: []
  references:
    - docs/plans/PLAN-L6-106-report-write-security-contract.md
    - docs/test-design/harness/L7-report-write-security-test-design.md
    - docs/test-design/harness/L7-consumer-report-command-test-design.md
    - docs/governance/github-issue-hierarchy.md
    - .github/ISSUE_TEMPLATE/config.yml
    - tests/github-repository-policy.test.ts
    - src/setup/update-check.ts
    - src/setup/consumer-runtime-release.ts
    - src/doctor/result.ts
    - src/setup/templates.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/815
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 815
admission_receipt:
  schema_version: v2
  receipt_id: certificate:ff8ec90a74ab5c281d4806a91966f1d5
  command_id: plan-draft:issue-815:consumer-report-command-and-intake:1
  admitted_at: 2026-10-05T03:07:29.771Z
  source_digest: sha256:825929ad6b36a6b5e6bf9b7c1020ba1f296381d792fbca6a068107f3ce9b869c
  decision_digest: sha256:0cc07de1792cf023482e34ccf12b0aca4256f1f80d78e1af9a206a761ce49d97
  receipt_digest: sha256:02f0bcc47f8d1f2f8b286f0fc923bd605ec3cacab13956c40a6f577a9731e531
  binding:
    path: docs/plans/PLAN-L6-107-consumer-report-command-and-intake.md
    plan_id: PLAN-L6-107-consumer-report-command-and-intake
    asset_id: plan:ff8ec90a74ab5c281d4806a91966f1d5
    revision: 1
    content_digest: sha256:825929ad6b36a6b5e6bf9b7c1020ba1f296381d792fbca6a068107f3ce9b869c
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 815
    episode_id: E4-815-consumer-report-command
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-62-design-doc-secret-scan-gate
    revision: 1
    digest: sha256:610d332e78fa0b1893fd1299881eeef3237bd8801f5ba9364f5d70aec59c2c41
  reentry:
    target_plan_id: PLAN-L6-107-consumer-report-command-and-intake
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue 815 S2/S3: PO 判断 (2026-10-05) で受付先を本 source repo の issue
    に確定したため、S1 (PLAN-L6-106) の buildReport を 1 回呼ぶ `ut-tdd report` の束
    allowlist・layout・出力経路と、consumer-report issue form の契約を freeze する。network
    送信はしない"
---

# PLAN-L6-107 (add-design): `ut-tdd report` コマンドと受付先 issue フォーム (S2 + S3)

## 1. 目的

Pack 利用者がハーネス自身のトラブルを報告する経路のうち、受付先 (S2) と、報告の束を作る `ut-tdd report`
コマンド・受付先の issue フォーム (S3) の契約を凍結する。書き込みセキュリティは S1 (`PLAN-L6-106`) の
`buildReport` に委ね、本 PLAN は S1 を**ちょうど 1 回呼ぶ**側の契約だけを定める。

本 PLAN は docs のみで、production source・test code・`.github/` を変更しない。実装は §8 の PR 列で、
v0.2.0-canary.3 の公開と受入 (#676 / #418) と、S1 の実装 PR (PLAN-L6-106 PR-1〜PR-3) の後に着手する。

## 2. 実測した背景 (origin/main 6b5effbc)

| 事実 | 根拠 (再現コマンド) |
|---|---|
| この repo には issue form が 5 本 (incident / nfr-failure / recovery / redesign / reverse) と `config.yml` があり、`blank_issues_enabled: false` は **2026-07-17 から既に有効** (PLAN-L7-451 W5) | `git log --format='%h %ad' --date=short -- .github/ISSUE_TEMPLATE/config.yml` (6b3eee7ba 2026-07-17) |
| `blank_issues_enabled: false` は既存テストが固定している。form 別の必須項目検査は列挙した 5 form だけが対象で、新しい form には及ばない | `tests/github-repository-policy.test.ts` U-L7-451-W5-001 (116 行、`perFormRequired`) |
| blank issue 禁止後も、開発側は issue を起票し続けている (2026-07-17 以降の作成 276 件)。Issue #815 自体もラベル 0 件で、form を経由していない (`gh issue create` / API 経由) | `gh issue list --state all --search "created:>2026-07-17" --limit 300 --json number` (276)、`gh issue view 815 --json labels` (空) |
| ラベル `consumer-report` は未作成。既存 form が付ける `ut-tdd` / `drive:*` もラベル一覧に無い | `gh label list --limit 100` |
| ハーネスの版は `readHarnessVersion` が package.json から読む (失敗時 `0.0.0`) | `src/setup/update-check.ts:368` |
| consumer の release identity は `consumer-runtime.json` (schema `ut-tdd.consumer-runtime.v1`) の `release.tag` / `release.source_revision` が持つ | `src/setup/consumer-runtime-release.ts:22-29` |
| doctor の結果 (`DoctorResult`) の `messages` は自由文で、path や PLAN ID を含みうる。機械的に安全なのは `ok` と check ID (`timings[].id` / `timings[].ok`) だけ | `src/doctor/result.ts:3-13` |
| doctor の scope は `full` / `toolchain` の 2 つ | `src/doctor/profiles.ts:1` |
| setup が consumer に置く `.github/ISSUE_TEMPLATE/recovery.md` / `add-feature.md` は consumer 自身の repo 向けで、ハーネスへの報告経路ではない (本 PLAN は変更しない) | `src/setup/templates.ts:753-761` |
| 上流へ報告する `ut-tdd report` コマンドは存在しない | `grep -n '.command("report' src/cli.ts` (0 件) |

## 3. PO 判断の記録と、それが置き換える記述

### 3.1 受付先 = このリポジトリの issue (PO 判断 2026-10-05、Issue #815 コメント)

受付先は **unison-ai-product/UT-TDD_AGENT-HARNESS (本 source repo) の issue** とする。新しい private repo (A) と
Pack repo (B) は採らない。前提は「報告はハーネス自身の問題に限る」ことで、PUBLIC repo であることのリスクは
次の 3 層で手当てする。(1) 束をハーネス自身の情報に限る (§4)。(2) issue フォームで項目を固定し、白紙 issue を塞ぐ (§6)。
(3) S1 の書き込み検査を最後の防波堤にする。

### 3.2 置き換える記述 (supersede の宣言ではなく、文言の訂正予定の記録)

この PO 判断は、次の記述を上書きする。どれも main へ merge 済みの confirmed PLAN ではないため `supersedes` は宣言しない。

| 置き換える記述 | 場所 | 扱い |
|---|---|---|
| 受入条件「受付先が PO の判断で決まっていて、公開 repo への直接の書き込み経路がない」 | Issue #815 本文の受入条件 3 | 前半は充足 (PO 判断済み)。後半「公開 repo への直接の書き込み経路がない」は PO 判断で撤回。本 PLAN §4-§6 の 3 層の手当てに置き換える |
| S2「公開 repo には直接書かせず、社内用の private な受付先を使います」 | Issue #815 本文の進め方 2 | 同上 |
| §8「S2: 受付先の決定 (公開 repo に直接書かせない。private な受付先の選択)」、§9「S2 の受付先 (新規 private repo か既存の社内 repo か)」 | PLAN-L6-106 (draft) | **本 PR では PLAN-L6-106 を編集しない**。PLAN-L6-106 の confirm revise (PR-4) で、本 PLAN を参照する形へ文言を訂正する |

### 3.3 受容した限界 (PO 判断 2026-10-05)

フォームの自由記述欄と、API / `gh issue create` 経由の起票は機械では縛れない。残るリスクは §7 の監視と削除の運用で扱う。
本 PLAN は「`ut-tdd report` を使った正規経路で、ハーネス外の情報が束に入らない」ことだけを機械で保証する。

## 4. 束の内容 (allowlist) と layout

### 4.1 allowlist (採択 A)

束に入れてよいのは次の項目**だけ**とする。どれもハーネス自身が持つ値か、ハーネスの実行に関する値である。

| key | 値の出どころ | 値の制約 (満たさなければ `unknown` へ置換) |
|---|---|---|
| `harness_version` | `readHarnessVersion(defaultHarnessRoot())` | semver 形 `^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$` |
| `release_tag` | consumer-runtime.json の `release.tag` | `^[A-Za-z0-9][A-Za-z0-9._-]*$` (既存の tag 検査と同じ) |
| `release_source_revision` | consumer-runtime.json の `release.source_revision` | `^[0-9a-f]{40}$` |
| `os` | `process.platform` + `-` + `process.arch` | Node が返す識別子のまま |
| `os_release` | `os.release()` | `^[0-9A-Za-z._-]{1,64}$` |
| `node` | `process.version` | `^v\d+\.\d+\.\d+$` |
| `command` | 利用者が `--command` で渡した、失敗した ut-tdd コマンド行 | 先頭が `ut-tdd ` で 1 行、512 byte 以下。満たさなければ `unknown` ではなく**入力エラー** (束を作らない、§5.3) |
| `exit_code` | `--exit-code` | `^-?\d{1,5}$`。省略時 `unknown` |
| `error_code` | `--error-code` (型付きエラーコード、例: `consumer_runtime_anchor_mismatch`) | `^[a-z0-9][a-z0-9_.:-]{0,63}$`。省略時 `none`。形に合わなければ入力エラー |
| `doctor_scope` | 固定値 `toolchain` | — |
| `doctor_ok` | `ut-tdd doctor --scope toolchain` 相当の in-process 実行の `ok` | `true` / `false` / `unavailable` (singleton 取得失敗・例外) |
| `doctor_failed_checks` | 同 `timings` のうち `ok: false` の `id` を ASCII 昇順で `,` 連結 | 各 id が `^[a-z0-9][a-z0-9._-]{0,63}$`。合わない id は `<invalid-id>` に置換。0 件なら `none` |
| `error_detail` | `error_code` が §4.1.1 のエラー定型表に載っているとき、その定型文に `--error-param key=value` (表が許可した key と値の形だけ) を差し込んで再構成した 1 行 | 表に無い code、表に無い key、形に合わない値は入力エラー。表に載らない code では `(none)`。利用者の自由文や生の例外テキスト・stack は受け付けない |
| env 節 | S1 `filterEnv` の出力 (allowlist は S1 実装 PR で確定) | S1 の契約のまま |

**明示的に入れないもの**: project のファイル内容、PLAN 本文・PLAN ID の一覧、doctor の `messages` (自由文)、
`DoctorResultEnvelope` の `producer_root` / `ref_map` / `head_sha`、S1 allowlist 外の env の値、git remote URL
(S1 が `<REMOTE>` へ伏せる)、ホスト名・ユーザー名、時刻・乱数。

| 案 | 採否 | 理由 |
|---|---|---|
| A: 上表の閉じた allowlist、自由文は `command` の 1 欄だけ。エラーメッセージは定型表から再構成した `error_detail` で表す | **採択** | PO 判断の「ハーネスの情報だけ」を key 単位で機械検査できる。生の例外テキストを締め出しつつ、PO が挙げた「エラーメッセージで原因が分かる」を満たす (advisor 第三案) |
| A2: エラーメッセージ本文を自由文で受け、S1 の最終検査で伏せる | 却下 | S1 の伏せ字は pattern ベースで、path / project 名に一致しない社内情報 (ホスト名の変種・利用者名) は素通りする。最終検査は最後の網であって一次防壁ではない |
| A3: `error_code` だけで本文を一切持たない | 却下 | 列挙できない失敗 (Node 例外・ENOENT 系) の再現力を失い、PO が挙げた報告項目を実質削る |
| B: doctor の `messages` 全文を入れる | 却下 | 自由文に project の path・PLAN ID が混ざる。S1 の検査は機密を拒否するが、project 名以外の業務語は検出できない |
| C: 実行ログ (`.ut-tdd/logs/`) を添付 | 却下 | project の作業内容そのもの。受付先が PUBLIC である前提と両立しない |

#### 4.1.1 エラー定型表

`error_detail` を作る定型表は `src/report/` に閉じた表として置く。各行は `code` / 定型文 (差込み位置付き) / 許可 key と値の形 (数値・閉じた列挙・`^[A-Za-z0-9._-]{1,64}$` の id) を持つ。初期の行は、consumer の install / verify / doctor で利用者が実際に目にする型付きエラーとし、確定は PR-1 で行う。表に無い失敗は `error_code` を `none`、`error_detail` を `(none)` として送り、開発側が triage で再現する。**PO の報告項目「エラーメッセージ」は、この PLAN では「定型表から再構成したエラーの説明」と解釈する** (生の本文は載せない)。この解釈変更は PO 判断として §3 に記録する。

doctor を `full` でなく `toolchain` にする理由: `full` は consumer の PLAN・docs を検査対象にし、check ID の集合自体が
project の構成を映す。`toolchain` はハーネスの実行環境だけを見る。doctor は singleton であり、二重起動 (exit 2 相当) を
検出したら待たず再試行もせず `doctor_ok: unavailable` とする (CLAUDE.md §Shared Guard Discipline)。

### 4.2 layout (S1 §3.8 の暫定 layout を確定する)

`buildReport` の入力 `text` は次の固定順・固定 key の行で、改行は `\n` (LF)。`error_detail` は 1 行で、改行を含まない。

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

- 末尾は `error_detail` の行の後に改行 1 つ (末尾改行はちょうど 1 つ)。
- S1 `assemble` は、この `text` の stage 2 出力に、env が空でなければ `env:` 行を挟まず改行 1 つと `KEY=VALUE` 行を続ける
  (S1 §3.8 の暫定 layout をそのまま最終形として採る。変更しないので S1 の golden も改訂不要)。
- `renderReportText` は純関数で、同じ facts から同じ bytes を返す (時刻・乱数を含めない。S1 §3.3-4 の再生成禁止と整合)。

## 5. `ut-tdd report` CLI 契約

### 5.1 関数仕様 (function-spec)

置き場所は `src/report/` (S1 と同じ module 群)。CLI 登録は `src/cli.ts` に `report` command を 1 つ足すだけとする。

| 関数 | 入力 → 出力 | 副作用 | 不変条件 |
|---|---|---|---|
| `collectReportFacts(opts, deps)` | CLI option + 注入した読取り関数 (version / consumer-runtime / os / doctor) → `ReportFacts` か入力エラー | deps 経由の読み取りだけ。書き込み・network なし | §4.1 の key 以外を持たない。制約に合わない値は `unknown` / `<invalid-id>`、`command` / `error_code` / `error_detail` の違反は入力エラー |
| `renderReportText(facts)` | `ReportFacts` → string | なし | §4.2 の layout と byte 同一。純関数 |
| `runReportCommand(opts, deps)` | option + deps (上記 + `buildReport` + io) → exit code | `buildReport` に渡す io の 2 sink と、§5.2 の固定文言だけ | `buildReport` を**ちょうど 1 回**呼ぶ (入力エラー時は 0 回)。network を呼ぶ deps を持たない |

### 5.2 出力経路

- io の配線: `previewSink` = stdout (TTY のときだけ)、`readLine` = stdin、`releaseSink` = cwd 配下
  `.ut-tdd/reports/report-<sha256 先頭 12 桁>.txt` (同じ directory の staging から rename で commit、S1 §3.3 1b (ii))。
  ファイル名は確定 bytes の digest から決め、時刻を使わない。
- 確認成立 (`ok: true` かつ `release: complete`) のときだけ、`buildReport` が戻った**後**に stdout へ次の 2 行を出す。
  `report: saved <報告ファイルの cwd 相対 path>` と
  `report: open https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/new?template=consumer-report.yml`。
  URL は定数で、束の内容を query に載せない (prefill しない)。利用者は保存した束をフォームの束欄へ貼る。
- 失敗時 (`ok: false` / 確認不成立 / 非対話) は、`buildReport` が戻った後に stderr へ `report: blocked <code>` を 1 行だけ出す。
  `<code>` は閉じた列挙 `input_invalid` / `violation:credential` / `violation:pii` / `violation:internal_endpoint` / `violation:path_residue` /
  `violation:known_value` / `check_failed` / `not_confirmed` / `non_interactive` / `release_failed` のどれかで、どの検査で止まったかまでを示す。
  検査が複数の種別で違反した場合は、この列挙順で最初の 1 つだけを出す。件数・位置・検出値・周辺文字列は出さない (S1 §3.3 で S3 へ委ねた「違反の診断を利用者へ表示する要否」の決定)。
- exit code: 確認成立で 0、それ以外は 1。
- `--yes` / `--force` / env による確認の迂回は持たない (S1 §3.3-5)。

| 案 | 採否 | 理由 |
|---|---|---|
| A: 束をファイルに保存し、フォーム URL を表示。network 送信はしない | **採択** | S1 の「自動送信はしない」と整合。network の失敗位相を増やさない。フォーム経由なので label と項目固定が効く |
| B: `gh issue create` で起票まで自動化 | 却下 (後送り) | 起票がフォームを経由せず、§6 の項目固定と label 付与が効かない (§2 の #815 が実例)。gh の認証状態と network 失敗を S1 の F2 位相へ持ち込む。需要が出たら security-audit 付きの別 PLAN で判断する |
| C: URL query に束を prefill | 却下 | 束がブラウザ履歴・proxy log に残る。URL 長の上限もある |
| D: 失敗時に marker と件数を表示 | 却下 | 件数は利用者の次の行動を増やさず、出力の表面積だけを増やす。検査の種別 (閉じた列挙) だけで、どの入力を見直すべきかは分かる |
| E: 何も出さず exit code だけ | 却下 | 詰まった利用者がツールを迂回して手で貼る経路を誘発し、検査を素通りさせる (advisor 指摘) |
| F: 位置・検出種別の詳細を手元の log file に出す | 却下 | S1 §3.3 の位相 F1 は file を含む全 channel を 0 とする契約で、log file はその C-file に当たる。採るなら S1 の改訂が先になる |

### 5.3 入力エラー

`--command` が無い・`ut-tdd ` で始まらない・複数行・512 byte 超、`--error-code` の形違反、`--error-param` の違反 (定型表に無い code・表が許可しない key・形に合わない値)、定義外 option (旧案の `--message` を含む) は、
`buildReport` を呼ばずに `report: blocked input_invalid` で終える (束を作らない)。`ut-tdd ` 以外のコマンドを拒否するのは
「ハーネスの問題だけ」を CLI 面で縛るためである。

## 6. 受付先 issue フォーム (S2)

### 6.1 `.github/ISSUE_TEMPLATE/consumer-report.yml`

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

- `labels: ["consumer-report"]`。`title: "Consumer report: "`。
- 既存 5 form の hierarchy 項目 (`hierarchy_role` / `parent_issue` / `closure_condition`) は**持たせない**。利用者は親 Issue を
  知り得ないためで、親子の設定は §7 の triage で開発側が行う (`docs/governance/github-issue-hierarchy.md` §3 の起票規則は
  開発側が起票する episode form に適用し、外部からの受付 form には triage 時に適用する)。既存 W5-001 は列挙した 5 form だけを
  検査するので衝突しない。

### 6.2 `config.yml` と blank issue

`blank_issues_enabled: false` は **既に有効で変更不要** (§2)。開発側への影響は、2026-07-17 以降の運用実績 (276 件の起票、
form 外の #815) で「開発側は API / `gh issue create` で起票しており、白紙 issue 禁止の影響を受けていない」と観測済みである。
API / `gh issue create` がフォームを経由しないことは PO 判断 §3.3 が受容した限界と同じ事実である。本 PLAN は config.yml を
変更せず、既存テストの固定を維持する。

### 6.3 ラベル

`consumer-report` ラベルは repo に未作成である (§2)。form の `labels:` は存在しないラベルを付けない可能性があるため
(notes の未検証前提 A2)、フォームを入れる PR で開発側がラベルを作成し、作成を PR コメントに記録する。

## 7. 運用 (S4 の残り)

- 監視: 開発側 (Claude control lane の EOD close-out) が `gh issue list --label consumer-report --state open` を確認する。
  CLAUDE.md §定期棚卸しの既存コマンドに 1 行足す扱いで、新規機構は作らない。
- 問題のある投稿 (業務情報・secret の混入): 確認した時点で開発側が issue を削除する (編集履歴に残るため、編集で消さない)。
  secret の場合は該当 credential の失効を報告者へ依頼する。
- 起票後に triage で親 Issue を設定するか top-level とする (github-issue-hierarchy.md §3)。
- 機械化 (新着通知・自動判定) はスコープ外。

## 8. PR 分割 (1 PR = 1 論点) と順序

| PR | 内容 | 前提 |
|---|---|---|
| PR-0 (本 PR) | 本 PLAN + pair test-design (docs のみ) | なし |
| PR-1 | `collectReportFacts` / `renderReportText` (純関数 + golden、除外データ不在) | PR-0 freeze、PLAN-L6-106 PR-2 (`buildReport` の入力型) |
| PR-2 | `runReportCommand` と `src/cli.ts` の `report` 登録 (buildReport 1 回、network 0、出力経路、exit code) | PR-1、PLAN-L6-106 PR-3 |
| PR-3 | `.github/ISSUE_TEMPLATE/consumer-report.yml` + form oracle + ラベル作成の記録 | PR-0 freeze (PR-1/2 と独立、並行可) |
| PR-4 | security-audit 非著者 review の記録、PLAN confirm、PLAN-L6-106 §8/§9 の文言訂正を PLAN-L6-106 PR-4 と合わせる | PR-1〜PR-3 |

実装着手 (PR-1 以降) は v0.2.0-canary.3 の公開と受入の後。PR-0 は受入作業と並行してよい。

## 9. 受入条件 (反証可能、oracle は pair test-design の CANDIDATE)

1. 束は §4.2 の layout と byte 同一 (golden)。§4.1 の key 以外の行が無い。
2. 除外データ (project ファイル内容、PLAN 本文・ID、doctor messages、envelope の producer_root / ref_map、allowlist 外 env 値、
   remote URL) を fixture に仕込んでも束に現れない。
3. `runReportCommand` は 1 run で `buildReport` をちょうど 1 回呼び、入力エラー時は 0 回。
4. `ut-tdd report` の実行中に network 呼出し (http / https / net / dns / child_process による gh 起動) が 0。
5. 失敗時の stderr は `report: blocked <閉じた列挙>` の 1 行だけで、検査の種別までを示し、件数・位置・検出値が出ない。確認成立時だけ保存 path と定数 URL が出る。
6. `consumer-report.yml` が YAML として解析でき、§6.1 の required 項目・dropdown・`labels: [consumer-report]`・注意書きを持ち、
   dropdown が package.json の現在版を含む。`config.yml` の `blank_issues_enabled` は false のまま。
7. 非対話・確認不成立・`--yes` 等の迂回 option が S1 の契約どおりに効かない (S1 の oracle 011 を CLI 経由で再確認)。

## 10. advisor 記録

2026-10-05 に `ut-tdd advisor --decision design` (claude-fable-5) へ 3 点を諮問し、前提を実測と照合した。

- U1 (失敗時の表示): 起草案 (閉じた列挙の code 1 行) は生存。条件として「どの検査で止まったか」まで分かる粒度を求められたため、`violation:<種別>` に分けた (§5.2)。advisor が併せて示した「詳細をローカル log に落とす」案は、S1 §3.3 の位相 F1 (file を含む全 channel 0) と衝突するため採らない (§5.2 案 F)。
- U2 (フォームに親 issue 欄を持たせない): 推奨どおり生存。利用者は親 issue を構造的に知り得ず、canonical parent は開発側が triage で 1 件設定する (`docs/governance/github-issue-hierarchy.md`)。
- U5 (エラーメッセージ本文): 起草案の二択 (本文を入れる / code だけ) は偽二択と判定された。第三案 (定型表から再構成し、生の例外テキストは載せない) を採った (§4.1、§4.1.1)。PO の報告項目の解釈変更として §3 に記録する。
- advisor が指摘した未検証の前提: PLAN-L6-106 はまだ main に無い (branch `work/add-feature-issue815-report-security-plan-20261001` の rev 4 を参照している)。閉じた列挙の code に新しい検査を足すときの強制は、oracle (§9) で列挙の完全性を検査することで担保する。

## 11. スコープ外

- `gh issue create` / API による自動起票 (§5.2 案 B)。
- Pack repo の issue 運用 (受付先にしない)。
- consumer 向け `src/setup/templates.ts` の issue template。
- 監視・削除の機械化。
