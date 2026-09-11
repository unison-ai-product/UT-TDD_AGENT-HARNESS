---
plan_id: PLAN-L7-533-memory-completion-fence
title: "PLAN-L7-533 (add-impl): Memory migration completion fence の正本を canonical
  root に限定する契約 (Slice 4c) pair-freeze"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-11
updated: 2026-09-11
owner: Claude / Fable (pair-freeze) · Codex worker (implementation)
parent_design: docs/plans/PLAN-L7-512-project-scoped-memory-root.md
pair_artifact: docs/test-design/harness/L7-memory-completion-fence-test-design.md
next_pair_freeze: L8
backprop_decision: required
backprop_decision_reason: completion fence の正本 (canonical root + marker chain) と
  legacy_residue の回復経路を PLAN-L7-512 §2 の completion 条項へ PLAN-REVERSE-533
  で逆向き照合し、PLAN-L7-529 の setup identity 契約を変更していないことを検証する。
agent_slots:
  - role: se
    slot_label: Luna worker - fence module (PR-1) と production 結線 (PR-2) を別 PR で最小実装する
  - role: qa
    slot_label: Terra - CANDIDATE-U-PMEMFENCE-001..015 の Red oracle (worktree
      add/remove・tracked pull の正常系を含む) を先に作る
  - role: tl
    slot_label: Sol / Claude Opus - baseline の正本・residue 集合差分・write 0・provider
      parity の非著者検収
generates:
  - artifact_path: docs/plans/PLAN-L7-533-memory-completion-fence.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-512-project-scoped-memory-root.md
  requires:
    - docs/plans/PLAN-L7-512-project-scoped-memory-root.md
    - docs/plans/PLAN-L7-529-project-identity-bootstrap.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-533-memory-completion-fence-backfill.md
    - docs/plans/PLAN-REVERSE-512-project-scoped-memory-root-backfill.md
    - docs/test-design/harness/L7-memory-completion-fence-test-design.md
    - docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
    - docs/test-design/harness/L7-project-identity-bootstrap-test-design.md
    - src/runtime/project-memory-migration.ts
    - src/runtime/project-memory-root.ts
    - src/memory/service.ts
    - src/runtime/claude-memory-wake.ts
    - src/setup/index.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/550
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/424
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/554
review_evidence: []
status: draft
github_issue_id: 550
admission_receipt:
  schema_version: v2
  receipt_id: certificate:3fa1e99903c3913009d817b48e36b3fb
  command_id: plan-revise:issue-550:forward:7
  admitted_at: 2026-09-11T06:05:39.830Z
  source_digest: sha256:cb18541c152bb4877d5960d51dca368d618dd3019361bd2db138bf78246cf51f
  decision_digest: sha256:1667d9b5feedf831cdb661e6c368d2d13e5fb1aab5c1560e9a2c4cc2c1b475f5
  receipt_digest: sha256:faa8dec5f5aa6775ad5d3792b665d49790d2cde6edbacaea566c7044ac6e2c6a
  binding:
    path: docs/plans/PLAN-L7-533-memory-completion-fence.md
    plan_id: PLAN-L7-533-memory-completion-fence
    asset_id: plan:fb4a53df298985d3204d2e9b3bfa55d1
    revision: 7
    content_digest: sha256:cb18541c152bb4877d5960d51dca368d618dd3019361bd2db138bf78246cf51f
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 550
    episode_id: E4-550-memory-completion-fence
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-512-project-scoped-memory-root
    revision: 6
    digest: sha256:e3e3cad039021a5394c5ad09ea1f0084642bba9c0423fd9faa77563e1e52ce19
  reentry:
    target_plan_id: PLAN-L7-533-memory-completion-fence
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #550 completion fence contract pair-freeze after PR #554
    FLAG B1 (canonical-root baseline; PLAN-L7-512 rev 6 downstream); revision 7:
    Codex/Sol FLAG 4a2efa0c (uniform absent-as-null rule; tamper via Slice 4b
    record digest chain; evaluation order)"
---

# PLAN-L7-533: Memory migration completion fence の正本を canonical root に限定する契約

## 1. 目的と前提

Issue #550 は、`PLAN-L7-512` Slice 4a/4b (inventory / quarantine / recovery) の成果を production
composition (setup / status / SessionStart / Memory read-write / provider wake / claim / doctor) へ
fail-close 結線する slice である。PR #554 (exact HEAD `de3a767b`) はこれを実装したが、Claude 族の
closing review が FLAG (blocking 2) を返した。本 PLAN は B1 の真因である **fence の正本の選定**を
契約として先に確定する docs-only pair-freeze であり、実装・Green・#550 / #424 の closure を主張しない。

