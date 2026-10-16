---
title: "L7 agent-guard delegation boundary test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-16
pair_artifact: docs/design/harness/L6-function-design/agent-guard-delegation-boundary.md
---

# agent-guard と委譲の境界 テスト設計 (issue #1002)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/agent-guard-delegation-boundary.md` である (**未実装の目標契約**)。
本書はその §3 agent-guard の契約、§4 委譲 role の許可集合、§5 floor の正本、§6 `CODEX_WORKSPACE_WRITE_ROLES`、§7 不変条件、§8 周辺の扱いを検証する oracle と、定義ファイルの撤廃で影響を受ける既存 oracle の改訂表を定める。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引 (§agent-guard と委譲の境界) だけを置き、本書が詳細の正本である。

Red PR #1066 では 36 件を候補 ID で引用した。本昇格段階では全件を正式 ID (`U-AGBOUND-*`) とし、§4 の改訂表を適用する。工程は設計保護 gate の L6 `design-protection-diff-gate.md` §10.3 の三段階に揃える。013・024・026・027 は開発 repo の source text を読むので、`test-repository-isolation` の登録行が要り、次の順になる。

1. **登録 + Red (src/ は登録行だけ)**: Red のテスト (`it.fails`) を候補 ID で引用して入れる。開発 repo を読むテストファイルには、同じ PR に `src/doctor/test-repository-isolation.ts` の `repositoryReadContracts` の登録行だけを足す。design / test-design は変えない。
2. **昇格 (本段階、src/ を含まない)**: §4 の改訂表を適用し、候補を正式 ID `U-AGBOUND-*` へ全件昇格して、テスト名の引用を書き換える。昇格を Red より先に入れると、未引用の正式 ID を `oracle-test-trace` が拒否する。
3. **実装 PR (L6 §11 の PR 2〜5)**: `it.fails` を `it` に戻して Green にする。実装 PR は `docs/test-design/` を変えない。

## 2. fixture

- 001〜014 は `evaluateAgentGuard` と集合の定数を直接呼ぶ純粋関数のテストで、ファイルシステムも環境変数も使わない。入力は `{ tool_name, tool_input }` の envelope と `{ allowRaw }`。
- 013・024・026・027 の「無いこと」の検査は、`src/` と `.claude/hooks/` の source text を読む静的検査で、開発 repo を読むテストとして `test-repository-isolation` の登録行が要る。登録行は段階 1 (Red と同じ PR、src/ は登録行だけ) で入れる (§1)。
- 016・017 は temp directory に最小の repo (定義ファイルの directory が無い) を作り、hook shim を子プロセスで起動する。
- 018〜024 は `resolveDelegationRouting` と集合を直接呼ぶ。集合の等価は、Set 同士の対称差が空であることで判定する。
- 034〜036 は `isReviewFloorModel`・`resolveDelegationRouting`・custody の attempt 記録の入口 (`beginReviewAttempt`) と、036 (e) では verdict 受理の入口 (`projectReviewVerdict`) を直接呼ぶ。custody は temp directory に最小の repo を作る。
- 各行は L6 の規則を 1 本だけ殺すように作る。負例 (通ってはならない入力) を各規則に最低 1 つ含める。

## 3. Formal oracle matrix

