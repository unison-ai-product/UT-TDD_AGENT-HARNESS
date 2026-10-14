---
artifact_type: design_doc
layer: L6
status: draft
sub_doc: function-spec
plan: docs/plans/PLAN-L6-106-report-write-security-contract.md
pair_artifact: docs/test-design/harness/L7-report-write-security-test-design.md
---

# トラブル報告の書き込みセキュリティ契約 (Issue #815 slice S1)

状態: 未実装の目標契約。`src/report/` は存在せず、`analyzeSecretScan` に免除無効 option は無く、PII 規則は `scripts/git-hooks/secret-scan-diff.ts` に局在したまま (2026-10-14 時点)。実装は v0.2.0-canary.3 の公開と受入 (#676 / #418) の後に着手する。方式は実装 PR の中で発明せず、本契約の改訂へ戻る。

目的: 社内で Pack を使う利用者がハーネスのトラブルを報告するとき、**報告の束を出力する前に**、機密と社内情報が公開面へ漏れないことを保証する。S1 は書き込みセキュリティだけを扱う (PO 判断 2026-10-01: 書き込みセキュリティを先に通し、報告の仕組み本体は後続 slice)。`PLAN-L7-260-sensitive-scan-boundary` はリポジトリ内 artifact の credential 検査の正本で、本契約は実行時に利用者の入力・診断から作る束の出力前 gate であり対象面が異なる。scanner 本体 (PLAN-L6-62 / L7-260) の成果は再利用し複製しない。

## 1. 現行実装の baseline (origin/main 6b5effbc、2026-10-05 実測)

| 事実 | 根拠 |
|---|---|
| `analyzeSecretScan` は `SECRET_SCAN_PATTERNS` 6 種 (narrow-secret-token / aws-access-key / github-token / private-key-block / authorization-bearer / secret-assignment) を行単位で検査し、`ALLOW_LINE_MARKERS` (dummy / placeholder / redacted / example / fake / fixture / test-only 等) を含む行を無条件で免除する。自由文に `example` と書くだけで token が素通りする | `src/lint/secret-scan.ts` (宣言 38、使用 46) |
| `analyzeSecretScan` は artifact 配列だけを取り option を持たず、免除を切る手段が無い | `src/lint/secret-scan.ts:51` |
| 1 pattern につき最初の 1 行しか報告しない (`firstMatchLine`)。件数は「検出 pattern 数」 | `src/lint/secret-scan.ts:41-49` |
| PII (電話・郵便番号・email・internal URL) 検査は `scripts/git-hooks/secret-scan-diff.ts` の `PII_SCAN_PATTERNS` / `analyzePiiScan` に局在し `src/` から再利用できない。internal URL の現行規則は 2 つの非アンカー正規表現だけで、IP・userinfo・query・単一 label host・IPv6 は見ない | 同 file (132 / 150 行) |
| `runDistributionSecretScan` は distribution の copy / prune / tar の前に走り、違反で止める。出力前 gate の先例 | `src/cli/distribution.ts` (251、呼出し 625 / 948 / 1073) |
| 認証 env を `/AUTH\|TOKEN\|SECRET\|CREDENTIAL\|API_KEY/i` で探す方式は `GH_*` / `GITHUB_*` を拾えない (#809 指摘 3) | `gh issue view 809` |
| 報告先候補の Pack repo と source repo はどちらも PUBLIC。setup が置く issue template は consumer 自身の repo 向けでハーネスへの報告経路ではない | Issue #815、`src/setup/templates.ts:753-761` |

## 2. 設計判断

### 2.1 処理順序と fail-close

束 (`{ text, env }`) はメモリ内だけで組み立て、次の 5 段で処理する。確認プレビューの前 (位相 F1) に違反・検査失敗・例外があれば、あらゆる出力 channel への書き込みを 0 にする。プレビューの後 (位相 F2) の失敗は 2.3 の F2 に従う。

1. **stage 1 入力検査**: 生の `text` に credential scan (免除なし)・PII scan・内部 endpoint 検査 (2.5) を行う。伏せ字化の前に検査し、隠して見逃す事態を防ぐ。
2. **stage 2 path redaction**: ホーム・cwd・project root・project 名・remote URL を固定 placeholder へ置換する (2.5)。
3. **stage 3 env 処理**: key allowlist に載る key だけ残し、許可 key の値にも scan と path redaction を適用する。許可外の key は値を検査せず捨てる (束にも診断にも載らない)。
4. **stage 4 最終 leak 検査**: stage 2-3 の結果を組み立てた全文に対し、前段と独立に credential / PII / 内部 endpoint / path 残存 / 既知値残存を検査する。
5. **stage 5 利用者確認** (2.3) を経て初めて報告出力する。

却下: 伏せ字化後に scan するだけ (伏せ字化が壊した token を見逃し、原本の検査が消える)、違反箇所を伏せて継続出力 (検出漏れを公開へ持ち込み fail-close に反する)。

### 2.2 redaction 規則の SSoT と scanner の再利用

- credential の検出規則は `src/lint/secret-scan.ts` を唯一の正本とし複製しない。報告用に免除なしモードを追加する (`analyzeSecretScan` に option、既定は現挙動)。`ALLOW_LINE_MARKERS` を報告経路で無効にし、利用者入力の語で検査を免除させない。
- PII の正規表現は `scripts/git-hooks/secret-scan-diff.ts` から `src/lint/` 配下の共有モジュールへ移設し、pre-push と報告の両方が import する (複製ではなく移設。pre-push の挙動は変えない)。2.5 の内部 endpoint 検査も同じ共有モジュールに置くが、拡張規則は報告経路専用で pre-push の判定は現行のまま。
- 報告固有の変換 (path redaction、env allowlist、確認) は新規 `src/report/` に置く。
- 却下: `src/report/` への規則の丸ごと複製 (drift 源)、免除のまま利用 (実測した bypass を放置する)。

### 2.3 無出力の範囲と、確認プレビュー・報告出力の区別

用語: **外部出力 channel** = ファイル書き込み・stdout・stderr・log・一時ファイル・例外メッセージ・確認プレビュー用 sink・報告出力用 sink の全て (報告出力用 sink の staging と報告先への書き込みは報告出力用 sink の channel で、他のファイル書き込みの channel には数えない)。**確認プレビュー** = stage 1-4 を全て通過した全文を、利用者が確認するために対話端末へ表示すること。**報告出力** = 明示的な確認の後に、確定した全文を保存・送信用の sink へ渡すこと。観測時点は test-design の T0-T3 で定義する。

失敗は、確認プレビューを書き始める前か後かで 2 位相に分ける。位相 F1 = stage 1-4 の違反・検査失敗・例外と組み立て (`assemble`) の例外。位相 F2 = `previewSink` / `readLine` / `releaseSink` の例外 (sink が一部を書いてから throw する場合を含む)。

1. **F1**: 外部出力 channel の全てで 0 byte。確認プレビューも出さない。marker と件数を含む診断も外部へ出さない (marker = 検出の種別と件数 = 検出 pattern 数は関数の戻り値、プロセス内のみに保持し、検出値と周辺文字列は戻り値にも含めない。診断を利用者へ表示する経路は S3 の設計判断で、S1 では出さない)。例外は境界で捕捉して戻り値の失敗へ変換し throw しない。
2. **F2**: 例外は捕捉して失敗の戻り値に変え throw しない。保証するのは次の 3 点。
   - (i) **検査済みでない bytes を出さない**: どの channel にも、検査済み全文 (stage 4 の入力と byte 同一) の部分列でない bytes を書かない。確認プレビューに出るのは検査済み全文の先頭部分 (0 byte から全文まで) だけ。
   - (ii) **報告先は 2 状態のどちらか**: 「不在」か「確認済み全文と byte 同一」で、途中まで書かれた報告出力を作らない。`releaseSink` は staging と commit の 2 段を持つ。`write(bytes)` は報告先から見えない staging だけに書き、`commit()` は staging を報告先へ移す単一の原子的操作 (file なら同じ directory 内の rename、既存の報告先は上書きしない) で、その後に例外を出しうる処理を `commit` の中に置かない。`previewSink` / `readLine` が例外を出した場合と、確認が成立せず `commit` を呼ばない場合、報告先は不在。`previewSink` が例外を出したら `readLine` と `releaseSink.write` / `commit` を呼ばない (観測用の `readBack` / `discard` / `inspectStaging` は (iii) のとおり呼ぶ)。
   - (iii) **戻り値は観測した実状態を報告する**: `write` / `commit` / `previewSink` / `readLine` のどれかが例外を出したとき、成否を例外の有無から推定せず、次を途中で打ち切らず最後まで行う。(1) `releaseSink.readBack()` で報告先を観測し `release` に `absent` / `complete` (全文と byte 同一) を報告、`readBack` が例外なら `release: unknown`。(2) `readBack` の成否にかかわらず (finally) `releaseSink.discard()` を 1 回呼んで staging の消去を試み、例外は捕捉する。(3) `discard` の成否にかかわらず `inspectStaging()` で観測し `staging` に `none` / `residual` を報告、例外なら `staging: unknown`。`unknown` は観測そのものが失敗したときだけ使い、観測できたら実状態と一致しなければならない。`complete` / `unknown` でも戻り値は失敗のまま。
   - F2 の期待は「報告出力 0」ではなく (i)-(iii) である (commit の後の throw や discard の失敗を考えると「確定 0」は保証できない約束だった)。
3. **検査通過後に確認が成立しない場合** (`yes` 以外・空入力・EOF): プレビューは表示済みでよいが報告出力は 0 byte。表示済みの全文は検査済みの全文に限る。
4. **非対話実行** (TTY なし、確認入力なし): プレビューも報告出力も 0。
5. **確認成立** (`yes` を 1 行、行末の改行以外を含まない完全一致、大小区別あり): 報告出力はプレビューで表示した byte 列と同一でなければならない。表示後に再生成しない (時刻・乱数など実行ごとに変わる値を全文に含めない)。
6. `--yes` / `force` / env による確認の迂回経路を設けない。自動送信はしない。保存・送信の経路は S3 (`trouble-submission-command-intake.md`) で freeze する。
7. プレビュー全文と報告出力は UTF-8 (BOM なし) の同一 byte 列で、改行は入力のまま保存する。

却下: `--yes` による自動化 (確認の迂回経路)、違反でも marker と件数を stderr へ出す (診断が値の手掛かりになり得る。表示の要否は S3 で決定済み)、差分だけ表示 (確認が形骸化する)。

### 2.4 env の扱い

許可 key の allowlist 方式にする。初期の allowlist は診断に必要な最小集合 (OS / Node の版を示す key 等) で、確定は実装 PR の設計判断節で行う。許可 key の値にも secret / path / 内部 endpoint 検査を適用し違反なら fail-close する。名前の regex による除外判定は用いない (#809)。`GH_*` と `GITHUB_*` は allowlist に無いため除外されることを回帰 oracle に含める。許可外 key の値は stage 1 で検査しない (通常の認証 token が束に混ざるたびに全報告が失敗する事態を避ける。値の非漏洩は stage 4 が全文で保証する)。

### 2.5 path / URL / project 名の判定

#### 2.5.1 redaction と拒否の境界

| 対象 | 扱い | 理由 |
|---|---|---|
| 環境から既知の値 (実 home・cwd・project root・project 名・remote URL) | stage 2 で固定 placeholder へ置換 | 値が分かっているので完全一致で確実に置換できる |
| 一般形の path (Windows / POSIX の home 形式) | stage 2 で home 部分を `<HOME>` へ置換 | 既知値以外の利用者 path も落とす |
| 自由文の内部 endpoint (host / IP / userinfo / query の秘密) | 置換せず違反 (fail-close) | 範囲を予測できない値を部分置換すると取りこぼす |
| credential / PII | 置換せず違反 (fail-close) | 2.1 の却下理由 |

placeholder は固定文字列 `<HOME>` / `<CWD>` / `<PROJECT_ROOT>` / `<PROJECT>` / `<REMOTE>` で、最終検査は placeholder を漏れと判定しない。既知値の置換は長い値から先に、区切り (`\` / `/` / 混在)・drive letter の大小・UNC・末尾区切りの有無を区別せず、project 名は大小を区別せず全出現を置換する。remote URL が userinfo・秘密を含む query・内部 host (2.5.2) のいずれかに該当する場合は redaction 対象ではなく違反とする。

#### 2.5.2 内部 endpoint の判定基準

判定単位: (U) URL token (`<scheme>://` で始まり空白・引用符・括弧で終わる文字列)、(B) URL に入っていない dotted-quad の IPv4 (任意で `:port`)、(B6) URL に入っていない IPv6 literal (`[` `]` で囲まれた文字列、または空白・引用符・括弧・`,` `;` で区切られた token のうち `:` を 2 個以上含み Node `net.isIPv6()` が true を返すもの。末尾の `%zone` は除く。`[...]:port` 形を含む)。`net.isIPv6()` が false の token (`12:30:45`、`std::vector`、`a:b`) は IPv6 として扱わない。それ以外の bare な host 名は現行の PII 規則 (`internal` / `corp` を含む 2 規則、移設後も挙動不変) だけで判定する (広い suffix 集合を URL の外へ適用すると `settings.local.json` のような file 名を誤検知するため)。

**正規化 (判定の前に必ず行う)**

- N1: Unicode NFKC 正規化し、zero-width 文字 (U+200B-U+200D、U+2060、U+FEFF) を除く。
- N2: URL token は WHATWG `URL` で解析して host を得る (host の小文字化、IDN の punycode 化、host の percent-encoding 1 回分の復号、IPv4 の 10 進整数・8 進・16 進・短縮形の dotted-quad 化、IPv6 の標準形化)。WHATWG は末尾 dot を除去しないので、解析後に末尾 dot を 1 個除いてから判定する。`%25` を含む 2 重 percent-encoding は WHATWG が解析に失敗するので N3 で違反。(実測 Node `new URL(u).hostname`、2026-10-05: `http://Foo.Internal./` → `foo.internal.`、`http://0x7f.1/` → `127.0.0.1`、`http://exa%6dple.corp/` → `example.corp`、`http://ex%2561mple.com/` → 例外)
- N2b: WHATWG が host を正規化するのは special scheme (`http` / `https` / `ws` / `wss` / `ftp` / `file`) だけで、他 scheme では host を opaque のまま返す (`custom://0x7f.1/` → `0x7f.1`)。special scheme 以外の URL token は、authority から host (userinfo と port を除く) を取り出し `http://` + host + `/` として WHATWG で再解析した host で判定する。再解析に失敗したら N3 で違反。host が空の URL token (`custom:///x`) は R-U1 / R-U4 の対象外とし、R-U2 / R-U3 は通常どおり適用する。
- N3: 解析できない URL token は違反 (判定不能は拒否)。
- N4: 先頭 0 付き octet を持つ IPv4 は、10 進読みと 8 進読みの両方を判定しどちらかが内部なら違反 (bare IPv4 と URL token の生の authority の両方に適用)。WHATWG は先頭 0 を 8 進と読むため `http://010.0.0.1/` は `8.0.0.1` (公開) になり、10 進読みの `10.0.0.1` (内部) を見逃すからである。各 octet が 255 を超える、または 4 部でない数字列 (版番号 `2026.10.01.7` 等) は bare IPv4 として扱わない。

**規則 (いずれも違反)**

- R-U1 内部 host: 正規化後の host が次のいずれか。IPv4 が 0.0.0.0/8・10.0.0.0/8・100.64.0.0/10・127.0.0.0/8・169.254.0.0/16・172.16.0.0/12・192.168.0.0/16。IPv6 が `::`・`::1`・fc00::/7・fe80::/10、または IPv4-mapped (::ffff:0:0/96) で埋め込み IPv4 が上の範囲。host 名が `localhost` または `.localhost` で終わる。host 名に dot が無い単一 label (IP literal を除く)。最終 label が `internal` / `corp` / `local` / `localdomain` / `lan` / `intranet` / `private`、host 名が `home.arpa` に一致するか `.home.arpa` で終わる、または最終でない label に `corp` がある (現行規則の意味を保つ)。
- R-U2 userinfo: URL token の authority (`://` から最初の `/` `?` `#` まで) に `@` がある場合は host が公開でも違反。path や query 内の `@` は userinfo ではない。
- R-U3 query / fragment の秘密: query と `=` を含む fragment を `key=value` に分け、key と value を percent-decode (最大 2 回、`+` は空白) して (i) key (小文字、`-` を `_` に揃える) が許可外集合 K に含まれ value が空でない、または (ii) 復号後の `key=value` 全体が免除なしの credential scan に検出される (K に無い key の値に token を置く迂回を防ぐ)。K = token / access_token / id_token / refresh_token / api_key / apikey / key / secret / client_secret / password / passwd / pwd / auth / authorization / signature / sig / session / sessionid / code。
- R-U4 bare IPv4: (B) の IPv4 が R-U1 の範囲に該当する。
- R-U5 bare IPv6: (B6) の IPv6 が R-U1 の IPv6 範囲 (`::`、`::1`、fc00::/7、fe80::/10、内部 IPv4 を埋め込んだ IPv4-mapped) に該当する。公開 IPv6 の bare literal は通過する。

**通過 (違反としない)**: 公開 host 名・公開 IP (範囲の外。境界の直外 172.15.255.255 / 172.32.0.1 / 192.167.255.255 / 192.169.0.1 / 100.63.255.255 / 100.128.0.1 等を含む)・公開 IPv6、userinfo も K の key も秘密 value も持たない URL、`@` が path にあるだけの URL、URL に入っていない `*.local.*` 形の file 名。既知の偽陽性: 版番号が偶然 10.x.y.z の形をとると違反になるが、報告の fail-close を優先して受容する。

test-design の CANDIDATE-U-RPTSEC-009 は、上記の陽性 (違反) と陰性 (通過) の fixture 表を実行時に生成して期待値を固定する。

### 2.6 review

非著者の security-audit review を必須とする。判定項目は全 channel の無出力、免除の無効化、プレビューと出力の同一性、段別感度 (AC7)、内部 endpoint の陽性・陰性表 (2.5.2)。FLAG 後の軽作業の是正は author family が同 PR 内で行い、同じ非著者 reviewer が新 exact head を再検する (`CLAUDE.md` §FLAG 後の限定是正と merge)。

### 2.7 advisor 記録

旧 PLAN `PLAN-L6-816-report-security-class-contract` (PR #817 とともに close、main へ未 merge) の起草時 (2026-10-01) に `ut-tdd advisor --decision implementation` (gpt-6.1-sol) の回答を実測で照合し、無出力の範囲を全出力経路へ拡張・免除無効化を AC に昇格・表示と出力の同一・env を allowlist に限定し許可 key の値も検査・内部 URL の判定基準の明確化・最終 leak 検査の追加を採用した。実測した前提は免除と option 不在 (`src/lint/secret-scan.ts`)、PII 規則の局在 (`scripts/git-hooks/secret-scan-diff.ts`)、`firstMatchLine` が 1 pattern 1 行しか報告しない点。内部 endpoint の判定基準・プレビューと報告出力の区別・marker と件数も外部へ出さない点・段別感度の隔離 seam は旧 PLAN への非著者 FLAG 4 件の指摘をそのまま契約化した。

## 3. 関数仕様

関数名は契約上の名前で `src/lint/` と `src/report/` に置く。実装 PR は名前と挙動を変えない。

| 関数 | 入力 → 出力 | 副作用 | 不変条件 |
|---|---|---|---|
| `analyzeSecretScan(artifacts, options?)` (既存) | artifact 配列 + `{ honorAllowMarkers?: boolean }` (既定 true) → `SecretScanResult` | なし | option 省略時は現挙動と完全に同じ。報告経路は `false` を渡し、`ALLOW_LINE_MARKERS` の免除は一切効かない |
| `analyzePiiScan` / `inspectInternalEndpoints(text)` (共有モジュール) | text → `{ ok, markers }` | なし | PII 4 規則は移設前後で挙動不変。endpoint 検査は 2.5.2 の R-U1..R-U5 + N1..N4 (N2b 含む) だけを実装する |
| `inspectReportInput(text)` (stage 1) | 生の text → 判定 (`ok` / marker / 件数) | なし | 入力は伏せ字化前の bytes。変換しない。credential は免除なし |
| `redactPaths(text, ctx)` (stage 2) | text + 既知値 → 置換後 text | なし | 2.5.1 の置換だけ。置換後の text に既知値と home 形式 path が残らない |
| `filterEnv(env, allowlist, ctx)` (stage 3) | env + allowlist → 許可 key の `KEY=VALUE` 行 (key の ASCII 昇順) | なし | allowlist 外は値を読まず捨てる。許可 key の値は scan と `redactPaths` を通す |
| `finalLeakCheck(assembled, ctx)` (stage 4) | 組み立て後の全文 → 判定 | なし | stage 1 の関数を再利用してよいが stage 1 の結果を参照しない独立の呼出し。入力は確認・出力へ渡す bytes と同一 |
| `confirmAndRelease(bytes, io)` (stage 5) | 検査済み bytes + `{ interactive, previewSink, readLine, releaseSink: { write, commit, discard, readBack, inspectStaging } }` → 結果 (`release: absent \| complete \| unknown`、`staging: none \| residual \| unknown` を含む) | previewSink への書き込みと releaseSink の各操作だけ | 非対話なら何も書かない。`yes` 完全一致のときだけ releaseSink へ同じ bytes を write して commit する。commit は単一の原子的操作でその後に例外を出しうる処理を持たない。F2 の例外では 2.3 (iii) の手順を打ち切らず行い観測した状態を返す。迂回用の引数・env を読まない |
| `buildReport(input, io, stages?)` (orchestrator) | `{ text, env }` + io → `{ ok: true, bytes } \| { ok: false, code, markers, count }` | io の 2 sink のみ | 各 stage をちょうど 1 回、2.1 の順に呼ぶ。違反・例外で throw せず失敗の戻り値を返す。`stages` は検査を個別に隔離する test seam で、CLI / env / 設定から設定できない |

組み立て (`assemble`): 全文 layout は redact 済み text に、env が空でなければ改行 1 つと `KEY=VALUE` 行を `\n` で結合して続ける (`trouble-submission-command-intake.md` §4.2 が最終形として採用)。データ連鎖: stage 1 の入力 = 生 text、stage 2 の入力 = 生 text、stage 3 の入力 = 生 env、stage 4 の入力 = `assemble(stage 2 の出力, stage 3 の出力)`、stage 5 の入力 = stage 4 の入力と byte 同一、報告出力 = stage 5 が受けた bytes。

## 4. 受入条件 (反証可能)

各項目の oracle は test-design の `CANDIDATE-*` で定義する。正規 ID 昇格と実装は後続 PR。

1. F1 の違反・検査失敗・例外が 1 件でもあれば、外部出力 channel (file / stdout / stderr / log / temp / 例外文言 / プレビュー sink / 報告出力 sink) への書き込みが 0。marker と件数も外部へ出ず検出値が現れない。F2 の例外では throw されず、どの channel にも検査済み全文の部分列でない bytes が出ない。報告先は不在か全文と byte 同一のどちらか。戻り値の `release` / `staging` は観測成功なら実状態と一致し、観測失敗 (`readBack` / `inspectStaging` の例外) に限り `unknown`。discard は観測の成否にかかわらず 1 回試みる。sink が一部を書いてから throw する場合、commit の後に throw する場合、discard の前後に throw する場合、readBack / inspectStaging が throw する場合も同じ。
2. 免除語を含む行でも報告経路では credential が検出される。既存の repo scan の挙動は不変。
3. 許可外 env key (`GH_*` / `GITHUB_*` と値が無害な未知 key を含む) の値が出力に現れない。許可 key でも値に secret があれば fail-close。
4. Windows 形式と Linux 形式の path の全変種が出力に現れず、placeholder へ置換されて報告は成立する。
5. 2.5.2 の陽性 fixture は全て違反、陰性 fixture は全て通過する。project 名・remote URL は出力に現れない。
6. プレビュー全文と報告出力が独立に確定した期待 byte 列と一致する。F1 ではプレビューも出力も 0、F2 では 2.3 の (i)-(iii)。確認が成立しない場合は報告出力 0、非対話ではプレビューも出力も 0。確認迂回 option が存在しない。
7. **段別感度**: 各段 (入力検査 / path / env / 最終検査) を seam で個別に no-op 化すると、その段専用の fixture だけが Red になり他の段の fixture は Green のまま。各段は 1 run につきちょうど 1 回、定義された順序と通過データで呼ばれる。
8. PII 規則を共有化しても pre-push hook の既存テストが Green のまま。

## 5. oracle の方針

token は実在形式に合わせるが runtime 連結で生成し、リポジトリ内に素書きしない (L7-260 の self-trigger 回避書式を踏襲)。免除語を入れない行と入れる行の両方を用意し、内部 host・IP も label と suffix・octet を runtime で連結して作る。形式は GitHub token 系・`sk-` 系・AWS key・private key block・Bearer・`secret=` 代入・`GH_*` / `GITHUB_*` の env 値。各段専用の fixture (その段だけが検出できる入力) と段を隔離する seam で段別感度を成立させる。最終検査が入力検査と同じ secret を拒否する fixture は入力検査の感度を測れないので段の感度の oracle に使わない。詳細は `docs/test-design/harness/L7-report-write-security-test-design.md`。

## 6. 実装の順序と責務どうしの依存

実装着手は v0.2.0-canary.3 の公開と受入 (#676 / #418) の後。1 PR = 1 論点で、依存する責務の成果が閉じてから下流へ進む。

| PR | 内容 | 依存 |
|---|---|---|
| PR-1 | PII 規則と 2.5.2 の endpoint 検査の共有モジュール化 (移設 + 新規検査) + pre-push の回帰 Green | 本契約の freeze |
| PR-2 | `analyzeSecretScan` の免除無効 option + `src/report/` の redaction (path / env allowlist) と最終検査と seam | PR-1 (共有検査を stage 1・4 が使う) |
| PR-3 | 確認プレビューと非対話 fail-close、全 channel 無出力の oracle | PR-2 (検査済み全文を確認へ渡す) |
| PR-4 | security-audit 非著者 review の記録と confirm | PR-3 |

CLI surface (`ut-tdd report`) は含めない (`trouble-submission-command-intake.md` が持つ。S3 は本契約の `buildReport` をちょうど 1 回呼ぶ側であり、S1 の実装 (PR-2 / PR-3) に依存する)。

## 7. 範囲外 (後続 slice) と PO 未決事項

- S2 (受付先): PO 判断 2026-10-05 で「本 source repo の issue」と決定済み。`trouble-submission-command-intake.md` が持つ。旧 PLAN にあった「公開 repo に直接書かせない。private な受付先」は、この PO 判断で上書きされた。
- S3: `ut-tdd report` コマンド、診断の束の内容と最終 layout、違反の診断の表示、issue フォーム。同上。
- S4: 受付先から source repo の issue へ起こし直す triage 手順。
- 高影響境界 (PII / secret) に関わるため、S1 の実装着手前に本契約の PO 承認を得る。
