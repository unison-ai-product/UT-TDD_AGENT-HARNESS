---
plan_id: PLAN-L7-468-shared-memory-sync-lifecycle-contract
title: "PLAN-L7-468 (add-impl): 共有 memory を service 単一路へ (ファイル正本 + DB は metadata index + 未共有 fail-close + episode/lesson 型)"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
parent_design: docs/design/harness/L6-function-design/handover-mechanism.md
status: draft
created: 2026-07-28
updated: 2026-07-28
owner: PM / PO
agent_slots:
  - role: aim
    slot_label: "AIM - ファイル正本 / DB=派生 index / service 単一路の境界設計判断"
  - role: tl
    slot_label: "TL - staleness 可視化契約 (fingerprint / dirty marker / degraded surface) レビュー"
  - role: se
    slot_label: "SE - MemoryService、純粋 filter/ranker、write-through、memory-sync check の実装"
  - role: qa
    slot_label: "QA - 移植前後の等価性 (golden)、破損 1 件の隔離、未 commit 実検出、retire 後の消失検証"
generates:
  - artifact_path: docs/plans/PLAN-L7-468-shared-memory-sync-lifecycle-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
  requires:
    - docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
  references:
    - src/memory/index.ts
    - src/handover/session-start-digest.ts
    - src/state-db/projection-writer.ts
    - docs/plans/PLAN-L7-460-db-refresh-resource-guardrails.md
    - docs/design/harness/L6-function-design/memory.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-468: 共有 memory を service 単一路へ

GitHub issue: #175 (本 PLAN が機構化の正本)。親は PLAN-L7-189 (共有 memory の
cross-runtime 化、confirmed)。L7-189 は「authored markdown → harness.db projection →
SessionStart surface」の経路を作ったが、**同期状態とライフサイクルの契約を持たず、
本文を DB に複製して読み路を DB 側に置いた**。本 PLAN はその 2 点を是正する。

## 設計不変条件 (本 PLAN が固定するもの)

1. **ファイルが正本** (`.ut-tdd/memory/*.md`)。
2. **DB は任意の派生 metadata index**。本文 (`body`) を複製しない。捨てて作り直せる。
3. **アクセスは service 単一路**。読みも書きも `MemoryService` を通す。
4. **staleness は可視**。index が古い / 読めない状態を無音で「0 件」に見せない。

## 実測された欠陥 (2026-07-28)

### 欠陥 1: 未共有 memory が沈黙する

`ut-tdd memory add` はファイルを書くだけで、同期状態を誰も検査しない。実測:
ローカル作業ツリーに main 追跡分が **32 件欠落**、逆にローカルのみの未コミットが
**15 件** — 両方向の乖離が同時に起きていた。15 件はすべて引き継ぎ目的で書かれたもの
(`project-claude-pr-170-...`、`project-pr-156-blind-review-confirm-...`、
`project-claude-pr-117/125/135/137/140-cross-review.md` 等)。

同一 working tree を共有する構成ではファイル自体は相手から見えるため、
「相手に見えない」ではなく **origin へ到達しないので永続せず、別 worktree /
branch 切替後のツリーには存在しない** ことが実害。

### 欠陥 2: 完了エピソードの残置率 100%

