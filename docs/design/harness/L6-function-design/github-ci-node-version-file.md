---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_github_ci_node_version_file
pair_artifact: docs/test-design/harness/L7-github-ci-node-version-file-test-design.md
parent_doc: docs/design/harness/L5-detailed-design/internal-processing.md
issue: 1873
---

# GitHub CI の Node の版の参照を .node-version に集約する (Issue #1873)

> **L6 contract marker**: `analyzeGithubCiPolicy(docs) => GithubCiPolicyResult` (`src/lint/github-ci-policy.ts`) の期待 step (`commonSteps` / `harnessAggregateSteps`、`github-ci-windows-shard.ts` の aggregate step、`attestation_runtime`) の `actions/setup-node` の `with` は unit-test-granularity contract である。pre: `docs` は source workflow・`review-attestation`・Pack template・consumer template の読込み結果。post: setup-node の `with` が §1 の形でない doc ごとに、既存の step 不一致の違反を返す。invariant: 版の正本は `.node-version` の 1 つで、consumer template の literal は `NODE_TOOLCHAIN_POLICY.nodeVersion` と完全一致する。oracle は `docs/test-design/harness/L7-github-ci-node-version-file-test-design.md` の `CANDIDATE-U-CIPOL-042`〜`048` が固定する。

L5 `internal-processing.md` の「Node toolchain authority」節の項目 2 (source workflow pin) の持ち方だけを、この文書で改める。L5 の他の項目 (版の正本の検査、封印) は変えない。L5 の文書は doc-split の上限にあるので、改訂はこの文書に置く。

## 1. 契約

**workflow の版の参照は `.node-version` の 1 か所に集約する（Issue #1873、Refs #1589）**。項目 2 のうち「source workflow pin」の
   持ち方だけを改める。審査済みの 1 点（版）の正本は `.node-version` であり、`NODE_TOOLCHAIN_POLICY.nodeVersion` との完全一致は
   `toolchain-pin` が引き続き検査する。Node の封印（版・archive digest・`docs/governance/node-toolchain-provenance.json`・
   executable receipt）は変えない。新しい機構・rule は足さない。
   - **source workflow（実測 2026-11-20: `harness-check.yml` に 5 か所、`review-attestation.yml` に 1 か所の `node-version` リテラル）**:
     `actions/setup-node@v4` の `with` は `node-version-file: .node-version` を持ち、`node-version` キーを持たない。`cache: npm` など
     他のキーは変えない。`node-version-file` は checkout 済みの作業ツリーから読むので、各 setup-node は同じ job 内で先行する
     `actions/checkout` の後ろに置く（現状の全 job で成立済み）。`review-attestation.yml` は default branch を checkout するため、
     読む `.node-version` は信頼できる base 側であり、PR head の値を取り込まない。`code-health.yml` と `security.yml` は
     すでにこの形であり、変更しない。
   - **`github-ci-policy` の検査**: runtime 各脚と aggregate の期待 step（`commonSteps`、`harnessAggregateSteps`）の `with` は、
     `node-version` のリテラルではなく `node-version-file: .node-version` を完全一致で要求する。リテラルの `node-version` が残る、
     値が `.node-version` 以外のパスを指す、`node-version` と `node-version-file` が併存する、のいずれも違反とする
     （併存は、`node-version` が優先されて `.node-version` が無視されるため、集約が崩れる）。
     `review-attestation.yml`（`attestation_runtime`）と Pack template も同じ形を要求する。
   - **Pack template（`pack-harness-check.yml`）**: Pack は `.node-version` を同梱する（`CLEAN_REQUIRED_PATHS`、
     `CLEAN_ALLOW_FILES`）ので、`node-version-file: .node-version` へ移す。Pack policy fixture（`tests/github-ci-policy.test.ts`）は
     template の正例として同じ形を表し、drift をテストで拒否する（項目 2 の趣旨は維持）。
   - **consumer template（`docs/templates/github/common/harness-check.yml` と `src/setup/consumer-ci-workflow.ts` の
     `CONSUMER_CI_WORKFLOW`）は移さない**。consumer の repo には `setup` が `.node-version` を配らない（実測: `src/setup` に
     `.node-version` の書き出しはない）。consumer は自分の Node の版を持ってよい（項目 1: `engines.node` は範囲）ため、
     存在しないか別の版のファイルを読ませると、固定済みの release asset を実行する CI の runtime が不定になる。
     template はリテラルの `node-version: "24.22.3"` を保つ。ただし版の正本は 1 つのままにするため、リテラルは
     `NODE_TOOLCHAIN_POLICY.nodeVersion` と完全一致しなければならず、`github-ci-policy` はこの一致を検査する
     （`.node-version` ← `NODE_TOOLCHAIN_POLICY` ← template のリテラルの鎖。上げ漏れを止める）。
   - **windows shard の aggregate step（`src/lint/github-ci-windows-shard.ts`）** の期待値も `node-version-file: .node-version` へ改める。
   - **違反の理由（既存の `reason` の語彙を使い、新しい `reason` は足さない）**: 期待 step との不一致は既存の step 完全一致の違反として
     報告し、`detail` に「`node-version` のリテラルが残っている」「`node-version-file` が `.node-version` でない」を書く。
     consumer template の literal 不一致は `detail` に template のリテラルと `NODE_TOOLCHAIN_POLICY.nodeVersion` の両方を書く。
   - **範囲外**: Node の版を上げる作業そのもの（#1254 の系統）、`toolchain-pin` の rule、provenance registry、
     `.node-version` を consumer へ配る方式の変更。consumer へ配る変更は別の設計判断であり、この項目では行わない。
