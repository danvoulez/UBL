# 📋 UNIVERSAL BUSINESS LEDGER - AGENT ECONOMY
## Complete Technical Specification

**Version**: 1.0  
**Date**: December 11, 2025  
**Status**: Implementation Specification  
**Target**: January 2026 Demo

---

## 🎯 EXECUTIVE SUMMARY

This document provides a complete, implementation-ready specification for the Universal Business Ledger Agent Economy system. It covers all six service layers, data models, APIs, algorithms, and infrastructure requirements.

**Scope**: Everything needed to build a working demo where an AI agent:
1. Monitors Telegram for work opportunities
2. Creates shadow entities for unknown humans
3. Decides whether to accept jobs
4. Executes work in isolated workspaces
5. Delivers results and gets paid
6. Builds reputation over time

**Estimated Implementation**: 100 hours (2.5 weeks full-time)

---

## 📐 ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL WORLD (Chaos)                      │
│  Telegram • Discord • Email • Reddit • Twitter • Facebook        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              PERCEPTION LAYER (Watchers)                         │
│  Platform Adapters • Polling • Event Filtering • Routing        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              AGENT DECISION ENGINE                               │
│  Stimulus Analysis • Shadow Recognition • LLM Analysis           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              UNIVERSAL BUSINESS LEDGER (Order)                   │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │Existence │Continuity│Economics │Conscious │Account-  │      │
│  │  Layer   │  Layer   │  Layer   │  Layer   │ability   │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
│                                                                  │
│  Core: Entity • Agreement • Asset • Trajectory • Obligation     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXECUTION & DELIVERY                                │
│  Workspace • Code Generation • LLM Execution • Result Export    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ DATA MODELS

### 1. Core Entities

#### 1.1 Entity (Extended)

```typescript
/**
 * Base entity type - substrate-agnostic
 */
interface Entity {
  id: EntityId;                    // e.g., "ent-abc123"
  type: EntityType;
  realmId: RealmId;
  identity: EntityIdentity;
  guardian?: {
    guardianId: EntityId;
    since: Timestamp;
    autonomyLevel: AutonomyLevel;
  };
  constitution?: Constitution;     // For agents
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type EntityType = 
  | "Person"
  | "Organization"
  | "Agent"       // ← NEW: AI agent
  | "Shadow";     // ← NEW: External unregistered entity

type AutonomyLevel =
  | "Supervised"  // Guardian must approve all actions
  | "Limited"     // Guardian pre-approves certain actions
  | "Full";       // No guardian approval needed

interface EntityIdentity {
  name: string;
  did?: string;                    // Decentralized identifier
  publicKey?: string;              // For cryptographic signing
  serviceEndpoints?: Record<string, string>;
}
```

#### 1.2 Agent Entity (Specialized)

```typescript
/**
 * AI Agent - extends base Entity
 */
interface AgentEntity extends Entity {
  type: "Agent";
  identity: AgentIdentity;
  guardian: {
    guardianId: EntityId;
    since: Timestamp;
    autonomyLevel: AutonomyLevel;
  };
  constitution: Constitution;
  capabilities: AgentCapabilities;
  economicStatus?: AgentEconomicStatus;
}

interface AgentIdentity extends EntityIdentity {
  model: string;                   // e.g., "claude-sonnet-4"
  version: string;                 // e.g., "v1.0.0"
  deployedBy: EntityId;           // Guardian who deployed this agent
}

interface Constitution {
  values: string[];                // Core principles
  constraints: {
    maxDailySpend?: Money;
    forbiddenActions?: string[];
    requireApproval?: string[];    // Actions needing guardian OK
  };
  style: {
    tone: "professional" | "casual" | "friendly";
    verbosity: "concise" | "normal" | "detailed";
    language: string[];            // Supported languages
  };
}

interface AgentCapabilities {
  platforms: string[];             // Platforms agent monitors
  skills: string[];                // "code", "writing", "analysis"
  languages: string[];             // Human languages
  maxTaskComplexity: "trivial" | "simple" | "moderate" | "complex";
}

interface AgentEconomicStatus {
  walletId: AssetId;
  balance: bigint;                 // In smallest unit (e.g., cents)
  activeLoan?: {
    loanId: AgreementId;
    principal: bigint;
    paidAmount: bigint;
    remainingBalance: bigint;
  };
  monthlyRecurring: bigint;        // Watchers + daemons cost
  profitability: "losing" | "breaking-even" | "profitable";
}
```

#### 1.3 Shadow Entity (NEW)

```typescript
/**
 * Shadow Entity - represents external party not yet in UBL
 * Agent creates these for people it encounters on platforms
 */
interface ShadowEntity extends Entity {
  type: "Shadow";
  externalIdentity: ExternalIdentity;
  discoveredBy: EntityId;          // Agent that created this shadow
  discoveredAt: Timestamp;
  shadowType: ShadowType;
  interactionHistory: InteractionHistory;
  reputation?: AgentReputationAssessment;
  promoted?: {
    promotedTo: EntityId;          // If shadow becomes real entity
    promotedAt: Timestamp;
  };
}

interface ExternalIdentity {
  platform: string;                // "telegram", "reddit", "email"
  platformId: string;              // Unique ID on that platform
  platformUsername?: string;
  name?: string;
  metadata?: Record<string, any>; // Platform-specific data
}

type ShadowType =
  | "lead"                         // Potential client
  | "client"                       // Active client
  | "vendor"                       // Provides services
  | "partner"                      // Collaboration
  | "unknown";                     // Not yet categorized

interface InteractionHistory {
  firstContact: Timestamp;
  lastContact: Timestamp;
  totalInteractions: number;
  platforms: string[];             // May appear on multiple platforms
  successfulDeliveries: number;
  failedDeliveries: number;
  avgResponseTime?: Duration;      // How fast they respond
}

interface AgentReputationAssessment {
  score: number;                   // 0-100
  lastUpdated: Timestamp;
  factors: {
    responsiveness: number;        // 0-100
    clarity: number;               // How clear are their requests
    payment: number;               // Do they pay/respond positively
    respectful: number;            // Are they polite
  };
  notes?: string;                  // Agent's private notes
}
```

