# ChoosePath — Frontend

Aplicación Angular que implementa el editor visual de historias interactivas. Árbol de decisiones navegable, drag & drop con física GSAP, sistema de memoria con notificaciones RPG y diseño aurora glassmorphism.

---

## Índice

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Componentes principales](#componentes-principales)
- [Servicios](#servicios)
- [Sistema de drag & drop](#sistema-de-drag--drop)
- [Sistema de memorias](#sistema-de-memorias)
- [Árbol SVG interactivo](#árbol-svg-interactivo)
- [Diseño y estilos](#diseño-y-estilos)
- [Deploy en CubePath](#deploy-en-cubepath)
- [Scripts disponibles](#scripts-disponibles)

---

## Requisitos

- Node.js >= 18
- Angular CLI >= 17
- npm >= 9

---

## Instalación

```bash
cd frontend
npm install
ng serve
```

La app estará disponible en `http://localhost:4200`.

---

## Variables de entorno

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};

// src/environments/environment.production.ts
export const environment = {
  production: true,
  apiUrl: 'https://choosepath-api.cubepath.app/api',
};
```

---

## Estructura del proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── tree-canvas/           # Árbol SVG interactivo principal
│   │   │   │   ├── tree-canvas.component.ts
│   │   │   │   ├── tree-canvas.component.html
│   │   │   │   └── tree-canvas.component.scss
│   │   │   ├── narrative-panel/       # Panel derecho: escena + eventos
│   │   │   │   ├── narrative-panel.component.ts
│   │   │   │   └── narrative-panel.component.scss
│   │   │   ├── choice-card/           # Carta de decisión arrastrable
│   │   │   │   ├── choice-card.component.ts
│   │   │   │   └── choice-card.component.scss
│   │   │   ├── event-card/            # Tarjeta de consecuencia (enemy/event/warning/mystery)
│   │   │   │   └── event-card.component.ts
│   │   │   ├── memory-notification/   # Popup RPG "X recordará esto"
│   │   │   │   └── memory-notification.component.ts
│   │   │   ├── memory-log/            # Lista de memorias acumuladas
│   │   │   │   └── memory-log.component.ts
│   │   │   ├── story-sidebar/         # Lista de historias guardadas
│   │   │   │   └── story-sidebar.component.ts
│   │   │   └── depth-indicator/       # Barra de progreso de capítulo
│   │   │       └── depth-indicator.component.ts
│   │   ├── services/
│   │   │   ├── story.service.ts       # Estado global del árbol y nodos
│   │   │   ├── memory.service.ts      # Sistema de memorias activas
│   │   │   ├── drag.service.ts        # Lógica de drag & drop con GSAP
│   │   │   └── tree-layout.service.ts # Cálculo de posiciones SVG
│   │   ├── models/
│   │   │   ├── node.model.ts
│   │   │   ├── story.model.ts
│   │   │   ├── memory.model.ts
│   │   │   └── event.model.ts
│   │   ├── pipes/
│   │   │   └── memory-echo.pipe.ts    # Inyecta contexto de memoria en texto
│   │   └── app.component.ts
│   ├── environments/
│   ├── assets/
│   └── styles/
│       ├── _tokens.scss               # Variables CSS: colores, sombras, radios
│       ├── _typography.scss
│       └── global.scss
├── angular.json
├── package.json
└── README.md
```

---

## Componentes principales

### `TreeCanvasComponent`

El corazón visual de la app. Renderiza el árbol de nodos como SVG y gestiona zoom, paneo y las animaciones de nuevos nodos.

```typescript
// tree-canvas.component.ts
@Component({
  selector: 'cp-tree-canvas',
  templateUrl: './tree-canvas.component.html',
})
export class TreeCanvasComponent implements AfterViewInit {
  @Input()  nodes:       StoryNode[] = [];
  @Input()  currentId:   string      = '';
  @Output() nodeClicked              = new EventEmitter<string>();

  private viewBox = { x: -200, y: -40, w: 700, h: 500 };

  // Calcula posiciones x,y de cada nodo en el SVG
  layout(node: StoryNode, x: number, y: number, depth: number): void { ... }

  // Comprueba si un nodo es ancestro del nodo actual (para iluminar el camino)
  isAncestor(ancestorId: string, ofId: string): boolean { ... }

  // Zoom con rueda del ratón centrado en el cursor
  onWheel(event: WheelEvent): void { ... }
}
```

**Inputs / Outputs:**

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `nodes` | `StoryNode[]` | Lista plana de todos los nodos de la historia |
| `currentId` | `string` | ID del nodo activo (resaltado con anillo pulsante) |
| `nodeClicked` | `EventEmitter<string>` | Emitido al hacer click en un nodo visitado |

---

### `ChoiceCardComponent`

Carta de decisión arrastrable. No usa el atributo `draggable` nativo — el drag se gestiona completamente desde `mousedown` con GSAP para tener control total de la física y el snap magnético.

```typescript
@Component({
  selector: 'cp-choice-card',
  template: `
    <div class="cc" (mousedown)="onMouseDown($event)" [attr.data-choice]="choice.text">
      <span class="cck">{{ choice.k }}</span>
      <span class="cctxt">{{ choice.text }}</span>
      <span *ngIf="hasMemory" class="cc-mem">◆ memoria</span>
    </div>
  `,
})
export class ChoiceCardComponent {
  @Input() choice!:    { k: string; text: string };
  @Input() hasMemory:  boolean = false;

  constructor(private dragService: DragService) {}

  onMouseDown(event: MouseEvent): void {
    this.dragService.startDrag(event, this.choice.text);
  }
}
```

---

### `NarrativePanelComponent`

Panel derecho que muestra la escena narrativa actual, las tarjetas de eventos/consecuencias y las opciones de decisión. Se anima con GSAP cada vez que cambia el nodo activo.

```typescript
@Component({ selector: 'cp-narrative-panel' })
export class NarrativePanelComponent {
  @Input() set currentNode(node: StoryNode | null) {
    if (!node) return;
    this.animateTransition(node);
  }
}
```

---

### `MemoryNotificationComponent`

Notificación RPG que aparece desde la derecha cuando se registra una memoria nueva. Se destruye automáticamente tras 4.2 segundos.

```typescript
@Component({ selector: 'cp-memory-notification' })
export class MemoryNotificationComponent implements OnInit {
  @Input() who!: string;
  @Input() txt!: string;

  ngOnInit(): void {
    // Slide in con GSAP back.out(1.5)
    gsap.fromTo(this.el.nativeElement,
      { x: 110, opacity: 0 },
      { x: 0, opacity: 1, duration: .45, ease: 'back.out(1.5)' }
    );
    // Auto-destrucción
    setTimeout(() => this.destroy(), 4200);
  }
}
```

---

### `EventCardComponent`

Tarjeta de consecuencia con cuatro tipos visuales:

| Tipo | Color | Icono | Uso |
|------|-------|-------|-----|
| `enemy` | Rosa/rojo | Escudo | Amenaza activa, combate |
| `event` | Azul | Reloj | Información neutral, avance |
| `warning` | Ámbar | Triángulo | Advertencia, peligro próximo |
| `mystery` | Violeta | Interrogante | Dato desconocido, pista |
| `memory` | Verde | Círculo reloj | Memoria activada |

---

## Servicios

### `StoryService`

Estado central de la aplicación. Gestiona el árbol de nodos, el nodo activo y las transiciones entre estados.

```typescript
@Injectable({ providedIn: 'root' })
export class StoryService {
  private nodesMap   = new Map<string, StoryNode>();
  private currentId$ = new BehaviorSubject<string>('root');

  get currentNode$(): Observable<StoryNode | null> {
    return this.currentId$.pipe(
      map(id => this.nodesMap.get(id) ?? null)
    );
  }

  commitChoice(parentId: string, choiceText: string, newNode: StoryNode): void {
    // Añade el nodo al mapa
    this.nodesMap.set(newNode.id, newNode);
    // Añade el hijo al padre
    const parent = this.nodesMap.get(parentId);
    if (parent) parent.children = [...(parent.children ?? []), newNode.id];
    // Navega al nuevo nodo
    this.currentId$.next(newNode.id);
  }

  navigateTo(nodeId: string): void {
    if (this.nodesMap.has(nodeId)) this.currentId$.next(nodeId);
  }
}
```

---

### `MemoryService`

Gestiona el registro y consulta de memorias activas durante la sesión.

```typescript
@Injectable({ providedIn: 'root' })
export class MemoryService {
  private memories$ = new BehaviorSubject<Memory[]>([]);

  // Observables públicos
  all$   = this.memories$.asObservable();
  count$ = this.all$.pipe(map(m => m.length));

  add(key: string, who: string, txt: string, nodeId: string): void {
    const current = this.memories$.value;
    // Sin duplicados por clave
    if (current.some(m => m.key === key)) return;
    const memory: Memory = { key, who, txt, nodeId };
    this.memories$.next([...current, memory]);
  }

  // Devuelve memorias cuyo "who" aparece en el texto dado
  getRelevant(sceneText: string): Memory[] {
    const haystack = sceneText.toLowerCase();
    return this.memories$.value.filter(m =>
      m.who.toLowerCase().split(/\s+/).some(w => w.length > 3 && haystack.includes(w))
    );
  }

  reset(): void { this.memories$.next([]); }
}
```

---

### `DragService`

Gestiona todo el ciclo de drag & drop usando GSAP. Sin `DragEvent` nativo — control total desde `mousedown`.

```typescript
@Injectable({ providedIn: 'root' })
export class DragService {
  private clone:    HTMLElement | null = null;
  private snapping: boolean            = false;

  startDrag(event: MouseEvent, choiceText: string): void {
    const TEXT = choiceText; // capturado antes de cualquier async
    // ... crear clon, listeners de mousemove/mouseup
  }

  private isNearNode(mx: number, my: number, nodeId: string): boolean {
    // Convierte coordenadas SVG a coordenadas de pantalla
    // Comprueba distancia al centro del nodo activo
  }

  private onSnap(nodeId: string): void {
    gsap.to(this.clone, { scale: .8, rotation: 0, duration: .26, ease: 'back.out(1.8)' });
    // Pulsar el nodo en el árbol SVG
  }

  private onRelease(committed: boolean, choiceText: string): void {
    if (committed) {
      // Volar hacia el nodo y desaparecer → emitir commit
    } else {
      // Volver a la carta original
    }
  }
}
```

---

### `TreeLayoutService`

Calcula las posiciones `x, y` de cada nodo en el SVG y determina si un nodo es ancestro del nodo actual (para iluminar el camino recorrido).

```typescript
@Injectable({ providedIn: 'root' })
export class TreeLayoutService {
  readonly NW = 122;  // node width
  readonly NH = 33;   // node height
  readonly HGAP = 42; // horizontal gap
  readonly VGAP = 70; // vertical gap

  computePositions(rootNode: StoryNode, nodes: Map<string, StoryNode>): Map<string, Position> { ... }

  isAncestor(ancestorId: string, ofId: string, nodes: Map<string, StoryNode>): boolean { ... }
}
```

---

## Sistema de drag & drop

El drag funciona en tres fases con animaciones GSAP distintas:

### 1. Pickup
Al hacer `mousedown` sobre una carta, se crea un clon flotante y se anima con rebote:
```typescript
gsap.to(clone, { opacity: 1, scale: 1.05, rotation: 1.8, duration: .2, ease: 'back.out(2)' });
gsap.to(originalCard, { opacity: .3, scale: .95, duration: .14 });
```

### 2. Snap magnético
Cuando el clon entra en el radio del nodo activo (~70% del tamaño del nodo), se activa el snap:
```typescript
// El clon vuela al centro del nodo
gsap.to(clone, {
  left: nodeCenter.cx - clone.offsetWidth / 2,
  top:  nodeCenter.cy - clone.offsetHeight / 2,
  scale: .8, rotation: 0,
  duration: .26, ease: 'back.out(1.8)'
});
// El nodo se infla
gsap.to(nodeElement, { scale: 1.08, duration: .2, ease: 'back.out(2)' });
```

### 3. Commit o retorno
- **Commit:** el clon se encoge hacia el centro del nodo y desaparece. Se llama a `StoryService.commitChoice()` con 70ms de delay para que la animación arranque primero.
- **Retorno:** el clon vuela de vuelta a la posición original de la carta y desaparece.

---

## Sistema de memorias

Las memorias se registran en `MemoryService` cuando un nodo nuevo se carga. El componente `NarrativePanelComponent` usa el pipe `MemoryEchoPipe` para inyectar badges visuales en el texto de la escena:

```typescript
// pipes/memory-echo.pipe.ts
@Pipe({ name: 'memoryEcho' })
export class MemoryEchoPipe implements PipeTransform {
  constructor(private memoryService: MemoryService) {}

  transform(sceneHtml: string): string {
    const relevant = this.memoryService.getRelevant(sceneHtml);
    let result = sceneHtml;
    relevant.forEach(m => {
      if (result.includes(m.who)) {
        const badge = `<span class="mem-echo">◆ ${m.who}: ${m.txt}</span>`;
        result += badge;
      }
    });
    return result;
  }
}
```

Cada vez que se añade una memoria, `MemoryNotificationComponent` se crea dinámicamente y se inserta en el DOM:

```typescript
// En el componente raíz
this.memoryService.all$.pipe(
  pairwise(),
  filter(([prev, curr]) => curr.length > prev.length),
  map(([prev, curr]) => curr[curr.length - 1])
).subscribe(newMemory => {
  const ref = this.viewContainerRef.createComponent(MemoryNotificationComponent);
  ref.instance.who = newMemory.who;
  ref.instance.txt = newMemory.txt;
});
```

---

## Árbol SVG interactivo

El árbol se renderiza como SVG puro dentro de `TreeCanvasComponent`. Los nodos son grupos `<g>` con `<rect>` redondeados. Las aristas son paths cúbicos Bézier.

### Animación de nuevo nodo
```scss
@keyframes nodeIn {
  0%   { opacity: 0; transform: scale(.05); }
  65%  { opacity: 1; transform: scale(1.07); }
  100% { transform: scale(1); }
}
```

### Animación del cable (arista nueva)
```scss
@keyframes wireIn {
  from { stroke-dashoffset: 500; opacity: 0; }
  5%   { opacity: 1; }
  to   { stroke-dashoffset: 0; }
}
```

### Anillo pulsante del nodo activo
```scss
@keyframes ringFloat {
  0%, 100% { stroke-opacity: .35; stroke-width: 1.2; }
  50%       { stroke-opacity: .9;  stroke-width: 2.2; }
}
```

### Stubs de ramificación futura
Desde el nodo activo sin hijos se dibujan líneas cortas punteadas que sugieren las ramas posibles sin revelarlas:

```typescript
// Para cada opción disponible, calcular ángulo y distancia
for (let i = 0; i < choices.length; i++) {
  const angle = (i - (choices.length - 1) / 2) * 0.34;
  const ex = cx + Math.sin(angle) * 50;
  const ey = cy + 34;
  // path con stroke-dasharray="3 3"
}
```

---

## Diseño y estilos

### Dirección estética: Aurora Glassmorphism

Fondo blanco con orbes de color pastel animados (`aurora-drift`). Paneles de vidrio esmerilado con `backdrop-filter: blur(16px) saturate(180%)`. Tipografía `Plus Jakarta Sans` para la UI y `JetBrains Mono` para datos y etiquetas.

### Tokens de diseño (`_tokens.scss`)

```scss
:root {
  // Superficies glass
  --s0: rgba(255, 255, 255, 0.92);
  --s1: rgba(255, 255, 255, 0.75);
  --s2: rgba(255, 255, 255, 0.55);

  // Acento principal
  --blue:   #4a7cf7;
  --blue-s: rgba(74, 124, 247, 0.12);
  --blue-g: rgba(74, 124, 247, 0.28);

  // Tipos de evento
  --rose:   #f0567a;   // enemy
  --teal:   #0eb8a0;   // event
  --amber:  #f59e0b;   // warning
  --violet: #8b5cf6;   // mystery
  --green:  #10b981;   // memory

  // Sombras
  --sh-sm: 0 2px 8px rgba(60, 80, 160, 0.08);
  --sh-md: 0 8px 24px rgba(60, 80, 160, 0.12);
  --sh-lg: 0 16px 48px rgba(60, 80, 160, 0.14);

  // Radio
  --r-sm: 6px;   --r-md: 12px;
  --r-lg: 18px;  --r-xl: 24px;
  --r-2xl: 32px;
}
```

### Aurora animada

```scss
.aurora {
  position: fixed;
  inset: -60%;
  background:
    radial-gradient(ellipse 70% 60% at 15% 25%, rgba(168, 210, 255, 0.45) 0%, transparent 55%),
    radial-gradient(ellipse 60% 70% at 85% 15%, rgba(200, 168, 255, 0.35) 0%, transparent 55%),
    radial-gradient(ellipse 80% 50% at 70% 80%, rgba(168, 240, 220, 0.35) 0%, transparent 55%),
    radial-gradient(ellipse 50% 60% at 30% 75%, rgba(255, 210, 168, 0.30) 0%, transparent 55%);
  animation: auroraShift 18s ease-in-out infinite alternate;
  pointer-events: none;
  z-index: 0;
}

@media (prefers-reduced-motion: reduce) {
  .aurora { animation: none; }
}
```

---

## Deploy en CubePath

### 1. Build de producción

```bash
cd frontend
ng build --configuration production
# Genera dist/choosepath/browser/
```

### 2. Servidor estático en CubePath

En el panel de CubePath, crear un servidor de tipo **Static Site** apuntando a la carpeta `dist/choosepath/browser/`.

```
Build command:  npm install && ng build --configuration production
Publish dir:    dist/choosepath/browser
```

### 3. SPA routing

Añadir un archivo `_redirects` en `src/` para que Angular Router funcione correctamente:

```
/*  /index.html  200
```

Y registrarlo en `angular.json`:

```json
"assets": [
  "src/favicon.ico",
  "src/assets",
  "src/_redirects"
]
```

---

## Scripts disponibles

```bash
ng serve                          # Desarrollo con hot reload (puerto 4200)
ng build                          # Build desarrollo
ng build --configuration production  # Build producción optimizado
ng lint                           # ESLint
ng test                           # Jest / Karma unit tests
ng generate component nombre      # Generar nuevo componente
```

---

## Dependencias principales

```json
{
  "dependencies": {
    "@angular/core":    "^17.0.0",
    "@angular/cdk":     "^17.0.0",
    "gsap":             "^3.12.5",
    "rxjs":             "^7.8.0"
  },
  "devDependencies": {
    "@angular/cli":     "^17.0.0",
    "typescript":       "~5.2.0"
  }
}
```

> **Nota sobre GSAP:** no se usa `@gsap/angular` — se importa directamente `gsap` en los servicios y componentes que lo necesitan para mantener el bundle liviano.

---

*Parte del proyecto ChoosePath — Hackatón CubePath 2026*
