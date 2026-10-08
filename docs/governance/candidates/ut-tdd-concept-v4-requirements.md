---
document_id: UT-TDD-CONCEPT-V4-REQUIREMENTS
status: draft_candidate
concept: docs/governance/candidates/ut-tdd-concept-v4.0.md
requests: docs/governance/candidates/ut-tdd-concept-v4-requests.md
decision_ledger: docs/governance/candidates/v4-decision-ledger.json
plan: docs/plans/PLAN-L1-09-ut-tdd-concept-v4-candidates.md
revision_base_artifact: docs/design/harness/L1-requirements/vmodel-engine-swap-requirements-delta.md
---

# UT-TDD 構想書 v4.0 L3 要件候補 (チーム開発版)

## Authority 境界

本書は PLAN-L1-09 の未承認候補である。current requirements (要件定義書 v1.2、VUP-REQ-01〜10)、Requirement IR、
runtime、DB へ投影しない。承認後は VUP-REQ-11〜 として `vmodel-engine-swap-requirements-delta.md` と同じ
additive 方式の L1 delta 文書へ写す。既存 VUP-REQ-01〜10 は変えない。

PLAN の廃止は v4 への切り替えのときに行う (V4D-078)。それまでは本書も PLAN-L1-09 を正規の受け皿とする。

## 決定台帳・要求との関係

各要件は、実現する L1 要求 (UTV4-BR-xxx) と、根拠の有効な決定 (V4D-xxx) を引く。
どの要求も 1 件以上の要件で実現されるか、「要件化不要」の表に理由付きで載る。
この対応は次のコマンドで機械的に確かめる。

```bash
node scripts/v4-ledger-check.mjs
```

書き方の規則 (V4D-087):

- 既存の要件と同じ論点の決定は、既存の行を直す。ID は変えない。
- 新しい ID を作るのは、どの既存の要件にも無い論点だけにする。
- 既存の行と同じ内容を新しい ID で書き足さない。
- 撤回した中身は「廃止した要件」の表に、撤回の根拠の決定と一緒に残す。
- 要件は観測できる条件で書く。意図だけの文は書かない。

区分の意味: 維持 = 文言をそのまま残した。既存を更新 = 同じ ID のまま決定に合わせて書き直した。新規 = どの既存の要件にも無い論点。

集計: 維持 24 件 / 既存を更新 35 件 / 新規 17 件 (計 76 件)。

## 要件候補

