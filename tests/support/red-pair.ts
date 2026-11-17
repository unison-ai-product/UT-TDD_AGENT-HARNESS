// Red (`it.fails`) と、同じ準備処理を通る対の通常 `it` を登録する (L7 snapshot runner lock test design §1)。
// 対の `it` は Red と同じ本体を走らせ、assertion の失敗 (stub が期待を満たさないこと) だけを許す。
// 準備中の例外 (TypeError・fixture の失敗など) は `it.fails` に吸い込まれず、対の `it` が落ちる。
import { expect, it } from "vitest";

const isAssertionFailure = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { name?: string }).name === "AssertionError";

/** 本体を走らせ、assertion の失敗は許し、それ以外の例外は投げ直す。 */
export function runAllowingAssertionFailure(body: () => void): "passed" | "assertion-failed" {
  try {
    body();
    return "passed";
  } catch (error) {
    if (!isAssertionFailure(error)) throw error;
    return "assertion-failed";
  }
}

export function redWithPreparationPair(
  name: string,
  body: () => void,
  pairBody: () => void = body,
): void {
  it.fails(name, body);
  it(`${name} [preparation pair]`, () => {
    expect(["passed", "assertion-failed"]).toContain(runAllowingAssertionFailure(pairBody));
  });
}
