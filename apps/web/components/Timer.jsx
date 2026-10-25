'use client';
import { useEffect, useState } from 'react';
/** Shared countdown. The interviewer starts it; the end time lives in the Yjs doc so everyone sees the same clock. */
export default function Timer({ doc, isHost }) {
    const [end, setEnd] = useState(null);
    const [now, setNow] = useState(Date.now());
    const [mins, setMins] = useState(45);
    useEffect(() => {
        if (!doc)
            return;
        const meta = doc.getMap('meta');
        const read = () => setEnd(meta.get('endsAt') ?? null);
        read();
        meta.observe(read);
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => { meta.unobserve(read); clearInterval(t); };
    }, [doc]);
    const left = end ? Math.max(0, end - now) : null;
    const mm = left !== null ? String(Math.floor(left / 60000)).padStart(2, '0') : '--';
    const ss = left !== null ? String(Math.floor((left % 60000) / 1000)).padStart(2, '0') : '--';
    const urgent = left !== null && left < 5 * 60000;
    return (<div className="row">
      <span className={'clock' + (urgent ? ' urgent' : '')}>{mm}:{ss}</span>
      {left === 0 && <span className="err">Time is up!</span>}
      <span style={{ flex: 1 }}/>
      {isHost && (end ? (<button onClick={() => doc?.getMap('meta').delete('endsAt')}>Stop</button>) : (<>
        <select style={{ width: 90, margin: 0 }} value={mins} onChange={(e) => setMins(+e.target.value)}>
          {[15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
        </select>
        <button onClick={() => doc?.getMap('meta').set('endsAt', Date.now() + mins * 60000)}>Start</button>
      </>))}
    </div>);
}
