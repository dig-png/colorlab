export interface SavedPalette {
  id: string
  name: string
  tags: string[]
  colors: string[]
  createdAt: string
}

export interface PresetPalette {
  id: string
  name: string
  category: string
  tags: string[]
  colors: string[]
}