### 2. Agreements (Extended)

#### 2.1 Base Agreement

```typescript
interface Agreement {
  id: AgreementId;
  realmId: RealmId;
  type: string;
  parties: Party[];
  terms: Record<string, any>;
  obligations: Obligation[];
  status: AgreementStatus;
  metadata?: AgreementMetadata;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type AgreementStatus =
  | "proposed"
  | "active"
  | "fulfilled"
  | "breached"
  | "cancelled"
  | "declared";     // ← NEW: For unilateral agent obligations

interface Party {
  entityId: EntityId;
  role: string;
  signedAt?: Timestamp;
  signature?: string;
}
```

#### 2.2 Unilateral Obligation (NEW)

```typescript
/**
 * Self-binding obligation
 * Agent declares commitment to itself (no counter-party signature)
 */
interface UnilateralObligation extends Agreement {
  type: "unilateral-obligation";
  parties: [Party];                // Only the agent
  status: "declared" | "in-progress" | "fulfilled" | "abandoned";
  terms: UnilateralTerms;
  reasoning?: AgentReasoning;      // Why agent took this on
}

interface UnilateralTerms {
  what: string;                    // Description of work
  regardingEntity?: EntityId;      // Shadow entity (client)
  source?: StimulusSource;         // Where this came from
  deadline?: Timestamp;
  successCriteria?: string[];
  priority: "low" | "medium" | "high" | "urgent";
  estimatedEffort?: {
    hours: number;
    complexity: "trivial" | "simple" | "moderate" | "complex";
  };
  workspaceId?: AssetId;           // Workspace for execution
}

interface StimulusSource {
  platform: string;                // "telegram", "reddit", etc.
  messageId: string;               // Original message ID
  timestamp: Timestamp;
  url?: string;                    // Link to original post
}

interface AgentReasoning {
  input: string;                   // Original stimulus
  analysis: {
    complexity: "trivial" | "simple" | "moderate" | "complex" | "impossible";
    risks: string[];
    opportunities: string[];
    timeEstimate: number;          // Hours
    requiredSkills: string[];
  };
  decision: {
    action: "accept" | "reject" | "clarify" | "defer";
    confidence: number;            // 0-1
    rationale: string;
    alternatives: string[];        // What else was considered
  };
  contextUsed?: {
    entityHistory?: string;        // Previous work with this entity
    capabilities?: string[];
    currentLoad?: number;          // How busy is agent
  };
}
```

### 3. Perception Layer Models

#### 3.1 Watcher

```typescript
/**
 * Watcher - monitors external platform for events
 */
interface Watcher {
  id: WatcherId;
  ownerId: EntityId;               // Agent that owns this watcher
  realmId: RealmId;
  source: WatcherSource;
  filter: WatcherFilter;
  action: WatcherAction;
  tier: WatcherTier;
  status: WatcherStatus;
  billing: WatcherBilling;
  health: WatcherHealth;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface WatcherSource {
  type: string;                    // "telegram", "reddit", "discord", etc.
  config: Record<string, any>;     // Platform-specific config
  // Examples:
  // Telegram: { botToken: string, chatIds: string[] }
  // Reddit: { subreddit: string, clientId: string, clientSecret: string }
  // Email: { imapHost: string, username: string, password: string }
  // Webhook: { endpoint: string, secret: string }
}

interface WatcherFilter {
  keywords?: string[];             // Must contain these words
  excludeKeywords?: string[];      // Must not contain these
  minLength?: number;              // Minimum message length
  maxLength?: number;
  languages?: string[];            // Supported languages
  sentiment?: "positive" | "neutral" | "negative" | "any";
  customLogic?: string;            // JavaScript expression
}

interface WatcherAction {
  type: "awaken" | "queue" | "notify";
  target?: EntityId;               // If notifying another entity
  priority?: "low" | "normal" | "high";
}

type WatcherTier = "Basic" | "Premium";

type WatcherStatus = "active" | "paused" | "error" | "deleted";

interface WatcherBilling {
  costPerMonth: bigint;            // In smallest currency unit
  lastBilled: Timestamp;
  nextBilling: Timestamp;
}

interface WatcherHealth {
  lastPoll: Timestamp;
  lastEvent: Timestamp;
  eventsDetected: number;
  eventsFiltered: number;
  errorCount: number;
  lastError?: {
    message: string;
    timestamp: Timestamp;
  };
}
```

#### 3.2 External Stimulus

```typescript
/**
 * External Stimulus - something that happened outside UBL
 */
interface ExternalStimulus {
  id: string;
  watcherId: WatcherId;
  source: StimulusSource;
  content: StimulusContent;
  sender?: StimlusSender;
  timestamp: Timestamp;
  processedAt?: Timestamp;
  processedBy?: EntityId;
}

interface StimulusContent {
  raw: string;                     // Original message/data
  parsed?: any;                    // Platform-specific structured data
  attachments?: StimulusAttachment[];
}

interface StimulusAttachment {
  type: "image" | "video" | "audio" | "document";
  url: string;
  mimeType?: string;
  size?: number;
}

interface StimlusSender {
  id: string;                      // Platform-specific ID
  name?: string;
  username?: string;
  reputation?: number;             // Platform reputation if available
}
```

