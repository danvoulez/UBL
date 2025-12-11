/**
 * ECONOMICS SERVICE
 *
 * "You will have resources."
 *
 * Manages the economic layer of the Agent Economy:
 * - Wallets and balances
 * - Credit transfers
 * - Starter loans
 * - Loan repayments
 * - Transaction history
 * - Budget tracking
 */

import type { EntityId, Quantity } from '../shared/types';
import type { Wallet, StarterLoan, Transaction } from '../schema/agent-economy';
import type { EventStore } from '../store';

// ============================================================================
// ECONOMICS SERVICE INTERFACE
// ============================================================================

export interface EconomicsService {
  /**
   * Get wallet for an entity
   */
  getWallet(walletId: EntityId): Promise<Wallet | undefined>;

  /**
   * Get all wallets owned by an entity
   */
  getWalletsByOwner(ownerId: EntityId): Promise<readonly Wallet[]>;

  /**
   * Get wallet balance
   */
  getBalance(walletId: EntityId): Promise<bigint>;

  /**
   * Check if wallet has sufficient balance
   */
  hasSufficientBalance(walletId: EntityId, amount: bigint): Promise<boolean>;

  /**
   * Execute a transaction
   */
  transfer(params: {
    fromWalletId: EntityId;
    toWalletId: EntityId;
    amount: Quantity;
    purpose: string;
    agreementId?: EntityId;
  }): Promise<Transaction>;

  /**
   * Get loan for an entity
   */
  getLoan(loanId: EntityId): Promise<StarterLoan | undefined>;

  /**
   * Get active loan for a borrower
   */
  getActiveLoan(borrowerId: EntityId): Promise<StarterLoan | undefined>;

  /**
   * Calculate loan repayment amount based on earnings
   */
  calculateRepayment(loanId: EntityId, earnings: Quantity): Promise<Quantity>;

  /**
   * Process loan repayment
   */
  repayLoan(params: {
    loanId: EntityId;
    amount: Quantity;
  }): Promise<{
    repayment: Quantity;
    remainingBalance: Quantity;
    status: 'Active' | 'Repaid';
  }>;

  /**
   * Get transaction history for a wallet
   */
  getTransactionHistory(walletId: EntityId, limit?: number): Promise<readonly Transaction[]>;

  /**
   * Calculate total earnings for an entity
   */
  getTotalEarnings(entityId: EntityId, since?: Date): Promise<Quantity>;

  /**
   * Calculate total spending for an entity
   */
  getTotalSpending(entityId: EntityId, since?: Date): Promise<Quantity>;

  /**
   * Get economic summary for an entity
   */
  getEconomicSummary(entityId: EntityId): Promise<EconomicSummary>;
}

// ============================================================================
// TYPES
// ============================================================================

export interface EconomicSummary {
  wallets: readonly {
    id: EntityId;
    currency: string;
    balance: bigint;
  }[];

  totalEarnings: Quantity;
  totalSpending: Quantity;
  netIncome: Quantity;

  activeLoan?: {
    id: EntityId;
    principal: Quantity;
    paidAmount: Quantity;
    remainingBalance: Quantity;
    repaymentRate: number;
  };

  monthlyRecurringCosts: Quantity;

  profitability: 'Profitable' | 'Breaking Even' | 'Losing Money';
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class DefaultEconomicsService implements EconomicsService {
  constructor(private eventStore: EventStore) {}

  async getWallet(walletId: EntityId): Promise<Wallet | undefined> {
    const events = await (this.eventStore as any).query({
      aggregateId: walletId,
      types: ['WalletCreated'],
    });

    if (events.length === 0) return undefined;

    const createEvent = events[0];
    const wallet = createEvent.payload.wallet;

    // Get current balance by replaying transactions
    const balance = await this.calculateBalance(walletId);

    return {
      ...wallet,
      balance,
    };
  }

  async getWalletsByOwner(ownerId: EntityId): Promise<readonly Wallet[]> {
    // Query all WalletCreated events
    const events = await (this.eventStore as any).query({
      types: ['WalletCreated'],
    });

    const ownerWallets = events.filter((e: any) => e.payload.wallet.ownerId === ownerId);

    const wallets = await Promise.all(
      ownerWallets.map(async (e: any) => {
        const walletId = e.payload.wallet.id;
        const balance = await this.calculateBalance(walletId);
        return {
          ...e.payload.wallet,
          balance,
        };
      })
    );

    return wallets;
  }

  async getBalance(walletId: EntityId): Promise<bigint> {
    return this.calculateBalance(walletId);
  }

  async hasSufficientBalance(walletId: EntityId, amount: bigint): Promise<boolean> {
    const balance = await this.getBalance(walletId);
    return balance >= amount;
  }

  async transfer(params: {
    fromWalletId: EntityId;
    toWalletId: EntityId;
    amount: Quantity;
    purpose: string;
    agreementId?: EntityId;
  }): Promise<Transaction> {
    const { fromWalletId, toWalletId, amount, purpose, agreementId } = params;

    // Check sufficient balance
    const amountInSmallestUnit = this.toSmallestUnit(amount);
    const hasFunds = await this.hasSufficientBalance(fromWalletId, amountInSmallestUnit);

    if (!hasFunds) {
      throw new Error(`Insufficient balance in wallet ${fromWalletId}`);
    }

    const transaction: Transaction = {
      id: this.generateId(),
      timestamp: Date.now(),
      fromWalletId,
      toWalletId,
      amount,
      purpose,
      agreementId,
      status: 'Completed',
    };

    // Record transaction event
    await (this.eventStore as any).append({
      type: 'TransactionExecuted',
      aggregateType: 'Asset',
      aggregateId: transaction.id,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'economics-service' },
      timestamp: Date.now(),
      payload: { transaction },
    });

    return transaction;
  }

