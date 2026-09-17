---
plan_id: PLAN-REVERSE-627-pack-publication-admitted-publish-backfill
title: "PLAN-REVERSE-627: admitted Pack公開 deny 境界の上位契約backfill"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-17
updated: 2026-09-17
owner: Claude control lane（契約起票、PO 判断 2026-09-16 の引き取り）・Codex Sol（非著者検収）
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: required
backprop_decision_reason: "#626 admitted record の seal 主体検証、approval consume 後の
  fail-close、CAS authority token の権限一軸 deny、pre-write drift の typed deny、最小
  publish receipt schema を、 staged release の上位 L6 before-state 契約と PLAN-L7-565
  §1.1/§3/§5 へ逆向きに戻し、main CAS の入力を保証する。"
parent_design: docs/plans/PLAN-L7-627-pack-publication-admitted-publish.md
pair_artifact: docs/test-design/harness/L7-pack-publication-admitted-publish-test-design.md
agent_slots:
  - role: tl
    slot_label: Codex Sol - L6 before-state CAS / approval 境界と L7 admitted publish
      の同値性を非著者検証
  - role: qa
    slot_label: Terra - 43 guard、indeterminate、write-zero、replay (remote 再観測 main /
      PR head)、consume 後 fail-close、token lifecycle、admission ledger provenance
      (genesis / journal event kind) の逆向き検証
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-627-pack-publication-admitted-publish-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-627-pack-publication-admitted-publish.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
    - docs/plans/PLAN-L7-625-pack-publication-preparation.md
    - docs/plans/PLAN-L7-626-pack-publication-admission-binding.md
    - docs/test-design/harness/L7-pack-publication-admitted-publish-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/627
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 627
admission_receipt:
  schema_version: v2
  receipt_id: certificate:1862f899c647045cd8a30b3813f6d5e1
  command_id: plan-revise:issue-627:pr650-reverse:r3:5270a2006cb5
  admitted_at: 2026-09-17T05:47:40.754Z
  source_digest: sha256:fe86425dc1209acb430bc716157ebbbd60bd787bf8124c8b8f2748adbde71919
  decision_digest: sha256:a5e15e58499f6557effb6176ee077fe412e13b3b2810c64070b30789b2c44dba
  receipt_digest: sha256:e3304ebf16b35ec1daec25ff0a0c4a4e3ff5fc6f16f846a4464d91a0e8ed7bde
  binding:
    path: docs/plans/PLAN-REVERSE-627-pack-publication-admitted-publish-backfill.md
    plan_id: PLAN-REVERSE-627-pack-publication-admitted-publish-backfill
    asset_id: plan:6e600c144f17d750eaf3b52c06b2f0e0
    revision: 3
    content_digest: sha256:fe86425dc1209acb430bc716157ebbbd60bd787bf8124c8b8f2748adbde71919
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 627
    episode_id: E4-627-pack-publication-admitted-publish
    projection_digest: sha256:17838960b78cd60f6009c493b62726f0aec6d8e92e0f74c8f3b67a6ccb1fd4d4
  origin:
    plan_id: PLAN-L7-627-pack-publication-admitted-publish
    revision: 3
    digest: sha256:056171d1ed255c76f14b0263924a080c2097e5b9ffca7b021cfa83ca94a47d42
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-REVERSE-627-pack-publication-admitted-publish-backfill
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #627 PR #650 rev 3: PLAN-L7-627 rev 3 (journal provenance
    の解決先 / kind、replay の PR head 軸、receipt digest 形状、chain の genesis 境界、43
    guard、candidate 71) と同期。旧 rev 2: PLAN-L7-627 rev 2 と同期。"
---

# PLAN-REVERSE-627: admitted Pack公開 deny 境界の上位契約backfill

## R0: gap

PLAN-L7-565 §1.1 は「admission 後に `pack_commit` が admitted reviewed head の main CAS だけを所有する」と
定め、§3 で CAS token を admission 完了後にだけ mint し、§5 で porcelain の実更新 status と atomic
no-clobber receipt を要求する。PLAN-L7-626 §2.3 は sealing 項目を admitted record に所有させ、approval
consume と CAS token mint を #627 に残し、rev 11 §4 で admitted record の persist 先 (admission ledger、
単一 writer、chain、admission journal provenance) を定めた。しかし上位契約には次が無い: (1) publish が
受け取る admitted record の seal 主体を、ledger の存在・bytes 一致・chain 整合・journal provenance の 4 段で
検証すること (署名の無い record を自己整合のまま偽造・ledger 外から挿入できる)、(2) record の strict
schema と record digest / bundle digest / intent identity / approval binding の再導出一致、(3)
configuration 期待値との publish 側での独立一致 (別 Pack への record 持ち込み)、(4) approval consume 後に
deny した場合の nonce の扱い、(5) CAS authority token の permission 過剰 / 不足 / installation 取り違えの
一軸 deny 語彙と、argv / stdout / journal / receipt の非漏洩、mint 後の全分岐 dispose、(6) CAS 直前の
main / PR head drift の typed deny、(7) 完全一致 replay に remote 再観測を伴うこと、(8) 最小 publish
receipt の member 集合。これらが無いと #627 の main CAS が admitted record 以外の入力で発火し得る。

## R1: 上位不変条件

