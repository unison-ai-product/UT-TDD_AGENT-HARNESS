export interface PathFs {
  isFile(path: string): boolean;
  canExecute(path: string): boolean;
}

/** 契約の呼び出し形: findOnPath(command, env, platform, fs?)。 */
export type FindOnPathArgs = [
  command: string,
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
  fs?: PathFs,
];

// 契約形の stub (L7 provider-command-resolution §5、design-protection-diff-gate §10.3 手順 1')。
// 常に「見つからない」を返し、何も実行しない。実装は #1694 の Green PR で入れる。
// 引数は tuple の rest にして max-source-params (3 個まで) を満たす。呼び出し形は契約のまま。
export function findOnPath(..._args: FindOnPathArgs): string | null {
  return null;
}
