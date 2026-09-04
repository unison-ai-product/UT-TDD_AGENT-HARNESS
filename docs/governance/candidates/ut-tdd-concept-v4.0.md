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

思想としては **人間ゲート付きの分散コンピューティング** に近い: 作業は入れ子のチケット (大 → 中 → 小 → 原子) として
切り出され、lease を持つ actor (人間または AI lane) へ分散実行され、合流点のゲートで人間が収束を判断する。
正本は 1 枚に集約せず責務ごとに分散して置き、人間が俯瞰するときは生成 view (スプレッドシート) で読む。
「1 枚にまとまる要求・要件」は品質を持たない、という前提を採る。

目指す到達点は **高価な AI に依存せず、人間と AI が品質を守りながら開発できる** ことである。そのためハーネスは
LLM の判断 (review verdict / finding / advisor 決定 / gate 判定) を使い捨てにせず、入力・結論・その後の結果を
judgement record として蓄積し、繰り返し現れる判断を安価なモデルの分類器や決定的 check へ段階的に機械判断化する
(自己学習型ハーネス)。判断軸は良否 (契約に対する正誤) だけでなく **選好** — 開発されたプロダクトが人間にとって
使いやすいこと、そして AI が裏側で働いても壊しにくいシステムであること — を含み、この判断軸を実録から skill として
蓄積する。

## 7 原則

1. **Human Sovereignty (層別 human-on-the-loop)**: request / selection / approval / decision / disposition を分離し、
   source・actor・target・scope・revision へ束縛する。人間の関与点は層と作用の種類で決まり、会話や memory から
   approval を生成しない。
2. **Contract Compilation**: 意図から Requirement IR → 設計 → 責務 → workflow → 検証義務 → release slice を
   一方向に導出する。Issue 本文、候補、互換入力、unknown から current identity を直接生成しない。
3. **Responsibility First (exactly-one owner)**: actionable behavior、チケット、finding、learning asset は
   exactly-one primary owner を持つ。owner は人間ユーザーまたは logical lane であり、provider 名ではない。
4. **Bounded Multi-Actor Execution**: 人間・AI を問わず、作業者を assignment (チケット)、branch / worktree、 人数は record の値であり工程の形ではない: 1 人でもチケットと record を省かず、増減は発行と lease 移転だけで行う (人数不変性)。並行 AI 開発ではチケットは機械が compile し、人は batch で admission する。 チケットは大・中・小・原子の 4 階層で入れ子にし、原子だけが lease を持つ。
   base / HEAD、lease / fence、budget、allowed path へ束縛する。lease の無い書き込みは衝突として扱う。
5. **Evidence Closure**: 完了は subject identity・実体・oracle・独立 review・CI generation・main read-after の
   exact join で判定する。宣言、marker、path 存在、自己申告では成立しない (v3.1 §2.1.2 の attacker/defender 分離を継承)。
6. **Dual-Readable Truth (二重可読な正本)**: 正本形式は artifact の主読者で決める。人間が判断・承認するために 正本は分散させる (責務 / record ごとに 1 file)。人間の俯瞰は 1 枚の文書ではなく、要求・要件・設計を同期した **スプレッドシート view (必須)** で行う。
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

| 層 | 人間 | AI | 介入点 | owner cardinality |
|---|---|---|---|---|
| L0-L2 | 確定 (企画・要求・体験)。PoC / 画面プロトの反応を出す | 起草補助・候補提示・プロト作成 | 常時 | 文書単位 1 名 (人間)。PoC / 画面プロトは初期画面ルール freeze 後にチケット単位 1 名で分担 |
| L3 | 承認 (G1/G3)。要件を 1 名がまとめる | 要件起草・compile | 承認ゲート | 文書単位 1 名 (人間、compile と freeze の責任) |
| L4 | 基本設計を 1 名がまとめ、設計判断を採択 | 設計案・trade-off 提示 | advisor 後の未解決 trade-off、高影響境界 | 文書単位 1 名 (人間)。提案は誰でも、採択・統合は owner |
| L5-L6 | 設計判断の採択 (trade-off 実在時のみ) | 詳細設計・仕様・pair-freeze | 同上 | チケット単位 1 名 (人間または AI lane) |
| L7 | チケット割当の確認 | 実装・test・PR | lease 衝突、scope 逸脱、escalation 境界 | チケット単位 1 名 (AI lane 可) |
| L8-L12 | 受入 (G11/G12) | 検証・証拠束縛 | 受入ゲート | 検証チケット単位 1 名 (author と別) |
| L13-L14 | 運用判断・KPI 評価 | 観測・改善候補生成 | 改善候補の採否 | 運用 owner 1 名 |

