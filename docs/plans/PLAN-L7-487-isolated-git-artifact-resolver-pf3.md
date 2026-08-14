---
plan_id: PLAN-L7-487-isolated-git-artifact-resolver-pf3
title: "PLAN-L7-487 (impl): PF-3 isolated Git artifact resolver pair-freeze"
kind: impl
layer: L7
drive: agent
route_signal: forward
route_mode: forward
status: confirmed
created: 2026-08-14
updated: 2026-08-14
owner: PM / PO
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - local Git objectだけから選択releaseを解決するresolverをTDD実装する"
  - role: qa
    slot_label: "QA - revision分離、object欠落、禁止副作用をmutationで検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-487-isolated-git-artifact-resolver-pf3.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/release-artifact-resolver.ts
    artifact_type: source_module
  - artifact_path: tests/release-artifact-resolver.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
  requires:
    - docs/plans/PLAN-L7-486-release-materializer-pf2.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
    - docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
    - docs/plans/PLAN-L7-486-release-materializer-pf2.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/schema/release-manifest.ts
    - src/setup/release-materializer.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/249
backprop_decision: not_required
backprop_decision_reason: "PLAN-L7-473でfreeze済みのPF-3 partitionを実装可能なlocal Git resolverへ限定する。L0-L6要件や外部仕様は変更せず、上流合流はPLAN-REVERSE-473が所有する。"
review_evidence:
  - reviewer: codex-blind-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-14T08:24:51Z"
    tests_green_at: "2026-08-14T08:20:42Z"
    verdict: pass_blocking_0_closing_review_pending
    scope: >-
      `U-RELMAN-012`の8群を実装し、独立攻撃で検出したcaller Git env/replace refs、
      到達可能promisor remote、batch framing/chunk境界の空振り、production runnerの
      batch stdout全量複製を是正した。claim-blind/spec-blind delta reviewはblocking 0。
      exact-HEAD CIとnon-author closing reviewは未実施であり、本entryはその判定を代替しない。
    worker_model: gpt-5.6-terra
    reviewer_model: gpt-5.6-sol
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/release-artifact-resolver.test.ts --reporter=dot"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-14T08:20:42Z"
        evidence_path: tests/release-artifact-resolver.test.ts
        output_digest: "sha256:b3a175a52d6d1d052fdf2a746f22b054f837fceeb5a6603c7efda94b93e52c70"
---

# PF-3: isolated Git artifact resolver pair-freeze

