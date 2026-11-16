---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_cli_version_identity
pair_artifact: docs/test-design/harness/L7-release-version-identity-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 867
---

# CLI version 表示と release identity 契約 — 関数設計 (Issue #867)

L6 contract marker: CLI の `--version` 表示と update-check の local version を、実行形態ごとの識別元から解決する。
DbC pre は無し (**never throws**)、post は表示が「識別済みの version」か明示的な `unidentified` のどちらかであり、
識別できないことを `0.0.0` で隠さないこと、oracle は `CANDIDATE-U-RELVER-010..017`
(`docs/test-design/harness/L7-release-version-identity-test-design.md` §5) とする。

## 現状 (origin/main 262746842 の実測)

- `--version` は `readHarnessVersion(defaultHarnessRoot())` (`src/cli.ts:629`)。`defaultHarnessRoot()` は
  `import.meta.url` の 2 階層上を harness root とみなし (`src/setup/update-check.ts:362-368`)、
  `readHarnessVersion()` はその `package.json` の `version` を読み、root 不在・読取失敗・非 string のいずれでも
  `"0.0.0"` を返す (`src/setup/update-check.ts:371-380`)。
- sealed consumer の entry は `.ut-tdd/runtime/` 配下の bundle 内 `ut-tdd.mjs` で、2 階層上に harness の
  `package.json` が無いため `--version` は `0.0.0` になる (#867 の実測、canary.6 と #1692 の再現)。
  `update-check` も同じ root を使うので `status` は `harness package.json unreadable` で skip する
  (`src/setup/update-check.ts:218-221`、`:285-286`)。
- sealed identity `ConsumerNodeRuntimeIdentity` は `release_id` を持つが release tag の field を持たない
  (`src/setup/consumer-node-runtime.ts:38-56`)。tag は installer が asset 名との一致を検証し
  (`src/setup/consumer-runtime-release.ts:171`)、identity 構築時には `release_id` だけを渡す
  (`src/setup/consumer-runtime-install.ts:170`)。tag は identity に保存されない。
- `release_id` は content 由来の識別子で semver の代用にならない (`RELEASE_ID` 検査、`src/setup/consumer-node-runtime.ts:387-388`)。
- identity は bundle の `bundle-manifest.json` に入り、`bundle_digest` は identity と files から計算される
  (`src/setup/consumer-node-runtime.ts:662`)。active pointer は bundle 内 `ut-tdd.mjs` を指し
  (`src/setup/consumer-worktree-runtime.ts:225`)、同じ bundle ディレクトリに `bundle-manifest.json` がある
  (`src/setup/consumer-worktree-runtime.ts:211`)。
- build は `__UT_TDD_BUNDLED__ = true` を define する (`scripts/build-node.mjs:71`)。source 実行では未定義。
- source の `package.json` の version は `0.2.0-canary.1` (`package.json:3`)。Pack 公開側は封印する entries の
  `package.json` / lockfile の version と tag を一致させるが (`src/setup/pack-publication-adapter.ts:843-851`)、
  consumer runtime の bundle を作る source revision の `package.json` にはその一致を要求する規則が無い。

## 契約

1. **識別元は実行形態で決まる (優先順位は固定)**。
   a. sealed bundle (`__UT_TDD_BUNDLED__ === true`) で、entry と同じディレクトリの `bundle-manifest.json` が
      `validateConsumerNodeRuntimeBundle` を通り、`identity.release_tag` を持つ → その tag から先頭の `v` を除いた値を表示する。
   b. source checkout (`__UT_TDD_BUNDLED__` が未定義) → `package.json` の `version`。
   c. 上のどれにも当たらない → `unidentified` を表示する。`0.0.0` を返す経路を持たない。
   sealed で manifest が無い・壊れている・digest が合わない・`release_tag` が無い場合は (a) に落ちず、(b) へも降りず (c) とする
   (bundle 外の `package.json` を拾って別物の version を出さない)。リポジトリ外へ手で置いた bundle (#1692 の再現) も (c) になる。
2. **`release_tag` は identity の field として保存し digest に含める**。値は installer が asset 名と release 文書の
   `release.tag` の一致を検証した後の tag だけで、`bundle_digest` の入力に入る (identity の一部なので追加の配線は要らない)。
   `release_id` から tag を導出しない。tag の書式は既存の `U-RELVER-006` と同じ `v<package version>` を要求し、一致しなければ
   `consumer_runtime_identity_mismatch` で deny する (新しい reason を足さない)。
3. **読取は実行時に bundle 内だけから行う**。`--version` は導入元の Release ディレクトリ・network・Pack checkout を読まない
   (`U-PACKRT-005` の「Release ディレクトリ削除後も起動」と自己完結性を保つ)。
4. **update-check の local version は 1 と同じ解決を使う**。sealed の local version は identity の tag から、source は `package.json`。
   解決結果が `unidentified` のときは `checked=false`、`detail` に `harness version unidentified` を入れ、表示行にも `v0.0.0` を出さない。
   remote の解決 (`UT_TDD_UPDATE_CHECK_REMOTE` と `package.json` の `repository.url`、`src/setup/update-check.ts:270-274`) は変えない。
   sealed には `package.json` が無いので、override が無ければ従来どおり沈黙する。
5. **既存 bundle (canary.6 / canary.7 など `release_tag` を持たない generation)** は launch を妨げない。`--version` は `unidentified`、
   active pointer と bundle は変更しない。update と rollback は本契約の範囲外 (`U-PACKRT-010`、#364)。
6. **producer 側の手順 (P1、決定済み)**。release を切る前に `package.json` と `package-lock.json` の version を
   release する version へ揃える commit を入れ、consumer runtime を作る source revision (artifact commit) でその一致を満たす。
   producer の source binding で tag の version と artifact commit の `package.json` の version の不一致を fail-close にする。
   source checkout の `--version` が最後に切った release を指すためで、release を作るたびに 1 手順が増える。決定の理由は下記。

## 決定 (control、2026-11-16、#1704)

いずれも高影響境界に当たらず、既存の契約 (digest で束縛した identity、`U-PACKRT-001` の決定論、#364 の update 未対応) から一意に決まるため、control の技術判断として確定した。

| 点 | 採った案 | 理由 (1 行) |
| --- | --- | --- |
| 識別の保存先 | A: installer が検証済みの `release_tag` を identity に入れて `bundle_digest` に含め、実行時は bundle 内の `bundle-manifest.json` を読む | B (build 時に `define`) は bundle bytes を tag ごとに変え、決定論 (`U-PACKRT-001`) の入力を増やすため採らない |
| 旧 generation | 1: `release_tag` なしは `unidentified` で許容 | 必須にして deny すると、update 未対応 (#364) で復旧の経路が無い |
| producer の version 整合 | P1: artifact commit の `package.json` / lockfile を tag と揃える規則を producer で fail-close にする。別の実装 PR | source の `--version` のずれを直す。P2 は症状が残る |
| 表示の文字列 | `unidentified` | prerelease として比較に混ざる余地を作らない |
| sealed の update 通知 | 現状維持 (override が無ければ沈黙) | bundle bytes と remote の正本を増やさない。通知は #364 が持つ |

## 実装 PR の変更範囲

- `src/cli.ts` の変更は **必要**: `--version` の呼出しが `readHarnessVersion(defaultHarnessRoot())` 固定のため
  (`src/cli.ts:629`)、識別元を 1 の優先順位で解決する関数へ差し替える。`status` の update-check 配線 (`src/cli.ts:645-647`) も、
  local version の解決を共有するなら触れる。`src/cli.ts` は S7 (#1379) が直列で変更中なので、**実装は S7 の merge 後**とする
  (Claude lane は S7 完了まで `src/cli.ts` を変えない)。
- 同じ PR に入れてよい src: `ConsumerNodeRuntimeIdentity` への field 追加と `validIdentity` / identity 構築 (`consumer-runtime-install.ts`)、
  version 解決関数 (`update-check.ts` 周辺)。案 P1 を採るなら producer の source binding も触れるが、別 PR に分ける (1 PR = 1 論点)。
- 本契約の凍結 (設計と test design の pair-freeze) と review の後に実装へ進む。
