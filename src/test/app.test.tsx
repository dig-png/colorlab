import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

function renderAt(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

beforeEach(() => {
  localStorage.clear()
})

describe('приложение стартует на всех маршрутах', () => {
  it('конвертер', () => {
    renderAt('/converter')
    expect(screen.getByRole('heading', { level: 1, name: 'Конвертер цветов' })).toBeInTheDocument()
  })

  it('генератор', () => {
    renderAt('/palette')
    expect(screen.getByRole('heading', { level: 1, name: 'Генератор палитр' })).toBeInTheDocument()
  })

  it('контраст', () => {
    renderAt('/contrast')
    expect(screen.getByRole('heading', { level: 1, name: 'Контраст по WCAG 2.1' })).toBeInTheDocument()
  })

  it('библиотека', () => {
    renderAt('/library')
    expect(screen.getByRole('heading', { level: 1, name: 'Библиотека палитр' })).toBeInTheDocument()
  })

  it('справочник', () => {
    renderAt('/cheatsheet')
    expect(screen.getByRole('heading', { level: 1, name: 'Справочник' })).toBeInTheDocument()
  })

  it('404 для неизвестного маршрута', () => {
    renderAt('/unknown')
    expect(screen.getByRole('heading', { level: 1, name: /404/ })).toBeInTheDocument()
  })
})
