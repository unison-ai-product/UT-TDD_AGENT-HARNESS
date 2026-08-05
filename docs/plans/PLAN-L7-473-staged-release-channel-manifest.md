---
plan_id: PLAN-L7-473-staged-release-channel-manifest
title: "PLAN-L7-473 (add-impl): 段階リリース管理 — release channel manifest 契約 freeze (S1)"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-04
updated: 2026-08-04
owner: PO / Claude
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - release channel manifest schema と sync-pack --channel 最小実装"
  - role: qa
    slot_label: "QA - manifest↔Pack実状態突合とrollback非破壊性を検証"
  - role: tl
    slot_label: "TL - 正本選択 (manifest vs harness.db vs GitHub Releases) と非破壊契約の独立レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
    - docs/governance/vmodel-refactor-qa-release-gates.md
    - docs/design/harness/L6-function-design/setup-solo-team.md
    - src/setup/distribution.ts
    - src/cli/distribution.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/224
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-473: 段階リリース管理 — release channel manifest 契約 freeze (S1)

## 0. 位置づけと既存 PLAN との関係 (issue #224)

harness は製品開発の OS であり、自身の配布物 (`unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`)
と下流製品の両方に段階リリース管理を提供する必要がある。`PLAN-L6-63-pack-staged-release-rollback`
は 2026-07-08 起票の draft add-design で、**Pack リポジトリ側の段階公開・revert runbook**
(tag 運用、consumer 撤回) のみを対象としていた。本 PLAN はその設計スコープを
**manifest ベースの単一契約** (Pack だけでなく将来の下流製品消費者にも再利用可能な形) へ
一般化する add-impl であり、`PLAN-L6-63` を parent design として引き継ぐ。**`PLAN-L6-63` の
既存記述を上書きしない** — L6-63 が持つ「ローカル copy-plan/staging は非破壊済み」「Pack repo
側の tag/revert runbook が未確認」という切り分けは本 PLAN の前提として維持し、L6-63 は
本 PLAN の manifest 契約が固まった時点で内容を合流し supersede するか、Pack 側 tag/revert
runbook の実装確認 PLAN として存続させるかを PO 判断で決める (現時点では未決、下記
Problem 相当の設計判断として明示する)。

本 PLAN は **S1 (契約 freeze、設計専用)** であり、実装コードは生成しない。`generates` は
本 PLAN doc 自身のみとし、schema/実装モジュールは S2 着手時に確定 PLAN の `generates` へ
追加する (draft PLAN に未来ファイルを書かない規律)。

## 1. 目的

リリース/チャネルの現在状態を機械判定可能な単一契約として固定し、Pack 配布 (dogfood) と
下流製品の両方が同じ契約に乗れるようにする。S1 は契約の骨子と設計判断のみを確定し、
実装 (S2)・一般化 (S4) には進まない。

## 2. 設計判断節

