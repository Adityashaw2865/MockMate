'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, token } from '@/lib/api';
/** Session replay: scrub or play back how the code was written. Interviewer only. */
export default function Replay() {
    const { code } = useParams();
    const r = useRouter();
    const [snaps, setSnaps] = useState([]);
    const [i, setI] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [err, setErr] = useState('');
    useEffect(() => {
        if (!token()) {
            r.push('/');
            return;
        }
        api(`/rooms/${code}/snapshots`).then((d) => { setSnaps(d); setI(0); }).catch((e) => setErr(e.message));
    }, [code, r]);
    useEffect(() => {
        if (!playing)
            return;
        const t = setInterval(() => setI((x) => {
            if (x >= snaps.length - 1) {
                setPlaying(false);
                return x;
            }
            return x + 1;
        }), 500);
        return () => clearInterval(t);
    }, [playing, snaps.length]);
    const cur = snaps[i];
    const elapsed = cur && snaps[0] ? Math.round((+new Date(cur.createdAt) - +new Date(snaps[0].createdAt)) / 1000) : 0;
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    return (<div className="wrap" style={{ maxWidth: 820 }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <h1 style={{ flex: 1 }}>Session <span className="grad">replay</span></h1>
        <button onClick={() => r.push('/dashboard')}>← Back</button>
      </div>
      {err && <div className="err">{err}</div>}
      {!err && snaps.length === 0 && <p className="m">No recorded changes for room {code} yet.</p>}
      {cur && (<div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="bar">
            <button className="pri" style={{ width: 80 }} onClick={() => { if (i >= snaps.length - 1)
            setI(0); setPlaying(!playing); }}>{playing ? 'Pause' : 'Play'}</button>
            <input type="range" style={{ margin: 0 }} min={0} max={snaps.length - 1} value={i} onChange={(e) => { setPlaying(false); setI(+e.target.value); }}/>
            <span className="clock" style={{ fontSize: 16 }}>{fmt(elapsed)}</span>
          </div>
          <pre className="out" style={{ minHeight: 360, color: 'var(--sage)' }}>{cur.code}</pre>
        </div>)}
    </div>);
}
