# A-148 - 設計文書日本語化と evidence digest 再束ね監査

- **date**: 2026-06-30
- **scope**: PO 指示「設計系のすべての英語ドキュメントは日本語、設計ドキュメントの英文化もゲートで判定」を受けた design-language gate と、A-147 後の dirty tree で再発した green-command-digest 不整合の再束ね。
- **baseline**: current working tree after design/governance/ADR Japanese prose cleanup and `PLAN-L7-208-design-language-gate`.
- **status snapshot**: `bun src\cli.ts status --json` reports `nonTerminalPlansTotal=6`, `activeDraftTotal=0`, `openDefers=0`, all remaining non-terminal items are `versionUpParked`.

## 判定

A-147 の「local close」は、その時点の committed HEAD に対する判定としては維持できる。ただし現在の working tree では設計文書日本語化と doctor hard gate 追加により、既存 evidence_path の実 hash が変わったため、`green-command-digest` は一時的に再 fail した。

この再束ねは mechanical restamp 単独ではない。以下の現行 working tree 実行を先に行い、成功したコマンドに対応する evidence_path の実 hash へ更新した。

## 再実行証跡

- `bun run typecheck`: pass (`tsc --noEmit`)
- `bun run vitest run tests\design-language.test.ts --reporter=dot`: pass (2 tests)
- `bun src\cli.ts db rebuild`: pass (`projection ok`, rows 33870)
- pre-rebind check: `checkGreenCommandDigests` reported 15 mismatches across 10 PLANs.

## 追加是正

再束ね後の doctor/test で、表示上は warning だが hard aggregation に含まれる 2 件が残ったため、通常の実体是正を行った。

- `l6-fr-coverage`: `function-spec.md` の日本語化で DBC table header と `implemented pseudocode` marker が消えていた。本文 prose は日本語のまま、machine marker を開発用語として復元した。
- `tracked-canonical`: tracked top-level `.vscode` を `repository-structure.md` の canonical tree に追記した。

## 再束ね対象

`green-command-digest` が報告した 15 件のみを対象にした。

- `src/doctor/index.ts`: `sha256:ef5918f60045bd007b3023fae28af7487fb3a92adf784ee1f4fb0c8a20d55bd6`
- `tests/doctor.test.ts`: `sha256:38c828573c69c9456aa714bd88c2197ead8fbad2827547f909bccf2c610c8d0a`
- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`: `sha256:7a60fa3ff043ce0de969aae2dcafb4d59fd3adce0dce71864c35a87c48d40cec`
- `docs/adr/ADR-005-distribution-model-and-central-ui.md`: `sha256:1a2394432a0353ebfb84cd5ff74dee413b3583c9809f604c1a8bcda49f7c9321`
- `docs/governance/README.md`: `sha256:2714e0ffd09470610e2bd55861d03012b3ed213dcbd7d9d0ac50576bb747572b`
- `docs/governance/forward-convergence-legacy-debt-audit.md`: `sha256:2d8c4cd731d65778474b64e961f882744721591aa24f6f1a801e2967b9910a4f`

## 統合所見

今回の追加 judge 所見は A-146/A-147 の根本テーマと一致する。ワークフロー定義、駆動モデル、DB projection、配布 adapter は多くが局所 remediation 済みだが、close claim は以下の境界を守る必要がある。

- `projection != substance`: presence、hash 一致、certificate、populated table だけでは「動いた」と主張しない。
- `local close != release close`: push、CI、tag、signed tarball、post-publication consumer install は外部/human-required。
- `shipped configuration != hosted/API enforcement`: repo hook は consumer の Claude/Codex runtime を守るが、この chat runtime の developer tool 呼び出しは repo hook 外である。
- `coverage != substance`: design-language は英語 prose 混入を fail-close するが、内容の真偽や設計品質は review/audit で扱う。

## close 条件

この A-148 が確認すべき immediate close 条件は以下。

1. `green-command-digest` mismatches が 0 に戻る。
2. `tests/design-language.test.ts` と `tests/doctor.test.ts` が green になる。
3. `bun src\cli.ts doctor` が design-language と green-command-digest を含め green になる。
4. 上記が満たされても、L12/L13/release/UAT と clean GitHub publication は引き続き external/human-required と明示する。

## 最終確認

- `bun run typecheck`: pass
- `bun src\cli.ts db rebuild`: pass (`projection ok`, rows 33877)
- `checkGreenCommandDigests`: mismatch 0
- `bun src\cli.ts doctor`: pass
  - `design-language - OK (design/governance/ADR docs 74, english prose 0)`
  - `green-command-digest — OK`
  - `l6-fr-coverage — OK`
  - `tracked-canonical — OK`
- `bun run vitest run tests\design-language.test.ts tests\doctor.test.ts --reporter=dot`: pass (35 tests)
- `bun run vitest run tests\l6-fr-coverage.test.ts tests\tracked-canonical.test.ts --reporter=dot`: pass (11 tests)
