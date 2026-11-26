import { create } from 'zustand'
import { isSavedPalette, loadStored, saveStored } from '../lib/storage'
import type { SavedPalette } from '../lib/types'

const LIBRARY_KEY = 'colorlab:library'

function loadLibrary(): SavedPalette[] {
  return (
    loadStored<SavedPalette[]>(LIBRARY_KEY, (value) =>
      Array.isArray(value) ? value.filter(isSavedPalette) : null,
    ) ?? []
  )
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `palette-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function persist(palettes: SavedPalette[]): void {
  saveStored(LIBRARY_KEY, palettes)
}

interface LibraryState {
  palettes: SavedPalette[]
  add: (input: { name: string; tags: string[]; colors: string[] }) => SavedPalette
  update: (id: string, patch: { name?: string; tags?: string[] }) => void
  remove: (id: string) => void
  importMany: (items: SavedPalette[]) => number
}

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  palettes: loadLibrary(),
  add: ({ name, tags, colors }) => {
    const palette: SavedPalette = {
      id: newId(),
      name,
      tags,
      colors,
      createdAt: new Date().toISOString(),
    }
    const palettes = [palette, ...get().palettes]
    set({ palettes })
    persist(palettes)
    return palette
  },
  update: (id, patch) => {
    const palettes = get().palettes.map((palette) =>
      palette.id === id ? { ...palette, ...patch } : palette,
    )
    set({ palettes })
    persist(palettes)
  },
  remove: (id) => {
    const palettes = get().palettes.filter((palette) => palette.id !== id)
    set({ palettes })
    persist(palettes)
  },
  importMany: (items) => {
    const imported = items.map((item) => ({ ...item, id: newId() }))
    const palettes = [...imported, ...get().palettes]
    set({ palettes })
    persist(palettes)
    return imported.length
  },
}))
