---
title: "L7 privacy scan test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/privacy-scan.md
status: confirmed
updated: 2026-10-26
issue: 1391
---

# 個人情報と私有の名前の検査 (privacy scan) テスト設計 (issue #1391)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/privacy-scan.md` である (未実装の目標契約)。
本書はその §2 検査の種類と対象、§3 email と除外、§4 denylist、§5 secret が無いときの扱い、§6 baseline、§7 判定規則と finding、§8 出力の形、§10 関数、§11 配線、§12 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引行を足さない。本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-PRIVSCAN-*`) だけを宣言する。正式化は設計書保護 gate §10.3 の三段階 (L6 §11) で行う。

## 2. fixture

- **テストのソースに当たりを書かない**: 本検査の `tree` は `tests/` も走査する。除外に当たらない email と denylist の語は、テストの中で実行時に連結して作る (例: ローカル部、`"@"`、ドメインを別々の文字列リテラルにして `+` で繋ぐ)。ソースの 1 行が §3 の email の形に一致しないようにする。ドメインは実在しうる形 (`.jp` など) を使うが、実在の人や組織のアドレスを使わない。
- **denylist は合成の値だけを使う**: `example-private-repo`、`Alice Example` のような、実在しない語の正規表現を `env` の object として関数に渡す。本物の `PRIVACY_DENYLIST` を読むテストを書かない。process の環境変数を書き換えない。
- 純粋関数の行は、`PrivacyUnit` の列・denylist・baseline・比較元を直接渡して作る。実 repo のファイルは読まない (015 と 016 を除く)。
- 013 は temp directory に実 git repository を作り、木・commit ごとの追加行・commit のメタ・比較元の取得だけを確かめる。014 は distribution の command を temp の source と出力先で動かす。
- 1 つの行は規則を 1 本だけ殺すように、入力の書き方を 1 つだけ変える。
- 015 と 016 は実 repo を読むので、`test-repository-isolation` の登録が要る (L6 §11)。

## 3. oracle 宣言の一覧

以下で `<P>` は「除外に当たらない email を実行時に連結して作った値」(例: ローカル部 `alice`、ドメイン `mail-provider.jp`)、`<D>` は合成の denylist の語 `example-private-repo` を指す。

| ID | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-PRIVSCAN-001` | `findEmailHitLines` に `tree` の単位として、(a) 1 行目が空、2 行目に `<P>`、3 行目に `<P>` を 2 個、(b) CRLF の 3 行の 3 行目に `<P>`、(c) `<P>` の前後に英数字が続く形 (`x<P>` の前に `.` や英字が付く、ドメインの後に `-` が続く)、(d) `@types/node`、`react@18.3.1`、`@` だけの行 | (a) `[2, 3]` (同じ行の複数は 1 件)、(b) `[3]`、(c) 語の途中からは拾わない (前後に区切り文字があるときだけ拾う)、(d) `[]` | 行番号を 0 始まりにする / 同じ行を 2 件にする / CRLF で行を取り違える / 語の途中から拾う / ローカル部の無い形を拾う |
| `CANDIDATE-U-PRIVSCAN-002` | `findEmailHitLines` に除外の境界を渡す。(a) `alice@example.com`、`bob@mail.example.org`、`c@example.net`、`d@host.test`、`e@host.invalid`、`f@host.localhost`、(b) `noreply@anthropic.com`、`NoReply@github.com`、`no-reply@service.jp` (ローカル部が除外の語)、`12345+alice@users.noreply.github.com`、(c) `git@github.com:example-org/private-repo.git`、(d) `Co-Authored-By: Claude <noreply@anthropic.com>`、(e) 実行時に連結して作る、ローカル部 `x` とドメイン `example.com.evil.jp` の組、ローカル部 `x` とドメイン `notexample.com` の組、ローカル部 `noreplyx` とドメイン `service.jp` の組、ローカル部 `git` とドメイン `github.com` の組の直後が `:` でない形、`Co-Authored-By: X <` + `<P>` + `>`、(f) path `package-lock.json` と `sub/package-lock.json` の内容に `<P>`、(g) 同じ行に `example` と `dummy` の語と `<P>` | (a)〜(d) `[]`。(e) 各行が当たる。(f) email は `[]`。(g) 当たる (行の語で許さない) | 予約ドメインを部分一致で除外する / noreply を部分一致にする / SSH の形を `git@` だけで除外する / trailer を一律に除外する / `package-lock.json` を root だけで判定する / 行の許可語を使う |
| `CANDIDATE-U-PRIVSCAN-003` | `parsePrivacyDenylist` に、(a) `undefined`、(b) `""`、(c) 空白と改行だけ、(d) `#` で始まる行だけ、(e) CRLF で `# c`、空行、`<D>`、`Alice\\s+Example` の 4 行、(f) 3 行目だけが `(` (compile できない) で他は有効、(g) 2 行目と 4 行目が compile できない | (a)〜(d) `absent`。(e) `provided` で entry は 2 個、flag は `iu`。(f) `invalid` で `entryLines` は `[3]`。(g) `[2, 4]`。どの場合も、関数の戻り値と投げる例外のメッセージに entry の文字列が入らない | 空を `provided` にする / コメント行を entry にする / 1 個の失敗で残りを黙って使う / 大文字小文字を区別する / 例外のメッセージをそのまま返す |
| `CANDIDATE-U-PRIVSCAN-004` | `analyzePrivacyScan` (mode `tree`、baseline 空、denylist `provided` で `<D>`) に、(a) 内容の 5 行目に `<D>` を大文字にした語、(b) path が `docs/<D>-notes.md` で内容は無害、(c) `package-lock.json` の 2 行目に `<D>`、(d) 内容の 1 行目に `12345+<D>@users.noreply.github.com`、(e) 同じ行に `<D>` が 2 回 | (a) `privacy-denylist-hit` (line 5)。(b) `privacy-denylist-hit` (line 0、`location` は `path-sha256:` の形)。(c) `privacy-denylist-hit` (line 2。E4 は email にしか効かない)。(d) `privacy-denylist-hit` (line 1) で `privacy-email-hit` は無い。(e) 1 件 | path を検査しない / email の除外を denylist にも効かせる / 大文字小文字を区別する / 1 行に複数件を出す |
| `CANDIDATE-U-PRIVSCAN-005` | 001〜004 と 007・008 の当たりを全て含む入力を `analyzePrivacyScan` に渡し、`privacyScanMessages` で文字列にする。denylist には `<D>` と、compile できない entry を含む別の入力も使う | どの出力行にも、denylist の entry の文字列、一致した部分文字列、当たりの行の内容が含まれない。path に当たりを含むファイルは、そのファイルの全ての finding が `path-sha256:<64 桁の 16 進>` で出て平文の path が出ない。sha256 は path の UTF-8 の値と一致する。各行は `<location>:<line>:<kind>[:<reason>]` の形で、末尾の行は `privacy-scan mode=` `checked=` `skipped=` `email=` `denylist=` `stale=` `baselined=` `baseline=` を持つ | 一致した文字列を出す / 行の内容を出す / 内容の当たりだけ平文の path で出す / compile の例外のメッセージを出す |
| `CANDIDATE-U-PRIVSCAN-006` | `<P>` を 1 件含む `tree` の入力で denylist を変える。(a) `absent` で `requireDenylist=false`、(b) `absent` で true、(c) `""` から解釈した `absent` で true、(d) `invalid` で false、(e) `provided` で true、(f) 当たりの無い入力で (a) | (a) `privacy-email-hit` 1 件だけで `ok=false`、末尾は `denylist=unavailable`。(b)(c) それに加えて `privacy-denylist-unavailable` (`location` は `denylist`、line 0)。(d) `privacy-denylist-invalid` で `ok=false`。(e) email の 1 件だけ。(f) `ok=true` で `denylist=unavailable` | 必須なのに denylist なしで通す / 必須でないのに赤にする / `invalid` を必須でないときに通す / denylist が無いと email も見ない |
| `CANDIDATE-U-PRIVSCAN-007` | `analyzePrivacyScan` (mode `diff`) に、commit A が `docs/a.md` の 7 行目に `<D>` を足し、commit B がその行を消した単位の列と、baseline に `{ "docs/a.md": ["denylist"] }` を渡す。別に、消した行 (`-` の行) だけに `<D>` がある単位を渡す | A の追加行が `docs/a.md@<A の先頭 12 桁>:7:privacy-denylist-hit` で報告される (B で消えても残る)。baseline は効かない。消した行だけの単位は finding 0 件 | 最後の commit の木だけを見る / `diff` に baseline を効かせる / 消した行を検査する / 行番号を差分の通し番号にする |
| `CANDIDATE-U-PRIVSCAN-008` | `analyzePrivacyScan` (mode `diff`) に commit のメタの単位を渡す。(a) author の email が `<P>`、(b) committer の email が `noreply@github.com`、(c) message の 3 行目に `<D>`、(d) message の末尾が `Co-Authored-By: Claude <noreply@anthropic.com>`、(e) author の名前が `Alice Example` で denylist に `Alice\\s+Example`、(f) merge commit の author の email が `<P>` | (a) `commit:<12 桁>:author:1:privacy-email-hit`。(b)(d) finding なし。(c) `commit:<12 桁>:message:3:privacy-denylist-hit`。(e) `commit:<12 桁>:author:1:privacy-denylist-hit`。(f) 報告される (メタは merge commit も見る) | commit のメタを見ない / trailer の noreply を当てる / author の名前に denylist を掛けない / merge commit のメタを飛ばす |
| `CANDIDATE-U-PRIVSCAN-009` | mode `tree`、baseline `{ "docs/p.md": ["denylist"], "docs/q.md": ["email"] }`、denylist `provided`。(a) `docs/p.md` に `<D>` 2 行、`docs/q.md` に `<P>` 1 行、(b) (a) に加えて `docs/p.md` に `<P>`、(c) `docs/other.md` に `<D>`、(d) `docs/q.md` を単位から除く、(e) `docs/p.md` に `<D>` が無い、(f) (e) を denylist `absent` (必須でない) で、(g) 同じ当たりを mode `pack` で渡す | (a) finding 0 件、`baselined=3`。(b) `docs/p.md` の `privacy-email-hit`。(c) `docs/other.md` の当たり。(d) `privacy-stale-baseline` (`missing-file`)。(e) `privacy-stale-baseline` (`no-hit`)。(f) `no-hit` を出さず `denylist=unavailable`。(g) baseline は効かず全て報告される | baseline を種類に関係なく効かせる / 消えた path の行を黙って通す / 当たりの無い行を残せる / denylist なしで `no-hit` を出す / `pack` に baseline を効かせる |
| `CANDIDATE-U-PRIVSCAN-010` | mode `tree` で、現在の baseline (各行は当たりと一致させる) と比較元を変える。(a) 同じ、(b) 比較元の path を 1 つ消した、(c) 比較元に無い path を足した、(d) 既存の path の列に `email` を足した、(e) 比較元が `absent` (初回)、(f) 比較元が `unreadable`、(g) 現在の baseline が壊れている (`baselineUnreadable=true`) | (a)(b)(e) `privacy-baseline-grown` なし。(c)(d) `privacy-baseline-grown`。(f) `privacy-baseline-base-unreadable`。(g) `privacy-baseline-unreadable`。いずれも (c)(d)(f)(g) は `ok=false` | path の追加を許す / 種類の追加を見逃す / 読めない比較元を初回とみなす / 壊れた baseline を空とみなす |
| `CANDIDATE-U-PRIVSCAN-011` | `parsePrivacyBaseline` に、(a) 有効な JSON (`["denylist"]` と `["denylist", "email"]` の 2 行)、(b) `{}`、(c) 未知の種類 `"phone"`、(d) `["email", "email"]`、(e) 配列でない値、(f) 空の配列、(g) 途中で切れた JSON | (a) 値を復元する、(b) 空の baseline、(c)〜(g) `null` | 壊れた入力を空の baseline とみなす / 未知の種類を受け付ける / 種類の重複を受け付ける |
| `CANDIDATE-U-PRIVSCAN-012` | (a) mode `tree` で単位が 0 個、(b) mode `pack` で artifact が 0 個、(c) NUL を含む内容の単位と `skipped=1`、(d) 同じ内容を単位の順序と baseline のキーの順序を入れ替えて 2 回、(e) 同じ入力を 2 回 | (a)(b) `privacy-input-unreadable` で `ok=false`。(c) binary の内容は走査せず、末尾の `skipped=1`。(d)(e) `findings` と `summary` が一致し、finding は `location`、`line`、`kind`、`reason` の順。入力は変更されない | 入力が無いことを当たりなしとみなす / binary を走査して誤検出する / 出力が入力の順序に依存する / 入力を破壊的に更新する |
| `CANDIDATE-U-PRIVSCAN-013` | temp の git repository で、(a) commit 済みの `docs/x.md` に `<D>` があり、作業木で消した状態の `loadTreePrivacyUnits(root, "HEAD")`、(b) 作業木だけに `<D>` を足した untracked の `docs/y.md`、(c) base から head までに、`<D>` を足す commit A、消す commit B、author が `<P>` の merge commit M を持つ範囲の `loadDiffPrivacyUnits`、(d) merge-base に baseline があるとき・無いとき・JSON が壊れているとき・`origin/main` が無いときの `loadPreviousPrivacyBaseline`、(e) git を起動できない状態の各 loader、(f) `readPrivacyDenylistFromEnv` に `{ PRIVACY_DENYLIST: <D>, OTHER: "x" }` と `{}` | (a) `docs/x.md` の単位に `<D>` の行がある (作業木ではなく commit を読む)。(b) `docs/y.md` の単位は無い。(c) A の追加行、M の author、全 commit の message の単位があり、M の内容 (取り込んだ base の差分) の単位は無い。(d) `found` / `absent` / `unreadable` / `unreadable`。(e) `unreadable`。(f) `provided` (1 entry) と `absent` | 作業木を読む / untracked を読む / 途中の commit を飛ばす / merge commit の内容を読む / 読めない比較元を `absent` にする / 読めない git を差分なしにする |
| `CANDIDATE-U-PRIVSCAN-014` | temp の source と出力先で、(a) artifact に `<P>` を含む状態の `distribution sync-pack` と `distribution package`、(b) `env` に denylist が無い状態の同じ 2 つ、(c) `env` に合成の denylist を置き当たりの無い状態の同じ 2 つ、(d) (b) の状態の `distribution sync-stage`、(e) artifact の path が baseline に載っている状態の `sync-pack` | (a) 書き出しの前に止まり、出力先は変わらない。JSON の `privacyScan.ok=false` で、finding は §8 の値だけを持つ (行の内容を持たない)。(b) `privacy-denylist-unavailable` で止まる。(c) 従来どおり進む。(d) email の当たりが無ければ進み `denylist=unavailable` を出す。(e) baseline は効かず止まる | 配布物を検査しない / 書いてから検査する / Pack で denylist を必須にしない / staging で denylist を必須にする / Pack に baseline を効かせる / JSON に一致した文字列を出す |
| `CANDIDATE-U-PRIVSCAN-015` | 実 repo (`origin/main` の内容) に `checkPrivacyScan({ mode: "tree", rev: "HEAD", requireDenylist: false, env: {} })` をかける。temp にコピーした実 repo で、(a) `docs/` の文書の末尾に `<P>` の行を足して commit する、(b) baseline に path を 1 つ足して commit する | 実 repo は `ok=true` で、末尾は `denylist=unavailable`。`docs/governance/privacy-scan-baseline.json` の各行の path は木に存在し、`email` の種類を持つ行は email の当たりを持つ (件数や path は本書に固定しない)。(a) `privacy-email-hit` で止まる。(b) `privacy-baseline-grown` で止まる | 実 repo に対して常に緑 / baseline が実測と無関係 / baseline に足して通せる |
| `CANDIDATE-U-PRIVSCAN-016` | 実 repo の `.github/workflows/harness-check.yml` と `scripts/privacy-scan.ts` を読む | (a) `harness-check-linux` に privacy scan の step があり、`install deps (frozen)` より前にあり、lane の判定による `if:` を持たない。(b) `PRIVACY_DENYLIST` は `secrets.PRIVACY_DENYLIST` からこの step の `env` にだけ渡り、job と workflow の `env`、他の step に現れない。(c) pull_request で `--mode tree` と `--mode diff` (`pull_request.base.sha` と `pull_request.head.sha`) を `--require-denylist` 付きで流し、main への push で `--mode tree --require-denylist` を流す。(d) `scripts/privacy-scan.ts` から相対 import の閉包をたどると、`node:` で始まらない package の import が 0 件。(e) `.github/workflows/security.yml` には置かない | CI に配線しない / doc lane で skip する / secret を job の env に置く / diff を流さない / 依存の package を secret を持つ process に読ませる |

## 4. 昇格と引用の方針

- `CANDIDATE-U-PRIVSCAN-001`〜`016` は候補 ID のまま Red のテストが引用する。正式 ID `U-PRIVSCAN-*` への昇格は、src/ を含まない昇格 PR で、正式 ID を先頭セルに書き直す変更とテスト名の引用の書き換えを同時に入れる (L6 §11 の (2))。
- 013 の `found` / `absent` / `unreadable` は `loadPreviousPrivacyBaseline` の戻り値の型 (L6 §10) と 1:1 に対応する。
- 015 は baseline の行数や特定の path を期待値に持たない (L6 §6: 初期値は Green の head で記録する)。#1365 などで baseline の行が減っても 015 は改訂不要である。denylist の当たりは secret を持つ CI でしか測れないので、015 は email の種類だけを実測と突き合わせる。denylist の種類の記録は Green の CI の step (`--require-denylist`) が確かめる。

## 5. 範囲外

- 本物の `PRIVACY_DENYLIST` を使う検査 (テストは合成の値だけを使う。本物の値での確認は CI の step が行う)。
- 個人名・電話番号・住所の一般の型 (L6 §13)。
- `scripts/git-hooks/secret-scan-diff.ts` の手元の pre-push の振る舞い。
