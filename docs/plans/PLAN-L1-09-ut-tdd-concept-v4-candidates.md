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

参照元の直近 merged PR 約 120 本と issue 約 200 件を確認した。UT 側の実測痛点と一対一で対応するものを束縛する
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

### 3.5 候補文書の置き場

参照元構想と同じく `docs/governance/candidates/` に置き、承認前は CLAUDE.md 読込順・`docs/governance/README.md`・
rule-drift marker・doctor gate から参照しない。承認時に v4.0 を `docs/governance/` へ昇格、v3.1 を `docs/archive/`
へ降格し、参照を一方向更新する (前例: v3.0 → v3.1)。

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
