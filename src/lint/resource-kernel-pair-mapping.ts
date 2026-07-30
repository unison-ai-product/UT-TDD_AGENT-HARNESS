/**
 * D0-R Resource Kernel の L5↔L8 pair 写像の機械検査 (PLAN-L5-25 §7.1/§7.2、issue #149)。
 *
 * PLAN-L5-25 §7 の pair-freeze 条件は「L8 で正負 oracle・fixture・観測点・control/workload 別
 * created count を freeze する」+「L5 全物理契約から 42 ID への全数写像」である。これを散文の
 * 主張で終わらせない (`coding ≠ substance`、PLAN-L7-89) ため、実 repo の 2 doc を突合する。
 *
 * 汎用 `oracle-test-trace` の `ORACLE_ID` は `\b(?:U|IT)-[A-Z0-9]+-[0-9]{3}\b` で 3 セグメント ID
 * (`IT-RGK-PHYS-001`) に一致しないため、42 件は汎用 gate から見えていない (open issue #165 と同族)。
 * 本 lint は D0 範囲だけを補う専用検査であり、汎用抽出の修正を代替しない。
 */

/** freeze 属性表の 1 行 (ID + 6 属性)。 */
export interface FreezeAttributeRow {
  id: string;
  lane: string;
  platform: string;
  fixture: string;
  observation: string;
  negativeExpected: string;
  createdCount: string;
}

/** 全数写像表の 1 行 (契約 → 被覆 oracle)。 */
export interface ContractMappingRow {
  contractId: string;
  source: string;
  oracles: string[];
}

export interface ResourceKernelPairMappingResult {
  /** freeze 表にあるが写像表で被覆されていない oracle。 */
  oraclesMissingFromMapping: string[];
  /** 写像表が参照するが freeze 表に実在しない oracle。 */
  oraclesMissingFromFreeze: string[];
  /** 属性セルが空の freeze 行 (ID)。 */
  rowsWithEmptyAttribute: string[];
  /** lane 語彙外の freeze 行 (ID)。 */
  rowsWithUnknownLane: string[];
  /** 被覆 oracle 0 件の契約行。 */
  contractsWithoutOracle: string[];
  /** lane 別件数。 */
  laneCounts: Record<string, number>;
  ok: boolean;
}

/** freeze 属性表で許可する lane 語彙。mock Green を実 OS custody Green へ読み替えないための 3 値。 */
export const ALLOWED_LANES = ["mock", "real-OS", "mock+real-OS"] as const;

const PIPE_PLACEHOLDER = "\u0000PIPE\u0000";

/** markdown の見出し配下 (次の同レベル以上の見出しまで) を切り出す。 */
export function sliceSection(markdown: string, headingPrefix: string): string {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(headingPrefix));
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^#{1,3} /.test(l));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

/** table 行を cell 配列へ分解する (`\|` エスケープを保持)。 */
function splitRow(line: string): string[] {
  return line
    .replaceAll("\\|", PIPE_PLACEHOLDER)
    .split("|")
    .slice(1, -1)
    .map((c) => c.replaceAll(PIPE_PLACEHOLDER, "|").trim());
}

/** L8 「Resource Kernel物理統合 freeze属性」節の表を読む。 */
export function parseFreezeAttributeRows(l8Markdown: string): FreezeAttributeRow[] {
  const section = sliceSection(l8Markdown, "### Resource Kernel物理統合 freeze属性");
  const rows: FreezeAttributeRow[] = [];
  for (const line of section.split(/\r?\n/)) {
    if (!line.startsWith("| `IT-RGK-PHYS-")) continue;
    const cells = splitRow(line);
    if (cells.length !== 7) {
      rows.push({
        id: `${cells[0] ?? "?"} (columns=${cells.length})`,
        lane: "",
        platform: "",
        fixture: "",
        observation: "",
        negativeExpected: "",
        createdCount: "",
      });
      continue;
    }
    rows.push({
      id: cells[0].replaceAll("`", ""),
      lane: cells[1],
      platform: cells[2],
      fixture: cells[3],
      observation: cells[4],
      negativeExpected: cells[5],
      createdCount: cells[6],
    });
  }
  return rows;
}

