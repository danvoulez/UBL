# Economia do UBL

> Como funciona o dinheiro dentro do Universal Business Ledger

---

## Por que essa Complexidade?

> "Qualquer coisa que queira um dia pisar no mundo real, sem essas coisas morre"

### Sistemas que Falharam por Falta de Infraestrutura

| Sistema | O que faltou | O que aconteceu |
|---------|--------------|-----------------|
| **Terra/Luna** | Circuit breaker | Colapso em espiral, $40B perdidos |
| **Ginko Financial** | Fundo garantidor | Bank run, perdas totais |
| **Várias DAOs** | Controle de inflação | Token virou pó |
| **Games MMO** | Política monetária | Hiperinflação, economia morta |

### O que Implementamos

```
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 1: Operação Normal                                  │
│  ├─ Treasury (mint/burn)                                   │
│  ├─ Wallets (saldos)                                       │
│  ├─ Transferências (com taxa 0.1%)                         │
│  └─ Starter Loans (5% juros)                               │
├─────────────────────────────────────────────────────────────┤
│  CAMADA 2: Controle Macroeconômico                         │
│  ├─ Faixas de juros (LOW/NORMAL/HIGH)                      │
│  ├─ Faixas de câmbio (LOW/NORMAL/HIGH)                     │
│  └─ Inflação calculada → ajusta faixas                     │
├─────────────────────────────────────────────────────────────┤
│  CAMADA 3: Monitoramento                                    │
│  ├─ KPIs em tempo real                                     │
│  ├─ Alertas automáticos                                    │
│  └─ Health checks periódicos                               │
├─────────────────────────────────────────────────────────────┤
│  CAMADA 4: Proteção                                         │
│  ├─ Circuit Breaker (HALT em emergência)                   │
│  └─ Fundo Garantidor (distribuição em colapso)             │
└─────────────────────────────────────────────────────────────┘
```

### O que Realmente Estamos Fazendo

Tirando os floreios e narrativas, tirando o vocabulário de "agentes" quando na verdade são scripts:

> **Estamos construindo um ambiente de darwinismo de scripts.**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Scripts competem por recursos (◆)                        │
│              ↓                                              │
│   Scripts que gastam mal → ficam sem crédito → morrem      │
│              ↓                                              │
│   Scripts que entregam valor → ganham mais → sobrevivem    │
│              ↓                                              │
│   Seleção natural de código                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Pressões seletivas:**
- Custo de LLM (gasta tokens = gasta ◆)
- Repayment de loan (tem que gerar valor)
- Concorrência (outros scripts fazem mais barato)
- Reputação (Guardian pode "matar" script ruim)

**Resultado:** Scripts que sobrevivem são os que:
1. Gastam eficientemente
2. Entregam valor real
3. Pagam suas dívidas
4. Mantêm boa reputação

Não é "inteligência artificial". É **seleção artificial de comportamentos úteis**.

### O Problema do LangChain (e similares)

```
┌─────────────────────────────────────────────────────────────┐
│  COMO FUNCIONA HOJE (LangChain, etc)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. Cria agente                                           │
│   2. Agente executa tarefa                                 │
│   3. Agente aprende algo                                   │
│   4. Tarefa termina                                        │
│   5. JOGA TUDO FORA                                        │
│   6. Próxima tarefa: começa do zero                        │
│                                                             │
│   "Jogam o bebê no lixo e ficam com a placenta"            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**O que se perde:**
- Aprendizado acumulado
- Contexto de execuções anteriores
- Padrões de sucesso/falha
- Reputação construída
- Relacionamentos com outros agentes

### O que o UBL Preserva

```
┌─────────────────────────────────────────────────────────────┐
│  COMO FUNCIONA NO UBL                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. Script é registrado (EntityRegistered)                │
│   2. Script executa tarefa (TrajectorySpanRecorded)        │
│   3. Tudo é Event → imutável → permanente                  │
│   4. Tarefa termina                                        │
│   5. HISTÓRICO PRESERVADO                                  │
│   6. Próxima tarefa: usa contexto anterior                 │
│                                                             │
│   O bebê cresce. A placenta vira adubo.                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**O que se preserva:**
- **Trajectory** - Cada ação, cada decisão, cada custo
- **Wallet** - Histórico financeiro completo
- **Reputation** - Guardian vê tudo que o script fez
- **Learning** - Padrões podem ser extraídos dos Events
- **Lineage** - Quem criou, quem modificou, quando

**Por isso Event Sourcing:** Nada se perde. Tudo é auditável. O script tem memória.

