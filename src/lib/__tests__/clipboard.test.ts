import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText, downloadFile } from '../clipboard'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('copyText', () => {
  it('использует Clipboard API, когда он доступен', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    await expect(copyText('#3b82f6')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('#3b82f6')
  })

  it('возвращает false, когда оба способа недоступны', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    })
    expect(await copyText('text')).toBe(false)
  })
})

describe('downloadFile', () => {
  it('создаёт ссылку со скачиванием и освобождает URL', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test')
    const revokeObjectURL = vi.fn()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadFile('palettes.json', '{}')

    expect(createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
    expect(document.querySelector('a[download]')).toBeNull()
  })
})
