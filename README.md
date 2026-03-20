# ChoosePath 🌿

**Narrativas interactivas con IA y sistema de memoria persistente**

> Crea historias de decisiones ramificadas donde las elecciones importan — y los personajes lo recuerdan.

🔗 **Demo en vivo:** `https://choosepath.cubepath.app` *(reemplazar con URL real al desplegar)*  
🏆 **Hackatón CubePath 2026**

---

## ¿Qué es ChoosePath?

ChoosePath es una aplicación web donde el usuario construye y juega historias interactivas tipo *choose your own adventure* mediante un árbol visual de decisiones. Lo que lo diferencia:

- **Sistema de memoria:** cada decisión que tomas queda registrada. Personajes futuros recuerdan lo que hiciste — un guardia que viste antes te reconoce, una alianza que rompiste cierra puertas más adelante.
- **Árbol narrativo visual:** el progreso se representa como un grafo de nodos interactivo, navegable con zoom y paneo.
- **Drag & drop con física:** arrastras tus opciones hacia el árbol con animaciones GSAP — el nodo activo tiene magnetismo, el cable de conexión se dibuja con efecto resorte al soltarlo.
- **Consecuencias múltiples:** cada nodo puede tener varios eventos simultáneos con tipo (enemigo, aviso, misterio, evento) que aparecen como tarjetas de contexto.
- **Integración con Claude API:** el backend genera continuaciones narrativas y consecuencias en tiempo real según la decisión tomada.

---

## Capturas

> *(Añadir GIFs o imágenes aquí antes de la entrega)*

| Vista del árbol | Sistema de memoria | Drag & drop |
|---|---|---|
| `screenshot-tree.png` | `screenshot-memory.png` | `screenshot-drag.gif` |

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | Angular + TypeScript |
| Animaciones | GSAP 3 |
| Backend | Node.js + Express |
| Base de datos | SQLite |
| IA | Claude API (`claude-sonnet-4-20250514`) |
| Deploy | CubePath |

---

## Arquitectura

```
choosepath/
├── frontend/                  # Angular app
│   └── src/app/
│       ├── components/
│       │   ├── tree-canvas/   # SVG árbol interactivo + drag & drop GSAP
│       │   ├── narrative/     # Panel narrativo + tarjetas de consecuencias
│       │   ├── choice-card/   # Cartas arrastrables
│       │   └── memory-notif/  # Notificaciones RPG "X recordará esto"
│       └── services/
│           ├── story.service.ts    # Estado del árbol y nodos
│           ├── memory.service.ts   # Sistema de memoria persistente
│           └── ai.service.ts       # Claude API
│
├── backend/                   # Node.js + Express
│   ├── routes/
│   │   ├── story.js           # CRUD de historias y nodos
│   │   └── ai.js              # Proxy a Claude API
│   ├── db/
│   │   └── database.js        # SQLite: stories + nodes + memories
│   └── services/
│       └── claude.js          # Generación narrativa con contexto de memorias
│
└── README.md
```

---

## Sistema de Memoria

El sistema de memoria es el corazón de ChoosePath. Cada decisión importante genera una entrada de memoria con:

- **Quién:** el personaje o evento que genera la memoria
- **Qué:** descripción breve de lo ocurrido
- **Nodo origen:** dónde en el árbol se generó

Estas memorias luego **modifican el texto de escenas futuras** cuando son relevantes. Por ejemplo:

```
Descubres en la bodega que Drace trabaja para Kael
           ↓
Más adelante, cuando interactúas con Drace:
"◆ Memoria: Drace confirmado agente de Kael."
aparece inyectado en la narrativa
```

La IA también recibe el contexto de memorias activas al generar nuevas escenas, haciendo que las consecuencias de tus acciones persistan de forma natural en el relato.

---

## Cómo funciona la IA

El backend llama a Claude con el siguiente esquema de prompt:

