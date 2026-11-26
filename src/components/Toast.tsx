import { useEffect } from 'react'
import { useToastStore } from '../store/toastStore'
import styles from './Toast.module.css'

export function Toast() {
  const message = useToastStore((state) => state.message)
  const token = useToastStore((state) => state.token)

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => useToastStore.setState({ message: null }), 2600)
    return () => window.clearTimeout(timer)
  }, [message, token])

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {message}
    </div>
  )
}
