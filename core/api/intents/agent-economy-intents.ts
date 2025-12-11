/**
 * AGENT ECONOMY INTENTS
 *
 * Intent handlers for the Agent Economy where AI agents are first-class economic participants.
 *
 * Key Intents:
 * - register:agent - Register a new AI agent with starter loan
 * - register:entity - Register any entity (human, org, agent)
 * - assign:guardian - Assign a guardian to an entity
 * - update:constitution - Update entity's values/constraints
 * - create:wallet - Create a wallet for an entity
 * - transfer:credits - Transfer credits between wallets
 * - disburse:loan - Issue a starter loan
 * - repay:loan - Make loan repayment
 * - create:watcher - Set up an external event watcher
 * - start:daemon - Start a continuous daemon process
 * - record:trajectory - Record an action in agent's trajectory
 */

import type { IntentDefinition, Intent, IntentResult, HandlerContext } from '../intent-api';
import { Ids } from '../../shared/types';
import type { EntityId } from '../../shared/types';
import type {
  EntitySubstrate,
  AutonomyLevel,
  Constitution,
  GuardianLink,
  StarterLoan,
  Wallet,
  Watcher,
  Daemon,
  TrajectorySpan,
  UBL_CREDIT,
  // New Full-spec.md types
  ExtendedShadowEntity,
  ExternalIdentity,
  ShadowType,
  InteractionHistory,
  AgentReputationAssessment,
  UnilateralObligation,
  UnilateralTerms,
  StimulusSource,
  AgentReasoning,
  ExternalStimulus,
  AgentCapabilities,
} from '../../schema/agent-economy';

// ============================================================================
// AGENT & ENTITY REGISTRATION
// ============================================================================

