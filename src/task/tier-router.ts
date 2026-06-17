/**
 * Cost-tiered provider role router (PLAN-L7-75).
 *
 * 3 archetype × 3 tier × 2 provider の対称 roster と難易度ルーターを 1 箇所に集約する。
 * task module 配下に置く (task→team は既存の一方向 edge、循環なし)。
 *
 * 不変条件 (PO 確定 2026-06-17):
 *   - archetype が tier 帯を決める: 相談 / 検証 = 上位 (T0)、ワーカー = 下位 (T1/T2)。
 *   - ワーカーは上位モデル (opus / gpt-5.5) に絶対に到達しない (原則安く、fail-close)。
 *   - T0 (opus / gpt-5.5) は明示許可ゲート: 指名 role (tl/qa/uiux) + 明示トリガでのみ発火。
 *   - 主 provider (detectMode().currentRuntime) でクロス分岐し、Codex/GPT も Claude と対称。
 */
import { type AdapterPlan, buildAdapterPlan } from "../runtime/adapter";
import type { ExecutionMode, RuntimeDetection } from "../runtime/detect";
import type { TaskDifficulty } from "../team/model-policy";
import { type ClassifyTaskInput, classifyTask } from "./classify";

export type Provider = "claude" | "codex";
export type Archetype = "consult" | "worker" | "verify";
export type Tier = "T0" | "T1" | "T2";

/** §1.8 VALID_ROLES のうち agent 化する 5 役 (po=人間 / aim=未採用)。 */
export type RouterRole = "tl" | "qa" | "uiux" | "se" | "docs";

/** role → archetype。相談/検証 = 上位帯、ワーカー = 下位帯。 */
export const ROLE_ARCHETYPE: Record<RouterRole, Archetype> = {
  tl: "consult",
  uiux: "consult",
  qa: "verify",
  se: "worker",
  docs: "worker",
};

/**
 * ティア表: tier × provider → model。Claude と Codex/GPT を対称に定義する。
 * T0 = フロンティア (明示許可)、T1 = ワーカー専門、T2 = ワーカー軽量 (原則安く)。
 */
export const TIER_TABLE: Record<Tier, Record<Provider, string>> = {
  T0: { claude: "claude-opus-4-8", codex: "gpt-5.5" },
  T1: { claude: "claude-sonnet-4-6", codex: "gpt-5.4" },
  T2: { claude: "claude-haiku-4-5", codex: "gpt-5.3-codex-spark" },
};

/** 上位帯モデル集合 (明示許可ゲート対象)。 */
export const FRONTIER_MODELS: ReadonlySet<string> = new Set(Object.values(TIER_TABLE.T0));

/** 上位帯を持てる指名 role (相談/検証)。これ以外は T0 に到達できない。 */
export const FRONTIER_ROLES: ReadonlySet<RouterRole> = new Set(
  (Object.keys(ROLE_ARCHETYPE) as RouterRole[]).filter((r) => ROLE_ARCHETYPE[r] !== "worker"),
);

const DIFFICULTY_RANK: Record<TaskDifficulty, number> = {
  trivial: 0,
  simple: 1,
  standard: 2,
  complex: 3,
  critical: 4,
};

/** クロス分岐: 相手 provider。 */
export const other = (p: Provider): Provider => (p === "claude" ? "codex" : "claude");

/**
 * archetype が tier 帯を決める。ワーカー帯の中だけ難易度で T2↔T1 を振り分ける
 * (原則安く: trivial/simple かつ risk 無 → T2、それ以外 → T1)。ワーカーは T0 に行かない。
 */
export function tierFor(role: RouterRole, difficulty: TaskDifficulty, riskFlags: string[]): Tier {
  if (ROLE_ARCHETYPE[role] !== "worker") return "T0";
  const cheap = DIFFICULTY_RANK[difficulty] <= DIFFICULTY_RANK.simple && riskFlags.length === 0;
  return cheap ? "T2" : "T1";
}

/**
 * 不変条件: ワーカー role は T0 (opus/gpt-5.5) に解決できない (fail-close)。
 * 「ワーカーは下位モデル」を配線で不可能化する。
 */
export function resolveModel(role: RouterRole, tier: Tier, provider: Provider): string {
  if (ROLE_ARCHETYPE[role] === "worker" && tier === "T0") {
    throw new Error(
      `invariant violation: worker role ${role} cannot resolve to T0 (frontier opus/gpt-5.5)`,
    );
  }
  return TIER_TABLE[tier][provider];
}

/** T0 発火の明示許可。explicit=false なら上位帯は block される。 */
export interface FrontierAuth {
  explicit: boolean;
}

export type RoutingStatus = "ready" | "blocked-needs-approval";
export type ReviewEntry = "machine" | "T2" | "T1" | "T0";

export interface RoutingDecision {
  role: RouterRole;
  archetype: Archetype;
  tier: Tier;
  provider: Provider;
  /** blocked-needs-approval のときは null。 */
  model: string | null;
  reviewEntry: ReviewEntry;
  gate: boolean;
  crossReview: boolean;
  /** 主→相手のプロバイダ切替割付 (creation=主 / judgement=相手、§7.8.7.1)。 */
  cross: CrossAssign;
  status: RoutingStatus;
  reason?: string;
  difficulty: TaskDifficulty;
  riskFlags: string[];
}

export interface RouteInput {
  role: RouterRole;
  task: ClassifyTaskInput;
}

export interface RouteOptions {
  /** 主 provider 上書き。省略時は detection.currentRuntime ?? "claude"。 */
  primary?: Provider;
  /** T0 明示許可。 */
  auth?: FrontierAuth;
}

