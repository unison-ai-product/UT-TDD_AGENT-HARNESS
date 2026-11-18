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

扱わない物: 設計文書・src・tests の変更、Issue の起票 (§7 は案であり、本書の PR では起票しない)、PLAN の新規起票 (PLAN は凍結中、`CLAUDE.md` §PLAN 凍結)。

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
| B1 registry | RP 段階 1。registry は「移動表の正本」と、報告だけの patrol にする。**参照の付け替え API は作らない** | RP §4・§8 の段階 1 は registry + 報告だけの patrol までで、付け替え API は契約に無い。153 件の path 参照には `.github` の YAML、`.claude` の JSON、tests の fixture が含まれ、TS の registry を import できない (件数は §8 の未再測) |
| B2 参照の書き換え | codemod で一括。実行時に path を解決する src (docs/design・test-design を参照する約 62 件、層ディレクトリ名を参照する約 37 件) だけ registry 経由にする | **RP の改訂が先** (pair-freeze)。契約に無い方式を実装中に発明しない (`CLAUDE.md` §PR スコープ規律 2) |
| B3 書き込み guard | RP 段階 2 | `work-guard.ts` の拡張 (RP §5)。Codex 側の hook の実測は RP に宿題として残っている |
| B4 baseline の再キー | 論理名キーにしない。**移動表で再キー**し、検証は「再キー前後で値の多重集合が一致」 | 新しい仕組みを足さない。code-size gate は空白行を除いて数えるので `src/cli.ts` は 3,994 行で baseline と一致する (全行は 4,103。`src/lint/code-size.ts:249,263`)。baseline 140 entry に、実測が超えるもの・stale・存在しない file は 0 で、増加は `code-size-required` / `baseline-grown` で止まる (`code-size.ts:303-320,340-373`)。再キーの前提に古さの調査は要らない |
| B5 層番号の対応表 | **対応表だけ先に凍結**する (#1791 で ⑥ から前倒しして凍結、段階 B の前提。⑥ 全体の完了は待たない)。oracle ID と test ID は**不透明な識別子として据え置き**、ディレクトリ名と表示名だけ変える | L8 (結合 → as-built) と L9 (システム → 結合) は意味が入れ替わるので、「旧番号の残存 0」は grep で測れない。ID を変えると receipt と履歴の trace が切れる。v3.1 が正本の間の矛盾は §5 の判断 2 |
| B6 配布 tree の差分 | **旧 Pack と新 Pack の配布 tree の差分を先に実測**して、consumer 移行方式を決める | consumer に届くのは bundle なので、`src` → `product` は consumer から見えない可能性が高い。見える差分は層名・テンプレート path・起動経路だけかもしれない (推測、未実測) |
| B7 harness.db | path キーの行 (`artifact_path` / `file_path` など) の扱いを決める | **未検証**。S7 の §8 のような「既存 DB の表の扱い」の節が無い。`harness.db` は直接操作禁止 (global CLAUDE.md) なので、harness のコマンドで再投影する方式を前提に設計する |
| B8 凍結窓 | 切り替え時の手順: open PR と両ランタイムの worktree を drain してから切る | 移動は全 PR・全 worktree と衝突する |

### 3.3 (C) ④-1 切り替えの canary

- 変更の形は「**rename + codemod が生成した機械的な書き換え**」の commit にする。pure rename だけは成立しない (`src/` → `product/engine/` は import、tsconfig、`package.json`、workflow を同じ commit で直さないと CI が赤になる)。
- 検証は目視ではなく**期待 tree の再生成と一致確認**で行う。凍結した変更前の commit から、review 済みの移動表と codemod で期待 tree を再生成し、exact head の tree 全体と一致すること (tree の hash の一致) を確かめる。変更後の tree で codemod を再実行して差分 0 を確かめるだけでは、codemod の対象外に混ざった手書きの挙動変更を見逃すので、この方式にしない。数千ファイルの目視 review は検証にならない。codemod 自体と移動表の review、更新・rollback の受入は、この一致確認と別に維持する。移動表は B で凍結済みのものを使う。
- consumer 移行は **2 本立て**: (1) harness が管理する物 (runtime、テンプレート) は世代切り替え、(2) consumer が書いた物 (層ディレクトリ下の設計文書) は移動表つきの in-place。(2) は consumer の git 管理物であり、harness の世代ではない。
- rollback 手順を先に契約する。新構成で書いた記録 (receipt、設計文書の版) を旧構成へ戻す互換 (§4 の 9) を含める。
- 受入 (README の ④ の受入に従う): 期待 tree と exact head の tree の hash が一致する、旧構成の consumer が Pack 経由で更新できる、旧 path が残らない、rollback で戻れる、設計保護 gate が新 path で効く (#913)、配るテンプレートが新しい層名の path で正本と一致する (AC-082/083)。
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
| `src/cli.ts` の分割 | 空白行を除いて 3,994 行 (全行 4,103)、`.command(` 105 件 (再測)、28 ディレクトリから import (起草時の計測) | command 登録を各ドメインへ。**④ の前に回さない** (下の理由) |
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
| 3 | path キーの baseline の再キー手順と、新規違反との区別が未定義 | code-size-baseline (src キー 140 件)、doc-split-baseline (docs/design キー 16 件)、oracle-test-trace-baseline。code-size は空白行を除く数で baseline と一致しており、古さの問題は無い (B4) | 新規 Issue が要る (移動表による再キー手順の契約) | B |
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

**採択済みと未決の区別** (`gh issue view 1791` で確認、2026-11-18)

- **採択済み**: 工程 ⑥ のうち ④ が依存する 3 点だけを、④ の前に前倒しで凍結する (PO 判断 2026-11-18、Issue #1791、作業は PR #1795)。3 点は層番号 (UTV4-FR-066 / FR-069)、ディレクトリ構成 (UTV4-FR-070)、テンプレートの置き場 (FR-069 と RP の食い違い) である。その他の要件は、これまでどおり ⑤ の後に ⑥ で扱う。
- **段階 B の前提**: #1791 の 3 点の凍結が済んでいること。⑥ 全体の完了は前提にしない (roadmap の順序は ④ → ⑤ → ⑥ で、⑥ 全体を待つと B を完了できない)。
- **未決として残る判断**: 判断 1 のテンプレートの置き場の案は、#1791 の範囲に入り control の推奨は案 b だが、確定は #1791 の凍結で行う。判断 2 のうち、層番号の切り替えの時期 (④-1 の canary か、v4 の昇格と同時か) と v4 の昇格との関係。判断 3・4。

**判断 1: テンプレートの置き場** (#1791 の範囲)

- 案 a: `docs/templates` (FR-069 のまま)。consumer の導入先 (`docs/` の初期値) と一致し、移動が少ない。一方、配る部品が `docs/` の中にある矛盾 (RP `:38`) が残る。
- 案 b: `product/parts/templates` (RP のまま)。配る物と配らない物が名前で分かれる。一方、FR-069 の改訂と build 時の生成 (#872) の同時変更が要る。
- 推奨: **案 b**。RP は PO 確認済み (2026-10-07) の構造であり、Pack の builtin を build 時に生成する方式 (RP `:170`) と整合する。FR-069 を RP に合わせて改訂する。

**判断 2: v3.1 が正本の間に v4 の層番号へ切り替える矛盾** (対応表の凍結は #1791 で採択済み。切り替えの時期は未決)

- 案 a: 対応表だけ先に凍結し、ディレクトリ名と表示名の切り替えは v4 の昇格と同時にする。構想の正本と実体が食い違う期間が無い。一方、④ の canary で層名が変わらなくなり、README の ④ の受入 (新しい層名の path) と食い違う。
- 案 b: 対応表を凍結し、④-1 の canary で切り替える。README の受入と一致する。一方、構想 v3.1 が正本の期間に、実体だけ v4 の番号になる。
- 推奨: **案 b**。⑥ (要件の凍結) があとで番号を動かすと 2 回動かすことになる。この点は採択済みの前倒し (#1791) で解決している (下の「採択済みと未決の区別」)。v4 昇格との同時切り替えが必要かは未決で、PO の判断。

**判断 3: RP §8 段階 4 と roadmap ③ の順序**

- 案 a: roadmap を正とし、RP §8 の段階 4 (内部デプロイ) を段階 0 の直後 (③ の位置) に改訂する。
- 案 b: RP を正とし、roadmap の ③ を切り替えの後へ動かす。
- 推奨: **案 a**。③ の自己導入が ④ の前提 (旧構成の consumer の更新と rollback の実測) であり、橋渡し版 (§3.1) は ③ の途中でなければ配れない。

**判断 4: ④ 内部を層番号と物理移動で別 canary に分けるか**

- 案 a: 同時 (RP §9 判断 5 のまま)。触るファイル (`loadTemplates`、`build-node.mjs`、Pack inventory、テスト、catalog) がほぼ同じで、2 回動かさずに済む。
- 案 b: 別 canary。失敗の帰責を切り分けやすい。一方、同じファイルを 2 回触り、移動表を 2 段持つ。
- 推奨: **案 a**。B の準備 (移動表の凍結、期待 tree の再生成と exact head の tree の hash の一致) で帰責は十分に切り分けられる。B6 の実測で consumer から見える差分が小さいと分かれば、分ける理由はさらに薄れる。

## 6. ねじれ (不整合) の棚卸し

2026-11-18 に main `3e1867320` で監査した結果 (control が抜き取りで確認済み。元記録は未追跡の `.ut-tdd/handover/control-tools/wf-twist-findings.md`)。再編の計画に効くものから順に並べる。「閉じる段」の S8 は #1380、「即時」は ④⑤ を待たずに直すもの、「control」は control lane が行う Issue の整理である。件数・行番号は監査時の値で、起票時に再測する。

| # | ねじれ (内容) | 根拠 | 閉じる段 | 置き場 |
|---|---|---|---|---|
| T1 | oracle の ID 正規表現が末尾 `-[0-9]{2,3}` を要求し、`U-*-R<n>` 形式の宣言 65 件 (U-ASSIGN-LEDGER-R1..R4、U-ROUTE-R1..R11、U-SPECIR-R1..R13、U-TYPED-SPEC-R1..R4 など) が trace の対象外。tests にも src にも引用が 0。trace の OK が偽の否定証明になっている。数字の ID は orphan / undeclared / stale / duplicate すべて 0 | `src/lint/oracle-test-trace.ts:44,144` | ④-0 準備 (B)。層番号の対応表と ID 据え置きの前提 (B5) に効く | 新規 Issue が要る (§7 の 17) |
| T2 | v3.1 と v4 で同じ層番号が別の工程を指す (v3.1: L5↔L8、L6↔L7、L10=UX / v4: L5↔L9、L4↔L10、L8=as-built、L9=結合)。v4 文書の内でも L10 が揺れる | `docs/governance/candidates/ut-tdd-concept-v4.0.md:26` は「L10 受入候補」、`v4-acceptance` は「L12 受入」 | ④-0 準備 (B5、§5 の判断 2) | #1791 |
| T3 | test-design の `pair_artifact` が実在しない `docs/plans/PLAN-L7-690…` / `PLAN-L7-722…` を bare path で指す (2 件。他の 7 件は `plans-archive-20261102:` 接頭辞つき) | test-design の `pair_artifact` (監査時) | ④-0 準備 (移動表と codemod の入力を壊さないため先に正す) | 新規 Issue が要る |
| T4 | PLAN は物理削除済み (#1365、`docs/plans/` は tracked 0 件) なのに、`CLAUDE.md` の凍結節は「物理撤去は範囲外」、`AGENTS.md:314`・`.claude/CLAUDE.md:59` は `docs/plans/` の確認と `ut-tdd plan lint` を指示したまま。`rule-drift` が全アダプタに `route_signal` / `generates` の記述を必須にしており、PLAN の文言を消すと CI が赤になる | `src/lint/rule-drift.ts:45-46` | S8 | #1380 |
| T5 | 存在しない CLI が正本にある: `ut-tdd skill suggest --plan` (実際は `--text` / `--buckets`)、`ut-tdd task estimate --plan` (task は classify / route / roster のみ)、`ut-tdd reverse <type> R0` (top-level に無い) | `CLAUDE.md` / `AGENTS.md` の該当節 | S8 | #1380 |
| T6 | `docs/governance/repository-structure.md` (正本を名乗る) が実物と違う: `docs/plans/` (削除済み)、`docs/skills/` (無い)、`.claude/agents/` (空、#1002)、`.claude/settings.json` 「hooks:{}」 (実物は 7 本以上)、§11 は物理削除を将来形で #1170 と書く (実際は #1365 で削除済み) | `docs/governance/repository-structure.md` | S8。RP の改訂 (§7 の 1) と同時に直すと 2 回触らずに済む | #1380 |
| T7 | `requirements_v1.2` / `concept_v3.1` に PLAN を正本とする記述が、凍結・退役の注記なしで残る。stale な記述: ADR-001 の Node 版 24.13.0 (実物 24.22.3)、RP §7 の「canary.5 の後に自己導入」(実際は canary.8 の後)、RP §3.1 の「旧 PLAN を dev/docs/archive/plans に凍結」(実際は tag と物理削除)、`.claude/CLAUDE.md:160` の `PLAN-L6-96`、`:336-337` の Cutover evidence、design 文書 69 本の `docs/plans/PLAN…` 参照、`coding-rules.md:246`、`00_VERSION_STRATEGY.md` ⑧ 行 (README は ② で退役済み)、`.claude/CLAUDE.md:36-38` の文の途中切れ | 左の各 path | S8 (RP の記述は RP 改訂と同時) | #1380 |
| T8 | 実体の無い confirmed の設計: 実行割当台帳 (`function-spec.md:988-991`、`ut-tdd assignment check`、U-ASSIGN-LEDGER-R1..R4、authoring source の `vmodel-execution-assignment-ledger.md` も無い)、screen 系 (`screen-spec.md` の `parseScreenQuery` ほか 6 関数は src に 0。`tests/l6-completion.test.ts:521-527` は文書に ID が書かれていることしか見ない) | 左の各 path:line | ⑤ (設計の検証・修正) | #1084 の群として |
| T9 | 退役済みの関数を現役として書く設計: `function-spec.md:199-217` (`planDraft`、`sprintCheck`、`assertL7HasDesignAncestor`、`queueGithubProjection`、`syncRepositoryBindings`)、`L7-unit-test-design.md:68,71` (U-CORE-01/04)、`plan-mechanism-retirement.md:143,164` が 11-04 に退役済みの `github project sync` / `github binding observe` を「これから退役」と書く | 左の各 path:line | ⑤ | #1084 の群として |
| T10 | 設計だけあって CLI に無い: `ut-tdd memory retire` (`memory.md:257-264`、`retireMemoryEpisodes` は src に呼び手なし)。未実装の目標契約が confirmed のまま (workflow-model-guard、snapshot-run-lease、gh-command、test-oracle-strength の module 分割。意図どおりの可能性が高いが、状態の明示が要る) | 左の各 path:line | ⑤ (状態の明示) | #1084 の群として |
| T11 | `src/runtime/forced-stop.ts` に生の NUL バイト (`.join(` の区切り)。git が binary と判定し、grep / diff / review から見えにくい。`"\0"` へ直す | `src/runtime/forced-stop.ts` | 即時 | 新規 Issue が要る (1 PR) |
| T12 | 許可リストに退役した baseline file の名前が残る | `harness-check.yml:83-85`、`github-ci-policy.ts:392-394` | ④-0 準備 (path 参照の計測と同時) | 新規 Issue が要る |
| T13 | ③ の親 #961 の子に ③ と無関係な #1069 / #1384 / #1465 / #1554 / #1720 がある。本文の列挙 (#930 / #867 / #364) は実際の子ではない (#930 / #867 の親は #364、#364 の親は #224)。③ が閉じられない。#928 (Linux の受入) は起動条件が roadmap と逆で、題名が canary.6 のまま | GitHub の親子関係 | 即時 (control) | control が整理 |
| T14 | ② の親 #958 の子に ④ の #913 と、② の凍結に関係の薄い #1037 / #1063 / #1073 / #1452 / #1419 / #1312 がある。④ と ⑤ に親 Issue が無い (④ は #913 だけ、⑤ は intake の 68 件の一覧だけ) | GitHub の親子関係、`04_ISSUE_INTAKE.md:22` | 即時 (control)。④ の親は §7 の 1 の RP 改訂の後に立てる | control が整理 |
| T15 | #1211 / #1212 / #1213 の本文は「親: #1169 (closed)」、実際の親は #1078。#1226 は ⑦ の作業なのに親が #1084。#1084 は題名が 11 群、実際は 12〜13 群 | GitHub の親子関係 | 即時 (control)。#1084 の群数は ⑤ の束ねで確定 | control が整理 |
| T16 | close の候補 (根拠つき): #1359 (Green #1486 merge 済み)、#1247 (vitest 4.1.12 済み、記録の確認が要る)、#1589 (#1644 で Node 24.22.3 済み)、#1032 (#1408 で実装・配線済み、残り AC は要確認)、#439 (#1600 と同じ事象)。重複: #982 と #1212、#668 と #1538、#1121 と #1721〜#1723 | 左の各 Issue | 即時 (control) | control が整理 |
| T17 | 実行できない AC: #823 / #822 / #968 / #762 / #304 / #70 / #1083 が PLAN の起票を AC にしている。#1124 / #1125 の待ちの #1099 は closed。#759 は対象に S7 で退役する file を含み数値が古い。#1170 の明細の file は既に無い | 左の各 Issue | 即時 (control)。⑤ の束ねる Issue は ⑤ の着手時に再確認 | control が整理 |

健全と確認できたもの (直さない): モデル ID と effort ラダーは 3 アダプタと `MODEL_IDS` で一致、WIP 規律は一致、oracle-test-trace (数字の ID) は orphan / undeclared / stale / duplicate すべて 0、hook / CI / `package.json` の path は全部実在、privacy-scan E5 は設計と実装が一致。code-size baseline も健全 (§3.2 B4)。

## 7. 次の一手 (Issue 起票案、本書の PR では起票しない)

各 1 行。順序は A → B → C → D。

1. [A] RP の改訂: 内部デプロイを ③ の位置へ、registry の責務を「移動表の正本 + 報告」に絞る、FR-070 の除外に同期 (§4 の 7・12・13、§5 の判断 3)。
2. [A] 橋渡し版の契約: 旧 path と新 path の両方を解決する設計保護 gate の仕様と、その canary の番号 (§4 の 10・15)。
3. [A] hook を installed `ut-tdd.mjs` 経由へ切り替える (③ 本体、§4 の 7)。担当を #961 の子として確認する。
4. [A] `src/plan-asset` と `src/plan-admission` の退役による削除 (約 11,410 行)。既存の ② の退役系 Issue の続きかを確認してから起票する。
5. [A] consumer 入口からの import の切り離し (RP §8 段階 3 の前提)。
6. [B] file-placement registry (移動表の正本) と、報告だけの patrol を実装する (RP 段階 1、§4 の 1)。
7. [B] 書き込み guard (RP 段階 2) を実装する。Codex 側の hook の実測を含める。
8. [B] path 参照の影響範囲を測る再現可能な script を置く (§4 の 2)。件数 153 / 62 / 37 を HEAD で再測する。
9. [B] code-size baseline の移動表による再キー手順の契約 (§4 の 3、B4)。
10. [B] 層番号の対応表を凍結する (oracle ID と test ID は据え置き、L8/L9 を個別に定義、§4 の 8)。
11. [B] 旧 Pack と新 Pack の配布 tree の差分を実測し、consumer 移行方式 (2 本立て) を契約する (§4 の 6、#481 の対応範囲の確認を含む)。
12. [B] harness.db の path キーの行の扱いを設計する (§4 の 4)。
13. [B] 切り替えの凍結窓の手順 (drain の条件、worktree の扱い、§4 の 14) と、rollback の互換 (§4 の 9)。
14. [C] ④-1 の canary: 凍結した変更前の commit から移動表と codemod で期待 tree を再生成し、exact head の tree の hash との一致を確かめる review 手順と、1 PR = 1 論点の扱い (§4 の 5)。
15. [D] #1084 に ⑤ の順序と出口条件を足し、#1212 を ⑤ へ付け替えるか決める。
16. [D] canonicalJson (5 か所) と sha256 系 (約 19 か所) の、バイト一致の特性テストを先に置く Issue。
17. [B] oracle-test-trace の `ORACLE_ID` 正規表現の死角を直す (`U-*-R<n>` 形式 65 件が trace 対象外、§6 の T1)。直す前に 65 件の扱い (対象に入れる / 退役) を決める。
18. [即時] ③ (#961) と ② (#958) の親子整理 (関係の無い子の付け替え、#913 の親、本文の列挙の訂正、§6 の T13・T14)。実施は control。
19. [即時] `src/runtime/forced-stop.ts` の生の NUL を `"\0"` へ直す (§6 の T11)。
20. [S8] 規範文書と rule-drift の PLAN の文言、存在しない CLI、`repository-structure.md` の食い違いを #1380 で直す (§6 の T4〜T7)。

## 8. 未検証と限界

- 参照件数 153 / 62 / 37 / 37 と層番号の出現回数は、起草時 (HEAD `5d6b7ec3`) の計測値で、HEAD `3e1867320` では再測していない。再測した値は `cli.ts` 空白行を除いて 3,994 行 (全行 4,103)・`.command(` 105 件、`canonicalJson` 5 か所、sha256 系 19 か所、`src/plan-asset` + `src/plan-admission` 11,410 行である。
- `cli.ts` が 28 ディレクトリから import する件数、functionExcess の値、projection の同名関数 6 組は再測していない。
- updater (#481) が構成変更を扱うか、harness.db の path キーの行の扱い (§4 の 4・6) は**未検証**。
- 相談 (`claude-fable-5-2`) の回答のうち、本書に採った反駁 6 件 (hook 切り替えは ③ 本体、橋渡し版、registry 経由の付け替えは契約外、pure rename は不成立、consumer 移行の 2 本立て、⑤ の親は既存) は、control lane が repo の実物で確かめている (`canonicalJson` 5 か所、sha256 系の重複、#1084 と #1212 の実在、`ut-tdd.mjs` が repo root に無いこと)。
- 本書は設計文書ではない。契約本文 (移動表の形式、codemod の仕様、橋渡し版の解決規則) は、各 Issue の設計文書へ書く。
