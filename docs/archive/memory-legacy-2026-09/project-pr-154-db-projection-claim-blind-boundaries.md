---
memory_id: memory:project:pr-154-db-projection-claim-blind-boundaries
kind: project
title: "PR #154 db projection claim-blind boundary closure"
tags: ["pr-154", "claim-blind", "db-projection-coverage", "tdd"]
updated_at: 2026-07-24T21:16:00.000+09:00
---

HEAD `616d4fed`のclaim/spec-blind reviewで、Markdown semantic state machineに追加境界を検出した。
index-like bulletを全target節で受理していたため§2.7/§9.1がindex registryへ漏れ、same-depthの論理descendant
`9.3.1`がscope外となって実正本`refactor_candidates`と2 indexが脱落した。さらにouter pipe省略GFM tableと
escaped `\|` cellを扱えなかった。

index bulletはexact §9.3直下、又は論理descendant内でprojection table schemaが成立した後だけ受理する。
節番号のlogical descendantをMarkdown heading depthより優先して親target scopeへ残す。table tokenizerはouter pipeを
任意とし、escaped pipeだけを最小限unescapeする。全面Markdown parser又は外部依存は導入していない。

Red fixturesは§2.7/§9.1 index漏れ、§9.3 positive、実`9.3.1`のtable+2 indexes、outerless table、
escaped pipeを拘束した。対象Node testは19/19 Green。設計、PLAN、Issue #153許容負債は変更していない。

index抽出はsection番号及びprojection table stateから分離し、正本marker `必須 index:` / `必要 index:`直後の
連続index bullet blockだけを読む。marker直後のblankは許可し、bullet開始後のblank、非index行、headingで終了する。
これにより§2.7/§9.1の任意bulletを除外しつつ、§9.3.1、§9.5/9.6/9.7/9.9を含む正本54 indexを回収する。
旧`checkedIndexes >= 41`の下限oracleは撤回し、正本から独立に転記した54 identifierの全件・順序exact assertionへ
置換した。table headerとseparatorのcell count不一致も非tableとして拒否する。

追加spec-blind境界として§9.8をtargetへ含め、`screens` / `screen_trace`を含む正本56 table IDも独立明示配列で
全件・順序exact assertionにした。index markerはactive target又はlogical descendant scope内だけで発火する。
backtick/tilde fenced codeはinfo string付き開始から同marker・同長以上の終了までtable/markerを完全無視する。
outer pipe省略対応を維持しつつ、pipe直前の連続backslash数の奇偶でescaped pipeかdelimiterかを判定する。

追加reviewでは、番号付きheadingがactive targetのlogical descendantでなければ深度に関係なくscopeを終了する。
番号なしheadingだけ従来のdepth ruleを使う。GFM fenceはindent 0-3、backtick info内backtick禁止、close残部
whitespace-onlyへ限定した。open/close両境界でpending table、table kind、index block、current-section
projection flagを破棄する。各headingでもprojection flagをresetし、markerはactive targetかつ同sectionで
projection table成立後だけ許可する。§9.3は既存table群の専用canonical index節としてmarkerを許可する。
deeper non-descendant、trailing-content擬似close、fence跨ぎstate、4-space indent、ownership markerをRedで拘束し、
対象Node testは28/28 Greenとなった。

## Canonical physical-data grammarへの縮約

後続監査で、outer pipe省略、escaped pipe parity、GFM alignment separator、section内projection成立後だけの
marker admissionは、現行`physical-data.md`正本に存在しない入力を扱う過剰設計と判定して撤回した。

検出器が扱うgrammarは、target headingとその論理descendant、top-level backtick/tilde fenceの除外、
outer-pipe table、plain hyphen separator、balanced outer backtick/strong/em wrapper付き
`table` + `primary key` / `主キー` header、及びliteral `必須 index:` / `必要 index:`直後の
連続bullet blockに限定する。header内部の`_` / `*`は保持し、foreign schemaをprojectionへ正規化しない。

汎用GFM用4 fixtureとownership marker admission fixtureを削除した。正本から独立転記した56 table / 54 indexの
全件・順序exact assertionをfail-close oracleとして維持し、対象Node testは25/25 Green。コードとtestの差分は
40 insertions / 92 deletions（net 52行削減）。設計docs、PLAN、Issue #153許容負債は変更していない。
