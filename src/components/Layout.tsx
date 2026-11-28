import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useColorStore } from '../store/colorStore'
import { Toast } from './Toast'
import styles from './Layout.module.css'

const LINKS = [
  { to: '/converter', label: 'Конвертер' },
  { to: '/palette', label: 'Генератор' },
  { to: '/contrast', label: 'Контраст' },
  { to: '/library', label: 'Библиотека' },
  { to: '/cheatsheet', label: 'Справочник' },
]

export function Layout() {
  const theme = useColorStore((state) => state.theme)
  const toggleTheme = useColorStore((state) => state.toggleTheme)
  const location = useLocation()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>

      <header className={styles.header}>
        <div className={styles.inner}>
          <NavLink to="/converter" className={styles.brand}>
            <span className={styles.logo} aria-hidden="true" />
            <span>ColorLab</span>
          </NavLink>

          <nav className={styles.nav} aria-label="Основная навигация">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          </button>
        </div>
      </header>

      <main id="main" className={styles.main}>
        <Outlet />
      </main>

      <Toast />
    </div>
  )
}
