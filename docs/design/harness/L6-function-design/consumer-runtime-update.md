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

> **L6 contract marker (草案 WIP)**: 本書は consumer の main root で runtime の版を上げる入口 (setup の流し直し) と、active pointer の切り替え、失敗時の挙動、旧 generation の保持を凍結する予定の草案である。pair-freeze 前であり、oracle ID は未採番。#481 (自動検出・rollback ほか) の範囲は §8 に分け、切り替えの方式は本書を #481 が再利用する。行番号は 2026-11-26 の `origin/main` で測った。

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
5. launcher (`.ut-tdd/bin/ut-tdd.mjs`) は pointer を介して bundle を解決するので、版上げで launcher を書き換えない (未決 1 を参照)。
6. 同じ版 (release_id・artifact_set_digest・compiled_esm_digest・generation_id が全て一致) の再実行は、従来どおり `already-installed` の idempotent とする。

## 4. active pointer の切り替えと失敗時の挙動

- 失敗は手順 1〜3 のどこでも起こりうる。手順 4 の前に失敗した場合、active pointer は旧 generation を指したままで、consumer tree は実行前と同一である (新 bundle の書きかけは巻き戻す)。
- 手順 4 の rename 自体が失敗した場合も旧 pointer のまま。新 bundle は残さず片付ける。片付けの失敗は偽って成功とせず `consumer_runtime_indeterminate` で fail-close する (`consumer-worktree-runtime.md` §5 の restore 失敗と同じ扱い)。
- 切り替え後の起動検証 (新 version で `status` が動くか) は本書では扱わない。失敗時の自動 rollback は #481 である。

## 5. 旧 generation の保持

- 切り替え後も、旧 generation の bundle・receipt・identity は消さない。これが #481 の rollback の土台である (rollback は pointer を旧 generation へ戻すだけで済む)。
- 保持する世代数の上限と、古い世代の掃除 (GC) は #481 で決める。本書は掃除をしない。
- 旧 bundle は不変であり、版上げが旧 bundle のバイトを 1 つも変えないことを oracle にする。

## 6. worktree の拒否は維持する

- linked worktree は main の pin に従い続ける (`consumer-worktree-runtime.md` §3・§5「入れる版は main の active pointer の版と常に一致する」)。
- main が新 generation へ切り替わった後、既に別の版が入っている worktree へ `setup --worktree` を流すと、従来どおり `consumer_runtime_update_unsupported` で拒否される。worktree 側の版上げ (main の新 pin へ追従させる更新) は本書でも扱わない (未決 2)。
- 共有キャッシュ (`<git-common-dir>/ut-tdd/runtime-cache/`) への新版の複製は、`consumer-worktree-runtime.md` §3 の既存の契約 (main の setup が検証に成功したときに複製) のままとする。

## 7. 改訂が必要な凍結 oracle

| path:line | 現状 | 新しい期待 |
| --- | --- | --- |
| `tests/pack-consumer-runtime-release.test.ts:2224` (main root に別の tag の Release を setup し直す) | `consumer_runtime_update_unsupported` で非 0、consumer tree が実行前と同一 | 検証に成功した新 Release なら exit 0 で、active pointer が新 generation を指し、旧 generation の bundle が byte 同一のまま残る。失敗系 (digest 不一致・anchor 不一致・切り替え前の障害注入) では非 0 で pointer と tree が実行前と同一 (旧版のまま) の oracle を別に足す |
| `tests/consumer-worktree-setup-red.test.ts:470` (`U-CWTRT-005` の worktree 側) | worktree で `consumer_runtime_update_unsupported` | **改訂しない**。worktree の拒否を維持する oracle として残す。main が新 generation になった後の同じ拒否を確かめる 1 本を足すかは未決 2 |

`src/setup/index.ts:524` / `:534` の拒否は、「main root での、検証済みの別 generation」では通し、worktree 経路と、検証に落ちた入力では拒否のまま残す。判定の分け方 (main root か否かをどこで持つか) は L6 の関数設計で確定する (未決 3)。

設計書保護の三段階 (`CLAUDE.md` §PR スコープ規律 5) に従い、上の oracle は契約 PR → Red (`it.fails`) → Green の順で改める。共有文書 (`function-spec.md`、L7 test-design) への追記は #2016 (#1970 の契約) の merge 後に出す。

## 8. #481 で扱うこと (本書の範囲外)

- channel の検出 (新しい版があるかの判定)。
- plan → 承認 → apply の段取り。
- remote からの取得 (**高影響境界**: 外部 API・ネットワーク前提の変更であり、設計の時点で PO の承認を取る)。
- 自動 rollback (切り替え後の起動検証と、失敗時に pointer を旧 generation へ戻すこと)。
- state migration (版をまたぐ状態の移行)。
- updater 自身の更新。
- 旧 generation の保持数と GC。

切り替えの方式 (§3・§4) は #481 が本書をそのまま使い、二重に決めない。

## 9. 未決

1. **launcher の更新**: launcher の内容が版で変わる場合 (`renderConsumerNodeWrapper` の出力差) に、launcher を pointer と同時に切り替える必要があるか。pointer 経由なら不要だが、launcher の version 固定の有無を実測してから決める。
2. **worktree の追従**: main の版上げ後に、既存 worktree をどう新 pin へ揃えるか。本書は拒否の維持までで、追従の更新手段は #481 か別 Issue か。
3. **拒否の分け方**: `consumer_runtime_update_unsupported` を「worktree 経路」専用の符号として残すか、新しい符号 (例: 版上げ未検証) を足すか。main root か否かの判定の置き場。
4. **版の下げ (downgrade) の扱い**: より古い release の setup を版上げと同じ経路で通すか、拒否するか (rollback は #481 だが、手動の再 setup で古い版が入りうる)。
5. **identity / receipt の `operation_id`**: `src/setup/index.ts:521` は `operation_id` の不一致も update 拒否としている。新 generation では `operation_id` を新規採番するか、旧と同一性をどう束縛するか。
6. **`generation_id` の採番**: 同一 `release_id` で artifact が変わった場合の generation の扱い。
7. **atomic 切り替えの Windows での挙動**: 開いている launcher プロセスがある間の rename 失敗 (EPERM) の再試行方針。
