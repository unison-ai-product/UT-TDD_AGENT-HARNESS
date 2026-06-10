# A-102 — G4 add-design freeze: workflow オーケストレーション外部設計 (2026-06-05)

> runtime audit 記録 (gitignored)。正本は gate-design.md §2.1 A-102 注記 + 本 doc。A-101 (L4 core freeze) の後続。

## 判定

**G4 add-design freeze 可 — 4 軸すべて PASS** (intra_runtime_subagent = code-reviewer、claude-only mode、I-1/I-2 指摘修正後)。

## 背景 (なぜ)

A-101 (L4 core G4 freeze) 後、PO 指示で要件→基本設計の**粒度監査**を実施 (pmo-project-explorer = coverage/altitude、pmo-sonnet = grounding)。結果:
- coverage ✅ (26 FR orphan 0) / altitude 上方向 ✅ (over-design 1 minor) / grounding ✅ (Important 1 = IMP-070)。
- **altitude 下方向に under-design 2 件 (Important)**: ① workflow mode 群 (FR-14/15/16/23/26/29/30) ② FR-12 skill が function §3 で「将来 workflow module (L7 carry)」一括 defer = 外部設計判断なし。
- PO 判断: harness は別プロダクト開発の**基盤**でありオーケストレーション設計が薄いのは「doc 前提 × 機械処理厳格化」思想に反する → **改善して L4 完遂** (案 2)。

## スコープ (add-design PLAN-L4-05)

- **対象**: function.md §3 (workflow オーケストレーション外部設計) ⇔ L9 ST-FUNC ペア。
- **非対象 (defer、§3.6 明示 carry)**: CLI signature (L5) / 状態遷移 pseudocode (L6) / orchestration_mode cell matrix (requirements) / 30-cell matrix (requirements) / recovery 再発防止 schema (後続) / G8-G14 機械条件 (IMP-052)。これらは正規 defer = under-design ではない。

## G4 audit 4 軸

| 軸 | 判定 | 根拠 |
|---|---|---|
| A1 上流 trace | PASS | function §3 が FR-12〜16/23〜30 を外部設計化、orphan 0 維持 (新規 FR なし、§7 FR registry delta なし) |
| A2 DoD | PASS | PLAN-L4-05 §8 DoD 全 8 項目 met。altitude = 外部設計 (what)、defer は §3.6 明示。L5 降下適性あり |
| A3 V-pair 孤児0 | PASS | L9 ST-FUNC を §3 新設計要素に対しペア deepening (ST-FUNC-01 遷移 / 01b Forward 合流 / 04 routing 全順序 / 05 mode↔kind / 06 サインオフ / 07 skill)。pair-freeze lint 30 pair 孤児0 (doctor exit 0) |
| A4 sub-doc 整合 | PASS | mode↔kind・routing・Forward 合流が concept §2.5/§2.6/modes/README §3 と整合。external-if §7 (what/how 境界) と function §3.6 (L5 defer) 二重定義なし。IMP-069/070 解消 |

## reconcile / cleanup

- **IMP-069 (mode taxonomy)**: PO「Forward=spine」確定。operational 正本 = Forward spine + 9 駆動モデル (= modes/ dir、Research 含む) + 2 工程専門。concept §2.5 legacy framing (Forward+8、Research 除く) とは同一 universe の別グルーピングで、橋渡し = modes/README §3。function §3 / concept §2.5 intro / §10.2 glossary (2 新語 + legacy 9-mode 項) を全て bridge 注記で整合。→ backlog IMP-069→resolved。
- **IMP-070 (commander ADR)**: ADR-006 (commander 確定、oclif 却下) 新設 (ADR-005 は distribution で既使用)。architecture §2 floating 注記 + §7 ADR 一覧を ADR-006 参照に更新。→ backlog IMP-070→resolved。

## review 前置 (intra_runtime_subagent = code-reviewer、sonnet)

- 初回 verdict = **REQUEST_CHANGES** (Critical 0 / Important 3 / Minor 4)。
- **I-1 (Research/9-mode 帰属の二重 framing)** → function §3 reconcile 注記 + §2.5 intro + §10.2 (新語/legacy 項) に bridge 注記を追加して解消 (modes/README §3 を橋渡し正本に明示)。
- **I-2 (routing 優先度 P0/P0 曖昧 vs ST-FUNC-04 全順序)** → §3.2 を canonical 全順序 (Incident>Recovery>Reverse>Refactor の 4 失敗 routing rank + 他は固有 signal) へ修正。
- **I-3 (DoD/status)** → freeze step で DoD チェック + status confirmed (本 audit)。
- M-1/M-2/M-4 = minor carry (Refactor 保護網 / ST-FUNC-06 carry 記述 / building block クロスリンク)。M-3 = related_adr は §0 本文で ADR-006 参照済。
- cross-agent 不在 (claude-only) のため intra_runtime_subagent で代替 (evidence 記録)。

## flip (1 ファイル)

- PLAN: `PLAN-L4-05-workflow-orchestration.md` (`draft → confirmed`)。
- function.md / L9-system-test-design.md は **confirmed 維持** (A-101 で既 freeze、本 deepening を A-102 が bless)。

## 機械証跡

- typecheck 0 / vitest **189 pass** / doctor exit 0 / pair-freeze **30 pair 孤児0**。

## 追補 (§3.6 execution mode 次元、2026-06-05 freeze 後)

PO 問い「オーケストレーション方式は ClaudeCode / Codex / mix の 3 パターン考えられてる?」を受けた honest 検査で、§3.1-§3.5 が **runtime 非依存**で書かれ execution mode 次元を欠く連結 gap を確認。concept §2.1.1 (実行モード 4 種) / §2.1.2.1 (mode 別 review tier 縮退) / §2.6.4 (orchestration_mode × execution mode 結合・縮退規則) は L0 で robust に設計済だが、L4 function §3 に wire されていなかった。

- **追加** = function §3.6「実行モード (3+1 パターン) × オーケストレーション」: hybrid (cross-agent review + worker/reviewer 分散) / claude-only・codex-only (② intra_runtime_subagent hard) / standalone (人間レビュー必須) の 4 パターンで駆動モデル orchestration の review/委譲がどう縮退するか + mode-invariant 人間サインオフ (escalation 境界) + orchestration_mode 注入縮退 (cell 値は requirements defer 継続)。
- 既存 carry §3.7 (旧 §3.6) の orchestration_mode 行を「注入機構・縮退規則は §3.6 設計済、defer は cell 具体値のみ」へ精緻化。
- L9 ペア: ST-FUNC-06 (mode 別 review tier 追加) + ST-EXT-02 (degradation、既存) に接続、§2 量閉じ更新。
- 性質 = 既存 concept 設計の L4 反映 (新規発明でなく wiring)。altitude 維持 (cell 値 defer)。検証 = typecheck 0 / vitest 189 / doctor exit 0。

## Next

- L5 詳細設計 (PLAN-L5-00-master) を Forward で降下 → G5。IMP-069 確定済のため mode カウントは operational 正本 (Forward spine + 9 + 2) に従う。
- minor carry (M-1/M-2/M-4) は L5/L6 deepening 時に解消。
