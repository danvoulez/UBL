# Universal Ledger System - Architecture

## The Vision: A Universal Business Operating System

This system is **universal**—it can model any business domain. Two key insights:

1. **All business relationships are agreements**
2. **All governance boundaries are containers**

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         UNIVERSAL LEDGER SYSTEM                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   Events ───▶ Agreements ───▶ Containers ───▶ Permissions ───▶ Actions       ║
║     │             │               │               │               3
│           ║
║     ▼             ▼               ▼               ▼               ▼           ║
║  IMMUTABLE    UNIVERSAL       FRACTAL        CONTEXTUAL      AUDITED         ║
║   FACTS       CONTRACTS      BOUNDARIES      SECURITY        MEMORY          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

## Core Concepts

### The Arrow of Time

The past is immutable. Events are facts that have happened—they can never be changed, only compensated for with new events.

```
Genesis ══════════════════════════════════════════════════════════▶ Now
   │                                                                │
   │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐       │
   │  │ E₁  │──│ E₂  │──│ E₃  │──│ E₄  │──│ E₅  │──│ E₆  │── ··· │
   │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘       │
   │     │        │        │        │        │        │            │
   │     ▼        ▼        ▼        ▼        ▼        ▼            │
   │  hash₁ ← hash₂ ← hash₃ ← hash₄ ← hash₅ ← hash₆              │
   │                                                                │
   └────────────────── Cryptographic Chain ─────────────────────────┘
```

### The Container Primitive

Everything is a Container. The difference is in the physics:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTAINER PHYSICS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Fungibility         Topology          Permeability       Execution        │
│   ───────────         ────────          ────────────       ─────────        │
│   • Strict            • Values          • Sealed           • Disabled       │
│   • Versioned         • Objects         • Gated            • Sandboxed      │
│   • Transient         • Subjects        • Collaborative    • Full           │
│                       • Links           • Open                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CONTAINER_PHYSICS.Wallet     = { Strict, Values, Sealed, Disabled }      │
│   CONTAINER_PHYSICS.Workspace  = { Versioned, Objects, Collaborative }     │
│   CONTAINER_PHYSICS.Realm      = { Strict, Subjects, Gated, Full }         │
│   CONTAINER_PHYSICS.Network    = { Transient, Links, Open, Disabled }      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agreements as the Universal Primitive

Every relationship is an agreement:

| Traditional Model | Universal Model |
|-------------------|-----------------|
| John IS an Employee | John HOLDS Employee role VIA Employment Agreement |
| Mary IS a Customer | Mary HOLDS Customer role VIA Purchase Agreement |
| Car #123 IS owned by Bob | Car #123 IS owned by Bob VIA Sale Agreement |

## System Architecture

### Module Structure

