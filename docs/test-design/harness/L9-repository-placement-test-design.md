---
layer: L4
executed_at_layer: L9
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L4-basic-design/repository-placement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
plan: pending (PLAN-L4-35 は issue 596 の ledger 取り込み後に plan draft で起票する)
---

# L9 テスト設計: リポジトリの置き場所 (Repository Placement)

`docs/design/harness/L4-basic-design/repository-placement.md` の対である。この文書の oracle はすべて候補 (CANDIDATE) で、まだ実装も実行もしていない。GREEN を意味しない。実装 PR で `U-` / `ST-` に昇格する。

## oracle 候補

| ID | 対象 (設計の節) | Red (失敗とする状態) | Green (合格とする状態) |
|---|---|---|---|
| CANDIDATE-PLACE-001 | registry (§4) | 同じ path に 2 つのルールが当たる。既存 catalog と同じ定義を registry が複製している | 全ルールが排他的。既存 catalog が定める領域は import 参照だけで、registry 側に複製がない |
| CANDIDATE-PLACE-002 | 未知の種類 (§4) | governed root の中で、どのルールにも当たらない新しいファイルが通る。scratchpad / `.ut-tdd/` / ignore 対象が止められる | governed root の中の未知の新規ファイルだけが deny され、それ以外は止められない |
| CANDIDATE-PLACE-003 | 例外 (§4) | 空の marker で通る。marker が消費されずに残る。監査ログが残らない | 理由つきの marker で 1 回だけ通り、消費され、`placement-overrides.jsonl` に記録される |
| CANDIDATE-PLACE-004 | 書き込み時の guard (§5) | 誤った置き場所への新規書き込みが通る。deny の理由に正しい path が含まれない。`updatedInput` で path を書き換える | deny され、理由に registry が判定した正しい path が含まれる。入力の書き換えはしない |
| CANDIDATE-PLACE-005 | 既存ファイルの編集 (§5) | 既存の誤配置ファイルの編集が、書き込み時の guard で止められる | 既存ファイルの編集は置き場所の判定の対象外 (patrol が扱う) |
| CANDIDATE-PLACE-006 | Codex との対称性 (§5) | Codex 側の挙動が実測されないまま、対称または非対称と主張される | Codex hook の deny とメッセージ返却の能力を実測した記録があり、対称、または明記した非対称 (pre-commit と patrol で担保) のどちらかが成立している |
| CANDIDATE-PLACE-007 | patrol (§6) | `misplaced` / `unreferenced` / `duplicate` のいずれかが、既知の実例を見落とす。実例は §2 の矛盾 3 (`src/document-disposition/`、`src/execution/`) と矛盾 8 (L6 テンプレートの 2 本) | 既知の実例をすべて検出し、件数を報告する。ファイルの移動や PR の作成はしない (報告だけ) |
| CANDIDATE-PLACE-008 | Pack の構造化 (§3.4、段階 3) | Pack に `dev/` 配下のファイルが入る。`product/` の中身と、registry が列挙した追加 path (`release/manifest.yaml`、再現確認の CI workflow 1 本) 以外の path が入る。再現確認の CI workflow が入っていない | Pack の inventory が「`product/` の中身 + registry が列挙した追加 path」に完全に一致する |
| CANDIDATE-PLACE-009 | 内部デプロイ (§7) | この repo の hook が、開発中の `src/cli.ts` を直接起動している | hook が、インストールしたリリース済みの `ut-tdd.mjs` を経由して起動する |
| CANDIDATE-PLACE-010 | 配る物の判定 (§4 component ルール) | ファイル名のパターンで配る物と配らない物を分ける。consumer の入口から import で到達するファイルが `dev/` に置かれる | 配る物の判定が import graph の到達性で決まる。到達するファイルはすべて `product/` 側にあり、`dev/release/` には到達しないファイルだけがある |

## 実行環境

CANDIDATE-PLACE-001〜007 と CANDIDATE-PLACE-010 は、repo 内の fixture と実 repo の両方で実行する (実 repo に対する回帰テストを含む)。CANDIDATE-PLACE-008 は、段階 3 の canary の受入で実行する。CANDIDATE-PLACE-009 は、内部デプロイの最初の 1 歩 (canary.5 の公開後) で確認する。
