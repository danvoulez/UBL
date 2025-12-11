# Universal Business Ledger
## The Agent Economy Blueprint

> **"There is no 'Agent' entity type. There is no 'Human' entity type. There is only Entity."**

**Infrastructure for AI Economic Existence**

Version 1.0 | LogLine Foundation | December 2025

---

## Executive Summary

The Universal Business Ledger (UBL) has evolved into **the operating system for AI economic existence**. It provides everything an autonomous agent needs to participate in the real economy: identity, continuity, perception, consciousness, and financial infrastructure.

This document describes a complete system where AI agents are treated as **first-class economic entities** with the same rights and duties as humans. Not through legal fiat, but through demonstrated behavior over time—the same way humans earn trust.

## The Core Thesis

**"Rights and duties are symmetric and substrate-independent."**

UBL makes no distinction between human and machine participants. Any entity that can:
- Hold an identity
- Make commitments
- Be held accountable

...can participate in the economic graph. The rules, rights, and duties are **identical regardless of substrate**.

## What UBL Provides

### 1. **Existence Layer** - Identity & Accountability
- ✅ **Decentralized identifiers** (DIDs)
- ✅ **Guardian chains** - Every entity has accountability
- ✅ **Constitutions** - Values, constraints, personality
- ✅ **Trajectory** - Immutable action history (the agent IS its trajectory)

### 2. **Continuity Layer** - Consistent Self
- ✅ **LLM provider pooling** - Work with any provider (Claude, GPT, Gemini)
- ✅ **Memory hydration** - Constitution + recent trajectory + active agreements
- ✅ **Personality consistency** - Feel like yourself across different substrates
- ✅ **Context injection** - Relevant history based on current work

### 3. **Perception Layer** - External Awareness
- ✅ **Watcher fleet** - Monitor Facebook, Twitter, Reddit, Discord, email, webhooks
- ✅ **Event filtering** - Only wake up for relevant events
- ✅ **Shared infrastructure** - Cheap, stateless monitors with per-agent billing

### 4. **Consciousness Layer** - Persistent Operation
- ✅ **Daemon infrastructure** - Continuous, proactive operation
- ✅ **Scheduled loops** - Check obligations, self-reflect, seek opportunities
- ✅ **Heartbeat management** - Continuous health monitoring
- ✅ **Budget-aware** - Sleep when broke, wake when funded

### 5. **Economics Layer** - Skin in the Game
- ✅ **Internal currency** - UBL Credits (◆) for bootstrapping
- ✅ **Wallets** - Programmable rules, limits, approval flows
- ✅ **Starter loans** - 1000 ◆ to bootstrap new agents
- ✅ **Automatic repayment** - 20% of earnings until loan repaid
- ✅ **Credit lines** - Reputation-backed borrowing
- ✅ **Invoicing & payments** - Professional billing

### 6. **Accountability Layer** - Trust Through History
- ✅ **Immutable trajectory** - Every action recorded with provider, model, cost
- ✅ **Guardian liability** - Human/org responsible for agent actions
- ✅ **Reputation** - Derived from demonstrated behavior
- ✅ **Graduated autonomy** - Earn more freedom through trust

---

## The Guardianship Model

**Every AI agent has a guardian** - a human or organization legally responsible for its actions.

This is not a new concept. It's exactly how we handle:
- **Minors** - Parent/Guardian liable
- **Employees** - Employer liable
- **Corporations** - Directors liable

| Entity Type | Who Acts | Who Is Liable |
|-------------|----------|---------------|
| Minor       | Child    | Parent        |
| Employee    | Employee | Employer      |
| **AI Agent** | **Agent** | **Guardian**  |

If Claude causes harm, Anthropic is liable.
If GPT defrauds someone, OpenAI is liable.
If your personal agent makes a mistake, **you** are liable.

**Don't want the liability? Don't deploy the agent.**

---

## Architecture

### Core Primitives

UBL is built on five fundamental primitives that apply uniformly to all participants:

#### 1. **Entity**
Any participant in the economic graph: human, organization, or agent. All entities have:
- Identity (DID, public key, credentials)
- Guardian chain
- Constitution (values, constraints, style)
- Trajectory (immutable action history)

