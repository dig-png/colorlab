import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Cheatsheet } from './pages/Cheatsheet'
import { Contrast } from './pages/Contrast'
import { Converter } from './pages/Converter'
import { Library } from './pages/Library'
import { NotFound } from './pages/NotFound'
import { Palette } from './pages/Palette'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/converter" replace />} />
          <Route path="converter" element={<Converter />} />
          <Route path="palette" element={<Palette />} />
          <Route path="contrast" element={<Contrast />} />
          <Route path="library" element={<Library />} />
          <Route path="cheatsheet" element={<Cheatsheet />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