| ID | L6 | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- | --- |
| `U-AGBOUND-001` | G1 | (a) `tool_name` が無い envelope `{}`、(b) `tool_name: ""`、(c) 同じ入力に `allowRaw: true` | 3 件とも code 2。(c) も bypass されず `bypassed` は未設定 | envelope の検証を省く / G1 を bypass 対象にする |
| `U-AGBOUND-002` | G2 | `tool_name` が `Bash` / `Edit` / `Read` の envelope (`tool_input` に `subagent_type: "foo"` を入れても) | 3 件とも code 0、message なし | Agent 系以外の tool を検査する |
| `U-AGBOUND-003` | G2 / §3.1 | `tool_name` を `Agent` / `Task` / `spawn_agent` / `spawn_agents_on_csv` に変え、型 `general-purpose`・`Explore`・`Plan`・`claude` と `model: "sonnet"` を組み合わせた 16 通り | 16 件とも code 0、`bypassed` 未設定 | 許可する型を一部しか許さない / tool_name ごとに規則を分ける |
| `U-AGBOUND-004` | §3.2 型の解決 | (a) 型の field が全て空で `model: "sonnet"`、(b) `subagent_type` が空で `role: "Plan"`・`model: "sonnet"`、(c) `subagent_type: "Explore"` と `role: "be-api"` の併記、(d) 型が空で model も空 | (a) code 0 (`general-purpose` 扱い)、(b) code 0、(c) code 0 (最初の非空 field が優先)、(d) G4 で code 2 | 型が空を拒否する / field の優先順位を変える / 空を許可して model 検査を省く |
| `U-AGBOUND-005` | G3 | 旧 allowlist の 20 名 (`be-api` / `be-logic` / `db-schema` / `devops-deploy` / `pmo-sonnet` / `pmo-haiku` / `pmo-project-explorer` / `pmo-project-scout` / `pmo-tech-docs` / `pmo-tech-fork` / `pmo-tech-news` / `refactor-scout` / `pdm-tech-innovation` / `pdm-marketing-innovation` / `pdm-innovation-manager` / `code-reviewer` / `blind-reviewer` / `security-audit` / `qa-test` / `ut-tdd-tl`) を、それぞれ `model: "sonnet"` で渡す | 20 件とも code 2。message が許可集合 (汎用の型 4 種) を列挙する | 旧 allowlist の型を通す / 定義が無いだけで未知の型を許す |
| `U-AGBOUND-006` | G3 / §3.1 | (a) `explore` (小文字)、(b) `General-Purpose`、(c) `foo`、(d) 前後に空白のある ` Plan `、(e) 実環境にあるが許可集合に無い `claude-code-guide` と `statusline-setup` | (a)(b)(c)(e) は code 2、(d) は trim されて code 0 | 大文字小文字を畳む / 未知の型を通す / trim しない / 実環境の型を暗黙に許す |
| `U-AGBOUND-007` | G4 | 4 つの汎用の型のそれぞれで `model` / `model_family` を持たない | 4 件とも code 2、message に `missing model` を含む | model 必須を型ごとに緩める |
| `U-AGBOUND-008` | G5 | `model` が (a) `gpt-6.1-sol`、(b) `sonnet opus` (複数 family に当たる曖昧な値)、(c) `unknown-model`、(d) `claude-sonnet-5-5` (正規 ID) | (a)(b)(c) は code 2 (正規化不能)、(d) は code 0 | 曖昧な値を通す / 正規 ID を拒否する |
| `U-AGBOUND-009` | G6 | 4 つの汎用の型のそれぞれで `model` が `fable` と `claude-fable-5-1` | 8 件とも code 2、message が Agent tool では fable を使えないと示す。旧 quality-check の名前 (`blind-reviewer` など) は G3 で止まり、fable を理由にする経路が残らない | fable を一部の型に許す (旧 `FABLE_QUALITY_CHECK_SUBAGENTS` の復活) |
| `U-AGBOUND-010` | §3.3 | 4 つの汎用の型のそれぞれで `model` が `haiku` / `sonnet` / `opus` | 12 件とも code 0 | 型ごとに model の下限を課す (floor の復活) / 順位比較 (`FAMILY_RANK`) を残す |
| `U-AGBOUND-011` | §3.2 の順序 | (a) 未知の型 `foo` で model 無し、(b) 汎用の型で `model: "fable"`、(c) 未知の型 `foo` で `model: "fable"` | (a) は G3 の message (型の集合外)、(b) は G6、(c) は G3 の message。判定の根拠が 1 つに決まる | 検査の順序が入力ごとに変わる |
| `U-AGBOUND-012` | §3.4 | `allowRaw: true` で (a) 未知の型、(b) model 無し、(c) 正規化不能、(d) fable | 4 件とも code 0、`bypassed: true`、message は `WARN` で始まり元の BLOCK 文を含む。(e) 汎用の型 + `sonnet` + `allowRaw: true` は `bypassed` を立てない | bypass を G3〜G6 の一部に効かせない / 通常の通過に bypass の印を付ける |
| `U-AGBOUND-013` | §3.5 | `src/runtime/agent-guard.ts` と `.claude/hooks/agent-guard.ts` と `src/cli.ts` の source text を読む。`evaluateAgentGuard` の ctx の型は `allowRaw` だけを持つ | 次の識別子が 0 件: `resolveAgentFamily` / `resolveAgentFamilyFromRepo` / `ResolvedFamily` / `FAMILY_RANK` / `FABLE_QUALITY_CHECK_SUBAGENTS`。`agent-guard.ts` が `node:fs` を import しない | 定義ファイルを読む経路や floor の残骸を残す |
| `U-AGBOUND-014` | §3.1 | `GENERIC_SUBAGENT_TYPES` の要素 | ちょうど `general-purpose` / `Explore` / `Plan` / `claude` の 4 つ (集合の等価) | 型を黙って足す / 減らす |
| `U-AGBOUND-015` | §7 / §8.7 | `.claude/CLAUDE.md` §Subagent Guard の型の一覧を実 repo から読む。一覧の項目を 1 つ足した版・1 つ減らした版の fixture も作る | 実 repo の一覧と `GENERIC_SUBAGENT_TYPES` が一致する。fixture の 2 版は不一致として失敗する | 機械照合を外す / 旧 `SUBAGENT_ALLOWLIST` を照合し続ける |
| `U-AGBOUND-016` | §3.6 | temp repo に `.claude/agents/` を作らず hook shim を起動し、stdin に (a) 汎用の型 + `sonnet`、(b) 旧 allowlist の型 `pmo-sonnet` + `sonnet`、(c) 壊れた JSON、(d) 空 stdin | (a) exit 0、(b) exit 2、(c)(d) exit 2 (fail-close) | 定義ファイルの有無で判定が変わる / 解析失敗を通す |
| `U-AGBOUND-017` | §3.6 | 016 の (a) の呼び出しと、型が空の呼び出しで、発火記録 (`recordGuardFire`) を失敗させる注入 | 発火記録は code 0 かつ型が空でないときだけ呼ばれる。記録が例外を投げても exit code は 0 のまま | 記録の失敗で判定を変える / BLOCK のときに記録する |
| `U-AGBOUND-018` | §4 | `DELEGATION_ROLE_ALLOWLIST` | `READ_ONLY_DELEGATION_ROLES` ∪ `ut-tdd-tl` / `qa-test` / `security-audit` ∪ `se` / `po` / `pm` / `docs` / `advisor` / `tl-advisor` ∪ `CODEX_WORKSPACE_WRITE_ROLES` と集合として等しい | `SUBAGENT_ALLOWLIST` の合流を残す / 和集合の一部を落とす |
| `U-AGBOUND-019` | §4 | `resolveDelegationRouting` に外す 12 名 (`pmo-sonnet` / `pmo-haiku` / `pmo-project-explorer` / `pmo-project-scout` / `pmo-tech-docs` / `pmo-tech-fork` / `pmo-tech-news` / `pdm-tech-innovation` / `pdm-marketing-innovation` / `pdm-innovation-manager` / `refactor-scout` / `code-reviewer`) と残る 8 名 (`blind-reviewer` / `ut-tdd-tl` / `qa-test` / `security-audit` / `be-api` / `be-logic` / `db-schema` / `devops-deploy`) を渡す | 12 名は `ok: false` で message に許可 role の一覧を含む。8 名は `ok: true` | 外す role を残す / 残す role を巻き添えで外す |
| `U-AGBOUND-020` | §5 | 判断ゲート role (`blind-reviewer` / `reviewer` / `ut-tdd-tl` / `qa-test` / `security-audit`) を claude / codex の両 provider で解決。対照に worker role (`se` / `be-api`) | 判断ゲートは `model_source` が `review-lane` で族内 frontier reviewer tier、`review_lane` あり。worker は `review-lane` にならず `policy` | 名前を残した判断ゲート role が worker tier へ落ちる |
| `U-AGBOUND-021` | §5 / §7 | 集合の関係を検査する | `REVIEW_GATE_ROLES` = `READ_ONLY_DELEGATION_ROLES` ∪ 判断ゲート名 3 つ (余分な要素なし)。`REVIEW_GATE_ROLES` と `CODEX_WORKSPACE_WRITE_ROLES` はどちらも `DELEGATION_ROLE_ALLOWLIST` の部分集合。正規化した `DELEGATION_ROLE_ALLOWLIST` と `GENERIC_SUBAGENT_TYPES` の共通部分は空 | 判断ゲートを許可集合の外へ出す / 2 つの層の語彙が混ざる |
| `U-AGBOUND-022` | §4 | `isReadOnlyDelegationRole` に `code-reviewer` / `code-review` / `blind-reviewer` / `reviewer` を渡す | `code-reviewer` は false、残り 3 つは true | 外した role を read-only 契約の対象に残す / `code-review` まで外す |
| `U-AGBOUND-023` | §6 | `CODEX_WORKSPACE_WRITE_ROLES` の要素と、codex provider の `buildAdapterPlan` の argv。role は `be-api` / `se` / `qa-test` / `pmo-sonnet` | 集合は `se` / `docs` / `be-api` / `be-logic` / `db-schema` / `devops-deploy` の 6 つ。`be-api` と `se` の argv は `--sandbox workspace-write` を含み、`qa-test` は含まない。`pmo-sonnet` は routing の段階で拒否される | sandbox 権限の role を定義ファイルの有無で決める / 判断ゲートに書き込み権限を与える |
| `U-AGBOUND-024` | §4 / §5 | `src/team/delegation-routing.ts` と `src/runtime/agent-guard.ts` の source text を読む | `delegation-routing.ts` に `SUBAGENT_ALLOWLIST` が現れない。`REVIEW_GATE_ROLES` の定義は `delegation-routing.ts` の 1 か所だけで、`agent-guard.ts` に model の順位比較が現れない | floor を 2 か所に持つ / allowlist への依存が残る |
| `U-AGBOUND-025` | §8.2 | `analyzeAssetDrift` に (a) `allowlist` 入力を持たない fixture、(b) `.claude/agents/foo.md` が残る fixture、(c) skills に個人 legacy path residue がある fixture | (a) は `missing-allowlisted-agent` / `non-allowlisted-agent` を出さない。(b) は違反 0 (inert)。(c) は `legacy-source-path-residue` で `ok=false` のまま | agent 照合を残す / 定義ファイルの存在を新たな違反にする / 残すべき skills の検査まで外す |
| `U-AGBOUND-026` | §8.1 | `ut-tdd roster list` と `ut-tdd roster check` を起動し、`src/assets/catalog.ts` の export を読む | 2 つのコマンドは unknown command で non-zero。`listRosterRegistry` / `checkRosterConsistency` が export に無く、`assetSources` に `.claude/agents` の行が無い | CLI だけ消して registry が残る |
| `U-AGBOUND-027` | §8.3 | `planSetup` の `0-A` 生成計画、setup の template set、`docs/templates/adapter/` の directory、生成される `.claude/settings.json` と `.codex/hooks.json` の `agent-guard` の `statusMessage` | 生成計画に `.claude/agents/` 配下の path が無く、template set に `adapter/.claude/agents/` の key が無く、`docs/templates/adapter/.claude/agents/` が存在しない。`statusMessage` が `allowlist` を含まない | 配布する資産に定義が残る / 古い文言が残る |
| `U-AGBOUND-028` | §8.3 | Pack 配布物の file 集合 (distribution の manifest) と、開発 repo の `.claude/agents/` | manifest に `.claude/agents/` 配下の file が 0 件。開発 repo にも `.claude/agents/*.md` が 0 件 | Pack だけ、または repo だけに定義が残る |
| `U-AGBOUND-029` | §8.5 | `ut-tdd task classify` / 分類の coverage の出力 (JSON) | `recommended_lanes` があり `recommended_subagents` が無い。各レーンの `role` は `DELEGATION_ROLE_ALLOWLIST` の要素で、worker レーンの `closing_authority` は false | フィールド名だけ残す / レーンの role が許可集合の外に出る |
| `U-AGBOUND-030` | §8.4 | `skills/` 配下の markdown を走査し、`--role <名前>` の名前を抽出する | 抽出した名前は全て `DELEGATION_ROLE_ALLOWLIST` の要素。外した 12 名が `--role` の引数に現れない | skill が撤廃済みの role を案内し続ける |
| `U-AGBOUND-031` | §3.5 / §8.2 | 実 repo の `src/` 全体で `SUBAGENT_ALLOWLIST` を検索し、`checkAssetDrift` を実 repo に対して実行する | 実装 PR 4 の後は `SUBAGENT_ALLOWLIST` が 0 件で、`checkAssetDrift` は `ok=true` | 参照が残ったまま定数だけ消す / 実 repo で drift を出す |
| `U-AGBOUND-032` | §3 / §9 | `evaluateAgentGuard` の返り値のキー集合を、通過・BLOCK・bypass の全ての分岐で集める | キーは `code` / `message` / `bypassed` の部分集合だけ。verdict・receipt・review の field を持たない (Agent tool の subagent は closing の権限を持たない) | guard の結果に closing の意味を持たせる |
| `U-AGBOUND-033` | §10 | 規律の書き直し後の実 repo に対して、`rule-drift` と `.claude/CLAUDE.md` §Hooks の一覧 ↔ `.claude/settings.json` の機械照合 (`U-RDRIFT-007`) を実行する | どちらも通る。三アダプタの marker 節が残る | 規律の書き直しで marker 節や hook 一覧を壊す |
| `U-AGBOUND-034` | §5.1 | `isReviewFloorModel` に provider と model の組を渡す: claude の `claude-haiku-5-5` / `claude-sonnet-5-5` / `claude-opus-5-5` / `claude-fable-5-1`、codex の `gpt-6-luna` / `gpt-6.1-sol`、未知の `unknown-model`、空文字 | claude は haiku・sonnet が false、opus・fable が true。codex は luna が false、sol が true。未知と空は false (未知を通さない) | 下限を既定値だけにする / 未知の model を通す / rank 比較の向きを誤る |
| `U-AGBOUND-035` | §5.1 | `resolveDelegationRouting` に判断ゲート role (`blind-reviewer` / `reviewer` / `ut-tdd-tl` / `qa-test` / `security-audit`) を渡す。(a) claude + 明示 `claude-sonnet-5-5`、(b) claude + 明示 `claude-haiku-5-5`、(c) codex + 明示 `gpt-6-luna`、(d) claude + 明示 `claude-opus-5-5`、(e) claude + 明示 `claude-fable-5-1`、(f) codex + 明示 `gpt-6.1-sol`、(g) claude + 明示 `claude-sonnet-5-5` と明示 effort。対照に worker role `se` + 明示 `claude-sonnet-5-5` | (a)(b)(c)(g) は 5 role すべてで `ok: false`、message に role・provider・指定 model・下限を含む。(d)(e)(f) は `ok: true` で `model_source` は `explicit`。worker role の `se` は従来どおり `ok: true` | 明示指定を無条件に優先する / effort の明示で floor を迂回する / worker role まで巻き添えで拒否する |
| `U-AGBOUND-036` | §5.1 | review custody の attempt 記録の入口 (`beginReviewAttempt`、`src/feedback/review-verdict-custody.ts`) に、(a) 非著者 family + frontier tier の model、(b) 非著者 family + 低位 tier の model (author=codex なら claude + `claude-sonnet-5-5`、author=claude なら codex + `gpt-6-luna`)、(c) 著者と同じ family + frontier tier、(d) model が空を渡す。さらに (e) verdict 受理の入口 (`projectReviewVerdict`、`src/feedback/review-attestation.ts`。verdict file を receipt に変える経路) に agent-guard の返り値を渡す試み。temp の最小 repo で strict custody の request と begun attempt を作り、その attempt の `verdict.txt` の本文に agent-guard の返り値 (`{"code":…, "message":…, "bypassed":…}` を JSON 化したもの。verdict envelope を持たない guard 判定の形) を書き、`projectReviewVerdict` を呼ぶ | (a) は受理。(b) は `reviewer_model_below_floor`。(c) は `same_family_reviewer_denied`。(d) は `invalid_attempt_outcome`。(e) は実行時に `verdict_identity_mismatch` で拒否される (envelope 検査 `parseReviewVerdictEnvelope` が schema_version / request_digest / attempt / pr / exact_head / review_revision / reviewer_provider / reviewer_model / invocation_nonce を要求するため。コンパイル時の型検査は要求しない)。いずれも receipt を作らない | family だけ検査して tier を見ない / Agent tool 側の出力を closing に昇格する / verdict 本文の envelope 検査を外し、本文中の任意の JSON を verdict として受理する (これは (e) が捕まえる) |

