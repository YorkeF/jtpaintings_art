import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Admin() {
  const [authed, setAuthed] = useState(null) // null = checking

  useEffect(() => {
    fetch('/api/auth?action=check', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAuthed(d.authenticated))
  }, [])

  if (authed === null) return <Loading />
  if (!authed) return <LoginForm onSuccess={() => setAuthed(true)} />
  return <AdminPanel onLogout={() => setAuthed(false)} />
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth?action=login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      onSuccess()
    } else {
      setError('Invalid password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-8 rounded-xl shadow-md w-80 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">Admin Login</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  )
}

// ─── Admin Panel ─────────────────────────────────────────────────────────────

function AdminPanel({ onLogout }) {
  const [sections, setSections] = useState([])
  const [unsectioned, setUnsectioned] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const fileInputRef = useRef()

  const load = () => {
    fetch('/api/sections', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setSections(Array.isArray(d) ? d : []))
    fetch('/api/images', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setUnsectioned(Array.isArray(d) ? d.filter((i) => i.section_id === null) : []))
  }

  useEffect(load, [])

  const logout = async () => {
    await fetch('/api/auth?action=logout', { credentials: 'include' })
    onLogout()
  }

  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setUploading(true)
    setUploadResult(null)

    const formData = new FormData()
    files.forEach((file, i) => {
      formData.append('files[]', file)
      formData.append('paths[]', file.webkitRelativePath || file.name)
    })

    const res = await fetch('/api/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    const data = await res.json()
    setUploading(false)
    setUploadResult(data)
    load()
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">
              ← Gallery
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Admin</h1>
          </div>
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Upload */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Upload Folder</h2>
          <p className="text-sm text-gray-500">
            Select a folder of images. Subfolders become sections. Place a{' '}
            <code className="bg-gray-100 px-1 rounded">.txt</code> file with the same name as an
            image to set its description.
          </p>
          <label className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              webkitdirectory=""
              multiple
              onChange={handleFolderUpload}
              disabled={uploading}
              className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer disabled:opacity-50"
            />
            {uploading && <span className="text-sm text-gray-500 animate-pulse">Uploading…</span>}
          </label>
          {uploadResult && (
            <div className={`text-sm rounded-lg px-4 py-2 ${uploadResult.errors?.length ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
              {uploadResult.inserted} image(s) added.
              {uploadResult.errors?.length > 0 && (
                <ul className="mt-1 list-disc list-inside">
                  {uploadResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Unsectioned images */}
        {unsectioned.length > 0 && (
          <ImageTable
            title="Unsectioned"
            images={unsectioned}
            sections={sections}
            onChanged={load}
          />
        )}

        {/* Sections */}
        {sections.map((section) =>
          section.images?.length > 0 ? (
            <ImageTable
              key={section.id}
              title={section.name}
              images={section.images}
              sections={sections}
              onChanged={load}
            />
          ) : null
        )}

        {sections.length === 0 && unsectioned.length === 0 && (
          <p className="text-center text-gray-400 py-20">No images yet. Upload a folder above.</p>
        )}
      </main>
    </div>
  )
}

// ─── Image Table ──────────────────────────────────────────────────────────────

function ImageTable({ title, images, sections, onChanged }) {
  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {images.map((img) => (
          <ImageRow key={img.id} image={img} sections={sections} onChanged={onChanged} />
        ))}
      </ul>
    </section>
  )
}

function ImageRow({ image, sections, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(image.title)
  const [description, setDescription] = useState(image.description || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const save = async () => {
    setSaving(true)
    await fetch(`/api/images/${image.id}`, {
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
    await fetch(`/api/images/${image.id}`, { method: 'DELETE', credentials: 'include' })
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

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading…
    </div>
  )
}
