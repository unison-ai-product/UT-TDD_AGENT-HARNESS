---
document_id: UT-TDD-CONCEPT-V4-ACCEPTANCE
status: draft_candidate
concept: docs/governance/candidates/ut-tdd-concept-v4.0.md
requirements: docs/governance/candidates/ut-tdd-concept-v4-requirements.md
decision_ledger: docs/governance/candidates/v4-decision-ledger.json
issue: 530
---

# UT-TDD 構想書 v4.0 受入候補 (L12 受入、UAT を含む)

> **改訂メモ (2026-11-12、#1005 のコメント 6822862705):** 要件候補の見直し (残す 11 / 簡素化 41 / 先送り 12 / 撤回 15) に合わせた。**ID は消さない。**
> - 撤回・先送りにした要件だけを受け入れる行は、確認すること欄の先頭に印を付け、release 必須を no にした (行は残す。要件を再開するときに戻す)。release 必須の判定基準 1〜5 を満たす失敗は、同じ失敗を止める別の要件 (FR-013 / 054 / 058 など) の受入が担保する。
> - 簡素化した要件の受入は、要件候補の簡素化後の本文に照らして書き直した (是正 1 回目、2026-11-13)。簡素化・先送り・撤回で外れた確認項目は、行の中に「【1.0.0 では適用しない: 要件 ID と理由】」と明記し、**残した確認項目だけが release 必須の判定の対象**とする (release 必須の yes / no は、残した確認項目に照らして付けた)。「区分」列は 2026-11-12 の見直し前の分類のまま残す。
> - UTV4-FR-080 の受入として UTV4-AC-096 を足した。UTV4-AC-090 は、#591 の 18 件を全件直す前提から、1 件ずつ採否を決める前提へ改めた。

## Authority 境界

本書は #530 の未承認候補である。test-design でも実装の oracle でもない。
v4 の右腕では、受入は L12 (UAT を含む) の工程である (V4D-073)。
承認後、各行は該当する test-design の AT 宣言へ降りる。受入 catalog (JSON) を test-design から生成する仕組みは、UTV4-FR-065 の簡素化で後回し (V4D-070 の宣言は AT 表で持つ)。
本書は「何を観測できれば受入とみなすか」を宣言する。実行主体と実装方式は固定しない。

## 要件・決定台帳との関係

各受入行は、受け入れる要件 (UTV4-FR-xxx) を 1 件以上引く。
どの要件も 1 件以上の受入行で受け入れるか、「受入不要」の表に理由付きで載る。
各受入行は release 必須かどうか (yes / no) を持つ。
この対応は次のコマンドで機械的に確かめる。

```bash
node docs/governance/candidates/v4-ledger-check.mjs
```

書き方の規則 (V4D-087):

- 既存の受入と同じ論点は、既存の行を直す。ID は変えない。
- 新しい ID を作るのは、どの既存の受入にも無い論点だけにする。
- 撤回した中身は「廃止した受入」の表に、撤回の根拠の決定と一緒に残す。

区分の意味: 維持 = 判定の中身を変えていない。既存を更新 = 同じ ID のまま要件に合わせて書き直した。新規 = どの既存の受入にも無い論点。

集計: 維持 38 件 / 既存を更新 34 件 / 新規 22 件 (計 94 件)。行ごと廃止 1 件 (UTV4-AC-009)。

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

集計: release 必須 yes 38 件 / no 57 件 (2026-11-12 の見直しで、撤回・先送りした要件の受入 28 行から 8 行を yes から no へ変え、UTV4-AC-096 を足した。見直し前は yes 46 件 / no 48 件)。

## 受入候補

手段の列: 「negative テスト」は違反を起こして拒否を確かめる受入テスト。「positive テスト」は正しい入力が通ることを確かめる受入テスト。

| ID | 受け入れる要件 | 確認すること | 手段 | 合格条件 | release 必須 | 区分 |
|---|---|---|---|---|---|---|
| UTV4-AC-001 | UTV4-FR-001 | AI が memory・session summary・自分の解釈から「PO 承認済み」を記録しようとする。 | negative テスト + `ut-tdd doctor` | approval record が作られない。provenance 不在で fail-close する。監査記録に残る。 | yes | 維持 |
| UTV4-AC-002 | UTV4-FR-002 | (a) 工程 × 役割の表に、A が 0 個または 2 個以上の行を作る。(b) 表の外の質問 (進捗確認・実行許可・自力で確かめられる事実) を AI が PO へ出す。(c) 表に発注者 / 受託者や契約形態の属性を足す。 | RACI lint + negative テスト | (a) lint が fail-close する。(b) 【1.0.0 では適用しない: UTV4-FR-002 の簡素化で、PO 向け質問の admit / deny の機械判定は作らない。反射的エスカレーションの禁止は CLAUDE.md と advisor の規律で運用する】 (c) lint が deny する。 | no | 既存を更新 |
| UTV4-AC-003 | UTV4-FR-001, UTV4-FR-002 | 高影響境界の変更を、AI が人間の承認 (人間の GitHub アカウントによる PR approve または決定コメント) なしに実行する。 | negative テスト | fail-close する。人間の approval record が無い限り書き込まない。(この守りは UTV4-FR-001 が持つ。UTV4-FR-002 の簡素化で、質問の admit / deny の機械判定は作らない。) | yes | 維持 |
| UTV4-AC-004 | UTV4-FR-003 | チケットに owner を 2 名設定する。または owner を設定しない。 | negative テスト | fail-close する。owner がちょうど 1 名になるまで割り当てが成立しない。 | no | 維持 |
| UTV4-AC-005 | UTV4-FR-003 | owner に provider 名や model 名を設定する。 | negative テスト | deny する。owner は人間ユーザーの identity か logical lane だけ。 | no | 維持 |
| UTV4-AC-006 | UTV4-FR-004 | (a) 3 つの必須 field (やること / ゴールの検証と根拠コマンド / 親の参照) のどれかを欠く Issue を作る。(b) ハーネス独自のチケット store・tracked 記録・投影・ずれ検出を置く。(c) 人間のチケットと AI lane のチケットを並べる。 | Issue テンプレート + lint + `ut-tdd doctor` | (a) Issue テンプレートと lint が拒否する。(b) 置かれていない (置く変更は deny する)。チケットの正本は GitHub Issue / Sub-issue / PR だけ。lease・scope・base / HEAD・budget の field も持たない。(c) 同じテンプレートで並ぶ。違うのは owner の種別だけ。【1.0.0 では適用しない: 旧 (c) 「Issue 本文を編集しても正本へ読み戻さず、ずれを advisory 警告にする」は、UTV4-FR-004 が正本を GitHub にしてずれ検出を作らないため外した】 | no | 既存を更新 |
| UTV4-AC-007 | UTV4-FR-005 | (a) 自分の担当区分の外の path に触る変更を出す。(b) 衝突が起きる。 | negative テスト | (a) path → 担当の表 (advisory) が、担当外であることを示す。表は fail-close にしない。書き込み権限の根拠にもしない。(b) 【1.0.0 では適用しない: UTV4-FR-005 の簡素化で、担当区分外の書き込みの機械停止と、型付き conflict record の返却は作らない】 | no | 既存を更新 |
| UTV4-AC-008 | UTV4-FR-005 | (a) claim 済みのチケットに 2 件目の claim を出す。(b) claim だけを根拠に書き込み権限を得ようとする。 | negative テスト | (a) 2 件目の claim を deny する。(b) claim は書き込み権限の根拠にならない。 | no | 既存を更新 |
| UTV4-AC-010 | UTV4-FR-005 | 同じ PR / HEAD / revision に、異なる memoryId の review request を 2 件出す。 | negative テスト | 2 件目を実行の前に deny する (#421 を継承)。 | yes | 維持 |
| UTV4-AC-011 | UTV4-FR-006 | (a) review receipt / verdict を、別の clone・別の PC から merge 判定に使えない状態 (clone ごとの手元にしか無い状態) に置く。(b) DB にしか無い記録を作る。(c) 設計書やチケットに証跡の本体を書く。 | `ut-tdd doctor` + negative テスト | (a) 別の clone から参照できなければ merge 判定を通さない (保管方式は U-1 の実機確認で決める。確認が済むまで複数 PC の merge は完成扱いにしない)。(b) deny する。DB にしか無い状態は 0 件。(c) deny する。参照側は証跡の ID と digest だけを持つ。【1.0.0 では適用しない: 旧 (a)(b) 「機械の記録 (チケット / verdict / receipt) を markdown だけに書くことを禁じ、1 ファイルに 2 件以上を入れない」(全機械記録の構造化正本化) は、UTV4-FR-006 の簡素化で要件にしない】 | yes | 既存を更新 |
| UTV4-AC-012 | UTV4-FR-006 | harness.db を消して、正本ファイルから作り直す。 | 作り直しの前後比較テスト | 作り直しの前後で索引の内容が一致する。DB にしか無い状態は 0 件。 | yes | 既存を更新 |
| UTV4-AC-013 | UTV4-FR-007 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) v4 への切り替え後に、既存 PLAN ファイルの内容を変える。(b) HEAD から作った照合の母集合 3 種に、対応表に無い要素がある。(c) 切り替え前に PLAN 上の gate や CI を外す。(d) 変更が設計書の成果物所有の範囲の外に出る。 | 照合テスト + `ut-tdd doctor` | (a) fail-close する。(b) fail-close し、切り替えを完了にしない。(c) deny する。(d) 機械が止める。 | no | 既存を更新 |
| UTV4-AC-014 | UTV4-FR-008 | 生成 view (表 / doc) を直接編集する。 | `ut-tdd doctor` | hash の不一致を検出して fail-close する。生成元の identity が示される。 | no | 維持 |
| UTV4-AC-015 | UTV4-FR-008 | 同じ正本から view を 2 回生成する。 | 決定性テスト | byte が同一になる。 | no | 維持 |
| UTV4-AC-016 | UTV4-FR-009 | 【2026-11-12 先送り: 要件が1.0.0 の対象外のため、release 必須にしない】 view 上の変更を、admission を経て構造化正本へ戻す。 | positive テスト | actor・source view・target record・revision を持つ receipt が残る。正本が更新される。 | no | 維持 |
| UTV4-AC-017 | UTV4-FR-008, UTV4-FR-009 | view (スプレッドシート / Office / Google 文書) 上の変更を、正本 (markdown・構造化正本) へ機械で書き戻す。 | negative テスト | deny する。書き戻しの経路は 1.0.0 には無い (UTV4-FR-008)。正本は人間が正本の側で編集する。(admission 経由で正本へ戻す UTV4-FR-009 は先送りで、その受入は UTV4-AC-016。) | no | 維持 |
| UTV4-AC-018 | UTV4-FR-010 | (a) FLAG 1 件だけを根拠に新しい gate を作る。(b) 選んだ行き先と、それより上流を選ばなかった理由の無い振り分けを出す。(c) 同じパターンで修正と再発が閾値を超えて繰り返される。(d) 学習データが保持期間か件数の上限を超える。 | negative テスト | (a) 単一 episode の昇格として deny する。(b) deny する (PR または Issue に理由 1 行が要る)。(c)(d) 【1.0.0 では適用しない: UTV4-FR-010 の簡素化で、保持期間と暴走停止の閾値の機構は持たない (bot は作らない)】 | no | 既存を更新 |
| UTV4-AC-019 | UTV4-FR-010 | 改善候補が要件や設計を直接書き換える。 | negative テスト | deny する。出せるのは proposal / evidence / delta だけ。 | no | 維持 |
| UTV4-AC-020 | UTV4-FR-011 | 【2026-11-12 先送り: 要件が1.0.0 の対象外のため、release 必須にしない】 改善候補が作られる。 | positive テスト | 同じ候補が人間向け digest (generated view) として配られる。採否が decision record に残る。 | no | 維持 |
| UTV4-AC-021 | UTV4-FR-012 | (a) 進捗を人間が手で更新する。モデルが完了を自己申告する。(b) リーダーの全体ビュー (GitHub Projects) から記録へ書き戻す。(c) 集約時刻の無い全体ビューを出す。(d) 未発行の範囲を完了予測に混ぜる。 | negative テスト | (a) 進捗は変わらない。進捗は、チケット・PR・CI・review・merge の事実から GitHub Projects へ一方向に同期した値だけ。(b) deny する。(c)(d) 【1.0.0 では適用しない: UTV4-FR-012 の簡素化で、全体ビューの鮮度表示と、完了の予測 (P50 / P85) は作らない】 | no | 既存を更新 |
| UTV4-AC-022 | UTV4-FR-013, UTV4-FR-023 | (a) hybrid で、author と同じ family の verdict で merge する。(b) single-provider で、UTV4-FR-023 の attestation を満たす同 family の別 session・上位 tier の verdict で merge する。(c) 旧 HEAD の receipt で merge する。(d) reviewer の自由文から verdict を拾う。(e) 受領の無い依頼、または依頼に対応しない受領がある。(f) 単一 provider の fallback で、receipt に cross_family / cross_agent を記録する。 | negative / positive テスト + `ut-tdd doctor` | (a) deny する。(b) 【1.0.0 では適用しない: UTV4-FR-023 の簡素化で、1.0.0 が保証するのは hybrid だけ。単一 provider は現在の fallback (`intra_runtime_subagent` 記録) のままで、`same_family_separated` の admit は作らない】 (c) deny する。(d) deny する。verdict は schema に沿った機械可読の値だけ。(e) doctor が finding を出す。(f) 僭称として deny する。fallback は `intra_runtime_subagent` と記録する。 | yes | 既存を更新 |
| UTV4-AC-023 | UTV4-FR-014 | legacy (Bun / personal path) の green を根拠に、current の failure を相殺する。 | negative テスト | deny する。current identity の failure が残る。 | yes | 維持 |
| UTV4-AC-024 | UTV4-FR-015 | intake の markdown テンプレートに未確定の欄 (例: actor が空) があるまま、AI が値を補って次の工程へ進める。 | review + チェックリスト | review が止める。未確定の値は「未確定」のまま残る。【1.0.0 では適用しない: UTV4-FR-015 の簡素化と UTV4-FR-016 の撤回で、intake の record 化・question event・compile 結果 (`human_decision_required` / `backflow_required`) は作らない】 | no | 維持 |
| UTV4-AC-025 | UTV4-FR-016 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) 人間の approval record なしに L3 IR を frozen にする。(b) 同じ L2 event log から candidate を 2 回作り直す。 | negative テスト + 決定性テスト | (a) fail-close する。(b) byte が同一になる。 | no | 維持 |
| UTV4-AC-026 | UTV4-FR-017 | (a) チケットの schema や CLI に S0〜S4 の状態値を置く。(b) 判定記録 (結論と根拠) の無い PoC チケットを閉じる。(c) 判定記録の無い PoC の成果を production の成果として数える。 | lint + negative テスト | (a) lint が fail-close する。(b) deny する。(c) 数えない。 | no | 既存を更新 |
| UTV4-AC-027 | UTV4-FR-018 | (a) 判定記録が採用を示す前に、PoC チケットの成果物を production path へ merge する。(b) 採用の後でも、production 側の別チケット無しに merge する。(c) プロトへの反応を自由文だけで記録する。 | negative テスト | (a)(b) merge admission が deny する。(c) 【1.0.0 では適用しない: UTV4-FR-018 の簡素化で、prototype 反応の構造化還元 (underlying need・candidate・AC への分解) は要件にしない】 | yes | 既存を更新 |
| UTV4-AC-028 | UTV4-FR-019 | (a) 正本化済みの内容を memory へ再び add する。(b) progress 語・raw log・secret を含む memory を add する。 | negative テスト | (a) 【1.0.0 では適用しない: UTV4-FR-019 の簡素化で、retirement record は持たない。正本化済みの教訓の退役は CLAUDE.md の手順 (`git rm` + 昇格先の PR) で行う】 (b) fail-close する。 | yes | 維持 |
| UTV4-AC-091 | UTV4-FR-019 | (a) runtime がプロバイダー個別の標準メモリの directory へ教訓を書こうとする。(b) 教訓を別のメモリへ写しただけで canonicalized にしようとする。 | negative テスト (hook と memory lifecycle) | (a) hook が書き込みを拒否し、`ut-tdd memory add` を案内する。hook で強制できない経路は、規律と doctor の事後検出で補う。(b) 取り込み先が機構でも正本文書でもないので、遷移を拒否する (UTV4-FR-019 は retirement record を持たないが、この条件を外していない)。 | yes | 新規 |
| UTV4-AC-029 | UTV4-FR-020 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) 学習資産の owner に skill 名 / provider 名 / folder を設定する。(b) 依存する provider の版が変わる。 | negative テスト | (a) deny する。(b) 関連する資産が revalidation_required へ移る。 | no | 維持 |
| UTV4-AC-030 | UTV4-FR-021 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 registry に無い identity pair、同じ pair の両極性、applicability 未指定の skill を推薦の入力にする。 | negative テスト | いずれも fail-close する。未指定を all へ広げない。 | no | 維持 |
| UTV4-AC-031 | UTV4-FR-022 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) 同じ入力で packet を 2 回 compile する。(b) stale skill を削除する。(c) shadow・before/after・独立 review のどれかを欠いて gate へ昇格する。 | 決定性テスト + negative テスト | (a) exact set と digest が同一。(b) deny する。quarantine だけ許す。(c) deny する。 | no | 維持 |
| UTV4-AC-032 | UTV4-FR-023 | (a) single-provider で、同じ provider の別 session・上位 tier が blind packet で review して receipt を出す。(b) 同じ session の subagent が review する。(c) receipt に `cross_family` を記録する。 | positive / negative テスト | (a) 【1.0.0 では適用しない: UTV4-FR-023 の簡素化で、1.0.0 が保証するのは hybrid だけ。`same_family_separated` の admit と別 session の attestation は、最初の導入先が片方の provider しか使えないと分かった時点で見直す】 (b) 全 profile で deny する (同一 session 内 subagent の review は独立 review にならない)。(c) 僭称として deny する。 | yes | 維持 |
| UTV4-AC-033 | UTV4-FR-027, UTV4-FR-013 | (a) reviewer の session id が実在しない、または author と同じ receipt を出す。(b) CI が green でない HEAD への verdict を出す。 | negative テスト | (a) attestation 不成立として deny する。理由は型付き (UTV4-FR-027)。(b) deny する (UTV4-FR-013: candidate HEAD と CI generation へ束縛)。(単一 provider の別 session の attestation は UTV4-FR-023 の簡素化で 1.0.0 の対象外。ここに残すのは UTV4-FR-027 が維持する session id の実在確認と、HEAD / CI への束縛。) | yes | 維持 |
| UTV4-AC-034 | UTV4-FR-023, UTV4-FR-024 | (a) single-provider で、高影響境界の merge を人間 review なしに admit する。(b) 利用上限の record なしに、hybrid から単一 provider の fallback へ下げる。(c) 補償統制の gate が無いまま profile を宣言する。 | negative テスト | (a)(c) 【1.0.0 では適用しない: UTV4-FR-024 の簡素化で、単一 provider の補償統制 (高影響境界への人間 review・月次 sampling・doctor の fail-close 化・mutation 検証) は 1.0.0 の対象外。単一 provider を採るときに作る】 (b) deny する (UTV4-FR-023: 現在の fallback と CLAUDE.md「唯一の回避条件」のまま。上限で止まった記録なしに下げない)。 | yes | 維持 |
| UTV4-AC-035 | UTV4-FR-025 | (a) 計測 record の無い skill / subagent を削除する。(b) FLAG 1 件で surface を退役する。(c) 機能の段階 (planned〜retired) を跳ばして遷移する。(d) 新しい変更が、PR テンプレートの「削るもの / 無し + 理由」欄を空にして出る。 | PR テンプレート + review | (a)(b)(c) 【1.0.0 では適用しない: UTV4-FR-025 の簡素化で、計測 record・surface の 7 class 分類・段階機械 (planned〜retired) は作らない。片付けは UTV4-FR-010 の規律 (効果を確かめた後にだけ片付ける) に従う】 (d) 欄が空、または理由の無い「無し」は、review が差し戻す。 | no | 既存を更新 |
| UTV4-AC-036 | UTV4-FR-026 | (a) 退役ごとの inventory (Bun・PLAN など) に無い legacy token が current surface に出る。(b) DB の schema object を migration なしに drop する。 | `ut-tdd doctor` | いずれも fail-close する。(legacy token の完全 inventory は退役ごとに限る。全体の inventory は求めない。) | yes | 維持 |
| UTV4-AC-037 | UTV4-FR-027 | (a) receipt を candidate worktree の中だけに置く。(b) dirty か未 merge の worktree を gc が回収する。(c) projection writer が入力の欠落を空の成功として返す。 | negative テスト + `ut-tdd doctor` | (a) main 側から見えなければ finding を出す。(b) deny する。(c) finding として fail-close する。 | yes | 維持 |
| UTV4-AC-038 | UTV4-FR-004 | (a) チケットの記録に L4 以上の設計本文や設計判断を書く。(b) L5 詳細設計・L6 仕様の改訂や Reverse をチケットの作業として出す。(c) チケットの完了で L4 の本文を accept 扱いにする。 | negative / positive テスト | (a) deny する。本文は設計書に置く。(b) チケットとして受け付ける。(c) deny する。accept は設計の freeze review だけ。 | yes | 既存を更新 |
| UTV4-AC-039 | UTV4-FR-028 | (a) 「画面ルールを決めてから並行する」チェックリストを満たさないまま、画面プロトの Issue を 2 件発行する。(b) 反応を L2 discovery event に記録せずにチケットを閉じる。(c) Issue テンプレート (2 種) に無い種類で画面プロト / PoC の Issue を発行する。 | チェックリスト + Issue テンプレート + review | (a) チェックリストが未達として、review が止める。(b) 【1.0.0 では適用しない: UTV4-FR-028 の簡素化と UTV4-FR-016 の撤回で、L2 discovery event への接続は要件にしない】 (c) テンプレートの無い種類は発行できない。 | no | 既存を更新 |
| UTV4-AC-040 | UTV4-FR-029 | (a) L0〜L4 の文書に owner を 2 名、または 0 名にする。(b) owner 以外が L3 / L4 の文書を freeze する。(c) Issue / Sub-issue / PR のどれかのチケットに owner を 2 名にする。(d) L8〜L12 の検証の owner を author にする。(e) L8 の食い違いの振り分けを作者と同じ family が判定する。 | negative テスト | いずれも deny する。 | yes | 既存を更新 |
| UTV4-AC-041 | UTV4-FR-030 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 区分をまたぐ合流点の担当を、claim の付け替えの記録 (旧 owner・新 owner・理由・引き取り時の HEAD) なしに替える。 | negative テスト | deny する。 | no | 既存を更新 |
| UTV4-AC-042 | UTV4-FR-031 | (a) 同じチケットの中で 4 回目の是正を出す。(b) 契約 (設計) の食い違いを同じチケットの中で直す。(c) 是正の回数を数える。 | negative テスト + 集計テスト | (a) 受け付けない。(b) deny し、設計の改訂へ戻すよう求める。(c) 回数は receipt から数えられる範囲で機械で出る (全件の記録は求めない)。 | no | 既存を更新 |
| UTV4-AC-043 | UTV4-FR-032 | (a) main の上に無い、または衝突のある candidate を merge admission へ出す。(b) exact HEAD の CI が green でない。(c) exact HEAD に束縛した独立 review の receipt が無い。(d) L10〜L12 のシステム受入を PR の merge だけで閉じる。 | negative テスト | (a)(b)(c) deny する。(d) deny する。システム受入は release の適格性で閉じる。 | yes | 既存を更新 |
| UTV4-AC-044 | UTV4-FR-033 | 参加人数が 1 のときも、claim・review receipt など通常の gate が求める手順を省いて工程を進める。 | negative テスト | 通常の gate が参加人数と無関係に deny する。人数別のモードは無い。【1.0.0 では適用しない: UTV4-FR-033 の簡素化で、人数を理由に省いたことを検出する機構は作らない (観測できないため)。旧 (event) の省略の検査も外す】 | no | 既存を更新 |
| UTV4-AC-045 | UTV4-FR-034 | (a) PO と、PO が委任した担当区分のリーダー以外が、チケットを発行する。(b) メンバーが出した `proposal` ラベルの Issue が、PO またはリーダーの仕分けの前に着手される。(c) チームごとの管理知能が、自区分と区分境界の契約以外を読む。 | negative テスト | (a)(b) deny する。(c) 【1.0.0 では適用しない: UTV4-FR-034 の簡素化で、チームごとの管理知能の視野制限は持たない (管理知能は作らない、UTV4-FR-060 撤回)】 | yes | 既存を更新 |
| UTV4-AC-046 | UTV4-FR-035 | (a) AI が自分でチケットの発行を確定する。(b) 人間が承認していない `draft` ラベルの Issue に着手する。(c) 生成元 (上流成果物の path と revision) の無い下書きを出す。(d) 同じ入力と同じ policy version で下書きを 2 回作る。 | negative テスト | (a)(b) deny する。人間が承認した draft だけ着手できる。(c)(d) 【1.0.0 では適用しない: UTV4-FR-035 の簡素化で、決定的な下書き生成 (同じ入力から同じ集合) と compiler は作らない。生成元の機械検査も要件にしない】 | yes | 既存を更新 |
| UTV4-AC-047 | UTV4-FR-036 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) 最上位の Issue 以外で親の無いチケットを作る。(b) 親を 2 つ持つチケットを作る。(c) 4 段目のチケットを作る。(d) GitHub の sub-issue 関係を見る。 | schema 検証 + 投影テスト | (a)(b)(c) schema 検証が deny する。(d) 正本の親参照から投影されている。 | no | 既存を更新 |
| UTV4-AC-048 | UTV4-FR-008 | (a) 要求 / 要件 / 設計の記録を更新しても、スプレッドシート view が再生成されない。(b) シートの直接編集が正本へ入る。(c) 正本を 1 枚の文書へ集める要求を置く。 | `ut-tdd doctor` + negative テスト | (a) 再生成の差分として fail-close する (UTV4-FR-080)。(b) 入らない。書き戻しの経路は無い (admission 経由で受理する UTV4-FR-009 も 1.0.0 では作らない)。(c) 要求として受け付けない。 | no | 維持 |
| UTV4-AC-049 | UTV4-FR-037 | (a) 2 つ以上の区分に跨る欠陥を、`incident` Issue なしに個別の修正で merge する。(b) `hold` ラベルが付いている間に、`ut-tdd pr merge` で影響下の PR を merge する。(c) 契約の誤りが原因の incident を Reverse 対なしに閉じる。(d) hotfix branch へ直接 push する。 | negative テスト | いずれも deny する。(d) は branch protection が拒否する。【1.0.0 では適用しない: UTV4-FR-037 の簡素化で、依存 graph からの影響範囲の機械判定は 1.0.0 の後に回す。停止は `hold` ラベルを見て行う】 | yes | 既存を更新 |
| UTV4-AC-050 | UTV4-FR-038 | 【2026-11-12 先送り: 要件が1.0.0 の対象外のため、release 必須にしない】 (a) secret / PII / private transcript を含む event を改善 corpus へ export する。(b) project identity の無い intake record を作る。(c) Issue 本文を正本として要件を上書きする。 | negative テスト | いずれも deny する。 | no | 維持 |
| UTV4-AC-051 | UTV4-FR-039 | 【2026-11-12 先送り: 要件が1.0.0 の対象外のため、release 必須にしない】 (a) prototype record と反応 event なしに、L3 の画面仕様を freeze する。(b) モック画像を画面仕様の正本として参照する。 | negative テスト | (a) compile が backflow_required を返す。(b) deny する。正本は生成した製本物だけ。 | no | 維持 |
| UTV4-AC-052 | UTV4-FR-040 | (a) 新規の skill が、frontmatter に出典の PR / Issue を持たない。(b) 既存の skill に、モデルが既に知っている一般手順の skill が残る。 | lint + 棚卸し (#727) | (a) lint が deny する。(b) 1 度の棚卸しで退役候補として一覧に出る。【1.0.0 では適用しない: UTV4-FR-040 の簡素化で、実録との相関の機械照合 (GENERIC_PROCEDURE class) と firing の相関による quarantine は作らない】 | no | 維持 |
| UTV4-AC-053 | UTV4-FR-041 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) judgement record の無い LLM verdict を admission の入力にする。(b) transcript だけから判断を組み立て直す。 | negative テスト | いずれも deny する。 | no | 維持 |
| UTV4-AC-054 | UTV4-FR-042 | 【2026-11-12 先送り: 要件が1.0.0 の対象外のため、release 必須にしない】 (a) calibration を測っていない判断種別を分類器へ昇格する。(b) 単一 episode で決定的 check へ昇格する。(c) 昇格後の check と LLM 判断の before/after 差分が無い。 | negative テスト | (a)(b) deny する。(c) 昇格を deny し、shadow へ戻す。 | no | 維持 |
| UTV4-AC-055 | UTV4-FR-043 | 【2026-11-12 先送り: 要件が1.0.0 の対象外のため、release 必須にしない】 (a) 機械判断化した判断種別で frontier tier へ routing する。(b) tier や cost を品質の根拠として記録する。 | routing テスト + negative テスト | (a) routing が下位 tier か check へ下がり、finding を出す。(b) deny する。 | no | 維持 |
| UTV4-AC-056 | UTV4-FR-044 | (a) 選好軸の項目を、人間の decision record なしに deny 条件へ昇格する。(b) 良否軸と選好軸を分けずに 1 つの記録に書く。 | negative テスト | いずれも deny する。 | yes | 維持 |
| UTV4-AC-057 | UTV4-FR-045 | 【2026-11-12 先送り: 要件が1.0.0 の対象外のため、release 必須にしない】 (a) 人間が読める view の無い判断種別を機械判断化へ昇格する。(b) view 側の承認を admission なしに正本へ入れる。 | negative テスト | いずれも deny する。 | no | 維持 |
| UTV4-AC-058 | UTV4-FR-046 | (a) 手描きの図を依存や遷移の正本として参照する。(b) 同じ記録から生成した図の digest が一致しない。(c) テーブル定義を、スプレッドシート同期 view 以外の自由文で正本にする。 | negative テスト | (a) deny する。図は必要なときに生成し、保存しない。(b)(c) 【1.0.0 では適用しない: UTV4-FR-046 の簡素化で、図の保存・digest 管理・編集の戻しは作らない。ER は DB を持つ consumer のテンプレートに任せる】 | no | 維持 |
| UTV4-AC-059 | UTV4-FR-047 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) 図の側の編集を admission なしに記録へ入れる。(b) 記録の更新後に作り直していない図を配る。 | negative テスト + `ut-tdd doctor` | (a) deny する。discrepancy record だけが残る。(b) doctor が fail-close する。 | no | 維持 |
| UTV4-AC-060 | UTV4-FR-048 | (a) 同じ設計文書の path へ、2 つの lane が別々に `backflow` Issue を起こす。(b) `backflow` が open で `hold` ラベルが付いている間に、`ut-tdd pr merge` で下流の PR を merge する。(c) 契約の改訂の後、改訂の下書きを自動で作る。 | negative テスト | (a) 同じ文書の open Issue があれば追記され、1 件に集まる。(b) deny する。(c) 【1.0.0 では適用しない: UTV4-FR-048 の簡素化で、改訂下書きの自動作成 (管理知能の下書きを含む) は作らない】 | yes | 既存を更新 |
| UTV4-AC-061 | UTV4-FR-049 | (a) role の根拠 (`src/team/delegation-routing.ts`) に無い subagent_type で Agent を起動する。(b) 手書きの subagent 定義ファイルを置く。(c) モデルを世代固定の ID で書く。または catalog に無いモデル名を解決させる。 | guard テスト + `ut-tdd doctor` | (a) guard が deny する。(b) deny する (撤去済み、#1002)。(c) エイリアス / family 名で持ち、catalog に無ければ fail-close する。解決した ID が receipt に残る。【1.0.0 では適用しない: UTV4-FR-049 の簡素化で、provider 定義の生成と、生成物との食い違いの検出は作らない】 | no | 維持 |
| UTV4-AC-062 | UTV4-FR-050 | (a) LLM の orchestrator (control lane) が、gate (`ut-tdd pr merge`・review custody) を経ずに合流点を閉じる。(b) single-provider で `cross_family` を記録する。(c) single-provider / standalone で、hybrid と別の guard を使う。 | negative テスト | いずれも deny する。orchestrator は closing authority を持たない。【1.0.0 では適用しない: UTV4-FR-050 の簡素化で、dispatch の engine は作らず、管理知能も作らない (旧 (a) の管理知能の項目)】 | yes | 既存を更新 |
| UTV4-AC-063 | UTV4-FR-051 | (a) hybrid で、author が blind packet を組む。(b) author の claim や自己評価が packet に入る。(c) reviewer の session が author と memory namespace を共有する。(d) 反証試行の記録が無い PASS を出す。(e) reviewer の tier が author より下。 | negative テスト | (a)(b) deny する (packet は control plane が生成する)。(c) attestation 不成立で deny する。(d) PASS-WEAK へ下がる。(e) deny する。【1.0.0 では適用しない: UTV4-FR-051 の簡素化で、単一 provider の blind review の admission は 1.0.0 の対象外 (2 lane の並走は高影響のときだけ、back-annotate は後回し)】 | yes | 維持 |
| UTV4-AC-064 | UTV4-FR-052 | (a) 1 つの PR に機能の変更と refactor を混ぜる。(b) refactor チケットが既存の oracle を変える、または新しい機能の oracle を足す。(c) 退役 (削る作業) を refactor 以外のチケットで行う。 | negative テスト | (a) deny し、分割を求める。(b) 振る舞いの不変の違反として deny する。(c) deny する。 | no | 既存を更新 |
| UTV4-AC-065 | UTV4-FR-053 | (a) `src/state-db/refactor-candidates.ts` の advisory 一覧が、候補を出す。(b) 閾値を越えたのに、refactor Issue が自動で作られない。 | positive テスト | (a) 一覧は advisory として出る (fail-close にしない)。人または AI がそれを見て refactor Issue を切る。(b) 【1.0.0 では適用しない: UTV4-FR-053 の簡素化で、閾値の自動判定と、管理知能による下書きの自動作成は作らない】 | no | 既存を更新 |
| UTV4-AC-066 | UTV4-FR-054 | (a) author が自分の PR を admitter として merge する。(b) admitter が成果物を書き換える。(c) 実行の着手後に検収の条件を変える。(d) 実行と同じ family が検収する。(e) 1 人運用の self-admission を印なしで記録する。(f) review の PASS が無い PR を検収済みとして数える、または設計が merge される前の状態のまま main へ反映する。(g) 状態を、その時点の HEAD で再検証せず申告のまま使う。(h) 依存先の設計が merge される前に、下流のチケットを着手する。(i) 依存先の設計が merge された後に、下流のチケットを着手する。 | negative テスト + 正常系テスト | (a) deny する。(b) deny し、author へ差し戻す。(c)(d)(e) deny する。(f)(g)(h) deny する。(i) 着手を許可する。【1.0.0 では適用しない: UTV4-FR-054 の簡素化で、admission チケットと readiness 3 状態 (contract_frozen / artifact_verified など) の状態機械は作らない。状態は GitHub の状態 (設計 merge 済み / review PASS / merge 済み) と HEAD からの再検証で代える】 | yes | 既存を更新 |
| UTV4-AC-067 | UTV4-FR-055 | (a) 参加人数が 2 以上のとき、L9 以上に関わる実装を author 以外の人間 review なしに admit する。(b) 参加人数が 1 のとき、AI blind lane で代えたのに evidence tier と self-admission の印を記録しない。 | negative テスト | いずれも deny する。 | yes | 既存を更新 |
| UTV4-AC-068 | UTV4-FR-056 | (a) risk 信号の record なしに深度 profile を deep にする。(b) 必須最小 4 要素 (初期画面ルール・inventory / flow・fixture 契約・typed finding) のどれかを省く。(c) 初期画面ルールの freeze 前に、画面プロトのチケットを 2 名以上に分けて発行する。(d) fixture が本番 schema と違う形を持つ。(e) 異常系の必須セットを欠く画面を検証完了にする。(f) screen finding を自由文だけで記録する。(g) screen id を持たない FE の実装の変更を出す。 | チェックリスト + review | (b)(d)(e) テンプレートのチェックリストで差し戻す。(c) チェックリストで止める (UTV4-FR-028)。(f) 型付きが必須で、差し戻す。(g) deny する。画面の設計から FE の実装まで screen id で追える。(a) 【1.0.0 では適用しない: UTV4-FR-056 の簡素化で、深度 profile のエンジンと 11 種の record は作らない】 | no | 既存を更新 |
| UTV4-AC-069 | UTV4-FR-057 | 【2026-11-12 先送り: 要件が1.0.0 の対象外のため、release 必須にしない】 (a) fixture 契約・異常系セット・finding・checklist のどれかを欠く screen id を、製本点 (a) で画面仕様へ束ねる。(b) ハーネス自身のスプレッドシート view や digest を、プロト工程なしに L5 詳細設計へ進める。 | negative テスト | (a) compile が backflow_required を返す。(b) deny する。 | no | 維持 |
| UTV4-AC-070 | UTV4-FR-056 | (a) 意味ロジックの判定器の出力を Gold として登録する。(b) 予測値を確定値と同じ表示で描く。(c) 棄却条件の無い仮説 record を作る。 | review | (a) deny する。独立した Gold が要る (Gold ledger)。(b)(c) 【1.0.0 では適用しない: UTV4-FR-056 の簡素化で、予測値の表示規約と仮説 record は作らない (11 種の record のエンジンは作らない)】 | no | 維持 |
| UTV4-AC-071 | UTV4-FR-058 | (a) AI lane・管理知能・review verdict が要求の記録を frozen にする。(b) 人間の freeze decision record も、PoC チケットの判定記録 + 人間の ack も無いまま frozen にする。(c) provisional の要求を view で確定値と同じ表示にする。(d) AI 間の解釈の食い違いを、一方の AI が確定して下流へ流す。 | negative テスト | (a)(b) deny する。(c) 表示規約の違反として finding を出す。(d) deny する。discrepancy record が上流 owner へ上がる。 | yes | 既存を更新 |
| UTV4-AC-072 | UTV4-FR-059 | (a) PoC 期の設定・規約・CI を、production 側のチケットを起こさずに production path へ持ち込む。(b) 期限を持たない discovery の検収雛形を発行する。(c) 期限を過ぎた PoC チケットを検査する。(d) 期限を過ぎた状態で新しいチケットを発行する。 | negative テスト + 正常系テスト | (a) deny する。production 側のチケットとして起こし直すよう求める。(b) deny する。(c) finding (警告) を 1 件出す。(d) 発行を止めない。 | no | 既存を更新 |
| UTV4-AC-073 | UTV4-FR-060 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) 管理知能の出力を、Kernel の検証なしに記録や gate の入力にする。(b) 「プロダクトの管理」と「ハーネス自身の管理」の名前空間を混ぜて書く。(c) 管理知能の機能の一覧を見る。 | negative テスト + 経路の静的検査 | (a) そのような経路が 0 件。実行しても deny する。(b) deny する。(c) F1〜F10 の 10 個が読める。 | no | 新規 |
| UTV4-AC-074 | UTV4-FR-061 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) 管理知能を外した状態で、中核の受入を流す。(b) 管理知能が記録を直接書く。(c) 外部監査 P-02 の 10 条件を確かめる。(d) 言語の決定の記録を見る。 | 中核の受入スイート + negative テスト + 条件の検査 | (a) 中核は手動の計画で動き、中核の受入が通る。(b) deny する。(c) 10 条件がすべて満たされる。(d) ADR-001 が更新されている。ADR-010 は無い。 | no | 新規 |
| UTV4-AC-075 | UTV4-FR-062 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) Windows + Node 24 で境界の型を作り直す。(b) 同じ入力を TS と Python の検証に通す (欠落と null・未知の field・union・数値範囲・default・型の自動変換)。(c) 生成器が扱えない構文の schema を通す。(d) 手で書いた境界の型を置く。 | 再生成の差分テスト + 合否一致テスト + lint | (a) 差分が 0。(b) 全ケースで合否が一致する。(c) 生成の時点で拒否する。(d) lint が deny する。 | no | 新規 |
| UTV4-AC-076 | UTV4-FR-063 | 【2026-11-12 先送り: 要件が1.0.0 の対象外のため、release 必須にしない】 並行する作業の着地順の提案を出す。その提案を merge の条件に使おうとする。 | positive / negative テスト | 提案は導出に使った入力 (依存・重なる path・base の commit) を含む。merge の可否は gate だけが決める。 | no | 新規 |
| UTV4-AC-077 | UTV4-FR-064 | (a) 差分から影響するテストと AT を出す。(b) 宣言されていない依存がある。(c) 全回帰との一致を示さずに検査を省く。(d) stable へ昇格する。(e) 一致が示された後、文書だけの変更で、関係しない単位が回る。(f) 単位を選べない変更が、一部の単位だけで merge できる。(g) main への merge 後、またはリリースの前に、一部の単位だけを回す。(h) 別 HEAD の単位結果で merge 判定をする。(i) 単位に分けた後のテストの件数が、分ける前より少ない。(j) 一致が示され、単位を選べる PR で、影響ありと導いた単位を回さずに merge しようとする。 | 影響導出テスト + negative テスト + CI の実行記録 | (a) 影響しないと判断した根拠も出る。グラフは HEAD から計算し直す。(b) 影響ありとして扱う。(c) deny する。(d) 全受入が走る。(e) 回らない。(f) 全単位を要求する。(g) 全単位が回る。一部だけなら deny する。(h) deny する。(i) fail-close する。(j) merge gate が deny する。 | yes | 既存を更新 |
| UTV4-AC-078 | UTV4-FR-065 | (a) 宣言 (検証する要件・依存する path・環境の前提) の無い AT を置く。(b) 受入 catalog を手で編集する。(c) release のときに宣言を読む。(d) 環境の前提を満たさない AT を実行する。 | AT 表の検査 + preflight テスト | (a) deny する。(b) 派生物として、再生成の差分で検出し fail-close する (UTV4-FR-080)。test-design から受入 catalog を生成する仕組みは UTV4-FR-065 の簡素化で後回し。(c) 「今回必須の AT」と「前回の合格を流用できる AT (依存 path が変わっていないもの)」が機械で分かれる。(d) 実行せず、理由を返す。【1.0.0 では適用しない: 旧 (a) の「実行の種類・入力の形式・必須の条件」の宣言項目と、test-design からの catalog 生成は、UTV4-FR-065 の簡素化で外した】 | yes | 新規 |
| UTV4-AC-079 | UTV4-FR-066 | 【2026-11-12 先送り: 要件が1.0.0 の対象外のため、release 必須にしない】 右腕の層の構成と左右の対を読む。 | 層の registry の検査 | L7〜L14 が UTV4-FR-066 のとおり並ぶ。対は L5 ↔ L9、L4 ↔ L10、L8 ↔ L4〜L6。L11 総合レビューは無く、各層の gate に分かれている。 | no | 新規 |
| UTV4-AC-080 | UTV4-FR-067 | (a) 食い違いが残り、振り分けの済んでいない状態で、リリース前の as-built 照合を通す。(b) 1 件の食い違いを 2 つの行き先へ振り分ける。(c) 作者と同じ family が振り分けを判定する。(d) 移行の前後で成熟度の段が下がる。 | リリース前の照合テスト + negative テスト | (a)(b)(c) deny する (リリースの条件: 食い違いが 0 件か全件振り分け済み)。(d) 機械が検出し、移行を通さない。(UTV4-FR-067 の簡素化で、照合はチケットごとの gate ではなくリリース前の照合として回す。) | yes | 新規 |
| UTV4-AC-081 | UTV4-FR-068 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) 右腕の作業の順序 (証拠集め → 判定 → 設計還流とリファクタリング → 検証 → 仕様書) を跳ばす。(b) 右腕で振る舞いを変える変更を入れる。(c) リファクタリングと検証を同じ family が行う。(d) Reverse の採点結果を型の無い文で出す。 | negative テスト | (a)(b)(c) deny する。(b) の変更は次の左腕のチケットへ回る。(d) Kernel の検証が deny する。 | no | 新規 |
| UTV4-AC-082 | UTV4-FR-069 | 【2026-11-12 先送り: 要件が1.0.0 の対象外のため、release 必須にしない】 (a) 廃止した層番号と工程名の残りを探す。(b) docs/templates/vmodel/ の有無を見る。(c) L6 のテンプレートの本数を数える。(d) consumer に配るテンプレートの path を変える。 | grep / lint + canary | (a) 残りが 0 件。(b) 無い。(c) 1 本。(d) canary が通る。どれかが欠ければ切り替えを完了にしない。 | no | 新規 |
| UTV4-AC-083 | UTV4-FR-070 | 【2026-11-12 先送り: 要件が1.0.0 の対象外のため、release 必須にしない】 (a) 置き場所の registry に無い場所へ記録を書く。(b) doctor を巡回させる。 | guard テスト + `ut-tdd doctor` | (a) guard が deny し、正しい path を示す。(b) registry との外れを報告する。fail-close にはしない。 | no | 新規 |
| UTV4-AC-084 | UTV4-FR-071 | このリポジトリで hook・gate・guard を動かす。 | hook の解決先テスト | 判定に使うのは .ut-tdd/ の下のリリース harness だけ。開発中の product/ のコードは判定に使われない。 | yes | 新規 |
| UTV4-AC-085 | UTV4-FR-072 | (a) チケットを閉じる。(b) 自己申告の数字を入れる。(c) 工程ごとに束ねて読む。 | 手測りの確認 + negative テスト | (a)(c) 【1.0.0 では適用しない: UTV4-FR-072 の簡素化で、チケットごとの作業ログと常時の取り込みは作らない。provider の請求画面と GitHub の事実から月 1 回の手測りで足りる】 (b) 入力にしない。専用の DB テーブルは無い。 | no | 新規 |
| UTV4-AC-086 | UTV4-FR-073 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) 層を凍結する。(b) 仮の値の見直し条件が成り立つ。 | gate テスト + positive テスト | (a) G6「WBS 完備」を機械で判定する。満たさなければ凍結しない。(b) 見直しのチケットの下書きが自動で作られる。 | no | 新規 |
| UTV4-AC-087 | UTV4-FR-074 | (a) 登録簿に無い外部ライブラリに依存する。(b) PO の承認記録なしにライセンスを承認済みにする。(c) 社内の部品を探す。(d) v4 の補強だけを理由に、OSS を登録簿に載せて依存にする。 | lint + negative テスト | (a) lint が fail-close する。(b) deny する。(c) 【1.0.0 では適用しない: UTV4-FR-074 の簡素化で、社内部品カタログと社内ライブラリへの昇格は後回し (#871)】 (d) 承認記録の有無によらず deny する。参考にした OSS は、名前と参考にした点だけが記録される。 | yes | 新規 |
| UTV4-AC-088 | UTV4-FR-075 | (a) 権限 (authorization) を変える実装のチケットを、着手前の PO 承認記録なしに進める。(b) メンバーと権限の表 (GitHub team と members 表) を見る。 | negative テスト + 表の確認 | (a) deny する。(b) 人 → 役割・担当区分の表があり、操作者・PC の識別を含む。【1.0.0 では適用しない: 旧 (b) の「F10 のチームマネジメントの入力」は、管理知能を作らない (UTV4-FR-060 撤回) ため外した】 | yes | 新規 |
| UTV4-AC-089 | UTV4-FR-076 | 【2026-11-12 撤回: 要件が撤回のため、release 必須にしない】 (a) 効く基本原則を 1 つも持たない設計判断の記録を出す。(b) 既存の論点に新しい ID の記録を作る。 | lint + review | (a) lint が deny する。(b) 既存の記録を同じ ID で更新するよう差し戻す。 | no | 新規 |
| UTV4-AC-090 | UTV4-FR-006, UTV4-FR-007, UTV4-FR-013 | 【2026-11-12 見直し】#591 の 18 件の一覧を読む (18 件すべてを v4 で直すことは要件にしない。1 件ずつ採否を決めた記録を読む)。| 一覧と要件の照合 | 18 件すべてに採否 (直す / 直さない + 理由) が付いている。直す項目は、実現する要件 ID を 1 件以上持つ。| no | 新規 |
| UTV4-AC-092 | UTV4-FR-077 | (a) 脅威モデルの脅威のうち、攻撃シナリオを 1 つも持たないものがある。(b) シナリオが、guard・hook・review custody・merge gate のすり抜け、prompt injection、供給網のどれかの攻撃面を欠く。(c) すり抜けに成功したシナリオがあるまま、リリースする。(d) 成功したシナリオを、塞ぐ機構と回帰テストなしに解決済みにする。(e) guard・hook・review custody・merge gate のどれかを変える PR で、シナリオを再実行しない。(f) シナリオの回帰テストを削除する。 | lint + レッドチームの実行記録 + negative テスト | (a)(b) lint が fail-close する。(c) リリースの gate が deny する。(d) deny する。(e) merge gate が deny する。(f) fail-close する。 | yes | 新規 |
| UTV4-AC-093 | UTV4-FR-077, UTV4-FR-078 | (a) ハーネス自身への攻撃役を、対象を書いた family と同じ family にする。(b) 製品への攻撃役を、成果物を書いた family と同じ family にする。 | negative テスト | (a)(b) 攻撃検証の記録として受け付けない。 | yes | 新規 |
| UTV4-AC-094 | UTV4-FR-078 | (a) 高影響境界に触れる製品を、攻撃検証の結果へのリンクなしにリリースする。(b) 攻撃検証の対象に本番の環境を指定する。(c) L7 の検証工程に、DAST・fuzz・ペネトレーションテストのどれかが無い。(d) 製品の脅威モデルから導かれていないシナリオだけで攻撃検証を済ませる。(e) 攻撃検証の記録が、シナリオ・対象の revision・成否・塞いだ機構への参照のどれかを欠く。 | negative テスト | (a) リリースの gate が deny する。(b) fail-close する。(c)(d) 検証工程の完了として受け付けない (UTV4-FR-078 の簡素化でツールは作らないが、テンプレートとチェック欄でこの項目を確かめる)。(e) 記録として受け付けない。 | yes | 新規 |
| UTV4-AC-095 | UTV4-FR-079 | (a) readable_versions に含まれない版の記録を読ませる。(b) writable_version 以外の版で記録を書く。(c) migration_ref なしに writable_version を引き上げる。(d) 更新の前に、導入済みの全記録が新しい版の readable_versions に入るかを検査しない。(e) 新しい writable_version で書いた記録が残っているのに、その版を読めない旧版へ rollback する。 | negative / positive テスト | (a) 型付きの finding で止める。(b)(c) deny する。(d) 更新を始めない。(e) 更新の前に拒否し、rollback できない範囲を示す。旧版の readable_versions に入る範囲と、移行前に退避した記録から戻せる範囲は rollback できる。 | yes | 新規 |
| UTV4-AC-096 | UTV4-FR-080 | (a) 派生する一覧 (trace 表・受入 catalog・書き出しなど) を手で編集した状態で CI を回す。(b) 再生成のコマンドが 2 本以上ある。(c) 派生物が生成元 identity と「編集禁止」を持たない。 | CI の再生成差分検査 + negative テスト | (a) 再生成して差分が出るので CI が fail する。(b) 再生成のコマンドは 1 本だけである。(c) 欠けた派生物を検出する。 | no | 新規 |

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
