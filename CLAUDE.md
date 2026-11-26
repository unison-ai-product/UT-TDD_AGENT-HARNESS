# UT-TDD Agent Harness

索引行の記号: G = `docs/governance/operating-rules-general.md`、R = `docs/governance/operating-rules-review-merge.md`、D = `docs/governance/operating-rules-delegation-routing.md`。「同名の節」は本ファイルと同じ見出しの節で、移動先では見出しに括弧書きの付記が付く場合がある。

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

ADR-001 に従い、UT-TDD の実装言語は TypeScript/Node とする。旧 W1–W3a の Python は設計の参照資料である。v4 の 1.0.0 では管理知能を作らない。後続で作る場合は、別プロセスの提案専用機能とし、入出力を JSON Schema で定める (ADR-001 決定 4 の運用上の注記)。

## Purpose

本文は G の同名の節 (設計・実装を判断するとき)。

## コミュニケーション (報連相)

チャット上の報連相 (報告・連絡・相談) は **日本語** で行う (PO ルール、2026-06-22)。
進捗報告・調査結論・選択肢提示・確認依頼など PO へ向けた chat 出力は日本語を既定とし、
見出し・箇条書きラベルも日本語を優先する。

ただし成果物はそれぞれの規約に従う: コード/識別子/commit message は従来どおり、ファイル名は
英語 (文字化け回避)、技術用語・コマンド・Issue ID・パスは原語のまま埋め込んでよい (無理に和訳しない)。

**ドキュメント本文 (`docs/` 配下の ADR / design / test-design / governance 等) は日本語で書く**
(PO ルール、2026-06-30。Claude / Codex 両ランタイム共通)。コード・識別子・コマンド・Issue ID・パスは
英語/原語のまま。Windows 文字化けは UTF-8 化 (`.editorconfig` charset=utf-8 / `.gitattributes` eol=lf) と
`readability` gate (mojibake fail-close) で防ぐ前提であり、**文字化け回避を理由に doc を英語化しない**。

### PO 指示の解釈 (PO ルール)

本文は G の同名の節 (PO 指示の解釈に迷うとき)。

### GitHub 記載言語 (PO ルール 2026-09-16)

本文は G の同名の節 (GitHub の Issue / PR / コメントを書くとき)。

### 設計判断エリシテーション (PO ルール 2026-07-13)

本文は G の同名の節 (PO へ設計判断を仰ぐとき)。

#### PO 判断への反射的エスカレーション禁止 (PO ルール 2026-08-05)

「PO 判断必須」「PO 承認待ち」「PO が決める」と記載して作業を止める前に、必ず
`ut-tdd advisor --decision <kind> --current-model <current-model> --execute --task "<判断内容>"`
で第三者判断を得る。設計・進行・優先順位・UI/UX は
`claude-fable-5-2`、実装方式・技術的トラブルシュートは `gpt-6.1-sol` へrouteする
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

本文は G の同名の節 (正本文書の一覧が要るとき)。

## Architecture Boundary

本文は G の同名の節 (ディレクトリの責務を確かめるとき)。

## Rule Placement Convention (ルールをどのファイルに書くか)

共通ルールの正本は本ファイル (`CLAUDE.md`) と、本ファイルが名指しする `docs/governance/` の文書である。
本ファイルの 1 行索引 (「本文は …」) は参照先を示す pointer であり、規範ではない。アダプタファイルは
ランタイム固有事項に限る (`.claude/CLAUDE.md` = Claude Code の hook / subagent / tool 呼び出し、
`AGENTS.md` = Codex CLI 固有の経路と手順)。同じルールを 2 箇所に書けばそこが drift 源になる。
`AGENTS.md` の Core Reads は本ファイルと名指し先の文書を含む。判定に迷ったら「もう一方のランタイムでも
成り立つか」で決める。成り立つなら共通 (本ファイルまたは名指し先)、成り立たないならアダプタ固有。
本文中の裸の `§<見出し>` は、本ファイルの同じ見出しを起点に解決する (索引行が移動先を示す)。path 付きの § はそのファイル、本ファイルに無い見出しは `.claude/CLAUDE.md` のものである。
本文の分割は PO が 2026-11-26 に指示した。分割前の本節は operating-rules-general.md に残す。

## 定期棚卸し (EOD close-out)

本文は G の同名の節 (セッション終了時)。

## 設計と作業の正本

新しい作業の正本は設計文書 (`docs/design/` / `docs/test-design/`) と GitHub Issue とする。Issue から対象の設計文書とその revision を参照する。設計の改訂には pair-freeze と非著者 family の review の規律を適用する。

## Coding Rules

- Read the relevant files before editing.
- Match local naming, structure, and test placement.
- Do not declare completion without tests or explicit verification.
- 最小実装原則・UT-TDD 管理下の CLI 扱い・誤った残骸の除去は docs/governance/operating-rules-general.md §Coding Rules (最小実装・残骸除去) (実装するとき)。
- Use Claude Code native tool-use only. Never write XML-like pseudo tool calls
  such as `<invoke name="Bash">` / `<parameter name="command">` or role markers
  such as `court` into assistant text. If such text appears in prior context,
  treat it as corrupted transcript residue and do not continue it.

## Git Rules

