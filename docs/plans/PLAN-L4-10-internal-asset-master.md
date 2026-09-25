---
plan_id: PLAN-L4-10-internal-asset-master
title: "PLAN-L4-10 (Master): 内部資産 (subagent/skill/command) UT-TDD 化の L4 基本設計増分"
kind: design
layer: L4
sub_doc: architecture
drive: fullstack
status: confirmed
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "L4 internal asset master closure. L4-11/12/13 are paired to L9, decomposed through L5-05/06/07, and remaining algorithmic detail is explicit L6/L7 carry."
created: 2026-06-01
updated: 2026-06-01
owner: PM (Opus) / PO (人間)
master_hub: true
agent_slots:
  - role: tl
    slot_label: "TL — 内部資産 TS 統制境界 (層1 markdown / 層2 TS) の設計レビュー (別 runtime)"
generates:
  - artifact_path: docs/plans/PLAN-L4-10-internal-asset-master.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-00-master.md
  requires:
    - docs/design/harness/L1-requirements/functional-requirements.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L4-basic-design/function.md
    - docs/migration/internal-asset-inventory.md
  references:
    - docs/plans/PLAN-RECOVERY-01-internal-asset-recovery.md
    - docs/migration/helix-porting-map.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/governance/recovery-workflow.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L4-10 (Master): 内部資産 UT-TDD 化の L4 基本設計増分

## §0 位置づけ

Recovery (PLAN-RECOVERY-01) Step 4 後半 = **L4-L6 設計増分**の L4 Master hub。L1/L3 に追加した **FR-L1-46〜49** (BR-22 派生: subagent roster / skill pack curate / command CLI 化 / 内部資産 drift lint) を L4 基本設計に落とす。既存 L4 sub-doc (architecture/function) への**増分**であり、新規 sub-doc は起こさない (内部資産は方式設計 = architecture/function の範囲)。

> **構造位置づけ (A-90、L4 統合)**: 本 PLAN は **PLAN-L4-00-master の sub-master (child hub)** であり、L4 PLAN ツリーの根は **PLAN-L4-00-master 単一**。当初 parent = PLAN-RECOVERY-01 (Recovery 起点) だったため L4-00 と並列の独立 root になっていた問題 (G4 再 audit スコープ曖昧 / data.md 取り残し) を、parent を L4-00 へ付替えて解消 (REC-001 は references で Recovery trace 保持)。本 PLAN の child = PLAN-L4-11/12/13。L4 全体 (data/architecture/function/external-if 4 sub-doc + 内部資産増分) は **PLAN-L4-00 §5 の G4 全体再 audit** で一括判定する。

### §0.1 L 内 PLAN と成果物の定義 (PO 確定 2026-06-01)

- **L 内の PLAN = その層の内部構造を「どこまでドキュメント化するか」を決める計画** (スコープ/分割/起こす sub-doc/粒度の triage)。PLAN 自体は設計書ではない。
- **成果物 = 設計書 (① 左) + 対のテスト設計書 (③ 右) のペア** (V-model、必ず対)。L4 → 基本設計書 (architecture/function) + L9 総合テスト設計 / L5 → 詳細設計書 + L8 結合テスト設計 / L6 → 機能設計書 (=仕様設計) + L7 単体テスト設計。実装コード (②) / テストコード (④) は L7 実装スプリントの別物。
- **仕様未確定で対のテスト設計が書けない項目は、その旨と依存を明示記載する (PO 指示)**: テスト設計は仕様が決まって初めて書けるため、L4 段階で下位仕様 (L5/L6 確定分) に依存して書けないテスト観点は、**黙って飛ばさず「どの層で何が確定したら書けるか」を placeholder + 依存条件として残す**。既存 L8/L9 の "placeholder skeleton — 設計確定に伴い物質化" を一段強め、**未確定項目と待ち先を列挙**する。
- **機能設計からテスト設計を作りに戻ってよい = back-fill 許可 (PO 確定 2026-06-01)**: 上記の未確定項目は、**L6 機能設計 (=仕様設計) で仕様が確定した時点で、その L6 を起点に対応するテスト設計 (L7 単体、必要に応じ遡って L8/L9) を作りに戻ってよい**。V-model を厳密な一方向の滝にせず、**仕様が固まった層からペア (設計 ⇔ テスト設計) を後追いで完成させる back-fill を正規運用とする**。L4 で placeholder + 依存を残す (上記) ⇔ L6 で仕様確定 → テスト設計を back-fill、の 2 つは対。back-fill した時は元の placeholder の依存条件を解消済みに更新し、ledger に記録する。
- **整合は最終的に V-model 状態として整う = DB(state) 側で機械保証する (PO 確定 2026-06-01)**: back-fill は「いつか作る」の放置許可ではなく、**最終的に全ペアが揃った状態 (孤児 0) へ必ず収束する**ことが目的。整合の保証を**人手の注意力に依存しない**。`.ut-tdd/` state (V-model 正本 DB) が「入るべき設計⇔テスト設計ペア」を `pair_artifact` + `trace.edges` (physical-data §2.2) として保持し、**未充足 (placeholder 未解消 / pair edge 欠落 / 逆ピラミッド) を `ut-tdd doctor` / vmodel lint / G6-G7 が fail-close で検知** (physical-data §7 不変条件の物理検証点)。入るべきところが入っていなければ DB 側から error が上がり続け、back-fill で解消するまで状態が整わない。FR-L1-49 内部資産 drift lint も同じ機構 (IMP-033 rule engine、未充足検知の rule 型) に接続する。

