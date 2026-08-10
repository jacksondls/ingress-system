import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminEventFormPage } from './pages/AdminEventFormPage'
import { AdminListPage } from './pages/AdminListPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { ExplorePage } from './pages/ExplorePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ExplorePage />} />
          <Route path="evento/:id" element={<EventDetailPage />} />
          <Route path="admin" element={<AdminListPage />} />
          <Route path="admin/eventos/novo" element={<AdminEventFormPage />} />
          <Route path="admin/eventos/:id" element={<AdminEventFormPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
