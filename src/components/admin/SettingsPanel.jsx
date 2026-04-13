import { useEffect, useState } from 'react'

export default function SettingsPanel() {
  const [contactEmail, setContactEmail] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings.php', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setContactEmail(d.contact_email ?? '')
        setLoaded(true)
      })
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await fetch('/api/settings.php', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_email: contactEmail }),
    })
    setSaving(false)
    setSaved(true)
  }

  if (!loaded) return null

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Settings</h2>
      <form onSubmit={save} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact form email
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Messages from the contact page will be sent to this address.
          </p>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => { setContactEmail(e.target.value); setSaved(false) }}
            placeholder="you@example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </form>
    </section>
  )
}
