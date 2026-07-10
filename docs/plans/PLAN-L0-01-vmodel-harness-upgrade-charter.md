---
plan_id: PLAN-L0-01-vmodel-harness-upgrade-charter
title: "PLAN-L0-01 (charter): clean Vモデル設計を起点にした Harness 全面バージョンアップ企画"
kind: charter
layer: L0
drive: fullstack
status: draft
owner: PO / TL
agent_slots:
  - role: po
    slot_label: "PO — バージョンアップ企画の目的・非破壊境界・全面見直し範囲の承認"
  - role: tl
    slot_label: "TL — 現行 harness と clean ZIP の差分評価、最小影響の Forward 再設計ルート確定"
  - role: qa
    slot_label: "QA — 右肺/検証/工程管理表/閉包 gate の受入条件定義"
  - role: aim
    slot_label: "AIM — DB 投影・検出・起票・レビュー workflow への接続設計"
generates:
  - artifact_path: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - PLAN-REVERSE-44-roadmap-definition-design
    - PLAN-L7-44-harness-db-master
    - PLAN-L6-26-domain-boundary-lint
    - PLAN-L6-27-invariant-test-trace
    - PLAN-L6-31-cross-artifact-relation-graph
  blocks: []
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/process/forward/overview.md
    - docs/process/modes/version-up.md
    - docs/design/harness/L4-basic-design/data.md
    - docs/design/harness/L4-basic-design/function.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/plans/PLAN-RECOVERY-10-right-lung-quality-assurance.md
---

# PLAN-L0-01: clean Vモデル設計を起点にした Harness 全面バージョンアップ企画

## 0. 目的

`Vモデル設計ドキュメント_checked.zip` を上流設計素材として、現行 UT-TDD Agent Harness を全面的に
バージョンアップする。これは既存 harness の正本・CLI・DB・workflow を壊して作り直す企画ではない。
既存の TypeScript/Bun core、`.ut-tdd/harness.db`、PLAN/frontmatter、doctor/lint、Forward spine を
活かしながら、Vモデルの現在地把握・駆動モデル選択・宣言型データ取込・DDD/保守性設計を上流から
再凍結する。

起票日: 2026-07-08。

この PLAN は L0 企画であり、実装や正本本文の直接更新は行わない。後続の L1 要求、L3 要件、L4/L5/L6
設計、L7 実装、L8-L14 検証 PLAN を束ねる親チケットとして機能する。

## 1. 前提整理

### 1.1 現行 harness の成立済み資産

| 領域 | 現状 | 活かす理由 |
|---|---|---|
| Forward spine | `docs/process/forward/overview.md` で L0-L14 と V-pair を正本化済み | 全面見直しの背骨として再利用できる |
| 右肺入口 | `PLAN-RECOVERY-10` で `kind=verify` と L8-L14 envelope が着地済み | 検証側を新規 taxonomy で作り直す必要はない |
| 工程管理表 | `PLAN-REVERSE-44` で roadmap/program rollup の概念と doctor surface を確立済み | 現在地把握の土台として拡張可能 |
| harness DB | ADR-001/ADR-007、`PLAN-L7-44` 系で SQLite projection を採用済み | 宣言型データを取り込む受け皿がある |
| DDD/TDD 厳格化 | `PLAN-L6-26..31` で domain boundary / invariant / relation graph を設計済み | clean ZIP の DDD 強化を既存方針へ接続できる |
| version-up mode | `PLAN-DISCOVERY-09` / `docs/process/modes/version-up.md` で将来版保全を定義済み | 大改修を parked/activated の二段階で扱える |

### 1.2 clean ZIP の確認結果

2026-07-08 のローカル確認で、clean ZIP は素の新規展開と ZIP 内ファイル数が一致した。
旧 ZIP は作業対象から外し、ローカルから削除済み。

| 確認 | 結果 |
|---|---|
| ZIP 内ファイル数 / 新規展開ファイル数 | 572 / 572 |
| `verify_files.py` | UTF-8 不正 0、置換文字 0、YAML 壊れ 0 |
| `build.py validate` | 定義ID 91 / 参照ID 96、未定義・未参照なし |
| `build.py check` | 構造的矛盾 0 |
| `build.py coverage` | 100.0% |
| `build.py deps` | 依存エッジ 116 |
| `spec_check.py` | 要求→要件→設計→テストの閉包漏れなし |
| `spec_types.py` | 型宣言 91 件 / ヒューリスティック検出 91 件で完全一致 |
| `spec_trace.py` | 宙吊り、逆流、テスト欠落、台帳不一致なし |
| `schedule.py` | V字対、先行、日程、進捗、採用、RAG 整合 OK |
| `build.py detect --profile` | PoC / Web / Standard / Enterprise すべて対象内矛盾なし |

