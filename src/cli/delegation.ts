import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import type { Command } from "commander";
import {
  issueReviewRequest,
  projectReviewVerdict,
  REVIEW_VERDICT_FILE_ENV,
  type ReviewAttestationRequest,
  resolveReviewAuthorFamily,
} from "../feedback/review-attestation.ts";
import { REVIEW_OUTPUT_CONTRACT } from "../feedback/review-verdict-contract.ts";
import { loadChangedFiles } from "../lint/change-impact.ts";
import {
  type AdapterContextInjection,
  type AdapterPlan,
  type AdapterProvider,
  buildAdapterPlan,
  buildProviderInvocation,
} from "../runtime/adapter.ts";
import { detectMode } from "../runtime/detect.ts";
import {
  assessReviewSession,
  isReadOnlyDelegationRole,
  reviewGuardMessages,
} from "../runtime/review-guard.ts";
import { dispatch, nodeDeps, type SessionHookInput } from "../runtime/session-log.ts";
import { resolveDelegationRouting } from "../team/delegation-routing.ts";

export interface AdapterExecutionDeps {
  gitBranch: () => string | null;
  gitHead: () => string | null;
  runSessionStartSideEffects: (input: {
    repoRoot: string;
    input: SessionHookInput;
    deps: ReturnType<typeof nodeDeps>;
    json?: boolean;
  }) => void;
  writeHandoverWarnings: () => void;
  now?: () => string;
}

export interface AdapterExecutionInput {
  sessionPrefix: string;
  toolName: string;
  planId?: string;
  jsonOut?: boolean;
  reviewRole?: string;
  review?: {
    request: ReviewAttestationRequest;
    verdictFile: string;
    startedAt: string;
  };
}

export interface AdapterExecutionResult {
  executed: true;
  exit_code: number | null;
  signal: string | null;
  review?: ReturnType<typeof projectReviewVerdict>;
}

export interface DelegationCommandDeps extends AdapterExecutionDeps {
  resolveTaskText: (opts: { task?: string; taskFile?: string }) => string | null;
  resolveSkillContextInjection: (planId: string | undefined) => AdapterContextInjection | undefined;
  taskFileOptionDescription: string;
}

export function adapterExecutionEnv(
  provider: AdapterProvider,
  extraEnv: Record<string, string> = {},
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  const legacyPrefix = ["HE", "LIX"].join("");
  for (const key of [
    [legacyPrefix, "ALLOW", "RAW", "CLAUDE"].join("_"),
    [legacyPrefix, "RAW", "CLAUDE", "REASON"].join("_"),
    [legacyPrefix, "ALLOW", "RAW", "CODEX"].join("_"),
    [legacyPrefix, "RAW", "CODEX", "REASON"].join("_"),
    [legacyPrefix, "CLAUDE", "BIN"].join("_"),
    [legacyPrefix, "CODEX", "BIN"].join("_"),
  ]) {
    delete env[key];
  }
  if (provider !== "claude" && provider !== "codex") return env;
  return {
    ...env,
    ...extraEnv,
    // `claude --print` is a finite delegated process, not the live VS Code
    // session that owns asyncRewake delivery.  A long-lived Stop hook keeps
    // the delegated provider's stdio/process tree open on Windows.
    ...(provider === "claude" ? { UT_TDD_DISABLE_CLAUDE_MEMORY_WAKE: "1" } : {}),
  };
}

function safeLoadChangedFiles(repoRoot: string): string[] {
  try {
    return loadChangedFiles(repoRoot);
  } catch {
    return [];
  }
}

function nowIso(): string {
  return new Date(performance.timeOrigin + performance.now()).toISOString();
}

/**
 * `candidate` が repo の外にあるか。
 *
 * reviewer は read-only 契約 (`isReadOnlyDelegationRole` / `assessReviewSession`) の下で動くため、
 * verdict file を repo 内に置くと reviewer の書き込みがツリー改変として誤検知される。
 * 純関数なので合成 path で直接検証できる (U-RVATT-017)。
 */
export function isOutsideRepo(repoRoot: string, candidate: string): boolean {
  const rel = relative(resolve(repoRoot), resolve(candidate));
  return rel !== "" && rel !== "." && rel.startsWith("..");
}

function reviewVerdictPath(repoRoot: string): string {
  let directory = mkdtempSync(join(tmpdir(), "ut-tdd-review-"));
  if (!isOutsideRepo(repoRoot, directory)) {
    rmSync(directory, { recursive: true, force: true });
    directory = mkdtempSync(join(dirname(resolve(repoRoot)), "ut-tdd-review-"));
  }
  return join(directory, "verdict.txt");
}