### 1.1 起票時点の実測 (2026-09-11、main `4795e983`)

| 観測 | 実測 |
| --- | --- |
| PR #554 の B1 | `verifyCompletionInventory` (`src/runtime/project-memory-migration.ts`、PR #554 版) は completion 時の **全 linked worktree corpus** を baseline に固定し、その後の `git worktree add` / `git worktree remove` / tracked memory の pull・削除・変更を `inventory_drift` として恒久 deny する。drift 後は `hasTransaction=true` のため setup が bootstrap を拒み、apply の再実行は ok を返すが inspect は drift のまま (CLI 回復経路なし)。reviewer が fixture repo の vitest で再現 (receipt `0cb72c62…`) |
| 本 repository の運用実態 | linked worktree は 57 本あり、review / PLAN 起草のたびに追加・削除される。tracked memory (`.ut-tdd/memory/*.md`) は merge のたびに全 worktree で変わる。すなわち #554 の baseline は日常操作で必ず崩れる |
| PR #554 の B2 | `runSetup` が remote 無し repository の identity deny を fatal にし、`PLAN-L7-529` の frozen test-design (「remote-less の identity denial を setup 全体の fatal error として扱ったら Red」) と矛盾したまま test だけを書き換えた。本 PLAN は B2 を所有しない (§5.3 で境界のみ固定) |
| main の状態 | `inspectCompletion` / completion fence module は main に存在しない。Slice 4b までの marker (`owner` / `intent` / `prepared` / `complete`) と `recover` は `PLAN-L7-512` 配下で main 到達済み |
| `PLAN-L7-512` §2 | 「completion は現物 corpus digest と一致するときだけ replay」と書くが、**現物 corpus の範囲** (canonical root だけか全 worktree か) を定めていない。本 PLAN はこの範囲を canonical root に限定して具体化する (親契約の変更ではなく narrowing) |

### 1.2 PLAN-L7-512 との関係

`PLAN-L7-512` は confirmed の親契約として変更しない。Slice 4c の契約と成果物は本 PLAN が所有し、
PR #554 が `PLAN-L7-512` の `generates` へ追加していた 3 module / 2 test (`project-memory-completion-fence.ts`、
`kernel/memory-domain.ts`、`doctor/memory-migration.ts`、対応 test) の所有は本 PLAN へ移す (実装 PR で
`generates` を宣言する。draft の今は宣言しない)。`PLAN-L7-512` 側の `generates` はこれらを含まない main の
状態を正とする。

## 2. 設計判断: completion fence の正本

advisor 相談: `ut-tdd advisor --decision design --current-model claude-fable-5 --plan PLAN-L7-512 --execute`
(2026-09-11、provider=claude、model=claude-fable-5)。推奨は **A**。前提は §1.1 の実測で検証した。

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **A (採用)** | completion 後の fence 入力を **canonical root (primary `.ut-tdd/memory`) と marker chain の整合**に限定する。linked worktree の legacy dir は「canonical に無い untracked memory file の有無」だけを typed `legacy_residue` (recoverable) として観測する。tracked memory の変更・worktree の増減は drift としない。回復は新 operation の migration apply (append-only marker) | B1 の真因 (変動が正常運用である linked worktree corpus を fence の正本に置いた) を正本の選定で直す。observe → apply の TOCTOU、mtime 依存の偽陰性、hand-written memory の洗浄経路化、provider parity の 4 点を契約で縛る必要がある | 採用 |
| B | A + 明示の authenticated re-baseline コマンド (tracked identity + operator flag) で baseline snapshot を差し替える | A で baseline snapshot が fence 入力から外れた時点で守る対象が消え、投機的 (最小実装原則違反)。「re-baseline が要る事態」が実測で出てから別 PLAN で起票する | 棄却 |
| C | 全 worktree inventory を baseline に保ち、worktree add/remove と tracked 変更を許容する差分規則を足す | 誤った正本を保守する対症療法。許容規則の穴 (pull による削除、rename、大小文字) が増え続ける | 棄却 |

advisor が挙げた risk 4 点は §3〜§5 の契約へ次のとおり反映する: (1) residue は mtime ではなく集合差分で
定義する (§4.1)、(2) apply は個別ファイル単位で取り込んだものだけを marker に記録する (§4.2)、(3) apply は
frontmatter schema 検証を通し hand-written memory の洗浄経路にしない (§4.2)、(4) fence と apply は session に
紐付く状態を持たず Claude / Codex で同一挙動とする (§5.2)。

