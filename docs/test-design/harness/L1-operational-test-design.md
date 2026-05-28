# UT-TDD Agent Harness — L1 運用テスト設計 (③ / OT-*)

> **layer**: L14 (運用検証) / **artifact**: ③ 運用テスト設計 (W-model 右、① L1 全 sub-doc と対)
> **pair (W-model L1↔L14)**: `../../design/harness/L1-requirements/{business,functional,screen,technical,nfr}-requirements.md` の 5 sub-doc 全体 ↔ 本書 1 doc (V2 HELIX-workflows 正本に従い、L1 = 5 sub-doc 構造、運用テスト設計は L14 pair として 1 本)
> **status**: draft (① と対で G1 pair freeze 予定。BR-07/08・NFR-08 対応 OT は ① 同様 draft。5 sub-doc 化に伴う OT 追加は別 commit で量閉じ拡張)
> **PLAN**: `../../plans/PLAN-L1-{01..05}-*.md` Step 5 / DoD (5 PLAN すべての DoD で本書を参照)
> 方針: **軽量** (完全性レビューは課さない)。各 BR / FR-L1 / SR / TR / NFR は最低 1 OT に対応させ孤児要求を作らない (量閉じ)。OT は「運用で何を観測すれば満たされたと言えるか」の検証観点であり、実装テストコード (L7/単体) ではない。
> v1.2 構造化: 本書は v1.2 で 5 sub-doc 全体の pair 凍結相手として位置付け直された (構想書 §3.1.2.1)。OT は sub-doc 横断で粒度が変わらないため、引き続き **L14 で 1 本** の運用テスト設計とする (HELIX-workflows 正本でも L14 = 単一 doc)。

## 0. 量閉じ原則 (L1↔L14)

- 全 BR-01〜08 は **1 つ以上の OT に被覆**される (孤児業務要求 = 0)。
- NFR / UX / 成功条件は OT を共有または専用 OT で被覆し、§3 で対応を一覧する。
- 「合否目安」は L14 運用で観測する pass 条件の方向であり、数値しきい値の確定は L3 AC / L12 受入テストへ送る。

## 1. 運用テスト (OT-*)

| OT-ID | 検証する要求 | 運用検証観点 (何を観測するか) | 合否目安 |
|-------|-------------|------------------------------|----------|
| **OT-01** | BR-01 | 1 案件を L0-L14 通しで回し、設計⇔実装⇔テストの 4 artifact trace が切れず、各 gate を通過して完走する | 通し 1 周で trace 断絶 0 / gate silent pass 0 |
| **OT-02** | BR-02 | 複数人 (PO + レビュアー + AI 実装) が日常 PR を出し、gate・レビュー・役割境界が無理なく回る | PR が gate/レビュー経路に乗り、役割逸脱が検知される |
| **OT-03** | BR-03 / NFR-06 | AI に実装委譲した後、既存設計・テストを破壊する変更が回帰検知で止まる (silent に通らない) | 破壊的変更を含む試行が fail-close で block |
| **OT-04** | BR-04 | PoC / 検証成果が契約化を経てから本実装に合流し、契約なしの本実装直行が防がれる | PoC→main 直行が物理 block、契約経由のみ合流 |
| **OT-05** | BR-05 | PLAN を phase-aware ID で起票し、規約違反 (ID 形式 / phase 不整合 / 必須 frontmatter 欠落) が lint で検知される | 規約違反 PLAN が lint で非ゼロ終了 |
| **OT-06** | BR-06 / UX-02 | 複数プロダクト / 案件の工程表・進捗がダッシュボードで横断的に可視化され、詰まり・フェーズが把握できる | 複数案件の進捗が 1 ビューで把握可能 (実現アーキは L2/L4) |
| **OT-07** | BR-07 | 上流 ID 追加 commit に下流対応 ID が無ければ fail-close / 回帰の量的劣化を検知 / 上流→下流 trace 切れを検知 (3 軸。具体指標は L3 送り) | デグレ 3 軸のいずれかが該当する試行を機械検知・block |
| **OT-08** | BR-08 | 大規模 doc 改定・gate evidence 提出・pair freeze の前に doc-reviewer が召喚され、品質観点 (整合/網羅/一貫/明確) が検査される | 該当タイミングで doc-reviewer 召喚 coverage が監査される |
| **OT-09** | NFR-01 | harness の主要コマンド・hook が Windows / macOS / Linux で**ネイティブ動作**する (bash/python3 等の環境依存に阻まれない) | 全 OS 第一級で主要経路が動作 (例: subagent guard は bun で環境非依存動作) |
| **OT-10** | NFR-03 / NFR-04 | standalone / claude-only / codex-only / hybrid の各 mode で動作し、統制対象 repo の言語に依存せず回る | 4 mode × 複数言語 repo で基本フローが成立 |
| **OT-11** | NFR-05 | CI / 証跡 / 権限が GitHub を正本として運用される (ローカル副産物を正本にしない) | gate 証跡・権限が GitHub 上で確認可能 |
| **OT-12** | NFR-08 | 設計 doc が主張する CLI / file / schema に実装状態列があり、虚偽の「実装済」宣言が review / lint で検知される | implementation_status 欠落・不整合が検知される |
| **OT-13** | UX-03 | gate / lint 失敗時に next_action が提示され、CLI 出力が分かりやすく、オンボーディングが滑らか | 失敗時に次の一手が明示される |
| **OT-14** | FR-L1 (functional sub-doc 全般) | HELIX-workflows 由来 FR-L1-01〜35 (P0 18 件) のうち代表 5 機能 (PLAN 起票 / 4 artifact trace / static ゲート / mode 自動 routing / 横断検出) が業務シナリオで実用され、想定通り発火する | 代表 5 機能が運用環境で発火 + 期待動作 |
| **OT-15** | SR-* (screen sub-doc 全般) | L1 画面要求として宣言した画面 (ダッシュボード / PLAN ビュー / Gate ビュー / Audit ビュー / Recovery ビュー 等) が L2 モックで lift され、PO が「これで業務要求を満たす」と判定できる | L2 mock で PO 判定 pass |
| **OT-16** | TR-* (technical sub-doc 全般) | state schema 二層構造 + 工程別 skill 注入機構 + 9 mode 共通基盤 + drift 解消方針 が実装に反映され、HELIX-workflows の「新規 drift 0 件 / week」目標と整合する | 新規 drift 0 件 / week を運用観測 |
| **OT-17** | NFR §7 IPA × ISO 25010 二軸表 | 全 NFR-NN が IPA 大項目 × ISO 25010 特性の二軸でタグ付けされ、対象外特性 (機能適合性 / 使用性) の除外理由も整合 | 二軸表に孤児 NFR 0 / 除外理由が査読 pass |

