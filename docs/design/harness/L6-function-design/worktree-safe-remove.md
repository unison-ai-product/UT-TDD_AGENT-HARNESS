---
artifact_type: design_doc
layer: L6
status: draft
sub_doc: function-spec
plan: docs/plans/PLAN-L6-661-worktree-safe-remove-contract.md
pair_artifact: docs/test-design/harness/L7-worktree-safe-remove-test-design.md
---

# worktree 物理削除の正規経路と node_modules junction guard の契約 (issue #661)

状態: 未実装の目標契約。`ut-tdd worktree remove` も repo 管理の worktree guard (hook) も `src/` / `.claude/` / `.codex/` に存在しない (2026-10-14 実測: `git grep -E "worktree-guard|worktree remove" -- src .claude .codex scripts tests` が 0 件)。暫定対策は、このPCの Claude の `.claude/settings.local.json` (gitignore 対象) から呼ぶ user 側の `worktree-remove-guard.mjs` だけで、Codex 側と他の PC には guard が無い。本契約はこれを repo 管理の両ランタイム guard と正規 command に置き換える。

## 1. 背景と既存機構との境界

worktree を畳むときに `git worktree remove` が `node_modules` の directory junction を辿り、primary checkout の `node_modules` を空にする事故が通算 5 回起きた (2026-09-16、2026-09-18 に 2 件、2026-10-05 に 2 件)。どの回も「先に junction を外す」手順は知られていたが、外す処理 (`cmd //c rmdir`) が quoting や MSYS の path 変換で失敗し、その失敗を見ないまま `git worktree remove` に進んでいた。prose の手順では止まらないことは 5 回で確定している。

- PLAN-L7-501 / L7-513 (worktree lifecycle) は create・terminal handoff・lease 解放までを扱う。物理的な `git worktree remove` を行う adapter / CLI は無く (`src/runtime/worktree-lifecycle/application/service.ts` は create / handoff / lease のみ)、`retire` は状態遷移で junction の unlink を保証しない。
- PLAN-L7-476 (worktree topology PF2 collector) は realpath と reparse point を観測できるが read-only で削除しない。
- issue #426 (legacy worktree の dry-run・quarantine・receipt 付き回収) と #794 (owner / TTL) は、どれを畳むかを決める上位の仕組みである。本契約は 1 本を安全に畳む primitive だけを持ち、#426 / #794 の apply 段は本 command を呼ぶ側に回る (二重実装しない)。

## 2. 設計判断 (advisor `claude-fable-5`、2026-10-05、verdict SURVIVE 条件付き、override なし)

advisor の条件と対応: (1) `npm ci` の所要を実測して記録 (D2)、(2) guard が Codex に届く経路を明示 (G1)、(3) 依存順 D2 → D1 guard → D3 を固定し junction 前提で guard を作り込まない (5)。

### D1 防御の置き場所 — 採択: C 両方

| 案 | 内容 | trade-off |
|---|---|---|
| A guard のみ | PreToolUse で raw `git worktree remove` を deny | 安いが正しい畳み方を提供せず、deny された agent が `Remove-Item -Recurse` / `rm -rf` に迂回する |
| B command のみ | `ut-tdd worktree remove` を正規経路にし直叩きを prose で禁じる | 直叩きを止める仕組みが prose だけに戻る (5 回失敗した形) |
| **C 両方 (採択)** | command を正規経路にし、guard は「node_modules が残る raw remove」と「node_modules junction 作成」を deny して command へ誘導する | 実装量は最大だが、deny 理由に正規 command を書けて迂回の動機が減る。`ut-tdd pr merge` と `gh pr merge` の関係と同じ形 |

### D2 junction 運用 — 採択: A 禁止 + `npm ci`

worktree でテストが要るなら `npm ci` で実体を入れ、guard は node_modules を対象とする reparse point の作成を deny する。根本原因 (共有実体への reparse point) が消える。却下: junction 継続 + command で削除だけ守る (エディタ・エクスプローラー等の command 以外の削除経路で同じ事故が起きる余地が残る)。

