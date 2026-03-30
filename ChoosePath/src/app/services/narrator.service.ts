/**
 * NarratorService - Gives voice to the game with contextual messages
 * 
 * Provides:
 * - Death messages based on context
 * - Advancement messages
 * - Genre-specific narrator personality
 * - Random flavor text
 */
import { Injectable, signal, inject } from '@angular/core';
import { StoryService } from './story.service';

export type Genre = 'terror' | 'fantasia' | 'ciencia ficcion' | 'aventura' | 'misterio' | 'drama';
export type Tone = 'tetrico' | 'epico' | 'misterioso' | 'ligero' | 'melancolico';

export interface NarratorMessage {
  text: string;
  intensity: 'low' | 'medium' | 'high';
}

@Injectable({
  providedIn: 'root'
})
export class NarratorService {
  private readonly storyService = inject(StoryService);

  // Current genre and tone from the story
  private _genre = signal<Genre>('terror');
  private _tone = signal<Tone>('tetrico');

  // Track player choices for contextual messages
  private _deadlyChoicesAvoided = signal(0);
  private _totalChoices = signal(0);
  private _racha = signal(0);

  // ─────────────────────────────────────────────────────────────────────────────
  // Narrator personalities by genre
  // ─────────────────────────────────────────────────────────────────────────────

