import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MemoryNotification {
  who: string;
  txt: string;
}

@Component({
  selector: 'app-memory-notification',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './memory-notification.component.html',
  styleUrls: ['./memory-notification.component.css'],
})
export class MemoryNotificationComponent {
  // Use input() for reactive inputs
  notifications = input.required<MemoryNotification[]>();
}
