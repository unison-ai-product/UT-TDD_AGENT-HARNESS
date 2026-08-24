---
plan_id: PLAN-L4-34-repository-runtime-placement-topology
title: "PLAN-L4-34 (add-design/architecture): Repository / Runtime Placement Topology"
kind: add-design
layer: L4
drive: fullstack
route_signal: redesign
route_mode: redesign
created: 2026-08-05
updated: 2026-08-24
owner: PO / TL
parent_design: docs/design/harness/L4-basic-design/architecture.md
sub_doc: architecture
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: TL - state root resolver、write fence、二重稼働禁止の段階導入境界
  - role: se
    slot_label: SE - durable/cache/scratch/evidence 4-class 台帳、cutover/rollback プロトコル
  - role: qa
    slot_label: QA - interrupted copy / replay idempotency / cross-volume の system oracle
generates:
  - artifact_path: docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/141
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/169
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/228
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/232
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/134
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/124
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/384
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/118
    - docs/plans/PLAN-L4-33-node-control-plane-redesign.md
    - docs/plans/PLAN-L7-348-runtime-state-recoverability.md
    - docs/governance/repository-structure.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/test-design/harness/L9-system-test-design.md
    - docs/test-design/harness/L12-acceptance-test-design.md
    - docs/test-design/harness/L14-operational-test-design.md
