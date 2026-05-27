# UT-TDD リポジトリ構成ルール (Repository Structure)

- **Status**: accepted
- **Date**: 2026-05-27
- **正本**: 本書がリポジトリ配置の **canonical 正本**。`requirements_v1.2 §9.1`（Phase 0 存在チェック）と `CLAUDE.md` のディレクトリ節は本書を参照する。
- **前提**: ADR-001（harness 実装 = TypeScript/Bun、HELIX は概念のみ）/ V-model 4 artifact（concept v3.1 §2.3）。

## 1. canonical ツリー

```text
UT-TDD-agent-harness/
├── CLAUDE.md                     # Claude Code project context (正本ナビ)
├── AGENTS.md                     # Codex CLI project rules
├── package.json                  # Node/Bun 依存 + scripts
├── tsconfig.json                 # TypeScript strict
├── bun.lock                      # Bun lockfile (tracked)
├── .gitattributes                # 改行正規化 (eol=lf、*.ps1 は crlf)
├── .gitignore
│
├── src/                          # ★ harness TS core (実装 = ② 実装コード)
│   ├── cli.ts                    #   エントリ (commander)
│   ├── schema/                   #   zod 単一正本 (enum / 契約。drift を型で抑止)
│   ├── plan/                     #   plan lint / validator
│   ├── vmodel/                   #   V-model 4 artifact trace
│   ├── runtime/                  #   mode 検出 (standalone/claude-only/codex-only/hybrid) / orchestration
│   └── doctor/                   #   統合検証 / 横断検出
├── tests/                        # ★ ④ テストコード (vitest、*.test.ts、src を mirror)
├── scripts/                      # ★ 薄い OS entrypoint のみ (core logic を置かない)
│   ├── ut-tdd                    #   POSIX / Git Bash
│   ├── ut-tdd.ps1                #   Windows PowerShell
│   └── install-hooks.{sh,ps1}    #   [予定] hook installer
│
├── docs/
│   ├── governance/               # ★ 現行正本 (本書群)
│   │   ├── README.md             #   正本 / 参照 / archive 境界
│   │   ├── ut-tdd-agent-harness-concept_v3.1.md       # 構想 (① 概念)
│   │   ├── ut-tdd-agent-harness-requirements_v1.2.md  # 要件 / 受入条件
│   │   ├── ut-tdd-agent-harness-extraction-plan_v0.1.md
│   │   └── repository-structure.md                    # 本書 (構成正本)
│   ├── adr/                      # ADR-NNN-slug.md (決定記録)
│   ├── design/                   # [予定] ① 設計 doc (D-API/D-DB 等)
│   ├── test-design/              # [予定] ③ テスト設計 doc
│   ├── skills/                   # [予定] UT-TDD 正本化 skill doc
│   ├── plans/                    # PLAN-NNN-slug.md (実装計画)
│   ├── templates/                # PLAN / prompt / state テンプレ
│   ├── migration/                # HELIX→UT-TDD 移行資料 (porting-map 等。code-port 部は ADR-001 で superseded)
│   ├── handover/                 # セッション handover
│   ├── memory/                   # 運用メモ
│   └── archive/                  # 旧版・superseded (正本ではない)
│
├── .claude/                      # Claude Code runtime / hook policy
│   ├── CLAUDE.md                 #   runtime / hook 方針
│   ├── settings.json             #   現状 hooks:{} の安全設定
│   ├── agents/                   #   subagent 定義 (code-reviewer 等)
│   └── hooks/                    #   hook script
│
├── .ut-tdd/                      # ★ UT-TDD runtime state (大半 gitignored)
│   ├── state/                    #   runtime.json 等 (generated、.gitkeep のみ tracked)
│   ├── audit/                    #   failure_log / escalation (gitignored、CI artifact が team 正本)
│   ├── cache/                    #   (.gitkeep のみ tracked)
│   ├── handover/                 #   CURRENT.* (gitignored)
│   ├── teams/                    #   teams/*.yaml (local* は gitignored)
│   └── adapters/                 #   optional adapter 設定 (local* は gitignored)
│
├── .github/                      # [予定] workflows/harness-check.yml (Required Status Check)
│
├── vendor/
│   └── helix-source/             # ★ HELIX 移植元 snapshot (read-only、直接編集禁止)
│
└── .helix/                       # HELIX 由来 legacy state (gitignored、正本にしない)
```

