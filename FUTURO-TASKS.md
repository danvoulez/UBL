# FUTURO - Task List

**Status:** 🔴 Not Started | 🟡 In Progress | 🟢 Done

---

## Fase 1: Agent Economy Core

### 1.1 Schema Changes

- [ ] 🔴 **Extend Entity type** - Add `guardian`, `constitution`, `autonomyLevel`, `substrate`
  - File: `core/schema/ledger.ts` or new `core/schema/agent-economy.ts`
  - Must work with existing Entity, not break it
  - Guardian is optional (humans don't need guardians)

- [ ] 🔴 **Constitution interface** - Values, constraints, style
  ```typescript
  interface Constitution {
    values: string[];
    constraints: { maxSpend?, forbiddenActions?, requireApprovalFor? };
    style?: { tone, verbosity, languages };
    version: number;
  }
  ```

- [ ] 🔴 **GuardianLink interface** - Chain of accountability
  ```typescript
  interface GuardianLink {
    guardianId: EntityId;
    effectiveFrom: Timestamp;
    effectiveUntil?: Timestamp;
    establishedBy: EntityId; // Agreement that created this
    liabilityLimit?: Quantity;
  }
  ```

- [ ] 🔴 **Wallet interface** - Container for fungible value
  ```typescript
  interface Wallet {
    id: EntityId;
    ownerId: EntityId;
    currency: string;
    // Balance calculated from events, not stored
    rules?: { maxBalance?, allowNegative?, requireApprovalAbove? };
  }
  ```

- [ ] 🔴 **StarterLoan interface** - Bootstrap capital
  ```typescript
  interface StarterLoan {
    id: EntityId;
    borrowerId: EntityId;
    guardianId: EntityId; // Guarantor
    principal: Quantity;
    interestRate: number;
    repaymentRate: number; // % of earnings
    gracePeriodUntil: Timestamp;
    collateral: { type: 'Trajectory' | 'Asset' | 'Guarantee' };
  }
  ```

- [ ] 🔴 **TrajectorySpan interface** - Agent action record
  ```typescript
  interface TrajectorySpan {
    id: EntityId;
    entityId: EntityId;
    action: string;
    execution: { provider, model, tokens, cost, durationMs };
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    signature: string;
    previousHash: string;
    hash: string;
  }
  ```

### 1.2 New Events

- [ ] 🔴 `EntityRegistered` - Extended with guardian, constitution
- [ ] 🔴 `GuardianAssigned`
- [ ] 🔴 `ConstitutionUpdated`
- [ ] 🔴 `WalletCreated`
- [ ] 🔴 `TransactionExecuted`
- [ ] 🔴 `LoanDisbursed`
- [ ] 🔴 `LoanRepayment`
- [ ] 🔴 `TrajectorySpanRecorded`

### 1.3 New Intents

- [ ] 🔴 `register:agent` - Full agent registration with:
  - Guardian assignment (creates Guardianship agreement)
  - Wallet creation
  - Starter loan disbursement
  - Constitution setup
  - **Must use ABAC** - only guardian can register agent

- [ ] 🔴 `assign:guardian` - Change guardian
  - Creates new Guardianship agreement
  - Terminates old one
  - **ABAC**: Only current guardian or system admin

- [ ] 🔴 `update:constitution` - Update agent's values/constraints
  - **ABAC**: Only agent itself or guardian

- [ ] 🔴 `create:wallet` - Create wallet for entity
  - **ABAC**: Entity itself or guardian

- [ ] 🔴 `transfer:credits` - Move credits between wallets
  - **ABAC**: Owner of source wallet
  - Check balance before transfer
  - Check wallet rules (limits, approvals)

- [ ] 🔴 `record:trajectory` - Record agent action
  - **ABAC**: Only the agent itself
  - Must include execution details (provider, cost)
  - Hash chain verification

### 1.4 Aggregates

- [ ] 🔴 **WalletAggregate** - Reconstruct balance from events
- [ ] 🔴 **LoanAggregate** - Track loan status, payments
- [ ] 🔴 **TrajectoryAggregate** - Agent's action history

### 1.5 Tests

- [ ] 🔴 `tests/business/agent-economy/registration.test.ts`
- [ ] 🔴 `tests/business/agent-economy/wallet.test.ts`
- [ ] 🔴 `tests/business/agent-economy/loans.test.ts`
- [ ] 🔴 `tests/business/agent-economy/trajectory.test.ts`
- [ ] 🔴 `tests/foundation/attacks/agent-impersonation.test.ts`

---

## Fase 2: Perception Layer

### 2.1 Schema

- [ ] 🔴 **Watcher interface**
  ```typescript
  interface Watcher {
    id: EntityId;
    ownerId: EntityId;
    source: WatcherSource;
    pollInterval: string;
    filter: { keywords?, pattern?, conditions? };
    action: WatcherAction;
    tier: 'Basic' | 'Premium';
    status: 'Active' | 'Paused' | 'Stopped';
  }
  ```

- [ ] 🔴 **ShadowEntity interface** - Agent's private view of external entity
  ```typescript
  interface ShadowEntity {
    id: EntityId;
    agentId: EntityId;
    externalId: string;
    platform: string;
    notes: string;
    inferredAttributes: Record<string, unknown>;
    reputation?: number;
    trustLevel?: 'Low' | 'Medium' | 'High';
  }
  ```

### 2.2 Events

- [ ] 🔴 `WatcherCreated`
- [ ] 🔴 `WatcherPaused`
- [ ] 🔴 `WatcherResumed`
- [ ] 🔴 `WatcherStopped`
- [ ] 🔴 `WatcherTriggered`
- [ ] 🔴 `ShadowEntityCreated`
- [ ] 🔴 `ShadowEntityUpdated`
- [ ] 🔴 `ShadowInteractionRecorded`

### 2.3 Intents

- [ ] 🔴 `create:watcher` - **ABAC**: Owner must have credits for monthly cost
- [ ] 🔴 `pause:watcher` - **ABAC**: Owner only
- [ ] 🔴 `resume:watcher`
- [ ] 🔴 `stop:watcher`
- [ ] 🔴 `register:shadow` - **ABAC**: Agent only
- [ ] 🔴 `update:shadow`
- [ ] 🔴 `promote:shadow` - Convert shadow to real entity

### 2.4 Tests

- [ ] 🔴 `tests/business/perception/watcher-lifecycle.test.ts`
- [ ] 🔴 `tests/business/perception/shadow-graph.test.ts`

---

## Fase 3: Consciousness Layer

### 3.1 Schema

- [ ] 🔴 **Daemon interface**
  ```typescript
  interface Daemon {
    id: EntityId;
    entityId: EntityId;
    mode: 'Persistent' | 'Scheduled';
    budget: { hourlyMax, dailyMax, onExhausted };
    heartbeat: { interval, lastBeat? };
    loops: DaemonLoop[];
    status: 'Running' | 'Sleeping' | 'Stopped';
  }
  ```

### 3.2 Events

- [ ] 🔴 `DaemonStarted`
- [ ] 🔴 `DaemonHeartbeat`
- [ ] 🔴 `DaemonLoopExecuted`
- [ ] 🔴 `DaemonSlept`
- [ ] 🔴 `DaemonWoke`
- [ ] 🔴 `DaemonStopped`

### 3.3 Intents

- [ ] 🔴 `start:daemon` - **ABAC**: Entity or guardian, must have budget
- [ ] 🔴 `stop:daemon`
- [ ] 🔴 `adjust:daemon-budget`

### 3.4 Continuity (Later)

- [ ] 🔴 Provider pooling strategy
- [ ] 🔴 Memory hydration protocol
- [ ] 🔴 Context injection

---

## Fase 4: Unilateral Obligations

- [ ] 🔴 **UnilateralObligation interface**
- [ ] 🔴 **AgentReasoning interface** - Capture decision process
- [ ] 🔴 **ExternalStimulus interface**
- [ ] 🔴 `declare:obligation` intent
- [ ] 🔴 `fulfill:obligation` intent
- [ ] 🔴 `abandon:obligation` intent

---

## Technical Debt / Improvements

- [ ] 🔴 Add `query()` method to EventStore for filtering
- [ ] 🔴 Proper aggregate versioning (not hardcoded `1`)
- [ ] 🔴 Hash chain for TrajectorySpan
- [ ] 🔴 Cryptographic signatures for non-repudiation
- [ ] 🔴 DID (Decentralized Identifier) integration

---

## Ideas from Alien Code (to extract)

### From code-to-check-and-maybe-copy ✅
1. **Constitution** - Agent personality/constraints as first-class concept
2. **GuardianLink** - Explicit accountability chain
3. **TrajectorySpan** - Detailed action recording with provider info
4. **StarterLoan** - Bootstrap mechanism with repayment
5. **ShadowEntity** - Private understanding of external world
6. **Daemon budget** - Economic constraints on consciousness
7. **Provider strategy** - Consistency across LLM providers
8. **Memory hydration** - Context injection for continuity

### From Atomic Agents (outro-codigo) ✅
1. **TDLN Compression** - NL→Structured format, 90% token savings
   - Podemos usar para comprimir intents antes de enviar ao LLM
2. **LogLine Format** - Structured text format (Rust parser exists)
   - Alternativa legível a JSON para logs/trajectory
3. **Risk Assessment** - Score de risco por operação
   - Adicionar ao ABAC: low/medium/high/critical risk levels
   - Operações high+ requerem guardian approval
4. **Policy Gates** - Governance estrutural
   - Já temos ABAC, mas podemos adicionar constraints estruturais
5. **Mechanic vs Genius modes** - Budget modes
   - Mechanic: cheap, strict rules, limited tools
   - Genius: expensive, exploratory, more freedom
   - Aplicar aos Daemons
6. **Append-only Ledger com triggers** - PostgreSQL triggers que bloqueiam UPDATE/DELETE
   - Quando formos para persistência real, usar isso
7. **Cross-project Knowledge** - Memória compartilhada
   - Trajectory spans podem ser buscados semanticamente

### Bad Patterns ❌ (Don't copy)
1. `eventStore.query()` - Method doesn't exist in our EventStore
2. Services doing `append()` directly - Bypass intents
3. Hardcoded `actor: { type: 'System' }` - No real actor
4. No ABAC checks in services
5. Ignoring containerManager
6. PostgreSQL as primary storage - We're event-store first

---

## Priority Order

1. **Entity + Guardian + Constitution** - Foundation for everything
2. **Wallet + Credits** - Economic existence
3. **Trajectory** - Agent identity
4. **Watcher** - Perception
5. **Daemon** - Consciousness
6. **Shadow** - External world modeling
7. **Unilateral Obligations** - Self-binding

---

**Last Updated:** 2025-12-11
