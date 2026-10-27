# UT-TDD Agent Harness

## Claude Code Read Order

Claude Code treats the following as canonical in this repository:

1. `CLAUDE.md`
2. `.claude/CLAUDE.md`
3. `docs/governance/README.md`
4. `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
5. `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
6. `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
7. `docs/governance/repository-structure.md`
8. `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`

The full canonical-set index (including V-model machinery docs) is
`docs/governance/README.md`; this list is the startup minimum, not a competing
definition (PLAN-L7-459 H1).

Migration snapshots and migration docs are not normal startup reads. Read them
only when migration, gap audit, or regression-source inspection requires it.

Do not load `docs/design/harness/L3-functional/roadmap.md` as a normal startup
read. The verification roadmap is read dynamically only when a V-model layer
group has completed Forward freeze and a verification cycle is being run.

`docs/archive/`, `legacy local state/`, and pre-migration
`.claude/agents` / `.claude/hooks` are not canonical runtime state. Migration
source material is historical reference only; current UT-TDD runtime commands
use `ut-tdd`, not legacy commands.

ADR-001 is binding: source concepts may be used as design source material, but
UT-TDD core implementation is TypeScript/Node. old W1-W3a Python is not
current product runtime. The v4 management intelligence is the only Python
component (ADR-001 decision 4): a separate, proposal-only process behind a
JSON Schema boundary.

## Purpose

UT-TDD Agent Harness is the verification and development foundation for safely
using AI implementation agents in internal product development. The harness is
not the end product; it is the ground on which other product work runs.

Design and implementation should be judged by these pillars:

1. Foundation first: the harness must make downstream product development safer.
2. Document-first plus machine enforcement: workflow rules must be backed by
   schema, lint, doctor, hooks, or tests where appropriate.
3. Automatic state and feedback: `.ut-tdd/` state and harness DB projections
   should make progress, gaps, and drift visible.
4. Dynamic context / skill injection: load only relevant context and skills.
5. Practical orchestration: split work across roles/runtimes only where it
   reduces risk or cost.
6. Strict verification: no completion claim without tests or explicit evidence.

## コミュニケーション (報連相)

チャット上の報連相 (報告・連絡・相談) は **日本語** で行う (PO ルール、2026-06-22)。
進捗報告・調査結論・選択肢提示・確認依頼など PO へ向けた chat 出力は日本語を既定とし、
見出し・箇条書きラベルも日本語を優先する。

ただし成果物はそれぞれの規約に従う: コード/識別子/commit message は従来どおり、ファイル名は
英語 (文字化け回避)、技術用語・コマンド・PLAN ID・パスは原語のまま埋め込んでよい (無理に和訳しない)。

**ドキュメント本文 (`docs/` 配下の PLAN / ADR / design / test-design / governance 等) は日本語で書く**
(PO ルール、2026-06-30。Claude / Codex 両ランタイム共通)。コード・識別子・コマンド・PLAN ID・パスは
英語/原語のまま。Windows 文字化けは UTF-8 化 (`.editorconfig` charset=utf-8 / `.gitattributes` eol=lf) と
`readability` gate (mojibake fail-close) で防ぐ前提であり、**文字化け回避を理由に doc を英語化しない**。

### PO 指示の解釈 (PO ルール)

- 「改善する」は**実装すること**を指す。調査・提案で止めない (§教訓はメモリではなく仕組みにして改善する)。
- 工程は記録のために必ず通す。近道で省略しない (§運用規律の再締結 1)。
- Recovery は本線であり、傍流の後回し作業として扱わない。
- 強制停止 (作業の即時中断を要する事態) は最高 severity として扱う。PLAN 完了時の handover は必須である
  (機構は `docs/design/` の forced-stop-feedback / handover-mechanism が正本)。

### GitHub 記載言語 (PO ルール 2026-09-16)

GitHub の Issue / PR / Discussion のタイトル、本文、コメント、レビュー記録、ラベル説明、リリースノートは、
**日本語を原則**とする。タイトルも例外にしない。コード・関数名・型名・変数名・CLI コマンド・PLAN / Issue / PR ID・
パス・URL・ログ・機械生成フィールド・外部仕様の引用は、正確性を優先して英語または原語のまま記載してよい。
英語の技術用語を含める場合は、周囲の説明と判断理由を日本語で書く。外部引用やログを原文のまま貼る場合も、
要点と対応内容を日本語で併記する。Claude / Codex のどちらが起票・更新してもこの規則を適用し、既存記載を更新する際は
無関係なスコープを広げず、変更対象のタイトル・本文・コメントだけを日本語化する。

### 設計判断エリシテーション (PO ルール 2026-07-13)

PO への質問は **設計判断 (trade-off が実在する方式選択 / spec 未確定点) に限る**。
進捗確認・実行許可・自力で確定できる事実は聞かない (可逆作業は進める)。聞き方は
`docs/governance/design-decision-elicitation.md` の共通フォーマットに従う: 前提 2〜3 行 +
選択肢 2〜4 個 + 各 trade-off + 推奨 1 つ (先頭、理由 1 行)。Claude の対話セッションでは
AskUserQuestion をこの用途に限って使ってよい (必要なら preview 付き)。非対話セッションと
Codex では `## 設計判断依頼` の markdown 選択肢表で等価に出力して停止する。採択結果は
設計文書 (設計系 PLAN の場合) / PLAN の設計判断節 / ADR に記録する (skill: `skills/design-decision-elicitation.md`)。

#### PO 判断への反射的エスカレーション禁止 (PO ルール 2026-08-05)

「PO 判断必須」「PO 承認待ち」「PO が決める」と記載して作業を止める前に、必ず
`ut-tdd advisor --decision <kind> --current-model <current-model> --execute --task "<判断内容>"`
で第三者判断を得る。設計・進行・優先順位・UI/UX は
`claude-fable-5-1`、実装方式・技術的トラブルシュートは `gpt-6.1-sol` へrouteする
(正規の `--decision design|progress|uiux|implementation|troubleshooting` を使う)。
advisor結果は前提をrepo実測で検証し、下記の高影響境界に該当せず、既存の層・責務・契約から
一意に決まるなら、AIランタイムが技術判断として決定・記録して作業を継続する。advisor相談を
POへの責任転送の前置きにしてはならない。

