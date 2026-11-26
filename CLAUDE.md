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

ADR-001 に従い、UT-TDD の実装言語は TypeScript/Node とする。旧 W1–W3a の Python は設計の参照資料である。v4 の 1.0.0 では管理知能を作らない。後続で作る場合は、別プロセスの提案専用機能とし、入出力を JSON Schema で定める (ADR-001 決定 4 の運用上の注記)。

## Purpose

本文は docs/governance/operating-rules-general.md §Purpose (設計・実装を判断するとき)。

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

- 「改善する」は**実装すること**を指す。調査・提案で止めない (§教訓はメモリではなく仕組みにして改善する)。
- 工程は記録のために必ず通す。近道で省略しない (§運用規律の再締結 1)。
- Recovery は本線であり、傍流の後回し作業として扱わない。
- 強制停止 (作業の即時中断を要する事態) は最高 severity として扱う。担当作業の完了時には handover が必要である
  (機構は `docs/design/` の forced-stop-feedback / handover-mechanism が正本)。

### GitHub 記載言語 (PO ルール 2026-09-16)

GitHub の Issue / PR / Discussion のタイトル、本文、コメント、レビュー記録、ラベル説明、リリースノートは、
**日本語を原則**とする。タイトルも例外にしない。コード・関数名・型名・変数名・CLI コマンド・Issue / PR ID・
パス・URL・ログ・機械生成フィールド・外部仕様の引用は、正確性を優先して英語または原語のまま記載してよい。
英語の技術用語を含める場合は、周囲の説明と判断理由を日本語で書く。外部引用やログを原文のまま貼る場合も、
要点と対応内容を日本語で併記する。Claude / Codex のどちらが起票・更新してもこの規則を適用し、既存記載を更新する際は
無関係なスコープを広げず、変更対象のタイトル・本文・コメントだけを日本語化する。

### 設計判断エリシテーション (PO ルール 2026-07-13)

本文は docs/governance/operating-rules-general.md §設計判断エリシテーション (PO へ設計判断を仰ぐとき)。

#### PO 判断への反射的エスカレーション禁止 (PO ルール 2026-08-05)

本文は docs/governance/operating-rules-general.md §PO 判断への反射的エスカレーション禁止 (「PO 判断必須」と書いて止まる前)。

## Canonical Docs

本文は docs/governance/operating-rules-general.md §Canonical Docs (正本文書の一覧が要るとき)。

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

共通ルールの正本は本ファイル (`CLAUDE.md`) と、本ファイルが名指しする `docs/governance/` の文書である。
本ファイルの 1 行索引 (「本文は …」) は参照先を示す pointer であり、規範ではない。アダプタファイルは
ランタイム固有事項に限る (`.claude/CLAUDE.md` = Claude Code の hook / subagent / tool 呼び出し、
`AGENTS.md` = Codex CLI 固有の経路と手順)。同じルールを 2 箇所に書けばそこが drift 源になる。
`AGENTS.md` の Core Reads は本ファイルと名指し先の文書を含む。判定に迷ったら「もう一方のランタイムでも
成り立つか」で決める。成り立つなら共通 (本ファイルまたは名指し先)、成り立たないならアダプタ固有。
本文の分割は PO が 2026-11-26 に指示した。分割前の本節は operating-rules-general.md に残す。

## 定期棚卸し (EOD close-out)

本文は docs/governance/operating-rules-general.md §定期棚卸し (セッション終了時)。

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
- PR merge は必ず `ut-tdd pr merge --pr <N>` 経由とし、`gh pr merge` の直叩きで迂回しない。
- merge 後の確認・Green の偽装禁止・「merge しない」指示の優先は docs/governance/operating-rules-review-merge.md §Git Rules (merge 後の確認) (merge するとき)。
- **他ランタイムの commit を `reset` / `revert` / `checkout` / force で破棄・デグレさせない**。
- メモリは必ず `ut-tdd memory add` 経由で書く (手書き禁止。docs/governance/operating-rules-review-merge.md §引き継ぎ・検証の基準点 = HEAD)。

