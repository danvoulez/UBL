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

// ============================================================================
// EXTENDED SHADOW ENTITY (Full-spec.md additions)
// ============================================================================

/**
 * External Identity - detailed external platform identity
 */
export interface ExternalIdentity {
  /** Platform where entity was discovered */
  readonly platform: string; // "telegram", "reddit", "email", etc.
  /** Unique ID on that platform */
  readonly platformId: string;
  /** Username on the platform (if available) */
  readonly platformUsername?: string;
  /** Display name */
  readonly name?: string;
  /** Platform-specific metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Shadow Type - categorization of the shadow entity
 */
export type ShadowType =
  | 'lead'      // Potential client
  | 'client'    // Active client
  | 'vendor'    // Provides services
  | 'partner'   // Collaboration
  | 'unknown';  // Not yet categorized

/**
 * Interaction History - tracking of all interactions with shadow
 */
export interface InteractionHistory {
  /** First contact timestamp */
  readonly firstContact: Timestamp;
  /** Last contact timestamp */
  readonly lastContact: Timestamp;
  /** Total number of interactions */
  readonly totalInteractions: number;
  /** Platforms where this entity has been seen */
  readonly platforms: readonly string[];
  /** Number of successful deliveries to this entity */
  readonly successfulDeliveries: number;
  /** Number of failed deliveries */
  readonly failedDeliveries: number;
  /** Average response time (ms) */
  readonly avgResponseTime?: number;
}

/**
 * Agent Reputation Assessment - agent's private assessment of shadow
 */
export interface AgentReputationAssessment {
  /** Overall score 0-100 */
  readonly score: number;
  /** When was this assessment last updated */
  readonly lastUpdated: Timestamp;
  /** Factor breakdown */
  readonly factors: {
    /** How quickly do they respond (0-100) */
    readonly responsiveness: number;
    /** How clear are their requests (0-100) */
    readonly clarity: number;
    /** Do they pay/respond positively (0-100) */
    readonly payment: number;
    /** Are they polite and respectful (0-100) */
    readonly respectful: number;
  };
  /** Agent's private notes */
  readonly notes?: string;
}

/**
 * Extended Shadow Entity - full spec version
 */
export interface ExtendedShadowEntity {
  readonly id: EntityId;
  readonly type: 'Shadow';
  readonly realmId: EntityId;
  /** Which agent discovered/created this shadow */
  readonly discoveredBy: EntityId;
  /** When was this shadow created */
  readonly discoveredAt: Timestamp;
  /** External identity on the platform */
  readonly externalIdentity: ExternalIdentity;
  /** Shadow type categorization */
  readonly shadowType: ShadowType;
  /** Full interaction history */
  readonly interactionHistory: InteractionHistory;
  /** Agent's reputation assessment */
  readonly reputation?: AgentReputationAssessment;
  /** If promoted to real entity */
  readonly promoted?: {
    readonly promotedTo: EntityId;
    readonly promotedAt: Timestamp;
  };
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

// ============================================================================
// UNILATERAL OBLIGATION (Full-spec.md)
// ============================================================================

/**
 * Stimulus Source - where an external stimulus came from
 */
export interface StimulusSource {
  /** Platform where the stimulus originated */
  readonly platform: string;
  /** Original message ID on that platform */
  readonly messageId: string;
  /** When the stimulus was received */
  readonly timestamp: Timestamp;
  /** URL link to original post (if available) */
  readonly url?: string;
}

/**
 * Agent Reasoning - captures the agent's decision-making process
 */
export interface AgentReasoning {
  /** Original stimulus/input */
  readonly input: string;
  /** Analysis of the request */
  readonly analysis: {
    /** How complex is this task */
    readonly complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'impossible';
    /** Identified risks */
    readonly risks: readonly string[];
    /** Identified opportunities */
    readonly opportunities: readonly string[];
    /** Estimated time in hours */
    readonly timeEstimate: number;
    /** Required skills to complete */
    readonly requiredSkills: readonly string[];
  };
  /** The decision made */
  readonly decision: {
    /** What action to take */
    readonly action: 'accept' | 'reject' | 'clarify' | 'defer';
    /** Confidence in decision (0-1) */
    readonly confidence: number;
    /** Why this decision was made */
    readonly rationale: string;
    /** What alternatives were considered */
    readonly alternatives: readonly string[];
  };
  /** Context that was used in decision */
  readonly contextUsed?: {
    /** Previous work with this entity */
    readonly entityHistory?: string;
    /** Agent's capabilities considered */
    readonly capabilities?: readonly string[];
    /** How busy is the agent currently */
    readonly currentLoad?: number;
  };
}

/**
 * Unilateral Terms - terms of a self-binding obligation
 */
export interface UnilateralTerms {
  /** Description of what needs to be done */
  readonly what: string;
  /** Shadow entity this is regarding (client) */
  readonly regardingEntity?: EntityId;
  /** Source of the stimulus */
  readonly source?: StimulusSource;
  /** Deadline for completion */
  readonly deadline?: Timestamp;
  /** Criteria for success */
  readonly successCriteria?: readonly string[];
  /** Priority level */
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  /** Estimated effort */
  readonly estimatedEffort?: {
    readonly hours: number;
    readonly complexity: 'trivial' | 'simple' | 'moderate' | 'complex';
  };
  /** Workspace for execution */
  readonly workspaceId?: EntityId;
}

/**
 * Unilateral Obligation - self-binding commitment by agent
 * Agent declares commitment to itself (no counter-party signature needed)
 */
export interface UnilateralObligation {
  readonly id: EntityId;
  readonly realmId: EntityId;
  readonly type: 'unilateral-obligation';
  /** Only the agent is a party */
  readonly parties: readonly [{
    readonly entityId: EntityId;
    readonly role: 'Obligor';
    readonly declaredAt: Timestamp;
  }];
  /** Status of the obligation */
  readonly status: 'declared' | 'in-progress' | 'fulfilled' | 'abandoned';
  /** Terms of the obligation */
  readonly terms: UnilateralTerms;
  /** Agent's reasoning for taking this on */
  readonly reasoning?: AgentReasoning;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

// ============================================================================
// EXTERNAL STIMULUS (Full-spec.md)
// ============================================================================

/**
 * Stimulus Attachment - file or media attached to a stimulus
 */
export interface StimulusAttachment {
  readonly type: 'image' | 'video' | 'audio' | 'document';
  readonly url: string;
  readonly mimeType?: string;
  readonly size?: number;
}

/**
 * Stimulus Content - the actual content of an external stimulus
 */
export interface StimulusContent {
  /** Raw message content */
  readonly raw: string;
  /** Platform-specific parsed data */
  readonly parsed?: Record<string, unknown>;
  /** Any attachments */
  readonly attachments?: readonly StimulusAttachment[];
}

/**
 * Stimulus Sender - who sent the stimulus
 */
export interface StimulusSender {
  /** Platform-specific ID */
  readonly id: string;
  /** Display name */
  readonly name?: string;
  /** Username */
  readonly username?: string;
  /** Platform reputation if available */
  readonly reputation?: number;
}

/**
 * External Stimulus - something that happened outside UBL
 */
export interface ExternalStimulus {
  readonly id: string;
  /** Which watcher detected this */
  readonly watcherId: EntityId;
  /** Source of the stimulus */
  readonly source: StimulusSource;
  /** Content of the stimulus */
  readonly content: StimulusContent;
  /** Who sent it */
  readonly sender?: StimulusSender;
  /** When it occurred */
  readonly timestamp: Timestamp;
  /** When it was processed */
  readonly processedAt?: Timestamp;
  /** Which entity processed it */
  readonly processedBy?: EntityId;
}

// ============================================================================
// EXTENDED WATCHER (Full-spec.md additions)
// ============================================================================

/**
 * Watcher Billing - cost tracking for watchers
 */
export interface WatcherBilling {
  /** Monthly cost */
  readonly costPerMonth: Quantity;
  /** When last billed */
  readonly lastBilled: Timestamp;
  /** When next billing occurs */
  readonly nextBilling: Timestamp;
}

/**
 * Watcher Health - health monitoring for watchers
 */
export interface WatcherHealth {
  /** When last poll occurred */
  readonly lastPoll: Timestamp;
  /** When last event was detected */
  readonly lastEvent?: Timestamp;
  /** Total events detected */
  readonly eventsDetected: number;
  /** Events that were filtered out */
  readonly eventsFiltered: number;
  /** Number of errors encountered */
  readonly errorCount: number;
  /** Last error details */
  readonly lastError?: {
    readonly message: string;
    readonly timestamp: Timestamp;
  };
}

/**
 * Extended Watcher Filter - more filtering options
 */
export interface ExtendedWatcherFilter {
  /** Must contain these words */
  readonly keywords?: readonly string[];
  /** Must not contain these words */
  readonly excludeKeywords?: readonly string[];
  /** Minimum message length */
  readonly minLength?: number;
  /** Maximum message length */
  readonly maxLength?: number;
  /** Supported languages */
  readonly languages?: readonly string[];
  /** Sentiment filter */
  readonly sentiment?: 'positive' | 'neutral' | 'negative' | 'any';
  /** Custom JavaScript expression for filtering */
  readonly customLogic?: string;
}

/**
 * Extended Watcher - full spec version with billing and health
 */
export interface ExtendedWatcher {
  readonly id: EntityId;
  readonly ownerId: EntityId;
  readonly realmId: EntityId;
  readonly source: WatcherSource;
  readonly filter: ExtendedWatcherFilter;
  readonly action: WatcherAction;
  readonly tier: 'Basic' | 'Premium';
  readonly status: 'active' | 'paused' | 'error' | 'deleted';
  readonly billing: WatcherBilling;
  readonly health: WatcherHealth;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/**
 * Telegram Watcher Source - specific config for Telegram
 */
export interface TelegramWatcherSource {
  readonly type: 'telegram';
  readonly config: {
    readonly botToken: string;
    readonly chatIds?: readonly string[];
  };
}

// ============================================================================
// EXTENDED DAEMON (Full-spec.md additions)
// ============================================================================

/**
 * Extended Daemon Loop - with run tracking
 */
export interface ExtendedDaemonLoop {
  readonly name: string;
  readonly interval: string; // Duration e.g. "30m", "1h", "1d"
  readonly action: string; // Intent name or workflow ID
  readonly payload?: Record<string, unknown>;
  readonly lastRun?: Timestamp;
  readonly nextRun: Timestamp;
  readonly runCount: number;
  readonly avgDuration?: number; // Milliseconds
  readonly lastResult?: {
    readonly success: boolean;
    readonly output?: unknown;
    readonly error?: string;
  };
}

/**
 * Extended Daemon Heartbeat
 */
export interface ExtendedDaemonHeartbeat {
  readonly interval: string; // Duration
  readonly lastBeat: Timestamp;
  readonly missedBeats: number;
  readonly maxMissedBeats: number;
}

/**
 * Extended Daemon Status
 */
export type ExtendedDaemonStatus =
  | 'active'    // Running normally
  | 'sleeping'  // Budget exhausted
  | 'paused'    // Manually paused
  | 'error'     // Something wrong
  | 'dead';     // Too many missed heartbeats

// ============================================================================
// AGENT CAPABILITIES (Full-spec.md)
// ============================================================================

/**
 * Agent Capabilities - what the agent can do
 */
export interface AgentCapabilities {
  /** Platforms the agent monitors */
  readonly platforms: readonly string[];
  /** Skills like "code", "writing", "analysis" */
  readonly skills: readonly string[];
  /** Human languages supported */
  readonly languages: readonly string[];
  /** Maximum task complexity this agent can handle */
  readonly maxTaskComplexity: 'trivial' | 'simple' | 'moderate' | 'complex';
}

// ============================================================================
// ADDITIONAL EVENTS
// ============================================================================

export interface ShadowEntityUpdated {
  readonly type: 'ShadowEntityUpdated';
  readonly shadowId: EntityId;
  readonly updates: Partial<ExtendedShadowEntity>;
}

export interface ShadowInteractionRecorded {
  readonly type: 'ShadowInteractionRecorded';
  readonly shadowId: EntityId;
  readonly interaction: {
    readonly type: 'message' | 'delivery' | 'payment' | 'feedback';
    readonly timestamp: Timestamp;
    readonly success: boolean;
    readonly details?: Record<string, unknown>;
  };
}

export interface UnilateralObligationDeclared {
  readonly type: 'UnilateralObligationDeclared';
  readonly obligation: UnilateralObligation;
}

export interface ObligationStatusChanged {
  readonly type: 'ObligationStatusChanged';
  readonly obligationId: EntityId;
  readonly previousStatus: UnilateralObligation['status'];
  readonly newStatus: UnilateralObligation['status'];
  readonly reason?: string;
}

export interface ExternalStimulusReceived {
  readonly type: 'ExternalStimulusReceived';
  readonly stimulus: ExternalStimulus;
}

export interface ExternalStimulusProcessed {
  readonly type: 'ExternalStimulusProcessed';
  readonly stimulusId: string;
  readonly processedBy: EntityId;
  readonly result: 'accepted' | 'rejected' | 'clarification-needed' | 'deferred';
  readonly reasoning?: AgentReasoning;
}
