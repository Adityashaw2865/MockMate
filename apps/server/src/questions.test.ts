import { describe, it, expect } from 'vitest'
import { QUESTIONS } from './questions'

describe('question bank', () => {
  it('has unique ids', () => {
    expect(new Set(QUESTIONS.map((x) => x.id)).size).toBe(QUESTIONS.length)
  })
  it('has starter code for JavaScript and Python', () => {
    for (const x of QUESTIONS) {
      expect(x.starter.javascript).toContain(x.title)
      expect(x.starter.python).toContain(x.title)
    }
  })
  it('covers all difficulty levels', () => {
    expect(new Set(QUESTIONS.map((x) => x.difficulty))).toEqual(new Set(['Easy', 'Medium', 'Hard']))
  })
})
