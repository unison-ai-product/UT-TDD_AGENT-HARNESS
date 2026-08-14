---
plan_id: PLAN-L7-486-release-materializer-pf2
title: "PLAN-L7-486 (impl): PF-2 versioned release materializer pair-freeze"
kind: impl
layer: L7
drive: agent
route_signal: forward
route_mode: forward
status: draft
created: 2026-08-14
updated: 2026-08-14
owner: PM / PO
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - version 1 materializerをpure functionとしてTDD実装する"
  - role: qa
    slot_label: "QA - path/mode/content/symlink/framing/version境界をmutationで検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-486-release-materializer-pf2.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
  requires:
    - docs/plans/PLAN-L7-479-release-manifest-pf1-pure-domain.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
    - docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
    - docs/plans/PLAN-L7-479-release-manifest-pf1-pure-domain.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/setup/distribution.ts
    - src/schema/release-manifest.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/248
backprop_decision: not_required
backprop_decision_reason: "PLAN-L7-473 のPF-2 partitionとして既にfreeze済みのbyte-level materializerを実装可能な単位へ限定する。L0-L6要件・設計・外部仕様は変更せず、上流合流はPLAN-REVERSE-473が所有する。"
review_evidence: []
---

# PF-2: versioned release materializer pair-freeze