1. **正本 = repo 内 manifest ファイル** (`release/manifest.yaml` 想定)。schema は
   `src/schema/release-manifest.ts` に置き、lint/doctor が fail-close で検証する。
   - 案B (harness.db 正本) は不採用。db は派生 projection であり、これを正本にすると
     「projection が古いだけ」を「重複なし/影響なし」という偽の否定証明にすり替える
     (issue #169 実例: PLAN-L6-94 と PLAN-L7-465 の契約重複を graph 未投影で検出できなかった)。
   - 案C (GitHub Releases/tags 正本) は不採用。外部可変状態かつ API 依存になり、offline/CI
     での決定性が失われる。ただし tag/Release は「配送済み事実の証跡」として manifest と
     突合する auditor の入力に使う (後続 slice、本 PLAN のスコープ外)。
   - (advisor 裁定 2026-08-04、design 判断、claude-fable-5)
2. **着手順 = `sync-pack --channel` の最小実装から** (dogfood 先行)。下流製品向けの汎用
   domain model を先に立てるのは不採用 — 消費者が Pack 1 つの段階で抽象化を先取りするのは
   最小実装原則違反 (投機的な型・契約の積み増し)。2 例目の消費者 (下流製品) が実際に現れた
   時点で Reverse により汎用契約を抽出する。
3. **rollback = manifest 巻き戻しのみ** (PO 採択 2026-08-04)。チャネルが指すバージョンを
   前バージョンへ戻す宣言変更に限定し、配布先 repo の Git 履行履歴そのものは書き換えない
   (非破壊)。実巻き戻しの自動化 (force push / tag 付け替え) は不採用 — `sync-pack` が既に
   持つ「commit/push は行わない、human-reviewed step として分離する」契約
   (`ut-tdd distribution sync-pack --repo-dir` の既存境界) を維持する。
4. **既定チャネル = canary → stable の 2 段** (PO 採択 2026-08-04)。schema はチャネルを
   後から追加できる形 (配列 + 順序メタデータ) にし、下流製品が自分の段数を定義できることを
   前提として許容する。

## 3. 契約骨子

- リリース単位 = artifact set + version manifest。1 リリースは 1 つの検証可能な version
  identity (semver または content hash) に対応する。
- チャネル昇格は「宣言変更 + 証跡条件」の組で表現する。証跡条件は最低限
  harness-check green、QA Go/No-Go、cross-review receipt の 3 点を含む。
- manifest ↔ Pack 実状態の突合 verify を AC に含める。突合結果は
  attested / mismatch / unavailable の三値とし、二値 (pass/fail) へ丸めて偽の肯定証明を
  作らない (審査正本 doc: `docs/governance/vmodel-refactor-qa-release-gates.md` の QA
  Go/No-Go 三値判定と揃える)。
- 昇格・巻き戻しは PR 経由で行い、merge gate 規律 (D2 merge_ready fail-close) に乗る。
  manifest 変更だけを理由に merge gate を回避する経路を作らない。

## 4. スコープ外 (S1)

- 実装一切 (schema コード、CLI、lint/doctor 配線) — S2 の対象。
- 下流製品向けの一般化・抽出 (汎用 domain model 化) — S4 の対象。2 例目の消費者が出るまで
  着手しない (設計判断 2)。
- GitHub Releases/tags auditor (突合の外部証跡取得) — 後続 slice。
- 配布 no-go (非破壊不変条件 + clean artifact 未閉) の解除自体。ただし **canary 昇格条件に
  「no-go 解除条件」を参照する依存関係だけは明記する** — no-go が解除されていない段では
  stable への昇格条件が構造的に満たせないことを契約上表現する。

## 5. AC (design freeze 時)

- AC-1: 本契約が non-author family の cross-review で PASS を得ている。
- AC-2: manifest schema の fail-close 境界 (未知チャネル、schema 不正、昇格条件不足) が
  test-design oracle (`U-RELMAN-*`) と対になっている。
- AC-3: rollback の意味論が非破壊 (宣言変更のみ、Git 履行履歴不変) で閉じていることが
  設計判断節に明示されている。
- AC-4: 設計判断節の各項目が advisor 相談または PO 採択のいずれかの記録を持つ。
- AC-5: `PLAN-L6-63` との関係 (合流/存続の判断) が本 PLAN の confirm 前に PO 判断として
  記録される (§0 の未決事項)。

## 6. 設計と検証の対 (S1 時点の RED oracle 案)

| 設計境界 | oracle (案) |
| --- | --- |
| manifest schema 不正の fail-close | `U-RELMAN-001` |
| 未知チャネル名の拒否 | `U-RELMAN-002` |
| 昇格条件 (harness-check green / QA Go-No-Go / cross-review receipt) 不足の拒否 | `U-RELMAN-003` |
| rollback の決定論 (同一入力 → 同一巻き戻し結果) | `U-RELMAN-004` |
| rollback が Git 履行履歴を書き換えないこと (非破壊不変条件) | `U-RELMAN-005` |
| manifest↔Pack 実状態突合の三値判定 (attested/mismatch/unavailable) | `U-RELMAN-006` |
| チャネル追加 (canary/stable 以外) の schema 拡張性 | `U-RELMAN-007` |
| no-go 未解除時の stable 昇格拒否 (依存関係表現) | `U-RELMAN-008` |
| version identity の一意性・衝突検知 | `U-RELMAN-009` |
| 昇格・巻き戻し PR が merge gate (D2 merge_ready) を回避しないこと | `U-RELMAN-010` |
| sync-pack `--channel` 最小実装との配線境界 (S2 引き渡し境界の明示) | `U-RELMAN-011` |

## 7. Schedule

1. [直列] 本 PLAN の設計判断・契約骨子を cross-review で確定する (S1 closing)。
2. [直列] `PLAN-REVERSE-473` を R0 で開始し、既存 `sync-pack` / `buildPackSyncPlan` との
   責務境界を確認する。
3. (S2 以降、本 PLAN のスコープ外) schema 実装、CLI 配線、lint/doctor 検査を確定 PLAN へ
   追加する。

## 完了条件 (S1)

- [ ] `U-RELMAN-001`〜`011` (案) が test-design へ registered され、oracle として承認される。
- [ ] 設計判断節が non-author family の cross-review で PASS。
- [ ] `PLAN-L6-63` との関係が PO 判断で確定する。
- [ ] `PLAN-REVERSE-473` が R0 を完了し、既存実装との責務境界を確認する。
