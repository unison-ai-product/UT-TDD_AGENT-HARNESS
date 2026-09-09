---
memory_id: memory:project:bun-program-codex-po-2026-08-31--bb31f234b26c
kind: project
title: "Bun 撤去 program の実装レーンを Codex へ移管 (PO 承認 2026-08-31)"
tags: ["bun-ban", "codex-lane", "handoff", "issue-450", "issue-470", "issue-471", "issue-472", "issue-484"]
updated_at: 2026-08-31T02:40:17.477Z
---

PO 承認 (2026-08-31) により、**Bun 撤去 program の実装レーンを Codex へ移管**する。
Claude は実装から降り、非著者レビューゲートと契約ゲートに専念する。

## 移管の理由

実装と review gate を Claude が兼務していたため、Claude が両方のボトルネックになっていた。
実装側の遅延は探索の浅さに起因する (S1-b だけで stale fixture を
`distribution-acceptance` -> `doctor.test.ts` -> `isolated_fixture` pin と 3 段、
いずれも CI に指摘されて初めて発見した)。
Codex 実装 / Claude review は CLAUDE.md の attacker/defender 分離そのものであり、
現行の逆向き構成より正しい。

## 引き継ぎ境界は PR 単位とする (mid-PR で渡さない)

進行中 PR を途中で渡すと author family が混在する。`PLAN-L7-517` §3.5 の
contributor set 規律では reviewer は contributor set に含まれてはならないため、
両 family が書いた PR は**どちらの family も closing review できなくなる**。
当該契約は PR #442 で draft のままであり、未解決である。

### Claude が閉じるもの

- **#478 (S1-b / Issue #470)**: 既に Claude / Codex 双方の commit が入っており
  author family は混在済み。ここで渡すと状況が悪化するだけなので Claude が閉じる。
  残件は Codex/Sol closing review の blocking のみ。

### Codex が引き取るもの

- **#471 (S1-a: readiness の Bun 撤去)**: **未 push**。いま渡せば Codex 単独 author にできる。
  worktree `C:\dev\ut-issue471-s1a-readiness` / branch `feat/issue471-s1a-readiness` に
  Claude の 3 commit がある (production 変更完了、`U-PACKBUN-001` / `002` Green)。
  **このブランチを捨てて Codex 単独で作り直してよい**。流用する場合は author family が
  混在するので、その PR の closing review は Claude が実施できない点に注意すること。
- **#472 (S1-c: source CI の setup-bun 撤去)**: 未着手。#470 merge 後。
- **#484 / #485 / #486 / #487 (Node generation)**: 実装は Codex/Luna。
  ただし **#489 が PASS / blocking 0 で merge されるまで #484 に着手しない**
  (Claude の契約 gate verdict は FLAG blocking 3、receipt 発行済み)。

## Claude が担い続けるもの

- 非著者 closing review (author family = codex の PR すべて)
- 実装前 contract / admission gate (#484 系、#489 のような docs-only 契約 PR)
- exact-head protocol の遵守確認と merge gate

## 引き継ぎ時点の実測 (2026-08-31)

- **#478**: exact head `f94d9c26`。CI は 1 つ前の `d597161a` で 3/3 Green。
  Codex/Sol closing review が FLAG blocking 2。
  - blocking 2 (`U-PACKBUN-004` の masked nonempty assertion) は **是正済み**。
    case ごとに expected finding 集合を固定した結果、Claude が把握していなかった
    finding を 2 件露出した (shebang 変異は `Bun shebang` に加え `bun executable` も生む、
    `run-bun.ts` の本文も同様)。6 tests Green。
  - blocking 1 (`U-PACKBUN-006` の bun / bunx / bun.cmd / bun.exe 変種 oracle) は
    Codex が worktree に投入済みだが **未 commit**。commit して再測定が要る。
  - 残: `PLAN-REVERSE-524` が draft / R0 のままで R2 mutation 証跡が無い。
- **#471**: `U-PACKBUN-001` / `002` を含む 2 files / 29 tests Green。未 push。
- **#489**: exact head `6b14e334` に Claude verdict FLAG / blocking 3 の receipt 発行済み。
  CI 3/3 Green だが、指摘 3 件はいずれも契約文書の欠陥で CI では検出されない。
  再依頼は**新しい exact head で**行うこと (同一 head への 2 本目の request は
  issue #439 の custody 欠陥を再発させる)。
- **#483**: exact head `347bd96a` の evidence-only closing review が **未消費**。Claude が処理する。

## 別 issue として起票が要る実測欠陥

`src/lint/runtime-portability.ts` は **`bunx` を検出しない**。実測:

- `spawnSync("bunx", args)` -> violation 0 件
- `spawn(comspec, ["/c", "bunx", "run"])` -> violation 0 件
- `spawnSync("bun.cmd" | "bun.exe" | "bun", args)` -> `bun-runtime-spawn` 検出

`bunx` は Bun の実行子であり、BAN 検出側の実欠陥である。`PLAN-L7-522` §3.3 は
「既存 rule への分岐追加は weakening ではない」としているので追加自体は許されるが、
S1-b の scope 外なので別 slice / 別 issue で扱うこと。
