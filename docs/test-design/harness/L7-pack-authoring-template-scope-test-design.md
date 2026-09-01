---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: confirmed
plan_id: PLAN-L7-528-pack-authoring-template-scope
---

# L7 Pack authoring template scope test design

## 1. 位置付け

`PLAN-L7-528-pack-authoring-template-scope` の pair artifactとして、clean distributionの authoring
template scopeだけを検証する。docs-only pair-freeze時点では production source、test code、shared
`L7-unit-test-design.md` registry、Pack remote mutationを追加・変更しない。基準点は
`3cc0cffd`、workerは `gpt-5.6-luna` である。

## 2. 単一 inventory

テスト fixture、clean plan、materializer、tar、Pack smokeは同じ expected inventoryを入力にする。
テスト側で allowlistを複製しない。required artifactは次の6件で、teamの source pathは artifact集合に
現れてはならない。

| family | source path / glob | artifact path | count |
| --- | --- | --- | ---: |
| PLAN | `docs/templates/plan/**` | `docs/templates/plan/design/template.md`、`docs/templates/plan/impl/template.md` | 2 |
| design | `docs/templates/design/**` | `docs/templates/design/L6-function-spec-template.md` | 1 |
| state | `docs/templates/state/**` | `docs/templates/state/vmodel.json` | 1 |
| prompt | `docs/templates/prompts/**` | `docs/templates/prompts/effort-classify.md` | 1 |
| team projection (explicit) | `.ut-tdd/teams/example-review-team.yaml` | `docs/templates/team/example-review-team.yaml` | 1 |

既存 skillsは scope deltaではない。`skills/**` の `SKILL_MAP.md`、`review-checklist.yaml`、curated
skill docsを baseline setとして読み、今回の inventoryに混ぜず、artifact setから欠落していないこと
だけを確認する。

この team 行は `DD-PACKTPL-001` の固定 decision による一件の explicit projection である。
`.ut-tdd/**` を allowlist に追加せず、選択 revision の tracked blobを source として先に解決し、
出力側へ通常の clean allow/deny 検査を適用する。source path は artifact set に入らず、作業ツリー、
別 worktree、DB、Memory、環境変数への fallback は行わない。source 欠落・複数候補・symlink／escape・
destination 重複・bytes／mode drift は fail-close とする。

## 3. Candidate oracle

| candidate | 単軸変異 / 実行 | 必須 oracle |
| --- | --- | --- |
| `CANDIDATE-PACKTPL-001` | `git ls-files` を clean planへ渡し、同一 inventoryで source/artifactを解決 | 6件が各 exactly once、unknown extra/duplicate/missing は `ok=false`、skills baselineは不変 |
| `CANDIDATE-PACKTPL-002` | `distribution sync-stage --json` 相当の materializerを実行 | explicit projectionを先に解決した後、source→artifact projectionが表と一致し、UTF-8/LF、mode、content bytesが保持され、`.ut-tdd` source pathを出力しない |
| `CANDIDATE-PACKTPL-003` | materialized setをrelease materializerとdeterministic tarへ通す | tar manifest、gzip、checksum、artifact digestが同じ集合を指し、順序違い・別名・重複・暗黙補完を拒否 |
| `CANDIDATE-PACKTPL-004` | clean Pack treeだけで templateを読み、source/worktree/local Pack checkoutを除去して starterを開始 | PLAN/design/state/promptの読込と team YAML の `teamDefinitionSchema` parse が成功し、source外read/writeとremote mutationは0 |
| `CANDIDATE-PACKTPL-005` | required familyを1つずつ inventoryから除去（PLAN design、PLAN impl、design、state、prompt、team） | 対応する clean plan/materializer/tar/Pack smokeが各々 Red。別familyの存在で補完しない |
| `CANDIDATE-PACKTPL-006` | `docs/templates/**` 全体許可、または `.ut-tdd/**` 直接許可へ一軸変更 | source-only corpus、runtime state、明示 projection 外の `.ut-tdd/teams` source、unmanaged templateがartifact setへ入るため deny findingで Red |
| `CANDIDATE-PACKTPL-007` | artifact/template contentへ personal/source path、Bun実行形、legacy-HELIX command/env/pathを各1軸注入 | 対応 markerだけを typed denyし、他の正常templateの parse/bytesを混同しない。vmodelの歴史的 metadata文字列は実行経路でない限り誤検出しない |

