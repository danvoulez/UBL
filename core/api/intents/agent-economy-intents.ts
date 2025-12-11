/**
 * AGENT ECONOMY INTENTS
 *
 * Intent handlers for the Agent Economy where AI agents are first-class economic participants.
 *
 * Key Intents:
 * - register:agent - Register a new AI agent with guardian, constitution, and starter loan
 * - assign:guardian - Assign/change guardian for an entity
 * - update:constitution - Update entity's values/constraints
 * - record:trajectory - Record an action in agent's trajectory
 *
 * Architecture Rules:
 * - All state changes via Events (event-store only)
 * - All permissions via Agreements (ABAC)
 * - Guardian approval required for supervised entities
 */

import type { IntentDefinition, Intent, IntentResult, HandlerContext } from '../intent-api';
import type { Quantity } from '../../shared/types';
import { Ids, asEntityId } from '../../shared/types';
import type { EntityId } from '../../schema/ledger';
import type {
  EntitySubstrate,
  AutonomyLevel,
  Constitution,
  GuardianLink,
  AgentRegisteredPayload,
  GuardianAssignedPayload,
  ConstitutionUpdatedPayload,
  AutonomyLevelChangedPayload,
  TrajectorySpanRecordedPayload,
  TrajectorySpanPayload,
  UBL_CREDIT,
} from '../../schema/agent-economy';

// ============================================================================
// AGENT ECONOMY INTENTS
// ============================================================================

