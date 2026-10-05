---
plan_id: PLAN-L6-661-worktree-safe-remove-contract
title: "PLAN-L6-661 (add-design): worktree 物理削除の正規経路と node_modules junction
  guard の契約 freeze"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-05
updated: 2026-10-05
owner: Claude control lane (契約起草) / Codex worker (S1-S4 実装) / 非著者 frontier reviewer
parent_design: docs/plans/PLAN-L7-513-worktree-lifecycle-application.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: 既存の worktree lifecycle (PLAN-L7-501 / PLAN-L7-513)
  が持たない物理削除の手順と、その前後条件を L6 で具体化する契約であり、L0-L3 要件の意味を変えない。
agent_slots:
  - role: tl
    slot_label: TL - 削除経路が primary の node_modules を辿らないことを信頼境界として fail-close 条件を freeze する
  - role: se
    slot_label: SE - ut-tdd worktree remove の手順 (unlink → 不在確認 → remove → primary
      健全性確認) と guard の判定規則を定義する
  - role: qa
    slot_label: QA - junction 残存・unlink 失敗・未 merge tip・変数 path の各負系 oracle と mutation を定義する
generates:
  - artifact_path: docs/plans/PLAN-L6-661-worktree-safe-remove-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-513-worktree-lifecycle-application.md
  requires:
    - docs/plans/PLAN-L7-513-worktree-lifecycle-application.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-501-worktree-lifecycle-domain.md
    - docs/plans/PLAN-L7-476-worktree-topology-pf2-os-collector.md
    - docs/plans/PLAN-L7-474-worktree-topology-detector.md
    - docs/plans/PLAN-L7-668-codex-hook-command-schema.md
    - docs/test-design/harness/L7-worktree-lifecycle-application-test-design.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/runtime/worktree-lifecycle/application/service.ts
    - src/runtime/worktree-topology-collector.ts
    - .claude/settings.json
    - .codex/hooks.json
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/661
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/794
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/426
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/384
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 661
admission_receipt:
  schema_version: v2
  receipt_id: certificate:1898edc3fcff044b18b8f1be6bd4631d
  command_id: plan-revise:issue-661:sol-r2-fix:r4:1917ece51224
  admitted_at: 2026-10-05T10:22:38.604Z
  source_digest: sha256:2e6ae8e092854db86d9cd9224474a3a29c5103e0956ec32f752a3da3eae03e23
  decision_digest: sha256:58fe2575e7f4c90152cc47d8b692944950a4dc289057c0991b3c422dacd9dfb9
  receipt_digest: sha256:99acad72278143ef1fb9e66cbd0d9684d600872bc06603f682b6343302da89eb
  binding:
    path: docs/plans/PLAN-L6-661-worktree-safe-remove-contract.md
    plan_id: PLAN-L6-661-worktree-safe-remove-contract
    asset_id: plan:04e1bab46c4ea60bbdbe6ce4773c8a18
    revision: 4
    content_digest: sha256:2e6ae8e092854db86d9cd9224474a3a29c5103e0956ec32f752a3da3eae03e23
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 661
    episode_id: E4-661-worktree-safe-remove
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-513-worktree-lifecycle-application
    revision: 1
    digest: sha256:09eda2251a316d5af39cb0ebbaebb8df50f51699dcb2033a75b2128b5cd27ffd
  reentry:
    target_plan_id: PLAN-L6-661-worktree-safe-remove-contract
    target_revision: 4
    phase: forward_merge
  escape_reason: "Issue 661: PR #838 Sol r2 FLAG 2 件の是正 (correction 2/3)。N4 を git
    global option の一般化読み飛ばし (値付き option は次 token も飛ばす) と引用符外の worktree remove
    連続に対する fail-close に改め、deny oracle O22-O27 を追加する。O9 と O21 の fixture を G3 だけが
    deny 根拠になる形に明記する。方式と scope は変えない"
---

# PLAN-L6-661: worktree 物理削除の正規経路と node_modules junction guard の契約 freeze

