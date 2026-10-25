'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, token } from '@/lib/api';
export default function Dashboard() {
    const r = useRouter();
    const [items, setItems] = useState(null);
    const [err, setErr] = useState('');
    useEffect(() => {
        if (!token()) {
            r.push('/');
            return;
        }
        api('/interviews').then(setItems).catch((e) => setErr(e.message));
    }, [r]);
    return (<div className="wrap" style={{ maxWidth: 760 }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <h1 style={{ flex: 1 }}>My <span className="grad">interviews</span></h1>
        <button onClick={() => r.push('/')}>← Home</button>
      </div>
      {err && <div className="err">{err}</div>}
      {items && items.length === 0 && <p className="m">No interviews yet. Create a room to get started.</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {items?.map((i) => (<div className="card" key={i.code}>
            <div className="row">
              <b style={{ flex: 1 }}>Room {i.code} · {i.language}</b>
              <span className="m" style={{ margin: 0 }}>{new Date(i.createdAt).toLocaleDateString()}</span>
              {i.score !== null && <span className="badge">{i.score}/5</span>}
              <button onClick={() => r.push('/room/' + i.code)}>Open</button>
              <button onClick={() => r.push('/replay/' + i.code)}>Replay</button>
              <button onClick={() => { navigator.clipboard.writeText(location.origin + '/report/' + i.shareToken); }}>Copy report link</button>
            </div>
            {i.notes && <p className="m" style={{ marginTop: 10 }}>Notes: {i.notes}</p>}
            {i.feedback && <p style={{ marginBottom: 0 }}>{i.feedback.summary}</p>}
          </div>))}
      </div>
    </div>);
}
