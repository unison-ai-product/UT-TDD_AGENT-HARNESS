---
plan_id: PLAN-L6-104-memory-clean-cut-replacement
title: "PLAN-L6-104 (add-design): project memory clean-cut replacement"
kind: add-design
layer: L6
drive: agent
route_signal: redesign
route_mode: redesign
created: 2026-09-15
updated: 2026-09-15
owner: PO / Claude (author) · Codex gpt-5.6-sol (非著者 closing review)
parent_design: docs/design/harness/L6-function-design/memory.md
pair_artifact: docs/test-design/harness/L7-memory-clean-cut-replacement-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: 本 PLAN 自身が L6 memory 設計契約の差替え正本であり、移行部分の非適用は既存
  PLAN-REVERSE-512 へ記録するため、新たな Reverse backfill を作らない。
agent_slots:
  - role: se
    slot_label: Claude worker - PR-1 で migration 実装を撤去し、PR-2 で legacy corpus を
      archive して curated corpus を再登録する
  - role: qa
    slot_label: QA - canonical root 以外を全 consumer が読まない mechanical oracle と DB
      rebuild を検証する
  - role: tl
    slot_label: Codex gpt-5.6-sol - exact HEAD と curation ledger を非著者 frontier tier
      で closing review する
generates:
  - artifact_path: docs/plans/PLAN-L6-104-memory-clean-cut-replacement.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/memory.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-512-project-scoped-memory-root.md
    - docs/plans/PLAN-REVERSE-512-project-scoped-memory-root-backfill.md
    - docs/plans/PLAN-L7-533-memory-completion-fence.md
    - docs/plans/PLAN-REVERSE-533-memory-completion-fence-backfill.md
    - docs/test-design/harness/L7-memory-clean-cut-replacement-test-design.md
    - docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
    - src/runtime/project-memory-root.ts
    - src/runtime/claude-provider-envelope.ts
    - src/doctor/test-repository-isolation.ts
    - src/setup/distribution.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/424
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/550
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/578
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 424
supersedes:
  - PLAN-L7-512-project-scoped-memory-root
admission_receipt:
  schema_version: v2
  receipt_id: certificate:8e0b44be8e6aa67b6b086f201f13629f
  command_id: plan-revise:issue-424:memory-clean-cut:3
  admitted_at: 2026-09-16T02:26:17.355Z
  source_digest: sha256:664be8f2e502741d1f9f6f03cf00cca3fffb20d8246b7e7ff4d9cd40a659ff57
  decision_digest: sha256:811a349100ef8d57b75f4464c6812b4caef31052e3cbdf1c0349f7d40db7c1b2
  receipt_digest: sha256:0bd4a45c269934da7ce073c7442cd576dd7c65560ebe81b9a6ba5a03d681ac73
  binding:
    path: docs/plans/PLAN-L6-104-memory-clean-cut-replacement.md
    plan_id: PLAN-L6-104-memory-clean-cut-replacement
    asset_id: plan:6bb11608096fa63d92d993a129cab136
    revision: 3
    content_digest: sha256:664be8f2e502741d1f9f6f03cf00cca3fffb20d8246b7e7ff4d9cd40a659ff57
  route:
    signal: redesign
    mode: redesign
  issue:
    provider: github
    issue_id: 424
    episode_id: E4-424-memory-clean-cut-replacement
    projection_digest: sha256:3752d540f8d100945ac0f194391370fa52ceb76ecd501d3a6f010927eb87450e
  origin:
    plan_id: PLAN-L7-512-project-scoped-memory-root
    revision: 7
    digest: sha256:bc545df7ce01902776ca8cb1056eab057150be61dea337221f68bb058ef02ac8
  transition:
    direction: design_to_implementation
    implementation_disposition: discarded
    implementation_target:
      target_plan_id: PLAN-L7-566-memory-clean-cut-replacement
      target_revision: 1
  reentry:
    target_plan_id: PLAN-L6-104-memory-clean-cut-replacement
    target_revision: 3
    phase: forward_merge
  escape_reason: "PR #628 closing review finding: the section 10 ledger custody
    statement bound no re-verifiable evidence. This revision records the
    re-measured read-only observations with their commands and digests, and
    limits the claim to what a third party can reproduce, because the
    pre-transfer digest was not retained"
  supersedes:
    - PLAN-L7-512-project-scoped-memory-root