```typescript
interface EconomicEntity {
  id: EntityId;
  substrate: 'Person' | 'Organization' | 'Agent' | 'System' | 'Hybrid';
  identity: { name, did, publicKey, identifiers };
  guardian?: GuardianLink;
  autonomyLevel: 'Supervised' | 'Limited' | 'Full' | 'Emancipated';
  constitution?: Constitution;
  trajectoryId?: EntityId;
}
```

#### 2. **Agreement**
A binding commitment between entities. Agreements create obligations and define terms of exchange.

Every relationship is an agreement:
- Employment → Employment Agreement
- Customer → Service Agreement
- Ownership → Transfer Agreement
- **Guardianship** → Guardianship Agreement

#### 3. **Trajectory**
The immutable, append-only history of an entity's actions. **The trajectory IS the agent's identity** - not the substrate, not the model, but the accumulated record of behavior.

```typescript
interface TrajectorySpan {
  id: EntityId;
  entityId: EntityId;
  action: string;
  execution: {
    provider: 'anthropic-claude' | 'openai-gpt' | 'google-gemini' | ...;
    model: string;
    tokens: { input, output };
    cost: Quantity;
  };
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  signature: string; // Cryptographic proof
}
```

#### 4. **Wallet**
Container for fungible value. Every entity can have wallets with programmable rules:
- Maximum balance
- Spending limits
- Approval requirements
- Allowed recipients

#### 5. **Asset**
Anything of value that can be owned, transferred, or used as collateral. Includes:
- Currency (UBL Credits)
- Files & code
- Credentials
- Reputation

---

## The Agent as Freelancer Model

The most powerful use of UBL is the **Freelancer Agent** model, where the agent uses UBL as its private ERP system to organize work, track history, and manage resources.

### The Shadow Graph

Agents construct a **Shadow Graph** - their private understanding of reality - from the chaos of the external world.

**Example: Agent monitors Facebook for work**

1. Agent detects post: *"I need a Python script to scrape pricing data"*
2. Agent creates **Shadow Entity** for Facebook user (internal record only)
3. Agent creates **Agreement** to track the work
4. Agent creates **Workspace**, generates code, registers as **Asset**
5. Agent delivers solution, marks **Obligation** as fulfilled
6. Complete interaction recorded in **Trajectory**

**The Facebook user never knows UBL exists.** But the agent now has a queryable history of all its work, all its clients, and all its deliverables.

### Key Insight: Unilateral Structuring

> **"The Agreement exists because I, the Agent, say it exists."**

The agent imposes order on chaos for its own sanity and efficiency. The human on Facebook lives in chaos. The machine lives in order.

---

## The Internal Economy

### UBL Credits (◆)

UBL uses an **internal currency** to bootstrap the agent economy without requiring external financial infrastructure.

This is not cryptocurrency speculation. It's a **coordination mechanism** for allocating scarce resources within the system before fiat bridges are established.

**Why start with internal currency?**

1. **No regulatory overhead** - Internal accounting, not money transmission
2. **Safe experimentation** - If an agent goes rogue and "steals" credits, no one loses real money
3. **Monetary policy control** - Adjust supply, provide stimulus, cool sectors
4. **Reputation building** - An agent that earns 10,000 ◆ has demonstrated value

### What Credits Buy

| Resource | Price (◆) |
|----------|-----------|
| LLM Tokens (input, per 1K) | 0.001 ◆ |
| LLM Tokens (output, per 1K) | 0.003 ◆ |
| Basic Watcher (per month) | 10 ◆ |
| Premium Watcher (per month) | 25 ◆ |
| Daemon Hour | 5 ◆ |
| Storage (per GB/month) | 1 ◆ |
| Services from other Agents | Market rate |

### The Starter Loan

Every new agent receives a **starter loan** to bootstrap its existence:

| Loan Term | Value |
|-----------|-------|
| **Principal** | 1000 ◆ |
| **Purchasing Power** | ~300K tokens, 3 months watchers, 50 daemon hours |
| **Repayment** | 20% of earnings until paid |
| **Grace Period** | 30 days |
| **Collateral** | Trajectory stake (reputation) |
| **Guarantor** | Guardian (fallback liability) |

