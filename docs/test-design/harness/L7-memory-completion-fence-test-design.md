---
title: "L7 Memory migration completion fence test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
plan_id: PLAN-L7-533-memory-completion-fence
updated: 2026-09-11
---

# PLAN-L7-533 test design

## 1. 位置付け

`PLAN-L7-533-memory-completion-fence` と `PLAN-REVERSE-533-memory-completion-fence-backfill` 専用の pair artifact
である。`PLAN-L7-512` の pair artifact (`L7-project-scoped-memory-root-test-design.md`) が所有する
`CANDIDATE-U-PMEMROOT-*` / `U-PMEMINV-*` / `U-PMEMQUAR-*` と、`PLAN-L7-529` の `CANDIDATE-U-PROJID-*` を変更せず、
completion fence の正本・residue 集合差分・回復・結線だけを検証する差分 oracle を定義する。

PR #554 が置いた `U-PMEMFENCE-*` (001〜014 の 14 件) は正規 ID として採用しない。同 PR の 006 は linked worktree に checkout された
tracked memory だけで drift が起き、テストの意図 (legacy extra の追加) と無関係に通っていた。

この pair-freeze では候補だけを宣言する。production source と test code を追加せず、共有 `L7-unit-test-design.md` への
`U-*` 登録は実装 PR まで行わない。

## 2. fixture

- fixture repo は temp directory 内に作る (実 repository、開発 worktree、ユーザーデータを対象にしない)。tracked identity
  (`ut-tdd.project.json`) を HEAD に commit した primary と、`git worktree add` で作る linked worktree 1〜3 本。
- canonical root = primary の `.ut-tdd/memory`。legacy dir = 各 linked worktree の `.ut-tdd/memory`。
- completion 済み状態は Slice 4b の transaction 経路 (`apply` → `complete` marker) で作る。marker を手書きしない
  (tamper 系だけが marker を意図的に改変する)。
- 各 stimulus の後、canonical / legacy corpus、inbox、claim、receipt、marker の byte digest を前後比較し write 0 を数える。

## 3. Candidate oracle matrix

