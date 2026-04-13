import { Routes, Route } from 'react-router-dom'
import Gallery from './pages/Gallery.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}
