<!-- UT-TDD:managed:start -->
# Claude Runtime Adapter

Claude Code sessions should route harness lifecycle work through `ut-tdd`.
Consumer-owned Claude instructions can be added outside this managed block.

- Session evidence: `ut-tdd status` and `ut-tdd handover`
- Health check: `ut-tdd doctor --profile consumer-setup-smoke`
- Toolchain check: `ut-tdd doctor --profile consumer-toolchain`
- Review separation: use another runtime/model family when feasible

## Claude subagent defaults

- Always pass an explicit `model` when spawning subagents; it must match the
  agent frontmatter family (opus / sonnet / haiku).
- Opus (`opus`) = judgement and final review; Sonnet (`sonnet`) =
  docs/design/structured review; Haiku (`haiku`) = scouting and triage.
- Claude Opus reasoning effort defaults to `middle`; Claude Sonnet defaults to `high`.
  Use `xhigh` only for high-judgement review or UI/UX work.
- Give the full task specification up front; report findings with file and
  command evidence before summaries.

<!-- UT-TDD:managed:end -->