/** 難易度 × risk → 検証入口 / ゲート / cross-review (コスト階段型検証への接続)。 */
function reviewPolicy(
  difficulty: TaskDifficulty,
  riskFlags: string[],
): { reviewEntry: ReviewEntry; gate: boolean; crossReview: boolean } {
  const rank = DIFFICULTY_RANK[difficulty];
  const risky = riskFlags.length > 0;
  // risk override: 危険領域は難易度に関係なく最低 T1 専門レビュー + ゲート。
  if (rank >= 4) return { reviewEntry: "T0", gate: true, crossReview: true };
  if (rank === 3) return { reviewEntry: "T1", gate: true, crossReview: true };
  if (rank === 2 || risky) return { reviewEntry: "T1", gate: risky, crossReview: false };
  if (rank === 1) return { reviewEntry: "T2", gate: false, crossReview: false };
  return { reviewEntry: "machine", gate: false, crossReview: false };
}

/**
 * 難易度ルーター本体: task を分類し、role の archetype + 難易度 + risk + 主 provider から
 * RoutingDecision を返す。上位帯 (T0) は明示許可ゲートを通らないと model=null で block する。
 */
export function route(
  input: RouteInput,
  detection: RuntimeDetection,
  options: RouteOptions = {},
): RoutingDecision {
  const c = classifyTask(input.task);
  const primary: Provider = options.primary ?? (detection.currentRuntime as Provider) ?? "claude";
  const archetype = ROLE_ARCHETYPE[input.role];
  const tier = tierFor(input.role, c.difficulty, c.risk_flags);
  const policy = reviewPolicy(c.difficulty, c.risk_flags);
  // 主 provider から「創出=主 / 判断=相手」のクロス切替を自動導出 (assignCross 配線)。
  const cross = assignCross(detection, primary);
  // 役割を実 provider へ配置 (クロス接続): ワーカー=創出側(主)、相談/検証=判断側(相手)。
  const placed: Provider = archetype === "worker" ? cross.execution : cross.judgement;
  const base: Omit<RoutingDecision, "model" | "status" | "reason"> = {
    role: input.role,
    archetype,
    tier,
    provider: placed,
    reviewEntry: policy.reviewEntry,
    gate: policy.gate,
    crossReview: detection.mode === "hybrid" && policy.crossReview,
    cross,
    difficulty: c.difficulty,
    riskFlags: c.risk_flags,
  };

  // T0 = 明示許可ゲート: 指名 role + explicit auth でのみ発火 (fail-close)。
  if (tier === "T0") {
    const designated = FRONTIER_ROLES.has(input.role);
    if (!designated || !options.auth?.explicit) {
      return {
        ...base,
        model: null,
        status: "blocked-needs-approval",
        reason: designated
          ? "T0 (opus/gpt-5.5) は明示許可が必要です (--allow-frontier)。"
          : `role ${input.role} は上位帯 (T0) の指名 role ではありません。`,
      };
    }
  }

  return { ...base, model: resolveModel(input.role, tier, placed), status: "ready" };
}

export interface CrossAssign {
  execution: Provider;
  judgement: Provider;
  review_kind: "cross_agent" | "intra_runtime_subagent";
}

/**
 * クロス分岐: 主 provider で創出、hybrid なら判断を相手 provider にフリップ
 * (§7.8.7.1 機能分散 MUST)。単一 runtime では同 runtime + intra_runtime_subagent fallback。
 */
export function assignCross(detection: RuntimeDetection, worker?: Provider): CrossAssign {
  const primary: Provider = worker ?? (detection.currentRuntime as Provider) ?? "claude";
  if (detection.mode === "hybrid") {
    // 連携状態 (hybrid): 実装 (創出) と検証 (判断) を明示的に別 provider にする (PO 指示)。
    const assignment: CrossAssign = {
      execution: primary,
      judgement: other(primary),
      review_kind: "cross_agent",
    };
    if (assignment.execution === assignment.judgement) {
      throw new Error("invariant violation: hybrid は実装と検証を別 provider にする必要があります");
    }
    return assignment;
  }
  const only: Provider = detection.mode === "codex-only" ? "codex" : "claude";
  return { execution: only, judgement: only, review_kind: "intra_runtime_subagent" };
}

export interface RosterBinding {
  role: RouterRole;
  archetype: Archetype;
  claude: string;
  codex: string;
}

/**
 * 対称 roster ビュー (5 role × 2 provider = 10 binding)。Claude と Codex/GPT を同一 role・
 * 同一 archetype で両建てする (GPT も Claude と同じ設定)。ワーカーは既定 tier (T2)、相談/検証は T0。
 */
export function roster(): RosterBinding[] {
  return (Object.keys(ROLE_ARCHETYPE) as RouterRole[]).map((role) => {
    const tier: Tier = ROLE_ARCHETYPE[role] === "worker" ? "T2" : "T0";
    return {
      role,
      archetype: ROLE_ARCHETYPE[role],
      claude: TIER_TABLE[tier].claude,
      codex: TIER_TABLE[tier].codex,
    };
  });
}

/**
 * 決定 → 実行層ブリッジ (接続)。RoutingDecision を、配置済み provider の adapter 実行プラン
 * (command / args / available) へ変換する。blocked (T0 未承認) は実行不可なので null を返す
 * (fail-close)。これが難易度ルーターの決定を team/provider dispatch へ繋ぐ接続点。
 */
export function routeToAdapterPlan(
  decision: RoutingDecision,
  task: string,
  mode: ExecutionMode,
): AdapterPlan | null {
  if (decision.status !== "ready" || decision.model === null) return null;
  return buildAdapterPlan(
    { provider: decision.provider, role: decision.role, task, model: decision.model },
    mode,
  );
}
