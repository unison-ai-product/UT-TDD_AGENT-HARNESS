---
title: "L7 doctor singleton lock test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/doctor-singleton-lock.md
status: draft
updated: 2026-10-29
issue: 1460
---

# doctor singleton lock の回収判定 テスト設計 (issue #1460)

## 1. 位置付け

対になる L6 は `docs/design/harness/L6-function-design/doctor-singleton-lock.md`。既存の U-DOCLOCK-001〜013 は `docs/test-design/harness/L7-unit-test-design.md` §1.16.2c にある。本書は #1460 で追加する候補 ID を持つ。ID は候補であり、Green の PR で確定する。

既存 U-DOCLOCK-004 (45 分超過なら pid 生存でも回収) は、`proc_start` が無い旧 record と、プローブ失敗時の fallback として残る。`proc_start` が照合できる場合の回収は本書の U-DOCLOCK-014 が上書きする。

## 2. テストケース (候補)

テストは `tests/doctor-singleton-lock-liveness.test.ts`。Red は `it.fails` で置き、Green の PR で `it` に戻す。

| ID | 種別 | 対象 | Oracle |
|---|---|---|---|
| U-DOCLOCK-014 | Red | `isStaleDoctorLock` / `acquireDoctorLock` | 同一 host で pid が生存し、`proc_start` がプローブ結果と許容差以内に一致する lock は、45 分を超えても回収されず、2 本目は holder 付きで blocked になる |
| U-DOCLOCK-015 | Red | `isStaleDoctorLock` | pid が生存していても `proc_start` がプローブ結果と許容差を超えて食い違う (pid 再利用) lock は、経過が新しくても stale になる |
| U-DOCLOCK-016 | Red | `acquireDoctorLock` | 取得した claim に `deps.ownProcessStart()` の値が `proc_start` として記録される |
| U-DOCLOCK-017 | 回帰 | `isStaleDoctorLock` | `proc_start` が無い旧 record、またはプローブが null を返したとき、45 分超過なら stale (現行の fallback を保つ) |
| U-DOCLOCK-018 | 回帰 | `isStaleDoctorLock` | 新しい record (TTL 内) ではプローブを呼ばず、pid が死んだ record でもプローブを呼ばない |

各 Red は前提を assertion で確かめる (lock file が実在する、pid が実際に生きている、deps のプローブが差し込まれている)。前提が欠けたまま `it.fails` が通る形にしない (#1452)。
