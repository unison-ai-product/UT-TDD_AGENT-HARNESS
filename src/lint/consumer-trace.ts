import { fmValue, REQUIRED_L2_SCREEN_COLUMNS, tableCells } from "./shared.ts";

export type ConsumerTraceReader = (relativePath: string) => string | undefined;

export interface ConsumerTraceResult {
  branch: "consumer";
  violations: string[];
  totals: {
    requirements: number;
    screens: number;
    functions: number;
  };
  ok: boolean;
  messages: string[];
}

interface CoreDoc {
  docType: string;
  path: string;
  heading: string;
  columns: readonly string[];
  idColumn: string;
  refColumn: string;
  /** 参照列を展開して検査するか。L3 の `トレース元` の照合は G3 の仕事 (§4、§7.1) なので G1 では読まない。 */
  checkRefs: boolean;
}

interface ReadDoc {
  ids: Set<string>;
  rows: { id: string; refs: string[]; rawTokens: number }[];
  tableRead: boolean;
}

const L1: CoreDoc = {
  docType: "DOC-L1-REQUIREMENTS",
  path: "docs/design/L1-requirements/functional-requirements.md",
  heading: "#### 第4章 機能要求一覧",
  columns: ["要求ID", "要求名", "要求内容", "優先度", "展開先"],
  idColumn: "要求ID",
  refColumn: "展開先",
  checkRefs: true,
};
const L2: CoreDoc = {
  docType: "DOC-L2-SCREEN",
  path: "docs/design/L2-screen/screen-list.md",
  heading: "#### 第4章 画面一覧",
  columns: REQUIRED_L2_SCREEN_COLUMNS,
  idColumn: "画面ID",
  refColumn: "関連機能",
  checkRefs: true,
};
const L3: CoreDoc = {
  docType: "DOC-L3-FUNCTIONAL",
  path: "docs/design/L3-functional/functional-requirements.md",
  heading: "##### 3-1 機能一覧",
  columns: ["機能ID", "機能名", "概要", "ロール", "トレース元"],
  idColumn: "機能ID",
  refColumn: "トレース元",
  checkRefs: false,
};

const REF_SEPARATOR = /[,、/・\s]+/;

