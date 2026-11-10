---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_review_request_admission
pair_artifact: docs/test-design/harness/L7-review-request-admission-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-11-10
issue: 1600
---

> **L6 contract marker**: `admitReviewRequest(input) => ReviewRequestAdmission` は unit-test-granularity contract である (未実装の目標契約。関数名は実装で変えてよいが、受理の検査を 1 つの単位にまとめる)。本書は review の委譲 (`ut-tdd claude|codex --role <reviewer 系 role> --review-*`) が、入口の検査をすべて終えてから review request を custody へ書く順序と、入口の検査の拒否を request の残らない失敗として扱う規則を凍結する (未実装の目標契約)。oracle は `docs/test-design/harness/L7-review-request-admission-test-design.md` の `CANDIDATE-U-RVADM-001`〜`012` が固定する (正式 ID `U-RVADM-*` への昇格は、src を含まない昇格 PR で行う)。行番号は 2026-11-10 の `main` (`91ae6af99`) で測った。

# review request の受理順序 (入口の検査を書き込みの前に) - 機能設計 (Issue #1600)

## 1. 目的と範囲

review の委譲を入口の検査で拒否したときに、verdict の無い request が custody に残り、その exact HEAD の `ut-tdd pr merge` を止め続ける欠陥を直す。request を書くのは「この呼び出しは review として成立する」と確定したあとだけにする。

範囲外:

- request を任意に取り下げる CLI。gate の迂回になるので作らない (§6)。
- すでに残っている verdict の無い request の扱い。新しい HEAD で review をやり直す現行の回避を変えない (§7)。
- merge gate (`src/feedback/review-merge-gate.ts`) の判定規則。pending を数える規則は変えない。
- 新しい設定項目、環境変数、差し替え口。

## 2. 事象 (2026-11-10、PR #1596、exact HEAD 6a0ba25f)

control の補助 script が `ut-tdd claude --role blind-reviewer --review-revision <空の変数> --review-author-family codex ...` を呼んだ。CLI は request を書き (`authorFamily=claude` で記録された)、その後 `same_family_reviewer_denied` で review を拒否した。同じ HEAD で正しい request (`authorFamily=codex`) に Opus の PASS が出たが、`ut-tdd pr merge` は `pending_request_for_head, verdict_missing` で拒否した。回避は、著者 family に commit を積んでもらい、新しい HEAD で review をやり直すことだけだった。

## 3. 原因 (実測)

### 3.1 request を書いたあとに族分離を判定している

`src/cli/delegation.ts` の実行順序は次のとおりである。

| 順 | 処理 | 位置 | custody への書き込み |
|---|---|---|---|
| 1 | role と model の routing 検証 (`resolveDelegationRouting`) | `delegation.ts:349` | なし |
| 2 | 三識別子の欠落、memory id の空、review lane でない role の拒否 | `delegation.ts:385`〜`:402` | なし |
| 3 | author family の解決 (`resolveReviewAuthorFamily`) | `delegation.ts:424`〜`:433` | なし |
| 4 | request の正規化 (`canonicalizeReviewRequest`)、PR 番号の整数検査 | `delegation.ts:438`〜`:453` | なし |
| 5 | 実行計画の組み立て (`buildPlan`) | `delegation.ts:508` | なし |
| 6 | dry-run はここで終了 | `delegation.ts:514` | なし |
| 7 | request を書く (`issueReviewRequest` → `persist`) | `delegation.ts:519`、`review-attestation.ts:434` | **request ファイルを書く** |
| 8 | 族分離と model の下限の検査 (`beginReviewAttempt`) | `delegation.ts:530`、`review-verdict-custody.ts:531`〜`:537` | 拒否 (`same_family_reviewer_denied`、`reviewer_model_below_floor`) のとき request は残ったまま |
| 9 | reviewer の起動と verdict の射影 (`executeAdapterPlanForCli`) | `delegation.ts:551` | attempt と outcome を書く |

族分離の判定 (`expectedProvider`、`review-verdict-custody.ts:531`) は request の `authorFamily` と reviewer の provider だけで決まる検査であり、書き込みの前に判定できる。にもかかわらず手順 7 のあとの手順 8 にあるため、拒否しても request が残る。

merge gate は、exact HEAD の entry に verdict が 1 件でも無いと `pending_request_for_head` を積んで拒否する (`review-merge-gate.ts:232`)。request の digest は `memoryId / pr / exactHead / reviewRevision / authorFamily` で決まる (`review-attestation.ts:434`〜)。`authorFamily` の違う request は別の entry になるので、誤った request は正しい request の PASS では閉じない。

### 3.2 値が option の取り違えで黙って採番される (事象の再現条件)

