import { useState } from 'react'
import Tooltip from './Tooltip.jsx'

export default function ImageRow({ image, sections, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(image.title)
  const [description, setDescription] = useState(image.description || '')
  const [colSpan, setColSpan] = useState(image.col_span || 1)
  const [rowSpan, setRowSpan] = useState(image.row_span || 1)
  const [gridRow, setGridRow] = useState(image.grid_row ? String(image.grid_row) : '')
  const [objectFit, setObjectFit] = useState(image.object_fit || 'cover')
  const [arMode, setArMode] = useState(image.ar_mode == 1)
  const [arW, setArW] = useState(image.ar_w || 16)
  const [arH, setArH] = useState(image.ar_h || 9)
  const [arSize, setArSize] = useState(parseFloat(image.ar_size) || 1)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const cancel = () => {
    setEditing(false)
    setTitle(image.title)
    setDescription(image.description || '')
    setColSpan(image.col_span || 1)
    setRowSpan(image.row_span || 1)
    setGridRow(image.grid_row ? String(image.grid_row) : '')
    setObjectFit(image.object_fit || 'cover')
    setArMode(image.ar_mode == 1)
    setArW(image.ar_w || 16)
    setArH(image.ar_h || 9)
    setArSize(parseFloat(image.ar_size) || 1)
  }

  const save = async () => {
    setSaving(true)
    await fetch(`/api/images.php?id=${image.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        section_id: image.section_id,
        sort_order: image.sort_order,
        col_span: colSpan,
        row_span: rowSpan,
        grid_row: gridRow !== '' ? parseInt(gridRow) : null,
        object_fit: objectFit,
        ar_mode: arMode,
        ar_w: arW,
        ar_h: arH,
        ar_size: arSize,
      }),
    })
    setSaving(false)
    setEditing(false)
    onChanged()
  }

  const deleteImage = async () => {
    setDeleting(true)
    await fetch(`/api/images.php?id=${image.id}`, { method: 'DELETE', credentials: 'include' })
    onChanged()
  }

  const spanBadge = image.ar_mode != 1 && (image.col_span > 1 || image.row_span > 1)
    ? `${image.col_span || 1}×${image.row_span || 1}`
    : null

  return (
    <li className="flex gap-4 px-6 py-4 items-start">
      <img
        src={image.image_path}
        alt={image.title}
        className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
      />
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />

            {/* AR mode toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={arMode}
                onClick={() => setArMode((v) => !v)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${arMode ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${arMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-xs text-gray-600">Aspect ratio mode</span>
              <Tooltip text="When on, replaces the grid span controls with a fixed aspect ratio. The image is placed in its own section below the standard grid so it cannot disrupt other rows." />
            </div>

            {arMode ? (
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-1 text-xs text-gray-600">
                  Size
                  <Tooltip text="Width of the image as a fraction of the full row — 1 is a quarter, 2 is half, 4 is full width. Decimals are supported: e.g. 1.5 is three-eighths." />
                  <input
                    type="number"
                    min={0.1}
                    max={4}
                    step={0.5}
                    value={arSize}
                    onChange={(e) => setArSize(Math.max(0.1, parseFloat(e.target.value) || 1))}
                    className="w-16 border border-gray-300 rounded px-1 py-0.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </label>
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  Ratio
                  <Tooltip text="The aspect ratio displayed in the gallery, as width : height. Examples: 16:9 for widescreen, 4:3 for standard, 2:3 for portrait. The image is cropped or letterboxed based on the Fit setting." />
                </span>
                <input
                  type="number"
                  min={1}
                  value={arW}
                  onChange={(e) => setArW(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 border border-gray-300 rounded px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span className="text-xs text-gray-400">:</span>
                <input
                  type="number"
                  min={1}
                  value={arH}
                  onChange={(e) => setArH(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 border border-gray-300 rounded px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  Fit
                  <Tooltip text="How the thumbnail fills its cell. 'cover' crops to fill (default). 'contain' shows the full image with a background behind it. 'fill' stretches to fit. 'scale-down' is like contain but won't upscale." />
                </span>
                <select
                  value={objectFit}
                  onChange={(e) => setObjectFit(e.target.value)}
                  className="border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="cover">cover</option>
                  <option value="contain">contain</option>
                  <option value="fill">fill</option>
                  <option value="scale-down">scale-down</option>
                  <option value="none">none</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  Grid size
                  <Tooltip text="W sets how many columns this image spans (1 = standard cell, 2 = double-wide). H sets how many rows it spans. A 2×1 image is landscape-shaped; 1×2 is portrait-shaped. Defaults to 1×1." />
                </span>
                <label className="flex items-center gap-1 text-xs text-gray-600">
                  W
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={colSpan}
                    onChange={(e) => setColSpan(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    className="w-12 border border-gray-300 rounded px-1 py-0.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-600">
                  H
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={rowSpan}
                    onChange={(e) => setRowSpan(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                    className="w-12 border border-gray-300 rounded px-1 py-0.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </label>
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  Row
                  <Tooltip text="Assigns this image to a named row group (1, 2, 3…). All images sharing the same row number form one row whose width equals the sum of their W values — useful for images wider than 4 columns. Leave blank to auto-place in the standard grid." />
                </span>
                <input
                  type="number"
                  min={1}
                  placeholder="Auto"
                  value={gridRow}
                  onChange={(e) => setGridRow(e.target.value)}
                  className="w-16 border border-gray-300 rounded px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  Fit
                  <Tooltip text="How the thumbnail fills its cell. 'cover' crops to fill (default). 'contain' shows the full image with a background behind it. 'fill' stretches to fit. 'scale-down' is like contain but won't upscale." />
                </span>
                <select
                  value={objectFit}
                  onChange={(e) => setObjectFit(e.target.value)}
                  className="border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="cover">cover</option>
                  <option value="contain">contain</option>
                  <option value="fill">fill</option>
                  <option value="scale-down">scale-down</option>
                  <option value="none">none</option>
                </select>
                <span className="text-xs text-gray-400">(blank row = auto)</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={cancel}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-800 truncate">{image.title}</p>
              {image.ar_mode == 1 ? (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                  {image.ar_w || 16}:{image.ar_h || 9} ×{parseFloat(image.ar_size) || 1}
                </span>
              ) : (
                spanBadge && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                    {spanBadge}
                  </span>
                )
              )}
              {image.ar_mode != 1 && image.grid_row && (
                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                  row {image.grid_row}
                </span>
              )}
              {image.object_fit && image.object_fit !== 'cover' && (
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                  {image.object_fit}
                </span>
              )}
            </div>
            {image.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{image.description}</p>
            )}
          </>
        )}
      </div>
      {!editing && (
        <div className="flex gap-2 flex-shrink-0 items-center">
          {confirmDelete ? (
            <>
              <span className="text-sm text-gray-600">Delete?</span>
              <button
                onClick={deleteImage}
                disabled={deleting}
                className="text-sm text-red-600 font-medium hover:text-red-800 disabled:opacity-50"
              >
                {deleting ? '…' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                No
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </li>
  )
}
