# 運用規律: review・merge・commit 協調 (operating-rules-review-merge)

Status: canonical
Created: 2026-11-26
Owner: PM / PO
Related: `CLAUDE.md` (索引のみ)、`AGENTS.md`

本書は root `CLAUDE.md` から本文を逐語で移した節を収める (PO 指示 2026-11-26)。
節の見出しは移動前と同一であり、`CLAUDE.md §<見出し>` の参照は本書の同名の節を指す。
本文中の裸の `§<見出し>` は、`CLAUDE.md` の同じ見出しを起点に解決する (`CLAUDE.md` の索引行が移動先を示す)。path 付きの § はそのファイルの見出しを指し、`CLAUDE.md` に無い見出し (例: §委譲と判断層) は `.claude/CLAUDE.md` のものである。

## 運用規律の再締結 (PO ルール 2026-08-03、両ランタイム共通)

規律は既に本ファイル各節に存在するが、遵守が崩れていた (実測: verdict 前 merge #189/#210/
PR #103、cross-review 委譲の素通り #131、doctor 16 並行、bun runaway ×2、手書き memory
PR #167、自己 supersede 7 件 #183)。以下を**再締結**する。新規ルールではなく、既存正本節の
拘束力の再宣言である:

1. **工程**: Forward の pair-freeze を跳ばさない。方式判断 (正本・信頼根・データ形式) は
   実装前に設計文書へ記録し、その改訂を review してから実装する (§UT-TDD Workflow、
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
6. **検証**: 基準点は HEAD のみ。共有 tree の transient を計測・帰責しない
   (§引き継ぎ・検証の基準点)。

**違反時の扱い**: 上記から外れた PR / merge / 委譲は、内容の当否に関わらず
process violation FLAG とし、feedback メモリ (`ut-tdd memory add --kind feedback`) に記録する。遵守の spot-check は
§定期棚卸し (EOD close-out) に載せる (新規機構は建てない — 未計測のままゲート化しない)。

## PR スコープ規律 (PO ルール 2026-08-03、両ランタイム共通)

PR 肥大と方式の場当たり発明の再発防止 (実測: PR #219 は D3 未完のまま D2 を着工し、
receipt 置き場を PR 内で自作した結果、gate / CLI / 保管方式 / audit の複数論点が混入して
close された)。新規機構は作らず、既存工程の遵守を規律として固定する:

1. **順序契約の厳守**: GitHub Issue に記録した実装順序 (例: D1→D3→D2) に従い、依存する正本が
   閉じる前に下流を着工しない。
2. **契約 freeze が実装 PR の前提** (pair-freeze の復元): 正本・信頼根・データ形式などの
   方式判断は実装 PR の中で発明・変更しない。先に設計文書へ方式を記録し、
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
   Refactor Issue (ラベル `refactor`) と設計文書へ回す。非著者 reviewer は commit の順と Refactor commit の `tests/` 差分 0 を確かめ、判定を verdict の行頭 `REFACTOR:` 欄 (`commit-ok` / `none-ok` / `not-applicable` / `commit-tests-changed` / `none-rejected`) に必ず書く。実装 PR (`src/` か `scripts/` を変える PR) では、この欄を `ut-tdd pr merge` が機械で確かめる gate は契約済み (欄の形と規則は `docs/design/harness/L6-function-design/merge-gate-refactor-stage.md`) だが未実装であり、実装は #1300 が持つ。実装されるまで、欄の確認は非著者 reviewer と control の手順である。
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

## FLAG 後の限定是正と merge (PO ルール 2026-09-14、両ランタイム共通)

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
2. **軽作業の定義**: FLAG 是正のうち (a) 上位契約 (設計文書 / test-design の
   凍結 oracle) の変更を伴わない、(b) 新規 source_module を追加しない、(c) 是正 3 回以内で
   blocking 0 に収束する、の全てを満たすもの。(c) を超えたら close→分割再出 (§PR スコープ規律 4)。
3. **差し戻しは契約齟齬だけ**: 上位契約そのものが違うと reviewer が判定した場合は PR 内で直さず、
   契約改訂 (設計文書の pair-freeze) へ戻す。これが設計 owner へ返す唯一の経路であり、
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

## Hybrid 多ランタイム commit 協調 (Claude ↔ Codex、必須)

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

## 委譲した成果物の検収 (両ランタイム共通)

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

## 引き継ぎ・検証の基準点 = HEAD (共有 tree を測るな、必須)

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

## Git Rules (merge 後の確認)

- merge の後は、合流した HEAD で CI / doctor / 回帰の安全確認まで行い、確認した HEAD と結果を PR コメントと
  正規のイベント・証跡に残して相手ランタイムと PO に伝わる状態にする。確認結果そのもの (エピソード状態) は
  メモリに書かない。永続的な決定や教訓が得られたときだけ HARNESS メモリへ昇格させる。merge 条件 (draft 解除・review
  evidence 成立・required CI green) を、Green の偽装 (detector の allowlist 追加、base 負債の PR 固有扱い) で満たしたことにしない。依頼に「merge しない」と
  明記された PR は、その指示を優先する。
