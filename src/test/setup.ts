import '@testing-library/jest-dom/vitest'

// jsdom не реализует прокрутку, а Layout вызывает scrollTo при смене маршрута.
window.scrollTo = () => {}
