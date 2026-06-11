# A-131 — PLAN-RECOVERY-04 closure accept (工程表定義 Recovery)

- **date**: 2026-06-11
- **plan**: PLAN-RECOVERY-04-roadmap-definition (kind=recovery, layer=cross)
- **accepted_by**: PO (人間サインオフ、§2.6.3)
- **trigger**: PO directive「1承認で Codex が実装できる状態になるまで進めて」(2026-06-11) — §5 未了 PO 判断の #1 (RECOVERY-04 closure 承認) を grant。

## closure 根拠 (§6 exit 条件の充足)

- [x] collect (§1) + PO 認識確認 (§2)。
- [x] reopen point 確定 (§3 = concept/metamodel 定義層)。
- [x] 製本化 (§4): concept §10.2 工程表定義 back-merge + 用語登録 + requirements §G.E3 被覆要件降下着地 (commit 2f1981d)。
- [x] Reverse pairing: PLAN-REVERSE-44 起票 (L6 詳細 = park/rollup は REVERSE-44 Step3 tracked、Codex 実装へ)。
- [x] 再発防止: program-coverage チェック実装 (`analyzeProgramCoverage` + `PROGRAM_BANDS` + doctor surface + U-ROADMAP-015〜018)。
- [x] reopen point 独立確認 (review 前置): pmo-sonnet intra_runtime adversarial 審査 = blocker なし / 条件付き → §5 carry 2 件反映済。
- [x] **PO closure 承認** (本 audit)。
- [x] **fullback (全バンドの工程表登録 完遂)**:
  - descended バンド登録: design (L4-00/L5-00/L6-00 master の roadmap ブロック) + upstream (PLAN-L3-00-master 新規)。program-coverage 1/5 → 3/5。
  - future バンド明示 defer: verification (L8-L14、forward 未降下) / cutover (harness.db close 後の射程) を §5 carry で正規 defer 宣言 (concept §3.1.3.1)。
  - → 全 5 バンドが「登録 or 明示 defer」で account 済 = 全プログラム被覆の完遂。

## 残 carry (closure を妨げない、別 PLAN へ trace)

- **park 機構配線 + program rollup**: REVERSE-44 Step3 (Codex 実装)。これにより verification/cutover が uncovered warn → parked 表示へ。それまで warn-first surface (意図的、requirements §G.E3 明記)。
- **IMP-132** (roadmap 到達計数の completed 対応): 別途。

## verify

- vitest 440 green / doctor exit=0 (roadmap 4 工程表 + 孤児0、program-coverage 3/5 = descended 完遂 + future defer)。

PLAN-RECOVERY-04 を **completed** とする。
