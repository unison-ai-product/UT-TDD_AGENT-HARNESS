---
layer: L6
artifact_type: design_doc
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-08-backfill-pairing.md
---

> **L6 contract marker**: `analyzeBackfill(input: BackfillInput) => BackfillResult` is the unit-test-granularity contract. DbC pre/post/invariant maps required Reverse back-fill and glossary gaps to U-BACKFILL-001..006.
<!--
① 設計 (L6 機能設計) — backfill-pairing lint (駆動モデルの設計ドキュメント back-fill 完全性検証)。
PLAN: IMP-051 (back-fill pairing lint、add-feature)。
pair (③): docs/test-design/harness/L7-unit-test-design.md §1.11 U-BACKFILL。
実装 (②): src/lint/backfill-pairing.ts + src/doctor/index.ts checkBackfill。
ADR-001 準拠: 旧 Python コードを port せず TypeScript (Bun) で全面再実装。
-->

# UT-TDD Agent Harness — L6 機能設計: backfill-pairing lint (IMP-051)

## §0 位置づけ・動機

本設計は `src/lint/backfill-pairing.ts` と `src/doctor/index.ts checkBackfill` の後追い設計記録である。実装は完了済、本書はその V-pair 整合のための設計文書化 (Add-feature back-fill)。

**動機**: Add-feature (bottom-up 駆動) で実装 (②) した後、上位設計/governance への **Reverse 合流** + **§6 用語更新の L0 §10 用語集 back-merge** を agent 記憶に頼ると漏れる。本 harness 開発で impl 後 Reverse 放置 → PO 指摘の実績あり。V-model pair 完全性 (`[[feedback_vmodel_state_db_completeness]]`) を **impl ⇔ Reverse / impl ⇔ glossary** へ拡張し、「Reverse 無き impl」「glossary 未 merge な PLAN」を機械が surface する。

**段階方針**: 現在は **hard/fail-close**。doctor に接続し、`reverseOrphans` または `glossaryGaps` が 1 件でもあれば `checkBackfillResult.ok=false` として `runDoctor.ok` に連動する。

**設計原則**: 純関数 (`analyze*` / `parse*`) と I/O loader (`loadBackfillDocs`) を分離する。fr-registry-audit / doc-consistency と同方針。

## §1 責務分離

| コンポーネント | 責務 | 失敗方針 |
|---|---|---|
| `parseRequires` | frontmatter `dependencies.requires` の YAML list を path 文字列配列として抽出 | **純関数**。マッチなし・`[]` → `[]` |
| `parseGlossaryTerms` | `§6 用語更新` section の太字 term (`- **term**: ...`) を抽出 | **純関数**。section なし → `[]` |
| `normalizeTerm` | 複合ラベル (`" / "` / `"("` / `"（"` 前) の先頭コア語を取り出す | **純関数**。表記ゆれ吸収 |
| `parsePlan` | 1 ファイル分の frontmatter + requires + glossaryTerms を `ParsedPlan` に構造化 | **純関数** |
| `analyzeBackfill` | `ParsedPlan[]` + L0 §10 用語集本文 から `BackfillResult` を算出 | **純関数**。archived は除外 |
| `loadBackfillDocs` | `docs/plans/*.md` (archive/template 除く) + concept §10 用語集 をファイル読み込み | I/O。失敗は `checkBackfill` 側で catch |
| `backfillMessages` | `BackfillResult` から doctor/CLI 向け 1 行サマリ群を生成 | **純関数**。hard gate message |
| `checkBackfillResult` (doctor) | `loadBackfillDocs` → `analyzeBackfill` → `backfillMessages` を I/O try-catch でラップして surface | fail-close (I/O 失敗 → violation / ok=false) |

## §2 型 / schema (D-CONTRACT)

### §2.1 型定義

