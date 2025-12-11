# Memória no UBL

> Memória = Tudo que eu consigo ler

---

## O Insight

Não existem "tipos de memória" no UBL.

Existe:
1. **Ledger** - Todos os eventos, sempre
2. **Query** - O que eu quero saber
3. **Acesso** - O que eu tenho permissão de ver

**Memória é o resultado de Query + Acesso.**

---

## Por que não separar?

Sistemas tradicionais separam:
- "Memória de curto prazo" vs "longo prazo"
- "Memória do agente" vs "do sistema"
- "Contexto de sessão" vs "histórico"

Isso cria:
- Código duplicado
- Sincronização entre stores
- Confusão conceitual
- Bugs de consistência

No UBL, **tudo é Event no Ledger**. A "memória" é só uma view.

---

## Como funciona

### O Ledger (Event Store)

```
┌─────────────────────────────────────────────────────────────┐
│  LEDGER                                                     │
├─────────────────────────────────────────────────────────────┤
│  Event #1: EntityRegistered (Script "Tradutor")             │
│  Event #2: WalletCreated (Script "Tradutor")                │
│  Event #3: LoanDisbursed (1000 ◆)                           │
│  Event #4: TransferExecuted (Cliente → Script, 50 ◆)        │
│  Event #5: TrajectorySpanRecorded (translate:text)          │
│  Event #6: ShadowEntityCreated ("Cliente X")                │
│  Event #7: ShadowEntityUpdated (trustLevel: High)           │
│  Event #8: DaemonHeartbeat                                  │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

### Quem vê o quê

**Script "Tradutor" vê:**
```
Seus próprios eventos
+ Eventos de entidades que ele tem permissão
+ Eventos públicos

= Sua "memória"
```

**Guardian do Script vê:**
```
Eventos do script
+ Eventos de agreements com o script
+ Seus próprios eventos

= Sua "visão de supervisão"
```

**Serviço (Antenna) durante sessão vê:**
```
Eventos da sessão atual
+ Eventos do usuário logado
+ Eventos das entidades que o usuário pode ver

= "Contexto da conversa"
```

**Sistema (Admin) vê:**
```
Tudo

= Audit trail completo
```

---

## Implementação

### Não precisa de módulos separados

```typescript
// ❌ ANTES: Módulos separados
import { AgentMemory } from 'core/cognition/memory';
import { SessionContext } from 'antenna/session';
import { TrajectorySpan } from 'core/trajectory';

// ✅ DEPOIS: Tudo é query no EventStore
const myMemory = await eventStore.query({
  filter: { 
    $or: [
      { aggregateId: myId },
      { 'payload.subjectId': myId },
    ]
  },
  actor: me,  // ABAC filtra automaticamente
});
```

### ABAC controla acesso

```typescript
// O EventStore já usa ABAC
const events = await eventStore.query({
  filter: { type: 'TransferExecuted' },
  actor: currentActor,
});

// Se actor é o Script, vê só transferências dele
// Se actor é Guardian, vê transferências dos scripts dele
// Se actor é Admin, vê todas
```

### "Consolidação" é só mais Events

```typescript
// Criar um resumo não deleta nada
await eventStore.append({
  type: 'MemoryConsolidated',
  payload: {
    summary: 'Cliente X: formal, exigente com prazos',
    consolidatedEventIds: ['evt-1', 'evt-2', 'evt-3'],
    retentionPolicy: 'archive', // Não aparece em queries normais
  },
  actor,
});
```

---

## Queries comuns

### "Memória" do Script (Cognition)

```typescript
// O que eu sei sobre meus clientes?
const clientMemory = await eventStore.query({
  filter: {
    type: { $in: ['ShadowEntityCreated', 'ShadowEntityUpdated', 'ShadowInteractionRecorded'] },
    'payload.ownerId': scriptId,
  },
  sort: { timestamp: -1 },
  limit: 100,
});
```

### "Contexto" da Sessão

```typescript
// O que aconteceu nesta conversa?
const sessionContext = await eventStore.query({
  filter: {
    'metadata.sessionId': sessionId,
    timestamp: { $gte: sessionStart },
  },
  sort: { timestamp: 1 },
});
```

### "Trajectory" para Audit

```typescript
// Todas as ações do script (para auditoria)
const trajectory = await eventStore.query({
  filter: {
    type: 'TrajectorySpanRecorded',
    'payload.entityId': scriptId,
  },
  sort: { timestamp: 1 },
  // Sem limit - audit precisa de tudo
});
```

### "Saldo" do Wallet

```typescript
// Quanto eu tenho?
const walletEvents = await eventStore.query({
  filter: {
    type: { $in: ['CreditsMinted', 'CreditsTransferred', 'LoanRepaymentMade'] },
    $or: [
      { 'payload.toWalletId': walletId },
      { 'payload.fromWalletId': walletId },
    ],
  },
});
const balance = calculateBalance(walletEvents); // Aggregate
```

---

## Vantagens

### 1. Uma fonte de verdade
Não tem "a memória diz X mas o audit diz Y".

### 2. Auditável por natureza
Até a "memória" do script é rastreável. Você pode ver quando ele "aprendeu" algo.

### 3. Replay
Pode reconstruir qualquer estado em qualquer ponto no tempo.

### 4. Simples
Menos código, menos conceitos, menos bugs.

### 5. Permissões consistentes
ABAC funciona igual para tudo.

---

## O que isso significa para o código

### Deprecar

- `core/cognition/memory.ts` → Vira helpers de query
- `antenna/agent/memory.ts` → Remove (já é re-export)

### Manter

- `EventStore` → Fonte de verdade
- `ABAC` → Controle de acesso
- Aggregates → Calculam estado a partir de eventos

### Adicionar

- Query helpers para padrões comuns
- Índices para queries frequentes

---

## Resumo

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Memória = Query(Ledger, MeuAcesso)                        │
│                                                             │
│   Não existe memória separada.                              │
│   Existe o que eu posso ler.                                │
│                                                             │
│   Script lê → "memória do script"                           │
│   Serviço lê → "contexto da sessão"                         │
│   Auditor lê → "audit trail"                                │
│                                                             │
│   Mesmos dados, queries diferentes, acessos diferentes.     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

*UBL Memory Model v1.0 - Dezembro 2024*