本PLANはmaster `PLAN-L7-473` のPF-2を、実装者が判断を追加せずTDDできるpure domainへ分ける。
PF-1 (#247) はmainへmerge済みであり、Issue #248はReadyである。本docs-only pair-freezeが
exact-HEAD CIとnon-author closing reviewを通ってmainへmergeするまで実装を開始しない。

## 所有境界

PF-2が所有するのは`CANDIDATE-RELMAN-011`だけである。実装PRでは
`src/setup/release-materializer.ts`と`tests/release-materializer.test.ts`を同じcommitで追加し、
candidateを`U-RELMAN-011`へ昇格する。そのcommitで本PLANの`generates`とstatus、test citationを
更新する。draft時点では未来のsource/testを`generates`へ宣言しない。

PF-2はpure変換だけを行う。Git object解決、network、filesystem read/write、staging、Pack checkout、
CLI、manifest/channel選択、publishは行わない。これらの呼出回数0をPF-2のpure返値だけから主張せず、
PF-3〜PF-5のRED oracleを維持する。

## version 1 入出力契約

- 入力は`materializerVersion`と、source revisionから読み出し済みのtracked entry列である。各entryは
  repo相対POSIX source path、Git mode (`100644` / `100755` / `120000`)とraw `Uint8Array`を持つ。
  入力配列・byte列を変更しない。
- `materializerVersion`はPF-1 schemaと同じ**文字列token**であり、version 1のregistry keyは文字列
  `"1"`とする。完全一致だけを受理し、number `1`、`"v1"`、空白付きtokenをtrim/coerce/aliasしない。
  未知tokenはtyped `unavailable`を返して`"1"`へfallbackしない。将来version追加時も`"1"`を
  削除・上書きせず、release ID導出へ渡すtokenとregistry lookup tokenを同じbyte列に保つ。
- 写像は**artifact空間起点**に一意化する。全source pathを既存`buildCleanDistributionPlan()`へ渡し、
  成功planの`artifactPaths`から後述のcontrol manifestを明示除外したものをdestination集合とする。
  各destinationは
  `cleanDistributionSourcePath(destination, sourcePaths)`でsource entryを逆引きする。そのため
  `.github/workflows/harness-check.yml`のcontentとmodeは同名source entryではなく
  `docs/templates/github/common/pack-harness-check.yml` entry由来となる。`docs/skills/* -> skills/*`は
  `cleanDistributionArtifactPath`を含む同planが決める。PF-2内へallow/deny表、path mapping、
  package変換を複製しない。
- `buildCleanDistributionPlan().ok=false`、missing source、またはsourceが異なるのに同じdestinationへ
  写る衝突はPF-2のtyped `invalid_distribution_plan`としてfail-closeし、entry/digest成功値を返さない。
  衝突は`artifactPaths`の`Set`化後には失われるため、入力source pathsからplanの`excludedPaths`を除いた
  included source列を作り、各pathへ既存`cleanDistributionArtifactPath()`を適用した**dedupe前**の
  destinationを比較して検知する。PF-2はこの合成だけを所有し、allow/deny判定を再実装しない。
  先勝ち・後勝ち・silent dedupeはしない。PF-5はaggregate admission前にPF-2を呼ばない責務を別途
  持つが、PF-2自身もinvalid planを成功へ丸めない。
- 通常fileのcontentは**逆引き後source entryのraw bytes**、modeは同entryの`100644`または`100755`
  を保持する。destinationが`package.json`の場合だけUTF-8 decode、既存transform、UTF-8 encodeを
  行う。workflow destinationはtemplate sourceのraw bytesを使い、package変換はしない。
  decode/parse不能はtyped invalid。
- symlinkはmode `120000`、contentはlink targetのraw UTF-8 bytesとする。NUL、絶対path、drive/UNC、
  またはdestination parentから解決してPack root外へ出るtargetをtyped invalidで拒否する。
  symlink先をdereferenceせず、target filesystemの存在も調べない。
- unsupported mode、空/絶対/`.`/`..` segmentを含むdestination、backslash、NUL、UTF-8不正pathを
  typed invalidで拒否する。正規化で別pathへ救済しない。
- 出力entryはdestination pathのUTF-8 byte列による昇順で一意に並べる。JavaScriptのlocale順や
  OS case-fold順を使わない。返値はdestination path、mode、変換後contentを含むimmutable snapshotとする。

## digest framing

各entryを次の順で連結し、その全byte列のSHA-256を`sha256:<lowercase hex>`として返す。

`uint32be(pathBytes.length) || pathBytes || uint32be(modeBytes.length) || modeBytes ||
uint64be(contentBytes.length) || contentBytes`

`pathBytes`はdestination POSIX pathのUTF-8、`modeBytes`はASCII、`contentBytes`は上記変換後bytesである。
長さはbyte長であり文字数ではない。JavaScriptの実在値ではcontent長がuint64範囲を超えないため、
到達不能な範囲外分岐やoracleは作らない。重複destination、0件のartifact setはtyped invalidとし、
digest成功値を返さない。current control manifest (`release/manifest.yaml`) はPF-2がdestination集合から
**明示的に除外する**。将来clean distribution allowlistへ追加されplanの`artifactPaths`に到達しても、
materializerの出力entry/digestへ含めない。Packへのcontrol copyはPF-5が別に所有し、artifact digestの
自己参照を作らない。

## TDD oracle

`tests/release-materializer.test.ts`は`U-RELMAN-011`のtable-driven mutationとして最低限次を独立に
RED→Green化する。

1. 同じsource entry集合をdry-run/apply相当の2呼出しへ渡し、entry列とdigestがbyte同一。
2. skills remap、artifact空間からのworkflow source逆引き、package変換を各1点変異するとdigest
   mismatch。workflowのcontent/modeはtemplate source由来であることを直接pinする。
3. destination path、`100644`/`100755`、content 1 byte、symlink target/`120000`を各1点変異すると
   digest mismatch。source blobが同じでもPack出力が違えば一致させない。
4. UTF-8 byte順とpath/mode/contentのuint32be/uint64be framingをgolden bytesで固定し、文字数・LE・
   delimiter連結・locale sort mutantをkillする。
5. destination衝突、invalid distribution plan、missing source、unsupported mode、空/絶対/`.`/`..`/
   backslash/NUL/UTF-8不正path、root外/absolute/NUL symlink、0件artifact set、package.jsonのUTF-8
   decode/JSON parse失敗を個別にtyped invalidへ倒す。衝突fixtureはdedupe前のincluded source 2件を
   同じdestinationへ写し、`artifactPaths`が1件に畳まれてもinvalidとなることをpinする。
6. token `"1"`はGreen、number `1` / `"v1"` / `" 1"` / 未知tokenは`unavailable`。coerce/trim/
   fallback mutantをkillする。
7. 入力entry順を反転しても同一結果となり、入力配列と各content byte列が不変。control manifestだけを
   変異してもentry列/digestが不変で、出力集合にも含まれない。synthetic clean planの
   `artifactPaths`へcontrol manifestを明示的に含めたfixtureでも同じ不変条件を満たし、現allowlistの
   偶然に依存しない。

## Schedule / Exit

1. [直列 / pair-freeze] 本PLANとtest-design deltaだけをcross-reviewし、mainへmergeする。
2. [直列 / TDD] `U-RELMAN-011`を先にREDで追加し、pure materializerの最小実装でGreenにする。
3. [直列 / trace-freeze] 同commitでcandidate昇格、`generates`、review evidenceを更新する。
4. [直列 / review] exact-HEAD CIとnon-author closing reviewを通し、Issue #248をcloseする。
5. [直列] PF-3 #249をReadyへ移す。PF-2が未mergeの間はPF-3を開始しない。

- [ ] docs-only pair-freezeがmainへmerge済み。
- [ ] `U-RELMAN-011`が上記7群を1:1に実測し、mutationをkillする。
- [ ] source/test以外のGit/FS/CLI/publish差分が0。
- [ ] exact-HEAD CI greenとnon-author closing PASS。
