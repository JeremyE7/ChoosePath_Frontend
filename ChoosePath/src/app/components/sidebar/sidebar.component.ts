import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ScoreEntry } from '../../models/story.model';

export interface MemoryEntry {
  who: string;
  txt: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  memoryLogEntries = input.required<MemoryEntry[]>();
  memoryCount = input.required<number>();
  topScores = input<ScoreEntry[]>([]);
  playerNickname = input<string>('');
  currentScore = input<number>(0);
  isGameActive = input<boolean>(false);

  reset = output<void>();
  export = output<void>();
}
