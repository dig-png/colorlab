import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="page">
      <div className="card">
        <h1>404 — страница не найдена</h1>
        <p className="muted">Такого раздела нет. Возможно, ссылка устарела или в адресе опечатка.</p>
        <Link className="btn btn-primary" to="/converter">
          Перейти в конвертер
        </Link>
      </div>
    </div>
  )
}
