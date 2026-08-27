---
plan_id: PLAN-L7-515-pack-remote-canary-publication
title: "PLAN-L7-515 (add-impl): human-approved Pack remote canary publication adapter pair-freeze"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-27
updated: 2026-08-27
owner: Codex / Luna
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-pack-publication-remote-test-design.md
next_pair_freeze: L8
backprop_decision: required
backprop_decision_reason: "human-approved remote publicationのauthority、CAS、partial/indeterminate境界をPLAN-REVERSE-515でL6契約へ逆向き検証し、既存local stagingとconsumer受入へ正しく接続する。"
github_issue_id: 414
agent_slots:
  - role: se
    slot_label: "Luna worker - sealed remote publication intentと注入portの実装"
  - role: qa
    slot_label: "Terra - approval/CAS/nonce/partial faultのRed oracleを実装する"
  - role: tl
    slot_label: "Sol - remote mutation境界、exact identity、fail-closeを非著者検収する"
generates:
  - artifact_path: docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires:
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-515-pack-remote-canary-publication-backfill.md
    - docs/plans/PLAN-L7-500-pack-publication-assets-pure-domain.md
    - docs/plans/PLAN-L7-499-pack-publication-manifest-v2-pure-domain.md
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/test-design/harness/L7-pack-publication-remote-test-design.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/setup/pack-publication-staging.ts
    - src/setup/pack-publication-assets.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/414
review_evidence: []
---

# PLAN-L7-515: human-approved Pack remote canary publication adapter

## 1. 目的と前提

Issue #414 の最小 remote publication slice を、`PLAN-L7-508` が返す sealed local
staging result から降下させる。対象は `UT-TDD_AGENT-HARNESS-Pack` への human-approved
internal canary 公開だけであり、stable 昇格や consumer の完全受入をこの PLAN の完了と
みなさない。

Hard predecessor は `PLAN-L7-508`（Issue #403）の main 到達とする。入力は sealed
staging identity、明示された Pack commit entries、control manifest sidecar、決定論的
tarball と checksum の exact 2 assets だけである。source repository、current
worktree、開発用 DB/PLAN/evidence、local Pack checkout、directory walk、glob、環境変数
からの補完を実行時入力にしない。`sourceRevision` は sealed identity の provenance と
して検証するだけで、publication 中に source を読み直さない。

実装言語・実行経路は Node/npm とする。Bun、`bun`/`bunx`、`setup-bun`、`bun:sqlite`
および Bun を暗黙に起動する fallback は本 slice に持ち込まない。

## 2. sealed publication intent

adapter は remote mutation の前に、次の値を一つの immutable intent として seal する。

- staging plan digest、release ID、source revision、materializer version
- manifest artifact inventory、artifact-set digest、control snapshot digest
- Pack repository名、対象専用 branch、期待する Pack `main` SHA と before-state digest
- expected canary pointer digest（pointer が無い場合も `absent` を明示）
- Pack commit/tree に書く明示 entry、control manifest sidecar の digest
- release asset 名・順序・size・SHA-256（tar.gz と `.sha256` の **exact 2 件**）
- annotated tag 名と tag が指す Pack commit SHA、draft prerelease の identity
- operation ID、human approval nonce、expiry、approver identity、intent digest

intent の seal 後は entry、bytes、identity、順序、nonce、対象 repository を変更できない。
同一 identity・同一 nonce の再実行だけを idempotent retry とし、別 identity への nonce
再利用や期限切れの承認は最初の remote write より前に typed deny する。

## 3. port と呼出順序

production adapter は GitHub/Pack の SDK や CLI に直接依存せず、次の注入 port だけを
受け取る。port の返却値は `attested`、`mismatch`、`unavailable`、`partial_publication`
または `indeterminate` の typed observation とし、例外を成功へ丸めない。

呼出順序は次の一方向に固定する。

1. sealed staging resultを再検証し、commit entry、sidecar、asset 2件、全 digest と
   release identity が一致することを確認する。
2. human approval receipt（intent digest、expected main SHA、pointer before digest、
   nonce、expiry、approver、全操作列）を検証し、one-shot nonce を消費する。
3. Pack `main` と canary pointer を read-only 観測し、期待 before-state と CAS identity
   を比較する。ここで drift があれば remote port は一切呼ばない。
4. 保護済み main へ直接書かず、sealed entries だけを専用 publication branch へ commit
   して Pack PR を作成する。branch/PR の response を必ず観測し、identity を記録する。
5. approval 済み Pack PR の merge result を観測する。merge が未成立、拒否、または応答
   不明なら tag、Release、asset、pointer の後続 write は 0 とする。
6. merge 後の Pack commit/tree SHA と sidecar digest を再観測し、intent と一致した
   場合だけ immutable annotated canary tag を exact commit へ CAS 作成する。
7. tag identity を観測した後、同じ release identity の draft GitHub prerelease を作成し、
   tar.gz と checksum の exact 2 assets を upload する。asset の名前、bytes、size、digest
   を各々再観測する。
