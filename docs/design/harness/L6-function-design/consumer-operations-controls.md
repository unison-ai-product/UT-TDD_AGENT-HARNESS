---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_consumer_operations_controls
pair_artifact: docs/test-design/harness/L7-consumer-operations-controls-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-11-17
issue: 1725
---

> **L6 contract marker**: 本書は consumer (UT-TDD を導入した製品) が本番を運用するときの**統制 (control) の契約**である (未実装の目標契約)。契約は stack に依存しない。統制 record の schema (§3)、ツール record (§4)、preset の対応表 (§5)、検証の順序と場所 (§6)、PO 承認の置き場 (§7)、机上で埋めた例 (§8) を定める。判定は純関数 (`validateControlRecord` / `checkControlSet` / `validateToolEntry` / `isToolAdoptable` / `isToolDistributable` / `checkToolStaleness` / `checkPresetMapping` / `checkLogRecord` / `checkLogProfile` / `lintMigration` / `resolveControlSeverity` / `requiresPoApproval`) が持つ。型と DbC は §10 にまとめる。oracle は `docs/test-design/harness/L7-consumer-operations-controls-test-design.md` の候補 ID `CANDIDATE-U-OPSCTL-001`〜`029` が固定する。実装の置き場 (`src/ops-controls/` 以下) は仮置きで、配布の設計で確定する。

# consumer 向け本番運用の統制 — 関数設計 (issue #1725、親 #1724)

## 1. 目的と範囲

consumer の製品は、本番に出すときの運用の約束 (ログ、IaC、運用、テスト証跡、DB、セキュリティ、コード品質、API とリリース、データ基盤、ドキュメントと ADR、プロダクト分析) を、場当たりに決めている。目的は、**満たすべき結果 (outcome) を小さな宣言的 record で固定し、ツールは差し替え可能な対応表に分ける**ことである。

範囲は次のとおり。

- 対象は **consumer の製品の本番運用**。サーバ側を主とし、スマホ・Windows のクライアントのテレメトリとクラッシュ報告は別の preset 系統にする (§5.4)。
- ハーネスが決めるのは次の 4 つだけである。(1) 統制 record の schema (§3)、(2) ツール record の schema (§4)、(3) preset の対応表の形 (§5)、(4) 検証の順序と場所 (§6)。

範囲外:

- **画面の検査** (axe、Lighthouse、ビジュアル回帰) は #1717 の検証の順序に属する。本書では扱わない。
- **エージェントのクラウド権限**は #1732 が持つ。
- **環境 record・デプロイ receipt・G13 との束縛**は #797 / #798 が正本である。本書は参照するだけで、schema を複製しない。
- **インフラ部品の stack 非依存カタログ**は作らない。Terraform や CDK を作り直すことになるためである。統制は結果だけを書く。
- ツールの**具体的な採否**。採否は consumer の判断と PO の承認 (§7) で決まる。本書の候補は採用の承認ではない。

## 2. 既存の正本との関係