実測 (2026-10-05、Windows 11、node v24.13.0、npm 11.6.2): cold cache (`npm ci --cache <空の一時 dir>`) 122.7 秒、warm 75.3 秒 (どちらも exit 0)、top-level entry 92、`node_modules` 141 MB。事故 1 回の復旧 (primary を使う全 worktree・全ランタイムの停止) より worktree 1 本ごとの待ち時間の方が小さいと判断して A を維持する。テストを走らせない worktree (docs-only 等) では `npm ci` 自体を省いてよい。既存 worktree に残った junction を安全に外す必要があるので D1 の command は不要にならない。

### D3 未 merge の判定 — 採択: A 祖先判定 + 判定前 fetch

`git merge-base --is-ancestor <tip> origin/main` が真なら削除可。偽なら `--allow-unmerged --reason "<text>"` が無い限り拒否する。squash merge された branch は「未 merge」と判定されるが、この repo の merge は merge commit なので実害は小さい。却下: 任意の remote branch に含まれれば可とする (`git branch -r --contains`。PR が close されて remote branch だけ残る場合に誤って可とする)。

鮮度: 判定の直前に `git fetch origin main` を行い、失敗したら fail-close (remove 0)。オフラインで畳むときだけ `--offline --reason "<非空>"` を明示し、ローカルの `origin/main` で判定する。理由・tip sha・使った `origin/main` sha を `.ut-tdd/logs/worktree-remove-offline.jsonl` へ監査記録する (理由なき silent bypass を作らない)。`--allow-unmerged` も同じ jsonl に記録する。detached HEAD の review worktree も同じ判定に従う。

### D4 guard の判定方式 — 採択: segment 先頭 token 判定 + 限定正規化

command 文字列を `;` / `&&` / `||` / `|` / 改行で segment に分け、各 segment に限定正規化を施してから先頭 token 列だけを判定する。限定正規化は次の 4 種 (先頭から繰り返し剥がす)。

- N1 shell 予約語: 先頭の `do` / `then` / `else` (`for w in ...; do git worktree remove "$w"; done` の `do ...` を判定できるようにする)。
- N2 PowerShell の call operator: 先頭の `&`。
- N3 環境変数の前置: 先頭の `env` と `NAME=value` 形の token。
- N4 git の global option (列挙せず一般化): `git` の直後から `-` で始まる token をすべて飛ばし、最初の `-` で始まらない token を subcommand とみなす。別 token で値を取る option (`=` を伴わない `-C` / `-c` / `--git-dir` / `--work-tree` / `--namespace` / `--exec-path` / `--config-env` / `--super-prefix`) は直後の 1 token も値として飛ばす。`--opt=value` 形と値を取らない option (`--no-optional-locks` / `--no-pager` / `-P` / `--bare` 等) はその token だけ飛ばす。`-C <path>` があれば対象 path はその `<path>` を基準に解決する (複数あれば git と同じく順に連結)。`-C` の値が検査できない (変数等) ときは G3 で deny。
- N4 の fail-close: subcommand を決めた後に `worktree remove` と一致しなくても、`git` を command 名とする segment の引用符外の token に連続する `worktree` `remove` が現れるなら検査不能として deny する (表に無い値付き option で値を subcommand と取り違えても素通りさせない保険)。引用符内 (`git commit -m "worktree remove"`) は対象にしない。

判定対象は正規化後の先頭が `git worktree remove`、`mklink /J` (`cmd /c` / `cmd //c` の直後に直接続く形を含む)、`New-Item -ItemType Junction|SymbolicLink`、`ln -s` の 4 形。command 名は `git` / `mklink` / `New-Item` / `ln` に限る (`ut-tdd worktree remove` は対象外、G6)。引用符内の引数 (`gh ... --body "..."` の本文など) は判定せず、語の包含では deny しない。判定対象 segment の path 引数に変数・command substitution・glob が含まれ検査できない場合は deny する (ループで一括削除する使い方を封じる)。

