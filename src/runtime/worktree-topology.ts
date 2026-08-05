/**
 * worktree-topology — worktree 配置の健全性・寿命を機械判定する純粋 analyzer (issue #232)。
 *
 * `git worktree list` への登録本数 (118 本、うち推定 68 本が終了済み) に対し `doctor`/`lint`
 * 側の検査が 0 件だった。配置移設 (#141 / PLAN-L4-34) の acceptance oracle にも使う値
 * (`healthy` = 移設前後の比較値) をここで確定させる。
 *
 * review-dispatch (`src/feedback/review-dispatch.ts`) の house style に倣い、この module は
 * I/O を一切行わない: 呼び出し側 (`worktree-topology-collect.ts`) が収集した facts を渡す。
 * 決定論を厳守する — 同一入力は入力順に依存せず同一出力になる (findings / retirable は
 * (kind, path) / path 昇順で安定ソート)。
 */

export interface WorktreeFact {
  /** 登録された worktree path (正規化済み)。 */
  path: string;
  isMain: boolean;
  dirExists: boolean;
  /** worktree/.git の `gitdir:` 行が指す先 (main は undefined)。 */
  gitdirPointer?: string;
  gitdirPointerExists: boolean;
  /** `.git/worktrees/<id>/gitdir` の中身 (worktree の `.git` を指すべき)。 */
  adminBackPointer?: string;
  /** detached なら undefined。 */
  branch?: string;
  dirty: boolean;
  /** branch が origin/main の祖先か。 */
  mergedIntoMain: boolean;
}

export interface WorktreeAdminEntry {
  id: string;
  registered: boolean;
}

export type WorktreeFindingKind = "link_broken" | "dir_missing" | "orphan_admin";

export interface WorktreeFinding {
  kind: WorktreeFindingKind;
  /** link_broken / dir_missing は worktree path、orphan_admin は admin entry id。 */
  path: string;
}

export type WorktreeLiveness = "dirty" | "detached" | "merged" | "active";

export interface WorktreeTopologyCounts {
  total: number;
  main: number;
  dirty: number;
  detached: number;
  merged: number;
  active: number;
}

export interface WorktreeTopologyReport {
  ok: boolean;
  findings: WorktreeFinding[];
  counts: WorktreeTopologyCounts;
  /** merged + detached の path。retire 候補 (昇順)。 */
  retirable: string[];
  /** findings に現れない worktree 数 (移設前後の比較値)。 */
  healthy: number;
}

export interface WorktreeTopologyInput {
  facts: WorktreeFact[];
  adminEntries: WorktreeAdminEntry[];
}

function normalizeForCompare(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/+$/, "");
}

function backPointerMatchesWorktree(adminBackPointer: string, worktreePath: string): boolean {
  return normalizeForCompare(adminBackPointer) === `${normalizeForCompare(worktreePath)}/.git`;
}

function classifyLiveness(fact: WorktreeFact): WorktreeLiveness {
  if (fact.dirty) return "dirty";
  if (fact.branch == null) return "detached";
  if (fact.mergedIntoMain) return "merged";
  return "active";
}

function compareFindings(left: WorktreeFinding, right: WorktreeFinding): number {
  return left.kind < right.kind
    ? -1
    : left.kind > right.kind
      ? 1
      : left.path < right.path
        ? -1
        : left.path > right.path
          ? 1
          : 0;
}

function findingKey(finding: WorktreeFinding): string {
  return `${finding.kind} ${finding.path}`;
}

export function analyzeWorktreeTopology(input: WorktreeTopologyInput): WorktreeTopologyReport {
  const findings = new Map<string, WorktreeFinding>();
  const addFinding = (kind: WorktreeFindingKind, path: string): void => {
    const finding: WorktreeFinding = { kind, path };
    findings.set(findingKey(finding), finding);
  };

  for (const fact of input.facts) {
    if (!fact.isMain && !fact.gitdirPointerExists) {
      addFinding("link_broken", fact.path);
    }
    if (
      fact.adminBackPointer !== undefined &&
      !backPointerMatchesWorktree(fact.adminBackPointer, fact.path)
    ) {
      addFinding("link_broken", fact.path);
    }
    if (!fact.dirExists) {
      addFinding("dir_missing", fact.path);
    }
  }
  for (const entry of input.adminEntries) {
    if (!entry.registered) {
      addFinding("orphan_admin", entry.id);
    }
  }

  const findingList = [...findings.values()].sort(compareFindings);
  const findingPaths = new Set(
    findingList
      .filter((finding) => finding.kind === "link_broken" || finding.kind === "dir_missing")
      .map((finding) => finding.path),
  );

  const counts: WorktreeTopologyCounts = {
    total: input.facts.length,
    main: 0,
    dirty: 0,
    detached: 0,
    merged: 0,
    active: 0,
  };
  const retirable: string[] = [];

  for (const fact of input.facts) {
    if (fact.isMain) {
      counts.main += 1;
      continue;
    }
    const liveness = classifyLiveness(fact);
    counts[liveness] += 1;
    // finding のある worktree は観測値自体が信用できない (link が切れていれば
    // `git status` も `merge-base` も実行できず、collector は dirty=false /
    // mergedIntoMain=false へ倒す)。それを retirable に混ぜると、未コミット作業を
    // 抱えた worktree を「廃棄可能」と誤って提示する。分類は可視化のため残し、
    // retirable からだけ落とす (fail-safe 側)。
    if (findingPaths.has(fact.path)) continue;
    if (liveness === "merged" || liveness === "detached") {
      retirable.push(fact.path);
    }
  }
  retirable.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));

  const healthy = input.facts.filter((fact) => !findingPaths.has(fact.path)).length;

  return {
    ok: findingList.length === 0,
    findings: findingList,
    counts,
    retirable,
    healthy,
  };
}