### 2. Change Contract Compiler (変更契約面)

Requirement IR、設計 registry、責務 graph、workflow identity (routeFiling SSoT)、V-pair、検証義務、
**チケット (work item record)**、evidence claim、release slice を型付き契約へコンパイルする。
既存 typed spec IR (VUP-REQ-03、U8-U12) と Forward FSM / PLAN Asset v2 (VUP-REQ-09) を継承し、チケットと
schedule を新たな record 種別として追加する。

### 3. Control Plane (統制面・チーム協調)

統括 owner 1 名 (program owner、人間) が、チケット・PR・CI・review・merge から生成される進捗 projection を見て判断する: 発散区間の開始 / 終了、合流点の owner 指名と takeover 承認、再集計上限超過の差し戻し先、リリース切り分け、WIP 上限とキャパシティ配分、blocked チケットの escalation。進捗を手で更新する層ではなく判断だけを持つ層である。

チケットは **既定で機械が compile** する: L4 基本設計の typed block (責務 × path × 依存の行列) から詳細設計・仕様・実装チケットと合流点の統合チケットを、L2 の screen id / 仮説 id から画面プロト・PoC チケットを、admission receipt から検証チケットを生成する。人は個票ではなく batch 単位で admission し、AI lane への割当は routing policy で自動、人間 owner の割当だけを手で行う。手発行は例外経路で、理由を record に残す。発行と判断の重みは層で勾配を持つ: L0〜L3 (企画・画面プロト・PoC・要件) は人が発行・割当し機械は候補起草まで、L4 は文書 1 名でチケット化しない、L5 以下は機械 compile が既定。

チケットは **大・中・小・原子の 4 階層** で入れ子に発行し、下から上へ収束させる。大 = リリース切り分け単位 (release slice、統括 owner が人手で発行、受入 = release 適格性)。中 = 責務 / 依存単位 (L4 行列の責務行から compile、合流点の統合チケットを兼ねる、受入 = 子の admission 全件 + 統合 review)。小 = 機能 / path 群の単位 (詳細設計・仕様・実装・検証、1 PR = 1 小チケット、受入 = main への merge admission)。原子 = 単一の変更契約 (1 oracle / 1 変更セット、1 commit 相当、AI lane の実行単位、受入 = oracle green + 小チケットへの集約)。原子だけが path lease を持ち、上位階層は子の lease 集合を所有しない。各チケットは親を exactly one 持ち、親無し・2 親・階層飛びは deny する (canonical parent は 1 件)。

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
| D. PoC / プロトタイプ作成 | Assurance Kernel (case-driven model) | Discovery PoC を production 工程と別 axis で識別、S3 verified ≠ terminal、S4 decision record 必須、prototype 反応の構造化還元。初期画面ルール (画面規約 / token / 状態表現) を freeze した後、画面プロトをチケット単位で分担する | PoC 成果の production への無審査昇格、画面ルール freeze 前の分担 |
| E. ハーネスメモリの見直し | Evidence and State Ledger → Adaptation | captured → canonicalized → retired の lifecycle、責務 owner の学習資産、失効 / 矛盾 / 再検証状態 | memory を進捗・正本・承認の代替にすること |
| G. 縮退・是正案件 (参照元 issue / PR 追突、2026-09-04) | Adaptation → 全 Plane | surface rationalization (7 class 分類 + 利用計測で退役)、legacy consumer inventory、schema / archive の原子的退役、receipt の workspace 束縛と訂正世代、reviewer attestation、gc / 未 commit 残置 / stale base の doctor 化、projection silent skip の finding 化、Document Authority Census | CI 規模前提の scheduler、release slice、外部実行 lane 前提の統制 |
| F. スキル / ナレッジ管理新体制 | Adaptation → Control Plane | typed applicability registry、最小 packet の決定的 compile、firing telemetry と可逆 quarantine、shadow + 測定 + 独立 review による昇格 | 全 skill 一括注入、削除による整理、単一 episode 昇格 |