## 4. 既存 oracle の改訂表

PO 決定 (2026-10-08 撤廃、2026-10-13 即時対応) と L6 の方式を根拠にする。L1 の要件 (BR-22 / FR-L1-46 / FR-L1-49 など) は、本表に**改訂案**を置くだけで、要件文書そのものは本 PR では書き換えない。表の「新しい文面」の適用は、§1 の段階 2 (昇格、src/ を含まない) で、L7〜L14 の文書は同じ PR、L1・L3 の要件文書は L1 の別の手順で行う。文書の場所は実 repo を grep した結果である。

「削除」は oracle の行を外す。「言い換え」は新しい文面に差し替える。「据え置き」は理由を付けて行を変えない。

### 4.1 L1 要件・L4 基本設計

| ID | 文書 | 扱い | 新しい文面 / 理由 |
| --- | --- | --- | --- |
| BR-22 | L1 business-requirements | 言い換え | 「**自前 runtime 内部資産体系を持つ** — UT-TDD は自身が使う/対象に提供する **skill pack / command** を UT-TDD 用の正本資産として持ち、source-derived 資産を UT-TDD 用に再構築する。agent 委譲は subagent 定義ファイルを資産に持たず、汎用の型と model 必須だけを Agent tool に許し、専門性は skill・判断パック・設計抜粋の組み合わせで渡す。guard (呼出統制) だけでなく資産そのものを統制対象とする」 |
| BR-08 | L1 business-requirements | 言い換え | doc 品質専用の read-only reviewer の説明から「pmo-sonnet とは責務分離」の句を外す (pmo-sonnet の定義が無くなるため。責務分離の意味は「判断ゲート role として委譲経路で召喚する」に残る)。必須召喚の要求自体は変えない |
| FR-L1-45 | L1 functional-requirements | 据え置き | 行は doc-reviewer の必須召喚を述べ、roster にも subagent 定義にも依存しない。pmo-sonnet の言及は L3 functional-requirements の行と nfr.md の BR-08 注記 (§4.7 に記載) |
| FR-L1-46 | L1 functional-requirements | 言い換え | 「**agent 委譲の UT-TDD 化** (汎用の型 + model 必須の guard / 委譲 role の許可集合 / 判断ゲート floor の正本の一本化 / legacy source 前提除去)」。入力は「委譲 role の集合」、出力は「UT-TDD 正本の委譲 role 表 (legacy source 前提残存 0)」。subagent roster と capability class 化は外す |
| FR-L1-49 | L1 functional-requirements | 言い換え | 「内部資産 drift lint (legacy absolute path 残存 / docs-skills 空の機械検証)」。「roster↔guard 整合」を外す。入力の「roster」「guard allowlist」も外す |
| NFR-13 | L1 nfr | 据え置き | `.claude/hooks/agent-guard.ts` は PreToolUse の hook として残る。dev-local と CI の二重実行の要求は、guard の許可集合の内容に依存しない |
| D-06 | L1 business-requirements | 据え置き | `UT_TDD_ALLOW_RAW_AGENT=1` の bypass 件数の計測は、bypass が G3〜G6 に効く新契約でも変わらない (U-AGBOUND-012) |
| C12 | L4 function.md | 言い換え | 本 PR で適用済み (内部資産 roster の building block を外し、Agent tool の許可・委譲 role の許可集合と floor の正本・専門性の受け渡しへ差し替え)。C12 の「L7 完遂時点の実装証跡」(`resolveRosterCapability` など) は完遂時点の**履歴**であり、撤廃の目標ではない。履歴であることは L4 function.md の該当注記に明示した |