### 1.3 clean ZIP から取り込む中核

| clean ZIP の中核 | Harness での意味 |
|---|---|
| 工程管理表 / schedule | L1-L12 相当の現在地、先行関係、V字対、進捗、RAG を人間とAIが同じ台帳で読む |
| `spec.defines` | 要求・要件・設計・テスト・ドメイン要素を宣言型IDとして扱う |
| `spec_trace` / `spec_check` | ファイル探索ではなく、宣言と台帳の閉包として欠落・逆流・テスト未接続を検出する |
| `activation` | 全書面作成を強制せず、宣言元 / 詳細化 / 記述を分け、正本IDへの接続で粒度を合わせる |
| `profiles.yaml` | PoC / Standard / Enterprise / Web 等で対象書面・粒度を切り替える |
| DDD/オブジェクト指向設計 | 集約、値オブジェクト、不変条件、契約を設計時点で強め、保守性・拡張性を先に作る |

## 2. 現状との差分

| 改善軸 | 現行 harness | clean ZIP から見える不足 | バージョンアップ方針 |
|---|---|---|---|
| 現在地把握 | roadmap/program rollup はあるが、工程表と駆動モデル選択がまだ局所的 | 工程・V字対・進捗・RAG が一体化されている | 工程管理表を PLAN/DB/doctor/status の共通入力にする |
| 駆動モデル選択 | route signal → mode はあるが、現在地・リスク・工程表との結合が弱い | Lごとのリスクで駆動方向を選ぶ思想が明確 | 工程表上の現在地 + リスク所在で mode/drive を厳格化する |
| 右肺 | `verify` kind は入ったが、検証結果から品質改善へ戻る統合戦略は初期段階 | 検証側が schedule/trace/RAG と接続されている | L8-L14 の検証 PLAN を DB projection と defect_routing に接続する |
| 宣言型データ | frontmatter / relation graph / harness.db はあるが、設計ID宣言の正本化は未統一 | `spec.defines` が検出の正本になっている | `spec.defines` 相当を UT-TDD の design IR / DB 投影へ段階導入する |
| 検出系 | lint/doctor がファイル・frontmatter・DB projection を横断するが、検出面が散在 | 型宣言、閉包、activation、schedule が一体の検出面 | 検出を「履歴と関係を持った harness.db query」に寄せる |
| DDD/保守性 | L4 data と DDD/TDD strictness は存在する | オブジェクト指向型の設計強化を設計書群全体へ張る必要 | 集約/VO/契約/不変条件を既存 docs 全体の設計規約に昇格する |
| 既存文書 | 正本 doc は多いが更新履歴が長く、古い前提も混在 | clean ZIP は 107 文書をプロファイル/activation で束ねる | 全文書一括編集ではなく、上流から freeze し直して波及更新する |

## 3. 最小影響のアップデート境界

最初のアップデートは **新規 L0 charter 起票のみ** とし、既存設計・実装・テスト・DB schema を変更しない。
理由は次の通り。

1. clean ZIP の設計は上流概念から DB/検出/DDD/検証まで広範囲に波及するため、L7 から直接入ると局所最適になる。
2. 既存 harness には `verify`、roadmap、harness.db、DDD/TDD strictness という受け皿が既にあるため、破壊的な新体系は不要。
3. 既存ドキュメント全部の見直しが必要になるため、最初に変更境界と順序を PLAN として固定しないと、差分が散らばる。
4. clean ZIP 自体は外部素材であり、repo 正本へ取り込むには UT-TDD の TypeScript/Bun / docs / DB projection 境界へ翻案する必要がある。

したがって本 PLAN は、後続の改修を以下の順に分割する。

| Wave | 目的 | 主な成果物 | 影響 |
|---|---|---|---|
| U0 | 上流再企画 | 本 PLAN、PO/TL 承認、後続PLAN束ね | docs/plans 1 本のみ |
| U1 | 要求・要件再凍結 | L1/L3 の要求・要件へ「工程表・宣言DB・検出・DDD強化」を追加 | governance/design docs |
| U2 | 工程管理表の厳格化 | roadmap/program rollup を現在地・駆動モデル選択・右肺着手可否へ接続 | docs + lint/doctor 設計 |
| U3 | 宣言型 design IR | `spec.defines` 相当の schema、DB projection、閉包検出設計 | schema / state-db / lint |
| U4 | 検出系DB化 | findings / quality_signals / trace_edges / activation を query 可能にし、起票補助へ返す | state-db / doctor / review |
| U5 | DDD/OOP設計強化 | 集約・値オブジェクト・契約・不変条件を既存 docs 全体に展開 | L4-L6 docs + tests |
| U6 | workflow/PLAN改修 | PLAN 自体を資産として残せる構造へ再設計し、activation/profile に対応 | plan lint / templates / docs |
| U7 | 右肺閉ループ | L8-L14 verify evidence → defect_routing → refactor/reverse/add-feature へ接続 | verify / DB / workflow |

