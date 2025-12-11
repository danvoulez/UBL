/**
 * PERCEPTION SERVICE
 *
 * "You will know what is happening."
 *
 * Manages the Watcher fleet - cheap, stateless monitors that watch external platforms
 * for events and trigger agent actions.
 *
 * Watchers are the agent's eyes on the external world.
 */

import type { EntityId } from '../shared/types';
import type { Watcher, WatcherSource, WatcherAction } from '../schema/agent-economy';
import type { EventStore } from '../store';

// ============================================================================
// PERCEPTION SERVICE INTERFACE
// ============================================================================

export interface PerceptionService {
  /**
   * Get watcher by ID
   */
  getWatcher(watcherId: EntityId): Promise<Watcher | undefined>;

  /**
   * Get all watchers owned by an entity
   */
  getWatchersByOwner(ownerId: EntityId): Promise<readonly Watcher[]>;

  /**
   * Get active watchers
   */
  getActiveWatchers(): Promise<readonly Watcher[]>;

  /**
   * Pause a watcher
   */
  pauseWatcher(watcherId: EntityId): Promise<void>;

  /**
   * Resume a watcher
   */
  resumeWatcher(watcherId: EntityId): Promise<void>;

  /**
   * Stop a watcher (permanent)
   */
  stopWatcher(watcherId: EntityId): Promise<void>;

  /**
   * Record watcher trigger
   */
  recordTrigger(params: {
    watcherId: EntityId;
    event: Record<string, unknown>;
    actionTaken: string;
  }): Promise<void>;

  /**
   * Get watcher trigger history
   */
  getTriggerHistory(watcherId: EntityId, limit?: number): Promise<
    readonly {
      timestamp: number;
      event: Record<string, unknown>;
      actionTaken: string;
    }[]
  >;

  /**
   * Calculate monthly cost for an entity's watchers
   */
  calculateMonthlyCost(ownerId: EntityId): Promise<{
    amount: number;
    unit: string;
  }>;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class DefaultPerceptionService implements PerceptionService {
  constructor(private eventStore: EventStore) {}

  async getWatcher(watcherId: EntityId): Promise<Watcher | undefined> {
    const events = await (this.eventStore as any).query({
      aggregateId: watcherId,
      types: ['WatcherCreated'],
    });

    if (events.length === 0) return undefined;

    let watcher = events[0].payload.watcher;

    // Apply status changes
    const statusEvents = await (this.eventStore as any).query({
      aggregateId: watcherId,
      types: ['WatcherPaused', 'WatcherResumed', 'WatcherStopped'],
    });

    for (const event of statusEvents) {
      if (event.type === 'WatcherPaused') watcher = { ...watcher, status: 'Paused' };
      else if (event.type === 'WatcherResumed') watcher = { ...watcher, status: 'Active' };
      else if (event.type === 'WatcherStopped') watcher = { ...watcher, status: 'Stopped' };
    }

    return watcher;
  }

  async getWatchersByOwner(ownerId: EntityId): Promise<readonly Watcher[]> {
    const events = await (this.eventStore as any).query({
      types: ['WatcherCreated'],
    });

    const ownerWatchers = events.filter((e: any) => e.payload.watcher.ownerId === ownerId);

    const watchers = await Promise.all(ownerWatchers.map(async (e: any) => this.getWatcher(e.payload.watcher.id)));

    return watchers.filter((w) => w !== undefined) as Watcher[];
  }

  async getActiveWatchers(): Promise<readonly Watcher[]> {
    const events = await (this.eventStore as any).query({
      types: ['WatcherCreated'],
    });

    const watchers = await Promise.all(events.map(async (e: any) => this.getWatcher(e.payload.watcher.id)));

    return watchers.filter((w) => w !== undefined && w.status === 'Active') as Watcher[];
  }

  async pauseWatcher(watcherId: EntityId): Promise<void> {
    await (this.eventStore as any).append({
      type: 'WatcherPaused',
      aggregateType: 'Asset',
      aggregateId: watcherId,
      aggregateVersion: 1, // TODO: Get actual version
      actor: { type: 'System', systemId: 'perception-service' },
      timestamp: Date.now(),
      payload: {},
    });
  }

  async resumeWatcher(watcherId: EntityId): Promise<void> {
    await (this.eventStore as any).append({
      type: 'WatcherResumed',
      aggregateType: 'Asset',
      aggregateId: watcherId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'perception-service' },
      timestamp: Date.now(),
      payload: {},
    });
  }

