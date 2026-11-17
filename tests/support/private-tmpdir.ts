import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { removeTestTree } from "./temp-tree.ts";

const TMP_ENV_KEYS = ["TMPDIR", "TEMP", "TMP"] as const;

/**
 * この関数の実行中だけ `os.tmpdir()` を、この呼び出し専用の空の一時ルートへ向ける。
 *
 * 別のテストファイルは別 worker で並行に走り、同じ OS 一時ディレクトリへ `ut-tdd-vitest-*` を作る。
 * `os.tmpdir()` を共有したままだと、「一時ルートに新しい entry が増えない」という観測や、
 * `<pid>-<ms>` で名前が決まる runner の snapshot dir が、他ファイルの生成物と衝突する (#1755)。
 * 専用ルートに閉じれば、観測も衝突も自分の呼び出しの中だけで決まる。
 */
export async function withPrivateTmpdir<T>(run: (root: string) => T | Promise<T>): Promise<T> {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-private-tmp-"));
  const saved = TMP_ENV_KEYS.map((key) => [key, process.env[key]] as const);
  for (const key of TMP_ENV_KEYS) process.env[key] = root;
  try {
    return await run(root);
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    removeTestTree(root);
  }
}