## 4. deny matrix

全 candidateは、最終 output tree、materialized entries、tar manifest/content、Pack-only smokeの各面で
次の集合を照合する。

| deny class | 例 | oracle |
| --- | --- | --- |
| source-only | `docs/plans/**`、`docs/design/harness/**`、`docs/test-design/**`、source audit corpus | artifact pathに0件、直接許可 mutationは Red |
| runtime state | `.ut-tdd/**`（team sourceを含む） | source pathは0件、許可されるのは選択 revisionから明示 projectionされた `docs/templates/team/example-review-team.yaml` の一件 |
| personal/source path | personal absolute、home/Temp/OneDrive、source checkout、local Pack checkout、shell home variable | content/manifest/commandに到達せず typed deny |
| Bun | `bun`/`bunx`、shebang、install/setup action、Bun command | authoring assetとPack smokeの実行面で0件、各単軸復活は Red |
| legacy-HELIX | legacy runtime command/env、`pmo-helix-*`、source-derived runtime path | executable/env/path形は Red。単なる歴史的 provenance文字列を実行経路と扱わない |

## 5. skillsとteam schema

skillsの既存81 tracked filesは今回の変更対象ではなく、clean planで従来どおり出力される baseline
として検査する。`SKILL_MAP.md` と `review-checklist.yaml` から参照される authoring template pathは
inventory内で解決できることを確認する。

projected team YAMLは source `.ut-tdd/teams/example-review-team.yaml` を直接配布せず、選択 revisionの
tracked blobから固定 mapで `docs/templates/team/example-review-team.yaml` として parseする。`name`、`strategy`、serialization、
member role/engine/task/依存順序が現行 `teamDefinitionSchema` と role/engine registryに適合し、
source `.ut-tdd` pathへの fallbackを要求しないことを oracleにする。任意の追加 team sourceはこの
sliceの inventory外であり、直接 allow へ変異させた場合は deny finding を返す。

### 5.1 Scope decision record

`DD-PACKTPL-001` (2026-09-01) は、#482 の scope-audit で追加された team sample を required 6件目として
保持する設計判断である。runtime state全体を配布するのではなく、source path／destination pathを一対一で
固定した read-only projection とし、implementation PRに新しい投影方式や任意 catalogを持ち込まない。

advisor合意形成は `claude-fable-5` / effort `low` / decision `design` で
`2026-09-01T10:32:35Z` に実行した（session log:
`.ut-tdd/logs/session/advisor-claude-1788258711530.jsonl`）。推奨は案B（選択revisionのtracked
blob一件から固定destinationへ投影）で、案A（`.ut-tdd/**`全体allow）は却下、案C（sample非採用）は
案Bをfreezeできない場合のfallbackとされた。本設計は案Bを採用し、明示map、pinned blob、source解決
→output deny、content scan、drift検知を実装前提として固定する。採用blobの実測は mode `100644`、
UTF-8 bytes `977`、secret-like／個人path／OneDrive／Bun／legacy-HELIX／email marker 0である。

## 6. 実装後の検証接続

実装 PR では各 candidateを `U-PACKTPL-*` へ同番号で昇格し、実テストの証拠 path、exact PLAN revision、
exact HEAD、Linux/Windows結果を記録する。必要な commandは次の順で同一 revisionへ束縛する。

1. clean plan / inventory lint
2. materializerとPack staging smoke
3. deterministic tar / manifest / checksum smoke
4. Pack-only authoring smoke（source/worktree/local Pack checkoutなし）
5. Node/npm targeted test、typecheck、Biome、PLAN/document lint、required CI

publication、version、remote Pack write、source `build`、legacy runtimeの削除はこの test designの
受入対象ではない。
