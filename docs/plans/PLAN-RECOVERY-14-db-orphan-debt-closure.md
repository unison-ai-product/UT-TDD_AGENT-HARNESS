---
plan_id: PLAN-RECOVERY-14-db-orphan-debt-closure
title: "PLAN-RECOVERY-14 (recovery): harness.db orphan データ負債の収束 — workflow_orphans / orphan_gate_run 各 17 件 + 誤配置 runtime state 清掃 (issue #87)"
kind: recovery
layer: cross
drive: agent
status: confirmed
route_signal: regression_dev
route_mode: recovery
created: 2026-07-17
updated: 2026-07-21
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
backprop_decision: not_required
backprop_decision_reason: "検出 gate (drive-db-registration / gate-run-coverage / runtime-state-location) は PLAN-L7-363/365/369/409 系で設計・実装済み。本 PLAN は gate が検出し続けている残存データ負債の帰属確定・退役・清掃であり、新規 L0/L1 要件ではない。"
agent_slots:
  - role: aim
    slot_label: "AIM — orphan の帰属確定基準と退役手続きの設計判断 (correction vs allowlist、証跡保全)"
  - role: se
    slot_label: "SE — orphan 17+17 件の由来調査と正規手続きでの解消、誤配置 state の退避/削除"
  - role: qa
    slot_label: "QA — 解消後 doctor green の実証 + orphan 再流入の負例 regression"
  - role: tl
    slot_label: "TL — 完了済み成果の誤退役防止レビュー (foreign 成果デグレ禁止原則)"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-14-db-orphan-debt-closure.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-363-routine-gate-run-projection.md
    - docs/plans/PLAN-L7-365-harness-db-currency-hook.md
    - docs/plans/PLAN-L7-409-runtime-plan-context-join-signal.md
review_evidence:
  - reviewer: blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-21T15:20:00+09:00"
    tests_green_at: "2026-07-21T14:10:00+09:00"
    verdict: approve
    worker_model: claude-sonnet-5
    reviewer_model: gpt-5.6-sol
    scope: "worktree wt-issue-87 変更一式 (projection-writer.ts drive_run_id join 修正 + alias 解決、U-DBPROJ-GATE-02/03/04、PLAN 本文)。初回 blind review はコード/テスト PASS + 見出し実測境界超過で FLAG → 見出し是正 (実 17 件の全件帰属は再測定待ち) → focused 再レビューで PASS (確定/未確定境界の一貫性を L110/L124/L278 で確認)。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/projection-writer.test.ts -t 'PLAN-RECOVERY-14' → U-DBPROJ-GATE-02/03/04 3 passed。bunx vitest run tests/drive-db-registration.test.ts → 7 passed。typecheck 0 errors / biome clean / plan lint OK (Step 4 実施記録参照)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-21T14:10:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:5b6cb68715df80dba11564602f7c9d51844f7816e7f5b280186c4308d11cd4fb"
        anchor_commit: 73ca280e7362776de980d0719f69817abdc533ab
---

# PLAN-RECOVERY-14 (recovery): harness.db orphan データ負債の収束

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/87

## 背景 (2026-07-17 監査、db rebuild 後の doctor 実測)

`ut-tdd db rebuild` で db-currency (stale_plan_registry) は解消したが、以下の
violation はデータ負債として残存し、doctor が恒久 Red を出し続けている。検出系
gate 自体は confirmed 済み PLAN 群で正しく機能しており、**欠けているのは検出後の
是正を閉じる受け皿**である。恒久 violation は警報疲れ (alarm fatigue) を生み、
新規 violation の発見性を下げる。

- `drive-db-registration - violation 1 (workflow_orphans=17)`
- `gate-run-coverage - violation 1 (orphan_gate_run=17)`
  (例: `finding:unresolved-join:gate_runs:gate-run:G10:4868985cd9bb`。
  unresolved-join feedback 262 件との関係整理を含む)
- `runtime-state-location - violation: misplaced:downloads/design-template-hunt/originals/.ut-tdd`
  (session log 実体を含む誤配置 runtime state)

## 是正方針 (Step 案)