production infrastructure、destructive data operation、authentication/authorization、payment、
PII、secret、licensing、外部API前提の変更は高影響境界であり、trade-offの有無やadvisor回答に
かかわらず変更前にPO承認を得る。advisor相談は承認の代替ではない。それ以外でPOへ上げてよいのは、
advisor相談と実測後にも複数案の実在するtrade-offが残り、product scopeなどPO権限を要する判断に
限る。その場合も、相談したadvisor/model、検証した事実、解消できなかったtrade-off、推奨案を
`docs/governance/design-decision-elicitation.md` の形式で提示する。
単なる事実確認、既存責務から導ける所有境界、可逆な実装順序、進捗報告をPO判断にしてはならない。
Fable/Solの双方が利用不能なら相談attemptとfailureを記録し、判断を捏造しない。高影響境界は
advisor unavailableの証跡を添えてPOへ上げる。高影響境界に該当せず既存契約から一意に決まる判断は
継続し、advisorを要する未解決trade-offだけを利用可能になるまで保留する。

## Canonical Docs

- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`
- `docs/governance/repository-structure.md`

## Architecture Boundary

- `docs/`: governance, requirements, ADRs, plans, design, test design, migration, archive
- `src/`: TypeScript/Node harness core
- `tests/`: Vitest tests
- `scripts/`: thin OS entrypoints only
- `.ut-tdd/`: UT-TDD runtime state and audit/handover evidence
- `.claude/`: Claude Code runtime / hook policy
- `legacy local state/`: historical source state, not UT-TDD state

V-model artifacts must stay separated:

- design: `docs/design/`
- implementation: `src/`
- test design: `docs/test-design/`
- tests: `tests/`

## Rule Placement Convention (ルールをどのファイルに書くか)

**共通ルールは本ファイル (`CLAUDE.md`) のみに書く。** アダプタファイルはランタイム固有
事項に限る (`.claude/CLAUDE.md` = Claude Code の hook / subagent / tool 呼び出し、
`AGENTS.md` = Codex CLI 固有の経路と手順)。同じルールを 2 箇所に書けばそこが drift 源に
なる (2026-07-28 実測: 片側欠落が 5 topic — Parallel Task Limit / foreign-edit override の
one-shot 消費 / memory add 必須 / doctor singleton / effort ladder。矛盾ではなく欠落であり、
`rule-drift` はマーカー節しか見ないので機械の視野外だった)。

前提: **`AGENTS.md` の Core Reads は本ファイルを含む** (Codex が共通ルールに到達できる
ことが規約の成立条件)。既存の重複記述は当面残す — 一部は `rule-drift` の必須マーカーに
なっており、整理のために gate を壊すのは本末転倒だからである。規約は**新規ルールの置き場所**
に適用する。

判定に迷ったら「もう一方のランタイムでも成り立つか」で決める。成り立つなら共通 =
本ファイル。成り立たないならアダプタ固有。

## 定期棚卸し (EOD close-out)

セッション終了時に以下を流す。新規機構は作らず、既存コマンド 1 本ずつで済ませる
(2026-07-28 実測: open issue 29 件に対し triage 機構は存在せず、`issue triage` 系の記述は
grep 0 件だった)。

- `gh issue list --state open` — 起票したまま棚卸しされていない issue を数える。
  harness.db への issue projection 機構化は `PLAN-L7-437` (blocked) の守備範囲であり、
  凍結中に先回り実装しない。
- advisor 発火の spot-check (`.claude/CLAUDE.md` §着手前 advisor 合意形成 のコマンド)。
- 未 push commit と open PR の確認。
- **harness.db projection の鮮度** (`ut-tdd db status`)。graph (`graph_nodes` /
  `dependency_edges`) は PLAN 重複や影響範囲の判定入力であり、**古い projection を正本に
  すると「重複なし」「影響なし」という偽の否定証明を出す**。2026-07-28 実例: PLAN-L6-94 と
  PLAN-L7-465 の契約重複を機械が拾えなかった真因は検出方式ではなく projection の鮮度で、
  両 PLAN が `graph_nodes` に存在していなかった (issue #169)。

## PLAN Filing Rules (both runtimes)

### PLAN 凍結: 新規起票・改訂・参照追加の停止 (PO 判断 2026-10-19、#1078 A2 / #1166)

PLAN 機構は撤去する方針 (#1078、進め方の切り替え = issuecomment-6265568869) のため、**撤去が終わるまで
PLAN への依存をこれ以上増やさない**。この節の規則は、PLAN を作業の正本・契約の置き場・参照先とする
本ファイルおよび両アダプタの既存の指示すべてに優先する (下の PLAN 起票規律は、撤去までに既存 PLAN を
触る場合の最低限として残す。rule-drift の marker 文言は変えない)。

- **新規 PLAN の起票と `plan revise` を止める**。
- **新しい作業の正本は設計文書 (`docs/design/` / `docs/test-design/`) と GitHub Issue** にする。方式判断・
  契約・受け入れ条件の本文は設計文書に書き、Issue (作業チケット、`docs/governance/github-issue-hierarchy.md` §6) は
  その path と revision を指すだけにする。新しい PLAN を作って持たせない。
- **PLAN への参照を新しく足さない**。新規の契約・gate・コード・文書は、PLAN ID や `docs/plans/` 内の
  実体を要件にせず、Issue または設計文書の節を参照する (例: #848 の `retirement_plan` は PLAN
  撤去後に成り立たない形のため、Issue / 設計文書参照へ改める — 別 PR で扱う)。
- **例外**: PLAN 撤去作業そのものに必要な場合に限り、上の 3 項目すべて (起票・`plan revise`・参照追加) に
  同じ例外を適用する。PR 本文に例外の根拠を書く。
- **PLAN を宛先とする既存の指示の読み替え**: §運用規律の再締結 1 や §PR スコープ規律 2 などが
  「PLAN の設計判断節」へ方式を freeze すると書く箇所は、凍結中は宛先を設計文書 (`docs/design/` /
  `docs/test-design/`) に読み替える (Issue は参照の置き場であり、契約本文を書かない)。工程 (実装前の pair-freeze、改訂の cross-review) は
  そのまま守る。
- 既存 PLAN の削除・物理撤去は本節の範囲外 (#1078 の後続段で行う)。

PLAN 起票規律は**両ランタイム共通**であり、片方のアダプタにしか無い状態を作らない
(2026-07-28 実測: `route_signal` / `generates` / `plan_id` が `AGENTS.md` に 0 件で、
Codex はこれらの規律を一度も受け取っていなかった)。`rule-drift` が三アダプタ全てに
`route_signal` / `generates` の記述を要求して fail-close する。

- 新規 PLAN は route certificate (`route_signal` + `route_mode`) を持ち、mode が `kind` を
  許すこと (SSoT: `src/schema/route-filing.ts`)。
- **draft PLAN の `generates` に既存ファイルを書かない** (`merged-plan-status` が
  fail-close する)。宣言は実装 PR の confirm と同時。
- `requires` は confirmed / completed のみ。draft への依存は `references` へ。
- `kind=add-impl` は Reverse 対必須。conditional kind は Reverse 対か
  `backprop_decision: not_required` + 理由 (純修理なら not_required、新契約なら Reverse 対)。
- falsifiable な claim は根拠となるテスト / コマンドを引用する (`coding ≠ substance`)。
- **新規の設計系 PLAN (`kind: design` / `add-design`) は本文を 4 項目に絞る** (issue #648 の出血止め、
  2026-10-06)。正本は下記「設計系 PLAN の本文 4 項目」。両アダプタはここへの pointer だけを持つ。

詳細は `AGENTS.md` §PLAN Rules と `.claude/CLAUDE.md` §PLAN Rules (等価)。

### 設計系 PLAN の本文 4 項目 (issue #648)

新規に起票する `kind: design` / `add-design` の PLAN は、契約本文 (設計判断・trade-off・API / schema /
アルゴリズム・fail-close 仕様・責務・不変条件) を `docs/design/` (テスト設計なら `docs/test-design/`) の
文書に置き、PLAN 本文は次の 4 項目だけにする: **上流の設計 revision digest / 引き渡し物 / 検証の対 /
完了条件**。v4 候補 (`docs/governance/candidates/ut-tdd-concept-v4.0.md` §工程間の契約と工程内の
チケット、PO 採択 2026-09-30) の「工程間の簡易契約」を先行適用する出血止めであり、設計の本文が PLAN 側に
溜まり続けて移行 backlog が増えるのを止めるためである。

- **適用範囲**: 本規則の施行後に新規起票する設計系 PLAN だけ。既存 PLAN はこの規則では移行しない
  (移行は #648 の手順 = 意味分類 → 三者照合 → 移行証跡で別途行う)。
- **frontmatter は現行要件のまま**: `agent_slots`、`dependencies` (`add-*` は `parent` 必須)、
  route certificate (`route_signal` + `route_mode`)、confirmed 時の `review_evidence` を従来どおり書く。
  4 項目化は本文だけの規則であり、新しい gate は設けない (#648 M3 実測: 4 項目の本文は複製 tree の
  `plan lint` で plan-governance / plan-schedule を通り、阻むのは frontmatter だけだった。4 項目の
  機械強制は後続 PLAN の範囲)。
- **設計の契約文を PLAN へ複製しない**。PLAN は設計文書を path と digest で指すだけにし、要約・抜粋・
  表の写しも置かない (写しは正本とずれる。#648 の分類パイロットでは stale 9 件が見つかり、すべて
  PLAN 側が古かった)。
- **上流の設計 revision digest は文書ごとに書く**: 参照する設計文書 1 本につき 1 行、
  `<path>@<commit>` と、その commit 時点の当該ファイルの blob bytes の sha256 を記録する
  (`git cat-file blob <commit>:<path> | sha256sum`)。グローバルな receipt chain には繋がない
  (繋ぐと rechain の律速 #711 が Design 側へ移るだけになる。advisor `claude-fable-5` の条件)。

本文の例 (見出しはこの 4 つ。`## 完了条件` は checklist で書く):

