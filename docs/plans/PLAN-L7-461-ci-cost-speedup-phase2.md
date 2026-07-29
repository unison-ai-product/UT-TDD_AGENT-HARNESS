---
plan_id: PLAN-L7-461-ci-cost-speedup-phase2
title: "PLAN-L7-461 (troubleshoot): GitHub CI 高速化 Phase 2 — doctor 二重実行の解消 + 実測駆動 static shard (issue #109 残 AC)"
kind: troubleshoot
layer: L7
drive: agent
route_signal: incident
route_mode: incident
status: draft
created: 2026-07-28
updated: 2026-07-29
backprop_decision: not_required
backprop_decision_reason: "Internal harness CI cost re-allocation; does not change the product's external requirement / design / test-design contract. Gate coverage itself is preserved fail-close (required contexts は増える方向のみ)。"
owner: PM / PO
agent_slots:
  - role: aim
    slot_label: "AIM - shard 境界と doctor 単一実行化方式の設計判断"
  - role: tl
    slot_label: "TL - shard 分割の fail-close 性 (required context 欠落なし) と doctor 単一実行化の等価性レビュー"
  - role: se
    slot_label: "SE - workflow 分割 + doctor artifact 共有 + github-ci-policy detector 追随の実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-461-ci-cost-speedup-phase2.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/result-file.ts
    artifact_type: source_module
  - artifact_path: src/git/default-branch.ts
    artifact_type: source_module
  - artifact_path: tests/doctor-result-file.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-455-ci-cost-speedup-phase1.md
    - docs/plans/PLAN-L7-221-github-ci-policy-gate.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-461 (troubleshoot): GitHub CI 高速化 Phase 2

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/109 (残 AC)

注: 実装 deliverable (.github/workflows/harness-check.yml / src/lint/github-ci-policy.ts /
tests/github-ci-policy.test.ts) は既存ファイルのため draft 段階の generates には載せない
(merged-plan-status / duplicate-artifact-ownership 対策)。実装 PR で generates を更新し
confirm と同時に宣言する。前提 PLAN-L7-455 (Phase 1) は PR #112 が merge されるまで
references 扱い (requires の ready 条件を満たさないため)。

## 背景 (2026-07-28 実測、run 30261670421 = 直近 main green run)

