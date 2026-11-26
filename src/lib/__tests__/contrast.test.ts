import { describe, expect, it } from 'vitest'
import { hexToRgb, rgbToHsl } from '../color'
import { contrastRatio, evaluateContrast, nearestAccessible } from '../contrast'

describe('contrastRatio', () => {
  it('даёт крайние значения для чёрного и белого', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(21)
    expect(contrastRatio('#ffffff', '#000000')).toBe(21)
    expect(contrastRatio('#3b82f6', '#3b82f6')).toBe(1)
  })

  it('симметричен относительно порядка цветов', () => {
    expect(contrastRatio('#3b82f6', '#ffffff')).toBe(contrastRatio('#ffffff', '#3b82f6'))
  })
})

describe('evaluateContrast', () => {
  it('чёрный на белом проходит все уровни', () => {
    expect(evaluateContrast('#000000', '#ffffff')).toEqual({
      ratio: 21,
      aaNormal: true,
      aaLarge: true,
      aaaNormal: true,
      aaaLarge: true,
    })
  })

  it('средний серый не проходит AA для обычного текста', () => {
    const report = evaluateContrast('#777777', '#ffffff')
    expect(report.aaNormal).toBe(false)
    expect(report.aaLarge).toBe(true)
    expect(report.aaaNormal).toBe(false)
  })
})

describe('nearestAccessible', () => {
  it('возвращает исходный цвет, если контраст уже достаточен', () => {
    const result = nearestAccessible('#000000', '#ffffff', 4.5)
    expect(result.color).toBe('#000000')
    expect(result.achieved).toBe(true)
  })

  it('подбирает более тёмный оттенок для светлого фона', () => {
    const result = nearestAccessible('#777777', '#ffffff', 4.5)
    expect(result.achieved).toBe(true)
    expect(result.ratio).toBeGreaterThanOrEqual(4.5)
    expect(rgbToHsl(hexToRgb(result.color)).l).toBeLessThan(50)
  })

  it('сохраняет тон при подборе', () => {
    const result = nearestAccessible('#3b82f6', '#ffffff', 7)
    expect(result.achieved).toBe(true)
    expect(Math.abs(rgbToHsl(hexToRgb(result.color)).h - 217)).toBeLessThanOrEqual(2)
  })

  it('сообщает, когда цель недостижима', () => {
    const result = nearestAccessible('#888888', '#777777', 7)
    expect(result.achieved).toBe(false)
    expect(result.ratio).toBeLessThan(7)
    expect(['#000000', '#ffffff']).toContain(result.color)
  })
})
