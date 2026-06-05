import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGroqClient, GROQ_MODEL } from './_lib/groq';
import { handleCors } from './_lib/cors';
import { initSse, sseEvent, sseDone, sseError, emitTextAsChunks, handleGroqError } from './_lib/stream';

interface ApplyPromptInput {
  currentResponse: string;
  instruction: string;
  brandContext?: string;
  reviewContext?: string;
}

interface ApplyPromptResult {
  newResponse: string;
  changeDescription: string;
}

const SYSTEM_PROMPT = `You are editing a restaurant owner's review response. Apply the instruction to the current response.

Rules:
- Make ONLY the minimal changes needed to satisfy the instruction
- Preserve all other content exactly as written
- NEVER hallucinate facts, offers, prices, or contact information not already present or provided
- If the instruction is ambiguous, make the most conservative reasonable interpretation
- Keep the same tone and voice unless the instruction specifically asks to change it

Return ONLY valid JSON in this exact format — no markdown, no code blocks, no explanation:
{"newResponse":"string","changeDescription":"string"}

changeDescription should be one short sentence describing what changed (e.g., "Added apology for the wait time", "Replaced greeting with guest's name").`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as Partial<ApplyPromptInput>;

  if (!body.currentResponse || !body.instruction) {
    return res.status(400).json({ error: 'Missing required fields: currentResponse, instruction' });
  }

  if (body.instruction.length > 500) {
    return res.status(400).json({ error: 'Instruction too long (max 500 characters)' });
  }

  const contextBlocks: string[] = [];
  if (body.brandContext) {
    contextBlocks.push(`Brand context:\n${body.brandContext}`);
  }
  if (body.reviewContext) {
    contextBlocks.push(`Review context:\n${body.reviewContext}`);
  }

  const contextSection = contextBlocks.length > 0
    ? `\n\n${contextBlocks.join('\n\n')}`
    : '';

  const userMessage = `Current response:
"${body.currentResponse}"

Instruction: ${body.instruction}${contextSection}

Apply the instruction and return the JSON.`;

  initSse(res);

  try {
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      stream: false,
      max_tokens: Math.max(body.currentResponse.length * 2 + 200, 800),
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';

    let result: ApplyPromptResult;

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] ?? '{}') as Partial<ApplyPromptResult>;

      if (!parsed.newResponse) {
        throw new Error('No newResponse in parsed JSON');
      }

      result = {
        newResponse: parsed.newResponse,
        changeDescription: parsed.changeDescription ?? 'Response updated',
      };
    } catch {
      result = {
        newResponse: body.currentResponse,
        changeDescription: 'No change applied — could not parse AI response',
      };
    }

    emitTextAsChunks(res, result.newResponse);
    sseEvent(res, 'change', { changeDescription: result.changeDescription });
    sseDone(res);
  } catch (err: unknown) {
    handleGroqError(err, res, true);
  }
}