## 2. 成功条件 (§4) の被覆

| 成功条件 | 被覆 OT |
|----------|---------|
| ① 1 案件を L0-L14 通し | OT-01 |
| ② 複数人 team が日常 PR で gate | OT-02 |
| ③ AI 委譲で回帰が壊れない | OT-03 (+ OT-07 デグレ禁止で強化) |
| ④ 工程表で進捗が見える (専用 UI) | OT-06 |
| ⑤ PoC / 検証成果が契約化されて合流 | OT-04 |

NFR-07 (実務で機能する完成度 = 5 条件総合) は上記 5 行の総合成立で被覆。

## 3. 量閉じ一覧 (要求 → OT 被覆、孤児チェック)

L1 5 sub-doc 構造に再編 (v1.2、v2 HELIX-workflows 正本由来) に合わせ、sub-doc 別に再構成:

### business sub-doc (BR-*) — `docs/design/harness/L1-requirements/business-requirements.md`
- BR-01→OT-01 / BR-02→OT-02 / BR-03→OT-03 / BR-04→OT-04 / BR-05→OT-05 / BR-06→OT-06 / BR-07→OT-07 / BR-08→OT-08。**孤児 BR = 0**。

### functional sub-doc (FR-L1-*) — `docs/design/harness/L1-requirements/functional-requirements.md`
- FR-L1-01〜35 (HELIX-workflows 由来) → **OT-14** (代表 5 機能で 1 件、軽量原則)。
- 詳細な機能要件レベルの受入条件は L3 で FR-* + AC-* として詳細化 (本書は L1 軽量、量閉じ確認のみ)。

### screen sub-doc (SR-*) — `docs/design/harness/L1-requirements/screen-requirements.md`
- SR-* → **OT-15** (L2 モック lift で PO 判定)。
- 画面個別の受入観点は L10 UX 磨き + L11 UAT で詳細化。

### technical sub-doc (TR-*) — `docs/design/harness/L1-requirements/technical-requirements.md`
- TR-* (state schema 二層 / 工程別 skill 注入 / 9 mode 共通基盤 / drift 解消) → **OT-16** ("新規 drift 0 件 / week" 観測)。
- 具体的なアーキ整合は L4 基本設計 / L9 総合テストで確認。

### nfr sub-doc (NFR-*) — `docs/design/harness/L1-requirements/nfr.md`
- NFR-01→OT-09 / NFR-03→OT-10 / NFR-04→OT-10 / NFR-05→OT-11 / NFR-06→OT-03 / NFR-08→OT-12 / **NFR-02→L4 carry (下記、意図的 OT 不立て)**。NFR-07→§2 総合。
- NFR §7 IPA × ISO 25010 二軸表 → **OT-17** (孤児 NFR 0 + 除外理由整合)。
- **NFR-02 (更新性)** は L14 運用での直接観測が弱く、実現方式が L4 ADR 送りのため、ここでは OT を立てず **L4↔L9 pair で被覆** (L1 時点の意図的 carry)。

### UX-*
- UX-01 (価値バランス) = 全 OT の重み付け原則 (§0/価値) であり単独 OT 化しない / UX-02→OT-06 / UX-03→OT-13。

## 4. trace (③ → ①)

本書の各 OT は `../../design/harness/L1-requirements/{business,functional,screen,technical,nfr}-requirements.md` の 5 sub-doc 内の BR-*/FR-L1-*/SR-*/TR-*/NFR-* と相互 reference する (v1.2 で 5 sub-doc 構造に再編、構想書 §3.1.2.1)。G1 (業務要求ゲート) で **5 sub-doc 全体 ⇔ 本書 1 doc** の pair freeze を PO サインオフで確定する。具体しきい値・受入条件は L3 AC / L12 受入テスト設計へ送る。
