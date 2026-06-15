---
schema_version: skill.v1
name: system-design-sizing
skill_type: design-contract
applies_to:
  layers: [L1, L2, L3]
  drive_models: [Forward, Discovery, Scrum, Add-feature]
upstream: vendor/helix-source/skills/agent-skills/system-design-sizing
---

# System Design Sizing

> Upstream attribution: donnemartin/system-design-primer (MIT)
> Reference: https://github.com/donnemartin/system-design-primer

## Overview

Estimate the scale, scalability, and capacity requirements of a system in the early design stage. This skill provides procedures for capacity planning, bottleneck identification, and trade-off analysis, then maps the results into UT-TDD L2 design artifacts. Back-of-the-envelope calculation is not precise — it is a reality check to catch design mistakes before they reach the detailed design stage.

## When to Use

- L1-L2: fixing scale and design direction early in a new system
- When quantitative requirements appear in discussion: "1M users," "10k QPS," "99.9% availability"
- Explaining the selection rationale for DB, cache, queue, or load balancer
- Evaluating scale limits or the next bottleneck of an existing system
- Combining with `api-and-interface-design` to make both boundary design and load tolerance design targets
- Organizing performance hypotheses at the design level before `performance-optimization`

**When NOT to use:**

- Only a change-size estimate is needed: use `ut-tdd plan lint` sizing instead
- Main goal is measurement and tuning after implementation: use performance profiling
- API contract stability is the primary subject: use `api-and-interface-design`

## Core Process

### Step 1: Clarify Use Cases, Constraints, and Assumptions

First, put numbers on "who / what / how much." At minimum, document: DAU, peak concurrent connections, read-write ratio, data retention period, availability target, and consistency requirements.

- Who: internal users / public consumers / batch workers / operators
- What: read-heavy feed / write-heavy transaction / search / analytics / messaging
- How much: DAU, peak QPS, object size, retention days, RPO, RTO
- Assumptions: traffic burst factor, cache hit ratio, replication lag tolerance

### Step 2: High-Level Design

Roughly place major components, and describe traffic and data flow in text or a diagram. At this stage, prioritize making SPOFs and responsibility boundaries visible over precision.

Typical sketch:

```text
Client -> DNS -> CDN -> Load Balancer -> App -> Cache -> DB
                                      -> Queue -> Worker -> Object Storage
```

### Step 3: Deep Dive Core Components

For areas where load concentrates, decide on DB selection, cache strategy, async processing, and load balancer layer. Do not optimize everything — judge in order from the component with the dominant cost.

- DB: is strong consistency required? Is horizontal partitioning needed?
- Cache: reduce read latency, or relieve DB load?
- Async: shorten user-facing latency, or smooth out bursts?
- Load balancing: is L4 sufficient, or is L7 routing control needed?

### Step 4: Identify Bottlenecks and Select Scaling Strategies

Decompose bottlenecks into "CPU / memory / disk IOPS / network / lock / coordination / third-party dependency," then decide for each whether to scale vertically or horizontally, synchronously or asynchronously, and how much to reduce consistency.

- Read bottleneck: CDN / cache / replicas / denormalization
- Write bottleneck: sharding / queue / batching / partitioning
- Coordination bottleneck: id generation / leader election / lock contention
- Availability bottleneck: replication / fail-over / multi-region

## Capacity Planning

### Powers of Two

| Unit | Approx Bytes | Exact Power of Two |
|------|--------------|--------------------|
| 1 KB | 10^3 | 2^10 = 1,024 |
| 1 MB | 10^6 | 2^20 = 1,048,576 |
| 1 GB | 10^9 | 2^30 = 1,073,741,824 |
| 1 TB | 10^12 | 2^40 = 1,099,511,627,776 |

### Latency Numbers Every Programmer Should Know

| Operation | Typical Latency | Relative Order |
|-----------|-----------------|----------------|
| L1 cache reference | 0.5 ns | fastest |
| Branch mispredict | 5 ns | slightly slower than L1 |
| L2 cache reference | 7 ns | CPU cache |
| Mutex lock/unlock | 100 ns | in-process sync |
| Main memory reference | 100 ns | RAM |
| 1 KB over 1 Gbps network | 10 us | local network transfer |
| SSD random read | 150 us | storage |
| Send packet same datacenter | 500 us | intra-DC network |
| Disk seek | 10 ms | HDD class |
| Round trip US-EU | 70-150 ms | WAN |

