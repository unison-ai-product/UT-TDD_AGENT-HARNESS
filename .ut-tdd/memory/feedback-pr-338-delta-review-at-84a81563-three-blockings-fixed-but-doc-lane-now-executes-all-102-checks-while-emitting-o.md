---
memory_id: memory:feedback:pr-338-delta-review-at-84a81563-three-blockings-fixed-but-doc-lane-now-executes-all-102-checks-while-emitting-only-4-killing-the-plan-objective
kind: feedback
title: "PR 338 delta review at 84a81563: three blockings fixed but doc lane now executes all 102 checks while emitting only 4, killing the PLAN objective"
tags: ["ci-cost", "doctor", "issue-314", "plan-l7-455", "pr-338", "review"]
updated_at: 2026-08-19T06:34:44.043Z
---

PR #338 exact HEAD 84a81563c5713d6302e0a61574362aa1ac4a9622 に対する Claude non-author delta review: FLAG (blocking 1)。CI 走行中だが、下記は exact HEAD を checkout した worktree での実測で確定しており、この状態では U-CIPOL-027 自身が落ちるため 3 job green にはならない。

事務連絡: 依頼本文の exact HEAD 84a81563c1b8f8de7afee5f52a290cde72064f3e は repo に存在しない object (git cat-file -t が could not get object info)。実 HEAD は 84a81563c5713d6302e0a61574362aa1ac4a9622 で先頭 8 桁のみ一致する別 SHA。レビューは実 HEAD に対して実施した。

解消 3 件: B-1 = head_snapshot 18→20 へ更新、PLAN-L7-421 の所有を侵さず generates に足していない点も正しい。B-2 = selectDoctorCheckDefinitions の第 3 引数 optional 化により 2 引数呼び出しが registry 定義順へ復旧、実測 select(full)==definitions order は true。B-3 の順序意図と B-4 = checkIds: [...outputIds] 一本化で checks/checkIds の二重正本が解消。

blocking B-3' (新規・重大) = doc lane が全 102 検査を実行するようになった。collectDoctorCheckRun が selectDoctorCheckDefinitions(definitions, scope) を第 3 引数なしで呼ぶよう変更されたため、選択集合が profile.outputIds (4 件) ではなく doctorOutputIdsForScope(scope) になる。source-doc-lane の scope は "full" なので 102 件が選択・実行される。実測: declared outputIds 4 / scope full / EXECUTED 102 / U-CIPOL-027 timings 期待 4 (rule-drift, readability, runtime-readability, secret-scan)。envelope には 4 件しか出ないが実行は 102 件で、PLAN-L7-455 の目的 (CI コスト削減) と AC が消える。コストは満額のまま見た目だけ絞られる最悪形。さらに今回追加された run.timings の assertion が 4 件を期待するので自 PR のテストが落ちる。

最小是正 (collectDoctorCheckRun 側のみ、selectDoctorCheckDefinitions の署名は現状のままでよい):
const outputIdSet = new Set(outputIds);
const selectedDefinitions = buildFullDoctorCheckDefinitions(deps, options).filter(
  (definition) => definition.profiles.includes(scope) && outputIdSet.has(definition.id),
);
これで実行集合 = 宣言 outputIds のみ (doc lane 4 件、目的と AC を回復)、実行順 = registry 定義順 (U-CIPOL-027 の timings assertion と完全一致)、envelope = 宣言順 (変更不要)、full lane は outputIds が FULL_DOCTOR_OUTPUT_IDS なので従来どおり 102 件・定義順で B-2 の復旧を壊さない、が同時に成立する。

教訓: 「envelope を絞る」ことと「実行を絞る」ことは別の契約であり、順序問題の是正で選択集合の引数を落とすと、出力だけ絞られて実行コストが満額残る。コスト削減が目的の PLAN では、envelope の件数ではなく実行件数を oracle にする必要がある。
