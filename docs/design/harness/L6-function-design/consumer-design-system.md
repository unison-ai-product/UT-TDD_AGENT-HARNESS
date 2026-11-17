---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_consumer_design_system
pair_artifact: docs/test-design/harness/L7-consumer-design-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-11-17
issue: 1717
---

> **L6 contract marker**: 本書は consumer (UT-TDD を導入した製品) が画面を作るときの**デザインシステムの土台**の契約である (未実装の目標契約)。契約は stack に依存しない。token の schema (§3)、部品カタログの record (§4)、使い方のルールの書式 (§5)、preset の契約 (§6)、機械の検証規則と導入の順序 (§7) を定め、判定は純関数 (`parseHexColor` / `relativeLuminance` / `contrastRatio` / `checkTokenContrast` / `validateTokenSet` / `lintHardcodedValues` / `checkCatalog` / `checkCatalogUsage` / `checkPresetManifest` / `isPresetDistributable` / `resolveFindingSeverity`) が持つ。型と DbC は §10 にまとめる。oracle は `docs/test-design/harness/L7-consumer-design-system-test-design.md` の候補 ID `CANDIDATE-U-CDS-001`〜`027` が固定する。実装の置き場 (`src/design-system/` 以下) は仮置きで、配布の設計 (③ Pack の自己導入) で確定する。

# consumer 向けデザインシステムの土台 — 関数設計 (issue #1717)

## 1. 目的と範囲

