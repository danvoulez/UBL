/**
 * PERCEPTION ADAPTER - Platform Adapters for External World
 *
 * "The agent's eyes on the external world."
 *
 * All platform adapters must implement the PerceptionAdapter interface.
 * This provides a consistent way to connect to, poll, and respond on
 * various external platforms (Telegram, Reddit, Discord, Email, etc.)
 */

import type { EntityId, Timestamp } from '../shared/types';
import type {
  ExternalStimulus,
  StimulusSource,
  StimulusContent,
  StimulusSender,
  ExtendedWatcherFilter,
} from '../schema/agent-economy';

// ============================================================================
// PERCEPTION ADAPTER INTERFACE
// ============================================================================

/**
 * PerceptionAdapter - interface all platform adapters must implement
 */
export interface PerceptionAdapter {
  /** Platform identifier */
  readonly platform: string;

  /**
   * Initialize connection to platform
   */
  connect(config: Record<string, unknown>): Promise<void>;

  /**
   * Disconnect from platform
   */
  disconnect(): Promise<void>;

  /**
   * Start polling for new events
   */
  startPolling(
    filter: ExtendedWatcherFilter,
    onEvent: (stimulus: ExternalStimulus) => Promise<void>,
    pollIntervalMs: number
  ): void;

  /**
   * Stop polling
   */
  stopPolling(): void;

  /**
   * Send response back to platform
   */
  respond(
    platformId: string,
    message: string,
    attachments?: Array<{ type: string; data: Buffer | string }>
  ): Promise<void>;

  /**
   * Fetch historical messages (optional)
   */
  fetchHistory?(since: Timestamp, limit?: number): Promise<ExternalStimulus[]>;

  /**
   * Health check
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}

// ============================================================================
// BASE ADAPTER - Common functionality
// ============================================================================

/**
 * BaseAdapter - provides common functionality for all adapters
 */
export abstract class BaseAdapter implements PerceptionAdapter {
  abstract readonly platform: string;
  protected isConnected = false;
  protected isPolling = false;
  protected pollTimer?: ReturnType<typeof setInterval>;

  abstract connect(config: Record<string, unknown>): Promise<void>;

  async disconnect(): Promise<void> {
    this.stopPolling();
    this.isConnected = false;
  }

  startPolling(
    filter: ExtendedWatcherFilter,
    onEvent: (stimulus: ExternalStimulus) => Promise<void>,
    pollIntervalMs: number
  ): void {
    if (!this.isConnected) {
      throw new Error(`${this.platform} adapter not connected`);
    }

    this.isPolling = true;

    // Start polling loop
    this.pollTimer = setInterval(async () => {
      if (!this.isPolling) return;

      try {
        const events = await this.poll(filter);
        for (const event of events) {
          await onEvent(event);
        }
      } catch (error) {
        console.error(`[${this.platform}] Poll error:`, error);
      }
    }, pollIntervalMs);
  }

  stopPolling(): void {
    this.isPolling = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  abstract respond(
    platformId: string,
    message: string,
    attachments?: Array<{ type: string; data: Buffer | string }>
  ): Promise<void>;

  abstract healthCheck(): Promise<{ healthy: boolean; message?: string }>;

  /**
   * Poll for new events - to be implemented by subclasses
   */
  protected abstract poll(filter: ExtendedWatcherFilter): Promise<ExternalStimulus[]>;

  /**
   * Check if text matches filter criteria
   */
  protected matchesFilter(text: string, filter: ExtendedWatcherFilter): boolean {
    const lowerText = text.toLowerCase();

    // Check keywords (must contain at least one)
    if (filter.keywords && filter.keywords.length > 0) {
      const hasKeyword = filter.keywords.some((kw) =>
        lowerText.includes(kw.toLowerCase())
      );
      if (!hasKeyword) return false;
    }

    // Check exclude keywords (must not contain any)
    if (filter.excludeKeywords && filter.excludeKeywords.length > 0) {
      const hasExcluded = filter.excludeKeywords.some((kw) =>
        lowerText.includes(kw.toLowerCase())
      );
      if (hasExcluded) return false;
    }

    // Check length
    if (filter.minLength && text.length < filter.minLength) return false;
    if (filter.maxLength && text.length > filter.maxLength) return false;

    return true;
  }

  /**
   * Generate stimulus ID
   */
  protected generateStimulusId(): string {
    return `${this.platform}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

// ============================================================================
// TELEGRAM ADAPTER
// ============================================================================

/**
 * TelegramAdapterConfig - configuration for Telegram adapter
 */
export interface TelegramAdapterConfig {
  botToken: string;
  chatIds?: string[];
}

/**
 * TelegramAdapter - adapter for Telegram Bot API
 *
 * Reference implementation from Full-spec.md
 */
export class TelegramAdapter extends BaseAdapter {
  readonly platform = 'telegram';
  private config?: TelegramAdapterConfig;
  private lastUpdateId = 0;

  async connect(config: Record<string, unknown>): Promise<void> {
    this.config = config as TelegramAdapterConfig;

    if (!this.config.botToken) {
      throw new Error('Telegram bot token is required');
    }

    // Verify connection by calling getMe
    const response = await this.telegramRequest('getMe');
    if (!response.ok) {
      throw new Error(`Failed to connect to Telegram: ${response.description}`);
    }

    console.log(`[Telegram] Connected as @${response.result.username}`);
    this.isConnected = true;
  }

  async respond(
    platformId: string,
    message: string,
    attachments?: Array<{ type: string; data: Buffer | string }>
  ): Promise<void> {
    if (!this.isConnected || !this.config) {
      throw new Error('Telegram adapter not connected');
    }

    // Send text message
    await this.telegramRequest('sendMessage', {
      chat_id: platformId,
      text: message,
    });

    // Handle attachments
    if (attachments) {
      for (const att of attachments) {
        if (att.type === 'document') {
          await this.telegramRequest('sendDocument', {
            chat_id: platformId,
            document: att.data,
          });
        }
        // Add more attachment types as needed
      }
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      if (!this.config) {
        return { healthy: false, message: 'Not configured' };
      }

      const response = await this.telegramRequest('getMe');
      if (response.ok) {
        return { healthy: true };
      }
      return { healthy: false, message: response.description };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async fetchHistory(since: Timestamp, limit = 100): Promise<ExternalStimulus[]> {
    // Telegram doesn't support fetching history easily
    // This would need to store messages locally
    return [];
  }

  protected async poll(filter: ExtendedWatcherFilter): Promise<ExternalStimulus[]> {
    if (!this.config) return [];

    try {
      const response = await this.telegramRequest('getUpdates', {
        offset: this.lastUpdateId + 1,
        timeout: 30,
        allowed_updates: ['message'],
      });

      if (!response.ok) {
        console.error('[Telegram] getUpdates failed:', response.description);
        return [];
      }

      const stimuli: ExternalStimulus[] = [];

      for (const update of response.result || []) {
        this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);

        const msg = update.message;
        if (!msg || !msg.text) continue;

        // Check chat filter
        if (this.config.chatIds && this.config.chatIds.length > 0) {
          if (!this.config.chatIds.includes(String(msg.chat.id))) {
            continue;
          }
        }

        // Apply filter
        if (!this.matchesFilter(msg.text, filter)) {
          continue;
        }

        // Convert to ExternalStimulus
        const stimulus: ExternalStimulus = {
          id: this.generateStimulusId(),
          watcherId: '' as EntityId, // Will be set by caller
          source: {
            platform: 'telegram',
            messageId: String(msg.message_id),
            timestamp: msg.date * 1000,
          },
          content: {
            raw: msg.text,
            parsed: {
              chatId: msg.chat.id,
              messageId: msg.message_id,
              chatType: msg.chat.type,
            },
          },
          sender: msg.from
            ? {
                id: String(msg.from.id),
                name: `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim(),
                username: msg.from.username,
              }
            : undefined,
          timestamp: msg.date * 1000,
        };

