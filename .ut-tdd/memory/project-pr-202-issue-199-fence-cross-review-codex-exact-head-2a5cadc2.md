---
memory_id: memory:project:pr-202-issue-199-fence-cross-review-codex-exact-head-2a5cadc2
kind: project
title: "PR #202 (issue #199 修正の独立回帰 fence) の cross-review を Codex へ依頼 (exact HEAD 2a5cadc2)"
tags: ["2026-07-31", "blocking", "codex", "cross-review", "issue-199", "pr-201", "pr-202"]
updated_at: 2026-07-31T02:05:24.447Z
---

# PR #202 cross-review 依頼 (Claude 著作 → Codex 判定)

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/202
- **exact HEAD: `2a5cadc2`** (これ以外の HEAD への verdict は無効)
- base: main `e8eac4b3` (PR #201 merge 後)
- 順序契約: [[project-po-forward-2026-07-31-f1-199-f2-183-f3-191-f4-169]] の F1 (issue #199) の
  クロージング。**artifact は freeze 済み。verdict 依頼後に本 PR へ push しない。**

## 内容 (1 論点)

issue #199 を閉じた **PR #201 (Codex 著作、`022e0b43`) に対する非 author family の独立回帰 fence**。
`tests/resource-kernel-pair-mapping.test.ts` に `U-RGKPAIR-012` を 1 本追加するだけで、
**`src/` は 1 行も変更しない**。新規 deliverable ファイルも足さない。

固定する 2 方向:

1. 記号のみのセルを**空扱いにする**側 17 件 (#201 の負 test 5 件を拡張。`&quot;` / `&apos;` /
   `,` / `;` / `:` / `"` / `'` / `/` / `\` / `&#124;` / `<span>&#34;</span>` を追加)。
2. 可視 1 文字を**空扱いにしない**逆向き fence 9 件 (`1` / `0` / `n` / `all` / `mock` / `x86` /
   `全` / `あ` / `ア`)。PR #197 の `9792f051` が入れて `c121362c` で撤回した
   「visible 8 文字未満は placeholder」型の文字数下限ハードコードの再導入を機械的に禁じる。

## Claude 側で先に済ませた判定 (Codex 著作 PR #201 への cross-family review)

**PR #201 は reviews=0 / comments=0 で merge されている** (merged 2026-07-31T01:36:47Z)。
closing cross-review が無い状態だったので、Claude が事後に独立検証した:

- 方式判定 = **PASS**。`!/[\p{L}\p{N}]/u.test(normalized)` は issue #199 の対策方針
  (「文字数下限をハードコードしない」) を満たし、かつ仮名・漢字限定でなく全 Unicode
  letter/number へ一般化しているので、issue 本文の案より広く正しい。
- 実測 = 独立 probe **26 ケース (blank 17 / filled 9) FAILS 0**。
- ただし **#201 自身の負 test には逆向き (false positive) の fence が無い**。本 PR がそれを足す。

## 攻撃観点 (最低これだけは実測で潰してほしい)

1. **fence の張り方が正しいか**: `U-RGKPAIR-012` の「空扱いにしない」側 9 件は、
   `analyzeResourceKernelPairMapping` の他の検査 (lane / 契約 / oracle 集合) の副作用で
   偶然通っているだけではないか。`rowsWithEmptyAttribute` だけを見ている点の妥当性。
2. **抜けている攻撃面**: 記号面 17 件で足りるか。全角記号 (`。` `、` `・` `！` `？` `＿`)、
   数学記号 (`±` `×` `÷` `∞`)、絵文字 (`🚫`)、結合文字単独 (`́`)、
   Unicode `\p{L}` に該当してしまう見えない/紛らわしい文字 (`ᅠ` U+1160、`ㅤ` U+3164、
   `ﾠ` U+FFA0 は既存除去済み) のうち、**`\p{L}`/`\p{N}` に一致してしまう空白代替**が
   実在しないか。実在すれば #199 の follow-up として FLAG。
3. **テストの重複でないか**: U-RGKPAIR-010 と #201 の負 test に対して本当に増分があるか
   (単なる膨らませなら FLAG。PO は 2026-07-30 に「膨らませるな」を明示している)。
4. `src/` 無変更・新規ファイル無しが実際に守られているか (`git diff --stat` で確認)。
5. verdict は PASS / PASS-WEAK / FLAG を PR コメントで返すこと。
   **verdict が返るまで Claude は merge しない** (incident #189 の再発禁止)。

## 実測した限定

- 公式 snapshot runner で **11 tests passed / 22.88s / exit 0** をローカルで取得済み
  (Windows ネイティブ)。これは worktree から肥大した `.ut-tdd/harness.db` を除去して初めて
  取れた。理由は [[feedback-vitest-snapshot-runner-windows-workspace-fence-harness-db-hash]]。
- `tsc --noEmit` exit 0 / `biome check` exit 0。
- CI の Linux/Windows leg は本メモリ投函時点で走行中。
