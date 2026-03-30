import {
  Component,
  input,
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
  currentLabel = input.required<string>();
  currentScene = input.required<string>();
  currentEvents = input.required<NarrativeEvent[]>();
  depthPips = input.required<DepthPip[]>();
  depth = input.required<number>();

  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _animateScene = effect(() => {
    const scene = this.currentScene();
    if (!isPlatformBrowser(this.platformId) || !scene) return;
    queueMicrotask(() => {
      const root = this.el.nativeElement;
      const locEl = root.querySelector('.nloc');
      const sceneEl = root.querySelector('.nscene');
      const evCards = root.querySelectorAll('.ev-card');

      const tl = gsap.timeline();
      if (locEl) {
        tl.fromTo(locEl, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
      }
      if (sceneEl) {
        tl.fromTo(sceneEl, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', clearProps: 'transform' }, '-=0.1');
      }
      if (evCards.length) {
        tl.fromTo(evCards, { opacity: 0, x: -10 }, { opacity: 1, x: 0, stagger: 0.07, duration: 0.3, ease: 'power2.out', clearProps: 'transform' }, '-=0.2');
      }
    });
  });
}
