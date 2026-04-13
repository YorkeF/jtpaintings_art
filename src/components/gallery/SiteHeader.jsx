import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function SiteHeader() {
  const [supersections, setSupersections] = useState([])
  const { pathname } = useLocation()

  useEffect(() => {
    fetch('/api/supersections.php')
      .then((r) => r.json())
      .then((d) => setSupersections(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold tracking-tight text-gray-900">
          JT Paintings
        </Link>
        <nav className="flex items-center gap-6">
          {supersections.map((ss) => (
            <Link
              key={ss.id}
              to={`/${ss.slug}`}
              className={`text-sm transition-colors ${
                pathname === `/${ss.slug}`
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {ss.name}
            </Link>
          ))}
          <Link
            to="/contact"
            className={`text-sm transition-colors ${
              pathname === '/contact'
                ? 'text-gray-900 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Contact
          </Link>
          <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
