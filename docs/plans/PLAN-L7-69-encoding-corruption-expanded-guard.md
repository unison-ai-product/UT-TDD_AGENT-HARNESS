---
plan_id: PLAN-L7-69-encoding-corruption-expanded-guard
title: "PLAN-L7-69 (troubleshoot): expanded encoding-corruption guard"
kind: troubleshoot
layer: L7
drive: agent
status: draft
created: 2026-06-16
updated: 2026-06-16
owner: Codex TL
agent_slots:
  - role: tl
    slot_label: "TL - encoding corruption guard expansion"
generates:
  - artifact_path: docs/plans/PLAN-L7-69-encoding-corruption-expanded-guard.md
    artifact_type: markdown_doc
  - artifact_path: docs/improvement-backlog.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-68-provider-dispatch-portability.md
  requires:
    - docs/improvement-backlog.md
    - docs/handover/session-handover-2026-06-16.md
    - .ut-tdd/audit/A-137-unusable-provider-dispatch-audit.md
---

# PLAN-L7-69: expanded encoding-corruption guard

## 0. Objective

Expand mojibake / encoding-corruption detection beyond the current freeze-readability slice so handover, audit, provider JSON, and governance-facing documents cannot silently become unreadable.

## 1. Problem

The latest session exposed unreadable handover and skill/core text. Existing readability checks are scoped to selected freeze documents and do not prove that generated handover or audit artifacts are readable.

## 2. Scope

Future implementation must cover:

- `docs/handover/**/*.md`
- `.ut-tdd/audit/**/*.md`
- `.ut-tdd/handover/**/*.json`
- `docs/plans/**/*.md`
- governance docs that are used as session-start Core Reads

Detection signals:

- U+FFFD replacement characters;
- known UTF-8/CP932 mojibake markers;
- suspicious mixed marker density in mostly Japanese documents;
- JSON string fields containing known mojibake markers.

## 3. Acceptance Criteria

- A negative test fixture with unreadable handover text fails.
- A negative test fixture with provider JSON containing mojibake fails.
- Clean ASCII handover and audit files pass.
- `doctor` surfaces the expanded guard with actionable file paths.
- The guard is scoped enough to avoid treating historical vendor snapshots as product-owned failures.

## 4. Status

Draft only. This PLAN is the ticket requested by the user; implementation is not part of PLAN-L7-68.