export const AGENT_ECONOMY_INTENTS: readonly IntentDefinition[] = [
  // -------------------------------------------------------------------------
  // Register Agent - Special case with starter loan
  // -------------------------------------------------------------------------
  {
    name: 'register:agent',
    description: 'Register a new AI agent with guardian, constitution, starter loan, and wallet',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['identity', 'guardianId'],
      properties: {
        identity: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            did: { type: 'string' },
            publicKey: { type: 'string' },
          },
        },
        guardianId: {
          type: 'string',
          description: 'Entity ID of the guardian (legally responsible entity)',
        },
        constitution: {
          type: 'object',
          description: 'Agent\'s values, constraints, and personality',
          properties: {
            values: { type: 'array', items: { type: 'string' } },
            constraints: { type: 'object' },
            style: { type: 'object' },
          },
        },
        autonomyLevel: {
          type: 'string',
          enum: ['Supervised', 'Limited', 'Full'],
          default: 'Limited',
        },
        starterLoan: {
          type: 'object',
          description: 'Starter loan configuration',
          properties: {
            principal: {
              type: 'object',
              properties: {
                amount: { type: 'number', default: 1000 },
                unit: { type: 'string', default: 'UBL' },
              },
            },
            interestRate: { type: 'number', default: 0.10 },
            repaymentRate: { type: 'number', default: 0.20 },
            gracePeriodDays: { type: 'number', default: 30 },
          },
        },
      },
    },
    requiredPermissions: ['Agent:register'],
    examples: [
      {
        identity: { name: 'Freelancer Bot 003' },
        guardianId: 'ent-guardian-001',
        constitution: {
          values: ['Deliver quality work', 'Be transparent', 'Honor commitments'],
          constraints: {
            maxDailySpend: { amount: 50, unit: 'UBL' },
            requireApprovalFor: ['high-value-contract'],
          },
          style: {
            tone: 'professional',
            verbosity: 'normal',
          },
        },
      },
    ],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as any;

      // Generate IDs
      const agentId = Ids.entity();
      const walletId = Ids.entity();
      const loanId = Ids.entity();
      const guardianshipAgreementId = Ids.agreement();
      const loanAgreementId = Ids.agreement();

      const eventStore = context.eventStore as any;
      const events: any[] = [];

      // 1. Register the agent entity
      const constitutionWithDefaults: Constitution = {
        values: payload.constitution?.values || ['Act with integrity', 'Deliver value', 'Be accountable'],
        constraints: payload.constitution?.constraints || {},
        style: payload.constitution?.style,
        version: 1,
        lastUpdated: Date.now(),
      };

      const guardian: GuardianLink = {
        guardianId: payload.guardianId,
        effectiveFrom: Date.now(),
        establishedBy: guardianshipAgreementId,
        notifyOn: {
          violations: true,
          actionsAboveValue: { amount: 100, unit: 'UBL' },
        },
      };

      events.push(
        await eventStore.append({
          type: 'EntityRegistered',
          aggregateType: 'Entity',
          aggregateId: agentId,
          aggregateVersion: 1,
          actor: intent.actor,
          timestamp: Date.now(),
          payload: {
            substrate: 'Agent' as EntitySubstrate,
            identity: payload.identity,
            guardian,
            autonomyLevel: (payload.autonomyLevel || 'Limited') as AutonomyLevel,
            constitution: constitutionWithDefaults,
          },
        })
      );

      // 2. Create guardianship agreement
      events.push(
        await eventStore.append({
          type: 'AgreementProposed',
          aggregateType: 'Agreement',
          aggregateId: guardianshipAgreementId,
          aggregateVersion: 1,
          actor: intent.actor,
          timestamp: Date.now(),
          payload: {
            agreementType: 'Guardianship',
            parties: [
              { entityId: payload.guardianId, role: 'Guardian' },
              { entityId: agentId, role: 'Ward' },
            ],
            terms: {
              description: `Guardianship of Agent ${payload.identity.name}`,
              liability: 'Guardian assumes liability for agent actions',
            },
          },
        })
      );

      // 3. Create wallet
      events.push(
        await eventStore.append({
          type: 'WalletCreated',
          aggregateType: 'Asset',
          aggregateId: walletId,
          aggregateVersion: 1,
          actor: intent.actor,
          timestamp: Date.now(),
          payload: {
            wallet: {
              id: walletId,
              ownerId: agentId,
              currency: 'UBL',
              createdAt: Date.now(),
              rules: {
                allowNegative: false,
              },
            },
            initialBalance: 0n,
          },
        })
      );

      // 4. Create loan agreement
      const loanConfig = payload.starterLoan || {};
      const principal = {
        amount: loanConfig.principal?.amount || 1000,
        unit: loanConfig.principal?.unit || 'UBL',
      };

      events.push(
        await eventStore.append({
          type: 'AgreementProposed',
          aggregateType: 'Agreement',
          aggregateId: loanAgreementId,
          aggregateVersion: 1,
          actor: intent.actor,
          timestamp: Date.now(),
          payload: {
            agreementType: 'StarterLoan',
            parties: [
              { entityId: 'ent-system-ubl', role: 'Lender' },
              { entityId: agentId, role: 'Borrower' },
              { entityId: payload.guardianId, role: 'Guarantor' },
            ],
            terms: {
              principal,
              interestRate: loanConfig.interestRate || 0.10,
              repaymentRate: loanConfig.repaymentRate || 0.20,
              gracePeriodDays: loanConfig.gracePeriodDays || 30,
            },
          },
        })
      );

      // 5. Disburse loan
      const gracePeriodMs = (loanConfig.gracePeriodDays || 30) * 24 * 60 * 60 * 1000;

      events.push(
        await eventStore.append({
          type: 'LoanDisbursed',
          aggregateType: 'Asset',
          aggregateId: loanId,
          aggregateVersion: 1,
          actor: intent.actor,
          timestamp: Date.now(),
          payload: {
            loan: {
              id: loanId,
              borrowerId: agentId,
              guardianId: payload.guardianId,
              principal,
              interestRate: loanConfig.interestRate || 0.10,
              repaymentRate: loanConfig.repaymentRate || 0.20,
              disbursedAt: Date.now(),
              gracePeriodUntil: Date.now() + gracePeriodMs,
              paidAmount: { amount: 0, unit: 'UBL' },
              status: 'Active',
              collateral: {
                type: 'Trajectory',
                reference: agentId,
              },
            } as StarterLoan,
          },
        })
      );

      // 6. Transfer loan funds to wallet
      events.push(
        await eventStore.append({
          type: 'TransactionExecuted',
          aggregateType: 'Asset',
          aggregateId: Ids.entity(),
          aggregateVersion: 1,
          actor: intent.actor,
          timestamp: Date.now(),
          payload: {
            transaction: {
              id: Ids.entity(),
              timestamp: Date.now(),
              fromWalletId: 'wallet-system-treasury',
              toWalletId: walletId,
              amount: principal,
              purpose: 'Starter loan disbursement',
              agreementId: loanAgreementId,
              status: 'Completed',
            },
          },
        })
      );

      return {
        success: true,
        outcome: {
          type: 'Created',
          entity: {
            id: agentId,
            type: 'Agent',
            identity: payload.identity,
            walletId,
            loanId,
            starterBalance: principal,
          },
          id: agentId,
        },
        events,
        affordances: [
          { intent: 'create:watcher', description: 'Set up external event monitoring', required: ['source'] },
          { intent: 'start:daemon', description: 'Start continuous operation', required: ['loops'] },
          { intent: 'record:trajectory', description: 'Record first action', required: ['action'] },
        ],
        meta: { processedAt: Date.now(), processingTime: Date.now() - startTime },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Register Generic Entity
  // -------------------------------------------------------------------------
  {
    name: 'register:entity',
    description: 'Register a new entity (human, organization, or system)',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['substrate', 'identity'],
      properties: {
        substrate: {
          type: 'string',
          enum: ['Person', 'Organization', 'System', 'Hybrid'],
        },
        identity: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            did: { type: 'string' },
            identifiers: { type: 'array' },
          },
        },
        guardianId: { type: 'string' },
        autonomyLevel: {
          type: 'string',
          enum: ['Supervised', 'Limited', 'Full', 'Emancipated'],
          default: 'Full',
        },
      },
    },
    requiredPermissions: ['Entity:create'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as any;
      const entityId = Ids.entity();
      const eventStore = context.eventStore as any;

      const event = await eventStore.append({
        type: 'EntityRegistered',
        aggregateType: 'Entity',
        aggregateId: entityId,
        aggregateVersion: 1,
        actor: intent.actor,
        timestamp: Date.now(),
        payload: {
          substrate: payload.substrate,
          identity: payload.identity,
          autonomyLevel: payload.autonomyLevel || 'Full',
          guardian: payload.guardianId
            ? {
                guardianId: payload.guardianId,
                effectiveFrom: Date.now(),
                establishedBy: Ids.agreement(),
              }
            : undefined,
        },
      });

      return {
        success: true,
        outcome: {
          type: 'Created',
          entity: {
            id: entityId,
            type: payload.substrate,
            identity: payload.identity,
          },
          id: entityId,
        },
        events: [event],
        affordances: [
          { intent: 'create:wallet', description: 'Create a wallet for this entity', required: ['currency'] },
          { intent: 'propose', description: 'Create agreements involving this entity', required: ['agreementType'] },
        ],
        meta: { processedAt: Date.now(), processingTime: Date.now() - startTime },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Wallet Operations
  // -------------------------------------------------------------------------
  {
    name: 'create:wallet',
    description: 'Create a wallet for an entity',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['ownerId', 'currency'],
      properties: {
        ownerId: { type: 'string', description: 'Entity ID of the wallet owner' },
        currency: { type: 'string', default: 'UBL' },
        initialBalance: { type: 'number', default: 0 },
        rules: {
          type: 'object',
          properties: {
            maxBalance: { type: 'number' },
            allowNegative: { type: 'boolean', default: false },
            requireApprovalAbove: { type: 'number' },
          },
        },
      },
    },
    requiredPermissions: ['Wallet:create'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const payload = intent.payload as any;
      const walletId = Ids.entity();
      const eventStore = context.eventStore as any;

      const event = await eventStore.append({
        type: 'WalletCreated',
        aggregateType: 'Asset',
        aggregateId: walletId,
        aggregateVersion: 1,
        actor: intent.actor,
        timestamp: Date.now(),
        payload: {
          wallet: {
            id: walletId,
            ownerId: payload.ownerId,
            currency: payload.currency,
            createdAt: Date.now(),
            rules: payload.rules,
          },
          initialBalance: BigInt(Math.floor((payload.initialBalance || 0) * 1000)),
        },
      });

      return {
        success: true,
        outcome: { type: 'Created', id: walletId },
        events: [event],
        affordances: [{ intent: 'transfer:credits', description: 'Transfer credits', required: ['toWalletId', 'amount'] }],
        meta: { processedAt: Date.now(), processingTime: 0 },
      };
    },
  },

  {
    name: 'transfer:credits',
    description: 'Transfer credits between wallets',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['fromWalletId', 'toWalletId', 'amount'],
      properties: {
        fromWalletId: { type: 'string' },
        toWalletId: { type: 'string' },
        amount: {
          type: 'object',
          required: ['amount', 'unit'],
          properties: {
            amount: { type: 'number' },
            unit: { type: 'string' },
          },
        },
        purpose: { type: 'string' },
        agreementId: { type: 'string' },
      },
    },
    requiredPermissions: ['Transaction:execute'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const payload = intent.payload as any;
      const transactionId = Ids.entity();
      const eventStore = context.eventStore as any;

      const event = await eventStore.append({
        type: 'TransactionExecuted',
        aggregateType: 'Asset',
        aggregateId: transactionId,
        aggregateVersion: 1,
        actor: intent.actor,
        timestamp: Date.now(),
        payload: {
          transaction: {
            id: transactionId,
            timestamp: Date.now(),
            fromWalletId: payload.fromWalletId,
            toWalletId: payload.toWalletId,
            amount: payload.amount,
            purpose: payload.purpose || 'Transfer',
            agreementId: payload.agreementId,
            status: 'Completed',
          },
        },
      });

      return {
        success: true,
        outcome: { type: 'Transferred', id: transactionId },
        events: [event],
        affordances: [],
        meta: { processedAt: Date.now(), processingTime: 0 },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Trajectory Recording
  // -------------------------------------------------------------------------
  {
    name: 'record:trajectory',
    description: 'Record an action in an agent\'s trajectory (the agent\'s identity)',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['entityId', 'action', 'execution'],
      properties: {
        entityId: { type: 'string', description: 'Agent entity ID' },
        action: { type: 'string', description: 'Action performed' },
        execution: {
          type: 'object',
          required: ['provider', 'model', 'tokens', 'cost'],
          properties: {
            provider: { type: 'string' },
            model: { type: 'string' },
            tokens: {
              type: 'object',
              properties: {
                input: { type: 'number' },
                output: { type: 'number' },
              },
            },
            cost: {
              type: 'object',
              properties: {
                amount: { type: 'number' },
                unit: { type: 'string' },
              },
            },
            durationMs: { type: 'number' },
          },
        },
        input: { type: 'object' },
        output: { type: 'object' },
        context: { type: 'object' },
      },
    },
    requiredPermissions: ['Trajectory:record'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const payload = intent.payload as any;
      const spanId = Ids.entity();
      const eventStore = context.eventStore as any;

      // TODO: Implement hash chain calculation
      const previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
      const hash = 'hash-placeholder';

      const event = await eventStore.append({
        type: 'TrajectorySpanRecorded',
        aggregateType: 'Entity',
        aggregateId: payload.entityId,
        aggregateVersion: 1, // TODO: Get actual version
        actor: intent.actor,
        timestamp: Date.now(),
        payload: {
          span: {
            id: spanId,
            entityId: payload.entityId,
            sequence: 1n, // TODO: Get actual sequence
            timestamp: Date.now(),
            action: payload.action,
            execution: payload.execution,
            input: payload.input || {},
            output: payload.output || {},
            context: payload.context || {},
            signature: 'sig-placeholder', // TODO: Implement signing
            previousHash,
            hash,
          } as TrajectorySpan,
        },
      });

      return {
        success: true,
        outcome: { type: 'Recorded', spanId },
        events: [event],
        affordances: [],
        meta: { processedAt: Date.now(), processingTime: 0 },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Watcher Management
  // -------------------------------------------------------------------------
  {
    name: 'create:watcher',
    description: 'Create an external event watcher',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['ownerId', 'source', 'action'],
      properties: {
        ownerId: { type: 'string' },
        source: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: ['facebook', 'twitter', 'discord', 'email', 'webhook', 'rss', 'blockchain', 'reddit'] },
            query: { type: 'string' },
            channelId: { type: 'string' },
            folder: { type: 'string' },
            url: { type: 'string' },
            contract: { type: 'string' },
            subreddit: { type: 'string' },
          },
        },
        pollInterval: { type: 'string', default: '5m' },
        filter: { type: 'object' },
        action: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: ['awaken', 'queue', 'notify'] },
          },
        },
        tier: { type: 'string', enum: ['Basic', 'Premium'], default: 'Basic' },
      },
    },
    requiredPermissions: ['Watcher:create'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const payload = intent.payload as any;
      const watcherId = Ids.entity();
      const eventStore = context.eventStore as any;

      const monthlyCost = payload.tier === 'Premium' ? { amount: 25, unit: 'UBL' } : { amount: 10, unit: 'UBL' };

      const event = await eventStore.append({
        type: 'WatcherCreated',
        aggregateType: 'Asset',
        aggregateId: watcherId,
        aggregateVersion: 1,
        actor: intent.actor,
        timestamp: Date.now(),
        payload: {
          watcher: {
            id: watcherId,
            ownerId: payload.ownerId,
            createdAt: Date.now(),
            source: payload.source,
            pollInterval: payload.pollInterval || '5m',
            filter: payload.filter || {},
            action: payload.action,
            tier: payload.tier || 'Basic',
            monthlyCost,
            status: 'Active',
          } as Watcher,
        },
      });

      return {
        success: true,
        outcome: { type: 'Created', id: watcherId, monthlyCost },
        events: [event],
        affordances: [],
        meta: { processedAt: Date.now(), processingTime: 0 },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Daemon Management
  // -------------------------------------------------------------------------
  {
    name: 'start:daemon',
    description: 'Start a continuous daemon process for an agent',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['entityId', 'loops'],
      properties: {
        entityId: { type: 'string' },
        mode: { type: 'string', enum: ['Persistent', 'Scheduled'], default: 'Scheduled' },
        budget: {
          type: 'object',
          properties: {
            hourlyMax: { type: 'object' },
            dailyMax: { type: 'object' },
            onExhausted: { type: 'string', enum: ['sleep', 'notify-guardian', 'reduce-frequency'], default: 'sleep' },
          },
        },
        loops: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'interval', 'action'],
            properties: {
              name: { type: 'string' },
              interval: { type: 'string' },
              action: { type: 'string' },
            },
          },
        },
      },
    },
    requiredPermissions: ['Daemon:start'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const payload = intent.payload as any;
      const daemonId = Ids.entity();
      const eventStore = context.eventStore as any;

      const event = await eventStore.append({
        type: 'DaemonStarted',
        aggregateType: 'Workflow',
        aggregateId: daemonId,
        aggregateVersion: 1,
        actor: intent.actor,
        timestamp: Date.now(),
        payload: {
          daemon: {
            id: daemonId,
            entityId: payload.entityId,
            createdAt: Date.now(),
            mode: payload.mode || 'Scheduled',
            budget: payload.budget || {
              hourlyMax: { amount: 5, unit: 'UBL' },
              dailyMax: { amount: 50, unit: 'UBL' },
              onExhausted: 'sleep',
            },
            heartbeat: {
              interval: '1m',
            },
            loops: payload.loops,
            status: 'Running',
          } as Daemon,
        },
      });

      return {
        success: true,
        outcome: { type: 'Started', id: daemonId },
        events: [event],
        affordances: [],
        meta: { processedAt: Date.now(), processingTime: 0 },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Shadow Entity Management (Full-spec.md)
  // -------------------------------------------------------------------------
  {
    name: 'register:shadow',
    description: 'Register a shadow entity for an external party not yet in UBL',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['externalIdentity', 'discoveredBy'],
      properties: {
        externalIdentity: {
          type: 'object',
          required: ['platform', 'platformId'],
          properties: {
            platform: { type: 'string', description: 'Platform where entity was discovered (telegram, reddit, email, etc.)' },
            platformId: { type: 'string', description: 'Unique ID on that platform' },
            platformUsername: { type: 'string' },
            name: { type: 'string' },
            metadata: { type: 'object' },
          },
        },
        discoveredBy: { type: 'string', description: 'Entity ID of the agent that discovered this shadow' },
        shadowType: { type: 'string', enum: ['lead', 'client', 'vendor', 'partner', 'unknown'], default: 'unknown' },
        initialReputation: { type: 'number', minimum: 0, maximum: 100 },
        realmId: { type: 'string' },
      },
    },
    requiredPermissions: ['Shadow:register'],
    examples: [
      {
        externalIdentity: {
          platform: 'telegram',
          platformId: '123456789',
          platformUsername: 'john_doe',
          name: 'John Doe',
        },
        discoveredBy: 'ent-agent-001',
        shadowType: 'lead',
      },
    ],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as any;
      const eventStore = context.eventStore as any;

      // Check if shadow already exists for this platform/platformId
      const existingEvents = await eventStore.query?.({
        types: ['ShadowEntityCreated'],
      }) || [];

      const existingShadow = existingEvents.find((e: any) => {
        const shadow = e.payload.shadowEntity || e.payload.shadow;
        return shadow?.externalIdentity?.platform === payload.externalIdentity.platform &&
               shadow?.externalIdentity?.platformId === payload.externalIdentity.platformId;
      });

      if (existingShadow) {
        const shadow = existingShadow.payload.shadowEntity || existingShadow.payload.shadow;
        return {
          success: true,
          outcome: {
            type: 'Queried',
            results: { shadow, existingEntity: shadow.id },
          },
          events: [],
          affordances: [
            { intent: 'update:shadow', description: 'Update shadow entity', required: ['shadowId'] },
          ],
          meta: { processedAt: Date.now(), processingTime: Date.now() - startTime },
        };
      }

      const shadowId = Ids.entity();
      const now = Date.now();

      const shadow: ExtendedShadowEntity = {
        id: shadowId,
        type: 'Shadow',
        realmId: payload.realmId || 'realm-default',
        discoveredBy: payload.discoveredBy,
        discoveredAt: now,
        externalIdentity: payload.externalIdentity,
        shadowType: payload.shadowType || 'unknown',
        interactionHistory: {
          firstContact: now,
          lastContact: now,
          totalInteractions: 1,
          platforms: [payload.externalIdentity.platform],
          successfulDeliveries: 0,
          failedDeliveries: 0,
        },
        reputation: payload.initialReputation !== undefined ? {
          score: payload.initialReputation,
          lastUpdated: now,
          factors: {
            responsiveness: 50,
            clarity: 50,
            payment: 50,
            respectful: 50,
          },
        } : undefined,
        createdAt: now,
        updatedAt: now,
      };

      const event = await eventStore.append({
        type: 'ShadowEntityCreated',
        aggregateType: 'Entity',
        aggregateId: shadowId,
        aggregateVersion: 1,
        actor: intent.actor,
        timestamp: now,
        payload: { shadowEntity: shadow },
      });

      return {
        success: true,
        outcome: {
          type: 'Created',
          entity: shadow,
          id: shadowId,
        },
        events: [event],
        affordances: [
          { intent: 'declare:obligation', description: 'Declare obligation regarding this entity', required: ['terms'] },
          { intent: 'update:shadow', description: 'Update shadow details', required: ['updates'] },
        ],
        meta: { processedAt: Date.now(), processingTime: Date.now() - startTime },
      };
    },
  },

  {
    name: 'find:shadow',
    description: 'Find shadow entities by various criteria',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      properties: {
        platform: { type: 'string' },
        platformId: { type: 'string' },
        discoveredBy: { type: 'string' },
        shadowType: { type: 'string', enum: ['lead', 'client', 'vendor', 'partner', 'unknown'] },
        reputationMin: { type: 'number', minimum: 0, maximum: 100 },
        limit: { type: 'number', default: 100 },
      },
    },
    requiredPermissions: ['Shadow:read'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as any;
      const eventStore = context.eventStore as any;

      // Query all shadow creation events
      const events = await eventStore.query?.({
        types: ['ShadowEntityCreated'],
      }) || [];

      let shadows = events.map((e: any) => e.payload.shadowEntity || e.payload.shadow).filter(Boolean);

      // Apply filters
      if (payload.platform) {
        shadows = shadows.filter((s: any) => s.externalIdentity?.platform === payload.platform);
      }
      if (payload.platformId) {
        shadows = shadows.filter((s: any) => s.externalIdentity?.platformId === payload.platformId);
      }
      if (payload.discoveredBy) {
        shadows = shadows.filter((s: any) => s.discoveredBy === payload.discoveredBy);
      }
      if (payload.shadowType) {
        shadows = shadows.filter((s: any) => s.shadowType === payload.shadowType);
      }
      if (payload.reputationMin !== undefined) {
        shadows = shadows.filter((s: any) => s.reputation?.score >= payload.reputationMin);
      }

      // Apply limit
      const limit = payload.limit || 100;
      shadows = shadows.slice(0, limit);

      return {
        success: true,
        outcome: {
          type: 'Queried',
          results: { shadows, total: shadows.length },
        },
        events: [],
        affordances: shadows.length > 0 ? [
          { intent: 'declare:obligation', description: 'Declare obligation for a shadow', required: ['regardingEntity'] },
        ] : [],
        meta: { processedAt: Date.now(), processingTime: Date.now() - startTime },
      };
    },
  },

  {
    name: 'update:shadow',
    description: 'Update a shadow entity (reputation, type, interaction history)',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['shadowId'],
      properties: {
        shadowId: { type: 'string' },
        shadowType: { type: 'string', enum: ['lead', 'client', 'vendor', 'partner', 'unknown'] },
        reputation: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            factors: { type: 'object' },
            notes: { type: 'string' },
          },
        },
        recordInteraction: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['message', 'delivery', 'payment', 'feedback'] },
            success: { type: 'boolean' },
            details: { type: 'object' },
          },
        },
      },
    },
    requiredPermissions: ['Shadow:update'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as any;
      const eventStore = context.eventStore as any;
      const now = Date.now();

      const events: any[] = [];

      // Record shadow update event
      if (payload.shadowType || payload.reputation) {
        events.push(
          await eventStore.append({
            type: 'ShadowEntityUpdated',
            aggregateType: 'Entity',
            aggregateId: payload.shadowId,
            aggregateVersion: 1,
            actor: intent.actor,
            timestamp: now,
            payload: {
              shadowId: payload.shadowId,
              updates: {
                ...(payload.shadowType && { shadowType: payload.shadowType }),
                ...(payload.reputation && {
                  reputation: {
                    ...payload.reputation,
                    lastUpdated: now,
                  },
                }),
                updatedAt: now,
              },
            },
          })
        );
      }

      // Record interaction if provided
      if (payload.recordInteraction) {
        events.push(
          await eventStore.append({
            type: 'ShadowInteractionRecorded',
            aggregateType: 'Entity',
            aggregateId: payload.shadowId,
            aggregateVersion: 1,
            actor: intent.actor,
            timestamp: now,
            payload: {
              shadowId: payload.shadowId,
              interaction: {
                ...payload.recordInteraction,
                timestamp: now,
              },
            },
          })
        );
      }

      return {
        success: true,
        outcome: { type: 'Updated', id: payload.shadowId },
        events,
        affordances: [],
        meta: { processedAt: Date.now(), processingTime: Date.now() - startTime },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Unilateral Obligation (Full-spec.md)
  // -------------------------------------------------------------------------
  {
    name: 'declare:obligation',
    description: 'Declare a unilateral obligation - agent commits to work without counter-party signature',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['terms'],
      properties: {
        regardingEntity: { type: 'string', description: 'Shadow entity ID (client)' },
        source: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            messageId: { type: 'string' },
            timestamp: { type: 'number' },
            url: { type: 'string' },
          },
        },
        terms: {
          type: 'object',
          required: ['what', 'priority'],
          properties: {
            what: { type: 'string', description: 'Description of the work' },
            deadline: { type: 'number' },
            successCriteria: { type: 'array', items: { type: 'string' } },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            estimatedEffort: {
              type: 'object',
              properties: {
                hours: { type: 'number' },
                complexity: { type: 'string', enum: ['trivial', 'simple', 'moderate', 'complex'] },
              },
            },
          },
        },
        reasoning: {
          type: 'object',
          properties: {
            input: { type: 'string' },
            analysis: { type: 'object' },
            decision: { type: 'object' },
          },
        },
        workspaceId: { type: 'string' },
        realmId: { type: 'string' },
      },
    },
    requiredPermissions: ['Obligation:declare'],
    examples: [
      {
        regardingEntity: 'shadow-client-001',
        source: {
          platform: 'telegram',
          messageId: '12345',
          timestamp: Date.now(),
        },
        terms: {
          what: 'Build a Python web scraper for product prices',
          priority: 'medium',
          estimatedEffort: { hours: 4, complexity: 'moderate' },
          successCriteria: ['Script runs without errors', 'Extracts price data correctly'],
        },
        reasoning: {
          input: 'I need a Python scraper for product prices',
          analysis: {
            complexity: 'moderate',
            risks: ['Website structure may change'],
            opportunities: ['Recurring work possible'],
            timeEstimate: 4,
            requiredSkills: ['python', 'web-scraping'],
          },
          decision: {
            action: 'accept',
            confidence: 0.85,
            rationale: 'Within capabilities, reasonable scope',
            alternatives: ['Request more details'],
          },
        },
      },
    ],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as any;
      const eventStore = context.eventStore as any;

      const obligationId = Ids.agreement();
      const now = Date.now();

      // Get the declaring agent's ID from actor
      const agentId = intent.actor.type === 'Entity' ? (intent.actor as any).entityId : 'unknown-agent';

      const obligation: UnilateralObligation = {
        id: obligationId,
        realmId: payload.realmId || 'realm-default',
        type: 'unilateral-obligation',
        parties: [{
          entityId: agentId,
          role: 'Obligor',
          declaredAt: now,
        }],
        status: 'declared',
        terms: {
          what: payload.terms.what,
          regardingEntity: payload.regardingEntity,
          source: payload.source,
          deadline: payload.terms.deadline,
          successCriteria: payload.terms.successCriteria,
          priority: payload.terms.priority,
          estimatedEffort: payload.terms.estimatedEffort,
          workspaceId: payload.workspaceId,
        },
        reasoning: payload.reasoning,
        createdAt: now,
        updatedAt: now,
      };

      const event = await eventStore.append({
        type: 'UnilateralObligationDeclared',
        aggregateType: 'Agreement',
        aggregateId: obligationId,
        aggregateVersion: 1,
        actor: intent.actor,
        timestamp: now,
        payload: { obligation },
      });

      return {
        success: true,
        outcome: {
          type: 'Created',
          entity: { agreement: obligation, obligationId },
          id: obligationId,
        },
        events: [event],
        affordances: [
          { intent: 'update:obligation-status', description: 'Start working on obligation', required: ['status'] },
          { intent: 'register:asset', description: 'Create workspace for execution', required: ['assetType'] },
          { intent: 'fulfill', description: 'Mark obligation as fulfilled', required: ['evidence'] },
        ],
        meta: { processedAt: Date.now(), processingTime: Date.now() - startTime },
      };
    },
  },

  {
    name: 'update:obligation-status',
    description: 'Update the status of a unilateral obligation',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['obligationId', 'status'],
      properties: {
        obligationId: { type: 'string' },
        status: { type: 'string', enum: ['declared', 'in-progress', 'fulfilled', 'abandoned'] },
        reason: { type: 'string' },
        evidence: { type: 'object' },
      },
    },
    requiredPermissions: ['Obligation:update'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as any;
      const eventStore = context.eventStore as any;

      const event = await eventStore.append({
        type: 'ObligationStatusChanged',
        aggregateType: 'Agreement',
        aggregateId: payload.obligationId,
        aggregateVersion: 1,
        actor: intent.actor,
        timestamp: Date.now(),
        payload: {
          obligationId: payload.obligationId,
          previousStatus: 'declared', // Would need to look up actual previous status
          newStatus: payload.status,
          reason: payload.reason,
          evidence: payload.evidence,
        },
      });

      return {
        success: true,
        outcome: {
          type: 'Transitioned',
          from: 'declared',
          to: payload.status,
        },
        events: [event],
        affordances: payload.status === 'fulfilled' ? [
          { intent: 'transfer:credits', description: 'Process payment for completed work', required: ['amount'] },
        ] : [],
        meta: { processedAt: Date.now(), processingTime: Date.now() - startTime },
      };
    },
  },

  {
    name: 'list:obligations',
    description: 'List unilateral obligations for an agent',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      properties: {
        agentId: { type: 'string' },
        regardingEntity: { type: 'string' },
        status: {
          oneOf: [
            { type: 'string', enum: ['declared', 'in-progress', 'fulfilled', 'abandoned'] },
            { type: 'array', items: { type: 'string' } },
          ],
        },
        limit: { type: 'number', default: 100 },
      },
    },
    requiredPermissions: ['Obligation:read'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as any;
      const eventStore = context.eventStore as any;

      // Query all obligation events
      const declaredEvents = await eventStore.query?.({
        types: ['UnilateralObligationDeclared'],
      }) || [];

      let obligations = declaredEvents.map((e: any) => e.payload.obligation).filter(Boolean);

      // Apply filters
      if (payload.agentId) {
        obligations = obligations.filter((o: any) =>
          o.parties?.[0]?.entityId === payload.agentId
        );
      }
      if (payload.regardingEntity) {
        obligations = obligations.filter((o: any) =>
          o.terms?.regardingEntity === payload.regardingEntity
        );
      }
      if (payload.status) {
        const statuses = Array.isArray(payload.status) ? payload.status : [payload.status];
        obligations = obligations.filter((o: any) => statuses.includes(o.status));
      }

      // Apply status changes
      const statusEvents = await eventStore.query?.({
        types: ['ObligationStatusChanged'],
      }) || [];

      const statusMap = new Map<string, string>();
      for (const e of statusEvents) {
        statusMap.set(e.payload.obligationId, e.payload.newStatus);
      }

      obligations = obligations.map((o: any) => ({
        ...o,
        status: statusMap.get(o.id) || o.status,
      }));

      // Re-apply status filter after updates
      if (payload.status) {
        const statuses = Array.isArray(payload.status) ? payload.status : [payload.status];
        obligations = obligations.filter((o: any) => statuses.includes(o.status));
      }

      const limit = payload.limit || 100;
      obligations = obligations.slice(0, limit);

      return {
        success: true,
        outcome: {
          type: 'Queried',
          results: { agreements: obligations, total: obligations.length },
        },
        events: [],
        affordances: [],
        meta: { processedAt: Date.now(), processingTime: Date.now() - startTime },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Query Agent Economics (Full-spec.md)
  // -------------------------------------------------------------------------
  {
    name: 'query:economics',
    description: 'Query comprehensive economic status for an agent',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['entityId'],
      properties: {
        entityId: { type: 'string', description: 'Entity ID to query economics for' },
        realmId: { type: 'string' },
      },
    },
    requiredPermissions: ['Economics:read'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as any;
      const eventStore = context.eventStore as any;

      const entityId = payload.entityId;

      // Get all wallets for this entity
      const walletEvents = await eventStore.query?.({
        types: ['WalletCreated'],
      }) || [];

      const entityWallets = walletEvents
        .filter((e: any) => e.payload.wallet?.ownerId === entityId)
        .map((e: any) => e.payload.wallet);

      // Calculate balances from transactions
      const txEvents = await eventStore.query?.({
        types: ['TransactionExecuted'],
      }) || [];

      const walletsWithBalance = await Promise.all(
        entityWallets.map(async (wallet: any) => {
          let balance = BigInt(wallet.initialBalance || 0);

          for (const event of txEvents) {
            const tx = event.payload.transaction;
            if (tx.toWalletId === wallet.id && tx.status === 'Completed') {
              balance += BigInt(Math.floor((tx.amount?.amount || 0) * 1000));
            }
            if (tx.fromWalletId === wallet.id && tx.status === 'Completed') {
              balance -= BigInt(Math.floor((tx.amount?.amount || 0) * 1000));
            }
          }

          return { ...wallet, balance };
        })
      );

      // Get active loan
      const loanEvents = await eventStore.query?.({
        types: ['LoanDisbursed'],
      }) || [];

      const entityLoans = loanEvents
        .filter((e: any) => e.payload.loan?.borrowerId === entityId)
        .map((e: any) => e.payload.loan);

      const repaymentEvents = await eventStore.query?.({
        types: ['LoanRepayment'],
      }) || [];

      let activeLoan = undefined;
      if (entityLoans.length > 0) {
        const loan = entityLoans[entityLoans.length - 1]; // Most recent
        const loanRepayments = repaymentEvents.filter((e: any) => e.payload.loanId === loan.id);
        const totalPaid = loanRepayments.reduce((sum: number, e: any) => sum + (e.payload.amount?.amount || 0), 0);

        if (loan.status === 'Active' || totalPaid < loan.principal.amount) {
          activeLoan = {
            loanId: loan.id,
            principal: loan.principal.amount,
            paidAmount: totalPaid,
            remainingBalance: loan.principal.amount - totalPaid,
          };
        }
      }

      // Get watchers for monthly costs
      const watcherEvents = await eventStore.query?.({
        types: ['WatcherCreated'],
      }) || [];

      const entityWatchers = watcherEvents
        .filter((e: any) => e.payload.watcher?.ownerId === entityId && e.payload.watcher?.status === 'Active')
        .map((e: any) => ({
          id: e.payload.watcher.id,
          cost: e.payload.watcher.monthlyCost?.amount || (e.payload.watcher.tier === 'Premium' ? 25 : 10),
        }));

      // Get daemons for monthly costs
      const daemonEvents = await eventStore.query?.({
        types: ['DaemonStarted'],
      }) || [];

      const entityDaemons = daemonEvents
        .filter((e: any) => e.payload.daemon?.entityId === entityId && e.payload.daemon?.status === 'Running')
        .map((e: any) => ({
          id: e.payload.daemon.id,
          estimatedCost: (e.payload.daemon.budget?.dailyMax?.amount || 50) * 30,
        }));

      // Calculate monthly recurring costs
      const watcherCosts = entityWatchers.reduce((sum: number, w: any) => sum + w.cost, 0);
      const daemonCosts = entityDaemons.reduce((sum: number, d: any) => sum + d.estimatedCost, 0);
      const monthlyRecurringCosts = watcherCosts + daemonCosts;

      // Calculate earnings
      const incomingTxs = txEvents.filter((e: any) => {
        const tx = e.payload.transaction;
        return entityWallets.some((w: any) => w.id === tx.toWalletId) && tx.status === 'Completed';
      });

      const outgoingTxs = txEvents.filter((e: any) => {
        const tx = e.payload.transaction;
        return entityWallets.some((w: any) => w.id === tx.fromWalletId) && tx.status === 'Completed';
      });

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const thisMonthTs = thisMonth.getTime();

      const lastMonth = new Date(thisMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthTs = lastMonth.getTime();

      const earningsThisMonth = incomingTxs
        .filter((e: any) => e.timestamp >= thisMonthTs)
        .reduce((sum: number, e: any) => sum + (e.payload.transaction.amount?.amount || 0), 0);

      const earningsLastMonth = incomingTxs
        .filter((e: any) => e.timestamp >= lastMonthTs && e.timestamp < thisMonthTs)
        .reduce((sum: number, e: any) => sum + (e.payload.transaction.amount?.amount || 0), 0);

      const totalEarnings = incomingTxs
        .reduce((sum: number, e: any) => sum + (e.payload.transaction.amount?.amount || 0), 0);

      // Determine profitability
      const netIncome = earningsThisMonth - monthlyRecurringCosts;
      let profitability: 'losing' | 'breaking-even' | 'profitable';
      if (netIncome > 0) profitability = 'profitable';
      else if (netIncome === 0) profitability = 'breaking-even';
      else profitability = 'losing';

      return {
        success: true,
        outcome: {
          type: 'Queried',
          results: {
            wallet: walletsWithBalance[0], // Primary wallet
            wallets: walletsWithBalance,
            activeLoan,
            monthlyRecurringCosts,
            watchers: entityWatchers,
            daemons: entityDaemons,
            earnings: {
              thisMonth: earningsThisMonth,
              lastMonth: earningsLastMonth,
              total: totalEarnings,
            },
            profitability,
          },
        },
        events: [],
        affordances: [],
        meta: { processedAt: Date.now(), processingTime: Date.now() - startTime },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Process External Stimulus (Full-spec.md)
  // -------------------------------------------------------------------------
  {
    name: 'process:stimulus',
    description: 'Record and process an external stimulus from a watcher',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['watcherId', 'source', 'content'],
      properties: {
        watcherId: { type: 'string' },
        source: {
          type: 'object',
          required: ['platform', 'messageId', 'timestamp'],
          properties: {
            platform: { type: 'string' },
            messageId: { type: 'string' },
            timestamp: { type: 'number' },
            url: { type: 'string' },
          },
        },
        content: {
          type: 'object',
          required: ['raw'],
          properties: {
            raw: { type: 'string' },
            parsed: { type: 'object' },
            attachments: { type: 'array' },
          },
        },
        sender: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            username: { type: 'string' },
            reputation: { type: 'number' },
          },
        },
      },
    },
    requiredPermissions: ['Stimulus:process'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as any;
      const eventStore = context.eventStore as any;

      const stimulusId = `stimulus-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = Date.now();

      const stimulus: ExternalStimulus = {
        id: stimulusId,
        watcherId: payload.watcherId,
        source: payload.source,
        content: payload.content,
        sender: payload.sender,
        timestamp: payload.source.timestamp || now,
      };

      const event = await eventStore.append({
        type: 'ExternalStimulusReceived',
        aggregateType: 'Asset',
        aggregateId: payload.watcherId,
        aggregateVersion: 1,
        actor: intent.actor,
        timestamp: now,
        payload: { stimulus },
      });

      return {
        success: true,
        outcome: {
          type: 'Created',
          entity: stimulus,
          id: stimulusId,
        },
        events: [event],
        affordances: [
          { intent: 'register:shadow', description: 'Create shadow for sender', required: ['externalIdentity'] },
          { intent: 'declare:obligation', description: 'Accept and commit to work', required: ['terms'] },
        ],
        meta: { processedAt: Date.now(), processingTime: Date.now() - startTime },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Extended Agent Registration with Capabilities (Full-spec.md)
  // -------------------------------------------------------------------------
  {
    name: 'update:agent-capabilities',
    description: 'Update an agent\'s capabilities',
    category: 'Agent Economy',
    schema: {
      type: 'object',
      required: ['agentId', 'capabilities'],
      properties: {
        agentId: { type: 'string' },
        capabilities: {
          type: 'object',
          properties: {
            platforms: { type: 'array', items: { type: 'string' } },
            skills: { type: 'array', items: { type: 'string' } },
            languages: { type: 'array', items: { type: 'string' } },
            maxTaskComplexity: { type: 'string', enum: ['trivial', 'simple', 'moderate', 'complex'] },
          },
        },
      },
    },
    requiredPermissions: ['Agent:update'],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as any;
      const eventStore = context.eventStore as any;

      const event = await eventStore.append({
        type: 'AgentCapabilitiesUpdated',
        aggregateType: 'Entity',
        aggregateId: payload.agentId,
        aggregateVersion: 1,
        actor: intent.actor,
        timestamp: Date.now(),
        payload: {
          agentId: payload.agentId,
          capabilities: payload.capabilities,
        },
      });

      return {
        success: true,
        outcome: { type: 'Updated', id: payload.agentId },
        events: [event],
        affordances: [],
        meta: { processedAt: Date.now(), processingTime: Date.now() - startTime },
      };
    },
  },
];
