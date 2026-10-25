'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
/** Interviewer-only: send the room link to the candidate by email. */
export default function InviteForm({ code }) {
    const [email, setEmail] = useState('');
    const [msg, setMsg] = useState('');
    async function send() {
        setMsg('Sending…');
        try {
            await api(`/rooms/${code}/invite`, 'POST', { email });
            setMsg('Invite sent ✓');
            setEmail('');
        }
        catch (e) {
            setMsg(e.message);
        }
    }
    return (<div style={{ marginTop: 10 }}>
      <div className="row">
        <input style={{ margin: 0 }} type="email" placeholder="Candidate email" value={email} onChange={(e) => setEmail(e.target.value)}/>
        <button onClick={send} disabled={!email}>Invite</button>
      </div>
      {msg && <p className="m" style={{ margin: '6px 0 0', fontSize: 13 }}>{msg}</p>}
    </div>);
}
