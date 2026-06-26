---
plan_id: PLAN-L7-145-handover-path-leak-and-marker-drift
title: "PLAN-L7-145 (troubleshoot): handover 生成器の絶対パス漏洩を是正 (repo-relative + home-mask) し既存 tracked 漏洩を除去 / marker-drift は敵対検証で patch 不可と確定し mitigation + design 課題化"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-06-24
updated: 2026-06-24
owner: PM (Opus) / PO (人間)
backprop_decision: not_required
backprop_decision_reason: "Harness self-application の handover 生成器 hygiene 是正 (privacy: 個人絶対パス漏洩防止) + runtime scratch 整理。生成器の出力整形と tracked scratch の untrack のみで、product 要件 / 設計 / test-design 契約は不変。"
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-24T19:22:00+09:00"
    tests_green_at: "2026-06-24T19:20:00+09:00"
    verdict: pass
    scope: "4-agent adversarial workflow (investigate x2 -> verify x2) が両 defect の初期設計の重大欠陥を捕捉: #1 の case-sensitive prefix 比較は process.cwd()=大文字 C: と記録=小文字 c: (実測 421:36) で大半を取りこぼす false-green、#2 の terminal-status null は 272/299 confirmed の repo で過剰発火・self-pollution で無効。検証反映後の最終: #1 = case-insensitive relativize + home-mask (個人パス 0 を実データで確認、handover test 71 pass)、#2 = patch せず mitigation (marker reconcile + prose gitignore で被害 contain) + design 課題化。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/handover.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-24T19:20:00+09:00"
        evidence_path: tests/handover.test.ts
        output_digest: "sha256:a8880464cc076556fa02321fb205e95af3c1908155f125861cd23b8560f8f9f8"
  - reviewer: codex-gpt-5.x
    review_kind: cross_agent
    reviewed_at: "2026-06-24T19:40:00+09:00"
    tests_green_at: "2026-06-24T19:20:00+09:00"
    verdict: approve
    scope: "Cross-runtime (codex/gpt-5.x) desk review of the adversarially-corrected fixes. Q1 (case-insensitive prefix relativize correct, no sibling/relative/out-of-repo mangle) TRUE; Q2 (out-of-repo home-mask sound for display-only handover) TRUE; Q3 (untrack regenerable leaked scratch is right) TRUE; Q4 (NOT patching #2 + mitigate + defer marker auto-advance is the disciplined call given the over-fire/self-pollution evidence) TRUE; Q5 (no regression: scaffold 3-arg/pure, display-only relativize, buildPointer count unchanged, fail-open, marker not nulled) TRUE. Verified backslash-normalize + trailing-slash handling. Verdict approve."
    worker_model: claude-opus-4-8
    reviewer_model: codex-gpt-5.x
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/handover.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-24T19:20:00+09:00"
        evidence_path: tests/handover.test.ts
        output_digest: "sha256:a8880464cc076556fa02321fb205e95af3c1908155f125861cd23b8560f8f9f8"
agent_slots:
  - role: tl
    slot_label: "TL — handover 生成器 path relativize + home-mask"
  - role: aim
    slot_label: "AIM — adversarial fix-design workflow + cross-runtime review"
generates:
  - artifact_path: docs/plans/PLAN-L7-145-handover-path-leak-and-marker-drift.md
    artifact_type: markdown_doc
  - artifact_path: src/handover/index.ts
    artifact_type: source_module
  - artifact_path: tests/handover.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-144-warn-remediation-parity-and-join.md
---

# PLAN-L7-145 (troubleshoot): handover 絶対パス漏洩是正 + marker-drift の確定的トリアージ

## 0. 検出 (PO「なおしたほうがいいんちゃう？」2026-06-24)

PLAN-L7-144 follow-up で記録した handover 生成器の defect 2件を是正する。**ultracode に従い
4-agent の敵対的 workflow (調査 x2 → 設計検証 x2) を回し、両 defect の初期修正設計の重大欠陥を
事前に捕捉した** (workflow の価値が実証された)。

## 1. Defect #1 — handover 生成器が絶対個人パスを漏洩

### 1.1 根本

Claude hook の tool 入力は絶対パス。`src/runtime/session-log.ts` `summarize()` が
`ti.file_path` (絶対) を event target に記録し、`compressPlanDigest()` が `files_touched` へ畳む。
`src/handover/index.ts` `scaffoldFromDigests()` がそれを無変換で deliverables へ写し、handover
md §2 に `Write <home>\OneDrive\Desktop\...\src\x.ts` 形で出力。歴史 tracked handover
(session-handover-2026-05-28) は絶対パス0なので**退行**かつ privacy 漏洩。実測で **tracked な
session-handover-*.md 10 ファイルに数百件**の個人絶対パス (最多 645/1ファイル) が commit 済だった。

### 1.2 敵対検証が捕捉した初期設計の致命欠陥

初期案 (case-sensitive prefix 比較で repo-relative 化) は **`process.cwd()` が大文字 `C:` を返す
一方ディスク上の記録は小文字 `c:` が支配的 (実測 421 件小文字 vs 36 件大文字)** ため、
case-sensitive 比較では大半が一致せず漏洩継続 = **false-green** (一致 casing を使ったテストだけ
緑になる coverage≠substance の罠)。検証はこれを major で却下した。

