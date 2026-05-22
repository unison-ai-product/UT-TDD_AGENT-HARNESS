#!/usr/bin/env python3
"""Diff D-DB markdown schema against SQLite DB."""

from __future__ import annotations

import argparse
import re
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path

from helix_db import DEFAULT_SQLITE_TIMEOUT_SEC, get_connection

CONSTRAINT_PREFIXES = {"constraint", "primary", "unique", "foreign", "check"}
INLINE_CONSTRAINTS = {
    "primary",
    "not",
    "default",
    "unique",
    "check",
    "references",
    "collate",
    "generated",
    "autoincrement",
}

# Markdown column-table header keywords (case-insensitive)
_MD_COLUMN_HEADERS = {"column", "col", "カラム"}


def _normalize_ident(name: str) -> str:
    return name.strip().strip('"').strip("`").lower()


def _normalize_type(type_expr: str) -> str:
    norm = " ".join(type_expr.strip().split())
    return norm.upper()


def _split_definitions(body: str) -> list[str]:
    chunks: list[str] = []
    current: list[str] = []
    depth = 0
    for ch in body:
        if ch == "(":
            depth += 1
        elif ch == ")" and depth > 0:
            depth -= 1

        if ch == "," and depth == 0:
            piece = "".join(current).strip()
            if piece:
                chunks.append(piece)
            current = []
            continue

        current.append(ch)

    tail = "".join(current).strip()
    if tail:
        chunks.append(tail)
    return chunks


def _extract_table_blocks(doc: str) -> list[tuple[str, str]]:
    pattern = re.compile(
        r"create\s+table\s+(?:if\s+not\s+exists\s+)?([\"`]?\w+[\"`]?)\s*\((.*?)\)\s*;",
        re.IGNORECASE | re.DOTALL,
    )
    return [(_normalize_ident(m.group(1)), m.group(2)) for m in pattern.finditer(doc)]


def _parse_design_columns(doc: str) -> dict[str, dict[str, str]]:
    design: dict[str, dict[str, str]] = {}
    for table, body in _extract_table_blocks(doc):
        cols: dict[str, str] = {}
        for raw_item in _split_definitions(body):
            item = raw_item.strip()
            if not item:
                continue
            tokens = item.split()
            if not tokens:
                continue
            head = tokens[0].strip('"`').lower()
            if head in CONSTRAINT_PREFIXES:
                continue

            column = _normalize_ident(tokens[0])
            type_parts: list[str] = []
            for token in tokens[1:]:
                low = token.lower().strip(',')
                if low in INLINE_CONSTRAINTS:
                    break
                type_parts.append(token)
            cols[column] = _normalize_type(" ".join(type_parts))

        design[table] = cols
    return design


def _parse_design_indexes(doc: str) -> dict[str, set[str]]:
    pattern = re.compile(
        r"create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?([\"`]?\w+[\"`]?)\s+on\s+([\"`]?\w+[\"`]?)",
        re.IGNORECASE,
    )
    by_table: dict[str, set[str]] = defaultdict(set)
    for match in pattern.finditer(doc):
        index_name = _normalize_ident(match.group(1))
        table_name = _normalize_ident(match.group(2))
        by_table[table_name].add(index_name)
    return dict(by_table)


# ---------------------------------------------------------------------------
# Markdown schema parser (D-DB heading + column table format)
# ---------------------------------------------------------------------------

def _md_table_cells(line: str) -> list[str]:
    """Split a markdown table row into trimmed cell strings."""
    return [c.strip() for c in line.strip().strip("|").split("|")]


def _parse_md_column_table(body: str) -> dict[str, str]:
    """
    Parse a markdown column-definition table from a section body.

    Expected format:
        | Column | Type | ... |
        |---|---|...|
        | `col_name` | `TYPE` | ... |

    Returns {col_name: TYPE}.  Empty dict if no such table found.
    """
    cols: dict[str, str] = {}
    lines = body.splitlines()
    header_idx: int | None = None

    for i, raw in enumerate(lines):
        line = raw.strip()
        if not line.startswith("|"):
            if header_idx is not None and line and not line.startswith("|"):
                # Non-table line after header detected — stop parsing
                break
            continue

        cells = _md_table_cells(line)
        if not cells:
            continue

        first_raw = cells[0]
        first = first_raw.strip("`").strip().lower()

        if first in _MD_COLUMN_HEADERS:
            header_idx = i
            continue

        # Separator row (e.g. |---|---|)
        if re.fullmatch(r"[-:| ]+", line):
            continue

        if header_idx is not None and len(cells) >= 2:
            col_name = first_raw.strip("`").strip().lower()
            col_type = cells[1].strip("`").strip().upper()
            if col_name and col_type and not re.fullmatch(r"[-:| ]+", col_name):
                cols[col_name] = col_type

    return cols


