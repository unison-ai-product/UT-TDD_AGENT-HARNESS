---
title: "L7 plan admission record partition test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-14
---

# PLAN 台帳の asset 分割 テスト設計 (issue #1011)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/plan-admission-record-partition.md` である。
本書はその §3 形式、§4 凍結、§5 revise の base、§6 同じ PLAN の衝突、§7 alias の衝突、§8 検査規則、§10 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引 (§PLAN 台帳の asset 分割) だけを置き、本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-PARTREC-*`) だけを宣言する。
正式 ID `U-PARTREC-*` への 1:1 の昇格と Red のテスト (`it.fails`) は、src/ も scripts/ も含まない契約 PR + Red で入れる (`design-protection-diff-gate.md` §10.2)。実装 PR は `it.fails` を `it` に戻して Green にするだけで、本書には触れない。
§4 の既存 oracle (U-RECHAIN-*) の改訂も同じ契約 PR + Red で行う。

## 2. fixture

- 純関数の行 (`parseAssetChain` / `verifyPartitionedAdmission` / `verifyAssetChainDelta` / `resolveAssetTail` / `loadAdmissionProjection`) は、メモリ上の `AdmissionTreeReader` fake を使う。legacy 台帳は、実 repo の `docs/governance/plan-admission-receipts.json` を読んだものを基にする。asset ファイルは、record を `trackedReceiptRecordDigest` で組み立てる helper で作る。
- ROOT.json は fixture ごとに legacy 台帳の実測値から作る。ROOT.json 無しの fixture は、単一台帳モード (現行) の確認にだけ使う。
- 2 本の PR の行 (007〜009、011) は、temp の git repo に main と 2 本の branch を作る。branch はそれぞれ別の asset ファイルに record を追記する (同じ asset の行だけ同じファイルに追記する)。検査は、PR を 1 本ずつ merge した結果の tree と、`verifyAssetChainDelta` の 3 tree (merge-base / head / main の現在) の両方にかける。
- 実 repo を読む行 (001、022) は、凍結前の main では ROOT.json が無いので、legacy 台帳だけを検査する。
- `listAssetDir` の順序を変える行 (021) は、同じ fixture を逆順・乱順で読ませる。
- 各行は設計文書の規則を 1 本だけ殺すように作る。

## 3. Candidate oracle matrix

| Candidate | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-PARTREC-001` | 実 repo の legacy 台帳。全 483 records について `trackedReceiptRecordDigest` を再計算し、`record_digest` と比べる。ROOT.json は legacy 台帳の実測値から作り、`legacy_file_digest` / `legacy_record_count` / `legacy_root_record_digest` を比べる | 483 件すべて一致し、ROOT の 3 値が一致する。`sequence` は 1〜483、`previous_record_digest` は先頭が null で以降が直前の digest | 凍結の際に legacy を renumber・再 digest する (record_digest が変わる)。ROOT の件数を数え間違える |
| `CANDIDATE-U-PARTREC-002` | legacy 台帳の 1 byte (record の `content_digest` の 1 文字) を書き換え、ROOT はそのままにして `verifyPartitionedAdmission` | `ok=false`、理由に `legacy-frozen-digest-mismatch` (record digest も合わせて壊れるなら `record-digest-mismatch` が追加される)。ROOT.json 無しの fixture では分割の検査を行わず、`ok=true` (単一台帳モード) | P1 の byte digest 照合を省く (record digest が偶然整合する書き換えを通す)。ROOT 無しでも分割の検査を走らせる |
| `CANDIDATE-U-PARTREC-003` | `verifyAssetChainDelta` に、(a) head で ROOT.json の値を 1 つ変えた tree、(b) head で ROOT.json を削除した tree、(c) head で legacy 台帳に末尾 record を 1 件追記した tree を渡す | (a)(b) `ok=false`、理由 `root-modified`。(c) `ok=false`、理由 `legacy-modified` | D4 を省く (凍結後に legacy へ追記できてしまう)。ROOT の削除を「分割の無効化」として通す |
| `CANDIDATE-U-PARTREC-004` | 新規 asset のファイル。(正) 先頭 record が `sequence=1`、`previous_record_digest` = ROOT の root、revision=1。(負 a) 先頭の previous が null、(負 b) 先頭の previous が ROOT の root 以外の digest、(負 c) 先頭の `sequence` が 2 | (正) `ok=true`。(負 a)(負 b) `previous-record-digest-mismatch`、(負 c) `sequence-not-canonical` | 先頭の previous を null として許す。先頭の previous の照合を省く。`sequence` を全体通しにする |
| `CANDIDATE-U-PARTREC-005` | asset A の revise。manifest の `base.asset_tail_digest` は A の末尾 record の digest。その後、別の asset B のファイルに record が追加された tree で、runner の preflight をかける | preflight は通る (別の asset の追加で drift しない)。A のファイルに 1 件追記された tree では `plan-revision-asset-tail-drift` で停止する | base を全体の末尾 (`projection_tail_digest`) に束縛したまま (別の asset の追加でも drift する)。base の照合を省く (A の追記でも通る) |
| `CANDIDATE-U-PARTREC-006` | legacy 台帳にだけ在る asset (legacy の最後の revision = n)。(a) `resolveAssetTail` は legacy でその asset の最後の record を `region="legacy"`、revision=n で返す。(b) その asset の最初の追記 (asset ファイルの新規作成) の revision が n+1 のとき、(c) n+2 のとき、(d) n のとき | (a) 期待どおり。(b) `ok=true`。(c)(d) `revision-discontinuous`。追記後の `resolveAssetTail` は `region="asset"` で asset ファイルの末尾を返す | asset ファイルの先頭の revision を 1 に戻す。legacy の続きの revision を検査しない。asset ファイルがあっても legacy の末尾を返す |
| `CANDIDATE-U-PARTREC-007` | 別々の PLAN の 2 本の PR (PR-A は asset A、PR-B は asset B に追記)。順序 (i) A→B と (ii) B→A の両方で merge する | 両方の順で git の merge は衝突せず、merge 結果の tree が `verifyPartitionedAdmission` を通る。2 本目の `verifyAssetChainDelta` も通る。各 PR の asset ファイルの byte は、merge の前後で変わらない。rechain (`verifyRechainDelta` の呼び出し、`:rechain-<n>` の command_id) は 0 回 | 全体 1 本の chain に戻す (2 本目が衝突または rechain になる)。2 本目の検査が 1 本目の asset を読んで落ちる |
| `CANDIDATE-U-PARTREC-008` | 同じ PLAN の revision の 2 本の PR (同じ asset A に revision n+1 を別内容で追記、PR-X と PR-Y)。順序 (i) X→Y と (ii) Y→X | 後から merge しようとした側の `verifyAssetChainDelta` が `ok=false`、理由 `asset-chain-moved` (git が先に衝突した場合は wrapper が衝突で停止し、検査まで進まない)。先に merge した側の tree は検査を通ったまま変わらない。(i) と (ii) で拒否される側が入れ替わるだけで、対称である | D2 を省く (後発が通る)。後発ではなく先発を拒否する。衝突を黙って解消する |
| `CANDIDATE-U-PARTREC-009` | legacy にだけ在る asset の最初の revise を、2 本の PR が同時に行う (どちらも同じ名前の asset ファイルを新規作成する) | 後から merge する側が `ok=false`、理由 `asset-chain-fork` (git の add/add 衝突で止まる場合は衝突で停止する)。先に入った側は変わらない | D3 を省く (同名ファイルの 2 つ目の新規作成が先のファイルを上書きして通る) |
| `CANDIDATE-U-PARTREC-010` | `verifyAssetChainDelta`。head の asset ファイルが、(a) merge-base の records の 1 件目を書き換えた、(b) 中間の record を 1 件削除した、(c) records の順序を入れ替えた、(d) 末尾に 1 件追記しただけ | (a)(b)(c) `ok=false`、理由 `asset-chain-not-append-only`。(d) `ok=true` | D1 を「件数が減らない」だけの照合にする (a や c が通る) |
| `CANDIDATE-U-PARTREC-011` | 別々の PR が、別の asset_id で同じ plan_id を新規起票する (ファイル名は異なるので git は衝突しない)。merge 結果の tree に `verifyPartitionedAdmission` | `ok=false`、理由 `alias-collision:<plan_id>`。2 本のどちらが先に merge されても、後から入る側の merge 結果で検出される | alias の検査を 1 asset ファイル内だけにする。harness.db (worktree 局所 cache) の `plan_aliases` だけに頼る |
| `CANDIDATE-U-PARTREC-012` | plan_id が legacy 台帳に在る。(a) asset ファイル側の asset が、legacy でその plan_id の最大 sequence の record の asset (続き)。(b) legacy で plan_id が 2 asset にまたがる fixture (実 repo の 2 件) で、最後の record の asset が続ける。(c) 同じ fixture で、最後でない方の asset が続ける。(d) legacy に無い別の asset が同じ plan_id を名乗る | (a)(b) `ok=true`。(c)(d) `alias-collision:<plan_id>` | legacy を alias の走査から外す。続きの asset の判定を「legacy に在るか」だけにする ((c) が通る) |
| `CANDIDATE-U-PARTREC-013` | plan_id が異なり `binding.path` が同じ 2 つの asset ファイル | `ok=false`、`alias-collision` (path の衝突を含めて検出する) | path の衝突を検査しない |
| `CANDIDATE-U-PARTREC-014` | (a) asset ファイルを別の名前に rename した、(b) ファイル内のある record の `binding.asset_id` を別の asset に書き換えた、(c) ヘッダの `asset_id` を書き換えた | (a)(c) `asset-file-name-mismatch`。(b) `asset-file-name-mismatch` または `record-digest-mismatch` (digest を再計算して整合させても、asset_id の一致検査で拒否される) | ファイル名と asset_id の照合を省く。`binding.asset_id` とヘッダの一致を検査しない |
| `CANDIDATE-U-PARTREC-015` | 凍結後の revision (n+1) を指す `admission_receipt` を持つ PLAN の tree。(a) asset ファイルを削除、(b) ファイルは在るが該当の record だけを削除し、digest の連鎖を再計算して整合させる、(c) record の `binding.content_digest` を書き換えて digest を再計算し、PLAN の frontmatter と食い違わせる | (a) `asset-file-missing:<asset_id>`。(b) `asset-record-missing:<receipt_id>`。(c) `receipt-binding-mismatch`。いずれも `ok=false` で、PASS にならない (「検査できない」を PASS にしない) | P6 を省く (PLAN の source と台帳の突き合わせをしないので、(a)(b)(c) が通る)。ファイルが無いことを「record 0 件」として扱う |
| `CANDIDATE-U-PARTREC-016` | asset ファイルの改ざん。(a) record の 1 フィールド (`content_digest`) を 1 文字変えた、(b) 中間の record を削除した (後続の `sequence` と previous は据え置き)、(c) 末尾の record の `record_digest` だけ書き換えた | (a)(c) `record-digest-mismatch`。(b) `sequence-not-canonical` と `previous-record-digest-mismatch`。いずれも `parseAssetChain` が `ok=false` で、records を 1 件も返さない (部分採用なし) | digest の再計算を省く。不整合のある record だけを捨てて残りを採用する |
| `CANDIDATE-U-PARTREC-017` | (a) 2 つの asset ファイルが同じ `command_id` を持つ。(b) 同じ `receipt_id`。(c) asset ファイルの record の `command_id` が legacy 台帳の record と同じ | いずれも `ok=false`、理由 `command-id-duplicate` / `receipt-id-duplicate` (legacy と asset ファイルをまたいで検出) | 一意性の検査をファイル単位にする |
| `CANDIDATE-U-PARTREC-018` | ディレクトリに、(a) `ROOT.json` と asset ファイルのほかに `index.json` を置く、(b) `.lock` を置く、(c) asset ファイルの名前の規則に合わない `foo.json` を置く | いずれも `ok=false`、理由 `unexpected-file:<name>`。PLAN 専用の index・lock・手番のファイルを足せない | P2 を省く (最小実装原則の違反が通る)。`.json` なら何でも許す |
| `CANDIDATE-U-PARTREC-019` | `loadAdmissionProjection` で、legacy にだけ在る command_id、asset ファイルにだけ在る command_id、どちらにも無い command_id を `lookup` する | 前 2 つは正しい record の射影を返し、無いものは `undefined`。`validate()` は、分割の検査 (P1〜P6) の結果を `findings` に反映する (改ざんした tree では `ok=false`)。`src/cli/plan-admission.ts` と `github-review-lane-provenance.ts` は legacy だけでなく asset ファイルの record も解決できる | `loadAdmissionProjection` が legacy だけを読む (asset ファイルの record が `lookup` で見つからない)。`validate()` が常に `ok=true` を返す |
| `CANDIDATE-U-PARTREC-020` | rehydrate。(a) manifest の asset の asset ファイルの末尾の revision を embedded receipt とする PLAN。(b) 末尾より古い revision の receipt を embedded とする PLAN。(c) 他の asset のファイルを壊した tree で (a)。(d) alias の衝突がある tree で (a) | (a) 成功する。(b) `plan-revision-rehydration-lineage-ambiguous`。(c) その asset の rehydrate には影響しない (他の asset のファイルは読まない)。(d) `plan-revision-rehydration-alias-ambiguous` | 全 asset ファイルを読んで他の asset の破損で止まる ((c) が落ちる)。末尾の確認を省く ((b) が通る) |
| `CANDIDATE-U-PARTREC-021` | 同じ tree を、`listAssetDir` の順序だけ変えて (昇順・降順・乱順) `verifyPartitionedAdmission` にかける | `verifierDigest` が完全一致する。理由の配列の順序も一致する (ファイル名の辞書順に正規化する) | ディレクトリの列挙順をそのまま使う (digest や理由の順序が変わる) |
| `CANDIDATE-U-PARTREC-022` | golden vector。実 repo の legacy 台帳から選んだ 3 件 (sequence 1、中間、末尾) と同じ入力から、asset ファイル用の record を `trackedReceiptRecordDigest` で作り、`sequence` と `previous_record_digest` だけを変えて digest を計算する | 入力が同じなら legacy の record と同じ digest 関数を通ること (digest の式が asset ファイルでも同一であること) が確かめられる。legacy の 3 件の `record_digest` は変わらない | asset ファイルで別の digest の式 (`stableJson` など) を使う。legacy の digest 関数を変更する |
| `CANDIDATE-U-PARTREC-023` | M3 の後の repo の規律の文書 (`CLAUDE.md`、`AGENTS.md`、`.claude/CLAUDE.md`) を走査する (real-repo の回帰テスト) | 「writer の手番」を運用として要求する記述が 0 件である。分割を説明する正本の指す先は、本書の L6 文書である | 手番の記述が残る。規律の文書が本書を指さない |
| `CANDIDATE-U-PARTREC-024` | asset ファイルを 1 つも持たない ROOT.json だけの tree (M3 の直後) | `ok=true`。`resolveAssetTail` は legacy の asset には `region="legacy"`、未知の asset には `undefined` を返す | asset ファイルが 0 個のとき `verifyPartitionedAdmission` が失敗する (空の directory を異常とする) |