export const AGENT_ECONOMY_INTENTS: readonly IntentDefinition[] = [
  // -------------------------------------------------------------------------
  // Register Agent - Create a new AI agent with full setup
  // -------------------------------------------------------------------------
  {
    name: 'register:agent',
    description: 'Register a new AI agent with guardian, constitution, and optional starter loan',
    category: 'Entity',
    schema: {
      type: 'object',
      required: ['identity', 'guardianId'],
      properties: {
        identity: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', description: 'Agent name' },
            did: { type: 'string', description: 'Decentralized Identifier (optional)' },
            publicKey: { type: 'string', description: 'Public key for signatures (optional)' },
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
          description: 'Optional starter loan configuration',
          properties: {
            principal: { type: 'number', default: 1000 },
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
        autonomyLevel: 'Limited',
      },
    ],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as {
        identity: { name: string; did?: string; publicKey?: string };
        guardianId: string;
        constitution?: Partial<Constitution>;
        autonomyLevel?: AutonomyLevel;
        starterLoan?: {
          principal?: number;
          interestRate?: number;
          repaymentRate?: number;
          gracePeriodDays?: number;
        };
      };

      // Generate IDs
      const agentId = Ids.entity();
      const guardianshipAgreementId = Ids.agreement();

      const eventStore = context.eventStore;
      const events: Array<{ id: EntityId; type: string; sequence: bigint }> = [];

      // Build constitution with defaults
      const constitution: Constitution = {
        values: payload.constitution?.values || ['Act with integrity', 'Deliver value', 'Be accountable'],
        constraints: payload.constitution?.constraints || {},
        style: payload.constitution?.style,
        version: 1,
        lastUpdated: Date.now(),
      };

      // Build guardian link
      const guardian: GuardianLink = {
        guardianId: asEntityId(payload.guardianId),
        effectiveFrom: Date.now(),
        agreementId: guardianshipAgreementId,
        notifyOn: {
          violations: true,
          allActions: payload.autonomyLevel === 'Supervised',
        },
      };

      // 1. Create guardianship agreement first (ABAC: guardian must agree)
      const guardianshipEvent = await eventStore.append({
        type: 'AgreementProposed',
        aggregateId: guardianshipAgreementId,
        aggregateType: 'Agreement',
        aggregateVersion: 1,
        payload: {
          type: 'AgreementProposed',
          agreementType: 'Guardianship',
          parties: [
            {
              entityId: payload.guardianId,
              role: 'Guardian',
              obligations: [{ id: 'supervise', description: 'Supervise and be liable for agent actions' }],
              rights: [{ id: 'control', description: 'Approve or reject agent actions' }],
            },
            {
              entityId: agentId,
              role: 'Ward',
              obligations: [{ id: 'comply', description: 'Comply with guardian directives' }],
              rights: [{ id: 'operate', description: 'Operate within approved constraints' }],
            },
          ],
          terms: {
            description: `Guardianship agreement for agent ${payload.identity.name}`,
          },
        },
        actor: intent.actor,
        causation: { commandId: intent.idempotencyKey as EntityId },
      });
      events.push({ id: guardianshipEvent.id, type: guardianshipEvent.type, sequence: guardianshipEvent.sequence });

      // 2. Register the agent entity
      const agentPayload: AgentRegisteredPayload = {
        type: 'AgentRegistered',
        substrate: 'Agent',
        identity: {
          name: payload.identity.name,
          did: payload.identity.did,
          publicKey: payload.identity.publicKey,
        },
        guardian,
        autonomyLevel: payload.autonomyLevel || 'Limited',
        constitution,
      };

      const agentEvent = await eventStore.append({
        type: 'AgentRegistered',
        aggregateId: agentId,
        aggregateType: 'Party',
        aggregateVersion: 1,
        payload: agentPayload,
        actor: intent.actor,
        causation: { commandId: asEntityId(intent.idempotencyKey || Ids.command()) },
      });
      events.push({ id: agentEvent.id, type: agentEvent.type, sequence: agentEvent.sequence });

      // 3. If starter loan requested, create loan agreement and wallet
      let walletId: EntityId | undefined;
      let loanId: EntityId | undefined;

      if (payload.starterLoan) {
        walletId = Ids.entity();
        loanId = Ids.agreement();
        const principal = payload.starterLoan.principal || 1000;

        // TODO: Create wallet as container when ContainerManager API is ready
        // For now, wallet creation is deferred

        // Create loan agreement
        const loanEvent = await eventStore.append({
          type: 'AgreementProposed',
          aggregateId: loanId,
          aggregateType: 'Agreement',
          aggregateVersion: 1,
          payload: {
            type: 'AgreementProposed',
            agreementType: 'StarterLoan',
            parties: [
              {
                entityId: payload.guardianId,
                role: 'Lender',
                obligations: [{ id: 'disburse', description: `Disburse ${principal} UBL` }],
                rights: [{ id: 'repayment', description: 'Receive repayment with interest' }],
              },
              {
                entityId: agentId,
                role: 'Borrower',
                obligations: [{ id: 'repay', description: 'Repay loan from earnings' }],
                rights: [{ id: 'use', description: 'Use funds for operations' }],
              },
            ],
            terms: {
              description: `Starter loan of ${principal} UBL`,
              principal: { amount: principal, unit: 'UBL' },
              interestRate: payload.starterLoan.interestRate || 0.10,
              repaymentRate: payload.starterLoan.repaymentRate || 0.20,
              gracePeriodDays: payload.starterLoan.gracePeriodDays || 30,
            },
          },
          actor: intent.actor,
          causation: { commandId: intent.idempotencyKey as EntityId },
        });
        events.push({ id: loanEvent.id, type: loanEvent.type, sequence: loanEvent.sequence });
      }

      return {
        success: true,
        outcome: {
          type: 'Created',
          entity: {
            id: agentId,
            substrate: 'Agent',
            identity: payload.identity,
            guardian,
            autonomyLevel: payload.autonomyLevel || 'Limited',
            constitution,
            walletId,
            loanId,
          },
          id: agentId,
        },
        events,
        affordances: [
          {
            intent: 'update:constitution',
            description: 'Update agent constitution',
            required: ['entityId', 'constitution'],
          },
          {
            intent: 'record:trajectory',
            description: 'Record an action in agent trajectory',
            required: ['entityId', 'action', 'input', 'output'],
          },
        ],
        meta: {
          processedAt: Date.now(),
          processingTime: Date.now() - startTime,
          idempotencyKey: intent.idempotencyKey,
        },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Assign Guardian - Change guardian for an entity
  // -------------------------------------------------------------------------
  {
    name: 'assign:guardian',
    description: 'Assign or change guardian for an entity',
    category: 'Entity',
    schema: {
      type: 'object',
      required: ['entityId', 'newGuardianId'],
      properties: {
        entityId: { type: 'string', description: 'Entity to assign guardian to' },
        newGuardianId: { type: 'string', description: 'New guardian entity ID' },
        reason: { type: 'string', description: 'Reason for change' },
        liabilityLimit: { type: 'object', description: 'Optional liability limit' },
      },
    },
    requiredPermissions: ['Guardian:assign'],
    examples: [],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as {
        entityId: string;
        newGuardianId: string;
        reason?: string;
        liabilityLimit?: Quantity;
      };

      const agreementId = Ids.agreement();

      // Create new guardianship agreement
      const guardian: GuardianLink = {
        guardianId: payload.newGuardianId as EntityId,
        effectiveFrom: Date.now(),
        agreementId,
        liabilityLimit: payload.liabilityLimit,
        notifyOn: { violations: true },
      };

      const eventPayload: GuardianAssignedPayload = {
        type: 'GuardianAssigned',
        entityId: asEntityId(payload.entityId),
        guardian,
      };

      const event = await context.eventStore.append({
        type: 'GuardianAssigned',
        aggregateId: asEntityId(payload.entityId),
        aggregateType: 'Party',
        aggregateVersion: 1,
        payload: eventPayload,
        actor: intent.actor,
        causation: { commandId: asEntityId(intent.idempotencyKey || Ids.command()) },
      });

      return {
        success: true,
        outcome: {
          type: 'Updated',
          entity: { entityId: payload.entityId, guardian },
          changes: ['guardian'],
        },
        events: [{ id: event.id, type: event.type, sequence: event.sequence }],
        affordances: [],
        meta: {
          processedAt: Date.now(),
          processingTime: Date.now() - startTime,
        },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Update Constitution - Change entity's values/constraints
  // -------------------------------------------------------------------------
  {
    name: 'update:constitution',
    description: 'Update entity\'s constitution (values, constraints, style)',
    category: 'Entity',
    schema: {
      type: 'object',
      required: ['entityId', 'constitution', 'reason'],
      properties: {
        entityId: { type: 'string' },
        constitution: { type: 'object' },
        reason: { type: 'string' },
      },
    },
    requiredPermissions: ['Constitution:update'],
    examples: [],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as {
        entityId: string;
        constitution: Partial<Constitution>;
        reason: string;
      };

      // Get current version (would need to rehydrate entity)
      const previousVersion = 1; // TODO: get from aggregate

      const newConstitution: Constitution = {
        values: payload.constitution.values || [],
        constraints: payload.constitution.constraints || {},
        style: payload.constitution.style,
        version: previousVersion + 1,
        lastUpdated: Date.now(),
      };

      const eventPayload: ConstitutionUpdatedPayload = {
        type: 'ConstitutionUpdated',
        entityId: asEntityId(payload.entityId),
        previousVersion,
        constitution: newConstitution,
        reason: payload.reason,
      };

      const event = await context.eventStore.append({
        type: 'ConstitutionUpdated',
        aggregateId: asEntityId(payload.entityId),
        aggregateType: 'Party',
        aggregateVersion: previousVersion + 1,
        payload: eventPayload,
        actor: intent.actor,
        causation: { commandId: asEntityId(intent.idempotencyKey || Ids.command()) },
      });

      return {
        success: true,
        outcome: {
          type: 'Updated',
          entity: { entityId: payload.entityId, constitution: newConstitution },
          changes: ['constitution'],
        },
        events: [{ id: event.id, type: event.type, sequence: event.sequence }],
        affordances: [],
        meta: {
          processedAt: Date.now(),
          processingTime: Date.now() - startTime,
        },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Record Trajectory - Record an action in agent's history
  // -------------------------------------------------------------------------
  {
    name: 'record:trajectory',
    description: 'Record an action in entity\'s trajectory (identity through action)',
    category: 'Entity',
    schema: {
      type: 'object',
      required: ['entityId', 'action', 'input', 'output', 'execution'],
      properties: {
        entityId: { type: 'string' },
        action: { type: 'string', description: 'Intent type or action name' },
        input: { type: 'object' },
        output: { type: 'object' },
        execution: {
          type: 'object',
          properties: {
            provider: { type: 'string' },
            model: { type: 'string' },
            tokens: { type: 'object' },
            cost: { type: 'object' },
            durationMs: { type: 'number' },
          },
        },
        context: { type: 'object' },
      },
    },
    requiredPermissions: ['Trajectory:record'],
    examples: [],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as {
        entityId: string;
        action: string;
        input: Record<string, unknown>;
        output: Record<string, unknown>;
        execution: {
          provider?: string;
          model?: string;
          tokens?: { input: number; output: number };
          cost?: Quantity;
          durationMs: number;
        };
        context?: {
          agreementId?: string;
          clientEntityId?: string;
          containerId?: string;
        };
      };

      const span: TrajectorySpanPayload = {
        entityId: asEntityId(payload.entityId),
        action: payload.action,
        execution: {
          provider: payload.execution.provider,
          model: payload.execution.model,
          tokens: payload.execution.tokens,
          cost: payload.execution.cost,
          durationMs: payload.execution.durationMs,
        },
        input: payload.input,
        output: payload.output,
        context: payload.context ? {
          agreementId: payload.context.agreementId ? asEntityId(payload.context.agreementId) : undefined,
          clientEntityId: payload.context.clientEntityId ? asEntityId(payload.context.clientEntityId) : undefined,
          containerId: payload.context.containerId ? asEntityId(payload.context.containerId) : undefined,
        } : undefined,
      };

      const eventPayload: TrajectorySpanRecordedPayload = {
        type: 'TrajectorySpanRecorded',
        span,
      };

      const event = await context.eventStore.append({
        type: 'TrajectorySpanRecorded',
        aggregateId: asEntityId(payload.entityId),
        aggregateType: 'Party',
        aggregateVersion: 1,
        payload: eventPayload,
        actor: intent.actor,
        causation: { commandId: asEntityId(intent.idempotencyKey || Ids.command()) },
      });

      return {
        success: true,
        outcome: {
          type: 'Created',
          entity: span,
          id: event.id,
        },
        events: [{ id: event.id, type: event.type, sequence: event.sequence }],
        affordances: [],
        meta: {
          processedAt: Date.now(),
          processingTime: Date.now() - startTime,
        },
      };
    },
  },

  // -------------------------------------------------------------------------
  // Change Autonomy Level
  // -------------------------------------------------------------------------
  {
    name: 'change:autonomy',
    description: 'Change entity\'s autonomy level (requires guardian approval)',
    category: 'Entity',
    schema: {
      type: 'object',
      required: ['entityId', 'newLevel', 'reason', 'approvedBy'],
      properties: {
        entityId: { type: 'string' },
        newLevel: { type: 'string', enum: ['Supervised', 'Limited', 'Full', 'Emancipated'] },
        reason: { type: 'string' },
        approvedBy: { type: 'string', description: 'Guardian who approved this change' },
      },
    },
    requiredPermissions: ['Autonomy:change'],
    examples: [],
    handler: async (intent: Intent, context: HandlerContext): Promise<IntentResult> => {
      const startTime = Date.now();
      const payload = intent.payload as {
        entityId: string;
        newLevel: AutonomyLevel;
        reason: string;
        approvedBy: string;
      };

      // TODO: Verify approvedBy is the current guardian

      const previousLevel: AutonomyLevel = 'Limited'; // TODO: get from aggregate

      const eventPayload: AutonomyLevelChangedPayload = {
        type: 'AutonomyLevelChanged',
        entityId: asEntityId(payload.entityId),
        previousLevel,
        newLevel: payload.newLevel,
        reason: payload.reason,
        approvedBy: asEntityId(payload.approvedBy),
      };

      const event = await context.eventStore.append({
        type: 'AutonomyLevelChanged',
        aggregateId: asEntityId(payload.entityId),
        aggregateType: 'Party',
        aggregateVersion: 1,
        payload: eventPayload,
        actor: intent.actor,
        causation: { commandId: asEntityId(intent.idempotencyKey || Ids.command()) },
      });

      return {
        success: true,
        outcome: {
          type: 'Updated',
          entity: { entityId: payload.entityId, autonomyLevel: payload.newLevel },
          changes: ['autonomyLevel'],
        },
        events: [{ id: event.id, type: event.type, sequence: event.sequence }],
        affordances: [],
        meta: {
          processedAt: Date.now(),
          processingTime: Date.now() - startTime,
        },
      };
    },
  },
];
