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
- version dispatchはregistryで行い、`1`だけを実装する。未知versionはtyped `unavailable`を返し、
  version 1へfallbackしない。将来version追加時もversion 1を削除・上書きしない。
- clean artifact選択、`docs/skills/* -> skills/*`、workflow template source mapping、`package.json`
  変換は`src/setup/distribution.ts`の既存規則を唯一の正本として再利用する。PF-2内へallow/deny表や
  package変換を複製しない。sourceが異なるのに同じdestinationへ写る衝突はtyped invalidとして
  fail-closeし、先勝ち・後勝ち・silent dedupeをしない。
- 通常fileのcontentは変換後raw bytes、modeは入力の`100644`または`100755`を保持する。
  `package.json`だけUTF-8 decode、既存transform、UTF-8 encodeを行う。decode/parse不能はtyped invalid。
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
長さはbyte長であり文字数ではない。uint32/uint64の範囲外、重複destination、0件のartifact setは
typed invalidとし、digest成功値を返さない。current control manifestはartifact setへ入力しない。

## TDD oracle

`tests/release-materializer.test.ts`は`U-RELMAN-011`のtable-driven mutationとして最低限次を独立に
RED→Green化する。

1. 同じsource entry集合をdry-run/apply相当の2呼出しへ渡し、entry列とdigestがbyte同一。
2. skills remap、workflow source mapping、package変換を各1点変異するとdigest mismatch。
3. destination path、`100644`/`100755`、content 1 byte、symlink target/`120000`を各1点変異すると
   digest mismatch。source blobが同じでもPack出力が違えば一致させない。
4. UTF-8 byte順とpath/mode/contentのuint32be/uint64be framingをgolden bytesで固定し、文字数・LE・
   delimiter連結・locale sort mutantをkillする。
5. destination衝突、unsupported mode、root外/absolute/NUL symlinkを個別にtyped invalidへ倒す。
6. 未知versionは`unavailable`、version 1は同じfixtureで引き続きGreen。fallback mutantをkillする。
7. 入力entry順を反転しても同一結果となり、入力配列と各content byte列が不変。

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
