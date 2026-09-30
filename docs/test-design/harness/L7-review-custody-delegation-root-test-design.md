---
artifact_type: test_design
layer: L6
executed_at_layer: L7
status: draft
pair_artifact: docs/plans/PLAN-L7-503-review-custody-delegation-root.md
parent_doc: docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
created: 2026-08-25
updated: 2026-08-25
---

# Review custody delegation root — L7 test design

`process.cwd()`をそのままreview custodyへ渡すと、nested Git directoryからのdelegationだけが
子ディレクトリへverdict/receiptを作り、merge gateのGit toplevel projectionから不可視になる。
この文書は#396の専用pairであり、既存の共有L7台帳を変更しない。

| Oracle ID | Red input | Expected Green invariant | Test |
| --- | --- | --- | --- |
| `U-RVROOT-001` | Git root配下の`nested/task`をcwdにしてstrict Claude delegationを実行 | receipt pathがGit toplevelの`.ut-tdd/review/receipts/<digest>.json`で、nested側にreview stateが作られない | `tests/review-delegation-root.test.ts` |
| `CANDIDATE-U-RVROOT-002` | root、nested directory、linked worktreeから同一requestを発行 | `resolveRepositoryRoot`後のrequest/attempt identityが同一で、root外permission ruleを生成しない | `tests/review-delegation-root.test.ts` |
| `CANDIDATE-U-RVROOT-003` | Git markerだけ存在しtoplevel解決不能なfixture | `review_repository_root_unresolvable`でfail-closeし、fixture rootへ黙って縮退しない | `src/feedback/repository-root.ts` unit surface |
| `CANDIDATE-U-RVPACK-001` | source checkoutのworktreeをrepoRootにし、別checkoutのCLIから起動する | source profileであるrepoRoot自身の`src/cli.ts`へ再入し、従来のworktree委譲を維持する。productのgeneric `src/cli.ts`はsource扱いしない | `tests/review-delegation-root.test.ts` |
| `CANDIDATE-U-RVPACK-002` | clean Pack consumerからsealed CLIを起動し、active pointerのentryを一致/不一致/欠落へ変異する | 一致時のみ検証付きconsumer wrapperへ再入し、不一致と欠落は子プロセス起動前に拒否する | `tests/review-delegation-root.test.ts` |
| `CANDIDATE-U-RVPACK-003` | `cliPath`未指定、`src/cli.ts`が存在しないconsumer rootから委譲reviewを実process起動する | 既定解決がactive sealed wrapperをspawnし、receipt fileを生成する。旧`repoRoot/src/cli.ts`既定値へ戻すmutationはRed | `tests/review-delegation-root.test.ts` |
| `CANDIDATE-U-RVPACK-004` | consumer wrapper・pointer欠落、pointer entry不一致を個別に与える | absentとidentity mismatchを別のtyped reasonとして返し、`reviewer_execution_failed`へ潰さない | `tests/review-delegation-root.test.ts` |

## TDD sequence

1. 旧実装ではnested receipt pathになることをRedとして確認する。
2. delegationの全custody境界を`resolveRepositoryRoot(process.cwd())`へ置換する。
3. 同じfixtureでGreenを確認し、typecheck/Biome/PLAN lintとcross-OS CIへ昇格する。

## Non-goals

Claude providerのpermission付与、D1/D2/D3の判定規則、Pack publication、worktreeのretention
実装は本sliceに含めない。