```markdown
## 上流の設計 revision digest

- `docs/design/harness/<layer-dir>/<topic>.md@<commit>` sha256:<64 hex>

## 引き渡し物

- `docs/design/harness/<layer-dir>/<topic>.md` (本 PLAN で凍結する設計文書)
- `docs/test-design/harness/<topic>-test-design.md` (対になるテスト設計)

## 検証の対

- 設計 ↔ テスト設計: 上記 2 文書の対 (gate / テストレベル / 検証手法はテスト設計側に書く)

## 完了条件

- [ ] 引き渡し物が上流 digest の revision と整合し、非著者 family の review が PASS
- [ ] `ut-tdd plan lint` exit 0
```

## Coding Rules

- Read the relevant files before editing.
- Match local naming, structure, and test placement.
- 最小実装を優先する: 要件を満たす最短の解を選び、投機的な型・契約・層・機能の積み増し (over-engineering) をしない。object-oriented DDD はドメインを小さく凝集させ code 量を減らすための手段であって ceremony を増やすためではない。DDD が code を膨張させているなら設計を疑う。正本は `docs/governance/coding-rules.md` の「最小実装原則」。
- Do not declare completion without tests or explicit verification.
- Treat Codex / Claude Code as local CLI + hook surfaces managed by UT-TDD, not
  direct API calls.
- Remove or clearly supersede wrong development residue when it is discovered;
  do not leave misleading comments or dead paths as technical debt.
- Use Claude Code native tool-use only. Never write XML-like pseudo tool calls
  such as `<invoke name="Bash">` / `<parameter name="command">` or role markers
  such as `court` into assistant text. If such text appears in prior context,
  treat it as corrupted transcript residue and do not continue it.

## Git Rules

