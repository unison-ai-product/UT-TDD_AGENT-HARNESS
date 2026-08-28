---
plan_id: PLAN-L7-523-release-version-identity
title: "PLAN-L7-523 (add-impl): 初回canary version locatorとimmutable release identityの束縛"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-28
updated: 2026-08-28
owner: Codex / Luna
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-release-version-identity-test-design.md
next_pair_freeze: L8
backprop_decision: required
backprop_decision_reason: "semver/tag locatorとcontent-derived release identityの束縛をPLAN-REVERSE-523でL6へ逆向き検証する。"
github_issue_id: 474
agent_slots:
  - role: se
    slot_label: "Luna worker - pair-freeze済みのversion/tag/receipt束縛を実装する"
  - role: qa
    slot_label: "Terra - prerelease semverとidentity一軸mutationのRed oracleを実装する"
  - role: tl
    slot_label: "Opus/Sol - locatorをreleaseIdへ代用していないことを非著者検収する"
generates:
  - artifact_path: docs/plans/PLAN-L7-523-release-version-identity.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires:
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    - docs/plans/PLAN-L7-519-pack-publication-adapter.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-523-release-version-identity-backfill.md
    - docs/plans/PLAN-L7-362-pack-update-check-advisory.md
    - docs/test-design/harness/L7-release-version-identity-test-design.md
    - docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md
    - src/schema/release-manifest.ts
    - src/setup/update-check.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/474
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/466
review_evidence: []
---

# PLAN-L7-523: 初回canary version locatorとrelease identityの束縛

## 1. 目的

初回internal canaryのpackage/CLI versionを`0.2.0-canary.1`、annotated tag locatorを
`v0.2.0-canary.1`へ固定し、公開済みPackのimmutable release identityへ束縛する。
current mainはpackage/CLIが`0.1.4`のままであり、version更新をstaging seal後やremote publication
中に行うと、source revision、Pack tree、tag、receiptの意味が分離する。

本PLANは`PLAN-L6-63`のidentity定義を変更しない。`releaseId`は引き続き
`rel-sha256:<64 lowercase hex>`であり、materializer version、artifact source commit、artifact-set
digestから導出する。semverとtagは表示・取得locatorであり、`releaseId`の代替でも構成要素でもない。

## 2. 固定する値と正本

| 値 | 初回canary | 正本・役割 |
| --- | --- | --- |
| package version | `0.2.0-canary.1` | sealed Pack entry内のroot `package.json` |
| CLI `--version` | `0.2.0-canary.1` | harness rootの`package.json`を読む既存`readHarnessVersion` |
| tag locator | `v0.2.0-canary.1` | annotated tag。release Pack commit/treeを指すlocator |
| release ID | `rel-sha256:*` | manifest v2の既存content/provenance identity |
| Release assets | tar.gz + checksumのexact 2件 | asset名は既存どおりrelease ID hash由来 |

`package-lock.json` root package versionは`package.json`と同時に更新する。CLIへversion定数を複製せず、
consumer productの`package.json`、current working directory、環境変数、tag文字列からversionを補完しない。

## 3. prerelease semver契約

既存`src/setup/update-check.ts`の`parseSemver`はstable release tag用であり、leading `v`またはbare
三要素stableだけを受理する。`latestReleaseTag`もこのparserを使い、prerelease tagをstable consumerへ
広告しない。この既存契約と`U-UPDCHK-001/002`は変更しない。

packageをcanary versionへ更新するだけでは`readManifest`が`not a release version`へ縮退するため、実装sliceは
**package version専用**の`parsePackageSemver`と`comparePackageSemver`を追加する。tag parserと共有しない。

- `parsePackageSemver("0.2.0-canary.1")`をvalidとして保持し、CLI表示からsuffixを落とさない。
- package parserはleading `v`を拒否する。stable tag parserは従来どおりleading `v`を受理する。
- 同じcore versionではprereleaseをstableより低く扱う。
- prerelease identifierはdot区切りで比較し、numeric identifierを数値、non-numericをASCII字句で比較する。
- 空identifier、空白、欠落core、不正なleading zeroをtrim/coerceしない。build metadataはprecedenceから除外する。
- `readManifest`はpackage parser、`latestReleaseTag`は既存stable tag parserを使う。
- `checkForUpdate`の比較時だけstable tag tupleをstable package tupleへ明示変換する。mixed tag listに
  `v0.2.0-canary.1`があってもstable候補へ選ばず、明示locatorで導入するinternal canaryとstable update
  advisoryを混ぜない。
- update-checkはadvisoryのfail-open性を維持し、parse失敗をrelease identityへ変換しない。

## 4. publication束縛

`PLAN-L7-519`実装がmainへ到達した後、sealed Pack entryからroot `package.json`を一意に解決し、
versionをpublication intentへ追加する。seal前に次をAND判定する。

1. root `package.json`がexactly oneで、JSON objectかつversionがcanonical prerelease semverである。
2. package versionがoperationの`releaseVersion`と一致する。
3. `tagName === "v" + releaseVersion`である。
4. intent/receipt/tagが同じcontent-derived `releaseId`、source revision、release Pack commit/treeを指す。

欠落、重複、invalid JSON、non-string version、legacy `0.1.4`、bare tag、別prerelease、別release IDは
最初のremote write前にtyped denyとする。staging seal後のpackage bytes変更は既存entry/content/
manifest/intent digest検証で拒否し、versionだけを再読込してcoherentに見せない。

reconciliationと最終publication receiptにも`releaseVersion`と`tagName`を保持し、各一軸mutationを
拒否する。tag targetはmerge read-back済みrelease Pack commit/treeだけとし、semver一致を理由に
別commit、別tree、別`releaseId`を受理しない。

## 5. TDD / oracle契約

paired test designの`CANDIDATE-U-RELVER-001..009`と`CANDIDATE-P-RELVER-001`をRedから開始し、
実装PRで成立したものだけを同番号`U-RELVER-*` / `P-RELVER-*`へ昇格する。各負系は他のdigest軸を
正しく保った単軸fixtureとし、別理由RedをGreen証拠にしない。

## 6. 順序と所有path

このpair-freeze PRは本PLAN、Reverse、専用test-designだけを所有する。production code、package version、
test code、共有`L7-unit-test-design.md`は変更しない。

実装PRはPR #466のmain到達後に最新mainから作成し、`package.json`、`package-lock.json`、
`src/setup/update-check.ts`、`tests/update-check.test.ts`、publication adapterと専用testをboundedに変更する。
manifest schema、release ID導出式、asset namingは変更しない。Bun撤去、clean consumer smoke、stable昇格、
Product A/Bは別Issueの所有を維持する。

## 7. 完了条件

- package/lock/CLIが`0.2.0-canary.1`で一致し、package prerelease parseでupdate-checkが縮退しない。
- stable tag selectionはprereleaseを広告せず、既存`U-UPDCHK-001/002`を変更しない。
- tag locatorが`v0.2.0-canary.1`で、content-derived release IDとrelease Pack commit/treeへ束縛される。
- 全負系でremote write 0、staging seal後のversion mutationを成功扱いしない。
- Red→Green、Node/npm targeted test、typecheck、Biome、PLAN lint、Linux/Windows/aggregate CI、
  Reverse R1〜R4、exact-head非著者closing receiptを同一revisionへ束縛する。
