/**
 * oracle ID 重複宣言の既存債務 (issue #206 ratchet、2026-08-05 凍結)。
 *
 * `oracle-test-trace` は declared→cited の一方向 Set 差分しか見ておらず、**同じ ID が
 * test-design 内で別 oracle として 2 回宣言されていても検出しなかった** (2026-07-31 実測:
 * `U-TESTHYGIENE-021`〜`028` の 8 件が全件衝突していたのに doctor は green だった)。
 *
 * 検査を有効化した時点で 64 件が該当した。**その多くは真の採番衝突ではない** — 宣言行の判定が
 * 「1 行に oracle ID が 1 個だけ現れる markdown table row」という heuristic であり、
 * traceability の index 行 (ID + 設計 doc パス + テストファイル名) も同じ形をとるためである。
 * 例: `U-MEMORY-001` は宣言行と index 行の 2 行を持つ。
 *
 * heuristic を精密化するより、**現状を凍結して新規衝突だけを fail-close する**方を選ぶ。
 * 検出したい失敗型 (ファイル内連番で既存 ID を踏む) は新規側にしか現れないからである。
 * **縮小のみ可・新規追加禁止**。
 */
export const ORACLE_ID_DUPLICATE_BASELINE: ReadonlySet<string> = new Set([
  "IT-ADAPTER-01",
  "IT-ADAPTER-02",
  "IT-ADAPTER-03",
  "IT-ASSET-01",
  "IT-ASSET-02",
  "IT-ASSET-03",
  "IT-ASSET-04",
  "IT-ASSET-05",
  "IT-ASSET-06",
  "IT-ASSET-07",
  "IT-CONTRACT-01",
  "IT-CONTRACT-02",
  "IT-CONTRACT-03",
  "IT-MODULE-01",
  "IT-MODULE-02",
  "IT-RGK-PHYS-001",
  "IT-RGK-PHYS-002",
  "IT-RGK-PHYS-003",
  "IT-RGK-PHYS-004",
  "IT-RGK-PHYS-005",
  "IT-RGK-PHYS-006",
  "IT-RGK-PHYS-007",
  "IT-RGK-PHYS-008",
  "IT-RGK-PHYS-009",
  "IT-RGK-PHYS-010",
  "IT-RGK-PHYS-011",
  "IT-RGK-PHYS-012",
  "IT-RGK-PHYS-013",
  "IT-RGK-PHYS-014",
  "IT-RGK-PHYS-015",
  "IT-RGK-PHYS-016",
  "IT-RGK-PHYS-017",
  "IT-RGK-PHYS-018",
  "IT-RGK-PHYS-019",
  "IT-RGK-PHYS-020",
  "IT-RGK-PHYS-021",
  "IT-RGK-PHYS-022",
  "IT-RGK-PHYS-023",
  "IT-RGK-PHYS-024",
  "IT-RGK-PHYS-025",
  "IT-RGK-PHYS-026",
  "IT-RGK-PHYS-027",
  "IT-RGK-PHYS-028",
  "IT-RGK-PHYS-029",
  "IT-RGK-PHYS-030",
  "IT-RGK-PHYS-031",
  "IT-RGK-PHYS-032",
  "IT-RGK-PHYS-033",
  "IT-RGK-PHYS-034",
  "IT-RGK-PHYS-035",
  "IT-RGK-PHYS-036",
  "IT-RGK-PHYS-037",
  "IT-RGK-PHYS-038",
  "IT-RGK-PHYS-039",
  "IT-RGK-PHYS-040",
  "IT-RGK-PHYS-041",
  "IT-RGK-PHYS-042",
  "IT-STATE-01",
  "IT-STATE-02",
  "U-MEMORY-001",
  "U-PHOVER-002",
  "U-REVIEW-007",
  "U-SCREEN-001",
  "U-VTRIG-005",
]);
