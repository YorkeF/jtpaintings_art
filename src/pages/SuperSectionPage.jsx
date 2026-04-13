import { useEffect, useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/gallery/SiteHeader.jsx'
import ImageGrid from '../components/gallery/ImageGrid.jsx'

export default function SuperSectionPage() {
  const { slug } = useParams()
  const [supersection, setSupersection] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/supersections.php')
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) { setNotFound(true); return }
        const match = data.find((ss) => ss.slug === slug)
        if (!match) { setNotFound(true); return }
        setSupersection(match)
      })
      .catch(() => setNotFound(true))
  }, [slug])

  if (notFound) return <Navigate to="/" replace />

  const sections = supersection?.sections ?? []
  const allEmpty = sections.every((s) => !s.images?.length)

  const open = (images, index) =>
    navigate(`/image/${images[index].id}`, { state: { images, index } })

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-16">
        {supersection && (
          <h1 className="text-3xl font-bold text-gray-900">{supersection.name}</h1>
        )}

        {supersection && allEmpty && (
          <p className="text-center text-gray-400 py-20">No images in this section yet.</p>
        )}

        {sections.map((section) =>
          section.images?.length > 0 ? (
            <section key={section.id}>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200">
                {section.name}
              </h2>
              <ImageGrid
                images={section.images}
                onOpen={(i) => open(section.images, i)}
              />
            </section>
          ) : null
        )}
      </main>
    </div>
  )
}
