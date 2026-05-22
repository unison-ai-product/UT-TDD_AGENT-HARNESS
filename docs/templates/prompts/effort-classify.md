# UT-TDD task classify + estimate prompt (LLM 委譲用、§7.2 準拠)

> 移植元: vendor/helix-source/cli/templates/prompts/effort-classify.md (PLAN-003 W3a port)
> 仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §7.1 / §7.2
> rule-based path のみで判定不能 (confidence < 0.7 or boundary) の場合に LLM 委譲する。
> 通常は src/ut_tdd/task/classifier.py + effort.py の rule-based path が正本。

## 入力

```json
{
  "task_text": "...",
  "files": <int|null>,
  "lines": <int|null>,
  "api_changes": <bool>,
  "db_changes": <bool>,
  "plan_frontmatter": {"kind": "...", "drive": "..."}  // optional
}
```

## 判定 1: 5 軸スコアリング (rule-based、vendor 互換)

1. **files** (ファイル数): 1-2 → 1pt / 3-5 → 2pt / 6-10 → 3pt / 11+ → 4pt
2. **cross_module** (横断度): 単一 → 1pt / 横断 keyword あり → 2pt
3. **spec_understanding** (仕様理解): バグ修正/typo/fix → 1pt / 既存拡張 → 2pt / 新規設計/ADR → 3pt
4. **side_effect** (副作用): なし → 0pt / API・DB・endpoint → 2pt / migration → 4pt
5. **test_complexity** (テスト): test/E2E/regression keyword → 2pt / 単純 → 1pt

合計 → complexity: 1-3 low / 4-7 medium / 8-12 high / 13+ xhigh

## 判定 2: kind / drive (§1.3 / §1.6)

- **kind** (11 種): impl / design / poc / reverse / add-design / add-impl / refactor / retrofit / recovery / troubleshoot / research
- **drive** (9 種): be / fe / fullstack / db / agent / scrum / reverse / poc / troubleshoot
- PLAN frontmatter があれば、その `kind` / `drive` を正本とする (regex 推定より優先)。

## 判定 3: size 3 軸 max (§7.2)

| 軸 | S | M | L |
|----|---|---|---|
| files | 1-3 | 4-10 | 11+ |
| lines | ≤100 | 101-500 | 501+ |
| api+db | none | one | both |

3 軸の最大値を size とする。size=L かつ XL keyword (new module / cross-platform / security / production) が match すると XL (split_required=true)。

## 判定 4: PERT 三点見積 (§7.2)

```
most_likely = base_hours[complexity]  # low=2 / medium=6 / high=12 / xhigh=24
optimistic  = most_likely * 0.5
pessimistic = most_likely * 2.0
expected    = (optimistic + 4 * most_likely + pessimistic) / 6
```

risk_factor:
- 1.0 base
- +0.2 per matched risk keyword (cross-platform / security / external API / migration / unclear requirement)
- clamp [1.0, 2.0]

buffered = expected * risk_factor、story_points = Fibonacci(buffered_hours)

## 判定 5: capability class escalation (§7.1)

| 条件 | capability_class |
|---|---|
| production_impact / production keyword | frontier-reviewer |
| risk_factor >= 1.6 | frontier-reviewer |
| size in {L, XL} | frontier-reviewer |
| confidence < 0.7 | frontier-reviewer |
| kind in {design, poc, reverse, recovery} | frontier-reviewer |
| kind in {impl, add-impl, refactor, retrofit, troubleshoot} | worker |
| その他 (research / add-design / unknown) | fast-checker |

## 出力形式 (JSON only、§7.2 contract 完全互換)

```json
{
  "classification": {
    "kind": "...",
    "drive": "...",
    "size": "S|M|L|XL",
    "complexity": "low|medium|high|xhigh",
    "split_required": false,
    "recommended_path": "...",
    "recommended_gates": ["G3", "G4"],
    "confidence": 0.82,
    "reasons": ["..."]
  },
  "estimate": {
    "optimistic_hours": 3,
    "most_likely_hours": 6,
    "pessimistic_hours": 12,
    "expected_hours": 6.5,
    "risk_factor": 1.4,
    "buffered_hours": 9.1,
    "story_points": 5,
    "risks": ["..."]
  },
  "orchestration": {
    "capability_class": "frontier-reviewer|worker|fast-checker",
    "reasons": ["..."]
  }
}
```

## UT-TDD 注記

- 本 prompt の LLM 委譲経路は **W3a (PLAN-003) 未配線**。skill_recommender + LLM dispatcher と統合する W3b (PLAN-004) で配線する。
- rule-based path (src/ut_tdd/task/) のみで判定不能なケース (confidence < 0.7、境界 score、要件曖昧) の fallback として、本テンプレートを LLM に投げる想定。
- 直接 `helix codex` / Codex SDK を呼ばず、UT-TDD harness 経由で委譲する (HELIX-style provider SDK fallback は §禁止事項)。
- model 名 (gpt-X / claude-X) は本書では明示しない。capability class (frontier-reviewer / worker / fast-checker) で抽象化し、実モデル名は `.ut-tdd/teams/*.yaml` の local override に閉じ込める。
