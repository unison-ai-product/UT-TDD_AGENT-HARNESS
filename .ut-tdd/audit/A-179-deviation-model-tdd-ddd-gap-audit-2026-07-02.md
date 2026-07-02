# A-179: 駆動モデル逸脱カバレッジ + TDD/DDD 原則ギャップ監査 — 2026-07-02

- 監査種別: アーキテクチャ監査 (A-172〜A-178 系列)。PO 依頼 2026-07-02「Forward 逸脱の想定モデルとして不足は? 設計・工程フローで TDD/DDD 原則から抜けているものは?」
- 方法: route-map 全 14 行 (`src/schema/route-map.ts`) / modes README (§4 routing 表 + TDD-STYLE-DRIVE-FIRING) / ddd-tdd-rules (governance 正本 `docs/governance/ddd-tdd-rules.md` + lint `src/lint/ddd-tdd-rules.ts`) を実読し、宣言と発火実態を突合 (`tdd_red_required` 使用数 grep 等)。
- 処置: 起票のみ。**本監査の起票から正規形 (kind=add-impl + REVERSE pairing) を適用** — PLAN-L7-265 (Codex、confirmed) が backfill pairing の parent 参照を許容し G-15 デッドロックを解消したため。

## §0 結論サマリ

逸脱モデルは「追加する・直す・遡る」が揃い「**減らす・変える**」が空白。TDD は枠組み (pair-freeze / descent / review-after-Green / GWT 粒度 / oracle 強度) が強い一方、**Red-first 強制が発火ゼロ** (opt-in marker 使用 0 本) という「実装済み・発火ゼロ」型の穴が核心。

## §1 所見 — 駆動モデル (Forward 逸脱カバレッジ)

**D-1 [high] 機能撤去・廃止 (deprecation) mode 不在** — 全 mode が accretion か correction を前提。確定済み機能の退役 (FR→設計→テスト→trace→DB projection を整合したまま畳む) を governs する工程が無い。V-model 最終整合 (孤児 0 機械保証) と forward-convergence の下では、場当たり削除が gate 群と正面衝突するため専用モデルが必要。signal token も無い (feature_removal/deprecation/sunset 系ゼロ)。

**D-2 [medium] 凍結後の仕様変更 (spec-change) が未定義** — `po_change` token は add-feature に routing されるが、add-feature mode は「差分追補」であり既存確定挙動の変更 (un-freeze→再 freeze サイクル) を定義していない。IMP-079/080 (freeze 偽装・un-freeze 残骸検出) はこの未定義の症状に対する検出側の継ぎ足し。対応は新 mode でなく add-feature mode doc への「変更」節 + supersede 規律接続。

**D-3 [medium] NFR/性能逸脱の signal 語彙が無い** — `regression_dev` (機能退行→Recovery) はあるが `performance_regression` / `nfr_violation` / `cost_overrun` 系 token ゼロ。NFR グレード AC (PLAN-L4-15) 着地後、逸脱検出→mode routing の行が不在。

**D-4 [medium] セキュリティ脆弱性・外部前提変更の signal 語彙が無い** — retrofit (`dependency_outdated`) と incident (prod) の隙間: 依存 CVE (最新版でも脆弱)、自コードの監査指摘、provider API 仕様変更を受ける token が無い。security-audit agent の所見に routed mode が無い。新 mode 不要、token 追加 + routing 先の PO 確定で足りる。

健全側: interrupt/constraint→forward 行は存在。troubleshoot/recovery/incident の regression 系、reverse の drift 系、retrofit の依存系、discovery の不確実系、design-bottomup、scrum、version-up、research は routing 語彙まで実装済み (A-173 と整合)。

## §2 所見 — TDD/DDD 原則の工程ギャップ

**T-1 [high] Red-first 強制が実質発火ゼロ** — governance 正本に `red-first-evidence` ルール (`red_at <= green_at`、DDD-INV-003、oracle U-DDDTDD-003) と lint 実装が存在するが、トリガーの **`tdd_red_required` marker を付けた PLAN が 0 本** (grep: 定義 PLAN の PLAN-L6-28 自身にのみ文字列が存在)。test-first は一度も機械検証されていない — テスト後書きでも green 証跡は同一に見える。skill 発火 0 (A-178 G-8) と同型の「実装済み・発火ゼロ」。