## §1 TL 確定境界 (本設計の前提、2026-06-01 real Codex TL)

「内部資産を TS に作り替える」の射程を TL が確定:

| 層 | 内容 | TS 化方針 |
|---|---|---|
| **層1 資産の中身** | subagent prompt 本文 / skill 知識本文 | **markdown 正本** (Claude Code native 規約 `.claude/agents/*.md` を維持)。TS literal 化は非推奨 (native 規約破壊 / 二重管理) |
| **層2 管理機構** | roster registry / skill catalog・recommender・injector / capability resolver / drift lint / guard | **TS/Bun** (ADR-001 射程)。single source = markdown を TS が検証/注入/統制 |

**single source = markdown**。TS は生成でなく **検証/注入/統制**のみ (Q3)。FR-L1-49 drift lint と整合 (「正本 .md に HELIX 前提が残っていないか fail-close」)。

## §2 triage (FR-L1-46〜49 → L4 設計項目)

| FR-L1 | 内容 | L4 設計先 | child PLAN |
|---|---|---|---|
| **FR-L1-46** | subagent roster の UT-TDD 化 (capability class / model family / guard 統合 / HELIX 前提除去) | architecture §3 に `roster` 概念 + runtime building block 拡張 / function に roster 機能 | **PLAN-L4-11-roster** |
| **FR-L1-47** | skill pack の UT-TDD curate (UT-TDD 版 SKILL_MAP / core-optional-drop / CLI trigger / helix 用語除去) | architecture §3 に `skills` building block 新設 / function に catalog-injector | **PLAN-L4-12-skill-pack** |
| **FR-L1-48** | 内部資産 command の ut-tdd CLI subcommand 化 | function の CLI コマンド表に追加 (dashboard/asset/builder 等、command=W11/W12/W16) | (L4 は PLAN-L4-11 に統合 → **L5 で module 結合粒度 → L6 で単体粒度**に段階分解) |
| **FR-L1-49** | 内部資産 drift lint (HELIX 絶対パス残存 / docs-skills 空 / roster↔guard 整合) | architecture §3 lint building block + ADR-004 Consequences。IMP-033 rule engine インスタンス | **PLAN-L4-13-drift-lint** |

> **粒度基準 (PO 確定 2026-06-01) — V-model ペア原則: 設計の粒度 = テスト設計の粒度。L4→L5→L6 で段階的に細かくする (L5 を飛ばさない)**:
> - **L4 基本設計 ↔ L9 総合テスト設計** = システム粒度 (束ねる)
> - **L5 詳細設計 ↔ L8 結合テスト設計** = module 結合粒度 (中間分解)
> - **L6 機能設計 ↔ L7 単体テスト設計** = 関数 = 単体粒度 (最終分解)
>
> command (FR-L1-48) を **L4 で PLAN-L4-11 (roster) に束ねるのは可** = L4 は L9 総合テスト粒度で「内部資産 command 群が CLI として動く」を 1 system 観点で検証できるため。そこから **L5 詳細設計で module 結合粒度に中間分解** (command module の公開 IF / module 間結合 = L8 結合テスト粒度) → **L6 機能設計で各 subcommand (`ut-tdd dashboard` / `ut-tdd asset` / `ut-tdd builder` 等) を単体テスト設計 (L7) 粒度に最終分解**する。**L4→L6 と飛ばさず L5 を必ず挟む** (PO 訂正 2026-06-01)。PM の往復回避都合でなく、各層のペア粒度で段階判定する。

## §3 ADR-004 起票 (本 Master の大局判断 artifact)

