# 工程 ④⑤ の再編とリバースリファクタリング: 計画候補

> **これは候補の計画であり、正本ではない。** 採択されるまで、工程の順序・版の割当・完了条件は [README](../README.md) の「版のはしご」と
> `docs/design/harness/L4-basic-design/repository-placement.md` (以下 RP) が正本のままである。採択後に RP と README を改訂する (本書は改訂案を含む)。
> 親 Issue: #1005 (`Refs`)。本書の起草時点の HEAD は `3e1867320` (main)。実測値は特記がなければこの HEAD で再測した。
> 起草の元になった実測と相談の記録は、ローカルの未追跡 file `.ut-tdd/handover/control-tools/wf-restructure-advisor-task.md` / `-out.md` (HEAD `5d6b7ec3` 時点の実測と、設計相談 `claude-fable-5-2` の回答) である。repo の正本ではない。

## 1. 目的と範囲

工程 ③ (Pack の自己導入) の後に行う工程 ④ (新ディレクトリ構成への再編 + 層番号の振り直し) と工程 ⑤ (リバースリファクタリング) を、
抜け漏れなく安全に進めるための段取りを定める。本書が扱うのは次の 3 点だけである。

1. ④⑤ を 4 段 (A〜D) に分けた順序と、各段の中身・出口。
2. 所有者の決まっていない抜け (§4 の表、15 件) の置き場。
3. PO 判断が要る trade-off (§5)。

扱わない物: 設計文書・src・tests の変更、Issue の起票 (§6 は案であり、本書の PR では起票しない)、PLAN の新規起票 (PLAN は凍結中、`CLAUDE.md` §PLAN 凍結)。

## 2. 前提 (正本の記述と出所)

| 事項 | 出所 |
|---|---|
| ③ は最新 canary を開発ハーネス自身に Pack consumer として導入し、Pack 経由で版上げする (更新・保持確認・rollback を実測) | `README.md:23` |
| ④ は ③ の直後。層番号の振り直し (FR-066 / FR-069) を同じ切り替えで行う。受入は旧構成の consumer の更新と rollback | `README.md:24`、`README.md:3-4` |
| ⑤ は実装を製本として設計を検証・修正し、責務を分割する。振る舞いは変えず、④ と同じ受入で結果に差が無いことで確かめる | `README.md:25`、`00_VERSION_STRATEGY.md:24` |
| 「④ の版を出さずに ⑤ の変更を重ねない」。理由は更新と rollback の失敗の帰責を切り分けるため | `00_VERSION_STRATEGY.md:32` |
| 配置の移行順序は段階 0 (root 整理) → 1 (registry + 報告だけの patrol) → 2 (書き込み guard) → 3 (構造切り替え + 層番号) → 4 (内部デプロイ) | RP `:234-244` (§8) |
| registry の正本は `src/schema/file-placement.ts` (zod schema + ルール表)。既存 catalog は参照し、新しいルールだけ自前で持つ | RP `:184-189` (§4) |
| 内部デプロイは、hook を `src/cli.ts` 直接起動からインストール済み `ut-tdd.mjs` 経由へ切り替えること。新しい gate は、その gate 自身では守られない | RP `:228-229` (§7) |
| 構造の切り替えは層の切り替えと同時 (判断 5) | RP `:261` (§9) |
| 最小実装原則と目安 (module 700 行 / export 24 / 関数 120 行、重複統合は 10 行以上、1 PR = 1 論点) | `CLAUDE.md` §Coding Rules、`docs/governance/coding-rules.md` |

## 3. 4 段の計画

```text
(A) ③ の途中の canary (橋渡し版)        ← ④ と別の版
(B) ④-0 準備 (③ と並行、振る舞い不変)
(C) ④-1 切り替えの canary
(D) ⑤ (④ の canary の安定後)
```

順序は `00_VERSION_STRATEGY.md:32` の趣旨 (版を混ぜず帰責を切り分ける) を保つ。A と C は別の版であり、C と D も別の版である。

### 3.1 (A) 橋渡し版 (③ の途中の canary)