| ID | 要件 | 要求 | 根拠 (V4D) | 区分 | 既存との関係 |
|---|---|---|---|---|---|
| UTV4-FR-001 | system は request / selection / approval / decision / disposition を別 identity として source・actor・target・scope・revision へ束縛し、memory・session summary・AI 解釈から approval を生成しない。 | UTV4-BR-001 | V4D-001, V4D-059 | 維持 | PLAN-L7-517 (author provenance) の「claim は authority にならない」原則を人間 authority へ拡張 |
| UTV4-FR-002 | system は工程 × 役割の責任分担表 (RACI) を authoring source として 1 つ持つ。表の行は工程、列は人間の役割と AI の役割 (control lane / worker / reviewer) とする。各工程の A (最終責任) はちょうど 1 つとする。A が 0 個または 2 個以上の行は lint が fail-close する。AI の PO 向け質問と AI の自律実行は、この表で admit / deny する。表の外の質問は反射的エスカレーションとして deny する。表の内側を越える実行は fail-close する。表は発注者 / 受託者と契約形態の属性を持たない。 | UTV4-BR-002 | V4D-001, V4D-043 | 既存を更新 | 旧文の層別境界表を工程 × 役割の RACI に置き換えた。G1 / G3 / G4 への ops 追加は「要件で未確定」U-4 |
| UTV4-FR-003 | actionable behavior・チケット・finding・learning asset は exactly-one primary owner を持つ。owner は人間ユーザー identity または logical lane であり、provider 名・model 名を owner にしない。多重 owner・owner 不在は fail-close。 | UTV4-BR-001, UTV4-BR-003 | V4D-001, V4D-059 | 維持 | 参照元構想の exactly-one owner 要件の翻案。routeFiling / delegation-routing の family 分離と整合 |
| UTV4-FR-004 | チケットは Issue / Sub-issue / PR の 3 段の構造化 record とする。必須 field は「やること」「ゴールの検証 (根拠コマンド付き)」「親の参照」の 3 つだけとする。lease・scope・base / HEAD・budget・digest 束縛・成果物の所有 (generates) は、チケットの schema に持たない。review の証跡は PR の exact-head receipt に置く。チケットの正本は repo の tracked ファイルとする。GitHub の Issue / PR は正本からの一方向の投影とし、GitHub 側から正本へ読み戻さない。正本と投影のずれは doctor の advisory 警告として出し、fail-close にしない。人間ユーザーと AI lane は同じ schema のチケットに載る。詳細設計 (L5) と仕様 (L6) の作成・改訂・Reverse もチケットの作業にできる。L4 以上の本文と設計判断はチケットに書かず、設計書に置く。 | UTV4-BR-003 | V4D-007, V4D-055, V4D-056 | 既存を更新 | 旧文の lease / fence / budget 付き work item record と、既存 PLAN (U23 Execution Ledger) を受け皿にする方針を撤回した。置き場は「要件で未確定」U-6 |
| UTV4-FR-005 | 並行作業の衝突は、事前の切り方と区分の機械強制で防ぐ。同じチケットの二重着手は、着手の宣言 (claim) で防ぐ。claim 済みのチケットへの 2 件目の claim は deny する。claim は二重着手の防止だけに使い、書き込み権限の根拠にしない。触る path が自分の担当区分の外なら、Kernel は変更を有効化せず、提案として出す。起きた衝突は、持ち主へ型付きの conflict record として戻る。foreign-edit guard と review request の一意性は、この規則の適用面とする。 | UTV4-BR-004 | V4D-056, V4D-067, V4D-068 | 既存を更新 | 旧文の lease model と PLAN 採番予約を撤回した |
| UTV4-FR-006 | 正本形式は artifact の種類で決める。人間が判断のために読む本文 (要求・要件・設計) は markdown 正本 + typed spec block とする。機械が生成・集計・遷移させる記録 (チケット・verdict・receipt・証跡) は 1 記録 = 1 ファイルの JSON / JSONL 正本とする。harness.db は正本ファイルから作り直せる索引とする。harness.db を消して作り直した前後で、索引の内容が一致する。DB にしか無い状態は 0 件とする (現存の 4 テーブル分はファイルへ移す)。GitHub は投影であり、正本にしない。証跡の本体は設計書とチケットに書かない。参照する側は証跡の ID と digest だけを持つ。#591 の設計・実装の筋の悪い箇所 18 件は、すべて v4 で直す。18 件は一覧で読め、各項目は実現する要件 ID を 1 件以上持つ。 | UTV4-BR-005 | V4D-035, V4D-060, V4D-063 | 既存を更新 | 旧文の「PLAN 本文は narrative 正本」を外した (V4D-078)。#591 の 18 件を v4 で直すこと (V4D-035) を加え、旧 U-5 を解消した。証跡ログを git の中に置くか外に置くかは「要件で未確定」U-1 |
| UTV4-FR-007 | v4 への切り替えで PLAN を全面廃止する。既存の PLAN は削除せず、読み取り専用で凍結する。切り替え後に既存 PLAN ファイルの内容を変える変更は fail-close する。PLAN の機能は次へ移す: 契約本文と設計判断 → 設計書、対と digest → 設計書の frontmatter、完了条件 → gate と受入 catalog、作業単位 → チケット、route の種類 → チケットの種類、証跡 → 証跡ログ。チケットと工程 (L 層) のつながりは設計書が持つ。言語をまたぐ境界のつながりは product/contracts/ の schema が持つ。成果物の所有 (書いてよい path の範囲) は設計書が持つ。変更がその範囲の外に出たら、機械が止める。移し漏れは、HEAD から作った照合の母集合 3 種と対応表の突き合わせで調べる。対応表に無い要素が 1 件でもあれば fail-close し、切り替えを完了にしない。切り替えまでは PLAN 上の gate と CI を外さない。PLAN と規律文の二重管理は、この廃止で解消する。 | UTV4-BR-038 | V4D-035, V4D-052, V4D-063, V4D-078 | 既存を更新 | 論点 (PLAN の構造をどう扱うか) は同じ。旧文の「PLAN frontmatter を段階的に record 化する」を撤回し、PLAN の全面廃止に書き直した |
| UTV4-FR-008 | 人間向け view (表 / doc / ダッシュボード) は構造化正本と markdown 正本から決定的に生成し、生成元 identity・digest・「編集禁止」を埋め込む。view と正本の hash 不一致は doctor gate で fail-close。 要求 (L1)・要件 (L3 IR)・設計 (L4〜L6 typed block) のスプレッドシート view は**必須 view**であり、正本の各 record / typed block を行として決定的に同期し (生成元 id・revision・digest 列付き)、シート側の編集は FR-009 の admission で正本へ戻す。正本を 1 枚の文書に集約する要求は置かない (分散正本 + 俯瞰 view)。 | UTV4-BR-006 | V4D-001, V4D-013 | 維持 | BR-06 / UX-02 の実装形。advisor 指摘リスク 2 |
| UTV4-FR-009 | view からの変更は構造化正本への admission transaction 経由でのみ受理し、markdown 正本への機械書き戻しは行わない。admission は actor・source view・target record・revision を receipt に残す。 | UTV4-BR-006 | V4D-001, V4D-013 | 維持 | 参照元構想の Issue admission (GitHub 側編集の逆流) を view 一般へ翻案 |
| UTV4-FR-010 | トラブル・費用・成功例の記録は、索引 → パターン抽出 → 振り分け → 効果確認 → 片付け の順で扱う。振り分けの行き先は、上流から テンプレート・設計パターン → gate / lint → bot による修復 → 運用ルール / skill の順に試す。振り分けごとに、選んだ行き先と、それより上流を選ばなかった理由を記録に残す。改善は proposal / evidence / delta として出し、authority へ直接書き込まない。単一 episode で規則・機構へ昇格しない。不要になったルールや記録は、効果を確かめた後にだけ片付ける。同じパターンで修正と再発が繰り返されたら、自動の修正を止めて人間へ上げる (回数の閾値は project record の値)。学習用のデータは保持期間と件数の上限を持つ。成功パターンも入力にする。 | UTV4-BR-007 | V4D-061, V4D-064 | 既存を更新 | 旧文の「既存 V-model へ route する」を、4 段の振り分けと片付けと暴走停止に書き直した |
| UTV4-FR-011 | 同じ改善候補を人間向け digest (generated view) としてチームへ配り、採否は人間の decision record として残す。project 横断のナレッジ共有 (#413) は、project identity による record 正本の namespace 分離を前提にする。 | UTV4-BR-007 | V4D-061 | 既存を更新 | 旧文の PLAN-L7-512 / 529 への参照を外した (V4D-078) |
| UTV4-FR-012 | 進捗と詰まりは、チケット・PR・CI・review・merge の事実から自動で導く。人間の手入力とモデルの自己申告は入力にしない。リーダーの全体ビューは、各チームの記録を読むだけの一方向の集約とする。全体ビューから記録へは書き戻さない。全体ビューには集約した時刻 (鮮度) を必ず表示する。完了の予測は「残りの発行済みチケット数 ÷ 巡航速度」で出し、P50 と P85 の幅を付ける。巡航速度は merge の実績から集約のたびに計算し直す。未発行の範囲は予測に混ぜない。未発行の範囲は、発行に必要な判断とその期限として表示する。 | UTV4-BR-008 | V4D-010, V4D-041, V4D-068 | 既存を更新 | 旧文に、一方向の全体ビューと鮮度表示と完了予測を加えた |
| UTV4-FR-013 | 独立 review は authoring context から分離し、candidate HEAD と CI generation へ exact 束縛する。author runtime の内部 review を独立 review へ昇格しない。wrong HEAD の receipt を再利用しない。reviewer の family 条件は profile (FR-023) が決める: hybrid では author と別 family、single-provider では同 family でも FR-023 の attestation を満たす別 session・上位 tier を admit し `same_family_separated` を記録する。review の依頼・判定・受領は 1 つの構造化記録で扱う。判定は reviewer の自由文から拾わず、schema に沿った機械可読の verdict として受け取る。受領の無い依頼と、依頼に対応しない受領は doctor が finding として出す。review 往復の根 (memory との兼用、自由文 verdict、orphan request、identity の 3 重比較) は v4 で直す (V4D-035)。 | UTV4-BR-013 | V4D-023, V4D-035 | 既存を更新 | 旧文に、review の往復を 1 つの構造化記録で扱うことと、自由文 verdict の廃止を加えた |
| UTV4-FR-014 | current identity と compatibility identity を分離し、legacy (Bun、personal path、旧 memory 中心継続) の green で current の failure を相殺しない。 | UTV4-BR-014 | V4D-029 | 維持 | ADR-001、Bun BAN (#450) を継承 |
| UTV4-FR-015 | L1 intake record は目的・価値・actor・context・scope / non-goal・制約・仮説を保持し、未確定値は AI が補完せず L2 の question event へ送る。 | UTV4-BR-009 | V4D-003 | 維持 | 要件定義書 v1.2 §L1 / BR-01 の intake を record 化。設計判断エリシテーション規約の機械契約 |
| UTV4-FR-016 | L2 discovery は質問・回答・prototype 反応・candidate の split / merge / reject / accept・矛盾・defer・agreement を append-only event として保持し、current candidate を決定論的に再構築する。PoC チケットと画面プロトチケットの反応と判定記録も、この event として取り込む。L3 compiler は L1 / L2 の全 evidence から typed IR へ compile し、`compile_ready / backflow_required / human_decision_required / rejected` を exactly one 返す。frozen は人間 approval record の後だけ許す。別 requirement engine・別台帳・別 DB authority を作らない (既存 Requirement IR 経路 U8〜U12 を流用)。 | UTV4-BR-009, UTV4-BR-010 | V4D-003, V4D-065 | 既存を更新 | discovery の入力を、S0〜S4 の PoC からチケットの種類としての PoC に替えた (V4D-054 / V4D-065) |
| UTV4-FR-017 | PoC は工程ではなく、チケットの種類の 1 つ (discovery) とする。チケットの種類と状態値に、S0〜S4 の段や Forward / Reverse と別の工程軸を持たない。schema と CLI に S0〜S4 の状態値が残っていないことを lint で確かめる。PoC チケットは、判定記録 (結論と根拠) が揃うまで閉じられない。判定記録の無い PoC の成果は、production の成果として数えない。既存の Scrum / PoC PLAN は読み取り専用で残す。 | UTV4-BR-010 | V4D-054, V4D-065 | 既存を更新 | 旧文の「Discovery PoC は別 axis、S4 decision record が terminal 条件」を撤回した |
| UTV4-FR-018 | prototype への反応は自由文と構造化 decision を分離して記録し、表示要求を underlying need・actor / task・state / failure / recovery・candidate・AC・prototype revision へ還元する。PoC チケットの成果物は、判定記録が採用を示し、production 側の作業が別のチケットとして発行されるまで、production path へ merge しない。 | UTV4-BR-010 | V4D-054, V4D-065 | 既存を更新 | 旧文の Forward reentry 条件「S4 confirmed + 正規 V-pair」を、判定記録と別チケットの発行に替えた |
| UTV4-FR-019 | ハーネスメモリは captured → canonicalized (要求 / 設計 / 規則 / test へ取り込み) → retired の lifecycle を持ち、退役は memory_id と取り込み先 path + digest を束縛した retirement record で行う。正本化済み内容の再掲、progress / raw log / secret / PII を含む memory は fail-close する。 | UTV4-BR-011 | V4D-005 | 維持 | PLAN-L7-189 / memory-sync gate / CLAUDE.md「手書き禁止・エピソード状態を書かない」の機械化。FR-010 の非昇格原則と整合 |
| UTV4-FR-020 | 学習資産 (CASE / SCENE / PATTERN / LOG / VERIFY) の primary owner は responsibility_id とし、folder・文書・agent persona・skill 名・provider 名を owner にしない。asset は stale / contradicted / superseded / expired / revoked / revalidation_required へ縮退でき、provider / model / version drift で revalidation へ戻る。 | UTV4-BR-011 | V4D-005 | 維持 | FR-003 exactly-one owner を学習資産へ適用 (#413) |
| UTV4-FR-021 | skill applicability は versioned registry に typed identity (layer × workflow identity の exact pair) の positive / negative 集合として宣言し、unknown identity・同 pair の両極性・未指定の all 展開を fail-close する。recommendation / receipt は registry version と digest を返す。 | UTV4-BR-012 | V4D-006 | 維持 | `skills/` frontmatter と `ut-tdd skill suggest` (`src/skill-engine/`) の入力契約を registry 化 |
| UTV4-FR-022 | assignment ごとの知識 packet (skill / memory / learning asset) は同一 input・同一 registry version から同一 exact set と digest へ決定的に compile し、全 skill / 全 memory の一括注入を禁止する。firing / loaded-but-unused / task miss を telemetry 化し、stale skill は削除せず可逆 quarantine とする。skill・detector・gate への昇格は shadow run + before/after 同一分母測定 + 独立 review + rollback plan を要求し、ACTIVE 機構と同じ規則を skill prose に重複保持しない。 | UTV4-BR-012 | V4D-006 | 維持 | CLAUDE.md §Skills「bulk-load 禁止」、FR-010「単一 episode で昇格しない」を一契約へ |
| UTV4-FR-023 | provider topology は `hybrid / single-provider / standalone` の typed profile として project record に宣言し、独立 review の admission は provider 名ではなく「authoring context 遮断・author session と異なる reviewer session の attestation・exact HEAD / CI generation 束縛・CI green 前提」で判定する。receipt は evidence tier (`cross_family` / `same_family_separated` / `intra_runtime`) を記録し、上位 tier を僭称しない。同一 session 内 subagent の review は全 profile で独立 review にならない。 | UTV4-BR-013 | V4D-023 | 維持 | delegation-routing / agent-guard / review-evidence gate (`checkCrossAgentModelPair`) の判定軸を role × tier × session へ拡張 |
| UTV4-FR-024 | single-provider profile では補償統制を必須とし、doctor の fail-close gate として機械強制されるまで第一級扱いしない: 高影響境界と release 適格性 merge への人間 review、merge の 5〜10% 監査 sampling による FLAG 率 / 見逃し率の hybrid 基準比較 record、CI oracle の mutation 検証。profile の格下げは利用上限・契約停止の record を伴う場合だけ許し、格上げは常に許す。 | UTV4-BR-013 | V4D-023 | 維持 | CLAUDE.md「唯一の回避条件: 利用上限による停止」を record 化 |
| UTV4-FR-025 | command / subagent / skill / rule / 文書 / schema / archive は surface class (知識資産・判断パック・機械 policy・provider-native 技法・一般手順・互換面・統制面) に exactly one で分類し、invocation 数・採用率・context cost・置換可能性を計測 record として持つ。退役は可逆 quarantine → 退役 record の順で行い、計測なしの削除と単一 episode での退役を拒否する。各機能は段階 (planned / shadow / opt-in / default / deprecated / retired) のどれか 1 つを持ち、一覧で読める。新旧の入れ替えは 棚卸し → shadow → 同等性の確認 → 読み取り専用 → 退役 の順に進め、段を跳ばした遷移は deny する。新しく作る変更は、削る対象を機械で読める形で持つ (収支原則)。 | UTV4-BR-014 | V4D-029, V4D-036 | 既存を更新 | 旧文に、版別の段階と入れ替えの順序と収支原則を加えた。版番号の割当は PO 未採択 (V4D-029)。削る対象の記録先は「要件で未確定」U-2 |
| UTV4-FR-026 | legacy 出力 (旧 field / token / command) は current surface × legacy token の完全 inventory を machine-readable に持ち、未記載 hit・stale entry・件数 drift を fail-close する。DB schema object と tracked archive の退役は migration + 履歴 receipt + doctor gate (live schema vs canonical) を伴う原子操作とする。 | UTV4-BR-014 | V4D-029 | 維持 | Bun 撤去 (#487 / #450)、旧 9-mode 残骸、`docs/migration/` snapshot、harness.db schema に適用 |
| UTV4-FR-027 | review receipt は candidate workspace と repository identity に束縛して保管し、malformed receipt は削除せず訂正世代を積む。reviewer session id は実在 attestation を要求し、admission 失敗は typed reason で返す。worktree / branch の回収は「origin/main の ancestor かつ clean」の証明付きで dry-run 既定、未 commit 残置・未 push branch・stale base・projection の silent skip は doctor finding として surface する。 | UTV4-BR-013, UTV4-BR-014 | V4D-035 | 維持 | #505 / #493 / #439 / #386 / #384 / #426 / #169 系の恒久対策を 1 契約へ |
| UTV4-FR-028 | 上流の PoC / 画面プロトタイプ作成は、種類 (discovery / 画面プロト) を持つチケットとして発行する。チケットの種類ごとに検収の雛形を使う。複数人への分担発行は、初期画面ルール (画面規約・component / token・状態と失敗の表現) の freeze record を前提とする。freeze 前は 1 チケットだけを許す。プロトへの反応が L2 discovery event (FR-016) として記録されない限り、チケットを閉じられない。 | UTV4-BR-010, UTV4-BR-031 | V4D-008, V4D-065 | 既存を更新 | 旧文の独自 work item record を、種類付きの最小チケット (FR-004) に替えた |
| UTV4-FR-029 | owner の数を層ごとに固定する。L0〜L4 は文書単位で人間 owner 1 名とする。L3 要件と L4 基本設計は 1 名がまとめ、freeze の責任を持つ。L5 詳細設計・L6 仕様・実装・L7 単体テストは、チケット単位で owner 1 名 (人間または AI lane) とする。L8 as-built 照合〜L12 受入の検証は、author と異なる owner 1 名とする。L8 の食い違いの振り分けは、作者と別の family が判定する。提案と起草は owner 以外も行える。採択・統合・freeze は owner だけが行う。チケットの owner は Issue / Sub-issue / PR のどの段でも 1 名とする。 | UTV4-BR-015 | V4D-008, V4D-073, V4D-075 | 既存を更新 | 旧文の旧層の意味 (L5〜L7 / L8〜L12) と 4 階層の前提を、v4 の右腕と 3 段のチケットに合わせた |
| UTV4-FR-030 | 合流は、git main と区分境界の契約の 2 つの同期点で行う。区分をまたぐ合流点の担当替えは、claim の付け替えの記録 (旧 owner・新 owner・理由・引き取り時の HEAD) を伴う。記録の無い引き取りは deny する。 | UTV4-BR-016, UTV4-BR-004 | V4D-067, V4D-068 | 既存を更新 | 旧文の依存単位チケット群・統合チケット・lease 移転を撤回した |
| UTV4-FR-031 | 差し戻しは 2 種類とする。軽い是正は同じチケットの中で行い、回数は 3 回までとする。3 回を超える是正は、同じチケットの中では受け付けない。契約 (設計) の食い違いは同じチケットで直さず、設計のチケットを新しく起こす。是正の回数は、チケットの記録から機械で数える。 | UTV4-BR-030, UTV4-BR-016 | V4D-065 | 既存を更新 | 旧文の「再集計上限を超えたら基本設計 owner へ差し戻す」を、2 種の差し戻し (T5) に替えた |
| UTV4-FR-032 | 実装の作業は、互いに依存しない機能・責務の単位で切る。依存が残るときは、先にインターフェースだけを決めるチケットを切る。PR 段のチケットの受入は main への merge とする。merge の条件は次の 3 つとする: candidate HEAD が main の上にあり衝突が 0、exact HEAD の CI が green、exact HEAD に束縛した独立 review の receipt がある。システム受入 (L10 システムテスト〜L12 受入) は、これとは別に release の適格性で閉じる。 | UTV4-BR-016, UTV4-BR-004 | V4D-009, V4D-067 | 既存を更新 | 旧文の「path / 依存で lease が重ならないように切る」を、独立単位とインターフェース先行に替えた |
| UTV4-FR-033 | 工程・gate・記録の種類は参加人数に依存しない。1 人の時期でもチケット・claim・event・receipt を省略せず、自分宛てに発行する。人数の増減は、チケットの分割と統合、および claim の付け替えの記録だけで扱う。人数を理由に記録を省いた工程は gate が deny する。 | UTV4-BR-017 | V4D-010 | 既存を更新 | 旧文の lease を claim に替えた |
| UTV4-FR-034 | チケットの発行権限は PO が持つ。PO は担当区分ごとのチーム宛てに、粗い粒度でチケットを発行する。分解と担当の決定は、区分の中のチームが行う。メンバーは発行済みのチケットを取って対応する (pull 型)。メンバーが見つけた問題は提案として出す。提案は PO が仕分けるまでチケットにならない。各チームの管理知能が見るのは、自区分と区分境界の契約だけとする。 | UTV4-BR-017, UTV4-BR-008 | V4D-067, V4D-068 | 既存を更新 | 旧文の統括 owner 1 名を撤回した。全体ビューは FR-012 |
| UTV4-FR-035 | チケットの下書きは、管理知能が上流の成果物から作る。PO は下書きをまとめて承認する。承認したものだけが発行される。管理知能は自分では発行しない。下書きは生成元 (上流成果物の path と revision) を持つ。同じ入力と同じ policy version からは、同じ下書きの集合が出る。 | UTV4-BR-017 | V4D-064, V4D-067 | 既存を更新 | 旧文の ticket compiler 既定発行・batch admission・層別の発行勾配を撤回した |
| UTV4-FR-036 | チケットの段は Issue / Sub-issue / PR の 3 つとする。最上位の Issue 以外は、親の参照をちょうど 1 つ持つ。親が無い・親が 2 つ・4 段目以上のチケットは、schema の検証で deny する。GitHub の sub-issue 関係は、正本の親参照からの投影とする。 | UTV4-BR-003 | V4D-055, V4D-056 | 既存を更新 | 論点 (チケットの入れ子) は同じ。旧文の大・中・小・原子の 4 階層と、原子だけが lease を持つ規則を撤回した |
| UTV4-FR-037 | 複数の区分 / チケットに跨る欠陥 (全体影響バグ) は、依存 graph からの影響範囲判定で見つける。2 つ以上の区分に跨る欠陥は、stop-the-line incident record (owner、影響下チケットの集合、Reverse 対の有無) を要求する。incident が open の間、影響下のチケットの merge を止める。修正はチケットとして発行する。契約の誤りが原因なら、Reverse を必須の対にする。hotfix branch への直接 push は deny する。 | UTV4-BR-018 | V4D-014 | 既存を更新 | 旧文の中チケット・fence・原子チケット・lease の一時回収を、3 段のチケットと区分に替えた |
| UTV4-FR-038 | 各 project は receipt・finding・hook event・issue / PR / review コメント・incident・PoC チケットの判定記録を、project 単位の improvement intake record (namespace = project identity、機微 = secret / PII / private transcript を admission で遮断) に集約する。ハーネス改善への供出は opt-in の一方向 export とし、集約先はハーネス repo の Evidence Ledger (project 横断 corpus) とする。Issue / コメント本文は意味正本にしない。 | UTV4-BR-019 | V4D-015 | 既存を更新 | 旧文の「S4 record」を「PoC チケットの判定記録」にした (V4D-054) |
| UTV4-FR-039 | 画面モック / プロトタイプの製本は 2 点で行う: (a) L2 → L3 compile 時に screen id ごとの prototype record と反応 event を画面仕様 (generated view + typed record) に束ね、要件 IR の surface / action / state / AC へ結ぶ、(b) L5 詳細設計で component / 状態 / 失敗 / 回復を画面詳細として再製本する。モック画像・プロト実装・自由文反応は正本にならず、製本物は生成元 id と digest を持つ。 | UTV4-BR-020 | V4D-016 | 維持 | FR-018 / FR-028 の出口。FR-008 の generated view 契約 |
| UTV4-FR-040 | skill・判断パック・機構の生成と昇格は、実録 (receipt / finding / review verdict / incident / 判定記録) から抽出した CASE / SCENE / PATTERN への provenance を必須とする。provenance の無い一般手順 skill は GENERIC_PROCEDURE class として昇格不可・quarantine 候補とする。既存 skill は実録との照合 (firing と結果の相関) で残置 / quarantine / 退役を判定する。 | UTV4-BR-021 | V4D-017 | 既存を更新 | 旧文の「S4 record」を「判定記録」にした (V4D-054) |
| UTV4-FR-041 | LLM の判断 (review verdict / finding / advisor 決定 / gate 判定 / triage / 分類) は judgement record (1 record = 1 JSON: subject identity、入力 digest、判断者 model / tier / role、結論、根拠 finding id、コスト) として Evidence Ledger に必ず記録され、record を持たない判断は admission の入力にできない。会話 transcript は正本にならない。 | UTV4-BR-023 | V4D-018 | 維持 | FR-010 / FR-019 の判断面。既存の review receipt / advisor 発火ログを record 化する |
| UTV4-FR-042 | judgement record には後続事実 (CI / oracle 結果、incident、Reverse 発生、人間 override、利用者フィードバック) が back-annotate され、判断種別 × 判断者ごとに正答率・見逃し・過検知が計測される (calibration)。同種判断の calibration が閾値を満たしたときのみ、LLM 判断 → 安価モデル / 分類器 → 決定的 check の順に機械判断化を提案でき、各段は FR-022 と同じ shadow → before/after → 独立 review を経て gate 化する。単一 episode・calibration 無しの昇格は deny。 | UTV4-BR-023 | V4D-018 | 維持 | FR-022 / FR-025 の昇格経路を判断へ拡張 |
| UTV4-FR-043 | frontier tier の呼び出しは「学習済み check が存在しない判断種別」と「人間ゲート直前の独立 review」に限定され、機械判断化された判断種別では routing が自動的に下位 tier / 決定的 check へ降格する (effort / model ladder の下方向)。tier や cost を authority・品質の代替として記録・主張することは deny。 | UTV4-BR-022 | V4D-018 | 維持 | Model / Effort Routing (escalateShallowResponse) に降格方向を追加 |
| UTV4-FR-044 | 判断軸は良否軸 (契約 / oracle / 規約への正誤) と選好軸の 2 軸で record 化する。選好軸は (a) 人間ユーザーにとっての使いやすさ (操作導線・失敗時回復・認知負荷・一貫性)、(b) AI が継続変更しても壊れにくいこと (境界の明示・契約の機械可読性・変更の局所性・観測可能性・fail-close 既定) を項目化し、実録の CASE / PATTERN から skill として抽出して判断パック (FR-021) の評価観点へ注入する。選好軸の規約化 (deny 条件への昇格) は人間の decision record を必須とする。 | UTV4-BR-024 | V4D-019 | 維持 | FR-040 の判断軸面。ハーネス自身とハーネス上のプロダクト双方に適用 |
| UTV4-FR-045 | judgement record、calibration 指標、機械判断化された check、判断軸 skill は、ハーネス標準共有機構 (FR-008 のスプレッドシート同期 view と FR-039 の画面モック / プロト製本物) へ generated view として決定的に投影され (生成元 id・revision・digest 列を持つ)、人間はその view から承認 / 差し戻し (admission 経由の書き戻し) を行える。人間可読 view を持たない判断種別・skill は昇格対象にならない。 | UTV4-BR-025 | V4D-019 | 維持 | 原則 6 (二重可読) の判断・学習層への適用。FR-008 / FR-039 の consumer |
| UTV4-FR-046 | 依存グラフ (コードの import とファイル読み込みの依存、設計書間の参照、区分と path の対応、merge の履歴)、画面遷移図 (prototype record の surface / action / state)、ER 図・テーブル定義 (schema record)、チケットの段の図は、構造化 record から決定的に生成される図 / 表 (生成元 id・revision・digest 付き) として提供する。テーブル定義の正本は構造化 schema record とする。スプレッドシート同期 view (FR-008) はそこから生成される編集禁止 view とし、列の変更は admission 経由で schema record へ戻す。手描き図・画像は正本にならない。同じ record からの再生成は同じ digest を返す。 | UTV4-BR-026 | V4D-020 | 既存を更新 | 旧文の依存グラフの入力 (PLAN requires / references、責務 × path 行列) を、コードと設計書の依存に替えた (V4D-078) |
| UTV4-FR-047 | 人間が図 / スプレッドシート側で行った追加・削除・変更は正本へ直接反映されず discrepancy record (対象 record id、人間側の主張、機械側の値、差分種別) として記録され、admission で正本へ戻すか finding として owner へ返される。record 更新後に図 / 表が再生成されていない diagram drift は doctor が fail-close する。 | UTV4-BR-026 | V4D-020 | 維持 | 原則 6 の書き戻し規律と FR-008 の drift 検知を図へ拡張 |
| UTV4-FR-048 | 下流から上流への還流は backflow record (発生元チケット / finding id、対象層と契約 id、差分種別、owner = 対象層の文書 owner、影響下チケットの集合、decision) として発行する。同じ契約 id への還流は 1 record に集約し、後続は event として積む。backflow が open の間、依存する下流チケットの merge を止める。契約の改訂後、管理知能は影響下チケットの改訂の下書きを作り、PO が承認する。上流 owner の判断は decision record にまとめて残す。 | UTV4-BR-027 | V4D-021 | 既存を更新 | 旧文の中チケット単位の集約・ticket compiler の再 compile・Reverse 対 PLAN の projection を撤回した |
| UTV4-FR-049 | ハーネスは論理 role (worker / reviewer / gate / explorer / advisor 等) を record (capability floor、許可 tool 種別、証拠義務、closing authority、family 分離要件) として所有し、provider 固有の sub-agent 定義 (Claude Code の agents/*.md、Codex の role 引数、team 定義) は adapter が role record から決定的に生成する generated view とする。agent-guard / delegation-routing の allowlist・floor 判定は role record を単一根拠とし、ドメイン特化は role ではなく skill / 判断パック注入で表す。手書き provider 定義の残置は doctor が drift として fail-close する。 | UTV4-BR-028 | V4D-022 | 維持 | .claude/agents と delegation-routing の二重 role 体系を解消 |
| UTV4-FR-050 | オーケストレーションは、control plane がチケット (role と証拠義務) を lane へ dispatch する形式とする。LLM orchestrator は lane の一種として record 化する (有無・provider・tier は値)。合流点の判定は gate role が行う。orchestrator と管理知能が closing authority を持つことは deny する。single-provider / standalone でも同じ role record と guard を使う。family 分離が成立しない箇所だけ、evidence tier を落として記録する。 | UTV4-BR-028 | V4D-022, V4D-033 | 既存を更新 | 旧文の原子チケット (lease + budget) の dispatch を、3 段のチケットに替えた |
| UTV4-FR-051 | single-provider profile の独立 review は次を admission 条件とする: (a) blind packet は control plane が生成し author の claim・自己評価・意図・identity・過去 verdict を含まない (spec / AC / diff / oracle 結果のみ)、(b) claim-blind lane と spec-blind lane を別 session で実行し FINDING を突き合わせる、(c) author と reviewer の session は memory namespace と context を共有しない、(d) reviewer は oracle を自ら再実行し反証試行を 1 件以上 record に残す (反証ゼロの PASS は PASS-WEAK)、(e) reviewer の tier / effort は author 以上で prompt pack は author と別、(f) verdict は judgement record (FR-041) として back-annotate され FR-024 の監査 sampling で hybrid 基準と比較される。hybrid では (a)(f) を必須、(b)〜(e) を推奨とする。 | UTV4-BR-013 | V4D-023 | 維持 | FR-013 / FR-023 / FR-024 の blind packet を偏見対策として具体化 |
| UTV4-FR-052 | リファクタリングは、機能追加と別の種類のチケット (refactor) で行う。TDD の refactor 工程は、その PR の中で完結してよい。refactor チケットの受入は振る舞いの不変 (既存 oracle が不変、新しい機能 oracle の追加が無い) とする。refactor と機能変更を同じ PR に混ぜることは deny する。退役 (削る作業) も refactor チケットで行う。owner は対象区分の owner とする。 | UTV4-BR-029 | V4D-024 | 既存を更新 | 旧文の原子 / 小 / 中 / 大ごとの責務を撤回した |
| UTV4-FR-053 | refactor チケットの発火は、依存 graph と計測 record (重複・凝集度・区分越えの path・循環依存・契約の drift・surface class の利用実測・incident と backflow の同種反復) からの projection で判定する。閾値は project record の値とする。閾値を越えたら、管理知能が refactor チケットの下書きを作る。LLM の指摘は finding として projection の入力になり、単独では発火しない。 | UTV4-BR-029 | V4D-024 | 既存を更新 | 旧文の小 / 中 / 大ごとの扱いを撤回した |
| UTV4-FR-054 | 実行と検収はチケットの対として発行する。検収の条件は実行の着手前に固める。検収は実行と別の family が行う。PR の merge lane は author ≠ reviewer ≠ admitter の三者分離とする。admitter は receipt (独立 review の verdict・CI generation・exact HEAD) だけを入力にする。admitter による成果物の書き換えは deny し、author へ差し戻す。参加人数が 1 のとき、admission は self-admission の印を付けて記録し、FR-024 の監査 sampling の対象にする。 | UTV4-BR-030 | V4D-025, V4D-065 | 既存を更新 | 旧文の「小以上に admission チケットを対で compile、階層別 assignee」を撤回し、実行と検収の対 (T4) に替えた |
| UTV4-FR-055 | 結合テスト (L9) 以上に関わる実装は、author 以外の人間が review する。人間 review の対象は結合面 (契約・境界・結合テスト・状態遷移) とし、内部実装は下位の receipt に委ねる。それ以外の変更は、AI の blind review と別人の admission で閉じてよい。参加人数が 1 のときは、人間 review を AI blind lane (evidence tier を記録) で代える。その場合は self-admission の印と FR-024 の sampling で補う。 | UTV4-BR-030 | V4D-025 | 既存を更新 | 旧文の原子 / 小 / 中ごとの傾斜を、層 (L9 以上) の基準に替えた |
| UTV4-FR-056 | 画面プロト工程は次の record を持つ: 初期画面ルール (画面規約・component / token・縮退状態語彙・失敗 / 回復表示)、screen inventory (screen id・目的・actor・入口出口・要求 candidate 参照)、screen flow (record から生成)、prototype plan (問い・build 順序・対象外)、fixture 契約 (本番 schema / event envelope 同形、匿名化・切り捨て注記、異常系必須セット)、mock event 契約 (本番 event schema 同一)、screen finding (typed、FR-048 backflow へ)、依存 edge の暫定 → 確定 (人間 decision record)、受入チェックリスト (AC 候補へ還元)、機械検証 receipt (layout / 遷移 / 状態 / fixture 全列照合)、modernization register (暫定アセット・superseded・退役)。ハーネス自身の人間向け面も同工程を通す。深さは screen id 単位の深度 profile (light / standard / deep) で宣言する。必須最小 (初期画面ルール・inventory / flow・fixture 契約・typed finding) 以外の要素は profile に従う。profile の選定根拠は risk 信号 (精度要求・discrepancy / backflow 実績・データ量・外部依存) を record に持ち、deep を既定にしない。意味ロジックは判定器から独立した Gold ledger record と CI 反証照合を、正解のない予測・仮説先行の領域は仮説 record (前提・入力・予測・観測時期・棄却条件) + PoC チケットの判定記録 + 実測 backtest を deep の必須要素とする。画面は予測・前提・精度・鮮度を確定値と区別して表示する。FE の実装の変更は対応する screen id を持ち、画面の設計から FE の実装まで screen id で追跡できる。 | UTV4-BR-031 | V4D-026, V4D-039 | 既存を更新 | 旧文の「S4 decision record」を「PoC チケットの判定記録」にした (V4D-054)。UX と FE の連続性 (V4D-039) を screen id の追跡で加えた |
| UTV4-FR-057 | 製本点 (a) は fixture 契約・異常系必須セット・screen finding・受入チェックリストが揃った screen id のみを対象とし、欠ける screen id の compile は backflow_required を返す。正常系 fixture のみの画面、本番 schema と異なる mock event、finding が prose のみの画面は製本できない。 | UTV4-BR-031 | V4D-026 | 維持 | AC-051 の前段条件を具体化 |
| UTV4-FR-058 | 要求 / 要件 record は provisional (既定) と frozen の 2 状態を持つ。frozen への遷移は、人間の freeze decision record、または PoC チケットの判定記録 + 人間 ack のみで起こせる。AI lane・管理知能・review verdict による freeze 遷移は deny する。provisional 要求から作ったチケットは provisional_dependency を持ち、要求の改訂時に下書きが作り直される。view / 製本物は provisional と frozen を区別して表示する。freeze は要求 / IR 単位で行う。文書一括 freeze は L3 / L4 owner の明示宣言に限る。AI 間の解釈齟齬は確定ではなく、discrepancy record として上流 owner へ上げる。 | UTV4-BR-032 | V4D-027 | 既存を更新 | 旧文の「S4 confirmed の PoC evidence」と ticket compiler の再 compile を、判定記録と下書きの作り直しに替えた |
| UTV4-FR-059 | PoC チケットの規模と期限の上限、および超過時の扱いは「要件で未確定」U-3 とする。確定の前でも次は守る: PoC 期の設定・規約・CI を production path へそのまま引き継がない。引き継ぐ場合は、production 側のチケットとして起こし直す。 | UTV4-BR-010 | V4D-054, V4D-065 | 既存を更新 | 旧文の scope / budget record 必須と、超過時に S4 decision まで新規発行を止める規則を撤回した |
| UTV4-FR-060 | 管理知能は 進行 (分解とチケットの下書き)・収束 (合流の判定と齟齬の集約)・管理 (WIP・優先順位・設定と学習) の 3 つの働きを持つ。機能は F1 取り込み・分類 / F2 チケット発行 / F3 分解・計画 / F4 割り当て / F5 進行管理 / F6 検収の判定 / F7 リリース管理 / F8 フィードバック / F9 参照 / F10 チームマネジメント の 10 個とする。管理知能は Kernel と別のプロセスで動き、型付き JSON の境界でだけやり取りする。管理知能の出力は候補であり、Kernel が検証して受け入れたものだけが記録になる。管理知能の出力を検証なしで記録や gate の入力にする経路は 0 件とする。管理層は「プロダクトの管理」と「ハーネス自身の管理」を名前空間とフォルダで分ける。 | UTV4-BR-033 | V4D-031, V4D-033, V4D-064 | 新規 | 既存の要件に管理知能の論点は無い |
| UTV4-FR-061 | 管理知能は Python で実装する。中核 (Kernel・gate・CLI・hook) は TypeScript / Node のままとする。管理知能は記録を直接書かず、提案だけを出す。管理知能を外した状態でも、中核は手動の計画で動き、中核の受入が通る。管理知能は外部監査 P-02 の 10 条件 (Windows 第一級、lock 固定、LLM の呼び出しは TS 側を経由、メモリと時間の上限 など) を満たす。この言語の決定は ADR-001 を更新して記録する。ADR-010 は作らない。ADR 本文は最新の決定だけを書き、末尾に短い改訂履歴 (PR 番号と comment id) を置く。 | UTV4-BR-034 | V4D-079, V4D-083, V4D-085, V4D-087 | 新規 | 既存の要件に実装言語の論点は無い (旧「互換性」節の TS 一本を撤回) |
| UTV4-FR-062 | 言語をまたぐ境界の正本は、product/contracts/ の言語中立な JSON Schema とする。TS 側の zod / 型と Python 側の型は、この schema から生成する。手で書いた境界の型は持たない。JSON Schema の draft・keyword・生成器の版を固定する。Windows + Node 24 で再生成した差分は 0 とする。生成した TS と Python の検証は、同じ入力に同じ合否を出す。この一致を、欠落と null・未知の field・union・数値範囲・default・型の自動変換 の各ケースで試験する (Pydantic は strict)。生成器が扱えない構文は、生成の時点で拒否する。 | UTV4-BR-034 | V4D-086 | 新規 | 既存の要件に境界 schema の論点は無い |
| UTV4-FR-063 | 管理知能は、並行する作業の着地順を、依存・path の重なり・base の鮮度から導いた提案として出す。提案は導出に使った入力 (依存、重なる path、base の commit) を含む。merge の可否は gate が決める。着地順の提案は merge の条件に入らない。 | UTV4-BR-035 | V4D-034 | 新規 | 既存の要件に merge 順序の論点は無い |
| UTV4-FR-064 | 差分と依存グラフ (import とファイル読み込みの依存) から、影響するテストと AT、および影響しないと判断した根拠を機械で出す。依存グラフは毎回 HEAD から計算し直す。宣言されていない依存は影響ありとして扱う。自動の回帰テストは当面全件を回す。重い受入は依存経路に触れたときだけ回す。検査の省略は、全回帰との比較で結果が一致すると示された場合だけ許す。stable への昇格では全受入を通す。 | UTV4-BR-036 | V4D-034, V4D-069 | 新規 | 既存の要件に検査範囲の導出の論点は無い |
| UTV4-FR-065 | 各 AT は、テスト設計を書く時点で宣言を持つ。宣言は、検証する要件・依存する範囲・実行の種類・環境の前提・入力の形式・必須になる条件を含む。受入 catalog (JSON) は test-design から生成し、手で編集しない。release のとき、catalog から「今回必須の AT」と「既存の合格を流用できる AT」を機械で分ける。環境の前提は実行の前に preflight で確かめる。前提を満たさないときは実行せず、理由を返す。 | UTV4-BR-037 | V4D-070 | 新規 | 既存の要件に受入の事前宣言の論点は無い |
| UTV4-FR-066 | v4 の右腕は次の層で運用する: L7 単体テスト / L8 仕様書作成 (as-built) / L9 結合テスト / L10 システムテスト / L11 UX 検証 / L12 受入 (UAT を含む) / L13 デプロイ後検証 / L14 運用検証。L13 と L14 は v3.1 から変えない。左右の対は L5 ↔ L9、L4 ↔ L10 とする。L8 は L4〜L6 の設計全体と対にする。v3.1 の L11 総合レビューは、各層の gate へ分ける。右側の設計の置き場の層名は、この構成に合わせる。v3 の層番号は今は振り直さず、v4 への切り替えのときに一括で移す。 | UTV4-BR-039 | V4D-073, V4D-074 | 新規 | 既存の要件に右腕の層構成の論点は無い (旧「互換性」節の L0-L14 継承を撤回) |
| UTV4-FR-067 | L8 は記録ではなく検証の工程とする。実装の後に、コードを正として as-built 仕様書を作る。as-built 仕様書を L4〜L6 の設計と突き合わせ、食い違いを一覧にする。食い違いは 1 件ずつ、「実装を直す (L7 へ)」「設計へ backfill する (Reverse)」「設計判断へ上げる」のどれか 1 つへ振り分ける。L8 の gate は、食い違いが 0 件か、全件が振り分け済みのときだけ通る。振り分けの判定は作者と別の family が行う。PO へ上げるのは product scope に関わる食い違いだけとする。既存の契約 (PLAN の中身を含む) の移行も、component ごとにこの手順で行う。移行の前後で成熟度の段が下がらないことを機械で確かめる。 | UTV4-BR-040, UTV4-BR-038 | V4D-045, V4D-075, V4D-078 | 新規 | 既存の要件に as-built 照合の論点は無い |
| UTV4-FR-068 | V 字の左腕を推進 (Forward)、右腕を証拠固め (Reverse とリファクタリング) とし、右腕を定常の工程として回す。右腕の作業は 証拠集め → 判定 → 設計還流とリファクタリング → 検証 → 仕様書 の順に進め、順序を跳ばした遷移は deny する。右腕で入れてよい変更は、振る舞いを変えないものだけとする。振る舞いを変える変更は、次の左腕のチケットへ回す。リファクタリングする family と検証する family を分ける。右腕の作業が要る領域は管理知能が見つけ、チケットの下書きを出す。Reverse の採点結果は型付きの証拠とし、Kernel が検証する。最初の試行は Pack だけを見せ、1 つのサブシステムで行う。 | UTV4-BR-041 | V4D-047, V4D-049, V4D-050 | 新規 | 既存の要件に右腕の定常化の論点は無い |
| UTV4-FR-069 | v4 の層構成への切り替えは、テンプレート・skill (決定時点 44 件)・src (同 16 件)・gate・lint の修正がすべて入ったときだけ完了にする。廃止した層番号と工程名の残存が 0 件であることを grep / lint で確かめる。docs/templates/vmodel/ は廃止する。設計テンプレートは docs/templates/design/、テスト設計テンプレートは docs/templates/test-design/ に置く。重複する L6 のテンプレート 2 本は 1 本にする。consumer に配るテンプレートの path の変更は、canary で確かめる。 | UTV4-BR-042 | V4D-074, V4D-076, V4D-077 | 新規 | 既存の要件に層の切り替えの完了条件の論点は無い |
| UTV4-FR-070 | リポジトリの最上位は product/ (配る物) と dev/ (配らない物) に分ける。product/ の中は kernel/ engine/ intelligence/ (Python) contracts/ parts/ に分ける。チケット・受領 (receipt)・設計の版などの記録の置き場は、置き場所の registry に 1 か所ずつ登録する。registry に無い場所への書き込みは guard が deny し、正しい path を示す。doctor の巡回は registry との外れを報告する (当面は報告だけで、fail-close にしない)。 | UTV4-BR-043 | V4D-030, V4D-031, V4D-080, V4D-081 | 新規 | 既存の要件に置き場所の論点は無い。チケット正本の置き場は「要件で未確定」U-6 |
| UTV4-FR-071 | このリポジトリの開発では、インストール済みのリリース harness (.ut-tdd/ の下) が規律 (hook・gate・guard) を判定する。開発中の product/ のコードは、自分自身の規律の判定に使わない。置き場所の移行は、置き場所の L4 設計が定める順序で行う。 | UTV4-BR-044 | V4D-080, V4D-081 | 新規 | 既存の要件に内部デプロイの論点は無い |
| UTV4-FR-072 | token・費用・所要時間は作業ログに記録する。記録はチケット 1 件につき 1 行とする。チケットを閉じるとき、harness が 1 回だけ集計して書く。自己申告の数字は入力にしない。工程 (L 層) ごとに束ねて読める。専用の DB テーブルは作らない。生のデータはセッションログに残し、harness は常時は取り込まない。 | UTV4-BR-045 | V4D-048 | 新規 | 既存の要件に費用記録の論点は無い |
| UTV4-FR-073 | WBS エンジンは、決定台帳・非機能の水準・工程 × 役割 (FR-002) を入力にして、作業を互いに独立になる単位へ分解する。分解の結果は、チケットの下書き (FR-035) の入力になる。層を凍結するとき、G6「WBS 完備」を機械で判定する。仮の値は見直し条件を持つ。見直し条件が成り立ったら、見直しのチケットの下書きが自動で作られる。 | UTV4-BR-046 | V4D-042, V4D-043, V4D-067 | 新規 | 既存の要件に作業分解の論点は無い |
| UTV4-FR-074 | 外部ライブラリは登録簿で管理する。登録簿に無い依存は lint が fail-close する。登録のとき、ライセンス・脆弱性・保守状況を審査する。ライセンスの承認は PO が行う。登録済みの依存も定期的に検査し直す。社内で作った部品は、コードから生成したカタログで検索できる。条件を満たす部品は社内ライブラリへ昇格できる。 | UTV4-BR-047 | V4D-062, V4D-064 | 新規 | 既存の要件に依存と部品の管理の論点は無い |
| UTV4-FR-075 | メンバーと権限の registry を持つ (#593)。registry は、メンバー・役割・権限・担当区分を持つ。管理知能 F10 のチームマネジメント (領域の持ち主、割り当てと空き、人をまたぐ実行と検収の分離、同時作業の調整、承認と上げ方、共有と通知、記録と説明責任) は、この registry を入力にする。権限 (authorization) を変える実装のチケットは、着手前の PO 承認記録を参照する。 | UTV4-BR-048, UTV4-BR-001 | V4D-038, V4D-059, V4D-064, V4D-084 | 新規 | 既存の要件に利用者・権限の registry の論点は無い。authorization に触れるため高影響境界 |
| UTV4-FR-076 | 設計判断の記録は、8 つの基本原則 (変更に強い / 予想外を予想内にする / 一定の保証能力 / 強い推進力と強い保証の両立 / クリーンシステム / 下流の課題は上流の整理不足とみなす / すぐに直せる / 二重管理しない) のうち、効く原則を 1 つ以上持つ。設計判断の正本は論点ごとに 1 つとする。既存の論点を変える決定は、その記録 (ADR・要求・要件の既存行) を同じ ID のまま更新する。新しい ID は、どの既存記録にも無い論点にだけ作る。本文には最新の決定だけを書き、経緯は PR と git の履歴で追う。 | UTV4-BR-049 | V4D-058, V4D-085, V4D-087 | 新規 | 既存の要件に判定基準と記録の一意性の論点は無い |

## 要件化不要

どの要求も 1 件以上の要件で実現している。要件化不要の要求は無い。

| 要求 | 理由 |
|---|---|

## 要件で未確定

次の論点は、PO の決定がまだ無い。決定を捏造せず、選択肢だけを並べる。
U-5 (#591 の 18 件のどれを直すか) は V4D-035 で解消した。18 件すべてを v4 で直す (UTV4-FR-006 / 007 / 013)。U-5 の番号は再利用しない。中立な要件は、どの選択肢を採っても成り立つ観測条件である。

| 項目 | 関係する要件 | 中立な要件 (観測できる条件) | 選択肢 | 根拠 (V4D) |
|---|---|---|---|---|
| U-1 証跡ログを git の中に置くか外に置くか | UTV4-FR-006 | 証跡の本体は 1 件ごとに ID で引ける。参照側が持つ digest と本体の digest の一致を機械で確かめられる。 | (a) 証跡ログを git で tracked にする / (b) git の外 (ローカルの store など) に置き、ID と digest だけを tracked にする / (c) 種類で分ける (review receipt は tracked、生のセッションログは外) | V4D-048, V4D-060, V4D-063 |
| U-2 「消す対象」の列と最小のチケット構造 | UTV4-FR-004, UTV4-FR-025 | 新しく作る変更ごとに、削る対象 (または「無し」とその理由) を機械で読める。 | (a) チケットに 4 つ目の field として持たせる / (b) PR の本文または receipt に持たせる / (c) 設計書の成果物所有の差分から機械で出す | V4D-036, V4D-056 |
| U-3 PoC の規模・期限の上限と超過の扱いを、discovery チケットへ引き継ぐか | UTV4-FR-059 | PoC チケットが上限を持つ場合、その超過は機械で検出され、finding として出る。 | (a) discovery の検収雛形に規模と期限を必須にし、超過で新規発行を止める (旧 V4D-028 の中身、現在 superseded) / (b) 期限だけを持たせ、超過は警告にする / (c) 上限を持たせず、最小のチケット構造のままにする | V4D-054, V4D-065 |
| U-4 G1 / G3 / G4 に ops の役割を足すか (#770) | UTV4-FR-002 | G1 / G3 / G4 の各 gate に参加する役割の集合が、工程 × 役割の表から機械で読める。 | (a) 3 つの gate すべてに ops を足す / (b) 足さない / (c) gate ごとに個別に決める | V4D-043 |
| U-6 チケット正本の置き場 (docs/tasks/*.yaml か、product / dev の配置か) | UTV4-FR-004, UTV4-FR-070 | チケット正本の置き場は 1 か所で、置き場所の registry に登録されている。そこ以外へのチケットの書き込みは guard が止める。 | (a) docs/tasks/*.yaml (旧 V4D-053 の案、現在 superseded) / (b) dev/ の下 / (c) 記録の置き場 (.ut-tdd/ の下など) | V4D-055, V4D-080, V4D-081 |

## 廃止した要件

行ごと廃止した要件 ID は無い。V4D-087 に従い、論点が残る要件は同じ ID のまま書き直した。
次の表は、書き直しで撤回した中身と、撤回の根拠の決定である。

| 旧 ID / 旧記述 | 撤回した中身 | 根拠 (V4D) |
|---|---|---|
| UTV4-FR-004 | チケットが assignment・scope・base・HEAD・lease・fence・budget・証拠義務を持つこと | V4D-056 |
| UTV4-FR-004 | 既存 PLAN (U23 Execution Ledger) を改訂してチケットの受け皿にすること | V4D-078 |
| UTV4-FR-005 | lease model (lease の無い書き込み・重複 lease・期限切れ lease を conflict にする) | V4D-056, V4D-067 |
| UTV4-FR-005 | PLAN 採番予約を lease の適用面にすること | V4D-078 |
| UTV4-FR-006 | PLAN 本文を narrative 正本の 1 種とすること | V4D-078 |
| UTV4-FR-007 | PLAN frontmatter を Reverse 対 PLAN で段階的に record 化すること | V4D-078 |
| UTV4-FR-016 / 017 / 018 | Discovery PoC を別 axis とし、S3 / S4 decision record を terminal 条件と Forward reentry 条件にすること | V4D-054 |
| UTV4-FR-028 | PoC / 画面プロト用の独自 work item record (期限・期待する反応の種類など) | V4D-056, V4D-065 |
| UTV4-FR-029 | 旧層の意味 (L5〜L7 / L8〜L12) による owner の割り当て | V4D-073 |
| UTV4-FR-030 | 依存単位チケット群・統合チケット・lease 移転による引き取り | V4D-056, V4D-067 |
| UTV4-FR-031 | 再集計上限を超えたら基本設計 owner へ差し戻すこと | V4D-065 |
| UTV4-FR-032 | path / 依存単位で lease が重ならないように切ること | V4D-067 |
| UTV4-FR-033 | 1 人の時期も lease を自分宛てに発行すること | V4D-056 |
| UTV4-FR-034 | 統括 owner 1 名が projection を入力に判断すること | V4D-068 |
| UTV4-FR-035 | ticket compiler の既定発行・人の batch admission・層別の発行勾配 | V4D-067, V4D-068 |
| UTV4-FR-036 | 大・中・小・原子の 4 階層と、原子だけが path lease を持つこと | V4D-055, V4D-056 |
| UTV4-FR-037 | 中チケット・fence・原子チケット・lease の一時回収による incident 処理 | V4D-055, V4D-056 |
| UTV4-FR-038 / 040 / 056 / 058 | S4 record / S4 decision record / S4 confirmed を入力や条件にすること | V4D-054 |
| UTV4-FR-046 | 依存グラフの入力に PLAN の requires / references を使うこと | V4D-078 |
| UTV4-FR-048 | ticket compiler の再 compile と、Reverse 対 PLAN を backflow の projection にすること | V4D-067, V4D-078 |
| UTV4-FR-050 | 原子チケット (lease + budget) の dispatch | V4D-055, V4D-056 |
| UTV4-FR-052 / 053 | 原子 / 小 / 中 / 大ごとのリファクタリング責務と発火の扱い | V4D-055 |
| UTV4-FR-054 | 小以上に admission チケットを対で compile し、階層別に assignee を決めること | V4D-055, V4D-065 |
| UTV4-FR-055 | 原子 / 小 / 中ごとの人間 review の傾斜 | V4D-055 |
| UTV4-FR-059 | PoC の scope / budget record 必須と、超過時に S4 decision まで新規発行を止めること | V4D-054 |
| 互換性「L0-L14 を継承」 | 右腕の層の意味を v3.1 のまま継承すること | V4D-073 |
| 互換性「TypeScript/Node 一本」 | 実装言語を TypeScript / Node だけにすること | V4D-079 |
| 互換性「9-mode + routeFiling SSoT を継承」 | route のモードを工程の種類として残すこと | V4D-065, V4D-078 |
| 互換性「Forward / Reverse / Recovery を継承」 | Scrum / PoC (S0〜S4) を工程として残す読み方 | V4D-054 |

## 互換性

- 左腕 (L0〜L6) と Forward / Reverse は v3.1 から継承する。工程の種類は Forward と Reverse とチケットだけとする (V4D-054)。
- Scrum / PoC (S0〜S4) は工程として撤廃する。PoC はチケットの種類として残す (V4D-054、V4D-065)。
- v4 の右腕は次のとおりとする (V4D-073、V4D-075):
  - L7 単体テスト
  - L8 as-built 仕様書。L4〜L6 の設計との照合による検証の工程とする。
  - L9 結合テスト。L5 と対にする。
  - L10 システムテスト。L4 と対にする。
  - L11 UX 検証
  - L12 受入 (UAT を含む)
  - L13 / L14 は v3.1 から変えない。
- v3.1 の L11 総合レビューは、各層の gate へ分ける。層番号の振り直しは v4 への切り替えのときに一括で行う (V4D-073)。
- 実装言語: 管理知能は Python、中核 (Kernel・gate・CLI・hook) は TypeScript / Node とする (V4D-079)。
- 言語の境界: product/contracts/ の JSON Schema を正本とし、両側の型はそこから生成する (V4D-086)。
- この言語の決定は ADR-001 を更新して記録する。ADR-010 は作らない (V4D-085、V4D-087)。
- PLAN は v4 への切り替えで全面廃止し、既存分は凍結する。切り替えまでは PLAN 上の gate と CI を外さない (V4D-078)。
- route のモードは、チケットの種類 (Forward / Reverse / Scrum を除く) へ移る (V4D-065)。
- fail-close、cross-family review、Pack 配布契約は継承する。
- 本書は新しい engine・台帳・DB authority を導入しない。harness.db は正本ファイルから作り直せる索引である (V4D-060)。
