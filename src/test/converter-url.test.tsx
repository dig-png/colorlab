import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { useColorStore } from '../store/colorStore'

describe('синхронизация цвета с адресом', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/converter')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('пишет в историю один раз после серии изменений цвета', () => {
    vi.useFakeTimers()
    render(<App />)
    const replaceState = vi.spyOn(window.history, 'replaceState')

    act(() => {
      for (let i = 0; i < 200; i += 1) {
        useColorStore.getState().setColor(`#${i.toString(16).padStart(6, '0')}`)
      }
    })
    expect(replaceState).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(replaceState).toHaveBeenCalledTimes(1)
    expect(window.location.search).toBe('?hex=0000c7')
  })
})
