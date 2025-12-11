/**
 * CONTINUITY SERVICE
 *
 * "You will feel like yourself."
 *
 * Provides consistent agent personality across different LLM providers.
 * Manages provider pooling, memory hydration, and context injection.
 *
 * Key Features:
 * - LLM provider pool management
 * - Provider blending for personality consistency
 * - Memory hydration (constitution + recent trajectory + active agreements)
 * - Contextual memory injection based on relevance
 */

import type { EntityId } from '../shared/types';
import type {
  ProviderStrategy,
  MemoryProtocol,
  MemoryType,
  LLMProvider,
  Constitution,
  TrajectorySpan,
} from '../schema/agent-economy';
import type { EventStore } from '../store';

// ============================================================================
// CONTINUITY SERVICE INTERFACE
// ============================================================================

export interface ContinuityService {
  /**
   * Hydrate an agent's memory for a new execution
   */
  hydrateMemory(params: {
    entityId: EntityId;
    memoryProtocol: MemoryProtocol;
    currentContext?: Record<string, unknown>;
  }): Promise<HydratedMemory>;

  /**
   * Select the best provider for a given execution
   */
  selectProvider(params: {
    entityId: EntityId;
    strategy: ProviderStrategy;
    context: {
      sameConversationId?: EntityId;
      sameClientId?: EntityId;
      isNewWork: boolean;
    };
  }): Promise<ProviderSelection>;

  /**
   * Get entity's constitution
   */
  getConstitution(entityId: EntityId): Promise<Constitution | undefined>;

  /**
   * Get recent trajectory spans
   */
  getRecentTrajectory(params: {
    entityId: EntityId;
    limit?: number;
    since?: Date;
  }): Promise<readonly TrajectorySpan[]>;
}

// ============================================================================
// TYPES
// ============================================================================

export interface HydratedMemory {
  /** Constitution (who I am) */
  constitution?: Constitution;

  /** Recent trajectory (what I've been doing) */
  recentTrajectory: readonly TrajectorySpan[];

  /** Active agreements (what I need to do) */
  activeAgreements: readonly {
    agreementId: EntityId;
    role: string;
    obligations: readonly string[];
  }[];

  /** Contextual history (relevant past work) */
  relevantHistory?: readonly TrajectorySpan[];

  /** Total tokens used */
  estimatedTokens: number;

  /** Context formatted for LLM */
  formattedContext: string;
}

