/**
 * MemoryService - Exact translation of MEM object from UI-idea.html
 * Manages memory system with signals
 */
import { Injectable, signal, computed, inject } from '@angular/core';

export interface MemoryEntry {
  who: string;
  txt: string;
  nodeId: string;
}

// Backward compatibility interface
export interface LegacyMemory {
  id: string;
  keyword: string;
  description: string;
  intensity: 1 | 2 | 3;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class MemoryService {
  // Core state - exact translation of MEM = {}
  protected readonly _memories = signal<Record<string, MemoryEntry>>({});
  
  // Notification queue for showing memory notifications
  protected readonly _notificationQueue = signal<MemoryEntry[]>([]);
  protected readonly _showingNotification = signal<boolean>(false);

  // Public read-only signals
  readonly memories = this._memories.asReadonly();
  readonly notificationQueue = this._notificationQueue.asReadonly();
  readonly showingNotification = this._showingNotification.asReadonly();

  // Computed values
  readonly memoryCount = computed(() => Object.keys(this._memories()).length);
  
  readonly memoryKeys = computed(() => Object.keys(this._memories()));

  // Backward compatibility: keywordSet
  readonly keywordSet = computed(() => 
    new Set(Object.values(this._memories()).map(m => m.who.toLowerCase()))
  );

  // Backward compatibility: isVisible signal
  readonly isVisible = computed(() => this._showingNotification());

  // Backward compatibility: activeMemory signal
  readonly activeMemory = computed<LegacyMemory | null>(() => {
    const queue = this._notificationQueue();
    if (queue.length === 0) return null;
    const mem = queue[0];
    return {
      id: mem.nodeId || 'unknown',
      keyword: mem.who,
      description: mem.txt,
      intensity: 1 as const,
      timestamp: Date.now()
    };
  });

  /**
   * Exact translation of addMem(key, who, txt, nodeId)
   */
  addMem(key: string, who: string, txt: string, nodeId: string): void {
    const mem = this._memories();
    if (mem[key]) return;
    
    this._memories.update(m => ({ ...m, [key]: { who, txt, nodeId } }));
    this.showMemNotif(who, txt);
    this.renderMemLog();
  }

  /**
   * Exact translation of showMemNotif(who, txt)
   * Sets up notification to be displayed
   */
  showMemNotif(who: string, txt: string): void {
    const notification: MemoryEntry = { who, txt, nodeId: '' };
    this._notificationQueue.update(queue => [...queue, notification]);
    this.processNotificationQueue();
  }

  private processNotificationQueue(): void {
    if (this._showingNotification()) return;
    
    const queue = this._notificationQueue();
    if (queue.length === 0) return;

    this._showingNotification.set(true);
    
    // Auto-hide after 4.2 seconds (from original: 4200)
    setTimeout(() => {
      this._showingNotification.set(false);
      this._notificationQueue.update(q => q.slice(1));
      setTimeout(() => this.processNotificationQueue(), 500);
    }, 4200);
  }

  /**
   * Get current notification to display
   */
  getCurrentNotification(): MemoryEntry | null {
    const queue = this._notificationQueue();
    return queue.length > 0 ? queue[0] : null;
  }

  /**
   * Exact translation of renderMemLog()
   * Returns the HTML for the memory log sidebar
   */
  renderMemLog(): MemoryEntry[] {
    const keys = Object.keys(this._memories());
    if (!keys.length) return [];
    
    // Return last 8 entries reversed (exact translation)
    return keys.slice(-8).reverse().map(k => this._memories()[k]);
  }

  /**
   * Exact translation of hasMem(text)
   */
  hasMem(text: string): boolean {
    const h = text.toLowerCase();
    const mem = this._memories();
    return Object.keys(mem).some(k => 
      mem[k].who.toLowerCase().split(/\s+/).some(w => w.length > 3 && h.includes(w))
    );
  }

  /**
   * Check if a specific memory key exists
   */
  hasMemoryKey(key: string): boolean {
    return !!this._memories()[key];
  }

  /**
   * Get a specific memory by key
   */
  getMemory(key: string): MemoryEntry | undefined {
    return this._memories()[key];
  }

  /**
   * Clear all memories
   */
  clearMemories(): void {
    this._memories.set({});
    this._notificationQueue.set([]);
    this._showingNotification.set(false);
  }

  /**
   * Get all memories as array
   */
  getAllMemories(): MemoryEntry[] {
    return Object.entries(this._memories()).map(([_, v]) => v);
  }

  /**
   * Backward compatibility: getRecentMemories
   */
  getRecentMemories(count: number = 20): LegacyMemory[] {
    const entries = Object.entries(this._memories());
    return entries.slice(-count).reverse().map(([k, v]) => ({
      id: k,
      keyword: v.who,
      description: v.txt,
      intensity: 1 as const,
      timestamp: Date.now()
    }));
  }

  /**
   * Dismiss current notification - backward compatibility
   */
  dismissNotification(): void {
    this._showingNotification.set(false);
    this._notificationQueue.update(q => q.slice(1));
  }
}