8. tag、draft Release、2 assets、control snapshot、Pack commit/tree、source revision の
   全 identity を auditor が再計算する。完全一致以外は canary pointer write 0 とする。
9. human-approved before-state CAS で canary pointer を更新し、before/after digest を
   read-back する。read-back まで成功扱いにしない。
10. 全操作の順序、remote response、observer 結果、approval、実行者、CI/QA/review
    receipt を append-only publication receipt と auditor result に束縛する。

各 mutation の直後に観測を置く。mutation が成功したか不明になった時点で状態を
`indeterminate` とし、後続 mutation を停止する。再開は盲目的な同じ command の再実行
ではなく、auditor が remote state を再観測し、最後の attested state から同じ intent を
再開できる場合だけ許可する。

## 4. remote fail-close 契約

### 4.1 最初の write より前

次のいずれかは typed deny とし、全 remote write count を 0 にする。

- approval receipt の欠落、期限切れ、wrong authority、wrong intent/identity、nonce replay
- staging plan、entry、sidecar、asset の欠落・余剰・順序・bytes・size・digest drift
- release ID、source revision、materializer、control snapshot の不一致
- Pack repository、expected main SHA、canary pointer before digest の drift
- duplicate tag/release/asset、tag retarget、force push、既存 asset overwrite の要求
- Pack main への直接 push、保護 branch 迂回、source/worktree/DB/PLAN fallback の検出

### 4.2 最初の write より後

PR作成、merge、tag、Release、asset upload、pointer CAS のどの境界でも、拒否、timeout、
response欠落、観測不能、別 identity の応答を `partial_publication` または
`indeterminate` として保持する。最初の remote ambiguity 以降は後続 write を 0 とし、
「未変更」「成功」「再試行可能」と推測しない。

同じ immutable identity と同じ未使用 nonce で、既に attested された結果を再観測できる
場合だけ idempotent resume とする。異なる release ID、別 source revision、別 Pack tree、
別 pointer、nonce 再利用、operation 順序飛越は `mismatch` で停止する。

### 4.3 rollback 境界

この slice は stable rollback automation を実装しない。既存 tag、Release、asset、Pack
commit を削除・付け替えず、障害後の回復は L6-63 が定義する別の human-approved
**supersede-forward** intent としてのみ扱う。回復 intent の設計・実装・実行をこの PR に
混ぜず、`CANDIDATE-PACKPUB-004` と `PLAN-L6-63` の後続責務へ残す。

## 5. publication receipt と監査

成功 receipt は `releaseId`、source revision、Pack commit/tree、annotated tag、Release、
2 assets の name/size/digest、control snapshot digest、canary pointer before/after、
approval identity、nonce、operation ID、各観測結果を保持する。receipt 自身の digest と
intent digest は変更後の remote object から逆算せず、同一 sealed intent に束縛する。

tag/Release/assets の全監査が完了するまで canary pointer CAS を呼ばない。auditor が
観測不能な場合は `unavailable` または `indeterminate` とし、canary 公開完了を宣言しない。
cleanup 失敗は remote publication 成否を上書きせず、独立した typed cleanup observation と
して残す。

## 6. V-model / TDD の降下

この pair-freeze は `CANDIDATE-PACKPUB-003` の remote mutation receipt、approval、CAS、
nonce、partial/indeterminate 規則だけを `L7-pack-publication-remote-test-design.md` に
降下する。`U-PACKPUB-001`（manifest）、`U-PACKASSET-*`（asset bytes）、
`U-PACKPUB-STAGE-*`（local staging）および `CANDIDATE-PACKPUB-004`（rollback）は既存
PLANの所有であり、再採番・再実装しない。

実装時は Terra が Red oracle を先に作り、Luna が注入 port を最小実装し、Sol または
Claude Opus の非著者 review が exact HEAD を検収する。Linux/Windows/aggregate CI、
同一 PLAN revision の Reverse backfill、Claude canonical receipt が揃うまで confirmed
や merge-ready と判定しない。実 remote credential を使用した操作は、別途 human-approved
execution の境界でのみ行う。

## 7. 完了条件

- 未承認・stale・identity drift・entry/asset drift・duplicate/replay・remote ambiguity
  の全負系で、該当境界以降の write が 0 になる。
- Pack PR、approved merge、annotated tag、draft prerelease、exact 2 assets、canary
  pointer、publication receipt が同一 immutable identity に束縛される。
- tag/Release/assets auditor の完全 attestation 前は pointer write が 0 である。
- retry は同一 immutable identity・nonce の attested state からだけ再開できる。
- source repository、worktree、開発 DB/PLAN/evidence、local Pack checkout の暗黙入力が 0。
- `CANDIDATE-PACKPUB-003` の各 mutation と Linux/Windows/aggregate CI、Reverse R1〜R4、
  Claude canonical closing receipt が同一 exact HEAD へ束縛される。
- 初回公開は human-approved internal canary とし、stable 昇格、Product A/B 受入、完全自動
  rollback、Bun 永久BANの実装はこの PLAN の完了に含めない。