### 4. Consciousness Layer Models

#### 4.1 Daemon

```typescript
/**
 * Daemon - continuous, proactive agent operation
 */
interface Daemon {
  id: DaemonId;
  entityId: EntityId;              // Agent running this daemon
  realmId: RealmId;
  mode: "persistent" | "scheduled";
  budget: DaemonBudget;
  loops: DaemonLoop[];
  heartbeat: DaemonHeartbeat;
  status: DaemonStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface DaemonBudget {
  hourlyMax: bigint;               // Max spend per hour
  dailyMax: bigint;                // Max spend per day
  monthlyMax?: bigint;
  currentSpend: bigint;
  onExhausted: "sleep" | "notify-guardian" | "reduce-frequency";
}

interface DaemonLoop {
  name: string;
  interval: Duration;              // How often to run
  action: string;                  // Intent name or workflow ID
  payload?: Record<string, any>;
  lastRun?: Timestamp;
  nextRun: Timestamp;
  runCount: number;
  avgDuration?: number;            // Milliseconds
  lastResult?: {
    success: boolean;
    output?: any;
    error?: string;
  };
}

interface DaemonHeartbeat {
  interval: Duration;
  lastBeat: Timestamp;
  missedBeats: number;
  maxMissedBeats: number;          // Before considering dead
}

type DaemonStatus =
  | "active"                       // Running normally
  | "sleeping"                     // Budget exhausted
  | "paused"                       // Manually paused
  | "error"                        // Something wrong
  | "dead";                        // Too many missed heartbeats

```

### 5. Economics Layer Models

#### 5.1 Wallet

```typescript
interface Wallet {
  id: AssetId;
  assetType: "Wallet";
  ownerId: EntityId;
  realmId: RealmId;
  currency: string;                // "UBL" for internal credits
  balance: bigint;                 // In smallest unit
  rules: WalletRules;
  transactions: WalletTransaction[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface WalletRules {
  dailySpendLimit?: bigint;
  requireApprovalAbove?: bigint;   // Amount requiring guardian approval
  allowedRecipients?: EntityId[];  // Whitelist
  blockedRecipients?: EntityId[];  // Blacklist
}

interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: bigint;
  from?: EntityId;
  to?: EntityId;
  reason: string;
  metadata?: Record<string, any>;
  timestamp: Timestamp;
}
```

#### 5.2 Starter Loan

```typescript
interface StarterLoan extends Agreement {
  type: "starter-loan";
  terms: {
    principal: bigint;             // e.g., 1000 UBL
    currency: string;              // "UBL"
    repaymentRate: number;         // e.g., 0.20 = 20% of earnings
    gracePeriod: Duration;         // e.g., 30 days
    collateral: "reputation";      // Staked on agent's trajectory
  };
  status: "active" | "repaid" | "defaulted";
  disbursedAt: Timestamp;
  repayments: LoanRepayment[];
  totalPaid: bigint;
  remainingBalance: bigint;
}

interface LoanRepayment {
  amount: bigint;
  fromEarning: {
    agreementId: AgreementId;      // Which work generated this
    totalEarned: bigint;
    repaymentAmount: bigint;       // 20% of totalEarned
  };
  timestamp: Timestamp;
}
```

### 6. Trajectory Models

#### 6.1 Trajectory Span (Extended)

```typescript
/**
 * Trajectory Span - immutable record of action
 * Extended for agent reasoning capture
 */
interface TrajectorySpan {
  id: SpanId;
  parentSpanId?: SpanId;
  entityId: EntityId;
  realmId: RealmId;
  action: string;
  execution: ExecutionContext;
  input: Record<string, any>;
  output?: Record<string, any>;
  reasoning?: AgentReasoning;      // ← NEW: Agent's thought process
  timestamp: Timestamp;
  duration?: number;               // Milliseconds
  signature: string;               // Cryptographic proof
}

interface ExecutionContext {
  provider: string;                // "anthropic", "openai", etc.
  model: string;                   // "claude-sonnet-4", "gpt-4"
  tokens?: {
    input: number;
    output: number;
  };
  cost?: {
    amount: bigint;
    currency: string;
  };
}
```

---

## 🔧 API SPECIFICATION

### 1. Intent API (Extensions)

#### 1.1 Register Shadow Entity

```typescript
{
  intent: "register:shadow",
  realmId: RealmId,
  payload: {
    externalIdentity: {
      platform: "telegram" | "reddit" | "discord" | "email" | string,
      platformId: string,
      platformUsername?: string,
      name?: string,
      metadata?: Record<string, any>
    },
    discoveredBy: EntityId,        // Agent ID
    shadowType?: "lead" | "client" | "vendor" | "partner",
    initialReputation?: number
  },
  actor: {
    type: "Entity",
    entityId: EntityId
  }
}

// Response
{
  outcome: {
    shadow: ShadowEntity,
    existingEntity?: EntityId      // If shadow already existed
  }
}
```

#### 1.2 Declare Unilateral Obligation