ADR 起票ルール (architecture §7「L4 方式設計 sub-doc は ADR を必須 artifact」/ design template §6「大局判断ある場合」/ ADR-002-003 の前例「構造の根幹・将来必ず参照・固定しないと前提ズレ再発」) に照らし、**層1/層2 境界は ADR 起票基準を満たす** (PO 確認済 2026-06-01):

- 大局判断 = ○ (層1 markdown / 層2 TS 統制の境界は構造の根幹)
- 将来必ず参照 = ○ (roster/catalog/recommender/injector/drift-lint 全判断の根拠)
- 固定しないと再発 = ◎ (今回の前提抜けそのものの再発防止。ADR-003 が API key 前提ズレ再発防止で起票されたのと同型)

**起票方針**: ADR-004 を**本 L4 設計の artifact として**起票 (ADR=L4 成果物のルール準拠)。ADR-001 は改訂せず ADR-004 `関連` 欄から片方向参照 (accepted ADR は superseded 以外で本文を変えない慣習)。

## §4 実行順 (child)

```
ADR-004 (内部資産 TS 統制境界 = 層1/層2) ── 本 Master の大局判断 artifact、最初に確定
   │
   ├─→ PLAN-L4-11-roster (subagent roster + command CLI、FR-L1-46/48)
   ├─→ PLAN-L4-12-skill-pack (skill catalog/injector + curate 設計、FR-L1-47)
   └─→ PLAN-L4-13-drift-lint (内部資産 drift lint、FR-L1-49、IMP-033 rule)
```

1. **ADR-004** 起票 (層1/層2 境界、TL 確定を ADR 化)
2. **PLAN-L4-11-roster** (roster registry + capability class + command CLI、architecture/function 増分)
3. **PLAN-L4-12-skill-pack** (skills building block + catalog/recommender/injector、curate 計画)
4. **PLAN-L4-13-drift-lint** (drift lint 検査項目、FR-L1-49、ADR-004 Consequences に接続)

各 child は V-pair = L9 総合テスト設計 (L4↔L9 集合 pair)。

## §5 carry (Recovery / TL 由来)

- TL 次アクション: ADR-004 草案 / ADR-001 参照追記 / FR-L1-49 drift lint 検査項目 / subagent 19 + skill curate を L3/WBS 分解
- porting-map W6/W7 (subagent harden) / W10 (skill curate) を child の後続実装 PLAN に接続
- L5/L6 増分: roster/catalog の関数 signature + pseudocode (module-decomposition / internal-processing / function-spec に増分)
- drift lint は **IMP-033 cross-check rule engine の rule 型インスタンス** (gate-design §5、新規 lint を手書きせず rule 登録で実現)

## §6 DoD (Master 完了条件)

- [x] ADR-004 (内部資産 TS 統制境界) 起票 + accepted (TL/PO)
- [x] §2 の child PLAN 3 件起票 (roster / skill-pack / drift-lint)
- [x] architecture §3 に skills building block + roster 概念を増分
- [x] function に内部資産機能 (roster / catalog / injector / drift-lint / command) を増分
- [x] FR-L1-46〜49 が L4 設計に trace 接続 (g3-trace 維持)
- [x] **粒度条件 (PO 2026-06-01)**: L4 で束ねた項目 (command を roster に統合等) が **L5 詳細設計で module 結合粒度 → L6 機能設計で単体テスト設計 (L7) 粒度に段階分解可能** (L4→L6 と飛ばさず L5 を挟む) であることを各 child §carry に明記。分解不能なら L4 child を分ける
- [x] **ペア成果物 + 未確定依存明示 (PO 2026-06-01)**: 各 child は 設計書 (①) + 対のテスト設計 (③) をペアで出す。**仕様未確定で対のテスト設計が書けない項目は、黙って飛ばさず「どの層 (L5/L6) で何が確定したら書けるか」を placeholder + 依存条件として §carry に列挙**する
- [x] self-review (pmo-sonnet / code-reviewer) 通過
- [x] **trace 注記 (self-review Important-3)**: child が generates する L4 設計書 (function.md / architecture.md) は Master の `requires` に列挙済。child PLAN の generates に増分先設計書を明示し、g3-trace / trace-bidir が「FR-L1-46〜49 → child → 設計書 → L9 ペア」を連鎖検証できる構造とする (PLAN-L4-11 = function+architecture / L4-12 = architecture / L4-13 = architecture)
- [x] 全 child 完了で Recovery Step 5 fullback (Forward L4→L5→L6→L7) へ
