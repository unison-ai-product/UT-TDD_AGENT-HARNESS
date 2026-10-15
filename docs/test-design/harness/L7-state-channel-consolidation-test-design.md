---
title: "L7 state channel consolidation test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
updated: 2026-10-15
---

# 状態を伝える経路の一本化 テスト設計 (issue #1062)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/state-channel-consolidation.md` である。
本書はその §3 通知レコード、§4 review custody の差し替え、§5 handover prose の退役、§6 `memory add` の拒否規則、
§7 既存分の移行、§9 不変条件を検証する oracle を定義する。共有の `docs/test-design/harness/L7-unit-test-design.md` には
索引だけを置き、本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-STCHAN-*`) だけを宣言する。Red は後続 PR で、設計保護 gate の
L6 `design-protection-diff-gate.md` §10.3 と同じ順序にする: (1) Red のテスト (`it.fails`) を候補 ID で引用して入れる、
(2) 正式 ID `U-STCHAN-*` への昇格を src/ を含まない PR で入れる、(3) 実装 PR で `it.fails` を `it` に戻して Green にする。
`memory.md` §4.2 の `CANDIDATE-U-MEMEPI-*` は本書で置き換える範囲 (新規 episode の書き込み・配送) では引き継がず、
退避部品 (MEMEPI-007 / 014 / 015 / 019) だけを移行 (022〜024) が再利用する。

## 2. fixture

- 一時 git repo に `ut-tdd.project.json` (repository_identity = `example/repo`) を置く。`memory add` の行は実 CLI を子プロセスで呼ぶ。
- custody の行は、request を直接組み立てる純粋関数の入力で作る。実 reviewer は起動しない。
- 受信箱の行は一時 git common dir 配下の runtime bus に entry を書き、Stop hook の選択関数を直接呼ぶ。
- 実 repo を読む行 (024) は計測値を固定せず、dry-run の区分合計で照合する。

## 3. Candidate oracle matrix

| Candidate | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| CANDIDATE-U-STCHAN-001 | `memory add --kind project --title "PR 1055 CI と control merge"`、`--durable-reason` なし | exit 1、`episodic_memory_rejected`、`.ut-tdd/memory` に新規ファイルなし、拒否文言に GitHub コメントと `ut-tdd notify claude` の案内 | kind=project の拒否を外す / 検査を書き込みの後ろへ置く (ファイルが残る) |
| CANDIDATE-U-STCHAN-002 | `memory add --kind project --durable-reason "変わらない制約"` | 書かれ、frontmatter に `durable_reason` | 理由を無視して拒否する / 理由を frontmatter に残さない |
| CANDIDATE-U-STCHAN-003 | `--durable-reason "   "` (空白のみ) | exit 1、`episodic_memory_rejected` | 空白を非空として扱う |
| CANDIDATE-U-STCHAN-004 | `memory add --kind feedback --title "PR #700 の重複 request は merge を塞ぐ"` | 書かれる (番号は見ない) | 全 kind に番号の正規表現を適用する |
| CANDIDATE-U-STCHAN-005 | `--kind reference` と `--kind user`、title に `Issue 898` | どちらも書かれる | project 以外へ拒否を広げる |
| CANDIDATE-U-STCHAN-006 | 追跡済みの 46 件 (実 repo の `git ls-files .ut-tdd/memory`) の kind を `classifyMemoryAdd` に通す | 全件 accept (project は 0 件であること自体も assert) | 既存の正本を拒否する規則にする |
| CANDIDATE-U-STCHAN-007 | 同じ `(pr, exactHead, authorFamily)` で request を 2 回作る | digest・path が一致、`review-dispatch` が `duplicate_request_conflict` を出さない | identity に nonce・`requestedAt` を入れる / `memoryId` を残す |
| CANDIDATE-U-STCHAN-008 | `exactHead` だけ違う 2 request | digest が異なる | `exactHead` を identity から落とす |
| CANDIDATE-U-STCHAN-009 | v1 (`memoryId` を含む) で作った open request と closed receipt を、v2 の読み取りに通す | merge gate が v1 を検証できる (receipt の `memoryId` と request が一致) | 読み取りが v1 を捨てる / v1 を v2 の digest で検証する |
| CANDIDATE-U-STCHAN-010 | window 中に委譲 CLI へ `--review-memory-id x` を渡す | 受理、stderr に `review_memory_id_deprecated`、作られる request は v2 で `memoryId` を持たない | flag を identity に入れ続ける / 警告を出さない |
| CANDIDATE-U-STCHAN-011 | cutover 後に `--review-memory-id x` を渡す | exit 1、`review_memory_id_retired`、request を作らない | cutover 後も受理する / `reviewIdentityRequested` に残す |
| CANDIDATE-U-STCHAN-012 | `.ut-tdd/memory` が存在しない repo で `review live-dispatch --task-file t.md` | request と通知が作られ、task が `.ut-tdd/review/requests/<digest>.task.md` に複製される。`readCanonicalMemoryByIdentity` は呼ばれない | memory の読み取りを残す / task を identity に入れる |
| CANDIDATE-U-STCHAN-013 | v2 の request に `memoryId` key を足した JSON を `loadCanonicalLiveReviewRequest` に通す | `null` (exact key 違反) | exact key の検査を緩める |
| CANDIDATE-U-STCHAN-014 | custody runner に env `UT_TDD_CUSTODY_MEMORY_ID` なしで v2 request を渡す | 動く (必須でなくなる) | 環境変数を必須のまま残す |
| CANDIDATE-U-STCHAN-015 | `ut-tdd notify claude --ref <同 repo の PR コメント URL> --body x` | `ut-tdd.notification/v1`、`purpose=note`、`memory_id` / `memoryPath` を持たない entry が runtime bus に載る | entry に memory 項目を残す |
| CANDIDATE-U-STCHAN-016 | `--ref` なし、または別 repo の URL、または非 GitHub URL | exit 1、entry を書かない | ref を任意にする / repo 照合を外す |
| CANDIDATE-U-STCHAN-017 | window 中に v3 / v4 の旧 entry と v1 entry を同時に inbox へ置く | Stop hook の選択が両方を復号し、claim・terminal 判定が従来どおり (U-MEMWAKE-* の回帰) | 旧 entry の復号を落とす / 新 entry だけ選ぶ |
| CANDIDATE-U-STCHAN-018 | `.ut-tdd/memory` を読めない状態 (権限なし) で `notify claude` を実行 | 成功する (memory に触れない) | 通知の生成が `requireProjectMemoryRoot` 以外で memory を読む |
| CANDIDATE-U-STCHAN-019 | `ut-tdd handover` (dry-run と通常) | 通常は `.ut-tdd/handover/CURRENT.json` だけを書き、`docs/handover/session-handover-*.md` を作らない。dry-run は何も書かない。`CURRENT.json` に `latest_doc` / `doc_entry_count` がない | scaffold の書き出しを残す / dry-run で書く |
| CANDIDATE-U-STCHAN-020 | `.ut-tdd/handover/` に `CURRENT.json`、`.gitkeep`、`provider/`、`archive/`、`close-20261009.md`、`x.sh` を置いて doctor の `handover-prose` row を見る | 件数 2、advisory で doctor の exit に影響しない | 許可リストに `provider/` を入れ忘れて数える / fail させる |
| CANDIDATE-U-STCHAN-021 | `doc_entry_count` のない `CURRENT.json` を `checkHandoverBypass` に通す | 警告しない (md 照合を廃止した結果) | md 不在を bypass 扱いにする |
| CANDIDATE-U-STCHAN-022 | fixture: 追跡 feedback、未追跡 feedback (title に `PR 700`)、未追跡 project 3 件 (番号あり / なし / open な review request が task として参照) で memory の移行 dry-run | 移す対象は未追跡 project のうち参照されていない 2 件。feedback は両方残る。参照されている 1 件は skip として報告 | 選別を番号の正規表現にする / 参照検査を外す |
| CANDIDATE-U-STCHAN-023 | handover の移行で、許可リスト内のエントリ、最終更新が 24 時間未満の `.sh`、古い `.md` を置く | 古い `.md` だけが `.ut-tdd/archive/handover-prose/<YYYY-MM>/` へ移る。manifest に sha256 と `done` 1 行。許可リスト内と新しい `.sh` は動かない。削除経路なし。dry-run は不変 | 24 時間の保護を外す / 許可リストを動かす / 移動後に元を残す |
| CANDIDATE-U-STCHAN-024 | 実 repo で memory と handover の移行 dry-run を流し、実行後に `ut-tdd db status` を見る | 区分の合計 = 全ファイル数 (memory は `ls .ut-tdd/memory`、handover は `ls .ut-tdd/handover`)。実行後は `freshness: fresh`、index-only 行 0、移した件数 + 残り = 移行前の総数。追跡済み 46 件は不変 | 集計から区分を落とす / db 行の削除を省く |

## 4. 既存テストへの影響

| 既存 oracle | 影響 |
| --- | --- |
| U-HOVER-003 / 004 / 007 / 011 / 013 / 014 | scaffold と md 照合の撤去で削除または縮約する。置き換えは 019 / 021。Refactor 相当の撤去は実装 PR (§8 の 6) で行い、削除する oracle の ID を PR 本文に列挙する |
| U-MEMWAKE-* | 通知レコードの変更後も回帰として維持する (017) |
| CANDIDATE-U-MEMEPI-009 / 010 / 011 / 012 / 013 / 017 / 018 | 新規 episode の書き込み・配送に関する行は本書が置き換える。実装 PR で `memory.md` §4.2 の該当節と同時に整理し、削除する oracle を PR 本文に列挙する |
| review custody 系 (`review-dispatch` / `review-merge-gate` / `review-attestation` のテスト) | `memoryId` を含むフィクスチャは v1 の読み取りとして残し、v2 の行を足す (009) |
