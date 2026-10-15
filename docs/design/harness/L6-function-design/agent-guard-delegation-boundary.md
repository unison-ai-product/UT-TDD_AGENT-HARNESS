---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_agent_guard_delegation_boundary
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1002
---

> **L6 contract marker**: `evaluateAgentGuard(input, ctx) => GuardDecision` と `resolveDelegationRouting(input) => DelegationRouting`、および `DELEGATION_ROLE_ALLOWLIST` / `REVIEW_GATE_ROLES` / `GENERIC_SUBAGENT_TYPES` の集合は unit-test-granularity contract である。DbC pre/post/invariant は §7 にまとめる。oracle の索引は共有の `docs/test-design/harness/L7-unit-test-design.md` (§agent-guard と委譲の境界) に置き、詳細 (CANDIDATE-U-AGBOUND-001〜) と既存 oracle の改訂表は専用の `docs/test-design/harness/L7-agent-guard-delegation-boundary-test-design.md` が固定する。

> **状態**: 本書は **未実装の目標契約** である (issue #1002)。§2 の「現状」は 2026-10-14 時点の `src/` の実測で、§3 以降の「目標」はまだ実装されていない。実装は §11 の順に別 PR で入れる。実装 PR は本書の方式を変えない (方式変更が要るなら PR を止めて本書の改訂へ戻る)。

# agent-guard と委譲の境界 — 関数設計 (issue #1002)

## 1. 目的

ハーネスは `.claude/agents/*.md` の subagent 定義 20 本を正本資産として持ち、agent-guard がその frontmatter の `model:` を floor (下限) として読んでいる。PO は 2026-10-08 に subagent 定義の撤廃を決め、2026-10-13 に即時対応を指示した。定義を撤廃すると、定義に依存する次の仕組みが同時に崩れる。

- agent-guard の許可集合 (`SUBAGENT_ALLOWLIST`) と floor。
- 委譲 role の許可集合 (`DELEGATION_ROLE_ALLOWLIST` が `SUBAGENT_ALLOWLIST` を合流させている)。
- roster の一覧・整合確認、asset-drift の agent 照合、setup template と Pack の配布資産。

本書は、定義ファイルを持たない世界での境界を定める。方式は次の 1 本に絞る (PO の方式判断 2026-10-14、advisor `claude-fable-5-1` / design の条件付き採用)。

- **Agent tool**: 汎用の型 (`general-purpose` / `Explore` / `Plan` / `claude`) と `model` 必須だけを許す。専門性は skill・判断パック・設計文書の抜粋の組み合わせで渡す。
- **closing の権限は Agent tool の subagent に無い**。closing (review verdict・merge の根拠) は `ut-tdd claude|codex --role <role>` の委譲経路と review custody だけが持つ。
- **floor の正本は 1 か所**: `src/team/delegation-routing.ts` の `REVIEW_GATE_ROLES`。agent-guard は floor を持たない。

採らない案は §12 に理由を残す。

## 2. 現状 (実測) と目標の差

| 項目 | 現状 (2026-10-14、`src/` の実測) | 目標 (本書) |
| --- | --- | --- |
| 許可の形 | `SUBAGENT_ALLOWLIST` (20 名、`agent-guard-policy.ts`) に載る型は「定義済み」、載らない型は「汎用の経路」(PR #1010 の暫定)。載らない型は何でも通る (未知の文字列を含む) | 汎用の型 4 種の**閉じた集合** `GENERIC_SUBAGENT_TYPES` だけを許す。集合外は BLOCK |
| 定義ファイルの読み取り | `ctx.resolveAgentFamily` が `.claude/agents/<type>.md` の frontmatter を読む。実装が 2 つある (`src/cli.ts` の `resolveAgentFamilyFromRepo` と `.claude/hooks/agent-guard.ts` の `resolveAgentFamily`) | 読まない。`resolveAgentFamily` と `ResolvedFamily` と 2 つの実装を削除する。`ctx` は `{ allowRaw }` だけ |
| floor | 定義済みの型は frontmatter の family 以上 (`FAMILY_RANK`) を要求し、下回れば `model downgrade detected` で BLOCK | agent-guard に floor を置かない。`FAMILY_RANK` を削除する |
| fable の規則 | 定義済みの型のうち `FABLE_QUALITY_CHECK_SUBAGENTS` (5 名) だけが fable を使える。汎用の型は fable 不可 | Agent tool では型によらず fable 不可。`FABLE_QUALITY_CHECK_SUBAGENTS` を削除する |
| 型が空 | `subagent_type` / `agent_type` / `agent` / `role` / `name` のどれも空なら汎用の経路 (model 必須) | 空は `general-purpose` として扱う (Claude Code の既定と同じ)。model 必須 |
| model 必須 | 全ての型で必須。正規化できなければ BLOCK | 変更なし |
| bypass | `UT_TDD_ALLOW_RAW_AGENT=1` で WARN + code 0 | 変更なし。適用範囲を §3.4 に明記する |
| 委譲 role の許可 | `READ_ONLY_DELEGATION_ROLES` ∪ `WORKER_DELEGATION_ROLES` ∪ `SUBAGENT_ALLOWLIST` | `READ_ONLY_DELEGATION_ROLES` ∪ 判断ゲート名 3 つ ∪ `WORKER_DELEGATION_ROLES` ∪ `CODEX_WORKSPACE_WRITE_ROLES`。`SUBAGENT_ALLOWLIST` への依存を断つ |
| 判断ゲート role の floor | `REVIEW_GATE_ROLES` (frontier reviewer tier へ固定)。許可 role は `SUBAGENT_ALLOWLIST` との合流で決まる。明示 `--model` は無条件に優先され、低位の model も通る | floor の正本として明記し、agent-guard 側の floor と二重にしない。明示 `--model` が下限未満なら `ok: false` (§5.1)。review custody の入口も同じ判定で拒否する |
| `CODEX_WORKSPACE_WRITE_ROLES` | `se` / `docs` / `be-api` / `be-logic` / `db-schema` / `devops-deploy` (Codex の sandbox 権限の role 名) | 据え置き。コメントだけ「role 名であり定義ファイルとは関係ない」へ直す |
| roster 一覧・整合 | `ut-tdd roster list/check`、`listRosterRegistry` / `checkRosterConsistency` (`src/assets/catalog.ts`) | 撤廃 |
| asset-drift の agent 照合 | `missing-allowlisted-agent` / `non-allowlisted-agent` (`src/lint/asset-drift.ts`)。doctor が `SUBAGENT_ALLOWLIST` を注入する (`src/doctor/lint-gates.ts`) | agent 照合と `allowlist` 入力を削除する |
| setup template / Pack | `CLAUDE_AGENT_TEMPLATES` が agent 定義を生成し、`docs/templates/adapter/.claude/agents/` に同じ 20 本がある | 生成も同梱も止める |
| skill-engine | `recommended_subagents` (`src/task/classify.ts`) | レーン推奨へ置き換える (§8.5) |

## 3. agent-guard の契約

対象は `src/runtime/agent-guard.ts` の `evaluateAgentGuard` と `src/runtime/agent-guard-policy.ts`。純粋関数であり、hook shim (`.claude/hooks/agent-guard.ts`) と `ut-tdd hook agent-guard` が stdin と終了 code を持つ。

### 3.1 許可集合

`GENERIC_SUBAGENT_TYPES: ReadonlySet<string>` を `agent-guard-policy.ts` に置く。要素は次の 4 つだけとする。

| 型 | 意味 |
| --- | --- |
| `general-purpose` | 汎用 (Claude Code の既定) |
| `Explore` | 読み取り専用の探索 |
| `Plan` | 読み取り専用の計画 |
| `claude` | 実環境にある catch-all |

型の比較は **完全一致** (大文字小文字を区別し、前後の空白だけを trim する)。`explore` や `General-Purpose` は集合外である。agent-guard は型の道具制限 (`Explore` / `Plan` が読み取り専用であること) を判定しない。道具制限は Claude Code の型の定義が持つ。集合に型を足すには本書の改訂が要る。

### 3.2 判定の順序

`evaluateAgentGuard(input, ctx)` は次の順で最初に当たった規則で終わる。

1. **G1**: `tool_name` が文字列でない、または空 → code 2 (`hook envelope has no tool_name`)。bypass できない。
2. **G2**: `tool_name` が `AGENT_TOOL_NAMES` (`Agent` / `Task` / `spawn_agent` / `spawn_agents_on_csv`) に無い → code 0。
3. 型の解決: `tool_input` の `subagent_type` / `agent_type` / `agent` / `role` / `name` の最初の非空文字列。全て空なら `general-purpose`。`model` は `model` / `model_family` の最初の非空文字列。
4. **G3**: 型が `GENERIC_SUBAGENT_TYPES` に無い → BLOCK。メッセージに許可集合を列挙する。
5. **G4**: `model` が空 → BLOCK。メッセージに許可 family (`haiku / sonnet / opus / fable` の正規名、ただし fable は G6 で止まる) を示す。
6. **G5**: `normalizeModelFamily(model)` が null (正規化できない、または複数 family に当たる曖昧な値) → BLOCK。
7. **G6**: 正規化した family が `fable` → BLOCK (`Agent tool では fable を使えない`)。Agent tool の subagent は手を動かす層であり、最上位 tier は判断の層 (委譲経路) に残す。
8. それ以外 → code 0。

G3〜G6 の「BLOCK」は §3.4 の bypass の対象で、G1 は対象外である。

### 3.3 floor を置かない

agent-guard は「model の下限」を判定しない。haiku の subagent を `Explore` に渡してよい。review の質は subagent の model では守らない。review の結果は委譲経路の role と review custody (exact head・非著者 family・receipt) でだけ有効になり、Agent tool の subagent の出力は verdict にも merge の根拠にもならない (§9)。floor が要る判断は `REVIEW_GATE_ROLES` (§5) にある。

### 3.4 bypass

`ctx.allowRaw` (環境変数 `UT_TDD_ALLOW_RAW_AGENT=1`) が真のとき、G3〜G6 の BLOCK は code 0 + `bypassed: true` + `WARN` メッセージに変わる。メッセージは元の BLOCK 文を含む。bypass の記録 (理由を最終報告に残す、D-06 の件数計測) は現状どおり。G1 は bypass しない。

### 3.5 削除するもの

| 削除 | 場所 |
| --- | --- |
| `FABLE_QUALITY_CHECK_SUBAGENTS`、`FAMILY_RANK` | `agent-guard.ts` |
| `ResolvedFamily`、`AgentGuardContext.resolveAgentFamily` | `agent-guard.ts` |
| `resolveAgentFamilyFromRepo` と、その呼び出し (`ut-tdd hook agent-guard` の `evaluateAgentGuard(..., { resolveAgentFamily, ... })`) | `src/cli.ts` |
| `resolveAgentFamily` と `existsSync` / `readFileSync` の import | `.claude/hooks/agent-guard.ts` |
| `SUBAGENT_ALLOWLIST` の再 export | `agent-guard.ts` (定数そのものは §11 の PR 4 まで残す) |

残すもの: `normalizeModelFamily`、`CLAUDE_MODEL_FAMILY_CATALOG` (`tests/model-id-ssot-drift.test.ts` が `MODEL_IDS.claude` との一致を照合する)、`AGENT_GUARD_BYPASS_HINT`、`AGENT_TOOL_NAMES`。

### 3.6 副作用の境界

hook shim と `ut-tdd hook agent-guard` は、code 0 かつ型が空でないときだけ `recordGuardFire` で agent-slots に発火を記録する (助言であり、記録の失敗は判定を変えない)。記録の key は型名になる (汎用の型 4 種)。並列上限 8 (`DEFAULT_MAX_PARALLEL`) は変えない。stdin の読み取り失敗・JSON 解析失敗は現状どおり code 2 (fail-close)。

## 4. 委譲 role の許可集合

対象は `src/team/delegation-routing.ts` の `DELEGATION_ROLE_ALLOWLIST`。目標の定義は次の和集合である。

```
DELEGATION_ROLE_ALLOWLIST =
    READ_ONLY_DELEGATION_ROLES        (src/runtime/review-guard.ts)
  ∪ GATE_SUBAGENT_ROLES               (ut-tdd-tl / qa-test / security-audit。名前だけを残す)
  ∪ WORKER_DELEGATION_ROLES           (se / po / pm / docs / advisor / tl-advisor)
  ∪ CODEX_WORKSPACE_WRITE_ROLES       (se / docs / be-api / be-logic / db-schema / devops-deploy)
```

- `SUBAGENT_ALLOWLIST` への import と合流を削除する。`delegation-routing.ts` は `agent-guard-policy.ts` から `CODEX_WORKSPACE_WRITE_ROLES` だけを import する。
- 外す role (12 名): `pmo-sonnet` / `pmo-haiku` / `pmo-project-explorer` / `pmo-project-scout` / `pmo-tech-docs` / `pmo-tech-fork` / `pmo-tech-news` / `pdm-tech-innovation` / `pdm-marketing-innovation` / `pdm-innovation-manager` / `refactor-scout` / `code-reviewer`。外した名前を `--role` に渡すと、`resolveDelegationRouting` は現状どおり `not a registered delegation role` で fail-close する (メッセージは許可集合の一覧を出す)。
- 残る role (旧 20 名のうち 8 名): `blind-reviewer` (`READ_ONLY_DELEGATION_ROLES` 経由)、`ut-tdd-tl` / `qa-test` / `security-audit` (`GATE_SUBAGENT_ROLES` 経由)、`be-api` / `be-logic` / `db-schema` / `devops-deploy` (`CODEX_WORKSPACE_WRITE_ROLES` 経由)。
- `code-reviewer` は `READ_ONLY_DELEGATION_ROLES` にも載っている (review-guard の literal alias)。外す決定に合わせてそこからも削除し、`code-review` を残す。`isReadOnlyDelegationRole("code-reviewer")` は false になる。`skills/` が `--role code-reviewer` / `--role pmo-*` を案内している箇所は、`reviewer` / `docs` など残る role に書き直す (§8.4)。
- `GATE_SUBAGENT_ROLES` のコメントは「subagent 名形」から「判断ゲート role の名前」へ直す。名前を残す理由は、`REVIEW_GATE_ROLES` が frontier reviewer tier へ固定する対象として、既存の運用 (`ut-tdd claude --role qa-test` など) を壊さないためである。

## 5. floor の正本

- floor (判断ゲートは worker tier へ落とさず、族内の frontier reviewer tier に固定する) を持つのは `REVIEW_GATE_ROLES` = `READ_ONLY_DELEGATION_ROLES` ∪ `GATE_SUBAGENT_ROLES` の 1 か所だけにする。明示指定が無いときの model は `resolveDelegationRouting` が `REVIEW_LANE_MODELS[lane][provider]` から引く。
### 5.1 明示 --model に対する floor (fail-close)

現状の `resolveDelegationRouting` の判断ゲート分岐は `input.model ?? REVIEW_LANE_MODELS[lane][provider]` を返すので、判断ゲート role に低位の model (例: `blind-reviewer` に `claude-sonnet-5-5`) を明示すれば、そのまま通ってしまう。floor が「既定値」でしかなく、拒否条件を持たない。本契約はこれを fail-close にする。

- **強制する関数**: `src/team/model-policy.ts` に純粋関数 `isReviewFloorModel(provider, model): boolean` を置く。判定の基準は既存の `MODEL_CAPABILITY_RANK` で、provider ごとの下限は `REVIEW_LANE_MODELS` の各 lane の model の rank とする (claude は opus (rank 3) 以上 = opus / fable、codex は frontier (rank 4) = `gpt-6.1-sol`)。rank 表に無い model は **下限未満として扱う** (未知を通さない。`advisorHeavyUseRecommended` と同じ向き)。
- **拒否の場所**: `resolveDelegationRouting` の判断ゲート分岐で、`input.model` が指定され、かつ `isReviewFloorModel(input.provider, input.model)` が false なら `ok: false` を返す。message は role・provider・指定された model・下限の model を示す。`--effort` の明示は従来どおり受け付ける (floor は model だけに課す)。下限以上の明示指定 (例: claude で `claude-fable-5-1`) は `model_source: "explicit"` で通す。
- **closing の入口でも同じ関数を使う**: review custody の attempt 記録 (`src/feedback/review-verdict-custody.ts` の、provider と model を受け取る入口) は、記録する `model` が `isReviewFloorModel(provider, model)` を満たさなければ `reviewer_model_below_floor` で拒否する。非著者 family の判定 (`same_family_reviewer_denied`) と同じ層に置き、family が正しくても低位 tier の verdict は receipt にならない。
- **Agent tool の出力は入口に届かない**: Agent tool の subagent の結果は、委譲経路 (`ut-tdd claude|codex --role`) を通らないので `resolveDelegationRouting` を呼ばず、custody の入口にも渡る経路が無い。agent-guard の返り値は `code` / `message` / `bypassed` だけで (§3)、verdict の field を持たない。

- agent-guard に floor を持ち込まない (§3.3)。floor を agent-guard に残すと定義ファイルが要る。
- `blind-reviewer` は role 名として必須である (`src/feedback/live-review-projection.ts` が `--role blind-reviewer` を渡し、`src/runtime/review-guard.ts` が read-only 契約の対象にする)。この名前は定義ファイルとは無関係に残る。

## 6. `CODEX_WORKSPACE_WRITE_ROLES` の据え置き

`src/runtime/agent-guard-policy.ts` の `CODEX_WORKSPACE_WRITE_ROLES` (`se` / `docs` / `be-api` / `be-logic` / `db-schema` / `devops-deploy`) は Codex の sandbox を `workspace-write` にする role の名前であり (Issue #676、`src/runtime/adapter.ts`)、subagent 定義ファイルとは関係が無い。集合の要素と用途を変えない。変更はコメント (「承認済み artifact worker の role 名」) と、本集合が `DELEGATION_ROLE_ALLOWLIST` の部分集合であること (§4 の和集合に含まれる) の検査だけである。

## 7. 不変条件 (DbC)

- **evaluateAgentGuard** — Pre: `input` は hook の envelope、`ctx = { allowRaw: boolean }`。ファイルシステムを読まず、環境変数を読まず、書かない。Post: 返り値は `{ code: 0 | 2, message?, bypassed? }`。`code === 0 && bypassed !== true` は「G2 で対象外」または「G3〜G6 の全てを満たした」ときだけ。Invariant: 同じ `(input, ctx)` に同じ結果を返す。判定は型の集合・model の存在・正規化・fable の 4 点だけで、定義ファイルの有無に依存しない。
- **resolveDelegationRouting** — Pre: `role` は任意の文字列 (trim + lowercase で正規化)。Post: `DELEGATION_ROLE_ALLOWLIST` に無い role は `ok: false`。`REVIEW_GATE_ROLES` の role は `model_source` が `review-lane` または `explicit` (explicit は floor 以上に限る、§5.1)。Invariant: 判断ゲート role の model は、明示指定でも `isReviewFloorModel(provider, model)` を満たす (満たさなければ `ok: false`)。許可 role の集合は agent-guard の許可集合 (`GENERIC_SUBAGENT_TYPES`) と交わらない (両者は別の層の語彙である)。`REVIEW_GATE_ROLES ⊆ DELEGATION_ROLE_ALLOWLIST`、`CODEX_WORKSPACE_WRITE_ROLES ⊆ DELEGATION_ROLE_ALLOWLIST`。
- **集合の SSoT**: agent-guard の許可型は `GENERIC_SUBAGENT_TYPES`、委譲 role の floor は `REVIEW_GATE_ROLES`、Codex の書き込み role は `CODEX_WORKSPACE_WRITE_ROLES`。同じ事実を 2 か所に書かない。`.claude/CLAUDE.md` §Subagent Guard の型の一覧は `GENERIC_SUBAGENT_TYPES` と機械照合する (§8.7)。

## 8. 周辺の扱い

### 8.1 roster の CLI と資産

`ut-tdd roster list` / `roster check` と、`listRosterRegistry` / `checkRosterConsistency` (`src/assets/catalog.ts`)、`catalog.ts` の `assetSources` の `roster` 行 (`.claude/agents`) を削除する。`resolveRosterCapability` (`src/runtime/agent-slots-roster.ts`) は、実装 PR 4 の冒頭で他の consumer が無いことを grep で確かめてから削除する。consumer が見つかった場合は削除せず、PR 本文に呼び出し元を書いて本書の改訂を求める。

### 8.2 asset-drift と doctor

`analyzeAssetDrift` から `missing-allowlisted-agent` / `non-allowlisted-agent` の 2 種と `allowlist` 入力、`loadAssetDriftInput` の `.claude/agents` 読み込みを削除する。`checkAssetDrift` (`src/doctor/lint-gates.ts`) が `SUBAGENT_ALLOWLIST` を注入する行も削除する。skill・prompt template・legacy path residue の検査は変えない。`.claude/agents/` に定義ファイルが再び置かれても doctor は失敗させない (agent-guard が読まないので無害であり、既存 consumer に残る旧ファイルを壊さないため)。

### 8.3 setup template と Pack catalog

`src/setup/templates.ts` の `CLAUDE_AGENT_TEMPLATES` / `CLAUDE_AGENT_TEMPLATE_SET` / `CLAUDE_AGENT_FILES` を削除し、setup の生成計画から `.claude/agents/*.md` を外す。`docs/templates/adapter/.claude/agents/` の 20 本を削除する。Claude / Codex の hook 設定の `statusMessage` (`agent-guard: subagent allowlist/model enforcement` など) は「汎用の型と model の検査」に直す。Pack の配布資産の集合が変わるため、実装 PR 4 の本文に次を書く: 配布 manifest の file 集合と digest が変わること、canary の consumer fixture に `.claude/agents` が無くなること、`tests/pack-consumer-runtime-release.test.ts` と `tests/distribution-acceptance.test.ts` の期待を同じ PR で直すこと。

### 8.4 skill と docs の案内

`skills/` の `--role code-reviewer` / `--role pmo-haiku` / `--role pmo-tech-docs` など、外した role を案内する記述を、残る role (`reviewer`・`docs`・`advisor` など) に直す。`src/vmodel/injection.ts` の `mandatoryAgentsFor` が返す名前 (`code-reviewer` / `pmo-sonnet` など) は定義ファイル名ではなくラベルだが、外した role と同名なので §8.5 の PR で一緒に揃える。

### 8.5 skill-engine の `recommended_subagents`

`RecommendedSubagent` (`src/task/classify.ts`) の `role` は `docs` / `se` / `qa` / `uiux` / `tl` で、定義ファイル名ではなく委譲 role の語彙である。「subagent」という語が Agent tool の subagent を連想させ、`closing_authority` / `guard` の文言も旧設計を指すため、次へ置き換える。

- フィールド名を `recommended_lanes`、型名を `RecommendedLane` に改める。payload の形 (`role` / `tier` / `model` / `purpose` / `parallelizable` / `parallel_slots` / `closing_authority` / `ownership` / `guard` / `reason`) は変えない。
- `closing_authority` は worker レーンで常に false。`guard` の文言は「レーン内の並列は agent-guard (汎用の型と model 必須)、closing は委譲経路と review custody」を指す。
- `proposal-document-coverage.ts` の分類器の型、`ut-tdd` の CLI 出力 (`src/cli.ts` の `recommended_subagents` の参照 2 か所)、`docs/test-design/harness/proposal-document-coverage-routing.md` の記述を同じ PR で揃える。

### 8.6 並列枠の記録 (agent-slots)

`src/runtime/agent-slots.ts` の fire / release 記録と並列上限 8 は変えない。記録の key が汎用の型名になるだけである。`resolveRosterCapability` の削除 (§8.1) に合わせて、その re-export を外す。

### 8.7 機械照合

`tests/model-id-ssot-drift.test.ts` の (d) は、`.claude/CLAUDE.md` §Subagent Guard の一覧と `SUBAGENT_ALLOWLIST` の集合一致を照合している。これを、同じ節の型の一覧と `GENERIC_SUBAGENT_TYPES` の集合一致の照合に書き換える。`tests/setup-agent-floor.test.ts` は (定義ファイルの floor の drift を固定するテストなので) 削除する。

### 8.8 Codex 側

`AGENT_TOOL_NAMES` が `spawn_agent` / `spawn_agents_on_csv` を含むため、同じ判定を Codex の hook 経路も共有する。Codex の agent-guard は「未だ守られていない deferred surface」という現状の整理 (`U-CXHOOK-006`) を変えない。Claude の `.claude/settings.json` と Codex の `.codex/hooks.json` が同じ entrypoint (`wrapperHookArgs("agent-guard")`) を使う原則も変えない。

## 9. ガードの 2 層

オーケストレーションの規律は、守る層を 2 つに分ける。

| 層 | 何を守るか | 機構 | 本契約での扱い |
| --- | --- | --- | --- |
| **判断する層** | closing review・advisor・merge | 委譲経路 (`ut-tdd claude|codex --role`) の role 検証と routing (`delegation-routing.ts`)、review-guard、review custody、`ut-tdd pr merge` | role の許可集合を定義ファイルから切り離し、floor の正本を `REVIEW_GATE_ROLES` に一本化する (§4〜§5) |
| **手を動かす層** | レーン内の並列、Agent tool の subagent、編集 | agent-guard (汎用の型・model 必須・fable 不可)、work-guard (foreign-edit)、post-tool-use、agent-slots (並列 8) | agent-guard を縮小する (§3)。それ以外は変えない |

- Agent tool の subagent は手を動かす層であり、closing の権限を持たない。その出力は草稿・調査・並列作業の材料であって、PR の verdict にも receipt にも使えない。
- Claude と Codex は同じ entrypoint を使う。判定本体は `src/` の純粋関数に置き、runtime ごとに別の実装を持たない (本契約は `evaluateAgentGuard` を 1 つに保つ)。
- 専門性は subagent の名前では渡さない。作業ごとに skill・判断パック・設計抜粋を組み合わせて task に渡し、モデルは作業ごとに最新のものを振り分ける (Model / Effort Routing)。
- `work-guard` の前提 (共有 tree を 2 つのランタイムが同時に書く) が GUI lane とレーンごとの worktree の標準化後も成り立つかは、本契約では判定しない。`work-guard` / `post-tool-use` / `subagent-stop` / `session start・summary` / `claude-memory-wake` は本契約で変更しない。再検討は別 issue に切り出し、計測を先にする。プロバイダーの標準メモリへの書き込みを止める hook と Bash ガードは #998 が正本で、本契約は「判断する層 / 手を動かす層の分類」と「同じ entrypoint を使う原則」だけを提供する。

## 10. 規律の書き直しの範囲 (本契約 PR では書かない)

規律の文書の書き直しは実装 PR 2 と同時に入れる。本節は、書き直す節と新しい要旨だけを固定する。

- **`.claude/CLAUDE.md` §委譲と判断層 の「あなたが○○なら」の表**: 「Opus の subagent」「Sonnet」「Haiku」への委譲を前提にした欄を、「判断する層 = 委譲経路 (`ut-tdd claude|codex --role`) と advisor、手を動かす層 = Agent tool の汎用の型の subagent (草稿・調査・並列)」へ直す。迷った判断は 1 段上のモデルへ相談する原則は残す。Agent tool の subagent は closing の権限を持たない、と明記する。
- **`.claude/CLAUDE.md` §Subagent Guard**: ルール 1〜5 を §3.2 の G1〜G6 と bypass に合わせる (許可は汎用の型 4 種、model 必須、floor は無い、fable は不可)。Allowlist の一覧を 20 名から 4 種に直す。`blind-reviewer` の段落は「判断ゲート role の名前」として §委譲と判断層 へ移し、「Agent tool の subagent ではない」と書く。
- **`.claude/CLAUDE.md` §Parallel Task Limit**: 文言を「レーン内の並列 (Agent tool の subagent)」に揃える。上限 8 と fail-open の助言は変えない。
- **`.claude/CLAUDE.md` §Hooks**: `PreToolUse(Agent|Task)` の行は変えない (`.claude/settings.json` との機械照合 `U-RDRIFT-007` を壊さない)。
- **`CLAUDE.md` §Model / Effort Routing**: 「並列の軽量レーンは Luna の subagent と Claude Haiku が担い」の記述を、判断する層 / 手を動かす層の分け方に揃える。
- **`CLAUDE.md` §runtime 間のやりとりは GUI lane**: 「レーンの中の並列 (Luna の subagent、Claude の Agent tool) は別の話」の記述に、Agent tool の subagent は手を動かす層で closing の権限を持たないことを足す。
- **`AGENTS.md` §Codex / Claude Code Harness**: 指揮モデル別の表と Luna の subagent の扱いを同じ 2 層で書き直す。
- **共通ルールの置き場所**: 2 層の定義と「closing の権限は Agent tool の subagent に無い」は共通ルールなので `CLAUDE.md` にだけ書き、アダプタ (`.claude/CLAUDE.md`・`AGENTS.md`) はランタイム固有の手順だけを持つ (Rule Placement Convention)。
- **rule-drift の marker 節は壊さない**: 各ファイルの「UT-TDD Adapter Rule Markers」節と、`PLAN Filing Rules` の `route_signal` / `generates` の記述、§Hooks の一覧は書き換えの対象外にする。書き直しの PR は `ut-tdd doctor` の `rule-drift` を通す。

## 11. 実装 PR の順番

順序契約: 依存する正本が閉じる前に下流を着工しない。1 PR = 1 論点。各 PR は Red (`it.fails`) を先に入れる。

0. **契約 PR (本 PR)**: L4 function.md C12 の差し替え、本書、test-design (候補 oracle `CANDIDATE-U-AGBOUND-*` と既存 oracle の改訂表)。PLAN の起票は工程②の最後に一括で行う (本 PR では起票しない)。
1. **登録 + Red (src/ は登録行だけ)**: Red のテスト (`it.fails`) を入れ、テスト名は候補 ID (`CANDIDATE-U-AGBOUND-*`) で引用する。開発 repo の source text を読むテストファイル (013・024・026・027 など) には、同じ PR に `src/doctor/test-repository-isolation.ts` の `repositoryReadContracts` の登録行だけを足す。design / test-design は変えない。順序の根拠は `design-protection-diff-gate.md` §10.3 である。
   - 1b. **昇格 (src/ を含まない)**: 既存 oracle の改訂表 (test-design §4) の適用、候補 ID から正式 ID `U-AGBOUND-*` への昇格 (全件)、テスト名の引用を候補 ID から正式 ID へ書き換える変更を、同じ PR で入れる。src/ も scripts/ も含まないので非実装 PR であり、test-design を変えてよい。昇格を Red より先に入れると、未引用の正式 ID を `oracle-test-trace` が拒否する。
2. **agent-guard の縮小**: §3 を実装する (`agent-guard.ts`、`agent-guard-policy.ts` の `GENERIC_SUBAGENT_TYPES`、`src/cli.ts`、`.claude/hooks/agent-guard.ts`、`tests/agent-guard.test.ts`)。`SUBAGENT_ALLOWLIST` は他の consumer のためにこの PR では残す。§10 の規律の書き直しを同じ PR で入れる。
3. **委譲 role の許可集合を allowlist から切り離す**: §4〜§6 を実装する (`delegation-routing.ts`、`review-guard.ts` の `code-reviewer` 削除、`skills/` の role 案内)。
4. **定義ファイルの削除と周辺**: §8.1〜§8.3、§8.6〜§8.7 を実装する。`.claude/agents/` 20 本、`docs/templates/adapter/.claude/agents/`、roster CLI、asset-drift の agent 照合、setup template、Pack catalog、distribution テストを同時に外し、`SUBAGENT_ALLOWLIST` を削除する。Pack の配布に触れるので、canary への影響を PR 本文に書く (§8.3)。
5. **skill-engine の置き換え**: §8.5 と §8.4 の `injection.ts` を実装する。

PR 2 と PR 3 の間、および PR 3 と PR 4 の間の中間状態では、`.claude/agents/` の定義ファイルは存在するが agent-guard も委譲経路も読まない (無害)。順序を入れ替えると、定義ファイルが消えた状態で guard が読みに行く期間ができるので入れ替えない。

## 12. 採らない案と根拠

- **案 B (Agent 呼び出しに floor を残す)**: floor の出どころとして定義ファイルが要り、定義ファイルの撤廃という PO 決定と矛盾する。
- **案 C (判断ゲートの 4 本だけ定義を残す)**: 4 本のために roster・asset-drift・setup template・Pack catalog の仕組みが全て残る。
- **開いた汎用経路のまま (現状の PR #1010 の暫定)**: 未知の型が何でも通り、「手を動かす層の許可」が集合として固定されない。閉じた集合にして初めて `.claude/CLAUDE.md` の一覧と機械照合できる。

## 13. 根拠

- issue #1002、PO 決定 2026-10-08 (撤廃)・2026-10-13 (即時対応・オーケストレーション方式とガード全体の見直し)。
- 方式判断 2026-10-14 (advisor `claude-fable-5-1` / design。案 A を条件付きで採用、棚卸しの訂正 8 件)。
- 棚卸しの訂正: `ut-tdd roster`・asset-drift・doctor の lint gate・setup template・skill-engine・fable の規則・`blind-reviewer` の role 名・凍結 oracle `U-DELEG-007` が定義ファイルまたは定義名に依存している。
- L1 の BR-22 / FR-L1-46 / FR-L1-49 などの要件の改訂案は test-design の改訂表に置く。要件文書そのものの書き換えは L1 の別の手順で行い、本契約 PR では行わない。
