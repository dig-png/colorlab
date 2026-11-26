import { create } from 'zustand'

interface ToastState {
  message: string | null
  token: number
  show: (message: string) => void
}

export const useToastStore = create<ToastState>()((set) => ({
  message: null,
  token: 0,
  show: (message) => set((state) => ({ message, token: state.token + 1 })),
}))
