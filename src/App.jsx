import { Routes, Route } from 'react-router-dom'
import Gallery from './pages/Gallery.jsx'
import Admin from './pages/Admin.jsx'
import Contact from './pages/Contact.jsx'
import SuperSectionPage from './pages/SuperSectionPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin" element={<Admin />} />
      {/* Catch-all: supersection slugs — must be last */}
      <Route path="/:slug" element={<SuperSectionPage />} />
    </Routes>
  )
}
