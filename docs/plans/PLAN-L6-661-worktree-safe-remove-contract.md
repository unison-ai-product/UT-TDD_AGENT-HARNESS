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
  receipt_id: certificate:04e1bab46c4ea60bbdbe6ce4773c8a18
  command_id: plan-draft:issue-661:worktree-safe-remove:1
  admitted_at: 2026-10-05T08:51:24.284Z
  source_digest: sha256:8ff767f00743165ca3e1b0ded720b5911cc94ce23791b001866e109b5280de97
  decision_digest: sha256:017a71bb7d66a905f5ac38b4f710ee6d397d0d76e8df77914c5f5335134dddfa
  receipt_digest: sha256:5fcea4a846e98a5a5af7f9592f3ff0b593a5219e8227182b169d0c37c32d3871
  binding:
    path: docs/plans/PLAN-L6-661-worktree-safe-remove-contract.md
    plan_id: PLAN-L6-661-worktree-safe-remove-contract
    asset_id: plan:04e1bab46c4ea60bbdbe6ce4773c8a18
    revision: 1
    content_digest: sha256:8ff767f00743165ca3e1b0ded720b5911cc94ce23791b001866e109b5280de97
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
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue 661: worktree 削除が node_modules junction を辿り primary の
    node_modules を消す事故が通算 5 回起きた。手順ルールでは止まらないため、ut-tdd worktree remove
    の正規経路と両ランタイムの PreToolUse guard、junction 運用の廃止を契約として freeze する。実装は S1 以降の別
    PR"
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

advisor 相談は未実施 (本 draft 時点)。下表の推奨は起草側の判断であり、非著者 cross-review と
`ut-tdd advisor --decision design` の結果で確定する。確定後に本節を改訂する。

### D1: 防御の置き場所

| 案 | 内容 | trade-off |
| --- | --- | --- |
| A guard のみ | PreToolUse で raw `git worktree remove` を検査して deny | 安い。ただし正しい畳み方を提供しないので、deny された agent が別形式 (PowerShell の `Remove-Item -Recurse`、`rm -rf`) で迂回する。command 文字列 parse の誤検知・見逃しが残る |
| B command のみ | `ut-tdd worktree remove` を正規経路にし、prose で直叩きを禁じる | 手順は機械化される。ただし直叩きを止める仕組みが prose だけに戻る (5 回失敗した形と同じ) |
| **C 両方 (推奨)** | command を正規経路にし、guard は「node_modules が残る raw remove」と「node_modules junction 作成」を deny して command へ誘導する | 実装量は最大。guard の deny 理由に正規 command を書けるので迂回の動機が減る。`ut-tdd pr merge` と `gh pr merge` の関係と同じ形 |

推奨理由: A は迂回先を残し、B は 5 回失敗した prose 依存に戻る。

### D2: junction 運用そのものを続けるか

| 案 | 内容 | trade-off |
| --- | --- | --- |
| **A junction 禁止 + `npm ci` (推奨)** | worktree でテストが要るなら `npm ci` で実体を入れる (121 packages、約 10 秒)。guard は junction / symlink 作成を deny する | 根本原因 (共有実体への reparse point) が消える。worktree ごとに数百 MB の disk を使う。オフライン時は npm cache 依存 |
| B junction 継続 + command で守る | 作成は許し、削除だけ command で守る | disk と時間を節約できる。ただし command 以外の削除経路 (エディタ、エクスプローラー、他ツール) で同じ事故が起きる余地が残る |

推奨理由: 失うものが 10 秒と disk だけであり、事故の再発経路を構造的に閉じる。A を採っても、既存 worktree に残った junction を
安全に外す必要があるので、D1 の command は不要にならない。

### D3: 未 merge の判定

| 案 | 内容 | trade-off |
| --- | --- | --- |
| **A tip が `origin/main` の祖先 (推奨)** | `git merge-base --is-ancestor <tip> origin/main` が真なら削除可。偽なら `--allow-unmerged --reason "<text>"` が無い限り拒否 | 単純で決定的。squash merge された branch は「未 merge」と判定される (この repo の merge は merge commit なので実害は小さい) |
| B tip が任意の remote branch に含まれる | `git branch -r --contains` | push 済みなら消してよい、という緩い基準。PR が close されて remote branch だけ残る場合に誤って削除可とする |

detached HEAD の review worktree も A で判定する。fetch 前の古い `origin/main` で誤判定しないよう、判定前に `git fetch origin main`
を行うか、fetch できなければ fail-close とする (S1 で決める論点。§7 未決 1)。

### D4: guard の判定方式

