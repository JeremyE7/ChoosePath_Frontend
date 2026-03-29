import { Router, type Request, type Response } from 'express';
import { Score } from './score.model.js';

export const scoreRouter = Router();

scoreRouter.post('/', async (req: Request, res: Response) => {
  const { nickname, score, storyTitle } = req.body ?? {};

  if (!nickname || score == null || !storyTitle) {
    res.status(400).json({ error: 'Missing required fields: nickname, score, storyTitle' });
    return;
  }

  if (typeof nickname !== 'string' || nickname.length > 30) {
    res.status(400).json({ error: 'Nickname must be a string of max 30 characters' });
    return;
  }

  try {
    const entry = await Score.create({ nickname, score, storyTitle });
    res.status(201).json(entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[POST /scores] Error:', message);
    res.status(500).json({ error: 'Failed to save score', detail: message });
  }
});

scoreRouter.get('/top', async (_req: Request, res: Response) => {
  try {
    const scores = await Score.find()
      .sort({ score: -1, date: 1 })
      .limit(20)
      .lean();
    res.json(scores);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /scores/top] Error:', message);
    res.status(500).json({ error: 'Failed to fetch scores', detail: message });
  }
});
