import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Lightbox from '../components/Lightbox.jsx'
import ImageGrid from '../components/gallery/ImageGrid.jsx'

export default function Gallery() {
  const [sections, setSections] = useState([])
  const [unsectioned, setUnsectioned] = useState([])
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const safe = (p) => p.then((r) => r.json()).catch(() => [])
    Promise.all([
      safe(fetch('/api/sections.php')),
      safe(fetch('/api/images.php?unsectioned=1')),
    ]).then(([secs, imgs]) => {
      setSections(Array.isArray(secs) ? secs : [])
      setUnsectioned(Array.isArray(imgs) ? imgs : [])
      setLoading(false)
    })
  }, [])

  const openLightbox = (images, index) => setLightbox({ open: true, images, index })
  const closeLightbox = () => setLightbox((lb) => ({ ...lb, open: false }))
  const prevImage = () => setLightbox((lb) => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length }))
  const nextImage = () => setLightbox((lb) => ({ ...lb, index: (lb.index + 1) % lb.images.length }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading…
      </div>
    )
  }

  const allEmpty = sections.every((s) => s.images?.length === 0) && unsectioned.length === 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">JT Paintings</h1>
          <nav className="flex items-center gap-6">
            <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900">
              Contact
            </Link>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-16">
        {allEmpty && (
          <p className="text-center text-gray-400 py-20">No images yet.</p>
        )}

        {unsectioned.length > 0 && (
          <ImageGrid images={unsectioned} onOpen={(i) => openLightbox(unsectioned, i)} />
        )}

        {sections.map((section) =>
          section.images?.length > 0 ? (
            <section key={section.id}>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200">
                {section.name}
              </h2>
              <ImageGrid
                images={section.images}
                onOpen={(i) => openLightbox(section.images, i)}
              />
            </section>
          ) : null
        )}
      </main>

      {lightbox.open && (
        <Lightbox
          image={lightbox.images[lightbox.index]}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </div>
  )
}
