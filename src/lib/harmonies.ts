import chroma from 'chroma-js'

export type HarmonyType =
  | 'complementary'
  | 'analogous'
  | 'triad'
  | 'tetrad'
  | 'monochrome'
  | 'random'

export interface HarmonyMeta {
  id: HarmonyType
  label: string
  hint: string
}

export const HARMONY_TYPES: HarmonyMeta[] = [
  { id: 'complementary', label: 'Комплементарная', hint: 'Два цвета напротив друг друга на круге' },
  { id: 'analogous', label: 'Аналоговая', hint: 'Соседние оттенки с шагом 30°' },
  { id: 'triad', label: 'Триада', hint: 'Три цвета через 120°' },
  { id: 'tetrad', label: 'Тетрада', hint: 'Четыре цвета через 90° (квадрат)' },
  { id: 'monochrome', label: 'Монохромная', hint: 'Один тон, разная светлота' },
  { id: 'random', label: 'Случайная', hint: 'Свободная комбинация оттенков' },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const wrapHue = (hue: number) => ((hue % 360) + 360) % 360

/** Расширяет базовые смещения тона до нужного числа цветов, варьируя светлоту. */
function expand(offsets: number[], total: number, h: number, s: number, l: number): string[] {
  return Array.from({ length: total }, (_, index) => {
    const offset = offsets[index % offsets.length]
    const cycle = Math.floor(index / offsets.length)
    const direction = cycle % 2 === 1 ? 1 : -1
    const shift = cycle === 0 ? 0 : direction * 0.15 * Math.ceil(cycle / 2)
    return chroma.hsl(wrapHue(h + offset), s, clamp(l + shift, 0.12, 0.88)).hex()
  })
}

/**
 * Генерирует палитру из 3–6 цветов по выбранной схеме гармонии.
 * `random` принимает источник случайности — это упрощает тесты.
 */
export function generateHarmony(
  base: string,
  type: HarmonyType,
  count: number,
  random: () => number = Math.random,
): string[] {
  const total = clamp(Math.round(count), 3, 6)
  const [rawH, rawS, rawL] = chroma(base).hsl()
  const h = Number.isFinite(rawH) ? rawH : 0
  const s = Number.isFinite(rawS) ? rawS : 0
  const l = Number.isFinite(rawL) ? rawL : 0.5

  // У белого, чёрного и серого нет тона: схемы на hue дали бы одинаковые цвета.
  // ponytail: для ахроматической базы отдаём шкалу светлоты; hue-подмес — если попросят
  if (type !== 'random' && s < 0.08) {
    return Array.from({ length: total }, (_, index) =>
      chroma.hsl(0, 0, 0.92 - (0.8 * index) / (total - 1)).hex(),
    )
  }

  switch (type) {
    case 'complementary':
      return expand([0, 180], total, h, s, l)
    case 'analogous': {
      const offsets = Array.from({ length: total }, (_, index) => (index - (total - 1) / 2) * 30)
      return offsets.map((offset) => chroma.hsl(wrapHue(h + offset), s, l).hex())
    }
    case 'triad':
      return expand([0, 120, 240], total, h, s, l)
    case 'tetrad':
      return expand([0, 90, 180, 270], total, h, s, l)
    case 'monochrome':
      return Array.from({ length: total }, (_, index) =>
        chroma.hsl(h, s, 0.9 - (0.75 * index) / (total - 1)).hex(),
      )
    case 'random':
      return Array.from({ length: total }, () => {
        const hue = Math.round(random() * 360)
        const saturation = clamp(0.35 + random() * 0.55, 0, 1)
        const lightness = clamp(0.35 + random() * 0.35, 0.15, 0.85)
        return chroma.hsl(hue, saturation, lightness).hex()
      })
  }
}
