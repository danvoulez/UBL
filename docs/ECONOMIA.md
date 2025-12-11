# Economia do UBL

> Como funciona o dinheiro dentro do Universal Business Ledger

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

## Taxa de Juros Flutuante

### Como Funciona

A taxa de juros **ajusta automaticamente** baseada na inflação:

```
Inflação alta → Sobe juros → Menos empréstimos → Menos dinheiro criado
Inflação baixa → Baixa juros → Mais empréstimos → Estimula economia
```

### Limites

| Limite | Valor | O que acontece |
|--------|-------|----------------|
| **Mínimo** | 1% | Nunca vai abaixo disso |
| **Máximo** | 15% | Teto dos juros |
| **Acima do teto** | - | **BURN** (último recurso) |

### Exemplo de Ajuste

```
Situação: Inflação em 8% (meta é 2%)

1. Sistema detecta: inflação 6% acima da meta
2. Calcula ajuste: +0.6% na taxa (10% do gap)
3. Taxa sobe: 5% → 5.6%
4. Novos empréstimos ficam mais caros
5. Menos gente pega empréstimo
6. Menos dinheiro é criado
7. Inflação tende a cair
```

### Quando Burn Acontece

```
Se taxa já está em 15% E inflação ainda está alta:

1. Juros não podem subir mais (teto)
2. Sistema ativa "burn mode"
3. Queima parte do Treasury (até 10% por período)
4. Remove dinheiro de circulação
5. Inflação cai
```

### Por que é Elegante?

1. **Automático** - Não precisa intervenção manual
2. **Gradual** - Ajustes pequenos, não choques
3. **Previsível** - Regras claras, sem surpresas
4. **Último recurso** - Burn só quando juros não bastam

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
