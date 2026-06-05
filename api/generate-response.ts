import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGroqClient, GROQ_MODEL, GROQ_FAST_MODEL, PLATFORM_CHAR_LIMITS, formalityLabel, warmthLabel } from './_lib/groq';
import { handleCors } from './_lib/cors';
import { initSse, sseEvent, sseDone, sseError, streamGroqToSse, handleGroqError } from './_lib/stream';

interface GenerateInput {
  reviewText: string;
  rating: 1 | 2 | 3 | 4 | 5;
  platform: string;
  reviewerName: string;
  brandName: string;
  brandVoice?: string;
  brandRules?: string[];
  contactInfo?: string;
  toneFormality?: number;
  toneWarmth?: number;
}

interface ExtractedTag {
  label: string;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

function buildSystemPrompt(input: GenerateInput): string {
  const charLimit = PLATFORM_CHAR_LIMITS[input.platform] ?? 2000;

  const formality = input.toneFormality != null
    ? `${input.toneFormality}/5 — ${formalityLabel(input.toneFormality)}`
    : '3/5 — Balanced: professional but approachable';

  const warmth = input.toneWarmth != null
    ? `${input.toneWarmth}/5 — ${warmthLabel(input.toneWarmth)}`
    : '3/5 — Genuinely friendly and sincere';

  const rules = input.brandRules && input.brandRules.length > 0
    ? input.brandRules.map((r, i) => `${i + 1}. ${r}`).join('\n')
    : '1. Be genuine and specific to what the reviewer mentioned\n2. Never use copy-paste filler phrases\n3. Keep it concise';

  const voiceLine = input.brandVoice
    ? `\nBRAND VOICE: ${input.brandVoice}`
    : '';

  const contactLine = input.contactInfo
    ? `\nCONTACT: ${input.contactInfo} (include only if it directly helps the guest)`
    : '';

  return `You are writing a review response on behalf of ${input.brandName}, a restaurant brand.
${voiceLine}
FORMALITY: ${formality}
WARMTH: ${warmth}

RULES — follow every one:
${rules}
${contactLine}

PLATFORM: ${input.platform} (character limit: ${charLimit})
REVIEWER: ${input.reviewerName}, gave ${input.rating} star${input.rating !== 1 ? 's' : ''}

Write ONE response only. No preamble. No meta-commentary. Make it feel genuinely human and specific to what this reviewer said — never copy-paste generic phrases. Under ${charLimit} characters.`;
}

async function extractTags(
  reviewText: string,
  responseText: string
): Promise<ExtractedTag[]> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: GROQ_FAST_MODEL,
    messages: [
      {
        role: 'system',
        content: `Extract topic tags from a restaurant review. Return ONLY valid JSON in this exact format — no markdown, no explanation:
{"tags":[{"label":"string","category":"string","sentiment":"positive"|"negative"|"neutral"}]}

Valid categories: food, service, ambiance, value, experience, cleanliness, wait_time
Max 6 tags. Only include topics explicitly mentioned.`,
      },
      {
        role: 'user',
        content: `Review: ${reviewText}`,
      },
    ],
    stream: false,
    max_tokens: 300,
    temperature: 0.1,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '{"tags":[]}';

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{"tags":[]}') as { tags: ExtractedTag[] };
    return Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [];
  } catch {
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as Partial<GenerateInput>;

  if (!body.reviewText || !body.rating || !body.platform || !body.reviewerName || !body.brandName) {
    return res.status(400).json({ error: 'Missing required fields: reviewText, rating, platform, reviewerName, brandName' });
  }

  const input: GenerateInput = {
    reviewText: body.reviewText,
    rating: body.rating,
    platform: body.platform,
    reviewerName: body.reviewerName,
    brandName: body.brandName,
    brandVoice: body.brandVoice,
    brandRules: body.brandRules,
    contactInfo: body.contactInfo,
    toneFormality: body.toneFormality,
    toneWarmth: body.toneWarmth,
  };

  const charLimit = PLATFORM_CHAR_LIMITS[input.platform] ?? 2000;

  initSse(res);

  try {
    const groq = getGroqClient();
    const systemPrompt = buildSystemPrompt(input);

    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Review text: "${input.reviewText}"\n\nWrite the response now.`,
        },
      ],
      stream: true,
      max_tokens: charLimit + 100,
      temperature: 0.7,
    });

    const fullResponse = await streamGroqToSse(res, stream);

    const tags = await extractTags(input.reviewText, fullResponse).catch(() => []);
    sseEvent(res, 'tags', { tags });

    sseDone(res);
  } catch (err: unknown) {
    handleGroqError(err, res, true);
  }
}
