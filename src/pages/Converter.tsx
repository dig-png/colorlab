import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ColorField } from '../components/ColorField'
import { PickerPanel } from '../components/PickerPanel'
import { copyText } from '../lib/clipboard'
import {
  describe,
  formatHsl,
  formatRgb,
  hslToRgb,
  normalizeHex,
  parseHsl,
  parseRgb,
  readableOn,
  rgbToHex,
  shadeScale,
  tintScale,
} from '../lib/color'
import { contrastRatio } from '../lib/contrast'
import { useColorStore } from '../store/colorStore'
import { useToastStore } from '../store/toastStore'
import styles from './Converter.module.css'

type FieldKey = 'hex' | 'rgb' | 'hsl'

interface Field {
  key: FieldKey
  label: string
  hint: string
  format: (hex: string) => string
  parse: (text: string) => string | null
}

const FIELDS: Field[] = [
  {
    key: 'hex',
    label: 'HEX',
    hint: '#RRGGBB или #RGB',
    format: (hex) => hex,
    parse: normalizeHex,
  },
  {
    key: 'rgb',
    label: 'RGB',
    hint: 'rgb(r, g, b), каждое значение 0–255',
    format: (hex) => formatRgb(describe(hex).rgb),
    parse: (text) => {
      const rgb = parseRgb(text)
      return rgb ? rgbToHex(rgb) : null
    },
  },
  {
    key: 'hsl',
    label: 'HSL',
    hint: 'hsl(h, s%, l%)',
    format: (hex) => formatHsl(describe(hex).hsl),
    parse: (text) => {
      const hsl = parseHsl(text)
      return hsl ? rgbToHex(hslToRgb(hsl)) : null
    },
  },
]

export function Converter() {
  const color = useColorStore((state) => state.color)
  const setColor = useColorStore((state) => state.setColor)
  const show = useToastStore((state) => state.show)
  const [editing, setEditing] = useState<{ key: FieldKey; text: string } | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [initialHex] = useState(() => normalizeHex(searchParams.get('hex') ?? ''))
  const appliedInitial = useRef(false)

  useEffect(() => {
    if (appliedInitial.current) return
    appliedInitial.current = true
    if (initialHex) setColor(initialHex)
  }, [initialHex, setColor])

  // Драг в color picker меняет цвет десятки раз в секунду. Браузер разрешает
  // replaceState не чаще 100 раз за 10 с и иначе бросает SecurityError,
  // поэтому адрес обновляем один раз, когда значение устоялось.
  useEffect(() => {
    const hex = color.slice(1)
    if (searchParams.get('hex') === hex) return
    const timer = setTimeout(() => setSearchParams({ hex }, { replace: true }), 400)
    return () => clearTimeout(timer)
  }, [color, searchParams, setSearchParams])

  const copy = async (text: string) => {
    const copied = await copyText(text)
    show(copied ? `Скопировано: ${text}` : 'Не удалось скопировать')
  }

  const lightContrast = contrastRatio(color, '#ffffff')
  const darkContrast = contrastRatio(color, '#0f172a')
  const tints = [...tintScale(color)].reverse()
  const shades = shadeScale(color)

  return (
    <div className="page">
      <header className="page-head">
        <h1>Конвертер цветов</h1>
        <p className="lead">
          Введите цвет в любом формате — остальные значения пересчитаются сразу. Некорректный ввод
          подсвечивается, последнее валидное значение сохраняется.
        </p>
      </header>

      <div className={styles.grid}>
        <section className="card" aria-labelledby="preview-title">
          <h2 className="section-title" id="preview-title">
            Предпросмотр
          </h2>
          <div className={styles.preview} style={{ background: color }}>
            <span className={styles.previewHex} style={{ color: readableOn(color) }}>
              {color.toUpperCase()}
            </span>
            <span className={styles.previewLight}>
              Светлый текст · {lightContrast.toFixed(2)}:1
            </span>
            <span className={styles.previewDark}>Тёмный текст · {darkContrast.toFixed(2)}:1</span>
          </div>
          <h3 className="section-title" style={{ marginTop: '1rem' }}>
            Выбор цвета
          </h3>
          <PickerPanel color={color} onChange={setColor} />
        </section>

        <section className="card" aria-labelledby="fields-title">
          <h2 className="section-title" id="fields-title">
            Значения
          </h2>
          <div className={styles.fields}>
            {FIELDS.map((field) => {
              const isEditing = editing?.key === field.key
              const text = isEditing ? editing.text : field.format(color)
              const invalid =
                isEditing && editing.text.trim() !== '' && field.parse(editing.text) === null
              return (
                <ColorField
                  key={field.key}
                  label={field.label}
                  value={text}
                  hint={field.hint}
                  invalid={invalid}
                  onChange={(value) => {
                    setEditing({ key: field.key, text: value })
                    const hex = field.parse(value)
                    if (hex) setColor(hex)
                  }}
                  onBlur={() => setEditing(null)}
                  onCopy={() => copy(field.format(color))}
                />
              )
            })}
          </div>
        </section>
      </div>

      <section className="card" aria-labelledby="scale-title">
        <h2 className="section-title" id="scale-title">
          Оттенки и тональности
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Светлые (tints) и тёмные (shades) варианты выбранного цвета. Нажмите на образец, чтобы
          выбрать его.
        </p>
        <div className={styles.scaleGroup}>
          <span className="label">Tints</span>
          <div className={styles.scaleRow}>
            {tints.map((hex) => (
              <button
                key={hex}
                type="button"
                className={styles.scaleSwatch}
                style={{ background: hex }}
                onClick={() => setColor(hex)}
                title={hex}
                aria-label={`Выбрать ${hex}`}
              />
            ))}
          </div>
        </div>
        <div className={styles.scaleGroup}>
          <span className="label">Shades</span>
          <div className={styles.scaleRow}>
            {shades.map((hex) => (
              <button
                key={hex}
                type="button"
                className={styles.scaleSwatch}
                style={{ background: hex }}
                onClick={() => setColor(hex)}
                title={hex}
                aria-label={`Выбрать ${hex}`}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
