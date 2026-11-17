# 統制 record の置き場 (ops-controls)

consumer 向け本番運用の統制 record を置く場所。形は `docs/design/harness/L6-function-design/consumer-operations-controls.md` §3 が正本で、ここへ写さない。1 領域 1 ファイル (`<domain>.json`)、中身は record の配列である。置き場の判断と理由は同書 §15 に記録する。

## 現在の record

| ファイル | 領域 | 統制 id |
|---|---|---|
| `log-observability.json` | ログ・観測 (#1726) | `OPS-LOG-001`〜`004` |
| `security.json` | セキュリティ (#1731) | `OPS-SEC-001`〜`006` |

## nfrItem の扱い

`nfrItem` は `docs/design/harness/L3-functional/nfr-grade.md` の識別子を指す。セキュリティは `NFR-17` (統合セキュリティ)、ログの PII は `NFR-18` (§7.3 の新規候補) を使う。ログの配信・相関 ID・形式に合う項目は nfr-grade に無いため、`NFR-UNMAPPED` を入れた。これは識別子ではなく「該当なし」の印で、nfr-grade に項目が足された時点で置き換える。

## stage

全 record は `advisory` から始める。例外は `OPS-LOG-002` で、契約 §8.1 の例のとおり `baseline` である。`OPS-SEC-001` (secret の検出) は最初の baseline の後に `enforce` を検討する候補だが、`enforce` への昇格は承認の記録 (契約 §7) を伴う別の変更で行い、ここでは設定しない。

## preset の対応 (机上の例)

ツール名と rule ID は机上の例で、採否でも検証済みの事実でもない。全て `verification: pending-primary` として扱う (契約 §4、§8)。A は AWS + CDK、B は VPS + docker compose + pino + Fluent Bit。`OPS-LOG-001`・`OPS-LOG-002`・`OPS-SEC-001` の対応は契約 §8.2 / §8.3 が正本である。

| 統制 | preset A (tool: ruleId、scope) | preset B (tool: ruleId、scope) |
|---|---|---|
| `OPS-LOG-003` | test-runner: `logger-output.correlation-id` (ci) | test-runner: `logger-output.correlation-id` (ci) |
| `OPS-LOG-004` | test-runner: `logger-output.structured-format` (ci) | test-runner: `logger-output.structured-format` (ci)。pino の出力設定を検査 |
| `OPS-SEC-002` | dependency-scanner: `vuln.severity-threshold` (ci) | dependency-scanner: `vuln.severity-threshold` (ci) |
| `OPS-SEC-003` | sast: `sast.severity-threshold` (ci) | sast: `sast.severity-threshold` (ci) |
| `OPS-SEC-004` | iac-lint: `iac.severity-threshold` (ci) | compose-lint: `compose.misconfig` (ci) |
| `OPS-SEC-005` | cloud-config-evaluator: `cloud-config.critical-zero` (runtime) | host-baseline-check: `host-config.critical-zero` (runtime)。VPS の設定の評価 |
| `OPS-SEC-006` | secret-store-check: `secret-store.rotation-observed` (runtime) | secret-store-check: `secret-store.rotation-observed` (runtime)。VPS の secret の置き場は consumer が決める |

- 2 本で統制の列は同一で、違うのは `tools` と `controlMap` だけである (契約 §8.4)。
- `OPS-SEC-005` と `OPS-SEC-006` は `proof: runtime` なので、どちらの preset も `runtime` の entry を持つ (契約 §5.2 の 6)。
- 配布は未配線である。`scripts/build-node.mjs` が束ねるのは `docs/templates/vmodel/*.md` だけなので、本ディレクトリの JSON は後続の実装 PR が配布経路へ足す。
