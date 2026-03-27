/**
 * AI prompt builders for each story generation endpoint.
 *
 * Design principles:
 * - System prompt: defines the AI's role, constraints, and JSON schema.
 * - User prompt: provides the specific task with all context.
 * - All prompts request strict JSON output so Ollama's `format: "json"` mode works correctly.
 */

import type {
  GenerateRequest,
  ContinueRequest,
  RegenerateRequest,
  VisitedNode,
  ActiveMemory,
} from './story.types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function historyBlock(history: VisitedNode[]): string {
  if (history.length === 0) return '(ninguno — esta es la primera escena)';
  return history
    .map((n, i) =>
      [
        `  [Nodo ${i + 1}] ID: "${n.nodeId}" | Label: "${n.label}"`,
        `  Escena: ${n.scene.slice(0, 180)}${n.scene.length > 180 ? '...' : ''}`,
        n.choiceTaken ? `  Elección tomada: "${n.choiceTaken}"` : '  (nodo hoja — sin elección)',
      ].join('\n'),
    )
    .join('\n\n');
}

function memoriesBlock(memories: ActiveMemory[]): string {
  if (memories.length === 0) return '(ninguna memoria activa todavía)';
  return memories
    .map((m) => `  [${m.key}] ${m.who}: "${m.text}"`)
    .join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// /generate — Initial story tree (3 levels)
// ─────────────────────────────────────────────────────────────────────────────

export function buildGenerateSystemPrompt(): string {
  return `Eres un escritor experto en ficción interactiva de alta calidad. Tu tarea es generar el árbol inicial de una historia ramificada para un juego de aventura de texto.

REGLAS ABSOLUTAS:
1. Responde ÚNICAMENTE con un objeto JSON válido. Sin texto extra, sin markdown, sin explicaciones.
2. Sigue EXACTAMENTE el esquema JSON que se te proporcione.
3. Cada nodo debe tener exactamente 3 choices, a menos que sea un nodo hoja (fin de rama).
4. Los IDs de nodo deben ser snake_case, cortos, semánticos y únicos (ej: "puerto_niebla", "bodega_a").
5. El campo "scene" puede contener <em>texto</em> para énfasis. Máximo 3 párrafos breves.
6. El campo "label" es un título ultra-corto para el árbol visual (máximo 4 palabras).
7. Las memorias solo se crean cuando el jugador descubre algo significativo (personaje importante, secreto, artefacto).
8. Los "memoryKeys" en un nodo deben referenciar claves que EXISTEN en el objeto "memories" de la respuesta.
9. Genera exactamente 3 niveles de profundidad: 1 nodo raíz → 3 nodos nivel 2 → 9 nodos nivel 3 (hojas).
10. Los nodos de nivel 3 son HOJAS: sus choices tienen nextNodeId vacío ("") para indicar que se generarán después.
11. El idioma de toda la narrativa debe coincidir con el campo "language" de la solicitud.

ESQUEMA JSON DE RESPUESTA:
{
  "title": "string — título evocador de la historia",
  "rootNodeId": "string — ID del nodo raíz",
  "nodes": {
    "<nodeId>": {
      "label": "string — máx 4 palabras",
      "scene": "string — narrativa inmersiva con <em> para énfasis",
      "choices": [
        { "key": "A", "text": "string", "nextNodeId": "string" },
        { "key": "B", "text": "string", "nextNodeId": "string" },
        { "key": "C", "text": "string", "nextNodeId": "string" }
      ],
      "events": [
        { "type": "enemy|event|warning|mystery|memory", "who": "string", "description": "string" }
      ],
      "memoryKeys": ["string"]
    }
  },
  "memories": {
    "<memoryKey>": {
      "key": "string",
      "who": "string",
      "text": "string — descripción breve de la memoria"
    }
  }
}`;
}

export function buildGenerateUserPrompt(req: GenerateRequest): string {
  return `Genera el árbol inicial de una historia interactiva con las siguientes características:

TEMÁTICA: ${req.theme}
GÉNERO: ${req.genre}
TONO: ${req.tone}
IDIOMA DE NARRATIVA: ${req.language}

ESTRUCTURA REQUERIDA:
- Nivel 0 (raíz): 1 nodo. Introduce el mundo, el protagonista y la situación inicial. Ofrece 3 primeras decisiones.
- Nivel 1: 3 nodos. Cada uno continúa una rama diferente iniciada por la raíz. Cada uno ofrece 3 decisiones más.
- Nivel 2 (hojas): 9 nodos. Son el final de esta generación. Sus choices deben tener nextNodeId: "" (vacío) para señalar que se continuarán después. NO incluyas choices en estos nodos — devuelve un array de choices vacío [].

Asegúrate de que:
- Las ramas sean temáticamente distintas entre sí (exploración vs acción vs misterio, por ejemplo).
- El tono "${req.tone}" se mantenga consistente en toda la narrativa.
- La historia sea inmersiva, específica y evite clichés genéricos.
- Los eventos reflejen consecuencias dramáticas del mundo.
- Solo crees memorias para descubrimientos verdaderamente importantes.

Responde SOLO con el JSON según el esquema indicado.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// /continue — Next single node
// ─────────────────────────────────────────────────────────────────────────────

export function buildContinueSystemPrompt(): string {
  return `Eres un escritor experto en ficción interactiva. Tu tarea es generar el SIGUIENTE NODO de una historia ramificada que ya está en progreso.

REGLAS ABSOLUTAS:
1. Responde ÚNICAMENTE con un objeto JSON válido. Sin texto extra, sin markdown, sin explicaciones.
2. El nodo que generes debe continuar naturalmente la escena anterior y la elección tomada.
3. Considera TODAS las memorias activas del jugador — pueden influir en lo que ocurre en esta escena.
4. La narrativa debe mantener la coherencia con el historial completo de escenas visitadas.
5. Si el nodo está en nivel 3 o más profundo, los choices deben tener nextNodeId: "" (se generarán después) y si no hay más ramas lógicas puedes devolver choices: [].
6. Puedes crear nuevas memorias si en esta escena ocurre algo significativo.
7. El campo "scene" puede tener <em>texto</em> para énfasis. Escribe de 1 a 3 párrafos breves.
8. El campo "label" es un título ultra-corto para el árbol visual (máximo 4 palabras).

ESQUEMA JSON DE RESPUESTA:
{
  "nodeId": "string — el mismo targetNodeId que se te proporcionó",
  "node": {
    "label": "string",
    "scene": "string",
    "choices": [
      { "key": "A", "text": "string", "nextNodeId": "string o vacío" },
      { "key": "B", "text": "string", "nextNodeId": "string o vacío" },
      { "key": "C", "text": "string", "nextNodeId": "string o vacío" }
    ],
    "events": [
      { "type": "enemy|event|warning|mystery|memory", "who": "string", "description": "string" }
    ],
    "memoryKeys": ["string"]
  },
  "newMemories": {
    "<memoryKey>": {
      "key": "string",
      "who": "string",
      "text": "string"
    }
  }
}`;
}

export function buildContinueUserPrompt(req: ContinueRequest): string {
  return `Continúa la siguiente historia interactiva generando el PRÓXIMO NODO.

═══ CONTEXTO DE LA HISTORIA ═══
Título: ${req.storyTitle}
Temática: ${req.theme}
Género: ${req.genre}
Tono: ${req.tone}
Idioma: ${req.language}
Profundidad actual: nivel ${req.depth}

═══ HISTORIAL COMPLETO DE ESCENAS VISITADAS ═══
${historyBlock(req.history)}

═══ MEMORIAS ACTIVAS DEL JUGADOR ═══
${memoriesBlock(req.activeMemories)}

═══ TAREA ESPECÍFICA ═══
El jugador estaba en el nodo "${req.parentNodeId}" y eligió:
  → "${req.chosenText}"

Genera el nodo con ID: "${req.targetNodeId}"

Este nodo debe:
- Continuar directamente desde la elección tomada.
- Ser coherente con todo el historial anterior (no repetir escenas, no contradecir eventos pasados).
- Tener en cuenta las memorias activas si son relevantes para esta escena.
- ${req.depth >= 3 ? 'Como está en nivel ' + req.depth + ', los nextNodeId de los choices deben ser "" (vacíos), o devolver choices: [] si es un final natural.' : 'Ofrecer exactamente 3 choices con nextNodeIds semánticos únicos.'}

Responde SOLO con el JSON según el esquema indicado.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// /regenerate — Subtree from a branch point
// ─────────────────────────────────────────────────────────────────────────────

export function buildRegenerateSystemPrompt(): string {
  return `Eres un escritor experto en ficción interactiva. Tu tarea es REGENERAR un subárbol de una historia que ya está en progreso, comenzando desde un nodo de bifurcación específico.

REGLAS ABSOLUTAS:
1. Responde ÚNICAMENTE con un objeto JSON válido. Sin texto extra, sin markdown, sin explicaciones.
2. El nodo raíz del subárbol debe reconectarse coherentemente con el historial previo.
3. Los IDs de nodo deben ser NUEVOS y únicos — no reutilices IDs anteriores del historial.
4. Genera el número de niveles indicado en la solicitud.
5. Los nodos hoja (último nivel) deben tener choices: [] o nextNodeId: "" en sus choices.
6. Considera las memorias activas — pueden cambiar el rumbo de la nueva historia.
7. La nueva rama debe ser notablemente diferente a lo que el jugador ya experimentó.
8. El idioma debe coincidir con el campo "language".

ESQUEMA JSON DE RESPUESTA:
{
  "rootNodeId": "string — ID del nodo raíz de este subárbol",
  "nodes": {
    "<nodeId>": {
      "label": "string",
      "scene": "string",
      "choices": [
        { "key": "A", "text": "string", "nextNodeId": "string o vacío" },
        { "key": "B", "text": "string", "nextNodeId": "string o vacío" },
        { "key": "C", "text": "string", "nextNodeId": "string o vacío" }
      ],
      "events": [...],
      "memoryKeys": ["string"]
    }
  },
  "newMemories": {
    "<memoryKey>": { "key": "string", "who": "string", "text": "string" }
  }
}`;
}

export function buildRegenerateUserPrompt(req: RegenerateRequest): string {
  return `Regenera un subárbol de la siguiente historia interactiva.

═══ CONTEXTO DE LA HISTORIA ═══
Título: ${req.storyTitle}
Temática: ${req.theme}
Género: ${req.genre}
Tono: ${req.tone}
Idioma: ${req.language}

═══ HISTORIAL PREVIO (hasta el punto de bifurcación) ═══
${historyBlock(req.historyUpToBranch)}

═══ MEMORIAS ACTIVAS DEL JUGADOR ═══
${memoriesBlock(req.activeMemories)}

═══ TAREA ESPECÍFICA ═══
Regenera el subárbol comenzando desde el nodo de bifurcación:
  ID del nodo raíz del subárbol: "${req.branchNodeId}"
  Profundidad del nodo raíz: nivel ${req.branchDepth}
  Niveles a generar: ${req.levels} niveles desde la raíz

Este subárbol debe:
- Conectar coherentemente con el historial previo mostrado arriba.
- Ser una versión ALTERNATIVA y diferente a lo que el jugador ya exploró.
- Mantener el tono "${req.tone}" y la temática de la historia.
- Los nodos en el último nivel (nivel ${req.branchDepth + req.levels - 1}) deben tener choices: [] o nextNodeId: "".
- Usar IDs de nodo únicos que NO colisionen con los IDs del historial.

Responde SOLO con el JSON según el esquema indicado.`;
}