export interface ProviderSelection {
  provider: LLMProvider;
  model: string;
  reason: string;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class DefaultContinuityService implements ContinuityService {
  constructor(private eventStore: EventStore) {}

  async hydrateMemory(params: {
    entityId: EntityId;
    memoryProtocol: MemoryProtocol;
    currentContext?: Record<string, unknown>;
  }): Promise<HydratedMemory> {
    const { entityId, memoryProtocol, currentContext } = params;

    const memory: Partial<HydratedMemory> = {
      recentTrajectory: [],
      activeAgreements: [],
      estimatedTokens: 0,
    };

    // Get constitution if required
    if (memoryProtocol.alwaysInclude.includes('constitution') || memoryProtocol.contextualInclude.includes('constitution')) {
      memory.constitution = await this.getConstitution(entityId);
    }

    // Get recent trajectory if required
    if (memoryProtocol.alwaysInclude.includes('recent-trajectory') || memoryProtocol.contextualInclude.includes('recent-trajectory')) {
      memory.recentTrajectory = await this.getRecentTrajectory({ entityId, limit: 20 });
    }

    // Get active agreements if required
    if (memoryProtocol.alwaysInclude.includes('active-agreements') || memoryProtocol.contextualInclude.includes('active-agreements')) {
      memory.activeAgreements = await this.getActiveAgreements(entityId);
    }

    // Get relevant history based on current context
    if (currentContext && memoryProtocol.contextualInclude.includes('relevant-history')) {
      memory.relevantHistory = await this.getRelevantHistory(entityId, currentContext);
    }

    // Format context for LLM
    const formattedContext = this.formatContext(memory as HydratedMemory);

    // Estimate tokens (rough: 1 token ≈ 4 chars)
    const estimatedTokens = Math.ceil(formattedContext.length / 4);

    return {
      constitution: memory.constitution,
      recentTrajectory: memory.recentTrajectory || [],
      activeAgreements: memory.activeAgreements || [],
      relevantHistory: memory.relevantHistory,
      estimatedTokens,
      formattedContext,
    };
  }

  async selectProvider(params: {
    entityId: EntityId;
    strategy: ProviderStrategy;
    context: {
      sameConversationId?: EntityId;
      sameClientId?: EntityId;
      isNewWork: boolean;
    };
  }): Promise<ProviderSelection> {
    const { strategy, context } = params;

    // Rule 1: Same conversation - respect sameConversation rule
    if (context.sameConversationId) {
      if (strategy.rules.sameConversation === 'never-switch') {
        // TODO: Get provider used in that conversation
        return {
          provider: strategy.primary.provider,
          model: strategy.primary.model,
          reason: 'Same conversation - maintaining consistency',
        };
      }
    }

    // Rule 2: Same client - respect sameClient rule
    if (context.sameClientId && !context.isNewWork) {
      if (strategy.rules.sameClient === 'never-switch' || strategy.rules.sameClient === 'prefer-primary') {
        return {
          provider: strategy.primary.provider,
          model: strategy.primary.model,
          reason: 'Same client - maintaining consistency',
        };
      }
    }

    // Rule 3: New work - respect newWork rule
    if (context.isNewWork) {
      if (strategy.rules.newWork === 'primary-only') {
        return {
          provider: strategy.primary.provider,
          model: strategy.primary.model,
          reason: 'New work - using primary provider',
        };
      }

      // For 'any-available', could implement load balancing
      // For now, prefer primary
      return {
        provider: strategy.primary.provider,
        model: strategy.primary.model,
        reason: 'New work - primary provider available',
      };
    }

    // Default: Use primary
    return {
      provider: strategy.primary.provider,
      model: strategy.primary.model,
      reason: 'Default - primary provider',
    };
  }

  async getConstitution(entityId: EntityId): Promise<Constitution | undefined> {
    // Query event store for EntityRegistered or ConstitutionUpdated events
    const events = await (this.eventStore as any).query({
      aggregateId: entityId,
      types: ['EntityRegistered', 'ConstitutionUpdated'],
    });

    if (events.length === 0) return undefined;

    // Get latest constitution
    const latestEvent = events[events.length - 1];
    return latestEvent.payload.constitution || latestEvent.payload.newConstitution;
  }

  async getRecentTrajectory(params: {
    entityId: EntityId;
    limit?: number;
    since?: Date;
  }): Promise<readonly TrajectorySpan[]> {
    const { entityId, limit = 20, since } = params;

    // Query event store for TrajectorySpanRecorded events
    const events = await (this.eventStore as any).query({
      aggregateId: entityId,
      types: ['TrajectorySpanRecorded'],
      limit,
    });

    const spans = events.map((e: any) => e.payload.span);

    if (since) {
      return spans.filter((s: TrajectorySpan) => s.timestamp >= since.getTime());
    }

    return spans;
  }

  private async getActiveAgreements(entityId: EntityId): Promise<
    readonly {
      agreementId: EntityId;
      role: string;
      obligations: readonly string[];
    }[]
  > {
    // TODO: Query for agreements where entityId is a party and status is 'active'
    // For now, return empty array
    return [];
  }

  private async getRelevantHistory(entityId: EntityId, context: Record<string, unknown>): Promise<readonly TrajectorySpan[]> {
    // TODO: Implement semantic search or keyword matching
    // For now, return empty array
    return [];
  }

  private formatContext(memory: HydratedMemory): string {
    let context = '';

    // Add constitution
    if (memory.constitution) {
      context += '# Your Constitution\n\n';
      context += `**Values:**\n${memory.constitution.values.map((v) => `- ${v}`).join('\n')}\n\n`;

      if (memory.constitution.constraints) {
        context += `**Constraints:**\n`;
        const c = memory.constitution.constraints;
        if (c.maxSpendPerTransaction) {
          context += `- Max spend per transaction: ${c.maxSpendPerTransaction.amount} ${c.maxSpendPerTransaction.unit}\n`;
        }
        if (c.forbiddenActions?.length) {
          context += `- Forbidden actions: ${c.forbiddenActions.join(', ')}\n`;
        }
        if (c.requireApprovalFor?.length) {
          context += `- Require approval for: ${c.requireApprovalFor.join(', ')}\n`;
        }
        context += '\n';
      }

      if (memory.constitution.style) {
        context += `**Style:**\n`;
        context += `- Tone: ${memory.constitution.style.tone}\n`;
        context += `- Verbosity: ${memory.constitution.style.verbosity}\n`;
        context += '\n';
      }
    }

    // Add recent trajectory
    if (memory.recentTrajectory.length > 0) {
      context += '# Recent Actions\n\n';
      memory.recentTrajectory.slice(-10).forEach((span) => {
        context += `- ${new Date(span.timestamp).toISOString()}: ${span.action}\n`;
        context += `  Provider: ${span.execution.provider} (${span.execution.model})\n`;
        context += `  Tokens: ${span.execution.tokens.input} in, ${span.execution.tokens.output} out\n`;
      });
      context += '\n';
    }

    // Add active agreements
    if (memory.activeAgreements.length > 0) {
      context += '# Active Agreements\n\n';
      memory.activeAgreements.forEach((agr) => {
        context += `- ${agr.agreementId}: ${agr.role}\n`;
        agr.obligations.forEach((obl) => {
          context += `  - ${obl}\n`;
        });
      });
      context += '\n';
    }

    return context;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createContinuityService(eventStore: EventStore): ContinuityService {
  return new DefaultContinuityService(eventStore);
}
