---
document_id: UT-TDD-CONCEPT-V4-ACCEPTANCE
status: draft_candidate
concept: docs/governance/candidates/ut-tdd-concept-v4.0.md
requirements: docs/governance/candidates/ut-tdd-concept-v4-requirements.md
decision_ledger: docs/governance/candidates/v4-decision-ledger.json
plan: docs/plans/PLAN-L1-09-ut-tdd-concept-v4-candidates.md
---

# UT-TDD 構想書 v4.0 受入候補 (L12 受入、UAT を含む)

## Authority 境界

本書は PLAN-L1-09 の未承認候補である。test-design でも実装の oracle でもない。
v4 の右腕では、受入は L12 (UAT を含む) の工程である (V4D-073)。
承認後、各行は該当する test-design の AT 宣言へ降りる。受入 catalog (JSON) はその test-design から生成する (V4D-070)。
本書は「何を観測できれば受入とみなすか」を宣言する。実行主体と実装方式は固定しない。

## 要件・決定台帳との関係

各受入行は、受け入れる要件 (UTV4-FR-xxx) を 1 件以上引く。
どの要件も 1 件以上の受入行で受け入れるか、「受入不要」の表に理由付きで載る。
各受入行は release 必須かどうか (yes / no) を持つ。
この対応は次のコマンドで機械的に確かめる。

```bash
node scripts/v4-ledger-check.mjs
```

書き方の規則 (V4D-087):

- 既存の受入と同じ論点は、既存の行を直す。ID は変えない。
- 新しい ID を作るのは、どの既存の受入にも無い論点だけにする。
- 撤回した中身は「廃止した受入」の表に、撤回の根拠の決定と一緒に残す。

区分の意味: 維持 = 判定の中身を変えていない。既存を更新 = 同じ ID のまま要件に合わせて書き直した。新規 = どの既存の受入にも無い論点。

集計: 維持 38 件 / 既存を更新 33 件 / 新規 18 件 (計 89 件)。行ごと廃止 1 件 (UTV4-AC-009)。

## release 必須の判定基準

