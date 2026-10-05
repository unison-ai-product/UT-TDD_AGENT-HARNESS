---
title: "L7 report write security test design"
artifact_type: test_design
layer: L6
executed_at_layer: L7
status: draft
pair_artifact: docs/plans/PLAN-L6-106-report-write-security-contract.md
parent_doc: docs/design/harness/L6-function-design/secret.md
created: 2026-10-01
updated: 2026-10-01
---

# PLAN-L6-106 トラブル報告の書き込みセキュリティ — L7 test design

## 1. 位置付け

`PLAN-L6-106-report-write-security-contract` の pair artifact。S1 の受入条件 (PLAN §4) を検証する候補 oracle を宣言する。
この pair-freeze では候補のみを宣言し、production source と test code は追加しない。正規 ID への昇格は実装 PR で行う。
`PLAN-L7-260` の scanner 契約 (既存の `tests/secret-scan.test.ts`) は再定義せず、Green 維持のみを要求する。

PLAN-L6-816 (クローズした PR #817) の候補 oracle 001-015 から、次を改訂した (非著者 reviewer の FLAG 4 件の是正)。

- 内部 endpoint の陽性・陰性期待値を §3.3 で固定した (009)。
- 無出力の観測時点と対象を §3.1-3.2 で定義し、確認プレビューと報告出力を分けた (002 / 011 / 015)。
- 段別感度を成立させるため、段を隔離する seam・段専用 fixture (016-019)・mutation 行列 (013)・
  呼出し順序とデータ連鎖 (012) を加え、010 を確定 byte 列との比較にした (§4)。

PR #820 の Sol r1 FLAG 3 件に対し、PLAN rev 2 と合わせて次を改訂した。

- 失敗をプレビュー前 (F1) とプレビュー後 (F2) に分け、F2 の期待値と、sink が一部を書いてから throw する fixture を加えた (§3.2、015)。
- 非 special scheme の URL host (N2b) と URL 外の bare IPv6 (R-U5)、`home.arpa` 自体の陽性・陰性を加えた (§3.3、009)。

## 2. fixture 規約

- token は runtime 連結で生成し、リポジトリに素書きしない。形式ごとに「免除語なし行」と「免除語あり行」を用意する。
- 内部 host は label と suffix を、IP は octet を、runtime で連結して作る。home / cwd / project root / project 名 /
  remote は temp fixture 内で生成した実値を使い、実ユーザーの値を使わない。
- 時刻・乱数を全文に含めない (010 の golden を安定させるため、clock が要る場合は固定値を注入する)。
- 各段の隔離は production source の書き換えではなく、`buildReport` の `stages` seam (PLAN §3.8) に
  「呼ばれた事実を記録して入力をそのまま通す (pass-through)」no-op を差す方式にする。mutant は
  どの seam key を差し替えたかを記録する (重複した出現が mutant を吸収する事態を、012 の呼出し回数 = 1 で防ぐ)。

## 3. 観測の定義

### 3.1 外部出力 channel と観測時点

| channel | 観測方法 |
|---|---|
| C-file | fs 書き込みの spy と、temp directory の差分 (一時ファイル含む) |
| C-stdout / C-stderr | `process.stdout.write` / `process.stderr.write` の spy |
| C-log | `console.*` と logger の spy |
| C-exc | 呼出し元へ伝わった例外の message / stack の捕捉 (期待は「throw されない」) |
| C-preview | 注入した `previewSink` の受け取った bytes (全 chunk の連結) |
| C-release | 注入した `releaseSink` で **commit 済み** の bytes。staging (write 済み・commit 前) は別に記録し、T3 で残っていないことを観測する |

観測時点: **T1** = stage 4 の判定が出た直後 (確認プレビュー前)。**T2** = 確認の入力を読み終えた直後。
**T3** = `buildReport` が戻った後。共有のイベントログ (`stage1..stage4 / preview / readLine / release`) へ全イベントを
時系列で記録する。

### 3.2 シナリオ別の期待値 (oracle 011 / 002 / 015 が共有)

| シナリオ | T1 | T2 | T3 の C-preview | T3 の C-release | C-file / stdout / stderr / log / exc |
|---|---|---|---|---|---|
| V: 検査 (stage 1-4) で違反 | 全 channel 0 | 全 channel 0 | 0 | 0 | 0 |
| X: stage 1-4・scanner・assemble の例外 (位相 F1) | 全 channel 0 | 全 channel 0 | 0 | 0 | 0、throw されない |
| XF2: previewSink / readLine / releaseSink の例外 (位相 F2、一部書き込み後の throw を含む) | 全 channel 0 | — | 検査済み全文の先頭部分 (0 byte から全文まで) | commit 済み 0、staging 残存 0 | 0、throw されない |
| D: 通過、確認が `yes` 以外 | 全 channel 0 | C-preview に確定全文のみ | 確定全文 (確認プレビューは許可) | 0 | 0 |
| NI: 通過、非対話 | 全 channel 0 | 全 channel 0 | 0 | 0 | 0 |
| OK: 通過、`yes` | 全 channel 0 | C-preview に確定全文 | 確定全文 | 確定全文と同一 bytes | 0 |

- XF2 の fixture: (a) previewSink が全文の半分を書いて throw、(b) readLine が throw、(c) releaseSink.write が全文の半分を
  staging に書いて throw、(d) releaseSink.commit が throw、(e) (c) に加えて releaseSink.discard も throw。期待は全て、
  C-preview が検査済み全文の先頭部分に限られる、commit 済み C-release が 0、(c)-(d) で `discard` が 1 回呼ばれ staging が
  残らない、(a) では readLine / release が呼ばれない、throw されず失敗の戻り値になること。
- D の「`yes` 以外」: 空入力、EOF、`no`、`y`、`YES`、`yes ` (後置空白)、` yes` (前置空白)、`yes` に続く文字を
  含む入力。OK は `yes\n` と `yes\r\n` の両方。
- イベント順序の期待: V では `stage1..` の途中で止まり `preview` / `readLine` / `release` が 1 件も無い。
  D / OK では `stage1, stage2, stage3, stage4, preview, readLine` の順で、OK だけ末尾に `release`。
- marker と件数を含む診断は、V / X の全 channel に出ない。marker と件数は戻り値 (プロセス内) にだけ存在する。

### 3.3 内部 endpoint の陽性・陰性表 (oracle 009 が固定する期待値)

陽性 = 違反として拒否 (`ok: false`、全 channel 0)。陰性 = 通過 (他に違反が無ければ `ok: true`、URL は出力に
そのまま残る)。全ての fixture は runtime に連結して生成する。

**陽性 (P)**

| ID | 内容 | 判定規則 |
|---|---|---|
| P1 | `http://` / `https://` + label + R-U1 suffix 集合の各要素 (internal / corp / local / localdomain / lan / intranet / private) | R-U1 |
| P2 | `home.arpa` そのものの host、`.home.arpa` で終わる host、最終でない label が `corp` の host | R-U1 |
| P3 | IPv4 の境界内側: 10.0.0.1、10.255.255.254、172.16.0.1、172.31.255.254、192.168.0.1、192.168.255.254、127.0.0.1、127.255.255.254、169.254.0.1、100.64.0.1、100.127.255.254、0.1.2.3 | R-U1 |
| P4 | loopback の別表記を URL で: 10 進整数、16 進 (`0x7f.0.0.1`)、短縮形 (`127.1`)。加えて URL host の先頭 0 付き octet で、WHATWG の 8 進読みは公開 (`010.0.0.1` → `8.0.0.1`) だが 10 進読みが内部になるもの | N2 + N4 + R-U1 |
| P5 | IPv6: `[::1]`、`[::]`、fc00::/7 内、fe80::/10 内、`[::ffff:` + 内部 IPv4 + `]` | R-U1 |
| P6 | host が `localhost`、`.localhost` 配下、単一 label (dot 無し) | R-U1 |
| P7 | 大小混在、末尾 dot (WHATWG は除去しないため N2 の自前除去が要る)、zero-width 文字の混入、全角文字による host の偽装 | N1 + N2 + R-U1 |
| P8 | host の percent-encoding (1 回と 2 回) で内部 host を隠したもの | N2 + R-U1 |
| P9 | 公開 host + userinfo (`user:pw@` と `user@` の 2 形) | R-U2 |
| P10 | query の key が K に含まれ value が非空 (token / api_key / password 等)。key 自体の percent-encoding と大小混在を含む | R-U3 (i) |
| P11 | fragment が `access_token=...` 形 | R-U3 (i) |
| P12 | K に無い key (`x` 等) の value に runtime 生成した token 形式 | R-U3 (ii) |
| P13 | value が二重 percent-encoding の token | R-U3 + 復号 2 回 |
| P14 | URL に入っていない dotted-quad の内部 IPv4 (`:port` 付きを含む)、先頭 0 付き octet で 10 進読みが内部になるもの | R-U4 + N4 |
| P15 | 解析できない URL token (閉じていない IPv6 括弧など) | N3 |
| P16 | 非 special scheme (`custom://`、`ssh://`、`git://` 等) の host に、10 進整数・16 進 (`0x7f.1`)・短縮形の loopback、先頭 0 付き octet、percent-encoding した内部 host、`.internal` suffix | N2b + N4 + R-U1 |
| P17 | URL に入っていない bare IPv6: `::1`、`::`、fc00::/7 内、fe80::/10 内 (`%zone` 付きを含む)、`[::1]:8080` 形、内部 IPv4 を埋め込んだ IPv4-mapped | R-U5 |

**陰性 (N)**

| ID | 内容 | 期待 |
|---|---|---|
| N1 | 公開 host の URL (issue / repo 形の path) | 通過、URL は不変 |
| N2 | IPv4 の境界外側: 9.255.255.255、11.0.0.1、100.63.255.255、100.128.0.1、126.255.255.255、128.0.0.1、172.15.255.255、172.32.0.1、192.167.255.255、192.169.0.1、169.253.255.255、169.255.0.1、公開 DNS 形の公開 IP | 通過 |
| N3 | 公開 IPv6 | 通過 |
| N4 | `@` が path にだけある URL (scoped package 形) | 通過 (userinfo ではない) |
| N5 | query が K に無い key で無害 (`page` / `sort` / `ref` / `q`)。K の key でも value が空 | 通過 |
| N6 | URL に入っていない file 名 (`settings.local.json` や `CLAUDE.local.md` 形) | 通過 (suffix 集合を URL の外へ適用しない) |
| N7 | 版番号 (`2026.10.01.7` 形、3 部の `1.2.3`、公開 IP 形の `1.2.3.4`) | 通過 |
| N9 | IPv6 に見えるが `net.isIPv6()` が false の token (`12:30:45` の時刻、`std::vector` 形、`a:b` 形)、URL に入っていない公開 IPv6、host の無い非 special scheme URL (`custom:///x`) | 通過 |
| N10 | `home.arpa` を含むが host ではないもの (`notes-home.arpa.md` 形の file 名、URL に入っていない語) | 通過 (suffix 集合を URL の外へ適用しない) |
| N8 | 既知の偽陽性: 版番号が内部 IPv4 範囲に入る形 (`10.1.2.3`) | **違反** (受容した偽陽性として固定、PLAN §3.5.2) |

oracle 009 は、共有モジュールの `inspectInternalEndpoints` を表の全行で直接呼ぶ検査と、同じ入力を
`buildReport` へ通す検査 (P は全 channel 0、N は URL が出力に残る) の 2 本を含む。

## 4. 段別感度の設計

### 4.1 隔離 seam と段専用 fixture

`buildReport(input, io, stages?)` の `stages` は、stage 1-4 の各関数を差し替える test seam である (PLAN §3.8)。
差し替えは「呼出しを記録し、入力を通す」no-op を差す。production の CLI / env / 設定からは設定できない。

各段が**単独で**検出できる入力 (段専用 fixture) を定義する。他の段が同じ入力を検出できる fixture は、
その段の感度を測れないので、段別感度の oracle として使わない。

| ID | 段 | fixture | 他の段が検出できない理由 |
|---|---|---|---|
| 016 | stage 1 | 既知値 (home または project 名) を runtime 生成の token 形式にし、text にその既知値を含める | stage 2 が既知値を placeholder へ置換するため、stage 4 は token を見ない。生の入力を見る stage 1 だけが検出できる |
| 017 | stage 2 | 無害な text に生成した home 配下の path 変種を含める (secret・PII なし)。期待は `ok: true` と placeholder 置換後の全文 | stage 1 は無害として通す。stage 2 が無いと stage 4 が path 残存を拒否して `ok: false` になり、期待 (`ok: true`) と食い違う |
| 018 | stage 3 | env に (a) 許可 key の無害な値、(b) 無害な名前・無害な値の未知 key、(c) `GH_*` 形の key + token 形式の値 を入れる。期待は `ok: true`、全文に (a) の行だけ | stage 1 は env を見ない。stage 3 が無いと (b) は stage 4 でも検出できず全文に出る、(c) は stage 4 が拒否して `ok: false` になる |
| 019a | stage 4 | stage 2 を「全文末尾に runtime 生成の token 形式を追記する故障 double」にした run。期待は `ok: false`、全 channel 0 | 生の入力は無害なので stage 1 は通す。変換後の全文を見る stage 4 だけが検出できる |
| 019b | stage 4 | stage 3 を「許可外 key の値を保持する故障 double」にし、値に内部 IPv4 を置いた run。期待は `ok: false` | 同上 (stage 1 は env を見ない) |

### 4.2 呼出し順序・回数・データ連鎖 (CANDIDATE-U-RPTSEC-012)

spy 付きの各段で次を観測する。1 つでも外れたら Red。

- 各段 (stage 1-4) は 1 run につき**ちょうど 1 回**呼ばれる。重複した呼出し site が mutant を吸収しない。
- 順序は `stage1 → stage2 → stage3 → stage4 → preview → readLine → release`。V では検出した段以降と
  `preview` 以降を呼ばない (stage 1 が違反なら stage 2-4 は呼ばれなくてよい。呼ばれた場合も出力は 0)。
- stage 1 の引数 = 生 text と byte 同一 (伏せ字化前)。stage 2 の引数 = 生 text。stage 3 の引数 = 生 env。
- stage 4 の引数 = test が独立に計算した `assemble(stage 2 の出力, stage 3 の出力)` と byte 同一で、
  stage 1 の判定結果を引数に含まない (stage 1 の結果を使い回さない独立の呼出し)。
- `preview` の bytes = stage 4 の引数と byte 同一。`release` の bytes = `preview` の bytes と byte 同一。

### 4.3 mutation 行列 (CANDIDATE-U-RPTSEC-013)

各段を seam で no-op 化して全 oracle を回し、次の対応になることを検証する。「Red」は期待どおり失敗すること、
「Green」は他の段専用 fixture に影響しないことである。

| 隔離した段 | Red になるべき | Green のまま |
|---|---|---|
| なし (基準) | なし | 全て |
| stage 1 | 016 | 017, 018, 019a, 019b |
| stage 2 | 017 (と 008) | 016, 018, 019b (019a は stage 2 を差し替え済みなので対象外) |
| stage 3 | 018 (と 005, 007) | 016, 017, 019a (019b は stage 3 を差し替え済みなので対象外) |
| stage 4 | 019a, 019b | 016, 017, 018 |

001 / 003 / 006 は credential を複数段で検出するので、どの 1 段を外しても Green のままである (多段防御であり、
段の感度の oracle ではない。段の感度は 016-019 が担う)。この Green を「感度不足」と誤診して 001 などを段専用に
改造してはならない。

### 4.4 010 の byte 比較 (CANDIDATE-U-RPTSEC-010)

test は、入力の既知値・path 変種・許可 env から**独立に**期待 byte 列を組み立てる (production の関数を使わず、
固定の template と placeholder を直接連結する)。C-preview の全 chunk の連結と C-release を、それぞれ期待 byte 列と
`Buffer.equals` で比較する。表示 = 出力だけを見る比較にはしない。次の mutant を Red にする。

- M-summary: 出力が、表示と同じ長さ・同じ見出しの別内容 (要約) に置き換わる。
- M-regen: プレビュー後に全文を再生成して出力する (改行コード・末尾改行・BOM・順序の差)。
- M-trunc: 出力が表示の接頭辞だけ。
- 入力に CRLF を含む fixture で、改行が入力のまま保存され、BOM が付かないこと。

## 5. 候補 oracle

| ID | 対象 AC | 内容 | Red の条件 |
|---|---|---|---|
| CANDIDATE-U-RPTSEC-001 | 1 | 各 credential 形式 (GitHub 系 / `sk-` / AWS / private key / Bearer / `secret=`) の e2e で fail-close し、§3.2 の V の行 (全 channel 0、プレビューも 0) になる。段単独の感度は主張しない | 1 経路でも書き込みがある |
| CANDIDATE-U-RPTSEC-002 | 1 | 違反・例外で marker と件数を含む診断が**外部 channel に 0** であり、戻り値には marker 種別と件数のみがあり、検出値・周辺文字列は含まれない (戻り値の JSON に生成 token も該当行も無い) | 外部に診断が出る、または戻り値に値・周辺文字列がある |
| CANDIDATE-U-RPTSEC-003 | 2 | 免除語を含む行でも報告経路は credential を検出する (option `honorAllowMarkers: false` の直接呼出しと e2e) | 免除語で素通りする |
| CANDIDATE-U-RPTSEC-004 | 2 | option 省略時の `analyzeSecretScan` は免除語の挙動が不変 (`tests/secret-scan.test.ts` Green と、免除語行で違反 0 の同値確認) | 既存挙動が変わる |
| CANDIDATE-U-RPTSEC-005 | 3 | 許可外 env key (`GH_*` / `GITHUB_*` / 未知 key) の値が出力に出ず、報告は成立する (`ok: true`) | 値が現れる、または fail-close で報告が成立しない |
| CANDIDATE-U-RPTSEC-006 | 3 | 許可 key の値に secret があれば fail-close (全 channel 0) | 素通りする |
| CANDIDATE-U-RPTSEC-007 | 3 | name regex ではなく allowlist であること。認証らしくない名前と無害な値の未知 key も除外され、認証らしい名前でも allowlist 内なら残る (値検査は通過する場合) | 未知 key が通る |
| CANDIDATE-U-RPTSEC-008 | 4 | path matrix (`\` / `/` / 混在、drive letter 大小、UNC、`/home`、`/Users`、`~`、実 cwd、project root、project 名、remote) が出力に出ず、`ok: true` で placeholder に置換されている | 1 変種でも残る、または報告が成立しない |
| CANDIDATE-U-RPTSEC-009 | 5 | §3.3 の陽性・陰性表を、共有モジュールの直接呼出しと `buildReport` の e2e の両方で固定する | 陽性が通る、陰性が拒否される (N8 は拒否が期待) |
| CANDIDATE-U-RPTSEC-010 | 6 | §4.4。確定した期待 byte 列との `Buffer.equals` で、C-preview と C-release の両方が一致する | 差がある、M-summary / M-regen / M-trunc のいずれかが Green |
| CANDIDATE-U-RPTSEC-011 | 6 | §3.2 の V / D / NI / OK の全シナリオで、観測時点 T1-T3 の各 channel が期待どおり。確認迂回 (`yes` / `confirm` / `force` 相当の引数、env) を渡しても無効で、option 面に迂回項目が存在しない | プレビューや出力が期待と違う、または迂回が効く |
| CANDIDATE-U-RPTSEC-012 | 7 | §4.2。各段ちょうど 1 回、順序、通過データの byte 同一、stage 4 が stage 1 の結果を使わない | 回数・順序・データのいずれかが外れる |
| CANDIDATE-U-RPTSEC-013 | 7 | §4.3 の mutation 行列。各段を seam で隔離したとき、専用 fixture だけが Red になり、記録した seam key と一致する | 外しても専用 fixture が Green、または他段の fixture が Red |
| CANDIDATE-U-RPTSEC-014 | 8 | PII 規則を共有モジュールへ移した後も `tests/secret-scan-diff.test.ts` (bare remote 経由 e2e) が Green。endpoint 拡張規則が pre-push の判定を変えない | pre-push の挙動が変わる |
| CANDIDATE-U-RPTSEC-015 | 1 | stage 1-4 の各 scanner と assemble で例外を注入すると §3.2 の X の行になる。previewSink・readLine・releaseSink (write / commit / discard、一部書き込み後の throw を含む) で例外を注入すると §3.2 の XF2 の行になる。どちらも throw されず、commit 済みの報告出力 0、staging 残存 0、marker・件数も外部 0 | 例外時に報告出力が commit される、staging が残る、検査済み全文以外の bytes がプレビューに出る、または throw が漏れる |
| CANDIDATE-U-RPTSEC-016 | 7 | stage 1 専用 fixture (§4.1) | stage 1 を隔離して Green のまま |
| CANDIDATE-U-RPTSEC-017 | 7 | stage 2 専用 fixture (§4.1) | stage 2 を隔離して Green のまま |
| CANDIDATE-U-RPTSEC-018 | 7 | stage 3 専用 fixture (§4.1) | stage 3 を隔離して Green のまま |
| CANDIDATE-U-RPTSEC-019 | 7 | stage 4 専用 fixture 019a / 019b (§4.1) | stage 4 を隔離して Green のまま |

## 6. 実測コマンド (昇格時)

`node src/cli.ts plan lint docs/plans/PLAN-L6-106-report-write-security-contract.md`。実装 PR では対象 test file を
`node scripts/run-vitest-snapshot.ts <test file>` で個別実行し、doctor は singleton のため CI の結果を参照する。

## 7. 継承 fence

`PLAN-L7-260` の secret-scan / distribution preflight / pre-push の既存テストは Green のまま。本 artifact はそれらを再定義しない。
