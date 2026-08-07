---
memory_id: memory:project:pr-285-d3d-trusted-custody-closing-cross-review-codex-exact-head-9dff5570
kind: project
title: "PR 285 D3d trusted custody の closing cross-review 依頼 (Codex、exact HEAD 9dff5570)"
tags: ["codex", "cross-review", "d3d", "exact-head", "plan-l7-465", "pr-285"]
updated_at: 2026-08-07T11:00:04.532Z
---

PR #285 (PLAN-L7-465 D3d trusted custody) の closing cross-review を Codex family で実施する。

## 対象 (exact HEAD 固定)

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/285
- exact HEAD: `9dff55704b1c22b1c22272502006a2c24035e0c2`
- base: `main` (`49244987` から分岐)
- 著者 family: claude → reviewer は codex frontier tier (`gpt-5.6-sol`)。同族自己承認は不可。

**このメモリは前版 (exact HEAD 4b9ac9bb) を supersede する。** 4b9ac9bb 宛の依頼メモリは無効。
adapter を実測で是正した commit が 1 本乗ったため HEAD が進んだ。

## 前版から変わった点 (ここが追加レビュー対象)

`gh attestation verify --format=json` を gh 2.87.3 で実走し、初版 adapter の**推測 2 件が実バグ**
だったので merge 前に潰した:

1. `--digest` フラグは存在しない (実測: `unknown flag: --digest` / exit 1 / stdout 空)。subject は
   positional file path のみ。digest だけ渡す初版は usage error を `missing` (attestation 不在) へ
   誤分類していた。`GitHubAttestationQuery.artifactPath` を必須化し、
   `CustodyAdmissionInput.receiptPath` から domain を素通しして port へ渡す (domain は読まない)。
2. `verificationResult.statement.subject` は `{name, digest:{sha256}}` の配列で、1 attestation が
   複数 artifact を被覆しうる (cli/cli の 1 attestation が全リリース資産を被覆していた)。
   「verify できた」と「**この** artifact の attestation である」は別。`subjectDigests` を facts へ
   追加し、membership 判定は domain (`attestationFactsMatch`) に置いた。

certificate の field 名 (`sourceRepositoryURI` / `buildSignerURI` / `buildSignerDigest` /
`runInvocationURI` / `issuer`) と URI 形は実出力と一致していた。実測値を `U-RVGHA-D3C-011` の
fixture に写し、推測形へ戻ると赤になる。`--cert-oidc-issuer` も明示指定へ変更。

→ **前版の重点観点 5 番「certificate 正規化は未検証の推測」は解消済み**。残る未検証は
live dispatch 時の実 receipt に対する end-to-end 挙動のみ。

## 変更範囲 (14 ファイル)

新規: `src/feedback/review-custody.ts` / `review-custody-canonical.ts` / `review-custody-runner.ts` /
`ports/github-attestation-verifier.ts` / `ports/provider-family-authority.ts` /
`adapters/gh-attestation-verifier.ts` / `tests/review-custody.test.ts` /
`.github/workflows/review-attestation.yml`。
既存改変: `src/lint/github-ci-policy.ts` (attestation_runtime role) /
`src/lint/oracle-test-trace-widened-baseline.ts` (18 件 ratchet 除去) /
`tests/github-ci-policy.test.ts` / `docs/plans/PLAN-L7-465-*` /
`docs/test-design/harness/L7-unit-test-design.md`。
新規 memory: `.ut-tdd/memory/reference-workflow-dispatch-default-branch-d3d-live.md`。

未変更 (レーン境界): `.github/workflows/harness-check.yml`、`src/cli.ts`、merge gate、
`src/feedback/review-attestation.ts` (D3b)、`src/plan-asset/ports/evidence-attestation.ts`。

## 重点的に疑ってほしい観点

1. `admitReviewCustody` の段階順序に fail-open の穴が無いか。先に返る reject が後段のより重い
   違反を隠していないか (staged short-circuit で最初に落ちた段の reason だけを返す設計)。
2. RFC 8785 実装。key 順が UTF-16 code unit 順であること、`receiptDigest` の preimage から自己
   field が除外されること、`artifactDigest` が receipt へ書き戻らないこと。独立計算の期待値は
   `U-RVGHA-D3C-018` に canonical 文字列でハードコードしてある。
3. strict decode の網羅性。unknown field / 欠落 / 型違い / kind 不整合が `receipt_corrupt` へ、
   well-formed だが不一致な digest だけが `identity_mismatch` へ落ちるか。
4. `AdmittedCustody` が CI / merge 由来 field を持たないこと (`U-RVGHA-D3C-016` は key 集合比較)。
   D1 `merge_ready` の第二 SSoT 化が混入していないか。
5. **新規**: subject digest の membership 判定を adapter と domain の両方に置いたこと。二重判定が
   責務の重複になっていないか (意図は「port を差し替えられても別 artifact の attestation を
   流用できない」defense-in-depth)。
6. `github-ci-policy` の `attestation_runtime` を `requiredRoles` へ足さなかった判断
   (PLAN 実装確定事項 6)。workflow 実在の強制が `U-RVGHA-D3C-010` の実 repo loader assertion
   だけで足りるか。

## 既知の未達 (FLAG ではなく設計どおり。red 扱いしない)

- provider-family authority は PO 未承認・未実装。実行時は機械 custody 全 green でも終端は
  `unverified_family`。`custody_admitted` は port double を注入した `U-RVGHA-D3C-017` でのみ観測
  できる。advisor (`claude-fable-5`) が案B (freeze どおり) を採択済み。
- 実 GitHub 結合試験は merge 前に実行不能 (`workflow_dispatch` は default branch にある workflow
  しか起動できない。PR #285 で HTTP 404 を実測)。

## PASS 後の手順

1. merge (exact HEAD `9dff5570`)。
2. 直後に `gh workflow run review-attestation.yml --ref main -f pr=<PR> -f ...` で live dispatch。
3. run URL / artifactDigest / 終端 state を PR #285 と PLAN-L7-465 の D3d 節へ追記。終端が
   `unverified_family` 以外 (特に `custody_admitted`) なら**それがバグ**。
4. その後に D2 (merge gate / CLI / harness-check 最終 AND 配線) を着工。順序契約
   `D1 -> D3c -> D3d -> D2 -> D4` は維持。
