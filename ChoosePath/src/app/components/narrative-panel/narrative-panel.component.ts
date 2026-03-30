import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface NarrativeEvent {
  type: 'enemy' | 'event' | 'warning' | 'mystery' | 'memory';
  who: string;
  description: string;
}

export interface DepthPip {
  done: boolean;
  here: boolean;
}

@Component({
  selector: 'app-narrative-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './narrative-panel.component.html',
  styleUrls: ['./narrative-panel.component.css'],
})
export class NarrativePanelComponent {
  // Use input() for reactive inputs
  currentLabel = input.required<string>();
  currentScene = input.required<string>();
  currentEvents = input.required<NarrativeEvent[]>();
  depthPips = input.required<DepthPip[]>();
  depth = input.required<number>();
}
