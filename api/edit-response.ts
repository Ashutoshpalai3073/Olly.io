import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGroqClient, GROQ_MODEL } from './_lib/groq';
import { handleCors } from './_lib/cors';
import { handleGroqError } from './_lib/stream';

type EditAction =
  | 'rephrase'
  | 'shorten'
  | 'lengthen'
  | 'stronger'
  | 'softer'
  | 'more_formal'
  | 'more_casual'
  | 'fix_grammar';

interface EditInput {
  currentResponse: string;
  action: EditAction;
  selectedText?: string;
  selectionStart?: number;
  selectionEnd?: number;
  brandContext?: string;
}

interface EditOutput {
  newResponse: string;
  changedSection: {
    start: number;
    end: number;
    text: string;
  } | null;
}

const ACTION_INSTRUCTIONS: Record<EditAction, string> = {
  rephrase: 'Rephrase the following text using different words while preserving the exact same meaning and tone.',
  shorten: 'Shorten the following text significantly, keeping the core message but cutting unnecessary words and filler.',
  lengthen: 'Expand the following text with more warmth, detail, or context. Stay on topic and do not add false information.',
  stronger: 'Rewrite the following text to be more assertive, confident, and emphatic.',
  softer: 'Rewrite the following text to be more gentle, empathetic, and understanding.',
  more_formal: 'Rewrite the following text in a more formal, polished, professional register.',
  more_casual: 'Rewrite the following text in a more casual, relaxed, conversational register.',
  fix_grammar: 'Fix any grammatical errors, spelling mistakes, awkward phrasing, or punctuation issues in the following text.',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as Partial<EditInput>;

  if (!body.currentResponse || !body.action) {
    return res.status(400).json({ error: 'Missing required fields: currentResponse, action' });
  }

  const validActions: EditAction[] = [
    'rephrase', 'shorten', 'lengthen', 'stronger', 'softer',
    'more_formal', 'more_casual', 'fix_grammar',
  ];
  if (!validActions.includes(body.action)) {
    return res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` });
  }

  const hasSelection =
    body.selectedText != null &&
    body.selectionStart != null &&
    body.selectionEnd != null;

  const targetText = hasSelection ? body.selectedText! : body.currentResponse;
  const instruction = ACTION_INSTRUCTIONS[body.action];

  const systemPrompt = [
    'Return ONLY the modified text. No explanation. No quotes. No preamble.',
    body.brandContext ? `\nBrand context:\n${body.brandContext}` : '',
  ]
    .filter(Boolean)
    .join('');

  const userMessage = `${instruction}\n\nText:\n${targetText}`;

  try {
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: false,
      max_tokens: Math.max(targetText.length * 2, 500),
      temperature: 0.5,
    });

    const editedText = completion.choices[0]?.message?.content?.trim() ?? targetText;

    let newResponse: string;
    let changedSection: EditOutput['changedSection'] = null;

    if (hasSelection) {
      const start = body.selectionStart!;
      const original = body.currentResponse;

      newResponse =
        original.slice(0, start) + editedText + original.slice(body.selectionEnd!);

      changedSection = {
        start,
        end: start + editedText.length,
        text: editedText,
      };
    } else {
      newResponse = editedText;
    }

    const output: EditOutput = { newResponse, changedSection };
    return res.status(200).json(output);
  } catch (err: unknown) {
    handleGroqError(err, res, false);
  }
}