```
core/
├── shared/                 # ← FOUNDATION: Universal primitives
│   ├── types.ts           #    EntityId, Timestamp, Duration, Validity
│   └── index.ts           #    Clean exports
│
├── schema/                 # ← DOMAIN MODEL
│   ├── ledger.ts          #    Event, Party, Asset, Agreement, Role
│   └── workflow.ts        #    Workflow, Flow definitions
│
├── universal/              # ← GENERALIZED MODEL
│   ├── primitives.ts      #    Entity, Agreement, Role
│   ├── container.ts       #    Container primitive, physics, events
│   ├── container-manager.ts#   Unified ContainerManager
│   ├── bootstrap.ts       #    System initialization
│   ├── agreement-types.ts #    Extensible agreement type registry
│   └── index.ts           #    Clean exports
│
├── store/                  # ← PERSISTENCE
│   ├── event-store.ts     #    EventStore interface
│   ├── postgres-event-store.ts # PostgreSQL implementation
│   └── create-event-store.ts   # Factory
│
├── engine/                 # ← EXECUTION
│   ├── workflow-engine.ts #    State machine executor
│   └── flow-orchestrator.ts#   Complex process orchestration
│
├── aggregates/             # ← STATE RECONSTRUCTION
│   └── rehydrators.ts     #    Rebuild state from events
│
├── api/                    # ← INTERFACE LAYER
│   ├── intent-api.ts      #    Intent-driven API
│   └── intent-handlers/   #    Intent handler implementations
│
├── security/               # ← AUTHORIZATION
│   ├── authorization.ts   #    Agreement-Based Access Control
│   └── authentication.ts  #    JWT, API keys
│
├── economy/                # ← ECONOMIC SYSTEM (NEW)
│   ├── fitness.ts         #    Multi-dimensional fitness scoring
│   └── guardian-scoring.ts#    Guardian reputation & ranking
│
├── enforcement/            # ← SECURITY & DETECTION (NEW)
│   ├── anomaly-detection.ts#   Statistical outlier detection
│   └── cartel-detection.ts#    Graph-based collusion detection
│
├── sessions/               # ← SESSION MANAGEMENT (NEW)
│   └── session-manager.ts #    Session lifecycle, Right to Forget
│
├── governance/             # ← GOVERNANCE SYSTEM (NEW)
│   ├── three-branch.ts    #    Executive/Legislative/Judicial
│   ├── monetary-policy.ts #    Taylor Rule, OMOs, lending
│   └── quadratic-funding.ts#   Public goods funding
│
├── interop/                # ← CROSS-REALM (NEW)
│   ├── uis-1.0.ts         #    Universal Interoperability Standard
│   └── federated-ledger.ts#    Vector clocks, Merkle trees, sync
│
├── benchmarking/           # ← METRICS & GAMIFICATION (NEW)
│   ├── benchmark-framework.ts# Multi-dimensional health scoring
│   └── achievements.ts    #    Gamification, milestones, rewards
│
├── simulation/             # ← CHAOS ENGINEERING (NEW)
│   ├── chaos-injector.ts  #    TIER 1-5 chaos scenarios
│   └── scenario-runner-v2.ts#  Multi-year simulation runner
│
├── trajectory/             # ← AUDIT TRAIL
│   ├── trace.ts           #    Trace tracking
│   └── event-store-trace.ts#   AuditLogger
│
├── observability/          # ← METRICS & LOGGING
│   ├── logger.ts          #    Structured logging
│   └── metrics.ts         #    Counters, tracing
│
└── index.ts               # ← UNIFIED EXPORTS

antenna/                   # ← HTTP SERVER
├── server.ts              #    Main HTTP server
├── admin.ts               #    Admin API
└── wiring/                #    Dependency injection
    ├── role-store.ts
    └── authorization.ts
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTENT                                          │
│   "Transfer 100 credits from Wallet A to Wallet B"                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTAINER MANAGER                                     │
│   1. Get source container (Wallet A)                                        │
│   2. Get destination container (Wallet B)                                   │
│   3. Validate physics (Strict → must Move, not Copy)                        │
│   4. Check authorization                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EVENT STORE                                        │
│   1. Append: ContainerItemWithdrawn (Wallet A)                              │
│   2. Append: ContainerItemDeposited (Wallet B)                              │
│   - hash: sha256(previous + this)                                           │
│   - aggregateVersion: calculated                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RESPONSE                                           │
│   { success: true, outcome: { type: "Transferred" } }                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The Container Manager

One service handles all container types:

```typescript
import { createContainerManager } from './core/universal';

const containers = createContainerManager({ eventStore });

// Create containers with different physics
const wallet = await containers.createWallet('My Wallet', actor, realmId);
const workspace = await containers.createWorkspace('Dev', actor, realmId);
const realm = await containers.createRealm('Tenant A', actor, parentRealmId);

// Universal operations
await containers.deposit(wallet.id, { id: creditId, type: 'Asset', quantity: { amount: 100, unit: 'USD' } }, actor);
await containers.transfer(walletA, walletB, creditId, { amount: 50, unit: 'USD' }, actor);

// High-level convenience
await containers.pay(fromWallet, toWallet, 100, 'USD', actor);
await containers.deploy(fileId, devWorkspace, prodWorkspace, actor);
```

## Bootstrap

The system initializes with:

```typescript
import { bootstrap, PRIMORDIAL_REALM_ID } from './core/universal';

