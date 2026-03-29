/**
 * Express router for story generation endpoints.
 *
 * All three routes call the Gemini API (generativelanguage.googleapis.com)
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
  GeminiRequest,
  GeminiResponse,
} from './story.types.js';
import { environment } from '../environments/environment.js';

export const storyRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_URL = environment.geminiUrl;
const GEMINI_KEY = environment.geminiKey;

// ─────────────────────────────────────────────────────────────────────────────
// Shared Gemini helper
// ─────────────────────────────────────────────────────────────────────────────

async function callGemini(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const body: GeminiRequest = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.85,
      topP: 0.92,
      maxOutputTokens: 32768,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Gemini ${response.status}: ${await response.text()}`);

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  return JSON.parse(text);
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
    const result = await callGemini(
      buildGenerateSystemPrompt(),
      buildGenerateUserPrompt(request),
    );
    res.json(result as GenerateResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(err)
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
    isDeath: body.isDeath ?? false,
  };

  try {
    const result = await callGemini(
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
    const result = await callGemini(
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
