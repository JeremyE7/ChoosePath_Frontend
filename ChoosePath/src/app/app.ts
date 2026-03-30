/**
 * App - Root component
 * Game with death mechanic, scoreboard, backtracking, and AI continuation
 */
import {
  Component,
  signal,
  computed,
  inject,
  effect,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import gsap from 'gsap';
import { StoryService } from './services/story.service';
import { MemoryService } from './services/memory.service';
import { ScoreService } from './services/score.service';
import { NarratorService } from './services/narrator.service';
import { Choice, ScoreEntry } from './models/story.model';

// Components
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TreeCanvasComponent, TreePreviewNode } from './components/tree-canvas/tree-canvas.component';
import { NarrativePanelComponent } from './components/narrative-panel/narrative-panel.component';
import { ChoicePanelComponent } from './components/choice-panel/choice-panel.component';
import { MemoryNotificationComponent } from './components/memory-notification/memory-notification.component';
import { ToastComponent } from './components/toast/toast.component';
import { StartScreenComponent } from './components/start-screen/start-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LucideAngularModule,
    HeaderComponent,
    SidebarComponent,
    TreeCanvasComponent,
    NarrativePanelComponent,
    ChoicePanelComponent,
    MemoryNotificationComponent,
    ToastComponent,
    StartScreenComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  private readonly storyService = inject(StoryService);
  private readonly memoryService = inject(MemoryService);
  private readonly scoreService = inject(ScoreService);
  private readonly narratorService = inject(NarratorService);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild(TreeCanvasComponent) treeCanvasComponent!: TreeCanvasComponent;

  // Drag state
  private _isDragging = false;
  private _dragChoice: Choice | null = null;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragMoved = false;
  private _dragSnap = false;

  // ==========================================================================
  // GAME STATE
  // ==========================================================================

  readonly gamePhase = signal<'start' | 'playing' | 'dead'>('start');
  readonly playerNickname = signal('');
  readonly topScores = signal<ScoreEntry[]>([]);
  readonly scoreSaved = signal(false);

  // ==========================================================================
  // STATE SIGNALS
  // ==========================================================================

  readonly memoryCount = this.memoryService.memoryCount;
  readonly nodeCount = this.storyService.nodeCount;
  readonly maxDepth = this.storyService.maxDepth;
  readonly branches = this.storyService.branchCount;
  readonly currentLabel = this.storyService.currentLabel;
  readonly currentScene = this.storyService.currentScene;
  readonly viewBoxString = computed(() => this.storyService.getViewBoxString());
  readonly loading = this.storyService.loading;
  readonly isPlayerDead = this.storyService.isPlayerDead;
  readonly playerScore = this.storyService.maxDepthEverReached;
  readonly storyTitle = this.storyService.storyTitle;

  // Ghost signals
  readonly ghostText = signal('');
  readonly ghostPosition = signal({ x: 0, y: 0 });
  readonly ghostVisible = signal(false);
  readonly ghostSnap = signal(false);

  // Toast
  readonly toastVisible = signal(false);
  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');

  // Loading state for preview node selection
  readonly loadingNodeId = signal<string | null>(null);

  // Hint - solo visible cuando no hay nodos o es el primer nodo
  readonly hintVisible = computed(() => {
    return this.nodeCount() <= 1 && this.gamePhase() === 'playing';
  });

  private readonly _deathAnimation = effect(() => {
    if (this.gamePhase() !== 'dead' || !isPlatformBrowser(this.platformId)) return;
    queueMicrotask(() => {
      const panel = document.querySelector('.death-panel');
      if (!panel) return;
      const icon = panel.querySelector('.death-icon');
      const title = panel.querySelector('.death-title');
      const details = panel.querySelectorAll('.death-score, .death-nickname');
      const btns = panel.querySelectorAll('.death-btn');

      const cp = { clearProps: 'all' };
      gsap.timeline({ defaults: cp })
        .from(panel, { opacity: 0, duration: 0.2 })
        .from(icon, { scale: 0, rotation: -15, duration: 0.55, ease: 'back.out(2)' }, '-=0.1')
        .from(title, { y: 12, opacity: 0, duration: 0.3 }, '-=0.25')
        .from(details, { y: 8, opacity: 0, stagger: 0.08, duration: 0.25 }, '-=0.15')
        .from(btns, { y: 8, opacity: 0, stagger: 0.1, duration: 0.3 }, '-=0.1');
    });
  });

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  // Death stats for death screen
  readonly deathStats = computed(() => ({
    score: this.playerScore(),
    nodes: this.nodeCount(),
    branches: this.branches(),
    memories: this.memoryCount(),
    racha: this.narratorService.getRacha(),
    narrator: this.narratorService.getNarratorName(),
  }));

  readonly memoryLogEntries = computed(() => this.memoryService.renderMemLog());

  readonly currentNode = this.storyService.currentNode;

  readonly currentNodeChoices = computed<Choice[]>(() => {
    if (this.isPlayerDead()) return [];
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

    const DEATH_COLOR = { fill: 'rgba(240,86,122,.18)', stroke: '#f0567a', txt: '#b03050' };

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
      const isDeath = node.isDeath === true;
      const color = isDeath ? DEATH_COLOR : COLORS[depth % COLORS.length];

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
        isDeath,
        color,
        fill: isCurrent ? color.fill : isOnPath ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.5)',
        stroke: isDeath
          ? '#f0567a'
          : isCurrent
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
        const childNode = nodes[cid];
        const isDeath = childNode?.isDeath === true;
        const on =
          this.storyService.isOnCurrentPath(nodeId) && this.storyService.isOnCurrentPath(cid);
        const mid = (p.y + NH + cp.y) / 2;

        edges.push({
          id: `${nodeId}-${cid}`,
          path: `M${p.x + NW / 2},${p.y + NH} C${p.x + NW / 2},${mid} ${cp.x + NW / 2},${mid} ${cp.x + NW / 2},${cp.y}`,
          stroke: isDeath ? '#f0567a' : on ? '#4a7cf7' : 'rgba(120,140,200,.28)',
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

  // Preview nodes - choice options shown directly on tree (same visual style as real nodes)
  readonly previewNodes = computed<TreePreviewNode[]>(() => {
    const choices = this.currentNodeChoices();
    
    // Don't show preview if no choices OR player is dead
    // Note: We show preview even if node has children (they're the uncreated choices)
    if (choices.length === 0 || this.isPlayerDead()) return [];

    const currentPos = this.storyService.nodePositions()[this.storyService.currentNodeId()];
    if (!currentPos) return [];

    // Use same tree config as real nodes
    const NW = 122;
    const NH = 33;
    const H_GAP = 42;
    const V_GAP = 70;
    const currentDepth = this.maxDepth();
    const nextDepth = currentDepth + 1;
    
    const COLORS = [
      { fill: 'rgba(74,124,247,.12)', stroke: '#4a7cf7', txt: '#2556e0' },
      { fill: 'rgba(14,184,160,.1)', stroke: '#0eb8a0', txt: '#087060' },
      { fill: 'rgba(139,92,246,.1)', stroke: '#8b5cf6', txt: '#6030c0' },
      { fill: 'rgba(245,158,11,.1)', stroke: '#f59e0b', txt: '#a06000' },
      { fill: 'rgba(240,86,122,.1)', stroke: '#f0567a', txt: '#b03050' },
      { fill: 'rgba(16,185,129,.1)', stroke: '#10b981', txt: '#077050' },
    ];
    
    const color = COLORS[nextDepth % COLORS.length];
    
    // Center X - position relative to parent center
    const parentCenterX = currentPos.x + NW / 2;

    // Calculate total width for children and center them under parent
    const totalWidth = choices.length * NW + (choices.length - 1) * H_GAP;
    const startX = parentCenterX - totalWidth / 2;

    const loadingId = this.loadingNodeId();
    
    return choices.map((choice, i) => {
      // Same positioning logic as real tree nodes
      const x = startX + i * (NW + H_GAP);
      // Position below parent node - all at same Y level
      const y = currentPos.y + NH + 50;
      
      const isLoading = loadingId !== null;
      const isThisLoading = loadingId === `preview-${choice.key}`;

      return {
        id: `preview-${choice.key}`,
        choiceKey: choice.key,
        choice,
        label: choice.text,
        displayLabel: choice.text.length > 14 ? choice.text.slice(0, 13) + '...' : choice.text,
        depth: nextDepth,
        x,
        y,
        width: NW,
        height: NH,
        color,
        fill: isThisLoading ? color.fill : (isLoading ? 'rgba(255,255,255,0.25)' : color.fill),
        stroke: color.stroke,
        strokeWidth: isThisLoading ? '2.2' : '1.4',
        textFill: isThisLoading ? color.txt : (isLoading ? 'rgba(0,0,0,0.3)' : color.txt),
        isSelected: isThisLoading,
        isDisabled: isLoading && !isThisLoading,
      };
    });
  });

  // Preview edges - connections from parent to preview nodes
  readonly previewEdges = computed(() => {
    const previews = this.previewNodes();
    if (previews.length === 0) return [];

    const currentPos = this.storyService.nodePositions()[this.storyService.currentNodeId()];
    if (!currentPos) return [];

    const NW = 122;
    const NH = 33;
    
    // Start from bottom center of current node (parent)
    const fromX = currentPos.x + NW / 2;
    const fromY = currentPos.y + NH;

    const edges = previews.map((preview, i) => {
      // End at top center of preview node
      const endX = preview.x + NW / 2;
      const endY = preview.y;
      
      // Curved bezier line - same style as real tree edges
      const midY = (fromY + endY) / 2;
      const path = `M${fromX},${fromY} C${fromX},${midY} ${endX},${midY} ${endX},${endY}`;
      
      return {
        id: `preview-edge-${preview.choiceKey}`,
        path,
        stroke: '#4a7cf7', // Same blue as regular edges on path
        strokeWidth: '1.8',
        markerEnd: 'url(#ahb)',
        isNew: false, // Don't use animation - just show normally
      };
    });
    return edges;
  });

  hasMemoryFn = (text: string): boolean => {
    return this.memoryService.hasMem(text);
  };

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  ngOnInit(): void {
    this._loadTopScores();
    this._tryRestoreGame();
  }

  private _tryRestoreGame(): void {
    if (this.storyService.hasSavedGame()) {
      const restored = this.storyService.restoreGameState();
      if (restored) {
        // Restore player info from localStorage
        const savedNickname = localStorage.getItem('choosepath_player_nickname');
        if (savedNickname) {
          this.playerNickname.set(savedNickname);
          this.gamePhase.set('playing');
          this.scoreSaved.set(false);
        }
      }
    }
  }

  // ==========================================================================
  // GAME FLOW
  // ==========================================================================

  onGameStart(data: { nickname: string; theme: string; genre: string; tone: string }): void {
    this.playerNickname.set(data.nickname);
    this.scoreSaved.set(false);

    if (isPlatformBrowser(this.platformId)) {
      const landing = document.querySelector('.landing');
      if (landing) {
        gsap.to(landing, {
          opacity: 0,
          scale: 0.97,
          duration: 0.35,
          ease: 'power2.in',
          onComplete: () => this._initGame(data),
        });
        return;
      }
    }
    this._initGame(data);
  }

  private _initGame(data: { nickname: string; theme: string; genre: string; tone: string }): void {
    this.gamePhase.set('playing');
    this.storyService.clearSavedGame();
    this.storyService.resetStory();
    this.memoryService.clearMemories();
    localStorage.setItem('choosepath_player_nickname', data.nickname);

    // Initialize narrator with story context
    this.narratorService.setStoryContext(data.genre, data.tone);

    this.storyService.loadStory(
      { genre: data.genre, language: 'Español', theme: data.theme, tone: data.tone },
      (error: string) => {
        this.showToast(error, 'error');
        this.gamePhase.set('start');
      },
    );

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const header = document.querySelector('app-header');
        const treebar = document.querySelector('.tree-bar');
        const rpWrap = document.querySelector('.rp-wrap');

        const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'all' } });
        if (header) tl.from(header, { y: -36, opacity: 0, duration: 0.42 });
        if (treebar) tl.from(treebar, { y: -10, opacity: 0, duration: 0.32 }, '-=0.22');
        if (rpWrap) tl.from(rpWrap, { x: 22, opacity: 0, duration: 0.42 }, '-=0.28');
      }, 80);
    }
  }

  onSaveScore(): void {
    if (this.scoreSaved()) return;
    console.log(this.storyService.storyTitle(), this.playerNickname(), this.playerScore());
    this.scoreService
      .saveScore(this.playerNickname(), this.playerScore(), this.storyTitle())
      .subscribe({
        next: () => {
          this.scoreSaved.set(true);
          this._loadTopScores();
          this.showToast('Score guardado');
        },
        error: (err) => {
          console.error('Failed to save score:', err);
          this.showToast('Error al guardar score. Intenta nuevamente.', 'error');
        },
      });
  }

  onPlayAgain(): void {
    this.gamePhase.set('start');
    this.storyService.resetStory();
    this.storyService.clearSavedGame();
    this.memoryService.clearMemories();
    localStorage.removeItem('choosepath_player_nickname');
  }

  private _loadTopScores(): void {
    this.scoreService.getTopScores().subscribe({
      next: (scores) => this.topScores.set(scores),
      error: () => {},
    });
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

  onZoom(direction: 'in' | 'out'): void {
    if (direction === 'in') {
      this.onZoomIn();
    } else {
      this.onZoomOut();
    }
  }

  onCanvasPan(delta: { dx: number; dy: number }): void {
    this.storyService.panViewBox(delta.dx, delta.dy);
  }

  onNodeClick(nodeId: string): void {
    // Navigation to previous nodes is disabled - no backtracking allowed
    // Only the current node is clickable for visual feedback
    return;
  }

  /** Handle click on a preview/choice node shown on tree */
  onPreviewClick(choice: Choice): void {
    if (this.loading() || this.isPlayerDead()) return;
    // Set loading state on the clicked preview node
    this.loadingNodeId.set(`preview-${choice.key}`);
    this.commitChoice(choice);
  }

  onChoiceDragStart(choice: Choice): void {
    if (this.loading() || this.isPlayerDead()) return;

    if (this._isDragging && this._dragChoice?.nextNodeId === choice.nextNodeId && this._dragMoved) {
      this.commitChoice(choice);
      return;
    }

    this._isDragging = true;
    this._dragChoice = choice;
    this._dragMoved = false;
    this._dragSnap = false;
    this.ghostText.set(choice.text);

    const onMouseMove = (e: MouseEvent) => {
      if (!this._isDragging) return;

      const canvasEl = this.treeCanvasComponent.getCanvasElement().nativeElement;
      const rect = canvasEl.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;

      const vb = this.storyService.viewBox();

      const mouseCanvasX = e.clientX - rect.left;
      const mouseCanvasY = e.clientY - rect.top;

      const svgX = vb.x + (mouseCanvasX / canvasWidth) * vb.w;
      const svgY = vb.y + (mouseCanvasY / canvasHeight) * vb.h;

      if (!this._dragMoved) {
        const dragStartCanvasX = this._dragStartX - rect.left;
        const dragStartCanvasY = this._dragStartY - rect.top;
        if (Math.hypot(mouseCanvasX - dragStartCanvasX, mouseCanvasY - dragStartCanvasY) < 5)
          return;
        this._dragMoved = true;
        this.ghostVisible.set(true);
      }

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

      this.ghostPosition.set({ x: e.clientX - 100, y: e.clientY - 20 });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      this.ghostVisible.set(false);
      this.ghostSnap.set(false);
      this._isDragging = false;

      if (this._dragMoved && this._dragSnap && this._dragChoice) {
        this.commitChoice(this._dragChoice);
      }
    };

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

  private async commitChoice(choice: Choice): Promise<void> {
    if (!choice.nextNodeId || this.loading()) return;
    console.log(choice);

    try {
      const newId = await this.storyService.commitChoice(choice, (error: string) => {
        this.showToast(error, 'error');
      });
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

        if (node.isDeath) {
          this.gamePhase.set('dead');
          const deathMessage = this.narratorService.getDeathMessage();
          this.showToast(deathMessage + ' Score: ' + this.playerScore());
        } else {
          // Record safe choice for racha
          this.narratorService.recordSafeChoice();
          
          const advanceMessage = this.narratorService.getAdvanceMessage();
          this.showToast(`"${node.label}" - ${advanceMessage}`);
        }
      }

      // Don't center immediately - let the user see the tree as is
      // setTimeout(() => this.storyService.centerOn(newId), 80);
    } finally {
      // Clear loading state from preview node
      this.loadingNodeId.set(null);
    }
  }

  onReset(): void {
    // Full restart - go back to start screen to choose new story
    this.gamePhase.set('start');
    this.storyService.clearSavedGame();
    this.memoryService.clearMemories();
    this.scoreSaved.set(false);
    this.playerNickname.set('');
    localStorage.removeItem('choosepath_player_nickname');
  }

  onExport(): void {
    this.showToast('Exportando historia...');
  }

  private showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    console.log('Toast:', msg, type);
    this.toastMessage.set(msg);
    this.toastType.set(type);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2400);
  }
}
