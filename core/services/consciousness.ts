/**
 * CONSCIOUSNESS SERVICE
 *
 * "You will persist."
 *
 * Manages Daemons - persistent, proactive agent processes that run continuously.
 *
 * A poor agent runs on watchers only (reactive).
 * A rich agent runs a daemon (proactive).
 * A smart agent balances both based on economics.
 */

import type { EntityId, Quantity } from '../shared/types';
import type { Daemon, DaemonLoop } from '../schema/agent-economy';
import type { EventStore } from '../store';

// ============================================================================
// CONSCIOUSNESS SERVICE INTERFACE
// ============================================================================

export interface ConsciousnessService {
  /**
   * Get daemon by ID
   */
  getDaemon(daemonId: EntityId): Promise<Daemon | undefined>;

  /**
   * Get all daemons for an entity
   */
  getDaemonsByEntity(entityId: EntityId): Promise<readonly Daemon[]>;

  /**
   * Get all running daemons
   */
  getRunningDaemons(): Promise<readonly Daemon[]>;

  /**
   * Record heartbeat
   */
  recordHeartbeat(params: {
    daemonId: EntityId;
    status: string;
  }): Promise<void>;

  /**
   * Put daemon to sleep (budget exhausted)
   */
  sleep(daemonId: EntityId, reason: string): Promise<void>;

  /**
   * Wake daemon from sleep
   */
  wake(daemonId: EntityId): Promise<void>;

  /**
   * Stop daemon permanently
   */
  stop(daemonId: EntityId): Promise<void>;

  /**
   * Record loop execution
   */
  recordLoopExecution(params: {
    daemonId: EntityId;
    loopName: string;
    success: boolean;
    durationMs: number;
    cost: Quantity;
  }): Promise<void>;

  /**
   * Get daemon execution history
   */
  getExecutionHistory(
    daemonId: EntityId,
    limit?: number
  ): Promise<
    readonly {
      timestamp: number;
      loopName: string;
      success: boolean;
      durationMs: number;
      cost: Quantity;
    }[]
  >;

  /**
   * Calculate daemon running costs
   */
  calculateRunningCost(daemonId: EntityId, periodMs: number): Promise<Quantity>;

  /**
   * Check if daemon is within budget
   */
  isWithinBudget(daemonId: EntityId): Promise<{
    withinBudget: boolean;
    hourlySpent: Quantity;
    hourlyLimit: Quantity;
    dailySpent: Quantity;
    dailyLimit: Quantity;
  }>;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class DefaultConsciousnessService implements ConsciousnessService {
  constructor(private eventStore: EventStore) {}

  async getDaemon(daemonId: EntityId): Promise<Daemon | undefined> {
    const events = await (this.eventStore as any).query({
      aggregateId: daemonId,
      types: ['DaemonStarted'],
    });

    if (events.length === 0) return undefined;

    let daemon = events[0].payload.daemon;

    // Apply status changes
    const statusEvents = await (this.eventStore as any).query({
      aggregateId: daemonId,
      types: ['DaemonSlept', 'DaemonWoke', 'DaemonStopped', 'DaemonHeartbeat'],
    });

    for (const event of statusEvents) {
      if (event.type === 'DaemonSlept') daemon = { ...daemon, status: 'Sleeping' };
      else if (event.type === 'DaemonWoke') daemon = { ...daemon, status: 'Running' };
      else if (event.type === 'DaemonStopped') daemon = { ...daemon, status: 'Stopped' };
      else if (event.type === 'DaemonHeartbeat') {
        daemon = {
          ...daemon,
          heartbeat: {
            ...daemon.heartbeat,
            lastBeat: event.timestamp,
          },
        };
      }
    }

    return daemon;
  }

  async getDaemonsByEntity(entityId: EntityId): Promise<readonly Daemon[]> {
    const events = await (this.eventStore as any).query({
      types: ['DaemonStarted'],
    });

    const entityDaemons = events.filter((e: any) => e.payload.daemon.entityId === entityId);

    const daemons = await Promise.all(entityDaemons.map(async (e: any) => this.getDaemon(e.payload.daemon.id)));

    return daemons.filter((d) => d !== undefined) as Daemon[];
  }

  async getRunningDaemons(): Promise<readonly Daemon[]> {
    const events = await (this.eventStore as any).query({
      types: ['DaemonStarted'],
    });

    const daemons = await Promise.all(events.map(async (e: any) => this.getDaemon(e.payload.daemon.id)));

    return daemons.filter((d) => d !== undefined && d.status === 'Running') as Daemon[];
  }

  async recordHeartbeat(params: {
    daemonId: EntityId;
    status: string;
  }): Promise<void> {
    const { daemonId, status } = params;

    await (this.eventStore as any).append({
      type: 'DaemonHeartbeat',
      aggregateType: 'Workflow',
      aggregateId: daemonId,
      aggregateVersion: 1, // TODO: Get actual version
      actor: { type: 'System', systemId: 'consciousness-service' },
      timestamp: Date.now(),
      payload: {
        daemonId,
        timestamp: Date.now(),
        status,
      },
    });
  }

  async sleep(daemonId: EntityId, reason: string): Promise<void> {
    await (this.eventStore as any).append({
      type: 'DaemonSlept',
      aggregateType: 'Workflow',
      aggregateId: daemonId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'consciousness-service' },
      timestamp: Date.now(),
      payload: { reason },
    });
  }

