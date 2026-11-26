import chroma from 'chroma-js'

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export interface ColorParts {
  hex: string
  rgb: RGB
  hsl: HSL
}

const HEX_RE = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const RGB_RE =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i
const RGB_BARE_RE = /^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/
const HSL_RE =
  /^hsla?\(\s*(\d+(?:\.\d+)?)(?:deg)?\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Приводит HEX к виду `#rrggbb`. Поддерживает `#RGB` и `#RRGGBB`,
 * регистр и необязательную решётку. Возвращает `null` для невалидного ввода.
 */
export function normalizeHex(input: string): string | null {
  const text = input.trim()
  if (!HEX_RE.test(text)) return null
  let digits = text.replace('#', '').toLowerCase()
  if (digits.length === 3) {
    digits = digits
      .split('')
      .map((char) => char + char)
      .join('')
  }
  return `#${digits}`
}

/** Разбирает `rgb(r, g, b)`, `rgba(...)` и запись без обёртки `r, g, b`. */
export function parseRgb(input: string): RGB | null {
  const text = input.trim()
  const match = RGB_RE.exec(text) ?? RGB_BARE_RE.exec(text)
  if (!match) return null
  const r = Number(match[1])
  const g = Number(match[2])
  const b = Number(match[3])
  if (r > 255 || g > 255 || b > 255) return null
  return { r, g, b }
}

/** Разбирает `hsl(h, s%, l%)` и `hsla(...)`, проверяя диапазоны. */
export function parseHsl(input: string): HSL | null {
  const match = HSL_RE.exec(input.trim())
  if (!match) return null
  const h = Number(match[1])
  const s = Number(match[2])
  const l = Number(match[3])
  if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) return null
  return { h: Math.round(h), s: Math.round(s), l: Math.round(l) }
}

export function hexToRgb(hex: string): RGB {
  const [r, g, b] = chroma(hex).rgb()
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) }
}

export function rgbToHex({ r, g, b }: RGB): string {
  return chroma(r, g, b).hex()
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const [h, s, l] = chroma(r, g, b).hsl()
  return {
    h: Number.isFinite(h) ? Math.round(h) : 0,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const [r, g, b] = chroma.hsl(h, s / 100, l / 100).rgb()
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) }
}

export function formatRgb({ r, g, b }: RGB): string {
  return `rgb(${r}, ${g}, ${b})`
}

export function formatHsl({ h, s, l }: HSL): string {
  return `hsl(${h}, ${s}%, ${l}%)`
}

/** Возвращает нормализованные представления цвета во всех поддерживаемых форматах. */
export function describe(hex: string): ColorParts {
  const normalized = normalizeHex(hex) ?? '#000000'
  const rgb = hexToRgb(normalized)
  return { hex: normalized, rgb, hsl: rgbToHsl(rgb) }
}

/** Понимает HEX, RGB и HSL — используется в полях ввода. */
export function parseColorInput(input: string): string | null {
  const hex = normalizeHex(input)
  if (hex) return hex
  const rgb = parseRgb(input)
  if (rgb) return rgbToHex(rgb)
  const hsl = parseHsl(input)
  if (hsl) return rgbToHex(hslToRgb(hsl))
  return null
}

/** Шкала светлых оттенков: от почти белого к исходному цвету. */
export function tintScale(hex: string, steps = 10): string[] {
  return Array.from({ length: steps }, (_, index) =>
    chroma.mix(hex, '#ffffff', (index + 1) / (steps + 1), 'lab').hex(),
  )
}

/** Шкала тёмных оттенков: от исходного цвета к почти чёрному. */
export function shadeScale(hex: string, steps = 10): string[] {
  return Array.from({ length: steps }, (_, index) =>
    chroma.mix(hex, '#000000', (index + 1) / (steps + 1), 'lab').hex(),
  )
}

/** Чёрный или белый — тот, что читается на данном фоне лучше. */
export function readableOn(hex: string): '#000000' | '#ffffff' {
  return chroma.contrast(hex, '#000000') >= chroma.contrast(hex, '#ffffff') ? '#000000' : '#ffffff'
}

/** Меняет светлоту HSL, сохраняя тон и насыщенность (0..1). */
export function withLightness(hex: string, lightness: number): string {
  const [h, s] = chroma(hex).hsl()
  return chroma.hsl(Number.isFinite(h) ? h : 0, s, clamp(lightness, 0, 1)).hex()
}
