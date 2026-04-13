import { useState } from 'react'

export default function ImageRow({ image, sections, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(image.title)
  const [description, setDescription] = useState(image.description || '')
  const [colSpan, setColSpan] = useState(image.col_span || 1)
  const [rowSpan, setRowSpan] = useState(image.row_span || 1)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const cancel = () => {
    setEditing(false)
    setTitle(image.title)
    setDescription(image.description || '')
    setColSpan(image.col_span || 1)
    setRowSpan(image.row_span || 1)
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

  const spanBadge = (image.col_span > 1 || image.row_span > 1)
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
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">Grid size</span>
              <label className="flex items-center gap-1 text-xs text-gray-600">
                W
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={colSpan}
                  onChange={(e) => setColSpan(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
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
              <span className="text-xs text-gray-400">
                (1×1 is default square)
              </span>
            </div>
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
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-800 truncate">{image.title}</p>
              {spanBadge && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                  {spanBadge}
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
