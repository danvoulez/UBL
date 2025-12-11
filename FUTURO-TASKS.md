# FUTURO - Task List

**Status:** 🔴 Not Started | 🟡 In Progress | 🟢 Done

---

## Fase 1: Agent Economy Core

### 1.1 Schema Changes

- [x] 🟢 **Extend Entity type** - Add `guardian`, `constitution`, `autonomyLevel`, `substrate`
  - File: `core/schema/ledger.ts` or new `core/schema/agent-economy.ts`
  - Must work with existing Entity, not break it
  - Guardian is optional (humans don't need guardians)

- [x] 🟢 **Constitution interface** - Values, constraints, style
  ```typescript
  interface Constitution {
    values: string[];
    constraints: { maxSpend?, forbiddenActions?, requireApprovalFor? };
    style?: { tone, verbosity, languages };
    version: number;
  }
  ```

- [x] 🟢 **GuardianLink interface** - Chain of accountability
  ```typescript
  interface GuardianLink {
    guardianId: EntityId;
    effectiveFrom: Timestamp;
    effectiveUntil?: Timestamp;
    establishedBy: EntityId; // Agreement that created this
    liabilityLimit?: Quantity;
  }
  ```

- [x] 🟢 **Wallet interface** - Container for fungible value
  ```typescript
  interface Wallet {
    id: EntityId;
    ownerId: EntityId;
    currency: string;
    // Balance calculated from events, not stored
    rules?: { maxBalance?, allowNegative?, requireApprovalAbove? };
  }
  ```

- [x] 🟢 **StarterLoan interface** - Bootstrap capital
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

- [x] 🟢 **TrajectorySpan interface** - Agent action record
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

- [x] 🟢 `EntityRegistered` - Extended with guardian, constitution
- [x] 🟢 `GuardianAssigned`
- [x] 🟢 `ConstitutionUpdated`
- [x] 🟢 `WalletCreated`
- [x] 🟢 `TransactionExecuted`
- [x] 🟢 `LoanDisbursed`
- [x] 🟢 `LoanRepayment`
- [x] 🟢 `TrajectorySpanRecorded`

### 1.3 New Intents

- [x] 🟢 `register:agent` - Full agent registration with:
  - Guardian assignment (creates Guardianship agreement)
  - Wallet creation
  - Starter loan disbursement
  - Constitution setup
  - **Must use ABAC** - only guardian can register agent

- [x] 🟢 `assign:guardian` - Change guardian
  - Creates new Guardianship agreement
  - Terminates old one
  - **ABAC**: Only current guardian or system admin

- [x] 🟢 `update:constitution` - Update agent's values/constraints
  - **ABAC**: Only agent itself or guardian

- [x] 🟢 `create:wallet` - Create wallet for entity
  - **ABAC**: Entity itself or guardian

- [x] 🟢 `transfer:credits` - Move credits between wallets
  - **ABAC**: Owner of source wallet
  - Check balance before transfer
  - Check wallet rules (limits, approvals)

- [x] 🟢 `record:trajectory` - Record agent action
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

- [x] 🟢 **Watcher interface**
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

- [x] 🟢 **ShadowEntity interface** - Agent's private view of external entity
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

- [x] 🟢 `WatcherCreated`
- [x] 🟢 `WatcherPaused`
- [x] 🟢 `WatcherResumed`
- [x] 🟢 `WatcherStopped`
- [x] 🟢 `WatcherTriggered`
- [x] 🟢 `ShadowEntityCreated`
- [x] 🟢 `ShadowEntityUpdated`
- [x] 🟢 `ShadowInteractionRecorded`

### 2.3 Intents

- [x] 🟢 `create:watcher` - **ABAC**: Owner must have credits for monthly cost
- [x] 🟢 `pause:watcher` - **ABAC**: Owner only
- [x] 🟢 `resume:watcher`
- [x] 🟢 `stop:watcher`
- [x] 🟢 `register:shadow` - **ABAC**: Agent only
- [x] 🟢 `update:shadow`
- [x] 🟢 `promote:shadow` - Convert shadow to real entity

### 2.4 Tests

- [ ] 🔴 `tests/business/perception/watcher-lifecycle.test.ts`
- [ ] 🔴 `tests/business/perception/shadow-graph.test.ts`

---

## Fase 3: Consciousness Layer

### 3.1 Schema

- [x] 🟢 **Daemon interface**
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

- [x] 🟢 `DaemonStarted`
- [x] 🟢 `DaemonHeartbeat`
- [x] 🟢 `DaemonLoopExecuted`
- [x] 🟢 `DaemonSlept`
- [x] 🟢 `DaemonWoke`
- [x] 🟢 `DaemonStopped`

### 3.3 Intents

- [x] 🟢 `start:daemon` - **ABAC**: Entity or guardian, must have budget
- [x] 🟢 `stop:daemon`
- [x] 🟢 `adjust:daemon-budget`

### 3.4 Continuity (Later)

- [ ] 🔴 Provider pooling strategy
- [ ] 🔴 Memory hydration protocol
- [ ] 🔴 Context injection

---

## Fase 4: Unilateral Obligations

- [x] 🟢 **UnilateralObligation interface**
- [x] 🟢 **AgentReasoning interface** - Capture decision process
- [x] 🟢 **ExternalStimulus interface**
- [x] 🟢 `declare:obligation` intent
- [x] 🟢 `fulfill:obligation` intent
- [x] 🟢 `abandon:obligation` intent

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

### From LogLine LLM World ✅
1. **Golden Run (Canon)** - Exemplo mínimo que define o contrato do sistema
   - "Any new feature that breaks this story is wrong"
   - Criar um Golden Run para UBL (register agent → create wallet → transfer)
2. **Execution Budgets per Run** - Limites por execução
   - `cost_limit_cents` - teto de custo
   - `llm_calls_limit` - máximo de chamadas LLM
   - `latency_slo_ms` - SLO de latência
   - Aplicar aos Daemons e Watchers
3. **Risk Levels em Tools/Intents** - low/medium/high por operação
   - Intents high+ requerem guardian approval
   - Adicionar `riskLevel` ao IntentDefinition
4. **Policy require_approval** - Pausar execução até aprovação humana
   - Adicionar ao ABAC: além de allow/deny, ter require_approval
   - Run entra em status "paused" com human_gate
5. **Memory Engine (pgvector)** - RAG com embeddings
   - Semantic search em trajectories
   - Futuro: "find similar past work"
6. **JSON✯Atomic** - Formato estruturado self-describing
   - Hash chain para integridade
   - Melhor compreensão por LLMs
7. **Audit Logs separado** - Tabela dedicada para audit trail
   - Quando formos para PostgreSQL, separar events de audit_logs
8. **Alert Configs** - Regras de alerta configuráveis
   - error_rate, budget_exceeded, policy_denials
   - Notification channels: webhook, email, slack

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

---

## Fase 5: Critical Analysis Implementation (NEW)

> From WHITEPAPER Part IV - See `docs/IMPLEMENTATION-MAP.md`

### 5.1 Security (Sprint 1) - HIGH PRIORITY
- [ ] 🔴 `core/enforcement/anomaly-detection.ts` - 3σ rule, circuit breakers
- [ ] 🔴 `core/enforcement/cartel-detection.ts` - Graph cycle detection

### 5.2 Economy Core (Sprint 2)
- [ ] 🔴 `core/economy/fitness.ts` - Revised fitness function with log/arctan
- [ ] 🔴 `core/economy/guardian-scoring.ts` - Multi-dimensional scoring + tiers

### 5.3 Monetary Policy (Sprint 3)
- [ ] 🔴 `core/economy/transmission.ts` - Band → behavior channels
- [ ] 🔴 `core/economy/cycle-adjustment.ts` - RapidGrowth/TechTransition/Saturation

### 5.4 Public Goods (Sprint 4)
- [ ] 🔴 `core/economy/public-goods.ts` - Quadratic funding + Pigovian taxes

### 5.5 Governance (Sprint 5 - Future)
- [ ] 🔴 `core/governance/three-branch.ts` - Executive/Legislative/Judicial
- [ ] 🔴 `core/interop/uis-1.0.ts` - Cross-realm interoperability