  async stopWatcher(watcherId: EntityId): Promise<void> {
    await (this.eventStore as any).append({
      type: 'WatcherStopped',
      aggregateType: 'Asset',
      aggregateId: watcherId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'perception-service' },
      timestamp: Date.now(),
      payload: {},
    });
  }

  async recordTrigger(params: {
    watcherId: EntityId;
    event: Record<string, unknown>;
    actionTaken: string;
  }): Promise<void> {
    const { watcherId, event, actionTaken } = params;

    await (this.eventStore as any).append({
      type: 'WatcherTriggered',
      aggregateType: 'Asset',
      aggregateId: watcherId,
      aggregateVersion: 1,
      actor: { type: 'System', systemId: 'perception-service' },
      timestamp: Date.now(),
      payload: {
        watcherId,
        event,
        actionTaken,
      },
    });
  }

  async getTriggerHistory(
    watcherId: EntityId,
    limit: number = 100
  ): Promise<
    readonly {
      timestamp: number;
      event: Record<string, unknown>;
      actionTaken: string;
    }[]
  > {
    const events = await (this.eventStore as any).query({
      aggregateId: watcherId,
      types: ['WatcherTriggered'],
      limit,
    });

    return events.map((e: any) => ({
      timestamp: e.timestamp,
      event: e.payload.event,
      actionTaken: e.payload.actionTaken,
    }));
  }

  async calculateMonthlyCost(ownerId: EntityId): Promise<{
    amount: number;
    unit: string;
  }> {
    const watchers = await this.getWatchersByOwner(ownerId);

    const totalCost = watchers.reduce((sum, watcher) => {
      if (watcher.status === 'Active') {
        return sum + watcher.monthlyCost.amount;
      }
      return sum;
    }, 0);

    return {
      amount: totalCost,
      unit: 'UBL',
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createPerceptionService(eventStore: EventStore): PerceptionService {
  return new DefaultPerceptionService(eventStore);
}

// ============================================================================
// WATCHER EXECUTION (Implementation placeholder)
// ============================================================================

/**
 * WatcherExecutor - The actual polling/monitoring logic
 *
 * This would run as a separate service/worker that:
 * 1. Gets all active watchers
 * 2. Polls their sources according to pollInterval
 * 3. Filters events based on watcher.filter
 * 4. Triggers actions when events match
 */
export interface WatcherExecutor {
  /**
   * Start monitoring all active watchers
   */
  start(): Promise<void>;

  /**
   * Stop monitoring
   */
  stop(): Promise<void>;

  /**
   * Poll a specific source for events
   */
  poll(source: WatcherSource): Promise<readonly Record<string, unknown>[]>;

  /**
   * Execute watcher action
   */
  executeAction(action: WatcherAction, event: Record<string, unknown>): Promise<void>;
}

/**
 * Create a WatcherExecutor
 *
 * TODO: Implement actual polling logic for each source type:
 * - facebook: Use Graph API
 * - twitter: Use Twitter API v2
 * - discord: Use Discord Gateway
 * - email: Use IMAP
 * - webhook: Passive receiver
 * - rss: Parse RSS feeds
 * - blockchain: Use Web3 providers
 * - reddit: Use Reddit API
 */
export function createWatcherExecutor(perceptionService: PerceptionService): WatcherExecutor {
  return {
    async start() {
      console.log('[WatcherExecutor] Starting watcher fleet...');
      // TODO: Implement
    },

    async stop() {
      console.log('[WatcherExecutor] Stopping watcher fleet...');
      // TODO: Implement
    },

    async poll(source: WatcherSource): Promise<readonly Record<string, unknown>[]> {
      // TODO: Implement platform-specific polling
      return [];
    },

    async executeAction(action: WatcherAction, event: Record<string, unknown>): Promise<void> {
      // TODO: Implement action execution
      console.log('[WatcherExecutor] Executing action:', action.type, event);
    },
  };
}
