import { describe, it, expect } from 'vitest'
import { average, buildPrompt, parseFeedback, customStarter, escapeHtml } from './lib'

describe('average', () => {
  it('rounds to one decimal', () => {
    expect(average(3, 4, 4)).toBe(3.7)
    expect(average(5, 5, 5)).toBe(5)
  })
})

describe('parseFeedback', () => {
  it('parses plain JSON', () => {
    const r = parseFeedback('{"summary":"Good","strengths":["a"],"improvements":["b"]}')
    expect(r).toEqual({ summary: 'Good', strengths: ['a'], improvements: ['b'] })
  })
  it('strips markdown fences', () => {
    const r = parseFeedback('```json\n{"summary":"Ok"}\n```')
    expect(r.summary).toBe('Ok')
    expect(r.strengths).toEqual([])
  })
  it('falls back when the reply is not JSON', () => {
    const r = parseFeedback('Sorry, no JSON here')
    expect(r.summary).toBe('Sorry, no JSON here')
    expect(r.improvements).toEqual([])
  })
})

describe('buildPrompt', () => {
  it('includes scores, notes and code', () => {
    const p = buildPrompt({ language: 'python', code: 'print(1)', problemSolving: 4, communication: 3, codeQuality: 5, notes: 'clear' })
    expect(p).toContain('problem solving 4')
    expect(p).toContain('clear')
    expect(p).toContain('print(1)')
  })
})

describe('customStarter', () => {
  it('puts the title in both languages', () => {
    const r = customStarter('My problem')
    expect(r.javascript).toContain('My problem')
    expect(r.python).toContain('My problem')
  })
})

describe('escapeHtml', () => {
  it('escapes HTML so names cannot inject markup into emails', () => {
    expect(escapeHtml('<b>"x"</b> & \'y\'')).toBe('&lt;b&gt;&quot;x&quot;&lt;/b&gt; &amp; &#39;y&#39;')
  })
})
