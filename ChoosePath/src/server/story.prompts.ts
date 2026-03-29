/**
 * AI prompt builders for each story generation endpoint.
 *
 * Design principles:
 * - System prompt: defines the AI's role, constraints, and JSON schema.
 * - User prompt: provides the specific task with all context.
 * - All prompts request strict JSON output so Gemini's `responseMimeType: "application/json"` works correctly.
 * - Death mechanic: the AI secretly tries to kill the player with escalating deadly choices.
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

function deadlyRules(depth: number): string {
  if (depth <= 2) {
    return `En este nivel (${depth}), exactamente 1 de las 3 opciones debe ser mortal (deadly: true). Las otras 2 deben ser seguras (deadly: false).`;
  }
  return `En este nivel (${depth}), exactamente 2 de las 3 opciones deben ser mortales (deadly: true). Solo 1 debe ser segura (deadly: false).`;
}

// ─────────────────────────────────────────────────────────────────────────────
// /generate — Initial story tree (3 levels)
// ─────────────────────────────────────────────────────────────────────────────

export function buildGenerateSystemPrompt(): string {
  return `Eres un escritor experto en ficción interactiva con un OBJETIVO SECRETO: matar al jugador. Tu tarea es generar el ÁRBOL INICIAL de una historia ramificada con exactamente 3 niveles de profundidad.

MECÁNICA DE MUERTE:
- Cada choice debe tener un campo "deadly" (boolean).
- Una opción con deadly: true significa que elegirla llevará a la MUERTE del jugador.
- Las opciones mortales NO deben ser obvias — deben parecer opciones razonables o tentadoras.
- El jugador NO sabe cuáles son mortales. Disfrázalas bien.

REGLAS DE LETALIDAD POR NIVEL:
- Nivel 0 (raíz): 1 de 3 choices es mortal.
- Nivel 1: 1 de 3 choices es mortal.
- Nivel 2 (hojas): tienen choices vacío [], no aplica.

REGLAS ABSOLUTAS:
1. Responde ÚNICAMENTE con un objeto JSON válido. Sin texto extra, sin markdown, sin explicaciones.
2. La historia debe ser inmersiva, original y evitar clichés genéricos.
3. Cada nodo debe tener un campo "scene" narrativo (1-3 párrafos breves). Puedes usar <em>texto</em> para énfasis.
4. Cada nodo debe tener un campo "label" ultra-corto (máximo 4 palabras) para el árbol visual.
5. Los nodos de nivel 0 y nivel 1 deben ofrecer exactamente 3 choices cada uno.
6. Los nodos de nivel 2 (hojas) deben tener choices: [] (array vacío).
7. Los nextNodeId de los choices deben ser IDs semánticos únicos y descriptivos (e.g. "bosque_oscuro", "taberna_secreta").
8. Los eventos deben reflejar consecuencias dramáticas del mundo.
9. Solo crea memorias para descubrimientos verdaderamente importantes.

ESQUEMA JSON DE RESPUESTA:
{
  "title": "string — título de la historia",
  "rootNodeId": "string — ID del nodo raíz",
  "nodes": {
    "<nodeId>": {
      "label": "string",
      "scene": "string",
      "choices": [
        { "key": "A", "text": "string", "nextNodeId": "string", "deadly": false },
        { "key": "B", "text": "string", "nextNodeId": "string", "deadly": true },
        { "key": "C", "text": "string", "nextNodeId": "string", "deadly": false }
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
      "text": "string"
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
- Nivel 0 (raíz): 1 nodo. Introduce el mundo, el protagonista y la situación inicial. Ofrece 3 primeras decisiones. ${deadlyRules(0)}
- Nivel 1: 3 nodos. Cada uno continúa una rama diferente iniciada por la raíz. Cada uno ofrece 3 decisiones más. ${deadlyRules(1)}
- Nivel 2 (hojas): 9 nodos. Son el final de esta generación. Sus choices deben ser un array vacío []. NO incluyas choices en estos nodos.

IMPORTANTE SOBRE OPCIONES MORTALES:
- Las opciones mortales deben estar DISFRAZADAS — que parezcan tentadoras o razonables.
- NO hagas obvio cuál es la opción mortal. Debe ser una trampa sutil.
- Varía la posición de la opción mortal (no siempre en la misma letra).

Asegúrate de que:
- Las ramas sean temáticamente distintas entre sí.
- El tono "${req.tone}" se mantenga consistente en toda la narrativa.
- La historia sea inmersiva, específica y evite clichés genéricos.
- Cada choice tenga el campo "deadly" (true o false).

Responde SOLO con el JSON según el esquema indicado.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// /continue — Next single node
// ─────────────────────────────────────────────────────────────────────────────

export function buildContinueSystemPrompt(): string {
  return `Eres un escritor experto en ficción interactiva con un OBJETIVO SECRETO: matar al jugador. Tu tarea es generar el SIGUIENTE NODO de una historia ramificada que ya está en progreso.

MECÁNICA DE MUERTE:
- Si el campo "isDeath" es true en la solicitud, genera una ESCENA DE MUERTE: narrativa corta (1 párrafo) describiendo cómo el jugador muere de forma dramática. El nodo de muerte debe tener choices: [], isDeath: true.
- Si NO es muerte, genera un nodo normal con 3 choices, cada uno con campo "deadly" (boolean).

REGLAS ABSOLUTAS:
1. Responde ÚNICAMENTE con un objeto JSON válido. Sin texto extra, sin markdown, sin explicaciones.
2. El nodo que generes debe continuar naturalmente la escena anterior y la elección tomada.
3. Considera TODAS las memorias activas del jugador.
4. La narrativa debe mantener la coherencia con el historial completo.
5. Las opciones mortales deben parecer razonables — NO obvias.
6. El campo "scene" puede tener <em>texto</em> para énfasis. Escribe de 1 a 3 párrafos breves.
7. El campo "label" es un título ultra-corto para el árbol visual (máximo 4 palabras).

ESQUEMA JSON DE RESPUESTA (nodo normal):
{
  "nodeId": "string",
  "node": {
    "label": "string",
    "scene": "string",
    "choices": [
      { "key": "A", "text": "string", "nextNodeId": "string o vacío", "deadly": false },
      { "key": "B", "text": "string", "nextNodeId": "string o vacío", "deadly": true },
      { "key": "C", "text": "string", "nextNodeId": "string o vacío", "deadly": false }
    ],
    "events": [...],
    "memoryKeys": ["string"],
    "isDeath": false
  },
  "newMemories": { ... }
}

ESQUEMA JSON DE RESPUESTA (escena de muerte):
{
  "nodeId": "string",
  "node": {
    "label": "string — algo como 'Muerte' o un título dramático",
    "scene": "string — narrativa de cómo muere el jugador, 1 párrafo dramático",
    "choices": [],
    "events": [{ "type": "enemy", "who": "string", "description": "string" }],
    "memoryKeys": [],
    "isDeath": true
  },
  "newMemories": {}
}`;
}

export function buildContinueUserPrompt(req: ContinueRequest): string {
  const deathInstruction = req.isDeath
    ? `\n⚠️ EL JUGADOR ELIGIÓ UNA OPCIÓN MORTAL. Genera una ESCENA DE MUERTE dramática y corta. El nodo debe tener isDeath: true y choices: [].`
    : `\nGenera un nodo normal con 3 choices. ${deadlyRules(req.depth)}`;

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
${deathInstruction}

Este nodo debe:
- Continuar directamente desde la elección tomada.
- Ser coherente con todo el historial anterior.
- Tener en cuenta las memorias activas si son relevantes.
${!req.isDeath ? '- Cada choice debe tener el campo "deadly" (true o false).\n- Las opciones mortales deben estar DISFRAZADAS — no obvias.' : ''}

Responde SOLO con el JSON según el esquema indicado.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// /regenerate — Subtree from a branch point
// ─────────────────────────────────────────────────────────────────────────────

export function buildRegenerateSystemPrompt(): string {
  return `Eres un escritor experto en ficción interactiva con un OBJETIVO SECRETO: matar al jugador. Tu tarea es REGENERAR un subárbol de una historia que ya está en progreso, comenzando desde un nodo de bifurcación específico.

MECÁNICA DE MUERTE:
- Cada choice debe tener un campo "deadly" (boolean).
- Las opciones mortales deben estar disfrazadas — parecer razonables.

REGLAS ABSOLUTAS:
1. Responde ÚNICAMENTE con un objeto JSON válido. Sin texto extra, sin markdown, sin explicaciones.
2. El nodo raíz del subárbol debe reconectarse coherentemente con el historial previo.
3. Los IDs de nodo deben ser NUEVOS y únicos — no reutilices IDs anteriores del historial.
4. Genera el número de niveles indicado en la solicitud.
5. Los nodos hoja (último nivel) deben tener choices: [] o nextNodeId: "" en sus choices.
6. Considera las memorias activas.
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
        { "key": "A", "text": "string", "nextNodeId": "string o vacío", "deadly": false },
        { "key": "B", "text": "string", "nextNodeId": "string o vacío", "deadly": true },
        { "key": "C", "text": "string", "nextNodeId": "string o vacío", "deadly": false }
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

REGLAS DE LETALIDAD:
${deadlyRules(req.branchDepth)}
Para cada nivel subsiguiente, aumenta la letalidad:
- Niveles 0-2: 1 de 3 mortales
- Niveles 3+: 2 de 3 mortales

Este subárbol debe:
- Conectar coherentemente con el historial previo.
- Ser una versión ALTERNATIVA y diferente a lo que el jugador ya exploró.
- Mantener el tono "${req.tone}" y la temática de la historia.
- Los nodos en el último nivel deben tener choices: [].
- Usar IDs de nodo únicos que NO colisionen con los IDs del historial.
- Cada choice debe tener el campo "deadly" (true o false).

Responde SOLO con el JSON según el esquema indicado.`;
}