// Creates:
// 1. Genesis Agreement
// 2. System Entity
// 3. Primordial Realm (root Container)
const { primordialRealm, systemEntityId, genesisAgreementId } = await bootstrap(eventStore);
```

## Key Features

### 1. Temporal Queries

Query the state of any entity at any point in time:

```typescript
QueryBuilder
  .roles()
  .where('holderId', 'eq', 'joao-123')
  .at(new Date('2024-01-01').getTime())
  .include('establishingAgreement')
  .build();
```

### 2. Intent-Driven API

Express what you want to achieve:

```typescript
// Intent-driven
POST /intent { intent: "transfer", payload: { from, to, asset, quantity } }
```

### 3. Affordances

The API tells you what you can do next:

```json
{
  "affordances": [
    { "intent": "consent", "description": "Accept this agreement" },
    { "intent": "reject", "description": "Decline this agreement" }
  ]
}
```

### 4. Multitenancy via Containers

Realms are Containers with Realm physics:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRIMORDIAL REALM                                    │
│                     (Container with Realm physics)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────┐        License Agreement         ┌───────────┐             │
│   │  SYSTEM   │════════════════════════════════▶│  TENANT   │             │
│   │  (Entity) │                                  │  (Entity) │             │
│   └───────────┘                                  └───────────┘             │
│                                                        │                    │
│                                                        ▼                    │
│                                            ┌────────────────────────┐      │
│                                            │    TENANT REALM        │      │
│                                            │    (Container)         │      │
│                                            │                        │      │
│                                            │  Contains:             │      │
│                                            │  • Entities            │      │
│                                            │  • Agreements          │      │
│                                            │  • Wallets             │      │
│                                            │  • Workspaces          │      │
│                                            └────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Shared Foundation

All modules use common primitives from `core/shared/`:

| Type | Purpose | Example |
|------|---------|---------|
| `EntityId` | Time-ordered unique identifier | `"ent-m5x2k-f8g3h9"` |
| `Timestamp` | Unix epoch milliseconds | `1701532800000` |
| `Duration` | Time span with unit | `{ amount: 7, unit: 'days' }` |
| `Validity` | Effective period | `{ effectiveFrom, effectiveUntil }` |
| `ActorReference` | Who performed action | `{ type: 'Entity', entityId: '...' }` |

## Quick Start

```typescript
import { createUniversalLedger, bootstrap, createContainerManager } from './core';

// Create event store
const { eventStore } = createUniversalLedger();

// Bootstrap the system
await bootstrap(eventStore);

// Create container manager
const containers = createContainerManager({ eventStore });

// Create a wallet
const wallet = await containers.createWallet('My Wallet', actor, PRIMORDIAL_REALM_ID);

// Deposit credits
await containers.deposit(wallet.id, { 
  id: 'credit-usd', 
  type: 'Asset', 
  quantity: { amount: 1000, unit: 'USD' } 
}, actor);
```

## Production Deployment

1. **PostgreSQL Event Store** - Set `DATABASE_URL`
2. **Bootstrap** - Run `bootstrap(eventStore)` on startup
3. **Container Manager** - Use for all container operations
4. **Realm Setup** - Create tenant realms via `containers.createRealm()`

---

## Advanced Features

### Three-Branch Governance

```typescript
import { createGovernanceCoordinator } from './core/governance/three-branch';

const governance = createGovernanceCoordinator();

// Executive action
const action = governance.proposeAction('policy-change', { ... }, executorId);

// Legislative proposal
const proposal = governance.submitProposal('new-law', 'Description', proposerId);
governance.castVote(proposal.id, voterId, 'For');

// Judicial review
const ruling = governance.fileCase('constitutional-challenge', caseDetails, plaintiffId);
```

### Monetary Policy (Taylor Rule)

```typescript
import { createMonetaryPolicyEngine } from './core/governance/monetary-policy';

const centralBank = createMonetaryPolicyEngine({
  targetInflation: 0.02,
  naturalRate: 0.025,
});

