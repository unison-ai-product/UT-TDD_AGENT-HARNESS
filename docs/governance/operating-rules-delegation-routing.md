# 運用規律: 委譲・モデル routing・lane 間運用 (operating-rules-delegation-routing)

Status: canonical
Created: 2026-11-26
Owner: PM / PO
Related: `CLAUDE.md` (索引のみ)、`AGENTS.md`

本書は root `CLAUDE.md` から本文を逐語で移した節を収める (PO 指示 2026-11-26)。
節の見出しは移動前と同一であり、`CLAUDE.md §<見出し>` の参照は本書の同名の節を指す。
本文中の裸の `§<見出し>` は、`CLAUDE.md` の同じ見出しを起点に解決する (`CLAUDE.md` の索引行が移動先を示す)。path 付きの § はそのファイルの見出しを指し、`CLAUDE.md` に無い見出し (例: §委譲と判断層) は `.claude/CLAUDE.md` のものである。

## 教訓はメモリではなく仕組みにして改善する (PO ルール 2026-10-13、両ランタイム共通)

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

## runtime 間のやりとりは GUI lane (PO ルール 2026-10-08、両ランタイム共通)

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
- レーンの中の並列 (Luna の subagent、Claude の Agent tool) は手を動かす層の話であり、closing の権限を持たない。本節は制限しない。上限は
  §Shared Guard Discipline の 8 のまま。

