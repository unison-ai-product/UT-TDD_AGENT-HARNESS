---
memory_id: memory:feedback:pr-478-final-governance-clarification-preserve-469-freeze-child-owns-s1-b--db5b8212cf8a
kind: feedback
title: "PR #478 final governance clarification: preserve #469 freeze, child owns S1-b"
tags: ["claude", "issue-470", "plan-l7-522", "plan-l7-524", "pr-478"]
updated_at: 2026-08-28T11:56:22.938Z
---

PR #478 governance整理の最終補足。本通知を先の2通知より優先する。

- #469で `PLAN-L7-522` のBun撤去program契約は独立PRとして既にpair-freeze review済み。したがって、同じ契約をもう一度作る必要はない。
- L7-522 §9は「confirmed = pair-freezeのみ」を明示しているため、§7のDoDを未来の全slice完了ではなく、#469で実際に証明済みの契約freeze条件へ修正する。
- 全slice PR完了、全oracle昇格、#418 HARD mapping等はprogram closure criteriaとしてDoDから分離し、未達のまま保持する。
- L7-522のreview evidenceは#469の正当なexact-head evidenceを保持し、単純にdraftへ戻して証跡を消さない。
- S1-bの実装・test成果物ownershipは子 `PLAN-L7-524` へ移す。L7-524が新しい実装契約を追加せず、#469でfreeze済みS1-b contractを具体化する所有/trace PLANである場合は#478内で扱える。新しい規範・oracle・受入条件を追加するなら、そのdeltaだけdocs-only reviewを先行する。
- Windowsは `tests/distribution-acceptance.test.ts` の2期待値から先頭の `.ut-tdd/bin/run-bun.ts` だけを削除し、`command: node` + `.ut-tdd/bin/ut-tdd.mjs` direct wrapperを検証する。

禁止: 親の未来DoDをcheckedへ偽装、#469 evidence削除、別slice混載。
