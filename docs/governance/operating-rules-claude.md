# 運用規則 (Claude Code 固有)

`.claude/CLAUDE.md` から本文を移した Claude Code 固有の運用規則である (PO 指示 2026-11-26、指示ファイルは 10,000 文字以下)。`.claude/CLAUDE.md` は見出しと 1 行の索引だけを残し、Hooks 一覧・Subagent Guard の Allowlist・Adapter Rule Markers は機械照合のため原文のまま残している。日本語の節は逐語で移し、英語だった節は意味を変えずに日本語へ訳した。

## 着手前 advisor 合意形成 (PO ルール 2026-07-28、Claude 固有)

Opus が orchestration を担当するとき、**設計・実装・修正の方式判断は着手前に
`ut-tdd advisor` で合意形成する**。Fable が指揮するときは、設計・進行・UI の判断は自分で決めて記録し
(advisor の一次が自分自身のため)、技術判断だけ `ut-tdd advisor` で Sol に掛ける。Sonnet が指揮するときの
相談先は Opus であり、advisor は使わない (§委譲と判断層 の「あなたが○○なら」の表)。対象は「trade-off が実在する方式選択」に限る
(`docs/governance/design-decision-elicitation.md` と同じ線引き。自明な修正・可逆な作業・
自力で確定できる事実は対象外)。

- 実行: `ut-tdd advisor --decision <kind> --current-model <model> --execute --task "..."`
  技術判断 (implementation / troubleshooting) は `gpt-6.1-sol` 一次、設計・進行判断 (design / progress) と
  デザイン/UI は `claude-fable-5-2` 一次 (Model / Effort Routing 節、PO 2026-07-29)。
  レーン選択・着手順・優先順位は **progress** であって技術判断ではない。
- **advisor の回答を鵜呑みにしない**。前提が事実か実測で確かめ、食い違ったら実測を突き返す
  (2026-07-28 実例: doctor 二重実行の方式判断で、memo 共有テストが 1 件でなく 19 件という
  実測を差し戻して初回推奨が撤回された)。
- 採択結果は対応する設計文書または GitHub Issue へ記録する。推奨と異なる決定 (override) をした場合は、
  その根拠となる実測 (run URL / テスト名 / 計測値) を併記する。

これは運用上の規則である。遵守は既存の発火ログで随時 spot-check できる。`ut-tdd advisor` は
`.ut-tdd/logs/session/advisor-<provider>-<ts>.jsonl` を書き、`projectHookEvents` が
harness.db の `hook_events` へ投影する。session_id は `advisor-` で始まる。

```bash
# 既存ログの advisor 発火件数を数える
node -e "const fs=require('fs'),d='.ut-tdd/logs/session';let n=0;for(const f of fs.readdirSync(d).filter(x=>x.startsWith('advisor-')))for(const l of fs.readFileSync(d+'/'+f,'utf8').split(/\r?\n/)){if(l.trim()&&JSON.parse(l).event_type==='tool_use')n++}console.log(n)"
```

## 委譲と判断層 (PO ルール 2026-07-28、Claude 固有)

**作業は下位モデルへ委ねて判断層を厚くする。** orchestrator (Fable / Opus) が自分で
書き下ろすのではなく、創出は worker tier、判断は frontier tier に置く。Sonnet が指揮するときも
通常の作業は Haiku へ振り、難所だけ自分で行う (「あなたが○○なら」の表の Sonnet 行)。

- 手を動かす作業の主力 = Haiku (`claude-haiku-5-5`)。難所 (自明でない実装・設計文書の起草) = Sonnet
  (`claude-sonnet-5-5`)。実装 = Codex 側 worker (Luna `gpt-6-luna`)。範囲の正本は `CLAUDE.md` §Model / Effort Routing。
- orchestrator (Fable / Opus) は orchestration を原則とし、発見を判断して処理することに専念する。
  Opus は判断と検証、Fable は PO 前のエスカレーションと大規模設計の相談役である。
- 判断ゲート (review / blind-review / qa / tl / security) は族内 frontier tier。
  正規委譲経路 (`ut-tdd codex|claude --role <role>`) がこの routing を機械強制する
  (`src/team/delegation-routing.ts`、未登録 role は fail-close)。

**review は成果物を書いていない family の上位モデルで行う** (attacker/defender 分離):

- Codex が実装 → **Claude** が review。Claude が実装 → **Codex** が review。
- closing review の証跡は、対象の PR と同じ head に結び付いた review custody の receipt に残す。
- 単一 runtime しか使えない場合のみ `intra_runtime_subagent` を記録する
  (cross_agent を僭称しない)。
- **FLAG 後の軽作業是正は同 PR 内で往復する** (PO ルール 2026-09-14、正本: `CLAUDE.md`
  §FLAG 後の限定是正と merge)。Codex 著 PR では Claude Opus (blind-reviewer) が FLAG → Codex が
  同 PR 内で是正 → Opus が新 exact head を再検。Claude 著 PR では Sol が FLAG → Claude (Sonnet 是正、
  別 session) → Sol が再検 → Claude control lane が wrapper merge。review の族分離は変えない。

