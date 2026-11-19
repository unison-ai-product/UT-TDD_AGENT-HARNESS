---
title: "L7 doctor singleton lock test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/doctor-singleton-lock.md
status: confirmed
updated: 2026-10-29
issue: 1460
---

# doctor singleton lock の回収判定 テスト設計 (issue #1460)

## 1. 位置付け

対になる L6 は `docs/design/harness/L6-function-design/doctor-singleton-lock.md`。U-DOCLOCK-001〜013 の既存契約は §3、#1460 で追加する候補 ID は §2 にある。ID は候補であり、Green の PR で確定する。

既存 U-DOCLOCK-004 (45 分超過なら pid 生存でも回収) は、`proc_start` が無い旧 record と、プローブ失敗時の fallback として残る。`proc_start` が照合できる場合の回収は本書の U-DOCLOCK-014 が上書きする。

## 2. テストケース (候補)

テストは `tests/doctor-singleton-lock-liveness.test.ts`。Red は `it.fails` で置き、Green の PR で `it` に戻す。

| ID | 種別 | 対象 | Oracle |
|---|---|---|---|
| U-DOCLOCK-014 | Red | `isStaleDoctorLock` / `acquireDoctorLock` | 同一 host で pid が生存し、`proc_start` がプローブ結果と許容差以内に一致する lock は、45 分を超えても回収されず、2 本目は holder 付きで blocked になる |
| U-DOCLOCK-015 | 回帰 | `isStaleDoctorLock` | pid が生存していても `proc_start` がプローブ結果と許容差を超えて食い違う (pid 再利用) lock は、TTL 超過後に stale になる。TTL 内はプローブせず保持する |
| U-DOCLOCK-016 | Red | `acquireDoctorLock` | 取得した claim に `deps.ownProcessStart()` の値が `proc_start` として記録される |
| U-DOCLOCK-017 | 回帰 | `isStaleDoctorLock` | `proc_start` が無い旧 record、またはプローブが null を返したとき、45 分超過なら stale (現行の fallback を保つ) |
| U-DOCLOCK-018 | 回帰 | `isStaleDoctorLock` | 新しい record (TTL 内) ではプローブを呼ばず、pid が死んだ record でもプローブを呼ばない |

各 Red の前提 (lock file が実在する、pid が実際に生きている、deps のプローブが差し込まれている、claim を読める) は、同じ準備処理を使う対の通常 `it` (`U-DOCLOCK-014 prerequisite` / `U-DOCLOCK-016 prerequisite`) で確かめる。`it.fails` の本体には oracle だけを置き、準備の失敗が期待失敗として隠れる形にしない (#1452)。

## 3. 多重起動の基本契約

### §1.16.2c U-DOCLOCK (doctor 多重起動 fail-fast、PLAN-L7-442)

> ペア = doctor singleton lock (`src/doctor/singleton-lock.ts`)。owner固有claim集合を用い、release/reclaimで他者generationを触らず、agent 再試行嵐による doctor プロセス滞留 (2026-07-16 メモリ枯渇 incident) の再発を2本目以降の即時 fail-fastで防ぐ。advisory guardでありlock障害ではdoctorを止めない (fail-open)。

| ID | 対象 | Oracle |
|---|---|---|
| U-DOCLOCK-001 | `acquireDoctorLock` | 初回取得が成功し pid/started_at/host/lock_id を owner 固有claimへ記録する |
| U-DOCLOCK-002 | `acquireDoctorLock` / `doctorLockBlockedMessage` | 保持者生存中の 2 本目は acquired=false で保持者情報付きメッセージを返す |
| U-DOCLOCK-003 | `acquireDoctorLock` | 保持 pid 死亡の lock は自動回収して取得する (再試行嵐残骸の除去) |
| U-DOCLOCK-004 | `isStaleDoctorLock` / `acquireDoctorLock` | `proc_start` が無い旧 record では、45 分超過の lock は保持 pid 生存でも stale として回収する (#1460: 照合可能な場合は U-DOCLOCK-014 が上書き) |
| U-DOCLOCK-005 | `acquireDoctorLock` | 破損 lock file は crash せず stale 扱いで回収する |
| U-DOCLOCK-006 | `release` | 取得者自身のowner固有claimだけを削除し、通常経路で冪等に動作する |
| U-DOCLOCK-007 | `isStaleDoctorLock` / `acquireDoctorLock` | 別 host の fresh lock はローカル pid probe を行わず保持し、TTL 超過までは二重取得しない |
| U-DOCLOCK-008 | `acquireDoctorLock` | lock create I/O 障害は `degraded: true` で fail-open し、doctor 本体を遮断しない |
| U-DOCLOCK-009 | CLI `doctor` | 競合する CLI は検証開始前に exit 2、JSON `ok:false` と保持者情報を返す |
| U-DOCLOCK-010 | owner claim `release` | 他者のfresh owner claimが存在しても、自身のclaimだけを削除して他者claimを保持する |
| U-DOCLOCK-011 | owner claim arbitration | contenderは他のfresh claimを観測すると自身だけを取り下げ、既存holderを返してblockする |
| U-DOCLOCK-012 | CLI `review --staged` | 競合時は内部doctor開始前にexit 2、JSON `ok:false` と保持者情報を返す |
| U-DOCLOCK-013 | CLI `review --uncommitted` | 競合時は内部doctor開始前にexit 2、JSON `ok:false` と保持者情報を返す |

保証境界: この test pair は同一 repo の再試行嵐を抑止する advisory guard を検証する。
SMB/NFS/OneDrive をまたぐ strict lease、heartbeat、clock-skew 耐性は主張せず、
`PLAN-REVERSE-442` の設計 back-fill 対象とする。
