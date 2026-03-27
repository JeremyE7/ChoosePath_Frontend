/**
 * Express router for story generation endpoints.
 *
 * All three routes call Ollama's HTTP API at http://localhost:11434/api/chat
 * using plain fetch (Node.js 18+ built-in).
 *
 * Routes:
 *   POST /api/stories/generate    — Generate initial story tree (3 levels)
 *   POST /api/stories/continue    — Generate next single node with full context
 *   POST /api/stories/regenerate  — Regenerate subtree from a branch point
 */

import { Router, type Request, type Response } from 'express';
import {
  buildGenerateSystemPrompt,
  buildGenerateUserPrompt,
  buildContinueSystemPrompt,
  buildContinueUserPrompt,
  buildRegenerateSystemPrompt,
  buildRegenerateUserPrompt,
} from './story.prompts.js';
import type {
  GenerateRequest,
  GenerateResponse,
  ContinueRequest,
  ContinueResponse,
  RegenerateRequest,
  RegenerateResponse,
  OllamaChatRequest,
  OllamaChatResponse,
} from './story.types.js';

export const storyRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const OLLAMA_URL = process.env['OLLAMA_URL'] ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env['OLLAMA_MODEL'] ?? 'llama3.1';

// ─────────────────────────────────────────────────────────────────────────────
// Shared Ollama helper
// ─────────────────────────────────────────────────────────────────────────────

async function callOllama(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const body: OllamaChatRequest = {
    model: OLLAMA_MODEL,
    stream: false,
    format: 'json',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    options: {
      temperature: 0.85,
      top_p: 0.92,
      num_predict: 4096,
    },
  };

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama returned ${response.status}: ${text}`);
  }

  const data = (await response.json()) as OllamaChatResponse;

  if (!data.message?.content) {
    throw new Error('Ollama response missing message.content');
  }

  try {
    return JSON.parse(data.message.content) as unknown;
  } catch {
    throw new Error(`Ollama returned invalid JSON: ${data.message.content.slice(0, 200)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stories/generate
// ─────────────────────────────────────────────────────────────────────────────

storyRouter.post('/generate', async (req: Request, res: Response) => {
  const body = req.body as Partial<GenerateRequest>;

  if (!body.theme || !body.genre || !body.tone) {
    res.status(400).json({ error: 'Missing required fields: theme, genre, tone' });
    return;
  }

  const request: GenerateRequest = {
    theme: body.theme,
    genre: body.genre,
    tone: body.tone,
    language: body.language ?? 'es',
  };

  try {
    const result = await callOllama(
      buildGenerateSystemPrompt(),
      buildGenerateUserPrompt(request),
    );
    res.json(result as GenerateResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/generate] Error:', message);
    res.status(502).json({ error: 'Story generation failed', detail: message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stories/continue
// ─────────────────────────────────────────────────────────────────────────────

storyRouter.post('/continue', async (req: Request, res: Response) => {
  const body = req.body as Partial<ContinueRequest>;

  if (
    !body.storyTitle ||
    !body.theme ||
    !body.genre ||
    !body.tone ||
    !body.parentNodeId ||
    !body.chosenText ||
    !body.targetNodeId ||
    body.depth == null
  ) {
    res.status(400).json({
      error: 'Missing required fields: storyTitle, theme, genre, tone, parentNodeId, chosenText, targetNodeId, depth',
    });
    return;
  }

  const request: ContinueRequest = {
    storyTitle: body.storyTitle,
    theme: body.theme,
    genre: body.genre,
    tone: body.tone,
    language: body.language ?? 'es',
    history: body.history ?? [],
    activeMemories: body.activeMemories ?? [],
    parentNodeId: body.parentNodeId,
    chosenText: body.chosenText,
    targetNodeId: body.targetNodeId,
    depth: body.depth,
  };

  try {
    const result = await callOllama(
      buildContinueSystemPrompt(),
      buildContinueUserPrompt(request),
    );
    res.json(result as ContinueResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/continue] Error:', message);
    res.status(502).json({ error: 'Node generation failed', detail: message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stories/regenerate
// ─────────────────────────────────────────────────────────────────────────────

storyRouter.post('/regenerate', async (req: Request, res: Response) => {
  const body = req.body as Partial<RegenerateRequest>;

  if (
    !body.storyTitle ||
    !body.theme ||
    !body.genre ||
    !body.tone ||
    !body.branchNodeId ||
    body.branchDepth == null
  ) {
    res.status(400).json({
      error: 'Missing required fields: storyTitle, theme, genre, tone, branchNodeId, branchDepth',
    });
    return;
  }

  const request: RegenerateRequest = {
    storyTitle: body.storyTitle,
    theme: body.theme,
    genre: body.genre,
    tone: body.tone,
    language: body.language ?? 'es',
    historyUpToBranch: body.historyUpToBranch ?? [],
    activeMemories: body.activeMemories ?? [],
    branchNodeId: body.branchNodeId,
    branchDepth: body.branchDepth,
    levels: body.levels ?? 3,
  };

  try {
    const result = await callOllama(
      buildRegenerateSystemPrompt(),
      buildRegenerateUserPrompt(request),
    );
    res.json(result as RegenerateResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/regenerate] Error:', message);
    res.status(502).json({ error: 'Regeneration failed', detail: message });
  }
});
