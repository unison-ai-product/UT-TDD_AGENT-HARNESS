# A-101 — G4 L4 基本設計 freeze (2026-06-05)

> runtime audit 記録 (gitignored)。正本は gate-design.md §2 台帳 (G4 PASS) + 本 doc。

## 判定

**G4 freeze 可 — 4 軸すべて PASS** (intra_runtime_subagent = pmo-sonnet で TL サインオフ代替、claude-only mode)。

## スコープ

- **対象**: L4 core 4 doc (`architecture` / `data` / `function` / `external-if`) ⇔ L9 総合テスト設計。
- **carry (G4 スコープ外)**: 内部資産 L4-10〜13 (roster/skill/drift、ST-ASSET) は placeholder_deps (L6/L7 待ち) で未 freeze。

## G4 audit 4 軸

| 軸 | 判定 | 根拠 |
|---|---|---|
| A1 上流 trace | PASS | function.md §1 FR 26件マップ漏れ0 / FR-L1-46〜49 が C12・drift lint に着地 / ADR-004 accepted |
| A2 DoD | PASS | 4 doc 全§節充足、L5 降下適性あり。carry は各 §carry に明示分離 |
| A3 V-pair 孤児0 | PASS | L4 4 doc ⇔ L9 双方向 pair / L9 §2 量閉じ孤児0 / pair-freeze lint 実 repo 30 pair 孤児0 (doctor) |
| A4 sub-doc 整合 | PASS | Critical 矛盾0。roster/skill non-entity・runtime→roster 一方向 整合。mode taxonomy drift は carry |

## flip (10 ファイル、draft → confirmed)

- 設計: `docs/design/harness/L4-basic-design/{architecture,data,function,external-if}.md`
- テスト設計: `docs/test-design/harness/L9-system-test-design.md` (pair 対称性、骨格 carry 注記は本文保持)
- PLAN: `PLAN-L4-{00-master,01-data,02-architecture,03-function,04-external-if}.md`
- **維持 (未 freeze)**: PLAN-L4-10〜13 (内部資産、ST-ASSET carry)

## P1 carry (G4 non-blocker、freeze 後に解消)

- commander/oclif の ADR 追記 (IMP-070)
- mode taxonomy reconcile: L0 §2.5「9-mode」vs function §3「10-mode」(IMP-069)
- SubDoc enum の src/schema 未実装 (IMP-026、既存)

## Next

- L5 詳細設計 (PLAN-L5-00-master) を Forward で起票 → G5。
- L4-L6 層群の検証サイクル発火は L5/L6 freeze 後 (現状 doctor verification = L4-L6 Forward 進行中)。