### あなたが○○なら (指揮モデル別の振る舞い、PO ルール 2026-10-09)

指揮 (orchestration) を担当するモデルは、自分の行に従う。PO が `/model` でどのモデルを選んでも
指揮が回るようにするためであり、迷った判断は **1 段上のモデルへ相談する**。

| あなたが | 迷った判断・難所 | レビュー・UI デザイン判断 | 通常の作業 | 軽い作業 |
|---|---|---|---|---|
| Fable | 自分で決めて記録する。技術判断だけ Sol に相談する (`ut-tdd advisor`)。PO 前のエスカレーションと大規模設計の相談役でもある | 委譲経路 (`ut-tdd claude --role` / `ut-tdd codex --role`、Opus / Sol) | Haiku (難所は Sonnet) | Haiku |
| Opus | 計画と判断は自分でせず、全て Fable へ投げる (`ut-tdd advisor` の `--decision design` / `progress` / `uiux`、技術判断は Sol)。自分の仕事は、誰に振るかを決めることと、結果を抜き取りで検収して PO へ報告することだけ | closing review は委譲経路 (`ut-tdd claude --role` / `ut-tdd codex --role`) | Haiku (難所は Sonnet) | Haiku |
| Sonnet | Opus に相談する (Agent tool の汎用の型に `model: opus` を渡す。相談の回答は closing の根拠にしない) | 委譲経路 (`ut-tdd claude --role <role>`、Opus) | Haiku (難所は自分) | Haiku |
| Haiku | 指揮をしない。判断が出たら Sonnet に相談する | ― | ― | 自分 |

- Agent tool の subagent は手を動かす層 (草稿・調査・並列作業) であり、closing の権限を持たない。レビューの verdict・merge の根拠は
  委譲経路 (`ut-tdd claude|codex --role <role>`) と review custody だけが持つ (`CLAUDE.md` §Model / Effort Routing の 2 層)。
- 「通常の作業」は手を動かす作業全般 (型が決まった書き物・通常の文書修正・基準が明示できるコード・テストの編集) で、
  既定は Haiku、難所 (自明でない実装・設計文書の起草・基準が全部は明示できない編集・決まった UI デザインの実装) は Sonnet。
  「軽い作業」は読む・確かめる・集める作業 (gh の状態確認・grep・CI の見張り・CI ログの要約・diff の確認) で Haiku。
  意味・完了の判定は任せない。例は短く挙げただけで、範囲・委譲する形としない形・
  Haiku の文脈上限の正本は `CLAUDE.md` §Model / Effort Routing。
- どの行でも変えないもの: モデル割当は Model / Effort Routing (`CLAUDE.md`) と
  `src/team/delegation-routing.ts` の機械強制に従う。review の族分離 (Codex 著 → Claude Opus、
  Claude 著 → Codex Sol) は指揮モデルに依らない。PO へ上げてよい条件は `CLAUDE.md`
  §PO 判断への反射的エスカレーション禁止 のまま (相談しても割れた trade-off と高影響境界だけ)。
- 根拠 (2026-10-09 実測): Sonnet で control lane を回した間に、古い wake 通知への 1 行返事に
  数十ターンを使い、自分で決めるべき canary.7 の時期を PO に尋ね、#939 の再検が遅れた。
  1 段上へ相談する経路が無かったことが原因である。
- 根拠 (PO 2026-11-11): 原則 Sonnet か Haiku へ振り、指揮は発見の判断と処理に専念する。Haiku 5.5 の性能向上で主力に
  押し上げ、難所に Sonnet、判断と検証に Opus、PO 前の相談と大規模設計に Fable を置く。コストを下げ、速度と精度を上げる。
- ルールであって機械強制ではない。同じ失敗が再発したら、SessionStart で指揮モデルの行を表示する
  仕組みを検討する。

### lane 間の依頼

止まったら待たずに依頼をかける規律は `CLAUDE.md` §lane 間の依頼 が正本 (両ランタイム共通)。

### 唯一の回避条件: 利用上限による停止

上記の委譲・cross-review 構造を外してよいのは (「あなたが○○なら」の表の Sonnet 行の自己実行は
委譲構造の一部であり、ここでいう回避ではない)、**担当すべき family / tier のモデルが
利用上限 (rate / usage cap) で停止していて実行できないときだけ**。それ以外の理由
(急ぎ・面倒・コスト・自分で書いた方が速い) は回避理由にならない。

回避する場合は理由を記録する (どのモデルが、いつ、どの上限で止まったか)。回避のまま
`cross_agent` を称してはならない — 上限で別 family を使えなかった場合は
`intra_runtime_subagent` として記録し、上限解除後に cross review を取り直す。


## Doctor Invocation Discipline (PLAN-L7-442) の本文