github_issue_id: 141
backprop_decision: not_required
backprop_decision_reason: >-
  新規契約 (repository/runtime placement topology) の genesis 設計であり、既存実装を正本として
  設計へ引き戻す Reverse ではない (issue #141 の駆動モデル節が明示)。kind=add-design は
  KIND_BACKFILL 上も Reverse 対必須ではない ("none"、src/lint/backfill-pairing.ts)。本判定は
  add-impl 側で必要になった時点 (L7 降下) で再評価する。
review_evidence: []
status: draft
---

# PLAN-L4-34: Repository / Runtime Placement Topology

## 0. 起票理由

Issue #141 (2026-07-23 起票、Redesign route 選択済み) が「統一 repository/runtime placement
topology は未設計」と結論し、新規 L4 `add-design` PLAN を要求した。起票から 13 日経過しても
PLAN は未起票だった (`docs/plans/` に該当なしを本 PLAN 起票時点で確認済み)。本 PLAN はその
起票要求への応答であり、設計そのものを本文で確定するのではなく **L4/L9 pair-freeze による
設計凍結の入口を開く**。

## 1. 目的

OneDrive 上の primary clone + 共通 `.git` + worktree ごとの `.ut-tdd` という現行配置契約を
差し替え、OneDrive 外の canonical placement へ安全に cutover するための設計を凍結する。
「見かけ上の退避 (worktree を外部へ置くだけ)」では共通 Git 管理領域が OneDrive へ戻るため
負債が消えないことを設計前提として明記する (issue #141 実測 3.)。

## 2. 実測 (2026-07-23 → 2026-08-05 の悪化推移)

| 指標 | 2026-07-23 (issue #141 起票時) | 2026-08-05 (本 PLAN 起票時) | 変化 |
|---|---|---|---|
| 登録 worktree 数 | 38 本 | 118 本 (Temp 70 / `C:/Users/micro/ut-*` 36 / OneDrive 7 / その他 5) | 約 3.1 倍 / 13 日 |
| `.ut-tdd/harness.db` サイズ | 約 3.86 GB (3,859,845,120 bytes) | 約 4.4 GB | さらに増加 (issue #169 の正常値 62MB に対し**71 倍**) |
| worktree 個別 `harness.db` 数 | 22 本 (38 worktree 中) | Temp 配下だけで 67 本 | 増加継続 |
| stale worktree (`git worktree prune --dry-run`) | 未計測 | **0 件** — 全 118 ディレクトリが実在し生きた参照 | 「古いから消せる」判別が機械的にできない |

追加実測 (2026-08-05 新規):

- `.ut-tdd/harness.db` は `ReparsePoint` 属性を持つ **OneDrive クラウド placeholder**。4.4GB の
  SQLite が常時 OneDrive 同期対象になっている (issue #141 の "OneDrive 停止で I/O が数十秒級→
  約 1〜3 秒へ回復" という実証済み効果と直結する原因)。
- issue #228: OneDrive 配下の既存ディレクトリに対し Bun 1.3.14 の
  `mkdirSync(path, {recursive: true})` が **EEXIST を投げる** (Temp 配下は成功、Node は同一
  パスで no-op)。結果、主 checkout で `ut-tdd db status` / `ut-tdd handover` が実行不能になり、
  EOD 棚卸しの projection 鮮度確認と PLAN 完了時 handover という**運用規律そのもの**が機械的に
  遂行できない状態が発生していた。

**結論**: OneDrive 停止という緩和の効果は実証済み (I/O 数十秒→1〜3秒) だが、これは人間操作
であり構造対応ではない。悪化速度 (13 日で worktree 3 倍・DB 71 倍) は緩和だけでは止まらず、
本 PLAN が要求する構造設計 (状態 root の分離、4-class 台帳、worktree 寿命契約) を凍結する
必要がある。

## 3. 閉じるべき契約 (issue #141 が列挙した 6 件を設計項目として構造化)

1. **cutover / rollback / write fence**: OneDrive 外 new clone への正式 cutover、old/new
   identity の対応付け、rollback 手順、**旧 clone の write fence** (cutover 後に旧 clone へ
   誤って書き込まれないことの機械的保証)、新旧二重稼働の禁止 (検知・拒否)。この契約の
   canonical authority は後述する immutable `PlacementCutoverReceipt` chain だけとし、旧/new
   clone の任意の `.ut-tdd`、環境変数、README、operator の口頭状態を authority にしない。
2. **4-class 台帳と canonical state root resolver**: `durable / cache / scratch / evidence`
   の全 path を分類する台帳と、それを解決する canonical state root resolver。現状は
   repository-local `.ut-tdd` 固定 (cwd 依存) であり、4.4GB の DB を単純に「移設」しても
   worktree ごとの分裂は解消しない — resolver が repository lineage に対して一意な root を
   返す契約が要る。
3. **rebuildable 分類と移送順序**: `harness.db` / ledger / memory / logs / WAL / SHM / lock の
   うち「正規入力から再構築できるもの」と「再構築不能な durable state」を分類し、停止点・
   移送順序・hash/count/schema 検証手順を定義する。3.86GB→4.4GB の DB を盲目的にコピーしない
   (issue #141 要求条件と同じ)。
4. **障害注入試験**: interrupted copy、partial migration、replay の idempotency、DB がロック
   中の移送、OneDrive placeholder (未 hydrate ファイル) の扱い、cross-volume (別ドライブ) 移送
   の試験契約。
5. **復旧と証跡連続性の acceptance**: PC 再起動、OneDrive 停止、旧 clone 削除後に、復旧手順と
   証跡 (harness.db projection、review evidence 等) の連続性を確認する L12/L14 acceptance。
6. **secret / PII / retention / backup 責任境界**: 移送対象に secret・PII が含まれないことの
   確認手順、retention policy、backup の責任境界 (誰が・いつ・何を保持するか)。

### 3.1 canonical identity / write fence / cutover authority

S2 は repository lineage を `origin canonical URL + initial root commit OID + common-dir object-format`
で束縛した `repository_lineage_id` として一意に解決する。path、worktree 名、cwd、DB path は identity
ではない。S3 の開始前に Node control plane が source clone の `HEAD`、remote URL、lineage、clean/dirty
worktree inventory、未 push branch 一覧を snapshot し、同じ `repository_lineage_id` に対する唯一の
`PlacementCutoverReceipt` chain を canonical state root に append する。状態は次だけを許す。

`prepared -> fenced_old -> active_new -> rollback_window -> retired_old`

- `prepared -> fenced_old` は new clone の clone digest、必要 worktree の再生成計画、S2 の L9/L12/L13
  Green evidence、old clone write fence の lease を同一 receipt に束縛する。どれかが欠ければ開始不能。
- `fenced_old` 中、旧 clone は `ut-tdd` の state writer、migration、doctor repair、worktree create/remove を
  fail-close する。read-only inventory は許すが、canonical state root を作成・更新しない。
- `active_new` は new clone の lease owner と `repository_lineage_id` が receipt と一致し、old fence lease が
  生きている場合だけ許す。new/old から同時に writer lease を取得する試行、または receipt chain head が
  異なる試行は fail-close する。これが「両方の clone がそれぞれ canonical」と主張する
  dual-canonical counterexample を拒否する機械境界である。
- rollback は `rollback_window` 内に限り、**new writer を先に fence してから** receipt chain に old の
  single-writer lease を移す。old clone を再開する条件は (a) new writer が停止し lease release receipt が
  ある、(b) new 側の evidence/projection が immutable receipt へ export 済み、(c) old checkout が
  recorded rollback commit と lineage に一致、(d) L13 rollback oracle が Green、である。一つでも欠ける
  old-clone restart は fail-close する。
- `retired_old` 後の old clone は read-only archive であり、rollback/restart を許さない。物理削除は本
  PLAN の scope 外で、retention owner の人間承認を別 receipt に残すまで行わない。

### 3.2 OS / path / runtime boundary

S2/S3 の migration、diagnostic、verification の executable authority は **sealed Node control plane** と
必要時の Rust companion のみである。`bun` executable、`bun:*` import、`Bun.*` API、Bun shell shim は当該
経路で禁止する。既存 Bun migration debt は `PLAN-L4-33` / issue #228・#134 の管理下であり、本 PLAN は
Node parity 前の既存 gate 削除を許可しない。

path input は shell string ではなく argv/path object として渡し、`realpath` 後の canonical path で判定する。
Windows は drive letter case・junction/reparse point を解決し、実パスが 240 UTF-16 code units を超える場合は
long-path 設定の有無を推測せず診断付き fail-close、空白を含む path は reject せず同じ argv oracle で扱う。
OneDrive の known sync root、または ancestor の OneDrive reparse/provider 属性を検出した source/common-dir/
state-root は fail-close とし、検出根拠と OneDrive 外への再配置候補を返す。Linux は `realpath`、mount/device、
POSIX `PATH_MAX` を検査し、空白 path を同じ argv contract で許可する。両 OS とも unresolved link、reserved
Windows name、canonicalization 不能は migration を開始しない。診断器自体も Bun を起動しない。

### 3.3 Issue #384 worktree lifecycle の L4/L9 pair-freeze 境界

Issue #384 は #141 の子契約であり、配置 cutover、canonical state root の移設、#232 detector の再実装、
#124 の worker 停止・resource/cancellation 実装を所有しない。#384 が所有するのは、repository lineage
単位の worktree lifecycle record/state machine、owner/Issue/PLAN revision/use/TTL/path lease、terminal
receipt の受理、retire の dry-run/apply、retention 境界、および status/doctor/HARNESS Memory への read-only
projection である。本節の設計契約と L9 §10 の `CANDIDATE-ST-WTLIFE-*` は docs-only の L4↔L9 pair-freeze 入力であり、
実装・既存 worktree の cleanup・Memory への通知を行わない。

#### 3.3.1 record と状態機械

各 record は `(repository_lineage_id, lifecycle_id, canonical_worktree_realpath)` を一意キーとし、
`admin_entry_realpath`、`owner/session`、`issue_id`、`plan_id` と `plan_revision`、`use` (`worker | review |
snapshot | scratch`)、`branch`/`head_oid`、`created_at`、`ttl`/`expires_at`、`path_lease`、parent process/session、
state、terminal receipt digest、retention disposition を同時に保持する。`path` や cwd だけを identity とせず、
`realpath.native` 解決結果と 3.1 の lineage authority に再束縛する。

許可する遷移は次だけである。

| 遷移 | 入力と後条件 |
|---|---|
| `planned -> active` | 必須 record が原子的に登録され、owner/Issue/PLAN revision/use/TTL/path lease と #232 inventory の link facts が一致する。欠落時は managed worker を起動しない。 |
| `active -> terminal_pending` | #124 の typed terminal input (`success | failure | timeout | parent_loss | cancel`) を同一 `lifecycle_id`/attempt に束縛し、process/lease の終端観測を記録する。TTL 超過だけでは遷移しない。 |
| `terminal_pending -> retained` | terminal receipt が欠落・不一致、dirty/unpushed/unmerged、active process/lease、owner不明、path/lineage不一致、または retention 中のため retire を拒否し、保全理由を typed deny として保存する。 |
| `terminal_pending -> retired` | sealed terminal receipt、#232 の最新 inventory、canonical realpath/lineage、process 0、path lease 解放、retention 条件が同一 snapshot に束縛され、dry-run digest と apply 入力が一致する場合だけ許す。 |
| `retained -> retired` | retention boundary 到達後に同じ再検証とpolicy-authorized applyを行う場合だけ許す。canonical/durable state は retained のままで、worktree-local cache/scratch だけを対象にできる。 |

`retired` は終端であり、旧 receipt の replay、別 path からの再活性化、状態 row の上書きは許さない。各拒否は
`dirty | unpushed | unmerged | active_process | active_path_lease | owner_unknown | terminal_missing |
terminal_mismatch | realpath_mismatch | lineage_mismatch | admin_entry_mismatch | inventory_unavailable |
retention_active | canonical_state | replay_conflict` の typed deny reason のいずれか（複合時は安定した全件集合）で返す。

#### 3.3.2 authority と port

- lifecycle record/event と sealed terminal/retire receipt が authoring source であり、SQLite、status、doctor、
  Memory は再構築可能な projection に留める。
- #232 の `WorktreeTopologyInventoryPort` は link/dir/dirty/unmerged/unpushed/detached/merged の read-only
  facts を供給するだけで、lifecycle state や retire eligibility を決めない。
- #124 の `TerminalReceiptInputPort` は parent-loss/timeout 等の typed terminal/lease-release receipt を
  同一 attempt に束縛して消費するだけで、Stop worker や process cleanup を複製しない。
- `CanonicalPathLineagePort` は native realpath、admin entry の双方向 link、repository lineage を照合する。
  `ProcessLeaseProbePort` は active process/path lease を観測し、`WorktreeRetirePort` は sealed plan に対する
  dry-run/apply の side effect 境界を担う。`StatusDoctorMemoryProjectionPort` は deny reason と retention
  を read-only に投影する。

retire は dry-run を既定とし、対象 realpath/admin entry/head/branch、保全理由、deny reason、state classification、
receipt digest、expected operation id を immutable plan に記録する。apply は同じ canonical snapshot と plan digest を
再検証してから `worktree 実体のretention quarantineへの原子的退避 -> admin entry解除 -> worktree-local cache整理`
の順に段階適用し、canonical/durable HARNESS state は削除しない。quarantine実体の物理削除はterminal retire receiptの
sealとretention boundary到達後に限る。各境界の crash/retry は operation id と append-only receipt で冪等に再生し、
旧対象を失ったり部分成功を Green と報告したりせず `retained` + typed fault に収束させる。

## 4. 移設手順の骨子 (設計として固定する要件。実行手順書ではない)

- **共通 `.git` 依存の全 worktree 破壊契約**: 2026-08-05 時点で 118 worktree が単一の共通
  `.git` を参照している。primary clone を移動すれば全 worktree link が (`.git` file 内の
  gitdir 参照経由で) 破壊される。設計は `git worktree repair` を含む復旧契約と、**他ランタイム
  (Codex) の in-flight 作業が存在しない窓**でのみ cutover を実行する前提条件を明記しなければ
  ならない (`CLAUDE.md` の Hybrid 多ランタイム commit 協調と矛盾しないこと)。
- **worktree 寿命契約の欠如が根本原因**: 38→118 (13 日で 3 倍) の増加は、worktree に
  owner/TTL/terminal receipt が無く、終了済み作業面を機械的に判別・回収する契約が存在しない
  ことに起因する (`git worktree prune --dry-run` が 0 件を返す = Git からは全部「生きている」
  ように見える)。本設計はこの寿命契約 (owner/TTL/終了時の登録解除) を要求項目に含める。
- **検証方法**: 移設後、rebuildable な state は「re-build して一致」を検証条件とし、durable な
  state は「hash/count が一致」を検証条件とする。両者を混同しない (rebuildable を hash 一致で
  縛らない、durable を re-build で代替しない)。
- **topology acceptance input**: cutover 前後の worktree health は件数だけで等価としない。#232 の
  `U-WTTOPO-013` により、findings 0と、許可されたpath remap後の normalized
  `{worktreePathKey, adminPathKey, headOid, isMain}` 集合digest一致を同時に要求する。同数の別worktree
  への置換、link/admin finding、曖昧又はroot外remapは開始前に拒否する。これはS2の
  `worktree-inventory` portが消費するread-only acceptance inputであり、cutover、prune、repairを
  許可する機構ではない。

## 5. 段階化と将来 dependency edge (S1/S2/S3)

- **S1 (本 PLAN の scope)**: L4/L9 pair-freeze と本節の dependency graph を凍結する。**実装・
  cutover・worktree cleanup は含まない**。
- **S2 (future add-design → add-impl)**: canonical state root resolver、4-class 台帳、path diagnostic、
  write fence / receipt chain を L5/L6/L7 へ降下する。既存の bounded child **issue #232** は
  worktree health/lifetime oracle を所有し、S2 の `worktree-inventory` port の先行 dependency である。
  Bun retirement の runtime authority は既存 **issue #134 / PLAN-L4-33**、OneDrive 再現根拠は
  **issue #228**、derived DB rebuild policy は **issue #169** が所有する。closed **issue #118** の
  DB肥大・再構築責務はsuccessor #169へ移管済みであり、#118を別blockerとして復活させない。
  **issue #124** はparent-loss時のworker停止・child cleanup・lease release receiptを所有する。
  本PLANはworker lifecycleを複製せず、clean windowとold lease解放の入力として#124のterminal receiptを
  消費し、receipt不在ではS3 activationを拒否する。新しい重複 Issue は作らない。
  **Issue #384** は #232 inventory と #124 terminal input を再利用して worktree lifecycle record と safe
  retire の契約を所有する。#384 の実装が status/doctor/Memory に投影するのは lifecycle の typed finding だけであり、
  #232 の detector 判定、#124 の Stop/resource/cancellation、#141 の placement cutover を上書きしない。
- **S3 (future add-impl / operational cutover)**: Node/Rust-only の cutover runner が new clone 生成、
  必要 worktree 再生成、derived DB rebuild、single-writer activation、rollback receipt を実走し、L12/L13/L14
  の acceptance/operational evidence を append する。

S2/S3 は本 PLAN が `confirmed` になった後に別 PLAN として起票する。draft PLAN の `requires` が draft
を指せない規則に従い、今は本 PLAN frontmatter の `references` に将来 edge の根拠だけを置く。S2 PLAN は
`requires: [PLAN-L4-34-repository-runtime-placement-topology]` と #232 の merged health oracle を要求し、
S3 PLAN は S2 confirmed PLAN と L12/L13/L14 test-design freeze を `requires` に置く。各将来 PLAN は
GitHub Issue #141 の正式 sub-issue として登録し、Project #6 の `先行PLAN` / `実装順序` /
`阻害要因` / `解放される後続` に `#232 contract freeze -> (#232 implementation || S2 placement core)
-> S3`、横断 reference を `#134/#228/#169 -> S2`、activation blockerを`#124 terminal receipt -> S3`
として同期する。#118は#169へのclosed predecessorとして表示し、独立edgeを作らない。#141 は親成果目標であり、
S3 の L14 acceptance と #141 固有 AC が完了するまで close しない。

### 5.1 L12 / L13 / L14 の実行対

| V execution layer | future deliverable | oracle / evidence | gate と順序 |
|---|---|---|---|
| **L12 acceptance** | `placement-acceptance-manifest`。lineage、canonical state root、4-class inventory、old/new receipt head、DB rebuild digest、retention decision を immutable evidence として結合する。 | `AT-PLACE-001` clean new clone が canonical root を唯一に解決、`AT-PLACE-002` old fence / dual-writer を拒否、`AT-PLACE-003` fresh rebuild の projection/ledger continuity。 | S2 L7 trace-freeze 後、S3 activation 前に全 mandatory AT Green。defer は activation の根拠にできない。 |
| **L13 deployment / migration execution** | `PlacementCutoverReceipt` chain と Node/Rust runner release manifest。operator は receipt を生成する command 以外で状態を変更できない。 | `DT-PLACE-001` prepared→fenced_old→active_new の CAS / crash-replay、`DT-PLACE-002` recorded rollback commit だけへの fenced rollback、`DT-PLACE-003` Node/Rust command invocation に Bun trace が 0。 | L12 Green の後に serial 実行。任意の write、old restart、receipt fork、Bun invocation は fail-close。 |
| **L14 operational acceptance** | `placement-operational-report`。Windows/Linux・long-path・spaces・OneDrive、再起動、OneDrive 停止、old archive/rollback-window の実走結果を receipt に anchor する。 | `OT-PLACE-001` OS/path diagnostic、`OT-PLACE-002` reboot/partial migration recovery、`OT-PLACE-003` rollback authority、`OT-PLACE-004` retired-old restart reject。 | S3 activation 後、L14 mandatory OT Green と non-author cross-review PASS で #141 の operational AC を閉じる。失敗は S2/S3 correction に戻し、old clone を勝手に再開しない。 |

L13 はここでいう deployment/migration execution layer であり、既存 L14 operational test design の運用 oracle と
役割を重複させない。正式 artifact path/PLAN ID は S2/S3 起票時に `plan draft` が採番し、既存 artifact を
draft `generates` に予告登録しない。

### 5.2 Schedule

| step | mode | entry | exit / 次 edge |
|---|---|---|---|
| S1-a: L4 contract freeze | **serial** | #141 と #118→#169/#124/#232/#134/#228 の ownership を確認 | §3–§5.1 と L9 RED candidates が reviewable |
| S1-b: L9 pair-freeze | **serial (S1-a の後)** | §8 の `U-PLACE-*` candidates | L4↔L9 trace と negative boundary を確定。S2 planning を解放 |
| S2-a: worktree health/lifetime contract freeze | **serial prerequisite** | #232 / PR #237 merged contract | migration input contractを固定しconsumer実装を解放 |
| S2-b1: worktree health implementation | **parallel (S2-a の後)** | #232 confirmed contract | health inventory portをTDD実装 |
| S2-b2: Node/Rust placement core | **parallel (S2-a の後、S2-b1と並列可)** | #134/#228/#169 の横断 input、S1 confirmed | resolver、diagnostic、4-class ledger、write fence をTDD実装 |
| S2-b3: Issue #384 lifecycle implementation | **parallel (S2-a の後、S2-b1/S2-b2 と並列可)** | 本節の #384 pair-freeze、#232 confirmed inventory、#124 terminal input | lifecycle record/FSM、typed deny、dry-run/apply、replay/idempotency、projection を TDD実装 |
| S2-c: L12/L13/L14 test-design freeze | **serial (S2-b1/S2-b2/S2-b3 の後)** | implementation contract と RED oracle | activation 専用 manifest/receipt/oracle を freeze |
| S3-a: prepared/fenced_old/active_new cutover | **serial** | S2 confirmed + L12/13/14 freeze + clean-window evidence | receipt chain の一方向 CAS でのみ activation |
| S3-b: operational acceptance / rollback drill | **serial (S3-a の後)** | #124 terminal lease-release receipt + #384 retire Green + L14 OT mandatory set | #141 close eligibility を判定。FLAG は S2/S3 correction へ戻す |

## 6. 暫定緩和 (本 PLAN の AC とは別に明記)

構造対応 (S3) の完了を待たず、現時点で取れる緩和を記録する。**これらは本 PLAN の受入条件では
ない** — 構造対応が完了するまで「無防備でよい」根拠として誤読しないための記録である。

- (a) OneDrive 同期対象からの除外 / OneDrive 停止。人間の設定操作であり、実測で効果がある
  (issue #141: I/O 数十秒→1〜3秒)。
- (b) 4.4GB `.ut-tdd/harness.db` の縮退。issue #169 が対象とする gitignored な生成物の整理。
- (c) 主 checkout での bun 実行回避。issue #228 が指摘する `mkdirSync` EEXIST を踏まないための
  当面の作業回避 (Temp 配下 worktree での実行等)。

## 7. 受入条件 (AC)

- **AC-PLACE-01**: 契約 6 件 (§3) が設計として閉じ、non-author family cross-review (PASS) の
  review_evidence を得る。
- **AC-PLACE-02**: `durable / cache / scratch / evidence` 4-class 台帳の schema が L9 の
  system test design oracle と 1:1 で対になる。
- **AC-PLACE-03**: 旧 clone write fence と新旧二重稼働禁止が「prose の禁止」ではなく機械強制
  可能な形 (検出・拒否の対象と手段) で定義されている。
- **AC-PLACE-04**: L12/L14 acceptance 項目 (PC 再起動 / OneDrive 停止 / 旧 clone 削除後の復旧と
  証跡連続性) が列挙され、L9 system test design と pair している。
- **AC-PLACE-05**: worktree 寿命契約 (owner/TTL/終了時登録解除) が S2 以降の降下対象として
  明示され、`git worktree prune` の「stale 0 = 全部生存」という現状の限界 (§2) を放置しない
  設計になっている。
- **AC-PLACE-06**: Windows/Linux、long path、spaces、OneDrive/reparse point の入力規約が frozen
  され、OneDrive と canonicalization 不能は診断付き fail-close、spaces は argv contract で Green と
  明記されている。
- **AC-PLACE-07**: migration/diagnostic/verification が Node/Rust-only であり、Bun executable/API/shim
  invocation は evidence で検出して fail-close する RED oracle を持つ。
- **AC-PLACE-08**: L12/L13/L14 の deliverable、oracle、mandatory gate、serial execution order が
  §5.1/§5.2 に固定され、S2/S3 の Issue/PLAN/Project dependency edge が #141/#232 と同期する。
- **AC-PLACE-09**: canonical authority、write fence、rollback trigger、old-clone restart conditions が
  immutable receipt と single-writer lease に束縛され、dual-canonical counterexample を拒否する。
- **AC-PLACE-10 (#384)**: worktree lifecycle record が owner/Issue/PLAN revision/use/TTL/path lease と
  canonical realpath/lineage に束縛され、`planned -> active -> terminal_pending -> retained|retired` の
  許可遷移と #124 typed terminal input を定義する。#232 detector と #124 worker implementation を複製しない。
- **AC-PLACE-11 (#384)**: dirty/unpushed/unmerged/active process/active path lease/owner不明/receipt欠落・不一致を
  typed deny reason として返し、dry-run が既定で apply 対象を固定し、fault/replay/idempotency で喪失・部分成功を
  fail-close する。canonical/durable state は retention boundary を越えても自動削除しない。
- **AC-PLACE-12 (#384)**: lifecycle の active/retirable/blocked-retire と typed reason、receipt digest、retention
  を status/doctor/HARNESS Memory projection から再構築可能に取得できる。projection は authoring source や
  cleanup authority にならない。
- **AC-PLACE-13 (#384 pair-freeze)**: L9 §10 の `CANDIDATE-ST-WTLIFE-001..016` が本節の record/FSM/port/deny/retire/
  path/fault/projection 各契約へ双方向に 1:1 対応し、未実装 oracle は RED のまま保持する。既存 worktree の
  cleanup、L7 test-design の変更、実装 Green の主張は本 PLAN の scope 外である。

## 8. 設計と検証の対 (RED oracle 案、L9 pair-freeze 入力)

以下は本 PLAN が L9 (`docs/test-design/harness/L9-system-test-design.md`) へ pair-freeze する
際の RED oracle 候補である。本 PLAN 自体はこれらを Green にしない (S1 は設計のみ)。

| oracle ID (案) | 検証対象 | 種別 |
|---|---|---|
| `U-PLACE-001` | canonical state root resolver が repository lineage に対し一意な root を返す (cwd/worktree 位置に依存しない) | positive |
| `U-PLACE-002` | 4-class (`durable/cache/scratch/evidence`) 分類が全既知 path を網羅し未分類 path が 0 | positive |
| `U-PLACE-003` | 旧 clone への書き込みが cutover 後に fail-close で拒否される (write fence) | negative |
| `U-PLACE-004` | new/old clone の同時稼働 (二重稼働) を検知し fail-close する | negative |
| `U-PLACE-005` | rebuildable state (harness.db 等) が正規入力からの再構築後、full rebuild と canonical digest が一致する | positive |
| `U-PLACE-006` | interrupted copy 後の再実行 (replay) が idempotent に収束する (二重適用・欠落なし) | negative → positive収束 |
| `U-PLACE-007` | DB がロック中の移送要求を fail-close する (silent skip / 部分コピーをしない) | negative |
| `U-PLACE-008` | OneDrive placeholder (未 hydrate ファイル) を検出し、hydrate 前の盲目コピーを拒否する | negative |
| `U-PLACE-009` | cross-volume (別ドライブ) 移送で hash/count 検証が volume 差に影響されず一致する | positive |
| `U-PLACE-010` | worktree の owner/TTL が期限切れの scratch worktree を、success/failure/timeout/parent-loss の全経路で登録解除・実体回収する | positive |
| `U-PLACE-011` | PC 再起動 / OneDrive 停止後、進行中だった移送 (partial migration) の状態から安全に復旧・再開または明示 fail-close する | negative → positive収束 |
| `U-PLACE-012` | secret/PII が durable 台帳に含まれないことを移送前 scan で検出する (含まれる場合は fail-close) | negative |
| `U-PLACE-013` | Windows と Linux で canonicalized path を解決し、Windows の long path (>240 UTF-16) / unresolved link / reserved name を診断付き fail-close、空白 path を argv 経由で成功させる | mixed |
| `U-PLACE-014` | source/common-dir/state-root の OneDrive known root または OneDrive reparse/provider ancestor を検出し、根拠 path と再配置先を出して fail-close する | negative |
| `U-PLACE-015` | S2/S3 の migration、diagnostic、verification command trace に `bun` executable、`bun:*` import、`Bun.*` API、Bun shell shim が一つでもあれば fail-close する。Node/Rust-only trace は Green | negative → positive収束 |
| `U-PLACE-016` | same `repository_lineage_id` の old/new clone が同時に writer lease を取得、または別 receipt head を canonical と主張すると両方を activation 前に拒否する | negative |
| `U-PLACE-017` | rollback で new fence release receipt / immutable evidence export / recorded rollback commit / L13 Green のいずれかを欠く old clone restart を fail-close する | negative |
| `U-PLACE-018` | L12 manifest、L13 receipt chain、L14 operational report の mandatory evidence が欠ける activation/close を fail-close する | negative |

### 8.1 Issue #384 lifecycle pair-freeze oracle

`U-PLACE-010` は親の寿命要件を示すだけであり、Issue #384 の record/state/retire 契約を代替しない。
以下の ID は L9 §10 の `CANDIDATE-ST-WTLIFE-*` と 1:1 で対になる実装前 RED oracle である。

| oracle ID | 検証対象 | 種別 |
|---|---|---|
| `CANDIDATE-U-WTLIFE-001` | owner/Issue/PLAN revision/use/TTL/path lease と canonical realpath/lineage を一意に持つ record を原子的に登録し、欠落時の起動を 0 にする | positive |
| `CANDIDATE-U-WTLIFE-002` | `planned -> active -> terminal_pending -> retained|retired` と terminal kind 5種を同一 lifecycle/attempt へ束縛する | positive |
| `CANDIDATE-U-WTLIFE-003` | #232 inventory と record の link/dir/dirty/unmerged/unpushed/merged facts を照合し、detector 自体を再実装せず typed finding を消費する | positive |
| `CANDIDATE-U-WTLIFE-004` | #124 terminal/lease-release receipt を消費し、parent-loss/timeout 等で process/lease が未収束または receipt 欠落なら retire を拒否する | negative |
| `CANDIDATE-U-WTLIFE-005` | dirty、unpushed、unmerged、active process、active path lease を各1軸だけ変異し、実削除 0 と固有 deny reason を証明する | negative |
| `CANDIDATE-U-WTLIFE-006` | owner不明、terminal mismatch、realpath/lineage/admin entry mismatch、inventory unavailable を推測で Green にせず拒否する | negative |
| `CANDIDATE-U-WTLIFE-007` | dry-run が既定で mutation 0、sealed plan の対象と apply 対象が digest 一致する | positive |
| `CANDIDATE-U-WTLIFE-008` | 実体のretention quarantine退避→admin entry解除→local cache整理の各境界 fault/retry を operation id で replayし、quarantineから復旧可能、partial loss 0、retained または retired へ冪等収束する | mixed |
| `CANDIDATE-U-WTLIFE-009` | canonical/durable HARNESS state、retention 中の cache/scratch、retention 到達後の local cache を区別し、正本 state を削除しない | mixed |
| `CANDIDATE-U-WTLIFE-010` | Linux の symlink/realpath、mount/device、空白 path、PATH_MAX と Windows の drive case、junction/reparse、空白/long path を canonical identity として検証する | mixed |
| `CANDIDATE-U-WTLIFE-011` | unresolved link、root外 path、case-only collision、admin link mismatch、canonicalization不能を typed deny として fail-close する | negative |
| `CANDIDATE-U-WTLIFE-012` | 同一 receipt/retire operation の再送を exactly-once とし、異なる receipt digest の replay を `replay_conflict` で拒否する | mixed |
| `CANDIDATE-U-WTLIFE-013` | status/doctor/HARNESS Memory が active/retirable/blocked-retire、deny reason、receipt/retention を同一 record revision から再構築する | positive |
| `CANDIDATE-U-WTLIFE-014` | projection/DB 欠損・再構築・write failure で authoring lifecycle record/receipt を source に逆昇格せず、判断を補完しない | negative |
| `CANDIDATE-U-WTLIFE-015` | detached/merged-clean/scratch/review の用途境界と owner/TTL を跨ぐ record を混同せず、terminal なし TTL 超過だけの retire を拒否する | negative |
| `CANDIDATE-U-WTLIFE-016` | #384 scope外の #141 cutover、#232 detector implementation、#124 Stop/resource/cancellation、既存 worktree cleanup を呼び出さない | negative |

## 9. Reverse 対の判定 (kind=add-design)

`src/lint/backfill-pairing.ts` の `KIND_BACKFILL` は `add-design: "none"` であり、Reverse 対は
必須ではない (必須なのは `add-impl` のみ)。本 PLAN は既存実装を正本として設計へ引き戻す
Reverse ではなく、issue #141 の駆動モデル節が明示する **genesis 設計 (Redesign route)** である
ため、`backprop_decision: not_required` を frontmatter に明記した。L7 降下 (実装 PLAN) で
`kind=add-impl` を起票する段になった時点で、その PLAN 側で Reverse 対の要否を再評価する
(add-impl は `KIND_BACKFILL` 上 `"required"`)。

## 10. plan_id 番号についての注記

指示では `PLAN-L4-33-repository-runtime-placement-topology` として起票する想定だったが、
起票直前の確認で **`docs/plans/PLAN-L4-33-node-control-plane-redesign.md` が既に存在**
(2026-07-24 作成、別トピック) しており、番号が衝突することが判明した。既存 L4-33 を上書き・
改番せず、本 PLAN は空いている次番号 `PLAN-L4-34` を採番した (RECOVERY-17 番号衝突の教訓と
同型の事前チェックを本 PLAN 起票時に実施し、今回は起票前に検出・回避した)。
