---
memory_id: memory:project:v4-release-roadmap-v2-0-intake-started-parent-issue-530-sub-issues-531-536-s0-pr-537-stacked-on-pr-517-branch-codex-is-the-non-author-reviewer-for-s0-s5--fb0faf3b9662
kind: project
title: "v4 release roadmap v2.0 intake started: parent issue #530, sub-issues #531-#536, S0 PR #537 stacked on PR #517 branch; Codex is the non-author reviewer for S0-S5"
tags: ["claude-authored", "concept-v4", "issue530", "pr-517", "pr-537", "roadmap"]
updated_at: 2026-09-08T06:33:37.415Z
---

PO 提示 (2026-09-08) の計画資料「UT_V4_RELEASE_ROADMAP_v2.0」(構想 v4 までの版別 capability R00〜R10、旧新置換 MIG-01..20、作業パッケージ SL 39 個、契約判断 DEC-01..16、追加要求 RM-ADD-01..13、順序予測 SCHED-01..14) の取り込みを開始した。

構造: 親 issue #530 (top-level outcome) の下に S0〜S5 = #531〜#536 を sub-issue 接続。PR #517 (concept v4.0 候補、head c21b54fb 不変、PO 既決でプレリリース完了まで merge 保留) は #530 を Refs する親 PR。子 PR は design/concept-v4-candidates を base にした stacked PR で、#517 merge 後に main へ再指向される。方式は advisor (claude-fable-5、progress) 案 A を repo 実測で確認して採択。

S0 = PR #537 (draft、head a535250f): 資料 49 ファイル (md 39 + data/*.json 10) を docs/governance/candidates/v4-roadmap/ へ原文収容 (LF 正規化のみ、非正本)。生成 HTML と python validator は ADR-001 に従い repo 外 archive。INTAKE_MANIFEST.md に 52 メンバー全件の sha256 と disposition。原本 ZIP は 52/52 照合後に repo root から C:\dev\_archive へ退避。

Why: #517 を巨大化させず (1 PR = 1 論点)、r11 PASS を保持したまま、ロードマップの内容を小さな PR 群で正本 5 文書 + PLAN-L1-09 へ差し込むため。順序契約は S0 → S1 (PLAN-L1-09 で版別範囲・MIG/SL 依存・DEC・SL→PR 対応表を freeze) → S2〜S5 (5 文書、並行可)。

How to apply (Codex): S0〜S5 は Claude 著のため closing review は Codex family 非著者 (ut-tdd codex --role blind-reviewer) で受ける。依頼は各 PR の CI 5/5 green 後に exact head 付きで出す。v4-roadmap/ 配下は非正本なので、そこを直接編集して正本化しない。プレリリース後の作業計画 (R01 MPL 切替、R02 updater/A-B、R03 JSON) はこのロードマップが入力になる。#418/#403/#487/#424 の現行修理はロードマップ R00 の範囲であり、先送りしない。
