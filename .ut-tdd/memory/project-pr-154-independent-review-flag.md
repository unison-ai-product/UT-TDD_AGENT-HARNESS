---
memory_id: memory:project:pr-154-independent-review-flag
kind: project
title: "PR #154 independent claim review: FLAG"
tags: ["pr-154", "claim-review", "flag", "node", "design"]
updated_at: 2026-07-24T12:45:00.000+09:00
---

PR #154の独立claim reviewはFLAG。PASS証拠として扱わない。

検出した設計欠落:

1. 現行mainのBun実体とtarget Nodeを同じ現在形で記述していた。
2. D0の候補oracleを正式`U-NODEBOOT-*`として表示していた。
3. npmのversion自己申告に対するreview済みexpected identity sourceとsame-version substitute oracleが不足していた。
4. generation pointerのPOSIX/Windows別atomic・durability・rollback・cleanup ownershipが未確定だった。
5. Issue #153に原子slice別gate条件が記録されていなかった。

このmemoryはreview verdictの履歴であり、修正commit、再review、PASSを代替しない。

## Second review FLAG

初回修正後も次の3件が残存したため、verdictはFLAGのまま維持する。

1. architecture/repository-structureに無条件Bun規範が残り、current debtとtarget Nodeが一意でなかった。
2. Windows activationがReplaceFileW等のNode標準API外へ依存し、F0をnative helper/Rustでblockした。
3. Issue #152所有のL4→L5→L6 Redesign PLAN chainとconfirmed設計artifactの差替えprovenanceが無かった。

再修正ではappend-only immutable activation markerと、PLAN-L4-33→L5-26→L6-93→L7-458の
依存鎖を導入した。これも再review PASSを意味しない。

## Third review FLAG

second修正後もA7–A11が未閉鎖だったためFLAGを維持する。

- repository structureに旧current pointer記述が残存。
- writerごとのsequence reservationでは逆順publishを防げず、global publish leaseとstale lease recoveryが未設計。
- F0で安全なreader lease無しにGC ownershipを主張。
- rollbackのsame/cross subject revision境界が未定義。
- process-crash atomicityとpower-loss durabilityを同一保証として扱っていた。

third修正はglobal exclusive lease、automatic GC禁止、approved cross-revision rollback、OS別durability
claimを設計したもので、独立再review PASSを代替しない。

### A7–A11 correction record

- repository §10をappend-only activation markerへ統一。
- lease取得後のN+1採番、loser retry 0、stale lease recovery receiptを固定。
- F0はgeneration deletion/automatic GC 0とし、reader lease設計まで全generation保持。
- same-revision rollbackとapproved cross-revision target変更を分離。
- process-crash atomicityとpower-loss durabilityを分離し、Windows F0の保証を旧complete fail-safeまでに限定。

この追記後もverdictはFLAGであり、再review結果を待つ。

## Fourth review FLAG

third修正後のN1–N5を安全側へ再設計した。

- F0をF0a toolchain / F0b sealed build / F0c CIへ統一し、CAND ownerを一意化。
- F0bからlease recovery/steal/clearとcross-revision rollbackを削除。
- power loss後はcomplete marker 1件以上なら最大を選び、0件ならfail-close。
- lease backendをexact `dist/node-publish.lock/` atomic mkdirだけに限定。
- stale lock後はreader継続・publisher永久fail-close。後続PLANまで手動削除も禁止。

この記録も再review PASSを意味しない。

Fourth修正の直接plan-governanceでは、初回に新PLANの`agent_slots`欠落と既存base designとの
`duplicate_layer_sub_doc`を検出した。3 PLANをsection追加に適合する`add-design`へ修正し、
required agent slotsを追加した後、candidate-owned plan-governance、design-language、
oracle-test-traceはGreenとなった。FLAG verdict自体は再reviewまで維持する。
