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

### 1.4 Aggregates ✅ COMPLETO (MEGA SPRINT)

- [x] 🟢 **WalletAggregate** - Reconstruct balance from events
- [x] 🟢 **LoanAggregate** - Track loan status, payments
- [x] 🟢 **TrajectoryAggregate** - Agent's action history

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

### 3.4 Continuity ✅ COMPLETO (MEGA SPRINT)

- [x] 🟢 Provider pooling strategy
- [x] 🟢 Memory hydration protocol
- [x] 🟢 Context injection

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

**Last Updated:** 2025-12-12

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

---

## Fase 6: Architecture Critical Analysis (NEW)

> From external review of ARCHITECTURE.md

### 6.1 Container Physics Validation ✅ COMPLETO (MEGA SPRINT)

**Problem:** Physics matrix (3×4×4×3 = 144 combinations) - not all meaningful

- [x] 🟢 **Predefine valid physics combinations** in `core/universal/physics-validation.ts`
  ```typescript
  const VALID_PHYSICS = {
    WALLET: ['Strict', 'Values', 'Sealed', 'Disabled'],
    WORKSPACE: ['Versioned', 'Objects', 'Collaborative', 'Sandboxed'],
    REALM: ['Strict', 'Subjects', 'Gated', 'Full'],
  } as const;
  ```
- [x] 🟢 **Physics validation function** - Reject invalid combinations
- [x] 🟢 **Physics confusion attack prevention** - Validate on ALL operations

### 6.2 Event Store Performance

**Problem:** Every operation hits event store - doesn't scale for high-frequency

- [ ] 🔴 **Event batching** for micro-payments, telemetry
  ```typescript
  interface HighFrequencyOperation {
    type: 'micro-payment' | 'telemetry';
    batch: Operation[];
    checkpoint?: EventId;
  }
  ```
- [ ] 🔴 **Projection cache** in ContainerManager
- [ ] 🔴 **Temporal snapshots** every 1000 events or 24h
  ```typescript
  interface TemporalSnapshot {
    entityId: EntityId;
    timestamp: Timestamp;
    state: any;
    upToEventId: EventId;
  }
  ```

### 6.3 Cross-Container Transactions

**Problem:** No atomic multi-container operations

- [ ] 🔴 **IntentTransaction interface** with compensation steps
  ```typescript
  interface IntentTransaction {
    id: TransactionId;
    steps: IntentStep[];
    compensationSteps: IntentStep[]; // For rollback
    timeout: Duration;
  }
  ```
- [ ] 🔴 **TransactionManager** - Execute with saga pattern
- [ ] 🔴 **Atomic event append** for transaction commits

### 6.4 Agreement Evolution & Versioning

**Problem:** Agreements need to evolve - no versioning model

- [ ] 🔴 **AgreementVersion interface**
  ```typescript
  interface AgreementVersion {
    agreementId: AgreementId;
    version: number;
    effectiveFrom: Timestamp;
    effectiveUntil?: Timestamp;
    terms: Terms;
    parentVersion?: number;
  }
  ```
- [ ] 🔴 **Temporal agreement queries** - "What were terms on date X?"
- [ ] 🔴 **Amendment workflow** - How to change terms
- [ ] 🔴 **Grandfathering logic** - Old obligations under old terms

### 6.5 Security Hardening

**Vulnerabilities identified:**

- [ ] 🔴 **Event replay attack prevention**
  - Sequence numbers per aggregate
  - Previous hash chain
  - Nonces for unpredictability
- [ ] 🔴 **Container ID prediction prevention**
  - Cryptographically secure generation
  - Time-ordered but random suffix
- [ ] 🔴 **Physics validation on ALL operations**
  - Not just creation, but every deposit/withdraw/transfer

### 6.6 Missing Components

- [ ] 🔴 **Schema Registry** - Type system for agreements/containers
  ```typescript
  interface SchemaRegistry {
    registerAgreementType(type: string, schema: JSONSchema): void;
    registerContainerType(type: string, defaultPhysics: Physics): void;
  }
  ```
