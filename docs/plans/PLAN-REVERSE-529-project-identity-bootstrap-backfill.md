---
plan_id: PLAN-REVERSE-529-project-identity-bootstrap-backfill
title: "PLAN-REVERSE-529: project identity bootstrap backfill (read/create/commit-policy)"
kind: reverse
layer: cross
drive: fullstack
route_signal: design_gap
route_mode: reverse
status: draft
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-09-04
updated: 2026-09-04
owner: PO / TL
github_issue_id: 432
parent_design: docs/plans/PLAN-L7-529-project-identity-bootstrap.md
pair_artifact: docs/test-design/harness/L7-project-identity-bootstrap-test-design.md
agent_slots:
  - role: qa
    slot_label: "QA - read/create/commit-policy 決定性契約を独立変異で再検証する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-529-project-identity-bootstrap-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-529-project-identity-bootstrap.md
  requires: []
  blocks: []
  references:
    - docs/test-design/harness/L7-project-identity-bootstrap-test-design.md
review_evidence: []
---

# PLAN-REVERSE-529

## R0 — pair-freeze boundary

Forward と test-design の canonical boundary は、`ut-tdd.project.json` の read を HEAD の Git
blob に厳密に固定し、次の4点を独立変異で保証することである: (a) working treeとのbytes diffを
検査し不一致を `identity_worktree_drift` として typed deny する (working treeはHEADに劣後する
参照値ではなく drift検出の入力である)、(b) `HEAD` を1回だけcommit OIDへ解決して以降の
`ls-tree`/`show`/receipt再検証すべてに同じOIDを使うsingle-commit bindingでTOCTOUを閉じる、
(c) HEAD bytesをcanonical re-serializationと比較しCRLF化やkey順序違いを
`identity_noncanonical_bytes` として deny する、(d) `origin` remote由来の期待値 (無ければ
呼び出し側の明示 `expectedRepositoryIdentity`) との一致をloader内部の必須ステップとして検証し、
どちらも無ければ `identity_repository_unbound` として deny する。create は `origin` remoteから
導出した `owner/repo` 文字列のみを入力とし、同一入力からbyte-identicalなcanonical JSONを
生成する。作成は `setup` 専用経路に限り、read専用呼び出し元はcreateを試みない。`setup` は
working treeにファイルを書くだけでcommitは実行しない (§3.3案B)。identityはrepository
directoryの移動、linked worktreeの追加、junction/symlink/8.3/大小文字違いのpath表記で値が
変わらない。

(a)〜(d) はいずれも現行実装 (基準ref `7b18ee4e`) には存在しない新規ruleであり、本reverseは
「今の挙動の再現」ではなく「実装R1で追加すべき契約」を固定する (Forward §3.1.1〜§3.1.4)。

次の保証を実装 R1 以降で独立変異する。全 candidate の番号と oracle は paired test-design と
一致する。

## R2 — candidate/oracle contract