export function executeAdapterPlanForCli(
  plan: AdapterPlan,
  input: AdapterExecutionInput,
  depsInput: AdapterExecutionDeps,
): AdapterExecutionResult {
  const sessionId = `${input.sessionPrefix}-${Date.now()}`;
  const repoRoot = process.cwd();
  const now = depsInput.now ?? nowIso;
  const deps = nodeDeps(repoRoot, depsInput.gitBranch, depsInput.gitHead);
  if (input.jsonOut) {
    deps.warn = (message) => process.stderr.write(`${message}\n`);
  }
  const startInput: SessionHookInput = {
    hook_event_name: "SessionStart",
    session_id: sessionId,
    ...(input.planId ? { plan_id: input.planId } : {}),
  };
  depsInput.runSessionStartSideEffects({
    repoRoot,
    input: startInput,
    deps,
    json: Boolean(input.jsonOut),
  });
  dispatch(startInput, deps, "SessionStart");

  const guardActive = input.reviewRole !== undefined && isReadOnlyDelegationRole(input.reviewRole);
  const treeBefore = guardActive ? safeLoadChangedFiles(repoRoot) : [];
  const invocation = buildProviderInvocation({
    provider: plan.provider,
    command: plan.command,
    args: plan.args,
  });
  const child = spawnSync(invocation.command, invocation.args, {
    input: plan.stdin,
    stdio:
      plan.stdin === undefined
        ? ["inherit", input.jsonOut ? 2 : "inherit", "inherit"]
        : ["pipe", input.jsonOut ? 2 : "inherit", "inherit"],
    env: adapterExecutionEnv(plan.provider, plan.env),
    shell: invocation.shell ?? false,
    windowsVerbatimArguments: invocation.windowsVerbatimArguments ?? false,
  });
  let reviewResult: ReturnType<typeof projectReviewVerdict> | undefined;
  if (input.review) {
    try {
      reviewResult = projectReviewVerdict({
        repoRoot,
        request: input.review.request,
        attestation: {
          provider: plan.provider,
          role: input.reviewRole ?? "reviewer",
          model: plan.model ?? "unknown",
          pr: input.review.request.pr,
          head: input.review.request.exactHead,
          reviewRevision: input.review.request.reviewRevision,
          startedAt: input.review.startedAt,
          completedAt: now(),
          exitCode: child.status ?? 1,
        },
        verdictFile: input.review.verdictFile,
      });
    } finally {
      rmSync(dirname(input.review.verdictFile), { recursive: true, force: true });
    }
  }
  if (child.error) {
    process.stderr.write(`${plan.provider}: failed to launch (${String(child.error)})\n`);
  }
  if (guardActive && input.reviewRole) {
    const assessment = assessReviewSession({
      role: input.reviewRole,
      before: treeBefore,
      after: safeLoadChangedFiles(repoRoot),
    });
    for (const message of reviewGuardMessages(assessment)) process.stderr.write(`${message}\n`);
  }
  dispatch(
    {
      hook_event_name: "PostToolUse",
      session_id: sessionId,
      ...(input.planId ? { plan_id: input.planId } : {}),
      tool_name: input.toolName,
      tool_input: { command: `${plan.command} ${plan.args.join(" ")}` },
      tool_response: { outcome: child.status === 0 ? "ok" : "error" },
    },
    deps,
    "PostToolUse",
  );
  dispatch(
    {
      hook_event_name: "Stop",
      session_id: sessionId,
      ...(input.planId ? { plan_id: input.planId } : {}),
    },
    deps,
    "Stop",
  );
  depsInput.writeHandoverWarnings();
  const exitCode = child.status === 0 && reviewResult?.ok === false ? 1 : child.status;
  return {
    executed: true,
    exit_code: exitCode ?? null,
    signal: child.signal ?? null,
    ...(reviewResult ? { review: reviewResult } : {}),
  };
}

