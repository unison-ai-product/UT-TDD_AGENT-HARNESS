---
plan_id: PLAN-L7-729-ci-fail-fast
title: "PLAN-L7-729 (refactor): harness-check の fail-fast 化 — Ubuntu 共通の軽量 check
  を preflight job へ移し、重い 4 脚を needs: preflight にする (issue #729)"
kind: refactor
layer: L7
drive: agent
route_signal: structural
route_mode: refactor
created: 2026-09-28
updated: 2026-09-28
owner: PM / PO
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
backprop_decision: not_required
backprop_decision_reason: requirements §6.2 / §6.9 の CI 契約 (Required Status
  Check は aggregate harness-check 1 本、全量回帰は Actions) は不変。同じ check 集合の実行 job
  と順序を組み替える構造是正であり、新規 L0/L1 要件ではない。doc lane で typecheck
  が常時実行になる点は検証の強化方向の差分であり、弱化ではない (§設計判断 D3)。
agent_slots:
  - role: se
    slot_label: SE (Codex worker) — harness-check.yml の preflight job 新設 +
      github-ci-policy.ts の manifest / aggregate 契約改訂
  - role: qa
    slot_label: QA — U-CIPOL-028〜036 の負例 / mutation と Actions 実測 (成功 run / 軽量失敗 run)
  - role: tl
    slot_label: TL (非著者 frontier) — aggregate 意味不変と lane skip allowlist 不変のレビュー
generates:
  - artifact_path: docs/plans/PLAN-L7-729-ci-fail-fast.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-455-ci-cost-speedup-phase1.md
    - docs/plans/PLAN-L7-461-ci-cost-speedup-phase2.md
  blocks: []
  references:
    - docs/plans/PLAN-RECOVERY-15-cross-os-ci-aggregate-gate.md
review_evidence: []
status: draft
github_issue_id: 729
admission_receipt:
  schema_version: v2
  receipt_id: certificate:52b3f1f4e75ee41059efba897141a715
  command_id: plan-draft:issue-729:ci-fail-fast:1
  admitted_at: 2026-09-28T11:14:33.221Z
  source_digest: sha256:d1f10f2d4b7ba85e3fe24c01a8c25546ffdfb7c79dedc927c2d48a158db1d6c6
  decision_digest: sha256:255336ba9ebb384ab06465f470038611cf8038abb53f758ca0a02cf9457c01cf
  receipt_digest: sha256:e83bd942f10e808bd4d9e8aa8f1ca2311fbf7bba6e4b7d26153cadafc55cae59
  binding:
    path: docs/plans/PLAN-L7-729-ci-fail-fast.md
    plan_id: PLAN-L7-729-ci-fail-fast
    asset_id: plan:52b3f1f4e75ee41059efba897141a715
    revision: 1
    content_digest: sha256:d1f10f2d4b7ba85e3fe24c01a8c25546ffdfb7c79dedc927c2d48a158db1d6c6
  route:
    signal: structural
    mode: refactor
  issue:
    provider: github
    issue_id: 729
    episode_id: E4-729-ci-fail-fast
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-461-ci-cost-speedup-phase2
    revision: 1
    digest: sha256:254bd6f89366d9d0e427fd32b16a0c585d4d457261e50053f667b8ffe7d763c9
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-729-ci-fail-fast
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #729: CI の fail-fast 化 (軽量 check を preflight job へ移し、重い 4
    脚と aggregate を preflight に束縛する)。PLAN-L7-455 / L7-461 の CI 契約
    (RUNTIME_STEP_MANIFESTS / aggregate) を弱めず拡張する refactor の新規起票。"
---

# PLAN-L7-729 (refactor): harness-check の fail-fast 化

## 目的