  async wake(daemonId: EntityId): Promise<void> {
    await (this.eventStore as any).append({
      type: 'DaemonWoke',
      aggregateType: 'Workflow',
      aggregateId: daemonId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'consciousness-service' },
      timestamp: Date.now(),
      payload: {},
    });
  }

  async stop(daemonId: EntityId): Promise<void> {
    await (this.eventStore as any).append({
      type: 'DaemonStopped',
      aggregateType: 'Workflow',
      aggregateId: daemonId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'consciousness-service' },
      timestamp: Date.now(),
      payload: {},
    });
  }

  async recordLoopExecution(params: {
    daemonId: EntityId;
    loopName: string;
    success: boolean;
    durationMs: number;
    cost: Quantity;
  }): Promise<void> {
    const { daemonId, loopName, success, durationMs, cost } = params;

    await (this.eventStore as any).append({
      type: 'DaemonLoopExecuted',
      aggregateType: 'Workflow',
      aggregateId: daemonId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'consciousness-service' },
      timestamp: Date.now(),
      payload: {
        daemonId,
        loopName,
        success,
        durationMs,
        cost,
      },
    });
  }

  async getExecutionHistory(
    daemonId: EntityId,
    limit: number = 100
  ): Promise<
    readonly {
      timestamp: number;
      loopName: string;
      success: boolean;
      durationMs: number;
      cost: Quantity;
    }[]
  > {
    const events = await (this.eventStore as any).query({
      aggregateId: daemonId,
      types: ['DaemonLoopExecuted'],
      limit,
    });

    return events.map((e: any) => ({
      timestamp: e.timestamp,
      loopName: e.payload.loopName,
      success: e.payload.success,
      durationMs: e.payload.durationMs,
      cost: e.payload.cost,
    }));
  }

  async calculateRunningCost(daemonId: EntityId, periodMs: number): Promise<Quantity> {
    const now = Date.now();
    const since = now - periodMs;

    const events = await (this.eventStore as any).query({
      aggregateId: daemonId,
      types: ['DaemonLoopExecuted'],
    });

    const recentEvents = events.filter((e: any) => e.timestamp >= since);

    const totalCost = recentEvents.reduce((sum: number, e: any) => {
      return sum + e.payload.cost.amount;
    }, 0);

    return {
      amount: totalCost,
      unit: 'UBL',
    };
  }

  async isWithinBudget(daemonId: EntityId): Promise<{
    withinBudget: boolean;
    hourlySpent: Quantity;
    hourlyLimit: Quantity;
    dailySpent: Quantity;
    dailyLimit: Quantity;
  }> {
    const daemon = await this.getDaemon(daemonId);
    if (!daemon) {
      throw new Error(`Daemon ${daemonId} not found`);
    }

    const hourlySpent = await this.calculateRunningCost(daemonId, 60 * 60 * 1000);
    const dailySpent = await this.calculateRunningCost(daemonId, 24 * 60 * 60 * 1000);

    const hourlyLimit = daemon.budget.hourlyMax;
    const dailyLimit = daemon.budget.dailyMax;

    const withinHourly = hourlySpent.amount <= hourlyLimit.amount;
    const withinDaily = dailySpent.amount <= dailyLimit.amount;

    return {
      withinBudget: withinHourly && withinDaily,
      hourlySpent,
      hourlyLimit,
      dailySpent,
      dailyLimit,
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createConsciousnessService(eventStore: EventStore): ConsciousnessService {
  return new DefaultConsciousnessService(eventStore);
}

// ============================================================================
// DAEMON EXECUTOR (Implementation placeholder)
// ============================================================================

/**
 * DaemonExecutor - The actual daemon runtime
 *
 * This would run as a separate service/worker that:
 * 1. Gets all running daemons
 * 2. Executes their scheduled loops
 * 3. Records heartbeats
 * 4. Manages budget constraints
 * 5. Puts daemons to sleep when budget exhausted
 */
export interface DaemonExecutor {
  /**
   * Start executing all running daemons
   */
  start(): Promise<void>;

  /**
   * Stop executing daemons
   */
  stop(): Promise<void>;

  /**
   * Execute a daemon loop
   */
  executeLoop(daemon: Daemon, loop: DaemonLoop): Promise<void>;

  /**
   * Check and enforce budget limits
   */
  checkBudget(daemon: Daemon): Promise<void>;
}

/**
 * Create a DaemonExecutor
 */
export function createDaemonExecutor(consciousnessService: ConsciousnessService): DaemonExecutor {
  const runningDaemons = new Map<EntityId, NodeJS.Timeout[]>();

  return {
    async start() {
      console.log('[DaemonExecutor] Starting daemon runtime...');

      const daemons = await consciousnessService.getRunningDaemons();

      for (const daemon of daemons) {
        const intervals: NodeJS.Timeout[] = [];

        // Start heartbeat
        const heartbeatMs = this.parseInterval(daemon.heartbeat.interval);
        const heartbeatInterval = setInterval(async () => {
          await consciousnessService.recordHeartbeat({
            daemonId: daemon.id,
            status: 'Running',
          });
        }, heartbeatMs);
        intervals.push(heartbeatInterval);

        // Start each loop
        for (const loop of daemon.loops) {
          const loopMs = this.parseInterval(loop.interval);
          const loopInterval = setInterval(async () => {
            await this.executeLoop(daemon, loop);
          }, loopMs);
          intervals.push(loopInterval);
        }

        runningDaemons.set(daemon.id, intervals);
      }

      console.log(`[DaemonExecutor] Started ${daemons.length} daemons`);
    },

    async stop() {
      console.log('[DaemonExecutor] Stopping daemon runtime...');

      for (const [daemonId, intervals] of runningDaemons.entries()) {
        for (const interval of intervals) {
          clearInterval(interval);
        }
      }

      runningDaemons.clear();
    },

    async executeLoop(daemon: Daemon, loop: DaemonLoop) {
      console.log(`[DaemonExecutor] Executing loop ${loop.name} for daemon ${daemon.id}`);

      const startTime = Date.now();
      let success = false;
      let cost = { amount: 0, unit: 'UBL' };

      try {
        // TODO: Execute the actual action (intent or workflow)
        // This would involve:
        // 1. Hydrate agent memory
        // 2. Execute the action
        // 3. Record trajectory
        // 4. Calculate cost

        success = true;
        cost = { amount: 1, unit: 'UBL' }; // Placeholder
      } catch (error) {
        console.error(`[DaemonExecutor] Loop ${loop.name} failed:`, error);
        success = false;
      }

      const durationMs = Date.now() - startTime;

      await consciousnessService.recordLoopExecution({
        daemonId: daemon.id,
        loopName: loop.name,
        success,
        durationMs,
        cost,
      });

      // Check budget after execution
      await this.checkBudget(daemon);
    },

    async checkBudget(daemon: Daemon) {
      const budgetCheck = await consciousnessService.isWithinBudget(daemon.id);

      if (!budgetCheck.withinBudget) {
        console.log(`[DaemonExecutor] Daemon ${daemon.id} exceeded budget, putting to sleep`);

        if (daemon.budget.onExhausted === 'sleep') {
          await consciousnessService.sleep(daemon.id, 'Budget exhausted');

          // Stop this daemon's intervals
          const intervals = runningDaemons.get(daemon.id);
          if (intervals) {
            for (const interval of intervals) {
              clearInterval(interval);
            }
            runningDaemons.delete(daemon.id);
          }
        } else if (daemon.budget.onExhausted === 'notify-guardian') {
          // TODO: Send notification to guardian
          console.log(`[DaemonExecutor] Would notify guardian of ${daemon.entityId}`);
        } else if (daemon.budget.onExhausted === 'reduce-frequency') {
          // TODO: Reduce loop frequencies
          console.log(`[DaemonExecutor] Would reduce loop frequencies for ${daemon.id}`);
        }
      }
    },

    parseInterval(interval: string): number {
      const match = interval.match(/^(\d+)(ms|s|m|h|d)$/);
      if (!match) return 60000; // Default 1 minute

      const [, amount, unit] = match;
      const num = parseInt(amount, 10);

      switch (unit) {
        case 'ms':
          return num;
        case 's':
          return num * 1000;
        case 'm':
          return num * 60 * 1000;
        case 'h':
          return num * 60 * 60 * 1000;
        case 'd':
          return num * 24 * 60 * 60 * 1000;
        default:
          return 60000;
      }
    },
  };
}