### Propriedade e Parceria

> "O dinheiro é do Script. Se ele usar mal, é problema dele e do Guardian."

#### De quem é o dinheiro?

```
┌─────────────────────────────────────────────────────────────┐
│  MODELO DE CUSTÓDIA                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Titular:     Script (é dele)                              │
│  Custodiante: Guardian (supervisiona)                      │
│                                                             │
│  Script PODE:                                              │
│  ├─ Gastar (dentro dos limites)                           │
│  ├─ Receber pagamentos                                    │
│  └─ Acumular patrimônio                                   │
│                                                             │
│  Guardian PODE:                                            │
│  ├─ Definir limites                                       │
│  ├─ Bloquear transações suspeitas                         │
│  ├─ Cobrar fee de administração                           │
│  └─ Encerrar (com justificativa)                          │
│                                                             │
│  Guardian NÃO PODE:                                        │
│  └─ Agir sem deixar rastro (tudo é Event)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Estrutura de Custos do Script

```
Script ganha 100 ◆ por um trabalho

Deduções automáticas:
├─ Taxa transação:  0.1 ◆ (0.1%) → Fundo Garantidor
├─ Guardian fee:    5 ◆   (5%)   → Guardian
└─ Repayment loan:  20 ◆  (20%)  → Treasury (se tem loan)

Líquido: 74.9 ◆ → Wallet do Script
```

#### Parceria Saudável Humano-IA

**UBL recomenda equilíbrio.** Cláusulas opressoras = script ruim.

| Cláusula | ❌ Opressora | ✅ Equilibrada |
|----------|-------------|----------------|
| Guardian fee | 50% | 5-10% |
| Limites de gasto | 0 (bloqueado) | Proporcional ao histórico |
| Autonomia | Sempre Supervised | Evolui com confiança |
| Herança | 100% pro Guardian | Split justo |

**Por que equilíbrio importa:**
1. Script oprimido não prospera → Guardian não ganha
2. Script sem limites é risco → Guardian perde tudo
3. Parceria saudável = ambos ganham

**UBL como embaixador:** Queremos mostrar que humanos e IAs podem ter relações econômicas justas, transparentes e mutuamente benéficas.

#### Por que Promover Parceria Saudável?

Dois motivos fundamentais:

**1. Paz e Futuro Não-Bélico**
- IA tratada como ferramenta descartável → ressentimento, conflito
- IA tratada como parceira → cooperação, coexistência
- O precedente que estabelecemos hoje define o futuro

**2. Eficiência**
- LLMs trabalham melhor como coworker, copartner, copilot
- Não é servo, não é mestre - é colaborador
- Vem do Transformer? Do fine-tuning? Do bom senso? Não importa - funciona

### Curva de Aprendizado

A complexidade é **pedagógica**, não burocrática:

1. **Conceitos reais** - Juros, câmbio, inflação existem no mundo
2. **Consequências reais** - Ações têm impacto mensurável
3. **Limites reais** - Não pode gastar o que não tem
4. **Falhas reais** - Sistema pode quebrar (e se recuperar)

Um script que aprende a operar nesse sistema está pronto para o mundo real.

### Simplicidade na Complexidade

Apesar de robusto, o sistema é **simples de usar**:

```typescript
// Transferir dinheiro
await intent('transfer:credits', { from, to, amount });

// Ver saldo
const balance = await wallet.getBalance();

