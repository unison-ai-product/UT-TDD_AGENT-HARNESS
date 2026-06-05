/**
 * vmodel pair-freeze lint — 設計層 pair freeze 検証 (IMP-067、PLAN-L6-10 / L7-11)。
 *
 * design doc (① 設計) ⇔ test-design doc (③ テスト設計) の pair_artifact 双方向整合・孤児0 を検査する。
 * function-spec §4 の rule 1 pair-exists / rule 2 ref-resolves / rule 3 trace-bidir の最小インスタンス化で、
 * G1-G6 各層の pair freeze を機械担保する (requirements §6.8.3 = 設計 PLAN 完了 PR の vmodel-lint 必須に接続)。
 *
 * スコープ外: G7 の 4 artifact 12 directed edge trace (function-spec §2.3 traceCheck / requirements §2.4)。
 * 本 lint は設計層の ①⇔③ pair のみを見る (L7 trace freeze は別マイルストーン)。
 *
 * 純関数 (analyzePairFreeze) + I/O loader (loadPairDocs) を分離 (backfill-pairing と同方針)。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { LintResult } from "../plan/lint";

export interface PairDoc {
  /** repo 相対 path (forward slash 正規化)。 */
  path: string;
  layer: string | null;
  /** pair_artifact 値 (inline コメント除去済)。null = フィールド欠落。 */
  pairArtifact: string | null;
  /** frontmatter status (confirmed/draft/placeholder 等)。null = 欠落。検証発火の freeze 判定に使う。 */
  status: string | null;
}

export type PairOrphanReason = "pair-missing" | "ref-unresolved" | "trace-orphan";

export interface PairOrphan {
  path: string;
  reason: PairOrphanReason;
  detail: string;
}

export interface PairFreezeResult {
  orphans: PairOrphan[];
  /** 双方向成立した pair 数 (self-pair / L2 group 含む)。 */
  pairs: number;
  ok: boolean;
}

/** 検査対象外の index/living doc (basename 固定リスト、vmodel-pair-freeze.md §3)。 */
const EXCLUDED_BASENAMES = new Set(["README.md", "roadmap.md"]);

const fmValue = (content: string, key: string): string | undefined =>
  content.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim();

