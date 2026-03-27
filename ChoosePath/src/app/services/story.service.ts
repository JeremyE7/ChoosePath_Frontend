/**
 * StoryService - Manages story state, tree layout, and navigation
 * 
 * Responsibilities:
 * - Hold all story nodes in memory
 * - Track current node position
 * - Calculate tree layout positions
 * - Handle node navigation and choice commits
 * - Manage zoom/viewbox state
 * 
 * State (signals):
 * - nodes: Record of all story nodes
 * - currentNodeId: ID of currently active node
 * - nodePositions: SVG coordinates for each node
 * - viewBox: Current viewport settings
 * - stats: node count, depth, branches
 */
import { Injectable, signal, computed } from '@angular/core';
import { 
  StoryNode, 
  NodePosition, 
  ViewBox, 
  DEPTH_COLORS, 
  TREE_CONFIG 
} from '../models/story.model';
import { STORY_NODES, createRootNode, CHOICE_DATABASE } from '../data/story-data';

@Injectable({ providedIn: 'root' })
export class StoryService {
  
  // ==========================================================================
  // STATE SIGNALS
  // ==========================================================================
  
  /** All story nodes indexed by ID */
  private readonly _nodes = signal<Record<string, StoryNode>>({});
  
  /** Currently active node ID */
  private readonly _currentNodeId = signal<string>('root');
  
  /** SVG positions for each node */
  private readonly _nodePositions = signal<Record<string, NodePosition>>({});
  
  /** SVG viewBox configuration */
  private readonly _viewBox = signal<ViewBox>({ x: -200, y: -40, w: 700, h: 500, width: 700, height: 500 });
  
  /** Story statistics */
  private readonly _nodeCount = signal<number>(1);
  private readonly _maxDepth = signal<number>(0);
  private readonly _branchCount = signal<number>(0);

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

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================
  
  /** Get the current active node */
  readonly currentNode = computed(() => this._nodes()[this._currentNodeId()]);
  
  /** Get label of current node for breadcrumb display */
  readonly currentLabel = computed(() => this.currentNode()?.label ?? '');
  
  /** Get current scene text with memory echoes injected */
  readonly currentScene = computed(() => {
    const node = this.currentNode();
    return node?.scene ?? '';
  });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  
  /** Initialize the story with root node */
  initStory(): void {
    const root = createRootNode();
    this._nodes.set({ root: root });
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
    this.initStory();
  }

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  
  /**
   * Navigate to an existing node in the tree
   * Used when clicking on visited nodes
   */
  navigateToNode(nodeId: string): void {
    const node = this._nodes()[nodeId];
    if (!node) return;
    
    this._currentNodeId.set(nodeId);
    this._centerViewOnNode(nodeId);
  }

  /**
   * Commit a choice and create new node
   * Called when player drags choice to tree or presses Enter
   */
  commitChoice(choiceText: string): string {
    const parent = this.currentNode();
    if (!parent) return '';

    // Look up choice data from database
    const choiceData = CHOICE_DATABASE[choiceText];
    
    // Generate new node ID
    const newId = 'n' + (this._nodeCount() + 1);
    
    // Calculate new node depth by traversing up to root
    const parentDepth = this._calculateDepth(parent.id);
    const newDepth = parentDepth + 1;

    // Create new node
    const newNode: StoryNode = {
      id: newId,
      label: choiceData?.label ?? choiceText.slice(0, 13),
      scene: choiceData?.scene ?? `Eliges: <em>${choiceText}</em>.`,
      choices: choiceData?.choices ?? [],
      events: choiceData?.events ?? [],
      memoryKeys: choiceData?.memoryKeys ?? [],
      childIds: [],
    };

    // Update nodes record
    this._nodes.update(nodes => ({ ...nodes, [newId]: newNode }));
    
    // Add child reference to parent
    const updatedParent = { ...parent, childIds: [...parent.childIds, newId] };
    this._nodes.update(nodes => ({ ...nodes, [parent.id]: updatedParent }));

    // Update statistics
    this._nodeCount.update(c => c + 1);
    this._branchCount.update(b => b + 1);
    this._maxDepth.update(d => Math.max(d, this._calculateDepth(newId)));

    // Set as current node
    this._currentNodeId.set(newId);

    // Recalculate all node positions
    this._recalculateTreeLayout();

    return newId;
  }

  // ==========================================================================
  // TREE LAYOUT CALCULATION
  // ==========================================================================
  