/** L5-25 §7.1 の全数写像表を読む。被覆列の 3 桁表記を full oracle ID へ展開する。 */
export function parseContractMappingRows(l5Markdown: string): ContractMappingRow[] {
  const section = sliceSection(l5Markdown, "### 7.1 ");
  const rows: ContractMappingRow[] = [];
  for (const line of section.split(/\r?\n/)) {
    if (!line.startsWith("| `C-RGK-")) continue;
    const cells = splitRow(line);
    const oracles = [...(cells[3] ?? "").matchAll(/`(\d{3})`/g)].map((m) => `IT-RGK-PHYS-${m[1]}`);
    rows.push({
      contractId: (cells[0] ?? "").replaceAll("`", ""),
      source: cells[1] ?? "",
      oracles,
    });
  }
  return rows;
}

/** freeze 表と写像表を突合し、双方向の孤児と属性欠落を返す。 */
export function analyzeResourceKernelPairMapping(input: {
  freezeRows: FreezeAttributeRow[];
  mappingRows: ContractMappingRow[];
}): ResourceKernelPairMappingResult {
  const freezeIds = new Set(input.freezeRows.map((r) => r.id));
  const mappedIds = new Set(input.mappingRows.flatMap((r) => r.oracles));

  const oraclesMissingFromMapping = [...freezeIds].filter((id) => !mappedIds.has(id)).sort();
  const oraclesMissingFromFreeze = [...mappedIds].filter((id) => !freezeIds.has(id)).sort();

  const rowsWithEmptyAttribute = input.freezeRows
    .filter((r) =>
      [r.lane, r.platform, r.fixture, r.observation, r.negativeExpected, r.createdCount].some(
        (c) => c.length === 0,
      ),
    )
    .map((r) => r.id)
    .sort();

  const rowsWithUnknownLane = input.freezeRows
    .filter((r) => !(ALLOWED_LANES as readonly string[]).includes(r.lane))
    .map((r) => r.id)
    .sort();

  const contractsWithoutOracle = input.mappingRows
    .filter((r) => r.oracles.length === 0)
    .map((r) => r.contractId)
    .sort();

  const laneCounts: Record<string, number> = {};
  for (const r of input.freezeRows) laneCounts[r.lane] = (laneCounts[r.lane] ?? 0) + 1;

  return {
    oraclesMissingFromMapping,
    oraclesMissingFromFreeze,
    rowsWithEmptyAttribute,
    rowsWithUnknownLane,
    contractsWithoutOracle,
    laneCounts,
    ok:
      oraclesMissingFromMapping.length === 0 &&
      oraclesMissingFromFreeze.length === 0 &&
      rowsWithEmptyAttribute.length === 0 &&
      rowsWithUnknownLane.length === 0 &&
      contractsWithoutOracle.length === 0,
  };
}

/** 失敗時の人間向け説明。 */
export function resourceKernelPairMappingMessages(r: ResourceKernelPairMappingResult): string[] {
  const msgs: string[] = [];
  if (r.oraclesMissingFromMapping.length > 0) {
    msgs.push(
      `PLAN-L5-25 §7.1 の全数写像に現れない L8 oracle: ${r.oraclesMissingFromMapping.join(", ")}`,
    );
  }
  if (r.oraclesMissingFromFreeze.length > 0) {
    msgs.push(
      `写像表が参照するが L8 freeze 属性表に実在しない oracle: ${r.oraclesMissingFromFreeze.join(", ")}`,
    );
  }
  if (r.rowsWithEmptyAttribute.length > 0) {
    msgs.push(`freeze 属性が欠けている行: ${r.rowsWithEmptyAttribute.join(", ")}`);
  }
  if (r.rowsWithUnknownLane.length > 0) {
    msgs.push(
      `lane 語彙外 (${ALLOWED_LANES.join(" / ")}) の行: ${r.rowsWithUnknownLane.join(", ")}`,
    );
  }
  if (r.contractsWithoutOracle.length > 0) {
    msgs.push(`被覆 oracle 0 件の物理契約: ${r.contractsWithoutOracle.join(", ")}`);
  }
  return msgs;
}