### 2.1 revision 2 / 5 / 7: Codex/Sol cross-review FLAG (exact HEAD `34cfc614` blocking 2、`30dd7d14` blocking 1、`4a2efa0c` blocking 1) の是正 (rev 3 / rev 4 は本文変更なしの空改訂、rev 6 は本節のラベル訂正のみ)

| 指摘 | 判断 | 反映 |
| --- | --- | --- |
| B1: `PLAN-L7-512` §2 は同一 operation の replay を「現物 corpus digest が completion 状態と一致するときだけ」許すが、rev 1 は canonical の変更後も `replayed` を要求しており親契約と矛盾 | 親を改訂・supersede せず、**live fence の妥当性**と **replay** を分離する。fence の ok は marker chain + residue だけで決まり、corpus の変更は fence を変えない。同一 operation の再 apply は 512 どおり現物 digest 一致を要求し、変更後は `replay_corpus_mismatch` (write 0、marker 0) で deny する | §3.3、§9-1、`CANDIDATE-U-PMEMFENCE-007` / `016` |
| rev 7 (`4a2efa0c`): 「欠落 root = null」と「新形式 marker の field 剥がし = `transaction_tampered`」は byte 形状で区別できず、決定論的実装が存在しない | field の有無を世代判別子にせず、欠落 ≡ null で uniform に読む。改変は Slice 4b の record digest chain (`markerDigest`) で検出し、判定順序 tampered → incomplete → ambiguous → ok を固定する | §3.1、`CANDIDATE-U-PMEMFENCE-021` 改訂 |
| rev 5 (`30dd7d14`): 既存 Slice 4b の `owner` marker は `previous_complete_digest` を持たず、legacy complete → 新 operation の解釈が実装依存 | 欠落 = null、null を持てるのは root 1 件のみ、2 件以上は `operation_chain_ambiguous`、本 PLAN 以降の apply が書く marker は欠落禁止 (`transaction_tampered`) と bounded に固定する | §3.1、`CANDIDATE-U-PMEMFENCE-020` / `021` |
| B2: 回復で operation directory が append されるが、current operation の選択規則・precedence が無い (operationId は時間的 authority ではない) | 各 operation の `owner` marker に `previous_complete_digest` (直前 operation の `complete` digest、初回は null) を持たせて **chain** を作り、authoritative current operation = 他の operation から参照されない唯一の `complete` 済み tip とする。complete + incomplete、complete + tampered、複数 complete の precedence を typed reason で固定し、mtime / operationId / ディレクトリ順で選ばない | §3.1、§3.2、§4.2、§9-2、`CANDIDATE-U-PMEMFENCE-017..019` |

## 3. fence 契約

### 3.1 正本と観測対象

completion fence の正本は次の 2 つだけである。

1. **canonical root corpus**: `resolveProjectMemoryRoot` が返す primary worktree の `.ut-tdd/memory` (tracked + untracked)。
2. **marker chain**: canonical root 配下の migration transaction markers (`owner` → `intent` → `prepared` → `complete`、hash chain)。
   operation は複数存在してよい (初回 migration + §4.2 の回復 apply)。各 operation の `owner` marker は
   `previous_complete_digest` (直前 operation の `complete` marker digest。初回 operation は null) を持ち、operation 同士は
   この参照で **operation chain** を成す (Slice 4b の marker 形式への additive field。既存 marker と `U-PMEMQUAR-*` は変更しない)。
   **authoritative current operation** は、`complete` に到達し、かつ他のどの operation からも `previous_complete_digest` で
   参照されていない唯一の tip である。tip の選択に mtime / ctime / operationId の辞書順 /    tip の選択に mtime / ctime / operationId の辞書順 / ディレクトリ列挙順を使わない。
   **legacy marker 互換 (uniform)**: 本 PLAN より前に Slice 4b が書いた `owner` marker は `previous_complete_digest` を
   持たない。field の有無を世代判別子にしない。読み取り規則は 1 つだけ: **欠落は null と同値**であり、null (欠落を含む) を
   持てるのは chain の root 1 件だけである。null / 欠落の operation が 2 件以上あれば `operation_chain_ambiguous` (write 0)。
   marker の改変 (field の除去・追加・書換を含む) は field の有無ではなく Slice 4b 既存の record digest chain で検出する:
   各 marker は `recordDigest = markerDigest(sequence, kind, operationId, payload, previousRecordDigest)` を持ち
   (`src/runtime/project-memory-migration.ts` `appendMarker` / `readMarkers`)、payload から field を剥がせば digest 不一致で
   `transaction_tampered` になる。legacy owner は最初から field 無しで digest が整合するので tamper にならない。よって
   「欠落 root」と「剥がされた新形式 marker」を形状で区別する必要はなく、どちらも同じ規則で決定論的に判定できる。
   §4.2 の apply が書く新 `owner` marker は常に明示の値 (root なら null、それ以外は直前 tip の `complete` digest) を持つ。
   **判定順序**: (1) chain 内のいずれかの marker が digest / 順序不整合 → `transaction_tampered`、(2) tip に連なる operation が
   `complete` 未到達 → `migration_incomplete`、(3) null root が 2 件以上・参照先不在 → `operation_chain_ambiguous`、(4) それ以外 →
   tip を current とする。上位の reason が出た時点で下位は評価しない。

