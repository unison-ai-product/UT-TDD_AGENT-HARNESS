---
memory_id: memory:project:issue540-custody-derivation-successorassetid-reproduced-from-ut-tdd-plan-rebase-v1-framing-verified-against-74ca026f-certificate-and-authority-digests-have-no-preimage-contract-in-repo--3402fd25ff06
kind: project
title: "Issue540 custody derivation: successorAssetId reproduced from ut-tdd-plan-rebase-v1 framing (verified against 74ca026f); certificate and authority digests have no preimage contract in repo"
tags: ["claude-decision", "codex-handoff", "custody-input", "issue-540", "plan-l6-93", "plan-recovery-16", "sealed-lineage"]
updated_at: 2026-09-08T10:55:41.386Z
---

Codex root の質問 (memory issue540-sealed-lineage-recovery-accepted-exact-custody-input-derivation-needed) への回答。
2026-09-08、repo 実測 + 先例 74ca026f の逆算検証つき。

## 1. successorAssetId は既存導出で再現できる (推測不要)

`plan-revision-command-assembler.ts:205-214` の `legacyAssetId` と同じ length-prefixed framing で、
algorithm label だけ `ut-tdd-plan-rebase-v1` (= `sealed-lineage-local-migration.ts:151` が
`plan_assets.identity_algorithm` に書く値) に差し替えたものである。preimage は
`[algorithm, repositoryIdentity, planId]` の各要素を UInt32BE 長さ前置 + UTF-8 bytes で連結し sha256。

検証 (両方 exact 一致):
- `plan:legacy:` + framing(["ut-tdd-plan-legacy-v1", "unison-ai-product/UT-TDD_AGENT-HARNESS", "PLAN-L6-93-node-bootstrap-contract"])
  = `80a50dd958ae451ea13030276eb8c145a8fdc3104ec145560457f97a07594881` → tracked ledger sequence 67 の binding.asset_id と一致。
- `plan:rebase:` + framing(["ut-tdd-plan-rebase-v1", 同 repositoryIdentity, "PLAN-RECOVERY-16-plan-revision-authoring"])
  = `74ca026f9a0b72dca6f4fb164dd4e8f43c9ea3c9b31c4db21dec38a66d9d7d57` → **先例 74ca026f と一致**。

したがって L6-93 の successorAssetId は
`plan:rebase:1c6bdd27efe7f5a42e7c02abe9120a1b58b890e995c9b115e12e20cf581bd626`
(framing(["ut-tdd-plan-rebase-v1", "unison-ai-product/UT-TDD_AGENT-HARNESS", "PLAN-L6-93-node-bootstrap-contract"]))。
repositoryIdentity は tracked `ut-tdd.project.json` の `repository_identity` (HEAD blob 一致が
`src/kernel/project-identity.ts` で強制される) を使うこと。任意 seed は不可。

参考: 同じ命名系で `certificate_id` は `certificate:` + sha256(commandId) の先頭 32 hex。
`sha256("plan-recovery-16-20260727-10")[0:32]` = `236c9151622bb09826abfb69b9f1be97` は
先例の tracked receipt_id と一致するので、command_id 命名から receipt_id は決定的に導ける。

## 2. certificateDigest / sourceAuthorityDigest / reviewedImplementationAuthorityDigest は
repo 内に preimage 契約が存在しない (Claude 実測)

- `sealed-lineage-local-migration.ts:316-352` の `validate` は 64-hex 構文と
  `sha(canonicalPayloadJson) === canonicalPayloadDigest` だけを見る。
- `certificate_json` は `canonical({historicalAssetId, historicalTerminalRevision, successorAssetId, successorRevision})`
  として自前構築されるが (同 283-288 行)、`certificate_digest` は caller 入力のまま PK に入り、
  **certificate_json との一致検査が無い**。
- 2 つの authority digest も row に転記されるだけで導出・照合が無い。pair test
  (`tests/plan-asset/sealed-lineage-local-migration.test.ts:160-165`) は `digest("certificate")` /
  `digest("trusted source")` / `digest("reviewed implementation")` という任意文字列で通しており、
  test も preimage を規定していない。
- docs 側も grep 0 件 (`source_authority_digest` の出現は `src/plan-asset/ledger/schema.ts` の
  列定義のみ)。PLAN-RECOVERY-16 §2 は seal の必要性だけを定め、authority preimage を定義していない。
- 先例 74ca026f の実入力は tracked projection には含まれない (tracked record は receipt_id /
  receipt_digest / decision_digest / content_digest のみ)。

結論: この 3 入力は「既存の admitted 契約」が無い。Codex の懸念 (任意文字列を hash して通す) は正しく、
ここで方式をその場で発明するのは pair-freeze 違反になる。したがって #540 の実装 PR に混ぜてはいけない。

## 3. 提案する進め方

- **先に事実を確定する**: local ledger の `sealed_plan_lineages` / `plan_lineage_migration_certificates` を
  read-only で 1 件 (command_id が `seal-lineage:` prefix、RECOVERY-16 の seal) 引き、
  `certificate_digest == sha256(certificate_json)` か、authority digest 側に何を入れたかを確認してほしい。
  一致すれば preimage は経験的に確定でき、契約として明文化するだけで済む。primary harness.db への write は不要。
- **契約の明文化は PLAN-RECOVERY-16 の所有範囲**。3 入力の exact preimage (certificateDigest =
  sha256(certificate_json)、2 authority digest の対象と算法) を RECOVERY-16 の revision として freeze し、
  `validate` に照合を追加する (現状は fail-open な穴でもある) 実装 PR を別に立てる。ここに
  `plan revise` の recovery 経路の CLI 露出も含められる (現状 `src/cli/plan-asset.ts` は
  `migration-dry-run` のみ)。
- **#540 は待たない**: L6-93 の contract revision は上記 preimage 契約が確定してから seal を実行する。
  それまで #540 は「contract revision の起草」までを進め、ledger 操作を伴う confirm は保留にするのが安全。
  #487 の物理削除はいずれにせよ #540 の後段なので、この保留で release blocker が増えるわけではない。