guard は command 文字列を parse する。完全な shell parser は持たない。判定不能な入力 (path に変数・command substitution・glob を含む)
は **deny** する (暫定 guard と同じ。ループで一括削除する使い方を封じる)。既知の誤検知 (コマンドの引数文字列に判定語が含まれる、
例: `gh issue comment --body "...git worktree remove..."`) は許容し、deny 理由で `--body-file` を案内する。誤検知の削減より
見逃しゼロを優先する。

## 2. `ut-tdd worktree remove <wt>` の契約

入力: `<wt>` (worktree の path)、任意の `--allow-unmerged --reason "<非空>"`、任意の `--dry-run`。

手順 (各段で失敗したら以降を実行せず非 0 で終了し、どこで止まったかを JSON で出す):

- C1 対象の確定: `<wt>` を realpath 化し、`git worktree list --porcelain` の登録 path と一致すること。primary checkout
  (main working tree) と一致したら拒否する。cwd が対象内なら拒否する。
- C2 未 merge 判定: D3 に従う。拒否時は tip sha と判定に使った `origin/main` の sha を出す。
- C3 dirty 判定: `git -C <wt> status --porcelain` が空でなければ拒否する (`--force` は提供しない。dirty の破棄は本 command の責務外)。
- C4 primary の健全性 snapshot (前): primary の `node_modules` について、存在・実体ディレクトリであること・
  `package-lock.json` の top-level package のうち存在する件数 N を記録する。
- C5 reparse point の解除: `<wt>/node_modules` が junction / symlink なら、**辿らずに** link だけを外す
  (Node の `fs.lstatSync` で link を判定し、Windows junction は `fs.rmdirSync`、symlink は `fs.unlinkSync`。再帰削除 API は使わない)。
  `<wt>` 直下以外の reparse point も `fs.lstat` で走査し、primary 配下を指すものがあれば同様に外す。
  走査できない entry (権限・dangling) があれば fail-close。
- C6 不在確認: C5 の後に `<wt>/node_modules` を `lstat` し、**存在しない** ことを確認する。実体ディレクトリとして残っていても
  拒否する (実体は消してよいが、本 command は辿る危険を避けるため実体の再帰削除も行わない。利用者が先に消す)。
- C7 物理削除: `git worktree remove <wt>` (`--force` なし) を実行する。
- C8 primary の健全性確認 (後): C4 と同じ観測を取り、存在・実体・件数 N が一致することを確認する。不一致なら exit 非 0 で
  「primary の node_modules が損傷した。`npm ci` で復旧せよ」と出す (削除自体は取り消せないので、検知と案内に留める)。
- C9 branch: 本 command は branch を削除しない (branch 削除は tip が main に含まれることを別途確かめる既存規律に任せる)。

`--dry-run` は C1-C6 の判定だけを行い、C5 の unlink と C7 を実行しない。

## 3. guard の契約 (両ランタイム)

- G1 置き場: repo 管理の TypeScript entrypoint 1 本 (例: `.claude/hooks/worktree-guard.ts`) とし、`.claude/settings.json` の
  `PreToolUse(Bash|PowerShell)` と `.codex/hooks.json` の `PreToolUse(exec_command|local_shell|Bash)` の両方から呼ぶ
  (agent-guard / work-guard と同じ配線)。`.claude/CLAUDE.md` §Hooks の一覧と `rule-drift` の照合 (U-RDRIFT-007) を同時に更新する。
- G2 deny 1: `git worktree remove <path>` で、`<path>/node_modules` が (junction / symlink / 実体のいずれでも) 存在する。
- G3 deny 2: `<path>` が変数・command substitution・glob を含み、検査できない。
- G4 deny 3: `node_modules` を link 先または link 名とする junction / symlink の作成 (`mklink /J`、`New-Item -ItemType Junction|SymbolicLink`、
  `ln -s`、`cmd //c mklink`)。D2 で B を採った場合は G4 を外す。
- G5 deny 理由には `ut-tdd worktree remove <path>` と `npm ci` を案内として書く。
- G6 `ut-tdd worktree remove` 自身の呼び出しは通す。guard は fail-close (stdin JSON 不正は deny)。

## 4. oracle 候補 (L7 test-design へ freeze する対象)

実 worktree の削除テストは、**共有 node_modules を指す junction を使わず**、隔離した fixture (temp の bare repo + worktree +
fixture 内の偽 `node_modules` 実体) だけで行う。primary の `node_modules` には触れない。

