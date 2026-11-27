---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_consumer_runtime_update
pair_artifact: docs/test-design/harness/L7-consumer-runtime-update-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 930
---

> **L6 contract marker**: 本書は consumer の main root で runtime の版を上げる入口 (setup の流し直し) と、active pointer の切り替え、失敗時の挙動、旧 generation の保持を凍結する契約である。oracle ID は対の L7 に `CANDIDATE-U-RTUPD-*` として仮採番のまま置く (共有 L7 への正式採番は別 PR)。#481 (自動検出・rollback ほか) の範囲は §8 に分け、切り替えの方式は本書を #481 が再利用する。行番号は 2026-11-26 の `origin/main` で測った。

# consumer runtime の版上げ — 関数設計 (issue #930)

## 1. 目的

現状、consumer が runtime の別の版を入れようとすると `consumer_runtime_update_unsupported` で拒否される (`src/setup/index.ts:524` / `:534` / `:548`)。版上げの経路が無いため、Pack の新しい版へ移れない。本書は、main の consumer root で、手元の Release asset と外部 anchor を使って `setup` を流し直すと、digest 検証の後に active pointer が新 generation へ切り替わる契約を凍結する。#481 (自動化) の土台として、旧 generation の bundle は消さずに残す。

経緯: 2026-10-13 に PO 判断で中断され、2026-11-26 に PO が版上げ自動化の順番 #930 → #481 → #1792 を承認して再開した (#930 の control コメント、2026-11-26 20:35)。

## 2. 範囲

- **対象**: consumer の **main root** (linked worktree ではない root) の `setup --solo --consumer-runtime-release <dir> --expected-consumer-digest <digest>` の再実行。入力は従来どおりオフラインの Release directory と外部 anchor だけである。
- **対象外**: §8 の #481 の項目、linked worktree への版上げ (§6)。ネットワーク取得はしない。

## 3. 版上げの流れ

1. 既存の Release 検証 (`verifyConsumerRuntimeReleaseAssets`) を、外部 anchor の digest に対して新 asset に実行する。検証に失敗したら何も書かずに終わる (既存の失敗符号を維持)。
2. 新 generation の bundle を、旧 generation と別の path へ実体化する (`generation_id` が bundle の置き場を分ける)。旧 bundle には書かない。
3. 新 bundle の identity・receipt・ファイル digest を、新規 install と同じ検査で確かめる。
4. 上の全てが成功した後にだけ、active pointer (`.ut-tdd/runtime/activation/active.json`) を新 generation へ切り替える。切り替えは 1 回の atomic な置き換え (同一 directory の一時ファイル + rename) とし、半端な内容の pointer を観測させない。
5. launcher (`.ut-tdd/bin/ut-tdd.mjs`) は pointer を介して bundle を解決するので、版上げで launcher を書き換えない (互換の判定は §9.1)。
6. 同じ版 (release_id・artifact_set_digest・compiled_esm_digest・generation_id が全て一致) の再実行は、従来どおり `already-installed` の idempotent とする。

### 3.1 契約上の関数シグネチャ

版上げが依存・新設する関数を次に挙げる (名前は契約上のもの。既存は実装済みの名前、新設は本書が足す)。