main の memory 92 件中 **34 件 (37%)** がファイル名に PR/issue 番号を持つエピソード。
参照 PR 20 本 (#1 #60 #61 #63 #65 #66 #88 #100 #103 #104 #106 #114 #115 #116 #125
#126 #146 #147 #154 #156) は**実測で全件 MERGED**。`project-pr-154-*` だけで 7 件。
`CLAUDE.md` の「エピソード状態はメモリに書かず digest に任せる」規定に対し、
**機械契約が無い**ので書かれ、残り、回収機構が無いので永久に無音。
`.ut-tdd/memory` を見る lint は `secret-scan` のみ (`src/lint/secret-scan.ts:97`)。

### 欠陥 3: 引き継ぎ経路が lock で無音消失する

`surfaceSessionStartDigestToStdout` (`src/cli.ts:461-478`) は `catch { /* fail-open */ }` で、
DB lock / 破損時に **memory / feedback / schedule を含む digest 全段が無言で消える**。

注 (誤記の訂正): CLI の `memory recall` / `list` は例外を捕まえないため **throw して非 0
終了する**。初報の「無音で空を返す」は誤りで、観測した 32 バイトは空ではなくエラー文だった。
無音なのは digest 側である。

### 欠陥 4: 本文を DB に複製し、書き路と読み路が full rebuild でしか繋がらない

`memory_entries` は body 全文を複製している。書き込み口は `projectMemoryEntries`
(`src/state-db/projection-writer.ts:2269`、呼び出しは 2577 行の full rebuild 内のみ) だけで、
`memory add` は DB を触らない。よって add 直後は `recall` / digest に出ない
(ラグは「次の Stop hook db-refresh まで」。full rebuild は実測 4m38s)。

**本文複製の便益は実測で否定された**: 全 78 件のファイル直読は **112ms / body 合計 114KB**
(corpus 全体 418KB)。SQL 一発で digest が組める以外の便益が無く、その代替は metadata index
+ ファイル読みで足りる。

### 欠陥 5 (本 PLAN で発見): 破損 1 件が読み路全体を落とす

`loadMemoryEntries` は全ファイルを `parseMemoryFile` で map するため、**1 件でも
frontmatter 欠落があると全件読みが throw する**。実測: 2026-07-28 の db rebuild が
`memory frontmatter is required: .ut-tdd/memory/project-po-issue-157-...md` で 3m28s 後に
中断した。ファイルを読み路にするなら **per-entry 隔離 (skip + 構造化 finding)** が必須で、
そうでなければ手書き 1 件で SessionStart 全体を落とせる。

## 設計判断 (advisor 2 系統 × 2 巡、2026-07-28)

`claude-fable-5` と `gpt-5.6-sol` に独立に投げ、統合した。

### 1 巡目 (DB 前提のまま是正) → 2 巡目 (PO 提案で方式変更)

1 巡目は両者一致で「3 PR 分割 / 欠陥3 → 1 → 2 の順 / retire は状態遷移 / 新契約なので
Reverse 対」。このとき **ファイル直読 fallback は却下**していた (Sol: DB と同じ filter /
順位 / retire 規則を保証できないうちに fallback すると別種の silent divergence を作る)。

2 巡目で PO から「DB に全量を引っ張る意味があるのか。ファイル関係の記録を常時更新すれば
足りるのでは」「ファイルと DB の間に service 層を挟む形でよいのでは」という方式提案が出た。
再投した結果:

- **Sol は自身の却下を明示的に撤回**した: 「これは fallback ではなく、**唯一の正本 read path
  への変更**である」。2 経路が存在しなくなるので divergence の余地自体が消える。
- **Fable は失効条件を明示**した: 却下理由が消えるのは「**読み路が service 1 本に統一された後**」
  であり、統一前に fallback を先行させると元の却下理由がそのまま復活する。**順序が本質**。

### 採択

- **提案 1 (DB は index のみ) を採用**。index に残す列: `memory_id / source_path / title /
  tags / kind / scope / status(retire) / content_hash / updated_at`。**body 列は落とす**。
  `content_hash` を残すのが鍵で、読み手が「index が古い」を機械検出できる唯一の手段になる。
- **提案 2 (service 層) は memory 限定の proof slice**。projection 全体の入口化は
  「DB 再設計はコア安定後」という PO 合意と正面衝突するのでやらない。原則
  (ファイル正本 / service 単一路 / DB は任意の派生 index / staleness 可視) を本 PLAN と
  ADR に記録し、全体適用は再設計 PLAN の入力にする。`selectMemoryEntries` の呼び元
  (SessionStart digest) を service 経由へ付け替えるところまでが slice の完結条件。
- **自動 commit は採らない** (1 巡目の裁定を維持)。Sol 却下 (commit 境界・メッセージ・
  レビュー主体を CLI が奪う)、Fable も「利便であって保証ではない」。hybrid では commit しても
  ブランチ上にある限り origin に到達しないため、自動 commit は「commit した = 共有した」という
  **新しい偽安心に看板が替わるだけ**。保証の本体は検出の fail-close 側に置く。
- **「共有済み」= origin 到達**。同一 tree では commit すら不要でファイルは見えるが、
  永続性・別 worktree・branch 切替に耐えるのは origin 到達のみ。HEAD 基準の検証規律と整合。
- **物理ディレクトリ分離はしない** (Fable: projection / secret-scan / 既存参照の面を増やす)。
  私的スクラッチは repo 外の scratchpad が既にある。
- **write-through 失敗時はファイル書き込みを正とする** (Sol: DB lock でコマンド全体を失敗に
  すると再試行で重複作成を招く)。返却契約は `committed=true / indexed=false /
  freshness=stale / structured_warning=INDEX_UPDATE_FAILED`。durable な dirty marker を
  先に作り、marker を作れないなら本文を書かない。

## スコープ (PR 分割、この順)

### PR-A: service 読み路 (ファイル正本)

1. `MemoryService` を新設し、**読みを service 単一路**にする。本文はファイルから読み、
   DB は metadata index として参照する。
2. filter / 順位 / tie-break を**純粋関数**に抽出し、DB 経路と file 経路で同一実装にする
   (現行仕様の実測: `title/body/tags/kind` の部分一致、`updated_at DESC, memory_id` 順、
   limit で slice。既定 limit は recall=5 / list=20 / digest=5)。
3. `content_hash` 照合で **stale index を構造化 warn として surface**。無音で古い結果を
   返す経路を廃止する。
4. SessionStart digest を service 経由に付け替え、DB 障害時も **memory は正本ファイルから
   出す**。hook を止めない設計は維持しつつ、劣化は可視マーカーで示す。
5. **per-entry 隔離** (欠陥 5): 1 件の破損で全件読みを落とさない。skip + 構造化 finding。

### PR-C: scope / retire を service 境界で強制

6. frontmatter に `scope: lesson | episode` を必須化 (現行 `kind` は project/feedback/
   reference/user の分類でエピソード性とは直交する)。`episode` は終了条件 (`closes_with`)
   必須、無指定は fail-close。
7. retire は `status: retired` の状態遷移とし、service の読みが既定で除外する。
   git 履歴とファイル本体が残るので教訓喪失リスクが無い。
8. doctor lifecycle check: `closes_with` が閉じている (PR merged) のに active な episode を
   surface。既存 34 件は `scope` 未付与なので移行 lint として検出する。

### PR-D: write-through (前提: pragma)

9. `memory add` を write-through にし、full rebuild 依存のラグを解消する。dirty marker →
   本文 atomic write → index transaction 更新 → 成功時のみ marker 削除。
10. corpus fingerprint 照合で **service を通さない out-of-band 変更** (手編集・別プロセス) を
    検出する。静的検査は偽装可能なので、この挙動側が真の oracle。

**pragma (`busy_timeout` / `journal_mode` / `synchronous`) は本 PLAN のスコープ外**とする。
`src/state-db/*.ts` に grep 0 件で lock 即死が常態という実測は本 PLAN の調査で得たが、
**PLAN-L7-460 スコープ 6 が既に同一契約を宣言済み**であり、二重実装を作らない。
PR-A は読み路から DB を外すため pragma に依存しないが、**PR-D は L7-460 スコープ 6 の
完了を前提**とする (依存を明示して順序を固定する)。

### PR-B: 同期契約 (独立、並行可)

11. doctor に `memory-sync` check を追加。`.ut-tdd/memory/*.md` が **untracked = error**
    (配達経路が無い)、**commit 済みだが origin 未到達 = warn** (in-flight ブランチの正常運用を
    止めない)。SCM 上の判定なので service 移行と直交する。

### PR-E 以降: 34 件の移行 (PR-C の後)

12. 教訓抽出 → lesson として昇格 → 元エピソードに replacement を記録 → retire の順。
    **一括削除しない**。「retire 済み件数 / 残 episode 件数」を doctor の実測値で追えるように
    してから開始する (進捗を prose にしない)。

## スコープ外

- SQLite pragma (PLAN-L7-460 スコープ 6)。上記のとおり依存としてのみ扱う。
- harness.db の肥大・VACUUM・rebuild 資源 (PLAN-L7-460 スコープ 3 / 8)。index-only 化しても
  既存 4.4GB は縮まない。
- projection 全体の service 入口化 (DB 再設計、コア安定後)。
- feedback_events / handover CURRENT.json の設計 (PLAN-L7-110 / L6-06)。

## Schedule

- step 1 (直列): PR-A 実装 — 移植前の golden fixture 確定 → service 化 → 等価性照合
- step 2 (直列): PR-C 実装 (scope / retire を service 境界で強制)
- step 3 (並列): PR-B 実装 (SCM 同期検出、step 1-2 と直交)
- step 4 (直列): L7-460 スコープ 6 完了後に PR-D 実装 (write-through)
- step 5 (直列): PR-E 以降で 34 件移行
- step 6 (直列): blind review (非 author provider) → confirm

## AC

- AC-1 (PR-A、等価性): 移植前の `recall` / `list` / digest 出力を golden fixture として固定し、
  service 経由の出力が**同一入力で一致**することを assert (filter / 順位 / tie-break / limit)。
- AC-2 (PR-A、DB 障害時): harness.db を別プロセスが排他 lock した状態でも `recall` が
  **正本ファイルから結果を返し**、`freshness=stale` 相当を構造化して示すことを assert。
  「exit 0 かつ完全無出力」を返したら fail。
- AC-3 (PR-A、破損隔離): frontmatter 欠落の 1 件を fixture に混ぜて、**他の全件が読める**こと
  および破損 1 件が構造化 finding として出ることを assert (欠陥 5 の回帰)。
- AC-4 (PR-A、境界): `memory_entries` テーブル名リテラルと `.ut-tdd/memory/` パスリテラルの
  出現が repository モジュール 1 箇所に限定されることを回帰テストで固定 (detector allowlist
  ではなく依存方向の固定)。加えて fingerprint 照合で out-of-band 変更を検出する。
- AC-5 (PR-B): fixture repo で `memory add` → commit せず doctor → `memory-sync` finding が
  **error で 1 件**。origin 到達後は 0 件。加えて**実 repo の未コミット 15 件で実発火した件数を
  ログで残す** (prose の「検出できる」主張の機械代替)。
- AC-6 (PR-C): `scope: episode` かつ `closes_with` が closed な fixture を doctor が flag し、
  `status: retired` 付与後は service の既定結果から消えることを assert。
- AC-7 (PR-C): `scope` 欠落 memory を移行 lint が検出し、実 repo の 34 件が実数で出る。
- AC-8 (PR-D): DB を lock した状態で `memory add` が **本文を書き切り**、
  `committed=true / indexed=false` を返し、dirty marker が残ることを assert。marker を
  作れない場合は本文を書かないことも assert。
- AC-9 (共通): 検出を warn 止まりにしない。`memory-sync` は error 級とする
  (`unresolved-join` 672 件のような恒久 warn の海に沈めない)。

## 未実測 (着手前に埋める / 正直に記録)

- **418KB 全走査の cold ベンチマーク**。実測済みは warm の 112ms (78 件) のみ。SessionStart の
  時間制約に対する余裕は cold で再測する。
- **OneDrive 配下での atomic rename / dirty marker の挙動**。通常 NTFS と異なる可能性があり、
  同期による一時 lock が service のファイル直読に乗る (既知 pitfall として PR-D で扱う)。
- frontmatter 重複 `memory_id` / 壊れた Markdown の扱い (PR-A の per-entry 隔離で吸収する
  想定だが、重複 ID の優先規則は未定)。
