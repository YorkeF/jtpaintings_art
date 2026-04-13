import { useRef, useState } from 'react'

export default function AddImageForm({ sectionId, onAdded }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef()

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    if (!title) {
      const base = f.name.replace(/\.[^.]+$/, '')
      setTitle(base.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError('')

    try {
      let uploadFile = file
      if (/\.(heic|heif)$/i.test(file.name)) {
        const heic2any = (await import('heic2any')).default
        const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
        const blob = Array.isArray(result) ? result[0] : result
        uploadFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
      }

      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('section_id', sectionId ?? '')
      formData.append('title', title)
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

      if (data.error) {
        setError(data.error)
      } else {
        setFile(null)
        setTitle('')
        setDescription('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        onAdded()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Add image to this section</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        required
        className="block text-sm text-gray-600 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 file:cursor-pointer"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={uploading || !file}
        className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  )
}