  private readonly narratorPersonalities: Record<Genre, {
    name: string;
    deathMessages: string[];
    nearDeathMessages: string[];
    advanceMessages: string[];
    flavorTexts: string[];
  }> = {
    terror: {
      name: 'El Cronista Oscuro',
      deathMessages: [
        'Las sombras no perdonan...',
        'Tu luz se ha extinguido.',
        'El miedo te consumió.',
        'La oscuridad te abrazo.',
        'Ya no hay vuelta atrás.',
        'Tu historia termina aquí.',
        'El silencio te reclamó.',
        'La noche fue más fuerte.',
      ],
      nearDeathMessages: [
        'Escapaste... por ahora.',
        'La muerte suspiró sobre ti.',
        'Por poco...',
        'Otra vez survive.',
      ],
      advanceMessages: [
        'Avanzas entre susurros.',
        'La oscuridad teacepta... por ahora.',
        'Cada paso es un susurro.',
        'Te internes más en lo desconocido.',
      ],
      flavorTexts: [
        '¿Sientes ese escalofrío?',
        'Algo te observa desde las sombras.',
        'El viento lleva susurros...',
        '¿Escuchaste eso?',
        'La niebla guarda secretos.',
      ],
    },
    fantasia: {
      name: 'El Bardo Legendario',
      deathMessages: [
        'Tu leyenda llega a su fin.',
        'Los dioses han hablado.',
        'Tu destino se cumplió.',
        'La profecía se cierrap.',
        'Tu alma parte hacia lo eterno.',
        'El heroísmo tiene su costo.',
        'Tu nombre será recordado...',
        'La aventura termina aquí.',
      ],
      nearDeathMessages: [
        'Los dioses te sonríen hoy.',
        'Escapaste del destino.',
        'Tu estrella brilla aún.',
        'Los cielos te dieron otra Oportunidad.',
      ],
      advanceMessages: [
        'Tu leyenda continua.',
        'El destino te llama.',
        'Una nueva pagina se escribe.',
        'El camino se abre ante ti.',
      ],
      flavorTexts: [
        '¿Sientes el poder fluir?',
        'Los susurros del viento...',
        'La magia está cerca.',
        'Algo antiguo despierta.',
      ],
    },
    'ciencia ficcion': {
      name: 'La IA Narradora',
      deathMessages: [
        'Sistema: Vida terminates.',
        'Error fatal: Jugador eliminado.',
        'La realidad colapso.',
        'Singularidad alcanzada... en muerte.',
        'Tu timeline se extinguió.',
        'El universo te olvidó.',
        'Reset: Fin del juego.',
        'Paradoja: Dejas de existir.',
      ],
      nearDeathMessages: [
        'Advertencia: Casi expire.',
        'Recuperación de emergencia exitosa.',
        'Tu código persiste... por ahora.',
        'El sistema te dio otra Oportunidad.',
      ],
      advanceMessages: [
        'Progreso en el timeline.',
        'Nueva secuencia cargada.',
        'Continúas en la matriz.',
        'El futuro se escribe.',
      ],
      flavorTexts: [
        'Detectando anomalías...',
        '¿Real o simulación?',
        'El espacio guarda misterios.',
        'Señales del infinito...',
      ],
    },
    aventura: {
      name: 'El Explorador',
      deathMessages: [
        'El aventureo terminó.',
        'Tu brújula se detovo.',
        'El mapatermina aquí.',
        'Descansas del camino.',
        'Tu viaje llegó a su fin.',
        'El horizonte te reclamo.',
        'Descansas, valiente.',
        'El destino te alcanzó.',
      ],
      nearDeathMessages: [
        'Por los pelos!',
        'Escapaste de milagro.',
        'Otra aventura más.',
        'Eso estuvo cerca!',
      ],
      advanceMessages: [
        'Siguiente parada!',
        'El camino continua.',
        'Nueva aventura espera.',
        'Adelante, explorador.',
      ],
      flavorTexts: [
        '¿Qué hay allá?',
        'El mapa sigue...',
        'Nuevos horizontes.',
        'El tesoro espera.',
      ],
    },
    misterio: {
      name: 'El Detective',
      deathMessages: [
        'El caso queda abierto.',
        'Te convertiste en misterio.',
        'La verdad se perdió.',
        'Tu historia... sin resolver.',
        'El secreto te absorbio.',
        'Descansas con preguntas.',
        'El enigma persiste.',
        'Tu final... es un misterio.',
      ],
      nearDeathMessages: [
        'Casi resolvías el misterio.',
        'Escapaste por los pelos.',
        'El destino te dio una pista.',
        'Sobreviviste... por ahora.',
      ],
      advanceMessages: [
        'Avanzas en la investigación.',
        'Nuevas pistas aparecen.',
        'El misterio se profundiza.',
        'Te acercas a la verdad.',
      ],
      flavorTexts: [
        '¿Qué sabe ese olhar?',
        'Todo tiene una explicación...',
        'Las pistas están ahí.',
        '¿Viste eso?',
      ],
    },
    drama: {
      name: 'El Cronista',
      deathMessages: [
        'Una vida llega a su fin.',
        'El telón baja.',
        'Tu historia se completó.',
        'El destino está cumplido.',
        'Descansas en paz.',
        'Tu legado permanece.',
        'Las hojas del tiempo caen.',
        'Tu capitulo termina.',
      ],
      nearDeathMessages: [
        'Escapaste... por hoy.',
        'El destino te dio otra Oportunidad.',
        'Aún hay páginas por escribir.',
        'Sobreviviste al capítulo.',
      ],
      advanceMessages: [
        'El próximo capitulo Begins.',
        'Tu historia continua.',
        'Las paginas se vuelven.',
        'Un nuevo comienzo.',
      ],
      flavorTexts: [
        '¿Qué será ahora?',
        'La vida continua.',
        'Todo cambia...',
        'El tiempo pasa.',
      ],
    },
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Public methods
  // ─────────────────────────────────────────────────────────────────────────────

  setStoryContext(genre: string, tone: string): void {
    const normalizedGenre = genre.toLowerCase() as Genre;
    const normalizedTone = tone.toLowerCase() as Tone;
    
    if (this.narratorPersonalities[normalizedGenre]) {
      this._genre.set(normalizedGenre);
    }
    if (normalizedTone.includes('terror') || normalizedTone.includes('oscuro')) {
      this._tone.set('tetrico');
    } else if (normalizedTone.includes('epico')) {
      this._tone.set('epico');
    } else if (normalizedTone.includes('misterio') || normalizedTone.includes('tenso')) {
      this._tone.set('misterioso');
    } else if (normalizedTone.includes('ligero') || normalizedTone.includes('aventurero')) {
      this._tone.set('ligero');
    } else if (normalizedTone.includes('melancol')) {
      this._tone.set('melancolico');
    }
  }

  /** Get a death message */
  getDeathMessage(): string {
    const messages = this.narratorPersonalities[this._genre()].deathMessages;
    return this.randomFrom(messages);
  }

  /** Get a near-death (survived deadly choice) message */
  getNearDeathMessage(): string {
    const messages = this.narratorPersonalities[this._genre()].nearDeathMessages;
    return this.randomFrom(messages);
  }

  /** Get an advancement message */
  getAdvanceMessage(): string {
    const messages = this.narratorPersonalities[this._genre()].advanceMessages;
    return this.randomFrom(messages);
  }

  /** Get a random flavor text */
  getFlavorText(): string {
    const messages = this.narratorPersonalities[this._genre()].flavorTexts;
    return this.randomFrom(messages);
  }

  /** Record a deadly choice that was avoided */
  recordSafeChoice(): void {
    this._totalChoices.update(c => c + 1);
    this._racha.update(r => r + 1);
  }

  /** Record that player almost died (chose deadly and survived somehow) */
  recordNearDeath(): void {
    this._deadlyChoicesAvoided.update(d => d + 1);
    this._racha.set(0);
  }

  /** Get current racha (consecutive safe choices) */
  getRacha(): number {
    return this._racha();
  }

  /** Get number of deadly choices avoided */
  getDeadlyAvoided(): number {
    return this._deadlyChoicesAvoided();
  }

  /** Get total choices made */
  getTotalChoices(): number {
    return this._totalChoices();
  }

  /** Get narrator name for current genre */
  getNarratorName(): string {
    return this.narratorPersonalities[this._genre()].name;
  }

  /** Get genre */
  getGenre(): Genre {
    return this._genre();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────────

  private randomFrom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
