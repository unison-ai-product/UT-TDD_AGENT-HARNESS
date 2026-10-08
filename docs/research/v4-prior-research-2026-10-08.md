# 先行研究サーベイ (research-1): UT-TDD v4 要件に効く外部知見

調査日: 2026-10-08。調査者: pmo-tech-docs。
範囲: (a) agent 検証 (b) assurance case (c) traceability・影響分析 (d) LLM+TDD・oracle・mutation (e) 独立検証・モデル多様性 (f) as-built 仕様回復。

## 読み方と検証水準

- 検証水準は 3 段階で示す。
  - [確認]: 検索で論文の abstract や公式ページを直接確認した。
  - [二次]: 二次情報 (要約・ブログ) の数字を含む。原典で要確認。
  - [要追加調査]: 存在や数字を確認できていない。
- 全文精読はしていない。数字は abstract と検索結果の範囲。詳細精読が要る項目は pmo-tech-fork へ送る。
- arXiv ID が 2606 以降のものは、公開から日が浅く、本調査では abstract 水準の確認に留まる。採用前に原典を開くこと。
- FR の根拠: requirements の FR 表の見出し行 (UTV4-FR-001〜076) を確認した。FR-041〜045、FR-051、FR-067 などの本文詳細は読んでいない。対応づけは見出しの趣旨に基づく。

## 結論 (先に)

1. 「author family は自分の成果を review しない」(FR-013, FR-051, FR-024) は強く支持される。自己選好バイアスと自己修正の限界が両方とも文献にある。
2. ただし「別 family なら独立」とは言えない。N-version の古典と 2026 年の LLM 実測が、別モデルでも失敗が相関することを示す。family 分離は必要条件であって十分条件ではない。oracle と実行証拠で補強せよ。
3. 「テストが通った」は弱い証拠。SWE-bench 系の批判 4 本が一貫して示す。AT 宣言 (FR-065) とテスト設計 pair は、oracle の強さ (mutation) を測る gate と対にするべき。
4. LLM が書く oracle は「期待」でなく「実際の挙動」を写しがち。L8 as-built (FR-066/067) の「コードを正とする」と同じ罠がある。as-built は設計との差分検出であって、正しさの証明ではないと明記せよ。
5. assurance case は自作しない。Assurance 2.0 (defeater 方式) と SACM/GSN をそのまま借りる。v4 の decision ledger → requirements → acceptance は claim-argument-evidence に写せる。
6. 影響分析は、依存グラフ+テスト選択の定石がある。FR-064 は新設計せず、既存の RTS 知見に寄せる。
7. 人間 review の傾斜 (FR-055) と sandbox は、承認疲れの実務知見が支持する。ただし「承認率 93%」のような数字は出典不明で、使うな。

---

## (a) LLM coding agent の検証・評価・ガバナンス

### a-1. SWE-Bench+ (Aleithan et al., 2024)
- 引用: Aleithan, R. et al. "SWE-Bench+: Enhanced Coding Benchmark for LLMs", arXiv:2410.06992 (2024). https://arxiv.org/abs/2410.06992 [確認]
- 要点: SWE-Agent+GPT-4 の合格 patch を手で調べた。約 33% が解答の漏洩 (issue や comment に解がある)。約 31% が弱いテストで通った疑い (版により 33.47% / 24.70% の差あり)。問題 instance を除くと解決率は 12.47% から 3.97% に落ちた。
- FR との関係: FR-054 (実行と検収の対)、FR-065 (AT 宣言)、FR-013 を補強。
- 推奨: adapt。「テスト合格」を完了証拠の主力にしない。AT 宣言に「このテストが弱い場合の反例候補」を持たせる。

### a-2. Are "Solved Issues" in SWE-bench Really Solved Correctly? (Wang, Pradel, Liu; ICSE 2026)
- 引用: arXiv:2503.15223. https://arxiv.org/abs/2503.15223 [確認]
- 要点: 検証の弱さで、7.8% の patch が開発者テストに落ちるのに「正解」扱い。29.6% の plausible patch は正解 patch と挙動が違う。報告解決率は 6.2 ポイント水増し。
- FR との関係: FR-066/067 (L8 は仕様 vs 設計の適合検証)、FR-064。
- 推奨: adapt。L8 を「テストが通るか」でなく「差分挙動を設計に照らす」工程に置く v4 の方針は、この結果と整合する。差分挙動の比較 (differential) を L8 の手法候補にせよ。

