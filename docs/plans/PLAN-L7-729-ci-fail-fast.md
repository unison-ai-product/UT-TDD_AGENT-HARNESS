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
  と順序を組み替える構造是正であり、新規 L0/L1 要件ではない。lane (full / doc) ごとの 実行 check 集合は改訂前と同一に保つ
  (preflight も正準 classify を持ち typecheck は full 限定、 §設計判断 D3 / §不変条件)。
agent_slots:
  - role: se
    slot_label: SE (Codex worker) — harness-check.yml の preflight job 新設 +
      github-ci-policy.ts の manifest / aggregate 契約改訂
  - role: qa
    slot_label: QA — CANDIDATE-U-CIPOL-028〜039 の負例 / mutation と Actions 実測 (成功 run /
      軽量失敗 run)
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
  receipt_id: certificate:84e81e91335abfc6a6828b91428cada8
  command_id: plan-revise:issue-729:ci-fail-fast:plan:r4:c6542c82a8c4
  admitted_at: 2026-09-28T11:50:57.241Z
  source_digest: sha256:d390683b83026c70b8b47039cd079f883adbbefcc6f93960ab7c6d400c391bd1
  decision_digest: sha256:dcf6d1660d781859a6bd1c43f750790c3f822036cc22025bef0825cf8524c656
  receipt_digest: sha256:ab4ddd80b434960385530d3fce99ed12716758b13909ad420f68fe8a5858e349
  binding:
    path: docs/plans/PLAN-L7-729-ci-fail-fast.md
    plan_id: PLAN-L7-729-ci-fail-fast
    asset_id: plan:52b3f1f4e75ee41059efba897141a715
    revision: 4
    content_digest: sha256:d390683b83026c70b8b47039cd079f883adbbefcc6f93960ab7c6d400c391bd1
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
    target_revision: 4
    phase: forward_merge
  escape_reason: "Issue #729 PR #732: CI の oracle-test-trace 赤の是正 (未実装 oracle
    U-CIPOL-028〜039 を CANDIDATE-U-CIPOL-* として宣言し直す、契約内容は不変)。"
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

1. `.github/workflows/harness-check.yml`: `preflight` job 新設 (正準 classify を持つ)、4 runtime 脚へ
   `needs: preflight`、Linux 脚から軽量 4 step (guard / admission / typecheck / lint) を除去 (Linux 脚の
   classify は残す)、aggregate の `needs` / result guard / step 順を改訂、header コメント追随。
2. `src/lint/github-ci-policy.ts`: `PREFLIGHT_STEP_MANIFEST` 追加、runtime 脚の許可キーを
   `needs` / `runs-on` / `steps` へ変更 (needs は `preflight` 固定)、lane 検査 (`checkLaneSkipSafety` の
   producer 検査と lane 条件 loop) の対象を `preflight` + harness 2 脚へ拡張、classify を持たない job の
   lane 条件参照を拒否、aggregate needs / result guard の正準集合へ `preflight` を追加、result guard の
   download 前置を検査、`SOURCE_REQUIRED_STEPS` の評価対象を preflight + Linux 脚の和へ変更、
   violation reason `invalid_preflight_gate` を追加 (§policy 改訂)。
3. `tests/github-ci-policy.test.ts`: CANDIDATE-U-CIPOL-028〜039 を追加し、既存 fixture のうち Linux 脚の
   軽量 step を前提にしたもの (U-CIPOL-019a の lint mutation、019aa の guard separator、
   022 / 022b / 024 の lane 条件負例) を preflight 対象へ付け替える。
4. `docs/test-design/harness/L7-unit-test-design.md`: 新節「PLAN-L7-729 preflight fail-fast oracle」。

