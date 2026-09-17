# PR #643 force-push / admission-history disclosure (append-only)

## Scope and correction

This note is an append-only correction to the disclosure comment on PR #643
(GitHub comment `5707523276`). It records the full historical chain identified by
the final Claude exact-head review (`af7db1e37f1daaa70c1577016e8f168e67aa0e342b7c59170e92b9468358c2db`).
The earlier comment named `0adbcf41` as the old head. That was incomplete: the
force-pushed-away ref head was `de1bb88334d4cc554be5ed794b00412039ac6a38`.
The earlier comment remains as historical evidence; it is not edited or deleted.

No plan source, tracked projection, or Git history is rewritten by this note.
This commit only adds disclosure. Future admission corrections for this PR must
be N+1 append-only records; existing sequence numbers must not be reused and no
force-push is permitted.

## Force-push event and discarded ref chain

- The relevant pushed chain was `276057905403b75c0d2ffbf78b6ad8ea1d3499c8`
  (commit time `2026-09-16T20:04:01+09:00`) →
  `d49e888ddc8b56022340e8af71ad93100c065eef` (commit time
  `2026-09-16T20:07:44+09:00`) → merge
  `614cd2923df4f7cdb537d9e0e8ec3c664caeceba` (commit time
  `2026-09-16T20:14:57+09:00`).
- The later recovery commits were `0adbcf41f41d53dbec52380d2040e0b09081726b`
  (commit time `2026-09-17T09:58:22+09:00`) and
  `de1bb88334d4cc554be5ed794b00412039ac6a38` (commit time
  `2026-09-17T10:02:18+09:00`).
- The force-push was observed at `2026-09-17T01:40:38Z` and made the old
  chain unreachable from the remote PR ref. The actual old ref head was
  `de1bb88334d4cc554be5ed794b00412039ac6a38`, not the predecessor
  `0adbcf41f41d53dbec52380d2040e0b09081726b` named in the first disclosure.

At `0adbcf41`, rev7/sequence 274 used certificate
`add6ca9402d2903ca1a4626dcbbb059e`, receipt digest
`sha256:5b58edbc9bc12669820ab6ad60b6aa597db7a4d828b84b1e3587a5647708bed1`,
and record digest
`sha256:10e83a3c0f70cf720969cf45212d8ae12fd98de18b4281695d4be86e957c735f`.
The source embedded `admitted_at: 2026-09-17T12:00:00+09:00`.

Commit `de1bb883` performed an in-place rewrite of that same rev7/sequence 274
receipt before the force-push: the receipt digest became
`sha256:f56b81cf503fef3d2c293e863df1d3406df7def6a94050ba1adab578387479c6`,
the record digest became
`sha256:d2706aea93953e78f7d42cbe81645391c2e22d8400397a858c6bf448189f9b37`,
and `admitted_at` became `2026-09-17T01:01:06.503Z`. The certificate ID remained
`certificate:add6ca9402d2903ca1a4626dcbbb059e`.

The later current head `18757c51e601eadf960421807234ce4866cd1198` contains a
separately generated rev6/rev7 chain. The old receipts above are retained only
as discarded historical evidence and are not used as current authority.

## Earlier reachable PLAN-RECOVERY-16 chain also disclosed here

Before the `614cd292` merge, the reachable chain at commits
`276057905403b75c0d2ffbf78b6ad8ea1d3499c8` →
`d49e888ddc8b56022340e8af71ad93100c065eef` contained the following records.
Both records used decision digest
`sha256:0c602385dfe6a8424d499cca7898473adf1b099ffe8b726f21112627913af488`.
The recorded admission times post-date the commits embedding the corresponding
source, which is why they are disclosed as historical hand-written values.

### Rev6 / projection sequence 266

- command: `plan-revise:issue-541:recovery-16:6`
- certificate: `certificate:b95f6ebf9406389d35b7a00745fb4fa4`
- receipt digest: `sha256:a049d0e3009def0efef0afb5b8491a5e2c64e8606b39fd939922c3ec95158aec`
- record digest: `sha256:8818bd653f5388e5cf6331b88604b3a5b5ac9691adf13fa04628b6195889d7fd`
- admitted at: `2026-09-16T20:10:00+09:00`
- embedding commit: `276057905403b75c0d2ffbf78b6ad8ea1d3499c8`, committed at
  `2026-09-16T20:04:01+09:00`

### Rev7 / projection sequence 267

- command: `plan-revise:issue-541:recovery-16:7`
- certificate: `certificate:3bf790ecebfa3a8548f4d62be7414052`
- receipt digest: `sha256:db55bc5c88211eceaa426d60b5548a4405364eb5d011474eea857e2f85539772`
- record digest: `sha256:d284958edac11a12e115598c769dcf72862f295acc71e0b48e72bfce4e5096b3`
- admitted at: `2026-09-16T20:20:00+09:00`
- embedding commit: `d49e888ddc8b56022340e8af71ad93100c065eef`, committed at
  `2026-09-16T20:07:44+09:00`

The `614cd292` merge returned the PLAN source to the rev5 lineage while the
projection sequence numbers 266/267 were later reused by different records on
the main line. This historical sequence reuse is disclosed, not repaired by
rewriting either history. The current `18757c51` rechain and its seq273→274
postimage remain documented in
`issue541-plan-recovery-16-rechain-20260917.md`.

## Remediation rule

The incident is closed only as a disclosed process violation. No current
receipt is backdated or silently replaced. Any future correction is a new
N+1 record with a new command/receipt/sequence and a normal fast-forward push;
the PR history and prior evidence remain immutable.
