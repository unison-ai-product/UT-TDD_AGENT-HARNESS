---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_consumer_worktree_runtime
pair_artifact: docs/test-design/harness/L7-consumer-worktree-runtime-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1525
---

> **L6 contract marker**: 本書は consumer の linked git worktree へ runtime を入れる入口、runtime が無いときの guard 失敗の案内、および新規 install の launcher 公開前失敗に対する transaction rollback を凍結する (未実装の目標契約)。版の更新と別の版へのロールバックは #930 / #481 の範囲であり、本書は扱わない。oracle (`U-CWTRT-001`〜`010`) は `docs/test-design/harness/L7-consumer-worktree-runtime-test-design.md` が固定し、導入途中の rollback 境界の候補 oracle は同書が `CANDIDATE-U-CWTRT-011` として定義する。行番号は 2026-11-04 の `origin/main` で測った。

# consumer worktree の runtime 入口 — 関数設計 (issue #1525)

## 1. 目的

consumer は runtime と launcher (`.ut-tdd/bin/ut-tdd.mjs`) を commit しない。1 チケット 1 worktree の運用では、新しい worktree を切るたびに両方が無く、Claude Code の PreToolUse guard (agent-guard / work-guard) が `MODULE_NOT_FOUND` で落ちる。#1521 で guard に `onFailure: "block"` が入ると、runtime の無い worktree は編集も subagent も止まり、エラー文から復旧の手順に着けない。本書は (1) worktree 用の入口と (2) 止まったときの案内を凍結する。consumer の実運用で、利用者が版・digest を固定した自作 script を worktree ごとに流している事実が観測されている (#1525)。

## 2. 前提 (実測)

| 前提 | 根拠 |
| --- | --- |
| launcher は `renderConsumerNodeWrapper()` が生成し、`.ut-tdd/bin/ut-tdd.mjs` へ書かれる。active pointer (`.ut-tdd/runtime/activation/active.json`) が無いと `consumer_runtime_absent` の符号だけを stderr に出して exit 78 で終わる (案内文は無い)。#1525 の時点の実測であり、現行の契約は §4・§5 (absent は exit 2 と案内、#1602 で hook の種類による三分割) | `src/setup/consumer-node-runtime.ts:628-640`、`src/setup/index.ts:762` |
| launcher は bundle の `identity.consumer_root` / `runtime_root` が自身の位置と一致することを検査し、子プロセスの cwd を launcher の持ち主の root に固定する。bundle は worktree ごとの identity に束縛され、別 checkout からのコピーは通らない | `src/setup/consumer-node-runtime.ts:660-663`、`:725` |
| runtime の導入は `setup --solo --consumer-runtime-release <dir> --expected-consumer-digest <digest>` (オフラインの Release directory + 外部 anchor) だけで、`--worktree` に相当する入口は無い。cwd の realpath を consumer root として使う | `src/cli.ts:4036-4050`、`:4100-4118` |
| 既に別の版が入っている repo へ違う版を入れると `consumer_runtime_update_unsupported` で拒否される | #930 |
| guard は block を stderr + exit 2 で返し、メッセージ本文は `process.stderr.write(decision.message)` で出る。stdin 読み取り・JSON 解析の失敗も同じ経路 (exit 2) である | `.claude/hooks/agent-guard.ts:34-49`、`:70` |
| consumer 用の guard の argv は `.ut-tdd/bin/ut-tdd.mjs hook <guard>` で、launcher 自体が無いと node が `MODULE_NOT_FOUND` (exit 1、スタック) を出す。その場では案内文を出せる主体が存在しない | `src/lint/project-hook.ts:68-97` |
| entrypoint 欠落時の launcher は exit 127 で fail-close する、と oracle `U-HOOKEXEC-008` が宣言している (現実装の absent は exit 78 である。§5 の最後の項目の表で exit 2 に揃える) | `docs/design/harness/L6-function-design/function-spec.md:2310` |

## 3. 決定 1: worktree の入口 (`setup --worktree`)

既存の `setup` コマンドへ option `--worktree <path>` を足す (別コマンドは作らない。最小実装原則)。`<path>` は runtime を入れる linked worktree の絶対パスである。path を必須にする理由は、main worktree の launcher から実行しても launcher が cwd を main の root に固定する (§2) ため、cwd では対象を指せないからである。

