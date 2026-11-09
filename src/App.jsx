import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AdminProvider } from './admin/AdminContext'
import Nav from './components/Nav'
import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import Home from './pages/Home'
import Carta from './pages/Carta'
import { AvisoLegal, Privacidad, PoliticaCookies } from './pages/Legal'

export default function App() {
  return (
    <AdminProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3200,
          style: {
            background: '#021E50',
            color: '#FBFCFD',
            borderRadius: '999px',
            fontFamily: "'Montserrat', system-ui, sans-serif",
            fontSize: '.85rem',
            padding: '12px 22px',
            boxShadow: '0 18px 40px rgba(1,19,58,.35)',
          },
          success: { iconTheme: { primary: '#E8A35A', secondary: '#021E50' } },
          error: { iconTheme: { primary: '#E8A35A', secondary: '#021E50' } },
        }}
      />
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/carta" element={<Carta />} />
          <Route path="/aviso-legal" element={<AvisoLegal />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/cookies" element={<PoliticaCookies />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <CookieBanner />
    </AdminProvider>
  )
}
