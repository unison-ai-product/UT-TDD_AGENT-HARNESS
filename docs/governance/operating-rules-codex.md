# 運用規律: Codex ランタイム固有の本文 (operating-rules-codex)

Status: canonical
Created: 2026-11-26
Owner: PM / PO
Related: `AGENTS.md` (索引のみ)、`CLAUDE.md`

本書は root `AGENTS.md` から本文を逐語で移した節を収める (PO 指示 2026-11-26、CLAUDE.md の分割に続く)。
節の見出しは移動前と同一で、末尾に「(Codex 規律)」の付記が付く。`AGENTS.md §<見出し>` の参照は本書の同名の節を指す。
共通ルールの正本は `CLAUDE.md` と operating-rules-*.md であり、本書は Codex 固有の本文だけを持つ。

## コミュニケーション (報連相) (Codex 規律)

チャット上の報連相 (報告・連絡・相談) は **日本語** で行う (PO ルール、2026-06-22)。
進捗報告・調査結論・選択肢提示・確認依頼など PO へ向けた chat 出力は日本語を既定とし、
見出し・箇条書きラベルも日本語を優先する。これは Claude / Codex 両ランタイム共通のルール
(`CLAUDE.md` / `.claude/CLAUDE.md` と同一)。

ただし成果物はそれぞれの規約に従う: コード/識別子/commit message は従来どおり、ファイル名は
英語 (文字化け回避)、技術用語・コマンド・Issue ID・パスは原語のまま埋め込んでよい (無理に和訳しない)。

**ドキュメント本文 (`docs/` 配下の ADR / design / test-design / governance 等) は日本語で書く**
(PO ルール、2026-06-30。Claude / Codex 両ランタイム共通)。コード・識別子・コマンド・Issue ID・パスは
英語/原語のまま。Windows 文字化けは UTF-8 化 (`.editorconfig` charset=utf-8 / `.gitattributes` eol=lf) と
`readability` gate (mojibake fail-close) で防ぐ前提であり、**文字化け回避を理由に doc を英語化しない**。

### 設計判断エリシテーション (PO ルール 2026-07-13) (Codex 規律)

PO への質問は **設計判断 (trade-off が実在する方式選択 / spec 未確定点) に限る**。
進捗確認・実行許可・自力で確定できる事実は聞かない (可逆作業は進める)。聞き方は
`docs/governance/design-decision-elicitation.md` の共通フォーマットに従う。Codex には
構造化質問ツールが無いため、`## 設計判断依頼` 見出し + 選択肢表 (案 / 得るもの / 失うもの、
推奨を先頭に「(推奨)」+ 理由 1 行) の markdown を出力して停止する。採択結果は設計文書、GitHub Issue または ADR に記録する (skill: `skills/design-decision-elicitation.md`)。

## Core Reads の補足段落 (Codex 規律)

移行時のスナップショットと棚卸し表は Core Reads ではない。`docs/migration/` は、移行・ギャップ監査・回帰元の確認が必要なときだけ読む。
これを UT-TDD の実行時状態や実行経路として扱わない。

`docs/design/harness/L3-functional/roadmap.md` を通常の起動時の読み取りに含めない。検証ロードマップは、V-model の freeze 境界で検証サイクルを回すときだけ動的に読む。通常の作業は、L0 から L14 への Forward の降下経路に従う。

ADR-001 は拘束力を持つ。以前のフレームワークは設計の参照元にすぎない。UT-TDD の中核実装は TypeScript/Node である。旧 W1-W3a の Python は製品の実行時として移植しない。
薄い `.ps1` / `.sh` の入口が、コンパイル済みまたは Node ベースの TypeScript core を呼んでよい。UT-TDD が管理するリポジトリの言語は、ハーネスの実装言語とは独立である。

`docs/archive/` は正本ではなく、履歴資料にすぎない。fork が完了したため、HELIX の vendor スナップショットは削除済みである (`docs/migration/helix-fork-completion-plan.md` §11 を参照)。

## TL Driven Mode (Codex 規律)

Codex CLI を他の有効なランタイム無しで使うときは、その slice の technical lead として振る舞う。これは Claude Code の代わりになるものではなく、`codex-only` または `standalone` のモードで Codex が実行・検証・ゲート判断を行えるという意味である。

- 可能なら、設計・実装・レビュー・テスト・検証を通して進める。
- 編集の前に、関連する既存ファイルを読む。
- 既存の構造・命名・テストの置き場所に合わせる。
- 変更の規模が求めるときは、最終応答でゲートの結果を述べる。
- 本番インフラ・認証・認可・決済・PII・secret・ライセンス・外部 API・その他の影響の大きい環境前提を変える前に、エスカレーションする。

