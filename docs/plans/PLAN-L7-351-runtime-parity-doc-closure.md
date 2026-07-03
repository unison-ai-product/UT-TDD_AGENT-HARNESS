---
plan_id: PLAN-L7-351-runtime-parity-doc-closure
title: "PLAN-L7-351 (impl): ランタイム対称性の doc/検証クローズ — allowlist 転記 / scope boundary 運用ガイド / agent-memory 方針 / spawn_agent payload fixture"
kind: impl
layer: L7
drive: be
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 + agent-memory 方針 (全 runtime Read 可 vs Claude 専用宣言) の決定"
  - role: tl
    slot_label: "TL - allowlist 転記の正本化方式 (直書き vs policy.ts 参照) レビュー"
  - role: se
    slot_label: "SE - doc 追記 + payload fixture test"
generates:
  - artifact_path: docs/plans/PLAN-L7-351-runtime-parity-doc-closure.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-183-runtime-parity-vendor-lessons-audit-2026-07-03.md
    - docs/plans/PLAN-L7-139-codex-hook-adapter.md
---

# PLAN-L7-351 (impl): ランタイム対称性の doc/検証クローズ

## Status

**version-up parked (v2)**。A-183 所見 PY-3/PY-4/PY-5/PY-7 (LENS-PY の未起票残差の一括クローズ — いずれも小粒 doc/test)。PO 指示 2026-07-03。PY-2 (effort 注入) は L7-255 スコープ追記側、PY-1/8 は L7-258 既存でカバー — 本 PLAN に含めない (重複禁止)。

## 背景 (A-183 §2)

- **PY-5**: subagent allowlist 19 種が `.claude/CLAUDE.md` のみに記載 — Codex 側 (AGENTS.md) から「spawn_agent にどの名前を渡せば通るか」を確認できず、block の原因調査が困難。
- **PY-3**: Codex hosted/API surface で hooks 非発火 (意図的 scope boundary) の代替手順が AGENTS.md に 1 文のみ。
- **PY-4**: `.claude/agent-memory/` (9 agent 分) の Codex からの扱い (Read 可否・書込経路) が無宣言。
- **PY-7**: Codex spawn_agent の実 payload が agent-guard の識別子解決順 (subagent_type/agent_type/agent/role/name) と一致するか実機未検証 — 不一致時は fail-close で「理由不明 block」。

## スコープ (1 要件: parity の doc 非対称と未検証点をクローズする)

1. **allowlist 転記** (PY-5): 正本は `agent-guard-policy.ts` — AGENTS.md へ一覧を転記し「正本はコード」の参照行を付ける。rule-drift の marker に allowlist 節を追加するかは TL 判断。
2. **scope boundary 運用ガイド** (PY-3): AGENTS.md §Hooks へ「hosted/API 利用時は hook 非発火 — 着手前 `git status` + `ut-tdd review --uncommitted` を必須手順とする」を追記。
3. **agent-memory 方針宣言** (PY-4、PO slot): 案 A「git 追跡ファイルとして全 runtime Read 可・書込は Claude のみ」を明文化 / 案 B「Claude 専用」と宣言。どちらでも doc 1 節。
4. **payload fixture** (PY-7): Codex 実機の spawn_agent payload を 1 回捕捉し、tests/agent-guard.test.ts に Codex 実形ケースを追加 (L7-311 の vendor fixture 再捕捉と同根 — fixture の置き場を共有)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | agent-memory 方針の PO 決定 | 直列 (先行) |
| 2 | doc 追記 3 点 (allowlist / scope boundary / memory 方針) | **並列可** |
| 3 | Codex payload 捕捉 + fixture test | 直列 (実機作業) |

## DoD

- [ ] AGENTS.md から allowlist と正本参照が読める
- [ ] agent-guard tests に Codex 実 payload 形のケースが存在し green
- [ ] rule-drift / codex-hook-adapter doctor green
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- payload 捕捉は Codex セッション側の作業が自然 (Codex routing 推奨)。捕捉した payload はそのまま fixture へ (secret 検査を通す)。
- 活性化時 kind は impl のまま or add-impl 昇格を §6 手順で判断。
