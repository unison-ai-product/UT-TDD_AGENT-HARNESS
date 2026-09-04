---
plan_id: PLAN-L1-09-ut-tdd-concept-v4-candidates
title: "PLAN-L1-09 (research): 構想書 v4.0 候補 (チーム開発版 Verified Change Harness) の L1/L3/L10 分解"
kind: research
layer: L1
drive: fullstack
status: draft
route_signal: research
route_mode: research
created: 2026-09-04
updated: 2026-09-04
owner: PO / Claude
github_issue_id: null
pair_artifact: docs/governance/candidates/ut-tdd-concept-v4-acceptance.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L3
review_evidence: []
agent_slots:
  - role: po
    slot_label: "PO - 2 大要求の提示と concept v4.0 候補の承認"
  - role: tl
    slot_label: "TL - 既存 authority (v3.1 / VUP-REQ / BR / U23) との重複・矛盾検査"
  - role: qa
    slot_label: "QA - L10 受入候補の falsifiability 検査"
  - role: se
    slot_label: "SE - 承認後の L1 delta / charter 追記 / 参照更新"
generates:
  - artifact_path: docs/plans/PLAN-L1-09-ut-tdd-concept-v4-candidates.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/candidates/ut-tdd-concept-v4.0.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/candidates/ut-tdd-concept-v4-requests.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/candidates/ut-tdd-concept-v4-requirements.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/candidates/ut-tdd-concept-v4-acceptance.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  blocks: []
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/design/harness/L1-requirements/business-requirements.md
    - docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md
    - docs/design/harness/L1-requirements/vmodel-engine-swap-requirements-delta.md
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
    - docs/governance/github-issue-hierarchy.md
---

# PLAN-L1-09: 構想書 v4.0 候補 (チーム開発版 Verified Change Harness) の L1/L3/L10 分解

## 1. 目的

PO が 2026-09-04 に提示した 2 大要求 (A: JSON 化による AI 開発ライク and 人間対応、B: チーム開発における
コンフリクト対策・進捗マネジメント機構、枠組み = human-on-the-loop) を、**現行 authority を追い越さない候補**
として L1 要求 / L3 要件 / L10 受入へ分解し、PO 承認後に concept v3.1 → v4.0 昇格と L1 delta (VUP-REQ-11〜) を
起こすための入力を作る。PO が提示した個人開発ハーネスの構想 v4.0 候補 (Verified Change
Operating System、非公開) から、チーム開発に必要な部分だけを翻案する。

## 2. 起点の実測 (基準 ref = `b27720644a7589dc568c76cad7eb5e068654c824`)

### 2.1 既存の将来構想は engine-swap program に集約されている

```bash
git show b2772064:docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md | grep -c "^- \[ \]"   # 7 (完遂条件 8 件中 7 件未達)
git show b2772064:docs/governance/vmodel-upgrade-schedule.md | grep -c "| yellow \| draft"      # 非 green / 非 confirmed 58〜59 行 / 120 行 (grep 実装差: Linux 58、Git Bash 59)
```

charter §4 の後続テーマ 8 本と VUP-REQ-01〜10 に、**構造化正本と generated view (A)、複数人間ユーザーの
チケット / lease (B-①②)、人間へのナレッジ還流 (B-③)、層別 human-on-the-loop 境界** は含まれていない。

### 2.2 チーム協調の欠落は個別 issue として散在する

```bash
gh issue list --state open --limit 100 --json number,title | jq -r '.[]|select(.number==480 or .number==384 or .number==426 or .number==421)|"\(.number) \(.title)"'
```

#480 (PLAN 採番の衝突)、#384 / #426 (worktree lifecycle)、#421 (review request の memoryId 分裂) は、いずれも
「作業単位に owner と lease が無い」ことの症状であり、U23 Execution Ledger (PLAN-L4-30 / L6-83〜85 /
L7-436〜439。基準 ref で L4-30 と L5-23 は confirmed、L6-83〜85 と L7-436〜439 は draft、実装 slice 0) が契約の受け皿だが複数人間ユーザーを前提にしていない。

### 2.3 正本形式の現状

```bash
git show b2772064:docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md | grep -n "DB は authored source を直接置換しない"
git ls-tree -r --name-only b2772064 docs/plans | wc -l   # 949 PLAN (markdown)
```