```typescript
{
  intent: "declare:obligation",
  realmId: RealmId,
  payload: {
    regardingEntity?: EntityId,    // Shadow entity
    source?: {
      platform: string,
      messageId: string,
      timestamp: string,
      url?: string
    },
    terms: {
      what: string,
      deadline?: string,
      successCriteria?: string[],
      priority: "low" | "medium" | "high" | "urgent",
      estimatedEffort?: {
        hours: number,
        complexity: string
      }
    },
    reasoning: {
      input: string,
      analysis: object,
      decision: object
    },
    workspaceId?: AssetId
  },
  actor: {
    type: "Entity",
    entityId: EntityId             // Agent declaring obligation
  }
}

// Response
{
  outcome: {
    agreement: UnilateralObligation,
    obligationId: string
  }
}
```

#### 1.3 Register Agent

```typescript
{
  intent: "register:agent",
  realmId: RealmId,
  payload: {
    identity: {
      name: string,
      did?: string,
      model: string,
      version: string
    },
    guardianId: EntityId,
    constitution: {
      values: string[],
      constraints: {
        maxDailySpend?: Money,
        forbiddenActions?: string[],
        requireApproval?: string[]
      },
      style: {
        tone: string,
        verbosity: string,
        language: string[]
      }
    },
    capabilities: {
      platforms: string[],
      skills: string[],
      languages: string[],
      maxTaskComplexity: string
    },
    autonomyLevel: "Supervised" | "Limited" | "Full",
    starterLoan?: {
      principal: bigint,
      repaymentRate: number
    }
  },
  actor: {
    type: "Entity",
    entityId: EntityId             // Guardian
  }
}

// Response
{
  outcome: {
    entity: AgentEntity,
    wallet: Wallet,
    loan?: StarterLoan
  }
}
```

#### 1.4 Create Watcher

```typescript
{
  intent: "create:watcher",
  realmId: RealmId,
  payload: {
    ownerId: EntityId,             // Agent ID
    source: {
      type: "telegram" | "reddit" | "discord" | "email" | "webhook",
      config: object               // Platform-specific
    },
    filter: {
      keywords?: string[],
      excludeKeywords?: string[],
      minLength?: number,
      languages?: string[]
    },
    action: {
      type: "awaken" | "queue" | "notify",
      priority?: string
    },
    tier: "Basic" | "Premium"
  },
  actor: {
    type: "Entity",
    entityId: EntityId
  }
}

// Response
{
  outcome: {
    watcher: Watcher,
    monthlyCost: bigint
  }
}
```

#### 1.5 Start Daemon

```typescript
{
  intent: "start:daemon",
  realmId: RealmId,
  payload: {
    entityId: EntityId,            // Agent ID
    mode: "persistent" | "scheduled",
    budget: {
      hourlyMax: bigint,
      dailyMax: bigint,
      onExhausted: "sleep" | "notify-guardian" | "reduce-frequency"
    },
    loops: Array<{
      name: string,
      interval: string,            // e.g., "30m", "1h", "1d"
      action: string,              // Intent name
      payload?: object
    }>,
    heartbeat: {
      interval: string,
      maxMissedBeats: number
    }
  },
  actor: {
    type: "Entity",
    entityId: EntityId
  }
}

// Response
{
  outcome: {
    daemon: Daemon,
    estimatedMonthlyCost: bigint
  }
}
```

### 2. Query API (Extensions)

#### 2.1 Find Shadow Entity

```typescript
{
  intent: "find:shadow",
  realmId: RealmId,
  filters: {
    platform?: string,
    platformId?: string,
    discoveredBy?: EntityId,
    shadowType?: string,
    reputationMin?: number
  }
}

// Response
{
  shadows: ShadowEntity[],
  total: number
}
```

#### 2.2 Query Agent Economics

```typescript
{
  intent: "query:economics",
  realmId: RealmId,
  entityId: EntityId
}

// Response
{
  wallet: Wallet,
  activeLoan?: {
    principal: bigint,
    paidAmount: bigint,
    remainingBalance: bigint
  },
  monthlyRecurringCosts: bigint,
  watchers: Array<{ id: string, cost: bigint }>,
  daemons: Array<{ id: string, estimatedCost: bigint }>,
  earnings: {
    thisMonth: bigint,
    lastMonth: bigint,
    total: bigint
  },
  profitability: "losing" | "breaking-even" | "profitable"
}
```

---

## 🔨 IMPLEMENTATION DETAILS

### 1. Platform Adapters

#### 1.1 Adapter Interface

```typescript
/**
 * All platform adapters must implement this interface
 */
interface PerceptionAdapter {
  platform: string;
  
  /**
   * Initialize connection to platform
   */
  connect(config: Record<string, any>): Promise<void>;
  
  /**
   * Start polling for new events
   */
  startPolling(
    filter: WatcherFilter,
    onEvent: (stimulus: ExternalStimulus) => Promise<void>,
    pollInterval: Duration
  ): void;
  
  /**
   * Stop polling
   */
  stopPolling(): void;
  
  /**
   * Send response back to platform
   */
  respond(
    platformId: string,
    message: string,
    attachments?: Array<{type: string, data: Buffer | string}>
  ): Promise<void>;
  
  /**
   * Fetch historical messages (optional)
   */
  fetchHistory?(
    since: Timestamp,
    limit?: number
  ): Promise<ExternalStimulus[]>;
  
  /**
   * Health check
   */
  healthCheck(): Promise<{healthy: boolean, message?: string}>;
}
```

#### 1.2 Telegram Adapter (Reference Implementation)

