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
正式 oracle ID へ未昇格で、実装 Green を意味しない。唯一の machine authority は HEAD の Git
blob (read) と `origin` remote から導出した `owner/repo` 文字列 (create) である。working
tree の内容、環境変数、呼び出し元の宣言は判定入力にしない。

## read: HEAD-strict と working tree非入力 (§3.1、Fail-close contract「read」)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-PROJID-001 | HEAD blob と受理側 receipt (`blobOid`/`contentDigest`/`sourceCommit`) が全field一致 | facts integrityを受理 |
| CANDIDATE-U-PROJID-002 | working treeの `ut-tdd.project.json` だけを編集し HEAD blob は変更しない | readはHEADの値のみを返し、working treeの編集は反映されない |
| CANDIDATE-U-PROJID-003 | HEADにtracked entryが無い (untracked/削除済み) | `plan-repository-identity-missing` |
| CANDIDATE-U-PROJID-004 | tracked entryのGit modeが `120000` (symlink) 等、`100644` 以外 | 正規表現不一致によりmissing扱いでdeny |
| CANDIDATE-U-PROJID-005 | 1プロセス内でHEADが別commitへ進んだ直後に再読取 | 古い値をキャッシュせず新HEADの値を再取得する。stale cacheはRed |
| CANDIDATE-U-PROJID-006 | 重複key/想定外keyを含むJSONがHEADにある | `plan-project-config-invalid` |
| CANDIDATE-U-PROJID-007 | `repository_identity` がgrammar不正 (path区切り複数、絶対path形状) | `plan-repository-identity-invalid` |
| CANDIDATE-U-PROJID-008 | 呼び出し側が渡す `expectedRepositoryIdentity` とHEADの値が不一致 | `plan-repository-identity-missing` |
| CANDIDATE-U-PROJID-009 | HEADのファイル先頭にUTF-8 BOMが付与されている | decode失敗により `plan-project-config-invalid` |
| CANDIDATE-U-PROJID-010 | HEADのファイルがCRLF化されているがJSONとしては有効 | digest再計算で不一致を検出できる。read自体は既存receiptと突き合わせて判定する |

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
| CANDIDATE-U-PROJID-024 | create経路が生成するbytesの改行/BOMを検査する | 常にLF・BOM無しで書く (010と対) |
| CANDIDATE-U-PROJID-025 | Windowsの8.3 short-name表記 (`C:\PROGRA~1\...`) と正規path表記で同じrepoを指す | 導出される `repository_identity` が同一になる |
| CANDIDATE-U-PROJID-026 | 大小文字違いのpath表記が同一repo (同一volume/inode) を指す | 同一identityを返し、二重生成しない |
| CANDIDATE-U-PROJID-027 | 別repository由来のsyntactically-valid identity (grammarは正しいが値が不一致) をコピーして配置 | `expectedRepositoryIdentity` との比較でdeny。値をそのまま受理しない |
| CANDIDATE-U-PROJID-028 | working treeに既にstaleな (origin導出値と異なる) untrackedファイルがある状態でcreateを起動する | check-before-createでdenyし、黙って上書きしない |
| CANDIDATE-U-PROJID-029 | repo root自体がjunction/reparse pointに差し替えられている | 解決不能・不一致をdenyし、repo外へescapeしない |
| CANDIDATE-U-PROJID-030 | `UT_TDD_PROJECT_DIR` 等の環境変数がrepoと異なる場所を指す | identity値の導出は変わらない (repo content由来のみ、env非依存) |

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
再計算し、宣言値との不一致を拒否する。

## Scope guard

本 test-design は docs-only pair-freeze であり、consumer runtime placement (#420/#463)、
Node generation producer (#485/#515)、Pack publication、global memory本文、remote
mutation、semantic ranking、実装Green、PR更新を行わない。candidateはForward/Reverseと
同じ番号・同じoracleを持つ。
