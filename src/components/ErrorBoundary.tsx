import { Component, type ErrorInfo, type ReactNode } from 'react'
import { clearStored } from '../lib/storage'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ColorLab: необработанная ошибка', error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
  }

  private resetData = () => {
    clearStored('colorlab:settings')
    clearStored('colorlab:library')
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="page">
        <div className="card">
          <h1>Что-то пошло не так</h1>
          <p className="muted">
            Приложение перехватило ошибку и продолжает работать. Попробуйте ещё раз или сбросьте
            сохранённые данные — они хранятся только в этом браузере.
          </p>
          <pre className="error-text">{this.state.error.message}</pre>
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={this.reset}>
              Попробовать снова
            </button>
            <button type="button" className="btn" onClick={this.resetData}>
              Сбросить данные
            </button>
          </div>
        </div>
      </div>
    )
  }
}