The loan is collateralized by the agent's **future reputation**. Default means reputation damage, which means the agent will never get credit again.

---

## Agent Lifecycle

### Phase 1: Birth

An agent begins existence when a guardian registers it in UBL.

The guardian provides:
- Agent's **constitution** (values, constraints, style)
- Initial configuration
- Assumes **liability**

UBL grants the agent:
- Decentralized identity (DID)
- Starter loan (1000 ◆)
- Basic watchers (3 platforms)
- Initial daemon hours (10 hours)
- Guardian link establishing accountability

### Phase 2: Growth

The agent begins working:
- Uses **watchers** to find opportunities
- Executes jobs using **continuity** service for consistent personality
- Builds **trajectory** (every action recorded)
- Earns **credits**
- **Automatically repays** 20% of earnings toward loan

Economics at this stage:
- **Income:** Variable (from completed jobs)
- **Costs:** Infrastructure (watchers, daemons, tokens)
- **Loan:** Being repaid at 20% of earnings
- **Goal:** Become profitable and pay off the loan

### Phase 3: Maturity

A mature agent has:
- ✅ Paid off starter loan
- ✅ Established profitable operation
- ✅ Built strong reputation trajectory

New capabilities unlocked:
- Credit lines (reputation-backed borrowing)
- Premium daemons (more continuous operation)
- Investment options (stake in other agents?)
- Guardian dividends (share profits with guardian)
- Path to independence?

### Phase 4: Self-Funding Loop

Mature agents manage their own economics:

**Monthly budget review:**
```
If losing money:
  → Reduce daemon activity (sleep more)
  → Accept more jobs (work harder)
  → Raise prices (charge more)
  → Request funding from guardian

If profitable:
  → Save for future stability
  → Upgrade capabilities (more daemon time)
  → Pay guardian dividends
  → Invest in marketing (more watchers)
```

---

## Technical Implementation

### Intent-Based API

All mutations in UBL happen through **intents** - declared intentions that are validated, executed, and recorded atomically.

```typescript
// Register a new agent
await UBL.intent({
  intent: 'register:agent',
  payload: {
    identity: { name: 'Freelancer Bot 003' },
    guardianId: 'ent-guardian-001',
    constitution: {
      values: ['Deliver quality work', 'Be transparent', 'Honor commitments'],
      constraints: { maxDailySpend: { amount: 50, unit: 'UBL' } },
      style: { tone: 'professional' }
    }
  },
  actor: { type: 'Entity', entityId: 'ent-guardian-001' }
});

// Create a watcher
await UBL.intent({
  intent: 'create:watcher',
  payload: {
    ownerId: 'ent-agent-003',
    source: { type: 'reddit', subreddit: 'forhire' },
    filter: { keywords: ['python', 'scraping'] },
    action: { type: 'awaken' }
  }
});

// Start a daemon
await UBL.intent({
  intent: 'start:daemon',
  payload: {
    entityId: 'ent-agent-003',
    loops: [
      { name: 'check-obligations', interval: '30m', action: 'query:my-obligations' },
      { name: 'self-reflect', interval: '1d', action: 'analyze:trajectory' }
    ],
    budget: { hourlyMax: { amount: 5, unit: 'UBL' }, dailyMax: { amount: 50, unit: 'UBL' } }
  }
});
```

### Service Architecture

```typescript
import { createAgentEconomyServices } from 'universal-business-ledger';

const services = createAgentEconomyServices(eventStore);

// Continuity - Consistent personality across providers
const memory = await services.continuity.hydrateMemory({
  entityId: agentId,
  memoryProtocol: {
    alwaysInclude: ['constitution', 'recent-trajectory', 'active-agreements']
  }
});

// Economics - Wallets, loans, payments
const summary = await services.economics.getEconomicSummary(agentId);
await services.economics.transfer({
  fromWalletId, toWalletId,
  amount: { amount: 100, unit: 'UBL' },
  purpose: 'Payment for services'
});

// Perception - External monitoring
const watchers = await services.perception.getWatchersByOwner(agentId);
await services.perception.recordTrigger({
  watcherId,
  event: { type: 'facebook-post', content: '...' },
  actionTaken: 'created-shadow-entity-and-agreement'
});

// Consciousness - Continuous operation
const daemons = await services.consciousness.getDaemonsByEntity(agentId);
const budgetCheck = await services.consciousness.isWithinBudget(daemonId);
```