要求・要件・受入への降下は UTV4-BR-009〜012 / UTV4-FR-015〜022 / UTV4-AC-024〜031。

## Provider topology (単一 provider でも成立する構成)

本構想は特定の provider 組合せを前提にしない。独立 review の本質は **authoring context からの分離 + reviewer attestation + exact HEAD / CI generation への束縛** であり、provider family の分離はその最も強い実装であって唯一の実装ではない。チームが利用できる provider は契約・予算・地域で変わるため、次の 3 profile を同じ契約の上で選べるようにする。

| profile | 創出 (worker) | 判断 (review / gate) | 独立性の担保 | evidence tier | 補償統制 |
|---|---|---|---|---|---|
| hybrid (既定) | 一方の family | 他方の family の frontier tier | family 分離 + blind packet + attestation | `cross_family` | なし (現行 v3.1 と同じ) |
| single-provider | 同一 provider の worker tier (例: Sonnet / Luna) | 同一 provider の別 session・上位 tier (例: Fable / Sol)。author session と異なる reviewer session を attestation で検証 | authoring context 遮断 (blind packet)、author claim 非提示、session 分離、exact HEAD 束縛、CI green を前提 | `same_family_separated` | 高影響境界・release 適格性の merge に人間 review、merge の 5〜10% を監査 sampling して FLAG 率 / 見逃し率を hybrid 基準と比較、CI oracle の mutation 検証 |
| standalone | 人間または単一 model | 人間 | 人間 review | `human_review` | 全 merge を人間が承認 |

evidence tier は 3 段 (`cross_family` > `same_family_separated` > `intra_runtime`) で receipt に記録し、v3.1 の `intra_runtime_subagent` は最下位 tier として残す (同一 session 内 subagent、機械証跡なし)。

**single-provider の要は blind review で偏見を潰すこと** (PO 2026-09-04)。同一 family は同じ訓練由来の盲点・同じ「もっともらしさ」の
基準を共有するため、family 分離が無い分を blind packet の厳格さで補う。具体的には: (1) packet は author ではなく control plane が
組む (author の claim・自己評価・意図・identity・過去 verdict を除去、spec / AC / diff / oracle 結果のみ)、(2) claim-blind
(spec / AC に対する判定) と spec-blind (成果物の内部整合) の 2 lane を別 session で走らせ、両方の FINDING を突き合わせる、
(3) author と reviewer の session は memory namespace・context を共有しない、(4) reviewer は oracle を自分で再実行し、
最低 1 件の反証試行 (反例・境界値・仕様外入力) を record に残す (反証ゼロの PASS は PASS-WEAK に格下げ)、(5) reviewer の tier /
effort は author 以上、prompt pack は author と別、(6) blind verdict は judgement record として back-annotate し、監査 sampling の
hybrid 基準比較 (FR-024) で見逃し率を継続計測する。これらは hybrid でも適用するが、single-provider では admission 条件になる。

不変条件: (1) profile は project 設定の typed record で宣言し、receipt に evidence tier を記録する。上位 tier を僭称しない。(2) 同一 session の自己 review、author runtime 内部 review の独立 review への昇格は全 profile で禁止。(3) profile の格下げ (hybrid → single-provider) は利用上限・契約停止の record を伴う場合だけ自動で許し、格上げは常に許す。(4) routing・agent-guard・delegation-routing は provider 名ではなく role × tier × session 分離で判定し、provider が 1 つでも fail-close しない。(5) 補償統制は doctor の fail-close gate として機械強制されるまで first-class 昇格を認めない。

