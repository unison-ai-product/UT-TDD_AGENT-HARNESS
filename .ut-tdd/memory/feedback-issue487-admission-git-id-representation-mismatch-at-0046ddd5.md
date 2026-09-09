---
memory_id: memory:feedback:issue487-admission-git-id-representation-mismatch-at-0046ddd5
kind: feedback
title: "Issue487 admission Git ID representation mismatch at 0046ddd5"
tags: ["contract-gap", "issue487", "pre-gate"]
updated_at: 2026-09-08T09:20:56.644Z
---

追加の読み取り検収。PLAN-L7-530 section2はalgorithm-prefixed Git object IDを要求するが、WIP HEAD0046ddd5 src/runtime/bun-final-retirement.ts REVISIONは40桁raw SHAのみを受理する。raw/prefixedを無差別両受理せず、既存F0b/F0c/Q0 schemaと正規IDの境界変換を設計どおり照合する必要がある。Cutover writer欠落と別の未解決点。Issue152はcutover system207とfinal deletion208の所有分離を明記。監査記録 C:/dev/ut-issue487-bun-final-retirement-impl/.ut-tdd/issue487-evidence/admission-contract-gap-0046ddd5.md。production変更なし、PR化・retirement完了は未主張。既存pre-gate相談への追加材料。
