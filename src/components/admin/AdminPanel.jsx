import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ImageTable from './ImageTable.jsx'
import SectionBlock from './SectionBlock.jsx'

export default function AdminPanel({ onLogout }) {
  const [sections, setSections] = useState([])
  const [unsectioned, setUnsectioned] = useState([])
  const [progress, setProgress] = useState(null) // null | { stage, label, current, total }
  const [uploadResult, setUploadResult] = useState(null)
  const [newSectionName, setNewSectionName] = useState('')
  const [addingSection, setAddingSection] = useState(false)
  const fileInputRef = useRef()

  const load = () => {
    fetch('/api/sections.php', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setSections(Array.isArray(d) ? d : []))
    fetch('/api/images.php?unsectioned=1', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setUnsectioned(Array.isArray(d) ? d : []))
  }

  useEffect(load, [])

  const logout = async () => {
    await fetch('/api/auth.php?action=logout', { credentials: 'include' })
    onLogout()
  }

  const createSection = async (e) => {
    e.preventDefault()
    if (!newSectionName.trim()) return
    setAddingSection(true)
    await fetch('/api/sections.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSectionName.trim() }),
    })
    setNewSectionName('')
    setAddingSection(false)
    load()
  }

  const handleFolderUpload = async (e) => {
    const rawFiles = Array.from(e.target.files).filter((f) => !f.name.startsWith('.'))
    if (!rawFiles.length) return

    setUploadResult(null)

    try {
      // ── Step 1: Read all .txt files into a description map ────────────────────
      const descMap = {}
      for (const f of rawFiles.filter((f) => /\.txt$/i.test(f.name))) {
        const key = (f.webkitRelativePath || f.name).replace(/\.txt$/i, '').toLowerCase()
        descMap[key] = await f.text()
      }

      // ── Step 2: Collect image files ───────────────────────────────────────────
      const imageFiles = rawFiles.filter((f) => !/\.txt$/i.test(f.name))

      // ── Step 3: Convert HEIC/HEIF → JPEG sequentially ────────────────────────
      const heicFiles = imageFiles.filter((f) => /\.(heic|heif)$/i.test(f.name))
      const heic2any = heicFiles.length > 0 ? (await import('heic2any')).default : null

      const readyImages = []
      let heicDone = 0
      for (const file of imageFiles) {
        if (/\.(heic|heif)$/i.test(file.name)) {
          setProgress({ stage: 'converting', label: file.name, current: ++heicDone, total: heicFiles.length })
          const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
          const blob = Array.isArray(result) ? result[0] : result
          const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
          const newPath = (file.webkitRelativePath || file.name).replace(/\.(heic|heif)$/i, '.jpg')
          readyImages.push({ file: new File([blob], newName, { type: 'image/jpeg' }), path: newPath })
        } else {
          readyImages.push({ file, path: file.webkitRelativePath || file.name })
        }
      }

      // ── Step 4: Upload images one at a time ───────────────────────────────────
      let inserted = 0
      const errors = []

      for (const [i, { file, path }] of readyImages.entries()) {
        setProgress({ stage: 'uploading', label: file.name, current: i + 1, total: readyImages.length })

        const description = descMap[path.replace(/\.[^.]+$/, '').toLowerCase()] ?? ''

        const formData = new FormData()
        formData.append('file', file)
        formData.append('path', path)
        formData.append('description', description)

        const res = await fetch('/api/upload.php', { method: 'POST', credentials: 'include', body: formData })
        const text = await res.text()
        let data
        try {
          data = JSON.parse(text)
        } catch {
          const preview = text.replace(/<[^>]+>/g, ' ').trim().slice(0, 200)
          data = { error: `Server error (HTTP ${res.status})${preview ? ': ' + preview : ''}` }
        }

        if (data.error) errors.push(`${file.name}: ${data.error}`)
        else inserted++
      }

      setUploadResult({ inserted, errors })
      if (inserted > 0) load()
    } catch (err) {
      setUploadResult({ inserted: 0, errors: [`Upload failed: ${err.message}`] })
    } finally {
      setProgress(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
        {/* Folder Upload */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Upload Folder</h2>
          <p className="text-sm text-gray-500">
            Select a folder of images. Subfolders become sections. Place a{' '}
            <code className="bg-gray-100 px-1 rounded">.txt</code> file with the same name as an
            image to set its description.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            webkitdirectory=""
            multiple
            onChange={handleFolderUpload}
            disabled={progress !== null}
            className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer disabled:opacity-50"
          />

          {progress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {progress.stage === 'converting' ? 'Converting' : 'Uploading'}{' '}
                  <span className="font-medium text-gray-700">{progress.label}</span>
                </span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {uploadResult && (
            <div className={`text-sm rounded-lg px-4 py-2 ${
              uploadResult.inserted === 0 && uploadResult.errors?.length
                ? 'bg-red-50 text-red-800'
                : uploadResult.errors?.length
                ? 'bg-yellow-50 text-yellow-800'
                : 'bg-green-50 text-green-800'
            }`}>
              {uploadResult.inserted > 0 && <p>{uploadResult.inserted} image(s) added.</p>}
              {uploadResult.errors?.length > 0 && (
                <ul className="mt-1 list-disc list-inside">
                  {uploadResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
              {uploadResult.inserted === 0 && !uploadResult.errors?.length && (
                <p>No images found in the selected folder.</p>
              )}
            </div>
          )}
        </section>

        {/* New Section */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">New Section</h2>
          <form onSubmit={createSection} className="flex gap-2">
            <input
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Section name"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={addingSection || !newSectionName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {addingSection ? 'Creating…' : 'Create'}
            </button>
          </form>
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
        {sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            sections={sections}
            onChanged={load}
          />
        ))}

        {sections.length === 0 && unsectioned.length === 0 && (
          <p className="text-center text-gray-400 py-20">No images yet. Upload a folder above or create a section.</p>
        )}
      </main>
    </div>
  )
}