| 正本 | 本書との関係 |
|---|---|
| `docs/design/harness/L3-functional/nfr-grade.md` (#767) | IPA 非機能要求グレードの段 (Lv) の値の置き場。統制は `tier` でその項目 ID と下限の段を**参照する**。IPA の文面は写さない |
| `docs/templates/vmodel/L13-production-observation.md` / `L14-operational-test-design.md` / `L4-security.md` | 統制 record が `layers` で指す層の文書。章の内容は複製せず、record の `outcome` から指す |
| #797 (環境 record・デプロイ receipt) | 実行時の証跡 (`proof: runtime`) の束縛先。本書は「receipt に束縛すること」だけを定める |
| #798 (G13 のスモークと SLO の観測) | 実行時の証跡が G13 を通る経路。本書は経路を足さない |
| #871 (検証済みライブラリの登録簿) | ツール record (§4) の審査欄 (ライセンス・保守状況・出典) の形をそろえる。#871 が確定したら、その schema を正本として本書を改訂する |
| `docs/design/harness/L6-function-design/consumer-design-system.md` (#1717) | 同じ型 (stack 非依存の契約 + preset + 機械の検証、consumer 側で検証、advisory から fail-close へ) を使う。段 `baseline` / `advisory` / `ratchet` / `enforce` の名前と意味は同じ |

## 3. 統制 record の schema

統制は JSON Schema で検証できる小さな宣言的データである。Rego や独自の重い schema は使わない。

**3.1 record**

| field | 型 | 内容 |
|---|---|---|
| `id` | string | `OPS-<領域の短縮>-<3 桁>`。例: `OPS-SEC-001`。パターンは `^OPS-[A-Z]{2,5}-[0-9]{3}$` |
| `domain` | enum | 領域。§3.2 の 11 値 |
| `outcome` | string | 満たすべき結果を 1 文で書く (空白だけは不備)。手段 (ツール名) は書かない |
| `tier` | object | `{ nfrItem: string, minLevel: 0〜5 の整数 }`。`nfrItem` は `nfr-grade.md` が使う IPA 項目の識別子 (空でない文字列)、`minLevel` はその統制を課す下限の段 |
| `layers` | array | V-model の層。`L4`〜`L14` の文字列。1 つ以上、重複なし |
| `appliesTo` | array | `server` / `client` の 1 つ以上。preset の `target` (§5.4) と突き合わせる |
| `proof` | enum | `static` (静的な検査) / `runtime` (実行時の観測) |
| `evidence` | object | 求める証跡の形。§3.3 |
| `stage` | enum | `baseline` / `advisory` / `ratchet` / `enforce` |

**3.2 領域 (`domain`)**

`log-observability`、`infra-iac`、`operations`、`test-evidence`、`database`、`security`、`code-quality`、`api-release`、`data-platform`、`docs-adr`、`product-analytics` の 11 値。

**3.3 証跡の形 (`evidence`)**

```json
{ "format": "json-result", "schemaRef": "<証跡の JSON Schema の参照>", "bindsTo": ["head"] }
```

- `format`: `json-result` / `sarif` / `junit-xml`。機械が読める形だけを認める。自由文の「確認した」は証跡にならない。
- `schemaRef`: 空でない文字列。
- `bindsTo`: 空でない配列で、`head` (exact HEAD) と `deploy-receipt` (#797 のデプロイ receipt) の 1 つ以上。
- **`proof` が `runtime` の統制は、`bindsTo` に `deploy-receipt` を含める**。含まない record は不備である。静的な検査の結果は実行時の証明にならない。実行時の観測は #797 / #798 の receipt に束縛されて初めて証跡になる。

## 4. ツール record

ツールは契約に固定しない。ツールごとに次を持つ。

| field | 型 | 内容 |
|---|---|---|
| `id` | string | preset 内で一意なツールの識別子 |
| `checkedAt` | string | 確認した日。`YYYY-MM-DD`。実在しない日付は不備 |
| `lifecycle` | enum | `available` / `new-signups-stopped` / `end-of-support-scheduled` / `license-changed` |
| `verification` | enum | `confirmed` (一次情報で確認済み) / `pending-primary` (要一次情報確認) |
| `sourceUrl` | string or null | 一次情報の URL。`https://` で始まる。`pending-primary` のときだけ `null` でよい |
| `license` | object | `{ distribution: "reference-only" \| "vendored", approval: "none" \| "approved", recordRef?: string }` |

1. **採用してよい条件** (`isToolAdoptable`): `verification` が `confirmed`、`lifecycle` が `available`、`license.approval` が `approved` かつ `recordRef` が空でない、の全部を満たすときだけ。1 つでも欠ければ採用しない。
2. **配布の条件** (`isToolDistributable`): `reference-only` なら真。`vendored` は `approval` が `approved` かつ `recordRef` が空でないときだけ真。他の field は見ない。
3. **鮮度** (`checkToolStaleness`): `checkedAt` から基準日までが `maxAgeDays` を超えたら `tool.stale`。`maxAgeDays` は呼び出し側の引数であり、本書では値を決めない (§12)。
4. 出典の一次性は機械では判定できない。`verification: confirmed` は、確認した人が一次情報 (提供元の公式文書・リリース通知・ライセンス文) を読んだ記録である。二次記事は一次情報として扱わない。

## 5. preset の対応表

preset は、統制を**ツールの rule ID に写像した record** である。

**5.1 形**

```json
{
  "id": "<preset の識別子>",
  "target": "server",
  "tools": [ { "...": "§4 のツール record" } ],
  "controlMap": {
    "OPS-SEC-001": [ { "tool": "<tool.id>", "ruleId": "<ツールの rule ID または consumer のテスト ID>", "scope": "ci" } ],
    "OPS-XXX-999": { "na": "<適用しない理由>" }
  },
  "logProfile": { "...": "§9.1" }
}
```

- `scope`: `ci` (CI で走る) / `runtime` (本番・ステージングで観測する) / `manual-review` (人の確認)。
- 1 つの統制に複数のエントリを書いてよい。

**5.2 満たすこと**

1. 対象の統制 (その preset の `target` が `appliesTo` に含まれるもの) の全てが、`controlMap` に写像か `{ na }` で現れる。落とした統制は不備 (`preset.control_unmapped`)。
2. `controlMap` に統制の集合に無い id があれば不備 (`preset.control_unknown`)。
3. 各エントリは `tool` と `ruleId` が空でなく、`tool` が `tools` の中にある。`{ na }` の理由は空白だけでない。
4. **採用してよくないツール** (§4 の 1) を指すエントリは `preset.tool_not_adoptable` の finding にする。候補を表に載せることはできるが、採用済みの顔はさせない。
5. `proof: runtime` の統制は、少なくとも 1 つのエントリの `scope` が `runtime` でなければならない (`preset.runtime_scope_missing`)。

**5.3 候補を載せる位置**

候補は `tools` に `verification: pending-primary` で載せる。採否の判断は §7 に記録する。

**5.4 クライアントの系統**

スマホ・Windows のクライアントのテレメトリとクラッシュ報告は、サーバ向けの preset と別の preset (`target: client`) で扱う。サーバ向けの preset が `appliesTo` に `client` だけを持つ統制を要求されることはない。逆も同じ。クライアント向けの統制 record と preset の中身は後続 Issue の範囲で、本書は `target` の分け方だけを定める。

**5.5 構造の違う 2 本で通す**

契約は 2 本の preset で机上検証する。(1) 第一候補の **AWS + CDK**、(2) 構造の違う **VPS + docker compose + pino + Fluent Bit**。harness と同じ言語であることは consumer の利益ではなく、第一候補は consumer の都合で決まる。両方に同じ統制を写せなければ、契約が片方の構造に寄っている。

## 6. 検証の順序と場所

**検証は consumer 側で走る。harness 側が確かめるのは、統制 record の schema とツール record の schema、preset の対応表の整合 (§5.2) だけである。** ツールの実行 (secret の検出、IaC の検査、実機の観測) は harness の doctor に置かない。

安くて決定論的なものから入れる。

| 順 | 検証 | 内容 | 実行時の環境 |
|---|---|---|---|
| (a) | secret の検出 | commit される内容に secret が無いこと。ツールの出力を `json-result` か `sarif` で受ける | 不要 |
| (b) | logger 出力の単体テスト | `checkLogRecord` (§9) を consumer のロガーの実出力に当てる | 不要 |
| (c) | migration の lint | `lintMigration` (§9.3) と、consumer が選んだ migration のツールの lint | 不要 |
| (d) | IaC の静的検査 | consumer が選んだ IaC のツールが、その preset の rule ID で検査する | 不要 |
| (e) | 実行時の観測 | ステージング・本番の観測。デプロイ receipt (#797) に束縛して G13 (#798) へ渡す | 要る |

(a)〜(d) は静的な検査であり、**実行時の証明ではない**。(e) だけが実行時の証跡になる。(e) は純関数にならないので、本書の oracle の対象にしない。

**6.1 導入の順序**

全てを **advisory** で入れ、baseline を測ってから fail-close にする。段は #1717 と同じ。

| 段 | 名前 | finding の扱い |
|---|---|---|
| A0 | `baseline` | 全て advisory。件数を測って baseline の file に記録する |
| A1 | `advisory` | 全て advisory。consumer の CI に出す |
| A2 | `ratchet` | baseline に無い (新しい) finding は error、baseline に在る finding は advisory |
| A3 | `enforce` | 全て error (fail-close) |

- 統制 record の `stage` が、その統制の今の段である。段を進める判断は control が、baseline の件数と誤検出の記録を見て行う (閾値は本書で決めない)。
- **secret の検出は、最初から `enforce` にしてよい候補**である。誤検出の対処 (allowlist の記録) が先に要るため、`enforce` にするかどうかは、その consumer の最初の baseline 測定の後に決める。決めるまでは advisory で入れる。
- `resolveControlSeverity({ stage, inBaseline })` が上の表を返す。

## 7. PO 承認の置き場

| 判断 | 置き場 |
|---|---|
| ツールの採否 (ライセンスを含む) | 本書の判断節 (§7.1 の表) と、ツール record の `license.recordRef`。PO の承認を記録してから採用する |
| consumer ごとのクラウド・リージョン・IaC の選択 | **consumer の ADR** (#793 の範囲)。ハーネスの契約には書かない |
| Control Tower / Landing Zone Accelerator / Account Factory for Terraform | 組織アカウント級であり、consumer ごとの ADR でも PO 承認を要する。契約では候補として対応表に載せられるが、導入するかは別の判断 |

**7.1 高影響境界**

次は、advisor の相談や既存の契約では代替できず、**PO の承認を、変更の前に記録する**。候補を一覧に載せることは承認ではない。`requiresPoApproval(kind)` は、次の `kind` で真を返す。

| `kind` | 内容 |
|---|---|
| `consumer-infra-apply` | consumer の実インフラへの変更 (apply・deploy) |
| `cloud-region-iac-choice` | クラウド・リージョン・IaC の選択 |
| `org-account-control` | Control Tower / Landing Zone Accelerator / Account Factory for Terraform など、組織アカウント級の仕組み |
| `pack-third-party-distribution` | 第三者のツール・コードを Pack で配ること |
| `paid-external-api` | 有料または外部の API の前提 |

上の 5 つ以外の `kind` (例: `docs-edit`、`preset-record-update`) は、本書の範囲では PO 承認を要しない。

## 8. 机上で埋めた例

2 本の preset (A = AWS + CDK、B = VPS + docker compose + pino + Fluent Bit) に、4 つの統制を写した。**ツールの名前と rule ID は机上の例であり、採否でも検証済みの事実でもない**。例のツールは全て `verification: pending-primary`、`license.approval: none` である (§4 の 1 により、どれも採用してよい状態ではない)。

**8.1 統制 (例)**

| id | domain | outcome | tier | layers | appliesTo | proof | evidence | stage |
|---|---|---|---|---|---|---|---|---|
| `OPS-SEC-001` | security | secret が commit されない | `nfrItem` は nfr-grade の §5 の項目、`minLevel` 3 | L4, L7 | server, client | static | `sarif`、`head` | advisory (最初の baseline の後に `enforce` を検討) |
| `OPS-DB-001` | database | migration がデータを黙って消さない | `nfrItem` は nfr-grade の §3 の項目、`minLevel` 3 | L5, L7 | server | static | `json-result`、`head` | advisory |
| `OPS-LOG-001` | log-observability | ログが必須の field を持ち、PII がマスクされる | `nfrItem` は nfr-grade の §3 の項目、`minLevel` 2 | L4, L7 | server | static | `junit-xml`、`head` | advisory |
| `OPS-LOG-002` | log-observability | 本番のログが保管先に届き、保持期間が設定されている | `nfrItem` は nfr-grade の §3 の項目、`minLevel` 2 | L13, L14 | server | runtime | `json-result`、`head` と `deploy-receipt` | baseline |

`nfrItem` の具体の値は、実装の PR が `nfr-grade.md` の識別子で埋める (本書は IPA の文面も識別子も複製しない)。

**8.2 preset A: AWS + CDK**

| 統制 | tool | ruleId | scope |
|---|---|---|---|
| `OPS-SEC-001` | `secret-scanner` (例: gitleaks) | `aws-access-token` | ci |
| `OPS-SEC-001` | `iac-lint` (例: cdk-nag) | `AwsSolutions-SMG4` (Secrets Manager の secret のローテーション) | ci |
| `OPS-DB-001` | `migration-lint` (例: squawk) | `ban-drop-column`、`ban-drop-table` | ci |
| `OPS-LOG-001` | `test-runner` | `logger-output.required-fields` と `logger-output.pii-masked` (consumer のテスト ID) | ci |
| `OPS-LOG-002` | `iac-assert` (CDK の assertions) | `log-group.retention-set` (consumer のテスト ID。`RetentionInDays` が設定されていること) | ci |
| `OPS-LOG-002` | `observer` (例: CloudWatch Logs) | `log-delivery.observed` | runtime |

**8.3 preset B: VPS + docker compose + pino + Fluent Bit**

| 統制 | tool | ruleId | scope |
|---|---|---|---|
| `OPS-SEC-001` | `secret-scanner` (例: gitleaks) | `generic-api-key` | ci |
| `OPS-SEC-001` | `compose-lint` (例: 設定ファイルの grep 規則) | `compose.no-inline-secret` (consumer の規則 ID) | ci |
| `OPS-DB-001` | `migration-lint` (例: squawk) | `ban-drop-column`、`ban-drop-table` | ci |
| `OPS-LOG-001` | `logger` (pino の `redact` 設定) と `test-runner` | `logger-output.required-fields`、`logger-output.pii-masked` | ci |
| `OPS-LOG-002` | `shipper-config-check` (例: Fluent Bit の設定の dry-run) | `fluent-bit.config-valid` | ci |
| `OPS-LOG-002` | `observer` (例: 保管先への到着の確認) | `log-delivery.observed` | runtime |

**8.4 2 本を並べて分かること**

- 統制の列 (outcome・tier・layers・proof・evidence) は 2 本で同一である。違うのは `tools` と `controlMap` の中身だけである。契約がどちらかのクラウドの語彙に寄っていない。
- A は IaC の検査と合成テストで静的な検査が厚い。B は設定ファイルとロガーの設定が検査の対象になる。いずれも `OPS-LOG-002` の `runtime` のエントリを必ず持ち、証跡はデプロイ receipt に束縛される (§3.3)。VPS でも receipt の形は #797 が定めるものを使う。
- B は IaC のツールを持たないので `infra-iac` の統制を写すときは `{ na }` か、compose の検査で結果を満たす記録が要る。これは 2 本目を通して初めて見えた差であり、契約は `{ na }` の理由を機械で必須にして落とさせない (§5.2 の 3)。

## 9. ログ・migration の純関数の規則

**9.1 ログの profile**

ログの field 名は、OpenTelemetry のセマンティック規約を参照する。**規約の版は profile に固定する** (`semconvVersion`、`^[0-9]+\.[0-9]+\.[0-9]+$`)。規約の文面は複製しない。版の具体値は、preset を入れる時点で一次情報から確認して記録する (要一次情報確認)。

```ts
interface LogProfile {
  semconvVersion: string;
  fieldMap: Record<"timestamp" | "severity" | "body" | "service.name", string>; // 論理名 → 実際のキー (トップレベルのキー、文字列としてそのまま照合)
  piiKeys: readonly string[];   // 大文字小文字を区別せず照合するキー名
  mask: string;                 // マスク済みを表す値 (空でない)
}
```

- 必須の論理名は `timestamp`、`severity`、`body`、`service.name` の 4 つ。`fieldMap` が全てを持ち、値が空でないこと。
- `severity` の値は `trace` / `debug` / `info` / `warn` / `error` / `fatal` のいずれか。

**9.2 `checkLogRecord(record, profile)`**

1 件のログ (JSON のオブジェクト) を検査する。

- `log.field_missing`: `fieldMap` が指すキーが `record` のトップレベルに無い、または値が空文字・`null`。subject は論理名。必須の論理名の順 (`timestamp`、`severity`、`body`、`service.name`)。
- `log.severity_invalid`: `severity` のキーが在り、値が上の 6 つのどれでもない。subject は `severity`。
- `log.pii_unmasked`: `record` を深さに関わらず走査し、キー名 (大文字小文字を区別しない) が `piiKeys` に含まれ、値が `mask` と等しくないもの。subject は `a.b.c` の形のドット区切りの path。走査はキーの出現順。配列の中のオブジェクトは `a[0].b` の形。

**9.3 `lintMigration(file)`**

SQL の migration (`file.text`) を検査する。行・桁は 1 始まり。

| rule | 検出するもの |
|---|---|
| `migration.destructive` | `DROP TABLE`、`DROP COLUMN`、`TRUNCATE` (大文字小文字を区別しない) |
| `migration.delete_without_where` | `DELETE FROM` の文のうち、次の `;` までに `WHERE` が無いもの |
| `migration.allow_reason_missing` | 許可の印 `-- ut-tdd:allow-destructive:` の後の理由が空白だけ |

- コメント (`-- ...` の行末まで、`/* ... */`) の**中身は検出の対象にしない**。ただし許可の印は例外で、印として読む。
- 許可の印は、**同じ行か、直前の空白でない行**の `migration.destructive` と `migration.delete_without_where` を抑える。ただし理由が空白だけの印は抑えず、`migration.allow_reason_missing` を足す。
- 限界: 動的 SQL・ORM が生成する migration・文字列の中の SQL は検出しない。consumer が選んだ migration のツールの lint を重ねる。

## 10. 型と DbC

```ts
export type Domain =
  | "log-observability" | "infra-iac" | "operations" | "test-evidence" | "database"
  | "security" | "code-quality" | "api-release" | "data-platform" | "docs-adr" | "product-analytics";
export type Stage = "baseline" | "advisory" | "ratchet" | "enforce";
export type Layer = "L4" | "L5" | "L6" | "L7" | "L8" | "L9" | "L10" | "L11" | "L12" | "L13" | "L14";
export type Lifecycle = "available" | "new-signups-stopped" | "end-of-support-scheduled" | "license-changed";
export interface Finding { rule: string; subject: string; message: string }
export interface ControlRecord {
  id: string; domain: Domain; outcome: string;
  tier: { nfrItem: string; minLevel: number };
  layers: Layer[]; appliesTo: ("server" | "client")[];
  proof: "static" | "runtime";
  evidence: { format: "json-result" | "sarif" | "junit-xml"; schemaRef: string; bindsTo: ("head" | "deploy-receipt")[] };
  stage: Stage;
}
export interface ToolEntry {
  id: string; checkedAt: string; lifecycle: Lifecycle; verification: "confirmed" | "pending-primary";
  sourceUrl: string | null;
  license: { distribution: "reference-only" | "vendored"; approval: "none" | "approved"; recordRef?: string };
}
export interface Preset {
  id: string; target: "server" | "client"; tools: ToolEntry[];
  controlMap: Record<string, { tool: string; ruleId: string; scope: "ci" | "runtime" | "manual-review" }[] | { na: string }>;
  logProfile?: LogProfile;
}
export function validateControlRecord(record: unknown): Finding[];
export function checkControlSet(records: readonly ControlRecord[]): Finding[];
export function validateToolEntry(tool: ToolEntry, today: string): Finding[];
export function isToolAdoptable(tool: ToolEntry): boolean;
export function isToolDistributable(tool: ToolEntry): boolean;
export function checkToolStaleness(tool: ToolEntry, today: string, maxAgeDays: number): Finding[];
export function checkPresetMapping(controls: readonly ControlRecord[], preset: Preset): Finding[];
export function checkLogProfile(profile: LogProfile): Finding[];
export function checkLogRecord(record: Record<string, unknown>, profile: LogProfile): Finding[];
export function lintMigration(file: { path: string; text: string }): { rule: string; line: number; column: number }[];
export function resolveControlSeverity(input: { stage: Stage; inBaseline: boolean }): "advisory" | "error";
export function requiresPoApproval(kind: string): boolean;
```

| 不変条件 | 内容 |
|---|---|
| I1 | 全ての関数は純粋である (file・環境変数・時刻・network を自分では読まず、引数だけから決まる。`today` も引数)。戻りの配列は入力の順 |
| I2 | `validateControlRecord` の rule: `control.id_invalid`、`control.domain_unknown`、`control.outcome_blank`、`control.tier_invalid` (`nfrItem` が空白、または `minLevel` が 0〜5 の整数でない。subject は `tier`)、`control.layers_empty`、`control.layer_invalid` (subject は層の値)、`control.layer_duplicate`、`control.applies_to_invalid`、`control.stage_invalid`、`control.evidence_invalid` (`format` が未知か `schemaRef` が空白か `bindsTo` が空、subject は `evidence`)、`control.runtime_unbound` (`proof` が `runtime` で `bindsTo` に `deploy-receipt` が無い、subject は `evidence.bindsTo`)。subject は他は field 名。入力が object でなければ `control.not_object` を 1 件返し、例外を投げない |
| I3 | `checkControlSet` は `control.duplicate_id` (subject は id、2 件目以降の出現ごと) だけを返す |
| I4 | `validateToolEntry` の rule: `tool.checked_at_invalid` (形式違反か実在しない日付、または `today` より後)、`tool.lifecycle_unknown`、`tool.verification_unknown`、`tool.source_missing` (`confirmed` で `sourceUrl` が `null`)、`tool.source_not_https` (`sourceUrl` が `https://` で始まらない。`null` は対象外)、`tool.license_unrecorded` (`approval` が `approved` で `recordRef` が空白)。`pending-primary` は finding にしない (採用の可否は `isToolAdoptable` が決める) |
| I5 | `isToolAdoptable` は §4 の 1 の 3 条件だけで決める。`isToolDistributable` は §4 の 2 だけで決め、他の field を見ない |
| I6 | `checkToolStaleness` は、`today` と `checkedAt` の日数差が `maxAgeDays` を**超える**とき (等しいときは通す) `tool.stale` を返す。`checkedAt` を解釈できなければ `tool.checked_at_invalid` を返す |
| I7 | `checkPresetMapping` の rule: `preset.control_unmapped`、`preset.control_unknown`、`preset.rule_id_missing`、`preset.tool_unknown`、`preset.na_reason_missing`、`preset.tool_not_adoptable`、`preset.runtime_scope_missing`。subject は統制の id (`preset.tool_unknown` と `preset.rule_id_missing` と `preset.tool_not_adoptable` は `<統制 id>:<tool>`)。対象の統制は `appliesTo` に `preset.target` を含むものだけ。出力は統制の入力の順、その後に `control_unknown` が `controlMap` のキーの順 |
| I8 | `checkLogProfile` の rule: `logprofile.semconv_version_unpinned`、`logprofile.field_map_incomplete` (subject は論理名)、`logprofile.mask_blank` |
| I9 | `checkLogRecord` は §9.2 の規則どおり。`record` を変更しない |
| I10 | `lintMigration` は §9.3 の規則どおり、`line` と `column` の昇順 (同じ位置は rule 名の辞書順) |
| I11 | `resolveControlSeverity` は、`enforce` なら `error`、`ratchet` で `inBaseline` が偽なら `error`、それ以外は `advisory` |
| I12 | `requiresPoApproval` は §7.1 の 5 つの `kind` で真、それ以外 (空文字を含む) で偽 |
| I13 | 検証 (a)〜(e) のツールの実行は consumer 側で走り、harness の doctor には置かない。doctor の既存 gate の oracle を変えない |

## 11. 受け入れ条件

- [ ] 契約 (本書とテスト設計の対) が merge され、`vmodel-pair` と `l6-completion` が通る。
- [ ] §8 の例 (2 本の preset × 統制 4 件) が、`checkPresetMapping` と同じ規則で矛盾なく写せる (テスト設計 `CANDIDATE-U-OPSCTL-029`)。
- [ ] 統制 record と preset の対応表が、consumer の fixture で advisory として動く (実装は後続)。
- [ ] ツールの採否は、PO の承認を記録したものだけが `isToolAdoptable` で真になる。

## 12. 実装の順序と後続

1. **本書の PR (契約)**: 本書とテスト設計の対だけ。src は含まない。
2. **Red**: 候補 oracle を `it.fails` で `tests/consumer-operations-controls.test.ts` に入れる (テスト設計 §1 の三段階)。
3. **Green**: 純関数を実装する。置き場は仮に `src/ops-controls/` とし、配布の設計で確定する。
4. **後続**: 統制 record の実体 (11 領域)、preset の record、配布 (`src/setup/` と Pack)、consumer での advisory の実行。実行時の証跡は #797 / #798 の後に束縛する。

## 13. 未決の点

| 点 | 扱い |
|---|---|
| OpenTelemetry セマンティック規約の版の値 | preset を入れる時点で一次情報から確認して固定する |
| `maxAgeDays` の値 | 本書では決めない。確認の運用を見て control が決める |
| 段 A0〜A3 を進める件数の閾値 | baseline を測ってから control が決める |
| #871 の登録簿 schema との統合 | #871 が確定したら、ツール record の審査欄を正本に合わせて改訂する |
| クライアント (スマホ・Windows) の統制と preset の中身 | 後続 Issue。本書は `target` の分け方だけ |
| 11 領域のうち §8 以外の統制の record | 後続 Issue |

## 14. ツールの状態の初期記録 (PO のまとめの 13 章)

PO のまとめ (2026-11-17) の「終了・変更に注意が必要なもの」を、状態の欄の最初の記録として置く。**全て `verification: pending-primary` (要一次情報確認) であり、確認済みの事実として扱わない**。出典の URL は、preset に入れる時点で一次情報か確かめ直す (二次記事の出典が 1 件ある)。

| ツール (まとめの記載) | `lifecycle` の候補 | `verification` | `sourceUrl` |
|---|---|---|---|
| Incident Manager | `new-signups-stopped` | pending-primary (要一次情報確認) | null |
| Opsgenie | `end-of-support-scheduled` | pending-primary (要一次情報確認) | null |
| LocalStack | `license-changed` | pending-primary (要一次情報確認) | null |
| RDS Performance Insights | `end-of-support-scheduled` | pending-primary (要一次情報確認) | null |
| Liquibase (FSL) | `license-changed` | pending-primary (要一次情報確認) | null |
| Security Hub (CSPM への改称) | `available` (名称変更。機能の状態は要確認) | pending-primary (要一次情報確認) | null |

この表は検証の対象にしない (§10 の `ToolEntry` の形を満たすことだけが、実装の後続で確かめられる)。

## 15. 判断節 (PO 承認の記録)

| 判断 | 結論 | 状態 |
|---|---|---|
| 統制の記述形式 | JSON Schema で検証できる小さな宣言的 record (Rego・独自の重い schema は使わない) | 本書で採択 (control が advisor の相談の後に決定) |
| インフラ部品の stack 非依存カタログ | 作らない (Terraform を作り直すことになる) | 本書で採択 |
| 第一候補の preset | AWS + CDK。構造の違う VPS + compose + pino + Fluent Bit を同時に机上で通す | 本書で採択。クラウド・IaC の選択自体は consumer の ADR |
| Control Tower / LZA / AFT | 候補として対応表に載せるが、consumer への導入は PO 承認 | 未承認 (候補) |
| ツールごとの採否・ライセンス | 個別に PO の承認を記録してから採用する | 未承認。本書の例は全て未承認 |
