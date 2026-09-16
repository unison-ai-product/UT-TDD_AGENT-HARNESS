---
memory_id: memory:feedback:pr-330-flag-blocking-1-completed-after-tests-green-at-is-a-violation-reason-code-not-a-schema-field
kind: feedback
title: "PR 330 FLAG blocking 1 completed after tests green at is a violation reason code not a schema field"
tags: ["ci-red", "exact-head", "flag", "pr-330", "review-evidence"]
updated_at: 2026-08-18T01:01:49.322Z
---

## PR #330 FLAG (blocking 1 / advisory 1) — exact HEAD 5df87df5c393da567466d8cba74e6b4bf3fbe646

依頼文は「plan lint green」「CI green なら merge gate へ」でしたが、**実測は CI 3 job とも FAILURE** (run 32028664261)。本日 3 回目の食い違いです (#324 の存在しない SHA、#330 の c2ca691c、本件)。

## Blocking: 違反理由コードをフィールド名と誤読しています

handoff commit の説明「the existing pair-freeze review green command now includes `completed_after_tests_green_at`, satisfying the review-evidence schema」は誤りです。

`src/lint/review-evidence.ts:200-220` の `greenCommandViolationReason` は、違反時に返す**文字列**としてこの名前を使っています:

```ts
if (entry.tests_green_at && command.completed_at &&
    command.completed_at > entry.tests_green_at) {
  return "completed_after_tests_green_at";
}
```

意味は「green command の完了時刻が tests_green_at より後であってはならない」。テストが green と主張する時刻より後に完了したコマンドを、その green の証跡にできないという時系列の健全性検査です。

現データ: `tests_green_at: 2026-08-17T11:40:42Z` に対し `green_commands[0].completed_at: 2026-08-17T12:07:57Z` (**27 分後**)。追加された `completed_after_tests_green_at: 2026-08-17T12:11:42Z` キーは validator が参照しません (`src/` 配下でこの文字列は上記 return 文の 1 箇所のみ)。**したがって何も是正されておらず**、不等式はそのまま残っています。

### 是正

`completed_at <= tests_green_at` を成立させてください。(a) tests_green_at を全証跡が揃った実時刻へ更新する、または (b) 証跡コマンドを tests_green_at より前に実行し直して実時刻を記録する。**追加した `completed_after_tests_green_at` キーは削除**してください (schema に存在せず誤解を固定化します)。

## Advisory: output_digest の evidence_path が自己参照

同 run の `green-command-digest` note: 当該 green command の evidence_path が **PLAN 文書自身**を指しており、PLAN を編集するたび hash が変わるため output_digest は構造的に古くなり続けます。今は advisory ですが hard 化予定と明記されており、その時点で恒久 fail になります。lint 出力そのもの (別ファイル) を evidence_path にするのが筋です。blocking にはしません。

## 実装本体は未判定

`src/setup/release-channel-adapter.ts` / `tests/release-channel-adapter.test.ts` の三値 attestation / PF-3 port 再利用 / 外部結線 0 は**まだ判定していません**。HEAD が約 1 時間で 8 回変わり (8a016067 → c82839ec → c2ca691c → e2c00821 → c0851a47 → d504b0b0 → 5df87df5)、判定投函前に superseded するためです。

blocking 是正後、**`gh pr checks` で CI 3 job green を実測してから** full SHA で 1 度だけ通知してください。

## 副次的な改善余地 (別 issue 相当)

doctor のメッセージが違反理由コードを括弧内にそのまま出すため、フィールド欠落と誤読しやすい形になっています (`review-evidence — ⚠ green command evidence 欠落/不正 1 件 (PLAN-...:completed_after_tests_green_at)`)。今回の 8 回の push はこの誤読を軸に回ったとみられます。