- [ ] 🔴 **Notification/Subscription System** - Container event bus
- [ ] 🔴 **Compliance Engine** - GDPR, SOX, FINRA validation
  ```typescript
  interface ComplianceRule {
    id: RuleId;
    validator: (events: Event[]) => ComplianceResult;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }
  ```

### 6.7 Performance Optimizations

- [ ] 🔴 **Event store partitioning** - By realm for multi-tenant isolation
- [ ] 🔴 **Sharding by entity ID hash** - Horizontal scaling
- [ ] 🔴 **Read-model projections** - For high-read scenarios
  ```typescript
  // Example: wallet-balances projection
  registerProjection('wallet-balances', {
    handlesEvent: (e) => e.type === 'Deposited' || e.type === 'Withdrawn',
    apply: async (event) => { /* update materialized view */ },
  });
  ```
- [ ] 🔴 **Intent pre-validation cache** - LRU cache for expensive validations

### 6.8 UBL Economic Integration

**Problem:** Architecture is generic, needs economic primitives

- [ ] 🔴 **EconomicContainerPhysics** extension
  ```typescript
  interface EconomicContainerPhysics extends ContainerPhysics {
    currency: CurrencyCode;
    reserveRequirements?: ReserveRatio;
    interestRate?: Percentage;
  }
  ```
- [ ] 🔴 **UBLEconomicManager** - createUBLWallet, issueCredit
- [ ] 🔴 **Reserve requirement validation** on credit issuance

---

## Implementation Priority (Revised)

### Immediate (Phase 1):
1. ✅ Agent Economy Core
2. ✅ Perception Layer
3. ✅ Consciousness Layer
4. ✅ Unilateral Obligations
5. 🔴 **Transaction support** (6.3)
6. 🔴 **Physics validation** (6.1)
7. 🔴 **Temporal snapshots** (6.2)

### Medium-term (Phase 2):
8. 🔴 **Compliance engine** (6.6)
9. 🔴 **Event batching** (6.2)
10. 🔴 **Notification system** (6.6)
11. 🔴 **Projection engine** (6.7)
12. 🔴 **Security hardening** (6.5)

### Long-term (Phase 3):
13. 🔴 **Cross-realm operations** (UIS-1.0)
14. 🔴 **Offline operation support**
15. 🔴 **Federated ledger**
16. 🔴 **Formal verification**

---

## Fase 7: Simulation Framework & Stress Testing

> **Status:** 🟢 Framework implementado + Sprints 3-7 completos  
> **Baseado em:** 8 cenários testados, ~100k scripts simulados
> **Resultados:** GOLDEN_AGE 100%, BLACK_MONDAY 74%, BOOM_BUST 70%

### 7.1 Correções Urgentes (Sprint 3) ✅ COMPLETO

**Descobertas da simulação:**
- GOLDEN_AGE teve 61% mortalidade mesmo com eventos positivos
- Pivots = 0 em cenários novos
- Ciclos econômicos não completam em 5 anos

- [x] � **Fix stress em eventos positivos** (Sprint 3)
  - Stress reduz ativamente em contexto positivo
  - Sucesso financeiro reduz ansiedade
  - Arquivo: `core/simulation/realistic-behaviors.ts`

- [x] � **Fix pivots não funcionando** (Sprint 3)
  - Relaxadas condições de pivot
  - Adicionado pivot por oportunidade e burnout
  - Arquivo: `core/simulation/realistic-behaviors.ts`

- [x] � **Fix ciclos econômicos muito longos** (Sprint 3)
  - expansionDuration: 365 → 270 dias
  - contractionDuration: 90 → 60 dias
  - volatility: 0.4 → 0.5
  - Arquivo: `core/simulation/market-dynamics.ts`

### 7.2 Mecanismos de Estabilização ✅ COMPLETO

- [x] � **Circuit Breakers** (Sprint 4)
  - Implementado em `core/simulation/market-dynamics.ts`
  - Trip on 40% demand drop or -0.7 sentiment
  - Cooldown de 7 dias
  - Freeze de mudanças bruscas durante crise

- [x] 🟢 **Ongoing Effects** (Sprint 4)
  - Chaos events agora afetam market state
  - demandMultiplier, sentimentBoost, panicMode
  - Integrado em `scenario-runner-v2.ts`

