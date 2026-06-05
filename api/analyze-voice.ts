import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGroqClient, GROQ_MODEL } from './_lib/groq';
import { handleCors } from './_lib/cors';
import { handleGroqError } from './_lib/stream';

interface AnalyzeVoiceInput {
  sampleResponses: string[];
}

interface AnalyzeVoiceResult {
  toneDescriptors: string[];
  formality: number;
  warmth: number;
  verbosity: number;
  summary: string;
}

const SYSTEM_PROMPT = `You are a writing style analyst. Analyze the tone and voice of restaurant review responses.

Return ONLY valid JSON in this exact format — no markdown, no code blocks:
{
  "toneDescriptors": ["string", ...],
  "formality": number,
  "warmth": number,
  "verbosity": number,
  "summary": "string"
}

Scoring guidelines:
- formality: 1 (very casual) to 5 (very formal)
- warmth: 1 (cool/matter-of-fact) to 5 (very warm/enthusiastic)
- verbosity: 1 (very brief) to 5 (very elaborate)
- toneDescriptors: 3–6 short adjectives that capture the writing voice (e.g., "empathetic", "professional", "witty")
- summary: 1–2 sentences describing the brand voice that a copywriter could use as guidance`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as Partial<AnalyzeVoiceInput>;

  if (!body.sampleResponses || !Array.isArray(body.sampleResponses)) {
    return res.status(400).json({ error: 'Missing required field: sampleResponses (array)' });
  }

  const samples = body.sampleResponses
    .filter((s) => typeof s === 'string' && s.trim().length > 20)
    .slice(0, 10);

  if (samples.length === 0) {
    return res.status(400).json({ error: 'At least one non-empty sample response is required' });
  }

  const samplesBlock = samples
    .map((s, i) => `Sample ${i + 1}:\n"${s.trim()}"`)
    .join('\n\n');

  try {
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze the writing style of these ${samples.length} review response${samples.length !== 1 ? 's' : ''}:\n\n${samplesBlock}`,
        },
      ],
      stream: false,
      max_tokens: 500,
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] ?? '{}') as Partial<AnalyzeVoiceResult>;

      const clamp = (n: unknown): number => {
        const num = typeof n === 'number' ? n : 3;
        return Math.min(5, Math.max(1, Math.round(num)));
      };

      const result: AnalyzeVoiceResult = {
        toneDescriptors: Array.isArray(parsed.toneDescriptors)
          ? (parsed.toneDescriptors as unknown[])
              .filter((d): d is string => typeof d === 'string')
              .slice(0, 6)
          : [],
        formality: clamp(parsed.formality),
        warmth: clamp(parsed.warmth),
        verbosity: clamp(parsed.verbosity),
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      };

      return res.status(200).json(result);
    } catch {
      return res.status(500).json({ error: 'Failed to parse analysis result' });
    }
  } catch (err: unknown) {
    handleGroqError(err, res, false);
  }
}
