/**
 * MARKET DYNAMICS
 * 
 * Realistic market simulation with:
 * - Supply/demand curves
 * - Price discovery
 * - Seasonal patterns
 * - Economic cycles
 * - Contagion effects
 */

import type { Timestamp } from '../shared/types';
import type { SimulationTick } from './simulation-clock';

// =============================================================================
// MARKET STATE
// =============================================================================

export interface MarketState {
  /** Current demand level (0-2, 1 = normal) */
  demand: number;
  
  /** Current supply level (0-2, 1 = normal) */
  supply: number;
  
  /** Price multiplier based on supply/demand */
  priceMultiplier: number;
  
  /** Market sentiment (-1 = panic, 0 = neutral, 1 = euphoria) */
  sentiment: number;
  
  /** Economic cycle phase */
  cyclePhase: 'Expansion' | 'Peak' | 'Contraction' | 'Trough';
  
  /** Days in current phase */
  daysInPhase: number;
  
  /** Unemployment rate (0-1) */
  unemploymentRate: number;
  
  /** Inflation rate (can be negative = deflation) */
  inflationRate: number;
  
  /** Interest rate set by "central bank" */
  interestRate: number;
}

// =============================================================================
// ECONOMIC CYCLES
// =============================================================================

export interface CycleConfig {
  /** Average expansion duration (days) */
  expansionDuration: number;
  
  /** Average contraction duration (days) */
  contractionDuration: number;
  
  /** Volatility of cycle transitions */
  volatility: number;
}

const DEFAULT_CYCLE_CONFIG: CycleConfig = {
  expansionDuration: 270,     // SPRINT 3 FIX: 9 months (was 1 year)
  contractionDuration: 60,    // SPRINT 3 FIX: 2 months (was 3 months)
  volatility: 0.5,            // SPRINT 3 FIX: More volatile (was 0.4)
};

// =============================================================================
// MARKET SIMULATOR
// =============================================================================

export class MarketDynamics {
  private state: MarketState;
  private config: CycleConfig;
  private history: MarketSnapshot[] = [];
  
  constructor(config: Partial<CycleConfig> = {}) {
    this.config = { ...DEFAULT_CYCLE_CONFIG, ...config };
    this.state = this.createInitialState();
  }
  
  private createInitialState(): MarketState {
    return {
      demand: 1.0,
      supply: 1.0,
      priceMultiplier: 1.0,
      sentiment: 0.1, // Slightly optimistic start
      cyclePhase: 'Expansion',
      daysInPhase: 0,
      unemploymentRate: 0.05, // 5% natural unemployment
      inflationRate: 0.02,    // 2% target inflation
      interestRate: 0.05,     // 5% base rate
    };
  }
  
  // ---------------------------------------------------------------------------
  // TICK PROCESSING
  // ---------------------------------------------------------------------------
  
  processTick(tick: SimulationTick): MarketState {
    const day = tick.simulatedDay;
    
    // Update cycle phase
    this.updateCyclePhase(day);
    
    // Apply seasonal effects
    this.applySeasonalEffects(day);
    
    // Update supply/demand
    this.updateSupplyDemand();
    
    // Calculate price
    this.calculatePrice();
    
    // Update macro indicators
    this.updateMacroIndicators();
    
    // Apply random shocks
    this.applyRandomShocks();
    
    // Record history
    if (day % 7 === 0) { // Weekly snapshots
      this.history.push({
        day,
        ...this.state,
      });
    }
    
    return { ...this.state };
  }
  
  // ---------------------------------------------------------------------------
  // CYCLE MANAGEMENT
  // ---------------------------------------------------------------------------
  