| Candidate | Stimulus / mutation | 独立 oracle |
| --- | --- | --- |
| `CANDIDATE-U-PMEMFENCE-001` | owner / intent / prepared のいずれかで中断した transaction を残し、setup / status / SessionStart / Memory read-write / provider wake を起動 | 全入口が `migration_incomplete`。canonical / legacy / inbox / receipt の write 0 |
| `CANDIDATE-U-PMEMFENCE-002` | `complete` marker の行入替、欠番、末尾不正行、digest 1 byte 改変 | `transaction_tampered`。write 0。自動修復しない |
| `CANDIDATE-U-PMEMFENCE-003` | marker 無しで legacy corpus だけを配置 | `migration_incomplete`。legacy corpus の read 0 (silent fallback 0) |
| `CANDIDATE-U-PMEMFENCE-004` | completion 後に `git worktree add` し、tracked memory が checkout された状態で fence | ok (`projectId` / `operationId` / canonical digest が completion 直後と一致)。#554 実装では `inventory_drift` → Red 起点 |
| `CANDIDATE-U-PMEMFENCE-005` | completion 時に存在した linked worktree を `git worktree remove` | ok 不変。#554 実装では `inventory_drift` → Red 起点 |
| `CANDIDATE-U-PMEMFENCE-006` | canonical root の tracked memory を commit で変更・削除し、linked worktree で pull 相当の checkout | ok。canonical digest だけが変わり reason は出ない。#554 実装では `inventory_drift` → Red 起点 |
| `CANDIDATE-U-PMEMFENCE-007` | completion 後、canonical を変えずに同一 operation を再 apply | fence ok、apply は `replayed`、marker 追記 0 |
| `CANDIDATE-U-PMEMFENCE-008` | linked worktree の legacy dir に canonical に無い untracked memory file を作成 | `legacy_residue` (file 集合を報告)。production write 0。canonical root 不変 |
| `CANDIDATE-U-PMEMFENCE-009` | 008 の file を mtime / ctime を保存してコピー配置、または completion 前の時刻に偽装 | 集合差分で `legacy_residue`。時刻に依存した判定を入れると Red |
| `CANDIDATE-U-PMEMFENCE-010` | residue に frontmatter 不正 (memory_id 欠落 / kind 不正 / updated_at 欠落) の file を混ぜて新 operation で apply | 不正は `invalid_memory` で取り込み 0、正常分だけが canonical へ入り `prepared` / `complete` に記録。旧 operation の marker 不変 |
| `CANDIDATE-U-PMEMFENCE-011` | observe 後・apply 前に residue file を追加 (TOCTOU 注入) | apply は取り込んだ file だけを marker に記録。残りは fence が `legacy_residue` で報告し、次回 apply が拾う。「全量取り込み済み」と記録したら Red |
| `CANDIDATE-U-PMEMFENCE-012` | identity 欠落、current/primary identity drift、junction/symlink root escape、common-dir 不正 | `PLAN-L7-512` の typed deny をそのまま返す。fence が別 reason へ丸めたら Red。write 0 |
| `CANDIDATE-U-PMEMFENCE-013` | Claude session 相当と Codex session 相当の入口 (wake / claim / Memory service) から同一 fixture を観測 | reason と write 0 が一致。marker 以外に session / provider 名を含む状態 file を作らない |
| `CANDIDATE-U-PMEMFENCE-014` | (a) tracked identity + transaction 完全不在で setup、(b) identity 未 commit で setup、(c) remote 無し repository で setup | (a) 初回 migration を bootstrap し completion 後に setup write。(b) migration だけ `project_identity_commit_required` で保留、state / template は書く、commit 後の再実行で (a) と同じ。(c) identity deny を `SetupResult.projectIdentity` に保持して非 fatal (`PLAN-L7-529` §6)。fatal 化したら Red |
| `CANDIDATE-U-PMEMFENCE-015` | consumer-toolchain / consumer-setup-smoke doctor を ok / incomplete / tamper / residue の 4 状態で起動 | ok は pass、3 負例は各 typed reason で profile 全体を fail-close。正例が無い、または負例が同一 reason に丸まったら Red |
| `CANDIDATE-U-PMEMFENCE-016` | completion 後に `ut-tdd memory add` (または tracked memory の commit / 削除) で canonical を変えてから同一 operation を再 apply | fence は ok のまま (reason 0)。apply は `replay_corpus_mismatch`、canonical write 0、marker 追記 0、追記 file 不変。`replayed` を返したら Red (`PLAN-L7-512` §2 違反) |
| `CANDIDATE-U-PMEMFENCE-017` | complete 済み tip を `previous_complete_digest` で参照する新 operation を prepared で中断 | `migration_incomplete` (中断 operation の id を報告)。write 0。tip の complete だけを見て ok にしたら Red |
| `CANDIDATE-U-PMEMFENCE-018` | 2 operation の chain で、古い方の `complete` marker を 1 byte 改変 | `transaction_tampered`。write 0。新しい tip が complete でも丸めない |
| `CANDIDATE-U-PMEMFENCE-019` | (a) 互いに参照しない complete operation を 2 つ置く、(b) `previous_complete_digest` が存在しない digest を指す operation を置く。(a) は operationId 辞書順と mtime を入れ替えた 2 配置で実行 | (a)(b) とも `operation_chain_ambiguous`。write 0。2 配置で結果が変わったら Red (mtime / operationId 順で選んでいる) |
| `CANDIDATE-U-PMEMFENCE-020` | legacy 互換: Slice 4b 形式 (`previous_complete_digest` 欠落) の complete operation を root として置き、residue を作って §4.2 の新 operation を apply | fence ok。新 operation の `owner` marker は legacy complete の `complete` digest を明示の `previous_complete_digest` に持ち、tip = 新 operation。legacy root を `transaction_tampered` / `operation_chain_ambiguous` にしたら Red |
| `CANDIDATE-U-PMEMFENCE-021` | (a) null / 欠落 root の complete operation を 2 件置く、(b) 新形式 operation の `owner` marker から `previous_complete_digest` を除去し recordDigest を再計算しない、(c) legacy root (field 無し、digest 整合) の上に (b) の子を置く、(d) (b) の marker の recordDigest を改変後 payload で再計算して置く (chain 偽造) | (a) `operation_chain_ambiguous`。(b)(c) `transaction_tampered` (Slice 4b の record digest chain で検出。field の有無で判定したら Red)。(d) 後続 marker の `previousRecordDigest` 不一致で `transaction_tampered`、owner 単独 (後続無し) の operation なら `migration_incomplete`。判定順序 tampered → incomplete → ambiguous を守らなければ Red。いずれも write 0 |

`001..012` と `016..021` は PR-1 (fence module)、`013..015` は PR-2 (production 結線) が所有する。実装 PR で Red→Green を観測した行だけを
同番号の `U-PMEMFENCE-*` へ 1:1 で昇格し、共有 `L7-unit-test-design.md` へ登録する。

## 4. Gate and scope fence

- completion 時点の snapshot digest を fence の期待値として保持する実装は、004〜006 のいずれかで Red になることをもって
  排除する (B1 の再発防止)。
- residue の判定に mtime / ctime を使わない (009)。operation chain の tip 選択にも mtime / operationId 順を使わない (019)。
- `previous_complete_digest` の欠落は null と同値で root 1 件だけ許す (020)。field の有無を世代判別子にせず、改変は record digest chain で
  `transaction_tampered` にする。判定順序は tampered → incomplete → ambiguous (021)。
- fence の ok と replay の deny は独立に判定する。replay は `PLAN-L7-512` §2 の temporal equality を守る (007 / 016)。
- apply は個別 file 単位・schema 検証付き・append-only marker (010、011)。既存 marker の書き換え・re-baseline は本 artifact の
  oracle ではない。
- `PLAN-L7-529` の read / create / commit-policy 契約と test-design を変更しない (014 は 529 §6 の positive control を含む)。
- candidate の存在だけを Green 証跡、#550 / #424 の完了、Pack parity の根拠にしない。

## 5. Required evidence

実装 PR は、fixture repo の構成 (worktree 数、tracked / untracked memory 数)、各 stimulus 前後の write 0 計測、#554 実装で
Red になる 004〜006 の再現ログ、targeted command の exit code、typecheck / Biome、Linux / Windows / aggregate CI run ID、
exact HEAD、非著者 closing receipt digest を残す。
