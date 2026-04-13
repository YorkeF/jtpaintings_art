import { useEffect, useState } from 'react'
import Loading from '../components/Loading.jsx'
import LoginForm from '../components/admin/LoginForm.jsx'
import AdminPanel from '../components/admin/AdminPanel.jsx'

export default function Admin() {
  const [authed, setAuthed] = useState(null) // null = checking

  useEffect(() => {
    fetch('/api/auth.php?action=check', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAuthed(d.authenticated))
  }, [])

  if (authed === null) return <Loading />
  if (!authed) return <LoginForm onSuccess={() => setAuthed(true)} />
  return <AdminPanel onLogout={() => setAuthed(false)} />
}
