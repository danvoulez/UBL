/**
 * AGENT ECONOMY SCHEMA
 *
 * "There is no 'Agent' entity type. There is no 'Human' entity type. There is only Entity."
 *
 * This module defines the schema for the Agent Economy where AI agents are
 * first-class economic participants with the same rights and duties as humans.
 *
 * Core Principles:
 * 1. Substrate Independence - Entity type doesn't matter (Human, Agent, Org)
 * 2. Guardian Chain - Every Entity has accountability through guardians
 * 3. Trajectory as Identity - An agent IS its history, not its substrate
 * 4. Economic Skin in the Game - Agents have wallets, debts, reputation
 * 5. Symmetrical Rights and Duties - Same rules for all entities
 */

import type { EntityId, Timestamp, ActorReference, Quantity } from '../shared/types';

// ============================================================================
// ENTITY - The Universal Participant
// ============================================================================

/**
 * Entity Type - substrate classification
 * Note: This is for operational purposes only. All entities have equal rights/duties.
 */
export type EntitySubstrate =
  | 'Person'        // Human being
  | 'Organization'  // Company, DAO, collective
  | 'Agent'         // AI/LLM-powered autonomous entity
  | 'System'        // System component
  | 'Hybrid';       // Human-AI hybrid

/**
 * Autonomy Level - graduated autonomy based on demonstrated capability
 */
export type AutonomyLevel =
  | 'Supervised'    // Every action requires guardian approval
  | 'Limited'       // Can act within budget/scope, guardian notified
  | 'Full'          // Independent actor, guardian only for liability
  | 'Emancipated';  // Fully independent (future: no guardian required)

/**
 * Constitution - the persistent identity and constraints of an entity
 * For agents: their personality, values, and operating constraints
 * For humans: their declared preferences and constraints
 */
export interface Constitution {
  /** Core values and principles */
  readonly values: readonly string[];

  /** Operating constraints */
  readonly constraints: {
    /** Maximum spend per transaction without approval */
    readonly maxSpendPerTransaction?: Quantity;
    /** Maximum daily spend */
    readonly maxDailySpend?: Quantity;
    /** Allowed actions */
    readonly allowedActions?: readonly string[];
    /** Forbidden actions */
    readonly forbiddenActions?: readonly string[];
    /** Require approval for these action types */
    readonly requireApprovalFor?: readonly string[];
  };

  /** Personality/style (for agents) */
  readonly style?: {
    /** Communication style */
    readonly tone?: 'professional' | 'casual' | 'friendly' | 'formal';
    /** Verbosity level */
    readonly verbosity?: 'terse' | 'normal' | 'verbose';
    /** Language preferences */
    readonly languages?: readonly string[];
    /** Custom instructions */
    readonly customInstructions?: string;
  };

  /** Version tracking for constitution updates */
  readonly version: number;
  readonly lastUpdated: Timestamp;
}

/**
 * Guardian Relationship - the chain of accountability
 */
export interface GuardianLink {
  /** The guardian entity */
  readonly guardianId: EntityId;

  /** When guardianship started */
  readonly effectiveFrom: Timestamp;

  /** When guardianship ends (undefined = indefinite) */
  readonly effectiveUntil?: Timestamp;

  /** The agreement that establishes this guardianship */
  readonly establishedBy: EntityId; // Agreement ID

  /** Guardian's liability limit (if any) */
  readonly liabilityLimit?: Quantity;

  /** Notification preferences */
  readonly notifyOn?: {
    readonly allActions?: boolean;
    readonly actionsAboveValue?: Quantity;
    readonly actionTypes?: readonly string[];
    readonly violations?: boolean;
  };
}

/**
 * Extended Entity with Agent Economy fields
 */
export interface EconomicEntity {
  readonly id: EntityId;
  readonly substrate: EntitySubstrate;
  readonly createdAt: Timestamp;

  /** Identity information */
  readonly identity: {
    readonly name: string;
    readonly did?: string; // Decentralized Identifier
    readonly publicKey?: string;
    readonly identifiers?: readonly {
      readonly scheme: string;
      readonly value: string;
      readonly verified: boolean;
    }[];
  };

