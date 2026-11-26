import chroma from 'chroma-js'
import { readableOn } from './color'

export interface WcagReport {
  ratio: number
  aaNormal: boolean
  aaLarge: boolean
  aaaNormal: boolean
  aaaLarge: boolean
}

export interface AccessibleColor {
  color: string
  ratio: number
  achieved: boolean
}

/** Коэффициент контрастности по WCAG 2.1, округлённый до сотых (1..21). */
export function contrastRatio(foreground: string, background: string): number {
  return Math.round(chroma.contrast(foreground, background) * 100) / 100
}

export function evaluateContrast(foreground: string, background: string): WcagReport {
  const ratio = contrastRatio(foreground, background)
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  }
}

/**
 * Подбирает ближайший по светлоте оттенок `foreground`, дающий контраст не ниже
 * `target` с `background`. Тон и насыщенность сохраняются.
 */
export function nearestAccessible(
  foreground: string,
  background: string,
  target: number,
): AccessibleColor {
  const current = chroma(foreground)
  if (chroma.contrast(current, background) >= target) {
    return { color: current.hex(), ratio: contrastRatio(foreground, background), achieved: true }
  }

  const [h, s, l] = current.hsl()
  const hue = Number.isFinite(h) ? h : 0

  for (let step = 1; step <= 100; step += 1) {
    const delta = step / 100
    let best: { color: string; ratio: number } | null = null
    for (const direction of [1, -1]) {
      const lightness = l + direction * delta
      if (lightness < 0 || lightness > 1) continue
      const candidate = chroma.hsl(hue, s, lightness).hex()
      const ratio = chroma.contrast(candidate, background)
      if (ratio >= target && (!best || ratio > best.ratio)) {
        best = { color: candidate, ratio: Math.round(ratio * 100) / 100 }
      }
    }
    if (best) return { ...best, achieved: true }
  }

  const fallback = readableOn(background)
  const ratio = contrastRatio(fallback, background)
  return { color: fallback, ratio, achieved: ratio >= target }
}
