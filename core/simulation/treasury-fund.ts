/**
 * TREASURY STABILIZATION FUND
 * 
 * A mechanism to inject liquidity during crises and stabilize the economy.
 * 
 * Features:
 * - Automatic intervention when crisis conditions detected
 * - Emergency loans to struggling scripts
 * - UBI distribution during severe downturns
 * - Gradual fund replenishment during good times
 */

import type { SimulationTick } from './simulation-clock';
import type { SimulatedScript } from './agent-population';
import type { MarketState } from './market-dynamics';

// =============================================================================
// TREASURY STATE
// =============================================================================

export interface TreasuryState {
  /** Current fund balance */
  balance: bigint;
  
  /** Total distributed since start */
  totalDistributed: bigint;
  
  /** Total collected (taxes/fees) since start */
  totalCollected: bigint;
  
  /** Number of interventions */
  interventionCount: number;
  
  /** Current intervention status */
  isIntervening: boolean;
  
  /** Last intervention day */
  lastInterventionDay: number | null;
}

export interface TreasuryConfig {
  /** Initial fund balance */
  initialBalance: bigint;
  
  /** Minimum balance before fund is depleted */
  minimumBalance: bigint;
  
  /** Tax rate on earnings during good times (0-1) */
  prosperityTaxRate: number;
  
  /** Sentiment threshold to trigger intervention */
  crisisSentimentThreshold: number;
  
  /** Unemployment threshold to trigger intervention */
  crisisUnemploymentThreshold: number;
  
  /** Maximum per-script emergency distribution */
  maxEmergencyDistribution: bigint;
  
  /** Cooldown between interventions (days) */
  interventionCooldown: number;
}

const DEFAULT_TREASURY_CONFIG: TreasuryConfig = {
  initialBalance: 10_000_000n,
  minimumBalance: 1_000_000n,
  prosperityTaxRate: 0.02,        // 2% tax during good times
  crisisSentimentThreshold: -0.3,
  crisisUnemploymentThreshold: 0.08,
  maxEmergencyDistribution: 500n,
  interventionCooldown: 30,       // 30 days between interventions
};

// =============================================================================
// INTERVENTION TYPES
// =============================================================================

export type InterventionType = 
  | 'EmergencyUBI'      // Direct distribution to all scripts
  | 'TargetedBailout'   // Help only struggling scripts
  | 'LoanForgiveness'   // Reduce outstanding loans
  | 'SentimentBoost';   // Market confidence injection

export interface InterventionRecord {
  day: number;
  type: InterventionType;
  amount: bigint;
  scriptsHelped: number;
  reason: string;
}

// =============================================================================
// TREASURY FUND
// =============================================================================

export class TreasuryStabilizationFund {
  private state: TreasuryState;
  private config: TreasuryConfig;
  private interventionHistory: InterventionRecord[] = [];
  
  constructor(config: Partial<TreasuryConfig> = {}) {
    this.config = { ...DEFAULT_TREASURY_CONFIG, ...config };
    this.state = {
      balance: this.config.initialBalance,
      totalDistributed: 0n,
      totalCollected: 0n,
      interventionCount: 0,
      isIntervening: false,
      lastInterventionDay: null,
    };
  }
  
  // ---------------------------------------------------------------------------
  // MAIN PROCESSING
  // ---------------------------------------------------------------------------
  
  processTick(
    tick: SimulationTick,
    scripts: SimulatedScript[],
    market: MarketState
  ): TreasuryAction[] {
    const actions: TreasuryAction[] = [];
    const day = tick.simulatedDay;
    
    // 1. Check if we should intervene
    const crisisLevel = this.assessCrisisLevel(market, scripts);
    
    if (crisisLevel !== 'None' && this.canIntervene(day)) {
      const intervention = this.executeIntervention(day, crisisLevel, scripts, market);
      if (intervention) {
        actions.push(intervention);
      }
    }
    
    // 2. Collect taxes during prosperity
    if (market.cyclePhase === 'Expansion' && market.sentiment > 0.3) {
      const taxCollected = this.collectProsperityTax(scripts);
      if (taxCollected > 0n) {
        actions.push({
          type: 'TaxCollection',
          amount: taxCollected,
          scriptsAffected: scripts.filter(s => s.state.isActive).length,
          description: `Collected ${taxCollected} in prosperity tax`,
        });
      }
    }
    
    return actions;
  }
  
