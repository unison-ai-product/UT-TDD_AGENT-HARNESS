---
plan_id: PLAN-L7-189-shared-harness-memory-cross-runtime
title: "PLAN-L7-189 (impl): HARNESS 共有 memory を Claude Code と Codex で共通化する"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-29
updated: 2026-07-28
owner: Codex TL / PO
parent_design: docs/design/harness/L6-function-design/handover-mechanism.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE - ut-tdd memory CRUD + .ut-tdd/memory authored markdown -> harness.db projection + SessionStart surface"
  - role: tl
    slot_label: "TL - canonical=harness.db projection / authored=.ut-tdd/memory / secret 非投影のレビュー"
  - role: qa
    slot_label: "QA - cross-runtime 共有、projection、fail-close の単体検証"
generates:
  - artifact_path: src/memory/index.ts
    artifact_type: source_module
  - artifact_path: src/secret.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-core.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-indexes.ts
    artifact_type: source_module
  - artifact_path: src/memory/service.ts
    artifact_type: source_module
  - artifact_path: src/lint/memory-sync.ts
    artifact_type: source_module
  - artifact_path: src/doctor/source-trace.ts
    artifact_type: source_module
  - artifact_path: tests/memory.test.ts
    artifact_type: test_code
  - artifact_path: tests/memory-service.test.ts
    artifact_type: test_code
  - artifact_path: tests/memory-sync.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/handover-mechanism.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-110-takeover-feedback-surface.md
  references:
    - docs/plans/PLAN-L6-06-handover-mechanism.md
    - docs/plans/PLAN-L5-08-harness-db-feedback.md
review_evidence:
  - reviewer: codex
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T18:34:00+09:00"
    tests_green_at: "2026-07-01T18:34:00+09:00"
    verdict: approve
    notes:
      - "Claude/Codex の共有文脈を .ut-tdd/memory authored markdown と harness.db memory_entries projection に分離した。"
      - "SessionStart surface は feedback surface と同じ fail-open/read-only 方針で配線した。"
      - "secret-like payload は write と parse の両方で fail-close する。"
    green_commands:
      - kind: lint
        command: "bunx biome check --write src\\memory\\index.ts src\\secret.ts tests\\memory.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T18:30:16+09:00"
        evidence_path: src/memory/index.ts
        output_digest: "sha256:37d1aa074805b1dda71c31f761759ae5e99784ea4d4e4fb85622cfe68397e5e5"
        anchor_commit: b3904eca7a50e185da4aeb1fa4177f0b3b64e271
      - kind: unit_test
        command: "bun run vitest run tests\\memory.test.ts tests\\dependency-drift.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T18:30:18+09:00"
        evidence_path: tests/memory.test.ts
        output_digest: "sha256:883c7b171a76cf86ef01d2f7a91b6245e39a67b43f694bc698aecacb9abfdc16"
        anchor_commit: b3904eca7a50e185da4aeb1fa4177f0b3b64e271
      - kind: integration_test
        command: "bun run vitest run tests\\projection-writer.test.ts tests\\db-projection-coverage.test.ts tests\\db-projection-ingestion.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T18:22:58+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:76825939ad6fd3e16a3c4225beada88354d62666a8deade364be07280e0c3320"
        anchor_commit: 3f9adfea88616ba33fe8ff23aebc730c4b0c9cb3
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T18:30:22+09:00"
        evidence_path: src/schema/harness-db.ts
        output_digest: "sha256:bc3266345c2c1ff13a8e248912bbc4bd86a5bf845c2eda7330e6d65ac3010841"
        anchor_commit: b3904eca7a50e185da4aeb1fa4177f0b3b64e271
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T18:30:23+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:4e1c724cd4cd04d3f9ad5efacfe4b7f12ad8a480448127d5ed9b2e7e0e5ddfc2"
        anchor_commit: 5b819e80d5e1f34136847bebbb836477d8c5a6a4
      - kind: smoke
        command: "bun src\\cli.ts db rebuild"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T18:32:00+09:00"
        evidence_path: docs/design/harness/L4-basic-design/architecture.md
        output_digest: "sha256:33ab09f8da631e3a58ef5fea44cb44d3b27bee5a7f3f4c8c9d418c6c5c6fb7eb"
        anchor_commit: b3904eca7a50e185da4aeb1fa4177f0b3b64e271
      - kind: doctor
        command: "bun src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T18:33:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:4e1c724cd4cd04d3f9ad5efacfe4b7f12ad8a480448127d5ed9b2e7e0e5ddfc2"
        anchor_commit: 5b819e80d5e1f34136847bebbb836477d8c5a6a4
