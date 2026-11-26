import { useState, type ReactNode } from 'react'
import { describe, hslToRgb, rgbToHex } from '../lib/color'
import { contrastRatio } from '../lib/contrast'
import { HARMONY_TYPES, generateHarmony } from '../lib/harmonies'
import styles from './Cheatsheet.module.css'

interface Section {
  id: string
  title: string
  keywords: string
  content: ReactNode
}

export function Cheatsheet() {
  const [query, setQuery] = useState('')
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 })

  const demo = rgbToHex(hslToRgb(hsl))
  const parts = describe(demo)

  const sections: Section[] = [
    {
      id: 'models',
      title: 'Цветовые модели',
      keywords: 'hex rgb hsl hsv cmyk lab модели запись представление каналы',
      content: (
        <>
          <p>
            Один и тот же цвет можно записать по-разному. В приложении обязательны HEX, RGB и HSL,
            остальные модели полезно знать для чтения документации и дизайн-макетов.
          </p>
          <div className={styles.tableWrap}>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Модель</th>
                  <th scope="col">Пример</th>
                  <th scope="col">Что описывает</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>HEX</td>
                  <td>
                    <code>#3B82F6</code>
                  </td>
                  <td>
                    Шестнадцатеричная запись RGB: две цифры на канал. <code>#RGB</code> — сокращение
                    вида <code>#33BBFF</code>.
                  </td>
                </tr>
                <tr>
                  <td>RGB</td>
                  <td>
                    <code>rgb(59, 130, 246)</code>
                  </td>
                  <td>Аддитивная модель: красный, зелёный и синий каналы от 0 до 255.</td>
                </tr>
                <tr>
                  <td>HSL</td>
                  <td>
                    <code>hsl(217, 91%, 60%)</code>
                  </td>
                  <td>
                    Тон (0–360°), насыщенность и светлота в процентах. Удобна для подбора оттенков
                    вручную.
                  </td>
                </tr>
                <tr>
                  <td>HSV</td>
                  <td>
                    <code>hsv(217, 76%, 96%)</code>
                  </td>
                  <td>
                    Как HSL, но вместо светлоты — яркость (value). Часто встречается в палитрах
                    графических редакторов.
                  </td>
                </tr>
                <tr>
                  <td>CMYK</td>
                  <td>
                    <code>C79 M47 Y0 K4</code>
                  </td>
                  <td>Субтрактивная модель для печати: голубой, пурпурный, жёлтый, чёрный.</td>
                </tr>
                <tr>
                  <td>Lab</td>
                  <td>
                    <code>L* 55 a* 20 b* -60</code>
                  </td>
                  <td>
                    Аппаратно-независимое пространство: светлота и две оси цветности. Используется
                    для точных сравнений цветов.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: 'hsl',
      title: 'HSL на практике',
      keywords: 'hsl тон насыщенность светлота hue saturation lightness ползунки демонстрация',
      content: (
        <>
          <p>
            Подвиньте ползунки: тон выбирает место на цветовом круге, насыщенность — «серость»
            цвета, светлота — близость к белому или чёрному.
          </p>
          <div className={styles.demo}>
            <div className={styles.demoSwatch} style={{ background: demo }} aria-hidden="true" />
            <div className={styles.sliders}>
              <label className={styles.slider}>
                <span>
                  Hue (тон) <strong>{hsl.h}°</strong>
                </span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={hsl.h}
                  onChange={(event) => setHsl({ ...hsl, h: Number(event.target.value) })}
                />
              </label>
              <label className={styles.slider}>
                <span>
                  Saturation (насыщенность) <strong>{hsl.s}%</strong>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={hsl.s}
                  onChange={(event) => setHsl({ ...hsl, s: Number(event.target.value) })}
                />
              </label>
              <label className={styles.slider}>
                <span>
                  Lightness (светлота) <strong>{hsl.l}%</strong>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={hsl.l}
                  onChange={(event) => setHsl({ ...hsl, l: Number(event.target.value) })}
                />
              </label>
            </div>
          </div>
          <p className={styles.readout}>
            <code>{demo}</code> · <code>{`rgb(${parts.rgb.r}, ${parts.rgb.g}, ${parts.rgb.b})`}</code>{' '}
            · <code>{`hsl(${parts.hsl.h}, ${parts.hsl.s}%, ${parts.hsl.l}%)`}</code>
          </p>
        </>
      ),
    },
    {
      id: 'harmonies',
      title: 'Схемы гармонии',
      keywords: 'гармония комплементарная аналоговая триада тетрада монохромная цветовой круг схемы',
      content: (
        <>
          <p>
            Схемы гармонии — математические правила выбора нескольких тонов на цветовом круге. Ниже
            палитры построены от цвета{' '}
            <span className={styles.inlineSwatch} style={{ background: demo }} aria-hidden="true" />{' '}
            <code>{demo}</code>.
          </p>
          <div className={styles.harmonyLayout}>
            <div className={styles.wheelWrap}>
              <div className={styles.wheel} aria-hidden="true" />
              <span className={styles.wheelCaption}>Цветовой круг: 0° — красный</span>
            </div>
            <div className={styles.schemeGrid}>
              {HARMONY_TYPES.map((item) => (
                <div className={styles.schemeCard} key={item.id}>
                  <h3>{item.label}</h3>
                  <p className="muted">{item.hint}</p>
                  <div className={styles.schemeColors}>
                    {generateHarmony(demo, item.id, 4).map((hex, index) => (
                      <span
                        key={`${item.id}-${index}`}
                        className={styles.schemeColor}
                        style={{ background: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'wcag',
      title: 'Контраст и WCAG 2.1',
      keywords: 'wcag контраст contrast ratio aa aaa доступность текст фон 4.5 7 3 формула',
      content: (
        <>
          <p>
            Контраст считается по относительной яркости цветов:{' '}
            <code>(L1 + 0.05) / (L2 + 0.05)</code>, где L1 — более светлый цвет. Результат
            нормирован от 1:1 (цвета совпадают) до 21:1 (чёрный на белом).
          </p>
          <div className={styles.tableWrap}>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Уровень</th>
                  <th scope="col">Обычный текст</th>
                  <th scope="col">Крупный текст</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AA</td>
                  <td>≥ 4.5:1</td>
                  <td>≥ 3:1</td>
                </tr>
                <tr>
                  <td>AAA</td>
                  <td>≥ 7:1</td>
                  <td>≥ 4.5:1</td>
                </tr>
                <tr>
                  <td>Элементы интерфейса</td>
                  <td colSpan={2}>≥ 3:1 к соседним цветам</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={styles.readout}>
            Демо-цвет <code>{demo}</code>: контраст с белым —{' '}
            <strong>{contrastRatio(demo, '#ffffff').toFixed(2)}:1</strong>, с чёрным —{' '}
            <strong>{contrastRatio(demo, '#000000').toFixed(2)}:1</strong>.
          </p>
          <p className="muted">
            Крупным считается текст от 18pt (24px) обычного начертания или от 14pt (18.66px) жирного.
            Для интерфейсных элементов и границ достаточно 3:1.
          </p>
        </>
      ),
    },
  ]

  const normalizedQuery = query.trim().toLowerCase()
  const visible = sections.filter(
    (section) =>
      !normalizedQuery ||
      `${section.title} ${section.keywords}`.toLowerCase().includes(normalizedQuery),
  )

  return (
    <div className="page">
      <header className="page-head">
        <h1>Справочник</h1>
        <p className="lead">
          Краткая теория цвета: модели, HSL, схемы гармонии и стандарты контрастности WCAG 2.1.
        </p>
      </header>

      <div className="field">
        <label className="label" htmlFor="cheatsheet-search">
          Поиск по справочнику
        </label>
        <input
          id="cheatsheet-search"
          className="input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Например, «контраст» или «HSL»"
        />
      </div>

      {visible.length === 0 ? (
        <p className="muted">По запросу «{query}» ничего не найдено.</p>
      ) : (
        visible.map((section) => (
          <section className="card" key={section.id} aria-labelledby={`section-${section.id}`}>
            <h2 className="section-title" id={`section-${section.id}`}>
              {section.title}
            </h2>
            {section.content}
          </section>
        ))
      )}
    </div>
  )
}