| ID | 入力 | 期待 | mutation (これを入れたら RED になること) |
| --- | --- | --- | --- |
| O1 | fixture の worktree に fixture 内実体への junction | C5 で link だけ外れ、link 先の実体ファイル数が不変、remove 成功 | C5 を `fs.rmSync(path, {recursive:true})` に置換 → link 先のファイルが消えて RED |
| O2 | C5 の unlink を失敗させる (port で失敗を注入) | C7 を呼ばずに非 0。`git worktree remove` の呼び出し回数 0 | C6 の不在確認を削除 → remove が呼ばれて RED |
| O3 | `<wt>/node_modules` が実体ディレクトリ | C6 で拒否、remove 0 | C6 を「link でなければ可」に緩める → RED |
| O4 | tip が `origin/main` の祖先でない | C2 で拒否、remove 0 | 判定を `branch -r --contains` に置換 (fixture に remote branch を置く) → RED |
| O5 | O4 + `--allow-unmerged --reason ""` | 拒否 (空 reason は不可) | reason の非空検査を削除 → RED |
| O6 | `<wt>` が primary checkout | C1 で拒否 | primary 照合を削除 → RED |
| O7 | C8 で件数 N が減る (port で注入) | 非 0 + `npm ci` 案内 | C8 を存在確認だけに緩める → RED |
| O8 | guard: `git worktree remove C:/x` で `C:/x/node_modules` あり | deny | G2 の存在判定を「junction のときだけ」に緩める → 実体ケースで RED |
| O9 | guard: `for w in ...; do git worktree remove "$w"; done` | deny | G3 を削除 → RED |
| O10 | guard: `cmd //c mklink /J C:/x/node_modules C:/y/node_modules` と `New-Item -ItemType Junction` | 両方 deny | G4 の pattern から 1 形式を削除 → その形式で RED |
| O11 | guard: `ut-tdd worktree remove C:/x` | allow | G6 の除外を削除 → RED |
| O12 | rule-drift: `.codex/hooks.json` だけから guard 配線を外す | doctor rule-drift fail | 両ランタイム照合を片側だけにする → RED |

## 5. 実装分割 (1 PR = 1 論点)

順序契約: S0 → S1 → S2 → S3 → S4。S2 は S1 の command が main に入るまで着工しない (guard の deny 理由が指す先が先に要る)。

- S0 (本 PLAN): 契約 freeze と非著者 cross-review。D1-D4 の確定。
- S1: L7 test-design へ O1-O7 を freeze (pair-freeze) し、`src/runtime/worktree-lifecycle/` 配下に物理削除 adapter
  (source_module 1 個) と対テスト。CLI 配線は最小 (`ut-tdd worktree remove`)。
- S2: guard entrypoint 1 本と O8-O11、`.claude/settings.json` + `.codex/hooks.json` + `.claude/CLAUDE.md` §Hooks の配線、
  rule-drift の照合追加 (O12)。
- S3: D2 で A を採った場合の運用切替。`CLAUDE.md` / メモリの junction 手順を正規 command と `npm ci` への pointer に置換し、
  暫定 guard (`.claude/settings.local.json`) の撤去を案内する。
- S4 (任意): issue #426 / #794 の apply 段が本 command を呼ぶ配線。#426 / #794 側の PLAN で扱い、本 PLAN では行わない。

Reverse 対: S1 の実装 PR (kind=add-impl) が Reverse backfill PLAN を伴う。

## 6. 非スコープ

- どの worktree を畳むかの選定 (owner / TTL / 一括回収) は #426 / #794。
- dirty worktree の破棄、`--force` 削除、branch の自動削除。
- primary の `node_modules` の自動復旧 (`npm ci` の自動実行)。検知と案内に留める。
- `.ut-tdd/harness.db` を含む canonical state の操作。

## 7. 未決事項 (cross-review / advisor で確定する)

1. D3 の `origin/main` 鮮度: 判定前に fetch するか、fetch 失敗時に fail-close するか、`--offline` を設けるか。
2. C5 の走査範囲: `<wt>` 直下の `node_modules` だけか、配下全体の reparse point か (全体走査は大きな worktree で遅い)。
3. D2 の採否 (junction 禁止)。PO の運用判断に近いが、高影響境界には当たらないので advisor 相談で決める。
4. guard の誤検知 (§1 D4) を許容する範囲。`gh` の `--body` 引数を判定対象から外すか。

## 8. 根拠

- 事故記録と暫定 guard: `gh issue view 661 --comments` (2026-10-05 コメント)。
- 物理削除 adapter の不在: `src/runtime/worktree-lifecycle/application/service.ts` (create / handoff / lease のみ)。
- Codex hook の現状: `.codex/hooks.json` に Bash 系 PreToolUse が無い (agent-guard / work-guard の 2 本のみ)。
- 復旧の所要: issue #661 本文 (`npm ci`、121 packages、約 11 秒)。
