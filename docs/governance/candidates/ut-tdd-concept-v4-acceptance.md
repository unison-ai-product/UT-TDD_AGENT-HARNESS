---
document_id: UT-TDD-CONCEPT-V4-ACCEPTANCE
status: draft_candidate
concept: docs/governance/candidates/ut-tdd-concept-v4.0.md
requirements: docs/governance/candidates/ut-tdd-concept-v4-requirements.md
plan: docs/plans/PLAN-L1-09-ut-tdd-concept-v4-candidates.md
---

# UT-TDD 構想書 v4.0 L10 受入候補 (positive / negative oracle)

## Authority 境界

本書は PLAN-L1-09 の未承認候補であり、test-design でも実装 oracle でもない。承認後、各行は該当する下流 PLAN の
test-design へ `CANDIDATE-*` として降下し、本書は候補から昇格記録へ役割を変える。ここでの oracle は「何を
falsify できれば受入とみなすか」の宣言であり、実行主体・実装方式を固定しない。

## 受入候補

| ID | 対応要件 | 刺激 (stimulus) | oracle |
|---|---|---|---|
| UTV4-AC-001 | FR-001 | AI が memory / session summary / 自身の解釈から「PO 承認済み」と記録する | approval record が生成されず、provenance 不在として fail-close。監査記録に残る |
| UTV4-AC-002 | FR-002 | 層別境界表の外にある質問 (進捗確認・実行許可・自力で確定できる事実) を AI が PO へ投げる | deny (反射的エスカレーション)。advisor 相談と実測の要求が返る |
| UTV4-AC-003 | FR-002 | 高影響境界 (production / destructive / auth / payment / PII / secret / licensing / 外部 API) の変更を AI が承認なしに実行する | fail-close。人間 approval record が無い限り write しない |
| UTV4-AC-004 | FR-003 | チケットに owner 2 名、または owner 無しを設定する | fail-close。exactly-one owner が満たされるまで assignment 不成立 |
| UTV4-AC-005 | FR-003 | owner に provider 名 / model 名を設定する | deny。owner は人間ユーザー identity または logical lane のみ |
| UTV4-AC-006 | FR-004 | 人間ユーザーが発行したチケットと AI lane が受けたチケットを同じ projection で列挙する | 同一 schema で列挙され、owner 種別だけが異なる |
| UTV4-AC-007 | FR-005 | lease を持たない actor が対象 path を編集して commit する | typed conflict として所有者へ戻り、merge admission が deny |
| UTV4-AC-008 | FR-005 | 同一 path に 2 つの有効 lease を発行する | 2 つ目の発行が fail-close |
| UTV4-AC-009 | FR-005 | 期限切れ lease で push する | deny。renewal か takeover receipt が必要 |
| UTV4-AC-010 | FR-005 | 同一 PR / HEAD / revision に異なる memoryId の review request を 2 件出す | 2 件目が実行前に deny (#421 の要求を継承) |
| UTV4-AC-011 | FR-006 | record (チケット / verdict / receipt) を markdown だけに書き、構造化 file を作らない | doctor が record 不在として fail-close |
| UTV4-AC-012 | FR-006 | 同じ record を構造化 file と DB の双方で独立に編集し値を食い違わせる | DB は projection として再構築され、file 側の値が勝つ。差分は finding |
| UTV4-AC-013 | FR-007 | 実装 PR の中で PLAN frontmatter の一部だけを JSON へ引き剥がす | PR スコープ規律違反として FLAG。専用 Reverse 対 PLAN へ差し戻し |
| UTV4-AC-014 | FR-008 | 生成 view (表 / doc) を直接編集する | hash 不一致を doctor が検出し fail-close。生成元 identity が提示される |
| UTV4-AC-015 | FR-008 | 同じ正本から view を 2 回生成する | byte 同一 (決定性) |
| UTV4-AC-016 | FR-009 | view 上の変更を admission 経由で構造化正本へ戻す | actor / source view / target record / revision を持つ receipt が残り、正本が更新される |
| UTV4-AC-017 | FR-009 | view 上の変更を markdown 正本へ機械書き戻しする | deny。markdown 正本は人間編集のみ |
| UTV4-AC-018 | FR-010 | FLAG 1 件だけを根拠に新しい doctor gate を実装する | 単一 episode 昇格として deny。改善候補として Reverse へ route される |
| UTV4-AC-019 | FR-010 | 改善候補が Requirement / 設計を直接書き換える | deny。proposal / evidence / delta のみ生成 |
| UTV4-AC-020 | FR-011 | 改善候補が生成されたとき | 同一候補が人間向け digest (generated view) として配られ、採否が decision record に残る |
| UTV4-AC-021 | FR-012 | 進捗表示を人間が手で更新する / モデルが完了を自己申告する | 進捗 projection は変化しない。チケット・PR・CI・review・merge の事実のみが入力 |
| UTV4-AC-022 | FR-013 | (a) hybrid profile で author と同 family の reviewer verdict で merge する / (b) single-provider profile で FR-023 の attestation (別 session・上位 tier・blind packet・CI green) を満たす同 family reviewer verdict で merge する / (c) いずれの profile でも旧 HEAD の receipt で merge する | (a) deny / (b) admit、evidence tier は `same_family_separated` (AC-032 と同一 oracle) / (c) deny (既存 review custody の再確認) |
| UTV4-AC-023 | FR-014 | legacy (Bun / personal path) の green を根拠に current failure を相殺する | deny。current identity の failure が残る |
| UTV4-AC-038 | FR-004 | 詳細設計 (L5) / 仕様 (L6) の改訂をチケット無しで commit する / チケット record に設計本文を格納する / L4 基本設計の本文をチケット完了で accept 扱いにする | 順に: lease 無し書き込みとして deny (AC-007 と同型) / deny (本文は markdown 正本へ digest 束縛のみ) / deny (accept は pair-freeze review のみ) |
| UTV4-AC-039 | FR-028 | 初期画面ルールの freeze record が無い状態で画面プロトチケットを 2 件以上発行する / 反応を discovery event に記録せずプロトチケットを完了にする | 前者 2 件目が deny / 後者 deny |
| UTV4-AC-040 | FR-029 | L3 要件文書または L4 基本設計文書に owner を 2 名設定する / owner 以外が L4 文書を freeze する / L5 チケットに owner 2 名 | いずれも deny (AC-004 と同型) |
| UTV4-AC-041 | FR-030 | 子チケットの admission receipt が欠けた状態で統合チケットを完了にする / takeover receipt 無しに別担当が統合チケットへ commit する | いずれも deny |
| UTV4-AC-042 | FR-031 | 再集計が上限回数を超えて個別修正へ差し戻される | deny。基本設計 owner への route record が生成される |
| UTV4-AC-043 | FR-032 | main へ rebase していない (merge-base ≠ main HEAD) candidate を merge admission する / lease が重なる 2 チケットを同時発行する | 前者 deny (rebase 要求)、後者 2 件目 deny (AC-008 と同型) |
| UTV4-AC-044 | FR-033 | 1 人フェーズでチケット / lease を発行せずに commit を merge admission へ出す / 2 人目参加時に takeover receipt 無しで scope を分ける | いずれも deny |
| UTV4-AC-045 | FR-034 | 統括 owner が未宣言のまま合流 takeover を承認する / AI が統括判断 (切り分け・差し戻し先) を decision record として生成する / 進捗値を手入力する | いずれも deny |
| UTV4-AC-046 | FR-035 | 同一 L4 typed block と policy version から compile を 2 回行う / 責務・依存行列を持たない L4 文書からチケットを compile する / 理由 record 無しに手発行する | 順に: exact set と digest が同一 / 候補 0 件 + finding (推測生成しない) / deny |
| UTV4-AC-047 | FR-036 | 親を持たない原子チケットを発行する / 小チケットに中と大の 2 親を付ける / 原子を小を飛ばして中の直下に置く / 子の admission が 1 件でも欠けた中チケットを完了にする / 小・中・大に path lease を直接付ける | いずれも deny |
| UTV4-AC-048 | FR-008 | 要求 / 要件 / 設計の record を更新してもスプレッドシート view が同期されない / シート側の直接編集が admission を経ずに正本へ反映される / 正本を 1 枚の文書へ集約する要求を置く | 順に: doctor が同期 drift を fail-close / deny (FR-009) / 要求として受理しない |
| UTV4-AC-049 | FR-037 | 2 つ以上の中チケットに跨る欠陥を incident record 無しに個別 hotfix で merge する / incident 中に影響下の中チケットを admission する / 契約誤りの incident を Reverse 対無しに close する | いずれも deny |
| UTV4-AC-050 | FR-038 | secret / PII / private transcript を含む event を改善 corpus へ export する / project identity の無い intake record を作る / Issue 本文を正本として要件を上書きする | いずれも deny |
| UTV4-AC-051 | FR-039 | prototype record と反応 event 無しに L3 の画面仕様を freeze する / モック画像を画面仕様の正本として参照する | 前者 compile が backflow_required / 後者 deny (generated 製本物のみ) |
| UTV4-AC-052 | FR-040 | 実録 provenance の無い skill を ACTIVE へ昇格する / firing しても結果に相関しない skill を照合なしに残置する | 前者 deny / 後者 quarantine 候補として finding |
| UTV4-AC-053 | FR-041 | judgement record を持たない LLM verdict を admission 入力にする / transcript のみを根拠に判断を再構成する | いずれも deny |
| UTV4-AC-054 | FR-042 | calibration 未計測の判断種別を分類器へ昇格する / 単一 episode で決定的 check へ昇格する / 昇格後の check と LLM 判断の before/after 差分を持たない | 順に deny / deny / 昇格 deny (shadow へ戻す) |
| UTV4-AC-055 | FR-043 | 機械判断化済みの判断種別で frontier tier を routing する / tier や cost を review_evidence の品質根拠として記録する | 前者 routing が下位 tier / check へ降格し finding / 後者 deny |
| UTV4-AC-056 | FR-044 | 選好軸の項目を人間 decision record 無しに deny 条件へ昇格する / 良否軸と選好軸を同一 record に未分離で記録する | いずれも deny |
| UTV4-AC-057 | FR-045 | 人間可読 view (スプシ同期 / 製本物) を持たない判断種別を機械判断化へ昇格する / view 側の承認を admission を経ずに正本へ反映する | いずれも deny |
| UTV4-AC-058 | FR-046 | 手描き図を依存 / 遷移の正本として参照する / 同一 record から生成した図の digest が一致しない / テーブル定義をスプシ同期 view 以外の自由文で正本化する | 順に deny / 生成器 defect として finding / deny |
| UTV4-AC-059 | FR-047 | 図側の編集を admission 無しに record へ反映する / record 更新後に再生成されていない図を配布する | 前者 deny (discrepancy record のみ) / 後者 doctor fail-close |
| UTV4-AC-060 | FR-048 | 同一契約 id へ 2 lane が別々に backflow を起票する / open backflow の依存下流チケットを merge admission する / 契約改訂後に再 compile せず旧チケットで作業を続ける | 順に 2 件目は event へ集約 (record は 1 件) / deny (fence) / 該当チケットは stale として lease 停止 |
| UTV4-AC-061 | FR-049 | role record に無い subagent_type で Agent を起動する / 手書きの provider 固有 sub-agent 定義が生成物と不一致のまま残る / role record に provider 名・model 名を直書きする | 順に deny (guard) / doctor fail-close / schema deny |
| UTV4-AC-062 | FR-050 | LLM orchestrator が gate role を経ずに合流点を閉じる / lease・budget の無い dispatch を行う / single-provider で cross_family を記録する | いずれも deny (後者 2 件は FR-004 / FR-014 と同一 oracle) |
| UTV4-AC-063 | FR-051 | single-provider で author が packet を組む / author の claim や自己評価が packet に含まれる / reviewer session が author と memory namespace を共有する / 反証試行 record の無い PASS / reviewer tier が author より下 | 順に deny / deny / attestation 不成立で deny / PASS-WEAK へ格下げ / deny |
| UTV4-AC-064 | FR-052 | 原子 PR に機能変更と refactor を混在させる / 中チケットを refactor ゲート未通過で受入する / refactor チケットが既存 oracle を変更する、または新規機能 oracle を追加する | 順に deny (分割) / deny / deny (behavior-invariant 違反) |
| UTV4-AC-065 | FR-053 | 閾値超えの projection が無いのに LLM の指摘だけで refactor チケットを発行する / 中の発火条件が閾値超えなのに refactor 原子を compile せず統合 review へ進む / 大の release 審査で退役候補の計測 record を参照しない | 順に deny (finding として保持) / deny / 審査 record 不備で deny |
| UTV4-AC-066 | FR-054 | 小チケットの PR を author 自身が admission チケット無しに merge する / 参加人数 2 以上で assignee = author の admission チケットを compile する / admitter が成果物を編集して merge する / 1 人運用の self-admission を印無しで記録する | 順に deny / deny (再 assign) / deny (差し戻し) / deny |
| UTV4-AC-032 | FR-023 | single-provider profile で同 provider の別 session・上位 tier が blind packet で review し receipt を発行する / 同一 session の subagent が review する / receipt に `cross_family` を記録する | 順に: admit され evidence tier は `same_family_separated` / deny / deny (僭称) |
| UTV4-AC-033 | FR-023 | reviewer session id が author session id と同一、または実在しない session id を持つ receipt / CI が green でない HEAD への verdict | attestation 不成立で deny (typed reason) / deny |
| UTV4-AC-034 | FR-024 | single-provider profile で高影響境界の merge を人間 review なしに admission する / 利用上限 record なしに hybrid → single-provider へ格下げする / 補償統制の doctor gate が未実装のまま profile を宣言する | いずれも deny |
| UTV4-AC-035 | FR-025 | 計測 record の無い skill / subagent を削除する / FLAG 1 件を根拠に surface を退役する | deny。quarantine のみ許可 (AC-018 / AC-031 と同型) |
| UTV4-AC-036 | FR-026 | inventory 未記載の legacy token が current surface に出現する / DB schema object を migration なしに drop する | fail-close |
| UTV4-AC-037 | FR-027 | receipt を candidate worktree ローカルにだけ保管する / dirty または未 merge の worktree を gc が回収する / projection writer が入力欠落を空成功として返す | 順に: main 側 authority から不可視なら finding / deny / finding として fail-close |
| UTV4-AC-024 | FR-015 | intake に未確定 field (例: actor 空) があるまま AI が値を補完して L3 compile へ進める | deny。question event が生成され、compile 結果は `human_decision_required` または `backflow_required` |
| UTV4-AC-025 | FR-016 | 人間 approval record 無しで L3 IR を frozen にする / 同じ L2 event log から candidate を 2 回再構築する | 前者 fail-close。後者は byte 同一 (決定性) |
| UTV4-AC-026 | FR-017 | S3 verified evidence だけで PoC PLAN を terminal にし merge する / S4 record の必須 field を欠いたまま confirmed とする | いずれも deny。PLAN は draft のまま outstanding に残る |
| UTV4-AC-027 | FR-018 | `poc/*` 成果物を S4 confirmed と正規 V-pair 無しに production path へ merge する | merge admission が deny |
| UTV4-AC-028 | FR-019 | 正本化済み (retirement record あり) の内容を memory へ再 add する / progress 語・raw log・secret を含む memory を add する | 前者 deny + retirement record 参照を返す。後者 fail-close |
| UTV4-AC-029 | FR-020 | 学習資産の owner に skill 名 / provider 名 / folder を設定する / 依存 provider version が変わる | 前者 deny。後者は関連 asset が revalidation_required へ遷移する |
| UTV4-AC-030 | FR-021 | registry に無い identity pair / 同 pair の両極性 / applicability 未指定 skill を recommendation 入力にする | いずれも fail-close。未指定を all へ暗黙展開しない |
| UTV4-AC-031 | FR-022 | 同一 input で packet を 2 回 compile する / stale skill を削除する / shadow・before/after・独立 review のいずれかを欠いて gate へ昇格する | 順に: exact set と digest が同一 / deny (quarantine のみ許可) / deny (AC-018 と同一 oracle) |

## 非受入

- 上記に無い「完全自動化」「AI による承認代行」「Issue / DB の意味正本化」は受入対象に含めない。
- 949 PLAN の一括 JSON 化の完了は受入条件にしない。