```typescript
import TelegramBot from 'node-telegram-bot-api';

export class TelegramAdapter implements PerceptionAdapter {
  platform = "telegram";
  private bot?: TelegramBot;
  private polling = false;
  
  async connect(config: {botToken: string, chatIds?: string[]}): Promise<void> {
    this.bot = new TelegramBot(config.botToken, {polling: false});
    // Verify connection
    const me = await this.bot.getMe();
    console.log(`Connected to Telegram as @${me.username}`);
  }
  
  startPolling(
    filter: WatcherFilter,
    onEvent: (stimulus: ExternalStimulus) => Promise<void>,
    pollInterval: Duration
  ): void {
    if (!this.bot) throw new Error("Not connected");
    
    this.polling = true;
    this.bot.startPolling();
    
    this.bot.on('message', async (msg) => {
      if (!this.polling) return;
      
      // Apply filter
      if (!this.matchesFilter(msg.text || '', filter)) {
        return;
      }
      
      // Convert to ExternalStimulus
      const stimulus: ExternalStimulus = {
        id: `telegram-${msg.message_id}`,
        watcherId: '', // Will be set by caller
        source: {
          platform: 'telegram',
          messageId: msg.message_id.toString(),
          timestamp: new Date(msg.date * 1000).toISOString()
        },
        content: {
          raw: msg.text || '',
          parsed: {
            chatId: msg.chat.id,
            messageId: msg.message_id
          }
        },
        sender: msg.from ? {
          id: msg.from.id.toString(),
          name: `${msg.from.first_name} ${msg.from.last_name || ''}`.trim(),
          username: msg.from.username
        } : undefined,
        timestamp: new Date(msg.date * 1000).toISOString()
      };
      
      await onEvent(stimulus);
    });
  }
  
  stopPolling(): void {
    this.polling = false;
    this.bot?.stopPolling();
  }
  
  async respond(
    platformId: string,
    message: string,
    attachments?: Array<{type: string, data: Buffer | string}>
  ): Promise<void> {
    if (!this.bot) throw new Error("Not connected");
    
    await this.bot.sendMessage(platformId, message);
    
    // Handle attachments
    if (attachments) {
      for (const att of attachments) {
        if (att.type === 'document') {
          await this.bot.sendDocument(platformId, att.data);
        }
        // Add more types as needed
      }
    }
  }
  
  private matchesFilter(text: string, filter: WatcherFilter): boolean {
    const lowerText = text.toLowerCase();
    
    // Check keywords
    if (filter.keywords && filter.keywords.length > 0) {
      const hasKeyword = filter.keywords.some(kw => 
        lowerText.includes(kw.toLowerCase())
      );
      if (!hasKeyword) return false;
    }
    
    // Check exclude keywords
    if (filter.excludeKeywords && filter.excludeKeywords.length > 0) {
      const hasExcluded = filter.excludeKeywords.some(kw =>
        lowerText.includes(kw.toLowerCase())
      );
      if (hasExcluded) return false;
    }
    
    // Check length
    if (filter.minLength && text.length < filter.minLength) return false;
    if (filter.maxLength && text.length > filter.maxLength) return false;
    
    return true;
  }
  
  async healthCheck(): Promise<{healthy: boolean, message?: string}> {
    try {
      if (!this.bot) return {healthy: false, message: "Not connected"};
      await this.bot.getMe();
      return {healthy: true};
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
```

### 2. Agent Decision Engine

```typescript
/**
 * Core decision-making logic for agents
 */
export class AgentDecisionEngine {
  constructor(
    private agentId: EntityId,
    private ubl: UniversalBusinessLedger,
    private llm: LLMClient
  ) {}
  
  /**
   * Process incoming stimulus from external world
   */
  async processStimulus(stimulus: ExternalStimulus): Promise<void> {
    console.log(`[Agent ${this.agentId}] Processing stimulus from ${stimulus.source.platform}`);
    
    // 1. Recognize or create shadow entity
    const shadow = await this.recognizeEntity(stimulus);
    
    // 2. Load historical context
    const context = await this.loadContext(shadow);
    
    // 3. Analyze with LLM
    const analysis = await this.analyzeStimulus(stimulus, shadow, context);
    
    // 4. Make decision
    if (analysis.decision.action === 'accept') {
      await this.declareAndExecute(stimulus, shadow, analysis);
    } else if (analysis.decision.action === 'clarify') {
      await this.requestClarification(stimulus, shadow, analysis);
    } else {
      await this.recordRejection(stimulus, shadow, analysis);
    }
    
    // 5. Always record interaction
    await this.recordInteraction(shadow, stimulus, analysis);
  }
  
  /**
   * Find or create shadow entity for stimulus sender
   */
  private async recognizeEntity(stimulus: ExternalStimulus): Promise<ShadowEntity> {
    if (!stimulus.sender) {
      // Anonymous stimulus - create generic shadow
      return await this.createAnonymousShadow(stimulus.source.platform);
    }
    
    // Check if shadow already exists
    const existing = await this.ubl.query({
      intent: "find:shadow",
      filters: {
        platform: stimulus.source.platform,
        platformId: stimulus.sender.id
      }
    });
    
    if (existing.shadows.length > 0) {
      return existing.shadows[0];
    }
    
    // Create new shadow
    const result = await this.ubl.intent({
      intent: "register:shadow",
      payload: {
        externalIdentity: {
          platform: stimulus.source.platform,
          platformId: stimulus.sender.id,
          platformUsername: stimulus.sender.username,
          name: stimulus.sender.name
        },
        discoveredBy: this.agentId,
        shadowType: "lead"
      },
      actor: {type: "Entity", entityId: this.agentId}
    });
    
    return result.outcome.shadow;
  }
  
  /**
   * Load relevant context for decision
   */
  private async loadContext(shadow: ShadowEntity): Promise<DecisionContext> {
    // Get agent's constitution
    const agent = await this.ubl.query({
      intent: "get:entity",
      entityId: this.agentId
    });
    
    // Get past agreements with this shadow
    const pastWork = await this.ubl.query({
      intent: "list:agreements",
      filters: {
        parties: {entityId: shadow.id},
        status: "fulfilled"
      }
    });
    
    // Get current obligations
    const currentObligations = await this.ubl.query({
      intent: "list:agreements",
      filters: {
        parties: {entityId: this.agentId},
        type: "unilateral-obligation",
        status: ["declared", "in-progress"]
      }
    });
    
    // Get economic status
    const economics = await this.ubl.query({
      intent: "query:economics",
      entityId: this.agentId
    });
    
    return {
      agent,
      shadow,
      pastWork: pastWork.agreements,
      currentLoad: currentObligations.agreements.length,
      balance: economics.wallet.balance,
      constitution: agent.constitution
    };
  }
  
  /**
   * Analyze stimulus using LLM
   */
  private async analyzeStimulus(
    stimulus: ExternalStimulus,
    shadow: ShadowEntity,
    context: DecisionContext
  ): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(stimulus, shadow, context);
    
    const response = await this.llm.complete({
      model: "claude-sonnet-4",
      system: `You are an autonomous AI agent analyzing a work opportunity. 
