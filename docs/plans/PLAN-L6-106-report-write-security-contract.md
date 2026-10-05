---
plan_id: PLAN-L6-106-report-write-security-contract
title: "PLAN-L6-106 (add-design): Pack 利用者からのトラブル報告の書き込みセキュリティ契約 (#815 S1)"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-01
updated: 2026-10-05
owner: Claude control lane (起草は Opus 週次上限中の Sonnet 代替、検収は 2026-10-05 Opus) /
  Codex (実装 PR) / 非著者 frontier reviewer (Codex Sol) / security-audit (非著者 必須)
parent_design: docs/design/harness/L6-function-design/secret.md
pair_artifact: docs/test-design/harness/L7-report-write-security-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: 既存の secret-scan 契約 (PLAN-L6-62) と pre-push の PII
  規則を、実行時に作る報告の束の出力前 gate へ拡張する L6 契約であり、L0-L3 要件の意味は変えない。本 PLAN は docs のみで
  production source を変更しない。 実装 PR で新契約が生じた場合のみ Reverse を起票する。
agent_slots:
  - role: tl
    slot_label: TL - 段構成 (入力検査 / path / env / 最終検査 / 確認) と fail-close の境界を freeze する
  - role: se
    slot_label: SE - 各関数の入出力・不変条件と、scanner option / PII 規則共有化の変更範囲を定義する
  - role: qa
    slot_label: QA - 段別感度 (各段を個別に隔離した mutation) と全 channel 無出力の oracle を定義する
generates:
  - artifact_path: docs/plans/PLAN-L6-106-report-write-security-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/secret.md
  requires:
    - docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-260-sensitive-scan-boundary.md
    - docs/test-design/harness/L7-report-write-security-test-design.md
    - src/lint/secret-scan.ts
    - src/secret.ts
    - src/cli/distribution.ts
    - scripts/git-hooks/secret-scan-diff.ts
    - src/setup/templates.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/815
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/809
review_evidence: []
status: draft
github_issue_id: 815
admission_receipt:
  schema_version: v2
  receipt_id: certificate:45e50395160adc6057c5c16c76887064
  command_id: plan-revise:issue-815:report-security:rechain:sol-r2-fix:r3:9eb1939b3574
  admitted_at: 2026-10-05T02:24:22.110Z
  source_digest: sha256:35bc9ab354d44ad2cc81ac3d6faeafebae2ecad79bdc3708fe05684da37fc6b2
  decision_digest: sha256:69115f61930b9d8e679dff7b6a4ac0f7e3e27022ef0e4a8f852a3db64e11c8a4
  receipt_digest: sha256:5cfcfa21e4b0b56531b58af295edbf8a1e23f983568ce2ac5669d7097847b649
  binding:
    path: docs/plans/PLAN-L6-106-report-write-security-contract.md
    plan_id: PLAN-L6-106-report-write-security-contract
    asset_id: plan:d10f80206656cb46a302ef2114d842e1
    revision: 3
    content_digest: sha256:35bc9ab354d44ad2cc81ac3d6faeafebae2ecad79bdc3708fe05684da37fc6b2
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 815
    episode_id: E4-815-report-write-security
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-62-design-doc-secret-scan-gate
    revision: 1
    digest: sha256:610d332e78fa0b1893fd1299881eeef3237bd8801f5ba9364f5d70aec59c2c41
  reentry:
    target_plan_id: PLAN-L6-106-report-write-security-contract
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue 815: PR #820 Sol r2 の残り 1 件の是正 (位相 F2 の失敗契約を、検査済みでない bytes
    を出さない・報告先は不在か全文と同一・戻り値が実状態と一致、の 3 点に言い直す)。段構成・SSoT・allowlist の方式は変えない"
---

# PLAN-L6-106 (add-design): トラブル報告の書き込みセキュリティ契約 (S1)

> 起票経緯: 本 PLAN は、クローズした PR #817 の `PLAN-L6-816-report-security-class-contract`
> (route forward / kind design / sub_doc class-design) を作り直した再起票である。PLAN-L6-816 は main へ
> merge されていないため `supersedes` は宣言しない。再起票の理由は、非著者 reviewer (Codex Sol) の FLAG 4 件である。
> (1) 内部 URL の判定基準の先送り、(2) 無出力と確認プレビューの未整理、(3) oracle の段別感度の不成立、
> (4) 本文が function-spec の契約なのに class-design で起票していた route / kind の不整合。

## 1. 目的

社内で Pack を使う利用者がハーネスのトラブルを報告するとき、**報告の束を出力する前に**、
機密と社内情報が公開面へ漏れないことを保証する契約を凍結する。Issue #815 の slice S1 だけを扱う。
PO 判断 (2026-10-01): 書き込みセキュリティを先に通し、報告の仕組み本体は後続 slice で作る。

