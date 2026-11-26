import { describe, expect, it } from 'vitest'
import {
  parseCollectionJson,
  parseTags,
  toCollectionJson,
  toCss,
  toHexList,
  toJson,
} from '../exporters'
import type { SavedPalette } from '../types'

const palette: SavedPalette = {
  id: 'p1',
  name: 'Тестовая',
  tags: ['ui'],
  colors: ['#000000', '#ffffff', '#3b82f6'],
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('экспорт', () => {
  it('CSS-переменные', () => {
    expect(toCss(['#000000', '#ffffff'])).toBe(':root {\n  --color-1: #000000;\n  --color-2: #ffffff;\n}')
    expect(toCss(['#000000'], 'brand')).toContain('--brand-1: #000000;')
  })

  it('JSON и список HEX', () => {
    expect(JSON.parse(toJson({ name: 'X', colors: ['#000000'] }))).toEqual({
      name: 'X',
      colors: ['#000000'],
    })
    expect(toHexList(['#000000', '#ffffff'])).toBe('#000000, #ffffff')
  })

  it('коллекция переживает экспорт и импорт', () => {
    const imported = parseCollectionJson(toCollectionJson([palette]))
    expect(imported).toHaveLength(1)
    expect(imported?.[0].name).toBe('Тестовая')
    expect(imported?.[0].colors).toEqual(palette.colors)
  })
})

describe('parseCollectionJson', () => {
  it('принимает массив и объект с palettes', () => {
    expect(parseCollectionJson(JSON.stringify([{ name: 'A', colors: palette.colors }]))).toHaveLength(1)
    expect(
      parseCollectionJson(JSON.stringify({ palettes: [{ name: 'A', colors: palette.colors }] })),
    ).toHaveLength(1)
  })

  it('нормализует цвета, теги и подставляет значения по умолчанию', () => {
    const [item] = parseCollectionJson(
      JSON.stringify([{ colors: ['#ABC', '000000', 'FFFFFF'], tags: [' ui ', 'ui', ''] }]),
    ) ?? []
    expect(item.name).toBe('Импортированная палитра')
    expect(item.colors).toEqual(['#aabbcc', '#000000', '#ffffff'])
    expect(item.tags).toEqual(['ui'])
    expect(item.id).toContain('imported-')
    expect(item.createdAt).toBeTruthy()
  })

  it('отбрасывает палитры с менее чем тремя валидными цветами', () => {
    expect(parseCollectionJson(JSON.stringify([{ colors: ['#000000', '#ffffff'] }]))).toBeNull()
    expect(
      parseCollectionJson(JSON.stringify([{ colors: ['#000000', '#ffffff', 'oops'] }])),
    ).toBeNull()
  })

  it('возвращает null для битого JSON и чужой структуры', () => {
    expect(parseCollectionJson('{oops')).toBeNull()
    expect(parseCollectionJson(JSON.stringify({ foo: 'bar' }))).toBeNull()
    expect(parseCollectionJson(JSON.stringify([]))).toBeNull()
    expect(parseCollectionJson(JSON.stringify([null, 42]))).toBeNull()
  })
})

describe('parseTags', () => {
  it('чистит, обрезает и убирает дубли', () => {
    expect(parseTags(' ui, тёмная ,ui,, акцент ')).toEqual(['ui', 'тёмная', 'акцент'])
    expect(parseTags('')).toEqual([])
  })
})
