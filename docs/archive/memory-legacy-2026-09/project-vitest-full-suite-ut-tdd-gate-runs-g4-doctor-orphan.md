---
memory_id: memory:project:vitest-full-suite-ut-tdd-gate-runs-g4-doctor-orphan
kind: project
title: "vitest full-suite が実 .ut-tdd/gate_runs へ G4 残渣を漏らし doctor orphan を誘発"
tags: ["doctor", "fail-close", "gate-runs", "test-isolation", "vitest"]
updated_at: 2026-07-10T11:17:46.846Z
---

vitest full-suite 実行 (bun run test) が実 repo の `.ut-tdd/gate_runs/` へ G4 gate_run JSON を漏らす (2026-07-10 観測、2 件。checklist_path が `%TEMP%\ut-tdd-checklist-*` を指す = テスト由来と識別可能)。漏れた残渣は doctor の `drive-db-registration (workflow_orphans)` と `gate-run-coverage (orphan_gate_run)` を fail させる。

対処方針:
- 残渣は audit 形をしているため機械/エージェントによる自動削除は不可 (audit 保全)。PO 確認の上で削除するか、テスト側を temp `.ut-tdd` に隔離する恒久修正 (gate run writer に project root 注入) を Recovery/improvement として起票する。
- doctor がこの 2 gate で落ちる場合、まず gate_runs 内の checklist_path が temp を指すか確認し、テスト残渣なら製品退行と誤帰責しない (HEAD 基準検証の原則)。
