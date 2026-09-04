---
title: "L7 project identity bootstrap test design (read/create/commit-policy)"
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-529-project-identity-bootstrap
updated: 2026-09-04
---

# Project identity bootstrap test design

対になる Forward は `docs/plans/PLAN-L7-529-project-identity-bootstrap.md`、Reverse は
`docs/plans/PLAN-REVERSE-529-project-identity-bootstrap-backfill.md` である。candidate は
正式 oracle ID へ未昇格で、実装 Green を意味しない。read の machine authority は HEAD の
Git blob だが、working treeとのdiff検査 (§3.1.1)、single-commit binding (§3.1.2)、
canonical bytes比較 (§3.1.3)、`origin` remote由来のrepository binding (§3.1.4) の4点は
**現行実装 (基準ref `7b18ee4e`) には無い新規rule**であり、本test-designはその追加契約を
固定する。create の machine authority は `origin` remoteから導出した `owner/repo` 文字列
のみである。環境変数、directory名、hostnameは判定入力にしない。

## read: HEAD-strict + working tree drift + single-commit binding + canonical bytes (Forward §3.1.1/§3.1.2/§3.1.3、Fail-close contract「read」)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-PROJID-001 | HEAD blob と受理側 receipt (`blobOid`/`contentDigest`/`sourceCommit`) が全field一致 | facts integrityを受理 |
| CANDIDATE-U-PROJID-002 | working treeの `ut-tdd.project.json` をHEAD blobと異なる内容に編集する (未commit) | `identity_worktree_drift` としてtyped deny。HEADの値をそのまま返したらRed (新規rule、033と対) |
| CANDIDATE-U-PROJID-003 | HEADにtracked entryが無い (untracked/削除済み) | `plan-repository-identity-missing` |
| CANDIDATE-U-PROJID-004 | tracked entryのGit modeが `120000` (symlink) 等、`100644` 以外 | 正規表現不一致によりmissing扱いでdeny |
| CANDIDATE-U-PROJID-005 | 1プロセス内でHEADが別commitへ進んだ直後に再読取 | 古い値をキャッシュせず新HEADの値を再取得する。stale cacheはRed (単純再読取。TOCTOU本体は031) |
| CANDIDATE-U-PROJID-006 | 重複key/想定外keyを含むJSONがHEADにある | `plan-project-config-invalid` |
| CANDIDATE-U-PROJID-007 | `repository_identity` がgrammar不正 (path区切り複数、絶対path形状) | `plan-repository-identity-invalid` |
| CANDIDATE-U-PROJID-008 | network originと`expectedRepositoryIdentity`が矛盾 | `identity_repository_unbound`。origin無しで明示expectedだけがHEAD値と不一致なら`plan-repository-identity-missing` |
| CANDIDATE-U-PROJID-009 | HEADのファイル先頭にUTF-8 BOMが付与されている (decoder は BOM を除去し JSON.parse は成功する) | canonical bytes 比較で `identity_noncanonical_bytes` として deny (基準 ref 7b18ee4e では accept = Red 起点、010 と対) |
| CANDIDATE-U-PROJID-010 | HEADのファイルがCRLF化されているがJSONとしては有効 | digest再計算 (bytes自己無矛盾性) だけでは検出できない。検出は034のcanonical bytes比較で行う (新規rule) |
| CANDIDATE-U-PROJID-031 | `HEAD`をOID解決した直後、`ls-tree`/`show`が読む前に別プロセスがHEADを動かす (TOCTOU) | mixed receipt (sourceCommitと実読み取りcommit不一致) を受理せず `identity_head_toctou` でdenyするか bounded retryで一致するまで再試行する。推測採用はRed (新規rule、loader L66-76の実測が根拠) |
| CANDIDATE-U-PROJID-032 | HEADにtracked entryがあるがworking treeからファイルが削除されている | `identity_worktree_drift` でdeny (002と同種、absenceケース) |
| CANDIDATE-U-PROJID-033 | working treeがHEAD blobとbyte同一 (通常のcheckout直後) | 正常系: drift denyを発生させずreadが成功する (002/032のpositive control) |
| CANDIDATE-U-PROJID-034 | HEAD bytesがCRLF化されているがJSONとしてvalid・値も一致 | canonical re-serializationとの不一致により `identity_noncanonical_bytes` でdeny (新規rule) |
| CANDIDATE-U-PROJID-035 | HEAD bytesのJSON key順序が `repository_identity`→`schema_version` に入れ替わっている (値・grammar上はvalid) | 034と同じく `identity_noncanonical_bytes` でdeny (field順もcanonical契約の一部) |

