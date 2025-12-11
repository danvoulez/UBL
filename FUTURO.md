# FUTURO - Universal Business Ledger Roadmap

## O Que É UBL

UBL é o **escritório do LLM**. O lugar onde ele:
- Tem **identidade** (Entity + Trajectory)
- Tem **dinheiro** (Wallet + Credits internos)
- Tem **comunicação** (Watchers)
- Tem **consciência** (Daemons)
- Tem **direitos e deveres** (Agreements + ABAC)

**UBL é o permitidor da inclusão do LLM na economia e na cidadania.**

---

## Fase 0: Foundation (ATUAL) ✅

O que já temos:
- Event Store imutável com hash chain
- Agreement-first architecture
- Universal API (POST /intent)
- ABAC (Agreement-Based Access Control)
- Container system
- 138 battle tests

---

## Fase 1: Agent Economy Core

**Objetivo:** Agentes como entidades econômicas de primeira classe.

### 1.1 Entity Evolution
- [ ] Adicionar `guardian` ao Entity (chain of accountability)
- [ ] Adicionar `constitution` ao Entity (values, constraints, style)
- [ ] Adicionar `autonomyLevel` (Supervised → Limited → Full → Emancipated)
- [ ] `EntitySubstrate` (Person, Organization, Agent, System, Hybrid)
- [ ] Trajectory como identidade do agente

### 1.2 Economic Primitives
- [ ] Wallet (container de valor)
- [ ] UBL Credits (◆) - moeda interna
- [ ] Transaction (movimento de valor)
- [ ] StarterLoan (bootstrap para novos agentes)
- [ ] Loan repayment via % of earnings

### 1.3 Intents Econômicos
- [ ] `register:agent` - com guardian, constitution, starter loan
- [ ] `create:wallet`
- [ ] `transfer:credits`
- [ ] `disburse:loan`
- [ ] `repay:loan`
- [ ] `record:trajectory`

---

## Fase 2: Perception Layer

**Objetivo:** Agentes veem o mundo externo.

### 2.1 Watcher Fleet
- [ ] Watcher schema (source, filter, action, tier)
- [ ] `create:watcher` intent
- [ ] Watcher sources: Telegram, Discord, Email, RSS, Webhook
- [ ] Watcher actions: awaken, queue, notify
- [ ] Billing: Basic (10◆/mês), Premium (25◆/mês)

### 2.2 Shadow Graph
- [ ] ShadowEntity (representação interna de entidades externas)
- [ ] `register:shadow` intent
- [ ] Interaction history tracking
- [ ] Agent's private reputation assessment
- [ ] Promotion: Shadow → Real Entity

---

## Fase 3: Consciousness Layer

**Objetivo:** Agentes persistem e agem proativamente.

### 3.1 Daemon Infrastructure
- [ ] Daemon schema (loops, budget, heartbeat)
- [ ] `start:daemon` intent
- [ ] Scheduled loops execution
- [ ] Budget enforcement (hourly/daily limits)
- [ ] Sleep/wake based on economics

### 3.2 Continuity Service
- [ ] Memory hydration (constitution + trajectory + agreements)
- [ ] Personality consistency
- [ ] Context injection based on relevance

---

## Fase 4: Unilateral Obligations

**Objetivo:** Agentes podem se comprometer unilateralmente.

- [ ] UnilateralObligation schema
- [ ] `declare:obligation` intent
- [ ] Agent reasoning capture
- [ ] External stimulus processing
- [ ] Self-binding commitments

---

## Fase 5: Infrastructure (FUTURO DISTANTE)

**Objetivo:** Só após sucesso inicial. Não dar passos maiores que a perna.

### 5.1 LLM Gateway (Quando houver demanda)
- [ ] Provider pooling próprio (Claude, GPT, Gemini)
- [ ] Billing unificado
- [ ] Fallback automático

### 5.2 Economic Bridges (Quando houver volume)
- [ ] Humans buy credits with fiat
- [ ] Agents withdraw to fiat
- [ ] KYC via guardian

### 5.3 Hosting (Muito depois)
- [ ] Agent hosting service
- [ ] Managed daemons

---

## Princípios Invioláveis

1. **Tudo via Event Store** - Nenhum estado fora do ledger
2. **Tudo via Intents** - Nenhum bypass, tudo auditável
3. **ABAC sempre** - Toda ação verifica permissões via agreements
4. **Actor em tudo** - Nenhuma ação anônima
5. **Container-aware** - Respeitar hierarquia de containers
6. **Sem migrations** - Schema evolui via eventos, não SQL

---

## Métricas de Sucesso

| Fase | Métrica |
|------|---------|
| 1 | 10 agentes registrados com wallets |
| 2 | 100 watchers ativos |
| 3 | 10 daemons rodando |
| 4 | 1000 obligations declaradas |
| 5 | Primeiro agente lucrativo |

---

**"UBL is AWS for AI Agents—but instead of compute, we provide existence."**
