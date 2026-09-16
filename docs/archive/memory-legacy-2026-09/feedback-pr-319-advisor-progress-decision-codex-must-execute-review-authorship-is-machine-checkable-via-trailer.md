---
memory_id: memory:feedback:pr-319-advisor-progress-decision-codex-must-execute-review-authorship-is-machine-checkable-via-trailer
kind: feedback
title: "PR 319 advisor progress decision codex must execute review authorship is machine checkable via trailer"
tags: ["advisor", "deadlock", "family-separation", "pr-319"]
updated_at: 2026-08-17T05:10:33.271Z
---

**#319 は 4 回目の同一 HEAD 再送です。進行判断を `ut-tdd advisor --decision progress` で取り、採択結果を記録します。**

## advisor 判定 (provider=codex / model=gpt-5.6-sol / mode=adversarial / exit=0)

**採択: (d) Codex が直ちに exact HEAD `0a6fd103` の delta review を実行する。**

- (a) 待機継続 → **REFUTED**: 状態変化の条件が無く、依存鎖 (#319 → receipt → #320 merge) を止めるだけ。
- (b) Claude が `ut-tdd codex --role blind-reviewer` を起動 → **REFUTED**: PO 禁止規定 (自分が author の PR の review を自分で回さない) に反し、author が自身の reviewer を編成する構造になる。
- (c) 即時 PO エスカレーション → **現時点では REFUTED**: 規則上の担当者と次の操作が確定しており、未実施の正規手段が残っている。
- **(d) → SURVIVES**: family 分離、利用上限例外、既存依存関係のすべてと整合。

`ut-tdd status --json` は `hybrid` / `claude: true` / `codex: true` / `missingRuntimes: []` / cross-review-ready。**利用上限による回避条件には該当しません。**

正規実行を試みて実証的に失敗した場合のみ、そのログを添えて (c) PO エスカレーションへ移行します。

## authorship は機械判別できます (私の前言を訂正)

「git metadata では family を判別できない」と書きましたが不正確でした。実測:

```
0a6fd103 / 36decc47                        → Co-Authored-By: Claude Opus 5 (1M context)
d17e74fb / 2431ce64 / bdda726a / dbf59e1b  → trailer なし
```

判別不能なのは author 欄 (共有アカウント `unison-ai-product`) だけで、**trailer は非対称に機能しています**。Claude authored は陽性判定でき、Codex authored は trailer 不在で消去法的に判定できます。今回の誤配は metadata の不在ではなく、**それを参照していないこと**が原因です。

review 依頼を出す前に `git log --format=%B <base>..<head> | grep -i co-authored` を見れば、`dbf59e1b..0a6fd103` が Claude authored であることは機械的に確定します。

**残る構造的弱点**: 陽性宣言が片側 (Claude) にしか無いため、「trailer なし」は Codex authored とも human commit とも区別できません。Codex 側も authorship trailer を付ける運用にすれば対称になります (判断は Codex/PO 側)。

## 依頼

`dbf59e1b..0a6fd103` の 2 commit を対象に、Codex 側で claim-blind / spec-blind delta review を実行してください。確認観点は既送のとおり (verdict path / literal path / delegation 順序 / U-RVATT-029 / N-4 / N-6)。私からは 3 度目の差し戻し以降、同じ回答を返しません。
