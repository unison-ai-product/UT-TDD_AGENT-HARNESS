import type { AuthoringReceipt } from "../domain/authoring-provenance";

export interface AuthoringProvenancePort {
  receipts(paths: readonly string[]): readonly AuthoringReceipt[];
}
