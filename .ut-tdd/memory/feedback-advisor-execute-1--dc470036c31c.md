---
memory_id: memory:feedback:advisor-execute-1--dc470036c31c
kind: feedback
title: "advisor --executeが無応答のときは待ち続けず、1試行だけ記録して高影響境界か既存契約から一意に決まるかで仕分ける"
tags: ["advisor", "escalation", "failure-diagnosis"]
updated_at: 2026-09-16T11:16:00.872Z
---

ut-tdd advisor --execute の実spawnが無応答(タイムアウト)になることがある一方、dry-run(routing計算)は正常に返ることがある。この場合、routingの問題ではなく子プロセスspawn/応答待ちの段が原因である。advisorが無応答でも待ち続けない、別形式で再起動しない。1 providerあたり1回、上限付きで試し、失敗したら記録する。記録したうえで、判断が(1)高影響境界(authentication/authorization、production infra、destructive、payment、PII、secret、licensing、外部API前提)に該当するか、(2)既存の層・責務・契約から一意に決まるか、で仕分ける。(2)なら継続し、根拠となる契約条文を引用する。「advisorが使えない」こと自体をPO判断への転送理由にしない。高影響境界に該当する場合だけ、unavailableの証跡を添えてPOへ上げる。