- `verifyConsumerRuntimeReleaseAssets(assets, anchorDigest) => VerifiedRelease`: 既存。外部 anchor の digest に対して新 asset を検証する。失敗は既存の検証失敗の符号 (§3 手順 1、§9 決定 b)。
- `isLinkedWorktreeCheckout(root) => boolean`: 既存。setup の入口で 1 回だけ main root か否かを判定し、結果は明示の引数で下層へ渡す (§9 決定 b)。
- `installConsumerNodeRuntime(input, isMainRoot) => InstallResult`: 既存の setup の本体に、判定済みの `isMainRoot` を渡すよう拡張する。main root では別の版を `updated` として通し、worktree に別の版がある場合だけ `consumer_runtime_update_unsupported` で拒否する。同じ版の再実行は `already-installed` (§3 手順 6、§9 決定 b)。
- `assertLauncherCompatible(priorBundle, newBundle) => void` (新設): bundle のファイル集合と history の field の形式が変わらないことを、切り替えの前に確かめる。非互換は既存の検証失敗の符号で拒否する (§9.1)。
- `publishActivePointer(activation, newBundle) => ActivePointerResult` (新設): 手順 4 の atomic な置き換え (一時ファイル + rename)。rename の前の失敗は旧 pointer と mode を保つ。復元できない失敗と rename の後の失敗は `consumer_runtime_indeterminate` (§4、§9 技術 4)。
- `deriveOperationId(tag, generationId) => string`: 既存。`hash(tag + NUL + generationId)` の決定的な生成を新 generation でも使う (§9 技術 2)。

- pre: Release の検証に成功している。新 bundle の identity・receipt・ファイル digest の検査に成功している (§3 手順 1〜3)。同じ `release_id` で artifact が違う入力は拒否する (§9 技術 3)。
- post: 成功時は active pointer が新 generation を指し、旧 generation の bundle は byte 同一のまま残る (§5)。失敗時 (indeterminate を除く) は consumer tree が実行前と同一である (§4)。

## 4. active pointer の切り替えと失敗時の挙動

- 失敗は手順 1〜3 のどこでも起こりうる。手順 4 の前に失敗した場合、active pointer は旧 generation を指したままで、consumer tree は実行前と同一である (新 bundle の書きかけは巻き戻す)。
- 手順 4 の rename 自体が失敗した場合も旧 pointer のまま。新 bundle は残さず片付ける。片付けの失敗は偽って成功とせず `consumer_runtime_indeterminate` で fail-close する (`consumer-worktree-runtime.md` §5 の restore 失敗と同じ扱い)。
- 切り替え後の起動検証 (新 version で `status` が動くか) は本書では扱わない。失敗時の自動 rollback は #481 である。

## 5. 旧 generation の保持

- 切り替え後も、旧 generation の bundle・receipt・identity は消さない。これが #481 の rollback の土台である (rollback は pointer を旧 generation へ戻すだけで済む)。
- 保持する世代数の上限と、古い世代の掃除 (GC) は #481 で決める。本書は掃除をしない。
- 旧 bundle は不変であり、版上げが旧 bundle のバイトを 1 つも変えないことを oracle にする。

## 6. worktree の扱い

- linked worktree は main の pin に従い続ける (`consumer-worktree-runtime.md` §3・§5「入れる版は main の active pointer の版と常に一致する」)。
- main が新 generation へ切り替わった後、既に別の版が入っている worktree へ `setup --worktree` を流すと、従来どおり `consumer_runtime_update_unsupported` で拒否される。この符号は「worktree に別の版がある」専用として残す (§9 決定 b)。
- **main と版が合わない worktree は旧版のまま動く**。main の pointer 切り替えは worktree の `.ut-tdd/runtime/` にも共有キャッシュの既存 generation にも触れないので、切り替え後の worktree は旧 generation の bundle と launcher で従来どおり起動する。版を揃える手段は本書にも #481 にも無い。worktree を新 pin へ追従させる更新手段は、`consumer-worktree-runtime.md` §3-5 と凍結 oracle `U-CWTRT-005` の改訂そのものなので、**別 Issue** にする (§9 決定 a)。起票は本書の PR の後に control が行う。
- 共有キャッシュ (`<git-common-dir>/ut-tdd/runtime-cache/`) への新版の複製は、`consumer-worktree-runtime.md` §3 の既存の契約 (main の setup が検証に成功したときに複製) のままとする。

## 7. 改訂が必要な凍結 oracle・文書