def _extract_db_annotation(body: str) -> str | None:
    """
    Extract the DB filename from a section body line like:
        DB: `customer_management.sqlite3`
    Returns the basename (e.g. 'customer_management.sqlite3') or None.
    """
    m = re.search(r"^\s*DB:\s*`([^`]+)`", body, re.MULTILINE)
    return m.group(1).strip().lower() if m else None


def _parse_md_index_list(body: str) -> set[str]:
    """
    Parse index names from a markdown bullet list that follows an "Indexes:" header.

    Format:
        Indexes:

        - `idx_name(columns)` optional-comment
        - `idx_name2(...)` UNIQUE — comment

    Returns a set of lowercased index names.
    """
    indexes: set[str] = set()
    in_index_section = False
    for line in body.splitlines():
        stripped = line.strip()
        if re.match(r"^indexes?:?\s*$", stripped, re.IGNORECASE):
            in_index_section = True
            continue
        if in_index_section:
            if not stripped:
                continue
            # Stop on the next non-list line (e.g. a new paragraph or heading)
            if not stripped.startswith(("-", "*")):
                in_index_section = False
                continue
            m = re.search(r"`([\w]+)\s*\(", stripped)
            if m:
                indexes.add(m.group(1).lower())
    return indexes


def _parse_markdown_schema(
    doc: str,
    db_scope: str | None = None,
) -> tuple[dict[str, dict[str, str]], set[str], dict[str, set[str]]]:
    """
    Parse table definitions from D-DB markdown format.

    db_scope — basename of the SQLite file being checked (e.g. 'ai_assist.sqlite3').
               When set, tables annotated for a *different* DB are excluded so they
               don't generate false missing-table warnings.

    Returns:
        columns_by_table  — {table_name: {col_name: type}} for tables that have a
                            Column/Type markdown table in their section body.
        mentioned_only    — table names found in headings or list-tables but without
                            a column definition (column-drift checking is skipped for
                            these; they are still treated as "documented").
        indexes_by_table  — {table_name: set[index_name]} parsed from "Indexes:" lists.
    """
    columns_by_table: dict[str, dict[str, str]] = {}
    mentioned_only: set[str] = set()
    indexes_by_table: dict[str, set[str]] = {}

    # Split document on heading lines (### ... or #### ...)
    heading_re = re.compile(r"^\s*(#{1,6}[^\n]+)$", re.MULTILINE)
    parts = heading_re.split(doc)
    # parts: [pre, heading0, body0, heading1, body1, ...]

    # Track the current "parent DB" context inferred from #### `<db-file>` headings
    # so that §6.1-style list tables inherit the right DB scope.
    current_list_db: str | None = None

    i = 1
    while i + 1 < len(parts):
        heading = parts[i]
        body = parts[i + 1]
        i += 2

        m = re.search(r"`([^`]+)`", heading)
        if not m:
            continue
        token = m.group(1)

        # ---- DB-context heading (e.g. #### `personal_documents.sqlite3` 追加テーブル) ----
        if "." in token:
            current_list_db = token.lower()
            continue

        table_name = token.lower()

        # DB scope from inline annotation
        db_ann = _extract_db_annotation(body)
        if db_ann is None:
            # Fall back to the list-context DB for tables without their own annotation
            db_ann = current_list_db

        # Skip tables that belong to a different DB
        if db_scope and db_ann and db_ann != db_scope.lower():
            continue

        cols = _parse_md_column_table(body)
        if cols:
            columns_by_table[table_name] = cols
        else:
            mentioned_only.add(table_name)

        idxs = _parse_md_index_list(body)
        if idxs:
            indexes_by_table[table_name] = idxs

    # Also catch table names listed in "テーブル | 用途" style markdown tables
    # (used in §6.1 lists where individual sections are absent).
    # These tables were already captured above via heading parsing, so this pass
    # only adds any that slipped through (e.g. no enclosing heading with a table name).
    tbl_header_re = re.compile(
        r"^\s*\|\s*(?:テーブル|table)\s*\|[^\n]*\n"  # header row
        r"\s*\|[-| :]+\n"                             # separator row
        r"((?:\s*\|[^\n]+\n)+)",                      # data rows
        re.IGNORECASE | re.MULTILINE,
    )
    first_cell_re = re.compile(r"^\|\s*`(\w+)`")
    for sec in tbl_header_re.finditer(doc):
        for row in sec.group(1).splitlines():
            cm = first_cell_re.match(row.strip())
            if cm:
                name = cm.group(1).lower()
                if name not in columns_by_table and name not in mentioned_only:
                    mentioned_only.add(name)

    return columns_by_table, mentioned_only, indexes_by_table