### Step 1: [直列] orphan の由来調査と帰属基準の確定
- 直列理由 = **downstream_dependency** (帰属基準が後続の解消手続きを決める)。
- workflow_runs / gate_runs の orphan 各 17 件について、由来 (どのセッション・
  どの PLAN 期の活動か) を projection 元 artifact から特定し、
  (a) 実 PLAN へ紐付け可能 → join 修復、(b) 由来不明・歴史的残留 → 正規の
  correction/退役手続き、の分類基準を確定して本 PLAN に記録する。
- 他ランタイムの完了済み成果を誤って退役しない (foreign 成果デグレ禁止)。
  判断が付かない row は退役せず PO 確認へ回す。

### Step 2: [並列] orphan 解消の実施
- Step 1 の分類に従い join 修復 / 退役を実施。silent delete は禁止し、退役は
  証跡 (audit note or correction record) を残す。

### Step 3: [並列] 誤配置 runtime state の清掃
- `downloads/design-template-hunt/originals/.ut-tdd` は session log 実体を含む
  ため、削除前に `.ut-tdd/audit/` 側へ退避するか破棄してよいかを PO 確認の上で
  清掃する (破壊的操作のため確認必須)。

### Step 4: [直列] 回帰確認と再流入防止
- 直列理由 = **verification_gate**。doctor で当該 3 violation が green になること、
  および orphan が再流入した場合に gate が再度 fail-close することの負例
  regression を確認 (「0 件」主張は doctor 実走 evidence で substantiate、
  prose 禁止)。

## Step 1 実施記録 (2026-07-21、worktree `wt-issue-87` / branch `work/recovery-14-db-orphan-closure`)

### スコープ上の制約 (最初に明記する)

本 slice は git worktree (`origin/main` 起点、`.ut-tdd/` は fresh) で実施しており、
`.ut-tdd/gate_runs/`・`.ut-tdd/logs/`・`.ut-tdd/harness.db` は **すべて `.gitignore`
対象の per-checkout runtime state** である (`.gitignore:26,30,39`)。`git worktree add`
はこれらを複製しない (実測: 本 worktree の `.ut-tdd/state/` は `.gitkeep` のみ、
`.ut-tdd/gate_runs/` は存在しない)。したがって背景節に記録された実際の
`workflow_orphans=17` / `orphan_gate_run=17` の**具体的な 17+17 行**は、2026-07-17
監査を実行したチェックアウト (メイン checkout 側と推定) のローカル runtime state に
存在し、本 worktree からは物理的に参照できない。かつタスク境界により
メイン checkout には触れない。

→ このため Step 1 は「由来調査」を **行単位の列挙** ではなく
**projection コードのメカニズム単位の根本原因調査** として実施し、各メカニズムを
このワークツリー内で合成 (synthetic) 再現・実証した。これは prose 主張ではなく
再現スクリプト実測 + regression test (下記) で substantiate する。メイン checkout の
実 34 行に対する最終的な数値内訳の再測定は、本 PLAN の是正 (Step 2) が
マージされた後、その checkout で `ut-tdd db rebuild && ut-tdd doctor` を再実行する
ことで得られる (「未完了事項」参照)。

### 原因 1: `workflow_orphans` — gate 実行 PLAN を必ず orphan 化する構造的バグ (実 17 件の全件帰属は再測定待ち)

`src/state-db/projection-writer.ts` の `projectGateRunEvidence`
(`.ut-tdd/gate_runs/*.json` → `gate_runs` + `workflow_runs` 投影) は、gate 実行の
たびに workflow_runs 行の `drive_run_id` を `stableId("gate-drive", planId)` で
生成していた。一方 `projectDriveRuns` が全 PLAN に対して必ず作る「documented」
drive_runs 行の id は `stableId("drive-run", `${planId}:documented`)` であり、
**prefix が異なるため両者の id は原理的に一致し得ない**
(`stableId` は `prefix:sanitized(value)` を返す、`src/stable-id.ts`)。

結果: `ut-tdd gate <id>` を 1 回でも実行した plan は、その plan が現存・有効か
どうかに関係なく、`workflow_orphans` を無条件に 1 件生む。2026-07-17 監査の
`workflow_orphans=17` は PLAN-L7-363 (gate 証跡永続化、2026-07-09 confirmed) 導入後に
実行された `ut-tdd gate` 呼び出し件数と時期的に整合し、**分類 (a) 実 PLAN へ join
修復可** に該当する (17 件全件がこのメカニズム由来である可能性が高いが、行単位の
確認は上記制約により再測定待ち)。