非スコープ: Windows 脚の vitest 短縮 (#726 型の Windows 固有赤は短縮されない)、local preflight
(#581 の別成果)、plan lint の preflight 化 (§将来候補)、source template / setup builtin / Pack template
の job 構成 (これらは `harness-check` 単一 job 契約のまま。`src/lint/github-ci-policy.ts:1133` で required step
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
被覆する脚であり (`.github/workflows/harness-check.yml:168-172` の PLAN-L7-448 方針)、Linux の typecheck の重複ではない。
Windows 脚の step manifest は `needs` 追加以外不変 (`src/lint/github-ci-policy.ts:457-479`)。

### D3. preflight の lane 分類 (typecheck は現状 full lane 限定)

改訂前の lane 別実行集合 (Linux 脚、`.github/workflows/harness-check.yml` / `src/lint/github-ci-policy.ts` の manifest):

- typecheck は **full 限定** (`.github/workflows/harness-check.yml:106-107`、`src/lint/github-ci-policy.ts:412` の `LANE_FULL_ONLY_IF`)。
- branch-type guard / plan admission-check / lint (biome) は **lane 無条件** (`.github/workflows/harness-check.yml:78`,`:101`,`:155`、
  `src/lint/github-ci-policy.ts:391-411`,`:444`)。

route は `refactor` を維持する (control 決定、Sol r1 FLAG 是正 2026-09-28)。`refactor` の pairing
obligation は「behavior invariant」(`src/schema/route-filing.ts:85`) であり、doc lane に typecheck を
足すと doc lane の head に新しい fail-close 条件が加わる = 振る舞い変更になる。したがって preflight は
今日の lane 意味論をそのまま再現しなければならない。

| 案 | 内容 | trade-off |
|---|---|---|
| A (採択) | preflight が **自前の正準 classify** (`classifyFields` = 脚と同一 producer、`src/lint/github-ci-policy.ts:304-311`,`:369`) を持ち、typecheck を `LANE_FULL_ONLY_IF` (`:285`) で条件付けする。guard / admission / lint は今日の Linux 脚どおり lane 無条件。harness 2 脚は従来どおり各自の classify を保持 | lane 別実行集合が改訂前と一致する (§不変条件 1)。lane 検査 (producer 検査 + lane 条件 loop、`:544-629`) の対象に `preflight` を加える policy 改訂が必要 (§policy 改訂)。classify が 1 回増える (実測 1〜2s) |
| B | preflight が classify し `jobs.preflight.outputs.lane` を export、脚は `needs.preflight.outputs.lane` を参照 | classify 1 回分を節約するだけで、`LANE_FULL_ONLY_IF` / `LANE_DOC_ONLY_IF` の正準式 (`:285-286`)、producer 検査、全 lane 条件 step の manifest を書き換える。job 間 output を信頼根に加える新契約になる |
| C (旧採択、撤回) | preflight は classify を持たず 4 step を lane 無条件で実行 | doc lane に typecheck が加わる = fail-close 条件の追加 (振る舞い変更)。refactor の behavior invariant に反するため不採用 |

A の成立条件:

1. **classify の決定性**: preflight と各脚の classify は同一の正準コマンド (`CLASSIFY_COMMAND`、`:304-311`) を
   同一 exact head (`actions/checkout@v5` + `fetch-depth: 0`) と同一 github context (event_name / sha /
   base sha / before) で実行するため、同じ lane を出す。job 間で output は共有しない
   (`.github/workflows/harness-check.yml:190` の既存方針を preflight にも適用)。
2. **各 job は自前の classify なしに lane 条件を持たない**: classify の無い job で
   `steps.classify.outputs.lane` を参照すると output が空 = 常に skip になり、検証が黙って消える。
   この不変条件を preflight に拡張し、さらに lane 検査対象外の job (node-generation 2 脚・aggregate) が
   lane 条件を持つことを拒否する (§policy 改訂)。
3. **typecheck の配置 (D4 との整合)**: 正準 lane 条件式は完全一致でのみ許可されるため
   (`:597-628`、`!cancelled() && ...` の合成式は non-canonical で拒否される)、typecheck の `if` は
   `LANE_FULL_ONLY_IF` そのものであり暗黙の `success()` を伴う。guard / admission / lint の失敗で
   typecheck が隠れないよう、typecheck を **classify の直後、`!cancelled()` 付き 3 step より前** に置く。
   合成式を正準へ追加する案は lane 条件式の許可集合 (信頼根) を広げるため採らない。

### D4. preflight 内で 1 つ目の失敗の後も残りの軽量 check を走らせるか

| 案 | 内容 | trade-off |
|---|---|---|
| A (採択) | lane 無条件の guard / admission / lint に `if: ${{ !cancelled() }}` を付け、前段失敗でも実行する。typecheck は `LANE_FULL_ONLY_IF` のみ (D3 成立条件 3) で classify 直後に置き、後続 3 step より先に走らせる | 1 push で軽量赤を全部返す (#724 は unused import と format の 2 種が別往復になりうる型)。job の結論は 1 step でも失敗なら failure のまま (fail-close 不変)。追加で走るのは既に赤の run だけで、green / red の判定は変わらない。install / classify 失敗時は後続が連鎖 error になるノイズを許容 |
| B | 既定 (最初の失敗で停止) | 実装最小だが、typecheck 赤の裏の lint 赤が次 push まで隠れ、fail-fast の目的 (往復回数削減) を半分しか満たさない |

`!cancelled()` は lane 条件ではない (`steps.classify.outputs.lane` を含まない) ため lane 条件 loop の
対象外であり、preflight manifest の完全一致でのみ固定する。classify には `if` を付けない
(producer 検査は `producer.if !== undefined` を拒否する、`src/lint/github-ci-policy.ts:553`)。

### D5. node-generation 2 脚にも `needs: preflight` を付けるか

**付ける (採択)**。4 runtime 脚すべて `needs` 完全一致 `preflight` という単一不変条件にする方が
検査が単純 (脚ごとの例外表を持たない)。壁時計への影響: preflight は 4 脚すべての前に直列化されるため、
成功 run の壁時計は preflight 所要分だけ増える (AC-5 が許容する増分。node-generation 脚 (20s〜1min) を
`needs` から外しても critical path の Windows 脚は preflight を待つので、この増分は減らない)。
軽量失敗時は 4 脚とも起動しないため runner 消費が減る。

### D6. aggregate `harness-check` の needs / result guard に preflight を直接入れるか

| 案 | 内容 | trade-off |
|---|---|---|
| A (採択) | `needs: [preflight, 4 脚]`、result guard に `needs.preflight.result == success` を AND | preflight は guard / admission / lint の**唯一の実行 job**、Linux 面 typecheck の唯一の実行 job となり (Windows typecheck は D2 で Windows 脚に残る)、aggregate verdict の構成要素そのもの。aggregate の意味「全 component が success」を局所的に表現できる |
| B | 脚が `skipped` になることに依存 (needs は 4 脚のまま) | 現状は脚の job-level `if` 禁止 (`forbidden_job_level_lane_skip`、`:520-527`) と exact keys 検査があるため直ちには穴にならないが、verdict が 2 つの別検査の組合せに間接依存する。脚側の検査が緩んだ瞬間に preflight 赤 + 脚 success の green が成立しうる |

B が現状の検査下で安全であることは認めた上で、aggregate 契約を自己完結にするため A を採択
(advisor 推奨と同結論、理由は「preflight が check の唯一の保持者になる」点を主根拠とする)。
これに伴い `src/lint/github-ci-policy.ts:711-722` の needs 完全一致検査と `REQUIRED_AGGREGATE_COMMAND`
(`:635-637`) を `AGGREGATE_NEEDS = ["preflight", ...RUNTIME_LEGS]` 基準へ改訂する。
`PLAN-RECOVERY-15` の aggregate 契約 (always() で必ず起動し、全 needs success の AND で判定) の
**意味は不変**、needs 集合だけが 1 件増える。

### D7. aggregate の result guard と artifact download の順序

**result guard を download より前に置く (採択)**。現状は download (`.github/workflows/harness-check.yml:309-313`) が先。
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
`route_signal: structural` → `route_mode: refactor` (`src/schema/route-map.ts` refactor tokens、
`src/schema/route-filing.ts` refactor: `allowed_kinds: [refactor]`、layer band L7) を採択し、pairing obligation
「behavior invariant + regression fence + linked test id」を §不変条件 と CANDIDATE-U-CIPOL-028〜039
(test-design に freeze する oracle。実装 PR で追加し、本 head では未実装) で満たす。
behavior invariant の中核は lane 別実行集合の同一性 (D3) であり、その regression fence は CANDIDATE-U-CIPOL-039。

## 正準 step manifest (改訂後)

### `preflight` (新設、`runs-on: ubuntu-latest`、許可キー = `runs-on` / `steps` のみ)

| # | name | 内容 |
|---|---|---|
| 1 | `checkout` | `actions/checkout@v5`、`fetch-depth: 0` (guard の `git log` と admission の base 解決に必要) |
| 2 | `setup node (harness 実行系の正式 runtime、PLAN-L7-462 step 2)` | `commonRuntimeSteps` と同一 |
| 3 | `install deps (frozen)` | `npm ci --no-audit --no-fund` |
| 4 | `classify changed files (doc lane vs full, fail-close)` | `classifyFields` (`id: classify` + `CLASSIFY_COMMAND`) と同一、`shell` / `if` / `env` なし (Linux 脚の producer と同形、`src/lint/github-ci-policy.ts:390`) |
| 5 | `typecheck (tsc --noEmit)` | `npm run typecheck` + `if: LANE_FULL_ONLY_IF` (現 Linux 脚と同一、`:412`)。`!cancelled()` は付けない (D3 成立条件 3) |
| 6 | `branch-type guard (commitlint / poc / hotfix)` | 現 Linux 脚の step と env / run 同一 (`:391-403`) + `if: ${{ !cancelled() }}` |
| 7 | `plan admission-check (PLAN 編集の receipt 照合、fail-close)` | 現 Linux 脚の step と env / run 同一 (`:406-411`) + `if: ${{ !cancelled() }}` |
| 8 | `lint (biome)` | `npm run lint` (`:444`) + `if: ${{ !cancelled() }}` |

順序: typecheck は暗黙 `success()` を伴うため classify 直後に置き、`!cancelled()` 付きの 3 step は
その後に置く (D3 成立条件 3 / D4)。この順序なら install / classify が成功した run では、4 check の
いずれが失敗しても残り (lane 上実行対象のもの) が全て実行される。

### `harness-check-linux` (`needs: preflight`)

checkout → setup node → install → classify → db rebuild (full) → doctor (full) → test 全回帰 (full)
→ doc lane checks (doc) → doc lane source doctor (doc) → audit quality (full) → job summary (always)。
**除去**: branch-type guard / plan admission-check / typecheck / lint (biome)。残る step (classify を含む) の
本文・条件は不変。

### `harness-check-windows` / `node-generation-linux` / `node-generation-windows` (`needs: preflight`)

steps は現行 manifest (`src/lint/github-ci-policy.ts:457-489`) から不変。

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
| lane 検査対象の拡張 (改) | `checkLaneSkipSafety` (`:504-630`) の producer 検査 (`:544-565`) と lane 条件 loop (`:595-629`) を job 単位の関数へ切り出し、`LANE_CLASSIFYING_JOBS = ["preflight", ...HARNESS_LEGS]` に適用する。preflight の producer 要件は Linux 脚と同一 (keys = `name`/`id`/`run`、`shell`/`if`/`env` なし、fail-close、ちょうど 1 個)。job-level `GITHUB_OUTPUT` 上書き禁止 (`:586-594`) も preflight に適用。doc lane doctor 要件 (`:566-585`) は HARNESS_LEGS のみ (preflight には課さない) | 既存 `missing_lane_producer` / `forbidden_lane_skip_step`、detail の job 名が `jobs.preflight` |
| classify 非所有 job の lane 参照拒否 (新) | harness-check workflow の `LANE_CLASSIFYING_JOBS` 以外の job (node-generation 2 脚・aggregate 等) で、`if` に `steps.classify.outputs.lane` を含む step があれば拒否 (「job は自前の classify なしに step を lane skip しない」不変条件の明文化) | 既存 `missing_lane_producer`、detail `jobs.<name> references steps.classify.outputs.lane without owning the canonical classify producer` |

`LANE_SKIPPABLE_FULL_ONLY_STEP_MATCHERS` (`:290-297`)、`LANE_FULL_ONLY_IF` / `LANE_DOC_ONLY_IF`、`CLASSIFY_COMMAND`
(`:304-311`) は **不変** (skip 可能 step の allowlist と正準式・producer は広げない)。

## 不変条件 (refactor の behavior invariant)

lane 別の実行 check 集合 (改訂前 = 改訂後、setup 系 step / classify / job summary を除く):

| lane | Linux 面 (改訂前 = Linux 脚 / 改訂後 = preflight ∪ Linux 脚) | Windows 脚 (不変) |
|---|---|---|
| full | guard / admission / typecheck / db rebuild / doctor / vitest 全回帰 / lint / audit quality (`.github/workflows/harness-check.yml:78`,`:101`,`:106`,`:110`,`:114`,`:134`,`:155`,`:158`) | typecheck / db rebuild / test:windows / doctor toolchain (`:203`,`:207`,`:211`,`:219`) |
| doc | guard / admission / doc lane checks / doc lane source doctor / lint (`:78`,`:101`,`:145`,`:151`,`:155`) | doc lane source checks (`:215`) |

1. preflight が success した run では、上表の lane 別 check 集合が改訂前と同一に実行され、1 つでも失敗
   すれば required aggregate `harness-check` は failure になる。preflight が failure した run では 4 脚は
   起動せず (AC-4)、aggregate は failure になる (preflight の check は改訂前も aggregate を赤にする check
   なので、green / red の判定は改訂前と一致する)。regression fence = CANDIDATE-U-CIPOL-039。
2. doc lane で skip してよい step の allowlist は不変 (U-CIPOL-021〜026 の既存 regression を実装 PR で
   green に保つ。本 head では未計測)。
3. aggregate は `if: always()` のまま全 needs の success AND で判定する (PLAN-RECOVERY-15 の意味不変)。
4. Required Status Check は `harness-check` 1 本のまま (`preflight` は component check であり
   Branch Protection に追加しない)。

## 実装順序 (serial)

1. (serial) 本 PLAN の pair-freeze: 設計判断 D1〜D8 と test-design 行を非著者 frontier で cross-review。
2. (serial) 実装 PR 1 本 (論点 = CI job 構成の fail-fast 化 1 件): workflow + policy + policy test + test-design。
   `generates` への成果物宣言と confirm は本 PR で同時に行う。
3. (serial) Actions 実測を issue #729 に記録 (AC-5)。

## 受入条件

- AC-1: `analyzeGithubCiPolicy` が実 repo の改訂 workflow で `ok=true` (CANDIDATE-U-CIPOL-028)。
- AC-2: CANDIDATE-U-CIPOL-029〜038 の全 mutation が指定 reason で fail-close する (037 = required step の評価対象、
  038 = preflight の lane producer)。
- AC-2b: CANDIDATE-U-CIPOL-039 (lane 別実行集合が §不変条件 の表と一致) が green。
- AC-3: 既存 U-CIPOL-012 / 013〜027 (付け替え分を含む) と `tests/change-lane.test.ts`、
  `tests/windows-ci-single-snapshot.test.ts` が green。
- AC-4 (Actions 負例): 軽量 check を意図的に赤にした PR run で、`preflight` = failure、4 脚 = skipped
  (起動しない)、`harness-check` = failure、かつ aggregate の失敗 step が result guard であること
  (download ではない) を run URL で記録。
- AC-5 (Actions 実測): 成功 run と軽量失敗 run の壁時計・preflight 所要を issue #729 に記録。
  目標: 軽量失敗の判明が 2 分以内。成功 run の壁時計増分は preflight 所要 (推定 30〜60s) 以内。

## 将来候補 (本 PLAN の受入外)

- `plan lint` の preflight 化 (#574 型の PLAN 簿記赤を早期化)。所要未計測のため見送り。
- Windows 脚の lane 対応強化・vitest 分割 (#581)。
