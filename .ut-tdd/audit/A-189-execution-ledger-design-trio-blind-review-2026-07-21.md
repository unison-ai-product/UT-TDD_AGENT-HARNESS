# A-189: Execution Ledger 設計三部作 blind cross-review (2026-07-21)

- reviewer: claude-blind-reviewer (subagent, model claude-opus-4-8)
- orchestrator: claude-fable-5
- author (withheld from reviewer packet): Codex (owner: PO / Codex, commits fc679482 / d42e3204 / 54e02c98)
- review_kind: cross_agent (author=Codex family, reviewer=Claude family)
- reviewed_at: 2026-07-21T18:22:40+09:00 (blind review 報告の返却時刻。PLAN frontmatter の
  `reviewed_at: 18:24:00` は orchestrator の判定受理時刻で、`tests_green_at: 18:23:35` の後
  という IMP-077 順序で記録している — 両時刻は同一レビューの別 milestone)
- base: origin/main 2c34ac34f343e54eb6a0e90f2348cc5420883604
- 対象:
  - docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
  - docs/plans/PLAN-L5-23-execution-ledger-github-physical-data.md
  - docs/plans/PLAN-L6-83-forward-escape-issue-contract.md

## 判定

| PLAN | claim-blind | spec-blind | 総合 |
|---|---|---|---|
| PLAN-L4-30 | PASS | PASS | **PASS → confirmed 凍結可** |
| PLAN-L5-23 | PASS | PASS | **PASS → confirmed 凍結可** |
| PLAN-L6-83 | FLAG | PASS-WEAK | **FLAG → draft 差し戻し** |

## 根拠 (実測)

- `bun src/cli.ts plan lint` → `plan-schedule — OK (checked=812)`、三 PLAN にエラーなし。
- pair oracle 実在確認:
  - L4-30 ↔ L9: `ST-EPISODE-01/02`・`ST-CLOSURE-01` が
    docs/test-design/harness/L9-system-test-design.md §8 に実在。
  - L5-23 ↔ L8: `IT-EXEP-01/02`・`IT-GHISS-01/02` が
    docs/test-design/harness/L8-integration-test-design.md の PLAN-L5-23 節に実在。
  - L6-83 ↔ L7: `grep -rn U-EXISSUE docs/` → PLAN-L6-83 本文 (line 99, 115) のみ。
    docs/test-design/harness/L7-unit-test-design.md に **oracle 0 件 = pair-freeze 未完**。
- drive_model 11 値の正本照合: L4 function §3.1 (105-124) と L6-83 §1 が完全一致。
- 不変条件 (Ledger=authoritative / GitHub=projection) は L4→L5→L6 で矛盾なく降下。
  E0-E15 意味・冪等 key 階層 (command_id / outbox intent key / provider event identity)
  も層間整合。

## L6-83 の生存 finding (差し戻し理由)

1. **U-EXISSUE-* の pair-freeze 部分未完** (2026-07-21 訂正あり、下記「訂正」参照):
   L7-unit-test-design.md には `U-EXISSUE-007..016` が実在する一方、L6-83 §5 の
   oracle 1〜6 (Forward 境界 / 三面 fail-close / stale revision / 冪等再送 /
   GitHub 障害 / Issue 本文 mutation) は `U-EXISSUE-001..006` として未執筆で、
   `CANDIDATE-EXEP-*` / `CANDIDATE-GHISS-*` (未昇格 candidate) に留まる。
2. **三面 route_mode 照合の成立点未定義**: §2 は E3/E4 (Issue 生成) 時点で
   Issue body / Ledger event / PLAN route_mode の三面一致を要求するが、
   escape PLAN の materialization は L4-30 E5 (`drive_plan_frozen`) であり、
   drive PLAN の route_mode が E2〜E5 のどの E-state から可用かが三部作内で未確定
   (underspecification、L7 前に L6-83 改訂で明示要)。

依存 PLAN (L6-72 / L6-50 / L6-84) 内で 2 が解決済みかは本レビュー範囲外・未確認。

## 訂正 (2026-07-21、同日)

初版の finding 1 は「U-EXISSUE-* が L7 test-design に 0 件」としたが、これは reviewer の
grep が古い base branch (work/l7-451 系) の tree で実行されたための誤検出。origin/main
(2c34ac34) の L7-unit-test-design.md「PLAN-L7-436〜439 Execution Ledger / GitHub連動
oracle」節には `U-EXISSUE-007..016` が実在する (`grep -o "U-EXISSUE-0[0-9][0-9]" | sort -u`
で確認)。正しい残 gap は「§5 oracle 1〜6 が U- へ未昇格 (CANDIDATE-* のみ)」であり、
finding 1 を上記のとおり縮小訂正した。finding 2 (三面 route_mode 照合の成立点未定義) は
現 main の §2/§3 でも変わらず生存。FLAG verdict 自体は維持する (gap は縮小したが未完)。
基準点を HEAD に固定せず branch tree で測った本件は、検証基準点規律の違反事例として記録する。

## 処置

- PLAN-L4-30 / PLAN-L5-23: status draft → confirmed、review_evidence に本 audit を記録。
- PLAN-L6-83: status draft のまま、review_evidence に verdict=flag と生存 finding を記録。
  差し戻し 2 点 (U-EXISSUE-* の L7 追記、drive PLAN materialization E-state の明示) を
  閉じてから再レビュー・confirmed 化する。L7-436/437 実装着手は L6-83 confirmed が前提。
