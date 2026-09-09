export const INPUT_LIMITS = {
  maxJsonBytes: 250_000,
  maxCommandBytes: 8_192,
  maxDepth: 20,
  maxArrayLength: 1_000,
  maxObjectKeys: 1_000,
  maxStringLength: 1_000,
  maxCommandTextLength: 240,
} as const

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export class InputLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InputLimitError'
  }
}

export function parseJsonWithinLimits(serialized: string): unknown {
  if (byteLength(serialized) > INPUT_LIMITS.maxJsonBytes) throw new InputLimitError('El JSON supera el límite de tamaño permitido.')

  let value: unknown
  try {
    value = JSON.parse(serialized)
  } catch {
    throw new InputLimitError('El contenido no contiene JSON válido.')
  }
  inspectJsonLimits(value, 0)
  return value
}

export function isBoundedCommand(command: unknown): boolean {
  if (!isRecord(command)) return false
  try {
    const serialized = JSON.stringify(command)
    if (byteLength(serialized) > INPUT_LIMITS.maxCommandBytes) return false
    inspectJsonLimits(command, 0)
    const input = command.input
    return input === undefined || isBoundedCommandText(input)
  } catch {
    return false
  }
}

export function isBoundedCommandText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length <= INPUT_LIMITS.maxCommandTextLength
}

function inspectJsonLimits(value: unknown, depth: number): void {
  if (depth > INPUT_LIMITS.maxDepth) throw new InputLimitError('El contenido supera la profundidad máxima.')
  if (typeof value === 'string') {
    if (value.length > INPUT_LIMITS.maxStringLength) throw new InputLimitError('El contenido contiene un texto demasiado largo.')
    return
  }
  if (!value || typeof value !== 'object') return

  const entries = Object.entries(value)
  if (Array.isArray(value) && value.length > INPUT_LIMITS.maxArrayLength) throw new InputLimitError('El contenido contiene demasiados elementos.')
  if (!Array.isArray(value) && entries.length > INPUT_LIMITS.maxObjectKeys) throw new InputLimitError('El objeto contiene demasiadas claves.')
  for (const [key, child] of entries) {
    if (DANGEROUS_KEYS.has(key)) throw new InputLimitError(`El contenido contiene una clave peligrosa: ${key}.`)
    inspectJsonLimits(child, depth + 1)
  }
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
