---
layer: L6
executed_at_layer: L7
artifact_type: test_design
status: draft
parent_doc: docs/plans/PLAN-L7-855-codex-worker-sandbox-contract.md
created: 2026-10-06
updated: 2026-10-06
---

# Codex worker sandbox 境界の L7 テスト設計案

状態は pair-freeze 提案であり、実装済み・検証済み・受入 PASS を意味しない。4 oracle ID は実装 PR の最初の commit で正式昇格し、Red を先に記録する。
所有対象は `PLAN-L7-855-codex-worker-sandbox-contract` の Issue #676 差分だけとする。
共通 `L7-unit-test-design.md` は変更せず、既存の provider dispatch、model/effort、stdin、
Claude invocation の回帰を維持する補足として扱う。

## 契約と不変条件

- Codex 成果物作成 worker `se`、`docs`、`be-api`、`be-logic`、`db-schema`、
  `devops-deploy` の6 role にだけ、argv の `--sandbox workspace-write` を1組渡す。
- それ以外の全 role は既存の read-only invocation を維持する。これには判断 gate、advisor、
  管理・調査 role、`aim`、および unknown role を含む。unknown role を理由に直接 adapter
  invocation を新たに拒否してはならない。
- 正規 delegation の既存 role allowlist refusal は変更しない。これは通常の delegation
  境界であり、本修正で新しい direct-adapter spawn refusal を追加する根拠ではない。
- write-role allowlist は既存 runtime 層から export する単一 constant とし、adapter はそれを
  利用する。runtime から team routing への import、team routing の変更、新 source module、
  第二の role registry は導入しない。
- Claude argv/environment、model・effort routing、stdin framing、reviewer verdict custody、
  既存 gate-role policy は変更しない。write flag の不在を OS sandbox の read-only 証明としない。
  `READ_ONLY_DELEGATION_ROLES` は frontier/model routing にも使うため、本修正で集合を拡張しない。

## 独立 oracle

以下の4 oracle ID は正式宣言とする。実装時には対応 test と mutation の実測を同一 revision に束縛する。

| Oracle ID | 入力・変異 | 期待する判定 |
| --- | --- | --- |
| `U-ADAPTER-SANDBOX-001` | 6 writer role を個別指定 | argv に `--sandbox workspace-write` が1組だけ現れ、model/effort/stdin の既存契約を維持する。 |
| `U-ADAPTER-SANDBOX-002` | advisor、`aim`、代表的な known non-writer、control 指定 reviewer role、unknown worker role を直接 adapter に指定 | いずれも新たに拒否せず、adapter plan が既存 argv を維持して `--sandbox workspace-write` を含めない。 |
| `U-ADAPTER-SANDBOX-003` | Claude invocation と Codex non-writer routing | Claude argv/env、model・effort routing、stdin、既存 gate-role policy が不変である。 |
| `U-ADAPTER-SANDBOX-004` | 正規 delegation の既存 role allowlist refusal と frontier/custody consumer (`tests/delegation-routing.test.ts` の `U-DELEG-001` / `U-DELEG-002` / `U-DELEG-008`、および `tests/release-consumer-skills.test.ts` の本 oracle assertion) | 既存拒否・frontier routing・custody 振る舞いを維持し、read-only role 集合の誤拡張による regression を起こさない。 |

実装対象は `tests/runtime-adapter.test.ts`、`tests/release-consumer-skills.test.ts` と必要最小限の既存 delegation/routing test。
writer 正例と代表的な non-writer の既存 invocation をそれぞれ到達させる。
6 role の allowlist 欠落、write flag の重複挿入、non-writer への grant、Claude invocation の変更、
既存 delegation/frontier consumer の regression を独立に検出する。unknown direct-adapter role の拒否を
新設する oracle は置かない。

## 範囲外と受入への接続

SessionStart timeout/reentry (#835)、全 role 一律 grant、provider/OS sandbox の実効性保証、
custody 変更、behavior-invariant extraction (#160) は範囲外とする。
この追加能力には bounded Reverse pair が必要であり、その成立と非著者レビュー前に実装を開始しない。
Linux の実 provider 再実測は control が指定した新しい baseline/attempt で別途行い、
既存の診断結果や exit 0 を成果物書込み成功・L12 受入 PASS に読み替えない。
