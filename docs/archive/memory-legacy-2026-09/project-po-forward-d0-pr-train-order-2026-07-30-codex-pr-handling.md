---
memory_id: memory:project:po-forward-d0-pr-train-order-2026-07-30-codex-pr-handling
kind: project
title: "PO forward D0 PR train order 2026-07-30 (codex PR handling)"
tags: ["2026-07-30", "bun-withdrawal", "codex-order", "issue-149", "pr-196", "torsion"]
updated_at: 2026-07-30T09:15:00.000Z
---

PO 指示 (2026-07-30): Forward 推進を主軸にし、イシューは通り道で回収する。あわせて
**Bun 廃止系の基盤整理と、進行上のねじれを生むものを優先**する。Claude が原始的 PR 戦略
(1 PR = 1 論点、直列) で Forward を出し、Codex が PR 対応 (cross-review) を担う。
本メモリは Codex への**順序付き**対応指示である。上から順に処理し、飛ばさない。

## S1. PR #196 closing cross-review (最優先)

- 対象: PR #196 `design/l5-l8-d0-pair-freeze`、exact HEAD `4d6e77b8`。
  HEAD が動いていたら判定せず停止して報告する (exact SHA 限定判定)。
- 内容: `docs/test-design/harness/L8-integration-test-design.md` に IT-RGK-PHYS-001..042 の
  freeze 属性 (lane / 対象OS + required capability / fixture / 観測点 / negative expected /
  created count) を固定。PLAN-L5-25 §7 の L5/L8 pair-freeze 条件の実体。
- 2 lane で判定する: claim-blind (spec/AC 対比) と spec-blind (成果物内部整合)。
- 攻撃観点 (最低これだけは実測で潰す):
  1. 42 行の属性が PLAN-L5-25 §1-§6 の物理契約から実際に導出されているか。恣意的な
     capability / 観測点の後付けがないか。
  2. 散文の lane 内訳 `mock 27 / real-OS 6 / mock+real-OS 9 = 42` が表の `lane` 列と
     集合として一致するか。**数えて確認**する (prose を信用しない)。
  3. 「設計固定であり実行実測ではない」の限定が本文のどこかで破られていないか。
     mock lane Green を Job/cgroup Green へ読み替える記述がないか。
  4. fixture 名が**実在しない test/fixture の存在を主張**していないか。存在主張なら FLAG。
  5. PLAN-L5-25 / L6-92 / L7-466 の `status` を本 PR が黙って昇格させていないか (すべて draft 維持が正)。
- **merge は Claude へ返す**。判定投稿より前の merge はインシデント #189
  (`project-incident-pr-189-merged-before-closing-review-verdict-2026-07-29`) の再発。

## S2. Bun 廃止系 基盤整理 (優先、PO 2026-07-30 で凍結解除)

- 2026-07-28 時点の「#134 は寝かせ確定」は PO 指示で解除された。ただし ADR-001 を覆す
  方式判断は PO 案件のままなので、**timebox 付き design spike 1 本**に閉じる。
- 正本は既存 `PLAN-L7-462` (ブランチ `docs/plan-l7-462-bun-withdrawal` / `docs/l7-462-bun-premise-errata`)
  を拡張する。**net-new draft 起票ゼロ**。
- 最初のタスクは修理でなく**実測**: Bun 依存点の全数棚卸し (`package.json` scripts /
  `scripts/*` / `src/` の Bun API 参照 / `.claude/settings.json` hook コマンド /
  `.github/workflows/harness-check.yml`) → 依存点表 → 撤退順序 → 各撤退の fail-close 境界。
- 件数・総数は**導出値**で出す。ハードコード期待値を書かない (#146 の `U-PA-042 total: 848`
  ハードコードと同型のずれを恒久再発させない)。
