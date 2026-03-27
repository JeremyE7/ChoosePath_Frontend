import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Choice {
  key: string;
  text: string;
}

@Component({
  selector: 'app-choice-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './choice-panel.component.html',
  styleUrls: ['./choice-panel.component.css'],
})
export class ChoicePanelComponent {
  // Use input() for reactive inputs
  choices = input.required<Choice[]>();
  hasMemory = input.required<(text: string) => boolean>();

  // Emits when drag starts with the choice text
  choiceDragStart = output<string>();

  onChoiceMouseDown(e: MouseEvent, choiceText: string): void {
    if (e.button !== 0) return;
    e.preventDefault();
    this.choiceDragStart.emit(choiceText);
  }

  onChoiceKeyDown(e: KeyboardEvent, choiceText: string): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Emit a special event to commit the choice directly
      this.choiceDragStart.emit(choiceText);
    }
  }
}
