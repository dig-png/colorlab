import { normalizeHex } from './color'
import type { SavedPalette } from './types'

export const STORAGE_VERSION = 1

export interface Envelope<T> {
  version: number
  data: T
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isSavedPalette(value: unknown): value is SavedPalette {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.createdAt === 'string' &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string') &&
    Array.isArray(value.colors) &&
    value.colors.length >= 3 &&
    value.colors.every((color) => typeof color === 'string' && normalizeHex(color) !== null)
  )
}

/**
 * Читает данные из localStorage. Любая проблема — битый JSON, чужая версия схемы,
 * недоступное хранилище — приводит к `null`, чтобы приложение стартовало с дефолтов.
 */
export function loadStored<T>(key: string, validate: (value: unknown) => T | null): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) return null
    return validate(parsed.data)
  } catch {
    return null
  }
}

/** Запись не должна ломать приложение: приватный режим и переполнение квоты игнорируются. */
export function saveStored<T>(key: string, data: T): void {
  try {
    const envelope: Envelope<T> = { version: STORAGE_VERSION, data }
    localStorage.setItem(key, JSON.stringify(envelope))
  } catch {
    // ponytail: молча теряем настройку при переполнении квоты; тост об ошибке — если попросят
  }
}

export function clearStored(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // хранилище недоступно — сбрасывать нечего
  }
}