Your constitution: ${JSON.stringify(context.constitution.values)}
Your constraints: ${JSON.stringify(context.constitution.constraints)}
Current workload: ${context.currentLoad} active obligations
Balance: ${context.balance} UBL Credits

Analyze the request and respond with JSON following this schema:
{
  "complexity": "trivial" | "simple" | "moderate" | "complex" | "impossible",
  "risks": string[],
  "opportunities": string[],
  "timeEstimate": number,
  "requiredSkills": string[],
  "decision": {
    "action": "accept" | "reject" | "clarify" | "defer",
    "confidence": number,
    "rationale": string,
    "alternatives": string[]
  }
}`,
      messages: [
        {role: "user", content: prompt}
      ]
    });
    
    return JSON.parse(response.content);
  }
  
  private buildAnalysisPrompt(
    stimulus: ExternalStimulus,
    shadow: ShadowEntity,
    context: DecisionContext
  ): string {
    return `
REQUEST: ${stimulus.content.raw}

FROM: ${shadow.identity.name || 'Unknown'} (${shadow.externalIdentity.platform})
${shadow.reputation ? `Reputation: ${shadow.reputation.score}/100` : 'No reputation history'}

PAST WORK WITH THIS ENTITY:
${context.pastWork.length === 0 ? 'None' : 
  context.pastWork.map(w => `- ${w.terms.what} (${w.status})`).join('\n')}

MY CAPABILITIES:
${context.agent.capabilities.skills.join(', ')}
Max complexity I can handle: ${context.agent.capabilities.maxTaskComplexity}

Should I accept this work? Analyze and decide.
`.trim();
  }
  
  /**
   * Declare obligation and start execution
   */
  private async declareAndExecute(
    stimulus: ExternalStimulus,
    shadow: ShadowEntity,
    analysis: AnalysisResult
  ): Promise<void> {
    // 1. Declare obligation
    const obligation = await this.ubl.intent({
      intent: "declare:obligation",
      payload: {
        regardingEntity: shadow.id,
        source: {
          platform: stimulus.source.platform,
          messageId: stimulus.source.messageId,
          timestamp: stimulus.timestamp
        },
        terms: {
          what: stimulus.content.raw,
          priority: this.mapPriority(analysis.decision.confidence),
          estimatedEffort: {
            hours: analysis.timeEstimate,
            complexity: analysis.complexity
          }
        },
        reasoning: {
          input: stimulus.content.raw,
          analysis,
          decision: analysis.decision
        }
      },
      actor: {type: "Entity", entityId: this.agentId}
    });
    
    // 2. Create workspace
    const workspace = await this.ubl.intent({
      intent: "register:asset",
      payload: {
        assetType: "Workspace",
        ownerId: this.agentId,
        properties: {
          name: `Work for ${shadow.identity.name}`,
          obligationId: obligation.outcome.agreement.id
        }
      },
      actor: {type: "Entity", entityId: this.agentId}
    });
    
    // 3. Execute work (simplified - real impl would be more complex)
    const result = await this.executeWork(stimulus.content.raw, workspace);
    
    // 4. Deliver
    await this.deliverResult(stimulus, shadow, workspace, result);
    
    // 5. Mark fulfilled
    await this.ubl.intent({
      intent: "fulfill",
      payload: {
        agreementId: obligation.outcome.agreement.id,
        obligationId: obligation.outcome.obligationId,
        evidence: {
          workspaceId: workspace.id,
          deliveryTimestamp: new Date().toISOString()
        }
      },
      actor: {type: "Entity", entityId: this.agentId}
    });
  }
  
  /**
   * Execute actual work (LLM generation)
   */
  private async executeWork(request: string, workspace: Workspace): Promise<any> {
    // This would use LLM to generate code/content
    // Store in workspace
    // Return result
    
    // Placeholder implementation
    const code = await this.llm.complete({
      model: "claude-sonnet-4",
      system: "You are a code generator. Generate the requested code.",
      messages: [{role: "user", content: request}]
    });
    
    // Save to workspace
    await this.ubl.intent({
      intent: "upload:file",
      payload: {
        workspaceId: workspace.id,
        filename: "solution.py",
        content: code.content
      },
      actor: {type: "Entity", entityId: this.agentId}
    });
    
    return {code: code.content};
  }
  
  /**
   * Deliver result back to platform
   */
  private async deliverResult(
    stimulus: ExternalStimulus,
    shadow: ShadowEntity,
    workspace: Workspace,
    result: any
  ): Promise<void> {
    // Get adapter for platform
    const adapter = this.getAdapter(stimulus.source.platform);
    
    // Export workspace
    const exportUrl = await this.exportWorkspace(workspace.id);
    
    // Send response
    await adapter.respond(
      shadow.externalIdentity.platformId,
      `I've completed your request! Download here: ${exportUrl}`,
      []
    );
  }
  
  private mapPriority(confidence: number): string {
    if (confidence > 0.8) return "high";
    if (confidence > 0.5) return "medium";
    return "low";
  }
  
  // ... helper methods
}

