---
title: "L7 consumer generated instructions test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/consumer-generated-instructions.md
status: confirmed
updated: 2026-11-04
issue: 1524
---

# consumer 生成指示文の呼び出し表記 テスト設計 (issue #1524)

`CANDIDATE-` は未昇格の oracle であり、実装 PR で `U-CGENI-*` へ昇格する。

## 1. 共通 fixture

§2 の fixture は、`consumer-generated-instructions.md` の契約に対し、生成器の出力をメモリ上または一時 dir で検査する。実リポジトリの working tree を対象にしない。

- F1: `package.json` が無い consumer の setup 出力。
- F2: `package.json` に `typecheck` と `lint` script がある consumer の setup 出力。
- F3: `package.json` はあるが `typecheck` / `lint` script が無い consumer の setup 出力。

生成ファイル集合は、setup が出す全 artifact (managed block 3 種、`.claude/commands/*`、生成 workflow、hook 設定の説明文を含む生成 text) とする。

## 2. oracle

| ID | 対象 | 入力・期待・反例 |
| --- | --- | --- |
| `CANDIDATE-U-CGENI-001` | bare の `ut-tdd <args>` の不在 | 入力: F1〜F3 の生成ファイル集合全体。期待: 正規表現 `/(^|[\s`(])ut-tdd[\s`]/m` (`.ut-tdd/` と `ut-tdd.mjs` は一致しない) が 0 件で、CLI 呼び出しはすべて `node .ut-tdd/bin/ut-tdd.mjs ` で始まる。反例: managed block だけを直し `.claude/commands/*` または hook 説明文に bare が残る実装は赤になる。 |
| `CANDIDATE-U-CGENI-002` | 接頭辞が定数 1 個から作られる | 入力: 生成器の source と定数を差し替えた生成。期待: `CONSUMER_CLI_PREFIX` を別値に差し替えると、全生成ファイルの呼び出しが差し替え後の値になり、`node .ut-tdd/bin/ut-tdd.mjs` のリテラルは定数定義の 1 か所だけに現れる。反例: 一部の文面が接頭辞を直書きしていると、差し替え後にその文面だけ旧値が残り赤になる。 |
| `CANDIDATE-U-CGENI-003` | npm script の案内が条件付き | 入力: F1 / F2 / F3。期待: F1 と F3 では `npm run typecheck` / `npm run lint` が、条件文 (「package.json に ... script があれば」) の外に現れない。F2 では定義済み script への案内が出る。反例: test コマンドが F1 で `npm run typecheck` を無条件に要求する実装は赤になる。 |
| `CANDIDATE-U-CGENI-004` | 生成 workflow の npm 段の条件 | 入力: F1 の生成 workflow。期待: npm 段 (`npm run typecheck` / `npm run test`) が `package.json` 無しで実行されない条件を持つ。反例: 無条件の npm 段は F1 で実行できない手順として赤になる。 |
| `CANDIDATE-U-CGENI-005` | setup doctor の表記の一致 | 入力: F1〜F3。期待: managed block・`.claude/commands/*`・生成 workflow が書く consumer setup doctor の表記は `doctor --profile consumer-setup-smoke` の 1 種類で、`doctor --setup-smoke` は生成ファイル集合に 0 件。反例: workflow だけが `--setup-smoke` のままの実装は赤になる。 |
| `CANDIDATE-U-CGENI-006` | 別名の受理と CI 方針 lint の整合 | 入力: `doctor --setup-smoke` と `doctor --profile consumer-setup-smoke` の解決、および profile 形の生成 workflow に対する `github-ci-policy` の検査。期待: 2 つの表記が同じ profile に解決され、profile 形の workflow が CI 方針 lint を通る。反例: lint が `--setup-smoke` の文字列だけを要求し続けると、生成 workflow が lint で赤になる。 |
| `CANDIDATE-U-CGENI-007` | template と setup 生成の parity | 入力: `docs/templates/adapter/` の `AGENTS.md` / `CLAUDE.md` と、setup が生成する同名 artifact の managed block。期待: 本文が一致し、template 側にも bare の `ut-tdd <args>` が無い。反例: `src/setup/templates.ts` だけを直して `docs/templates/adapter/` が旧表記のままの実装は赤になる。 |
