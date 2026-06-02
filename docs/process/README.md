> **PROVISIONAL SPIKE** (PLAN-DISCOVERY-04)。正本でない。終点後 Reverse で実績から再整備される。

# docs/process — 工程 (L0-L14) + 駆動モデル定義

ここは UT-TDD の **「どう開発を進めるか」の方法論定義**を置く場所 (repository-structure §2)。harness 自身の機能要件 (docs/design / src) とは別物。

> **これは何を読めば分かるか (PO 向け入口)**: 「工程 (V-model L0-L14)」と「駆動モデル (mode)」と「ゲート」の 3 つで開発の進め方が決まる。下の §1 用語 → §2 読む順序 の順に読めば全体像がつかめる。

---

## §1 まず用語: PLAN を分類する 4 軸 (kind / layer / drive / workflow_phase)

すべての PLAN (`docs/plans/PLAN-*.md`) は次の 4 軸で分類される。**4 軸は別々の問い**であり混同しない。

| 軸 | 問い (一言) | 値の例 | 正本 |
|----|-----------|--------|------|
| **kind** | この PLAN は**何をする**のか | charter / design / impl / poc / reverse / add-design / add-impl / refactor / retrofit / recovery / troubleshoot / research (12 種) | requirements §1.3 |
| **layer** | V-model の**どの工程**か | L0-L14 (Forward 工程) / cross (横断駆動) (16 種) | requirements §1.4 |
| **drive** | **どの技術軸で作る**のか | be / fe / fullstack / db / agent / scrum / reverse / poc / troubleshoot (9 種) | requirements §1.6 |
| **workflow_phase** | 横断駆動の**局面** | S0-S4 (poc) / R0-R4 (reverse)。他 kind は持たない (10 種) | requirements §1.5 |

### drive (駆動 / 実装ドライブ) を詳しく — 「どの技術軸で作るか」

drive は「PLAN の作業がどの技術領域か」を表す。これで **L10 UX 磨きの要否 / owner role / orchestration_mode** が変わる。

| drive | 意味 | L10 (UX 磨き) |
|-------|------|---------------|
| `be` | バックエンド / API / ロジック中心 | UI 変更時のみ |
| `fe` | UI / モック駆動 | 常に必要 |
| `fullstack` | BE + FE 同時 | 常に必要 |
| `db` | スキーマ / データモデル中心 | UI 変更時のみ |
| `agent` | AI エージェント / プロンプト設計 | 常に必要 (会話 UI) |
| `scrum` | 仮説検証の反復 (経路 2) | — |
| `reverse` | 既存コード逆引き (経路 2) | — |
| `poc` | PoC 単独実装 | — |
| `troubleshoot` | 緊急対応 (補助 1) | — |

### 4 軸の組み合わせ規則 (排他 / matrix)

- **kind × layer 排他** (§1.1): 横断駆動 (poc/reverse/recovery) は `layer=cross` のみ。それ以外の kind は単一の実 layer (cross 不可)。
- **kind × drive matrix** (§1.6): kind ごとに使える drive が決まる。例: `design`→be/fe/fullstack/db/agent、`reverse`→reverse のみ、`recovery`→troubleshoot のみ。
  - ⚠ この matrix は **現状 schema 未実装** (PLAN-DISCOVERY-04 §S2-S3 V3)。`recovery→troubleshoot` 固定と実在 PLAN-RECOVERY-01 (drive=fullstack) の扱いは PO 判断保留中。
- **kind × workflow_phase** (§1.5): poc は S0-S4、reverse は R0-R4 のみ。他 kind は workflow_phase を持たない。

---

## §2 読む順序 (全体像)

1. **[forward/overview.md](forward/overview.md)** — Forward (本体経路) の V-model L0-L14 と V-pair の全体像。まずここ。
2. **forward/** 各工程詳細 — [L00-L06 設計フェーズ](forward/L00-L06-design-phase.md) (左腕) / [L07 実装](forward/L07-implementation.md) (谷) / [L08-L14 検証フェーズ](forward/L08-L14-verification-phase.md) (右腕)。
3. **[modes/README.md](modes/README.md)** — 駆動モデル (mode) 正本台帳。Forward 以外の入口 (Discovery / Reverse / Recovery / Incident / Refactor / Retrofit / Add-feature / Scrum / Research)。**どの mode も出口は Forward に合流**する。
4. **[gates.md](gates.md)** — ゲート体系 G0.5-G14 + 人間サインオフ必須ゲート + 横断検出。

---

## §3 中核の考え方 (3 つだけ)

1. **V-model**: 左 (L0-L6 設計) で書いた設計には同層で ③ テスト設計を**対で凍結**し、右 (L8-L14 検証) の対応工程で ④ テストコードを実施する (V-pair)。設計だけ先行は違反 (逆ピラミッド)。
2. **入口は分かれても出口は 1 本**: 駆動モデル (mode) は「入口の状況」が違うだけ。**全 mode が最終的に Forward L0-L14 へ合流**する。入口を散らさず工程を一本化する。
3. **確証なき設計は Discovery で**: 紙上で確定できない設計は「確証あり」と偽らず、Discovery (kind=poc、設計→仮実装→検証→確定) で回して確かめる (PLAN-DISCOVERY-01 §1.1)。

---

## §4 位置付け

本 dir 全体は現在 **spike (PROVISIONAL)** で正本でない。PLAN-DISCOVERY-04 (Discovery) で回して確かめ、その**終点で Reverse を起票して dogfood 実績から正本化**する (§3.1)。
