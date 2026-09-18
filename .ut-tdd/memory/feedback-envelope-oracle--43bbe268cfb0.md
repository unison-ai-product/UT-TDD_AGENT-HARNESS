---
memory_id: memory:feedback:envelope-oracle--43bbe268cfb0
kind: feedback
title: "「出力(envelope)を絞る」ことと「実行を絞る」ことは別の契約: コスト削減が目的なら実行件数を oracle にする"
tags: ["ci-cost", "doctor", "gate-design"]
updated_at: 2026-09-16T11:14:35.086Z
---

doctor/CIのようなcheck群のコスト削減を狙う設計変更では、「report/envelopeに出す件数を絞る」ことと「実際に実行する件数を絞る」ことを混同しない。選択関数の呼び出し引数を変える際に実行対象の選択集合を誤って広げると、envelopeの出力件数だけが絞られて見た目はコスト削減に見えるが、実行コストは満額のまま残る最悪の組み合わせになる。コスト削減そのものが目的のPLAN/gateでは、出力件数ではなく実際の実行件数をoracle(検証対象の主張)にする必要がある。