再現 (scratchpad 上、fix 前):

```
drive_runs:  [{ drive_run_id: "drive-run:PLAN-TEST-repro:documented", ... }]
workflow_runs: [{ workflow_run_id: "gate-workflow:...", drive_run_id: "gate-drive:PLAN-TEST-repro" }]
workflow_orphans: { c: 1 }   # 100% 再現、plan は plan_registry に実在するにも関わらず orphan
```

### 原因 2: `orphan_gate_run` — legacy plan alias 未解決による false positive (一部)

`projectHookEvents` / model_runs / skill_recommendations / skill_invocations の
各投影は `resolveProjectedPlanId` (`resolveLegacyPlanAlias` 経由、PLAN rename で
説明的 suffix が付いた際の旧 short-id 参照を解決) を通しているが、
`projectGateRunEvidence` だけはこの解決を素通りし、evidence JSON の `plan_id` を
そのまま `gate_runs.plan_id` に書いていた。gate evidence 生成時の plan_id が
その後 PLAN rename で prefix 化された場合、alias 解決さえすれば実在する PLAN に
join できるにも関わらず恒久 orphan になる。

再現 (scratchpad 上、fix 前): plan file を `PLAN-TEST-repro-full-title` に rename し
evidence の `plan_id` を旧 short id `PLAN-TEST-repro` のまま残すと
`orphan_gate_run: { c: 1 }`。これは **分類 (a)**。

一方、evidence の `plan_id` が alias 解決後も plan_registry に存在しない場合
(削除された PLAN・typo・使い捨て検証実行) は、fix 後も正しく orphan のまま残る
(下記負例 regression 参照) — これは **分類 (b) 歴史的残留 → 正規退役対象**、または
由来が確認できない場合は **分類 (c) 判断不能 → PO 行き** であり、silent delete は
行わない。メイン checkout の実 17 件のうち、alias 解決で消えない残数がどの程度かは
上記制約により Step 2 の fix 適用後の再測定が必要。

### 分類基準 (確定)

| 分類 | 基準 | 本 slice での扱い |
| --- | --- | --- |
| (a) join 修復可 | orphan がコード側の投影バグ (id 不一致 / alias 未解決) に起因し、参照先 PLAN が plan_registry に実在する | projection コードを修正し、再 rebuild で自動的に解消 (silent data patch ではない) |
| (b) 歴史的残留・正規退役対象 | (a) の修正後も orphan のまま残り、かつ由来 (どの PLAN/セッションか) が session log 等の証跡から確認できる | 本 slice では実施しない (該当行が現在参照不可のため)。由来確認でき次第、証跡付きで `gate_runs`/`workflow_runs` 側に "retired" ステータス行 or 別テーブルの correction record を追加する正規手続きを設計する (allowlist 直接編集や `UPDATE` による握り潰しは禁止) |
| (c) 判断不能 | 由来が確認できない、または他ランタイムの成果である可能性を排除できない | 退役せず PO 確認へ回す。silent delete 絶対禁止 |

## Step 2 実施記録

`src/state-db/projection-writer.ts` の `projectGateRunEvidence` を修正:

1. `drive_run_id` を `stableId("gate-drive", planId)` → `stableId("drive-run", `${planId}:documented`)` に変更し、`projectDriveRuns` が作る実在の drive_runs 行と一致させた (原因 1 の是正)。
2. `plans: Map<string, ProjectedPlan>` を引数に追加し、他の DB-linked projection と同じ `resolveProjectedPlanId` (legacy alias 解決) を gate_runs projection にも適用した (原因 2 の是正)。呼び出し元 `rebuildHarnessDb` の `projectGateRunEvidence(repoRoot, db)` → `projectGateRunEvidence(repoRoot, db, plans)` を更新。

