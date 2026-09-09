import { describe, expect, it } from 'vitest'
import { INPUT_LIMITS, isBoundedCommand, isBoundedCommandText, parseJsonWithinLimits, InputLimitError } from './input-limits'

describe('límites de entrada', () => {
  it('acepta JSON normal y comandos pequeños', () => {
    expect(parseJsonWithinLimits('{"type":"reset"}')).toEqual({ type: 'reset' })
    expect(isBoundedCommand({ type: 'submit-input', input: 'investigar altar' })).toBe(true)
  })

  it('rechaza JSON demasiado profundo, grande o con claves peligrosas', () => {
    const deep = Array.from({ length: INPUT_LIMITS.maxDepth + 2 }, () => []).reduce((value) => [value], {})

    expect(() => parseJsonWithinLimits(JSON.stringify(deep))).toThrow(InputLimitError)
    expect(() => parseJsonWithinLimits(JSON.stringify({ value: 'x'.repeat(INPUT_LIMITS.maxJsonBytes) }))).toThrow('tamaño')
    expect(() => parseJsonWithinLimits('{"__proto__":{"polluted":true}}')).toThrow('peligrosa')
  })

  it('rechaza comandos serializados o textos por encima del límite', () => {
    expect(isBoundedCommand({ type: 'submit-input', input: 'x'.repeat(INPUT_LIMITS.maxCommandTextLength + 1) })).toBe(false)
    expect(isBoundedCommandText('x'.repeat(INPUT_LIMITS.maxCommandTextLength))).toBe(true)
    expect(isBoundedCommandText('x'.repeat(INPUT_LIMITS.maxCommandTextLength + 1))).toBe(false)
    expect(isBoundedCommand({ type: 'reset', data: 'x'.repeat(INPUT_LIMITS.maxCommandBytes) })).toBe(false)
  })
})
