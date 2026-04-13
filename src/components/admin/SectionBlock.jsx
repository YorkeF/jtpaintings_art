import { useState } from 'react'
import AddImageForm from './AddImageForm.jsx'
import ImageRow from './ImageRow.jsx'

export default function SectionBlock({ section, sections, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(section.name)
  const [saving, setSaving] = useState(false)
  const [showAddImage, setShowAddImage] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const saveSection = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch(`/api/sections.php?id=${section.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setSaving(false)
    setEditing(false)
    onChanged()
  }

  const deleteSection = async (deleteImages) => {
    await fetch(`/api/sections.php?id=${section.id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delete_images: deleteImages }),
    })
    onChanged()
  }

  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        {editing ? (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            <button
              onClick={saveSection}
              disabled={saving}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setName(section.name) }}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-800 flex-1">{section.name}</h2>
            <button
              onClick={() => setShowAddImage((v) => !v)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAddImage ? 'Cancel add' : '+ Add image'}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Rename
            </button>
            {confirmDelete ? (
              <>
                <span className="text-sm text-gray-600">Delete images too?</span>
                <button
                  onClick={() => deleteSection(true)}
                  className="text-sm text-red-600 font-medium hover:text-red-800"
                >
                  Delete all
                </button>
                <button
                  onClick={() => deleteSection(false)}
                  className="text-sm text-yellow-600 font-medium hover:text-yellow-800"
                >
                  Keep unsectioned
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>

      {showAddImage && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <AddImageForm
            sectionId={section.id}
            onAdded={() => { setShowAddImage(false); onChanged() }}
          />
        </div>
      )}

      {section.images?.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {section.images.map((img) => (
            <ImageRow key={img.id} image={img} sections={sections} onChanged={onChanged} />
          ))}
        </ul>
      )}

      {!section.images?.length && !showAddImage && (
        <p className="px-6 py-4 text-sm text-gray-400">No images in this section.</p>
      )}
    </section>
  )
}