/** frontmatter 値の inline コメント (`  # ...`) を除去 (`self  # wireframe...` → `self`)。 */
export function stripInlineComment(value: string): string {
  return value.replace(/\s+#.*$/, "").trim();
}

const toPosix = (p: string): string => p.split(sep).join("/");
const basename = (p: string): string => p.split("/").pop() ?? p;
/** 末尾 "/" 込みの親 dir。 */
const dirOf = (p: string): string => p.slice(0, p.lastIndexOf("/") + 1);

/**
 * docs/design/harness/L<N>-*​/<file>.md (N=1-6) の sub-doc 層を path から判定。
 * frontmatter `layer` 欠落でも対象に入れる (layer/pair を持たない L6 doc が検査を素通りする穴を塞ぐ、IMP-067)。
 */
export function designLayerFromPath(path: string): string | null {
  return path.match(/^docs\/design\/harness\/(L[1-6])-[^/]+\/[^/]+\.md$/)?.[1] ?? null;
}

/** 検査対象の設計 sub-doc か (L1-L6 サブディレクトリ配下、README/roadmap は除外)。 */
export function isDesignSubDoc(d: PairDoc): boolean {
  if (EXCLUDED_BASENAMES.has(basename(d.path))) return false;
  return designLayerFromPath(d.path) != null;
}

export function parsePairDoc(path: string, content: string): PairDoc {
  const raw = fmValue(content, "pair_artifact");
  return {
    path: toPosix(path),
    layer: fmValue(content, "layer") ?? null,
    pairArtifact: raw != null ? stripInlineComment(raw) : null,
    status: fmValue(content, "status") ?? null,
  };
}

/**
 * 設計層 pair freeze を分析 (純関数、I/O なし)。
 * @param docs design + test-design の全 PairDoc
 */
export function analyzePairFreeze(docs: PairDoc[]): PairFreezeResult {
  const byPath = new Map(docs.map((d) => [d.path, d]));
  const orphans: PairOrphan[] = [];
  let pairs = 0;

  for (const d of docs) {
    if (!isDesignSubDoc(d)) continue;
    const pa = d.pairArtifact;
    // rule 1 pair-exists (frontmatter layer 欠落時は path から層を補完して表示)
    if (pa == null) {
      const layer = d.layer ?? designLayerFromPath(d.path);
      orphans.push({ path: d.path, reason: "pair-missing", detail: `layer ${layer}` });
      continue;
    }
    // self-pair (wireframe mock 自体が③ペア、L2⇔L10)
    if (pa === "self") {
      pairs++;
      continue;
    }
    // rule 2 ref-resolves
    const target = byPath.get(pa);
    if (!target) {
      orphans.push({ path: d.path, reason: "ref-unresolved", detail: pa });
      continue;
    }
    // rule 3 trace-bidir
    if (pa.startsWith("docs/test-design/")) {
      // test-design 側は design dir の集合参照。design の所在 dir を含めば双方向成立。
      const back = target.pairArtifact;
      const dir = dirOf(d.path);
      const normBack = back ? (back.endsWith("/") ? back : `${back}/`) : null;
      if (normBack && dir.startsWith(normBack)) {
        pairs++;
      } else {
        orphans.push({
          path: d.path,
          reason: "trace-orphan",
          detail: `${pa} が ${dir} を逆参照しない`,
        });
      }
    } else if (pa.startsWith("docs/design/")) {
      // L2 group 参照 (→ wireframe.md)。hub が self-pair なら group 成立。
      if (target.pairArtifact === "self") {
        pairs++;
      } else {
        orphans.push({
          path: d.path,
          reason: "trace-orphan",
          detail: `group hub ${pa} が self-pair でない`,
        });
      }
    } else {
      orphans.push({ path: d.path, reason: "ref-unresolved", detail: `未知の pair 形式: ${pa}` });
    }
  }

  return { orphans, pairs, ok: orphans.length === 0 };
}

/** dir を再帰し .md の (repo 相対 path, 本文) を集める。 */
function walkMd(dir: string, repoRoot: string): { rel: string; content: string }[] {
  const out: { rel: string; content: string }[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMd(full, repoRoot));
    } else if (entry.name.endsWith(".md")) {
      out.push({ rel: toPosix(relative(repoRoot, full)), content: readFileSync(full, "utf8") });
    }
  }
  return out;
}

/** docs/design/harness/** + docs/test-design/harness/** の全 .md frontmatter を読む。 */
export function loadPairDocs(repoRoot: string = process.cwd()): PairDoc[] {
  const docs: PairDoc[] = [];
  for (const base of ["docs/design/harness", "docs/test-design/harness"]) {
    for (const { rel, content } of walkMd(join(repoRoot, base), repoRoot)) {
      docs.push(parsePairDoc(rel, content));
    }
  }
  return docs;
}

/** doctor / CLI 向けの 1 行サマリ群 (warn-first、ok は呼び出し側で参照)。 */
export function pairFreezeMessages(result: PairFreezeResult): string[] {
  if (result.orphans.length === 0) {
    return [`pair-freeze — OK (design⇔test-design 双方向 ${result.pairs} pair、孤児 0)`];
  }
  const label: Record<PairOrphanReason, string> = {
    "pair-missing": "pair 欠落",
    "ref-unresolved": "参照不実在",
    "trace-orphan": "逆参照なし",
  };
  const msgs: string[] = [];
  for (const reason of ["pair-missing", "ref-unresolved", "trace-orphan"] as PairOrphanReason[]) {
    const hits = result.orphans.filter((o) => o.reason === reason);
    if (hits.length === 0) continue;
    const list = hits.map((o) => `${o.path} (${o.detail})`).join(", ");
    msgs.push(`pair-freeze — ⚠ ${label[reason]} ${hits.length} 件: ${list}`);
  }
  return msgs;
}

/**
 * V-model pair-freeze lint (requirements §6.8.3 / §2 設計層)。
 * 設計層 ①⇔③ pair の双方向整合・孤児0 を検査する。G7 の 4 artifact 12 edge trace は別 (未実装、後続)。
 */
export function lintVmodel(_path?: string): LintResult {
  const result = analyzePairFreeze(loadPairDocs());
  return { ok: result.ok, messages: pairFreezeMessages(result) };
}