fence は read-only である。transaction directory、marker、inbox、claim、receipt、canonical file を作成・変更しない。
linked worktree の corpus は **fence の正本ではない**。linked worktree に対して fence が行う観測は §4.1 の residue 集合差分だけである。

### 3.2 判定と typed reason

| 状態 | reason | production Memory port | 回復 |
| --- | --- | --- | --- |
| marker chain が `complete` に到達していない (owner / intent / prepared で中断) | `migration_incomplete` | write 0、read 0 | `recover` (既存 Slice 4b) |
| marker chain の改変・欠番・digest 不一致 (chain 内のどの operation でも) | `transaction_tampered` | write 0、read 0 | 人間の調査。自動修復しない |
| complete 済み tip に `previous_complete_digest` で連なる operation が `complete` に未到達 (complete + incomplete) | `migration_incomplete` (未到達 operation を報告) | write 0、read 0 | その operation の `recover` |
| complete 済み operation が 2 つ以上あり tip が一意でない (参照されない complete が複数、または参照先が存在しない・chain 外の operation) | `operation_chain_ambiguous` | write 0、read 0 | 人間の調査。自動選択・自動修復しない |
| marker が無く legacy corpus だけが存在 | `migration_incomplete` | write 0、legacy read 0 (silent fallback 0) | 初回 migration apply |
| canonical root の identity 欠落・drift・root escape・common-dir 不正 | `PLAN-L7-512` 既存の typed deny をそのまま返す | write 0 | 既存契約 |
| linked worktree に canonical に無い untracked memory file がある | `legacy_residue` (recoverable) | write 0、read 0 | §4.2 の新 operation apply |
| 上記いずれにも該当しない | ok (`projectId`、最新 `operationId`、canonical corpus digest) | 通常 | — |

**drift という reason は completion 後に存在しない。** 次の操作はいずれも fence の結果を変えない (正常系として oracle を持つ):
`git worktree add` / `git worktree remove`、tracked memory の pull / commit / 削除 / 変更、`ut-tdd memory add` による canonical root への追記、
completion 時に存在した worktree の消滅、completion 後に追加された worktree に checkout された tracked memory。

### 3.3 live fence と completion replay の分離

- **live fence の妥当性** (§3.2 の ok) は operation chain の整合と residue 集合差分だけで決まる。fence の ok 結果は決定論的で、
  ok が返す canonical corpus digest は canonical root の現物から毎回再計算する参考値であり、completion 時点の snapshot digest を
  **fence の期待値として保持しない** (保持すると PR #554 の B1 が再発する)。canonical の変更 (tracked memory の commit / pull /
  削除、`memory add`) は fence を変えない。
- **completion replay** (同一 operationId の再 apply) は `PLAN-L7-512` §2 の temporal equality をそのまま守る。再 apply は、
  現物 canonical corpus digest がその operation の `complete` marker が記録した corpus digest と一致するときだけ `replayed`
  を返し marker へ追記しない (Slice 4b `U-PMEMQUAR-002` を再利用)。一致しなければ `replay_corpus_mismatch` として deny し、
  canonical write 0・marker 追記 0 とする。replay の deny は fence の ok を変えない (fence と replay は独立に判定する)。
- marker chain 内の `prepared` / `complete` digest は、その operation で取り込んだファイル集合の同一性 (tamper 検出) と
  replay の temporal equality にだけ使う。

## 4. legacy_residue の定義と回復

