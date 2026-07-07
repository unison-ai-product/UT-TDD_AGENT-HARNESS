# A-157 - local Pack artifact boundary check

- **date**: 2026-07-01
- **scope**: source HEAD `b57834d` から生成した local clean package tarball の配布境界検査。
- **boundary**: これはローカル artifact 検査であり、Pack repo への tag push、GitHub Release 更新、署名 tarball publish、PO UAT、post-release telemetry を代替しない。

## 実行

`bun src\cli.ts distribution package --tag b57834d --out <temp> --json` を実行し、生成された `b57834d.tar.gz` を一時ディレクトリへ展開して検査した。

## 結果

| item | result |
| --- | --- |
| package command | `ok=true` |
| clean repo | `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack` |
| denylist violations | `0` |
| root `skills/SKILL_MAP.md` | present |
| `docs/templates/adapter/.claude/settings.json` | present |
| `docs/templates/adapter/.codex/hooks.json` | present |
| `docs/templates/adapter/AGENTS.md` | present |
| `docs/templates/adapter/CLAUDE.md` | present |
| `src/skill-engine/` | present |
| `docs/skills` | absent |
| `docs/adr` | absent |
| `docs/design` | absent |
| `docs/test-design` | absent |
| `docs/plans` | absent |
| `.ut-tdd` runtime state | absent |
| `src/web` | absent |
| `src/skills` | absent |
| persisted db/sqlite files | `0` |
| LICENSE | MIT / `Copyright (c) 2026 UNISON-TECHNOLOGY` |

## 判定

現 HEAD の local clean artifact は、Pack 側に自己開発用の設計 docs、PLAN、test-design、ADR、runtime DB state、UI runtime、旧 `docs/skills` を混入させない。配布される skill content は root `skills/`、adapter 設定は `docs/templates/adapter/`、実装機構は `src/` として分離されている。

Pack repo 実体への反映は外部公開操作なので、この audit は「publish 前に source HEAD から生成される artifact が境界を満たす」ことだけを証明する。