本PLANはmaster `PLAN-L7-473` のPF-3を、実装者がGit取得方式や責務境界を追加判断せずTDDできる
application serviceへ分ける。PF-2 (#248) はmainへmerge済みであり、Issue #249はReadyである。
本docs-only pair-freezeがexact-HEAD CIとnon-author closing reviewを通ってmainへmergeするまで、
PF-3実装を開始しない。

## 所有境界

PF-3が所有するoracleは既存`CANDIDATE-RELMAN-012`だけである。実装PRは
`src/setup/release-artifact-resolver.ts`と`tests/release-artifact-resolver.test.ts`を同じcommitで
追加し、candidateを`U-RELMAN-012`へ昇格する。同じcommitで本PLANの`generates`、status、
test citationを更新する。draft時点では未来のsource/testを`generates`へ宣言しない。

PF-3は選択済みのimmutable `ReleaseIdentity`をlocal Git object databaseから読み、PF-2 materializerへ
渡すところまでを所有する。manifest parse、channel選択、期待digestとのattestation、Pack checkoutへの
copy/write、staging、promotion、rollback、network取得は所有しない。digestの一致判定と三値
`attested / mismatch / unavailable`はPF-4 #250、aggregate side-effect admissionはPF-5 #251に残す。

## 入出力契約

公開関数`resolveReleaseArtifacts(input, dependencies)`は次だけを受け取る。

- `input.repository`: local Git object databaseを持つrepository root。resolverはこのrepositoryの
  worktree fileを読まない。
- `input.release`: PF-1の`ReleaseIdentity`。使用するfieldは`artifactSourceCommit`と
  `materializerVersion`であり、`releaseId`と`artifactSetDigest`は結果へ引き回すがPF-3では照合しない。
- `dependencies.git`: exact revisionのtree列挙とblob読出しだけを提供する`LocalGitObjectReader` port。
- `dependencies.materialize`: PF-2 `materializeReleaseArtifacts`と同型のport。

成功値は`releaseId`、`artifactSourceCommit`、materializerが返したimmutable `entries`と`digest`を持つ。
失敗値は次のtyped unionとし、例外、部分成功、空entry成功へ丸めない。

- local revisionまたは列挙済みblob objectが存在しない、Git command失敗、未知materializer version:
  `{ ok: false, error: "unavailable" }`
- tree entryの形式・type・mode・pathが不正なら`invalid_artifact`。PF-2が返した
  `invalid_distribution_plan` / `invalid_artifact`は同じerrorを保持する。

control checkoutのHEAD、branch、tag、working tree statusは入力にも判定条件にも含めない。同じcontrol HEAD
から`stable=v1`と`canary=v2`の異なる`ReleaseIdentity`を個別に渡した場合、各呼出しは各recordの
`artifactSourceCommit`だけを解決する。control HEADとのSHA一致を要求する分岐を作らない。

## local Git object adapter契約

既定`LocalGitObjectReader` adapterはshell文字列を組み立てず、`git`へargv配列と明示cwdを渡す。
全Git childのenvironmentへ`GIT_NO_LAZY_FETCH=1`と`GIT_TERMINAL_PROMPT=0`を強制し、呼出元envで
上書きさせない。partial cloneのpromisor remoteが設定されていてもmissing objectを暗黙取得しない。
許可するread-only plumbingは次の3形だけである。

1. `git cat-file -e <40-lower-hex>^{commit}`でlocal commit存在を確認する。
2. `git ls-tree -r -z --full-tree <revision>`でそのrevisionのtracked treeをNUL区切り列挙する。
3. `git cat-file --batch`を1 processだけ起動し、列挙結果に含まれる一意なblob OIDだけをstdinへ渡す。
   headerのdeclared byte sizeどおりにstdoutをstreamで読み、raw bytesを得る。

revisionはtrim/coerceせず`[a-f0-9]{40}`完全一致だけを受理する。`ls-tree` recordは
`<mode> SP <type> SP <oid> TAB <path> NUL`としてbyte境界でparseし、typeは`blob`、modeは
`100644 / 100755 / 120000`だけを受理する。pathはUTF-8 fatal decodeし、materializerへ未正規化の
repo相対POSIX pathとして渡す。duplicate path、NUL record欠損、field欠損、未知type/mode、Gitが
成功exitでも不正recordを返す場合は`invalid_artifact`でfail-closeする。symlinkはdereferenceせず、
mode `120000`とblobのtarget raw bytesをそのままPF-2へ渡す。

adapterは`fetch`、`pull`、`clone`、`checkout`、`worktree`、`archive`、`show`、revision省略形、tag、
remote名を使わない。`node:fs`からcurrent treeを読み直さず、temporary treeもPack checkoutも作らない。
commitまたはblob欠落時は直ちに`unavailable`を返し、remote lookup、現在treeからの再構成、別revisionへの
fallback、materializer、copy/writeを呼ばない。これは「isolated temporary tree」を作る方式より狭い
worktree非依存のobject-only解決であり、masterのisolation条件を満たす。

`cat-file --batch`はtext decodeせずstdoutをbinary streamとして扱う。各responseの
`<oid> blob <size>\n<exact size bytes>\n`または`<oid> missing\n`を状態機械でparseし、declared size未満、
余剰byte、OID/type不一致、途中exitはpartial contentを返さず`unavailable`とする。`execFileSync`等の
既定`maxBuffer`へ依存せず、chunkをdeclared sizeまで収集する。allocation不能も`unavailable`であり、
切詰めたbytesをmaterializerへ渡さない。

## 合成とcall-count契約

application serviceは次の順序を変えない。

1. release revisionのlocal commit存在確認を1回行う。欠落なら終了する。
2. exact revisionのtreeを1回列挙する。不正・失敗なら終了する。
3. 各blob OIDを列挙順に1回だけ読む。同じOIDが複数pathに現れる場合はbyte snapshotをOID単位でcacheし、
   2回目以降のGit読出しを行わない。ただしpath/mode entryは省略しない。
4. 全entryが揃った後にだけPF-2 materializerをexactly 1回呼ぶ。入力versionはrelease recordのtokenを
   そのまま渡し、`"1"`へのfallbackをしない。
5. 成功時もPack copy/writeは行わず、materialized snapshotを返すだけとする。

Git portとmaterializer port以外の副作用portは公開しない。テストではcommand記録spyとmaterializer
call counterを使い、欠落時に許可外Git argv 0、materializer 0を直接測る。network/reconstruction/
copy/writeは「実装にportが無い」という文章だけで証明せず、production moduleのimport境界
（`node:fs`、network client、distribution sync/apply moduleをimportしない）と、command allowlistを
source-level oracleで固定する。

## TDD oracle (`U-RELMAN-012`)

`tests/release-artifact-resolver.test.ts`は次を同一`describe("U-RELMAN-012")`内の独立ケースとして
RED→Green化する。

1. synthetic local Git repositoryに異なるtracked bytesを持つcommit v1/v2と、それらとは異なる
   control HEADを作る。stable record(v1)とcanary record(v2)を個別入力し、materializer spyが各revisionの
   path/mode/raw bytesだけを1回受けることをpinする。HEAD equality check、current tree read、他方revision
   混入mutantをkillする。
2. missing commitを指定し`unavailable`、materializer 0、許可外Git argv 0を確認する。加えて実
   `--filter=blob:none` partial clone fixtureでcommit/treeだけをlocalに持ちblobを欠落させ、promisor
   remoteが到達可能でも`unavailable`、remote側request 0、materializer 0を確認する。
   `GIT_NO_LAZY_FETCH`削除、fetch/current-tree reconstruction/fallback mutantをkillする。
3. `ls-tree`後に対象blobを欠落させるinjected readerでも`unavailable`となり、materializer 0を確認する。
   synthetic portだけでpartial clone oracleを代替せず、tree存在だけを成功根拠にするmutantをkillする。
4. regular executableとsymlinkを含むfixtureで`100644 / 100755 / 120000`、raw bytes、pathを保持する。
   symlink dereference、mode正規化、text decode/re-encode mutantをkillする。
5. malformed/NUL未終端record、duplicate path、tree/submodule type、unsupported mode、invalid UTF-8 pathを
   各1件入力し`invalid_artifact`、materializer 0を確認する。silent skip/先勝ち/後勝ちを許さない。
6. 同一blob OIDを2 pathが参照するfixtureでblob read 1回、materializer entry 2件を確認する。
   cacheによるpath消失と無制限重複readの両mutantをkillする。
7. PF-2の`unavailable` / `invalid_distribution_plan` / `invalid_artifact`を各返し、PF-3がerrorを保持して
   成功や別errorへ丸めないことをpinする。PF-4のdigest照合はここへ前倒ししない。
8. production moduleの静的importとGit argvを検査し、network client、`node:fs`、distribution
   sync/apply、`fetch/pull/clone/checkout/worktree/archive/show`が0であることをpinする。2 MiB超かつ
   NULを含むblobを`cat-file --batch`からbyte同一でmaterializerへ渡し、default maxBuffer、text変換、
   declared-size切詰めmutantをkillする。

## Schedule / Exit

1. [直列 / pair-freeze] 本PLANだけをcross-reviewし、mainへmergeする。既存test-designの
   `CANDIDATE-RELMAN-012`は本PLANの8群詳細oracleを参照するpairとして維持する。
2. [直列 / TDD] `U-RELMAN-012`を先にREDで追加し、object reader adapterとapplication serviceの
   最小実装でGreenにする。
3. [直列 / trace-freeze] 同commitでcandidate昇格、`generates`、status、test citationを更新する。
4. [直列 / review] exact-HEAD CIとnon-author closing reviewを通し、Issue #249をcloseする。
5. [直列] PF-4 #250をReadyへ移す。PF-3が未mergeの間はPF-4を開始しない。

- [x] docs-only pair-freezeがmainへmerge済み。
- [x] `U-RELMAN-012`が上記8群を実測し、revision/object/副作用mutationをkillする。
- [x] PF-3 source/test以外のmanifest/channel/Pack copy/write差分が0。
- [ ] exact-HEAD CI greenとnon-author closing PASS。