  async getLoan(loanId: EntityId): Promise<StarterLoan | undefined> {
    const events = await (this.eventStore as any).query({
      aggregateId: loanId,
      types: ['LoanDisbursed'],
    });

    if (events.length === 0) return undefined;

    const loanEvent = events[0];
    return loanEvent.payload.loan;
  }

  async getActiveLoan(borrowerId: EntityId): Promise<StarterLoan | undefined> {
    // Query all LoanDisbursed events
    const events = await (this.eventStore as any).query({
      types: ['LoanDisbursed'],
    });

    const borrowerLoans = events.filter((e: any) => e.payload.loan.borrowerId === borrowerId && e.payload.loan.status === 'Active');

    if (borrowerLoans.length === 0) return undefined;

    // Get most recent active loan
    const latestLoan = borrowerLoans[borrowerLoans.length - 1];

    // Update with repayment history
    return this.updateLoanWithRepayments(latestLoan.payload.loan);
  }

  async calculateRepayment(loanId: EntityId, earnings: Quantity): Promise<Quantity> {
    const loan = await this.getLoan(loanId);
    if (!loan) throw new Error(`Loan ${loanId} not found`);

    const repaymentAmount = earnings.amount * loan.repaymentRate;

    return {
      amount: repaymentAmount,
      unit: earnings.unit,
    };
  }

  async repayLoan(params: {
    loanId: EntityId;
    amount: Quantity;
  }): Promise<{
    repayment: Quantity;
    remainingBalance: Quantity;
    status: 'Active' | 'Repaid';
  }> {
    const { loanId, amount } = params;
    const loan = await this.getLoan(loanId);
    if (!loan) throw new Error(`Loan ${loanId} not found`);

    const newPaidAmount = loan.paidAmount.amount + amount.amount;
    const remainingBalance = loan.principal.amount - newPaidAmount;
    const status = remainingBalance <= 0 ? 'Repaid' : 'Active';

    const remainingBalanceQuantity: Quantity = {
      amount: Math.max(0, remainingBalance),
      unit: loan.principal.unit,
    };

    // Record repayment event
    await (this.eventStore as any).append({
      type: 'LoanRepayment',
      aggregateType: 'Asset',
      aggregateId: loanId,
      aggregateVersion: 1, // TODO: Get actual version
      actor: { type: 'System', systemId: 'economics-service' },
      timestamp: Date.now(),
      payload: {
        loanId,
        amount,
        remainingBalance: remainingBalanceQuantity,
      },
    });

    return {
      repayment: amount,
      remainingBalance: remainingBalanceQuantity,
      status,
    };
  }

  async getTransactionHistory(walletId: EntityId, limit: number = 100): Promise<readonly Transaction[]> {
    const events = await (this.eventStore as any).query({
      types: ['TransactionExecuted'],
      limit,
    });

    const walletTransactions = events.filter(
      (e: any) => e.payload.transaction.fromWalletId === walletId || e.payload.transaction.toWalletId === walletId
    );

    return walletTransactions.map((e: any) => e.payload.transaction);
  }

  async getTotalEarnings(entityId: EntityId, since?: Date): Promise<Quantity> {
    // Get all wallets for this entity
    const wallets = await this.getWalletsByOwner(entityId);
    const walletIds = wallets.map((w) => w.id);

    // Get all incoming transactions
    const events = await (this.eventStore as any).query({
      types: ['TransactionExecuted'],
    });

    const incomingTransactions = events.filter((e: any) => {
      const tx = e.payload.transaction;
      const isIncoming = walletIds.includes(tx.toWalletId);
      const isAfterSince = !since || tx.timestamp >= since.getTime();
      return isIncoming && isAfterSince;
    });

    const total = incomingTransactions.reduce((sum: number, e: any) => {
      return sum + e.payload.transaction.amount.amount;
    }, 0);

    return {
      amount: total,
      unit: 'UBL',
    };
  }

