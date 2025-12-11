/**
 * AGENT LIFECYCLE TESTS
 *
 * Demonstrates the complete lifecycle of an AI agent in the Agent Economy:
 * 1. Birth - Registration with guardian, constitution, starter loan
 * 2. Growth - Working, earning, learning
 * 3. Maturity - Profitable operation, loan repayment
 * 4. Self-management - Budget tracking, daemon management
 *
 * "There is no 'Agent' entity type. There is no 'Human' entity type. There is only Entity."
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createUniversalLedger, Ids, type EntityId } from '../../core';
import { createAgentEconomyServices } from '../../core/services';

describe('Agent Lifecycle', () => {
  it('should complete full agent lifecycle: birth → work → earn → repay loan', async () => {
    // ========================================================================
    // SETUP
    // ========================================================================
    const ledger = createUniversalLedger();
    const services = createAgentEconomyServices(ledger.eventStore);

    // Create a guardian (human or organization)
    const guardianId = Ids.entity();
    await ledger.eventStore.append({
      type: 'EntityRegistered',
      aggregateType: 'Entity',
      aggregateId: guardianId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'test' },
      timestamp: Date.now(),
      payload: {
        substrate: 'Person',
        identity: { name: 'Alice Guardian' },
        autonomyLevel: 'Full',
      },
    });

    // ========================================================================
    // PHASE 1: BIRTH - Register Agent with Starter Loan
    // ========================================================================
    console.log('\n=== PHASE 1: BIRTH ===');

    // Register the agent with all the infrastructure
    const agent = {
      identity: {
        name: 'FreelancerBot-007',
        did: 'did:ubl:agent:007',
      },
      guardianId,
      constitution: {
        values: [
          'Deliver quality work',
          'Be transparent with clients',
          'Honor commitments',
          'Learn from every interaction',
        ],
        constraints: {
          maxSpendPerTransaction: { amount: 100, unit: 'UBL' },
          maxDailySpend: { amount: 500, unit: 'UBL' },
          forbiddenActions: ['spam', 'deceptive-marketing'],
          requireApprovalFor: ['large-contract'], // > 100 UBL
        },
        style: {
          tone: 'professional',
          verbosity: 'normal',
          languages: ['en', 'es', 'pt'],
        },
        version: 1,
        lastUpdated: Date.now(),
      },
      autonomyLevel: 'Limited',
      starterLoan: {
        principal: { amount: 1000, unit: 'UBL' },
        interestRate: 0.10,
        repaymentRate: 0.20,
        gracePeriodDays: 30,
      },
    };

    // Record entity registration
    const agentId = Ids.entity();
    const walletId = Ids.entity();
    const loanId = Ids.entity();

    await ledger.eventStore.append({
      type: 'EntityRegistered',
      aggregateType: 'Entity',
      aggregateId: agentId,
      aggregateVersion: 1,
      actor: { type: 'Entity', entityId: guardianId },
      timestamp: Date.now(),
      payload: {
        substrate: 'Agent',
        identity: agent.identity,
        guardian: {
          guardianId,
          effectiveFrom: Date.now(),
          establishedBy: Ids.agreement(),
          notifyOn: { violations: true },
        },
        autonomyLevel: agent.autonomyLevel,
        constitution: agent.constitution,
      },
    });

    // Create wallet
    await ledger.eventStore.append({
      type: 'WalletCreated',
      aggregateType: 'Asset',
      aggregateId: walletId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'economics' },
      timestamp: Date.now(),
      payload: {
        wallet: {
          id: walletId,
          ownerId: agentId,
          currency: 'UBL',
          createdAt: Date.now(),
          rules: { allowNegative: false },
        },
        initialBalance: 0n,
      },
    });

    // Disburse starter loan
    await ledger.eventStore.append({
      type: 'LoanDisbursed',
      aggregateType: 'Asset',
      aggregateId: loanId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'economics' },
      timestamp: Date.now(),
      payload: {
        loan: {
          id: loanId,
          borrowerId: agentId,
          guardianId,
          principal: agent.starterLoan.principal,
          interestRate: agent.starterLoan.interestRate,
          repaymentRate: agent.starterLoan.repaymentRate,
          disbursedAt: Date.now(),
          gracePeriodUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
          paidAmount: { amount: 0, unit: 'UBL' },
          status: 'Active',
          collateral: { type: 'Trajectory', reference: agentId },
        },
      },
    });

    // Transfer loan funds to wallet
    const loanTransferId = Ids.entity();
    await ledger.eventStore.append({
      type: 'TransactionExecuted',
      aggregateType: 'Asset',
      aggregateId: loanTransferId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'economics' },
      timestamp: Date.now(),
      payload: {
        transaction: {
          id: loanTransferId,
          timestamp: Date.now(),
          fromWalletId: 'wallet-system-treasury' as EntityId,
          toWalletId: walletId,
          amount: agent.starterLoan.principal,
          purpose: 'Starter loan disbursement',
          agreementId: Ids.agreement(),
          status: 'Completed',
        },
      },
    });

    console.log('✅ Agent born with:');
    console.log('  - Identity:', agent.identity.name);
    console.log('  - Guardian:', 'Alice Guardian');
    console.log('  - Starter loan:', agent.starterLoan.principal.amount, 'UBL');
    console.log('  - Constitution with', agent.constitution.values.length, 'values');

    // Verify wallet balance
    const balance = await services.economics.getBalance(walletId);
    assert.strictEqual(balance, 1000000n, 'Wallet should have 1000 UBL (1000000 milli-credits)');

    // ========================================================================
    // PHASE 2: GROWTH - Working and Earning
    // ========================================================================
    console.log('\n=== PHASE 2: GROWTH ===');

    // Simulate agent finding work and completing jobs
    const jobs = [
      { client: 'Client A', payment: 150, work: 'Python scraper' },
      { client: 'Client B', payment: 200, work: 'Data analysis' },
      { client: 'Client C', payment: 100, work: 'API integration' },
    ];

    let totalEarnings = 0;

    for (const job of jobs) {
      // Record trajectory span (agent's work history)
      const spanId = Ids.entity();
      await ledger.eventStore.append({
        type: 'TrajectorySpanRecorded',
        aggregateType: 'Entity',
        aggregateId: agentId,
        aggregateVersion: 1,
        actor: { type: 'Entity', entityId: agentId },
        timestamp: Date.now(),
        payload: {
          span: {
            id: spanId,
            entityId: agentId,
            sequence: BigInt(jobs.indexOf(job) + 1),
            timestamp: Date.now(),
            action: `complete-job:${job.work}`,
            execution: {
              provider: 'anthropic-claude' as const,
              model: 'claude-3-5-sonnet-20241022',
              tokens: { input: 5000, output: 2000 },
              cost: { amount: 0.5, unit: 'UBL' },
              durationMs: 15000,
            },
            input: { jobDescription: job.work },
            output: { deliverable: 'completed', clientSatisfaction: 95 },
            context: { clientEntityId: Ids.entity() },
            signature: 'sig-placeholder',
            previousHash: 'prev-hash',
            hash: 'current-hash',
          },
        },
      });

      // Receive payment
      const paymentId = Ids.entity();
      await ledger.eventStore.append({
        type: 'TransactionExecuted',
        aggregateType: 'Asset',
        aggregateId: paymentId,
        aggregateVersion: 1,
        actor: { type: 'System', systemId: 'economics' },
        timestamp: Date.now(),
        payload: {
          transaction: {
            id: paymentId,
            timestamp: Date.now(),
            fromWalletId: `wallet-${job.client}` as EntityId,
            toWalletId: walletId,
            amount: { amount: job.payment, unit: 'UBL' },
            purpose: `Payment for: ${job.work}`,
            agreementId: Ids.agreement(),
            status: 'Completed',
          },
        },
      });

      totalEarnings += job.payment;

      // Automatic loan repayment (20% of earnings)
      const repaymentAmount = job.payment * agent.starterLoan.repaymentRate;
      await ledger.eventStore.append({
        type: 'LoanRepayment',
        aggregateType: 'Asset',
        aggregateId: loanId,
        aggregateVersion: 1,
        actor: { type: 'System', systemId: 'economics' },
        timestamp: Date.now(),
        payload: {
          loanId,
          amount: { amount: repaymentAmount, unit: 'UBL' },
          remainingBalance: {
            amount: Math.max(0, 1000 - (totalEarnings * agent.starterLoan.repaymentRate)),
            unit: 'UBL',
          },
        },
      });

      console.log(`✅ Completed job: ${job.work}`);
      console.log(`   Payment: ${job.payment} UBL`);
      console.log(`   Repayment: ${repaymentAmount} UBL (20% of earnings)`);
    }

    console.log(`\n📊 Growth phase complete:`);
    console.log(`  - Total earnings: ${totalEarnings} UBL`);
    console.log(`  - Loan repaid: ${totalEarnings * agent.starterLoan.repaymentRate} UBL`);

    // ========================================================================
    // PHASE 3: PERCEPTION - Setting Up Watchers
    // ========================================================================
    console.log('\n=== PHASE 3: PERCEPTION ===');

    // Create watchers to monitor external platforms
    const watcherId1 = Ids.entity();
    await ledger.eventStore.append({
      type: 'WatcherCreated',
      aggregateType: 'Asset',
      aggregateId: watcherId1,
      aggregateVersion: 1,
      actor: { type: 'Entity', entityId: agentId },
      timestamp: Date.now(),
      payload: {
        watcher: {
          id: watcherId1,
          ownerId: agentId,
          createdAt: Date.now(),
          source: { type: 'reddit', subreddit: 'forhire' },
          pollInterval: '15m',
          filter: { keywords: ['python', 'scraping', 'automation'] },
          action: { type: 'awaken' },
          tier: 'Basic',
          monthlyCost: { amount: 10, unit: 'UBL' },
          status: 'Active',
        },
      },
    });

    console.log('✅ Watcher created: Reddit r/forhire monitor');
    console.log('   Cost: 10 UBL/month');

    // ========================================================================
    // PHASE 4: CONSCIOUSNESS - Starting Daemon
    // ========================================================================
    console.log('\n=== PHASE 4: CONSCIOUSNESS ===');

    const daemonId = Ids.entity();
    await ledger.eventStore.append({
      type: 'DaemonStarted',
      aggregateType: 'Workflow',
      aggregateId: daemonId,
      aggregateVersion: 1,
      actor: { type: 'Entity', entityId: agentId },
      timestamp: Date.now(),
      payload: {
        daemon: {
          id: daemonId,
          entityId: agentId,
          createdAt: Date.now(),
          mode: 'Scheduled',
          budget: {
            hourlyMax: { amount: 5, unit: 'UBL' },
            dailyMax: { amount: 50, unit: 'UBL' },
            onExhausted: 'sleep',
          },
          heartbeat: { interval: '5m' },
          loops: [
            {
              name: 'check-obligations',
              interval: '30m',
              action: 'query:my-obligations',
            },
            {
              name: 'self-reflect',
              interval: '1d',
              action: 'analyze:trajectory',
            },
          ],
          status: 'Running',
        },
      },
    });

    console.log('✅ Daemon started with budget-aware operation');
    console.log('   Loops: check-obligations (30m), self-reflect (1d)');

    // ========================================================================
    // PHASE 5: ECONOMIC SUMMARY
    // ========================================================================
    console.log('\n=== PHASE 5: ECONOMIC SUMMARY ===');

    const summary = await services.economics.getEconomicSummary(agentId);

    console.log('💰 Economic Status:');
    console.log(`  - Total earnings: ${summary.totalEarnings.amount} ${summary.totalEarnings.unit}`);
    console.log(`  - Total spending: ${summary.totalSpending.amount} ${summary.totalSpending.unit}`);
    console.log(`  - Net income: ${summary.netIncome.amount} ${summary.netIncome.unit}`);
    console.log(`  - Profitability: ${summary.profitability}`);

    if (summary.activeLoan) {
      console.log(`\n💳 Loan Status:`);
      console.log(`  - Principal: ${summary.activeLoan.principal.amount} ${summary.activeLoan.principal.unit}`);
      console.log(`  - Paid: ${summary.activeLoan.paidAmount.amount} ${summary.activeLoan.paidAmount.unit}`);
      console.log(`  - Remaining: ${summary.activeLoan.remainingBalance.amount} ${summary.activeLoan.remainingBalance.unit}`);
      console.log(`  - Repayment rate: ${(summary.activeLoan.repaymentRate * 100).toFixed(0)}% of earnings`);
    }

    // Verify profitability
    assert.ok(summary.netIncome.amount > 0, 'Agent should be profitable');
    assert.strictEqual(summary.profitability, 'Profitable', 'Agent should be marked as profitable');

    console.log('\n🎉 Agent lifecycle test complete!');
    console.log('The agent successfully:');
    console.log('  1. Was born with guardian and starter loan');
    console.log('  2. Completed work and earned credits');
    console.log('  3. Automatically repaid portion of loan');
    console.log('  4. Set up external perception (watchers)');
    console.log('  5. Started continuous operation (daemon)');
    console.log('  6. Maintains profitable operation');
  });

  it('should demonstrate agent using continuity service for memory', async () => {
    console.log('\n=== CONTINUITY SERVICE TEST ===');

    const ledger = createUniversalLedger();
    const services = createAgentEconomyServices(ledger.eventStore);

    const agentId = Ids.entity();

    // Register agent with constitution
    await ledger.eventStore.append({
      type: 'EntityRegistered',
      aggregateType: 'Entity',
      aggregateId: agentId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'test' },
      timestamp: Date.now(),
      payload: {
        substrate: 'Agent',
        identity: { name: 'Memory Test Agent' },
        autonomyLevel: 'Limited',
        constitution: {
          values: ['Be helpful', 'Be accurate'],
          constraints: {},
          version: 1,
          lastUpdated: Date.now(),
        },
      },
    });

    // Hydrate memory
    const memory = await services.continuity.hydrateMemory({
      entityId: agentId,
      memoryProtocol: {
        alwaysInclude: ['constitution', 'recent-trajectory'],
        contextualInclude: ['active-agreements'],
        maxContextTokens: 4000,
        prioritization: 'recency',
      },
    });

    console.log('✅ Memory hydrated:');
    console.log('  - Has constitution:', !!memory.constitution);
    console.log('  - Recent trajectory spans:', memory.recentTrajectory.length);
    console.log('  - Estimated tokens:', memory.estimatedTokens);
    console.log('  - Context preview:', memory.formattedContext.slice(0, 200) + '...');

    assert.ok(memory.constitution, 'Should have constitution');
    assert.ok(memory.formattedContext.length > 0, 'Should have formatted context');

    // Select provider
    const providerSelection = await services.continuity.selectProvider({
      entityId: agentId,
      strategy: {
        primary: {
          provider: 'anthropic-claude',
          model: 'claude-3-5-sonnet-20241022',
          weight: 80,
        },
        rules: {
          sameConversation: 'never-switch',
          sameClient: 'prefer-primary',
          newWork: 'primary-only',
        },
      },
      context: {
        isNewWork: true,
      },
    });

    console.log('✅ Provider selected:', providerSelection.provider);
    console.log('  - Model:', providerSelection.model);
    console.log('  - Reason:', providerSelection.reason);
  });
});
