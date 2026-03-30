import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  LUCIDE_ICONS,
  LucideIconProvider,
  Waypoints,
  Trophy,
  ArrowRight,
  TrendingUp,
  Medal,
  Skull,
  Swords,
  Clock,
  TriangleAlert,
  CircleQuestionMark,
  Bookmark,
  GripVertical,
  MousePointerClick,
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Waypoints,
        Trophy,
        ArrowRight,
        TrendingUp,
        Medal,
        Skull,
        Swords,
        Clock,
        TriangleAlert,
        CircleQuestionMark,
        Bookmark,
        GripVertical,
        MousePointerClick,
      }),
    },
  ],
};
