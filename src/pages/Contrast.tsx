import { useState } from 'react'
import { ColorField } from '../components/ColorField'
import { PickerPanel } from '../components/PickerPanel'
import { parseColorInput } from '../lib/color'
import { evaluateContrast, nearestAccessible } from '../lib/contrast'
import { useColorStore } from '../store/colorStore'
import { useToastStore } from '../store/toastStore'
import styles from './Contrast.module.css'

type Slot = 'fg' | 'bg'

export function Contrast() {
  const color = useColorStore((state) => state.color)
  const setColor = useColorStore((state) => state.setColor)
  const show = useToastStore((state) => state.show)

  const [background, setBackground] = useState('#ffffff')
  const [editing, setEditing] = useState<{ slot: Slot; text: string } | null>(null)
  const [picker, setPicker] = useState<Slot | null>(null)

  const report = evaluateContrast(color, background)

  const applyColor = (slot: Slot, hex: string) => {
    if (slot === 'fg') setColor(hex)
    else setBackground(hex)
  }

  const swap = () => {
    const previousForeground = color
    setColor(background)
    setBackground(previousForeground)
  }

  const adjust = (slot: Slot, target: number) => {
    const result =
      slot === 'fg'
        ? nearestAccessible(color, background, target)
        : nearestAccessible(background, color, target)
    applyColor(slot, result.color)
    show(
      result.achieved
        ? `Подобран оттенок с контрастом ${result.ratio.toFixed(2)}:1`
        : `Максимум для этой пары — ${result.ratio.toFixed(2)}:1, цель ${target}:1 недостижима`,
    )
  }

  const checks = [
    { label: 'AA · обычный текст ≥ 4.5:1', pass: report.aaNormal },
    { label: 'AA · крупный текст ≥ 3:1', pass: report.aaLarge },
    { label: 'AAA · обычный текст ≥ 7:1', pass: report.aaaNormal },
    { label: 'AAA · крупный текст ≥ 4.5:1', pass: report.aaaLarge },
  ]

  const renderField = (slot: Slot, label: string, value: string) => {
    const isEditing = editing?.slot === slot
    const text = isEditing ? editing.text : value
    const invalid =
      isEditing && editing.text.trim() !== '' && parseColorInput(editing.text) === null
    return (
      <ColorField
        label={label}
        value={text}
        hint="HEX, RGB или HSL"
        invalid={invalid}
        onChange={(next) => {
          setEditing({ slot, text: next })
          const hex = parseColorInput(next)
          if (hex) applyColor(slot, hex)
        }}
        onBlur={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>Контраст по WCAG 2.1</h1>
        <p className="lead">
          Коэффициент контраста пары «текст — фон» от 1:1 до 21:1 и проверка уровней доступности AA
          и AAA для обычного и крупного текста.
        </p>
      </header>

      <div className={styles.grid}>
        <section className="card" aria-labelledby="ratio-title">
          <h2 className="section-title" id="ratio-title">
            Коэффициент контраста
          </h2>
          <p className={styles.ratio}>{report.ratio.toFixed(2)}:1</p>
          <ul className={styles.badges}>
            {checks.map((check) => (
              <li key={check.label}>
                <span className={check.pass ? 'badge badge-ok' : 'badge badge-fail'}>
                  <span aria-hidden="true">{check.pass ? '✓' : '✕'}</span>
                  {check.label}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="controls-title">
          <h2 className="section-title" id="controls-title">
            Цвета
          </h2>
          <div className={styles.controls}>
            <div className={styles.colorCard}>
              <h3 className={styles.colorTitle}>Текст</h3>
              {renderField('fg', 'Foreground', color)}
              <div className="row">
                <span className="swatch" style={{ background: color, width: 40, height: 40 }} />
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => setPicker(picker === 'fg' ? null : 'fg')}
                  aria-expanded={picker === 'fg'}
                >
                  Пипетка
                </button>
              </div>
              {picker === 'fg' ? (
                <PickerPanel
                  color={color}
                  onChange={(hex) => applyColor('fg', hex)}
                  label="Цвет текста"
                />
              ) : null}
            </div>

            <div className={styles.colorCard}>
              <h3 className={styles.colorTitle}>Фон</h3>
              {renderField('bg', 'Background', background)}
              <div className="row">
                <span className="swatch" style={{ background, width: 40, height: 40 }} />
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => setPicker(picker === 'bg' ? null : 'bg')}
                  aria-expanded={picker === 'bg'}
                >
                  Пипетка
                </button>
              </div>
              {picker === 'bg' ? (
                <PickerPanel
                  color={background}
                  onChange={(hex) => applyColor('bg', hex)}
                  label="Цвет фона"
                />
              ) : null}
            </div>
          </div>

          <div className="row" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn" onClick={swap}>
              ⇄ Поменять местами
            </button>
          </div>
        </section>
      </div>

      <section className="card" aria-labelledby="preview-title">
        <h2 className="section-title" id="preview-title">
          Предпросмотр
        </h2>
        <div className={styles.preview} style={{ background, color }}>
          <p style={{ fontSize: '14px' }}>
            14px — обычный текст. Съешь же ещё этих мягких французских булок, да выпей чаю.
          </p>
          <p style={{ fontSize: '18px' }}>18px — крупный текст для подписей и кнопок.</p>
          <p style={{ fontSize: '24px', fontWeight: 700 }}>24px bold — заголовок раздела</p>
          <div className={styles.icons} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"
              />
            </svg>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M12 21s-7.5-4.6-9.3-9A5.4 5.4 0 0 1 12 6.2 5.4 5.4 0 0 1 21.3 12c-1.8 4.4-9.3 9-9.3 9z"
              />
            </svg>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.5l-4-4 1.5-1.5 2.5 2.5 5.4-5.4 1.5 1.5z"
              />
            </svg>
            <span className={styles.iconText}>Иконки и элементы управления</span>
          </div>
        </div>
      </section>

      <section className="card" aria-labelledby="adjust-title">
        <h2 className="section-title" id="adjust-title">
          Подбор доступного оттенка
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Если контраста не хватает, приложение подберёт ближайший по светлоте оттенок, сохранив тон
          и насыщенность.
        </p>
        <div className="row">
          <button type="button" className="btn" onClick={() => adjust('fg', 4.5)}>
            Текст под AA
          </button>
          <button type="button" className="btn" onClick={() => adjust('fg', 7)}>
            Текст под AAA
          </button>
          <button type="button" className="btn" onClick={() => adjust('bg', 4.5)}>
            Фон под AA
          </button>
          <button type="button" className="btn" onClick={() => adjust('bg', 7)}>
            Фон под AAA
          </button>
        </div>
      </section>
    </div>
  )
}
