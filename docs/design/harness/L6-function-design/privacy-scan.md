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

> **L6 contract marker**: `analyzePrivacyScan(input: PrivacyScanInput) => PrivacyScanResult` は unit-test-granularity contract である (未実装の目標契約。実装は本書の凍結後)。DbC pre/post/invariant は §12 にまとめる。oracle の詳細 (CANDIDATE-U-PRIVSCAN-001〜) は専用の `docs/test-design/harness/L7-privacy-scan-test-design.md` が固定する。共有の `L7-unit-test-design.md` と `function-spec.md` には索引行を足さない。

# 個人情報と私有の名前の検査 (privacy scan) — 関数設計 (issue #1391)

## 1. 目的

2026-10-26 に、公開 repo の HEAD と公開済みの Pack に、個人の email アドレス・個人名・個人アカウント名と、社内の私有 repo の名前とその実測が残っていた (issue #1391)。既存の `src/lint/secret-scan.ts` は token と鍵の形だけを見るので、これらは素通りした。PO は git の履歴と既存の tag を書き換えないと決めた (2026-10-26)。したがって、一度 main に merge された漏れは取り消せない。

本設計は、次の 2 つを検出して CI と Pack の配布を止める検査 (privacy scan) を定める。

1. **一般的な個人情報の型**: 個人の email アドレス (§3)。除外の規則を一致したアドレスごとに持つ。
2. **私有の denylist**: 私有の repo 名・個人名・個人アカウント名など、公開 repo に書けない語の正規表現の列 (§4)。中身は公開 repo に置かず、GitHub の Actions secret `PRIVACY_DENYLIST` に PO が登録する。AI のランタイムは値を扱わない。

出力には path と行番号と種類だけを出し、一致した文字列・行の内容・denylist の中身を出さない (§8)。公開 repo の CI ログは誰でも読めるので、ログ経由で secret の中身が漏れることを防ぐためである。

## 2. 検査の種類と対象

検査は次の 3 つの方式 (mode) で同じ判定関数を使う。どの方式も、入力の行を `\n` で分け (CRLF は LF に直す)、1 始まりの行番号で報告する。NUL バイトを含む内容は binary とみなして走査せず、件数だけを `skipped` に数える。テキストは UTF-8 として読み、読めないバイトは置換文字にする (読めない 1 バイトのためにファイル全体を飛ばさない)。

| mode | 入力 | 使う場所 | baseline |
|---|---|---|---|
| `tree` | 指定した commit (既定は `HEAD`) の tracked file 全て (`git ls-tree -r` と blob の読み出し。作業木と untracked は読まない) と、その path の文字列 | CI (PR と main への push)、手元の確認 | 適用する (§6) |
| `diff` | PR の範囲 (`git merge-base <base> <head>` から `<head>` まで) の **commit ごと**の追加行 (`+` で始まる行。`+++` の見出し行は除く) と追加・rename 先の path、および範囲内の全 commit の author と committer (名前と email) と commit message | CI (pull_request) | 適用しない |
| `pack` | Pack の配布物の artifact の全て (拡張子で絞らない。`runDistributionSecretScan` と同じ artifact の列で、team の yaml は同じく追跡中の blob の写しを読む) と、その path の文字列 | `ut-tdd distribution sync-stage` / `sync-pack` / `package` の、書き出しの前 | 適用しない |

- **`diff` が commit ごとに読む理由**: この repo は merge commit で取り込むので、PR の途中の commit も main の履歴に残る。途中の commit で足して後の commit で消した漏れは、HEAD の木 (`tree`) には現れないが、merge すると公開の履歴に残り、書き換えない (PO 決定)。`scripts/git-hooks/secret-scan-diff.ts` が commit ごとの blob を読むのと同じ理由である。追加行の行番号は、その commit の差分の hunk 見出し (`+c,d`) から求めた、その commit の時点のファイルの行番号である。merge commit の内容は `--no-merges` で除く (取り込んだ base の内容は `tree` が見る) が、author・committer・message は merge commit を含めて見る。
- **`diff` が commit のメタを見る理由**: 履歴の書き換えが必要になった A-129 の原因は、commit の author の email だった。author と committer の email が個人のものなら、merge で公開の履歴に残る。
- **`tree` を PR でも流す理由**: `diff` は既存の内容を見ないので、denylist に語を足したときに既にある当たりを見つけられない。また、merge の衝突解消で入った行は `--no-merges` の外にある。`tree` は PR の merge 結果の木 (CI の checkout の `HEAD`) を見て両方を拾う。
- path も検査の対象である。ファイル名やディレクトリ名に私有の名前や email を含めても漏れになるためである。

## 3. 一般の個人情報の型 (email) と除外

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
- 除外は email の判定だけに効く。denylist (§4) は除外したアドレスにも掛かる。GitHub の `users.noreply.github.com` のアドレスはローカル部にアカウント名を含むので、個人のアカウント名は denylist で捕まえる。
- 個人名・電話番号・住所の一般の型はこの検査では見ない (§13)。個人名は一般の型で判定できないので denylist で扱う。

## 4. 私有の denylist

- **置き場**: GitHub の Actions secret `PRIVACY_DENYLIST`。公開 repo のファイル・PR・issue・ログに中身を書かない。PO が登録と更新を行い、AI のランタイムは値を読まない・書かない・表示しない。
- **形式**: UTF-8 のテキスト。1 行に JavaScript の正規表現の本体 (`/` で囲まない) を 1 個書く。CRLF は LF に直す。前後の空白を除いて空の行と、`#` で始まる行は無視する。各行は flag `iu` (大文字小文字を区別しない、Unicode) で compile する。
- **照合**: 内容の各行、path の文字列、commit の author と committer (名前と email の各 1 行)、commit message の各行に、全ての entry を掛ける。行をまたいだ一致はしない。除外も行単位の許可も無い。
- **解釈の結果**: 値が無い (環境変数が未定義)、空、または無視する行だけ → `absent`。全ての entry が compile できる → `provided`。compile できない entry が 1 個でもある → `invalid` (どの entry かは secret の中の行番号だけで示す)。`invalid` は §5 の `requireDenylist` に関わらず fail-close する。

## 5. secret が無いときの扱い

`requireDenylist` は呼び出し側が明示する入力であり、環境変数 (`GITHUB_ACTIONS` など) から推測しない。

| 呼び出し | `requireDenylist` | denylist が `absent` のとき |
|---|---|---|
| CI の step (pull_request と main への push) | true | `privacy-denylist-unavailable` で fail-close |
| `distribution sync-pack` / `distribution package` | true | 同上。書き出しの前に止める |
| `distribution sync-stage` (手元の staging、配布しない) | false | email だけで判定し、`denylist=unavailable` を出力の末尾に出す |
| 手元の確認 (`scripts/privacy-scan.ts` の既定) | false | 同上 |

- **fork からの PR**: GitHub は fork からの `pull_request` に secret を渡さないので、denylist が `absent` になり赤になる。これを fail-safe として受け入れる。理由: denylist で確かめていない変更を通すと、私有の名前が確かめられないまま merge されうる。merge した漏れは取り消せない (§1)。現行の運用では、両方の lane が同じ repo の branch から PR を出しており、fork からの PR は無い。secret を fork のコードに渡す `pull_request_target` は、信頼できないコードに secret を渡すので使わない。
- **手元を false にする理由**: 手元は早く気づくための補助であり、正本は CI である。AI のランタイムは denylist の値を持たない (issue #1391 の「AI は値を扱わない」) ので、手元で必須にすると手元の確認そのものが使えなくなる。
- **`sync-pack` と `package` を true にする理由**: 配布物は公開され、tag を書き換えないので取り消せない。`sync-stage` は手元の staging に書くだけで配布しないので false とする。
- 空の値 (登録されていない secret を GitHub は空文字列として渡す) は `absent` と同じに扱う。

## 6. 既存の当たりと baseline

- 既存の当たりは **`docs/governance/privacy-scan-baseline.json`** に、path ごとに許す種類の列 (`["email"]`、`["denylist"]`、`["denylist", "email"]`) として、1 path 1 行、path の昇順で記録する。件数や行番号は記録しない (`diff` が追加行を全て止めるので、baseline の path に当たりが増える経路は PR には無い。件数を持つと、denylist の件数は secret を持たない AI が測れない)。
- **効く範囲**: `tree` の、その path の、列にある種類の当たりだけを許す。`diff` と `pack` には効かない。baseline の path の中の行を書き換えて当たりを含む行を足すと、`diff` が止める。baseline の path が Pack の配布物に入れば、`pack` が止める。
- **path が当たりを含むときは baseline に置けない**: baseline の JSON 自体も `tree` の走査対象なので、当たりを含む path を書けば baseline のファイルが当たる。そうした path は名前を変えて直す。
- **初期値**: 本書に path を固定しない。実装 PR (Green) の head の `tree` で当たりがある path を記録し、同じ Green PR で入れる。issue #1391 の完了条件は、私有の名前が残る既存の PLAN 文書 1 本を、#1365 で消えるまで baseline で扱うよう求めている。Green の時点で消えていれば記録しない。denylist の当たりは secret を持つ CI でしか測れないので、Green の CI が §7 の `privacy-stale-baseline` と当たりの finding で記録の過不足を確かめる。
- **縮小のみ**: `git merge-base HEAD origin/main` の commit にある baseline を比較元 (`previousBaseline`) とする。比較元に無い path を足す、または path の列に種類を足すと `privacy-baseline-grown` で fail-close する。path を消す・種類を減らすのは許す。比較元にファイルが無いときは初回とみなして比較を省く (code-size gate §5 と同じ)。merge-base を解決できない・比較元を読めない・解釈できないときは `privacy-baseline-base-unreadable` で fail-close する。git の起動には `windowsHide: true` を付ける (issue #693)。
- **初回の後に見つかった当たり**: PO が denylist に語を足して main に既存の当たりが見つかったときは、baseline に足せない (縮小のみ)。当たりを伏せる PR (行を消すか書き換える。消す行は追加行ではないので `diff` に当たらない) で直す。
- **stale**: baseline の path が `tree` の対象に無い → `missing-file`。列にある種類の当たりが 0 件 → `no-hit`。denylist が `absent` のときは、`denylist` の種類の `no-hit` は判定せず、出力の末尾に `denylist=unavailable` を出す。

## 7. 判定規則と finding

finding は `location`、`line`、`kind`、`reason` を持つ。`location` の形は §8 で定める。

1. **`privacy-email-hit`** (fail-close)。§3 の email の形に一致し、除外に当たらない。1 行に複数あっても 1 件とする。
2. **`privacy-denylist-hit`** (fail-close)。§4 の entry のどれかが一致した。1 行に複数の entry が一致しても 1 件とする。どの entry が一致したかは持たない。
3. **`privacy-denylist-unavailable`** (`requireDenylist` が true のときだけ、fail-close)。`location` は `denylist`、`line` は 0。
4. **`privacy-denylist-invalid`** (常に fail-close)。`location` は `denylist`、`line` は compile できない entry の secret の中の行番号。entry ごとに 1 件。
5. **`privacy-stale-baseline`** (fail-close)。`reason` は `missing-file` か `no-hit` (§6)。
6. **`privacy-baseline-grown`**、**`privacy-baseline-base-unreadable`** (fail-close)。§6。
7. **`privacy-baseline-unreadable`** (fail-close)。現在の baseline のファイルがあるのに解釈できない (壊れた JSON、未知の種類、種類の重複、配列でない値)。ファイルが無いのは空の baseline であり、finding にしない。
8. **`privacy-input-unreadable`** (fail-close)。`tree` と `pack` で走査できる入力が 1 本も無い、または adapter が git や artifact を読めなかった。入力が読めないことを当たりなしと取り違えない。

- `tree` で baseline が許した当たりは finding にしない (件数は summary の `baselined` に数える)。
- `ok` は finding が 0 件のときだけ true。finding は `location`、`line`、`kind`、`reason` の順で一意に並べ、入力の順序に依存しない。

## 8. 出力の形 (一致した文字列を出さない)

finding ごとに 1 行 `<location>:<line>:<kind>[:<reason>]` を出し、末尾に `privacy-scan mode=<mode> checked=<走査した単位の数> skipped=<binary の数> email=<件数> denylist=<件数 | unavailable> stale=<件数> baselined=<件数> baseline=<baseline の path の数>` を出す。

| 単位 | `location` | `line` |
|---|---|---|
| `tree` のファイルの内容 | `<path>` | ファイルの行番号 |
| `pack` の artifact の内容 | `pack:<path>` | artifact の行番号 |
| `diff` の追加行 | `<path>@<commit の先頭 12 桁>` | その commit の時点の行番号 |
| `diff` の commit のメタ | `commit:<commit の先頭 12 桁>:author` / `:committer` / `:message` | author と committer は 1、message は行番号 |
| path の文字列 | (下の規則) | 0 |

- **path 自体が当たりを含むとき**は、その path を平文で出さない。その path に関する全ての finding (path の当たりと内容の当たり) の `location` の path の部分を `path-sha256:<path の UTF-8 の sha256 の 16 進 64 桁>` に置き換える (`pack:` などの前置きと `@<commit>` は残す)。手元で探すときは、`git ls-files` の各 path の sha256 と突き合わせる。
- **出力の語彙を閉じる**: 出力に出してよいのは、当たりを含まない path、数字、commit の 16 進、sha256 の 16 進、本節と §7 の固定の語だけである。一致した部分文字列、行の内容、denylist の entry、正規表現の compile の例外のメッセージ (JavaScript の例外は正規表現の本体を含む) を出さない。Pack の JSON の出力 (`privacyScan`) も同じ値だけを持つ。
- 件数が多くても全ての finding を出す (途中で切ると、どれを直したかを CI の往復で確かめられなくなる)。

## 9. module の境界

**新しい module に分ける**: 純粋関数は `src/lint/privacy-scan.ts`、I/O (git、artifact、環境変数の読み出し) は `src/lint/privacy-scan-inputs.ts` に置く。`src/lint/secret-scan.ts` には足さない。理由は次のとおりである。

1. **判定の意味が違う**: `secret-scan.ts` は、ファイルと pattern の組ごとに最初の 1 行だけを報告し、行の語 (`ALLOW_LINE_MARKERS`) で行ごと許す。本検査は、一致したアドレスごとの除外 (§3) と、全ての行の報告 (baseline と行番号、§6・§8) が要る。同じ関数に 2 つの意味を持たせると、片方の規則を緩める変更が他方を緩める。
2. **入力が違う**: `secret-scan.ts` の system scan は作業木の `docs/` と `.ut-tdd/` の一部を拡張子で絞って読む。本検査は commit の木の全 tracked file、commit ごとの追加行、commit のメタ、Pack の全 artifact を読む。
3. **secret を持つ範囲を小さくする**: 本検査は secret を入力に持つ。secret を持つ process が node の組み込み module 以外を読まないこと (§12) を import の閉包で確かめるには、secret を扱う module を小さく分けておく必要がある。`secret-scan.ts` は doctor と distribution から広く読まれ、本検査の不変条件をそこへ持ち込むと既存の呼び出し側の制約になる。
4. **量**: code-size gate の上限 (`src` 500 行、`docs/design/harness/L6-function-design/code-size-gate.md`) の内側で、1 module 1 責務を保つ。

**再利用するもの**: Pack の artifact の列は `src/cli/distribution.ts` の `runDistributionSecretScan` と同じものを使い、その隣で呼ぶ。`scripts/git-hooks/secret-scan-diff.ts` (手元の pre-push、既定は warn) の `analyzePiiScan` は本書の範囲では変えない (§13)。

## 10. 関数のシグネチャ (純粋関数と I/O の adapter)

純粋関数はファイルも git も環境変数も読まない。

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `findEmailHitLines` | `findEmailHitLines(unit: PrivacyUnit) => number[]` | 単位 | 除外に当たらない email を含む行番号 (昇順、重複なし) | 一致ごとに除外を判定する | `CANDIDATE-U-PRIVSCAN-001`, `002` |
| `parsePrivacyDenylist` | `parsePrivacyDenylist(raw: string \| undefined) => PrivacyDenylist` | 値か undefined | `{ kind: "absent" }` / `{ kind: "provided"; entries: readonly RegExp[] }` / `{ kind: "invalid"; entryLines: readonly number[] }` | 例外のメッセージを外へ出さない | `CANDIDATE-U-PRIVSCAN-003` |
| `parsePrivacyBaseline` | `parsePrivacyBaseline(sourceText: string) => PrivacyBaseline \| null` | 文字列 | 解釈できなければ `null` | 壊れた入力を空とみなさない | `CANDIDATE-U-PRIVSCAN-011` |
| `analyzePrivacyScan` | `analyzePrivacyScan(input: PrivacyScanInput) => PrivacyScanResult` | 入力は §12 の Pre | `{ ok, findings, summary }` (§7) | 純粋。入力順に依存しない。出力は §8 の語彙だけ | `CANDIDATE-U-PRIVSCAN-004`〜`010`, `012` |
| `privacyScanMessages` | `privacyScanMessages(result: PrivacyScanResult) => string[]` | 結果 | §8 の行 | 語彙が閉じている | `CANDIDATE-U-PRIVSCAN-005` |
| `loadTreePrivacyUnits` | `loadTreePrivacyUnits(repoRoot: string, rev: string) => { kind: "found"; units: PrivacyUnit[]; skipped: number } \| { kind: "unreadable" }` | repo root と commit | 木の全 tracked file と path | 作業木を読まない | `CANDIDATE-U-PRIVSCAN-013` |
| `loadDiffPrivacyUnits` | `loadDiffPrivacyUnits(repoRoot: string, range: { base: string; head: string }) => { kind: "found"; units: PrivacyUnit[] } \| { kind: "unreadable" }` | 範囲 | commit ごとの追加行・path・メタ | 読めない git を差分なしにしない | `CANDIDATE-U-PRIVSCAN-013` |
| `loadPreviousPrivacyBaseline` | `loadPreviousPrivacyBaseline(repoRoot: string) => { kind: "found"; baseline: PrivacyBaseline } \| { kind: "absent" } \| { kind: "unreadable" }` | repo root | §6 の比較元 | 読めない比較元を `absent` にしない | `CANDIDATE-U-PRIVSCAN-013` |
| `readPrivacyDenylistFromEnv` | `readPrivacyDenylistFromEnv(env: NodeJS.ProcessEnv) => PrivacyDenylist` | 環境 | `PRIVACY_DENYLIST` だけを読み `parsePrivacyDenylist` に渡す | 他の変数を読まない | `CANDIDATE-U-PRIVSCAN-013` |
| `checkPrivacyScan` | `checkPrivacyScan(options: PrivacyScanOptions) => { messages: string[]; ok: boolean }` | `{ repoRoot, mode, rev?, range?, requireDenylist, env }` | adapter を合成し `analyzePrivacyScan` を呼ぶ | 例外を握りつぶさない | `CANDIDATE-U-PRIVSCAN-015`, `016` |
| `scanPackPrivacy` | `scanPackPrivacy(input: { artifacts: readonly { path: string; text: string }[]; requireDenylist: boolean; env: NodeJS.ProcessEnv }) => PrivacyScanResult` | Pack の artifact | `mode=pack` の結果 | baseline を読まない | `CANDIDATE-U-PRIVSCAN-014` |

`PrivacyUnit` は `{ source: "tree" | "pack" | "diff" | "commit-meta"; path: string | null; commit: string | null; field: "content" | "path" | "author" | "committer" | "message"; lines: readonly { line: number; text: string }[] }`。`PrivacyScanInput` は `{ mode: "tree" | "diff" | "pack"; units: readonly PrivacyUnit[]; skipped: number; denylist: PrivacyDenylist; requireDenylist: boolean; baseline: PrivacyBaseline | null; baselineUnreadable: boolean; previousBaseline: { kind: "found"; baseline: PrivacyBaseline } | { kind: "absent" } | { kind: "unreadable" } | null }` (`baseline` 以下は `tree` だけが使い、他の mode は `null` と `false` を渡す。`max-source-params` に合わせて 1 つの object にまとめる)。`PrivacyBaseline` は `Readonly<Record<string, readonly ("email" | "denylist")[]>>`。

## 11. 配線と PR の順序

- **CI**: `.github/workflows/harness-check.yml` の `harness-check-linux` に step を 1 本足す。置き場は `checkout` の直後で `install deps (frozen)` より前 (既存の `oracle baseline ratchet` の step と同じく、依存を入れる前に repo の TS を node で動かす)。lane の判定 (`classify`) に依らず、doc lane でも skip しない (漏れの主な経路は文書であるため)。`PRIVACY_DENYLIST: ${{ secrets.PRIVACY_DENYLIST }}` はこの step の `env` にだけ置き、job や workflow の `env` に置かない。pull_request では `node scripts/privacy-scan.ts --mode tree --require-denylist` と `--mode diff --base <pull_request.base.sha> --head <pull_request.head.sha> --require-denylist` を流し、main への push では `--mode tree --require-denylist` だけを流す。`harness-check` は唯一の Required Status Check なので、赤は merge を止める。`.github/workflows/security.yml` には置かない (非 required の補助検査であり、赤でも merge を止めないため)。Windows の job には置かない (内容は OS に依らない)。
- **入口**: `scripts/privacy-scan.ts` は引数を読み `checkPrivacyScan` を呼んで exit 0 / 1 を返すだけの薄い入口とする。入口から import の閉包をたどって、node の組み込み module 以外を読まない (§12)。`ut-tdd` の CLI には足さない (CLI は依存の package を読むので、secret を持つ process に入れない)。読み取りだけを行い、harness.db にも `.ut-tdd/` にも書かない。
- **Pack**: `src/cli/distribution.ts` の `sync-stage` / `sync-pack` / `package` で、`runDistributionSecretScan` と同じ artifact の列に `scanPackPrivacy` を掛け、`ok` でなければ書き出しの前に止める (secret-scan と同じ止め方)。`requireDenylist` は §5 の表のとおり。JSON の出力には `privacyScan: { ok, checked, findings }` を足す (finding は §8 の値だけ)。
- **doctor には配線しない**: doctor は secret を持たず、CI では CI の step が正本になる。同じ検査を 2 か所で流さない。
- **PO の作業**: Green の CI が通る前に、PO が `PRIVACY_DENYLIST` を Actions secret に登録する (登録が無いと、Green の CI は `privacy-denylist-unavailable` で赤になる)。Pack を配る手元でも、PO が同じ値を環境変数 `PRIVACY_DENYLIST` に置く (PowerShell では `$env:PRIVACY_DENYLIST = Get-Content -Raw <repo の外のファイル>`)。
- **PR の順序** (設計書保護 gate §10.3 の三段階): (0) 本書と L7 の契約 PR、(1) 登録 + Red PR (実 repo を読む 015 と 016 は `src/doctor/test-repository-isolation.ts` の `repositoryReadContracts` へ登録行を足す。テスト名は候補 ID を引用する)、(2) src を含まない昇格 PR (`CANDIDATE-U-PRIVSCAN-*` を `U-PRIVSCAN-*` へ 1:1 で昇格)、(3) 実装 PR (Green。`src/lint/privacy-scan*.ts`、`scripts/privacy-scan.ts`、CI の step、distribution の配線、`docs/governance/privacy-scan-baseline.json` の初期値)。

## 12. 不変条件 (DbC)

- Pre: 入力は mode、走査する単位の列、binary として飛ばした数、解釈済みの denylist、`requireDenylist`、`tree` のときは現在の baseline と比較元。読み取りだけを行い、ファイルを書かない。
- Post: `ok` は §7 の finding が 0 件のときだけ true。finding は入力の順序に依存せず一意に並ぶ。同じ入力から同じ出力を返す (純粋性)。
- Invariant (秘密): 出力 (メッセージ、finding、Pack の JSON、例外のメッセージ) は §8 の語彙だけからなり、一致した文字列、行の内容、denylist の entry、当たりを含む path の平文を含まない。`PRIVACY_DENYLIST` を読む process は、入口から import の閉包をたどって node の組み込み module 以外を読まない。denylist の値をファイルにも harness.db にも書かない。
- Invariant (fail-safe): 読めない入力 (git、artifact、baseline、比較元、denylist) を、当たりなし・空・比較なしと取り違えない。`requireDenylist` が true のとき、denylist なしで `ok=true` を返さない。baseline は `tree` にしか効かず、縮小しかできない。
- Invariant (判定): email の除外は一致したアドレスごとに判定し、行の語で行ごと許さない。denylist には除外が無い。

## 13. 範囲外

- git の履歴と既存の tag の書き換え (PO 決定、2026-10-26)。
- 個人名・電話番号・住所の一般の型。個人名は denylist で扱う。`scripts/git-hooks/secret-scan-diff.ts` の手元の pre-push (電話番号・郵便番号・internal URL・email、既定は warn) は変えない。email の判定を本 module に寄せて定義を 1 つにする変更は、Green の後に別の Issue で扱う。
- GitHub が merge のときに作る merge commit の author と committer。PR の範囲の外で、CI の後に作られるので、本検査は見ない。
- Pack の repo 側の commit のメタと Pack の repo の CI。
- binary の中の文字列 (画像の metadata など)。
- denylist の中身の決定と登録 (PO が行う)。

## 14. 根拠

- issue #1391 (背景・PO 決定・完了条件)。伏せる作業は PR #1389。
- 型の手本: `docs/design/harness/L6-function-design/code-size-gate.md` (§5 の縮小のみの baseline と merge-base の比較元)。commit ごとの blob を読む理由: `scripts/git-hooks/secret-scan-diff.ts` の設計注記。
- 2026-10-26 の `origin/main` (`31b8fd97e`) の tracked file 全てに、§3 の形と除外を実装した使い捨ての script (repo に置いていない。Green の実装が正本になる) を掛けた。email の形の一致は 111 件で、E1 が 74 件、E3 が 20 件 (`tests/` の 8 ファイル 18 行と本書・L7 の各 1 行)、E2 が 15 件、E4 が 1 件 (`package-lock.json` の第三者の package の情報) を除き、除外の外に残るのは PR #1389 が伏せる監査記録の 1 行だけだった。E3 が無いと `tests/` の SSH の remote の形が当たる。直近 500 個の merge でない commit の author と committer の email は、全て `users.noreply.github.com` (E2) だった。