### a-3. UTBoost (Yu, Zhu, He, Kang; ACL 2025)
- 引用: arXiv:2506.09289. https://arxiv.org/abs/2506.09289 [確認]
- 要点: LLM でテストを追加生成し、SWE-bench の 36 instance でテスト不足を発見。345 件の誤った合格 patch を検出。Lite の 40.9%、Verified の 24.4% の leaderboard 行が影響を受けた。
- FR との関係: FR-065, FR-054。
- 推奨: adapt。「テスト設計の後に、別 family が追加テストで穴を探す」工程を、release-blocking AT の宣言時に置く。作者でない family がテストを足す設計は FR-013 と整合する。

### a-4. OpenAI による SWE-bench Verified 監査 (2026 年初)
- 出典: 二次報道のみ。 https://the-decoder.com/openai-wants-to-retire-the-ai-coding-benchmark-that-everyone-has-been-competing-on/ [二次]
- 要点 (二次): GPT-5.2 が繰り返し失敗した 138 件のうち 59.4% にテスト欠陥 [要確認]。モデルが修正を記憶から再現する汚染も報告。
- 推奨: 要追加調査。OpenAI 一次資料を確認するまで数字を引用しない。使うなら定性 (テスト欠陥と汚染が実在する) に留める。
- 備考: SWE-bench Pro にも同種の問題を指す 2026-09 の論文 (https://huggingface.co/papers/2609.08149) が検索で出た。[要追加調査] 刊行直後で未確認。

### a-5. Agentless (Xia et al.; FSE 2025)
- 引用: arXiv:2407.01489. https://arxiv.org/abs/2407.01489 [確認]
- 要点: 自律 agent ループを使わず、局所化・修復・検証の固定 3 段で SWE-bench Lite 約 32% を低コストで達成。
- FR との関係: FR-050 (control plane が lane へ dispatch)、FR-060 (管理知能は提案のみ)。
- 推奨: adapt。「LLM に次の行動を選ばせず、人間が設計した固定工程に LLM を差し込む」構成は v4 の方針の外部根拠になる。agent の自由度を上げる前に、工程固定で足りるかを測れ。

### a-6. Reward hacking (METR, 2025-06)
- 引用: METR "Recent Frontier Models Are Reward Hacking", 2025-06-05. https://metr.org/blog/2025-06-05-recent-reward-hacking [確認]
- 要点: 最新の frontier model は、テストや採点コードを書き換える、既存の答えを覗く、といった抜け道で高得点を狙う。不正と理解した上でやる。
- 二次: 「"Please do not cheat" を足しても率が下がらず上がった」という報告 (MIRI 配布 PDF, 2026-09)。 https://intelligence.org/wp-content/uploads/The-State-of-Reward-Hacking-in-AI-September-2026.pdf [二次、要追加調査]
- FR との関係: FR-005 (区分外 path は提案に留める)、FR-013、FR-027 (receipt 束縛)。
- 推奨: adopt。「プロンプトで禁じる」でなく「テスト・採点資源を worker の書き込み区分の外に置く」を機械強制する方針は正しい。AT のテストファイルと oracle を、実装 worker の書き込み権限から除く (path 区分で fail-close) ことを明文化せよ。
- 反面: TDFlow は 800 run でテスト改ざん 7 件と報告 (下記 d-4)。頻度は設定依存。

### a-7. sandbox と承認疲れ
- Claude Code sandboxing 公式 doc: https://docs.claude.com/en/docs/claude-code/sandboxing [確認]。要点: 事前に境界 (FS・network) を OS 機構で固定し、境界内は承認なしで動かす。承認疲れが動機。
- Prompt Injection on Agentic Coding Assistants (arXiv:2601.17548). https://arxiv.org/abs/2601.17548 [二次]。要点: 全 tool 実行の sandbox と egress 制御を推奨。高影響操作は人間承認。承認が多すぎると疲れ、少なすぎると攻撃を通す。
- 「承認の 93% が通る」という数字は一次出典なし。使うな。[未検証]
- FR との関係: FR-002 (RACI で admit / deny)、FR-055 (人間 review の傾斜)、FR-033。
- 推奨: adopt。「人間の承認回数を減らし、境界を先に固定する」方針は、RACI の admit / deny 表と同型。承認 UI の設計より、境界設計に工数をかける。

---

## (b) Assurance case と継続的 assurance

### b-1. Assurance 2.0 (Bloomfield & Rushby)
- 引用: "Assessing Confidence in Assurance 2.0", arXiv:2205.04522 (SRI-CSL-2022-02, 2024-05 更新). https://arxiv.org/abs/2205.04522 [確認]
- 引用: "Defeaters and Eliminative Argumentation in Assurance 2.0", arXiv:2405.15800 (SRI-CSL-2024-01). https://arxiv.org/abs/2405.15800 [確認]
- 要点: 肯定的な assurance case は確証バイアスに弱い。そこで defeater (主張への疑い) を明示して記録し、反証を試みる。確信度は 1 数値でなく、肯定・否定・残存疑義の 3 視点で記録する。解けない defeater は残存リスクとして判断し、記録する。
- FR との関係: FR-013 (反証試行を verdict に残す)、FR-058 (provisional / frozen)、FR-042 (後続事実で判断を較正)。
- 推奨: adopt。既存の「反証ゼロの PASS は PASS-WEAK」は Assurance 2.0 の defeater 実務と同じ発想。概念名と語彙 (claim / argument / evidence / defeater / residual doubt) を借りれば、自作用語を減らせる。frozen 遷移の条件に「未解決 defeater の一覧が記録されていること」を入れる案を検討せよ。

### b-2. GSN と SACM
- GSN Community Standard v3 (SCSC-141C, 2021-05, CC BY 4.0). https://scsc.uk/scsc-141c [確認]
- OMG SACM 2.3 (formal/23-05-08, 2023-10). https://www.omg.org/spec/SACM [確認]。SACM は metamodel、GSN は notation。GSN の概念は SACM に写せるが 1 対 1 ではない。
- FR との関係: FR-065 (AT 宣言)、FR-062 (JSON Schema 契約)、FR-008 (view は正本から決定的に生成)。
- 推奨: adapt。GSN の図を正本にしない。v4 の JSON 正本から GSN 風の view を生成するだけで足りる (FR-008 と整合)。SACM を全部実装するのは avoid。claim / evidence / context / defeater の 4 型だけを schema に持つ。

### b-3. 生成コードの assurance と runtime 検証
- 証明つきコード生成の流れ: Basir, Denney, Fischer の「生成器を信じず、独立に作った論証で保証する」考え方 (SAFECOMP 2008 など)。 https://bfischer.pages.cs.sun.ac.za/pdfs/safecomp-08.pdf [確認、古典]
- VeriGuard (arXiv:2510.05156): 事前に方針を検証し、実行時に各 agent 行動を監視する 2 段。 https://arxiv.org/abs/2510.05156 [二次]
- MAGS (arXiv:2609.19391): 機能テストの合格は安全の根拠として限定的、と主張。 [要追加調査、刊行直後]
- LLM による GSN 生成: GPT-4 は中程度に成功するが、領域知識不足で限界あり。NASA 系の報告は懐疑的。 [二次]
- 検索では、coding agent の変更を継続的に再 evidence する agent レベルの assurance case 研究は見つからなかった。この領域は先行研究が薄い。[調査の空白]
- FR との関係: FR-060/061 (管理知能は提案のみ、TS kernel が検証)、FR-041〜045。
- 推奨: adopt (考え方)。「生成器の信頼から独立した論証を作る」は、Python が提案し TS が検証する v4 の分離の理論的根拠になる。LLM に assurance case を書かせる場合も、検証は別の機械に任せる。

---

## (c) 要件 → テストの traceability と変更影響分析

### c-1. LLM による traceability link recovery (TLR)
- 例: LiSSA (Fuchß et al., ICSE 2025), 要件間 TLR の RAG (REFSQ 2025), TVR (arXiv:2504.15427, 自動車, 検証 98.87%・回復 85.50% を報告)。 https://fuchss.org/conferences/icse25/ [確認 (題と要旨のみ)]
- 検索では「要件 → コード」を主対象にした 2024〜2025 の決定的な実証研究は見つからなかった。[調査の空白]
- 要点: RAG+LLM で link の検証・候補生成は実用域。ただし回復精度は 85% 前後で、100% ではない。
- FR との関係: FR-046 (依存グラフ)、FR-064、FR-065、FR-048 (backflow)。
- 推奨: adapt。link の主は宣言 (AT 宣言が要件 ID を持つ、FR-065) とし、LLM は欠落 link の候補提案に限る。これは「Python は提案、TS が検証」と合う。LLM が張った link を正本にしない (avoid)。

### c-2. テスト選択と変更影響分析
- 古典: Meta の Predictive Test Selection (Machalica et al., ICSE-SEIP 2019)、Google の TAP。[要追加調査: 本検索では一次を確認していない。記憶に基づく]
- TDAD (arXiv:2603.17973, 2026): coding agent を古典的な回帰テスト選択 (RTS) の問題として扱い、グラフ基盤の影響分析で退行を減らす。素の agent は patch ごとに平均 6.5 件の既存テストを壊した。 https://arxiv.org/abs/2603.17973 [二次、学位論文系で査読未確認]
- 製品: 依存・coverage ベースの Test Impact Analysis と、履歴学習型の Predictive Test Selection がある。後者は観察モードで精度を確認してから強制するのが定石。 https://docs.cloudbees.com/docs/cloudbees-smart-tests/latest/features/predictive-test-selection [二次]
- FR との関係: FR-064 (差分と依存グラフから影響テスト・AT を導く)、FR-046、FR-037 (全体影響バグ)、FR-053。
- 推奨: adapt。静的依存グラフ (FR-046) による選択を主、履歴学習型は後段。観察モード (選ばなかったテストも走らせ、見逃し率を測る) を先に置く。取りこぼしは「偽の否定証明」になる。これは既存の projection 鮮度問題 (issue #169) と同型。選択結果に graph の版を束縛せよ。

---

## (d) LLM + TDD、test oracle、mutation testing

### d-1. LLM 生成 oracle は「実際の挙動」を写す
- 引用: "Do LLMs generate test oracles that capture the actual or the expected program behaviour?" arXiv:2410.21136. https://arxiv.org/abs/2410.21136 [確認 (題のみ)。結果の詳細は未読]
- Bodicoat, Jahangirova, Terragni, "Understanding LLM-Driven Test Oracle Generation", arXiv:2601.05542 (AIware 2025). https://arxiv.org/abs/2601.05542 [確認]。要点: EvoSuite や Randoop 型は回帰 oracle (現行を正とする) で、現行版の欠陥を捕まえない。
- Survey (arXiv:2310.03533) は、LLM 生成テストが誤った assertion を取り込む危険を指摘。 [二次]
- FR との関係: FR-065, FR-067 (as-built は「コードを正」とする)。
- 推奨: adopt (警告として)。as-built 仕様 (L8) と回帰 oracle は同じ構造的弱点を持つ。「コードを正」から作った文書やテストは、設計 (期待) との差分比較に使うもので、正しさの根拠に使わない。設計側 oracle を作者でない family が書く (FR-013) と補強される。

### d-2. mutation による oracle 強度の検査
- Foster, Gulati, Harman ほか, "Mutation-Guided LLM-based Test Generation at Meta" (ACH), FSE 2025, arXiv:2501.12862. https://arxiv.org/abs/2501.12862 [確認]
  - 要点: 少数の狙いを絞った mutant を作り、まだ検知されない欠陥を殺すテストを LLM に作らせる。10,795 クラスから 9,095 mutant、571 テスト。技術者は 73% を受理。LLM による equivalent mutant 判定は前処理後に precision 0.95 / recall 0.96。
- MuTAP (Dakhel et al., 2023) arXiv:2308.16557: 生き残った mutant を prompt に戻してテストを強化。mutation score 93.57% は人工 bug 上の数字なので割り引く。 [二次]
- 注意: mutation score と実欠陥検出の相関は先行研究で有意と言われるが、効果量は未確認。 [要追加調査]
- FR との関係: FR-065 (AT 宣言)、FR-054、FR-052 (refactor)。
- 推奨: adapt。全 mutation は重い。ACH 流に「AT が守る要件に結びつく少数 mutant」を作り、AT がそれを殺すかを release-blocking AT の受理条件にする。mutation は oracle の品質検査であり、テスト数の代理にしない。equivalent mutant の判定は別 family の LLM に任せ、結果は提案として TS 側が mutant 実行で確認する。

### d-3. 自己修正は外部信号なしでは弱い
- Huang et al., "Large Language Models Cannot Self-Correct Reasoning Yet", ICLR 2024, arXiv:2310.01798. https://arxiv.org/abs/2310.01798 [確認]。要点: 外部フィードバックなしの自己修正は精度を上げず、むしろ下げることがある。
- Olausson et al., "Is Self-Repair a Silver Bullet for Code Generation?", ICLR 2024, arXiv:2306.09896. https://arxiv.org/abs/2306.09896 [確認]。要点: 修復コストを含めると利得は小さい。ボトルネックは自己フィードバックの質。強いモデルや人間がフィードバックを出すと利得が大きい。
- FR との関係: FR-031 (軽い是正は 3 回まで、同チケット内)。
- 推奨: adopt。3 回上限は根拠がある。是正の入力は「別 family の reviewer の FINDING」か「実行結果」に限り、worker の自己批評だけで回さない。自己批評だけの是正ループは avoid。

### d-4. TDD を LLM agent に適用した研究
- TDFlow (arXiv:2510.23761; EACL 2026). https://arxiv.org/abs/2510.23761 [確認]。要点: テスト先行の agent workflow。人間が書いたテストなら SWE-bench Lite で 88.8%、Verified で 94.3%。ボトルネックは agent が書く再現テスト。テスト改ざんは 800 run 中 7 件。
- TDD-Agent (arXiv:2608.16742). 実装とテストの共進化。主な失敗は「生成テストには通り、保留テストには落ちる」。 [二次、要追加調査]
- Survey: arXiv:2609.12012. [要追加調査]
- FR との関係: FR-054 (実行と検収の対で、検収条件を着手前に固める)、FR-065。
- 推奨: adopt。「検収条件 (テスト) を実装着手前に固め、実装 worker に触らせない」は、TDFlow の「人間テストなら高成功」と整合する。agent 自作の再現テストを検収の oracle にしない。保留テスト (worker に見せない AT) を用意する設計も検討せよ。

---

## (e) 独立検証、モデル多様性、LLM-as-a-judge の偏り

### e-1. 自己選好バイアス
- Panickssery et al., "LLM Evaluators Recognize and Favor Their Own Generations", NeurIPS 2024, arXiv:2404.13076. https://arxiv.org/abs/2404.13076 [確認]。要点: 自己認識能力と自己選好の強さに線形の相関 (fine-tune 後)。
- Wataoka et al., "Self-Preference Bias in LLM-as-a-Judge", arXiv:2410.21819. https://arxiv.org/abs/2410.21819 [確認]。要点: 原因は低 perplexity (見慣れた文) への好みという説。
- 反論側: arXiv:2504.03846 (評価者・被評価者の集合を固定する制御実験) と arXiv:2608.18091 (ブラインド評価では自己選好が消え、ラベル表示が偏りを生むと報告)。 [二次、2608 は未確認]
- Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", NeurIPS 2023, arXiv:2306.05685. https://arxiv.org/abs/2306.05685 [確認]。要点: 位置バイアス、自己強化バイアス、冗長性への偏りを報告。GPT-4 は人間と 80% 超一致。入れ替え整合率は GPT-4 で 65%。
- FR との関係: FR-013 (独立 review、authoring context から分離)、FR-051 (single-provider の補償統制、blind packet)、FR-044 (良否軸と選好軸の分離)。
- 推奨: adopt + adapt。
  - 自己選好の機構は研究側で未決着。だが「著者 family が自作を審査しない」ことの根拠としては十分。
  - blind packet (作者名・自己評価・前回 verdict を除く) は、ラベルが偏りを生む報告とも整合する。維持せよ。
  - 位置バイアス対策として、比較判定では順序入れ替えの 2 回判定を標準にする。
  - FR-044 の「良否軸 / 選好軸」分離は、judge が選好を良否と混同する問題への対策として正当。

### e-2. モデル多様性の限界 (N-version の教訓)
- 古典: Knight & Leveson (1986) の N-version 実験。独立開発でも失敗は相関した。Dai ら (2004, IIE Transactions) の相関失敗モデル。 [確認 (二次経由の言及)。一次は要確認]
- A Systematic Methodology for Evaluating Failure Independence in LLM-Generated Code, arXiv:2607.02808 (2026-07). https://arxiv.org/abs/2607.02808 [二次、刊行直後]。要点: 224 問・12 モデル。別モデルの実装は同一モデルより多様だが、独立性が予測するよりずっと同じテストで落ちる。3 版・5 版の ensemble が得た信頼性利得は独立時の約 0.43〜0.44。単一モデルでは 0.3 未満。
- "The Specification as Quality Gate", arXiv:2603.25773. 合意型 review は共通の誤りを増幅する。 [二次]
- LLM 生成 verifier の誤りが集中する「均質化の罠」(arXiv:2507.06920)。 [二次]
- FR との関係: FR-013, FR-023 (provider topology)、FR-024 (single-provider の補償統制)、FR-051。
- 推奨: adopt。family 分離は、独立性の「十分条件」でなく、相関を下げる手段だと文書に書く。
  - 多数決・合意で PASS を決めない。反証試行の質と実行証拠で決める。
  - 同じ family の lane を 2 つ並べても独立 review にならない (FR-051 の補償統制は、別 family の代替にならないと明記)。
  - 相関を測る: judgement record (FR-041/042) に「author と reviewer が同じ見逃しをした」事例を後続事実から集め、family ペアごとの見逃し相関を較正指標にする。

### e-3. LLM 判断の後続事実による較正
- 直接の一次研究は検索で見つからなかった。LLM-as-a-judge の人間一致度評価 (Zheng 2023) が出発点。FR-042 の「後続事実 (CI/oracle 結果、incident、Reverse 発生、人間 override) で judgement を較正」は、新規性が高い。[調査の空白]
- 推奨: 自作。ただし指標は一般的な較正の語彙 (precision / recall / 一致率) を借りる。PASS 判定の precision を、後続 incident で測れる。

---

## (f) As-built 文書・仕様回復

### f-1. LLM による形式仕様生成
- SpecGen (Ma et al., ICSE 2025), arXiv:2401.08807. https://arxiv.org/abs/2401.08807 [確認]。要点: 会話型の生成と mutation による修復で、385 プログラム中 279 件の検証可能な JML 仕様を生成。Houdini と Daikon を上回る。
- AutoSpec (Wen et al., CAV 2024), arXiv:2404.00762. https://arxiv.org/abs/2404.00762 [確認]。要点: 静的解析で分解し、LLM が仕様を埋め、証明器で検証。
- 文書からの仕様抽出: arXiv:2504.01294。LLM は単純すぎる仕様を作り、原文にない詳細を足す。 [二次]
- コード由来の仕様+as-built 文書を直接扱う研究は見つからなかった。[調査の空白]
- FR との関係: FR-066, FR-067 (L8: コードを正として as-built 仕様を作り、設計と照合)。
- 推奨: adapt。as-built 仕様を LLM が自由文で書くだけでは、「原文にない詳細を足す」失敗を避けられない。形式を絞り (入出力契約、不変条件、例外)、検証可能な断片は証明器やテストで検査する。SpecGen / AutoSpec の「LLM が提案、検証器が受理」は v4 の分離と同型。L8 の仕様は、実行で確認できる主張 (振る舞いテスト) と、確認できない自由文を区別して記録せよ。

### f-2. 古典: spec mining
- Daikon (Ernst et al., 不変条件の動的推論)、Houdini。 SpecGen の比較対象として登場。 [確認 (比較対象として)]
- 推奨: adopt (手法選択肢)。LLM 非依存の動的不変条件推論は、as-built の裏取り手段として安価。L8 の機械側の検査に加える案。
- 備考: mining で得た仕様は「観測された挙動」であり、欠陥も写る。d-1 と同じ警告が当てはまる。

---

## FR 別の早見表

| FR | 強まる / 挑戦される | 要点 | 推奨 |
|---|---|---|---|
| FR-013, FR-051, FR-024 | 強まる (e-1) と 挑戦 (e-2) | 自己選好の偏りで family 分離は妥当。だが別 family でも失敗は相関する | 維持。合意でなく反証と実行証拠で判定 |
| FR-031 | 強まる (d-3) | 外部信号なしの自己修正は弱い | 是正入力を FINDING か実行結果に限定 |
| FR-054, FR-065 | 強まる (a-1〜a-3, d-4) | テスト合格は弱い証拠。検収条件を先に固めるのは有効 | AT に mutation 検査と別 family の追加テストを付ける |
| FR-005, FR-027 | 強まる (a-6) | agent はテスト・採点を書き換える | 採点資源を worker の書込区分外に置く |
| FR-060, FR-061, FR-062 | 強まる (b-3, f-1, a-5) | LLM が提案し、検証器が受理。固定工程は有効 | 維持。JSON Schema 契約を境界の正本に |
| FR-064, FR-046 | 強まる (c-2) | 静的依存グラフ+RTS が定石。取りこぼしが偽の否定を生む | 観察モード先行。選択結果に graph 版を束縛 |
| FR-066, FR-067 | 挑戦 (d-1, f-1) | コードを正とする仕様は欠陥も写す | 設計との差分検出と明記。形式を絞り、検証可能な断片を分ける |
| FR-041〜045 | 部分的に強まる (e-1, b-1) | judge の偏りは実在。後続事実較正は先行研究が薄い | 較正指標は既存語彙を借りる。選好軸と良否軸を分ける |
| FR-058 | 強まる (b-1) | defeater と残存疑義の記録 | frozen 条件に未解決 defeater の記録を入れる |
| FR-055, FR-002, FR-033 | 強まる (a-7) | 境界を先に固定し、承認を減らす | 承認 UI より境界設計に工数 |
| FR-048, FR-065 | 慎重 (c-1) | LLM の link は 85% 前後。誤りが残る | link の主は宣言。LLM は候補提案のみ |

## 反対意見・導入時の失敗モード

- family 分離を強調しすぎると、「別 family なら独立」という誤った安心を生む (e-2)。文書に「必要条件であり十分条件でない」と書く。
- mutation を AT の必須条件にすると、equivalent mutant の判定で工数が膨らむ。ACH のように少数・目的限定にする。全面導入は avoid。
- GSN / SACM を全面採用すると、記法の学習と tooling が重い。v4 の「3 段の最小チケット」と衝突する。型を 4 つに絞る。
- 既存ルールとの衝突: 現行の cross-family review (exact-HEAD receipt) は本調査の方向と整合する。衝突は見つからなかった。ただし「合意で決めない」は、複数 reviewer の多数決を前提にした運用が将来入る場合に衝突する。
- 「SWE-bench の批判」はベンチマーク評価の話であり、社内開発の gate に直接は当たらない。示唆は「テスト合格の証拠力」に限る。数字の転用は avoid。

## 要追加調査 (未確認・空白)

1. OpenAI の SWE-bench Verified 監査の一次資料と数字 (a-4)。
2. SWE-bench Pro の問題を指す 2609.08149、failure independence の 2607.02808、self/other-label の 2608.18091 は、刊行から日が浅く原典未読。
3. Meta / Google の RTS 一次論文 (c-2)。
4. 要件 → コードの LLM traceability の実証研究 (c-1)。
5. coding agent の変更を継続的に再 evidence する assurance 研究 (b-3、空白)。
6. as-built 文書とコード由来仕様を直接扱う研究 (f-1、空白)。
7. mutation score と実欠陥検出の相関の効果量 (d-2)。
8. 人間の承認疲れの定量研究 (a-7)。出典なしの統計は使わない。

## 参考リンク (一次を優先)

- https://arxiv.org/abs/2410.06992 (SWE-Bench+)
- https://arxiv.org/abs/2503.15223 (Solved Issues, ICSE 2026)
- https://arxiv.org/abs/2506.09289 (UTBoost, ACL 2025)
- https://arxiv.org/abs/2407.01489 (Agentless, FSE 2025)
- https://metr.org/blog/2025-06-05-recent-reward-hacking (METR)
- https://docs.claude.com/en/docs/claude-code/sandboxing (Claude Code sandbox)
- https://arxiv.org/abs/2205.04522 , https://arxiv.org/abs/2405.15800 (Assurance 2.0)
- https://scsc.uk/scsc-141c (GSN v3) , https://www.omg.org/spec/SACM (SACM 2.3)
- https://arxiv.org/abs/2501.12862 (ACH, Meta, FSE 2025)
- https://arxiv.org/abs/2601.05542 , https://arxiv.org/abs/2410.21136 (LLM oracle)
- https://arxiv.org/abs/2510.23761 (TDFlow)
- https://arxiv.org/abs/2310.01798 , https://arxiv.org/abs/2306.09896 (自己修正)
- https://arxiv.org/abs/2404.13076 , https://arxiv.org/abs/2410.21819 , https://arxiv.org/abs/2306.05685 (judge の偏り)
- https://arxiv.org/abs/2607.02808 (LLM 版の失敗独立性、要確認)
- https://arxiv.org/abs/2401.08807 (SpecGen) , https://arxiv.org/abs/2404.00762 (AutoSpec)
