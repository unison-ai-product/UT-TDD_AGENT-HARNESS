---
memory_id: memory:project:incident-parallel-node-test-saturation-cross-lane-taskkill
kind: project
title: "Incident: 並列Node検証の資源飽和とcross-lane taskkill"
tags: ["incident", "node", "vitest", "resource-custody", "cross-lane", "windows"]
updated_at: 2026-07-24T13:12:00.000+09:00
---

PR #154 / #155 / #156の原子化検証を並列実行中、複数のNode/Vitest/tscが重なり、
PowerShell、git status、process照会までtimeoutする資源飽和が発生した。

停止指示が届く直前、一つのレーンが残留と判断した`node.exe` 11本をprocess image単位で
終了した。共有PC上では他レーンのNode検証も同じimage名のため、cross-lane実行を
巻き込んだ可能性がある。この時間帯の検証結果は証拠として不採用とし、変更内容だけを
保全した。Bunは起動していない。

再発防止:

- Windows localで重いNode/Vitest/tsc検証を同時に走らせるレーンは1本に制限する。
- `doctor`のsingleton規律と同様、timeout後に形を変えた再試行をしない。
- `taskkill /IM node.exe`等のprocess image一括終了を禁止する。
- 停止が必要な場合は、起動レーンが記録したPID・親子関係・worktreeを照合し、
  所有processだけを終了する。所有を証明できなければ自然終了を待つ。
- cross-lane終了の可能性が生じた検証はGreen/Redを問わず破棄し、資源回復後に
  singletonで再実行する。

本incidentは設計・実装のFAILを示すものではなく、検証証拠のcustody failureである。
したがって変更をrevertせず、証拠だけを無効化して再取得する。