**T-2 [medium] test_results ingest = 0 行** (A-176 既知の継承) — Red/Green の実行結果が DB に入らず、TDD ループの機械観測が green_commands digest 頼み。T-1 と併せ「Red の実在」を証明する一次データ経路が無い。

**T-3 [low-medium] mutation testing の定常化なし** — oracle 強度は静的検査 (weak matcher / expect 数 / GWT 粒度) 止まり。「テストが欠陥を検出できるか」の変異検証は手動 1 回 (IMP-079 の実証) のみで機構が無い。

**T-4 [low] ubiquitous language の機械化が薄い** — glossary 突合は PLAN frontmatter の `glossary_terms` 自己申告依存。コード識別子 ↔ L0 glossary の照合なし (A-175 未監査領域「glossary/terminology 一貫性」と同根)。

健全側 (抜けでないと確認したもの): pair-freeze (設計粒度=テスト設計粒度)、descent obligation、review-after-Green 順序、境界 drift / invariant oracle / 依存方向 acyclic (DDD 側)、TDD-STYLE-DRIVE-FIRING の mode 別 Red/Green 形定義。

## §3 起票 map (すべて draft、全 7 本に REVERSE pairing/R0 メモ付き、着手は PO 判断)

kind の使い分け: **誠実な設計祖先 PLAN が実在するもののみ正規形 add-impl** (parent + drive 一致、PLAN-L7-265 の parent-pairing 方式)。祖先が無いもの (新 mode 定義等) は偽 parent を作らず kind=impl で起票し **PLAN-L7-263 debt 台帳へ登載、着手時に add-design/add-impl 降下へ昇格** (parent_drive_mismatch を L7-269 で実測し、この使い分けに確定)。

| PLAN | kind | parent | 対応所見 | 骨子 |
|---|---|---|---|---|
| PLAN-L7-269-deprecation-mode | impl (台帳) | — | D-1 | 廃止駆動モデル: mode doc + signal token + 退役手順 (trace/projection 整合) |
| PLAN-L7-270-spec-change-cycle | impl (台帳) | — | D-2 | add-feature mode doc へ「凍結後仕様変更」節: un-freeze→再 freeze + supersede 接続 |
| PLAN-L7-271-deviation-signal-tokens | **add-impl** | PLAN-L7-212 (routing 統治) | D-3, D-4 | NFR/性能/セキュリティ/外部前提の signal token + routing 先 PO 確定 |
| PLAN-L7-272-red-first-activation | **add-impl** | PLAN-L6-28 (Red-first 定義元) | T-1 | tdd_red_required の発火化 (不在 surface → 既定 ON) + red_at/green_at 運用経路 |
| PLAN-L7-273-test-results-ingest | **add-impl** | PLAN-L7-44 (harness-db master) | T-2 | vitest 実行結果の DB ingest (0 行解消、Red/Green 一次証跡) |
| PLAN-L7-274-mutation-oracle-hardening | impl (台帳) | — | T-3 | 変異検証の定常化 (最小変異 + 定常発火点) |
| PLAN-L7-275-glossary-code-consistency | impl (台帳) | — | T-4 | 識別子 ↔ L0 glossary 突合 lint (advisory 開始) |

## §4 裏取り記録

- route-map 全行実読 (`src/schema/route-map.ts:14-121`): 削除/NFR/セキュリティ/外部前提の token 不在を確認。
- `tdd_red_required` grep: docs/plans/ 内 1 ファイル (定義 PLAN L6-28) のみ。実運用 PLAN での使用 0。
- `docs/governance/ddd-tdd-rules.md:23-70`: red-first-evidence ルールと DDD-INV-003 の実在確認 (原則は定義済み、発火だけが無い)。
- ddd-tdd-rules lint 実装 (`src/lint/ddd-tdd-rules.ts`): oracle 強度/GWT/境界/rule drift の検査実在を確認。
- PLAN-L7-265 (Codex, confirmed): backfill pairing の parent 参照許容 = G-15 デッドロック解消を確認 → 本監査起票から正規形適用。
