import type { PocDecisionCount } from "../domain/poc-evaluations";

export interface ProjectionEvent {
  table: string;
  id: string;
  row: Record<string, unknown>;
}

/** projectorが永続化adapterへ要求する書込みport。 */
export interface ProjectionStore {
  record(event: ProjectionEvent): void;
}

/** FR-L1-43専用の意味的読取port。SQL構文をapplicationへ漏らさない。 */
export interface PocEvaluationReadPort {
  readPocDecisionCounts(): readonly PocDecisionCount[];
}
