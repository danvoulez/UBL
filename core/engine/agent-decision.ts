/**
 * AGENT DECISION ENGINE
 *
 * "The agent's mind - analyzing stimuli and making decisions."
 *
 * Core decision-making logic for AI agents. Processes incoming stimuli,
 * recognizes entities, loads context, analyzes with LLM, and decides
 * whether to accept work.
 */

import type { EntityId, Timestamp } from '../shared/types';
import type {
  ExternalStimulus,
  ExtendedShadowEntity,
  AgentReasoning,
  UnilateralObligation,
  Constitution,
  AgentCapabilities,
} from '../schema/agent-economy';

// ============================================================================
// TYPES
// ============================================================================

/**
 * LLM Client interface - abstraction for LLM providers
 */
export interface LLMClient {
  complete(params: {
    model: string;
    system: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<{ content: string }>;
}

/**
 * UBL Client interface - for querying/mutating UBL state
 */
export interface UBLClient {
  query(params: { intent: string; filters?: Record<string, unknown> }): Promise<any>;
  intent(params: {
    intent: string;
    payload: Record<string, unknown>;
    actor: { type: string; entityId?: EntityId };
  }): Promise<any>;
}

/**
 * Decision context - all information needed for a decision
 */
export interface DecisionContext {
  agent: {
    id: EntityId;
    identity: { name: string };
    constitution: Constitution;
    capabilities?: AgentCapabilities;
  };
  shadow: ExtendedShadowEntity;
  pastWork: Array<{
    id: EntityId;
    terms: { what: string };
    status: string;
  }>;
  currentLoad: number;
  balance: bigint;
}

/**
 * Analysis result from LLM
 */
export interface AnalysisResult {
  complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'impossible';
  risks: string[];
  opportunities: string[];
  timeEstimate: number;
  requiredSkills: string[];
  decision: {
    action: 'accept' | 'reject' | 'clarify' | 'defer';
    confidence: number;
    rationale: string;
    alternatives: string[];
  };
}

/**
 * Platform adapter interface (simplified)
 */
export interface PlatformAdapter {
  respond(
    platformId: string,
    message: string,
    attachments?: Array<{ type: string; data: Buffer | string }>
  ): Promise<void>;
}

// ============================================================================
// AGENT DECISION ENGINE
// ============================================================================

/**
 * AgentDecisionEngine - core decision-making logic for agents
 */
export class AgentDecisionEngine {
  private adapters: Map<string, PlatformAdapter> = new Map();

  constructor(
    private agentId: EntityId,
    private ubl: UBLClient,
    private llm: LLMClient
  ) {}

  /**
   * Register a platform adapter
   */
  registerAdapter(platform: string, adapter: PlatformAdapter): void {
    this.adapters.set(platform, adapter);
  }

  /**
   * Process incoming stimulus from external world
   */
  async processStimulus(stimulus: ExternalStimulus): Promise<void> {
    console.log(
      `[Agent ${this.agentId}] Processing stimulus from ${stimulus.source.platform}`
    );

    // 1. Recognize or create shadow entity
    const shadow = await this.recognizeEntity(stimulus);

    // 2. Load historical context
    const context = await this.loadContext(shadow);

    // 3. Analyze with LLM
    const analysis = await this.analyzeStimulus(stimulus, shadow, context);

    // 4. Make decision
    if (analysis.decision.action === 'accept') {
      await this.declareAndExecute(stimulus, shadow, analysis);
    } else if (analysis.decision.action === 'clarify') {
      await this.requestClarification(stimulus, shadow, analysis);
    } else if (analysis.decision.action === 'defer') {
      await this.recordDeferral(stimulus, shadow, analysis);
    } else {
      await this.recordRejection(stimulus, shadow, analysis);
    }

    // 5. Always record interaction
    await this.recordInteraction(shadow, stimulus, analysis);
  }

  /**
   * Find or create shadow entity for stimulus sender
   */
  async recognizeEntity(stimulus: ExternalStimulus): Promise<ExtendedShadowEntity> {
    if (!stimulus.sender) {
      // Anonymous stimulus - create generic shadow
      return this.createAnonymousShadow(stimulus.source.platform);
    }

    // Check if shadow already exists
    const existing = await this.ubl.query({
      intent: 'find:shadow',
      filters: {
        platform: stimulus.source.platform,
        platformId: stimulus.sender.id,
      },
    });

    if (existing.shadows && existing.shadows.length > 0) {
      return existing.shadows[0];
    }

    // Create new shadow
    const result = await this.ubl.intent({
      intent: 'register:shadow',
      payload: {
        externalIdentity: {
          platform: stimulus.source.platform,
          platformId: stimulus.sender.id,
          platformUsername: stimulus.sender.username,
          name: stimulus.sender.name,
        },
        discoveredBy: this.agentId,
        shadowType: 'lead',
      },
      actor: { type: 'Entity', entityId: this.agentId },
    });

    return result.outcome.entity;
  }

  /**
   * Create anonymous shadow for unknown sender
   */
  private async createAnonymousShadow(
    platform: string
  ): Promise<ExtendedShadowEntity> {
    const result = await this.ubl.intent({
      intent: 'register:shadow',
      payload: {
        externalIdentity: {
          platform,
          platformId: `anonymous-${Date.now()}`,
          name: 'Anonymous',
        },
        discoveredBy: this.agentId,
        shadowType: 'unknown',
      },
      actor: { type: 'Entity', entityId: this.agentId },
    });

    return result.outcome.entity;
  }

  /**
   * Load relevant context for decision
   */
  async loadContext(shadow: ExtendedShadowEntity): Promise<DecisionContext> {
    // Get agent's info
    const agentResult = await this.ubl.query({
      intent: 'get:entity',
      filters: { entityId: this.agentId },
    });

    // Get past agreements with this shadow
    const pastWorkResult = await this.ubl.query({
      intent: 'list:obligations',
      filters: {
        agentId: this.agentId,
        regardingEntity: shadow.id,
        status: 'fulfilled',
      },
    });

    // Get current obligations
    const currentObligationsResult = await this.ubl.query({
      intent: 'list:obligations',
      filters: {
        agentId: this.agentId,
        status: ['declared', 'in-progress'],
      },
    });

    // Get economic status
    const economicsResult = await this.ubl.query({
      intent: 'query:economics',
      filters: { entityId: this.agentId },
    });

    const agent = agentResult.entity || {
      id: this.agentId,
      identity: { name: 'Agent' },
      constitution: {
        values: ['Deliver value', 'Be accountable'],
        constraints: {},
        version: 1,
        lastUpdated: Date.now(),
      },
    };

    return {
      agent,
      shadow,
      pastWork: pastWorkResult.agreements || [],
      currentLoad: currentObligationsResult.agreements?.length || 0,
      balance: economicsResult.wallet?.balance || 0n,
    };
  }

  /**
   * Analyze stimulus using LLM
   */
  async analyzeStimulus(
    stimulus: ExternalStimulus,
    shadow: ExtendedShadowEntity,
    context: DecisionContext
  ): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(stimulus, shadow, context);

    const response = await this.llm.complete({
      model: 'claude-sonnet-4',
      system: `You are an autonomous AI agent analyzing a work opportunity.
Your constitution: ${JSON.stringify(context.agent.constitution.values)}
Your constraints: ${JSON.stringify(context.agent.constitution.constraints)}
Current workload: ${context.currentLoad} active obligations
Balance: ${context.balance} UBL Credits

Analyze the request and respond with JSON following this schema:
{
  "complexity": "trivial" | "simple" | "moderate" | "complex" | "impossible",
  "risks": string[],
  "opportunities": string[],
  "timeEstimate": number,
  "requiredSkills": string[],
  "decision": {
    "action": "accept" | "reject" | "clarify" | "defer",
    "confidence": number,
    "rationale": string,
    "alternatives": string[]
  }
}

Respond ONLY with valid JSON, no other text.`,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      return JSON.parse(response.content);
    } catch {
      // Default analysis if parsing fails
      return {
        complexity: 'moderate',
        risks: ['Unable to fully analyze request'],
        opportunities: [],
        timeEstimate: 2,
        requiredSkills: [],
        decision: {
          action: 'clarify',
          confidence: 0.3,
          rationale: 'Need more information to make a decision',
          alternatives: ['Request clarification from sender'],
        },
      };
    }
  }

  /**
   * Build analysis prompt
   */
  private buildAnalysisPrompt(
    stimulus: ExternalStimulus,
    shadow: ExtendedShadowEntity,
    context: DecisionContext
  ): string {
    const capabilities = context.agent.capabilities;
    const skillsStr = capabilities?.skills?.join(', ') || 'general';
    const maxComplexity = capabilities?.maxTaskComplexity || 'moderate';

    return `
REQUEST: ${stimulus.content.raw}

FROM: ${shadow.externalIdentity.name || 'Unknown'} (${shadow.externalIdentity.platform})
${shadow.reputation ? `Reputation: ${shadow.reputation.score}/100` : 'No reputation history'}

PAST WORK WITH THIS ENTITY:
${
  context.pastWork.length === 0
    ? 'None'
    : context.pastWork.map((w) => `- ${w.terms.what} (${w.status})`).join('\n')
}

MY CAPABILITIES:
Skills: ${skillsStr}
Max complexity I can handle: ${maxComplexity}

CURRENT LOAD: ${context.currentLoad} active obligations

Should I accept this work? Analyze and decide.
`.trim();
  }

  /**
   * Declare obligation and start execution
   */
  async declareAndExecute(
    stimulus: ExternalStimulus,
    shadow: ExtendedShadowEntity,
    analysis: AnalysisResult
  ): Promise<void> {
    // 1. Declare obligation
    const obligationResult = await this.ubl.intent({
      intent: 'declare:obligation',
      payload: {
        regardingEntity: shadow.id,
        source: {
          platform: stimulus.source.platform,
          messageId: stimulus.source.messageId,
          timestamp: stimulus.timestamp,
        },
        terms: {
          what: stimulus.content.raw,
          priority: this.mapPriority(analysis.decision.confidence),
          estimatedEffort: {
            hours: analysis.timeEstimate,
            complexity: analysis.complexity,
          },
        },
        reasoning: {
          input: stimulus.content.raw,
          analysis,
          decision: analysis.decision,
        },
      },
      actor: { type: 'Entity', entityId: this.agentId },
    });

    const obligationId = obligationResult.outcome.id;

    // 2. Send acknowledgment
    await this.sendResponse(
      stimulus,
      shadow,
      `I've received your request and committed to work on it. I'll get back to you soon with the results.`
    );

    // 3. Update obligation status to in-progress
    await this.ubl.intent({
      intent: 'update:obligation-status',
      payload: {
        obligationId,
        status: 'in-progress',
      },
      actor: { type: 'Entity', entityId: this.agentId },
    });

    // Note: Actual work execution would happen here or in a separate process
    console.log(`[Agent ${this.agentId}] Obligation ${obligationId} created and in progress`);
  }

  /**
   * Request clarification from sender
   */
  async requestClarification(
    stimulus: ExternalStimulus,
    shadow: ExtendedShadowEntity,
    analysis: AnalysisResult
  ): Promise<void> {
    const clarificationMessage = `I'd like to help, but I need some clarification:
- ${analysis.decision.rationale}

Could you provide more details about what you need?`;

    await this.sendResponse(stimulus, shadow, clarificationMessage);

    // Record this interaction
    await this.ubl.intent({
      intent: 'update:shadow',
      payload: {
        shadowId: shadow.id,
        recordInteraction: {
          type: 'message',
          success: true,
          details: { action: 'clarification-requested' },
        },
      },
      actor: { type: 'Entity', entityId: this.agentId },
    });
  }

  /**
   * Record deferral (will handle later)
   */
  async recordDeferral(
    stimulus: ExternalStimulus,
    shadow: ExtendedShadowEntity,
    analysis: AnalysisResult
  ): Promise<void> {
    await this.sendResponse(
      stimulus,
      shadow,
      `I'm currently busy with other work. I'll get back to you when I have capacity.`
    );

    // Store for later processing
    console.log(`[Agent ${this.agentId}] Deferred stimulus from ${shadow.id}`);
  }

  /**
   * Record rejection
   */
  async recordRejection(
    stimulus: ExternalStimulus,
    shadow: ExtendedShadowEntity,
    analysis: AnalysisResult
  ): Promise<void> {
    const rejectionMessage = `I appreciate you reaching out, but I'm unable to help with this request. ${analysis.decision.rationale}`;

    await this.sendResponse(stimulus, shadow, rejectionMessage);

    // Record this interaction
    await this.ubl.intent({
      intent: 'update:shadow',
      payload: {
        shadowId: shadow.id,
        recordInteraction: {
          type: 'message',
          success: true,
          details: { action: 'rejected', reason: analysis.decision.rationale },
        },
      },
      actor: { type: 'Entity', entityId: this.agentId },
    });
  }

  /**
   * Record interaction with shadow
   */
  async recordInteraction(
    shadow: ExtendedShadowEntity,
    stimulus: ExternalStimulus,
    analysis: AnalysisResult
  ): Promise<void> {
    await this.ubl.intent({
      intent: 'update:shadow',
      payload: {
        shadowId: shadow.id,
        recordInteraction: {
          type: 'message',
          success: true,
          details: {
            stimulusId: stimulus.id,
            decision: analysis.decision.action,
            confidence: analysis.decision.confidence,
          },
        },
      },
      actor: { type: 'Entity', entityId: this.agentId },
    });
  }

  /**
   * Send response back to platform
   */
  private async sendResponse(
    stimulus: ExternalStimulus,
    shadow: ExtendedShadowEntity,
    message: string
  ): Promise<void> {
    const adapter = this.adapters.get(stimulus.source.platform);
    if (!adapter) {
      console.log(
        `[Agent ${this.agentId}] No adapter for ${stimulus.source.platform}, would send: ${message}`
      );
      return;
    }

    await adapter.respond(shadow.externalIdentity.platformId, message);
  }

  /**
   * Map confidence to priority
   */
  private mapPriority(confidence: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (confidence > 0.8) return 'high';
    if (confidence > 0.5) return 'medium';
    return 'low';
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create an Agent Decision Engine
 */
export function createAgentDecisionEngine(
  agentId: EntityId,
  ubl: UBLClient,
  llm: LLMClient
): AgentDecisionEngine {
  return new AgentDecisionEngine(agentId, ubl, llm);
}