```ts
/** 駆動モデル (kind) → back-fill (設計ドキュメントへ戻す) 要否。 */
export type BackfillReq = "required" | "conditional" | "none";

export interface ParsedPlan {
  file: string;
  plan_id: string;
  kind: string;
  status: string;
  /** dependencies.requires の path 群 (Reverse が impl を requires する向きを辿る)。 */
  requires: string[];
  /** §6 用語更新 で宣言された用語 (太字 **term** の先頭)。 */
  glossaryTerms: string[];
}

export interface BackfillResult {
  /** back-fill required (add-impl 等) なのに requires する Reverse PLAN が無い (status≠archived)。 */
  reverseOrphans: { plan_id: string; kind: string }[];
  /** conditional kind で Reverse 未リンク (人間判断推奨、warn)。 */
  conditionalPending: { plan_id: string; kind: string }[];
  /** §6 用語更新 で宣言したが L0 §10 用語集に未 merge な (plan_id, term)。 */
  glossaryGaps: { plan_id: string; term: string }[];
  ok: boolean;
}

export interface BackfillDocs {
  plans: ParsedPlan[];
  glossaryText: string;
}
```

### §2.2 KIND_BACKFILL マトリクス

```ts
/**
 * kind → back-fill 要否マトリクス (駆動モデル整理の正本)。
 * - required: bottom-up build。対応 Reverse 合流が無いと孤児 (add-impl = Add-feature)。
 * - conditional: 契約/挙動を変えたときのみ Reverse 要 (人間判断、warn にとどめる)。
 * - none: 上流で①設計凍結済 / back-fill そのもの (reverse/recovery) / 探索 (poc)。
 */
export const KIND_BACKFILL: Record<string, BackfillReq> = {
  "add-impl":    "required",
  refactor:      "conditional",
  retrofit:      "conditional",
  troubleshoot:  "conditional",
  impl:          "none",
  design:        "none",
  "add-design":  "none",
  charter:       "none",
  poc:           "none",
  reverse:       "none",
  recovery:      "none",
};
```

### §2.3 関数 signature / DbC

| 関数 | signature | DbC |
|------|-----------|-----|
| `normalizeTerm` | `(term: string) => string` | **純関数**。`" / "` / `"("` / `"（"` の手前を split し先頭コア語を trim して返す |
| `parseRequires` | `(content: string) => string[]` | **純関数**。`requires:\n  - <path>` の YAML list を抽出。`requires: []` / section 無し → `[]` |
| `parseGlossaryTerms` | `(content: string) => string[]` | **純関数**。`§6 用語更新` 見出し以降〜次 heading or EOF を section とし `- **term**:` の term を返す。**`/m` を付けず `$` を文字列末尾の意味で使う** (`/m` だと section が空になる罠) |
| `parsePlan` | `(file: string, content: string) => ParsedPlan` | **純関数**。frontmatter の `plan_id`/`kind`/`status` + `parseRequires` + `parseGlossaryTerms` を合成。`plan_id` 不在 → ファイル名 (拡張子除く) で代替 |
| `analyzeBackfill` | `(plans: ParsedPlan[], glossaryText: string) => BackfillResult` | **純関数**。① `status === "archived"` を除外 → active。② reverse PLAN の `requires` が指す path 集合を構築 (`reverseRequires`)。③ active で `KIND_BACKFILL[kind] === "required"` かつ `reverseRequires` に含まれない → `reverseOrphans`。④ `conditional` かつ未リンク → `conditionalPending`。⑤ 全 active の `glossaryTerms` を `normalizeTerm` で照合 → `glossaryText` に含まれない → `glossaryGaps`。`ok = reverseOrphans.length === 0 && glossaryGaps.length === 0` (conditional は ok に影響しない) |
| `loadBackfillDocs` | `(repoRoot?: string) => BackfillDocs` | I/O。`docs/plans/*.md` を全読み (archive/template dir は含まれない flat ファイル想定)。concept §10 用語集を正規表現 (`#\s*§10[\s\S]*?(?=\n#\s*§11|$)`) で抽出 |
| `backfillMessages` | `(result: BackfillResult) => string[]` | **純関数**。① reverseOrphans > 0 → warn 文言。② glossaryGaps > 0 → warn 文言。③ conditionalPending > 0 → note 文言。④ すべて 0 → OK 文言。複数メッセージを配列で返す |
| `checkBackfill` (doctor) | `(repoRoot: string) => string[]` | fail-close。`loadBackfillDocs` → `analyzeBackfill` → `backfillMessages` を実行し、I/O / parse 失敗は `violation` message として返す。doctor は `backfill` violation を hard gate に集約し、PLAN/glossary を読めない状態を skip しない。 |

