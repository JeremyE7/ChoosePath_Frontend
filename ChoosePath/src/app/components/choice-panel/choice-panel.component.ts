import {
  Component,
  input,
  output,
  effect,
  inject,
  ElementRef,
  ChangeDetectionStrategy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import gsap from 'gsap';
import { Choice } from '../../models/story.model';

export type { Choice };

@Component({
  selector: 'app-choice-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './choice-panel.component.html',
  styleUrls: ['./choice-panel.component.css'],
})
export class ChoicePanelComponent {
  choices = input.required<Choice[]>();
  hasMemory = input.required<(text: string) => boolean>();

  choiceDragStart = output<Choice>();

  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _animateChoices = effect(() => {
    const cs = this.choices();
    if (!isPlatformBrowser(this.platformId) || cs.length === 0) return;
    queueMicrotask(() => {
      const cards = this.el.nativeElement.querySelectorAll('.cc');
      if (!cards.length) return;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 14, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.38, stagger: 0.07, ease: 'power3.out', clearProps: 'all' },
      );
    });
  });

  onChoiceMouseDown(e: MouseEvent, choice: Choice): void {
    if (e.button !== 0 || !choice.nextNodeId) return;
    e.preventDefault();
    this.choiceDragStart.emit(choice);
  }
}
