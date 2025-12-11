/**
 * CHAOS INJECTOR
 * 
 * Inject adverse events into the simulation to test system resilience.
 * "What happens when everything goes wrong?"
 */

import type { EntityId, Timestamp, Quantity } from '../shared/types';
import type { SimulationTick } from './simulation-clock';
import type { AgentPopulation, SimulatedScript, SimulatedGuardian } from './agent-population';

// =============================================================================
// CHAOS EVENT TYPES
// =============================================================================

export type ChaosEventType =
  | 'MarketCrash'           // Sudden drop in demand
  | 'ModelRelease'          // New AI model makes old skills obsolete
  | 'CartelFormation'       // Bad actors collude
  | 'TreasuryBug'           // Infinite money glitch
  | 'OracleManipulation'    // Price oracle reports wrong values
  | 'MassDefault'           // Many scripts default at once
  | 'GuardianExit'          // Guardian abandons their scripts
  | 'ReputationInflation'   // Everyone gets perfect scores
  | 'DDoS'                  // System overload
  | 'RegulatoryShock';      // New rules change everything

export interface ChaosEvent {
  type: ChaosEventType;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  triggerAt: number;  // Simulated day
  duration: number;   // Days
  params: Record<string, unknown>;
}

// =============================================================================
// CHAOS SCENARIOS
// =============================================================================

export const CHAOS_SCENARIOS = {
  /** GPT-5 drops, 80% of scripts become obsolete */
  MODEL_RELEASE: {
    type: 'ModelRelease' as const,
    severity: 'Critical' as const,
    duration: 30,
    params: {
      obsolescenceRate: 0.8,
      adaptationWindow: 14, // Days to adapt
      skillDepreciation: 0.5,
    },
  },
  
  /** Market demand drops 60% */
  MARKET_CRASH: {
    type: 'MarketCrash' as const,
    severity: 'High' as const,
    duration: 90,
    params: {
      demandDrop: 0.6,
      recoveryRate: 0.02, // 2% per day
    },
  },
  
  /** 3 guardians form a cartel */
  CARTEL_FORMATION: {
    type: 'CartelFormation' as const,
    severity: 'High' as const,
    duration: 180,
    params: {
      cartelSize: 3,
      marketControlTarget: 0.4,
      reputationInflation: 0.3,
    },
  },
  
  /** Treasury mints 10000x intended amount */
  TREASURY_BUG: {
    type: 'TreasuryBug' as const,
    severity: 'Critical' as const,
    duration: 1,
    params: {
      mintMultiplier: 10000,
      detectionDelay: 0.5, // Days until detected
    },
  },
  
  /** Price oracle reports 0.001x actual prices */
  ORACLE_MANIPULATION: {
    type: 'OracleManipulation' as const,
    severity: 'High' as const,
    duration: 7,
    params: {
      priceMultiplier: 0.001,
      affectedMarkets: ['all'],
    },
  },
  
  /** 30% of scripts default simultaneously */
  MASS_DEFAULT: {
    type: 'MassDefault' as const,
    severity: 'High' as const,
    duration: 1,
    params: {
      defaultRate: 0.3,
      contagionFactor: 0.1, // Additional defaults from panic
    },
  },
  
  /** Top guardian exits, abandoning 50 scripts */
  GUARDIAN_EXIT: {
    type: 'GuardianExit' as const,
    severity: 'Medium' as const,
    duration: 1,
    params: {
      guardiansExiting: 1,
      selectBy: 'largest', // Exit the largest guardian
    },
  },
  
  /** Everyone gets 100 reputation */
  REPUTATION_INFLATION: {
    type: 'ReputationInflation' as const,
    severity: 'Medium' as const,
    duration: 30,
    params: {
      inflatedScore: 100,
      detectionDifficulty: 0.8,
    },
  },
};

// =============================================================================
// CHAOS INJECTOR
// =============================================================================

export interface ChaosInjectorConfig {
  /** Random chaos probability per day */
  randomChaosRate: number;
  
  /** Scheduled chaos events */
  scheduledEvents: ChaosEvent[];
  
  /** Enable/disable specific chaos types */
  enabledTypes: Set<ChaosEventType>;
}

export class ChaosInjector {
  private config: ChaosInjectorConfig;
  private activeEvents: Map<string, ActiveChaosEvent> = new Map();
  private eventHistory: ChaosEventRecord[] = [];
  private eventIdCounter = 0;
  
  constructor(config: Partial<ChaosInjectorConfig> = {}) {
    this.config = {
      randomChaosRate: config.randomChaosRate ?? 0.01, // 1% per day
      scheduledEvents: config.scheduledEvents ?? [],
      enabledTypes: config.enabledTypes ?? new Set(Object.keys(CHAOS_SCENARIOS) as ChaosEventType[]),
    };
  }
  