実測 (commander 12.1.0): `--review-revision "" --review-author-family codex` と引用符つきの空文字を渡したときは、`reviewRevision=""` になり、手順 2 の `!opts.reviewRevision` (`delegation.ts:385`) が `review_head_required` で拒否する。この経路は request を書かない。

事象は、変数の展開が空になり引数が消えた呼び出し (`--review-revision --review-author-family codex`) で起きる。commander は値を取る option の次の token を、`-` で始まっていてもそのまま値にする。実測の結果は次のとおりである。

- `reviewRevision` は文字列 `--review-author-family` になる。
- `--review-author-family` は未指定になり、値 `codex` は余分な位置引数として黙って捨てられる。

その後の経路は次のとおりである。

1. 手順 2 の検査は `reviewRevision` が非空なので通る。
2. 手順 3 で明示の author family が無いので、`resolveReviewAuthorFamily` (`review-attestation.ts:387`〜`:396`) は `currentRuntime` (`src/runtime/detect.ts:68`、`CLAUDECODE=1` なら `claude`) を返す。これが `authorFamily=claude` で記録された理由である。明示の値を推定で上書きしているのではなく、明示の値が option の取り違えで消えていた。
3. 手順 4 の `canonicalizeReviewRequest` (`review-attestation.ts:117`〜) は、`rv1-` で始まらない任意の文字列を受け取り、request の digest から `rv1-<digest>` を採番する。値の形を検査しないので、option 名の文字列が revision として採番される。memory id の既定 (`review:<pr>:<head>:<revision>`、`delegation.ts:442`) にも option 名が混入する。
4. 手順 7 で request が書かれ、手順 8 で provider (`claude`) と `authorFamily` (`claude`) が同族のため拒否される。

要約すると、原因は 2 つの欠落である。(1) 入口の検査が request を書く手順 7 のあとにある (§3.1)。(2) option の値の形と余分な位置引数を検査しないため、取り違えが採番と推定へ流れる。

### 3.3 request を書いたあとに拒否されうる他の入口の検査

| 検査 | 位置 | 書く前に判定できるか |
|---|---|---|
| 族分離 (`same_family_reviewer_denied`) | `review-verdict-custody.ts:531` | できる (author family と provider だけで決まる) |
| model の下限 (`reviewer_model_below_floor`) | `review-verdict-custody.ts:536` | できる (`isReviewFloorModel(provider, model)`。`--model` の明示で下限を下回りうる) |
| 実行計画の組み立て (`review_verdict_permission_path_invalid`) | `delegation.ts:508` | 手順 5 で判定済み (attempt 番号だけが違う path での再組み立て、`delegation.ts:543` が同じ形を検査する) |
| terminal receipt の既存 (`review_receipt_already_exists`) | `review-attestation.ts` の `issueReviewRequest` | `persist` の前に判定済み (書かない) |
| custody の状態 (`attempt_outcome_indeterminate`、`review_custody_audit_unavailable`) | `review-verdict-custody.ts` の `beginReviewAttempt` | 書く前には判定できない (audit の読み取りを要する)。§5 |
| role の未登録、model の解決 | `delegation.ts:349` | 手順 1 で判定済み (書かない) |
| review-guard の作業ツリー検査 (`assessReviewSession`) | `delegation.ts:263` | reviewer の実行後の事後検査であり、拒否ではなく警告である。書く前の検査の対象外 |

## 4. 方式

### 4.1 受理を書き込みの前に終える

request を custody に書く (`issueReviewRequest`) 前に、次の検査をすべて終える。1 つでも失敗したら、request も attempt も audit event も書かずに、typed reason を stderr へ出して exit 1 で終える。

1. 既存の検査 (手順 1〜4) はそのまま前に置く。
2. 値の形の検査 (§4.2)。
3. 族分離: reviewer の provider が `authorFamily` の反対であること。`beginReviewAttempt` と同じ判定を共有の述語として取り出し、受理の検査と `beginReviewAttempt` の両方がそれを呼ぶ (正規化は 1 箇所。判定を 2 箇所に書き分けない)。
4. model の下限: `isReviewFloorModel(provider, model)` を同じく共有の述語として前に置く。
5. 実行計画が組み立てられること (手順 5、既存)。

`beginReviewAttempt` の検査は残す。`beginReviewAttempt` は custody の公開 API (`review-verdict-custody.ts:522`) であり、委譲 CLI 以外の呼び出し元が増えても族分離が守られる必要がある。また受理の検査と書き込みの間で状態が変わりうる。受理の検査は「失敗した呼び出しが request を残さない」ための前段であり、二重防御として後段を置き換えない。

