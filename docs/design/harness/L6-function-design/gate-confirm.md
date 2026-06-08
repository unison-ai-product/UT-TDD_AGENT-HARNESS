---
layer: L6
sub_doc: function-spec
status: draft
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
plan: docs/plans/PLAN-L6-17-gate-confirm.md
---

# gate-confirm lint — function design (IMP-079)

## §1 Scope

`gate-confirm` verifies the mechanical coupling between gate status and document freeze status. A design or test-design document may be `status: confirmed` only when the corresponding gate row in `docs/governance/gate-design.md` §2 is PASS. This catches status-only freeze without a gate record.

## §2 Functions

| function | contract |
|---|---|
| `parseGateStatuses(gateText)` | Parse `G<N>` / `L<N>` / status cells from the gate-design §2 table. PASS is true only when the status cell contains `PASS`. |
| `parseConfirmDoc(file, content, kind)` | Extract `layer` and `status` from design/test-design frontmatter. |
| `layerToGate(layer)` | Map `L<N>` to `G<N>`. Non-layer values return null. |
| `analyzeGateConfirm(input)` | For each confirmed doc, check corresponding gate PASS. Gate parse failure returns `skipped=true` and `ok=true` (fail-open). |
| `loadGateConfirmDocs(repoRoot)` | Load gate-design plus `docs/design/harness/**` and `docs/test-design/harness/**`. |
| `gateConfirmMessages(result)` | Emit OK / skip / violation messages for doctor. |

## §3 Doctor Behavior

Initial integration is warn-first. `checkGateConfirm` is included in doctor messages but does not change `runDoctor.ok`. Hard fail is a later policy switch after the real repo stays green.

## §4 Test Oracle

Covered by `tests/gate-confirm.test.ts`:

| ID | oracle |
|---|---|
| U-GCONF-001 | gate table parser extracts PASS and park rows |
| U-GCONF-002 | layer to gate mapping |
| U-GCONF-003 | park gate + confirmed doc -> violation |
| U-GCONF-004 | PASS gate + confirmed doc -> ok |
| U-GCONF-005 | parse failure -> skip/fail-open |
| U-GCONF-006 | draft doc is outside the check |