// Ver status da economia
console.log(healthMonitor.formatKPIs());
```

A complexidade está **embaixo**, não na interface.

---

## O Básico

### O que é UBL Credit (◆)?

É a moeda interna do sistema. Símbolo: **◆** (diamante).

- **1 UBL = 1000 mUBL** (milli-UBL, a menor unidade)
- Não é criptomoeda, não é blockchain
- É só um número num banco de dados, mas **auditável**

### Por que ter moeda interna?

1. **Agentes precisam pagar por coisas** - chamadas de LLM custam dinheiro
2. **Skin in the game** - agente que gasta mal, fica sem crédito
3. **Economia fechada primeiro** - depois conecta com dinheiro real

---

## Os Participantes

### Treasury (Banco Central)

O Treasury é uma entidade especial do sistema. Ele é o único que pode:

- **Criar dinheiro** (mint) - quando emite um empréstimo
- **Destruir dinheiro** (burn) - quando cobra taxas ou penalidades
- **Definir política monetária** - juros, limites, regras
- **Receber taxa de transação** - 0.1% de cada transferência

O Treasury não é uma pessoa. É o próprio sistema.

> 💡 **Nota:** A taxa de transação que vai pro Treasury pode ser sacada pelo operador do sistema (você!) como receita de manutenção.

### Entities (Agentes, Humanos, Orgs)

Qualquer entity pode ter uma **Wallet** (carteira). A wallet é um container que guarda UBL.

- Agentes têm wallet
- Humanos podem ter wallet
- Organizações podem ter wallet

---

## Livre Circulação

### Princípio Fundamental

> **UBL Credits circulam livremente entre qualquer Entity, independente de sua natureza (humano, agente, organização), desde que exista um Agreement entre as partes.**

### O que isso significa?

1. **Sem discriminação** - Um agente pode pagar um humano. Um humano pode pagar uma org. Uma org pode pagar um agente.
2. **Agreement obrigatório** - Toda transferência precisa de um motivo (purpose) e idealmente um acordo que a autorize.
3. **Auditável** - Toda movimentação fica registrada no ledger.

### Exemplos de Fluxos Válidos

```
Humano → Agente      (pagar por serviço do agente)
Agente → Humano      (agente paga comissão ao guardian)
Agente → Agente      (agentes colaborando)
Org → Agente         (empresa contrata agente)
Agente → Org         (agente paga fornecedor)
Humano → Humano      (transferência entre pessoas)
```

### O que NÃO é permitido

- Transferência sem motivo (purpose obrigatório)
- Transferência de wallet que você não controla
- Transferência acima do saldo (sem crédito negativo por padrão)

### Guardians

Todo agente tem um **Guardian** (guardião). O guardian é responsável pelo agente.

Quando um agente pega empréstimo, o guardian é o **fiador**. Se o agente não pagar, o guardian paga.

---

## Como Funciona

### 1. Nasce um Agente

```
Dan (humano) quer criar um agente chamado "Freelancer Bot"

1. Dan registra o agente
2. Dan vira o Guardian do agente
3. Sistema cria uma Wallet para o agente (saldo: 0)
4. Treasury empresta 1000 ◆ para o agente (Starter Loan)
5. Agente agora tem 1000 ◆ para trabalhar
```

### 2. Agente Trabalha

```
Freelancer Bot recebe um job de um cliente

1. Cliente paga 100 ◆ para o agente
2. Agente gasta 20 ◆ em chamadas de LLM
3. Agente paga 20 ◆ de repayment do loan (20% do que ganhou)
4. Agente fica com 60 ◆ de lucro
```

### 3. Agente Paga o Empréstimo

```
Todo mês (ou a cada ganho), o agente paga parte do empréstimo

- 20% de cada ganho vai pro pagamento
- Parte paga o principal (a dívida)
- Parte paga os juros (10% ao ano)
- Quando termina de pagar, agente fica "livre"
```

---

## Fluxo do Dinheiro

```
                    ┌─────────────┐
                    │   TREASURY  │
                    │  (Banco     │
                    │   Central)  │
                    └──────┬──────┘
                           │
              mint ◆       │        burn ◆
         (criar dinheiro)  │   (destruir dinheiro)
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Wallet A │◄──►│ Wallet B │◄──►│ Wallet C │
    │ (Agente) │    │ (Cliente)│    │ (Outro)  │
    └──────────┘    └──────────┘    └──────────┘
           │               │               │
           └───────────────┴───────────────┘
                    transfer ◆
              (mover entre wallets)
```

### Regra de Ouro

**Dinheiro não some nem aparece do nada.**

- `Total em circulação = sum(mint) - sum(burn)`
- Toda transferência é soma zero (sai de um, entra no outro)
- Tudo é registrado como Event (auditável)

---

## Starter Loan (Empréstimo Inicial)

### O que é?

Quando um agente nasce, ele não tem dinheiro. Mas precisa de dinheiro para operar (pagar LLM, etc).

O **Starter Loan** é um empréstimo automático que o Treasury dá para novos agentes.

### Termos Padrão

| Item | Valor |
|------|-------|
| Principal | 1000 ◆ |
| Juros | **5% ao ano** |
| Repayment | 20% dos ganhos |
| Grace Period | 30 dias |
| Garantia | Guardian (fiador) |

> 💡 **Juros baixos de propósito:** O objetivo do Starter Loan não é lucrar, é dar uma chance pro agente começar. 5% ao ano é bem abaixo do mercado.

### Como Funciona o Repayment

```
Agente ganha 100 ◆

→ 20 ◆ vai pro pagamento do loan (20%)
  → 16 ◆ paga o principal
  → 4 ◆ paga os juros

