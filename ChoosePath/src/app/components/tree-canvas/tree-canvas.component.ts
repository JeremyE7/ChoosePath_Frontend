import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

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

@Component({
  selector: 'app-tree-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './tree-canvas.component.html',
  styleUrls: ['./tree-canvas.component.css'],
})
export class TreeCanvasComponent {
  @ViewChild('treeCanvas') treeCanvasRef!: ElementRef<HTMLElement>;

  // Use input() for reactive inputs
  treeNodes = input.required<TreeNode[]>();
  treeEdges = input.required<TreeEdge[]>();
  viewBoxString = input.required<string>();
  hintVisible = input.required<boolean>();
  currentNodeChildren = input.required<string[]>();
  ghostStubPaths = input.required<string[]>();

  // Outputs
  nodeClick = output<string>();

  onNodeClick(nodeId: string): void {
    this.nodeClick.emit(nodeId);
  }

  getCanvasElement(): ElementRef<HTMLElement> {
    return this.treeCanvasRef;
  }
}
