---
memory_id: memory:feedback:doctor-gate-lint-gate-remediation-plan--04be072adfaa
kind: feedback
title: "doctor gateが失敗したら、lintコードの記憶ではなくgate自体のremediationメッセージと所有契約(対応PLAN)を読んでから是正順序を指示する"
tags: ["doctor-gate", "plan-hierarchy", "review-methodology"]
updated_at: 2026-09-16T11:16:53.315Z
---

あるdoctor gateの失敗に対して「reviewしてからconfirmし再reviewする」のような是正順序を、lintコードの記憶だけから断定しない。gateのviolation messageそのものと、そのgateを所有する契約(対応するREVERSE PLAN等)が既にcanonicalな単一実装PRの経路(例: preflight review_evidenceでconfirmし、closing review PASSは別receiptとして最終headに残しPLANへ書き戻さない)を定義していることがある。誤った順序を指示すると余計なCI+review往復を1回追加してしまう。doctor gateが失敗したら、そのgateの完全なremediationメッセージを読み、docs/plans内をそのgateの対応PLANでgrepしてから著者familyへ指示し、根拠となる行を引用する。