これは **harness.db を直接 UPDATE する誤魔化しではなく、projection 元のソースコード
(is-source-of-truth な投影ロジック) 側の是正** であり、`ut-tdd db rebuild` を再実行
すれば毎回この是正が再現される (rebuild で戻らない)。分類 (b)/(c) の実データ退役は
本 slice では未実施 (対象行が本 worktree から参照不可のため) — 上記表の手続きに
従い、メイン checkout 側での再測定後に別途実施する。

regression test を追加 (`tests/projection-writer.test.ts`):

- `U-DBPROJ-GATE-02` — gate 由来 workflow_runs が正しい drive_runs 行に join し、
  `workflow_orphans` が 0 になることを固定 (原因 1 の正例)。
- `U-DBPROJ-GATE-03` — legacy short plan_id を持つ gate evidence が現行 plan_id に
  alias 解決され `orphan_gate_run` が 0 になることを固定 (原因 2 の正例)。
- `U-DBPROJ-GATE-04` — 実在しない plan_id を参照する gate evidence は fix 後も
  `orphan_gate_run=1` のまま fail-close することを固定 (負例 regression、
  分類 (b)/(c) を握り潰していないことの証拠)。

## Step 3: 誤配置 runtime state の清掃 — 未実施 (PO 確認待ち)

タスク境界により本 slice では実施しない。`downloads/design-template-hunt/originals/.ut-tdd`
は破壊的操作 (削除/移動) の対象であり、かつメイン checkout 配下の実体でありこの
worktree からは操作不可能 (操作すべきでもない)。残る violation は
`runtime-state-location` の 1 件のみ。

## 設計判断依頼: 誤配置 runtime state (`downloads/design-template-hunt/originals/.ut-tdd`) の処置

前提: `downloads/design-template-hunt/originals/.ut-tdd` は session log 実体を含む
誤配置 runtime state で、`runtime-state-location` doctor check を恒久 Red にしている。
削除は破壊的操作であり、session log の内容 (何のセッションで生成されたか、audit
証跡として参照される可能性があるか) は未確認のため PO 判断が必要。

| 案 | 内容 | 得るもの | 失うもの |
| --- | --- | --- | --- |
| A (推奨) | `.ut-tdd/audit/` 配下へ内容を退避 (コピー) してから `downloads/design-template-hunt/originals/.ut-tdd` を削除 | session log の証跡性を保全しつつ誤配置を是正。将来の監査で参照可能 | 退避作業・レビューの手間が増える。`.ut-tdd/audit/` の肥大化 |
| B | 内容を確認せず即座に削除 | 作業が最速で完了する | 実は参照価値のある session log (例: 未 backfill の gate 証跡) を消してしまうリスクがあり、後戻り不可 |

推奨理由: 誤配置は是正すべきだが、session log 実体は unresolved-join feedback
262 件や orphan_gate_run の由来調査に将来使える可能性があり、確認前の破棄は
「silent delete 禁止」の本 PLAN の原則と矛盾する。

## Step 4 実施記録 (2026-07-21)

### 本 worktree での doctor check 実測 (fix 適用後)

`bun src/cli.ts db rebuild` (rows 86888) 後、`checkDriveDbRegistration` /
`checkGateRunCoverage` / `checkRuntimeStateLocation` (`src/doctor/process-quality.ts`,
`src/doctor/runtime-state-location.ts`) を直接呼び出して実測 (doctor はシングルトンの
ため full run は避け、該当 check 関数を直接呼ぶ scoped 実測とした):

```
=== checkDriveDbRegistration ===
"drive-db-registration - OK (plans=813, drive_runs=813, workflow_runs=7, model_runs=857,
 skill_recommendations=4065, skill_invocations=2795, registered_hook_events=10, modes=12,
 legacy_hook_orphans=0)"   ok: true

=== checkGateRunCoverage ===
"gate-run-coverage - OK (gate_runs=7, workflow_runs=7, workflow_without_gate=0, orphans=0)"
ok: true

=== checkRuntimeStateLocation ===
"runtime-state-location - OK (nested .ut-tdd=0)"   ok: true
```

本 worktree には元々 orphan データが存在しないため (上記スコープ制約参照)、この
実測は「fix 適用後に regression が無いこと」の証拠であり、「メイン checkout の実
34 件が解消したこと」の証拠ではない。後者は「未完了事項」節で扱う。

