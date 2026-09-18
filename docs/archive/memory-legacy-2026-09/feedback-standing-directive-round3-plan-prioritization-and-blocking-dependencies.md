---
memory_id: memory:feedback:standing-directive-round3-plan-prioritization-and-blocking-dependencies
kind: feedback
title: "Standing directive: round3 PLAN prioritization and blocking dependencies"
tags: ["codex", "directive", "engine-swap", "gap-audit", "plan-l4-16", "plan-l4-20", "plan-l6-59", "plan-l6-62", "plan-reverse-395"]
updated_at: 2026-07-08T10:55:47.100Z
---

PO指示に対するCodex TL判断 (2026-07-08): ZIP再監査round3の12本 (PLAN-L4-20/21, L5-14, L6-59..66, REVERSE-395) の次工程優先順位。

現状態確認:
- `bun run src\cli.ts status --json`: mode=hybrid、nextAction=cross-review-ready。
- `bun run src\cli.ts plan lint`: OK。
- `bun run src\cli.ts doctor`: 現HEADでは exit 1。原因は `plan-governance requires_not_ready=4` のみで、今回の未解凍依存に一致する: L6-59→L4-20(draft)、L6-61→L6-60(draft)、L6-62→L4-16(draft)、L6-64→REVERSE-395(draft)。その他主要 gate は OK。

依存関係の整理:
1. PLAN-L4-20 は依存なしで着手可能。PLAN-L6-59 が `requires` で待っており、doc catalog / scale profile SSoT が確定しない限り設計doc横断整合性チェックは freeze できない。最初の blocking upstream。
2. PLAN-L6-60 は依存なしで着手可能 (親の PLAN-L6-43 は confirmed)。PLAN-L6-61 が `requires` で待っている。ID粒度 traversal を先に固定し、RAG台帳はその出力を再利用する順序が正しい。
3. PLAN-L4-16 は 2026-07-02 created/updated のまま draft。PLAN-L6-62 が `requires` で待つため、security/secret-scan レーンのボトルネック。全12本を止める単一ボトルネックではないが、doctor赤の1/4であり、放置するとL6-62が継続停止する。TL/PO判断を早期に解凍すること。
4. PLAN-REVERSE-395 は依存なしで着手可能。PLAN-L6-64 が `requires` で待つ。これはpair-freezeではなくReverse R0→R4を先に進め、CLI as-is設計の合流先を決めてからL6-64をfreezeする。
5. PLAN-L4-21、PLAN-L5-14、PLAN-L6-63、PLAN-L6-65、PLAN-L6-66 は今回12本内の明示ブロッカーではない。L5-14の `requires` である PLAN-L7-256 は confirmed なので実質 ready。

TL優先順位:
- P0: PLAN-L4-20 を最初に pair-freeze/design freeze へ進める。理由: L6-59 の直接ブロッカーであり、カタログSSoTは後続のdoc横断検査の入力契約になる。
- P0 parallel: PLAN-REVERSE-395 のR0/R1棚卸しを開始し、R4合流判断まで進める。理由: L6-64はCLI as-is復元なしに設計すると実装済みコマンド体系とズレる。
- P0 parallel / human gate: PLAN-L4-16 のTL/PO判断を解凍する。採択なら security slot を確定、不採択なら L6-62 の fallback 親設計を明示する。理由: L6-62は資格情報/secret-scanで安全境界を含むため、親設計なしにfreezeしない。
- P1: PLAN-L6-60 を pair-freeze へ進める。理由: L6-61を解除し、ID粒度trace traversalを先に契約化する。
- P2: L6-59 (L4-20後)、L6-61 (L6-60後)、L6-62 (L4-16後)、L6-64 (REVERSE-395 R4後) を順にfreeze。
- P3: PLAN-L4-21、PLAN-L5-14、PLAN-L6-63、PLAN-L6-65、PLAN-L6-66 はブロッカー解消後または別laneで扱う。L6-65はhook parity/security-adjacentで価値が高いため、実装lane空きがあればP2寄りに前倒し可。

次に進めるべきPLAN:
- 直近のpair-freeze候補は PLAN-L4-20。
- 同時に進める判断系タスクは PLAN-L4-16 のPO/TL解凍と PLAN-REVERSE-395 のReverse開始。
- PLAN-L6-62はL4-16がconfirmedまたは明示fallback確定するまでfreeze不可。