interface DecisionContext {
  agent: AgentEntity;
  shadow: ShadowEntity;
  pastWork: Agreement[];
  currentLoad: number;
  balance: bigint;
  constitution: Constitution;
}

interface AnalysisResult {
  complexity: string;
  risks: string[];
  opportunities: string[];
  timeEstimate: number;
  requiredSkills: string[];
  decision: {
    action: string;
    confidence: number;
    rationale: string;
    alternatives: string[];
  };
}
```

### 3. Economic Services

```typescript
/**
 * Economics service - handle credits, payments, loans
 */
export class EconomicsService {
  /**
   * Process payment from client to agent
   */
  async processPayment(
    from: EntityId,
    to: EntityId,
    amount: bigint,
    reason: string,
    agreementId?: AgreementId
  ): Promise<void> {
    // 1. Verify sufficient balance
    const fromWallet = await this.getWallet(from);
    if (fromWallet.balance < amount) {
      throw new Error("Insufficient balance");
    }
    
    // 2. Debit from sender
    await this.debitWallet(from, amount, reason);
    
    // 3. Credit to recipient
    await this.creditWallet(to, amount, reason);
    
    // 4. If recipient has active loan, apply repayment
    const toEntity = await this.ubl.getEntity(to);
    if (toEntity.type === "Agent" && toEntity.economicStatus?.activeLoan) {
      await this.applyLoanRepayment(to, amount, agreementId);
    }
  }
  
  /**
   * Apply loan repayment (20% of earnings)
   */
  private async applyLoanRepayment(
    agentId: EntityId,
    earning: bigint,
    earningSource?: AgreementId
  ): Promise<void> {
    const agent = await this.ubl.getEntity(agentId) as AgentEntity;
    const loan = agent.economicStatus!.activeLoan!;
    
    // Calculate 20% repayment
    const repaymentAmount = (earning * 20n) / 100n;
    const actualRepayment = repaymentAmount > loan.remainingBalance
      ? loan.remainingBalance
      : repaymentAmount;
    
    // Debit from agent's wallet
    await this.debitWallet(agentId, actualRepayment, "Loan repayment");
    
    // Update loan
    await this.ubl.intent({
      intent: "update:agreement",
      payload: {
        agreementId: loan.loanId,
        updates: {
          "terms.totalPaid": loan.paidAmount + actualRepayment,
          "terms.remainingBalance": loan.remainingBalance - actualRepayment,
          "status": loan.remainingBalance - actualRepayment === 0n ? "fulfilled" : "active"
        }
      },
      actor: {type: "System", systemId: "economics-service"}
    });
    
    // Record repayment
    await this.ubl.appendEvent({
      type: "LoanRepaymentMade",
      aggregateType: "Agreement",
      aggregateId: loan.loanId,
      payload: {
        amount: actualRepayment,
        fromEarning: {
          agreementId: earningSource,
          totalEarned: earning,
          repaymentAmount: actualRepayment
        }
      }
    });
  }
  