typed spec IR (U8〜U12) は confirmed だが対象は宣言部のみ。record 類 (verdict / receipt / evidence) は
`.ut-tdd/review/receipts/*.json` のように既に JSON で、PLAN / schedule は markdown である。

### 2.4 PO 追加指示 4 領域 (C〜F) の現状受け皿

```bash
git ls-tree b2772064 skills/ | wc -l                                  # 81 (skill pack root、applicability は frontmatter prose)
git ls-tree -r --name-only b2772064 src/skill-engine | wc -l         # 2 (推薦 / 注入の実装)
git ls-tree -r --name-only b2772064 .ut-tdd/memory | wc -l           # 586 (HARNESS memory、退役機構なし: git grep -il retire b2772064 -- src/memory = 0)
git grep -l "^kind: poc" b2772064 -- docs/plans | wc -l              # 10 (PoC PLAN、S4 decision record 契約なし)
git grep -n "S0 backlog" b2772064 -- CLAUDE.md                       # 1 (Scrum / PoC S0〜S4 は workflow 一行のみ)
```

要求発見 (intake → discovery → compile) の工程は存在せず、typed spec IR (U8〜U12) は宣言部の
compile のみを対象にしている。

### 2.5 参照元の縮退・是正案件からの写像 (issue / merged PR 追突、2026-09-04)

参照元の直近 merged PR と issue を確認した。確認窓は `gh pr list --repo <参照元 repo> --state merged --limit 120 --json number,title,mergedAt` と `gh issue list --repo <参照元 repo> --state all --limit 200 --json number,title,state,labels` の出力 (2026-09-04 実行、各 limit 上限まで返却) であり、repo 名は PO 指示 (2026-09-04) により本文・PR・commit に記載しない。件数はこの limit 窓の上限であって全件数の主張ではない。UT 側の実測痛点と一対一で対応するものを束縛する
(新 issue は起こさない。既存 issue の受入条件へ転記する)。