  /**
   * Calculate SVG positions for all nodes using depth-first layout
   * Positions root at top center, children below with spacing
   */
  private _recalculateTreeLayout(): void {
    const nodes = this._nodes();
    const newPositions: Record<string, NodePosition> = {};
    
    // Calculate position for root node
    const rootNode = nodes['root'];
    if (rootNode) {
      this._layoutNodeRecursive('root', TREE_CONFIG.rootX, TREE_CONFIG.rootY, 0, nodes, newPositions);
    }
    
    this._nodePositions.set(newPositions);
  }

  /**
   * Recursively calculate positions for a node and its children
   */
  private _layoutNodeRecursive(
    nodeId: string,
    x: number,
    y: number,
    depth: number,
    nodes: Record<string, StoryNode>,
    positions: Record<string, NodePosition>
  ): void {
    const node = nodes[nodeId];
    if (!node) return;

    // Store position for this node
    positions[nodeId] = { x, y };

    const children = node.childIds;
    if (children.length === 0) return;

    // Calculate horizontal spread for children
    const childCount = children.length;
    const totalWidth = childCount * TREE_CONFIG.nodeWidth + (childCount - 1) * TREE_CONFIG.horizontalGap;
    const startX = x + TREE_CONFIG.nodeWidth / 2 - totalWidth / 2;

    // Position each child below the parent
    children.forEach((childId, index) => {
      const childX = startX + index * (TREE_CONFIG.nodeWidth + TREE_CONFIG.horizontalGap);
      const childY = y + TREE_CONFIG.nodeHeight + TREE_CONFIG.verticalGap;
      this._layoutNodeRecursive(childId, childX, childY, depth + 1, nodes, positions);
    });
  }

  /**
   * Get the parent node ID for a given node
   */
  findParentNode(childId: string): string | null {
    const nodes = this._nodes();
    for (const [parentId, parent] of Object.entries(nodes)) {
      if (parent.childIds.includes(childId)) {
        return parentId;
      }
    }
    return null;
  }

  /**
   * Check if ancestorId is an ancestor of nodeId in the tree
   */
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

  /**
   * Check if a node is on the path from root to current node
   */
  isOnCurrentPath(nodeId: string): boolean {
    return this.isAncestor(nodeId, this._currentNodeId());
  }

  /**
   * Calculate the depth of a node by traversing up to root
   * Root node has depth 0
   */
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

  /**
   * Get the depth of a specific node (public accessor)
   */
  getNodeDepth(nodeId: string): number {
    return this._calculateDepth(nodeId);
  }

  // ==========================================================================
  // ZOOM AND PAN
  // ==========================================================================
  
  /** Zoom in by shrinking viewBox */
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

  /** Zoom out by expanding viewBox */
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

  /** Reset zoom to default view */
  resetZoom(): void {
    this._viewBox.set({ x: -200, y: -40, w: 700, h: 500, width: 700, height: 500 });
  }

  /** Center view on a specific node */
  private _centerViewOnNode(nodeId: string): void {
    const position = this._nodePositions()[nodeId];
    if (!position) return;

    const vb = this._viewBox();
    const centerX = position.x + TREE_CONFIG.nodeWidth / 2 - vb.w / 2;
    const centerY = position.y + TREE_CONFIG.nodeHeight / 2 - vb.h / 2 - 60;

    this._viewBox.update(v => ({ ...v, x: centerX, y: centerY }));
  }

  /** Center view on current node */
  centerOnCurrentNode(): void {
    this._centerViewOnNode(this._currentNodeId());
  }

  /**
   * Center view on a specific node by ID
   * Alias for external callers
   */
  centerOn(nodeId: string): void {
    this._centerViewOnNode(nodeId);
  }

  /**
   * Navigate to a node - alias for navigateToNode
   * Compatibility method
   */
  navTo(nodeId: string): void {
    this.navigateToNode(nodeId);
  }

  /** Get viewBox as SVG string */
  getViewBoxString(): string {
    const vb = this._viewBox();
    return `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
  }

  // ==========================================================================
  // VIEW MODEL HELPERS FOR COMPONENTS
  // ==========================================================================
  
  /** Get color scheme for node depth */
  getColorsForDepth(depth: number) {
    return DEPTH_COLORS[depth % DEPTH_COLORS.length];
  }

  /** Get all tree edges for SVG rendering */
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
    const currentId = this._currentNodeId();
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