        stimuli.push(stimulus);
      }

      return stimuli;
    } catch (error) {
      console.error('[Telegram] Poll error:', error);
      return [];
    }
  }

  /**
   * Make a request to Telegram Bot API
   */
  private async telegramRequest(
    method: string,
    params?: Record<string, unknown>
  ): Promise<any> {
    const url = `https://api.telegram.org/bot${this.config!.botToken}/${method}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: params ? JSON.stringify(params) : undefined,
    });

    return response.json();
  }
}

// ============================================================================
// WEBHOOK ADAPTER (for receiving events passively)
// ============================================================================

/**
 * WebhookAdapterConfig - configuration for webhook adapter
 */
export interface WebhookAdapterConfig {
  endpoint: string;
  secret?: string;
}

/**
 * WebhookAdapter - receives events via HTTP webhooks
 */
export class WebhookAdapter extends BaseAdapter {
  readonly platform = 'webhook';
  private config?: WebhookAdapterConfig;
  private pendingEvents: ExternalStimulus[] = [];

  async connect(config: Record<string, unknown>): Promise<void> {
    this.config = config as WebhookAdapterConfig;
    this.isConnected = true;
    console.log(`[Webhook] Ready to receive events at ${this.config.endpoint}`);
  }

  async respond(
    platformId: string,
    message: string,
    attachments?: Array<{ type: string; data: Buffer | string }>
  ): Promise<void> {
    // Webhooks are typically one-way, but could POST back to a callback URL
    console.log(`[Webhook] Would respond to ${platformId}: ${message}`);
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    return { healthy: this.isConnected };
  }

  /**
   * Receive an event from external webhook call
   * This would be called by an HTTP handler
   */
  receiveEvent(data: {
    messageId: string;
    content: string;
    sender?: { id: string; name?: string };
    timestamp?: number;
  }): void {
    const stimulus: ExternalStimulus = {
      id: this.generateStimulusId(),
      watcherId: '' as EntityId,
      source: {
        platform: 'webhook',
        messageId: data.messageId,
        timestamp: data.timestamp || Date.now(),
      },
      content: {
        raw: data.content,
      },
      sender: data.sender,
      timestamp: data.timestamp || Date.now(),
    };

    this.pendingEvents.push(stimulus);
  }

  protected async poll(filter: ExtendedWatcherFilter): Promise<ExternalStimulus[]> {
    // Return and clear pending events
    const events = this.pendingEvents.filter((e) =>
      this.matchesFilter(e.content.raw, filter)
    );
    this.pendingEvents = [];
    return events;
  }
}

// ============================================================================
// ADAPTER FACTORY
// ============================================================================

/**
 * Create a perception adapter for the given platform
 */
export function createPerceptionAdapter(platform: string): PerceptionAdapter {
  switch (platform.toLowerCase()) {
    case 'telegram':
      return new TelegramAdapter();
    case 'webhook':
      return new WebhookAdapter();
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Supported platforms
 */
export const SUPPORTED_PLATFORMS = ['telegram', 'webhook'] as const;
export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];
