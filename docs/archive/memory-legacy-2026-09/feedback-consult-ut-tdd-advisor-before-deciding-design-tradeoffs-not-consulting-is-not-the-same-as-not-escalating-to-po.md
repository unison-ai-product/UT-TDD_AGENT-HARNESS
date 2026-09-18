---
memory_id: memory:feedback:consult-ut-tdd-advisor-before-deciding-design-tradeoffs-not-consulting-is-not-the-same-as-not-escalating-to-po
kind: feedback
title: "consult ut-tdd advisor before deciding design tradeoffs, not consulting is not the same as not escalating to PO"
tags: ["advisor", "design-decision", "elicitation", "po-rule", "verification"]
updated_at: 2026-08-03T01:43:44.999Z
---

設計判断を独断で決めるな。**PO へ上げないこと**と**誰にも相談しないこと**は別物である。
PO ルール 2026-08-03 (指摘: 「お前そんなに賢くないんだから相談するようにしたほうがいい」)。

## 何を取り違えたか

先行の PO ルール [[feedback-escalate-to-po-only-when-the-goal-changes-not-when-an-advisor-says-so]]
(「なんでもこっちによこすな」) を、**「誰にも相談せず自分で決めろ」**と解釈して運用していた。
これは誤り。あれは *PO に判断を投げるな* という意味であって、`ut-tdd advisor` を使うなという
意味ではない。結果、2026-07-31〜08-03 のセッションで輸送方式・著者族解決・識別子必須化・
isolation 違反の解消方法をすべて独断で決め、**うち 1 件 (識別子の必須範囲) を CI で壊した**。

## 実害 (2026-08-03 実測)

「`review_lane` role では識別子必須」と自分で書いた仕様が、`REVIEW_GATE_ROLES` が 14 種あり
`qa` / `tl` / `uiux` を含むことを**列挙せずに**書いたため、`cli-surface` の dry-run 2 件を
fail-close させた。さらに opt-in へ直した後の安全論拠「receipt 無しは D1 の SLA breach で
表面化する」も Fable に refute され、実測で確認された: breach 判定は `input.requests` 起点なので
**request が無ければ判定対象が存在しない** (窓は 60 分ではなく無限)。

## How to apply

- **設計判断 (trade-off が実在する方式選択) は決める前に `ut-tdd advisor` を通す。**
  `ut-tdd advisor --task-file <path> --current-model <model> --reason "..." --execute`。
- routing に注意: `--decision design` は **claude-fable-5** へ流れる (デザイン/UI 判断の意)。
  技術設計・トラブルシューティングで Sol を引きたいなら `--provider codex` を明示するか
  `--decision troubleshooting` を使う。意図と decision kind の対応を確認してから叩く。
- 重い判断は**族を変えて 2 人**に独立でかける。1 人の意見で採否を決めるのは、独断を
  「他人の独断」に置き換えただけになる。
- **顧問の指摘も鵜呑みにしない。** 検証可能な主張はコードで確かめる (2026-08-03 は Fable の
  3 主張とも実測で真だったが、確かめるまで前提にしない)。
- 「名前で集合を語らない」: `review_lane` のように**内包だけ知っている集合**に制約を掛ける前に、
  必ず外延を列挙する。事前チェックは確認 (confirm) ではなく反証 (refute) の形で書く。