参照元でも中間 tier の退役と 2 層 (判断 = frontier、創出 = 実装量産 tier) への集約が検討されており、single-provider profile はその 2 層構成をそのまま 1 provider 内で実現する形である。

## 標準工程 flow (チーム開発版、PO 提示 2026-09-04)

1 名が収束させる点と集団が発散する区間を交互に置く。発散区間の出口は必ず event / receipt で閉じ、合流点には統合チケットの owner 1 名を置く。

| # | 工程 | 層 | 型 | 収束責任 |
|---|---|---|---|---|
| 1 | 企画書 (人間) → 1 名が要求を一定ラインまで整理 → 画面モック 1 枚 | L0〜L2 | 文書 | 1 名 (人間) |
| 2 | 初期画面ルールを freeze し、集団で画面プロトを作りながら要求を細分化 | L2 discovery | 画面プロトチケット + 反応 event | 発散 |
| 3 | 細分化要求を 1 名が整理し、確定 / PoC へ割り振り | L2→L3 | compile + PoC 仮説チケット | 1 名 |
| 4 | PoC を集団で作り、画面と PoC をつないで検証 | Discovery PoC S2〜S3 | PoC チケット、S3 verified evidence | 発散 |
| 5 | 要求整理 → 要件定義 → 集団で確認 → 確定 (G1/G3) | L3 | 文書 1 名 + review event | 1 名 |
| 6 | 基本設計を 1 名がまとめる | L4 | 文書 | 1 名 |
| 7 | 責務 / 依存別に詳細設計・仕様チケットを発行 → 集団対応 → 統合チケットで集計・全体チェック → 個別修正を返す → 再集計 (回数上限) | L5〜L6 | チケット + 統合チケット | 発散→1 名 |
| 8 | リリース切り分け → 依存単位で実装チケット発行 (path / 依存で分割、lease 非重複) → 集団作業 → 各チケットは main へ rebase して衝突ゼロを確認し merge admission (= 随時受入) | L7 | 実装チケット、merge admission | 発散、受入は admission |
| 9 | 依存がまとまった合流点では進んでいる担当が統合チケットを takeover receipt 付きで引き取り統合 | L7 合流 | 統合チケット + lease takeover | 1 名 (都度) |
| 10 | 全体が揃ったらテスト / 検査チケットを発行 → まとめ → チェック → リリース | L8〜L12 + release | 検証チケット (author と別 owner)、release 適格性 | 1 名 |

受入は 2 種を区別する: チケット単位の受入は **main への merge admission** (exact HEAD の CI + 独立 review + rebase 済み) であり、システム受入 (L10〜L12) は release 適格性で別に閉じる。

## 全体影響バグ・改善データ・製本点・実録学習 (PO 指示 2026-09-04)