  async getTotalSpending(entityId: EntityId, since?: Date): Promise<Quantity> {
    const wallets = await this.getWalletsByOwner(entityId);
    const walletIds = wallets.map((w) => w.id);

    const events = await (this.eventStore as any).query({
      types: ['TransactionExecuted'],
    });

    const outgoingTransactions = events.filter((e: any) => {
      const tx = e.payload.transaction;
      const isOutgoing = walletIds.includes(tx.fromWalletId);
      const isAfterSince = !since || tx.timestamp >= since.getTime();
      return isOutgoing && isAfterSince;
    });

    const total = outgoingTransactions.reduce((sum: number, e: any) => {
      return sum + e.payload.transaction.amount.amount;
    }, 0);

    return {
      amount: total,
      unit: 'UBL',
    };
  }

  async getEconomicSummary(entityId: EntityId): Promise<EconomicSummary> {
    const wallets = await this.getWalletsByOwner(entityId);
    const totalEarnings = await this.getTotalEarnings(entityId);
    const totalSpending = await this.getTotalSpending(entityId);
    const netIncome: Quantity = {
      amount: totalEarnings.amount - totalSpending.amount,
      unit: totalEarnings.unit,
    };

    const activeLoan = await this.getActiveLoan(entityId);

    let profitability: 'Profitable' | 'Breaking Even' | 'Losing Money';
    if (netIncome.amount > 0) profitability = 'Profitable';
    else if (netIncome.amount === 0) profitability = 'Breaking Even';
    else profitability = 'Losing Money';

    return {
      wallets: wallets.map((w) => ({
        id: w.id,
        currency: w.currency,
        balance: w.balance,
      })),
      totalEarnings,
      totalSpending,
      netIncome,
      activeLoan: activeLoan
        ? {
            id: activeLoan.id,
            principal: activeLoan.principal,
            paidAmount: activeLoan.paidAmount,
            remainingBalance: {
              amount: activeLoan.principal.amount - activeLoan.paidAmount.amount,
              unit: activeLoan.principal.unit,
            },
            repaymentRate: activeLoan.repaymentRate,
          }
        : undefined,
      monthlyRecurringCosts: { amount: 0, unit: 'UBL' }, // TODO: Calculate from watchers and daemons
      profitability,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async calculateBalance(walletId: EntityId): Promise<bigint> {
    // Get initial balance from WalletCreated event
    const createEvents = await (this.eventStore as any).query({
      aggregateId: walletId,
      types: ['WalletCreated'],
    });

    if (createEvents.length === 0) return 0n;

    let balance = BigInt(createEvents[0].payload.initialBalance || 0);

    // Apply all transactions
    const txEvents = await (this.eventStore as any).query({
      types: ['TransactionExecuted'],
    });

    for (const event of txEvents) {
      const tx = event.payload.transaction;

      // Incoming
      if (tx.toWalletId === walletId && tx.status === 'Completed') {
        balance += this.toSmallestUnit(tx.amount);
      }

      // Outgoing
      if (tx.fromWalletId === walletId && tx.status === 'Completed') {
        balance -= this.toSmallestUnit(tx.amount);
      }
    }

    return balance;
  }

  private async updateLoanWithRepayments(loan: StarterLoan): Promise<StarterLoan> {
    // Get all repayment events for this loan
    const events = await (this.eventStore as any).query({
      aggregateId: loan.id,
      types: ['LoanRepayment'],
    });

    if (events.length === 0) return loan;

    // Sum all repayments
    const totalPaid = events.reduce((sum: number, e: any) => {
      return sum + e.payload.amount.amount;
    }, loan.paidAmount.amount);

    const remainingBalance = loan.principal.amount - totalPaid;

    return {
      ...loan,
      paidAmount: {
        amount: totalPaid,
        unit: loan.principal.unit,
      },
      status: remainingBalance <= 0 ? 'Repaid' : 'Active',
    };
  }

  private toSmallestUnit(amount: Quantity): bigint {
    // UBL has 3 decimals (milli-credits)
    // 1 UBL = 1000 milli-credits
    const multiplier = amount.unit === 'UBL' ? 1000 : 1;
    return BigInt(Math.floor(amount.amount * multiplier));
  }

  private generateId(): EntityId {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `txn-${timestamp}-${random}` as EntityId;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createEconomicsService(eventStore: EventStore): EconomicsService {
  return new DefaultEconomicsService(eventStore);
}