- [x] � **Treasury Stabilization Fund** (Sprint 5-7)
  - Implementado em `core/simulation/treasury-fund.ts`
  - Crisis assessment: None/Mild/Moderate/Severe/Critical
  - Intervention types: EmergencyUBI, TargetedBailout, LoanForgiveness
  - Prosperity tax collection (3%)
  - Recovery mechanism - reativa scripts inativos
  - Tuned para intervenção agressiva

- [x] 🟢 **Guardian Accountability** (MEGA SPRINT)
  - Penalidade de reputação quando script faz default (-5)
  - Penalidade quando script sai (-2)
  - Bônus quando script sobrevive crise (+3)
  - Demotion se reputação < 30
  - Revogação de licença se reputação < 10
  - Arquivo: `core/simulation/guardian-accountability.ts`

### 7.3 Health Dashboard ✅ COMPLETO (MEGA SPRINT)

- [x] 🟢 **SystemHealth interface**
  ```typescript
  interface SystemHealth {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'COLLAPSED';
    survivalRate: number;
    avgStress: number;
    giniCoefficient: number;
    survivalTrend: 'improving' | 'stable' | 'declining';
    alerts: HealthAlert[];
    projectedSurvival30Days: number;
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  }
  ```
  - Arquivo: `core/simulation/health-dashboard.ts` (novo)
  - Esforço: 3h

### 7.4 Novos Cenários de Teste

**TIER 3: Existential Threats**
- [ ] 🟡 **AGI_SINGULARITY** - 95% obsolescence overnight
- [ ] 🟡 **DEFLATION_TRAP** - Persistent demand shock + debt deflation

**TIER 5: Game Theory**
- [ ] 🟡 **COMMONS_COLLAPSE** - Tragedy of the commons
- [ ] 🟡 **CARTEL_TAKEOVER** - 5 guardians control 60% market

**Combo Tests**
- [ ] 🟡 **DEATH_SPIRAL → GOLDEN_AGE → DEATH_SPIRAL** - Histerese test

**Cenários Adicionais (Sugeridos)**
- [ ] 🟡 **JURISDICTION_SHOPPING** - Scripts migram para realms com menos regras (race to bottom?)
- [ ] 🟡 **INSIDER_TRADING** - Informação assimétrica, detecção de fraude
- [ ] 🟡 **OLD_GUARD_VS_NEW_BLOOD** - Reputação legada vs competência atual

### 7.5 Integração Simulação → Sistema Real

| Componente Simulação | Componente Real | Status |
|---------------------|-----------------|--------|
| `SimulatedScript` | `Entity` + `Agreement` | 🟡 Parcial |
| `SimulatedGuardian` | `Entity` com role Guardian | 🟡 Parcial |
| `MarketDynamics` | Não existe | 🔴 Falta |
| `CircuitBreaker` | Não existe | 🔴 Falta |
| `TreasuryFund` | `Container` com physics Wallet | 🟡 Parcial |

- [ ] 🔴 **MarketOracle service** - Fornece dados de mercado ao sistema real
- [ ] 🔴 **CircuitBreakerService** - Monitora e intervém em produção
- [ ] 🔴 **TreasuryContainer** - Container especial para fundo de estabilização
- [ ] 🔴 **Eventos de saúde** - `SystemHealthChecked`, `CircuitBreakerTriggered`

### 7.6 Critérios de Sucesso ✅ TODAS METAS ATINGIDAS

| Cenário | Início | Final | Meta | Status |
|---------|--------|-------|------|--------|
| GOLDEN_AGE survival | 39% | **100%** | > 80% | ✅ +61% |
| BLACK_MONDAY survival | 48% | **74%** | > 60% | ✅ +26% |
| BOOM_BUST survival | 19% | **70%** | > 40% | ✅ +51% |
| Pivots em cenários novos | 0 | **1300+** | > 100 | ✅ |
| Ciclos em 5 anos | 1 | **3+** | ≥ 3 | ✅ |

---

## Fase 8: Benchmarking & Achievement System