## 4. 既存 oracle の改訂 (契約 PR + Red で行う)

分割の有効後は、単一台帳への追記を再発行する rechain の経路が使われなくなる。次の既存 oracle は、対象を asset ファイルの chain に読み替える。実装 PR は、改訂の内容を契約 PR + Red に固定した後に Green にする。

| 既存 ID | 現行の内容 | 改訂の内容 | 殺す mutation |
| --- | --- | --- | --- |
| U-RECHAIN-004 | 追加 record の数が `H` と異なる、または別 PLAN を bind → `fail` | ROOT.json が在る tree では対象外とし、asset ファイルの追記は `verifyAssetChainDelta` (D1〜D5) が検査する。ROOT.json が無い tree では現行のまま | 分割モードでも `verifyRechainDelta` が呼ばれる |
| U-RECHAIN-005 | `content_digest` が `R` の PLAN と不一致、chain が不連続 → `fail` | 分割モードでは、asset ファイルの chain の不連続は `parseAssetChain` が、PLAN と record の `content_digest` の不一致は P6 が `fail` にする。ROOT.json が無い tree では現行のまま | 分割モードで chain の不連続が PASS になる |
| U-RECHAIN-019 | legacy bootstrap 除外 (`plan:legacy:` の asset の revision 2 を拒否) | 分割モードでは、legacy asset の続きは asset ファイルの先頭 revision = legacy の最後 + 1 として許す (CANDIDATE-U-PARTREC-006)。ROOT.json が無い tree では現行のまま | 分割モードでも legacy asset の revision 2 を一律に拒否する |