| path:line | 現状 | 新しい期待 |
| --- | --- | --- |
| `tests/pack-consumer-runtime-release.test.ts:2224` (main root に別の tag の Release を setup し直す) | `consumer_runtime_update_unsupported` で非 0、consumer tree が実行前と同一 | 検証に成功した新 Release なら exit 0 で、active pointer が新 generation を指し、旧 generation の bundle が byte 同一のまま残る。失敗系は別の oracle (対の L7 §3 の `CANDIDATE-U-RTUPD-*`) で足す |
| `tests/consumer-worktree-setup-red.test.ts:470` (`U-CWTRT-005` の worktree 側、`it` は :462) | worktree で `consumer_runtime_update_unsupported` | **改訂しない**。worktree の拒否を維持する oracle として残す |
| `docs/test-design/harness/L7-pack-consumer-runtime-release-install-test-design.md:32` の `CANDIDATE-U-PACKRT-010` | 別 tag の Release を `consumer_runtime_update_unsupported` で拒否し、更新は #364 とする | 期待を「main root では版上げが成功し pointer が切り替わる。拒否は worktree に別の版がある場合に限る」へ改める。#364 への参照は #930 / #481 に置き換える。共有の L7 文書なので、改訂は #2016 の merge 後 (§10 の後続) |
| `docs/reference/setup-guide.md:90-91` (「いまの canary 版の制約」の 2 項目目)、`:93-122` (「新しい clone へ入れ直す手順」とその注意 `:95`・`:113-114`・`:122`)、`:143` (トラブルシュート表)、`:193` (符号の表) | 「新しい版で上書きできない。新しい clone へ入れ直す」「`consumer_runtime_update_unsupported` はすでに別の版が入っている」 | main root では setup の流し直しで版を上げられる手順へ改める。`consumer_runtime_update_unsupported` の説明を「worktree に別の版がある場合」へ絞る。Green の PR と同時に改める |
| `docs/design/harness/L6-function-design/consumer-worktree-runtime.md:28` | 「既に別の版が入っている repo へ違う版を入れると拒否される (#930)」 | #930 は main root の版上げに限ると明記する (worktree の拒否は維持) |

control の指示にあった `setup-guide.md` の `:108`・`:158` は、2026-11-27 の `origin/main` では版上げに関係しない行 (動作確認の注意と手順 1 の見出し) だった。該当は上の行番号である。

`src/setup/index.ts:524` / `:534` / `:548` の拒否は、「main root での、検証済みの別 generation」では通し、worktree 経路と、検証に落ちた入力では拒否のまま残す。判定の分け方は §9 決定 b に従う。

設計書保護の三段階 (`CLAUDE.md` §PR スコープ規律 5) に従い、上の oracle は契約 PR → Red (`it.fails`) → Green の順で改める。共有文書 (`function-spec.md`、L7 test-design) への追記は #2016 (#1970 の契約) の merge 後に出す。

## 8. #481 で扱うこと (本書の範囲外)

- channel の検出 (新しい版があるかの判定)。
- plan → 承認 → apply の段取り。
- remote からの取得 (**高影響境界**: 外部 API・ネットワーク前提の変更であり、設計の時点で PO の承認を取る)。
- 自動 rollback (切り替え後の起動検証と、失敗時に pointer を旧 generation へ戻すこと)。
- state migration (版をまたぐ状態の移行)。
- updater 自身の更新。
- 旧 generation の保持数と GC。
- 版の順序の判定と、「明示しない downgrade の拒否」(§9 決定 c)。

切り替えの方式 (§3・§4) は #481 が本書をそのまま使い、二重に決めない。

## 9. 採択した決定 (2026-11-27 control、#930 コメント)

設計 3 点は Fable (design)、技術 4 点は Sol (implementation) に掛け、control が採択した。引用の行番号は 2026-11-27 の `origin/main` で確かめた。control のコメントの範囲とずれた箇所は注記した。

**設計**

- **(a) worktree の追従**: 追従手段は別 Issue。本書は「main と版が合わない worktree は旧版のまま動く」と明記し、oracle を 1 本足す (§6、対の L7 `CANDIDATE-U-RTUPD-006`)。
- **(b) 拒否の符号**: 新しい符号は足さない。`consumer_runtime_update_unsupported` は「worktree に別の版がある」専用として残す。main で検証に落ちた入力は既存の検証失敗の符号で落ちる。main root か否かは setup の入口で 1 回だけ、既存の `isLinkedWorktreeCheckout` (git-dir ≠ git-common-dir、`src/memory/project-memory-root.ts:174-186`) の事実から判定し、明示の引数で下へ渡す。下層 (`src/setup/index.ts:524` / `:534` の検査) は git を再判定しない。
  - 注記: `src/setup/consumer-worktree-runtime.ts:171-178` の `mainWorktreeCommonDir` も同じ判定 (git-dir と common-dir の一致) を持つ。実装時に 2 つを 1 つへ寄せるかは Refactor の段で決める。
- **(c) downgrade**: #930 では拒否しない。`release_id` は hash で順序を持たず、新旧を判定する材料が無い。外部 anchor の digest を人が渡すこと自体が明示指定であり、手動の再 setup は同じ pointer 切り替えの別の入口とする。順序と「明示しない downgrade の拒否」は #481 の契約のまま (§8)。

**技術**

1. **launcher**: 既存 launcher と互換な更新に限り据え置く。非互換なら **切り替えの前に** 拒否する。launcher に版の固定は無く、pointer から entry を解決する (`src/setup/consumer-node-runtime.ts:628-642`。pointer の読みは `:637`、`spawnSync` は `:702`)。ただし receipt / history の検証ロジックを内蔵する (`:697-701`) ので、互換性の判定を契約に書く (§9.1)。行は control の範囲 (`:628-642,702`) と一致した。
2. **`operation_id`**: 既存の決定的な生成 `hash(tag + NUL + generationId)` (`src/setup/consumer-runtime-install.ts:104-107`) を新 generation でも使う。ランダム採番や旧 ID の流用はしない。旧との連続性は `prior_bundle_digest`・`prior_history_tip_digest`・history の sequence で束縛する (`src/setup/consumer-node-runtime.ts:298-315`。実測の該当は `:301-303` と `:307-314`)。
3. **同じ `release_id` で artifact が違う場合**: #930 では拒否し、新しい `release_id` を求める。consumer が `generation_id` を採番し直して通してはいけない (`src/setup/consumer-runtime-release.ts:403-407`、`generation_receipt_mismatch`。同じ検査が `:517` にもある)。
4. **Windows の EPERM**: 自動で再試行しない。rename の前の失敗なら旧 pointer と mode を保って失敗を返す。復元できない場合と rename の後の失敗は indeterminate とする (`src/setup/consumer-node-runtime.ts:1186-1217`。fault 注入点 `atomicRenameActivePointerCAS` は `:1203`、rename は `:1204`。control の範囲 `:1188-1217` は pointer の temp 書き込み (`:1186`) の 2 行後から始まっていたので、`:1186` から数えた)。

### 9.1 launcher の互換判定

launcher は pointer の 3 つの key (`bundle_digest`・`bundle_path`・`entry_path`) を読み、bundle の 7 ファイルの存在と、marker / consumer receipt / history / operation の検証 (`history_sequence`・`prior_bundle_digest`・`history_tip_digest` の形式を含む) を内蔵する (`src/setup/consumer-node-runtime.ts:637-701`)。

- **互換の定義**: 版上げが、(1) bundle のファイル集合 (7 ファイル) を変えず、(2) launcher が検査する history の field の形式を変えないこと。この 2 つを満たす更新に限り、launcher は据え置く。
- **非互換の扱い**: どちらかを変える Release は、**切り替えの前に** 既存の検証失敗の符号で拒否する (§9 決定 b。新しい符号は足さない)。
- **観測 (固定値ではない)**: 公開済みの canary.8 と canary.9 の asset では、`.ut-tdd/bin/ut-tdd.mjs` の bytes が同一だった (11310 bytes、sha256 `3b1c3d67…`、control の実測、2026-11-27)。launcher は版に依らない汎用の実装で、版ごとの違いは bundle 側の `ut-tdd.mjs` にある。この sha256 は観測であり、契約の定数にしない (launcher の実装が変われば値は変わる)。互換の判定は byte 同一ではなく、上の定義で行う。
- **版の同一性の確かめ方**: `active.json` は `bundle_digest`・`bundle_path`・`entry_path` だけを持ち、`bundle_digest` は導入先の path を含む。同じ版でも導入先ごとに値が違うので、**版の同一性の判定に `bundle_digest` を使わない**。bundle の `ut-tdd.mjs` の bytes (compiled ESM の digest) か receipt で確かめる。対の L7 の 001・006・009 はこの方法で版を見る。

## 10. 凍結前の実測

control の実測 (使い捨ての consumer、公開済みの canary.8 と canary.9 の asset、Node v24、2026-11-27、#2018 と PR #2017 のコメント) の結果である。

1. **linked worktree を cwd にした `setup --solo --consumer-runtime-release`**: **確認済み**。入口で拒否されず、worktree に main と違う版が入る (§10.1)。
2. **新旧 Release 間の launcher の互換**: **完了**。launcher は canary.8 と canary.9 で byte 同一で、canary.8 から canary.9 の範囲では据え置きが成り立つ (§9.1)。
3. **Windows の EPERM の再現**: **再現していない**。契約の決定 (自動で再試行しない、rename の前の失敗は旧 pointer と mode を保つ、復元できない場合と rename の後の失敗は indeterminate) は変えず、対の L7 の Windows の oracle (`CANDIDATE-U-RTUPD-003`) で固定する。実 OS の再現は Green の段で、その oracle が実 Windows で通ることをもって確かめる。

### 10.1 実測 1 の結果: 確認済み、#2018 で塞ぐ

- 静読 (`src/cli.ts:3598-3615` に linked worktree の判定が無く、`expectedPin` も渡されない。`src/setup/consumer-worktree-runtime.ts:66-79` の pin 検査は何もしない) が示した仮説は、実行で確認された (#2018)。
  - A: main に何も入れず linked worktree の中から実行すると、入口で拒否されず、worktree に `active.json` と bundle が作られた。
  - B: main に入れた後、新しい linked worktree の中から実行しても拒否されず、worktree に独立した `.ut-tdd/` 一式ができた。main の pin と照合した形跡は出力に無い。
  - C: main に canary.8 を入れ、linked worktree の中から canary.9 を入れると、`consumer_runtime_update_unsupported` は出ず、worktree の bundle の `ut-tdd.mjs` は canary.9 と同じ bytes で、main は canary.8 のまま。**worktree が main の pin と違う版で動く状態を作れる**。`active.json` に release の digest が無く、照合はどこにも出ない。
  - D: canary.8 の main root で canary.9 を入れると `consumer_runtime_update_unsupported` で拒否され (exit 1)、`active.json` の sha256 は前後で同じ。main root の拒否は効いている。
- 終了コード 2 は origin remote が無いための `identity_repository_unbound` で、worktree と関係なく main でも同じ。runtime の導入はその前に済んでおり取り消されない。
- **#930 の Green の前提**: **#2018 の修正を #930 の Green の前提に置く**。#2018 は、setup の入口で linked worktree かを git の事実 (§9 決定 b の判定) から判定し、worktree からの `--consumer-runtime-release` の導入を塞ぐ。#930 が main root の拒否 (`:524` / `:534`) を開ける前に、この穴が塞がっていなければならない (開けると、worktree の既存 runtime への版違いの上書きが通る)。
- 対の L7 の `CANDIDATE-U-RTUPD-005` (worktree の拒否の維持) と `006` (main と版が合わない worktree は旧版のまま動く) は、#2018 の修正後の挙動と整合させる。005 は worktree を cwd にした `setup --solo --consumer-runtime-release` が、runtime の有無にかかわらず入口で拒否されることを含む。
