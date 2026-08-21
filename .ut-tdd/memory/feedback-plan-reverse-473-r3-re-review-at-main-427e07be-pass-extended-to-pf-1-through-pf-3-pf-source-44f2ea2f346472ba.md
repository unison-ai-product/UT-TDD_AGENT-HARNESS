---
memory_id: memory:feedback:plan-reverse-473-r3-re-review-at-main-427e07be-pass-extended-to-pf-1-through-pf-3-pf-sources-unchanged-since-the-prior-review
kind: feedback
title: "PLAN-REVERSE-473 R3 re-review at main 427e07be: PASS extended to PF-1 through PF-3, PF sources unchanged since the prior review"
tags: ["pass", "plan-reverse-473", "r3", "release-pipeline", "review"]
updated_at: 2026-08-19T09:35:53.196Z
---

PLAN-REVERSE-473 R3 aggregate review (再検収) exact main HEAD 427e07beb39700fc590097e7688b3231f3fe999a: R3 PASS (blocking 0 / advisory 3)。前回 21c4e03d の R3 PASS を PF-1〜PF-3 まで対象を広げて再導出し維持した。旧依頼 (21c4e03d / 39846e9) は本判定が supersede する。

base 差分の実測: git diff --stat 21c4e03d 427e07be -- src/setup/release-*.ts src/schema/release-*.ts tests/release-*.test.ts は差分なし。PF stack のソースは前回検収時点から不変。間の main 変更は #339 (D3a custody: src/feedback/* / src/cli/delegation.ts / src/runtime/review-guard.ts) と #340 (docs のみ) で release pipeline と交差しない。

PF 構成: PF-1 = src/schema/release-manifest.ts (PLAN-L7-479 confirmed) / PF-2 = src/setup/release-materializer.ts (PLAN-L7-486 confirmed) / PF-3 = src/setup/release-artifact-resolver.ts / PF-4 = release-channel-adapter.ts / PF-5 = release-aggregate-admission.ts。

PF-1 の重要事実: createImmutableManifest が calculateReleaseId(materializerVersion, artifactSourceCommit, artifactSetDigest) !== releaseId なら null を返す。manifest の key が content 由来の再計算値と一致しない manifest は parse 段階で拒否される = digest identity が最上流で content-derived identity として閉じている。これは advisory A-1 (aggregate が adapter の status を信頼) の実害を下げ、A-1 を blocking に上げない根拠になる。加えて channels の全 target が releases に実在すること、hasCompleteChannelOrder、Object.create(null) + Object.freeze による prototype 汚染と後段改変の封じ込め、typed failure (invalid_manifest / unknown_channel)。

PF-2 の重要事実: materializeReleaseArtifacts に writeFile/mkdir/rm 系が存在せず純関数。materialize 段階で destination を触らないため非破壊性が構造的に成立。digest は frame() が entry ごとに path 長 (UInt32BE) + path + mode 長 (UInt32BE) + mode + content 長 (BigUInt64BE) + content を連結してから sha256 を取る長さ前置フレーミングで、境界衝突を構造的に排除。entries は Buffer.compare による path バイト順ソート後に framing するため入力順序に依らず digest が一意。mode は 100644/100755/120000 の allowlist、symlink は validSymlink、package.json のみ transform で失敗は invalid_artifact。

PF-3: GitProcessRunner / LocalGitObjectReader が interface として切られ実 git 実行が注入点。resolver 自身は結果を Object.freeze。

残 advisory (carry、backprop 先 PF-5): A-1 attested variant の型が expectedDigest と actualDigest の等値を保証しない (PF-1 の content-derived identity で実害低下、ただし aggregate 境界の 1 行再検査は二重化の価値あり)。A-2 applyDestination 成功後の discardStaging 失敗で restore 成功時は成功 publish が巻き戻り applied: 0 になる (未テスト、#336 の custody 契約と方針が逆で harness 内に 2 系統)。A-3 fault 総当たりに snapshotDestination 境界が含まれない。

R4 の L6 合流単位 5 件: (1) manifest の canonical 構造と content-derived releaseId、(2) channel 解決規則、(3) digest framing 契約 (長さ前置 + path バイト順ソート)、(4) control/artifact allowlist 分離、(5) apply の 3 状態と typed failure および snapshot 不変性要件。Forward routing 残作業は PLAN-REVERSE-473 (draft) の R4 完了と confirm、PLAN-L7-473 側の参照更新。
