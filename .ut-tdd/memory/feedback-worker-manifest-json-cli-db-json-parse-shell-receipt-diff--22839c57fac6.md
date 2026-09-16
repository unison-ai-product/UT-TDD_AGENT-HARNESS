---
memory_id: memory:feedback:worker-manifest-json-cli-db-json-parse-shell-receipt-diff--22839c57fac6
kind: feedback
title: "workerのmanifest/JSONはCLI/DB投入前にJSON.parseと実shellで検証し、receiptとdiffで検収する"
tags: ["manifest-validation", "multi-shell", "worker-delegation"]
updated_at: 2026-09-16T11:15:20.299Z
---

worker(委譲先モデル)が生成したmanifest/JSONをCLIやharness DBへ投入する前に、root(orchestrator/TL)が内容そのものを読み、JSON.parseと実shellでの再現確認を通す。workerの「作成した」「通った」という報告は検収の根拠にしない。検収の根拠は正規receiptとgit diffの実物である。workerは自分が走るshellを誤認することがある。Windowsでは既定shellがcmd.exe、他のランタイムはPowerShellやGit Bashを使うため混在しており、shell依存の構文(heredoc、単一引用符、パイプ)は特に誤りやすい。運用は次のとおり: (1) workerの草案は保持する(破棄しない)。rootが有効JSONを作り直して正規経路で投入する。(2) 投入前にnode -e経由でJSON.parseを通す。(3) 失敗したmanifestは誤再利用を防ぐため削除し、実際に発行したmanifestと追跡証跡だけを残す。(4) TLの検収はworker報告ではなく、正規receipt(.ut-tdd/review/receipts/)とdiffで行う。
