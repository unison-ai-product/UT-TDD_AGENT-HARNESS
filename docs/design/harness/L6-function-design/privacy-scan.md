---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_privacy_scan
pair_artifact: docs/test-design/harness/L7-privacy-scan-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1391
---

> **L6 contract marker**: `analyzePrivacyScan(input: PrivacyScanInput) => PrivacyScanResult` は unit-test-granularity contract である (未実装の目標契約。実装は本書の凍結後)。DbC pre/post/invariant は §12 にまとめる。oracle の詳細 (正式 oracle `U-PRIVSCAN-001`〜`018`。候補 ID から昇格済みで、実装と Green の結果は示さない) は専用の `docs/test-design/harness/L7-privacy-scan-test-design.md` が固定する。共有の `L7-unit-test-design.md` と `function-spec.md` には索引行を足さない。

# 個人情報と私有の名前の検査 (privacy scan) — 関数設計 (issue #1391)

## 1. 目的

2026-10-26 に、公開 repo の HEAD と公開済みの Pack に、個人の email アドレス・個人名・個人アカウント名と、社内の私有 repo の名前とその実測が残っていた (issue #1391)。既存の `src/lint/secret-scan.ts` は token と鍵の形だけを見るので、これらは素通りした。PO は git の履歴と既存の tag を書き換えないと決めた (2026-10-26)。したがって、一度 main に merge された漏れや、一度配布した Pack の漏れは取り消せない。

本設計は、次の 2 つを検出して止める検査 (privacy scan) を定める。

1. **email の形**: 個人の email アドレスになりうる文字列 (§3)。除外の規則を一致したアドレスごとに持つ。CI と distribution の両方で検査する。
2. **私有の denylist**: 私有の repo 名・個人名・個人アカウント名など、公開 repo に書けない語の正規表現の列 (§4)。中身は repo の外のローカルファイルにだけ置き、distribution (`package` / `sync-pack`) で検査する。

本検査は GitHub 側の設定 (Actions secret、アカウントの email の設定など) に依存しない。判定は repo の中身とローカルファイルだけで決まる。

出力には path と行番号と種類だけを出し、一致した文字列・行の内容・denylist の中身を出さない (§8)。CI のログも Pack の JSON の出力も公開されうるので、出力から denylist の中身が漏れることを防ぐためである。

## 2. 検査の種類と対象

検査は次の 3 つの方式 (mode) で同じ判定関数を使う。どの方式も、入力の行を `\n` で分け (CRLF は LF に直す)、1 始まりの行番号で報告する。NUL バイトを含む内容は binary とみなして走査せず、件数だけを `skipped` に数える。テキストは UTF-8 として読み、読めないバイトは置換文字にする (読めない 1 バイトのためにファイル全体を飛ばさない)。

| mode | 入力 | 使う場所 | denylist | baseline |
|---|---|---|---|---|
| `tree` | 指定した commit (既定は `HEAD`) の tracked file 全て (`git ls-tree -r` と blob の読み出し。作業木と untracked は読まない) と、その path の文字列 | CI (PR と main への push)、手元の確認 | 使わない | 適用する (§6) |
| `diff` | PR の範囲 (`git merge-base <base> <head>` から `<head>` まで) の **commit ごと**の追加行 (`+` で始まる行。`+++` の見出し行は除く) と追加・rename 先の path、および範囲内の全 commit の author と committer の email と commit message | CI (pull_request) | 使わない | 適用しない |
| `pack` | Pack の配布物の artifact の全て (拡張子で絞らない。`runDistributionSecretScan` と同じ artifact の列で、team の yaml は同じく追跡中の blob の写しを読む) と、その path の文字列 | `ut-tdd distribution sync-pack` / `package` の、書き出しの前 | 必須 (§5) | 適用しない |

- **`diff` が commit ごとに読む理由**: この repo は merge commit で取り込むので、PR の途中の commit も main の履歴に残る。途中の commit で足して後の commit で消した漏れは、HEAD の木 (`tree`) には現れないが、merge すると公開の履歴に残り、書き換えない (PO 決定)。`scripts/git-hooks/secret-scan-diff.ts` が commit ごとの blob を読むのと同じ理由である。追加行の行番号は、その commit の差分の hunk 見出し (`+c,d`) から求めた、その commit の時点のファイルの行番号である。
- **merge commit の内容も読む**: PR の範囲に merge commit があるときは、その merge commit と **first parent との差分** (`git diff <M>^1 <M>`) の追加行を、通常の commit と同じく読む。衝突の解消で入れた行は、この差分にだけ現れる。merge commit を飛ばすと、解消で入れて後の commit で消した漏れ (merge commit M で入れ、後の commit B で消す) が、どの commit の追加行にも木にも現れないまま公開の履歴に残る。first parent との差分は、取り込んだ側 (多くは main) の変更も含む。それらは main に入るときに同じ検査を通っているので、ふつうは当たらない。
- **`diff` が commit のメタを見る理由**: 履歴の書き換えが必要になった A-129 の原因は、commit の author の email だった。author と committer の email は、merge で公開の履歴に残る。merge commit のメタも見る。
- **`tree` を PR でも流す理由**: `diff` は既存の内容を見ないので、規則を変えたときに既にある当たりを見つけられない。`tree` は PR の merge 結果の木 (CI の checkout の `HEAD`) を見る。
- path も検査の対象である。ファイル名やディレクトリ名に email や私有の名前を含めても漏れになるためである。

## 3. email の形と除外

**email の形**: 行の中で、`[A-Za-z0-9._%+-]+` (ローカル部) + `@` + ドメインの形に一致する部分を email とみなす。ドメインは、`.` で区切った 2 個以上の label で、最後の label (TLD) は英字 2 文字以上とする。一致の前が `[A-Za-z0-9._%+-]` の文字、後ろが `[A-Za-z0-9-]` の文字のときは一致にしない (語の途中から拾わない)。比較は ASCII の大文字小文字を区別しない。`@types/node` (ローカル部が無い)、`react@18.3.1` (TLD が数字) は形に一致しない。画像の名前 (`icon` の後ろに `@2x.png` を続けた形) は一致する (repo の HEAD に無いことを 2026-10-26 に確かめた。現れたら除外ではなく名前を変えて避ける)。

**除外** (一致したアドレスそのもので判定する。どれかに当たれば email の当たりにしない):

| 記号 | 除外 | 例 (実在しない値か、公開の no-reply の値) |
|---|---|---|
| E1 | 予約されたドメイン (RFC 2606 / RFC 6761): ドメインが `example.com` / `example.net` / `example.org` か、そのサブドメイン。TLD が `example` / `invalid` / `test` / `localhost` | `alice@example.com`、`bob@mail.example.org`、`test@example.invalid` |
| E2 | 返信を受けないアドレス: ローカル部が `noreply` か `no-reply` (大文字小文字を区別しない)、またはドメインが `users.noreply.github.com` | `noreply@anthropic.com`、`noreply@github.com`、`12345+alice@users.noreply.github.com` |
| E3 | SSH の remote の形: ローカル部が `git` で、ドメインの直後の文字が `:` | `git@github.com:example-org/private-repo.git` |
| E4 | path が `package-lock.json` (どのディレクトリでも) の内容。npm が registry から写した第三者の package の情報であり、この repo の参加者の情報ではないため | ― |

- E1 は「ドメインの最後が予約名で終わる」ことで判定する。`example.com.evil.jp` や `notexample.com` は除外しない。
- commit の trailer (`Co-Authored-By: <名前> <アドレス>`) に特別な扱いは無い。アドレスが E2 に当たるので `noreply@anthropic.com` の trailer は当たらず、個人のアドレスを書いた trailer は当たる。
- **行単位の許可語は使わない**: `secret-scan.ts` は、行に `example` や `dummy` の語があれば行ごと許す (`ALLOW_LINE_MARKERS`)。この検査では使わない。`example` という語を含む行に置かれた実在のアドレスを素通りさせるためである。
- 除外は email の判定だけに効く。denylist (§4) は除外したアドレスにも掛かる。`users.noreply.github.com` のアドレスはローカル部にアカウント名を含むので、`pack` では個人のアカウント名を denylist で捕まえる。
- 個人名・電話番号・住所の一般の型はこの検査では見ない (§13)。個人名は一般の型で判定できないので denylist で扱う。

## 4. 私有の denylist

- **置き場**: OS ユーザの home の `~/.ut-tdd/privacy-denylist.txt` (`os.homedir()` の下の `.ut-tdd/privacy-denylist.txt`)。PC 単位の設定を `~/.ut-tdd/` の下に置く既存の慣習 (`docs/design/harness/L4-basic-design/team-multi-pc-multi-repo.md` の `~/.ut-tdd/machine.json`) に合わせる。repo・GitHub・環境変数には置かない。値はこのファイルからだけ読む (環境変数や引数で中身を渡す経路を作らない)。解決した path が repo root の中にあるときは使わず、`in-repo` として fail-close する (repo に入れて commit する事故を防ぐ)。
- **形式**: UTF-8 のテキスト。1 行に JavaScript の正規表現の本体 (`/` で囲まない) を 1 個書く。CRLF は LF に直す。前後の空白を除いて空の行と、`#` で始まる行は無視する。各行は flag `iu` (大文字小文字を区別しない、Unicode) で compile する。
- **照合**: 内容の各行と path の文字列に、全ての entry を掛ける。行をまたいだ一致はしない。除外も行単位の許可も無い。
- **解釈の結果**: ファイルが無い → `absent`。読めない (権限・I/O の失敗・ディレクトリ) → `unreadable`。空、または無視する行だけ → `empty`。全ての entry が compile できる → `provided`。compile できない entry が 1 個でもある → `invalid` (どの entry かはファイルの中の行番号だけで示す)。

## 5. denylist が無いときの扱い

| 呼び出し | email | denylist | 当たりのとき |
|---|---|---|---|
| CI の step (pull_request と main への push) | 検査する | 使わない (読まない) | fail-close |
| `distribution sync-pack` / `distribution package` | 検査する | 必須。`provided` 以外 (`absent` / `unreadable` / `empty` / `invalid` / `in-repo`) は fail-close | 書き出しの前に止める |
| 手元の確認 (`ut-tdd privacy-scan check` の既定) | 検査する | 使わない | 警告だけ (exit 0) |

- **CI で denylist を使わない理由**: denylist の中身は repo にも GitHub にも置かない (§1)。CI が読める場所に置けば、公開 repo の CI の範囲に私有の名前を持ち込むことになる。CI は repo の中身だけで決まる email の形を検査する。
- **distribution で必須にする理由**: Pack は配布すると取り消せない (tag を書き換えない)。私有の名前を確かめないまま配布しないよう、denylist が使えないときは止める。distribution はローカルで動くので、ローカルファイルを読める。
- **`empty` も止める理由**: 中身が空のファイルを置けば検査を素通りできてしまうので、`absent` と同じに扱う。
- **手元を警告にする理由**: 手元は早く気づくための補助であり、正本は CI である。
- `sync-stage` (手元の staging に書くだけで配布しない) には本検査を掛けない。

## 6. 既存の当たりと baseline

- 既存の email の当たりは **`docs/governance/privacy-scan-baseline.json`** に、path の文字列の配列として、1 path 1 行、昇順で記録する。件数や行番号は記録しない (`diff` が追加行を全て止めるので、baseline の path に当たりが増える経路は PR には無い)。
- **効く範囲**: `tree` の、その path の email の当たりだけを許す。`diff` と `pack` には効かない。baseline の path の中に当たりを含む行を足すと、`diff` が止める。baseline の path が Pack の配布物に入れば、`pack` が止める。
- **path が当たりを含むときは baseline に置けない**: baseline の JSON 自体も `tree` の走査対象なので、当たりを含む path を書けば baseline のファイルが当たる。そうした path は名前を変えて直す。
- **初期値**: 本書に path を固定しない。実装 PR (Green) の head の `tree` で email の当たりがある path を記録し、同じ Green PR で入れる。issue #1391 の完了条件が名指しする、私有の名前が残る既存の PLAN 文書は、CI では denylist を使わないので `tree` の当たりにならない。`docs/plans/` は Pack の配布物から除かれる (`src/setup/distribution.ts` の `CLEAN_DENY_PREFIXES`) ので `pack` の当たりにもならない。したがって baseline には載せない。
- **縮小のみ**: `git merge-base HEAD origin/main` の commit にある baseline を比較元 (`previousBaseline`) とする。比較元に無い path を足すと `privacy-baseline-grown` で fail-close する。path を消すのは許す。比較元にファイルが無いときは初回とみなして比較を省く (code-size gate §5 と同じ)。merge-base を解決できない・比較元を読めない・解釈できないときは `privacy-baseline-base-unreadable` で fail-close する。git の起動には `windowsHide: true` を付ける (issue #693)。
- **初回の後に見つかった当たり**: 規則を変えて main に既存の当たりが見つかったときは、baseline に足せない (縮小のみ)。当たりを伏せる PR (行を消すか書き換える。消す行は追加行ではないので `diff` に当たらない) で直す。
- **stale**: baseline の path が `tree` の対象に無い → `missing-file`。email の当たりが 0 件 → `no-hit`。

## 7. 判定規則と finding

finding は `location`、`line`、`kind`、`reason` を持つ。`location` の形は §8 で定める。

1. **`privacy-email-hit`**。§3 の email の形に一致し、除外に当たらない。1 行に複数あっても 1 件とする。
2. **`privacy-denylist-hit`** (`pack` だけ)。§4 の entry のどれかが一致した。1 行に複数の entry が一致しても 1 件とする。どの entry が一致したかは持たない。
3. **`privacy-denylist-unavailable`** (`pack` だけ)。`reason` は `absent` / `unreadable` / `empty` / `in-repo`。`location` は `denylist`、`line` は 0。
4. **`privacy-denylist-invalid`** (`pack` だけ)。`location` は `denylist`、`line` は compile できない entry のファイルの中の行番号。entry ごとに 1 件。
5. **`privacy-stale-baseline`** (`tree` だけ)。`reason` は `missing-file` か `no-hit` (§6)。
6. **`privacy-baseline-grown`**、**`privacy-baseline-base-unreadable`** (`tree` だけ)。§6。
7. **`privacy-baseline-unreadable`** (`tree` だけ)。現在の baseline のファイルがあるのに解釈できない (壊れた JSON、文字列の配列でない、重複)。ファイルが無いのは空の baseline であり、finding にしない。
8. **`privacy-input-unreadable`**。`tree` と `pack` で走査できる入力が 1 本も無い、または adapter が git や artifact を読めなかった。入力が読めないことを当たりなしと取り違えない。

- `tree` で baseline が許した当たりは finding にしない (件数は summary の `baselined` に数える)。
- `ok` は finding が 0 件のときだけ true。finding は `location`、`line`、`kind`、`reason` の順で一意に並べ、入力の順序に依存しない。`ok` が false のとき止めるか警告にとどめるかは呼び出し側が決める (§5)。

## 8. 出力の形 (一致した文字列を出さない)

finding ごとに 1 行 `<location>:<line>:<kind>[:<reason>]` を出し、末尾に `privacy-scan mode=<mode> checked=<走査した単位の数> skipped=<binary の数> email=<件数> denylist=<件数 | unused> stale=<件数> baselined=<件数> baseline=<baseline の path の数>` を出す。

| 単位 | `location` | `line` |
|---|---|---|
| `tree` のファイルの内容 | `<path>` | ファイルの行番号 |
| `pack` の artifact の内容 | `pack:<path>` | artifact の行番号 |
| `diff` の追加行 (merge commit の first parent との差分を含む) | `<path>@<commit の先頭 12 桁>` | その commit の時点の行番号 |
| `diff` の commit のメタ | `commit:<commit の先頭 12 桁>:author` / `:committer` / `:message` | author と committer は 1、message は行番号 |
| path の文字列 | (下の規則) | 0 |

- **path 自体が当たりを含むとき**は、その path を平文で出さない。その path に関する全ての finding (path の当たりと内容の当たり) の `location` の path の部分を `path-sha256:<path の UTF-8 の sha256 の 16 進 64 桁>` に置き換える (`pack:` などの前置きと `@<commit>` は残す)。手元で探すときは、`git ls-files` の各 path の sha256 と突き合わせる。
- **出力の語彙を閉じる**: 出力に出してよいのは、当たりを含まない path、数字、commit の 16 進、sha256 の 16 進、本節と §7 の固定の語だけである。一致した部分文字列、行の内容、denylist の entry、denylist のファイルの中身、正規表現の compile の例外のメッセージ (JavaScript の例外は正規表現の本体を含む) を出さない。Pack の JSON の出力 (`privacyScan`) と、distribution が書く evidence も同じ値だけを持つ。
- 件数が多くても全ての finding を出す (途中で切ると、どれを直したかを往復で確かめられなくなる)。

## 9. module の境界

**新しい module に分ける**: 純粋関数は `src/lint/privacy-scan.ts`、I/O (git、artifact、denylist のファイルの読み出し) は `src/lint/privacy-scan-inputs.ts` に置く。`src/lint/secret-scan.ts` には足さない。理由は次のとおりである。

1. **判定の意味が違う**: `secret-scan.ts` は、ファイルと pattern の組ごとに最初の 1 行だけを報告し、行の語 (`ALLOW_LINE_MARKERS`) で行ごと許す。本検査は、一致したアドレスごとの除外 (§3) と、全ての行の報告 (baseline と行番号、§6・§8) が要る。同じ関数に 2 つの意味を持たせると、片方の規則を緩める変更が他方を緩める。
2. **入力が違う**: `secret-scan.ts` の system scan は作業木の `docs/` と `.ut-tdd/` の一部を拡張子で絞って読む。本検査は commit の木の全 tracked file、commit ごとの追加行 (merge commit を含む)、commit のメタ、Pack の全 artifact、repo の外の denylist のファイルを読む。
3. **denylist の中身に触れる範囲を小さくする**: denylist のファイルを読むのは `readPrivacyDenylistFile` の 1 関数だけにし、中身は compile 済みの正規表現としてだけ純粋関数へ渡す。出力の語彙が閉じていること (§8) を 1 つの module の出口で確かめられる。
4. **量**: code-size gate の上限 (`src` 500 行、`docs/design/harness/L6-function-design/code-size-gate.md`) の内側で、1 module 1 責務を保つ。

**再利用するもの**: Pack の artifact の列は `src/cli/distribution.ts` の `runDistributionSecretScan` と同じものを使い、その隣で呼ぶ。`scripts/git-hooks/secret-scan-diff.ts` (手元の pre-push、既定は warn) の `analyzePiiScan` は本書の範囲では変えない (§13)。

## 10. 関数のシグネチャ (純粋関数と I/O の adapter)

純粋関数はファイルも git も環境変数も読まない。

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `findEmailHitLines` | `findEmailHitLines(unit: PrivacyUnit) => number[]` | 単位 | 除外に当たらない email を含む行番号 (昇順、重複なし) | 一致ごとに除外を判定する | `U-PRIVSCAN-001`, `002` |
| `parsePrivacyDenylist` | `parsePrivacyDenylist(text: string) => PrivacyDenylist` | ファイルの中身 | `{ kind: "empty" }` / `{ kind: "provided"; entries: readonly RegExp[] }` / `{ kind: "invalid"; entryLines: readonly number[] }` | 例外のメッセージを外へ出さない | `U-PRIVSCAN-003` |
| `parsePrivacyBaseline` | `parsePrivacyBaseline(sourceText: string) => PrivacyBaseline \| null` | 文字列 | 解釈できなければ `null` | 壊れた入力を空とみなさない | `U-PRIVSCAN-011` |
| `analyzePrivacyScan` | `analyzePrivacyScan(input: PrivacyScanInput) => PrivacyScanResult` | 入力は §12 の Pre | `{ ok, findings, summary }` (§7) | 純粋。入力順に依存しない。出力は §8 の語彙だけ | `U-PRIVSCAN-004`〜`010`, `012` |
| `privacyScanMessages` | `privacyScanMessages(result: PrivacyScanResult) => string[]` | 結果 | §8 の行 | 語彙が閉じている | `U-PRIVSCAN-005` |
| `loadTreePrivacyUnits` | `loadTreePrivacyUnits(repoRoot: string, rev: string) => { kind: "found"; units: PrivacyUnit[]; skipped: number } \| { kind: "unreadable" }` | repo root と commit | 木の全 tracked file と path | 作業木を読まない | `U-PRIVSCAN-013` |
| `loadDiffPrivacyUnits` | `loadDiffPrivacyUnits(repoRoot: string, range: { base: string; head: string }) => { kind: "found"; units: PrivacyUnit[] } \| { kind: "unreadable" }` | 範囲 | commit ごとの追加行 (merge commit は first parent との差分)・path・メタ | 読めない git を差分なしにしない。merge commit を飛ばさない | `U-PRIVSCAN-013`, `017` |
| `loadPreviousPrivacyBaseline` | `loadPreviousPrivacyBaseline(repoRoot: string) => { kind: "found"; baseline: PrivacyBaseline } \| { kind: "absent" } \| { kind: "unreadable" }` | repo root | §6 の比較元 | 読めない比較元を `absent` にしない | `U-PRIVSCAN-013` |
| `readPrivacyDenylistFile` | `readPrivacyDenylistFile(input: { homeDirectory: string; repoRoot: string }) => PrivacyDenylistState` | home と repo root | `<home>/.ut-tdd/privacy-denylist.txt` を読み `parsePrivacyDenylist` に渡す。無い・読めない・repo の中は `absent` / `unreadable` / `in-repo` | 環境変数を読まない。中身を返り値の外へ出さない | `U-PRIVSCAN-013` |
| `checkPrivacyScan` | `checkPrivacyScan(options: { repoRoot: string; mode: "tree" \| "diff"; rev?: string; range?: { base: string; head: string } }) => { messages: string[]; ok: boolean }` | repo root と mode | adapter を合成し `analyzePrivacyScan` を呼ぶ | 例外を握りつぶさない。denylist を読まない | `U-PRIVSCAN-015` |
| `scanPackPrivacy` | `scanPackPrivacy(input: { artifacts: readonly { path: string; text: string }[]; repoRoot: string; homeDirectory: string }) => PrivacyScanResult` | Pack の artifact | `mode=pack` の結果 | baseline を読まない。denylist は必須 | `U-PRIVSCAN-014`, `018` |

`PrivacyUnit` は `{ source: "tree" | "pack" | "diff" | "commit-meta"; path: string | null; commit: string | null; field: "content" | "path" | "author" | "committer" | "message"; lines: readonly { line: number; text: string }[] }`。`PrivacyDenylistState` は `PrivacyDenylist | { kind: "absent" } | { kind: "unreadable" } | { kind: "in-repo" }`。`PrivacyScanInput` は `{ mode: "tree" | "diff" | "pack"; units: readonly PrivacyUnit[]; skipped: number; denylist: PrivacyDenylistState | null; baseline: PrivacyBaseline | null; baselineUnreadable: boolean; previousBaseline: { kind: "found"; baseline: PrivacyBaseline } | { kind: "absent" } | { kind: "unreadable" } | null }`。`denylist` は `pack` だけが渡し、他の mode は `null`。`baseline` 以下は `tree` だけが使い、他の mode は `null` と `false` を渡す (`max-source-params` に合わせて 1 つの object にまとめる)。`PrivacyBaseline` は `readonly string[]` (path の昇順)。

## 11. 配線と PR の順序

- **CI**: `.github/workflows/harness-check.yml` の `harness-check-linux` に step を 1 本足す。lane の判定 (`classify`) に依らず、doc lane でも skip しない (漏れの主な経路は文書であるため)。pull_request では `node src/cli.ts privacy-scan check --mode tree --fail-close` と `--mode diff --base <pull_request.base.sha> --head <pull_request.head.sha> --fail-close` を流し、main への push では `--mode tree --fail-close` だけを流す。step は Actions secret も denylist も参照しない。`harness-check` は唯一の Required Status Check なので、赤は merge を止める。`.github/workflows/security.yml` には置かない (非 required の補助検査であり、赤でも merge を止めないため)。Windows の job には置かない (内容は OS に依らない)。
- **CLI**: `ut-tdd privacy-scan check --mode tree|diff [--rev <rev>] [--base <rev> --head <rev>] [--fail-close]`。`checkPrivacyScan` を呼び、メッセージを出す。`--fail-close` があり `ok` でなければ exit 1、それ以外は exit 0 (手元の既定は警告、§5)。読み取りだけを行い、harness.db にも `.ut-tdd/` にも書かない。doctor の singleton には入らない。
- **Pack**: `src/cli/distribution.ts` の `sync-pack` と `package` で、`runDistributionSecretScan` と同じ artifact の列に `scanPackPrivacy` を掛け、`ok` でなければ書き出しの前に止める (secret-scan と同じ止め方)。JSON の出力には `privacyScan: { ok, checked, findings }` を足す (finding は §8 の値だけ)。denylist が使えないときのメッセージは、置き場所 (`~/.ut-tdd/privacy-denylist.txt`) と形式 (§4) を示す。
- **doctor には配線しない**: CI では CI の step が正本になる。同じ検査を 2 か所で流さない。
- **PR の順序** (設計書保護 gate §10.3 の三段階): (0) 本書と L7 の契約 PR、(1) 登録 + Red PR (実 repo を読む 015 と 016 は `src/doctor/test-repository-isolation.ts` の `repositoryReadContracts` へ登録行を足す。テスト名は候補 ID を引用する)、(2) src を含まない昇格 PR (`CANDIDATE-U-PRIVSCAN-*` を `U-PRIVSCAN-*` へ 1:1 で昇格)、(3) 実装 PR (Green。`src/lint/privacy-scan*.ts`、CLI、CI の step、distribution の配線、`docs/governance/privacy-scan-baseline.json` の初期値)。

## 12. 不変条件 (DbC)

- Pre: 入力は mode、走査する単位の列、binary として飛ばした数、`pack` のときは denylist の状態、`tree` のときは現在の baseline と比較元。読み取りだけを行い、ファイルを書かない。
- Post: `ok` は §7 の finding が 0 件のときだけ true。finding は入力の順序に依存せず一意に並ぶ。同じ入力から同じ出力を返す (純粋性)。
- Invariant (denylist の中身を出さない): denylist のファイルの中身 (entry、コメント行を含む) と、一致した文字列・行の内容・当たりを含む path の平文は、出力 (メッセージ、finding、Pack の JSON、例外のメッセージ、distribution の evidence) に現れない。検査が新しく書く、または変えるファイル (repo の中、`.ut-tdd/`、harness.db を含む) にも現れない。入力にもとからある当たりは、検査が書き換えずにそのまま残す (止めて直させるのが検査の役目であり、入力の当たりはこの不変条件の違反ではない)。denylist は `~/.ut-tdd/privacy-denylist.txt` からだけ読み、repo の中の path を denylist として使わない。
- Invariant (fail-safe): 読めない入力 (git、artifact、baseline、比較元、denylist のファイル) を、当たりなし・空・比較なしと取り違えない。`pack` は denylist が `provided` でなければ `ok=true` を返さない。baseline は `tree` の email にしか効かず、縮小しかできない。`diff` は merge commit を含む範囲内の全 commit の追加行を読む。
- Invariant (判定): email の除外は一致したアドレスごとに判定し、行の語で行ごと許さない。denylist には除外が無い。判定は repo の中身とローカルの denylist のファイルだけで決まり、GitHub 側の設定に依存しない。

## 13. 範囲外

- git の履歴と既存の tag の書き換え (PO 決定、2026-10-26)。
- CI での denylist の照合 (§5)。
- 個人名・電話番号・住所の一般の型。個人名は `pack` の denylist で扱う。`scripts/git-hooks/secret-scan-diff.ts` の手元の pre-push (電話番号・郵便番号・internal URL・email、既定は warn) は変えない。email の判定を本 module に寄せて定義を 1 つにする変更は、Green の後に別の Issue で扱う。
- GitHub が merge のときに作る merge commit。PR の範囲の外で、CI の後に作られるので、本検査は見ない。
- Pack の repo 側の commit のメタと Pack の repo の CI。
- binary の中の文字列 (画像の metadata など)。
- denylist のファイルの中身の決定。

## 14. 根拠

- issue #1391 (背景・PO 決定・完了条件)。伏せる作業は PR #1389。GitHub 側の設定に依存しない方針と、merge commit の解消内容を検査する方針は、本 PR の review (r1 の FLAG 2 件) を受けた改訂である。
- 型の手本: `docs/design/harness/L6-function-design/code-size-gate.md` (§5 の縮小のみの baseline と merge-base の比較元)。commit ごとの blob を読む理由: `scripts/git-hooks/secret-scan-diff.ts` の設計注記。`~/.ut-tdd/` の慣習: `docs/design/harness/L4-basic-design/team-multi-pc-multi-repo.md` §3。
- 2026-10-26 の `origin/main` (`31b8fd97e`) の tracked file 全てに、§3 の形と除外を実装した使い捨ての script (repo に置いていない。Green の実装が正本になる) を掛けた。email の形の一致は 111 件で、E1 が 74 件、E3 が 20 件 (`tests/` の 8 ファイル 18 行と本書・L7 の各 1 行)、E2 が 15 件、E4 が 1 件 (`package-lock.json` の第三者の package の情報) を除き、除外の外に残るのは PR #1389 が伏せる監査記録の 1 行だけだった。E3 が無いと `tests/` の SSH の remote の形が当たる。直近 500 個の merge でない commit の author と committer の email は、全て `users.noreply.github.com` (E2) だった。
