import { copyText } from '../lib/clipboard'
import { useToastStore } from '../store/toastStore'

interface Props {
  text: string
  label?: string
  className?: string
  toast?: string
}

export function CopyButton({ text, label = 'Копировать', className = 'btn', toast }: Props) {
  const show = useToastStore((state) => state.show)

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const copied = await copyText(text)
        show(copied ? (toast ?? 'Скопировано в буфер обмена') : 'Не удалось скопировать')
      }}
    >
      {label}
    </button>
  )
}
