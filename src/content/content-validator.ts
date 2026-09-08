import { validateLevelConfig, type LevelValidationError, type LevelValidationResult } from './level-loader'

export type ContentDiagnostic = LevelValidationError & {
  severity: 'error' | 'warning'
  suggestion: string
}

export function validateContent(input: unknown, file = '<content>'): LevelValidationResult & { diagnostics: readonly ContentDiagnostic[] } {
  const result = validateLevelConfig(input)
  const diagnostics = result.errors.map((error) => ({
    ...error,
    path: `${file}:${error.path}`,
    severity: error.severity ?? 'error',
    suggestion: error.suggestion ?? suggestionFor(error.message),
  }))
  return result.valid ? { ...result, diagnostics } : { ...result, diagnostics }
}

function suggestionFor(message: string): string {
  if (message.includes('unknown') || message.includes('duplicate')) return 'Revisa los IDs y sus referencias antes de exportar.'
  if (message.includes('must be')) return 'Completa el campo con el tipo y valor esperado por el esquema.'
  if (message.includes('greater')) return 'Usa un valor positivo y dentro del rango del contenido.'
  return 'Corrige este campo y vuelve a ejecutar la validación.'
}