`★` = 配置ルールが特に重要な領域。`[予定]` = 後続 PLAN で作成。

## 2. 配置ルール (どこに何を置くか)

| 対象 | 置き場 | ルール |
|------|--------|--------|
| harness TS core | `src/<domain>/` | domain 別 (cli/schema/plan/vmodel/runtime/doctor)。**bash / Python を core に置かない** (ADR-001) |
| テストコード | `tests/` | vitest、`*.test.ts`、src を mirror |
| OS entrypoint | `scripts/` | **薄い wrapper のみ**。compiled binary or `bun run` を呼ぶだけで、core logic を持たない |
| enum / 契約 | `src/schema/` | **zod 単一正本**。enum を複数箇所に再定義しない (drift 防止、requirements §1.10 F) |
| 現行正本 doc | `docs/governance/` | concept v3.1 / requirements v1.2 / README / extraction-plan / 本書 |
| 決定記録 | `docs/adr/` | `ADR-NNN-slug.md` |
| 実装計画 | `docs/plans/` | `PLAN-NNN-slug.md`。superseded は `status: archived` |
| 移行資料 | `docs/migration/` | HELIX 能力参照。code-port 計画は ADR-001 で superseded |
| runtime state | `.ut-tdd/` | generated。**docs 目的で追跡しない** (CLAUDE.md 禁止事項) |
| 移植元 | `vendor/helix-source/` | **read-only**。概念のみ参照、コードは port しない・直接編集しない |

## 3. V-model 4 artifact の配置 (中核ルール、concept v3.1 §2.3)

4 artifact は**別物として別ディレクトリ**に置き、双方向 trace で結ぶ（混在禁止）。

| artifact | 置き場 |
|----------|--------|
| ① 設計 (文書) | `docs/design/` |
| ② 実装コード | `src/` |
| ③ テスト設計 (文書) | `docs/test-design/` |
| ④ テストコード | `tests/` |

## 4. 命名規約

- PLAN: `docs/plans/PLAN-NNN-slug.md` / ADR: `docs/adr/ADR-NNN-slug.md`
- TS source: `src/<domain>/<name>.ts` / test: `tests/<name>.test.ts`
- テスト設計: `docs/test-design/<feature>/<...>-test-design.md`
- ファイル名は英語（日本語ファイル名は Windows 文字化け回避のため禁止）

## 5. tracked / gitignored

- **gitignored**: `node_modules/` `dist/` `*.tsbuildinfo` `coverage/` / `.ut-tdd/` runtime state (state/audit/cache/handover/CURRENT、local*) / `.helix/` / `__pycache__` / `docs/plans/*.lock` / `CLAUDE.local.md` `AGENTS.override.md` `.claude/settings.local.json` / secret 系 (`.env*` `*.key` `*.pem` `credentials.json`)
- **tracked**: `src/` `tests/` `docs/` (archive 含む) `scripts/` `package.json` `tsconfig.json` `bun.lock` `.gitattributes` `vendor/helix-source/`

## 6. 境界

- **正本**: `docs/governance/*` + `docs/adr/*` + `src/` (TS core)。
- **read-only**: `vendor/helix-source/`（概念参照のみ）。
- **generated / 非正本**: `.ut-tdd/state` `dist/` `node_modules/` `.helix/`。
- **historical**: `docs/archive/`（旧版）/ `docs/migration/`（移行資料、code-port 部は superseded）。

## 7. 禁止事項

- `src/` core に bash / Python を持ち込まない（ADR-001。OS 差は `scripts/` の薄い wrapper に閉じる）。
- enum / 契約を `src/schema/` 以外で再定義しない。
- `vendor/helix-source/` を直接編集しない（移植は UT-TDD 所有パスへ概念から再実装）。
- `.ut-tdd/` runtime state を docs 目的で Git 追跡しない。
- 日本語ファイル名を使わない。
