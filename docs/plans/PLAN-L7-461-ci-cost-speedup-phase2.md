---
plan_id: PLAN-L7-461-ci-cost-speedup-phase2
title: "PLAN-L7-461 (troubleshoot): GitHub CI 高速化 Phase 2a — doctor 二重実行の解消"
kind: troubleshoot
layer: L7
drive: agent
route_signal: incident
route_mode: incident
status: confirmed
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
  - artifact_path: tests/support/doctor-envelope.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: .github/workflows/harness-check.yml
    artifact_type: config
  - artifact_path: src/lint/github-ci-policy.ts
    artifact_type: source_module
  - artifact_path: tests/github-ci-policy.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-455-ci-cost-speedup-phase1.md
    - docs/plans/PLAN-L7-221-github-ci-policy-gate.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence:
  - reviewer: claude-fable-5
    review_kind: cross_agent
    reviewed_at: "2026-07-29T21:33:00+09:00"
    tests_green_at: "2026-07-29T21:31:00+09:00"
    verdict: pass
    worker_model: codex
    reviewer_model: claude-fable-5
    green_commands:
      - kind: lint
        command: "bun src/cli.ts plan lint (848 PLAN、plan-schedule OK)"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-29T21:07:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:d0e4a34c8fdbdd3c4e2931df6b72c812b4bdc9d866ca44550f6504176ce57cab"
        anchor_commit: 9c9a94446f8b19dd374d34a936541e0a08850289
      - kind: unit_test
        command: "bun scripts/run-vitest-snapshot.ts tests/doctor-result-file.test.ts tests/vitest-snapshot-runner.test.ts tests/github-ci-policy.test.ts tests/green-command-digest.test.ts tests/change-lane.test.ts --reporter=dot (5 files / 169 tests passed、merge 後 HEAD 9c9a9444 で record 時再実走。review 時は exact HEAD d50962ae の detached snapshot で同コマンド 168 tests green、scope 参照)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-29T21:31:00+09:00"
        evidence_path: tests/doctor-result-file.test.ts
        output_digest: "sha256:ca52965bd6ae6ae97f22c6f04156eb365e1729d9c692713415fe573cec82c79d"
        anchor_commit: 9c9a94446f8b19dd374d34a936541e0a08850289
    scope: "PR #189 exact HEAD d50962ae の closing cross-review (Codex 著作 → Claude 検証、blind、非 author family。PR #189 issuecomment-5117012108)。claim-blind=PASS: AC-1 の before/after を attempts API で独立復元 (run 30439854225 attempt 1 = linux success 251s、run 30440302849 doctor step 54s / test step 240s / job 334s、before 394s)、envelope 消費を CI ログ marker (doctor-envelope: accepted) で独立確認、detached snapshot で typecheck + 5 files / 168 tests green。spec-blind=FLAG 1 件 (moderate、issue #193 へ起票): --setup-smoke --result-file 併用で envelope が scope=full/全 check_ids の偽申告になり full 期待 consumer に受理される経路 (現行 CI 配線では runtime_step_manifest pin により非顕在)。本 confirm はスコープ 1 (doctor 単一実行化) 限定であり、スコープ 2 (test shard 分割、AC-3/4) は未着手のまま残 AC を issue #109 が保持する。注記: PR merge (2026-07-29T20:21 JST) が本レビュー判定投稿 (同 20:28-30 JST) に先行した。判定は merge 済み内容と同一の exact HEAD に対するもので有効だが、レビュー完了前 merge は工程違反としてインシデント記録済み。"
---

# PLAN-L7-461 (troubleshoot): GitHub CI 高速化 Phase 2

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/109 (残 AC)

本PLANはPhase 2aとしてdoctor単一実行化だけを所有する。実際に変更・検証した既存artifactも
`generates`へ明示した。前提PLAN-L7-455 (Phase 1) はmerge済みのためreferencesとして参照する。
`scripts/run-vitest-snapshot.ts` / `src/doctor/test-repository-isolation.ts` /
`tests/vitest-snapshot-runner.test.ts` はPLAN-L7-421がownerであり、本PLANはdefault branch ref注入の
additive modificationと回帰参照だけを行う。ownershipは移管せず二重ownerにしない。

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
static shardとWindows leg特化は、doctor単一実行化と独立した変更・required context再設計を伴うため
Phase 2aの完了条件へ混在させない。issue #109の残backlogとしてProject/Forward順序へ戻し、
別sliceの設計・検証pairを持つまで本PLANは実装済みとも安全とも主張しない。

## スコープ外

- 変更影響範囲ベースのテスト選択 (fail-open リスクのため、一致率計測基盤が先)。
- ローカル snapshot runner の clone/install 固定費 (issue #98 の責務)。
- 内部 gate ↔ GitHub CI 一致率計測 (issue #109 の別 AC、後続 PLAN)。

## Schedule

- step 1 (serial): doctor 単一実行化の方式設計メモ + 等価性の oracle 宣言 (テスト設計)
- step 2 (serial): 実装 + before/after 実測 (run URL を evidence として引用)
- step 3 (serial): blind review (非 author provider) → confirm

## AC

- AC-1: code PR の harness-check-linux leg 実測が短縮される。before = 直近 main green
  run の実測 (~5 分、vitest 261s) を引用し、after は同条件 run URL で裏取る (prose
  断定禁止、PLAN-L7-89 claim discipline)。
- AC-2: doctor の governance 検査集合が単一実行化の前後で縮まないことをテストで固定
  (check 名の集合比較、fail-close)。
- AC-3: Linux / Windows / aggregateの既存required context構成を縮めずPR CIがgreenになる実runを
  evidenceとして引用。
- AC-4: workflow header の doc-safe allowlist 記述が `DOC_LANE_PREFIXES` と集合一致し、
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

### Phase 2a closureと残backlog

- doctor単一実行化はAC-1〜4、exact HEAD CI、closed envelope custody、blind reviewでclosureした。
- static shardとWindows leg特化は未着手であり、本PLANのconfirmedへ含めない。issue #109の残backlogを
  Project/Forwardへ登録する後続sliceの責務とし、2aの完了表現から除外した。
