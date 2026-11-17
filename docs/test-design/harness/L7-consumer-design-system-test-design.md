---
title: "L7 consumer design system test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/consumer-design-system.md
parent_doc: docs/design/harness/L6-function-design/consumer-design-system.md
status: confirmed
updated: 2026-11-17
issue: 1717
---

# consumer 向けデザインシステムの土台 テスト設計 (issue #1717)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/consumer-design-system.md` (未実装の目標契約)。本書は §3 token の schema、§4 部品カタログの record、§6 preset の契約、§7 機械の検証規則と導入の順序、§8 高影響境界、§10 の DbC を検証する oracle を、候補 ID `CANDIDATE-U-CDS-001`〜`027` で宣言する。共有の `docs/test-design/harness/L7-unit-test-design.md` には、この PR では索引の行を足さない (実装 PR の後続で足す)。検証 (d) のブラウザでの a11y は純関数にならないので oracle の対象にしない (設計 §7)。

進め方は設計保護 gate の三段階に従う。

1. **Red**: 候補 ID を引用した `it.fails` を `tests/consumer-design-system.test.ts` に入れる。この段が足してよい `src/` は、設計保護 gate (`design-protection-diff-gate.md` §10.3 手順 1') の例外の範囲、すなわち新規 module の契約形の stub (と必要な登録) だけで、既存 module には触れない。stub は成功側の値を返さない (空配列や `true` を返さず、fail-close の値か投げる)。Red の前提 (fixture が作れる) は、同じ fixture を使う対の通常 `it` で確かめ、fixture の失敗が期待どおりの失敗に紛れないようにする。
2. **昇格 (src を含まない)**: 接頭辞 `CANDIDATE-` を外した正式 ID `U-CDS-*` へ改め、テスト名の引用を同時に書き換える。正式 ID を引用より先に作らない (`oracle-test-trace`)。
3. **実装 PR**: `it.fails` を `it` に戻して Green にする。実装 PR は `docs/test-design/` を変えない。

**Red の弱さの明示**: 対象の module が無い間は、動的 import の失敗で `it.fails` が通る。これは個々の規則が Red である証拠ではない。Green の PR は、各 oracle の期待を 1 か所だけ崩す変更を実装に入れて、対応する oracle が落ちることを確かめてから `it` に戻す。

## 2. テストレベルと fixture

全 oracle は純関数を直接呼ぶ。file・環境変数・時刻・network・実 process を使わない (設計 I1)。置き場は設計 §12 の仮置きに従う。

基準の fixture (小さい完備な入力を作り、1 点だけ変えて使う)。

- **`PALETTE_OK`** (light): `background #ffffff`、`surface #f5f5f5`、`text #1a1a1a`、`text-muted #595959`、`border #767676`、`primary #0b57d0`、`on-primary #ffffff`、`danger #c5221f`、`on-danger #ffffff`、`warning #8a4b00`、`on-warning #ffffff`、`success #137333`、`on-success #ffffff`、`info #0b57d0`、`on-info #ffffff`、`focus-ring #1a73e8`。16 組の contrast を全て満たす (これを実測して確かめるのが 004)。
- **`TOKENS_OK`**: `modes.light = PALETTE_OK`、`modes.dark = { na: "light のみの製品" }`、`space = [4, 8, 12, 16, 24]`、`radius = { none: 0, sm: 2, md: 4, lg: 8, full: 9999 }`、`shadow = { none: "none", sm: "s", md: "m", lg: "l" }`、`typography = { family: { body: ["Yu Gothic", "sans-serif"], mono: ["Consolas", "monospace"] }, size: { body: 16 }, lineHeight: { body: 1.7 }, ja: { lineBreak: "strict", wordBreak: "auto-phrase", palt: "heading-only" } }`、`motion = { duration: { fast: 100, normal: 200, slow: 300 }, easing: { standard: "ease" }, reducedMotion: "fade-only" }`。
- **`CATALOG_OK`**: 設計 §4.3 の 18 部品。`kind` は設計どおり。`states` は §4.2 の必須の状態を全て `true`。`maturity` は `stable`。`a11y.role` は任意の非空文字列、`a11y.keyboard` は `presentational` 以外が `["Enter"]`、`presentational` が `[]`。
- **`PRESET_OK`** (`family: "jp-business-web"`): `modes = { light: true, dark: { na: "light のみ" } }`、`tokenMap` は `light.<16 役割>` (各 `"x"`) と `space` / `typography` / `radius` / `shadow` / `motion` (各 `"x"`)、`componentMap` は `CATALOG_OK` の 18 部品全てに `{ fit: "native", target: "X" }`、`license = { distribution: "reference-only", approval: "none" }`。
- **照合の仕方**: 「finding を返す」の期待は `rule` と `subject` (lint は `rule` と `line` と `column`) の並びだけを見る。`message` と `value` の文面は解析しない。「空」は `[]`。

## 3. 候補 oracle

### 3.1 contrast の計算 (設計 §3.1、§10 の I2〜I4、検証 (a))

| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| `CANDIDATE-U-CDS-001` | `parseHexColor` | (a) `"#fff"` (b) `"#FFFFFF"` (c) `"#0b57d0"` (d) `"#ffff"` (e) `"#ffffff80"` (f) `"fff"` (g) `"rgb(0,0,0)"` (h) `""` | (a) `{255,255,255}` (b) `{255,255,255}` (c) `{11,87,208}` (d)〜(h) `null` で、例外を投げない |
| `CANDIDATE-U-CDS-002` | `relativeLuminance` | (a) 黒 `{0,0,0}` (b) 白 `{255,255,255}` (c) `#767676` (d) `#0b57d0` | (a) 0 (b) 1 (c) 約 0.18116 (小数 5 桁) (d) 約 0.11442 (小数 5 桁) |
| `CANDIDATE-U-CDS-003` | `contrastRatio` | (a) 黒と白 (b) 白と黒 (c) 白と白 (d) `#767676` と白 (e) `#777777` と白 | (a)(b) 21 で、引数の順に依らない (c) 1 (d) 約 4.5422 (小数 4 桁) (e) 約 4.4781 (小数 4 桁) |
| `CANDIDATE-U-CDS-004` | `checkTokenContrast` | `{ light: PALETTE_OK }`、`REQUIRED_CONTRAST_PAIRS` | 空 (正しい palette に finding を出さない) |
| `CANDIDATE-U-CDS-005` | `checkTokenContrast` | `{ light: { text: "#777777", background: "#ffffff" } }`、pairs `[{ fg: "text", bg: "background", min: 4.5 }]` | `[{ rule: "contrast.below_min", subject: "light:text/background" }]` |
| `CANDIDATE-U-CDS-006` | `checkTokenContrast` | pairs `[{ fg: "border", bg: "background", min: 3 }]` で、light の (a) `border: "#959595"` (b) `border: "#949494"`、`background: "#ffffff"`。pairs `[{ fg: "border", bg: "background", min: 4.5 }]` で (c) `border: "#767676"` | (a) `contrast.below_min` を 1 件 (比 2.9953 は、2 桁に丸めた 3.00 でも通さない) (b) 空 (比 3.0335) (c) 空 (比 4.5422。境界の直上は通す) |
| `CANDIDATE-U-CDS-007` | `checkTokenContrast` | pairs `[{ fg: "text", bg: "background", min: 4.5 }]` で、light が (a) `{ background: "#ffffff" }` (text が無い) (b) `{ text: "#ffffff80", background: "#ffffff" }` | (a) `[{ rule: "contrast.role_missing", subject: "light:text/background" }]` (b) `[{ rule: "contrast.unparseable", subject: "light:text/background" }]` |
| `CANDIDATE-U-CDS-008` | `checkTokenContrast` | pairs は 005 と同じ。(a) `{ light: { text: "#000000", background: "#ffffff" }, dark: { na: "x" } }` (b) `{ light: { text: "#000000", background: "#ffffff" } }` (dark 未指定) (c) `{ light: { text: "#000000", background: "#ffffff" }, dark: { text: "#777777", background: "#ffffff" } }` (d) light と dark の両方が `#777777` / `#ffffff` | (a)(b) 空 (c) `[{ rule: "contrast.below_min", subject: "dark:text/background" }]` (d) subject が `light:text/background`、`dark:text/background` の順の 2 件 |
| `CANDIDATE-U-CDS-009` | `REQUIRED_CONTRAST_PAIRS` | 定数そのもの | 長さ 16。`min` が 4.5 のものが 10 組 (`text`/`background`、`text`/`surface`、`text-muted`/`background`、`text-muted`/`surface`、`primary`/`background`、`on-primary`/`primary`、`on-danger`/`danger`、`on-warning`/`warning`、`on-success`/`success`、`on-info`/`info`)、3 のものが 6 組 (`border`/`background`、`focus-ring`/`background`、`danger`/`background`、`warning`/`background`、`success`/`background`、`info`/`background`)。16 の色の役割が全て、いずれかの組に現れる |

### 3.2 token の schema (設計 §3、I5、`validateTokenSet`)

| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| `CANDIDATE-U-CDS-010` | `validateTokenSet` | `TOKENS_OK` | 空 |
| `CANDIDATE-U-CDS-011` | `validateTokenSet` | `TOKENS_OK` から `modes.light.surface` を取り除く | `[{ rule: "token.role_missing", subject: "light.surface" }]` |
| `CANDIDATE-U-CDS-012` | `validateTokenSet` | (a) `modes.dark` を未指定にする (b) `modes.dark = { na: "  " }` (c) `typography.ja = { na: "" }` | (a) `[{ rule: "token.mode_missing", subject: "modes.dark" }]` (b) `[{ rule: "token.na_reason_missing", subject: "modes.dark" }]` (c) `[{ rule: "token.na_reason_missing", subject: "typography.ja" }]` |
| `CANDIDATE-U-CDS-013` | `validateTokenSet` | `space` を (a) `[4, 8, 8, 16]` (b) `[4, 0, 8]` (c) `[8, 4]` (d) `[0, 4]` (e) `[-1, 4]` にする | (a) `[{ rule: "token.space_not_increasing", subject: "space[2]" }]` (b) `[{ rule: "token.space_not_positive", subject: "space[1]" }]` (1 件だけ。0 の要素には increasing を付けない) (c) `[{ rule: "token.space_not_increasing", subject: "space[1]" }]` (d) `[{ rule: "token.space_not_positive", subject: "space[0]" }]` (先頭の 0。隣どうしの順序は守られていても拒否する) (e) `[{ rule: "token.space_not_positive", subject: "space[0]" }]` (先頭の負の数) |
| `CANDIDATE-U-CDS-014` | `validateTokenSet` | `TOKENS_OK` から 1 点ずつ: (a) `family.body = ["Meiryo", "Yu Gothic"]` (b) `size.body = 13` (c) `lineHeight.body = 1.4` (d) `family.mono = ["Consolas"]` | (a) `token.font_no_generic_fallback` / `typography.family.body` (b) `token.font_size_below_min` / `typography.size.body` (c) `token.line_height_below_min` / `typography.lineHeight.body` (d) `token.font_no_generic_fallback` / `typography.family.mono`。それぞれ 1 件だけ |
| `CANDIDATE-U-CDS-015` | `validateTokenSet` | `TOKENS_OK` から 1 点ずつ: (a) `radius.none = 1` (b) `radius.md = 1` (`sm` は 2) (c) `duration = { fast: 200, normal: 200, slow: 300 }` (d) `reducedMotion` を取り除く | (a) `token.radius_none_nonzero` / `radius.none` (b) `token.radius_not_ordered` / `radius.md` (c) `token.motion_not_ordered` / `motion.duration` (d) `token.reduced_motion_missing` / `motion.reducedMotion`。それぞれ 1 件だけ |

### 3.3 直書き禁止の lint (設計 §7.1、I6、検証 (b))

`options` は `{ tokenFiles: ["src/tokens.css"] }`。`line` と `column` は 1 始まり。

| ID | 対象 | 入力 (`path`、`text`) | 期待 |
|---|---|---|---|
| `CANDIDATE-U-CDS-016` | `lintHardcodedValues` | `a.css`、`.a { color: #fff; }` | `[{ rule: "hardcoded.color", line: 1, column: 13 }]` |
| `CANDIDATE-U-CDS-017` | `lintHardcodedValues` | (a) `a.css`、4 行の text: `.a { color: var(--cds-text); margin: 0; padding: 0px; }` / `/* color: #fff; padding: 13px */` / `// x: #000` / `@media (min-width: 768px) { .b { gap: var(--cds-space-2); } }` (b) `a.css`、`.a { background: url(https://x.example/a.png); }` (c) `a.css`、`.a { font-family: var(--cds-font-body); }` (d) `a.css`、`@media (min-width: 768px) { .a { color: #fff; padding: 13px; } }` (1 行) (e) `a.css`、同じ内容を `@media (min-width: 768px) {` / `  .a {` / `    color: #fff;` / `    padding: 13px;` / `  }` / `}` の 6 行に書いたもの (f) `a.css`、`@media (min-width: 768px)` / `  and (max-width: 1024px) {` / `  .a { gap: 0; }` / `}` の 4 行 | (a)(b)(c)(f) いずれも空 (token の参照・0・コメント・`@media` の条件の中の breakpoint・URL の `//`・font の token 参照は検出しない) (d) `[{ rule: "hardcoded.color", line: 1, column: 41 }, { rule: "hardcoded.length", line: 1, column: 56 }]` (e) `[{ rule: "hardcoded.color", line: 3, column: 12 }, { rule: "hardcoded.length", line: 4, column: 14 }]`。(d) と (e) は同じ 2 つの rule を返す (`@media` の中の宣言は検査し、1 行か複数行かで結果が変わらない) |
| `CANDIDATE-U-CDS-018` | `lintHardcodedValues` | (a) `a.css`、`.a { padding: 13px; font-family: Meiryo, sans-serif; transition: opacity 200ms ease; }` (b) `a.css`、`.a { gap: var(--cds-space-2, 8px); }` | (a) `[{ rule: "hardcoded.length", line: 1, column: 15 }, { rule: "hardcoded.font", line: 1, column: 21 }, { rule: "hardcoded.motion", line: 1, column: 74 }]` (b) `[{ rule: "hardcoded.length", line: 1, column: 30 }]` (var の fallback の中も数える) |
| `CANDIDATE-U-CDS-019` | `lintHardcodedValues` | (a) `a.tsx`、text は `"/* a\n b */\nconst s = { color: 'rgb(0, 0, 0)', fontFamily: 'Meiryo' };\n"` (`\n` は改行) (b) `src/tokens.css`、`:root{--c:#fff}` (c) `src/tokens.css.bak`、`:root{--c:#fff}` | (a) `[{ rule: "hardcoded.color", line: 3, column: 21 }, { rule: "hardcoded.font", line: 3, column: 36 }]` (複数行のコメントの後でも行番号は元の file の行を指す) (b) 空 (`tokenFiles` に完全に一致) (c) `hardcoded.color` を 1 件 (部分一致では免除しない) |

### 3.4 部品カタログ (設計 §4、I7・I8、検証 (c))

`requiredIds` は設計 §4.3 の 18 個。

| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| `CANDIDATE-U-CDS-020` | `checkCatalog` / `REQUIRED_COMPONENT_IDS` | `CATALOG_OK`、`REQUIRED_COMPONENT_IDS` | `checkCatalog` は空。`REQUIRED_COMPONENT_IDS` は長さ 18 で、設計 §4.3 の表の id と同じ集合 |
| `CANDIDATE-U-CDS-021` | `checkCatalog` | `CATALOG_OK` から 1 点ずつ: (a) `button` の `states.hover` を取り除く (b) `data-table` の `states.stale = { na: "" }` (c) `text-input` の `states.readonly = { na: "表示専用の入力は別部品" }` (d) `button` の `states` に `pressed: true` を足す (e) `badge` (presentational) の `states.hover` を取り除く | (a) `catalog.state_missing` / `button.hover` (b) `catalog.na_reason_missing` / `data-table.stale` (c) 空 (理由つきの非適用は通す) (d) `catalog.state_unknown` / `button.pressed` (e) 空 (presentational の必須は `default` だけ)。(a)(b)(d) は 1 件だけ |
| `CANDIDATE-U-CDS-022` | `checkCatalog` | `CATALOG_OK` から 1 点ずつ: (a) `radio` の record を複製して 2 件にする (b) `skeleton` の record を取り除く (c) `select` の `a11y.keyboard = []` (d) `alert` の `a11y.keyboard = []` | (a) `catalog.duplicate_id` / `radio` (b) `catalog.required_component_missing` / `skeleton` (c) `catalog.keyboard_missing` / `select` (d) 空 (presentational は keyboard が空でもよい)。(a)(b)(c) は 1 件だけ |
| `CANDIDATE-U-CDS-023` | `checkCatalogUsage` | `CATALOG_OK` の `tabs` を `maturity: "beta"` にしたカタログ。usages は `[{ file: "a.tsx", componentId: "button" }, { file: "a.tsx", componentId: "tabs" }, { file: "b.tsx", componentId: "carousel" }]` | `target: "production"` では、`usage.immature_in_production` / `a.tsx:tabs` と `usage.unknown_component` / `b.tsx:carousel` の 2 件 (usages の順)。`target: "prototype"` では `usage.unknown_component` / `b.tsx:carousel` の 1 件だけ (成熟度は見ない) |

### 3.5 preset の契約と配布 (設計 §6・§8、I9・I10)

`colorRoles` は設計 §3.1 の 16 役割。

| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| `CANDIDATE-U-CDS-024` | `checkPresetManifest` | `PRESET_OK`、`CATALOG_OK`、`colorRoles` | 空 |
| `CANDIDATE-U-CDS-025` | `checkPresetManifest` | `PRESET_OK` から 1 点ずつ: (a) `tokenMap` の `light.text` を取り除く (b) `tokenMap.motion = ""` (c) `componentMap` の `dialog` を取り除く (d) `componentMap` に `carousel: { fit: "native", target: "X" }` を足す (e) `button` を `{ fit: "adapted" }` (target 無し) にする (f) `dialog` を `{ fit: "gap" }` (note 無し) にする (g) `modes.dark = { na: "" }` にする (h) `modes.dark = true` にして `tokenMap` に `dark.*` を足さない | (a) `preset.token_unmapped` / `light.text` (b) `preset.token_unmapped` / `motion` (c) `preset.component_unmapped` / `dialog` (d) `preset.component_unknown` / `carousel` (e) `preset.target_missing` / `button` (f) `preset.note_missing` / `dialog` (g) `preset.mode_na_reason_missing` / `modes.dark` (h) `preset.token_unmapped` が `dark.<16 役割>` の 16 件 (役割は設計 §3.1 の表の順)。(a)〜(g) は 1 件だけ。(g) は `dark.*` の写像を要求しない。`fit: "custom"` と `{ fit: "gap", note: "代替は自作" }` は不備にならない |
| `CANDIDATE-U-CDS-026` | `isPresetDistributable` | `PRESET_OK` の `license` を (a) `{ distribution: "reference-only", approval: "none" }` (b) `{ distribution: "vendored", approval: "none" }` (c) `{ distribution: "vendored", approval: "approved" }` (`recordRef` 無し) (d) `{ distribution: "vendored", approval: "approved", recordRef: "  " }` (e) `{ distribution: "vendored", approval: "approved", recordRef: "#1717 の承認コメント" }` (f) (a) に `candidates: ["Fluent 2"]` を足した preset | (a) `true` (b) `false` (c) `false` (d) `false` (e) `true` (f) `true` (`candidates` は判定に使わない) |

### 3.6 導入の順序 (設計 §7.2、I11)

| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| `CANDIDATE-U-CDS-027` | `resolveFindingSeverity` | `stage` × `inBaseline` の 8 通り | `baseline` と `advisory` は `inBaseline` に依らず `advisory`。`ratchet` は `inBaseline: true` が `advisory`、`false` が `error`。`enforce` は `inBaseline` に依らず `error` |

## 4. 規則と oracle の対応 (網羅の確認)

| 設計の規則 | oracle |
|---|---|
| I1 (純粋・戻りの順) | 全 oracle が引数だけで呼ぶ。順序は 008 (d)、018 (a)、019 (a)、023 |
| I2 (比は丸めず、順に依らない) | 003、006 |
| I3 (hex の受理) | 001 |
| I4 (contrast の rule) | 005、007、008 |
| I5 (token の rule) | 010〜015 |
| I6 (lint) | 016〜019 |
| I7 (カタログ) | 020〜022 |
| I8 (部品の使用) | 023 |
| I9 (preset) | 024、025 |
| I10 (配布) | 026 |
| I11 (導入の順序) | 027 |
| I12 (doctor に置かない) | oracle にしない。実装 PR で `src/doctor/` に変更が無いことを review で確かめる |
| 設計 §3.1 の 16 組、§4.3 の 18 部品 | 009、020 |

## 5. 受け入れの実測 (oracle ではない)

実装 PR の前に、次を確かめる。

- 004 の `PALETTE_OK` の 16 組の比を、別の計算 (WCAG の式を手で実装した小さい script) で再計算し、全て下限以上であること。契約 PR では、`#767676` / 白 = 4.5422、`#0b57d0` の輝度 = 0.11442、`#949494` / 白 = 3.0335、`#959595` / 白 = 2.9953 と、016〜019 の行・桁を、使い捨ての script で確かめた (script は commit しない)。
- 設計 §11 の最後の項目 (S-04 の enum との突き合わせ) は、#790 の S-04 が確定した後の別の確認で、本書の oracle にしない。

## 6. 注記

- 本書は `src/` も `scripts/` も変えない契約の PR の一部である。`function-spec.md`、`L7-unit-test-design.md`、`tests/gate-static.test.ts` は変えない。
- consumer 向けの UI 標準の正本 (`docs/templates/vmodel/L4-ui-standard.md`) と `tokens.yaml` / harness の `ui-standard.md` は変えない (#1226 の範囲)。
