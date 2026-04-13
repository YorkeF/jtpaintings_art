import { Routes, Route } from 'react-router-dom'
import Gallery from './pages/Gallery.jsx'
import Admin from './pages/Admin.jsx'
import Contact from './pages/Contact.jsx'
import ImagePage from './pages/ImagePage.jsx'
import SuperSectionPage from './pages/SuperSectionPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/image/:id" element={<ImagePage />} />
      {/* Catch-all: supersection slugs — must be last */}
      <Route path="/:slug" element={<SuperSectionPage />} />
    </Routes>
  )
}