  /** Guardian chain */
  readonly guardian?: GuardianLink;

  /** Autonomy level */
  readonly autonomyLevel: AutonomyLevel;

  /** Constitution (values, constraints, personality) */
  readonly constitution?: Constitution;

  /** Trajectory reference (for agents - this IS their identity) */
  readonly trajectoryId?: EntityId;
}

// ============================================================================
// TRAJECTORY - Agent Identity Through Action
// ============================================================================

/**
 * Trajectory Span - A single action in an agent's history
 *
 * "The agent is not a specific LLM instance. It is not a specific model.
 *  The agent is its trajectory."
 */
export interface TrajectorySpan {
  readonly id: EntityId;
  readonly entityId: EntityId;
  readonly sequence: bigint;
  readonly timestamp: Timestamp;

  /** What action was performed */
  readonly action: string;

  /** Execution details - HOW it was done */
  readonly execution: {
    /** LLM Provider used */
    readonly provider: LLMProvider;
    /** Specific model */
    readonly model: string;
    /** Token usage */
    readonly tokens: {
      readonly input: number;
      readonly output: number;
    };
    /** Cost of this action */
    readonly cost: Quantity;
    /** Execution time (ms) */
    readonly durationMs: number;
  };

  /** Input to the action */
  readonly input: Record<string, unknown>;

  /** Output from the action */
  readonly output: Record<string, unknown>;

  /** Related entities/agreements */
  readonly context: {
    readonly agreementId?: EntityId;
    readonly clientEntityId?: EntityId;
    readonly workspaceId?: EntityId;
  };

  /** Cryptographic signature for non-repudiation */
  readonly signature: string;

  /** Hash chain link */
  readonly previousHash: string;
  readonly hash: string;
}

/**
 * LLM Provider - execution substrate
 */
export type LLMProvider =
  | 'anthropic-claude'
  | 'openai-gpt'
  | 'google-gemini'
  | 'meta-llama'
  | 'mistral'
  | 'local'
  | string; // Extensible

// ============================================================================
// CONTINUITY - Consistent Personality Across Providers
// ============================================================================

/**
 * Provider Strategy - how an entity uses multiple LLM providers
 */
export interface ProviderStrategy {
  /** Primary provider */
  readonly primary: {
    readonly provider: LLMProvider;
    readonly model: string;
    readonly weight: number; // 0-100
  };

  /** Secondary/fallback providers */
  readonly secondary?: readonly {
    readonly provider: LLMProvider;
    readonly model: string;
    readonly weight: number;
  }[];

  /** Blending rules */
  readonly rules: {
    /** Never switch providers within same conversation */
    readonly sameConversation: 'never-switch' | 'allow-switch' | 'prefer-primary';
    /** Prefer consistency with same client */
    readonly sameClient: 'never-switch' | 'allow-switch' | 'prefer-primary';
    /** For new work, can use any provider */
    readonly newWork: 'primary-only' | 'prefer-primary' | 'any-available';
  };
}

/**
 * Memory Protocol - what context to inject
 */
export interface MemoryProtocol {
  /** Always include these in context */
  readonly alwaysInclude: readonly MemoryType[];

  /** Include these if relevant to current action */
  readonly contextualInclude: readonly MemoryType[];

  /** Maximum context window size */
  readonly maxContextTokens?: number;

  /** Prioritization strategy */
  readonly prioritization: 'recency' | 'relevance' | 'importance' | 'mixed';
}

export type MemoryType =
  | 'constitution'           // Entity's values and constraints
  | 'recent-trajectory'      // Recent actions (last N spans)
  | 'active-agreements'      // Current obligations
  | 'active-conversations'   // Ongoing chats
  | 'relevant-history'       // Past similar work
  | 'client-preferences';    // Known preferences of current client

// ============================================================================
// ECONOMICS - Credits, Wallets, Loans
// ============================================================================

/**
 * UBL Credit - internal currency
 * Symbol: ◆
 */
