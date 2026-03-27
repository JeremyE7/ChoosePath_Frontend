import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { MemoryService } from '../../services/memory.service';

@Component({
  selector: 'app-memory-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './memory-notification.component.html',
  styleUrls: ['./memory-notification.component.css'],
})
export class MemoryNotificationComponent {
  private readonly memoryService = inject(MemoryService);

  /** First item in queue — the one currently on screen */
  readonly current = computed(() => this.memoryService.notificationQueue()[0] ?? null);

  /** True while showing, false while playing exit animation */
  readonly isVisible = this.memoryService.showingNotification;
}
