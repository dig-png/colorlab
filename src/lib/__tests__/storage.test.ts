import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearStored, isSavedPalette, loadStored, saveStored, STORAGE_VERSION } from '../storage'

const KEY = 'test:storage'

beforeEach(() => {
  localStorage.clear()
})

describe('saveStored / loadStored', () => {
  it('сохраняет и читает данные с версией схемы', () => {
    saveStored(KEY, { color: '#3b82f6' })
    const raw = localStorage.getItem(KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string).version).toBe(STORAGE_VERSION)
    expect(loadStored(KEY, (value) => value as { color: string })).toEqual({ color: '#3b82f6' })
  })

  it('возвращает null при отсутствии данных', () => {
    expect(loadStored(KEY, (value) => value as unknown)).toBeNull()
  })

  it('возвращает null при битом JSON', () => {
    localStorage.setItem(KEY, '{oops')
    expect(loadStored(KEY, (value) => value as unknown)).toBeNull()
  })

  it('возвращает null при чужой версии схемы', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 999, data: { color: 'red' } }))
    expect(loadStored(KEY, (value) => value as unknown)).toBeNull()
  })

  it('возвращает null, если валидатор отверг данные', () => {
    saveStored(KEY, { color: 'not-a-color' })
    expect(loadStored(KEY, () => null)).toBeNull()
  })

  it('не падает при переполнении хранилища', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveStored(KEY, { color: '#fff' })).not.toThrow()
    spy.mockRestore()
  })

  it('clearStored удаляет ключ', () => {
    saveStored(KEY, { color: '#fff' })
    clearStored(KEY)
    expect(localStorage.getItem(KEY)).toBeNull()
  })
})

describe('isSavedPalette', () => {
  const valid = {
    id: 'p1',
    name: 'Тест',
    tags: ['ui'],
    colors: ['#000000', '#ffffff', '#3b82f6'],
    createdAt: '2026-01-01T00:00:00.000Z',
  }

  it('принимает корректную палитру', () => {
    expect(isSavedPalette(valid)).toBe(true)
  })

  it('отвергает палитру с невалидным цветом', () => {
    expect(isSavedPalette({ ...valid, colors: ['#000000', '#ffffff', 'oops'] })).toBe(false)
  })

  it('отвергает слишком короткую палитру и неверные типы', () => {
    expect(isSavedPalette({ ...valid, colors: ['#000000', '#ffffff'] })).toBe(false)
    expect(isSavedPalette({ ...valid, tags: 'ui' })).toBe(false)
    expect(isSavedPalette(null)).toBe(false)
    expect(isSavedPalette('palette')).toBe(false)
  })
})
