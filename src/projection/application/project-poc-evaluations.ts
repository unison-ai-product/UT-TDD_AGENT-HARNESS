import type { PocEvaluationReadPort, ProjectionStore } from "../contracts/projection-store";
import { summarizePocEvaluations } from "../domain/poc-evaluations";

export function projectPocEvaluations(input: {
  read: PocEvaluationReadPort;
  store: ProjectionStore;
  evaluatedAt: string;
}): void {
  const event = summarizePocEvaluations(input.read.readPocDecisionCounts(), input.evaluatedAt);
  if (event) input.store.record(event);
}