---

# PLAN-L7-189 (impl): HARNESS 共有 memory

## 0. 背景

Claude Code と Codex の実行中コンテキストは `feedback_events` と SessionStart surface で一部共有できるが、PO 判断、配布先、運用上の好み、過去レビューで確定した注意点のような curated memory は Claude 専用 memory や prose handover に寄りやすかった。

この PLAN では、共有 memory の authored source を `.ut-tdd/memory/*.md`、query/read model を `harness.db.memory_entries` として定義し、Claude Code と Codex の両方が `ut-tdd memory` CLI と SessionStart surface から同じ文脈を読めるようにする。

## 1. Scope

### IN

- `.ut-tdd/memory/*.md` の authored memory 形式。
- `memory_entries` table と `idx_memory_kind_updated` index。
- `ut-tdd memory add/list/recall`。
- `rebuildHarnessDb` での deterministic projection。
- SessionStart での `harness.db memory` surface。
- secret-like payload の fail-close。

### OUT

- 個人 global memory の移行。
- Claude 専用 memory file の自動同期。
- Pack に dogfood の `.ut-tdd/memory` 内容を同梱すること。
- raw transcript / credential / PII の保存。

## 2. 実装

- `src/memory/index.ts` を追加し、write/load/parse/select/render を集約した。
- `src/secret.ts` を追加し、state-db / memory / search / audit が共有する secret-like token detector を下位 module に分離した。
- `src/schema` の registry を schema version 19 に上げ、`memory_entries` table と index を追加した。
- `src/state-db/projection-writer.ts` に `projectMemoryEntries` を追加した。
- `src/cli.ts` に `memory add/list/recall` と SessionStart surface を追加した。
- L5 physical-data、L6 handover-mechanism、L7 unit-test-design へ V-pair の設計追記を行った。
- `tests/memory.test.ts` で authored markdown、secret fail-close、DB projection、surface rendering を検証した。

## 3. 受け入れ結果

- Claude/Codex は同じ `ut-tdd memory` CLI surface で共有 memory を扱える。
- canonical は `harness.db.memory_entries` projection、authored source は `.ut-tdd/memory/*.md` として分離された。
- SessionStart は feedback surface と同じ fail-open 方針で共有 memory を表示する。
- secret-like payload は authored file 作成前、または parse 時に拒否される。

## 4. 残境界

- 実際の Claude memory から `.ut-tdd/memory` への移行は個人 state を触るため別判断。
- Pack には機構を配布し、dogfood の `.ut-tdd/memory` 実データは含めない。

## 5. 追補 (2026-07-28、issue #175): 同期契約とライフサイクル契約

初版は「authored markdown → projection → SessionStart surface」の**経路**を作ったが、
**同期状態とライフサイクルの契約を持たなかった**。運用 1 か月で以下が実測された。本節はその
是正を本 PLAN のスコープに追加する (新規 PLAN を起こさず既存 PLAN の拡張とする。
2026-07-28 の稼働ブロック不変条件「net-new draft 起票ゼロ / 既存 PLAN 拡張のみ」に従う)。

### 5.1 実測された欠陥

1. **未共有 memory が沈黙する**: `memory add` はファイルを書くだけで同期状態を誰も検査しない。
   実測でローカル作業ツリーに origin 追跡分が **32 件欠落**、逆にローカルのみの未コミットが
   **21 件** (両方向の乖離が同時発生)。21 件はすべて引き継ぎ目的で書かれ、書いた側は
   「共有した」と認識していた。
2. **完了エピソードの残置率 100%**: main の memory 92 件中 **34 件 (37%)** が PR/issue 番号を
   持つエピソードで、参照 PR **20 本すべてが MERGED**。`CLAUDE.md` は「エピソード状態は
   メモリに書かず digest に任せる」と規定するが機械契約が無く、回収機構も無い。
3. **引き継ぎ経路が lock で無音消失**: `surfaceSessionStartDigestToStdout` の
   `catch { /* fail-open */ }` により、DB lock / 破損時に memory / feedback / schedule を含む
   digest 全段が無言で消えていた。「情報が無い」と「読めなかった」が区別できない。
   (CLI の `recall` / `list` は例外を捕まえず非 0 終了するので無音ではない。無音は digest 側。)