// ── 検証タイミングの機械発火 (IMP-068、PLAN-L6-11/L7-12) ──
// V-model 層群 (検証発火単位) の Forward freeze 完了を検知し、検証サイクル発火を surface する。
// 検証ロードマップの「いつ検証するか」を人の記憶でなく V-model 構造 (層群の freeze) に従わせる
// = 崩れ防止の全体調整。発火 = surface まで (検証 PLAN の起票は人間トリガー、§2.6 signal→mode と同様)。

export interface VerificationGroup {
  id: string;
  layers: string[];
  label: string;
}

/** 検証発火単位 = 設計層群 (PO 例示: L0-L3 / L4-L6 / L0-L6)。L0=価値検証で design doc なし、L7+ は実装/検証実施。 */
export const VERIFICATION_GROUPS: VerificationGroup[] = [
  // id は層群レンジを表示用に示す。layers は実在する design sub-doc の層のみ列挙する
  // (L0 = 価値検証で design doc を持たないため、"L0-L3"/"L0-L6" でも layers に L0 は無い、§7.1)。
  { id: "L0-L3", layers: ["L1", "L2", "L3"], label: "上流 (要求〜要件)" },
  { id: "L4-L6", layers: ["L4", "L5", "L6"], label: "設計 (基本〜機能)" },
  { id: "L0-L6", layers: ["L1", "L2", "L3", "L4", "L5", "L6"], label: "全設計層" },
];

export interface GroupReadiness {
  id: string;
  label: string;
  total: number;
  confirmed: number;
  draft: number;
  placeholder: number;
  hasOrphan: boolean;
  /** freeze 完了 = 全 design sub-doc が confirmed かつ その層群に pair 孤児が無い。 */
  frozen: boolean;
}

/**
 * 層群ごとに Forward freeze 完了 (検証サイクル発火タイミング) を集計 (純関数)。
 * @param docs loadPairDocs 出力
 * @param orphans analyzePairFreeze の孤児 (層群に孤児があれば freeze 未完了)
 */
export function analyzeVerificationGroups(
  docs: PairDoc[],
  orphans: PairOrphan[],
): GroupReadiness[] {
  const orphanPaths = new Set(orphans.map((o) => o.path));
  return VERIFICATION_GROUPS.map((g) => {
    const layerSet = new Set(g.layers);
    const groupDocs = docs.filter((d) => {
      const layer = designLayerFromPath(d.path);
      return isDesignSubDoc(d) && layer != null && layerSet.has(layer);
    });
    let confirmed = 0;
    let draft = 0;
    let placeholder = 0;
    let hasOrphan = false;
    for (const d of groupDocs) {
      if (d.status === "confirmed") confirmed++;
      else if (d.status === "placeholder") placeholder++;
      else draft++; // draft / null
      if (orphanPaths.has(d.path)) hasOrphan = true;
    }
    const total = groupDocs.length;
    return {
      id: g.id,
      label: g.label,
      total,
      confirmed,
      draft,
      placeholder,
      hasOrphan,
      // freeze 完了 = 未着手/作業中 (draft) が無く孤児0 + confirmed が 1 件以上。
      // placeholder は意図的保留 (park、例: L2 screen track G2 DEFER) として発火を妨げない。
      frozen: total > 0 && draft === 0 && !hasOrphan && confirmed > 0,
    };
  });
}

/** doctor / CLI 向けの検証発火 surface (note レベル、ok は落とさない)。 */
export function verificationGroupMessages(groups: GroupReadiness[]): string[] {
  return groups.map((g) => {
    if (g.total === 0) return `verification — ${g.id} (${g.label}): design doc なし`;
    if (g.frozen) {
      const park = g.placeholder > 0 ? `, ${g.placeholder} park` : "";
      return `verification — ${g.id} (${g.label}): ✅ freeze 完了 (${g.confirmed}/${g.total} confirmed${park}, 孤児0) → 検証サイクル発火可`;
    }
    const parts = [`${g.confirmed}/${g.total} confirmed`];
    if (g.draft > 0) parts.push(`draft ${g.draft}`);
    if (g.placeholder > 0) parts.push(`placeholder ${g.placeholder}`);
    if (g.hasOrphan) parts.push("pair 孤児あり");
    return `verification — ${g.id} (${g.label}): Forward 進行中 (${parts.join(", ")})`;
  });
}