  private updateCyclePhase(day: number): void {
    this.state.daysInPhase++;
    
    const shouldTransition = this.checkCycleTransition();
    
    if (shouldTransition) {
      const transitions: Record<MarketState['cyclePhase'], MarketState['cyclePhase']> = {
        'Expansion': 'Peak',
        'Peak': 'Contraction',
        'Contraction': 'Trough',
        'Trough': 'Expansion',
      };
      
      const oldPhase = this.state.cyclePhase;
      this.state.cyclePhase = transitions[oldPhase];
      this.state.daysInPhase = 0;
      
      console.log(`📈 Economic cycle: ${oldPhase} → ${this.state.cyclePhase}`);
    }
  }
  
  private checkCycleTransition(): boolean {
    const { cyclePhase, daysInPhase } = this.state;
    const { expansionDuration, contractionDuration, volatility } = this.config;
    
    let expectedDuration: number;
    
    switch (cyclePhase) {
      case 'Expansion':
        expectedDuration = expansionDuration;
        break;
      case 'Peak':
        expectedDuration = 30; // Short peak
        break;
      case 'Contraction':
        expectedDuration = contractionDuration;
        break;
      case 'Trough':
        expectedDuration = 60; // Short trough
        break;
    }
    
    // Add randomness
    const variance = expectedDuration * volatility;
    const actualDuration = expectedDuration + (Math.random() - 0.5) * 2 * variance;
    
    return daysInPhase >= actualDuration;
  }
  
  // ---------------------------------------------------------------------------
  // SUPPLY/DEMAND
  // ---------------------------------------------------------------------------
  
  private updateSupplyDemand(): void {
    const { cyclePhase, sentiment } = this.state;
    
    // Base adjustments by cycle phase
    const cycleEffects: Record<MarketState['cyclePhase'], { demand: number; supply: number }> = {
      'Expansion': { demand: 0.002, supply: 0.001 },
      'Peak': { demand: 0, supply: 0.002 },
      'Contraction': { demand: -0.003, supply: -0.001 },
      'Trough': { demand: -0.001, supply: -0.002 },
    };
    
    const effect = cycleEffects[cyclePhase];
    
    // Apply with sentiment modifier
    this.state.demand = Math.max(0.3, Math.min(2.0,
      this.state.demand + effect.demand + sentiment * 0.001
    ));
    
    this.state.supply = Math.max(0.3, Math.min(2.0,
      this.state.supply + effect.supply
    ));
  }
  
  private applySeasonalEffects(day: number): void {
    // Day of year (0-364)
    const dayOfYear = day % 365;
    
    // Q4 boost (holiday season)
    if (dayOfYear >= 270 && dayOfYear <= 340) {
      this.state.demand *= 1.001;
    }
    
    // Q1 slump (post-holiday)
    if (dayOfYear >= 0 && dayOfYear <= 60) {
      this.state.demand *= 0.999;
    }
    
    // Summer slowdown
    if (dayOfYear >= 150 && dayOfYear <= 220) {
      this.state.demand *= 0.9995;
    }
  }
  
  // ---------------------------------------------------------------------------
  // PRICE DISCOVERY
  // ---------------------------------------------------------------------------
  
  private calculatePrice(): void {
    const { demand, supply, sentiment, inflationRate } = this.state;
    
    // Basic supply/demand price
    const sdRatio = demand / Math.max(0.1, supply);
    
    // Sentiment premium/discount
    const sentimentFactor = 1 + sentiment * 0.1;
    
    // Inflation adjustment
    const inflationFactor = 1 + inflationRate / 365;
    
    this.state.priceMultiplier = sdRatio * sentimentFactor * inflationFactor;
    
    // Clamp to reasonable range
    this.state.priceMultiplier = Math.max(0.2, Math.min(3.0, this.state.priceMultiplier));
  }
  
  // ---------------------------------------------------------------------------
  // MACRO INDICATORS
  // ---------------------------------------------------------------------------
  