| 論点 | 方式 |
|---|---|
| 全体に影響するバグ | 影響範囲は依存 graph (中チケットの責務 × path 行列) からの projection で機械が判定し、複数の中チケットに跨る欠陥は **stop-the-line incident** として統括 owner の decision record で扱う。対処は (1) 該当する中 / 大チケットの admission を一時停止 (fence)、(2) 修正は原子チケットとして発行し、影響下の小チケットの lease を takeover receipt 付きで一時回収、(3) 契約の誤りなら Reverse (要求 / 設計への還流) を必ず対にする。場当たりの hotfix branch と lease 無視の直接 push は deny。 |
| 改善データの収集点 | 各 project の event journal (`.ut-tdd/` の receipt / finding / hook event と issue・PR・review コメントの projection) を **project 単位の improvement intake record** に集約し、ハーネス自体の改善入力は project 横断の corpus (namespace = project identity、secret / PII / private transcript を admission で遮断、opt-in) へ一方向で流す。収集点は各 project の harness.db projection、集約点はハーネス repo の Evidence Ledger。Issue / コメント本文を意味正本にはしない (FR-010 / 011)。 |
| 画面モック / プロトの製本点 | 製本 (正式文書への統合) は 2 点で行う: (a) L2 → L3 compile 時に screen id ごとの prototype record + 反応 event を **画面仕様 (generated)** へ束ね、要件 IR の surface / action / state / AC と結ぶ、(b) L5 詳細設計で画面詳細 (component / 状態 / 失敗 / 回復) として再製本する。製本物は generated view + typed record であり、モック画像や prototype 実装そのものを正本にしない。 |
| 実録からの学習 | 一般手順を書いた汎用 skill (provider が既知の知識) は退役対象 (FR-025 の GENERIC_PROCEDURE class) とし、skill・判断パック・機構は **実録 (receipt / finding / review verdict / incident / S4 record) から抽出した CASE / SCENE / PATTERN** に provenance を束縛して生成・昇格する。実録 provenance の無い skill は昇格できず、既存 skill は実録との照合で quarantine 判定を受ける。 |

## 判断の蓄積と機械判断化 (自己学習型ハーネス、PO 指示 2026-09-04)

| 論点 | 方式 |
|---|---|
| judgement record | LLM が下したあらゆる判断 (review verdict、finding、advisor 決定、gate 判定、triage、分類) を **judgement record** (1 record = 1 JSON、subject identity・入力 digest・判断者 (model / tier / role)・結論・根拠 finding・所要コスト) として Evidence Ledger に残す。会話 transcript は正本にしない。 |
| 結果との照合 (calibration) | 後続の事実 (CI / oracle 結果、incident、Reverse 発生、人間の override、利用者フィードバック) を judgement record へ back-annotate し、判断種別 × 判断者ごとに正答率・見逃し・過検知を計測する。照合の無い判断は「未検証の意見」であり昇格材料にならない。 |
| 機械判断化の階段 | 同種の判断が calibration で安定したら **LLM 判断 → 安価モデル / 小型分類器 → 決定的 check (lint / doctor / schema)** の順に降格 (= 機械化) する。各段は shadow 運転 → before/after 比較 → 独立 review を経て gate 化する (FR-022 の昇格経路を再利用)。log を機械判断化できた領域では frontier tier を呼ばない。 |
| 費用非依存の品質 | frontier tier は「学習済み check が無い判断」と「人間ゲート直前の独立 review」にだけ使う。effort / model ladder は上げる方向だけでなく、機械判断化に応じて **下げる方向** を持つ。品質は蓄積された判断機構と人間ゲートで守り、モデルの高価さを品質の担保にしない。 |
| 判断軸 skill (良否 + 選好) | 判断軸は 2 軸で蓄積する。**良否軸** = 契約 / oracle / 規約に対する正誤。**選好軸** = (a) プロダクトが人間ユーザーにとって使いやすいか (操作導線・失敗時の回復・認知負荷・一貫性)、(b) AI が裏側で継続的に変更しても壊しにくいシステムか (境界の明示・契約の機械可読性・変更の局所性・観測可能性・fail-close 既定)。選好軸の判断は実録の CASE / PATTERN から skill として抽出し、判断パックの評価観点へ注入する。選好軸の昇格 (規約化) は人間ゲートを必ず通す。 |
| 適用範囲 | ハーネス自身の運用判断だけでなく、ハーネス上で開発されるプロダクトのレビュー観点にも同じ record・照合・階段を適用する。project 単位の intake record (FR-038) が収集点、ハーネス repo の Evidence Ledger が集約点。 |
| 人間可読 (組織で使える) | AI が分かるだけの record は組織的には使えない。judgement record・calibration・機械判断化された check・判断軸 skill は、すべて **ハーネス標準共有機構** — 要求 / 要件 / 設計を同期するスプレッドシート view (FR-008) と、画面モック / プロトの製本物 (FR-039) — へ generated view として投影され、人間はそこで読む・承認する・差し戻す。人間可読 view を持たない判断・skill は昇格できない。 |