const headingLevel = (line: string): number => line.match(/^(#+)\s/)?.[1]?.length ?? 0;

function refTokens(cell: string): string[] {
  return cell.split(REF_SEPARATOR).filter((token) => token && !token.startsWith("<"));
}

/** 1 つの範囲の展開件数の上限 (§6.3)。展開の前に算術で判定する。 */
const MAX_RANGE_EXPANSION = 1000;

/** 数字列が安全整数に収まるか。Number に丸める前に桁と辞書順で判定する (§6.3 (5))。 */
function isSafeDigits(digits: string): boolean {
  const trimmed = digits.replace(/^0+/, "");
  return trimmed.length < 16 || (trimmed.length === 16 && trimmed <= "9007199254740991");
}

/** 参照セルの token を取り、`X〜Y` を始点の桁数で 0 埋めして展開する (§6.3)。 */
function expandRefs(cell: string, docType: string, violations: string[]): string[] {
  const out: string[] = [];
  for (const token of refTokens(cell)) {
    const parts = token.split(/[〜～]/);
    if (parts.length === 1) {
      out.push(token);
      continue;
    }
    const start = parts.length === 2 ? parts[0]?.match(/^(.*?)(\d+)$/) : null;
    const prefix = start?.[1] ?? "";
    const tail = parts[1] ?? "";
    const end = tail.startsWith(prefix) ? tail.slice(prefix.length) : tail;
    const startDigits = start?.[2] ?? "";
    if (
      !start ||
      !/^\d+$/.test(end) ||
      !isSafeDigits(startDigits) ||
      !isSafeDigits(end) ||
      Number(end) < Number(startDigits) ||
      Number(end) - Number(startDigits) + 1 > MAX_RANGE_EXPANSION
    ) {
      violations.push(`invalid_range:${docType}:${token}`);
      continue;
    }
    const from = Number(startDigits);
    const to = Number(end);
    const width = (start[2] as string).length;
    for (let k = 0; k <= to - from; k++) {
      out.push(`${prefix}${String(from + k).padStart(width, "0")}`);
    }
  }
  return out;
}

function readCoreDoc(doc: CoreDoc, reader: ConsumerTraceReader, violations: string[]): ReadDoc {
  const none: ReadDoc = { ids: new Set(), rows: [], tableRead: false };
  const content = reader(doc.path);
  if (content === undefined) {
    violations.push(`missing_core_doc:${doc.docType}`);
    return none;
  }
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  if (fmValue(frontmatter, "doc_type_id") !== doc.docType) {
    violations.push(`doc_type_mismatch:${doc.docType}`);
    return none;
  }
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === doc.heading);
  const level = headingLevel(doc.heading);
  let section = start < 0 ? [] : lines.slice(start + 1);
  const end = section.findIndex((line) => {
    const l = headingLevel(line);
    return l > 0 && l <= level;
  });
  if (end >= 0) section = section.slice(0, end);
  const headerAt = section.findIndex((line) => {
    const cells = tableCells(line);
    return doc.columns.every((column) => cells.includes(column));
  });
  if (headerAt < 0) {
    violations.push(`required_table_missing:${doc.docType}:${doc.heading}`);
    return none;
  }
  const header = tableCells(section[headerAt] as string);
  const idIndex = header.indexOf(doc.idColumn);
  const refIndex = header.indexOf(doc.refColumn);
  const read: ReadDoc = { ids: new Set(), rows: [], tableRead: true };
  for (const line of section.slice(headerAt + 2)) {
    if (!line.trimStart().startsWith("|")) break;
    const cells = tableCells(line);
    const id = (cells[idIndex] ?? "").trim();
    if (!id || id.startsWith("<")) continue;
    read.ids.add(id);
    if (!doc.checkRefs) continue;
    const refCell = cells[refIndex] ?? "";
    read.rows.push({
      id,
      refs: expandRefs(refCell, doc.docType, violations),
      rawTokens: refTokens(refCell).length,
    });
  }
  return read;
}

function checkRefs(doc: CoreDoc, read: ReadDoc, targets: Set<string>): string[] {
  const violations: string[] = [];
  for (const row of read.rows) {
    if (row.rawTokens === 0) {
      violations.push(`missing_reference:${doc.docType}:${row.id}:${doc.refColumn}`);
    }
    for (const ref of row.refs) {
      if (!targets.has(ref)) {
        violations.push(`dangling_reference:${doc.docType}:${row.id}:${doc.refColumn}:${ref}`);
      }
    }
  }
  return violations;
}

/** consumer 分岐の G1-trace (§3.2、§6〜§8、§14)。画面 ID は L2 表の宣言の集合から取る。 */
export function analyzeConsumerG1Trace(reader: ConsumerTraceReader): ConsumerTraceResult {
  const found: string[] = [];
  const l1 = readCoreDoc(L1, reader, found);
  const l2 = readCoreDoc(L2, reader, found);
  const l3 = readCoreDoc(L3, reader, found);
  for (const [doc, read] of [
    [L1, l1],
    [L2, l2],
    [L3, l3],
  ] as const) {
    if (read.tableRead && read.ids.size === 0) {
      found.push(`empty_required_set:${doc.docType}:${doc.idColumn}`);
    }
  }
  found.push(...checkRefs(L1, l1, new Set([...l2.ids, ...l3.ids])));
  found.push(...checkRefs(L2, l2, new Set([...l1.ids, ...l3.ids])));
  const violations = [...new Set(found)].sort();
  const totals = { requirements: l1.ids.size, screens: l2.ids.size, functions: l3.ids.size };
  const ok = violations.length === 0;
  const detail = `requirements=${totals.requirements}, screens=${totals.screens}, functions=${totals.functions}`;
  return {
    branch: "consumer",
    violations,
    totals,
    ok,
    messages: [
      ok
        ? `g1-trace - OK (consumer column trace: ${detail})`
        : `g1-trace - violation (consumer column trace): ${violations.join("; ")}`,
    ],
  };
}
