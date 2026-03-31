import { describe, it, expect } from 'vitest'
import {
  parsePercentToken,
  replacePercentTokensInText,
  resolvePercentValue,
  resolvePercentToken,
} from './resolvePercentToken'

describe('parsePercentToken', () => {
  it('parses plain BASE%%', () => {
    expect(parsePercentToken('40%%')).toEqual({ kind: 'plain', base: 40 })
  })

  it('parses BASE%%CAP when CAP > 0', () => {
    expect(parsePercentToken('40%%50')).toEqual({ kind: 'cap', base: 40, cap: 50 })
  })

  it('parses BASE%%-P when P > 0', () => {
    expect(parsePercentToken('40%%-50')).toEqual({ kind: 'neg', base: 40, p: 50 })
  })

  it('returns null for invalid tokens', () => {
    expect(parsePercentToken('40%%0')).toBeNull()
    expect(parsePercentToken('40%%-0')).toBeNull()
    expect(parsePercentToken('nope')).toBeNull()
    expect(parsePercentToken('40%%%')).toBeNull()
    expect(parsePercentToken('40%%50%%')).toBeNull()
  })
})

describe('resolvePercentValue', () => {
  it('40%%: §3.1 BASE×(1+0.01×L)', () => {
    expect(resolvePercentValue(0, '40%%')).toBe(40)
    expect(resolvePercentValue(100, '40%%')).toBe(80)
  })

  it('40%%50: §3.2 linear to ×(1+CAP/100) at L=100; freeze after 100', () => {
    expect(resolvePercentValue(100, '40%%50')).toBe(60)
    expect(resolvePercentValue(50, '40%%50')).toBe(50) // 40 * (1 + 0.5 * 0.5)
    expect(resolvePercentValue(150, '40%%50')).toBe(60)
  })

  it('40%%-50: §3.3 at L=100 → 30; L=0 base; linear in t=min(L,100)', () => {
    expect(resolvePercentValue(100, '40%%-50')).toBe(30)
    expect(resolvePercentValue(0, '40%%-50')).toBe(40)
    expect(resolvePercentValue(50, '40%%-50')).toBe(35) // 40 * (1 - 0.5 * 50/200)
    expect(resolvePercentValue(200, '40%%-50')).toBe(30)
  })

  it('returns null for bad level or token', () => {
    expect(resolvePercentValue(-1, '40%%')).toBeNull()
    expect(resolvePercentValue(0, 'bad')).toBeNull()
  })
})

describe('resolvePercentToken', () => {
  it('aliases resolvePercentValue (spec B wiki name)', () => {
    expect(resolvePercentToken(0, '40%%')).toBe(40)
  })
})

describe('replacePercentTokensInText', () => {
  it('leaves plain text unchanged at level 50', () => {
    expect(replacePercentTokensInText(50, 'hello\nworld')).toBe('hello\nworld')
  })

  it('replaces valid tokens at L=0', () => {
    expect(replacePercentTokensInText(0, 'a 10%% b 20%%50 c')).toBe('a 10 b 20 c')
  })

  it('leaves invalid 40%%0 and 40%%-0 unchanged at level 10', () => {
    expect(replacePercentTokensInText(10, '40%%0 x 40%%-0')).toBe('40%%0 x 40%%-0')
  })

  it('replaces 40%% with resolved value in the middle of lines at L=100', () => {
    expect(resolvePercentValue(100, '40%%')).toBe(80)
    expect(replacePercentTokensInText(100, 'line1\n40%%\nline2')).toBe('line1\n80\nline2')
  })

  it('does not rematch inside replacement (10%% -> 10)', () => {
    expect(replacePercentTokensInText(0, '10%%')).toBe('10')
  })
})