## ハーネス標準共有機構: 機械認識の可視化と齟齬検出 (PO 指示 2026-09-04)

| 論点 | 方式 |
|---|---|
| 図は generated view | 依存グラフ (PLAN の requires / references、中チケットの責務 × path 行列、admission 履歴)、画面遷移図 (FR-039 の prototype record が持つ surface / action / state)、ER 図 (schema record) は、機械が認識している record から **決定的に描画** し、生成元 id・revision・digest を図に刻む。手描き図・貼り付け画像は正本にならず、参照は generated 図の id で行う。現行の harness.db `graph_nodes` / `dependency_edges` と docs の mermaid 描画が起点。 |
| テーブル定義はスプシと同型 | DB テーブル・カラム・型・制約・インデックス・FK は表形式 record を正本 view としてスプレッドシートへ同期し (FR-008 の consumer)、ER 図はそこから派生させる。列の編集はスプシ側から admission 経由で戻す。 |
| 齟齬の検出 | 「機械が認識していること」と「人間が認識していること」の差は、人間が図 / スプシ側で行った追加・削除・変更を直接反映せず **discrepancy record** (対象 record id、人間側の主張、機械側の値、差分の種類) として diff し、admission で正本へ戻すか finding として owner へ返す。逆に record が変わって図が古くなった状態 (diagram drift) は doctor が fail-close する。齟齬は会話ではなく record で解消する。 |
| 適用層 | L1 (要求 → 要件のトレース図)、L3 (要件 IR ↔ 画面遷移)、L4 (責務 × 依存)、L5 / L6 (ER・API・状態遷移)、チケット (大 → 中 → 小 → 原子の入れ子とレース状況)。各層の図は同じ生成契約を使い、層ごとに描画器を発明しない。 |

## 下流から上流への還流 (Reverse) のチーム化 (PO 確認 2026-09-04)

現行の Reverse (R0〜R4、`backprop_decision`、supersedes 双方向) は 1 PLAN 対 1 REVERSE の文書対であり、1 人運用では
成立している。チームでは次の 4 点を record 化しないと破綻する: (1) 多数の原子 / 小チケットから同じ上流契約へ還流が集中し、
上流 owner (L3 / L4 は 1 人) が bottleneck になる、(2) 同じ契約に対する還流が lane ごとに重複起票される、(3) 還流中の
契約に依存する下流チケットが動き続けて手戻りが増える、(4) 契約が改訂された後に既発行チケットの再 compile が手作業になる。

| 論点 | 方式 |
|---|---|
| backflow record | 還流は文書対ではなく **backflow record** (発生元チケット / finding、対象層と契約 id、差分の種類 = 契約誤り / 欠落 / 曖昧、owner = 対象層の doc owner、影響下チケットの exact set、decision) として発行する。既存の Reverse 対 PLAN はこの record の projection。 |
| 収束 (dedupe) | 同一契約 id への backflow は中チケット単位で 1 件に集約し、複数 lane からの同種指摘は event として付く (exactly-one owner)。上流 owner は個別対応ではなく **batch で decision** する (人間ゲート = decision record)。 |
| fence | backflow が open の間、その契約に依存する下流チケット (依存 graph の projection) の merge admission は fence し、lease は保持したまま停止する (FR-037 の incident fence と同じ機構)。 |
| 再 compile | 上流契約が改訂されたら ticket compiler が影響下チケットを再 compile し、差分 (無効化 / 変更 / 新規) を owner へ返す。手作業でチケットを書き換えない。 |
| 昇格の抑制 | 1 件の backflow で規則・機構を変えない (原則 7)。同種 backflow の反復は judgement record の calibration へ入り、契約テンプレートや check の改善候補になる。 |

## Sub-agent 機構の再編: 論理 role record と provider-native 写像 (PO 指示 2026-09-04)

