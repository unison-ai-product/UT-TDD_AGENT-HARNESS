---
title: "L7 worktree safe remove test design"
artifact_type: test_design
layer: L6
executed_at_layer: L7
status: draft
pair_artifact: docs/design/harness/L6-function-design/worktree-safe-remove.md
parent_doc: docs/design/harness/L6-function-design/worktree-safe-remove.md
created: 2026-10-14
updated: 2026-10-14
---

# worktree safe remove (issue #661) — L7 test design

## 1. 位置付け

`docs/design/harness/L6-function-design/worktree-safe-remove.md` の pair artifact。`PLAN-L6-661` の本文にだけあった oracle 候補 O1-O27 を `CANDIDATE-WTRM-O*` として移した (設計還流 issue #958)。いずれも未実装で、正規 ID (`U-WTRM-*`) への昇格は実装 PR (S2 / S3) で行う。

## 2. 共通の oracle 規則

- 実 worktree の削除テストは、共有 node_modules を指す junction を使わず、隔離した fixture (temp の bare repo + worktree + fixture 内の偽 `node_modules` 実体) だけで行う。primary の `node_modules` と `.ut-tdd/harness.db` には触れない。
- 各 candidate は、表の mutation を入れたら RED になることを実装 PR で示す。

## 3. 候補 oracle

「S3」は command (`ut-tdd worktree remove`)、「S2」は guard の実装 PR で freeze する。

| ID | 対象 | 入力 | 期待 | mutation (入れたら RED) |
|---|---|---|---|---|
| `CANDIDATE-WTRM-O1` | S3 | fixture の worktree に fixture 内実体への junction | C5 で link だけ外れ、link 先の実体ファイル数が不変、remove 成功 | C5 を `fs.rmSync(path, {recursive:true})` に置換 |
| `CANDIDATE-WTRM-O2` | S3 | C5 の unlink を成功扱いで返すが link を残すよう port に注入 (例外も失敗コードも出さない) | C6 の `lstat` 不在確認で停止し非 0。`git worktree remove` の呼び出し回数 0 | C6 の不在確認を削除 |
| `CANDIDATE-WTRM-O3` | S3 | `<wt>/node_modules` が実体ディレクトリ | C6 で拒否、remove 0 | C6 を「link でなければ可」に緩める |
| `CANDIDATE-WTRM-O4` | S3 | tip が `origin/main` の祖先でない | C2 で拒否、remove 0 | 判定を `branch -r --contains` に置換 (fixture に remote branch を置く) |
| `CANDIDATE-WTRM-O5` | S3 | O4 + `--allow-unmerged --reason ""` | 拒否 (空 reason は不可) | reason の非空検査を削除 |
| `CANDIDATE-WTRM-O6` | S3 | `<wt>` が primary checkout | C1 で拒否 | primary 照合を削除 |
| `CANDIDATE-WTRM-O7` | S3 | C8 で件数 N が減る (port で注入) | 非 0 + `npm ci` 案内 | C8 を存在確認だけに緩める |
| `CANDIDATE-WTRM-O8` | S2 | `git worktree remove C:/x` で `C:/x/node_modules` あり | deny | G2 の存在判定を「junction のときだけ」に緩める (実体ケースで RED) |
| `CANDIDATE-WTRM-O9` | S2 | `for w in <fx>/a; do git worktree remove "$w"; done` (対象を一意に決められず G2 は判定しない。literal `$w/node_modules` は存在しない) | deny (G3 のみが根拠) | G3 を削除 (allow になる) |
| `CANDIDATE-WTRM-O10` | S2 | `cmd //c mklink /J C:/x/node_modules C:/y/node_modules` と `New-Item -ItemType Junction` | 両方 deny | G4 の pattern から 1 形式を削除 (その形式で RED) |
| `CANDIDATE-WTRM-O11` | S2 | `ut-tdd worktree remove C:/x` (`C:/x/node_modules` あり) | allow | command 名照合 (`git` に限る) を外し「任意の command 名 + `worktree remove`」を対象にする (正規 command を誤 deny) |
| `CANDIDATE-WTRM-O12` | S2 | `.codex/hooks.json` だけから guard 配線を外す | doctor rule-drift fail | 両ランタイム照合を片側だけにする |
| `CANDIDATE-WTRM-O13` | S3 | `git fetch` を失敗させる (port で注入)、`--offline` なし | C2 で拒否、remove 0 | fetch 失敗時にローカル `origin/main` で続行させる |
| `CANDIDATE-WTRM-O14` | S3 | `--offline --reason "x"` | 判定続行 + `worktree-remove-offline.jsonl` に 1 行 (reason・tip・origin/main sha) | 監査記録を削除 |
| `CANDIDATE-WTRM-O15` | S2 | `gh issue comment 1 --body "git worktree remove C:/x"` | allow | segment 先頭判定を語の包含判定に置換 |
| `CANDIDATE-WTRM-O16` | S2 (N1) | `for w in C:/a; do git worktree remove C:/a; done` (`C:/a/node_modules` あり) | deny (G2) | N1 の `do` 剥がしを削除 |
| `CANDIDATE-WTRM-O17` | S2 (N1) | `if true; then git worktree remove C:/a; fi` と `else git worktree remove C:/a` | 両方 deny | N1 から `then` / `else` の一方を削除 |
| `CANDIDATE-WTRM-O18` | S2 (N2) | `& git worktree remove C:/a` | deny | N2 を削除 |
| `CANDIDATE-WTRM-O19` | S2 (N3) | `env git worktree remove C:/a` と `MSYS_NO_PATHCONV=1 git worktree remove C:/a` | 両方 deny | N3 から `env` か `NAME=value` の一方を削除 |
| `CANDIDATE-WTRM-O20` | S2 (N4 値付き) | (a) `git -C <fx>/repo worktree remove <fx>/b` と `git -c core.x=y worktree remove <fx>/b` (`<fx>/b/node_modules` なし、他の deny 条件なし)、(c) `git -C <fx> worktree remove a` (相対 path、`<fx>/a/node_modules` あり、cwd 側には無い) | (a) 両方 allow、(c) deny (G2) | `-C` か `-c` の一方を値付き option 表から外す (a が誤 deny)。`-C` による解決基準を外す (c が cwd 基準で allow) |
| `CANDIDATE-WTRM-O21` | S2 (N4 + G3) | `git -C "$R" worktree remove <fx>/a` (`<fx>/a` は存在し `<fx>/a/node_modules` は存在しない。他の deny 条件は成り立たない) | deny (`-C` 値の検査不能だけが根拠) | `-C` 値の検査不能判定を削除 |
| `CANDIDATE-WTRM-O22` | S2 (N4 一般化) | `git --no-optional-locks worktree remove <path>`。(a) deny 側 `<fx>/a` (`node_modules` あり)、(b) allow 側 `<fx>/b` (`node_modules` なし) | (a) deny (G2)、(b) allow | M1: N4 を `-C` / `-c` だけ除去・fail-close なしの形に戻す ((a) が allow)。M2: 一般化読み飛ばしだけを削除し fail-close は残す ((b) が誤 deny) |
| `CANDIDATE-WTRM-O23` | S2 (N4 一般化) | `git --git-dir=<fx>/repo/.git worktree remove <path>`。(a) / (b) は O22 と同じ | (a) deny、(b) allow | O22 と同じ M1 / M2 |
| `CANDIDATE-WTRM-O24` | S2 (N4 値付き、allow 側で判別) | `git --work-tree <fx>/repo worktree remove <fx>/b` (`<fx>/b/node_modules` は存在しない。他の deny 条件は成り立たない) | allow | 値付き option の直後 token の読み飛ばしを削除 (`<fx>/repo` を subcommand と取り違え、N4 fail-close で誤 deny) |
| `CANDIDATE-WTRM-O25` | S2 (N4 組合せ) | `git -c a=b -C <fx>/repo --no-pager worktree remove <path>`。(a) / (b) は O22 と同じ | (a) deny、(b) allow | O22 と同じ M1 / M2 |
| `CANDIDATE-WTRM-O26` | S2 (N4 fail-close) | `git --unknown-opt v worktree remove <fx>/a` (`<fx>/a/node_modules` は存在しない) | deny (G3 の fail-close だけが根拠) | N4 の fail-close を削除 (`v` を subcommand とみなして allow) |
| `CANDIDATE-WTRM-O27` | S2 (N4 fail-close の範囲) | `git commit -m "worktree remove"` | allow | fail-close を引用符内まで広げる (誤 deny) |

保証外 (D4 / G7: 入れ子実行) の挙動は oracle として固定しない。
