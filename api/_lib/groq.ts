import Groq from 'groq-sdk';

let _client: Groq | null = null;

export function getGroqClient(): Groq {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Missing GROQ_API_KEY env var');
    _client = new Groq({ apiKey });
  }
  return _client;
}

export const GROQ_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_FAST_MODEL = 'llama-3.1-8b-instant';

export const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  google: 4096,
  yelp: 5000,
  tripadvisor: 2200,
  opentable: 1500,
  doordash: 1000,
  ubereats: 1500,
  grubhub: 1000,
  apple_maps: 1000,
};

const FORMALITY_LABELS: Record<number, string> = {
  1: 'Very casual — conversational, like texting a friend',
  2: 'Casual and relaxed, minimal formality',
  3: 'Balanced — professional but warm and approachable',
  4: 'Formal and polished, business-appropriate',
  5: 'Very formal — corporate, measured tone throughout',
};

const WARMTH_LABELS: Record<number, string> = {
  1: 'Cool and matter-of-fact — no personal flair',
  2: 'Polite but reserved, low-key friendliness',
  3: 'Genuinely friendly and sincere',
  4: 'Warm and caring, personal touch in every sentence',
  5: 'Very warm and enthusiastic — heartfelt and personal',
};

export interface BrandContextInput {
  brandName: string;
  brandVoice?: string;
  toneFormality?: number;
  toneWarmth?: number;
  brandRules?: string[];
  contactInfo?: string;
  signature?: string;
  managerName?: string;
  platform?: string;
}

export function buildBrandContext(input: BrandContextInput): string {
  const lines: string[] = [`Brand: ${input.brandName}`];

  if (input.brandVoice) {
    lines.push(`Voice: ${input.brandVoice}`);
  }

  if (input.toneFormality != null) {
    const rounded = Math.round(Math.min(5, Math.max(1, input.toneFormality)));
    const label = FORMALITY_LABELS[rounded] ?? FORMALITY_LABELS[3];
    lines.push(`Formality (${input.toneFormality}/5): ${label}`);
  }

  if (input.toneWarmth != null) {
    const rounded = Math.round(Math.min(5, Math.max(1, input.toneWarmth)));
    const label = WARMTH_LABELS[rounded] ?? WARMTH_LABELS[3];
    lines.push(`Warmth (${input.toneWarmth}/5): ${label}`);
  }

  if (input.managerName) {
    lines.push(`Sign off as: ${input.managerName}`);
  }

  if (input.signature) {
    lines.push(`Signature line: ${input.signature}`);
  }

  if (input.contactInfo) {
    lines.push(`Contact info (use only if directly helpful): ${input.contactInfo}`);
  }

  if (input.platform) {
    const limit = PLATFORM_CHAR_LIMITS[input.platform] ?? 2000;
    lines.push(`Platform: ${input.platform} (char limit: ${limit})`);
  }

  if (input.brandRules && input.brandRules.length > 0) {
    lines.push('Rules to follow:');
    input.brandRules.forEach((rule, i) => {
      lines.push(`  ${i + 1}. ${rule}`);
    });
  }

  return lines.join('\n');
}

export function formalityLabel(value: number): string {
  const rounded = Math.round(Math.min(5, Math.max(1, value)));
  return FORMALITY_LABELS[rounded] ?? FORMALITY_LABELS[3];
}

export function warmthLabel(value: number): string {
  const rounded = Math.round(Math.min(5, Math.max(1, value)));
  return WARMTH_LABELS[rounded] ?? WARMTH_LABELS[3];
}
