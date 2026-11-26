import { describe, expect, it } from 'vitest'
import {
  describe as describeColor,
  formatHsl,
  formatRgb,
  hexToRgb,
  hslToRgb,
  normalizeHex,
  parseColorInput,
  parseHsl,
  parseRgb,
  readableOn,
  rgbToHex,
  rgbToHsl,
  shadeScale,
  tintScale,
  withLightness,
} from '../color'

describe('normalizeHex', () => {
  it('приводит корректные значения к #rrggbb', () => {
    expect(normalizeHex('#3B82F6')).toBe('#3b82f6')
    expect(normalizeHex('3b82f6')).toBe('#3b82f6')
    expect(normalizeHex('#ABC')).toBe('#aabbcc')
    expect(normalizeHex('  #fff  ')).toBe('#ffffff')
  })

  it('отбрасывает некорректный ввод', () => {
    expect(normalizeHex('#12345')).toBeNull()
    expect(normalizeHex('#gggggg')).toBeNull()
    expect(normalizeHex('rgb(1,2,3)')).toBeNull()
    expect(normalizeHex('')).toBeNull()
  })
})

describe('parseRgb', () => {
  it('понимает rgb(), rgba() и запись без обёртки', () => {
    expect(parseRgb('rgb(59, 130, 246)')).toEqual({ r: 59, g: 130, b: 246 })
    expect(parseRgb('rgba(59,130,246,0.5)')).toEqual({ r: 59, g: 130, b: 246 })
    expect(parseRgb('59, 130, 246')).toEqual({ r: 59, g: 130, b: 246 })
  })

  it('не пропускает выход за диапазон и мусор', () => {
    expect(parseRgb('rgb(256, 0, 0)')).toBeNull()
    expect(parseRgb('rgb(1, 2)')).toBeNull()
    expect(parseRgb('красный')).toBeNull()
  })
})

describe('parseHsl', () => {
  it('понимает hsl() и hsla()', () => {
    expect(parseHsl('hsl(217, 91%, 60%)')).toEqual({ h: 217, s: 91, l: 60 })
    expect(parseHsl('hsla(217,91%,60%,0.4)')).toEqual({ h: 217, s: 91, l: 60 })
    expect(parseHsl('hsl(217deg, 91%, 60%)')).toEqual({ h: 217, s: 91, l: 60 })
  })

  it('не пропускает выход за диапазон', () => {
    expect(parseHsl('hsl(400, 50%, 50%)')).toBeNull()
    expect(parseHsl('hsl(200, 120%, 50%)')).toBeNull()
    expect(parseHsl('hsl(200, 50%, -1%)')).toBeNull()
    expect(parseHsl('hsl(200, 50, 50)')).toBeNull()
  })
})

describe('конвертация', () => {
  it('HEX ↔ RGB', () => {
    expect(hexToRgb('#3b82f6')).toEqual({ r: 59, g: 130, b: 246 })
    expect(rgbToHex({ r: 59, g: 130, b: 246 })).toBe('#3b82f6')
  })

  it('RGB ↔ HSL', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 })
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 })
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('форматирует значения', () => {
    expect(formatRgb({ r: 1, g: 2, b: 3 })).toBe('rgb(1, 2, 3)')
    expect(formatHsl({ h: 10, s: 20, l: 30 })).toBe('hsl(10, 20%, 30%)')
  })

  it('describe отдаёт все представления', () => {
    const parts = describeColor('#3b82f6')
    expect(parts.hex).toBe('#3b82f6')
    expect(parts.rgb).toEqual({ r: 59, g: 130, b: 246 })
    expect(parts.hsl).toEqual({ h: 217, s: 91, l: 60 })
  })

  it('parseColorInput принимает любой поддерживаемый формат', () => {
    expect(parseColorInput('#3b82f6')).toBe('#3b82f6')
    expect(parseColorInput('rgb(59, 130, 246)')).toBe('#3b82f6')
    expect(parseColorInput('hsl(0, 100%, 50%)')).toBe('#ff0000')
    expect(parseColorInput('не цвет')).toBeNull()
  })
})

describe('шкалы и читаемость', () => {
  const base = '#3b82f6'

  it('tints светлее базы, shades темнее', () => {
    const tints = tintScale(base)
    const shades = shadeScale(base)
    expect(tints).toHaveLength(10)
    expect(shades).toHaveLength(10)
    expect(rgbToHsl(hexToRgb(tints[9])).l).toBeGreaterThan(rgbToHsl(hexToRgb(base)).l)
    expect(rgbToHsl(hexToRgb(shades[9])).l).toBeLessThan(rgbToHsl(hexToRgb(base)).l)
    for (const hex of [...tints, ...shades]) {
      expect(normalizeHex(hex)).toBe(hex)
    }
  })

  it('readableOn выбирает контрастный текст', () => {
    expect(readableOn('#ffffff')).toBe('#000000')
    expect(readableOn('#000000')).toBe('#ffffff')
    // синий #3b82f6 светлее середины: чёрный текст контрастнее белого
    expect(readableOn('#3b82f6')).toBe('#000000')
    expect(readableOn('#1e3a8a')).toBe('#ffffff')
  })

  it('withLightness сохраняет тон и меняет светлоту', () => {
    const result = withLightness(base, 0.9)
    expect(rgbToHsl(hexToRgb(result)).h).toBe(217)
    expect(rgbToHsl(hexToRgb(result)).l).toBe(90)
  })
})
