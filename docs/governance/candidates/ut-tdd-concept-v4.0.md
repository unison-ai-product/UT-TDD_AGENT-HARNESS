---
document_id: UT-TDD-CONCEPT-V4
concept_version: "4.0"
status: draft_candidate
supersedes_after_approval: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
source_concept: 参照元の個人開発ハーネス構想 v4.0 候補 (非公開、PO 提示 2026-09-04)
evidence_baseline: b27720644a7589dc568c76cad7eb5e068654c824
plan: docs/plans/PLAN-L1-09-ut-tdd-concept-v4-candidates.md
---

# UT-TDD Agent Harness 構想書 v4.0 候補 (チーム開発版 Verified Change Harness)

## Authority 境界

本書は **未承認候補**であり、現行 concept v3.1 と要件定義書 v1.2 を置換しない。L1 要求候補
(`ut-tdd-concept-v4-requests.md`)、L3 要件候補 (`ut-tdd-concept-v4-requirements.md`)、L10 受入候補
(`ut-tdd-concept-v4-acceptance.md`) への分解、PO の plan 固有承認、cross-review、main 反映後の再読が完了した
場合だけ v4.0 へ昇格する。それまで CLAUDE.md の読込順、`docs/governance/README.md`、adapter、doctor gate は
v3.1 を current authority として参照し続ける。本書だけを根拠に runtime、CLI、`.ut-tdd/` state、DB projection、
rename を変更しない。

## 一文定義

UT-TDD Agent Harness は、**複数の人間と複数の AI runtime が並行して働くチーム開発**において、人間の意図を
型付き変更契約へコンパイルし、作業を責務単位のチケットとして配り、反証可能な証拠で変更を閉じ、その経験を
人間とハーネス双方の改善へ還流する、human-on-the-loop 前提の Verified Change Harness である。

## 出自と v3.1 からの差分

v3.1 は V-model L0-L14、4 artifact + 3 段階 freeze、9-mode、配線、5 役割の責任二極化を定義した。運用実測
(2026-06〜09) で残った問題は次の 3 つである。

1. **正本の可読性が片側に偏る**: markdown 正本は人間には読めるが AI と機械には lossy で、typed spec (U8-U12) で
   埋め込んだ部分以外は検出・集計・変換の対象にならない。逆に harness.db は機械には読めるが人間には見えない。
