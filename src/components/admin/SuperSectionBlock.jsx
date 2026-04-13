import { useState } from 'react'
import SectionBlock from './SectionBlock.jsx'

export default function SuperSectionBlock({ supersection, sections, supersections, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(supersection.name)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const saveSupersection = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch(`/api/supersections.php?id=${supersection.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setSaving(false)
    setEditing(false)
    onChanged()
  }

  const deleteSupersection = async () => {
    await fetch(`/api/supersections.php?id=${supersection.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    onChanged()
  }

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
      {/* Supersection header */}
      <div className="bg-gray-100 px-6 py-3 flex items-center gap-3">
        {editing ? (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              autoFocus
            />
            <button
              onClick={saveSupersection}
              disabled={saving}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setName(supersection.name) }}
              className="px-3 py-1 bg-white text-gray-700 rounded text-sm hover:bg-gray-50 border border-gray-200"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <h2 className="text-base font-bold text-gray-700 uppercase tracking-wide flex-1">
              {supersection.name}
            </h2>
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Rename
            </button>
            {confirmDelete ? (
              <>
                <span className="text-sm text-gray-600">Delete supersection?</span>
                <button
                  onClick={deleteSupersection}
                  className="text-sm text-red-600 font-medium hover:text-red-800"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  No
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

      {/* Child sections */}
      <div className="divide-y divide-gray-100 bg-white">
        {supersection.sections?.length > 0 ? (
          supersection.sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              sections={sections}
              supersections={supersections}
              onChanged={onChanged}
            />
          ))
        ) : (
          <p className="px-6 py-4 text-sm text-gray-400">
            No sections yet — assign a section to <span className="font-medium">{supersection.name}</span> below.
          </p>
        )}
      </div>
    </div>
  )
}
