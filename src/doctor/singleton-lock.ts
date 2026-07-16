import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
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
  lock_id?: string;
}

export type DoctorLockAcquisition =
  | { acquired: true; release: () => void }
  | { acquired: false; holder: DoctorLockRecord }
  // lock I/O が壊れている場合は fail-open (doctor 検査を優先)
  | { acquired: true; release: () => void; degraded: true };

export interface DoctorLockDeps {
  now: () => number;
  hostName?: () => string;
  isPidAlive: (pid: number) => boolean;
  io?: DoctorLockIo;
}

export interface DoctorLockIo {
  mkdirRecursive: (path: string) => void;
  createExclusive: (path: string, content: string) => void;
  readText: (path: string) => string;
  rename: (from: string, to: string) => void;
  remove: (path: string) => void;
}

/** 実行上限の想定。これを超えた lock はハング残骸とみなして回収する。 */
export const DOCTOR_LOCK_STALE_MS = 45 * 60 * 1000;

export function doctorLockPath(repoRoot: string): string {
  return join(repoRoot, ".ut-tdd", "state", "doctor.lock");
}

export function defaultDoctorLockDeps(): DoctorLockDeps {
  return {
    now: () => Date.now(),
    hostName: hostname,
    isPidAlive: (pid: number) => {
      try {
        process.kill(pid, 0);
        return true;
      } catch (error) {
        // EPERM = 存在するが触れない (生存)。ESRCH 等 = 不在。
        return (error as NodeJS.ErrnoException).code === "EPERM";
      }
    },
    io: defaultDoctorLockIo(),
  };
}

export function defaultDoctorLockIo(): DoctorLockIo {
  return {
    mkdirRecursive: (path) => mkdirSync(path, { recursive: true }),
    createExclusive: (path, content) => writeFileSync(path, content, { flag: "wx" }),
    readText: (path) => readFileSync(path, "utf8"),
    rename: (from, to) => renameSync(from, to),
    remove: (path) => rmSync(path, { force: true }),
  };
}

export function isStaleDoctorLock(record: DoctorLockRecord, deps: DoctorLockDeps): boolean {
  const startedAt = Date.parse(record.started_at);
  if (Number.isFinite(startedAt) && deps.now() - startedAt > DOCTOR_LOCK_STALE_MS) return true;
  if (!Number.isInteger(record.pid) || record.pid <= 0) return true;
  // 他ホストの pid はローカルOSでは意味を持たない。共有workspaceで別ホストの
  // fresh lock をローカル pid 不在として回収すると二重doctorになるため、PID probe
  // は同一hostだけに限定する。別hostは TTL が切れた場合だけ回収する。
  return record.host === (deps.hostName ?? hostname)() && !deps.isPidAlive(record.pid);
}

function readLockRecord(path: string, deps: DoctorLockDeps): DoctorLockRecord | null {
  try {
    const parsed = JSON.parse(
      (deps.io ?? defaultDoctorLockIo()).readText(path),
    ) as Partial<DoctorLockRecord>;
    if (
      typeof parsed.pid !== "number" ||
      typeof parsed.started_at !== "string" ||
      typeof parsed.host !== "string" ||
      typeof parsed.lock_id !== "string"
    )
      return null;
    return {
      pid: parsed.pid,
      started_at: parsed.started_at,
      host: parsed.host,
      lock_id: parsed.lock_id,
    };
  } catch {
    return null; // 読めない/壊れた lock は stale 扱いで回収する
  }
}

function sameLockGeneration(a: DoctorLockRecord | null, b: DoctorLockRecord | null): boolean {
  if (!a || !b) return a === b;
  return a.pid === b.pid && a.started_at === b.started_at && a.host === b.host && a.lock_id === b.lock_id;
}

type DoctorLockClaim =
  | { status: "claimed" }
  | { status: "changed"; holder: DoctorLockRecord | null }
  | { status: "retry" };

/**
 * canonical path の read→rename を CAS とみなさないための generation claim。
 * rename 後の quarantine を再読し、観測した generation と一致した場合だけ削除する。
 * 差し替わっていた場合は canonical へ exclusive create で復元し、他者 lock を失わせない。
 */
function claimObservedLock(
  path: string,
  observed: DoctorLockRecord | null,
  purpose: "release" | "reclaim",
  deps: DoctorLockDeps,
): DoctorLockClaim {
  const io = deps.io ?? defaultDoctorLockIo();
  const quarantine = `${path}.${purpose}.${observed?.lock_id ?? randomUUID()}.${randomUUID()}`;
  try {
    io.rename(path, quarantine);
  } catch {
    return { status: "retry" };
  }

  let displacedRaw: string;
  let displaced: DoctorLockRecord | null;
  try {
    displacedRaw = io.readText(quarantine);
    displaced = readLockRecord(quarantine, deps);
  } catch {
    return { status: "retry" };
  }
  if (sameLockGeneration(displaced, observed)) {
    try {
      io.remove(quarantine);
    } catch {
      // canonical ownership has already moved; quarantine cleanup can be retried later.
    }
    return { status: "claimed" };
  }

  // 観測後に fresh generation へ差し替わった。rename-back は POSIX で既存
  // canonical を上書きし得るため禁止し、exclusive create でだけ復元する。
  try {
    io.createExclusive(path, displacedRaw);
    io.remove(quarantine);
  } catch {
    // 別 contender が canonical を作った場合はそれを上書きせず quarantine を保全する。
  }
  return { status: "changed", holder: displaced };
}

export function acquireDoctorLock(
  repoRoot: string,
  pid: number = process.pid,
  deps: DoctorLockDeps = defaultDoctorLockDeps(),
): DoctorLockAcquisition {
  const path = doctorLockPath(repoRoot);
  const io = deps.io ?? defaultDoctorLockIo();
  const localHost = (deps.hostName ?? hostname)();
  const record: DoctorLockRecord = {
    pid,
    started_at: new Date(deps.now()).toISOString(),
    host: localHost,
    lock_id: randomUUID(),
  };
  const release = () => {
    try {
      const current = readLockRecord(path, deps);
      if (
        current?.pid === record.pid &&
        current.host === record.host &&
        current.started_at === record.started_at &&
        current.lock_id === record.lock_id
      ) {
        claimObservedLock(path, record, "release", deps);
      }
    } catch {
      // release 失敗は stale 回収に任せる
    }
  };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      io.mkdirRecursive(dirname(path));
      io.createExclusive(path, `${JSON.stringify(record)}\n`);
      return { acquired: true, release };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        // lock 基盤の障害で doctor を殺さない (advisory guard、fail-open)
        return { acquired: true, release: () => {}, degraded: true };
      }
      const holder = readLockRecord(path, deps);
      if (holder && !isStaleDoctorLock(holder, deps)) {
        return { acquired: false, holder };
      }
      const claim = claimObservedLock(path, holder, "reclaim", deps);
      if (claim.status === "changed" && claim.holder) {
        return { acquired: false, holder: claim.holder };
      }
      if (claim.status === "retry") {
        // rename の競合敗北は I/O 障害とは限らない。fresh winner を再観測して
        // block するか、canonical が空なら次 attempt の wx create へ進む。
        const winner = readLockRecord(path, deps);
        if (winner && !isStaleDoctorLock(winner, deps)) {
          return { acquired: false, holder: winner };
        }
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