---

# PLAN-L6-104: project memory clean-cut replacement

## 1. 目的

project memory corpus を移行せず、clean-cut で置換する。legacy corpus は削除せず、read-only archive へ退避する。runtime の全 read surface は project-scoped canonical root だけを読む。永続化すべき教訓は現行根拠と照合して curate し、`ut-tdd memory add` で 1 件ずつ新規登録する。

## 2. supersede 境界

`supersedes: [PLAN-L7-512-project-scoped-memory-root]` が無効化する範囲は次の 2 つに限る。

- 同 PLAN の Slice 4 に属する migration / inventory / quarantine / recovery / completion 条項。
- 対応する `generates` の 2 件 (`src/runtime/project-memory-migration.ts` と `tests/project-memory-migration.test.ts`)。

Slice 1/3 の canonical project root、`src/runtime/project-memory-root.ts`、`src/runtime/claude-provider-envelope.ts`、Pack parity は変更せず継承する。

`PLAN-L7-533-memory-completion-fence` と `PLAN-REVERSE-533-memory-completion-fence-backfill` は draft のまま未実装なので、formal supersede の対象にしない。未実装撤回として archive する (実行上の制約は §9)。`PLAN-REVERSE-512-project-scoped-memory-root-backfill` は残し、migration 部分だけを非適用とする。

## 3. 設計判断

### 3.1 PO 決定 (2026-09-15)

本節は Issue #424 comment 5678404390 と Issue #550 comment 5678404737 に記録された PO 決定を凍結する。

