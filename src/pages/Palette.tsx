import { useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CopyButton } from '../components/CopyButton'
import { PickerPanel } from '../components/PickerPanel'
import { toCss, toHexList, toJson, parseTags } from '../lib/exporters'
import { HARMONY_TYPES, generateHarmony, type HarmonyType } from '../lib/harmonies'
import { useColorStore } from '../store/colorStore'
import { useLibraryStore } from '../store/libraryStore'
import { useToastStore } from '../store/toastStore'
import styles from './Palette.module.css'

const SIZES = [3, 4, 5, 6]

interface SwatchProps {
  index: number
  total: number
  color: string
  locked: boolean
  onToggleLock: () => void
  onEdit: () => void
  onMove: (direction: -1 | 1) => void
}

function SortableSwatch({
  index,
  total,
  color,
  locked,
  onToggleLock,
  onEdit,
  onMove,
}: SwatchProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `slot-${index}`,
  })

  return (
    <li
      ref={setNodeRef}
      className={styles.item}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
    >
      <div className={styles.itemHead}>
        <button
          type="button"
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
          aria-label={`Перетащить цвет ${color}`}
        >
          ⠿
        </button>
        <code className={styles.hex}>{color}</code>
      </div>

      <button
        type="button"
        className={styles.colorBlock}
        style={{ background: color }}
        onClick={onEdit}
        aria-label={`Изменить цвет ${color}`}
      />

      <div className={styles.itemActions}>
        <button
          type="button"
          className={locked ? 'btn btn-small btn-primary' : 'btn btn-small'}
          onClick={onToggleLock}
          aria-pressed={locked}
          aria-label={locked ? `Разблокировать ${color}` : `Закрепить ${color}`}
        >
          <span aria-hidden="true">{locked ? '🔒' : '🔓'}</span>{' '}
          {locked ? 'Закреплён' : 'Закрепить'}
        </button>
        <button
          type="button"
          className="btn btn-small"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label="Сдвинуть влево"
        >
          ←
        </button>
        <button
          type="button"
          className="btn btn-small"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          aria-label="Сдвинуть вправо"
        >
          →
        </button>
      </div>
    </li>
  )
}