4. **書き路と読み路が full rebuild でしか繋がらない**: `memory_entries` の書き込み口は
   `projectMemoryEntries` (rebuild 内 1 箇所) のみで、`memory add` は DB を触らない。
   add 直後は recall / digest に出ない (ラグは次の Stop hook refresh まで、rebuild は実測 4m38s)。
5. **破損 1 件が読み路全体を落とす**: `loadMemoryEntries` は全件を map するため、frontmatter
   欠落 1 件で全件読みが throw する。実測: 2026-07-28 の db rebuild が手書き 1 件で 3m28s 後に中断。

### 5.2 設計判断 (advisor 2 系統 × 2 巡、2026-07-28)

`claude-fable-5` と `gpt-5.6-sol` に独立に投げ統合した。1 巡目は両者とも**ファイル直読を却下**
(Sol: DB と同じ filter / 順位 / retire 規則を保証できないうちに fallback すると別種の
silent divergence を作る)。2 巡目で PO 提案 (DB は関係のみ / service 層) を再投した結果:

- **Sol は却下を明示的に撤回**: 「これは fallback ではなく、**唯一の正本 read path への変更**である」。
- **Fable は失効条件を明示**: 却下理由が消えるのは「**読み路が service 1 本に統一された後**」であり、
  統一前に fallback を先行させると元の理由が復活する。**順序が本質**。

確定した不変条件:

1. **ファイルが正本** (`.ut-tdd/memory/*.md`)。
2. **DB は派生 metadata index**。本文の複製に依存しない (全 78 件の直読は実測 **112ms**、
   body 合計 114KB / corpus 418KB で、複製の便益が無い)。
3. **アクセスは service 単一路**。読みも書きも `MemoryService` を通す。
4. **staleness は可視**。index が古い / 読めない状態を無音で「0 件」に見せない。
5. **「共有済み」= origin 到達**。同一 tree ではファイルは相手から見えるが、永続性・別 worktree・
   branch 切替に耐えるのは origin 到達のみで、「検証の基準点 = HEAD」規律と整合する。

採らなかった案: **自動 commit** (「commit した = 共有した」という新しい偽安心に看板が替わるだけ。
hybrid では commit してもブランチ上にある限り origin に届かない)、**物理ディレクトリ分離**
(projection / secret-scan / 既存参照の面を増やす)。

### 5.3 本追補で実装した範囲

- `src/memory/service.ts`: `loadMemoryCorpus` (per-entry 隔離) / `queryMemoryEntries`
  (filter・順位・tie-break の唯一実装) / `compareIndexToCorpus` (content_hash 照合) /
  `readMemory` / `renderMemoryHealth`。
- `src/cli.ts`: `memory list` / `recall` を service 経由に。SessionStart digest は memory を
  DB 障害と独立に読み、DB 段が全滅しても劣化 digest を出す (無音 `catch {}` の廃止)。
- `src/handover/session-start-digest.ts`: `selectSessionStartDigest` は memory を引数で受け取る。
- `src/lint/memory-sync.ts` + doctor hard gate `memory-sync`: untracked / 未コミット変更 =
  **error**、commit 済み origin 未到達 = note。

### 5.4 本追補のスコープ外 (後続)

- `scope: lesson | episode` の型強制と `status: retired` 状態遷移、および既存 34 件の
  教訓抽出 → 昇格 → retire (**一括削除しない**)。
- `memory add` の write-through。前提の SQLite pragma は **PLAN-L7-460 スコープ 6 の責務**
  であり、二重実装を作らないため本 PLAN では扱わない。
- `memory_entries` からの `body` 列 DROP (schema 変更は上流 doc 合流と同時に行う)。
- OneDrive 配下での atomic rename / 一時 lock の挙動 (未実測、write-through 時に扱う)。

### 5.5 追補の受け入れ結果 (実測)

- 新規テスト 14 件 (`tests/memory-service.test.ts` 9 / `tests/memory-sync.test.ts` 5)、
  関連 4 ファイルで **21 tests green**。
- `memory-sync` が**実 repo で 21 件の未共有を実発火**し (shared 59 / originResolved=true)、
  clean tree では ok=true / shared 92 / violations 0 (CI は緑のまま、汚れたローカルでのみ鳴る)。
- 移植前後の等価性を golden 比較で固定 (9 組の options で旧 SQL 経路と ID 列一致、既定 limit=8 維持)。
- 実装中に境界テストが自分の新 lint に発火したため、allowlist を広げず
  「scan-only の面は本文を読まない」を追加 assertion で固定した。
