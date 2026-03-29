import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StoryData } from '../models/story.model';
import { environment } from '../../environments/environment';
import type { GenerateRequest, ContinueRequest, ContinueResponse } from '../../server/story.types';

@Injectable({ providedIn: 'root' })
export class StoryDataService {
  private readonly http = inject(HttpClient);

  loadStory(storyTheme: Partial<GenerateRequest>): Observable<StoryData> {
    return this.http.post<StoryData>(environment.apiUrl + '/generate', storyTheme);
  }

  continueStory(req: ContinueRequest): Observable<ContinueResponse> {
    return this.http.post<ContinueResponse>(environment.apiUrl + '/continue', req);
  }
}