## 4. 後続PLAN化する具体テーマ

| テーマ | 推奨 kind/layer | 既存 PLAN との関係 |
|---|---|---|
| `harness-vmodel-upgrade-requirements` | design / L1-L3 | 本 PLANから要求・要件を起こす |
| `roadmap-drive-selection-hardening` | add-design / L4-L6 | PLAN-REVERSE-44 の工程表メタモデルを拡張 |
| `declarative-spec-ir-db-projection` | add-design + add-impl / L4-L7 | PLAN-L7-44 harness.db 系へ追加 |
| `spec-trace-closure-gate` | add-design + add-impl / L5-L7 | PLAN-L6-31 relation graph と統合 |
| `activation-profile-scope-gate` | add-design + add-impl / L4-L7 | version-up / profile / parked の誤認防止 |
| `ddd-oop-design-strengthening` | add-design / L4-L6 | PLAN-L6-26/27 の DDD/TDD strictness を上流化 |
| `plan-asset-format-redesign` | add-design + add-impl / L5-L7 | PLAN lint / template / review evidence の再設計 |
| `right-lung-quality-loop-db` | add-design + add-impl / L6-L8 | PLAN-RECOVERY-10 の右肺を DB/defect routing に接続 |

## 5. 受入条件

- [ ] PO/TL が「clean ZIP は上流設計素材であり、現行 harness の正本を直接置換しない」ことを承認する。
- [ ] 現行 harness の受け皿 (`verify` / roadmap / harness.db / DDD/TDD strictness / version-up) と clean ZIP の中核対応が本 PLAN で説明されている。
- [ ] 旧 ZIP は作業対象から外れ、clean ZIP の確認結果のみを根拠にする。
- [ ] 後続改修は U1→U7 の順で、上流から再凍結して進める。
- [ ] 既存 docs 全部の見直しは一括置換でなく、activation/profile/trace closure に基づく差分更新として扱う。
- [ ] DB は authored source を直接置換しない。設計・PLAN・test-design を正本とし、harness.db は projection / detection / query surface として使う。
- [ ] 工程管理表は人間向け進行台帳であり、AI の PLAN オーケストレーションと分離しつつ DB projection で接続する。

## 6. 未決事項

| 未決 | 判断者 | 判断基準 |
|---|---|---|
| `spec.defines` 相当を frontmatter に置くか、doc body の `spec:` block に置くか | TL/SE | 既存 frontmatter schema との衝突、diff の見やすさ、DB projection 容易性 |
| 工程管理表を既存 `roadmap:` block へ拡張するか、新しい schedule projection にするか | TL/QA | 既存 doctor/program rollup の再利用度 |
| activation/profile を PLAN status とどう分離するか | PO/TL | active draft / version-up parked / scope NA の誤認防止 |
| DDD/OOP 強化を L4 data 主導にするか、L5/L6 class-design 主導にするか | TL/SE | 保守性・拡張性の設計時担保と既存 docs への波及量 |
| clean ZIP の 107 文書を UT-TDD の文書体系へどの粒度で対応付けるか | PO/TL/Docs | 全文書作成強制を避け、activation で必要粒度に合わせる |

## 7. 実行メモ

- 旧 ZIP は作業対象外。今後の比較・引用は clean ZIP の確認結果のみを使う。
- clean ZIP の Python tooling はそのまま product runtime に移植しない。ADR-001 に従い、UT-TDD 側は TypeScript/Bun core と `.ut-tdd/harness.db` projection へ翻案する。
- この PLAN は `draft` のまま PO/TL 承認を待つ。承認後、U1 の L1/L3 要求・要件PLANから着手する。

## U11 型付きスペック所有 artifact

```yaml
spec:
  defines:
    - id: VMS-001
      kind: upgrade-charter
      traces_to: [VMS-002, VMS-003, VMS-004]
      tests: [TVMS-001]
```

VMS-001 は version-up charter の所有 artifact で宣言される typed spec である。
