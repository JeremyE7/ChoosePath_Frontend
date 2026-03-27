import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  // Use input() for reactive inputs
  memoryLogEntries = input.required<MemoryEntry[]>();
  memoryCount = input.required<number>();

  reset = output<void>();
  export = output<void>();
}
