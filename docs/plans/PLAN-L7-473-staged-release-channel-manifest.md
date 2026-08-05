---
plan_id: PLAN-L7-473-staged-release-channel-manifest
title: "PLAN-L7-473 (add-impl): 段階リリース管理 — release channel manifest 契約 freeze (S1)"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-04
updated: 2026-08-05
owner: PO / Claude
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - release channel manifest schema と sync-pack --channel 最小実装"
  - role: qa
    slot_label: "QA - manifest↔Pack実状態突合とrollback非破壊性を検証"
  - role: tl
    slot_label: "TL - 正本選択 (manifest vs harness.db vs GitHub Releases) と非破壊契約の独立レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
    - docs/governance/vmodel-refactor-qa-release-gates.md
    - docs/design/harness/L6-function-design/setup-solo-team.md
    - src/setup/distribution.ts
    - src/cli/distribution.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/224
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/247
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/248
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/249
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/250
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/251
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-473: 段階リリース管理 — release channel manifest 契約 freeze (S1)

## 0. 位置づけと既存 PLAN との関係 (issue #224)

harness は製品開発の OS であり、自身の配布物 (`unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`)
と下流製品の両方に段階リリース管理を提供する必要がある。`PLAN-L6-63-pack-staged-release-rollback`
は 2026-07-08 起票の draft add-design で、**Pack リポジトリ側の段階公開・revert runbook**
(tag 運用、consumer 撤回) のみを対象としていた。本 PLAN はその設計スコープを
**manifest ベースの単一契約** (Pack だけでなく将来の下流製品消費者にも再利用可能な形) へ
一般化する add-impl であり、`PLAN-L6-63` を parent design として引き継ぐ。**`PLAN-L6-63` の
既存記述を上書きしない** — L6-63 が持つ「ローカル copy-plan/staging は非破壊済み」「Pack repo
側の tag/revert runbook が未確認」という切り分けは本 PLAN の前提として維持し、L6-63 は
本 PLAN の manifest 契約が固まった後も、Pack 側 tag/release/revert runbook を所有する
`PLAN-L6-63` は存続させる。本 PLAN は manifest / channel / promotion の機械契約を所有し、
L6-63 は Pack repository の運用設計を所有するため、上下流の相互参照で結び、supersede しない。
これは層と責務から一意に決まる技術判断であり、PO 判断待ちにはしない
(Codex independent review、2026-08-05)。

本 PLAN は **S1 (契約 freeze、設計専用)** であり、実装コードは生成しない。`generates` は
本 PLAN doc 自身のみとし、schema/実装モジュールは S2 着手時に確定 PLAN の `generates` へ
追加する (draft PLAN に未来ファイルを書かない規律)。

## 1. 目的

リリース/チャネルの現在状態を機械判定可能な単一契約として固定し、Pack 配布 (dogfood) と
下流製品の両方が同じ契約に乗れるようにする。S1 は契約の骨子と設計判断のみを確定し、
実装 (S2)・一般化 (S4) には進まない。

## 2. 設計判断節