## 0. 目的と位置付け

worktree を畳むときに `git worktree remove` が `node_modules` の directory junction を辿り、primary checkout
(`C:/dev/UT-TDD-agent-harness`) の `node_modules` を空にする事故が通算 5 回起きた (issue #661。2026-09-16、2026-09-18 に 2 件、
2026-10-05 に 2 件)。どの回も「先に junction を外す」という手順は知られていた。外す処理 (`cmd //c rmdir`) が quoting や MSYS の
path 変換で失敗し、その失敗を見ないまま `git worktree remove` に進んでいた。**prose の手順では止まらない**ことは 5 回で確定している。

既存の機構との関係は次のとおり。

- PLAN-L7-501 / PLAN-L7-513 (worktree lifecycle) は create・terminal handoff・lease 解放までを扱う。物理的な `git worktree remove`
  を行う adapter / CLI は無い。`retire` は状態遷移であり、junction の unlink を保証しない (issue #661 の Codex 調査コメント)。
- PLAN-L7-476 (worktree topology PF2 collector) は realpath と reparse point を観測できるが、read-only であり削除はしない。
- issue #426 (legacy worktree の dry-run・quarantine・receipt 付き回収) と issue #794 (owner / TTL) は、**どれを畳むか** を決める
  上位の仕組みである。本 PLAN は **1 本を安全に畳む** primitive だけを freeze する。#426 / #794 の apply 段は本 PLAN の
  command を呼ぶ側に回り、二重実装しない。

暫定対策として、このPCの Claude には `.claude/settings.local.json` (gitignore 対象) から user 側の `worktree-remove-guard.mjs` を呼ぶ
PreToolUse(Bash|PowerShell) hook が入っている (issue #661 の 2026-10-05 コメント)。Codex 側と他の PC には guard が無い。
本 PLAN はこれを repo 管理の両ランタイム guard と正規 command に置き換える契約である。

## 1. 設計判断

### 1.0 advisor 相談の記録

- 相談: `ut-tdd advisor --decision design --plan PLAN-L6-661-worktree-safe-remove-contract --execute`
  (advisor model `claude-fable-5`、2026-10-05、起票 rev 1 の D1-D4 と §7 未決 1-4 を入力)。
- verdict: **SURVIVE (条件付き)**。D1 = 両方、D2 = junction 禁止 + `npm ci`、D3 = 判定前 fetch + fetch 失敗で fail-close
  (`--offline` は理由記録 + 監査ログ付きの明示 flag のみ)、D4 = 語の包含では deny しない (segment 先頭 token の判定)、
  C5 = worktree 直下の `node_modules` のみ。
- 条件と対応:

| 条件 | 対応 |
| --- | --- |
| (1) `npm ci` の cold cache / warm の所要を 1 回実測して記録する | §1 D2 の実測欄に記録した (計測コマンドは §8) |
| (2) guard が Codex に届く経路を明示する (pre-shell hook が無ければ Codex 側は command のみと記録する) | Codex は shell 実行を PreToolUse の `tool_name=Bash` として渡すことが PLAN-L7-668 §1.1 で実測済み。§3 G1 に経路と未計測範囲を記録した |
| (3) 依存順 D2 → D1 guard → D3 を §5 で freeze し、junction 前提で guard を作り込まない | §5 の順序契約に記録した |

以下 D1-D4 と C5 の範囲はすべて **採択** である。override は無い。

### D1: 防御の置き場所 (採択: C 両方)

| 案 | 内容 | trade-off |
| --- | --- | --- |
| A guard のみ | PreToolUse で raw `git worktree remove` を検査して deny | 安い。ただし正しい畳み方を提供しないので、deny された agent が別形式 (PowerShell の `Remove-Item -Recurse`、`rm -rf`) で迂回する |
| B command のみ | `ut-tdd worktree remove` を正規経路にし、prose で直叩きを禁じる | 手順は機械化される。ただし直叩きを止める仕組みが prose だけに戻る (5 回失敗した形と同じ) |
| **C 両方 (採択)** | command を正規経路にし、guard は「node_modules が残る raw remove」と「node_modules junction 作成」を deny して command へ誘導する | 実装量は最大。guard の deny 理由に正規 command を書けるので迂回の動機が減る。`ut-tdd pr merge` と `gh pr merge` の関係と同じ形 |

### D2: junction 運用そのものを続けるか (採択: A 禁止 + `npm ci`)

| 案 | 内容 | trade-off |
| --- | --- | --- |
| **A junction 禁止 + `npm ci` (採択)** | worktree でテストが要るなら `npm ci` で実体を入れる。guard は node_modules を対象とする reparse point の作成を deny する | 根本原因 (共有実体への reparse point) が消える。worktree ごとに disk を使う。cold cache では時間がかかる |
| B junction 継続 + command で守る | 作成は許し、削除だけ command で守る | disk と時間を節約できる。ただし command 以外の削除経路 (エディタ、エクスプローラー、他ツール) で同じ事故が起きる余地が残る |

実測 (advisor 条件 1、2026-10-05、`C:/dev/ut-661-plan-20261005`、Windows 11、node v24.13.0、npm 11.6.2):

- cold cache (`npm ci --cache <空の一時 dir>`): 122.7 秒 (exit 0)
- warm (既定 cache): 75.3 秒 (exit 0)
- top-level entry 数 92、`node_modules` 容量 141 MB

issue #661 本文の「約 10〜11 秒」は primary での復旧時の値であり、新規 worktree では warm でも 75 秒、cold で 2 分かかった。
この待ち時間は worktree 1 本ごとに 1 回であり、事故 1 回の復旧 (primary を使う全 worktree・全ランタイムの停止) より小さいと判断して
A を維持する。テストを走らせない worktree (docs-only の PLAN 起票等) では `npm ci` 自体を省いてよい。

A を採っても、既存 worktree に残った junction を安全に外す必要があるので、D1 の command は不要にならない。

### D3: 未 merge の判定 (採択: A 祖先判定 + 判定前 fetch)

| 案 | 内容 | trade-off |
| --- | --- | --- |
| **A tip が `origin/main` の祖先 (採択)** | `git merge-base --is-ancestor <tip> origin/main` が真なら削除可。偽なら `--allow-unmerged --reason "<text>"` が無い限り拒否 | 単純で決定的。squash merge された branch は「未 merge」と判定される (この repo の merge は merge commit なので実害は小さい) |
| B tip が任意の remote branch に含まれる | `git branch -r --contains` | push 済みなら消してよい、という緩い基準。PR が close されて remote branch だけ残る場合に誤って削除可とする |

鮮度: 判定の直前に `git fetch origin main` を行い、fetch が失敗したら **fail-close** (remove 0) とする。オフラインで畳む必要が
あるときだけ `--offline --reason "<非空>"` を明示的に渡す。このとき判定にはローカルの `origin/main` を使い、理由・tip sha・
使った `origin/main` sha を `.ut-tdd/logs/worktree-remove-offline.jsonl` へ監査記録する (foreign-edit-override と同じ
「理由なき silent bypass を作らない」形)。`--allow-unmerged` も同じ jsonl へ記録する。detached HEAD の review worktree も
同じ判定に従う。

### D4: guard の判定方式 (採択: segment 先頭 token 判定 + 限定正規化)

command 文字列を `;` / `&&` / `||` / `|` / 改行で segment に分け、各 segment に **限定正規化** を施してから
**先頭 token 列だけ** を判定する。

限定正規化 (この 4 種だけ。先頭から繰り返し剥がす):

- N1 shell 予約語: 先頭の `do` / `then` / `else` (ループ・条件の本体。`for w in ...; do git worktree remove "$w"; done` の
  `do git worktree remove "$w"` を `git worktree remove "$w"` として判定する)。
- N2 PowerShell の call operator: 先頭の `&` (`& git worktree remove C:/x`)。
- N3 環境変数の前置: 先頭の `env` と、`NAME=value` 形の token (`MSYS_NO_PATHCONV=1 git worktree remove ...`)。
- N4 git の global option (列挙せず一般化する): `git` の直後から、`-` で始まる token をすべて飛ばし、最初の `-` で始まらない
  token を subcommand とみなす。別 token で値を取る option (`=` を伴わない `-C` / `-c` / `--git-dir` / `--work-tree` /
  `--namespace` / `--exec-path` / `--config-env` / `--super-prefix`) は、直後の 1 token も値として飛ばす。`--opt=value` 形と
  値を取らない option (`--no-optional-locks` / `--no-pager` / `-P` / `--bare` 等) は、その token だけを飛ばす。
  `-C <path>` があれば、対象 path はその `<path>` を基準に解決する (複数あれば git と同じく順に連結)。`-C` の値が検査できない
  (変数等) ときは G3 で deny する。
- N4 の fail-close: 上の規則で subcommand を決めたあとに `worktree remove` と一致しなくても、`git` を command 名とする segment の
  **引用符外の token に連続する `worktree` `remove` が現れる** なら、検査不能として deny する (G3)。表に無い値付き option
  (`git --未知 v worktree remove ...`) で値を subcommand と取り違えても、素通りさせないための保険である。
  引用符内 (`git commit -m "worktree remove"` 等) は対象にしない。

判定対象は正規化後の先頭が `git worktree remove`、`mklink /J` (`cmd /c` / `cmd //c` の直後に直接続く形を含む)、
`New-Item -ItemType Junction|SymbolicLink`、`ln -s` の 4 形である。command 名は `git` / `mklink` / `New-Item` / `ln` に限る
(`ut-tdd worktree remove` は command 名が `git` でないので対象外。G6)。引用符内の引数 (`gh ... --body "..."` の本文など) は
判定しない。語の包含では deny しない。判定対象 segment の path 引数に変数・command substitution・glob が含まれ、検査できない
場合は deny する (ループで一括削除する使い方を封じる)。

**保証外 (guard は検査しない)**: 入れ子実行。`sh -c "..."` / `bash -c "..."` / `powershell -Command "..."` /
`pwsh -Command "..."` / `cmd /c "<文字列>"` の引用符付き文字列、`eval`、script file 経由の実行、`Invoke-Expression`。
これらの中身は parse しない (最小実装原則。shell parser の再実装は作り込みにあたる)。入れ子実行に対する防御は
**command 経路のみ** (D1 の `ut-tdd worktree remove` を正規経路とする規律と、C5-C8 の削除前後検査) であり、guard の保証範囲に
含めない。

### C5 の走査範囲 (採択: worktree 直下の `node_modules` のみ)

C5 は `<wt>/node_modules` だけを対象にする。配下全体の reparse point 走査は行わない。D2 で junction 作成を禁じるので、
直下以外の reparse point を前提にした作り込みは不要である。

## 2. `ut-tdd worktree remove <wt>` の契約

入力: `<wt>` (worktree の path)、任意の `--allow-unmerged --reason "<非空>"`、任意の `--offline --reason "<非空>"`、任意の `--dry-run`。

手順 (各段で失敗したら以降を実行せず非 0 で終了し、どこで止まったかを JSON で出す):

- C1 対象の確定: `<wt>` を realpath 化し、`git worktree list --porcelain` の登録 path と一致すること。primary checkout
  (main working tree) と一致したら拒否する。cwd が対象内なら拒否する。
- C2 未 merge 判定: D3 に従う (直前に `git fetch origin main`、失敗なら fail-close、`--offline --reason` は監査記録付き)。拒否時は tip sha と判定に使った `origin/main` の sha を出す。
- C3 dirty 判定: `git -C <wt> status --porcelain` が空でなければ拒否する (`--force` は提供しない。dirty の破棄は本 command の責務外)。
- C4 primary の健全性 snapshot (前): primary の `node_modules` について、存在・実体ディレクトリであること・
  `package-lock.json` の top-level package のうち存在する件数 N を記録する。
- C5 reparse point の解除: `<wt>/node_modules` が junction / symlink なら、**辿らずに** link だけを外す
  (Node の `fs.lstatSync` で link を判定し、Windows junction は `fs.rmdirSync`、symlink は `fs.unlinkSync`。再帰削除 API は使わない)。
  対象は `<wt>` 直下の `node_modules` だけとする (§1 C5)。`lstat` できなければ fail-close。
- C6 不在確認: C5 の後に `<wt>/node_modules` を `lstat` し、**存在しない** ことを確認する。実体ディレクトリとして残っていても
  拒否する (実体は消してよいが、本 command は辿る危険を避けるため実体の再帰削除も行わない。利用者が先に消す)。
- C7 物理削除: `git worktree remove <wt>` (`--force` なし) を実行する。
- C8 primary の健全性確認 (後): C4 と同じ観測を取り、存在・実体・件数 N が一致することを確認する。不一致なら exit 非 0 で
  「primary の node_modules が損傷した。`npm ci` で復旧せよ」と出す (削除自体は取り消せないので、検知と案内に留める)。
- C9 branch: 本 command は branch を削除しない (branch 削除は tip が main に含まれることを別途確かめる既存規律に任せる)。

`--dry-run` は C1-C6 の判定だけを行い、C5 の unlink と C7 を実行しない。

## 3. guard の契約 (両ランタイム)

- G1 置き場と到達経路: repo 管理の TypeScript entrypoint 1 本 (例: `.claude/hooks/worktree-guard.ts`) を両ランタイムから呼ぶ。
  - Claude: `.claude/settings.json` の `PreToolUse` に matcher `Bash|PowerShell` で追加する (agent-guard / work-guard と同じ配線)。
  - Codex: `.codex/hooks.json` の `PreToolUse` に matcher `Bash` で追加する。Codex は shell 実行を PreToolUse の `tool_name=Bash` として
    渡すことが PLAN-L7-668 §1.1 で実測済みである (VS Code 拡張の Codex、hook 実行 shell は `pwsh -NoProfile -Command`)。command は
    PLAN-L7-668 §2 の形 (`node "$(git rev-parse --show-toplevel)/<script>"`、`args` / `blockOnFailure` なし、block は exit 2) に従う。
  - 未計測範囲: `pwsh` の無い Windows での fallback shell と、`codex exec` (headless) で project hook が発火するか
    (PLAN-L7-668 §1.1 の未計測と同じ)。そこでは guard が届かない可能性があり、Codex 側の防御は command (D1) が担う。
    S2 で実機の deny を 1 回観測し、届かない経路があれば「Codex のその経路は command のみ」と本 PLAN に追記する。
  - `.claude/CLAUDE.md` §Hooks の一覧と `rule-drift` の照合 (U-RDRIFT-007) を同時に更新する。
- G2 deny 1: `git worktree remove <path>` で、`<path>/node_modules` が (junction / symlink / 実体のいずれでも) 存在する。
- G3 deny 2: 判定対象 segment (§1 D4 の N1-N4 で正規化した後) の `<path>` または `git -C` の値が変数・command substitution・glob を含み、検査できない。
  または N4 の fail-close (subcommand は `worktree remove` と判定できないが、引用符外に連続する `worktree` `remove` がある) に該当する。
- G4 deny 3: `node_modules` を link 先または link 名とする junction / symlink の作成 (`mklink /J`、`New-Item -ItemType Junction|SymbolicLink`、
  `ln -s`、`cmd //c mklink`)。判定は §1 D4 の segment 先頭 token 方式 (N1-N4 の限定正規化を含む) に限る。
- G5 deny 理由には `ut-tdd worktree remove <path>` と `npm ci` を案内として書く。
- G6 `ut-tdd worktree remove` 自身の呼び出し (command 名が `git` でないので G2 の対象外。この除外を command 名照合で明示的に保つ) と、引用符内の引数だけに判定語を含む segment (例: `gh issue comment --body "..."`) は通す。guard は fail-close (stdin JSON 不正は deny)。
- G7 保証外: §1 D4 の入れ子実行 (`sh -c` / `bash -c` / `powershell -Command` / `pwsh -Command` / `cmd /c` の引用符付き文字列、`eval`、
  script file、`Invoke-Expression`) は guard の保証外とし、command 経路のみで守る。guard はこれらを allow も deny も保証しない
  (中身を検査しない)。oracle は保証外であることを固定しない (保証外の挙動を test で凍結すると契約になってしまうため)。

## 4. oracle 候補 (L7 test-design へ freeze する対象)

実 worktree の削除テストは、**共有 node_modules を指す junction を使わず**、隔離した fixture (temp の bare repo + worktree +
fixture 内の偽 `node_modules` 実体) だけで行う。primary の `node_modules` には触れない。

| ID | 入力 | 期待 | mutation (これを入れたら RED になること) |
| --- | --- | --- | --- |
| O1 | fixture の worktree に fixture 内実体への junction | C5 で link だけ外れ、link 先の実体ファイル数が不変、remove 成功 | C5 を `fs.rmSync(path, {recursive:true})` に置換 → link 先のファイルが消えて RED |
| O2 | C5 の unlink を **成功扱いで返すが link を残す** よう port に注入する (例外も失敗コードも出さない) | C6 の `lstat` 不在確認で停止し非 0。`git worktree remove` の呼び出し回数 0 | C6 の不在確認を削除 → remove が呼ばれて RED |
| O3 | `<wt>/node_modules` が実体ディレクトリ | C6 で拒否、remove 0 | C6 を「link でなければ可」に緩める → RED |
| O4 | tip が `origin/main` の祖先でない | C2 で拒否、remove 0 | 判定を `branch -r --contains` に置換 (fixture に remote branch を置く) → RED |
| O5 | O4 + `--allow-unmerged --reason ""` | 拒否 (空 reason は不可) | reason の非空検査を削除 → RED |
| O6 | `<wt>` が primary checkout | C1 で拒否 | primary 照合を削除 → RED |
| O7 | C8 で件数 N が減る (port で注入) | 非 0 + `npm ci` 案内 | C8 を存在確認だけに緩める → RED |
| O8 | guard: `git worktree remove C:/x` で `C:/x/node_modules` あり | deny | G2 の存在判定を「junction のときだけ」に緩める → 実体ケースで RED |
| O9 | guard: `for w in <fx>/a; do git worktree remove "$w"; done`。fixture: 対象を一意に決められず G2 は判定しない (literal `$w/node_modules` は存在しない) | deny (G3 のみが根拠) | G3 を削除 → allow になって RED |
| O10 | guard: `cmd //c mklink /J C:/x/node_modules C:/y/node_modules` と `New-Item -ItemType Junction` | 両方 deny | G4 の pattern から 1 形式を削除 → その形式で RED |
| O11 | guard: `ut-tdd worktree remove C:/x` (`C:/x/node_modules` あり) | allow | command 名照合 (`git` に限る) を外して「任意の command 名 + `worktree remove`」を対象にする (= G6 の除外が無い状態) → 正規 command を誤 deny して RED |
| O13 | `git fetch` を失敗させる (port で注入)、`--offline` なし | C2 で拒否、remove 0 | fetch 失敗時にローカル `origin/main` で続行させる → RED |
| O14 | `--offline --reason "x"` | 判定続行 + `worktree-remove-offline.jsonl` に 1 行 (reason・tip・origin/main sha) | 監査記録を削除 → RED |
| O15 | guard: `gh issue comment 1 --body "git worktree remove C:/x"` | allow | segment 先頭判定を語の包含判定に置換 → RED |
| O16 | guard (N1): `for w in C:/a; do git worktree remove C:/a; done` (`C:/a/node_modules` あり) | deny (G2) | N1 の `do` 剥がしを削除 → 先頭が `do` で素通りして RED |
| O17 | guard (N1): `if true; then git worktree remove C:/a; fi` と `else git worktree remove C:/a` | 両方 deny | N1 から `then` / `else` の一方を削除 → その形で RED |
| O18 | guard (N2): `& git worktree remove C:/a` | deny | N2 を削除 → RED |
| O19 | guard (N3): `env git worktree remove C:/a` と `MSYS_NO_PATHCONV=1 git worktree remove C:/a` | 両方 deny | N3 から `env` か `NAME=value` の一方を削除 → その形で RED |
| O20 | guard (N4 値付き `-C` / `-c`): (a) `git -C <fx>/repo worktree remove <fx>/b` と `git -c core.x=y worktree remove <fx>/b` (`<fx>/b/node_modules` なし、他の deny 条件なし)、(c) `git -C <fx> worktree remove a` (相対 path、`<fx>/a/node_modules` あり、cwd 側には無い) | (a) 両方 allow、(c) deny (G2) | `-C` か `-c` の一方を値付き option 表から外す → その形の (a) が値を subcommand と取り違えて fail-close で誤 deny、RED。`-C` による解決基準を外す → (c) が cwd 基準で判定されて allow、RED |
| O21 | guard (N4 + G3): `git -C "$R" worktree remove <fx>/a`。fixture: `<fx>/a` は存在し **`<fx>/a/node_modules` は存在しない**。他の deny 条件 (G2 / G4、N4 fail-close) は成り立たない | deny (`-C` 値の検査不能だけが根拠) | `-C` 値の検査不能判定を削除 → G2 も成り立たないので allow になって RED |
| O22 | guard (N4 一般化): `git --no-optional-locks worktree remove <path>`。(a) deny 側 `<fx>/a` (`node_modules` あり) と (b) allow 側 `<fx>/b` (`node_modules` なし、他の deny 条件なし) の 2 件 | (a) deny (G2)、(b) allow | M1: N4 を rev 3 の形 (`-C` / `-c` だけ除去、fail-close なし) に戻す → (a) が allow で RED。M2: 一般化読み飛ばしだけを削除し fail-close は残す → (b) が誤 deny で RED |
| O23 | guard (N4 一般化): `git --git-dir=<fx>/repo/.git worktree remove <path>`。(a) deny 側 `<fx>/a` (`node_modules` あり) と (b) allow 側 `<fx>/b` (`node_modules` なし、他の deny 条件なし) の 2 件 | (a) deny (G2)、(b) allow | O22 と同じ M1 / M2 → それぞれ (a) / (b) で RED |
| O24 | guard (N4 値付き、allow 側で判別): `git --work-tree <fx>/repo worktree remove <fx>/b`。fixture: `<fx>/b` は存在し `<fx>/b/node_modules` は存在しない。他の deny 条件は成り立たない | allow (正しく `worktree remove` と解析され、G2 も成り立たない) | 値付き option の直後 token の読み飛ばしを削除 → `<fx>/repo` を subcommand と取り違え、N4 fail-close で誤 deny になって RED |
| O25 | guard (N4 組合せ): `git -c a=b -C <fx>/repo --no-pager worktree remove <path>`。(a) deny 側 `<fx>/a` (`node_modules` あり) と (b) allow 側 `<fx>/b` (`node_modules` なし、他の deny 条件なし) の 2 件 | (a) deny (G2)、(b) allow | O22 と同じ M1 / M2 → それぞれ (a) / (b) で RED |
| O26 | guard (N4 fail-close): `git --unknown-opt v worktree remove <fx>/a`。fixture: `<fx>/a/node_modules` は存在しない | deny (G3 の fail-close だけが根拠) | N4 の fail-close を削除 → `v` を subcommand とみなして allow、RED |
| O27 | guard (N4 fail-close の範囲): `git commit -m "worktree remove"` | allow | fail-close を引用符内まで広げる → 誤 deny で RED |
| O12 | rule-drift: `.codex/hooks.json` だけから guard 配線を外す | doctor rule-drift fail | 両ランタイム照合を片側だけにする → RED |

## 5. 実装分割 (1 PR = 1 論点)

順序契約 (advisor 条件 3): **D2 → D1 guard → D3** の依存順で着工する。

1. D2 (junction 禁止 + `npm ci`) を先に運用へ入れる (S1)。guard は junction が新しく作られない前提で書き、junction 前提の作り込みをしない。
2. D1 の guard (S2) は D2 の後。deny 理由が指す正規 command の存在を前提にしないよう、S2 の deny 理由は `npm ci` と
   「`ut-tdd worktree remove` は S3 で提供」を案内し、S3 merge 時に command 案内へ差し替える。
3. D3 を含む command (S3) は最後。既存 worktree に残った junction の安全な撤去はここで担う。

- S0 (本 PLAN): 契約 freeze と非著者 cross-review。D1-D4 / C5 は §1 で採択済み。
- S1 (D2): 運用切替。`CLAUDE.md` / メモリの junction 手順を `npm ci` への pointer に置換し、暫定 guard (`.claude/settings.local.json`) の
  撤去手順を案内する。docs のみ。
- S2 (D1 guard): L7 test-design へ O8-O12、O15-O27 を freeze (pair-freeze) し、guard entrypoint 1 本と対テスト、`.claude/settings.json` +
  `.codex/hooks.json` + `.claude/CLAUDE.md` §Hooks の配線、rule-drift の照合追加。Codex 側の実機 deny を 1 回観測する。
- S3 (command + D3): L7 test-design へ O1-O7、O13、O14 を freeze し、`src/runtime/worktree-lifecycle/` 配下に物理削除 adapter (source_module 1 個)
  と対テスト、最小の CLI 配線 (`ut-tdd worktree remove`)。S2 の deny 理由を command 案内へ差し替える。
- S4 (任意): issue #426 / #794 の apply 段が本 command を呼ぶ配線。#426 / #794 側の PLAN で扱い、本 PLAN では行わない。

Reverse 対: S2 / S3 の実装 PR (kind=add-impl) が Reverse backfill PLAN を伴う。

## 6. 非スコープ

- どの worktree を畳むかの選定 (owner / TTL / 一括回収) は #426 / #794。
- dirty worktree の破棄、`--force` 削除、branch の自動削除。
- primary の `node_modules` の自動復旧 (`npm ci` の自動実行)。検知と案内に留める。
- `.ut-tdd/harness.db` を含む canonical state の操作。

## 7. 未決事項

なし。rev 1 の未決 1-4 は §1.0 の advisor 相談で、D3 の鮮度、C5 の範囲、D2 の採否、D4 の判定方式として採択した。

## 8. 根拠

- 事故記録と暫定 guard: `gh issue view 661 --comments` (2026-10-05 コメント)。
- 物理削除 adapter の不在: `src/runtime/worktree-lifecycle/application/service.ts` (create / handoff / lease のみ)。
- Codex hook の現状: `.codex/hooks.json` に Bash 系 PreToolUse が無い (agent-guard / work-guard の 2 本のみ)。
- 復旧の所要: issue #661 本文 (`npm ci`、121 packages、約 11 秒)。
- `npm ci` の cold / warm 実測 (§1 D2): `C:/dev/ut-661-plan-20261005` で、空の一時 cache dir を `--cache` に渡した `npm ci` と、
  続けて既定 cache での `npm ci` を `date +%s%3N` で挟んで計測した。
- Codex PreToolUse の shell `tool_name=Bash`: `docs/plans/PLAN-L7-668-codex-hook-command-schema.md` §1.1。
- advisor 相談: `ut-tdd advisor --decision design --plan PLAN-L6-661-worktree-safe-remove-contract --execute` (2026-10-05、`claude-fable-5`)。
