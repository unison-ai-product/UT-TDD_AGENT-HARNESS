export const CONSUMER_TEMPLATE_SLOTS = [
  [
    "docs/templates/vmodel/L1-requirements.md",
    "docs/design/L1-requirements/functional-requirements.md",
  ],
  ["docs/templates/vmodel/L2-screen-list.md", "docs/design/L2-screen/screen-list.md"],
  [
    "docs/templates/vmodel/L3-functional-requirements.md",
    "docs/design/L3-functional/functional-requirements.md",
  ],
  ["docs/templates/vmodel/L4-data.md", "docs/design/L4-basic-design/data.md"],
  ["docs/templates/vmodel/L4-architecture.md", "docs/design/L4-basic-design/architecture.md"],
  ["docs/templates/vmodel/L4-external-if.md", "docs/design/L4-basic-design/external-if.md"],
  ["docs/templates/vmodel/L4-function.md", "docs/design/L4-basic-design/function.md"],
  ["docs/templates/vmodel/L4-ui-standard.md", "docs/design/L4-basic-design/ui-standard.md"],
  ["docs/templates/vmodel/L4-security.md", "docs/design/L4-basic-design/security.md"],
  ["docs/templates/vmodel/L5-physical-data.md", "docs/design/L5-detailed-design/physical-data.md"],
  [
    "docs/templates/vmodel/L5-module-decomposition.md",
    "docs/design/L5-detailed-design/module-decomposition.md",
  ],
  ["docs/templates/vmodel/L6-function-spec.md", "docs/design/L6-function-design/function-spec.md"],
  ["docs/templates/vmodel/L7-unit-test-design.md", "docs/test-design/L7-unit-test-design.md"],
] as const;

// consumer の core 文書の表 (docs/design/harness/L6-function-design/consumer-trace-gates.md §5 / §6)。
// ID は prefix 自由で、harness 形式の ID と harness 専用文書は coreOnly の fixture に置かない。
const CORE_TABLE_ROWS: Record<string, [header: string, row: string]> = {
  "docs/design/L1-requirements/functional-requirements.md": [
    "| 要求ID | 要求名 | 要求内容 | 優先度 | 展開先 |",
    "| REQ-001 | Consumer goal | Consumer function | P0 | SC-001, FN-001 |",
  ],
  "docs/design/L2-screen/screen-list.md": [
    "| 画面ID | 画面名称 | 概要 | 関連機能 | ロール |",
    "| SC-001 | Consumer screen | Consumer overview | REQ-001, FN-001 | user |",
  ],
  "docs/design/L3-functional/functional-requirements.md": [
    "| 機能ID | 機能名 | 概要 | ロール | トレース元 |",
    "| FN-001 | Consumer function | Consumer overview | user | REQ-001 |",
  ],
  "docs/test-design/L12-acceptance-test-design.md": [
    "| テストID | 分類 | テスト項目 | 検証内容/手順 | 期待結果 | トレース元 |",
    "| AT-001 | 受入 | Consumer acceptance | 手順 | 結果 | REQ-001, SC-001, FN-001 |",
  ],
};

function withTableRow(content: string, [header, row]: [string, string]): string {
  const lines = content.split("\n");
  const at = lines.findIndex((line) => line.trim() === header);
  if (at < 0) throw new Error(`consumer fixture header not found: ${header}`);
  lines.splice(at + 2, 0, row);
  return lines.join("\n");
}

function adapt(template: string, pairArtifact: string): string {
  return template
    .replace(/^status: .*$/m, "status: confirmed")
    .replace(/^pair_artifact: .*$/m, `pair_artifact: ${pairArtifact}`)
    .replace(/^plan: .*$/m, "plan: docs/plans/PLAN-CONSUMER-01.md");
}

export interface ConsumerGateFixtureOptions {
  omitRequiredSlot?: boolean;
  omitWireframe?: boolean;
  // true なら consumer の core 文書だけを返す。G11 / G12 / G13 (U-RCDEV-032〜034) の oracle が前提にする
  // harness 形式の補助文書 (nfr-grade / business-detail など) を含めない。
  coreOnly?: boolean;
}

// `read` はテンプレートの読み取り (repo の path -> 内容)。戻り値は fixture root からの相対 path -> 内容。
export function buildConsumerGateFixtureDocs(
  read: (path: string) => string,
  options: ConsumerGateFixtureOptions = {},
): Record<string, string> {
  const docs: Record<string, string> = {};
  const core = options.coreOnly === true;
  for (const [templatePath, targetPath] of CONSUMER_TEMPLATE_SLOTS) {
    if (options.omitRequiredSlot && targetPath === "docs/design/L2-screen/screen-list.md") continue;
    const pair = targetPath.startsWith("docs/test-design/")
      ? "docs/design/"
      : "docs/test-design/L7-unit-test-design.md";
    const adapted = adapt(read(templatePath), pair);
    const row = CORE_TABLE_ROWS[targetPath];
    docs[targetPath] = core && row ? withTableRow(adapted, row) : adapted;
  }

  if (!core) {
    const unit = "docs/test-design/L7-unit-test-design.md";
    const l1 = adapt(read("docs/templates/vmodel/L1-requirements.md"), unit);
    const l3 = adapt(read("docs/templates/vmodel/L3-functional-requirements.md"), unit);
    const l1Dir = "docs/design/L1-requirements/";
    const l3Dir = "docs/design/L3-functional/";
    const nfr = [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17]
      .map((n) => `| **NFR-${String(n).padStart(2, "0")}** | covered |`)
      .join("\n");
    docs[`${l1Dir}business-requirements.md`] = `${l1}\n| **BR-01** | Consumer goal |\n`;
    docs[`${l1Dir}functional-requirements.md`] =
      `${l1}\n| **FR-L1-01** | Consumer function | P0 |\n`;
    docs[`${l1Dir}screen-requirements.md`] =
      `${l1}\n\n## §1 画面一覧\nPM-01\n## §2 次\n### §5.1 業務要求トレース\n| **BR-01** | PM-01 |\n### §5.3 機能要求トレース\n| **FR-L1-01** | PM-01 |\n### §5.4 次\n### §5.5 画面トレース\n| **PM-01** | BR-01 / FR-L1-01 |\n### §5.6 次\n`;
    docs[`${l3Dir}business-detail.md`] = `${l3}\n`;
    docs[`${l3Dir}nfr-grade.md`] = `${l3}\n${nfr}\n`;
    docs[`${l3Dir}functional-requirements.md`] =
      `${l3}\n### FR-01: Consumer function\n#### AC-FR-01-01\n`;
  }

  docs["docs/test-design/L10-ux-validation-test-design.md"] = adapt(
    read("docs/templates/vmodel/L10-ux-validation.md"),
    "docs/design/L2-screen/",
  );
  const l12 = adapt(read("docs/templates/vmodel/L12-acceptance-test-design.md"), "docs/design/");
  docs["docs/test-design/L12-acceptance-test-design.md"] = core
    ? withTableRow(l12, CORE_TABLE_ROWS["docs/test-design/L12-acceptance-test-design.md"])
    : `${l12}\n| **AT-FR-01-01** | Consumer acceptance |\n`;
  if (!options.omitWireframe) {
    docs["docs/design/L2-screen/wireframe.md"] =
      "---\nlayer: L2\nstatus: confirmed\npair_artifact: docs/test-design/L10-ux-validation-test-design.md\n---\n# Consumer wireframe\n";
  }
  return docs;
}
