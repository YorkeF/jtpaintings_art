function thumbSrc(imagePath) {
  return imagePath.replace(/(\.[^.]+)$/, '_thumb.jpg')
}

export default function ImageCell({ img, onClick }) {
  const colSpan = img.col_span || 1
  const rowSpan = img.row_span || 1
  const arMode = img.ar_mode == 1
  const fullWidth = img.full_width == 1

  // Width formula for ar_mode flex container:
  // Each "size unit" is 1/4 of the row. With gap=0.75rem, the exact width per unit
  // is (100% - 3*0.75rem)/4, so size S = S*(100%+0.75rem)/4 - 0.75rem
  // = calc(S*25% - 0.75*(1-S/4)rem)
  const arSize = parseFloat(img.ar_size) || 1
  const arWidth = arMode
    ? `calc(${arSize * 25}% - ${(0.75 * (1 - arSize / 4)).toFixed(4)}rem)`
    : undefined

  // full_width images are rendered inside a 100vw wrapper div in ImageGrid;
  // the cell itself just needs to fill that wrapper at the correct height.
  const marginTop = parseFloat(img.margin_top) || 0

  const style = arMode
    ? {
        width: arWidth,
        flexShrink: 0,
        aspectRatio: `${img.ar_w || 16} / ${img.ar_h || 9}`,
        marginTop: marginTop > 0 ? `${marginTop}rem` : undefined,
      }
    : fullWidth
    ? {
        width: '100%',
        aspectRatio: `4 / ${rowSpan}`,
        marginTop: marginTop > 0 ? `${marginTop}rem` : undefined,
      }
    : {
        gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
        gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
        aspectRatio: `${colSpan} / ${rowSpan}`,
        marginTop: marginTop > 0 ? `${marginTop}rem` : undefined,
      }

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg bg-gray-200 shadow hover:shadow-md transition-shadow"
      style={style}
    >
      <img
        src={thumbSrc(img.image_path)}
        onError={(e) => { e.currentTarget.src = img.image_path; e.currentTarget.onerror = null }}
        alt={img.title}
        loading="lazy"
        className="w-full h-full transition-transform duration-300"
        style={{ objectFit: img.object_fit || 'cover' }}
      />
      <div className="absolute inset-x-0 top-0 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-white text-xs font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-1">
          {img.title}
        </span>
      </div>
    </button>
  )
}
