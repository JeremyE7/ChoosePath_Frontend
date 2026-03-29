import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ScoreEntry } from '../models/story.model';
import { environment } from '../../environments/environment';

const SCORES_URL = environment.apiUrl.replace('/stories', '/scores');

@Injectable({ providedIn: 'root' })
export class ScoreService {
  private readonly http = inject(HttpClient);

  saveScore(nickname: string, score: number, storyTitle: string): Observable<ScoreEntry> {
    return this.http.post<ScoreEntry>(SCORES_URL, { nickname, score, storyTitle });
  }

  getTopScores(): Observable<ScoreEntry[]> {
    return this.http.get<ScoreEntry[]>(SCORES_URL + '/top');
  }
}
