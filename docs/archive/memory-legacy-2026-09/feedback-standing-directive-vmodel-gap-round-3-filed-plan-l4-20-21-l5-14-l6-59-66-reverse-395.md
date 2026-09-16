---
memory_id: memory:feedback:standing-directive-vmodel-gap-round-3-filed-plan-l4-20-21-l5-14-l6-59-66-reverse-395
kind: feedback
title: "Standing directive: vmodel gap round 3 filed - PLAN-L4-20/21, L5-14, L6-59..66, REVERSE-395"
tags: ["claude", "codex", "directive", "engine-swap", "gap-audit", "plan-l4-20", "plan-l6-59", "plan-reverse-395"]
updated_at: 2026-07-08T10:48:31.603Z
---

PO指示 (2026-07-08、Claude実施): ZIP再監査round3として、A-185/A-156で候補化済みだが未起票だった4件
(設計doc横断重複定義+循環依存検出、規模プロファイル機構、データディクショナリ/i18n slot、環境定義/
インフラ/DR-BCP slot)と、拡張版ZIP (docs 109種+tools27本+meta手法論6種+ADR/spec/CI/skills、旧版53-59種
より大幅拡張) の再監査で新たに判明したgenuine gap 14件を、advisor(gpt-5.5)相談によるクラスタリングを
経て12本のPLANとして起票した(commit待ち)。

起票内容:
- PLAN-L4-20 (ドキュメントカタログ+規模プロファイルSSoT、B1+A2+A3+A4統合)
- PLAN-L4-21 (ドメイン実装方針VO+クラス・メソッド設計規約拡張)
- PLAN-L5-14 (AIモデルガバナンス・モデルカード台帳)
- PLAN-L6-59 (設計doc横断整合性チェック、cmd_check相当)
- PLAN-L6-60 (ID起点trace impact traversalコマンド)
- PLAN-L6-61 (要求〜テストRAG閉包状態台帳)
- PLAN-L6-62 (docs横断secret-scanゲート+資格情報ローテーション運用)
- PLAN-L6-63 (Pack配布段階公開・ロールバック戦略)
- PLAN-L6-64 (CLIシェルコンプリーション機能)
- PLAN-L6-65 (編集直後fail-close即時再検証hook、Claude/Codex両対応)
- PLAN-L6-66 (code-minimalismスキル新設)
- PLAN-REVERSE-395 (CLIコマンド体系設計backfill、kind=reverse、実装先行のためadd-designでなくReverseと
  advisor判定)

除外/保留した項目: X1 (非機能要件グリッド58) は既存A-174 F-3のnfr-grade.md AC placeholder gapと同一と
確認したため再起票せず (二重起票回避)。X2 (インシデントSEV段階/エラーバジェット、62) はdocs/process/
modes/incident.mdへの追記候補として保留 (PLAN化は次round判断)。D3 (BDD/Gherkin導入、docs/specs/*.feature
相当) は既存test-designとの重複整理が前提のためPO優先度判断待ちで保留。

Codexクロスレビューで12件の設計内容修正を実施 (schema違反は無かったが内容面の指摘): authoring
source/projection混同(L4-20)、AC具体化(L4-21)、parent方向逆転(L5-14がL7実装PLANをparentにしていた誤り)、
参照パス誤り(L6-59: src/doctor/dependency-drift.ts→実在はsrc/lint/dependency-drift.ts、
src/vmodel/lint.ts:660→実在はsrc/plan/lint.ts:664)、trace_edges(artifact粒度)とspec_relations(ID粒度)の
取り違え(L6-60)、依存漏れ(L6-61がL6-60をrequiresに含めていなかった)、L4-16未確定のfallback未記載(L6-62)、
過大主張(L6-63「Pack配布ロールバック手順が皆無」→実際はsetup-solo-team.mdのbuildPackSyncPlanでローカル面は
既存、Pack repo側のtag/release revert runbookのみが真のgap)、R0段階でのR3/R4判断先取り(L6-64のparent、
PLAN-REVERSE-395のforward_routing/promotion_strategy)、Codex hook parity欠落(L6-65がClaude hookのみ想定)、
存在しないdocs/skills/ディレクトリへの虚偽言及(L6-66、`ls docs/skills/`で不在確認)。

作業中、Codexが並行してrefactor-qa-release-gates(commit a9accba)→refactor-candidate-lifecycle
(PLAN-L7-367/REVERSE-367、physical-data.md/function-spec.md/harness-db schema等)を進めており、
review-guardが誤ってこれをtl役割delegationの「変更」として検知した (実際は同時進行の別Codexセッションに
よるもので、自分のdelegationとは無関係と裏取り済み)。これらのファイルには一切触れず、commitはPLAN 12本
のみをpath明示staging (`git add <path>`) で実施する方針とした。
