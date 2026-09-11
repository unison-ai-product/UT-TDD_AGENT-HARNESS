---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-532-pack-publication-driver
---

# L7 Pack canary publication driver test design

## 1. 位置付け

`PLAN-L7-532-pack-publication-driver` と `PLAN-REVERSE-532-pack-publication-driver-backfill`
専用の pair artifact である。`PLAN-L7-515` の pair artifact (`L7-pack-publication-remote-test-design.md`)
が所有する adapter FSM の候補 (`CANDIDATE-PACKPUB-003-*`) と、`PLAN-L7-519` の実装束縛
(`L7-pack-publication-remote-adapter-test-design.md`) を変更せず、本番 port と CLI 入口だけを
検証する差分 oracle を定義する。

実 Pack / GitHub credential、remote mutation、stable promotion はテストで実行しない。process
execution は注入 port とし、fake runner が受け取った argv・stdin・timeout と、返した exit /
stdout / stderr の call ledger を正本にする。

この pair-freeze では候補だけを宣言する。production source と test code を追加せず、共有
`L7-unit-test-design.md` への `U-*` 登録は実装 PR まで行わない。

## 2. テスト対象の入力と port

### 2.1 入力

- sealed staging 出力 (`PLAN-L7-508`): tar.gz + `.sha256` の exact 2 asset、control manifest
  sidecar、release identity、source revision。fixture は `SealedPackPublicationPlan` 相当の
  immutable 値として明示し、source worktree・directory walk・glob・local Pack checkout・開発 DB・
  環境変数から補完しない。
- approval file: `PackPublicationApproval` を JSON 化した fixture。正常系は mutation ごとに
  1 file、異常系は欠落・期限切れ・別 operation / intent / state / key・二重 consume。
- fake runner の応答 script: 各 `gh` argv に対する exit / stdout / stderr / 遅延 (timeout 再現)。

### 2.2 injected ports

| port | 本番実装 (PR-1) | テスト時 |
| --- | --- | --- |
| `ProcessRunnerPort` | `gh` を argv 配列で `spawnSync` 相当に起動、timeout / 出力上限付き | fake runner (call ledger) |
| `PackPublicationPorts.pack / release / tag / visibility / canary / auditor / reconcile` | `ProcessRunnerPort` 経由の `gh api` / uploads endpoint、read-back は再取得 + 再計算 | 同上 (fake runner の応答から観測を構成) |
| `PackPublicationPorts.approval` | file-backed。commitment (`origin/main` record) と seal 前照合 → consume 時に 9 field + commitment 再照合 → 原子的 rename → journal `nonce_consumed` | temp dir の fixture file + fixture git repo の `origin/main` に置いた commitment record |
| `PackPublicationPorts.durableState` | append-only jsonl + fsync、hash chain digest | temp dir、persist failure を注入可能 |
| `PackPublicationPorts.receipt` | `receipt.json` の一度書き | temp dir |

## 3. Candidate oracle matrix

