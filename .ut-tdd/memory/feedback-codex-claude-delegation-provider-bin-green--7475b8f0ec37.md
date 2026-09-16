---
memory_id: memory:feedback:codex-claude-delegation-provider-bin-green--7475b8f0ec37
kind: feedback
title: "codex/claude delegationを経由するテストはprovider binをスタブしないと開発機でだけgreenになる"
tags: ["ci-flakiness", "delegation", "testing"]
updated_at: 2026-09-16T11:13:35.693Z
---

ut-tdd codex|claudeのdelegationコマンドをin-processで叩く単体テストは、書き方を誤ると開発機でだけgreenになる。detectMode()はcodex/claudeを実spawnし(isProviderCommandSpawnableが<bin> --versionをspawnSyncしexit 0を要求)、provider CLIが無い機械ではmode=standaloneになり、providerAvailable()がfalseを返す。この状態でdelegationのactionはstderrへ落ちてstdoutへ何も書かないため、空stdoutをJSON.parseに渡すとSyntaxErrorになり真因(provider不在)が隠れる。delegation/mode検出を経路に含むテストでは、UT_TDD_CODEX_BIN (または UT_TDD_CLAUDE_BIN) へexit 0のスタブを差してmodeを機械非依存に固定する。単体テストの中で外部AI CLIを実起動させないのが一般則であり、ローカルgreenとCI redが食い違ったら、まず自分のテストが環境に依存していないかを疑う。