## UT-TDD Workflow (Codex 規律)

- Forward: `plan` -> `pair-freeze` -> `implement` -> `trace-freeze` -> `review` -> `accept`
- Reverse: `R0` → `R1` → `R2` → `R3` → `R4` → Forward への合流 (`docs/process/modes/reverse.md`)
- Scrum / PoC: `S0 backlog` -> `S1 plan` -> `S2 poc` -> `S3 verify` -> `S4 decide`
- 追加変更: 既存の設計を保ち、`add-design` / `add-impl` で差分を足す。
- Handover: `.ut-tdd/handover/` をセッション間・ランタイム間の引き継ぎ元として使う。

## Codex / Claude Code Harness (Codex 規律)

Codex と Claude Code は、契約 plan・ローカル CLI・hook を通じて UT-TDD Agent Harness が管理する。この製品では API の直接呼び出しではない。

ランタイム mode:

- `standalone`
- `claude-only`
- `codex-only`
- `hybrid`

正規コマンド:

- Codex 実行: `ut-tdd codex --role <role> --task "..."`
- Claude の prompt 生成: `ut-tdd claude --role <role> --task "..."` (`--execute` 無しは dry run)
- チームへの委譲: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
- タスク分類: `ut-tdd task classify --text "..."`
- skill の推薦: `ut-tdd skill suggest --text "..."`
- レビュー packet: `ut-tdd review --uncommitted`
- Handover: `ut-tdd handover`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`

複数の AI ランタイムが使えるときは、創出と判断を分ける。設計判断・判断ゲート・R4 の merge 判断は、別のランタイム / モデル family を通す (`hybrid` では MUST。同 family の reviewer は拒否される。`src/feedback/review-admission-check.ts` の `same_family_reviewer_denied`)。
単一ランタイムの mode では、レビューの代替として `intra_runtime_subagent` を記録し、証跡を残す。

lane 間の依頼 (止まったら待たずに control / ほかの lane / PO へ依頼をかける) は
`CLAUDE.md` §lane 間の依頼 が正本。

### あなたが○○なら (Codex 指揮モデル別の振る舞い、PO ルール 2026-10-09) (Codex 規律)

Codex 側で使うモデルは GPT-6 の Astra / Sol / Terra / Luna の 4 つだけである (委譲経路の ID の正本は
`src/team/model-policy.ts` の `MODEL_IDS`)。自分の行に従い、解けない判断は **1 段上へ相談する**。

| あなたが | 解けない判断・難所 | やること | 仲間 (下に回す先) |
|---|---|---|---|
| Astra (`gpt-6-astra`) | ― | 常用しない。Sol から、超局所の難所の相談だけを受ける | ― |
| Sol (`gpt-6.1-sol`) | どうしても解けないときだけ Astra に相談する | 常用。自分で判断し、control lane (Claude) と相談しながら Luna に振り、上がってきた成果を検収する | Luna |
| Terra (`gpt-6.1-terra`) | フロントエンド・UI と設計の判断だけ Sol に相談する | 指揮。Claude 側の Sonnet と同じ位置づけで、チケットを分けて Luna に振り、上がってきた成果を検収し、Issue / PR に返事する。実装は自分でせず Luna に任せる | Luna |
| Luna (`gpt-6-luna`) | Sol に相談する | worker。control lane の指示を受けて実装・テスト実装・文書修正・探索を行う | Luna の subagent (手を動かす層。仲間を増やして並列に戦う) |

- Sol の「検収」は PR を出す前の族内チェックであり、closing review の代わりにしない。Codex 著の成果物の
  closing review は従来どおり Claude Opus が行う (§Blind review role、`CLAUDE.md` §FLAG 後の限定是正と merge)。
- Luna の仲間 (subagent) は手を動かす層であり、closing の権限を持たない。判断する層 (closing review・advisor・merge) は委譲経路 (`ut-tdd claude|codex --role <role>`) と review custody だけが持つ (正本: `CLAUDE.md` §Model / Effort Routing の 2 層)。
- Astra は `MODEL_IDS` に未登録であり、相談するときは明示の `--model gpt-6-astra` で呼ぶ。
- Terra は GUI lane の指揮でだけ使い、`MODEL_IDS` には登録しない (委譲経路の role には割り当てない)。
  Terra が指揮しても、Codex 著の成果物の closing review は Claude Opus が行い、指揮の検収はその代わりにならない。
  worker は Luna のまま変えない (PO 2026-10-27)。
- PO へ上げてよい条件は `CLAUDE.md` §PO 判断への反射的エスカレーション禁止 のまま。
- Claude 側の同じ表は `.claude/CLAUDE.md` §委譲と判断層 にある。

### Blind review role (`--role blind-reviewer`) (Codex 規律)

`ut-tdd codex --role blind-reviewer --task "<packet>"` は blind review の Codex 側である。`blind-reviewer` / `blind-review` は読み取り専用の委譲 role であり、レビュー session は非破壊でなければならない (review-guard が強制する)。そのため、この role は調べて報告するだけで、task の範囲外の実装や編集は決してしない。

この role は、著者の説明ではなく成果物を判定する。packet を組むときは、著者の主張・自己評価・述べられた意図・過去の verdict・著者の identity / ランタイムを渡さない。2 つの lane を回し、別々に報告する。

- **claim-blind (main)**: 成果物 + spec/AC + 自分で流したテスト。著者の主張に関わらず、成果物が spec を満たすかを判定する。
  散文の主張 (`N green`、`blast radius 0`、`fully covered`) は証拠ではない (`coding ≠ substance`、PLAN-L7-89)。packet に現れた場合は、指摘して無視し、spec + テスト結果から verdict を導き直す。
- **spec-blind (safety net)**: 成果物だけを見て、spec も渡さない。内部の健全性 (自己矛盾・明白なバグ・覆われていない境界・dead code) を判定する。要件を満たすかどうかは、この lane の範囲外である。

`skills/adversarial-review.md` の valid-attack の分類と、引用だけによる反駁を使う。verdict は、FLAG (反駁されない attack がある)、PASS (すべての attack を引用で反駁した)、PASS-WEAK (attack が見つからず、試した attack が 3 つ以上の試行ログを添える) のいずれかである。`hybrid` では、変更を書いていない provider へ blind review を回し、attacker と defender の provider が分かれたままにする。Claude 側の対応は `ut-tdd claude --role blind-reviewer` である (委譲経路の role であり、Agent tool の subagent ではない。ハーネスは subagent 定義ファイルを持たない、#1002)。

FLAG 後の**軽作業の是正は同 PR 内で往復する** (PO ルール 2026-09-14、正本: `CLAUDE.md`
§FLAG 後の限定是正と merge)。Codex 著 PR では Claude Opus が FLAG → Codex (Luna、別 session)
が同 PR 内で是正 → Opus が新 exact head を再検。Claude 著 PR では Sol が FLAG → Claude が
是正 → Sol が再検し、Claude control lane が wrapper merge する。blind-reviewer role 自体は
read-only のまま。契約改訂へ戻すのは上位契約の齟齬だけ。

Model / effort routing defaults (task-kind ベース、PO rule 2026-07-14):

- Codex (GPT-6 の 4 モデルだけ、PO 2026-10-09 / 2026-10-27): 実装/テスト実装/ドキュメント修正/軽量探索 =
  Luna (`gpt-6-luna`、effort `high`); 検証/設計/判断 = Sol (`gpt-6.1-sol`、effort `low`);
  GUI lane の指揮 = Terra (`gpt-6.1-terra`。フロントエンド・UI と設計の判断だけ Sol に相談する);
  超局所の難所の相談だけ = Astra (`gpt-6-astra`、常用しない)。指揮モデル別の振る舞いは
  `AGENTS.md` §Codex / Claude Code Harness の「あなたが○○なら」の表。
- Claude (PO 2026-11-11): 手を動かす作業の主力 = Haiku (`claude-haiku-5-5`);
  難所 (自明でない実装・設計ドキュメント起草) = Sonnet (`claude-sonnet-5-5`);
  判断と検証・UI デザインの判断・レビュー = Opus (`claude-opus-5-5`);
  PO 前のエスカレーションと大規模設計の相談 = Fable。詳細は `CLAUDE.md` §Model / Effort Routing。
- 並列の軽量レーンは Luna の subagent と Claude Haiku が担う (手を動かす層。closing の権限を持たない。正本: `CLAUDE.md` §Model / Effort Routing の 2 層)。
- Effort はモデル別基準ラダー (PO rule 2026-07-28) が既定: Sol/Fable = `low`、
  Opus/Sonnet = `middle`、Luna = `high`。回答が浅い時は
  **まず effort を 1 段、その先はモデルを上げる** (`escalateShallowResponse`):
  Sol/Fable → `middle`、Opus/Sonnet → `high`、そこでも浅ければ
  Sonnet→Opus `middle` / Opus・Luna・Fable→Sol `low`。**`xhigh` は既定として配らない** (PO rule 2026-07-28:
  「xhigh 以上はモデルを上げたほうがいい」)。ラダー外 (haiku 等) は従来既定
  (Claude `high` / GPT `middle`)。明示 `--effort xhigh` は有効で、UI/UX は
  task-kind 例外 (PO rule 2026-07-08)。
- 設計・実装のレビューは、最上位の reviewer モデル (GPT frontier の `gpt-6.1-sol`、または Claude Opus の `claude-opus-5-5` かそれ以上) で行い、明示の frontier gate の背後に置く。
- 正規委譲経路 (`ut-tdd codex/claude --role <role>`) は上記 routing を機械強制する
  (PLAN-L7-255、`src/team/delegation-routing.ts`): 未登録 role は fail-close、
  判断ゲート role (reviewer / blind-reviewer / qa / tl 等) は族内 frontier reviewer tier
  へ固定、worker role は intent 推定既定。明示 `--model`/`--effort` が常に優先。
  effort は codex にも argv (`-c model_reasoning_effort=...`) で実注入される。
- advisor (PO rule 2026-07-29、2026-07-14 の行列を supersede): **技術判断**
  (実装方式 / トラブルシューティング) は `gpt-6.1-sol` 一次 (fallback Fable)、
  **設計・進行判断** (設計方式 / レーン選択 / 優先順位 / 段取り) と
  **デザイン/UI 判断** は `claude-fable-5-2` 一次 (次点 `gpt-6.1-sol`)。
  判断種別は `--decision design|progress|implementation|troubleshooting|uiux`
  で明示でき、省略時は task 文から推論する (進行語は technical 語より優先)。
  迷う場合は `ut-tdd advisor --task "..." --current-model <model>` を使い、
  実相談は `--execute` を付ける。

旧コマンドを、現在の社内・製品の実行経路として加えない。

## Skills (Codex 規律)

- 合致する trigger の `SKILL.md` だけを読む。
- すべての skill を一括で読み込まない。
- `references/` は、skill の directory からの相対で解決する。
- Pack / runtime の skill の中身は root の `skills/` に置く。実行できる skill 資産を、説明用の `docs/` の内容から分けるためである。
- `src/skill-engine/` は、skill の推薦・注入・scaffold のための TypeScript 実装コードである。skill の中身の directory ではなく、ハーネス core の他のコードと同じく `src/` の下に置く。
- `docs/skills/` の下にある旧来由来の skill 資料は、task が明示的に対象にしない限り、source リポジトリの参照・移行資料である。Pack の runtime skill root として扱わない。

## Distribution Repository (Codex 規律)

- 開発元リポジトリ: `unison-ai-product/UT-TDD_AGENT-HARNESS`。
- クリーンな配布 Pack リポジトリ: `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack` (`https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`)。
- クリーンな Pack の成果物を公開するときは、Pack リポジトリへ push / export し、開発元リポジトリへ戻さない。
- この開発元リポジトリから既存の Pack checkout への標準のローカル反映は、`ut-tdd distribution sync-pack --repo-dir <Pack checkout>` である。
  `--prune-local` は、クリーンな Pack の成果物の集合に含まれないローカルファイルを意図して削除するときだけ使う。このコマンドは commit も push もしてはならない。出力を確認し、Pack リポジトリの commit / push は、人が review する別の手順として行う。

## Editing Rules (Codex 規律)

- 対象のファイルを、編集する前に読む。
- 追跡対象の散文やソースを PowerShell で読むときは、UTF-8 を明示する (例: `Get-Content -Encoding utf8`)。または Node のファイル読み取りを使う。
  日本語の文を、何も指定しない `Get-Content` や ANSI 既定の出力で信用しない。表示上の文字化けを docs へ貼り戻すと、実際のファイル破損になりうる。リポジトリの gate は、UTF-8 BOM 無しと文字化けの fail-close を `readability` で強制する。
- 既存のコード構造・命名・テストの置き場所に合わせる。
- 最小実装を優先する: 要件を満たす最短の解を選び、投機的な型・契約・層・機能の積み増し (over-engineering) をしない。object-oriented DDD はドメインを小さく凝集させ code 量を減らすための手段であって ceremony を増やすためではない。DDD が code を膨張させているなら設計を疑う。正本は `docs/governance/coding-rules.md` の「最小実装原則」。
- 既存の未 commit の変更と、**もう一方のランタイム (Claude) が作った commit** を、正当な作業として扱う。明示の指示なしに revert / reset / checkout しない。
- secret・PII・credential を、docs・規則・例・監査証跡に書かない。

## Git Rules (hybrid 多ランタイム協調) (Codex 規律)

- Conventional Commits を使う。path を明示して stage する (`git add <path>`。`git add -A` / `git add .` は使わない)。
- PR merge は必ず `ut-tdd pr merge --pr <N>` 経由とし、`gh pr merge` の直叩きで迂回しない。
- **history を書き換える前に `git log` / `git reflog` を確認**し、もう一方のランタイム
  (Claude) の commit を `reset` / `revert` / `checkout` / force で破棄・デグレさせない。
  working tree の foreign 変更は既定で「相手ランタイムの正規作業」とみなす。判断不能なら
  revert せず PO 確認。
- 自分の成果は相手の commit の上に積み、相手のファイルに触れない。
- **commit 直前に `git status` + `git diff --staged` (or `ut-tdd review --staged` /
  `--uncommitted`)** で、authored した意図ファイルのみが staged であることを検証する。
- push 済み履歴は破壊しない。
- **引き継ぎ・検証の基準点は commit/push 済 HEAD ただ一つ**。hybrid では working tree を
  相手ランタイムが常時書き換えるため、full tree の計測値は transient で非正本。検証は HEAD
  (+ 自分の意図変更のみ) に固定し、測定値が動いたら相手を疑う前に自分の baseline を疑う
  (foreign tree の transient を相手の退行と帰責しない)。引き継ぎ feedback は harness.db
  (`feedback_events`、PLAN-L7-110) から受け取り、stale 化する prose handover を正本にしない。
- **永続教訓は共有 HARNESS メモリへ昇格する** (`ut-tdd memory add`、正本 `.ut-tdd/memory/`、
  PLAN-L7-189)。PO ルール・教訓・落とし穴をランタイム私的メモリや chat 止まりにしない。
  **メモリファイルの手書き作成は禁止** — frontmatter (memory_id/kind/title/tags/updated_at)
  欠落は db rebuild が fail-close し CI が赤化する (2026-07-28 実例: PR #167)。必ず
  `ut-tdd memory add` 経由で書く。
  エピソード状態 (進捗・次の一手) はメモリに書かず、DB/HEAD 由来の digest に任せる
  (stale 化する層を作らない)。

## GitHub Issue Hierarchy (Codex 規律)

- 正本は `docs/governance/github-issue-hierarchy.md`。
- 新規 Issue の前に既存の成果目標を検索し、bounded slice は GitHub の正式な sub-issue にする。
- top-level Issue は独立した成果目標だけに限定し、`Related` や本文の `Parent: #N` を親子関係の
  代替にしない。
