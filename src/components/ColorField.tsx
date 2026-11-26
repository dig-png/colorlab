import { useId } from 'react'

interface Props {
  label: string
  value: string
  hint?: string
  invalid?: boolean
  onChange: (value: string) => void
  onBlur?: () => void
  onCopy?: () => void
}

export function ColorField({ label, value, hint, invalid, onChange, onBlur, onCopy }: Props) {
  const id = useId()
  const describedBy = invalid ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="field-row">
        <input
          id={id}
          className={invalid ? 'input input-error' : 'input'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        />
        {onCopy ? (
          <button type="button" className="btn" onClick={onCopy} aria-label={`Скопировать ${label}`}>
            Копировать
          </button>
        ) : null}
      </div>
      {invalid ? (
        <p className="field-error" id={`${id}-error`}>
          Некорректное значение {label}
        </p>
      ) : hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