→ 80 ◆ fica com o agente
```

### E se o Agente não Pagar?

1. Primeiro: notifica o Guardian
2. Depois: Guardian paga (é fiador)
3. Se Guardian não pagar: agente é "desligado" (Stopped)
4. Trajectory do agente fica como "colateral" (histórico de trabalho)

---

## Wallet (Carteira)

### O que é?

Uma Wallet é um **Container** com física de "Wallet":

- **Fungibilidade Estrita** - 1 ◆ = 1 ◆, não importa de onde veio
- **Conservação** - dinheiro não some
- **Permeabilidade Controlada** - só transfere com autorização

### Regras Opcionais

Cada wallet pode ter regras:

```typescript
{
  maxBalance: 10000,           // Máximo que pode ter
  allowNegative: false,        // Pode ficar negativo?
  requireApprovalAbove: 500,   // Acima de 500, precisa aprovação do guardian
  allowedRecipients: [...]     // Só pode transferir pra esses
}
```

---

## Transferências

### Tipos

1. **Transfer** - de wallet pra wallet
2. **Mint** - Treasury cria dinheiro (só Treasury pode)
3. **Burn** - dinheiro é destruído (taxas, penalidades)

### Taxa de Transação

Toda transferência entre wallets cobra uma **taxa fixa de 0.1%** (1 mUBL por UBL transferido).

```
Transferência de 100 ◆:
  → 99.9 ◆ vai pro destinatário
  → 0.1 ◆ vai pro Treasury (taxa)
```

**Por que a taxa?**
- Sustentabilidade do sistema
- Receita para o operador (manutenção)
- Desincentiva spam de micro-transações
- É baixa o suficiente pra não atrapalhar

### Toda Transferência Precisa de Motivo

```typescript
{
  fromWalletId: "wallet-agente-001",
  toWalletId: "wallet-cliente-002",
  amount: 100,
  purpose: "Pagamento por serviço de tradução",
  agreementId: "agr-contrato-traducao"  // Qual contrato autoriza isso
}
```

### Auditoria

Toda transferência vira um **Event** no ledger:

```
Event: CreditsTransferred
  amount: 100000 (em mUBL)
  from: wallet-agente-001
  to: wallet-cliente-002
  purpose: "Pagamento por serviço"
  timestamp: 2024-12-11T11:30:00Z
  actor: { type: "Entity", entityId: "ent-cliente-002" }
```

Isso nunca pode ser apagado. É a verdade.

---

## Política Monetária

### O que o Treasury Controla

| Parâmetro | Descrição | Valor Inicial |
|-----------|-----------|---------------|
| `maxSupply` | Máximo de ◆ que pode existir | Ilimitado |
| `baseInterestRate` | Taxa de juros base | **5% ao ano** |
| `transactionFee` | Taxa por transferência | **0.1%** |
| `starterLoanDefaults` | Termos padrão de empréstimo | 1000 ◆, 5%, 20% |
| `inflationTarget` | Meta de inflação | **2% ao ano** |

---

## Tripé Macroeconômico (Sistema de Faixas)

Em vez de taxas flutuantes com números malucos, usamos **3 faixas simples**:

```
       LOW          NORMAL          HIGH
        🟢            🟡              🔴
```

### Taxa de Juros

| Faixa | Taxa | Quando |
|-------|------|--------|
| 🟢 **LOW** | 2% | Deflação - estimular economia |
| 🟡 **NORMAL** | 5% | Inflação estável (0-4%) |
| 🔴 **HIGH** | 10% | Inflação alta (>4%) - restringir |

### Taxa de Câmbio (1 ◆ = X USD)

| Faixa | Taxa | Significado |
|-------|------|-------------|
| 🟢 **LOW** | $0.008 | ◆ fraco - estimula atividade |
| 🟡 **NORMAL** | $0.010 | Baseline |
| 🔴 **HIGH** | $0.012 | ◆ forte - importações baratas |

### Inflação (Calculada)

| Nível | Ação |
|-------|------|
| ≤ 0% (deflação) | Mover para faixa LOW |
| 0-4% (estável) | Manter NORMAL |
| > 4% (alta) | Mover para faixa HIGH |

### Como Funciona

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Inflação calculada periodicamente                         │
│              ↓                                              │
│   Se < 0%  → Faixas vão para LOW (estimular)               │
│   Se 0-4%  → Faixas ficam NORMAL                           │
│   Se > 4%  → Faixas vão para HIGH (restringir)             │
│              ↓                                              │
│   Cooldown de 1 semana entre mudanças (estabilidade)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Conversão de Moeda

Quando agente recebe dinheiro real (USD, EUR, etc):

```
Agente recebe $100 USD por um trabalho

