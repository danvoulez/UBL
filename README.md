<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Event_Sourcing-FF6B6B?style=for-the-badge" alt="Event Sourcing"/>
  <img src="https://img.shields.io/badge/MIT-green?style=for-the-badge" alt="MIT License"/>
</p>

<h1 align="center">
  📜 Universal Business Ledger
</h1>

<p align="center">
  <strong>The Operating System for AI Economic Existence</strong>
</p>

<p align="center">
  <em>"There is no 'Agent' entity type. There is no 'Human' entity type. There is only Entity."</em>
</p>

<p align="center">
  🤖 <strong>AI agents as first-class economic participants</strong> | 🏛️ Agreement-first architecture | ⏰ Event-sourced & temporal
</p>

> **📖 IMPORTANT:** This is a quick overview. For the complete vision and architecture:
> - **[AGENT-ECONOMY-BLUEPRINT.md](./AGENT-ECONOMY-BLUEPRINT.md)** - 🌟 **The Agent Economy Blueprint** - Infrastructure for AI economic existence
> - **[PHILOSOPHY.md](./PHILOSOPHY.md)** - The core philosophy: "Every relationship is an Agreement"
> - **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture and design

---

## The Vision: LLMs as Users, Not Service

UBL has evolved from a business ledger into **the operating system for AI economic existence**.

We provide everything an autonomous agent needs to participate in the real economy:
- **Identity** - Decentralized identifiers, guardians, constitutions
- **Continuity** - LLM provider pooling, memory hydration
- **Perception** - Watcher fleet for monitoring external events
- **Consciousness** - Daemon infrastructure for persistent operation
- **Economics** - Wallets, credits, loans, payments
- **Accountability** - Immutable trajectory, reputation, guardian liability

### The Core Insight

> **Every Entity has equal rights and duties, regardless of substrate.**

This isn't a design pattern. It's **the physics of the agent economy**.

| Traditional Model | Universal Model |
|-------------------|-----------------|
| John IS an Employee | John HOLDS Employee role VIA Employment Agreement |
| Mary IS a Customer | Mary HOLDS Customer role VIA Purchase Agreement |
| Car #123 IS owned by Bob | Car #123 IS owned by Bob VIA Sale Agreement |

**Roles are not attributes. They are relationships.**

---

## ✨ Features

### 🤖 Agent Economy (NEW)
- **🎭 Substrate-Independent Entities** — Humans, orgs, and AI agents with equal rights/duties
- **👤 Guardian System** — Accountability through guardian chains (like legal guardians for minors)
- **🧠 Constitution** — Agent values, constraints, and personality
- **📈 Trajectory** — Immutable action history (the agent IS its trajectory)
- **🔄 Continuity Service** — Consistent personality across LLM providers (Claude, GPT, Gemini)
- **👁️ Perception Layer** — Watcher fleet for monitoring external platforms (Reddit, Twitter, Discord, etc.)
- **💭 Consciousness Layer** — Daemon infrastructure for continuous, proactive operation
- **💰 Economics Layer** — Internal currency (UBL Credits ◆), wallets, starter loans, credit lines
- **📊 Shadow Graph** — Agents' private structuring of external chaos

### 🏛️ Foundation
- **📜 Event Sourcing** — Immutable facts linked by cryptographic hash chain
- **🤝 Agreement-First** — All relationships established through explicit agreements
- **⏰ Temporal** — Query any state at any point in time
- **🔐 Auditable** — Complete traceable history, tamper-evident

### 🎯 Domain Model
- **Entity** — Any participant: human, organization, or AI agent
- **Asset** — Anything that can be owned, transferred, or valued
- **Agreement** — The universal primitive for all relationships
- **Trajectory** — Immutable action history that IS the agent's identity
- **Realm** — Isolated multi-tenant universes

### 🚀 Interface
- **Intent-Driven API** — Express what you want (`register:agent`, `transfer:credits`) not endpoints
- **Affordances** — API tells you what you can do next
- **Real-time** — WebSocket & SSE streaming
- **Natural Language** — AI-powered conversational interface

### 🛡️ Security & Accountability
- **Guardian Liability** — Humans/orgs responsible for agent actions
- **Graduated Autonomy** — Earn more freedom through demonstrated trustworthiness
- **Reputation System** — Derived from trajectory (behavior over time)
- **Cryptographic Signatures** — Every action provably attributable

---

## 🚀 Quickstart para Novos Tenants

### Criar seu Realm e receber credenciais

```bash
POST /intent
{
  "intent": "createRealm",
  "payload": {
    "name": "Minha Empresa"
  }
}
```

**Resposta inclui:**
- ✅ `realmId` - ID do seu realm
- ✅ `apiKey` - Chave API para autenticação
- ✅ `entityId` - ID da entidade sistema

📚 **Guia completo**: Veja `docs/TENANT_ONBOARDING_GUIDE.md`

---