- **旧 path と新 path の両方を解決できる版**を、④ の切り替えより前に配る。
  - 理由: ③ の後、hook と gate はインストール済みの版で動く。移動 PR を守るのは旧 path しか知らない設計保護 gate (#898) であり、大量移動を設計文書の全削除と見るか、素通しするかのどちらかになる (RP §7 の「新しい gate はその gate 自身では守られない」の帰結)。
  - 副次の効果: rollback の戻り先と consumer 移行の受け皿 (§4 の 6・9) になる。
- **内部デプロイ (hook を installed `ut-tdd.mjs` 経由へ)** は ③ 本体であり、④ の準備ではない。この版に含める。
- **PLAN 退役による削除**: `src/plan-asset` と `src/plan-admission` は合計 11,410 行 (`find src/plan-asset src/plan-admission -name '*.ts' | xargs cat | wc -l`、HEAD `3e1867320`)。消す物を運ばない。これが移動対象を減らす本物のレバーである。
- **consumer 入口からの import の切り離し**: RP §8 段階 3 が前提にしている (release 工場の `dev/release/` への移動は、先に consumer 側からの import を切り離す)。
- 出口: 旧 path と新 path の両方で設計保護 gate が効く、橋渡し版へ Pack 経由で版上げできる、前の版へ rollback できる。

### 3.2 (B) ④-0 準備 (振る舞い不変、③ と並行)

| 項目 | 内容 | 補足 |
|---|---|---|
| B1 registry | RP 段階 1。registry は「移動表の正本」と、報告だけの patrol にする。**参照の付け替え API は作らない** | RP §4・§8 の段階 1 は registry + 報告だけの patrol までで、付け替え API は契約に無い。153 件の path 参照には `.github` の YAML、`.claude` の JSON、tests の fixture が含まれ、TS の registry を import できない (件数は §7 の未再測) |
| B2 参照の書き換え | codemod で一括。実行時に path を解決する src (docs/design・test-design を参照する約 62 件、層ディレクトリ名を参照する約 37 件) だけ registry 経由にする | **RP の改訂が先** (pair-freeze)。契約に無い方式を実装中に発明しない (`CLAUDE.md` §PR スコープ規律 2) |
| B3 書き込み guard | RP 段階 2 | `work-guard.ts` の拡張 (RP §5)。Codex 側の hook の実測は RP に宿題として残っている |
| B4 baseline の再キー | 論理名キーにしない。**移動表で再キー**し、検証は「再キー前後で値の多重集合が一致」 | 新しい仕組みを足さない。**再キーの前に**、code-size baseline が実測より古い原因を確かめる (`docs/governance/code-size-baseline.json:2` は `src/cli.ts` が 3,994 行、実測 4,103 行)。「縮むだけ」の gate が増加を止めていない兆候なら、移動で穴ごと引き継ぐ |
| B5 層番号の対応表 | **対応表だけ先に凍結**する。oracle ID と test ID は**不透明な識別子として据え置き**、ディレクトリ名と表示名だけ変える | L8 (結合 → as-built) と L9 (システム → 結合) は意味が入れ替わるので、「旧番号の残存 0」は grep で測れない。ID を変えると receipt と履歴の trace が切れる。v3.1 が正本の間の矛盾は §5 の判断 2 |
| B6 配布 tree の差分 | **旧 Pack と新 Pack の配布 tree の差分を先に実測**して、consumer 移行方式を決める | consumer に届くのは bundle なので、`src` → `product` は consumer から見えない可能性が高い。見える差分は層名・テンプレート path・起動経路だけかもしれない (推測、未実測) |
| B7 harness.db | path キーの行 (`artifact_path` / `file_path` など) の扱いを決める | **未検証**。S7 の §8 のような「既存 DB の表の扱い」の節が無い。`harness.db` は直接操作禁止 (global CLAUDE.md) なので、harness のコマンドで再投影する方式を前提に設計する |
| B8 凍結窓 | 切り替え時の手順: open PR と両ランタイムの worktree を drain してから切る | 移動は全 PR・全 worktree と衝突する |

### 3.3 (C) ④-1 切り替えの canary

- 変更の形は「**rename + codemod が生成した機械的な書き換え**」の commit にする。pure rename だけは成立しない (`src/` → `product/engine/` は import、tsconfig、`package.json`、workflow を同じ commit で直さないと CI が赤になる)。
- reviewer は差分を読まず、**codemod を再実行して差分 0 を確かめる**。数千ファイルの目視 review は検証にならない。codemod の入力 (移動表) は B で凍結済みのものを使う。
- consumer 移行は **2 本立て**: (1) harness が管理する物 (runtime、テンプレート) は世代切り替え、(2) consumer が書いた物 (層ディレクトリ下の設計文書) は移動表つきの in-place。(2) は consumer の git 管理物であり、harness の世代ではない。
- rollback 手順を先に契約する。新構成で書いた記録 (receipt、設計文書の版) を旧構成へ戻す互換 (§4 の 9) を含める。
- 受入 (README の ④ の受入に従う): 旧構成の consumer が Pack 経由で更新できる、旧 path が残らない、rollback で戻れる、設計保護 gate が新 path で効く (#913)、配るテンプレートが新しい層名の path で正本と一致する (AC-082/083)。
- 層番号と物理移動を別 canary に分けるかは §5 の判断 4。

### 3.4 (D) ⑤ リバースリファクタリング

**新規の親 Issue を立てない。** `execution/04_ISSUE_INTAKE.md` の「工程 ⑤」(68 件、`:22`、`:199` 以降) に既に束がある。次を束ね、順序と出口条件を足す。

| 既存 Issue | 内容 (出所 `04_ISSUE_INTAKE.md`) |
|---|---|
| #1084 | 責務重複の縮退 (11 群)。親として扱う (子に #211 など。`:86`) |
| #1212 | projection 分割の残作業 (`:108`)。「閉じるか ⑤ へ付け替えるかを ② の出口で決める」の決定が要る |
| #982 | 旧契約の残り DoD の DEBT-02〜04 (`:247`) |
| #873 | review custody の信頼性の束 (#386、#393、#437 など) |

**出口条件**: VS:24 のとおり「④ と同じ受入を流し、結果に差が無い」+ #1084 の群の消化。「目安の上限超え 0」は完了条件にしない (機械的な分割を誘い、最小実装原則とぶつかる)。

**共通化・分割の候補** (HEAD `3e1867320` の実測):

| 候補 | 実測 | 進め方 |
|---|---|---|
| `canonicalJson` の重複 | 5 か所 (`src/disposition/domain/document-disposition-catalog.ts:141`、`src/feedback/review-verdict-custody.ts:50`、`src/forward/domain/evidence-canonical.ts:1`、`src/setup/consumer-node-runtime.ts:161`、`src/state-db/github-review-lane-provenance.ts:56`) | 統合の前に、**同じ入力でバイト一致する特性テスト**を置く。digest は review custody / receipt / consumer runtime manifest に直結するので「振る舞い不変」は自明ではない |
| `sha256` / `sha256Hex` の定義 | 約 19 か所 (`grep -rEn "function sha256(Hex)?\b\|const sha256(Hex)? =" src` で 19 件)。入力型 (string / bytes / parts 配列) と出力形式 (`sha256:` 接頭辞の有無) がバラバラ | 同上。統一できる形と、別名のまま残す形を特性テストで分ける |
| projection の二重定義 | `projection-writer.ts` と `src/state-db/*-projections.ts` (5 file) の同名関数 6 組 (`projectRuntime*` など。組数は起草時の計測、未再測) | #1212 の続きとして扱う |
| `src/cli.ts` の分割 | 4,103 行、`.command(` 105 件 (再測)、28 ディレクトリから import (起草時の計測) | command 登録を各ドメインへ。**④ の前に回さない** (下の理由) |
| 関数過大の上位 | functionExcess: pack-publication-adapter 371、cli/distribution 352、memory/service 228、spec-ir-projections 220 (起草時の計測、未再測) | #1084 の群として |

**`cli.ts` の分割と helper 統合を ④ の前に回さない理由**:

1. 「移動対象と path 参照が減る」は成り立たない。分割するとファイルは増え、path 文字列の参照は `cli.ts` の形と関係ない。
2. VS:32 の理由は「版を混ぜない」ではなく「失敗の帰責を切り分ける」であり、⑤ の出口は ④ の受入結果との差分比較なので、④ より前にやると比べる基準が無い。
3. ④ の前に回してよいのは、A に挙げた 3 つ (PLAN 退役による削除、consumer 入口の import 切り離し、橋渡し版) だけである。

## 4. 抜けの表

「置き場」は既存 Issue 番号か「新規 Issue が要る」。「段」は §3 の A〜D で閉じる段階。1〜12 は起草時の調査、13 は設計相談で見つかった順序の矛盾、14 (凍結窓) と 15 (橋渡し版) も相談で足した。

| # | 抜け | 根拠 | 置き場 | 段 |
|---|---|---|---|---|
| 1 | RP §8 段階 1〜2 (registry、patrol、書き込み guard) が未実装で Issue が無い | `src/schema/file-placement.ts` が存在しない (`ls` で確認、HEAD `3e1867320`) | 新規 Issue が要る (registry と patrol / guard は別の 1 PR = 1 論点) | B |
| 2 | 移動の影響範囲を測る設計が無い | path 固定の参照: docs/design・test-design を参照する src 62 件、層ディレクトリ名を参照する src 37 件、文字列リテラル 153 件、docs/templates 参照 37 件 (起草時の計測、HEAD `5d6b7ec3`、未再測) | 新規 Issue が要る (計測を再現できる script と移動表) | B |
| 3 | path キーの baseline の再キー手順と、新規違反との区別が未定義 | code-size-baseline (src キー 140 件)、doc-split-baseline (docs/design キー 16 件)、oracle-test-trace-baseline。`code-size-baseline.json:2` の `cli.ts` 3,994 行が実測 4,103 行より古い | 新規 Issue が要る (原因調査 + 再キー手順の契約) | B |
| 4 | harness.db の path キーの行の扱いが未定義 | S7 の §8 のような節が無い。**未検証** | 新規 Issue が要る | B |
| 5 | git 履歴・blame の連続性 (rename と内容変更の分離、exact-head review と 1 PR = 1 論点の整合) | §3.3 のとおり pure rename は成立しない。「rename + codemod の機械的書き換え」を 1 PR として review できるかが未定 | 新規 Issue が要る (契約は設計文書へ) | B → C |
| 6 | consumer の旧構成 → 新構成の移行方式 (in-place か世代切り替えか)。updater (#481) が構成変更を扱うか未確認 | 2 本立てにする (§3.3)。#481 の対応範囲は**未確認** | #481 (既存) に範囲の確認を足す + 方式の契約は新規 Issue | B → C |
| 7 | `.claude/settings.json`・`.codex/hooks.json`・`.github/workflows/` の path は設計保護 gate の外で、移動で黙って壊れる。hook を `ut-tdd.mjs` 経由へ切り替える担当が無い | RP `:228` は hook 切り替えを内部デプロイに置くが担当 Issue なし。`ut-tdd.mjs` は repo root に無く、あるのは `scripts/ut-tdd` と `scripts/ut-tdd.ps1` | 新規 Issue が要る (hook 切り替え = ③ 本体)。#961 の子にするか判断が要る | A |
| 8 | 層番号の振り直しの影響範囲 (file 名、oracle ID、pair_artifact、test ID) と、旧番号の残存の測り方が未定 | `L7-unit-test-design` 94 回、`L8-integration` 49、`L12-acceptance` 36、`L14` 35、`L9-system` 32、`L10-ux` 24 (起草時の計測)。L8/L9 は意味が入れ替わる | 新規 Issue が要る (対応表の凍結、B5) | B |
| 9 | ④ の rollback で、新構成で書いた記録 (receipt、設計文書の版) を旧構成へ戻す互換が未定義 | receipt の正本は `refs/ut-tdd/receipts/` (RP `:128`)。設計文書は層ディレクトリ名の違いで path が変わる | 新規 Issue が要る | C |
| 10 | canary の連番と ②〜⑤ の版の対応表が無い | README の版のはしごは 0.3.0 以降の割当で、橋渡し版 (A) と ④-1 (C) の canary 番号が決まっていない | 新規 Issue が要る (README の改訂) | A |
| 11 | ⑤ の入力 (どの module をどの順で)、出口、検証が無い | 親 Issue は半分ある (§3.4)。足りないのは束ねる順序と出口条件 | #1084 (既存) に順序と出口を足す。新規の親は立てない | D |
| 12 | 文書間の矛盾: (a) テンプレートの置き場 (FR-069 は `docs/templates`、RP は `product/parts/templates`、RP `:170`・`:180`)、(b) v3.1 が正本の間に v4 の層番号へ切り替える矛盾、(c) RP 本文が FR-070 の除外 (`product/intelligence/`) に未同期 | `README.md:24`、RP `:89`・`:170`・`:180`・`:261` | (a)(b) は §5 の判断 1・2。(c) は RP の改訂 (新規 Issue) | B |
| 13 | **順序の矛盾**: RP §8 は内部デプロイを段階 4 (切り替えの後) に置き、roadmap は ③ (切り替えの前) に置く | RP `:243` (§8 段階 4)、`README.md:23` | RP の改訂 (§5 の判断 3) | A |
| 14 | **切り替え時の凍結窓**: open PR と両ランタイムの worktree が全部衝突する。drain の手順が無い | `CLAUDE.md` §Hybrid 多ランタイム commit 協調 | 新規 Issue が要る | B → C |
| 15 | **橋渡し版**: 旧 path と新 path の両方を解決する版が計画に無い | RP §7 の「新しい gate はその gate 自身では守られない」 | 新規 Issue が要る (§3.1) | A |

## 5. 未決の判断 (trade-off が残るもの)

`CLAUDE.md` §PO 判断への反射的エスカレーション禁止 に従い、相談 (`claude-fable-5-2`、design) と実測の後も残るものだけを挙げる。いずれも文書上の位置づけの判断であり、高影響境界ではない。

**判断 1: テンプレートの置き場**

- 案 a: `docs/templates` (FR-069 のまま)。consumer の導入先 (`docs/` の初期値) と一致し、移動が少ない。一方、配る部品が `docs/` の中にある矛盾 (RP `:38`) が残る。
- 案 b: `product/parts/templates` (RP のまま)。配る物と配らない物が名前で分かれる。一方、FR-069 の改訂と build 時の生成 (#872) の同時変更が要る。
- 推奨: **案 b**。RP は PO 確認済み (2026-10-07) の構造であり、Pack の builtin を build 時に生成する方式 (RP `:170`) と整合する。FR-069 を RP に合わせて改訂する。

**判断 2: v3.1 が正本の間に v4 の層番号へ切り替える矛盾**

- 案 a: 対応表だけ先に凍結し、ディレクトリ名と表示名の切り替えは v4 の昇格と同時にする。構想の正本と実体が食い違う期間が無い。一方、④ の canary で層名が変わらなくなり、README の ④ の受入 (新しい層名の path) と食い違う。
- 案 b: 対応表を凍結し、④-1 の canary で切り替える。README の受入と一致する。一方、構想 v3.1 が正本の期間に、実体だけ v4 の番号になる。
- 推奨: **案 b**。ただし ⑥ (要件の凍結) で番号が動くと 2 回動かすことになるので、**対応表だけ先に凍結**し、⑥ の凍結で対応表が変わらないことを B の出口にする。v4 昇格との同時切り替えが必要かは PO の判断。

**判断 3: RP §8 段階 4 と roadmap ③ の順序**

- 案 a: roadmap を正とし、RP §8 の段階 4 (内部デプロイ) を段階 0 の直後 (③ の位置) に改訂する。
- 案 b: RP を正とし、roadmap の ③ を切り替えの後へ動かす。
- 推奨: **案 a**。③ の自己導入が ④ の前提 (旧構成の consumer の更新と rollback の実測) であり、橋渡し版 (§3.1) は ③ の途中でなければ配れない。

**判断 4: ④ 内部を層番号と物理移動で別 canary に分けるか**

- 案 a: 同時 (RP §9 判断 5 のまま)。触るファイル (`loadTemplates`、`build-node.mjs`、Pack inventory、テスト、catalog) がほぼ同じで、2 回動かさずに済む。
- 案 b: 別 canary。失敗の帰責を切り分けやすい。一方、同じファイルを 2 回触り、移動表を 2 段持つ。
- 推奨: **案 a**。B の準備 (移動表の凍結、codemod の再実行で差分 0) で帰責は十分に切り分けられる。B6 の実測で consumer から見える差分が小さいと分かれば、分ける理由はさらに薄れる。

## 6. 次の一手 (Issue 起票案、本書の PR では起票しない)

各 1 行。順序は A → B → C → D。

1. [A] RP の改訂: 内部デプロイを ③ の位置へ、registry の責務を「移動表の正本 + 報告」に絞る、FR-070 の除外に同期 (§4 の 7・12・13、§5 の判断 3)。
2. [A] 橋渡し版の契約: 旧 path と新 path の両方を解決する設計保護 gate の仕様と、その canary の番号 (§4 の 10・15)。
3. [A] hook を installed `ut-tdd.mjs` 経由へ切り替える (③ 本体、§4 の 7)。担当を #961 の子として確認する。
4. [A] `src/plan-asset` と `src/plan-admission` の退役による削除 (約 11,410 行)。既存の ② の退役系 Issue の続きかを確認してから起票する。
5. [A] consumer 入口からの import の切り離し (RP §8 段階 3 の前提)。
6. [B] file-placement registry (移動表の正本) と、報告だけの patrol を実装する (RP 段階 1、§4 の 1)。
7. [B] 書き込み guard (RP 段階 2) を実装する。Codex 側の hook の実測を含める。
8. [B] path 参照の影響範囲を測る再現可能な script を置く (§4 の 2)。件数 153 / 62 / 37 を HEAD で再測する。
9. [B] code-size baseline が実測より古い原因の調査と、移動表による再キー手順の契約 (§4 の 3、B4)。
10. [B] 層番号の対応表を凍結する (oracle ID と test ID は据え置き、L8/L9 を個別に定義、§4 の 8)。
11. [B] 旧 Pack と新 Pack の配布 tree の差分を実測し、consumer 移行方式 (2 本立て) を契約する (§4 の 6、#481 の対応範囲の確認を含む)。
12. [B] harness.db の path キーの行の扱いを設計する (§4 の 4)。
13. [B] 切り替えの凍結窓の手順 (drain の条件、worktree の扱い、§4 の 14) と、rollback の互換 (§4 の 9)。
14. [C] ④-1 の canary: codemod を再実行して差分 0 を確かめる review 手順と、1 PR = 1 論点の扱い (§4 の 5)。
15. [D] #1084 に ⑤ の順序と出口条件を足し、#1212 を ⑤ へ付け替えるか決める。
16. [D] canonicalJson (5 か所) と sha256 系 (約 19 か所) の、バイト一致の特性テストを先に置く Issue。

## 7. 未検証と限界

- 参照件数 153 / 62 / 37 / 37 と層番号の出現回数は、起草時 (HEAD `5d6b7ec3`) の計測値で、HEAD `3e1867320` では再測していない。再測した値は `cli.ts` 4,103 行・`.command(` 105 件、`canonicalJson` 5 か所、sha256 系 19 か所、`src/plan-asset` + `src/plan-admission` 11,410 行である。
- `cli.ts` が 28 ディレクトリから import する件数、functionExcess の値、projection の同名関数 6 組は再測していない。
- updater (#481) が構成変更を扱うか、harness.db の path キーの行の扱い (§4 の 4・6) は**未検証**。
- 相談 (`claude-fable-5-2`) の回答のうち、本書に採った反駁 6 件 (hook 切り替えは ③ 本体、橋渡し版、registry 経由の付け替えは契約外、pure rename は不成立、consumer 移行の 2 本立て、⑤ の親は既存) は、control lane が repo の実物で確かめている (`canonicalJson` 5 か所、sha256 系の重複、#1084 と #1212 の実在、`ut-tdd.mjs` が repo root に無いこと)。
- 本書は設計文書ではない。契約本文 (移動表の形式、codemod の仕様、橋渡し版の解決規則) は、各 Issue の設計文書へ書く。