  private updateMacroIndicators(): void {
    const { cyclePhase, demand, supply } = this.state;
    
    // Unemployment follows inverse of demand
    const targetUnemployment = {
      'Expansion': 0.04,
      'Peak': 0.03,
      'Contraction': 0.08,
      'Trough': 0.10,
    }[cyclePhase];
    
    // Gradual adjustment
    this.state.unemploymentRate += (targetUnemployment - this.state.unemploymentRate) * 0.01;
    
    // Inflation follows demand/supply imbalance
    const imbalance = demand - supply;
    this.state.inflationRate += imbalance * 0.001;
    this.state.inflationRate = Math.max(-0.05, Math.min(0.15, this.state.inflationRate));
    
    // Central bank reaction (Taylor rule simplified)
    const targetRate = 0.02 + 1.5 * this.state.inflationRate + 0.5 * (1 - this.state.unemploymentRate / 0.05);
    this.state.interestRate += (targetRate - this.state.interestRate) * 0.02;
    this.state.interestRate = Math.max(0, Math.min(0.20, this.state.interestRate));
    
    // Sentiment follows cycle with lag
    const targetSentiment = {
      'Expansion': 0.5,
      'Peak': 0.8,
      'Contraction': -0.3,
      'Trough': -0.6,
    }[cyclePhase];
    
    this.state.sentiment += (targetSentiment - this.state.sentiment) * 0.02;
    this.state.sentiment += (Math.random() - 0.5) * 0.05; // Daily noise
    this.state.sentiment = Math.max(-1, Math.min(1, this.state.sentiment));
  }
  
  // ---------------------------------------------------------------------------
  // SHOCKS
  // ---------------------------------------------------------------------------
  
  private applyRandomShocks(): void {
    // 0.1% chance of minor shock per day
    if (Math.random() < 0.001) {
      const shockMagnitude = (Math.random() - 0.5) * 0.2;
      this.state.sentiment += shockMagnitude;
      this.state.demand *= 1 + shockMagnitude * 0.5;
    }
  }
  
  /** Apply external shock (from chaos injector) */
  applyShock(type: 'demand' | 'supply' | 'sentiment', magnitude: number): void {
    switch (type) {
      case 'demand':
        this.state.demand *= 1 + magnitude;
        break;
      case 'supply':
        this.state.supply *= 1 + magnitude;
        break;
      case 'sentiment':
        this.state.sentiment += magnitude;
        this.state.sentiment = Math.max(-1, Math.min(1, this.state.sentiment));
        break;
    }
  }
  
  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------
  
  getState(): MarketState {
    return { ...this.state };
  }
  
  getHistory(): MarketSnapshot[] {
    return [...this.history];
  }
  
  /** Get job availability based on market conditions */
  getJobAvailability(): number {
    const { demand, unemploymentRate, cyclePhase } = this.state;
    
    // Base availability from demand
    let availability = demand * 0.8;
    
    // Reduce if high unemployment (competition)
    availability *= 1 - unemploymentRate * 0.5;
    
    // Cycle modifier
    const cycleModifier = {
      'Expansion': 1.2,
      'Peak': 1.0,
      'Contraction': 0.6,
      'Trough': 0.4,
    }[cyclePhase];
    
    return Math.max(0.1, Math.min(1.5, availability * cycleModifier));
  }
  
  /** Get loan difficulty based on interest rates and sentiment */
  getLoanDifficulty(): number {
    const { interestRate, sentiment, cyclePhase } = this.state;
    
    // Higher rates = harder loans
    let difficulty = interestRate * 5;
    
    // Negative sentiment = banks more cautious
    difficulty += (1 - sentiment) * 0.2;
    
    // Cycle modifier
    if (cyclePhase === 'Contraction' || cyclePhase === 'Trough') {
      difficulty *= 1.5;
    }
    
    return Math.max(0.1, Math.min(1.0, difficulty));
  }
}

interface MarketSnapshot extends MarketState {
  day: number;
}

// =============================================================================
// FACTORY
// =============================================================================

export function createMarketDynamics(config?: Partial<CycleConfig>): MarketDynamics {
  return new MarketDynamics(config);
}
