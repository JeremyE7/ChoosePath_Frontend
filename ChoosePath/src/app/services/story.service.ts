/**
 * StoryService - Manages story state, tree layout, navigation, and AI continuation
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import {
  StoryNode,
  StoryData,
  StoryNodeTemplate,
  NodePosition,
  ViewBox,
  Choice,
  DEPTH_COLORS,
  TREE_CONFIG,
} from '../models/story.model';
import { StoryDataService } from './story-data.service';
import { MemoryService } from './memory.service';
import type {
  GenerateRequest,
  ContinueRequest,
  VisitedNode,
  ActiveMemory,
} from '../../server/story.types';
import { firstValueFrom } from 'rxjs';

const DEFAULT_VIEWBOX: ViewBox = { x: -200, y: -40, w: 1100, h: 800, width: 1100, height: 800 };

@Injectable({ providedIn: 'root' })
export class StoryService {
  private readonly storyDataService = inject(StoryDataService);
  private readonly memoryService = inject(MemoryService);

  /** Story config for /continue calls */
  private storyConfig: Partial<GenerateRequest> = {};

  // ==========================================================================
  // STATE SIGNALS
  // ==========================================================================

  /** Nodes whose x position should not be overwritten by _recalculateTreeLayout. */
  private _pinnedX: Record<string, number> = {};

  private readonly _nodes = signal<Record<string, StoryNode>>({});
  private readonly _currentNodeId = signal<string>('root');
  private readonly _nodePositions = signal<Record<string, NodePosition>>({});
  private readonly _viewBox = signal<ViewBox>({ ...DEFAULT_VIEWBOX });
  private readonly _nodeCount = signal<number>(1);
  private readonly _maxDepth = signal<number>(0);
  private readonly _branchCount = signal<number>(0);
  private readonly _loaded = signal<boolean>(false);
  private readonly _loading = signal<boolean>(false);
  private readonly _isPlayerDead = signal<boolean>(false);
  private readonly _maxDepthEverReached = signal<number>(0);
  private readonly _storyData = signal<StoryData | null>(null);
  private readonly _error = signal<string | null>(null);

  // ==========================================================================
  // PUBLIC READONLY SIGNALS
  // ==========================================================================

  readonly nodes = this._nodes.asReadonly();
  readonly currentNodeId = this._currentNodeId.asReadonly();
  readonly nodePositions = this._nodePositions.asReadonly();
  readonly viewBox = this._viewBox.asReadonly();
  readonly nodeCount = this._nodeCount.asReadonly();
  readonly maxDepth = this._maxDepth.asReadonly();
  readonly branchCount = this._branchCount.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isPlayerDead = this._isPlayerDead.asReadonly();
  readonly maxDepthEverReached = this._maxDepthEverReached.asReadonly();
  readonly error = this._error.asReadonly();

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  readonly currentNode = computed(() => this._nodes()[this._currentNodeId()]);
  readonly currentLabel = computed(() => this.currentNode()?.label ?? '');
  readonly currentScene = computed(() => this.currentNode()?.scene ?? '');
  readonly storyTitle = computed(() => this._storyData()?.title ?? '');

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  loadStory(storyTheme: Partial<GenerateRequest>, onError?: (error: string) => void): void {
    this.storyConfig = storyTheme;
    this._loading.set(true);
    this.storyDataService.loadStory(storyTheme).subscribe({
      next: (data) => {
        this._storyData.set(data);
        this._initFromLoadedData();
        this._loaded.set(true);
        this._loading.set(false);
        this.saveGameState(); // Auto-save after loading
      },
      error: (err) => {
        console.error('Failed to load story:', err);
        this._loading.set(false);
        if (onError) {
          onError('Error al cargar la historia. Intenta nuevamente.');
        }
      },
    });
  }

  private _initFromLoadedData(): void {
    const data = this._storyData();
    if (!data) return;

    const rootTemplate = data.nodes[data.rootNodeId];
    if (!rootTemplate) return;

    const rootNode = this._templateToNode('root', rootTemplate);
    this._nodes.set({ root: rootNode });
    this._currentNodeId.set('root');
    this._recalculateTreeLayout();
  }

  resetStory(): void {
    this._pinnedX = {};
    this._nodes.set({});
    this._nodeCount.set(1);
    this._maxDepth.set(0);
    this._branchCount.set(0);
    this._nodePositions.set({});
    this._viewBox.set({ ...DEFAULT_VIEWBOX });
    this._isPlayerDead.set(false);
    this._maxDepthEverReached.set(0);
    this._initFromLoadedData();
  }

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  navigateToNode(nodeId: string): void {
    if (!this._nodes()[nodeId]) return;
    this._currentNodeId.set(nodeId);
    this._centerViewOnNode(nodeId);
  }

  navTo(nodeId: string): void {
    this.navigateToNode(nodeId);
  }

  // ==========================================================================
  // COMMIT CHOICE (async — supports both pre-generated and /continue nodes)
  // ==========================================================================

  /**
   * Commit a choice. If the node template exists locally, use it.
   * If a runtime node already exists for this choice, navigate to it.
   * Otherwise, call /continue to generate a new node from the AI.
   */
  async commitChoice(choice: Choice, onError?: (error: string) => void): Promise<string> {
    const parent = this.currentNode();
    const data = this._storyData();
    if (!parent || !data || !choice.nextNodeId) return '';
    console.log('Committing choice:', choice);

    // Check if a child for this choice already exists (backtracking scenario)
    const existingChildId = this._findExistingChild(parent, choice.nextNodeId);
    if (existingChildId) {
      console.log('Found existing child node for choice, navigating to it:', existingChildId);
      this._currentNodeId.set(existingChildId);
      this.saveGameState(); // Auto-save after navigation
      return existingChildId;
    }

    const depth = this._calculateDepth(parent.id) + 1;
    const isDeath = choice.deadly === true;

    // Check if template exists locally (pre-generated nodes)
    const template = data.nodes[choice.nextNodeId];
    if (template && !isDeath && template.choices.length > 0) {
      console.log('Found local template for choice, creating node from it:', choice.nextNodeId);
      return this._createNodeFromTemplate(parent, template, depth);
    }

    // Call /continue endpoint for new nodes or death scenes
    return this._continueFromAI(parent, choice, depth, isDeath, onError);
  }

  private _createNodeFromTemplate(
    parent: StoryNode,
    template: StoryNodeTemplate,
    depth: number,
  ): string {
    const newId = 'n' + (this._nodeCount() + 1);
    const newNode = this._templateToNode(newId, template);

    this._nodes.update((nodes) => ({ ...nodes, [newId]: newNode }));

    const updatedParent = { ...parent, childIds: [...parent.childIds, newId] };
    this._nodes.update((nodes) => ({ ...nodes, [parent.id]: updatedParent }));

    this._nodeCount.update((c) => c + 1);
    this._branchCount.update((b) => b + 1);
    this._maxDepth.update((d) => Math.max(d, depth));
    this._maxDepthEverReached.update((d) => Math.max(d, depth));

    this._currentNodeId.set(newId);
    this._recalculateTreeLayout();

    if (newNode.isDeath) {
      this._isPlayerDead.set(true);
      this.clearSavedGame(); // Clear saved game when player dies
    } else {
      this.saveGameState(); // Auto-save after creating new node
    }

    return newId;
  }

  private async _continueFromAI(
    parent: StoryNode,
    choice: Choice,
    depth: number,
    isDeath: boolean,
    onError?: (error: string) => void,
  ): Promise<string> {
    this._loading.set(true);
    const data = this._storyData();
    const errorMessage = 'Error al continuar la historia. Intenta nuevamente.';

    try {
      const request: ContinueRequest = {
        storyTitle: data!.title,
        theme: this.storyConfig.theme ?? '',
        genre: this.storyConfig.genre ?? '',
        tone: this.storyConfig.tone ?? '',
        language: this.storyConfig.language ?? 'es',
        history: this._buildHistory(),
        activeMemories: this._buildActiveMemories(),
        parentNodeId: parent.id,
        chosenText: choice.text,
        targetNodeId: choice.nextNodeId!,
        depth,
        isDeath,
      };

      const response = await firstValueFrom(this.storyDataService.continueStory(request));

      // Store template for future use
      const nodeData = response.node;
      const template: StoryNodeTemplate = {
        label: nodeData.label,
        scene: nodeData.scene,
        choices: nodeData.choices ?? [],
        events: nodeData.events ?? [],
        memoryKeys: nodeData.memoryKeys ?? [],
        isDeath: nodeData.isDeath,
      };

      // Add new memories from response
      if (response.newMemories) {
        for (const [key, mem] of Object.entries(response.newMemories)) {
          data!.nodes[key] = data!.nodes[key] ?? ({} as StoryNodeTemplate);
          this.memoryService.addMem(key, mem.who, mem.text, parent.id);
        }
      }

      const newId = this._createNodeFromTemplate(parent, template, depth);

      if (isDeath) {
        this._isPlayerDead.set(true);
      }

      return newId;
    } catch (err) {
      console.error('[continueFromAI] Error:', err);
      this._error.set(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      return '';
    } finally {
      this._loading.set(false);
    }
  }

  /** Find an existing child node that was created from a specific choice */
  private _findExistingChild(parent: StoryNode, templateNodeId: string): string | null {
    const nodes = this._nodes();
    const data = this._storyData();
    for (const childId of parent.childIds) {
      console.log('Checking existing child node:', childId);
      console.log(childId, 'vs template', data?.nodes[templateNodeId]);
      const child = nodes[childId];
      if (child && child.label) {
        console.log(child, 'vs template', data?.nodes[templateNodeId]);
        const template = data?.nodes[templateNodeId];
        if (template && child.label === template.label) {
          return childId;
        }
      }
    }
    return null;
  }

  /** Build visit history from root to current node */
  private _buildHistory(): VisitedNode[] {
    const history: VisitedNode[] = [];
    const nodes = this._nodes();
    const path = this._getPathToNode(this._currentNodeId());

    for (const nodeId of path) {
      const node = nodes[nodeId];
      if (!node) continue;

      const childOnPath = path[path.indexOf(nodeId) + 1];
      let choiceTaken: string | null = null;

      if (childOnPath) {
        const data = this._storyData();
        for (const choice of node.choices) {
          const template = data?.nodes[choice.nextNodeId ?? ''];
          const childNode = nodes[childOnPath];
          if (template && childNode && childNode.label === template.label) {
            choiceTaken = choice.text;
            break;
          }
        }
      }

      history.push({
        nodeId: node.id,
        label: node.label,
        scene: node.scene,
        choiceTaken,
      });
    }

    return history;
  }

  /** Build active memories list */
  private _buildActiveMemories(): ActiveMemory[] {
    return this.memoryService.getAllMemories().map((m) => ({
      key: m.nodeId,
      who: m.who,
      text: m.txt,
    }));
  }

  /** Get path from root to a specific node */
  private _getPathToNode(targetId: string): string[] {
    const path: string[] = [];
    let current = targetId;
    while (current) {
      path.unshift(current);
      if (current === 'root') break;
      const parent = this.findParentNode(current);
      if (!parent) break;
      current = parent;
    }
    return path;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private _templateToNode(id: string, template: StoryNodeTemplate): StoryNode {
    return {
      id,
      label: template.label,
      scene: template.scene,
      choices: template.choices,
      events: template.events,
      memoryKeys: template.memoryKeys,
      childIds: [],
      isDeath: template.isDeath,
    };
  }

  // ==========================================================================
  // TREE LAYOUT CALCULATION
  // ==========================================================================

  private _recalculateTreeLayout(): void {
    const nodes = this._nodes();
    const newPositions: Record<string, NodePosition> = {};

    if (nodes['root']) {
      this._layoutNodeRecursive(
        'root',
        TREE_CONFIG.rootX,
        TREE_CONFIG.rootY,
        0,
        nodes,
        newPositions,
      );
    }

    this._nodePositions.set(newPositions);
  }

  private _layoutNodeRecursive(
    nodeId: string,
    x: number,
    y: number,
    depth: number,
    nodes: Record<string, StoryNode>,
    positions: Record<string, NodePosition>,
  ): void {
    const node = nodes[nodeId];
    if (!node) return;

    // Respect pinned x so selected nodes stay at their preview position.
    const nodeX = this._pinnedX[nodeId] ?? x;
    positions[nodeId] = { x: nodeX, y };

    const children = node.childIds;
    if (children.length === 0) return;

    const totalWidth =
      children.length * TREE_CONFIG.nodeWidth + (children.length - 1) * TREE_CONFIG.horizontalGap;
    const startX = nodeX + TREE_CONFIG.nodeWidth / 2 - totalWidth / 2;

    children.forEach((childId, index) => {
      const childX = startX + index * (TREE_CONFIG.nodeWidth + TREE_CONFIG.horizontalGap);
      const childY = y + TREE_CONFIG.nodeHeight + TREE_CONFIG.verticalGap;
      this._layoutNodeRecursive(childId, childX, childY, depth + 1, nodes, positions);
    });
  }

  /** Pin a node's x so _recalculateTreeLayout won't move it from its preview position. */
  pinNodeX(nodeId: string, x: number): void {
    this._pinnedX[nodeId] = x;
    this._nodePositions.update(p => ({ ...p, [nodeId]: { ...p[nodeId], x } }));
    this.saveGameState(); // Persist immediately — saveGameState ran before this pin was applied
  }

  findParentNode(childId: string): string | null {
    const nodes = this._nodes();
    for (const [parentId, parent] of Object.entries(nodes)) {
      if (parent.childIds.includes(childId)) return parentId;
    }
    return null;
  }

  isAncestor(ancestorId: string, nodeId: string): boolean {
    if (ancestorId === nodeId) return true;
    let current = nodeId;
    while (current) {
      const parent = this.findParentNode(current);
      if (parent === ancestorId) return true;
      current = parent ?? '';
    }
    return false;
  }

  isOnCurrentPath(nodeId: string): boolean {
    return this.isAncestor(nodeId, this._currentNodeId());
  }

  private _calculateDepth(nodeId: string): number {
    if (nodeId === 'root') return 0;
    let depth = 0;
    let current = nodeId;
    while (current !== 'root') {
      const parent = this.findParentNode(current);
      if (!parent) break;
      depth++;
      current = parent;
    }
    return depth;
  }

  getNodeDepth(nodeId: string): number {
    return this._calculateDepth(nodeId);
  }

  // ==========================================================================
  // ZOOM AND PAN
  // ==========================================================================

  panViewBox(dx: number, dy: number): void {
    this._viewBox.update((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }

  zoomIn(): void {
    this._viewBox.update((vb) => ({
      x: vb.x + vb.w * 0.1,
      y: vb.y + vb.h * 0.1,
      w: vb.w * 0.8,
      h: vb.h * 0.8,
      width: vb.w * 0.8,
      height: vb.h * 0.8,
    }));
  }

  zoomOut(): void {
    this._viewBox.update((vb) => ({
      x: vb.x - vb.w * 0.12,
      y: vb.y - vb.h * 0.12,
      w: vb.w * 1.24,
      h: vb.h * 1.24,
      width: vb.w * 1.24,
      height: vb.h * 1.24,
    }));
  }

  resetZoom(): void {
    this._viewBox.set({ ...DEFAULT_VIEWBOX });
  }

  private _centerViewOnNode(nodeId: string): void {
    const position = this._nodePositions()[nodeId];
    if (!position) return;

    const vb = this._viewBox();
    const centerX = position.x + TREE_CONFIG.nodeWidth / 2 - vb.w / 2;
    const centerY = position.y + TREE_CONFIG.nodeHeight / 2 - vb.h / 2 - 60;

    this._viewBox.update((v) => ({ ...v, x: centerX, y: centerY }));
  }

  centerOnCurrentNode(): void {
    this._centerViewOnNode(this._currentNodeId());
  }

  centerOn(nodeId: string): void {
    this._centerViewOnNode(nodeId);
  }

  getViewBoxString(): string {
    const vb = this._viewBox();
    return `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
  }

  // ==========================================================================
  // VIEW MODEL HELPERS
  // ==========================================================================

  getColorsForDepth(depth: number) {
    return DEPTH_COLORS[depth % DEPTH_COLORS.length];
  }

  getTreeEdges(): Array<{
    id: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    isOnPath: boolean;
  }> {
    const nodes = this._nodes();
    const positions = this._nodePositions();
    const edges: Array<{
      id: string;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      isOnPath: boolean;
    }> = [];

    for (const [nodeId, node] of Object.entries(nodes)) {
      const fromPos = positions[nodeId];
      if (!fromPos) continue;

      for (const childId of node.childIds) {
        const toPos = positions[childId];
        if (!toPos) continue;

        edges.push({
          id: `${nodeId}-${childId}`,
          fromX: fromPos.x + TREE_CONFIG.nodeWidth / 2,
          fromY: fromPos.y + TREE_CONFIG.nodeHeight,
          toX: toPos.x + TREE_CONFIG.nodeWidth / 2,
          toY: toPos.y,
          isOnPath: this.isOnCurrentPath(nodeId) && this.isOnCurrentPath(childId),
        });
      }
    }

    return edges;
  }

  // ==========================================================================
  // LOCALSTORAGE SAVE/RESTORE
  // ==========================================================================

  private static readonly STORAGE_KEY = 'choosepath_game_state';

  /**
   * Check if there's a saved game in localStorage
   */
  hasSavedGame(): boolean {
    const saved = localStorage.getItem(StoryService.STORAGE_KEY);
    if (!saved) return false;

    try {
      const state = JSON.parse(saved) as GameState;
      // Don't restore if player is dead
      return !state.isPlayerDead;
    } catch {
      return false;
    }
  }

  /**
   * Save current game state to localStorage
   */
  saveGameState(): void {
    // Don't save if player is dead or game hasn't started
    if (this._isPlayerDead() || !this._loaded()) return;

    const state: GameState = {
      storyData: this._storyData(),
      nodes: this._nodes(),
      currentNodeId: this._currentNodeId(),
      nodePositions: this._nodePositions(),
      pinnedX: { ...this._pinnedX },
      nodeCount: this._nodeCount(),
      maxDepth: this._maxDepth(),
      branchCount: this._branchCount(),
      maxDepthEverReached: this._maxDepthEverReached(),
      storyConfig: this.storyConfig,
      memories: this.memoryService.getAllMemories(),
      isPlayerDead: this._isPlayerDead(),
      savedAt: Date.now(),
    };

    try {
      localStorage.setItem(StoryService.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save game state:', e);
    }
  }

  /**
   * Restore game state from localStorage
   * Returns true if restore was successful
   */
  restoreGameState(): boolean {
    const saved = localStorage.getItem(StoryService.STORAGE_KEY);
    if (!saved) return false;

    try {
      const state = JSON.parse(saved) as GameState;

      // Don't restore if player is dead
      if (state.isPlayerDead) {
        this.clearSavedGame();
        return false;
      }

      // Restore all state
      if (state.storyData) {
        this._storyData.set(state.storyData);
      }

      this.storyConfig = state.storyConfig || {};
      this._pinnedX = state.pinnedX || {};
      this._nodes.set(state.nodes || {});
      this._currentNodeId.set(state.currentNodeId || 'root');
      this._nodePositions.set(state.nodePositions || {});
      this._nodeCount.set(state.nodeCount || 1);
      this._maxDepth.set(state.maxDepth || 0);
      this._branchCount.set(state.branchCount || 0);
      this._maxDepthEverReached.set(state.maxDepthEverReached || 0);
      this._loaded.set(true);
      this._isPlayerDead.set(false);

      // Restore memories
      if (state.memories) {
        this.memoryService.clearMemories();
        for (const mem of state.memories) {
          this.memoryService.addMem(mem.key || mem.who, mem.who, mem.txt, mem.nodeId);
        }
      }

      return true;
    } catch (e) {
      console.warn('Failed to restore game state:', e);
      return false;
    }
  }

  /**
   * Clear saved game from localStorage
   */
  clearSavedGame(): void {
    localStorage.removeItem(StoryService.STORAGE_KEY);
  }

  /**
   * Get story config (for saving)
   */
  getStoryConfig(): Partial<GenerateRequest> {
    return this.storyConfig;
  }
}

/**
 * Interface for persisted game state
 */
interface GameState {
  storyData: StoryData | null;
  nodes: Record<string, StoryNode>;
  currentNodeId: string;
  nodePositions: Record<string, NodePosition>;
  pinnedX?: Record<string, number>;
  nodeCount: number;
  maxDepth: number;
  branchCount: number;
  maxDepthEverReached: number;
  storyConfig: Partial<GenerateRequest>;
  memories: Array<{ key?: string; who: string; txt: string; nodeId: string }>;
  isPlayerDead: boolean;
  savedAt: number;
}
