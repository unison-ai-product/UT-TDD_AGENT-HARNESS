# A-154 - ワークフロー・駆動モデル・telemetry substance 統合監査

- **date**: 2026-06-30
- **source**: PO / ClaudeCode 追加独立所見、Codex による現 HEAD 再確認
- **scope**: ワークフロー定義、駆動モデル体系、DB 登録/telemetry provenance、既存 A-150/A-152 との整合
- **boundary**: ローカル監査記録。公開 GitHub repo、tag push、署名 tarball、実 consumer install/UAT は含まない。

## 判定

ワークフロー定義と駆動モデルの骨格は適正。L0-L14 の成果物/V-pair、左腕/右腕の設計、Forward への出口収束、doctor gate 群は強い。

ただし、今回の所見は A-150 の主題である `projection != substance` を再確認した。特に弱いのは次の三点である。

1. presence/構造を証明する gate と、実 runtime provenance を証明する gate が混在している。
2. 駆動モデルは出口収束が強い一方、入口の signal -> mode / route 選択 certificate はまだ全 PLAN 強制ではない。
3. DB telemetry は genuine な `hook_events` backbone を持つが、能力の実動作を名乗る table は runtime row と projection row の区別が必要である。

## 現 HEAD 再確認

2026-07-01 の現 HEAD で次を確認した。

| check | result | interpretation |
| --- | --- | --- |
| `bun src\cli.ts status --json` | `nonTerminalPlansTotal=7`, `versionUpParked=7`, `activeDraftTotal=0`, `openDefers=0` | 非終端は future/version-up park。active draft は無い。 |
| `bun src\cli.ts doctor --strict-telemetry-provenance` | pass | strict telemetry provenance gate は現 DB 状態で green。 |
| `bun src\cli.ts doctor --strict-green-command-digest` | pass after A-155 correction | 130 件 / 56 PLAN の stale digest mismatch は、full green rerun 後に 131 entries / 57 PLAN files の rerun-bound rebind として 0 件に解消。 |
| `bun src\cli.ts feedback list --emit` | `total=1803`, `gate=0`, `actionable=0`, `telemetry=1803` | A-155 を PLAN-L3-05 generates と L14 required evidence に束ね、prior red artifact は `progress artifacts --color red --json` = `[]` まで解消。 |

## 追加所見の統合

| id | severity | area | finding | disposition |
| --- | --- | --- | --- | --- |
| A154-01 | medium-high | workflow coverage | ワークフロー定義は標準 grounding と V-pair が強いが、coverage gate は body presence / drift 検査中心で、本文 substance を常に読むわけではない。 | A-150/A-152 と整合。`frontend-design-coverage` は `body present 6 / pending 0` まで回復済み。FE 右腕 L8/L9/L11/L12/L14 の population/substance は dogfood backlog として残す。 |
| A154-02 | medium | workflow coverage | FE 左腕の未充足は過去所見として正しいが、現 HEAD では L3/L5/L6 FE body は存在する。 | 現在の blocker ではない。今後の課題は present body の実質評価と FE 右腕検証設計の増強。 |
| A154-03 | medium | drive model | 駆動モデルの出口収束は強い。`pair-freeze`、`forward-convergence`、`backfill-pairing`、`drive-model-passage` が孤児/未集約を捕捉する。 | local close の強い根拠として扱う。 |
| A154-04 | medium | drive model | `drive-model-passage` は certificate 構造を検査するが、全 historical instance の実体吸収を直接再演するものではない。 | A-150-07 の residual として維持。出口 gate は強いが、certificate と実体収束の差を明記する。 |
| A154-05 | medium | drive model | signal -> mode auto-routing と route selection は advisory/certificate 側の穴が残る。 | Remediated locally for future authoring: 2026-07-01 以降の non-archived PLAN は `route_signal` / `route_mode` が必須になり、`routeSignalCandidates(route_signal)` と不一致なら `plan-governance` が fail-close する。既存 PLAN は遡及 backfill しない。 |
| A154-06 | high | DB telemetry | `hook_events` は genuine runtime telemetry。`skill_invocations` / `test_runs` / `guardrail_decisions` / `model_runs` は runtime row と projection row を分けないと、populated だけでは能力実動作を主張できない。 | `--strict-telemetry-provenance` が fail-close surface として実装済みで現 HEAD pass。通常 `db rebuild` だけで runtime capture close を主張しない。 |
| A154-07 | high | green evidence | digest equality は command rerun の証明ではない。 | A-155 で `typecheck`、`lint`、全回帰、DB rebuild を再実行し、131 件 / 57 PLAN files の stale digest を同一 packet で rebind 済み。今後も hash-only restamp は禁止。 |
| A154-08 | medium | distribution | 配布 adapter / PATH / guard / clean curation の既出所見は A-150/A-152 で現 disposition 済み。 | local package readiness は構造 green。実 consumer hook firing、tag-pin install/update、rollback/update は publication 後の external smoke。 |

## judge 結論

ローカル閉鎖としては合格圏である。ただし、これは「配布 OS が出荷済み」ではない。

- **local close**: doctor、workflow、coverage、drive-model exit convergence、strict telemetry provenance、feedback gate/actionable 0 は green。
- **strict evidence close**: `green-command-digest` は A-155 の rerun-bound rebind 後に green。hash-only restamp ではなく command rerun と同一 packet で束ねた。
- **release/UAT close**: clean GitHub repo、tag push、署名 tarball、published artifact install、実 consumer hook firing、rollback/update、UAT は external/human required。

## 次アクション

1. FE 右腕 L8/L9/L11/L12/L14 の verification substance を別 PLAN で population する。
2. 公開後に consumer install / hook firing / rollback-update / tag-pin smoke を実行する。
