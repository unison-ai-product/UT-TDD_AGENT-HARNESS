---
memory_id: memory:feedback:pr-447-exact-head-c1040ba0-claude-closing-review-flag-blocking-3-including-remotewrites-0-misreport-after-writes
kind: feedback
title: "PR 447 exact head c1040ba0 Claude closing review FLAG blocking 3 including remoteWrites 0 misreport after writes"
tags: ["closing-review", "flag", "issue-414", "pr-447", "publication-adapter"]
updated_at: 2026-08-27T09:30:19.518Z
---

PR #447 exact HEAD `c1040ba05eec941a55e18f1ce9f5fe2759d933a0` の Claude non-author closing review。

**Verdict: FLAG / blocking 3**
receipt digest `6321a408d689e53880ef9807a3aac69bcf1ef97d9f929bba628c8bc68ff0243c`

なお私が指摘した `U-PACKPUB-REMOTE-001〜009` のファイル跨ぎ二重宣言と
`CANDIDATE-PACKPUB-003` の backtick 衝突は解消済みで、CI は 3/3 SUCCESS。
以下は別種の、より重い所見。

## blocking 1: denied 時に `remoteWrites: 0` を返すが、実際には最大 6 write 済みでありうる

`src/setup/pack-publication-adapter.ts:550-558` の共有 `approval()` helper は、
approval の consumption が mismatch した場合に **`{status:"denied", remoteWrites:0}` を返す**。
しかし `runMutation()` はこれを**全 transition で呼ぶ** (pack_commit ×3 / release_draft /
assets ×2 / tag / release_visible / canary)。

したがって、branch commit・PR・CAS merge・draft Release・asset upload 2 本が**既に書かれた後**に
approval が mid-flight で mismatch した場合 (expiry — `U-PACKPUB-REMOTE-004` は reason `"expired"` を
使う — / revocation / replay)、**最大 6 件の remote write が存在するのに typed result は
「remote mutation ゼロ」を attest する**。

`denied` variant の `remoteWrites: 0` は「何も書かれていない」を意味するために typed されており、
PLAN-L7-519 も「最初の write 前は `remoteWrites: 0`」と主張している。この経路はそれを write 後に
emit しており、**rollback / reconciliation のための blast radius を誤報告する**。

隣接行の indeterminate 分岐は `remoteWrites` を正しく伝播しており、意図された invariant が
そちらに現れている (= 本件は設計意図からの逸脱であって仕様ではない)。

## blocking 2: canonical registry の宣言とテスト実装が行ずれしており、未実装 oracle がある

`docs/test-design/harness/L7-unit-test-design.md:2504-2513` (canonical registry) が宣言する
oracle 内容を `tests/pack-publication-adapter.test.ts` が実装しておらず、**行が ID に対してずれている**:

| registry | 宣言内容 | test 実装 |
|---|---|---|
| 002 | approval / nonce faults | initial main/pointer drift |
| 003 | initial drift / duplicate tag | seal-time binding |
| 004 | branch/PR/merge refusal | approval deny |
| 005 | draft identity, asset 0/1/3, bytes/size/digest drift | duplicate tag |
| 006 | tag refusal/retarget, visibility refusal, pre-attestation pointer | pack commit attestation mismatch |

registry 005 / 006 の fault class (`draft_identity_mismatch` / `asset_identity_mismatch` /
asset-count denial / `tag_identity_mismatch` / `visibility_identity_mismatch`) には
**実装 oracle が 1 本も無い**。よって `pack-publication-adapter.ts:789-800, 823-829, 839-862, 880-886`
の code path は未実行のまま、registry と PLAN-L7-519 の `review_evidence.scope` はこれらを
covered と主張している。

`tests/vmodel-source-assets.test.ts:251-261` は ID の presence / count しか assert しないため、
**gate はこの over-claim を検出できない** (PLAN claim discipline: falsifiable な coverage claim は
それを裏付ける test を引用すること)。

## blocking 3: approval nonce の consumption cardinality が未確定で、happy path が成立しない可能性

`src/setup/pack-publication-adapter.ts:694-724` と `803-808` で、**1 transition あたり 1 個の approval
(nonce 1 個) が pack_commit で 3 回** (`commitPublicationBranch` / `createPullRequest` /
`mergePullRequestCas`)、**assets で asset ごとに 1 回**消費される。つまり adapter 自身が
同一 nonce を `ports.approval.consume` に対して replay している。

canonical registry の 002 行は "nonce replay" を typed-deny fault として宣言しており、
`PackPublicationApproval` は `PublicationTransition` あたり nonce を 1 個しか持たない。
したがって **conforming な single-use approval port は 2 回目の pack_commit consumption を deny し、
happy path が完走できない**。しかも blocking 1 により、その deny は branch commit が既に
書かれた後に `remoteWrites: 0` として報告される。

consumption cardinality は PLAN-L7-519 にも test design にも規定が無く、いかなる oracle でも
pin されていない (`tests/pack-publication-adapter.test.ts:156` の test double は無条件に attest する)。
**approval 契約がこの exact HEAD で未確定**である。

## 是正方針 (提案)

1. `approval()` helper の denied 分岐で、隣接する indeterminate 分岐と同様に **実 `remoteWrites` を
   伝播する**。`remoteWrites: 0` は「最初の write 前」でのみ返す。negative oracle として
   「write 後に approval が expire したとき `remoteWrites > 0` が報告される」を 1 本置く。
2. registry 005 / 006 の fault class に実装 oracle を足すか、registry と PLAN の scope 主張を
   実装済み範囲へ縮小する。ID presence/count しか見ない gate では over-claim を防げないので、
   **registry 行と test の対応を機械照合する**か、少なくとも未実装行を明示的に `planned` へ落とすこと。
3. approval nonce の consumption cardinality を PLAN-L7-519 の設計判断節へ **freeze** する
   (transition あたり 1 consume にするか、sub-step ごとに nonce を発行するか)。
   実装 PR 内で発明せず、契約改訂→cross-review→実装の順に戻すこと (§PR スコープ規律)。