### 1.3 是正 (src/handover/index.ts)

`relativizeTouchedFile(entry, repoRoot)` を新設し render 時 (`scaffoldFromDigests`) に適用:

1. **repo 配下の絶対パス → repo-relative** (prefix 比較は **case-insensitive** で Windows の
   casing 非決定性を吸収、出力は元 casing 保持、sibling-prefix は `${root}/` 境界で誤一致防止)。
2. **repo 外の絶対パス (Temp / ~/.codex 等) は user-home prefix (`<drive>/Users/<name>/` /
   `/home/<name>/`) を `~/` にマスク** (username 漏洩防止)。
3. relativize 後に重複除去 (casing 差が同一 rel に潰れる)。fail-open (never throws)。
4. RENDER 時に適用する理由: record 時のみだと既存の汚染 digest + Claude/Codex 混在記録が残る。
   render なら既存データも一掃。`scaffoldFromDigests` が deliverables.files の唯一生成点で、
   唯一の production caller `runHandover` が `deps.repoRoot` を持つため plumbing は局所。

実データで再生成 handover の個人パス **0件** を確認 (`c:/Users/micro` も `Users/micro` も 0)。

### 1.4 既存 tracked 漏洩の除去

auto-gen の `docs/handover/session-handover-*.md` (CURRENT prose、PLAN-L7-144 で runtime
scratch として gitignore 済) を `git rm --cached` で untrack。数百件の個人パス漏洩を repo から除去。
canonical handover は harness.db feedback_events。

## 2. Defect #2 — marker-drift (active-plan が done PLAN を指し false in_progress)

### 2.1 根本

active-plan は `.ut-tdd/state/current-plan` marker (手動 `ut-tdd plan use` 設定のみ)。in-session
で PLAN を author/confirm しても自動更新されず、L7-14 (confirmed=done) に固着。handover が
`active=PLAN-L7-14 status=in_progress` と false-state 出力。

### 2.2 敵対検証が patch 候補を全否定

- **terminal-status で null 案**: `major` 却下。**299 plan 中 272 が confirmed** で、本 repo の
  常態は confirmed plan への Reverse back-fill。terminal を trigger にすると正規の active を
  常時破棄する過剰発火。VALID_STATUSES は 4 値のみで accepted/merged/superseded は status に
  なり得ず、既存 terminal 集合 (outstanding.ts / merged-plan-status.ts) とも非整合。
- **「session digest に無い→警告」案**: marker が L7-14 に固着したため当 session の event が
  L7-14 の digest を**自己汚染** (141 commits/449 files を誤吸収)。L7-14 は session digest を
  **持ってしまう**ので空振り。

= **クリーンな minimal patch は存在しない**。真因は marker auto-advance 機構の不在 = 設計課題。

### 2.3 mitigation (被害の contain) + design 課題化

- marker を実 carry (L7-141) へ reconcile 済 → 以後の汚染停止。
- handover prose を gitignore 済 (PLAN-L7-144) → false-state が commit 成果物に到達しない。
- → user-facing 被害は contained。残る (digest 誤吸収 = gitignored runtime state、CLI 表示) は
  低影響。**proper fix = marker advance/reconcile 機構の設計** (when/how advance の判断を要し、
  patch でなく feature/design)。本 PLAN では実装せず、設計タスクとして残す。

## 3. Acceptance Criteria

- 再生成 handover に個人絶対パス 0 (`[A-Za-z]:/Users/<name>` / `Users/<name>` / `/home/<name>` 不在)。
- `relativizeTouchedFile`: mismatched casing で relativize、repo 外 home path を `~` マスク、
  repo 外 non-home / 相対 / sibling は無改変、fail-open。
- tracked な auto-gen session-handover-*.md = 0 (untrack 済)。
- typecheck / biome / vitest / doctor / plan lint green。

## 4. 残差 / スコープ外

- 非 handover の tracked doc 7 箇所の `C:\Users\<name>` は **意図的**: lint の禁止残渣パターン
  例示 (architecture.md / PLAN-L4-13 / PLAN-RECOVERY-01 / helix-porting-map) と migration
  provenance (helix-source-inventory / v2-import-ledger)。doctor-green = ルール上許容で生成器
  漏洩と別性質。lint パターン doc の改変は契約 desync リスクゆえ据え置き。
- `src/runtime/provider-handover.ts` の input.files も同じ非 relativize gap (検証が指摘)。
  provider-handover.v1 JSON 面は本 markdown defect と別経路ゆえスコープ外、follow-up 候補。
- Defect #2 の marker auto-advance 設計 (§2.3)。

## 5. 壊さない

- `relativizeTouchedFile` は fail-open、repo 外 non-home パス・相対パスを改変しない。
- `scaffoldFromDigests` の repoRoot 引数は optional (既定 "" で no-op) ゆえ既存 3-arg test 不変。
- buildPointer の digest_summary.files **件数**は scope.digests から算出 (display と独立) で不変。
- marker は null 化せず (過剰発火回避) reconcile のみ。検出器ロジックは緩めない。
