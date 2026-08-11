import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { AdminEventFormPage } from './pages/AdminEventFormPage'
import { AdminListPage } from './pages/AdminListPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { ExplorePage } from './pages/ExplorePage'
import { GatePage } from './pages/GatePage'
import { LoginPage } from './pages/LoginPage'
import { MyTicketsPage } from './pages/MyTicketsPage'
import { ShareTicketPage } from './pages/ShareTicketPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<ExplorePage />} />
            <Route path="evento/:id" element={<EventDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="ingresso/:token" element={<ShareTicketPage />} />

            <Route element={<RequireAuth roles={['organizer']} />}>
              <Route path="admin" element={<AdminListPage />} />
              <Route path="admin/eventos/novo" element={<AdminEventFormPage />} />
              <Route path="admin/eventos/:id" element={<AdminEventFormPage />} />
            </Route>

            <Route element={<RequireAuth roles={['client']} />}>
              <Route path="checkout/:orderId" element={<CheckoutPage />} />
              <Route path="meus-ingressos" element={<MyTicketsPage />} />
            </Route>

            <Route element={<RequireAuth roles={['gate']} />}>
              <Route path="portaria" element={<GatePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