def _load_actual_schema(db_path: Path) -> tuple[set[str], dict[str, dict[str, str]], dict[str, set[str]]]:
    conn = get_connection(db_path=db_path, timeout=DEFAULT_SQLITE_TIMEOUT_SEC)
    try:
        table_rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ).fetchall()
        tables = {_normalize_ident(row[0]) for row in table_rows}

        columns: dict[str, dict[str, str]] = {}
        indexes: dict[str, set[str]] = {}
        for table in tables:
            col_rows = conn.execute(f"PRAGMA table_info('{table}')").fetchall()
            columns[table] = {
                _normalize_ident(row[1]): _normalize_type(row[2] or "") for row in col_rows
            }

            idx_rows = conn.execute(f"PRAGMA index_list('{table}')").fetchall()
            # Exclude SQLite internal autoindexes from drift checks
            indexes[table] = {
                _normalize_ident(row[1])
                for row in idx_rows
                if not row[1].startswith("sqlite_autoindex_")
            }

        return tables, columns, indexes
    finally:
        conn.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="D-DB drift diff")
    parser.add_argument("--doc", required=True, help="Path to D-DB markdown file")
    parser.add_argument("--db", required=True, help="Path to SQLite db")
    args = parser.parse_args()

    doc_path = Path(args.doc)
    db_path = Path(args.db)

    if not doc_path.exists():
        print(f"ERROR|missing-doc|設計書が存在しません: {doc_path}")
        return 2
    if not db_path.exists():
        print(f"ERROR|missing-db|SQLite DB が存在しません: {db_path}")
        return 2

    doc_text = doc_path.read_text(encoding="utf-8")
    # Auto-detect DB scope from the filename so cross-DB tables are excluded
    db_scope = db_path.name

    # SQL DDL parser (legacy / helix.db style docs)
    ddl_columns = _parse_design_columns(doc_text)
    design_indexes = _parse_design_indexes(doc_text)

    # Markdown column-table parser (D-DB heading + "| Column | Type |" format)
    md_columns, md_mentioned, md_indexes = _parse_markdown_schema(doc_text, db_scope=db_scope)

    # Merge: DDL takes precedence when both define the same table / index set
    design_columns: dict[str, dict[str, str]] = {**md_columns, **ddl_columns}
    for tbl, idxs in md_indexes.items():
        if tbl not in design_indexes:
            design_indexes[tbl] = idxs
    # All tables documented in any form (with or without column definitions)
    documented_tables: set[str] = set(design_columns.keys()) | md_mentioned

    try:
        actual_tables, actual_columns, actual_indexes = _load_actual_schema(db_path)
    except sqlite3.Error as exc:
        print(f"ERROR|sqlite|SQLite 参照に失敗: {exc}")
        return 3

    warnings: list[tuple[str, str]] = []
    design_tables = set(design_columns.keys())

    # Tables documented with column definitions but absent from DB
    for table in sorted(design_tables - actual_tables):
        warnings.append(("missing-table", f"設計書のテーブル '{table}' が実 DB に存在しません"))

    # Tables in DB but not documented anywhere (neither DDL nor markdown)
    for table in sorted(actual_tables - documented_tables):
        warnings.append(("orphan", f"実 DB のテーブル '{table}' が設計書に記載されていません"))

    # Column / index drift (only for tables that have column definitions)
    for table in sorted(design_tables & actual_tables):
        expected_cols = design_columns.get(table, {})
        observed_cols = actual_columns.get(table, {})

        for col in sorted(expected_cols.keys() - observed_cols.keys()):
            warnings.append(("schema-drift", f"table={table}: 設計書のカラム '{col}' が実 DB にありません"))
        for col in sorted(observed_cols.keys() - expected_cols.keys()):
            warnings.append(("schema-drift", f"table={table}: 実 DB のカラム '{col}' が設計書にありません"))
        for col in sorted(expected_cols.keys() & observed_cols.keys()):
            expected_type = expected_cols[col]
            observed_type = observed_cols[col]
            if expected_type and observed_type and expected_type != observed_type:
                warnings.append(
                    (
                        "schema-drift",
                        f"table={table}: カラム '{col}' の型差分 (design={expected_type}, db={observed_type})",
                    )
                )

        expected_idx = design_indexes.get(table, set())
        observed_idx = actual_indexes.get(table, set())
        for idx in sorted(expected_idx - observed_idx):
            warnings.append(("index-drift", f"table={table}: 設計書のインデックス '{idx}' が実 DB にありません"))
        for idx in sorted(observed_idx - expected_idx):
            warnings.append(("index-drift", f"table={table}: 実 DB のインデックス '{idx}' が設計書にありません"))

    result = "warn" if warnings else "ok"
    print(f"RESULT|{result}")
    for kind, message in warnings:
        print(f"WARN|{kind}|{message}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
