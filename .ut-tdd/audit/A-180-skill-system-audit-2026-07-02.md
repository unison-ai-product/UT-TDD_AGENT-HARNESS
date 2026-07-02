# A-180: スキル系総点検 (content / engine / catalog / 注入) — 2026-07-02

- 監査種別: アーキテクチャ監査 (A-172〜A-179 系列)。PO 依頼 2026-07-02「スキル系の確認をお願い」
- 対象: `skills/` 実体コンテンツ (56 skill) / `src/skill-engine/` (recommend・injection・scaffold) / catalog 整合 / 検査系被覆。既起票の L7-262 (telemetry 偽装・session_id・silent fail-open) / L7-257 (vmodel 注入表示止まり) と重複しない新規所見のみ。
- 方法: 並列調査 2 系統 (pmo-project-explorer sonnet ×2) + orchestrator 実走 (`skill suggest --plan` 2 本の live 出力) + 実コード裏取り (L6-37 末尾実読 / SKILL_MAP:14 / refactor-scout.md:24 / skill_evaluations 参照 grep / scoreSkill×skillScore 並存)。
- 処置: 起票のみ。

## §0 結論サマリ

コンテンツは健全 (mojibake 0 / スタブ 0 / HELIX 混入 0 / personal path 0、見かけの重複ペアは意図的な補完関係)。問題はエンジンと整合の層に集中: **推奨が「均一 score 0.8 の平坦フィルタ」で rank が実質アルファベット順** (学習ループ片道が根因)、**confirmed PLAN に XML 擬似ツール呼び出し残渣がコミット済み** (gate 盲点)、**canonical root の設計 doc 記述が旧パスのまま凍結**。

## §1 所見 — コンテンツ/catalog (健全性と drift)

健全確認: 56 skill (md 55 + yaml 1)、schema_version/name/skill_type 全数保持。mojibake・半角カナ・U+FFFD ゼロ。スタブなし (58〜164 行)。HELIX 名称/コマンド残渣ゼロ、UT-TDD 自前領域 (incident/recovery/reverse 系) への混入なし。personal path/内部 URL 焼き込みなし。api/api-contract 等の sibling ペアは diff 130〜210 行で相互参照つき = 意図的分離。SKILL_MAP トリガー表 53 slug ↔ 実ファイル全一致。