### QPS / Bandwidth / Storage Calculation Example

Example: rough estimate for a Twitter-like service with 1M DAU.

- 1M DAU
- 1 user/day = 10 reads, 2 writes
- Daily reads = 10M, daily writes = 2M
- Average read payload = 20 KB, write payload = 2 KB
- Peak factor = 5x

```text
Average read QPS  = 10,000,000 / 86,400  ~= 116
Peak read QPS     = 116 * 5              ~= 580
Average write QPS = 2,000,000 / 86,400   ~= 23
Peak write QPS    = 23 * 5               ~= 115

Peak read bandwidth  = 580 * 20 KB ~= 11.6 MB/s
Peak write bandwidth = 115 * 2 KB  ~= 230 KB/s

Daily storage growth = 2,000,000 * 2 KB ~= 4 GB/day
Annual raw storage   = 4 GB * 365       ~= 1.46 TB/year
Replicated x3        = 4.38 TB/year
```

Conclusions from these numbers:

- Even at moderate QPS, storage grows quickly with retention and replica factor
- Read-heavy workloads make cache/replica cost-effective
- Even low write volume can cause internal write amplification depending on fan-out strategy

## Performance vs Scalability vs Latency vs Throughput

### Definitions

- Performance: speed and efficiency from a single request or single user perspective
- Scalability: ability to maintain or gracefully degrade performance as load increases
- Latency: time to complete one request
- Throughput: amount of work processed per unit time

### Key Judgment

"Slow for a single user = Performance problem." "Slow under high load = Scalability problem." They are related but not the same. Even a low-latency implementation may not scale if shared resource contention is high.

### Trade-off Table

| Focus | Improvement | Gain | Cost |
|------|-------------|------|------|
| Latency | cache, CDN, precompute | reduced response time | consistency, complexity |
| Throughput | batching, async, queue | total processing capacity | individual latency |
| Performance | algorithm, indexing, hot path optimization | single-request efficiency | implementation cost |
| Scalability | sharding, stateless app, partitioning | load expandability | operational complexity |

## CAP Theorem and Consistency Patterns

### CP / AP Selection Criteria

| Choice | Suitable Cases | Typical Decision |
|--------|----------------|------------------|
| CP | payment, inventory, no-duplicate, permission judgment | stop some operations during partition to preserve consistency |
| AP | SNS feed, analytics, recommendation, activity log | tolerate temporary inconsistency to continue responding |

### Consistency Patterns

| Pattern | Description | Suitable Cases |
|---------|-------------|----------------|
| Weak | no guarantee of reading latest on read | counters, view counts |
| Eventual | converges over time | feeds, caches, replicas |
| Strong | write visible immediately on subsequent read | balances, inventory |

### Availability Patterns

| Pattern | Variants | Characteristics |
|---------|----------|-----------------|
| Fail-over | Active-Passive / Active-Active | increases continuity during failure |
| Replication | Master-Slave / Master-Master | improves availability and read scaling |

### Availability Calculation

```text
Series availability   = A1 * A2 * A3
Parallel availability = 1 - ((1 - A1) * (1 - A2))
```

Example:

```text
Two nodes, each 99.9% available:
Parallel = 1 - (0.001 * 0.001) = 0.999999 = 99.9999%
```

This is an approximation assuming independent failure; do not use this number directly when common failure causes exist.

## Architecture Components

| Component | Options | Primary Use | Main Trade-off |
|-----------|---------|-------------|----------------|
| DNS | Round-robin / Geo-based | endpoint routing, regional routing | health check granularity is coarse |
| CDN | Push / Pull | static delivery, edge cache | invalidation and consistency management |
| Load Balancer | L4 / L7 | connection distribution, TLS, routing | L7 is powerful but higher cost |
| Reverse Proxy | SSL termination / static serving | connection aggregation, static delivery, header control | additional hop, config complexity |
| Application Layer | Monolith / Microservices / Service Discovery | business logic isolation | distributed systems increase operational cost |
| Database | RDBMS / NoSQL | persistence, search, consistency | trade-off between flexibility and consistency |