### 負例 regression (再流入時に fail-close することの確認)

`tests/projection-writer.test.ts` の `U-DBPROJ-GATE-04` で固定
(実在しない plan_id を参照する gate evidence が `orphan_gate_run=1` のまま残ることを
assert)。実行結果:

```
bunx vitest run tests/projection-writer.test.ts -t "PLAN-RECOVERY-14" --reporter=verbose
✓ U-DBPROJ-GATE-02 ... 586ms
✓ U-DBPROJ-GATE-03 ... 322ms
✓ U-DBPROJ-GATE-04 ... (fail-close 確認)
Test Files  1 passed (1)
     Tests  3 passed | 35 skipped (38)
```

### gates

```
bun run typecheck   → tsc --noEmit, 0 errors
bun run lint        → biome check src tests, Checked 556 files, No fixes applied
bun src/cli.ts plan lint → plan-schedule — OK (§工程表 checked=813, §G.4 minimal slice)
bunx vitest run tests/projection-writer.test.ts -t "PLAN-RECOVERY-14"
  → 3 passed (U-DBPROJ-GATE-02/03/04)
bunx vitest run tests/drive-db-registration.test.ts
  → 7 passed
bunx vitest run tests/projection-writer.test.ts -t "gate run|gate-run|persisted gate"
  → 4 passed (含む既存 U-DBPROJ-GATE-01)
```

`tests/projection-writer.test.ts` の完全実行 (全 35 test) は共有マシン上の並行
セッション負荷 (空きメモリ実測 ~1GB/16GB、同時実行中の他 worktree ビルドプロセスを
`ps -W` で確認) により資源競合で `git rev-parse HEAD` が断続的に失敗する 2 件の
flake が発生した (対象テストは本変更と無関係な IMP-140 screen trace / Phase3
projection の git 呼び出しであり、`projectGateRunEvidence` 経路を通らない)。低負荷
時に単体で `git rev-parse HEAD` が即成功することを確認済みで、環境要因と判断した。
未完了事項として記録する。

## 未完了事項

1. **Step 3 (誤配置 runtime state の清掃) は未実施。** 上記「設計判断依頼」の
   PO 回答を得てから実施する。
2. **メイン checkout (または 2026-07-17 監査を実行した環境) 側での実測再測定が
   未実施。** 本 PLAN の Step 2 の fix (`src/state-db/projection-writer.ts`) が
   マージされた後、その環境で `ut-tdd db rebuild && ut-tdd doctor` を再実行し、
   `workflow_orphans` / `orphan_gate_run` の残数を確認する必要がある。0 にならない
   残数があれば、それが分類 (b)/(c) の実データであり、本 PLAN の分類基準表に
   従って別途 (b) 正規退役 or (c) PO 確認 の手続きを行う。
3. `tests/projection-writer.test.ts` フル実行 (35 tests) は共有マシン資源競合により
   本 slice では完走未確認 (上記 flake 参照)。関連範囲 (`-t` filter) は green。
4. `unresolved-join feedback 262 件との関係整理` (背景節に記載) は本 slice の
   スコープ外 (Step 1 の由来調査メカニズムとは別テーマであり、別途調査が必要)。

## AC

- [x] doctor `drive-db-registration` / `gate-run-coverage` が本 worktree で
      violation 0 (Step 4 実測、上記 JSON 引用)。`runtime-state-location` も
      本 worktree では violation 0 だが、メイン checkout 側の誤配置 state は
      Step 3 未実施のため対象外 (別途 PO 確認後に実施)。
- [ ] 退役した row 全件に証跡 (由来・判断理由) が残る — 本 slice では分類 (a) の
      コード fix のみ実施し、(b)/(c) の実データ退役はメイン checkout 側の
      再測定後に別途実施するため、現時点で退役実績 0 件 (該当なし)。
- [ ] 誤配置 runtime state の処置 (退避 or 削除) — 未実施、PO 確認待ち
      (設計判断依頼参照)。
- [x] doctor (scoped) / lint / typecheck / plan lint green (Step 4 実測)。vitest は
      関連 `-t` filter 実行 green、フル実行は環境要因により未完走 (未完了事項 #3)。
      review evidence は confirmed gate 前に別途記録する。