- canonical parent は 1 件。別系統は横断リンクに留め、無関係な移行をブロッカー化しない。
- 親 Issue は必須子 Issue と親固有 AC の両方が完了するまで close しない。

## Doctor Invocation Discipline (PLAN-L7-442) (Codex 規律)

`ut-tdd doctor` は長時間の **singleton** 検査。2 本目以降は exit 2
(保持者 pid 付き) で fail-fast する。

doctor の共有動作と書き込み境界は、root `CLAUDE.md` の §Shared Guard Discipline を参照。

- exit 2 (already running) は **実行中 doctor の完了を待つ**。再試行しない。
  起動形を変えた再実行 (`node -e` / `--json` / `runDoctor` 直呼び) もしない。
  再試行嵐はマシンを飢餓させる (2026-07-16 incident: doctor 16 本並列、
  物理メモリ残 31MB)。
- 一部だけ要るなら scoped 実行 (`--scope toolchain`、テスト内の check 関数直呼び)
  を優先する。

## Test Rules (Codex 規律)

- docs の変更: `rg` で、WSL2 必須とする記述・移行元を現行として扱う記述・個人の絶対パス・文字化けの marker といった古い前提を確かめる。
- Bash の変更: `bash -n <changed-script>`。
- PowerShell の変更: `powershell -NoProfile -ExecutionPolicy Bypass -File <changed-script>`。
- TypeScript core の変更: `tsc --noEmit` に加えて、対象を絞った `vitest`。
- CLI / hook の変更: 関係するときは、Windows PowerShell と POSIX shell の両方の経路で smoke test を行う。
