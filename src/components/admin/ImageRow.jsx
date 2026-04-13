import { useState } from 'react'

export default function ImageRow({ image, sections, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(image.title)
  const [description, setDescription] = useState(image.description || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const save = async () => {
    setSaving(true)
    await fetch(`/api/images.php?id=${image.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, section_id: image.section_id, sort_order: image.sort_order }),
    })
    setSaving(false)
    setEditing(false)
    onChanged()
  }

  const deleteImage = async () => {
    if (!window.confirm(`Delete "${image.title}"?`)) return
    setDeleting(true)
    await fetch(`/api/images.php?id=${image.id}`, { method: 'DELETE', credentials: 'include' })
    onChanged()
  }

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
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setEditing(false); setTitle(image.title); setDescription(image.description || '') }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-medium text-gray-800 truncate">{image.title}</p>
            {image.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{image.description}</p>
            )}
          </>
        )}
      </div>
      {!editing && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={deleteImage}
            disabled={deleting}
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      )}
    </li>
  )
}