**保証外 (guard は検査しない)**: 入れ子実行 (`sh -c` / `bash -c` / `powershell -Command` / `pwsh -Command` / `cmd /c` の引用符付き文字列、`eval`、script file 経由、`Invoke-Expression`)。中身は parse しない (最小実装原則。shell parser の再実装は作り込みにあたる)。これらへの防御は command 経路のみ (D1 の `ut-tdd worktree remove` を正規経路とする規律と C5-C8 の削除前後検査) で、guard の保証範囲に含めない。

### D5 C5 の走査範囲 — 採択: worktree 直下の `node_modules` のみ

C5 は `<wt>/node_modules` だけを対象にし、配下全体の reparse point 走査は行わない。D2 で junction 作成を禁じるので、直下以外の reparse point を前提にした作り込みは不要。

## 3. `ut-tdd worktree remove <wt>` の契約

入力: `<wt>`、任意の `--allow-unmerged --reason "<非空>"`、任意の `--offline --reason "<非空>"`、任意の `--dry-run`。各段で失敗したら以降を実行せず非 0 で終了し、どこで止まったかを JSON で出す。

| 段 | 内容 |
|---|---|
| C1 対象の確定 | `<wt>` を realpath 化し `git worktree list --porcelain` の登録 path と一致すること。primary checkout (main working tree) と一致したら拒否。cwd が対象内なら拒否 |
| C2 未 merge 判定 | D3 に従う (直前に `git fetch origin main`、失敗は fail-close、`--offline --reason` は監査記録付き)。拒否時は tip sha と判定に使った `origin/main` の sha を出す |
| C3 dirty 判定 | `git -C <wt> status --porcelain` が空でなければ拒否 (`--force` は提供しない。dirty の破棄は責務外) |
| C4 primary の健全性 snapshot (前) | primary の `node_modules` の存在・実体ディレクトリであること・`package-lock.json` の top-level package のうち存在する件数 N を記録 |
| C5 reparse point の解除 | `<wt>/node_modules` が junction / symlink なら、辿らずに link だけを外す (`fs.lstatSync` で判定、Windows junction は `fs.rmdirSync`、symlink は `fs.unlinkSync`。再帰削除 API は使わない)。対象は `<wt>` 直下の `node_modules` だけ (D5)。`lstat` できなければ fail-close |
| C6 不在確認 | C5 の後に `<wt>/node_modules` を `lstat` し存在しないことを確認。実体ディレクトリとして残っていても拒否する (実体の再帰削除も行わない。利用者が先に消す) |
| C7 物理削除 | `git worktree remove <wt>` (`--force` なし) |
| C8 primary の健全性確認 (後) | C4 と同じ観測を取り存在・実体・件数 N が一致すること。不一致なら非 0 で「primary の node_modules が損傷した。`npm ci` で復旧せよ」と出す (削除は取り消せないので検知と案内に留める) |
| C9 branch | branch を削除しない (tip が main に含まれることを別途確かめる既存規律に任せる) |

`--dry-run` は C1-C6 の判定だけを行い、C5 の unlink と C7 を実行しない。

## 4. guard の契約 (両ランタイム)