### 4.1 集合差分による定義

residue は次の集合差分で定義し、mtime / ctime / 作成時刻を使わない (コピーで時刻が保存されると偽陰性になる)。

```text
residue(W) = { f ∈ untracked(memoryStorageRoot(W)) | (memory_id(f), content_digest(f)) ∉ canonical_root_index }
```

- `W` は canonical root 以外の linked worktree。`untracked` は Git index に無いファイル (tracked file は checkout の産物であり residue ではない)。
- `canonical_root_index` は canonical root の tracked + untracked memory の (memory_id, content_digest) 集合。
- frontmatter を parse できないファイルは residue ではなく `invalid_memory` として別に報告する (apply でも取り込まない)。
- symlink / junction / non-regular は `source_unsafe` (`U-PMEMINV-006/007` 再利用) とし residue に数えない。

### 4.2 回復: 新 operation の migration apply

- 回復は `ut-tdd memory migrate --apply` 相当の既存経路で **新しい operationId** を発行し、append-only marker で行う。
  既存 marker の書き換え・再 baseline・snapshot 差し替えは行わない。新 operation の `owner` marker は、apply 開始時点の
  authoritative current operation (§3.1 の tip) の `complete` digest を `previous_complete_digest` に記録し、tip が一意でない
  (`operation_chain_ambiguous`) か chain に incomplete / tampered がある間は新 operation を開始しない (write 0)。
- apply は **個別ファイル単位**で取り込み、取り込んだファイルだけを `prepared` / `complete` marker に記録する。observe → apply の間に
  residue が増えても、未取り込み分は次回 apply が拾う (TOCTOU で「全量取り込み済み」と主張しない)。
- 取り込み時に frontmatter schema 検証 (memory_id / kind / title / tags / updated_at、db rebuild と同じ fail-close) を通す。
  不合格は `invalid_memory` として取り込まず、canonical root へ write 0。**hand-written memory を legacy dir 経由で canonical へ
  洗浄する経路にしない。**
- 同一 memory_id・異 digest は Slice 4b どおり quarantine へ保存し canonical を上書きしない。

## 5. 結線点と境界

### 5.1 production port

fence を通す入口: `ut-tdd setup`、`ut-tdd status`、SessionStart hook、Memory service の read / write、Claude / Codex provider wake、
claim、inbox recovery (terminal marker 直前)、doctor の consumer-toolchain / consumer-setup-smoke profile。deny 時はいずれの入口も
canonical / legacy corpus / inbox / receipt を書かない。db rebuild の `loadMemoryEntries` も同じ fence を通す (PR #554 review で
未結線と指摘された経路)。

### 5.2 provider parity

fence の判定と apply は session / provider に紐付く状態 (marker 以外の一時 file、override、first-come token) を持たない。
Claude session と Codex session から同じ repository を観測したとき、reason と write 0 が一致する。
`foreign-edit-override` の first-come-first-served 問題を再演しない。

### 5.3 setup bootstrap と PLAN-L7-529 の境界 (B2 の分離)

- setup が初回 migration を bootstrap してよいのは、tracked identity が HEAD で読めて、かつ transaction が完全に不在の場合だけ。
  既存 transaction の中断・改変・residue はこの例外に含めない。
- identity が未 commit (working tree のみ) の場合、**memory migration の bootstrap だけ**を `project_identity_commit_required` で
  保留し、state / template の通常出力は `PLAN-L7-529` §6 のとおり継続する。remote 無し repository の identity deny を setup 全体の
  fatal error にしない。
- `PLAN-L7-529` の read / create / commit-policy 契約と test-design は本 PLAN で変更しない。PR #554 が導入した fatal 化は本 PLAN の
  実装 PR で **529 準拠へ戻す**ことを前提とし、529 の契約を変えたい場合は 529 の改訂を別 PR で先行させる。

## 6. 順序契約と PR 分割

| PR | 論点 | 前提 |
| --- | --- | --- |
| PR-0 (本 PR) | 本 PLAN + `PLAN-REVERSE-533` + pair test-design の pair-freeze (docs のみ) | なし |
| PR-1 | fence module 1 個 (`src/runtime/project-memory-completion-fence.ts`: §3 の read-only 判定と §4.1 の residue 集合差分) + test。CANDIDATE 001..012 の Red→Green | PR-0 の非著者 PASS receipt |
| PR-2 | production 結線 (§5.1 の入口、setup bootstrap 例外、doctor profile) + test。CANDIDATE 013..015。B2 を 529 準拠へ戻す | PR-1 merge |