軽量 check (branch-type guard / plan admission-check / typecheck / biome lint) の失敗が、
重い check (doctor / vitest 全回帰) の後にしか判明しない構造を解消する。検証の削減ではなく、
**同じ check 集合の実行 job と順序の再配置** である (issue #729、親 #581)。

実測 (run 34306781012、main 成功 run、2026-09-09):
- Linux 脚: setup〜install 11s、guard 1s、typecheck 10s、doctor 1m41s、vitest 6m11s、**lint (biome) は vitest 後の 2s**。
- Windows 脚: typecheck 11s、vitest 10m29s。脚間に `needs` が無いため Linux が軽量 check で落ちても Windows は走り切る。
- issue 本文の 2026-09-28 実測では Linux 13.5 分 / Windows 21.7 分 (vitest 10m22s / 20m21s)。

## スコープ

1. `.github/workflows/harness-check.yml`: `preflight` job 新設、4 runtime 脚へ `needs: preflight`、
   Linux 脚から軽量 4 step を除去、aggregate の `needs` / result guard / step 順を改訂、header コメント追随。
2. `src/lint/github-ci-policy.ts`: `PREFLIGHT_STEP_MANIFEST` 追加、runtime 脚の許可キーを
   `needs` / `runs-on` / `steps` へ変更 (needs は `preflight` 固定)、aggregate needs / result guard の
   正準集合へ `preflight` を追加、result guard の download 前置を検査、`SOURCE_REQUIRED_STEPS` の
   評価対象を preflight + Linux 脚の和へ変更、violation reason `invalid_preflight_gate` を追加。
3. `tests/github-ci-policy.test.ts`: U-CIPOL-028〜036 を追加し、既存 fixture のうち Linux 脚の
   軽量 step を前提にしたもの (U-CIPOL-019a の lint mutation、019aa の guard separator、
   lane 条件付き guard の負例) を preflight 対象へ付け替える。
4. `docs/test-design/harness/L7-unit-test-design.md`: 新節「PLAN-L7-729 preflight fail-fast oracle」。

非スコープ: Windows 脚の vitest 短縮 (#726 型の Windows 固有赤は短縮されない)、local preflight
(#581 の別成果)、plan lint の preflight 化 (§将来候補)、source template / setup builtin / Pack template
の job 構成 (これらは `harness-check` 単一 job 契約のまま。`github-ci-policy.ts:1133` で required step
検査前に `continue` するため影響なし)。

## 設計判断

### D1. 軽量 check を preflight へ「移動」するか「複製」するか

| 案 | 内容 | trade-off |
|---|---|---|
| A (採択) | guard / admission / typecheck / lint を Linux 脚から **除去** し preflight のみで実行 | 同一 ubuntu-latest・同一 exact head・同一コマンドであり、Linux 脚で再実行しても安全性は増えない。manifest の二重管理を避ける。Linux 脚は約 15s 短縮 |
| B | preflight に複製し Linux 脚にも残す | 安全性の上積み 0、manifest 二重化、`missing_step` 判定の意味が曖昧化 |

advisor (gpt-5.6-sol, implementation, 2026-09-28) の推奨と一致。根拠: preflight と Linux 脚は
ともに `runs-on: ubuntu-latest`、`commonRuntimeSteps` (同一 node 24.13.0 + `npm ci`)
(`src/lint/github-ci-policy.ts:352-360`)。

### D2. Windows 脚の typecheck を残すか

**残す (advisor 推奨を採択)**。Windows 脚は別 OS 面 (path separator / `tsc` の Windows 実行) を
被覆する脚であり (`harness-check.yml:168-172` の PLAN-L7-448 方針)、Linux の typecheck の重複ではない。
Windows 脚の step manifest は `needs` 追加以外不変 (`github-ci-policy.ts:457-479`)。

### D3. preflight の lane 分類 (typecheck は現状 full lane 限定)

| 案 | 内容 | trade-off |
|---|---|---|
| A (採択) | preflight は **classify を持たず**、4 step を lane 無条件で実行する。各 harness 脚は従来どおり独立 classify | doc lane にも typecheck (実測 10〜11s) が加わる = 検証の強化方向。lane producer 契約 (`missing_lane_producer`、`github-ci-policy.ts:544-565`)・`LANE_FULL_ONLY_IF` 式・header allowlist test (`tests/change-lane.test.ts:218-`) を一切触らない |
| B | preflight が classify し `jobs.preflight.outputs.lane` を export、脚は `needs.preflight.outputs.lane` を参照 (advisor 提示の選択肢) | classify 2 回分 (各 1〜2s) を節約するだけで、`LANE_FULL_ONLY_IF` / `LANE_DOC_ONLY_IF` の正準式 (`:285-286`)、producer 検査、全 lane 条件 step の manifest を書き換える。job 間 output を信頼根に加える新契約になる |
| C | preflight にも classify step を置き typecheck を lane 条件付きにする | producer 検査を preflight へ拡張する必要。doc lane の typecheck 12s を節約する以外の利得なし |

独立 classify は「job 間で output を共有しないため」(`harness-check.yml:190`) という単純さの選択であり、
`src/github/change-lane.ts` や `checkLaneSkipSafety` がそれ以外を禁じる制約ではないが、B/C は
契約面を広げる割に節約が秒単位のため不採用。**preflight の step は lane 条件 (`steps.classify.outputs.lane`)
を一切持たない** (classify の無い job で lane 条件を付けると output が空 = 常に skip になり、検証が
黙って消えるため。manifest 完全一致で機械的に塞ぐ)。

### D4. preflight 内で 1 つ目の失敗の後も残りの軽量 check を走らせるか

| 案 | 内容 | trade-off |
|---|---|---|
| A (採択) | 軽量 4 step に `if: ${{ !cancelled() }}` を付け、前段失敗でも全 step を実行 | 1 push で軽量赤を全部返す (#724 は unused import と format の 2 種が別往復になりうる型)。job の結論は 1 step でも失敗なら failure のまま (fail-close 不変)。install 失敗時は後続が連鎖 error になるノイズを許容 |
| B | 既定 (最初の失敗で停止) | 実装最小だが、typecheck 赤の裏の lint 赤が次 push まで隠れ、fail-fast の目的 (往復回数削減) を半分しか満たさない |

`!cancelled()` は lane 条件ではないため `checkLaneSkipSafety` の対象外であり、preflight manifest の
完全一致でのみ固定する。

### D5. node-generation 2 脚にも `needs: preflight` を付けるか

**付ける (採択)**。4 runtime 脚すべて `needs` 完全一致 `preflight` という単一不変条件にする方が
検査が単純 (脚ごとの例外表を持たない)。node-generation 脚 (20s〜1min) は critical path (Windows 脚)
上にないため壁時計への影響は無く、軽量失敗時の runner 消費が減る。

### D6. aggregate `harness-check` の needs / result guard に preflight を直接入れるか

| 案 | 内容 | trade-off |
|---|---|---|
| A (採択) | `needs: [preflight, 4 脚]`、result guard に `needs.preflight.result == success` を AND | preflight は guard / admission / typecheck / lint の**唯一の実行 job** となり、aggregate verdict の構成要素そのもの。aggregate の意味「全 component が success」を局所的に表現できる |
| B | 脚が `skipped` になることに依存 (needs は 4 脚のまま) | 現状は脚の job-level `if` 禁止 (`forbidden_job_level_lane_skip`、`:520-527`) と exact keys 検査があるため直ちには穴にならないが、verdict が 2 つの別検査の組合せに間接依存する。脚側の検査が緩んだ瞬間に preflight 赤 + 脚 success の green が成立しうる |

B が現状の検査下で安全であることは認めた上で、aggregate 契約を自己完結にするため A を採択
(advisor 推奨と同結論、理由は「preflight が check の唯一の保持者になる」点を主根拠とする)。
これに伴い `github-ci-policy.ts:711-722` の needs 完全一致検査と `REQUIRED_AGGREGATE_COMMAND`
(`:635-637`) を `AGGREGATE_NEEDS = ["preflight", ...RUNTIME_LEGS]` 基準へ改訂する。
`PLAN-RECOVERY-15` の aggregate 契約 (always() で必ず起動し、全 needs success の AND で判定) の
**意味は不変**、needs 集合だけが 1 件増える。

### D7. aggregate の result guard と artifact download の順序

**result guard を download より前に置く (採択)**。現状は download (`harness-check.yml:309-313`) が先。
preflight 失敗時は node-generation 脚が起動せず artifact が 0 件になる。`actions/download-artifact@v4`
が pattern 0 件一致で成功扱いか失敗扱いかは **未検証** だが、どちらでも verdict は red であり、問題は
失敗理由の可読性 (download の失敗に見える) である。guard を先に置けば verdict は artifact 非依存に
先に確定する。policy は「result guard step の index < download step の index」を検査する
(1 比較の追加。reason は既存 `missing_aggregate_result_guard`)。

### D8. 既存 PLAN の改訂か新規 PLAN か

**新規 PLAN (本書)**。`RUNTIME_STEP_MANIFESTS` は `PLAN-L7-455` (troubleshoot, confirmed、commit 44673b29
`fix(ci): seal runtime step manifest`)、doctor envelope 消費順は `PLAN-L7-461` (troubleshoot, confirmed)、
aggregate 契約は `PLAN-RECOVERY-15` (recovery, draft) が所有する。前 2 者は incident route の confirmed
PLAN であり、新しい job 構造の導入をその scope へ積むと incident の閉包を再度開くことになる。
RECOVERY-15 は cross-OS aggregate の回復が目的で fail-fast は別論点。本 PLAN はこれらの契約を
**弱めずに拡張する** ため `supersedes` は宣言せず、`requires` (confirmed 2 件) と `references`
(draft の RECOVERY-15) で依存を示す。

route: issue の `bottleneck` は `src/schema/route-map.ts` の token に存在しない (grep 0 件)。
`redesign` mode は `allowed_kinds: [design, add-design]`、layer band L1-L6 (`src/schema/route-filing.ts:62-68`)
で L7 実装に合わない。check 集合を変えず構造 (job 配置と順序) を組み替える性質から
`route_signal: structural` → `route_mode: refactor` (`route-map.ts` refactor tokens、
`route-filing.ts` refactor: `allowed_kinds: [refactor]`、layer band L7) を採択し、pairing obligation
「behavior invariant + regression fence + linked test id」を §不変条件 と U-CIPOL-028〜036 で満たす。

## 正準 step manifest (改訂後)

### `preflight` (新設、`runs-on: ubuntu-latest`、許可キー = `runs-on` / `steps` のみ)

| # | name | 内容 |
|---|---|---|
| 1 | `checkout` | `actions/checkout@v5`、`fetch-depth: 0` (guard の `git log` と admission の base 解決に必要) |
| 2 | `setup node (harness 実行系の正式 runtime、PLAN-L7-462 step 2)` | `commonRuntimeSteps` と同一 |
| 3 | `install deps (frozen)` | `npm ci --no-audit --no-fund` |
| 4 | `branch-type guard (commitlint / poc / hotfix)` | 現 Linux 脚の step と env / run 同一 + `if: ${{ !cancelled() }}` |
| 5 | `plan admission-check (PLAN 編集の receipt 照合、fail-close)` | 現 Linux 脚の step と env / run 同一 + `if: ${{ !cancelled() }}` |
| 6 | `lint (biome)` | `npm run lint` + `if: ${{ !cancelled() }}` |
| 7 | `typecheck (tsc --noEmit)` | `npm run typecheck` + `if: ${{ !cancelled() }}` (lane 条件なし) |

順序は所要の短い順 (guard / admission 1〜2s、lint 2s、typecheck 10s)。D4 により順序は失敗の可視性に影響しない。

### `harness-check-linux` (`needs: preflight`)

checkout → setup node → install → classify → db rebuild (full) → doctor (full) → test 全回帰 (full)
→ doc lane checks (doc) → doc lane source doctor (doc) → audit quality (full) → job summary (always)。
**除去**: branch-type guard / plan admission-check / typecheck / lint (biome)。残る step の本文・条件は不変。

### `harness-check-windows` / `node-generation-linux` / `node-generation-windows` (`needs: preflight`)

steps は現行 manifest (`github-ci-policy.ts:457-489`) から不変。

YAML 上の配置: 既存 fixture が `"  <leg>:\n    runs-on: ..."` を置換 anchor に使うため
(`tests/github-ci-policy.test.ts:1194,1218,1493`)、`needs: preflight` は **`runs-on` の直後** に書く。

### `harness-check` (aggregate)

```yaml
needs: [preflight, harness-check-linux, harness-check-windows, node-generation-linux, node-generation-windows]
if: ${{ always() }}
steps: checkout → setup node (aggregate admission runtime)
  → require preflight, harness and Node generation success   # REQUIRED_AGGREGATE_COMMAND (preflight を先頭に含む)
  → download Node generation evidence
  → admit exact Node generation run
```

## policy 改訂 (`src/lint/github-ci-policy.ts`)

| 変更 | 内容 | violation reason |
|---|---|---|
| preflight 検査 (新) | `jobs.preflight` の存在・mapping・許可キー `runs-on`/`steps`・`runs-on: ubuntu-latest`・`continue-on-error` 不在・job-level `if` 不在・steps が `PREFLIGHT_STEP_MANIFEST` と semantic 完全一致 | **`invalid_preflight_gate` (新)**、detail は `jobs.preflight` / `jobs.preflight must contain only runs-on and steps` / `jobs.preflight must run on ubuntu-latest with non-empty fail-close steps` / `jobs.preflight.steps must exactly match the ordered canonical semantic manifest` |
| 脚の needs (新) | 4 runtime 脚の `needs` が `stringValues` で `["preflight"]` と完全一致 | `invalid_preflight_gate`、detail `jobs.<leg>.needs must equal preflight` |
| 脚の許可キー (改) | `hasExactKeys(leg, ["needs", "runs-on", "steps"])` (`:512`) | 既存 `missing_runtime_leg`、detail を `must contain only needs, runs-on and steps` へ |
| Linux manifest (改) | guard / admission / typecheck / lint を除去 (`:388-455`) | 既存 `missing_runtime_leg` |
| aggregate needs (改) | 正準集合 `AGGREGATE_NEEDS = ["preflight", ...RUNTIME_LEGS]` と完全一致 (`:711-722`) | 既存 `invalid_aggregate_needs`、detail の列挙に preflight を追加 |
| aggregate result guard (改) | `REQUIRED_AGGREGATE_COMMAND` を `AGGREGATE_NEEDS` 全件の `test ... = "success"` AND に (`:635-637`)、per-need 式存在検査 (`:743-751`) も同集合 | 既存 `missing_aggregate_result_guard` |
| guard の前置 (新) | result guard step の index < `actions/download-artifact@v4` step の index | 既存 `missing_aggregate_result_guard`、detail `aggregate result guard must precede artifact download` |
| required step の評価対象 (改) | runtime/source の `SOURCE_REQUIRED_STEPS` (`:142-157`) を preflight steps + Linux 脚 steps の和に対して評価 (現状は `checkRuntimeAggregate` が返す Linux 脚のみ、`:753`,`:1135-1139`) | 既存 `missing_step` |
| `aggregateHarnessResultsPass` (改) | `preflight` も success 必須に | — |

`LANE_SKIPPABLE_FULL_ONLY_STEP_MATCHERS` (`:290-297`) と `LANE_FULL_ONLY_IF` / `LANE_DOC_ONLY_IF` は **不変**。

## 不変条件 (refactor の behavior invariant)

1. 任意の exact head について、改訂前に実行されていた check は改訂後も全て実行され、1 つでも失敗
   すれば required aggregate `harness-check` は failure になる (lane 別の実行集合: full lane は同一、
   doc lane は typecheck が **追加** されるのみ)。
2. doc lane で skip してよい step の allowlist は不変 (U-CIPOL-021〜026 の既存 regression が green)。
3. aggregate は `if: always()` のまま全 needs の success AND で判定する (PLAN-RECOVERY-15 の意味不変)。
4. Required Status Check は `harness-check` 1 本のまま (`preflight` は component check であり
   Branch Protection に追加しない)。

## 実装順序 (serial)

1. (serial) 本 PLAN の pair-freeze: 設計判断 D1〜D8 と test-design 行を非著者 frontier で cross-review。
2. (serial) 実装 PR 1 本 (論点 = CI job 構成の fail-fast 化 1 件): workflow + policy + policy test + test-design。
   `generates` への成果物宣言と confirm は本 PR で同時に行う。
3. (serial) Actions 実測を issue #729 に記録 (AC-5)。

## 受入条件

- AC-1: `analyzeGithubCiPolicy` が実 repo の改訂 workflow で `ok=true` (U-CIPOL-028)。
- AC-2: U-CIPOL-029〜036 の全 mutation が指定 reason で fail-close する。
- AC-3: 既存 U-CIPOL-013〜027 (付け替え分を含む) と `tests/change-lane.test.ts`、
  `tests/windows-ci-single-snapshot.test.ts` が green。
- AC-4 (Actions 負例): 軽量 check を意図的に赤にした PR run で、`preflight` = failure、4 脚 = skipped
  (起動しない)、`harness-check` = failure、かつ aggregate の失敗 step が result guard であること
  (download ではない) を run URL で記録。
- AC-5 (Actions 実測): 成功 run と軽量失敗 run の壁時計・preflight 所要を issue #729 に記録。
  目標: 軽量失敗の判明が 2 分以内。成功 run の壁時計増分は preflight 所要 (推定 30〜60s) 以内。

## 将来候補 (本 PLAN の受入外)

- `plan lint` の preflight 化 (#574 型の PLAN 簿記赤を早期化)。所要未計測のため見送り。
- Windows 脚の lane 対応強化・vitest 分割 (#581)。
