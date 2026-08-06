---
plan_id: PLAN-L7-480-oracle-id-token-boundary
title: "PLAN-L7-480 (impl): oracle ID の token 境界と検出範囲 ratchet の pair-freeze"
kind: impl
layer: L7
sub_doc: function-spec
drive: be
status: confirmed
route_signal: forward
route_mode: forward
created: 2026-08-05
updated: 2026-08-05
owner: PO / TL
parent_design: docs/plans/PLAN-L7-244-right-arm-citation-gate.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - ORACLE_ID の token 境界と derived ratchet baseline を TDD 実装する"
  - role: qa
    slot_label: "QA - CANDIDATE 非一致・2 桁 ID・多 segment 名・baseline stale 行の oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-480-oracle-id-token-boundary.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/oracle-test-trace-widened-baseline.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L7-244-right-arm-citation-gate.md
  requires: []
  blocks: []
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/165
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/259
    - docs/test-design/harness/L7-unit-test-design.md
github_issue_id: 165
backprop_decision: not_required
backprop_decision_reason: "既存 gate (oracle-test-trace、正本 PLAN-L7-244 の citation 契約) の検出盲点の純修理であり、新しい契約層・設計正本を作らない。可視化された既存債務は widened ratchet baseline として gate 内部に閉じ、Forward 設計正本への逆伝播対象が存在しない。"
review_evidence:
  - reviewer: claude-fable-5
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-05T21:20:00+09:00"
    tests_green_at: "2026-08-05T21:05:00+09:00"
    verdict: approve
    scope: >-
      issue #165 実装 slice の blind review (author 主張・自己評価を秘匿したパケットで
      claim-blind / spec-blind の 2 レーン)。Codex frontier が利用上限で停止中のため
      intra_runtime_subagent として記録 (cross_agent を僭称しない。上限解除後に Codex 側で
      cross review を取り直す — #252 記録)。初回 verdict FLAG: blocking 1 件 (U-OIDGATE-006 が
      production コード非経由の自明 pass) + minor 3 件 (fixture の実在 ID 使用による ratchet 漏れ、
      test-design/コメントの記述齟齬)。是正 849d0397 で U-OIDGATE-006 を実 repo derived 集合 +
      実 baseline 経由の実機構テストへ差し替え、fixture を架空 ID 化。これにより widened baseline
      は freeze 時実測 344 件と完全一致へ復元。reviewer 側実測: regex 単体挙動 (CANDIDATE 非抽出 /
      多 segment 抽出 / 2 桁抽出 / 右境界)、baseline 第三者再導出の集合一致、旧 89 件不変・交差 0。
    worker_model: claude-fable-5
    reviewer_model: claude-fable-5
    green_commands:
      - kind: unit_test
        command: "bun scripts/run-vitest-snapshot.ts tests/oracle-test-trace.test.ts tests/impl-plan-trace.test.ts tests/doctor-test-repository-isolation.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-05T21:05:00+09:00"
        evidence_path: tests/oracle-test-trace.test.ts
        output_digest: "sha256:7cc2c1436ae6f0cb923190c83e3c98203f229444ededcbd3754557c0c1e36b13"
        anchor_commit: 849d039708fee6befb544578a276e35e93907a5a
---

# PLAN-L7-480: oracle ID の token 境界と検出範囲 ratchet

本 PLAN は issue #165 の PF-1 に相当する docs-only pair-freeze である。**実装コード・baseline
モジュール・test は含まない。** 実装 PR が本 PLAN merge 後に、下表の candidate を実 test citation
と同じ commit で `U-OIDGATE-*` へ昇格させる。

`#206` (provenance-aware uniqueness) と `#158` (candidate lifecycle) は本 PLAN の scope 外であり、
別 PLAN が所有する。**1 PR = 1 論点**を守るための分割である (PR #258 が 3 issue 同梱で
blocking review により close された経緯の是正)。

## Entry

PR #258 が close 済みで、`src/lint/oracle-test-trace.ts` が main 上で未変更であること。

## 問題 (実測 2026-08-05)

`ORACLE_ID = /\b(?:U|IT)-[A-Z0-9]+-[0-9]{3}\b/` は次を**一切見ていない**:

| 形 | 例 | 出所 |
|---|---|---|
| 2 桁番号 | `ST-DATA-01` `U-FUNC-01` | `L9-system-test-design.md` / `L7-unit-test-design.md:60` |
| ST / P / M prefix | `ST-DOCSEM-08` | `L9-system-test-design.md` |
| 多 segment 名 | `U-RVGHA-D3C-001` | PR #225 が宣言 |

拡張すると **344 件**の未 citation 宣言 oracle が新たに可視化される
(内訳 U=177 / IT=103 / ST=64)。つまり 344 件が一度も検査されていない。