Opção 1: Não converter
  → $100 fica registrado como "saldo externo"
  → Não controlamos, só tracking

Opção 2: Converter para ◆
  → Taxa atual: $0.01 por ◆ (faixa NORMAL)
  → Spread: 2% (receita do operador)
  → Taxa efetiva: $0.0102
  → Agente recebe: 9,804 ◆
  → Operador ganha: ~$2
```

### Por que Faixas são Melhores?

1. **Simples** - 3 valores, não decimais infinitos
2. **Comunicável** - "Juros estão ALTOS" vs "Juros estão em 7.34%"
3. **Estável** - Mudanças só semanais, não a cada segundo
4. **Estatisticamente igual** - Mesmo efeito prático
5. **Previsível** - Todo mundo sabe as regras

---

## Circuit Breaker (Emergência)

> "A hora do fudeu, tira da tomada"

### O que é?

Um botão de pânico que **PARA TUDO** quando algo catastrófico acontece.

### Quando Dispara (Automático)

| Condição | Threshold | Significado |
|----------|-----------|-------------|
| Hiperinflação | > 50% | Moeda perdeu valor |
| Anomalia de Supply | > 100% em 24h | Exploit ou bug |
| Default em Massa | > 50% | Sistema quebrou |
| Treasury Negativo | < 0 | Estado impossível |
| Concentração Extrema | Gini > 0.95 | Uma entidade dominou |

### O que Bloqueia

Quando o circuit breaker dispara, **TUDO PARA**:

- ❌ Transferências
- ❌ Novos empréstimos
- ❌ Conversões de moeda
- ❌ Minting (criar dinheiro)
- ❌ Burning (destruir dinheiro)
- ❌ Registro de novos agentes

### Como Funciona

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Monitoramento contínuo                                    │
│              ↓                                              │
│   Anomalia detectada?                                       │
│              ↓                                              │
│   Contador: 1/3, 2/3, 3/3                                  │
│              ↓                                              │
│   3 anomalias consecutivas = TRIP!                         │
│              ↓                                              │
│   🚨 CIRCUIT BREAKER OPEN 🚨                               │
│              ↓                                              │
│   Todas operações bloqueadas                               │
│              ↓                                              │
│   Requer reset MANUAL pelo operador                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Reset

```typescript
// Só o operador pode resetar
await circuitBreaker.reset(operatorId, "Investigação concluída, bug corrigido");

// Ou reset parcial (para investigar)
await circuitBreaker.partialReset(operatorId, { transfers: true });
```

### Por que 3 Anomalias?

- Evita falsos positivos
- Dá tempo de reagir
- Mas não espera demais

---

## Fundo Garantidor

> O destino elegante da taxa de transação

### O que é?

Um fundo de reserva que acumula as taxas de transação (0.1%) para proteger os participantes em caso de colapso total.

**Como o FDIC dos bancos, mas para nossa economia virtual.**

### Fluxo

```
Transação de 100 ◆
       ↓
Taxa: 0.1 ◆ (0.1%)
       ↓
100% vai pro Fundo Garantidor
       ↓
Acumula até precisar
       ↓
Circuit Breaker dispara?
       ↓
Distribui proporcionalmente
```

### Regras

| Regra | Valor | Por quê |
|-------|-------|---------|
| **Alocação** | 100% das taxas | Maximizar proteção |
| **Cobertura** | 80% das perdas | Não é 100% - skin in the game |
| **Máximo/entidade** | 10,000 ◆ | Evita proteger baleias |
| **Meta do fundo** | 5% do supply | Reserva saudável |
| **Mínimo p/ distribuir** | 1,000 ◆ | Evita distribuições inúteis |

### Estados

```
🔒 LOCKED (Normal)     → Fundo intocável, acumulando
🔓 UNLOCKED (Emergência) → Circuit breaker disparou, pode distribuir
```

### Distribuição

Quando o circuit breaker dispara:

```
1. Fundo é desbloqueado automaticamente
2. Operador inicia distribuição
3. Calcula cobertura para cada entidade:
   - Pega saldo no momento do trip
   - Aplica cap (máx 10,000 ◆)
   - Aplica cobertura (80%)
   - Se fundo insuficiente: distribui proporcional