1. **正本 = source development repo 内 manifest ファイル** (`release/manifest.yaml` 想定)。schema は
   `src/schema/release-manifest.ts` に置き、lint/doctor が fail-close で検証する。
   S2 は同ファイルを clean Pack artifact allowlist へ追加し、`buildCleanDistributionPlan` と
   `sync-pack` が Pack checkout へcopyする経路を同じ変更で実装・検証する。Pack側のcopyは
   source manifestから生成した配布物であり第二正本にしない。下流製品は同じschemaで各repo内に
   自身のmanifest正本を持つ。
   - 案B (harness.db 正本) は不採用。db は派生 projection であり、これを正本にすると
     「projection が古いだけ」を「重複なし/影響なし」という偽の否定証明にすり替える
     (issue #169 実例: PLAN-L6-94 と PLAN-L7-465 の契約重複を graph 未投影で検出できなかった)。
   - 案C (GitHub Releases/tags 正本) は不採用。外部可変状態かつ API 依存になり、offline/CI
     での決定性が失われる。ただし tag/Release は「配送済み事実の証跡」として manifest と
     突合する auditor の入力に使う (後続 slice、本 PLAN のスコープ外)。
   - (advisor 裁定 2026-08-04、design 判断、claude-fable-5)
2. **着手順 = contract → pure manifest domain → versioned materializer → isolated Git resolver →
   `sync-pack --channel` adapter → aggregate acceptance** (PR #244 Sol closing FLAG訂正、2026-08-05)。
   adapterから先に作ると、未確定のidentity/digest/resolver契約へCLIを合わせる逆転が起きるため禁止する。
   各子sliceは「docs-only pair-freezeをcross-reviewしてmainへmerge → 対応実装とtest citationを同じ
   commitで追加 → exact-HEAD CIとnon-author review」の順を守り、前段のGreenを後段着手条件とする。
   ただし下流製品向けの汎用domain抽出はS4まで行わない。S2のpure domainはPack manifest契約だけを
   小さく閉じ、2例目のconsumerが現れた時点でReverseにより一般化する。
3. **rollback = manifest 巻き戻しのみ** (PO 採択 2026-08-04)。チャネルが指すバージョンを
   前バージョンへ戻す宣言変更に限定し、配布先 repo の Git 履行履歴そのものは書き換えない
   (非破壊)。実巻き戻しの自動化 (force push / tag 付け替え) は不採用 — `sync-pack` が既に
   持つ「commit/push は行わない、human-reviewed step として分離する」契約
   (`ut-tdd distribution sync-pack --repo-dir` の既存境界) を維持する。
4. **既定チャネル = canary → stable の 2 段** (PO 採択 2026-08-04)。schema は
   `channels: Record<channelName, releaseId>` と `channelOrder: channelName[]` を分離し、後者は
   channelsのown keyを重複なく全件ちょうど1回列挙する。custom channelは追加可能だが、未登録release、
   inherited property、orderの欠落/重複/余剰を拒否する。promotion可否の意味論はS3まで追加しない。
5. **control-plane manifest と artifact source revision を分離する** (Codex independent technical
   review、2026-08-05)。現在の control checkout にある manifest は `releases` map と `channels` map
   を保持し、各 release record は immutable な release ID、`artifactSourceCommit` (40桁 SHA)、
   `artifactSetDigest` を持つ。`channels.<name>` は release ID だけを指す。`sync-pack --channel
   <name>` は現在の manifest を読んだまま、選択 record の `artifactSourceCommit` を local Git object
   database から isolated temporary tree/archive へ解決し、その revision の clean Pack artifact setを
   生成・照合して 1 つの Pack checkout へ materialize する。control checkout の HEAD と
   `artifactSourceCommit` の一致は要求しない。object 不在時に network fetch や現在treeからの再構成を
   行わず `unavailable` でfail-closeする。これにより manifest を更新した commit が自身のSHAを含む
   自己参照を避け、`stable=v1 / canary=v2` と rollback pointer を同じcontrol HEADで解決できる。
   Packへcopyする現在manifestはcontrol metadataでありartifact-set digest対象外とする。tag/Release
   auditor は外部配送証跡であり、このlocatorの正本にはしない。
6. **artifact digest と release ID はmaterialize後のbyte列で決定論化する** (Codex independent
   technical review、2026-08-05)。release recordは`materializerVersion`を持ち、runtimeがそのversionを
   実装していなければ`unavailable`で拒否する。version 1は選択`artifactSourceCommit`のtracked pathsを
   入力に、version固定のclean allow/deny、`cleanDistributionSourcePath`、
   `cleanDistributionArtifactPath`、`transformCleanDistributionArtifact`相当の規則を順に適用し、
   **Packへ書くdestination path / mode / content**を生成する。`docs/skills/* → skills/*`、workflow
   template source mapping、`package.json`変換をdigest前に適用する。current control manifestのPack copyは
   control metadataとしてartifact setから除外する。通常fileは変換後raw bytes、symlinkはPack destination
   に作るlinkのtarget raw bytesとGit mode `120000`、通常modeは`100644`/`100755`とする。unsupported
   file kindやroot外symlinkはfail-closeする。entryはdestination POSIX `/` pathのUTF-8 byte昇順で並べ、
   `uint32be(pathBytes.length) || pathBytes || uint32be(modeBytes.length) || modeBytes ||
   uint64be(contentBytes.length) || contentBytes`を連結してSHA-256を取る。
   `artifactSetDigest = sha256:<lowercase hex>`、`releaseId = rel-sha256:<SHA-256 lowercase hex of
   ASCII(materializerVersion) || 0x00 || ASCII(artifactSourceCommit) || 0x00 || raw 32-byte artifact digest>`
   とする。同じrelease IDに異なるrecordを宣言した場合は履歴比較に依存せず導出式不一致として拒否する。
   materializer変更はversionを上げ、既存releaseを解決する旧versionを消さない。

7. **AC-6の原子性はPF-5の単一final-tree admission transactionで保持する**。前段sliceがpure moduleを追加しても、
   `release/manifest.yaml`の正本化、clean Pack allowlistへの追加、`sync-pack --channel`からの選択・copyを
   個別にpublishしてはならない。`release-channel-aggregate-admission` guardはGitのcommit境界・merge方式・
   PR履歴を入力にせず、exact HEADのfinal treeから (A) manifest SSoTが正規pathに一意かつschema valid、
   (B) clean distribution planがそのcontrol manifest copyをallowlist到達物として含む、(C) channelが選ぶ
   artifact revisionをresolver→materializer→Pack destinationへ写す経路が存在する、の3 predicateを
   side effect前にAND判定する。全成立時だけsealed write planを返す。
   **3 predicate全成立後の staging write/copy および destination commit/apply の各境界へ1..N faultを総当たり注入する。全faultでstagingを破棄し、destination/control manifest/allowlist/copy inputのprior bytes/mode/pathを不変に保ち、partial publish 0とする。成功時のみcommit/apply exactly 1とする。**
   1点でも欠ければ
   resolver/materializer/copy/write count 0で拒否する。従って子slice化はscope縮小ではなく、外部可視な
   AC-6をPF-5 admissionまで不可分に保ったまま内部証明を依存順に積む実装順序契約である。

## 3. 契約骨子

- リリース単位 = immutable release record + artifact set。release ID は
  `artifactSourceCommit` と canonical artifact-set digest から導出し、同じ ID の内容変更を拒否する。
  semver は表示用 metadata として保持できるが locator には使わない。
- channel pointer と release record を分離する。複数チャネルが異なる release ID を同時に指せる。
  `sync-pack --channel` と実状態突合は現在manifestの選択 channel 単位で行い、isolated resolverが
  対応artifact revisionを解決できない状態は `unavailable`、解決できるがdigestが異なる状態は
  `mismatch` とする。
- チャネル昇格は「宣言変更 + 証跡条件」の組で表現する。証跡条件は最低限
  harness-check green、QA Go/No-Go、cross-review receipt の 3 点を含む。
- manifest ↔ Pack 実状態の突合 verify を AC に含める。突合結果は
  attested / mismatch / unavailable の三値とし、二値 (pass/fail) へ丸めて偽の肯定証明を
  作らない (審査正本 doc: `docs/governance/vmodel-refactor-qa-release-gates.md` の QA
  Go/No-Go 三値判定と揃える)。
- 昇格・巻き戻しは PR 経由で行い、merge gate 規律 (D2 merge_ready fail-close) に乗る。
  manifest 変更だけを理由に merge gate を回避する経路を作らない。

## 4. スコープ外 (S1)

- 実装一切 (schema コード、CLI、lint/doctor 配線) — S2 の対象。
- 下流製品向けの一般化・抽出 (汎用 domain model 化) — S4 の対象。2 例目の消費者が出るまで
  着手しない (設計判断 2)。
- GitHub Releases/tags auditor (突合の外部証跡取得) — 後続 slice。
- 配布 no-go (非破壊不変条件 + clean artifact 未閉) の解除自体。ただし **canary 昇格条件に
  「no-go 解除条件」を参照する依存関係だけは明記する** — no-go が解除されていない段では
  stable への昇格条件が構造的に満たせないことを契約上表現する。

## 5. AC (design freeze 時)

- AC-1: 本契約が non-author family の cross-review で PASS を得ている。
- AC-2: manifest schema の fail-close 境界 (未知チャネル、schema 不正、昇格条件不足) が
  test-design candidate oracle (`CANDIDATE-RELMAN-*`) と対になっている。
- AC-3: rollback の意味論が非破壊 (宣言変更のみ、Git 履行履歴不変) で閉じていることが
  設計判断節に明示されている。
- AC-4: 設計判断節の各項目が advisor相談、PO採択、または独立技術レビューの記録を持つ。
- AC-5: `PLAN-L6-63` は Pack repository のtag/release/revert runbookとして存続し、本PLANは
  manifest/channel/promotion機械契約を所有する。相互参照で接続し、supersedeしない。
- AC-6: source repoの`release/manifest.yaml`だけを正本とし、clean Pack allowlistと
  `sync-pack`による配布copyをS2で原子的に追加する。Pack copyを第二正本にしない。
- AC-7: `stable` と `canary` が異なる immutable release ID を同時に指せる。`sync-pack --channel`
  はcontrol manifestを保持したまま選択channelのartifact revisionをisolated treeへ解決し、digestを
  完全照合する。object不在時はnetwork取得・現在treeからの再構成をせずfail-closeする。
- AC-8: canonical artifact-set digestのmaterializer version、destination path、変換後content、mode、
  path順序・framing・manifest除外とrelease ID導出式が実装者に依存しないbyte-level契約として
  固定されている。
- AC-9: 各子sliceは対応するcandidate oracleを持ち、docs-only pair-freezeがmainへmergeされる前に
  implementation fileを追加しない。candidateから`U-*`への昇格は実装test citationと同じcommitだけで行う。
- AC-10: PR #244 prototypeで未検出だったown-property lookup、artifact digest単独mutation、型不正、
  unknown channelをRED oracleとして保持する。PF-1はpure返値だけを`001/002`として昇格でき、
  aggregate resolver/materializer/copy/write 0は別の`015/016`としてPF-5までRED維持する。
- AC-11 (`017`): **3 predicate全成立後の staging write/copy および destination commit/apply の各境界へ1..N faultを総当たり注入する。全faultでstagingを破棄し、destination/control manifest/allowlist/copy inputのprior bytes/mode/pathを不変に保ち、partial publish 0とする。成功時のみcommit/apply exactly 1とする。**

## 6. 子sliceとpromotable oracle

| 順序 | 子slice | このsliceでのみ昇格可能なoracle | merge条件 |
| --- | --- | --- | --- |
| PF-0 | contract / pair-freeze訂正 | なし (全てRED維持) | 本PLAN・Reverse・test-designだけのPRがcross-review PASS |
| PF-1 / #247 | pure manifest domain | `001`, `002`, `007`, `009`, `013` | parser / identity / own-property / channel解決のpure testがGreen。aggregate side-effect 0は主張しない |
| PF-2 / #248 | versioned materializer | `011` | destination path/mode/transformed bytes/framingのdigest mutationがGreen |
| PF-3 / #249 | isolated Git resolver | `012` | control/artifact revision分離、object不在時network/reconstruction/copy 0がGreen |
| PF-4 / #250 | `sync-pack --channel` adapter内部 | `006` | attested/mismatch/unavailableを保持し、CLI/FS seamの副作用を計測可能 |
| PF-5 / #251 | aggregate acceptance | `014`, `015`, `016`, `017` | final-tree preflight後はisolated staging。fault時破棄・prior state不変、成功時だけdestination transactionを1回commit |
| S3 | promotion / rollback gate | `003`, `004`, `005`, `008`, `010` | D2/D3/QA証跡と非破壊pointer deltaを結線 |

番号はtest-designの`CANDIDATE-RELMAN-*`と一致させる。前段で後段oracleを昇格したり、単体testの
返値だけでresolver/copy/write 0を主張したりしない。

## 7. Schedule

1. [直列 / PF-0] 本訂正をdocs-only pair-freezeとしてcross-reviewし、mainへmergeする。
2. [直列 / PF-1] pure manifest domainのpair-freezeをmergeしてから、対応実装PRを作る。
3. [直列 / PF-2] PF-1 Green後にmaterializerのpair-freeze → 実装を行う。
4. [直列 / PF-3] PF-2 Green後にisolated resolverのpair-freeze → 実装を行う。
5. [直列 / PF-4] PF-3 Green後にadapter内部のpair-freeze → 実装を行う。外部結線はまだ行わない。
6. [直列 / PF-5] exact HEAD final treeのmanifest正本・allowlist・sync-pack copyを単一admissionでAND判定し、
   sealed planだけをapplyする。commit分割やmerge方式ではなくfinal-tree invariantでaggregate acceptanceを通す。
7. [直列] `PLAN-REVERSE-473` R3/R4を閉じ、Forwardへmergeする。FLAG時は該当phaseへ戻り、
   未検証oracleの昇格と後続slice着手を取り消す。

## 完了条件 (S1)

- [x] `CANDIDATE-RELMAN-001`〜`017` が test-design へRED oracleとして登録されている。
  S2は実装test citationと同じcommitで確定`U-*` IDへ昇格する。
- [ ] 設計判断節が non-author family の cross-review で PASS。
- [x] `PLAN-L6-63` との責務分離・存続・相互参照が技術判断として確定している。
- [x] `PLAN-REVERSE-473` が R0 を完了し、既存実装との責務境界を確認する。
