export interface IssueRef {
  readonly owner: string;
  readonly repo: string;
  readonly number: number;
}

export function parseIssueUrl(_text: string): IssueRef | null {
  return null;
}
