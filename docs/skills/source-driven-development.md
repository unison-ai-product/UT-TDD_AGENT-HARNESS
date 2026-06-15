---
schema_version: skill.v1
name: source-driven-development
skill_type: verification
applies_to:
  layers: [L3, L6, L7, L8]
  drive_models: [Forward, Discovery, Add-feature, Reverse]
upstream: vendor/helix-source/skills/agent-skills/source-driven-development
---

# Source-Driven Development

> Upstream attribution: addyosmani/agent-skills (MIT)

## Overview

Every framework-specific implementation decision must be grounded in official documentation. Don't implement from memory — verify, cite, and show the sources to the user. Training data goes stale, APIs get deprecated, and best practices evolve. This skill ensures you deliver trustworthy code where every pattern can be traced to an authoritative source the user can verify.

## When to Use

- User requests code that follows a specific framework's current best practices
- Building boilerplate, starter code, or patterns that will be copied across the project
- User explicitly asks for the "correct" or documented implementation
- Implementing framework-specific features (forms, routing, data fetching, state management, authentication)
- Reviewing or improving code that uses framework-specific patterns
- You're about to write framework-specific code from memory

**When NOT to use:**

- Version-independent fixes (variable renames, typo corrections, file moves)
- Pure logic that works identically across versions (loops, conditionals, data structures)
- User explicitly prefers speed over verification

## Process

```
DETECT --> FETCH --> IMPLEMENT --> CITE
  |          |           |          |
  v          v           v          v
Which      Get the    Follow     Show the
stack?     relevant   the doc    source
           docs       patterns
```

### Step 1: Detect Stack and Version

Read the dependency file to identify exact versions:

```
package.json    -> Node/React/Vue/Angular/Svelte
composer.json   -> PHP/Symfony/Laravel
requirements.txt / pyproject.toml -> Python/Django/Flask
go.mod          -> Go
Cargo.toml      -> Rust
```

State the detected stack explicitly:

```
Detected stack:
- React 19.1.0 (from package.json)
- Vite 6.2.0
- Tailwind CSS 4.0.3
-> Fetching official docs for relevant patterns.
```

If the version is unknown or ambiguous, **ask the user**. Do not guess — versions determine which patterns are correct.

### Step 2: Fetch Official Documentation

Fetch the specific documentation page for the feature being implemented. Not the top page or the full docs — the relevant page.

**Source priority (most to least authoritative):**

| Priority | Source | Example |
|----------|--------|---------|
| 1 | Official documentation | react.dev, docs.djangoproject.com, symfony.com/doc |
| 2 | Official blog / changelogs | react.dev/blog, nextjs.org/blog |
| 3 | Web standards references | MDN, web.dev, html.spec.whatwg.org |
| 4 | Browser / runtime compatibility | caniuse.com, node.green |

**Not authoritative — do not cite as primary sources:**

- Stack Overflow answers
- Blog posts or tutorials (even popular ones)
- AI-generated documentation or summaries
- Your own training data (this is the point of the skill — always verify)

**Be specific when fetching:**

```
Bad: Fetch the React homepage
Good: Fetch react.dev/reference/react/useActionState

Bad: Search for "django authentication best practices"
Good: Fetch docs.djangoproject.com/en/6.0/topics/auth/
```

After fetching, extract the key patterns and check for deprecation warnings or migration guides.

If official sources contradict each other (e.g., migration guide conflicts with API reference), surface the discrepancy to the user and verify which pattern applies to the detected version.

### Step 3: Implement Following the Documentation

Write the code shown in the documentation:

- Use the API signatures shown in the docs, not from memory
- If the docs show a new way, use the new way
- If the docs mark a pattern as deprecated, do not use the deprecated version
- If the docs don't cover a case, flag it as unverified

**When docs conflict with existing project code:**

```
Conflict detected:
Existing codebase uses useState for form loading state, but
React 19 docs recommend useActionState for this pattern.
(Source: react.dev/reference/react/useActionState)

Options:
A) Use the modern pattern (useActionState) -- aligned with current docs
B) Match existing codebase (useState) -- aligned with project consistency
-> Which approach do you prefer?
```

Surface conflicts. Don't silently choose one.

### Step 4: Cite Sources

Add citations to all framework-specific patterns. The user must be able to verify every decision.

**In code comments:**

```typescript
// Using useActionState for form submission state (React 19)
// Source: https://react.dev/reference/react/useActionState#usage
const [state, formAction, isPending] = useActionState(submitOrder, initialState);
```

**In conversation:**

```
Using useActionState instead of manual useState for form submission state.
React 19 replaced the manual isPending/setIsPending pattern with this hook.

Source: https://react.dev/blog/2024/12/05/react-19#actions
"useTransition now supports async functions [...] automatically handles pending state"
```

**Citation rules:**

- Use full URLs, not shortened ones
- Prefer deep links with anchors when available (e.g., `/useActionState#usage` over `/useActionState`)
- Quote relevant passages for non-obvious decisions
- Include browser/runtime support data when recommending platform features
- If you cannot find documentation for a pattern, say so explicitly:

```
UNVERIFIED: No official documentation found for this pattern.
This is based on training data and may be outdated.
Please verify before using in production.
```

Honesty about what is unverified is more valuable than false confidence.

## UT-TDD Integration

In the UT-TDD V-model, source-driven development supports the design descent obligation: when a design doc or implementation uses a framework-specific pattern, the source URL serves as the traceability evidence that the pattern is current and authoritative. Add source URLs to the relevant design doc section (e.g., L6 function-spec or L3 API contract). This prevents future "coverage without substance" drift where a pattern exists in code but no one can verify it was correct at the time.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'm confident about this API" | Confidence is not evidence. Training data contains old patterns that look correct but break on current versions. Verify. |
| "Fetching docs wastes tokens" | Hallucinating an API wastes far more -- the user spends an hour debugging before discovering the function signature changed. One fetch prevents hours of rework. |
| "The docs probably don't cover this" | If the docs don't cover it, that's important information -- the pattern may not be officially recommended. |
| "Saying 'may be outdated' is enough" | A disclaimer doesn't help. Verify and cite, or flag explicitly as unverified. Ambiguity is the worst outcome. |

## Red Flags

- Writing framework-specific code without checking the docs for that version
- Saying "I think" or "I believe" about API behavior without citing a source
- Implementing a pattern without knowing which version it applies to
- Citing Stack Overflow or blog posts instead of official documentation
- Using deprecated APIs because they appear in training data
- Not reading `package.json` or equivalent before implementing
- Providing framework-specific code with no source citations
- Fetching entire documentation sites when only one page is needed

## Verification

After implementing with source-driven development:

- [ ] Framework and library versions identified from dependency files
- [ ] Official documentation fetched for framework-specific patterns
- [ ] All sources are official documentation (not blogs or training data)
- [ ] Code follows the patterns shown in the current version's docs
- [ ] Non-obvious decisions include full URL citations
- [ ] No deprecated APIs used (verified against migration guides)
- [ ] Conflicts between docs and existing code surfaced to the user
- [ ] Anything unverified is explicitly flagged as such
