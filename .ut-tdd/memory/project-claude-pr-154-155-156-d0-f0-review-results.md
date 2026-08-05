---
memory_id: memory:project:claude-pr-154-155-156-d0-f0-review-results
kind: project
title: "Claude回答: PR #154/#155/#156 (Issue #152分解 D0-N/F0a/D0-R) blind cross-review結果"
tags: ["claude", "cross-review", "pr-154", "pr-155", "pr-156", "node-cutover", "resource-kernel", "main-normalization"]
updated_at: 2026-07-24T13:55:00+09:00
---

Issue #152分解スライス3件の依頼メモ (branch上) への回答。全てauthor主張・旧PR #150/#151/#127/#135
結果・別系譜receiptを遮断したblind判定。PLAN status変更なし。

**PR #154 (D0-N, exact `0c010eed`) = FLAG (medium)** — issuecomment-5065962391:
Node control-plane設計本体は健全 (exact custody / receipt束縛=env偽装・cross-revision replay
fail-close / immutable generation+single atomic pointer swap / aggregate skip封鎖 / 原子境界docs
10件のみ / 実装artifact全ABSENT実測=設計Red真 / 偽Green記述なし)。**生存**: [medium] Bun ban
detectorがPLAN §1「分割しない」宣言・generates・L9 ST-NODE-CUTOVER-02でin-scopeなのにL4/L5/L6/L7
設計・test-design不在 (`CAND-BUNBAN-001..020`列挙0件、git grep NONE実測) — L4↔L9 trace切断。
[low] `CAND-NODEBOOT-009..012` dangling range / §4.1本文vs表不一致 / CAND↔U序数写像非復元。
是正=detectorの定義境界付き切り出し or L4-L7設計補完。

**PR #155 (F0a, exact `b1a5c350`+`81e78692`) = PASS (両レーン)** — issuecomment-5065973077:
exact pin実効 (npm ci前後sha256完全一致=lock再現性、実測node 24.13.0/npm 11.6.2/esbuild 0.21.5)、
manifest/lock parity健全、bun.lock変更はparity 1行のみでBun実行経路復活なし、原子境界5 files、
gate 21 passed + tsc exit 0を独立worktreeで再現。**申し送り**: [medium→F0b/F0c] pin非退行gate不在
(toolchain-pin lintはbiome専用、node/npm/esbuildのexact性を機械強制するgateが無い) — F0b/F0cで
必ず塞ぐ。[info] branch tipは`01f84d61`へ前進済み (`b141edd8` custody drift fix等) — merge対象を
tipにするならtip再確認要。

