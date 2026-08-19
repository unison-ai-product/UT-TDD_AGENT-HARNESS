---
plan_id: PLAN-L7-463-vitest-snapshot-fixed-cost-cache
title: "PLAN-L7-463 (refactor): snapshot runner 固定費の HEAD キャッシュ化 — clone/install/db rebuild の再利用 (issue #98)"
kind: refactor
layer: L7
drive: agent
route_signal: debt
route_mode: refactor
status: draft
created: 2026-07-28
updated: 2026-08-19
backprop_decision: not_required
backprop_decision_reason: "検証 runner の内部固定費削減 (behavior-invariant refactor)。テストの意味論・検証範囲・fail-close 性は不変で、上流 requirement / design 契約に影響しない。"
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - キャッシュキー設計 (決定性境界) と fail-open 化しない無効化条件のレビュー"
  - role: se
    slot_label: "SE - HEAD キー snapshot 再利用 + install/db rebuild スキップ実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-463-vitest-snapshot-fixed-cost-cache.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - scripts/run-vitest-snapshot.ts
    - tests/vitest-snapshot-runner.test.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-463 (refactor): snapshot runner 固定費の HEAD キャッシュ化

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/98

## 背景 (2026-07-28 実測)

vitest は必ず snapshot runner (`bun scripts/run-vitest-snapshot.ts`) 経由で、
毎回「committed HEAD の隔離 clone 作成 (6,629 ファイル処理) + install + db
rebuild (ローカル実測 36s)」を払う。**2 ファイルの targeted test でも 17〜25s**
(テスト本体 <1s)。TDD の red→green 反復と hybrid 両ランタイムの全検証がこの
固定費を払っており、開発ループ最大の税金 (2026-07-27 の Codex 検証ループが
push まで 50 分要した主因の一つ)。

## スコープ (behavior-invariant)

1. **HEAD sha キーの snapshot 再利用**: 同一 HEAD sha に対する 2 回目以降の
   実行は clone / install / db rebuild をスキップし、検証済み snapshot を再利用
   する。キーは HEAD sha + lockfile digest (install 境界) + projection 入力
   digest (db rebuild 境界)。
2. **無効化の fail-close**: キー不一致・snapshot 破損 (fingerprint 照合失敗)・
   キー算出不能の場合は必ず full 再構築へフォールバックする。「キャッシュが
   壊れていても再利用し続ける」fail-open 経路を作らない。
3. **並行実行の安全**: 両ランタイムが同時に同一 HEAD を検証するケースで
   snapshot を共有しても git-workspace-fingerprint (global-setup) の不変検査が
   成立すること。

## スコープ外

- テスト自体の高速化 (shard は PLAN-L7-461、テスト設計改善は別 PLAN)。
- doctor の incremental 化 (PLAN-L7-464)。

## 設計急所 (TL レビュー必須)

キャッシュ再利用は「キーが同じなら snapshot も同じ」という決定性が前提。
キーの取り違え = 古い code でテストする fail-open であり、検証基盤の信頼を
毀損する。よって AC-2 の負例 oracle (キー成分を 1 つずつ変えて必ず再構築に
落ちること) を green にするまで再利用経路を有効化しない。

## 追加実測 (2026-08-19、GitHub CI 面)

