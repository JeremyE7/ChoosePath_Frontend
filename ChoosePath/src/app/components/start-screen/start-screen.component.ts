import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-start-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="start-overlay">
      <div class="start-card">
        <div class="start-logo">
          <span class="start-orb"></span>
          <h1 class="start-title">ChoosePath</h1>
        </div>
        <p class="start-subtitle">Sobrevive la historia. La IA quiere matarte.</p>

        <div class="start-form">
          <label class="start-label" for="nickname">Tu nombre</label>
          <input
            id="nickname"
            class="start-input"
            type="text"
            maxlength="30"
            placeholder="Ingresa tu nickname..."
            [ngModel]="nickname()"
            (ngModelChange)="nickname.set($event)"
            (keydown.enter)="onStart()"
          />

          <label class="start-label" for="theme">Tema de la historia</label>
          <textarea
            id="theme"
            class="start-input start-textarea"
            maxlength="500"
            placeholder="Ej: Un pueblo abandonado donde los espejos muestran versiones siniestras de ti..."
            [ngModel]="theme()"
            (ngModelChange)="theme.set($event)"
          ></textarea>

          <div class="start-row">
            <div class="start-field">
              <label class="start-label" for="genre">Genero</label>
              <select id="genre" class="start-input" [ngModel]="genre()" (ngModelChange)="genre.set($event)">
                <option>Terror</option>
                <option>Fantasia</option>
                <option>Ciencia Ficcion</option>
                <option>Aventura</option>
                <option>Misterio</option>
                <option>Drama</option>
              </select>
            </div>
            <div class="start-field">
              <label class="start-label" for="tone">Tono</label>
              <select id="tone" class="start-input" [ngModel]="tone()" (ngModelChange)="tone.set($event)">
                <option>Tetrico y oscuro</option>
                <option>Epico y grandioso</option>
                <option>Misterioso y tenso</option>
                <option>Ligero y aventurero</option>
                <option>Melancolico</option>
              </select>
            </div>
          </div>

          <button
            class="start-btn"
            [disabled]="!nickname().trim() || !theme().trim()"
            (click)="onStart()"
          >
            Comenzar aventura
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .start-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(240, 244, 255, 0.95);
      backdrop-filter: blur(20px);
    }
    .start-card {
      background: var(--s0);
      border: 1px solid var(--border);
      border-radius: var(--r-2xl);
      padding: 40px 36px;
      max-width: 440px;
      width: 90vw;
      box-shadow: var(--sh-lg);
    }
    .start-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .start-orb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4a7cf7, #8b5cf6);
      box-shadow: 0 0 12px rgba(74, 124, 247, 0.4);
    }
    .start-title {
      font-size: 1.3rem;
      font-weight: 700;
      background: linear-gradient(135deg, #4a7cf7, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }
    .start-subtitle {
      font-size: 0.82rem;
      color: var(--ink3);
      margin: 0 0 24px;
    }
    .start-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .start-label {
      font-family: var(--f-mono);
      font-size: 0.56rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ink4);
      margin-bottom: -4px;
    }
    .start-input {
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      background: var(--s1);
      font-size: 0.88rem;
      color: var(--ink);
      font-family: inherit;
      transition: border-color 0.15s;
    }
    .start-input:focus {
      outline: none;
      border-color: #4a7cf7;
      box-shadow: 0 0 0 3px rgba(74, 124, 247, 0.1);
    }
    .start-textarea {
      min-height: 70px;
      resize: vertical;
      line-height: 1.4;
    }
    .start-row {
      display: flex;
      gap: 10px;
    }
    .start-field {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    select.start-input {
      cursor: pointer;
    }
    .start-btn {
      margin-top: 10px;
      padding: 12px;
      border: none;
      border-radius: var(--r-md);
      background: linear-gradient(135deg, #4a7cf7, #6366f1);
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.15s;
    }
    .start-btn:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    .start-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `],
})
export class StartScreenComponent {
  gameStart = output<{ nickname: string; theme: string; genre: string; tone: string }>();

  nickname = signal('');
  theme = signal('');
  genre = signal('Terror');
  tone = signal('Tetrico y oscuro');

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
