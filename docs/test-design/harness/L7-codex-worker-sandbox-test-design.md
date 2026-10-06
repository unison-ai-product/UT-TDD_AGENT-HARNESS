# Codex worker sandbox 境界の L7 テスト設計案

状態は pair-freeze 提案であり、実装済み・検証済み・受入 PASS を意味しない。
所有対象は `PLAN-L7-68-provider-dispatch-portability` の Issue #676 差分だけとする。
共通 `L7-unit-test-design.md` は変更せず、既存の provider dispatch、model/effort、stdin、
Claude invocation の回帰を維持する補足として扱う。

## 契約と不変条件

- Codex の成果物作成 worker `se`、`docs`、`be-api`、`be-logic`、`db-schema`、
  `devops-deploy` の6 role にだけ、argv の `--sandbox workspace-write` を1組渡す。
- 判断 gate、advisor、管理・調査 role、および他の既知 role へ write を付与しない。
  `aim` は既知の non-writer とし、schema 登録を write 許可とは解釈しない。
- 未登録 Codex role は、正規 delegation と直接 adapter 呼出しの双方で provider spawn 前に拒否する。
- Claude argv/environment、model・effort routing、stdin framing、reviewer verdict custody、
  既存 gate-role policy は変更しない。write flag の不在を OS sandbox の read-only 証明としない。
- runtime から team へ import しない。既存の lower-level role policy を再利用・集約し、
  新 source module や第二の role registry を作らない。
  `READ_ONLY_DELEGATION_ROLES` は frontier/model routing にも使うため、本修正で集合を拡張しない。

## 独立 oracle 候補

候補 ID は未昇格である。実装時には対応 test と mutation の実測を同一 revision に束縛する。

| Candidate ID | 入力・変異 | 期待する判定 |
| --- | --- | --- |
| `CANDIDATE-U-ADAPTER-SANDBOX-001` | 6 writer role を個別指定 | argv に `--sandbox workspace-write` が1組だけ現れ、model/effort/stdin の既存契約を維持する。 |
| `CANDIDATE-U-ADAPTER-SANDBOX-002` | 全 decision-gate role | write を付与せず、gate role 集合と verdict custody を維持する。 |
| `CANDIDATE-U-ADAPTER-SANDBOX-003` | `aim` とその他の既知 non-writer | role 認識を write 許可へ読み替えず、write を付与しない。 |
| `CANDIDATE-U-ADAPTER-SANDBOX-004` | 正規 delegation へ未登録 Codex role | provider spawn 0 で拒否し、permissive fallback を使わない。 |
| `CANDIDATE-U-ADAPTER-SANDBOX-005` | adapter へ未登録 Codex role を直接入力 | provider spawn 0 で拒否する。write を付与しないだけでは合格にしない。 |
| `CANDIDATE-U-ADAPTER-SANDBOX-006` | Claude invocation と Codex non-writer routing | Claude argv/env、model routing、stdin、既存 gate policy が不変である。 |

実装対象は `tests/runtime-adapter.test.ts` と必要最小限の既存 delegation/team routing test。
writer 正例、non-writer 負例、unknown 拒否を別々に到達させる。
write-role 判定の除去、unknown 拒否の除去、write flag の重複挿入を独立に変異させ、
対応 oracle が Red になることを検証する。具体的な拒否 error は既存 caller 契約と照合し、
契約 freeze 時に確定する。新 error envelope をこの文書だけで発明しない。

## 範囲外と受入への接続

SessionStart timeout/reentry (#835)、全 role 一律 grant、provider/OS sandbox の実効性保証、
custody 変更、behavior-invariant extraction (#160) は範囲外とする。
この追加能力には bounded Reverse pair が必要であり、その成立と非著者レビュー前に実装を開始しない。
Linux の実 provider 再実測は control が指定した新しい baseline/attempt で別途行い、
既存の診断結果や exit 0 を成果物書込み成功・L12 受入 PASS に読み替えない。
