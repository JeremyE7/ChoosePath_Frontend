import {
  Component,
  output,
  signal,
  inject,
  ElementRef,
  ChangeDetectionStrategy,
  OnInit,
  AfterViewInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import gsap from 'gsap';
import { ScoreService } from '../../services/score.service';
import type { ScoreEntry } from '../../models/story.model';

@Component({
  selector: 'app-start-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="landing">
      <!-- Aurora background -->
      <div class="lbg" aria-hidden="true">
        <svg class="ltree" viewBox="0 0 1400 860" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g class="lt-lines">
            <path d="M700,880 C700,820 700,790 700,740"/>
            <path d="M700,740 C668,680 530,610 420,555"/>
            <path d="M700,740 C732,680 870,610 980,555"/>
            <path d="M420,555 C392,498 318,448 268,408"/>
            <path d="M420,555 C448,498 500,448 540,408"/>
            <path d="M980,555 C952,498 900,448 860,408"/>
            <path d="M980,555 C1008,498 1060,448 1112,408"/>
            <path d="M268,408 C244,360 205,322 175,290"/>
            <path d="M268,408 C292,360 318,322 342,290"/>
            <path d="M540,408 C516,360 488,322 464,290"/>
            <path d="M540,408 C564,360 592,322 616,290"/>
            <path d="M860,408 C836,360 808,322 784,290"/>
            <path d="M860,408 C884,360 912,322 936,290"/>
            <path d="M1112,408 C1088,360 1060,322 1036,290"/>
            <path d="M1112,408 C1136,360 1164,322 1188,290"/>
          </g>
          <g class="lt-nodes">
            <circle cx="700" cy="740" r="5.5"/>
            <circle cx="420" cy="555" r="4.5"/>
            <circle cx="980" cy="555" r="4.5"/>
            <circle cx="268" cy="408" r="3.5"/>
            <circle cx="540" cy="408" r="3.5"/>
            <circle cx="860" cy="408" r="3.5"/>
            <circle cx="1112" cy="408" r="3.5"/>
          </g>
          <g class="lt-ends">
            <circle class="safe" cx="175" cy="290" r="3"/>
            <circle class="death" cx="342" cy="290" r="3"/>
            <circle class="safe" cx="464" cy="290" r="3"/>
            <circle class="safe" cx="616" cy="290" r="3"/>
            <circle class="death" cx="784" cy="290" r="3"/>
            <circle class="safe" cx="936" cy="290" r="3"/>
            <circle class="safe" cx="1036" cy="290" r="3"/>
            <circle class="death" cx="1188" cy="290" r="3"/>
          </g>
        </svg>
      </div>

      <!-- Cursor glow -->
      <div class="cursor-glow" aria-hidden="true"></div>

      <!-- Content grid -->
      <div class="lgrid">
        <!-- Left: Hero -->
        <div class="lhero">
          <div class="lmark">
            <div class="lmark-gem">
              <lucide-icon name="waypoints" [size]="14" color="white" aria-hidden="true"></lucide-icon>
            </div>
            <span class="lmark-name">CHOOSE<span class="lmark-hi">PATH</span></span>
          </div>

          <h1 class="lhl">
            <span class="lhl-1">Elige tu camino.</span>
            <span class="lhl-2">Vive las consecuencias.</span>
          </h1>

          <p class="lsub">
            Una experiencia narrativa donde la IA construye la historia en tiempo real.
            Cada decisión abre nuevas rutas — algunas te llevarán lejos,
            otras terminarán tu historia.
          </p>

          <div class="lfeats">
            <div class="lfeat">
              <span class="lfeat-v">&#8734;</span>
              <span class="lfeat-l">Caminos</span>
            </div>
            <div class="lfeat-sep" aria-hidden="true"></div>
            <div class="lfeat">
              <span class="lfeat-v">IA</span>
              <span class="lfeat-l">Tiempo real</span>
            </div>
            <div class="lfeat-sep" aria-hidden="true"></div>
            <div class="lfeat">
              <span class="lfeat-v">01</span>
              <span class="lfeat-l">Vida</span>
            </div>
          </div>
        </div>

        <!-- Right: Form + Scoreboard -->
        <div class="lright">
          <!-- Form panel -->
          <div class="lpanel lform-panel">
            <div class="lpanel-hd">
              <span class="lpanel-lbl">Nueva partida</span>
              <span class="lpanel-dot" aria-hidden="true"></span>
            </div>
            <div class="lform-body">
              <div class="lfield">
                <label class="lfield-lbl" for="nickname">Nombre</label>
                <input
                  id="nickname"
                  class="linput"
                  type="text"
                  maxlength="30"
                  placeholder="Tu nickname..."
                  [ngModel]="nickname()"
                  (ngModelChange)="nickname.set($event)"
                  (keydown.enter)="onStart()"
                />
              </div>
              <div class="lfield">
                <label class="lfield-lbl" for="theme">Tema de la historia</label>
                <textarea
                  id="theme"
                  class="linput ltextarea"
                  maxlength="500"
                  placeholder="Ej: Un pueblo abandonado donde los espejos muestran versiones siniestras de ti..."
                  [ngModel]="theme()"
                  (ngModelChange)="theme.set($event)"
                ></textarea>
              </div>
              <div class="lrow">
                <div class="lfield">
                  <label class="lfield-lbl" for="genre">Género</label>
                  <select id="genre" class="lselect" [ngModel]="genre()" (ngModelChange)="genre.set($event)">
                    <option>Terror</option>
                    <option>Fantasia</option>
                    <option>Ciencia Ficcion</option>
                    <option>Aventura</option>
                    <option>Misterio</option>
                    <option>Drama</option>
                  </select>
                </div>
                <div class="lfield">
                  <label class="lfield-lbl" for="tone">Tono</label>
                  <select id="tone" class="lselect" [ngModel]="tone()" (ngModelChange)="tone.set($event)">
                    <option>Tetrico y oscuro</option>
                    <option>Epico y grandioso</option>
                    <option>Misterioso y tenso</option>
                    <option>Ligero y aventurero</option>
                    <option>Melancolico</option>
                  </select>
                </div>
              </div>
              <button
                class="lbtn"
                [disabled]="!nickname().trim() || !theme().trim()"
                (click)="onStart()"
              >
                <lucide-icon name="arrow-right" [size]="15" aria-hidden="true"></lucide-icon>
                Comenzar aventura
              </button>
            </div>
          </div>

          <!-- Scoreboard panel -->
          <div class="lpanel lsb-panel">
            <div class="lpanel-hd">
              <span class="lpanel-lbl">
                <lucide-icon name="trophy" [size]="11" aria-hidden="true"></lucide-icon>
                Top Scores
              </span>
              <span class="lsb-cnt">{{ topScores().length }}</span>
            </div>
            <div class="lsb-list">
              @if (topScores().length === 0) {
                <div class="lsb-empty">
                  <lucide-icon name="trending-up" [size]="22" aria-hidden="true"></lucide-icon>
                  <p>Sé el primero en registrar tu score</p>
                </div>
              } @else {
                @for (score of topScores().slice(0, 6); track score._id; let i = $index) {
                  <div
                    class="lsb-row"
                    [class.gold]="i === 0"
                    [class.silver]="i === 1"
                    [class.bronze]="i === 2"
                  >
                    <div class="lsb-rank">
                      @if (i === 0) {
                        <lucide-icon name="medal" [size]="13" color="#ffd700" aria-label="1er lugar"></lucide-icon>
                      } @else if (i === 1) {
                        <lucide-icon name="medal" [size]="13" color="#c0c0c0" aria-label="2do lugar"></lucide-icon>
                      } @else if (i === 2) {
                        <lucide-icon name="medal" [size]="13" color="#cd7f32" aria-label="3er lugar"></lucide-icon>
                      } @else {
                        {{ i + 1 }}
                      }
                    </div>
                    <div class="lsb-info">
                      <span class="lsb-name">{{ score.nickname }}</span>
                      <span class="lsb-stitle">{{ score.storyTitle | slice: 0 : 22 }}</span>
                    </div>
                    <span class="lsb-score">{{ score.score }}</span>
                  </div>
                }
              }
            </div>
            <div class="lsb-foot">
              <div class="lsb-stat">
                <span class="lsb-stat-v">{{ totalGames() }}</span>
                <span class="lsb-stat-l">partidas</span>
              </div>
              <div class="lsb-stat">
                <span class="lsb-stat-v">{{ maxScore() }}</span>
                <span class="lsb-stat-l">max score</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* ── Shell ── */
      .landing {
        position: fixed;
        inset: 0;
        z-index: 100;
        overflow-y: auto;
      }

      /* ── Aurora background ── */
      .lbg {
        position: fixed;
        inset: -60%;
        z-index: 0;
        pointer-events: none;
        background:
          radial-gradient(ellipse 70% 60% at 15% 25%, rgba(168,210,255,0.45) 0%, transparent 55%),
          radial-gradient(ellipse 60% 70% at 85% 15%, rgba(200,168,255,0.35) 0%, transparent 55%),
          radial-gradient(ellipse 80% 50% at 70% 80%, rgba(168,240,220,0.35) 0%, transparent 55%),
          radial-gradient(ellipse 50% 60% at 30% 75%, rgba(255,210,168,0.3) 0%, transparent 55%),
          radial-gradient(ellipse 90% 90% at 50% 50%, rgba(240,244,255,1) 0%, transparent 70%);
        animation: lAurora 18s ease-in-out infinite alternate;
      }

      @keyframes lAurora {
        0%   { transform: translate(0, 0) rotate(0deg); }
        33%  { transform: translate(3%, -2%) rotate(0.8deg); }
        66%  { transform: translate(-2%, 3%) rotate(-0.8deg); }
        100% { transform: translate(1.5%, -1.5%) rotate(0.4deg); }
      }

      /* ── Background tree SVG ── */
      .ltree {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .lt-lines path {
        fill: none;
        stroke: rgba(74, 124, 247, 0.09);
        stroke-width: 1.2;
        stroke-linecap: round;
      }

      .lt-nodes circle {
        fill: rgba(74, 124, 247, 0.1);
        stroke: rgba(74, 124, 247, 0.28);
        stroke-width: 1;
        animation: nPulse 3s ease-in-out infinite;
      }

      .lt-nodes circle:nth-child(2) { animation-delay: -0.6s; }
      .lt-nodes circle:nth-child(3) { animation-delay: -1.2s; }
      .lt-nodes circle:nth-child(4) { animation-delay: -1.8s; }
      .lt-nodes circle:nth-child(5) { animation-delay: -0.4s; }
      .lt-nodes circle:nth-child(6) { animation-delay: -2.2s; }
      .lt-nodes circle:nth-child(7) { animation-delay: -1.5s; }

      .lt-ends circle.safe {
        fill: rgba(74, 124, 247, 0.07);
        stroke: rgba(74, 124, 247, 0.2);
        stroke-width: 1;
      }

      .lt-ends circle.death {
        fill: rgba(240, 86, 122, 0.1);
        stroke: rgba(240, 86, 122, 0.28);
        stroke-width: 1;
        animation: dPulse 2.4s ease-in-out infinite;
      }

      .lt-ends circle.death:nth-child(2) { animation-delay: -0.8s; }
      .lt-ends circle.death:nth-child(3) { animation-delay: -1.6s; }

      @keyframes nPulse {
        0%, 100% { opacity: 0.4; }
        50%       { opacity: 1; }
      }

      @keyframes dPulse {
        0%, 100% { opacity: 0.35; }
        50%       { opacity: 0.9; }
      }

      /* ── Cursor glow ── */
      .cursor-glow {
        position: fixed;
        top: 0;
        left: 0;
        width: 480px;
        height: 480px;
        border-radius: 50%;
        background: radial-gradient(ellipse at center, rgba(74,124,247,0.11) 0%, rgba(139,92,246,0.05) 40%, transparent 70%);
        pointer-events: none;
        z-index: 1;
        will-change: transform;
      }

      /* ── Main grid ── */
      .lgrid {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 56px;
        max-width: 1160px;
        margin: 0 auto;
        min-height: 100vh;
        align-items: center;
        padding: 56px 40px;
      }

      /* ── Hero ── */
      .lhero {
        display: flex;
        flex-direction: column;
      }

      .lmark {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 38px;
      }

      .lmark-gem {
        width: 30px;
        height: 30px;
        border-radius: 9px;
        background: linear-gradient(135deg, var(--blue), var(--violet));
        display: grid;
        place-items: center;
        box-shadow: 0 4px 14px rgba(74,124,247,0.32);
      }

      .lmark-name {
        font-family: var(--f-mono);
        font-size: 0.65rem;
        font-weight: 500;
        letter-spacing: 0.18em;
        color: var(--ink4);
        text-transform: uppercase;
      }

      .lmark-hi { color: var(--blue); }

      /* Hero headline */
      .lhl {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin: 0 0 26px;
      }

      .lhl-1 {
        display: block;
        font-family: var(--f-ui);
        font-size: clamp(2.2rem, 3.6vw, 3.4rem);
        font-weight: 300;
        color: var(--ink2);
        letter-spacing: -0.03em;
        line-height: 1.1;
      }

      .lhl-2 {
        display: block;
        font-family: var(--f-ui);
        font-size: clamp(2.2rem, 3.6vw, 3.4rem);
        font-weight: 800;
        background: linear-gradient(125deg, var(--blue) 0%, var(--violet) 50%, var(--amber) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.03em;
        line-height: 1.1;
      }

      .lsub {
        font-size: 0.97rem;
        line-height: 1.75;
        color: var(--ink3);
        margin-bottom: 36px;
        max-width: 460px;
      }

      /* Feature stats */
      .lfeats {
        display: flex;
        align-items: center;
        gap: 22px;
      }

      .lfeat { display: flex; flex-direction: column; gap: 3px; }

      .lfeat-v {
        font-family: var(--f-mono);
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--ink);
        letter-spacing: -0.02em;
      }

      .lfeat-l {
        font-family: var(--f-mono);
        font-size: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--ink5);
      }

      .lfeat-sep {
        width: 1px;
        height: 28px;
        background: var(--border);
      }

      /* ── Right column ── */
      .lright {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      /* ── Panel base ── */
      .lpanel {
        background: var(--s0);
        border: 1px solid var(--border);
        border-radius: var(--r-2xl);
        backdrop-filter: blur(20px);
        overflow: hidden;
        box-shadow: var(--sh-lg);
      }

      .lpanel-hd {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 13px 18px;
        border-bottom: 1px solid var(--border);
        background: var(--s1);
      }

      .lpanel-lbl {
        font-family: var(--f-mono);
        font-size: 0.58rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--ink3);
        display: flex;
        align-items: center;
        gap: 7px;
      }

      .lpanel-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--blue);
        box-shadow: 0 0 8px rgba(74,124,247,0.7);
        animation: dotBlink 2.2s ease-in-out infinite;
      }

      @keyframes dotBlink {
        0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(74,124,247,0.7); }
        50%       { opacity: 0.3; box-shadow: 0 0 3px rgba(74,124,247,0.2); }
      }

      /* ── Form panel ── */
      .lform-body {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 16px 18px 18px;
      }

      .lfield { display: flex; flex-direction: column; gap: 6px; }

      .lfield-lbl {
        font-family: var(--f-mono);
        font-size: 0.56rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--ink4);
      }

      .linput {
        padding: 11px 13px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--s1);
        font-family: var(--f-ui);
        font-size: 0.9rem;
        color: var(--ink);
        transition: border-color 0.15s, box-shadow 0.15s;
      }

      .linput::placeholder { color: var(--ink5); }

      .linput:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 0 0 0 3px rgba(74,124,247,0.12);
      }

      .ltextarea {
        min-height: 72px;
        resize: none;
        line-height: 1.55;
      }

      .lrow {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .lselect {
        padding: 11px 13px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--s1);
        font-family: var(--f-ui);
        font-size: 0.9rem;
        color: var(--ink);
        cursor: pointer;
        transition: border-color 0.15s;
      }

      .lselect:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 0 0 0 3px rgba(74,124,247,0.12);
      }

      .lbtn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 13px 20px;
        border: none;
        border-radius: var(--r-md);
        background: linear-gradient(135deg, var(--blue), #6366f1);
        color: white;
        font-family: var(--f-ui);
        font-size: 0.93rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
        box-shadow: 0 4px 16px rgba(74,124,247,0.3);
        position: relative;
        overflow: hidden;
      }

      .lbtn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
        opacity: 0;
        transition: opacity 0.15s;
      }

      .lbtn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 28px rgba(74,124,247,0.38);
      }

      .lbtn:hover:not(:disabled)::before { opacity: 1; }

      .lbtn:hover:not(:disabled) lucide-icon { transform: translateX(3px); }

      .lbtn lucide-icon {
        transition: transform 0.15s;
        flex-shrink: 0;
      }

      .lbtn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* ── Scoreboard panel ── */
      .lsb-cnt {
        font-family: var(--f-mono);
        font-size: 0.55rem;
        background: var(--blue-s);
        color: var(--blue);
        padding: 3px 9px;
        border-radius: 99px;
        border: 1px solid rgba(74,124,247,0.2);
      }

      .lsb-list {
        padding: 6px 8px;
        max-height: 200px;
        overflow-y: auto;
      }

      .lsb-empty {
        padding: 22px 16px;
        text-align: center;
        color: var(--ink4);
        opacity: 0.7;
      }

      .lsb-empty p { font-size: 0.78rem; margin-top: 8px; }

      .lsb-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: var(--r-md);
        margin-bottom: 3px;
        border: 1px solid transparent;
        transition: background 0.12s;
      }

      .lsb-row:hover { background: var(--s1); }

      .lsb-row.gold   { background: linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,215,0,0.05));   border-color: rgba(255,215,0,0.2); }
      .lsb-row.silver { background: linear-gradient(135deg,rgba(192,192,192,0.1),rgba(192,192,192,0.05)); border-color: rgba(192,192,192,0.2); }
      .lsb-row.bronze { background: linear-gradient(135deg,rgba(205,127,50,0.1),rgba(205,127,50,0.05));  border-color: rgba(205,127,50,0.2); }

      .lsb-rank {
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--f-mono);
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--ink4);
        background: var(--s2);
        border-radius: 8px;
        flex-shrink: 0;
      }

      .lsb-row.gold   .lsb-rank { background: rgba(255,215,0,0.18); }
      .lsb-row.silver .lsb-rank { background: rgba(192,192,192,0.18); }
      .lsb-row.bronze .lsb-rank { background: rgba(205,127,50,0.18); }

      .lsb-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      .lsb-name {
        font-size: 0.83rem;
        font-weight: 600;
        color: var(--ink);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .lsb-stitle {
        font-family: var(--f-mono);
        font-size: 0.56rem;
        color: var(--ink4);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .lsb-score {
        font-family: var(--f-mono);
        font-size: 0.84rem;
        font-weight: 700;
        color: var(--blue);
        background: var(--blue-s);
        padding: 3px 9px;
        border-radius: var(--r-sm);
        flex-shrink: 0;
      }

      .lsb-foot {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px;
        background: var(--border);
        border-top: 1px solid var(--border);
      }

      .lsb-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px;
        background: var(--s1);
      }

      .lsb-stat-v {
        font-family: var(--f-mono);
        font-size: 1rem;
        font-weight: 700;
        color: var(--ink);
      }

      .lsb-stat-l {
        font-family: var(--f-mono);
        font-size: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        color: var(--ink4);
      }

      /* ── Responsive ── */
      @media (max-width: 920px) {
        .lgrid {
          grid-template-columns: 1fr;
          max-width: 520px;
          min-height: unset;
          padding: 40px 20px 48px;
          gap: 32px;
        }

        .lhl-1, .lhl-2 { font-size: 2.1rem; }
        .lsub { font-size: 0.9rem; }
        .lsb-list { max-height: 260px; }
      }

      /* ── Reduced motion ── */
      @media (prefers-reduced-motion: reduce) {
        .lbg, .lt-nodes circle, .lt-ends circle.death, .lpanel-dot { animation: none; }
        .cursor-glow { display: none; }
      }
    `,
  ],
})
export class StartScreenComponent implements OnInit, AfterViewInit {
  private readonly scoreService = inject(ScoreService);
  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  gameStart = output<{ nickname: string; theme: string; genre: string; tone: string }>();

  nickname = signal('');
  theme = signal('');
  genre = signal('Terror');
  tone = signal('Tetrico y oscuro');

  topScores = signal<ScoreEntry[]>([]);

  ngOnInit(): void {
    this.loadTopScores();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const r = this.el.nativeElement;
    const cp = { clearProps: 'all' };
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', ...cp } });

    tl.from(r.querySelector('.ltree'),       { opacity: 0, duration: 1.4, ease: 'power1.out', ...cp }, 0)
      .from(r.querySelector('.lmark'),       { y: -10, opacity: 0, duration: 0.38, ...cp }, 0.28)
      .from(r.querySelector('.lhl-1'),       { x: -26, opacity: 0, duration: 0.52, ...cp }, 0.42)
      .from(r.querySelector('.lhl-2'),       { x: -26, opacity: 0, duration: 0.52, ...cp }, 0.56)
      .from(r.querySelector('.lsub'),        { y: 14, opacity: 0, duration: 0.44, ...cp }, 0.66)
      .from(r.querySelector('.lfeats'),      { y: 10, opacity: 0, duration: 0.38, ...cp }, 0.78)
      .from(r.querySelector('.lform-panel'), { x: 28, opacity: 0, duration: 0.5, ease: 'power2.out', ...cp }, 0.44)
      .from(r.querySelector('.lsb-panel'),   { x: 28, opacity: 0, duration: 0.5, ease: 'power2.out', ...cp }, 0.58);

    // Cursor glow — follows mouse with smooth lag
    const glowEl = r.querySelector('.cursor-glow') as HTMLElement | null;
    if (glowEl) {
      gsap.set(glowEl, { xPercent: -50, yPercent: -50 });
      const xTo = gsap.quickTo(glowEl, 'x', { duration: 0.55, ease: 'power3.out' });
      const yTo = gsap.quickTo(glowEl, 'y', { duration: 0.55, ease: 'power3.out' });
      (r.querySelector('.landing') as HTMLElement).addEventListener('mousemove', (e: MouseEvent) => {
        xTo(e.clientX);
        yTo(e.clientY);
      });
    }
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
