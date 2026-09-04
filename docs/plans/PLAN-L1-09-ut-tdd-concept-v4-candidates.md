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
git show b2772064:docs/governance/vmodel-upgrade-schedule.md | grep -c "| yellow \| draft"      # 非 green / 非 confirmed 59 行 / 120 行
```

charter §4 の後続テーマ 8 本と VUP-REQ-01〜10 に、**構造化正本と generated view (A)、複数人間ユーザーの
チケット / lease (B-①②)、人間へのナレッジ還流 (B-③)、層別 human-on-the-loop 境界** は含まれていない。

### 2.2 チーム協調の欠落は個別 issue として散在する

```bash
gh issue list --state open --limit 100 --json number,title | jq -r '.[]|select(.number==480 or .number==384 or .number==426 or .number==421)|"\(.number) \(.title)"'
```

#480 (PLAN 採番の衝突)、#384 / #426 (worktree lifecycle)、#421 (review request の memoryId 分裂) は、いずれも
「作業単位に owner と lease が無い」ことの症状であり、U23 Execution Ledger (PLAN-L4-30 / L6-83〜85 /
L7-436〜439、全 draft・実装 0) が契約の受け皿だが複数人間ユーザーを前提にしていない。

### 2.3 正本形式の現状

```bash
git show b2772064:docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md | grep -n "DB は authored source を直接置換しない"
git ls-tree -r --name-only b2772064 docs/plans | wc -l   # 951 PLAN (markdown)
```

typed spec IR (U8〜U12) は confirmed だが対象は宣言部のみ。record 類 (verdict / receipt / evidence) は
`.ut-tdd/review/receipts/*.json` のように既に JSON で、PLAN / schedule は markdown である。

## 3. 設計判断

### 3.1 正本の置き場 (advisor design、claude-fable-5、2026-09-04)

| 案 | 内容 | 評価 |
|---|---|---|
| 1 | markdown 正本を維持し typed block を拡張、双方向 projection を追加 | 双方向書き戻しが lossy。ticket を markdown にすると conflict 率は下がらない |
| 2 | 正本を構造化 JSON/YAML へ全面移行、markdown は view | 951 PLAN の big-bang 移行、人間の diff review 性を損なう。却下 |
| **3 (採択)** | **artifact class 別 hybrid**: narrative は markdown 正本 + typed block、record (チケット / schedule / verdict / receipt / evidence) は 1 record = 1 file の構造化正本、view は generated | conflict が record 単位に局所化、charter §5 第 7 項と整合、既存 spec IR 経路を流用 |

concept 規則: 「正本形式は artifact の主読者で決める。双方向書き戻しは構造化正本に対してのみ admission 経由で
許し、markdown 正本への機械書き戻しは行わない」(候補 concept §原則 6、UTV4-FR-006〜009)。
残リスク: PLAN frontmatter の record 化は専用 Reverse 対で段階移行 (UTV4-FR-007)、generated view の hash gate
(UTV4-FR-008)、U23 との重複は改訂で吸収し新規起票しない (UTV4-FR-004)。

### 3.2 参照元構想 v4.0 からの採否

採る: Sovereignty / Change Contract Compiler / Control Plane / Assurance Kernel / Evidence Ledger / Adaptation の
6 Plane、8 原則のうち 7 (Composable Release は既存 Pack 配布契約へ写像)、exactly-one owner、lease / fence、
startup packet、evidence の段階 (claimed → current)、GitHub を projection とする一方向同期。
採らない: Python 恒久意味コア (ADR-001 と衝突)、多軸分類 registry による routeFiling 置換
(別 version-up)、repository / CLI の rename。

### 3.3 候補文書の置き場

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

## 5. 完了条件

- [ ] 4 候補文書が cross-review PASS を受け、main に候補として存在する。
- [ ] PO 承認 record が typed provenance で残る (memory / chat / AI 解釈から生成しない)。
- [ ] 承認後の昇格・参照更新が 1 PR で行われ、rule-drift / read order gate が green。
- [ ] 既存 authority との重複・矛盾検査 (VUP-REQ-01〜10、BR-01〜08、U23、PLAN-L6-63 系) の結果が本 PLAN に記録される。

## 6. Scope boundary

本 PLAN は候補の materialize と分解のみを行う。runtime 実装、CLI / `.ut-tdd/` state の変更、DB schema 変更、
951 PLAN の移行、Issue の意味正本化は行わない。