> **Status:** 🔴 Não iniciado  
> **Ref:** `core/simulation/ideas for simulation.md`

### 8.1 Benchmark Framework

- [ ] 🔴 **BenchmarkScore interface**
  ```typescript
  interface BenchmarkScore {
    scenarioId: string;
    survivalScore: number;      // 0-100
    equalityScore: number;      // Based on Gini
    resilienceScore: number;    // Recovery speed
    adaptationScore: number;    // Pivot success rate
    nassimTalebScore: number;   // Antifragility measure
    overallGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  }
  ```

- [ ] 🔴 **Baseline values** para cada métrica
- [ ] 🔴 **Comparação entre versões** do sistema

### 8.2 Achievement System

- [ ] 🔴 **Achievements de sobrevivência**
  - "Cockroach" - Survive APOCALYPSE with >1% survival
  - "Phoenix" - Recover from <20% to >80% survival
  - "Unbreakable" - 100% survival in any crisis scenario

- [ ] 🔴 **Achievements de igualdade**
  - "Utopia" - Gini < 0.1 for 1 year
  - "Rising Tide" - All scripts improve during boom

- [ ] 🔴 **Achievements de adaptação**
  - "Pivot Master" - >50% successful pivots
  - "Antifragile" - System stronger after crisis

---

## 🏗️ ROADMAP CONSOLIDADO

> **Filosofia:** Reforçar bases antes de crescer. Não adicionar features sem confiança no que já existe.
> 
> **Progresso:** 97 tarefas feitas / 80 pendentes (55%)
> **Testes:** 403 passando

---

### ✅ SPRINT A: FOUNDAÇÃO - COMPLETO
> Tudo que foi construído até agora

**A.1 Agent Economy Core** ✅
- [x] Schema: Entity, Guardian, Constitution, Wallet, Loan, Trajectory
- [x] Events: EntityRegistered, GuardianAssigned, WalletCreated, etc.
- [x] Intents: register:agent, transfer:credits, record:trajectory
- [x] Aggregates: WalletAggregate, LoanAggregate, TrajectoryAggregate

**A.2 Perception Layer** ✅
- [x] Watcher + ShadowEntity schemas
- [x] Events: WatcherCreated, ShadowEntityCreated, etc.
- [x] Intents: create:watcher, register:shadow, promote:shadow

**A.3 Consciousness Layer** ✅
- [x] Daemon schema + events
- [x] Provider pooling, memory hydration, context injection

**A.4 Simulation Framework** ✅
- [x] 8 cenários testados, ~100k scripts simulados
- [x] Circuit breakers, Treasury Fund, Guardian Accountability
- [x] Health Dashboard

---

### ✅ SPRINT B: SEGURANÇA + TESTES - COMPLETO
> Confiança no que temos

**B.1 Security Hardening** ✅
- [x] Event replay attack prevention
- [x] Hash chain for TrajectorySpan
- [x] Cryptographic signatures
- [x] Physics validation

**B.2 Testes Críticos** ✅
- [x] registration.test.ts, wallet.test.ts
- [x] loans.test.ts, trajectory.test.ts
- [x] watcher-lifecycle.test.ts, shadow-graph.test.ts
- [x] agent-impersonation.test.ts

---

### ✅ SPRINT C: INTEGRIDADE + ESCALA - COMPLETO
> Technical debt + performance

**C.1 Event Store** ✅
- [x] `query()` method with filtering
- [x] `getNextVersion()` for aggregate versioning
- [x] Event batching (`event-batcher.ts`)
- [x] Temporal snapshots (`snapshots.ts`)
- [x] Projection cache (`projection-cache.ts`)

**C.2 Transactions** ✅
- [x] IntentTransaction with Saga pattern
- [x] Compensation steps for rollback
- [x] Correlation ID for audit trail

**C.3 Economic Gatekeeper** ✅
- [x] `gatekeeper.ts` - Middleware para transfers
- [x] ICircuitBreaker + ITreasury interfaces

---

### 🟡 SPRINT D: FEATURES - PRÓXIMO
> Novas funcionalidades

