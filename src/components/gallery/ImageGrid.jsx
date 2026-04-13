function thumbSrc(imagePath) {
  return imagePath.replace(/(\.[^.]+)$/, '_thumb.jpg')
}

export default function ImageGrid({ images, onOpen }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {images.map((img, i) => {
        const colSpan = img.col_span || 1
        const rowSpan = img.row_span || 1
        return (
          <button
            key={img.id}
            onClick={() => onOpen(i)}
            className="group overflow-hidden rounded-lg bg-gray-200 shadow hover:shadow-md transition-shadow"
            style={{
              gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
              gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
              aspectRatio: `${colSpan} / ${rowSpan}`,
            }}
          >
            <img
              src={thumbSrc(img.image_path)}
              onError={(e) => { e.currentTarget.src = img.image_path; e.currentTarget.onerror = null }}
              alt={img.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        )
      })}
    </div>
  )
}
