import { Component, output, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScoreService } from '../../services/score.service';
import type { ScoreEntry } from '../../models/story.model';

@Component({
  selector: 'app-start-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="landing">
      <!-- Aurora Background -->
      <div class="aurora" aria-hidden="true"></div>

      <div class="landing-content">
        <!-- Left Side: Hero + Form -->
        <div class="hero-section">
          <div class="hero-card">
            <!-- Logo -->
            <div class="hero-logo">
              <div class="logo-orb">
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3 12h4M17 12h4M7 12a5 5 0 0 1 10 0" />
                  <circle cx="12" cy="7" r="2" />
                  <circle cx="6" cy="17" r="2" />
                  <circle cx="18" cy="17" r="2" />
                  <path d="M8.5 15.5 10 13M15.5 15.5 14 13" />
                </svg>
              </div>
              <h1 class="hero-title">Choose<span class="title-path">Path</span></h1>
            </div>

            <p class="hero-desc">
              Una experiencia narrativa interactiva donde cada decisión crea tu camino. La IA
              construye la historia en tiempo real Based en tus elecciones.
            </p>

            <!-- CTA Badge -->
            <div class="cta-badge">
              <span class="cta-icon">&#9679;</span>
              Pruébala tú mismo
            </div>

            <!-- Form -->
            <div class="hero-form">
              <div class="form-group">
                <label class="form-label" for="nickname">Tu nombre</label>
                <input
                  id="nickname"
                  class="form-input"
                  type="text"
                  maxlength="30"
                  placeholder="Nickname..."
                  [ngModel]="nickname()"
                  (ngModelChange)="nickname.set($event)"
                  (keydown.enter)="onStart()"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="theme">Tema de la historia</label>
                <textarea
                  id="theme"
                  class="form-input form-textarea"
                  maxlength="500"
                  placeholder="Ej: Un pueblo abandonado donde los espejos muestran versiones siniestras de ti..."
                  [ngModel]="theme()"
                  (ngModelChange)="theme.set($event)"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label class="form-label" for="genre">Género</label>
                  <select
                    id="genre"
                    class="form-select"
                    [ngModel]="genre()"
                    (ngModelChange)="genre.set($event)"
                  >
                    <option>Terror</option>
                    <option>Fantasia</option>
                    <option>Ciencia Ficcion</option>
                    <option>Aventura</option>
                    <option>Misterio</option>
                    <option>Drama</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="form-label" for="tone">Tono</label>
                  <select
                    id="tone"
                    class="form-select"
                    [ngModel]="tone()"
                    (ngModelChange)="tone.set($event)"
                  >
                    <option>Tetrico y oscuro</option>
                    <option>Epico y grandioso</option>
                    <option>Misterioso y tenso</option>
                    <option>Ligero y aventurero</option>
                    <option>Melancolico</option>
                  </select>
                </div>
              </div>

              <button
                class="form-btn"
                [disabled]="!nickname().trim() || !theme().trim()"
                (click)="onStart()"
              >
                <span class="btn-icon">&#10148;</span>
                Comenzar aventura
              </button>
            </div>
          </div>
        </div>

        <!-- Right Side: Scoreboard -->
        <div class="scoreboard-section">
          <div class="scoreboard-card">
            <div class="sb-header">
              <div class="sb-title">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 22V8a4 4 0 0 1 4 0v14" />
                  <path d="M10 14h4" />
                </svg>
                Top Scores
              </div>
              <div class="sb-badge">
                {{ topScores().length }} jugadore{{ topScores().length === 1 ? '' : 's' }}
              </div>
            </div>

            <div class="score-list">
              @if (topScores().length === 0) {
                <div class="score-empty">
                  <div class="empty-icon">&#128200;</div>
                  <p>Sé el primero en registrar tu score</p>
                </div>
              } @else {
                @for (score of topScores().slice(0, 8); track score._id; let i = $index) {
                  <div
                    class="score-row"
                    [class.gold]="i === 0"
                    [class.silver]="i === 1"
                    [class.bronze]="i === 2"
                  >
                    <div class="score-rank">
                      @if (i === 0) {
                        <span class="rank-medal">&#129351;</span>
                      } @else if (i === 1) {
                        <span class="rank-medal">&#129352;</span>
                      } @else if (i === 2) {
                        <span class="rank-medal">&#129353;</span>
                      } @else {
                        {{ i + 1 }}
                      }
                    </div>
                    <div class="score-info">
                      <div class="score-name">{{ score.nickname }}</div>
                      <div class="score-title">{{ score.storyTitle | slice: 0 : 22 }}</div>
                    </div>
                    <div class="score-value">{{ score.score }}</div>
                  </div>
                }
              }
            </div>

            <div class="score-footer">
              <div class="footer-stat">
                <span class="stat-value">{{ totalGames() }}</span>
                <span class="stat-label">partidas jugadas</span>
              </div>
              <div class="footer-stat">
                <span class="stat-value">{{ maxScore() }}</span>
                <span class="stat-label">max score</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .landing {
        position: fixed;
        inset: 0;
        z-index: 100;
        overflow-y: auto;
        padding: 24px;
      }

      .aurora {
        position: fixed;
        inset: -60%;
        z-index: 0;
        pointer-events: none;
        background:
          radial-gradient(
            ellipse 70% 60% at 15% 25%,
            rgba(168, 210, 255, 0.45) 0%,
            transparent 55%
          ),
          radial-gradient(
            ellipse 60% 70% at 85% 15%,
            rgba(200, 168, 255, 0.35) 0%,
            transparent 55%
          ),
          radial-gradient(
            ellipse 80% 50% at 70% 80%,
            rgba(168, 240, 220, 0.35) 0%,
            transparent 55%
          ),
          radial-gradient(ellipse 50% 60% at 30% 75%, rgba(255, 210, 168, 0.3) 0%, transparent 55%),
          radial-gradient(ellipse 90% 90% at 50% 50%, rgba(240, 244, 255, 1) 0%, transparent 70%);
        animation: auroraShift 18s ease-in-out infinite alternate;
      }

      @keyframes auroraShift {
        0% {
          transform: translate(0, 0) rotate(0deg);
        }
        100% {
          transform: translate(-2%, 2%) rotate(1deg);
        }
      }

      .landing-content {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 32px;
        max-width: 1100px;
        margin: 0 auto;
        min-height: calc(100vh - 48px);
        align-items: start;
      }

      /* Hero Section */
      .hero-section {
        display: flex;
        flex-direction: column;
      }

      .hero-card {
        background: var(--s0);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border);
        border-radius: var(--r-2xl);
        padding: 32px;
        box-shadow: var(--sh-lg);
      }

      .hero-logo {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .logo-orb {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--blue), var(--violet));
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(74, 124, 247, 0.3);
      }

      .hero-title {
        font-family: var(--f-ui);
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--ink);
        margin: 0;
        letter-spacing: -0.02em;
      }

      .hero-title .title-path {
        background: linear-gradient(135deg, var(--blue), var(--violet));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .hero-desc {
        font-size: 0.95rem;
        color: var(--ink3);
        line-height: 1.6;
        margin: 0 0 24px;
      }

      .cta-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: var(--blue-s);
        border: 1px solid rgba(74, 124, 247, 0.2);
        padding: 8px 16px;
        border-radius: var(--r-2xl);
        font-family: var(--f-mono);
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--blue);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 24px;
      }

      .cta-icon {
        font-size: 0.5rem;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.4;
        }
      }

      /* Form */
      .hero-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-label {
        font-family: var(--f-mono);
        font-size: 0.58rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--ink4);
      }

      .form-input {
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--s1);
        font-family: var(--f-ui);
        font-size: 0.9rem;
        color: var(--ink);
        transition:
          border-color 0.15s,
          box-shadow 0.15s;
      }

      .form-input:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 0 0 0 3px rgba(74, 124, 247, 0.12);
      }

      .form-input::placeholder {
        color: var(--ink5);
      }

      .form-textarea {
        min-height: 80px;
        resize: vertical;
        line-height: 1.5;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-select {
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--s1);
        font-family: var(--f-ui);
        font-size: 0.9rem;
        color: var(--ink);
        cursor: pointer;
        transition: border-color 0.15s;
      }

      .form-select:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 0 0 0 3px rgba(74, 124, 247, 0.12);
      }

      .form-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 8px;
        padding: 14px 24px;
        border: none;
        border-radius: var(--r-md);
        background: linear-gradient(135deg, var(--blue), #6366f1);
        color: white;
        font-family: var(--f-ui);
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition:
          transform 0.15s,
          box-shadow 0.15s,
          opacity 0.15s;
        box-shadow: 0 4px 16px rgba(74, 124, 247, 0.3);
      }

      .form-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(74, 124, 247, 0.35);
      }

      .form-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .btn-icon {
        font-size: 1rem;
        transition: transform 0.15s;
      }

      .form-btn:hover:not(:disabled) .btn-icon {
        transform: translateX(3px);
      }

      /* Scoreboard Section */
      .scoreboard-section {
        position: sticky;
        top: 24px;
      }

      .scoreboard-card {
        background: var(--s0);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border);
        border-radius: var(--r-2xl);
        overflow: hidden;
        box-shadow: var(--sh-lg);
      }

      .sb-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        border-bottom: 1px solid var(--border);
        background: var(--s1);
      }

      .sb-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: var(--f-mono);
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--ink3);
      }

      .sb-title svg {
        color: var(--blue);
      }

      .sb-badge {
        font-family: var(--f-mono);
        font-size: 0.55rem;
        background: var(--blue-s);
        color: var(--blue);
        padding: 4px 10px;
        border-radius: var(--r-2xl);
        border: 1px solid rgba(74, 124, 247, 0.2);
      }

      .score-list {
        padding: 8px;
        max-height: 360px;
        overflow-y: auto;
      }

      .score-empty {
        padding: 32px 16px;
        text-align: center;
      }

      .empty-icon {
        font-size: 2rem;
        margin-bottom: 8px;
        opacity: 0.5;
      }

      .score-empty p {
        font-size: 0.8rem;
        color: var(--ink4);
        margin: 0;
      }

      .score-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: var(--r-md);
        margin-bottom: 4px;
        transition: background 0.12s;
      }

      .score-row:hover {
        background: var(--s1);
      }

      .score-row.gold {
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05));
        border: 1px solid rgba(255, 215, 0, 0.2);
      }

      .score-row.silver {
        background: linear-gradient(135deg, rgba(192, 192, 192, 0.1), rgba(192, 192, 192, 0.05));
        border: 1px solid rgba(192, 192, 192, 0.2);
      }

      .score-row.bronze {
        background: linear-gradient(135deg, rgba(205, 127, 50, 0.1), rgba(205, 127, 50, 0.05));
        border: 1px solid rgba(205, 127, 50, 0.2);
      }

      .score-rank {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--f-mono);
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--ink4);
        background: var(--s2);
        border-radius: 8px;
      }

      .score-row.gold .score-rank {
        background: rgba(255, 215, 0, 0.2);
      }

      .score-row.silver .score-rank {
        background: rgba(192, 192, 192, 0.2);
      }

      .score-row.bronze .score-rank {
        background: rgba(205, 127, 50, 0.2);
      }

      .rank-medal {
        font-size: 1rem;
      }

      .score-info {
        flex: 1;
        min-width: 0;
      }

      .score-name {
        font-family: var(--f-ui);
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--ink);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .score-title {
        font-family: var(--f-mono);
        font-size: 0.58rem;
        color: var(--ink4);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .score-value {
        font-family: var(--f-mono);
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--blue);
        background: var(--blue-s);
        padding: 4px 10px;
        border-radius: var(--r-sm);
      }

      .score-footer {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px;
        background: var(--border);
        border-top: 1px solid var(--border);
      }

      .footer-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 14px;
        background: var(--s1);
      }

      .stat-value {
        font-family: var(--f-mono);
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--ink);
      }

      .stat-label {
        font-family: var(--f-mono);
        font-size: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--ink4);
      }

      /* Responsive */
      @media (max-width: 800px) {
        .landing-content {
          grid-template-columns: 1fr;
          max-width: 480px;
        }

        .scoreboard-section {
          position: static;
        }

        .hero-card {
          padding: 24px;
        }

        .hero-title {
          font-size: 1.5rem;
        }
      }
    `,
  ],
})
export class StartScreenComponent implements OnInit {
  private readonly scoreService = inject(ScoreService);

  gameStart = output<{ nickname: string; theme: string; genre: string; tone: string }>();

  nickname = signal('');
  theme = signal('');
  genre = signal('Terror');
  tone = signal('Tetrico y oscuro');

  topScores = signal<ScoreEntry[]>([]);

  ngOnInit(): void {
    this.loadTopScores();
  }

  private loadTopScores(): void {
    this.scoreService.getTopScores().subscribe({
      next: (scores) => this.topScores.set(scores),
      error: () => {},
    });
  }

  totalGames(): number {
    return this.topScores().length;
  }

  maxScore(): number {
    const scores = this.topScores();
    if (scores.length === 0) return 0;
    return Math.max(...scores.map((s) => s.score));
  }

  onStart(): void {
    if (!this.nickname().trim() || !this.theme().trim()) return;
    this.gameStart.emit({
      nickname: this.nickname().trim(),
      theme: this.theme().trim(),
      genre: this.genre(),
      tone: this.tone(),
    });
  }
}
