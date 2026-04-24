import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function SiteHeader() {
  const [supersections, setSupersections] = useState([])
  const { pathname } = useLocation()
  const navigate = useNavigate()

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
          {supersections.map((ss) => {
            const sections = (ss.sections ?? []).filter((s) => s.images?.length > 0)
            const isActive = pathname === `/${ss.slug}`
            return (
              <div key={ss.id} className="relative group">
                <Link
                  to={`/${ss.slug}`}
                  className={`text-sm transition-colors ${
                    isActive ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {ss.name}
                </Link>

                {sections.length > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-150 z-50">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-max">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => {
                            if (pathname === `/${ss.slug}`) {
                              document.getElementById(section.slug)?.scrollIntoView({ behavior: 'smooth' })
                            } else {
                              navigate(`/${ss.slug}`, { state: { scrollTo: section.slug } })
                            }
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 whitespace-nowrap"
                        >
                          {section.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
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