`ut-tdd doctor` は長時間かかる **singleton** の検査である。同時にもう 1 本起動すると exit 2 と保持者の pid で即座に失敗する。doctor の共通の挙動と書き込み境界は、root `CLAUDE.md` §Shared Guard Discipline の doctor の bullet を参照する。

- exit 2 (すでに実行中) は **実行中の doctor を待つ** という意味である。retry しない。別の起動形 (`node -e`、`--json`、`runDoctor` の直接呼び出し) で再起動しない。retry の嵐はマシンを枯渇させる (2026-07-16 の事故: doctor が 16 本並行し、空きメモリ 31MB)。
- 一部だけが必要なときは、範囲を絞った検査 (`--scope toolchain`、テストでの check 関数の直接呼び出し) を使う。

## Subagent Guard の規則本文

契約は `docs/design/harness/L6-function-design/agent-guard-delegation-boundary.md`。

1. `tool_name` のない envelope はブロックされ、迂回できない。
2. `subagent_type` は `.claude/CLAUDE.md` の Allowlist にある汎用の型のいずれかでなければならない (完全一致、大文字小文字を区別する)。harness は subagent 定義ファイルを持たない (#1002)。専門性は作業ごとに skill・判断パック・設計抜粋として渡す。
3. 明示的で正規化できる model を持たない Agent 呼び出しはブロックされる。
4. `fable` は Agent tool では許可されない (最上位 tier は委譲経路に残す)。
5. guard に model の下限はない。判断ゲートの下限は `REVIEW_GATE_ROLES` (`src/team/delegation-routing.ts`) にある。
6. subagent は closing の権限を持たない。出力は review の verdict にも merge の根拠にもならない。closing review は `ut-tdd claude|codex --role <role>` と review custody を通す。
7. 迂回は `UT_TDD_ALLOW_RAW_AGENT=1` のときだけ許される (type・model・fable の検査のみ)。証跡を残さなければならない。不正な stdin JSON や検証できない状態は fail closed とする。

`blind-reviewer` は判断ゲートの role 名であり、Agent tool の subagent ではない。`ut-tdd claude|codex --role blind-reviewer` で呼び出し、成果物を仕様と自分で走らせたテストだけで判定する。orchestrator は packet を組むとき、著者の主張・自己評価・意図・過去の verdict・著者の識別を渡さない。`hybrid` では、変更を書いていない provider で blind review を行う。単一 runtime のモードでは代わりに `intra_runtime_subagent` の証跡を記録する。FLAG 後の軽作業の是正は author family が同 PR 内で行い、同じ非著者 reviewer が新 exact head を再検する。契約改訂へ戻すのは上位契約の齟齬だけである (`CLAUDE.md` §FLAG 後の限定是正と merge)。

## Parallel Task Limit の本文

互いに依存しない作業は並列に投入してよい。Agent tool による lane 内の並列の既定の上限は subagent slot **8** である (`src/runtime/agent-slots.ts` の `DEFAULT_MAX_PARALLEL`、IMP-050)。`agent-slots` は fire / release を記録し、active な slot が上限に達すると警告するが、上限を超えても hard-block はしない (fail-open の助言であり、fail-close の gate ではない)。これは `src/runtime/agent-slots.ts` と `docs/design/harness/L6-function-design/agent-slots.md` が指す参照の復元である (PLAN-RECOVERY-12、issue #85)。

## Guard Rules の本文

- 認証・認可・決済・PII・ライセンス・本番基盤・破壊的操作・外部 API の前提を変える前に、エスカレーションする。
- `PreToolUse(Edit|Write|MultiEdit)` は、現在の Claude session が触れていない未 commit のファイルへの編集をブロックする。一方のランタイムが他方の作業中の変更を上書きするのを防ぐためである。迂回は `UT_TDD_ALLOW_FOREIGN_EDIT=1` (env、人間が管理する out-of-band) か、session の途中で `.ut-tdd/state/foreign-edit-override` へ空でない理由を書くことで行う。marker による迂回は `.ut-tdd/logs/foreign-edit-overrides.jsonl` に監査記録される。空の marker は迂回にならない (理由の記録がない silent override を作らない)。marker は **one-shot** で、許可した foreign edit で消費 (削除) されるので、古い marker が guard を迂回し続けることはない。env の迂回は人間が管理し、消費されない。
- foreign-edit-override の marker は **書いた session に紐付かない**。消費される前にこれを読んだ任意のプロセスが使える。同時に動く session 間の first-come, first-served であり、書いた側の次の foreign edit だけを許可する承認ではない (2026-07-17T01:33:51 に観測。別の session が他の session の marker を消費した。`.ut-tdd/logs/foreign-edit-overrides.jsonl` を参照)。
- `legacy local state/` を現行の runtime state として扱わない。
- 秘密情報・PII・認証情報を docs・例・監査証跡に書かない。
- 明示された fail-open / fail-close の hook 設計を尊重する。hook の失敗を黙って無視しない。
- Native Windows の挙動を第一級として扱う。WSL2 は任意の互換であり、必須条件ではない。