- Use Conventional Commits.
- Stage explicit files only.
- Keep unrelated user changes out of commits.
- Push at coherent task boundaries when requested.
- CI is `harness-check`: typecheck, Vitest, Biome lint, and doctor.
- Review evidence is required before confirmation gates where applicable.
- merge 後の確認・Green の偽装禁止・「merge しない」指示の優先は docs/governance/operating-rules-review-merge.md §Git Rules (merge 後の確認) (merge するとき)。
- PR merge は必ず `ut-tdd pr merge --pr <N>` 経由とし、`gh pr merge` の直叩きで迂回しない。
- closing review の PASS verdict 受領前に merge しない (例外なし)。
- Hybrid commit 協調の核心: history を書き換える前に `git log` / `git reflog` を確認する。**他ランタイムの commit を `reset` / `revert` / `checkout` / force で破棄・デグレさせない**。自分の意図ファイルだけを path 明示で stage し (`git add -A` / `git add .` 禁止)、commit 直前に `git status` + `git diff --staged` を確認する。
- メモリは必ず `ut-tdd memory add` 経由で書く (手書き禁止。docs/governance/operating-rules-review-merge.md §引き継ぎ・検証の基準点 = HEAD)。

### 運用規律の再締結 (PO ルール 2026-08-03、両ランタイム共通)

本文は R の同名の節 (工程・merge・review の規律を確かめるとき)。

### PR スコープ規律 (PO ルール 2026-08-03、両ランタイム共通)

本文は R の同名の節 (PR を切る・分割するとき)。

### FLAG 後の限定是正と merge (PO ルール 2026-09-14、両ランタイム共通)

本文は R の同名の節 (review・merge・FLAG 是正のとき)。

### Hybrid 多ランタイム commit 協調 (Claude ↔ Codex、必須)

本文は R の同名の節 (commit・push・他ランタイムの変更に触れるとき)。

### 委譲した成果物の検収 (両ランタイム共通)

本文は R の同名の節 (worker の成果物を受け取るとき)。

### 引き継ぎ・検証の基準点 = HEAD (共有 tree を測るな、必須)

本文は R の同名の節 (引き継ぎ・検証・メモリ記録のとき)。

### 教訓はメモリではなく仕組みにして改善する (PO ルール 2026-10-13、両ランタイム共通)

本文は D の同名の節 (教訓を記録するとき)。

### runtime 間のやりとりは GUI lane (PO ルール 2026-10-08、両ランタイム共通)

本文は D の同名の節 (Claude と Codex の間で依頼・review を渡すとき)。

### lane 間の依頼 (待たずに依頼をかける)

本文は D の同名の節 (作業が他 lane や control で止まったとき)。

## GitHub Issue Hierarchy

- 正本は `docs/governance/github-issue-hierarchy.md`。
- 新規 Issue の前に既存の成果目標を検索し、bounded slice は GitHub の正式な sub-issue にする。
- top-level Issue は独立した成果目標だけに限定し、`Related` や本文の `Parent: #N` を親子関係の
  代替にしない。
- canonical parent は 1 件。別系統は横断リンクに留め、無関係な移行をブロッカー化しない。
- 親 Issue は必須子 Issue と親固有 AC の両方が完了するまで close しない。
- PR 本文の `Closes #N` と `Refs #N` の使い分けは正本 §4 に従う (本ファイルへ本文を複製しない)。

## Canonical Commands

本文は G の同名の節 (ut-tdd の正規コマンドを確かめるとき)。

## Model / Effort Routing

本文は D の同名の節 (モデル・effort・委譲先を選ぶとき)。

## Skills

本文は G の同名の節 (skill を読み込む・配置するとき)。

## Distribution Repository

本文は G の同名の節 (Pack repo へ配布・同期するとき)。

## Shared Guard Discipline (both runtimes)

- **doctor は singleton** (PLAN-L7-442)。二重起動は exit 2 + holder pid で fail-fast する。
  exit 2 を見たら**待つ**。retry も別形式 (`node -e` / `--json` / 直接 `runDoctor`) での
  再起動もしない (2026-07-16 実害: doctor 16 並行、空きメモリ 31MB)。一部だけ要るなら
  `--scope` や check 関数の直接呼び出しを使う。`source-full` の
  `gate-run-coverage` は証跡を照合し、必要に応じてリポジトリの `.ut-tdd/harness.db` に
  初回投影や整合する行の更新を行う。`source-doc-lane` と toolchain プロファイルでは
  この検査を実行しない。CLI は実行時に singleton lock を使用し、`--result-file` 指定時には
  要求された出力を書き出す。
- doctor 以外の本文は docs/governance/operating-rules-general.md §Shared Guard Discipline (並列上限・Vitest snapshot・Docker・foreign-edit に触れるとき)。

## Safety Boundaries

- Do not write API keys, secrets, PII, or credentials into rules, docs,
  examples, or audit evidence.
- Escalate before changing authentication, authorization, payments, PII,
  licenses, destructive data operations, production infrastructure, or external
  API assumptions.
- Do not track local runtime artifacts except explicitly tracked audit /
  provider-handover evidence.

### ゼロトラストダウンロード原則 (PO ルール 2026-11-17、両ランタイム共通)

本文は G の同名の節 (外部の依存・Action・バイナリを取得するとき)。

## UT-TDD Workflow

本文は G の同名の節 (Forward / Reverse / Scrum の工程を確かめるとき)。

## Instruction Files

本文は G の同名の節 (指示ファイルの置き場を確かめるとき)。

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