function runtimeCommand(
  program: Command,
  provider: AdapterProvider,
  deps: DelegationCommandDeps,
): Command {
  return program
    .command(provider)
    .description(`${provider} runtime adapter command`)
    .requiredOption("--role <role>", "delegation role")
    .option("--task <text>", "task text")
    .option("--task-file <path>", deps.taskFileOptionDescription)
    .option("--plan <id>", "PLAN id")
    .option("--model <model>", "provider model override for this call")
    .option("--effort <level>", "provider reasoning effort override for this call")
    .option("--review-pr <number>", "reviewed pull request number")
    .option("--review-head <sha>", "exact reviewed HEAD SHA")
    .option("--review-revision <id>", "review revision identity")
    .option("--review-author-family <family>", "author family under review (codex|claude)")
    .option("--execute", "execute provider CLI instead of dry-run")
    .option("--json", "JSON output")
    .action(
      (opts: {
        role: string;
        task?: string;
        taskFile?: string;
        plan?: string;
        model?: string;
        effort?: string;
        reviewPr?: string;
        reviewHead?: string;
        reviewRevision?: string;
        reviewAuthorFamily?: string;
        execute?: boolean;
        json?: boolean;
      }) => {
        const task = deps.resolveTaskText(opts);
        if (!task) {
          process.stderr.write("adapter requires exactly one of --task or --task-file\n");
          process.exitCode = 1;
          return;
        }
        const detection = detectMode();
        const mode = detection.mode;
        // role 検証 + role/intent ベースの model/effort routing (PLAN-L7-255)。
        // 明示 --model/--effort は routing より常に優先される。
        const routing = resolveDelegationRouting({
          provider,
          role: opts.role,
          task,
          model: opts.model,
          effort: opts.effort,
        });
        if (!routing.ok) {
          process.stderr.write(`${routing.message}\n`);
          process.exitCode = 1;
          return;
        }
        // レビュー識別子は **opt-in**。`review_lane` には qa / tl / uiux のように
        // 「まだ成果物が存在しない」委譲 (テスト作成依頼など) も含まれるため、
        // 全 review lane に PR/HEAD を強制すると正当な用法を壊す。
        // 識別子を 1 つでも渡した時点で「verdict を出す宣言」とみなし、**部分指定は fail-close**
        // する (どの成果物に対する verdict か不明な receipt を作らせない)。
        // **注意 (誤った論拠の訂正、2026-08-03)**: 「識別子なしでも D1 が SLA breach として拾う」
        // というのは**誤り**。breach 判定は `input.requests` を起点にするため
        // (`review-dispatch.ts` の `uniqueRequests(input.requests)`)、request が発行されない
        // 未宣言レビューは **breach 判定の対象にすらならない** (窓は 60 分ではなく無限)。
        // よって現時点で保証できるのは「未宣言レビューは receipt を生まないので `merge_ready` に
        // 到達しない」ことだけであり、未宣言レビュー自体の検出は D2 の merge gate の責務。
        // 顧問 2 名 (Fable / Sol) が独立に同じ refutation を出し、実測で確認済み。
        // --review-author-family も宣言入力に含める。三識別子だけを宣言と数えると、
        // author-family 単独指定が「識別子なし委譲」として素通りし、値が黙って捨てられる
        // (silent discard、PR #214 precheck FLAG)。宣言 = 4 flag のいずれかを渡したこと。
        const reviewIdentityRequested = Boolean(
          opts.reviewPr || opts.reviewHead || opts.reviewRevision || opts.reviewAuthorFamily,
        );
        if (
          reviewIdentityRequested &&
          (!opts.reviewPr || !opts.reviewHead || !opts.reviewRevision)
        ) {
          process.stderr.write(
            "review_head_required: review identity requires --review-pr, --review-head, and --review-revision together\n",
          );
          process.exitCode = 1;
          return;
        }
        // 識別子を渡した = receipt を作る宣言。review lane でない role では receipt を作れないので、
        // 宣言済み入力を黙って捨てず fail-close する (silent undefined の禁止)。
        if (reviewIdentityRequested && !routing.review_lane) {
          process.stderr.write(
            `review_identity_requires_review_lane: role=${opts.role} is not a review lane role; ` +
              "review identity flags produce no receipt here\n",
          );
          process.exitCode = 1;
          return;
        }
        const reviewPr = opts.reviewPr;
        const reviewHead = opts.reviewHead;
        const reviewRevision = opts.reviewRevision;
        const routingAudit =
          `delegation-routing: model=${routing.model} (${routing.model_source}) ` +
          `effort=${routing.effort} (${routing.effort_source})` +
          (routing.review_lane ? ` lane=${routing.review_lane}` : "") +
          (routing.task_intent ? ` intent=${routing.task_intent}` : "");
        const contextInjection = deps.resolveSkillContextInjection(opts.plan);
        const taskForAdapter = routing.review_lane ? `${task}\n\n${REVIEW_OUTPUT_CONTRACT}` : task;
        const plan = buildAdapterPlan(
          {
            provider,
            role: opts.role,
            task: taskForAdapter,
            planId: opts.plan,
            model: routing.model,
            effort: routing.effort,
            execute: Boolean(opts.execute),
            contextInjection,
          },
          mode,
        );
        // どの routing が効いたかを plan 出力 (dry-run JSON / execute ログ) へ監査記録する
        // (PLAN-L7-255 スコープ 4。DB 投影は telemetry 側 follow-up)。
        plan.messages.push(routingAudit);
        if (!plan.available) {
          process.stderr.write(`${plan.messages.join("\n")}\n`);
          process.exitCode = 1;
          return;
        }
        // 著者族は provider から独立した事実 (委譲を実行している runtime) から取る。
        // provider の反対と定義すると D1 の同族レビュー検出が恒偽になり fail-open する
        // (`resolveReviewAuthorFamily` の doc を参照)。判別できなければ推測せず落とす。
        const authorFamily = reviewIdentityRequested
          ? resolveReviewAuthorFamily({
              explicit: opts.reviewAuthorFamily,
              currentRuntime: detection.currentRuntime,
            })
          : null;
        if (reviewIdentityRequested && !authorFamily) {
          process.stderr.write(
            "review_author_family_required: cannot determine the author family; " +
              "pass --review-author-family <codex|claude>\n",
          );
          process.exitCode = 1;
          return;
        }
        // verdict の輸送先は「receipt に投影される review (= 識別子宣言あり)」に限って作る。
        // 識別子なし review lane (qa / tl / uiux 等) では verdict の読み手 (receipt 投影) が
        // 存在せず、execute 経路の後始末 (`input.review` 経由) にも到達しないため、無条件に
        // 作ると temp dir が委譲のたびに leak する (PR #214 Codex FLAG、U-RVATT-020)。
        // reviewRequest 生成 (下) と同じ reviewIdentityRequested を述語にする — 二重実装に
        // すると生成条件と輸送条件が再び drift する。
        let reviewVerdictFile: string | undefined;
        if (routing.review_lane && reviewIdentityRequested) {
          reviewVerdictFile = reviewVerdictPath(process.cwd());
          plan.env = { ...(plan.env ?? {}), [REVIEW_VERDICT_FILE_ENV]: reviewVerdictFile };
        }
        // verdict file の temp dir は execute 経路 (`executeAdapterPlanForCli`) が後始末する。
        // dry-run と早期 return はそこへ到達しないので、ここで確実に捨てる (leak 防止)。
        const discardVerdictDir = (): void => {
          if (reviewVerdictFile) {
            rmSync(dirname(reviewVerdictFile), { recursive: true, force: true });
          }
        };
        if (!opts.execute) {
          process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
          discardVerdictDir();
          return;
        }
        const jsonOut = Boolean(opts.json);
        const startedAt = deps.now?.() ?? nowIso();
        // 宣言 (= 識別子あり) なら上流の guard で review_lane / authorFamily / verdictFile /
        // 3 識別子が揃うことが保証済みなので、この条件が偽になるのは「宣言なし」の場合だけ。
        // 残りの連言は型の絞り込み用であって、宣言済み入力を黙って落とす経路ではない。
        // (防御的な到達不能分岐は足さない — D1 の `!hasFlagVerdict &&` を死に分岐として
        //  削除したのと同じ理由。)
        const reviewRequest =
          reviewIdentityRequested &&
          authorFamily &&
          reviewVerdictFile &&
          reviewPr &&
          reviewHead &&
          reviewRevision
            ? {
                memoryId: `review:${reviewPr}:${reviewHead}:${reviewRevision}`,
                pr: Number(reviewPr),
                exactHead: reviewHead,
                reviewRevision,
                authorFamily,
                requestedAt: startedAt,
              }
            : undefined;
        if (reviewRequest && !Number.isInteger(reviewRequest.pr)) {
          process.stderr.write("review_pr_required: --review-pr must be an integer\n");
          process.exitCode = 1;
          discardVerdictDir();
          return;
        }
        if (reviewRequest) {
          const issued = issueReviewRequest({ repoRoot: process.cwd(), request: reviewRequest });
          if (!issued.ok) {
            process.stderr.write(`${issued.reason}\n`);
            process.exitCode = 1;
            discardVerdictDir();
            return;
          }
        }
        const execution = executeAdapterPlanForCli(
          plan,
          {
            sessionPrefix: provider,
            toolName: provider,
            planId: opts.plan,
            jsonOut,
            reviewRole: opts.role,
            ...(reviewRequest && reviewVerdictFile
              ? { review: { request: reviewRequest, verdictFile: reviewVerdictFile, startedAt } }
              : {}),
          },
          deps,
        );
        if (jsonOut) {
          process.stdout.write(`${JSON.stringify({ ...plan, ...execution }, null, 2)}\n`);
        }
        process.exitCode = execution.exit_code ?? 1;
      },
    );
}

export function registerDelegationCommands(program: Command, deps: DelegationCommandDeps): void {
  runtimeCommand(program, "codex", deps);
  runtimeCommand(program, "claude", deps);
}