2026-07-28 の実測はローカルの targeted 実行だった。本節は **GitHub CI 上の同じ固定費**を
run 32224421060 (PR #338 exact HEAD 8f0f41e6、3 job SUCCESS) の job step API から実測した
ものを追加する。CI は fresh checkout なのでローカル固有の堆積 (dist / downloads /
.claude/worktrees) は存在せず、ここで見えるのは runner 固定費そのものである。

### leg 別の内訳

| leg | job 合計 | 内訳 |
|---|---|---|
| harness-check-linux | 464s | vitest 317s (68%) / doctor 93s / db rebuild 18s / typecheck 9s |
| **harness-check-windows (律速)** | **845s** | **vitest 776s (92%)** = `test:fast` 491s + `test:cli` 285s |

CI 全体の wall clock は Windows leg が決める。したがって短縮対象は Windows の vitest 776s。

### ファイル別 (Windows leg、vitest reporter 出力より)

| ファイル | 実測 | 内訳 |
|---|---|---|
| `tests/global-setup-fence.test.ts` | **180.4s** | **テスト 1 個** (`U-TESTHYGIENE-043`) |
| `tests/cli-surface.test.ts` | 161.2s | 54 tests |
| `tests/forward-escape-issue-contract.test.ts` | 153.9s | 17 tests |
| `tests/db-currency.test.ts` | 112.5s | 31 tests |
| `tests/distribution-acceptance.test.ts` | 68.0s | 5 tests |

上位 4 ファイルで約 608s = Windows vitest 776s の 78%。

### 最大単一要因は入れ子 snapshot の固定費

`tests/global-setup-fence.test.ts` は 21 行・テスト 1 個で、本体は
`spawnSync(node, ["scripts/run-vitest-snapshot.ts", "tests/fixtures/reference-fence-trip.test.ts"])`
の exit status と 1 行のメッセージ照合しかしていない。**180.4s はすべて入れ子で起動した
snapshot runner の固定費** (clone + install 境界 + db rebuild + fence capture) であり、
検査している内容 (fence violation が nonzero exit になること) の複雑さとは無関係である。

これは本 PLAN §背景 の「2 ファイルの targeted test でも 17〜25s (テスト本体 <1s)」と
同じ構造が、Windows CI では 1 テストあたり 180s に拡大して現れたものである。したがって
本 PLAN のキャッシュ化は、ローカル TDD ループだけでなく **CI 律速そのもの**に効く。

### 参考: doc lane は実運用でほぼ発火しない

PLAN-L7-455 phase1 の lane 分岐は landed 済みだが、`DOC_LANE_PREFIXES`
(`src/github/change-lane.ts:31`) は `docs/archive/` `docs/migration/` `docs/reference/`
`docs/research/` の 4 prefix のみで、`docs/plans/` を含まない。2026-08-19 に merge した
PR 4 本 (#335 / #336 / #337 / #338) は **0/4 が doc lane** で、PLAN のみ変更の #336 / #337 も
`change lane: full` と分類された。実測でも docs のみの #336 (Linux 7m49s) とコード変更の
#338 (Linux 7m44s) に差が無い。

allowlist を `docs/plans/` へ広げる案は**採らない**。#338 の CI 赤は
`duplicate-artifact-ownership` (PLAN の `generates` 重複) で、これは full doctor 側の
ゲートであり、doc lane に落とすと素通りしていた。狭い allowlist は fail-close として妥当で、
短縮は本 PLAN (固定費削減) 側で取るべきである。

## Schedule

- step 1 (serial): キャッシュキー成分の確定 + 負例 oracle のテスト設計
- step 2 (serial): 実装 + before/after 実測 (targeted 2 ファイル実行の wall time)
- step 3 (serial): blind review (非 author provider) → confirm

## AC

- AC-1: 同一 HEAD での 2 回目 targeted 実行の wall time が実測短縮される
  (before = 17〜25s、2026-07-28 ローカル実測。after は実測値を evidence 引用、prose 断定禁止)。
- AC-1b: CI 面の短縮を run 単位で実測引用する。before = `harness-check-windows` 845s /
  うち vitest 776s (run 32224421060、2026-08-19 実測)。after は同 job の step API 実測を
  evidence として引用する (prose 断定禁止)。特に `tests/global-setup-fence.test.ts`
  (before 180.4s / テスト 1 個) の短縮幅を単独で記録する。
- AC-2: キー成分 (HEAD sha / lockfile digest / projection 入力 digest) のいずれかが
  変わると必ず full 再構築に落ちる負例テストが green。
- AC-3: snapshot 破損 (ファイル改変) を fingerprint 照合が検出し full 再構築に
  落ちるテストが green。
- AC-4: 既存の snapshot runner 回帰 (tests/vitest-snapshot-runner.test.ts) が
  無改変で green (behavior-invariant の regression fence)。
