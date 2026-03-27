/**
 * StoryService - Manages story state, tree layout, and navigation
 *
 * Responsibilities:
 * - Load story data via StoryDataService
 * - Hold all active story nodes in memory
 * - Track current node position
 * - Calculate tree layout positions
 * - Handle node navigation and choice commits
 * - Manage zoom/viewbox state
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import {
  StoryNode,
  StoryData,
  StoryNodeTemplate,
  NodePosition,
  ViewBox,
  DEPTH_COLORS,
  TREE_CONFIG,
} from '../models/story.model';
import { StoryDataService } from './story-data.service';

const DEFAULT_VIEWBOX: ViewBox = { x: -200, y: -40, w: 700, h: 500, width: 700, height: 500 };

@Injectable({ providedIn: 'root' })
export class StoryService {
  private readonly storyDataService = inject(StoryDataService);

  /** Loaded story templates (the "database" of available nodes) */
  private storyData: StoryData | null = null;

  // ==========================================================================
  // STATE SIGNALS
  // ==========================================================================

  private readonly _nodes = signal<Record<string, StoryNode>>({});
  private readonly _currentNodeId = signal<string>('root');
  private readonly _nodePositions = signal<Record<string, NodePosition>>({});
  private readonly _viewBox = signal<ViewBox>({ ...DEFAULT_VIEWBOX });
  private readonly _nodeCount = signal<number>(1);
  private readonly _maxDepth = signal<number>(0);
  private readonly _branchCount = signal<number>(0);
  private readonly _loaded = signal<boolean>(false);

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

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  readonly currentNode = computed(() => this._nodes()[this._currentNodeId()]);
  readonly currentLabel = computed(() => this.currentNode()?.label ?? '');
  readonly currentScene = computed(() => this.currentNode()?.scene ?? '');

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Load and initialize a story by its slug.
   * Fetches the JSON via StoryDataService, then builds the root node.
   */
  loadStory(storyId: string): void {
    this.storyDataService.loadStory(storyId).subscribe({
      next: (data) => {
        this.storyData = data;
        this._initFromLoadedData();
        this._loaded.set(true);
      },
      error: (err) => console.error('Failed to load story:', err),
    });
  }

  /** Build the root node from loaded story data */
  private _initFromLoadedData(): void {
    if (!this.storyData) return;

    const rootTemplate = this.storyData.nodes[this.storyData.rootNodeId];
    if (!rootTemplate) return;

    const rootNode = this._templateToNode('root', rootTemplate);
    this._nodes.set({ root: rootNode });
    this._currentNodeId.set('root');
    this._recalculateTreeLayout();
  }

  /** Reset story to initial state */
  resetStory(): void {
    this._nodes.set({});
    this._nodeCount.set(1);
    this._maxDepth.set(0);
    this._branchCount.set(0);
    this._nodePositions.set({});
    this._viewBox.set({ ...DEFAULT_VIEWBOX });
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
  // COMMIT CHOICE
  // ==========================================================================

  /**
   * Commit a choice by its nextNodeId.
   * Looks up the node template in the loaded story data and creates a runtime node.
   */
  commitChoice(nextNodeId: string): string {
    const parent = this.currentNode();
    if (!parent || !this.storyData) return '';

    const template = this.storyData.nodes[nextNodeId];
    if (!template) return '';

    const newId = 'n' + (this._nodeCount() + 1);
    const newNode = this._templateToNode(newId, template);

    // Add new node to the tree
    this._nodes.update(nodes => ({ ...nodes, [newId]: newNode }));

    // Link child to parent
    const updatedParent = { ...parent, childIds: [...parent.childIds, newId] };
    this._nodes.update(nodes => ({ ...nodes, [parent.id]: updatedParent }));

    // Update stats
    this._nodeCount.update(c => c + 1);
    this._branchCount.update(b => b + 1);
    this._maxDepth.update(d => Math.max(d, this._calculateDepth(newId)));

    this._currentNodeId.set(newId);
    this._recalculateTreeLayout();

    return newId;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /** Convert a JSON template into a runtime StoryNode */
  private _templateToNode(id: string, template: StoryNodeTemplate): StoryNode {
    return {
      id,
      label: template.label,
      scene: template.scene,
      choices: template.choices,
      events: template.events,
      memoryKeys: template.memoryKeys,
      childIds: [],
    };
  }

  // ==========================================================================
  // TREE LAYOUT CALCULATION
  // ==========================================================================

  private _recalculateTreeLayout(): void {
    const nodes = this._nodes();
    const newPositions: Record<string, NodePosition> = {};

    if (nodes['root']) {
      this._layoutNodeRecursive('root', TREE_CONFIG.rootX, TREE_CONFIG.rootY, 0, nodes, newPositions);
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

    positions[nodeId] = { x, y };

    const children = node.childIds;
    if (children.length === 0) return;

    const totalWidth = children.length * TREE_CONFIG.nodeWidth + (children.length - 1) * TREE_CONFIG.horizontalGap;
    const startX = x + TREE_CONFIG.nodeWidth / 2 - totalWidth / 2;

    children.forEach((childId, index) => {
      const childX = startX + index * (TREE_CONFIG.nodeWidth + TREE_CONFIG.horizontalGap);
      const childY = y + TREE_CONFIG.nodeHeight + TREE_CONFIG.verticalGap;
      this._layoutNodeRecursive(childId, childX, childY, depth + 1, nodes, positions);
    });
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

  /**
   * Pan the viewBox by a delta in SVG coordinate units.
   * dx/dy are already in SVG space (converted by the canvas component).
   */
  panViewBox(dx: number, dy: number): void {
    this._viewBox.update(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }

  zoomIn(): void {
    this._viewBox.update(vb => ({
      x: vb.x + vb.w * 0.1,
      y: vb.y + vb.h * 0.1,
      w: vb.w * 0.8,
      h: vb.h * 0.8,
      width: vb.w * 0.8,
      height: vb.h * 0.8,
    }));
  }

  zoomOut(): void {
    this._viewBox.update(vb => ({
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

    this._viewBox.update(v => ({ ...v, x: centerX, y: centerY }));
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
}