export const UBL_CREDIT = {
  symbol: '◆',
  code: 'UBL',
  decimals: 3,
} as const;

/**
 * Wallet - container for fungible value
 */
export interface Wallet {
  readonly id: EntityId;
  readonly ownerId: EntityId;
  readonly currency: string; // 'UBL', 'USD', 'ETH', etc.
  readonly balance: bigint; // In smallest unit (e.g., milli-credits)
  readonly createdAt: Timestamp;

  /** Programmable rules */
  readonly rules?: {
    readonly maxBalance?: bigint;
    readonly allowNegative?: boolean;
    readonly requireApprovalAbove?: bigint;
    readonly allowedRecipients?: readonly EntityId[];
  };
}

/**
 * Starter Loan - bootstrap capital for new agents
 */
export interface StarterLoan {
  readonly id: EntityId;
  readonly borrowerId: EntityId;
  readonly guardianId: EntityId; // Guarantor

  /** Loan terms */
  readonly principal: Quantity;
  readonly interestRate: number; // APR as decimal (0.10 = 10%)
  readonly repaymentRate: number; // Percent of earnings (0.20 = 20%)

  /** Status */
  readonly disbursedAt: Timestamp;
  readonly gracePeriodUntil: Timestamp;
  readonly paidAmount: Quantity;
  readonly status: 'Active' | 'Repaid' | 'Defaulted';

  /** Collateral */
  readonly collateral: {
    readonly type: 'Trajectory' | 'Asset' | 'Guarantee';
    readonly reference?: EntityId;
  };
}

/**
 * Transaction - movement of value
 */
export interface Transaction {
  readonly id: EntityId;
  readonly timestamp: Timestamp;
  readonly fromWalletId: EntityId;
  readonly toWalletId: EntityId;
  readonly amount: Quantity;
  readonly purpose: string;
  readonly agreementId?: EntityId; // What agreement caused this
  readonly status: 'Pending' | 'Completed' | 'Failed' | 'Reversed';
}

// ============================================================================
// PERCEPTION - Watchers for External Events
// ============================================================================

/**
 * Watcher - monitors external platform for events
 */
export interface Watcher {
  readonly id: EntityId;
  readonly ownerId: EntityId; // Entity that owns this watcher
  readonly createdAt: Timestamp;

  /** What to watch */
  readonly source: WatcherSource;

  /** How often to check */
  readonly pollInterval: string; // e.g., '5m', '1h', '1d'

  /** Filter for relevant events */
  readonly filter: {
    readonly keywords?: readonly string[];
    readonly pattern?: string; // Regex
    readonly conditions?: Record<string, unknown>;
  };

  /** What to do when event detected */
  readonly action: WatcherAction;

  /** Cost tracking */
  readonly tier: 'Basic' | 'Premium';
  readonly monthlyCost: Quantity;

  readonly status: 'Active' | 'Paused' | 'Stopped';
}

export type WatcherSource =
  | { readonly type: 'facebook'; readonly query: string }
  | { readonly type: 'twitter'; readonly query: string }
  | { readonly type: 'discord'; readonly channelId: string }
  | { readonly type: 'email'; readonly folder: string }
  | { readonly type: 'webhook'; readonly url: string }
  | { readonly type: 'rss'; readonly feedUrl: string }
  | { readonly type: 'blockchain'; readonly contract: string }
  | { readonly type: 'reddit'; readonly subreddit: string };

export type WatcherAction =
  | { readonly type: 'awaken'; readonly daemonId?: EntityId }
  | { readonly type: 'queue'; readonly workflowId: EntityId }
  | { readonly type: 'notify'; readonly channel: string };

// ============================================================================
// CONSCIOUSNESS - Daemons for Continuous Operation
// ============================================================================

/**
 * Daemon - persistent, proactive agent process
 */
export interface Daemon {
  readonly id: EntityId;
  readonly entityId: EntityId;
  readonly createdAt: Timestamp;

  /** Operation mode */
  readonly mode: 'Persistent' | 'Scheduled';