// Get optimal rate based on economic indicators
const rate = centralBank.calculateTaylorRate({
  inflation: 0.03,
  outputGap: 0.01,
  unemployment: 0.04,
  // ...
});

// Execute open market operations
centralBank.executeOMO('Buy', 'Bond', 1000000n, 98.5);
```

### Quadratic Funding for Public Goods

```typescript
import { createQuadraticFundingEngine } from './core/governance/quadratic-funding';

const qf = createQuadraticFundingEngine({ matchingPool: 100000n });

// Create funding round
const round = qf.createRound('Q1 2024', 'First quarter funding');

// Submit project
const project = qf.submitProject(round.id, 'Open Source Library', 'Description', ownerId);

// Contributions (quadratic formula amplifies small donations)
qf.contribute(project.id, donor1, 10n);  // √10 = 3.16
qf.contribute(project.id, donor2, 10n);  // √10 = 3.16
// Total: (3.16 + 3.16)² = 40 matched vs 20 direct

// Calculate results
const results = qf.calculateFunding(round.id);
```

### Cross-Realm Interoperability (UIS 1.0)

```typescript
import { createUISGateway } from './core/interop/uis-1.0';

const gateway = createUISGateway({ realmId: myRealmId });

// Establish trust
gateway.establishTrust({
  realmId: partnerRealmId,
  trustLevel: 'Verified',
  capabilities: ['EntityTransfer', 'AssetTransfer'],
});

// Transfer entity to another realm
const transfer = gateway.initiateEntityTransfer(
  partnerRealmId,
  entityId,
  'Agent',
  entityData,
  'Migration'
);
```

### Federated Ledger (Vector Clocks)

```typescript
import { createFederatedLedger } from './core/interop/federated-ledger';

const ledger = createFederatedLedger({
  realmId: myRealmId,
  conflictStrategy: 'LastWriteWins',
});

// Append local event
ledger.appendLocal(event);

// Sync with remote realm
const request = ledger.createSyncRequest(remoteRealmId);
const response = await sendToRemote(request);
ledger.applySyncResponse(response, remoteRealmId);
```

### Benchmarking & Health Metrics

```typescript
import { createBenchmarkEngine } from './core/benchmarking/benchmark-framework';

const benchmark = createBenchmarkEngine();

const score = benchmark.calculate({
  // Survival metrics
  totalAgents: 100,
  activeAgents: 90,
  // Equality metrics
  giniCoefficient: 0.3,
  // Resilience metrics
  recoveryTime: 5,
  systemUptime: 0.99,
  // ...
});

console.log(score.composite);  // 0-100
console.log(score.status);     // 'Healthy' | 'Warning' | 'Critical'
```

### Achievements & Gamification

```typescript
import { createAchievementEngine } from './core/benchmarking/achievements';

const achievements = createAchievementEngine();

// Check progress for entity
const unlocked = achievements.checkProgress(entityId, {
  days_active: 30,
  total_earned: 1000,
  connections: 10,
});

// Get leaderboard
const leaderboard = achievements.getLeaderboard(10);
```

### Chaos Engineering & Simulation

```typescript
import { CHAOS_SCENARIOS } from './core/simulation/chaos-injector';
import { ENHANCED_SCENARIOS } from './core/simulation/scenario-runner-v2';

// Available scenarios:
// TIER 1: MODEL_RELEASE, MARKET_CRASH, CARTEL_FORMATION
// TIER 2: FLASH_CRASH, BANK_RUN, CREDIT_FREEZE
// TIER 3: AGI_SINGULARITY, DEFLATION_TRAP
// TIER 5: COMMONS_COLLAPSE, CARTEL_TAKEOVER, HYPERINFLATION

// Run multi-year simulation
const scenario = ENHANCED_SCENARIOS.REALISTIC_APOCALYPSE;
// 5 years with cascading chaos events
```

---

*"The difference between a Wallet and a Workspace is not in the code. It's in the Agreement."*

*"One ContainerManager. One transfer() method. All use cases."*