### 4.2 L7 単体テスト設計 (`L7-unit-test-design.md`)

| ID | 扱い | 新しい文面 / 理由 |
| --- | --- | --- |
| 既存 U-DELEG-002 | 言い換え | 「判断ゲート role (blind-reviewer / reviewer / ut-tdd-tl / qa-test / security-audit 等) を族内 frontier reviewer tier (sol/opus) + ladder base effort へ固定する」。`code-reviewer` を例から外す。固定の事実は変わらない |
| 既存 U-DELEG-007 | 言い換え | 「`DELEGATION_ROLE_ALLOWLIST` は実 repo の役割語彙 (qa / blind-reviewer / tl / tl-advisor / se / reviewer / ut-tdd-tl / qa-test / security-audit / be-api 等) を許容し、撤廃した `pmo-*` / `pdm-*` / `refactor-scout` / `code-reviewer` は許容しない」。凍結された旧文面の `code-reviewer` / `pmo-*` を許容する要求を取り消す (U-AGBOUND-018 / 019) |
| 既存 U-ASSETDRIFT-001 | 言い換え | 「enrolled `docs/skills` / prompt template の asset に個人 legacy source workspace path があれば `legacy-source-path-residue` + `ok=false`」。`.claude/agents` を enrolled root から外す |
| 既存 U-ASSETDRIFT-004 | 削除 | guard allowlist と定義ファイルの照合は無くなる。置き換えは U-AGBOUND-025 |
| 既存 U-ASSETDRIFT-006 | 言い換え (一覧に無い行、読んで追加) | 末尾の「missing allowlisted agent 0」を外す |
| 既存 U-MDRIFT-004 | 据え置き | 「設計が web/roster/skills を余分列挙しても drift でない」の `roster` は module 名の例で、agent 定義の roster 資産とは無関係 |
| 既存 U-SETUP-009 | 言い換え | `0-A` の生成計画の adapter テンプレ一覧から `.claude/agents/ut-tdd-tl.md` を外し、「`.claude/agents/` 配下の path を含まない」を足す (U-AGBOUND-027) |
| 既存 U-SETUP-009a | 言い換え (行全体は消さず、残す部分を明示する) | **外す部分**: 配布 subagent template が `model:` frontmatter を持つこと、代表 3 family (`pmo-sonnet`=sonnet / `pmo-haiku`=haiku / `pdm-tech-innovation`=opus) の確認、およびその model ID の `MODEL_IDS.claude` catalog 検査 (配布する subagent template が無くなるため、U-AGBOUND-027 / 028 の「生成・同梱しない」が置き換える)。**残す部分**: consumer 向け adapter docs / commands が `ut-tdd doctor --profile consumer-setup-smoke` を既定の health check とし、full `ut-tdd doctor` は source / governance repository 用と明示すること。新しい文面は「consumer-facing adapter docs/commands は `ut-tdd doctor --profile consumer-setup-smoke` を既定 health check とし、full `ut-tdd doctor` は source/governance repository 用として明示する。配布 adapter に subagent template は含まない」 |
| 既存 U-SETUP-011 | 言い換え | 「adapter templates には Claude/Codex hook・command 設定を含む (subagent 設定は含まない、U-AGBOUND-027 / 028)」。`buildCleanDistributionPlan` の他の要求 (channel、LICENSE / package / src を含む、dogfood と開発用状態と UI を含まない、release integrity artifact) は変えない |
| 既存 U-MODELID-SSOT | 言い換え | 検査の対象から `.claude/agents` の frontmatter model を外し、`docs/templates/adapter` と `BUILTIN_GITHUB_TEMPLATES` の model が `MODEL_IDS.claude` catalog 内だけであること、旧 suffix が再混入しないことを残す。`.claude/agents` が無いこと自体は U-AGBOUND-028 が持つ |
| 既存 U-SETUP-014 | 据え置き | 検査は adapter hook の配線 (`agent-guard` / `work-guard` など) の有無と JSON の解釈で、許可する型の一覧にも定義ファイルにも触れない |
| 既存 U-FSF-006 | 言い換え | 「`emitClassifyRequest` は、撤廃した `pmo-haiku` ではなく残る worker role (`docs`) を `role` に持つ分類リクエスト契約 (`role` / `text` / `output_schema.category` / `output_schema.attention`) を含む」。`pmo-haiku` を許可しないので、`src/cli/feedback.ts` 側の role も同じ PR で `docs` に直す (L6 §11 の PR 3) |
| 既存 U-CXHOOK-006 | 据え置き | 「共有 guard は runtime 非依存で、model 無しの subagent 呼び出しは block する」は新契約でも真 (G4)。Codex の agent-guard が deferred surface であるという整理も変えない |
| 既存 U-RCDEV-003 | 据え置き | `hook agent-guard` が `requireRuntimeRepoRoot` を通る経路の検査で、guard の判定内容に触れない |

