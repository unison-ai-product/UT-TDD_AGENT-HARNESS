<!-- UT-TDD:managed:start -->
# UT-TDD Agent Harness Shared Context

Use repository-local UT-TDD commands for harness state and delegation.

- `ut-tdd status` reports the local runtime mode.
- `ut-tdd doctor --profile consumer-setup-smoke` runs consumer-safe setup and hook checks.
- `ut-tdd doctor --profile consumer-toolchain` runs consumer-safe toolchain checks.
- Full `ut-tdd doctor` is for source/governance repositories with PLAN/design/test-design artifacts.
- `ut-tdd handover` reads and writes cross-runtime handover state.
- `ut-tdd codex --role <role> --task "..."` delegates to Codex.
- `ut-tdd claude --role <role> --task "..."` delegates to Claude.

## Model routing defaults

Route work to the cheapest model class that can own the outcome; reserve frontier
models for judgement.

| Model class | Default use | Effort |
|---|---|---|
| Claude Opus (`opus`) | final review, judgement gates, hardest design decisions | middle / xhigh |
| Claude Sonnet (`sonnet`) | docs, design, UI/UX, structured review | high (xhigh for UI/UX) |
| Claude Haiku (`haiku`) | scouting, triage, lightweight parallel checks | high, small scoped tasks |
| GPT/Codex worker (`gpt-5.6-terra`) | test implementation lanes | middle |
| GPT/Codex spark (`gpt-5.3-codex-spark`) | lightweight implementation lanes | high |
| GPT frontier (`gpt-5.6-sol`) | gated top-tier review/consultation | low |

- Give agents the full goal, constraints, and done-criteria in the first turn.
- Separate creation from judgement: prefer a different model family for review.
- No completion claim without tests or explicit verification evidence.

Do not put secrets, tokens, or machine-local absolute paths in adapter docs.
<!-- UT-TDD:managed:end -->