**S-1 [high] PLAN-L6-37 に XML 擬似ツール呼び出し残渣がコミット済み** — `docs/plans/PLAN-L6-37-skill-index-category.md:212-213` に `</content>` `</invoke>` が付着 (orchestrator 実読で確定)。confirmed PLAN の末尾が破損状態で landed。`.claude/CLAUDE.md` Native Tool Invocation が「corrupted transcript residue」と明示禁止するパターンだが、**検出 lint が存在せず** readability/freeze gate を素通り (A-178 §1 #15「Native tool-use only = prose のみ」の実害第 1 号)。

**S-2 [medium] canonical root の設計 doc 記述が stale** — 実装は `skills/` 優先 (`src/assets/catalog.ts:83-95`、`docs/skills/` は物理不存在) だが、ADR-004:21 / PLAN-L4-12:52 / PLAN-L5-06:54,72 が `docs/skills/**/*.md` を層 1 正本と記述、`skills/SKILL_MAP.md:14` は自己説明が "Catalog index for docs/skills/."。実装先行の root 移行が設計側へ back-fill されていない。

**S-3 [medium→意図確認要] `skills/review-checklist.yaml` が skill 索引から不可視** — SKILL_MAP トリガー表に未記載で suggest のスコア対象外。ただしこれは gate checklist の SSoT (review-tier 用データ) であり skill 本体でない可能性が高い — **意図的除外なら除外を明示** (索引外 asset のマーカー) が対応形。

**S-4 [low] `technical-writing.md` の `domain_tags` が空値** — category=domain の situation-pull 索引 (L6-37 設計) が唯一の domain skill に対して機能しない。

**S-5 [low→中] `.claude/agents/refactor-scout.md:24` が `docs/skills/refactoring.md` への dead link** — 実体は `skills/refactoring.md`。調査 agent は「allowlist 外」と報告したが**誤り**: refactor-scout はコード側 allowlist (`agent-guard-policy.ts`) に登載された現役 agent (A-177 確定)。現役 agent の定義が不存在パスを読む指示を持つ。

## §2 所見 — エンジン (推奨・注入・学習)

**S-6 [high] 推奨が平坦フィルタで差別化ゼロ (live 実走で確定)** — `skill suggest --plan PLAN-L7-272` の全 5 候補が **score 0.8・reason 同一文字列** (PLAN 属性の言い換えのみ)、rank はアルファベット順。lint 発火化 PLAN に `browser-testing-and-screen-verification` が rank 2 で出る等の無関係推奨。原因は score 式の構造 (layer +0.3 / drive_model +0.3 が支配し全候補同点) と **学習ループが片道**なこと: `skill_evaluations` (skill_rating/adoption_count/unused_flag、PLAN-L7-53) は算出されるが **`src/skill-engine/` から参照ゼロ** (grep 裏取り済) — 実績が推奨に一切反映されない。さらに評価の入力元は auto-projection 汚染 (L7-262 対象) を継承しており、配線しても現データでは学習にならない二重空洞。

**S-7 [medium] スコアリングが 2 重実装で乖離中** — `recommend.ts:232 scoreSkill` (overlap de-saturator あり) と `state-db/skill-projections.ts:27 skillScore` (なし) が並存 (裏取り済)。CLI 手動推奨と DB 自動投影で異なるランキングを生む片改修リスク。

**S-8 [medium] 注入の安全弁なし** — `buildSkillInjectionSet` は `automation_assets.path` を**実在再検証なしで返す** (stale 永続 DB 経路で削除済み path が required_paths に乗り得る。「後から消えた」ケースは missing_skill_ids でも拾えない非対称)。注入件数の明示上限も無し (`rankSkills` の暗黙 limit=5 のみ、CLI 調整口なし) — context 溢れの予算制御が未設計。

**S-9 [low] 本文品質の検査層なし + scaffold の間接登録** — skill-assignment lint はメタデータ形式のみで、本文の見出し構成/長さ/scaffold 生成 `TODO` プレースホルダ残存を検査しない。`skill new` は catalog 即時登録せず次回 fs スキャン依存 (動作はするが仕組みの明示なし)。

## §3 起票 map (すべて draft、A-179 の kind 使い分けに準拠)

| PLAN | kind | parent | 対応 | 骨子 |
|---|---|---|---|---|
| PLAN-L7-277-skill-recommendation-discrimination (+REVERSE-277) | **add-impl** | PLAN-L7-53 (learning-engine) | S-6 | 学習ループ接続 (evaluations→score、L7-262 の provenance 浄化を requires) + score 差別化 + reason の個別化 |
| PLAN-L7-278-skill-injection-safety (+REVERSE-278) | **add-impl** | PLAN-L5-06 (skill 設計) | S-8 | 注入 path 実在再検証 + 注入予算 (件数/バイト上限 + CLI 調整口) |
| PLAN-L7-279-xml-residue-lint (+REVERSE-279) | impl (台帳) | — | S-1 | XML 擬似ツール呼び出し残渣の検出 lint (docs 全域、fail-close) + 既存残渣の棚卸し・除去 (L6-37 含む)。A-178 #15 の機械化 |
| PLAN-REVERSE-280-skill-root-doc-sync | reverse (単独) | — | S-2,S-3,S-4,S-5 | 実装先行の root 移行を設計側へ back-fill: ADR-004/L4-12/L5-06/SKILL_MAP の root 記述、refactor-scout link、domain_tags、review-checklist の索引外明示 |

S-9 は単独起票せず L7-277 (品質 score の入力) と L7-263 台帳運用の scope 注記に留める (過分割回避)。

## §4 裏取り記録

- L6-37 末尾 (`:200-213`) を orchestrator が実読 — `</content>` `</invoke>` の残渣実在を確定。
- `SKILL_MAP.md:14` / `refactor-scout.md:24` grep — stale root 自己記述と dead link を確定。refactor-scout の allowlist 現役性は A-177 の突合結果で訂正 (調査 agent の「allowlist 外」報告は誤り)。
- `src/skill-engine/` に `skill_evaluations|skill_rating` 参照ゼロ (grep) — 学習片道を確定。
- `scoreSkill` (recommend.ts:232) × `skillScore` (skill-projections.ts:27) 並存を grep で確定。
- live 実走: `skill suggest --plan` 2 本 — 全候補 score 0.8 均一・reason 同一・アルファベット順 rank を観測 (L7-272: 5/5 件が 0.8)。
- 調査 subagent 2 体中 1 体が途中停止 → SendMessage 再開で回収 (narration≠成果の規律適用)。