| Candidate | Oracle |
|---|---|
| 001 | HEAD blob と receipt が全field一致すれば accept |
| 002 | working treeのbytesがHEAD blobと異なれば `identity_worktree_drift` でdeny (HEADの値をそのまま返したらRed、032/033と対) |
| 003 | HEAD に tracked entry が無ければ `plan-repository-identity-missing` |
| 004 | tracked entry の mode が `100644` でなければ (symlink等) missing 扱いで deny |
| 005 | 読み取り中に HEAD が進んでも古い値をキャッシュせず再取得する。stale cache は Red (単純再読取のcandidate。TOCTOU本体は031) |
| 006 | 重複key/想定外keyを含む JSON は `plan-project-config-invalid` |
| 007 | grammar不正 (path区切り・絶対path形状) な `repository_identity` は `plan-repository-identity-invalid` |
| 008 | `expectedRepositoryIdentity` 不一致は `plan-repository-identity-missing` |
| 009 | UTF-8 BOM付与ファイルは、decoder が BOM を除去して parse に成功しても、§3.1.3 canonical bytes 比較で `identity_noncanonical_bytes` として deny される (基準 ref では accept = Red 起点、010 と対) |
| 010 | CRLF化ファイルはvalid JSONとしてparseでき、digest再計算 (bytes自己無矛盾性) だけでは検出できない。検出は034のcanonical bytes比較で行う。create契約はCRLFを生成しない (024と対) |
| 011 | ssh形式 origin (`git@host:owner/repo.git`) から `owner/repo` を導出して作成 |
| 012 | https形式 origin から同一repoなら 011 と同じ `owner/repo` を導出 |
| 013 | origin remote 無しは作成せず deny。directory名へのfallback無し |
| 014 | 未知形式 origin は作成せず deny |
| 015 | 同一originでの2回実行は byte-identical (field順・改行・BOM無し・末尾改行1個) |
| 016 | 既にHEADにidentityがあるrepoでの再実行は no-op read。ファイル書き換え無し |
| 017 | read専用呼び出し元 (doctor/plan-admission/legacy-inventory) は create を試みない |
| 018 | working-tree-onlyの生成物がある状態での再実行は同じbytesを再生成するのみ。read側はHEADに無いためmissingのまま |
| 019 | `setup` の create経路は `git commit` を呼ばない |
| 020 | 生成content文字列に絶対path・hostname・cwd文字列を含まない |
| 021 | linked worktree はmain worktreeと同じ `repository_identity` を返す |
| 022 | repository directoryのrename/moveで `repository_identity` は不変 (origin依存、path非依存) |
| 023 | 異なるoriginは disjoint な `repository_identity` と disjoint な project-memory-root namespace hashを持つ |
| 024 | create契約は常にLF・BOM無しで書く (010と対) |
| 025 | 8.3 short-name表記と正規path表記で同一repoなら同一identityを導出する |
| 026 | 大小文字違いのpath表記が同一repoを指す場合、同一identityで二重生成しない |
| 027 | 別repo由来のstale identity (grammar上valid、値が不一致) はloader内部のrepository binding (§3.1.4) でdeny。呼び出し側が `expectedRepositoryIdentity` を渡していなくてもdenyされる |
| 028 | check-before-create: 既存untracked stale fileがorigin導出値と異なれば、黙って上書きせずdeny |
| 029 | repo root自体がjunction/reparse pointの場合、解決不能・不一致はdenyし、repo外へescapeしない |
| 030 | `UT_TDD_PROJECT_DIR` 等の環境変数はidentity値の導出に影響しない (repo content由来のみ) |
| 031 | `HEAD`をOID解決した直後、`ls-tree`/`show`が読む前に別プロセスがHEADを動かす (TOCTOU)。mixed receipt (sourceCommitと実読み取りcommit不一致) を受理せず、`identity_head_toctou` でdenyするか bounded retryで一致するまで再試行する。古い/新しい値を推測で採用したらRed |
| 032 | HEADにtracked entryがあるがworking treeからファイルが削除されている (ローカル削除) は `identity_worktree_drift` でdeny |
| 033 | working treeがHEAD blobとbyte同一 (通常のcheckout直後) の正常系はdrift denyを発生させずreadが成功する (002/032のpositive control) |
| 034 | HEAD bytesがCRLF化されているがJSONとしてはvalid・値も一致する場合、canonical re-serializationとの不一致により `identity_noncanonical_bytes` でdeny |
| 035 | HEAD bytesのJSON key順序が `repository_identity`→`schema_version` に入れ替わっている (値・grammar上はvalid) 場合も034と同じく `identity_noncanonical_bytes` でdeny (field順もcanonical契約の一部) |
| 036 | `node-plan-revision-runner.ts` の `repositoryIdentity()` port経由で別origin由来のgrammar-valid stale identityをHEADに持つrepoを読むと、loader内部binding (§3.1.4) によりcallerがexpected値を渡さなくてもdenyされる |
| 037 | `legacy-plan-inventory.ts` の `buildLegacyPlanInventory` 経由で036と同じstale identityを読んでも、036と同じくloader内部bindingでdenyされる |
| 038 | `project-memory-root.ts` の独立 reader `projectIdentityFromHead` 経由で036と同じstale identityを読んでも `identity_repository_unbound` で deny される。独立 reader 自身の binding または共有 loader への統合を要求し、loader 側だけの変更では Green にしない (基準 ref では accept = Red 起点) |
| 039 | `origin` remoteが存在せず、呼び出し側も `expectedRepositoryIdentity` を渡さない状態でHEADにgrammar-valid identityがある場合は `identity_repository_unbound` でdeny。HEAD値をそのまま信頼しない |
| P-001 | 本harness repo自身のtracked identityを、origin (`unison-ai-product/UT-TDD_AGENT-HARNESS`) から再導出したcanonical bytesと比較して一致することを実repoで確認する |
| P-002 | 一時clean-consumer fixture repo (identity無し) に対しbootstrap契約を実行し、作成→commit→readの一連が成立することを実repoで確認する |
| P-003 | fixture repoでcase違い/8.3/junction相当のpath表記を再現し、identity解決が変わらないことを実OS操作で確認する |

