import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { admitNodeGenerationAggregate } from "../src/lint/node-generation-ci-policy.ts";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`missing ${name}`);
  return value;
};
const root = resolve(required("NODE_GENERATION_EVIDENCE_DIR"));
const readEvidence = (lane) =>
  JSON.parse(readFileSync(resolve(root, `node-generation-${lane}`, "node-generation-evidence.json"), "utf8"));
const result = admitNodeGenerationAggregate({
  evidence: [readEvidence("linux"), readEvidence("windows")],
  expected: {
    workflow_revision: required("GITHUB_SHA"),
    subject_revision: required("GITHUB_SHA"),
    run_id: required("GITHUB_RUN_ID"),
    run_attempt: Number(required("GITHUB_RUN_ATTEMPT")),
  },
});
if (!result.ok) throw new Error(`node-generation-aggregate-rejected:${result.reason}`);
console.log(JSON.stringify({ schema_version: "node-generation-aggregate.v1", ...result }));
