import { useEffect } from 'react'

export default function Lightbox({ image, onClose, onPrev, onNext }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, onNext, onPrev])

  if (!image) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Previous */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl px-4 py-2 hover:text-gray-300"
        onClick={(e) => { e.stopPropagation(); onPrev() }}
        aria-label="Previous"
      >
        ‹
      </button>

      {/* Image + info */}
      <div
        className="flex flex-col items-center max-w-5xl max-h-screen p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.image_path}
          alt={image.title}
          className="max-h-[80vh] max-w-full object-contain rounded shadow-2xl"
        />
        <div className="mt-4 text-center text-white">
          <h2 className="text-xl font-semibold">{image.title}</h2>
          {image.description && (
            <p className="mt-1 text-gray-300 text-sm max-w-xl">{image.description}</p>
          )}
        </div>
      </div>

      {/* Next */}
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl px-4 py-2 hover:text-gray-300"
        onClick={(e) => { e.stopPropagation(); onNext() }}
        aria-label="Next"
      >
        ›
      </button>

      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  )
}