  // ---------------------------------------------------------------------------
  // CRISIS ASSESSMENT
  // ---------------------------------------------------------------------------
  
  private assessCrisisLevel(
    market: MarketState,
    scripts: SimulatedScript[]
  ): 'None' | 'Mild' | 'Moderate' | 'Severe' | 'Critical' {
    const activeScripts = scripts.filter(s => s.state.isActive);
    const totalScripts = scripts.length;
    const survivalRate = activeScripts.length / totalScripts;
    
    // Calculate average balance
    const avgBalance = activeScripts.length > 0
      ? Number(activeScripts.reduce((sum, s) => sum + s.state.walletBalance, 0n)) / activeScripts.length
      : 0;
    
    // Count scripts in distress (negative balance or high debt)
    const distressedScripts = activeScripts.filter(s => 
      Number(s.state.walletBalance) < 100 || 
      Number(s.state.loanOutstanding) > Number(s.state.walletBalance) * 2
    ).length;
    const distressRate = distressedScripts / Math.max(1, activeScripts.length);
    
    // Assess based on multiple factors
    let score = 0;
    
    // Sentiment factor
    if (market.sentiment < this.config.crisisSentimentThreshold) {
      score += 2;
      if (market.sentiment < -0.5) score += 1;
      if (market.sentiment < -0.7) score += 1;
    }
    
    // Unemployment factor
    if (market.unemploymentRate > this.config.crisisUnemploymentThreshold) {
      score += 1;
      if (market.unemploymentRate > 0.12) score += 1;
    }
    
    // Survival rate factor
    if (survivalRate < 0.7) score += 1;
    if (survivalRate < 0.5) score += 2;
    if (survivalRate < 0.3) score += 2;
    
    // Distress rate factor
    if (distressRate > 0.3) score += 1;
    if (distressRate > 0.5) score += 2;
    
    // Average balance factor
    if (avgBalance < 200) score += 1;
    if (avgBalance < 50) score += 2;
    
    // Map score to crisis level
    if (score >= 8) return 'Critical';
    if (score >= 5) return 'Severe';
    if (score >= 3) return 'Moderate';
    if (score >= 1) return 'Mild';
    return 'None';
  }
  
  private canIntervene(day: number): boolean {
    // Check fund balance
    if (this.state.balance <= this.config.minimumBalance) {
      return false;
    }
    
    // Check cooldown
    if (this.state.lastInterventionDay !== null) {
      const daysSinceLastIntervention = day - this.state.lastInterventionDay;
      if (daysSinceLastIntervention < this.config.interventionCooldown) {
        return false;
      }
    }
    
    return true;
  }
  
  // ---------------------------------------------------------------------------
  // INTERVENTIONS
  // ---------------------------------------------------------------------------
  