| # | 参照元の解 (要旨) | UT 側の受け皿 | 候補要件 |
|---|---|---|---|
| A1 | review receipt を candidate workspace と Node authority に束縛 | PR #516 r1 で receipt が worktree 側に書かれた実測、#424 | FR-027 |
| A2 | reviewer session attestation、malformed receipt の訂正世代、admission 失敗の typed reason | #505 / #493 / #386 / #393 | FR-027 |
| A3 | receipt 失効の merge カスケード: 当面は直列運用 (receipt → 即 merge)、恒久案は tree 差分ゼロの update-branch で receipt 継承 | #439 / #218、2026-09-04 merge-order lesson memory | FR-013 (再確認) |
| A4 | GitHub open branch / PR を read-after 付きで走査する PLAN reservation provider | #480 | FR-004 (U23) |
| A5 | 証明ベース gc (ancestor + clean のみ、dry-run 既定、audit)、未 commit 残置と未 push / stale base の doctor 化 | #384 / #426 / #444 | FR-027 |
| A6 | projection writer の silent skip を finding 化 | graph 鮮度 (#169 系)、#242 | FR-027 |
| A7 | `sync-pack --prune-local` の dry-run 既定 + confirm 必須 + repoRoot 祖先拒否 | UT 側は未計測 (要実測、CLAUDE.md §Distribution Repository) | FR-026 |
| B1 | Surface Rationalization (7 class + 利用計測で退役) | `skills/` 81 entry、agent-guard allowlist 19 種 (未計測) | FR-025 |
| B2 | subagent ロスター縮退 (中間 tier 退役、判断 = frontier / 創出 = 量産 tier の 2 層) | CLAUDE.md §Model / Effort Routing (3 層前提) | FR-023 / FR-025 |
| B3 | team run / pair-agent を互換面化し利用実績で段階廃止 | `ut-tdd team run` (Canonical Commands / rule-drift marker) | FR-025 / FR-026 |
| B4 | legacy 出力 consumer inventory (current surface × legacy token 完全行列) | #487 / #450 Bun 撤去、旧 9-mode 残骸 | FR-026 |
| B5 | migration source archive の manifest 化退役、legacy DB schema object の原子的退役 | `docs/migration/` snapshot、harness.db (4.5GB) schema | FR-026 |
| B6 | Claude native memory の明示無効化 + 再出現 fail-close | #454 / #494 (切り分け候補) | FR-019 |
| B7 | Document Authority Census (全 tracked doc の class / owner / authority binding) | 949 PLAN + governance の正本判定 (A. JSON 化の前段) | FR-006 / FR-025 |

保留 (時期尚早・対象外): CI critical-path scheduler / verification plan / shard budget、Functional Release Slice、
post-release lifecycle authority (Pack canary #418 以降)、hosted preflight nonce / capability broker (外部実行 lane 前提)。

## 3. 設計判断

### 3.1 正本の置き場 (advisor design、claude-fable-5、2026-09-04)

| 案 | 内容 | 評価 |
|---|---|---|
| 1 | markdown 正本を維持し typed block を拡張、双方向 projection を追加 | 双方向書き戻しが lossy。ticket を markdown にすると conflict 率は下がらない |
| 2 | 正本を構造化 JSON/YAML へ全面移行、markdown は view | 949 PLAN の big-bang 移行、人間の diff review 性を損なう。却下 |
| **3 (採択)** | **artifact class 別 hybrid**: narrative は markdown 正本 + typed block、record (チケット / schedule / verdict / receipt / evidence) は 1 record = 1 file の構造化正本、view は generated | conflict が record 単位に局所化、charter §5 第 7 項と整合、既存 spec IR 経路を流用 |

concept 規則: 「正本形式は artifact の主読者で決める。双方向書き戻しは構造化正本に対してのみ admission 経由で
許し、markdown 正本への機械書き戻しは行わない」(候補 concept §原則 6、UTV4-FR-006〜009)。
残リスク: PLAN frontmatter の record 化は専用 Reverse 対で段階移行 (UTV4-FR-007)、generated view の hash gate
(UTV4-FR-008)、U23 との重複は改訂で吸収し新規起票しない (UTV4-FR-004)。

### 3.2 参照元構想 v4.0 からの採否

採る: Sovereignty / Change Contract Compiler / Control Plane / Assurance Kernel / Evidence Ledger / Adaptation の
6 Plane、8 原則のうち 7 (Composable Release は既存 Pack 配布契約へ写像)、exactly-one owner、lease / fence、
startup packet、evidence の段階 (claimed → current)、GitHub を projection とする一方向同期。
PO 追加指示 (2026-09-04) により、上流要求エンジン (L1 intake → L2 append-only discovery → L3 typed IR compile →
人間承認 freeze)、Discovery PoC の別 axis 化と S4 decision record、ハーネスメモリの captured → canonicalized →
retired lifecycle と責務 owner の学習資産、skill applicability の typed registry・最小 packet・telemetry・
可逆 quarantine・shadow 昇格を追加で採る (UTV4-BR-009〜012)。
採らない: Python 恒久意味コア (ADR-001 と衝突)、多軸分類 registry による routeFiling 置換
(別 version-up)、repository / CLI の rename。

### 3.3 Provider topology (advisor design、claude-fable-5、2026-09-04)

| 案 | 内容 | 評価 |
|---|---|---|
| 1 | hybrid の family 分離だけを独立 review とし、single-provider は常に劣化 evidence | 導入障壁が高い (2 社契約が前提)。v3.1 の現状 |
| **2 (採択)** | **独立性を authoring context 遮断 + reviewer attestation + exact HEAD 束縛で定義**し、family 分離を最強の実装、同 provider 別 session・上位 tier を補償統制付きの第一級 profile とする | 1 社でも成立。evidence tier を 3 段で記録するため僭称と相関エラーを事後識別できる。attestation の機械強制が前提 |
| 3 | single-provider は全 merge に人間 review 必須 | 安全だが human-on-the-loop の範囲を超え、チーム開発で回らない |

advisor 回答 (要旨):

- 推奨: 案 2。独立 review の本質は「著者の主張・文脈・確証バイアスからの遮断」であり、provider 族は実装手段の一つ。案 1 は単一 provider 構成 (Pack 配布先の単一契約ユーザー) で harness が成立せず、案 3 は自動化基盤の前提を自壊させる。
- 最小補償統制 4 点: (1) blind packet 必須 (既存 blind-reviewer を昇格)、(2) exact-HEAD 束縛 + attestation を merge 時に一致検証、(3) session / context 分離の機械証跡 (同一 session の review は fail-close、tier 差は維持)、(4) 決定論 oracle (CI green) を verdict の前提条件にし review は残余リスクのみ判定。human sampling は全件でなく merge の 5〜10% の監査 sampling で足りる。
- 主要リスク: 同族モデルの相関エラー (cross-family の唯一の実質的優位)。evidence tier を 3 段 (cross_family > same_family_separated > intra_runtime) で証跡に残す。attestation の形骸化は doctor fail-close で機械強制しない限り採用しない。
- 不足証拠: same-family blind review の欠陥検出率が cross-family と比べてどれだけ落ちるかの実測が無い (本 repo の verdict 履歴から方式別 FLAG / PASS-WEAK 率を集計可能)。単一 provider 需要は仮定のまま。

採択: 案 2。補償統制は FR-024 (高影響境界・release 適格性の人間 review、5〜10% 監査 sampling、CI oracle の mutation
検証) とし、doctor gate で機械強制されるまで第一級昇格を認めない (advisor 条件)。advisor が指摘した不足証拠
(方式別の検出率実測) は工程 8 で取る。concept §Provider topology、UTV4-BR-013、FR-023 / 024、AC-032〜034 へ降下。

### 3.4 設計のチケット化粒度 (PO 指示 2026-09-04)

PO は「詳細と仕様」をチケット化対象とした。採択: 詳細設計 (L5) と仕様 (L6 機能設計 / typed spec block) の
作成・改訂・Reverse を work item record で発行し (owner / lease = 対象 design + 対の test-design path / base・HEAD /
証拠義務 = pair-freeze review・design-language・V-pair 双方向)、L4 基本設計以上の narrative と設計判断は作業としては
チケット対象だが本文はチケットに入れず markdown 正本へ束縛する。現行 PLAN (kind=design / add-design) の frontmatter が
近い形を持つため、FR-007 の PLAN frontmatter record 化は design kind から始める。FR-004 / AC-038 へ降下。

### 3.5 owner cardinality と上流 PoC / 画面プロトのチケット化 (PO 指示 2026-09-04)

PO 指示: 「要件と基本 (設計) は 1 人がまとめる」「上流の PoC / 画面プロトはチケットにし、初期画面でルールを固定したら
分担する (地味に時間がかかる)」。採択: 層別境界表に owner cardinality 列を追加 (L0〜L4 = 文書単位 1 名の人間、
L5〜L7 = チケット単位 1 名、L8〜L12 = author と別の検証 owner 1 名)。PoC / 画面プロトは work item record で発行し、
複数人分担は初期画面ルール freeze record を前提、反応は L2 discovery event へ。BR-015、FR-028 / 029、AC-039 / 040 へ降下。

### 3.6 標準工程 flow (PO 提示 2026-09-04)

PO が提示したチーム開発の工程 (企画書 → 1 名の要求整理と画面モック → 集団プロトで細分化 → 確定 / PoC 割り振り →
集団 PoC と画面接続検証 → 要件定義と集団確認 → 基本設計 1 名 → 責務 / 依存別チケット → 統合チェックと再集計 →
リリース切り分け → 依存単位チケットと main への随時 merge 受入 → 合流点で引き取り統合 → 検査チケット → リリース) を
概念 §標準工程 flow へ写した。統制点 4 つを要件化: 発散区間の出口 = event / receipt (FR-016 / 028)、合流 owner = 統合
チケット + takeover receipt (FR-030)、再集計上限 (FR-031)、受入 = rebase 済み candidate の merge admission (FR-032)。
BR-016、AC-041〜043 へ降下。

### 3.7 人数不変性・統括 owner・チケットの機械発行 (PO 指示 2026-09-04)

PO 指示: 「途中から複数人になるなど柔軟に」「全体の進捗を統括するマネジメント層が必要」「自動チケット発行に
しないと並行 AI 開発は厳しい」。採択: 人数不変性 (FR-033)、統括 owner 1 名 = 判断だけを持つ層で進捗は projection
(FR-034)、チケットは ticket compiler が既定で生成し人は batch admission と人間 owner 割当のみ (FR-035)。前提条件は
L4 基本設計 typed block に責務 × path × 依存の行列を持たせること (A. JSON 化の実利、行列が無い文書からは推測生成
しない)。BR-017、AC-044〜046 へ降下。

### 3.8 チケットの 3 階層と発行の層別勾配 (PO 指示 2026-09-04)

PO 指示: 「要件定義まではチケット発行で割当でよいが設計以下は手では厳しい。上流は人間判断を多めに、下は自動発行」
「大・中・小チケットに分けたほうがよい」。採択: 発行の勾配 (L0〜L3 = 人が発行・割当、L4 = 文書 1 名、L5 以下 = compiler
既定) を FR-035 に固定し、3 階層 (大 = リリース切り分け / 中 = 責務・依存 = 統合チケット兼務 / 小 = path 単位) を
FR-036 として exactly-one parent・lease は小のみ・受入は階層別 (merge admission / 統合 review / release 適格性) で定義。
AC-047 へ降下。github-issue-hierarchy.md の sub-issue 規約は projection 側の表現として継承する。

### 3.9 スプシ同期の必須化・4 階層チケット・全体影響バグ・改善データ・製本点・実録学習 (PO 指示 2026-09-04)

PO 指示: (1) JSON 化した要求 / 要件 / 設計のスプレッドシート同期は必須 (人間はこれを見る)、(2) 書類を 1 枚に
まとめず分散させる、(3) チケットは大・中・小・原子の 4 階層で入れ子に収束、(4) 全体影響バグの対処、(5) 各 project の
log / issue / コメントからハーネス改善データを集める場所、(6) 画面モック / プロトの製本点、(7) 汎用 skill から
実録学習への転換、(8) 思想は人間ゲート付き分散コンピューティング。採択: FR-008 (必須 view + 分散正本)、FR-036
(4 階層、lease は原子のみ)、FR-037 (stop-the-line incident + fence + Reverse 対)、FR-038 (project intake record →
opt-in 一方向 export → Evidence Ledger)、FR-039 (L3 compile と L5 詳細設計の 2 製本点)、FR-040 (実録 provenance 必須、
GENERIC_PROCEDURE 退役)。BR-018〜021、AC-047〜052、概念 §北極星 / 原則 4・6 / §全体影響バグ… へ降下。

### 3.10 候補文書の置き場

参照元構想と同じく `docs/governance/candidates/` に置き、承認前は CLAUDE.md 読込順・`docs/governance/README.md`・
rule-drift marker・doctor gate から参照しない。承認時に v4.0 を `docs/governance/` へ昇格、v3.1 を `docs/archive/`
へ降格し、参照を一方向更新する (前例: v3.0 → v3.1)。

### 3.11 判断の蓄積と機械判断化・費用非依存の品質・選好判断軸 (PO 指示 2026-09-04)

PO 指示: 「LLM の判断を仕組みとして蓄積する自己学習型のハーネス。ログを機械判断化する。目指すのは高価な AI でなくても
人間と AI が品質を守りながら開発できること。良い悪いの判断に加え、人間ユーザーが好むシステム (プロダクトが人間に
使いやすく、AI が裏側で働いても壊しにくい) を作るための判断軸を skill として蓄積する」。

採択: (1) LLM 判断を judgement record として Evidence Ledger に必須記録 (BR-023 / FR-041 / AC-053)。既存の review receipt
(`.ut-tdd/review/receipts/`) と advisor 発火ログ (`.ut-tdd/logs/session/advisor-*.jsonl`) が record 化の起点。
(2) 後続事実の back-annotate による calibration と、LLM → 安価モデル → 決定的 check の機械判断化の階段。昇格は FR-022 の
shadow → before/after → 独立 review を再利用し、単一 episode 昇格を deny (FR-042 / AC-054、原則 7 と不変条件 8 を継承)。
(3) 費用非依存の品質: frontier tier は未学習の判断と人間ゲート直前の独立 review に限定し、routing に降格方向を持たせる
(BR-022 / FR-043 / AC-055)。現行 `escalateShallowResponse` は上方向のみで、下方向は新規契約。
(4) 判断軸を良否 / 選好の 2 軸に分け、選好軸 (人間の使いやすさ・AI 変更耐性) を実録から skill 化して判断パックへ注入、
選好軸の規約化は人間 decision record 必須 (BR-024 / FR-044 / AC-056)。
(5) PO 追補: 「AI が分かるだけでは組織的に使いにくい。人間も分かる面が必要で、それがスプシ同期系と画面モック / プロトによる
ハーネス標準共有機構」— 判断・学習層の全成果物を FR-008 / FR-039 の generated view へ投影し、人間可読 view の無い判断 / skill は
昇格不可とする (BR-025 / FR-045 / AC-057)。
非採用: LLM 判断の自動 authority 化 (approval 代行) — 北極星と原則 1 に反する。tier を品質根拠として記録することも deny。
概念本文には §北極星 (到達点の段落)・§判断の蓄積と機械判断化・不変条件 10 として反映した。

### 3.12 機械認識の可視化と齟齬検出 (PO 指示 2026-09-04)

PO 指示: 「依存グラフや画面遷移などを機械的に可視化する仕組みを入れ、図を作ることで機械が認識していることと人間が認識している
ことの齟齬を減らす。DB テーブルはスプシと相性がよい」。

採択: 図 (依存グラフ / 画面遷移 / ER・テーブル / チケット入れ子) は record からの決定的 generated view とし、生成元 id・revision・
digest を刻む (BR-026 / FR-046 / AC-058)。テーブル定義はスプシ同期 view を正本 view にし ER 図を派生させる。人間側の図・スプシ編集は
discrepancy record として diff し admission で戻す、diagram drift は doctor fail-close (FR-047 / AC-059)。起点は現行 harness.db の
`graph_nodes` / `dependency_edges` と docs の mermaid 描画 (実測: 2026-07-28 の PLAN-L6-94 / L7-465 重複見逃しは projection 鮮度が
原因であり、図の鮮度を fail-close にする根拠)。非採用: 手描き図・画像の正本化、層ごとの独自描画器。
概念本文には §ハーネス標準共有機構: 機械認識の可視化と齟齬検出 として反映した。

### 3.13 下流→上流還流 (Reverse) のチーム化 (PO 確認 2026-09-04)

PO 質問: 「下流から上流のフィードバック機構は現行でも入っているが、チームでも成立するか」。判断: 現行の Reverse
(R0〜R4 / backprop_decision / supersedes 双方向、1 PLAN 対 1 REVERSE の文書対) は 1 人運用では成立するが、チームでは
上流 owner の bottleneck・重複起票・還流中の下流継続・改訂後の手作業再発行の 4 点で破綻する。採択: backflow record
(集約 = 中チケット単位 exactly-one、batch decision、依存下流の fence、compiler による再 compile) を導入し、既存 Reverse 対
PLAN はその projection とする (BR-027 / FR-048 / AC-060)。新 engine は作らず FR-037 の fence と FR-034 の compiler を再利用。
概念本文には §下流から上流への還流 (Reverse) のチーム化 として反映した。

### 3.14 Sub-agent 機構の provider-native 再編とオーケストレーション形式 (PO 指示 2026-09-04)

PO 指示: 「ハーネス側の固有 sub-agent をなるべく排除して provider 単位に寄せた sub-agent 機構へ再編すべきではないか。それに伴い
オーケストラ形式も変わる」。実測 (HEAD、2026-09-04): `ls .claude/agents | wc -l` = 20 (Claude Code 固有形式、model / tools /
プロンプト焼き付け)、`.claude/CLAUDE.md` に allowlist 再掲、`src/team/delegation-routing.ts` に別系統の role 登録
(GATE_SUBAGENT_ROLES / REVIEW_GATE_ROLES / WORKER_DELEGATION_ROLES)、`.claude/hooks/agent-guard.ts` はファイル名で allowlist と
floor を判定。二重 role 体系で Codex 側に等価物が無い。
採択: 論理 role record (provider 非依存) をハーネス正本にし、provider 固有定義は adapter の generated view、guard は record を
単一根拠、ドメイン特化は skill 注入へ (BR-028 / FR-049 / AC-061)。オーケストレーションは control plane dispatch へ移し、LLM
orchestrator は lane の一種で closing authority を持たない (FR-050 / AC-062)。非採用: provider ごとの独自 role 体系の維持、
orchestrator への approval 代行。移行は既存 20 subagent の role + skill への分解と生成 view 化であり、専用 PLAN で段階実施する。
概念本文には §Sub-agent 機構の再編 として反映した。

### 3.15 single-provider における blind review の偏見対策 (PO 指示 2026-09-04)

PO 指示: 「単一 provider の場合は blind review で偏見を潰すことが重要」。採択: family 分離の欠落を blind packet の厳格さで補う
6 条件 (control plane が packet 生成・author claim 除去 / claim-blind + spec-blind の 2 lane 別 session / memory namespace 非共有 /
reviewer の oracle 再実行 + 反証試行 1 件以上 (ゼロなら PASS-WEAK) / tier・effort は author 以上で別 prompt pack / judgement record
として back-annotate し FR-024 sampling で hybrid 基準比較) を single-provider の admission 条件にする (FR-051 / AC-063)。
現行 v3.1 の blind-reviewer (claim-blind / spec-blind 2 lane、`.claude/agents/blind-reviewer.md`) を継承し、FR-049 の role record
へ移す。非採用: 同 family の同 session 内 review の独立 review 化 (不変条件 5)。概念本文は §Provider topology に段落追加。

### 3.16 削る機構: リファクタリング / 退役の階層別責務と発火条件 (PO 指示 2026-09-04)

PO 提案: 原子は TDD (red → green → refactor) で原子 PR 内に閉じる、小は原則不要 (object 化などの合成は有利)、中は結合テスト
レベルとしてリファクタリングを持つべき、大は機能群統合なので逆に refactor チケットを発行する flow を持つ。採択: そのまま階層責務
として固定し (FR-052 / AC-064)、発火条件を依存 graph・責務行列・計測 record からの projection にする (FR-053 / AC-065)。小の
合成点は任意の compose 原子、中は必須ゲート、大は逆方向発行 + 退役 (FR-025) の owner。共通則は behavior-invariant 受入と機能
原子との非混在 (1 PR = 1 論点、PR スコープ規律の継承)。起点は現行 `refactor-scout` (advisory only、実装しない) と routeFiling の
`refactor` mode (refactor kind の route 条件)。非採用: LLM の気づきだけでの発火、feature PR への refactor 積み増し。
概念本文には §削る機構 として反映した。

## 4. 工程


| 手順 | mode | 内容 |
|---|---|---|
| 1 | serial | 本 PLAN と 4 候補文書を draft PR で起票し、cross-review (Codex family) を受ける |
| 2 | serial | PO が候補 concept / 要求 / 要件 / 受入を承認 (plan 固有 approval、typed provenance) |
| 3 | serial | concept v4.0 昇格 + v3.1 archive + 参照更新 (CLAUDE.md / AGENTS.md / README / repository-structure) |
| 4 | parallel | L1 delta (VUP-REQ-11〜14、additive) を PLAN-L1 系で起票 / charter §4 に後続テーマ 2 行追加 |
| 5 | parallel | U23 (PLAN-L4-30 系) を複数人間ユーザー前提へ改訂する Reverse 対 / record 正本 schema の L4-L6 設計 PLAN |
| 7 | parallel | §2.5 A1〜A7 / B1〜B7 を該当 issue の受入条件へ転記 (issue は新設しない)。B2 / B3 の縮退は利用実測 (FR-025) を先に取る |
| 8 | serial | 既存 verdict 履歴 (`.ut-tdd/review/receipts`、`review_evidence`) から cross_agent と intra_runtime_subagent の FLAG / PASS-WEAK 率を集計し、same_family_separated 昇格の妥当性を実測で裏取りする |
| 6 | parallel | 4 領域 (C〜F) の L3 設計 PLAN: 要求発見 event / IR compile (VUP-REQ-03 拡張)、PoC S4 record (routeFiling poc kind)、memory retirement + 学習資産 (PLAN-L7-189 系 Reverse 対)、skill applicability registry (`src/skill-engine/`) |

## 5. 完了条件

- [ ] 4 候補文書が cross-review PASS を受け、main に候補として存在する。
- [ ] PO 承認 record が typed provenance で残る (memory / chat / AI 解釈から生成しない)。
- [ ] 承認後の昇格・参照更新が 1 PR で行われ、rule-drift / read order gate が green。
- [ ] 既存 authority との重複・矛盾検査 (VUP-REQ-01〜10、BR-01〜08、U23、PLAN-L6-63 系) の結果が本 PLAN に記録される。

## 6. スコープ境界

本 PLAN は候補の materialize と分解のみを行う。runtime 実装、CLI / `.ut-tdd/` state の変更、DB schema 変更、
949 PLAN の移行、Issue の意味正本化は行わない。
