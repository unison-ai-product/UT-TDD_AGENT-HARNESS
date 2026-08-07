# PLAN-L7-462 step 3 (PR #284) blind review FLAG 記録

第三者再現性のための FLAG 原文永続化 (blind review 指摘「A-1〜A-5 の原文がどの永続証跡にも
存在しない」への追随)。reviewer = claude-opus-5 blind-reviewer (intra_runtime_subagent、
Codex usage cap 中。cross retake は Issue #252 で追跡)。

## 第 1 ラウンド (対象 HEAD 9c3a890a → 是正 6c5cacf4..11c0d639)

- **A-1**: bun spawn 検出がリテラル第 1 引数のみで、repo に実在する間接形 (findBun launcher /
  `?? "bun"` fallback / cmd.exe `"/c","bun"` / `["bun",[...]]` runner tuple / `exec bun`) を
  見逃す。→ 検出器拡張 (6c5cacf4)。
- **A-2**: debt allowlist の帰属・注記が freeze と不一致。→ 注記再構成 (6c5cacf4)。
  ※第 2 ラウンド A-2' で機構不足として再 FLAG。
- **A-3**: tests/ が bun ルールの scope 外で、テスト側 launcher の bun 再流入が素通り。
  → scope へ tests/ を追加 (6c5cacf4)。
- **A-4**: globalThis 形 / optional chaining / bracket access の Bun-global が未検出。
  → pattern 拡張 (6c5cacf4)。※第 2 ラウンド A-4' で typeof 形の残りを再 FLAG。
- **A-5**: 実 residue (verification catalog の bun command / sh・ps1 wrapper の bun 発火) が
  残存。→ node/npm 化 (6c5cacf4, 73fe25ca)。

(A-2 / A-5 の原文は commit message からの再構成。A-1/A-3/A-4 は
tests/runtime-portability.test.ts のコメントに対応が残る。)

## 第 2 ラウンド (対象 HEAD 11c0d639、verdict FLAG)

- **A-4'** (blocking): `bun-global-reference` が member access 形のみで、Bun 分岐再流入の
  最頻イディオム `typeof Bun` / `(globalThis as {...}).Bun` 末尾参照 / `process.versions.bun`
  を検出しない。live 例: src/state-db/index.ts:61 / tests/state-db.test.ts:43 /
  tests/support/temp-tree.ts:20。AC-3「Bun グローバル参照が lint で fail-close」不成立。
- **A-2'** (blocking): allowlist が file 単位 `continue` で、収載 13 path への新規サイト追加が
  全て素通り (probe 実測 detected=0)。source 注記の「サイト単位」「期限付き」に対応する機構が
  実装に無い (`coding ≠ substance`)。行単位カウンタも allowlist ファイルを数えない。
- **R1** (新規回帰): `bun-unit` profile の command (`npm run test`) と PROFILE_RUNNERS
  (`node scripts/run-vitest-snapshot.ts`) が別の起動形へ分岐 (変更前は一致)。
- **R2** (新規回帰): `vitest-browser-playwright` runner の `"--"` は消費者不在で vitest へ
  素通しされる (実害は判別実験不定のまま)。
- **種別 3**: FLAG 原文の永続証跡不在 (本ファイルで解消)。

## 是正 (本 commit)

- A-4': BUN_GLOBAL_PATTERN へ typeof / 末尾 `.Bun` / globalThis / process.versions.bun 形を
  追加し、live 3 サイトを Issue #134 debt として pin 付き収載。U-RPORT-016 に負例 4 件追加。
- A-2': allowlist を `Map<path, pinned count>` 化。pin 超過行は収載ファイルでも fail-close
  (U-RPORT-018)。pin は実測値で固定し、増加は Issue #134 帰属注記を要する。
- R1: `bun-unit` / `vitest-browser-playwright` の command を PROFILE_RUNNERS と同一の
  snapshot runner 起動形へ統一。
- R2: runner args から `"--"` を除去。

## 第 3 ラウンド (対象 HEAD d468d61e、verdict FLAG → 是正)

- A-4' / R1 / R2 / 種別 3 は閉塞確認 (レーン B は PASS、新規回帰なし)。
- **F** (blocking): `tests/setup.test.ts` の spawn pin=1 が実サイト 0 に対する空枠で、
  1 行の新規 bun spawn が素通りする (実ファイル実証 violations=0)。→ 空 pin 枠を撤去。
- **G** (設計限界): count-pin は純増のみ検出し、同数 swap (debt 除去 + 新規追加の同居) は
  静的に見えない。→ source の限界注記へ明文化し、burn-down PR での pin 実測追随減算を
  レビュー規律とする。サイト同一性の機械追跡 (AST 化) は Issue #134 後続へ帰属。
- 非 blocking 注記: `globalThis["Bun"]` / `process.versions["bun"]` の文字列 key 形は
  quote lookbehind の副作用で対象外 (限界注記へ明文化)。command と PROFILE_RUNNERS の
  一致を将来強制する gate は未整備 (再乖離は無音で起きうる — 後続論点)。