1. **置換方式**: legacy corpus は migrate せず、clean-cut replacement とする。削除は禁止し、archive は runtime の read root の外に置く。
2. **継承境界**: project-scoped canonical root (#431 / #512 / #523) と provider envelope (#529) を維持し、Slice 4 の migration code だけを撤去する。
3. **履歴関係**: formal supersede は `PLAN-L7-512-project-scoped-memory-root` の 1 件だけとし、対象の節と成果物は本文 (§2) で限定する。`PLAN-L7-512` には双方向の訂正注記を置き、status は変えない。533 の Forward / Reverse は未実装撤回として archive し、`PLAN-REVERSE-512` には migration 部分の非適用注記を置く。
4. **archive 配置**:
   - PR-2 時点で tracked の `.ut-tdd/memory` は、`git mv` で `docs/archive/memory-legacy-2026-09/` へ移す。
   - untracked file は commit しない。PR-2 で gitignore 対象の local archive `.ut-tdd/archive/memory-legacy-2026-09/` へ移す。
   - linked worktree の legacy `.ut-tdd/memory` は本 chain で触らず、#578 に残す。
   - したがって本 PLAN は legacy corpus の完全保存を主張しない。
5. **non-read 保証**: canonical root、archive、linked worktree legacy を同時に置いた fixture を正本 oracle とする。archive 側には同一 `memory_id`・異 digest、frontmatter 破損、symlink の adversarial entry を加える。全 reader / projection / CLI / provider / doctor・status が canonical だけを返すことを検証する。
6. **curation**: 自動分類は候補の提示だけに使う。author が candidate table を作り、別 family の frontier reviewer が採否を検証する。採用するのは次の全条件を満たすものに限る。受入件数に「約 100 件」を使わない。
   - 再利用可能である。
   - 現行の canonical doc / code / incident evidence に裏付けがある。
   - 具体的な action / decision rule である。
   - PR 番号、exact head、review request、verdict、handoff、進捗から独立している。
   - secret / PII / 個人環境を含まない。
   - 同義語を統合済みで、他の entry と矛盾しない。
7. **登録と台帳**: 採用 entry は `ut-tdd memory add` で 1 件ずつ登録する。curation ledger には source archive path、digest、adopt / reject の理由を記録する。
8. **直列 PR**: PR-0 は docs pair-freeze、PR-1 は migration module / test / `CONTRACT_ROWS` 行の撤去と参照の修正、PR-2 は corpus 置換を 1 トピックで行う。PR-2 には rename digest manifest、generated summary、curation ledger、non-read integration test、db rebuild を含める。各 PR は最新の projection tail の上で作り直す。

### 3.2 実装 PLAN (`implementation_target`) の選定

redesign の admission receipt は `implementation_target` を必須とする (`src/plan-admission/policy.ts` の `plan-admission-redesign-implementation-target-required`「redesignにはForward合流後に開始する実装PLANを指定します」)。PO 決定は実装 PLAN を名指ししていない。

advisor 相談: `ut-tdd advisor --decision design --current-model claude-opus-5 --plan PLAN-L6-104-memory-clean-cut-replacement --execute` (2026-09-15)。一次の Fable は使われず、fallback で実行された (provider=codex、model=gpt-5.6-sol、mode=adversarial)。推奨は **A**。

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **A (採用)** | 新規 L7 実装 PLAN `PLAN-L7-566-memory-clean-cut-replacement` rev 1 を指す | 置換後の成果物 (PR-2 の non-read integration test、ledger、manifest) の所有を、層責務どおり L7 に置ける。一方で番号は未予約の前方参照であり、kind と起票時点が未確定 (`add-impl` は Reverse 対が必須、`impl` は Forward lineage の根拠が必要) | 採用 |
| B | 本 PLAN 自身の rev 1 を指す | L6 add-design に src / tests の撤去と新規 test の所有を持たせることになり、層責務を崩す | 棄却 |
| C | `PLAN-L7-512` の rev 7 を指す | Slice 4 旧実装の owner を置換後成果物の実装先にすると、`supersedes` が示す正本の交代と矛盾する | 棄却 |

前提の実測: origin/main `13c5bb2d` の `docs/plans` にある L7 の最大番号は `PLAN-L7-565`、open PR の変更 file にも `PLAN-L7-566` は無い。A の未確定点 (番号予約、kind、起票 PR) は §9 に残す。

## 4. 実測 baseline (PR-0、2026-09-15)

corpus の件数は primary checkout で計測する。fresh な linked worktree では untracked が 0 件に見えるので、worktree 内で計測した値を baseline にしない。

```text
$ git -C C:/dev/UT-TDD-agent-harness rev-parse --short HEAD
2d50ce10
$ git -C C:/dev/UT-TDD-agent-harness ls-files .ut-tdd/memory | wc -l
607
$ git -C C:/dev/UT-TDD-agent-harness ls-files --others --exclude-standard .ut-tdd/memory | wc -l
302
```

untracked の件数は、primary checkout で `ut-tdd memory add` などの書き込みが続くかぎり PR-2 まで増える (本 PLAN の起票作業中にも 298 → 302 と増えた)。上の値は PR-2 のアーカイブ対象を確定するものではなく、PR-0 時点の baseline である。PR-2 は実行時点の HEAD で tracked / untracked を再計測し、rename list と source / destination digest の machine manifest、generated summary を作る。

origin/main `13c5bb2d` での参照と Pack 除外:

```text
$ git grep -l project-memory-migration -- src tests scripts .claude/hooks
src/doctor/test-repository-isolation.ts
tests/project-memory-migration.test.ts
$ git grep -n '"docs/archive/"\|".ut-tdd/"' -- src/setup/distribution.ts
src/setup/distribution.ts:119:  ".ut-tdd/",
src/setup/distribution.ts:124:  "docs/archive/",
```

`CLEAN_DENY_PREFIXES` は `docs/archive/` と `.ut-tdd/` を含む。archive 配下が clean Pack artifact set に入らないことは、pair test-design の `CANDIDATE-P-MEMCUT-023` が PR-2 の exact HEAD で機械的に検証する。PR-0 ではこれを Green と主張しない。

## 5. 変更契約

### PR-1: migration 撤去

- `src/runtime/project-memory-migration.ts` と `tests/project-memory-migration.test.ts` を削除する。
- `src/doctor/test-repository-isolation.ts` の `CONTRACT_ROWS` から `project-memory-migration:1` を削除する。行を残すと stale-contract になる。
- `docs/test-design/harness/L7-project-scoped-memory-root-test-design.md` にある `U-PMEMINV-*` (8 件) と `U-PMEMQUAR-*` (5 件) の宣言を、同じ PR で撤回する。これらを citation しているのは `tests/project-memory-migration.test.ts` だけであり (`git grep -l -E "U-PMEM(INV|QUAR)-[0-9]{3}" -- tests src/lint` の結果は同 file のみ)、宣言を残すと oracle-test-trace の orphan になる。baseline へは退避しない。
- `PLAN-L7-512` の `generates` から削除対象の 2 件を外す。変更は canonical な `plan revise --manifest` 経路だけで行う (外さないと plan-artifact-existence が phantom-artifact を出す)。前提となる実行制約は §9 に記す。
- §3.2 の実装 PLAN を起票する。
- production の import graph に `project-memory-migration` を残さない。

### PR-2: corpus 置換

- tracked corpus だけを `docs/archive/memory-legacy-2026-09/` へ rename し、bytes と digest を保持する。
- untracked corpus は secret / PII のレビュー前なので commit しない。`.ut-tdd/archive/memory-legacy-2026-09/` へ移し、この local archive の ignore rule を追加する。commit する manifest / summary には、untracked の path、title、本文を書かない。
- linked worktree の corpus は移動・削除・編集しない。runtime が読まないことだけを oracle で保証する。
- curated corpus を canonical root へ `ut-tdd memory add` で再登録し、curation ledger、non-read integration test、rename digest manifest、generated summary を揃え、db rebuild を clean に完了させる。

## 6. Issue #424 受入条件案 (Issue 本文は編集しない)

1. §3.1 の判断 5 の fixture を置いたうえで、全 production reader・DB・CLI・provider・doctor / status が canonical-only の結果を返す。fixture は、canonical root の entry、`docs/archive/memory-legacy-2026-09/` の異なる有効 entry、linked worktree legacy root の別 entry、archive 側の adversarial entry (同一 `memory_id`・異 digest、frontmatter 破損、symlink) から成る。
2. legacy tracked corpus は rename digest manifest のとおりに archive され、untracked corpus は commit されずに gitignore 対象の local archive へ保存される。linked worktree corpus の完全保存は本 AC の主張外とする。
3. curation ledger の各採否が現行の根拠と基準に束縛され、採用 entry が `ut-tdd memory add` で 1 件ずつ canonical root へ登録されている。採用件数の固定値は要求しない。
4. `ut-tdd db rebuild` が clean に完了し、`memory_entries` は curated canonical corpus だけを投影する。
5. project isolation、Claude / Codex の provider parity、clean Pack E2E の既存 AC を維持し、置換後も Green である。
6. production の import graph と `CONTRACT_ROWS` に `project-memory-migration` が存在しない。

Issue #424 は、上記がすべて Green になるまで open のままとする。

## 7. Schedule (serial)

| 順序 | PR | 内容 | 完了条件 |
| --- | --- | --- | --- |
| 1 | PR-0 | docs pair-freeze | 本 PLAN、pair test-design、既存 PLAN の注記、canonical receipt、CI、非著者 Codex gpt-5.6-sol closing review |
| 2 | PR-1 | migration code 撤去 | import graph と `CONTRACT_ROWS` の該当 0、宣言撤回後の trace 整合、targeted test と full CI の Green |
| 3 | PR-2 | corpus replacement | machine rename manifest、generated summary、curation ledger、non-read integration、DB rebuild、provider / Pack E2E の Green |

## 8. 非対象と残余リスク

- PR-0 では `.ut-tdd/memory` の corpus file を移動・削除・編集しない。
- linked worktree corpus の cleanup / preservation は #578 の責務である。
- PR-2 開始までに増減する corpus は、PR-2 の最新 baseline で再採取する。
- archive が runtime の外にあっても、新しい reader が archive を再帰 scan する退行は起こり得る。そのため、関数単体ではなく全 consumer の composition oracle で継続して検出する。
- `docs/archive/` 配下は readability (mojibake) と secret-scan の走査対象に入る。legacy file に文字化けや credential marker があると PR-2 が red になる。scanner の scope を変えることは本 PLAN の契約外とする。
- 静的読解 (未実行) では、db rebuild の memory 投影は canonical root ではなく cwd を起点に読む。review-live の memory path にも canonical root 内への包含検査が見当たらない。non-read oracle を Green にするために source 変更が要る場合は、PR-2 の着手前に PR-2 の scope に収まるかを判定する。収まらなければ、本 PLAN の revise で契約を先に固定する。

## 9. PR-0 時点の実行制約 (未解消)

本節 1 と 2 は PR-0 の実行で解消した。経路と証跡は §10 に記録する。3 は未確定のまま PR-1 へ引き継ぐ。

判断 3 の実行経路には、PR-0 の起票時点で次の制約を実測している。いずれも判断 3 自体は変えない。PR-0 は canonical 経路で実行を試み、その結果を PR 本文に記録する。

1. **`PLAN-L7-512` の back-reference**: origin/main `13c5bb2d` での実測値は次のとおり。
   - `canonicalPlanContentDigest(HEAD)` は `sha256:e43a97bd52546a440eb96202b23eea245c8e25add1b81a7bb9b051902920fb40`。
   - 埋め込み receipt (rev 6) の `content_digest` は `sha256:e3e3cad039021a5394c5ad09ea1f0084642bba9c0423fd9faa77563e1e52ce19`。
   - rev 6 の発行以降にこの PLAN を変更した commit は `6efae246` (`test(memory): register clean Pack parity slice`) だけで、`plan revise` を経ていない。
   - fresh な worktree の ledger は、この不一致で `plan-revision-rehydration-content-digest-mismatch` を返して fail-close する (`src/plan-admission/plan-ledger-rehydrator.ts`)。
   - plan-supersession は、supersede 対象の本文に後継 PLAN の core-id (`PLAN-L6-104`) を要求する (`src/lint/plan-supersession.ts`)。
2. **533 の archive**: `evaluatePlanAdmission` は、draft / revise を問わず `status: archived` を `plan-admission-archived-forbidden` で拒否する (`src/plan-admission/policy.ts`、`tests/plan-admission.test.ts` の U-PADM-005)。receipt を持つ PLAN の status 変更は canonical 経路以外では admission-check を通らない。
3. **実装 PLAN**: §3.2 の A について、`PLAN-L7-566` の番号予約、kind、起票 PR (PR-1 に含めるのが凍結分割の補足にあたるか) が未確定である。

## 10. PR-0 実行結果 (2026-09-16、§9 の制約 1 と 2 の解消)

### 1. `PLAN-L7-512` の back-reference (解消)

canonical `plan revise --manifest` で rev 7 を発行し、supersede の back-reference を入れた
(receipt `certificate:d1c827ae9693b1f1b7702f609b773526`、projection sequence 244)。

実行経路の判断は `ut-tdd advisor --decision implementation --current-model claude-opus-5` (2026-09-16、
fallback `gpt-5.6-sol`、adversarial) に諮り、次の 3 案から **X2** を採択した。

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **X2 (採用)** | 真の lineage を持つ worktree の worktree-local ledger を整合確認のうえ限定移送し、そこで canonical revise を実行する | 他レーンの worktree を変えない。ledger は untracked な worktree-local state なので移送自体は tracked evidence を作らない。drift を rev 7 に吸収するため、由来の明記が条件 | 採用 |
| X1 | lineage を持つ worktree 自体に PR-0 branch を checkout して実行する | 同じ結果を得られるが、Issue #544 レーンの worktree の branch と作業状態を変える | 棄却 |
| Y | `redesign` 以外の route へ引き直し、supersede 宣言を後続 PR へ回す | route certificate と実態 (Slice 4 契約の差替え) が食い違う。設計判断そのものの変更になる | 棄却 |

移送時に確認した事項と、その後に再測定できる範囲を分けて記す。ledger は untracked な worktree-local state
であり、tracked diff と receipt chain が証明するのは 4 PLAN の内容と receipt 連鎖だけである。**移送前の digest は
保存しなかったため、「移送前後で同一だった」ことの第三者検証はできない。** 以下は本 revision 発行時点で
read-only に再測定した観測値であり、同じ worktree を持つ者は同じ command で再現できる。

| 対象 | 値 (2026-09-16 実測) |
| --- | --- |
| 取得元 `C:/dev/ut-issue528-project-memory-envelope/.ut-tdd/ledger/harness-ledger.db` | 491,520 bytes、`sha256:422f361e0294de659abd90e881e23747602d4a30a10029d00e23bdd4fab915e1` |
| 移送先 `C:/dev/ut424-512rev7/.ut-tdd/ledger/harness-ledger.db` | 561,152 bytes、`sha256:4957f9ad10e6a1eba4e30558c724b364dfad33dbb151270ee2fd97e9b206b8b2` |
| 両者の `PRAGMA integrity_check` / `journal_mode` / `user_version` | `ok` / `delete` / `7` |
| 取得元の `plan_revisions` | 2 asset、いずれも legacy、revision 1-6 |
| 移送先の `plan_revisions` | 5 asset。legacy `186048a9…` は 1-6 のまま、legacy `68706e29…` は 1-**7** (本 PR の rev 7)、加えて PR-0 で発行した `plan:6bb11608…` (1-2)、`plan:fb4a53df…` (9-10)、`plan:9c79745c…` (9-10) |

再測定コマンド (read-only、破壊的操作なし):

```bash
node -e "const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(PATH,{readOnly:true});
for(const q of ['PRAGMA integrity_check','PRAGMA journal_mode','PRAGMA user_version'])console.log(q,db.prepare(q).get());
console.log(db.prepare('SELECT asset_id, COUNT(*) n, MIN(revision) minr, MAX(revision) maxr FROM plan_revisions GROUP BY asset_id').all());db.close()"
```

移送先 ledger の lineage 形状 (legacy `68706e29…` が 1-6 を保持したまま 7 を追加している) は、移送が lineage を
作り直したのではなく引き継いだことと整合する。ただしこれは整合であって同一性の証明ではない。移送そのものの
custody claim は本節の観測範囲に限定し、それ以上を主張しない。

rev 7 の注記には、rev 6 発行後に canonical revise を経ずに commit `6efae246` で入った
`updated: 2026-09-11` と `tests/project-memory-pack-parity.test.ts` の `generates` 登録を、本 revision で
明示的に吸収する旨と、それが直接編集を遡って canonical と認めるものではない旨を書いた。rev 6 の
embedded content digest `sha256:e3e3cad0…` と drift 後の HEAD content digest `sha256:e43a97bd…` も残した。

### 2. 533 の撤回 (解消、ただし archived は不可)

`PLAN-L7-533-memory-completion-fence` (rev 10、sequence 245) と
`PLAN-REVERSE-533-memory-completion-fence-backfill` (rev 10、sequence 246) を canonical revise で改訂し、
撤回注記を入れた。**status は `draft` のまま据え置いた。** `evaluatePlanAdmission` が
`plan-admission-archived-forbidden` で archived を拒否し、receipt 制度下の PLAN を archived にする正規経路が
存在しないためである。schema の `VALID_STATUSES` と各 lint は archived を扱うのに admission だけが拒否する
という契約の不整合は Issue #623 に起票した。撤回の意味は注記が正本であり、`draft` は「未着手のまま撤回済み」を
表す。

### 3. 残余 (未解消)

§9 の 3 (`PLAN-L7-566` の番号予約、kind、起票 PR) は未確定のまま PR-1 へ引き継ぐ。