dry-run (`--execute` なし) も同じ受理の検査を通す。dry-run が成功するのに execute が入口で拒否される、という食い違いを作らない。dry-run は従来どおり何も書かない。

### 4.2 値の形の検査 (fail-close)

review identity の宣言 (`--review-*` のいずれかを渡した呼び出し) では、次を拒否する。

| 入力 | reason | 備考 |
|---|---|---|
| `--review-revision` が空文字、または空白だけ | `review_head_required` | 既存の reason。渡されていない (三識別子の欠落) ときと同じ扱いで、採番しない |
| `--review-revision` が `-` で始まる値 | `review_revision_invalid` | option の取り違え (§3.2) の検出。値を取る option に別の option 名が入った形を拒否する |
| 余分な位置引数がある | `review_unexpected_argument` | 値が捨てられて意図と違う request になる形 (§3.2 の `codex`) を拒否する |
| `--review-author-family` が `codex` / `claude` 以外 | `review_author_family_required` | 既存の reason。推定へ落とさない |

違反が重なったときの優先順位は、検査の順序 (上の表の上から下、§4.1 の手順 1〜5 の順) とし、最初に当たった違反の reason だけを返す。`review_revision_invalid` は `review_unexpected_argument` より優先する。revision の値が option 名になった呼び出しでは、値が消えた原因は option の取り違えであり、revision の検査が先に原因を指すためである。実例 `--review-revision --review-author-family codex` (位置引数 `codex` が余る) は、この優先順位により `review_revision_invalid` を返す。

`--review-revision` を渡さない呼び出しの既存の挙動は変えない。`review_head_required` で拒否する (`delegation.ts:385`)。`rv1-` で始まらない通常の識別子 (人が付けた id) を渡したときに `canonicalizeReviewRequest` が `rv1-<digest>` を採番する挙動も、既存の正規の使い方なので変えない。拒否するのは、値が空であるか option の形をしている場合だけである。

### 4.3 author family は渡された値を使う

明示された `--review-author-family` を、推定 (`currentRuntime`) や既定値で上書きしない。`resolveReviewAuthorFamily` は、`explicit` が渡されたときは、有効な値ならそのまま返し、無効な値なら `null` を返す (現行の `review-attestation.ts:387`〜`:396` の挙動を契約として凍結する)。推定が使われるのは、明示の値が最初から無いときだけである。§3.2 の事象は、この関数の誤りではなく、option の取り違えで明示の値が呼び出しの前に消えていたことが原因であり、§4.2 の検査で止める。

## 5. 失敗の扱い

受理の検査のあとに失敗した場合 (reviewer の起動の失敗、timeout、provider の非 0 終了、verdict の不備、custody の audit の読み取り不能) は、従来どおり request が残り、その HEAD の merge を止める。

これは gate を弱めないための意図した挙動である。検査を通った request は「この HEAD は review 中である」という事実を表し、その review が完了していない間に merge を許すと、review の素通りになる。reviewer の起動の失敗や timeout は、同じ identity (同じ request の digest) の再実行 (attempt の追加、`beginReviewAttempt` の retry 経路) で閉じられる。族分離の拒否が再実行で閉じられなかったのは、誤った `authorFamily` が digest に入っていて、別の request になっていたからであり、書く前の検査で止める (§4.1)。

## 6. 取り下げの CLI を作らない

request を任意に取り下げる経路は設けない。取り下げが誤用されると、著者が不利な verdict 待ちの request を消して merge できてしまい、gate の迂回になる。受理の検査を前に置くことで、取り下げが要る事象 (§2) 自体が起きなくなる。取り下げを要する場合の契約は、別に起票された取り下げの設計 (`docs/test-design/harness/L7-review-request-retraction-test-design.md`、候補のまま未実装) の範囲であり、本書はそれを実装しない。

## 7. すでに残っている request

過去に残った verdict の無い request は変えない。新しい HEAD で review をやり直す現行の回避を維持する。本書の変更は、これから書く request の受理順序だけに効く。

## 8. 不変条件

1. 受理の検査が失敗した呼び出しは、custody (`.ut-tdd/review/` 配下の request / attempt / audit) に何も書かない。
2. 明示の `--review-author-family` は、記録される `authorFamily` に常にそのまま反映される。値が無効なら request を作らず拒否する。
3. 受理の検査を通ったあとの失敗は、request を残し、merge gate は `pending_request_for_head` で拒否し続ける。受理の順序を変えても、gate の判定規則は変わらない。
4. verdict 待ちの正規の request は従来どおり merge を止める。
5. 族分離と model の下限の判定は、受理の検査と `beginReviewAttempt` で同じ述語を使い、判定が分岐しない。
6. 新しい設定項目・環境変数・差し替え口を足さない。
