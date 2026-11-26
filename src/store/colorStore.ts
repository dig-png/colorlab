import { create } from 'zustand'
import { normalizeHex } from '../lib/color'
import { loadStored, saveStored } from '../lib/storage'

export type Theme = 'light' | 'dark'

export interface Settings {
  color: string
  theme: Theme
}

const SETTINGS_KEY = 'colorlab:settings'
const DEFAULT_COLOR = '#3b82f6'

function validateSettings(value: unknown): Settings | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  const color = typeof record.color === 'string' ? normalizeHex(record.color) : null
  const theme = record.theme === 'dark' || record.theme === 'light' ? record.theme : null
  if (!color || !theme) return null
  return { color, theme }
}

function preferredTheme(): Theme {
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }
  return 'light'
}

const stored = loadStored<Settings>(SETTINGS_KEY, validateSettings)
const initial: Settings = stored ?? { color: DEFAULT_COLOR, theme: preferredTheme() }

interface ColorState extends Settings {
  setColor: (value: string) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useColorStore = create<ColorState>()((set, get) => ({
  ...initial,
  setColor: (value) => {
    const hex = normalizeHex(value)
    if (!hex) return
    set({ color: hex })
    saveStored(SETTINGS_KEY, { color: hex, theme: get().theme })
  },
  setTheme: (theme) => {
    set({ theme })
    saveStored(SETTINGS_KEY, { color: get().color, theme })
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}))
