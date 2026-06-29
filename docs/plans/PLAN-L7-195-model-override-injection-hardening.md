---
plan_id: PLAN-L7-195-model-override-injection-hardening
title: "PLAN-L7-195 (impl): model override injection hardening (Security) — modelOverrideSchema の prefix-only 検証を厳格化し、runtime adapter の .cmd launch の shell:true 経路を引数配列 spawn(shell 無効)へ。不正 model 文字列(shell metachar)を reject する injection regression test。A-144/A-145 SEC-2"
kind: impl
layer: L7
drive: be
status: draft
version_target: future
created: 2026-06-29
updated: 2026-06-29
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L6-function-design/agent-slots.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE (Codex 委譲) — modelOverrideSchema を厳格 validation 化、adapter の shell:true を引数配列 spawn へ、injection regression test"
  - role: qa
    slot_label: "security-audit (Claude cross-runtime judge、必須) — injection 面・shell 無効化・既存正当 model 互換を OWASP 視点で検証。security 変更ゆえ別 runtime judge を front-load"
generates:
  - artifact_path: docs/plans/PLAN-L7-195-model-override-injection-hardening.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-160-runtime-adapter-policy-extraction.md
  references:
    - .ut-tdd/audit/A-145-02-runtime-config-delegation.md
    - .ut-tdd/audit/A-144-02-runtime-config-security.md
---

# PLAN-L7-195 (impl): model override injection hardening (Security)

## 優先度: version-up parked だが Security ゆえ前倒し推奨 (PO 2026-06-29)

PO 決定 (2026-06-29): 既定は将来版へ保全 (`status=draft` + `version_target: future`)。
**ただし唯一の Security HIGH かつ creator 未着手**ゆえ、PM は **parking でなく現行クローズへ前倒し**を推奨。
activation 判断は PO。

> escalation 記録: 本 PLAN は security 隣接 (injection 面) のため、CLAUDE.md「auth/security 変更は escalate」に
> 従い**起票時点で PO へ明示**。実装着手・activation は PO 承認後。

## 0. 前提 (調査結論 2026-06-29)

- `src/schema/team.ts:37` `modelOverrideSchema` = `/^(gpt-|claude-|codex-)/.test(model)` の **prefix-only**。
  prefix さえ合えば任意後続文字列を許す (shell metachar・path 等を含み得る)。
- `src/runtime/adapter.ts:273` が `.cmd` launch で `shell: true` を使用。shell 経由起動のため、検証を抜けた
  model/引数文字列が **shell injection** の余地を持つ。
- A-145-02 / A-144-02 (SEC-2) で **HIGH/Security** と判定。今回の監査範囲で唯一の security finding、
  かつ creator (Codex) は本面に未着手。

## 1. Scope

### IN (本 PLAN)
- `modelOverrideSchema` を **厳格 validation** 化: prefix-only を脱し、既知 model 集合 or 厳格な文字種制約
  (例 `^[a-z0-9][a-z0-9.\-]*$` + 既知 family allowlist) へ。shell metachar を構造的に排除。
- runtime adapter の `.cmd` launch を **`shell: true` から引数配列 spawn (shell 無効)** へ。シェル解釈を経由しない。
- **injection regression test**: shell metachar (`; | & $ \` 等) を含む model/引数が reject / 無害化される
  ことを実証 (prose でなく test)。

### OUT (本 PLAN では作らない)
- 認証 / 認可 / payment / 外部 API 前提の変更 (該当せず、本 PLAN は入力 validation と spawn 安全化のみ)。
- model family の方針変更 (既存正当値 `gpt-` / `claude-` / `codex-` は通す)。
- いま実装すること (version-up parked。ただし Security ゆえ前倒し推奨)。

## 2. Acceptance Criteria
- shell metachar を含む不正 model 文字列が validation で **reject** される unit test green。
- `.cmd` launch が **shell 無効 spawn** で実行され、引数が shell 解釈されない test green。
- 既存正当 model (`gpt-*` / `claude-*` / `codex-*`) は従来どおり起動できる (互換維持 test)。
- **security-audit (別 runtime judge) の VERDICT=pass、Critical=0** を confirmed 前に記録 (hybrid 判断分離)。
- doctor / lint / vitest / plan lint green。

## 3. Schedule
- mode: serial。
- Step 0: injection 面の再現 (prefix-only を抜ける文字列 + shell:true 経路) を test で固定。
- Step 1: `modelOverrideSchema` 厳格化 (allowlist / 文字種) + adapter の shell 無効 spawn 化。
- Step 2: injection regression + 既存互換 test。
- Step 3: **security-audit (Claude cross-runtime) judge** → Critical 0 → review evidence → PO 承認 → confirmed。

## 4. 壊さない / 再発させない
- 既存正当 model の起動を壊さない (互換 test で保証)。
- Security 変更ゆえ **別 runtime judge (security-audit) を front-load** (creation≠judgement、hybrid 分離)。
- escalation: security 隣接ゆえ PO 承認後に着手・activation ([[feedback_cross_review_before_po_escalation]])。
- version-up parked だが Security ゆえ前倒し推奨。