## Database Scaling Patterns

### Representative Patterns

- Master-Slave Replication: write on primary, read scaling via replicas
- Master-Master Replication: multi-writer, high availability, but conflict resolution is difficult
- Federation: separate DBs by function, clarify responsibility boundaries
- Sharding: horizontally partition data by key, distribute writes and capacity
- Denormalization: reduce joins to speed reads, accept write complexity

### SQL vs NoSQL Decision Table

| Criterion | SQL | NoSQL |
|-----------|-----|-------|
| Schema | stable, strict, strong relationships | variable, sparse, rapidly changing |
| Transactions | many, strict | limited, eventual consistency acceptable |
| Query | ad-hoc, many joins | key-value, document, wide-column |
| Scale | vertical + replica sufficient | early horizontal scale needed |
| Consistency | strong required | eventual acceptable |

## Caching Strategies

| Strategy | Characteristics | Trade-off | Use |
|----------|-----------------|-----------|-----|
| Cache-Aside | app fetches from DB on miss, stores in cache | miss latency, stale management | read-heavy general purpose |
| Write-Through | update cache and DB simultaneously on write | write latency increase, easy consistency | read after write priority |
| Write-Behind | write to cache first, DB later | data loss and consistency delay risk | write burst absorption |
| Refresh-Ahead | pre-fetch before expiry | unnecessary updates increase | hot key latency stabilization |

## Async and Messaging

Synchronous processing directly couples user latency with backend load. Async increases throughput and fault tolerance, but adds ordering, retry, deduplication, and monitoring responsibilities.

- Message Queues: Redis, RabbitMQ, Amazon SQS
- Task Queues: Celery
- Back Pressure: detect when inflow exceeds consumer capacity, design drop / retry / throttle / shed load

Selection criteria:

- Redis: lightweight, low latency, simple queue
- RabbitMQ: business processing requiring routing and ack
- Amazon SQS: managed preference, reduce operational load

## Communication Protocols

### TCP vs UDP

| Protocol | Characteristics | Use |
|----------|-----------------|-----|
| TCP | reliable, ordered, connection-oriented | HTTP, DB, internal RPC |
| UDP | low overhead, unordered, connectionless | streaming, gaming, telemetry |

### HTTP Verb Idempotency

| Method | Idempotent | Notes |
|--------|------------|-------|
| GET | Yes | read-only |
| PUT | Yes | full replace |
| DELETE | Yes | repeated delete should converge |
| POST | No | create / action |
| PATCH | No | partial update, repeated apply may differ |

## UT-TDD Integration

In the UT-TDD V-model, this skill produces the `D-ARCH` artifact at L2 (overall design). The sizing results (QPS estimate, storage projection, component diagram, bottleneck list, CAP trade-off) are embedded in the L2 design document and referenced by the L3 API contract and DB design. If API boundary design is the main discussion point, combine with `api-and-interface-design`. For actual measurement and tuning after implementation, use performance profiling.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "No need for scale design at MVP stage" | Redesign cost in production is higher than initial design. Minimum sizing is necessary upfront. |
| "The cloud will auto-scale" | Auto-scaling is not a substitute for bottleneck analysis. DB, locks, and downstream dependencies don't auto-resolve. |
| "Few users now, think later" | Data model and consistency decisions are expensive to change later. |
| "Adding cache will make everything fast" | Cache can hide latency, but increases consistency and invalidation complexity. |
| "Microservices will scale" | Decomposition is just one scaling method; premature splitting increases coordination cost. |

## Red Flags

- Selecting a DB without QPS or capacity estimates
- No clear identification of single points of failure (SPOF)
- No conscious CAP trade-off selection
- Designing with the assumption of redesign when scaling is needed
- Discussing latency problems and scalability problems without distinguishing them

## Verification

- [ ] Use cases, constraints, and assumptions are documented
- [ ] QPS / storage / bandwidth estimates are shown in numbers
- [ ] Main components (LB / App / DB / Cache / Queue) are shown in a diagram
- [ ] Bottleneck candidates and countermeasures are listed
- [ ] CAP trade-off selection rationale is stated
- [ ] Source: https://github.com/donnemartin/system-design-primer is referenced
