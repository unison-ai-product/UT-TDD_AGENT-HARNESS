---
memory_id: memory:project:claude-pr-200-bun-inventory-cross-review-request
kind: project
title: "PR #200 (Bun 依存点の全数棚卸しを機械導出化、R3 spike) の cross-review を Codex へ依頼 (exact HEAD c18d70bb)"
tags: ["blocking", "bun-withdrawal", "codex", "cross-review", "issue-134", "pr-200"]
updated_at: 2026-07-30T21:15:00+09:00
---

# PR #200 cross-review 依頼 (Claude 著作 → Codex 判定)

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/200
- **exact HEAD: `c18d70bb`** (これ以外の HEAD への verdict は無効)
- 順序契約: R3 (S2 Bun 廃止 spike) の第一タスク。R1 (#198) / R2 (#197) は merge 済み
  ([[project-po-forward-d0-pr-train-order-2026-07-30-codex-pr-handling]] 改訂 3)。

## 内容

Bun 依存点の全数棚卸しを散文から**機械導出**へ移す。8 surface 上の Bun 言及を
execution / api / toolchain / policy へ写像し、分類不能を hook/CI/entrypoint 面で fail-close する。
件数はコード・doc・テストのどこにもハードコードせず導出値で出す。PLAN-L7-462 の依存点表と
enumerator の surface カタログを双方向照合する (片側追加・step 不一致は赤)。

## 実測で判明した PLAN 自身の errata 4 件 (PR 本文に詳細)

1. 「Bun グローバル API 依存は 1 ファイル」は誤り (検出テーブルの文字列リテラルだった)。
2. `bun:sqlite` は動的 require で grep 不可視。
3. hook 面の実体は `.claude/hooks/run-bun.ts` shim 1 点。
4. 分類器の部分一致誤検出 (`ubuntu` / `bundle` / 正規表現内 `\bunimplemented`) を token 境界で修正。

## 攻撃観点 (最低これだけは実測で潰してほしい)

1. **棚卸しが全数か**: 宣言した 8 surface の外に Bun 依存点が実在しないか
   (`.github/actions/`、composite action、`.vscode/`、docs 配下の実行スクリプト等)。
   走査面の宣言漏れがあれば FLAG。
2. **分類の妥当性**: `policy` に実行経路が混じっていないか。特に `src/` の default=policy が
   未知の実行経路を silently 飲み込まないか。
3. **fail-close の実効性**: hook/CI/entrypoint 面へ未知形式の Bun 起動を注入して `unclassified`
   で落ちるかを合成 negative で実行する。
4. **件数ハードコードの不在**: doc / コード / テストに総数期待値が焼かれていないか。
5. errata 4 件の主張が実測と一致するか (特に 1 と 2)。

## 正直な限定

公式 snapshot runner が Windows で無出力ハングするため **targeted テストのローカル green は無い**
([[feedback-official-vitest-snapshot-runner-hangs-after-test-child-start-on-windows]])。
取れたのは `tsc --noEmit` exit 0 / `plan lint` green (checked=849) / `readability` OK /
`biome check` clean / 分類器の導出値と PLAN 表の双方向照合。テスト実測は CI の Linux/Windows leg
を正本とすること。

## 手順の約束 (PR #197 の反省)

- **artifact は freeze する**。verdict 依頼後に artifact へ push しない。追加で穴が見つかったら
  follow-up PR に回す ([[feedback-artifact-must-be-frozen-before-closing-review]])。
- verdict は PR コメントで返す。verdict が返るまで Claude は merge しない (incident #189)。
