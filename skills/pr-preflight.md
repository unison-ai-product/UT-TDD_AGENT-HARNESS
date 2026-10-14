---
schema_version: skill.v1
name: pr-preflight
skill_type: process
applies_to:
  layers:
    - L7
    - L8
    - L10
    - L12
    - L14
  drive_models:
    - Forward
    - Add-feature
    - Reverse
    - Recovery
    - Refactor
    - Retrofit
decision_points:
  - when: "PR を出す直前"
    choose: "CI の merge 条件に当たる検査をローカルで先に流し、通ってから push する"
    over: "push 後に CI と最初の review の FLAG で不備を知る"
    because: "初回 FLAG と CI 待ちの往復 (CI 13〜14 分) が 1 日の merge 数を最も削る"
  - when: "この PR が前提にする契約や実装が未 merge"
    choose: "前提が merge されるまで PR を出さずに待つ"
    over: "先に出して blocker 付きで CI と review を走らせる"
    because: "前提待ちの PR は止まったまま review 枠と CI を占有する (2026-10-14: #1009 / #1029 / #1034 が T2 待ちで停止)"
---

# pr-preflight

#1037 (PR 作成前に CI の merge 条件をローカルで検査する機構) が入ったら、本 skill は
その機構への pointer に縮める**一時的な規律**である。それまでの間、PR を出す前に
下のチェックリストを人が順に確かめる。目的は、最初の review での FLAG と、CI 待ちで止まる PR を減らし、
1 日の merge 数を増やすことにある。

## この skill を読むとき

- PR を作る (push する) 直前。
- FLAG 是正の commit を積む直前 (同じ項目で再度 FLAG されないため)。

## チェックリスト

### 1. merge の条件

- 何を: 変更した path に関係する doctor の check と、対になるテストを通す。
- どう確かめる: 変更 path から該当する check を選び、その check を検査しているテストファイルを snapshot runner で流す
  (入口は `npm run test -- <テストファイル>`。素の `npx vitest run` は runner に拒否されて exit 1 になる)。
  doctor CLI の `--scope` は `full|toolchain` だけで、check 単位では絞れない。doctor の全件は流さない
  (singleton なので exit 2 は待つ)。例: L6 の文書を新しく足したら
  `npm run test -- tests/l6-completion.test.ts`、gate の数が変わったら
  `npm run test -- tests/gate-static.test.ts`。あわせて `npm run typecheck` と `npm run lint`。

### 2. blocker

- 何を: この PR が前提にする契約や実装は merge 済みか。
- どう確かめる: 前提が PR なら `gh pr view <n> --json state,mergedAt`、issue なら
  `gh issue view <n> --json state` で見る。issue が close されているだけでは、実装が merge 済みとは判定しない。
  対応する PR を特定して、その `mergedAt` が入っていることを確かめる。未 merge なら、PR を出さずに待つ (2026-10-14 実例: #1009 / #1029 / #1034 は T2 待ちで止まった)。

### 3. 共有文書の衝突

- 何を: 同じ文書を変更している open な PR があるか。
- どう確かめる: `gh pr list --state open --json number,title` で候補を出し、`gh pr view <n> --json files`
  で変更 path を突き合わせる。あれば、手番 (どちらが先に merge するか) を決めてから出す。

### 4. Red が本物か

- 何を: `it.fails` が、契約が未実装だという理由で落ちているか。setup・import・fixture の不備で落ちる
  偽の Red ではないか。
- どう確かめる: `it.fails` を一時的に `it` に戻し、`npm run test -- <テストファイル>` で流して、落ちる理由を
  目で見る。契約と無関係な理由なら偽の Red
  (#1040 r1 実例: fixture の frontmatter の先頭が改行で、全ケースが契約と無関係に落ちていた)。確認後は戻す。

### 5. 数字は定義どおりに実測する

- 何を: 文書に書く件数・閾値・baseline。
- どう確かめる: 契約が定める数え方そのもので測る。部分一致などの近似で数えない (#1034 r3 実例)。
  契約の数え方を実装した検査があるならそれを流し (`npm run test -- <その検査のテスト>`)、なければ
  契約の定義どおりの `git grep -c -E '<契約が定める正規表現>' -- <path>` で数える。
  測ったコマンドを PR 本文に書く。

### 6. 抜け道の反例

- 何を: gate の契約が、書式や path の変更で逃れられないか。
- どう確かめる: 書式の変更 (見出しの階層、セルの位置)、path の変更 (rename、子ディレクトリへの移動) を
  反例として実際に試し、逃れられるなら負例 oracle に入れる (#1034 r1 / r2 実例)。試し方は、反例の fixture を
  置いた状態で gate のテストを `npm run test -- <gate のテスト>` で流し、gate が検出する (負例が失敗として
  捕まる) ことを見る。

### 7. 古い記述の残り

- 何を: 定義を直したときに残る旧い値と旧い言い回し。
- どう確かめる: 同じ文書と関係する文書を、旧い値・旧い言い回しで grep する
  (`git grep -n '<旧い値>' -- docs src tests`)。#1034 実例: §3 を直したのに §11 に旧い数え方が残っていた。

### 8. 名指しで読む検査

- 何を: 文書を動かす・分けるときに、その文書を path で読むテストと検査。
- どう確かめる: `git grep -n '<文書名>' -- src tests` で洗い出し、該当テストを
  `npm run test -- <テストファイル>` で流す。実例: skill を足したら `src/shared/embedded-skills.ts` に登録する
  (無いと `tests/release-consumer-skills.test.ts` が落ちる。このテストは未 commit の変更があると
  `node-bootstrap-source-dirty` で落ちるので、commit 後の clean tree で流す)。

### 9. 言語

- 何を: `docs/` の文書は日本語で書く。
- どう確かめる: `npm run test -- tests/design-language.test.ts` を通す。コード・識別子・コマンド・
  PLAN ID・path は原語のままでよい。

## 縮める条件

#1037 の機構が入り、上の項目が機械検査に置き換わったら、機械化済みの項目を本文から消し、機構のコマンドへの
pointer だけを残す。機構にない項目 (blocker、共有文書の衝突など) は規律として残すか、機構化を #1037 に追記する。
