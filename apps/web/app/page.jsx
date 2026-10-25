'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import GoogleButton from '@/components/GoogleButton'

export default function Home() {
  const r = useRouter()
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  // Start with the same value on server and browser, then read the saved login after the page loads.
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setAuthed(!!localStorage.getItem('mm_token'))
    setReady(true)
  }, [])

  function saveSession(d) {
    localStorage.setItem('mm_token', d.token)
    localStorage.setItem('mm_name', d.user.name)
    setAuthed(true)
    setErr('')
    const next = localStorage.getItem('mm_next') // return to the room link the user came from
    if (next) {
      localStorage.removeItem('mm_next')
      r.push(next)
    }
  }
  async function submit() {
    try { saveSession(await api('/auth/' + mode, 'POST', f)) } catch (e) { setErr(e.message) }
  }
  async function google(credential) {
    try { saveSession(await api('/auth/google', 'POST', { credential })) } catch (e) { setErr(e.message) }
  }
  async function create() {
    try {
      const d = await api('/rooms', 'POST', { language: 'javascript' })
      r.push('/room/' + d.code)
    } catch (e) { setErr(e.message) }
  }

  return (
    <div className="wrap"><div className="card">
      <h1>Mock<span className="grad">Mate</span></h1>
      <p className="m">Live code, video call and scorecard in one interview room.</p>
      {!ready ? null : !authed ? (<>
        {mode === 'register' && <input placeholder="Name" onChange={(e) => setF({ ...f, name: e.target.value })} />}
        <input placeholder="Email" onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input placeholder="Password" type="password" onChange={(e) => setF({ ...f, password: e.target.value })} />
        <button className="pri" onClick={submit}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
        <GoogleButton onCredential={google} />
        <p className="m link" style={{ marginTop: 12 }} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </p>
      </>) : (<>
        <button className="pri" onClick={create}>+ New interview room</button>
        <p className="m" style={{ margin: '14px 0 4px' }}>or join with a room code</p>
        <div className="row">
          <input placeholder="ROOM CODE" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <button onClick={() => code && r.push('/room/' + code)}>Join</button>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={() => r.push('/dashboard')}>My interviews</button>
          <button onClick={() => { localStorage.removeItem('mm_token'); setAuthed(false) }}>Log out</button>
        </div>
      </>)}
      {err && <div className="err">{err}</div>}
    </div></div>
  )
}