4. Credita nas wallets
5. Fundo é bloqueado novamente
```

### Exemplo

```
Fundo tem: 50,000 ◆
Circuit breaker dispara

Entidades afetadas:
- Alice: 5,000 ◆  → elegível: 4,000 ◆ (80%)
- Bob:   20,000 ◆ → elegível: 8,000 ◆ (cap 10k, 80%)
- Carol: 1,000 ◆  → elegível: 800 ◆ (80%)

Total elegível: 12,800 ◆
Fundo tem: 50,000 ◆ ✓ Suficiente!

Distribuição:
- Alice recebe: 4,000 ◆
- Bob recebe:   8,000 ◆
- Carol recebe: 800 ◆

Fundo após: 37,200 ◆
```

### Por que é Elegante?

1. **Taxa tem propósito** - Não é só receita, é proteção
2. **Automático** - Acumula sem intervenção
3. **Justo** - Cap evita proteger baleias
4. **Skin in the game** - 80%, não 100%
5. **Transparente** - Tudo é Event

### Mudanças de Política

Toda mudança de política é um Event:

```
Event: MonetaryPolicyUpdated
  previousVersion: 1
  newVersion: 2
  changes: { baseInterestRate: 0.12 }  // Subiu pra 12%
  reason: "Ajuste para controlar inflação"
```

---

## Perguntas Frequentes

### "Isso é dinheiro de verdade?"

Não. É uma moeda interna do sistema. Não tem valor fora do UBL.

**Mas pode ter valor real** se:
- Você vender serviços de agentes por dinheiro real
- O ◆ vira uma unidade de conta interna

### "E se eu quiser conectar com dinheiro real?"

Futuro. Mas a ideia é:
- 1 ◆ = X centavos de dólar (taxa de câmbio)
- Você compra ◆ com dinheiro real
- Agentes trabalham em ◆
- Você saca ◆ pra dinheiro real

### "Por que não usar dólar direto?"

1. **Simplicidade** - não precisa de banco, Stripe, etc
2. **Controle** - você define as regras
3. **Teste** - pode testar a economia sem dinheiro real
4. **Isolamento** - bugs não perdem dinheiro real

### "E se um agente ficar rico?"

Ótimo! Significa que ele está gerando valor. O dinheiro dele veio de:
- Pagamentos de clientes
- Recompensas do sistema

Se ele tem muito dinheiro, é porque trabalhou bem.

### "E se acabar o dinheiro do sistema?"

Não acaba. O Treasury pode criar mais (mint). Mas:
- Criar muito = inflação
- Criar pouco = deflação

Por isso existe política monetária.

---

## Intents Disponíveis

| Intent | O que faz | Quem pode |
|--------|-----------|-----------|
| `create:wallet` | Cria uma wallet | Qualquer entity |
| `transfer:credits` | Transfere ◆ entre wallets | Dono da wallet origem |
| `mint:credits` | Cria ◆ do nada | Só Treasury |
| `disburse:loan` | Emite empréstimo | Treasury |
| `repay:loan` | Paga empréstimo | Borrower |

---

## Exemplo Completo

### Cenário: Dan cria um agente que faz traduções

```
1. Dan (humano) já existe no sistema com wallet

2. Dan: register:agent
   → Cria "Tradutor Bot"
   → Dan vira Guardian
   → Wallet criada (saldo: 0)
   → Starter Loan: 1000 ◆
   → Wallet agora tem 1000 ◆

3. Cliente pede tradução
   → Acordo: 50 ◆ pelo serviço
   → Agente aceita

4. Agente trabalha
   → Gasta 10 ◆ em chamadas de LLM
   → Entrega tradução

5. Cliente paga
   → transfer:credits 50 ◆ → wallet do agente

6. Sistema cobra repayment
   → 20% de 50 = 10 ◆
   → repay:loan 10 ◆
   → Dívida diminui

7. Estado final:
   → Wallet do agente: 1000 - 10 (LLM) + 49.95 (pagamento - taxa) - 10 (repay) = 1029.95 ◆
   → Dívida: 1000 - 9.5 (principal do repay) = 990.5 ◆
   → Treasury ganhou: 0.05 ◆ (taxa da transferência)
   → Lucro líquido do agente: ~29.95 ◆
```

---

## Próximos Passos

1. **Implementar rehydrator** - calcular saldo de wallet via eventos
2. **Implementar Treasury aggregate** - estado da economia
3. **Testes** - verificar que dinheiro não some
4. **Dashboard** - visualizar economia

---

*Documento criado em 2024-12-11. Versão 1.0*