  private executeIntervention(
    day: number,
    crisisLevel: 'Mild' | 'Moderate' | 'Severe' | 'Critical',
    scripts: SimulatedScript[],
    market: MarketState
  ): TreasuryAction | null {
    const activeScripts = scripts.filter(s => s.state.isActive);
    
    // Determine intervention type and amount based on crisis level
    let interventionType: InterventionType;
    let amountPerScript: bigint;
    let targetScripts: SimulatedScript[];
    
    switch (crisisLevel) {
      case 'Critical':
        // Emergency UBI to everyone
        interventionType = 'EmergencyUBI';
        amountPerScript = this.config.maxEmergencyDistribution;
        targetScripts = activeScripts;
        break;
        
      case 'Severe':
        // Targeted bailout + loan forgiveness
        interventionType = 'TargetedBailout';
        amountPerScript = this.config.maxEmergencyDistribution * 3n / 4n;
        targetScripts = activeScripts.filter(s => 
          Number(s.state.walletBalance) < 200 ||
          Number(s.state.loanOutstanding) > 500
        );
        break;
        
      case 'Moderate':
        // Help only distressed scripts
        interventionType = 'TargetedBailout';
        amountPerScript = this.config.maxEmergencyDistribution / 2n;
        targetScripts = activeScripts.filter(s => 
          Number(s.state.walletBalance) < 100
        );
        break;
        
      case 'Mild':
        // Small boost to struggling scripts
        interventionType = 'TargetedBailout';
        amountPerScript = this.config.maxEmergencyDistribution / 4n;
        targetScripts = activeScripts.filter(s => 
          Number(s.state.walletBalance) < 50
        );
        break;
    }
    
    if (targetScripts.length === 0) {
      return null;
    }
    
    // Calculate total needed
    const totalNeeded = amountPerScript * BigInt(targetScripts.length);
    const availableFunds = this.state.balance - this.config.minimumBalance;
    
    // Adjust if not enough funds
    let actualAmountPerScript = amountPerScript;
    if (totalNeeded > availableFunds) {
      actualAmountPerScript = availableFunds / BigInt(targetScripts.length);
      if (actualAmountPerScript < 10n) {
        return null; // Not worth it
      }
    }
    
    // Execute distribution
    let totalDistributed = 0n;
    for (const script of targetScripts) {
      script.state.walletBalance += actualAmountPerScript;
      totalDistributed += actualAmountPerScript;
      
      // Also reduce loans in severe/critical cases
      if ((crisisLevel === 'Severe' || crisisLevel === 'Critical') && 
          script.state.loanOutstanding > 0n) {
        const loanReduction = script.state.loanOutstanding / 4n;
        script.state.loanOutstanding -= loanReduction;
      }
    }
    
    // Update state
    this.state.balance -= totalDistributed;
    this.state.totalDistributed += totalDistributed;
    this.state.interventionCount++;
    this.state.isIntervening = true;
    this.state.lastInterventionDay = day;
    
    // Record intervention
    const record: InterventionRecord = {
      day,
      type: interventionType,
      amount: totalDistributed,
      scriptsHelped: targetScripts.length,
      reason: `${crisisLevel} crisis - sentiment: ${market.sentiment.toFixed(2)}, unemployment: ${(market.unemploymentRate * 100).toFixed(1)}%`,
    };
    this.interventionHistory.push(record);
    
    console.log(`💰 TREASURY INTERVENTION: ${interventionType}`);
    console.log(`   Crisis Level: ${crisisLevel}`);
    console.log(`   Distributed: ${totalDistributed} to ${targetScripts.length} scripts`);
    console.log(`   Remaining Balance: ${this.state.balance}`);
    
    return {
      type: interventionType,
      amount: totalDistributed,
      scriptsAffected: targetScripts.length,
      description: `${crisisLevel} crisis intervention: ${totalDistributed} distributed`,
    };
  }
  
  // ---------------------------------------------------------------------------
  // TAX COLLECTION
  // ---------------------------------------------------------------------------
  
  private collectProsperityTax(scripts: SimulatedScript[]): bigint {
    const activeScripts = scripts.filter(s => s.state.isActive);
    let totalCollected = 0n;
    
    for (const script of activeScripts) {
      const balance = Number(script.state.walletBalance);
      
      // Only tax scripts with positive balance above threshold
      if (balance > 500) {
        const tax = BigInt(Math.floor(balance * this.config.prosperityTaxRate / 365));
        if (tax > 0n) {
          script.state.walletBalance -= tax;
          totalCollected += tax;
        }
      }
    }
    
    this.state.balance += totalCollected;
    this.state.totalCollected += totalCollected;
    
    return totalCollected;
  }
  
  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------
  
  getState(): TreasuryState {
    return { ...this.state };
  }
  
  getInterventionHistory(): InterventionRecord[] {
    return [...this.interventionHistory];
  }
  
  getFundHealth(): 'Healthy' | 'Low' | 'Critical' | 'Depleted' {
    const ratio = Number(this.state.balance) / Number(this.config.initialBalance);
    if (ratio > 0.5) return 'Healthy';
    if (ratio > 0.2) return 'Low';
    if (ratio > 0) return 'Critical';
    return 'Depleted';
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface TreasuryAction {
  type: InterventionType | 'TaxCollection';
  amount: bigint;
  scriptsAffected: number;
  description: string;
}

// =============================================================================
// FACTORY
// =============================================================================

export function createTreasuryFund(config?: Partial<TreasuryConfig>): TreasuryStabilizationFund {
  return new TreasuryStabilizationFund(config);
}
