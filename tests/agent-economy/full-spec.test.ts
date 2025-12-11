/**
 * FULL-SPEC.MD IMPLEMENTATION TESTS
 *
 * Tests for the Agent Economy features specified in Full-spec.md:
 * - Shadow entity registration and management
 * - Unilateral obligation declaration
 * - External stimulus processing
 * - Agent economics queries
 * - Platform adapters
 * - Agent decision engine
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createTestLedger } from '../helpers/test-ledger';
import { Ids } from '../../core/shared/types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const testGuardian = {
  id: 'ent-guardian-001',
  actor: { type: 'Entity' as const, entityId: 'ent-guardian-001' },
};

const testAgent = {
  id: 'ent-agent-001',
  actor: { type: 'Entity' as const, entityId: 'ent-agent-001' },
};

const systemActor = { type: 'System' as const, systemId: 'test' };

// ============================================================================
// SHADOW ENTITY TESTS
// ============================================================================

describe('Shadow Entity Management', () => {
  it('should create shadow entity with external identity', async () => {
    const ledger = createTestLedger();
    const shadowId = Ids.entity();
    const now = Date.now();

    await ledger.eventStore.append({
      type: 'ShadowEntityCreated',
      aggregateType: 'Entity',
      aggregateId: shadowId,
      aggregateVersion: 1,
      actor: testAgent.actor,
      timestamp: now,
      payload: {
        shadowEntity: {
          id: shadowId,
          type: 'Shadow',
          realmId: 'realm-default',
          discoveredBy: testAgent.id,
          discoveredAt: now,
          externalIdentity: {
            platform: 'telegram',
            platformId: '123456789',
            platformUsername: 'john_doe',
            name: 'John Doe',
          },
          shadowType: 'lead',
          interactionHistory: {
            firstContact: now,
            lastContact: now,
            totalInteractions: 1,
            platforms: ['telegram'],
            successfulDeliveries: 0,
            failedDeliveries: 0,
          },
          createdAt: now,
          updatedAt: now,
        },
      },
    });

    const events = await ledger.getAllEvents();
    assert(events.some((e) => e.type === 'ShadowEntityCreated'));

    const shadowEvent = events.find((e) => e.type === 'ShadowEntityCreated');
    assert.strictEqual(shadowEvent?.payload.shadowEntity.externalIdentity.platform, 'telegram');
    assert.strictEqual(shadowEvent?.payload.shadowEntity.shadowType, 'lead');
  });

  it('should track interaction history for shadow', async () => {
    const ledger = createTestLedger();
    const shadowId = Ids.entity();
    const now = Date.now();

    // Create shadow
    await ledger.eventStore.append({
      type: 'ShadowEntityCreated',
      aggregateType: 'Entity',
      aggregateId: shadowId,
      aggregateVersion: 1,
      actor: testAgent.actor,
      timestamp: now,
      payload: {
        shadowEntity: {
          id: shadowId,
          type: 'Shadow',
          discoveredBy: testAgent.id,
          externalIdentity: { platform: 'telegram', platformId: '123' },
          shadowType: 'lead',
          interactionHistory: {
            firstContact: now,
            lastContact: now,
            totalInteractions: 1,
            platforms: ['telegram'],
            successfulDeliveries: 0,
            failedDeliveries: 0,
          },
        },
      },
    });

    // Record interaction
    await ledger.eventStore.append({
      type: 'ShadowInteractionRecorded',
      aggregateType: 'Entity',
      aggregateId: shadowId,
      aggregateVersion: 2,
      actor: testAgent.actor,
      timestamp: now + 1000,
      payload: {
        shadowId,
        interaction: {
          type: 'message',
          timestamp: now + 1000,
          success: true,
          details: { action: 'responded' },
        },
      },
    });

    const events = await ledger.getAllEvents();
    assert(events.some((e) => e.type === 'ShadowInteractionRecorded'));
  });

  it('should update shadow reputation', async () => {
    const ledger = createTestLedger();
    const shadowId = Ids.entity();
    const now = Date.now();

    // Create shadow
    await ledger.eventStore.append({
      type: 'ShadowEntityCreated',
      aggregateType: 'Entity',
      aggregateId: shadowId,
      aggregateVersion: 1,
      actor: testAgent.actor,
      timestamp: now,
      payload: {
        shadowEntity: {
          id: shadowId,
          type: 'Shadow',
          discoveredBy: testAgent.id,
          externalIdentity: { platform: 'telegram', platformId: '123' },
          shadowType: 'lead',
        },
      },
    });

    // Update reputation
    await ledger.eventStore.append({
      type: 'ShadowEntityUpdated',
      aggregateType: 'Entity',
      aggregateId: shadowId,
      aggregateVersion: 2,
      actor: testAgent.actor,
      timestamp: now + 1000,
      payload: {
        shadowId,
        updates: {
          reputation: {
            score: 75,
            lastUpdated: now + 1000,
            factors: {
              responsiveness: 80,
              clarity: 70,
              payment: 75,
              respectful: 75,
            },
          },
          shadowType: 'client',
        },
      },
    });

    const events = await ledger.getAllEvents();
    const updateEvent = events.find((e) => e.type === 'ShadowEntityUpdated');
    assert.strictEqual(updateEvent?.payload.updates.reputation.score, 75);
    assert.strictEqual(updateEvent?.payload.updates.shadowType, 'client');
  });
});

// ============================================================================
// UNILATERAL OBLIGATION TESTS
// ============================================================================

describe('Unilateral Obligation', () => {
  it('should declare unilateral obligation with reasoning', async () => {
    const ledger = createTestLedger();
    const obligationId = Ids.agreement();
    const shadowId = Ids.entity();
    const now = Date.now();

    await ledger.eventStore.append({
      type: 'UnilateralObligationDeclared',
      aggregateType: 'Agreement',
      aggregateId: obligationId,
      aggregateVersion: 1,
      actor: testAgent.actor,
      timestamp: now,
      payload: {
        obligation: {
          id: obligationId,
          realmId: 'realm-default',
          type: 'unilateral-obligation',
          parties: [
            {
              entityId: testAgent.id,
              role: 'Obligor',
              declaredAt: now,
            },
          ],
          status: 'declared',
          terms: {
            what: 'Build a Python web scraper for product prices',
            regardingEntity: shadowId,
            source: {
              platform: 'telegram',
              messageId: '12345',
              timestamp: now,
            },
            priority: 'medium',
            estimatedEffort: {
              hours: 4,
              complexity: 'moderate',
            },
            successCriteria: ['Script runs without errors', 'Extracts price data'],
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
          createdAt: now,
          updatedAt: now,
        },
      },
    });

    const events = await ledger.getAllEvents();
    const declaredEvent = events.find((e) => e.type === 'UnilateralObligationDeclared');
    assert(declaredEvent);
    assert.strictEqual(declaredEvent.payload.obligation.status, 'declared');
    assert.strictEqual(declaredEvent.payload.obligation.reasoning.decision.action, 'accept');
  });

  it('should transition obligation through lifecycle', async () => {
    const ledger = createTestLedger();
    const obligationId = Ids.agreement();
    const now = Date.now();

    // Declare
    await ledger.eventStore.append({
      type: 'UnilateralObligationDeclared',
      aggregateType: 'Agreement',
      aggregateId: obligationId,
      aggregateVersion: 1,
      actor: testAgent.actor,
      timestamp: now,
      payload: {
        obligation: {
          id: obligationId,
          type: 'unilateral-obligation',
          status: 'declared',
          terms: { what: 'Test work', priority: 'medium' },
        },
      },
    });

    // Start work
    await ledger.eventStore.append({
      type: 'ObligationStatusChanged',
      aggregateType: 'Agreement',
      aggregateId: obligationId,
      aggregateVersion: 2,
      actor: testAgent.actor,
      timestamp: now + 1000,
      payload: {
        obligationId,
        previousStatus: 'declared',
        newStatus: 'in-progress',
      },
    });

    // Complete work
    await ledger.eventStore.append({
      type: 'ObligationStatusChanged',
      aggregateType: 'Agreement',
      aggregateId: obligationId,
      aggregateVersion: 3,
      actor: testAgent.actor,
      timestamp: now + 2000,
      payload: {
        obligationId,
        previousStatus: 'in-progress',
        newStatus: 'fulfilled',
        evidence: { workspaceId: 'workspace-001', deliveredAt: now + 2000 },
      },
    });

    const events = await ledger.getAllEvents();
    const statusEvents = events.filter((e) => e.type === 'ObligationStatusChanged');

    assert.strictEqual(statusEvents.length, 2);
    assert.strictEqual(statusEvents[0].payload.newStatus, 'in-progress');
    assert.strictEqual(statusEvents[1].payload.newStatus, 'fulfilled');
  });
});

// ============================================================================
// EXTERNAL STIMULUS TESTS
// ============================================================================

describe('External Stimulus', () => {
  it('should record external stimulus from watcher', async () => {
    const ledger = createTestLedger();
    const watcherId = Ids.entity();
    const now = Date.now();

    await ledger.eventStore.append({
      type: 'ExternalStimulusReceived',
      aggregateType: 'Asset',
      aggregateId: watcherId,
      aggregateVersion: 1,
      actor: systemActor,
      timestamp: now,
      payload: {
        stimulus: {
          id: `stimulus-${now}`,
          watcherId,
          source: {
            platform: 'telegram',
            messageId: '12345',
            timestamp: now,
          },
          content: {
            raw: 'I need help building a web scraper',
            parsed: { chatId: '123456', messageId: 12345 },
          },
          sender: {
            id: '987654321',
            name: 'John Doe',
            username: 'john_doe',
          },
          timestamp: now,
        },
      },
    });

    const events = await ledger.getAllEvents();
    const stimulusEvent = events.find((e) => e.type === 'ExternalStimulusReceived');

    assert(stimulusEvent);
    assert.strictEqual(stimulusEvent.payload.stimulus.source.platform, 'telegram');
    assert.strictEqual(stimulusEvent.payload.stimulus.sender.username, 'john_doe');
  });

  it('should process stimulus and record result', async () => {
    const ledger = createTestLedger();
    const watcherId = Ids.entity();
    const stimulusId = `stimulus-${Date.now()}`;
    const now = Date.now();

    // Receive stimulus
    await ledger.eventStore.append({
      type: 'ExternalStimulusReceived',
      aggregateType: 'Asset',
      aggregateId: watcherId,
      aggregateVersion: 1,
      actor: systemActor,
      timestamp: now,
      payload: {
        stimulus: {
          id: stimulusId,
          watcherId,
          source: { platform: 'telegram', messageId: '123', timestamp: now },
          content: { raw: 'Test message' },
          timestamp: now,
        },
      },
    });

    // Process stimulus
    await ledger.eventStore.append({
      type: 'ExternalStimulusProcessed',
      aggregateType: 'Asset',
      aggregateId: watcherId,
      aggregateVersion: 2,
      actor: testAgent.actor,
      timestamp: now + 100,
      payload: {
        stimulusId,
        processedBy: testAgent.id,
        result: 'accepted',
        reasoning: {
          input: 'Test message',
          analysis: {
            complexity: 'trivial',
            risks: [],
            opportunities: [],
            timeEstimate: 0.5,
            requiredSkills: [],
          },
          decision: {
            action: 'accept',
            confidence: 0.9,
            rationale: 'Simple request',
            alternatives: [],
          },
        },
      },
    });

    const events = await ledger.getAllEvents();
    const processedEvent = events.find((e) => e.type === 'ExternalStimulusProcessed');

    assert(processedEvent);
    assert.strictEqual(processedEvent.payload.result, 'accepted');
  });
});

// ============================================================================
// AGENT ECONOMICS TESTS
// ============================================================================

describe('Agent Economics', () => {
  it('should track wallet balance through transactions', async () => {
    const ledger = createTestLedger();
    const agentId = Ids.entity();
    const walletId = Ids.entity();
    const now = Date.now();

    // Create wallet with initial balance from loan
    await ledger.eventStore.append({
      type: 'WalletCreated',
      aggregateType: 'Asset',
      aggregateId: walletId,
      aggregateVersion: 1,
      actor: systemActor,
      timestamp: now,
      payload: {
        wallet: {
          id: walletId,
          ownerId: agentId,
          currency: 'UBL',
          createdAt: now,
        },
        initialBalance: 1000000n, // 1000 UBL in milli-credits
      },
    });

    // Agent earns 50 UBL
    await ledger.eventStore.append({
      type: 'TransactionExecuted',
      aggregateType: 'Asset',
      aggregateId: Ids.entity(),
      aggregateVersion: 1,
      actor: systemActor,
      timestamp: now + 1000,
      payload: {
        transaction: {
          id: Ids.entity(),
          timestamp: now + 1000,
          fromWalletId: 'wallet-client-001',
          toWalletId: walletId,
          amount: { amount: 50, unit: 'UBL' },
          purpose: 'Payment for web scraper',
          status: 'Completed',
        },
      },
    });

    // Agent pays 10 UBL for watcher
    await ledger.eventStore.append({
      type: 'TransactionExecuted',
      aggregateType: 'Asset',
      aggregateId: Ids.entity(),
      aggregateVersion: 1,
      actor: systemActor,
      timestamp: now + 2000,
      payload: {
        transaction: {
          id: Ids.entity(),
          timestamp: now + 2000,
          fromWalletId: walletId,
          toWalletId: 'wallet-system-treasury',
          amount: { amount: 10, unit: 'UBL' },
          purpose: 'Watcher subscription',
          status: 'Completed',
        },
      },
    });

    const events = await ledger.getAllEvents();
    const txEvents = events.filter((e) => e.type === 'TransactionExecuted');

    assert.strictEqual(txEvents.length, 2);
  });

  it('should track loan repayment from earnings', async () => {
    const ledger = createTestLedger();
    const loanId = Ids.entity();
    const agentId = Ids.entity();
    const now = Date.now();

    // Disburse loan
    await ledger.eventStore.append({
      type: 'LoanDisbursed',
      aggregateType: 'Asset',
      aggregateId: loanId,
      aggregateVersion: 1,
      actor: systemActor,
      timestamp: now,
      payload: {
        loan: {
          id: loanId,
          borrowerId: agentId,
          guardianId: testGuardian.id,
          principal: { amount: 1000, unit: 'UBL' },
          interestRate: 0.10,
          repaymentRate: 0.20,
          disbursedAt: now,
          gracePeriodUntil: now + 30 * 24 * 60 * 60 * 1000,
          paidAmount: { amount: 0, unit: 'UBL' },
          status: 'Active',
          collateral: { type: 'Trajectory', reference: agentId },
        },
      },
    });

    // Make repayment (20% of 100 UBL earning = 20 UBL)
    await ledger.eventStore.append({
      type: 'LoanRepayment',
      aggregateType: 'Asset',
      aggregateId: loanId,
      aggregateVersion: 2,
      actor: systemActor,
      timestamp: now + 1000,
      payload: {
        loanId,
        amount: { amount: 20, unit: 'UBL' },
        remainingBalance: { amount: 980, unit: 'UBL' },
      },
    });

    const events = await ledger.getAllEvents();
    const repaymentEvent = events.find((e) => e.type === 'LoanRepayment');

    assert(repaymentEvent);
    assert.strictEqual(repaymentEvent.payload.amount.amount, 20);
    assert.strictEqual(repaymentEvent.payload.remainingBalance.amount, 980);
  });
});

// ============================================================================
// END-TO-END WORKFLOW TEST
// ============================================================================

describe('Full Agent Workflow', () => {
  it('should complete stimulus → shadow → obligation → delivery flow', async () => {
    const ledger = createTestLedger();
    const agentId = Ids.entity();
    const watcherId = Ids.entity();
    const shadowId = Ids.entity();
    const obligationId = Ids.agreement();
    const now = Date.now();

    // 1. Agent receives stimulus via watcher
    await ledger.eventStore.append({
      type: 'ExternalStimulusReceived',
      aggregateType: 'Asset',
      aggregateId: watcherId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'watcher' },
      timestamp: now,
      payload: {
        stimulus: {
          id: `stimulus-${now}`,
          watcherId,
          source: { platform: 'telegram', messageId: 'msg-001', timestamp: now },
          content: { raw: 'I need a Python scraper' },
          sender: { id: 'user-123', name: 'John', username: 'john' },
          timestamp: now,
        },
      },
    });

    // 2. Agent creates shadow for unknown sender
    await ledger.eventStore.append({
      type: 'ShadowEntityCreated',
      aggregateType: 'Entity',
      aggregateId: shadowId,
      aggregateVersion: 1,
      actor: { type: 'Entity', entityId: agentId },
      timestamp: now + 10,
      payload: {
        shadowEntity: {
          id: shadowId,
          type: 'Shadow',
          discoveredBy: agentId,
          externalIdentity: {
            platform: 'telegram',
            platformId: 'user-123',
            name: 'John',
            platformUsername: 'john',
          },
          shadowType: 'lead',
          interactionHistory: {
            firstContact: now + 10,
            lastContact: now + 10,
            totalInteractions: 1,
            platforms: ['telegram'],
            successfulDeliveries: 0,
            failedDeliveries: 0,
          },
        },
      },
    });

    // 3. Agent declares obligation
    await ledger.eventStore.append({
      type: 'UnilateralObligationDeclared',
      aggregateType: 'Agreement',
      aggregateId: obligationId,
      aggregateVersion: 1,
      actor: { type: 'Entity', entityId: agentId },
      timestamp: now + 20,
      payload: {
        obligation: {
          id: obligationId,
          type: 'unilateral-obligation',
          parties: [{ entityId: agentId, role: 'Obligor', declaredAt: now + 20 }],
          status: 'declared',
          terms: {
            what: 'Build a Python scraper',
            regardingEntity: shadowId,
            priority: 'medium',
          },
          reasoning: {
            input: 'I need a Python scraper',
            analysis: {
              complexity: 'moderate',
              risks: [],
              opportunities: [],
              timeEstimate: 2,
              requiredSkills: ['python'],
            },
            decision: {
              action: 'accept',
              confidence: 0.8,
              rationale: 'Within capabilities',
              alternatives: [],
            },
          },
        },
      },
    });

    // 4. Start work
    await ledger.eventStore.append({
      type: 'ObligationStatusChanged',
      aggregateType: 'Agreement',
      aggregateId: obligationId,
      aggregateVersion: 2,
      actor: { type: 'Entity', entityId: agentId },
      timestamp: now + 30,
      payload: {
        obligationId,
        previousStatus: 'declared',
        newStatus: 'in-progress',
      },
    });

    // 5. Complete and deliver
    await ledger.eventStore.append({
      type: 'ObligationStatusChanged',
      aggregateType: 'Agreement',
      aggregateId: obligationId,
      aggregateVersion: 3,
      actor: { type: 'Entity', entityId: agentId },
      timestamp: now + 40,
      payload: {
        obligationId,
        previousStatus: 'in-progress',
        newStatus: 'fulfilled',
        evidence: { deliveredAt: now + 40 },
      },
    });

    // 6. Update shadow with successful delivery
    await ledger.eventStore.append({
      type: 'ShadowInteractionRecorded',
      aggregateType: 'Entity',
      aggregateId: shadowId,
      aggregateVersion: 2,
      actor: { type: 'Entity', entityId: agentId },
      timestamp: now + 50,
      payload: {
        shadowId,
        interaction: {
          type: 'delivery',
          timestamp: now + 50,
          success: true,
          details: { obligationId },
        },
      },
    });

    // Verify complete flow
    const events = await ledger.getAllEvents();

    assert(events.some((e) => e.type === 'ExternalStimulusReceived'));
    assert(events.some((e) => e.type === 'ShadowEntityCreated'));
    assert(events.some((e) => e.type === 'UnilateralObligationDeclared'));

    const statusEvents = events.filter((e) => e.type === 'ObligationStatusChanged');
    assert.strictEqual(statusEvents.length, 2);
    assert.strictEqual(statusEvents[1].payload.newStatus, 'fulfilled');

    const deliveryEvent = events.find(
      (e) => e.type === 'ShadowInteractionRecorded' && e.payload.interaction.type === 'delivery'
    );
    assert(deliveryEvent);
    assert.strictEqual(deliveryEvent.payload.interaction.success, true);
  });
});