実測 (HEAD 2026-09-04): `.claude/agents/` に Claude Code 固有形式の手書き subagent 20 本 (role・model floor・tools・
プロンプトを焼き付け)、`delegation-routing.ts` に別系統の role 登録 (gate / review / worker)、`agent-guard.ts` は
subagent ファイル名で allowlist と floor を判定する。同じ「reviewer」が 2 箇所で別定義され (二重 role 体系)、Codex 側に等価物が
無く、単一 provider 構成や新 provider では成り立たない。

| 論点 | 方式 |
|---|---|
| 論理 role record | ハーネスが所有するのは **論理 role** (worker / reviewer / gate / explorer / advisor など少数) の record だけ: capability floor (tier)、許可 tool 種別、証拠義務、authority (closing 可否)、family 分離要件。provider 名・model 名・ファイル形式は record に入れない。 |
| provider-native 写像 | 各 provider adapter (Claude Code / Codex CLI / 将来 provider) が role record を自社 native 機構 (Claude Code の subagent / Agent tool、Codex の exec + role、team 定義) へ写像する。`.claude/agents/*.md` 等の provider 固有定義は record からの **generated view** であり手書きしない。ドメイン特化 (be-api / db-schema 等) は role ではなく skill / 判断パックの注入で表す (FR-021 / FR-040)。 |
| guard の根拠 | agent-guard / delegation-routing の allowlist・floor 判定は role record を単一の根拠にし、ファイル名や subagent_type は adapter が record id へ解決する。二重 role 体系を解消する。 |
| オーケストレーション形式 | 「LLM orchestrator が名前付き subagent を呼ぶ」形式から、**control plane が原子チケット (role + lease + budget) を lane へ dispatch する** 形式へ移す。LLM orchestrator は lane の一つ (統制主体ではない) で、その有無・provider・tier は record の値。合流点の判断は gate role が行い、orchestrator が閉じない。 |
| 単一 provider 構成 | 論理 role が provider 非依存なので、single-provider / standalone topology (§Provider topology) でも同じ role record と guard が使え、family 分離が不可能な部分だけ evidence tier を落として記録する。 |
| 移行 | 既存 20 subagent は role record + skill へ分解し、生成 view として再出力する。生成物と手書き定義の一致を doctor で照合し、手書き残置は drift として fail-close。 |

## 削る機構: リファクタリングと退役の階層別責務 (PO 指示 2026-09-04)

足す機構だけでは並行 AI 開発は肥大する。削る作業を人の気分ではなく **発火条件の projection + チケット compile** で発生させ、
階層ごとに責務を固定する。

| 階層 | リファクタリングの責務 | 発火条件 (機械検出) | 受入 |
|---|---|---|---|
| 原子 | TDD の red → green → **refactor** を原子 PR の内側で完結する。別チケットを発行しない。 | 常時 (工程の一部) | 原子の oracle green |
| 小 | 原則として不要。複数原子の合成点 (object / module 化 = 機能合成) を **compose 原子** として任意に 1 件持てる。 | 子原子が全 green になった時点で、重複 / 凝集度 / 境界越え path の projection が閾値超え → compiler が提案 (deny ではない) | 小の merge admission (FR-032) |
| 中 | **必須ゲート**。結合テストと同じ位置で、責務境界の是正・重複除去・契約の機械可読化を refactor 原子チケット群として compile し、中の受入条件に含める。 | 子の小が全 admission された時 (統合 review 前)。responsibility × path 行列の違反、依存 graph の循環、契約 drift、複数小に跨る重複 | refactor 原子が全 green かつ統合 review PASS |
| 大 | 機能群統合後に **逆方向で refactor チケットを発行する flow** を持つ: 統合 → 発見 → 該当する中へ refactor 中チケット / 原子を配る。architecture 級の是正と退役 (FR-025 の quarantine → 退役) はここが owner。 | release 適格性審査時、incident / backflow の同種反復、surface class の計測 (invocation 数 / 採用率 / context cost) | 配った refactor チケットの admission と退役 record |

