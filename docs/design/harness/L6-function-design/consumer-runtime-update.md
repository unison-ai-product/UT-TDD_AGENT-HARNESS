---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_consumer_runtime_update
pair_artifact: docs/test-design/harness/L7-consumer-runtime-update-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 930
---

> **L6 contract marker (草案 WIP)**: 本書は consumer の main root で runtime の版を上げる入口 (setup の流し直し) と、active pointer の切り替え、失敗時の挙動、旧 generation の保持を凍結する予定の草案である。pair-freeze 前であり、oracle ID は対の L7 に `CANDIDATE-U-RTUPD-*` として仮採番。#481 (自動検出・rollback ほか) の範囲は §8 に分け、切り替えの方式は本書を #481 が再利用する。行番号は 2026-11-26 の `origin/main` で測った。

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

launcher は pointer の 3 つの key (`bundle_digest`・`bundle_path`・`entry_path`) と、marker / consumer receipt / history / operation の検証を内蔵する (`src/setup/consumer-node-runtime.ts:637-701`)。新 Release の launcher 出力 (`renderConsumerNodeWrapper`) が旧 launcher と byte 同一なら据え置く。差があり、旧 launcher が新 bundle の pointer・receipt・history を検証できない (key 集合や記録の形が変わる) 場合は、**切り替えの前に** 既存の検証失敗の符号で拒否する (§9 決定 b。新しい符号は足さない)。どの差を互換とするかの細部は、凍結前の実測 2 (§10) の結果で確定する。

## 10. 凍結前の実測 (control の指示、実行はいずれも未実施)

1. **linked worktree を cwd にして `setup --solo --consumer-runtime-release` を流したとき、いまは拒否されるか**: 静読は済み (§10.1)。実行による確認は未実施。
2. **新旧 Release 間の launcher 互換の起動試験**: 未実施。旧 launcher で新 bundle が起動するか、launcher の byte 差の有無を、実際の Release で確かめる。
3. **Windows の EPERM の再現**: 未実施。開いた launcher プロセスがある間の rename で `:1204` が失敗し、旧 pointer と mode が保たれるかを確かめる。

### 10.1 実測 1 の静読の結果 (実行していない)

`origin/main` のコードを読んだ範囲の結論である。

- `setup --solo --consumer-runtime-release` の入口 (`src/cli.ts:3598-3615`) に、linked worktree の判定は無い。`--worktree` を使わないので `handleConsumerWorktreeSetupOption` (`src/cli.ts:3592`、`src/setup/consumer-worktree-cli.ts:46`) は即 `false` を返し、worktree 用の経路 (main の pin の検査) を通らない。`installConsumerRuntimeRelease` へ `expectedPin` も渡されない (`src/cli.ts:3609-3615`)。`expectedPin` が無いので `assertConsumerRuntimePinMatches` は何も検査しない (`src/setup/consumer-worktree-runtime.ts:66-79`、`src/setup/index.ts:346-351`)。
- したがって **入口では拒否されない**。拒否が起きうるのは `src/setup/index.ts:359` の `hasActiveConsumerRuntime` が真のとき (worktree に既に runtime が入っているとき) だけで、別の版なら `consumer_runtime_update_unsupported` (`:524` / `:534` / `:548`)。
- worktree に runtime がまだ無ければ、`:359` の分岐に入らず **通常の新規 install が走る**。`mainWorktreeCommonDir` は linked worktree では `null` を返すので (`src/setup/consumer-worktree-runtime.ts:171-178`)、共有キャッシュには複製されない (`src/setup/consumer-runtime-install.ts:49-50`、`:197-198`)。つまり、**main の pin と無関係な版を worktree へ直接入れられる可能性がある**。
- 含意: 版上げで `:524` / `:534` の拒否を「main root では通す」に緩めるとき、判定を main root に限らないと、worktree の既存 runtime への上書きが通ってしまう。§9 決定 b の「入口での 1 回の判定と明示の引数」が必要な根拠である。runtime の無い worktree への直接 install が実際に通るかは実行で確かめていない (実測 1 の実行側)。通るなら別の問題であり、確認結果を #930 に残して worktree の別 Issue (§9 決定 a) へ渡す。本書は扱わない。