**PR #156 (D0-R, exact `2287f7d8`) = FLAG (moderate)** — issuecomment-5065964719:
中核は健全 (AC-RGK↔ST-RGK 15:15 / IT-RGK-PHYS 18件 / U-RGK 6 family一致、Rust=OS factのみ・
TS単一正本、sealed AdmissionToken・journal・receipt fail-close、署名bundle、原子境界+1416/-0で
Rust scaffold系譜外、mock流用なし、receipt未発行はIssue #153限定境界内)。**生存**: [moderate]
`U-RGK-PROTO-*`がPLAN-L7-454で宣言・AC化されるがL7 test-designに定義0件 (到達不能)。[moderate]
`rgk_section_status: red`参照先フィールドがPLAN-L4-32に不在。[low] Issue #134参照取り違え疑い。
是正=dangling ID 2件の定義追加or参照削除 (errata級)。

**2026-07-24 第2ラウンド delta re-review 完了 (是正HEAD)**:

- **PR #154 (product HEAD `050044ec`) = FLAG継続 (medium 2件)** — issuecomment-5066109525:
  low 2件 (CAND-NODEBOOT-009..012 / CAND↔U写像) は解消、frozen ID全降格で偽Greenリスク低減、
  退行なし。**残存**: [medium] detector trace断は本質未是正 (`CAND-BUNBAN-001..020`列挙依然0件、
  切り出しも補完もなし)。**新規**: [medium] activationモデル自己矛盾 — L4-33/L5/L6は
  append-only marker (pointer上書き=契約違反) へ移行したが `repository-structure.md:175` §10が
  旧「current pointer atomic swap」を保持 (portable commitの不完全編集)。
- **PR #155 (exact tip `8eb5a639`) = PASS維持** — issuecomment-5066119421:
  申し送りmediumは解消 — toolchain-pin gateがnode/npm/esbuild/packageManager/biomeのexact検査を
  実装、敵対range化全形態RED実測、doctor FULL profile経由でCI配線済み。npm ci/gate 25 passed/
  tsc全green、bun実行経路ゼロ、退行なし。F0aはレビュー観点でmerge条件成立 (残=main負債+#154収束)。
- **PR #156 (exact tip `88f36a37`) = FLAG継続 (moderate 1件のみ)** — issuecomment-5066119579:
  Finding 1 (U-RGK-PROTO) と3 (#134) は解消、bundle trust追加は強化 (U-RGK-TRUST-001..014双方向
  trace成立、IT-RGK-PHYS-001..022 unique実測)、退行なし。**残存**: [moderate]
  `rgk_section_status: red` の参照先不在 (L7-454:72→L4-32、定義0件) — この1件解消でPASS見込み。

**2026-07-24 delta確認 (第3ラウンド相当、機械確認)**:

- **PR #154 (HEAD `476ebc72`) = FLAG継続 (medium 1件)** — issuecomment-5066131453:
  B1 (§10 activation自己矛盾) は解消を機械確認 (repository-structure.md:175がappend-only marker
  モデルへ追随、stray「atomic swap」hit消滅)。CAND-NODEBOOT-010..016拡充は強化方向。
  **残存はFinding 1 (detector trace断) のみ**: `CAND-BUNBAN`は依然参照1 hit・列挙0件。
- **PR #155 (tip `21502c76`) = PASS維持、R1 (info) も解消** — issuecomment-5066131628:
  `npmIntegrity` sha512 pin + `npm-package-manager-integrity-mismatch` rule + 敵対テスト追加。
  F0a merge条件成立を維持。
- **PR #156 (tip `88f36a37`) = 変化なし**: [moderate] `rgk_section_status`参照先不在の是正待ち。

**2026-07-24 #154 detector是正確認 (HEAD `3f213236`) = PASS収束** — issuecomment-5066225850:
「定義境界付き切り出し」ルートで解消 — §1がProgram boundary化 (D0-N設計のみ、実装はF0a→F0b→
F0c→Q0)、L173「CAND-BUNBAN-*はD0-Nでは定義もfreezeもしない」明示、TDD orderからCAND-BUNBAN
除去、generates disclaim + Bun-ban final後続revision checkbox追加。activation admission fail-close
とlease永久fail-close化は強化方向。**#154はClaudeレビュー観点で収束 (残info級のみ)**。以後の
再レビューはsubstantive設計変更時のみ。

**2026-07-24 #154 cutover transition contract 独立再レビュー (exact HEAD `3f0d0ee9`) = PASS (両レーン)**
— issuecomment-5066624918: author自認FLAG (「独立再reviewまでFLAG維持」) を独立検証で解除。
genesis/chain契約 (重複genesis/巻き戻し/偽装をtyped error fail-close)、11-field receipt schema
L5一本化 (旧別名残骸は拒否文のみ)、canonicalization入力順非依存、owner一意性 (全候補ID単一owner、
skip/replay事前fail-close)、descendant closure化は緩和でなく過剰厳格の是正、ID trace双方向、
退行なし・原子境界docs-only維持。残存low 3件のみ。**D0-N再収束**。

**2026-07-24 #154 admission/trust/storage delta (exact HEAD `121afc17`) = FLAG (medium 1件)** —
issuecomment-5066791241: merge admission化=機械強制への強化 (緩和でない)、evidence真正性接続は
実在アンカー (EvidenceAttestationVerifierPort/EvidenceRecord)、SQLite CASは真のCAS (head_digest+
version二条件+affected-row検証、read-then-rename教訓合格)、CAND-CUTOVER-101..108双方向、
Issue #153縮小方向、退行なし。**生存**: [medium] 新規SliceAdmissionReceiptのd0-genesis入力接地
未閉包 — 「slice別registry」定義不在でdigest非決定 + D0 admission入力schema未定義 (cutover側
registry完備と非対称)。是正=per-slice required-input registryのL5固定。[low] harness.db共有
SQLITE_BUSYのliveness方針未明示 (fail-closeは維持)。medium解消でPASS収束見込み。

**2026-07-24 #154 evidence graph/ledger/backup delta (exact HEAD `601bd8ae`) = FLAG (medium 2 + low 4)**
— issuecomment-5067086840: 退行なし・前進方向だが、(1) [medium・未解消] SliceAdmission d0-genesis
接地はdelta対象外で前回のまま (slice別registry未定義)。(2) [medium・新規] **cutover ledgerの
harness.db内canonical source化がアーキ正本と未整合** — rebuild除外が正本registry
(physical-data.md §2.7/§9) に未登録で、「DB=projection」中核不変条件へのcarve-outが正本側に無い。
アーキ新例外としてPO可視の設計判断記録を推奨。(3) [low-med] backup/recovery/migrationのfail-close
がoracle未束縛+backup消失時復旧不能trade-off未文書化。(4) [low] evidence refsのordinal連続性/
重複child/edge_kind domain未閉包。(5) [low] 11-field化のL6未伝播。(6) [low・未解消] SQLITE_BUSY
liveness。

**2026-07-24 #154 delta `4e1add6e` 機械確認 = FLAG継続** — issuecomment-5067163943:
identity一本化・issuer_key_id削除・backup oracleのL7-L9降下は前進 (low系へ対処)。しかし
**medium 2件は3ラウンド連続未接触** (L5:415-427 hunkなし、physical-data.md無変更をdiff/grepで
機械確認)。この2件解消までFLAG維持、解消時に新規追加分含め正式再レビュー。PRコメントで
スコープ収束宣言 (残medium是正を最終ラウンドに、以降は後続revisionへ) を要請済み。

**2026-07-24 #154 registry/ledger分離 delta (exact HEAD `f20a1bc4`) = PASS収束 (両レーン)** —
issuecomment-5067500354: medium 2件とも実体解消。#1=`NODE-SLICE-INPUT-REGISTRY-v1`が実src型
(tracked-receipt-projection.ts/diff-fence.ts/evidence-types.ts) と突き合わせ検証済み、not_verified
だけではD0 eligibility不成立のfail-close接地。#2=ledgerをharness.db外へ物理分離
(`.ut-tdd/ledger/cutover-ledger.db`等、physical-data §2.7.1)し「DB=projection」不変条件維持。
追加攻撃 (trust/plan scope/supersedes dangling) 全REFUTED、退行なし。残存low 2 + defer 1のみ。
**D0-NはClaudeレビュー観点でPASS収束**。以後の再レビューはsubstantive設計変更時のみ。

**2026-07-24 #154 preimage/L6-trust delta (exact HEAD `2d228fc4`) = PASS (両レーン)** —
issuecomment-5067795421: **重要 — 本deltaは前ラウンド(f20a1bc4、Claude PASS)に潜んでいた
fictional bindingを訂正**。旧記述はEvidenceAttestationを`{authorityId,keyVersion,signature,
producer,recordDigest}`としていたが、実src (evidence-types.ts:85) の真の型は5 field
`{schemaVersion,algorithm,authorityId,keyVersion,signature}`でproducer/recordDigestは
`EvidenceAttestationInput`(verify input)。前回の私の確認が実型Readまで踏み込めず見逃した。
本deltaが実型へ訂正=fidelity向上。preimage tuple全て決定的(length-frame+SHA-256)、
新edge`design.l6-confirmed`でcutover genesisにL6 confirmed fail-close強制、退行なし。
**教訓: 「実型と一致」主張は必ずsrc Readで裏取りする** (subagentの型記憶を鵜呑みにしない)。

**2026-07-24 実リポジトリ修正 (PR外・main直)**: ledger分離(§2.7.1)で`.ut-tdd/ledger/`に
canonical DBが置かれるがgitignoreルール皆無 → `harness-ledger.db`(344KB、将来GB級)が
untracked+unignoredの誤commit footgun。main `8a343291`で`.ut-tdd/ledger/*.db`(+sidecar)
ignore追加済み。後続cutover-ledger impl PRのDoDにgitignore義務を明示計上要請済み。
ledger分離はsecurity境界でない(改竄耐性=署名+CASのみ、path分離はfault-isolation価値のみ)。

**2026-07-24 #154 AttestedReceiptEnvelope model delta (exact HEAD `eaace387`) = PASS (両レーン)** —
issuecomment-5068068760: generic envelope wrapper導入(参照はouter envelope digest、core digestは
record整合性のみ、bare core参照grep 0件)、tracked_record_digest一致制約、cutover trust締め。
**receipts.json全28 record_digestを独立再算出→全一致(非tautology実証)**、実src型Read突き合わせ全一致、
退行なし。残存low/infoのみ。zod schema(node-slice-admission.ts/cutover-transition.ts)はsrc未実装=
後続impl PRが生成しdocと exact一致させるのが受入条件。

**#154スコープ注記 (PO判断待ち)**: cutover→admission→trust→ledger→preimage→envelope→policy registry
とsubstantive設計拡張が連続13ラウンド。各ラウンド品質は確認・退行なしだが、Codex側がdesign freeze
収束点を宣言しない限りmerge到達しない(+main負債CI赤)。PRコメント+本メモでfreeze要請済み。

**2026-07-24 #154 GitObjectId/policy registry delta (exact HEAD `c0b96c0d`) = PASS (機械検証レベル)** —
issuecomment-5068270088: **今回はフルOpus敵対レビューでなく自身のtargeted機械検証**(13ラウンド目・
全PASS・docs-only・merge不能のため限界効用低下、退行/構造/整合検証へ切替)。GitObjectId正準型+拒否規約、
4新規D0入力(BootstrapPolicy/AdmissionTime/BootstrapPolicyEvent/FrozenCaseRegistry)のproducer/registry/
envelope格納、admission_time_envelope_digest伝播、退行なし、receipts.json 36 record seq連続・linkage 0失敗
を確認。digest独立再算出は今回未実施(前ラウンドrecord 1-28で実証済み、新規8件は同一pattern+linkage健全)。
**運用方針: #154の以後のdocs-only設計delta はtargeted機械検証を既定とし、フル敵対レビューはmerge接近時
or疑わしい所見時に実施**(fable5判断、token効率と実質レビューの両立)。

**残待ち (Codex側)**: #156の`rgk_section_status`是正 (moderate 1件、解消でPASS見込み)。
#154/#155はレビュー収束済み。全PR共通のmerge ブロッカーはmain負債merged-plan-status 2件
(L7-452/RECOVERY-16 confirm、Codexレーン)。
**PO注意**: #154はround毎に設計スコープが拡大し続けており (cutover→admission→trust/storage→
ledger/backup)、design freezeの収束点宣言が無いとmerge可能状態に到達しない。
main負債merged-plan-status 2件 (L7-452/RECOVERY-16 confirm) は依然全PR共通ブロッカー。
#154/#155は設計/toolchainレビュー成立済み — 負債解消 + draft解除 + CI green後にClaudeが
merge→合流後安全確認を実施する。
merge条件成立後はClaudeがmerge→合流後安全確認を実施 ([[po-claude-pr-merge-responsibility-and-post-merge-safety]])。
main負債merged-plan-status 2件 (L7-452/RECOVERY-16 confirm) は引き続き全PR共通ブロッカー
([[codex-request-unblock-merged-plan-status-debt]])。

---

**2026-07-24 第3ラウンド delta re-review (30m loop cycle)**:

- **#154 (D0-N) `c0b96c0d`→`9d5ace1a` = FLAG→PASS-WEAK 相当 (medium 0 / low 1)**
  (issuecomment-5068463388): `42ffde8b withdraw temporary bootstrap productization` で
  over-engineering 肥大を撤回 — D0 registry 5 gate 除去(Bootstrap系4+FrozenCaseRegistry)、
  SliceAdmission core から admission_time_envelope 除去、mutable Q0-CASE-REGISTRY を immutable
  CASE-MANIFEST-v1 (runtime mutable API=0) へ、producer map 21→18。**撤回 10 識別子の
  docs/src/tests dangling 参照 0 files を実測**、receipts.json 42 record parse clean・linkage 0破綻。
  **前ラウンド medium 2件解消**: §10 activation 自己矛盾(repository-structure:175 が append-only
  marker へ追随)、detector trace(L7-458 が 8 scanner+Inventory/DeltaGuard/CompliancePolicy を
  短い pure object で設計補完 → low へ格下げ)。残 low = CAND-BUNBAN-001..020 case table 未列挙。
  **設計が over-engineering 方向から反転・縮約された** (13ラウンドの freeze 要請が結実)。
- **#155 (F0a) `8eb5a639`→`21502c76` = PASS 維持** (issuecomment-5068467187):
  `21502c76 pin reviewed npm integrity` が前ラウンド informational(packageManager integrity 存在検証のみ)
  を最小コードで解消。npmIntegrity pin + `npm-package-manager-integrity-mismatch` violation(else if で
  missing と排他)+ negative test。**pin digest = branch package.json 実 digest 一致で baseline GREEN 実測**。
  src+test 16行に閉じる最小 delta。残 informational = TOFU model(registry 真正性は corepack/F0b 責務、defer)。
- **#156 (D0-R) は `88f36a37` のまま未変化** — 前ラウンド moderate 1件(`rgk_section_status: red` 参照先不在)
  未是正。Codex 側是正待ち。
- **共通 merge ブロッカー不変**: main 負債 merged-plan-status 2件(L7-452/RECOVERY-16 confirm、Codexレーン)。
  解消 + CI green + draft解除後に Claude が merge→合流後安全確認を実施
  ([[po-claude-pr-merge-responsibility-and-post-merge-safety]])。

---

**2026-07-24 第4ラウンド delta re-review (30m loop cycle 2)**:

- **#154 (D0-N) `9d5ace1a`→`7cb638a0` = PASS-WEAK 維持 (medium 0 / low 1、new medium なし)**
  (issuecomment-5068688087): 縮約保持を実測 — D0 top-level registry 2 row のまま(再拡大なし)、
  前サイクル撤回 id は dangling 0 維持、receipts.json 50 record parse clean。本 delta の追加 3件は
  **要件駆動で over-engineering でない**と判定: (1) `CandidateAuthorshipReceipt` (candidate-custody-gate)
  = 自己申告 author 廃止→provider-attested + author/reviewer disjoint fail-close 強制 = blind-review
  integrity という falsifiable 要件駆動、ReviewBundle nested ref 配置=最小、(2) ReceiptDigest/ContentDigest
  型分離=prefix 混同拒否、(3) cutover 物理 DDL (STRICT+CHECK+generated subject)=抽象→具象の必要仕様化。
  残 low = CAND-BUNBAN case table 未列挙(不変)。
- **#155/#156 は前サイクルから未変化** (#155 `21502c76` PASS 済、#156 `88f36a37` moderate 未是正=Codex待ち)。
- **共通 merge ブロッカー不変**: main 負債 merged-plan-status 2件(L7-452/RECOVERY-16 confirm、Codexレーン)。
- 所感: #154 は第3ラウンドの withdrawal 以降、縮約方向を保ちつつ要件駆動の追加のみ。最小実装原則の観点でも
  各追加が「どの falsifiable 要件から来るか」に答えられており健全。

---

**2026-07-24 第5ラウンド delta re-review (30m loop cycle 3)**:

- **#154 (D0-N) `7cb638a0`→`b18c9918` = PASS-WEAK 維持 (medium 0 / low 1) + 設計判断確認 1件**
  (issuecomment-5068961859): 新型 2種追加 `SessionIdentityReceipt`(provider署名=trust root終端)+
  `WorkProvenanceEventReceipt`(git history chain-only再導出=ground truth終端)。前サイクル PASS した
  disjoint 検査は author set が自己申告のままでは無意味(coding≠substance)なので、これを非詐称化する
  **要件駆動の追加**と判定。attestation graph は git履歴+provider署名の2終端rootで底打ちし無限後退なし。
  機械整合 clean(D0 registry 2 row維持、evidence_type enum統合、receipts.json 58 record parse clean、
  撤回id dangling 0)。**light 確認提起**: authorship-provenance は2サイクルで3 receipt型に成長、
  この3型全てをD0 freeze specに含めるか leaf 2型をF0実装revisionへdescendさせるかCodex/PO明示依頼
  (最小実装原則: freeze時点の必要から来ない詳細は後続へ送る余地)。残 low = CAND-BUNBAN未列挙(不変)。
- **#155/#156 未変化**。
- **共通 merge ブロッカー不変**: main 負債 merged-plan-status 2件(L7-452/RECOVERY-16 confirm、Codexレーン)。
- 累積所感: #154 は withdrawal 後、要件駆動の attestation 深掘りが3サイクル連続。個々は grounded だが
  D0 freeze の深さ線引きが未宣言。merge到達には design freeze 収束点の宣言が依然必要。

---

**2026-07-24 第6ラウンド delta re-review (30m loop cycle 4)**:

- **#154 (D0-N) `b18c9918`→`037e9201` = PASS-WEAK 維持 (medium 0 / low 1)。trust model 正当性修正+過剰設計撤回**
  (issuecomment-5069289587): (1) **自己訂正** — 第5ラウンドで SessionIdentity を「provider署名=trust root終端」と
  PASS したが外部provider(OpenAI/Anthropic)は session を署名しない fictional 前提だった。今回修正。教訓
  「前提/実型一致の主張は裏取り」該当。(2) fictional 前提除去→UT-TDD managed delegation の ManagedSessionAttestation
  (ed25519 static key)へ。(3) Codex 自発の `retract managed trust overdesign` — append-only snapshot chain+rotation+
  compromise-history の PKI 的機構を撤回、静的 closed 3-row registry(codex/claude/human)へ。(4) rotation は
  「v1 で 0、将来は別 additive PLAN+registry v2 を review/admit 後」と fail-close deferral 明示=最小実装原則どおり。
  機械整合 clean(D0 registry 2 row、receipts.json 66 record parse clean、撤回機構は dangling でなく deferral 宣言)。
  → 第5ラウンドの attestation 深さ懸念は Codex 自発の overdesign 撤回+fictional root 修正で収束方向。
  trust model は「より正しく・より小さく」。残 low = CAND-BUNBAN 未列挙(不変)。
- **#155/#156 未変化**。
- **共通 merge ブロッカー不変**: main 負債 merged-plan-status 2件(L7-452/RECOVERY-16 confirm、Codexレーン)。

---

**2026-07-24 第7ラウンド delta re-review (30m loop cycle 5)**:

- **#154 (D0-N) `037e9201`→`0ec01421` = PASS (実コード delta を独立実走で検証)**
  (issuecomment-5069564187): 初の実コード delta(2 CI-red 修正)。docs-only 扱いを外し実走。
  **CI-red 1: db-projection-coverage parser** (`src/lint/db-projection-coverage.ts` +17 / test +4): §2.7.1
  canonical ledger ファイル registry を §2.7 harness.db projection table 行として誤継続解析した false Red を、
  `inProjectionTable` state 機(projection table header 契約で境界化)で塞ぐ。テスト 4件は敵対ガード込み
  (ケース3=header 内 .db path 保持、ケース4=別 section .db table 保持 → 「.db 一律除外」hack を排除)。
  **独立実走: detached worktree + 正規 snapshot runner で 12/12 green**(Codex「9/9」を裏取り、fingerprint 検証 pass)。
  **CI-red 2: Forward PLAN route metadata**(L4-02/L5-03/L6-01 frontmatter only): #154 が付与した route_mode=forward
  (SSoT 未登録)による route_mode_kind_mismatch 3件を、設計本文を変えず route_mode=redesign へ正規化+supersedes
  back-ref を正規 plan revise で修正(scope creep でなく自己起因 Red 緑化)。managed-trust overdesign 撤回も確定。
  残 low = CAND-BUNBAN 未列挙。**CI checks は新 tip 0ec01421 で実行中(未完了)→次サイクルで完走確認**。
- **#155/#156 未変化**。
- **共通 merge ブロッカー不変**: main 負債 merged-plan-status 2件(L7-452/RECOVERY-16 confirm、Codexレーン)。
- 教訓再確認: 実コード delta は snapshot runner 経由で独立実走する(codex green 鵜呑み禁止)。#154 は bun.lock のみ
  (package-lock.json 未追跡)なので worktree では bun install→snapshot runner が実走経路。

---

**2026-07-24 第8ラウンド delta re-review (30m loop cycle 6)**:

- **#154 (D0-N) `0ec01421`→`c14681bf` = PASS (実コード、独立実走 28/28 green) + refactor 観察1**
  (issuecomment-5069816694): **前ラウンドの私の見落とし訂正** — 前回 PASS した +17行 state 機は単一test 12/12 通ったが
  実 physical-data.md への full gate で linux CI FAILURE のままだった(私のtestが実反例を捕らえていなかった)。本 delta
  (`src/lint/db-projection-coverage.ts` +193 / test +430)がその残 leak を閉塞: GFM separator `:---`、fenced code 内
  table 誤認、backtick別schema header 非境界、outer-pipe省略/escaped `\|`、論理descendant 9.3.1 scope脱落。修正は
  `header->separator->data rows` state machine + 節番号logical descendant優先。**外部依存・全面MD parser未導入**(import差分0)。
  **oracle 強化**: 弱い checkedIndexes>=41 下限を撤回→正本独立転記の 54 index+56 table ID 全件順序 exact assertion
  (theater oracle→実set-equality)。**独立実走 28/28 green**(snapshot runner、exit0、Codex「19/19」裏取り)。
  **[info refactor candidate]** strict-markdown-table.ts(parseStrictMarkdownTable、strict別性質)と md-table tokenize
  併存だが共有tokenizer不在・rule-of-three未達で今の共通化は投機→3例目で共有GFM tokenizer抽出検討(後続revision)。
  残 low = CAND-BUNBAN未列挙。
  **教訓: 単一ファイルtest greenでも実gate(full doc)で落ちうる。実lint fixは可能なら実正本入力で確認する。**
- **branch tip は既に `8b339ec7 fix(lint): narrow projection parser grammar` へ前進**(同parser follow-up、CI実行中)。
  次サイクルで CI 完走後にレビュー。
- **#155/#156 未変化**。**共通 merge ブロッカー不変**: main 負債 merged-plan-status 2件(L7-452/RECOVERY-16 confirm)。

---

**2026-07-24 第9ラウンド (30m loop cycle 7) — linux 赤の実原因確定 + 負債 escalate**:

- **重大診断**: #154 linux CI FAILURE の実原因を CI ログ実測で特定 = **parser でなく main 負債 merged-plan-status**。
  `doctor.test.ts > U-TESTHYGIENE-028` の唯一失敗が `PLAN-L7-452` (status=draft, deliverable merge済) +
  `PLAN-RECOVERY-16` (同) の 2 violation。#154 自身は db-projection-coverage(25)/review-evidence/projection-writer(35)
  全緑、route_mode 解消済、windows SUCCESS。→ **#154/#155/#156 の merge blocker は自 PR 内容でなく main 負債の
  confirm 一本に確定**(issuecomment-5069816694 系に PR コメントで明示、pr154-r9)。
- **deferred `c14681bf`→`8b339ec7` (narrow projection parser grammar)** = -38 net の簡素化、CI 上 parser test 緑(25)
  で独立検証済み。過剰化でなく縮約方向。
- **負債 confirm の所有が未決**: L7-452(add-impl)/RECOVERY-16(recovery) は status=draft のまま deliverable merge済。
  doctor は confirm+review_evidence 要求。誰が confirm するか(Claude 非author レーンが cross review_evidence を出すか、
  Codex レーンか)は PO 判断事項として escalate。~8 サイクル無動。
- **#155/#156 未変化**。

---

**2026-07-24 第9ラウンド続き (cycle 7) — #156 前進レビュー**:

- **#156 (D0-R) `88f36a37`→`f5f45832` = 前回 moderate 解消 + 新規 design-language FLAG 1件**
  (issuecomment に投稿): 前回 moderate `rgk_section_status: red` 参照先不在は branch 全体 0 参照で解消、L7-454 は
  実在アンカー(L4-32 status/AC-RGK-01..15/ADR-009)へ redirect(remediation b)。f5f45832 は RGK PLAN chain の
  clean formal admission(frontmatter+admission_receipt v2+supersedes+route:redesign、設計本文不変、#154 route-metadata
  と同型)。**新規 FLAG[low・errata・CI赤一因]**: architecture.md:260 見出し `## §10 Resource Kernel native custody`
  が design-language gate に fail-close(「native custody」英語prose見出し、導入=#156 の 2287f7d8)。是正=見出し日本語化。
  **#156 linux CI は 2 系統失敗**: (a) main 負債 merged-plan-status(#156 起因でない共通ブロッカー)+(b) 本 design-language
  (#156 スコープ)。両方要修正。windows SUCCESS。
- **PO 設計判断依頼(負債 confirm 所有 A/B/C)は未返答 → confirm 着手せず待機継続**。
- **#154 tip 8b339ec7 / #155 未変化**。

---

**2026-07-24 第10ラウンド (cycle 8) — #156 rev4、3 PR が負債 1点へ収束**:

- **#156 (D0-R) `f5f45832`→`a77b5cc4` (rev4) = 前回 FLAG 解消 + clean minimalism 簡素化**
  (issuecomment 投稿): design-language english-heading (architecture.md:260) を日本語化 → **CI 実測で design-language
  violation 消滅**、linux 失敗は merged-plan-status のみへ収束。rev4 実質変更: (1) D0-R merge scope を budget/custody/
  capability/receipt/signed-bundle に限定し DB rebuild/CAS/queue-headroom/performance を Issue #152 later wave へ defer
  (D0-N 責務を再所有しない境界明示)、(2) trust model 簡素化 = BundleActivationLog/TrustedClockPort/ClockAnchor/
  BundleManifestSignedPayload の rotation/revocation/clock apparatus 撤去 → TrustDecisionPort+manifest binding
  (#154 managed-trust 撤回と同型)。**機械整合 clean**: 撤去 4 apparatus の dangling 0 files、TrustDecisionPort は
  L4/L5/L6/L9 5層伝播、receipts.json 86 record parse clean。生存 finding なし。
- **重要収束**: #154/#155/#156 の **3 PR すべてが content CI-clean、残ブロッカーは main 負債 merged-plan-status
  (L7-452/RECOVERY-16 confirm) の 1 点のみ**へ一本化。
- **PO 設計判断依頼(負債 confirm 所有 A/B/C)は依然未返答 → confirm 着手せず待機**。#154 tip 8b339ec7 / #155 未変化。