export function Palette() {
  const color = useColorStore((state) => state.color)
  const setColor = useColorStore((state) => state.setColor)
  const addPalette = useLibraryStore((state) => state.add)
  const show = useToastStore((state) => state.show)

  const [harmony, setHarmony] = useState<HarmonyType>('analogous')
  const [size, setSize] = useState(5)
  const [palette, setPalette] = useState<string[]>(() => generateHarmony(color, 'analogous', 5))
  const [locked, setLocked] = useState<boolean[]>(() => Array.from({ length: 5 }, () => false))
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [tags, setTags] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const regenerate = (nextType: HarmonyType = harmony, nextSize: number = size) => {
    const fresh = generateHarmony(color, nextType, nextSize)
    setPalette(fresh.map((next, index) => (locked[index] ? (palette[index] ?? next) : next)))
    setLocked(Array.from({ length: nextSize }, (_, index) => locked[index] ?? false))
    setEditIndex(null)
  }

  const changeHarmony = (next: HarmonyType) => {
    setHarmony(next)
    regenerate(next, size)
  }

  const changeSize = (next: number) => {
    setSize(next)
    regenerate(harmony, next)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = Number(String(active.id).replace('slot-', ''))
    const to = Number(String(over.id).replace('slot-', ''))
    if (Number.isNaN(from) || Number.isNaN(to)) return
    setPalette((prev) => arrayMove(prev, from, to))
    setLocked((prev) => arrayMove(prev, from, to))
  }

  const move = (from: number, direction: -1 | 1) => {
    const to = from + direction
    if (to < 0 || to >= palette.length) return
    setPalette((prev) => arrayMove(prev, from, to))
    setLocked((prev) => arrayMove(prev, from, to))
  }

  const updateColor = (index: number, hex: string) => {
    setPalette((prev) => prev.map((value, position) => (position === index ? hex : value)))
  }

  const save = () => {
    addPalette({
      name: name.trim() || 'Моя палитра',
      tags: parseTags(tags),
      colors: palette,
    })
    show('Палитра сохранена в библиотеку')
    setName('')
    setTags('')
  }

  const exportName = name.trim() || 'Палитра'

  return (
    <div className="page">
      <header className="page-head">
        <h1>Генератор палитр</h1>
        <p className="lead">
          Схема строится от текущего цвета. Закрепите понравившиеся цвета, чтобы они переживали
          повторную генерацию, и настройте любой оттенок вручную.
        </p>
      </header>

      <section className="card" aria-labelledby="toolbar-title">
        <h2 className="section-title" id="toolbar-title">
          Схема гармонии
        </h2>
        <div className="chips" role="group" aria-label="Схема гармонии">
          {HARMONY_TYPES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === harmony ? 'chip chip-active' : 'chip'}
              onClick={() => changeHarmony(item.id)}
              aria-pressed={item.id === harmony}
              title={item.hint}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.toolbar}>
          <div className="field">
            <label className="label" htmlFor="size">
              Цветов в палитре
            </label>
            <select
              id="size"
              className="input"
              value={size}
              onChange={(event) => changeSize(Number(event.target.value))}
            >
              {SIZES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.baseColor}>
            <span className="label">Базовый цвет</span>
            <span className={styles.baseSwatch} style={{ background: color }} aria-hidden="true" />
            <code>{color}</code>
            <button
              type="button"
              className="btn btn-small"
              onClick={() => setColor(palette[0] ?? color)}
            >
              Взять первый
            </button>
          </div>

          <button type="button" className="btn btn-primary" onClick={() => regenerate()}>
            Сгенерировать
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="palette-title">
        <h2 className="section-title" id="palette-title">
          Палитра
        </h2>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={palette.map((_, index) => `slot-${index}`)}
            strategy={rectSortingStrategy}
          >
            <ul className={styles.palette}>
              {palette.map((hex, index) => (
                <SortableSwatch
                  key={`slot-${index}`}
                  index={index}
                  total={palette.length}
                  color={hex}
                  locked={locked[index] ?? false}
                  onToggleLock={() =>
                    setLocked((prev) =>
                      prev.map((value, position) => (position === index ? !value : value)),
                    )
                  }
                  onEdit={() => setEditIndex(index)}
                  onMove={(direction) => move(index, direction)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        <p className="field-hint">
          Перетаскивайте карточки за ручку ⠿ или используйте стрелки. Закреплённые цвета не меняются
          при генерации.
        </p>
      </section>

      {editIndex !== null && palette[editIndex] ? (
        <section className="card" aria-labelledby="edit-title">
          <h2 className="section-title" id="edit-title">
            Настройка цвета {editIndex + 1}
          </h2>
          <PickerPanel
            color={palette[editIndex]}
            onChange={(hex) => updateColor(editIndex, hex)}
            label={`Цвет ${editIndex + 1}`}
          />
          <div className="row" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn" onClick={() => setEditIndex(null)}>
              Готово
            </button>
          </div>
        </section>
      ) : null}

      <div className={styles.columns}>
        <section className="card" aria-labelledby="save-title">
          <h2 className="section-title" id="save-title">
            Сохранить в библиотеку
          </h2>
          <div className="field">
            <label className="label" htmlFor="palette-name">
              Название
            </label>
            <input
              id="palette-name"
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Например, «Закат в офисе»"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="palette-tags">
              Теги
            </label>
            <input
              id="palette-tags"
              className="input"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="тёплая, интерфейс, акцент"
            />
            <p className="field-hint">Через запятую. Теги помогают искать палитры в библиотеке.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={save}>
            Сохранить палитру
          </button>
        </section>

        <section className="card" aria-labelledby="export-title">
          <h2 className="section-title" id="export-title">
            Экспорт
          </h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Текущая палитра: CSS-переменные, JSON или список HEX-кодов.
          </p>
          <div className="row">
            <CopyButton text={toCss(palette)} label="CSS" toast="CSS-переменные скопированы" />
            <CopyButton
              text={toJson({ name: exportName, colors: palette })}
              label="JSON"
              toast="JSON скопирован"
            />
            <CopyButton text={toHexList(palette)} label="HEX" toast="Список HEX скопирован" />
          </div>
        </section>
      </div>
    </div>
  )
}
