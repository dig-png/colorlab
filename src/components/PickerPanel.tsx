import { useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { normalizeHex } from '../lib/color'

interface Props {
  color: string
  onChange: (hex: string) => void
  label?: string
}

export function PickerPanel({ color, onChange, label = 'Выбор цвета' }: Props) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <div className="picker">
      <HexColorPicker color={color} onChange={onChange} aria-label={label} />
      <div className="field-row">
        <input
          className="input"
          value={draft ?? color}
          onChange={(event) => {
            setDraft(event.target.value)
            const hex = normalizeHex(event.target.value)
            if (hex) onChange(hex)
          }}
          onBlur={() => setDraft(null)}
          aria-label={`${label}: HEX`}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
