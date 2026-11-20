// Red 段階の契約形 stub (issue #1882、design-protection-diff-gate §10.3 手順 1')。
// 契約: docs/design/harness/L6-function-design/pack-build-inputs.md。実装は Green PR で置き換える。
// stub は oracle の期待を満たし得ない fail-close の値 (ok: false / 空配列) だけを返す。

export const PACK_BUILD_INPUT_FILES: readonly string[] = [];
export const PACK_BUILD_INPUT_TEMPLATE_RULE: {
  prefix: string;
  suffix: string;
  excludePrefix: string;
} = { prefix: "", suffix: "", excludePrefix: "" };

export type PackBuildInputReason =
  | { code: "pack_build_input_missing" | "pack_build_input_untracked"; path: string }
  | { code: "pack_build_input_template_set_empty" };
export type PackBuildInputSelection =
  | { ok: true; paths: readonly string[] }
  | { ok: false; reasons: readonly PackBuildInputReason[] };

export function selectPackBuildInputs(
  _treePaths: readonly string[],
  _exists?: (path: string) => boolean,
): PackBuildInputSelection {
  return { ok: false, reasons: [] };
}