### 拡張には token 境界が必須である

素朴に prefix を増やすと `\b` が `CANDIDATE-` の直後で成立し、**CANDIDATE 行から oracle 部分を
抜き出してしまう**。

```
"CANDIDATE-M-SP-002"  →  \b 版: ["M-SP-002"]   (誤検出)
                      →  (?<![A-Z0-9-]) 版: []  (正しい)
```

main の test-design には該当する CANDIDATE 名が **8 件**実在する
(`CANDIDATE-M-SP-001`〜`007`、`CANDIDATE-P-FSM-001`)。現行 regex は `U|IT` のみなので今日は
漏れていないが、**拡張と同時に必ず顕在化する**。

## 契約 (freeze 対象)

1. **token 境界**: ID の先頭は `(?<![A-Z0-9-])` を満たすこと。`CANDIDATE-` 等の接頭辞から
   oracle 部分を切り出さない。`CANDIDATE-*` を citation 不要の正規表記とする既存規約
   (`L7-unit-test-design.md` CANDIDATE 節) と実装を一致させる。
2. **検出範囲**: prefix は `U|IT|ST|P|M`、番号は 2〜3 桁、名前部は `-` 区切りの多 segment を許す。
3. **ratchet の別集合**: 拡張で可視化された既存債務は既存 `ORACLE_TEST_TRACE_BASELINE`
   (89 件、2026-06-10 凍結) に**混ぜない**。別 baseline として持ち、既存 baseline の
   「縮小のみ可・新規追加禁止」契約を検出範囲拡張という別事由で汚さない。
4. **derived 検証**: baseline の正しさは**件数の定数比較で主張しない**。実 repo から再導出した
   orphan 集合と baseline の**集合一致**で検証する。これにより (a) 新規 orphan の混入と
   (b) baseline に残った stale 行の両方が同時に検出される。
   (PR #258 は `expect(size).toBe(350)` としたため、CANDIDATE 由来 6 件が混入したまま定数だけ
   合致していた。件数一致は中身を何も保証しない。)
5. **fixture read の契約更新**: 新規 test が repository read を増やす場合、
   `src/doctor/test-repository-isolation.ts` の契約行を**実数へ更新する**。allowlist で
   握り潰さない (PR #258 の `expected=1:actual=2` failure の是正)。

## 設計と検証の対 (未実装 oracle は CANDIDATE 表記)

| candidate ID | mutation / 入力 | oracle |
|---|---|---|
| `CANDIDATE-OIDGATE-001` | `CANDIDATE-M-SP-002` / `CANDIDATE-U-FOO-001` / `CANDIDATE-P-FSM-001` を宣言源へ入力 | 1 件も抽出しない (token 境界) |
| `CANDIDATE-OIDGATE-002` | `ST-DATA-01` / `U-FUNC-01` の 2 桁宣言で未 citation | orphan として検出 |
| `CANDIDATE-OIDGATE-003` | `U-RVGHA-D3C-001` の多 segment 宣言で未 citation | orphan として検出 |
| `CANDIDATE-OIDGATE-004` | ratchet baseline 収載 ID が未 citation | orphan にしない |
| `CANDIDATE-OIDGATE-005` | 実 repo から再導出した orphan 集合 vs baseline | **集合一致** (件数でなく要素) |
| `CANDIDATE-OIDGATE-006` | baseline に、現在は citation 済みの ID を 1 件混ぜる | stale 行として検出 (集合不一致) |
| `CANDIDATE-OIDGATE-007` | 既存 `ORACLE_TEST_TRACE_BASELINE` (89) の要素数と内容 | 本変更で不変 |

`CANDIDATE-*` は未 freeze 候補であり実 test citation として数えない。実装 PR が Red test を
追加してから `U-OIDGATE-*` へ昇格する。

## Exit

- 本 docs-only PLAN が main へ merge される。
- 後続の実装 PR が `src/lint/oracle-test-trace.ts` の regex を契約どおり変更し、ratchet baseline
  モジュールを追加し、上記 7 candidate を同一 commit で `U-OIDGATE-*` へ昇格する。
- 実装 PR は push 前に、当該 test に加えて
  `tests/doctor-test-repository-isolation.test.ts` と `tests/impl-plan-trace.test.ts` を
  ローカル green で確認する (PR #258 が落ちた 2 ゲートの再発防止)。
- exact HEAD CI green と非 author closing verdict が揃うまで issue #165 を close しない。

## 非 scope

- `#206` (同一 ID の重複宣言 / provenance-aware uniqueness)
- `#158` (candidate の lifecycle / owner / stale 強制)
- `#259` (cited-but-not-declared 500 件)