2. **チームの並行作業単位が無い**: PLAN 番号は手で空きを探し、worktree は放置され、review request は memoryId
   で分裂する (Issue #480 / #384 / #426 / #421)。作業の所有者 (owner) と lease が契約に存在しない。
3. **人間と AI の責務境界が層別に定義されていない**: v3.1 §9 は役割 × mode の表だが、「どの層で人間が確定し、
   どの層で AI が自律し、どこで人間が介入するか」が無いため、PO への反射的エスカレーションと AI の越権が
   両方起きる (CLAUDE.md 2026-08-05 ルールで運用補正中)。

本書は PO が提示した個人開発ハーネスの構想 v4.0 候補 (Verified Change Operating System) から、**チーム開発に必要な部分だけ**を翻案する。参照元の 8 Plane のうち、Sovereignty / Change Contract Compiler /
Control Plane / Assurance Kernel / Evidence Ledger / Adaptation を採り、Execution Plane の provider 非依存 lane と
Release / Lifecycle Plane は既存の tier-router / Pack 配布 (PLAN-L6-63 系) へ写像するに留める。参照元の
Python 恒久意味コアは採らない (ADR-001: TypeScript/Node 一本)。

## 北極星

人間は価値・要求・体験・不可逆作用の許可・authority 候補の承認・チーム内の責務配分を所有する。ハーネスは
意図の構造化、責務分解、チケット生成、bounded execution、検証、merge、証拠の閉包、改善候補の生成を所有する。
会話の継続、逐次指示、進捗の手作業更新を完了条件にしない。

## 7 原則

1. **Human Sovereignty (層別 human-on-the-loop)**: request / selection / approval / decision / disposition を分離し、
   source・actor・target・scope・revision へ束縛する。人間の関与点は層と作用の種類で決まり、会話や memory から
   approval を生成しない。
2. **Contract Compilation**: 意図から Requirement IR → 設計 → 責務 → workflow → 検証義務 → release slice を
   一方向に導出する。Issue 本文、候補、互換入力、unknown から current identity を直接生成しない。
3. **Responsibility First (exactly-one owner)**: actionable behavior、チケット、finding、learning asset は
   exactly-one primary owner を持つ。owner は人間ユーザーまたは logical lane であり、provider 名ではない。
4. **Bounded Multi-Actor Execution**: 人間・AI を問わず、作業者を assignment (チケット)、branch / worktree、
   base / HEAD、lease / fence、budget、allowed path へ束縛する。lease の無い書き込みは衝突として扱う。
5. **Evidence Closure**: 完了は subject identity・実体・oracle・独立 review・CI generation・main read-after の
   exact join で判定する。宣言、marker、path 存在、自己申告では成立しない (v3.1 §2.1.2 の attacker/defender 分離を継承)。
6. **Dual-Readable Truth (二重可読な正本)**: 正本形式は artifact の主読者で決める。人間が判断・承認するために
   読む narrative は markdown 正本 (typed spec block で機械可読部を埋め込む)。機械が生成・集計・遷移させる record
   (チケット / schedule / verdict / receipt / evidence) は 1 record = 1 JSON/YAML file の構造化正本とし、
   markdown・spreadsheet・ダッシュボードはすべて generated view とする。双方向書き戻しは構造化正本に対してのみ
   admission 経由で許し、markdown 正本への機械書き戻しは行わない。
7. **Controlled Adaptation (人間とハーネスへの二方向還流)**: FLAG・incident・運用観測は直接 authority を書き換えず、
   改善候補として既存 V-model (Reverse / Requirement Re-entry) へ戻す。同じ候補を人間可読 digest としてチームへも
   配る。単一 episode で規則や機構へ昇格しない。

## 6 Plane 構造 (チーム開発版)

### 1. Sovereignty Plane (主権面)

L0 企画・L1 要求・L2 モック・L3 候補承認・不可逆作用・architecture / release decision・**チーム内責務配分**を扱う。
人間の関与点は次の層別境界表で固定する (要件候補 UTV4-FR-001)。

| 層 | 人間 | AI | 介入点 |
|---|---|---|---|
| L0-L2 | 確定 (企画・要求・体験) | 起草補助・候補提示 | 常時 |
| L3 | 承認 (G1/G3) | 要件起草・compile | 承認ゲート |
| L4-L6 | 設計判断の採択 (trade-off 実在時のみ) | 設計・pair-freeze | advisor 後の未解決 trade-off、高影響境界 |
| L7 | チケット割当の確認 | 実装・test・PR | lease 衝突、scope 逸脱、escalation 境界 |
| L8-L12 | 受入 (G11/G12) | 検証・証拠束縛 | 受入ゲート |
| L13-L14 | 運用判断・KPI 評価 | 観測・改善候補生成 | 改善候補の採否 |

### 2. Change Contract Compiler (変更契約面)

Requirement IR、設計 registry、責務 graph、workflow identity (routeFiling SSoT)、V-pair、検証義務、
**チケット (work item record)**、evidence claim、release slice を型付き契約へコンパイルする。
既存 typed spec IR (VUP-REQ-03、U8-U12) と Forward FSM / PLAN Asset v2 (VUP-REQ-09) を継承し、チケットと
schedule を新たな record 種別として追加する。

### 3. Control Plane (統制面・チーム協調)

queue、assignment (チケット)、owner、branch / worktree、base / HEAD、lease / fence、heartbeat、budget、
provider capability、PR / review / CI state を管理する。**人間ユーザーも AI lane も同じ assignment model に載る**。
GitHub Issue / Projects は read 側 projection (一方向同期) であり、GitHub 側の編集は Issue admission 経由で
のみ正本へ戻る (docs/governance/github-issue-hierarchy.md と U23 Execution Ledger を継承・拡張)。
起動時は文書を順不同で読ませず、authority root・Requirement IR・V-pair・責務・assignment・HEAD・lease・
runtime capability・approval 境界を解決した startup packet を決定的に生成する。

### 4. Assurance Kernel (保証中核)

schema・identity・digest・V-pair・PLAN scope・dependency・CI・Git state・DB replay・release composition の
機械検証と、意味差・隠れた前提・反例の独立 semantic review (cross-family blind review) を AND 条件とする。
v3.1 の doctor / plan lint / review custody / exact-HEAD receipt をそのまま Kernel とする。

### 5. Evidence and State Ledger (証拠・状態台帳)

| 対象 | 役割 | 正本形式 |
|---|---|---|
| Requirement / 設計 / Policy | 意味 authority | markdown + typed spec block |
| PLAN | atomic change contract | markdown 本文 + record 化 frontmatter (段階移行、Reverse 対で扱う) |
| チケット / schedule / verdict / receipt / evidence | 境界付き record | 1 record = 1 JSON/YAML file |
| Git commit / tree | 成果物の事実 | Git |
| GitHub / event journal | 協調・実行の事実 | projection |
| harness.db | 再構築可能な query projection | DB |
| Memory | 境界付き連絡・履歴 pointer | `.ut-tdd/memory/` |
| 人間向け view (表・doc・ダッシュボード) | generated view | 生成物 (編集禁止 + 生成元 + hash 照合) |

evidence は claimed → located → identity-bound → content-verified → execution-verified → independently-reviewed →
current へ進み、superseded / expired / retracted を履歴として保持する。

### 6. Adaptation Plane (適応面・二方向還流)

FLAG 類型、incident、運用観測、外部技術変化は改善候補 (proposal / evidence / delta) だけを生成し、Reverse /
Requirement Re-entry から既存 workflow へ戻す。同時に人間向け digest (generated view) としてチームへ配り、
ナレッジをハーネス改善と人間の学習の両方へ還流する (Issue #303 / #305 / #413 を継承)。

## 参照元構想からの追加採用 4 領域 (PO 指示 2026-09-04)

PO は 2 大要求 (A / B) に加えて、参照元の個人開発ハーネス構想から次の 4 領域を部分採用する意向を示した。
いずれも 6 Plane のいずれかに写像され、新しい Plane や engine を追加しない。

| 領域 | 写像先 Plane | 採る骨格 | 採らない |
|---|---|---|---|
| C. 上流要求エンジン | Sovereignty → Change Contract Compiler | L1 intake (人間 markdown) → L2 discovery (append-only event) → L3 typed IR compile → 人間承認 freeze。AI は未確定値を補完しない | 別 requirement engine、Issue / DB の意味正本化 |
| D. PoC / プロトタイプ作成 | Assurance Kernel (case-driven model) | Discovery PoC を production 工程と別 axis で識別、S3 verified ≠ terminal、S4 decision record 必須、prototype 反応の構造化還元 | PoC 成果の production への無審査昇格 |
| E. ハーネスメモリの見直し | Evidence and State Ledger → Adaptation | captured → canonicalized → retired の lifecycle、責務 owner の学習資産、失効 / 矛盾 / 再検証状態 | memory を進捗・正本・承認の代替にすること |
| F. スキル / ナレッジ管理新体制 | Adaptation → Control Plane | typed applicability registry、最小 packet の決定的 compile、firing telemetry と可逆 quarantine、shadow + 測定 + 独立 review による昇格 | 全 skill 一括注入、削除による整理、単一 episode 昇格 |

要求・要件・受入への降下は UTV4-BR-009〜012 / UTV4-FR-015〜022 / UTV4-AC-024〜031。

## 正規情報 flow

~~~text
人の意図 / 運用観測 / 外部変化
→ 型付き受付 (request record)
→ Requirement / 設計候補 → 必要箇所での human approval (層別境界表)
→ Requirement IR / 設計 registry
→ 責務 / workflow / V-pair / risk
→ チケット (assignment record、exactly-one owner、lease)
→ 境界付き実行 (人間または AI lane)
→ 成果物 + test + evidence claim + PR
→ CI + doctor + 独立 review (exact HEAD)
→ merge + release 適格性
→ 観測 → 改善候補 → 人間向け digest / Requirement Re-entry
~~~

## システム不変条件

1. canonical authority より先に runtime behavior を current 化しない。
2. チケット・finding・learning asset は exactly-one primary owner を持つ。
3. provenance の無い human authority claim を生成しない (memory、session summary、AI 解釈から approval を作らない)。
4. lease の無い書き込み、owner の無いチケット、HEAD 未解決の作業者を起動しない。
5. author runtime の内部 review を独立 review へ昇格しない。wrong HEAD の review を再利用しない。
6. generated view を編集して正本へ戻さない。書き戻しは構造化正本への admission 経由のみ。
7. unknown を none / unchanged / healthy / green へ変換しない。
8. 単一 episode で規則や機構へ昇格しない。高価な監査を admission なしで起動しない。
9. 人間の介入点を層別境界表の外へ増やさない (反射的エスカレーション禁止) し、表の内側を AI が越権しない。

## v3.1 資産の移行

L0-L14 と正規 V-pair、Forward / Reverse / Recovery、9-mode と routeFiling SSoT、fail-close、cross-family
review、TypeScript/Node 一本 (ADR-001)、Pack 配布 (PLAN-L6-63 系) は Kernel / Control Plane へ継承する。
§9 の 5 役割は Sovereignty Plane の層別境界表と統合する。旧 Bun runtime、personal legacy path、memory 中心の
継続、宣言のみの evidence は current identity として再出力しない。

## 非目標

prompt 集、persona 集、multi-agent chat room、全会話保存、Issue を意味正本にする project manager、DB を意味正本に
する workflow engine、latest model 自動追従器ではない。完全自動を理由に human authority を AI へ移さない。
951 PLAN の一括 JSON 化は行わない (record 化は新規種別から段階導入)。

## 昇格条件

1. v3.1 との差分を L1 要求候補へ materialize する。
2. 原則を L3 要件候補へ分割し、L10 受入候補 (positive / negative oracle) を作る。
3. 既存 owner (VUP-REQ-01〜10、U23、BR-01〜08) との重複・矛盾・未実装主張を検査する。
4. PO の plan 固有承認を typed provenance へ束縛する。
5. concept v4.0 を `docs/governance/` へ昇格し、v3.1 を archive へ降格、CLAUDE.md / AGENTS.md / README /
   repository-structure の参照を一方向更新する (rule-drift 対応)。
6. L1 delta (VUP-REQ-11〜) を PLAN-L1 系で起こし、charter PLAN-L0-01 §4 に後続テーマを追加する。
