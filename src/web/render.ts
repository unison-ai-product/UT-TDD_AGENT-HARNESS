/**
 * src/web 描画層 — 純粋な HTML 生成ヘルパ (ADR-005 D2 中央 UI / L2 screen-list)。
 *
 * 全画面 read-only + CLI コマンド文字列のコピーに限る (screen-list §3 S5=b: UI 直接実行禁止)。
 * 副作用 API を持たず harness.db の read model を表示するのみ。純関数ゆえ server なしで test 可能。
 */

/** HTML 特殊文字をエスケープ (XSS/壊れ防止)。 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface NavItem {
  id: string;
  name: string;
  href: string;
  category: "PM" | "HM" | "GD";
}

/** ページ共通レイアウト (カテゴリ別ナビ + read-only バナー)。 */
export function layout(opts: {
  title: string;
  activeId: string;
  nav: NavItem[];
  body: string;
}): string {
  const groups: Record<string, NavItem[]> = { PM: [], HM: [], GD: [] };
  for (const item of opts.nav) groups[item.category]?.push(item);
  const navHtml = (["PM", "HM", "GD"] as const)
    .map((cat) => {
      const items = groups[cat]
        .map(
          (i) =>
            `<li${i.id === opts.activeId ? ' class="active"' : ""}><a href="${escapeHtml(i.href)}">${escapeHtml(i.id)} ${escapeHtml(i.name)}</a></li>`,
        )
        .join("");
      return `<div class="navgroup"><h3>${cat}</h3><ul>${items}</ul></div>`;
    })
    .join("");
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)} — UT-TDD 中央 UI</title>
<style>
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; display: flex; min-height: 100vh; }
nav { width: 240px; background: #1b1f24; color: #e6e6e6; padding: 12px; overflow-y: auto; flex: none; }
nav .brand { font-weight: 700; font-size: 15px; padding: 8px 4px; color: #8fd3ff; }
nav .navgroup h3 { font-size: 11px; letter-spacing: .08em; color: #8a8f98; margin: 14px 4px 4px; }
nav ul { list-style: none; margin: 0; padding: 0; }
nav li a { display: block; padding: 5px 8px; color: #cdd3da; text-decoration: none; border-radius: 5px; font-size: 13px; }
nav li a:hover { background: #2a2f36; }
nav li.active a { background: #2f6feb; color: #fff; }
main { flex: 1; padding: 20px 28px; overflow-x: auto; }
h1 { font-size: 20px; margin: 0 0 4px; }
.sub { color: #6b7280; font-size: 13px; margin: 0 0 16px; }
.banner { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; padding: 6px 10px; border-radius: 6px; font-size: 12px; margin-bottom: 16px; }
table { border-collapse: collapse; width: 100%; font-size: 13px; margin: 10px 0; }
th, td { border: 1px solid #d0d5dd; padding: 5px 9px; text-align: left; vertical-align: top; }
th { background: #f2f4f7; position: sticky; top: 0; }
tr:nth-child(even) td { background: rgba(127,127,127,.05); }
.cli { background: #0d1117; color: #c9d1d9; padding: 8px 11px; border-radius: 6px; font-family: ui-monospace, monospace; font-size: 12.5px; margin: 6px 0; white-space: pre-wrap; }
.cli .label { color: #8a8f98; font-size: 11px; display: block; margin-bottom: 3px; }
.cards { display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0; }
.card { border: 1px solid #d0d5dd; border-radius: 8px; padding: 10px 14px; min-width: 120px; }
.card .n { font-size: 22px; font-weight: 700; }
.card .k { font-size: 12px; color: #6b7280; }
.empty { color: #6b7280; font-style: italic; padding: 8px 0; }
.badge { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 11px; }
.badge.green { background: #dcfce7; color: #166534; }
.badge.yellow { background: #fef9c3; color: #854d0e; }
.badge.red { background: #fee2e2; color: #991b1b; }
.badge.gray { background: #e5e7eb; color: #374151; }
a { color: #2f6feb; }
</style>
</head>
<body>
<nav>
<div class="brand">UT-TDD 中央 UI</div>
${navHtml}
</nav>
<main>
<div class="banner">read-only ダッシュボード — 操作は CLI コマンドのコピーのみ (UI 直接実行なし、screen-list §3 S5=b)</div>
${opts.body}
</main>
</body>
</html>`;
}

/** ページ見出し。 */
export function pageHeader(id: string, name: string, subtitle: string): string {
  return `<h1>${escapeHtml(id)} ${escapeHtml(name)}</h1><p class="sub">${escapeHtml(subtitle)}</p>`;
}

/** harness.db の行配列を HTML table に描画 (列は明示指定 or 全キー)。 */
export function table(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return `<p class="empty">該当データなし</p>`;
  const cols = columns ?? Object.keys(rows[0]);
  const head = cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${cols.map((c) => `<td>${escapeHtml(row[c])}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

/** 集計カード群。 */
export function cards(items: { k: string; n: unknown }[]): string {
  const inner = items
    .map(
      (i) =>
        `<div class="card"><div class="n">${escapeHtml(i.n)}</div><div class="k">${escapeHtml(i.k)}</div></div>`,
    )
    .join("");
  return `<div class="cards">${inner}</div>`;
}

/** CLI コマンドのコピー用ブロック (read-only 制約下の唯一の action affordance)。 */
export function cliBlock(label: string, commands: string[]): string {
  const body = commands.map((c) => escapeHtml(c)).join("\n");
  return `<div class="cli"><span class="label">${escapeHtml(label)} — コピーして CLI で実行</span>${body}</div>`;
}

/** status 文字列を色 badge に。 */
export function statusBadge(status: unknown): string {
  const s = String(status ?? "").toLowerCase();
  let cls = "gray";
  if (/(green|pass|confirmed|completed|ok|reached)/.test(s)) cls = "green";
  else if (/(yellow|warn|in_progress|draft|pending)/.test(s)) cls = "yellow";
  else if (/(red|fail|block|error|open|rejected)/.test(s)) cls = "red";
  return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
}
