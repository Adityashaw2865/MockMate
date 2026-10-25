'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { API } from '@/lib/api';
/** Public interview report. Anyone with the link can read it (no login), private notes are not included. */
export default function ReportPage() {
    const { token } = useParams();
    const [r, setR] = useState(null);
    const [err, setErr] = useState('');
    useEffect(() => {
        fetch(`${API}/public/report/${token}`)
            .then(async (res) => { const d = await res.json(); if (!res.ok)
            throw new Error(d.error); setR(d); })
            .catch((e) => setErr(e.message));
    }, [token]);
    if (err)
        return <div className="wrap"><div className="card err">{err}</div></div>;
    if (!r)
        return <div className="wrap"><p className="m">Loading…</p></div>;
    const rows = r.scores
        ? [['Problem solving', r.scores.problemSolving], ['Communication', r.scores.communication], ['Code quality', r.scores.codeQuality]]
        : [];
    return (<div className="wrap" style={{ maxWidth: 620 }}>
      <div className="card">
        <h1>Interview <span className="grad">report</span></h1>
        <p className="m">Room {r.code} · {r.language} · {new Date(r.createdAt).toLocaleDateString()}</p>
        {r.scores ? (<>
          <p><span className="badge">Overall {r.scores.average}/5</span></p>
          {rows.map(([label, v]) => (<div key={label}>
              <div className="score-row"><span>{label}</span><b>{v}/5</b></div>
              <div className="meter"><i style={{ width: `${(v / 5) * 100}%` }}/></div>
            </div>))}
        </>) : <p className="m">No scorecard was saved for this interview.</p>}
        {r.feedback && (<div className="fb">
            <p>{r.feedback.summary}</p>
            <b>Strengths</b><ul>{r.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <b>To improve</b><ul>{r.feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>)}
      </div>
    </div>);
}
