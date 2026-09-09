---
memory_id: memory:project:po-decision-archive-the-v-model-source-zips-only-after-the-template-format-is-established--e3ffd7a754d6
kind: project
title: "PO decision: archive the V-model source ZIPs only after the template format is established"
tags: ["archive", "housekeeping", "po-decision", "template", "vmodel"]
updated_at: 2026-08-27T05:26:31.525Z
---

PO ruling 2026-08-27: the three local ZIP archives stay where they are until the V-model design document format has been formalised as a template. Move them to C:\dev\_archive only after that, never delete.

Subjects (none are tracked by git; all three are gitignored, so nothing is on GitHub):
- Vモデル設計ドキュメント_checked.zip, 8.06 MB, repo root, ignored by .gitignore:56 /*.zip. 624 entries, the vmodel-docgen-clean tree.
- .ut-tdd/cache/Vモデル設計ドキュメント_checked_canonical.zip, 8.04 MB, ignored by .gitignore:15 .ut-tdd/cache/*. Canonicalised copy of the above, written two minutes later on 2026-07-10.
- ut-tdd-design-harness-internalization-v0_2.zip, 0.13 MB, repo root, ignored by .gitignore:56. 71 entries, 00-executive-summary.md through the internalisation design set.

Why they cannot simply be deleted: more than ten canonical docs reference them by name, including docs/governance/vmodel-source-manifest.md, vmodel-upgrade-schedule.md, vmodel-typed-spec-definitions.md, vmodel-activation-profiles.md, vmodel-agent-contracts.md, vmodel-document-scale-profiles.md, docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md, PLAN-L0-01, PLAN-L1-08 and PLAN-L5-15. They are the migration source material CLAUDE.md keeps for migration, gap audit and regression-source inspection.

When the move happens it must include fixing those manifest reference paths, and it is a separate docs-only PR - not folded into unrelated work. The canonical copy under .ut-tdd/cache is effectively a duplicate of the root ZIP and is the obvious first candidate to drop, worth 8 MB.

PO follow-up, same day: the design-harness ZIP may be a separate case from the two V-model docgen ZIPs.

ut-tdd-design-harness-internalization-v0_2.zip is the source of PLAN-L1-08-design-harness-internalization, which is kind=research, status=draft, last updated 2026-07-15 and still open. Outside that PLAN it is referenced only by session handover notes (2026-07-22, 07-28, 08-06, 08-27), not by the vmodel-source-manifest chain that binds the other two. So its disposition is tied to whether PLAN-L1-08 is still live work rather than to the template formalisation. Decide it separately; do not fold it into the V-model ZIP move.

Blocking condition for the move: the template formalisation is not done yet, so do not move the two V-model ZIPs. The design-harness ZIP is unresolved pending a separate PO call on PLAN-L1-08.