1. **対象の判定**: `git rev-parse --git-dir` と `--git-common-dir` を `<path>` で解決し、両者が異なるときだけ linked worktree とする。main worktree (一致する) と git 管理外の path は、何も書かずに typed error `worktree_entry_not_linked` で拒否する (no-op にしない。main への誤実行を成功に見せないため。main の導入は従来の `setup --solo --consumer-runtime-release` のまま)。
2. **正本の版**: main worktree (`git-common-dir` の親) の active pointer が指す bundle manifest の `identity` から `release_id` / `artifact_set_digest` / `compiled_esm_digest` を読む。これが worktree へ入れる唯一の版である。main に有効な activation が無いときは、書き込みなしで `worktree_entry_main_not_activated` を返し、先に main で setup するよう案内する。
3. **共有キャッシュ**: 検証済みの Release directory は `<git-common-dir>/ut-tdd/runtime-cache/<cache_key>/` に置く。`cache_key` は `release_id` (`rel-sha256:` + 小文字 hex 64 桁、`src/schema/release-manifest.ts` の `RELEASE_ID`) から固定 prefix を除いた hex 64 桁である。`release_id` は `:` を含み Windows ではディレクトリ名にできないため、そのまま path にしない。schema が prefix と桁数を固定しているので `release_id` と `cache_key` は 1 対 1 であり、衝突も復号の曖昧さも無い。main の identity の `release_id` が schema に合わなければ、key を作らず (ディレクトリも作らず) `worktree_entry_main_not_activated` で拒否する。キャッシュのディレクトリ名は信用の根拠にしない。中身の identity の `release_id` が key と合わない場合は、手順 4 の検証か pin 照合で落ちる。この版より前のキャッシュは存在しない (未実装の機能のため) ので、旧形式の移行は扱わない (worktree の外、`.git` 配下なので commit されない)。main の setup が Release の検証に成功したときにここへ複製する。`--worktree` はこのキャッシュだけを入力にする。キャッシュに無ければ `worktree_entry_cache_missing` で拒否し、`--consumer-runtime-release <dir> --expected-consumer-digest <digest>` を併記したときだけ、従来どおり検証したうえでその directory を使う。**ネットワークからの取得はしない。**
4. **検証と導入**: キャッシュの asset を既存の Release 検証 (`verifyConsumerRuntimeReleaseAssets`) に通し、新しい worktree を consumer root として runtime を実体化する (identity は worktree ごとに作り直される)。導入後の identity の `release_id` / `artifact_set_digest` / `compiled_esm_digest` が手順 2 の値と 1 つでも違えば、書いたものを巻き戻して `worktree_entry_pin_mismatch` を返す。改ざんされたキャッシュは検証か pin 照合のどちらかで必ず落ちる。
5. **pin を変えない**: main の active pointer、キャッシュ、他の worktree には書かない。違う版を入れる経路は無い (版の更新は #930 / #481)。worktree に別の版が既にあるときは `consumer_runtime_update_unsupported` のままにする。
6. **成功時**: launcher (`.ut-tdd/bin/ut-tdd.mjs`) と runtime が worktree に揃い、guard が動く。成功の出力は導入した版と digest の 1 行である。

## 4. 決定 2: runtime が無いときの案内

案内は「実行すべきコマンドを 1 つ名指しする 1 つの文」で、guard の block 理由として Claude Code の UI へ届く。届く経路は既存の guard と同じ stderr + exit 2 である (§2)。

- **launcher が存在する場合** (2026-11-10 改訂、Issue #1602): `consumer_runtime_absent` のとき、launcher は `process.argv` の launcher の後ろの先頭 2 語で扱いを 3 つに分ける。他の deny 符号 (`consumer_runtime_digest_mismatch` など) は従来どおり符号のみと exit 78 のままで、分岐しない。
  - (a) **guard**: 先頭 2 語が `hook agent-guard` / `hook work-guard`。従来どおり、符号に加えて案内文を stderr に出し、exit 2 (block) で終える。
  - (b) **記録 / session hook**: 先頭 2 語が `session start` / `session summary` / `hook post-tool-use` / `hook claude-memory-wake` / `hook subagent-stop` のいずれか。stderr に符号と案内を 1 行だけ出し、exit 0 (fail-open) で終える。stdout には何も出さない。理由: これらの hook は block を意図しない。Claude Code では Stop / SubagentStop の exit 2 は「停止を阻止し、stderr を Claude に渡して続行させる」意味になり、launcher は stdin の `stop_hook_active` を読まないため、停止のたびに続行が繰り返されうる。PostToolUse の exit 2 も stderr を Claude に返す。さらに stderr が `setup --worktree` の実行指示なので、Claude に setup を実行させる誘導になる。
  - (c) **それ以外** (`status` などの CLI の直接起動、未知の hook 名): 従来どおり案内文と exit 2。exit 0 にしない (runtime が無いのに `status` が成功に見える偽の緑を防ぐ)。
  - (b) の集合の正本は `src/lint/project-hook.ts` の hook 定義 (`wrapperArgs`) のうち、`onFailure: "block"` を持たないものである。launcher の生成時 (`renderConsumerNodeWrapper`) にその集合を埋め込む。launcher の中に別の手書きの一覧を持たない。
  - argv を信頼してよい根拠: guard の argv は project-hook lint が機械で固定している。lint の対象外の利用者独自の hook 登録は (c) に落ちるので、fail-close 側になる。
  - Codex: consumer の `.codex/hooks.json` (setup が `wrapperHookArgs` で生成する) は guard も記録 hook も launcher を直接起動するので、同じ三分割が効く。(b) の exit 0 は hook を素通りさせるだけで、runtime による意味の違いは問題にならない。Codex の guard の exit 2 の扱いは既存のまま変えない。
- **launcher 自体が無い場合**: node の `MODULE_NOT_FOUND` を避けるため、consumer の guard hook (agent-guard / work-guard の 2 つだけ) の起動を、launcher の有無を先に見る固定の起動断片 (`node -e` の短い bootstrap、source は template と lint が共有する定数 1 つ) に置き換える。launcher が無ければ案内文を stderr に出して exit 2、有れば従来どおり launcher を起動する。記録 / session hook (§4 の (b) の集合) は起動断片に置き換えない。launcher が無ければ node の `MODULE_NOT_FOUND` で exit 1 になり、block しない (exit 2 ではない)。launcher はあるが runtime が無い場合は上の (b) により fail-open になる。2026-11-10 改訂 (Issue #1602): 旧文の「fail-open のまま」は、launcher が runtime 欠落で exit 2 を返す経路があったため実際には成り立っていなかった。この三分割で成り立つ形にした。
- **案内文の中身**: この worktree に runtime が無いこと、と次のコマンド 1 つ。`node <main worktree>/.ut-tdd/bin/ut-tdd.mjs setup --worktree <この worktree の絶対パス>`。main worktree の path は `git rev-parse --git-common-dir` から求め、求められなければコマンドの `<main worktree>` を文中で説明する。
- **fail-close は保つ**: guard (a) と CLI の直接起動 (c) の案内は常に非 0 で終わる (exit 2)。案内を出すために exit 0 へ寄せない。exit 0 にするのは (b) の記録 / session hook だけである (2026-11-10 改訂、Issue #1602)。

## 5. 不変条件 (DbC)

- `setup --worktree` は、成功する場合を除き、worktree・main・キャッシュのどれにも何も残さない (失敗時は巻き戻す)。
- 新規 install の transaction は runtime の capture から launcher の公開までを覆う。`installConsumerRuntimeFromSetup` が `result.ok` で成功を返した直後、launcher (`.ut-tdd/bin/ut-tdd.mjs`) を公開する前に、内部だけの optional injection 型 `ConsumerWorktreeSetupFault = (barrier: "afterRuntimePublishBeforeLauncher") => void` が設定されていれば、その barrier で transaction の `try` 内からちょうど 1 回呼ぶ。`setupConsumerWorktreeRuntime` から Release install と runtime-only transaction を通る内部 composition に渡せるようにし、本番の capture/restore を差し替えない。この seam は既定で未設定であり、通常経路の動作を変えない。同期 throw は launcher 公開前の失敗として同じ本番 capture/restore rollback に流し、worktree・main・cache・他 worktree を呼び出し前の状態へ戻す。restore 自体が失敗した場合は復元成功と偽らず `consumer_runtime_indeterminate` で fail-close する。利用者向け CLI / Pack API option や environment variable として公開しない。
- fault seam は新規 install (`status: "installed"`) の境界専用である。Release installer が `already-installed` を返す idempotent 経路では呼ばず、既存 runtime を障害注入 rollback の対象にしない。launcher の通常公開と fault seam が無い場合の成功経路は従来どおりである。
- 入れる版は main の active pointer の版と常に一致する。キャッシュ・引数・環境変数から版を選べる経路は無い。
- guard (a) と CLI の直接起動 (c) の案内の経路は常に exit 非 0 であり、`MODULE_NOT_FOUND` のスタックを block 理由にしない。記録 / session hook (b) は exit 0 で、block にならない (2026-11-10、Issue #1602)。
- **exit code の境界** (Issue #1525、2026-11-05 に確定):

  | 状態 | exit | stderr |
  |---|---|---|
  | active pointer が無い (`consumer_runtime_absent`。launcher が project-local の entrypoint を解決できない場合を含む) × guard (`hook agent-guard` / `hook work-guard`) | 2 | 符号と案内文 (§4 (a)) |
  | 同 × 記録 / session hook (`session start` / `session summary` / `hook post-tool-use` / `hook claude-memory-wake` / `hook subagent-stop`)。2026-11-10 追加 (Issue #1602) | 0 | 符号と案内の 1 行のみ。stdout は空 (§4 (b)) |
  | 同 × それ以外 (`status` などの CLI の直接起動、未知の hook 名)。2026-11-10 追加 (Issue #1602) | 2 | 符号と案内文 (§4 (c)) |
  | launcher 自体が無い (guard の起動断片が検出する) | 2 | 案内文 (§4) |
  | その他の deny 符号 (`consumer_runtime_digest_mismatch` など) | 78 | 符号のみ (従来どおり) |
  | guard が確定 block を返す | 2 | block 理由 (従来どおり) |

  exit 127 は使わない。`U-HOOKEXEC-008` が宣言していた「entrypoint 欠落時は exit 127」は、上の表の 1 行目 (exit 2) に置き換える。宣言とテスト (`tests/hook-native-launcher.test.ts` の `U-HOOKEXEC-008`、現状は 78 を確かめている) は、設計書保護の三段階に従い、#1525 の src を含まない昇格 PR で exit 2 の `it.fails` に改め、Green の実装 PR で `it` に戻す。

## 6. 範囲外

- 版の更新とロールバック (#930 / #481)。
- main worktree 向けの共有 runtime (main は従来の setup のまま)。
- Codex の hook (`.codex/hooks.json`) の新規配線。ただし launcher の三分割 (§4) は Codex が launcher を直接起動する経路にもそのまま効く (Issue #1602)。
- Release asset のネットワーク取得。

## 7. 受け入れ

- 新しい linked worktree で `setup --worktree` を 1 回流せば、guard hook が動く (`U-CWTRT-001` / `002`)。
- runtime の無い worktree で guard が止まったとき、実行すべきコマンドが block 理由として表示される (`U-CWTRT-007` / `008` / `009`)。
- 実際の Claude Code で、runtime の無い worktree の Edit が案内つきで止まることを 1 回確かめた記録を含める。この確認は自動テストの oracle ではない。

## 8. 単位の契約 (DbC)

本書が定める契約上の関数は次の 2 つである (名前は契約上のもので、実装時に既存の `setup` と guard の構造へ合わせる)。

- `setupWorktree(worktreePath) => WorktreeEntryResult`: `setup --worktree <path>` の本体 (§3)。成功は導入した版と digest、失敗は `worktree_entry_not_linked` / `worktree_entry_main_not_activated` / `worktree_entry_cache_missing` / `worktree_entry_pin_mismatch` の typed error。
- `renderRuntimeAbsentGuidance(mainWorktree, worktreePath) => string`: runtime が無いときに guard が stderr へ出す案内文 (実行すべきコマンド 1 つ、§4)。

- pre: `worktreePath` は linked worktree の絶対パスである。main の active pointer が有効である (§3 手順 1、2)。
- post: 成功時は launcher と runtime が揃い、入れた版は main の版と一致する。guard と CLI の直接起動の案内の経路は exit 2 で終わり、記録 / session hook は exit 0 で終わる (§4、§5。2026-11-10 改訂、Issue #1602)。
- invariant: 失敗時は worktree・main・キャッシュのどれにも何も残さない。版を選べる入力は無い。`MODULE_NOT_FOUND` のスタックを block 理由にしない (§5)。
- oracle: `U-CWTRT-001`〜`010` が既存の入口・案内契約を固定し、`CANDIDATE-U-CWTRT-011` が新規 install transaction rollback の契約候補を固定する。`U-CWTRT-012`〜`015` が runtime 欠落時の launcher の三分割 (§4、Issue #1602) を固定する (2026-11-10 に候補 ID から正式 ID へ昇格、Issue #1602)。