### §2.4 DbC 補足

**`parseGlossaryTerms` の `/m` 罠**: section 抽出に `/m` フラグを付けると `$` が行末になり look-ahead が先頭行で止まり section が空配列になる。正しくは `/m` なしで `$` を文字列末尾として使う。

**`normalizeTerm` 複合ラベル**: `"agent-slot / peak_parallel"` → `"agent-slot"`、`"handover discipline (規律) surface"` → `"handover discipline"` のようにコア語を取り出し、表記ゆれを吸収する。

**`analyzeBackfill` 向き**: Reverse PLAN が impl PLAN を **`requires` する向き** を正とする (`reverse → impl`)。impl PLAN が reverse を参照するのではなく、reverse が impl を参照することで「この impl は back-fill 済」と判定する。

**`ok` 判定**: `reverseOrphans.length === 0 && glossaryGaps.length === 0`。`conditionalPending` は warn のみで ok を落とさない (人間判断が必要な軽度の注意)。

## §3 テスト指針 (V-pair)

generates pair: `docs/test-design/harness/L7-unit-test-design.md` **§1.11 U-BACKFILL-001〜006**。本書 §2.3 の全関数を被覆 (孤児 0)。trace は G7 で双方向凍結。

| U-ID | 対象関数 | 観点 |
|------|----------|------|
| U-BACKFILL-001 | `parseRequires` / `parseGlossaryTerms` | YAML list 抽出 / 無し → `[]` / 太字 term 抽出 / section なし → `[]` |
| U-BACKFILL-002 | `parsePlan` | frontmatter + requires + glossaryTerms の構造化 |
| U-BACKFILL-003 | `KIND_BACKFILL` | `add-impl=required` / `refactor=conditional` / `impl・design・reverse・recovery=none` 全種確認 |
| U-BACKFILL-004 | `analyzeBackfill` | Reverse 有 → 孤児なし ok=true / Reverse 無 → orphan + ok=false / conditional → warn のみ ok=true / glossary gap → ok=false / archived 除外 |
| U-BACKFILL-005 | `backfillMessages` | 孤児なし → OK 文言 / 孤児あり → warn 文言 |
| U-BACKFILL-006 | `loadBackfillDocs` + `analyzeBackfill` | 実 repo 完全性回帰ガード (orphan 0 / glossary gap 0) |

## §4 carry / 次工程

- **doctor fail-close 昇格**: 完了。`checkBackfillResult.ok` は `runDoctor.ok` に連動する。`ut-tdd plan lint` 側へ同等 gate を追加する場合も、この result contract を流用する。
- **docs/plans/ archive/ 除外の明示化**: `loadBackfillDocs` は現状 `docs/plans/` の flat ファイルのみを読む。`archive/` サブディレクトリ対応が必要な場合は `readdirSync` を再帰化する (現状は status=archived のフィルタで代替)。
- **PLAN-REVERSE back-fill 自己適用**: 本 IMP-051 (add-impl) 自体が KIND_BACKFILL=required の対象。対応 PLAN-REVERSE-* で L3 要件 back-fill が必要 (IMP-051 完了後の後続 PLAN)。