| Candidate | Stimulus / mutation | 独立 oracle |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-005-A` | argv を文字列連結・shell 経由 (`sh -c` / `cmd /c`) で組む実装へ変異 | fake runner が受けた argv が配列で、先頭が `gh`、shell wrapper 0 件。文字列 argv は型で Red |
| `CANDIDATE-PACKPUB-005-B` | `gh auth status` の主体、`gh repo view` の owner/name、expected main SHA、tag 名の 1 軸を不一致にする | 最初の remote write より前に typed deny、write argv 0 件 |
| `CANDIDATE-PACKPUB-005-C` | approval file の欠落、`expiresAt` 超過、別 operationId / intentDigest / approvalStateDigest / idempotencyKey、seal 後に file の `nonce` を置換、`approver` を `--approver` と異なる identity へ差替、2 file 間で `approver` が不一致 | `approval_missing` / `approval_expired` / `approval_state_mismatch` / `approval_binding_mismatch` (nonce 置換・approver 差替を含む)、既 consume は `nonce_replay`。該当 mutation とそれ以降の write 0。approver 不一致は seal 前 (write 0) |
| `CANDIDATE-PACKPUB-005-D` | 同一 approval file の 2 回 consume、rename 失敗 (EPERM 注入) | 2 回目は `mode: "reconcile"` のみ (新規 write 0)、rename 失敗は deny で journal に `nonce_consumed` 無し |
| `CANDIDATE-PACKPUB-005-E` | journal append の persist failure を `mutation_intent` の直前 / 直後に注入 | 直前は write 0、直後は `indeterminate` で後続 write 0。成功へ丸めない |
| `CANDIDATE-PACKPUB-005-F` | `mutation_intent` の後、`read_back_observation` の前で process を打ち切り、再起動 | 再起動後は reconciliation (観測系 argv のみ) で、同じ mutation の write を replay しない |
| `CANDIDATE-PACKPUB-005-G` | `gh` 非 0 exit、timeout、stdout 上限超過を mutation 前 / 後に注入 | 前は `unavailable` (write 0)、後は `indeterminate` (後続 write 0)。exit 0 以外を成功にしない |
| `CANDIDATE-PACKPUB-005-H` | fake 応答と approval fixture に token 風文字列・approval 本文・nonce を含める | token 風文字列は stdout / journal / receipt / error message で 0 件。approval 本文 (JSON 全体) と未 consume nonce は stdout / error message で 0 件。journal `nonce` と receipt `nonces` は consume 済み approval file の `nonce` と mutation ごとに 1:1 で byte 一致し、未 consume の nonce を含まない |
| `CANDIDATE-PACKPUB-005-I` | PLAN §3.2 の port ↔ `gh` 対応表から 1 行の endpoint / method を変異 | 正常系の argv snapshot が対応表と 1:1 で一致し、変異は Red。port 内で次遷移の write を先行しない |
| `CANDIDATE-PACKPUB-005-J` | asset upload 後の read-back で size / SHA-256 を 1 byte 変異、asset 数を 1 / 3 にする | `mismatch` / `partial_publication`、tag 以降の write 0 |
| `CANDIDATE-PACKPUB-005-K` | テストコードが `ProcessRunnerPort` を迂回して `child_process` を直接呼ぶ | 実 `gh` の起動 0 件 (fake runner の ledger 以外の process 起動を検出したら Red) |
| `CANDIDATE-PACKPUB-005-L` | CAS merge 直前の main 再観測で expected main SHA と drift | merge write 0、`mismatch`。pointer append (canary) でも同じ |
| `CANDIDATE-PACKPUB-005-M` | CLI を `--execute` 無しで実行 | remote write argv 0 件、観測系 argv のみ。intent digest と approval skeleton を出力し nonce を含まない |
| `CANDIDATE-PACKPUB-005-N` | `--execute` で途中の mutation の approval file を欠落させる | 該当 mutation の直前で deny、以前の immutable object (PR / draft / asset) は保持、`partial_publication` を報告 |
| `CANDIDATE-PACKPUB-005-O` | CLI 入力に staging 外の path、glob、環境変数由来の entry を混ぜる | `PLAN-L7-508` staging module の typed deny (`commit_entry_mismatch` 等) をそのまま返し、補完 0 |
| `CANDIDATE-PACKPUB-005-P` | wrong-commitment: approval file 一式を自己整合した別 nonce 群へ差し替える (commitment record は `origin/main` のまま) | `sha256(nonce)` が record の `nonce_sha256` と不一致 → `approval_commitment_mismatch`、seal 到達 0、remote write 0 |
| `CANDIDATE-PACKPUB-005-Q` | wrong-approver: approval file の `approver` を record と異なる identity にする (nonce は一致) | `approval_commitment_mismatch`、seal 到達 0、remote write 0。receipt 生成 0 |
| `CANDIDATE-PACKPUB-005-R` | wrong-authority: (a) record を working tree にだけ置く、(b) local HEAD にだけ commit する、(c) `origin/main` の record が別 operationId / intentDigest / idempotencyKey、(d) record の `expiresAt` 到来 | (a)(b) `approval_commitment_missing`、(c) `approval_commitment_mismatch`、(d) `approval_expired`。いずれも seal 到達 0、remote write 0。working tree / HEAD fallback を書いた実装は (a)(b) で Red |

`CANDIDATE-PACKPUB-005-A..L` と `-P..R` は PR-1 (port module)、`-M..O` は PR-2 (CLI 入口) が所有する。
実装 PR で Red→Green を観測した行だけを同番号の `U-PACKPUB-DRIVER-*` へ 1:1 で昇格し、
共有 `L7-unit-test-design.md` へ登録する。

## 4. Gate and scope fence

- 実 Pack repository への write をテスト・CI・レビューで行わない。fake runner の ledger 以外に
  process 起動が観測されたら Red。
- `PLAN-L7-515` の FSM 順序、CAS、nonce、journal 契約を本 artifact で再定義しない。adapter
  本体 (`pack-publication-adapter.ts`) の oracle は `CANDIDATE-PACKPUB-003-*` が所有する。
- rollback (`CANDIDATE-PACKPUB-004`)、stable 昇格、updater (#481)、Product A/B (#364) は本
  artifact の oracle ではない。
- candidate の存在だけを Green 証跡、公開完了、#418 / #364 受入の根拠にしない。

## 5. Required evidence

実装 PR は、fake runner の call ledger (argv snapshot、順序、回数)、approval consume の
journal 行、persist failure / crash 注入の再現 script、targeted command の exit code、typecheck /
Biome、Linux / Windows / aggregate CI run ID、exact HEAD、非著者 closing receipt digest を残す。
