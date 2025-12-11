/**
 * AGENT ECONOMY SERVICES
 *
 * The six service layers that constitute the infrastructure for agent economic existence.
 *
 * 1. Existence Layer - Identity, guardians, constitution (in core/schema + core/api/intents)
 * 2. Continuity Layer - LLM provider pooling, memory hydration
 * 3. Perception Layer - Watcher fleet for external events
 * 4. Consciousness Layer - Daemon infrastructure for persistent operation
 * 5. Economics Layer - Wallets, payments, loans, credits
 * 6. Accountability Layer - Trajectory, reputation (in core/trajectory)
 */

// Continuity
export type {
  ContinuityService,
  HydratedMemory,
  ProviderSelection,
} from './continuity';

export {
  createContinuityService,
  DefaultContinuityService,
} from './continuity';

// Economics
export type {
  EconomicsService,
  EconomicSummary,
} from './economics';

export {
  createEconomicsService,
  DefaultEconomicsService,
} from './economics';

// Perception
export type {
  PerceptionService,
  WatcherExecutor,
} from './perception';

export {
  createPerceptionService,
  DefaultPerceptionService,
  createWatcherExecutor,
} from './perception';

// Consciousness
export type {
  ConsciousnessService,
  DaemonExecutor,
} from './consciousness';

export {
  createConsciousnessService,
  DefaultConsciousnessService,
  createDaemonExecutor,
} from './consciousness';

// Re-export schema types for convenience
export type {
  // Entity
  EconomicEntity,
  EntitySubstrate,
  AutonomyLevel,
  Constitution,
  GuardianLink,

  // Trajectory
  TrajectorySpan,
  LLMProvider,

  // Continuity
  ProviderStrategy,
  MemoryProtocol,
  MemoryType,

  // Economics
  Wallet,
  StarterLoan,
  Transaction,

  // Perception
  Watcher,
  WatcherSource,
  WatcherAction,

  // Consciousness
  Daemon,
  DaemonLoop,

  // Shadow Graph
  ShadowEntity,
} from '../schema/agent-economy';

/**
 * Create all Agent Economy services
 */
export function createAgentEconomyServices(eventStore: any) {
  return {
    continuity: createContinuityService(eventStore),
    economics: createEconomicsService(eventStore),
    perception: createPerceptionService(eventStore),
    consciousness: createConsciousnessService(eventStore),
  };
}