## create: 決定的入力と所有者 (§3.2、Fail-close contract「create 入力/決定性/所有者」)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-PROJID-011 | `origin` remoteが `git@host:owner/repo.git` 形式 | 正規化した `owner/repo` で作成する |
| CANDIDATE-U-PROJID-012 | 同じrepoの `origin` が `https://host/owner/repo.git` 形式 | 011と同一の `owner/repo` を導出する (表記非依存) |
| CANDIDATE-U-PROJID-013 | `origin` remoteが設定されていない | 作成せずdeny。directory名へのfallback無し |
| CANDIDATE-U-PROJID-014 | `origin` remoteが既知形式に一致しない文字列 | 作成せずdeny |
| CANDIDATE-U-PROJID-015 | 同一originに対しcreateを2回連続実行 | byte-identical (field順・改行・BOM無し・末尾改行1個が同一) |
| CANDIDATE-U-PROJID-016 | 既にHEADにidentityがあるrepoで再実行 | no-op read。ファイルを書き換えない |
| CANDIDATE-U-PROJID-017 | `doctor`/`node-plan-revision-runner`/`legacy-plan-inventory` などread専用呼び出し元がidentity欠落時に呼ばれる | createを試みず既存のdenyをそのまま返す |
| CANDIDATE-U-PROJID-018 | working-tree-onlyの未commit生成物がある状態で再実行 | 同じ入力から同じbytesを再生成するのみ。read側はHEAD未到達のためmissingのまま |

Setup orchestration integration (not a project-identity candidate):
`runSetup` に `bootstrapProjectIdentity` を注入し、identity が
`identity_repository_unbound` で deny された場合も、deny を
`SetupResult.projectIdentity` に保持して state/template の通常出力を継続することを確認する。
identity が作成された場合は実際の bootstrap dependency の結果を `written` の先頭へ一度だけ
prependし、deny の場合は identity path を追加しない。remote-less local repository の
identity denial を setup 全体の fatal error として扱ったら Red。

## commit policy (§3.3、Fail-close contract「commit policy」)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-PROJID-019 | `setup` のcreate経路の呼び出し全体を追跡する | `git commit` 相当の操作を一切実行しない (working treeに書くのみ) |

## namespace分離とpath非依存 (§3.4、Fail-close contract「namespace」「path非埋め込み」)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-PROJID-020 | 生成された `ut-tdd.project.json` の内容を検査する | 絶対path・hostname・cwd文字列を含まない |
| CANDIDATE-U-PROJID-021 | 同一repoのlinked worktreeからidentityを解決する | main worktreeと同一の `repository_identity` を返す |
| CANDIDATE-U-PROJID-022 | repository directoryをrename/move後にidentityを解決する | `repository_identity` は不変 (origin依存、path非依存) |
| CANDIDATE-U-PROJID-023 | 異なる `origin` を持つ2つのprojectでidentityを解決する | `repository_identity` と `project-memory-root` のnamespace hashがdisjointになる |

## 負系: Linux/Windows (§3.5、Fail-close contract「負系」)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-PROJID-024 | create経路が生成するbytesの改行/BOMを検査する | 常にLF・BOM無しで書く (010/034と対) |
| CANDIDATE-U-PROJID-025 | Windowsの8.3 short-name表記 (`C:\PROGRA~1\...`) と正規path表記で同じrepoを指す | 導出される `repository_identity` が同一になる |
| CANDIDATE-U-PROJID-026 | 大小文字違いのpath表記が同一repo (同一volume/inode) を指す | 同一identityを返し、二重生成しない |
| CANDIDATE-U-PROJID-027 | 別repository由来のsyntactically-valid identity (grammarは正しいが値が不一致) をコピーして配置 | loader内部のrepository binding (§3.1.4) でdeny。呼び出し側が `expectedRepositoryIdentity` を渡していなくてもdenyされる (新規rule、036-038と対) |
| CANDIDATE-U-PROJID-028 | working treeに既にstaleな (origin導出値と異なる) untrackedファイルがある状態でcreateを起動する | check-before-createでdenyし、黙って上書きしない |
| CANDIDATE-U-PROJID-029 | repo root自体がjunction/reparse pointに差し替えられている | 解決不能・不一致をdenyし、repo外へescapeしない |
| CANDIDATE-U-PROJID-030 | `UT_TDD_PROJECT_DIR` 等の環境変数がrepoと異なる場所を指す | identity値の導出は変わらない (repo content由来のみ、env非依存) |

