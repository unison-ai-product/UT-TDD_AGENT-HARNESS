---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_doctor_singleton_lock
pair_artifact: docs/test-design/harness/L7-doctor-singleton-lock-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1460
---

> **L6 contract marker**: `isStaleDoctorLock(record, deps) => boolean` の判定順序と、lock record の `proc_start` field を定める。実装 (Green) は本書と L7 の Red を凍結した後に別 PR で入れる。

# doctor singleton lock の回収判定 — 関数設計 (issue #1460)

## 1. 目的

`src/doctor/singleton-lock.ts` の `isStaleDoctorLock` は、pid の生存を見る前に開始からの経過が `DOCTOR_LOCK_STALE_MS` (45 分) を超えたかを判定し、超えていれば stale として回収する。このため、45 分を超えて動き続ける正規の doctor がいても 2 本目が起動でき、重い負荷のときほど二重起動で負荷が増える (2026-10-29、85 分たっても終わらなかった実例: #1459)。

TTL を残している理由は、pid の再利用 (同じ pid の別プロセス) で lock が永久に残るのを防ぐためである。本設計は、pid が生きているだけでなく「同じプロセスである」ことを確かめる材料を lock に持たせ、同じプロセスなら経過時間にかかわらず回収しない方式を定める。

## 2. 方式 (advisor 相談の結果を repo 実測で確かめて採択)

採択: **案 A = lock に プロセスの開始時刻 `proc_start` (ISO 8601) を記録し、回収判定で照合する**。

| 案 | 内容 | 採否 | 理由 |
|---|---|---|---|
| A | `proc_start` を記録して照合 | 採択 | 同一プロセスの長時間実行を TTL と独立に守り、pid 再利用も見分けられる |
| B | holder が mtime を定期更新 (heartbeat) | 不採択 | doctor は長い同期処理でイベントループを塞ぐ。更新が止まった生存プロセスを誤って回収する |
| C | 判定順序の入れ替えのみ (pid 生存なら常に保持) | 不採択 | pid が再利用されると lock が永久に残る |

実測 (2026-10-29、Windows 11):

- Windows の `powershell.exe -NoProfile -Command (Get-Process -Id N).StartTime` は動作するが、1 回に約 4〜4.5 秒かかった。`wmic` は Windows 11 24H2 以降で廃止されているため使わない。`tasklist` は開始時刻を返さない。
- holder 自身の開始時刻は、プローブを起動せず `Date.now() - process.uptime() * 1000` で得られる。上の `StartTime` との差は約 0.5 秒だった。両者の比較には許容差 (`PROC_START_TOLERANCE_MS` = 5000) を置く。
- Linux は `/proc/<pid>/stat`、macOS は `ps -o lstart= -p <pid>` で得る (本 PR では実測していない。Green で確かめる)。

## 3. 回収判定の順序 (`isStaleDoctorLock`)

1. `pid` が正の整数でなければ stale。
2. 別 host の record は pid probe をせず、TTL だけで判定する (現行どおり)。
3. 同一 host で pid が死んでいれば、経過時間にかかわらず stale。
4. 同一 host で pid が生きている場合:
   - record に `proc_start` があり、`deps.processStartTime(pid)` が値を返すなら、両者の差が許容差以内なら **経過時間にかかわらず保持**、許容差を超えたら pid 再利用とみなして stale。
   - `proc_start` が無い (旧 record)、またはプローブが失敗して null を返すなら、現行どおり TTL で判定する (fail-open の限定的な帰結: プローブ失敗時は、生きている doctor でも TTL 超過で回収されうる)。

プローブ (`deps.processStartTime`) は、手順 4 の「pid が生きている」場合にだけ、かつ TTL を超えている record に限って呼ぶ。新しい record では呼ばない。Windows で 1 回 4 秒かかるため、通常の起動経路に載せない。

## 4. 記録 (`acquireDoctorLock`)

取得時に作る claim record へ `proc_start` を追加する。値は `deps.ownProcessStart()` (既定は `process.uptime()` から求めた自プロセスの開始時刻) の結果とし、null のときは field を書かない (読み出し側は旧 record として扱う)。`readLockRecord` は `proc_start` が文字列のときだけ保持し、それ以外は無視する。

## 5. 不変条件

- lock は advisory guard のままで、`proc_start` の取得・照合の失敗で doctor を止めない (fail-open)。
- 回収を決めるのは「死んでいる」または「別プロセスと確かめられた」ときだけで、取得不能は死亡・不一致として扱わない。
- 外部コマンドのプローブには timeout を置く (Windows の既定は 10 秒)。

## 6. 範囲外

- worktree をまたぐ PC 全体の同時実行数の制限は #1459 の別論点であり、本設計では扱わない。
