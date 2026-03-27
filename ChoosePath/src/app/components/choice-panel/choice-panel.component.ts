import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Choice } from '../../models/story.model';

export type { Choice };

@Component({
  selector: 'app-choice-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './choice-panel.component.html',
  styleUrls: ['./choice-panel.component.css'],
})
export class ChoicePanelComponent {
  choices = input.required<Choice[]>();
  hasMemory = input.required<(text: string) => boolean>();

  choiceDragStart = output<Choice>();

  onChoiceMouseDown(e: MouseEvent, choice: Choice): void {
    if (e.button !== 0 || !choice.nextNodeId) return;
    e.preventDefault();
    this.choiceDragStart.emit(choice);
  }
}