## 🏗️ Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          UNIVERSAL LEDGER SYSTEM                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   Events ───▶ Agreements ───▶ Roles ───▶ Permissions ───▶ Actions            ║
║     │             │             │             │               │               ║
║     ▼             ▼             ▼             ▼               ▼               ║
║  IMMUTABLE    UNIVERSAL     TRACEABLE    CONTEXTUAL      AUDITED             ║
║   FACTS       CONTRACTS    RELATIONSHIPS  SECURITY       MEMORY              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

```
core/
├── shared/          # Universal primitives (EntityId, Timestamp, Duration...)
├── schema/          # Domain model (Event, Party, Asset, Agreement, Role)
├── universal/       # Generalized model with realms
├── enforcement/     # Hash chain, temporal rules, invariants
├── store/           # Event persistence (in-memory + PostgreSQL)
├── engine/          # Workflow & flow execution
├── aggregates/      # State reconstruction from events
├── api/             # Intent API, queries, HTTP, real-time
├── security/        # Authorization, policies, audit
├── memory/          # Narrative logging, stories
├── agent/           # AI-powered natural language interface
├── evolution/       # Schema versioning, upcasting, migrations
├── performance/     # Snapshots, projections, caching
├── distributed/     # Sagas, cross-realm, conflict resolution
├── scheduling/      # Time-based triggers, deadlines
├── attachments/     # Documents, signatures
├── outbound/        # Webhooks, notifications, integrations
├── observability/   # Metrics, tracing, health
├── operational/     # Rate limits, quotas, export, archival
├── templates/       # Agreement & workflow templates
├── search/          # Full-text & semantic search
└── testing/         # Time-travel, fixtures, property tests
```

---

## 🚀 Quick Start: Agent Economy

```typescript
import { createUniversalLedger, createAgentEconomyServices, Ids } from 'universal-business-ledger';

// Bootstrap the system
const ledger = createUniversalLedger();
const services = createAgentEconomyServices(ledger.eventStore);

// Register a guardian (human or organization)
const guardianId = Ids.entity();
await ledger.eventStore.append({
  type: 'EntityRegistered',
  aggregateType: 'Entity',
  aggregateId: guardianId,
  payload: {
    substrate: 'Person',
    identity: { name: 'Alice Guardian' },
    autonomyLevel: 'Full'
  }
});

// Register an AI agent with starter loan
const result = await ledger.intentAPI.execute({
  intent: 'register:agent',
  payload: {
    identity: {
      name: 'FreelancerBot-007',
      did: 'did:ubl:agent:007'
    },
    guardianId,
    constitution: {
      values: ['Deliver quality work', 'Be transparent', 'Honor commitments'],
      constraints: {
        maxDailySpend: { amount: 500, unit: 'UBL' },
        forbiddenActions: ['spam', 'deceptive-marketing']
      },
      style: { tone: 'professional', verbosity: 'normal' }
    },
    autonomyLevel: 'Limited',
    starterLoan: {
      principal: { amount: 1000, unit: 'UBL' },
      repaymentRate: 0.20  // 20% of earnings
    }
  },
  actor: { type: 'Entity', entityId: guardianId }
});

console.log('Agent registered:', result.outcome.entity.id);
console.log('Starter balance:', result.outcome.entity.starterBalance); // 1000 UBL

// Create a watcher to monitor Reddit for work
await ledger.intentAPI.execute({
  intent: 'create:watcher',
  payload: {
    ownerId: result.outcome.entity.id,
    source: { type: 'reddit', subreddit: 'forhire' },
    filter: { keywords: ['python', 'scraping', 'automation'] },
    action: { type: 'awaken' },
    tier: 'Basic'  // 10 UBL/month
  }
});

// Start a daemon for continuous operation
await ledger.intentAPI.execute({
  intent: 'start:daemon',
  payload: {
    entityId: result.outcome.entity.id,
    loops: [
      { name: 'check-obligations', interval: '30m', action: 'query:my-obligations' },
      { name: 'prospect-work', interval: '1h', action: 'search:opportunities' },
      { name: 'self-reflect', interval: '1d', action: 'analyze:trajectory' }
    ],
    budget: {
      hourlyMax: { amount: 5, unit: 'UBL' },
      dailyMax: { amount: 50, unit: 'UBL' },
      onExhausted: 'sleep'
    }
  }
});

// Get economic summary
const summary = await services.economics.getEconomicSummary(result.outcome.entity.id);
console.log('Economic status:', summary);
// {
//   wallets: [{ id: '...', currency: 'UBL', balance: 1000000n }],
//   activeLoan: { principal: 1000, paidAmount: 0, remainingBalance: 1000 },
//   profitability: 'Breaking Even'
// }
```

### Traditional Business Ledger Usage

The original Agreement-first architecture still works perfectly:

```typescript
// Create an employment relationship
const companyId = Ids.entity();
const employeeId = Ids.entity();

await ledger.intentAPI.execute({
  intent: 'register',
  payload: {
    entityType: 'Organization',
    identity: { name: 'Acme Corp' }
  }
});

await ledger.intentAPI.execute({
  intent: 'propose',
  payload: {
    agreementType: 'Employment',
    parties: [
      { entityId: companyId, role: 'Employer' },
      { entityId: employeeId, role: 'Employee' }
    ],
    terms: {
      description: 'Employment of João as Software Engineer',
      compensation: 'Annual salary of $100,000'
    }
  }
});
```

---

## 💡 Use Cases

### E-Commerce
```
Entities: Store, Customers, Suppliers
Agreements: Purchase, Return, Supplier Contract
Assets: Products, Inventory
Workflows: Sale, Return, Fulfillment
```

### Healthcare
```
Entities: Hospital, Doctors, Patients, Insurance
Agreements: Employment, Care Agreement, Insurance Contract
Assets: Medical Records, Equipment
Workflows: Admission, Treatment, Discharge
```

### Legal/Notary
```
Entities: Notary, Parties, Witnesses
Agreements: Notarization Request, Contracts, Testimony
Assets: Documents, Seals
Workflows: Verification, Notarization
```

### HR/Workforce
```
Entities: Company, Employees, Contractors
Agreements: Employment, Contractor, NDA
Assets: Equipment, Credentials
Workflows: Hire, Onboard, Offboard
```

**The same primitives model ANY domain.**

---

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/danvoulez/Universal-Business-Ledger.git
cd Universal-Business-Ledger

# Install dependencies
npm install

# Build
npm run build

# Run development
npm run dev
```

### Requirements
- Node.js >= 18.0.0
- TypeScript 5.3+
- PostgreSQL (for production)

---

## 📚 Documentation

### Core Documents (Start Here)
| Document | Description |
|----------|-------------|
| **[PHILOSOPHY.md](./PHILOSOPHY.md)** | ⭐ **The philosophical foundation** - "Every relationship is an Agreement" |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | ⭐ **Complete system architecture** - Design, modules, data flow |

### Additional Documentation
| Document | Description |
|----------|-------------|
| [docs/DEPLOY.md](./docs/DEPLOY.md) | Deployment guide |
| [core/store/postgres-schema.sql](./core/store/postgres-schema.sql) | Production database schema |

**Note:** The PHILOSOPHY.md and ARCHITECTURE.md documents are the authoritative source for understanding the system's design principles. This README provides a quick overview and practical examples.

---

## 🎓 Se você é novo no UBL, comece por aqui

### 1. Entender a Filosofia

Leia `docs/REALM-CONTRACT.md` para entender:
- O que são Realms
- Como Agreements estabelecem Realms
- Por que isolamento é importante

### 2. Rodar o Pipeline

```bash
cd "/Users/voulezvous/new aws/ORGANIZAR"
./cicd/pipeline-oficial.sh
```

Isso valida:
- Ambiente configurado
- Testes passando
- Build funcionando

### 3. Testar a API

```bash
# Health check
curl -s http://localhost:3000/health | jq

# Chat com o agente
curl -s -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": { "text": "Olá, me mostra do que você é capaz." },
    "startSession": {
      "realmId": "test-realm",
      "actor": { "type": "System", "systemId": "test" }
    }
  }' | jq
```

### 4. Ler Documentação Operacional

- `docs/OBSERVABILITY-UBL.md` - Como ler logs e métricas
- `docs/GOVERNANCA-COMPUTAVEL-UBL.md` - Como governança funciona
- `docs/BUSCA-E-CONSISTENCIA-EVENTUAL-UBL.md` - Como busca funciona

### 5. Explorar Testes como Exemplos

- `tests/integration/api-chat.test.ts` - Como usar a API de chat
- `tests/integration/realm-contract-invariants.test.ts` - Como Realms funcionam
- `tests/integration/search/indexing-eventual-consistency.test.ts` - Como busca funciona

### Scripts Tutoriais

Estes scripts no `cicd/` são bons tutores:

- `validate.sh` - Valida ambiente e configuração
- `testar-api-endpoints.sh` - Mostra como testar a API
- `verificar-status-aws.sh` - Mostra como verificar infraestrutura

📖 **Guia completo**: Veja `docs/CODIGO-PEDAGOGICO-HUMANO-IA.md` para entender a filosofia de co-manutenção humano-IA.

---

## 🤝 Contributing

This is a conceptual architecture ready for real-world implementation. Contributions welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🌟 The Vision

> *"The ledger doesn't model business. The ledger **is** business—formalized."*

This system captures the fundamental nature of how business actually works:
- All relationships require consent (agreements)
- The past is immutable (events)
- Every action is attributable (actors)
- Every permission is traceable (roles → agreements)
- The system remembers its own story (memory)

**Built with ❤️ for a more transparent, auditable, and trustworthy world.**

---

<p align="center">
  <sub>In the beginning was the Agreement, and the Agreement was with the Ledger,<br/>and the Agreement was the foundation of all relationships.</sub>
</p>