```javascript
const generateNextNode = async (storyContext, playerChoice, activeMemories) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Eres el narrador de una historia interactiva de aventuras.

Historia hasta ahora:
${storyContext}

Memorias activas del jugador:
${activeMemories.map(m => `- ${m.who}: ${m.txt}`).join('\n')}

El jugador elige: "${playerChoice}"

Responde SOLO con JSON válido:
{
  "consequence": "Descripción narrativa de lo que ocurre (2-4 oraciones, inmersiva)",
  "events": [
    { "type": "enemy|event|warning|mystery", "who": "Nombre del personaje/evento", "txt": "Descripción breve" }
  ],
  "choices": [
    { "k": "A", "text": "Descripción de la opción (máx 8 palabras)" },
    { "k": "B", "text": "..." },
    { "k": "C", "text": "..." }
  ],
  "memories": [
    { "key": "clave_unica", "who": "Personaje", "txt": "Lo que recordará" }
  ],
  "isEnding": false
}`
      }]
    })
  });
};
```

---

## Modelo de datos (SQLite)

```sql
CREATE TABLE stories (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  genre      TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE nodes (
  id           TEXT PRIMARY KEY,
  story_id     TEXT REFERENCES stories(id),
  parent_id    TEXT,
  choice_taken TEXT,
  scene        TEXT NOT NULL,
  events       TEXT,   -- JSON array
  choices      TEXT,   -- JSON array
  depth        INTEGER DEFAULT 0,
  is_ending    INTEGER DEFAULT 0
);

CREATE TABLE memories (
  id        TEXT PRIMARY KEY,
  story_id  TEXT REFERENCES stories(id),
  key       TEXT NOT NULL,
  who       TEXT NOT NULL,
  txt       TEXT NOT NULL,
  node_id   TEXT REFERENCES nodes(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Cómo usar CubePath

El proyecto se despliega en **CubePath** usando dos servidores:

### Backend (Node.js)
```bash
# En CubePath, crear servidor Node.js
# Puerto: 3000
npm install
npm start
```

### Frontend (Angular)
```bash
# Build de producción
ng build --configuration production

# En CubePath, servir la carpeta dist/
# Puerto: 80
```

### Variables de entorno necesarias en CubePath
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
DATABASE_PATH=./db/choosepath.sqlite
FRONTEND_URL=https://choosepath.cubepath.app
```

---

## Instalación local

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/choosepath
cd choosepath

# Backend
cd backend
npm install
cp .env.example .env   # añadir ANTHROPIC_API_KEY
npm run dev

# Frontend (nueva terminal)
cd frontend
npm install
ng serve
```

La app estará disponible en `http://localhost:4200`.

---

## Funcionalidades implementadas

- [x] Árbol narrativo visual con SVG interactivo
- [x] Drag & drop con magnetismo y animaciones GSAP
- [x] Cables de conexión con animación resorte al crear nodo
- [x] Sistema de memoria persistente por sesión
- [x] Notificaciones RPG "X recordará esto" con slide-in
- [x] Consecuencias múltiples por nodo (enemigo / aviso / misterio / evento)
- [x] Inyección de contexto de memoria en escenas futuras
- [x] Zoom y paneo del árbol con rueda del ratón
- [x] Historia completa de ejemplo con 3 ramas y 12+ nodos
- [x] Exportar historia completa como HTML jugable standalone
- [x] Panel de memorias acumuladas en sidebar
- [x] Profundidad de capítulo visualizada con indicador de progreso
- [x] Teclado accesible (Enter/Espacio como alternativa al drag)
- [x] Navegación hacia atrás tocando nodos visitados

---

## Equipo

| Nombre | Rol |
|---|---|
| *(tu nombre)* | Frontend + diseño |
| *(nombre compañero)* | Backend + Claude API |
| *(nombre compañero)* | Deploy CubePath + historia |

---

## Licencia

MIT — libre para usar, modificar y distribuir.

---

*Hecho con ☕ para la Hackatón CubePath 2026*