consumer の製品が、デザインの理由でプロトから本番へ抜け出せていない (#1717、PO 2026-11-17)。原因はデザインの質ではなく、**プロトで選んだ色・余白・部品が、本番で何を守るべきかの契約になっていない**ことにある。目的は、既製品の導入から魔改造までを支える土台を、stack に依存しない契約と機械の検証として置くことである。

範囲は次のとおり。

- 対象は **consumer の製品の画面**。日本向けの業務 Web、データの多い管理画面、スマホアプリ、Windows の業務ツールの 4 系統すべて (PO 回答)。
- ハーネスが決めるのは次の 4 つだけである。(1) token の schema (§3)、(2) 部品カタログ (部品 × 状態) の record (§4)、(3) 使い方のルールの書式 (§5)、(4) 機械の検証規則 (§7)。既製品は preset (§6) として差し替える。

範囲外:

- **harness 自身の画面** (`docs/design/harness/L4-basic-design/tokens.yaml` と `ui-standard.md`)。これらは harness の dashboard 用で、light のみ・日本語のみ・Desktop 専用・状態色 5 値の具体値を持つ。画面カット (#1226 / #1084 group 13) で撤去の予定であり、consumer 向けには流用せず、本書も参照先にしない。
- token の**具体値**。値は consumer (または preset) の record が持つ。本書は役割の名前・型・満たす制約だけを定める。
- 特定の library の選定 (§6.3。library の名前は技術選定にあたり、`skills/design-family-web-frontend.md` の decision_points が「library の名前だけでは設計の判断にならない」とする線引きと同じ理由で、契約には固定しない)。
- `src/setup/` と Pack の配布物の変更、CLI への登録 (③ と一緒に進める。#1717 の「進め方」)。

## 2. 既存の正本との関係 (UI 標準の正本を 2 か所にしない)

| 既存の物 | 位置づけ | 本書との関係 |
|---|---|---|
| `docs/templates/vmodel/L4-ui-standard.md` | consumer 向けの UI 標準の**正本** (`document-system-map.md` §1c、2026-10-21 の決定)。`ut-tdd setup` が `src/setup/vmodel-template-assets.ts` の bundle で配る。人が読む方針 (i18n・a11y の方針・要件・検証・表示名) の記入先 | **上書きしない・複製しない**。本書はこのテンプレートが指す**機械可読な record の schema と検証規則**を定める (下の分担) |
| `document-system-map.md` §1c の L4 `ui-standard` 行 | consumer 向けの定義へ書き直す作業は #1226 が持つ | 本書は §1c を変えない。#1226 の後に §1c の定義文から本書を指す (§12 の 1) |
| `tokens.yaml` / harness の `ui-standard.md` | harness 自身の画面用。撤去予定 | 依存しない。値も構造も借りない |

**分担 (正本は 1 か所ずつ)**:

| 内容 | 正本の置き場 |
|---|---|
| 人が読む方針・WCAG の目標・翻訳運用・「この製品は何を守るか」の宣言 | consumer が記入する `L4-ui-standard.md` (テンプレートの章を埋める) |
| token・部品カタログ・使い方のルール・preset の**値と record** | consumer の repo の record ファイル (形は §3〜§6) |
| record の schema・満たす制約・検証規則・導入の順序 | 本書 (`ut-tdd` が配る検証が参照する) |

記入した `L4-ui-standard.md` は、token と部品の**値を書かない**。record のファイルの path と preset の id を指すだけにする (値の複製は、正本とずれる原因になる)。テンプレートの第 5 章 (a11y の方針)・第 6 章 (a11y の要件)・第 7 章 (検証) を記入するときは、本書 §7 の検証を引く。この参照文をテンプレートへ足すのは #1226 の範囲であり、本書の PR では足さない。

## 3. token の schema

token は**役割の名前**で参照し、値は record に置く。製品のコードは値 (hex・px・ms) を直書きせず、役割を指す (§7 の lint)。

**3.1 色 (意味の役割、light / dark)**

必須の役割は次の 16 で、各 mode (`light`、`dark`) が全部を持つ。値は hex の `#rgb` / `#rrggbb` (alpha を含む記法は不可。alpha は背景が決まらないと contrast を計算できないため)。

| 区分 | 役割 | 意味 |
|---|---|---|
| 面 | `background` / `surface` | 画面全体の背景 / カードや入力欄などの面 |
| 文字 | `text` / `text-muted` | 本文 / 補助の文字 |
| 境界 | `border` | 区切り線・入力欄の枠 |
| 主 | `primary` / `on-primary` | 主の操作の色 / その上の文字 |
| 危険 | `danger` / `on-danger` | 削除・失敗 / その上の文字 |
| 警告 | `warning` / `on-warning` | 注意 / その上の文字 |
| 成功 | `success` / `on-success` | 完了 / その上の文字 |
| 情報 | `info` / `on-info` | 補足 / その上の文字 |
| 操作 | `focus-ring` | keyboard の focus の輪郭 |

**満たす制約 (contrast、WCAG 2.2 AA)**: 次の 16 組の contrast 比を満たす (`REQUIRED_CONTRAST_PAIRS`)。比は WCAG 2.x の相対輝度の式で計算し、**丸めずに**下限と比べる (表示が 2 桁に丸まって下限に見えても、丸める前の値が下限未満なら不合格)。

| 下限 | 組 (前景 / 背景) | 根拠 |
|---|---|---|
| 4.5 | `text`/`background`、`text`/`surface`、`text-muted`/`background`、`text-muted`/`surface`、`primary`/`background` (リンクの文字として使うため)、`on-primary`/`primary`、`on-danger`/`danger`、`on-warning`/`warning`、`on-success`/`success`、`on-info`/`info` | 1.4.3 (文字) |
| 3.0 | `border`/`background`、`focus-ring`/`background`、`danger`/`background`、`warning`/`background`、`success`/`background`、`info`/`background` | 1.4.11 (文字でない UI) |

- **色だけで意味を伝えない** (1.4.1)。状態の色は、アイコンかラベルを必ず併記する。これは検証 (a) では機械で測れないので、部品のカタログの状態 record (§4) と使い方のルール (§5) で守る。
- **dark の扱い**: 製品が dark を持たないときは `dark: { na: <理由> }` と理由つきで書く (理由が空なら不備)。省略は不備で、非適用は record として残す (#790 の S-10 と同じ扱い)。

**3.2 余白・角丸・影**

| 種別 | 形 | 満たす制約 |
|---|---|---|
| 余白 `space` | 数値の配列 (px 相当。添字が step) | 全ての要素 (先頭を含む) が正の数で、厳密に増加する |
| 角丸 `radius` | `none` / `sm` / `md` / `lg` / `full` | `none` は 0。残りは `none` 以上で、この順に減らない |
| 影 `shadow` | `none` / `sm` / `md` / `lg` の文字列 | 4 つとも在る (値の書式は preset の写像に委ねる) |

**3.3 文字 (日本語の組版を含む)**

| 項目 | 形 | 満たす制約と理由 |
|---|---|---|
| `family.body` / `family.mono` | font 名の並び | **最後が総称 family** (`sans-serif` / `serif` / `monospace` / `system-ui`)。日本語の font は環境に無いことがあり、無いときに総称へ落ちないと欠けた文字が出る |
| `size.body` | 数値 (px 相当) | 14 以上。画数の多い日本語は小さい字で潰れ、読めなくなるため |
| `lineHeight.body` | 倍率 | 1.5 以上。日本語は欧文より行間を広く取り、WCAG 1.4.12 の text spacing の調整を受けても崩れない余裕を持つ |
| `ja.lineBreak` | `strict` / `normal` | 日本語の禁則処理の強さ。`strict` を既定にする |
| `ja.wordBreak` | `auto-phrase` / `normal` / `keep-all` | 文節の途中で折り返さない設定。`auto-phrase` を既定にする |
| `ja.palt` | `heading-only` / `none` | プロポーショナルの詰め (`palt`) は見出しだけに使い、本文には使わない (読みやすさを落とすため) |

日本語を扱わない製品は `ja: { na: <理由> }` と書く。和欧間の空白を文字で入れない (組版は CSS に任せる) ことは、使い方のルール (§5) の最初の例とする。

**3.4 動き**

| 項目 | 形 | 満たす制約 |
|---|---|---|
| `duration` | `fast` / `normal` / `slow` (ms) | `fast < normal < slow` |
| `easing` | `standard` (文字列) | 在る |
| `reducedMotion` | `none` / `fade-only` | **必須**。OS の「視差効果を減らす」設定の下で、動きを無くすか、フェードだけにする方針を製品が持つことを要求する |

**3.5 token の検証**

`validateTokenSet` が §3.1〜§3.4 の形の制約を判定する (contrast は `checkTokenContrast`、§7)。rule の一覧は §10 の DbC の表。

## 4. 部品カタログの record

consumer の画面が使ってよい部品の一覧である。1 部品 1 record で、**部品 × 状態**の対応を必ず書く。

```ts
interface CatalogComponent {
  id: string;                                       // kebab-case。一意
  kind: "interactive" | "form-control" | "data" | "presentational";
  maturity: "stable" | "beta" | "experimental";     // #790 の S-06 と同じ段。本番は stable だけ
  states: Partial<Record<StateName, true | { na: string }>>;
  a11y: { role: string; keyboard: readonly string[] };
}
```

**4.1 状態の語彙**

`StateName` は次の 10 個で、2 つの群に分ける。

| 群 | 名前 | 備考 |
|---|---|---|
| 操作の状態 | `default` / `hover` / `focus` / `active` / `disabled` / `readonly` | |
| データの状態 | `loading` / `empty` / `error` / `stale` | `default` が #790 の S-04 の `ok` にあたる (`kind: "data"` のとき) |

**#790 の S-04 との関係**: S-04 は、画面の状態の語彙 (`ui-element.md:40` の ok / warn / error / empty / loading と、`screen-spec.md:51` の loading / ok / empty / stale / error) を 1 つの zod enum に統一する作業で、v4 の縮退状態を上位集合とする。本書のデータの状態 (`loading` / `empty` / `error` / `stale` と `default`=`ok`) は、その 2 つの語彙の**共通部分**であり、S-04 の enum の部分集合である。S-04 の enum が確定したとき、本書の名前と食い違えば **S-04 を正本**とし、本書を改訂する (本書から S-04 の語彙を再定義しない)。`warn` は S-04 の語彙に在るが、部品の「状態」ではなく画面の集約の状態なので、カタログの必須にしない。S-04 の enum の確定を受けた突き合わせは受入条件に置く (§11)。

**4.2 部品の種類ごとの必須の状態**

必須の状態は、`true` か `{ na: <理由> }` で必ず書く。**理由なしの非適用は不備**とする。省略は不備である。

| `kind` | 必須の状態 |
|---|---|
| `interactive` | `default` / `hover` / `focus` / `active` / `disabled` |
| `form-control` | `default` / `hover` / `focus` / `active` / `disabled` / `readonly` / `error` (入力の検証の失敗) |
| `data` | `default` / `loading` / `empty` / `error` / `stale` |
| `presentational` | `default` |

`kind` が `presentational` 以外の部品は、`a11y.keyboard` を 1 つ以上持つ (操作の方法のない部品は、keyboard だけの利用者が使えない)。

**4.3 初期の必須部品 (18)**

| `kind` | 部品 |
|---|---|
| `interactive` (6) | `button` / `link` / `tabs` / `pagination` / `navigation` / `dialog` |
| `form-control` (6) | `text-input` / `textarea` / `select` / `checkbox` / `radio` / `form-field` |
| `data` (1) | `data-table` |
| `presentational` (5) | `alert` / `toast` / `badge` / `empty-state` / `skeleton` |

consumer は部品を足してよい。ただし必須の 18 を欠いてはならない (preset がどれかに当てられないときは §6.2 の `gap` として記録し、部品そのものは欠かさない)。

## 5. 使い方のルールの書式

部品と token の使い方を、**決定と「なぜそう決めたか」を対**にして書く。手本は、デジタル庁デザインシステム・GOV.UK Design System・Shopify Polaris が、各部品に「何をするか」と「なぜか」を並べる書き方である (書式を手本にするだけで、原文を転載しない。参照は名前と版だけを書く)。

```ts
interface UsageRule {
  id: string;                  // 一意
  subject: string;             // 部品の id か token の役割
  decision: string;            // 何をする (しない) か。1 文
  why: string;                 // なぜそう決めたか。利用者・失敗の事例・制約の根拠
  example?: { do: string; dont: string };
  source?: string;             // 手本にした規則の名前と版 (任意)
}
```

- `decision` と `why` は両方とも空にできない。`why` が `decision` の言い換えだけなら、レビューで差し戻す (機械では測らない)。
- 例 (書式の見本。値は consumer が決める):
  - subject: `typography` / decision: 和欧間に空白を文字で入れない / why: 欧文と日本語の間隔は CSS の組版が自動で調整する。文字で入れると、禁則・折り返しと食い違って行末に孤立した空白が出る。
  - subject: `button` / decision: 1 つの画面に `primary` の button は 1 つだけ置く / why: 主の操作が複数あると、利用者がどれを押すべきか判断できず、誤操作の原因になる。
- ルールは consumer の record に置く。ハーネスは書式 (`UsageRule`) と、`decision` と `why` が在ることの検査だけを持つ。

## 6. preset の契約

preset は、契約の token と部品カタログを**既製品へ写像した record** である。ハーネスの正本は契約であり、既製品は差し替える。

**6.1 系統**

| `family` | 対象 |
|---|---|
| `jp-business-web` | 日本向けの業務 Web |
| `admin-web` | データの多い管理画面 |
| `mobile` | スマホアプリ |
| `windows` | Windows の業務ツール |

**6.2 preset が満たすこと**

```ts
interface PresetManifest {
  id: string;
  family: "jp-business-web" | "admin-web" | "mobile" | "windows";
  candidates: readonly string[];        // 参考。判定に使わない
  modes: { light: true; dark: true | { na: string } };
  tokenMap: Record<string, string>;     // key は `<mode>.<色の役割>` と space / typography / radius / shadow / motion
  componentMap: Record<string, { fit: "native" | "adapted" | "custom" | "gap"; target?: string; note?: string }>;
  license: { distribution: "reference-only" | "vendored"; approval: "none" | "approved"; recordRef?: string };
}
```

1. **token の写像を全部持つ**。`modes` が `true` の mode の 16 色 (§3.1) と、`space` / `typography` / `radius` / `shadow` / `motion` の 5 つに、空でない値 (既製品側の参照) を書く。足りないものは不備。
2. **カタログの各部品に、既製品のどの部品を当てるかを書く**。`fit` は、`native` (既製品の部品をそのまま使う)、`adapted` (既製品の部品に token を当てて使う)、`custom` (既製品に無いので自作する)、`gap` (当てられず、代替も決まっていない) の 4 つ。`native` と `adapted` は `target` (既製品の部品の名前) が要る。`custom` と `gap` は `note` に理由と扱い (代替・自作の方針) が要る。
3. **当てられない部品を黙って落とさない**。カタログに在る部品が `componentMap` に無いのは不備。`componentMap` にカタログに無い id が在るのも不備。
4. `dark` を持たない preset は `{ na: <理由> }` を書く (§3.1 と同じ)。
5. **配布**は §8 に従う。

**6.3 候補 (契約には固定しない)**

次は、系統ごとの**候補**であり、契約の一部ではない。選ぶ・捨てる・足すのは preset の record と、技術選定の判断である。

| `family` | 候補 |
|---|---|
| `jp-business-web` | SmartHR UI、または shadcn/ui + React Aria にデジタル庁のルールを合わせる |
| `admin-web` | Ant Design、Carbon |
| `mobile` | Material 3、HIG (Apple の Human Interface Guidelines) |
| `windows` | Fluent 2 |

候補を使うときは、各 preset の record に `candidates` として書き、写像 (§6.2) を記録する。

## 7. 機械の検証規則と導入の順序

検証は 4 つで、安くて決定論的なものから入れる。全部を **advisory** で入れ、baseline を測ってから fail-close にする。

| 順 | 検証 | 内容 | ブラウザ |
|---|---|---|---|
| (a) | token ペアの contrast 計算 | §3.1 の 16 組を `checkTokenContrast` で mode ごとに判定する | 不要 |
| (b) | 直書き禁止の lint | token 以外の色・長さ・font・動きの直書きを `lintHardcodedValues` で検出する | 不要 |
| (c) | カタログとの突き合わせ | カタログの record を `checkCatalog` で、画面が使う部品を `checkCatalogUsage` で、preset の写像を `checkPresetManifest` で判定する | 不要 |
| (d) | ブラウザでの a11y | consumer の fixture の画面を axe + Playwright で検査する (WCAG 2.2 AA のタグ)。描画の証跡は exact HEAD と run ID に束縛する (#790 の S-03) | 要る |

(d) は純関数にならないので、本書の oracle の対象にしない (実行の手順は ③ の配布の設計で定める)。

**7.1 直書き禁止の lint の規則 (b)**

`lintHardcodedValues(file, options)` は、`file.text` の次を `hardcoded.*` の finding として返す (行・桁は 1 始まり)。

| rule | 検出するもの |
|---|---|
| `hardcoded.color` | `#rgb` 〜 `#rrggbbaa` と `rgb(` / `rgba(` / `hsl(` / `hsla(` / `oklch(` / `oklab(` |
| `hardcoded.length` | 0 以外の `px` / `rem` / `em` / `pt` / `dp` / `vw` / `vh` の値 (`0` と `0px` は除く)。`var(--x, 8px)` の fallback の中も数える |
| `hardcoded.font` | `font-family` / `fontFamily` の値で、`var(` で始まらないもの |
| `hardcoded.motion` | `transition` / `animation` を含む行の、`ms` / `s` の値 |

- コメント (`/* ... */` と、行頭か空白の直後の `//` から行末まで) は検出の対象にしない。
- `@media` の**条件**の部分 (`@media` から最初の `{` の手前まで。複数行にまたがってもよい) だけを対象にしない (breakpoint は本書の token の範囲外)。`@media` の中の宣言は通常どおり検査する。宣言を 1 行に書いても複数行に書いても、検出の結果 (rule) は同じになる (行と桁は元の file の位置)。
- `options.tokenFiles` に完全に一致する path の file は検出しない (token を定義する場所は値を持ってよい)。
- 限界: 色の名前 (`red`)・文字列の中に組み立てた値・stack 固有の記法は検出しない。`hardcoded.font` は値が `var(` で始まらなければ検出するので、JS の token 参照式 (`tokens.font.body` など) も検出されうる (preset ごとの拡張で除く)。検出を足すのは preset ごとの拡張とする (契約の rule は上の 4 つを最小とする)。

**7.2 導入の順序**

検証 (a)〜(d) ごとに、次の段を順に進める。段を進める判断は control が、baseline の件数と誤検出の記録を見て行う (件数の閾値を本書では決めない)。

| 段 | 名前 | finding の扱い |
|---|---|---|
| A0 | `baseline` | 全て advisory。件数を測って baseline の file に記録する |
| A1 | `advisory` | 全て advisory。consumer の CI に出す |
| A2 | `ratchet` | baseline に無い (新しい) finding は error、baseline に在る finding は advisory |
| A3 | `enforce` | 全て error (fail-close) |

`resolveFindingSeverity({ stage, inBaseline })` がこの表を返す。検証は consumer 側で走る。harness の doctor には UI が無いので、doctor には置かない。受入の場は ③ (Pack の自己導入の fixture) である。

## 8. 高影響境界 (第三者の部品のコードの配布)

第三者の部品のコードを Pack で配ることは、**ライセンスに関わる高影響境界**である。次を契約とする。

- 配布の形は 2 つ。`reference-only` は、ハーネスが書いた写像の record だけを配り、第三者のコードを含めない。`vendored` は、第三者のコードを Pack に含める。
- `vendored` の preset は、**PO の承認を preset ごとに記録してからでないと配らない**。承認は `license.approval: "approved"` と、承認の記録の場所 `license.recordRef` (空でない) で表す。advisor の相談や既存の契約からは、この承認を代替しない。
- `isPresetDistributable(preset)` は、`reference-only` なら真、`vendored` なら `approval` が `approved` かつ `recordRef` が空でないときだけ真とする。配布の処理 (`ut-tdd distribution sync-pack` の経路) が呼ぶのは ③ の範囲である。
- 本書の PR は、第三者の部品のコードを 1 行も含めない。

## 9. 配布の経路

新しい経路は作らない。consumer へ渡す物は既存の `src/setup/vmodel-template-assets.ts` の経路 (`ut-tdd setup` と `ut-tdd distribution sync-pack`) を使う。本書が定める record の schema・検証の関数を consumer へ渡す方法の具体 (どの file を bundle へ足すか) は ③ の範囲で、本書では決めない。

## 10. 型と DbC

```ts
export type Mode = "light" | "dark";
export type ColorRole =
  | "background" | "surface" | "text" | "text-muted" | "border"
  | "primary" | "on-primary" | "danger" | "on-danger"
  | "warning" | "on-warning" | "success" | "on-success"
  | "info" | "on-info" | "focus-ring";
export interface Rgb { r: number; g: number; b: number }            // 各 0〜255 の整数
export interface ContrastPair { fg: ColorRole; bg: ColorRole; min: number }
export interface Finding { rule: string; subject: string; message: string }
export type ColorPalette = Record<ColorRole, string>;
export interface DesignTokenSet {
  schema: 1;
  modes: { light: ColorPalette; dark: ColorPalette | { na: string } };
  space: readonly number[];
  radius: { none: number; sm: number; md: number; lg: number; full: number };
  shadow: { none: string; sm: string; md: string; lg: string };
  typography: {
    family: { body: readonly string[]; mono: readonly string[] };
    size: { body: number };
    lineHeight: { body: number };
    ja: { lineBreak: "strict" | "normal"; wordBreak: "auto-phrase" | "normal" | "keep-all"; palt: "heading-only" | "none" } | { na: string };
  };
  motion: {
    duration: { fast: number; normal: number; slow: number };
    easing: { standard: string };
    reducedMotion?: "none" | "fade-only";
  };
}
export type StateName = "default" | "hover" | "focus" | "active" | "disabled" | "readonly" | "loading" | "empty" | "error" | "stale";
export type RolloutStage = "baseline" | "advisory" | "ratchet" | "enforce";
export interface HardcodeFinding { rule: `hardcoded.${"color" | "length" | "font" | "motion"}`; line: number; column: number; value: string }

export const REQUIRED_CONTRAST_PAIRS: readonly ContrastPair[];        // §3.1 の 16 組
export const REQUIRED_COMPONENT_IDS: readonly string[];               // §4.3 の 18

export function parseHexColor(text: string): Rgb | null;
export function relativeLuminance(rgb: Rgb): number;
export function contrastRatio(a: Rgb, b: Rgb): number;
export function checkTokenContrast(modes: { light?: Partial<ColorPalette>; dark?: Partial<ColorPalette> | { na: string } }, pairs: readonly ContrastPair[]): Finding[];
export function validateTokenSet(tokens: DesignTokenSet): Finding[];
export function lintHardcodedValues(file: { path: string; text: string }, options: { tokenFiles: readonly string[] }): HardcodeFinding[];
export function checkCatalog(catalog: readonly CatalogComponent[], requiredIds: readonly string[]): Finding[];
export function checkCatalogUsage(usages: readonly { file: string; componentId: string }[], catalog: readonly CatalogComponent[], target: "prototype" | "production"): Finding[];
export function checkPresetManifest(preset: PresetManifest, catalog: readonly CatalogComponent[], colorRoles: readonly ColorRole[]): Finding[];
export function isPresetDistributable(preset: PresetManifest): boolean;
export function resolveFindingSeverity(input: { stage: RolloutStage; inBaseline: boolean }): "advisory" | "error";
```

関数の署名を `name(...) =>` の形で再掲する (判定の oracle は I1〜I12 がテスト設計の `CANDIDATE-U-CDS-001`〜`027` へ対応する)。`parseHexColor(text) => Rgb | null`、`relativeLuminance(rgb) => number`、`contrastRatio(a, b) => number`、`checkTokenContrast(modes, pairs) => Finding[]`、`validateTokenSet(tokens) => Finding[]`、`lintHardcodedValues(file, options) => HardcodeFinding[]`、`checkCatalog(catalog, requiredIds) => Finding[]`、`checkCatalogUsage(usages, catalog, target) => Finding[]`、`checkPresetManifest(preset, catalog, colorRoles) => Finding[]`、`isPresetDistributable(preset) => boolean`、`resolveFindingSeverity(input) => "advisory" | "error"`。

| 区分 | 内容 |
|---|---|
| I1 | 全ての関数は純粋である (file・環境変数・時刻・network を自分では読まず、引数だけから決まる)。戻りの配列は入力の順 (`checkTokenContrast` は mode が `light`、`dark` の順で、同じ mode の中では `pairs` の順) |
| I2 | contrast の比は丸めずに `min` と比べる。比は `(max(L1, L2) + 0.05) / (min(L1, L2) + 0.05)`、`L` は WCAG 2.x の相対輝度 (sRGB 8 bit を 0〜1 にし、`c <= 0.03928` なら `c / 12.92`、それ以外は `((c + 0.055) / 1.055) ** 2.4`、`L = 0.2126 R + 0.7152 G + 0.0722 B`)。`contrastRatio` は引数の順に依らない |
| I3 | `parseHexColor` は `#rgb` と `#rrggbb` (大文字・小文字とも) だけを受理し、それ以外 (alpha 付き・`#` なし・関数記法・空文字) は `null` を返す。例外を投げない |
| I4 | `checkTokenContrast` は、`dark` が `{ na }` か未指定の mode を飛ばす。役割が無い組は `contrast.role_missing`、値を解釈できない組は `contrast.unparseable`、比が `min` 未満は `contrast.below_min` を返し、`subject` は `<mode>:<fg>/<bg>` |
| I5 | `validateTokenSet` の rule: `token.mode_missing` (`modes.dark` が無い、subject `modes.dark`)、`token.na_reason_missing` (`na` の理由が空白だけ、subject `modes.dark` か `typography.ja`)、`token.role_missing` (subject `<mode>.<役割>`)、`token.space_not_positive` (subject `space[<添字>]`、先頭を含め 0 以下の要素)、`token.space_not_increasing` (subject `space[<添字>]`、直前の要素以下になった正の要素。0 以下の要素にはこの rule を付けず `token.space_not_positive` だけにする)、`token.radius_none_nonzero` / `token.radius_not_ordered`、`token.font_no_generic_fallback` (subject `typography.family.body` か `.mono`)、`token.font_size_below_min`、`token.line_height_below_min`、`token.motion_not_ordered`、`token.reduced_motion_missing` |
| I6 | `lintHardcodedValues` は §7.1 の規則どおりに、`line` と `column` の昇順 (同じ位置は rule 名の辞書順) で返す。`options.tokenFiles` に `file.path` が一致すれば空を返す。コメントの中は検出しないが、行番号は数えるので、複数行のコメントの後でも行番号は元の file の行を指す |
| I7 | `checkCatalog` の rule: `catalog.duplicate_id`、`catalog.required_component_missing` (subject は欠けた id)、`catalog.state_unknown` (subject `<id>.<名前>`)、`catalog.state_missing` (subject `<id>.<状態>`)、`catalog.na_reason_missing` (subject `<id>.<状態>`)、`catalog.keyboard_missing` (subject `<id>`) |
| I8 | `checkCatalogUsage` の rule: `usage.unknown_component` (カタログに無い id、subject は `<file>:<id>`)、`usage.immature_in_production` (`target` が `production` で、その部品の `maturity` が `stable` でない、subject は `<file>:<id>`)。`target` が `prototype` なら成熟度を見ない |
| I9 | `checkPresetManifest` の rule: `preset.token_unmapped` (subject は §6.2 の key)、`preset.mode_na_reason_missing`、`preset.component_unmapped`、`preset.component_unknown`、`preset.target_missing` (`native` / `adapted`)、`preset.note_missing` (`custom` / `gap`)。`modes.dark` が `{ na }` のとき、`dark.*` の写像は要求しない |
| I10 | `isPresetDistributable` は §8 の規則だけで決め、他の field (`candidates` など) を見ない |
| I11 | `resolveFindingSeverity` は、`enforce` なら `error`、`ratchet` で `inBaseline` が偽なら `error`、それ以外は `advisory` |
| I12 | 検証 (a)〜(c) は consumer 側で走り、harness の doctor には置かない。doctor の gate (`frontend-design-coverage` など) の oracle を変えない |

## 11. 受け入れ条件

- [ ] 契約 (本書とテスト設計の対) が merge され、`vmodel-pair` と `l6-completion` が通る。
- [ ] 4 系統の preset それぞれについて、token の写像とカタログの対応が record として記録されている (本 PR では書式だけを定め、record は ③ の自己導入の fixture が埋める)。
- [ ] contrast の計算と直書き禁止の lint が、consumer の fixture で advisory として動く (実装は ③ と一緒に進める)。
- [ ] ライセンスについて PO の承認が記録された preset だけが、Pack で配られる (§8)。
- [ ] #790 の S-04 の enum が確定したら、§4.1 のデータの状態の名前が enum の部分集合であることを機械で確かめる (食い違えば S-04 を正本として本書を改訂する)。

## 12. 実装の順序と後続

1. **本書の PR (契約)**: 本書とテスト設計の対だけ。src は含まない。#1226 の後に、`document-system-map.md` §1c の L4 `ui-standard` 行の定義文とテンプレートの第 5〜7 章から本書を指す参照を足す (別 PR、#1226 の範囲)。
2. **Red**: 候補 oracle を `it.fails` で `tests/consumer-design-system.test.ts` に入れる (テスト設計 §1 の三段階)。
3. **Green**: 純関数を実装する。置き場は仮に `src/design-system/` (`contrast.ts` / `token-set.ts` / `lint-hardcoded.ts` / `catalog.ts` / `preset.ts` / `severity.ts`) とし、③ の配布の設計で確定する。
4. **③ と一緒に**: consumer への配布 (`src/setup/` と Pack)、CLI への登録、自己導入の fixture での advisory の実行、preset ごとの record。

## 13. 未決の点

| 点 | 扱い |
|---|---|
| (d) ブラウザの a11y の実行の手順と fixture の置き場 | ③ の配布の設計で決める |
| 検出の拡張 (色の名前、stack 固有の記法) | preset ごとの拡張。baseline の誤検出の記録を見て足す |
| 画面が使う部品の抽出 (`checkCatalogUsage` の入力を作る処理) | stack 依存なので preset ごとの adapter とする。契約は正規化した入力の形だけを定める |
| 段 A0〜A3 を進める件数の閾値 | 本書では決めない。baseline を測ってから control が決める |
| 4 系統の候補 (§6.3) の選定とライセンスの承認 | 候補ごとの調査を経て、PO の承認を記録する (§8) |