### 4.3 L8 結合テスト設計 (`L8-integration-test-design.md`、各 ID は 2 つの表に載る)

| ID | 扱い | 新しい文面 / 理由 |
| --- | --- | --- |
| 既存 IT-ASSET-01 | 削除 | `roster list` の scan→registry が無くなる (U-AGBOUND-026) |
| 既存 IT-ASSET-02 | 削除 | `roster check` と guard allowlist の整合が無くなる。置き換えは U-AGBOUND-015 (型の一覧の機械照合) と 018 |
| 既存 IT-ASSET-03 | 削除 | `runtime(guard) → roster` の依存方向が無くなる。guard が定義にも roster にも依存しないことは U-AGBOUND-013 / 024 が持つ |
| 既存 IT-ASSET-DB-01 | 言い換え | 「Skill / command markdown fixtures (valid / empty / legacy-runtime drift) を catalog・index する」。fixture から roster を外す |

### 4.4 L9 システムテスト設計 (`L9-system-test-design.md`)

| ID | 扱い | 新しい文面 / 理由 |
| --- | --- | --- |
| 既存 ST-ARCH-03 | 言い換え | 「PreToolUse(Agent) で型の閉集合・model 明示・fable 禁止を検証 (#1002)」。「floor 検証」を外す |
| 既存 ST-ASSET-01 | 削除 | roster registry の SSoT と孤児 subagent の概念が無くなる |
| 既存 ST-ASSET-02 | 削除 | roster ↔ guard allowlist の整合が無くなる (U-AGBOUND-015 / 018) |
| 既存 ST-ASSET-03 | 言い換え | 「`ut-tdd asset` が system として動く。`ut-tdd roster list/check` は存在しない (unknown command)」 |
| 既存 ST-ASSET-04 | 言い換え | placeholder の説明から roster を外す (skill recommender / drift 判定のうち実装済みの slice を指す) |
| 既存 ST-ASSET-07 | 削除 | roster ↔ guard 整合 (`resolveRosterCapability` と asset-drift の allowlist 照合) の実装証跡が無くなる |
| 既存 ST-EXT-01 | 据え置き | 「agent-guard 通過後のみ AI 起動」は新契約でも真 |
| 既存 ST-EXT-06 | 据え置き | security 境界の「agent-guard が fail-close する」は G1〜G6 で成り立つ |

### 4.5 L12 受入テスト設計 (`L12-acceptance-test-design.md`)

| ID | 扱い | 新しい文面 / 理由 |
| --- | --- | --- |
| AT-FR-09-01 | 言い換え | 「許可された汎用の型 + model 明示 → agent-guard pass / audit」。例を `Agent({subagent_type: "general-purpose", model: "sonnet"})` にする |
| AT-FR-09-02 | 据え置き | model の無い `general-purpose` が fail-close、model を指定した汎用の型は pass、という文面は新契約 (G4) そのもの |
| AT-FR-09-03 | 据え置き | bypass の warn + audit + exit 0 は変わらない (§3.4) |
| AT-FR-09-04 | 言い換え | 主題を「floor 未満への格下げ禁止」から「Agent tool では fable を使えない」へ差し替える。`Agent({subagent_type: "general-purpose", model: "fable"})` → fail-close exit 2 / audit に block 記録 (U-AGBOUND-009)。AC-FR-09-04 の見出しも同じ主題に直す (§4.7) |
| AT-NFR-06 | 据え置き | 「agent-guard fail-close exit 2 + 全 fail-close test pass」は新契約でも成り立つ |
| AT-NFR-14-01 | 据え置き | bypass 1 回 → audit log 生成は変わらない |
| AT-NFR-17 | 据え置き | 「agent guard fail-close 全件 pass」の対象が新しい oracle 群に置き換わるだけで、文面は変わらない |

### 4.6 L14 運用テスト設計 (`L14-operational-test-design.md`)

| ID | 扱い | 新しい文面 / 理由 |
| --- | --- | --- |
| OT-46 | 言い換え | 「skill pack / command docs / CLI command asset を UT-TDD 正本へ再構築し、subagent 定義ファイルを資産として持たないこと (`.claude/agents/` が repo にも Pack にも無い) と、HELIX 絶対パス・`helix` 正本 command・vendor runtime 直参照が残らないことを確認する」。観測の期待に「Agent tool の許可が汎用の型だけである」ことを足す |

### 4.7 表の件数と、一覧に無く読んで見つかった影響

一覧の 41 行 (§4.1 の 8 行 = L1 の 7 + C12 の 1、§4.2 の 13 行、§4.3 の 4 行、§4.4 の 8 行、§4.5 の 7 行、§4.6 の 1 行) の内訳は **削除 7 / 言い換え 20 / 据え置き 14** である。§4.2 の U-ASSETDRIFT-006 は一覧に無い追加の行で、この件数に含めない。

他の文書にも定義ファイル・roster・`pmo-sonnet` 等の言及がある。実装 PR の前に、次の文書を同じ方針で書き直す (扱いは各 PR で確定するが、方向は固定する)。

| 文書 | 該当 | 方向 |
| --- | --- | --- |
| L3 functional-requirements | AC-FR-09-01 (`pmo-sonnet` + 定義済み型の floor)、AC-FR-09-04 (`pmo-sonnet` + `haiku` の floor 未満禁止)、doc-reviewer の「pmo-sonnet とは責務分離」、FR-L1-46〜49 の carry 行 | AC-FR-09-01 は汎用の型に、AC-FR-09-04 は fable 禁止に、他は pmo-sonnet の言及を外す |
| L1 nfr | BR-08 注記の「pmo-sonnet とは責務分離」 | §4.1 の BR-08 と同じ |
| L5 module-decomposition / internal-processing / if-detail / physical-data | roster module、`roster list/check` の処理、`.claude/agents/*.md` の auto-enroll、`automation_assets` の `role` | roster module と 2 つの CLI の行を外し、auto-enroll の対象から `.claude/agents` を外す |
| L6 agent-slots | `resolveRosterCapability` の設計 (§2.3.1) と型名の例 `pmo-sonnet` | §2.3.1 を撤廃し、例を汎用の型に直す |
| L6 module-drift / fr-unit-coverage / function-spec / skill-index / setup-solo-team / forced-stop-feedback / cross-review-enforcement | asset-drift の enrolled roots、FR-L1-46 の carry、roster の配布物、`pmo-haiku` の分類 role | 上の表と同じ方向。skill-index の `.claude/agents/*.md` の model 節は撤廃する |
| L3 business-detail の `agent_slots: tl / pmo-sonnet` | PLAN の担当 slot の語彙 | slot の語彙が roster 名に依存しているかを PR 4 の冒頭で grep し、依存していれば本書の改訂へ戻る |
| `proposal-document-coverage-routing.md` | `agent-orchestration` の oracle の「slot/roster/model policy」 | roster を外す (§8.5 と同じ PR) |

## 5. 運用

- ID は、§1 の三段階で扱う。段階 1 (登録 + Red) は候補 ID を引用する `it.fails` と `repositoryReadContracts` の登録行だけ (src/ はこの行だけ)、段階 2 (本昇格、src/ を含まない) は改訂表の適用・正式 ID `U-AGBOUND-*` への昇格・引用の書き換え、段階 3 (実装 PR) は `it.fails` を `it` に戻す変更に限る。実装 PR は `docs/test-design/` を変更しない (設計書保護 gate)。
- 実装 PR ごとの対応: PR 2 は 001〜017・032、PR 3 は 018〜024・030・034〜036、PR 4 は 025〜028・031、PR 5 は 029。033 は規律の書き直しを入れる PR 2 で確認する。
- 既存テスト (`tests/agent-guard.test.ts`・`tests/delegation-routing.test.ts`・`tests/asset-drift.test.ts`・`tests/asset-catalog.test.ts`・`tests/setup.test.ts`・`tests/setup-agent-floor.test.ts`・`tests/model-id-ssot-drift.test.ts` など) の書き直しは、§4 の扱いに従って段階 2 で行う。