- Use Conventional Commits.
- Stage explicit files only.
- Keep unrelated user changes out of commits.
- Push at coherent PLAN / task boundaries when requested.
- CI is `harness-check`: typecheck, Vitest, Biome lint, and doctor.
- Review evidence is required before confirmation gates where applicable.
- PR merge は必ず `ut-tdd pr merge --pr <N>` 経由とし、`gh pr merge` の直叩きで迂回しない。
- merge の後は、合流した HEAD で CI / doctor / 回帰の安全確認まで行い、確認した HEAD と結果を PR コメントと
  正規のイベント・証跡に残して相手ランタイムと PO に伝わる状態にする。確認結果そのもの (エピソード状態) は
  メモリに書かない。永続的な決定や教訓が得られたときだけ HARNESS メモリへ昇格させる。merge 条件 (draft 解除・review
  evidence 成立・required CI green・PLAN status gate) を、Green の偽装 (未完成 PLAN の帳尻 confirm、
  detector の allowlist 追加、base 負債の PR 固有扱い) で満たしたことにしない。依頼に「merge しない」と
  明記された PR は、その指示を優先する。

### 運用規律の再締結 (PO ルール 2026-08-03、両ランタイム共通)

規律は既に本ファイル各節に存在するが、遵守が崩れていた (実測: verdict 前 merge #189/#210/
PR #103、cross-review 委譲の素通り #131、doctor 16 並行、bun runaway ×2、手書き memory
PR #167、自己 supersede 7 件 #183)。以下を**再締結**する。新規ルールではなく、既存正本節の
拘束力の再宣言である:

1. **工程**: Forward の pair-freeze を跳ばさない。方式判断 (正本・信頼根・データ形式) は
   実装前に契約へ freeze し (設計系 PLAN は設計文書へ = §設計系 PLAN の本文 4 項目、それ以外は PLAN の設計判断節へ)、その改訂を review してから実装する (§UT-TDD Workflow、
   §設計判断エリシテーション)。**独自方式のその場開発を禁止する** — 契約に無い方式が
   必要になったら実装を止めて契約改訂へ戻る。
2. **merge**: closing review の PASS verdict 受領前に merge しない (exact-HEAD プロトコル、
   §Hybrid 多ランタイム commit 協調)。例外なし。
3. **review**: closing review (再検を含む) は成果物を書いていない family の frontier tier で行い、
   委譲は正規経路 (`ut-tdd codex|claude --role <role>`) のみ (§委譲と判断層)。FLAG 後の
   **軽作業の是正は同 PR 内で author family が行い、同じ非著者 reviewer が exact head を再検する**。
   close→再出や契約改訂へ戻すのは上流契約の齟齬だけ (§FLAG 後の限定是正と merge)。
4. **資源**: doctor singleton / 並列上限 8 / foreign-edit override one-shot
   (§Shared Guard Discipline)。exit 2 は待つ。別形式での再起動をしない。
5. **メモリ**: `ut-tdd memory add` 経由のみ。手書き禁止。エピソード状態を書かない
   (§Hybrid 多ランタイム commit 協調)。
6. **PLAN**: route certificate / generates 所有 / supersedes 双方向 / claim には根拠コマンド
   (§PLAN Filing Rules)。
7. **検証**: 基準点は HEAD のみ。共有 tree の transient を計測・帰責しない
   (§引き継ぎ・検証の基準点)。

**違反時の扱い**: 上記から外れた PR / merge / 委譲は、内容の当否に関わらず
process violation FLAG とし、incident memory に記録する。遵守の spot-check は
§定期棚卸し (EOD close-out) に載せる (新規機構は建てない — 未計測のままゲート化しない)。

### PR スコープ規律 (PO ルール 2026-08-03、両ランタイム共通)

PR 肥大と方式の場当たり発明の再発防止 (実測: PR #219 は D3 未完のまま D2 を着工し、
receipt 置き場を PR 内で自作した結果、gate / CLI / 保管方式 / audit の複数論点が混入して
close された)。新規機構は作らず、既存工程の遵守を規律として固定する:

1. **順序契約の厳守**: PLAN が宣言する実装順序 (例: D1→D3→D2) に従い、依存する正本が
   閉じる前に下流を着工しない。
2. **契約 freeze が実装 PR の前提** (pair-freeze の復元): 正本・信頼根・データ形式などの
   方式判断は実装 PR の中で発明・変更しない。先に契約 (設計系 PLAN は設計文書、それ以外は PLAN の設計判断節) へ方式を freeze し、
   その改訂を cross-review してから実装 PR を出す。実装中に方式変更が必要になったら
   PR を close して契約改訂へ戻る (積み増し禁止)。
3. **1 PR = 1 論点**: 新規 source_module 1 個 + 対になるテスト + 最小配線まで。
   CLI surface / audit / 別 consumer は別 PR。
4. **scope 構造を指す FLAG は close→分割再出が既定**。同一 PR への是正 commit
   積み増しで応じない (ここで禁じるのは scope 構造 FLAG への積み増し。軽作業の是正 commit は
   §FLAG 後の限定是正と merge に従い author family が同 PR 内に積む)。
5. **TDD は Red → Green → Refactor の順で、Refactor を飛ばさない** (PO 指摘 2026-10-13、issue #968。
   実測: 直近の実装 PR 19 本のうち `refactor:` commit を持つのは 1 本)。Red は契約 PR + Red
   (`it.fails`、設計書保護 gate §10.2) で先に入れる。実装 PR の commit は Green (`feat:` / `fix:`、
   `it.fails` を `it` に戻す最小実装) → Refactor (`refactor:`) の順にする。Refactor の commit は
   `tests/` の内容差分 0 (rename だけ可) でテスト設計にも触れず、commit ごとに full suite を流す。
   直す余地が無いときは PR 本文に「Refactor なし (理由)」と書く。その理由を認める条件と判定者は
   `docs/governance/coding-rules.md` §量・分割・Refactor の目安 を正本とする。大きな構造変更は
   Refactor Issue (ラベル `refactor`) と設計文書へ回す (PLAN 凍結、#1166)。非著者 reviewer は commit の順と Refactor commit の `tests/` 差分 0 を確かめ、判定を verdict の行頭 `REFACTOR:` 欄 (`commit-ok` / `none-ok` / `not-applicable` / `commit-tests-changed` / `none-rejected`) に必ず書く。実装 PR (`src/` か `scripts/` を変える PR) では、`ut-tdd pr merge` が exact HEAD の verdict にこの欄があり合格の値であることを機械で確かめ、欄が無いか不合格なら merge を拒否する (欄の形と gate の規則は `docs/design/harness/L6-function-design/merge-gate-refactor-stage.md`、#1300)。
   手順の正本は `skills/test-driven-development.md`。

6. **WIP 上限 (slot 単位) と共有文書の直列化** (PO 指摘 2026-10-14、2026-10-23 に slot 単位へ改訂): WIP は
   lane 全体ではなく slot ごとに数える。自分の open PR に FLAG・CI 赤・衝突が残っている slot は、是正が済むまで
   新しい作業を拾わない (他の slot は動き続けてよい)。`docs/test-design/harness/L7-unit-test-design.md`、
   `function-spec.md`、`tests/gate-static.test.ts` のような共有の文書・テストを変える作業は直列にし、
   同じファイルを並行する複数の PR に分けない (1 本 merge するたびに残りが衝突して再検になる)。この直列化は
   直列ボックスで実現する。並列にしてよいのは、変更するファイルが重ならない範囲だけである。ボックスと slot の
   運用 (実装・control・検収の全 lane に同じ型を当てる) は `docs/governance/github-issue-hierarchy.md` §6.1。初回の FLAG 率が高い作業は、worker を
   増やす前に手順書を直す。

この規律から外れた PR は内容の当否に関わらず FLAG (process violation) とする
(宣言の初出: issue #218、2026-08-03)。

### FLAG 後の限定是正と merge (PO ルール 2026-09-14、両ランタイム共通)

FLAG のたびに PR を close→再出したり契約改訂へ戻したりすると、CI (13〜14 分) → request → consume →
receipt の往復が FLAG の数だけ発生して収束しない (実測: PR #572 は r1〜r4 で CI 11 run、PR #574 は
簿記 red 2 回 + FLAG 6 件)。PO 判断 (2026-09-14): 「レビューが差し戻すと永遠に詰まる。merge のための
軽作業まで戻す意味はない。上流齟齬でそもそも違う以外は返さない」。issue #579。

judgement の族分離は concept v3.1 (hybrid の worker / reviewer 別 runtime は MUST) と canonical merge
dispatch (same-family verdict は `same_family_reviewer` で拒否) が機械強制しており、本節はそれを
緩めない。収束させるのは **差し戻し先** であって review の族ではない。

1. **同 PR 内で往復する**: 非著者 family の frontier reviewer (Codex 著 = Claude Opus、Claude 著 =
   Codex Sol) が FLAG を出したら、**author family が同 PR 内で軽作業を是正** し、**同じ非著者
   reviewer が新 exact head を再検** する。blocking 0 なら author 側 control lane が正規経路
   (`ut-tdd pr merge`) で merge する。close→再出も、契約改訂への差し戻しも、軽作業では行わない。
2. **軽作業の定義**: FLAG 是正のうち (a) 上位契約 (PLAN 設計判断節 / 設計文書 / test-design の
   凍結 oracle) の変更を伴わない、(b) 新規 source_module を追加しない、(c) 是正 3 回以内で
   blocking 0 に収束する、の全てを満たすもの。(c) を超えたら close→分割再出 (§PR スコープ規律 4)。
3. **差し戻しは契約齟齬だけ**: 上位契約そのものが違うと reviewer が判定した場合は PR 内で直さず、
   契約改訂 (設計文書 / PLAN 設計判断、pair-freeze) へ戻す。これが設計 owner へ返す唯一の経路であり、
   実装の手直しを返す経路ではない。
4. **再検の担保**: 再検 packet は author claim・自己評価・前回 verdict を除いて control 側が組む
   (blind packet)。再検は新 exact head に束縛し (receipt の再利用禁止)、反証試行を verdict に残す
   (反証ゼロの PASS は PASS-WEAK)。receipt の evidence tier は従来どおり `cross_agent`。
5. **是正 commit は常に author family が積む**: biome format 等の機械的是正であっても reviewer family は
   commit しない (成果物を書いた時点で非著者ではなくなり、再検の族分離が壊れる)。reviewer は FLAG の
   `FINDING:` 行で是正内容を指し、author family が同 PR 内に path 明示 stage・history 非破壊 (reset / force
   禁止) で積み、PR コメントに是正内容を記録する。§Hybrid 多ランタイム commit 協調の例外は設けない。
6. **Codex worker の役割**: 初回実装 + 自 PR の軽作業是正 + 契約齟齬時の契約改訂。
7. **収束規律** (PO 2026-09-17): 再検の判定対象は「前回 FINDING が直ったか」と「是正で新たに壊れた回帰」
   だけにする。再検で見つけた新規の探索指摘は non-blocking observation として記録し、別 issue へ回す
   (blocking にできるのは前回 FINDING の未是正と是正起因の回帰だけ)。是正 3 回 (2c) で blocking 0 に
   ならなければ close→分割再出を執行する。契約改訂は著者 family が書いて非著者 family が review し、
   依頼が再度来ても所有権を再判定せず同じ回答を返す。
8. **rebase は GitHub が CONFLICTING を返す時だけ**行う。base が古いだけ (MERGEABLE) なら不要である。
   exact-head review は PR head の内容に束縛され、merge は現 main と結合されるので、rebase しても
   CI と両 family review の往復が 1 回増えるだけになる。rebase した場合は新 head で request を 1 本だけ出す。

### Hybrid 多ランタイム commit 協調 (Claude ↔ Codex、必須)

実運用では **Codex (もう一方のランタイム) が並行に作業を進め、コミットまで完了させる**。Claude は
その成果を絶対にデグレさせてはならない ([[feedback-commit-finished-codex-work-dont-abandon]])。

- **history を書き換える前に必ず `git log` / `git reflog` を確認**し、自分が作っていない commit
  (相手ランタイムの成果) が無いか調べる。**他ランタイムの commit を `reset` / `revert` / `checkout` /
  force で破棄・デグレさせない**。working tree の foreign 変更は **既定で「相手ランタイムの正規作業」と
  みなす** (overstep と決めつけない)。判断が付かなければ revert せず PO へ確認する。
- 自分の成果は **相手の commit の上に積む** (rebase/stack)。相手のファイルには触れず、自分の意図ファイル
  のみを path 明示で stage する (`git add <path>`、`git add -A` / `git add .` 禁止)。FLAG 後の
  是正 commit も author family が積む (§FLAG 後の限定是正と merge 5。reviewer family の代理 commit は
  認めない)。
- **commit 直前に `git status` + `git diff --staged` (or `ut-tdd review --staged` / `--uncommitted`) を
  確認**し、自分が authored した意図ファイルのみが staged であることを検証する。
- push は origin と相手の commit を含めて整合する状態でのみ行う。push 済み履歴は決して破壊しない。
- 真に off-task な overstep (相手ランタイムの作業でも自分の作業でもない net-new) と疑う場合でも、
  **revert する前に PO 確認**を取り、IMP で記録する (完了済み成果を捨てる誤判定を防ぐ)。

### 委譲した成果物の検収 (両ランタイム共通)

- **worker が生成した manifest / JSON** は、CLI や harness DB へ投入する前に root が内容を読み、
  `JSON.parse` と実 shell での再現を通す。worker の「作成した」「通った」は検収の根拠にしない。根拠は
  正規 receipt (`.ut-tdd/review/receipts/`) と git diff の実物である。worker は自分が走る shell
  (cmd.exe / PowerShell / Git Bash) を誤認し、heredoc・単一引用符・パイプで誤りやすい。worker の草案は
  破棄せず、root が有効な JSON を作り直して正規経路で投入し、失敗した manifest は誤再利用を防ぐため削除する。
- **ドキュメント範囲の縮小を委譲するとき**は「削除」と書かず、改訂する節を名指しして「改訂」と指示する。
  置き換え後の文章またはその形を示し、frontmatter と他の節は残すことを明示する (曖昧な「削除」は
  ファイル全体の削除として返ってくる)。
- **共有 worktree へ書き込みを委譲する前**に、worktree の実 HEAD (`git rev-parse HEAD`) と PR の HEAD を
  比較する。PR HEAD だけを見て「停滞している」と判断しない。ローカル worktree は PR HEAD を動かさずに進む
  ことがあり、実 HEAD が食い違っていれば別セッションが同じブランチを操作中の兆候なので、書き込みを止める。

### 引き継ぎ・検証の基準点 = HEAD (共有 tree を測るな、必須)

引き継ぎ (session takeover) と検証の基準点は **commit/push 済の HEAD ただ一つ**。hybrid では
working tree を相手ランタイムが常時書き換えるため、full tree の計測値 (テスト件数等) は transient で
非正本。これを「repo の状態」として報告するな。

- **検証は HEAD (+ 自分の意図変更のみ) に固定**する。他ランタイムの未コミット scratch を基準へ混ぜない。
  測定値が動いたら、相手を疑う前に「自分が動く面を測っていないか」を先に疑う (foreign tree の transient を
  相手の退行と帰責するのは誤り)。
- **引き継ぎ feedback は harness.db から受け取る** (`feedback_events`、SessionStart で surface、
  PLAN-L7-110)。stale 化する prose handover を現状把握の正本にしない。CURRENT.json / prose は補助。
- **永続教訓は共有 HARNESS メモリへ昇格する** (`ut-tdd memory add`、正本 `.ut-tdd/memory/`、
  PLAN-L7-189)。PO ルール・教訓・落とし穴をランタイム私的メモリや chat 止まりにしない。
  **メモリファイルの手書き作成は禁止** — frontmatter (memory_id/kind/title/tags/updated_at)
  欠落は db rebuild が fail-close し CI が赤化する (2026-07-28 実例: PR #167)。必ず
  `ut-tdd memory add` 経由で書く。
  既存メモリの扱いは次のとおり (`src/memory/service.ts` の `writeMemoryEntry`)。同じ kind と title は同じ
  memory_id・同じファイルに解決される。同じ内容 (body・tags) の登録し直しは既存 entry をそのまま返す。
  body が異なる登録は、既存ファイルが残っている間は例外で拒否される。本文を変えるときは、既存ファイルを
  `git rm` してから、kind / title / tags を保ったまま変更後の body を `memory add --body-file` に渡す。
  新しい `updated_at` で書き直される。この手順を通らない body の変更は手編集であり、レビュアは
  「body が変わったのに `updated_at` が変わっていない」commit を手編集として検出できる。
  エピソード状態 (進捗・次の一手) はメモリに書かず、DB/HEAD 由来の digest に任せる
  (stale 化する層を作らない)。

### 教訓はメモリではなく仕組みにして改善する (PO ルール 2026-10-13、両ランタイム共通)

PO: 「原則プロバイダー個別メモリじゃなくてハーネスメモリを使う、メモリに書いて改善ではなく仕組みにして改善すること。」

- **書く先は HARNESS メモリだけ**: 教訓・PO ルール・落とし穴は `ut-tdd memory add` で共有 HARNESS メモリへ書く。
  プロバイダー個別のメモリ (Claude の auto-memory、Codex の私的メモリなど) に書かない。もう一方のランタイムからは
  見えず、規律の正本からも外れるためである。
- **改善は仕組みで行う**: メモリへの記録は、改善の完了ではなく、仕組みにするまでの一時置きである。同じ失敗を
  防ぐ手段は、次の順で選ぶ: (1) 機構 (hook・CLI・lint / doctor・テスト)、(2) 規律の正本 (本ファイル・AGENTS.md
  の該当節、機械照合できるなら rule-drift の marker)。機構にも正本にもしないまま、メモリだけで再発防止とは
  しない。
- 仕組みにしたら、その教訓のメモリに昇格先 (path・PR) を書いて退避する。棚卸しと昇格の進め方は #998 が持つ。
- プロバイダーの標準メモリへの書き込みは、最終的に hook guard で拒否して `ut-tdd memory add` へ誘導する
  (PO 2026-10-13、#998)。標準メモリは、もう一方のランタイムからも harness.db の学習機構 (feedback_events /
  memory projection) からも見えないためである。guard が入るまでは、本節を規律として守る。
- 2026-10-13 時点で、共有 HARNESS メモリの feedback は 132 件ある。同じ教訓が何度も記録され、そのたびに
  同じ事故が繰り返されていた (#998 の表)。control lane も、教訓を Claude の私的メモリに書いていた。

### runtime 間のやりとりは GUI lane (PO ルール 2026-10-08、両ランタイム共通)

Claude と Codex の間の作業依頼・closing review の依頼・結果の受け渡しは、常駐の GUI lane (Claude の
VS Code session と Codex の GUI root lane) で、Issue / PR コメントと HARNESS メモリを通して行う
(#733 comment 6050530566)。

- `ut-tdd codex|claude --role ... --execute` などの CLI 委譲は補助であり、使ってよいのは局所の穴埋め
  review と、下の例外だけとする。使った回数は数えられるようにする (週次の利用上限の内側で使う)。
- **例外 (#907 が閉じるまで)**: review custody (request → verdict → receipt) を封印できるのは、今は
  CLI 委譲の経路 (`src/cli/delegation.ts`) だけである。GUI lane の判定は PR コメントに残るだけで、
  `ut-tdd pr merge` から見ると review が無い状態になる。判定をコメントから custody へ書き写すのは
  捏造なので禁止する。そのため、merge に使う closing review は、#907 で GUI 経路の封印ができるまで
  CLI 委譲の正規経路で行ってよい。並行させるときは、review ごとに別の clean worktree から実行する
  (review-guard は実行した checkout の作業ツリーだけを見るので、他レーンの書き込みで receipt が
  落ちるのを避けられる。2026-10-13 に 4 本並列で全 receipt を確認)。
- **review request は control lane だけが出す** (#700、2026-09-25)。同じ exact head に control lane と
  Codex lane の request が重なると、verdict の無い request が 1 件でも残る限り merge gate
  (`src/feedback/review-merge-gate.ts`) が merge を拒否し、request を取り下げる正規の手段が無いため
  2 件とも review しないと merge できない。Codex lane は是正を push したら PR コメントで報告して止まる。
  1 つの作業は、control lane が発注した 1 本だけを進める (同じ PR の並行再起票も同じ原因で詰まる)。
- レーンの中の並列 (Luna の subagent、Claude の Agent tool) は別の話であり、本節は制限しない。上限は
  §Shared Guard Discipline の 8 のまま。

2026-10-08 の決定は Claude の私的メモリと #733 にしか無く、規律の正本に入っていなかった。その間に、
control lane は補助のはずの CLI 経路を記録なしに常用していた (2026-10-13、#998 の昇格対象の実例)。

## GitHub Issue Hierarchy

- 正本は `docs/governance/github-issue-hierarchy.md`。
- 新規 Issue の前に既存の成果目標を検索し、bounded slice は GitHub の正式な sub-issue にする。
- top-level Issue は独立した成果目標だけに限定し、`Related` や本文の `Parent: #N` を親子関係の
  代替にしない。
- canonical parent は 1 件。別系統は横断リンクに留め、無関係な移行をブロッカー化しない。
- 親 Issue は必須子 Issue と親固有 AC の両方が完了するまで close しない。

## Canonical Commands

- Setup: `ut-tdd setup`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Plan lint: `ut-tdd plan lint`
- Review: `ut-tdd review --uncommitted`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude prompt generation: `ut-tdd claude --role <role> --task "..." --dry-run`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
- Task classification: `ut-tdd task classify --text "..."`
- Skill suggestion: `ut-tdd skill suggest --plan <path>`

When multiple AI runtimes are available, separate creation from judgement. In
single-runtime modes, record `intra_runtime_subagent` review evidence as the
fallback.

## Model / Effort Routing

正規委譲経路 (`ut-tdd codex/claude --role <role>`) は role 検証 + routing を機械強制する
(PLAN-L7-255、`src/team/delegation-routing.ts`): 未登録 role は fail-close。判断ゲート role
(reviewer / blind-reviewer / qa / tl / security 等) は族内 frontier reviewer tier
(codex=`gpt-6.1-sol` / claude=`claude-opus-5-5`) へ固定し、worker role は intent 推定
(`selectTeamModel`) で創出=ROI 寄せの既定へ流す。明示 `--model`/`--effort` は常に優先。
effort は codex にも argv (`-c model_reasoning_effort=...`) で実注入される。
判断側の族分離 (`same_model_approval: forbidden`) は routing で破らない。

Task-kind ベースの割当 (PO rule 2026-07-14、旧 tier 記述を supersede):

- Codex (GPT-6 の 4 モデルだけ、PO 2026-10-09 / 2026-10-27): 実装/テスト実装/ドキュメント修正/軽量探索 =
  Luna (`gpt-6-luna`、effort `high`); 検証/設計/判断 = Sol (`gpt-6.1-sol`、effort `low`);
  GUI lane の指揮 = Terra (`gpt-6.1-terra`。フロントエンド・UI と設計の判断だけ Sol に相談する);
  超局所の難所の相談だけ = Astra (`gpt-6-astra`、常用しない)。指揮モデル別の振る舞いは
  `AGENTS.md` §Codex / Claude Code Harness の「あなたが○○なら」の表。
- Claude: フロントデザイン/UI デザインの判断・レビュー/設計ドキュメント作成 = Opus (`claude-opus-5-5`);
  決まった UI デザインの実装/ドキュメント修正 = Sonnet (`claude-sonnet-5-5`)
  (指揮モデル別の相談先と委譲先は `.claude/CLAUDE.md` §委譲と判断層 の「あなたが○○なら」の表);
  web 検索/doc パッチ = Haiku (`claude-haiku-5-5`)。
- 並列の軽量レーンは Luna の subagent と Claude Haiku が担い、closing の権限を持たない。
- Effort はモデル別基準ラダー (PO rule 2026-07-28) が既定: Sol/Fable = `low`、
  Opus/Sonnet = `middle`、Luna = `high`。回答が浅い時は
  **まず effort を 1 段、その先はモデルを上げる** (`escalateShallowResponse`):
  Sol/Fable → `middle`、Opus/Sonnet → `high`、そこでも浅ければ
  Sonnet→Opus `middle` / Opus・Luna・Fable→Sol `low`。**`xhigh` は既定として配らない** (PO rule 2026-07-28:
  「xhigh 以上はモデルを上げたほうがいい」)。ラダー外 (haiku 等) は従来既定
  (Claude `high` / GPT `middle`)。明示 `--effort xhigh` は有効で、UI/UX は
  task-kind 例外 (PO rule 2026-07-08)。
- Implementation work in `hybrid` is cross-executed and cross-reviewed: the
  non-orchestrating provider executes, and review returns to the other
  provider (tier-router implementation lane, PO rule 2026-07-08). FLAG 後の
  軽作業の是正は同 PR 内で author family が行い、同じ非著者 reviewer が exact head を
  再検する (PO rule 2026-09-14、§FLAG 後の限定是正と merge)。
- Design/implementation review uses a top reviewer model: GPT frontier
  (`gpt-6.1-sol`) or Claude Opus (`claude-opus-5-5`) or above, behind the
  explicit frontier gate.
- advisor (PO rule 2026-07-29、2026-07-14 の行列を supersede): **技術判断**
  (実装方式 / トラブルシューティング) は `gpt-6.1-sol` 一次 (fallback Fable)、
  **設計・進行判断** (設計方式 / レーン選択 / 優先順位 / 段取り) と
  **デザイン/UI 判断** は `claude-fable-5-1` 一次 (次点 `gpt-6.1-sol`)。
  判断種別は `--decision design|progress|implementation|troubleshooting|uiux`
  で明示でき、省略時は task 文から推論する (進行語は technical 語より優先)。
  迷う場合は `ut-tdd advisor --task "..." --current-model <model>` を使い、
  実相談は `--execute` を付ける。

## Skills

- Load only relevant skills; do not bulk-load the full catalog.
- Pack / runtime skill content lives under root `skills/`.
- `src/skill-engine/` is TypeScript implementation code for skill
  recommendation / injection / scaffolding. It is not a skill content directory.
- Legacy-derived skill material under `docs/skills/` is source-repo reference /
  migration material unless a task explicitly targets it. Do not treat it as the
  Pack runtime skill root.

## Distribution Repository

- Source development repo: `unison-ai-product/UT-TDD_AGENT-HARNESS`.
- Clean distribution Pack repo:
  `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`
  (`https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`).
- When publishing clean Pack artifacts, push/export to the Pack repo, not back
  into the source development repo.
- Standard local propagation from this source repo to an existing Pack checkout
  is `ut-tdd distribution sync-pack --repo-dir <Pack checkout>`.
  Use `--prune-local` only when intentionally removing local files that are not
  part of the clean Pack artifact set. The command must not commit or push;
  inspect its output and perform any Pack repo commit / push as a separate,
  human-reviewed step.

## Shared Guard Discipline (both runtimes)

配置規約に従い、両ランタイムで成り立つ guard 規律は本節が正本 (2026-07-28 時点で
片側のアダプタにしか無かった 3 件を集約した)。

- **doctor は singleton** (PLAN-L7-442)。二重起動は exit 2 + holder pid で fail-fast する。
  exit 2 を見たら**待つ**。retry も別形式 (`node -e` / `--json` / 直接 `runDoctor`) での
  再起動もしない (2026-07-16 実害: doctor 16 並行、空きメモリ 31MB)。一部だけ要るなら
  `--scope` や check 関数の直接呼び出しを使う。
- **並列 subagent は既定上限 8** (`DEFAULT_MAX_PARALLEL`、`src/runtime/agent-slots.ts`)。
  `agent-slots` が fire/release を記録し上限到達を警告する (fail-open advisory であって
  fail-close gate ではない)。
- **Vitest の snapshot guard を env で迂回しない**。raw Vitest が global-setup に拒否されたとき、
  `UT_TDD_TEST_EXECUTION_ROOT` / `UT_TDD_TEST_FENCE_ROOT` / `UT_TDD_HEAD_SNAPSHOT_ROOT` を dirty な
  worktree へ手設定して再実行しない。その実行は Red / Green やレビューの証拠にならない
  (Issue #890 の実例)。Red テストを先に通常 commit し、`npm run test:vitest-snapshot` 系
  (`scripts/run-vitest-snapshot.ts`) を committed HEAD に対して流す。
- **Docker Desktop は使っていないときは停止する** (PO 2026-10-01)。Linux 受入の使い捨て container
  など必要な作業の前に `docker desktop start` で起動し、作業と証跡の退避が終わったら
  `docker desktop stop` で落とす。
- **foreign-edit override は one-shot**。`.ut-tdd/state/foreign-edit-override` に非空の理由を
  書いた場合のみ 1 回通り、その編集で消費 (削除) される。空 marker は通さない (理由なき
  silent override を作らない)。bypass は `.ut-tdd/logs/foreign-edit-overrides.jsonl` へ監査
  記録される。marker は**書いたセッションに紐付かない** — 消費前に読んだ任意のプロセスが
  使えてしまう first-come-first-served であり、実際に別セッションが他セッションの marker を
  消費した観測がある (2026-07-17T01:33:51)。env の `UT_TDD_ALLOW_FOREIGN_EDIT=1` は
  human 管理で消費されない。

## Safety Boundaries

- Do not write API keys, secrets, PII, or credentials into rules, docs,
  examples, or audit evidence.
- Escalate before changing authentication, authorization, payments, PII,
  licenses, destructive data operations, production infrastructure, or external
  API assumptions.
- Do not track local runtime artifacts except explicitly tracked audit /
  provider-handover evidence.

## UT-TDD Workflow

- Forward: `plan` -> `pair-freeze` -> `implement` -> `trace-freeze` -> `review` -> `accept`
- Reverse: `reverse <type> R0` -> `R1` -> `R2` -> `R3` -> `R4` -> Forward merge
- Scrum / PoC: `S0 backlog` -> `S1 plan` -> `S2 poc` -> `S3 verify` -> `S4 decide`
- Handover: check `.ut-tdd/handover/CURRENT.json` if present and non-stale.

## Instruction Files

- Shared project context: `CLAUDE.md`
- Claude Code runtime / hook policy: `.claude/CLAUDE.md`
- Codex CLI project rules: `AGENTS.md`
- Personal overrides: `CLAUDE.local.md` / `AGENTS.override.md`

## UT-TDD Adapter Rule Markers

This section is machine-checked by `rule-drift` so Codex and Claude adapters do
not silently diverge.

- Codex project rules: `AGENTS.md`
- Claude runtime policy: `.claude/CLAUDE.md`
- Modes: `standalone` / `claude-only` / `codex-only` / `hybrid`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
