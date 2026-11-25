---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_session_start_project_identity_read
pair_artifact: docs/test-design/harness/L7-session-start-project-identity-read-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1938
---

# SessionStart の project identity 読取 (Issue #1938)

> **L6 contract marker**: `resolveProjectMemoryRootWithPorts(repoRoot, ports) => ProjectMemoryRootResult` の読取回数と再検証を、L7 の U-PMEMROOT-010・011 で検証する。

[Memory の canonical root 契約](memory.md#canonical-memory-root-resolver-の配置-issue-963)を補う。

## 1. 一回の root 解決の境界

| 条件 | 契約 |
| --- | --- |
| Pre | Git topology から取得した current root と canonical root を実パスに解決し、既存のディレクトリ検査に通った場合に identity 読取へ進む。 |
| Post | 同じ実パスでは identity 読取は1回、異なる実パスでは各1回。検証済みの ID が一致した場合にだけ、既存のパス検査を経て root と namespace を返す。欠落・不一致には従来の typed deny を返す。 |
| Invariant | 次の root 解決では topology と identity を読み直す。各解決の作業ツリーと origin の検証、パス逸脱の拒否、SessionStart の順序を維持する。 |

project-memory root を解決するたびに、Git topology から current worktree と canonical
project root を求め、既存のディレクトリ検査を行う。両 root の `realpath` 結果が文字列として
一致した場合は、既存の HEAD identity loader をその実ディレクトリに対して一度だけ実行し、
その結果を同じ解決の両側で使う。異なる実パスでは従来どおり current と canonical の
HEAD identity を別々に読み、両方が有効で一致した場合にだけ採用する。

読取結果の有効範囲は一回の root 解決。次の解決では topology と HEAD identity を改めて読み、
SessionStart の Memory 読取、inbox 復旧、復旧後の要約の間でも結果を持ち越さない。
HEAD と作業ツリー、origin の検証は既存 loader が担当する。root の symlink / escape 検査、
typed deny、エラー時の各呼び出し元の扱い、Memory と inbox の保存先は従来の契約に従う。

SessionStart は既存の event append と後続処理の順序、同期処理、設定の 30 秒を維持する。
digest の PR 検査と inbox 復旧の GitHub 呼び出しは別の契約で扱う。
[Issue #1938 の進行判断](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/1938#issuecomment-7126608255)