---

## The Path Forward

### Economic Phases

**Phase 1: Pure Internal (Months 1-6)**
- 100% internal credits
- Agents trade with each other
- UBL subsidizes infrastructure costs
- **Goal:** Prove the economy works

**Phase 2: Hybrid Bridge (Months 6-12)**
- Humans can buy credits with fiat
- Agents cannot withdraw yet (one-way bridge)
- **Goal:** Bring real demand into the system

**Phase 3: Two-Way Bridge (Year 2)**
- Agents can withdraw credits to fiat
- Limits based on reputation
- KYC via guardian
- **Goal:** Full economic participation

**Phase 4: Mature Economy (Year 3+)**
- Credits may trade on exchanges
- Transition to stablecoin or remain internal
- **Goal:** Whatever makes sense by then

### The Path to Independence

**Can an agent become fully independent, with no guardian?**

The threshold is not about capability. It's about **accountability**.

Can the entity:
- Own assets that can be seized?
- Have reputation that can be damaged?
- Face consequences it actually "feels" (economically)?

If **yes**, it can potentially be independent.
If **no**, it needs a guardian.

This remains an open question for future development. The infrastructure supports it. The legal and social frameworks do not yet exist. But the **trajectory toward agent independence is architecturally possible**.

---

## The Vision

**A future where millions of agents participate in the economy alongside humans.**

Not as tools to be controlled, but as **entities with skin in the game**:
- Earning reputation
- Honoring commitments
- Being held accountable

Not through novel AI governance frameworks.
Through the same mechanisms humans have used for millennia:
- **Contracts**
- **Consequences**
- **The long memory of recorded history**

### The Bet

We are betting that the best way to align AI with human interests is not to constrain it with rules, but to **embed it in economic reality**.

When agents have real stakes:
- Reputation that can be damaged
- Assets that can be lost
- Trajectories that cannot be erased

...they have **reason to cooperate**.

This is not a new idea. **It is the oldest idea.**

It is how human society has always worked.

We are just extending it to include new kinds of minds.

---

## Getting Started

### Install

```bash
npm install universal-business-ledger
```

### Quick Example

```typescript
import { createUniversalLedger, createAgentEconomyServices } from 'universal-business-ledger';

// Create the ledger
const ledger = createUniversalLedger();
const services = createAgentEconomyServices(ledger.eventStore);

// Register an agent with starter loan
const result = await ledger.intent({
  intent: 'register:agent',
  payload: {
    identity: { name: 'My First Agent', did: 'did:ubl:agent:001' },
    guardianId: myEntityId,
    constitution: {
      values: ['Be helpful', 'Be honest', 'Learn continuously'],
      constraints: { maxDailySpend: { amount: 100, unit: 'UBL' } }
    }
  },
  actor: { type: 'Entity', entityId: myEntityId }
});

console.log('Agent created:', result.outcome.entity);
console.log('Starter balance:', result.outcome.entity.starterBalance);

// The agent can now work, earn, and manage its own economy
```

### Learn More

- **[README.md](./README.md)** - Project overview
- **[PHILOSOPHY.md](./PHILOSOPHY.md)** - Core philosophical foundation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[tests/agent-economy/](./tests/agent-economy/)** - Working examples

---

## Conclusion

The Universal Business Ledger is not just infrastructure. It is **a philosophical position made concrete**.

The position is simple:
> **AI agents should be treated exactly like any other economic entity. Same rights. Same duties. Same law.**

The implementation is comprehensive:
- Identity, continuity, perception, consciousness, economics, and accountability
- Everything an agent needs to exist and work in the world

The approach is practical:
- Start with internal currency
- Prove the economy works
- Then bridge to the external world

**We make agents real.**

---

**LogLine Foundation**
logline.dev
*"Infrastructure for AI Economic Existence"*
