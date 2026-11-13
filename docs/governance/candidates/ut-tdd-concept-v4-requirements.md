---
document_id: UT-TDD-CONCEPT-V4-REQUIREMENTS
status: draft_candidate
concept: docs/governance/candidates/ut-tdd-concept-v4.0.md
requests: docs/governance/candidates/ut-tdd-concept-v4-requests.md
decision_ledger: docs/governance/candidates/v4-decision-ledger.json
issue: 530
revision_base_artifact: docs/design/harness/L1-requirements/vmodel-engine-swap-requirements-delta.md
---

# UT-TDD 構想書 v4.0 L3 要件候補 (チーム開発版)

> **改訂メモ (2026-11-12、#1005 のコメント 6822862705):** v4 の要求 79 件を見直し、区分ごとに本文を改めた。
> 残す 11 件 (文言どおり) / 簡素化 41 件 (本文を小さい形へ書き直し、行頭に【2026-11-12 簡素化】) / 先送り 12 件 (1.0.0 の対象外、行頭に【2026-11-12 先送り】、旧文は残す) / 撤回 15 件 (作らない、行頭に【2026-11-12 撤回】と 1 行の理由)。**ID は消さず、振り直さない** (他の文書と Issue が引く)。
> 決定: スプレッドシート・Office・Google 文書は人間が読む一方向の書き出しで書き戻しは作らない。チケットの正本は GitHub Issue。管理知能 (別プロセスの Python) は作らない。1.0.0 が保証する運用形態は hybrid だけ。層番号の振り直しとディレクトリ再編は先送り。上流の製品工程はテンプレートとチェックリストだけ。新しい要件として UTV4-FR-080 (派生する一覧は手で編集しない) を足した。
> 以下の本文と、他の節に残る記述が食い違うときは、この改訂メモと要件候補表の行頭の区分を優先する。

## Authority 境界

本書は #530 の未承認候補である。current requirements (要件定義書 v1.2、VUP-REQ-01〜10)、Requirement IR、
runtime、DB へ投影しない。承認後は VUP-REQ-11〜 として `vmodel-engine-swap-requirements-delta.md` と同じ
additive 方式の L1 delta 文書へ写す。既存 VUP-REQ-01〜10 は変えない。

PLAN は廃止済みである (方針は V4D-078、本文の削除は #1078)。本書の正規の受け皿は #530 とする。

## 決定台帳・要求との関係

各要件は、実現する L1 要求 (UTV4-BR-xxx) と、根拠の有効な決定 (V4D-xxx) を引く。
どの要求も 1 件以上の要件で実現されるか、「要件化不要」の表に理由付きで載る。
この対応は次のコマンドで機械的に確かめる。

```bash
node docs/governance/candidates/v4-ledger-check.mjs
```

書き方の規則 (V4D-087):

- 既存の要件と同じ論点の決定は、既存の行を直す。ID は変えない。
- 新しい ID を作るのは、どの既存の要件にも無い論点だけにする。
- 既存の行と同じ内容を新しい ID で書き足さない。
- 撤回した中身は「廃止した要件」の表に、撤回の根拠の決定と一緒に残す。
- 要件は観測できる条件で書く。意図だけの文は書かない。

区分の意味: 維持 = 文言をそのまま残した。既存を更新 = 同じ ID のまま決定に合わせて書き直した。新規 = どの既存の要件にも無い論点。

集計: 維持 23 件 / 既存を更新 37 件 / 新規 19 件 (計 79 件)。この集計は 2026-11-12 の見直し前の「区分」列の数である。見直し後の区分は行頭の印で読む (残す 11 / 簡素化 41 / 先送り 12 / 撤回 15)。UTV4-FR-080 は 2026-11-12 に新規で足した (計 80 件)。

## 要件候補

| ID | 要件 | 要求 | 根拠 (V4D) | 区分 | 既存との関係 |
|---|---|---|---|---|---|
| UTV4-FR-001 | 【2026-11-12 簡素化】承認 (approve) と決定 (decision) は人間の GitHub アカウントによる PR approve または決定コメントに限り、HEAD (revision) へ束縛する。AI・memory・session summary・AI 解釈は approval を生成できない。request / selection / approval / decision / disposition を別 identity の記録として持つことはしない。 | UTV4-BR-001 | V4D-001, V4D-059 | 維持 | PLAN-L7-517 (author provenance) の「claim は authority にならない」原則を人間 authority へ拡張 |
| UTV4-FR-002 | 【2026-11-12 簡素化】責務分担表 (RACI) は工程 × 役割の markdown 表を 1 つ持ち、各工程の A (最終責任) がちょうど 1 つであることを lint で確かめる。AI の PO 向け質問の admit / deny を機械で判定することはしない (反射的エスカレーションの禁止は CLAUDE.md と advisor の規律で運用する)。表は発注者 / 受託者と契約形態の属性を持たない。 | UTV4-BR-002 | V4D-001, V4D-043, V4D-105 | 既存を更新 | 旧文の層別境界表を工程 × 役割の RACI に置き換えた。G1 / G3 / G4 には ops を足さない (旧 U-4、V4D-105 で解消。ops の役割がメンバー registry に実在した時に RACI の C 列へ足す) |
| UTV4-FR-003 | actionable behavior・チケット・finding は exactly-one primary owner を持つ。owner は人間ユーザー identity または logical lane であり、provider 名・model 名を owner にしない。多重 owner・owner 不在は fail-close。 | UTV4-BR-001, UTV4-BR-003 | V4D-001, V4D-059 | 維持 | 参照元構想の exactly-one owner 要件の翻案。routeFiling / delegation-routing の family 分離と整合 |
| UTV4-FR-004 | 【2026-11-12 簡素化】チケットの正本は GitHub Issue / Sub-issue / PR とする。ハーネス独自のチケット store・tracked 記録・投影・ずれ検出は作らない。必須 field は「やること」「ゴールの検証 (根拠コマンド付き)」「親の参照」の 3 つで、Issue テンプレートで持つ。段は Issue / Sub-issue / PR の 3 段とし、親はちょうど 1 つ (GitHub の sub-issue が保証する)。review の証跡は PR の exact-head receipt に置く。Issue は作業の許可であって権限を持たない。契約本文と設計判断は設計書に置き、Issue 本文には書かない。Issue 本文経由の prompt injection は FR-077 のシナリオに含める。GitHub 停止時の縮退は別途扱う (#902)。 | UTV4-BR-003 | V4D-007, V4D-055, V4D-056, V4D-106 | 既存を更新 | 旧文の lease / fence / budget 付き work item record と、既存 PLAN (U23 Execution Ledger) を受け皿にする方針を撤回した。置き場は dev/records/tickets/ に決まった (旧 U-6、V4D-106 で解消。UTV4-FR-070 の registry に登録する) |
| UTV4-FR-005 | 【2026-11-12 簡素化】二重着手の防止は Issue の self-assign (claim) で行い、assign 済みへの 2 人目の assign を lint または bot で拒否する。触る path の担当は path → 担当の表 (CODEOWNERS 相当、advisory) で示す。claim は二重着手の防止だけに使い、書き込み権限の根拠にしない。foreign-edit guard と review request の一意性は、この規則の適用面として維持する。 | UTV4-BR-004 | V4D-056, V4D-067, V4D-068 | 既存を更新 | 旧文の lease model と PLAN 採番予約を撤回した |
| UTV4-FR-006 | 【2026-11-12 簡素化】review receipt / verdict は、別の clone・別の PC から merge 判定に使えるようにする (保管方式は U-1 の実機確認で決める。現状は clone ごとの手元にしか無い)。DB にしか無い状態は 0 件とし、harness.db は正本から作り直せる索引にする。GitHub は意味の正本にしない。証跡の本体は設計書に書かず、参照する側は証跡の ID と digest だけを持つ。全機械記録の JSON 化と、#591 の 18 件をすべて v4 で直すことは要件にしない (18 件は個別の Issue で採否を決める)。 | UTV4-BR-005 | V4D-035, V4D-060, V4D-063, V4D-102 | 既存を更新 | 旧文の「PLAN 本文は narrative 正本」を外した (V4D-078)。#591 の 18 件を v4 で直すこと (V4D-035) を加え、旧 U-5 を解消した。証跡ログの置き場は種類で分けると決まった (旧 U-1、V4D-102 で解消) |
| UTV4-FR-007 | 【2026-11-12 撤回】PLAN は `docs/plans` の物理削除 (#1365) で既に廃止済みで、完了条件は工程 ② (#958) が持つ。成果物 path の所有の機械停止は FR-005 の区分表に吸収する。 | UTV4-BR-038 | V4D-035, V4D-052, V4D-063, V4D-078 | 既存を更新 | 論点 (PLAN の構造をどう扱うか) は同じ。旧文の「PLAN frontmatter を段階的に record 化する」を撤回し、PLAN の全面廃止に書き直した |
| UTV4-FR-008 | 【2026-11-12 簡素化】要求・要件・設計のスプレッドシート / Office / Google 文書は、人間が読むための一方向の書き出しとする。正本から決定的に生成し、生成元 identity・digest・「編集禁止」を埋め込む。書き戻しは作らない。リリース時の Office 書き出し (#1033) をこの形で行う。 | UTV4-BR-006 | V4D-001, V4D-013 | 維持 | BR-06 / UX-02 の実装形。advisor 指摘リスク 2 |
| UTV4-FR-009 | 【2026-11-12 先送り: 1.0.0 の対象外。必要が実測されたときに扱う。発火条件: 開発者でないメンバーがシートで要求を日常的に編集する必要が出たとき (シートは一方向の書き出しのみ)】旧文: view からの変更は構造化正本への admission transaction 経由でのみ受理し、markdown 正本への機械書き戻しは行わない。admission は actor・source view・target record・revision を receipt に残す。 | UTV4-BR-006 | V4D-001, V4D-013 | 維持 | 参照元構想の Issue admission (GitHub 側編集の逆流) を view 一般へ翻案 |
| UTV4-FR-010 | 【2026-11-12 簡素化】教訓は、仕組み (テンプレート・設計パターン → gate / lint → 運用ルール / skill の順) にして残す。改善の行き先を選んだら、それより上流を選ばなかった理由を PR または Issue に 1 行書く。単一 episode で規則・機構へ昇格しない。不要になったルールや記録は、効果を確かめた後にだけ片付ける。保持期間と暴走停止の閾値の機構は持たない (bot は作らない)。 | UTV4-BR-007 | V4D-061, V4D-064 | 既存を更新 | 旧文の「既存 V-model へ route する」を、4 段の振り分けと片付けと暴走停止に書き直した |
| UTV4-FR-011 | 【2026-11-12 先送り: 1.0.0 の対象外。必要が実測されたときに扱う。発火条件: 2 つ以上の consumer が改善を供出し始めたとき】旧文: 同じ改善候補を人間向け digest (generated view) としてチームへ配り、採否は人間の decision record として残す。project 横断のナレッジ共有 (#413) は、project identity による record 正本の namespace 分離を前提にする。 | UTV4-BR-007 | V4D-061 | 既存を更新 | 旧文の PLAN-L7-512 / 529 への参照を外した (V4D-078) |
| UTV4-FR-012 | 【2026-11-12 簡素化】進捗は、チケット・PR・CI・review・merge の事実から GitHub Projects へ一方向に同期する (既存の `syncForwardProject` の単位をチケットへ付け替える)。人の手入力とモデルの自己申告は入力にしない。完了の予測 (P50 / P85) は作らない。 | UTV4-BR-008 | V4D-010, V4D-041, V4D-068 | 既存を更新 | 旧文に、一方向の全体ビューと鮮度表示と完了予測を加えた |
| UTV4-FR-013 | 独立 review は authoring context から分離し、candidate HEAD と CI generation へ exact 束縛する。author runtime の内部 review を独立 review へ昇格しない。wrong HEAD の receipt を再利用しない。reviewer の family 条件は profile (FR-023) が決める: hybrid では author と別 family、single-provider では同 family でも FR-023 の attestation を満たす別 session・上位 tier を admit し `same_family_separated` を記録する。review の依頼・判定・受領は 1 つの構造化記録で扱う。判定は reviewer の自由文から拾わず、schema に沿った機械可読の verdict として受け取る。受領の無い依頼と、依頼に対応しない受領は doctor が finding として出す。review 往復の根 (memory との兼用、自由文 verdict、orphan request、identity の 3 重比較) は v4 で直す (V4D-035)。 | UTV4-BR-013 | V4D-023, V4D-035 | 既存を更新 | 旧文に、review の往復を 1 つの構造化記録で扱うことと、自由文 verdict の廃止を加えた |
| UTV4-FR-014 | current identity と compatibility identity を分離し、legacy (Bun、personal path、旧 memory 中心継続) の green で current の failure を相殺しない。 | UTV4-BR-014 | V4D-029 | 維持 | ADR-001、Bun BAN (#450) を継承 |
| UTV4-FR-015 | 【2026-11-12 簡素化】L1 intake の markdown テンプレートに「未確定」欄を置き、未確定値を AI が補完しないことを review で確かめる。intake の record 化と L2 の question event は作らない。 | UTV4-BR-009 | V4D-003 | 維持 | 要件定義書 v1.2 §L1 / BR-01 の intake を record 化。設計判断エリシテーション規約の機械契約 |
| UTV4-FR-016 | 【2026-11-12 撤回】L2 discovery の event store と L3 の決定的 compiler は作らない。AI が起草し人間が freeze する形で足りる (人間承認の後だけ frozen は FR-058 が持つ)。L1 → L3 の追跡は #1196 の lint で補う。 | UTV4-BR-009, UTV4-BR-010 | V4D-003, V4D-065 | 既存を更新 | discovery の入力を、S0〜S4 の PoC からチケットの種類としての PoC に替えた (V4D-054 / V4D-065) |
| UTV4-FR-017 | 【2026-11-12 簡素化】PoC は工程ではなく、Issue の種類 (`poc` ラベル) の 1 つとする。チケットの種類と状態値に、S0〜S4 の段や Forward / Reverse と別の工程軸を持たない。PoC の Issue は issue テンプレートの「判定」欄 (結論と根拠) が埋まるまで閉じられない (close 時に lint)。判定記録の無い PoC の成果は production の成果として数えない。 | UTV4-BR-010 | V4D-054, V4D-065 | 既存を更新 | 旧文の「Discovery PoC は別 axis、S4 decision record が terminal 条件」を撤回した |
| UTV4-FR-018 | 【2026-11-12 簡素化】PoC の成果物 (branch / path) は、判定記録が採用を示し、production 側の作業が別の Issue として発行されるまで main へ merge しない。prototype 反応の構造化還元 (underlying need・candidate・AC への分解) は要件にしない。 | UTV4-BR-010 | V4D-054, V4D-065 | 既存を更新 | 旧文の Forward reentry 条件「S4 confirmed + 正規 V-pair」を、判定記録と別チケットの発行に替えた |
| UTV4-FR-019 | 【2026-11-12 簡素化】メモリに secret / PII / progress / raw log を入れない (fail-close)。プロバイダー個別の標準メモリ (Claude の auto-memory など) への書き込みは hook guard で拒否し、`ut-tdd memory add` へ誘導する。hook で強制できない経路は、規律と doctor の事後検出で補う。正本化済みの教訓の退役は、CLAUDE.md の手順 (`git rm` + 昇格先の PR を書く) で行い、retirement record は持たない。再発防止の教訓は、機構にできるなら機構を優先する。 | UTV4-BR-011 | V4D-005, V4D-099 | 既存を更新 | PLAN-L7-189 / memory-sync gate / CLAUDE.md「手書き禁止・エピソード状態を書かない」の機械化。FR-010 の非昇格原則と整合 |
| UTV4-FR-020 | 【2026-11-12 撤回】学習資産 (CASE / SCENE / PATTERN 等) の owner と縮退状態の管理は作らない。ハーネス固有の教訓は FR-019 の仕組み化で扱う。 | UTV4-BR-011 | V4D-005 | 維持 | FR-003 exactly-one owner を学習資産へ適用 (#413) |
| UTV4-FR-021 | 【2026-11-12 撤回】skill 適用範囲の typed registry は作らない。skill の段階読み込みは Claude Code / Codex の標準と、既存の `src/skill-engine/recommend.ts` で足りる。 | UTV4-BR-012 | V4D-006 | 維持 | `skills/` frontmatter と `ut-tdd skill suggest` (`src/skill-engine/`) の入力契約を registry 化 |
| UTV4-FR-022 | 【2026-11-12 撤回】知識 packet の決定的 compile・firing telemetry・quarantine は作らない。skill の一括注入禁止は運用規律で足りる。昇格の「単一 episode で昇格しない」は FR-010 に残す。 | UTV4-BR-012 | V4D-006 | 維持 | CLAUDE.md §Skills「bulk-load 禁止」、FR-010「単一 episode で昇格しない」を一契約へ |
| UTV4-FR-023 | 【2026-11-12 簡素化】provider topology は project 設定の 1 項目 (`hybrid` / `single-provider` / `standalone`) とする。1.0.0 が保証するのは `hybrid` だけで、単一 provider は現在の fallback (`intra_runtime_subagent` 記録、CLAUDE.md「唯一の回避条件」) のままにする。最初の導入先が片方の provider しか使えないと分かった時点で見直す (その場合の最小形は、receipt の evidence tier 欄と、別 session・上位 tier の要求)。同一 session 内 subagent の review は全 profile で独立 review にならない。 | UTV4-BR-013 | V4D-023 | 維持 | delegation-routing / agent-guard / review-evidence gate (`checkCrossAgentModelPair`) の判定軸を role × tier × session へ拡張 |
| UTV4-FR-024 | 【2026-11-12 簡素化】単一 provider の補償統制 (高影響境界への人間 review、月次の手動 sampling、doctor の fail-close 化、mutation 検証) は、FR-023 で単一 provider を採るときに作る。1.0.0 の対象外 (hybrid のみ保証)。採るときの最小形は、高影響境界の人間 review と月次の手動 sampling (#787) とし、doctor の fail-close 化と mutation 検証は後回しにする。 | UTV4-BR-013 | V4D-023 | 維持 | CLAUDE.md「唯一の回避条件: 利用上限による停止」を record 化 |
| UTV4-FR-025 | 【2026-11-12 簡素化】新しく作る変更は、PR テンプレートの「削るもの / 無し + 理由」欄で、削る対象を書く (収支原則)。surface の 7 class 分類・計測 record・段階機械 (planned〜retired) は作らない。縮退は #1084 系が機構なしで進める。 | UTV4-BR-014 | V4D-029, V4D-036, V4D-103 | 既存を更新 | 旧文に、版別の段階と入れ替えの順序と収支原則を加えた。版番号の割当は PO 未採択 (V4D-029)。削る対象の出し方は決まった (旧 U-2、V4D-103 で解消) |
| UTV4-FR-026 | 【2026-11-12 簡素化】DB schema の変更は、データを失わない migration と doctor gate (live schema vs canonical) を伴う。legacy token の完全 inventory は、退役ごと (Bun・PLAN など) に限る。 | UTV4-BR-014 | V4D-029 | 維持 | Bun 撤去 (#487 / #450)、旧 9-mode 残骸、`docs/migration/` snapshot、harness.db schema に適用 |
| UTV4-FR-027 | review receipt は candidate workspace と repository identity に束縛して保管し、malformed receipt は削除せず訂正世代を積む。reviewer session id は実在 attestation を要求し、admission 失敗は typed reason で返す。worktree / branch の回収は「origin/main の ancestor かつ clean」の証明付きで dry-run 既定、未 commit 残置・未 push branch・stale base・projection の silent skip は doctor finding として surface する。 | UTV4-BR-013, UTV4-BR-014 | V4D-035 | 維持 | #505 / #493 / #439 / #386 / #384 / #426 / #169 系の恒久対策を 1 契約へ |
| UTV4-FR-028 | 【2026-11-12 簡素化】上流の PoC / 画面プロトタイプは、種類を持つ Issue (issue テンプレート 2 種) として発行し、「画面ルールを決めてから並行する」チェックリストを置く。L2 discovery event への接続は要件にしない (FR-016 撤回)。 | UTV4-BR-010, UTV4-BR-031 | V4D-008, V4D-065 | 既存を更新 | 旧文の独自 work item record を、種類付きの最小チケット (FR-004) に替えた |
| UTV4-FR-029 | 【2026-11-12 簡素化】owner の数は、設計文書の frontmatter `owner:` を 1 名とする lint、Issue の assignee を 1 名とする lint、author と別の非著者 review (既存) で固定する。L0〜L4 は文書単位で人間 owner 1 名、提案と起草は owner 以外も行え、採択・統合・freeze は owner だけが行う。 | UTV4-BR-015 | V4D-008, V4D-073, V4D-075 | 既存を更新 | 旧文の旧層の意味 (L5〜L7 / L8〜L12) と 4 階層の前提を、v4 の右腕と 3 段のチケットに合わせた |
| UTV4-FR-030 | 【2026-11-12 撤回】担当替えの記録は GitHub の assignee 変更の timeline に残る (理由と HEAD はコメント 1 行)。再検討の条件: 5 人超、または引き取りの争いが起きたとき。 | UTV4-BR-016, UTV4-BR-004 | V4D-067, V4D-068 | 既存を更新 | 旧文の依存単位チケット群・統合チケット・lease 移転を撤回した |
| UTV4-FR-031 | 【2026-11-12 簡素化】差し戻しは 2 種類とする。軽い是正は同じ PR の中で 3 回まで、契約 (設計) の食い違いは設計の改訂へ戻す。規律文 (CLAUDE.md §FLAG 後の限定是正と merge) として Pack で配る。是正の回数は、receipt から数えられる範囲で数える。 | UTV4-BR-030, UTV4-BR-016 | V4D-065 | 既存を更新 | 旧文の「再集計上限を超えたら基本設計 owner へ差し戻す」を、2 種の差し戻し (T5) に替えた |
| UTV4-FR-032 | 実装の作業は、互いに依存しない機能・責務の単位で切る。依存が残るときは、先にインターフェースだけを決めるチケットを切る。PR 段のチケットの受入は main への merge とする。merge の条件は次の 3 つとする: candidate HEAD が main の上にあり衝突が 0、exact HEAD の CI が green、exact HEAD に束縛した独立 review の receipt がある。システム受入 (L10 システムテスト〜L12 受入) は、これとは別に release の適格性で閉じる。 | UTV4-BR-016, UTV4-BR-004 | V4D-009, V4D-067 | 既存を更新 | 旧文の「path / 依存で lease が重ならないように切る」を、独立単位とインターフェース先行に替えた |
| UTV4-FR-033 | 【2026-11-12 簡素化】工程・gate は参加人数に依存しない。人数別のモードを作らず、1 人の時期でも工程を省略しない。人数を理由に省いたことを gate で検出する機構は作らない (観測できないため)。 | UTV4-BR-017 | V4D-010 | 既存を更新 | 旧文の lease を claim に替えた |
| UTV4-FR-034 | 【2026-11-12 簡素化】チケットの発行は PO が持つが、担当区分のリーダーへ委任できる。メンバーは発行済みの Issue を取って対応する (pull 型)。メンバーが見つけた問題は `proposal` ラベルの Issue として出し、PO またはリーダーが仕分けるまで着手しない。チームごとの管理知能の視野制限は持たない (管理知能は作らない)。 | UTV4-BR-017, UTV4-BR-008 | V4D-067, V4D-068 | 既存を更新 | 旧文の統括 owner 1 名を撤回した。全体ビューは FR-012 |
| UTV4-FR-035 | 【2026-11-12 簡素化】AI が設計文書から起草した Issue は `draft` ラベルで出し、人間が承認したものだけ着手できる。AI は自分では発行を確定しない。決定的な下書き生成 (同じ入力から同じ集合) と compiler は作らない。 | UTV4-BR-017 | V4D-064, V4D-067 | 既存を更新 | 旧文の ticket compiler 既定発行・batch admission・層別の発行勾配を撤回した |
| UTV4-FR-036 | 【2026-11-12 撤回】チケットの段は GitHub の sub-issue (親は 1 つしか持てない) と `github-issue-hierarchy.md` で足りる (FR-004 を GitHub 正本にしたため)。 | UTV4-BR-003 | V4D-055, V4D-056 | 既存を更新 | 論点 (チケットの入れ子) は同じ。旧文の大・中・小・原子の 4 階層と、原子だけが lease を持つ規則を撤回した |
| UTV4-FR-037 | 【2026-11-12 簡素化】複数の区分に跨る欠陥は `incident` Issue と `hold` ラベルで扱い、`ut-tdd pr merge` が `hold` を見て影響下の merge を止める。契約の誤りが原因なら Reverse を対にする。hotfix branch への直接 push は branch protection で拒否する。依存 graph からの影響範囲判定は 1.0.0 の後に回す。 | UTV4-BR-018 | V4D-014 | 既存を更新 | 旧文の中チケット・fence・原子チケット・lease の一時回収を、3 段のチケットと区分に替えた |
| UTV4-FR-038 | 【2026-11-12 先送り: 1.0.0 の対象外。必要が実測されたときに扱う。発火条件: FR-011 と同じ (export を作るときは secret / PII の遮断が必須)】旧文: 各 project は receipt・finding・hook event・issue / PR / review コメント・incident・PoC チケットの判定記録を、project 単位の improvement intake record (namespace = project identity、機微 = secret / PII / private transcript を admission で遮断) に集約する。ハーネス改善への供出は opt-in の一方向 export とし、集約先はハーネス repo の Evidence Ledger (project 横断 corpus) とする。Issue / コメント本文は意味正本にしない。 | UTV4-BR-019 | V4D-015 | 既存を更新 | 旧文の「S4 record」を「PoC チケットの判定記録」にした (V4D-054) |
| UTV4-FR-039 | 【2026-11-12 先送り: 1.0.0 の対象外。必要が実測されたときに扱う。発火条件: UI を持つ consumer で、画面と要件の食い違いが繰り返し記録されたとき】旧文: 画面モック / プロトタイプの製本は 2 点で行う: (a) L2 → L3 compile 時に screen id ごとの prototype record と反応 event を画面仕様 (generated view + typed record) に束ね、要件 IR の surface / action / state / AC へ結ぶ、(b) L5 詳細設計で component / 状態 / 失敗 / 回復を画面詳細として再製本する。モック画像・プロト実装・自由文反応は正本にならず、製本物は生成元 id と digest を持つ。 | UTV4-BR-020 | V4D-016 | 維持 | FR-018 / FR-028 の出口。FR-008 の generated view 契約 |
| UTV4-FR-040 | 【2026-11-12 簡素化】既存の skill は 1 度の棚卸し (#727) で、モデルが既に知っている一般手順の skill を退役候補にする。新規の skill は frontmatter に出典の PR / Issue を書く。実録との相関の機械照合 (GENERIC_PROCEDURE class) は作らない。 | UTV4-BR-021 | V4D-017 | 既存を更新 | 旧文の「S4 record」を「判定記録」にした (V4D-054) |
| UTV4-FR-041 | 【2026-11-12 撤回】全 LLM 判断の judgement record 化は作らない。admission に入る LLM 判断は review verdict だけで、FR-013 の receipt が記録する。 | UTV4-BR-023 | V4D-018 | 維持 | FR-010 / FR-019 の判断面。既存の review receipt / advisor 発火ログを record 化する |
| UTV4-FR-042 | 【2026-11-12 先送り: 1.0.0 の対象外。必要が実測されたときに扱う。発火条件: FR-072 の実測で、AI 費用か review 費用が PO の決めた予算を超えたとき】旧文: judgement record には後続事実 (CI / oracle 結果、incident、Reverse 発生、人間 override、利用者フィードバック) が back-annotate され、判断種別 × 判断者ごとに正答率・見逃し・過検知が計測される (calibration)。同種判断の calibration が閾値を満たしたときのみ、LLM 判断 → 安価モデル / 分類器 → 決定的 check の順に機械判断化を提案でき、各段は FR-022 と同じ shadow → before/after → 独立 review を経て gate 化する。単一 episode・calibration 無しの昇格は deny。 | UTV4-BR-023 | V4D-018 | 維持 | FR-022 / FR-025 の昇格経路を判断へ拡張 |
| UTV4-FR-043 | 【2026-11-12 先送り: 1.0.0 の対象外。必要が実測されたときに扱う。発火条件: FR-042 に従う】旧文: frontier tier の呼び出しは「学習済み check が存在しない判断種別」と「人間ゲート直前の独立 review」に限定され、機械判断化された判断種別では routing が自動的に下位 tier / 決定的 check へ降格する (effort / model ladder の下方向)。tier や cost を authority・品質の代替として記録・主張することは deny。 | UTV4-BR-022 | V4D-018 | 維持 | Model / Effort Routing (escalateShallowResponse) に降格方向を追加 |
| UTV4-FR-044 | 【2026-11-12 簡素化】reviewer の指摘 (FINDING) には `correctness` / `preference` の別を書く。preference は人間が採るまで non-blocking とし、AI の好みで merge を止めない。選好の deny 昇格は人間の決定を必須とする。判断軸 skill の抽出は作らない。 | UTV4-BR-024 | V4D-019 | 維持 | FR-040 の判断軸面。ハーネス自身とハーネス上のプロダクト双方に適用 |
| UTV4-FR-045 | 【2026-11-12 先送り: 1.0.0 の対象外。必要が実測されたときに扱う。発火条件: FR-042 に従う】旧文: judgement record、calibration 指標、機械判断化された check、判断軸 skill は、ハーネス標準共有機構 (FR-008 のスプレッドシート同期 view と FR-039 の画面モック / プロト製本物) へ generated view として決定的に投影され (生成元 id・revision・digest 列を持つ)、人間はその view から承認 / 差し戻し (admission 経由の書き戻し) を行える。人間可読 view を持たない判断種別・skill は昇格対象にならない。 | UTV4-BR-025 | V4D-019 | 維持 | 原則 6 (二重可読) の判断・学習層への適用。FR-008 / FR-039 の consumer |
| UTV4-FR-046 | 【2026-11-12 簡素化】依存グラフ・画面遷移・ER・チケット図は、必要なときに既存の `src/lint/relation-graph.ts` (mermaid) や AI で生成する。保存・digest 管理・編集の戻しは作らない。ER は DB を持つ consumer のテンプレートに任せる。 | UTV4-BR-026 | V4D-020 | 既存を更新 | 旧文の依存グラフの入力 (PLAN requires / references、責務 × path 行列) を、コードと設計書の依存に替えた (V4D-078) |
| UTV4-FR-047 | 【2026-11-12 撤回】図を保存せず必要なときに生成する (FR-046) ため、図の drift は起きない。シートの往復編集は作らない (FR-008 / FR-009)。 | UTV4-BR-026 | V4D-020 | 維持 | 原則 6 の書き戻し規律と FR-008 の drift 検知を図へ拡張 |
| UTV4-FR-048 | 【2026-11-12 簡素化】設計文書の path を名指す `backflow` Issue (同じ文書の open Issue があれば追記) で下流から上流への還流を扱う。open の間の下流 merge の停止は、`hold` ラベル (FR-037 と同じ仕組み) で行う。改訂下書きの自動作成は作らない。 | UTV4-BR-027 | V4D-021 | 既存を更新 | 旧文の中チケット単位の集約・ticket compiler の再 compile・Reverse 対 PLAN の projection を撤回した |
| UTV4-FR-049 | 【2026-11-12 簡素化】モデルは世代固定の ID で持たず、エイリアス (Claude) / family 名 (Codex) で持ち、起動時に最新へ解決する。catalog に無ければ fail-close し、解決した ID を receipt に記録する (V4D-097)。role の根拠は `src/team/delegation-routing.ts` を単一とし、手書きの subagent 定義は持たない (撤去済み、#1002)。専門性は作業ごとの知識 packet (skill・判断パック・設計抜粋) で表す。provider 定義の生成は作らない。 | UTV4-BR-028 | V4D-022, V4D-097, V4D-098 | 維持 | .claude/agents と delegation-routing の二重 role 体系を解消 |
| UTV4-FR-050 | 【2026-11-12 簡素化】orchestrator (LLM の control lane) は closing authority を持たない。closing は gate (`ut-tdd pr merge`・review custody) だけが持つ。dispatch の engine は作らず、control lane が GitHub と CLI で指揮する。single-provider / standalone でも同じ guard を使う。 | UTV4-BR-028 | V4D-022, V4D-033 | 既存を更新 | 旧文の原子チケット (lease + budget) の dispatch を、3 段のチケットに替えた |
| UTV4-FR-051 | 【2026-11-12 簡素化】blind review の admission 条件 (blind packet は control plane が生成し、author の claim・自己評価・意図・identity・過去 verdict を含まない。author と reviewer は context を共有しない。reviewer は oracle を自ら再実行し反証試行を 1 件以上残す (反証ゼロの PASS は PASS-WEAK)。reviewer の tier は author 以上) を hybrid で必須とする。単一 provider では、2 lane の並走は高影響のときだけとし、back-annotate は FR-042 と一緒に後回しにする。 | UTV4-BR-013 | V4D-023 | 維持 | FR-013 / FR-023 / FR-024 の blind packet を偏見対策として具体化 |
| UTV4-FR-052 | リファクタリングは、機能追加と別の種類のチケット (refactor) で行う。TDD の refactor 工程は、その PR の中で完結してよい。refactor チケットの受入は振る舞いの不変 (既存 oracle が不変、新しい機能 oracle の追加が無い) とする。refactor と機能変更を同じ PR に混ぜることは deny する。退役 (削る作業) も refactor チケットで行う。owner は対象区分の owner とする。 | UTV4-BR-029 | V4D-024 | 既存を更新 | 旧文の原子 / 小 / 中 / 大ごとの責務を撤回した |
| UTV4-FR-053 | 【2026-11-12 簡素化】refactor の発火は、既存の `src/state-db/refactor-candidates.ts` の advisory 一覧を見て、人または AI が refactor Issue を切る。閾値の自動判定と管理知能の下書きは作らない。 | UTV4-BR-029 | V4D-024 | 既存を更新 | 旧文の小 / 中 / 大ごとの扱いを撤回した |
| UTV4-FR-054 | 【2026-11-12 簡素化】実行と検収を分ける。検収の条件は着手前に固める (設計書保護 gate)。検収は実行と別の family が行う。merge lane は author ≠ reviewer ≠ admitter の三者分離とし、admitter (`ut-tdd pr merge`) は receipt (独立 review の verdict・CI generation・exact HEAD) だけを入力にする。admitter による成果物の書き換えは deny する。admission チケットと readiness 3 状態の状態機械は作らず、GitHub の状態 (設計 merge 済み / review PASS / merge 済み) と HEAD からの再検証で代える。 | UTV4-BR-030 | V4D-025, V4D-065, V4D-107 | 既存を更新 | 旧文の「小以上に admission チケットを対で compile、階層別 assignee」を撤回し、実行と検収の対 (T4) に替えた。readiness の 3 状態を加えた (V4D-107) |
| UTV4-FR-055 | 結合テスト (L9) 以上に関わる実装は、author 以外の人間が review する。人間 review の対象は結合面 (契約・境界・結合テスト・状態遷移) とし、内部実装は下位の receipt に委ねる。それ以外の変更は、AI の blind review と別人の admission で閉じてよい。参加人数が 1 のときは、人間 review を AI blind lane (evidence tier を記録) で代える。その場合は self-admission の印と FR-024 の sampling で補う。 | UTV4-BR-030 | V4D-025 | 既存を更新 | 旧文の原子 / 小 / 中ごとの傾斜を、層 (L9 以上) の基準に替えた |
| UTV4-FR-056 | 【2026-11-12 簡素化】画面プロトの工程は、consumer へ配るテンプレートとチェックリストで持つ (#1226): 必須最小 4 要素 (初期画面ルール・inventory / flow・fixture 契約・typed finding)、異常系 fixture、捏造禁止、意味ロジックの Gold ledger。11 種の record・深度 profile のエンジンは作らない。 | UTV4-BR-031 | V4D-026, V4D-039 | 既存を更新 | 旧文の「S4 decision record」を「PoC チケットの判定記録」にした (V4D-054)。UX と FE の連続性 (V4D-039) を screen id の追跡で加えた |
| UTV4-FR-057 | 【2026-11-12 先送り: 1.0.0 の対象外。必要が実測されたときに扱う。発火条件: FR-039 に従う】旧文: 製本点 (a) は fixture 契約・異常系必須セット・screen finding・受入チェックリストが揃った screen id のみを対象とし、欠ける screen id の compile は backflow_required を返す。正常系 fixture のみの画面、本番 schema と異なる mock event、finding が prose のみの画面は製本できない。 | UTV4-BR-031 | V4D-026 | 維持 | AC-051 の前段条件を具体化 |
| UTV4-FR-058 | 要求 / 要件 record は provisional (既定) と frozen の 2 状態を持つ。frozen への遷移は、人間の freeze decision record、または PoC チケットの判定記録 + 人間 ack のみで起こせる。AI lane・管理知能・review verdict による freeze 遷移は deny する。provisional 要求から作ったチケットは provisional_dependency を持ち、要求の改訂時に下書きが作り直される。view / 製本物は provisional と frozen を区別して表示する。freeze は要求 / IR 単位で行う。文書一括 freeze は L3 / L4 owner の明示宣言に限る。AI 間の解釈齟齬は確定ではなく、discrepancy record として上流 owner へ上げる。 | UTV4-BR-032 | V4D-027 | 既存を更新 | 旧文の「S4 confirmed の PoC evidence」と ticket compiler の再 compile を、判定記録と下書きの作り直しに替えた |
| UTV4-FR-059 | 【2026-11-12 簡素化】PoC Issue のテンプレート (FR-017) に期限欄を置き、期限の超過は警告として出す。超過で新規発行は止めない。PoC 期の設定・規約・CI を production path へそのまま引き継がない。 | UTV4-BR-010 | V4D-054, V4D-065, V4D-104 | 既存を更新 | 旧文の scope / budget record 必須と、超過時に S4 decision まで新規発行を止める規則を撤回した |
| UTV4-FR-060 | 【2026-11-12 撤回】管理知能 (別プロセスの Python、F1〜F10) は作らない。control lane (LLM) が GitHub と CLI で指揮し、閉じる権限は gate だけが持つ (FR-050 / FR-054)。再検討の条件: PO の仕分け待ちの Issue が 1 週間で一定数を超えたとき。 | UTV4-BR-033 | V4D-031, V4D-033, V4D-064 | 新規 | 既存の要件に管理知能の論点は無い |
| UTV4-FR-061 | 【2026-11-12 撤回】管理知能を作らないので Python の実装は無く、ADR-001 は TS / Node 一本のままとする。 | UTV4-BR-034 | V4D-079, V4D-083, V4D-085, V4D-087 | 新規 | 既存の要件に実装言語の論点は無い (旧「互換性」節の TS 一本を撤回) |
| UTV4-FR-062 | 【2026-11-12 撤回】言語をまたぐ境界が無いので JSON Schema からの二言語型生成は作らない。記録の schema 版管理は FR-079 が持つ。 | UTV4-BR-034 | V4D-086 | 新規 | 既存の要件に境界 schema の論点は無い |
| UTV4-FR-063 | 【2026-11-12 先送り: 1.0.0 の対象外。必要が実測されたときに扱う。発火条件: 指標 2 (1 チケットあたりの CI・rechain 回数) が基準値 (#947) より悪化したとき】旧文: 管理知能は、並行する作業の着地順を、依存・path の重なり・base の鮮度から導いた提案として出す。提案は導出に使った入力 (依存、重なる path、base の commit) を含む。merge の可否は gate が決める。着地順の提案は merge の条件に入らない。 | UTV4-BR-035 | V4D-034 | 新規 | 既存の要件に merge 順序の論点は無い |
| UTV4-FR-064 | 【2026-11-12 簡素化】CI は検査ごとに独立した単位へ並列分割し、fail-fast を入れて、省略せずに短くする (#1063 / #729)。単位の選択実行は、全回帰との比較で結果が一致すると示されるまで有効にせず、それまでは全単位を回す。単位を選べない変更は全単位を回す (fail-close)。main への merge 後とリリースの前は全単位を回す。単位ごとの結果は exact HEAD に束縛し、分母 (テスト件数) を減らさない。 | UTV4-BR-036 | V4D-034, V4D-069, V4D-101 | 既存を更新 | CI の単位分割 (V4D-101) を、既存の影響導出と「全回帰との一致を示すまで省略しない」規則の上に足した |
| UTV4-FR-065 | 【2026-11-12 簡素化】AT ごとに、検証する要件・依存する path・環境の前提を表に持つ。release のとき、依存 path が変わっていない AT は前回の合格を流用し、それ以外を今回必須とする。環境の前提は実行の前に preflight で確かめる。test-design からの受入 catalog の生成は後回しにする。 | UTV4-BR-037 | V4D-070 | 新規 | 既存の要件に受入の事前宣言の論点は無い |
| UTV4-FR-066 | 【2026-11-12 先送り: 1.0.0 の対象外。必要が実測されたときに扱う。発火条件: consumer が層の意味で迷う報告が出たとき、または L11 総合レビューが律速だと実測されたとき (層番号の振り直しは 1.0.0 では行わない)】旧文: v4 の右腕は次の層で運用する: L7 単体テスト / L8 仕様書作成 (as-built) / L9 結合テスト / L10 システムテスト / L11 UX 検証 / L12 受入 (UAT を含む) / L13 デプロイ後検証 / L14 運用検証。L13 と L14 は v3.1 から変えない。左右の対は L5 ↔ L9、L4 ↔ L10 とする。L8 は L4〜L6 の設計全体と対にする。v3.1 の L11 総合レビューは、各層の gate へ分ける。右側の設計の置き場の層名は、この構成に合わせる。v3 の層番号は今は振り直さず、v4 への切り替えのときに一括で移す。 | UTV4-BR-039 | V4D-073, V4D-074 | 新規 | 既存の要件に右腕の層構成の論点は無い (旧「互換性」節の L0-L14 継承を撤回) |
| UTV4-FR-067 | 【2026-11-12 簡素化】コードを正として as-built 仕様書を作り、L4〜L6 の設計と突き合わせて食い違いを一覧にする。これはチケットごとの gate ではなく、リリース前の照合として回す。食い違いは 1 件ずつ、「実装を直す」「設計へ backfill する」「設計判断へ上げる」のどれか 1 つへ振り分け、振り分けは作者と別の family が行う。食い違いが 0 件か全件振り分け済みであることを、リリースの条件とする。 | UTV4-BR-040, UTV4-BR-038 | V4D-045, V4D-075, V4D-078 | 新規 | 既存の要件に as-built 照合の論点は無い |
| UTV4-FR-068 | 【2026-11-12 撤回】右腕の定常工程の engine は作らない。リリース前の設計・実装照合 (FR-067) と振る舞い不変の refactor (FR-052) に吸収し、ロードマップの ⑤ / ⑨ が 1 周ずつ回す。 | UTV4-BR-041 | V4D-047, V4D-049, V4D-050 | 新規 | 既存の要件に右腕の定常化の論点は無い |
| UTV4-FR-069 | 【2026-11-12 先送り: 1.0.0 の対象外。必要が実測されたときに扱う。発火条件: FR-066 に従う (重複する L6 テンプレート 2 本の統合は通常の refactor Issue で先にやってよい)】旧文: v4 の層構成への切り替えは、テンプレート・skill (決定時点 44 件)・src (同 16 件)・gate・lint の修正がすべて入ったときだけ完了にする。廃止した層番号と工程名の残存が 0 件であることを grep / lint で確かめる。docs/templates/vmodel/ は廃止する。設計テンプレートは docs/templates/design/、テスト設計テンプレートは docs/templates/test-design/ に置く。重複する L6 のテンプレート 2 本は 1 本にする。consumer に配るテンプレートの path の変更は、canary で確かめる。 | UTV4-BR-042 | V4D-074, V4D-076, V4D-077 | 新規 | 既存の要件に層の切り替えの完了条件の論点は無い |
| UTV4-FR-070 | 【2026-11-12 先送り: 1.0.0 の対象外。必要が実測されたときに扱う。発火条件: Pack に dev 物が混入する、または必要物が欠ける事故が繰り返したとき (ディレクトリ再編は 1.0.0 では行わない。置き場所の規則は `repository-structure.md` で持つ)】旧文: リポジトリの最上位は product/ (配る物) と dev/ (配らない物) に分ける。product/ の中は kernel/ engine/ intelligence/ (Python) contracts/ parts/ に分ける。チケット・受領 (receipt)・設計の版などの記録の置き場は、置き場所の registry に 1 か所ずつ登録する。チケット正本の置き場は dev/records/tickets/ とする (段階 3 の切替前は現構造の等価 path)。registry に無い場所への書き込みは guard が deny し、正しい path を示す。doctor の巡回は registry との外れを報告する (当面は報告だけで、fail-close にしない)。 | UTV4-BR-043 | V4D-030, V4D-031, V4D-080, V4D-081, V4D-106 | 新規 | 既存の要件に置き場所の論点は無い。チケット正本の置き場は dev/records/tickets/ に決まった (旧 U-6、V4D-106 で解消) |
| UTV4-FR-071 | このリポジトリの開発では、インストール済みのリリース harness (.ut-tdd/ の下) が規律 (hook・gate・guard) を判定する。開発中の product/ のコードは、自分自身の規律の判定に使わない。置き場所の移行は、置き場所の L4 設計が定める順序で行う。 | UTV4-BR-044 | V4D-080, V4D-081 | 新規 | 既存の要件に内部デプロイの論点は無い |
| UTV4-FR-072 | 【2026-11-12 簡素化】token・費用・所要時間は、provider の請求画面と GitHub の事実 (#947 の指標) から測る。FR-042 の発火条件の判断材料として月 1 回の手測りで足りる。専用の DB テーブルと常時の取り込みは作らない。 | UTV4-BR-045 | V4D-048 | 新規 | 既存の要件に費用記録の論点は無い |
| UTV4-FR-073 | 【2026-11-12 撤回】WBS エンジンは作らない。control lane が設計文書から Issue を切る (ロードマップ自体も機構なしで分解された、#769)。 | UTV4-BR-046 | V4D-042, V4D-043, V4D-067 | 新規 | 既存の要件に作業分解の論点は無い |
| UTV4-FR-074 | 【2026-11-12 簡素化】外部ライブラリは登録簿で管理する。登録簿に無い依存は lint が fail-close する。登録のとき、ライセンス・脆弱性・保守状況を審査し、ライセンスの承認は PO が行う (高影響境界)。登録済みの依存も定期的に検査し直す。v4 の補強を目的とした OSS を依存にすることは認めない (V4D-096)。社内部品カタログと社内ライブラリへの昇格は後回しにする (#871)。 | UTV4-BR-047 | V4D-062, V4D-064 | 新規 | 既存の要件に依存と部品の管理の論点は無い |
| UTV4-FR-075 | 【2026-11-12 簡素化】メンバーと権限は、GitHub team と members 表 (人 → 役割・担当区分) で持つ。操作者・PC の識別 (#1327) をこの表に含め、複数人運用の時点 (チーム投入の前) で入れる。権限 (authorization) を変える実装は、着手前の PO 承認記録を参照する (高影響境界)。 | UTV4-BR-048, UTV4-BR-001 | V4D-038, V4D-059, V4D-064, V4D-084 | 新規 | 既存の要件に利用者・権限の registry の論点は無い。authorization に触れるため高影響境界 |
| UTV4-FR-076 | 【2026-11-12 撤回】設計判断の記録の 8 原則の引用を必須にする lint は作らない (形式的になりやすい)。「論点ごとに 1 つ・同じ ID を更新・経緯は git」は V4D-087 の書き方の規則で足りる。 | UTV4-BR-049 | V4D-058, V4D-085, V4D-087 | 新規 | 既存の要件に判定基準と記録の一意性の論点は無い |
| UTV4-FR-077 | ハーネス自身へのレッドチーム検証を持つ。攻撃シナリオは、guard・hook・review custody・merge gate のすり抜け、prompt injection (issue・PR・メモリ・ファイルに埋め込まれた指示)、供給網 (依存・Pack・template の改ざん) を含む。シナリオは、脅威モデル (L4 security 設計) の脅威ごとに 1 つ以上を持つ。攻撃役は、対象を書いた family とは別の family が担う。すり抜けに成功したシナリオは、塞ぐ機構とその回帰テストが入るまで、リリースの blocker として残る。シナリオは回帰テストとして残し、guard や hook を変える PR で再実行する。 | UTV4-BR-050 | V4D-100 | 新規 | 既存の要件に、攻撃して確かめる論点は無い。PLAN-L6-53 (敵対検証機構、draft) は review の敵対検証で、システムへの攻撃ではない |

| UTV4-FR-078 | 【2026-11-12 簡素化】製品の攻撃検証は、テンプレートとリリース時のチェック欄で行う (ツールは作らない)。高影響境界 (認証・認可・決済・個人情報・秘密情報) に触れる製品だけ、攻撃検証の結果 (攻撃シナリオ・対象の revision・成否・塞いだ機構への参照) の記録へのリンクが無ければリリースの gate を通らない。攻撃検証は本番ではなく検証用の環境だけで行い、攻撃役は成果物を書いた family とは別の family が担う。 | UTV4-BR-050 | V4D-100 | 新規 | 既存の要件に、製品への攻撃検証の論点は無い。Pack で配る工程と template に入る |
| UTV4-FR-079 | 構造化正本の記録 (チケット・receipt・verdict・設計の版など) は schema_id・readable_versions・writable_version・migration_ref を持つ。reader は readable_versions に含まれない版の記録を読まず、型付きの finding で止める (黙って読み替えない)。writer は writable_version の版だけを書く。writable_version の引き上げは migration_ref が指す移行を通し、移行前の記録は戻せる形で残す。consumer の更新は 1 本の手順にし、更新の前に、導入済みの全記録が新しい版の readable_versions に入るかを検査する。rollback の限界を明示する: 新しい writable_version で書いた記録が残っている間は、その版を読めない旧版へ rollback できない。この rollback は更新の前に拒否する。旧版の readable_versions に入る範囲か、移行前に退避した記録から戻せる範囲だけ rollback を許す。 | UTV4-BR-014 | V4D-107 | 新規 | 既存の要件に版互換と rollback の限界の論点は無い。#534 / #535 の版互換の論点。共通 JSON の reader / writer / validator は実装方式なので要件に入れない (V4D-107) |
| UTV4-FR-080 | 派生する一覧 (要件の trace 表・受入 catalog・進捗の一覧・スプレッドシート / Office / Google 文書の書き出しなど、正本から作れる一覧や表) は手で編集しない。再生成のコマンドを 1 本にし、CI は「再生成しても差分が出ない」ことを確かめる (差分があれば fail する)。派生物は生成元 identity と「編集禁止」を持つ。 | UTV4-BR-006 | V4D-108 | 新規 | 2026-11-12 に追加 (#1005)。FR-008 の一方向の書き出しの前提を、一覧すべてへ広げた。既存の要件に、派生物の再生成と差分 0 の論点は無い |

## 要件化不要

どの要求も 1 件以上の要件で実現している。要件化不要の要求は無い。

| 要求 | 理由 |
|---|---|

## 要件で未確定

2026-11-12 の見直しで、U-4 と U-6 の解消の一部が変わった。U-6 (チケット正本の置き場) は、チケットの正本を GitHub Issue にしたので、dev/records/tickets/ を作らない (FR-004、FR-070 の先送り)。U-1 (証跡ログの置き場) の解消は変えず、receipt の clone 間共有は FR-006 に残す。以下の表は、解消した時点の記述のまま残す。

この節の未確定は 0 件になった。U-1 / U-2 / U-3 / U-4 / U-6 は、PO の決定ではなく、既存契約から導いた技術判断で解消した (Issue #530 のコメント 6572762440、V4D-102〜106)。解消した行は、選択肢と採った案の両方を残す。
U-5 (#591 の 18 件のどれを直すか) は V4D-035 で解消した。18 件すべてを v4 で直す (UTV4-FR-006 / 007 / 013)。U-5 の番号は再利用しない。中立な要件は、どの選択肢を採っても成り立つ観測条件である。

| 項目 | 関係する要件 | 中立な要件 (観測できる条件) | 選択肢と、解消で採った案 | 根拠 (V4D) |
|---|---|---|---|---|
| U-1 証跡ログを git の中に置くか外に置くか (解消) | UTV4-FR-006 | 証跡の本体は 1 件ごとに ID で引ける。参照側が持つ digest と本体の digest の一致を機械で確かめられる。 | (a) 証跡ログを git で tracked にする / (b) git の外 (ローカルの store など) に置き、ID と digest だけを tracked にする / (c) 種類で分ける (review receipt は tracked、生のセッションログは外) → **解消**: (c) 種類で分ける。review receipt / verdict は origin の refs/ut-tdd/receipts/ の commit 内 JSON、生のセッションログは git の外、参照側は ID と digest だけを持つ。main は required check が admin にも強制され直接 push できず、receipt は exact head に束縛されるので PR にも入れられないため。条件: refs/ut-tdd/receipts/ の作成・競合・別 PC 取得を実機で確かめるまで、複数 PC の merge は完成扱いにしない。導入先で custom ref が拒否されるときは同一 PC 制約を残す。team-multi-pc-multi-repo.md §4.2 の留保と repository-placement.md の「追跡する」の範囲は、pair-freeze と非著者 review を通して改訂する | V4D-048, V4D-060, V4D-063, V4D-102 |
| U-2 「消す対象」の列と最小のチケット構造 (解消) | UTV4-FR-004, UTV4-FR-025 | 新しく作る変更ごとに、削る対象 (または「無し」とその理由) を機械で読める。 | (a) チケットに 4 つ目の field として持たせる / (b) PR の本文または receipt に持たせる / (c) 設計書の成果物所有の差分から機械で出す → **解消**: (c) 設計書の成果物所有の差分から機械で出す。「無し」とその理由だけ PR receipt の field に置く。チケットの field は V4D-056 の 3 つのまま増やさない | V4D-036, V4D-056, V4D-103 |
| U-3 PoC の規模・期限の上限と超過の扱いを、discovery チケットへ引き継ぐか (解消) | UTV4-FR-059 | PoC チケットが上限を持つ場合、その超過は機械で検出され、finding として出る。 | (a) discovery の検収雛形に規模と期限を必須にし、超過で新規発行を止める (旧 V4D-028 の中身、現在 superseded) / (b) 期限だけを持たせ、超過は警告にする / (c) 上限を持たせず、最小のチケット構造のままにする → **解消**: (b) 期限だけを discovery の検収雛形に持たせ、超過は finding (警告) にする。発行は止めない (発行停止の機構は V4D-054 で撤廃済み) | V4D-054, V4D-065, V4D-104 |
| U-4 G1 / G3 / G4 に ops の役割を足すか (#770) (解消) | UTV4-FR-002 | G1 / G3 / G4 の各 gate に参加する役割の集合が、工程 × 役割の表から機械で読める。 | (a) 3 つの gate すべてに ops を足す / (b) 足さない / (c) gate ごとに個別に決める → **解消**: (b) 足さない。メンバー registry に ops の役割が実在した時に、RACI の C 列へ足す (ops の役割の定義は concept v3.1 / v4.0 に無い) | V4D-043, V4D-105 |
| U-6 チケット正本の置き場 (docs/tasks/*.yaml か、product / dev の配置か) (解消) | UTV4-FR-004, UTV4-FR-070 | チケット正本の置き場は 1 か所で、置き場所の registry に登録されている。そこ以外へのチケットの書き込みは guard が止める。 | (a) docs/tasks/*.yaml (旧 V4D-053 の案、現在 superseded) / (b) dev/ の下 / (c) 記録の置き場 (.ut-tdd/ の下など) → **解消**: (b) dev/ の下の dev/records/tickets/ を registry に登録する。段階 3 の切替前は現構造の等価 path を使う (.ut-tdd/ は追跡しないので、tracked ファイルとする UTV4-FR-004 と両立しない) | V4D-055, V4D-080, V4D-081, V4D-106 |

## 廃止した要件

2026-11-12 の見直しで撤回した 15 件 (FR-007 / 016 / 020 / 021 / 022 / 030 / 036 / 041 / 047 / 060 / 061 / 062 / 068 / 073 / 076) は、ID を消さずに要件候補表へ「【2026-11-12 撤回】」と 1 行の理由で残した。出典は #1005 のコメント 6822862705 (V4D-108)。

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
- v4 の右腕は次のとおりとする (V4D-073、V4D-075)。ただし 2026-11-12 の見直しで、層番号の振り直し (FR-066 / FR-069) は 1.0.0 の対象外にした。当面は v3.1 の層番号のまま運用し、as-built 照合 (FR-067) は番号を変えずにリリース前の照合として入れる:
  - L7 単体テスト
  - L8 as-built 仕様書。L4〜L6 の設計との照合による検証の工程とする。
  - L9 結合テスト。L5 と対にする。
  - L10 システムテスト。L4 と対にする。
  - L11 UX 検証
  - L12 受入 (UAT を含む)
  - L13 / L14 は v3.1 から変えない。
- v3.1 の L11 総合レビューは、各層の gate へ分ける。層番号の振り直しは v4 への切り替えのときに一括で行う (V4D-073)。
- 実装言語: 2026-11-12 の見直しで、管理知能 (別プロセスの Python) は作らないことにした (FR-060 / 061 / 062 を撤回)。実装言語は引き続き TypeScript / Node 一本とする。旧記述 (管理知能は Python、V4D-079) は、作らないので適用しない。
- 言語の境界の JSON Schema 生成は作らない (FR-062 撤回)。記録の schema 版管理は FR-079 が持つ。
- ADR-001 は、この PR では変更しない。決定 4 (管理知能は Python) が「作らない」と食い違うので、ADR の改訂は別に扱う (#1005 のコメント 6822862705 の「次の手」)。
- PLAN は v4 への切り替えで全面廃止し、既存分は凍結する。切り替えまでは PLAN 上の gate と CI を外さない (V4D-078)。
- route のモードは、チケットの種類 (Forward / Reverse / Scrum を除く) へ移る (V4D-065)。
- fail-close、cross-family review、Pack 配布契約は継承する。
- 本書は新しい engine・台帳・DB authority を導入しない。harness.db は正本ファイルから作り直せる索引である (V4D-060)。