本 PLAN は契約 freeze のみで docs 変更に限る。production source と test code は追加しない。
実装は §7 の PR 列で、v0.2.0-canary.3 の公開と受入 (#676 / #418) の後に着手する。方式は実装 PR の中で発明せず、
本 PLAN の改訂へ戻す (PR スコープ規律 2)。

## 2. 実測した背景 (origin/main 6b5effbc)

| 事実 | 根拠 (再現コマンド) |
|---|---|
| 既存 scanner `analyzeSecretScan` は `SECRET_SCAN_PATTERNS` 6 種 (narrow-secret-token / aws-access-key / github-token / private-key-block / authorization-bearer / secret-assignment) を行単位で検査し、`ALLOW_LINE_MARKERS` (dummy / placeholder / redacted / example / fake / fixture / test-only 等) を含む行を**無条件で免除**する。利用者の自由文が `example` と書くだけで token が素通りする | `grep -n ALLOW_LINE_MARKERS src/lint/secret-scan.ts` (宣言 38、使用 46) |
| `analyzeSecretScan` は artifact 配列だけを取り option を持たず、免除を切る手段がない。報告用途では引数追加 (既定は現挙動) が必要 | `src/lint/secret-scan.ts:51` |
| 1 pattern につき最初の 1 行しか報告しない (`firstMatchLine`)。違反の全件列挙ではなく、fail-close の判定には足りるが件数は「検出 pattern 数」である | `src/lint/secret-scan.ts:41-49` |
| PII (電話・郵便番号・email・internal URL) の検査は scanner の外、`scripts/git-hooks/secret-scan-diff.ts` の `PII_SCAN_PATTERNS` (132 行) と `analyzePiiScan` (150 行) に局在し、`src/` からは再利用できない。internal URL の現行規則は 2 つの非アンカー正規表現 (`(?:label.)+internal` と `(?:label.)+corp.<tail>`) だけで、IP・userinfo・query・単一 label host・IPv6 は見ない | `grep -n PII_SCAN_PATTERNS scripts/git-hooks/secret-scan-diff.ts` |
| `runDistributionSecretScan` は distribution の copy / prune / tar の**前**に走り、違反があれば止める。出力前 gate の先例である | `grep -n runDistributionSecretScan src/cli/distribution.ts` (定義 251 + 呼出し 625 / 948 / 1073 の 3 件) |
| 認証 env を `/AUTH\|TOKEN\|SECRET\|CREDENTIAL\|API_KEY/i` で探す方式は `GH_*` / `GITHUB_*` を拾えない (#809 指摘 3) | `gh issue view 809` |
| 報告先候補の Pack repo と source repo はどちらも PUBLIC。setup が置く issue template は consumer 自身の repo 向けで、ハーネスへの報告経路ではない | Issue #815 本文 (`src/setup/templates.ts:753-761`) |
| 既存テスト: `tests/secret-scan.test.ts` (scanner)、`tests/secret-scan-diff.test.ts` (pre-push の bare remote e2e) | `ls tests | grep secret-scan` |

重複確認: `PLAN-L7-260-sensitive-scan-boundary` は「リポジトリ内 artifact の credential 検査」の正本であり、
本 PLAN は **実行時に利用者の入力・診断から作る束の出力前 gate** を扱う。対象面が異なるため新規 PLAN とし、
scanner 本体は既存 (PLAN-L6-62 / L7-260) の成果を再利用する (複製しない)。

## 3. 設計判断

### 3.1 処理順序と fail-close (採択 A)

束 (`{ text, env }`) はメモリ内だけで組み立て、次の 5 段で処理する。段の通過データと呼出し回数は §3.8 の
関数仕様で固定する。**確認プレビューの前 (位相 F1) に違反・検査失敗・例外があれば、あらゆる出力 channel への
書き込みを 0 にする** (§3.3 の channel 一覧)。確認プレビューの後 (位相 F2) の失敗は §3.3 の 1b に従う。

1. 入力検査 (stage 1): 生の `text` に対し credential scan (免除なし) と PII scan と内部 endpoint 検査 (§3.5) を実行する。
   伏せ字化の**前**に検査し、隠して見逃す事態を防ぐ。
2. path redaction (stage 2): ホーム・cwd・project root・project 名・remote URL を固定 placeholder へ置換する (§3.5)。
3. env 処理 (stage 3): key allowlist に載る key だけを残し、許可 key の値にも scan と path redaction を適用する。
   許可外の key は値を検査せず捨てる (捨てた値は束にも診断にも載らない)。
4. **最終 leak 検査** (stage 4): stage 2-3 の結果を組み立てた**全文**に対し、前段と独立にもう一度
   credential / PII / 内部 endpoint / path 残存 / 既知値残存 を検査する。
5. 利用者確認 (§3.3) を経て初めて報告出力する。

| 案 | 採否 | 理由 |
|---|---|---|
| A: 入力検査 → redact → env allowlist → 最終検査、違反は無出力 | **採択** | 多段で漏れを塞ぎ、失敗時の公開面への書き込みが 0 |
| B: 伏せ字化後に scan するだけ | 却下 | 伏せ字化が壊した token を scan が見逃す。原本の検査が消える |
| C: 違反箇所を伏せて継続出力 | 却下 | 検出漏れを公開へ持ち込む。fail-close に反する |

### 3.2 redaction 規則の置き場所 (SSoT) と scanner の再利用 (採択 A)

- credential の検出規則は `src/lint/secret-scan.ts` を唯一の正本とし、規則を複製しない。
- 報告用に **免除なしモード** を追加する (`analyzeSecretScan` へ option を足す。既定は現挙動のまま)。
  `ALLOW_LINE_MARKERS` を報告経路で無効にする。利用者入力の語で検査を免除させない。
- PII の正規表現は `scripts/git-hooks/secret-scan-diff.ts` から `src/lint/` 配下の共有モジュールへ**移して**
  pre-push と報告の両方が import する (複製ではなく移設。pre-push の挙動は変えない)。§3.5 の内部 endpoint 検査も
  同じ共有モジュールに置く。ただし内部 endpoint の拡張規則は報告経路専用で、pre-push の判定は現行規則のまま変えない。
- 報告固有の変換 (path redaction、env allowlist、確認) は新規 `src/report/` に置く。

| 案 | 採否 | 理由 |
|---|---|---|
| A: scanner を option 拡張 + PII 規則を共有化 + `src/report/` に変換 | **採択** | 規則の SSoT を保てる。変更は 2 箇所 (option と移設) に閉じる |
| B: `src/report/` に規則を丸ごと複製 | 却下 | drift 源 (CLAUDE.md の Rule Placement の趣旨と同じ) |
| C: 免除のまま利用 | 却下 | 実測した bypass (§2) を放置する |

### 3.3 無出力の範囲と、確認プレビューと報告出力の区別 (採択 A)

用語を 3 つに分ける。

- **外部出力 channel**: ファイル書き込み・stdout・stderr・log・一時ファイル・例外メッセージ・
  確認プレビュー用 sink・報告出力用 sink の全て。報告出力用 sink の staging (下記 1b) と報告先への書き込みは
  報告出力用 sink の channel として扱い、それ以外のファイル書き込みの channel には数えない。
- **確認プレビュー**: 検査 (stage 1-4) を全て通過した全文を、利用者が確認するために対話端末へ表示すること。
  検査を通った後にだけ起こり、報告出力ではない。
- **報告出力**: 利用者が明示的な確認を与えた後に、確定した全文を保存・送信用の sink へ渡すこと。

契約 (観測時点は pair test-design §3 の T0-T3 で定義する):

失敗は、確認プレビューを書き始める前か後かで 2 つの位相に分ける。

- **位相 F1 (プレビュー前)**: stage 1-4 の違反・検査失敗・例外と、組み立て (`assemble`) の例外。
- **位相 F2 (プレビュー後)**: `previewSink` / `readLine` / `releaseSink` の例外 (sink が一部を書いてから throw する場合を含む)。

1. **位相 F1**: 外部出力 channel の全てで 0 byte。確認プレビューも出さない。
   **marker と件数を含む診断も外部へ出さない**。marker (検出の種別) と件数 (検出 pattern 数) は関数の
   戻り値 (プロセス内のみ) に保持し、検出値と周辺文字列は戻り値にも含めない。診断を利用者へ表示する経路
   (件数だけ見せる等) は S3 の設計判断であり、S1 では外部へ出さない。例外は境界で捕捉して戻り値の失敗へ変換し、
   呼出し元へ throw しない (例外文言に値が混ざる経路を作らない)。
1b. **位相 F2**: 例外は捕捉して失敗の戻り値に変え、throw しない。F2 で保証するのは次の 3 点である。
   - (i) **検査済みでない bytes を出さない**: どの channel にも、検査済み全文 (stage 4 の入力と byte 同一) の
     部分列でない bytes を書かない。確認プレビューに出るのは検査済み全文の先頭部分 (0 byte から全文まで) だけである。
   - (ii) **報告先は 2 状態のどちらか**: 報告先は「不在」か「確認済み全文と byte 同一」のどちらかで、途中まで書かれた
     報告出力を作らない。`releaseSink` は staging と commit の 2 段を持つ。`write(bytes)` は報告先から見えない staging に
     だけ書く。`commit()` は staging を報告先へ移す **単一の原子的操作** (file なら同じ directory 内の rename。既存の報告先は
     上書きしない) とし、その操作の後に例外を出しうる処理を `commit` の中に置かない。`previewSink` / `readLine` が例外を
     出した場合と、確認が成立せず `commit` を呼ばない場合、報告先は「不在」である。`previewSink` が例外を出したら
     `readLine` と `releaseSink` を呼ばない。
   - (iii) **戻り値が実状態と一致する**: `write` / `commit` が例外を出したとき、`buildReport` は `commit` の成否を推定しない。
     報告先を読み戻して状態を判定し、戻り値の `release` に `absent` / `complete` を報告する (`complete` の場合も戻り値は
     失敗のまま。検査と確認を通った bytes なので漏えいではない)。続けて `discard()` を呼んで staging を消す。`discard` が
     例外を出した場合や、消す前に throw した場合は、staging の消去を保証できない。その場合は戻り値の `staging` に
     `residual` を報告する。staging に残り得るのは (i) により検査済み全文の部分列だけである。staging を消せた場合は
     `staging: none` を報告する。
   F2 の期待は「報告出力 0」ではなく、上記 (i)-(iii) である。報告先の不在と staging の消去は、それぞれ戻り値の報告と
   実状態が一致することで観測する。
2. **検査通過後、確認が成立しない場合** (`yes` 以外の入力・空入力・EOF): 確認プレビューは表示済みでよいが、
   報告出力は 0 byte。表示済みの全文は検査済みの全文に限る。
3. **非対話実行** (TTY なし、確認入力なし): 確認の相手がいないため、確認プレビューも報告出力も 0。
4. **確認成立** (`yes` を 1 行、行末の改行以外を含まない完全一致、大小区別あり): 報告出力は、確認プレビューで
   表示した byte 列と同一でなければならない。表示後に再生成しない (時刻・乱数など実行ごとに変わる値を
   S1 の全文に含めない)。
5. `--yes` / `force` / env による確認の迂回経路を設けない。自動送信はしない。保存・送信の経路は S3 で freeze する。
6. 確認プレビューの全文と報告出力は UTF-8 (BOM なし) の同一 byte 列とし、改行は入力のまま保存する。

| 案 | 採否 | 理由 |
|---|---|---|
| A: 検査通過後だけ全文プレビュー + 明示 yes、違反は全 channel 0 | **採択** | 公開面への最後の人間確認を維持し、検査未通過の全文を端末にも出さない |
| B: `--yes` で CI 向けに自動化 | 却下 | 確認の迂回経路となり、S1 の目的を損なう。自動化の需要は S3 で別途判断する |
| C: 違反でも marker と件数を stderr へ出す | 却下 | 外部へ出る診断が値の手掛かりになり得る。表示の要否は S3 で security-audit 付きで決める |
| D: 差分だけ表示 | 却下 | 利用者が全文を見られず、確認が形骸化する |

### 3.4 env の扱い (採択 A)

- **許可 key の allowlist** 方式にする。「報告に含めてよい key」だけを列挙し、未知の key は除外する。
- 初期の allowlist は診断に必要な最小集合 (OS / Node の版を示す key 等) とし、確定は実装 PR の設計判断節で行う。
- 許可 key の値にも secret / path / 内部 endpoint 検査を適用し、違反なら fail-close する。
- 名前の regex (認証らしい語の一致) による除外判定は用いない (#809 の教訓)。
  `GH_*` と `GITHUB_*` の key は allowlist に無いため除外されることを回帰 oracle に含める。
- 許可外 key の値は stage 1 では検査しない。捨てるだけなので、利用者の通常の環境変数 (認証 token 等) が
  束に混ざるたびに全報告が失敗する事態を避ける。値が束へ漏れていないことは stage 4 が全文で保証する。

### 3.5 path / URL / project 名の判定 (本契約で確定する)

#### 3.5.1 redaction と拒否の境界

| 対象 | 扱い | 理由 |
|---|---|---|
| 環境から既知の値 (実 home・cwd・project root・project 名・remote URL) | stage 2 で固定 placeholder へ置換 (redaction) | 値が分かっているので、完全一致で確実に置換できる |
| 一般形の path (Windows / POSIX の home 形式) | stage 2 で home 部分を `<HOME>` へ置換 | 既知値以外の利用者 path も落とす |
| 自由文に現れる内部 endpoint (host / IP / userinfo / query の秘密) | 置換せず**違反 (fail-close)** | 範囲を予測できない値を部分置換すると取りこぼす。置換でなく拒否にする |
| credential / PII | 置換せず違反 (fail-close) | §3.1 案 C の却下理由と同じ |

placeholder は固定文字列 `<HOME>` / `<CWD>` / `<PROJECT_ROOT>` / `<PROJECT>` / `<REMOTE>` とし、最終検査は
placeholder を漏れと判定しない。既知値の置換は、長い値から先に、区切り (`\` / `/` / 混在)・drive letter の大小・
UNC・末尾区切りの有無を区別せず、project 名は大小を区別せず全出現を置換する。
remote URL が userinfo・秘密を含む query・内部 host (§3.5.2) のいずれかに該当する場合は、
redaction 対象ではなく違反とする (実測した remote を黙って伏せて通さない)。

#### 3.5.2 内部 endpoint の判定基準 (内部 host / IP / userinfo / query)

判定単位は 2 つ。(U) URL token = `<scheme>://` で始まり空白・引用符・括弧で終わる文字列。
(B) URL に入っていない dotted-quad の IPv4 (任意で `:port`)。(B6) URL に入っていない IPv6 literal: `[` `]` で囲まれた文字列、
または空白・引用符・括弧・`,` `;` で区切られた token のうち `:` を 2 個以上含み、Node `net.isIPv6()` が true を返すもの
(末尾の `%zone` は除いて判定する。`[...]:port` 形を含む)。`net.isIPv6()` が false の token (`12:30:45` の時刻、
`std::vector` のような名前空間区切り、`a:b` の key-value) は IPv6 として扱わない。それ以外の bare な host 名は、現行の
PII 規則 (`internal` / `corp` を含む 2 規則、移設後も挙動不変) だけで判定する。広い suffix 集合を URL の外へ
適用すると `settings.local.json` のような通常の file 名を誤検知するためである。

**正規化 (判定の前に必ず行う)**:

- N1: Unicode NFKC 正規化し、zero-width 文字 (U+200B-U+200D、U+2060、U+FEFF) を除く。
- N2: URL token は WHATWG `URL` で解析して host を得る。これにより host の小文字化、IDN の punycode 化、
  host の percent-encoding 1 回分の復号、IPv4 の 10 進整数・8 進・16 進・短縮形の dotted-quad 化、IPv6 の標準形化
  (IPv4-mapped は `[::ffff:a00:1]` のような 16 進表記になる) が行われる。**WHATWG は末尾 dot を除去しない**
  (`foo.internal.` のまま返す) ため、解析後に末尾 dot を 1 個除いてから判定する。percent-encoding を 2 重にした
  host (`%25` を含む) は WHATWG が解析に失敗するので N3 で違反になる。
  (実測: Node `new URL(u).hostname`、2026-10-05。`http://Foo.Internal./` → `foo.internal.`、
  `http://0x7f.1/` → `127.0.0.1`、`http://exa%6dple.corp/` → `example.corp`、`http://ex%2561mple.com/` → 例外)
- N2b: WHATWG が host を正規化するのは special scheme (`http` / `https` / `ws` / `wss` / `ftp` / `file`) だけで、
  それ以外の scheme では host を opaque のまま返す (実測: `custom://0x7f.1/` の hostname は `0x7f.1`)。そのため
  **special scheme 以外の URL token は、authority から host を取り出し (userinfo と port を除く)、`http://` + host + `/` として
  WHATWG で再解析した host で判定する**。再解析に失敗した場合は N3 で違反。host が空の URL token (`custom:///x`) は
  判定対象の host を持たないので R-U1 / R-U4 の対象外とし、R-U2 / R-U3 は通常どおり適用する。
- N3: **解析できない URL token は違反** (判定不能は拒否)。
- N4: 先頭 0 付き octet を持つ IPv4 は、10 進読みと 8 進読みの**両方**を判定し、どちらかが内部なら違反。
  bare IPv4 と URL token の host 文字列 (WHATWG 解析前の生の authority) の両方に適用する。WHATWG は先頭 0 を
  8 進と読むため、`http://010.0.0.1/` は解析後 `8.0.0.1` (公開) になり、10 進読みの `10.0.0.1` (内部) を見逃すからである
  (実測: 同上、`http://010.0.0.1/` → `8.0.0.1`)。
  各 octet が 255 を超える、または 4 部でない数字列 (版番号の `2026.10.01.7` 等) は bare IPv4 として扱わない。

**R-U1 内部 host (違反)**: 正規化後の host が次のいずれかに該当する。

- IPv4 が 0.0.0.0/8、10.0.0.0/8、100.64.0.0/10、127.0.0.0/8、169.254.0.0/16、172.16.0.0/12、192.168.0.0/16 のいずれか。
- IPv6 が `::`、`::1`、fc00::/7、fe80::/10、または IPv4-mapped (::ffff:0:0/96) で埋め込み IPv4 が上の範囲。
- host 名が `localhost` または `.localhost` で終わる。
- host 名に dot が無い (単一 label)。IP literal は除く。
- 最終 label が `internal` / `corp` / `local` / `localdomain` / `lan` / `intranet` / `private` のいずれか、
  host 名が `home.arpa` に一致するか `.home.arpa` で終わる、または最終でない label に `corp` がある (現行規則の意味を保つ)。

**R-U2 userinfo (違反)**: URL token の authority (`://` から最初の `/` `?` `#` まで) に `@` がある場合は、
host が公開であっても違反。path や query 内の `@` は userinfo ではない。

**R-U3 query / fragment の秘密 (違反)**: query と、`=` を含む fragment を `key=value` に分け、key と value を
percent-decode (最大 2 回、`+` は空白) して次のいずれかなら違反。

- (i) key (小文字、`-` を `_` に揃える) が許可外集合 K に含まれ、value が空でない。
  K = token / access_token / id_token / refresh_token / api_key / apikey / key / secret / client_secret /
  password / passwd / pwd / auth / authorization / signature / sig / session / sessionid / code。
- (ii) 復号後の `key=value` 全体が、免除なしの credential scan に検出される (K に無い key の値に token を
  置く迂回を防ぐ)。

**R-U4 bare IPv4 (違反)**: (B) の IPv4 が R-U1 の範囲に該当する。

**R-U5 bare IPv6 (違反)**: (B6) の IPv6 が R-U1 の IPv6 範囲 (`::`、`::1`、fc00::/7、fe80::/10、内部 IPv4 を埋め込んだ
IPv4-mapped) に該当する。公開 IPv6 の bare literal は通過する。

**通過 (違反としない)**: 公開 host 名・公開 IP (前記範囲の外、境界の直外 172.15.255.255 / 172.32.0.1 /
192.167.255.255 / 192.169.0.1 / 100.63.255.255 / 100.128.0.1 等を含む)・公開 IPv6、userinfo も
K の key も秘密 value も持たない URL、`@` が path にあるだけの URL、URL に入っていない
`*.local.*` 形の file 名。**既知の偽陽性**: 版番号が偶然 10.x.y.z の形をとると違反になる。報告の fail-close を
優先して受容する。

pair test-design の CANDIDATE-U-RPTSEC-009 は、上記を満たす陽性 (違反) と陰性 (通過) の fixture 表を
実行時に生成して、期待値を固定する。

### 3.6 review (採択)

非著者の **security-audit review を必須**とする。判定項目は、全 channel の無出力、免除の無効化、プレビューと
出力の同一性、段別感度 (§4 AC7)、内部 endpoint の陽性・陰性表 (§3.5.2) である。cross review は Claude 著の本 PLAN を
Codex gpt-6.1-sol が行う。FLAG 後の軽作業の是正は author family が同 PR 内で行い、同じ非著者 reviewer が新 exact head を
再検する (CLAUDE.md §FLAG 後の限定是正と merge)。

### 3.7 advisor 記録

PLAN-L6-816 の起草時 (2026-10-01) に `ut-tdd advisor --decision implementation` (gpt-6.1-sol) の回答を実測で
照合した。採用した助言: 無出力の範囲を全出力経路へ拡張 / 免除無効化を AC に昇格 / 表示と出力の同一 / env を
allowlist に限定し許可 key の値も検査 / 内部 URL の判定基準の明確化 / 最終 leak 検査の追加。
実測で確かめた前提: 免除と option 不在は `src/lint/secret-scan.ts` で事実。PII 規則の局在は
`scripts/git-hooks/secret-scan-diff.ts` で事実。追加した実測 (advisor 未指摘): `firstMatchLine` が 1 pattern 1 行しか
報告しない点。

本再起票で加えた判断 (内部 endpoint の判定基準、確認プレビューと報告出力の区別、marker・件数も外部へ出さない、
段別感度の隔離 seam) は FLAG の指摘をそのまま契約化したもので、方式の選択肢は上表で却下理由まで示した。
advisor の再相談は本起草では行っていない (control lane が必要と判断すれば `--decision design` で実施する)。

2026-10-05 の control lane 検収 (Claude Opus) で §3.5.2 の正規化を Node の WHATWG `URL` で実測し、2 点を直した。
(a) WHATWG は末尾 dot を除去しないため、解析後の除去を N2 に明記した。(b) WHATWG は URL host の先頭 0 付き octet を
8 進と読むため、10 進・8 進の両読み (N4) を URL host にも適用した。

rev 2 (PR #820 Sol r1 FLAG 3 件の是正、2026-10-05、Claude Opus):
(1) 失敗をプレビュー前 (F1) とプレビュー後 (F2) に分け、`releaseSink` に staging / commit / discard を持たせて、一部書き込み後の throw でも報告出力を確定 0 にした (§3.3、§3.8、AC1 / AC6)。この「確定 0」は rev 3 で訂正した。
(2) WHATWG が host を正規化しない非 special scheme は、host を `http://` で再解析して判定する N2b を加えた (実測: `custom://0x7f.1/` の hostname は `0x7f.1`、再解析で `127.0.0.1`)。
(3) URL 外の bare IPv6 (B6 / R-U5、`net.isIPv6()` で判定。実測: `12:30:45` / `std::vector` / `a:b` は false) と、`home.arpa` そのものを内部 host に加えた。
方式 (§3.1 の段構成、§3.2 の SSoT、§3.4 の allowlist) は変えていない。

rev 3 (PR #820 Sol r2 の残り 1 件の是正、2026-10-05、Claude Opus): rev 2 の「F2 でも報告出力は確定 0、staging は残らない」は、
commit の後の throw や discard の失敗を考えると保証できない約束だった。F2 の契約を保証できる 3 点に言い直した:
(i) 検査済みでない bytes をどの channel にも出さない、(ii) 報告先は不在か全文と同一のどちらか (単一の原子的 commit)、
(iii) 戻り値の release / staging の報告が実状態と一致する (readBack で判定)。§3.1 の「全 channel 0」は F1 に限定し、
staging を報告出力 sink の channel に帰属させた。

### 3.8 関数仕様 (function-spec)

関数名は契約上の名前で、`src/lint/` と `src/report/` に置く。実装 PR は名前と挙動を本節から変えない。

| 関数 | 入力 → 出力 | 副作用 | 不変条件 |
|---|---|---|---|
| `analyzeSecretScan(artifacts, options?)` (既存、`src/lint/secret-scan.ts`) | artifact 配列 + `{ honorAllowMarkers?: boolean }` (既定 true) → `SecretScanResult` | なし | option 省略時は現挙動と完全に同じ。報告経路は `false` を渡す。`ALLOW_LINE_MARKERS` の免除は `false` で一切効かない |
| `analyzePiiScan` / `inspectInternalEndpoints(text)` (共有モジュール) | text → `{ ok, markers }` | なし | PII 4 規則は移設前後で挙動不変。endpoint 検査は §3.5.2 の R-U1..R-U5 + N1..N4 (N2b を含む) だけを実装する |
| `inspectReportInput(text)` (stage 1) | 生の text → 判定 (`ok` / marker / 件数) | なし | 入力は伏せ字化前の bytes。変換しない。credential は免除なし |
| `redactPaths(text, ctx)` (stage 2) | text + 既知値 (home / cwd / project root / project 名 / remote) → 置換後 text | なし | §3.5.1 の置換だけを行う。置換後の text に既知値と home 形式 path が残らない |
| `filterEnv(env, allowlist, ctx)` (stage 3) | env + allowlist → 許可 key の `KEY=VALUE` 行 (key の ASCII 昇順) | なし | allowlist 外は値を読まず捨てる。許可 key の値は scan と `redactPaths` を通す |
| `finalLeakCheck(assembled, ctx)` (stage 4) | 組み立て後の全文 → 判定 | なし | stage 1 の関数を再利用してよいが、**stage 1 の結果を参照しない**独立の呼出しである。入力は確認・出力へ渡す bytes と同一 |
| `confirmAndRelease(bytes, io)` (stage 5) | 検査済み bytes + `{ interactive, previewSink, readLine, releaseSink: { write, commit, discard, readBack } }` → 結果 (`release: absent | complete`、`staging: none | residual` を含む) | previewSink への書き込みと releaseSink の staging / commit / discard / readBack だけ | 非対話なら何も書かない。`yes` 完全一致のときだけ releaseSink へ**同じ bytes** を write して commit する。commit は単一の原子的操作で、その後に例外を出しうる処理を持たない。write / commit の例外では readBack で報告先の状態を判定してから discard を呼び、戻り値の release / staging を実状態と一致させる (§3.3 1b)。迂回用の引数・env を読まない |
| `buildReport(input, io, stages?)` (orchestrator) | `{ text, env }` + io → `{ ok: true, bytes } \| { ok: false, code, markers, count }` | io の 2 sink のみ | 各 stage を**ちょうど 1 回**、§3.1 の順に呼ぶ。違反・例外で throw せず、失敗の戻り値を返す。`stages` は検査を個別に隔離する test seam で、CLI / env / 設定から設定できない |

組み立て (`assemble`): 暫定の全文 layout は `text2 = redactedText` に、env が空でなければ改行 1 つと
`KEY=VALUE` 行を `\n` で結合して続ける。layout の最終形は S3 で決め、変えるときは oracle の golden も同時に改訂する。

データ連鎖 (oracle 012 が観測する): stage 1 の入力 = 生 text (入力と byte 同一)。stage 2 の入力 = 生 text。
stage 3 の入力 = 生 env。stage 4 の入力 = `assemble(stage 2 の出力, stage 3 の出力)`。stage 5 の入力 = stage 4 の入力と
byte 同一。報告出力 = stage 5 が受けた bytes。

## 4. 受入条件 (反証可能)

各項目の oracle は pair test-design の `CANDIDATE-*` で定義する。正規 ID 昇格と実装は後続 PR。

1. 位相 F1 (プレビュー前) の違反・検査失敗・例外が 1 件でもあれば、外部出力 channel (file / stdout / stderr / log / temp /
   例外文言 / 確認プレビュー sink / 報告出力 sink) への書き込みが 0。marker と件数も外部へ出ず、検出値が現れない。
   位相 F2 (プレビュー後) の例外では、throw されず、どの channel にも検査済み全文の部分列でない bytes が出ない。確認プレビュー
   sink は検査済み全文の先頭部分だけを持つ。報告先は不在か全文と byte 同一のどちらかで、途中まで書かれた状態にならない。
   戻り値の `release` / `staging` の報告は実状態と一致する。sink が一部を書いてから throw する場合、commit の後に throw する
   場合、discard が消す前に throw する場合も同じ。
2. 免除語 (dummy / example / fake 等) を含む行でも、報告経路では credential が検出される。既存の repo scan の挙動は不変。
3. 許可外 env key (`GH_*` / `GITHUB_*` と、値が無害な未知 key を含む) の値が出力に現れない。許可 key でも値に secret があれば fail-close。
4. Windows 形式と Linux 形式の path の全変種が出力に現れず、報告は成立する (placeholder へ置換されている)。
5. §3.5.2 の陽性 (違反) fixture は全て違反となり、陰性 (通過) fixture は全て通過する。project 名・remote URL は出力に現れない。
6. 確認プレビューの全文と報告出力が、独立に確定した期待 byte 列と一致する。位相 F1 ではプレビューも出力も 0、位相 F2 では §3.3 1b の (i)-(iii)。
   確認が成立しない (`yes` 以外・EOF) 場合は報告出力 0、非対話ではプレビューも出力も 0。確認迂回 option が存在しない。
7. **段別感度**: 各段 (入力検査 / path / env / 最終検査) を seam で個別に no-op 化すると、その段専用の fixture
   だけが Red になり、他の段専用の fixture は Green のまま。各段は 1 run につきちょうど 1 回、定義された順序と
   通過データで呼ばれる。
8. PII 規則を共有化しても pre-push hook の既存テストが Green のまま。

## 5. oracle の方針

- token は実在形式に合わせるが、**runtime 連結で生成**し、リポジトリ内に素書きしない (L7-260 の self-trigger 回避書式を踏襲)。
  fixture に免除語を入れない行と入れる行の両方を用意する。内部 host・IP も label と suffix・octet を runtime で連結して作る。
- 形式: GitHub token 系、`sk-` 系、AWS key、private key block、Bearer、`secret=` 代入、`GH_*` / `GITHUB_*` の env 値。
- 各段専用の fixture (その段だけが検出できる入力) と、段を隔離する seam で、段別感度を成立させる (pair test-design §4)。
  最終検査が入力検査と同じ secret を拒否する fixture は、入力検査の感度を測れないので、段の感度の oracle として使わない。
- 詳細は pair artifact `docs/test-design/harness/L7-report-write-security-test-design.md`。

## 6. PR 分割 (1 PR = 1 論点)

| PR | 内容 | 前提 |
|---|---|---|
| PR-0 (本 PR) | 本 PLAN + pair test-design (docs のみ) | なし |
| PR-1 | PII 規則と §3.5.2 の endpoint 検査の共有モジュール化 (移設 + 新規検査) + pre-push の回帰 Green | PR-0 の contract freeze |
| PR-2 | `analyzeSecretScan` の免除無効 option + `src/report/` の redaction (path / env allowlist) と最終検査と seam | PR-1 |
| PR-3 | 確認プレビューと非対話 fail-close、全 channel 無出力の oracle | PR-2 |
| PR-4 | security-audit 非著者 review の記録と PLAN confirm | PR-3 |

CLI surface (`ut-tdd report`) は含めない。

## 7. 順序

実装着手は **v0.2.0-canary.3 の公開と受入 (#676 / #418) の後**。本線には混ぜない。PR-0 (契約 freeze と review) は
受入作業と並行して進めてよい。docs のみで canary の検証対象を変えない。

## 8. スコープ外 (後続 slice)

- S2: 受付先の決定 (公開 repo に直接書かせない。private な受付先の選択)。PO の承認事項。
- S3: `ut-tdd report` コマンド、診断の束の内容と最終 layout、違反の診断を利用者へ表示する要否、issue フォーム。
- S4: 受付先から source repo の issue へ起こし直す triage 手順。

## 9. PO への未決事項

- S2 の受付先 (新規 private repo か既存の社内 repo か)。本 PLAN は決めない。
- 高影響境界 (PII / secret) に関わるため、S1 の実装着手前に本契約の PO 承認を得る。

## 10. 利用不能 reviewer の記録

Claude Opus は週次上限により 2026-10-04 16:00 JST まで利用できない。本 PLAN の著者は Claude Sonnet 5.5 で、
非著者 review は Codex gpt-6.1-sol を用いる。Opus 上限解除後も本 PLAN の判断ゲートは Codex 側で完結する。
上限で Opus を使えない状況は委譲・cross-review 構造の回避条件に当たるため、cross review は族分離を保った
Codex 側で行い、`intra_runtime_subagent` への降格は行わない。上限解除後の 2026-10-05 に Claude Opus (control lane) が
本文を検収し、§3.7 の 2 点を是正した。
