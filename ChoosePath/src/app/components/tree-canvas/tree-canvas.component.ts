import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Choice } from '../../models/story.model';

export interface TreeNode {
  id: string;
  label: string;
  displayLabel: string;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isCurrent: boolean;
  isOnPath: boolean;
  isNew: boolean;
  color: { fill: string; stroke: string; txt: string };
  fill: string;
  stroke: string;
  strokeWidth: string;
  textFill: string;
}

export interface TreeEdge {
  id: string;
  path: string;
  stroke: string;
  strokeWidth: string;
  markerEnd: string;
  isNew: boolean;
}

/** Preview node - choice option shown on tree before selection */
export interface TreePreviewNode {
  id: string;
  choiceKey: string;
  choice: Choice;
  label: string;
  displayLines: string[];
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: { fill: string; stroke: string; txt: string };
  fill: string;
  stroke: string;
  strokeWidth: string;
  textFill: string;
  isSelected: boolean;
  isDisabled: boolean;
  /** Ghost node = unchosen choice that persists in the tree */
  isGhost: boolean;
  /** Parent node ID - used by ghost nodes to draw edges */
  parentNodeId?: string;
}

@Component({
  selector: 'app-tree-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './tree-canvas.component.html',
  styleUrls: ['./tree-canvas.component.css'],
  host: { '[class.panning]': 'isPanning()' },
})
export class TreeCanvasComponent {
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('treeCanvas') treeCanvasRef!: ElementRef<HTMLElement>;

  treeNodes = input.required<TreeNode[]>();
  treeEdges = input.required<TreeEdge[]>();
  viewBoxString = input.required<string>();
  hintVisible = input.required<boolean>();
  currentNodeChildren = input.required<string[]>();
  
  // Preview nodes - choice options shown on tree before selection
  previewNodes = input<TreePreviewNode[]>([]);
  previewEdges = input<TreeEdge[]>([]);
  /** ID of the preview node that is currently loading (being selected) */
  loadingNodeId = input<string | null>(null);

  nodeClick = output<string>();
  /** Emits when user clicks on a preview/choice node on the tree */
  previewClick = output<Choice>();
  /** Emits pan delta in SVG coordinate units */
  pan = output<{ dx: number; dy: number }>();
  /** Emits zoom direction: 'in' or 'out' */
  zoom = output<'in' | 'out'>();

  readonly isPanning = signal(false);
  readonly tooltip = signal<{ text: string; x: number; y: number } | null>(null);

  private _lastX = 0;
  private _lastY = 0;

  @HostListener('window:wheel', ['$event'])
  onWheel(e: WheelEvent): void {
    // Only handle Alt + scroll for zoom
    if (e.altKey) {
      console.log('Alt + scroll:', e.deltaY);
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoom.emit('in');
      } else {
        this.zoom.emit('out');
      }
      this.cdr.detectChanges();
    }
  }

  onNodeClick(nodeId: string): void {
    this.nodeClick.emit(nodeId);
  }

  onPreviewClick(preview: TreePreviewNode): void {
    if (preview.isDisabled) return;
    this.previewClick.emit(preview.choice);
  }

  showNodeTooltip(node: TreeNode): void {
    if (this.isPanning() || node.displayLabel === node.label) return;
    const pos = this._svgToCanvas(node.x + node.width / 2, node.y);
    this.tooltip.set({ text: node.label, x: pos.x, y: pos.y });
  }

  showPreviewTooltip(node: TreePreviewNode): void {
    if (this.isPanning()) return;
    const pos = this._svgToCanvas(node.x + node.width / 2, node.y);
    this.tooltip.set({ text: node.choice.text, x: pos.x, y: pos.y });
  }

  hideTooltip(): void {
    this.tooltip.set(null);
  }

  /** Convert SVG user-space coordinates to CSS pixels relative to the canvas element. */
  private _svgToCanvas(svgX: number, svgY: number): { x: number; y: number } {
    const rect = this.treeCanvasRef.nativeElement.getBoundingClientRect();
    const [vbX, vbY, vbW, vbH] = this.viewBoxString().split(' ').map(Number);
    return {
      x: (svgX - vbX) * (rect.width / vbW),
      y: (svgY - vbY) * (rect.height / vbH),
    };
  }

  onSvgMouseDown(e: MouseEvent): void {
    // Only left-click, and not on an interactive node
    if (e.button !== 0) return;
    if ((e.target as Element).closest('.tree-node')) return;

    this.hideTooltip();
    e.preventDefault();
    this._lastX = e.clientX;
    this._lastY = e.clientY;
    this.isPanning.set(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = this.treeCanvasRef.nativeElement.getBoundingClientRect();

      // Parse current viewBox to get the SVG-to-pixel scale
      const [, , vbW, vbH] = this.viewBoxString().split(' ').map(Number);
      const scaleX = vbW / rect.width;
      const scaleY = vbH / rect.height;

      // Dragging right → content moves right → viewBox shifts left (dx is negative)
      const dx = (moveEvent.clientX - this._lastX) * scaleX * -1;
      const dy = (moveEvent.clientY - this._lastY) * scaleY * -1;

      this._lastX = moveEvent.clientX;
      this._lastY = moveEvent.clientY;

      this.pan.emit({ dx, dy });
    };

    const onMouseUp = () => {
      this.isPanning.set(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  getCanvasElement(): ElementRef<HTMLElement> {
    return this.treeCanvasRef;
  }
}
