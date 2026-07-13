---
memory_id: memory:feedback:checked-zip-a-187-catalog-claim-only
kind: feedback
title: "checked-ZIP乖離監査A-187の恒久教訓 (catalog claim-only検証規律)"
tags: ["A-187", "audit", "catalog", "claim-only", "vmodel"]
updated_at: 2026-07-13T02:25:28.388Z
---

checked ZIP (Vモデル設計ドキュメント) と HARNESS の乖離は A-187 (.ut-tdd/audit/A-187-vmodel-checked-zip-divergence-audit-2026-07-13.md) が正本。恒久教訓:

1. disposition/semantic catalog の merge/done 宣言は実体 grep 検証なしに信頼しない。A-187 で claim-only 6件 (ZIP-DOC-012/069/096/098/101/102/109 系) と semantic catalog の誤 done 3件 (mesh_vmodel/perf/sectest) を検出。catalog の done 判定基準に「target 実体の機械突合」を要する。
2. reference disposition は「target slot の実在」まで検証する。scale-profiles に slot 不在のまま reference 指定された 6件 (054/055/059/063/066/068) が silent gap 化していた。
3. 委譲宣言 (例: nfr.md「詳細は L4 で確定」) は受け皿実体の裏取りとセットで監査する。宣言のみの委譲チェーンは行き止まりになる (security.md)。
4. snapshot provenance: .ut-tdd/cache の canonical zip は manifest sha と不一致でも検出されない (実行時参照ゼロ)。hash 宣言には「一致する実体の取得元」を併記しないと再現性が欠落する。

是正 route: catalog errata = PLAN-L4-22 / security 実体化 = PLAN-L4-29 / 構造規約 analyzer = PLAN-L6-71。
