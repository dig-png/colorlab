import { describe, expect, it } from 'vitest'
import { hexToRgb, normalizeHex, rgbToHsl } from '../color'
import { HARMONY_TYPES, generateHarmony, type HarmonyType } from '../harmonies'

const BASE = '#3b82f6'
const TYPES: HarmonyType[] = [
  'complementary',
  'analogous',
  'triad',
  'tetrad',
  'monochrome',
  'random',
]

function hueOf(hex: string): number {
  return rgbToHsl(hexToRgb(hex)).h
}

describe('generateHarmony', () => {
  it('каждая схема даёт нужное число валидных цветов', () => {
    for (const type of TYPES) {
      const palette = generateHarmony(BASE, type, 5)
      expect(palette).toHaveLength(5)
      for (const hex of palette) expect(normalizeHex(hex)).toBe(hex)
    }
  })

  it('ограничивает размер палитры диапазоном 3–6', () => {
    expect(generateHarmony(BASE, 'triad', 1)).toHaveLength(3)
    expect(generateHarmony(BASE, 'triad', 99)).toHaveLength(6)
  })

  it('комплементарная схема ставит второй цвет напротив базового', () => {
    const palette = generateHarmony(BASE, 'complementary', 4)
    expect(Math.abs(hueOf(palette[1]) - ((hueOf(BASE) + 180) % 360))).toBeLessThanOrEqual(2)
  })

  it('аналоговая схема держит шаг 30° и включает базовый тон', () => {
    const palette = generateHarmony(BASE, 'analogous', 5)
    const hues = palette.map(hueOf)
    expect(Math.abs(hues[2] - 217)).toBeLessThanOrEqual(2)
    expect(Math.abs(hues[3] - 247)).toBeLessThanOrEqual(2)
    expect(Math.abs(hues[1] - 187)).toBeLessThanOrEqual(2)
  })

  it('монохромная схема сохраняет тон и убывает по светлоте', () => {
    const palette = generateHarmony(BASE, 'monochrome', 4)
    const lightness = palette.map((hex) => rgbToHsl(hexToRgb(hex)).l)
    expect(lightness).toEqual([...lightness].sort((a, b) => b - a))
    for (const hex of palette) {
      expect(Math.abs(hueOf(hex) - 217)).toBeLessThanOrEqual(3)
    }
  })

  it('случайная схема детерминирована при фиксированном источнике', () => {
    const makeRandom = () => {
      const values = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
      let index = 0
      return () => values[index++ % values.length]
    }
    const first = generateHarmony(BASE, 'random', 4, makeRandom())
    const second = generateHarmony(BASE, 'random', 4, makeRandom())
    expect(first).toEqual(second)
    expect(new Set(first).size).toBeGreaterThan(1)
  })

  it('тетрада использует четыре разных тона', () => {
    const hues = generateHarmony(BASE, 'tetrad', 4).map(hueOf)
    expect(new Set(hues.map((hue) => Math.round(hue / 10))).size).toBeGreaterThanOrEqual(3)
  })

  it('для ахроматической базы отдаёт различимые нейтральные оттенки', () => {
    for (const base of ['#ffffff', '#000000', '#808080']) {
      const palette = generateHarmony(base, 'analogous', 4)
      expect(new Set(palette).size).toBe(4)
      const lightness = palette.map((hex) => rgbToHsl(hexToRgb(hex)).l)
      expect(lightness).toEqual([...lightness].sort((a, b) => b - a))
    }
  })

  it('каждая схема описана в списке для интерфейса', () => {
    expect(HARMONY_TYPES.map((item) => item.id)).toEqual(TYPES)
  })
})
