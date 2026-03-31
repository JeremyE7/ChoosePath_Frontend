import { Component, computed, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MemoryService, MemoryEntry } from '../../services/memory.service';

@Component({
  selector: 'app-memory-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './memory-panel.component.html',
  styleUrls: ['./memory-panel.component.css'],
})
export class MemoryPanelComponent {
  private readonly memoryService = inject(MemoryService);

  // Panel expandido/colapsado
  readonly isExpanded = signal(true);

  // Todas las memorias recopiladas
  readonly allMemories = computed(() => this.memoryService.getAllMemories());

  // Toggle del panel
  togglePanel(): void {
    this.isExpanded.update(v => !v);
  }
}
