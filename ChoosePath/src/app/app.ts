/**
 * App - Root component
 * Main layout with header, sidebar, center, right panel
 * Now split into smaller, focused components
 */
import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoryService } from './services/story.service';
import { MemoryService } from './services/memory.service';
import { Choice } from './models/story.model';

// Components
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TreeCanvasComponent } from './components/tree-canvas/tree-canvas.component';
import { NarrativePanelComponent } from './components/narrative-panel/narrative-panel.component';
import { ChoicePanelComponent } from './components/choice-panel/choice-panel.component';
import { MemoryNotificationComponent } from './components/memory-notification/memory-notification.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    TreeCanvasComponent,
    NarrativePanelComponent,
    ChoicePanelComponent,
    MemoryNotificationComponent,
    ToastComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  private readonly storyService = inject(StoryService);
  private readonly memoryService = inject(MemoryService);

  // ViewChild for tree canvas element
  @ViewChild(TreeCanvasComponent) treeCanvasComponent!: TreeCanvasComponent;

  // Drag state
  private _isDragging = false;
  private _dragChoice: Choice | null = null;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragMoved = false;
  private _dragSnap = false;

  // ==========================================================================
  // STATE SIGNALS (exposed to child components)
  // ==========================================================================

  readonly memoryCount = this.memoryService.memoryCount;
  readonly nodeCount = this.storyService.nodeCount;
  readonly maxDepth = this.storyService.maxDepth;
  readonly branches = this.storyService.branchCount;
  readonly currentLabel = this.storyService.currentLabel;
  readonly currentScene = this.storyService.currentScene;
  readonly viewBoxString = computed(() => this.storyService.getViewBoxString());

  // Ghost signals
  readonly ghostText = signal('');
  readonly ghostPosition = signal({ x: 0, y: 0 });
  readonly ghostVisible = signal(false);
  readonly ghostSnap = signal(false);

  // Toast
  readonly toastVisible = signal(false);
  readonly toastMessage = signal('');

  // Hint
  readonly hintVisible = signal(true);


  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  readonly memoryLogEntries = computed(() => this.memoryService.renderMemLog());

  readonly currentNode = this.storyService.currentNode;

  readonly currentNodeChoices = computed<Choice[]>(() => {
    const node = this.currentNode();
    return node?.choices || [];
  });

  readonly currentNodeChildren = computed(() => {
    const node = this.currentNode();
    return node?.childIds || [];
  });

  readonly currentEvents = computed(() => {
    const node = this.currentNode();
    return node?.events || [];
  });

  // Tree rendering
  readonly treeNodes = computed(() => {
    const nodes = this.storyService.nodes();
    const currentId = this.storyService.currentNodeId();
    const positions = this.storyService.nodePositions();
    const NW = 122;
    const NH = 33;
    const COLORS = [
      { fill: 'rgba(74,124,247,.12)', stroke: '#4a7cf7', txt: '#2556e0' },
      { fill: 'rgba(14,184,160,.1)', stroke: '#0eb8a0', txt: '#087060' },
      { fill: 'rgba(139,92,246,.1)', stroke: '#8b5cf6', txt: '#6030c0' },
      { fill: 'rgba(245,158,11,.1)', stroke: '#f59e0b', txt: '#a06000' },
      { fill: 'rgba(240,86,122,.1)', stroke: '#f0567a', txt: '#b03050' },
      { fill: 'rgba(16,185,129,.1)', stroke: '#10b981', txt: '#077050' },
    ];

    const getNodeDepth = (nodeId: string): number => {
      if (nodeId === 'root') return 0;
      let depth = 0;
      let current = nodeId;
      while (current !== 'root') {
        const parent = this.storyService.findParentNode(current);
        if (!parent) break;
        depth++;
        current = parent;
      }
      return depth;
    };

    return Object.values(nodes).map((node) => {
      const pos = positions[node.id];
      const isCurrent = node.id === currentId;
      const isOnPath = this.storyService.isOnCurrentPath(node.id);
      const depth = getNodeDepth(node.id);
      const color = COLORS[depth % COLORS.length];

      return {
        id: node.id,
        label: node.label,
        displayLabel: node.label.length > 14 ? node.label.slice(0, 13) + '...' : node.label,
        depth,
        x: pos?.x || 0,
        y: pos?.y || 0,
        width: NW,
        height: NH,
        isCurrent,
        isOnPath,
        isNew: false,
        color,
        fill: isCurrent ? color.fill : isOnPath ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.5)',
        stroke: isCurrent
          ? color.stroke
          : isOnPath
            ? 'rgba(120,140,200,.5)'
            : 'rgba(180,190,220,.4)',
        strokeWidth: isCurrent ? '1.6' : isOnPath ? '1.2' : '0.8',
        textFill: isCurrent ? color.txt : isOnPath ? '#384060' : '#9aa0c0',
      };
    });
  });

  readonly treeEdges = computed(() => {
    const nodes = this.storyService.nodes();
    const positions = this.storyService.nodePositions();
    const NW = 122;
    const NH = 33;

    const edges: {
      id: string;
      path: string;
      stroke: string;
      strokeWidth: string;
      markerEnd: string;
      isNew: boolean;
    }[] = [];

    const processNode = (nodeId: string) => {
      const node = nodes[nodeId];
      if (!node) return;
      const p = positions[nodeId];
      if (!p) return;

      (node.childIds || []).forEach((cid) => {
        const cp = positions[cid];
        if (!cp) return;
        const on =
          this.storyService.isOnCurrentPath(nodeId) && this.storyService.isOnCurrentPath(cid);
        const mid = (p.y + NH + cp.y) / 2;

        edges.push({
          id: `${nodeId}-${cid}`,
          path: `M${p.x + NW / 2},${p.y + NH} C${p.x + NW / 2},${mid} ${cp.x + NW / 2},${mid} ${cp.x + NW / 2},${cp.y}`,
          stroke: on ? '#4a7cf7' : 'rgba(120,140,200,.28)',
          strokeWidth: on ? '1.8' : '1',
          markerEnd: on ? 'url(#ahb)' : 'url(#ah)',
          isNew: false,
        });

        processNode(cid);
      });
    };

    processNode('root');
    return edges;
  });

  readonly depthPips = computed(() => {
    const total = Math.max(this.maxDepth() + 2, 6);
    const current = this.maxDepth();
    return Array.from({ length: total }, (_, i) => ({
      done: i < current,
      here: i === current,
    }));
  });

  // Ghost stub paths for rendering
  readonly ghostStubPaths = computed(() => {
    const choices = this.currentNodeChoices();
    const n = choices.length;
    if (n === 0) return [];

    const currentPos = this.storyService.nodePositions()[this.storyService.currentNodeId()];
    if (!currentPos) return [];

    const NW = 122;
    const NH = 33;
    const cx = currentPos.x + NW / 2;
    const cy = currentPos.y + NH;

    return choices.map((_, i) => {
      const ang = (i - (n - 1) / 2) * 0.34;
      const ex = cx + Math.sin(ang) * 50;
      const ey = cy + 34;
      return `M${cx},${cy} Q${cx + (ex - cx) * 0.5},${cy + 13} ${ex},${ey}`;
    });
  });

  // Function for hasMemory check
  hasMemoryFn = (text: string): boolean => {
    return this.memoryService.hasMem(text);
  };

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  ngOnInit(): void {
    this.storyService.loadStory('el-galeon-de-la-niebla');
  }

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  onZoomIn(): void {
    this.storyService.zoomIn();
  }

  onZoomOut(): void {
    this.storyService.zoomOut();
  }

  onZoomFit(): void {
    this.storyService.resetZoom();
  }

  onCanvasPan(delta: { dx: number; dy: number }): void {
    this.storyService.panViewBox(delta.dx, delta.dy);
  }

  onNodeClick(nodeId: string): void {
    const node = this.storyService.nodes()[nodeId];
    if (node && node.id !== this.storyService.currentNodeId() && (node.childIds || []).length > 0) {
      this.storyService.navTo(nodeId);
    }
  }

  onChoiceDragStart(choice: Choice): void {
    // Check if this is a keyboard-initiated "commit" (same choice twice quickly)
    if (this._isDragging && this._dragChoice?.nextNodeId === choice.nextNodeId && this._dragMoved) {
      this.commitChoice(choice);
      return;
    }

    // Start drag operation
    this._isDragging = true;
    this._dragChoice = choice;
    this._dragMoved = false;
    this._dragSnap = false;
    this.ghostText.set(choice.text);
    this.hintVisible.set(false);

    const onMouseMove = (e: MouseEvent) => {
      if (!this._isDragging) return;

      const canvasEl = this.treeCanvasComponent.getCanvasElement().nativeElement;
      const rect = canvasEl.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;

      // Get viewBox for coordinate transformation
      const vb = this.storyService.viewBox();

      // Convert mouse position from screen to canvas-relative
      const mouseCanvasX = e.clientX - rect.left;
      const mouseCanvasY = e.clientY - rect.top;

      // Convert canvas pixels to SVG coordinate space
      const svgX = vb.x + (mouseCanvasX / canvasWidth) * vb.w;
      const svgY = vb.y + (mouseCanvasY / canvasHeight) * vb.h;

      // Check if we've moved enough to start dragging
      if (!this._dragMoved) {
        const dragStartCanvasX = this._dragStartX - rect.left;
        const dragStartCanvasY = this._dragStartY - rect.top;
        if (Math.hypot(mouseCanvasX - dragStartCanvasX, mouseCanvasY - dragStartCanvasY) < 5)
          return;
        this._dragMoved = true;
        this.ghostVisible.set(true);
      }

      // Get current node position in SVG coordinates
      const currentId = this.storyService.currentNodeId();
      const pos = this.storyService.nodePositions()[currentId];

      if (pos) {
        const NW = 122;
        const NH = 33;
        const nodeSvgX = pos.x + NW / 2;
        const nodeSvgY = pos.y + NH / 2;

        const dist = Math.hypot(svgX - nodeSvgX, svgY - nodeSvgY);

        if (dist < 80 && !this._dragSnap) {
          this._dragSnap = true;
          this.ghostSnap.set(true);
        } else if (dist >= 80 && this._dragSnap) {
          this._dragSnap = false;
          this.ghostSnap.set(false);
        }
      }

      // Position ghost at screen coordinates
      this.ghostPosition.set({ x: e.clientX - 100, y: e.clientY - 20 });
    };

    const onMouseUp = (e: MouseEvent) => {
      // Get the position where mouse was released
      const canvasEl = this.treeCanvasComponent.getCanvasElement().nativeElement;
      const rect = canvasEl.getBoundingClientRect();

      // Check if mouse was released over the tree canvas
      const isOverCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      this.ghostVisible.set(false);
      this.ghostSnap.set(false);
      this._isDragging = false;

      // Check if we should commit: moved and either snapped or released over canvas
      if (this._dragMoved && this._dragSnap && this._dragChoice) {
        this.commitChoice(this._dragChoice);
      }
    };

    // Set up initial drag position and add listeners
    this._dragStartX = 0;
    this._dragStartY = 0;

    const startDrag = (e: MouseEvent) => {
      this._dragStartX = e.clientX;
      this._dragStartY = e.clientY;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousedown', startDrag);
    };

    document.addEventListener('mousedown', startDrag);
  }

  private commitChoice(choice: Choice): void {
    if (!choice.nextNodeId) return;

    const newId = this.storyService.commitChoice(choice.nextNodeId);
    if (!newId) return;

    const node = this.storyService.nodes()[newId];
    if (node) {
      const evs = node.events || [];
      node.memoryKeys?.forEach((k, i) => {
        const ev = evs[i] || evs[0];
        if (ev && ev.who && ev.description) {
          this.memoryService.addMem(k, ev.who, ev.description, node.id);
        }
      });
    }

    this.showToast(`"${this.storyService.nodes()[newId]?.label}" anadido al arbol`);
    setTimeout(() => this.storyService.centerOn(newId), 80);
  }

  onReset(): void {
    this.storyService.resetStory();
    this.memoryService.clearMemories();
    this.showToast('Historia reiniciada');
  }

  onExport(): void {
    this.showToast('Exportando historia...');
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2400);
  }
}