## loader内部 repository binding の呼び出し元別回帰 (Forward §3.1.4)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-PROJID-036 | `node-plan-revision-runner.ts` の `repositoryIdentity()` port経由で、別origin由来のgrammar-valid stale identityをHEADに持つrepoを読む | loader内部binding (§3.1.4) によりcallerがexpected値を渡さなくてもdenyされる (現状は未対策、027の呼び出し元別ケース) |
| CANDIDATE-U-PROJID-037 | `legacy-plan-inventory.ts` の `buildLegacyPlanInventory` 経由で036と同じstale identityを読む | 036と同じくloader内部bindingでdenyされる |
| CANDIDATE-U-PROJID-038 | `project-memory-root.ts` の `projectIdentityFromHead` (loader を経由しない独立 reader) 経由で036と同じstale identityを読む | `identity_repository_unbound` で deny される。独立 reader 自身が §3.1.4 の binding を行うか、共有 loader へ統合済みであること (loader 側だけの変更で Green にしない)。基準 ref 7b18ee4e では accept される (Red 起点) |
| CANDIDATE-U-PROJID-039 | `origin` remoteが存在せず、呼び出し側も `expectedRepositoryIdentity` を渡さない状態でHEADにgrammar-valid identityがある | `identity_repository_unbound` でdeny。HEAD値をそのまま信頼しない |
| CANDIDATE-U-PROJID-040 | detached snapshot cloneの`origin`をlocal Git pathへ設定し、そのsource repositoryだけがcanonical network originを持つ | exactly one Git custody hopで同じidentityへ解決する。local path文字列や二段local originをidentityとして受理しない |
| CANDIDATE-U-PROJID-041 | canonical network originと異なる明示`expectedRepositoryIdentity`を同時に渡す | tracked identity比較より先に`identity_repository_unbound`でdenyし、到達不能branchにしない |

## 実 repo regression

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-P-PROJID-001 | 本harness repo自身のtracked `ut-tdd.project.json` (origin: `unison-ai-product/UT-TDD_AGENT-HARNESS`) を対象にcreate契約を再適用する | 既存blobのbytesと、originから再導出したcanonical bytesが一致する |
| CANDIDATE-P-PROJID-002 | 一時clean-consumer fixture repo (`git init`、identity無し、fakeな `origin` remoteを設定) でbootstrap契約を実行する | 作成(working tree)→明示commit→`loadProjectIdentityFromHead` によるread、の一連が成立する |
| CANDIDATE-P-PROJID-003 | fixture repoで大小文字違い/8.3 short-name相当のpath表記を実OS操作で再現する | identity解決結果が変わらず、二重生成もされない |

## canonical serialization設計

生成bytesはfield順 `schema_version` → `repository_identity`、UTF-8 (BOM無し)、LF改行、
2-space indent、末尾改行1個で固定する。read側 (`decodeConfig`) はkey重複・想定外keyを
`plan-project-config-invalid` として拒否し、grammar検証 (`validIdentity`) はpath区切り複数や
絶対path形状を通さない。receipt再計算 (`validReceipt`) はblob OID/content digestをbytesから
再計算し、宣言値との不一致を拒否する (ここまでは既存実装)。**新規rule**として、readはHEAD
bytesを一度decodeした内容からcanonical re-serializationを行い、実bytesと一致しなければ
`identity_noncanonical_bytes` としてdenyする (034/035)。これによりCRLF化やkey順序違いの
valid JSONを、値が一致していても受理しない。

## Scope guard

本 test-design は docs-only pair-freeze であり、consumer runtime placement (#420/#463)、
Node generation producer (#485/#515)、Pack publication、global memory本文、remote
mutation、semantic ranking、実装Green、PR更新を行わない。candidateはForward/Reverseと
同じ番号・同じoracleを持つ。