- publish の入力は #626 admitted record ただ 1 つであり、その seal 主体は admission ledger (PLAN-L7-626 rev
  11 §4: append-only、writer は admission 実装のみ、sequence / previous record digest の chain) の resolve
  (identifiers → 唯一の record)、canonical bytes の一致、先頭から record までの chain 整合、admission
  journal `admission_observation` event との bundle digest 一致の 4 段で検証する。いずれかの不在 / 不一致は
  deny、ledger / journal の観測不能は indeterminate であり、署名・token・自己申告を seal の証明にしない。
- admitted record は identifiers / sealed / provenance / status の strict 4 群だけを持ち、record digest は
  canonical bytes から publish 側が導出する。observation bundle digest、publication intent identity、
  mutation approval binding は #626 と同じ導出関数で sealed 値から再導出し、記載値と byte 一致しなければ
  deny する。
- publish は configuration 期待値 (repository ID / full name、target ref、ruleset ID、required context
  集合、CAS installation ID) との一致を admission とは独立に検査する。admission 時に seal 済みでも、別
  configuration の Pack へ record を持ち込む経路を publish 側で閉じる。
- approval consume は PLAN-L7-565 §1.1 のとおり各 consume 直後に `planned_nonce_consumed` を append し、
  consume 後の deny / indeterminate で nonce を戻さない (fail-close)。再実行には新しい mutation approval を
  要し、preparation nonce 集合との交差、束縛先不一致、消費済み、期限切れ、空集合は各々独立の deny である。
- CAS authority token は全 approval consume 後にだけ fresh mint し、installation ID が record と一致し
  permission が Contents write だけである場合に限って使う。Pull requests write / Workflows write の付与は
  過剰、Contents write の欠落は不足として各々 deny し、token bytes を publication journal / receipt /
  result、argv、stdout / stderr / error のいずれにも出さず、mint 後は全 deny / indeterminate 分岐と成功時に
  dispose する。
- CAS 直前の read-only 観測で main OID = expected main、PR head = reviewed head を要求し、不一致は typed
  deny、観測不能は indeterminate、いずれも main write 0 とする。exact lease は record の E / H だけを入力とし、
  porcelain の実更新 status 1 件と post-read = H の両方が成立した場合にだけ成功とする。
- 完全一致 replay は、同一識別子・同一 intent identity・完全な journal 列に加えて、remote 再観測 (main = H、
  PR head = H) が一致した場合だけ receipt を再構成する。journal / receipt だけから成功を推測しない
  (PLAN-L7-565 §5)。remote drift は indeterminate。
- 最小 publish receipt の member は kind、operation ID、idempotency key、admission record digest、intent
  identity、expected main、reviewed head、post-read OID、actual-update status、consumed nonce 集合、journal
  chain digest だけであり、receipt digest は bytes から導出する。no-clobber、同一 bytes replay、別 bytes
  conflict、persist 失敗 indeterminate は PLAN-L7-565 §5 と同じ規則に従う。
- deny / indeterminate は Release / tag / asset / pointer / branch / PR の remote write 0 で終端し、main write
  は CAS 到達前 0、到達後は試行 1 を記録する。main CAS 後の release FSM は本契約の対象外である。

## R2: 逆向き証明

`PLAN-L6-63` の before-state CAS、操作単位 approval、auditor 観測、indeterminate 保持に対し、L7 admitted
publish の ledger 4 段検証、strict schema、再導出一致、configuration 一致、approval consume / fail-close、
token lifecycle、pre-write drift、replay の remote 再観測が同じ sealed operation の precondition である
ことを確認する。全 43 guard の deny と port unavailable の indeterminate は、上位 L6 が要求する副作用前の
write-zero (CAS 到達前) または単一試行後の write-zero (CAS 到達後) へ写像される。完全一致 replay だけは
同一 receipt bytes を再構成し、1 軸 drift は再利用ではなく新規 deny / indeterminate となる。

## R3-R4: 再合流

R3 で実装 PR の 71 candidate、対象テスト、exact-head CI、非著者 review を照合する。R4 で seal 主体の 4 段
検証、strict schema / 再導出一致、configuration 一致、consume 後 fail-close、token lifecycle、pre-write
drift、replay の remote 再観測、最小 receipt schema の不変条件を上位 staged-release contract
(PLAN-L7-565 §1.1/§3/§5、PLAN-L6-63) へ backfill する。Release / tag / asset / pointer、production ports、
CLI、既存 adapter の再構成はこの Reverse の責務外とする。

## 改訂記録

- rev 1 (2026-09-17、Claude control lane): PLAN-L7-627 rev 1 (36 guard、candidate 59) と同期して起票。
- rev 2 (2026-09-17、Claude control lane): PR #650 の非著者 Codex Sol review r1 (receipt `c03145cb…`) に合わせ、
  R0/R1 を PLAN-L7-627 rev 2 (admission ledger 4 段検証、replay の remote 再観測、token lifecycle 3 面 +
  dispose、39 guard、candidate 65) と PLAN-L7-626 rev 11 §4 に同期。
- rev 3 (2026-09-17、Claude control lane): PR #650 の非著者 Codex Sol review r2 (receipt `c99f948d…`) に合わせ、
  PLAN-L7-627 rev 3 (journal provenance の解決先存在 / kind、replay 再観測の PR head 軸、receipt digest 形状、
  ledger chain の genesis 境界、43 guard、candidate 71) に同期。