### 運用規律の再締結 (PO ルール 2026-08-03、両ランタイム共通)

本文は docs/governance/operating-rules-review-merge.md §運用規律の再締結 (工程・merge・review の規律を確かめるとき)。

### PR スコープ規律 (PO ルール 2026-08-03、両ランタイム共通)

本文は docs/governance/operating-rules-review-merge.md §PR スコープ規律 (PR を切る・分割するとき)。

### FLAG 後の限定是正と merge (PO ルール 2026-09-14、両ランタイム共通)

本文は docs/governance/operating-rules-review-merge.md §FLAG 後の限定是正と merge (review・merge・FLAG 是正のとき)。

### Hybrid 多ランタイム commit 協調 (Claude ↔ Codex、必須)

本文は docs/governance/operating-rules-review-merge.md §Hybrid 多ランタイム commit 協調 (commit・push・他ランタイムの変更に触れるとき)。

### 委譲した成果物の検収 (両ランタイム共通)

本文は docs/governance/operating-rules-review-merge.md §委譲した成果物の検収 (worker の成果物を受け取るとき)。

### 引き継ぎ・検証の基準点 = HEAD (共有 tree を測るな、必須)

本文は docs/governance/operating-rules-review-merge.md §引き継ぎ・検証の基準点 = HEAD (引き継ぎ・検証・メモリ記録のとき)。

### 教訓はメモリではなく仕組みにして改善する (PO ルール 2026-10-13、両ランタイム共通)

本文は docs/governance/operating-rules-delegation-routing.md §教訓はメモリではなく仕組みにして改善する (教訓を記録するとき)。

### runtime 間のやりとりは GUI lane (PO ルール 2026-10-08、両ランタイム共通)

本文は docs/governance/operating-rules-delegation-routing.md §runtime 間のやりとりは GUI lane (Claude と Codex の間で依頼・review を渡すとき)。

### lane 間の依頼 (待たずに依頼をかける)

本文は docs/governance/operating-rules-delegation-routing.md §lane 間の依頼 (作業が他 lane や control で止まったとき)。

## GitHub Issue Hierarchy

- 正本は `docs/governance/github-issue-hierarchy.md`。
- 新規 Issue の前に既存の成果目標を検索し、bounded slice は GitHub の正式な sub-issue にする。
- top-level Issue は独立した成果目標だけに限定し、`Related` や本文の `Parent: #N` を親子関係の
  代替にしない。
- canonical parent は 1 件。別系統は横断リンクに留め、無関係な移行をブロッカー化しない。
- 親 Issue は必須子 Issue と親固有 AC の両方が完了するまで close しない。
- PR 本文の `Closes #N` と `Refs #N` の使い分けは正本 §4 に従う (本ファイルへ本文を複製しない)。

## Canonical Commands

本文は docs/governance/operating-rules-general.md §Canonical Commands (ut-tdd の正規コマンドを確かめるとき)。

## Model / Effort Routing

本文は docs/governance/operating-rules-delegation-routing.md §Model / Effort Routing (モデル・effort・委譲先を選ぶとき)。

## Skills

本文は docs/governance/operating-rules-general.md §Skills (skill を読み込む・配置するとき)。

## Distribution Repository

本文は docs/governance/operating-rules-general.md §Distribution Repository (Pack repo へ配布・同期するとき)。

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

本文は docs/governance/operating-rules-general.md §ゼロトラストダウンロード原則 (外部の依存・Action・バイナリを取得するとき)。

## UT-TDD Workflow

本文は docs/governance/operating-rules-general.md §UT-TDD Workflow (Forward / Reverse / Scrum の工程を確かめるとき)。

## Instruction Files

本文は docs/governance/operating-rules-general.md §Instruction Files (指示ファイルの置き場を確かめるとき)。

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