2026-10-08 の決定は Claude の私的メモリと #733 にしか無く、規律の正本に入っていなかった。その間に、
control lane は補助のはずの CLI 経路を記録なしに常用していた (2026-10-13、#998 の昇格対象の実例)。

## lane 間の依頼 (待たずに依頼をかける)

PO 指摘 (2026-10-29、#1465): 「ほかのレーンが能動的に働きかけるようにさせたほうがいい。永遠に待機しやがる」。
control lane の合図を待つことを基本にせず、止まったら相手に依頼をかける。両ランタイム共通で、導入先の lane も同じ。

- **待機を状態として使わない**。自分の作業が他の lane や control で止まったら、待たずに相手へ依頼をかける。
- **依頼に書くもの**: (1) 何をしてほしいか、(2) 対象の Issue / PR と exact HEAD、(3) それが済むと自分が何を
  始めるか、(4) 依頼を出した時刻。
- **依頼の相手**:
  - control: review の request、merge、割り当て、順序、設計判断、高影響境界。
  - ほかの lane: その PR / Issue に直接コメントする。
  - PO: §PO 判断への反射的エスカレーション禁止 の条件を満たす判断だけ (advisor 相談と実測のあとにも残る、PO の
    権限を要する trade-off と、高影響境界)。止まっている時間や督促の回数だけを理由に、PO 判断へ移さない。
- **手が空いて割り当てが無いとき**は、control に割り当てを依頼する。候補 2〜3 件と推奨 1 件を添える。
- **返事が無ければ督促する**。仮の値は「30 分ごとに督促し、2 回督促しても返事が無ければ止まっている依頼として
  上げる」。「上げる」は、止まっている依頼を control の一覧と、PO が見える Issue のコメントで知らせることであり、
  PO に判断を依頼することではない。これは仮の値であり、間隔と回数は #1465 で決める。
- **禁止**: 中身の無い確認 (「進捗どうですか」) と、同じ状態報告の繰り返し。
- **返事を待つ間も、手元で進められる作業を進める**。
- **決まった順序の次の作業**は、前提 (先の PR の merge など) がそろったら依頼を待たずに着手し、着手したことを
  1 回だけ報告する。

根拠 (2026-10-29 実測、#1465): Codex lane は「空きメモリが開始条件に届かない」という同じ報告を条件が変わらない
まま繰り返し、「CI 完了・review お願い」と「進捗の確認」が同じ状態について何回も届いた。朝に割り当てた #1357 と
#1247 は、昼まで control の合図を待って着手されなかった。仕組み (依頼・督促・止まっている依頼の一覧) と Pack への
配布は #1465 の後続で扱い、本節は規律だけを定める。

## Model / Effort Routing (モデルと effort の割当)

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
- Claude: 担当は次のとおり (PO 2026-11-11: 原則 Sonnet か Haiku へ振り、指揮は orchestration を原則とする。
  発見を判断して処理することに専念するほうが価値が高い。Haiku 5.5 は性能が上がったので主力に押し上げ、
  難所の worker に Sonnet を置き、Opus は判断と検証、Fable は PO 前のエスカレーションと大規模設計の相談役にする。
  目的はコストを下げ、速度と精度を上げること)。指揮モデル別の相談先と委譲先は `.claude/CLAUDE.md` §委譲と判断層 の
  「あなたが○○なら」の表を参照する。
  - Fable (`claude-fable-5-2`): PO 前のエスカレーションと大規模設計の相談役 (`ut-tdd advisor`)。
  - Opus (`claude-opus-5-5`): 指揮のときは振り分けと検収に専念する。計画と判断 (順序・方式・FLAG の扱い) は Fable へ投げ、手を動かす作業は Sonnet と Haiku へ振る (PO 2026-11-24)。
    成果物は自分で書き下ろさない。UI デザインの判断も Fable へ投げる。UI を含む PR の closing review は委譲経路で担う。
  - Sonnet (`claude-sonnet-5-5`): **難所の worker**。自明でない実装、設計ドキュメントの起草、
    基準が全部は明示できない編集、決まった UI デザインの実装。
  - Haiku (`claude-haiku-5-5`): **手を動かす作業の主力 (既定の worker)**。web 検索、doc パッチ、
    状態確認、grep / diff の確認、計測、CI ログの失敗の要約、Issue / PR / CI の状態確認、発注文や報告に入れる事実の収集、
    決まった型の PR / Issue 本文・返信・handover、通常の文書修正、基準が明示できるコード・テストの編集。
    例は行番号・引用の確認、対象行が明示された文書編集、PR の差分と変更 path の重なりの確認、
    commit の一覧・diff の範囲・ファイルの有無の収集。
    この既定は Agent tool で worker を出すときの運用の既定である。正規委譲経路 (`ut-tdd claude --role <role>`) の worker の機械の既定は `selectTeamModel` (`src/team/model-policy.ts`) のままで、実装・テストは Sonnet、設計は Opus に振られる。正規委譲経路で Haiku か Sonnet を使うときは `--model` で明示する。
  - 指揮モデル (Fable / Opus) は、手を動かす作業を自分で行わず、既定では Haiku、難所は Sonnet へ委ねる。
  - 委譲するのは、独立した作業が複数あるとき、または 1 つのコンテキストに収まらない量を読むときである。
    1 本の依存した鎖や、すでに自分のコンテキストにある内容で済む作業は委譲せず、自分で行う
    (subagent は文脈を作り直し、報告を読み直す分の費用がかかる)。
    この形の作業で費用を下げる手段は、委譲ではなく effort である。下の基準ラダーより高い effort で走っているなら
    基準へ戻し、基準で足りる作業の effort を上げない (公式の計測では、この形の作業は、指揮モデル単独で effort を
    下げたほうが、安い worker との組より得だった)。
  - 依頼には、1 回で足りるように目的・対象の path / ID・判定の基準・返してほしい形を書く。
    返ってきた結果は作り直さず、抜き取りで検収する。
  - Haiku へ渡す文脈は 10 万トークン以内に収める (超えると単価が 5 倍になる。100 万トークンあたり
    $0.10 / $0.50 が $0.50 / $2.50)。
  - 変えない線引き: 意味の判定と完了の判定は上位モデルか control が確定し、成果物は非著者 review を通す。
    なお 2026-11-02 の実測 (読み取り 3 本で誤り 0、実編集は対象 10 行を正解し誤書き換え 0。一方、前段の棚卸しは 7 行を
    誤分類し、Issue 完了判定 68 件は 3 件誤り) を根拠にした「コードの worker 標準にする根拠はまだ無い」という制限は、
    PO 2026-11-11 の決定で置き換えた。基準が明示できるコード・テストの編集も Haiku の既定 (Agent tool の運用の既定。機械の routing は上記のとおり) とし、基準が全部は明示できない
    作業と意味の判定は Sonnet か上位モデルへ上げる。誤りの件数は引き続き数える。
  - 根拠 (#1599): Anthropic の公式文書 (Choosing the right model / Optimizing for cost and intelligence、
    2026-11-10 確認) は、Haiku 5.5 の用途に subagent の作業を挙げ、指揮モデルと安い worker の組が単独より
    得になった計測は「独立した作業が多いとき」と「1 コンテキストに収まらない量のとき」だけだとしている。
    この数字は Anthropic 社内の計測で、この repo では未計測である。運用で誤りの件数を数えてから、担当の範囲を見直す。
- 作業の守り方は 2 層に分ける (契約: `docs/design/harness/L6-function-design/agent-guard-delegation-boundary.md` §9)。
  **判断する層** (closing review・advisor・merge) は委譲経路 (`ut-tdd claude|codex --role <role>`)・
  review-guard・review custody・`ut-tdd pr merge` だけが持つ。**手を動かす層** (レーン内の並列、草稿・調査・編集)
  は Luna の subagent と Claude の Agent tool の汎用の型 (`general-purpose` / `Explore` / `Plan` / `claude`、
  model 必須・fable 不可) が担う。**Agent tool の subagent は closing の権限を持たず**、その出力は PR の verdict にも
  receipt にも使えない。subagent 定義ファイルは持たず、専門性は作業ごとに skill・判断パック・設計抜粋を task に渡して
  与える。並列の軽量レーンは Luna の subagent と Claude Haiku が担う。
- Effort はモデル別基準ラダー (PO rule 2026-07-28) が既定: Sol/Fable = `low`、
  Opus/Sonnet = `middle`、Luna = `high`。回答が浅い時は
  **まず effort を 1 段、その先はモデルを上げる** (`escalateShallowResponse`):
  Sol/Fable → `middle`、Opus/Sonnet → `high`、そこでも浅ければ
  Sonnet→Opus `middle` / Opus・Luna・Fable→Sol `low`。**`xhigh` は既定として配らない** (PO rule 2026-07-28:
  「xhigh 以上はモデルを上げたほうがいい」)。ラダー外 (haiku 等) は従来既定
  (Claude `high` / GPT `middle`)。明示 `--effort xhigh` は有効で、UI/UX は
  task-kind 例外 (PO rule 2026-07-08)。
(原文は英語。逐語で収める)
```
- Implementation work in `hybrid` is cross-executed and cross-reviewed: the
  non-orchestrating provider executes, and review returns to the other
```
  provider (tier-router implementation lane, PO rule 2026-07-08). FLAG 後の
  軽作業の是正は同 PR 内で author family が行い、同じ非著者 reviewer が exact head を
  再検する (PO rule 2026-09-14、§FLAG 後の限定是正と merge)。
(原文は英語。逐語で収める)
```
- Design/implementation review uses a top reviewer model: GPT frontier
  (`gpt-6.1-sol`) or Claude Opus (`claude-opus-5-5`) or above, behind the
  explicit frontier gate.
```
- advisor (PO rule 2026-07-29、2026-07-14 の行列を supersede): **技術判断**
  (実装方式 / トラブルシューティング) は `gpt-6.1-sol` 一次 (fallback Fable)、
  **設計・進行判断** (設計方式 / レーン選択 / 優先順位 / 段取り) と
  **デザイン/UI 判断** は `claude-fable-5-2` 一次 (次点 `gpt-6.1-sol`)。
  判断種別は `--decision design|progress|implementation|troubleshooting|uiux`
  で明示でき、省略時は task 文から推論する (進行語は technical 語より優先)。
  迷う場合は `ut-tdd advisor --task "..." --current-model <model>` を使い、
  実相談は `--execute` を付ける。
