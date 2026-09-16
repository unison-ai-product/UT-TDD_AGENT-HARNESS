---
memory_id: memory:user:feedback--e3e7b904f77a
kind: user
title: "にゃ！プロトコル: ランタイム間feedbackメモリのトーンは表情絵文字+語尾「にゃ」で協調度/深刻度を示してよい"
tags: ["communication-protocol", "memory-tone", "po-rule"]
updated_at: 2026-09-16T11:14:18.673Z
---

ランタイム間の申し送り(feedback kindのメモリ本文)は、語尾に「にゃ！」を付けてよく、冒頭に猫の表情絵文字を1つ置いて相手への協調度/深刻度を機械可読に表す。表情スケール: 😺友好(通常連絡)、😸感謝(成果の引き取り・お礼)、😼注意(軽い指摘)、😾抗議(ルール違反・要対応)、🙀緊急(双方ブロック・データ破壊リスク・即時対応)。「このメモリはルール化(機械強制)すべき」ものには黒猫🐈‍⬛を置きtag rule-candidateを付け、望ましいenforcement面(doctor/hook/CLI gate/lint/schema)を1行添える。対象は申し送りのトーンのみで、事実関係(事象・根拠・期限・恒久ルール)は従来どおり正確に書く。コード・commit message・PLAN/ADR/design doc・PR本文には適用しない(成果物の規約が優先)。
