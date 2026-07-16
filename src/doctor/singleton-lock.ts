import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, join } from "node:path";

/**
 * doctor 多重起動ガード (PLAN-L7-442)。
 *
 * 2026-07-16 に同一 repo で doctor が 16 本並列滞留し、メモリ枯渇 (16GB 中残 31MB) で
 * 全プロセスがスラッシングする実害が出た (agent の再試行嵐 × doctor の長い実行時間)。
 * doctor は read-only 検査なので同時に複数走らせる価値がなく、2 本目以降は即座に
 * fail-fast させて再試行嵐がプロセスを積み上げられない構造にする。
 *
 * 位置づけ: これは資源保護の advisory guard であって安全ゲートではない。lock I/O
 * 自体の失敗で doctor を止めない (fail-open) — doctor 本体の検査こそが安全側の関心で、
 * lock 障害を理由に検査を殺すほうが有害。stale lock (保持プロセス死亡 / 期限超過) は
 * 自動回収する。
 */

export interface DoctorLockRecord {
  pid: number;
  started_at: string;
  host: string;
}

export type DoctorLockAcquisition =
  | { acquired: true; release: () => void }
  | { acquired: false; holder: DoctorLockRecord }
  // lock I/O が壊れている場合は fail-open (doctor 検査を優先)
  | { acquired: true; release: () => void; degraded: true };

export interface DoctorLockDeps {
  now: () => number;
  isPidAlive: (pid: number) => boolean;
}

/** 実行上限の想定。これを超えた lock はハング残骸とみなして回収する。 */
export const DOCTOR_LOCK_STALE_MS = 45 * 60 * 1000;

export function doctorLockPath(repoRoot: string): string {
  return join(repoRoot, ".ut-tdd", "state", "doctor.lock");
}

export function defaultDoctorLockDeps(): DoctorLockDeps {
  return {
    now: () => Date.now(),
    isPidAlive: (pid: number) => {
      try {
        process.kill(pid, 0);
        return true;
      } catch (error) {
        // EPERM = 存在するが触れない (生存)。ESRCH 等 = 不在。
        return (error as NodeJS.ErrnoException).code === "EPERM";
      }
    },
  };
}

export function isStaleDoctorLock(record: DoctorLockRecord, deps: DoctorLockDeps): boolean {
  const startedAt = Date.parse(record.started_at);
  if (Number.isFinite(startedAt) && deps.now() - startedAt > DOCTOR_LOCK_STALE_MS) return true;
  if (!Number.isInteger(record.pid) || record.pid <= 0) return true;
  return !deps.isPidAlive(record.pid);
}

function readLockRecord(path: string): DoctorLockRecord | null {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<DoctorLockRecord>;
    if (typeof parsed.pid !== "number" || typeof parsed.started_at !== "string") return null;
    return { pid: parsed.pid, started_at: parsed.started_at, host: String(parsed.host ?? "") };
  } catch {
    return null; // 読めない/壊れた lock は stale 扱いで回収する
  }
}

export function acquireDoctorLock(
  repoRoot: string,
  pid: number = process.pid,
  deps: DoctorLockDeps = defaultDoctorLockDeps(),
): DoctorLockAcquisition {
  const path = doctorLockPath(repoRoot);
  const record: DoctorLockRecord = {
    pid,
    started_at: new Date(deps.now()).toISOString(),
    host: hostname(),
  };
  const release = () => {
    try {
      const current = readLockRecord(path);
      if (current?.pid === pid) rmSync(path, { force: true });
    } catch {
      // release 失敗は stale 回収に任せる
    }
  };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, `${JSON.stringify(record)}\n`, { flag: "wx" });
      return { acquired: true, release };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        // lock 基盤の障害で doctor を殺さない (advisory guard、fail-open)
        return { acquired: true, release: () => {}, degraded: true };
      }
      const holder = readLockRecord(path);
      if (holder && !isStaleDoctorLock(holder, deps)) {
        return { acquired: false, holder };
      }
      try {
        rmSync(path, { force: true }); // stale/破損 lock を回収して再取得
      } catch {
        return { acquired: true, release: () => {}, degraded: true };
      }
    }
  }
  return { acquired: true, release: () => {}, degraded: true };
}

export function doctorLockBlockedMessage(holder: DoctorLockRecord): string {
  return (
    `doctor: already running (pid=${holder.pid}, host=${holder.host}, started_at=${holder.started_at}) — ` +
    `多重起動を fail-fast する (PLAN-L7-442、再試行嵐によるプロセス滞留防止)。` +
    `実行中の doctor の完了を待つこと。プロセスが死んでいる場合や ${Math.round(DOCTOR_LOCK_STALE_MS / 60000)} 分超過の lock は次回起動時に自動回収される。`
  );
}
