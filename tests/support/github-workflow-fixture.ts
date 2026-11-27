import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

type TestWorkflowJob = { [key: string]: unknown; steps?: unknown };
type TestWorkflow = { jobs: Record<string, TestWorkflowJob> };

export function mutateJob(
  source: string,
  jobName: string,
  mutate: (job: TestWorkflowJob) => void,
): string {
  const workflow = parseYaml(source) as TestWorkflow;
  const job = workflow.jobs[jobName];
  if (!job) throw new Error(`missing job ${jobName}`);
  const before = stringifyYaml(job);
  mutate(job);
  if (stringifyYaml(job) === before) throw new Error("mutation did not change " + jobName);
  return stringifyYaml(workflow);
}

export function mutateJobStep(
  source: string,
  jobName: string,
  matches: (step: Record<string, unknown>) => boolean,
  mutate: (step: Record<string, unknown>) => void,
): string {
  return mutateJob(source, jobName, (job) => {
    if (!Array.isArray(job.steps)) throw new Error(`missing steps for ${jobName}`);
    const step = job.steps.find(
      (candidate): candidate is Record<string, unknown> =>
        typeof candidate === "object" &&
        candidate !== null &&
        matches(candidate as Record<string, unknown>),
    );
    if (!step) throw new Error(`missing matching step in ${jobName}`);
    mutate(step);
  });
}

export function workflowNodeVersion(content: string): unknown {
  const parsed = parseYaml(content) as {
    jobs?: Record<string, { steps?: { uses?: unknown; with?: Record<string, unknown> }[] }>;
  };
  for (const job of Object.values(parsed.jobs ?? {})) {
    const setupNode = job.steps?.find((step) => step.uses === "actions/setup-node@v4");
    if (setupNode) return setupNode.with?.["node-version"];
  }
  return undefined;
}