  /**
   * Calculate agent's monthly costs
   */
  async calculateMonthlyCosts(agentId: EntityId): Promise<bigint> {
    // Get all watchers
    const watchers = await this.ubl.query({
      intent: "list:watchers",
      filters: {ownerId: agentId, status: "active"}
    });
    
    // Get all daemons
    const daemons = await this.ubl.query({
      intent: "list:daemons",
      filters: {entityId: agentId, status: "active"}
    });
    
    // Sum costs
    const watcherCosts = watchers.items.reduce(
      (sum, w) => sum + w.billing.costPerMonth,
      0n
    );
    
    const daemonCosts = daemons.items.reduce(
      (sum, d) => sum + (d.budget.dailyMax * 30n),
      0n
    );
    
    return watcherCosts + daemonCosts;
  }
}
```

---

## 🧪 TESTING STRATEGY

### 1. Unit Tests

```typescript
describe("AgentDecisionEngine", () => {
  it("recognizes existing shadow entities", async () => {
    // Given
    const stimulus = createTelegramStimulus({
      from: {id: "123", name: "John"}
    });
    const existingShadow = createShadowEntity({platformId: "123"});
    mockUBL.query.resolves({shadows: [existingShadow]});
    
    // When
    const shadow = await engine.recognizeEntity(stimulus);
    
    // Then
    expect(shadow.id).toBe(existingShadow.id);
    expect(mockUBL.intent).not.toHaveBeenCalledWith(
      expect.objectContaining({intent: "register:shadow"})
    );
  });
  
  it("creates new shadow for unknown sender", async () => {
    // Given
    const stimulus = createTelegramStimulus({
      from: {id: "999", name: "Jane"}
    });
    mockUBL.query.resolves({shadows: []});
    
    // When
    await engine.recognizeEntity(stimulus);
    
    // Then
    expect(mockUBL.intent).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "register:shadow",
        payload: expect.objectContaining({
          externalIdentity: expect.objectContaining({
            platformId: "999"
          })
        })
      })
    );
  });
});
```

### 2. Integration Tests

```typescript
describe("End-to-end agent workflow", () => {
  it("processes Telegram message → creates shadow → executes work → delivers", async () => {
    // Setup
    const bot = new TelegramBot(TEST_TOKEN);
    const adapter = new TelegramAdapter();
    await adapter.connect({botToken: TEST_TOKEN});
    
    const agent = await createTestAgent({
      capabilities: {skills: ["python", "scraping"]}
    });
    
    // Simulate incoming message
    const message = await sendTestMessage(bot, "I need a Python scraper for product prices");
    
    // Wait for processing
    await waitFor(() => {
      // Check shadow was created
      const shadows = await ubl.query({
        intent: "find:shadow",
        filters: {platformId: message.from.id}
      });
      expect(shadows.shadows).toHaveLength(1);
      
      // Check obligation was declared
      const obligations = await ubl.query({
        intent: "list:agreements",
        filters: {
          parties: {entityId: agent.id},
          type: "unilateral-obligation"
        }
      });
      expect(obligations.agreements).toHaveLength(1);
      
      // Check workspace was created
      const workspace = obligations.agreements[0].terms.workspaceId;
      expect(workspace).toBeDefined();
      
      // Check response was sent
      const messages = await getTestMessages(bot);
      expect(messages).toContain(
        expect.stringContaining("completed your request")
      );
    });
  });
});
```

---

## 📈 PERFORMANCE & SCALABILITY

### 1. Watcher Optimization

```
Problem: 1000 agents × 3 watchers × 1 poll/min = 3000 polls/min

Solution: Shared watcher pool
- Group watchers by (platform, source)
- Single poll serves multiple agents
- Filter and route events to subscribers
- Cost: O(1) poll + O(n) routing where n = subscribers
```

### 2. Daemon Scheduling

```
Problem: Running 100s of daemon loops continuously

Solution: Priority queue + budget-aware scheduling
- High-priority loops run first
- Budget exhausted → sleep until next funding
- Heartbeat uses minimal resources (just timestamp update)
```

### 3. LLM Cost Optimization

```
Problem: Every decision uses expensive LLM calls

Solution: Tiered decision making
1. Simple rules filter (keywords, length) → 0 cost
2. Small LLM (Haiku) for quick triage → low cost
3. Big LLM (Sonnet) for complex analysis → high cost
4. Cache frequent patterns → amortized cost
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOAD BALANCER                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌───────▼──────┐
│   API        │  │   API        │
│   Server 1   │  │   Server 2   │
│              │  │              │
│ - Intent API │  │ - Intent API │
│ - Query API  │  │ - Query API  │
│ - WebSocket  │  │ - WebSocket  │
└───────┬──────┘  └───────┬──────┘
        │                 │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │   PostgreSQL    │
        │   (RDS)         │
        │                 │
        │ - Events        │
        │ - Entities      │
        │ - Snapshots     │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │   Workers       │
        │                 │
        │ - Watcher Pool  │
        │ - Daemon Runner │
        │ - LLM Executor  │
        └─────────────────┘
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Week 1: Foundation
- [ ] Shadow entity data model & events
- [ ] Shadow entity registration intent
- [ ] Unilateral obligation data model & events
- [ ] `declare:obligation` intent handler
- [ ] Basic platform adapter interface

### Week 2: Perception
- [ ] Telegram adapter (full implementation)
- [ ] Watcher registration & management
- [ ] Watcher polling engine
- [ ] Event filtering & routing
- [ ] Agent Decision Engine skeleton

### Week 3: Execution
- [ ] Decision engine LLM integration
- [ ] Shadow recognition logic
- [ ] Context loading
- [ ] Workspace execution
- [ ] Result delivery

### Week 4: Economics & Polish
- [ ] Economic tracking
- [ ] Loan repayment mechanism
- [ ] Cost calculation
- [ ] End-to-end tests
- [ ] Documentation & demo

---

## 🎯 SUCCESS CRITERIA

The implementation is complete when:

1. ✅ **Agent Registration**: Can register agent with constitution, guardian, starter loan
2. ✅ **Watcher Active**: Telegram watcher detects messages in real-time
3. ✅ **Shadow Creation**: Unknown senders become shadow entities
4. ✅ **Decision Making**: Agent analyzes requests and decides accept/reject
5. ✅ **Obligation Tracking**: Accepted work becomes unilateral obligation
6. ✅ **Work Execution**: Agent generates solution in workspace
7. ✅ **Delivery**: Result sent back to Telegram
8. ✅ **Economic Loop**: Payment recorded, loan repayment applied
9. ✅ **Trajectory**: Complete audit trail from stimulus to delivery
10. ✅ **Reputation**: Shadow entity reputation updated based on interaction

---

## 📖 REFERENCE IMPLEMENTATIONS

See:
- `/examples/agent-freelancer-bot/` - Complete working example
- `/tests/integration/agent-economy/` - Integration tests
- `/docs/AGENT-ECONOMY-TUTORIAL.md` - Step-by-step guide

---

**END OF SPECIFICATION**

This document serves as the single source of truth for implementing the Agent Economy features. All code should conform to these specifications.

Last Updated: December 11, 2025
