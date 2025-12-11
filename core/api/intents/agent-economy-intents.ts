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
];
