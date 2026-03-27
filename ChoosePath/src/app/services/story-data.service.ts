import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StoryData } from '../models/story.model';
import { environment } from '../../environments/environment';
import { GenerateRequest } from '../../server/story.types';
// import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StoryDataService {
  private readonly http = inject(HttpClient);

  /**
   * Load a story by its slug from local assets.
   *
   * To switch to a backend, replace the URL:
   *   return this.http.get<StoryData>(`${environment.apiUrl}/stories/${storyId}`);
   */
  loadStory(storyTheme: Partial<GenerateRequest>): Observable<StoryData> {
    return this.http.post<StoryData>(environment.apiUrl + '/generate', storyTheme);
  }
}