Phase 1 (PLAN-L7-455、PR #112) は doc-only lane を絞る。code PR の full lane は
未着手で、実測の内訳は以下:

- harness-check-linux 全体 ~5 分。支配項は vitest 全回帰 **261s** (wall 242.92s /
  tests CPU 594.01s、237 files)。次点 doctor step **50s**、db rebuild 14s。
- harness-check-windows 全体 ~5 分。支配項は test:fast **255s**。
- **テスト時間の 78% が上位 5 ファイルに集中** (594s 中 462s):
  doctor.test.ts 133s / projection-writer.test.ts 130s / cli-surface.test.ts 100s /
  db-projection-ingestion.test.ts 65s / distribution-acceptance.test.ts 34s。
- **doctor が linux leg 内で二重実行されている**: CI step `doctor (governance hard
  gates)` (50s) と、vitest 内 U-TESTHYGIENE-028 (doctor.test.ts 内で runDoctor
  full 実行、CI 実測 114s = PR #113 run 29816573228 ログ) が同一の governance
  検査を 2 回走らせている。

この実測は issue #109 骨子の「変更影響範囲ベースの vitest shard」より単純な設計を
支持する: 変更影響推定 (fail-open リスクと実装コストが大きい) を導入しなくても、
**静的なファイル単位 2-shard** で上位集中を分散でき、安全性は「両 shard を required
context にする」だけで fail-close に保てる。

## Phase 1 の realized benefit 実測と lane 戦略の設計判断 (2026-07-28、advisor: claude-fable-5)

Phase 1 (PLAN-L7-455) の doc lane は **実トラフィックに対して 0% しか当たっていない**:

- 実装された doc-safe allowlist は `docs/archive|migration|reference|research/**.md` の
  4 tree のみ (`src/github/change-lane.ts` の `DOC_LANE_PREFIXES`)。2026-07-21 の blind
  review FLAG 是正で正本設計・governance・PLAN・runtime 規則・共有 memory を除外した結果。
- **main の first-parent commit 158 件 (2026-07-01 以降、基準HEAD `2f59e5a8`) のうち doc lane 該当は 0 件**
  (実測)。実 doc トラフィックは `docs/plans/**` の PLAN 起票と `.ut-tdd/memory/**` が
  支配的で、allowlist の 4 tree はほぼ触られない。

**判断: Phase 2 に「PLAN doc / memory 向け governance lane」は追加しない。** docs/plans は
vitest 内ゲート (U-TESTHYGIENE-028 の doctor 集約、backfill-pairing) の *入力* であり、
2026-07-28 に PR #167 が PLAN doc 変更だけで両ゲートに落ちた実例がある (反例が実在)。
手作業 allowlist の拡大は false-green (fail-open) を作る。lane 化が成立するのは
「skip する step がその path を読まない」ことを機械的に示せる場合のみで、それには
path→test 依存マップが前提 (別 PLAN の責務、本 PLAN スコープ外)。よって Phase 2 は
下記スコープ 1・2 (全 PR に効く支配項) に集中する。

副次是正 (本 PLAN で即時実施): workflow header のコメントが実装より広い allowlist
(`docs/**.md` から docs/plans を除外 + `.ut-tdd/memory/**`) を記述する doc-code drift が
あり、orchestrator の lane 誤予測という実害を出した。header を実装に合わせ、
`tests/change-lane.test.ts` が header を parse して `DOC_LANE_PREFIXES` と集合一致を
検査する回帰を追加する (コメント修正だけでは再発を止められないため)。

## スコープ

1. **doctor 単一実行化 (最大単発効果、低リスク)**: linux leg で runDoctor を 1 回に
   する。方式は step 1 の設計メモで確定するが、候補は (a) CI doctor step が `--json`
   結果を artifact/file に出し、doctor.test.ts の aggregate-baseline 系 assertion が
   CI 上ではその実測 artifact を検証する (ローカル vitest 単体では従来どおり自走)、
   (b) U-TESTHYGIENE-028 相当の baseline 検査を doctor 本体の check に昇格し、vitest
   側は薄い契約テストに縮小する。**検査の等価性 (検出できる違反集合が縮まないこと) を
   TL レビューで確認するまで実装しない。**
2. **linux vitest static 2-shard**: 実測 duration に基づくファイル単位の静的分割
   (shard A ≈ doctor + projection-writer 系、shard B ≈ 残り)。両 shard job を
   aggregate `harness-check` の needs に加え、github-ci-policy detector を追随させる
   (shard 片肺・shard 欠落は fail-close)。
3. **windows leg 特化の設計判断書き出しのみ** (実装しない): OS 依存面 (path separator /
   SQLite handle / spawn 系) に test:fast を絞る案の被覆トレードオフを設計メモ化し、
   QA/PO 判断に回す。Phase 2 では判断材料の作成まで。

## スコープ外

- 変更影響範囲ベースのテスト選択 (fail-open リスクのため、一致率計測基盤が先)。
- ローカル snapshot runner の clone/install 固定費 (issue #98 の責務)。
- 内部 gate ↔ GitHub CI 一致率計測 (issue #109 の別 AC、後続 PLAN)。

## Schedule

- step 1 (serial): doctor 単一実行化の方式設計メモ + 等価性の oracle 宣言 (テスト設計)
- step 2 (step 1 と並列): shard 分割表の作成 (実測 duration 引用) + detector 追随のテスト設計
- step 3 (serial): 実装 + before/after 実測 (run URL を evidence として引用)
- step 4 (serial): blind review (非 author provider) → confirm

## AC

- AC-1: code PR の harness-check-linux leg 実測が短縮される。before = 直近 main green
  run の実測 (~5 分、vitest 261s) を引用し、after は同条件 run URL で裏取る (prose
  断定禁止、PLAN-L7-89 claim discipline)。
- AC-2: doctor の governance 検査集合が単一実行化の前後で縮まないことをテストで固定
  (check 名の集合比較、fail-close)。
- AC-3: shard 片肺 (どちらかの shard job が required から外れる / 欠落する) を
  github-ci-policy detector が fail-close で検出する回帰テストが green。
- AC-4: 両 shard + aggregate の required context 構成で PR CI が green になる実 run を
  evidence として引用。
- AC-5: workflow header の doc-safe allowlist 記述が `DOC_LANE_PREFIXES` と集合一致し、
  ずれた場合に落ちる回帰テストが green (tests/change-lane.test.ts、marker 欠落も
  fail-close)。

## 2026-07-29 doctor 単一実行化の実装と before/after 実測 (スコープ 1)

### 採択方式 (advisor `gpt-5.6-sol` 敵対検証で確定)

当初案 (envelope を「同一 HEAD + full scope」だけで消費) は **refuted**。artifact の採用条件が
doctor の実入力を表していないためで、具体的な反例が 3 件ある:

- `memory-sync` は `git ls-tree origin/main` に依存する (snapshot に ref が無い)。
- `merged-plan-status` は default branch SHA を解決できないと throw する (issue #186)。
- CI step は `--strict-green-command-digest` 付き、vitest 側は無しで検査集合が異なる。

採択したのは **宣言済み portable surface + producer receipt 一致方式**:

1. snapshot runner が default branch の ref→SHA を注入する (`src/git/default-branch.ts` が
   解決規則の SSoT、`scripts/run-vitest-snapshot.ts` が注入)。**解決できない面では注入せず
   従来どおり fail-close** (`U-TESTHYGIENE-054`)。
2. envelope が再利用に必要な宣言済み surface を持つ: `head_sha` / `scope` / `profile` /
   `producer_root` / `ref_map` / `options` / `check_ids` / `producer` / `payload_digest`。
   closed schema として未知fieldを拒否し、producer command/versionもconsumer期待値と照合する。
3. 消費は **CI 文脈かつ全項目一致時のみ**。ローカルは非権威 (`not-ci-context`)。
   1 つでも違えば full 自走へ落ちる。
4. CI の doctor step を test step の前へ移し、envelope を書き出す。

これは同一job内のproducer測定receiptであり、checkoutとdetached snapshotの再測定結果が完全一致する
という主張ではない。gitignored runtime stateやprocess環境はportable surface外であり、その同値性を
envelopeから推論しない。

署名は置かない。同一 job 内の信頼済み step 間の受け渡しであり、鍵も同じ job に置く署名は
同 job のコードに対して実効性が無い (advisor 判断)。`payload_digest` が破損検出であって
真正性の証明ではないことは `U-DOCTORENV-005` で契約として固定した。

### AC-2 (検査集合が縮まないこと) の機械固定

`U-DOCTORENV-011`: producer の `check_ids` が consumer の期待集合より 1 件でも少なければ
`check-id-set-mismatch` で不採用 → fence は自走する。縮んだ検査集合を fence が受理する経路は無い。

### 実測 (AC-1)

計測条件: 同一 runner class (ubuntu-latest)、同一 lane (full)、`harness-check-linux` leg、3 run 中央値。

**before (main、PR #180/#182/#185 の CI):**

| run | test step | doctor step | job |
|---|---|---|---|
| 30429616284 | 292s | 56s | 394s |
| 30429538376 | 283s | 53s | 384s |
| 30429216693 | 276s | 52s | 370s |
| **中央値** | **283s** | **53s** | **384s** |

**after (PR #189):**

| run | test step | doctor step | job |
|---|---|---|---|
| 30439367501 | 241s | 54s | 332s |
| 30439854225 | 176s | 38s | 251s |
| 30440302849 | 240s | 54s | 334s |
| **中央値** | **240s** | **54s** | **332s** |

**差分 (中央値)**: test step **-43s (-15.2%)** / job **-52s (-13.5%)**。doctor step は +1s (誤差)。

envelope が実際に消費されたことは CI ログの `doctor-envelope: accepted` で確認した
(run 30439854225 / 30440302849。run 30439367501 は診断行の追加前で marker 無し)。
自走へ落ちていれば marker は不採用理由を出す。

### 見積もりの誤りを訂正する (実測に合わせる)

本 PLAN §背景は vitest 内 doctor を **114s** (PR #113 run 29816573228) と記録し、advisor も
その値から上限 32% を見積もった。**この値は再現しなかった**。実測の削減は中央値 43s であり、
現在の runner class では vitest 内 doctor の実コストが 114s ではなく 40〜50s 程度である。
114s は別日・別 runner の単発値であり、削減見積もりの基準にしてはならない。

run 30439854225 は job 251s と他 2 本より 80s 速く、**runner 側のばらつきが削減幅と同程度**ある。
したがって「約 15% 短縮」は中央値としての主張であり、単発 run の比較で語らない。

### 残件

- shard 分割 (スコープ 2) と windows leg の設計判断 (スコープ 3) は未着手。
- 本 PR で declare した `generates` は **merge 時に confirm と同時**に有効化する必要がある
  (`merged-plan-status` は merge 後に draft のままだと fail-close する。issue #162 の型)。