共通則: (1) refactor チケットは **behavior-invariant** (既存 oracle 不変、新規機能 oracle を追加しない) を受入とし、機能 原子と混ぜない

## 三者分離: author / reviewer / admitter と merge lane のパス (PO 指示 2026-09-04)

PR の merge lane を author から別の人へ渡す構造を、チケット責務として固定する。「作る」「独立 review する」「main へ入れる判断を
する」は別の actor であり、compiler は小チケット以上に **admission チケット** (merge lane、lease 付き、assignee ≠ author) を対で発行する。

| 階層 | author (作る) | 独立 review | admission (別人へパス) |
|---|---|---|---|
| 原子 | AI lane または本人 | blind lane (別 family / 別 session) | 小 branch への合流は oracle green で自動 (人の判断なし) |
| 小 (= PR) | 小 owner | author 以外の人。居なければ AI blind lane (evidence tier を記録) | **main への merge admission は author ≠ admitter**。admission チケットは中 owner または統括へ渡る |
| 中 | 中 owner (統合) | 統合 review は author 以外 | 中の admission = 統括 (中 owner とは別人) |
| 大 | 統括 | release 適格性 review | PO / release owner |

個人でやる範囲: author と admission 判断。他人へ渡す範囲: review と (人が居れば) admission。人が 1 人のときは admission を
**self-admission** として record に印を付け、監査 sampling (FR-024) の対象にする。人が 2 人以上になれば admission チケットの assignee が
別人へ切り替わるだけで工程は変わらない (人数不変性)。admitter は author の主張ではなく receipt (独立 review verdict・CI generation・
exact HEAD) だけを見て判断し、admitter 自身が成果物を書き換えることは deny (書き換えは author へ差し戻す)。
(1 PR = 1 論点)。(2) owner は当該階層の owner (中 = 責務 owner、大 = 統括)。(3) 発火条件は依存 graph / 責務行列 / 計測 record からの
projection であり、LLM の「気づき」だけで発火させない (気づきは finding として projection に入る)。(4) 現行 `refactor-scout` の
検出責務と routeFiling の `refactor` mode はこの機構の起点であり、role record (FR-049) と compiler (FR-034) へ移す。





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
10. LLM の判断を record 無しに消費しない。calibration 証拠の無い判断を機械判断へ昇格しない。モデルの高価さや
    tier を品質・authority の代替にしない。

## v3.1 資産の移行

L0-L14 と正規 V-pair、Forward / Reverse / Recovery、9-mode と routeFiling SSoT、fail-close、cross-family
review、TypeScript/Node 一本 (ADR-001)、Pack 配布 (PLAN-L6-63 系) は Kernel / Control Plane へ継承する。
§9 の 5 役割は Sovereignty Plane の層別境界表と統合する。旧 Bun runtime、personal legacy path、memory 中心の
継続、宣言のみの evidence は current identity として再出力しない。

## 非目標

prompt 集、persona 集、multi-agent chat room、全会話保存、Issue を意味正本にする project manager、DB を意味正本に
する workflow engine、latest model 自動追従器ではない。完全自動を理由に human authority を AI へ移さない。
949 PLAN の一括 JSON 化は行わない (record 化は新規種別から段階導入)。

## 昇格条件

1. v3.1 との差分を L1 要求候補へ materialize する。
2. 原則を L3 要件候補へ分割し、L10 受入候補 (positive / negative oracle) を作る。
3. 既存 owner (VUP-REQ-01〜10、U23、BR-01〜08) との重複・矛盾・未実装主張を検査する。
4. PO の plan 固有承認を typed provenance へ束縛する。
5. concept v4.0 を `docs/governance/` へ昇格し、v3.1 を archive へ降格、CLAUDE.md / AGENTS.md / README /
   repository-structure の参照を一方向更新する (rule-drift 対応)。
6. L1 delta (VUP-REQ-11〜) を PLAN-L1 系で起こし、charter PLAN-L0-01 §4 に後続テーマを追加する。