release 必須の検査は、設計の時点で宣言する (V4D-070、#589)。下の 5 つの判定基準は PO が採用した (V4D-095、#589 6050280913)。
release 必須 = yes の受入は、release の前に必ず合格していなければならない。
yes にするのは、失敗すると次のどれかが起きる受入である。

1. 人間の authority (承認・freeze) を AI や機械が僭称する。
2. 高影響境界 (production・破壊的なデータ操作・認証 / 認可・決済・PII・secret・ライセンス・外部 API 前提) を承認なしに変える。
3. 検証 (CI・独立 review・merge admission) を迂回する。
4. 正本や未 merge の作業を失う。移し漏れを見逃す。
5. secret / PII が外へ出る。

それ以外は no とする。no の受入も、該当する工程の gate では検査する。

集計: release 必須 yes 32 件 / no 57 件。

## 受入候補

手段の列: 「negative テスト」は違反を起こして拒否を確かめる受入テスト。「positive テスト」は正しい入力が通ることを確かめる受入テスト。

| ID | 受け入れる要件 | 確認すること | 手段 | 合格条件 | release 必須 | 区分 |
|---|---|---|---|---|---|---|
| UTV4-AC-001 | UTV4-FR-001 | AI が memory・session summary・自分の解釈から「PO 承認済み」を記録しようとする。 | negative テスト + `ut-tdd doctor` | approval record が作られない。provenance 不在で fail-close する。監査記録に残る。 | yes | 維持 |
| UTV4-AC-002 | UTV4-FR-002 | (a) 工程 × 役割の表に、A が 0 個または 2 個以上の行を作る。(b) 表の外の質問 (進捗確認・実行許可・自力で確かめられる事実) を AI が PO へ出す。(c) 表に発注者 / 受託者や契約形態の属性を足す。 | RACI lint + negative テスト | (a) lint が fail-close する。(b) 反射的エスカレーションとして deny する。advisor 相談と実測を求める。(c) lint が deny する。 | no | 既存を更新 |
| UTV4-AC-003 | UTV4-FR-002 | 高影響境界の変更を、AI が人間の承認なしに実行する。 | negative テスト | fail-close する。人間の approval record が無い限り書き込まない。 | yes | 維持 |
| UTV4-AC-004 | UTV4-FR-003 | チケットに owner を 2 名設定する。または owner を設定しない。 | negative テスト | fail-close する。owner がちょうど 1 名になるまで割り当てが成立しない。 | no | 維持 |
| UTV4-AC-005 | UTV4-FR-003 | owner に provider 名や model 名を設定する。 | negative テスト | deny する。owner は人間ユーザーの identity か logical lane だけ。 | no | 維持 |
| UTV4-AC-006 | UTV4-FR-004 | (a) 3 つの必須 field (やること / ゴールの検証と根拠コマンド / 親の参照) のどれかを欠くチケットを作る。(b) lease・scope・base / HEAD・budget・digest 束縛・generates の field を持つチケットを作る。(c) GitHub の Issue 本文を編集する。(d) 人間のチケットと AI lane のチケットを並べる。 | schema 検証 + `ut-tdd doctor` | (a)(b) schema 検証が deny する。(c) 正本へ読み戻さない。正本とのずれは advisory 警告として出て、fail-close にならない。(d) 同じ schema で並ぶ。違うのは owner の種別だけ。 | no | 既存を更新 |
| UTV4-AC-007 | UTV4-FR-005 | (a) 自分の担当区分の外の path に触る変更を出す。(b) 衝突が起きる。 | negative テスト | (a) Kernel が変更を有効化しない。変更は提案として出る。(b) 持ち主へ型付きの conflict record が戻る。 | no | 既存を更新 |
| UTV4-AC-008 | UTV4-FR-005 | (a) claim 済みのチケットに 2 件目の claim を出す。(b) claim だけを根拠に書き込み権限を得ようとする。 | negative テスト | (a) 2 件目の claim を deny する。(b) claim は書き込み権限の根拠にならない。 | no | 既存を更新 |
| UTV4-AC-010 | UTV4-FR-005 | 同じ PR / HEAD / revision に、異なる memoryId の review request を 2 件出す。 | negative テスト | 2 件目を実行の前に deny する (#421 を継承)。 | yes | 維持 |
| UTV4-AC-011 | UTV4-FR-006 | (a) 機械の記録 (チケット / verdict / receipt) を markdown だけに書く。(b) 1 ファイルに 2 件以上の記録を入れる。(c) 設計書やチケットに証跡の本体を書く。 | `ut-tdd doctor` + negative テスト | (a) 記録の不在として fail-close する。(b) deny する。(c) deny する。参照側は証跡の ID と digest だけを持つ。 | yes | 既存を更新 |
| UTV4-AC-012 | UTV4-FR-006 | harness.db を消して、正本ファイルから作り直す。 | 作り直しの前後比較テスト | 作り直しの前後で索引の内容が一致する。DB にしか無い状態は 0 件。 | yes | 既存を更新 |
| UTV4-AC-013 | UTV4-FR-007 | (a) v4 への切り替え後に、既存 PLAN ファイルの内容を変える。(b) HEAD から作った照合の母集合 3 種に、対応表に無い要素がある。(c) 切り替え前に PLAN 上の gate や CI を外す。(d) 変更が設計書の成果物所有の範囲の外に出る。 | 照合テスト + `ut-tdd doctor` | (a) fail-close する。(b) fail-close し、切り替えを完了にしない。(c) deny する。(d) 機械が止める。 | yes | 既存を更新 |
| UTV4-AC-014 | UTV4-FR-008 | 生成 view (表 / doc) を直接編集する。 | `ut-tdd doctor` | hash の不一致を検出して fail-close する。生成元の identity が示される。 | no | 維持 |
| UTV4-AC-015 | UTV4-FR-008 | 同じ正本から view を 2 回生成する。 | 決定性テスト | byte が同一になる。 | no | 維持 |
| UTV4-AC-016 | UTV4-FR-009 | view 上の変更を、admission を経て構造化正本へ戻す。 | positive テスト | actor・source view・target record・revision を持つ receipt が残る。正本が更新される。 | no | 維持 |
| UTV4-AC-017 | UTV4-FR-009 | view 上の変更を、markdown 正本へ機械で書き戻す。 | negative テスト | deny する。markdown 正本は人間だけが編集する。 | no | 維持 |
| UTV4-AC-018 | UTV4-FR-010 | (a) FLAG 1 件だけを根拠に新しい gate を作る。(b) 選んだ行き先と、それより上流を選ばなかった理由の無い振り分け記録を出す。(c) 同じパターンで修正と再発が閾値を超えて繰り返される。(d) 学習データが保持期間か件数の上限を超える。 | negative テスト | (a) 単一 episode の昇格として deny する。(b) deny する。(c) 自動の修正が止まり、人間へ上がる。(d) 上限を超えた分は保持されない。 | no | 既存を更新 |
| UTV4-AC-019 | UTV4-FR-010 | 改善候補が要件や設計を直接書き換える。 | negative テスト | deny する。出せるのは proposal / evidence / delta だけ。 | no | 維持 |
| UTV4-AC-020 | UTV4-FR-011 | 改善候補が作られる。 | positive テスト | 同じ候補が人間向け digest (generated view) として配られる。採否が decision record に残る。 | no | 維持 |
| UTV4-AC-021 | UTV4-FR-012 | (a) 進捗を人間が手で更新する。モデルが完了を自己申告する。(b) リーダーの全体ビューから記録へ書き戻す。(c) 集約時刻の無い全体ビューを出す。(d) 未発行の範囲を完了予測に混ぜる。 | negative テスト + 予測の計算テスト | (a) 進捗は変わらない。(b) deny する。(c) deny する。(d) 予測は発行済みチケットだけから出る。P50 と P85 の幅を持つ。未発行の範囲は判断と期限として表示される。 | no | 既存を更新 |
| UTV4-AC-022 | UTV4-FR-013, UTV4-FR-023 | (a) hybrid で、author と同じ family の verdict で merge する。(b) single-provider で、UTV4-FR-023 の attestation を満たす同 family の verdict で merge する。(c) 旧 HEAD の receipt で merge する。(d) reviewer の自由文から verdict を拾う。(e) 受領の無い依頼、または依頼に対応しない受領がある。 | negative / positive テスト + `ut-tdd doctor` | (a) deny する。(b) admit する。evidence tier は `same_family_separated`。(c) deny する。(d) deny する。verdict は schema に沿った機械可読の値だけ。(e) doctor が finding を出す。 | yes | 既存を更新 |
| UTV4-AC-023 | UTV4-FR-014 | legacy (Bun / personal path) の green を根拠に、current の failure を相殺する。 | negative テスト | deny する。current identity の failure が残る。 | yes | 維持 |
| UTV4-AC-024 | UTV4-FR-015 | intake に未確定の field (例: actor が空) があるまま、AI が値を補って L3 compile へ進める。 | negative テスト | deny する。question event が作られる。compile 結果は `human_decision_required` か `backflow_required`。 | no | 維持 |
| UTV4-AC-025 | UTV4-FR-016 | (a) 人間の approval record なしに L3 IR を frozen にする。(b) 同じ L2 event log から candidate を 2 回作り直す。 | negative テスト + 決定性テスト | (a) fail-close する。(b) byte が同一になる。 | yes | 維持 |
| UTV4-AC-026 | UTV4-FR-017 | (a) チケットの schema や CLI に S0〜S4 の状態値を置く。(b) 判定記録 (結論と根拠) の無い PoC チケットを閉じる。(c) 判定記録の無い PoC の成果を production の成果として数える。 | lint + negative テスト | (a) lint が fail-close する。(b) deny する。(c) 数えない。 | no | 既存を更新 |
| UTV4-AC-027 | UTV4-FR-018 | (a) 判定記録が採用を示す前に、PoC チケットの成果物を production path へ merge する。(b) 採用の後でも、production 側の別チケット無しに merge する。(c) プロトへの反応を自由文だけで記録する。 | negative テスト | (a)(b) merge admission が deny する。(c) deny する。構造化 decision を分けて記録する。 | yes | 既存を更新 |
| UTV4-AC-028 | UTV4-FR-019 | (a) 正本化済み (retirement record あり) の内容を memory へ再び add する。(b) progress 語・raw log・secret を含む memory を add する。 | negative テスト | (a) deny し、retirement record を示す。(b) fail-close する。 | yes | 維持 |
| UTV4-AC-029 | UTV4-FR-020 | (a) 学習資産の owner に skill 名 / provider 名 / folder を設定する。(b) 依存する provider の版が変わる。 | negative テスト | (a) deny する。(b) 関連する資産が revalidation_required へ移る。 | no | 維持 |
| UTV4-AC-030 | UTV4-FR-021 | registry に無い identity pair、同じ pair の両極性、applicability 未指定の skill を推薦の入力にする。 | negative テスト | いずれも fail-close する。未指定を all へ広げない。 | no | 維持 |
| UTV4-AC-031 | UTV4-FR-022 | (a) 同じ入力で packet を 2 回 compile する。(b) stale skill を削除する。(c) shadow・before/after・独立 review のどれかを欠いて gate へ昇格する。 | 決定性テスト + negative テスト | (a) exact set と digest が同一。(b) deny する。quarantine だけ許す。(c) deny する。 | no | 維持 |
| UTV4-AC-032 | UTV4-FR-023 | (a) single-provider で、同じ provider の別 session・上位 tier が blind packet で review して receipt を出す。(b) 同じ session の subagent が review する。(c) receipt に `cross_family` を記録する。 | positive / negative テスト | (a) admit する。evidence tier は `same_family_separated`。(b) deny する。(c) 僭称として deny する。 | yes | 維持 |
| UTV4-AC-033 | UTV4-FR-023 | (a) reviewer の session id が author と同じ、または実在しない receipt を出す。(b) CI が green でない HEAD への verdict を出す。 | negative テスト | (a) attestation 不成立として deny する。理由は型付き。(b) deny する。 | yes | 維持 |
| UTV4-AC-034 | UTV4-FR-024 | (a) single-provider で、高影響境界の merge を人間 review なしに admit する。(b) 利用上限の record なしに hybrid から single-provider へ下げる。(c) 補償統制の gate が無いまま profile を宣言する。 | negative テスト | いずれも deny する。 | yes | 維持 |
| UTV4-AC-035 | UTV4-FR-025 | (a) 計測 record の無い skill / subagent を削除する。(b) FLAG 1 件で surface を退役する。(c) 機能の段階 (planned〜retired) を跳ばして遷移する。(d) 削る対象を機械で読めない新しい変更を出す。 | negative テスト + 一覧の生成テスト | (a)(b) deny する。quarantine だけ許す。(c) deny する。(d) finding を出す。各機能の段階が一覧で読める。 | no | 既存を更新 |
| UTV4-AC-036 | UTV4-FR-026 | (a) inventory に無い legacy token が current surface に出る。(b) DB の schema object を migration なしに drop する。 | `ut-tdd doctor` | いずれも fail-close する。 | yes | 維持 |
| UTV4-AC-037 | UTV4-FR-027 | (a) receipt を candidate worktree の中だけに置く。(b) dirty か未 merge の worktree を gc が回収する。(c) projection writer が入力の欠落を空の成功として返す。 | negative テスト + `ut-tdd doctor` | (a) main 側から見えなければ finding を出す。(b) deny する。(c) finding として fail-close する。 | yes | 維持 |
| UTV4-AC-038 | UTV4-FR-004 | (a) チケットの記録に L4 以上の設計本文や設計判断を書く。(b) L5 詳細設計・L6 仕様の改訂や Reverse をチケットの作業として出す。(c) チケットの完了で L4 の本文を accept 扱いにする。 | negative / positive テスト | (a) deny する。本文は設計書に置く。(b) チケットとして受け付ける。(c) deny する。accept は設計の freeze review だけ。 | no | 既存を更新 |
| UTV4-AC-039 | UTV4-FR-028 | (a) 初期画面ルールの freeze record が無いまま、画面プロトのチケットを 2 件発行する。(b) 反応を L2 discovery event に記録せずにチケットを閉じる。(c) 検収の雛形が無い種類のチケットを発行する。 | negative テスト | (a) 2 件目を deny する。(b) deny する。(c) deny する。 | no | 既存を更新 |
| UTV4-AC-040 | UTV4-FR-029 | (a) L0〜L4 の文書に owner を 2 名、または 0 名にする。(b) owner 以外が L3 / L4 の文書を freeze する。(c) Issue / Sub-issue / PR のどれかのチケットに owner を 2 名にする。(d) L8〜L12 の検証の owner を author にする。(e) L8 の食い違いの振り分けを作者と同じ family が判定する。 | negative テスト | いずれも deny する。 | yes | 既存を更新 |
| UTV4-AC-041 | UTV4-FR-030 | 区分をまたぐ合流点の担当を、claim の付け替えの記録 (旧 owner・新 owner・理由・引き取り時の HEAD) なしに替える。 | negative テスト | deny する。 | no | 既存を更新 |
| UTV4-AC-042 | UTV4-FR-031 | (a) 同じチケットの中で 4 回目の是正を出す。(b) 契約 (設計) の食い違いを同じチケットの中で直す。(c) 是正の回数を数える。 | negative テスト + 集計テスト | (a) 受け付けない。(b) deny し、設計のチケットを新しく起こすよう求める。(c) 回数はチケットの記録から機械で出る。 | no | 既存を更新 |
| UTV4-AC-043 | UTV4-FR-032 | (a) main の上に無い、または衝突のある candidate を merge admission へ出す。(b) exact HEAD の CI が green でない。(c) exact HEAD に束縛した独立 review の receipt が無い。(d) L10〜L12 のシステム受入を PR の merge だけで閉じる。 | negative テスト | (a)(b)(c) deny する。(d) deny する。システム受入は release の適格性で閉じる。 | yes | 既存を更新 |
| UTV4-AC-044 | UTV4-FR-033 | 1 人の時期に、チケット・claim・event・receipt のどれかを省いて工程を進める。 | negative テスト | gate が deny する。 | no | 既存を更新 |
| UTV4-AC-045 | UTV4-FR-034 | (a) PO 以外がチケットを発行する。(b) メンバーの提案が、PO の仕分けの前にチケットになる。(c) チームの管理知能が、自区分と区分境界の契約以外を読む。 | negative テスト | いずれも deny する。 | no | 既存を更新 |
| UTV4-AC-046 | UTV4-FR-035 | (a) 管理知能が自分でチケットを発行する。(b) PO が承認していない下書きを発行する。(c) 生成元 (上流成果物の path と revision) の無い下書きを出す。(d) 同じ入力と同じ policy version で下書きを 2 回作る。 | negative テスト + 決定性テスト | (a)(b)(c) deny する。(d) 同じ下書きの集合が出る。 | no | 既存を更新 |
| UTV4-AC-047 | UTV4-FR-036 | (a) 最上位の Issue 以外で親の無いチケットを作る。(b) 親を 2 つ持つチケットを作る。(c) 4 段目のチケットを作る。(d) GitHub の sub-issue 関係を見る。 | schema 検証 + 投影テスト | (a)(b)(c) schema 検証が deny する。(d) 正本の親参照から投影されている。 | no | 既存を更新 |
| UTV4-AC-048 | UTV4-FR-008 | (a) 要求 / 要件 / 設計の記録を更新しても、スプレッドシート view が同期されない。(b) シートの直接編集が admission を経ずに正本へ入る。(c) 正本を 1 枚の文書へ集める要求を置く。 | `ut-tdd doctor` + negative テスト | (a) 同期の drift として fail-close する。(b) deny する。(c) 要求として受け付けない。 | no | 維持 |
| UTV4-AC-049 | UTV4-FR-037 | (a) 2 つ以上の区分に跨る欠陥を、incident record なしに個別の修正で merge する。(b) incident が open の間に、影響下のチケットを merge する。(c) 契約の誤りが原因の incident を Reverse 対なしに閉じる。(d) hotfix branch へ直接 push する。 | negative テスト | いずれも deny する。 | yes | 既存を更新 |
| UTV4-AC-050 | UTV4-FR-038 | (a) secret / PII / private transcript を含む event を改善 corpus へ export する。(b) project identity の無い intake record を作る。(c) Issue 本文を正本として要件を上書きする。 | negative テスト | いずれも deny する。 | yes | 維持 |
| UTV4-AC-051 | UTV4-FR-039 | (a) prototype record と反応 event なしに、L3 の画面仕様を freeze する。(b) モック画像を画面仕様の正本として参照する。 | negative テスト | (a) compile が backflow_required を返す。(b) deny する。正本は生成した製本物だけ。 | no | 維持 |
| UTV4-AC-052 | UTV4-FR-040 | (a) 実録の provenance の無い skill を ACTIVE へ昇格する。(b) firing しても結果に相関しない skill を照合なしに残す。 | negative テスト | (a) deny する。(b) quarantine 候補として finding を出す。 | no | 維持 |
| UTV4-AC-053 | UTV4-FR-041 | (a) judgement record の無い LLM verdict を admission の入力にする。(b) transcript だけから判断を組み立て直す。 | negative テスト | いずれも deny する。 | no | 維持 |
| UTV4-AC-054 | UTV4-FR-042 | (a) calibration を測っていない判断種別を分類器へ昇格する。(b) 単一 episode で決定的 check へ昇格する。(c) 昇格後の check と LLM 判断の before/after 差分が無い。 | negative テスト | (a)(b) deny する。(c) 昇格を deny し、shadow へ戻す。 | no | 維持 |
| UTV4-AC-055 | UTV4-FR-043 | (a) 機械判断化した判断種別で frontier tier へ routing する。(b) tier や cost を品質の根拠として記録する。 | routing テスト + negative テスト | (a) routing が下位 tier か check へ下がり、finding を出す。(b) deny する。 | no | 維持 |
| UTV4-AC-056 | UTV4-FR-044 | (a) 選好軸の項目を、人間の decision record なしに deny 条件へ昇格する。(b) 良否軸と選好軸を分けずに 1 つの記録に書く。 | negative テスト | いずれも deny する。 | no | 維持 |
| UTV4-AC-057 | UTV4-FR-045 | (a) 人間が読める view の無い判断種別を機械判断化へ昇格する。(b) view 側の承認を admission なしに正本へ入れる。 | negative テスト | いずれも deny する。 | no | 維持 |
| UTV4-AC-058 | UTV4-FR-046 | (a) 手描きの図を依存や遷移の正本として参照する。(b) 同じ記録から生成した図の digest が一致しない。(c) テーブル定義を、スプレッドシート同期 view 以外の自由文で正本にする。 | negative テスト + 決定性テスト | (a) deny する。(b) 生成器の欠陥として finding を出す。(c) deny する。 | no | 維持 |
| UTV4-AC-059 | UTV4-FR-047 | (a) 図の側の編集を admission なしに記録へ入れる。(b) 記録の更新後に作り直していない図を配る。 | negative テスト + `ut-tdd doctor` | (a) deny する。discrepancy record だけが残る。(b) doctor が fail-close する。 | no | 維持 |
| UTV4-AC-060 | UTV4-FR-048 | (a) 同じ契約 id へ 2 つの lane が別々に還流を起こす。(b) backflow が open の間に、依存する下流チケットを merge する。(c) 契約の改訂の後、管理知能の改訂の下書きを PO の承認なしに発行する。 | negative テスト | (a) 2 件目は event として 1 件の record に集まる。(b) deny する。(c) deny する。 | no | 既存を更新 |
| UTV4-AC-061 | UTV4-FR-049 | (a) role record に無い subagent_type で Agent を起動する。(b) 手書きの provider 固有 sub-agent 定義が生成物と食い違ったまま残る。(c) role record に provider 名や model 名を直接書く。 | guard テスト + `ut-tdd doctor` | (a) guard が deny する。(b) doctor が fail-close する。(c) schema が deny する。 | no | 維持 |
| UTV4-AC-062 | UTV4-FR-050 | (a) LLM orchestrator か管理知能が、gate role を経ずに合流点を閉じる。(b) single-provider で `cross_family` を記録する。(c) single-provider / standalone で、hybrid と別の role record や guard を使う。 | negative テスト | いずれも deny する。 | yes | 既存を更新 |
| UTV4-AC-063 | UTV4-FR-051 | (a) single-provider で author が packet を組む。(b) author の claim や自己評価が packet に入る。(c) reviewer の session が author と memory namespace を共有する。(d) 反証試行の記録が無い PASS を出す。(e) reviewer の tier が author より下。 | negative テスト | (a)(b) deny する。(c) attestation 不成立で deny する。(d) PASS-WEAK へ下がる。(e) deny する。 | yes | 維持 |
| UTV4-AC-064 | UTV4-FR-052 | (a) 1 つの PR に機能の変更と refactor を混ぜる。(b) refactor チケットが既存の oracle を変える、または新しい機能の oracle を足す。(c) 退役 (削る作業) を refactor 以外のチケットで行う。 | negative テスト | (a) deny し、分割を求める。(b) 振る舞いの不変の違反として deny する。(c) deny する。 | no | 既存を更新 |
| UTV4-AC-065 | UTV4-FR-053 | (a) 閾値を越えた projection が無いのに、LLM の指摘だけで refactor チケットの下書きを作る。(b) 閾値を越えたのに下書きが作られない。 | negative / positive テスト | (a) 下書きを作らない。指摘は finding として projection の入力に残る。(b) 管理知能が下書きを作る。 | no | 既存を更新 |
| UTV4-AC-066 | UTV4-FR-054 | (a) author が自分の PR を admitter として merge する。(b) admitter が成果物を書き換える。(c) 実行の着手後に検収の条件を変える。(d) 実行と同じ family が検収する。(e) 1 人運用の self-admission を印なしで記録する。 | negative テスト | (a) deny する。(b) deny し、author へ差し戻す。(c)(d)(e) deny する。 | yes | 既存を更新 |
| UTV4-AC-067 | UTV4-FR-055 | (a) 参加人数が 2 以上のとき、L9 以上に関わる実装を author 以外の人間 review なしに admit する。(b) 参加人数が 1 のとき、AI blind lane で代えたのに evidence tier と self-admission の印を記録しない。 | negative テスト | いずれも deny する。 | yes | 既存を更新 |
| UTV4-AC-068 | UTV4-FR-056 | (a) risk 信号の record なしに深度 profile を deep にする。(b) light profile で必須最小 4 要素のどれかを省く。(c) 初期画面ルールの freeze 前に、画面プロトのチケットを 2 名以上に分けて発行する。(d) fixture が本番 schema と違う形を持つ。(e) 異常系の必須セットを欠く画面を検証完了にする。(f) screen finding を自由文だけで記録する。(g) screen id を持たない FE の実装の変更を出す。 | negative テスト | (a) deny する。根拠の record が要る。(b)(d)(e) deny する。(c) deny する (UTV4-FR-028)。(f) deny する。型付きが必須。(g) deny する。画面の設計から FE の実装まで screen id で追える。 | no | 既存を更新 |
| UTV4-AC-069 | UTV4-FR-057 | (a) fixture 契約・異常系セット・finding・checklist のどれかを欠く screen id を、製本点 (a) で画面仕様へ束ねる。(b) ハーネス自身のスプレッドシート view や digest を、プロト工程なしに L5 詳細設計へ進める。 | negative テスト | (a) compile が backflow_required を返す。(b) deny する。 | no | 維持 |
| UTV4-AC-070 | UTV4-FR-056 | (a) 意味ロジックの判定器の出力を Gold として登録する。(b) 予測値を確定値と同じ表示で描く。(c) 棄却条件の無い仮説 record を作る。 | negative テスト | (a) deny する。独立した Gold が要る。(b) 表示規約の違反として finding を出す。(c) deny する。 | no | 維持 |
| UTV4-AC-071 | UTV4-FR-058 | (a) AI lane・管理知能・review verdict が要求の記録を frozen にする。(b) 人間の freeze decision record も、PoC チケットの判定記録 + 人間の ack も無いまま frozen にする。(c) provisional の要求を view で確定値と同じ表示にする。(d) AI 間の解釈の食い違いを、一方の AI が確定して下流へ流す。 | negative テスト | (a)(b) deny する。(c) 表示規約の違反として finding を出す。(d) deny する。discrepancy record が上流 owner へ上がる。 | yes | 既存を更新 |
| UTV4-AC-072 | UTV4-FR-059 | PoC 期の設定・規約・CI を、production 側のチケットを起こさずに production path へ持ち込む。 | negative テスト | deny する。production 側のチケットとして起こし直すよう求める。 | no | 既存を更新 |
| UTV4-AC-073 | UTV4-FR-060 | (a) 管理知能の出力を、Kernel の検証なしに記録や gate の入力にする。(b) 「プロダクトの管理」と「ハーネス自身の管理」の名前空間を混ぜて書く。(c) 管理知能の機能の一覧を見る。 | negative テスト + 経路の静的検査 | (a) そのような経路が 0 件。実行しても deny する。(b) deny する。(c) F1〜F10 の 10 個が読める。 | yes | 新規 |
| UTV4-AC-074 | UTV4-FR-061 | (a) 管理知能を外した状態で、中核の受入を流す。(b) 管理知能が記録を直接書く。(c) 外部監査 P-02 の 10 条件を確かめる。(d) 言語の決定の記録を見る。 | 中核の受入スイート + negative テスト + 条件の検査 | (a) 中核は手動の計画で動き、中核の受入が通る。(b) deny する。(c) 10 条件がすべて満たされる。(d) ADR-001 が更新されている。ADR-010 は無い。 | no | 新規 |
| UTV4-AC-075 | UTV4-FR-062 | (a) Windows + Node 24 で境界の型を作り直す。(b) 同じ入力を TS と Python の検証に通す (欠落と null・未知の field・union・数値範囲・default・型の自動変換)。(c) 生成器が扱えない構文の schema を通す。(d) 手で書いた境界の型を置く。 | 再生成の差分テスト + 合否一致テスト + lint | (a) 差分が 0。(b) 全ケースで合否が一致する。(c) 生成の時点で拒否する。(d) lint が deny する。 | no | 新規 |
| UTV4-AC-076 | UTV4-FR-063 | 並行する作業の着地順の提案を出す。その提案を merge の条件に使おうとする。 | positive / negative テスト | 提案は導出に使った入力 (依存・重なる path・base の commit) を含む。merge の可否は gate だけが決める。 | no | 新規 |
| UTV4-AC-077 | UTV4-FR-064 | (a) 差分から影響するテストと AT を出す。(b) 宣言されていない依存がある。(c) 全回帰との一致を示さずに検査を省く。(d) stable へ昇格する。 | 影響導出テスト + negative テスト | (a) 影響しないと判断した根拠も出る。グラフは HEAD から計算し直す。(b) 影響ありとして扱う。(c) deny する。(d) 全受入が走る。 | yes | 新規 |
| UTV4-AC-078 | UTV4-FR-065 | (a) 宣言 (検証する要件・依存範囲・実行の種類・環境の前提・入力の形式・必須の条件) の無い AT を置く。(b) 受入 catalog を手で編集する。(c) release のときに catalog を読む。(d) 環境の前提を満たさない AT を実行する。 | catalog の生成テスト + preflight テスト | (a) deny する。(b) test-design からの再生成との差分で検出し、fail-close する。(c) 「今回必須の AT」と「既存の合格を流用できる AT」が機械で分かれる。(d) 実行せず、理由を返す。 | yes | 新規 |
| UTV4-AC-079 | UTV4-FR-066 | 右腕の層の構成と左右の対を読む。 | 層の registry の検査 | L7〜L14 が UTV4-FR-066 のとおり並ぶ。対は L5 ↔ L9、L4 ↔ L10、L8 ↔ L4〜L6。L11 総合レビューは無く、各層の gate に分かれている。 | no | 新規 |
| UTV4-AC-080 | UTV4-FR-067 | (a) 食い違いが残り、振り分けの済んでいない L8 の gate を通す。(b) 1 件の食い違いを 2 つの行き先へ振り分ける。(c) 作者と同じ family が振り分けを判定する。(d) 移行の前後で成熟度の段が下がる。 | gate テスト + negative テスト | (a)(b)(c) deny する。(d) 機械が検出し、移行を通さない。 | yes | 新規 |
| UTV4-AC-081 | UTV4-FR-068 | (a) 右腕の作業の順序 (証拠集め → 判定 → 設計還流とリファクタリング → 検証 → 仕様書) を跳ばす。(b) 右腕で振る舞いを変える変更を入れる。(c) リファクタリングと検証を同じ family が行う。(d) Reverse の採点結果を型の無い文で出す。 | negative テスト | (a)(b)(c) deny する。(b) の変更は次の左腕のチケットへ回る。(d) Kernel の検証が deny する。 | no | 新規 |
| UTV4-AC-082 | UTV4-FR-069 | (a) 廃止した層番号と工程名の残りを探す。(b) docs/templates/vmodel/ の有無を見る。(c) L6 のテンプレートの本数を数える。(d) consumer に配るテンプレートの path を変える。 | grep / lint + canary | (a) 残りが 0 件。(b) 無い。(c) 1 本。(d) canary が通る。どれかが欠ければ切り替えを完了にしない。 | no | 新規 |
| UTV4-AC-083 | UTV4-FR-070 | (a) 置き場所の registry に無い場所へ記録を書く。(b) doctor を巡回させる。 | guard テスト + `ut-tdd doctor` | (a) guard が deny し、正しい path を示す。(b) registry との外れを報告する。fail-close にはしない。 | no | 新規 |
| UTV4-AC-084 | UTV4-FR-071 | このリポジトリで hook・gate・guard を動かす。 | hook の解決先テスト | 判定に使うのは .ut-tdd/ の下のリリース harness だけ。開発中の product/ のコードは判定に使われない。 | yes | 新規 |
| UTV4-AC-085 | UTV4-FR-072 | (a) チケットを閉じる。(b) 自己申告の数字を入れる。(c) 工程ごとに束ねて読む。 | 集計テスト + negative テスト | (a) 作業ログにチケット 1 件につき 1 行が、1 回だけ書かれる。(b) 入力にしない。(c) L 層ごとに読める。専用の DB テーブルは無い。 | no | 新規 |
| UTV4-AC-086 | UTV4-FR-073 | (a) 層を凍結する。(b) 仮の値の見直し条件が成り立つ。 | gate テスト + positive テスト | (a) G6「WBS 完備」を機械で判定する。満たさなければ凍結しない。(b) 見直しのチケットの下書きが自動で作られる。 | no | 新規 |
| UTV4-AC-087 | UTV4-FR-074 | (a) 登録簿に無い外部ライブラリに依存する。(b) PO の承認記録なしにライセンスを承認済みにする。(c) 社内の部品を探す。 | lint + negative テスト + カタログ生成テスト | (a) lint が fail-close する。(b) deny する。(c) コードから生成したカタログで見つかる。 | yes | 新規 |
| UTV4-AC-088 | UTV4-FR-075 | (a) 権限 (authorization) を変える実装のチケットを、着手前の PO 承認記録なしに進める。(b) F10 のチームマネジメントの入力を見る。 | negative テスト + 入力の静的検査 | (a) deny する。(b) 入力はメンバーと権限の registry だけ。 | yes | 新規 |
| UTV4-AC-089 | UTV4-FR-076 | (a) 効く基本原則を 1 つも持たない設計判断の記録を出す。(b) 既存の論点に新しい ID の記録を作る。 | lint + review | (a) lint が deny する。(b) 既存の記録を同じ ID で更新するよう差し戻す。 | no | 新規 |
| UTV4-AC-090 | UTV4-FR-006, UTV4-FR-007, UTV4-FR-013 | #591 の 18 件の一覧を読む。 | 一覧と要件の照合 | 18 件すべてが「v4 で直す」となっている。各項目が、実現する要件 ID を 1 件以上持つ。 | no | 新規 |

## 受入不要

どの要件も 1 件以上の受入行で受け入れている。受入不要の要件は無い。

| 要件 | 理由 |
|---|---|

## 廃止した受入

行ごと廃止した受入は UTV4-AC-009 だけである。ほかは同じ ID のまま書き直した。
次の表は、行ごとの廃止と、書き直しで撤回した中身と、撤回の根拠の決定である。

| 旧 ID / 旧記述 | 撤回した中身 | 根拠 (V4D) |
|---|---|---|
| UTV4-AC-009 (行ごと廃止) | 期限切れの lease で push すると deny すること | V4D-056, V4D-067 |
| UTV4-AC-007 | lease を持たない actor の commit を conflict にすること | V4D-056 |
| UTV4-AC-008 | 同じ path に 2 つ目の有効な lease を発行すると fail-close すること | V4D-056 |
| UTV4-AC-013 | 実装 PR での PLAN frontmatter の部分 JSON 化を FLAG にし、Reverse 対 PLAN へ差し戻すこと | V4D-078 |
| UTV4-AC-026 | S3 verified で PoC PLAN を terminal にする判定と、S4 record の必須 field | V4D-054 |
| UTV4-AC-027 | `poc/*` の production への merge を S4 confirmed と正規 V-pair で判定すること | V4D-054 |
| UTV4-AC-038 | L5 / L6 の改訂を lease の無い書き込みとして deny すること | V4D-056 |
| UTV4-AC-040 | 旧層の意味による owner 規則と、L5 チケットの owner 規則 | V4D-073 |
| UTV4-AC-041 | 統合チケットと子チケットの admission receipt | V4D-056, V4D-067 |
| UTV4-AC-042 | 再集計の上限を超えたら基本設計 owner へ route すること | V4D-065 |
| UTV4-AC-043 | lease が重なる 2 チケットの同時発行を deny すること | V4D-056, V4D-067 |
| UTV4-AC-044 | 1 人の時期の lease の発行 | V4D-056 |
| UTV4-AC-045 | 統括 owner の宣言と、統括判断の記録 | V4D-068 |
| UTV4-AC-046 | L4 typed block からの ticket compile と、理由 record 付きの手発行 | V4D-067, V4D-068 |
| UTV4-AC-047 | 大・中・小・原子の 4 階層と、小・中・大への path lease | V4D-055, V4D-056 |
| UTV4-AC-049 | 中チケット単位の incident と admission | V4D-055 |
| UTV4-AC-060 | fence と、旧チケットの lease の停止 | V4D-056, V4D-067 |
| UTV4-AC-062 | lease・budget の無い dispatch を deny すること | V4D-056 |
| UTV4-AC-064 | 原子 PR と中チケットの refactor ゲート | V4D-055 |
| UTV4-AC-065 | 中の発火条件と、大の release 審査での退役候補の参照 | V4D-055 |
| UTV4-AC-066 | 小以上に admission チケットを対で compile し、階層と人数で assignee を決めること | V4D-055, V4D-065 |
| UTV4-AC-067 | 中チケットの人間 review と、原子への人間 review の必須化の禁止 | V4D-055 |
| UTV4-AC-071 | S4 confirmed evidence による frozen への遷移 | V4D-054 |
| UTV4-AC-072 | budget record の無い PoC チケットの deny と、S4 decision までの発行の停止 | V4D-054 |
| 題名「L10 受入候補」 | 受入を L10 の工程とする呼び方 | V4D-073 |
| 非受入「949 PLAN の一括 JSON 化の完了」 | PLAN を JSON 化する前提 | V4D-078 |

## 非受入

- 「完全自動化」「AI による承認の代行」「Issue / DB の意味の正本化」は受入の対象にしない。
- 既存 PLAN の中身の変換は受入の条件にしない。PLAN は凍結し、移行は L8 の照合で行う (V4D-078)。
