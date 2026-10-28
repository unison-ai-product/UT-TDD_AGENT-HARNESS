---
title: "L7 privacy scan test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/privacy-scan.md
status: confirmed
updated: 2026-10-27
issue: 1391
---

# 個人情報と私有の名前の検査 (privacy scan) テスト設計 (issue #1391)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/privacy-scan.md` である (未実装の目標契約)。
本書はその §2 検査の種類と対象、§3 email と除外、§4 denylist、§5 denylist が無いときの扱い、§6 baseline、§7 判定規則と finding、§8 出力の形、§10 関数、§11 配線、§12 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引行を足さない。本書が詳細の正本である。

`U-PRIVSCAN-001`〜`018` は正式 oracle へ昇格済み (issue #1391、設計書保護 gate §10.3 の手順 2)。Red の `it.fails` はそのまま残っており、昇格は実装や Green の結果を意味しない。

## 2. fixture

- **テストのソースに当たりを書かない**: 本検査の `tree` は `tests/` も走査する。除外に当たらない email は、テストの中で実行時に連結して作る (例: ローカル部、`"@"`、ドメインを別々の文字列リテラルにして `+` で繋ぐ)。ソースの 1 行が L6 §3 の email の形に一致しないようにする。ドメインは実在しうる形 (`.jp` など) を使うが、実在の人や組織のアドレスを使わない。
- **denylist は合成の値だけを使う**: `example-private-repo`、`Alice Example` のような実在しない語の正規表現を、temp directory に作った home の `.ut-tdd/privacy-denylist.txt` に書き、`homeDirectory` として関数へ渡す。実行している利用者の本物の home と本物の denylist のファイルを読むテストを書かない。process の環境変数を書き換えない。
- 純粋関数の行は、`PrivacyUnit` の列・denylist の状態・baseline・比較元を直接渡して作る。実 repo のファイルは読まない (015 と 016 を除く)。
- 013 と 017 は temp directory に実 git repository を作り、木・commit ごとの追加行 (merge commit を含む)・commit のメタ・比較元の取得・denylist のファイルの読み出しを確かめる。014 と 018 は distribution の command を temp の source・home・出力先で動かす。
- 1 つの行は規則を 1 本だけ殺すように、入力の書き方を 1 つだけ変える。
- 015 と 016 は実 repo を読むので、`test-repository-isolation` の登録が要る (L6 §11)。

## 3. oracle 宣言の一覧

以下で `<P>` は「除外に当たらない email を実行時に連結して作った値」(例: ローカル部 `alice`、ドメイン `mail-provider.jp`)、`<D>` は合成の denylist の語 `example-private-repo` を指す。

| ID | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `U-PRIVSCAN-001` | `findEmailHitLines` に `tree` の単位として、(a) 1 行目が空、2 行目に `<P>`、3 行目に `<P>` を 2 個、(b) CRLF の 3 行の 3 行目に `<P>`、(c) `<P>` の前に `x.` や英字 `b` が付く形と、ドメインの後に `-` が続く形、(d) `@types/node`、`react@18.3.1`、`@` だけの行 | (a) `[2, 3]` (同じ行の複数は 1 件)、(b) `[3]`、(c) 前に `x.` や `b` が付く形は、L6 §3 の形ではローカル部が `x.alice` や `balice` の正しい email そのものなので当たる (`[1]`)。ドメインの後に `-` が続く形は、TLD の直後が `[A-Za-z0-9-]` なので当たらない (`[]`)、(d) `[]` | 行番号を 0 始まりにする / 同じ行を 2 件にする / CRLF で行を取り違える / ドメインの直後の `-` で切って拾う / ローカル部に `.` を含む形や前に英字が付く形を見逃す / ローカル部の無い形を拾う |
| `U-PRIVSCAN-002` | `findEmailHitLines` に除外の境界を渡す。(a) `alice@example.com`、`bob@mail.example.org`、`c@example.net`、`d@host.test`、`e@host.invalid`、`f@host.localhost`、(b) `noreply@anthropic.com`、`NoReply@github.com`、`no-reply@service.jp` (ローカル部が除外の語)、`12345+alice@users.noreply.github.com`、(c) `git@github.com:example-org/private-repo.git`、(d) `Co-Authored-By: Claude <noreply@anthropic.com>`、(e) 実行時に連結して作る、ローカル部 `x` とドメイン `example.com.evil.jp` の組、ローカル部 `x` とドメイン `notexample.com` の組、ローカル部 `noreplyx` とドメイン `service.jp` の組、ローカル部 `git` とドメイン `github.com` の組の直後が `:` でない形、`Co-Authored-By: X <` + `<P>` + `>`、(f) path `package-lock.json` と `sub/package-lock.json` の内容に `<P>`、(g) 同じ行に `example` と `dummy` の語と `<P>` | (a)〜(d) `[]`。(e) 各行が当たる。(f) email は `[]`。(g) 当たる (行の語で許さない) | 予約ドメインを部分一致で除外する / noreply を部分一致にする / SSH の形を `git@` だけで除外する / trailer を一律に除外する / `package-lock.json` を root だけで判定する / 行の許可語を使う |
| `U-PRIVSCAN-003` | `parsePrivacyDenylist` に、(a) `""`、(b) 空白と改行だけ、(c) `#` で始まる行だけ、(d) CRLF で `# c`、空行、`<D>`、`Alice\\s+Example` の 4 行、(e) 3 行目だけが `(` (compile できない) で他は有効、(f) 2 行目と 4 行目が compile できない | (a)〜(c) `empty`。(d) `provided` で entry は 2 個、flag は `iu`。(e) `invalid` で `entryLines` は `[3]`。(f) `[2, 4]`。どの場合も、関数の戻り値と投げる例外のメッセージに entry の文字列が入らない | 空を `provided` にする / コメント行を entry にする / 1 個の失敗で残りを黙って使う / 大文字小文字を区別する / 例外のメッセージをそのまま返す |
| `U-PRIVSCAN-004` | `analyzePrivacyScan` (mode `pack`、denylist `provided` で `<D>`) に、(a) 内容の 5 行目に `<D>` を大文字にした語、(b) path が `docs/<D>-notes.md` で内容は無害、(c) `package-lock.json` の 2 行目に `<D>`、(d) 内容の 1 行目に `12345+<D>@users.noreply.github.com`、(e) 同じ行に `<D>` が 2 回 | (a) `privacy-denylist-hit` (line 5)。(b) `privacy-denylist-hit` (line 0、`location` は `pack:path-sha256:` の形)。(c) `privacy-denylist-hit` (line 2。E4 は email にしか効かない)。(d) `privacy-denylist-hit` (line 1) で `privacy-email-hit` は無い。(e) 1 件 | path を検査しない / email の除外を denylist にも効かせる / 大文字小文字を区別する / 1 行に複数件を出す |
| `U-PRIVSCAN-005` | 001〜004 と 007・008 の当たりを全て含む入力を `analyzePrivacyScan` に渡し、`privacyScanMessages` で文字列にする。denylist には `<D>` と、compile できない entry を含む別の入力も使う。compile できない entry の回は、path に当たりを含まない入力にする (当たりを含む path を伏せる対象は、scanner が判定できた当たりに限る。denylist が `provided` でない回では path の当たりを判定できない) | どの出力行にも、denylist の entry の文字列、一致した部分文字列、当たりの行の内容が含まれない。path に当たりを含むファイルは、そのファイルの全ての finding が `path-sha256:<64 桁の 16 進>` で出て平文の path が出ない。sha256 は path の UTF-8 の値と一致する。各行は `<location>:<line>:<kind>[:<reason>]` の形で、末尾の行は `privacy-scan mode=` `checked=` `skipped=` `email=` `denylist=` `stale=` `baselined=` `baseline=` を持つ | 一致した文字列を出す / 行の内容を出す / 内容の当たりだけ平文の path で出す / compile の例外のメッセージを出す |
| `U-PRIVSCAN-006` | `<P>` を 1 件含む入力で denylist の状態を変える。mode `pack` で (a) `absent`、(b) `unreadable`、(c) `empty`、(d) `in-repo`、(e) `invalid` (`entryLines` は `[2]`)、(f) `provided`。mode `tree` と `diff` で (g) `null` | (a)〜(d) `privacy-email-hit` に加えて `privacy-denylist-unavailable` (`location` は `denylist`、line 0、`reason` はそれぞれ `absent` / `unreadable` / `empty` / `in-repo`) で `ok=false`。(e) `privacy-denylist-invalid` (line 2)。(f) email の 1 件だけ。(g) email の 1 件だけで、denylist の finding は無く、末尾は `denylist=unused` | Pack で denylist なしに通す / 空のファイルで素通りさせる / repo の中のファイルを使う / `tree` と `diff` で denylist を要求する / denylist が無いと email も見ない |
| `U-PRIVSCAN-007` | `analyzePrivacyScan` (mode `diff`) に、commit A が `docs/a.md` の 7 行目に `<P>` を足し、commit B がその行を消した単位の列と、baseline に `["docs/a.md"]` を渡す。別に、消した行 (`-` の行) だけに `<P>` がある単位を渡す | A の追加行が `docs/a.md@<A の先頭 12 桁>:7:privacy-email-hit` で報告される (B で消えても残る)。baseline は効かない。消した行だけの単位は finding 0 件 | 最後の commit の木だけを見る / `diff` に baseline を効かせる / 消した行を検査する / 行番号を差分の通し番号にする |
| `U-PRIVSCAN-008` | `analyzePrivacyScan` (mode `diff`) に commit のメタの単位を渡す。(a) author の email が `<P>`、(b) committer の email が `noreply@github.com`、(c) message の 3 行目に `<P>`、(d) message の末尾が `Co-Authored-By: Claude <noreply@anthropic.com>`、(e) merge commit の author の email が `<P>` | (a) `commit:<12 桁>:author:1:privacy-email-hit`。(b)(d) finding なし。(c) `commit:<12 桁>:message:3:privacy-email-hit`。(e) 報告される (メタは merge commit も見る) | commit のメタを見ない / trailer の noreply を当てる / merge commit のメタを飛ばす |
| `U-PRIVSCAN-009` | mode `tree`、baseline `["docs/p.md"]`。(a) `docs/p.md` に `<P>` 2 行、(b) (a) に加えて `docs/other.md` に `<P>`、(c) `docs/p.md` を単位から除く、(d) `docs/p.md` に `<P>` が無い、(e) 同じ当たりを mode `pack` (denylist `provided`) で渡す | (a) finding 0 件、`baselined=2`。(b) `docs/other.md` の `privacy-email-hit`。(c) `privacy-stale-baseline` (`missing-file`)。(d) `privacy-stale-baseline` (`no-hit`)。(e) baseline は効かず全て報告される | baseline の path 以外まで許す / 消えた path の行を黙って通す / 当たりの無い行を残せる / `pack` に baseline を効かせる |
| `U-PRIVSCAN-010` | mode `tree` で、現在の baseline (各行は当たりと一致させる) と比較元を変える。(a) 同じ、(b) 比較元の path を 1 つ消した、(c) 比較元に無い path を足した、(d) 比較元が `absent` (初回)、(e) 比較元が `unreadable`、(f) 現在の baseline が壊れている (`baselineUnreadable=true`) | (a)(b)(d) `privacy-baseline-grown` なし。(c) `privacy-baseline-grown`。(e) `privacy-baseline-base-unreadable`。(f) `privacy-baseline-unreadable`。(c)(e)(f) は `ok=false` | path の追加を許す / 読めない比較元を初回とみなす / 壊れた baseline を空とみなす |
| `U-PRIVSCAN-011` | `parsePrivacyBaseline` に、(a) 有効な JSON (path の文字列 2 個の配列)、(b) `[]`、(c) 配列でない値 (`{}`)、(d) 文字列でない要素、(e) 同じ path の重複、(f) 途中で切れた JSON | (a) 値を復元する、(b) 空の baseline、(c)〜(f) `null` | 壊れた入力を空の baseline とみなす / 文字列でない要素を受け付ける / 重複を受け付ける |
| `U-PRIVSCAN-012` | (a) mode `tree` で単位が 0 個、(b) mode `pack` で artifact が 0 個、(c) NUL を含む内容の単位と `skipped=1`、(d) 同じ内容を単位の順序と baseline の要素の順序を入れ替えて 2 回、(e) 同じ入力を 2 回 | (a)(b) `privacy-input-unreadable` で `ok=false`。(c) binary の内容は走査せず、末尾の `skipped=1`。(d)(e) `findings` と `summary` が一致し、finding は `location`、`line`、`kind`、`reason` の順。入力は変更されない | 入力が無いことを当たりなしとみなす / binary を走査して誤検出する / 出力が入力の順序に依存する / 入力を破壊的に更新する |
| `U-PRIVSCAN-013` | temp の git repository と temp の home で、(a) commit 済みの `docs/x.md` に `<P>` があり、作業木で消した状態の `loadTreePrivacyUnits(root, "HEAD")`、(b) 作業木だけに `<P>` を足した untracked の `docs/y.md`、(c) base から head までに、`<P>` を足す commit A、消す commit B、author が `<P>` の merge commit M を持つ範囲の `loadDiffPrivacyUnits`、(d) merge-base に baseline があるとき・無いとき・JSON が壊れているとき・`origin/main` が無いときの `loadPreviousPrivacyBaseline`、(e) git を起動できない状態の各 loader、(f) `readPrivacyDenylistFile` に、ファイルが無い home、`<D>` を書いたファイルのある home、`privacy-denylist.txt` がディレクトリの home、repo root の中にある home | (a) `docs/x.md` の単位に `<P>` の行がある (作業木ではなく commit を読む)。(b) `docs/y.md` の単位は無い。(c) A の追加行、M の first parent との差分の追加行、M の author、全 commit の message の単位がある。(d) `found` / `absent` / `unreadable` / `unreadable`。(e) `unreadable`。(f) `absent` / `provided` (1 entry) / `unreadable` / `in-repo` | 作業木を読む / untracked を読む / 途中の commit を飛ばす / merge commit を飛ばす / 読めない比較元を `absent` にする / 読めない git を差分なしにする / 読めない denylist を無いとみなす / repo の中の denylist を使う |
| `U-PRIVSCAN-014` | temp の source・home・出力先で (source は、clean な artifact を commit し、その commit を `artifactSourceCommit` とする `release/manifest.yaml` を足した commit に tag を付けた temp の git repository とする。`package` は L6 §2・§11 のとおり tag の snapshot の artifact を検査するため)、(a) artifact に `<P>` を含み home に合成の denylist がある状態の `distribution sync-pack` と `distribution package`、(b) home に denylist のファイルが無い状態の同じ 2 つ、(c) 中身が空の denylist のファイルの状態、(d) artifact に `<D>` を含む状態、(e) 合成の denylist があり当たりの無い状態、(f) (b) の状態の `distribution sync-stage`、(g) artifact の path が `tree` の baseline に載っている状態の `sync-pack` | (a) 書き出しの前に止まり、出力先は変わらない。JSON の `privacyScan.ok=false` で、finding は L6 §8 の値だけを持つ。(b) `privacy-denylist-unavailable` (`absent`) で止まり、メッセージは置き場所 `~/.ut-tdd/privacy-denylist.txt` を示す。(c) `empty` で止まる。(d) `privacy-denylist-hit` で止まる。(e) 従来どおり進む。(f) 本検査を掛けない。(g) baseline は効かず止まる | 配布物を検査しない / 書いてから検査する / Pack で denylist を必須にしない / 空のファイルで素通りさせる / staging に掛ける / Pack に baseline を効かせる |
| `U-PRIVSCAN-015` | 実 repo (`origin/main` の内容) に `checkPrivacyScan({ mode: "tree", rev: "HEAD" })` をかける。temp にコピーした実 repo で、(a) `docs/` の文書の末尾に `<P>` の行を足して commit し、`ut-tdd privacy-scan check --mode tree` を `--fail-close` 付きと無しで流す、(b) baseline に path を 1 つ足して commit する | 実 repo は `ok=true` で、末尾は `denylist=unused`。`docs/governance/privacy-scan-baseline.json` の各 path は木に存在し、email の当たりを持つ (件数や path は本書に固定しない)。(a) `privacy-email-hit` を出し、`--fail-close` 付きは exit 1、無しは exit 0。(b) `privacy-baseline-grown`。どの実行でも `.ut-tdd/` と harness.db のファイルの更新時刻が変わらない | 実 repo に対して常に緑 / baseline が実測と無関係 / baseline に足して通せる / 手元の既定で赤にする / CI 用の指定で緑にする / CLI が state を書く |
| `U-PRIVSCAN-016` | 実 repo の `.github/workflows/` を読む | (a) `harness-check.yml` の `harness-check-linux` に privacy scan の step があり、lane の判定による `if:` を持たない。(b) pull_request で `--mode tree` と `--mode diff` (`pull_request.base.sha` と `pull_request.head.sha`) を `--fail-close` 付きで流し、main への push で `--mode tree --fail-close` を流す。(c) その step は `secrets.` を参照せず、`.github/workflows/` のどのファイルにも `PRIVACY_DENYLIST` と `privacy-denylist` の文字列が無い。(d) `security.yml` には置かない | CI に配線しない / doc lane で skip する / diff を流さない / `--fail-close` を付けない / GitHub の secret に依存する |
| `U-PRIVSCAN-017` | temp の git repository で、base の branch と作業の branch が同じ行を別々に変えて衝突する状態を作り、作業の branch で base を取り込む merge commit M の衝突の解消で `docs/x.md` の 4 行目に `<P>` を入れて commit し、続く commit B でその行を消す。範囲 (base から B まで) を `loadDiffPrivacyUnits` で読み、`analyzePrivacyScan` (mode `diff`) に渡す。対照として、衝突の解消に `<P>` を入れない同じ形の範囲も渡す | M の行が `docs/x.md@<M の先頭 12 桁>:4:privacy-email-hit` で報告され、`ok=false`。B の head の木 (`tree`) には当たりが無い。対照の範囲は finding 0 件 | merge commit を `--no-merges` で飛ばす / merge commit を second parent との差分で読む / 範囲の最後の木だけを見る / 取り込んだ側の変更を全て当たりにする |
| `U-PRIVSCAN-018` | temp の home の denylist のファイルに、`<D>`、compile できない entry、`#` で始まるコメント行 (他に現れない一意の文字列を含む) を書く。artifact に `<D>` を含む状態と、compile できない entry だけを直した状態で、`distribution sync-pack` と `distribution package` を `--json` 付きと無しで流す | (a) 出力の観点: 標準出力・標準エラー・JSON の出力・出力先に新しく書かれた全てのファイル・新しく作られた evidence のどこにも、denylist の entry の文字列、コメント行の一意の文字列、一致した部分文字列が現れない。(b) source の観点: 入力の artifact にもとからある `<D>` は保持される (検査は source を書き換えない)。temp の source の repo の中 (`.ut-tdd/` を含む) は、実行の前後で取ったファイルの一覧と内容の差分で比べ、追加・変更されたファイルに entry の文字列とコメント行の一意の文字列が現れない (新しい漏えいが無い)。(c) denylist のファイルは home の外へ写されない | 出力や evidence に denylist の中身を出す / 検査が source の repo に denylist の中身を書く / denylist のファイルを repo へ写す / compile の例外のメッセージを出す / 検査が入力の当たりを書き換える |

## 4. 昇格と引用の方針

- `U-PRIVSCAN-001`〜`018` は、src/ を含まない昇格 PR で候補 ID (`CANDIDATE-U-PRIVSCAN-*`) から正式 ID へ昇格した。先頭セルの書き直しとテスト名の引用の書き換えを同じ PR で入れた (L6 §11 の (2))。`it.fails` を `it` に戻すのは実装 PR (Green) である。
- 013 の `found` / `absent` / `unreadable` は `loadPreviousPrivacyBaseline` の戻り値の型と、013 の (f) と 006 の denylist の状態は `PrivacyDenylistState` (L6 §10) と、それぞれ 1:1 に対応する。
- 015 は baseline の行数や特定の path を期待値に持たない (L6 §6: 初期値は Green の head で記録する)。baseline の行が減っても 015 は改訂不要である。

## 5. 範囲外

- 利用者の本物の denylist のファイルを使う検査 (テストは temp の home の合成の値だけを使う)。
- 個人名・電話番号・住所の一般の型 (L6 §13)。
- `scripts/git-hooks/secret-scan-diff.ts` の手元の pre-push の振る舞い。