  /** Budget constraints */
  readonly budget: {
    readonly hourlyMax: Quantity;
    readonly dailyMax: Quantity;
    readonly onExhausted: 'sleep' | 'notify-guardian' | 'reduce-frequency';
  };

  /** Heartbeat */
  readonly heartbeat: {
    readonly interval: string; // e.g., '1m', '5m'
    readonly lastBeat?: Timestamp;
  };

  /** Scheduled loops */
  readonly loops: readonly DaemonLoop[];

  readonly status: 'Running' | 'Sleeping' | 'Stopped';
}

export interface DaemonLoop {
  readonly name: string;
  readonly interval: string; // e.g., '15m', '1h', '1d'
  readonly action: string;   // Intent or workflow to execute
  readonly lastRun?: Timestamp;
  readonly nextRun?: Timestamp;
}

// ============================================================================
// SHADOW GRAPH - Agent's Private Understanding
// ============================================================================

/**
 * Shadow Entity - agent's internal record of external entity
 *
 * "The Facebook user never knows UBL exists. But the agent has a queryable
 *  history of all interactions with them."
 */
export interface ShadowEntity {
  readonly id: EntityId;
  readonly agentId: EntityId; // Which agent created this
  readonly externalId: string; // External platform ID
  readonly platform: string;  // 'facebook', 'twitter', etc.

  /** Agent's understanding of this entity */
  readonly notes: string;
  readonly inferredAttributes: Record<string, unknown>;

  /** Interaction history */
  readonly firstSeen: Timestamp;
  readonly lastInteraction: Timestamp;
  readonly interactionCount: number;

  /** Relationship quality */
  readonly reputation?: number; // -100 to 100
  readonly trustLevel?: 'Low' | 'Medium' | 'High';
}

// ============================================================================
// EVENTS - New event types for Agent Economy
// ============================================================================

export interface EntityRegistered {
  readonly type: 'EntityRegistered';
  readonly substrate: EntitySubstrate;
  readonly identity: EconomicEntity['identity'];
  readonly guardian?: GuardianLink;
  readonly autonomyLevel: AutonomyLevel;
  readonly constitution?: Constitution;
}

export interface GuardianAssigned {
  readonly type: 'GuardianAssigned';
  readonly entityId: EntityId;
  readonly guardian: GuardianLink;
}

export interface ConstitutionUpdated {
  readonly type: 'ConstitutionUpdated';
  readonly entityId: EntityId;
  readonly previousVersion: number;
  readonly newConstitution: Constitution;
}

export interface TrajectorySpanRecorded {
  readonly type: 'TrajectorySpanRecorded';
  readonly span: TrajectorySpan;
}

export interface WalletCreated {
  readonly type: 'WalletCreated';
  readonly wallet: Omit<Wallet, 'balance'>;
  readonly initialBalance: bigint;
}

export interface TransactionExecuted {
  readonly type: 'TransactionExecuted';
  readonly transaction: Transaction;
}

export interface LoanDisbursed {
  readonly type: 'LoanDisbursed';
  readonly loan: StarterLoan;
}

export interface LoanRepayment {
  readonly type: 'LoanRepayment';
  readonly loanId: EntityId;
  readonly amount: Quantity;
  readonly remainingBalance: Quantity;
}

export interface WatcherCreated {
  readonly type: 'WatcherCreated';
  readonly watcher: Watcher;
}

export interface WatcherTriggered {
  readonly type: 'WatcherTriggered';
  readonly watcherId: EntityId;
  readonly event: Record<string, unknown>;
  readonly actionTaken: string;
}

export interface DaemonStarted {
  readonly type: 'DaemonStarted';
  readonly daemon: Daemon;
}

export interface DaemonHeartbeat {
  readonly type: 'DaemonHeartbeat';
  readonly daemonId: EntityId;
  readonly timestamp: Timestamp;
  readonly status: string;
}

export interface ShadowEntityCreated {
  readonly type: 'ShadowEntityCreated';
  readonly shadowEntity: ShadowEntity;
}