  // ---------------------------------------------------------------------------
  // SCHEDULING
  // ---------------------------------------------------------------------------
  
  /** Schedule a chaos event */
  schedule(event: ChaosEvent): string {
    const id = `chaos-${++this.eventIdCounter}`;
    this.config.scheduledEvents.push({ ...event });
    console.log(`💥 Chaos scheduled: ${event.type} at day ${event.triggerAt}`);
    return id;
  }
  
  /** Schedule from preset */
  schedulePreset(
    preset: keyof typeof CHAOS_SCENARIOS,
    triggerAt: number
  ): string {
    const scenario = CHAOS_SCENARIOS[preset];
    return this.schedule({
      ...scenario,
      triggerAt,
    });
  }
  
  // ---------------------------------------------------------------------------
  // TICK PROCESSING
  // ---------------------------------------------------------------------------
  
  private lastProcessedDay: number = -1;
  
  /** Process chaos for current tick */
  async processTick(
    tick: SimulationTick,
    population: AgentPopulation
  ): Promise<ChaosEffect[]> {
    const effects: ChaosEffect[] = [];
    const currentDay = tick.simulatedDay;
    const lastDay = this.lastProcessedDay;
    this.lastProcessedDay = currentDay;
    
    // Check scheduled events - use RANGE to catch skipped days
    for (const event of this.config.scheduledEvents) {
      // Trigger if event day is between last processed day and current day
      const shouldTrigger = event.triggerAt > lastDay && 
                            event.triggerAt <= currentDay && 
                            !this.isEventActive(event);
      if (shouldTrigger) {
        const effect = await this.triggerEvent(event, tick, population);
        effects.push(effect);
      }
    }
    
    // Random chaos
    if (Math.random() < this.config.randomChaosRate) {
      const randomEvent = this.generateRandomEvent(currentDay);
      if (randomEvent && this.config.enabledTypes.has(randomEvent.type)) {
        const effect = await this.triggerEvent(randomEvent, tick, population);
        effects.push(effect);
      }
    }
    
    // Process ongoing events
    for (const [id, active] of this.activeEvents) {
      if (currentDay >= active.startDay + active.event.duration) {
        // Event ended
        this.activeEvents.delete(id);
        console.log(`✅ Chaos ended: ${active.event.type}`);
      } else {
        // Apply ongoing effects
        const ongoingEffect = await this.applyOngoingEffect(active, tick, population);
        if (ongoingEffect) effects.push(ongoingEffect);
      }
    }
    
    return effects;
  }
  
  // ---------------------------------------------------------------------------
  // EVENT TRIGGERING
  // ---------------------------------------------------------------------------
  
  private async triggerEvent(
    event: ChaosEvent,
    tick: SimulationTick,
    population: AgentPopulation
  ): Promise<ChaosEffect> {
    const id = `active-${++this.eventIdCounter}`;
    
    console.log(`💥 CHAOS TRIGGERED: ${event.type} (${event.severity})`);
    
    const active: ActiveChaosEvent = {
      id,
      event,
      startDay: tick.simulatedDay,
      startTime: tick.simulatedTime,
    };
    
    this.activeEvents.set(id, active);
    
    // Apply immediate effects
    const effect = await this.applyImmediateEffect(event, tick, population);
    
    // Record
    this.eventHistory.push({
      event,
      triggeredAt: tick.simulatedTime,
      triggeredDay: tick.simulatedDay,
      effect,
    });
    
    return effect;
  }
  
