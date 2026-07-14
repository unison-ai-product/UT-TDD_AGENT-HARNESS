import type {
  ModelEvaluationConfigPort,
  ModelEvaluationReadPort,
  ProjectionStore,
} from "../contracts/projection-store";
import { buildModelEvaluationEvent } from "../domain/model-evaluations";

export function projectModelEvaluations(input: {
  config: ModelEvaluationConfigPort;
  read: ModelEvaluationReadPort;
  store: ProjectionStore;
  evaluatedAt: string;
}): void {
  if (!input.config.isEnabled()) return;
  for (const facts of input.read.readModelEvaluationFacts()) {
    input.store.record(buildModelEvaluationEvent(facts, input.evaluatedAt));
  }
}
