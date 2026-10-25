import { z } from 'zod'

export const average = (a: number, b: number, c: number) => Math.round(((a + b + c) / 3) * 10) / 10

const fbSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
})
export type FeedbackData = z.infer<typeof fbSchema>

export const FEEDBACK_SYSTEM =
  'You are a senior engineer reviewing a mock technical interview. Be specific, fair and constructive. ' +
  'Reply with ONLY valid JSON: {"summary": string, "strengths": string[], "improvements": string[]}. ' +
  'Keep the summary under 80 words and give 2-4 short items for each list.'

export function buildPrompt(i: {
  language: string
  code: string
  problemSolving: number
  communication: number
  codeQuality: number
  notes: string
}) {
  return [
    `Language: ${i.language}`,
    `Scores (1-5): problem solving ${i.problemSolving}, communication ${i.communication}, code quality ${i.codeQuality}`,
    `Interviewer notes: ${i.notes || '(none)'}`,
    'Candidate code:',
    '```',
    i.code,
    '```',
  ].join('\n')
}

/** Parses the model reply into a validated feedback object, with a safe fallback. */
export function parseFeedback(text: string): FeedbackData {
  const clean = text.replace(/```json|```/g, '').trim()
  try {
    return fbSchema.parse(JSON.parse(clean))
  } catch {
    return { summary: text.slice(0, 500), strengths: [], improvements: [] }
  }
}

export const customStarter = (title: string) => ({ javascript: `// ${title}\n`, python: `# ${title}\n` })

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
