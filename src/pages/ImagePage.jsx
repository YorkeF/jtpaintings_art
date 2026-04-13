import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/gallery/SiteHeader.jsx'

export default function ImagePage() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const [image, setImage] = useState(null)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const touchRef = useRef({ dist: 0, scale: 1 })
  const containerRef = useRef()

  // Resolve image: from navigation state first, then API fallback
  useEffect(() => {
    const fromState = state?.images?.[state?.index]
    if (fromState) {
      setImage(fromState)
    } else {
      fetch(`/api/images.php?id=${id}`)
        .then((r) => r.json())
        .then((d) => { if (d.id) setImage(d) })
        .catch(() => {})
    }
  }, [id, state])

  // Reset zoom whenever the image changes
  useEffect(() => {
    setScale(1)
    setPos({ x: 0, y: 0 })
  }, [id])

  // Wheel zoom — must be non-passive to call preventDefault
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      setScale((s) => {
        const next = Math.max(1, Math.min(5, s - e.deltaY * 0.001))
        if (next <= 1) setPos({ x: 0, y: 0 })
        return next
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Touch zoom/pan — non-passive so we can prevent scroll
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const dist = (t) => Math.hypot(
      t[0].clientX - t[1].clientX,
      t[0].clientY - t[1].clientY
    )

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        touchRef.current = { dist: dist(e.touches), scale }
      } else {
        dragging.current = scale > 1
        dragStart.current = {
          x: e.touches[0].clientX - pos.x,
          y: e.touches[0].clientY - pos.y,
        }
      }
    }

    const onTouchMove = (e) => {
      e.preventDefault()
      if (e.touches.length === 2) {
        const next = Math.max(1, Math.min(5, touchRef.current.scale * (dist(e.touches) / touchRef.current.dist)))
        setScale(next)
        if (next <= 1) setPos({ x: 0, y: 0 })
      } else if (dragging.current) {
        setPos(clamp(
          e.touches[0].clientX - dragStart.current.x,
          e.touches[0].clientY - dragStart.current.y,
          scale
        ))
      }
    }

    const onTouchEnd = () => { dragging.current = false }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [scale, pos])

  const clamp = (x, y, s) => {
    const limit = (s - 1) * 300
    return {
      x: Math.max(-limit, Math.min(limit, x)),
      y: Math.max(-limit, Math.min(limit, y)),
    }
  }

  const onMouseDown = (e) => {
    if (scale <= 1) return
    e.preventDefault()
    dragging.current = true
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
  }

  const onMouseMove = (e) => {
    if (!dragging.current) return
    setPos(clamp(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y, scale))
  }

  const onMouseUp = () => { dragging.current = false }

  const resetZoom = () => { setScale(1); setPos({ x: 0, y: 0 }) }

  const zoomIn = () => setScale((s) => Math.min(5, parseFloat((s + 0.5).toFixed(1))))
  const zoomOut = () => setScale((s) => {
    const next = Math.max(1, parseFloat((s - 0.5).toFixed(1)))
    if (next <= 1) setPos({ x: 0, y: 0 })
    return next
  })

  const images = state?.images
  const idx = state?.index ?? -1
  const hasPrev = images && idx > 0
  const hasNext = images && idx >= 0 && idx < images.length - 1

  const goTo = (i) => navigate(
    `/image/${images[i].id}`,
    { state: { images, index: i }, replace: true }
  )

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft' && hasPrev) goTo(idx - 1)
      if (e.key === 'ArrowRight' && hasNext) goTo(idx + 1)
      if (e.key === 'Escape') navigate(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasPrev, hasNext, idx])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left: image viewer ───────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0">
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-xl bg-gray-900 select-none"
              style={{
                minHeight: '55vh',
                cursor: scale > 1 ? 'grab' : 'default',
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onDoubleClick={resetZoom}
            >
              {image && (
                <img
                  src={image.image_path}
                  alt={image.title}
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none"
                  style={{
                    transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                    transformOrigin: 'center',
                    transition: dragging.current ? 'none' : 'transform 0.12s ease',
                  }}
                />
              )}
              {scale > 1 && (
                <p className="absolute bottom-3 right-3 text-xs text-white/60 select-none pointer-events-none">
                  Double-click to reset
                </p>
              )}
            </div>

            {/* Controls bar */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={zoomOut}
                disabled={scale <= 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 text-base leading-none"
              >
                −
              </button>
              <span className="text-sm text-gray-500 w-11 text-center tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={scale >= 5}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 text-base leading-none"
              >
                +
              </button>
              {scale > 1 && (
                <button
                  onClick={resetZoom}
                  className="text-xs text-gray-400 hover:text-gray-600 ml-1"
                >
                  Reset
                </button>
              )}

              <div className="flex-1" />

              {hasPrev && (
                <button
                  onClick={() => goTo(idx - 1)}
                  className="text-sm text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
                >
                  ← Prev
                </button>
              )}
              {hasNext && (
                <button
                  onClick={() => goTo(idx + 1)}
                  className="text-sm text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
                >
                  Next →
                </button>
              )}
            </div>
          </div>

          {/* ── Right: info panel ────────────────────────────────────────── */}
          <div className="lg:w-72 flex flex-col gap-5 lg:pt-1">
            <button
              onClick={() => navigate(-1)}
              className="self-start text-sm text-gray-400 hover:text-gray-700"
            >
              ← Back
            </button>

            {image ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 leading-snug">
                  {image.title}
                </h1>
                {image.description && (
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {image.description}
                  </p>
                )}
              </>
            ) : (
              <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
            )}

            {images && idx >= 0 && (
              <p className="text-xs text-gray-400 mt-auto">
                {idx + 1} / {images.length}
              </p>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
