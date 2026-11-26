import { normalizeHex } from './color'
import { STORAGE_VERSION, isRecord } from './storage'
import type { SavedPalette } from './types'

export function toCss(palette: string[], prefix = 'color'): string {
  const lines = palette.map((color, index) => `  --${prefix}-${index + 1}: ${color};`)
  return `:root {\n${lines.join('\n')}\n}`
}

export function toJson(palette: { name: string; colors: string[] }): string {
  return JSON.stringify({ name: palette.name, colors: palette.colors }, null, 2)
}

export function toHexList(palette: string[]): string {
  return palette.join(', ')
}

/** Разбирает пользовательский ввод «тег1, тег2» в массив без пустых и повторов. */
export function parseTags(input: string): string[] {
  return [...new Set(input.split(',').map((tag) => tag.trim()).filter(Boolean))]
}

export function toCollectionJson(palettes: SavedPalette[]): string {
  return JSON.stringify({ version: STORAGE_VERSION, data: palettes }, null, 2)
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const tags = value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean)
  return [...new Set(tags)]
}

function normalizeColors(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((color): color is string => typeof color === 'string')
    .map((color) => normalizeHex(color))
    .filter((color): color is string => color !== null)
}

/**
 * Импорт терпим к формату: принимает массив палитр, наш конверт `{ version, data }`
 * и `{ palettes: [...] }`. Невалидные палитры отбрасываются.
 */
export function parseCollectionJson(text: string): SavedPalette[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }

  let raw: unknown = null
  if (Array.isArray(parsed)) raw = parsed
  else if (isRecord(parsed) && Array.isArray(parsed.data)) raw = parsed.data
  else if (isRecord(parsed) && Array.isArray(parsed.palettes)) raw = parsed.palettes

  if (!Array.isArray(raw)) return null

  const result: SavedPalette[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const colors = normalizeColors(item.colors)
    if (colors.length < 3) continue
    result.push({
      id:
        typeof item.id === 'string' && item.id.trim()
          ? item.id
          : `imported-${result.length}-${Date.now()}`,
      name:
        typeof item.name === 'string' && item.name.trim()
          ? item.name.trim()
          : 'Импортированная палитра',
      tags: normalizeTags(item.tags),
      colors,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    })
  }

  return result.length > 0 ? result : null
}
