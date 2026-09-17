# Issue #541: PLAN-L6-93 rev27→28 再水和 CLI 実測

- 実装基準: `c8e0ce7cb26d0301b98c3ae191be7a77426d7080` (PR-2 implementation)
- 実データ source/projection checkout: `d3c0df76e7cdba6dd0dbe51103028428ef9db37f`
- source: `docs/plans/PLAN-L6-93-node-bootstrap-contract.md` の embedded receipt が指す rev27
- projection: 同 checkout の `docs/governance/plan-admission-receipts.json` sequence 67
- asset: `plan:legacy:80a50dd958ae451ea13030276eb8c145a8fdc3104ec145560457f97a07594881`

## 正規経路

一時 checkout の tracked source / projection から manifest を導出し、次の実 CLI を実行した。
manifest の receipt、source digest、projection tail は Git object / tracked record から導出し、
手書き receipt や primary `.ut-tdd/harness.db` への操作は行っていない。

```text
node C:\dev\ut-541-actual-seal\src\cli.ts plan revise --manifest C:\dev\ut-541-cli-execution\issue541-revise-manifest.json
```

CLI output:

```json
{"ok":true,"result":{"status":"created","receipt":{"assetId":"plan:legacy:80a50dd958ae451ea13030276eb8c145a8fdc3104ec145560457f97a07594881","revision":28,"certificateId":"certificate:1935b8b0c1b8c9f95e6f208a58345512","commandPayloadDigest":"22758c6e9bf18bc2d6df43a683e70b6d01518755accaf2bd884e94e485fe9672","certificateDigest":"3e361c3c18cfcdb31ef980cbb74b2d24a18437d33a17039dd53c772329cdfa11"}}}
```

## postimage oracle

- projection tail: sequence `69`, `previous_record_digest = sha256:10f7e322f869109dfbf8ed2565fba8062528cec2441cd1897c302e8f82ae8523`, `record_digest = sha256:6503bd0e154425920b26acdd7ea568ebb4bb8a2f96f6ec21add2eb1052cbbe7d`
- tail binding: same `plan_id`, asset, path, and revision `28`
- isolated ledger rows: `plan_revisions = [27, 28]`
- `legacy_plan_bootstrap_provenance` rows: `0`
- `sealed_plan_lineages` rows: `0`

判定: embedded receipt と tracked projection record が実在するため、決定的 rehydration→N+1
が成立した。したがって seal / successor genesis は fallback 条件に該当せず、実行していない。
