import type { ReviewContext, BrandSettingsPayload } from './api'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL    = 'llama-3.3-70b-versatile'

function buildSystemPrompt(brand: BrandSettingsPayload): string {
  let p = `You write professional restaurant review responses for ${brand.brandName}.`
  if (brand.brandVoice) p += `\n\nBrand voice: ${brand.brandVoice}`
  if (brand.brandRules?.length) {
    p += `\n\nRules:\n${brand.brandRules.map(r => `- ${r}`).join('\n')}`
  }
  p += '\n\nBe warm, specific, and genuine. Keep it concise (2-4 sentences for positive reviews, slightly longer for negatives). Never be defensive. Do not start with "I".'
  return p
}

function buildUserMessage(review: ReviewContext, instruction?: string): string {
  const base =
    `Write a response to this ${review.rating}-star ${review.platform} review` +
    ` from ${review.reviewerName}` +
    (review.locationName ? ` at ${review.locationName}` : '') +
    `:\n\n"${review.reviewText}"`
  return instruction ? `${base}\n\nAdditional instruction: ${instruction}` : base
}

export async function groqStream(
  review:      ReviewContext,
  brand:       BrandSettingsPayload,
  onChunk:     (chunk: string) => void,
  onDone:      (fullText: string) => void,
  onError:     (error: string) => void,
  instruction?: string
): Promise<void> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    onError('VITE_GROQ_API_KEY is not set in .env')
    return
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:      MODEL,
        messages:   [
          { role: 'system', content: buildSystemPrompt(brand) },
          { role: 'user',   content: buildUserMessage(review, instruction) },
        ],
        stream:     true,
        max_tokens: 400,
      }),
    })

    if (!res.ok || !res.body) {
      onError(`Groq error ${res.status}`)
      return
    }

    const reader   = res.body.getReader()
    const decoder  = new TextDecoder()
    let   fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const raw   = decoder.decode(value)
      const lines = raw.split('\n').filter(l => l.startsWith('data: '))

      for (const line of lines) {
        const data = line.slice(6)
        if (data === '[DONE]') { onDone(fullText); return }
        try {
          const parsed = JSON.parse(data)
          const text   = parsed.choices?.[0]?.delta?.content ?? ''
          if (text) { fullText += text; onChunk(text) }
        } catch { /* skip malformed */ }
      }
    }

    onDone(fullText)
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Groq request failed')
  }
}

export async function groqComplete(
  systemPrompt: string,
  userMessage:  string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) return ''

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:      MODEL,
        messages:   [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage  },
        ],
        stream:     false,
        max_tokens: 400,
      }),
    })

    if (!res.ok) return ''
    const json = await res.json()
    return (json.choices?.[0]?.message?.content ?? '') as string
  } catch {
    return ''
  }
}
