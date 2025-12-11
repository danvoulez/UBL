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
║     │             │               │               │               │           ║
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

*"The difference between a Wallet and a Workspace is not in the code. It's in the Agreement."*

*"One ContainerManager. One transfer() method. All use cases."*
