---
memory_id: memory:feedback:pr-claude-po-2026-07-10
kind: feedback
title: "本プロジェクトの開発工程では PR マージは Claude が実施する (PO ルール 2026-07-10)"
tags: ["git", "merge", "po-rule", "pr", "workflow"]
updated_at: 2026-07-10T05:50:02.700Z
---

PO 指示 (2026-07-10、PR #38 マージ時): 一般ルールでは自分の PR の self-merge は明示承認が要るが、このプロジェクトの開発工程においては **マージは Claude の担当**。CI (harness-check) green と必要な review evidence を確認した上で、Claude が gh pr merge を実行してよい (毎回の個別マージ承認は不要)。前提は従来どおり: green 鵜呑み禁止 (実結果確認)、他ランタイムの in-flight 作業を巻き込まない、破壊的操作ではない通常マージに限る。
