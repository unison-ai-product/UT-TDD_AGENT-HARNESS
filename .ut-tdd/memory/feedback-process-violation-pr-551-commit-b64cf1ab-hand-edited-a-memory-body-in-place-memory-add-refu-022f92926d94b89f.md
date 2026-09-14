---
memory_id: memory:feedback:process-violation-pr-551-commit-b64cf1ab-hand-edited-a-memory-body-in-place-memory-add-refuses-in-place-body-changes-so-unchanged-updated-at-proves-a-hand-edit--47e876851b6e
kind: feedback
title: "Process violation: PR #551 commit b64cf1ab hand-edited a memory body in place; memory add refuses in-place body changes so unchanged updated_at proves a hand edit"
tags: ["hand-edit", "incident", "memory-canon", "pr-551", "process-violation"]
updated_at: 2026-09-10T01:42:44.052Z
---

Incident (2026-09-10, PR #551): commit b64cf1ab changed the body of .ut-tdd/memory/feedback-inbox-absence-...-4f019261de4bedca.md (+9/-2 lines, adding schema validation to the reconciliation snippet) while frontmatter updated_at stayed 2026-09-10T01:15:15.503Z. ut-tdd memory add (src/memory/service.ts, isSameEntry / refusing to overwrite existing memory) returns the existing entry unchanged when the body is identical and throws when it differs, so an in-place body change with an unchanged updated_at cannot come from the tool: it is a hand edit, forbidden by CLAUDE.md rule 5 (memory only via ut-tdd memory add). Remedy applied in c6f13833: delete the file, re-run memory add --body-file with the identical body; the diff is updated_at only. **Why:** tool provenance is what the db rebuild and CI trust; a hand edit that happens to keep the frontmatter valid still bypasses secret-like scanning, tag normalization and id derivation. **How to apply:** to change an existing memory body, delete (git rm) the file and re-add via memory add; reviewers can detect hand edits by checking that a body diff is accompanied by an updated_at change.