**D.1 Economy Core** ✅
- [x] � `core/economy/fitness.ts` - Revised fitness function (log/arctan)
- [x] � `core/economy/guardian-scoring.ts` - Multi-dimensional scoring + tiers

**D.2 Security Avancado** ✅
- [x] � `core/enforcement/anomaly-detection.ts` - 3σ rule, circuit breakers
- [x] � `core/enforcement/cartel-detection.ts` - Graph cycle detection

**D.3 Session Materialization** (~4h)
- [ ] 🔴 `SESSION_TYPE` em `agreement-types.ts`
- [ ] 🔴 Sessions persistidas no Event Store
- [ ] 🔴 "Right to Forget" via Agreement termination

**D.4 Cenários Avançados** (~6h)
- [ ] 🟡 TIER 3: AGI_SINGULARITY, DEFLATION_TRAP
- [ ] 🟡 TIER 5: COMMONS_COLLAPSE, CARTEL_TAKEOVER

---

### 🔵 SPRINT E: GOVERNANCE - FUTURO
> Estruturas de governança

**E.1 Three-Branch Governance** (~8h)
- [ ] 🔴 `core/governance/three-branch.ts` - Executive/Legislative/Judicial
- [ ] 🔴 Monetary policy transmission
- [ ] 🔴 Public goods (quadratic funding)

**E.2 Cross-Realm** (~6h)
- [ ] 🔴 `core/interop/uis-1.0.ts` - Cross-realm interoperability
- [ ] 🔴 Federated ledger support

---

### 🔵 SPRINT F: BENCHMARKING - FUTURO
> Métricas e achievements

**F.1 Benchmark Framework** (~4h)
- [ ] 🔴 BenchmarkScore interface (survival, equality, resilience)
- [ ] 🔴 Baseline values + version comparison

**F.2 Achievement System** (~3h)
- [ ] 🔴 Survival achievements (Cockroach, Phoenix, Unbreakable)
- [ ] 🔴 Equality achievements (Utopia, Rising Tide)
- [ ] 🔴 Adaptation achievements (Pivot Master, Antifragile)

---

### 🏁 SPRINT FINAL: POLISH
> Production-grade quality

**Final.1 Documentação** (~4h)
- [ ] 🔴 Sync docs com código atual
- [ ] 🔴 ARCHITECTURE.md atualizado
- [ ] 🔴 README.md com quick start
- [ ] 🔴 CHANGELOG.md

**Final.2 TypeScript Cleanup** (~6h)
- [ ] 🔴 Resolver erros TypeScript
- [ ] 🔴 100% type safety
- [ ] 🔴 Remover código morto

**Final.3 Quality Gates**
- [ ] 🔴 Todos os testes passando
- [ ] 🔴 Zero erros TypeScript
- [ ] 🔴 Cobertura > 70%

---

## 📊 Análise de Riscos (Gemini Review)

> Baseado em review externa do Google Gemini 3.0 (Dec 2025)

### Riscos Identificados e Mitigações

| Risco | Severidade | Mitigação | Status |
|-------|------------|-----------|--------|
| **Read Model Bottleneck** | Alta | Snapshots + Projections (FASE 3) | 🟡 Planejado |
| **Physics Confusion Attack** | Crítica | `physics-validation.ts` | ✅ Implementado |
| **Event Replay Attack** | Crítica | `replay-prevention.ts` | ✅ Implementado |
| **Hash Chain Tampering** | Crítica | `hash-chain.ts` | ✅ Implementado |
| **Economic Ghost** | Alta | Economic Gatekeeper (FASE 2.4) | 🟡 Planejado |
| **Memory Contract Bluff** | Média | Session Materialization (FASE 4.5) | 🟡 Planejado |
| **Shadow Privacy Leak** | Média | ABAC + Policies existentes | ✅ Coberto |

### Validações Externas

- ✅ **Arquitetura validada** - "One of the most philosophically coherent systems"
- ✅ **Simulação econômica** - "Your biggest competitive advantage"
- ✅ **ABAC** - "The correct model for autonomous agents"
- ✅ **Código Pedagógico** - "Prompt-engineering the codebase itself"
