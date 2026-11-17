---
title: "L7 consumer operations controls test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/consumer-operations-controls.md
parent_doc: docs/design/harness/L6-function-design/consumer-operations-controls.md
status: confirmed
updated: 2026-11-17
issue: 1725
---

# consumer 向け本番運用の統制 テスト設計 (issue #1725)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/consumer-operations-controls.md` (未実装の目標契約)。本書は §3 統制 record、§4 ツール record、§5 preset の対応表、§6 検証の順序、§7 高影響境界、§9 ログと migration の規則、§10 の DbC を検証する oracle を、候補 ID `CANDIDATE-U-OPSCTL-001`〜`037` で宣言する。共有の `docs/test-design/harness/L7-unit-test-design.md` には、この PR では索引の行を足さない (実装 PR の後続で足す)。検証 (e) の実行時の観測は純関数にならないので oracle の対象にしない (設計 §6)。

進め方は設計保護 gate の三段階に従う。

1. **Red**: 候補 ID を引用した `it.fails` を `tests/consumer-operations-controls.test.ts` に入れる。この段が足してよい `src/` は、設計保護 gate (`design-protection-diff-gate.md` §10.3 手順 1') の例外の範囲、すなわち新規 module の契約形の stub (と必要な登録) だけで、既存 module には触れない。stub は成功側の値を返さない (空配列や `true` を返さず、fail-close の値か投げる)。Red の前提 (fixture が作れる) は、同じ fixture を使う対の通常 `it` で確かめる。
2. **昇格 (src を含まない)**: 接頭辞 `CANDIDATE-` を外した正式 ID `U-OPSCTL-*` へ改め、テスト名の引用を同時に書き換える。正式 ID を引用より先に作らない (`oracle-test-trace`)。
3. **実装 PR**: `it.fails` を `it` に戻して Green にする。実装 PR は `docs/test-design/` を変えない。

**Red の弱さの明示**: 対象の module が無い間は、動的 import の失敗で `it.fails` が通る。これは個々の規則が Red である証拠ではない。Green の PR は、各 oracle の期待を 1 か所だけ崩す変更を実装に入れて、対応する oracle が落ちることを確かめてから `it` に戻す (§5 の変異の表)。

**どこで走るか**: 全 oracle は harness 側の Vitest で、純関数を直接呼ぶ。ツールの実行 (secret の検出、IaC の検査、実機の観測) は consumer 側であり、ここでは走らせない。harness 側が確かめるのは、record の schema と、preset の対応表の整合だけである (設計 §6)。

## 2. テストレベルと fixture

全 oracle は file・環境変数・時刻・network・実 process を使わない (設計 I1)。`today` は常に `"2026-11-17"` を引数で渡す。小さい完備な入力を作り、1 点だけ変えて使う。

- **`CTRL_SEC`**: `{ id: "OPS-SEC-001", domain: "security", outcome: "secret が commit されない", tier: { nfrItem: "E.5.1.1", minLevel: 3 }, layers: ["L4","L7"], appliesTo: ["server","client"], proof: "static", evidence: { format: "sarif", schemaRef: "s/sarif", bindsTo: ["head"] }, stage: "advisory" }`。
- **`CTRL_DB`**: `OPS-DB-001`、`database`、`appliesTo: ["server"]`、`proof: "static"`、`format: "json-result"`、`layers: ["L5","L7"]`、`minLevel: 3`、`stage: "advisory"`。
- **`CTRL_LOG1`**: `OPS-LOG-001`、`log-observability`、`appliesTo: ["server"]`、`proof: "static"`、`format: "junit-xml"`、`layers: ["L4","L7"]`、`minLevel: 2`、`stage: "advisory"`。
- **`CTRL_LOG2`**: `OPS-LOG-002`、`log-observability`、`appliesTo: ["server"]`、`proof: "runtime"`、`format: "json-result"`、`bindsTo: ["head","deploy-receipt"]`、`layers: ["L13","L14"]`、`minLevel: 2`、`stage: "baseline"`。
- **統制 id の別名**: `ID_SEC` = `OPS-SEC-001`、`ID_DB` = `OPS-DB-001`、`ID_LOG1` = `OPS-LOG-001`、`ID_LOG2` = `OPS-LOG-002`、`ID_CRASH` = `OPS-CRASH-001` (`CTRL_CRASH`: `appliesTo: ["client"]` の統制)、`ID_UNKNOWN` = 統制の集合に無い id。oracle の表は別名で書く。
- **`CONTROLS_4`** = `[CTRL_SEC, CTRL_DB, CTRL_LOG1, CTRL_LOG2]`。
- **`TOOL_OK`**: `{ id: "t", checkedAt: "2026-11-01", lifecycle: "available", verification: "confirmed", sourceUrl: "https://example.test/doc", license: { distribution: "reference-only", approval: "approved", recordRef: "ADR-X" } }`。
- **`TOOL_PENDING`**: `TOOL_OK` の `verification` を `"pending-primary"`、`sourceUrl` を `null`、`license` を `{ distribution: "reference-only", approval: "none" }` にしたもの。
- **`PROFILE_OK`**: `{ semconvVersion: "1.0.0", fieldMap: { "timestamp": "time", "severity": "level", "body": "msg", "service.name": "service" }, piiKeys: ["email", "phone"], mask: "[MASKED]" }`。`1.0.0` は fixture の仮の値であり、実在の規約の版を主張しない。
- **`PRESET_A`** (target `server`、AWS + CDK を模す): `tools` は `secret-scanner`、`iac-lint`、`migration-lint`、`test-runner`、`iac-assert`、`observer` の 6 つ (各 `TOOL_OK` の id を替えたもの)。`controlMap` は設計 §8.2 のとおり。
- **`PRESET_B`** (target `server`、VPS + compose + pino + Fluent Bit を模す): `tools` は `secret-scanner`、`compose-lint`、`migration-lint`、`logger`、`test-runner`、`shipper-config-check`、`observer` の 7 つ (各 `TOOL_OK` の id を替えたもの)。`controlMap` は設計 §8.3 のとおり。
- **照合の仕方**: 「finding を返す」の期待は `rule` と `subject` (lint は `rule` と `line` と `column`) の並びだけを見る。`message` の文面は解析しない。「空」は `[]`。

## 3. 候補 oracle

各 oracle は、入力・期待に加えて、**その oracle が殺す反例または変異**を最後の列に書く。

### 3.1 統制 record (設計 §3、I2・I3)

| ID | 対象 | 入力 | 期待 | 殺す変異 |
|---|---|---|---|---|
| `CANDIDATE-U-OPSCTL-001` | `validateControlRecord` | `CTRL_SEC`、`CTRL_DB`、`CTRL_LOG1`、`CTRL_LOG2` のそれぞれ | 全て空 | 正しい record を弾く過剰な検査 |
| `CANDIDATE-U-OPSCTL-002` | `validateControlRecord` | `CTRL_SEC` の `id` を、次の (a)〜(g) に替える。(a) 接頭辞 `OPS` が無い (領域部と番号だけ) (b) 領域部が 1 文字 (c) 番号が 2 桁 (d) 全て小文字 (e) 領域部が 6 文字 (f) 領域部が `LOG`、番号が `999` (g) 領域部が 5 文字 (全て大文字)、番号が `000` | (a)〜(e) は `[{ rule: "control.id_invalid", subject: "id" }]` (f)(g) は空 | パターンの正規表現が緩い・厳しい (桁数・大文字・領域の長さ 2〜5) |
| `CANDIDATE-U-OPSCTL-003` | `validateControlRecord` | `domain` を 11 値それぞれに、また (b) `"security "` (c) `"Security"` (d) `""` に替える | 11 値は空。(b)(c)(d) は `[{ rule: "control.domain_unknown", subject: "domain" }]` | 領域の enum の欠落・大文字小文字の許容・前後の空白の許容 |
| `CANDIDATE-U-OPSCTL-004` | `validateControlRecord` | `outcome` を (a) `""` (b) `"   "` (c) `"\t\n"` (d) `"x"` | (a)(b)(c) は `[{ rule: "control.outcome_blank", subject: "outcome" }]` (d) 空 | 空白だけの outcome の素通り |
| `CANDIDATE-U-OPSCTL-005` | `validateControlRecord` | `tier` を (a) `{ nfrItem: "A.1.1.1", minLevel: 0 }` (b) `{ nfrItem: "A.1.1.1", minLevel: 5 }` (c) `minLevel: 6` (d) `minLevel: -1` (e) `minLevel: 2.5` (f) `{ nfrItem: "  ", minLevel: 2 }` (g) `tier` が無い | (a)(b) は空。(c)〜(g) は `[{ rule: "control.tier_invalid", subject: "tier" }]` | 範囲 0〜5 の境界、整数の検査、空の IPA 項目、欠落の素通り |
| `CANDIDATE-U-OPSCTL-006` | `validateControlRecord` | `layers` を (a) `[]` (b) `["L3"]` (c) `["L15"]` (d) `["L7","L7"]` (e) `["L4","L14"]` (f) `["l7"]` | (a) `control.layers_empty` (subject `layers`) (b)(c)(f) は `control.layer_invalid` (subject は層の値) (d) `control.layer_duplicate` (subject `L7`) (e) 空 | 層の範囲 L4〜L14 の端、重複の許容、空配列の素通り |
| `CANDIDATE-U-OPSCTL-007` | `validateControlRecord` | `stage` を (a) `"enforce"` (b) `"warn"` (c) `"Enforce"` に、`appliesTo` を (d) `[]` (e) `["server","edge"]` に替える | (a) 空 (b)(c) `control.stage_invalid` (subject `stage`) (d)(e) `control.applies_to_invalid` (subject `appliesTo`) | 段の enum への未知の値の素通り、`appliesTo` の空の許容 |
| `CANDIDATE-U-OPSCTL-008` | `validateControlRecord` | `evidence` を (a) `format: "text"` (b) `schemaRef: " "` (c) `bindsTo: []` (d) `bindsTo: ["head","x"]` (e) `evidence` が無い (f) `format: "junit-xml"` | (a)〜(e) は `[{ rule: "control.evidence_invalid", subject: "evidence" }]` (f) 空 | 自由文の証跡の素通り、証跡の束縛先の欠落、未知の束縛先の許容 |
| `CANDIDATE-U-OPSCTL-009` | `validateControlRecord` | (a) `CTRL_LOG2` (b) `CTRL_LOG2` の `bindsTo` を `["head"]` に (c) `CTRL_LOG2` の `bindsTo` を `["deploy-receipt"]` に (d) `CTRL_SEC` の `bindsTo` を `["head","deploy-receipt"]` に (e) 入力が `null`、`"x"`、`[]` | (a) 空 (b) `[{ rule: "control.runtime_unbound", subject: "evidence.bindsTo" }]` (c) 空 (d) 空 (e) 3 つとも `[{ rule: "control.not_object", subject: "" }]` で例外を投げない | 静的な検査が実行時の証明に化ける (runtime が HEAD だけに束縛)、静的に receipt を足すのを弾く過剰な検査、object でない入力で投げる |
| `CANDIDATE-U-OPSCTL-010` | `checkControlSet` | (a) `CONTROLS_4` (b) `[CTRL_SEC, CTRL_DB, CTRL_SEC, CTRL_SEC]` (c) `[CTRL_DB, CTRL_SEC, CTRL_DB]` (d) `[]` | (a) 空 (b) `control.duplicate_id` が subject `ID_SEC` で 2 件 (c) subject `ID_DB` で 1 件 (d) 空 | 重複の見逃し、1 件目を重複と数える、重複の数え落とし |

### 3.2 ツール record (設計 §4、I4〜I6)

| ID | 対象 | 入力 | 期待 | 殺す変異 |
|---|---|---|---|---|
| `CANDIDATE-U-OPSCTL-011` | `validateToolEntry` | `today = "2026-11-17"`。(a) `TOOL_OK` (b) `TOOL_PENDING` | (a)(b) とも空 (`pending-primary` で `sourceUrl` が `null` は不備にしない) | `pending-primary` を一律に不備とする過剰な検査 |
| `CANDIDATE-U-OPSCTL-012` | `validateToolEntry` | `checkedAt` を (a) `"2026-11-17"` (b) `"2026-11-18"` (c) `"2026-02-30"` (d) `"2026/11/01"` (e) `"2026-1-1"` (f) `""` (g) `"2026-13-01"` | (a) 空 (b)〜(g) は `[{ rule: "tool.checked_at_invalid", subject: "checkedAt" }]` | 未来日・実在しない日付・形式違反の素通り、当日の誤拒否 |
| `CANDIDATE-U-OPSCTL-013` | `validateToolEntry` | (a) `lifecycle: "deprecated"` (b) `lifecycle: ""` (c) `verification: "ok"` (d) 4 つの正しい `lifecycle` を順に | (a)(b) `tool.lifecycle_unknown` (subject `lifecycle`) (c) `tool.verification_unknown` (subject `verification`) (d) 全て空 | lifecycle の enum が未知の値を通す、4 値のどれかが欠ける |
| `CANDIDATE-U-OPSCTL-014` | `validateToolEntry` | (a) `TOOL_OK` の `sourceUrl` を `null` に (b) `"http://example.test/x"` に (c) `"example.test/x"` に (d) `TOOL_PENDING` の `sourceUrl` を `"http://example.test/x"` に (e) `TOOL_PENDING` の `sourceUrl` を `"https://example.test/x"` に | (a) `tool.source_missing` (subject `sourceUrl`) (b)(c)(d) `tool.source_not_https` (subject `sourceUrl`) (e) 空 | 確認済みで出典が無いものの素通り、http の許容、pending でも URL を書いたときに https を要求しない |
| `CANDIDATE-U-OPSCTL-015` | `validateToolEntry` | `license` を (a) `{ distribution: "reference-only", approval: "approved" }` (b) `{ ..., approval: "approved", recordRef: "  " }` (c) `{ ..., approval: "approved", recordRef: "ADR-X" }` (d) `{ ..., approval: "none" }` | (a)(b) `[{ rule: "tool.license_unrecorded", subject: "license.recordRef" }]` (c)(d) 空 | 承認の記録なしの `approved` の素通り、`none` を誤って不備にする |
| `CANDIDATE-U-OPSCTL-016` | `isToolAdoptable` | `TOOL_OK` を基準に、(a) そのまま (b) `verification` を `pending-primary` (c) `lifecycle` を各 3 値 (`new-signups-stopped`、`end-of-support-scheduled`、`license-changed`) (d) `approval: "none"` (e) `approved` で `recordRef` 無し (f) `recordRef: " "` | (a) 真 (b)〜(f) 偽 | 3 条件のどれかの欠落 (確認済み・available・承認の記録)。advisor 相談や既存の契約が承認の代わりになる |
| `CANDIDATE-U-OPSCTL-017` | `isToolDistributable` | (a) `reference-only`・`none` (b) `vendored`・`none` (c) `vendored`・`approved`・`recordRef` 無し (d) `vendored`・`approved`・`recordRef: "ADR-X"` (e) (d) に加え `lifecycle: "license-changed"`、`verification: "pending-primary"` | (a) 真 (b)(c) 偽 (d) 真 (e) 真 (配布の規則は他の field を見ない) | 第三者のコードの配布が承認なしで通る、配布の判定が `lifecycle` など他の field に依存する |
| `CANDIDATE-U-OPSCTL-018` | `checkToolStaleness` | `today = "2026-11-17"`、`maxAgeDays = 30`。`checkedAt` が (a) `"2026-10-18"` (30 日前) (b) `"2026-10-17"` (31 日前) (c) `"2026-11-17"` (d) `"bad"` | (a) 空 (b) `[{ rule: "tool.stale", subject: "checkedAt" }]` (c) 空 (d) `[{ rule: "tool.checked_at_invalid", subject: "checkedAt" }]` | 境界 (等しいときは通す) の不等号の誤り、日数差の月またぎの計算誤り |

### 3.3 preset の対応表 (設計 §5、I7)

`CONTROLS_4` と `PRESET_A` / `PRESET_B` を使う。「1 点だけ変える」の変更は、それぞれの preset の複製に対して行う。

| ID | 対象 | 入力 | 期待 | 殺す変異 |
|---|---|---|---|---|
| `CANDIDATE-U-OPSCTL-019` | `checkPresetMapping` | `CONTROLS_4` と (a) `PRESET_A` (b) `PRESET_B` | 両方とも空 | 正しい対応表を弾く過剰な検査 |
| `CANDIDATE-U-OPSCTL-020` | `checkPresetMapping` | `PRESET_A` から (a) `controlMap["ID_DB"]` を取り除く (b) `controlMap["ID_UNKNOWN"]` を足す (c) `ID_SEC` の 1 つ目のエントリの `ruleId` を `""` に (d) `ID_DB` を `{ na: "  " }` に (e) `ID_DB` を `{ na: "別の方法で満たす" }` に | (a) `[{ rule: "preset.control_unmapped", subject: "ID_DB" }]` (b) `[{ rule: "preset.control_unknown", subject: "ID_UNKNOWN" }]` (c) `[{ rule: "preset.rule_id_missing", subject: "ID_SEC:secret-scanner" }]` (d) `[{ rule: "preset.na_reason_missing", subject: "ID_DB" }]` (e) 空 | 統制を黙って落とす、未知の統制の素通り、rule ID の空の素通り、理由なしの `na` の素通り |
| `CANDIDATE-U-OPSCTL-021` | `checkPresetMapping` | `PRESET_A` から (a) `ID_SEC` の 1 つ目のエントリの `tool` を `"ghost"` に (b) `tools` の `migration-lint` の `verification` を `pending-primary`・`approval: "none"` に (c) `tools` の `secret-scanner` の `lifecycle` を `end-of-support-scheduled` に | (a) `[{ rule: "preset.tool_unknown", subject: "ID_SEC:ghost" }]` (b) `[{ rule: "preset.tool_not_adoptable", subject: "ID_DB:migration-lint" }]` (c) `[{ rule: "preset.tool_not_adoptable", subject: "ID_SEC:secret-scanner" }]` | 未登録のツールの参照、候補のままのツールを採用済みの顔で通す、終了予定のツールの素通り |
| `CANDIDATE-U-OPSCTL-022` | `checkPresetMapping` | (a) `CONTROLS_4` に `appliesTo: ["client"]` の統制 `ID_CRASH` を足し、`PRESET_A` (target `server`) を検査する (b) 同じ `CONTROLS_4` と `ID_CRASH` に対し、`target: "client"` で `controlMap` が `ID_CRASH` と `ID_SEC` だけの preset を検査する | (a) 空 (サーバの preset はクライアント専用の統制を要求されない) (b) 空 (クライアントの preset は `server` だけの統制を要求されない。`ID_SEC` は `appliesTo` に `client` を含むので写像が要る) | target を無視して全統制を要求する、クライアントとサーバの統制の混線 |
| `CANDIDATE-U-OPSCTL-023` | `checkPresetMapping` | `PRESET_A` から (a) `ID_LOG2` の `scope: "runtime"` のエントリを取り除く (b) `ID_LOG2` の `runtime` のエントリを `manual-review` に替える (c) `ID_SEC` (static) の全エントリを `manual-review` にする | (a)(b) `[{ rule: "preset.runtime_scope_missing", subject: "ID_LOG2" }]` (c) 空 | 実行時の統制を静的な検査だけで満たしたことにする |

### 3.4 ログと migration (設計 §9、I8〜I10)

| ID | 対象 | 入力 | 期待 | 殺す変異 |
|---|---|---|---|---|
| `CANDIDATE-U-OPSCTL-024` | `checkLogProfile` | (a) `PROFILE_OK` (b) `semconvVersion` を `""`、`"latest"`、`"1.0"`、`"v1.0.0"` に (c) `fieldMap` から `"body"` を取り除く (d) `fieldMap["severity"]` を `""` に (e) `mask` を `" "` に | (a) 空 (b) 4 つとも `[{ rule: "logprofile.semconv_version_unpinned", subject: "semconvVersion" }]` (c) `[{ rule: "logprofile.field_map_incomplete", subject: "body" }]` (d) 同 rule で subject `severity` (e) `[{ rule: "logprofile.mask_blank", subject: "mask" }]` | 版の固定の欠落 (`latest` や浮動の版を通す)、論理名の欠落の素通り、空のマスクの素通り |
| `CANDIDATE-U-OPSCTL-025` | `checkLogRecord` | `PROFILE_OK` と (a) `{ time: "t", level: "info", msg: "m", service: "s" }` (b) (a) から `msg` を除く (c) (a) の `service` を `""` に (d) (a) の `time` を `null` に (e) (a) の `level` を `"verbose"` に (f) (a) の `level` を `"FATAL"` に (g) `{}` | (a) 空 (b) `[{ rule: "log.field_missing", subject: "body" }]` (c) 同 rule、subject `service.name` (d) 同 rule、subject `timestamp` (e)(f) `[{ rule: "log.severity_invalid", subject: "severity" }]` (g) subject が `timestamp`、`severity`、`body`、`service.name` の順の 4 件 (`log.severity_invalid` は出さない) | 論理名と実キーの対応を見ない、空値・`null` の素通り、severity の enum (大文字は不可)、欠落時に severity の二重報告 |
| `CANDIDATE-U-OPSCTL-026` | `checkLogRecord` | `PROFILE_OK` と、(a) の基本の record に (a) `email: "[MASKED]"` (b) `email: "a@b.test"` (c) `user: { Email: "a@b.test", name: "n" }` (d) `items: [{ phone: "090" }, { phone: "[MASKED]" }]` (e) `{ ..., body: "email=a@b.test" }` (f) `PHONE: "090"` (g) `email: "a"`、`phone: "b"` の両方 | (a) 空 (b) `[{ rule: "log.pii_unmasked", subject: "email" }]` (c) subject `user.Email` (d) subject `items[0].phone` の 1 件 (e) 空 (本文の中身は見ない) (f) subject `PHONE` (g) subject が `email`、`phone` の順の 2 件 | 入れ子・配列の見落とし、大文字小文字の区別、マスク済みの誤検出、キー名でなく値の文面を推測して見る |
| `CANDIDATE-U-OPSCTL-027` | `lintMigration` | 各入力の期待は次のとおり。(a) `"DROP TABLE users;"` (b) `"alter table t drop column c;"` (c) `"TRUNCATE t;"` (d) `"DELETE FROM t;"` (e) `"DELETE FROM t WHERE id = 1;"` (f) `"-- DROP TABLE x;\nSELECT 1;"` (g) `"/* TRUNCATE t; */ SELECT 1;"` (h) `"-- ut-tdd:allow-destructive: 旧テーブルの退役 ADR-9\nDROP TABLE old;"` (i) `"-- ut-tdd:allow-destructive:   \nDROP TABLE old;"` (j) `"DROP TABLE old; -- ut-tdd:allow-destructive: ok"` (k) `"-- ut-tdd:allow-destructive: ok\n\nDROP TABLE old;"` (l) `"-- ut-tdd:allow-destructive: ok\nSELECT 1;\nDROP TABLE old;"` | (a) `[{ rule: "migration.destructive", line: 1, column: 1 }]` (b) `migration.destructive` (line 1、column は `drop column` の位置の 15) (c) line 1・column 1 (d) `migration.delete_without_where` (line 1、column 1) (e) 空 (f) 空 (g) 空 (h) 空 (i) `migration.allow_reason_missing` (line 1、column 1) と `migration.destructive` (line 2、column 1) の 2 件 (j) 空 (k) 空 (空行をはさんでも直前の空白でない行の印が効く) (l) `migration.destructive` (line 3、column 1) | 破壊的な文の見逃し、`WHERE` の有無の判定、コメントの中の誤検出、理由なしの許可の印の素通り、許可の印の効く範囲 (直前の空白でない行とだけ) の誤り、行・桁の数え誤り |

### 3.5 導入の順序と高影響境界 (設計 §6.1・§7.1、I11・I12)

| ID | 対象 | 入力 | 期待 | 殺す変異 |
|---|---|---|---|---|
| `CANDIDATE-U-OPSCTL-028` | `resolveControlSeverity` | `stage` × `inBaseline` の 8 通り | `baseline` と `advisory` は `inBaseline` に依らず `advisory`。`ratchet` は `inBaseline: true` が `advisory`、`false` が `error`。`enforce` は `inBaseline` に依らず `error` | 段の表の取り違え (`enforce` で baseline を許す、`ratchet` で baseline 外を許す) |
| `CANDIDATE-U-OPSCTL-029` | `requiresPoApproval` と、2 本の preset の同時の机上検証 | (a) `kind` が `consumer-infra-apply`、`cloud-region-iac-choice`、`org-account-control`、`pack-third-party-distribution`、`paid-external-api` の 5 つ (b) `docs-edit`、`preset-record-update`、`""`、`"Org-Account-Control"` (c) `checkControlSet(CONTROLS_4)` と、`PRESET_A` と `PRESET_B` の `checkPresetMapping` を同じ `CONTROLS_4` で続けて実行する | (a) 全て真 (b) 全て偽 (c) 3 つとも空 (統制 record は 1 組で、構造の違う 2 本が同じ統制の集合を矛盾なく写せる) | 高影響境界の欠落や、未知・大文字違いの `kind` の誤判定。契約が片方の preset の構造に寄る (2 本目で初めて通らなくなる) |
| `CANDIDATE-U-OPSCTL-030` | `validateControlRecord` | `CTRL_SEC` の `proof` を (a) `"Runtime"` (b) `"runtime "` (c) `""` (d) 欠落 (e) `"dynamic"` に、(f) `CTRL_LOG2` の `proof` を欠落かつ `bindsTo: ["head"]` に、(g) `CTRL_LOG2` の `proof` を `"static"` に | (a)〜(e) は `[{ rule: "control.proof_invalid", subject: "proof" }]` (f) `control.proof_invalid` の 1 件だけ (`control.runtime_unbound` は出さない) (g) 空 | `proof` の欠落・未知の値・大文字違いで `runtime_unbound` を避けられる |
| `CANDIDATE-U-OPSCTL-031` | `checkPresetMapping` | `PRESET_A` から (a) `ID_SEC` の 1 つ目のエントリの `scope` を `"Runtime"` に (b) `scope` を欠落に (c) `scope` を `"cron"` に (d) `ID_DB` の写像を `[]` に (e) `ID_DB` を `{ na: "別の方法で満たす" }` に | (a)(b)(c) `[{ rule: "preset.scope_invalid", subject: "ID_SEC:secret-scanner" }]` (d) `[{ rule: "preset.mapping_empty", subject: "ID_DB" }]` (e) 空 | 未知の `scope` の素通り、空の配列で統制を落とす |
| `CANDIDATE-U-OPSCTL-032` | `lintMigration` | (a) `"DROP TABLE old;\n-- ut-tdd:allow-destructive: ok"` (b) `"-- ut-tdd:allow-destructive: ok\nDROP TABLE old;"` (c) `"DROP TABLE old;\n\n-- ut-tdd:allow-destructive: ok"` | (a) `migration.destructive` (line 1、column 1) (b) 空 (c) `migration.destructive` (line 1、column 1)。SQL の後ろにだけある印は抑えない | 許可の印の向きの逆転 (印の前の SQL を抑える) |

### 3.6 `tier` の形と対応なし (設計 §3.4、I2)

形の正規表現は設計 §3.4 のとおりである。fixture は `CTRL_SEC` を基準にし、1 点だけ変える。

| ID | 対象 | 入力 | 期待 | 殺す変異 |
|---|---|---|---|---|
| `CANDIDATE-U-OPSCTL-033` | `validateControlRecord` | `nfrItem` を (a) `"A.1.1.1"` (b) `"C.1.3.1"` (c) `"F.2.10.12"` (d) `"E.5.1.1"` | 全て空 | 実在する形の項番を弾く過剰な検査、複数桁の番号の拒否 |
| `CANDIDATE-U-OPSCTL-034` | `validateControlRecord` | `nfrItem` を (a) `"X-1"` (b) `"G.1.1.1"` (c) `"a.1.1.1"` (d) `"A.1.1"` (e) `"A.1.1.1.1"` (f) `"A.0.1.1"` (g) `" A.1.1.1"` (h) `"A.1.1.1 "` (i) `"NFR-UNMAPPED"` (j) `""` | 全て `[{ rule: "control.tier_invalid", subject: "tier" }]` | 正規表現が緩い (大項目の範囲 A〜F、桁数 3、0 始まり、前後の空白、小文字の許容) |
| `CANDIDATE-U-OPSCTL-035` | `validateControlRecord` | `CTRL_SEC` の `tier` を `null`、`tierReason: "対応する IPA 項目が無い"` にし、`stage` を (a) `"advisory"` (b) `"baseline"` (c) `"ratchet"` に | 全て空 | `tier: null` を一律に不備とする過剰な検査、`enforce` 以外の段の誤拒否 |
| `CANDIDATE-U-OPSCTL-036` | `validateControlRecord` | `tier: null` で `tierReason` を (a) 欠落 (b) `""` (c) `"  "` (d) `"\t\n"` に。また (e) `tier` が正しい object のまま `tierReason: "x"` を足す | (a)〜(e) は `[{ rule: "control.tier_reason_missing", subject: "tierReason" }]` | 理由なしの `null` の素通り (対応づけの先送りが黙って通る)、object の `tier` と理由の併存の許容 |
| `CANDIDATE-U-OPSCTL-037` | `validateControlRecord` | (a) `tier: null`、`tierReason: "対応する IPA 項目が無い"`、`stage: "enforce"` (b) (a) の `tierReason` を欠落にする (c) `tier` が正しい object で `stage: "enforce"` | (a) `[{ rule: "control.tier_unmapped_enforce", subject: "stage" }]` (b) `control.tier_reason_missing` (subject `tierReason`) と `control.tier_unmapped_enforce` (subject `stage`) の 2 件、この順 (c) 空 | 対応のない統制が強制へ上がる、`enforce` の検査が理由の検査に隠れる、正しい `tier` の `enforce` の誤拒否 |

## 4. 規則と oracle の対応 (網羅の確認)

| 設計の規則 | oracle |
|---|---|
| I1 (純粋・戻りの順) | 全 oracle が引数だけで呼ぶ。順序は 010、025 (g)、026 (g)、027 |
| I2 (統制 record の rule) | 001〜009、030、033〜037 |
| I3 (重複 id) | 010 |
| I4 (ツール record の rule) | 011〜015 |
| I5 (採用・配布の判定) | 016、017 |
| I6 (鮮度) | 018 |
| I7 (preset の対応表) | 019〜023、031 |
| I8 (ログ profile) | 024 |
| I9 (ログ record) | 025、026。入力を変更しないことは 026 の実行の前後で同値を確かめる |
| I10 (migration) | 027、032 |
| I11 (導入の順序) | 028 |
| I12 (高影響境界) | 029 |
| I13 (doctor に置かない) | oracle にしない。実装 PR で `src/doctor/` に変更が無いことを review で確かめる |
| 設計 §8 の 2 本の preset | 019、029 (c) |
| 設計 §14 の初期記録 | oracle にしない (全て `pending-primary`・出典 null の記録で、形は 011 が許す) |

## 5. 変異の表 (Green の PR が行う)

Green の PR は、次の変異を 1 つずつ実装に入れて、対応する oracle が落ちることを確かめてから `it` に戻す。

| 変異 | 落ちるべき oracle |
|---|---|
| `runtime` の統制が `deploy-receipt` 無しでも通る | 009 |
| `isToolAdoptable` が `lifecycle` を見ない | 016 |
| `isToolAdoptable` が `recordRef` の空白を許す | 016 |
| `isToolDistributable` が `vendored` を常に真にする | 017 |
| `checkToolStaleness` が `>` を `>=` にする | 018 |
| `checkPresetMapping` が `target` を見ない | 022 |
| `checkPresetMapping` が `runtime` のエントリを要求しない | 023 |
| `checkLogRecord` が入れ子を走査しない | 026 |
| `lintMigration` がコメントの中も検出する | 027 |
| `lintMigration` が理由なしの許可の印でも抑える | 027 |
| `proof` の欠落で `runtime_unbound` を避けられる | 030 |
| `scope` の未知の値と空の写像の配列を通す | 031 |
| 許可の印が前の SQL を抑える | 032 |
| `nfrItem` の形の検査が緩い・厳しい | 033、034 |
| `tier: null` が理由なしで通る | 036 |
| `tier: null` の `enforce` が通る | 037 |
| `resolveControlSeverity` の `ratchet` が baseline 外を `advisory` にする | 028 |
| `requiresPoApproval` が `org-account-control` を欠く | 029 |

## 6. 受け入れの実測 (oracle ではない)

- 実装 PR の前に、設計 §8 の例のツール・rule ID が提供元の一次情報に実在するかを確かめる。契約 PR では確かめていない (例は机上であり、全て `pending-primary`)。確かめた結果を、ツール record の `checkedAt` と `sourceUrl` に記録する。
- 設計 §14 の初期記録は、一次情報で確かめ直す (二次記事の出典が 1 件ある)。確かめるまで、状態の欄を確認済みの事実として使わない。
- OpenTelemetry セマンティック規約の版は、preset を入れる時点で一次情報から確かめて固定する (`PROFILE_OK` の `1.0.0` は fixture の仮の値)。

## 7. 注記

- 本書は `src/` も `scripts/` も変えない契約の PR の一部である。`function-spec.md`、`L7-unit-test-design.md`、`tests/gate-static.test.ts` は変えない。
- 実行時の証跡 (検証 (e)) は #797 のデプロイ receipt と #798 の G13 に束縛する。本書の oracle の対象にしない。
- 画面の検査は #1717、エージェントのクラウド権限は #1732 の範囲である。
