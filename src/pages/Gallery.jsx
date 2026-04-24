import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../components/gallery/SiteHeader.jsx'
import ImageGrid from '../components/gallery/ImageGrid.jsx'

export default function Gallery() {
  const [sections, setSections] = useState([])
  const [unsectioned, setUnsectioned] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const safe = (p) => p.then((r) => r.json()).catch(() => [])
    Promise.all([
      safe(fetch('/api/sections.php')),
      safe(fetch('/api/images.php?unsectioned=1')),
    ]).then(([secs, imgs]) => {
      setSections(Array.isArray(secs) ? secs.filter((s) => !s.supersection_id) : [])
      setUnsectioned(Array.isArray(imgs) ? imgs : [])
      setLoading(false)
    })
  }, [])

  const open = (images, index) =>
    navigate(`/image/${images[index].id}`, { state: { images, index } })

  const allEmpty = sections.every((s) => !s.images?.length) && unsectioned.length === 0

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-16">
        {loading ? null : allEmpty ? (
          <p className="text-center text-gray-400 py-20">No images yet.</p>
        ) : (
          <>
            {unsectioned.length > 0 && (
              <ImageGrid images={unsectioned} onOpen={(i) => open(unsectioned, i)} />
            )}

            {sections.map((section) =>
              section.images?.length > 0 ? (
                <section key={section.id} id={section.slug}>
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
          </>
        )}
      </main>
    </div>
  )
}