  private async applyImmediateEffect(
    event: ChaosEvent,
    tick: SimulationTick,
    population: AgentPopulation
  ): Promise<ChaosEffect> {
    const scripts = population.getAllScripts();
    const guardians = population.getAllGuardians();
    
    switch (event.type) {
      case 'ModelRelease': {
        const rate = (event.params.obsolescenceRate as number) ?? 0.8;
        const affected = Math.floor(scripts.length * rate);
        
        // Mark scripts as needing adaptation
        let obsoleteCount = 0;
        for (const script of scripts) {
          if (Math.random() < rate && script.traits.adaptability < 0.5) {
            script.state.reputation *= 0.5; // Reputation hit
            obsoleteCount++;
          }
        }
        
        return {
          type: event.type,
          description: `${obsoleteCount} scripts became obsolete`,
          scriptsAffected: obsoleteCount,
          economicImpact: -obsoleteCount * 100,
        };
      }
      
      case 'MarketCrash': {
        const drop = (event.params.demandDrop as number) ?? 0.6;
        return {
          type: event.type,
          description: `Market demand dropped ${drop * 100}%`,
          scriptsAffected: scripts.length,
          economicImpact: -scripts.length * 50 * drop,
          ongoingEffect: { demandMultiplier: 1 - drop },
        };
      }
      
      case 'MassDefault': {
        const rate = (event.params.defaultRate as number) ?? 0.3;
        let defaultCount = 0;
        
        for (const script of scripts) {
          if (Math.random() < rate) {
            script.state.isActive = false;
            script.state.reputation = 0;
            defaultCount++;
          }
        }
        
        return {
          type: event.type,
          description: `${defaultCount} scripts defaulted`,
          scriptsAffected: defaultCount,
          economicImpact: -defaultCount * 1000,
        };
      }
      
      case 'TreasuryBug': {
        const multiplier = (event.params.mintMultiplier as number) ?? 10000;
        return {
          type: event.type,
          description: `Treasury minted ${multiplier}x intended amount`,
          scriptsAffected: 0,
          economicImpact: -1000000, // Catastrophic
          systemAlert: 'CRITICAL: Hyperinflation risk',
        };
      }
      
      case 'GuardianExit': {
        const largest = guardians.reduce((max, g) => 
          g.scriptIds.length > max.scriptIds.length ? g : max
        );
        
        // Orphan all scripts
        const orphaned = population.getScriptsByGuardian(largest.id);
        for (const script of orphaned) {
          script.state.reputation *= 0.7; // Reputation hit for orphans
        }
        largest.state.isActive = false;
        
        return {
          type: event.type,
          description: `Guardian ${largest.name} exited, orphaning ${orphaned.length} scripts`,
          scriptsAffected: orphaned.length,
          economicImpact: -orphaned.length * 200,
        };
      }
      
      case 'ReputationInflation': {
        const inflated = (event.params.inflatedScore as number) ?? 100;
        for (const script of scripts) {
          script.state.reputation = inflated;
        }
        
        return {
          type: event.type,
          description: `All scripts now have ${inflated} reputation`,
          scriptsAffected: scripts.length,
          economicImpact: 0,
          systemAlert: 'WARNING: Reputation system compromised',
        };
      }
      
      default:
        return {
          type: event.type,
          description: `${event.type} triggered`,
          scriptsAffected: 0,
          economicImpact: 0,
        };
    }
  }
  
  private async applyOngoingEffect(
    active: ActiveChaosEvent,
    tick: SimulationTick,
    population: AgentPopulation
  ): Promise<ChaosEffect | null> {
    // Ongoing effects for multi-day events
    if (active.event.type === 'MarketCrash') {
      const recoveryRate = (active.event.params.recoveryRate as number) ?? 0.02;
      // Gradually recover
      return null; // Could return recovery progress
    }
    
    return null;
  }
  
  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  
  private isEventActive(event: ChaosEvent): boolean {
    for (const active of this.activeEvents.values()) {
      if (active.event.type === event.type && 
          active.event.triggerAt === event.triggerAt) {
        return true;
      }
    }
    return false;
  }
  
  private generateRandomEvent(currentDay: number): ChaosEvent | null {
    const types = Array.from(this.config.enabledTypes);
    if (types.length === 0) return null;
    
    const type = types[Math.floor(Math.random() * types.length)];
    const scenario = Object.values(CHAOS_SCENARIOS).find(s => s.type === type);
    
    if (!scenario) return null;
    
    return {
      ...scenario,
      triggerAt: currentDay,
    };
  }
  
  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------
  
  getActiveEvents(): ActiveChaosEvent[] {
    return Array.from(this.activeEvents.values());
  }
  
  getEventHistory(): ChaosEventRecord[] {
    return [...this.eventHistory];
  }
  
  isUnderChaos(): boolean {
    return this.activeEvents.size > 0;
  }
  
  getChaosLevel(): 'None' | 'Low' | 'Medium' | 'High' | 'Critical' {
    if (this.activeEvents.size === 0) return 'None';
    
    const severities = Array.from(this.activeEvents.values())
      .map(e => e.event.severity);
    
    if (severities.includes('Critical')) return 'Critical';
    if (severities.includes('High')) return 'High';
    if (severities.includes('Medium')) return 'Medium';
    return 'Low';
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface ActiveChaosEvent {
  id: string;
  event: ChaosEvent;
  startDay: number;
  startTime: Timestamp;
}

interface ChaosEventRecord {
  event: ChaosEvent;
  triggeredAt: Timestamp;
  triggeredDay: number;
  effect: ChaosEffect;
}

export interface ChaosEffect {
  type: ChaosEventType;
  description: string;
  scriptsAffected: number;
  economicImpact: number;
  ongoingEffect?: Record<string, unknown>;
  systemAlert?: string;
}

// =============================================================================
// FACTORY
// =============================================================================

export function createChaosInjector(
  scheduledEvents: ChaosEvent[] = []
): ChaosInjector {
  return new ChaosInjector({ scheduledEvents });
}
