---
memory_id: memory:project:po-forward-d0-pr-train-order-2026-07-30-codex-pr-handling
kind: project
title: "PO forward D0 PR train order 2026-07-30 (codex PR handling)"
tags: ["2026-07-30", "bun-withdrawal", "codex-order", "issue-149", "pr-196", "torsion"]
updated_at: 2026-07-30T01:37:30.257Z
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