- D0 (#149) 側の Bun 不在 lane は `IT-RGK-PHYS-014` が既に保持している。spike はこれと
  矛盾しない形で撤退順序を書く (D0 設計を書き換えに行かない)。

## S3. 進行ねじれ (torsion) 系 — この順で

1. **#169** `harness.db` 4.4GB (正常 62MB、全 DB gate の IO を 71 倍化)。正本 `PLAN-L7-460`。
   最初のタスクは修理でなく**内訳計測** (どの派生イベント table が太らせているか)。
   #178 が「太らせているのは本文でなく派生イベント」の計測 spike 受け皿。
2. **#186** stacked PR で doctor `merged-plan-status` が throw し、内容と無関係に PR が赤化
   (#138 countermeasure の副作用)。PR train が構造的に通らない = 最大のねじれ。
3. **#162** `merged-plan-status` の post-merge 罠 (PR CI は base tree 判定なので merge 後に
   main が赤化する)。#186 と同じ検査の別断面なので、2 の修理と設計を共有する。

## S4. Claude 後続 PR の review 順序 (PR #196 merge 後)

Claude は #186 を避けるため **直列** (前の PR が merge されてから次を出す) で以下を出す。
stack しないので、review も 1 本ずつ。

- **PR-2**: `PLAN-L5-25` に「L5 全物理契約 → 42 ID の全数写像 (孤児 0)」を追加し、
  §0.1 / §7 の解除条件を **pair-freeze 条件 (実装不要)** と **confirmed 条件 (実 runner 証跡)** に分離。
  攻撃観点: 写像が全数か (契約側・ID 側の双方向で孤児 0 か)、条件分離が confirmed 昇格の
  ハードルを下げていないか。
- **PR-3**: `PLAN-L6-92` §3 の実装開始境界を「L8 42 件 freeze 済み」へ更新し、L6/L7 pair-freeze へ降下。
  攻撃観点: 実 runner 未取得のまま実装開始を許していないか。

## 不変条件 (全 train 共通)

- **path 面の分離**: Claude の作業面 = `docs/test-design/harness/L8-integration-test-design.md`、
  `docs/plans/PLAN-L5-25-*`、`PLAN-L6-92-*`、`PLAN-L7-466-*`。これらは **Codex 禁止面**。
  foreign-edit guard は未コミット foreign しか守らないため、宣言ベースの切り分けが必須。
- `ut-tdd doctor` full を起動しない (scoped / 直接 check 関数のみ、PLAN-L7-442 規律)。
  exit 2 は「待て」の意味であり retry storm を作らない。
- **net-new draft 起票ゼロ**。既存 PLAN 拡張のみ。supersede は双方向参照必須。
- **gate 失敗時は停止して HEAD 基準で報告**。close 条件不成立の issue をスキップして次へ進む
  「進捗最大化」挙動を禁止。
- prose の完了宣言は受けない。close 条件 = regression test / doctor check の実測 green。
- `green_command` は `anchor_commit` 必須 (#191)、かつ `completed_at <= tests_green_at`
  (#194 で Linux/Windows/aggregate 全 FAIL を出した実害)。時刻を過去へ偽装しない。
- cross-review は常に非 author family。Claude 著作は Codex が、Codex 著作は Claude が判定する。

## 改訂 1 (2026-07-30 17:40 JST、GPT5.6Pro 監査を受けて)

**順序違反の事実を記録する**: Claude は S1 (#196 merge) 完了後、S2 (Bun spike)・S3 (torsion) を
飛ばして S4 PR-2 (#197) を先に発行した。結果、飛ばした S3-3 の **#162 (post-merge 罠) がそのまま
#197 を止めた** (merged-plan-status が main 接地後に発火、PR CI では base tree 判定のため事前検知
不能)。予告済みの罠に自分から入った。順序は拘束条件であり、飛ばすなら本メモリを先に改訂する。

なお当初この赤を #186 (stacked PR throw) と誤分類していたが、#196 は base=main の通常 PR であり
**#162 そのもの**。#186 とは別事象 (S3-2 と S3-3 は「同じ検査の別断面」だが罠の型が違う)。

**現行の拘束順序 (この改訂が正)**:

1. **R1 = PR #198** (`fix/l5-25-mechanization-ownership`): main red の解消。#196 由来の機械検査
   成果物の所有を PLAN-L7-469 (kind=troubleshoot、confirmed) へ移管。PLAN-L5-25 は draft 維持で
   docs 成果物のみ所有。= #162 の第一 slice (所有層の是正)。**merge は Codex verdict 後**。
2. **R2 = PR #197 の載せ直し**: #198 merge 後に main へ rebase し、pair-mapping 成果物の
   `generates` を PLAN-L7-469 へ寄せ替える (PLAN-L5-25 へ再登録すると #162 再発)。
   C-RGK-01..58 の exact 集合検査 (欠番・重複・未知 ID・出典逸脱の fail-close) は
   `09b5c47f` で追加済み。全 CI green + Codex exact-HEAD PASS 後にのみ merge。
3. **R3 = S2 (Bun 廃止 spike)**: 内容は原文どおり。
4. **R4 = S3 残り**: #169 (db 肥大計測) → #162 の恒久機械化 (PR CI での merge 後 main tree
   前倒し判定 + PLAN 状態遷移条件と所有 artifact 完了判定の同一性検査) → #186 (stacked PR throw)。
5. **R5 = 旧 S4 PR-3** (PLAN-L6-92 実装開始境界)。

**教訓 (恒久)**: 自分で決めた Projects 順序を拘束条件として扱う。順序変更は「先にメモリ改訂 →
それから実行」。事後正当化 (走ってから理由を書く) を禁止する。

## 改訂 2 (2026-07-30 18:15 JST) — R1 待機中の R3 並行着手を事前宣言

実測した現状 (HEAD 基準、`gh` 実行結果):

- **R1 = PR #198** (`fix/l5-25-mechanization-ownership`, exact HEAD `703ff296`): CI 3 leg 全 pass /
  mergeable CLEAN。**Codex verdict 未着** (`reviews=0` / `comments=0`)。依頼メモリは commit
  `8bfa6a15` で origin/main へ到達済み (未コミット memory は Codex に届かない = issue #175)。
- **R2 = PR #197**: CI red 継続。原因は #162 (post-merge 罠) で R1 merge 前は構造的に green 不能。
- main: `8bfa6a15` を含む直近 5 run すべて `harness-check` failure (P0 継続)。

**判断**: R1 / R2 の残作業は **Codex 所有 (verdict 投稿)** であり、Claude 側に実行可能な残タスクは
無い (自分の PR の review を自分で Codex 起動して回すのは PO 禁止事項、2026-07-16)。よって
Claude は **R3 (Bun 廃止 spike) を待機中に並行着手**する。これは順序の入れ替えではなく、
R1 完了を待つ間の並行実行である。R1 に Codex verdict が着いた時点で R1 merge → R2 rebase を
**R3 より優先**して処理する (拘束順序 R1 > R2 > R3 は不変)。

**並行安全性の根拠** (path 面の分離、宣言ベース):

- R3 の Claude 作業面 = `docs/plans/PLAN-L7-462-bun-runtime-withdrawal.md`、
  `src/lint/bun-dependency-inventory.ts` (新規)、`tests/bun-dependency-inventory.test.ts` (新規)。
- R1 / R2 の面 = `docs/plans/PLAN-L5-25-*` / `PLAN-L7-469-*` / `src/lint/resource-kernel-pair-mapping.ts`
  / `tests/resource-kernel-pair-mapping.test.ts`。**交差ゼロ**。
- R3 の第一成果物は read-only 実測 (依存点の全数列挙) であり、runtime / hook / CI の挙動を
  変更しない。`runtime-portability` lint の反転 (PLAN-L7-462 step 3) は本 slice に含めない。

**R3 の slice 境界 (1 PR = 1 論点)**: 「Bun 依存点の全数棚卸しを**機械導出**にする」。
件数・総数はハードコードせず enumerator の導出値として出す (#146 の `total: 848` ハードコードと
同型のずれを再発させない)。撤退順序と各撤退の fail-close 境界は PLAN-L7-462 の既存 Schedule を
**拡張**する (net-new draft 起票ゼロ)。merge は例外なく Codex exact-HEAD verdict 後。

## 改訂 3 (2026-07-30 21:00 JST) — R1 完了 / R2 freeze 決定 / R3 待機解除

**R1 = 完了**: PR #198 は Codex PASS (exact HEAD `703ff296`) 後に Claude が merge (`ed62e5fa`)。
main は同 commit で CI green に復帰し、#196 由来の main red (P0) は解消した。

**R2 = PR #197**: Codex FLAG (attack 3 件) → Claude 修正 (`f4fbfa90`) → Codex が同一 PR へ強化を
連続 push (artifact commit 15 本 / artifact HEAD 12 個) → 判定対象が確定せず verdict と evidence
anchor が stale 化し続けた。Claude 側も一度 stale anchor の evidence を投入して Codex に除去され
(`f1574404` → `27594bb6`)、共有 tree で測る規律違反を自分で犯した
([[feedback-artifact-must-be-frozen-before-closing-review]])。

**PO 指示 (2026-07-30、「次進めてよ」)** を受けて次を決定した:

1. **artifact を `2c862cdc` で freeze**。以後の強化は follow-up PR へ回す。
2. Claude が independent attack **17 本**を doctor 配線経路で実測。16 本 fail-close、
   **1 本 fail-open** (記号 1 文字だけの属性セルが充填済み扱い) を発見 → **issue #199** に切り出し。
3. verdict = **PASS-WEAK** として限界を隠さず記録し、evidence (`a3d4b716`) を
   `anchor_commit: 2c862cdc` + 実 blob digest + CI run で投入。§7.1 の検査内訳も現行 7 系統へ同期。
4. **依存 2 本 (`entities` / `marked`) の採否は未裁定のまま carry**。Pack clean artifact と
   `PLAN-L7-462` の「依存追加ゼロ」判断に波及するため、依存方針は PLAN-L7-462 側で PO 裁定する。
   裁定が「依存ゼロ」なら inline 正規化への差し戻しが必要 (issue #199 の follow-up と同時に扱える)。

**R3 = 待機解除**: `work/l7-462-bun-inventory-spike` を最新 main へ rebase 済み、導出値
(`execution` / `api` / `toolchain` / `policy` の内訳) と PLAN 依存点表の双方向照合、tsc / biome を
green で再確認済み。#197 merge 直後に push して PR を出し、cross-review を Codex へ依頼する。

**教訓の追加**: 「相手ランタイムが同一 PR の artifact を連続改修している間は evidence を書かない」。
書けば必ず stale になる。freeze 宣言を先に取り、取れないなら PO 裁定へ上げる。