Candidate ID inventory (Forward/test-design と同一):

CANDIDATE-U-PROJID-001 CANDIDATE-U-PROJID-002 CANDIDATE-U-PROJID-003 CANDIDATE-U-PROJID-004 CANDIDATE-U-PROJID-005 CANDIDATE-U-PROJID-006 CANDIDATE-U-PROJID-007 CANDIDATE-U-PROJID-008 CANDIDATE-U-PROJID-009 CANDIDATE-U-PROJID-010 CANDIDATE-U-PROJID-011 CANDIDATE-U-PROJID-012 CANDIDATE-U-PROJID-013 CANDIDATE-U-PROJID-014 CANDIDATE-U-PROJID-015 CANDIDATE-U-PROJID-016 CANDIDATE-U-PROJID-017 CANDIDATE-U-PROJID-018 CANDIDATE-U-PROJID-019 CANDIDATE-U-PROJID-020 CANDIDATE-U-PROJID-021 CANDIDATE-U-PROJID-022 CANDIDATE-U-PROJID-023 CANDIDATE-U-PROJID-024 CANDIDATE-U-PROJID-025 CANDIDATE-U-PROJID-026 CANDIDATE-U-PROJID-027 CANDIDATE-U-PROJID-028 CANDIDATE-U-PROJID-029 CANDIDATE-U-PROJID-030 CANDIDATE-U-PROJID-031 CANDIDATE-U-PROJID-032 CANDIDATE-U-PROJID-033 CANDIDATE-U-PROJID-034 CANDIDATE-U-PROJID-035 CANDIDATE-U-PROJID-036 CANDIDATE-U-PROJID-037 CANDIDATE-U-PROJID-038 CANDIDATE-U-PROJID-039

実 repo regression: `CANDIDATE-P-PROJID-001`、`CANDIDATE-P-PROJID-002`、
`CANDIDATE-P-PROJID-003`。

## R3 — verification boundary

R3 は同一 exact HEAD の Forward、Reverse、test-design を読み、上表の各 ID の刺激と oracle が
一致することを確認する。read側の正本はHEADのGit blobだが、working treeとのdiff検査
(§3.1.1)、single-commit binding (§3.1.2)、canonical bytes比較 (§3.1.3)、loader内部
repository binding (§3.1.4) を独立変異の対象とし、working tree値をHEADに優先させる
fallbackや、origin以外の入力 (directory名・hostname・UUID生成) からのidentity生成を
許さない。

R3のfail条件は、working tree driftのsilent accept、HEAD解決とls-tree/show呼び出しの
commit不一致 (mixed receipt) の受理、非canonicalなbytes (CRLF/BOM/key順序違い) のsilent
accept、呼び出し側がexpected値を渡さない場合のstale identity受理、非決定的serialization、
read専用呼び出し元によるcreate、`setup`によるcommitの暗黙実行、または3文書間のID/oracle
drift である。

## R4 — backprop boundary

R1/R2/R3 の実装Greenはこのdocs-only freezeの完了を意味しない。実装PRは別途、
working tree drift検査・single-commit binding・canonical bytes比較・loader内部
repository binding (Forward §3.1.1〜§3.1.4、いずれも現行実装には無い新規rule)、
origin remote正規化、`setup`専用create経路、check-before-create、real path解決の
変更範囲を明示する。consumer runtime placement (#420/#463)、Node generation producer
(#485/#515)、Pack publication、global memory本文、remote mutation、semantic rankingは
本reverseの対象外である。
