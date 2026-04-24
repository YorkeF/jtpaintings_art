import ImageCell from './ImageCell.jsx'

export default function ImageGrid({ images, onOpen }) {
  const autoImages = []
  const rowGroups = new Map()

  images.forEach((img, idx) => {
    if (img.grid_row) {
      if (!rowGroups.has(img.grid_row)) rowGroups.set(img.grid_row, [])
      rowGroups.get(img.grid_row).push({ img, idx })
    } else {
      autoImages.push({ img, idx })
    }
  })

  const sortedRows = [...rowGroups.entries()].sort(([a], [b]) => a - b)

  return (
    <div className="space-y-3">
      {sortedRows.map(([rowNum, items]) => {
        const totalCols = items.reduce((sum, { img }) => sum + (img.col_span || 1), 0)
        return (
          <div
            key={rowNum}
            style={{ display: 'grid', gridTemplateColumns: `repeat(${totalCols}, 1fr)`, gap: '0.75rem' }}
          >
            {items.map(({ img, idx }) => (
              <ImageCell key={img.id} img={img} onClick={() => onOpen(idx)} />
            ))}
          </div>
        )
      })}
      {autoImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {autoImages.map(({ img, idx }) => (
            <ImageCell key={img.id} img={img} onClick={() => onOpen(idx)} />
          ))}
        </div>
      )}
    </div>
  )
}
