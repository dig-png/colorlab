import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PRESET_PALETTES } from '../data/presets'
import { copyText, downloadFile } from '../lib/clipboard'
import {
  parseCollectionJson,
  parseTags,
  toCollectionJson,
  toCss,
  toHexList,
  toJson,
} from '../lib/exporters'
import type { SavedPalette } from '../lib/types'
import { useLibraryStore } from '../store/libraryStore'
import { useToastStore } from '../store/toastStore'
import styles from './Library.module.css'

interface Filterable {
  name: string
  tags: string[]
  category?: string
}

function matches(item: Filterable, query: string, tag: string): boolean {
  const haystack = [item.name, item.category ?? '', ...item.tags].join(' ').toLowerCase()
  const byQuery = !query || haystack.includes(query.trim().toLowerCase())
  const byTag = !tag || item.tags.includes(tag) || item.category === tag
  return byQuery && byTag
}

interface CardProps {
  name: string
  tags: string[]
  category?: string
  colors: string[]
  children?: ReactNode
}

function PaletteCard({ name, tags, category, colors, children }: CardProps) {
  const show = useToastStore((state) => state.show)

  const copy = async (text: string, message: string) => {
    const copied = await copyText(text)
    show(copied ? message : 'Не удалось скопировать')
  }

  return (
    <article className={`card ${styles.card}`}>
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>{name}</h3>
        {category ? <span className="badge">{category}</span> : null}
      </div>

      <div className={styles.swatches}>
        {colors.map((hex, index) => (
          <button
            key={`${hex}-${index}`}
            type="button"
            className={styles.swatchButton}
            style={{ background: hex }}
            onClick={() => copy(hex, `Скопирован ${hex}`)}
            title={`${hex} — копировать`}
            aria-label={`Скопировать ${hex}`}
          />
        ))}
      </div>

      <p className={styles.hexLine}>
        <code>{toHexList(colors)}</code>
      </p>

      {tags.length > 0 ? (
        <div className="chips">
          {tags.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="row">
        <button
          type="button"
          className="btn btn-small"
          onClick={() => copy(toHexList(colors), 'Палитра скопирована')}
        >
          Копировать
        </button>
        <button
          type="button"
          className="btn btn-small"
          onClick={() => copy(toCss(colors), 'CSS-переменные скопированы')}
        >
          CSS
        </button>
        <button
          type="button"
          className="btn btn-small"
          onClick={() => copy(toJson({ name, colors }), 'JSON скопирован')}
        >
          JSON
        </button>
        {children}
      </div>
    </article>
  )
}

export function Library() {
  const palettes = useLibraryStore((state) => state.palettes)
  const update = useLibraryStore((state) => state.update)
  const remove = useLibraryStore((state) => state.remove)
  const importMany = useLibraryStore((state) => state.importMany)
  const show = useToastStore((state) => state.show)

  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftTags, setDraftTags] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const presets = PRESET_PALETTES.filter((item) => matches(item, query, tag))
  const own = palettes.filter((item) => matches(item, query, tag))

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const preset of PRESET_PALETTES) {
      tags.add(preset.category)
      preset.tags.forEach((item) => tags.add(item))
    }
    for (const palette of palettes) palette.tags.forEach((item) => tags.add(item))
    return [...tags].sort((a, b) => a.localeCompare(b, 'ru'))
  }, [palettes])

  const startEdit = (palette: SavedPalette) => {
    setEditingId(palette.id)
    setDraftName(palette.name)
    setDraftTags(palette.tags.join(', '))
  }

  const saveEdit = (id: string) => {
    update(id, { name: draftName.trim() || 'Без названия', tags: parseTags(draftTags) })
    setEditingId(null)
    show('Палитра обновлена')
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const text = await file.text()
    const imported = parseCollectionJson(text)
    if (!imported) {
      show('Не удалось прочитать файл: нужен JSON с палитрами')
      return
    }
    const count = importMany(imported)
    show(`Импортировано палитр: ${count}`)
  }

  const exportAll = () => {
    if (palettes.length === 0) {
      show('В библиотеке пока нет сохранённых палитр')
      return
    }
    downloadFile('colorlab-palettes.json', toCollectionJson(palettes))
    show('Коллекция выгружена в JSON')
  }

  const confirmPalette = palettes.find((item) => item.id === confirmId) ?? null

  return (
    <div className="page">
      <header className="page-head">
        <h1>Библиотека палитр</h1>
        <p className="lead">
          Готовые наборы и ваши сохранённые палитры. Поиск по названию и тегам, копирование цветов,
          экспорт и импорт коллекции.
        </p>
      </header>

      <section className="card" aria-labelledby="filters-title">
        <h2 className="section-title" id="filters-title">
          Поиск и фильтры
        </h2>
        <div className={styles.toolbar}>
          <div className="field">
            <label className="label" htmlFor="library-search">
              Поиск по названию и тегам
            </label>
            <input
              id="library-search"
              className="input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Например, «пастель» или «тёмная»"
              type="search"
            />
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
              Импорт JSON
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              hidden
            />
            <button type="button" className="btn" onClick={exportAll}>
              Экспорт коллекции
            </button>
          </div>
        </div>

        <div className="chips" role="group" aria-label="Фильтр по тегам">
          <button
            type="button"
            className={tag === '' ? 'chip chip-active' : 'chip'}
            onClick={() => setTag('')}
            aria-pressed={tag === ''}
          >
            Все
          </button>
          {allTags.map((item) => (
            <button
              key={item}
              type="button"
              className={tag === item ? 'chip chip-active' : 'chip'}
              onClick={() => setTag(tag === item ? '' : item)}
              aria-pressed={tag === item}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="presets-title">
        <div className={styles.sectionHead}>
          <h2 id="presets-title">Каталог</h2>
          <span className="badge">{presets.length}</span>
        </div>
        {presets.length > 0 ? (
          <div className={styles.grid}>
            {presets.map((preset) => (
              <PaletteCard
                key={preset.id}
                name={preset.name}
                tags={preset.tags}
                category={preset.category}
                colors={preset.colors}
              />
            ))}
          </div>
        ) : (
          <p className="muted">Ничего не найдено. Измените запрос или сбросьте фильтр.</p>
        )}
      </section>

      <section aria-labelledby="own-title">
        <div className={styles.sectionHead}>
          <h2 id="own-title">Мои палитры</h2>
          <span className="badge">{own.length}</span>
        </div>
        {own.length === 0 ? (
          <p className="muted">
            {palettes.length === 0
              ? 'Пока пусто. Сгенерируйте палитру в разделе «Генератор» и сохраните её.'
              : 'Под фильтр ничего не подходит.'}
          </p>
        ) : (
          <div className={styles.grid}>
            {own.map((palette) =>
              editingId === palette.id ? (
                <article className={`card ${styles.card}`} key={palette.id}>
                  <div className="field">
                    <label className="label" htmlFor={`edit-name-${palette.id}`}>
                      Название
                    </label>
                    <input
                      id={`edit-name-${palette.id}`}
                      className="input"
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor={`edit-tags-${palette.id}`}>
                      Теги (через запятую)
                    </label>
                    <input
                      id={`edit-tags-${palette.id}`}
                      className="input"
                      value={draftTags}
                      onChange={(event) => setDraftTags(event.target.value)}
                    />
                  </div>
                  <div className="row">
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => saveEdit(palette.id)}
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => setEditingId(null)}
                    >
                      Отмена
                    </button>
                  </div>
                </article>
              ) : (
                <PaletteCard
                  key={palette.id}
                  name={palette.name}
                  tags={palette.tags}
                  colors={palette.colors}
                >
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => startEdit(palette)}
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={() => setConfirmId(palette.id)}
                  >
                    Удалить
                  </button>
                </PaletteCard>
              ),
            )}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmId !== null}
        title="Удалить палитру?"
        confirmLabel="Удалить"
        onConfirm={() => {
          if (confirmId) {
            remove(confirmId)
            show('Палитра удалена')
          }
        }}
        onClose={() => setConfirmId(null)}
      >
        <p className="muted">
          {confirmPalette
            ? `«${confirmPalette.name}» будет удалена без возможности восстановления.`
            : ''}
        </p>
      </ConfirmDialog>
    </div>
  )
}