- G1 置き場と到達経路: repo 管理の TypeScript entrypoint 1 本 (例: `.claude/hooks/worktree-guard.ts`) を両ランタイムから呼ぶ。Claude は `.claude/settings.json` の `PreToolUse` に matcher `Bash|PowerShell` で追加 (agent-guard / work-guard と同じ配線)。Codex は `.codex/hooks.json` の `PreToolUse` に matcher `Bash` で追加する (Codex は shell 実行を PreToolUse の `tool_name=Bash` として渡すことが PLAN-L7-668 §1.1 で実測済み。VS Code 拡張の Codex、hook 実行 shell は `pwsh -NoProfile -Command`。command の形は PLAN-L7-668 §2: `node "$(git rev-parse --show-toplevel)/<script>"`、`args` / `blockOnFailure` なし、block は exit 2)。`.claude/CLAUDE.md` §Hooks の一覧と `rule-drift` の照合 (U-RDRIFT-007) を同時に更新する。
- 未計測範囲: `pwsh` の無い Windows での fallback shell と、`codex exec` (headless) で project hook が発火するか。そこでは guard が届かない可能性があり、Codex 側の防御は command (D1) が担う。実機の deny を 1 回観測し、届かない経路があれば「Codex のその経路は command のみ」と本契約に追記する。
- G2 deny 1: `git worktree remove <path>` で `<path>/node_modules` が (junction / symlink / 実体のいずれでも) 存在する。
- G3 deny 2: 判定対象 segment (D4 の N1-N4 で正規化した後) の `<path>` または `git -C` の値が変数・command substitution・glob を含み検査できない。または N4 の fail-close に該当する。
- G4 deny 3: `node_modules` を link 先または link 名とする junction / symlink の作成 (`mklink /J`、`New-Item -ItemType Junction|SymbolicLink`、`ln -s`、`cmd //c mklink`)。判定は D4 の方式に限る。
- G5 deny 理由には `ut-tdd worktree remove <path>` と `npm ci` を案内として書く。
- G6 `ut-tdd worktree remove` 自身の呼び出し (command 名が `git` でないので G2 の対象外。この除外を command 名照合で明示的に保つ) と、引用符内の引数だけに判定語を含む segment は通す。guard は fail-close (stdin JSON 不正は deny)。
- G7 保証外: D4 の入れ子実行は guard の保証外で command 経路のみで守る。guard はこれらを allow も deny も保証しない。oracle は保証外であることを固定しない (保証外の挙動を test で凍結すると契約になる)。

## 5. 実装の順序と責務どうしの依存

順序契約 (advisor 条件 3): D2 → D1 guard → D3 の順に着工する。

1. **S1 (D2)**: 運用切替。`CLAUDE.md` / メモリの junction 手順を `npm ci` への pointer に置換し、暫定 guard (`.claude/settings.local.json`) の撤去手順を案内する (docs のみ)。guard は junction が新しく作られない前提で書き、junction 前提の作り込みをしない。
2. **S2 (D1 guard)**: S1 の後。test-design へ O8-O12・O15-O27 を freeze (pair-freeze) し、guard entrypoint 1 本と対テスト、`.claude/settings.json` + `.codex/hooks.json` + `.claude/CLAUDE.md` §Hooks の配線、rule-drift の照合追加。deny 理由は `npm ci` と「`ut-tdd worktree remove` は S3 で提供」を案内し、S3 merge 時に command 案内へ差し替える。Codex 側の実機 deny を 1 回観測する。
3. **S3 (command + D3)**: 最後。O1-O7・O13・O14 を freeze し、`src/runtime/worktree-lifecycle/` 配下に物理削除 adapter (source_module 1 個) と対テスト、最小の CLI 配線 (`ut-tdd worktree remove`)。既存 worktree に残った junction の安全な撤去はここで担う。S2 の deny 理由を command 案内へ差し替える。
4. S4 (任意): #426 / #794 の apply 段が本 command を呼ぶ配線。それぞれの PLAN で扱い本契約では行わない。

S2 / S3 の実装 PR (kind=add-impl) は Reverse backfill PLAN を伴う。責務の依存: guard の deny 理由は command の存在を前提にしない (S2 は S3 に先行できる)。command の C5-C8 は D2 の junction 禁止と併せて入れ子実行の防御を担う。

## 6. 検証 oracle

oracle 候補 O1-O27 は `docs/test-design/harness/L7-worktree-safe-remove-test-design.md` に `CANDIDATE-WTRM-O*` として置く。実 worktree の削除テストは共有 node_modules を指す junction を使わず、隔離した fixture (temp の bare repo + worktree + fixture 内の偽 `node_modules` 実体) だけで行い、primary の `node_modules` には触れない。

## 7. 範囲外

どの worktree を畳むかの選定 (owner / TTL / 一括回収。#426 / #794)、dirty worktree の破棄と `--force` 削除と branch の自動削除、primary の `node_modules` の自動復旧 (`npm ci` の自動実行。検知と案内に留める)、`.ut-tdd/harness.db` を含む canonical state の操作。
