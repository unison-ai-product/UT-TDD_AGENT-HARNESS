artifact_type: test_design
layer: L7
executed_at_layer: L7
status: confirmed-red
plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
---

# Pack consumer Node runtime closure — aggregate authority and durable history

This artifact adds only the missing Red oracles for the Issue #420 physical
adapter slice. It does not claim implementation or green coverage. The
production setup ingress must consume the result of the existing
`admitReleaseAggregate` contract; a self-consistent JSON plan or an arbitrary
digest-bound byte blob is not an aggregate authority.

## Aggregate authority (PF5)

The baseline fixture is the actual output chain
`admitReleaseAggregate` → `admitConsumerLocalRuntime`, using the existing
`SealedReleaseAggregatePlan` and `ConsumerLocalRuntimeAdmission` production
types. Its release identity is also derived from the existing Pack publication
path: the fixture builds a v2 publication manifest, seals it through
`buildPackPublicationStagingPlan`, and binds `controlManifestSnapshotDigest`
from that plan's parsed manifest/sidecar. No digest of hand-written or
synthetic aggregate bytes is used as the control-manifest authority. The
setup ingress must receive the resulting same-process admission capability,
not a raw finalTree/manifest/receipt object. Before any runtime
directory or setup artifact is written it must reject all of these single-axis
mutations:

- manifest releaseId, sourceRevision, materializerVersion, and artifact-set digest;
- consumer receipt releaseId, sourceRevision, materializerVersion, and artifact-set digest;
- consumer productId, consumerRoot, or runtimeRoot;
- materialized entry path, mode, or content;
- an unbranded raw finalTree/manifest/receipt object at the capability boundary.

The oracle is typed denial plus repository/runtime tree unchanged. Structural
comparison is not used to claim that a coherent fake was never produced. The
positive baseline is the actual same-process admission composition and asserts
the returned capability is tied to the sealed release plan; the raw-object
setup case is a separate deny/write-0 oracle. No new aggregate validator or
raw `sealed_aggregate` hash authority is introduced.

## Durable history and restart reconcile

The payload producer and filesystem adapter must preserve the §11.2 contract:

- genesis is sequence 0 with explicit genesis sentinels and null prior pointer;
- update/rollback history is the prior history byte prefix plus exactly one
  canonical record and LF;
- sequence, prior bundle digest, prior history tip, record digest, and raw prior
  pointer bytes/mode/digest are all bound and independently mutated in tests;
- operation kind and rollback prior-attestation presence/bytes are independently
  mutated; rollback is only positive with an attested prior generation;
- `operation-state.json` remains immutable `publication: "prepared"` and stores
  the raw prior pointer snapshot;
- a new-process read-only reconcile derives the same committed/uncommitted or
  indeterminate result from durable bytes and caller-supplied prior state, with
  zero writes;
- rollback accepts only an already attested prior generation and records a new
  operation; it never mutates or discovers an unrecorded bundle.

Candidate coverage is intentionally limited to existing IDs:

| Oracle | Existing candidate IDs |
| --- | --- |
| setup aggregate admission and write-0 mutations | `CANDIDATE-U-PACKNODE-007`, `008`, `009` |
| history prefix/sequence/tip/raw-pointer mutations | `CANDIDATE-U-PACKNODE-012`, `014` |
| fault and restart reconcile/prior bundle invariance | `CANDIDATE-U-PACKNODE-005`, `012`, `013` |

The Red tests live in `tests/consumer-node-runtime-closure-red.test.ts` and
must remain independent of source checkout fallback, global CLI state, Bun, or
remote publication.
