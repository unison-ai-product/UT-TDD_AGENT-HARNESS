type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

interface EvidenceError {
  readonly ruleId: string;
  readonly message: string;
}

export class EvidenceRecord {
  readonly evidenceId!: string;
  readonly subjectId!: string;
  readonly subjectRevision!: number;
  readonly sourceCommit!: string;
  readonly commandArgs!: readonly string[];
  readonly outputDigest!: string;
  readonly exitCode!: number;
  readonly producer!: string;
  readonly producedAt!: string;
  readonly expiresAt?: string;

  private constructor(input: {
    evidenceId: string;
    subjectId: string;
    subjectRevision: number;
    sourceCommit: string;
    commandArgs: readonly string[];
    outputDigest: string;
    exitCode: number;
    producer: string;
    producedAt: string;
    expiresAt?: string;
  }) {
    Object.assign(this, input);
    Object.freeze(this);
  }

  static create(input: {
    evidenceId: string;
    subjectId: string;
    subjectRevision: number;
    sourceCommit: string;
    commandArgs: readonly string[];
    outputDigest: string;
    exitCode: number;
    producer: string;
    producedAt: string;
    expiresAt?: string;
  }): Result<EvidenceRecord, EvidenceError> {
    if (
      !input.evidenceId.trim() ||
      !input.subjectId.trim() ||
      input.subjectRevision < 1 ||
      !/^[a-f0-9]{40}$/.test(input.sourceCommit) ||
      !/^[a-f0-9]{64}$/.test(input.outputDigest) ||
      input.commandArgs.length === 0 ||
      !Number.isSafeInteger(input.exitCode) ||
      !input.producer.trim()
    ) {
      return { ok: false, error: { ruleId: "evidence-invalid", message: input.evidenceId } };
    }
    return {
      ok: true,
      value: new EvidenceRecord({ ...input, commandArgs: Object.freeze([...input.commandArgs]) }),
    };
  }

  isUsableFor(input: {
    subjectId: string;
    subjectRevision: number;
    sourceCommit: string;
    now: string;
    acceptedProducers: readonly string[];
    exitRule: { kind: "exact"; expected: number } | { kind: "nonzero" } | { kind: "any" };
  }): { usable: boolean; ruleId?: string } {
    const exitMatches =
      input.exitRule.kind === "any" ||
      (input.exitRule.kind === "nonzero"
        ? this.exitCode !== 0
        : this.exitCode === input.exitRule.expected);
    const usable =
      this.subjectId === input.subjectId &&
      this.subjectRevision === input.subjectRevision &&
      this.sourceCommit === input.sourceCommit &&
      input.acceptedProducers.includes(this.producer) &&
      (!this.expiresAt || Date.parse(input.now) < Date.parse(this.expiresAt)) &&
      exitMatches;
    return usable
      ? { usable: true }
      : { usable: false, ruleId: "evidence-stale-or-subject-mismatch" };
  }
}