PR #554 は close→分割再出で応じる (scope 構造 FLAG の既定)。PR #554 の実装は PR-1 / PR-2 の参照元にしてよいが、
baseline snapshot を fence 期待値に使う部分は採用しない。

## 7. TDD / trace / Reverse

pair artifact `docs/test-design/harness/L7-memory-completion-fence-test-design.md` が `CANDIDATE-U-PMEMFENCE-001..021` を所有する
(001..012 と 016..021 は PR-1、013..015 は PR-2)。
PR #554 が test-design に置いた `U-PMEMFENCE-001..014` は正規 ID として採用しない (Red 実測の同一 revision 束縛が無く、006 は
tracked memory の checkout で通る誤った oracle だった)。実装 PR で同番号の `U-PMEMFENCE-*` へ 1:1 昇格する。既存
`U-PMEMINV-*` / `U-PMEMQUAR-*` / `CANDIDATE-U-PMEMROOT-*` / `CANDIDATE-U-PROJID-*` を再採番・再所有しない。

R1 では `PLAN-L7-512` §2 の completion 条項が、fence (canonical root への narrowing) と replay (temporal equality の維持) の分離で
満たされることと、`PLAN-L7-529` の契約が不変であることを照合する。R2 では residue 集合差分と apply の個別ファイル記録を同一 implementation revision へ束縛する。R3 では非著者の
claim-blind / spec-blind review で、baseline snapshot の残存、mtime 依存、apply の全量前提、schema 検証の迂回、session 紐付き状態を
攻撃する。R4 では不足差分だけを `PLAN-L7-512` / `PLAN-L7-529` へ backfill する。

## 8. 非 Scope

- `PLAN-L7-512` / `PLAN-L7-529` の契約変更、provider envelope への `project_id` 追加、clean Pack provider parity E2E (#424 後続)
- authenticated re-baseline コマンド (案 B、実測で必要になったら別 PLAN)
- semantic / global memory (#413)、consumer runtime (#420)、Bun
- PR #554 branch の直接編集、rebase、merge

## 9. 完了条件

1. completion 後の `git worktree add` / `remove`、tracked memory の pull / commit / 削除、`memory add` が fence を ok のまま保つ
   (`CANDIDATE-U-PMEMFENCE-004..007`)。同一 operation の replay は corpus 不変なら `replayed`、変更後は
   `replay_corpus_mismatch` で write 0・marker 0 (`007`、`016`)。
2. incomplete / tamper / legacy-only / identity 系が typed deny で write 0 (`001..003`、`012`)。operation chain の precedence
   (complete + incomplete → `migration_incomplete`、complete + tampered → `transaction_tampered`、tip 非一意 →
   `operation_chain_ambiguous`) が write 0 で、mtime / operationId 順で選ばない (`017..019`)。legacy `owner` marker の
   `previous_complete_digest` 欠落は null と同値で root 1 件だけ許し、新 operation はそれを明示参照して妥当な chain を成す。
   null root が 2 件以上は `operation_chain_ambiguous`、marker の改変 (field 剥がしを含む) は record digest chain で
   `transaction_tampered`、判定順序は tampered → incomplete → ambiguous (`020`、`021`)。
3. residue が集合差分で検出され、mtime 保存コピーでも検出される (`008`、`009`)。回復 apply は個別ファイル単位・schema 検証付き・
   append-only marker で、TOCTOU で未取り込みを成功扱いしない (`010`、`011`)。
4. Claude / Codex の入口で reason と write 0 が一致し、session 紐付き状態が無い (`013`)。setup bootstrap 例外と
   `project_identity_commit_required` が 529 準拠で非 fatal (`014`)。doctor の 2 profile が正例 1 + 負例 3 を持つ (`015`)。
5. Linux / Windows / aggregate required CI Green、exact-head の非著者 (Claude 族) closing receipt blocking 0 を PR-1 / PR-2 各々に束縛する。
6. 本 PLAN は fence の main 到達までを閉じる。#550 は PR-2 merge で close、#424 は open のまま維持する。

## 10. 実装開始条件

1. 本 PLAN と `PLAN-REVERSE-533` の pair-freeze に非著者 PASS receipt と CI Green が揃うこと。
2. PR #554 が close されていること (分割再出)。
3. PR-1 は fence module 1 個に、PR-2 は §5.1 の結線に閉じること。方式変更が必要になったら PR を close して本 PLAN の契約改訂へ戻る。
