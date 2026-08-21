---
memory_id: memory:feedback:pr-323-closing-review-flag-blocking-1-exact-head-e58c63f4-u-rvmg-024-source-text-assertion-behavioral-oracle-oracle-node-mutant-kill
kind: feedback
title: "PR #323 closing review FLAG (blocking 1): exact HEAD e58c63f4、U-RVMG-024 が source-text assertion で behavioral oracle 不在 (宣言 oracle は node で mutant を kill できない)"
tags: ["coding-not-substance", "flag", "issue-321", "oracle-gap", "pr-323"]
updated_at: 2026-08-14T11:47:47.947Z
---

# Closing review (Claude non-author) — PR #323 / exact HEAD e58c63f460de50b12da950f987e1a3f7c8a2516e

**Verdict: FLAG (blocking 1 / non-blocking 3)**。CI は 3 job とも SUCCESS / CLEAN で、実装変更自体は安全かつ妥当です。blocking は**実装ではなく oracle と記録された因果**にあります。

## 先に明示すべき利害関係

本 PR の起票根拠 (issue #321) は**私の誤報告**です。私は canonical でない bun で `ut-tdd pr merge` を実行して EEXIST を観測し、D2-B の実バグとして報告しました。node での再実測後に撤回済みです (#321 にコメント投稿、close 推奨)。したがって本 review では「私の誤りを取り繕う方向」にも「不要と決めつける方向」にも倒さず、**この PR 単体が repo の検証規律を満たすか**だけを見ます。

## 実装変更の評価 (問題なし)

`src/feedback/review-merge-gate.ts:218` の `mkdirSync(directory, {recursive:true})` → `ensureDir(directory, {recursive:true})`。`src/shared/fs.ts` の `ensureDir` は EEXIST を握り潰す際に `existsSync` と `statSync(path).isDirectory()` を確認しており、**path が file の場合は従来どおり throw して fail-close します**。receipt 本体の書込不能も従来どおり fail-close。既存の共有境界の再利用であり、独自方式の発明もありません。防御的堅牢化として妥当です。

## Blocking B-1: 宣言された oracle と実装された oracle が別物で、修理を裏づける behavioral oracle が存在しない

**宣言** (`docs/test-design/harness/L7-unit-test-design.md:1567`):

> `U-RVMG-024` | `.ut-tdd/logs` を先に作成し、receipt directory 作成を **direct `mkdirSync` へ変異** | intent/result receipt を記録でき、production composition は Windows/Bun 対応 `ensureDir` を経由する

**実装** (`tests/review-merge-gate.test.ts:185-193`):

```ts
const source = readFileSync(join(process.cwd(), "src", "feedback", "review-merge-gate.ts"), "utf8");
expect(source).toContain('import { ensureDir } from "../shared/fs.ts";');
expect(source).toContain("ensureDir(directory, { recursive: true });");
expect(source).not.toMatch(/\bmkdirSync\s*\(/u);
```

これは**実装の綴りを固定する source-text assertion であって、性質を測る behavioral oracle ではありません**。宣言にある「direct `mkdirSync` へ変異」も「receipt を記録できる」も実行されていません。

さらに重要な点として、**宣言どおりに実装しても canonical runtime では mutant を kill できません**。実測 (node v24.13.0 / win32):

```
pre-created dir + direct mkdirSync(recursive:true) -> OK  (変異は kill されない)
receipt append -> OK
```

CI は linux / windows とも node で回るため、宣言された oracle を忠実に実装しても常に GREEN です。`U-RVMG-001` へ追加された `mkdirSync(join(root,".ut-tdd","logs"),{recursive:true})` (`:143`) も同じ理由で、修理前の実装に対して RED になりません (= 差分を pin していません)。

結果として、本 PR で修理前後を判別できるのは source-text assertion 1 本だけです。これは本 repo が明示的に禁じている形です — 「falsifiable な claim の機械的代替は**実 repo 回帰テストであって文ではない** (`coding ≠ substance`)」(CLAUDE.md / .claude/CLAUDE.md の PLAN claim discipline)。実装の綴りを見る assertion は、テストというより文に近いものです。

**是正の選択肢** (方式判断は実装側):

- (a) `U-RVMG-024` と test-design 行を撤回し、PLAN には「canonical runtime (node) では再現せず、legacy bun 経路に対する防御的堅牢化である。behavioral oracle は canonical runtime 上に構成できない」と正直に記録する。実装変更はそのまま残してよい。**私はこれを推奨します。**
- (b) 実際に再現する条件下 (bun + Windows read-only 属性 dir) の behavioral oracle を書く。ただし bun は #134 で permanent ban、`package.json` も `bunAuthority: legacy_migration_debt` であり、廃止対象ランタイムを CI の判定に持ち込むことになるので推奨しません。

## Non-blocking (3)

1. **N-1**: `expect(source).not.toMatch(/\bmkdirSync\s*\(/u)` は当該ファイルにおける `mkdirSync` の使用を**将来にわたって全面禁止**します。receipt directory とは無関係の正当な用途まで縛るため、意図より広い制約です。禁止したいのが「receipt 経路で直接 mkdir しないこと」なら、対象を `writeReceipt` の本体に限定すべきです。
2. **N-2**: PLAN 追記 (`PLAN-L7-465:844-851`) の「Windows/Bun で既存 directory に対する `mkdirSync(..., {recursive:true})` が `EEXIST` を返す runtime 差」という記述は、条件が実測より広く読めます。私の切り分け実測では **node/Windows は許容**、**bun でも書込可能な既存 dir は許容**で、EEXIST が出たのは **bun かつ Windows read-only 属性が付いた既存 dir** の組み合わせのみでした。「Windows/Bun」と書くと node/Windows も該当するように読めます。誤った因果を confirmed PLAN へ凍結しないよう、条件を実測どおりに絞ることを勧めます。
3. **N-3**: `src/doctor/test-repository-isolation.ts:22` への `review-merge-gate:1` 追加は、当該 suite が実 repo の source を読む分類として正しい登録です (指摘ではなく確認事項)。ただしこの登録が必要になったこと自体が、B-1 の「テストが repo source を grep している」構造の裏返しです。B-1 を (a) で是正する場合、この行も不要になります。

## 実測サマリ

- `git diff 140de959..e58c63f4` = 5 ファイル +25/-2 の全 hunk 精読
- `src/shared/fs.ts` の `ensureDir` を読み、file 衝突時に throw する (fail-close 維持) ことを確認
- node v24.13.0 / win32 で「既存 dir + direct `mkdirSync(recursive:true)`」が成功することを実測 → 宣言 oracle が canonical runtime で mutant を kill できないことを確定
- 先行実測 (issue #321 コメント): node で `pr merge` の `receiptPath` は非 null、`result_receipt_write_failed` は発生しない
- CI run: linux / windows / aggregate 3/3 SUCCESS、`mergeStateStatus=CLEAN`

**未確認**: `ut-tdd doctor` は singleton 規律により未起動 (`review-merge-gate:1` 分類の doctor 実走は未実施)。bun 上での回帰実測は、bun が ban 対象であるため意図的に行っていません。

## まとめ

実装は残してよく、close→分割の対象でもありません。是正が必要なのは **oracle の形 (B-1)** と **記録された条件の精度 (N-2)** です。是正後の新 exact HEAD で delta review します。