## 5. Gate and scope fence

- 本書の oracle は、tracked の admission record の置き場・chain の形式・検査規則だけを扱う。harness.db の schema、plan lint、PLAN 本文の規則 (supersession、generates の所有)、review custody、`ut-tdd pr merge` の review の判定は対象外とする。
- ROOT.json が無い tree の挙動は現行のまま変えない。既存の `tests/` (単一台帳の chain の検査を含む) は、M2 の実装 PR で無変更で green であること。
- 候補 ID の旧台帳 (`CANDIDATE-U-RECHAIN-*` 等) の意味を、本書は再定義しない。§4 の改訂は、分割モードの tree に限る。
- 契約 PR + Red で `src/plan-admission/asset-chain.ts` がまだ無いために import が失敗して `it.fails` が成立しても、各規則の Red の証拠にならない。実装 PR は、候補ごとに規則を 1 本だけ殺す mutation を入れて Red になることを確かめ、そのログを §6 に残す。

## 6. Required evidence

実装 PR は次を残す。

- 各 candidate の Red→Green ログ (mutation を入れた Red の再現を含む)。
- CANDIDATE-U-PARTREC-007 と 008 は、temp の git repo で 2 本の PR を両方の順で merge した実行ログ (rechain が 0 回であること、後発が拒否されること)。
- 既存の rechain / projection のテストが無変更で green であること。§4 の改訂後の U-RECHAIN-004 / 005 / 019 が green であること。
- typecheck / Biome、Linux / Windows / aggregate CI の run ID、exact HEAD、非著者 closing receipt digest。
